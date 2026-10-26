import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowUpRight, ArrowRight, LogIn, LogOut, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Wordmark from "@/components/brand/Wordmark";
import { navDirectLinks, navMenus, type NavLinkItem } from "@/data/navigation";

const MenuLink = ({ item, compact }: { item: NavLinkItem; compact?: boolean }) => {
  const body = (
    <>
      <span className="flex items-center gap-1.5 font-display text-sm font-medium text-foreground">
        {item.label}
        {item.external ? <ArrowUpRight size={13} className="text-muted-foreground" /> : null}
      </span>
      {!compact && item.desc && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.desc}</span>}
    </>
  );
  const cls = compact ? "block py-1.5" : "block rounded-xl px-3 py-2 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none";
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
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => { if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const hoverOpen = (id: string) => (e: React.PointerEvent) => { if (e.pointerType !== "mouse") return; cancelClose(); setOpenMenu(id); };
  const hoverLeave = (e: React.PointerEvent) => { if (e.pointerType !== "mouse") return; cancelClose(); closeTimer.current = window.setTimeout(() => setOpenMenu(null), 150); };
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const id = openMenu; setOpenMenu(null);
      document.getElementById(`menu-btn-${id}`)?.focus();
    };
    const onClick = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [openMenu]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

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
    <header className={`fixed left-0 right-0 top-0 z-50 transition-[border-color,background-color] duration-200 ${scrolled || openMenu ? "border-b border-border bg-background/95 backdrop-blur-sm" : "border-b border-transparent bg-background"}`}>
      <div className="section-container flex h-16 items-center lg:h-[72px]">
        <Link to="/" onClick={handleLogoClick} className="flex items-center" aria-label="Loumilab home">
          <Wordmark size="sm" animated={animateLogo} className={logoAnimationComplete ? "brand-wordmark-complete" : undefined} onAnimationComplete={completeLogoAnimation} />
        </Link>

        <nav ref={navRef} className="ml-10 hidden h-full items-center gap-1 lg:flex xl:ml-12" aria-label="Main">
          {navMenus.map((menu) => {
            const expanded = openMenu === menu.id;
            const wide = menu.groups.length > 1;
            return (
              <div key={menu.id} className="relative flex h-full items-center" onPointerEnter={hoverOpen(menu.id)} onPointerLeave={hoverLeave}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-haspopup="true"
                  id={`menu-btn-${menu.id}`}
                  aria-controls={`menu-${menu.id}`}
                  onClick={() => { cancelClose(); setOpenMenu(expanded ? null : menu.id); }}
                  onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpenMenu(menu.id); requestAnimationFrame(() => document.querySelector<HTMLElement>(`#menu-${menu.id} [role=menuitem]`)?.focus()); } }}
                  className={`relative inline-flex items-center gap-1 rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive(menu.match) || expanded ? "text-foreground" : "text-foreground/65 hover:text-foreground"}`}
                >
                  {menu.label}
                  <ChevronDown size={13} strokeWidth={1.75} className={`opacity-60 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                  {isActive(menu.match) && <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />}
                </button>
                {expanded && (
                  <div id={`menu-${menu.id}`} role="menu" className={`absolute top-full -mt-2 pt-2 animate-in fade-in-0 slide-in-from-top-1 duration-200 motion-reduce:animate-none ${wide ? "left-0 w-[min(92vw,640px)]" : "left-0 w-[320px]"}`}>
                    <div className="rounded-2xl border border-border bg-popover p-3 shadow-[var(--shadow-lift)]">
                      <div className={`grid gap-4 ${wide ? "sm:grid-cols-2" : ""}`}>
                        {menu.groups.map((g) => (
                          <div key={g.label}>
                            <p className="px-3 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
                            <div className="mt-2 space-y-0.5">{g.items.map((i) => <MenuLink key={i.to} item={i} />)}</div>
                          </div>
                        ))}
                      </div>
                      {menu.footer && (
                        <div className="mt-3 border-t border-border px-3 pb-1 pt-3">
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
            <Link key={l.to} to={l.to} className={`relative rounded-md px-3 py-2 text-[0.9375rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${location.pathname === l.to ? "text-foreground" : "text-foreground/65 hover:text-foreground"}`}>{l.label}{location.pathname === l.to && <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />}</Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Account" className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground/65 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <UserRound size={18} strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              {user ? (
                <>
                  {user.email && <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild><Link to="/sign-in"><LogIn className="mr-2 h-4 w-4" /> Sign in</Link></DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="h-10 rounded-lg bg-accent px-4 text-[0.9375rem] font-medium text-accent-foreground hover:bg-accent/90">
            <Link to="/contact">Start a Project</Link>
          </Button>
        </div>

        <button className="-mr-2 ml-auto inline-flex h-11 w-11 items-center justify-center text-foreground lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav">
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
                          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
                          <div className="mt-1">{g.items.map((i) => <MenuLink key={i.to} item={i} compact />)}</div>
                        </div>
                      ))}
                      {menu.footer && <Link to={menu.footer.to} className="block text-sm font-semibold text-accent">{menu.footer.label}</Link>}
                    </div>
                  )}
                </div>
              );
            })}
            {navDirectLinks.map((l) => <Link key={l.to} to={l.to} className="flex min-h-11 items-center text-base font-medium">{l.label}</Link>)}
            <Link to="/contact" className="flex min-h-11 items-center text-base font-medium">Contact</Link>
            {user ? (
              <button type="button" onClick={handleSignOut} className="flex items-center gap-2 py-3 text-base font-medium text-muted-foreground"><LogOut size={18} /> Sign out</button>
            ) : (
              <Link to="/sign-in" className="flex items-center gap-2 py-3 text-base font-medium text-accent"><LogIn size={18} /> Sign in</Link>
            )}
            <Button size="lg" asChild className="mt-4 w-full rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/contact">Start a Project</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
