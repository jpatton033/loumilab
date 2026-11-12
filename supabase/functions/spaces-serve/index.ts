import { admin } from "../_shared/auth.ts";
import { verifyServe } from "../_shared/spacesToken.ts";
import { contentType } from "../_shared/spacesSpec.ts";

/**
 * Serves files of one app version. Every request (not just the page) needs a valid
 * signed, expiring token in the path: /spaces-serve/<token>/<file>. Runs on the
 * backend's own origin, never on loumilab.com, and forces a sandboxed opaque origin.
 */
const base = {
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups",
  "Referrer-Policy": "no-referrer",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { ...base, "Access-Control-Allow-Headers": "*" } });
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: base });
  const parts = new URL(req.url).pathname.split("/spaces-serve/")[1]?.split("/") ?? [];
  const [token, ...rest] = parts;
  const claims = token ? await verifyServe(token) : null;
  if (!claims) return new Response("Link expired. Reload the app.", { status: 403, headers: base });
  let path = decodeURIComponent(rest.join("/")) || "index.html";
  if (path.endsWith("/")) path += "index.html";
  if (path.split("/").includes("..")) return new Response("Bad path", { status: 400, headers: base });
  const { data, error } = await admin.storage.from("spaces-artifacts").download(`sites/${claims.a}/${claims.v}/${path}`);
  if (error || !data) return new Response("Not found", { status: 404, headers: base });
  return new Response(req.method === "HEAD" ? null : data, {
    headers: { ...base, "Content-Type": contentType(path), "Cache-Control": "private, max-age=300" },
  });
});
