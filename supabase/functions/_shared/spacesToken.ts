const enc = new TextEncoder();
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
let keyP: Promise<CryptoKey> | null = null;
const key = () => (keyP ??= crypto.subtle.importKey("raw", enc.encode(Deno.env.get("SPACES_SIGNING_KEY")!), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]));

export interface ServeClaims { a: string; v: string; e: number }
export async function signServe(c: ServeClaims) {
  const body = b64u(enc.encode(JSON.stringify(c)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(), enc.encode(body)));
  return `${body}.${b64u(sig)}`;
}
export async function verifyServe(tok: string): Promise<ServeClaims | null> {
  const [body, sig] = tok.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64u(sig), enc.encode(body));
    if (!ok) return null;
    const c = JSON.parse(new TextDecoder().decode(fromB64u(body))) as ServeClaims;
    return c.e > Date.now() / 1000 ? c : null;
  } catch { return null; }
}
