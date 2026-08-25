import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PhoneFrame from "@/components/orders/PhoneFrame";
import StorefrontHeader from "@/components/orders/StorefrontHeader";
import { formatMoney } from "@/data/orders/storefronts";
import { usePublicPlans, planPriceLabel, planPeriodLabel, formatFeeBps } from "@/lib/orders/plans";
import {
  useIndustries,
  groupIndustries,
  findIndustry,
  resolveTerms,
  resolveWorkflow,
  PURCHASE_MODELS,
} from "@/lib/orders/industries";
import { toast } from "sonner";

interface DraftItem {
  name: string;
  price: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

const GetStarted = () => {
  const [step, setStep] = useState(0);
  const [industrySlug, setIndustrySlug] = useState("food-catering");
  const [purchaseModels, setPurchaseModels] = useState<string[]>(["products"]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ name: "", price: "" }]);
  const [hours, setHours] = useState("Fri–Sun · 4–9 PM");
  const [pickupInfo, setPickupInfo] = useState("Pickup only");
  const [planSlug, setPlanSlug] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: industries } = useIndustries();
  const { data: plans } = usePublicPlans();

  const industry = findIndustry(industries, industrySlug);
  const terms = resolveTerms(industry);
  const workflow = resolveWorkflow(industry);
  const groups = useMemo(() => groupIndustries(industries ?? []), [industries]);

  // Default the purchase models to whatever the chosen industry usually does.
  useEffect(() => {
    if (industry?.default_purchase_models?.length) {
      setPurchaseModels(industry.default_purchase_models);
    }
  }, [industry?.slug]);

  useEffect(() => {
    if (!planSlug && plans?.length) setPlanSlug(plans[1]?.slug ?? plans[0].slug);
  }, [plans, planSlug]);

  const stepTitles = [
    "Your industry",
    "How customers buy",
    "Business information",
    "Store details",
    `Add your ${terms.catalog.toLowerCase()}`,
    `${terms.schedule} & availability`,
    "Choose your plan",
    "Review & publish",
  ];

  const slug = useMemo(() => slugify(name) || "your-store", [name]);
  const monogram = useMemo(
    () =>
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "LO",
    [name]
  );

  const canContinue =
    (step === 0 && !!industrySlug) ||
    (step === 1 && purchaseModels.length > 0) ||
    (step === 2 && name.trim().length > 1) ||
    (step === 3 && description.trim().length > 4) ||
    step > 3;

  const updateItem = (i: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const toggleModel = (id: string) =>
    setPurchaseModels((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const previewStore = {
    name: name || "Your Store",
    location: location || "Your city",
    description: description || `Tell customers what you offer and why they'll come back.`,
    monogram,
    acceptingOrders: true,
    hours,
    pickupInfo,
  };

  const selectedPlan = plans?.find((p) => p.slug === planSlug) ?? null;

  const stepCardRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const el = stepCardRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const headerOffset = window.innerWidth >= 1024 ? 104 : 88;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  const publish = () => {
    setSubmitted(true);
    toast.success("Store draft saved", {
      description: "Publishing goes live when Orders launches. We'll be in touch to activate your store.",
    });
  };

  return (
    <Layout>
      <SEOHead
        title="Get Started with Loumilab Orders — Create Your Storefront"
        description="Set up your Loumilab Orders storefront in a few steps: your industry, business details, catalog, scheduling, and your plan."
        path="/orders/get-started"
      />

      <section className="section-padding pt-28 lg:pt-36">
        <div className="section-container">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} /> Back to Orders
          </Link>

          <div className="mt-8 max-w-2xl">
            <Eyebrow>Merchant onboarding</Eyebrow>
            <h1 className="mt-5 font-hero text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
              Let&apos;s build your storefront.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              A few short steps, shaped around your kind of business. You can change anything later.
            </p>
          </div>

          {/* Progress */}
          <div className="mt-12 flex flex-wrap gap-2">
            {stepTitles.map((title, i) => (
              <button
                key={title}
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  i === step
                    ? "border-transparent bg-foreground text-background"
                    : i < step
                      ? "border-accent/20 bg-accent/10 text-accent"
                      : "border-border text-muted-foreground"
                }`}
              >
                {i < step ? <Check size={12} className="mr-1 inline" /> : `${i + 1}. `}
                {title}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Form */}
            <div
              ref={stepCardRef}
              className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] lg:p-9"
            >
              <h2 className="font-display text-xl font-semibold">
                Step {step + 1} — {stepTitles[step]}
              </h2>

              <div className="mt-7 space-y-5">
                {step === 0 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      Pick what you do. Loumilab Orders adjusts the wording, the workflow and the tools you see.
                    </p>
                    {groups.map((group) => (
                      <div key={group.label}>
                        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {group.label}
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {group.items.map((option) => (
                            <button
                              key={option.slug}
                              type="button"
                              onClick={() => setIndustrySlug(option.slug)}
                              className={`rounded-2xl border p-4 text-left transition-colors ${
                                industrySlug === option.slug
                                  ? "border-accent bg-accent/5"
                                  : "border-border hover:border-foreground/20"
                              }`}
                            >
                              <span className="font-display text-sm font-semibold">{option.name}</span>
                              {option.description && (
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                  {option.description}
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Choose everything that applies — many businesses do more than one.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {PURCHASE_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => toggleModel(model.id)}
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            purchaseModels.includes(model.id)
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-foreground/20"
                          }`}
                        >
                          <span className="font-display text-sm font-semibold">{model.label}</span>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{model.description}</p>
                        </button>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
                      Your workflow: {workflow.join(" → ")}
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="biz-name">Business name</Label>
                      <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday Kitchen" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-category">What do you offer?</Label>
                      <Input
                        id="biz-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder={industry?.is_food ? "Home-cooked meals, baked goods, catering…" : "Repairs, installs, service calls…"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-location">City</Label>
                      <Input id="biz-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Atlanta, GA" />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="biz-desc">Store description</Label>
                      <Textarea
                        id="biz-desc"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                          industry?.is_food
                            ? "Weekend comfort food, made from scratch and ready for pickup."
                            : "Licensed, insured and same-week availability across the metro."
                        }
                      />
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary p-4 text-sm">
                      <p className="text-muted-foreground">Your store link will be</p>
                      <p className="mt-1 font-display font-semibold">loumilab.com/orders/store/{slug}</p>
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    {items.map((item, i) => (
                      <div key={i} className="grid gap-3 sm:grid-cols-[1.5fr_0.7fr]">
                        <div className="space-y-2">
                          <Label htmlFor={`item-${i}`}>
                            {terms.catalogItem} {i + 1}
                          </Label>
                          <Input
                            id={`item-${i}`}
                            value={item.name}
                            onChange={(e) => updateItem(i, { name: e.target.value })}
                            placeholder={industry?.is_food ? "Chicken Alfredo" : "Outlet installation"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`price-${i}`}>Price</Label>
                          <Input
                            id={`price-${i}`}
                            inputMode="decimal"
                            value={item.price}
                            onChange={(e) => updateItem(i, { price: e.target.value })}
                            placeholder="16.00"
                          />
                        </div>
                      </div>
                    ))}
                    {!industry?.is_food && (
                      <p className="text-xs text-muted-foreground">
                        Not sure on price? Leave it blank and quote each job individually.
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setItems((prev) => [...prev, { name: "", price: "" }])}
                    >
                      Add another {terms.catalogItem.toLowerCase()}
                    </Button>
                  </>
                )}

                {step === 5 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hours">{industry?.is_food ? "Ordering hours" : "Working hours"}</Label>
                      <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup">{terms.location} details</Label>
                      <Input id="pickup" value={pickupInfo} onChange={(e) => setPickupInfo(e.target.value)} />
                    </div>
                  </>
                )}

                {step === 6 && (
                  <div className="grid gap-3">
                    {(plans ?? []).map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setPlanSlug(p.slug)}
                        className={`rounded-2xl border p-5 text-left transition-colors ${
                          planSlug === p.slug ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-display font-semibold">{p.name}</span>
                          <span className="font-display font-semibold">
                            {planPriceLabel(p, false)}{" "}
                            <span className="text-sm font-normal text-muted-foreground">
                              {planPeriodLabel(p, false)}
                            </span>
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.platform_fee_bps == null
                            ? "Custom platform fee"
                            : `+ ${formatFeeBps(p.platform_fee_bps)} Loumilab platform fee`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">{name || "Your Store"}</p>
                      <p className="mt-1 text-muted-foreground">
                        {industry?.name ?? "Industry not set"} · {location || "City not set"}
                      </p>
                      <p className="mt-3 text-muted-foreground">{previewStore.description}</p>
                    </div>
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">
                        {items.filter((i) => i.name).length || 0} {terms.catalogItem.toLowerCase()}
                        {items.filter((i) => i.name).length === 1 ? "" : "s"}
                      </p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {items
                          .filter((i) => i.name)
                          .map((i, idx) => (
                            <li key={idx}>
                              {i.name} — {formatMoney(Math.round((Number(i.price) || 0) * 100))}
                            </li>
                          ))}
                        {items.filter((i) => i.name).length === 0 && <li>Nothing added yet.</li>}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">{selectedPlan?.name ?? "No"} plan</p>
                      <p className="mt-1 text-muted-foreground">
                        {hours} · {pickupInfo}
                      </p>
                      <p className="mt-1 text-muted-foreground">{workflow.join(" → ")}</p>
                    </div>

                    {submitted && (
                      <p className="rounded-2xl border border-accent/20 bg-accent/10 p-5 text-accent">
                        Draft saved. Orders is in development — Loumilab will reach out to activate your storefront.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-9 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft size={16} /> Back
                </Button>

                {step < stepTitles.length - 1 ? (
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={!canContinue}
                    onClick={() => setStep((s) => s + 1)}
                  >
                    Continue <ArrowRight size={16} />
                  </Button>
                ) : (
                  <Button type="button" className="rounded-full" onClick={publish}>
                    Publish store <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Live preview
              </p>
              <PhoneFrame className="mt-5" label="Storefront preview">
                <div className="px-5 pb-6 pt-3">
                  <StorefrontHeader store={previewStore} compact />
                  <div className="mt-5 space-y-2.5">
                    {items
                      .filter((i) => i.name)
                      .map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-2xl border border-border p-3">
                          <span className="truncate font-display text-sm font-semibold">{i.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatMoney(Math.round((Number(i.price) || 0) * 100))}
                          </span>
                        </div>
                      ))}
                    {items.filter((i) => i.name).length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                        Your {terms.catalog.toLowerCase()} will appear here.
                      </div>
                    )}
                  </div>
                </div>
              </PhoneFrame>
              <p className="mt-5 text-sm text-muted-foreground">
                Already set up?{" "}
                <Link to="/orders/dashboard" className="font-semibold text-accent hover:underline">
                  Open the dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default GetStarted;
