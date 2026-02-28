

## Remove Glass Card Utility

Remove the glassmorphism card style across the entire project and replace it with a clean, solid dark surface card.

### What changes

**1. Update CSS (`src/index.css`)**
- Remove the `--glass-bg` and `--glass-border` custom properties
- Replace the `.glass-card` class with a simple solid background using the existing `--surface-elevated` token (a dark surface color already defined in the theme), plus a subtle solid border using the existing `--border` token
- No blur, no transparency

**2. No changes needed in page files**
All 6 pages (Index, Services, Products, About, Work, HowWeWork) use `glass-card` as a class name. Since we're redefining what `.glass-card` does rather than removing the class, no page-level edits are required. The cards will automatically pick up the new solid style.

### Result
Cards will have a clean solid dark background (`hsl(240 5% 10%)`) with a subtle border (`hsl(240 4% 16%)`), no transparency or backdrop blur. The existing hover effects (`hover:border-accent/30`, `glow-hover`) will continue to work as before.
