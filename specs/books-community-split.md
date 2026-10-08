# Feature Spec — Books and Community (two sections, a journal, private books)

**Status:** ✅ Done 2026-10-08 (Phases 1–4). One open item: the section names (`FUTURE-IDEAS.md`). Manual test plan: `testing/books-and-privacy.md`.

## 1. Problem

Readers on Reddit complain that book apps drift too close to social media, while other readers like that side. Winged Words today puts everything in one stream: the Feed, the Readings strip, reviews, writings, people and clubs all sit in the same sidebar, and every reader's shelves are public.

The goal: **split the app into two sections at the top**, so a reader who only wants a reading log never has to meet anyone, while the social side is always one click away and never pushed on them.

- **Books**: the reader's own reading, plus site-wide book discovery. Nothing from the people they follow.
- **Community**: reviews, writings, book clubs, people, following, news.

Two features come with it, because the split needs them:

- **A journal**: the reader's own timeline of everything they read, like Letterboxd's diary. It is the main page of Books.
- **Private books**: a book can be hidden from everyone but its owner, and switched back at any time.

A clickable mockup of the layout exists (private Claude artifact: https://claude.ai/artifact/4uNYDeVQkSVE8GHUgZZqq1). The parts that matter are described in §3.1.

## 2. Decisions

All made with the user on 2026-10-08.

- **Two sections, "Books" and "Community"**, centered at the top of every page. **Books is the default**, and the app remembers the last section each reader used. The final names are still to be reviewed (`FUTURE-IDEAS.md`, "Review the names of the app's sections"), so every label is a translation key and the names are cheap to change.
- **No off switch for Community.** It is always reachable. It just never appears inside Books. There is no setting to hide it.
- **Books holds:** the reader's own reading progress, the journal, stats, lists, "My books" (their shelves), and the books that are popular on the site.
- **Community holds:** the Feed, reviews, writings, people, clubs, news, the Readings strip of followed people, and following. What the people you follow write or review shows in Community only, never in Books.
- **Ratings and reviews are read on a book's own page**, next to the book's information. That page is shared by both sections, and is also where a reader finds people worth following (from their ratings and reviews).
- **Visibility has three levels: private, followers, public**, for each journal entry and each book.
- **The journal is a view over the existing logs**, not a copy. A reader logging a book creates the journal entry. One log is one entry, and it carries one visibility.
- **A private book is visible only to its owner.** It can be made public again, and a public book can be made private, at any time. A private book counts only in the owner's own journal and stats. It never feeds the site's popular books, the activity feed, other readers' pages, or the ratings and reviews on a book page. It does not contribute to site numbers anonymously either, because with few users someone could work out who read it.
- **A shared entry appears in Community as a feed item** ("Ana finished Dune"), using the activity history that already exists.
- **Per-book visibility ships now. Private *accounts* and follow requests come later** (`ROADMAP.md` Stage 8). Until then, "followers" protects little, because anyone can follow anyone instantly. The settings text must say so honestly (§3.6).
- **Community will look empty at the start.** Accepted. The user and the beta testers will fill it before launch. Nothing is built to hide the emptiness.

### 2.1 Decisions I made that need your check

These were not discussed. Each has a default, so building can start, but please confirm or change them.

1. ~~Default visibility of a new book.~~ **Settled 2026-10-08: the journal is public by default**, and a reader can make any entry or book private (or followers-only) whenever they want. A new book takes the reader's existing "default visibility" account setting (public for new accounts). Journal notes (`PrivateNote`) stay private to their author.
2. **Book suggestions** ("because you read X") don't exist anywhere in Argos, and recommendations are in `ROADMAP.md`'s "Not needed for launch". **Books ships with "Popular on Winged Words" and "Your want-to-read" rows. A real suggestions row is its own future spec.**
3. **Where Lists sits.** Lists are in Books, as you said, even though lists can be public and liked. Browsing other people's lists stays reachable from there.
4. **Where News sits.** In Community.
5. **"Readers to follow" box** in Community's right column (from the mockup): reuses the existing `GET /api/discover/suggested`. Optional; drop it if you prefer.

## 3. Design

### 3.1 Layout

**Top bar.** Logo on the left, search on the right, and the two section tabs in the middle. The tabs are drawn like folder tabs: the open tab is in the page colour and breaks the bar's bottom line, so it looks like one piece with the page below. The closed tab is darker and sits behind the line. Both are the same fixed width and height (150 px), so they stay symmetrical. A thin accent strip on top of the open tab marks it. The open tab uses `role="tab"` with `aria-selected`, and the bar uses `role="tablist"`. Colours come only from the existing design tokens.

**The active section follows the route**, not a stored flag:

| Section | Routes |
|---|---|
| Books | `/books` (home), `/journal`, `/stats`, `/lists`, `/lists/:id`, `/lists/browse`, the reader's own shelves at `/u/<me>` |
| Community | `/feed`, `/reviews`, `/writings`, `/people`, `/news`, `/clubs`, `/clubs/*`, `/writings/:id`, `/reviews/:id`, other readers' profiles `/u/<other>` |
| Either | `/books/:openLibraryId` (the book page), `/search`, `/settings*` |

For the "either" routes, the section stays whatever it was. It is kept in `localStorage` (try/catch, the page works without it) and in router state. The first visit, or an unreadable store, opens Books.

**Sidebar changes with the section.** Books: Home, Journal, Stats, Lists, My books, then profile, Settings, Log out. Community: Feed, Reviews, Writings, People, Clubs, News, then profile, Settings, Log out. Profile, Settings and Log out are in both. The sidebar, header and top bar are all `Layout` code; the existing off-canvas menu below 640 px keeps working, with the tabs staying visible at the top.

**Books home** (`/books`), top to bottom: *Your reading* (only your own progress tiles and the "+" tile, no friends), *Popular on Winged Words*, *Your want-to-read*, and a short *Journal* preview (latest 3 entries, "Open journal"). Right column: the reader card, a year-so-far card and the reading goal (placeholders until the stats stage, see §3.5).

**Community home** (`/feed`): today's screen, unchanged: the Readings strip of followed readers, the Feed / Writings / Reviews tabs, the composer. The right column keeps My Book Clubs and may add "Readers to follow" (§2.1).

**The Readings strip is split.** `ActivityStrip` keeps all of its behaviour for Community. Books gets a reduced version that shows only the "+" tile and the reader's own stories ("You").

### 3.2 Data

One new column, `Log.ReadingVisibility`, with the existing `ReviewVisibility` values (Public / Followers / Private) reused, and a migration. It says who can see **that this reader has read this book at all**.

Today `Log.Visibility` only covers the review (rating, text, quick questions), and the doc comment on `ReviewVisibility` says "the reading itself (the shelf status) stays visible either way". That is the gap: every shelf is public. The new column fixes that.

- **Rule: the review is never more visible than the reading.** The effective review audience is the narrower of the two. Setting a book to Private therefore hides its review too. The review's own visibility value is kept (not overwritten), so switching the book back to Public restores the review's previous setting.
- Existing rows: `ReadingVisibility` = Public for all of them, so nothing changes for anyone on migration day.
- New logs: `ReadingVisibility` takes the reader's existing default visibility account setting (§2.1 point 1). The create log request gets an optional `readingVisibility` field.
- **The journal needs no new table.** A journal entry is a `Log` plus its `ActivityEvent` history. The existing `PrivateNote` is shown in the journal as "your note", and is still visible only to its author. Nothing in this spec makes a note shareable (writings already do that).
- An `ActivityEvent` needs no change: who may see one is decided when the Feed is read (the doc comment on the class says so). It now also reads the log's `ReadingVisibility`.

### 3.3 The access rule, in one place

`ReadingAccess.CanViewReading(log, viewerId, viewerFollowsOwner)`:

| Viewer | Public | Followers | Private |
|---|---|---|---|
| The owner | yes | yes | yes |
| A follower of the owner | yes | yes | no |
| Anyone else, or logged out | yes | no | no |

Blocks still apply first, as they do today. A reader who cannot see the reading gets **404, never 403**, so its existence doesn't leak (same rule as `ReviewAccess` and `ReadingAccess`). The review rule becomes: the viewer can see the reading **and** the existing review rule passes.

There must be one SQL form (like `ReviewVisibilityQueries.ReviewVisibleTo`) and one C# form that agree, and a unit test that runs both on the same table of cases. Every query below uses the SQL form.

### 3.4 Where a private (or followers-only) book must be hidden

The spec's main risk. Each row is a place that reads logs about other people, and each gets the rule plus a test:

| Place | Today | Change |
|---|---|---|
| `GET /api/logs?userId=` (a reader's shelves) | Returns every log; only the review part is gated | Drop logs the viewer can't see |
| `GET /api/logs/{id}` | Returns any log | 404 when the viewer can't see the reading |
| `FeedService.GetActivityAsync`, the Readings strip, and `GET /api/feed/activity` | Followed readers' logs | Respect `ReadingVisibility` |
| `ReadingAccess` (likes and comments on a story) | Owner or follower | Also needs `CanViewReading`, so a private book's story can't be reached by id through likes or comments |
| Feed activity rows (`ActivityRepository`, `FeedRepository`) | By review visibility and follows | By `ReadingVisibility` as well; a list event is unchanged |
| `GET /api/books/{id}/readers` and the book page's "readers" section | Everyone who logged it | Only readers whose reading the viewer can see |
| Book page ratings, average and review list (`BookReviewsController`, `ReviewsController`) | By review visibility | By both visibilities; the **average rating and counts exclude hidden logs for everyone except the owner's own number** |
| `DiscoveryRepository` (readers like you, mood, popular readers, browse filters) | By review visibility | Both; a private book can't be used to match or recommend a reader |
| `LandingRepository` (popular books, recent reviews) and the new popular books endpoint | Public reviews | Public readings only |
| `ComparePage` (compare shelves between two readers) | Both readers' shelves | Only the books the viewer can see on the other side |
| Profile page counts and "currently reading" | Everything | What the viewer can see |
| Import (`ImportRowWriter`) | New logs take the default visibility | Unchanged, but Goodreads' private shelves should import as Private (§3.7) |
| Lists | Lists show books, not logs | No change, but a private book can still be on a public *list*. That is the reader's own choice, and the lists UI already says who sees a list |
| Profile favourites (`GET /api/users/{u}/favourites`) | Always public | A heart needs a Read log, so it proves the reader finished the book: a favourite is hidden from anyone who can't see any of its Read logs (added after the Phase 2 security review) |
| Club member progress (`ClubService`) | Members see each other's progress on the club's book | **Unchanged for now; open decision** in `bugs/club-progress-ignores-reading-visibility.md` |
| Reread numbering on reviews (`ReviewDtoMapper`) | Counted every Read log | Counts only the earlier reads the viewer can see |

The list is also written into the security review's brief, so it can be checked row by row.

### 3.5 API

- `PUT /api/logs/{id}` accepts `readingVisibility`. `GET /api/logs` and `GET /api/logs/{id}` return it **to the owner only**. Other readers never see the field.
- `PUT /api/logs/visibility` (bulk): body `{ "visibility": "Private" | "Followers" | "Public", "status": optional }`, changes all the caller's logs (optionally one shelf). Answers "I want everything I've read private."
- `GET /api/journal?cursor=&year=`: the caller's own journal, newest first, cursor-paged like the Feed. Each item: the log, `StartedAt` / `FinishedAt`, rating, progress note, private note, the `ReadingVisibility`, and the review visibility.
- `GET /api/users/{username}/journal?cursor=`: the same list for another reader, filtered by §3.3, with the notes left out. 404 when blocked.
- `GET /api/books/popular?limit=`: books ordered by how many **distinct readers** logged them in the last 30 days, counting only logs the *anonymous* viewer could see (public readings). A book with fewer than 2 such readers isn't listed, to avoid exposing a single reader's choice. Cached for a few minutes (it is the same for every visitor). Reuses the `LandingRepository` popular books query, which already does most of this, with the new rule added.
- The reader's own stats ("books read this year", per month) come from `GET /api/stats/summary`, a small endpoint over the caller's own logs, including private ones. **The full stats page is Roadmap Stage 9**, not this spec; Books home only shows a year-so-far card until then.
- New error codes in `ErrorCodes.cs` and translations under `errors.codes` for any new validation message (an invalid visibility value, an invalid year filter).

### 3.6 Frontend

- **Top bar:** new `SectionSwitch` component (tabs with the folder styling in §3.1), a `useSection()` hook (route → section, with the remembered fallback), and `Sidebar` rendering a different link set per section.
- **Books home, Journal and Stats-placeholder pages**, lazy-loaded like the rest.
- **Journal page:** entries grouped by month, newest first. Each row: cover, "Started / Finished / Stopped *Title*", dates, rating, your note, and a visibility control (Private / Followers / Public) that saves on change. A "make all private" action in the page menu, with a confirmation inside the page (no browser dialogs). Another reader's journal (from their profile) shows only what the viewer may see, with no controls.
- **Log form and the book page's log control:** a "Who can see that you read this" choice with the three levels, and a lock icon on private books in shelves, with an `aria-label`. Wherever a log is edited today (`BookDetailPage`, the import page's results) the field is added once, in a shared component.
- **Settings → Privacy** (`PrivacySettings.tsx`): the existing "default visibility" setting gets a second line for new books, and a bulk "make all my books private / public". It must state honestly: *"Followers" means people who follow you. Anyone can follow you right now, so choose Private if you don't want others to see it.* (Until follow requests ship.)
- **Community feed:** no layout change. A feed item from a shared journal entry reads as today's finished or started rows. The mockup's "shared from his journal" label is optional and skipped unless it is cheap.
- **Translations:** every new string, `aria-label` and placeholder goes through `t('…')` with keys in all five `web/src/locales/<lang>/` files. The section names are keys (`sections.books`, `sections.community`), so a rename is a translation edit.
- **Styling:** only design tokens from `web/src/index.css`, in all five themes. Folder tabs and the accent strip use `--accent`, `--border`, `--bg`, `--bg-elevated`. The `web-design` skill has the rules.
- **Phone width:** the two tabs stay visible and reachable at 360 px, and the page never scrolls sideways. The sidebar stays an off-canvas panel below 640 px.

### 3.7 Imports

`ImportRowWriter` creates logs through `LogService`, so it takes the default visibility. Goodreads' private shelves already import as private *lists* (`specs/book-import.md`). For books that came from a shelf the reader marked private there, `ReadingVisibility` is set to Private. If the export has no such signal, nothing changes. **Checked in Phase 4: the Goodreads export has no such signal** (Goodreads has no per-shelf privacy, and none of its columns carries one), so imported books simply take the default.

## 4. Out of scope

- **Private accounts and follow requests** (`ROADMAP.md` Stage 8). This spec makes the per-book half true; the account half stays later.
- **A real "suggested books" row**, recommendations, mood and trope browsing.
- **The full stats page** (graphs, goals, top authors: `ROADMAP.md` Stage 9). This spec only shows a small placeholder card.
- **Sharing a journal note as its own post.** Notes stay private; writings already cover public text.
- **Naming review** of "Books" / "Community" / "Writings" (`FUTURE-IDEAS.md`).
- **Notifications.** Community stays quiet; nothing in Books tells a reader anything happened in Community.
- **Hiding Community behind a setting.** Deliberately not built (§2).

## 5. Tasks

### Phase 1 — The two sections (frontend only)

Visible change, no data change. Can ship alone.

**Frontend**
- [x] `useSection()` hook: route → section, remembered fallback in `localStorage` (try/catch) and router state, defaults to Books
- [x] `SectionSwitch` in the header: folder-style tabs, equal fixed size, accent strip on the open tab, `role="tablist"` / `aria-selected`, keyboard arrows
- [x] `Sidebar`: link set per section (§3.1)
- [x] New routes `/books` (home shell), `/journal` and `/stats` placeholders; `HomeGate` sends logged-in readers to the remembered section
- [x] Reduced `ActivityStrip` for Books (own stories only)
- [x] Translations for all new text in the five languages; `locales.test.ts` green
- [x] Phone width: tabs stay visible, nothing scrolls sideways; checked in all five themes (Phase 4 pass)

**Verification**
- [x] Tests: section from route, remembered section, sidebar per section, tabs' aria state
- [x] Browser check (`browser-check`): both tabs, all five themes, 360 px, light and dark (Phase 4 pass)

_Built 2026-10-08, reviewed. Known gaps: no Books right column (reader card, year card, goal) until Phase 3; "My books" links to `/u/<me>` like the profile link; plain `/` now redirects logged-in readers; `/u/<me>/compare` counts as Community. Browser check done in Phase 4._

### Phase 2 — Reading visibility (backend)

**Backend**
- [x] `Log.ReadingVisibility` + migration (existing rows Public); `CreateLogRequest` / `UpdateLogRequest` fields; default from the account setting
- [x] `ReadingAccess.CanViewReading` and the matching SQL filter, with a table-driven test that both agree
- [x] Review rule: effective review audience is the narrower of the two
- [x] Every row of §3.4, each with a test (owner, follower, stranger, logged-out, blocked)
- [x] `PUT /api/logs/visibility` (bulk)
- [x] Error codes and translations for new validation messages

**Verification**
- [x] Ask `reviewer`, then `argos-security` (this is privacy): go through §3.4 row by row. Fix findings.

_Built 2026-10-08, reviewed. How it works:_
- _One rule, two forms: `ReadingAccess.CanViewReading` (C#) and `ReadingVisibleTo` (SQL, in `ReviewVisibilityQueries`). `ReviewAccess.CanView` / `ReviewVisibleTo` now require the reading rule too, so every review surface got the "narrower of the two" rule at once. `LogVisibilityRuleTests` runs both forms on all 9 setting pairs × 4 viewers; `ReadingVisibilityTests` covers the §3.4 rows._
- _New logs take `DefaultReviewVisibility` for the reading as well, including imports and a log created by a club rating (which now also takes it for the review). `GET /api/logs/{id}` now applies blocks. The bulk endpoint rejects a missing `visibility` rather than defaulting to Public._
- _Feed activity rows stay "by review visibility **and** reading" (§3.4's "as well"): a Public book with a Private review still has no "finished" row in the Feed, though the Readings strip shows it. The reviewer suggested showing the row without the stars; **decide in Phase 3**, since the journal makes the two settings visible side by side._ **Settled 2026-10-08 (Phase 3): the row shows, without the stars.**
- _Kept as before: Followers-level ratings still count in the anonymous rating summary and "Readers say", as Followers-level reviews already did; editing someone else's log still answers 403 (log ids are random); the stored `IsReread` flag on a visible review can hint that an earlier, hidden read exists._

### Phase 3 — Books home and the journal

**Backend**
- [x] `GET /api/books/popular` (public readings only, at least 2 readers, 30 days, cached)
- [x] `GET /api/journal` and `GET /api/users/{username}/journal`
- [x] `GET /api/stats/summary` (own logs, including private)

**Frontend**
- [x] Books home: your reading, popular, want-to-read, journal preview, stats card
- [x] Journal page with the per-entry visibility control and "make all private"
- [x] A reader's journal on their profile, filtered
- [x] Visibility choice in the log form and book page; lock icon on private books
- [x] Privacy settings: default for new books, bulk change, honest "followers" wording
- [x] Translations; tokens only

**Verification**
- [x] Tests for the endpoints and pages
- [x] Browser check as two readers: set a book private, confirm the other reader sees nothing of it in Feed, Readings strip, profile, shelves, the book page's readers, ratings and popular; switch it back and confirm it returns
- [x] `reviewer` after the phase

_Built 2026-10-08, reviewed and security-reviewed (no bugs; small fixes applied). How it works:_
- _**Feed rows (decision 2):** a reading the viewer may see now gets its activity row unless its review card is visible to them; a hidden review leaves the row, without the stars (`ActivityEventRow.ShowRating`). Likes on rows follow the same rule._
- _**Journal:** `GET /api/journal` and `GET /api/users/{username}/journal` page with `before`/`beforeId` (the Feed's cursor, not `cursor=`), newest first by `FinishedAt ?? StartedAt ?? CreatedAt`; want-to-read isn't an entry; `?year=` filters on that date (UTC). Others get no notes and no privacy fields, and a rating only when the review is visible. 404 when the owner has blocked the viewer (one-way, like the profile)._
- _**New endpoint** `PUT /api/logs/{id}/visibility` for the journal's per-entry control, because `PUT /api/logs/{id}` replaces the whole log._
- _**Popular:** `GET /api/books/popular` reuses the landing query (public readings of discoverable readers, ≥ 2 readers, books with covers), 30 days, cached 5 minutes, so a book made private can stay counted for up to 5 minutes._
- _**Stats:** `GET /api/stats/summary?year=` counts Read logs by `FinishedAt` (UTC year), plus shelf sizes. Not the same definition as the journal's year filter; Stage 9 should pick one._
- _**Settings:** one account default covers new books and new reviews (as Phase 2 built it), so §3.6's "second line" is the relabelled setting plus the honest followers note; "All your books at once" changes every book after an in-page confirmation._
- _**Frontend:** Books home (own strip, popular row, want-to-read row, 3-entry journal preview); the right column follows the section (Books: reader card, year card, goal placeholder); `/journal` with month groups, per-entry control and "Make all private"; a Journal tab on profiles; "Who can see that you read this?" in `LogForm`; a lock on your own private books in shelves._
- _**Browser check** (two readers, side ports): B's book made private from the journal vanished for A from B's shelves, B's journal tab, A's Feed and the book page's readers, and came back when made public. Readings strip and ratings covered by integration tests only. Screenshots: Paper and Dark, 1280 and 360 px, no sideways scroll._

### Phase 4 — Community touches and wrap-up

**Frontend**
- [x] Optional "Readers to follow" card in Community's right column (already there, see below)
- [x] ~~Optional "shared from journal" label on feed items~~ Skipped (see below)
- [x] Goodreads private-shelf books import as Private, if the real export carries the signal (§3.7): it doesn't, nothing to build

**Verification & docs**
- [x] Full browser pass on desktop and phone, all five themes
- [x] Update `SPEC.md` §4 and `ROADMAP.md`; add the `CHANGELOG.md` line
- [x] Write a manual test plan (`test-plan` skill) for the privacy rules
- [ ] Move the "Review the names" idea out of `FUTURE-IDEAS.md` once decided (not decided yet; stays open, doesn't block anything)

_Done 2026-10-08. What it came to:_
- _**Readers to follow:** Community's right column already had it: `SuggestedAccounts` ("People you may know") calls `/api/follows/suggestions`, the same mutual-follow query as `/api/discover/suggested`, and Phase 3 left it in Community only. Like before, it hides itself when there is nobody to suggest (a reader who follows nobody, or whose follows follow nobody)._
- _**"Shared from journal" label:** skipped. Every started or finished row in the Feed is a journal entry, so the label would be on every such row and say nothing new._
- _**Goodreads privacy:** no signal in the export (columns in `specs/book-import.md` §3.2, checked against a real export there)._
- _**Browser pass** (side ports, two fresh readers, A follows B, each with a private book): `/books`, `/journal`, `/feed`, B's profile and Settings, in all five themes at 1280 and 360 px. Every page: both tabs present and on screen, the right one `aria-selected`, no sideways scroll. → arrow switches tabs; Settings keeps the last section; B's private book absent from A's Feed, Readings strip (2 stories, not 3), B's shelves and B's "read this year". **Found and fixed:** the phone menu panel stopped after its links instead of reaching the bottom of the screen, because browsers now apply the desktop `align-self: flex-start` to the fixed drawer (older than this spec). `Sidebar.module.css` sets `align-self: stretch` below 640 px and adds a `--border` edge so the panel stands out in dark themes._
- _**Manual test plan:** `testing/books-and-privacy.md` (52 steps), with `testing/_shared.md` for the checks every page needs._
