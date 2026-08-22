import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Screen label for assistive tech, e.g. "Sunday Kitchen storefront preview". */
  label?: string;
}

/** Neutral device frame used for every Orders product mockup. */
const PhoneFrame = ({ children, className, label }: PhoneFrameProps) => (
  <div
    role="img"
    aria-label={label}
    className={cn(
      "relative mx-auto w-full max-w-[320px] rounded-[2.75rem] border border-border bg-foreground p-2 shadow-[var(--shadow-lift)]",
      className
    )}
  >
    <div className="relative overflow-hidden rounded-[2.25rem] bg-background">
      <div className="flex items-center justify-center py-2">
        <span className="h-1.5 w-16 rounded-full bg-muted" />
      </div>
      <div className="max-h-[560px] overflow-hidden">{children}</div>
    </div>
  </div>
);

export default PhoneFrame;
