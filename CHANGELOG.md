# Changelog

A running, dated log of every real change and fix made to Argos with Claude Code — features, backend gaps found and fixed, bugs, and anything non-obvious enough to be worth finding again later. Newest first.

**Why this file exists:** the detailed reasoning for any given decision lives in the relevant `backend-tasks/*.md`, `frontend-tasks/*.md`, or `specs/*.md` file (each has its own `## Progress`/`## Design` section). This file is the index across all of them — short enough to skim in one pass when you're trying to remember *whether* something was already tried, so you know which file to open for the *why*.

**Format for a new entry:** `### YYYY-MM-DD — Title`, then 2-4 sentences: what changed, why, and a link to the file with full detail. Add entries as work happens, not in a batch after the fact — that's what keeps this useful.

**Archiving:** this file keeps only the last ~3 days of entries in full. When it grows past ~30 KB, move older entries into `changelog/YYYY-MM.md` (newest first) and add a one-line title for each to the index at the bottom, so nothing old drops out of sight.

---

### 2026-10-07 — Accounts Phase 2: emails, confirmation, forgot password, new-login alerts

The API can now send email: Mailpit locally, any SMTP server (Resend) in production, through a background queue. Emails are written in the reader's language and signed "Toffee". New accounts get a confirmation link, and posting anything others can read (reviews, progress notes, comments, writings, clubs, public lists) waits for it. There's a banner and a shared dialog explaining it. Forgot/reset password works; a reset also confirms the email, lifts lockouts and logs out everywhere. A login from a browser the account hasn't seen emails the owner. The review pass moved link-signing keys into the database, put tokens after `#` in links, and added an hourly email cap. One bug was left open (`bugs/email-sending-has-no-overall-budget.md`). Details: `specs/account-system.md` Phase 2.

### 2026-10-07 — The Argos planning folder is now its own git repository

This folder (specs, roadmap, changelog, bugs, learning tasks, agents and skills) had no version history or backup. It's now a git repo on branch `main`, meant to be pushed to a private GitHub repo at `Witch-dev/Argos`. It stays separate from the Apollon code repo on purpose: code history stays clean, doc edits don't trigger CI, and plans stay private if the code repo is ever made public. `.claude/settings.local.json` (per-machine permissions) is gitignored.

### 2026-10-07 — A slow language save could show the previous reader after switching accounts

CI failed `AuthContext.test.tsx` after `ff7ce14`: logging out Alice and in as Bob still showed "authenticated as alice". The cause was a real bug, not a flaky test. When an account has no saved language, logging in saves the browser's language to it in the background (`saveLanguageToAccount`). If that save finished, or failed and rolled back, after someone else had logged in, it wrote the previous reader's account over the new one's. CI's slow machine made the failed request land late. Now the save only touches the cache while it still holds the same reader. 3 new tests in `saveLanguageToAccount.test.ts` fail on the old code and pass on the new. The login tests' readers also have a saved language now, so they no longer make a real network request. All 505 frontend tests pass. Pushed as commit `ef01f09`.

### 2026-10-07 — Passwords seen in data breaches are refused

New passwords are now checked against Have I Been Pwned's free list of about a billion passwords from real data breaches. Attackers try exactly these on every site ("credential stuffing"). It's private: only the first 5 characters of the password's SHA-1 hash are sent, with padding, and the match is found on our side (`PwnedPasswordsClient`). The check runs after the local list, so `Password123!` (seen 295,000 times) and the old test password `P@ssw0rd123!` (30,000) are now refused. If the service is down, the password is let through after 3 seconds. The security review caught that .NET's default HTTP logging wrote the 5-character prefix into the logs next to each sign-up, so that client's logging is now off (checked live: no log lines). Tests use `FakePwnedPasswordsClient` and never call the service. Bruno's sign-up password is now a passphrase. The same discussion added three defences to the plan: "new login" emails (Account Phase 2), Cloudflare Turnstile bot checks (Stage 4) and passkeys (Account Phase 4). 464 backend tests pass. Detail: `specs/account-system.md` Phase 1 tasks, `ROADMAP.md` Stage 1. Pushed with Phase 1 as commit `ff7ce14`.

### 2026-10-07 — Accounts Phase 1: longer passwords, username login, live username check

Passwords now need 12 characters with no uppercase/digit/symbol rules ("a few random words work well"). They're checked against a bundled list of 46,000 common passwords and can't contain your username or email (`CommonPasswordValidator`). The list is the top 1 million leaked passwords filtered to 12+ characters, because almost none of the spec's top 10,000 are that long. It doesn't catch everything: `Password123!` isn't on it. Login takes your email *or* username in one field. Sign-up checks the username as you type (`GET /api/auth/username-available`), and names like `me`, `admin` and `settings` are reserved (`UsernameRules`). Both password fields got a Show/Hide button. The security review found that username login made lockout a harassment tool, since usernames are public and 5 wrong tries would lock anyone out. Now 5 wrong passwords block only that network address for that account (`LoginAttemptLimiter`), and the whole account locks only after 20. The code review caught a newline slipping past the username rule (`$` → `\z`) and older usernames with `@` that couldn't log in by name. The cookie part of Phase 1 stays in Roadmap Stage 4. Live-checked in the browser at desktop and phone width, light and dark. All 456 backend and 502 frontend tests pass. Detail: `specs/account-system.md` §0 and Phase 1. Pushed as commit `ff7ce14`.

### 2026-10-07 — List tags accept any language's letters

A list tag can now use letters from any language, so `fantasía`, `ciência` and `klassiker-für-kinder` work instead of being rejected. The rule in `ListTagRules.cs` and its copy in `web/src/lib/listTags.ts` now allow any Unicode letter, combining mark or digit with single inner hyphens. Normalizing lower-cases and applies Unicode NFC, so the two ways a computer can store "í" give the same tag. Accents still count: `fantasia` and `fantasía` are different tags (the simpler choice; suggestions steer people to the popular spelling). The es, de and pt-BR tag placeholders now show accented examples. Fixes `bugs/list-tags-reject-accents.md`, the last open P2 bug. New frontend and backend tests; all 418 backend and 206 component/lib frontend tests pass. Pushed as commit `e303379`.

### 2026-10-07 — The Feed's activity rows no longer read whole histories

Each Feed page used to group every event ever recorded by everyone you follow before keeping the newest page. Now `ActivityRepository.GetGroupsAsync` takes a `notBefore` floor and only reads events from 2 days before it, which is longer than any local day. On the All feed the floor is the oldest review or writing on a full page, because no older activity row could make that page, so nothing changes in what you see. With the Activity filter, or when there are few reviews, `FeedService` tries the last 7 days, then 30, then everything. The cursor also caps events at 2 days after it. A second cost the bug only guessed at was real: "the newest event of each group" rescanned the reader's history once per group. It's now one index lookup on `(UserId, CreatedAt = LatestAt)`. Loading a page's events (`GetEventsForGroupsAsync`) now narrows by a `CreatedAt` range before the time-zone conversion. `EXPLAIN ANALYZE` on about 9,000 seeded events (rolled back): 3,165 ms before, 0.7 ms for a normal page and 29 ms for the read-everything fallback. Fixes `bugs/activity-feed-query-reads-whole-history.md`. 2 new tests. Pushed as commit `0139deb`.

### 2026-10-07 — Blocks now reach comments

Two readers in a block no longer see each other's comments, highlight-comments, or anything replied below the other's comments, on writings, reviews, lists and reading updates (`CommentService`). A blocked reader also can't comment on, reply in, vote in or edit their old comments under the blocker's review or list, or anywhere down a thread the other person started; each answer looks the same as "doesn't exist", so it can't reveal a block. Logged-out visitors still see everything, and comment counts on cards still include hidden comments (a deliberate choice). The security review caught the owner case: without it, a blocked reader could keep commenting on the blocker's review where the blocker could no longer see it. Fixes `bugs/blocks-not-applied-between-commenters.md`; club discussions are filed separately as `bugs/blocks-not-applied-in-club-discussions.md`. 7 new tests.

### 2026-10-07 — Agent files brought up to date with the project

An audit of past sessions found reviewer and security-review always run as a pair, tester never used, and agent instructions that had gone stale. Every file in `.claude/agents/` now has a shared "Project facts" block: code lives in Apollon, builds run in Release, all UI text goes into the 5 locale files, and styling uses the design tokens. frontend-dev's outdated "Phase 2/3 is out of scope" section now describes what exists today, and the orchestrator no longer repeats these facts in its handoffs.

### 2026-10-06 — Token savings: changelog split, cheaper agent models, fewer subagents

This file now keeps only the last ~3 days in full, with older entries moved to `changelog/2026-09.md` and `changelog/2026-10.md` and a one-line index at the bottom. That took it from 134 KB to 36 KB, about 34k tokens down to ~9k per read. Agent files in `.claude/agents/` now set `model:` (Opus for orchestrator and security-review, Sonnet for the rest) and read only the SPEC.md sections they need. Subagents are reserved for large multi-part work, and security-review runs only on phases that touch auth, input, privacy or external APIs. `backend-dev.md` also lost its retired "wait for a go-ahead before each step" rule, so it now builds the whole task and explains the result plainly at the end.

### 2026-10-07 — Languages, Phases 2 and 3: every page and every error message

Every page is now translated into Spanish, Brazilian Portuguese, German and French, about 1,000 texts per language in 40 section files under `web/src/locales/`. That includes the genre, mood and content-warning names from the server catalogs, and dates, numbers, plurals and lists ("a, b y c"). Backend error messages got codes without changing the services. `Argos.Api/Errors/ErrorCodes.cs` lists all 131 messages as templates, a global filter adds `codes` to every error response, and the frontend shows them in the reader's language with the English as fallback. A backend test scans the source so a new message can't ship without a code; it found 3 the first inventory missed. A live browser pass covered 18 pages in Spanish and German at desktop and phone width, plus a wrong-password error shown in three languages. The reviews caught lowercased German nouns, keys borrowed from other features, and a Spanish byline that sounded like a death notice. All are fixed. Tag values can't contain accents (new bug `bugs/list-tags-reject-accents.md`). The flaky slow-test bug is fixed because it started failing most runs. The security review found that matching messages against templates could be forced to take ~30 s per request with crafted input. That's fixed with linear-time regexes and a 500-character cap, plus a test. A new `SPEC.md` rule: no hard-coded English. Translations are drafts until reviewed (checklist in `specs/languages.md`). Pushed as commit `6a23352` (all three phases in one commit). CI then failed 4 frontend tests that passed locally. The real API client took its address from the developer's `.env.local`, which CI doesn't have. Fixed in `64ab9d7`: `src/test/setup.ts` gives every test a fixed address, checked by running the whole suite with `.env.local` moved away. A later CI failure couldn't be reproduced, even running the full suite in a Linux container with 2 CPUs; it may have been a rerun of the old commit. Two timing races in my tests were hardened anyway in `f7620da`: they now wait for the save request and allow 5 s for a language's first load. The long club lifecycle test also gets 15 s, the same flaky-test pattern as before.

### 2026-10-06 — Book page: long subject lists start folded

Books with more than 10 Open Library subjects now show the first 8 and a "Show all N" button ("Show fewer" folds them back). Some books have dozens (Dracula has 73), which on a phone pushed "Log this book" about two screens down. New `BookSubjects` component with tests; checked live at 390 px and desktop. Fixes `bugs/book-page-subjects-bury-log-button-on-phone.md`, found in the browser pass the same day.

### 2026-10-06 — Browser click-through of clubs, lists and reviews (7 fixes, 1 bug filed)

The manual browser pass that `specs/book-club-improvements.md`, `specs/book-lists-improvements.md` and `specs/reviews-improvements.md` had left open is done. It used Playwright, three fresh test readers, desktop and 390 px, and all five themes, against the current code on a second port. Everything those specs list works. Fixed along the way:
- **Adding a book from a list's search failed (400) for books not yet cached.** Live results carry an empty id, and `AddBookSearch` sent it as-is. It now fetches the book first, like `BookPicker` (new test). Results on that box and the Search page are keyed by Open Library id, not the shared empty id.
- Book page and profile scrolled sideways on phones (the grid's `1fr` column grew to the widest select option; six profile tabs now scroll in their own row).
- "You’ve read 3 of 4" was spread across the progress bar. The list header squeezed the title to one word per line once the buttons fit beside it. No gap between pending invites and "Create a list".
- A club with no suggestions said "you haven’t voted yet" with a "Vote now" button. It now says "No books suggested yet" with "Suggest a book" (new test). Vote buttons get a real label ("Vote for Dune, 2 votes"). Checkpoint rows no longer leave the → arrow alone on a line on phones.

Filed `bugs/book-page-subjects-bury-log-button-on-phone.md`: books with dozens of Open Library subjects push "Log this book" two screens down on a phone (fixed later the same day, see above). Details are in each spec's Verification section.

### 2026-10-06 — Languages, Phase 1: English, Spanish, Portuguese, German, French

The site can now be shown in five languages (`react-i18next`), so far on the login, register and landing pages, the sidebar, header search and theme menu. Every other page comes in Phase 2. A visitor first gets their browser's language. The picker sits next to the theme button and, compact, in the landing top bar. A logged-in reader's choice is saved as `ApplicationUser.PreferredLanguage`: nullable, migration `AddPreferredLanguage`, set through the existing `PUT /me/preferences`. It's applied once per login, so it follows them to other devices. English is bundled and the other languages are downloaded only when picked. A test fails if any language is missing a text or breaks a `{{placeholder}}`. Live browser testing caught a `<link>` translation tag that i18next renders as an empty link, and a landing top bar too wide on phones in German, French and Portuguese. The reviewer found that remounting the whole app on a switch wiped typed drafts, and that defaulting old accounts to `en` would drag Spanish browsers back to English. Both are fixed. Translations are Claude's drafts until reviewed. Details, rules for writing keys and the review checklist are in `specs/languages.md`.

### 2026-10-06 — Account spec brought up to date with app-hardening

`specs/account-system.md` has a new §0 table listing what `specs/app-hardening.md` already built (refresh tokens, lockout, rate limits, the frontend refresh-and-retry, the 128-character password cap) and a decision for each difference. Usernames stay 3–30 characters, not 3–20. New endpoints reuse the existing `auth`/`refresh`/`public` rate-limit policies. Identity's `AllowedUserNameCharacters` stays wide, because narrowing it breaks saving for older accounts. The cookie, the in-memory token and the 15-minute login token all move to Roadmap Stage 4. Two gaps became tasks: the sessions list needs `SessionId`/`LastUsedAt`/`UserAgent` on `RefreshTokens` (Phase 3), and password reset needs a public `RevokeAllForUserAsync` (Phase 2). Phase 1's task list now ticks what's done, so what's left is clear: 12-character passwords with the common list, reserved names, email-or-username login, live username check and the show/hide toggle.

### 2026-10-06 — CI: automatic build and tests on every push

Added `Apollon/.github/workflows/ci.yml`, a GitHub Actions workflow that runs on every push and pull request. It has two jobs that run side by side. Backend: build in Release, then all xUnit tests against a Postgres 17 service container on `localhost:5432` (user and password `postgres`, matching `ApiFactory`). Frontend: `npm ci`, `tsc -b`, lint, Vitest and `vite build`. Locally the JWT signing key comes from `dotnet user-secrets`, which CI doesn't have, so the workflow makes a throwaway `Jwt__SigningKey` on each run. Each step passed when run by hand (391 backend tests, 444 frontend tests). The flaky slow-test bug (`bugs/mood-test-times-out-under-load.md`) may still turn a run red now and then until it's fixed. Ticks the first Stage 1 box in `ROADMAP.md`. Pushed the same day as commit `d0e257e`. That commit also holds all work since 2026-09-28, which until then was never committed, so it was not backed up.

### 2026-10-06 — Monetization ideas added to the backlog

Added a "Making money" section to `FUTURE-IDEAS.md`. Argos stays free and ad-free. Income would come from an optional supporter membership with cosmetic and convenience extras only, Bookshop.org affiliate links next to library links, and a one-off tip button. The section lists the features that must always stay free and the things to avoid (ads, selling data, limits on free accounts). Nothing gets built until after public launch.

### 2026-10-06 — Landing page built (both phases; live rows switched off)

Logged-out visitors at `/` now see a full-width landing page instead of the login form. Logged-in readers still get the Feed, through a new `HomeGate` route that never flashes the landing page while a saved login is being checked. The page has the pitch, the mascot, four feature cards drawn as demo components with public-domain sample books (covers from Wikimedia Commons, sources in `web/src/assets/landing/covers/SOURCES.md`), the basics, a trust line and link-preview tags. The join button reads the new `GET /api/auth/registration-status`, which has its own `public` rate limit so landing visits don't use up login attempts. Phase 2 (`GET /api/landing/showcase`: popular books and recent reviews safe to show strangers, cached 10 minutes) is built and tested but switched off by `Landing:ShowcaseEnabled` until moderation and private accounts exist. A live Playwright pass across all 5 themes at desktop and phone width caught two bugs, both fixed: an avatar `<div>` inside a `<p>`, and a highlight `<button>` that couldn't wrap inside its sentence. The reviewer and security-review passes found nothing serious. Their smaller findings are fixed: one review per reader in the showcase, blank reviews skipped, safer excerpt cutting (no split emoji, no "I…"), and a guarded book lookup. Two of their points became tasks to do before the showcase is switched on: clear its cache when a review is hidden, and set up the proxy's IP forwarding. Details and deviations are under "As built" in `specs/landing-page.md`.

### 2026-10-06 — Landing page spec

Added `specs/landing-page.md`. Logged-out visitors at `/` will see a full-width page explaining Toffee instead of being sent straight to `/login`; logged-in readers still get the Feed. Phase 1 (for the closed beta, Roadmap Stage 4) has no live data: the pitch "Track your reading, and read together — spoiler-free", the mascot, four feature cards drawn as live mini-components from sample public-domain books (they never call the API), and a join button that reads a new `GET /api/auth/registration-status` so it matches the invite-only switch. Phase 2 (before public launch, after moderation and private accounts) adds real popular books and reviews under strict privacy rules. `ROADMAP.md` Stages 4 and 10 and the `FUTURE-IDEAS.md` pitch idea now point to it.

### 2026-10-06 — Launch roadmap

Added `ROADMAP.md`: the ordered plan from today to a closed beta and then a public launch, in 12 stages with checkboxes and a "done when" for each. It combines SPEC.md's Next up list, the product analysis, the hosting research and the open bugs. Gaps it found: there's no CI (`.github/workflows/` is empty), `specs/account-system.md` Phase 1 overlaps with what `specs/app-hardening.md` already shipped, and no site-admin role exists for moderation. SPEC.md §4 Next up now points to it for the order. A "Gaps found" table near the top lists all nine gaps found, with evidence and the stage that fixes each one.

### 2026-10-06 — Product analysis: new "Next up" roadmap and backlog ideas

Compared Argos with what readers and writers ask for online (Goodreads, StoryGraph, Fable, Hardcover, Scribophile, AO3), in `PRODUCT-ANALYSIS.md`. The biggest weaknesses became a new **Next up — Launch readiness** list in `SPEC.md` §4, ahead of Phase 2: account system, export, Goodreads/StoryGraph import, reporting and moderation, notifications, yearly goal and stats, private accounts, and formats/editions/series. Phase 2/3 items that moved there are struck through. The other suggestions went to a new "From the product analysis" section in `FUTURE-IDEAS.md`, and the existing ideas they overlap with now point to their Next up item.

### 2026-10-06 — Hardening, phase 3: no blank-page crashes, faster first load, security headers

Phase 3 of `specs/app-hardening.md`, which completes the spec.
- **Crash fallback:** a crash while drawing a page now shows "Something went wrong on this page" with Reload and Go to Feed (`ErrorBoundary`) instead of a blank screen. The header and sidebar keep working. After a deploy, a tab that can't load a page from the old build says a new version is available.
- **Lazy loading:** pages load on first visit (`React.lazy`), and React, the router and React Query sit in their own `vendor` file that stays cached across deploys. The first load went from one 551 KB file to 393 KB (123 KB gzipped), 295 KB of it the cached libraries. The app's own entry file is 84 KB.
- **Retries:** failed queries retry only on server errors or lost connections, not on 404/403.
- **Cancelled searches:** search-as-you-type requests are cancelled when superseded.
- **Theme script:** it moved to `public/theme-init.js` and, like `useTheme`, survives blocked storage.
- **nginx:**
  - compression;
  - year-long caching of hashed assets;
  - `no-cache` for `index.html` and `config.js`;
  - security headers: a Content Security Policy whose API origin `entrypoint.sh` fills in from `API_BASE_URL`, plus nosniff, referrer, permissions and opener policies.

Review fixes:
- A temporary refresh failure at startup shows "Try again" instead of sending a signed-in reader to /login.
- A crashing navigation isn't rendered twice.
- http news images are upgraded to https (the CSP allows only https images) and fall back to the placeholder.
- 404s for assets aren't cached for a year.
- `API_BASE_URL` is validated.
- A request waiting on a refresh during logout fails instead of retrying as the next reader.

Checked live with the built Docker image on 16 pages, desktop/light and phone/dark: no CSP violations.

### 2026-10-06 — Hardening, phase 2: sessions that renew themselves, clean logout

Phase 2 of `specs/app-hardening.md`. Readers were logged out without warning after 60 minutes, mid-task. Login and register now also return a refresh token (30 days, rotated on every use; only a SHA-256 hash is stored, in the new `RefreshTokens` table, migration `AddRefreshTokens`).
- **Automatic renewal:** when a login token runs out, the frontend swaps the refresh token at `POST /api/auth/refresh` and retries the request. Several failing requests share one refresh, and two tabs refreshing together don't log each other out.
- **Theft detection:** reusing a token that was rotated more than 60 seconds ago revokes all of that reader's sessions.
- **Logout:** logout revokes the token (`POST /api/auth/logout`), clears the whole frontend cache, and logs out other tabs. This fixes the P1 `bugs/logout-keeps-cached-data.md`.
- **Other changes:** JWT clock skew is down from 5 minutes to 30 seconds, and `BrowserRouter` now wraps `AuthProvider`.

Review fixes:
- Only a real 400/401 from refresh ends a session; rate limits, server errors and lost connections keep it.
- A refresh finishing after logout is discarded and revoked instead of restoring the session.
- Refresh and logout have their own rate limit (30 a minute).
- Logout always answers 204.
- Logout no longer lands on `/login?next=<the previous reader's page>`, because the router's navigation is a React transition and the sign-out now joins it.

Checked live with 1-minute tokens in two tabs.

### 2026-10-06 — Hardening, phase 1: search cap, length limits, login lockout, rate limits

Phase 1 of `specs/app-hardening.md`, from a full check of the app.
- **Book search** returns at most 20 results. It used to return every saved title containing the query. It uses `ILIKE` with the user's `%`/`_` escaped, and a new pg_trgm index on `Books.Title`.
- **Length limits:** review text 10,000 characters, list title 150, list description 2,000, username 3–30 letters/digits/underscores, password 128. Each is enforced in the services, the database (migration `AddSearchIndexAndTextLimits`) and the forms, with a counter near the limit.
- **Login:** 5 wrong passwords lock an account for 15 minutes. A wrong password now says "Wrong email or password." instead of "Unauthorized", and no longer fires the app's logout event.
- **Rate limits:** login/register allow 10 requests a minute per IP, and book search and book lookup 30.
- **Other fixes:**
  - the API refuses to start with a signing key under 32 bytes;
  - news links must be http(s);
  - `UseHttpsRedirection` is removed;
  - the 5 build warnings are fixed.

Review fixes:
- The username rule isn't set in Identity's `AllowedUserNameCharacters`, which Identity re-checks on every save and would have broken older names like `jane.doe`.
- Profile saves now report Identity failures instead of answering 200.
- Search skips Open Library when the local cache fills all 20.

Proxy and IP follow-ups for hosting, plus the accepted lockout-abuse tradeoff, are in `ACCOUNTS-AND-HOSTING.md` §2.6. Integration tests now make usernames with `TestUsernames.FromEmail` (≤ 30 characters). Note: anyone who registered with a password over 128 characters can no longer log in (none in dev).

### 2026-10-05 — Page no longer shakes when opening a section for the first time

Opening a section (Feed, Writings, Reviews…) for the first time made the whole page jump a few pixels sideways and back. While the content loaded, the page was briefly short ("Loading…"), so Windows' scrollbar disappeared and the layout widened by its 15 px, then narrowed again when the content arrived (measured: the tabs moved 285 → 277.5 px within ~50 ms). Cached revisits didn't do it, which is why going back looked normal. `index.css` now sets `html { scrollbar-gutter: stable; }`, which always reserves the scrollbar's space; re-measured, nothing moves. Overlay scrollbars (macOS, phones) are unaffected.

### 2026-10-05 — Feed activity rows: started, finished, made a list

Phase 3 of `specs/feed-redesign.md`, which completes the feed redesign. A new `ActivityEvents` table records reading history as it happens (started, finished with rating, did not finish, made a list), back-filled from existing logs and lists. The Feed shows it as one compact row per reader per day in your own time zone ("Ana finished 2 books and started 1", with covers and "Show all"), each event with its own ♥ (`ActivityLikes`, `/api/activity/{id}/like`), under All and a new Activity chip. Rows follow the log's review privacy and the list's visibility, disappear while the book has a written review, and never include Want to read or "liked" events. Review fixes: back-dated logs are dated when they happened (not "today"), mis-clicks are replaced instead of leaving two rows, ratings stay in step on every row, unliking works after an event is hidden, back-filled rows were moved to midday so they don't fall on the previous day west of UTC (`ShiftBackfilledActivityToMidday`), and list and club actions refresh the Feed. Three follow-ups filed in `bugs/`, the main one being the cost of the grouped query (P2).

### 2026-10-05 — Integration tests start from an empty database; bug list started

The integration tests share a `argos_test` database that was migrated but never cleared, so every run added more readers, books and reviews. `ClubInviteAndReadersTests.Browse_MatchesTopGenre…` had started failing every run because leftover "horror fans" pushed the test's new reader out of the capped browse results. `ApiFactory` now drops and re-creates `argos_test` once per run, before any test host starts (a shared `Lazy`, since each test class has its own factory and classes run in parallel). The dev database `argos` is untouched. Full suite 340/340 on consecutive runs, and a run is faster (~31 s instead of ~46 s). Known open bugs now live in `bugs/`, one file each, with priority and size in `bugs/README.md`.

### 2026-10-05 — Feed: your own posts, filter chips, a starter block, Writings tabs

Phase 2 of `specs/feed-redesign.md`. The Feed now includes your own reviews and writings (posting from its composer used to show nothing), has All / Reviews / Writings chips kept in `?filter=`, and ends with "You're all caught up". While you follow fewer than 3 readers, a starter block adds this week's liked reviews and writings plus readers to follow, and following them updates the Feed at once. Writings gets Popular this week / Recent / Following tabs like Reviews (`ReviewTabs` became the shared `SectionSubTabs`). Readers in a block can no longer see, like or comment on each other's writings (new `WritingAccess`), and review lists leave them out too. `GET /api/feed/reviews` became `GET /api/feed?filter=`. Review fixes: an empty "Load more" at exact multiples of 20, `page` overflow into a 500 on Popular lists, and several lists that didn't refresh after following, reviewing or blocking.

### 2026-10-05 — Posts folded into Writings: one composer, notes, likes

Phase 1 of `specs/feed-redesign.md`. Posts duplicated Writings with fewer features (no likes, comments, editing or deleting), so they're gone: a Writing without a title is now a short note (≤1000 characters, no highlight-comments), and with a title it's a full piece. Migration `FoldPostsIntoWritings` turned the 5 existing posts into notes and dropped `Posts`. One "What are you reading or thinking?" composer replaces the two prompts; it starts as a note, with "+ Add title" and "This is a quote". Writings can be liked (`WritingLikes`), and feed and Writings cards show a ♥ button and a 💬 count. The Posts tab is gone and `/posts` redirects to `/writings`. Also fixed: deleting a writing left its comments behind; like buttons ignored refetched values (liking in the modal and then on the card double-counted); comment counts didn't refresh after commenting; `WritingCard` nested a `<div>` inside a `<p>`.

### 2026-10-04 — Readings strip on every section, one shared frame

The Readings strip only appeared on Feed, so switching to Writings, Reviews or Posts made the page jump. The four sections are now nested routes under a new `SectionsLayout` (strip + `SectionTabs` + `<Outlet />`), so the strip and tabs stay mounted and only the content below swaps: no reload of the strip, no jump. Checked live: the same strip element survives every tab switch, its position doesn't move, and the activity list isn't refetched. The pages themselves no longer render the strip or tabs.

### 2026-10-04 — Section tabs double as the page title

Feed, Writings, Reviews and Posts each had a big heading between the Readings strip and the tab bar. That heading is gone. The active tab is now the title instead: large serif, full-strength text, no underline; the other tabs stay small and muted. Each page keeps its `<h1>` hidden for screen readers. The change is scoped to `SectionTabs`, so the review sub-tabs and Browse lists tabs, which share the same base styles, look as before.

### 2026-10-04 — Readings strip becomes stories, with likes and comments

The home page's "Readings" strip opened a small card pinned to the top-left, so it looked like it belonged to the wrong book, and you could only look at it. The strip now works like Instagram stories:
- One tile per person, with a count when they have several updates. New updates get an accent ring; ones you've seen fade.
- A "You" tile shows your own updates with their like and comment totals.
- Clicking a tile opens a centered viewer (full screen on phones). ‹ / › and the arrow keys step through stories and roll on to the next person. There's no auto-advance timer.
- Each story has a ♥ like and a comment thread with replies, for the owner and their followers only.

Backend: a `ReadingLikes` table (migration `AddReadingLikes`), `CommentTargetType.Reading`, `POST/DELETE /api/readings/{id}/like` and `GET /api/readings/{id}/comments`. `/api/feed/activity` now returns up to 5 stories per person, includes your own, and adds like and comment counts. Deleting a log now also deletes its review and story comments, which used to be left behind. `ActivityItemPopover` was removed.

The code and security review found no access holes. Fixes from the review:
- **Story time:** a story now dates from its last progress update (new `Log.ProgressUpdatedAt`, migration `AddLogProgressUpdatedAt`), so a page update on an old book counts as news.
- **Activity query:** the per-person cap now runs in SQL instead of loading whole shelves into memory.
- **Moderation:** story owners can delete any comment on their story, and someone unfollowed or blocked can no longer edit their old comment.
- **Viewer:** it no longer shows stale likes or jumps to a different story when data refreshes, and Esc or a stray click no longer throws away a comment draft. The dialog now keeps keyboard focus inside it.

See `specs/reading-stories.md`.

### 2026-10-04 — Fix: ♡ Favourite button stayed locked after logging a book as Read

The book page's Favourite button is only enabled once you have a Read log, but saving a log (`LogForm`) or deleting one (`LogReviewCard`) never refreshed the cached favourite status, so the button kept saying "Mark it as read…" until a full page reload. Both now invalidate the `['favourites']` queries.

### 2026-10-04 — Clubs page: template cover for clubs without a book cover

Clubs that are still choosing a book, or reading one Open Library has no cover for, showed an empty dashed box. They now get a template "book": the club's initial in serif on an accent-tinted tile with a spine strip. One of three tints is picked from the club name, so it stays the same between visits. It is built only from existing tokens (via `color-mix`), so it follows dark mode. See `specs/clubs-directory-refresh.md`.

### 2026-10-04 — Clubs page: "Your clubs" cards, covers, realistic seed clubs

The Clubs page was one flat list of text rows, with your own clubs mixed in. It now opens with "Your clubs" cards (cover, your progress bar, next checkpoint, members), followed by "Discover clubs" without your clubs, sorted by size, with the current book's cover on every row. Backend: `ClubDto` and `MyClubSummaryDto` gained `CurrentBookCoverUrl`, and `MyClubSummaryDto` gained `MemberCount`. Five realistic clubs were seeded in the dev database, and the old test clubs were left alone. The review found that the Clubs page could be up to a minute stale after creating a club or changing one on its page. Both now refresh it. See `specs/clubs-directory-refresh.md`.

### 2026-10-04 — Find readers: label the filter bar as filtering people

The Genre/Audience/Mood selects on Find readers looked like book filters, since nothing said they filter readers by what they read. The bar now starts with a "Readers who read" lead-in, which also labels the group for screen readers. No behaviour change. See `specs/find-readers-discovery.md` §3.7.

### 2026-10-04 — Find readers Phases 2–3: fixes from code and security review

Ran the `reviewer` and `security-review` agents on Phases 2–3; from now on they run at the end of every phase. Neither found a private-rating leak or a way for an invited reader to act as a member.

Fixed:
- **Crash:** a malformed Open Library subject (an overflowing reading grade, a null) could crash the API and keep crashing it on every restart. Classification now can't throw, and the refresh and backfill catch per book.
- **Private moods:** the mood filter used moods from Private reviews; now Public only.
- **Blocking** cancels pending club invites between the two readers.
- **Invite link:** an invited reader opening a private club's link saw "Request sent" after actually joining. The endpoint now returns the status.
- **Back after a buddy read** reopened the form and could create a duplicate club. It now returns to the book page.
- **Smaller fixes:**
  - "Finish by" today works west of UTC.
  - Following refreshes taste matches.
  - Books in both fiction and nonfiction count for both.
  - Stale filter URLs are cleaned.
  - "Rated exactly alike" is only claimed at 100%.
  - "Literary criticism" and "political science" no longer count as genres.
  - Book-page readers drop the match badge, per the spec.
  - Simultaneous invites no longer give a 500.

Backend 314 → 318 tests, frontend 360 → 362, all passing; every fix was rechecked live in Chromium. Left for later: invite rate limits (with the account-system spec's rate limits), and the per-request cost of browse at larger scale. Details in `specs/find-readers-discovery.md` under Verification.

---

## Older entries — index

One line per archived entry. Open the month's file for the full text.

### October 2026 → [changelog/2026-10.md](changelog/2026-10.md)

- 10-03 — Find readers, Phase 3: book-page readers, buddy reads and club invites, genre/audience/mood filters (spec complete)
- 10-03 — Find readers, Phase 2: taste match, readers like you, compare page
- 10-03 — Blocking hides the blocker's profile from the blocked reader
- 10-03 — Find readers Phase 1: fixes from code and security review
- 10-03 — Find readers, Phase 1: discovery sections, reader cards, privacy and blocking
- 10-02 — Find readers discovery specced
- 10-02 — Account system specced
- 10-02 — Accounts and going-live costs researched
- 10-01 — Review improvements, Phase 4: quick questions, content warnings, "Readers say" (spec complete)
- 10-01 — Review improvements, Phase 3: likes, sorting, rating chart, favourites, discussion counts
- 10-01 — Review improvements, Phase 2: per-review privacy
- 10-01 — Review improvements, Phase 1: bylines, half stars, DNF, spoilers, rereads, edited
- 10-01 — Review improvements specced
- 10-01 — Fix: highlight-comment "Close" overlapping the post window's ×
- 10-01 — Fix: blurry, cropped book covers on post cards
- 10-01 — Book list improvements, Phase 4: shared lists (spec complete)
- 10-01 — Book list improvements, Phase 3: copy a list, reading challenges
- 10-01 — Book list improvements, Phase 2: likes, tags, comments, browse, lists with this book
- 10-01 — Fix: last eslint error (ClubsDirectoryPage)
- 10-01 — Book list improvements, Phase 1: notes, ranked lists, read progress, collages, sorting, unlisted
- 10-01 — Book list improvements specced (not started)
- 10-01 — Fix: checkpoint discussion stuck blurred when its details fail to load
- 10-01 — Book club improvements, Phase 4: recent activity (spec complete)
- 10-01 — Book club improvements, Phase 3: spoiler blur, questions, highlights, wrap-up, ratings
- 10-01 — Book club improvements, Phase 2: what's next card, past books, schedule template
- 10-01 — Book club improvements, Phase 1: checkpoint order, targets, counts, progress bars
- 10-01 — Book club improvements specced (not started)
- 10-01 — Highlight-comment compose box now shows the full selected text

### September 2026 → [changelog/2026-09.md](changelog/2026-09.md)

- 09-30 — Writing feed card/modal: reviewer-pass fixes + live verification
- 09-30 — Writing feed card redesign + two-column detail modal (frontend)
- 09-30 — WritingDto gains SourceBookCoverUrl for the feed card redesign
- 09-30 — Writings & Annotations: frontend cache-invalidation fixes + ReviewDetailPage empty-review handling
- 09-30 — Writings & Annotations: review-pass fixes (real bug + 2 minor hardening)
- 09-30 — Feed card: Writing branch renders the Quote/Original attribution line (frontend)
- 09-30 — Feed: Writing arm carries WritingKind/SourceText so a Quote's attribution line can render
- 09-30 — Writings & Annotations frontend built (composer, split-view detail pages, highlighting)
- 09-30 — Writings & Annotations backend built (domain, migration, services, controllers)
- 09-30 — Book clubs: checkpoint CRUD reviewer-pass cleanup (test coverage + stale doc)
- 09-30 — Book clubs: single-checkpoint create/edit/delete (backend)
- 09-30 — Readings: scroll arrows, border removed, tiles pulled close together
- 09-30 — Readings tiles bumped again to match a reference screenshot's scale
- 09-30 — Readings tiles bigger, show the book cover (avatar as fallback)
- 09-30 — "Stories" row renamed to "Readings", tiles shaped like closed books
- 09-30 — Removed rating/review from the quick "+" progress-update modal
- 09-30 — Avatar picker backend: preset allowlist + `PUT /api/users/me/avatar`
- 09-30 — Avatar picker (frontend): preset-only profile pictures
- 09-30 — Header logo realigned with Sidebar after the grouped-shell change
- 09-30 — Sidebar/rail background flattened; feed column matched to Facebook's width
- 09-30 — Grouped, centered 3-column shell (Bluesky-style)
- 09-30 — Divider lines moved to hug the content column
- 09-30 — Narrower center column
- 09-30 — 5-theme picker + site-wide 3-column layout
- 09-30 — Logo bumped again, 3.5rem → 4.5rem
- 09-30 — Bigger header logo, sidebar nav realigned under it
- 09-30 — Argos → Toffee rename, scoped to user-facing text
- 09-30 — Header logo goes image-only; app rebranding to "Toffee" is starting
- 09-28 — Real logo: user's own dachshund illustration wired into the header
- 09-28 — Fixed oversized "Current page" input in the reading-progress log form
- 09-28 — Book Clubs: edit/delete for comments, replies, and suggestions
- 09-28 — Fixed silent duplicate comments/replies/suggestions in Book Clubs
- 09-28 — Book Clubs: post-review fixes (self-removal, wrong-scope `[Authorize]`, sidebar due-date bug, name/description length limits)
- 09-28 — Fixed `confirm-book` 500 on bare-date checkpoints at the root (DateTime.Kind, not client workaround)
- 09-28 — Book Clubs frontend built (directory, club page, suggest/vote/confirm, checkpoint threads)
- 09-28 — Book Clubs backend built (domain, migration, services, controllers)
- 09-28 — Sidebar nav: bigger text, an icon per link
- 09-28 — Site name and search moved into a new top header bar
- 09-28 — Layout polish: centered content, centered sidebar nav, icon-only theme toggle
- 09-28 — Design direction switched: E-Ink → Reading Room
- 09-28 — Manual light/dark toggle
- 09-28 — E-ink design refresh: grayscale palette, serif/sans pairing, dot ratings
- 09-28 — Reading progress tracking: pages, percentage, and a "+" tile
- 09-27 — Fixed: posting about a never-before-searched book failed with a 400
- 09-27 — Book posts + composer prompt, merged into the reviews feed
- 09-27 — Home dashboard redesign (4-zone layout, replaces `/feed`)
- 09-27 — Book news: real per-article pictures on the left, favicon removed
- 09-27 — Book news layout redesigned to match a reference screenshot, plus real bylines
- 09-27 — Book news feed
- 09-27 — Author names and a broken cover-id fallback fixed
- 09-27 — Live Open Library search fallback
- 09-27 — Seeded the dev database with fake accounts/books/reviews/lists
- 09-27 — Frontend fully built (all 10 tasks)
- 09-27 — Frontend project scaffolded, `frontend-tasks/` created
- Earlier — Backend built (17-module learning curriculum)
