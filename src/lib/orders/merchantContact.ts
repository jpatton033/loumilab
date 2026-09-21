import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * The merchant's own business contact and mailing address. Row-level security
 * scopes reads and writes to the merchant record the signed-in user owns
 * (staff may also read and correct it from the admin portal).
 */

export interface MerchantContact {
  contact_name: string | null;
  contact_email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
}

const FIELDS =
  "contact_name, contact_email, phone, address_line1, address_line2, city, region, postal_code, country";

export const useMerchantContact = (merchantId?: string | null) =>
  useQuery({
    queryKey: ["orders", "merchant-contact", merchantId],
    enabled: !!merchantId,
    queryFn: async (): Promise<MerchantContact | null> => {
      const { data, error } = await supabase
        .from("merchants")
        .select(FIELDS)
        .eq("id", merchantId!)
        .maybeSingle()
        .returns<MerchantContact | null>();
      if (error) throw error;
      return data ?? null;
    },
  });

export const useSaveMerchantContact = (merchantId?: string | null) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MerchantContact) => {
      if (!merchantId) throw new Error("No merchant record yet.");
      const orNull = (v: string | null) => {
        const t = (v ?? "").trim();
        return t ? t : null;
      };
      const email = (input.contact_email ?? "").trim();
      if (!email) throw new Error("Add the best email for order and account notices.");

      const { error } = await supabase
        .from("merchants")
        .update({
          contact_name: orNull(input.contact_name),
          contact_email: email,
          phone: orNull(input.phone),
          address_line1: orNull(input.address_line1),
          address_line2: orNull(input.address_line2),
          city: orNull(input.city),
          region: orNull(input.region),
          postal_code: orNull(input.postal_code),
          country: orNull(input.country) ?? "US",
        })
        .eq("id", merchantId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders", "merchant-contact", merchantId] });
      void qc.invalidateQueries({ queryKey: ["orders", "my-merchant"] });
    },
  });
};

/** True when the merchant has not given us a street address yet. */
export const addressMissing = (c?: MerchantContact | null) =>
  !c?.address_line1 || !c?.city || !c?.postal_code;
