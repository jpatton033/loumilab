# Merchant image editing + required Terms and Privacy agreement

Two pieces of work for Loumilab Orders merchants.

---

## Part 1 — Simple image editing on uploads

Today merchants can only pick a file and it uploads as-is. After choosing a photo (or tapping "Edit" on an image already uploaded), a dialog opens with the picture inside a frame:

- Drag to reposition inside the frame
- Zoom in and out (slider, pinch, scroll wheel)
- Rotate in 90-degree steps plus fine straightening
- Crop by moving/zooming within the frame: square for logos, wide for item photos
- Reset — put everything back as it started
- Replace image — pick a different file without leaving the dialog
- Remove — clears a logo or item photo entirely
- Cancel or Save; saving uploads the edited version

Saved images are resized down (logos up to 512px, item photos up to 1280px wide) so storefronts load fast. Transparent logos keep their transparency. SVG logos can't be cropped on a canvas, so they upload directly as today with a short note.

This appears everywhere the existing image picker is used — store logo and catalog item images, in both the dashboard and the setup wizard.

## Part 2 — Required Terms & Conditions and Privacy Policy

Two new public pages carrying the supplied text verbatim, with the effective/last-updated date of September 7, 2026:

- `/orders/terms` — Loumilab Orders Terms & Conditions
- `/orders/privacy` — Loumilab Orders Privacy Policy

Both are readable without signing in, linked from the Loumilab Orders page footer area, and formatted with clear headings and a section list so they're easy to scan on a phone.

Where merchants must agree:

- In the Orders setup wizard, on the account/business step, a single required checkbox with one sentence: "I have read and agree to the Loumilab Orders Terms & Conditions and Privacy Policy." — each name being its own link that opens the full document in a new tab.
- The wizard cannot continue past that step until it's ticked, and the store cannot be published without a recorded agreement.
- The agreement (which documents, which version, and when) is recorded against the merchant's account so there's a durable record; already-agreed merchants aren't asked again.
- If the documents are materially updated later, merchants see the notice once and re-agree before continuing — handled by comparing the stored version against the current one.

Existing merchants who signed up before this are prompted to agree the next time they open their dashboard, via a single card at the top with the same checkbox and links; the rest of the dashboard stays usable for reading, with publishing and going live gated until they agree.

## Technical notes

Image editing
- New `src/components/orders/ImageEditorDialog.tsx` — self-contained canvas editor, no new dependencies. State: `scale`, `offset {x,y}`, `rotation` (quarter turns + fine degrees). Pointer events for drag, `wheel` for zoom, existing shadcn `Dialog`/`Slider`/`Button` primitives for controls. Live preview on a `<canvas>` sized to the frame aspect ratio with a dimmed mask outside the frame.
- Export: draw the source `HTMLImageElement` into an offscreen canvas at the target output size with the same transform, then `canvas.toBlob()` — PNG when the source has alpha (png/webp), otherwise JPEG at 0.9 — wrapped back into a `File`.
- `src/components/orders/ImageUpload.tsx`: on pick, load to an object URL and open the editor instead of uploading immediately; upload the returned blob through the existing `uploadMerchantImage`. Add "Edit" when a value exists (fetch the stored signed URL into a blob so the canvas isn't tainted; fall back to "Replace" if that fetch fails). Keep the existing 5 MB / mime validation in `src/lib/orders/media.ts` unchanged.

Terms and privacy
- New `src/pages/orders/Terms.tsx` and `src/pages/orders/Privacy.tsx` using `Layout` + `SEOHead` (`noindex` off — these should be indexable), content held in `src/data/orders/legal.ts` as structured sections so both pages share one renderer and the version/date live in one place (`ORDERS_TERMS_VERSION = "2026-09-07"`).
- Routes added to `src/App.tsx`.
- New table `public.merchant_agreements` (`id`, `user_id` → `auth.users`, `document` text check in ('terms','privacy'), `version` text, `accepted_at` timestamptz, `merchant_id` nullable) with GRANTs (`select, insert` to `authenticated`; `all` to `service_role`) and RLS: users select/insert only their own rows; admins select all via `has_role`. No update or delete — the record is append-only.
- New `src/lib/orders/agreements.ts` — `useAgreementStatus()` (has the signed-in user accepted the current version of both documents) and `useAcceptAgreements()` (inserts both rows in one call, invalidates the query).
- New `src/components/orders/AgreementConsent.tsx` — the checkbox + inline links, reused by the wizard step and the dashboard card.
- `GetStarted.tsx`: gate the step's Continue on consent; call `useAcceptAgreements` on continue. `PublishStoreButton.tsx` / setup snapshot: add agreement as an outstanding item when missing. `Dashboard.tsx`: show the consent card when missing.
- Roadmap: add both items under a new "Merchant uploads" and "Legal agreements" heading in `roadmap.md` during implementation.

Note: the supplied text is used as provided. It contains placeholders for legal review (governing law, dispute resolution) that a lawyer should confirm; I'm not adding or altering legal wording.
