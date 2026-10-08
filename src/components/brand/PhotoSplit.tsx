import { ReactNode } from "react";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { cn } from "@/lib/utils";

interface PhotoSplitProps {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}

/** Shared human-photography section: large rounded photo beside copy. */
const PhotoSplit = ({ image, alt, eyebrow, title, children, reverse, className }: PhotoSplitProps) => (
  <section className={cn("section-padding border-t border-border", className)}>
    <div className="section-container grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
      <Reveal className={cn("photo-frame aspect-[3/2]", reverse && "lg:order-2")}>
        <img src={image} alt={alt} width={1600} height={1072} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </Reveal>
      <Reveal delay={80}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-5 text-3xl font-semibold leading-tight lg:text-5xl">{title}</h2>
        <div className="mt-6 space-y-5 text-lede">{children}</div>
      </Reveal>
    </div>
  </section>
);

export default PhotoSplit;
