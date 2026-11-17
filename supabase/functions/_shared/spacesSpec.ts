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
  const m = { ...input };
  // Official Loumilab status is decided only by Loumilab staff; manifest claims are dropped.
  const claims = ["official", "verified", "officialLoumilab", "loumilabOfficial", "designation", "verification"].filter((k) => k in m);
  for (const k of claims) delete m[k];
  if (claims.length) warnings.push("Official Loumilab status can't be set from spaces.json and was ignored.");
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

// ---------------------------------------------------------------------------
// Archive classification (inspection only — nothing is ever executed).
// ---------------------------------------------------------------------------
export type ArchiveKind = "static" | "vite_source" | "source_archive" | "needs_services" | "unsupported";
export type VersionStatus = "ready" | "failed" | "build_required" | "preserved" | "needs_services" | "unsupported";
export const KIND_LABEL: Record<ArchiveKind, string> = {
  static: "Static app", vite_source: "Build required (React/Vite)", source_archive: "Source archive",
  needs_services: "Needs outside services", unsupported: "Unsupported runtime",
};
export const STATUS_LABEL: Record<VersionStatus, string> = {
  ready: "Ready to publish", failed: "Failed", build_required: "Build required", preserved: "Preserved only",
  needs_services: "Needs outside services", unsupported: "Unsupported",
};
/** Status a non-failed version gets from its kind. Only "static" can be published today. */
export const statusForKind = (k: ArchiveKind): VersionStatus =>
  k === "static" ? "ready" : k === "vite_source" ? "build_required" : k === "needs_services" ? "needs_services" : k === "unsupported" ? "unsupported" : "preserved";

export interface Classification { kind: ArchiveKind; reasons: string[]; compiledRoot: string | null; services: string[]; framework: string | null }

const SERVER_EXT = /\.(php\d?|py|rb|pl|cgi|asp|aspx|jsp|go|rs|java|cs)$/i;
const BUILD_DIRS = ["dist/", "build/", "out/", ""];

/** Classify by paths and text of small config files. `read` returns file text or null. */
export function classifyArchive(paths: string[], read: (p: string) => string | null): Classification {
  const all = paths.filter((p) => !p.endsWith("/") && !SKIP.test(p) && !/(^|\/)node_modules\//.test(p));
  const reasons: string[] = [], services: string[] = [];
  // Project root = shallowest folder with package.json (or archive root).
  const pkgPath = all.filter((p) => /(^|\/)package\.json$/.test(p)).sort((a, b) => a.split("/").length - b.split("/").length)[0];
  const base = pkgPath ? pkgPath.slice(0, -"package.json".length) : "";
  let pkg: Record<string, unknown> | null = null;
  if (pkgPath) { try { pkg = JSON.parse(read(pkgPath) ?? ""); } catch { reasons.push("package.json isn't valid JSON."); } }
  const deps = { ...((pkg?.dependencies as Record<string, string>) ?? {}), ...((pkg?.devDependencies as Record<string, string>) ?? {}) };
  const has = (n: string) => n in deps;
  const rel = all.filter((p) => p.startsWith(base)).map((p) => p.slice(base.length));

  // Compiled output: an index.html in dist/, build/, out/ or root that references no /src/ module.
  let compiledRoot: string | null = null;
  for (const d of BUILD_DIRS) {
    const html = rel.includes(d + "index.html") ? read(base + d + "index.html") : null;
    if (html !== null && !/src=["']\/?src\/main\.(t|j)sx?["']/i.test(html)) { compiledRoot = base + d; break; }
  }
  // No package.json: a built site zipped inside its own folder (my-site/index.html, project/dist/index.html,
  // custom output names) still publishes from the shallowest index.html, as before classification existed.
  if (compiledRoot === null && !pkgPath) {
    const root = findRoot(all);
    const html = root !== null ? read(root + "index.html") : null;
    if (root !== null && html !== null && !/src=["']\/?src\/main\.(t|j)sx?["']/i.test(html)) compiledRoot = root;
  }

  const framework = has("next") ? "next" : has("nuxt") ? "nuxt" : has("@remix-run/node") ? "remix" : has("@sveltejs/kit") ? "sveltekit"
    : has("vite") ? (has("react") ? "react-vite" : "vite") : has("react-scripts") ? "create-react-app" : pkg ? "node" : null;

  // Unsupported runtimes.
  const unsupported: string[] = [];
  if (framework === "next" && !rel.some((p) => p.startsWith("out/index.html"))) unsupported.push("Next.js server app");
  if (["nuxt", "remix", "sveltekit"].includes(framework ?? "") && !compiledRoot) unsupported.push(`${framework} server app`);
  if (rel.some((p) => /(^|\/)(Dockerfile|docker-compose\.ya?ml)$/i.test(p))) unsupported.push("Docker container");
  const serverFiles = rel.filter((p) => SERVER_EXT.test(p));
  if (serverFiles.length) unsupported.push(`server code (${serverFiles.slice(0, 3).join(", ")})`);
  if (rel.some((p) => /^(requirements\.txt|Gemfile|composer\.json|go\.mod|Cargo\.toml)$/.test(p))) unsupported.push("non-JavaScript runtime");

  // Outside services.
  if (has("@supabase/supabase-js")) services.push("Supabase");
  if (has("firebase")) services.push("Firebase");
  if (has("express") || has("fastify") || has("koa") || has("hono")) services.push("Node server");
  if (has("prisma") || has("@prisma/client") || has("pg") || has("mysql2") || has("mongoose")) services.push("Database");
  if (has("stripe")) services.push("Stripe (server)");
  if (rel.some((p) => /^(server|api)\//.test(p))) services.push("API/server folder");
  const envNames = rel.filter((p) => /(^|\/)\.env(\.|$)/.test(p));
  if (envNames.length) reasons.push(`Secret files found and not stored: ${envNames.slice(0, 5).join(", ")}.`);

  let kind: ArchiveKind;
  if (compiledRoot !== null && !unsupported.length) {
    kind = "static"; reasons.push(compiledRoot === base ? "Found a built index.html." : `Found built output in ${compiledRoot.slice(base.length) || "/"}.`);
    if (pkg) reasons.push("Project source was found too and is kept alongside the compiled files.");
    if (services.length) reasons.push(`It may call outside services (${services.join(", ")}); those aren't hosted by Spaces.`);
  } else if (unsupported.length) {
    kind = "unsupported"; reasons.push(`Spaces can't run: ${unsupported.join("; ")}. The files can be preserved but never run.`);
  } else if (services.some((s) => s !== "Supabase" && s !== "Firebase")) {
    kind = "needs_services"; reasons.push(`This app needs services Spaces doesn't host: ${services.join(", ")}.`);
  } else if (framework === "react-vite" || framework === "vite" || rel.some((p) => /^vite\.config\.(t|j|mj)s$/.test(p))) {
    kind = "vite_source"; reasons.push("This is a Vite project that must be compiled first. Spaces' build service isn't available yet, so it's preserved with status Build Required. You can also run `npm run build` yourself and upload dist/.");
    if (!rel.some((p) => /^(package-lock\.json|bun\.lockb?|pnpm-lock\.yaml|yarn\.lock)$/.test(p))) reasons.push("No lockfile found; a future build will require one.");
  } else {
    kind = "source_archive"; reasons.push("No runnable web app found. The files are preserved as a source archive.");
  }
  return { kind, reasons, compiledRoot, services, framework };
}

/** Files kept in preservation storage: drops secrets, VCS and dependency folders. */
export const preservable = (p: string) => !SKIP.test(p) && !p.endsWith("/") && !/(^|\/)(node_modules\/|\.git\/|\.env(\.|$)|\.npmrc$)/.test(p);

export const UNZIP_LIMITS = { maxRatio: 100, maxDepth: 20, maxEntries: 10000 };
/** Pre-check one ZIP entry header before it is inflated. Returns an error or null. */
export function checkZipEntry(name: string, compressed: number, original: number): string | null {
  if (name.startsWith("/") || name.includes("\\") || name.split("/").includes("..") || /^[a-z]:/i.test(name)) return `Unsafe file path: ${name}`;
  if (name.split("/").length > UNZIP_LIMITS.maxDepth) return `Folders are nested too deeply: ${name}`;
  if (original > LIMITS.maxFileBytes) return `${name} is larger than 25 MB.`;
  if (original > 1024 * 1024 && compressed > 0 && original / compressed > UNZIP_LIMITS.maxRatio) return `${name} expands suspiciously (possible ZIP bomb).`;
  return null;
}
