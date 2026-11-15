import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { parsePortal, PORTALS } from "@/lib/portal";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Loader2 } from "lucide-react";

const SignOut = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const portal = parsePortal(params.get("portal"));
  const qc = useQueryClient();
  const [status, setStatus] = useState("Signing you out…");

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
      qc.clear();
      try { localStorage.removeItem("spaces.ws"); } catch { /* storage unavailable */ }
      setStatus("You've been signed out of all Loumilab products.");
      setTimeout(() => navigate(portal ? `/${portal}/sign-in` : "/", { replace: true }), 900);
    };
    signOut();
  }, [navigate, portal, qc]);

  return (
    <Layout>
      <SEOHead title="Sign Out — Loumilab" description="Sign out of your Loumilab account." path="/sign-out" noindex />
      <section className="section-padding flex min-h-[70vh] items-center pt-16 lg:pt-20">
        <div className="section-container mx-auto w-full max-w-md text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
          <p className="mt-4 text-muted-foreground">{status}</p>
        </div>
      </section>
    </Layout>
  );
};

export default SignOut;
