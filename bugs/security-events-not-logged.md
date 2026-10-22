# Failed logins, lockouts and account changes leave no log line

**Priority:** P2 · **Size:** S · **Area:** Backend, security logging · **Found:** 2026-10-22 (OWASP Top 10 pass, A09 "Logging & Alerting Failures") · **Status:** Fixed 2026-10-22

## What happens

If someone tries to guess a reader's password, or takes over an account, nothing in the API's logs shows it. The API logs admin actions (`ModerationService`) and a stolen refresh token being reused (`RefreshTokenService`), but not:

- a wrong password, or an address being blocked after 5 of them (`LoginAttemptLimiter`);
- an account being locked after 20 wrong passwords (Identity's lockout);
- a password reset being completed, a password change, or an email change being confirmed;
- requests turned away by the rate limits (429).

So after a reader writes "someone got into my account", there's no way to see when, or from which address.

## Why

`AuthController.Login` returns `WrongCredentials()` / `LockedOut(...)` without logging; `ResetPassword`, `ConfirmEmailChange` and the password change in `AccountSettingsController` don't log either. The rate limiter's `OnRejected` (`Program.cs`) only writes the answer.

## Suggested fix

One `LogWarning` / `LogInformation` per event, with the user id and the visitor's address (`ClientAddress.PartitionKey`), **never** the email, username typed, password or token:

- `Login`: address blocked, account locked out (warning); a failed login (information).
- `ResetPassword`, password change, `ConfirmEmailChange`: information, user id only.
- `OnRejected`: warning with the policy name and the address.

Sentry's breadcrumbs pick these up. Alerting (an email when lockouts spike) can wait until there are real readers; the log lines are what matter now.

Tests: not needed for log lines; check by hand in the dev console that a wrong password logs and a right one doesn't log the password.

## Fixed

2026-10-22. Log lines carry the user id, never what was typed. The address key (`ClientAddress.PartitionKey`, an IPv6 /64 for IPv6) is only on Information lines: Warning lines become Sentry breadcrumbs, and `ErrorTracking` promises (as does the privacy policy) that addresses never reach Sentry.

- `AuthController.Login`: information, with the address, for a successful login, a wrong password, an unknown account, a too-long password, a blocked address trying again and a locked-out account; also a warning, without the address, when an address gets blocked and when the account is locked out.
- `ResetPassword`, `ConfirmEmailChange` and `AccountSettingsController.ChangePassword`: information. A settings password check that blocks further tries: warning.
- `OnRejected` in `Program.cs`: information (`Argos.RateLimiting`) with the policy, method, the route's **template** (a path can hold a club invite token) and the address. Information rather than the suggested warning, because it carries the address.

Found by the security review and fixed alongside: `GlobalExceptionHandler` logged the raw path, and Sentry reports kept the full URL, so an error on `api/clubs/join/{token}` sent the invite token to the logs and Sentry. The handler now logs the route template, and `ErrorTracking.Scrub` blanks the token (test in `ErrorTrackingTests`).

Checked by hand on a side-port API: right, wrong, unknown and blocked logins and a rate-limited request each logged, and none of the password, guesses or email appeared in the log.
