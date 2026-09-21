import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  addressMissing,
  useMerchantContact,
  useSaveMerchantContact,
  type MerchantContact,
} from "@/lib/orders/merchantContact";

const EMPTY: MerchantContact = {
  contact_name: "",
  contact_email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "US",
};

/**
 * Business contact and mailing address the merchant maintains themselves.
 * Everything except the contact email is optional, so nobody is ever blocked.
 */
const MerchantContactCard = ({ merchantId }: { merchantId?: string | null }) => {
  const { data: contact, isLoading } = useMerchantContact(merchantId);
  const save = useSaveMerchantContact(merchantId);
  const [form, setForm] = useState<MerchantContact>(EMPTY);

  useEffect(() => {
    if (!contact) return;
    setForm({
      contact_name: contact.contact_name ?? "",
      contact_email: contact.contact_email ?? "",
      phone: contact.phone ?? "",
      address_line1: contact.address_line1 ?? "",
      address_line2: contact.address_line2 ?? "",
      city: contact.city ?? "",
      region: contact.region ?? "",
      postal_code: contact.postal_code ?? "",
      country: contact.country ?? "US",
    });
  }, [contact]);

  const set = (key: keyof MerchantContact) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(form, {
      onSuccess: () => toast({ title: "Business details saved" }),
      onError: (err) =>
        toast({
          title: "Could not save",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        }),
    });
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Business contact &amp; mailing address</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How Loumilab reaches you about orders, payouts and account notices. Customers never see this.
          </p>
        </div>
      </div>

      {!isLoading && addressMissing(contact) && (
        <p className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Add your mailing address so account letters, tax documents and support can reach you.
        </p>
      )}

      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="mc-name">Contact name</Label>
          <Input id="mc-name" value={form.contact_name ?? ""} onChange={set("contact_name")} placeholder="Jordan Reyes" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mc-email">Contact email</Label>
          <Input
            id="mc-email"
            type="email"
            required
            value={form.contact_email ?? ""}
            onChange={set("contact_email")}
            placeholder="owner@business.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mc-phone">Phone</Label>
          <Input id="mc-phone" value={form.phone ?? ""} onChange={set("phone")} placeholder="(555) 555-0123" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mc-country">Country</Label>
          <Input id="mc-country" value={form.country ?? ""} onChange={set("country")} placeholder="US" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="mc-a1">Street address</Label>
          <Input id="mc-a1" value={form.address_line1 ?? ""} onChange={set("address_line1")} placeholder="418 Market St" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="mc-a2">Suite, unit or floor (optional)</Label>
          <Input id="mc-a2" value={form.address_line2 ?? ""} onChange={set("address_line2")} placeholder="Suite 200" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mc-city">City</Label>
          <Input id="mc-city" value={form.city ?? ""} onChange={set("city")} placeholder="Baltimore" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mc-region">State / region</Label>
            <Input id="mc-region" value={form.region ?? ""} onChange={set("region")} placeholder="MD" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mc-zip">ZIP / postal code</Label>
            <Input id="mc-zip" value={form.postal_code ?? ""} onChange={set("postal_code")} placeholder="21201" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={save.isPending || isLoading} className="w-full sm:w-auto">
            {save.isPending ? "Saving…" : "Save details"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default MerchantContactCard;
