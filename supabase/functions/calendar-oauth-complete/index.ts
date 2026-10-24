import { admin } from "../_shared/auth.ts";
import { callAsAppUser, disconnectAppUser, exchangeAppUserOAuthCode } from "../_shared/appUserConnector.ts";
import {
  deleteConnectionKeyForUser,
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
} from "../_shared/appUserConnections.ts";
import { GATEWAY_BASE_URL, PROVIDERS, isProvider, json, preflight, requireCalendarMerchant, type Provider } from "../_shared/calendar.ts";

async function accountEmail(provider: Provider, key: string): Promise<string | null> {
  const p = PROVIDERS[provider];
  const path = provider === "google" ? "/calendar/v3/users/me/calendarList/primary" : "/me";
  const res = await callAsAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: key, connectorId: p.connectorId, path });
  if (!res.ok) return null;
  const b = await res.json().catch(() => ({}));
  return provider === "google" ? b.id ?? null : b.mail ?? b.userPrincipalName ?? null;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const ctx = await requireCalendarMerchant(req);
    if (ctx instanceof Response) return ctx;
    const body = await req.json().catch(() => ({}));
    if (!isProvider(body.provider) || typeof body.code !== "string" || body.code.length > 2000 || !body.code) {
      return json({ error: "Invalid request" }, 400);
    }
    const provider: Provider = body.provider;
    const p = PROVIDERS[provider];
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(GATEWAY_BASE_URL, body.code);
    if (connectorId !== p.connectorId) return json({ error: "Wrong calendar provider" }, 400);
    await saveConnectionKeyForUser(ctx.userId, connectorId, connectionAPIKey);

    // One provider at a time: release the other provider's connection.
    const other: Provider = provider === "google" ? "microsoft" : "google";
    const otherKey = await getConnectionKeyForUser(ctx.userId, PROVIDERS[other].connectorId);
    if (otherKey) {
      await disconnectAppUser({ gatewayBaseUrl: GATEWAY_BASE_URL, connectionAPIKey: otherKey, connectorId: PROVIDERS[other].connectorId }).catch((e) =>
        console.error("Releasing previous calendar failed:", e),
      );
      await deleteConnectionKeyForUser(ctx.userId, PROVIDERS[other].connectorId);
    }

    const { data: link } = await admin.from("merchant_calendar_links").select("provider, calendar_id, calendar_name").eq("merchant_id", ctx.merchant.id).maybeSingle();
    const sameProvider = link?.provider === provider;
    const email = await accountEmail(provider, connectionAPIKey);
    const { error } = await admin.from("merchant_calendar_links").upsert(
      {
        merchant_id: ctx.merchant.id,
        provider,
        calendar_id: sameProvider ? link?.calendar_id ?? null : null,
        calendar_name: sameProvider ? link?.calendar_name ?? null : null,
        account_email: email,
        reconnect_required: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "merchant_id" },
    );
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error("calendar-oauth-complete failed:", e);
    return json({ error: e instanceof Error ? e.message : "Could not finish calendar connection" }, 500);
  }
});
