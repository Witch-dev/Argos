# Feature Spec — Private notes on progress updates

**Status:** ✅ Built and pushed 2026-11-01 (Apollon 6e2094c). Asked by the user: "in the progression of a book, we can add something each time we add a progress… can we add private notes for each part of the progress?"

Builds on `specs/reading-update-redesign.md` §4 (Phase 3, `ReadingProgressEntries`).

## 1. Problem

A reading had one private note for the whole book (`Log.PrivateNote`, `specs/book-import.md` §3.6). A reader could not write "the twist at page 250 broke me" and find it again next to page 250.

## 2. Decisions

1. **The note belongs to a progress point, not to the reading.** New nullable `ReadingProgressEntry.Note` (max 2,000 characters; the whole-book note stays at 5,000).
2. **A noted point always stands alone.** A note makes a new point even inside the hour that normally merges updates, and a later change inside that hour does not move a noted point (it starts a new one). Otherwise typing 10, 12, 14 with a note on 12 would overwrite it.
3. **A note with the page unchanged is still a point.** "Stopped here for the night" at the same page is valid.
4. **Private to the author.** Never in the story (`ProgressPointDto` has no note), never in the feed. A point that exists only for its note (no place, or a place an earlier point already has) is left out of the story's history too, so the extra point and a lost "+N pages" pill can't tell a follower that a note was written (found by the security review). Read only through `GET /api/logs/progress-notes?bookId=`, which takes no user id, so there is no way to ask for someone else's.
5. **Not stored on the log.** The request field `ProgressEntryNote` (create and update) is read once per save; the form field always starts empty.
6. **Only offered while the status is Currently reading** (where progress updates are made). The API accepts it on any status.

## 3. Where it shows

- **Log form:** "Private note on this update" under the progress note (Currently reading only), with a character count and "Kept with the place you're at in the book. Only you can see it."
- **Book page:** "Your private notes" gains an "Along the way" list: each note with its place (Page N / Chapter N / audiobook time) and date, newest first.
- **Export:** `progress.csv` gains a "Private note" column.
- **Deletion:** goes with the reading and the account (existing cascade).

## 4. Out of scope

Editing or deleting a single note without deleting the reading; notes on the journal page; showing notes in the reading update viewer for your own update. Add if asked.

## 5. Tasks

**Backend**
- [x] `ReadingProgressEntry.Note` + migration `ProgressEntryNote`; `StageAsync(..., note)`; `GetNotesAsync`; `ProgressEntryNote` on create/update requests, validated; error code `reviews.progressEntryNoteTooLong`; `GET /api/logs/progress-notes`; export column.
- [x] Integration tests (`ReadingProgressHistoryTests`): own point, never merged, hidden from others and the feed, too long refused, goes with the reading, in the export.

**Frontend**
- [x] Log form field, `getProgressNotes`, "Along the way" list in `MyPrivateNotes`, strings in five languages. Vitest for both.

**Verification**
- [x] `argos-security` review: one low finding (the note-only point showed in followers' story history), fixed in `ReadingProgressRepository.GetLatestAsync` with tests. Export leaves the note unescaped like the reader's other own text, by the export's rule.
- [x] Browser check: field and helper text, noted point kept apart from a later change in the hour, "Along the way" list (desktop and 375 px), field empty on reopen and gone for other statuses, nothing for a follower in the feed, profile or notes endpoint. The character count shows only from 80% of the limit, like every other `CharacterCount`.
- Migration `ProgressEntryNote` is dated before `ClubPicture` but made after it; EF applies it as a pending migration on Render.
