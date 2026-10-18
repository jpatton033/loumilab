import { cn } from "@/lib/utils";
import logo from "@/assets/brand/loumilab-logo.png";

type WordmarkSize = "sm" | "md";

interface WordmarkProps {
  size?: WordmarkSize;
  animated?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

const sizeMap: Record<WordmarkSize, string> = {
  sm: "h-[0.95rem] lg:h-[1.05rem]",
  md: "h-[1.15rem]",
};

/** Renders the exact uploaded Loumilab logo image. */
const Wordmark = ({ size = "sm", animated = false, className, onAnimationComplete }: WordmarkProps) => (
  <span className={cn("inline-flex select-none items-center", className)}>
    <img
      src={logo}
      alt="Loumilab"
      width={1584}
      height={160}
      decoding="async"
      draggable={false}
      className={cn("block w-auto", sizeMap[size], animated && "logo-img-reveal")}
      onAnimationEnd={() => onAnimationComplete?.()}
    />
  </span>
);

export default Wordmark;
