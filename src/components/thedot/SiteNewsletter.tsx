import { useLocation } from "react-router-dom";
import TheDotSignup from "./TheDotSignup";

const SKIP = ["/the-dot", "/resources"];

const SiteNewsletter = () => {
  const { pathname } = useLocation();
  if (SKIP.some((p) => pathname.startsWith(p))) return null;
  return (
    <section className="border-t border-border bg-background" aria-label="Join our newsletter">
      <div className="section-container py-16 lg:py-20">
        <TheDotSignup source={`footer${pathname}`} variant="inline" heading="Join our newsletter." />
      </div>
    </section>
  );
};

export default SiteNewsletter;
