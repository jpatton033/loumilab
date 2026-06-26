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
    <div>
      <div
        ref={ref}
        className="font-hero text-4xl lg:text-6xl font-extrabold tracking-[-0.04em] text-white"
      >
        {val}
        {suffix}
      </div>
      <div className="mt-3 text-[11px] lg:text-xs text-zinc-500 tracking-[0.3em] uppercase">
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
          {/* Solid base */}
          <div className="absolute inset-0 bg-[#0A0A0B]" />
          {/* Single quiet halo */}
          <div
            className="absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(900px 600px at 70% 35%, hsl(217 91% 30% / 0.22), transparent 65%)",
              transform: "translate3d(var(--mx,0),var(--my,0),0)",
              transition: "transform 800ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />

          {/* 3D scene — ambient texture only */}
          <div className="absolute inset-0 lg:left-1/2 opacity-25 pointer-events-none">
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
            <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent hidden lg:block" />
          </div>

          <div className="relative section-container w-full py-28 lg:py-40">
            <div className="max-w-5xl">
              <Reveal>
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/5 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-[#3B82F6]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                  Design + Engineering Studio
                </span>
              </Reveal>
              <Reveal delay={120}>
                <h1 className="font-hero mt-10 font-black leading-[0.9] tracking-[-0.045em]" style={{ fontSize: "clamp(3rem, 9.5vw, 8rem)" }}>
                  Modern Websites.{" "}
                  <span className="text-[#3B82F6]">Secure Solutions.</span>{" "}
                  Built for Growth.
                </h1>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-10 text-xl md:text-2xl text-zinc-400 font-light max-w-2xl leading-relaxed">
                  Premium websites, web applications, and digital experiences — designed with restraint, engineered for security, built to scale.
                </p>
              </Reveal>
              <Reveal delay={360}>
                <div className="mt-14 flex flex-wrap items-center gap-4">
                  <Button asChild size="lg" className="rounded-full px-8 h-12 bg-white text-black hover:bg-zinc-200 font-semibold">
                    <Link to="/contact">
                      Start Your Project <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="rounded-full px-8 h-12 bg-[#161617] border-zinc-800 hover:border-zinc-600 hover:bg-[#161617] text-white font-semibold"
                  >
                    <Link to="/contact">Schedule a Consultation</Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
            <span className="text-[10px] tracking-[0.4em] uppercase text-zinc-500">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-zinc-600 to-transparent" />
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-zinc-900">
          <div className="section-container py-12 grid grid-cols-2 lg:grid-cols-4 gap-10">
            {stats.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className="section-padding relative">
          <div className="section-container">
            <Reveal>
              <div className="max-w-4xl mb-20">
                <span className="text-[#3B82F6] text-[11px] tracking-[0.4em] uppercase font-semibold">What We Do</span>
                <h2 className="font-hero mt-6 text-5xl lg:text-7xl font-extrabold leading-[0.95] tracking-[-0.035em]">
                  Specialized disciplines.
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {services.map((s, i) => {
                // Bento spans: 0=8, 1=4, 2=4, 3=4, 4=4
                const spans = ["md:col-span-8", "md:col-span-4", "md:col-span-4", "md:col-span-4", "md:col-span-4"];
                const isFeatured = i === 0;
                return (
                  <Reveal key={s.title} delay={i * 80} className={spans[i] ?? "md:col-span-4"}>
                    <div className="group relative h-full rounded-[2rem] border border-zinc-900 bg-[#161617] p-10 overflow-hidden hover:border-zinc-700 transition-colors duration-700 flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-[#3B82F6] flex items-center justify-center">
                          <s.icon className="text-white" size={22} strokeWidth={1.75} />
                        </div>
                        {s.tag && (
                          <span className="text-[10px] uppercase tracking-[0.3em] text-[#3B82F6]">
                            {s.tag}
                          </span>
                        )}
                      </div>
                      <h3 className={`font-hero font-bold tracking-[-0.02em] mb-4 ${isFeatured ? "text-4xl lg:text-5xl" : "text-2xl lg:text-3xl"}`}>
                        {s.title}
                      </h3>
                      <p className={`text-zinc-400 leading-relaxed ${isFeatured ? "text-lg max-w-xl" : "text-base"}`}>
                        {s.desc}
                      </p>
                      <ul className="mt-8 space-y-px">
                        {s.items.slice(0, isFeatured ? 6 : 4).map((it) => (
                          <li
                            key={it}
                            className="text-sm text-zinc-300 py-2.5 border-t border-zinc-900 first:border-t-0 flex items-center gap-3"
                          >
                            <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                            {it}
                          </li>
                        ))}
                        {s.items.length > (isFeatured ? 6 : 4) && (
                          <li className="text-xs text-zinc-600 pt-3 tracking-wide">
                            + {s.items.length - (isFeatured ? 6 : 4)} more
                          </li>
                        )}
                      </ul>
                    </div>
                  </Reveal>
                );
              })}
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
