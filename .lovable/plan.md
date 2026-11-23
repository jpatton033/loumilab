# A real live preview in store setup

## Today
The "Live preview" beside "Let's build your storefront" is a plain gray phone. It has a header and a list of item names, and it ignores the design you choose. Setup lets you pick a starting design, but there are no color choices. A look made in "See what you can create" on the Orders page doesn't show up there either.

## After
- **The preview is the real website.** It uses the same drawing system as live stores and the website builder, so what you see is what publishes.
- **It updates as you type and choose:**
  - business name, description, location, logo
  - your items and prices, as real product cards
  - starting design (template)
  - colors, fonts and style
- **New "Make it yours" choices** below the starting-design step:
  - Style: Editorial, Bold or Minimal
  - Colors: 6 palettes, or your own accent color
  - Fonts: 4 pairings

  These are the same choices visitors have on the Orders page.
- **Carry-over both ways:** if you made a design on the Orders page, setup opens with it already applied. Whatever you set here is what the website builder opens with after sign-up. Nothing publishes automatically.
- **Phone / desktop switch** on the preview. Desktop shows a wider frame that fits beside the form.
- **Small screens:** a "Preview" button opens the live preview full screen, since the side column is hidden there.
- The "Open the dashboard" link under the preview stays.

## End-to-end check
In the browser: go through setup, type a name, add two items, then pick Bold and the Forest palette. The preview should change each time. Then reload and confirm the choices are kept. Finally, open the website builder as a test merchant and confirm it shows the same colors and items.

## Technical details
- In `GetStarted.tsx`, swap the `PhoneFrame` preview for `SitePreview`. Build the design from `readPendingDesign()`, falling back to the selected template's `build()`. Overlay name/description/logo onto the header and hero, and map `namedItems` to `SampleProduct`s.
- Turn `TemplatePicker` into a controlled component and add Style/Palette/Font chips. Reuse `applyStyle` / `applyPalette` / `applyFontPair` / `readableOn` and persist through `setPendingDesign`, so the builder bootstrap keeps working unchanged.
- Add a test: setup's design merge keeps the chosen palette and inserts the merchant's name and items.
