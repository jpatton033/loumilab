import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PhoneFrame from "@/components/orders/PhoneFrame";
import StorefrontHeader from "@/components/orders/StorefrontHeader";
import ImageUpload from "@/components/orders/ImageUpload";
import StoreStatusBadge from "@/components/orders/StoreStatusBadge";
import StoreLink from "@/components/orders/StoreLink";
import PublishStoreButton from "@/components/orders/PublishStoreButton";
import PayoutSetupCard from "@/components/orders/PayoutSetupCard";
import { formatMoney } from "@/data/orders/storefronts";
import { usePublicPlans, planPriceLabel, planPeriodLabel, formatFeeBps } from "@/lib/orders/plans";
import { useSaveStoreSetup, useOnboardingPrefill, type OnboardingItem } from "@/lib/orders/store-admin";
import { useMerchantSetup, SETUP_STEP_INDEX } from "@/lib/orders/setup";
import { supabase } from "@/integrations/supabase/client";
import {
  useIndustries,
  groupIndustries,
  findIndustry,
  resolveTerms,
  resolveWorkflow,
  PURCHASE_MODELS,
} from "@/lib/orders/industries";
import { toast } from "sonner";

const DRAFT_KEY = "loumilab-orders-onboarding-draft";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

interface OnboardingDraft {
  step: number;
  industrySlug: string;
  purchaseModels: string[];
  name: string;
  category: string;
  location: string;
  description: string;
  logoUrl: string | null;
  items: OnboardingItem[];
  hours: string;
  pickupInfo: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFee: string;
  planSlug: string | null;
}

const readDraft = (): OnboardingDraft | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
  } catch {
    return null;
  }
};

const GetStarted = () => {
  const navigate = useNavigate();
  const restored = useRef<OnboardingDraft | null>(readDraft());
  const saved = restored.current;

  const [step, setStep] = useState(saved?.step ?? 0);
  const [email, setEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [industrySlug, setIndustrySlug] = useState(saved?.industrySlug ?? "food-catering");
  const [purchaseModels, setPurchaseModels] = useState<string[]>(saved?.purchaseModels ?? ["products"]);
  const [name, setName] = useState(saved?.name ?? "");
  const [category, setCategory] = useState(saved?.category ?? "");
  const [location, setLocation] = useState(saved?.location ?? "");
  const [description, setDescription] = useState(saved?.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(saved?.logoUrl ?? null);
  const [items, setItems] = useState<OnboardingItem[]>(saved?.items ?? [{ name: "", price: "" }]);
  const [hours, setHours] = useState(saved?.hours ?? "Fri–Sun · 4–9 PM");
  const [pickupInfo, setPickupInfo] = useState(saved?.pickupInfo ?? "Pickup only");
  const [pickupEnabled, setPickupEnabled] = useState(saved?.pickupEnabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(saved?.deliveryEnabled ?? false);
  const [deliveryFee, setDeliveryFee] = useState(saved?.deliveryFee ?? "");
  const [planSlug, setPlanSlug] = useState<string | null>(saved?.planSlug ?? null);
  /** True until the industry-default effect has run once, so a restored draft wins. */
  const keepRestoredModels = useRef(!!saved);

  const { data: industries } = useIndustries();
  const { data: plans } = usePublicPlans();
  const saveSetup = useSaveStoreSetup();

  const industry = findIndustry(industries, industrySlug);
  const terms = resolveTerms(industry);
  const workflow = resolveWorkflow(industry);
  const groups = useMemo(() => groupIndustries(industries ?? []), [industries]);
  const { data: setup } = useMerchantSetup(terms.catalog);

  const signedIn = !!email;
  const merchantId = setup?.merchantId ?? undefined;

  // Session — the wizard saves progress the moment a merchant is signed in.
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Default the purchase models to whatever the chosen industry usually does.
  useEffect(() => {
    if (keepRestoredModels.current) {
      keepRestoredModels.current = false;
      return;
    }
    if (industry?.default_purchase_models?.length) {
      setPurchaseModels(industry.default_purchase_models);
    }
  }, [industry?.slug]);

  useEffect(() => {
    if (!planSlug && plans?.length) setPlanSlug(plans[1]?.slug ?? plans[0].slug);
  }, [plans, planSlug]);

  // A merchant who already has a store sees their saved details, not a blank
  // form — otherwise the auto-save would overwrite real data with defaults.
  const { data: prefill, isFetched: prefillReady } = useOnboardingPrefill();
  const hydrated = useRef(!!saved);
  useEffect(() => {
    if (hydrated.current || !prefill) return;
    hydrated.current = true;
    keepRestoredModels.current = true;
    setIndustrySlug(prefill.industrySlug);
    if (prefill.purchaseModels.length) setPurchaseModels(prefill.purchaseModels);
    if (prefill.planSlug) setPlanSlug(prefill.planSlug);
    if (prefill.businessName) setName(prefill.businessName);
    if (prefill.category) setCategory(prefill.category);
    if (prefill.location) setLocation(prefill.location);
    if (prefill.description) setDescription(prefill.description);
    if (prefill.logoUrl) setLogoUrl(prefill.logoUrl);
    if (prefill.hours) setHours(prefill.hours);
    if (prefill.pickupInfo) setPickupInfo(prefill.pickupInfo);
    setPickupEnabled(prefill.pickupEnabled);
    setDeliveryEnabled(prefill.deliveryEnabled);
    if (prefill.deliveryFee) setDeliveryFee(prefill.deliveryFee);
    if (prefill.items.length) setItems(prefill.items);
  }, [prefill]);


  const stepTitles = [
    "Merchant account",
    "Your industry",
    "How customers buy",
    "Business information",
    "Store details & branding",
    `Add your ${terms.catalog.toLowerCase()}`,
    industry?.is_food ? "Fulfilment & hours" : "Availability",
    "Payments & payouts",
    "Choose your plan",
    "Preview & publish",
  ];
  const lastStep = stepTitles.length - 1;

  // Returning merchants pick up at the first unfinished step, and dashboard
  // links can point straight at one (?step=5).
  const [params] = useSearchParams();
  const stepParam = params.get("step");
  const jumped = useRef(false);
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (jumped.current) return;
    if (stepParam !== null && Number.isFinite(Number(stepParam))) {
      jumped.current = true;
      setStep(Math.min(lastStep, Math.max(0, Number(stepParam))));
      return;
    }
    if (saved || !setup?.merchantId) return;
    jumped.current = true;
    const outstanding = setup.tasks.find((t) => t.required && t.id !== "publish" && !t.done);
    const next = outstanding ? SETUP_STEP_INDEX[outstanding.id] : lastStep;
    if (next > 0) {
      setStep(next);
      setResumed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setup?.merchantId, stepParam]);

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
    (step === 0 && signedIn) ||
    (step === 1 && !!industrySlug) ||
    (step === 2 && purchaseModels.length > 0) ||
    (step === 3 && name.trim().length > 1) ||
    (step === 4 && description.trim().length > 4) ||
    (step === 6 && (pickupEnabled || deliveryEnabled)) ||
    step === 5 ||
    step === 7 ||
    step === 8;

  const updateItem = (i: number, patch: Partial<OnboardingItem>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const toggleModel = (id: string) =>
    setPurchaseModels((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const previewStore = {
    name: name || "Your Store",
    location: location || "Your city",
    description: description || `Tell customers what you offer and why they'll come back.`,
    monogram,
    logoUrl,
    acceptingOrders: setup?.isPublic ?? false,
    hours,
    pickupInfo,
  };

  const selectedPlan = plans?.find((p) => p.slug === planSlug) ?? null;
  const namedItems = items.filter((i) => i.name.trim());

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

  const snapshot = (): OnboardingDraft => ({
    step,
    industrySlug,
    purchaseModels,
    name,
    category,
    location,
    description,
    logoUrl,
    items,
    hours,
    pickupInfo,
    pickupEnabled,
    deliveryEnabled,
    deliveryFee,
    planSlug,
  });

  // Answers survive a sign-in round trip and an accidental refresh.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot()));
    } catch {
      // Storage unavailable — progress still saves to the merchant record.
    }
  });

  const setupPayload = () => ({
    businessName: name,
    slug,
    industrySlug,
    purchaseModels,
    planSlug,
    category,
    location,
    description,
    hours,
    pickupInfo,
    logoUrl,
    pickupEnabled,
    deliveryEnabled,
    deliveryFee,
    items,
  });

  /** Persists whatever is filled in so far. Silent unless it fails. */
  const persist = async (silent = true) => {
    if (!signedIn || name.trim().length < 2) return false;
    // Never save before saved details have had a chance to load.
    if (!prefillReady) return false;
    try {
      await saveSetup.mutateAsync(setupPayload());
      return true;
    } catch (error) {
      if (!silent) {
        toast.error("Couldn't save your store", {
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        });
      }
      return false;
    }
  };

  const goToSignIn = (mode: "signup" | "signin") =>
    navigate(`/sign-in?${mode === "signup" ? "mode=signup&" : ""}next=${encodeURIComponent("/orders/get-started")}`);

  const advance = async () => {
    if (step >= 3) void persist();
    setStep((s) => Math.min(lastStep, s + 1));
  };

  const finishSaving = async () => {
    const ok = await persist(false);
    if (ok) {
      toast.success("Everything is saved", {
        description: setup?.canPublish
          ? "You're ready to publish whenever you like."
          : "Pick up where you left off from your dashboard any time.",
      });
    }
    return ok;
  };

  const busy = saveSetup.isPending;

  return (
    <Layout>
      <SEOHead
        title="Get Started with Loumilab Orders — Create Your Storefront"
        description="Set up your Loumilab Orders storefront in a few steps: your account, industry, business details, catalog, payments, and publishing."
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
              A few short steps, shaped around your kind of business. Everything saves as you go, and your store
              stays private until you publish it.
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">
                  Step {step + 1} of {stepTitles.length} — {stepTitles[step]}
                </h2>
                {setup?.merchantId && <StoreStatusBadge status={setup.status} />}
              </div>

              <div className="mt-7 space-y-5">
                {step === 0 && (
                  <div className="space-y-5">
                    <p className="text-sm text-muted-foreground">
                      Your Loumilab account keeps your store, catalog and payouts together — and saves your
                      progress from here on.
                    </p>
                    {!authChecked ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 size={15} className="animate-spin" /> Checking your account…
                      </p>
                    ) : signedIn ? (
                      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
                        <p className="flex items-center gap-2 font-display text-sm font-semibold text-accent">
                          <Check size={15} /> Signed in as {email}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          We'll send a short welcome email once your merchant account is created.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" className="rounded-full" onClick={() => goToSignIn("signup")}>
                          Create your account <ArrowRight size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => goToSignIn("signin")}
                        >
                          I already have one
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {step === 1 && (
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

                {step === 2 && (
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

                {step === 3 && (
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

                {step === 4 && (
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
                    <ImageUpload
                      merchantId={merchantId}
                      kind="logo"
                      label="Store logo"
                      hint={
                        merchantId
                          ? "Optional. Shown on your storefront and order updates."
                          : "Available as soon as your business name is saved — you can add it here or later."
                      }
                      value={logoUrl}
                      onChange={setLogoUrl}
                    />
                    <div className="rounded-2xl border border-border bg-secondary p-4 text-sm">
                      <p className="text-muted-foreground">Your store link will be</p>
                      <p className="mt-1 font-display font-semibold">
                        loumilab.com/orders/store/{setup?.slug ?? slug}
                      </p>
                    </div>
                  </>
                )}

                {step === 5 && (
                  <>
                    {items.map((item, i) => (
                      <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                        <div className="grid gap-3 sm:grid-cols-[1.5fr_0.7fr]">
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
                            <Label htmlFor={`price-${i}`}>Price{industry?.is_food ? "" : " (optional)"}</Label>
                            <Input
                              id={`price-${i}`}
                              inputMode="decimal"
                              value={item.price}
                              onChange={(e) => updateItem(i, { price: e.target.value })}
                              placeholder={industry?.is_food ? "16.00" : "Quote"}
                            />
                          </div>
                        </div>
                        <ImageUpload
                          merchantId={merchantId}
                          kind="item"
                          shape="wide"
                          label={`${terms.catalogItem} image`}
                          value={item.imageUrl ?? null}
                          onChange={(url) => updateItem(i, { imageUrl: url })}
                        />
                      </div>
                    ))}
                    {!industry?.is_food && (
                      <p className="text-xs text-muted-foreground">
                        Not sure on price? Leave it blank and quote each {terms.transaction.toLowerCase()} individually.
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

                {step === 6 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hours">{industry?.is_food ? "Ordering hours" : "Working hours"}</Label>
                      <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup">{terms.location} details</Label>
                      <Input id="pickup" value={pickupInfo} onChange={(e) => setPickupInfo(e.target.value)} />
                    </div>
                    <div className="space-y-4 rounded-2xl border border-border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">
                            {industry?.is_food ? "Pickup" : "On-site or in-store"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Customers come to you at the details above.
                          </p>
                        </div>
                        <Switch checked={pickupEnabled} onCheckedChange={setPickupEnabled} />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">
                            {industry?.is_food ? "Delivery" : "We travel to the customer"}
                          </p>
                          <p className="text-xs text-muted-foreground">Add a flat fee if you charge for travel.</p>
                        </div>
                        <Switch checked={deliveryEnabled} onCheckedChange={setDeliveryEnabled} />
                      </div>
                      {deliveryEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="delivery-fee">Fee</Label>
                          <Input
                            id="delivery-fee"
                            inputMode="decimal"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            placeholder="5.00"
                            className="sm:w-32"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {step === 7 && (
                  <div className="space-y-5">
                    <div className="flex items-start gap-2 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
                      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        Payments and payouts are handled securely by Stripe. Loumilab Orders never stores your bank
                        details — you enter them once with Stripe and payouts land in your account automatically.
                      </span>
                    </div>
                    {signedIn ? (
                      <div className="rounded-2xl border border-border p-5">
                        <PayoutSetupCard bare returnPath="/orders/get-started?step=7" />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Create your account on the first step to connect payments.
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {setup?.payoutStatus === "payout_enabled"
                        ? "Payouts are active — continue to choose your plan."
                        : "Stripe opens in a new tab and brings you straight back here when you're done. You can also finish this later from your dashboard."}
                    </p>
                  </div>
                )}

                {step === 8 && (
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

                {step === 9 && (
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
                        {namedItems.length} {terms.catalogItem.toLowerCase()}
                        {namedItems.length === 1 ? "" : "s"}
                      </p>
                      <ul className="mt-2 space-y-1 text-muted-foreground">
                        {namedItems.map((i, idx) => (
                          <li key={idx}>
                            {i.name} —{" "}
                            {Number(i.price) > 0
                              ? formatMoney(Math.round(Number(i.price) * 100))
                              : "priced per request"}
                          </li>
                        ))}
                        {namedItems.length === 0 && <li>Nothing added yet.</li>}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">{selectedPlan?.name ?? "No"} plan</p>
                      <p className="mt-1 text-muted-foreground">
                        {hours} · {pickupInfo}
                      </p>
                      <p className="mt-1 text-muted-foreground">{workflow.join(" → ")}</p>
                    </div>

                    {setup?.merchantId && (
                      <div className="rounded-2xl border border-border p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-display font-semibold">Before you go live</p>
                          <StoreStatusBadge status={setup.status} />
                        </div>
                        <ul className="mt-3 space-y-1.5">
                          {setup.tasks
                            .filter((t) => t.required && t.id !== "publish")
                            .map((task) => (
                              <li key={task.id} className="flex items-start gap-2 text-muted-foreground">
                                <Check
                                  size={14}
                                  className={`mt-0.5 shrink-0 ${task.done ? "text-accent" : "opacity-25"}`}
                                />
                                {task.id === "catalog" ? terms.catalog : task.label}
                              </li>
                            ))}
                        </ul>
                        {setup.slug && (
                          <div className="mt-4 rounded-xl border border-border bg-secondary p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              Your store link
                            </p>
                            <p className="mt-1 font-display font-semibold">
                              loumilab.com/orders/store/{setup.slug}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              <Button asChild size="sm" variant="outline" className="rounded-full">
                                <Link to={`/orders/store/${setup.slug}`}>
                                  {setup.isPublic ? "View store" : "Preview store"} <ExternalLink size={14} />
                                </Link>
                              </Button>
                              <Button asChild size="sm" variant="ghost" className="rounded-full">
                                <Link to="/orders/dashboard">Open dashboard</Link>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-9 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <ArrowLeft size={16} /> Back
                </Button>

                {step < lastStep ? (
                  <Button type="button" className="rounded-full" disabled={!canContinue} onClick={advance}>
                    Continue <ArrowRight size={16} />
                  </Button>
                ) : setup?.isPublic ? (
                  <Button asChild className="rounded-full">
                    <Link to="/orders/dashboard">
                      Go to dashboard <ArrowRight size={16} />
                    </Link>
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => persist(false)}
                      disabled={busy || name.trim().length < 2}
                    >
                      Save and finish later
                    </Button>
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={publish}
                      disabled={busy || name.trim().length < 2}
                    >
                      {busy ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Saving…
                        </>
                      ) : (
                        <>
                          Publish store <ArrowRight size={16} />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {step === lastStep && setup && !setup.canPublish && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Publishing unlocks once payments setup is complete and the required steps are done. Everything
                  you've entered is saved.
                </p>
              )}
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
                    {namedItems.map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-2xl border border-border p-3">
                        <span className="truncate font-display text-sm font-semibold">{i.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {Number(i.price) > 0 ? formatMoney(Math.round(Number(i.price) * 100)) : "Quote"}
                        </span>
                      </div>
                    ))}
                    {namedItems.length === 0 && (
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
