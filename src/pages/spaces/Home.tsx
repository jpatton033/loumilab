import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Scene } from "@/components/brand/story/Scene";
import { SpacesHeroFilm } from "@/components/spaces/SpacesHeroFilm";
import { Glow, Chapter, Body, CinemaFrame, Surface } from "@/components/spaces/flow/Flow";
import { downloadStarterKit } from "@/lib/spaces/starterKit";
import poster from "@/assets/spaces/built_by_people_poster.webp.asset.json";
import ceramics from "@/assets/spaces/maker-ceramics.jpg";
import developer from "@/assets/spaces/developer-night.jpg";
import craftsman from "@/assets/spaces/craftsman-workshop.jpg";
import team from "@/assets/spaces/team-night.jpg";
import musician from "@/assets/spaces/musician-blue.jpg";
import mural from "@/assets/spaces/mural-texture.jpg";

const ivory = "text-[hsl(var(--spaces-ivory))]";
const muted = "text-[hsl(var(--spaces-ivory-muted))]";
const line = "border-[hsl(var(--spaces-ivory)/0.12)]";
const btnPrimary = "bg-[hsl(var(--spaces-ivory))] text-[hsl(var(--spaces-obsidian))] hover:bg-[hsl(var(--spaces-ivory)/0.9)]";
const btnGhost = `border-[hsl(var(--spaces-ivory)/0.3)] bg-transparent ${ivory} hover:bg-[hsl(var(--spaces-ivory)/0.08)] hover:text-[hsl(var(--spaces-ivory))]`;

const flow = ["Import", "Validate", "Deploy", "Manage", "Update", "Export"];

export default function SpacesHome() {
  return (
    <Layout>
      <SEOHead title="Loumilab Spaces | The home for software built anywhere" path="/spaces"
        description="Deploy, own, share and maintain your applications — regardless of how or where they were created. Passport, portable export and a private Library." />

      <div className="spaces-theme relative overflow-x-clip">
        {/* 1 — Create */}
        <section data-page-hero className="relative isolate -mt-16 overflow-hidden lg:-mt-20" aria-label="Introduction">
          <SpacesHeroFilm />
          <div className="section-container flex min-h-[100svh] flex-col justify-end pb-20 pt-32 lg:pb-28">
            <div className="max-w-3xl">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--spaces-ivory)/0.7)]">Loumilab Spaces · Built by People</p>
              <h1 className={`font-hero text-5xl font-semibold leading-[1.0] tracking-tight sm:text-7xl lg:text-8xl ${ivory}`}>Create without limits.</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[hsl(var(--spaces-ivory)/0.85)] sm:text-xl">Build anywhere. Own what you build. Run it with Spaces.</p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[hsl(var(--spaces-ivory)/0.6)]">Loumilab Spaces is a home for deploying, preserving, sharing, and managing software built anywhere.</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className={btnPrimary}><Link to="/spaces/app">Get Started</Link></Button>
                <Button size="lg" variant="outline" asChild className={btnGhost}><a href="#problem">Explore Spaces</a></Button>
              </div>
            </div>
          </div>
          {/* Film light continues into the page instead of ending at an edge */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[hsl(var(--spaces-obsidian))]" />
        </section>

        {/* Problem — a large typographic moment, overlapping the film's warmth */}
        <section id="problem" className="relative pb-24 pt-16 lg:pb-36">
          <Glow tone="burgundy" className="-left-40 -top-32 h-[28rem] w-[28rem]" />
          <div className="section-container relative grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className={`mb-5 text-xs font-semibold uppercase tracking-[0.18em] ${muted}`}>The problem</p>
              <h2 className={`font-hero text-4xl font-semibold leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl ${ivory}`}>Building software has changed. Managing it hasn't.</h2>
            </div>
            <p className={`self-end text-lg leading-relaxed lg:col-span-4 ${muted}`}>Apps now come from traditional development, AI-assisted coding, open source and custom work. Yet where they run, who owns the source, who can open them and how they're maintained is still scattered across accounts, inboxes and old laptops.</p>
          </div>
          <Scene variant="drift" className="section-container relative mt-16">
            <div className="flex flex-wrap gap-3">
              {["A host account", "A ZIP in email", "A repo nobody can find", "A password in a doc", "A build only one person can run", "An app with no owner", "A domain about to expire", "A version that broke"].map((t) => (
                <span key={t} className={`rounded-full border ${line} px-5 py-2.5 text-sm ${muted}`}>{t}</span>
              ))}
            </div>
          </Scene>
        </section>

        {/* 2 — Build anywhere: creativity meets software */}
        <section className="relative py-24 lg:py-36">
          <Glow tone="copper" className="right-[-10rem] top-10 h-[30rem] w-[30rem] opacity-40" />
          <div className="section-container relative grid items-end gap-10 lg:grid-cols-12">
            <Scene variant="expand" className="lg:col-span-7">
              <CinemaFrame src={ceramics} alt="A ceramic artist shaping clay at a wheel in warm window light" w={1536} h={1024} className="aspect-[4/3] sm:aspect-[3/2]" />
            </Scene>
            <div className="relative lg:col-span-5 lg:-ml-24 lg:mb-16">
              <div className="rounded-3xl bg-[hsl(var(--spaces-obsidian)/0.85)] p-0 lg:p-10">
                <Chapter n="02" label="Build anywhere" title="Your tools. Your workflow. Your software." />
                <Body>Whatever you make — and however you make it — Spaces is where the software lives on.</Body>
              </div>
            </div>
          </div>
          <div className="section-container relative mt-16">
            <dl className={`grid border-t ${line} sm:grid-cols-2 lg:grid-cols-4`}>
              {[["Traditional development", "Hand-written code in any framework that builds to static files."], ["AI-assisted", "Apps made with AI coding tools, exported as a build."], ["Hybrid", "People and AI working on the same codebase."], ["Open source", "Compatible projects you build and run yourself."]].map(([t, b]) => (
                <div key={t} className={`border-b ${line} py-7 pr-8 lg:border-b-0`}><dt className={`font-hero text-xl font-semibold ${ivory}`}>{t}.</dt><dd className={`mt-2 text-sm leading-relaxed ${muted}`}>{b}</dd></div>
              ))}
            </dl>
            <p className={`mt-6 text-sm ${muted}`}>Compatibility depends on what an app needs, not how it was made. Today Spaces runs static sites and compiled frontend apps.</p>
          </div>
        </section>

        {/* 3 — Deploy: teal/midnight product demonstration */}
        <section className="relative py-24 lg:py-36">
          <Glow tone="teal" className="-left-32 top-1/4 h-[34rem] w-[34rem]" />
          <Glow tone="midnight" className="right-0 bottom-0 h-[26rem] w-[26rem]" />
          <div className="section-container relative grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Chapter n="03" label="Spaces Deploy" title="From project to published." />
              <Body>Upload a ZIP of your build. Spaces checks it, publishes it to a Loumilab link, keeps every version and lets you roll back in one click.</Body>
              <ol className={`mt-10 grid grid-cols-3 gap-x-4 gap-y-6 border-t ${line} pt-6`}>
                {flow.map((s, i) => <li key={s}><span className={`font-mono text-xs ${muted}`}>0{i + 1}</span><p className={`mt-1 font-hero text-lg font-semibold ${ivory}`}>{s}.</p></li>)}
              </ol>
            </div>
            <Scene variant="rise" className="relative lg:col-span-7">
              <CinemaFrame src={developer} alt="A developer working late, lit by his screens" w={1024} h={1280} className="ml-auto aspect-[4/5] w-3/4 sm:w-2/3" />
              <Surface title="Deploy · client-portal" className="relative -mt-16 w-[92%] sm:absolute sm:bottom-[-2rem] sm:left-0 sm:mt-0 sm:w-[70%]">
                <ul className="space-y-3 font-mono text-xs">
                  <li className="flex justify-between"><span>build.zip received</span><span className={muted}>42 files</span></li>
                  <li className="flex justify-between"><span>spaces.json valid</span><span className={muted}>✓</span></li>
                  <li className="flex justify-between"><span>index.html found</span><span className={muted}>✓</span></li>
                  <li className="flex justify-between"><span>Published v1.2.0</span><span className="text-[hsl(var(--spaces-ivory))]">Live</span></li>
                </ul>
              </Surface>
            </Scene>
          </div>
        </section>

        {/* 4 — Preserve: warm copper/burgundy */}
        <section className="relative py-28 lg:py-40">
          <Glow tone="copper" className="right-[-8rem] top-0 h-[32rem] w-[32rem] opacity-45" />
          <Glow tone="burgundy" className="left-1/4 bottom-[-6rem] h-[24rem] w-[24rem]" />
          <div className="section-container relative grid items-center gap-14 lg:grid-cols-12">
            <Scene variant="rise" className="relative order-2 lg:order-1 lg:col-span-6">
              <CinemaFrame src={craftsman} alt="A woodworker inspecting a handmade chair in his workshop" w={1024} h={1280} className="aspect-[4/5] w-4/5" />
              <Surface title="passport.json" className="relative -mt-16 ml-auto w-[92%] font-mono text-xs leading-7 sm:absolute sm:-bottom-8 sm:right-0 sm:mt-0 sm:w-[78%]">
                <p>app.id&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 7f3c…a91e</p><p>builtWith&nbsp; hybrid</p><p>versions&nbsp;&nbsp; 1.0.0 → 1.1.0 → 1.2.0</p>
                <p className={muted}>created · deployed · exported · rolled back</p>
              </Surface>
            </Scene>
            <div className="order-1 lg:order-2 lg:col-span-6">
              <Chapter n="04" label="Spaces Passport" title="Your software has a history. Keep it." />
              <Body>Every app gets a permanent identity and record — who created it, how it was built, every version, every deploy and every change. Export it any time.</Body>
            </div>
          </div>
        </section>

        {/* 5 — Own & Export: movement across the mural */}
        <section className="relative overflow-hidden py-28 lg:py-40">
          <img src={mural} alt="" aria-hidden="true" width={1920} height={1088} loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(var(--spaces-obsidian))] via-[hsl(var(--spaces-obsidian)/0.4)] to-[hsl(var(--spaces-obsidian))]" />
          <div className="section-container relative grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6"><Chapter n="05" label="Portable export" title="Your software shouldn't be trapped." /></div>
            <div className="lg:col-span-6 lg:pt-16">
              <Body className="mt-0">Download a complete package — the built app, its manifest, its Passport and a README — that runs on any static host. Bring it back to Spaces the same way.</Body>
              <Scene variant="drift">
                <ul className={`mt-8 divide-y border-y text-sm ${line} divide-[hsl(var(--spaces-ivory)/0.12)]`}>
                  {["app/ — your built application", "spaces.json — the manifest", "passport.json — identity and history", "README.md — how to run it anywhere"].map((t) => <li key={t} className={`py-4 font-mono ${ivory}`}>{t}</li>)}
                </ul>
              </Scene>
            </div>
          </div>
        </section>

        {/* 6 — Standardize: minimal, centered */}
        <section className="relative py-28 text-center lg:py-40">
          <Glow tone="forest" className="left-1/2 top-1/3 h-[30rem] w-[40rem] -translate-x-1/2" />
          <div className="section-container relative">
            <div className="mx-auto max-w-4xl"><Chapter n="06" label="Spaces App Specification" title="A better way to build for what comes next." /></div>
            <Body className="mx-auto">An open, simple manifest — spaces.json — that describes an app so anyone can deploy, understand and maintain it. A new developer, agency or teammate can pick up exactly where the last one stopped.</Body>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className={btnPrimary}><Link to="/spaces/specification">Explore the Specification</Link></Button>
              <Button size="lg" variant="outline" className={btnGhost} onClick={() => downloadStarterKit()}>Download Starter Kit</Button>
            </div>
          </div>
        </section>

        {/* 7 — Organize: Library interface */}
        <section className="relative py-24 lg:py-36">
          <Glow tone="midnight" className="-right-20 top-20 h-[30rem] w-[30rem]" />
          <div className="section-container relative">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7"><Chapter n="07" label="Spaces Library" title="Every application. One organized space." /></div>
              <Body className="self-end lg:col-span-5">A private home for your team's apps with folders, tags, favorites and search. People only see what they're allowed to open. It's not a marketplace.</Body>
            </div>
            <Scene variant="rise" className="mt-14">
              <Surface title="Library · Studio workspace">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[["Client portal", "Live · v2.3.0", "teal"], ["Pricing calculator", "Live · v1.4.1", "copper"], ["Onboarding guide", "Archived", "burgundy"], ["Field checklist", "Live · v0.9.0", "forest"]].map(([n, s, tone]) => (
                    <div key={n} className={`rounded-xl border ${line} p-4`}>
                      <div className="mb-6 aspect-[16/10] rounded-lg" style={{ background: `linear-gradient(135deg, hsl(var(--spaces-${tone})), hsl(var(--spaces-obsidian)))` }} />
                      <p className={`font-medium ${ivory}`}>{n}</p><p className={`mt-1 text-xs ${muted}`}>{s}</p>
                    </div>
                  ))}
                </div>
              </Surface>
            </Scene>
          </div>
        </section>

        {/* 8 — Share & Manage */}
        <section className="relative py-24 lg:py-36">
          <Glow tone="forest" className="-left-24 bottom-0 h-[28rem] w-[28rem]" />
          <div className="section-container relative">
            <Scene variant="expand"><CinemaFrame src={team} alt="A small team reviewing work together around a table at night" w={1536} h={1024} className="aspect-[4/3] sm:aspect-[21/9]" /></Scene>
            <div className="mt-14 grid gap-14 lg:grid-cols-12">
              <div className="lg:col-span-5"><Chapter n="08" label="Security & access" title="Your software. Your rules." /></div>
              <div className={`grid gap-10 sm:grid-cols-2 lg:col-span-7 ${muted}`}>
                <div><p className={`mb-4 font-hero text-lg font-semibold ${ivory}`}>Access.</p><ul className="space-y-3"><li>Owner, admin, developer and viewer roles.</li><li>Private, workspace or link-only apps.</li><li>Every file checked on every request.</li><li>Apps run in a locked-down frame, isolated from your account.</li></ul></div>
                <div><p className={`mb-4 font-hero text-lg font-semibold ${ivory}`}>Know what's running.</p><ul className="space-y-3"><li>Status and live version for every app.</li><li>Deploy results with clear warnings.</li><li>Storage used per app.</li><li>A full activity log.</li></ul></div>
              </div>
            </div>
          </div>
        </section>

        {/* Who it's for + pricing — intimate, minimal */}
        <section className="relative py-24 lg:py-32">
          <div className="section-container relative grid items-center gap-14 lg:grid-cols-12">
            <Scene variant="drift" className="lg:col-span-4"><CinemaFrame src={musician} alt="A musician playing upright bass under blue stage light" w={1024} h={1280} className="aspect-[4/5]" /></Scene>
            <div className="lg:col-span-8">
              <h2 className={`font-hero text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl ${ivory}`}>Built for the people building what's next.</h2>
              <dl className={`mt-10 grid gap-x-8 border-t ${line} sm:grid-cols-2`}>
                {[["Individuals", "Keep your projects alive and yours."], ["Developers", "Ship builds with a clean record."], ["Freelancers", "Hand off work clients can keep."], ["Agencies", "Organize every client app in one place."], ["Organizations", "Know what software you own."]].map(([t, b]) => (
                  <div key={t} className={`border-b ${line} py-5`}><dt className={`font-hero font-semibold ${ivory}`}>{t}.</dt><dd className={`mt-1 text-sm ${muted}`}>{b}</dd></div>
                ))}
              </dl>
              <p className={`mt-10 font-hero text-2xl font-semibold ${ivory}`}>Free during the beta.</p>
              <p className={`mt-2 max-w-xl ${muted}`}>Every Phase 1 feature, with fair limits. Paid plans come later, and we'll tell you well before anything changes. <Link to="/spaces/pricing" className={`underline underline-offset-4 ${ivory}`}>See what's included</Link></p>
            </div>
          </div>
        </section>

        {/* 9 — Final CTA echoes the hero film */}
        <section className="relative isolate overflow-hidden py-36 text-center lg:py-52">
          <img src={poster.url} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[hsl(var(--spaces-obsidian))] via-[hsl(var(--spaces-obsidian)/0.55)] to-[hsl(var(--spaces-obsidian))]" />
          <Scene variant="overlap" className="section-container">
            <h2 className={`mx-auto max-w-4xl font-hero text-5xl font-semibold leading-[1.03] tracking-tight lg:text-7xl ${ivory}`}>What you build should remain yours.</h2>
            <Button size="lg" asChild className={`mt-10 ${btnPrimary}`}><Link to="/spaces/app">Get Started</Link></Button>
            <p className={`mt-8 text-sm ${muted}`}>Built by People. Powered by Possibility.</p>
          </Scene>
        </section>
      </div>
    </Layout>
  );
}
