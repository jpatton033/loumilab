import { cn } from "@/lib/utils";

const sizes = { sm: "1.125rem", md: "1.375rem", lg: "1.75rem", xl: "3rem" } as const;

/** Vurtti's official wordmark, ported from the Vurtti project. */
export const VurttiLogo = ({ size = "md", className }: { size?: keyof typeof sizes; className?: string }) => (
  <span
    className={cn("inline-block font-sans font-bold uppercase tracking-[0.14em]", className)}
    style={{ fontSize: sizes[size], lineHeight: 1 }}
    aria-label="Vurtti"
  >
    VURTTI
  </span>
);

export default VurttiLogo;
