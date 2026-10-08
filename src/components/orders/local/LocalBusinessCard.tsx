import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { categoryLabel, type LocalBusiness } from "@/lib/orders/local";
import { cn } from "@/lib/utils";

interface Props {
  business: LocalBusiness;
  /** Preview mode renders without a link (merchant dashboard). */
  preview?: boolean;
  className?: string;
}

const Chip = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
      tone === "accent" ? "border-accent/20 bg-accent/10 text-accent" : "border-border bg-secondary text-muted-foreground",
    )}
  >
    {children}
  </span>
);

const LocalBusinessCard = ({ business: b, preview, className }: Props) => {
  const initials = b.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const meta = [categoryLabel(b.category), ...(b.cuisines ?? []).slice(0, 2)].filter(Boolean).join(" · ");

  const body = (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow",
        !preview && "glow-hover",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {b.image_url ? (
          <img src={b.image_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl font-semibold text-muted-foreground">{initials}</div>
        )}
        <div className="absolute left-3 top-3">
          {b.store_slug ? (
            <Chip tone={b.accepting ? "accent" : "muted"}>{b.accepting ? "Order online" : "Not accepting orders"}</Chip>
          ) : b.ownership_status === "unclaimed" ? <Chip>Unclaimed</Chip> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3">
          {b.logo_url ? (
            <img src={b.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-border object-cover" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-xs font-semibold text-background">{initials}</div>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold">{b.name}</h3>
            {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
          </div>
        </div>
        {b.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {b.area && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} /> {b.area}
              {b.distance_miles != null && ` · ${b.distance_miles < 1 ? "<1" : Math.round(b.distance_miles)} mi`}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {b.pickup && <Chip>Pickup</Chip>}
          {b.delivery && <Chip>Delivery</Chip>}
        </div>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold">
          View business <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );

  if (preview) return body;
  return (
    <Link to={`/orders/local/${b.slug}`} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-3xl">
      {body}
    </Link>
  );
};

export default LocalBusinessCard;
