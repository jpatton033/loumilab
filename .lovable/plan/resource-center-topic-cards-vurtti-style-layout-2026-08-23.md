# Resource Center Topic Cards — Vurtti-Style Layout

Restyle the "Browse by topic" cards on `/resources` to follow the compact layout used by Vurtti's Knowledge Center, while keeping every Loumilab design element (light surfaces, accent blue, rounded-3xl cards, hairline borders, soft shadows, scroll reveals).

## What changes

Today each topic is a tall card: large 48px icon tile on its own row, big title below, description, then an article count with an arrow pinned to the bottom.

The new arrangement mirrors Vurtti's structure:

```text
+------------------------------------------+
| [icon]  Business Growth                  |
|         4 published                      |
|                                          |
| Selling online, acquisition, pricing,    |
| and keeping customers coming back.       |
+------------------------------------------+
```

- Icon shrinks to a small rounded tile and sits inline, left of the text.
- Topic title becomes a compact semibold line instead of an oversized heading.
- The count moves directly under the title as quiet secondary text reading "N published".
- Description sits below that header row as smaller muted body copy.
- Cards get tighter padding and a denser grid gap, so the six topics read as a scannable set rather than six large blocks.
- Hover keeps the existing Loumilab treatment: accent border, subtle lift, icon tile filling with accent, title shifting to accent.

## Scope

Only the "Browse by topic" section of the resources hub. Hero, search, results grid, Most read, Latest, and the newsletter block stay exactly as they are, and `/resources/:section` article listings are untouched.

## Technical notes

- Single file edit: `src/pages/resources/Index.tsx` — the `sections.map(...)` card markup and its grid/skeleton classes.
- Keep `SectionIcon`, `Reveal` staggering, `Link` targets, and the `counts[s.slug]` data source unchanged; this is presentation only.
- Continue using semantic tokens (`bg-card`, `border-border`, `text-muted-foreground`, `bg-accent-soft`, `text-accent`, `var(--shadow-soft)` / `var(--shadow-lift)`) — no hardcoded colors.
- Skeleton placeholder height reduced to match the shorter cards.
