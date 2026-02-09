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
          <linearGradient id="bulbGradient" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(217 91% 70%)" />
            <stop offset="100%" stopColor="hsl(217 91% 50%)" />
          </linearGradient>
          <linearGradient id="glowGradient" x1="32" y1="12" x2="32" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(217 91% 85%)" />
            <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer glow */}
        <ellipse
          cx="32"
          cy="26"
          rx="14"
          ry="16"
          fill="hsl(217 91% 60% / 0.15)"
          filter="url(#glow)"
        />
        
        {/* Bulb body */}
        <path
          d="M32 8C22.06 8 14 16.06 14 26C14 32.2 17.3 37.6 22.2 40.6C23.4 41.4 24 42.8 24 44.2V46C24 47.1 24.9 48 26 48H38C39.1 48 40 47.1 40 46V44.2C40 42.8 40.6 41.4 41.8 40.6C46.7 37.6 50 32.2 50 26C50 16.06 41.94 8 32 8Z"
          fill="url(#bulbGradient)"
          filter="url(#glow)"
        />
        
        {/* Inner glow/filament */}
        <ellipse
          cx="32"
          cy="26"
          rx="8"
          ry="10"
          fill="url(#glowGradient)"
          opacity="0.6"
        />
        
        {/* Base rings */}
        <rect x="25" y="48" width="14" height="3" rx="1" fill="hsl(217 91% 55%)" />
        <rect x="26" y="52" width="12" height="3" rx="1" fill="hsl(217 91% 50%)" />
        <rect x="28" y="56" width="8" height="2" rx="1" fill="hsl(217 91% 45%)" />
        
        {/* Highlight */}
        <ellipse
          cx="26"
          cy="20"
          rx="4"
          ry="6"
          fill="white"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

export default LumilabLogo;
