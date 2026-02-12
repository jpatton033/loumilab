import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  return (
    <Layout>
      <section className="section-padding pt-32 lg:pt-40 min-h-[70vh] flex items-center">
        <div className="section-container w-full max-w-md mx-auto">
          <h1 className="text-3xl font-semibold mb-2 text-center">Admin Login</h1>
          <p className="text-muted-foreground text-center mb-8">Sign in to access the admin dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@loumilab.com"
                required
                className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-secondary/50 border-border/50 focus:border-accent focus:ring-accent/20"
              />
            </div>
            <Button variant="accent" size="lg" type="submit" className="w-full glow-hover" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"} <LogIn size={16} />
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
