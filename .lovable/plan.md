# Fix: the "Set a new password" page doesn't load

## What's happening

The reset link in the email sends people to the `loumilab.lovable.app` address first. I confirmed that address immediately bounces visitors to `loumilab.com` — and that bounce strips the private part of the link that carries the sign-in proof. So by the time the page opens on loumilab.com there's nothing left to unlock the form, and it either sits on "Verifying your reset link…" or shows the expired-link message.

The sign-in records also show the link being opened twice, with the second attempt rejected as already used. That's typical of mail apps pre-opening links, and it burns a one-time reset link before the person clicks it.

## What I'll do

1. **Send reset links to the real site address.** Both the customer sign-in page and the admin login page will request the reset with the absolute `https://loumilab.com/reset-password` address in production instead of whatever address the person happened to be on, so the link never routes through the redirecting address. Local and preview use keeps working as it does today.

2. **Make the reset page survive a stripped link.** If the page opens with no usable proof, it will first check whether a recovery sign-in already exists before declaring the link invalid, and only then show the clear "link expired or invalid" screen with a button to request a new one. Add a short explanatory line telling people to open the newest email and, if their mail app previews links, to copy the link into their browser.

3. **Use a link format that survives mail-app previews.** Switch the reset email to the token-style link the reset page already understands, so the proof is carried in the normal part of the address (which survives redirects) rather than the fragment that gets dropped.

4. **Verify end-to-end.** Request a reset for your address, open the email, confirm the page loads the password form, set a password, and sign in.

## Notes

- No database or design changes; the branded Loumilab email styling stays exactly as it is.
- Files touched: `src/pages/SignIn.tsx`, `src/pages/Login.tsx`, `src/pages/ResetPassword.tsx`, and the recovery email template/hook if step 3 requires it (followed by a redeploy of that hook).
- Publishing is needed for the live site to pick this up.
