# Orders homepage: "Don't sign up. Start building."

Add a creative layer on top of the current Orders homepage. Its message is that visitors can build and preview a store before making an account. The existing sections, pricing, navigation, search tags and tracking all stay. Only three new moments are added, plus a stronger invitation to start.

## 1. The statement (right after the hero)
- A full-width typographic moment with no cards, set in huge editorial type: "Don't sign up." Then, after a pause, "Start building." resolves next to it.
- The Loumilab blue dot strikes through the words "sign up" and travels to the end of "Start building." There it becomes the button: **Build your store — no sign-up required**.
- Small supporting line: "Build it first. Make it yours. Publish when you're ready."
- Lots of empty space and nothing else on screen. The message is the design.

## 2. The storefront assembly (replaces nothing; sits before "How it works")
- A tall section that plays as you scroll. Its center panel is pinned on desktop and shown inline on phones. An empty store outline takes shape in four beats:
  1. Name and logo appear
  2. Products drop in
  3. Menu sections and pickup times snap into place
  4. A first order chime appears, and the finished customer view lights up
- Short labels beside each beat say Name it, Stock it, Shape it, Share it.
- It's built from the real store pieces, so there are no screenshots and no stock photos. On phones and with reduced motion, it shows the four beats as simple stacked frames.

## 3. The interactive invitation ("Try it here")
- One input: "What's your business called?" As you type, a miniature store updates live with your name, an auto-chosen colour and a sample product.
- A button, "Keep building this store →", opens store setup with the name already filled in, so nothing is typed twice.
- A clear note: "This is a preview. Nothing is saved or published until you create an account."

## 4. Calls to action
- The main Orders buttons (hero, closing section, and the button under the pricing section) become **Build your store — no sign-up required**. All of them lead to the guest store setup.
- A short three-part line near pricing reads **Build** (free, no account) → **Save** (create an account) → **Publish** (finish payout setup). Pricing amounts stay exactly as they are.

## What stays the same
Hero slideshow, social commerce, how it works, live preview, dashboard, order management, audiences, features, pricing, closing, page title/SEO, Meta Pixel, Google Tag Manager and event tracking.

## Checks
I'll check it on phone, tablet and desktop, with reduced motion turned on, and test that typing a name and continuing carries it into setup. I'll also make sure the page doesn't jump while it loads.

The new headlines and wording are drafts for you to review.

## Technical details
- New `src/components/orders/creative/` folder with `StartBuildingStatement.tsx`, `StorefrontAssembly.tsx` (IntersectionObserver-driven scroll progress, transform/opacity only, `prefers-reduced-motion` → static frames) and `TryItInvitation.tsx`. All three reuse `StorefrontHeader`, `StoreProductCard`, `PhoneFrame` and the `src/components/brand/dot` primitives.
- `TryItInvitation` links to `/orders/get-started?name=<encoded>`. `GetStarted.tsx` reads `name` only when there is no draft and no saved store, prefilling businessName/storeName. This keeps the saved-store-wins rule.
- CTA clicks fire the existing `track("StartOnboarding")` path only inside the wizard (unchanged), so there is no new tracking.
- `src/pages/Orders.tsx` inserts the three sections and updates the CTA labels. No backend changes.
