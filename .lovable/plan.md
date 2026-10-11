# Say "Start a store" instead of "Start a project"

## What changes

The words "Start a project" become "Start a store" everywhere they already appear. Nothing moves, nothing is added, and every button keeps going exactly where it goes today — the contact form.

The five places, as they stand now:

1. **Homepage opening** — the main button beside "Explore products".
2. **"We're always building." box** — the button under that headline.
3. **The plus photo in the same box** — the hidden label a screen reader announces when someone lands on it with the keyboard.
4. **Homepage closing** — the main button under "Have something worth building?", beside "Contact Loumilab".
5. **End of every Resources article** — the sentence "Want help putting this into practice? Explore Loumilab services or start a project."

The article line stays in lower case inside the sentence: "…or start a store."

## What stays the same

- All five still open the contact form. No button is redirected to the store set-up flow.
- Page layout, spacing, button shapes and colours are untouched — only the words.
- The "We're always building." box and the closing buttons keep their current wording everywhere else.

## One thing worth your eye

The closing buttons currently read "Start a store" and "Contact Loumilab", and both open the contact form. That is what "leave as is" means today, so I am keeping it. Say the word and I will change the second one, or send the first to store set-up instead.

## Technical details

- `src/pages/Index.tsx` — three visible labels (lines 57, 123, 149) and the `aria-label` on the plus `Link` (line 124) change from "Start a project" to "Start a store". The `to: "/contact"` targets are untouched.
- `src/pages/resources/Article.tsx` — the inline link text at line 243 changes to "start a store"; the `to="/contact"` target is untouched.
- No database, search-engine, or routing changes. The raw-HTML SEO pass and sitemap are unaffected, since none of these words appear in page titles or descriptions.
- Verification: the build stays clean, then a browser check at desktop and phone width confirms each button reads "Start a store", opens the contact form, and that the keyboard label on the plus photo matches. The article ending is confirmed on a published article.
