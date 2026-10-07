# Account emails have no overall daily budget

**Priority:** P3 · **Size:** M · **Area:** Backend, email, security · **Found:** 2026-10-07 (security review of `specs/account-system.md` Phase 2) · **Status:** Open

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
