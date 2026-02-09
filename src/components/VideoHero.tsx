import { useState, useRef, useEffect } from "react";

interface VideoHeroProps {
  videoSrc: string;
  children: React.ReactNode;
  className?: string;
}

const VideoHero = ({ videoSrc, children, className = "" }: VideoHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.75; // Slow down for more elegant feel
    }
  }, []);

  return (
    <section className={`relative min-h-screen flex items-center overflow-hidden ${className}`}>
      {/* Fallback gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background" />
      
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-60" : "opacity-0"
        }`}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      
      {/* Overlay for text readability */}
      <div className="absolute inset-0 video-overlay" />
      
      {/* Subtle vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, hsl(240 6% 4% / 0.4) 100%)"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "1s" }}>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-accent to-transparent" />
      </div>
    </section>
  );
};

export default VideoHero;
