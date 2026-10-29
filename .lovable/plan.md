# The Dot. — free allowance from 3 issues to 1

Readers get 1 issue in full. From the 2nd different issue on, the soft gate appears (same blur, same "Continue reading" and Subscribe options). Re-opening the free issue stays open. Subscribers are never gated.

## Technical details
- `src/lib/thedot/readAllowance.ts`: `FREE_READS = 1`.
- `src/test/dotReadAllowance.test.ts`: update the test to "first issue open, second gated" and run it.
