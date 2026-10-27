# A club suggestion can't be reported

**Priority:** P2 · **Size:** M · **Area:** Backend + frontend, clubs, moderation · **Found:** 2026-10-27 (security review of `specs/club-suggestion-options.md` Phase 2) · **Status:** Fixed 2026-10-27 (see "What was built" at the bottom and `CHANGELOG.md`)

## What happens

No club suggestion can be reported, of any kind. This was already true before the suggestion options. Admins and moderators can remove one, but nobody can report one, including one a manager made. Since Phase 2 a text suggestion carries words a member typed: a title, "by", a link and a note. The whole club sees them.

## Why it matters

Every other place where a member's own words reach others can be reported: reviews, writings, comments and club messages. A text suggestion is the one gap. A suggestion from the admin can't be removed by anyone else either, so for the members a report is the only way to raise it.

## Decision

The user decided on 2026-10-27, when starting Phase 3, to build this as its own piece rather than inside Phase 3. Build it before the club suggestion options reach the public launch.

## Fix

- A `ClubSuggestion` report target, as other targets in `ReportService`. Its snapshot holds the title, "by", link and note (for a book or an author, the name shown). The owner is the suggester.
- The admin's hide/delete acts on it: delete removes the suggestion and its votes.
- A "Report" item on suggestion cards for anyone but the suggester, as on club messages.
- Translations, tests, and an `argos-security` review (user input, moderation).

## What was built (2026-10-27)

- **Reporting.** `ReportTargetType.ClubSuggestion` (stored as a number, so no migration). A reader can report a suggestion when they would see it in the club's list, by the same rules as `ClubService.GetSuggestionsAsync`: an active member, the club's current round, a waiting suggestion only for its author and the managers, a text left out when either reader blocked the other. Anything else is "not found". The block check that other targets get is skipped for a book or an author suggestion, since the club never sees who made it and a "not found" would give a block away. Nobody can report their own.
- **What the admin sees.** The snapshot is the title on the first line, then for a text "By: …", the link and the note, a line each; for a book or an author the shown title or name and "Book suggestion" / "Author suggestion". "View" opens the club.
- **The admin's answer.** A suggestion has no hidden state, so the queue offers **Delete** instead of Hide (after a confirm): `POST /api/admin/content/delete` removes it with its votes and ranked-ballot rows and marks its open reports Acted on. A round already chosen keeps what it copied from the suggestion. Hide on a suggestion is refused (`moderation.cantHideSuggestion`). The suggester isn't told, as when a club's admin removes one.
- **On the club page.** A "⋯" menu with Report on each suggestion row, except the reader's own.
- **Tests.** `ModerationTests` (the two `ClubSuggestion_*` tests), `reportQueue.test.ts`, `AdminReportsPage.test.tsx`, `ClubPage.test.tsx`.
