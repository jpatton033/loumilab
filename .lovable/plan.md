
# Update Brand Name to LOUMILAB with Styled Typography

## Overview
Update the brand name from "LUMILAB" to "LOUMILAB" with custom typography where the first "L" is displayed in a larger font size than the remaining letters.

## Visual Result

```text
Current:  LUMILAB.
New:      LOUMILAB.
          ↑
          Larger "L"
```

## Technical Changes

### 1. src/components/Navbar.tsx
Update the brand text from "LUMILAB" to "LOUMILAB" with the first "L" wrapped in a span with a larger font size:

```jsx
<span className="font-display text-xl font-bold tracking-tight">
  <span className="text-2xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>
```

### 2. src/components/Footer.tsx
Same treatment for the footer logo (scaled proportionally since footer uses `text-2xl`):

```jsx
<span className="font-display text-2xl font-bold tracking-tight">
  <span className="text-3xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>
```

Also update the copyright text from "Lumilab" to "Loumilab":
```text
© 2024 Loumilab. All rights reserved.
```

## Files Modified
- `src/components/Navbar.tsx` - Brand text in header
- `src/components/Footer.tsx` - Brand text and copyright

## Result
The brand will display as "LOUMILAB." with the first "L" visually larger, creating a distinctive typographic identity while maintaining the bold, modern aesthetic.
