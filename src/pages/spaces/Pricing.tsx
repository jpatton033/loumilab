import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { LIMITS } from "@/lib/spaces/spec";

const mb = (b: number) => `${Math.round(b / 1024 / 1024)} MB`;
export default function SpacesPricing() {
  const rows = [
    ["Price", "Free during the beta"],
    ["Workspaces", "Up to 10 you own"],
    ["Apps", "Unlimited during the beta"],
    ["Upload size", `${mb(LIMITS.maxZipBytes)} ZIP, ${mb(LIMITS.maxUnpackedBytes)} unpacked`],
    ["Files per version", LIMITS.maxFiles.toLocaleString()],
    ["Included", "Deploy, version history, rollback, Passport, Portable Export, Library, roles"],
    ["Not yet", "Server code, databases, custom domains, a marketplace"],
  ];
  return (
    <Layout>
      <SEOHead title="Pricing | Loumilab Spaces" description="Loumilab Spaces is free during the beta. See what is included." path="/spaces/pricing" />
      <section className="section-padding pt-36">
        <div className="section-container max-w-3xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Loumilab Spaces</p>
          <h1 className="font-hero text-5xl font-semibold tracking-tight text-foreground lg:text-7xl">Free during the beta.</h1>
          <dl className="mt-14 divide-y divide-border border-y border-border">
            {rows.map(([k, v]) => <div key={k} className="grid gap-2 py-5 sm:grid-cols-3"><dt className="font-medium text-foreground">{k}</dt><dd className="text-muted-foreground sm:col-span-2">{v}</dd></div>)}
          </dl>
          <Button size="lg" asChild className="mt-10"><Link to="/spaces/app">Get Started</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
