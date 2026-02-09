

# Lumilab Rebrand & Hero Slideshow

## Overview
Transform "Pristine Collective" into **Lumilab** with a new electric blue color palette, light bulb/glow logo, and a 3-5 slide hero carousel featuring mixed lifestyle imagery (team, workspace, creative process).

---

## New Brand Identity

### Name: **Lumilab**
*Where innovation comes to light*

### Tagline: "Illuminating Digital Innovation"

### Logo Concept
A modern light bulb mark with a subtle glow effect, representing "Lumi" (light) and the lab/innovation aspect. The design will feature:
- Minimalist geometric light bulb silhouette
- Inner glow/spark element
- Electric blue gradient for the luminous effect

---

## Color Palette Update

| Token | Current | New |
|-------|---------|-----|
| Accent | Champagne gold (#C9A962) | Electric Blue (#3B82F6) |
| Accent glow | Gold glow | Blue glow (#60A5FA) |
| Ring | Gold | Electric Blue |
| Gradients | Gold-based | Blue-based (#3B82F6 to #1D4ED8) |

The dark background theme remains unchanged.

---

## Hero Slideshow Structure

Replace the video background with a full-screen image carousel:

```text
+--------------------------------------------------+
|  [Nav: Logo]              [Links]    [CTA Button]|
+--------------------------------------------------+
|                                                  |
|           SLIDE 1: Team collaboration            |
|           (People working together)              |
|                                                  |
|                    LUMILAB                       |
|                  [Light Bulb Logo]               |
|                                                  |
|         "Digital experiences that shine"         |
|                                                  |
|              [ Start a Project ]                 |
|                                                  |
|    [●] [○] [○] [○] [○]  <-- Pagination dots     |
|                    ↓ Scroll                      |
+--------------------------------------------------+
```

### Slide Content (3-5 slides)
1. **Team Collaboration** - People brainstorming, whiteboard sessions
2. **Work Environment** - Modern office/workspace shots
3. **Creative Process** - Design work, screens with code/design
4. **Professional Setting** - Client meetings, presentations
5. **Innovation** - Technology, screens, digital products

Each slide will have:
- Full-screen background image with dark overlay
- AI-generated professional imagery
- Smooth crossfade transitions (4-5 second intervals)
- Interactive pagination dots
- Pause on hover

---

## Technical Implementation

### Files to Modify

1. **src/index.css**
   - Update `--accent` from gold to electric blue (217 91% 60%)
   - Update `--ring` to match
   - Update `--accent-glow` for blue glow
   - Update gradient variables for blue-based gradients
   - Update `.glow-hover` box-shadow to blue

2. **src/components/DiamondLogo.tsx** -> **src/components/LumilabLogo.tsx**
   - Create new light bulb SVG logo
   - Blue gradient fill with glow effect
   - Keep size variants (sm, md, lg, xl)
   - Add animated version with pulsing glow

3. **src/components/VideoHero.tsx** -> **src/components/HeroSlideshow.tsx**
   - Replace video with image carousel using embla-carousel-react (already installed)
   - Auto-play with 5-second intervals
   - Smooth crossfade transitions
   - Pagination dots at bottom
   - Pause on hover/focus for accessibility
   - Dark overlay for text readability

4. **src/components/Navbar.tsx**
   - Replace DiamondLogo with LumilabLogo
   - Update brand text from "Pristine" to "Lumilab"

5. **src/components/Footer.tsx**
   - Replace DiamondLogo with LumilabLogo
   - Update brand name to "Lumilab"
   - Update tagline to "Illuminating Digital Innovation"
   - Update copyright text

6. **src/pages/Index.tsx**
   - Replace VideoHero with HeroSlideshow
   - Update hero copy with new brand messaging
   - Replace DiamondLogo references with LumilabLogo
   - Update tagline and descriptions

### New Files to Create

1. **src/components/LumilabLogo.tsx**
   - SVG light bulb logo component
   - Blue gradient fill
   - Animated glow variant

2. **src/components/HeroSlideshow.tsx**
   - Full-screen carousel component
   - Uses embla-carousel-react
   - Auto-advance with configurable timing
   - Pagination dots UI
   - Accepts array of slide data (image, optional alt text)

### Image Generation

Generate 3-5 professional, dark-toned images:
1. Diverse team collaborating around modern workspace
2. Sleek office environment with people working
3. Creative process - design/development in action
4. Professional meeting/presentation setting
5. Innovation/technology focused scene

Images will be stored in `src/assets/slides/`:
- slide-1.jpg
- slide-2.jpg
- slide-3.jpg
- slide-4.jpg
- slide-5.jpg

---

## Animation Updates

### Slideshow Animations
- Crossfade transitions between slides (1s duration)
- Subtle zoom effect on active slide (Ken Burns style)
- Pagination dots with fill animation

### Glow Effects
- Update all glow colors from gold to electric blue
- Logo pulse animation in blue
- Button hover glow in blue

---

## Summary

This rebrand transforms the site from "Pristine Collective" with champagne gold accents to **Lumilab** with an electric blue palette. Key changes:

- New light bulb logo representing illumination and innovation
- Electric blue (#3B82F6) replacing champagne gold throughout
- Hero slideshow with 3-5 mixed lifestyle images replacing the video
- Pagination dots for slide navigation
- Maintains the dark, luxurious theme with updated blue glow effects
- All branding touchpoints updated (navbar, footer, homepage)

