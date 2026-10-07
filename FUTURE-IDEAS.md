# Future Ideas — Backlog

Unfiltered capture of feature ideas as they come up, so they don't get lost or force a full design conversation the moment they're mentioned. When there's bandwidth, pick one, talk it through (clarifying questions → spec in `specs/`), then move it into `SPEC.md`'s roadmap and delete it from here.

Not prioritized, not designed, not committed to — just "don't forget this."

- **Account-level privacy settings (public / private account)** — **Queued as SPEC.md §4 Next up #7 (2026-10-06); keep these notes for its spec.** public / followers-only / private-to-self, Letterboxd-style, applied consistently across Logs/Posts/Writings/Reviews (possibly with a per-entry override later, like Letterboxd's private diary entries). Raised 2026-09-30 alongside `specs/writings-and-annotations.md`. Per-review privacy (just reviews) is now covered by `specs/reviews-improvements.md` §3.6, so this idea is about everything else. When writings get privacy, `WritingService.SetLikedAsync`/`GetByIdAsync` and `CommentService.GetTargetContentAsync` must check it too, or a private writing could still be found by id through likes and comments (security review of `specs/feed-redesign.md` Phase 1, 2026-10-05).
  - **Why it matters now (2026-10-04, from the reading-stories security review):** every reader's shelves are public today, including reading progress and progress notes. `GET /api/logs?userId=` returns them to anyone, even logged-out visitors; only the review part is gated. The user expects a private profile to hide all of this, and a public one to show it to everyone.
  - **Shape the user wants:** a public account shows shelves and reading updates to anyone. A private account shows them only to approved followers; everyone else sees name and avatar only (Instagram style).
  - **Needs follow requests:** today anyone can follow anyone instantly, so "followers only" protects nothing, because a stranger can just follow. A private account only works if following it needs the owner's approval. The same weakness applies to the existing "Followers" review visibility.
  - **Touches:** profile page, shelves (`LogsController`), the Readings strip and story likes/comments (`ReadingAccess`, `specs/reading-stories.md`), reviews, posts and writings, and the follow flow (pending requests, approve/decline). Big enough for its own spec.
- **Real image upload on a Writing** — actual attached images (not just the book-cover-as-placeholder treatment in `specs/writing-feed-card-and-modal.md`), needing a real decision on storage (local disk vs. cloud object storage vs. URL-only) since Argos has zero upload infrastructure today. Raised 2026-09-30 alongside `specs/writing-feed-card-and-modal.md`, deliberately deferred so the feed-card/modal redesign could ship without it.
- **Book club organizing tools (blocked on notifications)**: meetings per club (date/time, place or video link), going/not-going replies, calendar download (.ics), ranked-choice voting for the next book, and "checkpoint due in 2 days" reminders. Modeled on Bookclubs.com. Raised 2026-10-01 alongside `specs/book-club-improvements.md`, and deferred because Argos has no notification system yet (SPEC.md §4 Phase 2). Notifications should be specced first. Notifications are now SPEC.md §4 Next up #5 (2026-10-06).
- **Import lists from Goodreads / StoryGraph**: upload a Goodreads CSV export (shelves, plus Listopia lists if obtainable) or a StoryGraph export, match books to Open Library by ISBN and fall back to title + author, and create Argos lists from them, with a review screen for books it couldn't match. It could also import reading logs, which overlaps with SPEC.md's "Goodreads import", now SPEC.md §4 Next up #3 (2026-10-06). Lists could be added to that import's spec. Raised 2026-10-01 alongside `specs/book-lists-improvements.md` and deliberately deferred so the list features could ship first.
- **Subgenres and tropes for books and reader discovery**: a second level under the curated genres (e.g. Fantasy → Epic, Urban, Romantasy, Cozy) plus trope tags (e.g. "enemies to lovers", "found family"), so readers and books can be filtered more finely. This needs readers to tag books themselves (Goodreads-shelf or StoryGraph-tag style), because Open Library subjects can't identify subgenres reliably. Raised 2026-10-02 alongside `specs/find-readers-discovery.md`, which ships only the 22 curated genres + audience.
  - **Mood browsing (2026-10-06, `PRODUCT-ANALYSIS.md`):** also let readers browse and filter books by mood, pace and content warnings. The data is already collected by "Readers say" on reviews (`specs/reviews-improvements.md`). This is StoryGraph's main draw.
- **Blocking reaches likes and comments**: a reader who has been blocked can't like, comment on, or highlight-comment the blocker's reviews, lists and writings, and the blocker doesn't see their existing comments. Phase 1 of `specs/find-readers-discovery.md` scoped blocking to discovery, search, follows and feeds. The security review (2026-10-03) pointed out that comments and likes remain the likeliest way a blocked reader keeps reaching someone. Raised 2026-10-03.
- **Notifications for reading stories**: "elena liked your reading update", "dan replied to you". The "You" tile in the Readings strip shows like and comment totals for now, but nothing tells you someone replied. This belongs with the general notification system (also blocking club organizing tools above). Raised 2026-10-04 alongside `specs/reading-stories.md`.
- **Remember seen stories on the server**: the Readings strip remembers which stories you've opened in your browser only (`localStorage`), so a phone and a laptop disagree. Storing it on the server would fix that. Raised 2026-10-04 alongside `specs/reading-stories.md`.
- **Writings on book pages and profiles**: a book's page could show the notes and pieces written about or quoted from it, and a profile could have a Writings tab. Old Posts never appeared there either, so nothing was lost when they became notes. Raised 2026-10-05 alongside `specs/feed-redesign.md`.
- **Notifications can start from `ActivityEvents`**: the Feed's activity history (`specs/feed-redesign.md` §3.1) already records "started / finished / made a list" with a time and an author, which is most of what "Ana finished Dune" notifications or a weekly digest need. Worth reusing when notifications are specced (SPEC.md §4 Next up #5). Raised 2026-10-05.
- **Autosave Writing drafts**: keep an unsent Writing (title, text, quote fields) in the browser while it's being written, and offer to restore it after a crash, a closed tab or a lost connection. Refresh tokens (`specs/app-hardening.md` Phase 2) removed the main way to lose a draft, the silent 60-minute logout, so this is a nice-to-have now. Raised 2026-10-06 alongside `specs/app-hardening.md`.

## From the product analysis (2026-10-06)

Suggestions from `PRODUCT-ANALYSIS.md`, which compared Argos with what readers and writers ask for online (Goodreads, StoryGraph, Fable, Hardcover, Scribophile, AO3). The biggest weaknesses went to SPEC.md §4 "Next up". The analysis has the reasoning and sources for each idea below.

**Everyday reading habit**
- **Mobile-first pass + installable web app (PWA)**: make the five most used screens work well on a phone: log a book, update a page, write a review, the feed, a club checkpoint. Then make the site installable to the home screen. The top complaint about StoryGraph and Hardcover is that their mobile app lags the website.
- **Quick-log actions**: one-tap "+10 pages" and "Finished!" with a quick rating straight from the feed or the Readings strip, plus editing several books' shelves at once. Readers rank fast logging second only to an accurate catalog.
- **"Up next" queue**: reorder the Want-to-read shelf and pin the next 3 books, so a huge to-be-read pile becomes something useful.
- **Reading streaks / reading journal**: optional and off by default. Log minutes or pages per day and show them on a calendar (SPEC.md Phase 2's "Diary calendar view"). This is Bookly's main hook, but Bookly paywalls it, and some readers dislike being turned into a game.

**Sharing and growth**
- **Monthly wrap-up + "Argos Wrapped" year in review**: a shareable image for Instagram/TikTok (BookTok wrap-ups are hugely popular). The text comes from fixed rules, **not AI**: Fable's AI-written summaries insulted users in early 2025 and many left. December 2026 is a natural first target. Builds on the stats page (Next up #6).
- **One-sentence pitch + first screen after sign-up**: decide what Argos is for in one line (e.g. "Track your reading, and read together — spoiler-free") and make onboarding match it. The app has many features but no single message for a new user. *Pitch decided 2026-10-06: "Track your reading, and read together — spoiler-free." It is used on the landing page (`specs/landing-page.md`). The first screen after sign-up is still open.*
- **Public pages search engines can find (SEO)**: book, review and profile pages that Google can index, so people searching for a book land on Argos. Ties to SPEC.md §10's open SSR decision.

**Discovery and reading together**
- **Buddy reads with page-locked comments**: a mini club for 2–5 people with no voting. Each comment is tied to a page number and stays hidden until you reach that page. Reuses club checkpoints and highlight comments. StoryGraph charges for this, so keep it free.
- **Explainable recommendations**: "Readers with your taste loved…", built from taste-compare and follow data, always showing *why* a book was suggested. Readers want discovery but distrust black-box algorithms. Replaces SPEC.md Phase 2's "Basic recommendations".
- **"Popular this week" + genre pages**: a way to find the next book without following anyone yet, which also fills the empty feed of a new user. Already listed in SPEC.md Phase 2.
- **Quotes collection**: save a quote while reading (with page number), show a Quotes tab on profiles and book pages, and turn a quote into a Quote Writing in one click.

**For writers**
- **Chapters / serialised writings**: post a story in parts, with a table of contents and "next chapter" (Wattpad style). Pairs with "Autosave Writing drafts" above.
- **"Ask for feedback" mode on a writing**: the writer asks specific questions ("is the opening slow?") and readers leave structured critique, with highlight comments for line-level notes. Writers' top complaint about writing sites is getting likes instead of useful feedback.
- **Critique credits**: a light version of Scribophile's karma. Writing a critique the writer marks as helpful earns a credit, and requesting feedback costs one, so everyone who asks for feedback also gives some.
- **Tags and content warnings for writings**: AO3-style tags plus browsing writings by genre and tag.
- **Writing prompts & challenges**: a monthly theme or a word-count goal (NaNoWriMo style) that gives writers a reason to come back.

**Later**
- **Library and independent bookshop links**: "check my library" (Libby / WorldCat) and Bookshop.org buy links instead of Amazon. Fits the independent, not-Amazon pitch.
- **Verified author accounts**: authors confirm their book pages, post updates and host club Q&As. Needs moderation (Next up #4) first, given how authors get harassed on Goodreads.
- **Add a book by scanning its barcode (ISBN)**: mainly for the phone, once the mobile pass is done.

## Making money (2026-10-06)

The chosen approach: **Argos stays free and has no ads.** Money comes from readers who choose to support it, never from locking features or selling data. Hosting costs about $7/month (`ACCOUNTS-AND-HOSTING.md` §2.3), so the bar is low. Add these **after public launch**, once people use Argos daily. Asking for money during the beta gets less honest feedback.

**Never charge for these:** logging, reviews, stats and the yearly goal, Wrapped, clubs, buddy reads, lists, import and export. Say so on a public pricing page. Paywalled stats and buddy reads are what readers dislike about other apps (`PRODUCT-ANALYSIS.md`).

**Avoid:** ads (they pay little at small scale and need tracking and GDPR cookie banners), selling or sharing reading data, and limits on free accounts ("only 3 lists").

- **Supporter membership ("Argos Plus" or similar)**: the main income. About $3–4/month or $30/year, with the yearly plan clearly cheaper. It gives extras and convenience, never core features:
  - a supporter badge on the profile
  - extra colour themes and profile customisation
  - a custom profile URL, and username changes every 30 days instead of once a year (already planned in `ACCOUNTS-AND-HOSTING.md`)
  - early access to new features
  - a supporter-only poll on what gets built next

  **Beta readers** get a "Founding member" badge, or a one-time lifetime price. It rewards early fans and shows whether people will pay at all.
  **Payments:** use a *merchant of record* (Paddle or Lemon Squeezy) rather than plain Stripe. A merchant of record legally sells on Argos's behalf and handles sales tax and VAT in every country.
  **Goodwill:** consider giving a small share of income to Open Library (run by the nonprofit Internet Archive), which supplies all the book data for free, and saying so publicly.
- **Bookshop.org affiliate links**: a "Buy this book" link on book pages that pays about 10% of each sale. Bookshop.org shares its sales with independent bookshops, which fits the non-Amazon stance. Show it next to "check my library" (Libby / WorldCat) so it reads as a helpful service, not a sales pitch. This is the money side of "Library and independent bookshop links" under **Later** above, so build them together.
- **Tip button**: a one-off "buy us a coffee" link (Ko-fi or similar), for people who'd rather pay once than subscribe. Very little work, e.g. a link in the footer and on the pricing page.
