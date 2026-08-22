import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const topics = [
  { title: "Product & Design", desc: "How we make product decisions, and the design standards we hold." },
  { title: "Engineering", desc: "Architecture, tooling, and the tradeoffs behind what we ship." },
  { title: "Security", desc: "Practical security thinking for teams building modern software." },
  { title: "Building in Public", desc: "Notes from building Loumilab products and companies." },
];

const Insights = () => (
  <Layout>
    <SEOHead
      title="Insights — Loumilab | Technology Studio for Digital Products"
      description="Notes on product, engineering, security, and building technology companies. Coming soon from the Loumilab team."
      path="/insights"
      noindex
    />
    <section className="section-padding pt-32 lg:pt-40">
      <div className="section-container">
        <Reveal className="max-w-2xl">
          <Eyebrow>Insights</Eyebrow>
          <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-6xl">
            Thinking, in progress.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            We&apos;re putting together writing on how we design, build, and secure technology — plus notes
            from building our own products. First pieces are on the way.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {topics.map((t, i) => (
            <Reveal key={t.title} delay={i * 70} className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-lg font-semibold">{t.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{t.desc}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 rounded-3xl border border-border bg-surface-subtle p-10 text-center lg:p-14">
          <h2 className="text-2xl font-semibold lg:text-3xl">Want to talk before we publish?</h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            We&apos;re happy to get into the details of your project directly.
          </p>
          <Button size="lg" asChild className="mt-8">
            <Link to="/contact">
              Get in Touch <ArrowRight size={18} />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  </Layout>
);

export default Insights;
