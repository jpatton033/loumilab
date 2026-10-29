import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { markSubscribed } from "@/lib/thedot/readAllowance";
import { trackDot } from "@/lib/tracking";
import { DOT_TOPICS, saveDotInterests, subscribeToTheDot, type SubscribeResult } from "@/lib/thedot/queries";

const emailOk = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) && v.trim().length <= 255;

export const DotMasthead = ({ className }: { className?: string }) => (
  <p
    aria-label="The Dot. A Loumilab Brief"
    className={cn(
      "font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground",
      className,
    )}
  >
    The Dot<span aria-hidden="true" className="text-accent">.</span> — A Loumilab Brief
  </p>
);

interface TheDotSignupProps {
  source: string;
  variant?: "panel" | "inline";
  heading?: string;
  description?: string;
  className?: string;
  onSubscribed?: () => void;
}

const TheDotSignup = ({
  source,
  variant = "panel",
  heading = "Stay connected to what's next.",
  description = "A concise brief from Loumilab — ideas, technology, and shifts worth watching. Twice a month. No noise.",
  className,
  onSubscribed,
}: TheDotSignupProps) => {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle");
  const [already, setAlready] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { toast } = useToast();

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!emailOk(clean)) {
      toast({ title: "Check your email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setState("submitting");
    try {
      trackDot("dot_subscription_started", { location: source });
      const result = await subscribeToTheDot(clean, source);
      markSubscribed();
      trackDot("dot_subscription_completed", { location: source });
      onSubscribed?.();
      setAlready(Boolean(result.already));
      setSubscriberEmail(clean);
      setState("done");
      setEmail("");
    } catch (error) {
      setState("idle");
      toast({
        title: "Couldn't subscribe",
        description: error instanceof Error ? error.message : "Please try again shortly.",
        variant: "destructive",
      });
    }
  };

  const toggleInterest = async (topic: string) => {
    const next = selected.includes(topic) ? selected.filter((t) => t !== topic) : [...selected, topic];
    setSelected(next);
    try {
      await saveDotInterests(subscriberEmail, next);
    } catch {
      /* preferences are best-effort */
    }
  };

  const isPanel = variant === "panel";

  return (
    <div
      className={cn(
        isPanel ? "rounded-3xl border border-border bg-surface-subtle p-7 lg:p-10" : "",
        className,
      )}
    >
      <DotMasthead />
      {state !== "done" ? (
        <>
          <h2 className={cn("font-display font-semibold text-foreground", isPanel ? "mt-3 text-lg lg:text-xl" : "mt-3 text-base lg:text-lg")}>
            {heading}
          </h2>
          <p className={cn("mt-2 leading-relaxed text-muted-foreground", isPanel ? "max-w-xl text-sm lg:text-base" : "text-sm")}>
            {description}
          </p>
          <form onSubmit={subscribe} className={cn("mt-5 flex flex-col gap-3", "sm:flex-row", isPanel ? "max-w-lg" : "")}>
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
            <Button type="submit" disabled={state === "submitting"} className="dot-action shrink-0">
              {state === "submitting" ? "Joining…" : "Join The Dot."}
              <ArrowRight size={16} />
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">Twice a month. Unsubscribe anytime.</p>
        </>
      ) : (
        <>
          <h2 className="mt-3 font-display text-lg font-semibold lg:text-xl">
            {already ? "You're already on The Dot." : "You're on The Dot."}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-base">
            {already
              ? "Look for the next brief when it lands."
              : "Look for the next brief in your inbox. In the meantime, everything we publish lives on the web."}
          </p>
          <p className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            What should we focus on? (optional)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DOT_TOPICS.map((topic) => {
              const active = selected.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleInterest(topic)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    active ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TheDotSignup;
