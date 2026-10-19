# Faster Live Preview tour

Change the time each example store stays on screen from 7 seconds to 3.5 seconds. The blue progress line under the selected store speeds up to match. Pausing, stopping and the store order stay the same.

## Technical notes
- In `src/components/orders/LivePreviewPicker.tsx`, set `INTERVAL_MS` to 3500. The progress bar already reads from this value.
- Check on a desktop-size screen that it advances about every 3.5 seconds.
