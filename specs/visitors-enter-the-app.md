# Feature Spec — Visitors enter the app

**Status:** Planned 2026-11-20 from the user's request. Not built. Three phases: Phase 1 (server, size M), Phase 2 (Community for visitors and the Everyone feed in the browser, size M–L), Phase 3 (the Books tab with examples, size M).

## 1. Problem

The user, 2026-11-20: "when people get into the site there is too much information … we are trying to convince people the wrong way". Today a signed-out visitor who opens `wingedwords.app` gets the landing page (`specs/landing-page.md`): a pitch, a Books / Community switch with examples, feature cards and a list of promises. They read about the app instead of using it.

What we want instead: the visitor walks straight into the app, the same frame a reader sees, with the **Books** and **Community** tabs at the top.
- **Community** is full of real content: every review, writing and reading update from public accounts.
- **Books** is the reader's own space, so for a visitor it is empty. It shows faded examples that explain each part ("this is where your journal goes") and asks them to add their first book.

The real site convinces better than a page that describes it.

What already exists (checked 2026-11-20):
- `/` is `HomeGate` (`web/src/pages/HomeGate.tsx`): `LandingPage` for visitors, a redirect to `/books` or `/feed` for readers.
- Visitors can already open reviews and writings (`GET /api/reviews`, `GET /api/writings`, the Recent and Popular sections), book, author, list, club and profile pages, and the club directory. Each has the sign-up box (`SignupBox` / `useSignupBox`, `specs/shareable-pages.md`).
- **Not** open to visitors: the Feed (`GET /api/feed` and `GET /api/feed/activity` are `[Authorize]`, and the `SectionsLayout` route that holds Feed / Writings / Reviews sits inside `ProtectedRoute`), the Books home, Journal and Stats.
- The Feed today shows only you and the people you follow (`FeedService.GetFeedAsync` builds an author-id list from `Follows`). A new reader who follows nobody gets the starter block (`STARTER_FOLLOW_THRESHOLD = 3` in `FeedPage.tsx`).
- The header hides the Books / Community switch (`SectionSwitch`) for visitors (`layout/Header.tsx`).

## 2. Decisions

Asked and answered 2026-11-20:

- **The landing page moves to `/about`.** It keeps its content and is still indexed. Visitors get a small "What is Winged Words?" link in the sidebar and in the rail's sign-up card. Links shared in posts keep working, because `/` now shows the app.
- **Visitors start on Community** (the Feed). Books is one tap away. Signed-in readers keep today's rule: the tab they used last, Books the first time.
- **An Everyone feed, for visitors and readers.** The Feed gets a **Following / Everyone** switch.
  - Visitors see only Everyone, with no switch.
  - A signed-in reader who follows fewer than 3 readers starts on Everyone. Otherwise they start on Following. After that, the app remembers their last choice (in the browser, like the remembered tab).
- **Everyone** = reviews, writings and reading-update rows (activity groups) from **public accounts only**, newest first.
  - Left out: private accounts, anything whose own visibility is Followers or Private (including private books), content an admin hid, suspended or banned readers, and, for a signed-in reader, anyone they blocked or who blocked them.
  - These are the same rules the Recent reviews and writings sections already apply to visitors. The server reuses them, it does not write new ones.
- **The Books tab for visitors is a faded sample shelf.** It is the real Books page laid out the same way, filled with public-domain classics (the bundled landing-page covers: *Pride and Prejudice*, *Frankenstein*, *Jane Eyre*…). Everything is faded and marked **Example**. Each section has one short line saying what it is for, and an **Add your first book** button that opens the sign-up box.

Defaults chosen while writing the spec (change any before building):

- **Everyone follows the reader's languages**, like Recent reviews and writings (`specs/content-language.md`). Visitors get the site language. A "Show posts in other languages" link at the end works as it does there.
- **No "new books by authors you follow" rows on Everyone.** Those belong to the reader.
- **The Readings strip (stories) stays on Following only** in this spec. On Everyone it is hidden, because a strip of strangers' stories needs its own rules (who gets picked, how many). Logged in `FUTURE-IDEAS.md` if the user wants it later.
- **Visitors can open everything on the feed** (review, writing, book, profile, comments). Liking, commenting, following and writing open the sign-up box with a matching line ("Create a free account to like this review"). After sign-up the action is not done automatically, except where `specs/shareable-pages.md` already does it (follow, want-to-read). A like is too small to be worth a new sign-in action.
- **Sign-ups started on the Feed or the Books examples count as `home`** in Admin stats ("Sign-ups from shared pages"), a new source next to `book`, `list`, `club`….
- **Search engines:** `/` keeps the site's title and description, and `/about` gets the landing page's. `/feed` stays `noindex` like other app pages (`specs/search-engines.md`). The sitemap gains `/about`.
- **The rail's "Log in" card** stays on Feed and Books for visitors, and gains the "What is Winged Words?" link.

## 3. Design

### 3.1 Server

- `GET /api/feed` gains `scope=following|everyone`. Following stays the default, so the current client keeps working.
  - `scope=everyone` allows anonymous callers. `[Authorize]` moves off the action, and `scope=following` without a login still answers 401.
  - The page size and cursor are as today. `FollowingCount` is 0 for visitors.
- `FeedService.GetEveryoneFeedAsync(Guid? viewerId, kinds, timeZone, cursor, pageSize, languageFilter)`:
  - Content: a new `IFeedRepository` query like `GetFeedContentByUserIdsAsync`, but with "public account and public item" instead of an author list. It reuses the visibility predicate the Recent reviews and writings queries already use, plus the block filter when `viewerId` is set.
  - Activity groups: `IActivityRepository.GetGroupsAsync` gains an "everyone" mode with the same public-only rule (public account, public book, no private books). The lookback windows (`ActivityLookbacks`) still bound it, because without an author list a full-history scan is the expensive case.
  - No author releases.
- `FeedService.GetCountsAsync` takes `Guid? viewerId` (`ViewerHasLiked` false for visitors).
- `ActivityService.BuildGroupsAsync` takes `Guid? viewerId`. It shows only what a visitor may see of each group, the same check the profile page uses for a stranger.
- **Query cost:** Everyone has no author list, so it leans on the indexes on `CreatedAt` of reviews, writings and logs. Check the query plan on a copy of the live data size. If a page takes over 200 ms, add a partial index on public rows. Visitors get the same rate limit as other anonymous reads.
- `SharedPageSignups`: `next=/` (or `/feed`, `/books`) maps to the source `home`.
- `SeoController`: `/about` goes in the sitemap.

### 3.2 Browser

- **Routing** (`App.tsx`, `HomeGate.tsx`):
  - `HomeGate` stops rendering `LandingPage`. Visitors are sent to `/feed`, readers to their remembered section as today. A visitor who used Books last goes to `/books`.
  - `/about` renders `LandingPage`, full width, outside `Layout` as now.
  - The `SectionsLayout` route (Feed / Writings / Reviews) becomes `ProtectedRoute allowVisitors`, and so does `/books`.
  - Journal and Stats stay readers-only.
- **Header:** `SectionSwitch` shows for visitors too.
- **Feed** (`FeedPage.tsx`):
  - The Following / Everyone switch is a segmented control above the filter chips (All / Reviews / Writings / Updates), built from existing pieces and tokens.
  - Visitors get no switch and no composer. A one-line welcome sits at the top instead: "Real readers, real reviews. Join to share yours." with a **Join** button.
  - The starter block (follow suggestions) stays on Following only.
  - Like / comment / follow buttons on cards call `useSignupBox` when signed out.
- **Books tab for visitors** (`BooksHomePage.tsx` → a `VisitorBooksHome` component in the same file or beside it):
  - The same sections in the same order: currently reading, want to read, journal, year so far / goal.
  - Each is filled from a fixed sample list (no API call) and shown at reduced opacity with an **Example** tag. Each has a one-line explanation and one **Add your first book** button (sign-up box, source `home`, then back to `/books`).
  - The sample books reuse the bundled covers from `LandingPage` / `public/landing/`.
- **Sidebar:** for visitors, a "What is Winged Words?" link to `/about` under Log in / Join.
- **Translations:** every new text in all five locale files.
- **Design:** `PRODUCT.md`, `DESIGN.md` and the `web-design` skill first. Short plan, then a screenshot critique round, at 375 and desktop, in Paper and Dark.

### 3.3 Privacy check (for `argos-security`)

Every item on Everyone must be one a signed-out visitor could already reach by opening that reader's profile. The tests must show that none of these ever appear:
- a private account's review, writing or update
- a Followers-only or Private review or writing
- a private book's log or progress
- an admin-hidden item
- a suspended reader's items
- for a signed-in viewer, a blocked reader's items, in both directions

## 4. Tasks

### Phase 1 — Server (size M)

**Backend**
- [ ] `scope` on `GET /api/feed`; anonymous allowed only for `everyone`.
- [ ] `FeedService.GetEveryoneFeedAsync` with the content query and activity groups in "everyone" mode, reusing the existing visibility and block rules.
- [ ] `Guid? viewerId` through `GetCountsAsync` and `BuildGroupsAsync`.
- [ ] Language filter on Everyone, as on Recent reviews and writings.
- [ ] Sign-up source `home`. `/about` in the sitemap.
- [ ] Query plan check at live-data size. Add an index only if needed.

**Verification**
- [ ] Integration tests: the §3.3 list one by one, the anonymous 401 on `following`, cursor paging across reviews and activity groups, language filter.
- [ ] `reviewer`, then `argos-security` (anonymous access to a new endpoint, privacy rules).

### Phase 2 — Community for visitors and the Everyone switch (size M–L)

**Frontend**
- [ ] Routing: `HomeGate` → `/feed` for visitors, `/about` = landing page, `SectionsLayout` and `/books` open to visitors.
- [ ] `SectionSwitch` for visitors.
- [ ] Feed: Following / Everyone switch for readers (default Everyone under 3 follows, then remembered), Everyone-only for visitors with the welcome line, no composer or starter block for visitors.
- [ ] Sign-up box on like / comment / follow / write for visitors.
- [ ] Sidebar and rail: "What is Winged Words?" link to `/about`.
- [ ] Translations (five locales).

**Verification**
- [ ] Vitest: `HomeGate` routes, the switch's default and memory, the visitor actions opening the sign-up box.
- [ ] `browser-check`: a visitor opens `/`, lands on the Feed with real items, opens a review and a profile, taps Like and gets the sign-up box, signs up and lands back. A reader with no follows lands on Everyone. A reader with follows lands on Following. A private account's review is not on Everyone.
- [ ] Screenshot critique round (`design-reviewer`), then `reviewer`.

### Phase 3 — The Books tab with examples (size M)

**Frontend**
- [ ] `VisitorBooksHome` with the sample sections, the Example tag, the explanation lines and **Add your first book**.
- [ ] Translations (five locales).

**Verification**
- [ ] Vitest: visitors get the examples and no API calls for shelves.
- [ ] `browser-check` and screenshot critique round at 375 and desktop, Paper and Dark.
- [ ] `reviewer`. Then a What's new entry (the user, on the admin page), and the user's look at the live site.

## 5. Out of scope

- Changing the landing page itself (it just moves).
- A Readings strip on Everyone (see §2).
- Ranking Everyone by popularity. It is newest first. A "Popular" view already exists for reviews and writings.
