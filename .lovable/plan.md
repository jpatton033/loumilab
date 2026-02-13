

## Fix Maileroo Email Integration (3 Bugs)

The contact form emails are failing with a **404 error** because the edge function is using an outdated/incorrect Maileroo API format. There are three issues to fix, all in one file.

### What's Wrong

The `send-contact-email` function has three incorrect settings:

1. **Wrong API URL** -- currently `https://smtp.maileroo.com/v1/email/send`, should be `https://smtp.maileroo.com/api/v2/emails`
2. **Wrong authentication header** -- currently `X-Mailing-Key`, should be `X-Api-Key`
3. **Wrong request body format** -- currently sending `from` and `to` as plain strings, but Maileroo expects structured objects like `{ "address": "hello@loumilab.com", "display_name": "LOUMILAB" }`

### What Will Change

Only one file needs updating: `supabase/functions/send-contact-email/index.ts`

The `sendEmail` function will be updated to:
- Use the correct endpoint URL
- Use the correct `X-Api-Key` header
- Format `from` and `to` as EmailObject structures with `address` and optional `display_name` fields

### After the Fix

Once deployed, the contact form will:
- Send a notification email to hello@loumilab.com with submission details
- Send a confirmation email to the person who submitted the form

### Prerequisites

Make sure your domain (`loumilab.com`) is verified in your Maileroo dashboard so emails can be sent from `hello@loumilab.com`.

### Technical Details

Changes to `supabase/functions/send-contact-email/index.ts`, lines 24-46 (the `sendEmail` function):

- Line 25: URL from `https://smtp.maileroo.com/v1/email/send` to `https://smtp.maileroo.com/api/v2/emails`
- Line 28: Header from `"X-Mailing-Key"` to `"X-Api-Key"`
- Lines 31-35: Body restructured from flat `{ from, to, subject, html }` to `{ from: { address: from }, to: { address: to }, subject, html }`

