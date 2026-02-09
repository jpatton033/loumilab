import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/50">
    <div className="section-container py-16 lg:py-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center mb-4">
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-2xl">L</span>OUMILAB<span className="text-accent">.</span>
            </span>
          </Link>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            A digital innovation studio illuminating the future of web and SaaS development. Where ideas come to light.
          </p>
        </div>
        <div>
          <h4 className="font-display text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Studio</h4>
          <nav className="flex flex-col gap-3">
            <Link to="/services" className="text-sm text-foreground/70 hover:text-accent transition-colors link-underline inline-block w-fit">Services</Link>
            <Link to="/how-we-work" className="text-sm text-foreground/70 hover:text-accent transition-colors link-underline inline-block w-fit">How We Work</Link>
            <Link to="/products" className="text-sm text-foreground/70 hover:text-accent transition-colors link-underline inline-block w-fit">Products</Link>
            <Link to="/work" className="text-sm text-foreground/70 hover:text-accent transition-colors link-underline inline-block w-fit">Work</Link>
          </nav>
        </div>
        <div>
          <h4 className="font-display text-xs font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Company</h4>
          <nav className="flex flex-col gap-3">
            <Link to="/about" className="text-sm text-foreground/70 hover:text-accent transition-colors link-underline inline-block w-fit">About</Link>
            <Link to="/contact" className="text-sm text-foreground/70 hover:text-accent transition-colors link-underline inline-block w-fit">Contact</Link>
          </nav>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© {new Date().getFullYear()} Loumilab. All rights reserved.</span>
        <span className="text-xs">Illuminating Digital Innovation</span>
      </div>
    </div>
  </footer>
);

export default Footer;
