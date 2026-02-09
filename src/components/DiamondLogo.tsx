import { cn } from "@/lib/utils";

interface DiamondLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

const sizes = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-20 h-20",
};

const DiamondLogo = ({ className, size = "md", animated = false }: DiamondLogoProps) => {
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
        <linearGradient id="diamond-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(43 55% 69%)" />
          <stop offset="50%" stopColor="hsl(43 55% 59%)" />
          <stop offset="100%" stopColor="hsl(35 65% 45%)" />
        </linearGradient>
        <linearGradient id="diamond-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(43 55% 85%)" />
          <stop offset="100%" stopColor="hsl(43 55% 65%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Main diamond shape */}
      <path
        d="M24 4L44 24L24 44L4 24L24 4Z"
        fill="url(#diamond-gradient)"
        stroke="hsl(43 55% 70%)"
        strokeWidth="0.5"
      />
      
      {/* Top facet highlight */}
      <path
        d="M24 4L44 24L24 20L4 24L24 4Z"
        fill="url(#diamond-highlight)"
        opacity="0.6"
      />
      
      {/* Center line */}
      <path
        d="M4 24L24 20L44 24"
        stroke="hsl(43 55% 45%)"
        strokeWidth="0.5"
        opacity="0.5"
      />
      
      {/* Inner diamond accent */}
      <path
        d="M24 12L34 24L24 36L14 24L24 12Z"
        fill="none"
        stroke="hsl(43 55% 75%)"
        strokeWidth="0.5"
        opacity="0.4"
      />
    </svg>
  );
};

export default DiamondLogo;
