# The Loumilab Mail message left, iCloud didn't keep it

## What I found

Your message went out and was accepted. Verified just now:

- The message "Test!!! Test!!!" to jpatton033@icloud.com was recorded as sent at 11:00 AM your time, with no error.
- Lovable's delivery log shows the same send accepted by the mail provider. No bounce, no rejection, no block.
- That address is not suppressed or unsubscribed.
- Your sending domain notify.loumilab.com is verified and correctly signed.

So nothing in the app failed. Apple accepted it and then filed it somewhere you can't see, or discarded it silently — which iCloud does quietly, without a bounce. Two things make that very likely here:

1. **The subject was "Test!!! Test!!!"** — repeated words plus multiple exclamation marks is one of the strongest junk signals there is, on a very short message with almost no content. Apple treats this harshly from a young sending address.
2. **Your sending address still has no enforced email policy.** `notify.loumilab.com` publishes "monitor only", the weakest setting, so Apple has no reason to trust it. Your main domain's policy record also still has the stray leftover entry and the over-strict matching flags I flagged earlier — those were never changed at your domain provider.

## The fix

**1. Strengthen the sending address's reputation**

Move `notify.loumilab.com` to a real enforcing policy with relaxed matching, so Apple sees a domain that states and enforces its rules instead of one that shrugs.

**2. Two changes you make at your domain provider**

- Remove the stray `loumilab email` text entry under `_dmarc.loumilab.com`.
- Relax the strict matching flags on the main domain's policy so legitimate mail sent for you isn't judged as forged. I'll give you the exact one-line record to paste.

**3. Make Loumilab Mail messages harder to junk**

- Warn you in the composer before sending when the subject or body looks like junk bait (repeated exclamation marks, ALL CAPS, one-or-two-word bodies), with a one-click "send anyway".
- Ensure every message carries a proper plain-text version, a real reply-to, and an unsubscribe header — the things Apple and Gmail score.

**4. Retest properly**

Send a normal, realistic message (ordinary subject, a few real sentences) to your iCloud address and to a Gmail address, then confirm both arrive in the inbox. If iCloud still swallows a well-formed message, the remaining lever is warming the address up with low steady volume, and I'll say so plainly rather than keep changing code.

## Technical notes

- Confirmed: `admin_email_messages` row 306fe6ca status `sent`, no `error_text`, body 2,074 chars; delivery log event `sent` at 2026-09-21T15:00:15Z with a `notify.loumilab.com` message id; suppression check clean; domain status verified with NS delegation to ns3/ns4.lovable.cloud.
- DNS as it stands now: `_dmarc.notify.loumilab.com` = `v=DMARC1; p=none`; `_dmarc.loumilab.com` = `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` plus a second stray TXT `loumilab email`.
- Recommended replacement for `_dmarc.notify.loumilab.com`: `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarcreports@loumilab.com`.
- Recommended single TXT for `_dmarc.loumilab.com`: `v=DMARC1; p=reject; sp=reject; adkim=r; aspf=r; rua=mailto:dmarcreports@loumilab.com`.
- Composer guard is frontend-only in `src/pages/admin/Mail.tsx` (pre-send check on subject/body text), no schema change.
- `sendManagedEmail` in `supabase/functions/_shared/managed-email.ts` already derives `text` from the HTML and sets `reply_to`; confirm `admin-email-send` passes a real text part rather than relying on the fallback for editor HTML, and redeploy that function if changed.
