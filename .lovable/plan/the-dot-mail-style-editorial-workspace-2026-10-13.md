# The Dot. — Mail-style editorial workspace

## Scope
Refine the **admin writing workspace only**, focusing on rich text editing, issue management, and writing templates. Preserve The Dot.’s public branding, archive layout, existing content, subscriber flows, and short newsletter email design.

## 1. A clearer issue desk
- Use Loumilab Mail’s workspace patterns with **All issues**, **Drafts**, **Published**, and **Templates** views.
- Add search and clear issue rows showing number, title, month, publication status, and recorded email date/count.
- Keep New issue, Edit, and Send test easy to find. Keep subscriber management in its existing section, with a simple link rather than duplicating it.
- Include loading, empty, and error states consistent with Mail.

## 2. Mail-style writing tools
- Replace long-form plain-text inputs with the shared Mail rich text editor: editor’s note, main story, short stories, product update, and closing thought.
- Support headings, bold/italic/underline, lists, links, and inline images using the existing editor tools.
- Keep title, subtitle, issue number/month, cover image, and resource links as structured fields. Group secondary settings separately so writing remains the main focus.
- Preserve the existing section order and all saved content. Plain-text issues must load without visible HTML tags or unwanted formatting changes.
- Show unsaved/saving/saved states and warn before leaving with unsaved changes. Saving remains explicit in this scope; it must never publish or email an issue.

## 3. Reusable writing templates
- Provide a blank issue and an editable standard brief structure using The Dot.’s existing sections, without invented article copy.
- Allow saving an issue’s structure/content as a named template, starting a new draft from it, renaming it, and deleting a template with confirmation.
- Templates must never inherit an issue ID, publication date, sent marker, or recipient count. Applying one to existing writing requires confirmation.
- Keep newsletter templates separate from ordinary Loumilab Mail templates.

## 4. Preserve publishing and delivery
- Keep automatic sends to all active subscribers and existing one-send-per-issue protection.
- Keep the short email announcement: title, subtitle, and **Read the full issue**, with existing branding and footer unchanged.
- Keep Send test using the last saved issue and sending only to the selected address; no test broadcasts.
- Clearly distinguish Save draft, Send test, and Publish. Confirm publishing an unemailed issue before sending it to subscribers.

## Technical details
- Reuse `src/components/admin/mail/MailEditor.tsx` and existing admin controls; keep the newsletter sender independent of Loumilab Mail delivery.
- Current public issue rendering splits plain text into paragraphs. Add backward-compatible, sanitized rich-content rendering solely to display the new formatting; do not redesign the public reader or archive.
- Restrict rich content to supported elements and safe link/image URLs. Preserve existing typography and strip unsafe markup and unsupported styles.
- Validate the stored issue format before implementation and add an explicit format discriminator if needed; do not guess whether old content is HTML. Preserve legacy data without destructive conversion.
- Store reusable newsletter templates persistently with access limited to the existing authorized editorial admins. Verify permissions and grants before any migration.
- Record shared-editor/content-format decisions in the project’s architecture rules.

## Verification
- Test as an authorized admin: create a draft, format text, upload an inline image, save, reopen, and verify the content reads back correctly.
- Save and reuse a template, confirm metadata resets, and verify search/status views.
- Confirm existing issues still display unchanged and new formatting renders safely without literal tags.
- Verify draft saves and template actions never call the broadcast sender; preserve existing publish and test-send behavior without sending a real broadcast during checks.
- Check the workspace at wide and narrow sizes, keyboard access, and current error signals.