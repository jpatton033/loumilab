/**
 * Marketing conversion tracking (Meta Pixel, Google tag).
 *
 * Tags load only when an ID is configured below AND advertising consent is
 * allowed for the visitor (granted, or outside consent-required regions).
 * Events are never queued or replayed: an event blocked when it happens is
 * dropped. No customer identifiers are ever sent.
 */

/** Meta Pixel ID — paste from Meta Events Manager. Empty = Pixel off. */
export const META_PIXEL_ID = "1096079062830163";
/** Google Tag Manager container ID (GTM-…). Empty = Google tag off. */
export const GOOGLE_TAG_ID = "GTM-M69KVPPK";

export const CONSENT_KEY = "loumilab-ad-consent";
export const CONSENT_NOTICE_VERSION = "2026-10-14";
export const CONSENT_EVENT = "loumilab:consent-changed";

// EEA + UK + Switzerland.
const CONSENT_COUNTRIES = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH".split(" "),
);

export interface ConsentRecord {
  choice: "granted" | "denied";
  at: string;
  notice: string;
  /** History of earlier choices, kept as evidence after withdrawal. */
  history?: { choice: "granted" | "denied"; at: string; notice: string }[];
}

export const readConsent = (): ConsentRecord | null => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord) : null;
  } catch {
    return null;
  }
};

export const writeConsent = (choice: "granted" | "denied") => {
  const prev = readConsent();
  const history = prev ? [...(prev.history ?? []), { choice: prev.choice, at: prev.at, notice: prev.notice }] : [];
  const rec: ConsentRecord = { choice, at: new Date().toISOString(), notice: CONSENT_NOTICE_VERSION, history };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(rec));
  applyConsent();
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

let regionPromise: Promise<boolean> | null = null;
/** True when the visitor is (or may be) in a consent-required region. */
export const needsConsent = (): Promise<boolean> => {
  if (!regionPromise) {
    regionPromise = (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        const res = await fetch("/cdn-cgi/trace", { signal: ctrl.signal });
        clearTimeout(t);
        if (!res.ok) return true;
        const loc = /(?:^|\n)loc=([A-Z0-9]+)/.exec(await res.text())?.[1];
        if (!loc || loc === "XX" || loc === "T1") return true;
        return CONSENT_COUNTRIES.has(loc);
      } catch {
        return true;
      }
    })();
  }
  return regionPromise;
};

let regulated: boolean | null = null;
const allowed = () => {
  const c = readConsent();
  if (c?.choice === "denied") return false;
  if (c?.choice === "granted") return true;
  return regulated === false;
};

type Fn = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fn & { callMethod?: Fn; queue?: unknown[]; loaded?: boolean; version?: string; push?: Fn };
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: Fn;
  }
}

let metaLoaded = false;
let googleLoaded = false;

const loadMeta = () => {
  if (metaLoaded || !META_PIXEL_ID) return;
  metaLoaded = true;
  /* eslint-disable */
  const f: any = window;
  if (!f.fbq) {
    const n: any = (f.fbq = function (...a: unknown[]) {
      n.callMethod ? n.callMethod(...a) : n.queue.push(a);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  /* eslint-enable */
  window.fbq!("consent", "grant");
  window.fbq!("init", META_PIXEL_ID);
};

const loadGoogle = () => {
  if (googleLoaded || !GOOGLE_TAG_ID) return;
  googleLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("consent", "default", { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" });
  if (GOOGLE_TAG_ID.startsWith("GTM-")) {
    // Google Tag Manager container: tags inside GTM decide what is measured.
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`;
    document.head.appendChild(s);
  } else {
    // Direct Google tag (G-… or AW-…).
    window.gtag("set", "developer_id.dZjgwMW", true);
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_TAG_ID, { send_page_view: false });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
    document.head.appendChild(s);
  }
};

export const applyConsent = () => {
  if (allowed()) {
    loadMeta();
    loadGoogle();
  } else {
    if (metaLoaded) window.fbq?.("consent", "revoke");
    if (googleLoaded) window.gtag?.("consent", "update", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
  }
};

export const initTracking = async () => {
  if (!META_PIXEL_ID && !GOOGLE_TAG_ID) return;
  regulated = await needsConsent();
  applyConsent();
  window.addEventListener("storage", (e) => e.key === CONSENT_KEY && applyConsent());
};

/** Conversion names map to Meta standard events and GA4 recommended events. */
const MAP = {
  PageView: { meta: "PageView", google: "page_view" },
  Lead: { meta: "Lead", google: "generate_lead" },
  CompleteRegistration: { meta: "CompleteRegistration", google: "sign_up" },
  Subscribe: { meta: "Subscribe", google: "newsletter_signup" },
  StartOnboarding: { meta: "InitiateCheckout", google: "begin_checkout" },
  StorePublished: { meta: "StartTrial", google: "store_published" },
  ViewPricing: { meta: "ViewContent", google: "view_item_list" },
  ViewService: { meta: "ViewContent", google: "view_item" },
  SelectPackage: { meta: "CustomizeProduct", google: "select_item" },
  IntakeStart: { meta: "Contact", google: "intake_start" },
  IntakeSubmit: { meta: "Lead", google: "intake_submit" },
  BeginCheckout: { meta: "InitiateCheckout", google: "begin_checkout" },
  Purchase: { meta: "Purchase", google: "purchase" },
} as const;
export type ConversionName = keyof typeof MAP;

export const track = (name: ConversionName, params: Record<string, string | number> = {}) => {
  if (!allowed()) return;
  const m = MAP[name];
  if (metaLoaded) window.fbq?.("track", m.meta, params);
  if (googleLoaded) {
    // GTM custom-event triggers read the `event` key from dataLayer.
    window.dataLayer?.push({ event: m.google, ...(name === "PageView" ? { page_path: location.pathname } : {}), ...params });
  }
};

/** Store creation conversion: GTM custom event `store_created` (no identifiers). */
export const trackStoreCreated = (params: Record<string, string | number> = {}) => {
  if (!allowed() || !googleLoaded) return;
  window.dataLayer?.push({ event: "store_created", ...params });
};

/** CTA click (GTM only, so Meta conversions aren't double-counted). */
export const trackCtaClick = (location: string, variant: string) => {
  if (!allowed() || !googleLoaded) return;
  window.dataLayer?.push({ event: "cta_click", cta_location: location, cta_variant: variant });
};

/** Promo banner seen (GTM only), once per campaign + surface per session. */
export const trackPromoViewed = (promoId: string, surface: string) => {
  if (!allowed() || !googleLoaded) return;
  const key = `loumilab-promo-viewed:${promoId}:${surface}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* storage blocked: still send */ }
  window.dataLayer?.push({ event: "promo_viewed", promo_id: promoId, promo_surface: surface });
};

/** Builder started: first setup step completed, once per browser session (GTM only). */
export const trackBuilderStarted = () => {
  if (!allowed() || !googleLoaded) return;
  try {
    if (sessionStorage.getItem("loumilab-builder-started")) return;
    sessionStorage.setItem("loumilab-builder-started", "1");
  } catch { /* storage blocked: still send */ }
  window.dataLayer?.push({ event: "builder_started" });
};
