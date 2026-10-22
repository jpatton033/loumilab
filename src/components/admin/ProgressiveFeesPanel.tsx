import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_TIERS, FEE_PLANS, type FeeScheduleRow, type FeeTiers, pct, progressiveFee, tierLabels, usd,
  useAdminFeeSchedules, useAdminFeeSummary, useFeeScheduleActions,
} from "@/lib/orders/feeSchedule";

const PREVIEW_SALES = [250000, 600000, 1000000, 2000000];

/** Eastern wall-clock "YYYY-MM-DDTHH:mm" → ISO instant. */
const easternToIso = (local: string) => {
  const guess = new Date(`${local}:00Z`);
  const shown = new Date(guess.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const utcShown = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() + (utcShown.getTime() - shown.getTime())).toISOString();
};
const fmtEt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" }) + " ET" : "—";

const statusOf = (r: FeeScheduleRow) =>
  r.status === "active" && r.effective_at && new Date(r.effective_at) > new Date() ? "scheduled" : r.status;

const ProgressiveFeesPanel = () => {
  const { toast } = useToast();
  const { data: rows = [] } = useAdminFeeSchedules();
  const { data: summary } = useAdminFeeSummary();
  const { saveDraft, activate, retire } = useFeeScheduleActions();
  const draftRow = rows.find((r) => r.status === "draft");
  const [tiers, setTiers] = useState<FeeTiers>(DEFAULT_TIERS);
  const [notes, setNotes] = useState("");
  const [effective, setEffective] = useState("");

  useEffect(() => {
    if (draftRow) { setTiers(draftRow.tiers); setNotes(draftRow.notes ?? ""); }
  }, [draftRow?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const labels = useMemo(() => tierLabels(tiers), [tiers]);
  const live = rows.filter((r) => statusOf(r) === "active");
  const current = live.sort((a, b) => (b.effective_at ?? "").localeCompare(a.effective_at ?? ""))[0];

  const setThreshold = (i: number, dollars: string) =>
    setTiers((t) => ({ ...t, thresholds: t.thresholds.map((v, j) => (j === i ? Math.round(Number(dollars) * 100) || 0 : v)) }));
  const setRate = (plan: string, i: number, value: string) =>
    setTiers((t) => ({ ...t, rates: { ...t.rates, [plan]: t.rates[plan].map((v, j) => (j === i ? Math.round(Number(value) * 100) : v)) } }));

  const valid =
    tiers.thresholds.every((v, i) => v > 0 && (i === 0 || v > tiers.thresholds[i - 1])) &&
    FEE_PLANS.every((p) => tiers.rates[p.slug]?.every((r) => Number.isFinite(r) && r >= 0 && r <= 1000));

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast({ title: ok }); } catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : String(e), variant: "destructive" }); }
  };

  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">Progressive fees</h2>
        <Badge variant={current ? "default" : "outline"}>{current ? `Live: version ${current.version}` : "Off — flat plan fees apply"}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Marginal rates on each merchant's monthly merchandise sales (calendar month, Eastern). Activated versions are locked; past orders and promotions never change.
      </p>

      {summary && (
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-muted-foreground">Merchants with sales</dt><dd className="text-lg font-semibold">{summary.merchants}</dd></div>
          <div><dt className="text-muted-foreground">Volume this month</dt><dd className="text-lg font-semibold">{usd(summary.volume_cents)}</dd></div>
          <div><dt className="text-muted-foreground">Fees collected</dt><dd className="text-lg font-semibold">{usd(summary.fees_cents)}</dd></div>
          <div><dt className="text-muted-foreground">Progressive orders</dt><dd className="text-lg font-semibold">{summary.progressive_orders}</dd></div>
        </dl>
      )}

      <h3 className="mt-8 font-semibold">{draftRow ? `Draft version ${draftRow.version}` : "New version"}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-2 pr-3">Tier upper bound ($)</th>{FEE_PLANS.map((p) => <th key={p.slug} className="py-2 pr-3">{p.name} %</th>)}</tr></thead>
          <tbody>
            {labels.map((label, i) => (
              <tr key={i}>
                <td className="py-1 pr-3">
                  {i < tiers.thresholds.length
                    ? <Input aria-label={`Tier ${i + 1} upper bound`} type="number" value={tiers.thresholds[i] / 100} onChange={(e) => setThreshold(i, e.target.value)} />
                    : <span className="text-muted-foreground">{label}</span>}
                </td>
                {FEE_PLANS.map((p) => (
                  <td key={p.slug} className="py-1 pr-3">
                    <Input aria-label={`${p.name} tier ${i + 1} rate`} type="number" step="0.1" value={(tiers.rates[p.slug]?.[i] ?? 0) / 100} onChange={(e) => setRate(p.slug, i, e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="mt-6 text-sm font-semibold">Preview: monthly fee</h4>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1 pr-3">Sales</th>{FEE_PLANS.map((p) => <th key={p.slug} className="py-1 pr-3">{p.name}</th>)}</tr></thead>
          <tbody>
            {PREVIEW_SALES.map((s) => (
              <tr key={s}><td className="py-1 pr-3">{usd(s)}</td>
                {FEE_PLANS.map((p) => <td key={p.slug} className="py-1 pr-3">{valid ? usd(progressiveFee(tiers, p.slug, 0, s)?.feeCents ?? 0) : "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input placeholder="Notes for this version" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button variant="outline" disabled={!valid || saveDraft.isPending} onClick={() => run(() => saveDraft.mutateAsync({ id: draftRow?.id, tiers, notes }), "Draft saved")}>Save draft</Button>
      </div>
      {draftRow && (
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-sm">
            <span className="block text-muted-foreground">Effective from (Eastern)</span>
            <Input type="datetime-local" value={effective} onChange={(e) => setEffective(e.target.value)} />
          </label>
          <Button
            className="self-end"
            disabled={!effective || activate.isPending}
            onClick={() => {
              if (!window.confirm(`Activate version ${draftRow.version} from ${effective} ET? Saved draft values are used; once active it can't be edited.`)) return;
              run(() => activate.mutateAsync({ id: draftRow.id, effectiveAt: easternToIso(effective) }), "Pricing scheduled");
            }}
          >Activate</Button>
        </div>
      )}

      <h3 className="mt-8 font-semibold">History</h3>
      <ul className="mt-2 divide-y divide-border text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
            <span className="font-medium">Version {r.version}</span>
            <Badge variant="outline">{statusOf(r)}</Badge>
            <span className="text-muted-foreground">Effective {fmtEt(r.effective_at)}</span>
            {r.notes && <span className="text-muted-foreground">· {r.notes}</span>}
            {r.status === "active" && (
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => {
                const reason = window.prompt("Reason for turning this version off (flat plan fees resume if no other version is live):");
                if (reason) run(() => retire.mutateAsync({ id: r.id, reason }), "Version turned off");
              }}>Turn off</Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProgressiveFeesPanel;
