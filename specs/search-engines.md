# Feature Spec — Found on Google (search engines)

**Status:** Planned 2026-10-28, decisions asked the same day (§2.1). Two phases: Phase 1 (the basics: robots.txt, sitemap, a title per page, "don't index" where needed, Search Console; size M), Phase 2 (plain HTML pages for search engine bots on books, authors, lists and reviews; size M–L). Resolves SPEC.md §10's open SEO/SSR question: no full server rendering (§2.1).

## 1. Problem

The user wants people who search Google for a book to land on Winged Words.

How things are today (checked 2026-10-28):

- **One page for everything.** The site is a single `index.html` that the app fills in inside the browser (an SPA). Every address (`/books/OL1W`, `/lists/…`, `/settings`) gets the same `index.html` with the title "Winged Words" and the general description. The app never changes the title (no `document.title` anywhere in `web/src`).
- **No `robots.txt` and no sitemap.** `robots.txt` is the file that tells search engines what they may read; a sitemap is the list of pages we hand them. Neither exists on `wingedwords.app` or `api.wingedwords.app`.
- **Google has to run the app to see anything.** Googlebot does run JavaScript, but later than it reads the page (hours to days, in a queue) and not always successfully: if the API is slow, asleep or rate-limits it, it sees an empty page. The book's text comes from `api.wingedwords.app`, a different address, which Google also has to be allowed to read.
- **Missing pages look like real ones.** An unknown book or a private list still answers "200 OK" with `index.html`, so Google may store an empty "not found" page as if it were real (a "soft 404").
- **Preview bots already get real HTML.** `web/nginx.conf` sends Reddit, Discord, WhatsApp and similar bots on the six shareable pages to `GET /api/share/card` (`specs/shareable-pages.md` Phase 3), which builds a small HTML page from our database using the same visibility rules as the app. Search engines were left out on purpose. Phase 2 builds on this.
- **Nothing is registered with Google.** No Search Console (Google's free dashboard that shows what it has read, what it couldn't and why).

## 2. Decisions

### 2.1 Asked 2026-10-28

- **Approach: A + B, not full server rendering.**
  - **A (Phase 1):** the basics. Google runs the app as today, but gets a sitemap, a real title and description per page, "don't index" on pages that shouldn't show up, and is allowed to read the API.
  - **B (Phase 2):** search engine bots asking for a book, author, list or review page get a plain HTML page with the real content, built by the API like the preview cards.
  - **Not C (full server rendering):** moving the app to a server-rendering framework would mean rewriting the app and moving login to cookies (size XL), and running a Node server per visit on top of the current $7 API, in 512 MB that's already tight (DEPLOY.md, incidents). For these four page types B gives Google the same content.
- **Pages Google may show:** books, authors, public lists, reviews. Plus the landing page, What's new and the legal pages (they're public and say what the site is).
- **Reader profiles (`/u/…`) are never indexed.** Every profile page says "don't index", for public and private accounts alike. They're not in the sitemap and Phase 2 doesn't make HTML for them.
- **Books in the sitemap: only books readers used.** A book counts when it has at least one public rating or review from a public account, or is on a public list. A book page with only Open Library's data looks like a copy of other sites; Google ranks those poorly and they can pull the whole site down. Those pages say "don't index, but follow the links" (`noindex, follow`), so Google still finds the authors and lists they link to.

### 2.2 Decisions I made, for the user to confirm

- **Reviews and lists show their writer's name to Google.** A review or list page (in the app and in Phase 2) shows the reader's display name, as it does to a visitor today. So a public review can appear on Google with its writer's name, even though the profile itself never does. Only reviews from public accounts count (private accounts' reviews are already hidden from visitors). The privacy policy gets a line saying public reviews and lists may appear in search engines, and What's new tells readers. *If the user prefers, reviews could be left out of search entirely instead.*
- **Spoiler reviews are not indexed.** A review marked as a spoiler says `noindex` and isn't in the sitemap, so its text never shows in a Google result.
- **Which reviews count:** public, not hidden by moderation, not a spoiler, with text (a bare star rating has no page worth showing), from a public account.
- **Which lists count:** Public, at least one entry, not hidden, owner's account public. An empty list says `noindex`.
- **Which authors count:** an author with at least one book that counts (the rule above). Others say `noindex, follow`.
- **"Don't index" is the default.** The app's new page-title hook marks a page `noindex` unless the page says otherwise, so a new page (settings, admin, feed, journal…) can't end up on Google by accident. Only the landing page, What's new, the legal pages and the four kinds above opt in, and the four only when the rules above say so.
- **Spanish.** `/es/books/OL1W` is the Spanish version of `/books/OL1W` (`specs/language-share-links.md`). Both are in the sitemap, each names the other as its other-language version (`hreflang`), so Google shows Spanish speakers the Spanish address. Other languages wait until their translations are checked (memory: only English and Spanish reviewed).
- **The API must be readable by Google.** For Phase 1 to work at all, Googlebot has to fetch the API calls the page makes. `api.wingedwords.app/robots.txt` allows everything, and every API answer carries `X-Robots-Tag: noindex`, so the JSON itself never shows up in results.
- **Search engine bots in Phase 2:** `Googlebot`, `bingbot` (Bing, which also feeds DuckDuckGo and others), `DuckDuckBot`, `Applebot` (Apple's search; today it's on the preview-bot list and gets a card, it moves to the search list). `Google-InspectionTool` too, so Search Console's live test sees what Googlebot sees.
- **Same content, never more.** Google allows a separate HTML page for bots only if it shows what people see. The Phase 2 page shows only what a signed-out visitor sees on that page, through the same access rules, never anything extra. Someone faking Googlebot's name gets the same public content a visitor gets, so there's nothing to protect beyond load (rate limit).
- **Real "not found" for bots.** In Phase 2, an unknown, private or hidden page answers **404** with `noindex` to search bots. Private and unknown look the same, so a 404 doesn't show that something exists. (Preview cards keep answering the generic card; that's for chat apps.)
- **No Open Library calls from bots.** As with the cards, Phase 2 reads only our database. A book or author we don't have is a 404 to bots. Bots can't fill the cache or spend our Open Library budget.
- **Structured data on book pages (Phase 2):** a small `Book` description in the format Google reads (JSON-LD: title, author, cover, ISBN if we have one, and our average rating with its count once a book has 3+ ratings). This is what can show stars under a result. Only our own readers' ratings, never Open Library's.
- **Sitemap from the API.** `wingedwords.app/sitemap.xml` is passed by nginx to the API, like the card. The API builds it from the database and keeps it for an hour. One file holds up to 50,000 addresses; a sitemap index (a list of sitemap files) is added only when we get near that.
- **Search Console and Bing Webmaster Tools are the user's steps**, written up in DEPLOY.md: verify the domain with a DNS TXT record at Porkbun, submit the sitemap, then in Bing import from Search Console.
- **Expectations.** Google takes weeks to read and rank a new site. Being found depends most on pages nobody else has (our readers' reviews, ratings and lists) and on other sites linking here (the Reddit answers from `specs/shareable-pages.md`). This spec makes sure nothing stands in the way; it can't make Google rank us.

## 3. Design

### 3.1 Data

No new tables or columns. "Books readers used", "authors with such a book", the counting reviews and lists are database queries in a new `SearchPagesService` (or repository methods behind it), shared by the sitemap (Phase 1) and the bot pages (Phase 2) so the rules live in one place.

### 3.2 Backend

**Phase 1**
- `GET /api/seo/sitemap.xml`, anonymous, rate-limited, `application/xml`. Lists: `/`, `/whats-new`, `/privacy`, `/terms`, `/guidelines`; counting books, authors, lists and reviews, each with `<lastmod>` (latest log, review or list change) and its `/es` alternate (`xhtml:link rel="alternate" hreflang`). Kept in memory for an hour. Addresses built from the site's base URL setting (as the card service does), never from the request.
- `GET /robots.txt` on the API: `User-agent: *` / `Allow: /`.
- `X-Robots-Tag: noindex` on every API answer (one middleware), except `robots.txt`.
- `GET /api/seo/indexable?path=…`, or the same answer folded into the existing page endpoints: the app needs to know whether a book/author/list/review page counts. **Prefer** adding one `indexable: bool` field to the existing book, author, list and review answers over a new endpoint.
- Check the anonymous rate limits on the endpoints these pages call (book, ratings, insights, list, review, author) leave room for Googlebot rendering pages one after another. Note what was found in the build notes.

**Phase 2**
- `GET /api/seo/page?path=…&lang=en|es`, anonymous, its own rate limit (higher than the card's: a crawl is many pages in a row), `text/html; charset=utf-8`. Pages, with everything HTML-escaped (reuse `ShareCardPage`'s `Encode`):
  - **Head** for every page: `<title>`, description, canonical, `hreflang` to the other language, `robots` meta (`index` or `noindex, follow` by the §2 rules), the same `og:` tags as the card.
  - **Book:** title, authors (links to their author pages), cover, description (in the page's language, `BookLocalizations`), first published, our average rating and count, the newest 10 counting reviews (reviewer's name, stars, text; links to the review), up to 10 public lists it's on (links), the JSON-LD above, a link "Open in Winged Words".
  - **Author:** name, photo, bio, years, their books we have (links), lists with this author.
  - **List:** title, description, owner's display name, entries in order (books or authors, with links), like count.
  - **Review:** book (link), stars, text, reviewer's display name, date, like count. A spoiler review: page with `noindex`, no text (as the card).
  - Unknown, private, hidden: `404` with `noindex`, a plain "not found" body.
- Tests: each "doesn't count" rule (private account, hidden, spoiler, empty list, unused book) gives `noindex` or 404; private and unknown answer the same; `<`, `"`, `&` in titles escaped; no Open Library call for an unknown book; sitemap leaves out everything that doesn't count and every `/u/` address.

### 3.3 Frontend

**Phase 1**
- `public/robots.txt` on the site: allow all; `Disallow:` the signed-in-only areas (`/settings`, `/admin`, `/notifications`, `/journal`, `/feed`, `/stats`, `/clubs/` except `/clubs/join/`, `/login`, `/register`, `/confirm-…`, `/reset-password`, `/email-off`, `/u/`); `Sitemap: https://wingedwords.app/sitemap.xml`. *Note:* `Disallow: /u/` stops Google reading profiles, but also stops it seeing their `noindex`; that's fine because a disallowed page with no links in isn't shown. Keep both.
- nginx: `location = /sitemap.xml` passed to the API (same pattern as `/__share-card`, no cookies, short timeout).
- `usePageMeta({ title, description, canonical, index })`: sets `document.title` ("*Title* · Winged Words"), the description meta, `<link rel="canonical">`, `hreflang` alternates and `<meta name="robots">`. `index` defaults to `false` (§2.2). Resets on leaving the page.
- Used on: landing (index), What's new and legal pages (index), book / author / list / review (index from the API's `indexable`), every other page title-only with `noindex`. Profile: always `noindex`. A not-found or private state: `noindex`.
- Titles and descriptions through `t()` in all five locales.
- Check that links between these pages are real `<a href>` links (React Router's `Link` is), not buttons that navigate in code, so Google can follow them.
- `index.html` itself has no `robots` meta, since it is also the landing page. The hook adds `noindex` on the other pages once the app runs.

**Phase 2**
- nginx: a second `map`, `$search_bot`, for the bots in §2.2; `applebot` leaves `$preview_bot`. On the book, author, list and review paths (with and without `/es`), a search bot is sent to `/__seo-page`, an internal location like `/__share-card` but passing `/api/seo/page` and **keeping the API's status code** (a 404 stays a 404). If the API can't answer: a `503` so Google tries again later, never `index.html` (an empty app page would be stored as the real one). Profiles and club links stay as today for search bots (they get the app, which says `noindex`).

### 3.4 The user's steps (DEPLOY.md)

1. Search Console → Add property → **Domain** `wingedwords.app` → copy the TXT record → Porkbun → DNS → add it → Verify.
2. Search Console → Sitemaps → submit `https://wingedwords.app/sitemap.xml`.
3. URL Inspection → paste one book, author, list and review address → **Test live URL** → View tested page → the screenshot and HTML show the content.
4. Bing Webmaster Tools → sign in → **Import from Google Search Console**.
5. A week later: Search Console → Pages: what's indexed, what's not and why.

## 4. Tasks

### Phase 1 — The basics

#### Backend
- [ ] Shared "counts for search" rules (books readers used, authors, lists, reviews) in one service.
- [ ] `GET /api/seo/sitemap.xml` with `/es` alternates and `lastmod`, cached an hour, rate-limited.
- [ ] API `robots.txt` allowing all; `X-Robots-Tag: noindex` on every API answer.
- [ ] `indexable` on the book, author, list and review answers.
- [ ] Check the anonymous rate limits leave room for Googlebot; note it in the build notes.
- [ ] Tests: sitemap leaves out private, hidden, spoiler, empty and unused, and every `/u/`; `indexable` follows the same rules.

#### Frontend
- [ ] `public/robots.txt`; nginx `/sitemap.xml` to the API.
- [ ] `usePageMeta` hook, `noindex` by default; used on every page (§3.3).
- [ ] Titles and descriptions in all five locales.
- [ ] Links between book, author, list and review pages are real `<a href>`.
- [ ] Privacy policy line: public reviews and lists may appear in search engines (all five languages); a What's new entry.

#### Verification
- [ ] `argos-security` review (new anonymous endpoint, what goes in the sitemap, `noindex` on profiles).
- [ ] `reviewer` pass.
- [ ] Browser check: the tab title changes per page; a profile, settings and a private list have `noindex` in the page; a used book has none; an unused one has `noindex, follow`.
- [ ] Live: `https://wingedwords.app/robots.txt`, `/sitemap.xml` and `https://api.wingedwords.app/robots.txt` answer; the sitemap opens without errors in Search Console.
- [ ] The user's Search Console and Bing steps (§3.4, 1–4).

### Phase 2 — Plain HTML pages for search engines

#### Backend
- [ ] `GET /api/seo/page` for book, author, list and review, English and Spanish, escaped, its own rate limit, no Open Library calls, 404 for unknown/private/hidden.
- [ ] Book JSON-LD (rating only with 3+ ratings, our readers' only).
- [ ] Tests: the §3.2 Phase 2 list.

#### Frontend
- [ ] nginx `$search_bot` map; `applebot` moved from `$preview_bot`; `/__seo-page` keeping the status code, `503` when the API can't answer.

#### Verification
- [ ] `argos-security` review (new anonymous endpoint, nginx routing, same-content rule).
- [ ] `reviewer` pass.
- [ ] Live: `curl -A "Googlebot" https://wingedwords.app/books/OL…` returns the book's HTML; an unknown id returns 404; a normal browser still gets the app; `curl -A "redditbot"` still gets the card.
- [ ] Search Console → URL Inspection → Test live URL on one page of each kind shows the content; Google's Rich Results Test finds the `Book` data.
- [ ] A week after: Search Console → Pages, note what's indexed in the build notes (§3.4, 5).

## 5. Not in this spec

- Full server rendering (§2.1).
- Reader profiles, clubs, writings in search.
- Languages other than English and Spanish.
- Genre or "popular" pages made for search (they'd come with "Popular this week + genre pages" in FUTURE-IDEAS.md).
