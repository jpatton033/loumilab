import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyMerchant } from "@/lib/orders/commerce";

/** Sign-in URL that returns the merchant to where they were going. */
export const merchantSignInHref = (path: string) => `/orders/sign-in?next=${encodeURIComponent(path)}`;

/** Dashboard pages require a signed-in owner with a store; never show sample data. */
export default function RequireMerchant({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [session, setSession] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ? "in" : "out"));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ? "in" : "out"));
    return () => data.subscription.unsubscribe();
  }, []);
  const merchant = useMyMerchant();

  if (session === "out") return <Navigate replace to={merchantSignInHref(location.pathname)} />;
  if (session === "loading" || merchant.isLoading) {
    return <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading your dashboard"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!merchant.data) return <Navigate replace to="/orders/get-started" />;
  return <>{children}</>;
}
