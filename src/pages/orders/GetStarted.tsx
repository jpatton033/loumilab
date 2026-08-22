import { useMemo, useState } from "react";
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
import { pricingPlans } from "@/data/orders/pricing";
import { toast } from "sonner";

interface DraftItem {
  name: string;
  price: string;
}

const stepTitles = [
  "Business information",
  "Store details",
  "Add your products",
  "Pickup & availability",
  "Choose your plan",
  "Review & publish",
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);

const GetStarted = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ name: "", price: "" }]);
  const [hours, setHours] = useState("Fri–Sun · 4–9 PM");
  const [pickupInfo, setPickupInfo] = useState("Pickup only");
  const [plan, setPlan] = useState(pricingPlans[1].id);
  const [submitted, setSubmitted] = useState(false);

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
    (step === 0 && name.trim().length > 1) ||
    (step === 1 && description.trim().length > 4) ||
    step > 1;

  const updateItem = (i: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const previewStore = {
    name: name || "Your Store",
    location: location || "Your city",
    description: description || "Tell customers what you make and why they'll love it.",
    monogram,
    acceptingOrders: true,
    hours,
    pickupInfo,
  };

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
        description="Set up your Loumilab Orders storefront in a few steps: business details, products, pickup settings, and your plan."
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
              Six short steps. You can change anything later.
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
            <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-soft)] lg:p-9">
              <h2 className="font-display text-xl font-semibold">
                Step {step + 1} — {stepTitles[step]}
              </h2>

              <div className="mt-7 space-y-5">
                {step === 0 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="biz-name">Business name</Label>
                      <Input id="biz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday Kitchen" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-category">What do you sell?</Label>
                      <Input
                        id="biz-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Home-cooked meals, baked goods, catering…"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-location">City</Label>
                      <Input id="biz-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Atlanta, GA" />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="biz-desc">Store description</Label>
                      <Textarea
                        id="biz-desc"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Weekend comfort food, made from scratch and ready for pickup."
                      />
                    </div>
                    <div className="rounded-2xl border border-border bg-secondary p-4 text-sm">
                      <p className="text-muted-foreground">Your store link will be</p>
                      <p className="mt-1 font-display font-semibold">loumilab.com/orders/store/{slug}</p>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    {items.map((item, i) => (
                      <div key={i} className="grid gap-3 sm:grid-cols-[1.5fr_0.7fr]">
                        <div className="space-y-2">
                          <Label htmlFor={`item-${i}`}>Item {i + 1}</Label>
                          <Input
                            id={`item-${i}`}
                            value={item.name}
                            onChange={(e) => updateItem(i, { name: e.target.value })}
                            placeholder="Chicken Alfredo"
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
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setItems((prev) => [...prev, { name: "", price: "" }])}
                    >
                      Add another item
                    </Button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hours">Ordering hours</Label>
                      <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup">Pickup instructions</Label>
                      <Input id="pickup" value={pickupInfo} onChange={(e) => setPickupInfo(e.target.value)} />
                    </div>
                  </>
                )}

                {step === 4 && (
                  <div className="grid gap-3">
                    {pricingPlans.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlan(p.id)}
                        className={`rounded-2xl border p-5 text-left transition-colors ${
                          plan === p.id ? "border-accent bg-accent/5" : "border-border hover:border-foreground/20"
                        }`}
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-display font-semibold">{p.name}</span>
                          <span className="font-display font-semibold">
                            {p.price} <span className="text-sm font-normal text-muted-foreground">{p.period}</span>
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                      </button>
                    ))}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4 text-sm">
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">{name || "Your Store"}</p>
                      <p className="mt-1 text-muted-foreground">
                        {category || "Category not set"} · {location || "City not set"}
                      </p>
                      <p className="mt-3 text-muted-foreground">{previewStore.description}</p>
                    </div>
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">
                        {items.filter((i) => i.name).length || 0} item
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
                        {items.filter((i) => i.name).length === 0 && <li>No items added yet.</li>}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border p-5">
                      <p className="font-display font-semibold">
                        {pricingPlans.find((p) => p.id === plan)?.name} plan
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {hours} · {pickupInfo}
                      </p>
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
                        Your items will appear here.
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
