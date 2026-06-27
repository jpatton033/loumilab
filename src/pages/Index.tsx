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
                <h1 className="font-hero mt-10 font-black leading-[0.9] tracking-[-0.045em]" style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)" }}>
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
        <section className="section-padding border-t border-zinc-900">
          <div className="section-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-32">
                  <Reveal>
                    <span className="text-[#3B82F6] text-[11px] tracking-[0.4em] uppercase font-semibold">Why Loumilab</span>
                  </Reveal>
                  <Reveal delay={120}>
                    <h2 className="font-hero mt-6 text-5xl lg:text-7xl font-extrabold leading-[0.95] tracking-[-0.035em]">
                      The standard,<br />redefined.
                    </h2>
                  </Reveal>
                </div>
              </div>
              <div className="lg:col-span-7 space-y-12">
                {why.map((item, i) => (
                  <Reveal key={item.title} delay={i * 80}>
                    <div className="border-t border-zinc-900 pt-10">
                      <div className="flex items-baseline gap-6 mb-5">
                        <span className="text-zinc-600 font-mono text-sm tracking-widest">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="font-hero text-2xl lg:text-3xl font-bold tracking-[-0.02em]">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-zinc-400 text-lg lg:text-xl leading-relaxed font-light pl-[3.25rem]">
                        {item.desc}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section className="section-padding border-t border-zinc-900">
          <div className="section-container">
            <Reveal>
              <div className="max-w-4xl mb-20">
                <span className="text-[#3B82F6] text-[11px] tracking-[0.4em] uppercase font-semibold">Featured Work</span>
                <h2 className="font-hero mt-6 text-5xl lg:text-7xl font-extrabold leading-[0.95] tracking-[-0.035em]">
                  Software, crafted with intention.
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {products.map((p, i) => (
                <Reveal key={p.name} delay={i * 100}>
                  <div className="group relative h-[28rem] rounded-[2rem] overflow-hidden border border-zinc-900 bg-[#161617]">
                    {/* Accent stripe */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/60 to-transparent" />
                    {/* Mock device */}
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[85%] aspect-[16/10] rounded-xl bg-[#0A0A0B] border border-zinc-800 shadow-2xl group-hover:-translate-y-1 transition-transform duration-700 overflow-hidden">
                      <div className="h-6 bg-[#0A0A0B] border-b border-zinc-900 flex items-center gap-1.5 px-3">
                        <span className="w-2 h-2 rounded-full bg-zinc-700" />
                        <span className="w-2 h-2 rounded-full bg-zinc-700" />
                        <span className="w-2 h-2 rounded-full bg-zinc-700" />
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="h-2 w-1/3 bg-zinc-800 rounded" />
                        <div className="grid grid-cols-3 gap-1.5 mt-3">
                          {Array.from({ length: 6 }).map((_, k) => (
                            <div key={k} className="h-10 rounded bg-[#3B82F6]/15" />
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Copy */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[#3B82F6] mb-3">
                        {p.tagline}
                      </div>
                      <h3 className="font-hero text-2xl font-bold tracking-[-0.02em] mb-2">{p.name}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS TIMELINE */}
        <section className="section-padding border-t border-zinc-900">
          <div className="section-container">
            <Reveal>
              <div className="max-w-4xl mb-20">
                <span className="text-[#3B82F6] text-[11px] tracking-[0.4em] uppercase font-semibold">Our Process</span>
                <h2 className="font-hero mt-6 text-5xl lg:text-7xl font-extrabold leading-[0.95] tracking-[-0.035em]">
                  From idea to scale.
                </h2>
              </div>
            </Reveal>
            <div className="relative">
              <div className="absolute left-0 right-0 top-6 h-px bg-zinc-900 hidden md:block" />
              <ol className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
                {process.map((step, i) => (
                  <Reveal key={step.title} delay={i * 80}>
                    <li className="flex flex-col items-start">
                      <span className="relative w-12 h-12 rounded-full bg-[#0A0A0B] ring-1 ring-zinc-800 flex items-center justify-center font-hero font-extrabold text-white text-sm">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-5 font-hero text-base font-bold tracking-[-0.01em]">{step.title}</span>
                      <span className="mt-2 text-xs text-zinc-500 leading-relaxed">{step.desc}</span>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ONGOING SERVICES */}
        <section className="section-padding border-t border-zinc-900">
          <div className="section-container">
            <Reveal>
              <div className="max-w-4xl mb-16">
                <span className="text-[#3B82F6] text-[11px] tracking-[0.4em] uppercase font-semibold">Ongoing Partnership</span>
                <h2 className="font-hero mt-6 text-5xl lg:text-7xl font-extrabold leading-[0.95] tracking-[-0.035em]">
                  A long-term partner.
                </h2>
                <p className="mt-8 text-lg lg:text-xl text-zinc-400 font-light max-w-2xl leading-relaxed">
                  Recurring service plans that keep your website secure, fast, and evolving with your business.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {ongoing.map((o, i) => (
                <Reveal key={o.title} delay={i * 40}>
                  <div className="group h-full rounded-2xl border border-zinc-900 bg-[#161617] p-6 hover:border-zinc-700 transition-colors duration-700">
                    <div className="flex items-center gap-2 mb-4">
                      <o.icon className="text-white" size={20} strokeWidth={1.75} />
                      <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                    </div>
                    <div className="font-hero text-sm font-bold tracking-[-0.01em] leading-tight">{o.title}</div>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="mt-14">
              <Button variant="outline" asChild className="rounded-full px-6 h-11 bg-[#161617] border-zinc-800 hover:border-zinc-600 hover:bg-[#161617] text-white">
                <Link to="/contact">
                  <MessageSquare size={16} /> Schedule a Consultation
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="section-padding border-t border-zinc-900">
          <div className="section-container">
            <Reveal>
              <div className="max-w-4xl mb-20">
                <span className="text-[#3B82F6] text-[11px] tracking-[0.4em] uppercase font-semibold">Client Success</span>
                <h2 className="font-hero mt-6 text-5xl lg:text-7xl font-extrabold leading-[0.95] tracking-[-0.035em]">
                  Trusted by teams who ship.
                </h2>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 100}>
                  <figure className="h-full rounded-[2rem] border border-zinc-900 bg-[#161617] p-10 hover:border-zinc-700 transition-colors duration-700 flex flex-col">
                    <blockquote className="text-xl leading-relaxed text-zinc-200 font-light flex-1">
                      "{t.quote}"
                    </blockquote>
                    <figcaption className="mt-10">
                      <span className="block w-8 h-px bg-[#3B82F6] mb-4" />
                      <div className="font-hero font-bold text-base tracking-[-0.01em]">{t.name}</div>
                      <div className="text-sm text-zinc-500 mt-1">{t.role}</div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="section-padding relative overflow-hidden border-t border-zinc-900">
          <div className="absolute inset-0 bg-[#0A0A0B]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(700px 450px at 50% 50%, hsl(217 91% 30% / 0.25), transparent 70%)",
            }}
          />
          <div className="relative section-container text-center max-w-4xl mx-auto">
            <Reveal>
              <LoumilabLogo size="lg" className="mx-auto mb-12" />
            </Reveal>
            <Reveal delay={120}>
              <h2 className="font-hero text-5xl lg:text-8xl font-extrabold tracking-[-0.04em] leading-[0.95]">
                Let's build{" "}
                <span className="text-[#3B82F6]">what's next.</span>
              </h2>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-10 text-lg lg:text-xl text-zinc-400 font-light max-w-xl mx-auto leading-relaxed">
                Tell us about your idea. We'll respond within 24 hours with a clear path forward.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="mt-14">
                <Button asChild size="lg" className="rounded-full px-8 h-12 bg-white text-black hover:bg-zinc-200 font-semibold">
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
