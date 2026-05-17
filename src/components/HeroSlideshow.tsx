import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

import slide1 from "@/assets/slides/slide-1.jpg";
import slide2 from "@/assets/slides/slide-2.jpg";
import slide3 from "@/assets/slides/slide-3.jpg";
import slide4 from "@/assets/slides/slide-4.jpg";
import slide5 from "@/assets/slides/slide-5.jpg";

const slides = [
  { src: slide1, alt: "Team collaboration" },
  { src: slide2, alt: "Modern workspace" },
  { src: slide3, alt: "Creative process" },
  { src: slide4, alt: "Professional meeting" },
  { src: slide5, alt: "Innovation and technology" },
];

interface HeroSlideshowProps {
  children: React.ReactNode;
  autoPlayInterval?: number;
}

const HeroSlideshow = ({ children, autoPlayInterval = 5000 }: HeroSlideshowProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi || isPaused) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [emblaApi, isPaused, autoPlayInterval]);

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slideshow Background */}
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className="relative flex-[0_0_100%] min-w-0 h-full"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                width={1920}
                height={1080}
                loading={index === 0 ? "eager" : "lazy"}
                decoding={index === 0 ? "sync" : "async"}
                fetchPriority={index === 0 ? "high" : "low"}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-out",
                  selectedIndex === index && "scale-105"
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 video-overlay pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              selectedIndex === index
                ? "bg-accent w-8"
                : "bg-white/30 hover:bg-white/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlideshow;
