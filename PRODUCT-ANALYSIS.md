# Argos — Product Analysis (2026-10-06)

What Argos can do today, how it compares with what readers and writers say they want online, and what to build next. Sources are listed at the end.

**Where this went:** the biggest weaknesses are now the **Next up** list in `SPEC.md` §4. The other suggestions are in `FUTURE-IDEAS.md` under "From the product analysis".

**Short version:** Argos already has more *social* depth than most book apps: clubs, highlight comments, writings, reading stories and collaborative lists. It is missing the *everyday basics* that make people switch apps and stay. Those are importing from Goodreads, notifications, a yearly goal with good stats, and an app that works well on a phone. People leave Goodreads because it feels old, and they pick an alternative because it's easy to move to and nice to use every day. Fancy social features come after that.

---

## 1. What Argos can do today

| Area | What exists |
|---|---|
| **Logging** | Want to read / Reading / Read / Did not finish, start and finish dates, half-star ratings, rereads, page progress with a note |
| **Reviews** | Spoiler flag plus inline `\|\|spoiler\|\|` hiding, privacy per review (Public / Followers / Only me), likes, rating chart, Popular / Recent / Following tabs, filters, "Readers say" (mood, pace, plot or character driven, content warnings) |
| **Book pages** | Open Library data, live search, aggregate rating, lists containing the book |
| **Lists** | Ranked or unranked, notes per book, Public / Unlisted / Private, tags, likes, comments, browse page, copy a list, take a list on as a challenge with a goal date, build a list with up to 10 collaborators |
| **Social** | Follow, block, Find readers (suggestions by genre), compare taste with another reader, profile with 4 favourite books |
| **Feed** | Home dashboard, a "Readings" stories strip (Instagram-style updates on what friends are reading), merged feed of reviews and writings, grouped activity rows |
| **Writing** | Short notes and long pieces (up to 50,000 characters), original work or quoted passages, nested comments and Genius-style highlight comments with up/down votes |
| **Book clubs** | Public and private clubs, invite links, suggest-and-vote for the next book, checkpoints with due dates, threaded discussion per checkpoint |
| **Other** | Book news feed (RSS), dark/light theme, login sessions that renew themselves |

Not built yet: email confirmation and password reset (specced in `specs/account-system.md`), hosting and a live deployment, notifications, import/export, reporting and moderation, a mobile app.

---

## 2. What people want (research summary)

Across 2026 comparisons, reviews and forums, the same needs keep coming up:

1. **Easy to move in.** Readers have years of history on Goodreads. An app that can't import it loses them in the first 5 minutes. Hardcover's strong import tool is a big reason people switch to it. The most common complaint about every app is an import or export that **loses notes, dates and editions**.
2. **Fast, low-effort logging.** Update a shelf in one tap, edit several books at once, and log from a phone in seconds.
3. **Stats that aren't paywalled.** Yearly goal, books and pages per month, top authors, genres, moods, and a "Wrapped"-style year in review you can **share as an image** (very big on BookTok and Instagram). Readers specifically ask for Letterboxd-style stats such as "most-read authors". Charging for basic stats is one of the most disliked things about StoryGraph and Bookly.
4. **Mood- and vibe-based discovery.** StoryGraph's main attraction is filtering by mood, pace and tropes, and recommendations based on *how you like to read*, not only what friends read.
5. **Spoiler-safe reading together.** StoryGraph's "buddy reads" let you leave reactions at a page number, hidden until the other person reaches that page. Fable is loved for structured club conversation.
6. **Formats, editions and series.** Track audiobooks by hours and minutes, ebook vs print, the right cover/edition, and "where am I in this series".
7. **Owning your data and trust.** Many readers left Goodreads because Amazon owns it. Readers want export, privacy controls and no data selling.
8. **Safety from review-bombing and trolls.** Goodreads is widely criticised for fake accounts, 1-star reviews on unreleased books and harassment of authors, especially from marginalised groups.
9. **No AI surprises.** Fable's AI-written year-end summaries insulted users in early 2025 and many left. Readers want fun summaries, written by rules they can predict, not by a model that can say something hurtful.
10. **Social without noise.** People like the community (Fable) but complain when it buries their own tracking or sends too many notifications by default. Solo readers want to switch the social side down.
11. **For writers:** *real* feedback rather than just likes. Scribophile works because you **earn the right to be critiqued by critiquing others** (its "karma" system) and feedback is organised by genre. AO3 is loved for its tags. Writers also want control over who sees their work and a place for serialised work (chapters).
12. **Mobile parity.** The top complaint about StoryGraph and Hardcover is that the mobile app lags the website.

---

## 3. Strengths

- **Social depth that competitors charge for or don't have.** Spoiler-safe checkpoint clubs, collaborative lists, list challenges and taste comparison are all free. StoryGraph puts buddy reads behind a paywall, and Fable puts its best clubs there.
- **Highlight comments (Genius-style) are rare.** No major book tracker lets readers comment on a specific sentence of a review or piece of writing. This is a real differentiator.
- **Reads + writes in one place.** Goodreads and StoryGraph are for readers, Wattpad and Scribophile for writers. Argos's Writings connect the two, especially quoted passages linked to real books.
- **It already has what readers asked for that Goodreads lacks:** half stars, a DNF shelf, mood/pace/content warnings, dark mode, a favourites row on profiles, and a visual friends-first home page (exactly the "Letterboxd for books" wish).
- **Privacy-minded details already in place:** per-review visibility, blocking, "not discoverable" option, Unlisted lists.
- **Content warnings** with severity, which readers of StoryGraph value highly.
- **Discovery through people, not a black box.** This fits readers' distrust of algorithms and AI.
- **Independent and not Amazon.** A real selling point if said clearly.
- **Solid engineering base:** layered architecture, tests, review passes and documented specs make it safe to keep adding features.

## 4. Weaknesses

Ordered by how much they would hurt adoption.

1. **No Goodreads/StoryGraph import.** The single biggest barrier. Without it, a new user starts from an empty profile and most won't bother.
2. **Not live yet / no account recovery.** No hosting, no email confirmation, no password reset. A forgotten password currently means a lost account.
3. **No notifications at all.** Nobody knows when someone replies, likes, invites them to a club or a checkpoint is due. Club tools and story replies are already blocked on this. Social apps without notifications feel empty.
4. **No yearly goal or stats page.** Profile has only "books this year" and average rating. Readers rank good free stats as a top reason to pick an app.
5. **No data export or account deletion.** The spec already says this is required before a public launch (GDPR-lite). It is also a trust signal.
6. **No reporting or moderation.** Anyone can post reviews, writings and comments, with no way to report abuse or fake reviews. Review-bombing is the most public scandal in this space.
7. **Shelves are always public.** Reading progress and notes are visible even to logged-out visitors. There is no private account or follow approval (already in `FUTURE-IDEAS.md`).
8. **Books only tracked as "pages".** No audiobook (time) or ebook format, no edition choice, no series. Open Library's duplicate editions will show up as messy data.
9. **Discovery of *books* is thin.** There's no "popular this week", genre browsing, or "because you liked X" recommendations, so it's hard to find your next book inside Argos.
10. **Writings stand alone.** They don't appear on book pages or profiles, have no drafts, chapters, tags or way to ask for critique. This is the start of a writer's feature but not yet a reason for writers to come.
11. **Web only.** Most logging happens on a phone, right as someone finishes a chapter. The site must work well on mobile even before a native app.
12. **Many features, one small team.** Clubs, writings, stories, lists, news and reviews are all wide. New users may not know what Argos is *for*. Some specs still need a manual browser check.

---

## 5. Suggestions — what to build next

Ranked by **how much readers want it** × **how much it helps Argos grow**. Size: S = days, M = 1–2 weeks, L = more.

### Tier 1 — needed before inviting real users

| # | Suggestion | Why people want it | Size |
|---|---|---|---|
| 1 | **Goodreads + StoryGraph import** (CSV): shelves, ratings, dates, reviews, rereads; match by ISBN then title + author; a review screen for books it couldn't match; keep notes and dates (the thing others lose) | #1 reason to switch or not switch | M |
| 2 | **Account system** (already specced): email confirmation, forgot password, change email, delete account | Basic trust; a lost password shouldn't mean a lost account | M |
| 3 | **Export everything** (CSV + JSON, in the same layout as Goodreads so it can go back in) | "Own your data", the anti-Amazon pitch, GDPR | S |
| 4 | **Notifications** (in-app bell first, email digest later): new follower, likes, replies, mentions, club invites, checkpoint due, a friend's list update. **Quiet by default**, with per-type settings | Social apps feel dead without them; unblocks club tools and story replies. Fable is criticised for *too many*, so default to few | M |
| 5 | **Mobile-first pass** of the 5 most used screens: log a book, update a page, write a review, the feed, a club checkpoint. Then make it an installable web app (PWA) | Most logging happens on phones; the top complaint about competitors is a weak mobile app | M |
| 6 | **Report + basic moderation**: report a review/writing/comment/user, an admin queue, hide content. Plus **anti-review-bombing rules**: no ratings before a book's publish date, new accounts can't rate for 24h / until email is confirmed, flag sudden waves of low ratings | Goodreads' biggest scandal; protects authors and marginalised readers | M |

### Tier 2 — what makes people stay (the daily habit)

| # | Suggestion | Why people want it | Size |
|---|---|---|---|
| 7 | **Yearly reading goal + stats page**: books/pages per month, top authors, genres, moods, pace, average rating, longest/shortest book, DNF rate. **Free, forever** — say so on the page | Top requested; paywalled stats are hated elsewhere | M |
| 8 | **"Argos Wrapped" year in review** (December) + **monthly wrap-up**, as a **shareable image** for Instagram/TikTok. Rule-based text, **no AI** | BookTok wrap-ups are huge; free marketing; Fable's AI version backfired | M |
| 9 | **Reading formats & editions**: print / ebook / audiobook per log, audiobook progress in hours:minutes, choose your edition (cover, page count) | Readers who mix formats can't track honestly today | M |
| 10 | **Series tracking**: "Book 3 of 7 — you've read 2", next in series button | Commonly requested; little effort with Open Library series data plus manual fixes | S–M |
| 11 | **"Up next" queue**: reorder your Want-to-read pile, pin the next 3 | Turns the huge TBR into something useful | S |
| 12 | **Reading streaks / reading journal** (optional, off by default): log minutes or pages per day, calendar view (the spec's "Diary calendar view") | Bookly's main hook; must not be forced on people who don't like gamification | M |
| 13 | **Quick-log actions**: one-tap "+10 pages", "Finished!" with a quick rating straight from the feed or stories strip; bulk shelf editing | "Frictionless logging" is the #2 thing readers value | S |

### Tier 3 — what makes Argos different (lean into strengths)

| # | Suggestion | Why people want it | Size |
|---|---|---|---|
| 14 | **Buddy reads with page-locked comments**: a mini 2–5 person club with no voting; comments are tied to a page and hidden until you reach it. Reuse club checkpoints and highlight comments. **Free** (StoryGraph charges) | One of StoryGraph's most loved features | M |
| 15 | **Mood & trope discovery**: browse books by mood/pace/content warnings (data already collected through "Readers say"), plus reader-added tropes and subgenres (already in `FUTURE-IDEAS.md`) | StoryGraph's main draw; Argos already has half the data | M |
| 16 | **Simple, explainable recommendations**: "Readers with your taste loved…" from the existing taste-compare and follow data, always showing *why* it's suggested | People want discovery but distrust black-box algorithms | M |
| 17 | **"Popular this week" + genre pages** | Easy way to find the next book without following anyone yet; helps empty-feed new users | S |
| 18 | **Quotes collection**: save quotes while reading (page number), a quotes tab on profile and book pages, make a quote into a Writing in one click | Natural fit with Quote writings; readers love sharing quotes | S |
| 19 | **Writings on book pages and profiles** (already in backlog) | Makes writings visible where readers actually look | S |
| 20 | **Private account + follow requests** (already in backlog) | Readers want control; needed for "Followers" visibility to mean anything | L |

### Tier 4 — the writing side (to attract writers)

| # | Suggestion | Why people want it | Size |
|---|---|---|---|
| 21 | **Drafts & autosave**, then **chapters/series of writings** (serialised fiction) | Writers lose work and want to post stories in parts (Wattpad style) | M |
| 22 | **"Ask for feedback" mode** on a writing: the writer asks specific questions ("is the opening slow?"), readers leave structured critique; uses the existing highlight comments for line edits | Writers' top complaint is likes instead of useful feedback | M |
| 23 | **Critique credits** (light Scribophile model): give a useful critique (marked helpful by the writer) → earn a credit → spend one to request feedback | Guarantees writers get feedback back; proven model | M |
| 24 | **Tags and content warnings for writings** (AO3 style) and genre browsing | Readers find work by tags; AO3 is loved for this | S |
| 25 | **Writing prompts & challenges** (e.g. monthly theme, NaNoWriMo-style word goals) | Gives writers a reason to come back regularly | S–M |

### Tier 5 — later

- **Library integration**: "check availability at my library" links (Libby / WorldCat) and buy links to independent bookshops (Bookshop.org) instead of Amazon. Fits the independent, non-Amazon stance.
- **Author accounts** (verified): authors can confirm their page, post updates, host a club Q&A. Use with care because of the harassment issue.
- **Club meetings, RSVP and calendar file** (already in backlog, blocked on notifications).
- **Native mobile app**, and a barcode scanner to add a book by scanning its ISBN.
- **Public profile/book pages that search engines can find** (SEO), so people googling a book land on Argos.

---

## 6. Recommended order

1. **Launch basics:** account system → export → import → report/moderation → mobile pass → deploy.
2. **Habit loop:** notifications → yearly goal & stats → quick-log → Up next.
3. **Shareable growth:** monthly wrap-up image → Argos Wrapped (December 2026 is a natural first target).
4. **Differentiate:** buddy reads → mood/trope discovery → recommendations → quotes.
5. **Writers:** drafts → chapters → feedback mode → critique credits.

Also: pick **one sentence** that says what Argos is for, and make the first screen after sign-up match it. For example: *"Track your reading, and read together — spoiler-free."* Right now the app has many good features but no single message for a new user.

---

## Sources

- [Reading tracker apps ranked 2026 (Goodreads, StoryGraph, Fable, Hardcover, Bookly) — Unstar](https://unstar.app/blog/goodreads-storygraph-fable-hardcover-bookly-reading-tracker-apps-ranked-2026)
- [Best Goodreads alternatives 2026 — BestWriting](https://bestwriting.com/goodreads-alternatives)
- [Beyond Goodreads: StoryGraph and Fable — NINC](https://ninc.com/beyond-goodreads-exploring-the-storygraph-and-fable-for-readers-and-authors/)
- [StoryGraph vs Fable — For Reading Addicts](https://forreadingaddicts.co.uk/storygraph-vs-fable-breaking-up-with-goodreads/)
- [Goodbye, Goodreads: five new reading tracker apps — Book Riot](https://bookriot.com/new-reading-tracker-apps-to-try)
- [How about a Letterboxd for books? — Reading in Bed](https://reading-in-bed.com/2023/10/09/goodreads-for-movies-how-about-a-letterboxd-for-books/)
- [StoryGraph App Store listing (buddy reads, stats, challenges)](https://apps.apple.com/DE/app/id1570489264)
- [A book app's AI called its users too "woke" — Book Riot (Fable)](https://bookriot.com/a-book-apps-ai-called-its-users-too-woke)
- [Goodreads has a review-bombing problem — WPR](https://wpr.org/news/goodreads-has-review-bombing-problem-and-wants-its-users-help-solve-it)
- [Goodreads under fire: authors on review bombing — For Reading Addicts](https://forreadingaddicts.co.uk/goodreads-under-fire-authors-speak-out-against-review-bombing-and-homophobic-trolls/)
- [Scribophile karma system](https://www.scribophile.com/help/karma)
- [Best Wattpad alternatives — Wbcom Designs](https://wbcomdesigns.com/best-wattpad-alternatives-for-writers-and-readers/)
- [Book tracker apps with audiobook/series/owned tracking — BookScouter](https://bookscouter.com/blog/best-book-apps/)
