# UX review — Book page (`/books/:id`)

Reviewed: 2026-10-18 · Themes: Paper, Dark · Widths: 375, 1280 · Reader: signed in with data (read Dune and rated it 4; reading Moby Dick; follows five readers) · Apollon at `75a397b` (dev server)
Screenshots looked at: Dune at the top, 750, 1,500 and 2,250px down at 1280 and 375 in Paper and Dark, and the whole page at 1280 (content order only); Moby Dick (reading) at the top at 1280 and 375 in Paper. Keyboard pass at 375 in Dark (45 stops, `tabwalk.mjs`). Not captured: signed out, a book with no description and no reviews, the log form open, a 404 (all covered when the page was built, `specs/shelf-design-refresh.md` Phase 3).

First review of this page; it was restyled in Phase 3 of the shelf refresh (2026-10-16).

## Summary

The top of the page is good: the cover stands on its board, the title is at display size, one green "Log this book", and on a phone the action is on the first screen. Below that, the page loses its shape: every review is printed in full (one runs seven paragraphs, ~1,100px), so the readers you follow and the lists start about 5,000px down. And a reader who has read the book sees nothing at the top that says so: "Log this book" looks the same as for a book they've never touched.

## Scores

**Nielsen: 25/36 (69%, acceptable**, one point under good). Help (10) n/a.
- **1 Visibility of status: 2.** Your own shelf, rating and dates for this book aren't shown in the header; "You rated it" sits inside the rating card, a screen down (finding 1).
- **8 Aesthetic and minimalist: 2.** Full-length reviews make the page a wall; a column of seven "Start a buddy read" buttons in Readers (3, 6).
- Scored 3: real-world match (2), control (3), consistency (4: reviews fold on the Reviews page but not here), error prevention (5), recognition (6), flexibility (7: the rating chart filters the reviews), error recovery (9).

**Cognitive load: moderate** (2 of 8 failed: *single focus*, the rail's green "Set a goal" beside "Log this book", see `author-page.md` #11; *progressive disclosure*, long reviews and every reader's buddy-read button shown at once).

**Personas:** Jordan (first-timer): one clear green action and the "Mark it as read to add it to your favourites" hint under the disabled Favourite is exactly right; but after logging Dune, coming back shows "Log this book" again with no sign it worked. Marta (reviewer): the reading face on reviews is comfortable at ~70 characters; her own long review would push everyone else's off the screen. Sam (keyboard, screen reader): the rating chart is ten tab stops, eight of them for ratings nobody gave, each 20px wide (2).

**Specificity:** passes: the cover on its board, Literata title, named readers as pills, moods and pace in the site's own pieces.

**Motion:** the cover settles onto its board when you add the book or mark it read; the want-to-read pill fades in; nothing on load. CLS on the dev server: 0.004 at 1280, 0.066 at 375 (the shell's phone header row, every page).

## Findings

### 1. Nothing at the top says you've read this book — P2 · M · Judgement
**Where:** `BookDetailPage.tsx` `BookHeader` (title block, then "Log this book"); "Dune at 1280 and 375, read and rated 4".
**What:** for a book on your Read shelf, the header looks exactly as for a book you've never logged: "Log this book" in green, Favourite. Your rating appears only as "You rated it ★★★★" at the bottom of the rating card; your dates and review nowhere on the page. While reading (Moby Dick), the QuickLog well shows "+10 pages" and "Finished!" with no "Reading" or current page.
**Why it matters:** the first question on a book page you've visited before is "have I read this?". Alex re-logs by mistake; Jordan can't confirm the log saved.
**Fix:** a status line under the authors when you have a log: a green-wash pill with the shelf ("Read", "Reading", "Did not finish"), the finish date and your stars, linking to your log; "Log this book" becomes "Log again" (secondary) for a read book, so the green goes to nothing or to Finished! while reading. While reading, "Page 90 of 280" above the QuickLog buttons when there is a page. Data from the existing logs query (`queryKeys.logs.byUser`); five languages.
**Status:** fixed 2026-10-18: under the authors, your newest log as a green-wash shelf pill ("Read", "Currently reading", "Did not finish"), the day in UTC ("Finished Sep 2, 2026", "Started…") and your stars; for a read or stopped book the button is the secondary "Log it again". The page waits for your logs with the book (shared with your profile's cache), so the line doesn't push the description down. The page reading ("Page 90 of 280") already shows in QuickLog when a page is logged.

### 2. The rating chart's bars are 20px wide targets and ten tab stops — P2 · S · Rule
**Where:** `RatingSummary.tsx:73` (chart bars as buttons); keyboard pass stops 21–30 at 375 (each 20×72).
**What:** every half-star bar is a button, including the eight with no ratings ("0 ratings of 0.5 stars. Show these reviews"). At 375 each is 20px wide with ~2px between them: under WCAG 2.2's 24px target minimum (2.5.8; the spacing exception doesn't apply at that gap), and far under our 44px. The names also say "1 stars".
**Why it matters:** Casey taps the 4.5 bar and gets 4; Sam tabs through eight empty bars to reach the reviews.
**Fix:** bars with no ratings are not buttons (plain marks, `aria-hidden`, out of the tab order); each bar's hit area reaches 24px wide at least (a `::before` wider than the bar, as `SectionSwitch` does); the bar's name pluralises on the number of ratings only (`rating.bucket_*` puts `{{rating}} stars` after it), so it says "1 stars": build the star part with `rating.stars` (plural on the rating) or reword as "rated {{rating}}", five languages.
**Status:** fixed 2026-10-18: bars nobody rated are plain marks (not buttons, out of the tab order); on a phone the end stars sit under the chart, so each slot is ~29px wide at 375; names say "1 star", "1.5 stars" (`rating.bucketStars`, plural on the rating, dative in German).

### 3. Every review is shown in full — P2 · S · Judgement
**Where:** `LogReviewCard.tsx` (used by `BookReviewsSection`); "Dune at 1280, whole page".
**What:** a seven-paragraph review fills ~1,100px at 1280 and more on a phone; two of them push "Readers" to ~5,000px and "Lists with this book" to ~5,700px down. The Reviews page's `ReviewListItem` already cuts at `PREVIEW_LENGTH` with "Read the review".
**Why it matters:** the page is about the book; one long review hides every other reader and the lists. Marta's long review should be one tap away, not the page.
**Fix:** fold the review text like `ReviewListItem` (or `FoldedText` with its "Read more"), with "Read the review" leading to the full review and its comments.
**Status:** fixed 2026-10-18: `LogReviewCard` shows the first 600 characters and "Read review" at the end of its social bar, as the Reviews list does. Dune at 1280: 7,004px → 5,686px; Readers starts ~1,000px sooner.

### 4. A review from someone you follow appears twice — P3 · S · Judgement
**Where:** `BookReviewsSection.tsx:35–63` (the "following" list and the "everyone" list are separate queries); "Dune, whole page": alice_reads' review under "From people you follow" and again last under Popular this week.
**Fix:** leave out of the everyone list the ids already shown under "From people you follow" (client side, the following preview is at most three).
**Status:** fixed 2026-10-18: reviews already under "From people you follow" are left out of Popular/Recent.

### 5. Seven "Start a buddy read" buttons in a column — P3 · M · Judgement
**Where:** `BookReadersSection` "Reading it now" rows; "Dune, whole page".
**What:** each reader currently reading the book has a secondary "Start a buddy read" beside their pill, so the section is a column of identical buttons (the Wall of Options).
**Fix:** one secondary "Start a buddy read" under the list that opens a choice of who to read with, or the button only on readers you follow, the rest as plain pills.
**Status:** fixed 2026-10-18: "Reading it now" is a row of pills like "Readers who loved this", with one secondary "Start a buddy read" under it inviting all of them, and a muted line saying they can be changed in the form (`books.readers.buddyReadHint`, five languages).

### 6. Two green buttons on the first screen (the rail's "Set a goal") — P2 · S · Rule
Shared with every page: see `author-page.md` finding 11. Here it competes with "Log this book".
**Status:** fixed 2026-10-18 with `author-page.md` #11.

## Looked fine

Heading order (h1, h2 sections, h3 sub-groups); focus visible everywhere and nothing focused under the header; the disabled Favourite explains itself; Log this book, Favourite, Read more and Show all 20 are 44px; like buttons 46×44; the subject pills fold at six; the Pace bar's colours all have text and numbers (Never-Alone); Dark contrast on the rating card, pills and reviews; no sideways scroll at 375. Data, not design: Open Library's subjects for Dune include near-duplicates ("Dune (Imaginary place)", "Dune (imaginary place), fiction").
