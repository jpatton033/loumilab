# Fix password-reset delivery and the blank reset flow

## Confirmed findings

- `notify.loumilab.com` is verified and account emails are enabled.
- The four recent reset emails to your iCloud address were accepted for delivery; there are no bounce, suppression, rejection, or rate-limit events.
- The live `/reset-password` page itself returns normally and renders without browser errors when opened directly. The failure is therefore specific to the one-time link handoff, not a generally broken page.
- The current sender is `noreply@notify.loumilab.com`. Since delivery is delegated through `notify.loumilab.com`, that verified subdomain must remain the sending domain.

## Changes

1. **Prevent email scanners from consuming the reset link**
   - Change the reset email button so it first opens Loumilab’s reset page with the one-time account link safely carried as data.
   - Show a clear “Continue to reset password” action before the account link is redeemed. Mail-provider previews can load the page without spending the one-time link; only the person’s click completes the handoff.
   - Keep support for existing code, token, and session link formats.

2. **Make blank states impossible**
   - Add a strict timeout and error fallback to the reset-page verification flow.
   - Every outcome will render a visible state: continue, verifying, set password, or request a fresh link.
   - Clear consumed credentials from the address bar after verification.

3. **Improve inbox placement without changing providers**
   - Standardize the visible sender as `Loumilab <no-reply@notify.loumilab.com>`.
   - Tighten the subject, preview text, and reset copy so it reads as a direct security notification, with one primary action and less repeated-link content.
   - Keep the established Loumilab design and verified sending domain. Inbox placement cannot be guaranteed by code—iCloud also scores a new domain’s sending reputation—but these changes remove avoidable spam signals.

4. **Deploy and verify end to end**
   - Redeploy the account-email handler.
   - Request one fresh reset email, confirm the delivery event is accepted, open the newest message, use the deliberate continue step, verify the password form appears, and confirm a new password can be saved.
   - Check both desktop and mobile-sized browser views and ensure no blank screen or uncaught browser error occurs.

## Technical notes

- Update the recovery-link rendering in the account-email handler/template and harden `ResetPassword` state handling.
- No database changes and no third-party email service changes.
- Previously issued reset links remain unchanged; verification must use a newly generated email after deployment.
