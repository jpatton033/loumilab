// Loumilab stays the source of truth: this only mirrors a job onto the merchant's calendar.
import { admin } from "../_shared/auth.ts";
import { appUserReconnectRequired, callAsAppUser } from "../_shared/appUserConnector.ts";
import { getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
import { GATEWAY_BASE_URL, PROVIDERS, json, preflight, requireCalendarMerchant, type MerchantCtx, type Provider } from "../_shared/calendar.ts";

const UUID = /^[0-9a-f-]{36}$/i;
const DURATION_MS = 60 * 60_000;

function noun(industry?: string | null) {
  const s = (industry ?? "").toLowerCase();
  if (/(food|cater|bak|restaurant)/.test(s)) return "Catering event";
  if (/(beauty|salon|spa|barber|personal)/.test(s)) return "Appointment";
  if (/(photo|creative|studio)/.test(s)) return "Session";
  if (/(professional|consult|legal|account)/.test(s)) return "Consultation";
  if (/(home|trade|clean|repair|service|plumb|electric)/.test(s)) return "Service visit";
  return "Appointment";
}

type Outcome = { job_id: string; status: string; error?: string };

async function syncJob(ctx: MerchantCtx, jobId: string): Promise<Outcome> {
  const { data: job } = await admin
    .from("merchant_jobs")
    .select("id, merchant_id, title, status, scheduled_for, scheduled_window, service_address")
    .eq("id", jobId)
    .eq("merchant_id", ctx.merchant.id)
    .maybeSingle();
  if (!job) return { job_id: jobId, status: "not_found" };

  const { data: link } = await admin.from("merchant_calendar_links").select("*").eq("merchant_id", ctx.merchant.id).maybeSingle();
  if (!link || !link.calendar_id || link.reconnect_required) return { job_id: jobId, status: "skipped" };

  const provider = link.provider as Provider;
  const p = PROVIDERS[provider];
  const key = await getConnectionKeyForUser(ctx.userId, p.connectorId);
  if (!key) {
    await admin.from("merchant_calendar_links").update({ reconnect_required: true }).eq("merchant_id", ctx.merchant.id);
    return { job_id: jobId, status: "reconnect_required" };
  }

  const { data: rec } = await admin
    .from("merchant_job_calendar_events")
    .select("*")
    .eq("job_id", jobId)
    .eq("provider", provider)
    .maybeSingle();

  const shouldExist = !!job.scheduled_for && job.status !== "cancelled";
  const cal = encodeURIComponent(link.calendar_id);
  // Deterministic Google id (base32hex: 0-9a-v) prevents duplicate events on retries.
  const googleId = `lml${job.id.replace(/-/g, "")}`;
  const eventId = rec?.external_event_id ?? (provider === "google" ? googleId : null);

  const call = (path: string, init?: RequestInit) =>
    callAsAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: p.connectorId, path, init, requiredScopes: p.scopes });

  const record = async (fields: Record<string, unknown>) => {
    await admin.from("merchant_job_calendar_events").upsert(
      { merchant_id: ctx.merchant.id, job_id: jobId, provider, updated_at: new Date().toISOString(), ...fields },
      { onConflict: "job_id,provider" },
    );
  };

  const fail = async (res: Response): Promise<Outcome> => {
    if (await appUserReconnectRequired(res)) {
      await admin.from("merchant_calendar_links").update({ reconnect_required: true }).eq("merchant_id", ctx.merchant.id);
      await record({ sync_status: "failed", last_error: "Calendar access needs to be renewed", attempts: (rec?.attempts ?? 0) + 1 });
      return { job_id: jobId, status: "reconnect_required" };
    }
    const t = await res.text();
    console.error(`Calendar sync failed [${res.status}]: ${t}`);
    await record({ sync_status: "failed", last_error: `Provider error ${res.status}`, attempts: (rec?.attempts ?? 0) + 1 });
    return { job_id: jobId, status: "failed", error: `Provider error ${res.status}` };
  };

  if (!shouldExist) {
    if (!rec?.external_event_id || rec.sync_status === "removed") return { job_id: jobId, status: "nothing_to_remove" };
    const path = provider === "google" ? `/calendar/v3/calendars/${cal}/events/${encodeURIComponent(rec.external_event_id)}` : `/me/events/${encodeURIComponent(rec.external_event_id)}`;
    const res = await call(path, { method: "DELETE" });
    if (!res.ok && res.status !== 404 && res.status !== 410) return fail(res);
    await record({ sync_status: "removed", last_error: null, synced_at: new Date().toISOString() });
    return { job_id: jobId, status: "removed" };
  }

  const start = new Date(job.scheduled_for as string);
  const end = new Date(start.getTime() + DURATION_MS);
  const summary = `${noun(ctx.merchant.industry_slug)}: ${job.title} — ${ctx.merchant.business_name}`.slice(0, 250);
  const description = job.scheduled_window ? `Arrival window: ${job.scheduled_window}\nBooked through Loumilab Orders.` : "Booked through Loumilab Orders.";
  const location = job.service_address ?? undefined;

  let res: Response;
  if (provider === "google") {
    const payload = { summary, description, location, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() }, status: "confirmed" };
    const base = `/calendar/v3/calendars/${cal}/events`;
    const exists = rec?.external_event_id && rec.sync_status !== "removed";
    res = exists
      ? await call(`${base}/${encodeURIComponent(eventId!)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await call(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: googleId, ...payload }) });
    if (res.status === 409) {
      // Already created (earlier attempt or previously removed) — update it in place.
      res = await call(`${base}/${googleId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
  } else {
    const iso = (d: Date) => d.toISOString().replace("Z", "");
    const payload = {
      subject: summary,
      body: { contentType: "Text", content: description },
      location: location ? { displayName: location } : undefined,
      start: { dateTime: iso(start), timeZone: "UTC" },
      end: { dateTime: iso(end), timeZone: "UTC" },
      transactionId: `lml-${job.id}`,
    };
    const exists = rec?.external_event_id && rec.sync_status !== "removed";
    res = exists
      ? await call(`/me/events/${encodeURIComponent(eventId!)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await call(`/me/calendars/${cal}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  }
  if (!res.ok) return fail(res);
  const created = await res.json().catch(() => ({}));
  await record({ external_event_id: created.id ?? eventId, sync_status: "synced", last_error: null, attempts: 0, synced_at: new Date().toISOString() });
  return { job_id: jobId, status: "synced" };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const ctx = await requireCalendarMerchant(req);
    if (ctx instanceof Response) return ctx;
    const body = await req.json().catch(() => ({}));
    if (body.retry_failed === true) {
      const { data: failed } = await admin
        .from("merchant_job_calendar_events")
        .select("job_id")
        .eq("merchant_id", ctx.merchant.id)
        .eq("sync_status", "failed")
        .limit(20);
      const results: Outcome[] = [];
      for (const r of failed ?? []) results.push(await syncJob(ctx, r.job_id));
      return json({ results });
    }
    if (typeof body.job_id !== "string" || !UUID.test(body.job_id)) return json({ error: "Invalid job" }, 400);
    return json(await syncJob(ctx, body.job_id));
  } catch (e) {
    console.error("calendar-sync failed:", e);
    return json({ error: e instanceof Error ? e.message : "Calendar sync failed" }, 500);
  }
});
