/**
 * Canonical origin for links we email out.
 *
 * The published `*.lovable.app` host 302-redirects to the custom domain, and that
 * redirect strips the URL fragment that carries Supabase's recovery tokens. So any
 * emailed auth link must point straight at the canonical domain instead.
 */
const CANONICAL_ORIGIN = "https://loumilab.com";

const REDIRECTING_HOSTS = ["loumilab.lovable.app", "www.loumilab.com", "loumilab.com"];

export const authEmailOrigin = (): string => {
  if (typeof window === "undefined") return CANONICAL_ORIGIN;
  const host = window.location.hostname;
  // Preview / local development keeps using its own origin so testing still works.
  if (REDIRECTING_HOSTS.includes(host)) return CANONICAL_ORIGIN;
  return window.location.origin;
};

export const passwordResetRedirectUrl = (): string => `${authEmailOrigin()}/reset-password`;
