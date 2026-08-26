import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, Mail, KeyRound, ArrowRight, Loader2 } from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : null;
  const defaultTab = modeParam === "signup" ? "signup" : modeParam === "forgot" ? "forgot" : "signin";


  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await routeByRole(data.user.id);
      } else {
        setCheckingSession(false);
      }
    };
    check();
  }, []);

  const routeByRole = async (userId: string) => {
    if (nextPath) {
      navigate(nextPath, { replace: true });
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles?.some((r: { role: string }) => r.role === "admin")) {
      navigate("/admin/overview", { replace: true });
    } else {
      navigate("/orders/dashboard", { replace: true });
    }
  };


  const validatePassword = (value: string) => {
    if (value.length < 10) {
      toast({ title: "Password too short", description: "Use at least 10 characters.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error || !data.user) {
      toast({ title: "Sign in failed", description: error?.message || "Please try again.", variant: "destructive" });
      return;
    }

    await routeByRole(data.user.id);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(password)) return;
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Re-enter the same password twice.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName.trim() || email.split("@")[0] },
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }

    if (data.session) {
      // Auto-confirmed or already signed in.
      if (data.user) await routeByRole(data.user.id);
      return;
    }

    setConfirmed(true);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${nextPath ?? ""}` },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Enter your email", description: "We need your email to send the reset link.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Couldn't send reset link", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Check your email",
      description: "If an account exists for that address, a password reset link is on its way.",
    });
  };

  if (checkingSession) {
    return (
      <Layout>
        <SEOHead title="Sign In — Loumilab" description="Sign in to your Loumilab account." path="/sign-in" noindex />
        <section className="section-padding flex min-h-[70vh] items-center pt-32 lg:pt-40">
          <div className="section-container mx-auto w-full max-w-md text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="mt-3 text-sm">Checking session…</p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead title="Sign In — Loumilab" description="Sign in to your Loumilab account." path="/sign-in" noindex />
      <section className="section-padding flex min-h-[70vh] items-center pt-32 lg:pt-40">
        <div className="section-container mx-auto w-full max-w-md">
          <h1 className="mb-2 text-center text-3xl font-semibold">Loumilab Account</h1>
          <p className="mb-8 text-center text-muted-foreground">
            Manage your Orders dashboards and preferences.
          </p>

          {confirmed ? (
            <div className="rounded-3xl border border-border bg-background p-8 text-center shadow-[var(--shadow-card)]">
              <Mail className="mx-auto h-8 w-8 text-accent" />
              <h2 className="mt-4 text-xl font-semibold">Confirm your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Open it to activate your account, then sign in.
              </p>
              <Button className="mt-6 w-full" onClick={() => { setConfirmed(false); setTab("signin"); }}>
                Back to sign in <ArrowRight size={16} />
              </Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-secondary p-1">
                <TabsTrigger value="signin" className="rounded-xl text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Create account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@loumilab.com"
                      autoComplete="username"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      autoComplete="current-password"
                      required
                      className="bg-background"
                    />
                  </div>
                  <Button size="lg" type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"} <LogIn size={16} />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setTab("forgot")}
                    className="mx-auto block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Display name</label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name or business"
                      autoComplete="name"
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@loumilab.com"
                      autoComplete="username"
                      required
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Password</label>
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
                  <Button size="lg" type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create account"} <KeyRound size={16} />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="forgot" className="mt-6">
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground/80">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@loumilab.com"
                      autoComplete="username"
                      required
                      className="bg-background"
                    />
                  </div>
                  <Button size="lg" type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"} <Mail size={16} />
                  </Button>
                  <button
                    type="button"
                    onClick={() => setTab("signin")}
                    className="mx-auto block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    Back to sign in
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!confirmed && tab !== "forgot" && (
            <div className="mt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button variant="outline" size="lg" className="w-full" onClick={handleGoogle} disabled={loading}>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </Button>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Admins: use the{" "}
            <a href="/login" className="underline-offset-2 transition-colors hover:text-accent hover:underline">
              admin portal
            </a>
            .
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default SignIn;
