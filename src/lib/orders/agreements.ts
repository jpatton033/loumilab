import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AGREEMENT_VERSION } from "@/data/orders/legal";

/**
 * Merchant acceptance of the Loumilab Orders Terms & Conditions and Privacy
 * Policy. Records are append-only: one row per document per version, so there
 * is a durable record of exactly what was agreed and when.
 */

export const AGREEMENTS_QUERY_KEY = ["orders", "agreements"] as const;

export type AgreementDocument = "terms" | "privacy";

export interface AgreementStatus {
  /** No signed-in user — we can't know yet. */
  signedIn: boolean;
  /** Current version of both documents accepted. */
  accepted: boolean;
  acceptedAt: string | null;
  version: string;
}

export const useAgreementStatus = () =>
  useQuery({
    queryKey: AGREEMENTS_QUERY_KEY,
    queryFn: async (): Promise<AgreementStatus> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        return { signedIn: false, accepted: false, acceptedAt: null, version: AGREEMENT_VERSION };
      }

      const { data, error } = await supabase
        .from("merchant_agreements")
        .select("document, version, accepted_at")
        .eq("user_id", user.id)
        .eq("version", AGREEMENT_VERSION);
      if (error) throw error;

      const documents = new Set((data ?? []).map((row) => row.document));
      return {
        signedIn: true,
        accepted: documents.has("terms") && documents.has("privacy"),
        acceptedAt: (data ?? [])[0]?.accepted_at ?? null,
        version: AGREEMENT_VERSION,
      };
    },
    staleTime: 60_000,
  });

export const useAcceptAgreements = (merchantId?: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Sign in to agree to the terms.");

      const rows: AgreementDocument[] = ["terms", "privacy"];
      const { error } = await supabase.from("merchant_agreements").upsert(
        rows.map((document) => ({
          user_id: user.id,
          merchant_id: merchantId ?? null,
          document,
          version: AGREEMENT_VERSION,
        })),
        { onConflict: "user_id,document,version", ignoreDuplicates: true },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: AGREEMENTS_QUERY_KEY }),
  });
};
