
# Update Hero Badge and Reduce LOUMILAB Logo Size

## Overview
Make two typography adjustments:
1. Change the hero badge text from "Loumilab" to "LOUMI." with blue (accent) color styling
2. Reduce the font size of the "LOUMILAB" logo text (except the first "L" which stays larger)

## Visual Result

```text
Hero Badge:
  Before: Loumilab (blue accent color)
  After:  LOUMI. (blue accent color, with period also blue)

Logo Text (Navbar):
  Before: text-2xl "L" + text-xl "OUMILAB"
  After:  text-xl "L" + text-lg "OUMILAB"

Logo Text (Footer):
  Before: text-3xl "L" + text-2xl "OUMILAB"
  After:  text-2xl "L" + text-xl "OUMILAB"
```

## Technical Changes

### 1. src/pages/Index.tsx (Line 28-30)
Update the hero badge text:

```jsx
// Before
<span className="animate-slide-up-delay-1 inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.3em] mb-6">
  Loumilab
</span>

// After
<span className="animate-slide-up-delay-1 inline-block text-accent font-display text-sm font-medium uppercase tracking-[0.3em] mb-6">
  LOUMI.
</span>
```

### 2. src/components/Navbar.tsx (Lines 22-24)
Reduce the logo text size while keeping the first "L" proportionally larger:

```jsx
// Before
<span className="font-display text-xl font-bold tracking-tight">
  <span className="text-2xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>

// After
<span className="font-display text-lg font-bold tracking-tight">
  <span className="text-xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>
```

### 3. src/components/Footer.tsx (Lines 9-11)
Apply the same size reduction to the footer logo:

```jsx
// Before
<span className="font-display text-2xl font-bold tracking-tight">
  <span className="text-3xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>

// After
<span className="font-display text-xl font-bold tracking-tight">
  <span className="text-2xl">L</span>OUMILAB<span className="text-accent">.</span>
</span>
```

## Files Modified
- `src/pages/Index.tsx` - Hero badge text change to "LOUMI."
- `src/components/Navbar.tsx` - Smaller logo text (text-lg base, text-xl for "L")
- `src/components/Footer.tsx` - Smaller logo text (text-xl base, text-2xl for "L")

## Result
- Hero badge displays "LOUMI." in blue accent color
- Both navbar and footer logos display smaller "LOUMILAB" text
- First "L" remains proportionally larger than the rest of the letters
- Period (.) stays blue accent color
