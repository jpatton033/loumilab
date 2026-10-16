import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HUES = [217, 150, 25, 340, 270, 190];

/** Type a business name, see it on a miniature store, carry it into setup. */
const TryItInvitation = () => {
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const display = name.trim() || "Your business";
  const hue = useMemo(() => {
    let h = 0;
    for (const c of name.trim()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return HUES[h % HUES.length];
  }, [name]);
  const accent = `hsl(${hue} 75% 45%)`;

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    navigate(n ? `/orders/get-started?name=${encodeURIComponent(n)}` : "/orders/get-started");
  };

  return (
    <section aria-labelledby="try-it-heading" className="section-padding surface-subtle border-y border-border">
      <div className="section-container grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent">Try it here</p>
          <h2 id="try-it-heading" className="mt-5 font-hero text-4xl font-semibold leading-[1.02] tracking-[-0.035em] lg:text-6xl">
            Don&apos;t take our word for it. Build something.
          </h2>
          <form onSubmit={go} className="mt-10 max-w-md">
            <label htmlFor="try-business-name" className="font-display text-sm font-semibold">
              What&apos;s your business called?
            </label>
            <Input
              id="try-business-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="e.g. Maple Street Bakery"
              autoComplete="organization"
              className="mt-3 h-14 rounded-2xl text-lg"
            />
            <Button type="submit" size="lg" className="mt-5 min-h-12 w-full rounded-full sm:w-auto">
              Keep building this store <ArrowRight size={18} />
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              This is a preview. Nothing is saved or published until you create an account.
            </p>
          </form>
        </div>

        <div aria-live="polite" className="mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[var(--shadow-lift)]">
            <div className="h-24 transition-colors duration-500" style={{ background: accent }} aria-hidden="true" />
            <div className="-mt-8 px-6 pb-6">
              <span
                className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-card font-hero text-2xl font-semibold text-primary-foreground transition-colors duration-500"
                style={{ background: accent }}
                aria-hidden="true"
              >
                {display.charAt(0).toUpperCase()}
              </span>
              <p className="mt-4 break-words font-display text-2xl font-semibold">{display}</p>
              <p className="text-sm text-muted-foreground">Order ahead · Pickup available</p>
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                <span className="text-sm font-medium">Your first product</span>
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors duration-500" style={{ background: accent }}>
                  Add
                </span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Sample preview</p>
        </div>
      </div>
    </section>
  );
};

export default TryItInvitation;
