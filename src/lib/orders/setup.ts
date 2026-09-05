import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePayoutStatus } from "@/lib/orders/connect";


/**
 * One source of truth for "how far along is this merchant?".
 *
 * The onboarding wizard, the dashboard setup card and the publish control all
 * read from here, so a merchant never sees two different answers. Publishing
 * requirements are also enforced in the database, this is the friendly mirror.
 */

export type StorefrontStatus = "setup" | "ready" | "published" | "paused" | "restricted";

/** The address customers use. Always canonical, so a shared link never breaks. */
export const STORE_ORIGIN = "https://loumilab.com";

/** In-app route for the storefront (preview or live). */
export const storePath = (slug: string) => `/orders/store/${slug}`;

/** Full, shareable customer URL for a storefront. */
export const storeUrl = (slug: string) => `${STORE_ORIGIN}${storePath(slug)}`;

/** Wizard step index for each setup task, so "Finish" lands in the right place. */
export const SETUP_STEP_INDEX: Record<SetupStepId, number> = {
  account: 0,
  business: 4,
  branding: 4,
  catalog: 5,
  fulfilment: 6,
  payments: 7,
  publish: 9,
};

export const STATUS_LABELS: Record<StorefrontStatus, string> = {
  setup: "Setup incomplete",
  ready: "Ready to publish",
  published: "Published",
  paused: "Paused",
  restricted: "Needs attention",
};

export const STATUS_DESCRIPTIONS: Record<StorefrontStatus, string> = {
  setup: "Your store isn't public yet. Finish the steps below to launch.",
  ready: "Everything's in place. Publish whenever you're ready to take orders.",
  published: "Your store is live and customers can order from your link.",
  paused: "You've paused your store. Customers can't place new orders right now.",
  restricted: "Payouts need attention before your store can be public again.",
};


export type SetupStepId =
  | "account"
  | "business"
  | "branding"
  | "catalog"
  | "fulfilment"
  | "payments"
  | "publish";

export interface SetupTask {
  id: SetupStepId;
  label: string;
  detail: string;
  done: boolean;
  /** Where the merchant goes to finish it. */
  href: string;
  /** Required before the store can be published. */
  required: boolean;
}

export interface SetupSnapshot {
  merchantId: string | null;
  storefrontId: string | null;
  slug: string | null;
  status: StorefrontStatus;
  tasks: SetupTask[];
  completed: number;
  total: number;
  /** Every required task is done — the merchant may publish. */
  canPublish: boolean;
  payoutStatus: string;
  isPublic: boolean;
}

interface SetupSource {
  merchant: { id: string; business_name: string; contact_email: string; industry_slug: string } | null;
  storefront: {
    id: string;
    slug: string;
    status: StorefrontStatus;
    description: string | null;
    location: string | null;
    hours: string | null;
    logo_url: string | null;
    monogram: string | null;
    pickup_enabled: boolean;
    delivery_enabled: boolean;
  } | null;
  catalogCount: number;
  payoutStatus: string;
}

const emptySnapshot: SetupSnapshot = {
  merchantId: null,
  storefrontId: null,
  slug: null,
  status: "setup",
  tasks: [],
  completed: 0,
  total: 0,
  canPublish: false,
  payoutStatus: "not_started",
  isPublic: false,
};

export const buildSnapshot = (source: SetupSource, catalogLabel = "items"): SetupSnapshot => {
  const { merchant, storefront, catalogCount, payoutStatus } = source;
  const status: StorefrontStatus = storefront?.status ?? "setup";
  const payoutsReady = payoutStatus === "payout_enabled";

  const tasks: SetupTask[] = [
    {
      id: "account",
      label: "Merchant account",
      detail: merchant ? merchant.business_name : "Register your business with Loumilab Orders.",
      done: !!merchant,
      href: "/orders/get-started?step=0",
      required: true,
    },
    {
      id: "business",
      label: "Store details",
      detail: storefront?.description
        ? "Name, city and description are set."
        : "Tell customers who you are and what you offer.",
      done: !!storefront && !!storefront.description?.trim(),
      href: "/orders/get-started?step=4",
      required: true,
    },
    {
      id: "branding",
      label: "Store branding",
      detail: storefront?.logo_url ? "Your logo is in place." : "Add a logo so your store looks like you.",
      done: !!storefront?.logo_url,
      href: "/orders/get-started?step=4",
      required: false,
    },
    {
      id: "catalog",
      label: `What you sell`,
      detail:
        catalogCount > 0
          ? `${catalogCount} ${catalogLabel.toLowerCase()} added.`
          : `Add at least one of your ${catalogLabel.toLowerCase()}.`,
      done: catalogCount > 0,
      href: "/orders/dashboard",
      required: true,
    },
    {
      id: "fulfilment",
      label: "How customers get it",
      detail:
        storefront?.pickup_enabled || storefront?.delivery_enabled
          ? "Pickup and delivery preferences are set."
          : "Choose pickup, delivery or both.",
      done: !!(storefront?.pickup_enabled || storefront?.delivery_enabled),
      href: "/orders/get-started?step=6",
      required: true,
    },
    {
      id: "payments",
      label: "Payments & payouts",
      detail: payoutsReady
        ? "Payouts are active — you'll get paid automatically."
        : payoutStatus === "not_started"
          ? "Connect payments securely through Stripe."
          : "A few details are still needed before payouts start.",
      done: payoutsReady,
      href: "/orders/dashboard",
      required: true,
    },
    {
      id: "publish",
      label: "Publish your store",
      detail:
        status === "published"
          ? "Your store is live."
          : "Go live when you're happy with your preview.",
      done: status === "published",
      href: "/orders/dashboard",
      required: false,
    },
  ];

  const required = tasks.filter((t) => t.required && t.id !== "publish");

  return {
    merchantId: merchant?.id ?? null,
    storefrontId: storefront?.id ?? null,
    slug: storefront?.slug ?? null,
    status,
    tasks,
    completed: tasks.filter((t) => t.done).length,
    total: tasks.length,
    canPublish: required.every((t) => t.done) && status !== "restricted",
    payoutStatus,
    isPublic: status === "published",
  };
};

/**
 * Live setup snapshot for the signed-in merchant. The payments step reads the
 * shared, Stripe-synced payout status so this checklist and the Payments &
 * payouts panel always tell the merchant the same thing.
 */
export const useMerchantSetup = (catalogLabel = "items") => {
  const { data: payouts } = usePayoutStatus();
  const livePayoutStatus = payouts?.account?.payout_status ?? null;

  return useQuery({
    queryKey: ["orders", "setup", livePayoutStatus],

    queryFn: async (): Promise<SetupSnapshot> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return emptySnapshot;

      const { data: merchant } = await supabase
        .from("merchants")
        .select("id, business_name, contact_email, industry_slug")
        .eq("owner_id", auth.user.id)
        .maybeSingle();

      if (!merchant) return { ...emptySnapshot, tasks: buildSnapshot({ merchant: null, storefront: null, catalogCount: 0, payoutStatus: "not_started" }, catalogLabel).tasks };

      const [{ data: storefront }, { data: account }] = await Promise.all([
        supabase
          .from("merchant_storefronts")
          .select(
            "id, slug, status, description, location, hours, logo_url, monogram, pickup_enabled, delivery_enabled",
          )
          .eq("merchant_id", merchant.id)
          .order("created_at")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("merchant_stripe_accounts")
          .select("payout_status")
          .eq("merchant_id", merchant.id)
          .maybeSingle(),
      ]);

      let catalogCount = 0;
      if (storefront?.id) {
        const [{ count: products }, { count: services }] = await Promise.all([
          supabase
            .from("merchant_products")
            .select("id", { count: "exact", head: true })
            .eq("storefront_id", storefront.id)
            .eq("is_active", true),
          supabase
            .from("merchant_services")
            .select("id", { count: "exact", head: true })
            .eq("merchant_id", merchant.id)
            .eq("is_active", true),
        ]);
        catalogCount = (products ?? 0) + (services ?? 0);
      }

      return buildSnapshot(
        {
          merchant: merchant as SetupSource["merchant"],
          storefront: (storefront ?? null) as SetupSource["storefront"],
          catalogCount,
          payoutStatus: livePayoutStatus ?? account?.payout_status ?? "not_started",
        },
        catalogLabel,
      );
    },
  });
};


/** Publish, pause or resume the merchant's storefront. */
export const useSetStorefrontStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StorefrontStatus }) => {
      const { error } = await supabase.from("merchant_storefronts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
