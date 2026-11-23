import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyMerchant } from "@/lib/orders/commerce";

/** Sign-in URL that returns the merchant to where they were going. */
export const merchantSignInHref = (path: string) => `/orders/sign-in?next=${encodeURIComponent(path)}`;

type SessionState = "loading" | "in" | "out";

/**
 * Guard decision. A cached "no store" result is never trusted while a fresh
 * lookup is running, so a merchant who just signed in isn't sent to setup.
 */
export function merchantGuardDecision(s: {
  session: SessionState;
  isPending: boolean;
  isFetching: boolean;
  hasMerchant: boolean;
}): "sign-in" | "loading" | "setup" | "dashboard" {
  if (s.session === "out") return "sign-in";
  if (s.session === "loading" || s.isPending) return "loading";
  if (s.hasMerchant) return "dashboard";
  return s.isFetching ? "loading" : "setup";
}

/** Dashboard pages require a signed-in owner with a store; never show sample data. */
export default function RequireMerchant({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [session, setSession] = useState<SessionState>("loading");
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ? "in" : "out"));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ? "in" : "out"));
    return () => data.subscription.unsubscribe();
  }, []);
  const merchant = useMyMerchant();

  const decision = merchantGuardDecision({
    session,
    isPending: merchant.isPending,
    isFetching: merchant.isFetching,
    hasMerchant: !!merchant.data,
  });
  if (decision === "sign-in") return <Navigate replace to={merchantSignInHref(location.pathname)} />;
  if (decision === "loading") {
    return <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Loading your dashboard"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (decision === "setup") return <Navigate replace to="/orders/get-started" />;
  return <>{children}</>;
}
