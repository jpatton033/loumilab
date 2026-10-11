# Expand the Loumilab Blue Dot into a Brand Signature

## Direction
Build one fluid visual language in which the Blue Dot moves between three roles—**thread, lens, and action marker**—while always feeling like the same recognizable Loumilab element.

Use recognizable restraint: three to five deliberate moments per core public page, with normal sentence punctuation left unchanged. The Blue Dot remains blue wherever it appears; nearby text does not need to become blue because the dot will function as a separate visual object rather than punctuation.

## The signature system

### 1. Identity anchor
- Keep the Blue Dot in the official Loumilab wordmark as the source of the system.
- Preserve the refined header logo sequence and align all other dot motion to its scale, timing, and easing.
- Introduce a consistent standalone dot size family for page-level, section-level, and action-level uses.

### 2. Moving thread
- Create a restrained path that carries the dot between selected sections as the user scrolls.
- Let the path curve, shorten, or disappear based on the layout rather than drawing a continuous line through the entire page.
- Use it to connect related ideas: introduction to offering, offering to proof, and proof to next action.

### 3. Image lens
- Let the dot expand into a circular crop or focus ring to reveal selected photography, then contract back into the moving dot.
- Apply this only to one major photo moment per page so it remains distinctive.
- Keep faces, text, and important product details unobstructed.

### 4. Action marker
- Add a small, consistent dot response to selected primary links and next-section transitions.
- The dot will approach, align with, or briefly guide the arrow instead of appearing beside every button.
- Preserve existing blue hover states and focus rings; no decorative corner dots or punctuation substitutions return.

## Page rollout

### Home
- Refine the current image journey so the dot visibly enters, becomes the lens, and exits toward the products.
- Keep the one-to-two product split as the main storytelling sequence.
- Add one restrained action handoff near the final project prompt.

### Services, Work, Products, and About
- Give each page one opening identity cue, one image-lens moment, and one thread transition into its most important content.
- Reuse the same motion grammar while varying direction and scale to fit each layout.

### Resources
- Use the dot to guide readers from the page introduction into featured knowledge, then reserve the action marker for key article links.
- Keep article body punctuation and reading layouts untouched.

### Orders and Local
- Treat the dot as Loumilab’s parent-brand signature without competing with each product’s identity.
- Use one opening or image moment and one directional handoff on each main product page.
- Exclude storefronts, receipts, setup forms, dashboards, legal pages, and other task-focused screens from decorative motion.

## Motion behavior
- Use one shared movement model so thread, lens, and action states transform into one another fluidly rather than playing as unrelated effects.
- Trigger major sequences once as they enter view; subtle action feedback remains interactive.
- Keep timing polished and calm, with no bouncing, spinning, particles, or constant looping.
- On phones, shorten travel distances and simplify image reveals.
- With reduced motion enabled, replace travel and scaling with stable static markers or omit purely decorative moments.

## Technical approach
- Expand the existing shared dot module into a small set of composable primitives: identity marker, path/thread, image lens, and action handoff.
- Use shared CSS custom properties for scale, travel, timing, and easing so every page feels related.
- Add placements through the existing shared public-page and visual-storytelling components where appropriate, avoiding duplicated page-specific effects.
- Keep all dot layers decorative, hidden from assistive technology, non-interactive, and unable to affect layout or block clicks.
- Retain the existing rule in the project guidance: the Blue Dot never replaces ordinary punctuation.

## Verification
- Review every included page at desktop and phone sizes for spacing, clipping, readability, and visual repetition.
- Observe complete motion sequences rather than relying only on still screenshots.
- Verify keyboard focus, reduced-motion behavior, page reloads, in-app navigation, and that no dot obscures content or controls.
