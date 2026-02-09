
# Modern Website Redesign: Pristine Collective

## Overview
A complete visual overhaul transforming the current light-themed studio website into a dark, luxurious, Squarespace-inspired design with an ambient background video hero and a new brand identity centered around refinement and perfection.

---

## New Brand Identity

### Name: **Pristine Collective**
*A digital studio where every pixel is polished to perfection*

### Tagline: "Flawless by Design"

### Logo Concept
A minimalist geometric diamond mark paired with refined typography. The diamond represents:
- Precision and clarity
- Premium quality
- Transformation (rough to refined)
- Eternal value

---

## Visual Design System

### Color Palette

| Token | Current | New |
|-------|---------|-----|
| Background | Near-white (#FCFCFC) | Deep black (#0A0A0B) |
| Foreground | Dark charcoal | Off-white (#F5F5F5) |
| Card | White | Dark charcoal (#141416) |
| Accent | Coral orange | Champagne gold (#C9A962) |
| Secondary | Light gray | Soft charcoal (#1C1C1F) |
| Muted | Gray | Medium gray (#71717A) |

### Typography
- Keep **Space Grotesk** for headings (fits luxury aesthetic)
- Keep **Inter** for body (excellent readability on dark backgrounds)
- Increase letter-spacing on headings for editorial feel
- Use lighter font weights for an airy, premium look

### Design Elements
- Generous whitespace (dark space)
- Subtle gradient overlays
- Soft glow effects on interactive elements
- Smooth, cinematic scroll animations
- Glass-morphism for cards (subtle blur, transparency)

---

## Homepage Redesign

### Hero Section with Ambient Video
```text
+--------------------------------------------------+
|  [Nav: Logo]              [Links]    [CTA Button]|
+--------------------------------------------------+
|                                                  |
|          LOOPING AMBIENT VIDEO BACKGROUND        |
|          (Abstract, slow-motion, elegant)        |
|                                                  |
|              PRISTINE COLLECTIVE                 |
|              ◇ Diamond Logo Mark                 |
|                                                  |
|         "Digital experiences, flawlessly         |
|              designed and built"                 |
|                                                  |
|              [ Start a Project ]                 |
|                                                  |
|                    ↓ Scroll                      |
+--------------------------------------------------+
```

#### Video Implementation
- Use an HTML5 `<video>` element with `autoPlay`, `muted`, `loop`, `playsInline`
- Abstract, dark-toned video (geometric shapes, light particles, or flowing gradients)
- Fallback to static gradient for slow connections
- Dark overlay to ensure text readability

### Services Preview Section
- Full-width alternating layout
- Large typography with hover animations
- Service cards with glass-morphism effect

### Featured Work Section
- Large image cards with hover reveals
- Subtle parallax on scroll
- Project titles appear on hover

### Stats Section
- Minimal, centered layout
- Animated counters on scroll into view
- Gold accent for numbers

### CTA Section
- Full-bleed dark section with gradient border
- Centered, impactful messaging

---

## Page Updates

### All Pages
- Dark background throughout
- Consistent spacing and typography
- Smooth page transitions
- Glass-morphism cards

### Services Page
- Large, editorial service blocks
- Icon refinement with gold accents
- Hover states with glow effects

### How We Work Page
- Vertical timeline with animated connecting line
- Step numbers in gold
- Cards with subtle hover lift

### Products/Labs Page
- Modern product cards
- Status badges with refined colors
- Grid layout with hover animations

### Work/Case Studies Page
- Large hero images for each case study
- Overlay text on hover
- Metrics displayed prominently

### About Page
- Editorial layout with large typography
- Values in a refined grid
- Team section placeholder

### Contact Page
- Split layout (content | form)
- Refined form inputs with gold focus states
- Subtle animations on interaction

---

## Technical Implementation

### Files to Modify

1. **src/index.css**
   - Update all CSS custom properties for dark theme
   - Add new utility classes for glass-morphism
   - Add video overlay styles
   - Update gradient definitions

2. **tailwind.config.ts**
   - No structural changes needed (uses CSS variables)

3. **src/components/Navbar.tsx**
   - Update branding to "Pristine Collective"
   - Add diamond logo mark
   - Adjust styles for dark theme

4. **src/components/Footer.tsx**
   - Update branding
   - Dark theme adjustments

5. **src/pages/Index.tsx**
   - Replace hero with video background
   - Add diamond logo component
   - Restructure sections for Squarespace feel
   - Add scroll animations

6. **src/pages/Services.tsx**
   - Glass-morphism cards
   - Gold accent updates

7. **src/pages/HowWeWork.tsx**
   - Animated timeline
   - Dark theme styling

8. **src/pages/Products.tsx**
   - Refined status badges
   - Card updates

9. **src/pages/Work.tsx**
   - Large image placeholders
   - Hover reveal effects

10. **src/pages/About.tsx**
    - Editorial typography
    - Dark theme updates

11. **src/pages/Contact.tsx**
    - Refined form styling
    - Gold focus states

### New Files to Create

1. **src/components/DiamondLogo.tsx**
   - SVG diamond logo component
   - Animated version for hero

2. **src/components/VideoHero.tsx**
   - Reusable video background component
   - Handles fallback and overlay

### Video Asset
- Will use a free stock video or generate an abstract animation
- Suggested sources: Pexels, Coverr (free video stock)
- Alternative: CSS-animated gradient background as fallback

---

## Animation & Interaction

### Scroll Animations
- Fade-up on section entry
- Staggered reveals for card grids
- Smooth parallax on hero elements

### Hover Effects
- Cards lift with subtle glow
- Links with underline animation
- Buttons with glow pulse

### Page Transitions
- Smooth fade between routes
- Content slides up on page load

---

## Summary

This redesign transforms the site from a bright, energetic studio feel to a refined, luxurious dark aesthetic inspired by Squarespace. The new "Pristine Collective" brand emphasizes perfection and premium quality, with:

- Dark, sophisticated color palette with champagne gold accents
- Ambient looping video in the hero section
- Glass-morphism cards and subtle glow effects
- Smooth, cinematic animations
- Consistent editorial typography throughout
