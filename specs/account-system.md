# Feature Spec — Account System

**Status:** 🚧 Phases 1–3 done (2026-10-07), except the parts moved to Roadmap Stage 4 (cookie, in-memory token, 15-minute token). Part of Phase 1 was already built by `specs/app-hardening.md`; see §0. Phases 4–5 not started. **Phase 6 (Goodreads import) moved to `specs/book-import.md`** (2026-10-07; built and done 2026-10-08), which adds StoryGraph and supersedes §2 "Goodreads import", §3.11 and the Phase 6 tasks here.

Builds on the existing auth: ASP.NET Core Identity with `ApplicationUser` (`Argos.Infrastructure/Identity/ApplicationUser.cs`), JWTs issued by `TokenService`, refresh tokens from `RefreshTokenService`, and `AuthController` (`/api/auth/register`, `/login`, `/refresh`, `/logout`, `/me`). On the frontend: `AuthContext`, `api/authToken.ts` (login token and refresh token in `localStorage`) and `api/client.ts` (adds the `Authorization` header; on a 401 it refreshes once and retries). The research behind this spec, including the Goodreads/Letterboxd comparison, is in `ACCOUNTS-AND-HOSTING.md`. Read that first.

## 0. What app-hardening already shipped (read first)

`specs/app-hardening.md` (Phases 1–2, done before this spec was started) built some of this spec's Phase 1, sometimes with different numbers. This table shows what exists and decides each difference, so Phase 1 doesn't rebuild it. **Where this table and the sections below disagree, this table wins.** The sections below were edited to match where it was simple.

| Topic | This spec originally said | What's built (app-hardening) | Decision |
|---|---|---|---|
| Refresh tokens | 30 days, rotated on every use, SHA-256 hashed, 60-second reuse window, revoke all on later reuse | Same. `RefreshToken` entity, `RefreshTokenService` (`IssueAsync` / `RotateAsync` / `RevokeAsync`), daily `RefreshTokenCleanupService` | ✅ Done. Nothing to build. |
| `/refresh` and `/logout` | Take the refresh token from a cookie | Take it in the JSON body (`{ refreshToken }`) | Keep the body for now. Switching to the cookie is **Roadmap Stage 4** (below). |
| Where tokens live | Login token in memory, refresh token in an `httpOnly` cookie | Both in `localStorage` (`argos_token`, `argos_refresh_token`) | **Moves to Roadmap Stage 4.** The cookie needs the site and API on the same domain, which only exists once hosting does. Until then `localStorage` stays. |
| Login token lifetime | 15 minutes | 60 minutes (`Jwt:ExpirationMinutes`) | **Keep 60 until the cookie move, then drop to 15 in the same change.** Renewal is already automatic, so the short lifetime only matters once the cookie makes refresh cheap and safe. |
| Frontend refresh-and-retry | One shared refresh promise on 401, then retry | Done, plus cross-tab handling (a token changed by another tab is reused; a refresh that races a logout is thrown away) | ✅ Done. |
| Lockout | 5 wrong passwords → 15 minutes, 429 | Same, with "Too many failed attempts. Try again in 15 minutes." | ✅ Done, then **changed in Phase 1 (2026-10-07, security review)**: logging in by username made per-account lockout a harassment tool, since usernames are public and 5 wrong tries would lock anyone out. Now 5 wrong passwords block only *that network address* for that account for 15 minutes (`LoginAttemptLimiter`, in memory), and Identity's account-wide lockout is a backstop at **20**. Behind a proxy this depends on `ForwardedHeaders` (Roadmap Stage 4); until then every visitor shares one address, which is no worse than before. Phase 4's wrong 2FA codes must also count toward both. |
| Rate limits | `auth-strict` (10/min) and `auth-light` (30/min) | `auth` (10/min: login, register), `refresh` (30/min: refresh, logout), `search` (30/min), `public` (60/min) in `RateLimitOptions` | **Use the existing policies; don't add new ones.** New strict endpoints (forgot/reset password, `login/2fa`, Google) use `auth`. `username-available` uses `public`. |
| Username rules | 3–20 characters, letters/digits/`_` | 3–30 characters, `^[A-Za-z0-9_]+$`, checked in `AuthController` at registration | **Keep 3–30.** It's built and tested, test accounts use up to 30 characters, and a shorter limit gains little. Phase 1 adds only the reserved list. |
| Identity's `AllowedUserNameCharacters` | Narrow it to match the rule | Deliberately **not** narrowed (app-hardening §3.2, changed in review): Identity re-checks it on every save, so an older account such as `jane.doe` couldn't save anything | **Don't narrow it.** Check in `UsernameRules` only, wherever a username is set. |
| Password maximum | 128 | 128 (`AuthController.MaxPasswordLength`) | ✅ Done. |
| Password minimum, common-password list | 12 characters, no character-type rules, top-10k list | Not built: still Identity's defaults (6+, upper, lower, digit, symbol) | Still to do (Phase 1). |
| Reserved usernames, live "username taken" check, log in with email *or* username, show/hide password | Planned | Not built | Still to do (Phase 1). |
| Shared test helper for sign-ups | Replace ~21 copied `RegisterAsync` helpers | `TestUsernames.FromEmail` keeps names ≤30 characters, but the 21 copied helpers are still there | Still to do, now only for the 12-character password change. |
| Sessions list data | `RefreshTokens` with `SessionId`, `LastUsedAt`, `UserAgent` | Table has `Id`, `UserId`, `TokenHash`, `CreatedAt`, `ExpiresAt`, `RevokedAt`, `ReplacedByTokenId` only | **Add the three columns in Phase 3**, with the sessions list that needs them. |
| "Log out everywhere" | `RevokeAllForUserAsync` | Revoke-all happens inside rotation (reuse detection) but has no public method | Add the public method in **Phase 2**: password reset must call it (app-hardening §3.4 says so). |

## 1. Problem

Sign up and login work, but nothing around them does. (Written 2026-10-02. Items marked *fixed* were solved by app-hardening since; see §0.)

- ~~**Everyone is logged out every 60 minutes.** The JWT expires after an hour and nothing renews it.~~ *Fixed: refresh tokens.*
- **A forgotten password means a lost account.** There's no reset, and the app can't send email at all.
- **Emails are never checked.** Anyone can sign up with someone else's address, and spam accounts cost nothing.
- **Display name and bio can't be set.** The feed, comments and profiles show them, but no endpoint writes them.
- **You can't change your username, email or password**, and you can't delete your account or download your data.
- **Passwords are badly checked.** The Identity defaults require 6+ characters plus uppercase, digit and symbol. That's annoying to type and still weak: `Password1!` passes.
- ~~**Unlimited password guessing.** No lockout, no rate limit.~~ *Fixed: lockout and rate limits.*
- **Usernames are loosely checked.** ~~`@`, `+` and `.` are allowed, there's no length limit~~ *(fixed: 3–30 letters, digits, `_`)*, and there are no reserved names, so someone could register `me`, which clashes with `/api/users/me/...`.
- **No easy way in.** No "Continue with Google", no 2FA, and no way to bring your Goodreads history with you, which is the biggest reason a reader wouldn't switch.

## 2. Clarifying decisions made (via questions to the user)

- **Everything is in scope**, in six phases (§5): the basics, email, the settings page, 2FA + Google sign-in, export + delete account, and the Goodreads import.
- **Stay logged in with a refresh token for 30 days.** A short login token (15 minutes) is renewed quietly by a cookie that lasts 30 days from your last visit. This gives a sessions list and "log out everywhere". *(§0: the refresh token is built but kept in `localStorage` with a 60-minute login token until Roadmap Stage 4.)*
- **Email confirmation is required before posting anything others can read.** Blocked until confirmed: reviews with text, comments, posts, writings, club messages and suggestions, creating clubs, making lists public, importing from Goodreads. Allowed: browsing, logging books, star ratings, private lists, following people, joining clubs.
- **Usernames can change once a year.**
- **Account deletion: the person chooses** between "Remove everything" and "Keep my comments and club messages as *Deleted user*". Reviews, lists, writings, posts and logs are always removed. The account is hidden at once and fully erased after 30 days; logging in before then can cancel the deletion.
- **Passwords: 12 characters minimum**, no uppercase/digit/symbol rules, common passwords rejected.
- **2FA recovery uses backup codes.** 10 single-use codes are shown once when 2FA is turned on. A password reset by email does **not** turn 2FA off.
- **Goodreads custom shelves become private Argos lists.** `read` / `currently-reading` / `to-read` become log statuses.
- **"Continue with Google" never takes over an existing account.** If an Argos account already has that email, sign-in says to log in with the password and connect Google from Settings.

**Decisions made while writing the spec (not asked; change any of these before starting):**

*Sessions* (the refresh-token parts are built; the cookie and in-memory parts are Roadmap Stage 4, see §0)
- **The login token lives in memory, not `localStorage`.** On page load, the app calls `/api/auth/refresh` to get a fresh one from the cookie. A script injected into the page can't read an `httpOnly` cookie, and can no longer find a token in `localStorage`.
- **The refresh token rotates on every use.** Each refresh returns a new one and retires the old one. If a retired token is used again, someone may have copied it, so the whole session is ended. Exception: **reuse within 60 seconds is allowed** without ending the session, because two open tabs refreshing at the same moment would otherwise log you out.
- **Refresh tokens are stored hashed** (SHA-256), like passwords. A leaked database row can't be used as a login.
- **The cookie is `argos_refresh`**: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/auth`. That's why the site and API must share a domain (`argos.app` / `api.argos.app`, see `ACCOUNTS-AND-HOSTING.md` §2.1). `localhost:5173` and `localhost:8080` already count as the same site.
- **No IP addresses are stored.** The sessions list shows the browser and device (from the User-Agent), when the session started and when it was last used.
- **Changing or resetting the password ends every other session.** An already-issued login token stays valid for up to 15 minutes; we accept that rather than checking the database on every request.

*Passwords, lockout, usernames*
- **Passwords: 12–128 characters, spaces allowed.** *(Changed 2026-10-07: the bundled list is the top million filtered to 12+ characters, and the Have I Been Pwned check was moved into Phase 1; see the Phase 1 tasks.)* Rejected if they're on a bundled list of the 10,000 most common passwords, or if they contain the username or the part of the email before the `@`. The common-password list ships with the API (no outside service); the Have I Been Pwned check stays a future idea.
- **Existing passwords keep working.** The new rules apply when a password is set or changed.
- **Lockout: 5 wrong passwords (or 2FA codes) lock the account for 15 minutes.** Plus a per-IP rate limit (§3.3) on login, register, forgot password, 2FA and username checks. *(Lockout and the login/register limits are built, §0.)*
- **Usernames: 3–30 characters, letters, digits and `_` only** *(was 3–20; changed 2026-10-06 to match what's built, §0)*. Case is kept for display, but uniqueness ignores case (Identity already does this). A reserved list blocks names like `me`, `admin`, `settings`, `api`, `login`, `deleted`, `argos`, `support`. **Existing usernames are left alone**, even ones that break the new rules.
- **Log in with email or username**: one field; if it contains `@` it's tried as an email first, then as a username (accounts from before the username rules may have `@` in their name).
- **No "confirm password" field** on sign up. A show/hide toggle on the password field does the same job with less typing.
- **Display name stays optional** and isn't asked at sign up. Screens show the username when it's empty, as they do today.

*Email*
- **One sender for every environment: SMTP via MailKit.** In development it points at Mailpit (`localhost:1025`). In production it points at Resend's SMTP server. Only settings change, not code.
- **Emails go through a queue** (a background service), so a slow or failing mail server never fails a sign-up. Failed sends are retried 3 times, then logged.
- **Emails are plain HTML built in code**, with a plain-text version. No template engine.
- **Confirmation links last 3 days; password-reset links last 1 hour.** A reset link stops working once used, because a reset changes the account's security stamp, which invalidates older tokens.
- **Forgot password also works for unconfirmed emails**, and a successful reset confirms the email, since clicking the link proves you own the inbox. Otherwise someone who never confirmed and forgot their password would be stuck.
- **"Resend confirmation email" is limited to once a minute.**
- **All existing accounts are marked as confirmed** by the migration. They're all dev/test accounts.

*Settings*
- **Display name: up to 50 characters. Bio: up to 500 characters**, plain text.
- **The first username change is allowed right away**; after that, once every 365 days. The old name is held for 30 days, and during that time its profile URL opens the new profile.
- **Changing email needs the password.** The email only changes when the link sent to the new address is clicked; until then, Settings shows "Waiting for confirmation of new@example.com". The old address gets a "your email was changed" notice.
- **"Review privacy default" moves from the profile page to Settings → Privacy & data.**

*2FA and Google*
- **2FA uses ASP.NET Identity's built-in authenticator support.** The QR code is drawn in the browser (npm `qrcode`) from the standard `otpauth://` link. Backup codes can be downloaded as a `.txt` file. When 3 or fewer are left, Settings shows a warning.
- **A 2FA login takes two steps.** `/api/auth/login` answers "code needed" with a 5-minute challenge token, and `/api/auth/login/2fa` takes that token plus a code or a backup code.
- **Turning 2FA off needs your password and a current code.** New backup codes need your password.
- **Google sign-in uses a Google ID token.** The browser shows Google's own button (Google Identity Services) and sends us the signed token Google gives it. The API checks it with the `Google.Apis.Auth` package. There are no server-side redirects, which fits a single-page app. The Google client ID is free (a Google Cloud project). **If no client ID is configured, the button is hidden.**
- **Google sign-in still asks for the 2FA code** if 2FA is on.
- **A new Google account picks a username first** ("Choose your username"). Its email counts as confirmed, because Google has already checked it.
- **Accounts created with Google have no password.** They can set one in Settings. Google can only be disconnected once a password exists. Wherever a sensitive action asks for your password (delete account, change email, turn off 2FA), a password-less account confirms with Google again instead.

*Export and delete*
- **Export is a `.zip` of CSV files, built on request** (fine at this size). `logs.csv` uses Goodreads' column names, so the file also works in other reading apps; Argos-only fields go in extra columns at the end. Rate limit: 1 export per 10 minutes.
- **The 30-day "hidden" period uses EF Core global query filters.** Every table with a `UserId` gets a filter that skips rows whose owner has `DeactivatedAt` set. **This is the riskiest part of the spec.** It touches every query, so Phase 5 starts by checking that the filters work with the existing queries (the feed's `UNION ALL` especially) and don't slow them down. If they don't work, the fallback is to hide only the profile, search and follower lists, and shorten the grace period to 7 days.
- **"Deleted user" is one built-in account** (username `deleted`, can't log in). Comments and club messages someone chose to keep are moved to it. Their likes, votes, follows and memberships are always removed.
- **Clubs pass to a new Admin.** If the deleted person is a club's Admin, the club goes to the longest-serving Moderator, or else the longest-serving Member. A club with no other members is deleted.
- **Lists are deleted even if they have collaborators.** The delete screen warns about this and suggests asking a collaborator to copy the list first.
- **Logging in during the 30 days shows "Your account will be deleted on {date}"** with a "Cancel deletion" button. An email confirms the request and gives the date.
- **The username becomes available again** once the account is erased.

*Goodreads import*
- **The import runs in the background.** The CSV is uploaded (10 MB max), saved as one import job with one row per book, and worked through about one Open Library request per second. The page shows a progress bar by polling every 2 seconds.
- **Matching order:** ISBN-13, then ISBN-10 (Open Library `/isbn/{isbn}.json` → work ID), then a title + author search. The search only counts as a match if the titles agree after normalising: lower case, punctuation removed, subtitles and "(Series #1)" dropped. Anything else is "Not found", and the results page offers a "Find it" search for each one.
- **Status mapping:** `read` → Read, `currently-reading` → Currently reading, `to-read` → Want to read. A custom exclusive shelf named like `dnf` / `did-not-finish` / `abandoned` → Did not finish; any other custom exclusive shelf → Want to read, plus a list with that name.
- **Field mapping:** My Rating 1–5 → rating (0 means no rating; ratings on non-Read/DNF logs are dropped, per the reviews spec). My Review → review text (`<br/>` → line breaks, other HTML stripped). Spoiler → `HasSpoilers`. Date Read → `FinishedAt`. Date Added → `CreatedAt`. The review's `ReviewedAt` is Date Read, or Date Added if empty. Number of Pages → `TotalPages`. Imported reviews use your review-privacy default. Private Notes and Read Count are ignored (Goodreads only keeps the last read date, so rereads can't be rebuilt).
- **Books already on your shelves are skipped, never overwritten**, so importing the same file twice is safe.
- **Imports don't flood followers' feeds.** The feed orders reviews by `ReviewedAt`, and imported reviews carry their original (past) dates, so they sort far down. No extra flag is needed.
- **An import can be undone for 7 days.** "Undo this import" deletes the logs and lists it created. The job remembers what it created.
- **Importing requires a confirmed email**, because it can publish reviews.

## 3. Design

### 3.1 Data model changes

`ApplicationUser` gains:
| Field | Type | Purpose |
|---|---|---|
| `UsernameChangedAt` | `DateTime?` | Once-a-year rule; null = never changed |
| `PendingEmail` | `string?` | Shown while a change-email link is unconfirmed |
| `DeactivatedAt` | `DateTime?` | Set when deletion is requested; drives the query filters |
| `DeletionKeepsContributions` | `bool` | The person's choice, applied at erasure |

(`EmailConfirmed`, `LockoutEnd`, `AccessFailedCount`, `TwoFactorEnabled`, the authenticator key, recovery codes and external logins already exist in Identity's tables.)

New tables:
- **`RefreshTokens`**: *already exists* (app-hardening) with `Id`, `UserId`, `TokenHash` (unique), `CreatedAt`, `ExpiresAt`, `RevokedAt?`, `ReplacedByTokenId?`. **Phase 3 adds** `SessionId` (shared by every token in one chain of rotations; a rotated token copies it), `SessionStartedAt` and `UserAgent`, plus an index on `(UserId, SessionId)`. Existing rows each get their own new `SessionId`. *(Built 2026-10-07 without `LastUsedAt`: every renewal makes a new token, so the live token's `CreatedAt` already says when the session was last active.)*
- **`UsernameHistory`**: `Id`, `UserId`, `OldUsername`, `OldNormalizedUsername` (indexed), `ChangedAt`. A name is held while `ChangedAt` is under 30 days old.
- **`ImportJobs`**: `Id`, `UserId`, `Source` (`Goodreads`), `Status` (`Queued` / `Running` / `Completed` / `Failed` / `Undone`), `TotalRows`, `ProcessedRows`, `CreatedAt`, `FinishedAt?`.
- **`ImportRows`**: `Id`, `ImportJobId`, `RowNumber`, `Title`, `Author`, `Isbn13?`, `Isbn10?`, raw mapped fields (status, rating, review, dates, pages, shelves), `Result` (`Pending` / `Imported` / `AlreadyOnShelf` / `NotFound` / `Error`), `Message?`, `CreatedLogId?`.
- **`ImportCreatedLists`**: `ImportJobId`, `BookListId`, used by undo.

Seed: the `deleted` system user. Migration: set `EmailConfirmed = true` for every existing user.

### 3.2 Phase 1: sessions

> **Moved (2026-10-06, §0).** Refresh, rotation, logout and the frontend refresh-and-retry are built, with the tokens in the request body and `localStorage`. What's left here (the `argos_refresh` cookie, the in-memory login token, 15-minute login tokens, `AllowCredentials()`, removing the old `localStorage` keys) is done in **Roadmap Stage 4**, once the site and API share a domain. The design below is kept for that work.

```
POST /api/auth/register   → { token }  + Set-Cookie argos_refresh
POST /api/auth/login      → { token } | { requiresTwoFactor: true, challengeToken }  + cookie
POST /api/auth/refresh    (cookie only) → { token } + rotated cookie   | 401
POST /api/auth/logout     (cookie only) → revokes this session, clears cookie
```

- Login token: 15 minutes (`Jwt:ExpirationMinutes` default changes from 60 to 15). Session: 30 days, extended on every refresh.
- `/refresh` and `/logout` accept only the cookie. CORS gets `AllowCredentials()` for the frontend origin. `SameSite=Strict` blocks cross-site requests from sending the cookie.
- **Frontend:**
  - `authToken.ts` keeps the token in a module variable.
  - `client.ts` sends `credentials: 'include'`. On a 401 it calls `/auth/refresh` **once**, with a single shared refresh promise so parallel requests don't each refresh, then retries the request. Only if the refresh also fails does it log you out.
  - `AuthContext` calls `/auth/refresh` on startup before deciding whether you're logged in, with a short loading state.
  - The old `argos_token` key is removed from `localStorage` on startup.

### 3.3 Phase 1: passwords, lockout, rate limits, usernames

- `Program.cs` sets `PasswordOptions`: `RequiredLength = 12`, `RequireDigit/Lowercase/Uppercase/NonAlphanumeric = false`. It also adds `CommonPasswordValidator : IPasswordValidator<ApplicationUser>` (the bundled `common-passwords.txt` embedded resource, loaded once into a `HashSet`, compared case-insensitively, plus the username/email check) and a max-length check (128).
- ✅ *Built (app-hardening).* `LockoutOptions`: `MaxFailedAccessAttempts = 5`, `DefaultLockoutTimeSpan = 15 min`, `AllowedForNewUsers = true`. Login uses `SignInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true)`. A locked account gets **429** "Too many failed attempts. Try again in 15 minutes."
- Rate limiting: *the policies exist* in `RateLimitOptions` (fixed window per IP). New endpoints reuse them: `auth` (10/min) on login/2fa, forgot-password, reset-password and Google, as it already is on login and register; `public` (60/min) on username-available. Refresh already has `refresh` (30/min).
- `UsernameRules` (one class, used by register, Google sign-up and username change): moves the existing check out of `AuthController` (`^[A-Za-z0-9_]+$`, 3–30 characters) and adds the reserved list and, from Phase 3, the `UsernameHistory` hold. Identity's `AllowedUserNameCharacters` is **not** narrowed (§0).
- `GET /api/auth/username-available?username=` → `{ available, reason? }` (`reason`: `taken` / `reserved` / `invalid`).
- Login request: `{ emailOrUsername, password }`.
- **Frontend:**
  - `passwordPolicy.ts` checks only length; the hint becomes "At least 12 characters. A few random words work well." A server rejection for a common password shows inline.
  - The register form checks the username while typing (debounced 400 ms).
  - The login field label becomes "Email or username".
  - Both password fields get a show/hide toggle.

### 3.4 Phase 2: email sending

- `Argos.Infrastructure/Email/`: `IEmailSender` (`SendAsync(EmailMessage)`), `SmtpEmailSender` (MailKit), `EmailOptions` (`Host`, `Port`, `UseSsl`, `Username`, `Password`, `FromAddress`, `FromName`).
- `Argos.Api/Services/EmailQueue` (a `Channel<EmailMessage>`) + `EmailQueueService : BackgroundService` (retries 3× with backoff, then logs the error).
- `AccountEmails` builds each email's subject, HTML and text: confirm email, reset password, email changed (to the old address), deletion scheduled, 2FA turned on/off.
- `App:FrontendBaseUrl` setting for building links.
- `docker-compose.yml` gains a `mailpit` service (ports 1025 and 8025). `appsettings.Development.json` points SMTP at it.

### 3.5 Phase 2: confirmation and password reset

```
POST /api/auth/confirm-email          { userId, token }  → 204 | 400
POST /api/auth/resend-confirmation    (logged in)        → 204 (once a minute)
POST /api/auth/forgot-password        { email }          → 204 always
POST /api/auth/reset-password         { userId, token, newPassword } → 204 | 400
```

- `CurrentUserResponse` gains `emailConfirmed`, `pendingEmail`, `twoFactorEnabled`, `hasPassword`, `hasGoogle`, `usernameChangeAvailableAt`.
- **The confirmation requirement** is a `[RequireConfirmedEmail]` filter that returns **403** with problem `type: "email_not_confirmed"`. Applied to:
  - `POST /api/posts`; `POST`/`PUT /api/writings`
  - `POST`/`PUT /api/annotation-comments`; checkpoint comments `POST`/`PUT`
  - `POST /api/clubs`; `POST /api/clubs/{id}/suggestions`
  - `POST /api/imports/goodreads`

  Two checks live in services instead, because they depend on the request's content: **logs** (blocked only when `ReviewText` is non-empty) and **lists** (blocked only when creating or switching to `Public`).
- **Frontend:**
  - New pages `/confirm-email` and `/reset-password` (both read `userId`/`token` from the query string), and `/forgot-password`.
  - A "Forgot password?" link on the login page.
  - A dismissible-per-session banner, "Confirm your email to post reviews and comments. [Resend email]", while `emailConfirmed` is false.
  - `client.ts` recognises `email_not_confirmed` and opens one shared dialog explaining it, with a resend button.

### 3.6 Phase 3: settings page

```
PUT  /api/users/me/profile        { displayName?, bio? }
PUT  /api/users/me/username       { username, password }
POST /api/users/me/email          { newEmail, password }       → sends link; sets PendingEmail
POST /api/auth/confirm-email-change { userId, newEmail, token }
PUT  /api/users/me/password       { currentPassword?, newPassword }  (current is optional only when hasPassword = false)
GET  /api/auth/sessions           → [{ sessionId, browser, operatingSystem, startedAt, lastActiveAt, isCurrent }]
DELETE /api/users/me/email/pending  → cancels a waiting email change (added while building)
DELETE /api/auth/sessions/{id}    ;  POST /api/auth/sessions/revoke-others
```

- `GET /api/users/{username}` also matches a name held in `UsernameHistory` and returns that person's profile. The frontend sees the username differs and replaces the URL.
- The password change keeps the current session and revokes the others.
- **Frontend:** `/settings` (protected), with tabs **Profile** (avatar picker, display name, bio), **Account** (email, username, password), **Security** (2FA and Google from Phase 4, sessions list), and **Privacy & data** (review privacy default, then export/import/delete from Phases 5–6). It's linked from the sidebar's account menu, and the review-privacy select is removed from the profile page.

### 3.7 Phase 4: two-step login (2FA)

```
POST /api/auth/2fa/setup           → { sharedKey, otpauthUri }       (resets the authenticator key)
POST /api/auth/2fa/enable          { code } → { recoveryCodes[10] }
POST /api/auth/2fa/disable         { password, code }
POST /api/auth/2fa/recovery-codes  { password } → { recoveryCodes[10] }
POST /api/auth/login/2fa           { challengeToken, code? , recoveryCode? } → { token } + cookie
```

- The challenge token is a JWT with a `purpose: "2fa"` claim, 5-minute lifetime, signed with the same key, and rejected by normal `[Authorize]` (the purpose claim is checked). Wrong codes count toward lockout.
- **Check during implementation:** how Identity stores recovery codes. If it stores them in plain text, override storage to hash them.
- Emails go out on enable and disable.
- **Frontend:**
  - Security tab, enabling: QR code + manual key → enter code → show the 10 backup codes with Download and "I've saved them".
  - Disabling asks for password + code.
  - Remaining backup codes are shown, with a warning at 3 or fewer.
  - The login page gets a second step, "Enter the 6-digit code" with "Use a backup code instead".

### 3.8 Phase 4: Continue with Google

```
GET  /api/auth/providers                → { google: { clientId } | null }
POST /api/auth/google                   { idToken } → { token } | { requiresTwoFactor, challengeToken }
                                                    | { needsUsername: true, signupToken } | 409
POST /api/auth/google/complete          { signupToken, username } → { token } + cookie
POST /api/users/me/logins/google        { idToken }     (connect, from Settings)
DELETE /api/users/me/logins/google      (only if hasPassword)
```

- Lookup is by Google's account ID (`sub`) in `AspNetUserLogins`, never by email. A **409** means "An Argos account already uses this email. Log in with your password, then connect Google in Settings."
- `signupToken`: a 15-minute JWT carrying `sub`, `email` and `purpose: "google-signup"`.
- Sensitive actions take `{ password }` **or** `{ googleIdToken }` (a helper, `ReauthenticateAsync`).
- **Frontend:**
  - A `GoogleButton` component that loads `accounts.google.com/gsi/client` only when `/auth/providers` returns a client ID.
  - Shown on the login and register pages.
  - A `/welcome/username` page for new Google accounts.
  - Connect/disconnect in the Security tab, plus "Set a password" for password-less accounts.

### 3.9 Phase 5: export

`GET /api/users/me/export` → `argos-export-{username}-{date}.zip` containing:
- `profile.csv`
- `logs.csv`: Goodreads columns `Title, Author, ISBN13, My Rating, Number of Pages, Date Read, Date Added, Exclusive Shelf, My Review, Spoiler`, then Argos columns: Open Library ID, status, visibility, moods, pace, drive, content warnings, started, reread.
- `lists.csv` (one row per list item, with list name/visibility/description)
- `writings.csv`, `posts.csv`, `comments.csv`, `club-messages.csv`, `follows.csv`, `favourites.csv`

Built with `System.IO.Compression` into the response stream. **Frontend:** a "Download my data" button in Privacy & data.

### 3.10 Phase 5: delete account

```
POST /api/users/me/delete   { password | googleIdToken, twoFactorCode?, keepContributions }
POST /api/auth/cancel-deletion   (allowed while deactivated)
```

- **Request:** sets `DeactivatedAt` and `DeletionKeepsContributions`, revokes every session, emails the date.
- **While deactivated:**
  - Every user-owned entity is hidden by global query filters, using a subquery on `AspNetUsers.DeactivatedAt`; the user's own requests are unaffected because they can't log in normally.
  - The profile returns 404, and the person is left out of search and follower counts.
- **Login while deactivated:** answers `{ deactivated: true, deletionDate }` with a login token that's only good for `cancel-deletion`.
- **Erasure:** `AccountErasureService : BackgroundService` runs daily on users deactivated more than 30 days ago:
  1. Reassigns kept contributions (comments, checkpoint comments, annotation comments) to the `deleted` user, or deletes them.
  2. Hands Admin over in clubs (or deletes empty clubs).
  3. Deletes everything else.
  4. Deletes the user.
- **Check during implementation:** the FKs marked `DeleteBehavior.Restrict` in `ArgosDbContext` need explicit handling before the user row can go.
- **Testable without waiting 30 days:** the grace period and how often the erasure service runs are settings (`Accounts:DeletionGraceDays` / `Accounts:ErasureIntervalMinutes`; development uses about 2 minutes / 1 minute). Automated tests use a fake clock (`TimeProvider`) instead.
- **Frontend:**
  - "Delete account" in Privacy & data opens a screen listing what goes and what can stay, the "Keep my comments and club messages as Deleted user" choice, warnings about clubs you run and shared lists, and password (+ 2FA code) confirmation.
  - Login shows the "scheduled for deletion" screen with "Cancel deletion".
  - Kept contributions render "Deleted user" with a neutral avatar and no profile link.

### 3.11 Phase 6: Goodreads import

> **Superseded by `specs/book-import.md` (2026-10-07).** Kept for history; follow that spec.

```
POST /api/imports/goodreads   (multipart file, ≤10 MB, confirmed email) → { jobId }
GET  /api/imports/{id}        → job progress + counts
GET  /api/imports/{id}/rows?result=NotFound
POST /api/imports/{id}/rows/{rowId}/resolve   { openLibraryId }
POST /api/imports/{id}/undo   (within 7 days)
GET  /api/imports             → your past imports
```

- `GoodreadsCsvParser` (CsvHelper): handles Goodreads' `="0123456789"` ISBN quirk, `yyyy/MM/dd` dates, and the shelf columns. Rows are validated and stored at upload, so a broken file fails fast with a 400.
- `ImportProcessingService : BackgroundService` takes queued jobs one at a time and processes rows at about 1 per second. It reuses `IOpenLibraryClient`, which gains `FindWorkIdByIsbnAsync`, and the book cache, and writes logs through the existing log service, so all the review rules still apply.
- A job interrupted by an API restart picks up from its first `Pending` row.
- **Frontend:**
  - Privacy & data → "Import from Goodreads", with steps for getting the export file (My Books → Import and export → Export Library).
  - Upload → progress bar → results ("312 imported, 14 already on your shelves, 9 not found").
  - A Not found table with "Find it" (the existing book search in a dialog).
  - "Undo this import".

## 4. Explicitly out of scope

- ~~**Have I Been Pwned breach check.**~~ *Moved into Phase 1 (2026-10-07).*
- **SMS or email 2FA**, and sign-in with Apple, Facebook, Amazon or others. *(Passkeys moved into Phase 4, 2026-10-07.)*
- **Profile privacy** (public / signed-in only / followers only). Stays in `FUTURE-IDEAS.md` with account-wide privacy.
- ~~**Imports from StoryGraph**~~ *(added in `specs/book-import.md`, 2026-10-07)*. Letterboxd-style re-importing of an Argos export stays out.
- **CAPTCHA** on sign up. Rate limits and email confirmation come first; revisit if spam appears.
- **Admin tools** (banning, viewing users, manual unlock).
- **Keeping deleted content** for export (Letterboxd keeps it 30 days; Argos deletes for real).
- **Notification emails** (new follower, comment replies). Only account emails are sent.
- **Going live itself** (domain, Resend account, hosting). That's `ACCOUNTS-AND-HOSTING.md` Part 2 and its own task when you deploy.

## 5. Tasks

Phases are built and verified in order; each one is usable on its own.

### Phase 1 — Stay logged in, passwords, lockout, usernames

Items marked *(app-hardening)* were built there; items marked *(Stage 4)* wait for hosting (§0).

#### Backend
- [x] `RefreshTokens` table + migration; `RefreshTokenService` (issue, rotate with the 60-second reuse window, revoke, hash with SHA-256) *(app-hardening)*
- [x] New `/refresh` and `/logout` *(app-hardening, body not cookie)*
- [ ] *(Stage 4)* `/register` and `/login` set the `argos_refresh` cookie; `/refresh` and `/logout` read it; `Jwt:ExpirationMinutes` → 15; CORS `AllowCredentials()`
- [x] Password options (12 minimum, no character-type rules) + `CommonPasswordValidator` (username/email check). The 128 max is already built. *Built with the top **1 million** list filtered to 12+ characters (46k entries) instead of the top 10k: only ~30 of the top 10k are 12+ characters, so the 12-character minimum already stops the rest.*
- [x] Lockout options; login via `CheckPasswordSignInAsync(lockoutOnFailure: true)`; 429 when locked *(app-hardening)*
- [x] Rate-limit policies *(app-hardening: `auth`, `refresh`, `search`, `public`; reuse them)*
- [x] `UsernameRules` (move the existing 3–30 regex check out of `AuthController`, add the reserved list) + `GET /api/auth/username-available` on the `public` rate limit. Don't narrow `AllowedUserNameCharacters`.
- [x] Login by email or username (`emailOrUsername`)
- [x] ~~Replace the ~21 copy-pasted `RegisterAsync` test helpers~~ *Not needed: they already send `P@ssw0rd123!`, which is 12 characters and not on the list. Skipped 2026-10-07.*
- [x] Tests: refresh rotation, reuse inside/outside 60 s, logout, expiry, lockout after 5 *(app-hardening)*
- [x] Tests: common password rejected, username rules + reserved names, username-available answers, login by username
- [x] *(Added 2026-10-07, security review)* Lockout counted per account **and** network address (`LoginAttemptLimiter`, 5 per address), with Identity's account-wide lockout raised to 20 as a backstop (§0)
- [x] *(Added 2026-10-07)* **Breached-password check**: `PwnedPasswordsClient` asks Have I Been Pwned's range API, sending only the first 5 characters of the password's SHA-1 hash (k-anonymity, with padding). Runs after the local checks when a password is set; 3-second timeout; if the service is down the password is let through. Error `identity.PasswordBreached`. Tests use `FakePwnedPasswordsClient`, never the real service.
#### Frontend
- [ ] *(Stage 4)* In-memory token; startup refresh in `AuthContext`; delete the old `localStorage` keys; `credentials: 'include'`
- [x] `client.ts`: single shared refresh-and-retry on 401 *(app-hardening, plus cross-tab handling)*
- [x] `passwordPolicy.ts` hint/validation → length only (12–128); show/hide toggle; "Email or username" field
- [x] Live username availability on register
- [x] Tests: refresh-and-retry (parallel 401s refresh once) *(app-hardening)*
- [x] Tests: password hint, show/hide, login by username, live username check

### Phase 2 — Email, confirmation, forgot password

#### Backend
- [x] `IEmailSender` / `SmtpEmailSender` (MailKit) / `EmailOptions`; `EmailQueue` + `EmailQueueService`; `AccountEmails`. *Emails are written in the reader's `PreferredLanguage` (all 5 site languages, specs/languages.md) and say **Toffee**, the name readers see.*
- [x] `mailpit` in `docker-compose.yml`; dev SMTP settings; `App:FrontendBaseUrl` (checked at startup)
- [x] Token lifespans (confirm 3 days, reset 1 hour as a separate provider, `PasswordResetTokenProvider`)
- [x] Public `RefreshTokenService.RevokeAllForUserAsync` (revoke-all exists only inside rotation today, §0)
- [x] Confirm / resend / forgot / reset endpoints; reset also confirms the email; reset revokes all sessions. *Reset also lifts any lockout. Forgot-password, like resend, sends at most one email per account per minute (`EmailCooldown`), so nobody can flood an inbox from many addresses.*
- [x] Register sends the confirmation email; migration marks existing users confirmed
- [x] `[RequireConfirmedEmail]` on the endpoints in §3.5 + the checks for reviews with text and public lists. *There's no `/api/posts`: short notes are writings, so the writings gate covers them; checkpoint comment edits are `PUT /api/comments/{id}`. The review-text and public-list checks are in `LogsController` / `BookListsController` (via `IEmailConfirmationStatus`), not the services, which don't know about accounts. The filter runs before model validation, so an unconfirmed reader is told to confirm rather than about a form field.*
- [x] `CurrentUserResponse` new fields: `emailConfirmed`, `twoFactorEnabled`, `hasPassword`. *`pendingEmail`, `usernameChangeAvailableAt` (Phase 3) and `hasGoogle` (Phase 4) wait for the data they report.*
- [x] *(Added 2026-10-07)* **"New login" email**. *Decided at the start of the phase: each browser keeps a random id (`argos_device_id` in `localStorage`, kept across logouts) and sends it with login and sign-up; `KnownDevices` stores its SHA-256 hash with the User-Agent. A login with an id the account hasn't seen emails the owner, naming the browser and system from a fixed list ("Chrome on Windows"), with a button to the forgot-password page. Not sent when the account has no known browsers yet (every account from before this, on its first login) or its email isn't confirmed. A login with no id (a script) counts as new. A cookie was ruled out: the site and API aren't on one domain until Stage 4.*
- [x] Tests: each gated endpoint 403 → OK after confirming; forgot-password gives the same answer for unknown emails; reset link single use and expiry; emails land in a fake sender (`AccountEmailTests`, `AccountEmailsTests`). *Other test classes treat every account as confirmed (`ApiFactory`); `StrictEmailApiFactory` turns that off.*
#### Frontend
- [x] `/confirm-email`, `/forgot-password`, `/reset-password` pages; "Forgot password?" link. *The token is removed from the address bar once read (`useEmailLink`). A successful reset also ends the session in this browser.*
- [x] Unconfirmed banner with resend; shared `email_not_confirmed` dialog
- [x] Tests: banner, dialog on 403, reset form
#### Review pass (2026-10-07)
- [x] Code review + security review. Fixed:
  - **Emailed links survived nothing:** the keys that sign links lived inside the container, so every redeploy broke all unused links. They're now stored in the database (`DataProtectionKeys` table).
  - **Reset now lifts every login block**, including the per-address `LoginAttemptLimiter` ones, not only Identity's.
  - **Remembering the browser or queueing an email can no longer fail a sign-up or login.** Errors are logged instead.
  - **Progress notes are gated too.** They're free text anyone can read on profiles and in feeds, so an unconfirmed spam account could have used them. That's the rule in §2: "anything others can read".
  - **A public list's details can be edited** by its owner after their email becomes unconfirmed. Only *switching* to Public needs a confirmed email.
  - **At most 5 emails of each kind per account per hour**, on top of 1 a minute.
  - **The token is after `#` in links** (`/reset-password#userId=…&token=…`). Browsers never send that part to a server, so it stays out of hosting logs.
  - **Stricter production settings:** links must be HTTPS outside localhost; `Email:Host` is required outside Development; STARTTLS is required whenever an SMTP password is sent.
  - **Send failures** log the error type, not the message, which usually repeats the address.
  - Left open: an overall daily email budget (`bugs/email-sending-has-no-overall-budget.md`).

### Phase 3 — Settings page

#### Backend
- [x] `UsernameChangedAt`, `PendingEmail` + `UsernameHistory` (migration `AddAccountSettings`)
- [x] `RefreshTokens` gains `SessionId`, `SessionStartedAt`, `UserAgent` (same migration); rotation copies them (§3.1). *The login token carries the session as a `sid` claim, which is how "this browser" and "keep this session" are known.*
- [x] `PUT /me/profile`, `PUT /me/username` (yearly rule, 30-day hold), change-email + confirm, `PUT /me/password`. *Profile needs a confirmed email (others read display names and bios). Display names drop line breaks and invisible characters. Wrong passwords in settings are limited per session (5, then 15 minutes), not counted toward the account lockout, so a stolen session can't lock the owner out of login. A confirm link only works for the change still waiting; cancelling or asking for another address ends it. The change-email message greets by username, since it goes to an unproven address.*
- [x] Profile lookup by held old username (`GET /api/users/{username}` only; other username routes such as compare still 404 for an old name: `bugs/held-username-only-on-profile.md`)
- [x] Sessions list / revoke one / revoke others
- [x] Tests: username yearly rule, held name can't be registered and redirects, email change only applies after the link, password change ends other sessions (`AccountSettingsTests`), plus rotation keeping the session and a logout landing mid-rotation (`RefreshTokenServiceTests`)
#### Frontend
- [x] `/settings` with Profile / Account / Security / Privacy & data tabs (`?tab=` in the address); sidebar link
- [x] Profile edit (display name, bio, avatar picker; the profile page keeps its own avatar button too)
- [x] Change username (shows the next allowed date), email (pending state with cancel), password
- [x] Sessions list; review-privacy and discoverable settings moved here from the profile page, which now links to Settings
- [x] Old-username URL replacement on the profile page
- [x] Tests for each form (`SettingsPage.test.tsx`)
#### Review pass (2026-10-07)
- [x] Code review + security review. Fixed:
  - **A logout could miss a session that was renewing at that moment.** Rotation now saves the new token *before* retiring the old one, so a revoke always catches one of them, and a rotation that loses the race deletes its new token.
  - **Wrong passwords in settings** are now counted per session (see above), not toward the account-wide lockout.
  - **The change-email message** greets by username, not the free-text display name, so it can't carry spam to a stranger's inbox.
  - **Smaller fixes:** invisible formatting characters are stripped from names and bios; profile requests have a length cap; the pending email is cleared in the same save as the change; `/me` uses the shared clock.
  - **Left open:**
    - A sign-up racing a rename by milliseconds could take the name being given up (`bugs/username-hold-race.md`).
    - `Email:ReplyToAddress` must be set before going live (Roadmap Stage 4), because the "email changed" notice asks readers to reply.

### Phase 4 — 2FA and Continue with Google

*(2026-10-07)* **Passkeys added to this phase** (log in with fingerprint, face or a device PIN instead of a password; nothing to leak or phish). Not designed yet: before starting, check how ASP.NET Core Identity's passkey support in .NET 10 fits this API's JWT + single-page-app setup, and write the design into §3 like 2FA's.

#### Backend
- [ ] Passkeys: register a passkey from Settings, log in with one, list and remove them (design first, see above)
- [ ] 2FA setup / enable / disable / recovery-codes endpoints; challenge token; `/login/2fa`; lockout on bad codes
- [ ] Check recovery-code storage (hash if plain text)
- [ ] `Google.Apis.Auth`; `Google:ClientId` setting; `/auth/providers`, `/auth/google`, `/auth/google/complete`, connect/disconnect
- [ ] `ReauthenticateAsync` (password or Google ID token) used by sensitive actions
- [ ] Tests: 2FA login (code, backup code, used backup code rejected), reset doesn't disable 2FA, Google: new user → username step, existing email → 409, linked login, 2FA still asked (Google token validation behind an interface so tests can fake it)
#### Frontend
- [ ] 2FA enable flow (QR via `qrcode`, backup codes download), disable, regenerate, low-codes warning
- [ ] Login second step (code / backup code)
- [ ] `GoogleButton` (loaded only if configured), `/welcome/username`, connect/disconnect, "Set a password"
- [ ] Tests for the login steps and the 2FA enable flow

### Phase 5 — Export and delete account

#### Backend
- [ ] **First:** prototype the `DeactivatedAt` global query filters and check them against the feed `UNION ALL` and the heaviest list queries. Decide filters vs. the fallback in §2 before going further.
- [ ] `GET /me/export` (zip of CSVs, rate-limited)
- [ ] `DeactivatedAt`, `DeletionKeepsContributions`; seed `deleted` user; delete + cancel-deletion endpoints; deactivated login answer
- [ ] `AccountErasureService` (keep/delete contributions, club Admin handover, Restrict FKs)
- [ ] Tests: export contents, deactivated user hidden everywhere (profile, search, feed, reviews, lists, comments), cancel restores everything, erasure both ways, club handover, empty club deleted
#### Frontend
- [ ] "Download my data"; delete-account screen (choice, warnings, password + code)
- [ ] "Scheduled for deletion" screen with cancel
- [ ] "Deleted user" rendering for kept contributions
- [ ] Tests for the delete flow and cancel

### Phase 6 — Goodreads import

**Moved to `specs/book-import.md`** (2026-10-07). The tasks below are not used.

#### Backend
- [ ] `ImportJobs`, `ImportRows`, `ImportCreatedLists` (migration)
- [ ] `GoodreadsCsvParser` (CsvHelper) + tests on a real-shaped sample file (ISBN quirk, dates, HTML reviews, custom shelves)
- [ ] `IOpenLibraryClient.FindWorkIdByIsbnAsync`; matching (ISBN-13 → ISBN-10 → normalised title + author search)
- [ ] `ImportProcessingService` (1/s, restart-safe), status/field mapping, skip existing books, shelves → private lists
- [ ] Endpoints: upload, progress, rows, resolve, undo (7 days), list
- [ ] Tests: mapping table, duplicates skipped, re-import safe, resolve, undo removes exactly what the job created, gated by confirmed email
#### Frontend
- [ ] Import page: instructions, upload, progress (2 s polling), results, Not found table with "Find it", undo
- [ ] Tests for upload → progress → results

### Local setup needed (all phases run fully on localhost)
- **Phase 1:** open the site at `http://localhost:5173`, not `127.0.0.1`. The API is at `localhost:5258`, so both count as the same site and the `SameSite=Strict` cookie is sent.
- **Phase 2:** Docker running (Mailpit joins Postgres in `docker-compose.yml`). Read emails at `localhost:8025`.
- **Phase 4:**
  - An authenticator app on a phone (Google Authenticator, Microsoft Authenticator, Authy).
  - For Google: a free Google Cloud project with the OAuth consent screen set to External / Testing (add your Google account as a test user).
  - A *Web application* OAuth client ID with JavaScript origins `http://localhost:5173` and `http://localhost`, its client ID put in `Google:ClientId` in the development settings (no secret needed).
- **Phase 5:** the short development grace period (§3.10).
- **Phase 6:** internet access for Open Library; a real Goodreads export (My Books → Import and export → Export Library) or a sample file in the same format.

### Verification & docs (each phase)
- [ ] Backend + frontend tests pass; build and eslint clean; migrations applied to the dev database (build in Release while the dev API runs)
- [ ] Manual browser pass of the phase's flows. Emails are checked in Mailpit at `localhost:8025`. Google needs a test client ID.
- [ ] Bruno: update the Auth folder (login body, refresh, 2FA) and add Settings/Imports requests
- [ ] SPEC.md: auth section (refresh cookie, in-memory token), §10 (Goodreads import done after Phase 6)
- [ ] Re-read this spec against what was built; update its Status line; add a CHANGELOG entry
