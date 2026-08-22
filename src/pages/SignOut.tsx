import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Loader2 } from "lucide-react";

const SignOut = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Signing you out…");

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
      setStatus("You have been signed out.");
      setTimeout(() => navigate("/", { replace: true }), 800);
    };
    signOut();
  }, [navigate]);

  return (
    <Layout>
      <SEOHead title="Sign Out — Loumilab" description="Sign out of your Loumilab account." path="/sign-out" noindex />
      <section className="section-padding flex min-h-[70vh] items-center pt-32 lg:pt-40">
        <div className="section-container mx-auto w-full max-w-md text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
          <p className="mt-4 text-muted-foreground">{status}</p>
        </div>
      </section>
    </Layout>
  );
};

export default SignOut;
