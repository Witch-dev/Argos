# UX review — Journal (`/journal`) and Stats (`/stats`)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; the rest on contact sheets) · Widths: 375, 1280 · Reader: logged in with data (seeded `sw_mveb1frt`: 16 read across January–September 2026 with ratings, pages, moods and pace, 3 reading, 1 did not finish without a date, a goal of 30) · Apollon at `be32e1c`
Screenshots looked at: Journal (Shelf view) at the top and 700 and 1,400px down; Stats at the top and 700 and 1,400px down; 1280 and 375. Tab walk at 375 Dark on both. Not captured: the Details view, the empty journal, a year with no books (checked when built, `specs/shelf-design-refresh.md` Phase 3).
Code read: `JournalPage.tsx`, `journalShelfBook.tsx`, `StatsPage.tsx`, `ReadingGoalCard.tsx`, `BarList`, `ColumnChart`.

First review of these pages with the new rubric; both were rebuilt in Phase 3 of the shelf refresh.

## Summary

The journal as a bookcase a year reads beautifully at 1280 and the Stats page is four calm cards. The biggest thing to fix is on Stats: the bar lists print every author, genre and mood down to a single book, so on a phone "Top authors" alone is ten rows (about 600px) of which seven say 1.

## Scores

**Nielsen: 28/40 (good).**
- **7 Flexibility: 2.** No way to open the whole of a bar list or collapse it; the journal can't be filtered by shelf.
- **10 Help: 2.** "Behind pace" (shared with Books home) and the empty "0%" under Did not finish explain nothing.
- Scored 3: everything else; error prevention 3 (goal Remove has no confirm or undo, finding 4).

**Cognitive load: moderate** (2 of 8 failed: *chunking*, ten-row lists; *progressive disclosure*, every row shown at once).

**Personas:** Alex (power user, 800 books a lifetime): "Top authors" for All time would list hundreds of names at 1. Riya (first-timer with a goal): "8 books behind pace" again, here as the card's second line (`books-home.md` R1). Sam (keyboard): Year, Edit, Remove, Books/Pages, then every author link; fine, 19px author links are only 44px on touch screens as intended.

**Specificity:** passes: the journal is a bookcase, the longest/shortest stand on a shelf.

## Findings

### 1. Bar lists show every name down to one book — P2 · S · Judgement
**Where:** `StatsPage.tsx` "What you read" (`BarList` for authors, genres, moods); "1280 at 700px": Top authors 10 rows, 7 of them 1; Genres 9 rows, 6 of them 1.
**Why it matters:** the interesting part (your top three) drowns in a tail of ties; on a phone each row is two lines, so the card is three screens long.
**Fix:** show the top 5 (and every name tied with the 5th only if that adds two or fewer), then a quiet "Show all N" that opens the rest in place; when all remaining values are 1, say "and 7 more authors with one book each".
**Status:** fixed 2026-10-18: `BarList` takes a `limit`: authors, genres and moods show 5 and "Show all N" (not when only one or two more would hide).

### 2. A book you stopped without a date says "Logged Oct 18" — P3 · S · Rule
**Where:** `journalShelfBook.tsx` `whatAndWhen` (DidNotFinish without `finishedAt` falls through to `loggedOn`); Journal and Books home, "Metamorphosis".
**What:** the caption says "Logged Oct 18" as one string (it breaks "Logged / Oct 18" at 375 anyway), instead of "Stopped" and the day on their own lines like the others; the Feed calls the same entry "Stopped reading".
**Fix:** for DidNotFinish without a finish date use `action.stopped` with `entry.date`; likewise WantToRead ("Added") so every caption is verb + day on two lines; drop `loggedOn` if nothing else needs it.
**Status:** fixed 2026-10-18: a stopped book is "Stopped" and the day (its finish date or the day it was logged), on two lines; anything else "Logged" and the day, also on two lines.

### 3. "Did not finish 0" carries a "0%" line — P3 · S · Judgement
**Where:** `StatsPage.tsx` tiles; "1280 at the top".
**Fix:** show the DNF rate detail only when the count is above 0.
**Status:** fixed 2026-10-18: the rate shows only above 0.

### 4. Removing the goal happens on one tap, in the same green as Edit — P3 · S · Rule
**Where:** `ReadingGoalCard.tsx:135` (`remove.mutate()` straight away), Stats, Books home on a phone and the rail.
**Why it matters:** the target and "Shown on your profile" choice are gone with no way back; Remove looks just like Edit.
**Fix:** an in-place confirm ("Remove your 2026 goal?" with Remove in danger ink and Cancel), as the journal's "Make all private" does; or an Undo for a few seconds.
**Status:** fixed 2026-10-18: Remove asks in place ("Remove your 2026 goal?", Remove in danger, Cancel).

### 5. "Stats and goals are free, always." — P3 · S · Judgement
**Where:** `StatsPage.tsx` subtitle.
**What:** a pricing promise as the page's one line of introduction, on an Operate screen where readers come to look at their numbers.
**Fix (question):** if the promise matters, it belongs on the landing page and a pricing page; here a line about what the page shows ("Your reading in 2026, from your journal") or nothing.
**Status:** fixed 2026-10-18: the line is now "Your reading, counted from your journal." (five languages). The "free" promise belongs on the landing page if it is wanted; question still open for the user.

### Shared
The goal wording: `books-home.md` R1. The rail repeating the goal and year: `shell-and-shared-pieces.md` #4. Shelf | Details and Books | Pages pills: shared #2. "Metamorphos / is" at 375: shared #5.

## Looked fine

The journal's year headings and four-across boards at 1280 (three at 375, never a near-empty board); captions as verb and date on separate lines; dates in UTC; privacy line on your own entries; the month chart (values on caps, initials on a phone, no axis noise); stat tiles fit five across at 1280 and two at 375; Year as a labelled 44px field; all five themes.
