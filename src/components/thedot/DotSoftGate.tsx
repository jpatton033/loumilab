import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { subscribeToTheDot } from "@/lib/thedot/queries";
import { markDismissed, markSubscribed } from "@/lib/thedot/readAllowance";
import { trackDot } from "@/lib/tracking";
import { DotMasthead } from "./TheDotSignup";

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 255;

/** Soft editorial gate: content stays in the page (same for crawlers), blurred and faded beneath an invitation. */
export default function DotSoftGate({ gated, slug, children }: { gated: boolean; slug: string; children: ReactNode }) {
  const [open, setOpen] = useState(!gated);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    setOpen(!gated);
    if (gated) trackDot("dot_subscription_gate_shown", { issue: slug });
  }, [gated, slug]);

  if (open) return <>{children}</>;

  const reveal = () => {
    const y = window.scrollY;
    setOpen(true);
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!emailOk(clean)) {
      toast({ title: "Check your email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setBusy(true);
    trackDot("dot_subscription_started", { issue: slug, location: "gate" });
    try {
      await subscribeToTheDot(clean, `the-dot-gate-${slug}`);
      markSubscribed();
      trackDot("dot_subscription_completed", { issue: slug, location: "gate" });
      toast({ title: "You're on The Dot.", description: "Enjoy the rest of the issue." });
      reveal();
    } catch (error) {
      toast({
        title: "Couldn't subscribe",
        description: error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        // @ts-expect-error inert is a valid HTML attribute
        inert=""
        className="pointer-events-none max-h-[420px] select-none overflow-hidden blur-[3px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_85%)]"
      >
        {children}
      </div>
      <section
        aria-labelledby="dot-gate-heading"
        className="relative -mt-56 rounded-3xl border border-border bg-background p-7 shadow-sm lg:p-10"
      >
        <DotMasthead />
        <h2 id="dot-gate-heading" className="mt-4 font-hero text-3xl font-semibold leading-tight tracking-[-0.02em] text-foreground lg:text-4xl">
          A little curiosity goes a long way.
        </h2>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          You've explored The Dot. Now stay connected to the ideas shaping business, technology, and what's next.
        </p>
        <p className="mt-4 font-display font-semibold text-foreground">
          Join The Dot<span className="text-accent">.</span> — It's free.
        </p>
        <form onSubmit={submit} className="mt-5 flex max-w-lg flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => {
              if (!started.current) started.current = true;
            }}
            placeholder="you@company.com"
            maxLength={255}
            aria-label="Email address for The Dot."
            className="h-12 flex-1"
            required
          />
          <Button type="submit" disabled={busy} className="dot-action h-12 shrink-0">
            {busy ? "Joining…" : "Subscribe"}
            <ArrowRight size={16} />
          </Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">Thoughtful perspectives. No noise. Unsubscribe anytime.</p>
        <button
          type="button"
          onClick={() => {
            markDismissed();
            trackDot("dot_subscription_gate_dismissed", { issue: slug });
            reveal();
          }}
          className="mt-6 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
        >
          Continue reading
        </button>
      </section>
    </div>
  );
}
