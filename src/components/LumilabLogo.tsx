import { cn } from "@/lib/utils";

interface LumilabLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const LumilabLogo = ({ size = "md", animated = false, className }: LumilabLogoProps) => {
  return (
    <div
      className={cn(
        sizeMap[size],
        animated && "animate-pulse-glow",
        "relative",
        className
      )}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Radial gradient for inner glow core */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(217 91% 95%)" />
            <stop offset="40%" stopColor="hsl(217 91% 70%)" />
            <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0" />
          </radialGradient>
          
          {/* Gradient for the bulb outline */}
          <linearGradient id="outlineGradient" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(217 91% 70%)" />
            <stop offset="100%" stopColor="hsl(217 91% 50%)" />
          </linearGradient>
          
          {/* Soft outer glow filter */}
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Sharp inner glow filter */}
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Subtle ambient glow behind everything */}
        <circle
          cx="32"
          cy="28"
          r="20"
          fill="hsl(217 91% 60% / 0.15)"
          filter="url(#softGlow)"
        />
        
        {/* Main bulb outline - clean geometric circle */}
        <circle
          cx="32"
          cy="28"
          r="18"
          fill="none"
          stroke="url(#outlineGradient)"
          strokeWidth="2.5"
          filter="url(#innerGlow)"
        />
        
        {/* Inner light core - bright center */}
        <circle
          cx="32"
          cy="28"
          r="8"
          fill="url(#coreGlow)"
          filter="url(#innerGlow)"
        />
        
        {/* Central bright dot */}
        <circle
          cx="32"
          cy="28"
          r="3"
          fill="hsl(217 91% 95%)"
        />
      </svg>
    </div>
  );
};

export default LumilabLogo;
