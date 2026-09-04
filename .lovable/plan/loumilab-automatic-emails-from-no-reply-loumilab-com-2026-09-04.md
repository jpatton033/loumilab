# Loumilab automatic emails from no-reply@loumilab.com

## Where things stand

- The password reset email is still the platform default: it is not branded and does not come from a Loumilab address, because no sender domain has been registered for this project yet.
- Your own app emails already send through Maileroo. The daily operations brief and merchant welcome already come from `no-reply@loumilab.com`, but the contact-form and custom-project emails send from `hello@loumilab.com`.

## What I'll do

**1. Register the Loumilab sender domain**
I'll open the email setup step for you to complete once. This registers Loumilab as the sender and gives you the DNS records to add at your domain provider. Until those verify, reset emails keep using the default sender and then switch over automatically — nothing breaks in the meantime.

**2. Brand the reset email (and the rest of the account emails)**
Create the six account emails — password reset, sign-up confirmation, sign-in link, invitation, email change, and re-authentication — and style them to Loumilab:
- White email background, charcoal text, blue accent used sparingly.
- LOUMILAB wordmark with the blue accent period at the top.
- One clear action button matching the site's rounded style, short Loumilab-voice copy.
- Reset email focused on a single "Set your password" button, with the expiry note and a plain fallback link.
- Footer with the Loumilab name and a line saying the message was sent automatically and isn't monitored.

**3. Send everything automatic from no-reply@loumilab.com**
- Account emails send from `no-reply@loumilab.com` with the display name "Loumilab".
- Switch the contact-form and custom-project emails to the same sender, with replies still going to `hello@loumilab.com` so nothing gets lost.
- The daily brief and merchant welcome already use it; I'll confirm they stay consistent.

**4. Verify**
Request a password reset for your address and confirm the branded email arrives, the button opens the set-password screen, and the sender reads Loumilab.

## Technical notes

- `email_domain--check_email_domain_status` reports no domain and setup `not_started`, so the setup dialog runs first; scaffolding does not wait on DNS.
- `email_domain--scaffold_auth_email_templates` generates `supabase/functions/auth-email-hook/` plus the six templates in `supabase/functions/_shared/email-templates/`; templates are then restyled to the light Loumilab tokens. Hook deployed afterwards.
- Sender change in `supabase/functions/send-contact-email/index.ts` and `send-custom-project-lead/index.ts`: `fromAddress` becomes `no-reply@loumilab.com` with `reply_to` set to the submitter (notification copy) and `hello@loumilab.com` (confirmation copy). `_shared/notify.ts` and `_shared/ops-brief/email.ts` already use `no-reply@loumilab.com`. Both functions redeployed.
- If reset testing trips the hourly auth-email cap, raise `rate_limit_email_sent`.
- No schema changes.
