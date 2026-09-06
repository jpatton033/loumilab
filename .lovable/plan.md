# Stop Loumilab emails landing in junk

## What I found

Loumilab currently sends from two different addresses through two different services, and only one of them is fully set up:

- Account emails (password reset, sign-in) go out from `no-reply@notify.loumilab.com` through Lovable's own sending, which is verified and signed correctly. Its policy record is set to "monitor only", the weakest setting, and the address is new, so Apple has little history to trust.
- Contact form, custom-project and order emails go out from `no-reply@loumilab.com` through Maileroo — your main domain, which is also your Zoho mailbox domain. That domain's policy is set to the strictest possible setting (reject, with strict matching on both checks). Strict matching is very easy to fail for mail sent by an outside service, and anything that fails gets treated as forged — exactly the behaviour Apple/iCloud punishes hardest.
- Your main domain's policy record also has a stray leftover entry ("loumilab email") sitting next to the real one.

Splitting mail across two sender addresses also splits the trust Apple builds up, so neither address earns a good reputation.

## The fix

**1. Send everything from one properly signed address**

Move the contact form, custom-project and order/merchant emails onto the same verified Loumilab sending setup already used for password resets, so every Loumilab email is signed by a domain that is correctly configured and delegated. Same wording, same design, same sender name "Loumilab" — replies still go to `hello@loumilab.com`. This also adds a proper unsubscribe header, which Apple and Gmail both look for.

**2. Tighten the policy record for the sending address**

Move `notify.loumilab.com` from "monitor only" to a real enforcing policy with relaxed matching, so Apple sees a domain that states and enforces its rules.

**3. Two small changes you make at your domain provider**

- Remove the stray `loumilab email` text entry under `_dmarc.loumilab.com`.
- Relax the strict matching flags on the main domain's policy so legitimate mail sent on your behalf is not judged as forged. I'll give you the exact one-line record to paste.

**4. Message hygiene**

Every email gets a real plain-text version alongside the HTML, a meaningful subject, and no bare "no-reply" dead ends — all things spam filters score.

**5. Verify**

Send one of each (reset, contact form, order confirmation) to your iCloud address and confirm they arrive in the inbox rather than junk, and that the delivery log shows them accepted.

## Technical notes

Verified by DNS lookup just now:
- `loumilab.com` TXT: `v=spf1 include:zohomail.com include:_spf.maileroo.com ~all`; DKIM present at `loumilab._domainkey`.
- `_dmarc.loumilab.com`: `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` **plus** a second TXT `loumilab email`. `aspf=s` cannot pass for Maileroo's return-path, so alignment rests entirely on DKIM; any drift fails under `p=reject`.
- `notify.loumilab.com`: SPF `include:mailgun.org`, MX mailgun, `_dmarc` `p=none` — verified and delegated to `ns3/ns4.lovable.cloud`.
- Recommended replacement for `_dmarc.loumilab.com` (single TXT): `v=DMARC1; p=reject; sp=reject; adkim=r; aspf=r; rua=mailto:dmarcreports@loumilab.com`.

Code work:
- Scaffold the managed transactional template registry and send helper, then convert the three Maileroo senders to it: `supabase/functions/send-contact-email/index.ts`, `supabase/functions/send-custom-project-lead/index.ts`, and `supabase/functions/_shared/notify.ts` (used by `_shared/order-complete.ts` and `orders-merchant-welcome`). Existing HTML/copy is re-authored as registered templates; sender becomes `Loumilab <no-reply@notify.loumilab.com>` with `reply_to: hello@loumilab.com`.
- `_shared/ops-brief/email.ts` (daily brief) converts the same way for consistency, keeping "Loumilab Operations" as display name.
- Add `text` alongside `html` for every template.
- Deploy the affected functions afterwards; no schema changes, no new secrets. `MAILEROO_API_KEY` is left in place until delivery is confirmed, then can be removed.
