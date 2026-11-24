# Homepage Orders section: text above sample website on phones

On phones and small tablets, show "Your business deserves a website that's yours.", its description and buttons above the sample website. Desktop stays exactly as it is now, with the sample website on the left and the text on the right.

## Technical details
- File: `src/pages/Index.tsx`, section 03 (Orders).
- Add `order-2 lg:order-none` to the showcase column and `order-1 lg:order-none` to the text column. The DOM order stays the same, so desktop layout and screen-reader order don't change.
- Check: screenshots at 390px and 1280px.
