# Bot check on login and sign-up (Cloudflare Turnstile)

*ROADMAP Stage 4 "Security setup" (box moved to Stage 10 on 2026-10-11, built early on 2026-10-13; only the Cloudflare account and keys are left for Stage 10).*

## Why

The per-address rate limit and the login lockout (`LoginAttemptLimiter`, 5 wrong passwords per account per address) stop one address hammering one account. They can't stop credential stuffing: leaked email/password pairs tried from thousands of addresses, one or two guesses each. A challenge that every attempt must solve can.

## Decisions

- **Cloudflare Turnstile**, free, mostly invisible (Managed mode). No CAPTCHA puzzles for most readers.
- **Off until both `Turnstile:SiteKey` and `Turnstile:SecretKey` are set.** Development, tests and the closed beta run without it. One key alone stops the API starting, so the check can't be silently off by typo.
- **Always required on login and sign-up** when on, not "after a few failed logins" as the roadmap first said: an attacker making one or two guesses per address never reaches a failure threshold, which is exactly the attack this stops.
- **Fails closed**: a missing, oversized or unverifiable token, or Cloudflare unreachable, is a refusal. The cost is that a Cloudflare outage blocks logins; `DEPLOY.md` says how to switch the check off.
- **Checked first**, before the invite and username answers (so a bot can't probe them) and before the account lookup. A failed check is not a wrong password: it doesn't count towards any lockout.
- **One source of truth**: the site key comes from `GET /api/auth/registration-status` (`botCheckSiteKey`), so the frontend shows the widget exactly when the server will ask for it. No build-time site key.
- **Not on** forgot-password, reset-password or confirm-email: they don't test passwords, and have their own per-account email cooldown.
- The visitor address (`VisitorAddressMiddleware`) is sent as `remoteip`.
- Cloudflare is named in the privacy policy's "Who else handles your data" paragraph (five languages).

## Backend

- [x] `TurnstileOptions` (`Turnstile` section), startup refusal for a half-set pair
- [x] `ITurnstileClient` / `TurnstileClient` (Infrastructure, `siteverify`, 5 s timeout, secret and token in the POST body)
- [x] `BotCheck` service: off → pass; blank or over 2048 characters → refuse without calling Cloudflare
- [x] `BotCheckToken` on `LoginRequest` and `RegisterRequest`; checked first in `Login` and `Register`; error code `auth.botCheckFailed` in five languages
- [x] `botCheckSiteKey` on the registration status
- [x] xUnit: client request/response handling, `BotCheck`, integration (site key exposed and secret not, sign-up and login need a token, failed checks don't lock the account)

## Frontend

- [x] `lib/turnstile.ts` (loads Cloudflare's script on first use), `components/BotCheck.tsx`, `hooks/useBotCheck.ts`
- [x] Login and register forms: widget when the site key is set, submit held while the status loads, token sent, new challenge after every submit (a token works once)
- [x] CSP in `web/docker/entrypoint.sh` allows `challenges.cloudflare.com` (script, frame, connect)
- [x] Translations: `auth.botCheck.*`, `errors.codes.auth.botCheckFailed`, privacy policy sentence
- [x] Vitest: no widget when off; token sent and challenge renewed; form waits for the check; load failure message; sign-up sends the token

## Verification

- [ ] In a browser with Cloudflare's test keys (`DEPLOY.md`): login and sign-up work; a wrong password renews the challenge and the next try works; the always-fail secret shows the "bot check didn't pass" message
- [ ] On a 320 px wide phone the widget fits (it switches to the compact size under 300 px)
- [ ] Each of the five themes: the widget's light/dark follows the app's theme
- [ ] Stage 10: real keys on Render, then the checks in `DEPLOY.md`
