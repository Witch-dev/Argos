# Feature Spec — Visitors enter the app

**Status:** Planned 2026-11-20 from the user's request. Phases 1 (server), 2 (Community for visitors) and 3 (Books examples) built 2026-11-22; a What's new entry and the user's look at the live site still to do. Three phases: Phase 1 (server, size M), Phase 2 (Community for visitors and the Everyone feed in the browser, size M–L), Phase 3 (the Books tab with examples, size M).

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

Decided while building Phase 1 (2026-11-22):

- **Readers who turned discovery off stay off Everyone** (the user, after the security review). Everyone is what visitors see first, and the landing page already left them out ("asked not to be put in front of strangers"). Their things stay on their profile and in Recent reviews and writings.

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
  - Each is filled from a fixed sample list (no API call) and shown at reduced opacity with an **Example** tag. Each has a one-line explanation and one **Add your first book** button (a register link, source `home`, then back to `/books`; built as one button at the top, see Phase 3 notes).
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

### Phase 1 — Server (size M) ✅ built 2026-11-22

**Backend**
- [x] `scope` on `GET /api/feed`; anonymous allowed only for `everyone`. (2026-11-22)
- [x] `FeedService.GetEveryoneFeedAsync` with the content query and activity groups in "everyone" mode, reusing the existing visibility and block rules. (2026-11-22)
- [x] `Guid? viewerId` through `GetCountsAsync` and `BuildGroupsAsync`. (2026-11-22)
- [x] Language filter on Everyone, as on Recent reviews and writings. (2026-11-22)
- [x] Sign-up source `home`. `/about` in the sitemap. (2026-11-22)
- [x] Query plan check at live-data size. Add an index only if needed. (2026-11-22: no index, see notes)

**Verification**
- [x] Integration tests: the §3.3 list one by one, the anonymous 401 on `following`, cursor paging across reviews and activity groups, language filter. (`EveryoneFeedTests`, 2026-11-22)
- [x] `reviewer`, then `argos-security` (anonymous access to a new endpoint, privacy rules). (2026-11-22, findings fixed)

**How it was built (notes for Phases 2–3)**
- **API:** `GET /api/feed?scope=everyone` (default `following`). `languages=mine|other` as on Recent; the first page of `mine` carries `otherLanguagesCount` (capped at 100). The `other` half has reviews and writings only: activity rows have no language. `followingCount` is filled in for a signed-in reader on Everyone too, so the client can pick the default tab (under 3 → Everyone). Bad `scope` → 400 `feed.badScope`; a `before` outside 2020…now+1 day → 400 `feed.badCursor`.
- **Visitor rights, whoever asks:** an `ActivityAudience` (Following / Everyone) carries whose rules apply. On Everyone every privacy check runs as a visitor (`RightsOf` null): a follower gets nothing extra. Only blocks (both ways) and likes are the viewer's own. Admin-hidden items are left out by hand, because the `Hidden` query filter would show an author their own.
- **A sent but stale token gets 401 on Everyone too** (not the visitor view), so the app refreshes the session instead of showing a reader the feed without their blocks.
- **Rate limits** (`FeedPolicy`): visitors share `PublicPerMinute` per IP; a reader gets `ReaderEveryonePerMinute` (120) on Everyone; Following stays unlimited.
- **Activity lookback:** Everyone never falls back to a full-history scan. Its windows are 7 days, 30 days, then one year before the cursor. On a page that reviews and writings don't fill, activity rows older than that year are left out.
- **A public review in a language outside the reader's** is a card in the "other languages" half only. Its log has a card, so it gets no activity row in either half.
- **Query cost** was measured on a synthetic database far above live size: 5,000 readers, 50,000 logs (12,000 public reviews), 10,000 writings, 80,000 events.
  - The first Everyone page took 180–250 ms end to end in the test host, with EF logging on. Of that, reviews + writings were ~80 ms at the database and activity groups 50–100 ms. Reviews only: ~20 ms.
  - The content half scans every public review, because it sorts on `COALESCE(ReviewedAt, CreatedAt)`. Recent reviews already pays the same cost.
  - A partial index on that sort key didn't change the plan, so none was added.
  - If the live site grows near that size: pick the page's ids first (sorted, limited), then load the book titles and the rest only for those rows. Or cache the visitor (signed-out) pages for 30–60 s in `IMemoryCache`: without blocks or likes they are the same for every visitor.
- **Phase 2 must also:** make `/about` and `/es/about` work, since the sitemap now lists both.
- **Not covered by Everyone tests** (the rules are shared with Following and covered by `ClubAndListActivityFeedTests`): club rows (private club, left the club, private round book) and additions to someone else's open list.

### Phase 2 — Community for visitors and the Everyone switch (size M–L) ✅ built 2026-11-22

**Frontend**
- [x] Routing: `HomeGate` → `/feed` for visitors, `/about` = landing page, `SectionsLayout` and `/books` open to visitors. (2026-11-22)
- [x] `SectionSwitch` for visitors. (2026-11-22)
- [x] Feed: Following / Everyone switch for readers (default Everyone under 3 follows, then remembered), Everyone-only for visitors with the welcome line, no composer or starter block for visitors. (2026-11-22)
- [x] Sign-up box on like / comment / follow / write for visitors. (2026-11-22: hearts on cards; comments open the item, whose form already asks; no follow buttons on feed cards; no composer for visitors)
- [x] Sidebar and rail: "What is Winged Words?" link to `/about`. (2026-11-22)
- [x] Translations (five locales). (2026-11-22)

**Verification**
- [x] Vitest: `HomeGate` routes, the switch's default and memory, the visitor actions opening the sign-up box. (2026-11-22)
- [x] `browser-check`: a visitor opens `/`, lands on the Feed with real items, opens a review and a profile, taps Like and gets the sign-up box, signs up and lands back. A reader with no follows lands on Everyone. A reader with follows lands on Following. A private account's review is not on Everyone. (2026-11-22, all pass)
- [x] Screenshot critique round (`design-reviewer`), then `reviewer`. (2026-11-22: ship after one fix; reviewer findings fixed)

**How it was built (notes for Phase 3)**
- **`/books` for visitors** shows a stand-in for now: one line and **Add your first book** (`VisitorBooksHome` in `BooksHomePage.tsx`, keys `sections.booksHome.visitorLead` / `addFirstBook`). Phase 3 replaces its body with the sample shelves and can keep both keys.
- **`/` for visitors:** `HomeGate` sends them to the section they used last, Community the first time. Visitors have their own key, `argos.visitorSection`, so browsing signed out never changes a reader's `argos.section`. Only `/books` itself counts as choosing Books (opening a public list doesn't).
- **Search engines:** `/` still sends visitors to `/feed`, so the visitor's plain Feed names `/` as its canonical and allows indexing, with the site's own title and description (`usePageMeta`'s new `path` option). A filtered view (`?filter=`) stays `noindex`. `robots.txt` still disallows `/feed`; Google renders `/` itself. `/about` and `/es/about` are built copies of `index.html` (`about.html`, `es/about.html` in `vite.config.ts`) with their own canonical, hreflang and `og:url`, served by two nginx locations.
- **Following / Everyone** (`hooks/useFeedScope.ts`): a tap is kept in `argos.feedScope` (per browser, like the section). With no tap, the Feed asks Everyone first, whose answer carries `followingCount`, and moves to Following at 3 or more. That default is worked out once per page load and not stored, so a third follow changes it on the next visit. The Readings strip shows on `/feed` only on Following, and never for visitors.
- **Likes from a card** don't carry the action through sign-up (`useSignupBox`'s new `carry: false`): a list can't know which card to like on return. The box then says "Afterwards you come straight back here" without "and it's done" (`visitor.box.leadBack`).
- **The header is two rows on a phone for visitors too** now that they have the switch (the `data-one-row` rule is gone).

### Phase 3 — The Books tab with examples (size M) ✅ built 2026-11-22

**Frontend**
- [x] `VisitorBooksHome` with the sample sections, the Example tag, the explanation lines and **Add your first book**. (2026-11-22)
- [x] Translations (five locales). (2026-11-22)

**Verification**
- [x] Vitest: visitors get the examples and no API calls for shelves. (`BooksHomePage.test.tsx`, 2026-11-22)
- [x] `browser-check` and screenshot critique round at 375 and desktop, Paper and Dark. (2026-11-22, two rounds with `design-reviewer`)
- [x] `reviewer`. (2026-11-22, no blocking findings; two small ones fixed)
- [ ] A What's new entry (the user, on the admin page), and the user's look at the live site.

**How it was built**
- `pages/VisitorBooksHome.tsx` (own file, imported by `BooksHomePage`). The sample books are the landing page's `sampleBooks`, with no repeats: Reading has *Jane Eyre* with its page progress, Want-to-read has *Moby-Dick* and *Wuthering Heights*, and the Journal has *Pride and Prejudice* and *Frankenstein*, finished a few days before today. The year card's numbers are fixed (9 read, goal 24).
- **Order:** reading, year, want to read, journal. On a reader's desktop the year sits in the rail beside the books, but a visitor's rail holds the Log in card, so the year comes second in the page. On a phone it moves last (`order: 1`, which relies on `BooksHomePage.module.css` making `.page` a flex column at 640px), as it does for readers.
- **Example tag:** a neutral `Pill` right after each h2, never above it, since an eyebrow is banned. Each section has one muted line under its heading saying what the section is for (`sections.booksHome.example.*`).
- **Fade:** only the cover images fade (`grayscale(.5)` plus `opacity .6`, skipping aria-hidden backdrop images), so titles, dates and numbers keep full contrast. Dracula's bright yellow jacket stood out even when faded, so it isn't used.
- **One way in:** the band at the top (the Feed's welcome look) with the lead line and **Add your first book**. That is a register link, `authLink('register', '/books')`, not the sign-up box: it matches the Feed's Join, and `next=/books` already counts as the `home` source. On a phone the line sits above a full-width button.
- Sample books have no `to`, so there is nothing to tab into, and nothing calls the API.

## 5. Out of scope

- Changing the landing page itself (it just moves).
- A Readings strip on Everyone (see §2).
- Ranking Everyone by popularity. It is newest first. A "Popular" view already exists for reviews and writings.
