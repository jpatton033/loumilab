import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";
import { admin } from "../_shared/auth.ts";
import { stripe, stripeConfigured } from "../_shared/stripe.ts";
import { priceEmailSetup, PACKAGE_LABELS } from "../_shared/emailSetupPricing.ts";
import { logEvent, Mail, newToken, refreshBalance, sha256Hex, SITE, thirdPartySnapshot } from "../_shared/emailSetup.ts";

/** Public Business Email & Domain Setup: submit intake, start checkout, add info. */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const t = (max: number) => z.string().trim().max(max);
const Intake = z.object({
  package: z.enum(["email", "email_domain"]),
  full_name: t(120).min(2),
  business_name: t(160).min(1),
  contact_email: z.string().trim().email().max(255),
  phone: t(40).optional().default(""),
  owns_domain: z.boolean(),
  existing_domain: t(253).optional().default(""),
  registrar_access: z.enum(["yes", "no", "unsure"]),
  desired_domain: t(253).optional().default(""),
  provider: z.enum(["google", "microsoft", "zoho", "help"]),
  primary_address: t(255).optional().default(""),
  mailboxes: z.number().int().min(1).max(100),
  aliases: z.boolean(),
  migration: z.boolean(),
  extra_devices: z.number().int().min(0).max(50),
  standalone_domain: z.boolean().optional().default(false),
  complex_needs: z.boolean().optional().default(false),
  special_requirements: t(2000).optional().default(""),
  notes: t(2000).optional().default(""),
  provider_plan: z.enum(["google_starter", "m365_basic", "exchange_p1", "zoho_lite"]).optional(),
  third_party_ack: z.literal(true),
  website: z.string().max(0).optional(), // honeypot
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("submit"), intake: Intake }),
  z.object({ action: z.literal("checkout"), token: z.string().regex(/^[a-f0-9]{64}$/), origin: z.string().url().max(200).optional() }),
  z.object({ action: z.literal("decide_change"), token: z.string().regex(/^[a-f0-9]{64}$/), change_set_id: z.string().uuid(), approve: z.boolean() }),
  z.object({ action: z.literal("pay_balance"), token: z.string().regex(/^[a-f0-9]{64}$/), change_set_id: z.string().uuid(), origin: z.string().url().max(200).optional() }),
  z.object({ action: z.literal("add_info"), token: z.string().regex(/^[a-f0-9]{64}$/), message: t(3000).min(2) }),
]);

const ORIGINS = ["https://loumilab.com", "https://www.loumilab.com", "https://loumilab.lovable.app", "http://localhost:8080"];
const safeOrigin = (o?: string) => {
  if (!o) return SITE;
  try {
    const u = new URL(o).origin;
    return ORIGINS.includes(u) || /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(u) ? u : SITE;
  } catch { return SITE; }
};

const findByToken = async (token: string) => {
  const { data } = await admin.from("email_setup_requests").select("*").eq("access_token_hash", await sha256Hex(token)).maybeSingle();
  return data;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: "Please check the form and try again.", fields: parsed.error.flatten() }, 400);
    const body = parsed.data;

    const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
    const { data: limited } = await admin.rpc("check_and_increment_rate_limit", { _key: `email_setup:${body.action}:${ip}`, _max_count: 15, _window_seconds: 3600 });
    if (limited === true) return json({ error: "Too many attempts. Please try again later." }, 429);

    if (body.action === "submit") {
      const i = body.intake;
      if (i.website) return json({ ok: true, token: null });
      const price = priceEmailSetup({
        package: i.package, provider: i.provider, mailboxes: i.mailboxes, extraDevices: i.extra_devices,
        standaloneDomain: i.standalone_domain, migration: i.migration, ownsDomain: i.owns_domain,
        registrarAccess: i.registrar_access, complexNeeds: i.complex_needs,
      });
      const token = newToken();
      const snapshot = await thirdPartySnapshot(i.provider, i.provider_plan ?? null, i.mailboxes, i.owns_domain);
      const { data: row, error } = await admin.from("email_setup_requests").insert({
        access_token_hash: await sha256Hex(token),
        package: i.package, full_name: i.full_name, business_name: i.business_name, contact_email: i.contact_email.toLowerCase(),
        phone: i.phone || null, provider: i.provider, primary_address: i.primary_address || null,
        mailboxes: i.mailboxes, extra_devices: i.extra_devices, standalone_domain: i.standalone_domain,
        intake: {
          owns_domain: i.owns_domain, existing_domain: i.existing_domain, registrar_access: i.registrar_access,
          desired_domain: i.desired_domain, aliases: i.aliases, migration: i.migration,
          special_requirements: i.special_requirements, notes: i.notes,
        },
        needs_review: price.needsReview, review_reasons: price.reasons, price_lines: price.lines, total_cents: price.totalCents,
        service_status: price.needsReview ? "awaiting_quote" : "awaiting_payment",
        payment_status: "unpaid",
        provider_plan: i.provider_plan ?? null,
        third_party_snapshot: snapshot,
        third_party_ack_at: new Date().toISOString(),
      }).select("*").single();
      if (error || !row) { console.error(error?.message); return json({ error: "We couldn't save your request. Please try again." }, 500); }
      await logEvent(row.id, "submitted", price.needsReview ? "Submitted for review" : "Submitted — ready for checkout", true);
      if (price.needsReview) await Mail.received(row, token);
      return json({ ok: true, token, request_number: row.request_number, needs_review: price.needsReview });
    }

    const r = await findByToken(body.token);
    if (!r) return json({ error: "We couldn't find this request." }, 404);

    if (body.action === "add_info") {
      await logEvent(r.id, "customer_info", body.message, true);
      await Mail.customerInfo(r);
      return json({ ok: true });
    }

    if (body.action === "decide_change" || body.action === "pay_balance") {
      const { data: c } = await admin.from("email_setup_change_sets").select("*").eq("id", body.change_set_id).eq("request_id", r.id).maybeSingle();
      if (!c) return json({ error: "We couldn't find this change." }, 404);

      if (body.action === "decide_change") {
        if (c.status !== "proposed") return json({ error: "This change has already been answered." }, 409);
        if (!body.approve) {
          await admin.from("email_setup_change_sets").update({ status: "declined", decided_at: new Date().toISOString() }).eq("id", c.id).eq("status", "proposed");
          await admin.from("email_setup_requests").update({ service_status: "awaiting_review" }).eq("id", r.id);
          await logEvent(r.id, "change", "You declined the proposed change", true);
          await Mail.changeDeclined(r);
          return json({ ok: true });
        }
        // Re-check what's been paid at approval time; never trust the earlier figure for money.
        const bal = await refreshBalance(r.id);
        const due = Math.max(0, c.total_after_cents - bal.netPaidCents);
        const credit = Math.max(0, bal.netPaidCents - c.total_after_cents);
        await admin.from("email_setup_change_sets").update({ status: "approved", decided_at: new Date().toISOString(), amount_due_cents: due, credit_cents: credit }).eq("id", c.id).eq("status", "proposed");
        await logEvent(r.id, "change", "You approved the revised scope", true);
        if (due === 0) {
          // Nothing to pay (downgrade, discount or credit): apply right away.
          await admin.from("email_setup_change_sets").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", c.id);
          await admin.from("email_setup_requests").update({
            package: c.package_to, ...(c.mailboxes_to != null ? { mailboxes: c.mailboxes_to } : {}), ...(c.devices_to != null ? { extra_devices: c.devices_to } : {}),
            service_status: bal.netPaidCents > 0 ? "ready_for_setup" : "awaiting_payment",
          }).eq("id", r.id);
          await refreshBalance(r.id);
          await Mail.changeConfirmed(r, { ...c, credit_cents: credit });
          return json({ ok: true, due: 0 });
        }
        await admin.from("email_setup_requests").update({ service_status: "awaiting_payment" }).eq("id", r.id);
        await refreshBalance(r.id);
        return json({ ok: true, due });
      }

      // pay_balance
      if (!stripeConfigured) return json({ error: "Payments are not available right now." }, 503);
      if (c.status !== "approved") return json({ error: c.status === "paid" ? "This change is already paid." : "Please approve the change first." }, 409);
      const bal = await refreshBalance(r.id);
      const amount = Math.max(0, c.total_after_cents - bal.netPaidCents);
      if (amount < 50) return json({ error: "Nothing is due." }, 409);
      if (c.stripe_session_id) {
        try {
          const s = await stripe.checkout.sessions.retrieve(c.stripe_session_id);
          if (s.status === "open" && s.amount_total === amount && s.url) return json({ url: s.url });
          if (s.status === "complete") return json({ error: "Your payment is being confirmed. Refresh in a moment." }, 409);
        } catch { /* new session */ }
      }
      const { data: lines } = await admin.from("email_setup_adjustments").select("label,quantity,amount_cents").eq("change_set_id", c.id);
      const back = `${safeOrigin(body.origin)}/services/business-email/status/${body.token}`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price_data: { currency: "usd", unit_amount: amount, product_data: {
          name: `${r.request_number} — additional setup charges`,
          description: (lines ?? []).map((l) => `${l.label}${l.quantity > 1 ? ` × ${l.quantity}` : ""}`).join(", ").slice(0, 400) || undefined,
        } }, quantity: 1 }],
        customer_email: r.contact_email,
        client_reference_id: r.id,
        metadata: { kind: "email_setup_balance", request_id: r.id, change_set_id: c.id, request_number: r.request_number },
        payment_intent_data: { metadata: { kind: "email_setup_balance", request_id: r.id, change_set_id: c.id }, description: `Loumilab ${r.request_number} additional` },
        success_url: `${back}?paid=1`,
        cancel_url: `${back}?canceled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      }, { idempotencyKey: `email-setup-change-${c.id}-${amount}-${Math.floor(Date.now() / 60000)}` });
      await admin.from("email_setup_change_sets").update({ stripe_session_id: session.id }).eq("id", c.id);
      return json({ url: session.url });
    }

    // checkout
    if (!stripeConfigured) return json({ error: "Payments are not available right now. Please contact hello@loumilab.com." }, 503);
    if (r.payment_status === "paid") return json({ error: "This request is already paid." }, 409);
    if (r.service_status === "canceled") return json({ error: "This request was canceled." }, 409);
    const amount = r.needs_review ? r.quote_cents : r.total_cents;
    if (r.needs_review && (!amount || r.service_status !== "awaiting_payment")) {
      return json({ error: "Your quote isn't ready yet. We'll email you when it is." }, 409);
    }
    if (!amount || amount < 100) return json({ error: "Nothing to pay for this request." }, 409);

    // Reuse an open session so double-clicks never create two payments.
    if (r.stripe_session_id) {
      try {
        const s = await stripe.checkout.sessions.retrieve(r.stripe_session_id);
        if (s.status === "open" && s.amount_total === amount && s.url) return json({ url: s.url });
        if (s.status === "complete") return json({ error: "Your payment is being confirmed. Refresh in a moment." }, 409);
      } catch { /* create a new one */ }
    }

    const origin = safeOrigin(body.origin);
    const back = `${origin}/services/business-email/status/${body.token}`;
    const lineItems = r.needs_review
      ? [{ price_data: { currency: "usd", unit_amount: amount, product_data: { name: `${PACKAGE_LABELS[r.package as "email"]} — custom quote` } }, quantity: 1 }]
      : (r.price_lines as { label: string; cents: number }[]).map((l) => ({
          price_data: { currency: "usd", unit_amount: l.cents, product_data: { name: l.label } }, quantity: 1,
        }));
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: r.contact_email,
      client_reference_id: r.id,
      metadata: { kind: "email_setup", request_id: r.id, request_number: r.request_number },
      payment_intent_data: { metadata: { kind: "email_setup", request_id: r.id }, description: `Loumilab ${r.request_number}` },
      success_url: `${back}?paid=1`,
      cancel_url: `${back}?canceled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    }, { idempotencyKey: `email-setup-${r.id}-${amount}-${Math.floor(Date.now() / 60000)}` });
    await admin.from("email_setup_requests").update({ stripe_session_id: session.id, payment_status: "pending" }).eq("id", r.id).neq("payment_status", "paid");
    return json({ url: session.url });
  } catch (err) {
    console.error("email-setup error", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
