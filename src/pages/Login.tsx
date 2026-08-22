import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { LogIn, Mail } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      // Check if user has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (roles?.some((r: { role: string }) => r.role === "admin")) {
          navigate("/admin");
        } else {
          toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
          await supabase.auth.signOut();
        }
      }
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setMode("signin");
  };

  return (
    <Layout>
      <SEOHead
        title="Admin Login — Loumilab | Technology Studio for Digital Products"
        description="Sign in to the Loumilab admin dashboard."
        path="/login"
        noindex
      />
      <section className="section-padding flex min-h-[70vh] items-center pt-32 lg:pt-40">
        <div className="section-container mx-auto w-full max-w-md">
          <h1 className="mb-2 text-center text-3xl font-semibold">
            {mode === "signin" ? "Admin Login" : "Reset password"}
          </h1>
          <p className="mb-8 text-center text-muted-foreground">
            {mode === "signin"
              ? "Sign in to access the admin dashboard"
              : "We'll email you a secure link to set a new password"}
          </p>

          {mode === "signin" ? (
            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="bg-background"
                />
              </div>
              <Button size="lg" type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"} <LogIn size={16} />
              </Button>
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="mx-auto block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                Forgot password?
              </button>
            </form>
          ) : (
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
                {loading ? "Sending..." : "Send reset link"} <Mail size={16} />
              </Button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="mx-auto block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Login;
