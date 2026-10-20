# Feature Spec — Feedback button

**Status:** planned 2026-10-20, not started. First of three before inviting strangers: feedback button → `specs/whats-new.md` → landing page Phase 3 (`specs/landing-page.md`). The landing page promises "your feedback shapes it", so this has to exist first.

## 1. Problem

Early-access readers need one obvious way to send ideas, opinions and problems, at the moment they think of them. Today there is none: the only address is `hello@wingedwords.app` in the privacy policy. Feedback that isn't sent is lost, and the beta exists to collect it.

## 2. Decisions (asked 2026-10-20)

- **Logged-in readers only, inside the app.** No form on the landing page, so no spam from strangers.
- **A floating circle, bottom right, always there**, with the drawn speech-bubble icon (`comment` in `iconPaths.ts`). It opens the form.
- **On a phone it hides while scrolling down** and comes back when the reader scrolls up or stops, so it never sits over what they're reading.
- **The form:** a kind (Idea / Feedback / Problem) and a message. Nothing else to type.
- **Page and device are attached, shown and optional.** The form shows exactly what is sent ("Sent with: /books/OL45804W, Phone, iOS, Safari") with a ticked box to leave it out. Page is the path only (nothing after `?`, which can hold search words). Device is a three-part label built from the browser's user-agent: form factor, system, browser. No version numbers, screen size, IP address or anything else that could single someone out.
- **Each message is emailed to you and saved in the app.** An admin page lists them with a "Done" tick, so nothing is lost in an inbox.
- **Replies by email, from `hello@`.** The email's reply address is the reader's account email. You reply from Gmail using Gmail's "Send mail as" with `hello@wingedwords.app` (one-time setup, steps go in `DEPLOY.md`), so readers never see your personal address.
- **The reader sees a thank-you and nothing more.** No history of past feedback in the app.

### 2.1 Decisions I made that need your check

1. **Limits:** message 10–2,000 characters; at most 10 messages a reader per day (rate-limited, with a friendly error). Confirmed email required, like rating, so throwaway accounts can't flood it.
2. **Where the circle doesn't show:** while a modal, sheet or the reading-update viewer is open, on the admin pages, and for logged-out visitors. It sits above the page but below modals.
3. **Email subject:** `[Feedback · Problem] first 60 characters…`, so Gmail can filter by kind. Body: kind, message, page, device, the reader's username and a link to the admin page.
4. **Kept for 2 years**, then deleted by a small daily cleanup service like `InviteRequestCleanupService`. The privacy policy says so.
5. **Error pages** ("Something went wrong") get a "Tell us what happened" link that opens the same form with Problem preselected.

## 3. Design

### 3.1 Table `Feedback`

| Column | Type | Notes |
|---|---|---|
| `Id` | `Guid` | |
| `UserId` | `Guid` | FK to the user, cascade on account erasure |
| `Kind` | `int` enum | Idea, Feedback, Problem |
| `Message` | `string`, max 2,000 | Plain text |
| `PagePath` | `string?`, max 300 | Path only, validated to start with `/` |
| `Device` | `string?`, max 60 | The three-part label, built in the browser and checked against an allowed pattern on the server |
| `CreatedAt` | `DateTime` | |
| `DoneAt` | `DateTime?` | Set by the admin's Done tick |

### 3.2 Endpoints

- `POST /api/feedback` (authorized, confirmed email, rate-limited): `{ kind, message, pagePath?, device? }`. Saves the row, then queues the email through the existing `EmailQueue`. Returns 204.
- `GET /api/admin/feedback?status=open|done&page=` (`[RequireAdmin]`): newest first, with username and avatar.
- `PUT /api/admin/feedback/{id}/done` and `DELETE …/done` (`[RequireAdmin]`): tick and untick.

### 3.3 Email

- `EmailMessage` gains an optional `ReplyTo`. `SmtpEmailSender` uses it when present, else `Email:ReplyToAddress` as today.
- Sent to a new setting `Feedback:NotifyAddress` (production: `hello@wingedwords.app`, which Porkbun forwards to Gmail).
- The message text is HTML-encoded in the HTML part. It is reader-written content in your inbox.

### 3.4 Frontend

- `FeedbackButton` (floating circle, 48px, raised surface with `--shadow-elevated`, not green: the One Green Button Rule). `aria-label` "Send feedback", plus a tooltip on hover.
- `FeedbackDialog`: the shared dialog and phone sheet from `ReportDialog`. Kind as a `Segmented`, message `textarea` with a visible label and counter, the "Sent with" line and its tick box, Send (pending state), then a thank-you in place of the form (`role="status"`).
- The device label comes from a small helper in `lib/`, tested on a handful of real user-agent strings.
- `/admin/feedback`: Open / Done tabs, one row per message (kind pill, message, reader pill, page link, device, date, Done tick). A sidebar admin link like Invite requests and Reports.
- **Motion:** the circle slides out of view (transform, `--duration-state`) when scrolling down on a phone and back on scroll up; reduced motion fades instead. The dialog uses the existing modal motion.

## 4. Out of scope

Screenshots or attachments, replies inside the app, a feedback history for readers, feedback from logged-out visitors, voting on ideas.

## 5. Tasks

### Before building
- [ ] The user confirms or changes the decisions in §2.1.

### Backend
- [ ] `Feedback` entity, configuration, migration.
- [ ] `EmailMessage.ReplyTo`, used by `SmtpEmailSender`; `Feedback:NotifyAddress` setting (`appsettings*.json`, `DEPLOY.md`).
- [ ] `FeedbackService` + repository + `FeedbackController` (`POST`), confirmed-email check, a `feedback` rate-limit policy, the email.
- [ ] Admin list and Done endpoints.
- [ ] Erasure: deleted with the account. `FeedbackCleanupService` (daily, deletes rows older than 2 years), modelled on `InviteRequestCleanupService`.
- [ ] Error codes for every new error, translated under `errors.codes`.
- [ ] Tests: unit (validation, path and device checks, email content encoded) and integration (send, rate limit, unconfirmed email refused, admin-only list, erasure).

### Frontend
- [ ] Device-label helper + tests.
- [ ] `FeedbackButton` (hide on scroll down on phones, hidden with modals open and on admin pages) and `FeedbackDialog`.
- [ ] "Tell us what happened" link on the error page.
- [ ] `/admin/feedback` page and sidebar link.
- [ ] All text in the five locale files.
- [ ] Tests: dialog (kinds, counter, "Sent with" tick box removes page and device, thank-you), button visibility rules.

### Verification & docs
- [ ] `browser-check`: send each kind on desktop and phone, the hide-on-scroll, the email arriving in Gmail with the reply address, Done tick.
- [ ] Screenshot critique round (Paper and Dark, 1280 and 375).
- [ ] `reviewer` and `argos-security` (user input, email, admin endpoints), fix findings.
- [ ] Privacy policy: a paragraph on feedback messages (what's stored, 2 years), all five languages.
- [ ] `DEPLOY.md`: `Feedback:NotifyAddress`, and the Gmail "Send mail as" steps with Resend's SMTP.
- [ ] `CHANGELOG.md`.

### By hand (the user, on deploy)
- [ ] Render: set `Feedback__NotifyAddress` on the API service.
- [ ] Gmail: set up "Send mail as" `hello@wingedwords.app` (steps in `DEPLOY.md`), then reply to one test message and check the sender shown.
