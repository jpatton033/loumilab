import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import Eyebrow from "@/components/brand/Eyebrow";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, PenTool, Hammer, ShieldCheck, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Search,
    num: "01",
    title: "Discovery & Strategy",
    desc: "We dig into your goals, audience, and constraints to define the product vision, scope, and what success actually looks like.",
  },
  {
    icon: PenTool,
    num: "02",
    title: "Design & Prototyping",
    desc: "Wireframes, flows, and high-fidelity design created collaboratively. You see and approve the direction before we build.",
  },
  {
    icon: Hammer,
    num: "03",
    title: "Build",
    desc: "Production-ready engineering in short iterations, using modern tooling and automation where it genuinely speeds delivery.",
  },
  {
    icon: ShieldCheck,
    num: "04",
    title: "Secure & Review",
    desc: "Authentication, permissions, and data handling reviewed before launch — not bolted on after something goes wrong.",
  },
  {
    icon: Rocket,
    num: "05",
    title: "Launch",
    desc: "QA, performance tuning, and deployment. We launch lean so you can start learning from real users immediately.",
  },
  {
    icon: TrendingUp,
    num: "06",
    title: "Iterate & Scale",
    desc: "Data-driven improvements, feature expansion, and infrastructure work as usage grows.",
  },
];

const HowWeWork = () => (
  <Layout>
    <SEOHead
      title="How We Work — From Idea to Launch — Loumilab"
      description="Discovery, design, build, secure, launch, and scale. How Loumilab delivers digital products with speed and precision."
      path="/how-we-work"
    />

    <section className="relative overflow-hidden pt-32 pb-12 lg:pt-44 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 hero-wash" aria-hidden="true" />
      <div className="section-container relative max-w-3xl">
        <Eyebrow>Process</Eyebrow>
        <h1 className="mt-5 text-4xl font-semibold leading-tight lg:text-6xl">
          How we bring products to life.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Transparent, collaborative, and fast. A process built to get from idea to something real in weeks,
          then keep improving it.
        </p>
      </div>
    </section>

    <section className="section-padding pt-8">
      <div className="section-container">
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 70}>
              <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] glow-hover hover:border-accent/40">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <step.icon size={20} strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-sm font-semibold text-muted-foreground">{step.num}</span>
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold">{step.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="section-padding border-t border-border bg-surface-subtle">
      <div className="section-container text-center">
        <h2 className="text-3xl font-semibold lg:text-4xl">Ready to start at step one?</h2>
        <Button size="lg" asChild className="mt-8">
          <Link to="/contact">
            Start Your Project <ArrowRight size={18} />
          </Link>
        </Button>
      </div>
    </section>
  </Layout>
);

export default HowWeWork;
