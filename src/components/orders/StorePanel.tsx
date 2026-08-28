import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/orders/ImageUpload";
import StoreStatusBadge from "@/components/orders/StoreStatusBadge";
import {
  useCreateStorefront,
  useDeleteProduct,
  useMyStorefront,
  useSaveProduct,
  useStorefrontProducts,
  useUpdateStorefront,
} from "@/lib/orders/store-admin";
import { STATUS_DESCRIPTIONS, type StorefrontStatus } from "@/lib/orders/setup";
import { formatCents } from "@/lib/orders/storefront";
import { toast } from "sonner";

interface Props {
  merchantId?: string;
  businessName?: string;
  catalogLabel: string;
  itemLabel: string;
  /** Service businesses may quote individually instead of listing a fixed price. */
  priceOptional?: boolean;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

/** Merchant-facing storefront settings and catalog editor. */
const StorePanel = ({ merchantId, businessName, catalogLabel, itemLabel, priceOptional = false }: Props) => {
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
  const [itemImage, setItemImage] = useState<string | null>(null);


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
            <StoreStatusBadge className="mt-3" status={(store.status ?? "setup") as StorefrontStatus} />
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/orders/store/${store.slug}`}>
              {store.status === "published" ? "View" : "Preview"} <ExternalLink size={14} />
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {STATUS_DESCRIPTIONS[(store.status ?? "setup") as StorefrontStatus]}
        </p>

        <div className="mt-6">
          <ImageUpload
            merchantId={merchantId}
            kind="logo"
            label="Store logo"
            hint="Shown on your storefront, receipts and order updates. PNG, JPG, WebP or SVG up to 5 MB."
            value={store.logo_url}
            onChange={(url) => patch({ logo_url: url })}
          />
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
          <p className="text-xs text-muted-foreground">
            Publishing and pausing your store is handled from the setup panel at the top of your dashboard.
          </p>
        </div>

      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="font-display font-semibold">{catalogLabel}</p>

        {(products ?? []).length > 0 && (
          <div className="mt-5 divide-y divide-border border-t border-border">
            {(products ?? []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-10 w-10 shrink-0 rounded-xl border border-border object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.price_cents > 0 ? formatCents(p.price_cents, store.currency) : "Priced per request"} ·{" "}
                      {p.availability.replace("_", " ")}
                    </p>
                  </div>
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
            const priceValid = priceOptional
              ? !itemPrice.trim() || (Number.isFinite(cents) && cents >= 0)
              : Number.isFinite(cents) && cents > 0;
            if (itemName.trim().length < 2 || !priceValid) {
              toast.error(
                priceOptional
                  ? `Add a name for the ${itemLabel.toLowerCase()}.`
                  : `Add a name and price for the ${itemLabel.toLowerCase()}.`,
              );
              return;
            }
            saveProduct.mutate(
              {
                name: itemName.trim(),
                description: itemDesc.trim() || undefined,
                price_cents: Number.isFinite(cents) ? Math.max(0, cents) : 0,
                image_url: itemImage,
              },
              {
                onSuccess: () => {
                  setItemName("");
                  setItemDesc("");
                  setItemPrice("");
                  setItemImage(null);
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
            <Label htmlFor="item-price">Price{priceOptional ? " (optional)" : ""}</Label>
            <Input
              id="item-price"
              inputMode="decimal"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="sm:w-28"
              placeholder={priceOptional ? "Quote" : "16.00"}
            />
          </div>
          <div className="sm:col-span-3">
            <ImageUpload
              merchantId={merchantId}
              kind="item"
              shape="wide"
              label={`${itemLabel} image`}
              hint="Optional — a clear photo helps customers choose."
              value={itemImage}
              onChange={setItemImage}
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
