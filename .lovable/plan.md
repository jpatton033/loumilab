# Send a test of The Dot. to jpatton@loganlori.com

Right now, newsletter emails can only go to the whole subscriber list, and each issue sends only once. A test send has to go to one inbox and leave the real send untouched.

## What changes
1. **Test sends in the newsletter email sender.** An admin can send any issue to one email address. A test:
   - goes only to that address,
   - has "[Test]" at the start of the subject,
   - does not mark the issue as sent, so the real send to subscribers still happens normally,
   - works for drafts too, so you can preview an issue before you publish it.
2. **"Send test" button in the issue editor.** It goes next to Publish. It asks for an email address (yours by default) and shows the result.
3. **Send the test now.** Send the latest issue, Issue 002 "What We're Building, Testing, and Questioning at Loumilab", to jpatton@loganlori.com. Then check that the email service accepted it.

## Technical details
- `dot-issue-blast`: add an optional `test_to` email field (checked for a valid format). When it is set, skip the one-time sent marker and the published-only check, look up the issue by id, and send one email through `/emails`. The unsubscribe link becomes a placeholder. The admin check stays the same.
- `TheDotEditor.tsx`: add a Send test dialog that calls the function with `{ issue_id, test_to }`.
- Deploy the function, then call it with the admin session for the test send.
