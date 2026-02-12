import { cn } from "@/lib/utils";

interface DiamondLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  variant?: "gold" | "silver";
}

const sizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-20 h-20",
};

const DiamondLogo = ({ className, size = "md", animated = false, variant = "gold" }: DiamondLogoProps) => {
  const isGold = variant === "gold";
  const gradId = `diamond-gradient-${variant}`;
  const hlId = `diamond-highlight-${variant}`;

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        sizes[size],
        animated && "animate-pulse-glow",
        className
      )}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isGold ? "hsl(43 55% 69%)" : "hsl(0 0% 50%)"} />
          <stop offset="50%" stopColor={isGold ? "hsl(43 55% 59%)" : "hsl(0 0% 35%)"} />
          <stop offset="100%" stopColor={isGold ? "hsl(35 65% 45%)" : "hsl(0 0% 10%)"} />
        </linearGradient>
        <linearGradient id={hlId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isGold ? "hsl(43 55% 85%)" : "hsl(0 0% 95%)"} />
          <stop offset="100%" stopColor={isGold ? "hsl(43 55% 65%)" : "hsl(0 0% 60%)"} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Main diamond shape */}
      <path
        d="M24 4L44 24L24 44L4 24L24 4Z"
        fill={`url(#${gradId})`}
        stroke={isGold ? "hsl(43 55% 70%)" : "hsl(0 0% 55%)"}
        strokeWidth="0.5"
      />
      
      {/* Top facet highlight */}
      <path
        d="M24 4L44 24L24 20L4 24L24 4Z"
        fill={`url(#${hlId})`}
        opacity="0.6"
      />
      
      {/* Center line */}
      <path
        d="M4 24L24 20L44 24"
        stroke={isGold ? "hsl(43 55% 45%)" : "hsl(0 0% 30%)"}
        strokeWidth="0.5"
        opacity="0.5"
      />
      
      {/* Inner diamond accent */}
      <path
        d="M24 12L34 24L24 36L14 24L24 12Z"
        fill="none"
        stroke={isGold ? "hsl(43 55% 75%)" : "hsl(217 91% 60%)"}
        strokeWidth="0.5"
        opacity={isGold ? "0.4" : "0.7"}
      />
    </svg>
  );
};

export default DiamondLogo;
