# Password Reset from no-reply@loumilab.com

## Goal
Make the "Forgot password" flow send a branded reset email from `no-reply@loumilab.com`, and harden the reset page so the emailed link reliably lands users on a working "set new password" screen.

## What exists today
- `/login` (admin) and `/sign-in` (customers) both call the password-reset request with a redirect to `/reset-password`.
- `/reset-password` exists and updates the password once a recovery session is present.
- No email sender domain is configured for the project, so reset emails currently go out from the default platform sender, not Loumilab.

## Steps

### 1. Configure the Loumilab sender domain
Open the email setup dialog and register `loumilab.com` with sender `no-reply@loumilab.com`. This adds DNS records (SPF/DKIM/return-path) that you confirm at your DNS provider. Reset emails keep using the default sender until DNS verifies, then automatically switch over.

### 2. Scaffold branded auth email templates
Generate the managed auth email templates (password reset, signup confirmation, magic link, invite, email change, reauthentication) plus the auth email hook, then restyle them to the Loumilab light identity:
- Charcoal headings, blue accent, Space Grotesk-with-fallback stack, rounded button matching site radius.
- LOUMILAB wordmark with blue accent period at the top, white email body background.
- Copy tuned to Loumilab voice, reset email focused on a single "Set your password" button.

### 3. Deploy the hook
Deploy the auth email hook so the recovery email routes through the branded template.

### 4. Tighten the reset page
- Handle the recovery link's token exchange explicitly so arriving from email always unlocks the form (covers both hash-token and code-based links) and shows a clear "link expired or invalid" state with a link back to request a new one.
- Keep the 10-character minimum, confirm-match check, and success toast.
- After saving, route admins to `/login` and customers to `/sign-in` rather than always `/login`.
- Set the reset redirect target to an absolute site URL so links from email work regardless of where they were requested.

### 5. Verify
Request a reset for the admin address, confirm the email arrives from the Loumilab sender once DNS is verified, open the link, set a password, and sign in.

## Technical notes
- Templates land in `supabase/functions/_shared/email-templates/` with the hook at `supabase/functions/auth-email-hook/`; the hook name is fixed by the platform contract.
- `src/pages/ResetPassword.tsx` gains explicit `exchangeCodeForSession` / `verifyOtp` handling plus error state; `src/pages/Login.tsx` and `src/pages/SignIn.tsx` only change their redirect target.
- Auth email rate limits may need raising if reset testing hits the hourly cap.
