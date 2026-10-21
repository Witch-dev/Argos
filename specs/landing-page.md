# Landing page (the "front door" for logged-out visitors)

## Problem

A first-time visitor who opens Toffee's address sees a login form and nothing else. Right now `/` is the Feed behind `ProtectedRoute` (`Apollon/web/src/App.tsx`), so anyone who isn't logged in is sent straight to `/login?next=/`. They never learn what Toffee is, what it does better than Goodreads or StoryGraph, or why they should make an account.

The closed beta makes this urgent. Invited readers will forward the link to friends, and every one of them will land on a password box.

What we want: when a logged-out visitor opens `/`, they see a short page that explains Toffee in one sentence, shows what the app actually looks like, and points them to **Join** or **Log in**. Logged-in readers still get their Feed at `/`, exactly as today. Letterboxd works the same way, and Toffee is meant to be "Letterboxd for books".

Background research (what works on landing pages in 2026 and how comparable apps do it) was done in the conversation that produced this spec. The main points:

- Show the **real product**, not abstract illustrations.
- Put **one clear sentence and one main button** at the top.
- Use **plain words**.
- Design for **phones first**.
- Keep it **fast**.

## Clarifying decisions

Asked and answered on 2026-10-06.

- **Name on the page: Toffee.** The app was renamed from Argos on 2026-09-30, for user-facing text only (see `CHANGELOG.md`). Internal names (`Argos.Api`, `argos_token` and so on) stay as they are.
- **Two phases.**
  - **Phase 1** is a page with no live data, ready for the closed beta (Roadmap Stage 4).
  - **Phase 2** adds rows of real community content (book covers and public reviews) before public launch. It waits until moderation (Stage 7) and private accounts (Stage 8) exist, because today every reader's shelves are visible to everyone.
- **Pitch sentence:** "Track your reading, and read together — spoiler-free." This is the draft from `FUTURE-IDEAS.md` ("One-sentence pitch"), so that idea is now decided.
- **Its own full-width page.** No sidebar and no right panel. A slim top bar has the Toffee logo, **Log in** and the main join button. It feels like a front door and works better on phones.
- **Product pictures are live mini-components, not screenshots.** Small React components styled with the app's own design tokens and filled with made-up sample data. Because they use the real styles, they always match the current design and the visitor's theme. They never call the API (see Design §3).
- **Four feature cards**, one per strength:
  1. Spoiler-safe book clubs
  2. Highlight comments
  3. Reading and writing in one place
  4. Lists with friends
- **The main button follows the invite-only setting.**
  - While sign-up is invite-only: the button says "Have an invite? Join", next to a short line saying Toffee is in private beta.
  - Once the setting is turned off at public launch: the button says "Join free".
  - The page reads the **same setting** the register endpoint enforces, so the two can never disagree.
- **Theme follows the visitor**, like the rest of the app. Paper is the default, Dark applies when their system is dark, and a theme they picked before is kept. No special landing-page colours.
- **The Toffee dog appears in the opening section**, as a larger version of `public/logo-mark.png` next to the pitch. The 24 dachshund avatars are **not** used in the sample content.
- **Sample books are public-domain classics**, such as *Pride and Prejudice*, *Frankenstein* and *Jane Eyre*. Their cover images are bundled with the app, so the page never calls Open Library and never uses a living author's book to advertise Toffee.
- **Features that aren't built yet are added only when they ship.**
  - Phase 1 has only the "Independent, not owned by Amazon" trust line.
  - "Import from Goodreads in 2 minutes" is added when Roadmap Stage 2 ships.
  - "Export your data any time" is added when Stage 6 ships.

## Design

### 1. Routing: who sees what at `/`

Today the `index` route sits inside `<Layout>` and renders `<ProtectedRoute><FeedPage /></ProtectedRoute>`.

The new routing:

- A new `HomeGate` component replaces that `index` route. It moves **outside** the `<Layout>` route, so the landing page can be full-width with no sidebar.
- `HomeGate` reads `useAuth()`:
  - **Still loading** (`isLoading`): show the same `LoadingMessage` that `ProtectedRoute` shows. This stops a logged-in reader from seeing the landing page flash before their Feed appears.
  - **Logged out** (not authenticated, no `sessionError`): render `<LandingPage />`.
  - **Anything else** (logged in, or `sessionError`): render the Feed exactly as `/` does today, meaning `Layout` around `ProtectedRoute` around `FeedPage`. `ProtectedRoute` keeps handling the "couldn't reach the server, try again" case, so the landing page never appears for a reader who is still signed in.
- `Layout` currently renders only `<Outlet />`. It gains an optional `children` prop, used when there is no outlet, so `HomeGate` can wrap `FeedPage` in it. This is a smaller change than nesting a second layout route.
- `/feed`, `/login`, `/register` and all other routes stay as they are.
- `/login` is not redirected to the landing page. Links that point straight at `/login?next=…` keep working.
- Logging out keeps its current behaviour. Where the reader lands afterwards is out of scope (see below).

### 2. Page structure (Phase 1)

New file `pages/LandingPage.tsx` with `LandingPage.module.css`. Sections from top to bottom:

| # | Section | Content |
|---|---|---|
| 1 | **Top bar** | Toffee logo on the left (links to `/`). **Log in** (text link) and the main join button on the right. |
| 2 | **Opening section** | The mascot, the pitch "Track your reading, and read together — spoiler-free.", one supporting line (for example "Log every book, rate it in half stars, and talk about it with friends without spoiling the ending"), the main join button and **Log in**. While invite-only is on, the private-beta line goes under the button. A demo log card (a book cover, half-star rating, "Reading — page 214 of 380") sits beside the text on desktop and below it on phones. |
| 3 | **Four feature cards** | One card per strength. Each has a short heading, one or two plain sentences and its demo component (§3). They alternate left and right on desktop and stack on phones. |
| 4 | **The basics** | A compact checklist: half-star ratings, a "Did not finish" shelf, mood / pace / content warnings, five reading themes including dark, privacy setting on every review. |
| 5 | **Trust** | "Independent. Not owned by Amazon. No ads, and we don't sell your data." Before publishing, check this against the privacy policy from Stage 4 and drop any claim the policy doesn't back up. |
| 6 | **Closing section** | The pitch repeated in short form with the main join button. |
| 7 | **Footer** | Links to privacy policy and terms once Stage 4 has created them, plus Log in. |

**Copy rules.** Short sentences, everyday words and no jargon. Say "people you follow", not "social graph". The page doesn't name competitors. Saying clubs are "free" is fine, but "StoryGraph charges for this" is not.

**Phone layout.** The page is designed for phone width first, using the app's existing breakpoints. It must not scroll sideways. The main button stays at least 44px tall.

**Speed.** `LandingPage` is lazy-loaded the same way other pages are (hardening phase 3 split the bundle). Logged-in readers therefore don't download it, and logged-out visitors don't download the Feed. Bundled covers are small WebP files, each under about 30 KB.

### 3. Live mini-components

These live in a new folder `pages/landing/`, one file per demo, plus `landingSamples.ts` for the sample data.

**Hard rule: they never fetch, mutate or read auth.** They are drawn only from static sample data. The page therefore loads instantly, sends nothing to the API for anonymous visitors and has no 401s to handle. It also keeps working if the API is down.

**Reuse first.** Build them from existing presentational components:

- `BookCover`
- `Avatar` (initials fallback, since the dog avatars aren't used)
- `StarRating` (read-only when `onChange` is omitted)
- `ListCoverStack`
- `SpoilerText`

All of these were checked on 2026-10-06 and none of them fetch. `MemberProgressBar` has one reference to `api/`, so check it before reusing it. If it only imports a type, it's fine. Otherwise copy the bar's styling, not the component.

Components that fetch or need a logged-in user must **not** be reused. That includes `AnnotatableText`, `FeedItemCard`, `RoundRating` and the like/follow buttons. For these, the demo copies their look using the same CSS tokens.

| Demo | What it shows | Interaction |
|---|---|---|
| `DemoLogCard` (opening section) | Cover, title/author, half-star rating, reading progress | None |
| `DemoClub` (spoiler-safe clubs) | A club reading *Frankenstein* with a checkpoint "Chapters 1–10, due Friday", member progress bars, and one comment shown as "Hidden until you reach page 120" | Tap the hidden comment to see a short "No spoilers. You'll see it when you get there." message. Nothing is revealed. |
| `DemoHighlight` (highlight comments) | A short review paragraph with one sentence highlighted and a comment bubble next to it, in the Genius style | Click or tap the highlight to open its comment, the same gesture as the real feature (which opens on click, not hover). Works with the keyboard (focusable `mark`, Enter opens it). |
| `DemoWriting` (reading + writing) | A quoted passage from *Pride and Prejudice* linked to its book card, with a short note under it | None |
| `DemoList` (lists with friends) | A ranked list "Gothic novels to read in October" with three covers, two collaborator avatars and "3 of 7 read" challenge progress | None |

**Accessibility.** Each demo sits in a `<figure>` with a visually hidden `<figcaption>` describing it, for example "Example of a book club checkpoint". Read-only demos contain no links or buttons that would do nothing. The only interactive parts are the two above, and both are reachable by keyboard.

**Sample data.** Everything lives in `landingSamples.ts`:

- **Books:** about 6 classics with title, author and a bundled cover import.
- **Readers:** 4–5 sample readers with made-up first names and handles. Check that each handle is reserved or isn't a real account at the time of writing.
- **Text:** the review text, comments and list.

**Covers.** Bundled under `web/src/assets/landing/covers/`. Even when a book is public domain, a *modern edition's* cover art can still be under copyright. So pick covers whose **artwork is itself public domain**, such as scans of first or early editions from Wikimedia Commons. Record each image's source URL and licence in `web/src/assets/landing/covers/SOURCES.md`.

### 4. Invite-only setting for the button

Roadmap Stage 1 adds an "invite-only sign-up switch". The landing page needs to **read** that switch, so this spec defines the read side. Whichever of the two is built first creates the setting, and the other reuses it.

- **Setting:** `Registration:InviteOnly` (bool, default `false`) in `appsettings`, bound to an options class. The register endpoint (Stage 1) enforces it, and this endpoint only reports it.
- **Endpoint:** `GET /api/auth/registration-status` → `{ "inviteOnly": true }`.
  - Anonymous and read-only.
  - Covered by the existing rate limiter like other anonymous auth endpoints.
  - Exposes nothing except that one flag.
- **Frontend:** `getRegistrationStatus()` in the API client and a `useRegistrationStatus()` React Query hook with a long `staleTime`, because the value changes about once, at launch.
  - While it loads, or if it fails, the button shows "Join free" and links to `/register`. The register page enforces the invite rule anyway, so the worst case is someone without an invite being told at the register step.
  - When `inviteOnly` is true, the button says "Have an invite? Join" and the private-beta line appears.

**Exception to the no-API rule.** This is the only API call the landing page makes. It needs no login.

### 5. Link previews (Phase 1)

People will share the address in chats. Add to `index.html`:

- `<meta name="description">`
- Open Graph tags: `og:title`, `og:description`, `og:image`, `og:type`
- `twitter:card`

They use the pitch as the description. `og:image` is a 1200×630 `public/og-image.png` made from the mascot plus the pitch.

These tags are static and apply to every route. That's fine because they describe Toffee in general. Per-page previews for book or review pages belong to the separate SEO/SSR question in SPEC.md §10 and are not part of this spec.

### 6. Phase 2: live community rows

Added before public launch, **only after Stage 7 (moderation) and Stage 8 (private accounts) are done**.

**New section** between the feature cards and the basics checklist, titled "What readers are into this week":

1. **Popular this week:** one row of book covers. These are the books that the most *different readers* logged in the last 7 days. Only books with at least 2 different readers count, so one person can't put a book there.
2. **Recent reviews:** 3 review cards. Each shows the book cover, star rating, reader name and avatar, and the first ~200 characters of the review.

**Backend: `GET /api/landing/showcase`.** Anonymous. It returns both lists and is **cached on the server for 10 minutes** with `IMemoryCache`, since every visitor hits the same data.

**Privacy and safety rules.** These are the main point of Phase 2, and each needs a test.

- **A review is eligible only if all of these are true:**
  - its visibility is **Public**;
  - it is **not** spoiler-flagged and has no inline `||spoiler||` text;
  - its author is **not** a private account (Stage 8) and is not "not discoverable";
  - its author is not suspended, and the review is not hidden by moderation (Stage 7).
- **Popular-books counts** use only logs from accounts that aren't private.
- **Blocks don't apply.** The visitor is logged out, so there is nobody to block.
- **Minimum size.** If there are fewer than 4 popular books or fewer than 2 eligible reviews, the endpoint returns an empty list for that part and the frontend **hides** it. The page never shows a half-empty row.

**Links.** Covers link to `/books/:id`, which is already public. Each review card links to its review page, but only if that page is readable while logged out. Check this when building. If it isn't, the card doesn't link.

**Loading.** Phase 2 adds a second API call to the page. The section loads after the static content and shows nothing while loading, not a spinner. If the call fails, the section is hidden.

### 7. Copy added when other features ship

| When | Add |
|---|---|
| Stage 2 (Goodreads/StoryGraph import) ships | A section after the opening section: "Bring your books. Import your Goodreads or StoryGraph library in about 2 minutes. Ratings, shelves, dates and reviews come with you." Use the real numbers from the import feature, not a guess. Also add a small "Coming from Goodreads?" link in the opening section. |
| Stage 6 (export and delete account) ships | Extend the trust line: "Export everything any time, or delete your account in one click." |

## Explicitly out of scope

- **Search engine optimisation and server rendering.** Making book, review and profile pages show up on Google is the SPEC.md §10 question. The landing page is still a client-rendered SPA page.
- **A waitlist or email collection** for people without an invite.
- **Redesigning `/login` or `/register`.** They keep their current look. The landing page only links to them.
- **Changing what happens after logout.**
- **A logged-out version of the app shell** (header/sidebar) for other public pages such as book pages.
- **Screenshots, videos or animated demos.**
- **Analytics or A/B testing** of the page.
- **Translations.** English only, like the rest of the app.

## As built (2026-10-06)

Both phases were built on 2026-10-06. Phase 2 is **switched off** (`Landing:ShowcaseEnabled` is `false`) until Stages 7 and 8 exist. Where the build differs from the design above:

- **Rate limit (§4).** The design said "rate-limited like the other anonymous auth endpoints". That would have shared the login budget of 10 per minute, so every landing-page visit would use up one of the visitor's login attempts. Instead there is a new `public` policy (`RateLimits:PublicPerMinute`, default 60 per IP per minute), used by both landing endpoints. A test checks that visiting the landing page doesn't use up the login limit.
- **Sample readers (§3)** are first names only (Maya, Theo, Inés, Sam), with no usernames. A sample handle can therefore never match a real account, and the "check each handle" step isn't needed.
- **Covers (§3):** first-edition title pages and one cover (*Dracula*, 1897) from Wikimedia Commons, all marked public domain. Each is 240×360 WebP, 5–14 KB. The sources are in `web/src/assets/landing/covers/SOURCES.md`.
- **`MemberProgressBar`** takes club API types, so it wasn't reused. `DemoProgressBar` copies its styles instead.
- **Highlight demo (§3):** the highlighted sentence is a `<mark role="button" tabIndex={0}>` that handles Enter and Space. It was a real `<button>` at first, but the browser check showed a button can't wrap across lines inside a sentence.
- **Trust line (§2.5)** for now: "Independent, and not owned by Amazon. Toffee is made by readers, for readers. No ads." The "we don't sell your data" claim waits until the privacy policy exists.
- **Footer (§2.7):** has no privacy or terms links yet, since those pages don't exist. They're added in Stage 4.
- **`og:image` (§5)** was a relative URL (`/og-image.png`) until the site had a domain. **Since 2026-10-19** it is `https://wingedwords.app/og-image.png`, with `og:url` and `og:image:alt`; the image itself was redrawn then, because it still showed the old Toffee mascot (now the winged-dog logo in Paper's green over the pitch in Literata, shot from HTML with Playwright at 1200×630; the logo comes from the 1610×977 `wg-image.png`, cut out of its painted checkerboard background by colour, since `logo-mark.png` is only 276 px wide).
- **Phase 2 eligibility (§6).** Today the rules are:
  - Public visibility only.
  - No spoiler flag and no inline `||` spoiler text.
  - Discoverable authors only.
  - Popular books: only logs from discoverable readers, at least 2 different readers per book, and only books with a cover.

  The two rules for "private account" and "suspended or hidden by moderation" **can't exist yet**. `LandingRepository.ShowcaseUserIds` has a comment marking where they go. Discoverable-only is the stand-in until then.
- **Phase 2 details:**
  - The excerpt is cut on the server, so the full review text is never sent.
  - Review cards link to `/reviews/:id`. Checked in the code: `GET /api/reviews/{id}` lets anonymous visitors read Public reviews, and the route isn't protected.
  - The popular-books row scrolls sideways inside itself on narrow screens. The page itself never does.

**Verified live (2026-10-06)** with Playwright, against the new API on a second port with the showcase switched on and the dev database:

- logged out, all 5 themes at 1280px and 390px:
  - no sideways scrolling;
  - no console errors (after fixing one bug the check found, an avatar `<div>` inside a `<p>`);
  - only the two expected API calls (`registration-status`, `landing/showcase`);
- the highlight and club demos open;
- "Join free" goes to `/register`;
- logged in, `/` shows the Feed, and the landing pitch never appeared in the page, even after a hard reload.

Full suites after the review fixes: backend 391/391. Frontend 443/444 in three runs: the one failure was a different unrelated test each time, all the known "slow test times out under load" problem (`bugs/mood-test-times-out-under-load.md`, updated). Every landing-page test passed on every run.

**Code review (2026-10-06):** no high-severity bugs. Fixed:
- at most one review per reader in the showcase, so one person can't fill the row;
- blank (whitespace-only) reviews are skipped;
- an excerpt whose only space is near the start is cut mid-word instead of shrinking to "I…";
- a book removed mid-request is skipped instead of causing a 500;
- removed `aria-controls` that pointed at elements not rendered while closed;
- the "falls back on error" frontend test now waits for the request to actually fail.

Kept as is, on purpose:
- **The Feed stays in the main bundle**, so logged-out visitors download it too. That contradicts the "Speed" line in §2. The app-hardening spec (§3.10) kept the Feed eager so logged-in readers, who make up most visits, see it without waiting for a second file. The landing page itself is still lazy.
- **`HomeGate` renders its own `Layout`**, so moving between `/` and other pages remounts the header and sidebar. This is the cost of the §1 design, and it's small.
- **The showcase call is made even while the showcase is switched off.** It returns empty lists cheaply without touching the database, and it means switching the showcase on needs no frontend change.

**Security review (2026-10-06):** no Critical, High or Medium findings.
- Fixed: an excerpt could cut an emoji in half. There is now a test for it.
- Turned into "before switching on" tasks below: the 10-minute cache delay after a review is hidden, and the shared-IP rate limit behind a proxy.
- Accepted at beta scale: several requests can rebuild the cache at the same moment.
- Accepted: the only guard against switching the showcase on too early is the config value. It's documented here and in `LandingOptions`.

## Tasks

### Phase 1 — Static landing page (for the closed beta, Roadmap Stage 4)

#### Backend

- [x] `Registration:InviteOnly` option (default `false`), bound to an options class. If Stage 1's invite switch already exists, reuse its setting instead and skip this.
- [x] `GET /api/auth/registration-status` → `{ inviteOnly }`. Anonymous, rate-limited like the other anonymous auth endpoints.
- [x] Tests: returns `false` by default, returns `true` when configured, works without a token.

#### Frontend

- [x] `getRegistrationStatus()` API client call and `useRegistrationStatus()` hook (long `staleTime`, falls back to "Join free" while loading or on error).
- [x] `Layout` accepts optional `children` (falls back to `<Outlet />`).
- [x] `HomeGate` index route outside `<Layout>`: loading → `LoadingMessage`, logged out → `LandingPage`, otherwise the Feed exactly as `/` renders today.
- [x] Check `MemberProgressBar` for data fetching before reusing it (§3).
- [x] Bundle ~6 public-domain covers (WebP, under ~30 KB each) in `web/src/assets/landing/covers/`, with `SOURCES.md` listing each image's source and licence.
- [x] `landingSamples.ts` with sample books, readers, review text, comments and list.
- [x] Demo components in `pages/landing/`: `DemoLogCard`, `DemoClub`, `DemoHighlight`, `DemoWriting`, `DemoList`. None of them fetch or read auth.
- [x] `LandingPage` (lazy-loaded) with the 7 sections from §2: top bar, opening section with mascot, four feature cards, basics, trust, closing section, footer.
- [x] Main button switches between "Have an invite? Join" plus the private-beta line, and "Join free".
- [x] Link-preview tags in `index.html`, plus `public/og-image.png` (1200×630, mascot plus pitch).
- [x] Tests:
  - `HomeGate` shows the landing page when logged out, the Feed when logged in, and the session-error retry when `sessionError` is set. No landing-page flash while loading.
  - The button text matches `inviteOnly` true, false, loading and error.
  - Each demo renders without a `QueryClientProvider` or auth provider. This proves they don't fetch.
  - The `DemoHighlight` comment opens on click and on Enter.

#### Verification & docs

- [x] Browser pass, logged out:
  - desktop and phone width;
  - all 5 themes;
  - no sideways scrolling;
  - no console errors;
  - the network tab shows only the `registration-status` call to the API, plus `landing/showcase` once Phase 2 was added.
- [x] Browser pass, logged in: `/` goes straight to the Feed with no landing-page flash, including after a hard reload.
- [ ] Paste the site address into a chat app or a link-preview checker to confirm the preview shows (once Stage 4 has a public address).
- [x] Check the trust line against the privacy policy (Stage 4). **Done 2026-10-19:** the policy backs "no ads" and "we don't sell your data", so the line now says both ("not owned by Amazon" stays out, as it was dropped before).
- [x] `reviewer` and `security-review` agents, then fix their findings (2026-10-06, see "As built").
- [x] `CHANGELOG.md` entry. `ROADMAP.md` Stage 4 item annotated (not ticked: footer links, trust-line check and real link preview wait for the live site).

### Phase 2 — Live community rows (before public launch, after Roadmap Stages 7 and 8)

#### Backend

- [x] `GET /api/landing/showcase`: popular books this week (at least 2 different readers per book) and recent eligible reviews (§6 rules). Anonymous, 10-minute `IMemoryCache`.
- [x] Below the minimum size (4 books / 2 reviews), return an empty list for that part.
- [x] Tests for the rules that exist today, each excluding the review it should (`LandingPageTests`):
  - not Public (Followers and Private)
  - spoiler-flagged
  - inline spoiler text
  - not discoverable

  Also tests for the popular-books rules, the off switch, the cache, the minimum-size rule and excerpts (`LandingShowcaseRulesTests`).
- [ ] **Before switching the showcase on:** add the "private account" rule (Stage 8) and the "suspended / hidden by moderation" rules (Stage 7) to `LandingRepository.ShowcaseUserIds` and the review query, each with its own test. Then set `Landing:ShowcaseEnabled` to `true` in production.
- [ ] **Also before switching on** (security review, 2026-10-06): clear the `landing-showcase` cache entry when a review's visibility, spoiler flag or text changes, when a reader turns discovery off, and when moderation hides something. Today a review made private can stay on the front page for up to 10 minutes.
- [ ] **Also before switching on:** make sure `ForwardedHeaders` is set up with the real proxy (Roadmap Stage 4). Otherwise all visitors share one IP and the 60-per-minute `public` limit applies to the whole site at once.

#### Frontend

- [x] `getLandingShowcase()` and `useLandingShowcase()` hook.
- [x] "What readers are into this week" section: covers row and 3 review cards (first ~200 characters). It is hidden while loading, on error or when empty.
- [x] Check whether review pages can be read while logged out, and only link the review cards if they can.
- [x] Tests: section hidden when empty or on error, rendered when there's data.

#### Verification & docs

- [x] Browser pass with dev data, showcase switched on (2026-10-06): covers row and review cards render in every theme at both widths, with no errors.
- [ ] Once private accounts exist: browser pass with a private account and a spoiler review in the seed data, confirming neither appears.
- [x] `reviewer` and `security-review` agents, then fix their findings (2026-10-06, see "As built").
- [x] `CHANGELOG.md` entry. `ROADMAP.md` Stage 10 item annotated (ticked only once the showcase is switched on).

### Added later (when the feature they describe ships)

- [ ] After Roadmap Stage 2 (import) ships: "Bring your books" section and a "Coming from Goodreads?" link (§7). Use the import's real numbers.
- [x] After Roadmap Stage 6 (export and delete) ships: extend the trust line (§7). **Done 2026-10-19:** "…you can download all of it or delete your account whenever you like" (not "in one click": deleting asks for the password and has a 30-day grace period).

## Phase 3 — Books and Community, side by side (planned 2026-10-20)

Asked on 2026-10-20 while preparing to recruit early-access readers from Reddit and book communities: people who don't know a reader already. The page spoke to one visitor (someone with a group to read with) and left out what makes a stranger switch. Strengths, weaknesses and claims to avoid: `MARKETING.md` §0. **Third of three:** `specs/feedback-button.md` and `specs/whats-new.md` come first, because this page promises both.

### Decisions (user, 2026-10-20, eight rounds of questions)

**The idea.** The app's strongest structural idea is that Books (your own reading) and Community (sharing) are separate: use one, the other or both. The landing page is built the same way: a switch at the top shows one side at a time, and a shared part at the bottom covers what both have in common.

**Opening**
- **Headline (one for both sides):** "Track your reading for yourself. Share it when you feel like it."
- **The lead line changes with the side** (drafts to write in the copy round).
- Actions and the access note stay (Have an invite? Join / Request an invite / Log in).
- **The switch sits in the opening, under the headline and buttons**, labelled **Books / Community** (the app's own names, `sections.books` / `sections.community`). **Books is open on arrival.** No link parameter to open Community directly (kept simple).
- **Once scrolled past, the switch pins to the top bar** on every screen size, between the logo and Log in.
- **The shelf beside the headline changes with the side.** Books: your own shelf (one book being read, two read and rated, as today). Community: friends' books, each cover with a friend's name and how far they are ("Maya, page 214"), like the Readings strip.

**Books side**, each with its own section and live demo:
1. **Bring your library**: an example Goodreads import (how many books, reviews, rereads came in; one book waiting for the reader to pick the right edition).
2. **The journal**: a year as a bookcase or a month of entries with dates, ratings and a private note.
3. **Goal and stats**: "18 of 30 books in 2026" with a few numbers (pages, top author, average rating).
4. **Private by choice**: a book or entry switched between Only me / Followers / Everyone.
Then a short list of what else is included (half stars, DNF shelf, audiobooks in hours and minutes, the edition you read, mood/pace/content warnings, follow authors and hear about new books, lists).

**Community side**, each with its own section and live demo:
1. **Spoiler-safe clubs** (existing demo, the cloth band).
2. **Friends' reading updates** (new demo: a friend's book, the page they're on, the journey line, a reply).
3. **Comment on a sentence** (existing demo).
4. **Lists with friends** (existing demo).
Then a short list: reviews with privacy per review, quotes and writing (the old Writing demo is removed), following readers and comparing taste, the Feed. The live showcase (popular books, recent reviews; still switched off) belongs to this side when it's switched on.

**Shared part, under both sides**
- **Made by one person:** third person, no name ("made by one independent developer").
- **Nothing behind a paywall:** every feature is free; if Winged Words ever asks for money, only as optional support, never a locked feature (`FUTURE-IDEAS.md`, "Making money").
- **Always improving:** links to the public What's new page (`specs/whats-new.md`).
- **Your feedback shapes it:** during early access, what readers send through the feedback button (`specs/feedback-button.md`) decides what gets built next.
- **No ads, and your data is never sold.** **Download or delete everything, anytime.**
- **Five reading themes** (Paper to Dark).
- **Not on the page:** five languages (only English and Spanish have been checked by a person), review-bombing rules, any "no AI" claim (the logo was made with ChatGPT).
- Then the closing heading and the join buttons, as today.

**Wording**
- **"Early access" replaces "private beta" everywhere readers see it:** landing page, Request an invite page, invite emails, and the legal pages if they mention it.
- Competitors are not named, except Goodreads and StoryGraph as import sources (§7).

### Still to do before building

- [x] **Copy round:** `content/landing-phase3-copy.md`, English and Spanish. **Approved as drafted 2026-10-20**, with the gender-neutral Spanish options; the user changes lines once seen on the page.
- [x] ~~**Mockup round**~~ **Skipped by the user (2026-10-20):** built straight away, adjusted on the real page.
- [x] **Brief:** see "As built (Phase 3)" below.

### Tasks

#### Frontend
- [x] Switch (with `role="tablist"` semantics), pinned copy in the top bar, side kept in component state.
- [x] Opening shelf per side; new demos: import, journal, goal and stats, privacy, reading update; remove `DemoWriting`.
- [x] Shared part; links to What's new; "Early access" wording everywhere.
- [x] All text in the five locale files; tests updated.

#### Verification & docs
- [x] `npm test` (1005/1005), `npm run build`, `npm run lint`.
- [x] Screenshot critique round (Paper and Dark, 1280 and 375, Spanish at 1280 and 375) with `design-reviewer`: two rounds, fixes below.
- [ ] The user's look at the live page; their changes to the copy.
- [ ] Redraw `og-image.png` with the new headline (it still shows the old pitch; the description and title in `index.html` are updated).
- [x] `CHANGELOG.md` entry. (§"Added later"'s import item stays open: the page names no import time, since there is no measured number.)

### As built (Phase 3, 2026-10-20)

- **Order in the opening:** headline, then the switch with "Use one side, the other, or both.", then the side's lead line, the buttons and the access note. The decision said "under the headline and buttons"; it went right under the headline so the lead line it changes sits under it. Easy to move.
- **The switch** (`landing/SideSwitch.tsx`) uses the header's `SectionSwitch` styles a size up (10rem segments, 3rem tall). Both copies are tablists over one tabpanel (`#landing-side`), labelled by the opening's tab. The top bar's copy is `visibility: hidden` until the opening's switch scrolls under the bar (the same `IntersectionObserver` as the logo), so only one is ever in the accessibility tree. Choosing a side from the top bar scrolls to the start of that side (smooth, or instant under reduced motion). On a phone it hangs under the bar, full width, so the bar doesn't grow.
- **Each side:** strength 1 on the book-cloth band (Books: import; Community: clubs), 2 on the cream page, 3 in a sunken well, 4 on the cream page; then "Also in Books / Community" in two columns. The showcase belongs to Community. The shared part is a sunken well of one-claim rows (claim left, meaning right).
- **Demos:** `DemoFriendsShelf`, `DemoImport` (`StatTiles` + a book to check), `DemoJournal` (in the journal's own words, `sections.journal.*`), `DemoStats` (goal bar + `StatTiles`; the author's name a step smaller), `DemoPrivacy` (the only new interactive one: `Segmented`, the line under it is a `role="status"`), `DemoUpdate` (reuses `ReadingJourney`). None fetch; the demo tests render them without providers.
- **Motion:** the side's shelf is keyed by side, so changing side replays the opening's settle (≤300ms); the journey line fills as the update appears; nothing else moves.
- **Copy changes made while building:** the privacy demo's lines say "this book" instead of the title (titles stay English on the covers); Spanish themes are "De Papel a Oscuro" (the app's own names); the translation tag for the What's new link is `<a>` (`<link>` is an empty HTML tag, so the link came out blank).
- **Critique fixes:** a bigger switch with its hint in ink; headings of "Also in" and the shared part raised to 2xl; shared part from two columns to one column of rows; even two-column checklists; "octubre de 2026" with only the first letter raised; "No ads…" row spans the full width.
- **Asked for after the build (2026-10-20):** both logos (top bar and opening) are the solid winged dog in the theme's green, drawn as the header draws it (a mask over `--accent`), instead of the old brown original-colour picture, the opening's one 12rem wide (7.5rem on a phone; it was 9rem and 6rem) so its lettering reads; the app's `ThemeMenu` sits in the top bar between the language picker and Log in, its menu opening downward (`opens="down"`). The landing tests stub `matchMedia` for it, as `App.test.tsx` does.
- **Not a bug:** in English, dates and numbers follow the visitor's browser (`i18n/format.ts`), so screenshots on a Spanish-language Windows show "5.240" on the English page.
