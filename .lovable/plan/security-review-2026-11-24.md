# Security review

## Status
- Quick database check: no new issues. The only 4 findings were already dismissed by you earlier (contact form submissions, Knowledge Center tags, zip code lookup, legal documents are meant to be public).
- Deep scan (sign-in, permissions, data exposure, secrets across the whole site and functions): running now, 5 to 15 minutes.

## Next steps
1. When the deep scan finishes, list every finding in plain language, grouped by how serious it is.
2. Fix the real problems first (anything exposing customer, merchant, payment or order data), starting with the most serious.
3. Re-run the quick check after each fix to confirm it is closed, and mark each fixed finding as resolved.
4. Leave intentional public items alone and explain why, rather than dismissing them myself.
5. Check that nothing broke: sign-in, store setup, checkout, messaging and Spaces deploys.

## Technical details
- Fixes go through database migrations (RLS policies, function grants) and edge function auth checks, following existing security-definer RPC patterns.
- Critical findings are never dismissed without your approval.
