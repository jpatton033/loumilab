import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import LoumilabLogo from "@/components/LoumilabLogo";
import SEOHead from "@/components/SEOHead";
import IntroAnimation from "@/components/IntroAnimation";
import Reveal from "@/components/Reveal";
const HeroScene = lazy(() => import("@/components/HeroScene"));
import {
  ArrowRight,
  Globe,
  Compass,
  Shield,
  Sparkles,
  Lock,
  Code,
  Cpu,
  Rocket,
  Network,
  Handshake,
  Gauge,
  MessageSquare,
  Lightbulb,
  Wrench,
  LineChart,
  BarChart3,
  RefreshCw,
  Activity,
  Search,
} from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Website Design & Development",
    tag: "Primary",
    desc: "Beautiful, fast, secure websites and web apps engineered to grow with your business.",
    items: [
      "Custom Business Websites",
      "Corporate Websites",
      "Landing Pages",
      "Portfolio Websites",
      "E-Commerce Websites",
      "Membership Websites",
      "Web Applications",
      "Responsive Design",
      "Website Redesigns",
      "Performance Optimization",
      "SEO Foundations",
      "Accessibility",
      "CMS Integration",
    ],
  },
  {
    icon: Code,
    title: "SaaS Development",
    desc: "Custom SaaS platforms and web applications — from MVP to scale, engineered for speed and security.",
    items: [
      "MVP Development",
      "Custom SaaS Platforms",
      "Multi-Tenant Architecture",
      "Authentication & Billing",
      "Admin Dashboards",
      "API Development",
      "Database Design",
      "Subscription Workflows",
      "Integrations & Webhooks",
      "Scalable Infrastructure",
    ],
  },
  {
    icon: Compass,
    title: "Technology Consulting",
    desc: "Strategic guidance that helps you get the most from your website and digital investments.",
    items: [
      "Technology Strategy",
      "Digital Transformation",
      "Website Planning",
      "Business Process Optimization",
      "Technical Consulting",
      "Cloud & Infrastructure Guidance",
      "Fractional Technical Leadership",
    ],
  },
  {
    icon: Shield,
    title: "Cybersecurity Consulting",
    desc: "Security woven into every project — from architecture to compliance readiness.",
    items: [
      "Website Security Reviews",
      "Security Best Practices",
      "Vulnerability Assessments",
      "Security Hardening",
      "Secure Authentication Guidance",
      "Risk Assessments",
      "Incident Response Planning",
      "Compliance Readiness Guidance",
    ],
  },
  {
    icon: Sparkles,
    title: "AI & Innovation",
    desc: "Leverage AI and emerging technologies to modernize how your business operates.",
    items: [
      "AI Integration",
      "Workflow Automation",
      "AI-Powered Customer Experiences",
      "Process Automation",
      "Emerging Technology Consulting",
      "Innovation Strategy",
    ],
  },
];

const why = [
  { icon: Sparkles, title: "Beautiful Modern Design", desc: "Premium visual craftsmanship across every pixel." },
  { icon: Lock, title: "Security Integrated", desc: "Built secure-by-design — never an afterthought." },
  { icon: Gauge, title: "Performance First", desc: "Engineered for speed, Core Web Vitals, and scale." },
  { icon: Cpu, title: "AI-Assisted Workflows", desc: "Modern AI tooling accelerates delivery without compromise." },
  { icon: Network, title: "Scalable Architecture", desc: "Built for tomorrow's load, today's velocity." },
  { icon: Handshake, title: "Long-Term Partnership", desc: "Transparent communication. Invested past launch." },
];

const products = [
  {
    name: "Atlas Commerce",
    tagline: "Premium e-commerce template",
    desc: "Conversion-optimized storefront with modern checkout, search, and CMS-driven content.",
    gradient: "from-[#1e3a8a] via-[#3b82f6] to-[#06b6d4]",
  },
  {
    name: "Beacon Studio",
    tagline: "Corporate marketing site",
    desc: "Editorial-grade design system for brands that lead with story and clarity.",
    gradient: "from-[#312e81] via-[#7c3aed] to-[#3b82f6]",
  },
  {
    name: "Forge Portal",
    tagline: "Secure client portal",
    desc: "Auth, dashboards, and self-serve workflows wired into a modern web app foundation.",
    gradient: "from-[#0f172a] via-[#1e293b] to-[#3b82f6]",
  },
];

const process = [
  { title: "Discover", desc: "Learn your business, goals, and audience." },
  { title: "Plan", desc: "Define strategy, architecture, and UX." },
  { title: "Design", desc: "Craft a modern, engaging visual identity." },
  { title: "Build", desc: "Fast, responsive, secure development." },
  { title: "Secure", desc: "Performance, security, accessibility, reliability." },
  { title: "Launch", desc: "Deploy with confidence — verified end-to-end." },
  { title: "Support", desc: "Ongoing maintenance, monitoring, and consulting." },
];

const ongoing = [
  { icon: Wrench, title: "Website Maintenance" },
  { icon: Shield, title: "Security Monitoring" },
  { icon: RefreshCw, title: "Software Updates" },
  { icon: Activity, title: "Website Backups" },
  { icon: Gauge, title: "Performance Monitoring" },
  { icon: Search, title: "SEO Maintenance" },
  { icon: BarChart3, title: "Analytics & Reporting" },
  { icon: Compass, title: "Technology Consulting" },
  { icon: Lock, title: "Security Consulting" },
  { icon: Lightbulb, title: "Feature Enhancements" },
];

const stats = [
  { value: 50, suffix: "+", label: "Websites shipped" },
  { value: 100, suffix: "%", label: "Built secure-by-design" },
  { value: 98, suffix: "%", label: "Client satisfaction" },
  { value: 24, suffix: "/7", label: "Monitoring available" },
];

const testimonials = [
  {
    quote:
      "Loumilab delivered a stunning, secure website that immediately elevated how our brand is perceived.",
    name: "Alex M.",
    role: "Founder, B2B Services",
  },
  {
    quote:
      "Beyond the build, they've become our go-to advisors for technology, security, and growth decisions.",
    name: "Priya R.",
    role: "Marketing Director, SaaS",
  },
  {
    quote:
      "Cinematic design, bulletproof engineering. The best web partner we've worked with — period.",
    name: "Daniel K.",
    role: "CEO, Boutique Studio",
  },
];

const useCountUp = (target: number, duration = 1400) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, val };
};

const Stat = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { ref, val } = useCountUp(value);
  return (
    <div className="text-center">
      <div
        ref={ref}
        className="text-4xl lg:text-6xl font-display font-semibold tracking-tight text-gradient"
      >
        {val}
        {suffix}
      </div>
      <div className="mt-3 text-xs lg:text-sm text-muted-foreground tracking-[0.2em] uppercase">
        {label}
      </div>
    </div>
  );
};

const Index = () => {
  // subtle parallax on hero based on mouse
  const heroRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--mx", `${x * 20}px`);
      el.style.setProperty("--my", `${y * 20}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      <IntroAnimation />
      <Layout>
        <SEOHead
          title="LOUMILAB — Modern Websites. Secure Solutions. Built for Growth."
          description="Loumilab is a premium website design and development studio. We build modern, secure, high-performance websites and provide expert technology, cybersecurity, and AI consulting."
          path="/"
        />

        {/* HERO */}
        <section
          ref={heroRef}
          className="relative min-h-[92vh] flex items-center overflow-hidden -mt-16 lg:-mt-20 pt-16 lg:pt-20"
        >
          {/* Animated gradient backdrop */}
          <div className="absolute inset-0 bg-[#050505]" />
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(900px 600px at 70% 30%, hsl(217 91% 35% / 0.35), transparent 60%), radial-gradient(700px 500px at 20% 80%, hsl(217 91% 50% / 0.18), transparent 65%)",
              transform: "translate3d(var(--mx,0),var(--my,0),0)",
              transition: "transform 600ms ease-out",
            }}
          />
          {/* Floating glass shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-drift-slow" />
            <div
              className="absolute bottom-0 right-0 w-[40rem] h-[40rem] rounded-full bg-accent/5 blur-3xl animate-drift-slow"
              style={{ animationDelay: "3s" }}
            />
          </div>
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100% / 0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 0.6) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* 3D scene — right half on lg, soft background on mobile */}
          <div className="absolute inset-0 lg:left-1/2 opacity-40 lg:opacity-100 pointer-events-none">
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
            {/* Edge fade so text remains legible on overlap */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#050505] to-transparent hidden lg:block" />
          </div>

          <div className="relative section-container w-full py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/40 backdrop-blur px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Loumi.AI · Studio
                </span>
              </Reveal>
              <Reveal delay={120}>
                <h1 className="font-hero mt-8 text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-[-0.04em]">
                  Modern Websites.{" "}
                  <span className="text-gradient">Secure Solutions.</span>{" "}
                  Built for Growth.
                </h1>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-8 text-lg lg:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  We design and develop premium websites, web applications, and digital experiences that combine exceptional design, modern technology, and security-first engineering — built to scale with your business.
                </p>
              </Reveal>
              <Reveal delay={360}>
                <div className="mt-12 flex flex-wrap gap-4">
                  <Button variant="accent" size="lg" asChild className="glow-hover rounded-full px-7">
                    <Link to="/contact">
                      Start Your Project <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="rounded-full px-7 border-border/60 hover:border-accent/50 hover:bg-accent/5"
                  >
                    <Link to="/contact">Schedule a Consultation</Link>
                  </Button>
                </div>
              </Reveal>
            </div>
            {/* Right column placeholder — scene already absolutely positioned */}
            <div className="hidden lg:block" aria-hidden="true" />
          </div>


          {/* Scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-accent to-transparent" />
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-border/60 bg-secondary/20">
          <div className="section-container py-16 grid grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className="section-padding relative">
          <div className="section-container">
            <Reveal>
              <div className="max-w-3xl mb-20">
                <span className="text-accent text-xs tracking-[0.3em] uppercase">What We Do</span>
                <h2 className="mt-4 text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                  Premium websites first.
                  <br />
                  <span className="text-gradient">Strategic partnership always.</span>
                </h2>
                <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
                  Website design and development is our core craft. We also advise clients on technology, cybersecurity, AI, and innovation — so every digital decision compounds.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              {services.map((s, i) => (
                <Reveal
                  key={s.title}
                  delay={i * 80}
                  className={i === 0 ? "lg:col-span-6" : "lg:col-span-3"}
                >
                  <div className="group relative h-full rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm p-8 overflow-hidden hover:border-accent/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_hsl(217_91%_60%/0.4)]">

                    <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-accent/0 group-hover:bg-accent/15 blur-3xl transition-all duration-700" />
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-500">
                          <s.icon className="text-accent" size={26} />
                        </div>
                        {s.tag && (
                          <span className="text-[10px] uppercase tracking-[0.25em] text-accent border border-accent/40 rounded-full px-2.5 py-1">
                            {s.tag}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-xl lg:text-2xl font-semibold mb-3">{s.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {s.items.map((it) => (
                          <span
                            key={it}
                            className="text-xs text-foreground/80 border border-border/60 rounded-full px-3 py-1.5 bg-background/40"
                          >
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WHY LOUMILAB */}
        <section className="section-padding bg-secondary/20 border-y border-border/60 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background:
                "radial-gradient(800px 500px at 80% 20%, hsl(217 91% 50% / 0.12), transparent 60%)",
            }}
          />
          <div className="section-container relative">
            <Reveal>
              <div className="max-w-3xl mb-20">
                <span className="text-accent text-xs tracking-[0.3em] uppercase">Why Loumilab</span>
                <h2 className="mt-4 text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                  Engineered for trust.
                  <br />
                  <span className="text-gradient">Designed to last.</span>
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 rounded-3xl overflow-hidden border border-border/60">
              {why.map((item, i) => (
                <Reveal key={item.title} delay={i * 60}>
                  <div className="h-full p-10 bg-background/80 hover:bg-background transition-colors duration-500 group">
                    <item.icon className="text-accent mb-6 group-hover:scale-110 transition-transform duration-500" size={28} />
                    <h3 className="font-display text-lg font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="section-padding">
          <div className="section-container">
            <Reveal>
              <div className="max-w-3xl mb-20">
                <span className="text-accent text-xs tracking-[0.3em] uppercase">Featured Products</span>
                <h2 className="mt-4 text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                  Software, crafted with{" "}
                  <span className="text-gradient">intention.</span>
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {products.map((p, i) => (
                <Reveal key={p.name} delay={i * 100}>
                  <div className="group relative h-[28rem] rounded-3xl overflow-hidden border border-border/60 bg-card">
                    {/* Animated gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-90`}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
                    {/* Mock device */}
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[85%] aspect-[16/10] rounded-xl bg-background/90 backdrop-blur border border-white/20 shadow-2xl group-hover:-translate-y-2 group-hover:scale-[1.02] transition-all duration-700 overflow-hidden">
                      <div className="h-6 bg-background/95 border-b border-border/60 flex items-center gap-1.5 px-3">
                        <span className="w-2 h-2 rounded-full bg-destructive/60" />
                        <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
                        <span className="w-2 h-2 rounded-full bg-green-500/60" />
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="h-2 w-1/3 bg-foreground/20 rounded" />
                        <div className="grid grid-cols-3 gap-1.5 mt-3">
                          {Array.from({ length: 6 }).map((_, k) => (
                            <div key={k} className="h-10 rounded bg-accent/20" />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Copy */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background/95 via-background/60 to-transparent">
                      <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">
                        {p.tagline}
                      </div>
                      <h3 className="font-display text-2xl font-semibold mb-2">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section className="section-padding bg-secondary/20 border-y border-border/60">
          <div className="section-container">
            <Reveal>
              <div className="max-w-3xl mb-20 text-center mx-auto">
                <span className="text-accent text-xs tracking-[0.3em] uppercase">Our Process</span>
                <h2 className="mt-4 text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                  From idea to{" "}
                  <span className="text-gradient">scale.</span>
                </h2>
              </div>
            </Reveal>
            <div className="relative">
              <div className="absolute left-0 right-0 top-6 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent hidden md:block" />
              <ol className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
                {process.map((step, i) => (
                  <Reveal key={step.title} delay={i * 80}>
                    <li className="flex flex-col items-center text-center">
                      <span className="relative w-12 h-12 rounded-full bg-background border border-accent/40 flex items-center justify-center font-display font-semibold text-accent shadow-[0_0_24px_-4px_hsl(217_91%_60%/0.5)]">
                        {i + 1}
                      </span>
                      <span className="mt-4 font-display text-sm font-semibold">{step.title}</span>
                      <span className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.desc}</span>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ONGOING SERVICES */}
        <section className="section-padding">
          <div className="section-container">
            <Reveal>
              <div className="max-w-3xl mb-16">
                <span className="text-accent text-xs tracking-[0.3em] uppercase">Ongoing Partnership</span>
                <h2 className="mt-4 text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                  A long-term partner,{" "}
                  <span className="text-gradient">not a one-off vendor.</span>
                </h2>
                <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
                  Recurring service plans that keep your website secure, fast, optimized, and evolving with your business.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {ongoing.map((o, i) => (
                <Reveal key={o.title} delay={i * 40}>
                  <div className="group h-full rounded-2xl border border-border/60 bg-card/40 p-5 hover:border-accent/40 transition-all duration-500">
                    <o.icon className="text-accent mb-3 group-hover:scale-110 transition-transform duration-500" size={22} />
                    <div className="font-display text-sm font-semibold leading-tight">{o.title}</div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-12">
              <Button variant="outline" asChild className="rounded-full px-6 border-border/60 hover:border-accent/50 hover:bg-accent/5">
                <Link to="/contact">
                  <MessageSquare size={16} /> Schedule a Consultation
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="section-padding">
          <div className="section-container">
            <Reveal>
              <div className="max-w-3xl mb-20">
                <span className="text-accent text-xs tracking-[0.3em] uppercase">Client Success</span>
                <h2 className="mt-4 text-4xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                  Trusted by teams who{" "}
                  <span className="text-gradient">ship.</span>
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 100}>
                  <figure className="h-full rounded-3xl border border-border/60 bg-card/40 p-8 hover:border-accent/40 transition-all duration-500">
                    <blockquote className="text-lg leading-relaxed text-foreground/90">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-8 pt-6 border-t border-border/60">
                      <div className="font-display font-semibold">{t.name}</div>
                      <div className="text-sm text-muted-foreground">{t.role}</div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="section-padding relative overflow-hidden">
          <div className="absolute inset-0 bg-[#050505]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(800px 500px at 50% 50%, hsl(217 91% 40% / 0.35), transparent 65%)",
            }}
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-drift-slow" />
            <div
              className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-drift-slow"
              style={{ animationDelay: "4s" }}
            />
          </div>
          <div className="relative section-container text-center">
            <Reveal>
              <LoumilabLogo size="lg" className="mx-auto mb-10" />
            </Reveal>
            <Reveal delay={120}>
              <h2 className="text-5xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.05]">
                Let's build{" "}
                <span className="text-gradient">what's next.</span>
              </h2>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-8 text-lg text-muted-foreground max-w-xl mx-auto">
                Tell us about your idea. We'll respond within 24 hours with a clear path forward.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-12">
                <Button variant="accent" size="lg" asChild className="glow-hover rounded-full px-8">
                  <Link to="/contact">
                    Start Your Project <ArrowRight size={18} />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </Layout>
    </>
  );
};

export default Index;
