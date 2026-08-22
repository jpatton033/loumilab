import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { subscribeToNewsletter } from "@/lib/kc/queries";
import { Mail } from "lucide-react";

interface NewsletterSignupProps {
  source?: string;
  compact?: boolean;
}

const NewsletterSignup = ({ source = "resources", compact = false }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean) || clean.length > 255) {
      toast({ title: "Check your email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await subscribeToNewsletter(clean, source);
      setDone(true);
      setEmail("");
      toast({ title: "You're on the list", description: "We'll send new resources as they publish." });
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

  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-border bg-surface-subtle p-7"
          : "rounded-3xl border border-border bg-surface-subtle p-10 text-center lg:p-14"
      }
    >
      <div className={compact ? "" : "mx-auto max-w-lg"}>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Mail size={18} strokeWidth={1.75} />
        </span>
        <h2 className={compact ? "mt-4 font-display text-lg font-semibold" : "mt-5 text-2xl font-semibold lg:text-3xl"}>
          New resources, when they publish
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Practical guides on growth, commerce, technology, and security. No noise, unsubscribe anytime.
        </p>

        {done ? (
          <p className="mt-6 text-sm font-medium text-accent">Thanks — you're subscribed.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              maxLength={255}
              aria-label="Email address"
              className="flex-1"
              required
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? "Subscribing…" : "Subscribe"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsletterSignup;
