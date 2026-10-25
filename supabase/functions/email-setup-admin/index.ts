import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin, requireUser } from "../_shared/auth.ts";
import { logEvent, Mail, newToken, refreshBalance, sha256Hex } from "../_shared/emailSetup.ts";
import { priceLine, proposeTotals } from "../_shared/emailSetupBalance.ts";
import type { EmailPackage } from "../_shared/emailSetupPricing.ts";
import { computeFunds, handoffMissing, HANDOFF_ITEMS, purchaseAllowed, quoteTotals, STAGES, type PurchaseMode } from "../_shared/emailSetupPurchasing.ts";

/** Admin-only fulfillment and billing actions. All money is calculated here. */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STATUSES = ["new_request", "awaiting_review", "awaiting_quote", "awaiting_approval", "awaiting_payment", "ready_for_setup", "in_progress", "awaiting_customer", "testing", "completed", "canceled"] as const;

const Line = z.object({
  kind: z.enum(["addon", "custom", "discount", "credit"]),
  addon: z.enum(["mailbox", "device", "migration", "domain"]).optional(),
  label: z.string().trim().max(160).optional(),
  quantity: z.number().int().min(1).max(100),
  unit_cents: z.number().int().min(0).max(1_000_000).optional(),
  reason: z.string().trim().min(3).max(1000),
  customer_note: z.string().trim().max(1000).optional(),
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_status"), id: z.string().uuid(), status: z.enum(STATUSES), message: z.string().trim().max(3000).optional() }),
  z.object({ action: z.literal("quote"), id: z.string().uuid(), cents: z.number().int().min(100).max(1_000_000), note: z.string().trim().max(2000).optional(),
    third_party_lines: z.array(z.object({ label: z.string().trim().min(2).max(160), cents: z.number().int().min(1).max(500_000), billing: z.string().trim().min(2).max(200) })).max(10).optional() }),
  z.object({ action: z.literal("record_purchase"), id: z.string().uuid(), kind: z.enum(["domain", "email_hosting", "other", "correction"]),
    vendor: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional(), amount_cents: z.number().int().min(-500_000).max(500_000).refine((n) => n !== 0),
    purchased_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reference: z.string().trim().max(200).optional(), commitment: z.string().trim().max(200).optional(),
    renews_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }),
  z.object({ action: z.literal("update_handoff"), id: z.string().uuid(), handoff: z.record(z.boolean()), manual_review: z.boolean() }),
  z.object({ action: z.literal("handoff_action"), id: z.string().uuid(), message: z.string().trim().min(5).max(3000) }),
  z.object({ action: z.literal("set_stage"), id: z.string().uuid(), stage: z.enum(STAGES.map(([k]) => k) as [string, ...string[]]) }),
  z.object({ action: z.literal("log_check"), id: z.string().uuid(), kind: z.enum(["monthly_dns", "expiration_reminder", "security_review", "quarterly_review", "support_request", "other"]), notes: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("new_link"), id: z.string().uuid() }),
  z.object({
    action: z.literal("propose_change"), id: z.string().uuid(),
    package_to: z.enum(["email", "email_domain"]),
    package_reason: z.string().trim().max(1000).optional(),
    lines: z.array(Line).max(20),
    customer_reason: z.string().trim().min(5).max(2000),
    third_party_cents: z.number().int().min(0).max(500_000).optional(),
    internal_note: z.string().trim().max(2000).optional(),
  }),
  z.object({ action: z.literal("cancel_change"), id: z.string().uuid(), change_set_id: z.string().uuid() }),
  z.object({ action: z.literal("resend_change"), id: z.string().uuid(), change_set_id: z.string().uuid() }),
]);

const LABEL: Record<string, string> = {
  in_progress: "Setup started", awaiting_customer: "We need something from you", testing: "Testing your email",
  completed: "Setup complete", canceled: "Request canceled", ready_for_setup: "Ready for setup",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Sign in required." }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Not allowed." }, 403);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Please check the fields and try again.", fields: parsed.error.flatten() }, 400);
    const b = parsed.data;

    const { data: r } = await admin.from("email_setup_requests").select("*").eq("id", b.id).maybeSingle();
    if (!r) return json({ error: "Not found." }, 404);

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
      const bal = await refreshBalance(r.id);
      if (bal.chargedCents > 0) return json({ error: "Already paid — use Change order instead." }, 409);
      const purchasing = r.purchase_mode === "loumilab_purchase";
      if (purchasing && !b.third_party_lines?.length) return json({ error: "Add the confirmed domain and email hosting prices." }, 400);
      const q = quoteTotals(b.cents, purchasing ? b.third_party_lines! : []);
      // A new quote always needs a fresh authorization.
      const patch = {
        quote_cents: q.totalCents, quote_note: b.note || null, service_status: "awaiting_payment",
        third_party_lines: purchasing ? b.third_party_lines : [], third_party_budget_cents: q.thirdPartyCents, purchase_auth: null, purchase_auth_at: null,
      };
      await admin.from("email_setup_requests").update(patch).eq("id", r.id);
      const token = await rotate();
      await logEvent(r.id, "quote", purchasing
        ? `Quote issued: setup $${(q.serviceCents / 100).toFixed(2)} + provider costs $${(q.thirdPartyCents / 100).toFixed(2)}`
        : `Quote issued: $${(b.cents / 100).toFixed(2)}`, true);
      if (purchasing) await Mail.purchaseQuote({ ...r, ...patch }, token);
      else await Mail.quote({ ...r, ...patch }, token);
      return json({ ok: true });
    }

    if (b.action === "propose_change") {
      const { data: open } = await admin.from("email_setup_change_sets").select("id").eq("request_id", r.id).in("status", ["proposed", "approved"]).maybeSingle();
      if (open) return json({ error: "There's already an open change. Cancel it first." }, 409);
      const bal = await refreshBalance(r.id);
      const from = r.package as EmailPackage;
      const priced: Record<string, unknown>[] = [];
      if (b.package_to !== from) {
        const pl = priceLine({ kind: "package_change", quantity: 1 }, from, b.package_to);
        priced.push({ kind: "package_change", ...pl, reason: b.package_reason || b.customer_reason, customer_note: b.package_reason || null });
      }
      let mailboxes = r.mailboxes, devices = r.extra_devices;
      for (const l of b.lines) {
        const pl = priceLine(l, from, b.package_to);
        priced.push({ kind: l.kind, ...pl, reason: l.reason, customer_note: l.customer_note || null });
        if (l.kind === "addon" && l.addon === "mailbox") mailboxes += pl.quantity;
        if (l.kind === "addon" && l.addon === "device") devices += pl.quantity;
      }
      if (b.third_party_cents) {
        if (r.purchase_mode !== "loumilab_purchase") return json({ error: "Provider-cost changes only apply when Loumilab buys the services." }, 400);
        priced.push({ kind: "custom", label: "Additional provider cost (passed through to provider)", quantity: 1, unit_cents: b.third_party_cents, amount_cents: b.third_party_cents, reason: b.customer_reason, customer_note: "Covers a higher confirmed domain or email hosting price. Not Loumilab revenue." });
      }
      if (!priced.length) return json({ error: "Add at least one change." }, 400);
      let totals;
      try { totals = proposeTotals(bal.totalCents, bal.netPaidCents, priced.map((p) => p.amount_cents as number)); }
      catch (e) { return json({ error: (e as Error).message }, 400); }

      const { data: c, error } = await admin.from("email_setup_change_sets").insert({
        request_id: r.id, status: "proposed", customer_reason: b.customer_reason, internal_note: b.internal_note || null,
        package_from: from, package_to: b.package_to, mailboxes_to: mailboxes, devices_to: devices,
        total_before_cents: bal.totalCents, total_after_cents: totals.totalAfter, paid_before_cents: bal.netPaidCents,
        amount_due_cents: totals.amountDue, credit_cents: totals.credit, created_by: user.id,
      }).select("*").single();
      if (error || !c) return json({ error: error?.message ?? "Couldn't save." }, 500);
      await admin.from("email_setup_adjustments").insert(priced.map((p) => ({ ...p, request_id: r.id, change_set_id: c.id, created_by: user.id })));
      await admin.from("email_setup_requests").update({ service_status: "awaiting_approval" }).eq("id", r.id);
      await admin.from("audit_logs").insert({
        actor_id: user.id, action: "email_setup.change_proposed", target_type: "email_setup_request", target_id: r.id,
        old_value: { total_cents: bal.totalCents, package: from }, new_value: { total_cents: totals.totalAfter, package: b.package_to, lines: priced },
      }).then(() => {}, () => {});
      await logEvent(r.id, "change", `Change proposed: total $${(bal.totalCents / 100).toFixed(2)} → $${(totals.totalAfter / 100).toFixed(2)}`, true);
      const token = await rotate();
      await Mail.changeProposed(r, c, priced, token);
      await refreshBalance(r.id);
      return json({ ok: true, token });
    }

    if (b.action === "cancel_change" || b.action === "resend_change") {
      const { data: c } = await admin.from("email_setup_change_sets").select("*").eq("id", b.change_set_id).eq("request_id", r.id).maybeSingle();
      if (!c) return json({ error: "Not found." }, 404);
      if (!["proposed", "approved"].includes(c.status)) return json({ error: "Only unpaid changes can be changed." }, 409);
      if (b.action === "cancel_change") {
        if (c.stripe_session_id) { try { await (await import("../_shared/stripe.ts")).stripe.checkout.sessions.expire(c.stripe_session_id); } catch { /* already closed */ } }
        await admin.from("email_setup_change_sets").update({ status: "canceled", canceled_at: new Date().toISOString() }).eq("id", c.id).in("status", ["proposed", "approved"]);
        await admin.from("email_setup_requests").update({ service_status: "awaiting_review" }).eq("id", r.id);
        await logEvent(r.id, "change", "Proposed change withdrawn", true);
        await refreshBalance(r.id);
        return json({ ok: true });
      }
      const next = { ...c, sent_count: c.sent_count + 1 };
      await admin.from("email_setup_change_sets").update({ sent_count: next.sent_count }).eq("id", c.id);
      const { data: lines } = await admin.from("email_setup_adjustments").select("*").eq("change_set_id", c.id);
      const token = await rotate();
      await Mail.changeProposed(r, next, lines ?? [], token);
      await logEvent(r.id, "change", "Change request re-sent");
      return json({ ok: true, token });
    }

    // set_status
    const bal = await refreshBalance(r.id);
    if (["ready_for_setup", "in_progress", "testing", "completed"].includes(b.status) && bal.netPaidCents <= 0) {
      return json({ error: "This request hasn't been paid yet." }, 409);
    }
    if (b.status === "completed" && bal.balanceCents > 0) return json({ error: "There's still a balance due." }, 409);
    if (b.status === "awaiting_customer" && !b.message) return json({ error: "Add a message telling the customer what's needed." }, 400);

    const patch: Record<string, unknown> = { service_status: b.status };
    if (b.status === "awaiting_customer") patch.customer_action_message = b.message;
    if (b.status === "completed") {
      patch.completed_at = new Date().toISOString();
      patch.completion_record = { completed_by: user.id, checklist: r.checklist, at: patch.completed_at, total_cents: bal.totalCents, paid_cents: bal.netPaidCents };
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
