# Feature Spec — Shareable pages

**Status:** planned 2026-10-24, decisions asked the same day (§2.1). Three phases: Phase 1 (book, list, club for visitors, size M–L), Phase 2 (review, profile, author for visitors, size M), Phase 3 (link preview cards, English and Spanish, size M).

## 1. Problem

The user wants to answer "can anyone recommend…?" posts on Reddit and book communities with a Winged Words link. The person who clicks should see something useful right away, without an account, see what Winged Words offers, and get a reason to sign up ("save this list", "add this book to your want-to-read").

How things are today (checked 2026-10-24):

| Page | Opens logged out? | What a visitor sees |
|---|---|---|
| Book `/books/:openLibraryId` | Yes (route open; book, ratings, insights endpoints anonymous). | The book. The log button becomes a plain "log in" link (`BookDetailPage.tsx:165`). Nothing says what Winged Words is. |
| List `/lists/:id` | Yes, if Public (`GET /api/lists/{id}` is open). | The list. Like, copy and comment buttons: behaviour logged out to check. |
| Club `/clubs/:id` | **No** (`ProtectedRoute`, `GET /api/clubs/{id}` needs login). | Sent to login. |
| Club invite `/clubs/join/:token` | **No** on the frontend (`ProtectedRoute`), although `GET /api/clubs/join/{token}` already answers without login (`specs/book-clubs.md` §3.5). | Sent to login. |
| Review `/reviews/:id` | Yes (route open). | The review. |
| Profile `/u/:username` | Yes. Private accounts show name and avatar only (`specs/account-privacy.md`). | The profile. |
| Author `/authors/:openLibraryId` | Yes. | The author and their books. |
| Search `/search` | Yes. The header search box shows for everyone (`Header.tsx:51`); the search endpoint is anonymous and limited per address (`Program.cs:451`). | Results, with nothing inviting a visitor. The landing page has no search field, so a visitor arriving at `wingedwords.app` may not notice the small header box. |

Whatever page is shared, **the link preview** (the card Reddit, Discord, WhatsApp and others draw under a link) is always the generic Winged Words card. The site is one page that fills itself in inside the browser (an SPA), and the bots that draw preview cards don't run that code. They only read the shared `index.html` and its fixed `og:` tags.

Sign-ups are open (early access) and private accounts are done (Stage 8), so a visitor can join on the spot and can't see anything a reader keeps private.

**There's no "lists I liked" page.** Lists can be liked (heart and count) and copied ("Copy to my lists", a private copy), but a reader can't find the lists they liked again, so a like doesn't work as "save".

## 2. Decisions

### 2.1 Asked 2026-10-24

- **Six shareable pages:** book, list, club (by its invite link), review, reader profile, author.
- **Show visitors everything.** Every button a reader has is visible. Tapping one that needs an account opens a **small box**: "Create a free account to add this to your want-to-read" with **Sign up** and **Log in**. Sign up goes to the normal sign-up page (Google included when its key is set) and brings them back afterwards.
- **The action is done after sign-up.** After the account exists, the tapped action runs once (the book is added, the list saved, the club joined…) and the visitor lands back on the page with a short note ("Added to your want-to-read").
- **One quiet card per page** for visitors, near the top, with a line tied to the page. No popups, no fixed bars.
- **Visitor buttons per page:**
  - **Book:** all of them: Want to read, Favourite, I've read it / rate it (opens the log form after sign-up), Add to a list.
  - **List:** **Save this list** = like it, plus a new **Saved** tab on the Lists page showing the lists you liked. Copy, like and comment as for readers.
  - **Club:** public and private invite links both open for visitors and show the small preview (name, description, current book, member count). Public: **Join**. Private: **Ask to join**. Never the discussion, checkpoints or members' progress.
  - **Review:** Like / comment, Want to read this book, Follow the reviewer.
  - **Profile:** Follow this reader (a follow request if the account is private), Start your own shelf.
  - **Author:** Follow this author, Want to read on each of their books.
  - **Search (asked 2026-10-24, added to Phase 1):** visitors keep searching without an account, as today. Each result gets **Want to read** through the same sign-up box, and the search page gets the quiet card. The **landing page gets a "Find a book" field** that opens `/search`, so a visitor sees at once that the site is useful without signing up.
- **Share button** on all six pages. On a club: everyone in a **public** club, admins and moderators only in a **private** one.
- **Preview cards (Phase 3):**
  - Book: **cover, title and author.** No rating, no description.
  - Review: "*Name*'s review of *Title* ★ 4" with the cover. The opening lines only if the review isn't marked as a spoiler.
  - Profile: "*Name* on Winged Words · 82 books read" with the avatar. A private account: name and avatar only.
  - **English and Spanish now.** A link with `/es` in front (`/es/books/OL1W`) gets a Spanish card and opens the page in Spanish. The Share button copies the `/es` link when the app is in Spanish, the plain link otherwise.
- **Count sign-ups from shared pages** on `/admin/stats` (how it works: §3.1).
- **Build order:** three phases (top of this file), starting in a new session.

### 2.2 Decisions I made, for the user to confirm

- **Remembering the action:** the box's Sign up link carries the page and the action in the address: `/register?next=/books/OL1W&do=want`. Login and sign-up already return to `next` (`ProtectedRoute`, `RegisterPage`). Sign-up confirms the email by a link first (`specs/signup-check-your-inbox.md`), so that link has to carry `next` and `do` through too. After sign-in the page reads `do`, runs it once, shows the note, and removes `do` from the address so a refresh doesn't repeat it. `do` is one word from a fixed list (`want`, `favourite`, `log`, `addToList`, `saveList`, `like`, `comment`, `follow`, `join`); anything else is ignored. `next` must start with a single `/`, so nobody can use a sign-up link to send readers to another site.
- **Actions that open something** (rate it, add to a list, comment) open the form or menu after sign-up, instead of guessing an answer.
- **Already following / already in your want-to-read:** if a visitor logs in and the action is already done, they get the same note and nothing changes.
- **Only public things can be shared.** A private list, a hidden review or an unknown id looks to a visitor exactly as today. Nothing about privacy changes here.
- **One shared look:** `JoinPrompt` (the quiet card), `SignupBox` (the small box) and `ShareButton` are shared components with the text passed in. They follow DESIGN.md and show only to signed-out visitors.
- **Share on a phone** opens the phone's share sheet (`navigator.share`). On a computer it copies the link and says "Link copied". No tracking parameters in the link.
- **The Saved tab** lists liked lists, newest like first, the same cards as Browse. A list that turned private or was deleted drops out.
- **Preview cards are made for bots only.** nginx (the frontend's web server) checks the visitor's user agent (the name a browser or bot sends). Known preview bots (`redditbot`, `Discordbot`, `facebookexternalhit`, `Twitterbot`, `Slackbot`, `WhatsApp`, `TelegramBot`, `LinkedInBot`, `Applebot`) asking for one of the six pages get a tiny HTML page from a new API endpoint, with only the card tags. People get the app as today. **Why this way:** it's the smallest change that works. Showing up in Google search needs real server rendering (SSR), the open question in SPEC.md §10. That stays in FUTURE-IDEAS.md, so `Googlebot` isn't on the list.
  - Anything a visitor couldn't see (private, hidden, unknown) gets the generic Winged Words card, never a "not found" that would show it exists.
  - A list's card uses its first book's cover; a club's, its current book's cover, else `og-image.png`; an author's, their photo if Open Library has one, else `og-image.png`.

## 3. Design

### 3.1 Data

- **`User.SignupSource`**, nullable short text, set once when the account is made from the `next` path's first part: `book`, `list`, `club`, `review`, `profile`, `author` or `search`. Nothing else is stored: not which link, who shared it, or anything from before sign-up. `/admin/stats` gets "Sign-ups from shared pages" for the chosen period, split by kind.
- No table for saved lists: the Saved tab reads the existing list likes.

### 3.2 Backend

- Sign-up confirmation email link carries `next` and `do`; `next` checked to be one of our own paths.
- `SignupSource` column, migration, set at sign-up (email and Google), and the count in the admin stats service.
- `GET /api/lists/saved`: the caller's liked lists that they can still see, newest like first.
- Check `GET /api/clubs/join/{token}` returns what the visitor card needs (current book and cover, member count) and nothing more.
- **Phase 3:** `GET /api/share/card?path=…&lang=en|es`, anonymous, rate-limited like search, returns `text/html` with `og:`/`twitter:` tags, all text HTML-escaped, and `<link rel="canonical">`. It never calls Open Library: a book or author not already in our database gets the generic card, so bots can't fill the cache. Card text in English and Spanish from the API's own resources.

### 3.3 Frontend

- `JoinPrompt`, `SignupBox`, `ShareButton` components.
- The "after sign-in, run `do` once" step, shared by all pages.
- Phase 1: book page, list page (and logged-out buttons checked), Saved tab on Lists, `/clubs/join/:token` out of `ProtectedRoute` with the visitor view, Share on the club page (rules in §2.1).
- Phase 1 also: Want to read on search results for visitors, the card on `/search`, and a "Find a book" field on the landing page (placement and wording in a short web-design plan first; `specs/landing-page.md` has the page's layout).
- Phase 2: review, profile and author pages.
- `/es/<path>` for deep links: `initLanguage` today only handles `/es` alone (`specs/language-share-links.md` §2); extend it to strip `/es` from any path and start in Spanish.
- All text through `t('…')` in the five locale files.
- **Phase 3 nginx:** a `map` from user agent to "preview bot", and in the six paths (with or without `/es`) `proxy_pass` bots to the card endpoint. Same security headers.

## 4. Tasks

### Phase 1 — Book, list, club for visitors

#### Backend
- [ ] `next` + `do` through the confirmation email; `next` limited to our own paths.
- [ ] `SignupSource` column + migration, set at sign-up (email and Google); count on admin stats.
- [ ] `GET /api/lists/saved`.
- [ ] Club invite preview has what the visitor card needs, nothing more.
- [ ] Tests: off-site `next` ignored; unknown `do` ignored; private club preview shows no members or discussion; saved lists drop private and deleted ones.

#### Frontend
- [ ] `JoinPrompt`, `SignupBox`, `ShareButton`.
- [ ] Run `do` once after sign-in, note, clean address.
- [ ] Book page: every reader button for visitors through `SignupBox`; visitor card; Share.
- [ ] List page: every button for visitors through `SignupBox`; Save = like; visitor card; Share.
- [ ] Saved tab on Lists.
- [ ] Club invite page open to visitors with the preview; Share on the club page.
- [ ] Search: Want to read on results for visitors through `SignupBox`; visitor card on `/search`.
- [ ] Landing page: "Find a book" field opening `/search` (web-design plan and screenshot round).
- [ ] Sources on admin stats (a sign-up that started on `/search` counts as `search`).
- [ ] Translations in all five locales.

#### Verification
- [ ] `argos-security` review (sign-up flow, `next` redirect, what visitors can see, the club preview).
- [ ] `reviewer` pass.
- [ ] Browser check in a private window: open a book, tap Want to read, sign up, confirm by email, land back with it added. Same for Save this list, a public and a private club link, and a search result reached from the landing page's field. Admin stats shows the sign-ups.

### Phase 2 — Review, profile, author for visitors

#### Frontend
- [ ] Review page: Like / comment, Want to read this book, Follow the reviewer; card; Share.
- [ ] Profile page: Follow this reader (request if private), Start your own shelf; card; Share.
- [ ] Author page: Follow this author, Want to read on each book; card; Share.
- [ ] Translations.

#### Verification
- [ ] `reviewer` pass; `argos-security` only if a new endpoint was needed.
- [ ] Browser check: one action per page through sign-up; a private profile shows name and avatar only.

### Phase 3 — Preview cards, English and Spanish

#### Backend
- [ ] Card endpoint for the six kinds, escaped, rate-limited, no Open Library calls, English and Spanish text.
- [ ] Tests: private, hidden or unknown → generic card; spoiler review → no text; private profile → no reading count; `<`, `"`, `&` in titles escaped.

#### Frontend
- [ ] `/es/<path>` deep links open in Spanish; Share copies the `/es` link when the app is in Spanish.
- [ ] nginx bot `map` and `proxy_pass` for the six paths, with and without `/es`.

#### Verification
- [ ] `argos-security` review (new anonymous endpoint, nginx proxy).
- [ ] Live: `curl -A "redditbot" https://wingedwords.app/books/OL…` and `/es/books/OL…` return the book's tags; a normal browser still gets the app.
- [ ] Paste one link of each kind into a chat with yourself (Discord or WhatsApp) and into Reddit's post preview. Use links not shared before: Reddit and chat apps keep old cards for a while.
