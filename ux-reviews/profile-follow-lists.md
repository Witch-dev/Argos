# UX review — Followers and following lists on a profile

Reviewed: 2026-11-10 · Themes: Paper · Widths: ~760 (user's screenshot) · Reader: logged in, own profile, 12 followers / 36 following
Screenshots looked at: the user's capture of their own profile with "Siguiendo" open (es). Phone width, Dark and someone else's profile were judged from the code (`FollowCounts.tsx`, `UserCard.tsx`, `ProfilePage.tsx`), not captured.

Fixed 2026-11-10: the lists open in `FollowListSheet` (shared `Modal`, sheet on a phone); all six findings done, checked in Paper and Dark at 1280 and 375 with a seeded reader with 24 followers.

## Summary
Clicking a count opens the whole list inline, inside the profile header, between the counts and the reader's own controls. With 36 people that's a column about 2,500px tall that pushes "Edit profile", the goal line, the bio and the shelves far down, and the only way to close it is to find and click the same count again. The fix is to open the list in the shared `Modal` (a sheet on a phone), the same pattern as the books behind a number on the stats page (`StatsBooksSheet`).

## Scores
Nielsen: 22/40 (acceptable).
- User control 1: no close button, no Escape; closing means clicking the count again, which is above the fold once you've scrolled the list.
- Visibility of status 2: nothing shows the count is a toggle besides the underline; no loading state (the list just appears).
- Aesthetic and minimalist 2: a tall grey well inside the header breaks the header's layout (the actions and bio end up below it).
- Flexibility 2: no search or filter for a long list; no follow-back button on rows.
- Consistency 2: the app's other "who/what is behind this number" lists (stats sheets, club members) open as a sheet or a folded section with a close, this one doesn't.

Cognitive load: moderate (fails "one focus" — the list competes with the profile it's on; "detail revealed progressively" is done, but with no way back).
Personas: power user with 300 follows (the page becomes the list); phone reader (the list fills the screen and the close target is far above); screen-reader user (the panel is not tied to its button with `aria-controls` and isn't announced).
Specificity: rows are generic avatar + name + handle; fine for a list of people, nothing to add here.

## Findings
### 1. Open the list in a dialog/sheet, not inline in the header — P2 · M · Judgement
**Where:** `FollowCounts.tsx:83` (`{openPanel && <div className={styles.panel}>…`)
**What:** the list renders inside the header, uncapped, between the counts and the profile's actions, goal and bio.
**Why it matters:** a reader who taps "36 Following" loses the profile they were on; the page turns into the list, and the header's own buttons move off screen.
**Fix:** render the list in `Modal` (`components/Modal.tsx`: focus trap, Escape and click-outside close, bottom sheet on a phone), titled "Following · 36" / "Followers · 12", with a Close button, as `StatsBooksSheet` does. The counts become plain buttons that open it (`aria-haspopup="dialog"` instead of `aria-expanded`). The list scrolls inside the dialog (max height ~70vh), so the profile never moves.
**Status:** fixed 2026-11-10 (`FollowListSheet.tsx`)

### 2. No visible way to close it — P2 · S · Rule
**Where:** `FollowCounts.tsx:47` (`toggle`)
**What:** closing only works by clicking the same count again; there's no close button and Escape does nothing.
**Why it matters:** "user control and freedom": after scrolling through the list, the reader has to scroll back up to find the count.
**Fix:** solved by #1 (Modal gives Escape, click-outside and a Close button). If #1 is not done, add a "Close" button at the bottom of the panel and close on Escape.
**Status:** fixed 2026-11-10 (`FollowListSheet.tsx`)

### 3. The rows are too tall for a list of people — P3 · S · Judgement
**Where:** `FollowCounts.module.css:66` (`.panel` gap `--space-2`) + `UserCard.module.css` (`padding-block: --space-2`)
**What:** each row stacks name over @handle with `--space-2` padding plus a `--space-2` gap, about 70px per person. When a reader has no display name the handle repeats the name ("foxescritos / @foxescritos").
**Why it matters:** 36 people take more than three screens; repeated names add noise.
**Fix:** inside the dialog use a gap of `--space-1`, and show the @handle line only when there's a display name (same rule as the profile header, `ux-reviews/profile.md` #4). That makes rows about 48px, still a 44px target.
**Status:** fixed 2026-11-10 (`FollowListSheet.tsx`)

### 4. No follow button on rows on someone else's profile — P3 · S · Judgement
**Where:** `FollowCounts.tsx:86`
**What:** the rows are links only; to follow someone from a friend's list you have to open each profile.
**Why it matters:** looking through a friend's follows is how readers find people to follow; it's the main reason to open this list.
**Fix:** in the dialog, put the existing `FollowButton` (small) at the end of each row on others' profiles and on your own "Followers" (follow back), except for yourself. Your own "Followers" keeps "Remove".
**Status:** fixed 2026-11-10 (`FollowListSheet.tsx`)

### 5. No loading or error state — P3 · S · Rule
**Where:** `FollowCounts.tsx:29-36`
**What:** while the query loads, the counts show 0 and the panel shows "No one yet"; a failed load also shows "No one yet".
**Why it matters:** a reader with followers briefly sees "0 followers / no one yet", which reads as wrong data.
**Fix:** use `LoadingMessage` / `ErrorMessage` from `StateMessage` in the dialog, as `StatsBooksSheet` does; show the count as "–" until it loads.
**Status:** fixed 2026-11-10 (`FollowListSheet.tsx`)

### 6. Long lists: search and a cap — P3 · M · Judgement
**Where:** `api/follows.ts:14-20` (whole list, no paging)
**What:** the API returns every follower at once and the list has no filter.
**Why it matters:** fine at 36; a reader with a few hundred follows has to scroll to find one person.
**Fix:** a "Search names" field at the top of the dialog when the list has more than ~20 people (filter on the client, the data is already loaded). Paging on the server only when someone actually has thousands; not now.
**Status:** fixed 2026-11-10 (`FollowListSheet.tsx`)

## Not a finding / not confirmed
- The stats row wrapping "36 Siguiendo" onto its own line at ~760px is the row's `flex-wrap` working as intended; it no longer matters once the list opens in a dialog. If it still looks odd, `gap: 0 var(--space-5)` would keep four facts on one line a little longer.
- The pale empty pill at the left edge of the screenshot is outside these components (probably the cut-off sidebar). Not checked; look at it again in a full-width capture.

## Looked fine
Count buttons are 44px tall, keyboard reachable with a visible focus ring, and labels go through `t()` with plural forms; the Remove button on your own followers has a named `aria-label`.
