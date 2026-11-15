// Real edge hosting for Spaces: Cloudflare Worker "loumilab-spaces" + R2 bucket, apps at <slug>.spaces.loumilab.com.
import { admin } from "./auth.ts";
import { contentType } from "./spacesSpec.ts";

export const EDGE_SUFFIX = "spaces.loumilab.com";
const CONTROL = `https://deploy.${EDGE_SUFFIX}/obj/`;
const CF = "https://connector-gateway.lovable.dev/cloudflare/client/v4";
const ACCOUNT = "d7014aa99cf391547ff882aa800309f4";
const ZONE = "5229a256a4e7e2e2e5c641f98301008a";
export const edgeUrl = (slug: string) => `https://${slug}.${EDGE_SUFFIX}`;

const ctl = async (method: string, key: string, body?: BodyInit, ct?: string) => {
  const secret = Deno.env.get("SPACES_DEPLOY_SECRET");
  if (!secret) throw new Error("Edge hosting key missing");
  for (let i = 0; i < 3; i++) {
    const r = await fetch(CONTROL + key, { method, body, headers: { Authorization: `Bearer ${secret}`, ...(ct ? { "X-Content-Type": ct } : {}) } });
    if (r.ok) { await r.body?.cancel(); return; }
    if (r.status < 500) throw new Error(`Edge ${method} ${r.status}: ${await r.text()}`);
    await new Promise((s) => setTimeout(s, 400 * (i + 1)));
  }
  throw new Error(`Edge ${method} failed`);
};

async function ensureHostname(slug: string) {
  const lk = Deno.env.get("LOVABLE_API_KEY"), ck = Deno.env.get("CLOUDFLARE_API_KEY");
  if (!lk || !ck) throw new Error("Cloudflare connection missing");
  const r = await fetch(`${CF}/accounts/${ACCOUNT}/workers/domains`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json" },
    body: JSON.stringify({ hostname: `${slug}.${EDGE_SUFFIX}`, service: "loumilab-spaces", environment: "production", zone_id: ZONE }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) throw new Error(`Hostname setup failed [${r.status}]: ${JSON.stringify(j.errors ?? j).slice(0, 300)}`);
}

/** Copies a stored version to the edge (immutable per version) and returns the files copied. */
async function copyVersion(appId: string, verId: string) {
  const store = admin.storage.from("spaces-artifacts");
  const prefix = `sites/${appId}/${verId}`;
  const paths: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    const { data } = await store.list(dir, { limit: 1000 });
    for (const it of data ?? []) { const full = `${dir}/${it.name}`; if (it.id === null) await walk(full); else paths.push(full); }
  };
  await walk(prefix);
  if (!paths.length) throw new Error("No compiled files stored for this version");
  const queue = [...paths];
  const worker = async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      const { data, error } = await store.download(p);
      if (error || !data) throw new Error(`Read failed: ${p}`);
      const rel = p.slice(prefix.length + 1);
      await ctl("PUT", `v/${appId}/${verId}/${rel.split("/").map(encodeURIComponent).join("/")}`, await data.arrayBuffer(), contentType(rel));
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return paths.length;
}

async function verify(slug: string, verId: string) {
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(edgeUrl(slug) + "/", { headers: { "Cache-Control": "no-cache" } });
      await r.body?.cancel();
      if (r.ok && r.headers.get("x-spaces-version") === verId) return true;
    } catch { /* DNS/cert may still be provisioning */ }
    await new Promise((s) => setTimeout(s, 3000));
  }
  return false;
}

type App = { id: string; slug: string; visibility: string; status: string };

/** Make the edge match the app: public + active -> serve version; otherwise take it offline. Records real state. */
export async function syncEdge(app: App, verId: string | null, entry = "index.html") {
  const set = (v: Record<string, unknown>) => admin.from("spaces_apps").update({ ...v, edge_checked_at: new Date().toISOString() }).eq("id", app.id);
  if (!verId || app.visibility !== "link" || app.status !== "active") {
    try { await ctl("DELETE", `live/${app.slug}.json`); } catch { /* not there */ }
    await set({ edge_status: "off", edge_version_id: null, edge_error: null });
    return { edge_status: "off" as const };
  }
  await set({ edge_status: "deploying", edge_error: null });
  try {
    await copyVersion(app.id, verId);
    await ensureHostname(app.slug);
    await ctl("PUT", `live/${app.slug}.json`, JSON.stringify({ app: app.id, ver: verId, entry }), "application/json");
    const ok = await verify(app.slug, verId);
    const edge_status = ok ? "live" : "pending";
    await set({ edge_status, edge_version_id: verId, edge_error: ok ? null : "Files are in place; the address is still activating. Check again in a minute." });
    return { edge_status, url: edgeUrl(app.slug) };
  } catch (e) {
    await set({ edge_status: "failed", edge_error: (e as Error).message.slice(0, 500) });
    return { edge_status: "failed" as const, error: (e as Error).message };
  }
}

export async function recheckEdge(app: App & { edge_version_id: string | null }) {
  if (!app.edge_version_id) return { edge_status: "off" };
  const ok = await verify(app.slug, app.edge_version_id);
  await admin.from("spaces_apps").update({ edge_status: ok ? "live" : "pending", edge_error: ok ? null : "Still activating.", edge_checked_at: new Date().toISOString() }).eq("id", app.id);
  return { edge_status: ok ? "live" : "pending", url: edgeUrl(app.slug) };
}
