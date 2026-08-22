# Loumilab Email Templates — Vurtti-Style Redesign

Restyle the automatic contact-form emails (the internal "new inquiry" notification and the visitor confirmation) so they match the structured, premium look used by Vurtti — while keeping Loumilab's own brand colors and wordmark.

## What the new emails look like

A single shared layout, applied to both emails:

```text
+----------------------------------------+
|            LOUMILAB.                   |  <- dark charcoal header bar,
|   DESIGN. BUILD. INNOVATE. SECURE.     |     wordmark + tagline, blue accent period
+----------------------------------------+
|                                        |
|  Heading                               |
|  Body copy / labeled details           |
|  [ Button ]                            |
|  ---------------------------------     |
|  Small closing note                    |
+----------------------------------------+
|   (c) Loumilab · loumilab.com          |  <- soft grey footer bar
+----------------------------------------+
```

- 560px centered card, hairline border, rounded corners, generous padding.
- Charcoal text, muted grey secondary text, blue accent for links and the wordmark period.
- Web-safe stack with Arial fallback (email clients can't load Space Grotesk reliably).

### Notification email (to hello@loumilab.com)
Header bar, "New project inquiry" heading, clean label/value rows for name, email and company, the message in a soft grey panel, and a "Reply to {name}" button that opens a mailto reply.

### Confirmation email (to the visitor)
Header bar, "Thanks, {name}" heading, a short line confirming a reply within 24 hours, the submitted message echoed in the soft panel, a "Visit Loumilab" button, and a signed-off closing plus footer bar.

## Technical notes

- Both templates live in `supabase/functions/send-contact-email/index.ts`. Extract a shared `renderShell({ preview, heading, body })` helper plus a small style token object (mirroring Vurtti's `_shell.tsx` approach) so both emails share one layout, then rebuild the two bodies with it.
- Keep all existing behaviour untouched: rate limiting, IP handling, DB lookup of the submission, HTML escaping of every interpolated value, Maileroo send calls, and response codes.
- Subjects: keep the internal one as "New inquiry from {name}"; confirmation becomes "We received your message — Loumilab".
- Redeploy the `send-contact-email` function after the edit so the new templates take effect.
- No auth emails exist in this project (admin login is password-only, no signup flow), so nothing else needs restyling.
