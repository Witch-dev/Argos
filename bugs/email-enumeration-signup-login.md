# Whether an email has an account can be found out through sign-up or login timing

**Priority:** P3 · **Size:** S · **Area:** Backend, accounts, privacy · **Found:** 2026-10-22 (OWASP Top 10 pass, A07 "Authentication Failures") · **Status:** Fixed 2026-10-22

## What happens

"Forgot password" is careful never to say whether an email has an account. Two other doors still say it:

1. **Sign-up** answers "Email '…' is already taken" (Identity's `DuplicateEmail`).
2. **Login** answers faster for an email with no account: `AuthController.Login` returns `WrongCredentials()` straight away, while a real account first has its password hash checked (PBKDF2, tens of milliseconds). Timing many tries tells the two apart.

Usernames are public anyway; emails aren't. Knowing someone's email is on a reading app is a small privacy leak, and a list of confirmed emails is useful to phishers.

Both doors are rate-limited per address, and the bot check (Turnstile) slows scripts, but Turnstile is off during the beta.

## Suggested fix

- **Login:** when the account isn't found, still run one password-hash check against a fixed dummy hash, so both paths take about as long.
- **Sign-up:** most apps accept this one; hiding it needs a "check your inbox" flow for taken emails (an email to the existing owner instead of an error). Decide when Turnstile is turned on; until then, leave it and note it as accepted.

## Fixed

2026-10-22, **login only**. When no account matches, `AuthController.Login` now checks the typed password against a fixed hash of a random password (Identity's default hasher settings, the same the app uses), so it takes about as long as a wrong password.

Still different, accepted:
- An address blocked after 5 wrong passwords on one account gets "too many attempts" (needs an existing account, and only for the one guessing).
- While an account is locked out (20 wrong passwords from several addresses), anyone typing its email gets a quick "too many attempts", since Identity checks the lockout before the hash. Needs an account already under attack.
- A few milliseconds of database work (an unknown login with '@' looks up email then username; a wrong password saves the failed count), small and noisy next to the hash. **Sign-up** still says an email is taken, as suggested above: the decision is attached to the "Turn the bot check on" item in `ROADMAP.md`.
