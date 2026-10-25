import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { track } from "@/lib/tracking";
import {
  DRAFT_KEY, TOKEN_KEY, PACKAGE_LABELS, PROVIDER_LABELS, priceEmailSetup, startEmailSetupCheckout, submitEmailSetup, usd,
  type EmailPackage, type EmailProvider,
} from "@/lib/services/emailSetup";

interface Form {
  package: EmailPackage; full_name: string; business_name: string; contact_email: string; phone: string;
  owns_domain: boolean | null; existing_domain: string; registrar_access: "yes" | "no" | "unsure"; desired_domain: string;
  provider: EmailProvider | ""; primary_address: string; mailboxes: number; aliases: boolean; migration: boolean;
  extra_devices: number; standalone_domain: boolean; complex_needs: boolean; special_requirements: string; notes: string;
}
const empty: Form = {
  package: "email", full_name: "", business_name: "", contact_email: "", phone: "", owns_domain: null, existing_domain: "",
  registrar_access: "yes", desired_domain: "", provider: "", primary_address: "", mailboxes: 1, aliases: false, migration: false,
  extra_devices: 0, standalone_domain: false, complex_needs: false, special_requirements: "", notes: "",
};

const ACKS = [
  "Loumilab provides setup services, not email hosting.",
  "Domain and email subscription fees are paid separately to those providers.",
  "I keep ownership of my domain and email accounts.",
  "Setup needs my cooperation and access to the relevant provider accounts.",
  "Service begins after payment and scheduling.",
  "Refunds and cancellations follow Loumilab's service terms.",
];
const STEPS = ["Contact", "Domain", "Email", "Notes", "Review"];

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1.5 flex gap-1.5 text-xs leading-relaxed text-muted-foreground"><Info size={13} className="mt-0.5 shrink-0" />{children}</p>
);

function Choice<T extends string | boolean>({ value, options, onChange }: { value: T | null | ""; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={cn("min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
            value === v ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/40")}>
          {l}
        </button>
      ))}
    </div>
  );
}

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) => (
  <label className="block"><Label asChild className="text-sm font-medium"><span>{label}</span></Label><div className="mt-1.5">{children}</div>{hint && <Hint>{hint}</Hint>}</label>
);

const BusinessEmailStart = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [f, setF] = useState<Form>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      const pkg = params.get("package");
      return { ...empty, ...(saved ?? {}), ...(pkg === "email" || pkg === "email_domain" ? { package: pkg } : {}) };
    } catch { return empty; }
  });
  const [step, setStep] = useState(0);
  const [acks, setAcks] = useState<boolean[]>(ACKS.map(() => false));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    if (!started.current) { started.current = true; track("IntakeStart", { content_name: "Business Email" }); }
    setF((p) => ({ ...p, [k]: v }));
  };
  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(f)); }, [f]);

  const price = useMemo(() => priceEmailSetup({
    package: f.package, provider: (f.provider || "help") as EmailProvider, mailboxes: f.mailboxes, extraDevices: f.extra_devices,
    standaloneDomain: f.standalone_domain, migration: f.migration, ownsDomain: !!f.owns_domain,
    registrarAccess: f.owns_domain ? f.registrar_access : "yes", complexNeeds: f.complex_needs,
  }), [f]);

  const valid = [
    f.full_name.trim().length > 1 && f.business_name.trim() && /^\S+@\S+\.\S+$/.test(f.contact_email),
    f.owns_domain !== null && (f.owns_domain ? f.existing_domain.trim().length > 3 : true),
    !!f.provider && f.mailboxes >= 1,
    true,
    acks.every(Boolean),
  ];

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await submitEmailSetup({
        ...f, owns_domain: !!f.owns_domain, registrar_access: f.owns_domain ? f.registrar_access : "yes", provider: f.provider || "help",
      });
      track("IntakeSubmit", { content_name: res.needs_review ? "quote" : "standard" });
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.removeItem(DRAFT_KEY);
      if (res.needs_review) { nav(`/services/business-email/status/${res.token}`); return; }
      track("BeginCheckout", { value: price.totalCents / 100, currency: "USD" });
      const { url } = await startEmailSetupCheckout(res.token);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  return (
    <Layout>
      <SEOHead title="Get Started — Business Email Setup | Loumilab" description="Tell us about your business email and domain." path="/services/business-email/start" noindex />
      <section className="section-padding">
        <div className="section-container max-w-2xl">
          <Link to="/services/business-email" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /> Business Email &amp; Domain Setup</Link>
          <h1 className="mt-4 font-display text-3xl font-semibold lg:text-4xl">Tell us about your email</h1>
          <p className="mt-2 text-muted-foreground">A few questions so we can price and plan your setup. Your answers are saved on this device as you go.</p>

          <ol className="mt-8 grid grid-cols-5 gap-2" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s} className="text-center">
                <div className={cn("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-border")} />
                <span className={cn("mt-2 block text-xs", i === step ? "font-semibold" : "text-muted-foreground")}>{i + 1}. {s}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
            {step === 0 && (<>
              <Field label="Package">
                <Choice value={f.package} onChange={(v) => set("package", v)} options={[["email", "Email Setup · $99"], ["email_domain", "Email + Domain · $149"]]} />
              </Field>
              <Field label="Full name"><Input autoComplete="name" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
              <Field label="Business name"><Input autoComplete="organization" value={f.business_name} onChange={(e) => set("business_name", e.target.value)} /></Field>
              <Field label="Contact email" hint="Where we'll send updates. This can be your current personal email."><Input type="email" autoComplete="email" value={f.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></Field>
              <Field label="Phone (optional)"><Input type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            </>)}

            {step === 1 && (<>
              <Field label="Does your business already own a domain?" hint="A domain is your web address, like yourbusiness.com.">
                <Choice value={f.owns_domain} onChange={(v) => set("owns_domain", v)} options={[[true, "Yes"], [false, "Not yet"]]} />
              </Field>
              {f.owns_domain === true && (<>
                <Field label="Your domain"><Input placeholder="yourbusiness.com" value={f.existing_domain} onChange={(e) => set("existing_domain", e.target.value)} /></Field>
                <Field label="Can you sign in where you bought it?" hint="This is your registrar — for example GoDaddy, Namecheap, Squarespace or Google Domains.">
                  <Choice value={f.registrar_access} onChange={(v) => set("registrar_access", v)} options={[["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]]} />
                </Field>
              </>)}
              {f.owns_domain === false && (
                <Field label="Domain you'd like (optional)" hint="We'll help you check availability. You'll buy and own it yourself.">
                  <Input placeholder="yourbusiness.com" value={f.desired_domain} onChange={(e) => set("desired_domain", e.target.value)} />
                </Field>
              )}
              {f.owns_domain === false && f.package === "email" && (
                <p className="rounded-2xl bg-accent-soft p-4 text-sm">You'll need a domain for email. <button type="button" className="font-semibold underline" onClick={() => set("package", "email_domain")}>Switch to Email + Domain Setup</button>.</p>
              )}
            </>)}

            {step === 2 && (<>
              <Field label="Email provider" hint="Your provider hosts your email and bills you monthly. Not sure? We'll recommend one.">
                <Choice value={f.provider} onChange={(v) => set("provider", v)} options={Object.entries(PROVIDER_LABELS) as [EmailProvider, string][]} />
              </Field>
              <Field label="Main email address you'd like (optional)"><Input placeholder="hello@yourbusiness.com" value={f.primary_address} onChange={(e) => set("primary_address", e.target.value)} /></Field>
              <Field label="How many mailboxes?" hint="A mailbox is a separate inbox with its own sign-in, usually one per person. One is included; more are $25 each.">
                <Input type="number" min={1} max={100} inputMode="numeric" value={f.mailboxes} onChange={(e) => set("mailboxes", Math.max(1, Number(e.target.value) || 1))} />
              </Field>
              <Field label="Extra devices to set up" hint="Phones or computers you'd like us to help connect. $25 each.">
                <Input type="number" min={0} max={50} inputMode="numeric" value={f.extra_devices} onChange={(e) => set("extra_devices", Math.max(0, Number(e.target.value) || 0))} />
              </Field>
              <Field label="Do you need aliases?" hint="An alias is an extra address, like orders@, that delivers into an existing inbox. Up to three are included.">
                <Choice value={f.aliases} onChange={(v) => set("aliases", v)} options={[[true, "Yes"], [false, "No"]]} />
              </Field>
              <Field label="Do you need existing email moved over?" hint="Migration copies old messages into the new account. It's quoted separately after review.">
                <Choice value={f.migration} onChange={(v) => set("migration", v)} options={[[true, "Yes"], [false, "No"]]} />
              </Field>
            </>)}

            {step === 3 && (<>
              <Field label="Special requirements (optional)" hint="Shared inboxes, forwarding, website hosting on the same domain, and similar.">
                <Textarea rows={4} maxLength={2000} value={f.special_requirements} onChange={(e) => set("special_requirements", e.target.value)} />
              </Field>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox checked={f.complex_needs} onCheckedChange={(v) => set("complex_needs", v === true)} className="mt-0.5" />
                My setup has needs beyond the standard package, so I'd like a review first.
              </label>
              <Field label="Anything else? (optional)"><Textarea rows={3} maxLength={2000} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
              <p className="text-xs text-muted-foreground">Please don't include passwords, verification codes or recovery codes. We'll never ask for them.</p>
            </>)}

            {step === 4 && (<>
              <div>
                <h2 className="font-display text-xl font-semibold">Order summary</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.business_name} · {PROVIDER_LABELS[(f.provider || "help") as EmailProvider]}</p>
                {price.needsReview ? (
                  <div className="mt-4 rounded-2xl bg-accent-soft p-4 text-sm">
                    <p className="font-semibold">This request needs a quick review first.</p>
                    <ul className="mt-2 list-disc pl-5">{price.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                    <p className="mt-2">No payment is taken now. We'll email you a quote to approve.</p>
                  </div>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <tbody>
                      {price.lines.map((l) => <tr key={l.label}><td className="py-1.5">{l.label}</td><td className="py-1.5 text-right">{usd(l.cents)}</td></tr>)}
                      <tr><td className="py-1.5 text-muted-foreground">Taxes</td><td className="py-1.5 text-right text-muted-foreground">Calculated at checkout if applicable</td></tr>
                      <tr className="border-t border-border font-semibold"><td className="pt-3">Total due to Loumilab</td><td className="pt-3 text-right">{usd(price.totalCents)}</td></tr>
                    </tbody>
                  </table>
                )}
                <p className="mt-4 rounded-2xl bg-surface-subtle p-4 text-xs leading-relaxed text-muted-foreground">
                  Not included, paid directly to providers: domain registration and renewals, and your {PROVIDER_LABELS[(f.provider || "help") as EmailProvider] === "Help me choose" ? "email provider" : PROVIDER_LABELS[f.provider as EmailProvider]} subscription.
                </p>
              </div>
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">Please confirm</legend>
                {ACKS.map((a, i) => (
                  <label key={a} className="flex min-h-11 items-start gap-3 text-sm">
                    <Checkbox className="mt-0.5" checked={acks[i]} onCheckedChange={(v) => setAcks((p) => p.map((x, j) => (j === i ? v === true : x)))} />
                    <span>{a}{i === 5 && <> (<Link to="/orders/terms" className="underline" target="_blank">terms</Link>)</>}</span>
                  </label>
                ))}
              </fieldset>
              {error && <p className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            </>)}

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}><ArrowLeft size={16} /> Back</Button>
              {step < 4 ? (
                <Button disabled={!valid[step]} onClick={() => setStep((s) => s + 1)}>Continue <ArrowRight size={16} /></Button>
              ) : (
                <Button disabled={!valid[4] || busy} onClick={submit}>
                  {busy ? "Please wait…" : price.needsReview ? "Send for review" : `Pay ${usd(price.totalCents)} securely`}
                </Button>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">{PACKAGE_LABELS[f.package]} · Payments are processed securely by Stripe.</p>
        </div>
      </section>
    </Layout>
  );
};

export default BusinessEmailStart;
