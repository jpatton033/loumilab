import heroWorkflow from "@/assets/heroes/workflow.jpg";
import { PageHero } from "@/components/brand/flow/Flow";
import { useState } from "react";
import { z } from "zod";
import { ArrowRight, ClipboardCheck, Code2, Settings2, Sparkles, Check, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/tracking";

type FormKind = "assessment" | "project";

const SERVICES = [
  { icon: ClipboardCheck, title: "Business Workflow Assessment", desc: "We evaluate your existing processes, software, AI usage, and operational challenges to identify opportunities for greater efficiency. Our assessments help uncover repetitive work, unnecessary AI dependencies, disconnected systems, and processes that could benefit from better software.", caps: ["Business process and workflow analysis", "Existing software evaluation", "AI dependency assessment", "Automation opportunity identification", "Efficiency and cost improvement recommendations", "Software implementation roadmap"] },
  { icon: Code2, title: "Custom Workflow Software", desc: "We design and develop purpose-built software that replaces repetitive manual processes and unnecessary AI interactions with streamlined, reliable applications tailored to your business.", caps: ["Internal business applications", "Content management and publishing systems", "Customer and employee portals", "Document management tools", "Custom dashboards and administrative systems", "Task management and approval workflows"] },
  { icon: Settings2, title: "Software & Process Optimization", desc: "Existing software doesn't always need to be replaced. We improve current applications and processes by simplifying workflows, connecting systems, eliminating redundant steps, and introducing automation where it makes sense.", caps: ["Existing application enhancements", "Workflow restructuring", "Software integrations", "Process automation", "Interface and usability improvements", "Performance and operational efficiency improvements"] },
  { icon: Sparkles, title: "Selective AI Integration", desc: "We help businesses use AI where it provides genuine value while reducing reliance on it for tasks that conventional software can perform. Our hybrid approach combines structured software, automation, and selective AI capabilities.", caps: ["AI workflow evaluation", "Reduction of unnecessary model calls", "AI-assisted features where appropriate", "Rules-based automation", "Hybrid software and AI architecture", "AI usage and performance optimization"] },
];

const SCENARIOS = [
  { name: "Content Publishing", before: "Repeatedly prompt AI to format, organize, and publish content.", after: "Use a custom rich-text editor, templates, and publishing dashboard.", outcome: "Routine publishing without AI calls." },
  { name: "Customer Order Updates", before: "Ask an AI assistant to retrieve and communicate routine order statuses.", after: "Customer-facing order tracking connected directly to order records.", outcome: "Real-time updates without generative AI." },
  { name: "Business Reporting", before: "Repeatedly ask AI to compile standard reports.", after: "Automated reporting dashboards with scheduled data processing.", outcome: "Consistent reports generated through traditional software." },
  { name: "Document Processing", before: "Use AI repeatedly to format standardized documents.", after: "Structured templates, form inputs, and automated document generation.", outcome: "Repeatable document workflows without unnecessary model calls." },
];

const STEPS = [
  ["Discover", "Understand the business, its technology, operational challenges, and goals."],
  ["Evaluate", "Identify inefficiencies, unnecessary AI dependencies, and opportunities for improvement."],
  ["Engineer", "Develop new software or optimize existing applications using the most appropriate technology."],
  ["Validate", "Evaluate reliability, task completion, efficiency, AI usage, and operating costs."],
  ["Improve", "Refine and expand the solution as business requirements evolve."],
];

const APPS = [
  ["Content publishing and management", "Editors, templates and scheduled publishing replace repeated formatting prompts."],
  ["Customer service and order tracking", "Status pages read directly from order records, so routine questions answer themselves."],
  ["Document generation and processing", "Structured forms fill standard templates the same way every time."],
  ["Internal administration", "Purpose-built admin tools turn scattered manual steps into one clear screen."],
  ["Business reporting and analytics", "Dashboards refresh from your data on a schedule instead of being rebuilt on request."],
  ["Employee onboarding and approvals", "Checklists and approval flows route work to the right person automatically."],
  ["Scheduling and service coordination", "Rules-based scheduling handles bookings and reminders without manual back-and-forth."],
  ["Data entry and system integrations", "Connected systems pass data between tools so it is entered once."],
];

const FAQS = [
  { q: "What is a Zero-Token Workflow?", a: "A workflow whose defined routine operations can execute without consuming generative AI tokens. It does not mean the software has no operating costs or that AI is never available." },
  { q: "Do you remove AI from our business?", a: "No. Our goal is to ensure technology is used intentionally, efficiently, and where it delivers measurable value. Sometimes the right solution involves AI; other times it means better software." },
  { q: "Can you improve software we already use?", a: "Yes. Existing software doesn't always need to be replaced. We can simplify workflows, connect systems, and introduce automation where it makes sense." },
];

const OBJECTIVES = ["Reduce repetitive tasks", "Reduce unnecessary AI usage", "Improve existing software", "Automate business workflows", "Improve operational efficiency", "Not sure / Need guidance"];
const SIZES = ["Just me", "2–10", "11–50", "51–200", "200+"];
const AI_USE = ["Yes, regularly", "Yes, occasionally", "No", "Not sure"];
const PROJECT_TYPES = ["Internal business application", "Customer or employee portal", "Dashboard or reporting", "Content or document system", "Integration or automation", "Other"];
const SYSTEM = ["Improve an existing system", "Build a new application", "Not sure"];
const TIMELINES = ["As soon as possible", "1–3 months", "3–6 months", "Flexible"];
const BUDGETS = ["Under $2,500", "$2,500 – $10,000", "$10,000 – $25,000", "$25,000+", "Not sure yet"];

const selectCls = "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const baseSchema = {
  name: z.string().trim().min(1, "Name is required").max(100),
  business: z.string().trim().min(1, "Business name is required").max(200),
  email: z.string().trim().email("Please enter a valid email").max(255),
};
const assessmentSchema = z.object({
  ...baseSchema,
  industry: z.string().trim().max(120).optional(),
  size: z.string().max(40).optional(),
  systems: z.string().trim().max(500).optional(),
  ai: z.string().max(40).optional(),
  processes: z.string().trim().min(10, "Please describe at least one process (10+ characters)").max(1500),
  objective: z.string().min(1, "Choose a primary objective"),
  details: z.string().trim().max(1500).optional(),
});
const projectSchema = z.object({
  ...baseSchema,
  type: z.string().min(1, "Choose a project type"),
  description: z.string().trim().min(10, "Please describe the project (10+ characters)").max(1500),
  system: z.string().max(60).optional(),
  timeline: z.string().max(40).optional(),
  budget: z.string().max(40).optional(),
});

const emptyA = { name: "", business: "", email: "", industry: "", size: "", systems: "", ai: "", processes: "", objective: "", details: "" };
const emptyP = { name: "", business: "", email: "", type: "", description: "", system: "", timeline: "", budget: "" };

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground/80">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function Sel({ id, value, onChange, options, placeholder }: { id: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}

function HeroVisual() {
  const Lane = ({ label, steps, loop, tone }: { label: string; steps: string[]; loop?: boolean; tone: "muted" | "accent" }) => (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.14em] ${tone === "accent" ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`wf-step rounded-full border px-3 py-1.5 text-xs font-medium ${tone === "accent" ? "border-accent/30 bg-accent/5 text-foreground" : "border-border bg-secondary text-muted-foreground"}`}
              style={{ animationDelay: `${i * 0.6}s` }}
            >
              {s}
            </span>
            {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
          </li>
        ))}
        {loop && <li className="flex items-center gap-1 text-xs text-muted-foreground"><RotateCcw className="wf-spin h-3.5 w-3.5" aria-hidden /> repeat</li>}
        {!loop && <li><Check className="h-4 w-4 text-accent" aria-label="done" /></li>}
      </ol>
    </div>
  );
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-secondary/50 p-4 shadow-sm sm:p-6" aria-label="Workflow comparison illustration">
      <Lane label="Traditional AI-dependent workflow" tone="muted" loop steps={["Business Task", "AI Prompt", "AI Processing", "Response", "Repeated Prompting"]} />
      <Lane label="Loumilab-optimized workflow" tone="accent" steps={["Business Task", "Purpose-Built Software", "Automated Execution", "Completed Task"]} />
    </div>
  );
}

const WorkflowOptimization = () => {
  const { toast } = useToast();
  const [kind, setKind] = useState<FormKind>("assessment");
  const [scenario, setScenario] = useState(0);
  const [a, setA] = useState(emptyA);
  const [p, setP] = useState(emptyP);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<FormKind | null>(null);

  const goForm = (k: FormKind, where: string) => {
    setKind(k);
    setSent(null);
    setErrors({});
    track("IntakeStart", { content_name: k === "assessment" ? "Optimize Your Workflow" : "Software project", location: where });
    document.getElementById("inquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    const last = localStorage.getItem("last_contact_submission");
    if (last && Date.now() - parseInt(last) < 60000) {
      toast({ title: "Please wait", description: "You can submit again in a moment.", variant: "destructive" });
      return;
    }
    const res = kind === "assessment" ? assessmentSchema.safeParse(a) : projectSchema.safeParse(p);
    if (!res.success) {
      const fe: Record<string, string> = {};
      res.error.errors.forEach((er) => { if (er.path[0]) fe[er.path[0] as string] = er.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const d = res.data as Record<string, string | undefined>;
    const line = (l: string, v?: string) => (v ? `${l}: ${v}` : null);
    const message = (kind === "assessment"
      ? ["Workflow assessment request", line("Industry", d.industry), line("Company size", d.size), line("Existing software/systems", d.systems), line("Using AI in operations", d.ai), line("Processes to improve", d.processes), line("Primary objective", d.objective), line("Additional details", d.details)]
      : ["Software project inquiry", line("Project type", d.type), line("Project description", d.description), line("Existing system or new", d.system), line("Desired timeline", d.timeline)]
    ).filter(Boolean).join("\n").slice(0, 2000);

    const { error } = await supabase.from("contact_submissions").insert({
      name: d.name!,
      email: d.email!,
      company: d.business || null,
      service: kind === "assessment" ? "Workflow assessment" : "Software project",
      budget: kind === "project" ? d.budget || null : null,
      message,
    });
    if (error) {
      toast({ title: "Something went wrong", description: "Please try again or email hello@loumilab.com.", variant: "destructive" });
    } else {
      localStorage.setItem("last_contact_submission", Date.now().toString());
      track("Lead", { content_name: kind === "assessment" ? "Workflow assessment" : "Workflow software project" });
      setSent(kind);
      kind === "assessment" ? setA(emptyA) : setP(emptyP);
      try { await supabase.functions.invoke("send-contact-email", { body: { email: d.email } }); } catch (err) { console.error(err); }
    }
    setSubmitting(false);
  };

  const s = SCENARIOS[scenario];

  return (
    <Layout>
      <SEOHead
        title="Workflow Optimization & Custom Software Solutions | Loumilab"
        description="Loumilab builds and optimizes business software to streamline workflows, reduce repetitive tasks, and minimize unnecessary AI dependence."
        path="/services/workflow-optimization"
        breadcrumbs={[{ name: "Solutions", path: "/services" }, { name: "Workflow Optimization", path: "/services/workflow-optimization" }]}
        jsonLd={[
          { "@context": "https://schema.org", "@type": "Service", name: "Intelligent Workflow & Software Optimization", serviceType: "Workflow Optimization", provider: { "@type": "Organization", name: "Loumilab", url: "https://loumilab.com" }, description: "Business workflow assessment, custom workflow software, software and process optimization, and selective AI integration." },
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
        ]}
      />
      <style>{`
        @keyframes wfPulse { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        .wf-step { animation: wfPulse 3s ease-in-out infinite; }
        @keyframes wfSpin { to { transform: rotate(-360deg) } }
        .wf-spin { animation: wfSpin 3s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .wf-step, .wf-spin { animation: none; opacity: 1 } }
      `}</style>

      {/* Hero */}
      <PageHero image={heroWorkflow} imageAlt="An operations manager arranging task cards in order at a concrete counter" eyebrow="Workflow Optimization" title="Smarter software. Less unnecessary AI." lede="We design, build and optimize business software that simplifies everyday operations and removes repetitive tasks. AI when valuable. Software when sufficient." actions={<>
        <Button size="lg" className="bg-background text-foreground hover:bg-background/90" onClick={() => goForm("assessment", "hero")}>Optimize Your Workflow</Button>
        <Button size="lg" variant="ghost" className="text-inverse hover:bg-inverse/10 hover:text-inverse" onClick={() => goForm("project", "hero")}>Discuss a Software Project</Button>
      </>} />
      <section className="section-padding"><div className="section-container"><HeroVisual /></div></section>

      {/* Intro */}
      <section className="section-padding bg-secondary/40">
        <div className="section-container grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Not every task needs AI.</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              <p>Artificial intelligence has created new possibilities for businesses, but it has also introduced new dependencies. Routine activities that could be handled through structured software are increasingly being performed through repeated prompts, AI agents, and token-consuming processes.</p>
              <p>At Loumilab, we take a different approach. We examine how businesses operate and determine where software, automation, and AI can provide the greatest value. Sometimes the right solution involves artificial intelligence. Other times, it means building a better application, simplifying an existing workflow, or eliminating unnecessary steps altogether.</p>
              <p>Our goal is not to remove AI from business operations. It is to ensure that technology is being used intentionally, efficiently, and where it delivers measurable value.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="space-y-3" aria-label="Software, automation and selective AI layers">
              {[
                ["Selective AI", "Used where judgment, language or patterns add real value.", "w-2/3"],
                ["Automation", "Rules and schedules that run routine steps on their own.", "w-5/6"],
                ["Purpose-built software", "The reliable foundation: records, forms, workflows, dashboards.", "w-full"],
              ].map(([t, d, w], i) => (
                <div key={t} className={`${w} mx-auto rounded-2xl border p-5 ${i === 0 ? "border-accent/30 bg-accent/5" : "border-border bg-background"}`}>
                  <p className="font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding">
        <div className="section-container">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Built around how your business works.</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">Whether you're improving an existing process or developing something entirely new, Loumilab helps turn operational challenges into practical software solutions.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {SERVICES.map(({ icon: Icon, title, desc, caps }) => (
              <article key={title} className="glow-hover rounded-3xl border border-border bg-background p-7 shadow-sm">
                <Icon className="h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {caps.map((c) => <li key={c} className="flex gap-2 text-sm text-foreground/80"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{c}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Zero-token */}
      <section className="section-padding bg-surface-inverse text-inverse">
        <div className="section-container">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Zero-Token Workflows</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">Some workflows shouldn't need a single AI token.</h2>
          <div className="mt-6 max-w-3xl space-y-4 leading-relaxed text-inverse-muted">
            <p>Many everyday business activities can be completed without relying on generative AI. Publishing content, updating records, generating routine reports, processing forms, managing orders, and coordinating internal tasks can often be handled more efficiently through purpose-built software.</p>
            <p>Loumilab develops workflows designed to perform these operations without requiring recurring AI model calls. We call these Zero-Token Workflows.</p>
          </div>
          <div role="tablist" aria-label="Example scenarios" className="mt-10 flex flex-wrap gap-2">
            {SCENARIOS.map((sc, i) => (
              <button key={sc.name} role="tab" aria-selected={scenario === i} aria-controls="wf-panel" onClick={() => setScenario(i)}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${scenario === i ? "border-accent bg-accent text-accent-foreground" : "border-inverse/20 text-inverse hover:border-inverse/50"}`}>
                {sc.name}
              </button>
            ))}
          </div>
          <div id="wf-panel" role="tabpanel" key={scenario} className="mt-6 grid gap-4 animate-fade-in md:grid-cols-2">
            <div className="rounded-3xl border border-inverse/15 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-inverse-muted">Before · AI-dependent</p>
              <p className="mt-3 text-lg">{s.before}</p>
            </div>
            <div className="rounded-3xl border border-accent/50 bg-accent/10 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">After · Optimized</p>
              <p className="mt-3 text-lg">{s.after}</p>
              <p className="mt-4 flex gap-2 text-sm text-inverse-muted"><Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />{s.outcome}</p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm text-inverse-muted">Illustrative examples, not customer projects. A Zero-Token Workflow does not mean the software has no operating costs or that AI is never available. It means the workflow's defined routine operations can execute without consuming generative AI tokens.</p>
        </div>
      </section>

      {/* How we work */}
      <section className="section-padding">
        <div className="section-container">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">From inefficient processes to better systems.</h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="relative border-l-2 border-border pl-5 md:border-l-0 md:border-t-2 md:pl-0 md:pt-6">
                <span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full bg-accent md:-top-[7px] md:left-0" aria-hidden />
                <p className="text-xs font-semibold text-accent">0{i + 1}</p>
                <h3 className="mt-1 font-semibold text-foreground">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Applications */}
      <section className="section-padding bg-secondary/40">
        <div className="section-container">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Practical solutions for everyday operations.</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APPS.map(([t, d]) => (
              <div key={t} className="glow-hover rounded-3xl border border-border bg-background p-6">
                <h3 className="font-semibold text-foreground">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Not every workflow can or should run without AI — we recommend it where it adds real value.</p>
        </div>
      </section>

      {/* Why */}
      <section className="section-padding">
        <div className="section-container grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Technology should solve problems, not create dependencies.</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              <p>At Loumilab, we believe effective software begins with understanding the problem, not choosing the technology.</p>
              <p>Rather than introducing artificial intelligence into every process, we evaluate what a business actually needs and develop solutions around those requirements. That may involve custom applications, improved software architecture, traditional automation, or carefully selected AI capabilities.</p>
              <p>Our approach prioritizes efficiency, usability, reliability, and long-term value.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[["Purpose-Built", "Software designed around real business requirements."], ["Efficiency-First", "Solutions that eliminate unnecessary steps, complexity, and AI consumption."], ["Technology-Agnostic", "The right tools for the task, whether that involves conventional software, automation, or AI."]].map(([t, d]) => (
              <div key={t} className="rounded-3xl border border-border p-6">
                <h3 className="font-semibold text-foreground">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-secondary/40">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="rounded-2xl border border-border bg-background p-5">
                <summary className="cursor-pointer font-medium text-foreground">{f.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry */}
      <section id="inquiry" className="section-padding scroll-mt-24">
        <div className="section-container max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Let's talk about your workflow.</h2>
          <div role="tablist" aria-label="Inquiry type" className="mt-8 grid grid-cols-1 gap-2 rounded-2xl border border-border p-1 sm:grid-cols-2">
            {([["assessment", "Request a Workflow Assessment"], ["project", "Discuss a Software Project"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setSent(null); setErrors({}); }}
                className={`min-h-11 rounded-xl px-4 text-sm font-medium transition-colors ${kind === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>

          {sent === kind ? (
            <div className="mt-8 rounded-3xl border border-border bg-secondary/40 p-8 text-center" role="status">
              <Check className="mx-auto h-8 w-8 text-accent" aria-hidden />
              <h3 className="mt-4 text-xl font-semibold text-foreground">Thanks — we received your {kind === "assessment" ? "assessment request" : "project details"}.</h3>
              <p className="mt-2 text-muted-foreground">We'll review it and reply by email.</p>
              <Button variant="outline" className="mt-6" onClick={() => setSent(null)}>Send another</Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-8 space-y-5 rounded-3xl border border-border p-6 sm:p-8">
              <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              {kind === "assessment" ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="a-name" label="Full name" error={errors.name}><Input id="a-name" value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} autoComplete="name" /></Field>
                    <Field id="a-biz" label="Business name" error={errors.business}><Input id="a-biz" value={a.business} onChange={(e) => setA({ ...a, business: e.target.value })} autoComplete="organization" /></Field>
                    <Field id="a-email" label="Business email" error={errors.email}><Input id="a-email" type="email" value={a.email} onChange={(e) => setA({ ...a, email: e.target.value })} autoComplete="email" /></Field>
                    <Field id="a-ind" label="Industry"><Input id="a-ind" value={a.industry} onChange={(e) => setA({ ...a, industry: e.target.value })} /></Field>
                    <Field id="a-size" label="Company size"><Sel id="a-size" value={a.size} onChange={(v) => setA({ ...a, size: v })} options={SIZES} placeholder="Choose (optional)" /></Field>
                    <Field id="a-ai" label="Are you currently using AI in your operations?"><Sel id="a-ai" value={a.ai} onChange={(v) => setA({ ...a, ai: v })} options={AI_USE} placeholder="Choose (optional)" /></Field>
                  </div>
                  <Field id="a-sys" label="Existing software or systems"><Input id="a-sys" value={a.systems} onChange={(e) => setA({ ...a, systems: e.target.value })} /></Field>
                  <Field id="a-proc" label="What processes would you like to improve?" error={errors.processes}><Textarea id="a-proc" rows={4} value={a.processes} onChange={(e) => setA({ ...a, processes: e.target.value })} /></Field>
                  <Field id="a-obj" label="Primary objective" error={errors.objective}><Sel id="a-obj" value={a.objective} onChange={(v) => setA({ ...a, objective: v })} options={OBJECTIVES} placeholder="Choose an objective" /></Field>
                  <Field id="a-det" label="Additional details"><Textarea id="a-det" rows={3} value={a.details} onChange={(e) => setA({ ...a, details: e.target.value })} /></Field>
                </>
              ) : (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="p-name" label="Full name" error={errors.name}><Input id="p-name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} autoComplete="name" /></Field>
                    <Field id="p-biz" label="Business name" error={errors.business}><Input id="p-biz" value={p.business} onChange={(e) => setP({ ...p, business: e.target.value })} autoComplete="organization" /></Field>
                    <Field id="p-email" label="Business email" error={errors.email}><Input id="p-email" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} autoComplete="email" /></Field>
                    <Field id="p-type" label="Project type" error={errors.type}><Sel id="p-type" value={p.type} onChange={(v) => setP({ ...p, type: v })} options={PROJECT_TYPES} placeholder="Choose a type" /></Field>
                    <Field id="p-sys" label="Existing system or new application"><Sel id="p-sys" value={p.system} onChange={(v) => setP({ ...p, system: v })} options={SYSTEM} placeholder="Choose (optional)" /></Field>
                    <Field id="p-time" label="Desired timeline"><Sel id="p-time" value={p.timeline} onChange={(v) => setP({ ...p, timeline: v })} options={TIMELINES} placeholder="Choose (optional)" /></Field>
                  </div>
                  <Field id="p-desc" label="Brief project description" error={errors.description}><Textarea id="p-desc" rows={4} value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} /></Field>
                  <Field id="p-bud" label="Estimated budget (optional)"><Sel id="p-bud" value={p.budget} onChange={(v) => setP({ ...p, budget: v })} options={BUDGETS} placeholder="Choose a range (optional)" /></Field>
                </>
              )}
              <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">{submitting ? "Sending…" : kind === "assessment" ? "Request assessment" : "Send project details"}</Button>
              <p className="text-xs text-muted-foreground">Your details are kept private and used only to reply to your inquiry.</p>
            </form>
          )}
        </div>
      </section>

      {/* Closing */}
      <section className="section-padding bg-surface-inverse text-inverse">
        <div className="section-container max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Your business doesn't need more complexity. It needs better systems.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-inverse-muted">Let's identify what's slowing your business down and build software that makes everyday work simpler, faster, and more efficient.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => goForm("assessment", "closing")}>Optimize Your Workflow</Button>
            <Button size="lg" variant="outline" className="border-inverse/30 bg-transparent text-inverse hover:bg-inverse/10 hover:text-inverse" onClick={() => goForm("project", "closing")}>Start a Software Project</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WorkflowOptimization;
