import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Wordmark from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { adminNav } from "@/components/admin/adminNav";
import { useAdminCounts } from "@/lib/admin/queries";
import { ExternalLink, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminSidebar = ({ email }: { email: string | null }) => {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { data: counts } = useAdminCounts();
  const navigate = useNavigate();

  const isActive = (url: string, match?: string[]) =>
    pathname === url || (match ?? []).some((m) => pathname.startsWith(m));

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="px-3 py-4">
        <Link to="/admin/overview" className="flex items-center gap-2 overflow-hidden">
          <Wordmark size="sm" className={cn(collapsed && "hidden")} />
          <span
            className={cn(
              "font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground",
              collapsed && "hidden",
            )}
          >
            Admin
          </span>
          {collapsed && <span className="font-display text-lg font-bold">L</span>}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {adminNav.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const badge = item.badge?.(counts);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url, item.match)} tooltip={item.title}>
                        <NavLink to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                          {!collapsed && badge !== undefined && (
                            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                              {badge}
                            </span>
                          )}
                          {!collapsed && item.tag && (
                            <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {item.tag}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-border px-3 py-4">
        {!collapsed && (
          <>
            <p className="truncate text-xs text-muted-foreground">{email ?? "Signed in"}</p>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </a>
          </>
        )}
        <Button variant="outline" size="sm" onClick={signOut} className="w-full justify-center">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

interface AdminShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

const AdminShell = ({ title, description, actions, children }: AdminShellProps) => {
  const [email, setEmail] = useState<string | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const refresh = () => {
    qc.invalidateQueries();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-surface-subtle">
        <AdminSidebar email={email} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-hero text-xl font-semibold tracking-tight lg:text-2xl">{title}</h1>
              {description && (
                <p className="truncate text-xs text-muted-foreground lg:text-sm">{description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Button variant="ghost" size="sm" onClick={refresh} aria-label="Refresh data">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminShell;
