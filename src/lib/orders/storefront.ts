import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { StoreProduct } from "@/data/orders/storefronts";

/**
 * Live storefront data: published stores, their catalog, and the token-based
 * public views for receipts, quotes and invoices.
 *
 * Prices here are for display only. Every charge is recomputed server-side by
 * the `orders-checkout` / `orders-invoice-checkout` edge functions.
 */

export interface LiveStorefront {
  id: string;
  merchant_id: string;
  slug: string;
  name: string;
  location: string | null;
  description: string | null;
  monogram: string | null;
  logo_url: string | null;
  hours: string | null;
  pickup_enabled: boolean;
  pickup_info: string | null;
  delivery_enabled: boolean;
  delivery_fee_cents: number;
  delivery_minimum_cents: number;
  currency: string;
  is_published: boolean;
}

export interface LiveProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  category: string | null;
  availability: "available" | "sold_out" | "unavailable";
  is_active: boolean;
  display_order: number;
}

const STORE_COLUMNS =
  "id, merchant_id, slug, name, location, description, monogram, logo_url, hours, pickup_enabled, pickup_info, delivery_enabled, delivery_fee_cents, delivery_minimum_cents, currency, is_published";

const PRODUCT_COLUMNS =
  "id, name, description, price_cents, image_url, category, availability, is_active, display_order";

/** Maps a database product onto the shared storefront card shape. */
export const toStoreProduct = (p: LiveProduct): StoreProduct => ({
  id: p.id,
  name: p.name,
  description: p.description ?? "",
  priceCents: p.price_cents,
  image: p.image_url ?? undefined,
  availability: p.availability,
});

export interface PublicStore {
  store: LiveStorefront;
  products: LiveProduct[];
  industrySlug: string;
  acceptingOrders: boolean;
}

/** A published storefront by slug, with its catalog. */
export const usePublicStorefront = (slug?: string) =>
  useQuery({
    queryKey: ["orders", "storefront", slug],
    enabled: !!slug,
    queryFn: async (): Promise<PublicStore | null> => {
      const { data: store, error } = await supabase
        .from("merchant_storefronts")
        .select(STORE_COLUMNS)
        .eq("slug", slug as string)
        .maybeSingle()
        .returns<LiveStorefront | null>();
      if (error) throw error;
      if (!store) return null;

      const [{ data: products }, { data: merchant }] = await Promise.all([
        supabase
          .from("merchant_products")
          .select(PRODUCT_COLUMNS)
          .eq("storefront_id", store.id)
          .eq("is_active", true)
          .order("display_order")
          .returns<LiveProduct[]>(),
        supabase
          .from("merchants")
          .select("industry_slug, accepting_orders")
          .eq("id", store.merchant_id)
          .maybeSingle()
          .returns<{ industry_slug: string; accepting_orders: boolean } | null>(),
      ]);

      return {
        store,
        products: products ?? [],
        industrySlug: merchant?.industry_slug ?? "food-catering",
        acceptingOrders: merchant?.accepting_orders ?? false,
      };
    },
  });

/* ------------------------------ checkout ---------------------------------- */

export interface CheckoutInput {
  slug: string;
  items: { product_id: string; quantity: number }[];
  customer: { name: string; email: string; phone?: string };
  fulfilment: "pickup" | "delivery";
  delivery_address?: string;
  notes?: string;
  tip_cents?: number;
}

const invoke = async <T>(fn: string, body: unknown): Promise<T> => {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    const message = (data as { error?: string } | null)?.error;
    throw new Error(typeof message === "string" ? message : error.message);
  }
  const payload = data as { error?: string } & T;
  if (payload && typeof payload.error === "string") throw new Error(payload.error);
  return payload as T;
};

/** Creates the order and returns a Stripe Checkout URL. */
export const startStorefrontCheckout = (input: CheckoutInput) =>
  invoke<{ url: string; order_token: string }>("orders-checkout", {
    ...input,
    returnUrl: window.location.origin,
  });

export const startInvoicePayment = (token: string, email?: string) =>
  invoke<{ url: string }>("orders-invoice-checkout", {
    token,
    email,
    returnUrl: window.location.origin,
  });

/* --------------------------- public token views --------------------------- */

export interface PublicOrder {
  id: string;
  reference: string | null;
  status: string;
  customer_name: string;
  customer_email: string;
  fulfilment: "pickup" | "delivery";
  delivery_address: string | null;
  currency: string;
  subtotal_cents: number;
  delivery_fee_cents: number;
  tip_cents: number;
  tax_cents: number;
  total_cents: number;
  created_at: string;
  paid_at: string | null;
  store_name?: string;
  store_slug?: string;
  items: { name: string; quantity: number; unit_price_cents: number; line_total_cents: number }[];
}

export const useOrderByToken = (token?: string) =>
  useQuery({
    queryKey: ["orders", "receipt", token],
    enabled: !!token,
    refetchInterval: (query) =>
      (query.state.data as PublicOrder | null)?.status === "pending" ? 3000 : false,
    queryFn: async (): Promise<PublicOrder | null> => {
      const { data, error } = await supabase.rpc("get_order_by_token", { _token: token as string });
      if (error) throw error;
      return (data as unknown as PublicOrder) ?? null;
    },
  });

export interface PublicQuote {
  id: string;
  status: string;
  title: string;
  message: string | null;
  line_items: { description: string; quantity: number; unit_price_cents: number }[];
  subtotal_cents: number;
  deposit_cents: number;
  expires_at: string | null;
  created_at: string;
  business_name?: string;
}

export const useQuoteByToken = (token?: string) =>
  useQuery({
    queryKey: ["orders", "quote", token],
    enabled: !!token,
    queryFn: async (): Promise<PublicQuote | null> => {
      const { data, error } = await supabase.rpc("get_quote_by_token", { _token: token as string });
      if (error) throw error;
      return (data as unknown as PublicQuote) ?? null;
    },
  });

export interface PublicInvoice {
  id: string;
  kind: string;
  status: string;
  amount_cents: number;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  business_name?: string;
  job_title?: string | null;
}

export const useInvoiceByToken = (token?: string) =>
  useQuery({
    queryKey: ["orders", "invoice", token],
    enabled: !!token,
    queryFn: async (): Promise<PublicInvoice | null> => {
      const { data, error } = await supabase.rpc("get_invoice_by_token", { _token: token as string });
      if (error) throw error;
      return (data as unknown as PublicInvoice) ?? null;
    },
  });

/** Customer approves or declines a quote from its public link. */
export const useRespondToQuote = (token?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (approve: boolean) => {
      const { data, error } = await supabase.rpc("respond_to_quote", {
        _token: token as string,
        _approve: approve,
      });
      if (error) throw error;
      return data as unknown as { invoice_token?: string; status?: string } | null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders", "quote", token] }),
  });
};

export const formatCents = (cents: number, currency = "USD") =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: currency.toUpperCase() });
