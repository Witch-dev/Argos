# Account emails have no overall daily budget

**Priority:** P2 (raised from P3 on 2026-10-22: sign-ups are open now, so anyone can trigger confirmation emails) · **Size:** M · **Area:** Backend, email, security · **Found:** 2026-10-07 (security review of `specs/account-system.md` Phase 2) · **Status:** Fixed 2026-10-22 (Apollon d0960cd)

## What happens

Anyone can make the API send emails without logging in:

- **Forgot password** sends a reset email to any account's address.
- **Sign-up** sends a confirmation email to any address typed in, while sign-up is open.

Each account gets at most 1 email of each kind per minute and 5 per hour (`EmailCooldown`), so one inbox can't be flooded. But spread over many accounts or addresses, one visitor can still send about 10 a minute per network address. That can use up the email provider's daily or monthly quota (Resend's plans have one). Once it's used up, real confirmation and reset emails fail. Bounced confirmations to made-up addresses also hurt the sender's reputation.

Two smaller points:

- When the hourly cap is reached, "Resend email" still says "Please wait a minute", although the real wait can be up to an hour.
- A collaborator on someone else's public list can add item notes before confirming their email. The owner had to invite them, so this isn't open to strangers.

Not a problem on localhost (Mailpit has no quota). It matters once the site is public.

## Why

`EmailCooldown` only counts per account. Nothing counts all the emails the API sends in a day.

## Suggested fix

- **A daily sending budget:** a counter of all emails sent today. Past a threshold, log an alert. Past a hard limit, keep sending password resets but pause confirmations.
- **Before public launch:** keep the invite-only switch on, or add a CAPTCHA to sign-up. That's already out of scope in the spec (§4) "until spam appears".
- **Hourly cap message:** give it its own message (with the minutes left), translated like the others.

## Fixed

2026-10-22, Apollon d0960cd.

- **Daily budget:** `EmailQueue` counts every email of the UTC day. At `Email:DailyWarnAt` (default 50) it logs an error, which reaches Sentry. From `Email:DailyLimit` (default 80) it refuses *optional* emails until the next day: sign-up confirmations and the copy of feedback sent to `hello@` (the feedback itself is still saved on the admin page). Password resets, email-change emails, new-login and deletion notices, suspensions and invites still go. 80 stays under Resend's free 100 a day, which the Gmail "Send mail as" replies also use; 80 × 30 also stays under the 3,000 a month. The count is in memory, so a restart starts it at 0 again.
- **Resend email** answers 503 "We can't send more emails today. Please try again tomorrow." while optional emails are paused (checked before the per-account minute, so it isn't used up).
- **Hourly cap message:** the 6th request in an hour now says "You've asked for several emails this hour. Try again in N minutes." (`auth.emailHourlyCap`), also on changing your email address.
- The CAPTCHA part was already done by the Turnstile bot check on sign-up.
- Not changed: the list collaborator's item notes before confirming (only invited people, as above).
