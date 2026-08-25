import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitServiceRequest } from "@/lib/orders/commerce";
import type { IndustryTerms } from "@/lib/orders/industries";
import { toast } from "sonner";

interface ServiceRequestFormProps {
  /** Real merchant id. When absent the form runs in preview mode. */
  merchantId?: string | null;
  terms: IndustryTerms;
  /** Pre-selects the service the visitor tapped. */
  defaultTitle?: string;
}

/**
 * Public request → quote entry point for service businesses. Inserts a job in
 * the `request` state; pricing and scheduling are decided by the merchant.
 */
const ServiceRequestForm = ({ merchantId, terms, defaultTitle = "" }: ServiceRequestFormProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || title.trim().length < 2) {
      toast.error("Add your name and what you need help with.");
      return;
    }

    if (!merchantId) {
      toast.success("Request sent (preview)", {
        description: "This storefront is a demo — no request was delivered.",
      });
      return;
    }

    setBusy(true);
    try {
      await submitServiceRequest({
        merchant_id: merchantId,
        title,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        service_address: address,
        problem_description: details,
      });
      toast.success("Request sent", { description: "You'll receive an estimate shortly." });
      setTitle("");
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setDetails("");
    } catch (err) {
      toast.error("We couldn't send your request", {
        description: err instanceof Error ? err.message : "Please try again in a moment.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
    >
      <h3 className="font-display text-lg font-semibold">{terms.cta}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell us what you need. You&apos;ll get an estimate before any work is scheduled.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="req-title">What do you need?</Label>
          <Input id="req-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Panel upgrade" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="req-name">Your name</Label>
          <Input id="req-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="req-phone">Phone</Label>
          <Input id="req-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="req-email">Email</Label>
          <Input id="req-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="req-address">{terms.location}</Label>
          <Input id="req-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="req-details">{terms.notes}</Label>
          <Textarea
            id="req-details"
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the job, access details and anything we should know."
          />
        </div>
      </div>

      <Button type="submit" disabled={busy} className="mt-6 rounded-full">
        {busy ? "Sending…" : terms.cta}
      </Button>
    </form>
  );
};

export default ServiceRequestForm;
