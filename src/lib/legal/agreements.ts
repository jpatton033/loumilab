import { supabase } from "@/integrations/supabase/client";

export const SPACES_AGREEMENT = "spaces-hosting";
export const TERMS_URL = "/orders/terms";
export const PRIVACY_URL = "/orders/privacy";
export const CHECKBOX_LABEL = "I agree to the Loumilab Terms of Service and Spaces Hosting & Acceptable Use Agreement, and acknowledge the Privacy Policy.";

export type AgreementVersion = {
  id: string; document_id: string; title: string; version: string; content: string;
  content_hash: string; effective_date: string | null; published_at: string | null;
};

/** Numbered top-level sections ("## 1. Title") in an agreement body. */
export function agreementSections(content: string): { n: number; title: string }[] {
  return [...content.matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => ({ n: Number(m[1]), title: m[2].trim() }));
}

/** SHA-256 hex of the exact text, matching the database fingerprint. */
export async function contentHash(content: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The currently effective published version, or null while none is published. */
export async function fetchCurrentAgreement(slug = SPACES_AGREEMENT): Promise<AgreementVersion | null> {
  const { data, error } = await supabase.rpc("legal_current_version", { _slug: slug });
  if (error) throw error;
  return (data?.[0] as AgreementVersion | undefined) ?? null;
}

export async function needsAgreement(slug = SPACES_AGREEMENT): Promise<boolean> {
  const { data, error } = await supabase.rpc("legal_needs_acceptance", { _slug: slug });
  if (error) throw error;
  return data === true;
}

export type AcceptMethod = "signup_checkbox" | "acceptance_prompt";
export async function acceptAgreement(v: Pick<AgreementVersion, "id" | "content_hash">, method: AcceptMethod, workspaceId?: string | null) {
  const { error } = await supabase.rpc("legal_accept", { _version: v.id, _hash: v.content_hash, _method: method, _workspace: workspaceId ?? undefined });
  if (error) throw error;
}

/* Sign-up acceptance waits here (version + fingerprint shown) until the account has a session;
   the server re-checks it, and the Spaces dashboard prompt covers any gap. */
const PENDING = "loumilab.pendingAgreement";
export function rememberPendingAcceptance(v: Pick<AgreementVersion, "id" | "content_hash">) {
  try { localStorage.setItem(PENDING, JSON.stringify({ id: v.id, content_hash: v.content_hash })); } catch { /* storage off */ }
}
export async function flushPendingAcceptance(): Promise<void> {
  let raw: string | null = null;
  try { raw = localStorage.getItem(PENDING); } catch { return; }
  if (!raw) return;
  try {
    const v = JSON.parse(raw) as { id: string; content_hash: string };
    await acceptAgreement(v, "signup_checkbox");
  } catch { /* outdated version: the dashboard prompt asks again */ }
  try { localStorage.removeItem(PENDING); } catch { /* ignore */ }
}
