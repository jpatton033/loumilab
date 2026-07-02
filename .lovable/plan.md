## Update Intro Load Screen

Edit `src/components/IntroAnimation.tsx` only.

### Changes
1. Replace the "Designed by" label with **"POWERED BY"** (already uppercase via `uppercase` class; update the literal string).
2. Change the wordmark text from `Loumilab` to **`LOUMILAB`** (all uppercase).
3. Style the leading **`L`** slightly larger than the rest of the wordmark by splitting it into two spans — the first `L` gets an increased font-size (e.g. `text-6xl md:text-8xl`) while the remaining letters keep the current `text-5xl md:text-7xl`. Both share the same shimmer gradient.

No other files, tokens, or animations change. Timing, fade, particles, and rule-draw stay identical.
