import { admin } from "../_shared/auth.ts";
import { appUserReconnectRequired, callAsAppUser, disconnectAppUser } from "../_shared/appUserConnector.ts";
import { deleteConnectionKeyForUser, getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
import { GATEWAY_BASE_URL, PROVIDERS, json, preflight, requireCalendarMerchant, type Provider } from "../_shared/calendar.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const ctx = await requireCalendarMerchant(req);
    if (ctx instanceof Response) return ctx;
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    const { data: link } = await admin.from("merchant_calendar_links").select("*").eq("merchant_id", ctx.merchant.id).maybeSingle();
    if (action === "status") return json({ link: link ?? null });
    if (!link) return json({ error: "No calendar connected" }, 400);

    const provider = link.provider as Provider;
    const p = PROVIDERS[provider];
    const key = await getConnectionKeyForUser(ctx.userId, p.connectorId);

    if (action === "disconnect") {
      if (key) {
        await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: p.connectorId }).catch((e) =>
          console.error("Gateway disconnect failed:", e),
        );
        await deleteConnectionKeyForUser(ctx.userId, p.connectorId);
      }
      await admin.from("merchant_calendar_links").delete().eq("merchant_id", ctx.merchant.id);
      return json({ ok: true });
    }

    if (!key) {
      await admin.from("merchant_calendar_links").update({ reconnect_required: true }).eq("merchant_id", ctx.merchant.id);
      return json({ reconnectRequired: true });
    }

    if (action === "list_calendars") {
      const path = provider === "google" ? "/calendar/v3/users/me/calendarList?minAccessRole=writer" : "/me/calendars?$select=id,name,canEdit,isDefaultCalendar";
      const res = await callAsAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: p.connectorId, path, requiredScopes: p.scopes });
      if (await appUserReconnectRequired(res)) {
        await admin.from("merchant_calendar_links").update({ reconnect_required: true }).eq("merchant_id", ctx.merchant.id);
        return json({ reconnectRequired: true });
      }
      if (!res.ok) {
        const t = await res.text();
        console.error(`List calendars failed [${res.status}]: ${t}`);
        return json({ error: "Could not load your calendars", status: res.status }, 502);
      }
      const b = await res.json();
      const calendars =
        provider === "google"
          ? (b.items ?? []).map((c: any) => ({ id: c.id, name: c.summaryOverride ?? c.summary, primary: !!c.primary }))
          : (b.value ?? []).filter((c: any) => c.canEdit !== false).map((c: any) => ({ id: c.id, name: c.name, primary: !!c.isDefaultCalendar }));
      return json({ calendars });
    }

    if (action === "select") {
      if (typeof body.calendar_id !== "string" || !body.calendar_id || body.calendar_id.length > 500) return json({ error: "Choose a calendar" }, 400);
      const name = typeof body.calendar_name === "string" ? body.calendar_name.slice(0, 200) : null;
      await admin
        .from("merchant_calendar_links")
        .update({ calendar_id: body.calendar_id, calendar_name: name, updated_at: new Date().toISOString() })
        .eq("merchant_id", ctx.merchant.id);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("calendar-manage failed:", e);
    return json({ error: e instanceof Error ? e.message : "Calendar request failed" }, 500);
  }
});
