import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Minimum Help Desk support level (1 viewer, 2 specialist, 3 admin) that may
   * open this page. When omitted, only full Loumilab admins are allowed.
   * This is a convenience gate; the data itself is enforced server-side.
   */
  supportLevel?: number;
}

const ProtectedRoute = ({ children, supportLevel }: ProtectedRouteProps) => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      let ok = false;
      if (supportLevel) {
        const { data } = await (supabase.rpc as any)("support_level", { _uid: user.id });
        ok = (Number(data) || 0) >= supportLevel;
      } else {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        ok = !!roles?.some((r: { role: string }) => r.role === "admin");
      }
      if (ok) setAuthorized(true);
      else navigate("/login", { replace: true });
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/login", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, supportLevel]);

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

export default ProtectedRoute;
