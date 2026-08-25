import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  useCreateStorefront,
  useDeleteProduct,
  useMyStorefront,
  useSaveProduct,
  useStorefrontProducts,
  useUpdateStorefront,
} from "@/lib/orders/store-admin";
import { formatCents } from "@/lib/orders/storefront";
import { toast } from "sonner";

interface Props {
  merchantId?: string;
  businessName?: string;
  catalogLabel: string;
  itemLabel: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

/** Merchant-facing storefront settings and catalog editor. */
const StorePanel = ({ merchantId, businessName, catalogLabel, itemLabel }: Props) => {
  const { data: store, isLoading } = useMyStorefront(merchantId);
  const { data: products } = useStorefrontProducts(store?.id);
  const create = useCreateStorefront(merchantId);
  const update = useUpdateStorefront(merchantId);
  const saveProduct = useSaveProduct(merchantId, store?.id);
  const deleteProduct = useDeleteProduct(store?.id);

  const [name, setName] = useState(businessName ?? "");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  if (!merchantId) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground sm:p-8">
        Sign in with a merchant account to publish a storefront and manage your {catalogLabel.toLowerCase()}.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground sm:p-8">
        Loading your storefront…
      </div>
    );
  }

  if (!store) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const slug = slugify(name);
          if (slug.length < 3) {
            toast.error("Choose a store name with at least three letters.");
            return;
          }
          create.mutate(
            { name: name.trim(), slug },
            {
              onSuccess: () => toast.success("Storefront created", { description: `loumilab.com/orders/store/${slug}` }),
              onError: (err) =>
                toast.error("Couldn't create your storefront", {
                  description: err instanceof Error ? err.message : "Please try again.",
                }),
            },
          );
        }}
        className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8"
      >
        <p className="font-display font-semibold">Create your storefront</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your customers order from a single link. You can rename and style it any time.
        </p>
        <div className="mt-5 space-y-2">
          <Label htmlFor="store-name">Store name</Label>
          <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          {name && <p className="text-xs text-muted-foreground">/orders/store/{slugify(name)}</p>}
        </div>
        <Button type="submit" disabled={create.isPending} className="mt-5 rounded-full">
          {create.isPending ? "Creating…" : "Create storefront"}
        </Button>
      </form>
    );
  }

  const patch = (fields: Record<string, unknown>) => update.mutate({ id: store.id, ...fields });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display font-semibold">{store.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">/orders/store/{store.slug}</p>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/orders/store/${store.slug}`}>
              View <ExternalLink size={14} />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="store-location">Location</Label>
            <Input
              id="store-location"
              defaultValue={store.location ?? ""}
              onBlur={(e) => patch({ location: e.target.value || null })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-hours">Hours</Label>
            <Input
              id="store-hours"
              defaultValue={store.hours ?? ""}
              onBlur={(e) => patch({ hours: e.target.value || null })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="store-desc">Description</Label>
            <Textarea
              id="store-desc"
              rows={2}
              defaultValue={store.description ?? ""}
              onBlur={(e) => patch({ description: e.target.value || null })}
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Published</p>
              <p className="text-xs text-muted-foreground">Customers can find and order from this store.</p>
            </div>
            <Switch checked={store.is_published} onCheckedChange={(v) => patch({ is_published: v })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Pickup</p>
              <p className="text-xs text-muted-foreground">{store.pickup_info ?? "Customers collect their order."}</p>
            </div>
            <Switch checked={store.pickup_enabled} onCheckedChange={(v) => patch({ pickup_enabled: v })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Delivery</p>
              <p className="text-xs text-muted-foreground">
                Fee {formatCents(store.delivery_fee_cents, store.currency)} · minimum{" "}
                {formatCents(store.delivery_minimum_cents, store.currency)}
              </p>
            </div>
            <Switch checked={store.delivery_enabled} onCheckedChange={(v) => patch({ delivery_enabled: v })} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="font-display font-semibold">{catalogLabel}</p>

        {(products ?? []).length > 0 && (
          <div className="mt-5 divide-y divide-border border-t border-border">
            {(products ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCents(p.price_cents, store.currency)} · {p.availability.replace("_", " ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteProduct.mutate(p.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cents = Math.round(Number(itemPrice) * 100);
            if (itemName.trim().length < 2 || !Number.isFinite(cents) || cents <= 0) {
              toast.error(`Add a name and price for the ${itemLabel.toLowerCase()}.`);
              return;
            }
            saveProduct.mutate(
              { name: itemName.trim(), description: itemDesc.trim() || undefined, price_cents: cents },
              {
                onSuccess: () => {
                  setItemName("");
                  setItemDesc("");
                  setItemPrice("");
                  toast.success(`${itemLabel} added`);
                },
                onError: (err) =>
                  toast.error("Couldn't save that", {
                    description: err instanceof Error ? err.message : "Please try again.",
                  }),
              },
            );
          }}
          className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor="item-name">{itemLabel} name</Label>
            <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} maxLength={120} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Input id="item-desc" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} maxLength={280} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-price">Price</Label>
            <Input
              id="item-price"
              inputMode="decimal"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="sm:w-28"
            />
          </div>
          <Button type="submit" disabled={saveProduct.isPending} className="rounded-full sm:col-span-3 sm:w-fit">
            {saveProduct.isPending ? "Saving…" : `Add ${itemLabel.toLowerCase()}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default StorePanel;
