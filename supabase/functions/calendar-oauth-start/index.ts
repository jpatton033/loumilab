import { authorizeAppUserOAuth } from "../_shared/appUserConnector.ts";
import { getConnectionKeyForUser } from "../_shared/appUserConnections.ts";
import { GATEWAY_BASE_URL, PROVIDERS, isProvider, json, preflight, requireCalendarMerchant } from "../_shared/calendar.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const ctx = await requireCalendarMerchant(req);
    if (ctx instanceof Response) return ctx;
    const body = await req.json().catch(() => ({}));
    if (!isProvider(body.provider)) return json({ error: "Unknown calendar provider" }, 400);
    let origin: URL;
    try {
      origin = new URL(String(body.origin));
      if (!/^https?:$/.test(origin.protocol)) throw new Error();
    } catch {
      return json({ error: "Invalid origin" }, 400);
    }
    const p = PROVIDERS[body.provider];
    const clientAPIKey = Deno.env.get(p.clientEnv);
    if (!clientAPIKey) return json({ error: "Calendar provider is not configured yet" }, 500);
    const slug = body.provider === "google" ? "google-calendar" : "outlook";
    const existing = await getConnectionKeyForUser(ctx.userId, p.connectorId);
    const credentialsConfiguration: Record<string, unknown> = { scopes: p.scopes };
    if (body.provider === "microsoft") {
      credentialsConfiguration.domain_hint = "none";
      credentialsConfiguration.prompt = "select_account";
    }
    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: p.connectorId,
      appUserId: ctx.userId,
      clientAPIKey,
      returnUrl: new URL(`/oauth/${slug}/return`, origin.origin).toString(),
      connectionAPIKey: existing ?? undefined,
      credentialsConfiguration,
    });
    return json({ authorizationUrl });
  } catch (e) {
    console.error("calendar-oauth-start failed:", e);
    return json({ error: e instanceof Error ? e.message : "Could not start calendar connection" }, 500);
  }
});
