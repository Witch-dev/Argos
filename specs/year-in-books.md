# Feature Spec — 2026 in books

*Added 2026-11-25, from ROADMAP Stage 11 #2 ("Argos Wrapped") and the FUTURE-IDEAS entry "Monthly wrap-up + Argos Wrapped year in review". Decided with the user the same day.*

Builds on `specs/yearly-goal-and-stats.md` and `specs/stronger-stats.md` (the numbers, `StatsOverviewCalculator`, `FinishedLogRow`) and `specs/share-cards.md` (images drawn in the browser, `web/src/shareCards/draw.ts`, the three photo backgrounds, `ShareCardSheet`). Read those first.

## 1. Problem

Every December, Spotify Wrapped fills Instagram Stories, and readers ask for "this, but for books". Goodreads (Year in Books), StoryGraph (Reading Wrap-Up) and Fable (End of Year Wrap) all have one. Winged Words already computes almost every number such a recap needs (the stats page), but they sit on a page of charts nobody shares.

A year recap shown as tap-through slides, with a share image on every slide, gives readers a reason to come back in December and puts `wingedwords.app` on a lot of Stories. Each share works as free advertising.

## 2. Decisions

### 2.1 Decided with the user (2026-11-25)

1. **Name: "2026 in books"** / **"2026 en libros"** (the year changes each year). Not "Wrapped" (Spotify's word). Goodreads uses "Year in Books"; ours is close in English but it's a common phrase, and in Spanish nobody uses it. Other locales: "2026 em livros", "2026 in Büchern", "2026 en livres" (only English and Spanish are checked by the user).
2. **Opens in the second week of December 2026, after Spotify Wrapped** (changed 2026-11-27 from the first week), so readers who just saw theirs think "this would be cool for books", and we show it to them. **Opening: Wednesday 2026-12-09** (confirmed 2026-11-27). The social post goes out that day.
2a. **Hidden until it opens** (2026-11-27). Before the opening date nobody can see their recap: the endpoint answers 404 and the page shows only the "coming soon" message (§3.5). The admin can see their own, to check it on the live site.
2b. **A heads-up first, so readers have time to log their books** (2026-11-27): about a week before (around December 1, as soon as it's deployed), every reader gets an **in-app notification and an email**: "Your 2026 in books arrives on December 9. Add the books you finished this year so it's complete." Sent by the admin with one button, once. At about 70–80 readers the email is a small send.
3. **Private books count in the numbers but are never named.** A book whose reading is "only me" (`Log.ReadingVisibility == Private`) adds to books read, pages, hours, months and the comparison with last year. It is never shown by title or cover, and its genres, moods, pace, authors, rating, language or decade are not used for anything. It also can't be the longest, shortest, fastest or highest-rated book. This applies to the slides themselves too, not only the images, since slides get screenshotted.
4. **Yearly only.** Monthly wrap-ups don't fit: few readers finish more than one book a month. A **half-year ("semester") version** is an idea for later (§4, FUTURE-IDEAS.md).
4a. **Pages from unfinished books count** (2026-11-27). Half of a 1000-page book you're still reading adds 500 pages. Books you're reading or stopped (DNF) add the pages you reached **in 2026**, and audiobooks add minutes. They never add to the **number of books**, which stays finished books only (§3.1, "Pages from unfinished books").
4b. **The "ready" message goes by email too** (2026-11-27), with a button that opens the reader's recap page, as well as the notification.
4c. **A temporary sidebar item** "2026 in books" from the opening date to January 31 (2026-11-27), for readers who skip Books home.
5. **Text from fixed rules, never AI** (FUTURE-IDEAS: Fable's AI summaries insulted readers in 2025).

### 2.2 Decided while writing the spec (change any before building)

6. **Followers-only books are treated like public ones.** Only "only me" is hidden (item 3). The reader chooses to share the image, and a followers-only book is already something they show people. *Confirmed by the user 2026-11-27.*
7. **One new endpoint, not more fields on the stats overview.** `GET /api/stats/year-in-books?year=` runs on the same rows as the stats page but applies item 3, which the stats page doesn't (there, private books show everywhere because only the owner sees it). Mixing both rules in one response would be easy to get wrong.
8. **Counted like the stats page:** Read logs with a finish date in the year, rereads included as separate reads. Year-only finish dates (imports) count in the year but not in any month. DNF books never count as books, never appear by name, and the DNF rate stays on the stats page (a recap is a celebration), but their pages count (item 4a).
9. **Numbers are as of the day you open it.** Opened on December 3, it covers January 1 to December 3. It's computed on each request (no snapshot), so books finished later in December show up when it's opened again. No "so far" wording on the images: Spotify does the same.
10. **When it shows:** from the opening date (§2.1.2a) the endpoint answers for any year with data. Before it, the **entry points** (§3.5) show the heads-up. From the opening date to January 31 they show the recap. After that, any year stays reachable from the stats page.
11. **How much there is to show:**
    - **0 books:** no recap. The page says "Your 2026 in books will fill up as you finish books" with a link to log one.
    - **1–2 books:** a short version: the opening, the count, the books, the closing slide.
    - **3 or more:** the full version (§3.3). A slide with nothing to show (no ratings, no genres, no non-private books) is skipped, never shown empty.
12. **Reader type by fixed rules** (§3.2), one per year, kind and never judging. Every rule is about something the reader did, not something they lack. No "you only read…", no comparing to other readers.
13. **No comparison with other readers** ("you read more than 80% of readers"). It needs every reader's numbers, invites unkind framing and is meaningless while the site is small.
14. **Images: 9:16 only (1080×1920)**, one per slide, plus a **summary image** with the main numbers and up to 5 covers. Footer `wingedwords.app/u/<username>` as on every card (`specs/share-cards.md` §2.2.5).
14a. **Its own simple backgrounds, not the share-card photos** (decided with the user 2026-11-27). The recap should look like its own yearly event, not like another review card. Plain colours drawn in code (no image files, no AI art), taken from the site's palette (§3.4). **The slides and the images use the same backgrounds,** so what the reader sees is what they share.
15. **No new table.** One migration: a "News emails" switch on the reader's settings (§3.6). The recap itself stores nothing, and nothing is sent to the server when an image is made.
15a. **News emails get their own switch, on by default, with an off link in every email.** Today readers only get account emails and club emails (which have their own switch). A news email without a way out is spam to mail providers and to the law (Chile, GDPR, CAN-SPAM all expect an opt-out on announcements to existing users). The privacy policy's email line gains "and occasional news, such as your year in books, which you can turn off".
16. **Route: `/year-in-books/2026`**, signed-in readers only, own recap only. A public page that friends can open is for later (§4).

## 3. Design

### 3.1 Data: `GET /api/stats/year-in-books?year=`

- Caller's own logs only. `year` checked like the overview (`JournalService.ValidateYear`). Rate limit as the other stats endpoints.
- `FinishedLogRow` gains `ReadingVisibility` (projected in `GetFinishedRowsAsync`). Also projected: whether the log has review text (`Review` non-empty), and whether the log is tied to a club round (for "books read with a club"), if that's a cheap join; otherwise that number is dropped.
- A new static `YearInBooksCalculator` (next to `StatsOverviewCalculator`, reusing its helpers) takes the rows and applies §2.1.3: **totals use all rows; everything that names or describes a book uses only rows that aren't Private.** Unit tests for every field, including "a private book never appears and never feeds a top list".

Response (`YearInBooksDto`):

| Field | Rows used | Meaning |
|---|---|---|
| `year`, `booksRead`, `pagesRead`, `minutesListened` | all | Totals. Pages from print/ebook, minutes from audio. `pagesRead` and `minutesListened` include the unfinished part below |
| `pagesFromUnfinished`, `minutesFromUnfinished` | all | The share of the totals that came from books still being read or stopped, for the line "including 1,240 pages from books you're still reading" |
| `previousYear` | all | `{ booksRead }` or null when the year before has no finished book. Compared on books only: pages from unfinished books can't be worked out for years before the progress history existed |
| `goal` | — | `{ unit, target, done }` if the reader set a goal for the year, else null |
| `busiestMonth` | all | `{ month, books }`, the month with most finished books; null with fewer than 3 dated books; a tie goes to the later month |
| `months` | all | 12 `{ month, books }` for the small bar row |
| `topAuthors` | non-private | Up to 3 `{ name, books, authorKey }`, only authors with ≥ 2 books; else the slide is skipped |
| `topGenres` | non-private | Up to 3 `{ key, count }` |
| `topMoods` | non-private | Up to 3 `{ key, count }` |
| `longest`, `shortest` | non-private | `StatsBookDto` with pages; print/ebook with a page count only; null when fewer than 3 qualify |
| `fastest` | non-private | `StatsBookDto` plus `days` (needs a start date); null when fewer than 3 qualify |
| `oldest` | non-private | `StatsBookDto` plus `year` (first publication) |
| `favourites` | non-private | Up to 5 highest-rated `StatsBookDto` with `rating`, ties broken by later finish |
| `averageRating` | non-private, rated | One decimal; null when fewer than 3 rated |
| `firstBook`, `lastBook` | non-private | First and latest finish of the year (dated only) |
| `rereads` | all | Count |
| `reviewsWritten` | all | Logs finished in the year with review text (a count only, never the text) |
| `clubBooks` | all | Count, or left out (see above) |
| `covers` | non-private | Up to 12 `{ openLibraryId, coverUrl }`, highest-rated first, for the opening and summary slides |
| `readerType` | non-private + totals | Key from §3.2, or null |
| `hiddenCount` | — | How many private books were counted but not named, so the page can say "plus 2 books you keep to yourself" |

**Pages from unfinished books** (§2.1.4a). A second repository query reads the caller's logs that are Reading, or DNF, and had progress in the year (`ProgressUpdatedAt`, or the DNF date, in the year), with their latest `ReadingProgressEntry` before January 1 of that year. For each one:
- **Pages read in the year = the last page reached in the year − the page reached before the year.**
  - The last page reached in the year is the log's `CurrentPage` (Reading), or its stop page (DNF).
  - The page before the year is the latest history point before January 1. With no such point, it's 0 if the reading started in the year (`StartedAt`, or the log was created in the year when there's no start date).
  - **A book started before the year with no history point from before it is left out:** we can't tell what was read this year. The progress history only exists since November 2026, so this mostly affects books started in 2025 and still open.
- Audiobooks: the same with minutes.
- Books counted in chapters: the share of chapters × the book's pages when the page count is known, else left out.
- Never below 0, never more than the book's length.
- Private unfinished books add their pages like any other (§2.1.3); unfinished books are never named anywhere in the recap.
- **Known overlap:** a book half read in 2026 and finished in 2027 adds all its pages again in 2027, because a finished book counts its whole length in the year it's finished (as on the stats page). Accepted: it only affects the year-to-year total, never the books count.
- **The stats page doesn't change.** Its pages count finished books only, so the recap shows the line "including N pages from books you're still reading" to explain why its number is higher.

### 3.2 Reader type (fixed rules)

Checked in this order; the first that matches wins. Only for 3+ books. Names and one-line descriptions are settled in the copy round (Spanish first); the keys and rules are:

| Key | Rule |
|---|---|
| `marathon` | 50+ books |
| `deepDiver` | median length ≥ 450 pages (print/ebook with pages) |
| `loyal` | one author is ≥ 30% of the named books (and ≥ 3 books) |
| `timeTraveller` | ≥ 40% of named books first published before 1950 |
| `explorer` | 6+ different genres among named books |
| `listener` | ≥ 40% of books are audio |
| `rereader` | ≥ 25% rereads |
| `steady` | finished a book in 9+ different months |
| `curious` | default for everyone else |

Unit test: each rule hit by a crafted year, and the order respected.

### 3.3 Frontend: the slides

`YearInBooksPage` at `/year-in-books/:year`, full screen on phones, a centred 9:16 frame on wide screens.

- **Moving between slides:** tap the right two thirds / left third, the arrow keys, swipe, or Next / Back buttons that are always reachable for keyboard and screen readers. A thin progress row at the top (one segment per slide). **No auto-advance** (accessibility, and readers linger on covers). A close button returns to where they came from.
- **Slides (full version), each skipped when its data is missing:**
  1. Opening: "Your 2026 in books" over the covers on a shelf (the shelf effect is the signature, `DESIGN.md`).
  2. Books and pages read (+ hours listened), the books compared with last year when there is one; "including N pages from books you're still reading" when there are any; "plus N books you keep to yourself" when `hiddenCount > 0`.
  3. The goal, if one was set: met, or how close.
  4. Months: the 12-bar row, the busiest month named.
  5. Top authors (linked to author pages).
  6. Genres and moods.
  7. Longest, shortest and fastest book.
  8. Oldest book ("You travelled back to 1847").
  9. Favourites: the up-to-5 highest-rated books, average rating.
  10. First and last book of the year.
  11. Reader type.
  12. Summary: the main numbers and up to 5 covers, "See your full stats" link, Share.
- **Short version (1–2 books):** slides 1, 2, the books themselves, 12.
- **Share on every slide:** "Share this" opens `ShareCardSheet` with that slide's card (§3.4). Slide 12 shares the summary card.
- **Motion:** one entrance per slide (covers settle onto the shelf, numbers fade up), from `DESIGN.md`'s motion rules; off with `prefers-reduced-motion`.
- **States:** loading (the shelf with blank books), error with retry, the 0-books page (§2.2.11).
- **Colours:** each slide has one of the year backgrounds (§3.4), in a fixed order, so going through the slides feels like turning bright pages, not scrolling one page. The reader's site theme doesn't change them. Text colour comes with the background, and each pair is checked for contrast (WCAG AA).
- Every string through `t()` in all five locales. The year backgrounds are added as tokens in `web/src/index.css` (`--year-*`), the only new tokens. `web-design` skill: a short plan, then a screenshot critique round.

### 3.4 Share images

- **The year backgrounds:** four flat colours from the site's palette, each with its own text colour:
  - **Cream** (`#f7f3e8`, the Paper page) with ink text,
  - **Forest** (`#2e5e4e`, the accent green) with cream text,
  - **Night** (`#1b1a17`, the Dark page) with cream text and the light green (`#86bba3`) for numbers,
  - **Sepia** (`#f1e4c8`) with ink text.
  
  The only decoration is the shelf the covers stand on, plus at most one simple shape per background (a thin border, or a large faint year number behind the content). The exact shades, the shape and the order are settled in the mockup round (Phase 2). No photos, gradients or textures.
- New `web/src/shareCards/yearCard.ts` with one drawing per slide kind, all on the same frame: the year background, the heading "2026 in books" in Literata, the slide's content, the footer. Reuses `drawCover`, `drawShelf`, `wrapText`, `drawStars`, `drawFooter`, not `drawPhoto` or `drawPaperPanel`.
- **Picking a background:** a slide's image starts with that slide's colour; the share sheet lets the reader switch to any of the four (instead of the photo picker). The last choice is remembered in `localStorage`.
- **Summary card:** the year, books / pages / hours, the reader type, up to 5 covers on a shelf, the footer. This is the one we promote.
- Built from the endpoint's data only, so §2.1.3 holds on the images automatically. A unit test feeds a year with private books and checks no private title reaches a card.
- Named `winged-words-2026-in-books.png`. Share sheet on phones, Save image elsewhere (as the other cards).

### 3.5 Opening date, heads-up and entry points

**Opening date:** one setting, `YearInBooks:OpensOn` (a date, read in Chile time like admin stats). Before it, `GET /api/stats/year-in-books` answers 404 for everyone but the admin, and the API tells the app the date (a field on the existing summary or settings response, no extra request). Moving the date is a settings change on Render, no deploy.

**Before the opening date (the heads-up):**
- **Books home:** a card at the top, for every reader: "Your 2026 in books arrives on December 9", then the useful part: "Add the books you finished this year so it's complete", with buttons for **Import from Goodreads or StoryGraph**, **Find a book**, and when they have any, **"3 finished books have no date and won't count"** linking to the existing no-date list (`booksWithoutDate`, `specs/stronger-stats.md`). Can be dismissed (`localStorage`).
- **`/year-in-books/2026`** shows the same message instead of the slides.
- **In-app notification and email to every reader** (§2.1.2b), sent by the admin (§3.6).

**From the opening date to January 31**, for the current year (in January: the year just ended), for readers with at least 1 book that year:
- **Books home:** the card becomes "Your 2026 in books is ready", with three covers on a small shelf. Dismissible.
- **In-app notification and email** "Your 2026 in books is ready", sent by the admin on the opening day, only to readers with at least 1 book. The email's button opens `/year-in-books/2026` (after sign-in if needed).
- **Sidebar:** a "2026 in books" item, from the opening date to January 31, for readers with at least 1 book that year.
- **Stats page:** a "See your 2026 in books" link under the year picker, for any year with books, from the opening date on, all year round.
- **What's new** entry, and the social post (`social-content` skill), written by the user.

### 3.6 Sending the heads-up and the "ready" message

- **Two new `NotificationType`s:** `YearInBooksSoon` and `YearInBooksReady`, with no actor (like `CheckpointDue`), linking to `/year-in-books/{year}`. The text is built on read, in the reader's language.
- **Admin page:** a small "2026 in books" box on the admin stats page with two buttons, "Send heads-up" and "Send ready", each showing how many readers it will reach and asking to confirm. `POST /api/admin/year-in-books/{year}/send?kind=soon|ready`, admin only.
- **Sent once:** a reader who already has that notification type for that year is skipped, so a second press (or a retry after a timeout) never sends twice.
- **Who:** active, verified accounts that aren't suspended or deactivated. "Ready" only to readers with ≥ 1 finished book that year.
- **The emails** (heads-up and "ready", both decided by the user): through the existing email queue (`EmailQueueService`), in the reader's site language, plain and short like the club emails: the date, why to log books now, one button to Winged Words, and the footer "You get this because news emails are on. Turn off news emails" (link).
- **Off link:** a signed token like the club emails' (`specs/club-emails.md`: Data Protection purpose `NewsEmailsOff`, 90 days, after `#`, a button on `/email-off`, no login needed, only ever turns the switch off). Plus a "News emails" switch in Settings → Notifications next to "Club emails".
- **Email limits:** check the Resend plan's daily limit before sending. The free plan allows 100 a day, and club and account emails share it. At about 80 readers, send in the morning on a quiet day, or let the queue spread it over two days.
- Needs `argos-security`: a bulk send, a no-login token endpoint and an admin endpoint.

## 4. Later (not this spec)

- **Half-year recap** ("first half of 2027 in books"), from July. Same page with a date range. FUTURE-IDEAS.md.
- **"My 5 books of 2026"**: make a 5 books list from the favourites slide in one tap. Waits for `specs/five-books.md` Phase 3 (the browser part).
- **A public recap page** friends can open (`/u/<name>/2026`), with a link preview. Needs a privacy review and a visibility choice.
- **4:5 and 1:1 images**, if readers ask.
- **Site-wide "2026 on Winged Words"** (most-read books, top genres): an aggregate over readers, needs `argos-security` and enough readers to mean anything.

## 5. Tasks

Timeline (updated 2026-11-27): Phase 0 live by about **December 1** (heads-up out, a week to log books), Phases 1–3 live before the opening on **December 9**, hidden behind the date.

### Phase 0 — Heads-up and news emails · *size S–M* · first, because it has to go out a week early
- [x] `YearInBooks:OpensOn` setting; the API tells the app the date.
- [x] "News emails" switch, on by default (a notification preference like Club emails, so no column; the migration adds `Notifications.EmailedAt` instead); Settings → Notifications toggle; off link and token endpoint (§3.6).
- [x] `NotificationType.YearInBooksSoon` / `YearInBooksReady`, admin send endpoint (sent once per reader per year), the admin box with counts and confirm.
- [x] Heads-up and "ready" emails (all five languages; English and Spanish checked by the user) through the email queue, with the off link. "Ready" is built now but only sent on the opening day. *(Texts still to be checked by the user.)*
- [x] Books home heads-up card (import, find a book, books with no date) and the "coming soon" page at `/year-in-books/:year`.
- [x] Privacy policy email line (§2.2.15a), all five locales.
- [x] Tests: sent once, who gets it, the off link only turns the switch off; `reviewer` and `argos-security`.
- [ ] Deploy, check the Resend limit, the user presses "Send heads-up".

### Phase 1 — Backend · *size S–M* · Opus high (privacy rule)
- [ ] `FinishedLogRow` gains `ReadingVisibility` and `HasReview` (and the club flag if cheap), projected in `GetFinishedRowsAsync`.
- [ ] The unfinished-books query and rule (§3.1, "Pages from unfinished books"); tests: started in the year, started before with and without a history point, DNF, audio, chapters, private, never below 0 or above the length.
- [ ] `YearInBooksCalculator` with every field of §3.1 and the reader type of §3.2; unit tests per field and per rule, plus the private-book tests.
- [ ] `GET /api/stats/year-in-books?year=` in `StatsController` → service → calculator; validation and rate limit as the other stats endpoints; integration test (own logs only, another reader's private and public books never included).
- [ ] The endpoint answers 404 before `OpensOn` except for the admin; test both sides of the date.
- [ ] `reviewer`; `argos-security` (privacy rule on private books).

### Phase 2 — Frontend: the slides · *size M*
- [ ] Copy round: slide texts and the nine reader types, Spanish and English first, then de / fr / pt-BR. User approves.
- [ ] Mockup round (on the design canvas): the four year backgrounds on 3–4 slides and the summary card, with the shade, shape and order options of §3.4. User picks before any markup.
- [ ] Types, API call, React Query hook.
- [ ] `YearInBooksPage` with the slides of §3.3, navigation, progress row, short version, 0-books page, loading and error states; route `/year-in-books/:year`.
- [ ] Tests: slides skipped when data is missing; keyboard navigation; private count line.
- [ ] `web-design` plan and screenshot critique round (`design-reviewer`).
- [ ] `reviewer`.

### Phase 3 — Share images and entry points · *size M*
- [ ] `yearCard.ts`: one card per slide kind and the summary card; unit tests (no private titles, long names wrap).
- [ ] "Share this" on every slide through `ShareCardSheet`, with the four year backgrounds in place of the photo picker.
- [ ] Books home card switches to "ready" on the opening date (until Jan 31), the sidebar item (same dates), the stats page link, the "ready" notification's text and link.
- [ ] Translations in all five locales.
- [ ] Screenshot critique round of the cards; `reviewer`.

### Verification
- [ ] **The user checks every phase locally before it's pushed** (decided 2026-11-27): the opening date set in the future (heads-up card, "coming soon", the notification) and in the past (the slides and images); the heads-up email read in Mailpit in Spanish and English, with its off link clicked; seeded readers with 0, 2 and 30 books (some private).
- [ ] `browser-check` with three seeded readers: 0 books, 2 books, 30 books with some private ones (no private title or cover anywhere, counts include them).
- [ ] Share image on a real phone: Instagram Story and WhatsApp (iPhone Safari too, `specs/share-cards.md` §2.3.4).
- [ ] Live site: the heads-up email arrives (Gmail and one other inbox, not in spam), the off link works, the notification arrives once; before Dec 9 a normal reader gets "coming soon", the admin sees the recap; on Dec 9 the card switches and "Send ready" works.
- [ ] Changelog line, What's new entry (the user), social post.

## 6. Build notes

### Phase 0 (2026-11-27)

- **The switch is a notification preference, not a column:** `NotificationGroup.NewsEmails`, stored as an override like `ClubEmails`. The one migration (`YearInBooksNews`) adds `Notifications.EmailedAt` and rebuilds the "one row per subject" index with the two new types.
- **The notices:** subject `NotificationSubjectType.Year`, id `YearSubject.IdOf(year)` (the year in the Guid's first four bytes), so "once per reader per year" is the usual unique row. They have no bell switch (`GroupOf` null): they are about the reader's own year, twice a year. Dismissing one only marks it read (it stays in the list as read, like checkpoint reminders), because deleting it would let the next press add it again.
- **Sending:** `POST /api/admin/year-in-books/{year}/send?kind=soon|ready` adds the notices, then emails each un-emailed notice whose reader has news emails on. Each email is claimed (`EmailedAt`) first, so a double press can't email twice. Emails go through `EmailQueue.EnqueueNews`: their own share (`Email:NewsDailyLimit`, 40) and never into the last 30 of the day's `DailyLimit` (`NewsLeavesForOthers`), so sign-ups keep room (argos-security). When the share runs out the send stops; **pressing again the next day emails the rest** (the box shows "Emails to send"). At ~80 readers the heads-up takes two days; start it by December 7 at the latest, since the heads-up can't be sent from the opening day on.
- **Limits on the buttons:** heads-up only before `OpensOn`, "ready" only from `OpensOn` to 14 days after (read notices are deleted 30 days after reading, so a much later press could reach a reader twice; reviewer). The year must be `OpensOn`'s year.
- **Known gap (accepted):** an email claimed and queued but lost in a restart before it's sent is never retried (the queue is in memory), as with club emails.
- **Where the app learns the date:** `GET /api/stats/summary` gains `yearInBooks {year, opensOn, isOpen}` and `booksWithoutDate`. `/stats?show=undated` opens the "no finish date" sheet (the card's link).
- **Dates:** `appsettings.json` has `YearInBooks:OpensOn = 2026-12-09`; a Render variable `YearInBooks__OpensOn` overrides it. Read as a Chile day.
- **Off link:** `/email-off#kind=news&token=…`, Data Protection purpose `NewsEmailsOff`, 90 days, at most 1000 characters; a club token doesn't work on it.
- **Reviews:** `reviewer` (no blockers; fixed the 14-day "ready" window and per-reader card dismissal) and `argos-security` (fixed: room kept for sign-ups, token length cap). Design critique: shorter card on a phone, section spacing, page heading at display size.
- **Local dev:** the dev database has 650+ readers, so a heads-up press there reaches all of them (Mailpit only).
