import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Designation = { official: boolean; product_name: string | null; verified_at: string | null };

/** Read-only, server-decided designation. Never derived from app settings or spaces.json. */
export function useDesignation(appId?: string) {
  const [d, setD] = useState<Designation | null>(null);
  useEffect(() => {
    if (!appId) return;
    supabase.rpc("spaces_app_designation", { _app_id: appId }).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      setD(row ? { official: !!row.official, product_name: row.product_name, verified_at: row.verified_at } : { official: false, product_name: null, verified_at: null });
    });
  }, [appId]);
  return d;
}

/** Keys that customers might use to claim official status; always ignored. */
export const DESIGNATION_KEYS = ["official", "verified", "officialLoumilab", "loumilabOfficial", "designation", "verification"];
export function stripDesignationClaims<T extends Record<string, unknown>>(m: T): { manifest: T; stripped: string[] } {
  const stripped = Object.keys(m).filter((k) => DESIGNATION_KEYS.includes(k));
  const out = { ...m };
  for (const k of stripped) delete out[k];
  return { manifest: out, stripped };
}
