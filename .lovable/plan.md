# Header and menu refinement

Only the top menu changes. Page content, the logo, the homepage hero, link destinations, sign-in and tracking stay the same.

## Desktop layout
- One group runs left to right: logo, then the menu (Solutions, Products, Resources, About) about 40px after it, then on the far right a small account icon and the "Start a Project" button.
- The header is about 72px tall, inside the same content width as the homepage.
- The header stays at the top while scrolling, on a white, very slightly see-through background. A thin bottom line appears only after you scroll or open a menu. The height doesn't change. Page sections that are jumped to keep a small top offset so the header doesn't cover them.

## Menus open on hover
- Hovering Solutions, Products or Resources opens its menu right away. Moving from a label into its menu doesn't close it. The menu closes about 150ms after the pointer leaves the label and menu together, so small slips don't close it.
- Hovering a different label switches menus at once.
- Clicking still works: it opens or closes the menu.
- Keyboard: Tab to a label, then Enter, Space or the Down arrow opens it. Escape closes it and returns focus to the label. Focus rings are visible.
- Touchscreens open menus by tap only. Hover opening is turned off on devices without a mouse.
- Fade plus a 4px slide, about 180ms. With reduced motion turned on, there is no slide.

## Type and look
- Menu labels are medium weight and slightly larger, near-black when hovered or open, and dark gray at rest. There is no blue text for the current section, just a darker label and a small dot under it.
- Smaller, thinner arrows.
- Menu panels are white, with a hairline border, soft shadow, slightly smaller rounded corners and tighter padding. Section labels are small gray capitals, not blue. Descriptions stay short.
- **Products menu:** only Loumilab Orders, Loumilab Local and Vurtti, plus "View all products". Free Business Tools stays under Resources. No comparison pages appear here.

## Sign in
- A small person icon sits left of "Start a Project".
- **Signed out:** a tiny menu with "Sign in".
- **Signed in:** the menu shows your email, a "Sign out" option, and the existing account links. Sign-in itself works exactly as before.

## Start a Project
- Loumilab Blue, slightly smaller (about 40px tall), with rounded-rectangle corners instead of a full pill. The text matches the menu labels, and hovering just darkens the color a little.

## Phone and tablet
- Logo on the left and a clean menu icon on the right. The open menu lists Solutions, Products and Resources as tap-to-expand sections, then About and Contact.
- Sign in or Sign out sits near the bottom, with a full-width "Start a Project" button last.
- Rows are at least 44px tall, nothing scrolls sideways, and the page behind can't scroll while the menu is open.

## Checks
- Desktop at 1280px: hover opens each menu, moving into the menu keeps it open, and leaving closes it. Escape works.
- Phone at 390px: the menu opens and expands, and there's no sideways scroll.
- Signed-out account menu shows Sign in.

## Technical details
- `src/components/Navbar.tsx`: layout changes (`justify-start` logo plus nav with `ml-10`, actions `ml-auto`). Add `onPointerEnter`/`onPointerLeave` with a close timer, applied only when `pointerType === "mouse"`. Add keyboard handlers. Add the account popover with existing shadcn `DropdownMenu`, and lock body scroll while the mobile menu is open.
- `src/data/navigation.ts`: the products menu filters out Business Tools.
- CSS `scroll-padding-top` on `html` to match the header height.
- No auth, route or tracking changes.
