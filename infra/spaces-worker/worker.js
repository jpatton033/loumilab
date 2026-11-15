// Loumilab Spaces edge host: serves <slug>.spaces.loumilab.com from R2.
// R2 layout: live/<slug>.json -> {app, ver}; v/<app>/<ver>/<path> -> file. Control API on control host only.
const CONTROL_HOST = "deploy.spaces.loumilab.com";
const SUFFIX = ".spaces.loumilab.com";
const SEC = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000",
};
const eq = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const safeKey = (k) => /^(v\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[^\0]+|live\/[a-z0-9-]{1,60}\.json)$/.test(k) && !k.split("/").includes("..");

async function control(req, env, url) {
  if (!eq(req.headers.get("Authorization") || "", `Bearer ${env.DEPLOY_SECRET}`)) return new Response("Forbidden", { status: 403 });
  const key = decodeURIComponent(url.pathname.replace(/^\/obj\//, ""));
  if (!url.pathname.startsWith("/obj/") || !safeKey(key)) return new Response("Bad key", { status: 400 });
  if (req.method === "PUT") { await env.SITES.put(key, req.body, { httpMetadata: { contentType: req.headers.get("X-Content-Type") || "application/octet-stream" } }); return new Response("ok"); }
  if (req.method === "DELETE") { await env.SITES.delete(key); return new Response("ok"); }
  if (req.method === "GET") { const o = await env.SITES.get(key); return o ? new Response(o.body) : new Response("Not found", { status: 404 }); }
  return new Response("Method not allowed", { status: 405 });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const host = url.hostname.toLowerCase();
    if (host === CONTROL_HOST) return control(req, env, url);
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: SEC });
    if (!host.endsWith(SUFFIX)) return new Response("Not found", { status: 404, headers: SEC });
    const slug = host.slice(0, -SUFFIX.length);
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) return new Response("Not found", { status: 404, headers: SEC });
    const ptr = await env.SITES.get(`live/${slug}.json`);
    if (!ptr) return new Response("This Spaces app isn't published.", { status: 404, headers: SEC });
    const { app, ver, entry = "index.html" } = await ptr.json();
    const base = `v/${app}/${ver}/`;
    let path;
    try { path = decodeURIComponent(url.pathname).replace(/^\/+/, ""); } catch { return new Response("Bad path", { status: 400, headers: SEC }); }
    if (path.split("/").includes("..") || path.includes("\0")) return new Response("Bad path", { status: 400, headers: SEC });
    if (path === "" || path.endsWith("/")) path += entry === "index.html" || path ? "index.html" : entry;
    let obj = await env.SITES.get(base + path);
    const last = path.split("/").pop();
    const isAsset = /\.[a-z0-9]{1,8}$/i.test(last) && !/\.html?$/i.test(last);
    if (!obj && !isAsset) obj = (await env.SITES.get(base + path.replace(/\/?$/, "/index.html"))) || (await env.SITES.get(base + entry)); // SPA fallback
    if (!obj) return new Response("Not found", { status: 404, headers: SEC });
    const ct = obj.httpMetadata?.contentType || "application/octet-stream";
    const html = ct.startsWith("text/html");
    return new Response(req.method === "HEAD" ? null : obj.body, { headers: {
      ...SEC, "Content-Type": ct, ETag: obj.httpEtag, "X-Spaces-Version": ver,
      "Cache-Control": html ? "no-cache" : "public, max-age=300",
    } });
  },
};
