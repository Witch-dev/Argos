# Feature Spec — Missing book requests

**Status:** spec written and decisions confirmed 2026-11-01; Backend, Frontend and Verification built and checked 2026-11-02. Modelled on `specs/feedback-button.md` (a reader sends something, an admin reviews it on an admin page).

## 1. Problem

Search reads Open Library live, so a book Open Library doesn't have can't be found, logged or listed. The user can add it to Open Library by hand, and tested that on 2026-11-01: a new book saved with the "Add a book" form showed up in Winged Words about 5 minutes later. So the cheapest fix is not a custom-book system inside Argos (no made-up ids, no refresh-job guards, no cover hosting) but a way for readers to **ask**, and for the user to add the book to Open Library, which also gives Open Library a book it was missing.

## 2. Decisions

- **Books go to Open Library, not into our database.** Argos stays a reader of Open Library; nothing about `Book`, the refresh job or covers changes.
- **The user adds each book by hand** on openlibrary.org (the "Add a book" form, then "Add/Manage image" on the edition for the cover). No script, and no Open Library login stored in the app.
- **A "Can't find your book?" button** where books are looked for: the search results (always at the end of the results, and in the empty state) and the book picker. It opens a form.
- **Logged-in readers only**, like feedback, so no spam from strangers.
- **The form copies Open Library's own required fields**, so each request has what the user needs to fill their form (see §3.1).
- **When the book is added, the requester is told** in the app (a notification), with a link to search for it.

### 2.1 Decisions I made, for the user to confirm

1. **Required fields:** title and author only. Publisher and publish year are "if you know", because readers often don't, and the user can find them from the book itself or a catalogue. Open Library requires them, so the user fills the gaps.
2. **ISBN:** one optional box. The type is worked out from the length (10 or 13 digits) and the check digit is verified, with a gentle warning on a typo (Open Library may reject a bad one). Open Library's other id types (LCCN, OCLC, LibriVox, Gutenberg) are not asked for.
3. **Extra fields:** language (optional) and a "link or note" (optional, up to 500 characters; a store or catalogue page helps find the right edition and the cover).
4. **Copyright note on the form:** one line saying that what the user adds to Open Library is released under CC0, so readers shouldn't paste copyrighted text (such as a blurb) into the note.
5. **Limits:** at most 5 requests a reader per day, rate-limited with a friendly error; email must be confirmed, like feedback.
6. **Duplicate check:** before the form is sent, it shows what search already finds for the typed title ("Is it one of these?"), so people don't request books that are there under another spelling. It only suggests; it never blocks.
7. **Statuses:** Pending, Added, Declined (with an optional short reason: already exists, not a book, can't find it). The requester is notified for Added and Declined.
8. **Kept for 2 years** after the request is closed, then deleted by a daily cleanup service like `FeedbackCleanupService`. Pending requests are kept until closed.
9. **Email to the user** for each new request, like feedback (`MissingBook:NotifyAddress`), with the fields in a short list, so the form is copied across quickly.

## 3. Design

### 3.1 Table `BookRequests`

| Column | Type | Notes |
|---|---|---|
| `Id` | `Guid` | |
| `UserId` | `Guid` | FK to the user, cascade on account erasure |
| `Title` | `string`, max 200 | Required. A subtitle goes after a colon ("Title: Subtitle"), as Open Library asks |
| `Authors` | `List<string>`, max 5, each max 100 | Required, at least one |
| `Publisher` | `string?`, max 100 | |
| `PublishYear` | `int?` | 1000 to next year |
| `Isbn` | `string?`, max 13 | Digits only; 10 or 13; check digit verified |
| `Language` | `string?`, max 2 | Two-letter code, from the site's language list |
| `Note` | `string?`, max 500 | Plain text. A link is allowed in it, never rendered as HTML |
| `Status` | `int` enum | Pending, Added, Declined |
| `DeclineReason` | `int?` enum | AlreadyExists, NotABook, NotFound |
| `OpenLibraryId` | `string?`, max 20 | The user pastes it when marking Added (a work id like `OL45804W`); lets the notification link straight to the book page |
| `CreatedAt` | `DateTime` | |
| `ClosedAt` | `DateTime?` | |

### 3.2 Endpoints

- `POST /api/book-requests` (authorized, confirmed email, rate-limited): the fields above. Saves, then queues the email through `EmailQueue`. Returns 204.
- `GET /api/admin/book-requests?status=pending|closed&page=` (`[RequireAdmin]`): newest first, with the requester's username.
- `PUT /api/admin/book-requests/{id}/added` with `{ openLibraryId? }`, `PUT …/declined` with `{ reason? }` (`[RequireAdmin]`): close the request and create the requester's notification.

### 3.3 Notification and email

- A new notification type `BookRequestAdded` / `BookRequestDeclined` through the existing notifications system (`specs/notifications.md`). Added links to the book page when an Open Library id was pasted, else to a search for the title.
- The user's email follows `FeedbackService`: HTML-encoded reader text, the log label "book request {id}", never the title.

### 3.4 Frontend

- `MissingBookButton`: a plain link-style button under the results and in the empty state, text "Can't find your book? Tell us". Not green (the One Green Button Rule).
- `MissingBookDialog`: the shared dialog and phone sheet. Fields as in §3.1, the "Is it one of these?" suggestions, the CC0 line, Send, then a thank-you with "We'll tell you when it's added" (`role="status"`).
- `/admin/book-requests`: Pending / Closed tabs, one row per request showing every field with a copy button, an "Open Library: add a book" link, an Added button (with an optional id box) and a Declined menu. A sidebar admin link like Reports and Feedback.
- All text through `t()` in the five locale files; new backend errors get codes under `errors.codes`.

## 4. Out of scope

Adding books into Argos's own database, hosting covers, a script or API that writes to Open Library, requests from logged-out visitors, voting on requests, a request history page for readers, requests for authors or editions of a book that already exists (the form is for missing books only).

## 5. Tasks

### Before building
- [x] The user confirms or changes the decisions in §2.1. **Confirmed as written, 2026-11-01.**

### Backend
- [x] `BookRequest` entity, configuration, migration (enum columns, `Authors` as a list).
- [x] ISBN validation helper (digits, length, check digit) + unit tests.
- [x] `BookRequestService` + repository + `BookRequestController` (`POST`), confirmed-email check, a `book-requests` rate-limit policy, the email.
- [x] Admin list, Added and Declined endpoints; notification types.
- [x] Erasure with the account; `BookRequestCleanupService` (daily, 2 years after closing).
- [x] Error codes for every new error, translated under `errors.codes`.
- [x] Tests: unit (validation, ISBN check digit, email content encoded) and integration (send, rate limit, unconfirmed email refused, admin-only list, added/declined notify, erasure).
- [x] Also built: book requests in "Download my data" (`book-requests.csv`).

**Built 2026-11-02 (Apollon, not yet committed).** Notes: a bad ISBN check digit is refused by the server (`bookRequest.badIsbn`), so the form's "gentle warning" must let the reader clear the ISBN to send; the language is any two lowercase letters; the notification carries the title, Open Library id and decline reason (`subject.declineReason`), and the two new types can't be switched off. Reviews: `reviewer` found nothing to fix in the code (export gap fixed); `argos-security` had three Lows, fixed (a note could fake a "From:" line in the email, so From is first and the note last; the unconfigured-email log named the subject, now the log label; authors list capped early).

### Frontend
- [x] `MissingBookButton` in search results (end of list and empty state) and the book picker.
- [x] `MissingBookDialog` with the duplicate suggestions, ISBN check and CC0 line.
- [x] `/admin/book-requests` page and sidebar link.
- [x] All text in the five locale files (new `missingBook.json`, `admin.bookRequests`, `nav.bookRequests`, bell sentences).
- [x] Tests: dialog (required fields, ISBN type and typo warning, suggestions, thank-you), admin page (copy, Added with id, Declined).

**Built 2026-11-02 (Apollon, not yet committed).** Notes: the button is for signed-in readers only (hidden for visitors, and in search's pick mode); an unconfirmed reader gets the "confirm your email" answer instead of the form, as in feedback; the ISBN is checked in `lib/isbn.ts` and a bad check digit or half-typed number blocks Send until fixed or cleared (the server refuses it too); the CC0 line sits under the note box; the sidebar link has no count badge; the bell's Declined row links nowhere, Added links to the book or a title search; the decline sentence with a reason uses `types.BookRequestDeclinedFor.<reason>`. Checks: `tsc`, lint, Vitest (1338) and build pass.

### Verification & docs
- [x] `browser-check`: send a request on desktop and phone, the suggestions, the email in Mailpit, Added and Declined notify the requester. **Done 2026-11-01**: all pass; found the stale ISBN error line (fixed).
- [x] Screenshot critique round (Paper and Dark, 1280 and 375). **Two rounds done 2026-11-02.** Fixed: one ISBN message, secondary outline search button, thank-you says "in the bell" with Close filled, check/cross bell icons, admin Copy on hover, duplicate pill, count on the open tab, Added/Declined alike, tighter phone rows. Left on purpose: the gold unread dot (DESIGN.md), the count only on the open tab (the other tab's total needs a second request).
- [x] `reviewer` and `argos-security` (user input, email, admin endpoints), fix findings. **Done 2026-11-01**: the daily limit now counts saved requests only (`BookRequestService`, the rate-limit policy is gone); reviewer's picker dialog lost on refetch and stale error fixed; security found nothing above Low. Open Low: admin copies share the 80-a-day optional email budget with sign-up mail (`bugs/admin-copy-emails-share-signup-budget.md`). §2.1.2 now reads: a bad check digit blocks Send (deliberate).
- [x] Privacy policy: a paragraph on book requests (what's stored, 2 years), all five languages.
- [x] `DEPLOY.md`: `MissingBook:NotifyAddress`.
- [x] `CHANGELOG.md`.
