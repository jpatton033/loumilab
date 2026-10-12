import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, X } from "lucide-react";
import { subscribeToTheDot } from "@/lib/thedot/queries";
import { DotMasthead } from "./TheDotSignup";

const DISMISS_KEY = "loumilab_dot_prompt";

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) && v.trim().length <= 255;

/**
 * A tasteful, once-per-article reading prompt: appears after the reader has
 * covered roughly two thirds of the article, remembers dismissal in this
 * browser, and never interrupts at the start of the page.
 */
const EngagementPrompt = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(localStorage.getItem(DISMISS_KEY));
    } catch {
      seen = false;
    }
    if (seen) return;

    const onScroll = () => {
      const article = document.getElementById("kc-article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const progress = (window.scrollY + window.innerHeight - top) / Math.max(rect.height, 1);
      if (progress >= 0.65) {
        window.removeEventListener("scroll", onScroll);
        setOpen(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch {
      /* private mode */
    }
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!emailOk(clean)) {
      toast({ title: "Check your email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await subscribeToTheDot(clean, "engagement-prompt");
      setDone(true);
    } catch (error) {
      toast({
        title: "Couldn't subscribe",
        description: error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <aside
      aria-label="The Dot. newsletter prompt"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-lift)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 lg:inset-x-auto lg:right-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X size={16} />
      </button>

      <DotMasthead />

      {done ? (
        <>
          <h2 className="mt-3 font-display text-lg font-semibold">You're on The Dot.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Look for the next brief in your inbox. Thanks for reading.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-3 font-display text-lg font-semibold">Before you go.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ideas, technology, and what's next — twice a month. No noise. Unsubscribe anytime.
          </p>
          <form onSubmit={subscribe} className="mt-4 flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              maxLength={255}
              aria-label="Email address for The Dot."
              className="flex-1"
              required
            />
            <Button type="submit" size="sm" disabled={submitting} className="dot-action shrink-0">
              {submitting ? "Joining…" : "Join The Dot."}
              <ArrowRight size={15} />
            </Button>
          </form>
        </>
      )}
    </aside>
  );
};

export default EngagementPrompt;
