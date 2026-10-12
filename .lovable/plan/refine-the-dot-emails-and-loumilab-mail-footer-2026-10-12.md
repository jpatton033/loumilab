# Refine The Dot. emails and Loumilab Mail footer

## 1. Shorter issue emails
- Keep the issue title, subtitle, and existing **Read the full issue** link.
- Remove the editor’s note, story heading, story excerpt, and closing thought from the email only.
- Preserve everything else: branding, issue number/date, cover image when present, sender, subject, unsubscribe footer, and current styling.
- Apply the same shorter format to subscriber broadcasts and test emails. Leave the full issue on the website unchanged.

## 2. Permanent subscription invitation in Loumilab Mail
- Add a restrained footer invitation below the existing contact details in every newly sent Loumilab Mail email, independent of the optional personal signature.
- Use **The Dot. — A Loumilab Brief**, **Ideas, technology, and what's next.**, and a blue **Subscribe to The Dot.** link to `https://loumilab.com/the-dot`.
- Keep it in the normal email footer, not a floating or sticky element. Use a link rather than an embedded signup form for email compatibility.
- Show the identical invitation in the Mail preview. Do not automatically subscribe recipients or alter receipts, account emails, or previously sent messages.

## Technical scope
- Update the email template in `supabase/functions/dot-issue-blast/index.ts` without changing recipient selection, automatic publishing sends, or duplicate-send protection.
- Update both branded Mail frame copies: `src/lib/admin/mailFrame.ts` and `supabase/functions/_shared/admin-mail-frame.ts`.
- Deploy the affected email functions after implementation.

## Verification
- Check rendered issue emails contain the title/subtitle/link but none of the removed article sections.
- Check Mail preview and outgoing HTML match, including with personal signatures disabled.
- Confirm the issue link opens the correct full issue and the subscription link opens the existing signup page.
- Send only a test issue email and a test Loumilab Mail email to `jpatton@loganlori.com`; do not publish or broadcast an issue for testing.
