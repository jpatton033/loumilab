/**
 * Spaces App Specification v1 — the single validator shared by the website,
 * the dashboard and the spaces-api deploy function. Pure TS, no imports.
 */
export const SPEC_VERSION = "1.0";
export const LIMITS = {
  maxZipBytes: 50 * 1024 * 1024,
  maxUnpackedBytes: 150 * 1024 * 1024,
  maxFiles: 3000,
  maxFileBytes: 25 * 1024 * 1024,
};
export const BUILT_WITH = ["traditional", "ai-assisted", "hybrid", "open-source", "unspecified"] as const;

export interface SpacesManifest {
  specVersion: string;
  name: string;
  version: string;
  description?: string;
  type: "static";
  entry: string;
  builtWith?: (typeof BUILT_WITH)[number];
  routing?: "hash" | "none";
  build?: { command?: string; output?: string };
  dependencies?: { external?: { name: string; url?: string; purpose?: string }[] };
  license?: string;
  repository?: string;
}
export interface Report { ok: boolean; errors: string[]; warnings: string[] }

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max = 200) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

export function validateManifest(input: unknown): Report & { manifest?: SpacesManifest } {
  const errors: string[] = [], warnings: string[] = [];
  if (!isObj(input)) return { ok: false, errors: ["spaces.json must be a JSON object."], warnings };
  const m = input;
  if (m.specVersion !== SPEC_VERSION) errors.push(`specVersion must be "${SPEC_VERSION}".`);
  if (!str(m.name, 80)) errors.push("name is required (1–80 characters).");
  if (!str(m.version, 40) || !/^\d+\.\d+\.\d+([-+][\w.-]+)?$/.test(String(m.version))) errors.push("version must be semantic, like 1.0.0.");
  if (m.type !== "static") errors.push('type must be "static" — only static and compiled frontend apps are supported today.');
  if (!str(m.entry, 200) || !String(m.entry).endsWith(".html") || String(m.entry).includes("..")) errors.push("entry must be an .html file inside the package, like index.html.");
  if (m.description !== undefined && !(typeof m.description === "string" && m.description.length <= 500)) errors.push("description must be 500 characters or fewer.");
  if (m.builtWith !== undefined && !BUILT_WITH.includes(m.builtWith as never)) errors.push(`builtWith must be one of: ${BUILT_WITH.join(", ")}.`);
  if (m.routing !== undefined && !["hash", "none"].includes(String(m.routing))) errors.push('routing must be "hash" or "none".');
  if (m.build !== undefined && !isObj(m.build)) errors.push("build must be an object.");
  if (m.dependencies !== undefined) {
    const ext = isObj(m.dependencies) ? m.dependencies.external : undefined;
    if (ext !== undefined && !(Array.isArray(ext) && ext.every((d) => isObj(d) && str(d.name, 100)))) errors.push("dependencies.external must be a list of { name, url?, purpose? }.");
    else if (Array.isArray(ext) && ext.length) warnings.push(`This app depends on ${ext.length} external service(s). They are not hosted by Spaces.`);
  }
  return { ok: errors.length === 0, errors, warnings, manifest: errors.length ? undefined : (m as unknown as SpacesManifest) };
}

const BLOCKED_EXT = /\.(php\d?|py|rb|pl|cgi|exe|dll|so|sh|bat|cmd|ps1|jar|war|asp|aspx|jsp)$/i;
const BLOCKED_NAMES = /(^|\/)(\.env(\..*)?|\.htaccess|\.htpasswd|\.git\/.*|\.DS_Store|__MACOSX\/.*|node_modules\/.*)$/i;
const SKIP = /(^|\/)(__MACOSX\/|\.DS_Store$|\.git\/)/;

export interface FileEntry { path: string; size: number }

/** Finds the app root: the folder holding the entry file (supports zips with one wrapping folder like dist/). */
export function findRoot(paths: string[], entry = "index.html"): string | null {
  const clean = paths.filter((p) => !SKIP.test(p));
  if (clean.includes(entry)) return "";
  const hits = clean.filter((p) => p.endsWith("/" + entry)).map((p) => p.slice(0, -entry.length));
  if (!hits.length) return null;
  hits.sort((a, b) => a.split("/").length - b.split("/").length);
  return hits[0];
}

export function validateFiles(files: FileEntry[], entry = "index.html"): Report & { root: string | null; kept: FileEntry[] } {
  const errors: string[] = [], warnings: string[] = [];
  const all = files.filter((f) => !f.path.endsWith("/") && !SKIP.test(f.path));
  for (const f of all) {
    if (f.path.startsWith("/") || f.path.split("/").includes("..") || f.path.includes("\\")) errors.push(`Unsafe file path: ${f.path}`);
  }
  const root = findRoot(all.map((f) => f.path), entry);
  if (root === null) errors.push(`No ${entry} found. Upload the built output folder (often dist/ or build/), not the source.`);
  const kept = root === null ? [] : all.filter((f) => f.path.startsWith(root)).map((f) => ({ path: f.path.slice(root.length), size: f.size }));
  let total = 0;
  for (const f of kept) {
    total += f.size;
    if (BLOCKED_EXT.test(f.path)) errors.push(`Server-side or executable files aren't supported: ${f.path}`);
    else if (BLOCKED_NAMES.test(f.path)) errors.push(`This file shouldn't be published: ${f.path}`);
    if (f.size > LIMITS.maxFileBytes) errors.push(`${f.path} is larger than 25 MB.`);
  }
  if (kept.length > LIMITS.maxFiles) errors.push(`Too many files (${kept.length}). The limit is ${LIMITS.maxFiles}.`);
  if (total > LIMITS.maxUnpackedBytes) errors.push("Unpacked size is over 150 MB.");
  if (kept.some((f) => /(^|\/)package\.json$/.test(f.path)) && !kept.some((f) => f.path.endsWith(".js")))
    warnings.push("This looks like source code. Spaces runs the built output, not the project source.");
  return { ok: errors.length === 0, errors: [...new Set(errors)].slice(0, 50), warnings, root, kept };
}

/** Root-absolute asset URLs (src="/assets/…") break inside Spaces; builds should use a relative base ("./"). */
export function checkEntryHtml(html: string): string[] {
  const w: string[] = [];
  if (/\s(?:src|href)=["']\/(?!\/)[^"']+/i.test(html)) w.push('index.html uses root-absolute paths like "/assets/…". Set your build base to "./" (Vite: base: "./") so files load inside Spaces.');
  return w;
}

export const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8", htm: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8", json: "application/json", map: "application/json", svg: "image/svg+xml", png: "image/png",
  jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif", ico: "image/x-icon",
  woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf", txt: "text/plain; charset=utf-8", xml: "application/xml",
  wasm: "application/wasm", mp4: "video/mp4", webm: "video/webm", mp3: "audio/mpeg", wav: "audio/wav", pdf: "application/pdf", webmanifest: "application/manifest+json",
};
export const contentType = (p: string) => CONTENT_TYPES[p.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";

export const STARTER_MANIFEST: SpacesManifest = {
  specVersion: SPEC_VERSION, name: "My App", version: "1.0.0", description: "A static web app packaged for Loumilab Spaces.",
  type: "static", entry: "index.html", builtWith: "unspecified", routing: "hash", build: { command: "npm run build", output: "dist" },
  dependencies: { external: [] }, license: "MIT",
};
