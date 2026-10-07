# Feature Spec — App Hardening (security, sessions, resilience, performance)

**Status:** ✅ Implemented (2026-10-06), all three phases. Each was reviewed (`reviewer` + `security-review`) and its findings fixed before it was closed.

## 1. Problem

A full check of the app on 2026-10-06 found nothing broken by the usual measures:
- the backend builds,
- all 349 backend and 393 frontend tests pass,
- the frontend type-check and lint pass.

It did find gaps that only show up with real use, or once the app is public:

1. **Book search ignores its 20-result cap.** `BookRepository.SearchByTitleAsync` returns *every* saved book whose title contains the query. `BookService.SearchAsync` then adds all of them before checking `MaxSearchResults`. Searching "a" returns nearly the whole `Books` table, and each search reads every row, because nothing indexes "title contains".
2. **Some text has no length limit.** Writings, comments, notes, club names and progress notes are capped; these aren't:
   - review text (`Log.ReviewText`),
   - list title and description (`BookList.Title`, `BookList.Description`),
   - username at registration.

   Anyone can save a review of up to about 30 MB, the web server's default request size.
3. **Unlimited password guessing.** `AuthController.Login` uses `UserManager.CheckPasswordAsync`, which never counts failed attempts. Nothing limits request rates either. Book search (`GET /api/books`) is open to anyone, and every call also queries Open Library. A script could make Argos flood Open Library until Open Library blocks Argos's User-Agent.
4. **Users are silently logged out after 60 minutes.** The login token (a JWT, the signed pass sent with every request) expires after an hour, and there's no way to renew it. The next request fails with 401, and the app logs the user out mid-task. Someone halfway through a long Writing loses it.
5. **Logout leaves the previous user's data on screen** (`bugs/logout-keeps-cached-data.md`, P1). It's included here because Phase 2 rewrites login and logout anyway.
6. **A wrong password shows "Unauthorized".** The API answers a failed login with an empty 401. `LoginPage` shows the raw status text. The API client also treats that 401 as "your session expired" and fires the logout event.
7. **One rendering error blanks the whole app.** There's no error boundary (a React component that catches crashes in the components inside it and shows a fallback instead).
8. **The whole app downloads as one 551 KB JavaScript file**, including all 19 pages, before anything shows.
9. **The web server config is the bare minimum.** `web/nginx.conf` only does SPA routing. It has:
   - no compression,
   - no long-term caching of the build's hashed asset files,
   - no rule stopping browsers from caching `config.js`,
   - no security headers.
10. **Failed requests are retried even when retrying can't help.** React Query is set to `retry: 1`, so "403 forbidden" and "404 not found" are requested twice.
11. **News links aren't checked.** `NewsFeedFetcher` accepts any `<link>` from the RSS feeds. React 19 already blocks `javascript:` links, so the risk is low, but the server should only pass on `http`/`https`.
12. **Startup config is fragile.**
    - If `Jwt:SigningKey` is missing or too short, the app either crashes with an unclear error or starts with a weak key.
    - `UseHttpsRedirection` runs inside a container that only serves HTTP, so it does nothing except log a warning.
13. **Small things.**
    - The theme script in `index.html` reads `localStorage` without `try/catch`, so it throws where storage is blocked (some private-browsing modes).
    - Search-as-you-type requests aren't cancelled when the user keeps typing.
    - 5 build warnings.

## 2. Clarifying decisions

- **One spec, three phases, grouped by area rather than by severity.** Phase 1 covers backend fixes that each take under an hour. Phase 2 is login sessions, which touches login, logout and the API client together. Phase 3 is frontend resilience and delivery. Each phase ships, gets reviewed and goes in the changelog on its own.
- **Sessions use refresh tokens, stored like the login token is today (`localStorage`).** A refresh token is a second, long-lived random value whose only use is getting a new login token. Moving both into an httpOnly cookie, which page scripts can't read, is safer against XSS (attacks that inject scripts into the page). It needs the API and the web app on the same site, though, and today they're separate origins (`docker-compose.yml`: ports 5173 and 8080). That move belongs with the hosting decision (`ACCOUNTS-AND-HOSTING.md`) and is out of scope here.
- **Default numbers (easy to change, all in config):**

  | Setting | Value |
  |---|---|
  | Login token lifetime | 60 min (unchanged) |
  | Refresh token lifetime | 30 days, renewed on every use |
  | Account lockout | 15 min after 5 wrong passwords in a row |
  | Rate limit: login and register | 10 requests per minute per IP address |
  | Rate limit: book search | 30 requests per minute per IP address |

- **A locked account says so.** It answers "Too many failed attempts. Try again in 15 minutes." (HTTP 429) rather than pretending the password is wrong. The usual worry is that this reveals which emails have accounts. Registration already reveals that ("Email is already taken"), so hiding it here would only confuse real users.
- **Lockout can be abused, and that's accepted for the beta.** Someone who knows a reader's email can send 5 wrong passwords every 15 minutes and keep that reader locked out. Emails aren't shown anywhere public, so the risk is small for now. If it happens, count failures per account *and* IP, or add a CAPTCHA (noted in `ACCOUNTS-AND-HOSTING.md` §2.6).
- **Length limits match what's natural for each field, with room to spare.** Measured on the dev database on 2026-10-06, every current value is far below them, so the migration won't fail on existing data:

  | Field | Limit | Longest today |
  |---|---|---|
  | Review text | 10,000 characters | 160 |
  | List title | 150 | 35 |
  | List description | 2,000 | 49 |
  | Username | 3–30, letters/digits/underscore | 21, all already in that format |
  | Password | 128 max | — |

  Production data must be re-measured before the migration runs there.
- **Rate limits are keyed by IP address.** Behind a hosting proxy every request would appear to come from the proxy's IP. Reading the real client IP from `X-Forwarded-For` (`ForwardedHeaders`) belongs to the hosting work, and is noted there rather than guessed now.
- **Rate limits and lockout must not break the integration tests**, which register hundreds of users from one IP. `ApiFactory` overrides the rate-limit config with very high numbers. Lockout stays on, because a test checks it.
- **Request cancellation only where it matters:** search-as-you-type queries (book search, tag suggestions, reader search). Threading a cancel signal through all ~20 API files would be churn for no visible gain.
- **Remove `UseHttpsRedirection`** rather than configure it. HTTPS will be handled by whatever sits in front of the app when it's hosted, the same place HSTS (the header telling browsers to always use HTTPS) belongs.

## 3. Design

### 3.1 Book search (Phase 1)

- `BookRepository.SearchByTitleAsync(query, limit)`:
  - matches with `EF.Functions.ILike(b.Title, "%" + escaped + "%")`, escaping `%`, `_` and `\` in the user's text;
  - sorts titles that *start* with the query first, then alphabetically;
  - returns at most `limit` rows (`Take(limit)`).
  - Today's `ToLower().Contains()` compiles to `strpos(lower(...))`, which no index can speed up. `ILIKE` can use one.
- Migration `AddSearchIndexAndTextLimits` (one migration for this and §3.2):
  - `HasPostgresExtension("pg_trgm")`;
  - `HasIndex(b => b.Title).HasMethod("gin").HasOperators("gin_trgm_ops")`.
  - pg_trgm is a Postgres add-on that indexes three-letter fragments, so "title contains X" no longer reads every row. It ships with the `postgres:17` image.
- `BookService.SearchAsync` passes `MaxSearchResults` to the repository, so the combined list can never pass 20.
- `BooksController.Search` rejects queries over 200 characters (400).

### 3.2 Text length limits (Phase 1)

- **Services return the existing "Invalid" result shape**, as Writings and comments already do:
  - `LogService` validates review text (10,000);
  - `BookListService` validates title (150) and description (2,000), on both create and update.
- **Registration** is validated in `AuthController.Register` before calling Identity:
  - username 3–30 characters, `^[A-Za-z0-9_]+$`;
  - password at most 128 characters;
  - email at most 256 characters, the Identity column's existing size.
  - **Not** set as Identity's `AllowedUserNameCharacters` (changed in review): Identity re-checks that on every save, so an older account named e.g. `jane.doe` could no longer save its profile or record failed logins. Registration is the only place a username is set, so the check there is enough.
- **Same migration, `AddSearchIndexAndTextLimits`:** `HasMaxLength` on `Log.ReviewText`, `BookList.Title` and `BookList.Description`, so the database enforces the limits too.
- **Frontend:**
  - `maxLength` plus the existing character-counter style on the review textarea (`LogForm`), the list title and description (`ListForm`), and the register username field;
  - register shows the username rule as hint text;
  - limits live as constants next to each form, as `WritingComposerModal` does.

### 3.3 Login lockout and rate limits (Phase 1)

- **Identity options in `Program.cs`:**

  ```csharp
  options.Lockout.MaxFailedAccessAttempts = 5;
  options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
  options.Lockout.AllowedForNewUsers = true;
  ```

- **`AuthController.Login`** switches to `SignInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true)`. This needs `AddSignInManager()` on the Identity builder; only the password check is used, no cookie.
  - Locked out → 429 with ProblemDetails `title: "Too many failed attempts. Try again in 15 minutes."`
  - Wrong password or unknown email → 401 with ProblemDetails `title: "Wrong email or password."` (§3.5).
- **Rate limiting** with ASP.NET's built-in `AddRateLimiter`, fixed-window policies partitioned by `RemoteIpAddress`:
  - `"auth"`: 10/min, on `register`, `login` and (Phase 2) `refresh`;
  - `"search"`: 30/min, on `GET /api/books`.
  - Limits come from a new `RateLimits` config section (`RateLimitOptions`).
  - Rejections return 429, a `Retry-After` header and ProblemDetails `title: "Too many requests. Please wait a minute and try again."`
  - `app.UseRateLimiter()` goes after `UseCors`, so 429 responses still carry CORS headers and the browser lets the app read them.
- **Frontend:** nothing extra. `extractErrorMessage` already shows a ProblemDetails `title`. Book search's error state shows it in place of results.

### 3.4 Sessions: refresh tokens, clean logout (Phase 2)

**Data.** New `RefreshToken` entity (Infrastructure, next to `ApplicationUser`); migration `AddRefreshTokens`:

| Column | Notes |
|---|---|
| `Id` | |
| `UserId` | Foreign key, cascade on user delete |
| `TokenHash` | Unique index |
| `CreatedAt`, `ExpiresAt`, `RevokedAt?` | |
| `ReplacedByTokenId?` | The token that rotated this one out |

Only a SHA-256 hash of the token is stored, so a leaked database can't be used to log in.

**Token.** 32 random bytes (`RandomNumberGenerator`), sent as base64url.

**API:**
- **Login and register** return `{ token, refreshToken }`. `AuthResponse` gains `RefreshToken`.
- **`POST /api/auth/refresh` `{ refreshToken }`**, no `[Authorize]`, with its own `"refresh"` rate limit (30 a minute per IP; changed in review). Sharing login's 10 a minute would let failed logins from the same network use up the budget and log readers out. When the token is valid, not expired and not revoked:
  1. revoke it, and set `ReplacedByTokenId`. This is one conditional `UPDATE … WHERE RevokedAt IS NULL`, so two requests can't both rotate the same token;
  2. issue a new pair.

  This is called "rotation": each refresh token works once.
- **Reuse of a revoked token:**
  - Rotated more than 60 seconds ago: treat it as stolen. Revoke every refresh token the user has, and return 401.
  - Within 60 seconds: return 401 but revoke nothing. Two browser tabs refreshing at the same moment cause exactly this, and must not log the user out everywhere.
  - Revoked by logout (no `ReplacedByTokenId`): just 401.
- **`POST /api/auth/logout` `{ refreshToken }`**: revokes that token, with the `"refresh"` rate limit. Always 204, whatever it's sent: `LogoutRequest` has no validation attributes. If the token was rotated within the last 60 seconds (a refresh still in flight when the reader clicked Log out), its replacement is revoked too.
- **`RefreshTokenService`** (scoped) holds `IssueAsync`, `RotateAsync` and `RevokeAsync`. This was changed while building: `TokenService` stays a singleton that only signs login tokens and needs no database.
- **Cleanup:** a small `RefreshTokenCleanupService` (`BackgroundService`, once a day) deletes tokens that expired or were revoked more than 30 days ago. It's a separate service rather than part of `OpenLibraryCacheRefreshService`, which is only about Open Library.
- **JWT `ClockSkew` lowered to 30 seconds** (the default is 5 minutes). With automatic renewal there's no need to accept a token long after it expires.
- **Lockout doesn't revoke refresh tokens, deliberately.** Anyone who knows an email can trigger lockout (§2), so revoking on lockout would let them log that reader out everywhere. If lockout is ever used as an admin ban, refresh must check it. A future password-change or reset endpoint must call `RevokeAllForUserAsync`.

**Frontend (`api/client.ts`, `api/authToken.ts`, `auth/AuthContext.tsx`):**
- `authToken.ts` stores both tokens: `argos_token` (unchanged key) and `argos_refresh_token`.
- **On a 401 from any request except `/auth/login`, `/auth/register`, `/auth/refresh` and `/auth/logout`:**
  1. If the stored login token has changed since the request was sent (another tab refreshed), retry once with the new token.
  2. Otherwise, call `/auth/refresh`. Only one refresh runs at a time: concurrent 401s share one promise.
  3. The refresh has one of three outcomes:
     - **Renewed:** store the new pair and retry the original request once.
     - **Ended:** 400 or 401, after waiting 1 second in case another tab won the race and is about to store its pair. Clear both tokens and fire `UNAUTHORIZED_EVENT`.
     - **Unavailable:** 429, 5xx or no network. Keep the tokens: the refresh token is probably still fine. The request fails with a 503 `ApiError`, which React Query may retry (§3.9).
  4. If the stored refresh token changed while a refresh was in flight (logout, or another tab), the new pair is thrown away and revoked rather than stored. Otherwise a logout could be undone.
- **`logout()`:**
  1. Clear both tokens.
  2. In one `startTransition`, navigate to `/login` (`replace`) and mark the session ended.
  3. Call `queryClient.clear()`.
  4. Send the refresh token to `/auth/logout` (best-effort).

  Why the transition: React Router applies navigations as a low-priority update. Without it, "signed out" rendered first on the old page, and `ProtectedRoute` redirected to `/login?next=<that page>`, which sent the next reader to the previous reader's page (found in review). Clearing the cache doesn't refetch anything by itself: mounted screens would only refetch on their next render, and in that render `ProtectedRoute` has replaced them. This is the fix from `bugs/logout-keeps-cached-data.md`.
- `login()` and `register()` also call `queryClient.clear()` before storing the new tokens, then load the reader with `fetchQuery`, so protected pages open signed in.
- **Cross-tab:** listen for the `storage` event.
  - When `argos_token` is removed in another tab, log out here too, without calling the API again.
  - When one appears while this tab is logged out, clear the cache and sign in.
  - A changed token is just another tab's refresh, and is ignored.
- `BrowserRouter` now wraps `AuthProvider` in `main.tsx`, so `AuthProvider` can call `useNavigate`. Tests that render `AuthProvider` put the router outside it.
- **Known, accepted:** a like or other update sent just before logout that finishes afterwards can write the old reader's data back into the cache. The next login clears the cache again, so this needs the request to finish *after* the next reader has logged in.

### 3.5 Clear login errors (Phase 1)

- Backend: §3.3 gives the 401 and 429 ProblemDetails titles.
- `LoginPage` shows `err.message` as today. It will now read "Wrong email or password." or the lockout or rate-limit message, never "Unauthorized".
- The `UNAUTHORIZED_EVENT` part needs the client change in §3.4. Until Phase 2, `request()` skips the event for exactly `/auth/login` and `/auth/register` (not every `/auth/` path: a 401 from `/auth/me` really is a session ending).

### 3.6 News links (Phase 1)

`NewsFeedFetcher` keeps an item only if `Uri.TryCreate(link, UriKind.Absolute, out var uri)` succeeds and the scheme is `http` or `https`. Image URLs get the same check; if one fails, the image is dropped but the item is kept.

### 3.7 Startup config (Phase 1)

- **`Program.cs`:** after reading `jwtOptions`, throw `InvalidOperationException` when it's null or `SigningKey` is under 32 bytes (HMAC-SHA256's recommended minimum). The message names the setting and the env var (`Jwt__SigningKey`).
- **Dev keeps working:** `dotnet user-secrets` is already configured (`UserSecretsId`). Check the dev key's length before merging, and update `ACCOUNTS-AND-HOSTING.md` if a new key is needed.
- **Remove `app.UseHttpsRedirection()`** (§2).

### 3.8 Error boundary (Phase 3)

- New `components/ErrorBoundary.tsx`, a class component (React has no hook for this).
- **Fallback:** a `StateMessage`-styled block, "Something went wrong on this page.", with **Reload** (`location.reload()`) and **Go to Feed** buttons. It logs the error with `console.error`.
- **Used twice:**
  - around `<Outlet />` in `Layout`, with a `resetKey={pathname}` prop rather than a React `key`. A `key` would remount the page behind the writing modal whenever the URL changed. The boundary clears an error only if it was already showing before the key changed, so a navigation that itself crashes isn't rendered twice (found in review). The header and sidebar stay usable;
  - around `<App />` in `main.tsx`, as a last resort if the layout itself crashes.
- The background-location modals (`WritingDetailModal` and the others rendered by the second `<Routes>` in `App.tsx`) get their own boundary, so a crash in a modal doesn't blank the page behind it.
- **After a deploy**, the old build's page files are gone, so an open tab fails the first time it visits a page it hadn't loaded. The boundary recognises that error and says "A new version of Toffee is available" with **Reload**, instead of the generic message.
- **Known, accepted:** the writing overlay's fallback renders below the page rather than inside the overlay, so it's easy to miss. The page behind stays usable, which was the goal.

### 3.9 Smarter retries (Phase 3)

In `main.tsx`:

```ts
retry: (failureCount, error) =>
  failureCount < 1 && !(error instanceof ApiError && error.status < 500)
```

This retries only server errors and network failures. Mutations stay at 0 retries (the React Query default).

### 3.10 Code splitting (Phase 3)

- **In `App.tsx`:** every page loads with `React.lazy(() => import(...))`, except `Layout`, `LoginPage` and `FeedPage` (the first screens most people see).
- Each lazy page is wrapped in one `<Suspense>` showing the existing "Loading…" `StateMessage`:
  - inside `Layout` around the `<Outlet />`, inside the error boundary, so the frame stays put;
  - around the modal `<Routes>`.
- **Target:** the main JS chunk under 250 KB. Record before and after sizes in the changelog.
- **Result (2026-10-06):** before, one 551 KB file. After lazy loading alone, the entry file was 303 KB: React, React DOM, React Router and React Query by themselves come to about 290 KB, so no amount of page splitting gets under 250. `vite.config.ts` now puts those libraries in their own `vendor` file (295 KB, 92 KB gzipped), which rarely changes and stays in the browser cache across deploys. The app's own entry file is 84 KB (25 KB gzipped). Each other page is a small file loaded on first visit.
- **Whole first load:** 17 files, 393 KB raw / 123 KB gzipped (the entry, `vendor` and the small shared files the entry preloads), against 551 KB in one file before. The 250 KB target is met by the app's own entry file only.
- Pages are named exports, so use `lazy(() => import('./pages/X').then(m => ({ default: m.X })))`, or add a small `lazyPage` helper in `lib/` if this repeats.

### 3.11 nginx: compression, caching, security headers (Phase 3)

`web/nginx.conf`:
- `gzip on` for JS, CSS, JSON and SVG, with `gzip_vary on` so caches in between don't hand compressed files to clients that didn't ask for them.
- `location /assets/`: Vite's hashed files never change once built, so `Cache-Control: public, max-age=31536000, immutable`. This is set *without* `always`, so a 404 for a file from another build isn't cached for a year (found in review).
- `location = /config.js`, and `location /` (which serves `index.html` for every app path): `Cache-Control: no-cache`, so a new deploy or a new `API_BASE_URL` is picked up immediately.
- On every response, from a snippet `docker/entrypoint.sh` writes to `/etc/nginx/snippets/security-headers.conf`:
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Cross-Origin-Opener-Policy: same-origin` (added in review)
  - a Content Security Policy (CSP), a header listing where the page may load scripts, styles, images and data from:

    ```
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' <API origin>;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none'
    ```

- **Every location includes the snippet.** In nginx, a location that adds any header of its own drops the server-level ones, so including it once at server level would have lost the security headers on every page.
- **CSP details:**
  - `img-src https:` because news images come from any site. No reader can supply an image URL: avatars are catalog keys, covers come from Open Library, and news comes from the configured feeds. `NewsFeedFetcher` upgrades `http://` news images to `https://`, and `NewsCard` falls back to its placeholder if one still won't load.
  - The API origin isn't known until startup, so `docker/entrypoint.sh` writes it into the snippet, taken from `API_BASE_URL` the same way as `config.js`. The script first refuses (exit 1) any `API_BASE_URL` that isn't a plain http(s) URL, since the value is pasted into JavaScript and a header.
  - `script-src 'self'` blocks inline scripts, so the theme script moved out of `index.html` (§3.12).
  - `'unsafe-inline'` for styles is probably not needed: the build puts all CSS in files. It's kept for now, since it carries little risk without an HTML-injection bug. Removing it is worth a try under `Content-Security-Policy-Report-Only` later.
- **Checked before turning it on:** the built image in Chromium, 16 pages, desktop with the light theme and phone with the dark theme. No CSP violations.

### 3.12 Theme script (Phase 3)

Move the inline script from `index.html` to `public/theme-init.js`, loaded with `<script src="/theme-init.js">` in `<head>` (still before first paint). Wrap the `localStorage` read in `try/catch`. Do the same in `hooks/useTheme.ts` (lines 26 and 37), which has the same unguarded reads and writes.

### 3.13 Cancel stale searches (Phase 3)

- `request()` accepts an optional `signal` and passes it to `fetch`. `apiClient.get(path, query, signal?)`.
- The book search, list-tag suggestion (`TagInput`) and reader search API functions take `signal?`. Their `useQuery` `queryFn`s pass React Query's `({ signal })`.
- An aborted request rejects with `AbortError`, which React Query ignores for cancelled queries. Make sure it isn't shown as an error.

### 3.14 Build warnings (Phase 1)

- Add the missing `<param>` docs: `LogsController.ToDto`, `LogService.CreateAsync`, `ReaderTasteProfile`.
- Fix the possible null at `ClubCheckpointImprovementsTests.cs:217`.
- Target: `dotnet build -c Release` with 0 warnings.

## 4. Explicitly out of scope

- **The other open bugs in `bugs/`:** blocks between commenters, feed query cost, the flaky tests and the rest. Each keeps its own file and priority. Only the logout bug (P1) is folded in here, because Phase 2 rewrites that code.
- **httpOnly-cookie sessions, HTTPS/HSTS, and reading the real client IP behind a proxy (`ForwardedHeaders`).** These go with the hosting decision. Add a line for each to `ACCOUNTS-AND-HOSTING.md` so they aren't lost.
- **Email confirmation, password reset, two-factor login** (SPEC.md Phase 2).
- **Rate limits on writes** (posting comments, likes). Nothing suggests abuse yet, and per-user limits need their own thought.
- **Autosaving Writing drafts.** Refresh tokens remove the main way to lose a draft (the 60-minute logout). Draft saving is a nice-to-have for `FUTURE-IDEAS.md`.
- **A CSP reporting endpoint.**

## 5. Tasks

### Phase 1 — Backend quick fixes

#### Backend
- [x] Book search: `ILIKE` with escaping, prefix-first order, `Take(limit)`; `BookService` passes the cap; 200-character query limit (§3.1).
- [x] Migration `AddSearchIndexAndTextLimits` (pg_trgm + GIN index on `Books.Title`, plus §3.2's column limits).
- [x] Length limits in `LogService` and `BookListService`; registration checks in `AuthController` (§3.2).
- [x] Review fixes: book detail lookup (`GET /api/books/{id}`) rate-limited too, since a cache miss calls Open Library and saves a row; IPv6 clients share a bucket per /64; lockout message follows the configured time; search skips Open Library when the cache already fills 20; a rejected news image falls back to the body image; profile saves (`UsersController`) return an error instead of 200 when Identity refuses them.
- [x] Lockout options, `AddSignInManager()`, `CheckPasswordSignInAsync(lockoutOnFailure: true)`; ProblemDetails for 401 and 429 (§3.3).
- [x] `RateLimitOptions` + `RateLimits` config section; `"auth"` and `"search"` policies; `UseRateLimiter()` after CORS; 429 ProblemDetails with `Retry-After`.
- [x] News link and image URL checks (§3.6).
- [x] Startup check for `Jwt:SigningKey`; remove `UseHttpsRedirection` (§3.7).
- [x] Fix the 5 build warnings (§3.14).
- [x] Tests:
  - search returns ≤ 20 with many matches; `%` and `_` in queries are literal;
  - over-limit review, list title and description, username and password are rejected;
  - 5 wrong passwords lock the account (429), and the right password is also refused while locked;
  - the 11th login in a minute gets 429 (with a low limit set in that test);
  - non-http news links are dropped.
- [x] `ApiFactory`: high rate limits by default.

#### Frontend
- [x] `maxLength` + counters on the review and list title/description; `maxLength` and hint text on the register username (no counter: 30 characters never needs one) (§3.2).
- [x] `request()` doesn't fire `UNAUTHORIZED_EVENT` for `/auth/login` and `/auth/register` (§3.5); a list of registration errors shows as one readable message.
- [x] Tests: `LoginPage` shows "Wrong email or password." on 401 and the lockout message on 429; a failed login doesn't log anyone out.

#### Verification & docs
- [x] Live check (Release API on 5259 + Vite on 5174, dev database): "Wrong email or password." on login, 429 with the lockout message after 5 tries, 429 + `Retry-After` + CORS header past the rate limit, a 10,001-character review refused with "A review can be at most 10000 characters.", register shows the username rule and hint, and `EXPLAIN` uses `IX_Books_Title`. The dev database holds only 11 books, so the 20-result cap is covered by the integration test instead. Suites: backend 364/364, frontend 406/406, build 0 warnings.
- [x] `reviewer` + `security-review`, then fix findings (see the review-fixes line above; lockout abuse and proxy/IP follow-ups recorded in §2 and `ACCOUNTS-AND-HOSTING.md` §2.6).
- [x] `CHANGELOG.md` entry; `SPEC.md` data model (index, length limits).

### Phase 2 — Sessions

#### Backend
- [x] `RefreshToken` entity, DbContext config, migration `AddRefreshTokens` (§3.4).
- [x] `RefreshTokenService` (not `TokenService`, see §3.4): issue, rotate (with the 60-second reuse window and revoke-all on later reuse), revoke.
- [x] Login and register return `refreshToken`; `POST /api/auth/refresh` (rate-limited); `POST /api/auth/logout`.
- [x] `RefreshTokenCleanupService` (daily).
- [x] Tests:
  - refresh returns a new pair and the old token stops working;
  - reuse within 60 seconds → 401 and nothing else revoked;
  - reuse after 60 seconds → all of the user's tokens revoked;
  - expired token → 401;
  - logout revokes;
  - logout with an unknown token → 204;
  - logout just after a rotation also ends the replacement.

#### Frontend
- [x] `authToken.ts` stores both tokens.
- [x] `client.ts`: on 401, check for a token changed by another tab, else one shared refresh (renewed / ended / unavailable), then retry once; credential paths excluded (§3.4).
- [x] `main.tsx`: `BrowserRouter` wraps `AuthProvider`.
- [x] `logout()`: clear tokens, then navigate to `/login` and end the session in one transition, `queryClient.clear()`, then the API call. `login()`/`register()` clear the cache too.
- [x] Cross-tab logout via the `storage` event.
- [x] Tests:
  - an expired token is refreshed and the request retried transparently;
  - two simultaneous 401s cause one refresh;
  - a failed refresh logs out;
  - log out as A, log in as B: A's cached Feed is gone (the test from the bug file);
  - logout in another tab logs this tab out; another tab's refresh doesn't;
  - logout from a protected page lands on plain `/login` (fails without the transition);
  - a 429 from refresh keeps the session; a refresh finishing after logout doesn't restore it.

#### Verification & docs
- [x] Live check (Release API on 5259 with `Jwt__ExpirationMinutes=1`, Vite on 5174, Chromium, two tabs of one browser):
  - waited 100 seconds past expiry, then both tabs navigated at the same moment: both stayed signed in, the token was renewed, and the tab that lost the refresh race used the winner's pair (one 401 from `/auth/refresh`, no logout);
  - Log out in tab 1 cleared both tokens and logged tab 2 out too; registering reader B in the same tab showed no trace of A;
  - Suites after review fixes: backend 374/374, frontend 417/417.
- [x] `reviewer` + `security-review`, then fix findings: temporary refresh failures no longer log out, a refresh finishing after logout no longer restores the session, refresh got its own rate limit, logout revokes a just-rotated replacement and always answers 204, logout no longer lands on `/login?next=<previous reader's page>`. Accepted: an update finishing after logout can refill the cache (§3.4); lockout doesn't revoke refresh tokens (§3.4).
- [x] Move `bugs/logout-keeps-cached-data.md` to Fixed in `bugs/README.md`; `CHANGELOG.md` entry; `SPEC.md` auth section and data model.

### Phase 3 — Frontend resilience and delivery

#### Frontend
- [x] `ErrorBoundary` around `<Outlet />` (reset by path through a `resetKey` prop), around the modal routes, and around `<App />` (§3.8).
- [x] Retry only on 5xx and network errors (§3.9).
- [x] Lazy-load pages with `<Suspense>` (also inside `SectionsLayout`, so the strip and tabs stay put), plus a `vendor` file for the libraries; bundle sizes recorded (§3.10).
- [x] Theme script moved to `public/theme-init.js` with `try/catch`; guard `useTheme.ts` (§3.12).
- [x] Abort signals for book search, tag suggestions and reader search: 7 search-as-you-type queries (§3.13).
- [x] `nginx.conf`: gzip, asset caching, no-cache for `config.js` and `index.html`, security headers. `entrypoint.sh` writes the CSP snippet with the API origin (§3.11).
- [x] Tests:
  - a component that throws shows the fallback, and navigating away recovers;
  - a 404 isn't retried and a 500 is retried once;
  - a lazy page renders after loading (`App.test.tsx`);
  - review additions: a navigation that crashes isn't rendered twice, the "new version" message, `ProtectedRoute` offers a retry when the session couldn't be renewed, a news image that fails shows the placeholder.
- [x] Full suite passes: frontend 422/422 (the slow tests from `bugs/mood-test-times-out-under-load.md` passed in every run this time), backend 375/375, build 0 warnings.

#### Verification & docs
- [x] Built the web image (`docker build`) and ran it with `API_BASE_URL` pointing at a Release API, then checked:
  - response headers (`curl -I`) on `/`, `/config.js` and `/assets/*.js`;
  - every page loads with no CSP errors in the console, in light and dark themes, on desktop and phone width;
  - first load: app entry 84 KB, `vendor` 295 KB (cached across deploys), 393 KB / 123 KB gzipped in all, against 551 KB before;
  - a bad `API_BASE_URL` stops the container with a clear message; a missing asset 404 carries no long-term cache header.
- [x] `reviewer` + `security-review`, then fix findings: a temporary refresh failure at startup no longer sends a signed-in reader to /login (`ProtectedRoute` shows "Try again"); the boundary no longer renders a crashing navigation twice; old tabs after a deploy get a "new version" message; http news images are upgraded and fall back to the placeholder; nginx doesn't cache 404s for a year and sends `Vary`; `Cross-Origin-Opener-Policy` added; `API_BASE_URL` is validated; a request waiting on a refresh during logout fails instead of retrying as the next reader. Accepted: the overlay's fallback placement (§3.8), `'unsafe-inline'` styles (§3.11).
- [x] `CHANGELOG.md` entry; add the out-of-scope hosting items to `ACCOUNTS-AND-HOSTING.md`; add "autosave Writing drafts" to `FUTURE-IDEAS.md`.
