import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { logEvent, Mail, newToken, sha256Hex } from "../_shared/emailSetup.ts";

/** Admin-only fulfillment actions that change status or email the customer. */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STATUSES = ["new_request", "awaiting_quote", "awaiting_payment", "paid_awaiting_setup", "in_progress", "awaiting_customer", "testing", "completed", "canceled"] as const;

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_status"), id: z.string().uuid(), status: z.enum(STATUSES), message: z.string().trim().max(3000).optional() }),
  z.object({ action: z.literal("quote"), id: z.string().uuid(), cents: z.number().int().min(100).max(10_000_00), note: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("new_link"), id: z.string().uuid() }),
]);

const LABEL: Record<string, string> = {
  in_progress: "Setup started", awaiting_customer: "We need something from you", testing: "Testing your email",
  completed: "Setup complete", canceled: "Request canceled", paid_awaiting_setup: "Payment confirmed",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Sign in required." }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Not allowed." }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Invalid request." }, 400);
    const b = parsed.data;

    const { data: r } = await admin.from("email_setup_requests").select("*").eq("id", b.id).maybeSingle();
    if (!r) return json({ error: "Not found." }, 404);

    // A fresh private link for the customer (old links stop working).
    const rotate = async () => {
      const token = newToken();
      await admin.from("email_setup_requests").update({ access_token_hash: await sha256Hex(token) }).eq("id", r.id);
      return token;
    };

    if (b.action === "new_link") {
      const token = await rotate();
      await logEvent(r.id, "admin", "Issued a new private status link");
      return json({ ok: true, token });
    }

    if (b.action === "quote") {
      if (r.payment_status === "paid") return json({ error: "Already paid." }, 409);
      const patch = { quote_cents: b.cents, quote_note: b.note || null, service_status: "awaiting_payment" };
      await admin.from("email_setup_requests").update(patch).eq("id", r.id);
      const token = await rotate();
      await logEvent(r.id, "quote", `Quote issued: $${(b.cents / 100).toFixed(2)}`, true);
      await Mail.quote({ ...r, ...patch }, token);
      return json({ ok: true });
    }

    // set_status
    if (["paid_awaiting_setup", "in_progress", "testing", "completed"].includes(b.status) && r.payment_status !== "paid") {
      return json({ error: "This request hasn't been paid yet." }, 409);
    }
    if (b.status === "awaiting_customer" && !b.message) return json({ error: "Add a message telling the customer what's needed." }, 400);

    const patch: Record<string, unknown> = { service_status: b.status };
    if (b.status === "awaiting_customer") patch.customer_action_message = b.message;
    if (b.status === "completed") {
      patch.completed_at = new Date().toISOString();
      patch.completion_record = { completed_by: user.id, checklist: r.checklist, at: patch.completed_at };
    }
    await admin.from("email_setup_requests").update(patch).eq("id", r.id);
    await logEvent(r.id, "status", LABEL[b.status] ?? b.status, Boolean(LABEL[b.status]));

    const next = { ...r, ...patch };
    if (b.status === "in_progress") await Mail.started(next);
    if (b.status === "awaiting_customer") await Mail.action(next, b.message!);
    if (b.status === "completed") await Mail.completed(next);
    return json({ ok: true });
  } catch (err) {
    console.error("email-setup-admin", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong." }, 500);
  }
});
