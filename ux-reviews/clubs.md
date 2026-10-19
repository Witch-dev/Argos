# UX review — Clubs (`/clubs`, `/clubs/:id`)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; the rest on contact sheets) · Widths: 375, 1280 · Reader: logged in, admin of two clubs (one reading Jane Eyre, a book the reader had already logged as Read, with one checkpoint; one choosing) · Apollon at `be32e1c`
Screenshots looked at: the Clubs page at the top and 700px down; "The Tuesday Readers" at the top and 700 and 1,400px down; 1280 and 375. Tab walk on the club at 1280 Paper. Not captured: a checkpoint discussion, a past round, the modals, a club with many members (checked when built, Phase 3).
Code read: `ClubsDirectoryPage.tsx`, `ClubPage.tsx`, `ClubNextUpCard`, `MyClubsCard.tsx`.

## Summary

The club page opens well (the book on its board, the next checkpoint, your progress) and the directory's cards with cloth-bound initials are charming. What's wrong is consistency between places: the same club is "Finished" on its page and "Not started" in the directory and the rail, and the rail's checkpoint date is a day early (both filed as bugs). On the page, "Finish book" right after "You've finished the book" reads as the same thing.

## Scores

**Nielsen: 25/40 (acceptable).**
- **1 Visibility of status: 2.** Progress and dates disagree between the page, the directory and the rail (finding 1).
- **2 Match with the real world: 2.** "Finish book" means "end this round for the club" (finding 2).
- **4 Consistency: 2.** Same club, three states; "Book Clubs", "My Book Clubs" and "Clubs" for one place (finding 4).
- **10 Help: 2.**
- Scored 3: the rest.

**Cognitive load: low** (1 failed: *one decision at a time*, Edit, Delete, comments and an arrow on one checkpoint row).

**Personas:** Inés (club admin): sees "Finish book" under her own "Finished" bar and isn't sure whether it closes the round for everyone (it does, after a confirm). Theo (member, west of UTC): the rail tells him Nov 14, the club Nov 15. Sam (keyboard): clean order, all controls labelled; Edit and Delete 36px tall.

**Specificity:** passes: the book on a shelf board, named members, cloth-bound covers.

## Findings

### 1. The same club's progress and date disagree between the page, the directory and the rail — P2 · M · Rule
Filed: `bugs/club-progress-differs-between-page-and-rail.md` (Finished vs Not started) and `bugs/rail-club-checkpoint-date-day-early.md` (Nov 14 vs Nov 15).
**Status:** fixed 2026-10-18: see both bug files (a Read log counts as 100%; the rail's dates in UTC).

### 2. "Finish book" reads like "I finished the book" — P2 · S · Judgement
**Where:** `ClubNextUpCard` (the admin's secondary button), "the club at 1280 and 375", right under "You've finished the book" and "1 of 1 member on track".
**What:** the button ends the round for the whole club (with a confirm), but its words are what a reader says about their own reading.
**Fix:** "End this round" (or "Close Jane Eyre for the club"), five languages; keep the confirm.
**Status:** fixed 2026-10-18: "End this round", and its confirm says it ends the round for everyone (five languages).

### 3. Delete on a checkpoint row is plain ink beside Edit — P3 · S · Rule
**Where:** `ClubPage.tsx` checkpoint rows (confirmed by `confirm()` at `:330`); Edit 45×36, Delete 61×36.
**Fix:** Delete in danger ink, both 44px tall on touch screens; the arrow after the comment count can go (the whole row is the link).
**Status:** fixed 2026-10-18: Delete in danger ink, 44px on touch screens; the arrow after the counts is gone.

### 4. "Book Clubs", "My Book Clubs" and "Clubs" — P3 · S · Rule
**Where:** the page title "Book Clubs", the rail's "My Book Clubs" (Title Case), the sidebar's "Clubs", "Your clubs" on the page.
**Why it matters:** PRODUCT.md's terminology: one word per idea, *club*; Title Case isn't used for headings elsewhere and is wrong in four of the five languages.
**Fix:** "Clubs" as the page title, "Your clubs" in the rail; check the other four languages use their one word too.
**Status:** fixed 2026-10-18: "Clubs" as the page title and "Your clubs" in the rail, in every language (French also moved from "tes" to "vos", like the rest of its strings).

### Shared
The rail repeating "Your clubs": `shell-and-shared-pieces.md` #4. The rail shifting the layout: `bugs/rail-clubs-card-shifts-layout.md`.

## Looked fine

One green action on the directory ("Create a club"); club cards with ThumbCover or a cloth-bound initial, goal bar and the next checkpoint in UTC; Discover as one card of rows; the club page's round card, members with role pills and On track in the green wash, Invite readers as a sunken well with a visible label, activity with the time on its own line; destructive actions confirmed; all five themes.
