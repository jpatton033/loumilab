import { cn } from "@/lib/utils";

type WordmarkSize = "sm" | "md";

interface WordmarkProps {
  size?: WordmarkSize;
  animated?: boolean;
  className?: string;
}

const sizeMap: Record<WordmarkSize, { root: string; lead: string; dot: string }> = {
  sm: { root: "text-[1.0625rem]", lead: "text-[1.1875rem]", dot: "text-[1.1875rem]" },
  md: { root: "text-xl", lead: "text-[1.4rem]", dot: "text-[1.4rem]" },
};

const letters = ["L", "o", "u", "m", "i", "l", "a", "b"];

const Wordmark = ({ size = "sm", animated = false, className }: WordmarkProps) => {
  const s = sizeMap[size];

  return (
    <span
      className={cn(
        "relative inline-flex select-none items-baseline font-display font-bold uppercase leading-none tracking-[-0.03em] text-current",
        animated && "brand-wordmark-animated",
        s.root,
        className,
      )}
      aria-hidden="true"
    >
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={cn(
            "brand-wordmark-letter leading-none",
            `brand-wordmark-letter-${index + 1}`,
            index === 0 && s.lead,
          )}
        >
          {letter}
        </span>
      ))}
      <span className={cn("brand-wordmark-dot-x relative -ml-[0.02em] inline-block leading-none text-accent", s.dot)}>
        <span className="brand-wordmark-dot inline-block leading-none">.</span>
        {animated && <span className="brand-wordmark-ripple" />}
      </span>
      {animated && <span className="brand-wordmark-shine" />}
    </span>
  );
};

export default Wordmark;
