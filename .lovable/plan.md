# Spaces hero: "Built by People"

This changes only the opening of the public /spaces page. The dashboard, uploads, Passport, Export, Specification and Library stay as they are.

## 1. Creative concept
The opening is a short film about how making something starts with a gesture. A hand, an arm or a step turns into a mark, a movement or a thing someone built. Each cut follows the motion of the shot before it, so the film plays as one continuous piece. It's dark, real and quiet, with no screens, code or glowing tech.

## 2. Storyboard (about 20 seconds, looping)
1. **0–4s: The moment before.** Close-up of a mural artist's hands (a Black woman in her 30s) shaking a spray can at night. A sodium streetlight lights the cracked brick. The camera barely moves and the shot is in slow motion.
2. **4–8s: The act.** A medium tracking shot follows her arm sweeping a deep teal and copper curve across the wall. Paint mist catches the light.
3. **8–12s: Match cut to movement.** The curve of the paint becomes the curve of a dancer's arm (a South Asian man) in a dim concrete stairwell. A slow lateral move follows him and the slow motion holds.
4. **12–16s: Match cut to making.** His downward sweep becomes an older ceramicist's hands (an East Asian woman in her 60s) drawing clay upward on a wheel. It's a close-up in warm, low light.
5. **16–20s: Resolution.** A wide shot of a small workshop doorway at dusk. A young owner (Latina, wheelchair user) rolls up a shutter. Burgundy and copper light spills out over deep black. The frame stays still and leaves room for the headline. The final shot fades straight back into shot 1 (dark doorway to dark wall), so the restart doesn't show.

## 3. Camera, color and light
- Mostly intimate close-ups, with one medium tracking shot and one wide closing frame. Slow sideways moves and light handheld realism. No zooms, flares or particles.
- Grade: deep black dominates, with midnight blue, deep teal, burgundy and burnt copper coming from the paint, clothes and lamps. Skin tones stay natural, with fine grain.

## 4. Typography and layout
- **"Create without limits."** in large Satoshi, bottom-left on desktop, placed where the shots leave a dark area (shoulders and hands sit to the right or the top). The period matches the headline color.
- Supporting line: "Build anywhere. Own what you build. Run it with Spaces."
- Small descriptor: "Loumilab Spaces is a home for deploying, preserving, sharing, and managing software built anywhere."
- Buttons: **Get Started** (off-white, primary) and **Explore Spaces** (outline, scrolls to the next section).
- A soft dark shade from the bottom-left keeps the text readable in every shot.

## 5. Transitions
Cuts land on matching movement (arm to arm to hands) instead of crossfades. The loop also closes on darkness. The film is made as one continuous video, not a slideshow of clips.

## 6. Video assets
- Four clips of about 5 seconds each (generated, cinematic, 16:9), then cut together into one roughly 20-second video. A separate 9:16 vertical crop for phones.
- A strong poster image (from the dancer frame) shows until the video plays.
- Files are compressed and loaded from the CDN, with a smaller version for phones. If a clip comes out looking glossy or empty, I'll say so and won't present it as final.

## 7. Phones
Vertical version, with the text at the bottom and the buttons stacked. Reduced motion shows only the poster. The video pauses when off-screen or when the tab is hidden.

## 8. Into the next section
The film's last frame is burgundy and copper on black. The section below starts on the same deep black, with a faint copper-to-burgundy tint at the top that fades out, so it reads as a continuation and not a new block. There's no fade-to-black gap.

## Technical details
- Edit only the hero section (line ~25) of src/pages/spaces/Home.tsx. Keep `data-page-hero` so the header stays transparent.
- Clips are made with the video tool (credits apply), stitched and encoded with ffmpeg (H.264 MP4 plus a mobile version), and uploaded as CDN assets. The poster is WebP.
- Reuse the existing scene/motion helpers. Reduced motion means poster only.
