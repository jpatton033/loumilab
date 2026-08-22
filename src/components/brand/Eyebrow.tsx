import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={cn(
      "inline-block font-display text-xs font-semibold uppercase tracking-[0.22em] text-accent",
      className
    )}
  >
    {children}
  </span>
);

export default Eyebrow;
