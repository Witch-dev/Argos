# Feature Spec — Sign-up that never says an email has an account

**Status:** ✅ Built 2026-10-22 (backend, frontend, reviews, browser check). Roadmap: 🚩 Early access (sign-ups opened the same day). Replaces the "sign-up" half of `bugs/email-enumeration-signup-login.md`.

## 1. Problem

Sign-up answers "That email is already registered" when someone types an address that has an account. Anyone can use that to check whether a particular person reads on Winged Words. Login (fixed 2026-10-22) and "Forgot password" (since Phase 2 of `specs/account-system.md`) no longer give this away; sign-up and "Change email" still do.

The user chose OWASP's recommendation on 2026-10-22 ("full OWASP"): sign-up looks exactly the same whether the email is new or taken, and the owner of a taken address gets an email instead.

**This changes an earlier decision.** `specs/account-system.md` §2 has sign-up log the reader in at once, with confirmation only needed to post. That can't stay: a stranger who types a taken address can't be logged into the account, so to look the same, nobody is logged in at sign-up. The user accepted this trade-off (every newcomer opens the email before using the site). Leave that spec as history.

## 2. Decisions

Asked (2026-10-22):
- **Every sign-up answers "Check your inbox".** No one is logged in at sign-up.
- **A taken address gets an "you already have an account" email** with links to log in and reset the password, instead of a confirmation link.

Smaller decisions made while writing the spec (not asked; change them if you disagree):
- **The account doesn't exist until the link is clicked.** Sign-up saves a *pending sign-up* (email, username, password hash, language), kept apart from accounts. Otherwise a stranger could sign up with an address and try logging in with the password they chose: working = the address was new. A pending sign-up can't log in; login answers "wrong email or password" as for any unknown address, and the login page then adds "Just signed up? Open the link we emailed you first."
- **Clicking the link creates the account, confirms the email and logs in**, on whatever device opened it, then goes to the page the reader was heading to (`next`, saved with the pending sign-up, only a path on this site).
- ***(Security review.)* In another browser than the one that filled in the form, the link also asks for the sign-up password.** Otherwise a stranger could sign up with someone's address and a password of their own; the owner's click would make an account the stranger can log into, with the stranger's browser trusted. Same browser (the site's random browser id matches the one sent at sign-up): no password, one click. The browser remembered for new-login emails is the one that used the link.
- ***(Security review.)* One link makes one account:** the pending sign-up is taken out of the table (one statement deletes every pending sign-up for the address, and goes on only if this one was among them) before the account is made, and put back if none results (a name taken meanwhile), so two uses at once, even with two different names, can't make two accounts for one address.
- **Links last 3 days**, like confirmation links today. Expired pending sign-ups are deleted by a daily clean-up. Signing up again with the same address makes a new link; the older ones keep working until one is used. Using one makes the others invalid.
- **Usernames are not held by a pending sign-up.** Holding them would leak too: a stranger could sign up with a taken address and a made-up name, then see whether the name became unavailable. If someone else takes the name before the link is clicked, the link page asks for another name and then finishes. Usernames are public, so sign-up still says when one is taken *now*.
- **Everything checkable without the email is checked before it**, in the same order for both cases: bot check, invite (while invite-only), field rules, password rules (including the breached-password check), username taken. Only then does the address make a difference, and only to which email is sent.
- **Both cases take about as long**: a taken address still hashes the password once.
- **Emails are limited the same way in both cases**: one per address per minute and 5 an hour (`EmailCooldown`, keyed by the address for a pending sign-up, by the account for a taken one). Past the limit, sign-up still says "Check your inbox" and sends nothing. Both are *optional* emails in the daily budget (`EmailQueue`): when today's budget is used up, sign-up answers "We can't send emails right now, try again tomorrow" before looking at the address, for both cases alike.
- **Change email does the same.** Asking to move to an address that has an account looks like any other change ("Waiting for confirmation of …"); no link is sent, and that address gets a short notice that someone tried. Only a logged-in reader who knows their password can reach it, but it's the same leak.
- ***(Review, accepted.)*** The two cases take about as long, not exactly: a new address also writes one row (at most once a minute and 5 times an hour per address, hidden by network noise). And since every sign-up now needs its email, a used-up daily email budget (`EmailQueue`) stops sign-ups until the next UTC day; watch the Sentry alert at 50 emails and raise `Email:DailyLimit` as sign-ups grow.
- ***(Review.)*** "Change details or send again" waits a minute after sending, because a sooner resend for the same address is dropped without a word.
- **Old unconfirmed accounts keep working.** Accounts created before this change may be unconfirmed; `confirm-email` and "Resend email" stay for them.

## 3. Design

### 3.1 Table `PendingSignups`

| Column | Type | Notes |
|---|---|---|
| `Id` | `Guid` | |
| `Email` | `string(256)` | as typed, trimmed |
| `NormalizedEmail` | `string(256)` | upper case like Identity's; indexed |
| `UserName` | `string` | as typed |
| `PasswordHash` | `string` | Identity's hasher, same settings as accounts |
| `PreferredLanguage` | `string?` | for the account and the email |
| `DeviceId` | `string?` | for the new-login notices, as sign-up does today |
| `InviteCode` | `string?` | while invite-only; claimed when the link is used |
| `Next` | `string?` | a path starting with one `/`, ≤ 512 |
| `TokenHash` | `string(64)` | SHA-256 of the link's token, hex; unique |
| `CreatedAt`, `ExpiresAt` | `DateTime` | `ExpiresAt` = created + 3 days; indexed |

The token is 32 random bytes (base64url) and only its hash is stored, so a database copy can't be used to finish someone's sign-up.

### 3.2 Endpoints

```
POST /api/auth/register         same request (+ optional next) → 202 | 400 | 503
POST /api/auth/confirm-signup   { token, username?, password?, deviceId? } → 200 { token, next } | 400 | 409
```

- `register`: §2's order. New address: save a pending sign-up and send **"Finish creating your account"** with `/confirm-signup#token=…`. Taken address: send **"You already have an account"** (log in / reset password links, "if this wasn't you, ignore this"). Both answer 202 with no body.
- `confirm-signup`: an unknown or expired token → the existing invalid-link error. Address now has an account → `auth.signupAlreadyDone` ("This email already has an account. Log in instead."; only the inbox's owner can see this). Username taken meanwhile → 409 `auth.signupUsernameTaken`, the pending sign-up stays so the reader can send another `username`. Otherwise: claim the invite (while invite-only), create the account with the saved hash and `EmailConfirmed = true`, delete every pending sign-up for the address, remember the device, log in (refresh cookie + token, as login does).
- A double click: the second request finds the address taken and gets `auth.signupAlreadyDone`; the page runs the request once.
- `ErrorCodes`: the two new codes, translated under `errors.codes`.

### 3.3 Frontend

- **Register page:** after sending, the form is replaced by "Check your inbox": "We've sent a link to {email}. Open it to finish creating your account; it works for 3 days. Nothing there? Check your spam folder." and a **Change details or send again** button that brings the filled-in form back (a new send needs a new bot check).
- **`/confirm-signup`** page: reads the token from `#token=…` (then clears the address bar, like `useEmailLink`), runs `confirm-signup` once with this browser's id, then goes to `next` or `/`. On `auth.signupPasswordNeeded`, a password field ("This isn't the browser you signed up in…", and "Didn't sign up yourself? … ignore the email"). On `auth.signupUsernameTaken`, a username field with the live availability check. Both end in **Finish**. On `auth.signupAlreadyDone`, the message and a **Log in** link. On a bad link: the message and **Sign up again**. On a passing problem (no connection, 429, 5xx): **Try again**.
- **Login page:** after "wrong email or password", a hint: "Just signed up? Open the link we emailed you first."
- All text in the five locales; the two emails in the five languages of `AccountEmails`.

## 4. Out of scope

- Hiding whether a username is taken (usernames are public: profile addresses).
- "Continue with Google" (`specs/account-system.md` Phase 4): when it's built, it must not say an address is taken either.

## 5. Tasks

### Backend
- [x] `PendingSignup` entity, repository, migration
- [x] `register` as §2/§3.2: checks first, then the two emails; cooldown by address; budget check before the address
- [x] `confirm-signup`: create, confirm, log in; username taken meanwhile (409, retry with a new name); address taken meanwhile; invite claim
- [x] `next` validated (one leading `/`, no `//` or `\`, ≤ 512)
- [x] Change email to a taken address: same answer, no link, notice to that address
- [x] Daily clean-up of expired pending sign-ups
- [x] Two emails in 5 languages; two error codes
- [x] Tests: both cases answer alike (status, body); owner email, no pending row, account untouched; link creates, confirms and logs in; reuse/expired/other link after one used; username taken meanwhile; double use; invite-only; `next`; budget paused; cooldown; change email to a taken address; clean-up
- [x] Test helpers: every test that signs up goes through the email link (one shared helper)

### Frontend
- [x] `register` returns nothing; `confirmSignup` starts the session
- [x] Register page "Check your inbox" state
- [x] `/confirm-signup` page with its three outcomes
- [x] Login hint after a failed login
- [x] Translations (5 locales); Vitest for the three screens

### Verification & docs
- [x] `reviewer` and `argos-security`
- [x] Browser check: sign up → Mailpit link → logged in; taken address → the other email; username taken meanwhile
- [x] `browser-check` skill and `scripts/shoot.mjs`: seed readers through the Mailpit link
- [x] Privacy policy: an unfinished sign-up is deleted after 3 days
- [x] Bug file, changelog

#### Review pass (2026-10-22)

- `argos-security`: no way left to tell the two cases apart. Fixed: the pre-takeover through someone else's pending sign-up (password in another browser, the link's browser remembered); two accounts from one link with two names (take/put back). Accepted: the small timing gap; the budget stopping sign-ups for the day (above).
- `reviewer`: fixed the silent resend (the button waits a minute), the confirm page treating a passing error as a dead link (Try again). Added tests: same/other browser, wrong password, one link two names, the remembered browser.
- `argos-security` re-check of the fixes: the pre-takeover is closed. Also fixed: taking a link now takes every link for the address in one statement (two links used at once can't make two accounts); a failed account insert gives the link back (and answers "choose another username"); 10 wrong sign-up passwords end the link.
- Browser check (side ports, Mailpit): all eight steps worked, including Spanish at 375.
