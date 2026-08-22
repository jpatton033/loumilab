import { ArrowDown, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { cn } from "@/lib/utils";

export interface FlowStep {
  id: string;
  label: string;
  detail?: string;
  emphasis?: boolean;
}

interface Props {
  steps: FlowStep[];
  className?: string;
  /** Horizontal on desktop (default) or always stacked. */
  orientation?: "auto" | "stacked";
}

const FlowDiagram = ({ steps, className, orientation = "auto" }: Props) => (
  <div
    className={cn(
      "flex flex-col items-stretch gap-3",
      orientation === "auto" && "lg:flex-row lg:items-center",
      className
    )}
  >
    {steps.map((step, i) => (
      <div
        key={step.id}
        className={cn("flex flex-col gap-3", orientation === "auto" && "lg:flex-1 lg:flex-row lg:items-center")}
      >
        <Reveal delay={i * 110} className={cn("flex-1", orientation === "auto" && "lg:flex-1")}>
          <div
            className={cn(
              "h-full rounded-2xl border p-5 text-center lg:text-left",
              step.emphasis
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-card shadow-[var(--shadow-soft)]"
            )}
          >
            <p className="font-display font-semibold">{step.label}</p>
            {step.detail && (
              <p className={cn("mt-1 text-sm", step.emphasis ? "text-background/70" : "text-muted-foreground")}>
                {step.detail}
              </p>
            )}
          </div>
        </Reveal>

        {i < steps.length - 1 && (
          <Reveal delay={i * 110 + 60} className="flex items-center justify-center text-muted-foreground">
            <ArrowDown size={18} className={cn(orientation === "auto" && "lg:hidden")} />
            {orientation === "auto" && <ArrowRight size={18} className="hidden lg:block" />}
          </Reveal>
        )}
      </div>
    ))}
  </div>
);

export default FlowDiagram;
