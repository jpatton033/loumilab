

## Add Email Notifications via Maileroo

### Overview
Create a backend function that sends emails through the Maileroo API when someone submits the contact form. Two emails will be sent: a notification to LOUMILAB and a confirmation to the submitter.

### Prerequisites
A **Maileroo API key** (sending key) is required. You can get one by:
1. Signing up at maileroo.com
2. Adding and verifying your domain (loumilab.com)
3. Creating a sending key under the Email API > Sending Keys section

I'll securely store this key for you when we proceed.

### Steps

**1. Store the Maileroo API key**
- Securely save your Maileroo sending key as a backend secret (`MAILEROO_API_KEY`)

**2. Create backend function `send-contact-email`**
- Calls Maileroo's API (`POST https://smtp.maileroo.com/api/v2/emails`) to send two emails:
  - **Notification to LOUMILAB** (hello@loumilab.com): Contains the submitter's name, email, company, and message
  - **Confirmation to the client**: A branded "thank you" email confirming receipt
- Sends from `hello@loumilab.com` (requires domain verification in Maileroo)
- Public endpoint (no auth required) since it's triggered by the contact form
- Includes proper error handling and CORS headers

**3. Update the Contact page**
- After the successful database insert, call the backend function with the form data
- Email failures are handled gracefully -- the submission is still saved even if email delivery fails
- User sees the same success toast regardless (emails are best-effort)

### Technical Details

- **New file**: `supabase/functions/send-contact-email/index.ts`
- **Config update**: `supabase/config.toml` -- add `[functions.send-contact-email]` with `verify_jwt = false`
- **Modified file**: `src/pages/Contact.tsx` -- add edge function call after line 58 (after successful DB insert)
- **Maileroo endpoint**: `POST https://smtp.maileroo.com/api/v2/emails` with `X-Mailing-Key` header for auth
- **Secret needed**: `MAILEROO_API_KEY`

