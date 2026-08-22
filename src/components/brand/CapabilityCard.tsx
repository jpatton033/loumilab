import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapabilityCardProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  className?: string;
}

const CapabilityCard = ({ icon: Icon, label, title, description, className }: CapabilityCardProps) => (
  <div
    className={cn(
      "group rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-[var(--shadow-soft)] glow-hover hover:border-accent/40",
      className
    )}
  >
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
      <Icon size={22} strokeWidth={1.75} />
    </div>
    <span className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
      {label}
    </span>
    <h3 className="mt-3 font-display text-xl font-semibold lg:text-2xl">{title}</h3>
    <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
  </div>
);

export default CapabilityCard;
