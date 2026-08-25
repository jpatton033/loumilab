/**
 * Loumilab Daily Operations Brief — generator and sender.
 *
 * Invoked two ways:
 *   1. pg_cron every 5 minutes with the shared cron key. The function decides
 *      whether the configured delivery time has arrived in the configured
 *      timezone (DST-aware), so 8:00 AM Eastern stays 8:00 AM Eastern all year.
 *   2. A Super Admin from the dashboard, with their session JWT, to preview or
 *      send a test brief on demand.
 *
 * All data is read with the service role inside this function; nothing about
 * the brief is exposed to the browser except through the staff-only tables.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

import { buildSnapshot, buildSubject, countBySeverity, resolveWindow } from "../_shared/ops-brief/build.ts";
import { renderBriefHtml, renderBriefText } from "../_shared/ops-brief/render.ts";
import { sendBriefEmail } from "../_shared/ops-brief/email.ts";
import type { BriefSettings } from "../_shared/ops-brief/types.ts";
import { EMAIL_RE, zonedDateKey, zonedTime } from "../_shared/ops-brief/util.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("OPS_BRIEF_CRON_SECRET");
const JOB_NAME = "ops-brief";
/** Cron cadence tolerance: a 5-minute schedule must not miss its slot. */
const DUE_WINDOW_MINUTES = 9;

type Mode = "scheduled" | "test" | "preview";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  let payload: { mode?: string; recipients?: unknown; force?: boolean } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const requestedMode: Mode =
    payload.mode === "test" ? "test" : payload.mode === "preview" ? "preview" : "scheduled";

  // ---- Authorisation: cron key OR an authenticated staff session.
  const cronKey = req.headers.get("x-ops-cron-key");
  const isCron = Boolean(CRON_SECRET && cronKey && timingSafeEqual(cronKey, CRON_SECRET));
  let actor = "schedule";

  if (!isCron) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    // Staff check reads the role tables directly with the service role, so it
    // does not depend on client-facing function grants.
    const [{ data: appRole }, { data: adminRole }] = await Promise.all([
      admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle(),
      admin.from("admin_roles").select("role").eq("user_id", userData.user.id).limit(1).maybeSingle(),
    ]);
    if (!appRole && !adminRole) return json({ error: "Forbidden" }, 403);

    actor = requestedMode === "preview" ? "preview" : "manual";
  }

  // Only the scheduler may claim the scheduled slot; a signed-in admin gets a
  // test send. Either caller may request a dry-run preview, which never sends.
  const mode: Mode =
    requestedMode === "preview" ? "preview" : isCron ? "scheduled" : "test";


  // ---- Settings
  const { data: settingsRow, error: settingsError } = await admin
    .from("ops_brief_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (settingsError || !settingsRow) {
    return json({ error: "Brief settings are not configured" }, 500);
  }

  const settings: BriefSettings = {
    ...settingsRow,
    sections: settingsRow.sections ?? {},
    modules: settingsRow.modules ?? {},
    thresholds: settingsRow.thresholds ?? {},
    immediate_alerts: settingsRow.immediate_alerts ?? {},
    recipients: settingsRow.recipients ?? [],
  };

  const now = new Date();

  if (mode === "scheduled") {
    if (!settings.enabled) return json({ skipped: "disabled" });
    const decision = await scheduleDecision(admin, settings, now);
    if (!decision.due) return json({ skipped: decision.reason });
  }

  // ---- Single-flight lease so overlapping cron ticks cannot double-send.
  let leaseId: string | null = null;
  if (mode !== "preview") {
    const { data: lease } = await admin.rpc("ops_acquire_job_lease", {
      _job: JOB_NAME,
      _lease_seconds: 600,
    });
    if (!lease) return json({ skipped: "another run is in progress" });
    leaseId = lease as string;
  }

  try {
    const window = resolveWindow(settings, now);
    const snapshot = await buildSnapshot(admin, settings, now, window);
    const subject = buildSubject(snapshot);
    const html = renderBriefHtml(snapshot, settings.timezone);
    const text = renderBriefText(snapshot);
    const counts = countBySeverity(snapshot);

    if (mode === "preview") {
      return json({ ok: true, mode, subject, html, snapshot });
    }

    const requested = Array.isArray(payload.recipients) ? payload.recipients : null;
    const recipients = normaliseRecipients(
      mode === "test" && requested?.length ? (requested as string[]) : settings.recipients,
    );

    if (recipients.length === 0) {
      await finishLease(admin, leaseId, "failed", "No valid recipients configured");
      return json({ error: "No valid recipients configured" }, 400);
    }

    // ---- Persist the report first: a generated brief is never lost to a send failure.
    const { data: report, error: reportError } = await admin
      .from("ops_brief_reports")
      .insert({
        report_date: snapshot.reportDate,
        window_start: snapshot.window.start,
        window_end: snapshot.window.end,
        window_label: snapshot.window.label,
        subject,
        summary: snapshot.executive.summary,
        snapshot,
        html,
        critical_count: counts.critical,
        important_count: counts.important,
        action_count: counts.total,
        recipients,
        generated_by: mode === "scheduled" ? "schedule" : actor,
        is_test: mode === "test",
      })
      .select("id")
      .single();

    if (reportError) {
      // 23505 = the unique scheduled-per-day index: today's brief already exists.
      if (reportError.code === "23505") {
        await finishLease(admin, leaseId, "skipped", "Brief already generated for this date");
        return json({ skipped: "already generated for this date" });
      }
      throw reportError;
    }

    // ---- Deliver, recording each recipient's outcome independently.
    const results: { recipient: string; ok: boolean; error?: string }[] = [];
    for (const recipient of recipients) {
      const send = await sendBriefEmail({ to: recipient, subject, html, text });
      results.push({ recipient, ok: send.ok, error: send.error });

      await admin.from("ops_brief_deliveries").insert({
        report_id: report.id,
        recipient,
        status: send.ok ? "sent" : send.retryable ? "retrying" : "failed",
        attempts: 1,
        error: send.ok ? null : send.error,
        queued_at: new Date().toISOString(),
        sent_at: send.ok ? new Date().toISOString() : null,
      });
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      // Delivery failure is itself an operational incident worth surfacing.
      await admin.from("ops_alerts").insert({
        category: "email",
        severity: failed.length === results.length ? "critical" : "important",
        title: "Daily Brief delivery failed",
        detail: failed.map((f) => `${f.recipient}: ${f.error ?? "unknown error"}`).join("; ").slice(0, 500),
        affected_system: "Email delivery",
        recommended_action: "Check the email sending configuration and resend the brief from Super Admin.",
        link_path: "/admin/reports/daily-brief",
      });
    }

    await finishLease(
      admin,
      leaseId,
      failed.length === results.length ? "failed" : "success",
      failed.length > 0 ? `${failed.length} of ${results.length} deliveries failed` : null,
      { report_id: report.id, mode, sent: results.length - failed.length },
    );

    return json({
      ok: failed.length < results.length,
      mode,
      reportId: report.id,
      subject,
      sent: results.length - failed.length,
      failed: failed.length,
      actions: counts.total,
    });
  } catch (err) {
    const message = (err as Error).message ?? "Unknown error";
    console.error("ops-brief-run failed:", message);
    await finishLease(admin, leaseId, "failed", message.slice(0, 400));
    return json({ error: "Failed to generate the daily brief", detail: message.slice(0, 200) }, 500);
  }
});

/**
 * Decides whether the scheduled brief is due now. Uses wall-clock time in the
 * configured timezone, so DST shifts are handled automatically, and catches up
 * later in the day if a tick was missed.
 */
async function scheduleDecision(
  // deno-lint-ignore no-explicit-any
  admin: any,
  settings: BriefSettings,
  now: Date,
): Promise<{ due: boolean; reason?: string }> {
  const today = zonedDateKey(now, settings.timezone);

  const { data: existing } = await admin
    .from("ops_brief_reports")
    .select("id")
    .eq("report_date", today)
    .eq("generated_by", "schedule")
    .eq("is_test", false)
    .maybeSingle();

  if (existing) return { due: false, reason: "already sent today" };

  const { hour, minute } = zonedTime(now, settings.timezone);
  const nowMinutes = hour * 60 + minute;
  const targetMinutes = settings.delivery_hour * 60 + settings.delivery_minute;

  if (nowMinutes < targetMinutes) return { due: false, reason: "before delivery time" };
  // Inside the slot, or a catch-up later the same day after a missed tick.
  if (nowMinutes <= targetMinutes + DUE_WINDOW_MINUTES) return { due: true };
  return { due: true, reason: "catch-up" };
}

async function finishLease(
  // deno-lint-ignore no-explicit-any
  admin: any,
  leaseId: string | null,
  status: "success" | "failed" | "skipped",
  error: string | null,
  metadata: Record<string, unknown> = {},
) {
  if (!leaseId) return;
  await admin
    .from("ops_job_runs")
    .update({ status, finished_at: new Date().toISOString(), error, metadata })
    .eq("id", leaseId);
}

const normaliseRecipients = (list: string[]) => {
  const seen = new Set<string>();
  return list
    .map((r) => String(r ?? "").trim().toLowerCase())
    .filter((r) => EMAIL_RE.test(r) && r.length <= 255)
    .filter((r) => (seen.has(r) ? false : (seen.add(r), true)))
    .slice(0, 20);
};

/** Constant-time comparison so the cron key cannot be probed by timing. */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
