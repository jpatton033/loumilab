import { cn } from "@/lib/utils";

type WordmarkSize = "sm" | "md";

interface WordmarkProps {
  size?: WordmarkSize;
  animated?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

const sizeMap: Record<WordmarkSize, { root: string }> = {
  sm: { root: "text-[1rem]" },
  md: { root: "text-[1.1875rem]" },
};

const letters = ["L", "o", "u", "m", "i", "l", "a", "b"];

const Wordmark = ({ size = "sm", animated = false, className, onAnimationComplete }: WordmarkProps) => {
  const s = sizeMap[size];

  return (
    <span
      className={cn(
        "relative inline-flex select-none items-baseline font-display font-bold uppercase leading-none tracking-[0.2em] text-current",
        animated && "brand-wordmark-animated",
        s.root,
        className,
      )}
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === "brandShine") onAnimationComplete?.();
      }}
    >
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={cn("brand-wordmark-letter leading-none", `brand-wordmark-letter-${index + 1}`)}
        >
          {letter}
        </span>
      ))}
      <span className="brand-wordmark-dot-x relative ml-[0.08em] inline-block leading-none">
        <span className="brand-wordmark-dot inline-block h-[0.42em] w-[0.42em] rounded-full bg-accent align-baseline" />
        {animated && <span className="brand-wordmark-ripple" />}
      </span>
      {animated && <span className="brand-wordmark-shine" />}
    </span>
  );
};

export default Wordmark;
