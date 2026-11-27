# Remove "Ideas into impact." from the homepage

- Delete the "Ideas into impact." section (the six portfolio cards right after the hero) from the homepage.
- The hero film and everything else stay exactly as they are; the page flows hero → What we build. → rest.
- Clean up the now-unused card list and any images only it used.
- Check on phone and desktop that the hero joins the next section cleanly with no gaps or errors.

## Technical
- `src/pages/Index.tsx`: remove the `impact` array (line ~116) and the section at ~175; drop imports left unused.
