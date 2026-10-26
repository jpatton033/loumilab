import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { productGroups } from "@/data/products";
import Wordmark from "@/components/brand/Wordmark";


const Footer = () => (
  <footer className="border-t border-border bg-surface-subtle">
    <div className="section-container py-16 lg:py-20">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
        <div>
          <Link to="/" className="mb-4 flex items-center" aria-label="Loumilab home">
            <Wordmark size="md" />
          </Link>

          <p className="max-w-xs leading-relaxed text-muted-foreground">
            A technology studio that designs, builds, launches, and secures digital products.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Services
          </h4>
          <nav className="flex flex-col gap-3">
            <Link to="/services" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Services Overview</Link>
            <Link to="/how-we-work" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">How We Work</Link>
            <Link to="/work" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Selected Work</Link>
          </nav>
        </div>

        <div>
          <h4 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Products
          </h4>
          <nav className="flex flex-col gap-3">
            {productGroups.flatMap((g) => g.items).map((p) =>
              p.external ? (
                <a
                  key={p.id}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 text-sm text-foreground/70 transition-colors hover:text-accent"
                >
                  {p.name} <ArrowUpRight size={13} />
                </a>
              ) : (
                <Link key={p.id} to={p.href} className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">
                  {p.name}
                </Link>
              )
            )}
            <Link to="/products" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Ecosystem</Link>
            <Link to="/orders/compare/square" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Orders vs. Square</Link>
            <Link to="/orders/compare/shopify" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Orders vs. Shopify</Link>
            <Link to="/orders/compare/toast" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Orders vs. Toast</Link>
          </nav>
        </div>

        <div>
          <h4 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connect
          </h4>
          <nav className="flex flex-col gap-3">
            <Link to="/about" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">About</Link>
            <Link to="/resources" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Knowledge Center</Link>
            <Link to="/the-dot" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">The Dot. — A Loumilab Brief</Link>
            <Link to="/contact" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">Contact</Link>
            <a href="mailto:hello@loumilab.com" className="w-fit text-sm text-foreground/70 transition-colors hover:text-accent">
              hello@loumilab.com
            </a>
          </nav>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Loumilab — Building Secure Digital Innovations.</span>
        <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
          <Link to="/orders/terms" className="underline-offset-4 hover:text-accent hover:underline">
            Terms of Service
          </Link>
          <Link to="/orders/privacy" className="underline-offset-4 hover:text-accent hover:underline">
            Privacy Policy
          </Link>
          <button type="button" className="underline-offset-4 hover:text-primary hover:underline" onClick={() => window.dispatchEvent(new Event("loumilab:open-cookie-settings"))}>
            Cookie settings
          </button>
          <span>Design. Build. Launch. Secure.</span>
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
