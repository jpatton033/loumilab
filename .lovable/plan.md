# Loumilab Mail — a branded email desk inside the Super Admin portal

A new **Mail** area in the admin portal where you write, format and send Loumilab-branded email, keep a full sent history with delivery status, and reuse saved templates and your signature. The writing surface is the same Word-style editor family used in Vurtti (toolbar, fonts, colors, tables, images, find & replace).

## What it looks like

```text
+----------------------+---------------------------------------------+
| LOUMILAB.  Admin     |  Mail                         [New message] |
|                      |---------------------------------------------|
| ...                  |  Sent | Drafts | Templates | Signature      |
| Mail            (2)  |---------------------------------------------|
|  - Compose           |  To: [type an address / pick a contact]     |
|  - Sent              |  Cc / Bcc          Subject: ...             |
|  - Templates         |  [B I U  A^ font size  color  = = =  list ] |
| ...                  |  [ link  image  table  undo  find  clean  ] |
|                      |  +---------------------------------------+  |
|                      |  |  LOUMILAB.                            |  |
|                      |  |  Your writing, inside the brand frame |  |
|                      |  +---------------------------------------+  |
|                      |  Attachments: proposal.pdf (1.2 MB)         |
|                      |  [Save draft]  [Preview]  [Send]            |
+----------------------+---------------------------------------------+
```

## Composing and sending

- Full rich-text editor: bold, italic, underline, strike, headings, font family and size, text color and highlight, alignment, bullet/numbered/check lists, quotes, horizontal rule, links, inline images, tables (insert, add/remove rows and columns, header row), undo/redo, clear formatting, find & replace, character count, full-screen writing mode.
- Every message is automatically wrapped in the Loumilab branded frame — wordmark header, blue accent, standard footer, and a plain-text version generated alongside the HTML so filters and text-only clients are happy.
- Attachments and inline images upload to a private admin bucket; total attachment size capped (25 MB) with clear feedback.
- Recipients: type any address into To / Cc / Bcc, or pick from a searchable picker backed by contact form inquiries, Loumilab Orders merchants, and newsletter subscribers. Multiple recipients supported.
- Bulk sends (for example the whole subscriber list) send one personalised copy per recipient with `{{first_name}}` / `{{email}}` merge fields, queued and rate-paced so delivery stays clean, with per-recipient success/failure shown afterwards.
- Drafts autosave. Preview shows exactly what lands in the inbox, on desktop and phone widths.

## Templates and signature

- Saved templates: name, subject, body, optional category. Start a message from a template, or save the current message as one.
- One signature stored per admin user, appended automatically with a toggle to leave it off.
- Sending address stays your verified Loumilab sending domain with replies directed to `hello@loumilab.com`; sender display name is editable per message (e.g. "Loumilab" or "Loumilab Support").

## Sent history and delivery status

- Sent tab: recipient, subject, who sent it, date, and delivery state (queued, delivered, opened where available, bounced, suppressed) using Lovable's delivery events. Open any sent message to read exactly what was sent, resend it, or start a follow-up.
- Suppression-aware: addresses that have bounced or unsubscribed are flagged in the recipient field before you send.
- Every send is written to the existing audit log.

## Receiving replies — needs one decision from you

Lovable's email sending cannot receive mail; replies arrive in whichever real mailbox owns the address. `hello@loumilab.com` is on Zoho today, and Zoho has no ready-made Loumilab connection. So the inbox side can be built one of two ways:

- **A — Move the reply mailbox to Microsoft 365 or Gmail.** Both have ready connections, so the portal can then show a real threaded inbox (read, reply in the same branded editor, unread counts, reply attached to the original message) with no custom credentials. Cleanest and cheapest.
- **B — Keep Zoho.** Requires creating an API application in your Zoho account and giving Loumilab its credentials; more setup, and the connection has to be maintained by us.

I'd build the send side and history first (that's everything above, and it stands on its own), then add the inbox once you pick A or B. Tell me which and I'll fold it into the same Mail area — the Sent/Inbox tabs and thread view are designed for it from the start.

## Technical notes

- Editor: add the Tiptap stack used in Vurtti's `RichTextEditor` (starter kit plus underline, text-style, color, highlight, font-family, text-align, link, image, table set, task list, sub/superscript, placeholder, character-count, typography) with local FontSize/LineHeight extensions; new `src/components/admin/mail/MailEditor.tsx` plus a ported `FindReplaceDialog`. HTML output is sanitised and inlined into the branded email frame at send time.
- Data (one migration, RLS staff-only via existing `is_staff(auth.uid())`, with GRANTs): `admin_email_messages` (direction, to/cc/bcc arrays, subject, body_html, body_text, status, provider_message_id, sent_by, template_id, thread_id, timestamps), `admin_email_attachments` (message_id, storage path, filename, size, content type), `admin_email_templates` (name, subject, body_html, category), `admin_email_signatures` (user_id unique, body_html). Private storage bucket `admin-email` with staff-only policies.
- Sending: new edge function `admin-email-send` — verifies the caller's session and staff role, validates and caps input (recipient count, body size, attachment total), renders the branded frame server-side, and sends through the existing `_shared/managed-email.ts` path (`notify.loumilab.com`, reply-to `hello@loumilab.com`), writing one row per recipient with status. Bulk sends chunk with a short pacing delay.
- Delivery status: scaffold the email events receiver so provider events (delivered, bounced, complained) update `admin_email_messages.status`.
- Frontend: `/admin/mail` (Compose / Sent / Drafts / Templates / Signature) added to `adminNav.ts` under a new "Mail" group with an unread/failed badge, rendered in `AdminShell`, queries in `src/lib/admin/mail.ts`, `noindex` via `SEOHead`. Recipient picker reads `contact_submissions`, `merchants`, `newsletter_subscribers`.
- No new third-party service and no new recurring cost on the send side.

## Out of scope for now

Scheduled sends, campaign analytics dashboards, and multi-mailbox shared assignment/ownership.
