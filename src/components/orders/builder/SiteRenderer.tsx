import { useEffect, type CSSProperties, type ReactNode } from "react";
import type { Design, Section, Theme } from "@/lib/orders/builder/schema";

/**
 * Renders a merchant's website from its layout data. Shared by the public
 * storefront and the editor canvas. All text is rendered as plain text and
 * colors come only from the validated theme, so designs can't inject markup.
 */

export interface SiteStoreInfo {
  name: string;
  logoUrl?: string | null;
  monogram?: string;
  hours?: string;
  pickupInfo?: string;
  location?: string;
}

interface Props {
  design: Design;
  store: SiteStoreInfo;
  /** Products block (cart-aware on the live site, sample cards in the editor). */
  renderProducts: (opts: { featured?: number; heading?: string }) => ReactNode;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  viewport?: "desktop" | "tablet" | "mobile";
}

const loaded = new Set<string>();
const useFonts = (theme: Theme) => {
  useEffect(() => {
    for (const f of [theme.headingFont, theme.bodyFont]) {
      if (loaded.has(f)) continue;
      loaded.add(f);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [theme.headingFont, theme.bodyFont]);
};

const RADIUS = { none: "0px", soft: "14px", round: "28px" };
const HSCALE = { sm: 0.85, md: 1, lg: 1.18 };
const WIDTH = { narrow: "max-w-4xl", normal: "max-w-6xl", wide: "max-w-7xl" };
/** Product/item card look from the site theme. Used by every products block (live, editor, previews). */
export const siteCardStyle: CSSProperties = {
  background: "var(--site-surface)", borderRadius: "var(--site-radius)",
};

/** Primary button look from the site theme. */
export const siteButtonStyle: CSSProperties = {
  background: "var(--site-btn-bg)", color: "var(--site-btn-text)", border: "1.5px solid var(--site-accent)", borderRadius: "var(--site-btn-radius)",
};

const PAD = { compact: "py-8", normal: "py-14 md:py-20", airy: "py-20 md:py-32" };

const bgStyle = (s: Section): CSSProperties => {
  switch (s.style.background) {
    case "surface": return { background: "var(--site-surface)" };
    case "accent": return { background: "var(--site-accent)", color: "var(--site-accent-text)" };
    case "inverse": return { background: "var(--site-text)", color: "var(--site-bg)" };
    default: return {};
  }
};

const H = ({ children, size = 1 }: { children: ReactNode; size?: number }) => (
  <h2 className="font-semibold leading-[1.05] tracking-tight" style={{ color: "inherit", fontFamily: "var(--site-heading)", fontSize: `calc(clamp(1.8rem, 4vw, 2.8rem) * var(--site-hscale) * ${size})` }}>
    {children}
  </h2>
);

const Items = ({ items, cols = 2 }: { items: { title?: string; text?: string }[]; cols?: number }) => (
  <div className={`mt-8 grid gap-4 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
    {items.map((it, i) => (
      <div key={i} className="p-6" style={{ background: "color-mix(in srgb, currentColor 6%, transparent)", borderRadius: "var(--site-radius)" }}>
        <p className="font-semibold" style={{ fontFamily: "var(--site-heading)" }}>{it.title}</p>
        <p className="mt-2 text-sm leading-relaxed opacity-80">{it.text}</p>
      </div>
    ))}
  </div>
);

const SectionBody = ({ s, store, renderProducts }: { s: Section; store: SiteStoreInfo; renderProducts: Props["renderProducts"] }) => {
  const p = s.props;
  const center = s.style.align === "center";
  switch (s.type) {
    case "header":
      return (
        <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
          {store.logoUrl ? <img src={store.logoUrl} alt="" className="h-10 w-10 object-cover" style={{ borderRadius: "var(--site-radius)" }} />
            : <span className="flex h-10 w-10 items-center justify-center text-sm font-bold" style={{ background: "var(--site-accent)", color: "var(--site-accent-text)", borderRadius: "var(--site-radius)" }}>{store.monogram ?? store.name.slice(0, 2).toUpperCase()}</span>}
          <span className="text-lg font-semibold" style={{ fontFamily: "var(--site-heading)" }}>{store.name}</span>
        </div>
      );
    case "hero": {
      const layout = p.layout ?? (center && !p.image ? "centered" : "split");
      const btn = p.cta && <a href="#order" className="mt-8 inline-block px-6 py-3 text-sm font-semibold" style={siteButtonStyle}>{p.cta}</a>;
      const h1 = <h1 className="font-semibold leading-[1.02] tracking-tight" style={{ color: "inherit", fontFamily: "var(--site-heading)", fontSize: "calc(clamp(2.4rem, 6vw, 4.2rem) * var(--site-hscale))" }}>{p.heading || store.name}</h1>;
      if (layout === "full") {
        return (
          <div className="relative -mx-5 overflow-hidden md:-mx-8" style={{ borderRadius: "var(--site-radius)" }}>
            {p.image && <img src={p.image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.6))" }} />
            <div className={`relative flex min-h-[26rem] flex-col justify-end p-8 md:p-12 ${center ? "items-center text-center" : ""}`} style={{ color: "#ffffff" }}>
              {h1}
              {p.body && <p className="mt-5 max-w-xl text-lg leading-relaxed opacity-90">{p.body}</p>}
              {btn}
            </div>
          </div>
        );
      }
      if (layout === "centered") {
        return (
          <div className="mx-auto max-w-3xl text-center">
            {h1}
            {p.body && <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed opacity-80">{p.body}</p>}
            {btn}
            {p.image && <img src={p.image} alt="" className="mt-12 aspect-[16/9] w-full object-cover" style={{ borderRadius: "var(--site-radius)" }} />}
          </div>
        );
      }
      return (
        <div className={`grid items-center gap-10 ${p.image ? "md:grid-cols-2" : ""} ${center ? "text-center" : ""}`}>
          <div className={center && !p.image ? "mx-auto max-w-2xl" : ""}>
            {h1}
            {p.body && <p className="mt-5 max-w-xl text-lg leading-relaxed opacity-80" style={center ? { marginInline: "auto" } : undefined}>{p.body}</p>}
            {btn}
          </div>
          {p.image && <img src={p.image} alt="" className="aspect-[4/3] w-full object-cover" style={{ borderRadius: "var(--site-radius)" }} />}
        </div>
      );
    }
    case "about":
      return (
        <div className={`grid gap-10 ${p.image ? "md:grid-cols-2" : ""} ${center ? "text-center" : ""}`}>
          <div className={center ? "mx-auto max-w-2xl" : "max-w-2xl"}>
            {p.heading && <H>{p.heading}</H>}
            {p.body && <p className="mt-5 whitespace-pre-line leading-relaxed opacity-80">{p.body}</p>}
          </div>
          {p.image && <img src={p.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" style={{ borderRadius: "var(--site-radius)" }} />}
        </div>
      );
    case "products":
      return <div id="order" className={center ? "text-center" : ""}>{p.heading && <H>{p.heading}</H>}<div className="mt-8 text-left">{renderProducts({ heading: p.heading })}</div></div>;
    case "featured":
      return <div className={center ? "text-center" : ""}>{p.heading && <H size={0.85}>{p.heading}</H>}<div className="mt-8 text-left">{renderProducts({ featured: p.count ?? 3 })}</div></div>;
    case "services":
    case "testimonials":
    case "faq":
      return (
        <div className={center ? "text-center" : ""}>
          {p.heading && <H>{p.heading}</H>}
          {s.type === "faq" ? (
            <div className="mx-auto mt-8 max-w-3xl divide-y text-left" style={{ borderColor: "color-mix(in srgb, currentColor 15%, transparent)" }}>
              {(p.items ?? []).map((it, i) => (
                <details key={i} className="group py-4"><summary className="cursor-pointer font-semibold">{it.title}</summary><p className="mt-2 text-sm opacity-80">{it.text}</p></details>
              ))}
            </div>
          ) : <Items items={p.items ?? []} cols={s.type === "services" && (p.items?.length ?? 0) >= 3 ? 3 : 2} />}
        </div>
      );
    case "gallery":
      return (
        <div className={center ? "text-center" : ""}>
          {p.heading && <H>{p.heading}</H>}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {(p.images ?? []).map((src, i) => <img key={i} src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" style={{ borderRadius: "var(--site-radius)" }} />)}
            {(p.images ?? []).length === 0 && <p className="col-span-full text-sm opacity-60">Add photos to your gallery.</p>}
          </div>
        </div>
      );
    case "promo":
      return <p className={`text-base font-semibold ${center ? "text-center" : ""}`}>{p.body}</p>;
    case "contact":
      return (
        <div className={center ? "text-center" : ""}>
          {p.heading && <H>{p.heading}</H>}
          {p.body && <p className="mt-4 opacity-80">{p.body}</p>}
          <div className="mt-6 space-y-1 text-sm">
            {p.email && <p>{p.email}</p>}
            {p.phone && <p>{p.phone}</p>}
            {store.location && <p className="opacity-70">{store.location}</p>}
          </div>
        </div>
      );
    case "hours":
      return (
        <div className={center ? "text-center" : ""}>
          {p.heading && <H size={0.8}>{p.heading}</H>}
          <p className="mt-4 whitespace-pre-line opacity-80">{p.body || store.hours || "Hours coming soon."}</p>
          {store.pickupInfo && <p className="mt-2 text-sm opacity-60">{store.pickupInfo}</p>}
        </div>
      );
    case "footer":
      return (
        <div className={`flex flex-col gap-2 text-sm sm:flex-row sm:justify-between ${center ? "items-center text-center sm:flex-col" : ""}`}>
          <span className="font-semibold" style={{ fontFamily: "var(--site-heading)" }}>{store.name}</span>
          <span className="opacity-70">{p.body || `© ${new Date().getFullYear()} ${store.name}`}</span>
        </div>
      );
  }
};

const SiteRenderer = ({ design, store, renderProducts, selectedId, onSelect, viewport = "desktop" }: Props) => {
  const t = design.theme;
  useFonts(t);
  const vars = {
    "--site-bg": t.background, "--site-surface": t.surface, "--site-text": t.text, "--site-muted": t.muted,
    "--site-accent": t.accent, "--site-accent-text": t.accentText,
    "--site-heading": `"${t.headingFont}", serif`, "--site-body": `"${t.bodyFont}", sans-serif`,
    "--site-radius": RADIUS[t.radius], "--site-hscale": HSCALE[t.headingScale],
    "--site-btn-bg": t.buttonStyle === "outline" ? "transparent" : t.accent, "--site-btn-text": t.buttonStyle === "outline" ? t.text : t.accentText,
    "--site-btn-radius": t.buttonStyle === "pill" ? "999px" : RADIUS[t.radius],
    background: t.background, color: t.text, fontFamily: `"${t.bodyFont}", sans-serif`,
  } as CSSProperties;
  const narrow = viewport !== "desktop";
  const vpClass = viewport === "mobile" ? "site-mobile" : viewport === "tablet" ? "site-tablet" : "";

  return (
    <div style={vars} className={`transition-colors duration-500 ${vpClass}`}>
      {design.sections.filter((s) => !s.hidden || onSelect).map((s) => {
        const editing = !!onSelect;
        return (
          <section
            key={s.id}
            style={{ ...bgStyle(s), opacity: s.hidden ? 0.35 : 1 }}
            className={`${s.type === "header" || s.type === "footer" ? "py-6" : PAD[s.style.spacing]} ${editing ? "relative cursor-pointer outline-offset-[-3px] hover:outline hover:outline-2 hover:outline-[var(--site-accent)]" : ""} ${selectedId === s.id ? "outline outline-[3px] outline-[var(--site-accent)]" : ""}`}
            onClick={editing ? (e) => { e.preventDefault(); onSelect!(s.id); } : undefined}
          >
            <div className={`mx-auto px-5 ${narrow ? "max-w-full" : `${WIDTH[t.contentWidth ?? "normal"]} md:px-8`}`}>
              <SectionBody s={s} store={store} renderProducts={renderProducts} />
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SiteRenderer;
