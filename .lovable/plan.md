# Simple image editing for merchant uploads

Merchants can currently only pick a file and have it uploaded as-is. This adds a light editing step before the image is saved, so logos and item photos always look right.

## What merchants will get

After choosing a photo (or tapping "Edit" on an image they already uploaded), a dialog opens with the picture inside a frame:

- Drag the picture to reposition it inside the frame
- Zoom in and out with a slider, pinch, or scroll wheel
- Rotate in 90-degree steps, plus fine straightening
- Frame shape choice where it makes sense: square for logos, wide for item photos
- Reset to put everything back the way it started
- Replace image — pick a different file without leaving the dialog
- Remove — clears a logo or item photo entirely
- Cancel or Save; saving uploads the edited version

The final saved image is resized down to sensible dimensions (logos up to 512px, item photos up to 1280px wide) so storefronts stay fast to load. Transparent logos keep their transparency.

## Where it appears

Everywhere the existing image picker is used, so store logo and catalog item images in the merchant dashboard and the setup wizard both get it automatically.

## Notes and judgement calls

- Rotation is offered for all images; "where appropriate" is handled by only offering the wide frame to item photos and the square frame to logos.
- SVG logos can't be cropped meaningfully on a canvas, so those upload directly as today, with a short note explaining why.
- Nothing about storage, permissions, or the database changes; the same signed-URL upload path is reused.

## Technical approach

- New `src/components/orders/ImageEditorDialog.tsx`: a self-contained canvas editor with no new dependencies. Holds `scale`, `offset {x,y}`, `rotation` (quarter turns + fine degrees) in state; pointer events for drag, `wheel` for zoom, existing shadcn `Slider`/`Dialog`/`Button` primitives for controls. Live preview drawn on a `<canvas>` sized to the frame's aspect ratio, with a dimmed overlay outside the frame.
- Export: draw the source `HTMLImageElement` into an offscreen canvas at the target output size with the same transform, then `canvas.toBlob()` — PNG when the source has alpha (png/webp), otherwise JPEG at 0.9 quality — wrapped back into a `File`.
- `src/components/orders/ImageUpload.tsx` changes: on file pick, load into an object URL and open the editor instead of uploading immediately; upload the blob the editor returns via the existing `uploadMerchantImage`. Add an "Edit" button when a value already exists (re-fetches the stored URL through `fetch` into a blob so the canvas isn't tainted — the signed URL is same-origin-safe via CORS on Supabase storage; fall back to "Replace" if the fetch fails). Keep the existing Replace/Remove buttons and the 5 MB / mime validation in `src/lib/orders/media.ts`.
- No changes to `media.ts` upload semantics beyond passing an edited `File`; a `maxDimension` helper for downscaling lives in the editor.
