import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CONSENT_EVENT,
  GOOGLE_TAG_ID,
  META_PIXEL_ID,
  initTracking,
  needsConsent,
  readConsent,
  track,
  writeConsent,
} from "@/lib/tracking";

const enabled = !!(META_PIXEL_ID || GOOGLE_TAG_ID);
export const OPEN_COOKIE_SETTINGS = "loumilab:open-cookie-settings";

/** Initializes tags, reports SPA page views, and shows the regional consent banner. */
const ConsentAndTracking = () => {
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    initTracking();
    needsConsent().then((req) => {
      if (req && !readConsent()) setShow(true);
    });
    const open = () => setShow(true);
    const close = () => {
      const c = readConsent();
      if (!c) return;
      setShow(false);
      // Count the current page once the visitor accepts (earlier view was blocked, not replayed).
      if (c.choice === "granted" && !window.location.pathname.startsWith("/admin")) track("PageView");
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, open);
    window.addEventListener(CONSENT_EVENT, close);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS, open);
      window.removeEventListener(CONSENT_EVENT, close);
    };
  }, []);

  useEffect(() => {
    if (!enabled || pathname.startsWith("/admin")) return;
    const t = setTimeout(() => track("PageView"), 300);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;
  return (
    <div role="dialog" aria-label="Cookie choices" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-3xl border border-border bg-background p-5 shadow-lg">
      <p className="text-sm text-foreground">
        We'd like to use advertising cookies from Meta and Google to measure which ads bring visitors and sign-ups.
        No names or emails are shared. You can change this anytime from “Cookie settings” in the footer.{" "}
        <Link to="/orders/privacy" className="underline">Privacy policy</Link>
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => { writeConsent("denied"); setShow(false); }}>
          Reject
        </Button>
        <Button size="sm" className="flex-1" onClick={() => { writeConsent("granted"); setShow(false); }}>
          Accept
        </Button>
      </div>
    </div>
  );
};

export default ConsentAndTracking;
