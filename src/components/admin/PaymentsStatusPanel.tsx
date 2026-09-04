import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  PAYOUT_LABELS,
  PLATFORM_PAYMENTS_LABELS,
  usePlatformPaymentsStatus,
  type PayoutStatus,
} from "@/lib/orders/connect";

type PaymentsSnapshot = {
  mode: "live" | "test" | "mixed" | "none";
  total: number;
  byStatus: Partial<Record<PayoutStatus, number>>;
  lastEvent: { type: string; created_at: string; livemode: boolean; error: string | null } | null;
  failedEvents: number;
};


const usePaymentsSnapshot = () =>
  useQuery({
    queryKey: ["admin", "payments-snapshot"],
    queryFn: async (): Promise<PaymentsSnapshot> => {
      const [accounts, events, failed] = await Promise.all([
        supabase.from("merchant_stripe_accounts").select("payout_status, livemode"),
        supabase
          .from("stripe_webhook_events")
          .select("type, created_at, livemode, error")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("stripe_webhook_events")
          .select("id", { count: "exact", head: true })
          .not("error", "is", null),
      ]);

      const rows = accounts.data ?? [];
      const live = rows.filter((r) => r.livemode).length;
      const test = rows.length - live;
      const mode: PaymentsSnapshot["mode"] =
        rows.length === 0 ? "none" : live && test ? "mixed" : live ? "live" : "test";

      const byStatus: Partial<Record<PayoutStatus, number>> = {};
      rows.forEach((r) => {
        const key = r.payout_status as PayoutStatus;
        byStatus[key] = (byStatus[key] ?? 0) + 1;
      });

      return {
        mode,
        total: rows.length,
        byStatus,
        lastEvent: events.data?.[0] ?? null,
        failedEvents: failed.count ?? 0,
      };
    },
    staleTime: 30_000,
  });

const MODE_LABEL: Record<PaymentsSnapshot["mode"], string> = {
  live: "Live mode",
  test: "Test mode",
  mixed: "Mixed modes",
  none: "No accounts yet",
};

const PaymentsStatusPanel = () => {
  const { data, isLoading } = usePaymentsSnapshot();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-accent" />
          <h2 className="font-display text-sm font-semibold">Payments</h2>
        </div>
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        ) : (
          <Badge variant={data?.mode === "live" ? "default" : data?.mode === "mixed" ? "destructive" : "outline"}>
            {MODE_LABEL[data?.mode ?? "none"]}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading payments status…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Connected accounts
              </p>
              <p className="mt-1 font-hero text-2xl font-semibold tracking-tight">{data?.total ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Last webhook
              </p>
              <p className="mt-1 text-sm">
                {data?.lastEvent
                  ? `${data.lastEvent.type} · ${new Date(data.lastEvent.created_at).toLocaleString()}`
                  : "None received yet"}
              </p>
            </div>
          </div>

          {data && data.total > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(data.byStatus) as PayoutStatus[]).map((status) => (
                <li key={status} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  {PAYOUT_LABELS[status]}: <span className="text-foreground">{data.byStatus[status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No merchant has completed payments setup yet.
            </p>
          )}

          {data && data.failedEvents > 0 ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-secondary p-3 text-xs text-muted-foreground">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                {data.failedEvents} webhook event{data.failedEvents === 1 ? "" : "s"} recorded an error — review before
                launch.
              </span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default PaymentsStatusPanel;
