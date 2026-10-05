import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** One row per sign-in account, from the staff-gated admin_merchant_directory RPC. */
export interface DirectoryRaw {
  user_id: string;
  account_email: string | null;
  signup_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  display_name: string | null;
  merchant_id: string | null;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  relationship: "owner" | "manager" | null;
  plan_slug: string | null;
  accepting_orders: boolean | null;
  store_name: string | null;
  store_slug: string | null;
  store_status: string | null;
  is_published: boolean | null;
  listing_slug: string | null;
  is_listed: boolean | null;
  listing_ownership: string | null;
  public_phone: string | null;
  public_email: string | null;
  website_url: string | null;
  listing_city: string | null;
  listing_region: string | null;
  payout_status: string | null;
  subscribed: boolean;
  suppressed: boolean;
}

export type Product = "Local" | "Orders" | "Both" | "None yet";
export type Stage = "Account only" | "Business added" | "Listing drafted" | "Store set up" | "Payouts ready" | "Live";
export const STAGES: Stage[] = ["Account only", "Business added", "Listing drafted", "Store set up", "Payouts ready", "Live"];

export interface DirectoryRow extends DirectoryRaw {
  name: string | null;
  product: Product;
  stage: Stage;
  place: string | null;
  listingStatus: string;
  storeStatus: string;
  marketing: "Subscribed" | "Not subscribed" | "Unsubscribed";
}

const enrich = (r: DirectoryRaw): DirectoryRow => {
  const hasStore = !!r.store_slug;
  const hasListing = !!r.listing_slug;
  const product: Product = hasStore && hasListing ? "Both" : hasStore ? "Orders" : hasListing ? "Local" : "None yet";
  const live = hasStore && !!r.is_published && !!r.accepting_orders;
  const stage: Stage = !r.merchant_id
    ? "Account only"
    : live
      ? "Live"
      : r.payout_status === "payout_enabled"
        ? "Payouts ready"
        : hasStore
          ? "Store set up"
          : hasListing
            ? r.is_listed ? "Live" : "Listing drafted"
            : "Business added";
  const city = r.city ?? r.listing_city;
  const region = r.region ?? r.listing_region;
  return {
    ...r,
    name: r.contact_name || r.display_name,
    product,
    stage,
    place: [city, region].filter(Boolean).join(", ") || null,
    listingStatus: !hasListing ? "—" : r.is_listed ? "Listed" : "Draft",
    storeStatus: !hasStore ? "—" : live ? "Live" : r.is_published ? "Paused" : (r.store_status ?? "Setup"),
    marketing: r.suppressed ? "Unsubscribed" : r.subscribed ? "Subscribed" : "Not subscribed",
  };
};

export const useMerchantDirectory = () =>
  useQuery({
    queryKey: ["admin", "merchant-directory"],
    queryFn: async (): Promise<DirectoryRow[]> => {
      const { data, error } = await supabase.rpc("admin_merchant_directory" as never);
      if (error) throw error;
      return ((data ?? []) as unknown as DirectoryRaw[]).map(enrich);
    },
  });

export const relationshipLabel = (r: DirectoryRaw["relationship"]) =>
  r === "owner" ? "Owner" : r === "manager" ? "Authorized representative" : "Unknown";

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const directoryCsv = (rows: DirectoryRow[]) => {
  const head = ["contact_name", "business_name", "account_email", "business_phone", "city_state", "product", "relationship", "signup_date", "email_verified", "onboarding", "local_listing", "orders_store", "marketing", "last_sign_in"];
  const body = rows.map((r) => [
    r.name, r.business_name ?? "Business not added", r.account_email, r.phone, r.place, r.product,
    relationshipLabel(r.relationship), r.signup_at, r.email_confirmed_at ? "yes" : "no", r.stage,
    r.listingStatus, r.storeStatus, r.marketing, r.last_sign_in_at,
  ]);
  return [head, ...body].map((row) => row.map(csvCell).join(",")).join("\n");
};
