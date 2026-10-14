import { supabase } from "@/integrations/supabase/client";

/** Anonymous first-party page views (no IP, no identity) for the daily brief. */
const SESSION_KEY = "loumilab-visit";

function classify(ref: string): string {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (params.get("fbclid")) return "facebook";
  if (utm) return utm.toLowerCase().slice(0, 40);
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host === window.location.hostname.replace(/^www\./, "")) return "internal";
    if (/facebook|fb\.com/.test(host)) return "facebook";
    if (/instagram/.test(host)) return "instagram";
    if (/google\./.test(host)) return "google";
    if (/bing\./.test(host)) return "bing";
    if (/linkedin|lnkd/.test(host)) return "linkedin";
    if (/t\.co$|twitter|x\.com/.test(host)) return "x";
    return host.slice(0, 40);
  } catch {
    return "direct";
  }
}

function visit(): { id: string; source: string } {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const v = { id: crypto.randomUUID().replace(/-/g, ""), source: classify(document.referrer) };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(v)); } catch { /* ignore */ }
  return v;
}

export function recordSiteView(path: string) {
  const host = window.location.hostname;
  if (host === "localhost" || host.includes("id-preview") || host.includes("lovableproject")) return;
  if (path.startsWith("/admin") || path.startsWith("/login")) return;
  const v = visit();
  const device = window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
  supabase.rpc("record_page_view", { _path: path, _referrer: v.source, _session: v.id, _device: device }).then(() => {});
}
