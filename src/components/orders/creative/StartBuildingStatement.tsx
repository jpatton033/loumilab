import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useInView } from "@/components/brand/dot";
import { cn } from "@/lib/utils";

/** "Don't sign up. Start building." — the dot strikes "sign up", then lands on the action. */
const StartBuildingStatement = () => {
  const { ref, inView } = useInView<HTMLElement>("0px 0px -20% 0px");
  return (
    <section
      ref={ref}
      aria-labelledby="start-building-heading"
      className={cn("sb-statement relative overflow-hidden py-28 lg:py-44", inView && "sb-in")}
    >
      <div className="section-container text-center">
        <h2
          id="start-building-heading"
          className="font-hero font-semibold leading-[0.95] tracking-[-0.045em]"
          style={{ fontSize: "clamp(2.75rem, 10vw, 8.5rem)" }}
        >
          <span className="sb-line-1 block">
            Don&apos;t <span className="sb-strike relative inline-block">sign up<span className="sb-strike-line" aria-hidden="true" /></span>.
          </span>
          <span className="sb-line-2 block text-accent">Start building.</span>
        </h2>
        <p className="sb-sub mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl">
          Build it first. Make it yours. Publish when you&apos;re ready.
        </p>
        <div className="sb-cta mt-10 flex justify-center">
          <Link
            to="/orders/get-started"
            className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-7 py-3 font-display text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="sb-dot h-2.5 w-2.5 rounded-full bg-accent group-hover:bg-primary-foreground" aria-hidden="true" />
            Build your store — no sign-up required
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StartBuildingStatement;
