# Feature Spec — Found on Google (search engines)

**Status:** Planned 2026-10-28, decisions asked the same day (§2.1); clubs added 2026-11-02 (§2.3). **Phase 1 built 2026-11-02 and live (§6). Phase 2 built 2026-11-11, not deployed yet (§7).** Three phases: Phase 1 (the basics: robots.txt, sitemap, a title per page, "don't index" where needed, Search Console; size M), Phase 2 (plain HTML pages for search engine bots on books, authors, lists and reviews; size M–L), Phase 3 (public clubs and club topic pages; size S–M, after Phases 1–2 are live). Resolves SPEC.md §10's open SEO/SSR question: no full server rendering (§2.1).

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
### 2.3 Clubs, asked 2026-11-02

- **Every public club can be found, no extra switch.** Public already means anyone can find and join it in Discover; Google is one more place. An admin who doesn't want that makes the club private (members stay, `specs/stronger-clubs.md`). What's new tells admins this when Phase 3 goes live.
- **Phase 3 of this spec**, built after Phases 1–2 are live and Search Console shows pages being indexed.
- *Decided by me, to confirm:*
  - **What a club shows Google** is exactly the visitor card from `specs/clubs-for-visitors.md` (`GET /api/clubs/{id}/preview`): picture, name, description, current book and cover, member count, topics, language, rules. Never discussions, members or progress.
  - **A club counts** when it's public, not a buddy read, has a description and at least 2 active members. Others say `noindex, follow` (thin pages, as with unused books).
  - **Private clubs, buddy reads and deleted clubs** are a 404 to bots, the same as an unknown id, so their names never show.
  - **Invite links (`/clubs/join/<token>`) are never indexed.** The address changes when an admin resets the link, and a private club's link is a key. The club's page `/clubs/:id` is the one address Google gets.
  - **Topic and language pages** are Discover with one filter: `/clubs?topic=fantasy` ("Fantasy book clubs") and `/clubs?lang=es` ("Book clubs in Español"). Only these single-filter forms are indexable (search text, sort and combined filters say `noindex` and point their canonical to the single-filter form). A topic or language page counts when it lists at least 2 counting clubs; plain `/clubs` always counts.

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
- `GET /api/seo/page?path=…&lang=en|es`, anonymous, its own rate limit (higher than the card's: a crawl is many pages in a row), `text/html; charset=utf-8`. Built so a new kind is one more case (Phase 3 adds clubs). Pages, with everything HTML-escaped (reuse `ShareCardPage`'s `Encode`):
  - **Head** for every page: `<title>`, description, canonical, `hreflang` to the other language, `robots` meta (`index` or `noindex, follow` by the §2 rules), the same `og:` tags as the card.
  - **Book:** title, authors (links to their author pages), cover, description (in the page's language, `BookLocalizations`), first published, our average rating and count, the newest 10 counting reviews (reviewer's name, stars, text; links to the review), up to 10 public lists it's on (links), the JSON-LD above, a link "Open in Winged Words".
  - **Author:** name, photo, bio, years, their books we have (links), lists with this author.
  - **List:** title, description, owner's display name, entries in order (books or authors, with links), like count.
  - **Review:** book (link), stars, text, reviewer's display name, date, like count. A spoiler review: page with `noindex`, no text (as the card).
  - Unknown, private, hidden: `404` with `noindex`, a plain "not found" body.
- Tests: each "doesn't count" rule (private account, hidden, spoiler, empty list, unused book) gives `noindex` or 404; private and unknown answer the same; `<`, `"`, `&` in titles escaped; no Open Library call for an unknown book; sitemap leaves out everything that doesn't count and every `/u/` address.

### 3.3 Frontend

**Phase 1**
- `public/robots.txt` on the site: allow all; `Disallow:` the signed-in-only areas (`/settings`, `/admin`, `/notifications`, `/journal`, `/feed`, `/stats`, `/clubs/*/settings`, `/clubs/join/`, `/login`, `/register`, `/confirm-…`, `/reset-password`, `/email-off`, `/u/`); `Sitemap: https://wingedwords.app/sitemap.xml`. *Note:* `Disallow: /u/` stops Google reading profiles, but also stops it seeing their `noindex`; that's fine because a disallowed page with no links in isn't shown. Keep both.
- nginx: `location = /sitemap.xml` passed to the API (same pattern as `/__share-card`, no cookies, short timeout).
- `usePageMeta({ title, description, canonical, index })`: sets `document.title` ("*Title* · Winged Words"), the description meta, `<link rel="canonical">`, `hreflang` alternates and `<meta name="robots">`. `index` defaults to `false` (§2.2). Resets on leaving the page.
- Used on: landing (index), What's new and legal pages (index), book / author / list / review (index from the API's `indexable`), every other page title-only with `noindex`. Profile: always `noindex`. A not-found or private state: `noindex`.
- Titles and descriptions through `t()` in all five locales.
- Check that links between these pages are real `<a href>` links (React Router's `Link` is), not buttons that navigate in code, so Google can follow them.
- `index.html` itself has no `robots` meta, since it is also the landing page. The hook adds `noindex` on the other pages once the app runs.

**Phase 2**
- nginx: a second `map`, `$search_bot`, for the bots in §2.2; `applebot` leaves `$preview_bot`. On the book, author, list and review paths (with and without `/es`), a search bot is sent to `/__seo-page`, an internal location like `/__share-card` but passing `/api/seo/page` and **keeping the API's status code** (a 404 stays a 404). If the API can't answer: a `503` so Google tries again later, never `index.html` (an empty app page would be stored as the real one). Profiles and club links stay as today for search bots (they get the app, which says `noindex`).

### 3.4 Phase 3 — Clubs

**Backend**
- The "counts for search" service gains clubs and club topic/language pages (§2.3), reading the same public-club rules as the directory and `/preview`.
- Sitemap: counting clubs (`/clubs/<id>`, `lastmod` = the club's `LastActiveAt` day), `/clubs`, and the counting `/clubs?topic=…` and `/clubs?lang=…` pages, with `/es` alternates.
- `indexable` on the `/preview` answer and on the directory answer (for the filter shown).
- `/api/seo/page` for `clubs/<id>`: the card's fields as HTML, the current book linked to its book page, "Join on Winged Words". For `/clubs` with one topic or language: the heading, then each counting club's name (linked), description, topics, language and member count, in the "Most members" order. Topic names in the page's language (the same `GenreCatalog` names the app shows).
- Tests: private club, buddy read, deleted and unknown answer the same 404; a club with 1 member or no description says `noindex, follow`; no member names or token in the page; a topic page with fewer than 2 counting clubs says `noindex`.

**Frontend**
- `usePageMeta` on `ClubPage` (visitor card and member view, index from `indexable`), `ClubsDirectoryPage` (index only for plain `/clubs` or one filter), `ClubJoinPage` (always `noindex`). Titles such as "Slow Sci-Fi Society · book club" and "Fantasy book clubs", through `t()` in all five locales.
- nginx: add `clubs/<uuid>` to the search-bot paths, and `location = /clubs` sending search bots to `/__seo-page` with the query string. `clubs/join/` stays on the preview-bot route only.
- What's new entry: public clubs can appear on search engines; make a club private if you'd rather it didn't. Privacy policy line updated to name clubs.

### 3.5 The user's steps (DEPLOY.md)

1. Search Console → Add property → **Domain** `wingedwords.app` → copy the TXT record → Porkbun → DNS → add it → Verify.
2. Search Console → Sitemaps → submit `https://wingedwords.app/sitemap.xml`.
3. URL Inspection → paste one book, author, list and review address → **Test live URL** → View tested page → the screenshot and HTML show the content.
4. Bing Webmaster Tools → sign in → **Import from Google Search Console**.
5. A week later: Search Console → Pages: what's indexed, what's not and why.

## 4. Tasks

### Phase 1 — The basics

#### Backend
- [x] Shared "counts for search" rules (books readers used, authors, lists, reviews) in one service.
- [x] `GET /api/seo/sitemap.xml` with `/es` alternates and `lastmod`, cached an hour, rate-limited.
- [x] API `robots.txt` allowing all; `X-Robots-Tag: noindex` on every API answer.
- [x] `indexable` on the book, author, list and review answers.
- [x] Check the anonymous rate limits leave room for Googlebot; note it in the build notes.
- [x] Tests: sitemap leaves out private, hidden, spoiler, empty and unused, and every `/u/`; `indexable` follows the same rules.

#### Frontend
- [x] `public/robots.txt`; nginx `/sitemap.xml` to the API.
- [x] `usePageMeta` hook, `noindex` by default; used on every page (§3.3); club pages wait for Phase 3.
- [x] Titles and descriptions in all five locales.
- [x] Links between book, author, list and review pages are real `<a href>`.
- [x] Privacy policy line: public reviews and lists may appear in search engines (all five languages); a What's new entry (drafted in §6, to post on the admin page after the deploy).

#### Verification
- [x] `argos-security` review (new anonymous endpoint, what goes in the sitemap, `noindex` on profiles).
- [x] `reviewer` pass.
- [x] Browser check: the tab title changes per page; a profile, settings and a private list have `noindex` in the page; a used book has none; an unused one has `noindex, follow`.
- [x] Live (2026-11-02): `https://wingedwords.app/robots.txt`, `/sitemap.xml` (378 pages, no `/u/`) and `https://api.wingedwords.app/robots.txt` answer. Search Console first said "No se ha podido obtener" for the sitemap right after submitting; it fetches fine with a Googlebot user agent, so recheck it the next day.
- [x] The user's Search Console and Bing steps (§3.5, 1–4), done 2026-11-02: domain verified by TXT record, sitemap submitted, live test passed on a used book, an author, a review and a list (an unused book correctly says `noindex`), indexing requested for `/` and `/es` (`/` was already indexed, old version), Bing imported from Search Console. Left: the sitemap status the next day, and step 5 a week later (about 2026-11-09).

### Phase 2 — Plain HTML pages for search engines

#### Backend
- [x] `GET /api/seo/page` for book, author, list and review, English and Spanish, escaped, its own rate limit, no Open Library calls, 404 for unknown/private/hidden.
- [x] Book JSON-LD (rating only with 3+ ratings, our readers' only).
- [x] Tests: the §3.2 Phase 2 list.

#### Frontend
- [x] nginx `$search_bot` map; `applebot` moved from `$preview_bot`; `/__seo-page` keeping the status code, `503` when the API can't answer.

#### Verification
- [x] `argos-security` review (new anonymous endpoint, nginx routing, same-content rule), 2026-11-11.
- [x] `reviewer` pass, 2026-11-11.
- [x] The user's step before the live checks: set `SHARE_CARD_API_URL` on the site service to the API's internal address (DEPLOY.md, "Link previews"), so each bot has its own budget (§7). *Done 2026-11-11 (second try, after Apollon 176f02a): the site logs `http://wingedwords-api.own-db7akpnavr4c73fg1tf0.svc.cluster.local:8080/api`; every live check above passes through it.*
- [x] Live: `curl -A "Googlebot" https://wingedwords.app/books/OL…` returns the book's HTML; an unknown id returns 404; a normal browser still gets the app; `curl -A "redditbot"` still gets the card. *Checked 2026-11-11 (Apollon 4399a1e): a sitemap book, author, list and review give their page with no `noindex`, an unused book `noindex, follow`, an unknown one 404 `noindex`, `/es` the Spanish title, a browser the app, redditbot the card, `/sitemap.xml` 200.*
- [ ] Search Console → URL Inspection → Test live URL on one page of each kind shows the content; Google's Rich Results Test finds the `Book` data.
- [ ] A week after: Search Console → Pages, note what's indexed in the build notes (§3.5, 5).

### Phase 3 — Clubs (after Phases 1–2 are live)

#### Backend
- [x] Club and topic/language rules in the "counts for search" service; clubs in the sitemap; `indexable` on `/preview` and the directory (a small `GET /api/clubs/indexable?topic=&language=`, since the directory answer is a plain list).
- [x] `/api/seo/page` for a club and for `/clubs` with one topic or language.
- [x] Tests: the §3.4 list (`ClubSearchPagesTests`).

#### Frontend
- [x] `usePageMeta` on the club page, Discover and the invite page; titles in all five locales.
- [x] nginx: club paths and `/clubs` with its query string for search bots.
- [x] Privacy policy line (all five languages, dated 2026-11-11). What's new entry drafted in §8, to post on the admin page after the deploy.

#### Verification
- [x] `argos-security` review, 2026-11-11: nothing to fix.
- [x] `reviewer` pass, 2026-11-11: nothing blocking.
- [ ] Live: `curl -A "Googlebot"` on a public club, a private club (404), an invite link (the app, not indexed) and `/clubs?topic=fantasy`; Search Console's live test on one club.

## 5. Not in this spec

- Full server rendering (§2.1).
- Reader profiles and writings in search.
- Languages other than English and Spanish.
- Genre or "popular" pages made for search (they'd come with "Popular this week + genre pages" in FUTURE-IDEAS.md).

## 6. Build notes (Phase 1, 2026-11-02)

- **Taken over from another session.** A parallel session had started on the front page's Spanish result (the user's ask: Google showed only the English description). Its pieces were kept and folded in: the build writes `home.html` (served by nginx for exactly `/`) and `es/index.html` with a canonical and `hreflang` en/es/x-default, so `/` and `/es` name each other before the app runs. Its static `public/sitemap.xml` and allow-all `robots.txt` were replaced by the ones below.
- **Rules in one place:** `SearchPagesRepository` (behind `SearchPagesService`). A public reader is not private, not away or suspended, and not the "deleted" placeholder. A rating or review counts when the review and the reading are both Public and it isn't hidden (checked by name, since the Hidden filter lets an owner's own through). **Reviews with an inline `||spoiler||` don't count either** (decided in review: the covered text is in the page's HTML, so Google could match or quote it), the same rule as the landing page's showcase; their book still counts. A list counts when it's Public, not hidden, from a public reader, with an entry. Authors only when Winged Words has their row.
- **Sitemap:** `GET /api/seo/sitemap.xml` (Public rate limit, 60 a minute per address), kept in memory for an hour. The site's own pages first, then every other page newest first, cut at 25,000 pages (50,000 addresses) with a warning in the log. Each page is two `<url>`s (`/x` and `/es/x`), each naming en, es and x-default. `lastmod` is the day of the latest rating, review, edit or list addition (books, authors), list change, or review change. nginx `location = /sitemap.xml` passes it through the share-card route without cookies, credentials or the API's `X-Robots-Tag`; an error stays an error. Checked in Docker against a stand-in API.
- **API:** `GET /robots.txt` allows everything; every other answer carries `X-Robots-Tag: noindex` (Program.cs). `indexable` is set only by the four page GETs (book, author, list, review); mutation answers say false, which only affects a signed-in tab's own head.
- **`usePageMeta`:** one call per page, at its top level. The newest page's claim is shown; with none, the defaults are "Winged Words" and `noindex` (`startPageMeta` in `main.tsx`, before the first render; `index.html` itself has no robots tag, since it is also the front page). An indexable page gets no robots tag, a canonical, and hreflang en/es/x-default. The canonical is the `/es` one while the app is in Spanish, because `initLanguage` strips `/es` from the address. In a production build the addresses always use `https://wingedwords.app`, never the `.onrender.com` host. A page not indexed but with useful links (unused book, author, review) says `noindex, follow`. Covered inline spoilers carry `data-nosnippet`.
- **Titles:** new `pageMeta` locale section (five languages; only en and es checked). Book "Title by Author", list "Title, a list by Name", review "Name's review of Title" (its description is the opening up to the first `||`), author and profile by name, the front page the og:title. About 30 app pages got a title from their existing heading keys and stay `noindex`. Club pages have no hook yet (Phase 3), so they get the defaults.
- **Links:** every link between book, author, list and review pages is a router `Link` (`<a href>`); the browser check counted them on a book page.
- **Rate limits for Googlebot (checked, no change):** a book page makes one call in the Search bucket (`GET /api/books/{id}`, 30 a minute per address); ratings, insights, lists and reviews have no per-address limit. An author page makes two (`/authors/{id}` and `/works`) plus `/stats` (Public, 60). So one Googlebot address could render 30 book or 15 author pages a minute. Google renders from many addresses and at a small site's crawl rate, so that's enough; a 429 would show it an empty page. Phase 2 removes the dependence for these four kinds.
- **Privacy policy:** one sentence added to "Who can see what you post" in all five languages ("Public reviews and lists from public accounts can also appear in search engines such as Google, with your display name. Your profile page never does."), dated November 2, 2026.
- **What's new entry, to post after the deploy** (admin page):
  - *EN:* **Winged Words on Google.** Public reviews and lists can now show up in search engines like Google, so someone searching for a book can find what readers here think of it. Only what anyone can already see without signing in: reviews and lists set to Public, from public accounts. Spoilers stay out, and profiles are never shown. To keep a review or list out, set it to Followers or Private, or make your account private.
  - *ES:* **Winged Words en Google.** Las reseñas y listas públicas ya pueden aparecer en buscadores como Google, para que quien busque un libro encuentre lo que opinan los lectores de aquí. Solo lo que cualquiera ya puede ver sin iniciar sesión: reseñas y listas públicas de cuentas públicas. Los spoilers quedan fuera, y los perfiles nunca aparecen. Para dejar fuera una reseña o lista, ponla para seguidores o privada, o haz tu cuenta privada.
- **Tests:** `SearchPagesTests` (one seeded set checked in the sitemap and in each page's `indexable`: private account, Followers review, private reading, hidden review and list, suspended reader, spoiler and inline spoiler, empty, Private and Unlisted lists, unused book and author, no `/u/`; the sitemap first built by a signed-in owner; robots.txt and the header), `usePageMeta.test.tsx`. Full suites: 1991 backend, 1345 Vitest, lint and build pass.
- **Browser check (side ports):** all nine checks passed: front page and `/es` (Spanish title, description and canonical), used book (no robots tag), unused book (`noindex, follow`), public list, review (description from its opening), profile, settings and a private list (`noindex`), and in-app navigation swapping title and canonical cleanly.

Reviews: `reviewer` (fixed: inline spoilers out of search; `data-nosnippet` moved from the button to its span, where Google reads it; canonical on the fixed site address instead of the request's host; trailing slash dropped; nginx hides the API's `X-Robots-Tag` on the sitemap; the cap keeps the newest pages). `argos-security`: nothing a visitor couldn't already see; its test cases added (private reading, suspended reader, hidden list, sitemap built while signed in). Two points left for the user:

**Decided 2026-11-02 (both lean to the reader's privacy; to build before Phase 2):**
1. **Private accounts' comments:** a signed-out visitor (and so Google) sees a private account's comment on a public review or list as "A reader", with no name or link. Signed-in readers see it as today. A server change on the comment answers plus a test; the privacy line needs no change.
2. **"Show me in discovery" off:** those readers' reviews and lists stay out of the sitemap and say `noindex` (`indexable` false), so their name never reaches search. Their ratings still count toward a book. A rule added to `SearchPagesRepository` plus tests.
- [x] Build both (backend S, then re-check the sitemap test set). **Built 2026-11-02.** (1) `CommentDto.AuthorAnonymous`: for a signed-out viewer, `AnnotationCommentsController.EnrichAuthors` blanks user id, username, display name and avatar of a private account's comment (whole-post and highlight answers); the comment components show "A reader" (`comments.aReader`, five languages) with no link. (2) `SearchPagesRepository`: `CountingReviews` and `CountingLists` also need `IsDiscoverable`; ratings and text reviews still make a book count, but a book only reachable through a discovery-off reader's list does not. Tests: `SearchPagesTests` (a fourth reader with discovery off in the sitemap set; `PrivateAccountsComments_AreAnonymousToVisitorsOnly`), one Vitest case.

## 7. Build notes (Phase 2, 2026-11-11)

- **One service, the app's own rules.** `SeoPageService` builds each page from the services the app's pages call, as a signed-out visitor: `BookListService.GetByIdAsync` + `BookListDtoMapper` (list), `LogService.GetReviewAsync` + `ReviewAccess` + `ReviewDtoMapper` (review), `ReviewSocialService.GetPageAsync` / `GetRatingSummaryAsync` and `ListDiscoveryService` (book and author). `CurrentViewer.AsVisitor()` makes the database's "hidden by the admin" filter treat the caller as nobody too, so a reader calling the API with their own token doesn't see their own hidden review or list on the page (found in the security review). `indexable` is `SearchPagesService`'s, the same answer the app's pages get.
- **What each page shows.** Book: title, authors (links), cover, first published, our average once there are 3+ ratings, description, the newest 10 reviews that count (text, no whole-review or inline spoiler, from readers a visitor sees), up to 10 lists, JSON-LD `Book` (`aggregateRating` only with the average). Author: name, photo, years, bio, up to 50 of their books we have (`IBookRepository.GetByAuthorKeyAsync`, oldest first), up to 10 lists. List: title, owner, size, description, entries (books or authors, numbered when ranked), likes; item notes left out. Review: book (link), cover, reader and date, stars, text with each inline `||spoiler||` replaced by "[spoiler]" (an unclosed one covers the rest), likes; a whole-review spoiler shows no text. Every page links "Open in Winged Words" and carries the card's `og:` tags (`ShareCardService.FindAsync`, `ShareCardPage.AppendPreviewTags`).
- **Titles match the app's** `pageMeta` texts in English and Spanish (`SeoPageTexts`), including "A, B and others" past three authors and a former reader's review titled by its book alone (found in review).
- **Not found:** unknown, private and hidden give the same 404 page (it depends only on the language), `noindex`.
- **Robots:** the API's own address always answers `X-Robots-Tag: noindex` (so `api.wingedwords.app/api/seo/page` is never indexed, found in the security review); the page's rule comes in `X-Page-Robots` (`noindex, follow` for a page that doesn't count, `noindex` for a 404, none for one that counts) and nginx turns it into the site's `X-Robots-Tag`. The HTML has the same rule as a `robots` meta.
- **nginx:** `$search_bot` = googlebot, google-inspectiontool, bingbot, duckduckbot, applebot (moved from `$preview_bot`). A new location for `books|authors|lists|reviews` (with or without `/es`) comes before the other shareable pages: search bot → `/__seo-page`, preview bot → the card, people → the app. `/__seo-page` strips cookies and credentials, keeps the API's status (a 404 stays a 404), and turns 400, 429, 5xx or an unreachable API into `503` with `Retry-After: 120`. Profiles, clubs and invites stay the app for search bots. Checked in Docker against a stand-in API: every bot, both languages, a person, a preview bot, 404, 429, 500, API down, and the robots header mapping.
- **Rate limit:** `SeoPagesPerMinute` = 300 per address. **Open point (security review, Low–Medium):** while nginx reaches the API through its public address, every bot shares that one budget, so someone sending "Googlebot" in a loop could make real search bots get 503s for as long as it runs. Fix: the user's step above (Render's private network, as planned for the cards). A book page costs roughly 15–20 queries, about half of them repeated for the `og:` tags; fine at today's size, the first thing to trim if it shows in the API's memory or the database.
- **Tests:** `SeoPageTests` (19): used book (content, escaping, links, a private account's review left out, no average under 3 ratings), average and JSON-LD at 3 ratings, unused book `noindex, follow`, unknown book and author 404 with zero calls to Open Library (counted at the HTTP level; checked that the counter catches a real call), other paths 404, Followers/private-account/hidden/unknown reviews the same 404 even asked by their author, spoiler and inline-spoiler reviews, lists (public, empty, private, hidden), authors (used and unused), Spanish book and review, many authors, discovery-off reader and the caller's own hidden review. `AnonymousEndpointsTests` lists the endpoint. Full backend suite 2081/2081.
- **Left:** the user's Render step, deploy, then the live checks above.

## 8. Build notes (Phase 3, 2026-11-11)

- **Rules:** `SearchPagesRepository.CountingClubRows` (public, `Kind == Club`, non-blank description, 2+ active members); `SearchPagesService` adds `IsClubIndexableAsync`, `IsClubFilterIndexableAsync` (plain `/clubs` always; one topic or language with 2+ counting clubs; both filters or an unknown value never) and `GetFilterClubsAsync`. Sitemap: `/clubs` as a site page, each counting club (`lastmod` = day of its newest activity), each counting `/clubs?topic=` and `/clubs?lang=` page, all with `/es` alternates.
- **Pages:** `SeoPageService.Clubs.cs`. A club page is the `/preview` card as HTML (picture, members count, topics, language, description, current book linked, rules, "Join on Winged Words"); no member, token or discussion is read. The directory page lists counting clubs most members first (50 max). nginx passes `topic=$arg_topic&clubLang=$arg_lang`; the API checks them against `GenreCatalog` and the supported languages (unknown = 404; both filters = shown, `noindex, follow`, canonical the topic's). Topic names in English and Spanish live in `SeoPageTexts`.
- **App:** `ClubJoinPreviewDto` gained `topics`, `language`, `indexable`. `usePageMeta` got a `query` option for the canonical. `PublicClubPreview` and the directory set meta; the member view only titles itself (small `ClubTitle` component, since the page returns early); the invite page is always `noindex`.
- **nginx:** `clubs/<id>` and `/clubs` moved into the book/author/list/review location; the profile and invite location keeps only `u/` and `clubs/join/`. Checked in Docker against a stand-in API: bots, `/es`, filters, an invite link, preview bots and browsers.
- **Deviations:** a noindex directory page gets no canonical; nginx doesn't pass `?q=` or `?sort=`, so a bot on `/clubs?q=x` gets the plain page; the member view never says `index` (bots never reach it).
- **Reviews (both clean). Minor, left:** `GetCountingClubsAsync` is uncached and runs on each `/clubs/indexable` call and twice per bot render of a directory page (cache a few minutes if clubs grow); the app trims a club's meta description with `truncate`, the server with `Cut` (differ only on multi-line text); `SeoPageTexts` hard-codes Spanish genre names (could drift from `catalog.json`); the directory canonical doesn't `encodeURIComponent` the topic; the sitemap cache can keep a just-privated club's id for up to an hour (its page is already 404).
- **Tests:** `ClubSearchPagesTests` (5), `ClubsControllerTests` field sets, `SeoPageTests` 404 list, `usePageMeta`, directory, join and club page Vitest cases. Full Vitest 1455 pass; backend run is the precheck's.
- **What's new entry, to post after the deploy:**
  - *EN:* **Public clubs on Google.** Public book clubs can now show up in search engines, with their name, description, current book and member count, never who the members are. To keep a club out, make it private.
  - *ES:* **Clubes públicos en Google.** Los clubes de lectura públicos ya pueden aparecer en buscadores, con su nombre, descripción, libro actual y número de miembros, nunca quiénes son los miembros. Para dejar un club fuera, hazlo privado.
