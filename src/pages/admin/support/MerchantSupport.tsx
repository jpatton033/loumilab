import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Eye, X } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useApplyChange, useMerchantOverview, useRevokeAccess, useSupportLevel } from "@/lib/support/queries";
import { SCOPE_LABELS, canChange, grantIsActive, type SupportScope } from "@/lib/support/rules";

const money = (c?: number | null) => `$${((c ?? 0) / 100).toFixed(2)}`;

const Item = ({ ok, label }: { ok: boolean; label: string }) => (
  <li className="flex items-center gap-2 text-sm">
    {ok ? <Check size={15} className="text-accent" /> : <X size={15} className="text-muted-foreground" />}
    <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
  </li>
);

/** A single field edit, applied only through the audited server function. */
const EditField = ({
  merchantId, scope, field, label, value, targetId, enabled, type = "text",
}: {
  merchantId: string; scope: SupportScope; field: string; label: string; value: unknown; targetId?: string; enabled: boolean; type?: "text" | "cents" | "bool";
}) => {
  const apply = useApplyChange();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [reason, setReason] = useState("");
  const shown = type === "cents" ? money(value as number) : type === "bool" ? (value ? "On" : "Off") : (value as string) || "—";

  const save = () => {
    let v: unknown = draft;
    if (type === "cents") v = Math.round(Number(draft) * 100);
    if (type === "bool") v = draft === "on";
    apply.mutate(
      { merchantId, scope, targetId, patch: { [field]: v }, reason },
      { onSuccess: () => { toast.success("Change saved and logged"); setEditing(false); setReason(""); }, onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      {editing ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          {type === "bool" ? (
            <select className="h-9 rounded-xl border border-input bg-background px-2" value={draft} onChange={(e) => setDraft(e.target.value)}>
              <option value="on">On</option><option value="off">Off</option>
            </select>
          ) : (
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-9" />
          )}
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (required)" className="h-9" />
          <div className="flex gap-2">
            <Button size="sm" className="rounded-full" disabled={reason.trim().length < 3 || apply.isPending} onClick={save}>Save</Button>
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <span className="flex items-center gap-2 text-right">
          <span className="max-w-xs truncate">{shown}</span>
          {enabled && (
            <button className="text-xs text-accent hover:underline" onClick={() => {
              setDraft(type === "cents" ? String(((value as number) ?? 0) / 100) : type === "bool" ? (value ? "on" : "off") : String(value ?? ""));
              setEditing(true);
            }}>Edit</button>
          )}
        </span>
      )}
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
    <p className="mb-3 font-medium">{title}</p>
    {children}
  </div>
);

const MerchantSupport = () => {
  const { id } = useParams();
  const [viewAs, setViewAs] = useState(false);
  const { data, isLoading, error } = useMerchantOverview(id, viewAs);
  const { data: level = 0 } = useSupportLevel();
  const revoke = useRevokeAccess();
  useEffect(() => setViewAs(false), [id]);

  if (isLoading || !id) return <AdminShell title="Merchant support"><p className="text-sm text-muted-foreground">Loading…</p></AdminShell>;
  if (error || !data) return <AdminShell title="Merchant support"><p className="text-sm text-muted-foreground">{(error as Error)?.message ?? "Not found"}</p></AdminShell>;

  const m = data.merchant ?? {};
  const s = data.storefront;
  const products: any[] = data.products ?? [];
  const grants: any[] = data.grants ?? [];
  const can = (scope: SupportScope) => !viewAs && canChange(level, grants, scope);
  const activeGrants = grants.filter((g) => grantIsActive(g));

  return (
    <AdminShell title={m.business_name ?? "Merchant"} description="Support view — safe fields only. Payout amounts, bank details and credentials are never shown.">
      <SEOHead title="Merchant support | Loumilab Admin" description="Merchant support view." path="/admin/support/merchant" noindex />

      {viewAs && (
        <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <span><Eye size={15} className="mr-2 inline text-accent" />Viewing as {m.business_name} — read-only. This session is logged.</span>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setViewAs(false)}>Exit view</Button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/admin/support" className="text-sm text-muted-foreground hover:text-foreground">← Help Desk</Link>
        {!viewAs && <Button size="sm" variant="outline" className="rounded-full" onClick={() => setViewAs(true)}><Eye size={14} /> View as merchant</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Setup checklist">
          <ul className="space-y-2">
            <Item ok={!!m.email_confirmed} label="Email confirmed" />
            <Item ok={!!s} label="Store created" />
            <Item ok={!!s?.description && !!s?.location} label="Store details filled in" />
            <Item ok={products.length > 0} label={`Catalog items (${products.length})`} />
            <Item ok={!!data.payouts?.payouts_enabled} label="Payouts connected" />
            <Item ok={!!s?.is_published} label="Store published" />
            <Item ok={!!m.accepting_orders} label="Accepting orders" />
            <Item ok={!!data.local?.is_listed} label="Local listing live" />
            <Item ok={!!data.calendar?.connected} label="Calendar connected" />
          </ul>
        </Card>

        <Card title="Account">
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {m.contact_email}</p>
            <p><span className="text-muted-foreground">Plan:</span> {m.plan_slug}</p>
            <p><span className="text-muted-foreground">Industry:</span> {m.industry_slug}</p>
            <p><span className="text-muted-foreground">Joined:</span> {m.created_at && new Date(m.created_at).toLocaleDateString()}</p>
            <p><span className="text-muted-foreground">Last sign-in:</span> {m.last_sign_in_at ? new Date(m.last_sign_in_at).toLocaleString() : "—"}</p>
            <p><span className="text-muted-foreground">Payout status:</span> {data.payouts?.payout_status ?? "not started"}{data.payouts?.has_requirements ? " · Stripe needs info" : ""}</p>
            <p><span className="text-muted-foreground">Orders:</span> {data.orders?.total ?? 0}</p>
          </div>
        </Card>

        {s && (
          <Card title="Store details & fulfilment">
            <EditField merchantId={id} scope="store_details" field="name" label="Name" value={s.name} enabled={can("store_details")} />
            <EditField merchantId={id} scope="store_details" field="location" label="Location" value={s.location} enabled={can("store_details")} />
            <EditField merchantId={id} scope="store_details" field="description" label="Description" value={s.description} enabled={can("store_details")} />
            <EditField merchantId={id} scope="store_details" field="hours" label="Hours" value={s.hours} enabled={can("store_details")} />
            <EditField merchantId={id} scope="fulfilment" field="pickup_enabled" label="Pickup" value={s.pickup_enabled} type="bool" enabled={can("fulfilment")} />
            <EditField merchantId={id} scope="fulfilment" field="pickup_info" label="Pickup info" value={s.pickup_info} enabled={can("fulfilment")} />
            <EditField merchantId={id} scope="fulfilment" field="delivery_enabled" label="Delivery" value={s.delivery_enabled} type="bool" enabled={can("fulfilment")} />
            <EditField merchantId={id} scope="fulfilment" field="delivery_fee_cents" label="Delivery fee" value={s.delivery_fee_cents} type="cents" enabled={can("fulfilment")} />
            <EditField merchantId={id} scope="fulfilment" field="delivery_minimum_cents" label="Delivery minimum" value={s.delivery_minimum_cents} type="cents" enabled={can("fulfilment")} />
          </Card>
        )}

        <Card title={`Catalog (${products.length})`}>
          {products.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
          {products.map((p) => (
            <div key={p.id} className="mb-3 rounded-2xl border border-border px-3 py-1">
              <EditField merchantId={id} scope="catalog" targetId={p.id} field="name" label="Item" value={p.name} enabled={can("catalog")} />
              <EditField merchantId={id} scope="catalog" targetId={p.id} field="price_cents" label="Price" value={p.price_cents} type="cents" enabled={can("catalog")} />
              <EditField merchantId={id} scope="catalog" targetId={p.id} field="is_active" label="Shown" value={p.is_active} type="bool" enabled={can("catalog")} />
            </div>
          ))}
        </Card>

        {data.local && (
          <Card title="Local listing">
            <EditField merchantId={id} scope="local_listing" field="display_name" label="Name" value={data.local.display_name} enabled={can("local_listing")} />
            <EditField merchantId={id} scope="local_listing" field="tagline" label="Tagline" value={data.local.tagline} enabled={can("local_listing")} />
            <EditField merchantId={id} scope="local_listing" field="hours_text" label="Hours" value={data.local.hours_text} enabled={can("local_listing")} />
          </Card>
        )}

        {!viewAs && (
          <Card title="Support access">
            {activeGrants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active access. Changes are locked until the merchant allows them from their Help panel.</p>
            ) : (
              activeGrants.map((g) => (
                <div key={g.id} className="mb-2 text-sm">
                  <p>{g.scopes.map((x: string) => SCOPE_LABELS[x as SupportScope] ?? x).join(", ")}</p>
                  <p className="text-xs text-muted-foreground">Until {new Date(g.expires_at).toLocaleString()}</p>
                  {level >= 3 && <Button size="sm" variant="outline" className="mt-2 rounded-full" onClick={() => revoke.mutate(g.id)}>Revoke</Button>}
                </div>
              ))
            )}
            {level < 2 && <p className="mt-2 text-xs text-muted-foreground">Your role is view-only.</p>}
          </Card>
        )}
      </div>
    </AdminShell>
  );
};

export default MerchantSupport;
