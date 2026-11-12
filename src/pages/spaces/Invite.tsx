import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSessionUser } from "@/lib/spaces/client";

export default function SpacesInvite() {
  const { token = "" } = useParams();
  const user = useSessionUser();
  const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  if (user === null) return <Navigate to={`/sign-in?next=/spaces/invite/${token}`} replace />;
  const accept = async () => {
    const { data, error } = await supabase.rpc("spaces_accept_invite", { _token: token });
    if (error) return setErr(error.message);
    localStorage.setItem("spaces.ws", data as string);
    nav("/spaces/app");
  };
  return (
    <Layout>
      <SEOHead title="Join a workspace | Loumilab Spaces" description="Accept a Loumilab Spaces invite." path="/spaces/invite" noindex />
      <section className="section-padding pt-36"><div className="section-container max-w-xl text-center">
        <h1 className="font-hero text-5xl font-semibold tracking-tight text-foreground">Join the workspace.</h1>
        <p className="mt-4 text-muted-foreground">Signed in as {user?.email}. The invite must match this email.</p>
        {err && <p className="mt-6 text-destructive">{err}</p>}
        <div className="mt-8 flex justify-center gap-3"><Button size="lg" onClick={accept} disabled={!user}>Accept invite</Button><Button size="lg" variant="outline" asChild><Link to="/spaces">Not now</Link></Button></div>
      </div></section>
    </Layout>
  );
}
