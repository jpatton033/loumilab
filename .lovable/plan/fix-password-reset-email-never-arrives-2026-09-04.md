# Fix: password reset email never arrives

## What's wrong

Your sender domain (notify.loumilab.com) is verified and the branded reset email is in place, but the piece that actually queues and sends the message was never created. Every reset request is being accepted, then dropped at the last step with an internal "cannot queue this email" error. The logs show five such attempts for your address this evening, plus one rejection for requesting again too quickly.

Verified just now: none of the email sending/queue pieces exist in the backend, which matches the errors exactly.

## Fix

1. Create the email sending infrastructure for this project — the send queue, delivery log, bounce/unsubscribe handling, and the recurring job that actually pushes queued emails out.
2. Redeploy the account-email handler so it connects to the newly created queue.
3. Request a password reset for your address and confirm the branded Loumilab email arrives from no-reply, that the button opens the set-password screen, and that the delivery log shows it as sent.
4. If the retry is refused for requesting too often, raise the hourly account-email limit to a normal level and retry.

No changes to the email design or your app's own emails — those already work.

## Technical notes

- `public.enqueue_email` and the `email_*` tables are absent (`select proname from pg_proc` returned nothing), so `auth-email-hook` fails with `PGRST202` after rendering. Fix is `email_domain--setup_email_infra` (creates pgmq queues `auth_emails`/`transactional_emails`, RPC wrappers, `email_send_log`, `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens`, `process-email-queue`, Vault secret, on-demand pg_cron) — never hand-written SQL.
- Then `supabase--deploy_edge_functions` for `auth-email-hook`.
- Verify via `email_send_log` status rows for `template_name = 'recovery'`.
- `rate_limit_email_sent` via `supabase--configure_auth` only if the 429 `over_email_send_rate_limit` recurs.
- After going live, publish once so the Live instance provisions its own queue cron.
