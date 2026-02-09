
# Refine LOUMILAB Logo Typography

## Overview
Adjust the LOUMILAB logo typography by reducing the size of "OUMILAB" and increasing the size of the period (.) to create a more distinctive visual hierarchy.

## Visual Result

```text
Current:  L OUMILAB .
          ↑    ↑     ↑
         xl   lg   accent (same as lg)

After:    L OUMILAB .
          ↑    ↑     ↑
         xl  base   lg (larger, stands out)
```

## Technical Changes

### 1. src/components/Navbar.tsx (Lines 22-24)
Reduce "OUMILAB" from `text-lg` to `text-base` and increase the period from inherited size to `text-lg`:

```jsx
// Before
<span className="font-display text-lg font-bold tracking-tight">
  <span className="text-xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>

// After
<span className="font-display text-base font-bold tracking-tight">
  <span className="text-xl">L</span>OUMILAB<span className="text-accent text-lg">.</span>
</span>
```

### 2. src/components/Footer.tsx (Lines 9-11)
Apply the same proportional adjustment - reduce "OUMILAB" from `text-xl` to `text-lg` and increase the period to `text-xl`:

```jsx
// Before
<span className="font-display text-xl font-bold tracking-tight">
  <span className="text-2xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>

// After
<span className="font-display text-lg font-bold tracking-tight">
  <span className="text-2xl">L</span>OUMILAB<span className="text-accent text-xl">.</span>
</span>
```

## Size Hierarchy Summary

| Element | Navbar | Footer |
|---------|--------|--------|
| First "L" | text-xl | text-2xl |
| "OUMILAB" | text-base | text-lg |
| Period (.) | text-lg | text-xl |

## Files Modified
- `src/components/Navbar.tsx` - Logo typography refinement
- `src/components/Footer.tsx` - Logo typography refinement

## Result
The LOUMILAB logo will have a more distinctive typographic identity with:
- Large first "L" (unchanged)
- Smaller "OUMILAB" text
- Prominent blue period that visually balances with the large "L"
