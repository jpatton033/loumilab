# Keep Loumilab mail out of the junk folder

The message arrived, so sending and signing are working. It was filed as junk because the message looks automated to Apple: it comes from a "no-reply" address, the sending address is brand new with no history, and the policy records on loumilab.com are set in a way that hurts rather than helps.

## What I will change in the app

1. **Send from a real address.** Admin messages will go out from `mail@notify.loumilab.com` with your name shown, instead of `no-reply@notify.loumilab.com`. Replies keep going to hello@loumilab.com. Automatic app mail (receipts, password resets, the daily brief) is unchanged.
2. **Keep the branded look** on every message, as you chose.
3. **Retest** with a normal message to your iCloud address and confirm where it lands.

## What you need to do

- In iCloud, open the message that landed in junk, mark it **Not Junk**, and add the sender to your contacts. Do this once for the new `mail@` address too after my retest. This is the strongest single signal to Apple.
- At your domain provider, on `loumilab.com`:
  - Delete the stray text entry named `loumilab email` under `_dmarc.loumilab.com`.
  - Replace the `_dmarc.loumilab.com` record with exactly one entry:
    `v=DMARC1; p=reject; sp=reject; adkim=r; aspf=r; rua=mailto:dmarcreports@loumilab.com`
  The current strict settings there actively work against your sending address.

## What I cannot change

The policy record for `notify.loumilab.com` is managed on Lovable's side, not editable from here. It is currently "monitor only", which is acceptable but not ideal.

## Also worth knowing

New sending addresses take a couple of weeks of normal, low-volume, replied-to mail before providers trust them. Expect the odd junk placement until then, and always reply from the same address rather than starting fresh threads.

## Technical notes

- `supabase/functions/_shared/managed-email.ts`: add an optional `fromAddress` to `ManagedEmailParams` (default `no-reply`), used in the `from:` header; `REPLY_TO` unchanged.
- `supabase/functions/admin-email-send/index.ts`: pass `fromAddress: "mail"` and keep the existing per-message display name.
- Redeploy `admin-email-send`; send one verification message and check the row in `admin_email_messages` plus the email delivery log.
