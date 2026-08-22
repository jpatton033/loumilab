import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
  /** Direction the element travels in from. */
  from?: "bottom" | "top" | "left" | "right" | "none";
}

const hidden: Record<NonNullable<RevealProps["from"]>, string> = {
  bottom: "opacity-0 translate-y-6",
  top: "opacity-0 -translate-y-6",
  left: "opacity-0 -translate-x-6",
  right: "opacity-0 translate-x-6",
  none: "opacity-0",
};

const Reveal = ({ children, delay = 0, className, as: Tag = "div", from = "bottom" }: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms`, transitionTimingFunction: "var(--ease-brand)" }}
      className={cn(
        "transition-all duration-700 will-change-transform",
        visible ? "opacity-100 translate-x-0 translate-y-0" : hidden[from],
        className
      )}
    >
      {children}
    </Tag>
  );
};


export default Reveal;
