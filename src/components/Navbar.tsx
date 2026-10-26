import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowUpRight, ArrowRight, LogIn, LogOut } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";
import { navDirectLinks, navMenus, type NavLinkItem } from "@/data/navigation";

const MenuLink = ({ item, compact }: { item: NavLinkItem; compact?: boolean }) => {
  const body = (
    <>
      <span className="flex items-center gap-1.5 font-display text-sm font-semibold text-foreground">
        {item.label}
        {item.external ? <ArrowUpRight size={13} className="text-muted-foreground" /> : null}
      </span>
      {!compact && item.desc && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.desc}</span>}
    </>
  );
  const cls = compact ? "block py-1.5" : "block rounded-2xl px-3 py-2.5 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none";
  return item.external ? (
    <a href={item.to} target="_blank" rel="noopener noreferrer" role={compact ? undefined : "menuitem"} className={cls}>{body}</a>
  ) : (
    <Link to={item.to} role={compact ? undefined : "menuitem"} className={cls}>{body}</Link>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [animateLogo] = useState(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as { __loumilabLogoPlayed?: boolean };
    if (w.__loumilabLogoPlayed) return false;
    w.__loumilabLogoPlayed = true;
    return true;
  });
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(!animateLogo);

  useEffect(() => {
    const w = window as unknown as { __loumilabLogoAnimationComplete?: boolean };
    if (!animateLogo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLogoAnimationComplete(true);
      w.__loumilabLogoAnimationComplete = true;
      window.dispatchEvent(new Event("loumilab:logo-complete"));
      return;
    }
    w.__loumilabLogoAnimationComplete = false;
    const fallback = window.setTimeout(() => {
      setLogoAnimationComplete(true);
      w.__loumilabLogoAnimationComplete = true;
      window.dispatchEvent(new Event("loumilab:logo-complete"));
    }, 4300);
    return () => window.clearTimeout(fallback);
  }, [animateLogo]);

  const completeLogoAnimation = () => {
    const w = window as unknown as { __loumilabLogoAnimationComplete?: boolean };
    setLogoAnimationComplete(true);
    if (w.__loumilabLogoAnimationComplete) return;
    w.__loumilabLogoAnimationComplete = true;
    window.dispatchEvent(new Event("loumilab:logo-complete"));
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setOpenMenu(null); setMobileMenu(null); }, [location.pathname]);

  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(null); };
    const onClick = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [openMenu]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ? { id: data.user.id, email: data.user.email } : null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      else if (event === "SIGNED_OUT") setUser(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); navigate("/", { replace: true }); };
  const handleLogoClick = () => { if (location.pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" }); };
  const isActive = (match: string[]) => match.some((m) => location.pathname.startsWith(m));

  return (
    <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled || openMenu ? "border-b border-border bg-background/95" : "border-b border-transparent bg-background/80"}`}>
      <div className="section-container flex h-16 items-center justify-between lg:h-20">
        <Link to="/" onClick={handleLogoClick} className="flex items-center" aria-label="Loumilab home">
          <Wordmark size="sm" animated={animateLogo} className={logoAnimationComplete ? "brand-wordmark-complete" : undefined} onAnimationComplete={completeLogoAnimation} />
        </Link>

        <nav ref={navRef} className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {navMenus.map((menu) => {
            const expanded = openMenu === menu.id;
            const wide = menu.groups.length > 1;
            return (
              <div key={menu.id} className="relative">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-haspopup="true"
                  aria-controls={`menu-${menu.id}`}
                  onClick={() => setOpenMenu(expanded ? null : menu.id)}
                  className={`inline-flex items-center gap-1 rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isActive(menu.match) || expanded ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {menu.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && (
                  <div id={`menu-${menu.id}`} role="menu" className={`absolute top-full pt-4 animate-in fade-in-0 slide-in-from-top-1 duration-200 ${wide ? "left-1/2 w-[min(92vw,680px)] -translate-x-1/2" : "left-0 w-[320px]"}`}>
                    <div className="rounded-3xl border border-border bg-popover p-5 shadow-[var(--shadow-lift)]">
                      <div className={`grid gap-6 ${wide ? "sm:grid-cols-2" : ""}`}>
                        {menu.groups.map((g) => (
                          <div key={g.label}>
                            <p className="px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">{g.label}</p>
                            <div className="mt-2 space-y-0.5">{g.items.map((i) => <MenuLink key={i.to} item={i} />)}</div>
                          </div>
                        ))}
                      </div>
                      {menu.footer && (
                        <div className="mt-4 border-t border-border px-3 pt-4">
                          <Link to={menu.footer.to} role="menuitem" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent">
                            {menu.footer.label} <ArrowRight size={14} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {navDirectLinks.map((l) => (
            <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors ${location.pathname === l.to ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}>{l.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:bg-transparent hover:text-foreground">
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:bg-transparent hover:text-foreground">
              <Link to="/sign-in"><LogIn className="mr-1.5 h-4 w-4" /> Sign in</Link>
            </Button>
          )}
          <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/contact">Start a Project</Link>
          </Button>
        </div>

        <button className="p-2 text-foreground lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-border bg-background lg:hidden">
          <div className="section-container flex flex-col gap-1 py-6">
            {navMenus.map((menu) => {
              const expanded = mobileMenu === menu.id;
              return (
                <div key={menu.id}>
                  <button type="button" onClick={() => setMobileMenu(expanded ? null : menu.id)} aria-expanded={expanded} className="flex min-h-11 w-full items-center justify-between py-3 text-left text-base font-medium">
                    {menu.label}
                    <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="mb-2 space-y-4 rounded-2xl bg-secondary p-4">
                      {menu.groups.map((g) => (
                        <div key={g.label}>
                          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-accent">{g.label}</p>
                          <div className="mt-1">{g.items.map((i) => <MenuLink key={i.to} item={i} compact />)}</div>
                        </div>
                      ))}
                      {menu.footer && <Link to={menu.footer.to} className="block text-sm font-semibold text-accent">{menu.footer.label}</Link>}
                    </div>
                  )}
                </div>
              );
            })}
            {navDirectLinks.map((l) => <Link key={l.to} to={l.to} className="py-3 text-base font-medium">{l.label}</Link>)}
            <Link to="/contact" className="py-3 text-base font-medium">Contact</Link>
            {user ? (
              <button type="button" onClick={handleSignOut} className="flex items-center gap-2 py-3 text-base font-medium text-muted-foreground"><LogOut size={18} /> Sign out</button>
            ) : (
              <Link to="/sign-in" className="flex items-center gap-2 py-3 text-base font-medium text-accent"><LogIn size={18} /> Sign in</Link>
            )}
            <Button size="lg" asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/contact">Start a Project</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
