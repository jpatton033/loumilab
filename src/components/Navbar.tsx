import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Services", to: "/services" },
  { label: "How We Work", to: "/how-we-work" },
  { label: "Products", to: "/products" },
  { label: "Work", to: "/work" },
  { label: "About", to: "/about" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >

      <div className="section-container flex items-center justify-between h-16 lg:h-20">
        <Link to="/" className="flex items-center">
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-xl">L</span>OUMILAB<span className="text-accent text-xl ml-0.5">.</span>
          </span>
        </Link>

        {/* Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors link-underline pb-1 ${
                location.pathname === link.to ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button variant="accent" size="lg" asChild className="glow-hover">
            <Link to="/contact">Start a Project</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-foreground"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="section-container flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`text-base font-medium py-2 ${
                  location.pathname === link.to ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Button variant="accent" size="lg" asChild className="mt-4">
              <Link to="/contact" onClick={() => setOpen(false)}>Start a Project</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
