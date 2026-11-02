# Some frontend tests assume the current year is 2026 and will fail from 1 January 2027

**Priority:** P2 · **Size:** S · **Area:** Frontend tests (date-dependent)

## What happens

On 2026-11-01 `ClubPage.test.tsx` started failing on CI because its fixtures were due "2026-11-01" and that day passed (fixed in Apollon 387f063 by pinning the file's clock). Running the whole Vitest suite with the clock moved to June 2027 shows six more tests that read the real date against 2026 fixtures:

- `src/pages/StatsPage.test.tsx`: five tests ("says so kindly when nothing was finished…", "switches to all time with one bar per year", "opens an author's books…", "opens the books behind a month…", "shows how long books take…")
- `src/components/QuickLog.test.tsx`: "says so when the finish reaches the goal"

With the clock at 2026-12-15 they all pass, so they break on 2027-01-01.

(Two `LogForm.test.tsx` "finish date" tests also failed in that probe, but they fail with any faked date, so that's a side effect of the probe, not this bug.)

## Fix

Pin "today" in those files the same way as `ClubPage.test.tsx` and `ClubNextUpCard.test.tsx`: `vi.useFakeTimers({ toFake: ['Date'] })` and `vi.setSystemTime(...)` in a `beforeEach`, `vi.useRealTimers()` in an `afterEach`.

To check: temporarily add a `beforeEach` to `web/src/test/setup.ts` that does the same with a 2027 date, run `npx vitest run`, then remove it.
