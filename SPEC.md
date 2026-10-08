# Argos — Specification

*A Letterboxd-like app for books: log what you read, rate and review it, follow other readers, and build lists.*

Stack decisions locked in for this spec: **web-first** (mobile deferred to post-MVP), **ASP.NET Core (C#) backend**, **React + TypeScript frontend**, **PostgreSQL** database, **Open Library API** for book metadata.

---

## 1. Vision & Objectives

Argos gives readers the same loop Letterboxd gives film watchers:

1. **Log** a book (want to read / currently reading / read / did not finish), with dates, rating, and review.
2. **React** to what friends are reading via an activity feed.
3. **Curate** taste through lists and ratings.
4. **Discover** new books through people you follow, not an opaque algorithm.

Primary objective: ship a working end-to-end product a small group of real users (a beta of friends/readers) can adopt daily to replace a spreadsheet or Goodreads for logging.

Non-objectives for v1: being a bookstore, an ebook reader, or a recommendation engine.

## 2. Target Users

- **Loggers** — just want a fast way to record what they've read and rate it.
- **Reviewers** — write real reviews, care about a clean reading page for their thoughts.
- **Social readers** — follow friends, want a feed, care about who else read/liked a book.
- **Curators** — build themed lists ("Best sci-fi openers", "2026 reading list").

## 3. Domain Model

| Entity | Purpose |
|---|---|
| **User** | account, profile, bio, avatar |
| **Book** | canonical record, sourced from Open Library, cached locally |
| **Log** | a user's relationship to a book: status (want/reading/read/did not finish), dates, half-star rating, review text (with a spoiler flag, published/edited times and per-review privacy — Public / Followers / Only me — only on Read/DNF logs, `specs/reviews-improvements.md`), reread flag, reading progress (total/current page, a progress note — `specs/reading-progress-tracking.md`) |
| **List** | user-curated ordered set of books, public or private |
| **Follow** | directed user→user relationship |
| **Post** | *removed 2026-10-05*: folded into `Writing` as a short note, a Writing with no title (`specs/feed-redesign.md`) |
| **Club** | a group of readers moving through books together on a shared schedule — suggest/vote/confirm a book, then time-boxed, threaded, voteable discussion (`specs/book-clubs.md`). Supporting entities: `ClubMembership` (role + status per user), `ClubBookRound` (one row per book cycle a club reads), `BookSuggestion`/`SuggestionVote` (suggest-then-vote book selection), `ReadingCheckpoint` (a due date + advisory target page), `CheckpointComment`/`CommentVote` (nested, voteable discussion per checkpoint) |
| **ActivityFeedItem** | derived (or materialized) events from people you follow: new log, new review, new list, new post |
| **Writing** | a short note (no title, ≤1000 chars, no highlight-comments) or a long-form piece (titled, ≤50,000 chars); either the author's own words or a quoted book passage, with either an optional book link (`Original`) or a real book / free-typed source (`Quote`); can be edited after publishing, unlike `Log` (`specs/writings-and-annotations.md`, `specs/feed-redesign.md`) |
| **Comment** | a polymorphic whole-post or highlight-anchored comment on a `Writing` or a `Log`'s review text — Argos's first general-purpose text-commenting system; nested for whole-post comments, flat for highlight-comments, both upvote/downvoteable via the supporting `CommentVoteRecord` entity (distinct from Book Clubs' `CommentVote`) (`specs/writings-and-annotations.md`) |

Key relationships: one User has many Logs, Lists, and Writings; one Book has many Logs (one per user, though a user may re-log on reread) and many Writings; Follows are directed edges between Users.

## 4. Features

### Phase 1 — MVP
- Auth: email/password registration & login (ASP.NET Identity + JWT)
- Book search (via Open Library, cached) and book detail page (cover, authors, description, subjects, aggregate rating)
- Log a book: shelve as *want to read / currently reading / read / did not finish*; set start/finish dates, star rating (0.5–5 in half stars), review text — rating and review only once a book is Read or DNF, with whole-review and inline `||spoiler||` hiding (`specs/reviews-improvements.md`)
- Profile page: avatar/bio, shelves, log history, basic stats (books read this year, average rating)
- View others' reviews on a book's page — with a rating chart, Popular/Recent/Following, likes, and filters by rating, length and spoilers, plus "Readers say" (moods, pace, plot or character, content warnings) from optional quick questions on each review (`specs/reviews-improvements.md`)
- Follow / unfollow users
- Activity feed: split into a home-dashboard progress strip (unreviewed status changes from people you follow) and a reverse-chronological reviews feed (logs with review text, merged with Posts — see below) — ✅ shipped 2026-09-27, `specs/home-dashboard-redesign.md`
- Lists: create, add/remove/reorder (drag or arrows) books, per-book notes, ranked or unranked, Public / Unlisted (link only) / Private, with description; view-only sort/filter and "you've read X of Y"; likes, free-form tags, comments, a public browse page (popular / recent / following, search, tag filter) and "lists with this book" on book pages; copy someone's list, take any list on as a personal challenge with a goal date, and build a list together with invited collaborators (`specs/book-lists-improvements.md`)
- User search
- Posts: a free-text thought about a book, independent of shelving/rating it — ✅ shipped 2026-09-27, `specs/book-posts.md`; folded into Writings as notes 2026-10-05, `specs/feed-redesign.md`

### Phase 1.5 — Book Clubs (large addition, built alongside Phase 1)
- Book Clubs: a group of readers moving through the same book together — public/private with a directory or invite-link + request-to-join, suggest-then-vote book selection with an admin/mod confirm step, time-boxed checkpoints with a full threaded, upvoteable/downvoteable comment discussion per checkpoint (the app's first comment system), member progress reused from the existing `Log` data — ✅ shipped 2026-09-28, `specs/book-clubs.md`

### Next up — Launch readiness
The 2026-10-06 product analysis (`PRODUCT-ANALYSIS.md`) found eight gaps to close before any Phase 2 work: accounts, data export, Goodreads + StoryGraph import, reporting & moderation, notifications, yearly goal + stats, private accounts, and formats/editions/series. **`ROADMAP.md` holds the details and decides the order.** Each still needs its own spec in `specs/` before it's built. Shipped so far: account system Phases 1–3 (`specs/account-system.md`), Goodreads + StoryGraph import (`specs/book-import.md`).

### Phase 2 — Growth (post-MVP)
- Book news feed — general, unpersonalized, aggregated from book-industry RSS feeds (`specs/book-news-feed.md`) — ✅ shipped 2026-09-27
- Email confirmation and forgot-password flows (confirmed future requirement — see §5 for why this shapes the Phase 1 auth implementation)
- Likes/comments on reviews — **superseded**: `specs/writings-and-annotations.md` builds a fuller comment/highlight/vote system covering Writings and Reviews together, not just a plain like/comment on reviews.
- Writings & Annotations: long-form original pieces or quoted book passages, with Instagram-style whole-post comments (nested) plus Genius-style highlight-anchored comments, both upvote/downvoteable — ✅ shipped 2026-09-30, `specs/writings-and-annotations.md`
- Year in Review / reading-challenge style stats: stats moved to **Next up** (`ROADMAP.md`); the shareable year-in-review image is in `FUTURE-IDEAS.md`
- Genre & tag browsing, "popular this week"
- Basic recommendations (from genres/ratings of followed users)
- ~~Goodreads CSV import~~: moved to **Next up** (`ROADMAP.md`)
- ~~Notifications~~: moved to **Next up** (`ROADMAP.md`)
- Diary calendar view
- ~~Edition/ISBN precision~~: moved to **Next up** (`ROADMAP.md`)

### Phase 3 — Scale / Mobile
- Mobile app (React Native, reusing the same API)
- Public API / API keys for integrations
- ~~Moderation & reporting tools~~: moved to **Next up** (`ROADMAP.md`)
- ML-driven recommendations
- Push notifications

## 5. Architecture

```
React + TS (Vite SPA) ──REST/JSON──> ASP.NET Core Web API ──EF Core──> PostgreSQL
                                            │
                                            └──> OpenLibraryClient (cached in DB)
```

- **Frontend**: React + TypeScript, Vite build, React Query for server-state/caching, React Router.
- **Backend**: ASP.NET Core Web API, layered as Controllers → Services → Repositories (EF Core). Single monolith — no microservices; this is a solo/small-team project and premature service-splitting would only slow it down.
- **Book news feed**: a second, independent external integration — `NewsFeedRefreshService` (a background job, same shape as the Open Library refresh below but a much shorter cadence) aggregates a small configurable list of book-industry RSS feeds into an in-memory snapshot (deliberately not persisted — see `specs/book-news-feed.md`), served publicly via `GET /api/news`.
- **Book data integration**: a dedicated `OpenLibraryClient` service. Responses are normalized and persisted into a local `Books` cache table with a `cached_at` timestamp and periodic refresh (background job), so the app never depends on Open Library being up for normal reads, and search/detail pages stay fast. **Book search is cache-first with a live Open Library fallback** (`specs/live-book-search.md`): a search always checks the local cache, and always also queries Open Library live, merging and deduping by Open Library ID so a book nobody has looked up before is still findable, not just ones already viewed. Live-only hits are never written to the cache from search itself — Open Library's search results don't include a description or subjects, only the per-work detail endpoint does, so a search-originated cache write would leave a permanently thin row. Caching (with full detail) still happens exactly once, the existing way: the moment a book's detail page is actually opened.
- **Background jobs**: Hangfire (or a simple `IHostedService`) for periodic Open Library refresh and, later, feed materialization.
- **Merged feed content**: the home dashboard's center feed (reviews + Writings) is produced by one repository-level query (`FeedRepository`) that projects both `Logs` (with review text) and `Writings` into a shared shape and combines them via LINQ `Concat`, which EF Core translates to a single SQL `UNION ALL` — ordering/pagination happens once, over the combined set, rather than merging two independently-paginated lists in application code (`specs/book-posts.md` §3.2).
- **Checkpoint comment trees**: a checkpoint's comment tree is small enough to fetch whole, so `GET /api/checkpoints/{id}/comments` returns the full nested tree in one query rather than cursor-paginating it like the flat main feed (`specs/book-clubs.md` §3.6).
- **Polymorphic comments & merged-highlight regions**: `specs/writings-and-annotations.md`'s comment system covers both `Writing` and `Log` review text through one generic `Comment` table using a lightweight `TargetType`/`TargetId` pair rather than two nullable FKs — avoids a schema change every time the system extends to a new content type, at the cost of a service-layer (not DB-level) existence check on the target, the same trade-off `FeedContentItem` already accepted. A highlight-comment's overlapping-region merge (Genius-style: multiple readers' overlapping highlights render as one region) is computed at read time via an interval-merge over the target's own small comment set, not persisted as its own entity or pushed into SQL.
- **Auth**: **Full** ASP.NET Core Identity (not just its `PasswordHasher` utility) issuing JWTs; frontend stores token and attaches via `Authorization` header. This is a deliberate choice, decided during module 10: full Identity means the app's `User` entity inherits from Identity's own `IdentityUser<Guid>`, and `ArgosDbContext` inherits from `IdentityDbContext<...>` — a real, accepted crack in the "Domain has zero technology awareness" rule applied everywhere else (module 01), taken specifically because §4 Phase 2's email-confirmation and forgot-password flows need Identity's built-in token-generation infrastructure (`EmailConfirmed`, `GenerateEmailConfirmationTokenAsync`, `GeneratePasswordResetTokenAsync`, etc.). The lighter alternative (keep a plain `User` POCO, use only `PasswordHasher<T>` directly) was considered and rejected once this future requirement was confirmed — reworking to full Identity later, after those foreign keys and that data existed, would've been strictly more expensive than building on the real thing from the start. **Sessions (`specs/app-hardening.md` §3.4):** login and register also return a refresh token (30 days, rotated on every use, only a SHA-256 hash stored). The login token stays 60 minutes, and the frontend renews it automatically on a 401 via `POST /api/auth/refresh`. `POST /api/auth/logout` revokes it, and logout clears the whole frontend cache. **Accounts (`specs/account-system.md` Phase 1):** passwords are 12–128 characters with no character-type rules, checked against a bundled common-password list, the reader's username/email, and Have I Been Pwned's breached passwords (`CommonPasswordValidator`, `PwnedPasswordsClient`: only a 5-character hash prefix is sent; if the service is down the password is let through). Login takes `emailOrUsername`. New usernames go through `UsernameRules` (3–30 letters, digits or `_`, plus a reserved list), and `GET /api/auth/username-available` powers the sign-up form's live check.

## 6. Technology Versions

Specific versions we're building against, so there's no ambiguity during setup. These are current, actively-supported releases as of this spec (2026-08); **re-check for newer stable/LTS releases at Phase 0 setup time** before pinning `.csproj`/`package.json` files, since a real gap may exist between drafting this spec and starting the build.

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Backend runtime | .NET | **10** (LTS) | 3-year support window — use the LTS, not a short-term-support release |
| Backend language | C# | **14** | ships with .NET 10 SDK |
| Web framework | ASP.NET Core | **10.x** | |
| ORM | Entity Framework Core | **10.x** | version-matched to .NET 10 |
| Postgres driver | Npgsql.EntityFrameworkCore.PostgreSQL | **10.x** | version-matched to EF Core 10 |
| Auth | ASP.NET Core Identity | bundled with ASP.NET Core 10 | issuing JWTs, not cookie auth |
| Background jobs | Hangfire | **1.8.x** | only if/when a background job is actually needed (§5) |
| Backend testing | xUnit | **xunit.v3 4.0.0** | package is `xunit.v3` regardless of the numeral in its own version (currently on major version 4). Requires `global.json`'s `{ "test": { "runner": "Microsoft.Testing.Platform" } }` for `dotnet test` to work on .NET 10 SDK — the older VSTest-compatibility mode was dropped. |
| API documentation | Swashbuckle.AspNetCore | **10.2.3** | generates the OpenAPI spec + Swagger UI from controllers/DTOs (module 07). Note: Swashbuckle now versions alongside .NET itself (9.x for .NET 9, 10.x for .NET 10) — the originally-pinned 7.x predates .NET 10 support and fails at runtime with a `TypeLoadException`, discovered the hard way during module 07. Confirmed working at 10.2.3. |
| API client / manual testing | Bruno | **1.x** (latest stable) | git-friendly collections committed alongside the code (see `bruno/` below); the manual/exploratory counterpart to xUnit's automated tests |
| Database | PostgreSQL | **17.x** | one cycle behind latest major for stability; 18.x is acceptable if the hosting provider defaults to it |
| Frontend runtime | Node.js | **22.x** (LTS) | Active LTS; avoid odd-numbered/non-LTS majors for anything deployed |
| Package manager | npm | bundled with Node 22 | pnpm is an acceptable substitute if preferred, but pick one and don't mix lockfiles |
| Frontend language | TypeScript | **5.7.x** | `strict: true` |
| UI library | React | **19.x** | |
| Build tool | Vite | **6.x** | |
| Routing | React Router | **7.x** | |
| Server-state | TanStack Query (React Query) | **5.x** | |
| Frontend testing | Vitest | **2.x** | |
| Frontend testing | React Testing Library | **16.x** | |
| Containerization | Docker / Docker Compose | current stable | local Postgres + optional full-stack compose |

Version policy going forward: pin exact versions in `.csproj`/`package.json` (no floating majors in production dependencies), bump deliberately rather than on every release, and note any version bump that changes behavior in the relevant spec and the changelog rather than silently upgrading mid-feature.

**API tooling note**: Swagger UI (via Swashbuckle) is the always-on, auto-generated reference for "what does the API look like right now." Bruno collections are checked into the repo under `bruno/` (one `.bru` request file per endpoint, organized by resource) and are the hand-maintained, git-diffable counterpart — useful for exploratory testing during development and as a runnable record of real request/response examples, including authenticated flows Swagger UI doesn't exercise well on its own. Neither replaces the automated xUnit test suite (§8); both are developer-facing tools that sit alongside it.

## 7. Data Model (initial tables)

- `Users(id, username, email, password_hash, display_name, bio, avatar_url, created_at, default_review_visibility, is_discoverable)` — `default_review_visibility` is the privacy new reviews start with (`specs/reviews-improvements.md`); `is_discoverable` (default true) controls whether the reader appears in Find readers' suggestions, popular and new lists — search finds them either way (`specs/find-readers-discovery.md`) — usernames are 3–30 letters, digits or underscores, checked at registration (`specs/app-hardening.md` §3.2); 5 wrong passwords from one network address block that address for the account for 15 minutes, and 20 lock the whole account (`specs/account-system.md` §0)
- `RefreshTokens(id, user_id, token_hash unique, created_at, expires_at, revoked_at, replaced_by_token_id)` — one row per refresh token; rotating sets revoked_at + replaced_by_token_id; reusing a token rotated more than 60 seconds ago revokes all of that user's tokens; rows 30 days past expiry or revocation are deleted daily (`specs/app-hardening.md` §3.4)
- `Books(id, open_library_id, title, authors[], first_publish_year, cover_url, description, subjects[], isbn[], cached_at, genres text[], audience)` — `genres` (up to 3 keys) and `audience` are derived from `subjects` by `GenreCatalog` whenever a book is cached or refreshed; a null `audience` means not classified yet (`specs/find-readers-discovery.md` §3.7); `title` has a pg_trgm GIN index so "title contains" search can use it (`specs/app-hardening.md` §3.1)
- `Logs(id, user_id, book_id, status, rating numeric(2,1), review_text, has_spoilers, reviewed_at, review_edited_at, visibility, moods text[], pace, drive, started_at, finished_at, is_reread, created_at, total_pages, current_page, progress_note, progress_updated_at)` — status adds DidNotFinish (3); rating/review only on Read/DNF; reviewed_at drives review ordering (`specs/reviews-improvements.md`); the last three are reading-progress fields, meaningful while status is CurrentlyReading (or DNF, as the page stopped at); percentage is derived (current_page/total_pages), never stored (`specs/reading-progress-tracking.md`); progress_updated_at is when status/page/note last changed, what the Readings strip orders by (`specs/reading-stories.md`); review_text is at most 10,000 characters (`specs/app-hardening.md` §3.2)
- `Lists(id, user_id, title, description, visibility, is_ranked, created_at, updated_at, copied_from_list_id)` — visibility is Private / Public / Unlisted; title at most 150 characters, description at most 2,000 (`specs/app-hardening.md` §3.2)
- `ListItems(list_id, book_id, position, note, added_by_user_id, added_at)` — one row per book per list; positions are 0..n-1 with no gaps
- `ListLikes(list_id, user_id, created_at)` — one per user per list; `ListTags(list_id, tag)` — normalised lowercase tags, max 8 per list. List comments use the shared `Comments` table with `target_type = List`
- `ListChallenges(id, list_id, user_id, goal_date, started_at)` — one per reader per list; goal_date is a plain date; progress is computed from Read logs, never stored
- `ListCollaborators(list_id, user_id, status, invited_at, responded_at)` — Pending/Accepted; max 10 per list; declining or leaving deletes the row
- `Follows(follower_id, followee_id, created_at)`
- `Blocks(blocker_id, blocked_id, created_at)` — key on the pair; applies both ways once it exists: blocking deletes follows between the two readers and stops new ones, and hides each from the other in search and discovery. `DismissedSuggestions(user_id, dismissed_user_id, created_at)` — permanent "Not interested" on a suggested reader (`specs/find-readers-discovery.md`)
- `LogContentWarnings(log_id, warning_key, severity)` — reader-reported content warnings on a review, from a fixed catalog (`specs/reviews-improvements.md`)
- `ReviewLikes(log_id, user_id, created_at)` and `FavouriteBooks(user_id, book_id, created_at, showcase_position)` — likes on reviews, and hearted books with up to 4 picked for the profile row (`specs/reviews-improvements.md`)
- `ReadingLikes(log_id, user_id, created_at)` — likes on reading stories, separate from review likes; story comments are `Comment` rows with target type Reading (`specs/reading-stories.md`)
- `ActivityEvents(id, user_id, type, log_id, book_id, list_id, rating, created_at, updated_at)` and `ActivityLikes(activity_event_id, user_id, created_at)` — reading history recorded as it happens (started / finished / did not finish a book, made a list) for the Feed's grouped activity rows; who may see an event is decided when the Feed is read (`specs/feed-redesign.md`)
- `WritingLikes(writing_id, user_id, created_at)` — likes on writings, notes and titled pieces alike (`specs/feed-redesign.md`). The old `Posts` table was folded into `Writings` and dropped (migration `FoldPostsIntoWritings`).
- `Clubs(id, name, description, is_public, invite_token, creator_id, created_at)` — `invite_token` unique, regenerable, the shareable link's key for both public and private clubs (`specs/book-clubs.md`)
- `ClubMemberships(id, club_id, user_id, role, status, joined_at, invited_by_user_id)` — `role`: Admin (exactly one, the creator) / Moderator / Member; `status`: Active / PendingRequest (private-club join requests) / Invited (invited by an Admin/Moderator, not a member until accepted; `specs/find-readers-discovery.md` §3.6)
- `ClubBookRounds(id, club_id, round_number, phase, book_id, started_at, confirmed_at, confirmed_by_user_id)` — one row per book cycle; `phase`: Suggesting / Reading / Completed; a club always has exactly one non-Completed round
- `BookSuggestions(id, club_book_round_id, book_id, suggested_by_user_id, created_at)` — no cap per member
- `SuggestionVotes(id, suggestion_id, club_book_round_id, user_id, created_at)` — unique on `(club_book_round_id, user_id)`, one vote per user per round; `club_book_round_id` denormalized from the suggestion so that constraint doesn't need a join
- `ReadingCheckpoints(id, club_book_round_id, label, target_page, due_date, created_at)` — `target_page` is advisory only, never validated against a member's own `Log.TotalPages`
- `CheckpointComments(id, checkpoint_id, user_id, parent_comment_id, content, created_at)` — self-referencing `parent_comment_id` for arbitrary-depth threading; no edit/delete in v1
- `CommentVotes(id, comment_id, user_id, value, created_at)` — unique on `(comment_id, user_id)`; `value` is +1/-1, a comment's score is the server-computed sum
- `Writings(id, user_id, title (nullable: null = short note, check constraint keeps notes ≤1000 chars), content, kind, book_id, source_book_id, source_text, created_at, updated_at, is_edited)` — long-form pieces; `kind` is `Original`/`Quote`; mutually-exclusive book linkage enforced by a DB check constraint plus `WritingService` (`specs/writings-and-annotations.md`)
- `Comments(id, parent_comment_id, user_id, target_type, target_id, anchor_start, anchor_end, anchored_text, content, created_at, updated_at, is_edited)` — polymorphic whole-post (`anchor_start`/`anchor_end` null) or highlight comment on a `Writing` or a `Log`'s review text; `anchored_text` is a creation-time snapshot used only to detect a stale highlight on read, never displayed (`specs/writings-and-annotations.md`)
- `CommentVoteRecords(id, comment_id, user_id, value, created_at)` — unique on `(comment_id, user_id)`; `value` is +1/-1, a comment's score is the server-computed sum; a distinct table from Book Clubs' `CommentVotes` to avoid a class-name collision (`specs/writings-and-annotations.md`)

Activity feed is **query-derived** in Phase 1 (pull recent Logs/Lists from followed users at request time); only materialize it into a dedicated table in Phase 2 if/when read performance requires it. The home dashboard's center feed specifically is a single SQL `UNION ALL` over review-bearing `Logs` and `Writings` (`FeedRepository`), ordered/paginated together (`specs/book-posts.md` §3.2, `specs/feed-redesign.md` §3.3).

## 8. Constraints

**Technical**
- Open Library has no auth but expects a descriptive `User-Agent` and reasonable request rates — all calls (including live search) funnel through `OpenLibraryClient`, never called ad hoc from request handlers or controllers.
- Book metadata is sometimes incomplete/inconsistent (missing covers, duplicate editions) — the app must degrade gracefully (placeholder cover, "description unavailable") rather than fail. This now also covers Open Library itself being unreachable during a search: results silently fall back to cache-only rather than the request failing (`specs/live-book-search.md`).
- **Languages (`specs/languages.md`): no hard-coded English in the frontend.** The site is in English, Spanish, Brazilian Portuguese, German and French. Every text a reader can see (including `aria-label`, `title`, placeholders and `confirm()` text) goes through `t('…')` with a key in all five `web/src/locales/<lang>/` files, and every new backend error message gets a template in `Argos.Api/Errors/ErrorCodes.cs` plus a translation under `errors.codes`. Tests fail if a language is missing a key or a backend message has no code. Read the spec's "Rules for writing keys" before adding text.
- Keep the architecture boring: one API, one database, no premature microservices/queues/search clusters. Local-cache search augmented by a live Open Library call (`specs/live-book-search.md`) is enough for MVP search; don't reach for Elasticsearch/Meilisearch until cached catalog size or query needs actually demand it.

**Legal / Data**
- Respect Open Library / Internet Archive terms of use; no scraping outside the documented API.
- Users can mark lists/profile as private; support account data export/delete (GDPR-lite) before any public launch.

**Resourcing**
- Assume solo-or-small-team development — the build plan in §9 and `ROADMAP.md` are scoped for that, not a large team.

**Testing**
- Backend: xUnit for services/business logic, integration tests against a test Postgres instance for API endpoints.
- Frontend: Vitest + React Testing Library for components. There's no E2E suite in the repo: browser checks run on demand with Playwright from a scratch folder (the `browser-check` skill), and manual checklists live in `testing/` (the `test-plan` skill).

## 9. Original Build Plan (done)

The MVP was built in this order. `backend-tasks/` and `frontend-tasks/` refer to these phase numbers. What comes next is decided by `ROADMAP.md`.

- **Phase 0 — Setup:** the three-project solution, the Vite app, Docker Compose Postgres, CI
- **Phase 1 — Book data:** `Users`, `Books`, `OpenLibraryClient` + cache, search and book pages
- **Phase 2 — Auth:** Identity + JWT, frontend auth flows and protected routes
- **Phase 3 — Logging & ratings:** `Logs` CRUD, profile shelves, history and stats
- **Phase 4 — Social:** follows, the query-derived feed, user search
- **Phase 5 — Lists:** `Lists`/`ListItems`, public list pages
- **Phase 6 — MVP polish:** responsive pass. Deploying and the closed beta moved to `ROADMAP.md` (Stage 4 onward)

## 10. Open Decisions

- Hosting provider (Azure fits the .NET stack naturally; Render/Railway/Fly.io are cheaper options for an MVP). Options and 2026 prices researched in `ACCOUNTS-AND-HOSTING.md` §2.3. Decided 2026-10-08: domain `wingedwords.app` at Porkbun (DNS there too), everything else (site, API, database) on Render.
- Whether public book/profile pages need SEO/SSR — if so, revisit the pure-SPA choice for those routes specifically (rest of the app stays SPA either way).
- ~~Half-star ratings vs. whole-star only.~~ Resolved 2026-10-01: half stars, 0.5–5, for logs and club ratings (`specs/reviews-improvements.md`).
- ~~Import priority after MVP.~~ Resolved 2026-10-06: Goodreads + StoryGraph CSV import is `ROADMAP.md` Stage 2.
