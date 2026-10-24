// Shared calendar-sync context: provider mapping, merchant + entitlement gate.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { admin, requireUser } from "./auth.ts";
import { GOOGLE_CALENDAR_SCOPES, MICROSOFT_OUTLOOK_SCOPES } from "./appUserScopes.ts";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export type Provider = "google" | "microsoft";

export const PROVIDERS: Record<Provider, { connectorId: string; scopes: string[]; clientEnv: string }> = {
  google: {
    connectorId: "google_calendar",
    scopes: GOOGLE_CALENDAR_SCOPES,
    clientEnv: "GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY",
  },
  microsoft: {
    connectorId: "microsoft_outlook",
    scopes: MICROSOFT_OUTLOOK_SCOPES,
    clientEnv: "MICROSOFT_OUTLOOK_APP_USER_CONNECTOR_CLIENT_API_KEY",
  },
};

export const isProvider = (v: unknown): v is Provider => v === "google" || v === "microsoft";

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const preflight = (req: Request) =>
  req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders }) : null;

export interface MerchantCtx {
  userId: string;
  merchant: { id: string; business_name: string; industry_slug: string | null; plan_slug: string };
}

/** Signed-in merchant on a plan that includes calendar.sync, or an error Response. */
export async function requireCalendarMerchant(req: Request): Promise<MerchantCtx | Response> {
  const user = await requireUser(req);
  if (!user) return json({ error: "Sign in required" }, 401);
  const { data: merchant } = await admin
    .from("merchants")
    .select("id, business_name, industry_slug, plan_slug")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!merchant) return json({ error: "No store found for this account" }, 404);
  const { data: plan } = await admin.from("orders_plans").select("entitlements").eq("slug", merchant.plan_slug).maybeSingle();
  const ents = (plan?.entitlements ?? {}) as Record<string, unknown>;
  if (ents["calendar.sync"] !== true) return json({ error: "Calendar sync is included on paid plans", code: "plan_required" }, 403);
  return { userId: user.id, merchant };
}
