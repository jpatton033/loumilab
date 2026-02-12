

## Generate and Update LOUMILAB Favicon

### Overview
Generate a brand-aligned favicon using AI image generation and configure it in the project. The implementation will make it simple to swap in an official favicon later.

### Steps

1. **Create an edge function** (`generate-favicon`) that calls the Lovable AI image generation API to produce a favicon matching the LOUMILAB brand:
   - A minimalist, geometric light bulb icon (matching the existing `LoumilabLogo.tsx` SVG concept)
   - Blue tones (HSL 217, 91%) on a dark background
   - Clean, icon-sized composition (512x512)

2. **Create a utility page or script trigger** to call the edge function, receive the base64 image, and upload it to Lovable Cloud file storage (`public` bucket) as `favicon.png`.

3. **Update `index.html`** to reference the new favicon:
   ```html
   <link rel="icon" type="image/png" href="/favicon.png" />
   ```

4. **For easy future replacement**: The favicon is a single static file at `public/favicon.png`. To update it later, simply replace that file with an official image -- no code changes needed.

### Technical Details

- **Edge function**: Uses `google/gemini-2.5-flash-image` model via `https://ai.gateway.lovable.dev/v1/chat/completions` with `modalities: ["image", "text"]`
- **Prompt**: "Generate a 512x512 favicon icon for a brand called LOUMILAB. Minimalist geometric glowing light bulb symbol in blue (#4A90D9) on a dark navy/black background. Clean, modern, suitable for a small browser tab icon. No text."
- **Storage**: The base64 result is decoded and saved to Supabase Storage, then the public URL is used -- OR simpler: we save the generated image directly as `public/favicon.png` in the project
- **Simpler approach**: Since we can write files directly, we'll create the edge function to generate the image, call it, and write the result to `public/favicon.png`

### Approach (Simplified)
Since the AI image generation requires an edge function to hold the API call:

1. Create edge function `generate-favicon` that generates the image and returns base64
2. Add a small admin utility button or one-time script to fetch the generated image
3. Save the image to the project as `public/favicon.png`
4. Update `index.html` with the favicon link

Alternatively, the most pragmatic approach: create an SVG favicon directly from the existing `LoumilabLogo.tsx` design (the glowing blue light bulb), convert it to a standalone SVG file at `public/favicon.svg`, and reference it in `index.html`. This avoids the complexity of AI generation while perfectly matching the brand, and can be swapped for an official image later.

### Recommended Approach: SVG Favicon from Existing Logo

1. **Create `public/favicon.svg`** -- Extract and simplify the SVG from `LoumilabLogo.tsx` (the blue glowing bulb icon) into a standalone favicon-optimized SVG
2. **Update `index.html`** -- Add `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
3. **Future swap** -- Replace `public/favicon.svg` (or add a PNG) with an official asset at any time

This keeps things simple, brand-consistent, and easy to update later.

