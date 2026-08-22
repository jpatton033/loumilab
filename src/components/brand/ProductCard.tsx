import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductEntry } from "@/data/products";

const ProductCard = ({ product, className }: { product: ProductEntry; className?: string }) => {
  const body = (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {product.category}
        </span>
        {product.badge && (
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {product.badge}
          </span>
        )}
      </div>
      <h3 className="mt-5 font-display text-2xl font-semibold lg:text-3xl">{product.name}</h3>
      <p className="mt-2 font-display text-lg text-foreground/80">{product.tagline}</p>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{product.description}</p>
      <span className="mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold text-foreground">
        {product.cta}
        {product.external ? (
          <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        ) : (
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        )}
      </span>
    </>
  );

  const shell = cn(
    "group flex flex-col rounded-3xl border border-border bg-card p-8 lg:p-12 shadow-[var(--shadow-soft)] glow-hover hover:border-accent/40",
    className
  );

  if (product.external) {
    return (
      <a href={product.href} target="_blank" rel="noopener noreferrer" className={shell}>
        {body}
      </a>
    );
  }

  return (
    <Link to={product.href} className={shell}>
      {body}
    </Link>
  );
};

export default ProductCard;
