import { useEffect } from "react";

/** Temporary, preview-only headline font comparison. Remove after a font is approved. */
const FONTS = [
  { name: "Geist", family: "'Geist', sans-serif", href: "https://fonts.googleapis.com/css2?family=Geist:wght@600;700&display=swap" },
  { name: "Satoshi", family: "'Satoshi', sans-serif", href: "https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap" },
  { name: "General Sans", family: "'General Sans', sans-serif", href: "https://api.fontshare.com/v2/css?f[]=general-sans@600,700&display=swap" },
];

const isPreviewHost = () =>
  typeof window !== "undefined" && /localhost|id-preview|lovableproject/.test(window.location.hostname);

export function FontPreview() {
  const show = isPreviewHost();
  useEffect(() => {
    if (!show) return;
    const links = FONTS.map((f) => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = f.href;
      document.head.appendChild(l);
      return l;
    });
    return () => links.forEach((l) => l.remove());
  }, [show]);
  if (!show) return null;

  return (
    <section className="border-y border-border bg-background py-16" aria-label="Headline font options (preview only)">
      <div className="section-container">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Preview only — headline font options</p>
        <div className="mt-8 grid gap-10">
          {FONTS.map((f) => (
            <div key={f.name} className="grid gap-4 border-t border-border pt-6 lg:grid-cols-[180px_1fr_1fr]">
              <p className="font-semibold text-foreground">{f.name}</p>
              {["A", "B"].map((opt) => (
                <div key={opt}>
                  <p className="mb-2 text-xs text-muted-foreground">Option {opt}</p>
                  <p style={{ fontFamily: f.family }} className="text-4xl font-bold leading-none tracking-[-0.04em] text-foreground sm:text-5xl">
                    We build what's next{opt === "B" ? "." : ""}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
