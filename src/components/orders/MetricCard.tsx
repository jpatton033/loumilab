import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: string;
  className?: string;
}

const MetricCard = ({ label, value, delta, className }: Props) => (
  <div className={cn("rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]", className)}>
    <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-3 font-hero text-3xl font-semibold tracking-tight lg:text-4xl">{value}</p>
    {delta && <p className="mt-2 text-sm text-muted-foreground">{delta}</p>}
  </div>
);

export default MetricCard;
