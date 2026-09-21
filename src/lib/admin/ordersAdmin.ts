import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live data behind the Super Admin Orders section. Every figure here comes from
 * the real tables — the "live merchant" definition matches
 * src/lib/admin/queries.ts and the Daily Brief merchants collector: a published
 * storefront that is currently accepting orders.
 */

export const ORDERS_WINDOW_DAYS = 30;

export interface MerchantContactInput {
  contactName: string;
  contactEmail: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface AdminMerchantRow {
  id: string;
  businessName: string;
  contactName: string | null;
  contactEmail: string;
  phone: string | null;
  ownerName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  planSlug: string;
  acceptingOrders: boolean;
  createdAt: string;
  storefrontName: string | null;
  storefrontSlug: string | null;
  storefrontLocation: string | null;
  isPublished: boolean;
  isLive: boolean;
  payoutStatus: string | null;
  livemode: boolean | null;
  subscriptionStatus: string | null;
}

export interface AdminOrderRow {
  id: string;
  reference: string | null;
  customerName: string;
  status: string;
  fulfilment: string;
  totalCents: number;
  platformFeeCents: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  livemode: boolean;
  merchantName: string;
}

export interface AdminPlanRow {
  slug: string;
  name: string;
  priceLabel: string | null;
  monthlyPriceCents: number | null;
  platformFeeBps: number | null;
  feeLabel: string | null;
  isActive: boolean;
  merchantCount: number;
}

export interface AdminOrdersSnapshot {
  merchants: AdminMerchantRow[];
  orders: AdminOrderRow[];
  plans: AdminPlanRow[];
  totals: {
    merchantsLive: number;
    merchantsTotal: number;
    paidOrdersWindow: number;
    grossSalesWindowCents: number;
    platformFeeWindowCents: number;
    paidOrdersAllTime: number;
    activeSubscriptions: number;
    testOrders: number;
  };
  mode: "live" | "test" | "mixed" | "none";
}

const PAID_STATUSES = new Set([
  "paid",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
]);

export const useAdminOrdersSnapshot = () =>
  useQuery({
    queryKey: ["admin", "orders-snapshot"],
    staleTime: 30_000,
    queryFn: async (): Promise<AdminOrdersSnapshot> => {
      const [merchantsRes, storefrontsRes, accountsRes, subsRes, ordersRes, plansRes] = await Promise.all([
        supabase
          .from("merchants")
          .select(
            "id, owner_id, business_name, contact_name, contact_email, phone, address_line1, address_line2, city, region, postal_code, country, plan_slug, accepting_orders, created_at",
          ),
        supabase
          .from("merchant_storefronts")
          .select("merchant_id, name, slug, location, is_published")
          .order("created_at", { ascending: true }),
        supabase.from("merchant_stripe_accounts").select("merchant_id, payout_status, livemode"),
        supabase.from("merchant_subscriptions").select("merchant_id, status"),
        supabase
          .from("orders")
          .select(
            "id, merchant_id, reference, customer_name, status, fulfilment, total_cents, platform_fee_cents, currency, created_at, paid_at, livemode",
          )
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("orders_plans")
          .select("slug, name, price_label, monthly_price_cents, platform_fee_bps, fee_label, is_active, display_order")
          .order("display_order", { ascending: true }),
      ]);

      for (const res of [merchantsRes, storefrontsRes, accountsRes, subsRes, ordersRes, plansRes]) {
        if (res.error) throw res.error;
      }

      const storefrontByMerchant = new Map<string, (typeof storefrontsRes.data)[number]>();
      (storefrontsRes.data ?? []).forEach((s) => {
        const existing = storefrontByMerchant.get(s.merchant_id);
        // Prefer a published storefront when a merchant has more than one.
        if (!existing || (!existing.is_published && s.is_published)) storefrontByMerchant.set(s.merchant_id, s);
      });

      const accountByMerchant = new Map((accountsRes.data ?? []).map((a) => [a.merchant_id, a]));
      const subByMerchant = new Map((subsRes.data ?? []).map((s) => [s.merchant_id, s]));

      const merchants: AdminMerchantRow[] = (merchantsRes.data ?? [])
        .map((m) => {
          const store = storefrontByMerchant.get(m.id);
          const account = accountByMerchant.get(m.id);
          const isPublished = Boolean(store?.is_published);
          return {
            id: m.id,
            businessName: m.business_name,
            planSlug: m.plan_slug,
            acceptingOrders: m.accepting_orders,
            createdAt: m.created_at,
            storefrontName: store?.name ?? null,
            storefrontSlug: store?.slug ?? null,
            storefrontLocation: store?.location ?? null,
            isPublished,
            isLive: isPublished && m.accepting_orders,
            payoutStatus: account?.payout_status ?? null,
            livemode: account?.livemode ?? null,
            subscriptionStatus: subByMerchant.get(m.id)?.status ?? null,
          };
        })
        .sort((a, b) => Number(b.isLive) - Number(a.isLive) || a.businessName.localeCompare(b.businessName));

      const merchantNames = new Map(merchants.map((m) => [m.id, m.businessName]));

      const orders: AdminOrderRow[] = (ordersRes.data ?? []).map((o) => ({
        id: o.id,
        reference: o.reference,
        customerName: o.customer_name,
        status: o.status,
        fulfilment: o.fulfilment,
        totalCents: o.total_cents,
        platformFeeCents: o.platform_fee_cents ?? 0,
        currency: o.currency,
        createdAt: o.created_at,
        paidAt: o.paid_at,
        livemode: o.livemode,
        merchantName: merchantNames.get(o.merchant_id) ?? "Merchant",
      }));

      const windowStart = Date.now() - ORDERS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const paid = orders.filter((o) => PAID_STATUSES.has(o.status) || o.paidAt);
      const paidInWindow = paid.filter((o) => new Date(o.paidAt ?? o.createdAt).getTime() >= windowStart);

      const planCounts = new Map<string, number>();
      merchants.forEach((m) => planCounts.set(m.planSlug, (planCounts.get(m.planSlug) ?? 0) + 1));

      const plans: AdminPlanRow[] = (plansRes.data ?? []).map((p) => ({
        slug: p.slug,
        name: p.name,
        priceLabel: p.price_label,
        monthlyPriceCents: p.monthly_price_cents,
        platformFeeBps: p.platform_fee_bps,
        feeLabel: p.fee_label,
        isActive: p.is_active,
        merchantCount: planCounts.get(p.slug) ?? 0,
      }));

      const liveAccounts = (accountsRes.data ?? []).filter((a) => a.livemode).length;
      const testAccounts = (accountsRes.data ?? []).length - liveAccounts;

      return {
        merchants,
        orders,
        plans,
        totals: {
          merchantsLive: merchants.filter((m) => m.isLive).length,
          merchantsTotal: merchants.length,
          paidOrdersWindow: paidInWindow.length,
          grossSalesWindowCents: paidInWindow.reduce((sum, o) => sum + o.totalCents, 0),
          platformFeeWindowCents: paidInWindow.reduce((sum, o) => sum + o.platformFeeCents, 0),
          paidOrdersAllTime: paid.length,
          activeSubscriptions: (subsRes.data ?? []).filter((s) => s.status === "active" || s.status === "trialing")
            .length,
          testOrders: orders.filter((o) => !o.livemode).length,
        },
        mode:
          (accountsRes.data ?? []).length === 0
            ? "none"
            : liveAccounts && testAccounts
              ? "mixed"
              : liveAccounts
                ? "live"
                : "test",
      };
    },
  });

export const PAYOUT_STATUS_LABELS: Record<string, string> = {
  not_started: "Payments not started",
  onboarding: "Finishing payment setup",
  pending_verification: "Awaiting verification",
  restricted: "Restricted",
  payout_enabled: "Payouts enabled",
  disabled: "Payouts disabled",
};
