# Feature Spec — Club emails

**Status:** built and checked 2026-10-27. One phase.

## 1. Problem

Club news only reaches the bell, so a member who doesn't open the app misses that the club started a book or that a part is due. The user asked for two emails: one when the club starts a book, and one the day before each part is due, saying it's time to discuss.

## 2. Decisions

### 2.1 Asked 2026-10-27

- **A reminder before every part**, not only the last one.
- **On by default**, with a "Club emails" switch in Settings → Notifications and a link in each email that turns them off in one click.

### 2.2 Decisions I made, for the user to confirm

- **Only these two emails.** Everything else about clubs stays in the bell. Weekly digests and other emails are `FUTURE-IDEAS.md`.
- **Who gets them:** active members of the club, with a confirmed email, not suspended and not scheduled for deletion, with the switch on. The start email skips the member who confirmed the book (they know), as the bell does. Buddy reads too: they are clubs with one book.
- **The day-before email goes to every member**, whether or not they reached the part: it's an invitation to discuss, not a "you're behind" nag (that is the bell's "due in 2 days").
- **When it goes:** a part's due date is a calendar day (stored as midnight UTC). The email goes from 12:00 UTC the day before (06:00 in Mexico City, 13:00 in Madrid, 09:00 in São Paulo), so "tomorrow" is right for readers in the Americas and Europe. It also names the date, so it reads right anywhere.
- **Once per part.** `ReadingCheckpoint.ReminderEmailedAt` records it; moving the due date clears it, so a moved part is reminded again. A part added or moved to less than a day away is reminded at the next hourly run. The "Final thoughts" wrap-up has no reminder.
- **Optional emails, with their own share of the day.** They count toward the daily cap (`EmailOptions.DailyLimit`, 80) and also stop at `ClubDailyLimit` (40), so a busy club, or one setting many parts due on purpose, can't use up the sign-up emails' budget (security review 2026-10-27). Password resets always go. A dropped email is logged; the bell still has the news. A part whose emails all failed to queue is let go again and retried the next hour. At beta size (a few clubs of 5–20) this is far below the cap; past it, consider a higher Resend plan.
- **The off link** carries a signed token (ASP.NET Data Protection, purpose `ClubEmailsOff`, the user id, valid 90 days), after `#` like the account links so it stays out of access logs. The page `/email-off` shows a "Turn off club emails" button that sends it to `POST /api/notifications/club-emails-off` (a button, not on load, because some mail scanners open every link with scripts running), which needs no login and only ever turns the switch off. A bad or expired token gets "This link is invalid or has expired." and a link to Settings → Notifications.
- **Language:** the reader's `PreferredLanguage`, the same as account emails, in a new `ClubEmails` class beside `AccountEmails` with the same look. The book's title is the one shown in the reader's language (`ShownBook`). Club names and part labels are the club's own words, HTML-encoded.

## 3. Design

**Email 1 — the club starts a book** (sent from `ClubBookConfirmedAsync`)
- Subject: "{Club} is starting {Book}"
- "{Club} has picked its next read: {Book} by {Author}." (a text round: its title and "by")
- When there are parts: "The first part, {part}, is due on {date}." Otherwise nothing.
- Button "Open the club" → `/clubs/{id}`.

**Email 2 — a part is due tomorrow** (sent from `NotificationBackgroundService`)
- Subject: "{Club}: {part} is due tomorrow"
- "Tomorrow, {date}, is the deadline for {part} of {Book}."
- "You can start adding your comments and discussing it with the club."
- Button "Join the discussion" → the part's discussion page.

`{part}` is the part's label ("Part One") or its range ("chapters 1–5", "pages 1–120"), translated. Both emails end with: "You get this email because you're in {Club}. Turn off club emails" (link).

**Data**
- `NotificationGroup.ClubEmails` (on by default), saved like the other switches. It has no bell type.
- `ReadingCheckpoint.ReminderEmailedAt` (nullable). Migration.

**Endpoint**
- `POST /api/notifications/club-emails-off` `{ token }`, anonymous, rate-limited like the other anonymous account endpoints. 204 on success, 400 with the existing "This link is invalid or has expired." otherwise.

**Browser**
- Settings → Notifications: a "Club emails" switch under the Clubs one.
- `/email-off`: reads the token, says what the button does, and on a click posts it: "Club emails are off. You can turn them back on in Settings."

## 4. Explicitly out of scope

- Emails for anything else (meetings, votes, comments), digests, an unsubscribe header for mail apps (`List-Unsubscribe`; worth adding if volume grows past a few hundred a day).

## 5. Tasks

### Backend
- [x] `NotificationGroup.ClubEmails`; `ReadingCheckpoint.ReminderEmailedAt` + migration; cleared when the due date changes
- [x] `ClubEmails` (two emails, five languages, off link); recipients query in `ClubEmailRepository`
- [x] Start email on book confirm; day-before job in `NotificationBackgroundService`
- [x] `POST /api/notifications/club-emails-off` (answers with the existing "This link is invalid or has expired.", already translated, so no new code)
- [x] Tests: texts agree in all languages, who receives, once per part, moved date re-sends, switch off, token valid/tampered/empty (expiry is Data Protection's own check, not tested)

### Frontend
- [x] "Club emails" switch in Settings → Notifications (five languages)
- [x] `/email-off` page

### Verification & docs
- [x] `reviewer` and `argos-security` (anonymous endpoint, token). Fixed: a claimed reminder whose emails failed is retried; one failure no longer stops the hourly pass; club emails got their own daily share; the off page waits for a click. Left as is: the link works for 90 days and isn't single-use (normal for an off link; it can only turn emails off); a finished club with a round still in Reading keeps getting reminders (rare; revisit if seen).
- [x] See both emails in Mailpit; click the off link. *Done 2026-10-27 (`browser-check`, side ports): start email to the other member only, club name with `& " <` encoded; reminder to both members once, link opens the part's discussion; the off page waits for the click, the switch goes off and Clubs stays on. Fixed on the spot: a bad link now also links to Settings.*
- [x] Privacy policy: mention club emails and how to turn them off
- [x] CHANGELOG line
