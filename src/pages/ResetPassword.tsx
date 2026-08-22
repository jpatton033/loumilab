import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 10) {
      toast({ title: "Password too short", description: "Use at least 10 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Re-enter the same password twice.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Password set", description: "You can now sign in with your new password." });
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Layout>
      <SEOHead
        title="Set your password — Loumilab"
        description="Set a new password for your Loumilab admin account."
        path="/reset-password"
        noindex
      />
      <section className="section-padding flex min-h-[70vh] items-center pt-32 lg:pt-40">
        <div className="section-container mx-auto w-full max-w-md">
          <h1 className="mb-2 text-center text-3xl font-semibold">Set your password</h1>
          <p className="mb-8 text-center text-muted-foreground">
            {ready
              ? "Choose a new password for your Loumilab account."
              : "Open this page from the password reset link in your email."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground/80">New password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                autoComplete="new-password"
                required
                disabled={!ready}
                className="bg-background"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground/80">Confirm password</label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••••"
                autoComplete="new-password"
                required
                disabled={!ready}
                className="bg-background"
              />
            </div>
            <Button size="lg" type="submit" className="w-full" disabled={!ready || saving}>
              {saving ? "Saving…" : "Save password"} <KeyRound size={16} />
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default ResetPassword;
