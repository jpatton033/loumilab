import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowUpRight, ArrowRight } from "lucide-react";
import { productGroups } from "@/data/products";
import Wordmark from "@/components/brand/Wordmark";


const navLinks = [
  { label: "Services", to: "/services" },
  { label: "Work", to: "/work" },
  { label: "About", to: "/about" },
  { label: "Insights", to: "/insights" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mobileProducts, setMobileProducts] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setProductsOpen(false);
    setMobileProducts(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!productsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProductsOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setProductsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [productsOpen]);

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const productsActive = location.pathname.startsWith("/products") || location.pathname.startsWith("/orders");

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled || productsOpen
          ? "border-b border-border bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent bg-background/60 backdrop-blur-sm"
      }`}
    >
      <div className="section-container flex h-16 items-center justify-between lg:h-20">
        <Link to="/" onClick={handleLogoClick} className="flex items-center" aria-label="Loumilab home">
          <Wordmark size="sm" />
        </Link>


        {/* Desktop */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          <Link
            to="/services"
            className={`text-sm font-medium transition-colors ${
              location.pathname === "/services" ? "text-accent" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Services
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-expanded={productsOpen}
              aria-haspopup="true"
              onClick={() => setProductsOpen((v) => !v)}
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm ${
                productsActive || productsOpen ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Products
              <ChevronDown size={14} className={`transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>

            {productsOpen && (
              <div
                role="menu"
                className="absolute left-1/2 top-full w-[min(92vw,720px)] -translate-x-1/2 pt-4"
              >
                <div className="grid gap-8 rounded-3xl border border-border bg-popover p-8 shadow-[var(--shadow-lift)] sm:grid-cols-2">
                  {productGroups.map((group) => (
                    <div key={group.id}>
                      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="mt-4 space-y-2">
                        {group.items.map((p) =>
                          p.external ? (
                            <a
                              key={p.id}
                              href={p.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              role="menuitem"
                              className="group block rounded-2xl p-3 transition-colors hover:bg-secondary"
                            >
                              <span className="flex items-center gap-1.5 font-display font-semibold">
                                {p.name}
                                <ArrowUpRight size={14} className="text-muted-foreground" />
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">{p.tagline}</span>
                            </a>
                          ) : (
                            <Link
                              key={p.id}
                              to={p.href}
                              role="menuitem"
                              className="group block rounded-2xl p-3 transition-colors hover:bg-secondary"
                            >
                              <span className="flex items-center gap-1.5 font-display font-semibold">
                                {p.name}
                                <ArrowRight size={14} className="text-muted-foreground" />
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">{p.tagline}</span>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="sm:col-span-2 border-t border-border pt-5">
                    <Link
                      to="/products"
                      role="menuitem"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent"
                    >
                      View the full ecosystem <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button variant="default" size="lg" asChild>
            <Link to="/contact">Start a Project</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="p-2 text-foreground lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-border bg-background lg:hidden [-webkit-overflow-scrolling:touch]"
          aria-label="Mobile"
        >
          <div className="section-container flex flex-col gap-1 py-6">
            <Link to="/services" className="py-3 text-base font-medium">
              Services
            </Link>

            <button
              type="button"
              onClick={() => setMobileProducts((v) => !v)}
              aria-expanded={mobileProducts}
              className="flex items-center justify-between py-3 text-left text-base font-medium"
            >
              Products
              <ChevronDown size={16} className={`transition-transform ${mobileProducts ? "rotate-180" : ""}`} />
            </button>
            {mobileProducts && (
              <div className="mb-2 space-y-4 rounded-2xl bg-secondary p-4">
                {productGroups.map((group) => (
                  <div key={group.id}>
                    <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="mt-2 space-y-2">
                      {group.items.map((p) =>
                        p.external ? (
                          <a
                            key={p.id}
                            href={p.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm font-medium"
                          >
                            {p.name} <ArrowUpRight size={13} className="text-muted-foreground" />
                          </a>
                        ) : (
                          <Link key={p.id} to={p.href} className="flex items-center gap-1.5 text-sm font-medium">
                            {p.name} <ArrowRight size={13} className="text-muted-foreground" />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                ))}
                <Link to="/products" className="block text-sm font-semibold text-accent">
                  View the full ecosystem
                </Link>
              </div>
            )}

            {navLinks.slice(1).map((link) => (
              <Link key={link.to} to={link.to} className="py-3 text-base font-medium">
                {link.label}
              </Link>
            ))}

            <Button variant="default" size="lg" asChild className="mt-4">
              <Link to="/contact">Start a Project</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
