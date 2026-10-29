# The Dot. — Free reads and soft subscription gate

Only The Dot. issue pages and the hub page change. The rest of the site, the publishing workflow and email sending stay the same.

## What readers will experience
1. **Three free issues.** A visitor can read 3 different issues in full. The browser remembers which issues were read. Opening the same issue again doesn't count, and the hub page and previews never count.
2. **From the 4th issue on:** the title, subtitle, date, Editor's Note and the first 2 paragraphs of the main story show normally. Below that, the rest of the issue softly blurs and fades out on a white background. There's no dark overlay and no pop-up.
3. **The invitation sits inside the fade:** "A little curiosity goes a long way." / "You've explored The Dot. Now stay connected to the ideas shaping business, technology, and what's next." / "Join The Dot. — It's free." It has an email field, a Subscribe button and the line "Thoughtful perspectives. No noise. Unsubscribe anytime."
4. **Soft gate:**
   - A quiet "Continue reading" link reveals the whole issue, and the invitation doesn't come back for the rest of that visit.
   - Subscribing reveals the rest of the issue straight away, without moving the page.
   - No account or password is needed.
5. **Subscribers:** after subscribing on this device, the reader never sees the gate again. Typing an email is never treated as proof of being a subscriber, so the site shows nothing about subscribers. Readers who arrive from a link in a Dot. email are also treated as subscribers.
6. **Hub page:** a slim invitation near the top reads "Ideas worth staying curious about." with the intro text, an email field and a Subscribe button. The issue grid stays exactly as it is.
7. **Phone and tablet:** the form is full width and the buttons are easy to tap. The page doesn't jump when the gate appears or disappears. The fade is static when the device asks for reduced motion, and screen readers get labels for the gate and its controls.
8. **Measurement:** six events are added: issue view, limit reached, gate shown, gate dismissed, subscription started and subscription completed. They go through the existing tracking setup and never include email addresses.
9. **Search:** the full issue text stays on the page, so search engines and readers get the same content. Article addresses, page titles and descriptions, canonical links and structured data are unchanged.

## Technical details
- New `src/lib/thedot/readAllowance.ts` (pure helper plus localStorage): read slugs, limit 3, a dismissal flag in sessionStorage, and a subscribed flag set by a successful signup or a `?utm_source=the-dot` email link. It comes with unit tests for the counting rules: no double count, issue 4 is gated, subscribed readers are never gated, and a dismissal stops the gate for that visit.
- New `src/components/thedot/DotSoftGate.tsx`: wraps the gated part of `Issue.tsx` (everything after the second story paragraph) in a container with a CSS mask/blur and a fixed max height. It includes the invitation form, which reuses `subscribeToTheDot` (duplicate signups are already handled), and adds `aria-hidden` and `inert` on the blurred part.
- `TheDotSignup` gets an optional `onSubscribed` callback. A new hub copy variant goes in `Index.tsx`.
- Events go through `track()` in `src/lib/tracking`.
- No database changes and no new libraries.
