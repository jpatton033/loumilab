

## Darken the Glass Card Background

Make the card surfaces darker and more luxurious by reducing the lightness of `--surface-elevated` (used by `.glass-card`) and the related `--surface-subtle` token.

### Changes (single file: `src/index.css`)

- **`--surface-elevated`**: Change from `240 5% 10%` to `240 5% 7%` -- brings the card background much closer to the page background (`4%`), creating a subtle, premium feel rather than a visible contrast.
- **`--surface-subtle`**: Change from `240 4% 8%` to `240 4% 5%` -- keeps this token darker in proportion.
- **`--card`**: Change from `240 5% 8%` to `240 5% 6%` -- aligns the default card token with the darker palette.

No other files need changes -- all cards reference these tokens via CSS classes.
