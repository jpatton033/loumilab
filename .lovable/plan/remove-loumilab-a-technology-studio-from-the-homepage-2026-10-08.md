# Remove "Loumilab — a technology studio" from the homepage

## What changes
- Remove the small blue line "Loumilab — a technology studio" above "We build what's next." on the homepage.
- Move the opening section up slightly so the big headline sits where the small line used to start, keeping the same balance between the menu, the headline, the buttons and the photo.
- No other page changes. The footer and About page keep their own "technology studio" wording.

## Technical details
- `src/pages/Index.tsx`: delete the eyebrow `<p>` (line 51) and drop `mt-4` from the `<h1>`. Keep the section's `pt-12 lg:pt-16` so the headline still clears the header.
- Check with screenshots at desktop and phone widths.
