import AdminShell from "@/components/admin/AdminShell";
import OrderConversationsPanel from "@/components/admin/OrderConversationsPanel";
import SEOHead from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/data/orders/storefronts";
import { toast } from "@/hooks/use-toast";
import {
  ORDERS_WINDOW_DAYS,
  PAYOUT_STATUS_LABELS,
  formatMailingAddress,
  useAdminOrdersSnapshot,
  useSaveMerchantContact,
  type AdminMerchantRow,
  type MerchantContactInput,
} from "@/lib/admin/ordersAdmin";
import { ChevronDown, Copy, ExternalLink, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const MODE_LABEL: Record<string, string> = {
  live: "Live payments",
  test: "Test payments",
  mixed: "Live and test payments",
  none: "No payment accounts yet",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  refunded: "Refunded",
};

const Metric = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
    <p className="mt-2 font-hero text-3xl font-semibold tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/** Copy-to-clipboard row used across the merchant detail panel. */
const DetailRow = ({
  label,
  value,
  href,
  multiline,
}: {
  label: string;
  value: string | null;
  href?: string;
  multiline?: boolean;
}) => {
  if (!value) {
    return (
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/70">Not provided</span>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-start gap-1.5 text-right">
        {href ? (
          <a href={href} className="truncate text-foreground underline-offset-2 hover:underline">
            {value}
          </a>
        ) : (
          <span className={multiline ? "whitespace-pre-line text-foreground" : "truncate text-foreground"}>{value}</span>
        )}
        <button
          type="button"
          aria-label={`Copy ${label}`}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            toast({ title: `${label} copied` });
          }}
        >
          <Copy size={12} />
        </button>
      </span>
    </div>
  );
};

const MerchantCard = ({ merchant: m, onEdit }: { merchant: AdminMerchantRow; onEdit: () => void }) => {
  const [open, setOpen] = useState(false);
  const address = formatMailingAddress(m);

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-xs font-bold">
          {m.businessName.slice(0, 2).toUpperCase()}
        </span>
        <button type="button" onClick={() => setOpen((v) => !v)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{m.businessName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {m.contactName ? `${m.contactName} · ` : ""}
            {m.contactEmail || "No contact email"}
          </p>
        </button>
        <Badge variant={m.isLive ? "default" : "outline"}>
          {m.isLive ? "Live" : m.isPublished ? "Paused" : "Setting up"}
        </Badge>
        {m.storefrontSlug && m.isPublished && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/orders/store/${m.storefrontSlug}`} aria-label={`View ${m.businessName}`}>
              <ExternalLink size={14} />
            </Link>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)} aria-label={`Details for ${m.businessName}`}>
          <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <DetailRow label="Contact name" value={m.contactName} />
          <DetailRow label="Account holder" value={m.ownerName} />
          <DetailRow
            label="Email"
            value={m.contactEmail || null}
            href={m.contactEmail ? `mailto:${m.contactEmail}` : undefined}
          />
          <DetailRow label="Phone" value={m.phone} href={m.phone ? `tel:${m.phone}` : undefined} />
          <DetailRow label="Mailing address" value={address} multiline />
          <DetailRow label="Store" value={m.storefrontName} />
          <DetailRow label="Store location" value={m.storefrontLocation} />
          <DetailRow label="Plan" value={`${m.planSlug}${m.subscriptionStatus ? ` · ${m.subscriptionStatus}` : ""}`} />
          <DetailRow
            label="Payments"
            value={m.payoutStatus ? (PAYOUT_STATUS_LABELS[m.payoutStatus] ?? m.payoutStatus) : "Not started"}
          />
          <DetailRow label="Signed up" value={new Date(m.createdAt).toLocaleDateString()} />
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil size={13} /> Edit contact details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const FIELDS: { key: keyof MerchantContactInput; label: string; wide?: boolean }[] = [
  { key: "contactName", label: "Contact name" },
  { key: "contactEmail", label: "Contact email" },
  { key: "phone", label: "Phone" },
  { key: "country", label: "Country" },
  { key: "addressLine1", label: "Street address", wide: true },
  { key: "addressLine2", label: "Suite, unit or floor", wide: true },
  { key: "city", label: "City" },
  { key: "region", label: "State / region" },
  { key: "postalCode", label: "ZIP / postal code" },
];

const EditContactDialog = ({
  merchant,
  onClose,
}: {
  merchant: AdminMerchantRow;
  onClose: () => void;
}) => {
  const save = useSaveMerchantContact();
  const [form, setForm] = useState<MerchantContactInput>({
    contactName: merchant.contactName ?? "",
    contactEmail: merchant.contactEmail ?? "",
    phone: merchant.phone ?? "",
    addressLine1: merchant.addressLine1 ?? "",
    addressLine2: merchant.addressLine2 ?? "",
    city: merchant.city ?? "",
    region: merchant.region ?? "",
    postalCode: merchant.postalCode ?? "",
    country: merchant.country ?? "US",
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{merchant.businessName}</DialogTitle>
          <DialogDescription>Correct the merchant's contact record. Changes are audit logged.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(
              { merchant, input: form },
              {
                onSuccess: () => {
                  toast({ title: "Merchant details updated" });
                  onClose();
                },
                onError: (err) =>
                  toast({
                    title: "Could not save",
                    description: err instanceof Error ? err.message : "Please try again.",
                    variant: "destructive",
                  }),
              },
            );
          }}
        >
          {FIELDS.map((f) => (
            <div key={f.key} className={f.wide ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
              <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
              <Input
                id={`f-${f.key}`}
                value={form[f.key]}
                required={f.key === "contactEmail"}
                type={f.key === "contactEmail" ? "email" : "text"}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AdminOrders = () => {
  const { data, isLoading } = useAdminOrdersSnapshot();
  const totals = data?.totals;
  const dash = "—";
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminMerchantRow | null>(null);

  const merchants = useMemo(() => {
    const t = search.trim().toLowerCase();
    const rows = data?.merchants ?? [];
    if (!t) return rows;
    return rows.filter((m) =>
      [
        m.businessName,
        m.contactName,
        m.contactEmail,
        m.phone,
        m.city,
        m.region,
        m.postalCode,
        m.storefrontName,
        m.storefrontLocation,
        m.ownerName,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [data?.merchants, search]);

  return (
    <AdminShell
      title="Orders"
      description={`Live Loumilab Orders activity — last ${ORDERS_WINDOW_DAYS} days.`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/orders">
            <ExternalLink size={14} /> Product page
          </Link>
        </Button>
      }
    >
      <SEOHead title="Orders | Loumilab Admin" description="Loumilab Orders admin." path="/admin/orders" noindex />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Live merchants"
          value={isLoading ? dash : String(totals!.merchantsLive)}
          hint={isLoading ? undefined : `${totals!.merchantsTotal} signed up`}
        />
        <Metric
          label={`Paid orders (${ORDERS_WINDOW_DAYS}d)`}
          value={isLoading ? dash : String(totals!.paidOrdersWindow)}
          hint={isLoading ? undefined : `${totals!.paidOrdersAllTime} all time`}
        />
        <Metric
          label={`Gross sales (${ORDERS_WINDOW_DAYS}d)`}
          value={isLoading ? dash : formatMoney(totals!.grossSalesWindowCents)}
          hint={isLoading ? undefined : MODE_LABEL[data!.mode]}
        />
        <Metric
          label={`Platform fees (${ORDERS_WINDOW_DAYS}d)`}
          value={isLoading ? dash : formatMoney(totals!.platformFeeWindowCents)}
          hint={
            isLoading
              ? undefined
              : totals!.activeSubscriptions > 0
                ? `${totals!.activeSubscriptions} active plan subscription${totals!.activeSubscriptions === 1 ? "" : "s"}`
                : "No plan subscriptions billing yet"
          }
        />
      </div>

      {!isLoading && totals!.testOrders > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {totals!.testOrders} of the most recent orders were placed in Stripe test mode and are included above.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold">Merchants &amp; storefronts</h2>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, city"
              className="h-9 w-full sm:w-56"
              aria-label="Search merchants"
            />
          </div>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading merchants…</p>}
            {!isLoading && data!.merchants.length === 0 && (
              <p className="text-sm text-muted-foreground">No merchants have signed up yet.</p>
            )}
            {!isLoading && data!.merchants.length > 0 && merchants.length === 0 && (
              <p className="text-sm text-muted-foreground">No merchants match “{search}”.</p>
            )}
            {merchants.map((m) => (
              <MerchantCard key={m.id} merchant={m} onEdit={() => setEditing(m)} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold">Plans in use</h2>
            <Link to="/admin/plans" className="text-xs text-muted-foreground transition-colors hover:text-accent">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
            {!isLoading &&
              data!.plans.map((p) => (
                <div key={p.slug} className="rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {p.name}
                      {!p.isActive && <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>}
                    </p>
                    <p className="font-display text-sm font-semibold">
                      {p.monthlyPriceCents ? `${formatMoney(p.monthlyPriceCents)}/mo` : (p.priceLabel ?? "Free")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.merchantCount} merchant{p.merchantCount === 1 ? "" : "s"}
                    {p.platformFeeBps !== null
                      ? ` · ${(p.platformFeeBps / 100).toFixed(2)}% platform fee per order`
                      : p.feeLabel
                        ? ` · ${p.feeLabel}`
                        : ""}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-sm font-semibold">Recent orders</h2>
        </div>
        {!isLoading && data!.orders.length === 0 ? (
          <p className="px-6 py-6 text-sm text-muted-foreground">No orders have been placed yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.orders ?? []).slice(0, 25).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.reference ?? o.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-muted-foreground">{o.merchantName}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>{formatMoney(o.totalCents)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatMoney(o.platformFeeCents)}</TableCell>
                  <TableCell>
                    <Badge variant={o.status === "pending" || o.status === "failed" ? "outline" : "default"}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                    {!o.livemode && <span className="ml-1 text-xs">(test)</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <OrderConversationsPanel />

      {editing && <EditContactDialog merchant={editing} onClose={() => setEditing(null)} />}
    </AdminShell>
  );
};

export default AdminOrders;
