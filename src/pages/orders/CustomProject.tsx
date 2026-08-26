import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Paperclip, X } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import Eyebrow from "@/components/brand/Eyebrow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormState {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  orders_account_email: string;
  storefront_url: string;
  business_type: string;
  build_goal: string;
  project_description: string;
  desired_features: string;
  existing_website: string;
  existing_software: string;
  budget_range: string;
  launch_timeframe: string;
  integrations_required: string;
  location_count: string;
  monthly_order_volume: string;
  additional_notes: string;
}

const EMPTY: FormState = {
  business_name: "",
  contact_name: "",
  email: "",
  phone: "",
  orders_account_email: "",
  storefront_url: "",
  business_type: "",
  build_goal: "",
  project_description: "",
  desired_features: "",
  existing_website: "",
  existing_software: "",
  budget_range: "",
  launch_timeframe: "",
  integrations_required: "",
  location_count: "",
  monthly_order_volume: "",
  additional_notes: "",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;

const CustomProject = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    Array.from(incoming).forEach((file) => {
      if (next.length >= MAX_FILES) return;
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is larger than 10 MB.`);
        return;
      }
      next.push(file);
    });
    setFiles(next);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.business_name.trim() || !form.contact_name.trim() || !form.email.trim()) {
      toast.error("Business name, contact name and email are required.");
      return;
    }
    if (!form.build_goal.trim() || !form.project_description.trim()) {
      toast.error("Tell us what you want built and a little about the project.");
      return;
    }

    setSubmitting(true);
    try {
      const attachment_paths: string[] = [];

      if (files.length > 0) {
        // Uploads must land inside a server-issued, short-lived slot folder.
        const { data: folder, error: slotError } = await (
          supabase.rpc as unknown as (fn: string) => Promise<{ data: string | null; error: Error | null }>
        )("create_custom_project_upload_slot");
        if (slotError || !folder) throw slotError ?? new Error("Could not prepare file upload.");

        for (const file of files.slice(0, MAX_FILES)) {
          const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
          const path = `${folder}/${safeName}`;
          const { error } = await supabase.storage.from("custom-project-files").upload(path, file, { upsert: false });
          if (error) throw error;
          attachment_paths.push(path);
        }
      }

      const { data, error } = await supabase
        .from("custom_project_leads")
        .insert({ ...form, email: form.email.trim().toLowerCase(), attachment_paths })
        .select("id")
        .single();
      if (error) throw error;

      // Fire-and-forget notification — a mail failure must not lose the lead.
      supabase.functions
        .invoke("send-custom-project-lead", { body: { leadId: data.id, email: form.email.trim().toLowerCase() } })
        .catch(() => {});

      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message.includes("Rate limit") ? message : "We couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Layout>
        <SEOHead
          title="Request Received — Custom Build | Loumilab Orders"
          description="Your custom project request reached the Loumilab team."
          path="/orders/custom"
          noindex
        />
        <section className="section-padding pt-32">
          <div className="section-container max-w-xl text-center">
            <CheckCircle2 size={44} className="mx-auto text-accent" />
            <h1 className="mt-6 font-hero text-4xl font-semibold tracking-tight">Request received</h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Thanks — your project is now with the Loumilab team. We review every request and will reach out to
              schedule a discovery conversation.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link to="/orders">Back to Orders</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/">Explore Loumilab</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Build With Loumilab — Custom Project Intake | Loumilab Orders"
        description="Tell Loumilab what you want built: a custom website, e-commerce store, ordering system, application, integrations or automation."
        path="/orders/custom"
      />

      <section className="section-padding pt-28 lg:pt-36">
        <div className="section-container max-w-3xl">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} /> Back to Orders
          </Link>

          <div className="mt-8">
            <Eyebrow>Custom</Eyebrow>
            <h1 className="mt-5 font-hero text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
              Need more than a storefront? Let's build it.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Custom sites, ordering systems, applications, integrations and automation — designed and developed by
              Loumilab around how your business actually works.
            </p>
          </div>

          <form onSubmit={submit} className="mt-12 space-y-10">
            <fieldset className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <legend className="px-2 font-display text-sm font-semibold">Your business</legend>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <Field label="Business name" required value={form.business_name} onChange={set("business_name")} />
                <Field label="Contact name" required value={form.contact_name} onChange={set("contact_name")} />
                <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
                <Field label="Phone" value={form.phone} onChange={set("phone")} />
                <Field
                  label="Current Orders account email"
                  hint="If you already sell with Loumilab Orders"
                  value={form.orders_account_email}
                  onChange={set("orders_account_email")}
                />
                <Field
                  label="Current storefront URL"
                  value={form.storefront_url}
                  onChange={set("storefront_url")}
                  placeholder="loumilab.com/orders/store/…"
                />
                <Field
                  label="Business type"
                  value={form.business_type}
                  onChange={set("business_type")}
                  placeholder="Bakery, restaurant, retail, services…"
                />
                <Field
                  label="Number of locations"
                  value={form.location_count}
                  onChange={set("location_count")}
                />
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <legend className="px-2 font-display text-sm font-semibold">The project</legend>
              <div className="mt-4 space-y-5">
                <Field
                  label="What do you want Loumilab to build?"
                  required
                  value={form.build_goal}
                  onChange={set("build_goal")}
                  placeholder="Custom e-commerce site, branded ordering app, internal dashboard…"
                />
                <AreaField
                  label="Project description"
                  required
                  value={form.project_description}
                  onChange={set("project_description")}
                  placeholder="What should it do, who uses it, and what problem does it solve?"
                />
                <AreaField
                  label="Desired features"
                  value={form.desired_features}
                  onChange={set("desired_features")}
                  placeholder="Customer accounts, loyalty, inventory, multi-location, reporting…"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Existing website" value={form.existing_website} onChange={set("existing_website")} />
                  <Field
                    label="Existing software"
                    value={form.existing_software}
                    onChange={set("existing_software")}
                    placeholder="POS, accounting, CRM…"
                  />
                  <Field
                    label="Integrations required"
                    value={form.integrations_required}
                    onChange={set("integrations_required")}
                  />
                  <Field
                    label="Approximate monthly order volume"
                    value={form.monthly_order_volume}
                    onChange={set("monthly_order_volume")}
                  />
                  <Field
                    label="Estimated budget range"
                    value={form.budget_range}
                    onChange={set("budget_range")}
                    placeholder="$5k–10k, $10k–25k, not sure…"
                  />
                  <Field
                    label="Desired launch timeframe"
                    value={form.launch_timeframe}
                    onChange={set("launch_timeframe")}
                    placeholder="ASAP, 1–3 months, this year…"
                  />
                </div>
                <AreaField label="Additional notes" value={form.additional_notes} onChange={set("additional_notes")} />
              </div>
            </fieldset>

            <fieldset className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <legend className="px-2 font-display text-sm font-semibold">Attachments</legend>
              <p className="mt-3 text-sm text-muted-foreground">
                Optional — briefs, sketches, menus or screenshots. Up to {MAX_FILES} files, 10 MB each. Files are
                stored privately and visible only to the Loumilab team.
              </p>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
                <Paperclip size={15} /> Add files
                <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>

              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-2.5 text-sm"
                    >
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => setFiles((prev) => prev.filter((_, index) => index !== i))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" size="lg" className="rounded-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  "Submit request"
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                Prefer to talk first? <Link to="/contact" className="text-accent underline">Request a consultation</Link>.
              </p>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
}

const Field = ({ label, value, onChange, required, type = "text", placeholder, hint }: FieldProps) => (
  <div>
    <Label className="text-sm">
      {label}
      {required && <span className="text-accent"> *</span>}
    </Label>
    <Input
      className="mt-2"
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      maxLength={500}
    />
    {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const AreaField = ({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
}) => (
  <div>
    <Label className="text-sm">
      {label}
      {required && <span className="text-accent"> *</span>}
    </Label>
    <Textarea className="mt-2 min-h-28" value={value} onChange={onChange} required={required} placeholder={placeholder} maxLength={5000} />
  </div>
);

export default CustomProject;
