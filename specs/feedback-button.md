# Feature Spec — Feedback button

**Status:** built 2026-10-20; the two "By hand" steps are left for deploy. First of three before inviting strangers: feedback button → `specs/whats-new.md` → landing page Phase 3 (`specs/landing-page.md`). The landing page promises "your feedback shapes it", so this has to exist first.

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

### 2.1 Decisions I made, confirmed by the user 2026-10-20

1. **Limits:** message 10–2,000 characters; at most 10 messages a reader per day (rate-limited, with a friendly error). Confirmed email required, like rating, so throwaway accounts can't flood it.
2. **Where the circle doesn't show:** while a modal, sheet or the reading-update viewer is open, on the admin pages, and for logged-out visitors. It sits above the page but below modals.
3. **Email subject:** `[Feedback · Problem] first 60 characters…`, so Gmail can filter by kind. Body: kind, message, page, device, the reader's username and a link to the admin page.
4. **Kept for 2 years**, then deleted by a small daily cleanup service like `InviteRequestCleanupService`. The privacy policy says so.
5. **Error pages** ("Something went wrong") get a "Tell us what happened" link that opens the same form with Problem preselected.

## 3. Design

### 3.1 Table `FeedbackMessages` (entity `Feedback`)

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
- Sent to a new setting `Feedback:NotifyAddress` (production: `hello@wingedwords.app`, set in `appsettings.Production.json`, which Porkbun forwards to Gmail).
- The log lines of the email queue name it "feedback {id}" (`EmailMessage.LogLabel`), never by its subject, which is the reader's words (security review).
- The message text is HTML-encoded in the HTML part. It is reader-written content in your inbox.

### 3.4 Frontend

- `FeedbackButton` (floating circle, 48px, raised surface with `--shadow-elevated`, not green: the One Green Button Rule). `aria-label` "Send feedback", plus a tooltip on hover.
- `FeedbackDialog`: the shared dialog and phone sheet from `ReportDialog`. Kind as a `Segmented`, message `textarea` with a visible label and counter, the "Sent with" line and its tick box, Send (pending state), then a thank-you in place of the form (`role="status"`).
- The device label comes from a small helper in `lib/`, tested on a handful of real user-agent strings.
- `/admin/feedback`: Open / Done tabs, one row per message (kind pill, message, reader pill, page link, device, date, Done tick). A sidebar admin link like Invite requests and Reports.
- **Motion:** the circle slides out of view (transform, `--duration-state`) when scrolling down on a phone and back on scroll up; reduced motion fades instead. The dialog uses the existing modal motion.

## 3.5 What the build added or changed (2026-10-20)

- **Reviews.** `reviewer`: a request with no `kind` was read as Idea (the enum's 0); `Kind` is now nullable and refused when missing. `argos-security`, four Lows, all fixed: the email queue logged feedback subjects (the reader's words), now a log label; the page-path pattern let a trailing newline through (`$` → `\z`); a club invite link's path is the token itself, so `/clubs/join/<token>` is sent as `/clubs/join`; a reply address MimeKit can't parse falls back to the default instead of failing the email.
- **In "Download my data".** Feedback is the reader's own words, so the export has a `feedback.csv` (kind, message, page, device, date), and the privacy policy's download paragraph says so.
- **Privacy page fix found on the way.** `LegalPage.tsx` never listed the Stage 7 `reports` section, so the Reports paragraph wasn't shown. Both `reports` and `feedback` are listed now, and `LegalPage.test.tsx` counts the sections from `legal.json`, so a missing one fails.
- **The button hides by fading** (`opacity: 0`, no pointer events) while a dialog is open, not `visibility: hidden`: hidden, it lost focus before the dialog noted its opener, and Escape left focus nowhere.

## 4. Out of scope

Screenshots or attachments, replies inside the app, a feedback history for readers, feedback from logged-out visitors, voting on ideas.

## 5. Tasks

### Before building
- [x] The user confirms or changes the decisions in §2.1. **Confirmed as written, 2026-10-20.**

### Backend
- [x] `Feedback` entity, configuration, migration.
- [x] `EmailMessage.ReplyTo`, used by `SmtpEmailSender`; `Feedback:NotifyAddress` setting (`appsettings*.json`, `DEPLOY.md`).
- [x] `FeedbackService` + repository + `FeedbackController` (`POST`), confirmed-email check, a `feedback` rate-limit policy, the email.
- [x] Admin list and Done endpoints.
- [x] Erasure: deleted with the account. `FeedbackCleanupService` (daily, deletes rows older than 2 years), modelled on `InviteRequestCleanupService`.
- [x] Error codes for every new error, translated under `errors.codes`.
- [x] Tests: unit (validation, path and device checks, email content encoded) and integration (send, rate limit, unconfirmed email refused, admin-only list, erasure).

### Frontend
- [x] Device-label helper + tests.
- [x] `FeedbackButton` (hide on scroll down on phones, hidden with modals open and on admin pages) and `FeedbackDialog`.
- [x] "Tell us what happened" link on the error page.
- [x] `/admin/feedback` page and sidebar link.
- [x] All text in the five locale files.
- [x] Tests: dialog (kinds, counter, "Sent with" tick box removes page and device, thank-you), button visibility rules.

### Verification & docs
- [x] `browser-check`: send each kind on desktop and phone, the hide-on-scroll, the email arriving in Gmail with the reply address, Done tick. *Done 2026-10-20 on the side ports, with the email checked in Mailpit (reply-to = the reader). Gmail itself is the "By hand" check below.*
- [x] Screenshot critique round (Paper and Dark, 1280 and 375).
- [x] `reviewer` and `argos-security` (user input, email, admin endpoints), fix findings.
- [x] Privacy policy: a paragraph on feedback messages (what's stored, 2 years), all five languages.
- [x] `DEPLOY.md`: `Feedback:NotifyAddress`, and the Gmail "Send mail as" steps with Resend's SMTP.
- [x] `CHANGELOG.md`.

### By hand (the user, on deploy)
- [x] ~~Render: set `Feedback__NotifyAddress` on the API service.~~ Not needed: `appsettings.Production.json` sets it.
- [ ] Gmail: set up "Send mail as" `hello@wingedwords.app` (steps in `DEPLOY.md`), then reply to one test message and check the sender shown.
