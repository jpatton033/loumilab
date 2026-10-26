import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Wordmark from "@/components/brand/Wordmark";
import { footerCompany, navMenus, type NavLinkItem } from "@/data/navigation";

const linkCls = "inline-flex w-fit items-center gap-1.5 text-sm text-foreground/70 transition-colors hover:text-accent";
const FLink = ({ item }: { item: NavLinkItem }) =>
  item.external ? (
    <a href={item.to} target="_blank" rel="noopener noreferrer" className={linkCls}>{item.label} <ArrowUpRight size={13} /></a>
  ) : (
    <Link to={item.to} className={linkCls}>{item.label}</Link>
  );

const Col = ({ title, items }: { title: string; items: NavLinkItem[] }) => (
  <div>
    <h2 className="mb-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
    <nav className="flex flex-col gap-3" aria-label={title}>{items.map((i) => <FLink key={i.to + i.label} item={i} />)}</nav>
  </div>
);


const Footer = () => {
  const solutions = navMenus.find((m) => m.id === "solutions")!;
  const products = navMenus.find((m) => m.id === "products")!;
  const resources = navMenus.find((m) => m.id === "resources")!;
  return (
    <footer className="section-dark border-t border-border">
      <div className="section-container py-16 lg:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="mb-4 flex items-center" aria-label="Loumilab home"><Wordmark size="md" className="invert" /></Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">A technology studio for digital products.</p>
            <a href="mailto:hello@loumilab.com" className={`${linkCls} mt-4`}>hello@loumilab.com</a>
          </div>
          {solutions.groups.map((g) => <Col key={g.label} title={g.label} items={g.items} />)}
          <Col title="Products" items={[...products.groups.flatMap((g) => g.items).filter((i) => i.to !== "/orders/tools"), { label: "All products", to: products.footer?.to ?? "/products" }]} />
          <Col title="Resources" items={resources.groups.flatMap((g) => g.items)} />
          <Col title="Company" items={footerCompany} />
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Loumilab — Building Secure Digital Innovations.</span>
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <Link to="/orders/terms" className="underline-offset-4 hover:text-accent hover:underline">Terms of Service</Link>
            <Link to="/orders/privacy" className="underline-offset-4 hover:text-accent hover:underline">Privacy Policy</Link>
            <button type="button" className="underline-offset-4 hover:text-accent hover:underline" onClick={() => window.dispatchEvent(new Event("loumilab:open-cookie-settings"))}>Cookie settings</button>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
