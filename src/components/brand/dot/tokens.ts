import { useEffect, useState } from "react";

/** One motion personality for every dot behaviour (Arrive, Connect, Focus, Act, Reveal). */
export const DOT_EASE = "cubic-bezier(.22,.61,.36,1)";
export const DOT_SPEED = { fast: 240, base: 800, signature: 1200 } as const;
export const DOT_SIZE = { action: 6, section: 9, page: 12 } as const;

export const useDotMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => setReduced(mq.matches);
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  return { reduced };
};
