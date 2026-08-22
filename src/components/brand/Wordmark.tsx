import { cn } from "@/lib/utils";

type WordmarkSize = "sm" | "md";

interface WordmarkProps {
  size?: WordmarkSize;
  className?: string;
}

const sizeMap: Record<WordmarkSize, { root: string; lead: string; dot: string }> = {
  sm: { root: "text-[1.0625rem]", lead: "text-[1.1875rem]", dot: "text-[1.1875rem]" },
  md: { root: "text-xl", lead: "text-[1.4rem]", dot: "text-[1.4rem]" },
};

const Wordmark = ({ size = "sm", className }: WordmarkProps) => {
  const s = sizeMap[size];

  return (
    <span
      className={cn(
        "inline-flex select-none items-baseline font-display font-bold uppercase leading-none tracking-[-0.03em] text-current",
        s.root,
        className,
      )}
    >
      <span className={cn("leading-none", s.lead)}>L</span>
      <span className="leading-none">oumilab</span>
      <span className={cn("-ml-[0.02em] leading-none text-accent", s.dot)}>.</span>
    </span>
  );
};

export default Wordmark;
