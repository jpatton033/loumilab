import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { downloadStarterKit } from "@/lib/spaces/starterKit";
import { STARTER_MANIFEST, LIMITS } from "@/lib/spaces/spec";

const fields: [string, string][] = [
  ["specVersion", 'Required. Always "1.0" for this version.'],
  ["name", "Required. 1–80 characters."],
  ["version", "Required. Semantic version, like 1.2.0."],
  ["type", 'Required. "static" — static and compiled frontend apps.'],
  ["entry", "Required. The start page, usually index.html."],
  ["builtWith", "traditional, ai-assisted, hybrid, open-source or unspecified."],
  ["routing", '"hash" for single-page apps (#/page), or "none".'],
  ["build", "How to rebuild: { command, output }."],
  ["dependencies.external", "Outside services the app calls, with name, url and purpose."],
  ["license, repository", "Optional ownership details."],
];

export default function SpacesSpecification() {
  return (
    <Layout>
      <SEOHead title="Spaces App Specification | Loumilab Spaces" path="/spaces/specification"
        description="spaces.json, spaces.schema.json and SPACES.md: an open, portable way to describe static web apps. Download the starter kit." />
      <section className="section-padding pt-36">
        <div className="section-container max-w-4xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Specification v1.0</p>
          <h1 className="font-hero text-5xl font-semibold tracking-tight text-foreground lg:text-7xl">The Spaces App Specification.</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">Three small files describe an app so it can be deployed, understood and moved — inside Spaces or anywhere else.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => downloadStarterKit()}>Download Starter Kit</Button>
            <Button size="lg" variant="outline" asChild><a href="/spaces/spaces.schema.json" target="_blank" rel="noreferrer">spaces.schema.json</a></Button>
            <Button size="lg" variant="outline" asChild><a href="/spaces/SPACES.md" target="_blank" rel="noreferrer">SPACES.md</a></Button>
          </div>

          <h2 className="mt-24 font-hero text-3xl font-semibold text-foreground">spaces.json.</h2>
          <pre className="mt-6 overflow-x-auto rounded-3xl border border-border bg-card p-6 text-sm text-foreground">{JSON.stringify(STARTER_MANIFEST, null, 2)}</pre>
          <dl className="mt-10 divide-y divide-border border-y border-border">
            {fields.map(([k, v]) => <div key={k} className="grid gap-2 py-4 sm:grid-cols-3"><dt className="font-mono text-sm text-foreground">{k}</dt><dd className="text-sm text-muted-foreground sm:col-span-2">{v}</dd></div>)}
          </dl>

          <h2 className="mt-24 font-hero text-3xl font-semibold text-foreground">What's supported.</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-border p-7"><p className="font-medium text-foreground">Supported today</p><p className="mt-3 text-sm text-muted-foreground">Plain HTML, and the built output of React, Vue, Svelte, Astro and similar tools. Apps can call external APIs — list them in dependencies.external.</p></div>
            <div className="rounded-3xl border border-border p-7"><p className="font-medium text-foreground">Not supported yet</p><p className="mt-3 text-sm text-muted-foreground">Server code (Node, Python, PHP), databases, containers and background workers. Uploads containing server files are refused.</p></div>
          </div>

          <h2 className="mt-24 font-hero text-3xl font-semibold text-foreground">Build rules.</h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-muted-foreground">
            <li>Use relative paths. Vite: <code className="text-foreground">base: "./"</code>. Create React App: <code className="text-foreground">"homepage": "."</code>.</li>
            <li>Use hash routing for single-page apps.</li>
            <li>Never include secrets — anyone who can open the app can read its files.</li>
            <li>Limits: {LIMITS.maxZipBytes / 1048576} MB ZIP, {LIMITS.maxUnpackedBytes / 1048576} MB unpacked, {LIMITS.maxFiles.toLocaleString()} files.</li>
          </ol>
        </div>
      </section>
    </Layout>
  );
}
