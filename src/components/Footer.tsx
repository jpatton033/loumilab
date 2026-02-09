import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border bg-primary text-primary-foreground">
    <div className="section-container py-16 lg:py-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <Link to="/" className="font-display text-2xl font-bold">
            Studio<span className="text-accent">X</span>
          </Link>
          <p className="mt-4 text-primary-foreground/70 max-w-sm leading-relaxed">
            A product-driven digital studio building scalable websites and SaaS products with modern tools and AI-assisted workflows.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold mb-4 text-primary-foreground/50 uppercase tracking-wider">Studio</h4>
          <nav className="flex flex-col gap-3">
            <Link to="/services" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Services</Link>
            <Link to="/how-we-work" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">How We Work</Link>
            <Link to="/products" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Products</Link>
            <Link to="/work" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Work</Link>
          </nav>
        </div>
        <div>
          <h4 className="font-display text-sm font-semibold mb-4 text-primary-foreground/50 uppercase tracking-wider">Company</h4>
          <nav className="flex flex-col gap-3">
            <Link to="/about" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">About</Link>
            <Link to="/contact" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">Contact</Link>
          </nav>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-primary-foreground/10 text-sm text-primary-foreground/40">
        © {new Date().getFullYear()} StudioX. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
