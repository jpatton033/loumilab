import { useEffect, useState, type ReactNode } from "react";
import { Routes, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { legacyPath, type CustomerKind } from "@/lib/siteAddress";

/** On <name>.loumilab.com, renders that customer's site by matching the old route internally. */
export default function CustomerSite({ slug, children }: { slug: string; children: ReactNode }) {
  const loc = useLocation();
  const [kind, setKind] = useState<CustomerKind | null | undefined>(undefined);
  useEffect(() => {
    supabase.rpc("resolve_customer_slug", { _slug: slug }).then(({ data }) => setKind((data as CustomerKind | null) ?? null));
  }, [slug]);
  if (kind === undefined) return null;
  // Non-root paths (receipts, sign-in…) keep working as normal routes on the subdomain.
  const pathname = loc.pathname === "/" ? legacyPath(kind ?? "store", slug) : loc.pathname;
  return <Routes location={{ ...loc, pathname }}>{children}</Routes>;
}
