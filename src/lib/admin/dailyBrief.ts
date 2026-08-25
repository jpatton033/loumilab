import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Super Admin data layer for the Daily Operations Brief. Reads go straight to
 * the staff-only tables; generation and sending always go through the edge
 * function so the service-role work stays on the server.
 */

export interface BriefSettingsRow {
  id: string;
  enabled: boolean;
  delivery_hour: number;
  delivery_minute: number;
  timezone: string;
  recipients: string[];
  reporting_window: "previous_24h" | "previous_calendar_day" | "custom";
  custom_window_hours: number;
  sections: Record<string, boolean>;
  modules: Record<string, boolean>;
  thresholds: Record<string, number>;
  immediate_alerts: Record<string, boolean>;
  updated_at: string;
}

export interface BriefReportRow {
  id: string;
  report_date: string;
  window_start: string;
  window_end: string;
  subject: string;
  summary: string | null;
  html: string | null;
  snapshot: unknown;
  critical_count: number;
  important_count: number;
  action_count: number;
  recipients: string[];
  generated_by: string;
  is_test: boolean;
  created_at: string;
}

export interface BriefDeliveryRow {
  id: string;
  report_id: string;
  recipient: string;
  status: string;
  attempts: number;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface OpsAlertRow {
  id: string;
  category: string;
  severity: "critical" | "important" | "review" | "normal";
  title: string;
  detail: string | null;
  affected_system: string | null;
  recommended_action: string | null;
  link_path: string | null;
  detected_at: string;
  resolved_at: string | null;
}

export interface JobRunRow {
  id: string;
  job: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
}

const asRecord = <T,>(value: unknown, fallback: Record<string, T>) =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, T>) : fallback;

export const useBriefSettings = () =>
  useQuery({
    queryKey: ["admin", "brief-settings"],
    queryFn: async (): Promise<BriefSettingsRow | null> => {
      const { data, error } = await supabase.from("ops_brief_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...(data as unknown as BriefSettingsRow),
        sections: asRecord<boolean>(data.sections, {}),
        modules: asRecord<boolean>(data.modules, {}),
        thresholds: asRecord<number>(data.thresholds, {}),
        immediate_alerts: asRecord<boolean>(data.immediate_alerts, {}),
        recipients: data.recipients ?? [],
      };
    },
  });

export const useUpdateBriefSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BriefSettingsRow> }) => {
      const { error } = await supabase
        .from("ops_brief_settings")
        .update(patch as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brief-settings"] }),
  });
};

export const useBriefReports = (limit = 60) =>
  useQuery({
    queryKey: ["admin", "brief-reports", limit],
    queryFn: async (): Promise<BriefReportRow[]> => {
      const { data, error } = await supabase
        .from("ops_brief_reports")
        .select(
          "id, report_date, window_start, window_end, subject, summary, snapshot, critical_count, important_count, action_count, recipients, generated_by, is_test, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as BriefReportRow[];
    },
  });

/** The stored HTML is fetched only when a report is actually opened. */
export const useBriefReportHtml = (id: string | null) =>
  useQuery({
    queryKey: ["admin", "brief-report-html", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.from("ops_brief_reports").select("html").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data?.html ?? null;
    },
  });

export const useBriefDeliveries = (reportId: string | null) =>
  useQuery({
    queryKey: ["admin", "brief-deliveries", reportId],
    enabled: Boolean(reportId),
    queryFn: async (): Promise<BriefDeliveryRow[]> => {
      const { data, error } = await supabase
        .from("ops_brief_deliveries")
        .select("id, report_id, recipient, status, attempts, error, sent_at, created_at")
        .eq("report_id", reportId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BriefDeliveryRow[];
    },
  });

export const useOpsAlerts = (limit = 30) =>
  useQuery({
    queryKey: ["admin", "ops-alerts", limit],
    queryFn: async (): Promise<OpsAlertRow[]> => {
      const { data, error } = await supabase
        .from("ops_alerts")
        .select(
          "id, category, severity, title, detail, affected_system, recommended_action, link_path, detected_at, resolved_at",
        )
        .order("detected_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as OpsAlertRow[];
    },
  });

export const useResolveAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ops_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ops-alerts"] }),
  });
};

export const useBriefJobRuns = (limit = 10) =>
  useQuery({
    queryKey: ["admin", "brief-job-runs", limit],
    queryFn: async (): Promise<JobRunRow[]> => {
      const { data, error } = await supabase
        .from("ops_job_runs")
        .select("id, job, status, started_at, finished_at, error")
        .eq("job", "ops-brief")
        .order("started_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as JobRunRow[];
    },
  });

export interface RunBriefResult {
  ok?: boolean;
  mode?: string;
  subject?: string;
  html?: string;
  sent?: number;
  failed?: number;
  skipped?: string;
  error?: string;
}

/** Runs the brief on demand: a preview renders only, a test send emails now. */
export const useRunBrief = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      mode,
      recipients,
    }: {
      mode: "preview" | "test";
      recipients?: string[];
    }): Promise<RunBriefResult> => {
      const { data, error } = await supabase.functions.invoke("ops-brief-run", {
        body: { mode, recipients },
      });
      if (error) throw error;
      return data as RunBriefResult;
    },
    onSuccess: (_data, vars) => {
      if (vars.mode === "test") {
        qc.invalidateQueries({ queryKey: ["admin", "brief-reports"] });
        qc.invalidateQueries({ queryKey: ["admin", "brief-job-runs"] });
      }
    },
  });
};

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
  "Europe/London",
];

/** Section toggles shown in settings, grouped the way the brief reads. */
export const SECTION_GROUPS: { label: string; items: { key: string; label: string; note?: string }[] }[] = [
  {
    label: "Loumilab Orders",
    items: [
      { key: "orders", label: "Orders activity", note: "Live once customer checkout ships" },
      { key: "merchants", label: "Merchants & onboarding" },
      { key: "payments", label: "Payments & Stripe health" },
      { key: "payouts", label: "Merchant payouts", note: "Live once payments process" },
      { key: "revenue", label: "Revenue", note: "Live once payments process" },
      { key: "subscriptions", label: "Subscriptions", note: "Live once plan billing ships" },
      { key: "refunds", label: "Refunds", note: "Live once payments process" },
      { key: "disputes", label: "Disputes & chargebacks", note: "Live once payments process" },
      { key: "experience", label: "Customer experience", note: "Live once checkout ships" },
    ],
  },
  {
    label: "Website & pipeline",
    items: [
      { key: "leads", label: "Leads & opportunities" },
      { key: "knowledge", label: "Knowledge Center" },
      { key: "website_changes", label: "Content & site changes" },
      { key: "website", label: "Traffic & growth", note: "Needs a web analytics integration" },
      { key: "seo", label: "SEO & discoverability", note: "Needs Search Console reporting" },
    ],
  },
  {
    label: "Governance & platform",
    items: [
      { key: "pricing", label: "Pricing & policy changes" },
      { key: "audit", label: "Admin activity" },
      { key: "security", label: "Security" },
      { key: "system", label: "System health" },
      { key: "development", label: "Development activity", note: "Needs deployment telemetry" },
    ],
  },
];

export const MODULES = [
  { key: "orders", label: "Loumilab Orders" },
  { key: "website", label: "Website & marketing" },
  { key: "knowledge", label: "Knowledge Center" },
  { key: "consulting", label: "Consulting & projects" },
];

export const THRESHOLDS = [
  { key: "lead_uncontacted_hours", label: "Flag uncontacted leads after (hours)", min: 1, max: 336 },
  { key: "inquiry_unread_hours", label: "Flag unread inquiries after (hours)", min: 1, max: 336 },
  { key: "webhook_failures", label: "Alert when Stripe webhook failures exceed", min: 0, max: 100 },
  { key: "payout_failures", label: "Alert when payout issues exceed", min: 0, max: 100 },
  { key: "payment_failure_rate_pct", label: "Alert when payment failure rate exceeds (%)", min: 1, max: 100 },
  { key: "refund_rate_pct", label: "Alert when refund rate exceeds (%)", min: 1, max: 100 },
  { key: "dispute_count", label: "Alert when disputes reach", min: 1, max: 100 },
  { key: "order_decline_pct", label: "Alert when orders drop by (%)", min: 5, max: 100 },
  { key: "revenue_decline_pct", label: "Alert when revenue drops by (%)", min: 5, max: 100 },
  { key: "traffic_decline_pct", label: "Alert when traffic drops by (%)", min: 5, max: 100 },
];

export const formatDeliveryTime = (settings: BriefSettingsRow) => {
  const h = settings.delivery_hour;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(settings.delivery_minute).padStart(2, "0")} ${suffix}`;
};
