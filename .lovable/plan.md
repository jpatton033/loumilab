
# Consistent Font Usage Throughout Website

## Overview
Standardize typography by using a single font family (Space Grotesk) across the entire website to match the bold "LUMILAB" brand identity.

## Current State

The website currently uses two font families:
- **Space Grotesk** (`font-display`): Used for headings, brand name, labels, and accent text
- **Inter** (`font-body`): Used for body text, paragraphs, and form labels

This creates visual inconsistency between different text elements.

## Proposed Change

Unify all text to use **Space Grotesk** as the single font family. This provides:
- Clean, modern aesthetic matching the "LUMILAB" brand
- Visual cohesion across all pages
- Simplified typography system

## Technical Changes

### 1. src/index.css
Update the base body styles to use the display font:

```text
Before:
  body {
    @apply bg-background text-foreground font-body antialiased;
  }

After:
  body {
    @apply bg-background text-foreground font-display antialiased;
  }
```

Optionally adjust the Google Fonts import to only load Space Grotesk (removing Inter) to improve page load performance.

### 2. Files Using font-body or font-medium (Optional Cleanup)
No changes required - once the body default is set to `font-display`, all text will inherit Space Grotesk unless explicitly overridden.

## Result
All text across the website will use Space Grotesk consistently:
- Navigation links
- Body paragraphs
- Form labels and inputs
- Card descriptions
- Footer text
- Headings (already using Space Grotesk)
- LUMILAB brand text (already using Space Grotesk)

## Visual Impact
- More cohesive, modern appearance
- Typography aligns with the bold LUMILAB brand identity
- Slightly more geometric/technical feel throughout
