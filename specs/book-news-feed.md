# Feature Spec — Book News Feed

**Status:** ✅ Implemented (2026-09-27)

## 1. Problem

The user wants a page like the "news by category" sections common on portal sites (sport, entertainment, etc.), but scoped to books — a simple feed of book-industry news/links, general (not personalized), on its own page.

## 2. Clarifying decisions made (via questions to the user)

- **No sub-categories** — the sport/entertainment framing was just the user's example of the *concept* ("news classified by interest"); for Argos, "books" already *is* the one category. No genre/type filtering in v1.
- **General feed, not personalized** — same content for every viewer, logged in or not.
- **Dedicated page** — `/news`, its own nav link, not folded into the feed or home page.
- **Source**: researched three options before picking:
  - NewsAPI.org — free tier explicitly forbids production use (localhost-only, 100 req/day, delayed articles); real use needs a $449/mo plan. Rejected.
  - NYT Books API — genuinely free, but it's bestseller lists + official NYT reviews, narrower than general book-industry news. Set aside (could be a future *addition*, not a replacement).
  - **RSS feeds — chosen.** Free, no signup, no key, no production restriction. Verified two real working feeds before committing: Book Riot (`https://bookriot.com/feed/`) and Literary Hub (`https://lithub.com/feed/`), both confirmed live RSS 2.0 with real, current book-industry content.

## 3. Design

### 3.1 Storage: in-memory, not persisted — deliberately, unlike Books

News items get **no database table**. Reasoning:
- They have no foreign-key relationships to anything else in the app (unlike `Book`, which `Logs`/`ListItems` reference) — nothing needs a stable, permanent identity for a news item.
- They're inherently time-limited in relevance; there's no requirement (or request) to browse news history.
- A cold-start refetch on app restart is cheap (a couple of HTTP calls) and avoids a migration for content that doesn't need to survive one.

This keeps to SPEC.md §8's "keep the architecture boring" — a table, a repository, and a migration for genuinely disposable content would be over-building it.

### 3.2 Refresh: a background service, same shape as `OpenLibraryCacheRefreshService`, different cadence and store

`NewsFeedRefreshService : BackgroundService` — runs once on startup, then every `News:RefreshIntervalMinutes` (default 30; news moves faster than books' 24-hour cache, so a much shorter cadence). Each configured feed URL (`News:Sources`, a plain string array — add/remove outlets by editing config, no code or deploy-time logic change) is fetched by `INewsFeedFetcher`/`NewsFeedFetcher` and parsed as plain RSS 2.0 via `System.Xml.Linq.XDocument` (both configured feeds confirmed RSS 2.0, not Atom — a full syndication library wasn't pulled in just to read `<item>`/`<title>`/`<link>`/`<pubDate>`/`<description>`/`<enclosure>`, one dependency avoided). Results from every configured feed are merged, deduped by article URL, sorted newest-first, and capped at `News:MaxItems` (default 30) — then swapped into a singleton store as one atomic snapshot (a fresh `IReadOnlyList<NewsItem>` reference, not a mutated collection), so a read never sees a half-updated list and needs no lock.

### 3.3 Failure handling — matches `OpenLibraryClient`'s existing pattern exactly

One feed failing to fetch or parse is logged as a warning and skipped — the other feed(s) still refresh normally. If *every* configured feed fails on a given cycle, the store simply keeps serving its last-known-good snapshot; `GET /api/news` never errors or goes empty because of a transient outage. Same philosophy as SPEC.md §8's "the app must degrade gracefully" — extended here from *book* lookups to *this* feature.

### 3.4 API — new, public, no auth

`GET /api/news` → `List<NewsItemDto>` (`title`, `url`, `source`, `author`, `summary`, `publishedAt`, `imageUrl` — `author`/`summary`/`imageUrl` nullable). No auth required, matches "general feed for everyone." `summary` is cleaned from the feed's raw `<description>`: HTML tags stripped, HTML entities decoded (`&#124;` → `|`, etc. — caught live during verification, an item literally rendered a raw entity code before this was added), capped at 220 characters. `author` comes from the RSS `<dc:creator>` element (Dublin Core namespace) when a feed provides it — Book Riot does (real bylines, or "Deals" for its automated roundup posts), Literary Hub sometimes does.

`imageUrl` resolution, in order: (1) a proper `<enclosure>` link if the feed provides one; (2) otherwise, the first `<img src>` found inside the feed's `<content:encoded>` full-HTML body. Neither configured feed provides `<enclosure>` or a Media RSS thumbnail in practice, but both embed a real, on-topic image directly in their full post HTML — extracting that turned "18 of 20 items show no image" into "18 of 20 items show a real one," a bigger practical win than the `<enclosure>` path alone. A plain regex (`<img[^>]+src=["']([^"']+)["']`) reads the first match; genuinely image-less items (2 of 20 as of this writing) still degrade gracefully to a placeholder box.

### 3.5 Frontend — redesigned twice, both times to match a reference the user provided

**First pass (2026-09-27):** original v1 was a simple single-column list. The user shared a screenshot of a Google-News-style layout (two columns, source favicon + name header, headline with a small inline thumbnail, relative timestamp + byline, a divider between items) and asked for that instead. Rebuilt with CSS multi-column (`columns: 2`, collapsing to 1 below 640px, `break-inside: avoid` per card, `column-rule` for the vertical divider — simpler than hand-tracking "last card in this column" for a bordered divider in a real grid), a favicon derived client-side from the article's domain via Google's public favicon endpoint, and a new relative-time formatter (`src/lib/relativeTime.ts`).

**Second pass (same day):** the user then asked for a real picture on the left instead of the small favicon icon. This is the point where the `imageUrl` resolution above (content-body extraction) got built — without it, moving the image to a prominent left-hand position would have made the "almost every card has no image" gap far more visible than it was as a small optional thumbnail. Card is now: image (or a 📰 placeholder box, matching `BookCover`'s pattern for missing covers) on the left, title + a combined meta line (`source · relative time · By {author}`) on the right. The favicon is gone — source name moved into the meta line instead of its own header row.

Both times: the bottom-right save/bookmark icon visible in the reference screenshot was **not** built — bookmarking a news item is explicitly out of scope (§4), and a non-functional icon would be worse than no icon.

`/news` route (public, no `ProtectedRoute`), nav link alongside Feed/People/Lists. `NewsPage` fetches once via TanStack Query; loading/error/empty states reuse the existing `StateMessage` components (task 10) rather than inventing new ones.

## 4. Explicitly out of scope

- Genre/category filtering within book news — nothing requested it; add later if it comes up.
- Persisting news items or exposing history/pagination beyond "the latest N right now."
- Media-RSS thumbnail parsing (`media:thumbnail`/`media:content` namespaced XML) specifically — neither configured feed uses it, so it's never been needed; `imageUrl` is covered instead by `<enclosure>` then a `<content:encoded>` first-image fallback (§3.4), which in practice covers the large majority of items. A genuinely image-less item still degrades gracefully to a placeholder box, it's just rare now rather than the norm.
- Per-user read/unread tracking, saving/bookmarking a news item.

## 5. Tasks

### Backend

- [x] `NewsItem` (internal model, `Argos.Api/Services/`) + `NewsItemDto` (API response shape, `Argos.Api/Dtos/`) — including `Author`.
- [x] `NewsOptions` (config: `Sources`, `RefreshIntervalMinutes`, `MaxItems`) + `appsettings.json` entry.
- [x] `INewsFeedStore` / `NewsFeedStore` — thread-safe in-memory snapshot holder (singleton).
- [x] `INewsFeedFetcher` / `NewsFeedFetcher` — owns the `HttpClient`, fetches one feed URL, parses RSS 2.0 via `XDocument` (including `<dc:creator>` for `Author` and a `<content:encoded>` first-image fallback for `ImageUrl`), cleans the summary (strip tags, decode entities, cap length); never throws, a failed fetch/parse yields `[]`.
- [x] `NewsFeedRefreshService` (`BackgroundService`) — runs on startup + every `RefreshIntervalMinutes`; calls the fetcher per configured source, merges, dedupes by URL, sorts newest-first, caps at `MaxItems`, swaps the result into the store; keeps the last-good snapshot if every feed fails a given cycle.
- [x] `NewsController` — `GET /api/news`, public, no auth.
- [x] DI registration in `Program.cs` (`Configure<NewsOptions>`, singleton store, typed `HttpClient` for the fetcher, hosted service).
- [x] Backend unit tests (`NewsFeedFetcherTests`, `NewsFeedRefreshServiceTests`): RSS field mapping incl. `dc:creator`, content-body image extraction (and that `<enclosure>` still wins when both are present), tag-stripping + entity-decoding, missing-title/link items skipped, missing-pubDate/missing-author defaults, merge/dedupe/sort/cap, and the "every feed empty this cycle → keep existing snapshot" graceful-degradation case.

### Frontend

- [x] `NewsItemDto` type (incl. `author`) + `getNews()` in `api/news.ts` + `queryKeys.news`.
- [x] `src/lib/relativeTime.ts` — relative timestamp formatting.
- [x] `NewsCard` component (redesigned twice per §3.5) — real picture on the left (or a placeholder box, `BookCover`-style, when an item genuinely has none), title, a combined `source · time · byline` meta line, external link (new tab) for the whole card. No favicon icon (removed in the second pass).
- [x] `NewsPage` — two-column layout (`columns: 2`, collapsing to 1 on narrow screens); fetches once via TanStack Query; loading/error/empty states via the existing `StateMessage` components (task 10), not new ones.
- [x] `/news` route (public, no `ProtectedRoute`) + nav link alongside Feed/People/Lists.

### Verification & docs

- [x] Live verification against the real RSS feeds and the running dev stack (including re-checking after the entity-decode fix).
- [x] `CHANGELOG.md` entry.
- [x] `SPEC.md` given two small, surgical touches (not a rewrite): a §4 Phase 2 bullet marking this shipped, and a §5 sentence naming the new background-refreshed RSS integration alongside the existing Open Library one — no domain model or architecture changes beyond that.
