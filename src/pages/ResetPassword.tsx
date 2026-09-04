import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";

type Status = "checking" | "ready" | "invalid";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });

    const bootstrap = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const errorDescription = url.searchParams.get("error_description") || hash.get("error_description");
      if (errorDescription) {
        // A recovery session may already exist from an earlier successful exchange.
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setStatus(data.session ? "ready" : "invalid");
        return;
      }


      // PKCE / code-based recovery links
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          setStatus(error ? "invalid" : "ready");
          if (!error) window.history.replaceState({}, "", "/reset-password");
        }
        return;
      }

      // Implicit hash links (#access_token=...&type=recovery)
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!cancelled) {
          setStatus(error ? "invalid" : "ready");
          if (!error) window.history.replaceState({}, "", "/reset-password");
        }
        return;
      }

      // OTP-style links (?token_hash=...&type=recovery)
      const tokenHash = url.searchParams.get("token_hash") || hash.get("token_hash");
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
        if (!cancelled) {
          setStatus(error ? "invalid" : "ready");
          if (!error) window.history.replaceState({}, "", "/reset-password");
        }
        return;
      }

      // Already-established recovery session
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setStatus(data.session ? "ready" : "invalid");
    };

    bootstrap();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
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

    if (error) {
      setSaving(false);
      toast({ title: "Couldn't update password", description: error.message, variant: "destructive" });
      return;
    }

    // Decide where to send them back before clearing the session.
    let destination = "/sign-in";
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (roles?.some((r: { role: string }) => r.role === "admin")) destination = "/login";
    }

    setSaving(false);
    toast({ title: "Password set", description: "You can now sign in with your new password." });
    await supabase.auth.signOut();
    navigate(destination, { replace: true });
  };

  return (
    <Layout>
      <SEOHead
        title="Set your password — Loumilab | Technology Studio for Digital Products"
        description="Set a new password for your Loumilab account."
        path="/reset-password"
        noindex
      />
      <section className="section-padding flex min-h-[70vh] items-center pt-32 lg:pt-40">
        <div className="section-container mx-auto w-full max-w-md">
          {status === "checking" ? (
            <div className="text-center text-muted-foreground">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-3 text-sm">Verifying your reset link…</p>
            </div>
          ) : status === "invalid" ? (
            <div className="rounded-3xl border border-border bg-background p-8 text-center shadow-[var(--shadow-card)]">
              <AlertCircle className="mx-auto h-8 w-8 text-accent" />
              <h1 className="mt-4 text-2xl font-semibold">Link expired or invalid</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Password reset links can only be used once and expire after a short time. Request a new one and open the
                latest email.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild size="lg">
                  <Link to="/sign-in?mode=forgot">Request a new link</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">Admin portal</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-center text-3xl font-semibold">Set your password</h1>
              <p className="mb-8 text-center text-muted-foreground">
                Choose a new password for your Loumilab account.
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
                    className="bg-background"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">At least 10 characters.</p>
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
                    className="bg-background"
                  />
                </div>
                <Button size="lg" type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving…" : "Save password"} <KeyRound size={16} />
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ResetPassword;
