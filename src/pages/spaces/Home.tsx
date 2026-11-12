import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Scene, LightsDown } from "@/components/brand/story/Scene";
import { SpacesHeroFilm } from "@/components/spaces/SpacesHeroFilm";
import { downloadStarterKit } from "@/lib/spaces/starterKit";

const H2 = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
  <h2 className={`font-hero text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl ${light ? "text-inverse" : "text-foreground"}`}>{children}</h2>
);
const Label = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
  <p className={`mb-5 text-xs font-semibold uppercase tracking-[0.16em] ${light ? "text-inverse-muted" : "text-muted-foreground"}`}>{children}</p>
);

const flow = ["Import", "Validate", "Deploy", "Manage", "Update", "Export"];

export default function SpacesHome() {
  return (
    <Layout>
      <SEOHead title="Loumilab Spaces | The home for software built anywhere" path="/spaces"
        description="Deploy, own, share and maintain your applications — regardless of how or where they were created. Passport, portable export and a private Library." />

      {/* 1 — Hero */}
      <section data-page-hero className="relative isolate -mt-16 overflow-hidden bg-ink text-inverse lg:-mt-20" aria-label="Introduction">
        <SpacesHeroFilm />
        <div className="section-container flex min-h-[100svh] flex-col items-center justify-center pb-24 pt-32 text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-inverse/70">Loumilab Spaces · Beta</p>
          <h1 className="mx-auto max-w-5xl font-hero text-5xl font-semibold leading-[1.02] tracking-tight text-inverse sm:text-6xl lg:text-8xl">The home for software built anywhere.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-inverse/80 sm:text-xl">Deploy, own, share, and maintain your applications—regardless of how or where they were created.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90"><Link to="/spaces/app">Get Started</Link></Button>
            <Button size="lg" variant="outline" asChild className="border-inverse/30 bg-transparent text-inverse hover:bg-inverse/10 hover:text-inverse"><a href="#problem">Explore Spaces</a></Button>
          </div>
        </div>
      </section>

      {/* 2 — Problem */}
      <section id="problem" className="section-padding">
        <div className="section-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7"><Label>The problem</Label><H2>Building software has changed. Managing it hasn't.</H2></div>
          <p className="self-end text-lg leading-relaxed text-muted-foreground lg:col-span-5">Apps now come from traditional development, AI-assisted coding, open source and custom work. Yet where they run, who owns the source, who can open them and how they're maintained is still scattered across accounts, inboxes and old laptops.</p>
        </div>
        <Scene variant="drift" className="section-container mt-16">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["A host account", "A ZIP in email", "A repo nobody can find", "A password in a doc", "A build only one person can run", "An app with no owner", "A domain about to expire", "A version that broke"].map((t, i) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (i % 3)}deg)` }}>{t}</div>
            ))}
          </div>
        </Scene>
      </section>

      {/* 3 — Build anywhere */}
      <section className="section-padding border-t border-border">
        <div className="section-container">
          <Label>Build anywhere</Label><H2>Your tools. Your workflow. Your software.</H2>
          <Scene variant="rise" className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[["Traditional development", "Hand-written code in any framework that builds to static files."], ["AI-assisted", "Apps made with AI coding tools, exported as a build."], ["Hybrid", "People and AI working on the same codebase."], ["Open source", "Compatible projects you build and run yourself."]].map(([t, b]) => (
              <div key={t} className="bg-background p-8"><h3 className="font-hero text-xl font-semibold text-foreground">{t}.</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b}</p></div>
            ))}
          </Scene>
          <p className="mt-6 text-sm text-muted-foreground">Compatibility depends on what an app needs, not how it was made. Today Spaces runs static sites and compiled frontend apps.</p>
        </div>
      </section>

      <LightsDown />

      {/* 4 — Deploy */}
      <section className="bg-ink py-28 text-inverse lg:py-40">
        <div className="section-container">
          <Label light>Spaces Deploy</Label><H2 light>From project to published.</H2>
          <Scene variant="rise" className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {flow.map((s, i) => (
              <div key={s} className="rounded-2xl border border-inverse/15 p-6">
                <span className="text-xs text-inverse-muted">0{i + 1}</span>
                <p className="mt-6 font-hero text-xl font-semibold text-inverse">{s}.</p>
              </div>
            ))}
          </Scene>
          <p className="mt-8 max-w-2xl text-inverse-muted">Upload a ZIP of your build. Spaces checks it, publishes it to a Loumilab link, keeps every version and lets you roll back in one click.</p>
        </div>
      </section>

      {/* 5 — Passport */}
      <section className="bg-ink pb-28 text-inverse lg:pb-40">
        <div className="section-container grid items-center gap-14 lg:grid-cols-2">
          <div><Label light>Spaces Passport</Label><H2 light>Your software has a history. Keep it.</H2>
            <p className="mt-6 text-lg text-inverse-muted">Every app gets a permanent identity and record — who created it, how it was built, every version, every deploy and every change. Export it any time.</p></div>
          <Scene variant="expand">
            <div className="rounded-3xl border border-inverse/15 p-8 font-mono text-xs leading-7 text-inverse/80">
              <p className="text-inverse-muted">passport.json</p>
              <p>app.id&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 7f3c…a91e</p><p>builtWith&nbsp;&nbsp; hybrid</p><p>versions&nbsp;&nbsp;&nbsp; 1.0.0 → 1.1.0 → 1.2.0</p>
              <p>history&nbsp;&nbsp;&nbsp;&nbsp; created · deployed · exported · rolled back</p>
            </div>
          </Scene>
        </div>
      </section>

      {/* 6 — Export */}
      <section className="section-padding">
        <div className="section-container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6"><Label>Portable export</Label><H2>Your software shouldn't be trapped.</H2></div>
          <div className="lg:col-span-6">
            <p className="text-lg text-muted-foreground">Download a complete package — the built app, its manifest, its Passport and a README — that runs on any static host. Bring it back to Spaces the same way.</p>
            <ul className="mt-8 divide-y divide-border border-y border-border text-sm">
              {["app/ — your built application", "spaces.json — the manifest", "passport.json — identity and history", "README.md — how to run it anywhere"].map((t) => <li key={t} className="py-4 font-mono text-foreground">{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      {/* 7 — Specification */}
      <section className="section-padding border-t border-border">
        <div className="section-container text-center">
          <Label>Spaces App Specification</Label>
          <div className="mx-auto max-w-4xl"><H2>A better way to build for what comes next.</H2></div>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">An open, simple manifest — spaces.json — that describes an app so anyone can deploy, understand and maintain it.</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild><Link to="/spaces/specification">Explore the Specification</Link></Button>
            <Button size="lg" variant="outline" onClick={() => downloadStarterKit()}>Download Starter Kit</Button>
          </div>
        </div>
      </section>

      {/* 8 — Continuity */}
      <section className="section-padding border-t border-border">
        <div className="section-container grid gap-12 lg:grid-cols-2">
          <div><Label>Continuity</Label><H2>Your next update shouldn't depend on your last developer.</H2></div>
          <p className="self-end text-lg text-muted-foreground">The manifest, the Passport and a clean export mean a new developer, agency or teammate can pick up exactly where the last one stopped.</p>
        </div>
      </section>

      <LightsDown />

      {/* 9 — Library */}
      <section className="bg-ink py-28 text-inverse lg:py-40">
        <div className="section-container">
          <Label light>Spaces Library</Label><H2 light>Every application. One organized space.</H2>
          <p className="mt-6 max-w-2xl text-lg text-inverse-muted">A private home for your team's apps with folders, tags, favorites and search. People only see what they're allowed to open. It's not a marketplace.</p>
          <Scene variant="rise" className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[["Client portal", "Live · v2.3.0"], ["Pricing calculator", "Live · v1.4.1"], ["Onboarding guide", "Archived"], ["Field checklist", "Live · v0.9.0"]].map(([n, s]) => (
              <div key={n} className="rounded-2xl border border-inverse/15 p-6"><div className="mb-10 aspect-[16/10] rounded-xl bg-inverse/[0.06]" /><p className="font-medium text-inverse">{n}</p><p className="mt-1 text-xs text-inverse-muted">{s}</p></div>
            ))}
          </Scene>
        </div>
      </section>

      {/* 10 — Security, 11 — Operations */}
      <section className="bg-ink pb-28 text-inverse lg:pb-40">
        <div className="section-container grid gap-px overflow-hidden rounded-3xl border border-inverse/15 bg-inverse/15 lg:grid-cols-2">
          <div className="bg-ink p-10 lg:p-14"><Label light>Security & access</Label><h3 className="font-hero text-3xl font-semibold text-inverse lg:text-4xl">Your software. Your rules.</h3>
            <ul className="mt-6 space-y-3 text-inverse-muted"><li>Owner, admin, developer and viewer roles.</li><li>Private, workspace or link-only apps.</li><li>Every file checked on every request.</li><li>Apps run in a locked-down frame, isolated from your account.</li></ul></div>
          <div className="bg-ink p-10 lg:p-14"><Label light>Operations</Label><h3 className="font-hero text-3xl font-semibold text-inverse lg:text-4xl">Know what's running. Know what matters.</h3>
            <ul className="mt-6 space-y-3 text-inverse-muted"><li>Status and live version for every app.</li><li>Deploy results with clear warnings.</li><li>Storage used per app.</li><li>A full activity log.</li></ul></div>
        </div>
      </section>

      {/* 12 — Who */}
      <section className="section-padding">
        <div className="section-container">
          <Label>Who it's for</Label><H2>Built for the people building what's next.</H2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {[["Individuals", "Keep your projects alive and yours."], ["Developers", "Ship builds with a clean record."], ["Freelancers", "Hand off work clients can keep."], ["Agencies", "Organize every client app in one place."], ["Organizations", "Know what software you own."]].map(([t, b]) => (
              <div key={t} className="bg-background p-7"><p className="font-hero text-lg font-semibold text-foreground">{t}.</p><p className="mt-2 text-sm text-muted-foreground">{b}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* 13 — Pricing */}
      <section className="section-padding border-t border-border">
        <div className="section-container text-center">
          <Label>Pricing</Label><H2>Free during the beta.</H2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">Every Phase 1 feature, with fair limits. Paid plans come later, and we'll tell you well before anything changes.</p>
          <Button variant="link" asChild className="mt-4"><Link to="/spaces/pricing">See what's included</Link></Button>
        </div>
      </section>

      {/* 14 — Final CTA */}
      <section className="bg-ink py-28 text-center text-inverse lg:py-40">
        <Scene variant="overlap" className="section-container">
          <h2 className="mx-auto max-w-4xl font-hero text-5xl font-semibold leading-[1.03] tracking-tight text-inverse lg:text-7xl">What you build should remain yours.</h2>
          <Button size="lg" asChild className="mt-10 bg-inverse text-surface-inverse hover:bg-inverse/90"><Link to="/spaces/app">Get Started</Link></Button>
          <p className="mt-8 text-sm text-inverse-muted">Build anywhere. Own what you build. Run it with Spaces.</p>
        </Scene>
      </section>
    </Layout>
  );
}
