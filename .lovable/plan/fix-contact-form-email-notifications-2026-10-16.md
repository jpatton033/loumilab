# Fix contact form email notifications

## What's wrong
The contact form still saves every message (both of your tests today were saved). The emails never go out because of a bug in how each message is labeled before sending. Each email gets a "don't send this twice" tag, and that tag should be unique per message. The message ID was never loaded, so every message got the same tag: "undefined". The email service had already seen that tag once, so it quietly dropped every message after that, both the alert to hello@loumilab.com and the "we received your message" reply.

## The fix
- Load the message ID when building the email, so each message gets its own tag.
- If the ID is ever missing, refuse to send and log an error instead of reusing a tag that gets dropped.
- Redeploy the contact email function, send one test through the form, and check the delivery log shows both emails sent.

## Messages you may have missed
All contact form messages are saved. Apart from your own tests, there is only one real inquiry:
- Tim Patton (timothy.pattonjr1@gmail.com), Feb 24, 2026: "Getting money"

All other messages since February are tests from jpatton033@icloud.com, including today's "Tester Rob" and "James W". These messages also appear under Inquiries in the admin area. After the fix, I can resend the alert for the Tim Patton message to hello@loumilab.com if you'd like.

## Technical details
- `supabase/functions/send-contact-email/index.ts`: add `id` to the `contact_submissions` select. Without it, `submission.id` was undefined, so the idempotency keys were `contact-notify-undefined` and `contact-confirm-undefined`. Return 500 if `id` is missing.
- Deploy `send-contact-email` and verify with `list_email_logs`.
