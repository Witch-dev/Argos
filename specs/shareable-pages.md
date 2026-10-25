# Feature Spec — Shareable pages

**Status:** Phase 1 built 2026-10-24, Phase 2 and Phase 3 built 2026-10-25 (build notes in §5, §6 and §7); Phase 3's live checks wait for the deploy. Planned 2026-10-24, decisions asked the same day (§2.1). Three phases: Phase 1 (book, list, club for visitors, size M–L), Phase 2 (review, profile, author for visitors, size M), Phase 3 (link preview cards, English and Spanish, size M).

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
  - **Author:** Follow this author, Want to read on each book of the Most popular shelf (changed in Phase 2, §6).
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
- [x] `next` + `do` through the confirmation email; `next` limited to our own paths.
- [x] `SignupSource` column + migration, set at sign-up (email and Google); count on admin stats.
- [x] `GET /api/lists/saved` (built as `GET /api/booklists/saved`, the lists controller's own prefix).
- [x] Club invite preview has what the visitor card needs, nothing more.
- [x] Tests: off-site `next` ignored; unknown `do` ignored; private club preview shows no members or discussion; saved lists drop private and deleted ones.

#### Frontend
- [x] `JoinPrompt`, `SignupBox`, `ShareButton`.
- [x] Run `do` once after sign-in, note, clean address.
- [x] Book page: every reader button for visitors through `SignupBox`; visitor card; Share.
- [x] List page: every button for visitors through `SignupBox`; Save = like; visitor card; Share.
- [x] Saved tab on Lists.
- [x] Club invite page open to visitors with the preview; Share on the club page.
- [x] Search: Want to read on results for visitors through `SignupBox`; visitor card on `/search`.
- [x] Landing page: "Find a book" field opening `/search` (web-design plan and screenshot round).
- [x] Sources on admin stats (a sign-up that started on `/search` counts as `search`).
- [x] Translations in all five locales.

#### Verification
- [x] `argos-security` review (sign-up flow, `next` redirect, what visitors can see, the club preview).
- [x] `reviewer` pass.
- [x] Browser check in a private window: open a book, tap Want to read, sign up, confirm by email, land back with it added. Same for Save this list, a public and a private club link, and a search result reached from the landing page's field. Admin stats shows the sign-ups.

### Phase 2 — Review, profile, author for visitors

#### Frontend
- [x] Review page: Like / comment, Want to read this book, Follow the reviewer; card; Share.
- [x] Profile page: Follow this reader (request if private), Start your own shelf; card; Share.
- [x] Author page: Follow this author, Want to read on each book (of the Most popular shelf, §6); card; Share.
- [x] Translations.

#### Verification
- [x] `reviewer` pass; `argos-security` only if a new endpoint was needed (none was).
- [x] Browser check: one action per page through sign-up; a private profile shows name and avatar only.

### Phase 3 — Preview cards, English and Spanish

#### Backend
- [x] Card endpoint for the six kinds, escaped, rate-limited, no Open Library calls, English and Spanish text.
- [x] Tests: private, hidden or unknown → generic card; spoiler review → no text; private profile → no reading count; `<`, `"`, `&` in titles escaped.

#### Frontend
- [x] `/es/<path>` deep links open in Spanish; Share copies the `/es` link when the app is in Spanish.
- [x] nginx bot `map` and `proxy_pass` for the six paths, with and without `/es`.

#### Verification
- [x] `argos-security` review (new anonymous endpoint, nginx proxy). Also a `reviewer` pass (§7).
- [x] Live: `curl -A "redditbot" https://wingedwords.app/books/OL…` and `/es/books/OL…` return the book's tags; a normal browser still gets the app. *Passed 2026-10-25 (OL45804W, English and Spanish, `Vary: User-Agent`; the first try gave the generic card because the book had never been loaded, as designed).*
- [ ] Paste one link of each kind into a chat with yourself (Discord or WhatsApp) and into Reddit's post preview. Use links not shared before: Reddit and chat apps keep old cards for a while.

## 5. Build notes (Phase 1, 2026-10-24)

What changed from §2–§3 while building, and why:

- **`do` never runs from a page's own address.** §2.2 had the page read `do` from its URL. Then any link like `/u/someone?do=follow` would make a signed-in reader who opens it act. Instead the login, sign-up, email-link and Google pages read `do` from their own address and pass it on as in-app navigation state, which a link can't set (`web/src/lib/signInAction.ts`, `hooks/useSignInAction.ts`). The state is cleared before the action runs, so back or reload doesn't repeat it. `do` still travels through the email: `PendingSignups.Do`, returned by `confirm-signup`.
- **A crafted login or sign-up link still carries an action** (security review and reviewer). So those pages say what will happen once you're in ("Once you're in, this book goes on your want-to-read"), and **Join doesn't run on its own when the club has rules**: the reader lands on the card with "Read the club's rules, then press Join club", since joining agrees to them. Without rules it joins (or asks to, for a private club).
- **`copyList` added** to the fixed words, for "Copy to my lists" on a list.
- **Sign-up source:** kept on the pending sign-up and the account (`SignupSource`, from `next` or `from=search`). A bare `/lists` or `/books` (a reader's own page) doesn't count; `next` must open one thing. The reader's account export has it as "Signed up from".
- **A private club's invite token now goes only to its admins and moderators** (security review; before, every member got it in the club's details). Share on a club shows exactly when the token is there.
- **Favourite after sign-up:** a new account hasn't read the book, so the log form opens on Read with "Mark it as read first, then it can be a favourite". **Add to a list** focuses the list menu, or says there are no lists yet.
- **An action that fails** after sign-up says so ("That didn't go through. Try the button again.").
- **Visitor buttons wait for the session to be known**, so a reader whose session is being restored never sees them for a moment.
- **Where the quiet card sits (design review):** book page, under the action buttons in the book's column; list page, after the shelf (the covers come first); search, after the results (every result has its own Want to read). The club invite page has **no** separate card, since a second "Sign up" under Join competed with it; instead the card carries one muted line ("Winged Words is a free place… Joining needs a free account") and Share as a quiet button under Join.
- **One green button for visitors:** "Save this list" is the list page's green button for a visitor (there was none).
- **Labels:** the sign-up box and the card both say "Sign up free". On a phone, Share on the book page is icon-only (its name kept for screen readers) so it fits the row.
- **Privacy policy:** the sign-up section now says the kind of shared page is kept (not which page or who shared it); updated 2026-10-24 in all five languages.
- **Lists page:** "Lists" heading with a Yours / Saved switch; Saved uses the Browse cards and Load more.
- **Admin stats:** "Sign-ups from shared pages" card under the charts, for the chosen 7/30/90 days, one bar per kind.

Asked after the design review (2026-10-24), all four as recommended:
- **Privacy policy:** keep the sentence about the kind of shared page.
- **Landing hero tightened** (desktop only): less top padding, the in-hero dog 8.5rem, tighter switch and lead gaps, the Find a book label beside its field where there's room. At 1280×800 the green Join and the field are both on the first screen; phones unchanged.
- **The box names the thing:** "Create a free account to add “Dune” to your want-to-read", and "…to ask to join “Club”" for a private club. Plain `t()` with the title as a value (React escapes it).
- **The rail's "Log in" card steps aside** for visitors on book, list, club-invite and search pages, which have their own quiet card.

Also fixed on the way: `GoogleSignInOffTests` failed on a machine whose user-secrets hold a real Google client ID; it now clears the ID itself.

Reviews: `argos-security` found nothing at Medium or above; its two Low findings (the private invite token, crafted login links) are fixed above. `reviewer`: fixed the visitor-button flash, crafted links, Add-to-a-list focus, silent failures, the Share announcement; added tests for the hook, the login page carrying the action, saved lists with a blocking or private owner. Browser check (side ports, Mailpit): all six flows worked, including `?do=` on a page doing nothing and `next=//evil.example` staying on the site.

## 6. Build notes (Phase 2, 2026-10-25)

Frontend only: no new endpoint (the API already counted `review`, `profile` and `author` sign-ups from `next`).

- **Review page:** for a visitor, the heart and Add a comment open the box, and a row under the likes adds **Want to read** (the book stays on the review page and is added there after sign-up), **Follow *name*** and **Share**. A signed-in reader gets only Share in that row: Want to read and Follow are the visitor's way in, as on search in Phase 1. On a phone the row takes the page's full width (in the heading's narrow column it stacked one button per line). The card sits after the review text, before the comments. After sign-in: like (your own review: "This is your own review"), want, follow (a request if the account is private), or the comment box gets focus.
- **Share only on a Public review.** The API sends `visibility` to every reader, so a follower of a Followers-only review gets no Share (its link would show a visitor "not found"). A Public review by a private account still shows Share although a visitor can't open it; `ReviewDto` has nothing saying the author is private. Small, left as is.
- **A visitor isn't a former reader's author.** `isAuthor` compared `user?.id` with `review.author?.id`, both undefined for a visitor on a review whose author is gone, so it uncovered spoilers (older bug, found in review). Fixed.
- **Profile:** Follow for visitors (the box says "ask to follow" for a private account), Share beside it for everyone. The card goes after the shelves; check with a full shelf whether it falls too far down, and move it above Shelves if so (design review). **A private profile** shows its "This account is private" notice as plain text for a visitor, so the card is the page's one well; a signed-in reader still gets the notice in its well.
- **Author:** Follow for visitors, Share for everyone, the "Follow to hear about their new books" hint for visitors too. **Want to read only on the Most popular shelf** (5 covers), icon-only on a phone with the book named for screen readers: under every cover of All books (~29) it made the page look like a shop and drowned the shelf, and each cover opens its book's page, which has the button anyway. It goes on to `/books/:id`, which adds the book, and counts as `author` (`from=author`, `SIGNUP_SOURCES` in `lib/signInAction.ts`). The card sits after the popular shelf.
- **Shared pieces:** `onVisitor` on `FollowButton`, `AuthorFollowButton`, `LikeButton` and `ReviewSocialBar`; `SignupBox`'s `askToJoin` became `asking` (join or follow); `lib/visitorActions.ts` (`wantToReadOnce`, `followReaderOnce`, also used by the book page) and `api/followInvalidation.ts` (moved out of the two follow buttons). The rail's "Log in" card steps aside on `/reviews/:id`, `/u/:username` and `/authors/:id` too.
- **Also fixed:** a profile without a photo showed its initial small in the corner of the 9rem ring (the CSS stretched `div`, the placeholder is a `span`). Filed `bugs/profile-reloads-when-a-row-fails.md` (found while testing).

Reviews: `reviewer` found the Share and former-reader problems above (fixed) and test gaps (filled: comment focus, already liked, own review, null author, public profile). Design critique and a fresh full review: one well per page, the review row on a phone, the author buttons, the avatar ring, all fixed. Browser check (side ports, Mailpit): each page's action through sign-up, a private profile with name and avatar only, the author's Want to read landing on the book with it added, `review` and `author` sign-ups on admin stats.

## 7. Build notes (Phase 3, 2026-10-25)

- **Endpoint:** `GET /api/share/card?path=/books/OL1W&lang=es` (`ShareController`, `ShareCardService`, `ShareCardPage`, `ShareCardTexts`). Always 200 with `text/html`, `Cache-Control: no-cache`, `X-Robots-Tag: noindex`. The path must be one of the six pages with a valid id; anything else, and anything a visitor can't open, gets the generic card (the same words and picture as `index.html`, `og-image-es.png` in Spanish) with the site's front page as its address, never the asked-for one. Its own rate limit, `RateLimits:ShareCardsPerMinute` = 120 per address.
- **Each card uses the page's own rule:** book and author from the database only (an id Winged Words has never loaded gets the generic card, and nothing is added); list through `BookListService.GetByIdAsync(id, null)` (an Unlisted list shows to whoever has its link, as the page does) and not hidden; review through `ReviewAccess.CanViewAsync(log, null)` and not hidden; club through the invite preview (a buddy read's token leads nowhere); profile not away, suspended or the "deleted" placeholder. A name given up in the last 30 days still finds its reader, and the card names the current address.
- **What each card says** (English / Spanish): book "*Title*" / "By *author*. See what readers think of it on Winged Words." with the large cover; review "*Name*'s review of *Title* ★ 4.5" (the title is shortened before the stars are), the opening lines up to the first inline `||spoiler||`, or "This review has spoilers…" when marked; profile "*Name* on Winged Words", "82 books read. Follow their reading…" (books on the Read shelf a visitor can see, different books only), only "A reader on Winged Words." for a private account; list "A list by *Name* with 12 books." plus its description, first cover; club "A book club on Winged Words · 5 members. Now reading *Book*." plus its description; author "Books by *Name*…", photo. Titles up to 120 characters, lines up to 200, cut at a space with "…".
- **Escaping:** the five HTML characters (`& < > " '`) in text and attributes; accents and "·" stay as they are (`WebUtility.HtmlEncode` turned Spanish letters into numeric entities).
- **Avatars:** stored as preset keys, and the app's copies have hashed names, so the build also writes `/avatars/<key>.webp` (`vite.config.ts`, 612 KB). Only catalogue keys are used.
- **nginx:** a `map` of the nine bot names; one regex location for the six pages with an optional `es/`, which serves `index.html` to people and sends bots to an internal location that `proxy_pass`es to the API (`SHARE_CARD_API_URL`, `API_BASE_URL` by default, written with a DNS resolver into a snippet by `entrypoint.sh`). Bots' cookies and `Authorization` are dropped, their address goes on in `X-Forwarded-For`, HEAD becomes GET, https is checked with SNI. Any error, 429 or a sleeping API → `index.html` (the generic card). `Vary: User-Agent` on those pages (security review). Tested in Docker against an echo server: bots proxied with the right path and language, people and Googlebot get the app, fallbacks on 500 and connection refused, a bad `SHARE_CARD_API_URL` stops the container.
- **Rate limit through the public address** (security review, Low): to the API every bot then seems to be the site's own address, so anyone could use up the 120 a minute and every preview would fall back to the generic card (nothing leaks). Set `SHARE_CARD_API_URL` to the API's private-network address on Render to give each bot its own budget (DEPLOY.md, "Link previews").
- **Frontend:** `splitSharePath` handles `/es/<any path>` (and `/es//other.site` stays on the site); `sharePath` puts `/es` in front of Share's link while the app is in Spanish. A saved language choice still wins over the link's, as for `/es` alone.
- **Also:** `ErrorCodesTests` skips `ShareCardTexts.cs` (card texts, not errors); `GET api/share/card` on the anonymous endpoint list.

Reviews: `reviewer` (fixed: a long title dropped the rating; renamed readers and the "deleted" placeholder; an emoji cut in half; a higher default limit; raw formatting other than `||` in a review's opening lines is left as is, since it's cosmetic). `argos-security`: nothing exploitable; added `Vary: User-Agent` and tests for a private account's Public list and review, an Unlisted list and a buddy-read token. Club invite tokens appear in the card request's query string, as they already do in the join endpoint's path: keep in mind if request logging ever records query strings.
