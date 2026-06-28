## Root cause

The red toast on "Send Message" is the `"Something went wrong"` branch in `src/pages/Contact.tsx` — it fires when the Supabase `insert(...).select("id").single()` call returns an error or no row.

Checking the database directly:

- The last successful row in `contact_submissions` is from **Feb 24** — nothing from today, even though you just submitted. So the **insert itself is being rejected**, the form isn't even reaching the email step.
- `contact_submissions` has RLS policies ("Anyone can submit contact form" for INSERT, admin-only for SELECT), but **no table-level `GRANT`s exist for `anon` or `authenticated`** (confirmed via `information_schema.role_table_grants` — empty result).
- Without `GRANT INSERT`, PostgREST rejects the request before RLS is even evaluated, returning a permission error. RLS policies alone are not enough — this is the exact failure mode called out in the platform's public-schema-grants rule.

Old rows exist because grants used to be applied by default on older projects; a recent platform/migration change dropped them on this table.

Secondary issue: even after granting INSERT, the current client code does `.insert(...).select("id").single()`. The SELECT policy only allows admins to read rows, so the returned row would be filtered out and `inserted` would still be `null`, re-triggering the same red toast.

## Fix

Two coordinated changes:

### 1. Migration: restore grants

```sql
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT ALL    ON public.contact_submissions TO service_role;
```

No new SELECT policy for anon — admins remain the only readers, which preserves privacy of submissions.

### 2. Stop selecting the row back on the client

Refactor `src/pages/Contact.tsx` so it does NOT chain `.select("id").single()` after insert (which RLS will always filter to null for anon). Instead:

- `insert(...)` only — check `error` only, no row read needed.
- Drop the `submission_id` lookup pattern in the edge function. Update `send-contact-email` to accept the **most recent submission for the given email within the last 60 seconds** as the source of truth (still server-verified, still not an open relay, still protected by the per-email rate-limit trigger that caps at 3/hour/email).
- Client calls `supabase.functions.invoke("send-contact-email", { body: { email: result.data.email } })`.

This keeps the existing security model (edge function never trusts client-supplied content; it re-reads the canonical row from the DB) while removing the RLS/grant coupling that's currently breaking the flow.

## Files touched

- `supabase/migrations/<new>.sql` — grants above.
- `src/pages/Contact.tsx` — remove `.select("id").single()`, pass `email` instead of `submission_id` to the function, keep all validation/honeypot/rate-limit logic.
- `supabase/functions/send-contact-email/index.ts` — accept `{ email }`, look up newest matching row within the last 60s, return 404 if none, otherwise unchanged (same Maileroo sends, same HTML, same per-IP rate limit).

## Verification

After the change:
1. Submit the form from the live site → expect green "Message sent!" toast.
2. Confirm a new row appears in `contact_submissions`.
3. Confirm Maileroo logs show two sends (notification to `hello@loumilab.com`, confirmation to submitter).
4. Re-submitting 4× in an hour from the same email should hit the existing trigger-based rate limit (expected behavior, not a regression).

## What I'm NOT doing

- Not touching Maileroo / DNS / Zoho — that path is already verified working (last "delivered" was confirmed green).
- Not switching to Lovable Emails.
- Not relaxing the admin-only SELECT policy on submissions.
