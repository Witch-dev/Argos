# Feature Spec — Log progress by chapter

**Status:** 📝 Spec written 2026-10-26. Not started.

## 1. Problem

A reader asked on Reddit (DavidPortoEscritor, 2026-10-26): page numbers change between editions and formats, so could spoiler hiding go by chapter? Buddy reads already unlock by how far through the book you are (a percent, `specs/stronger-clubs.md` §2), so different editions are handled. But a reader can only say where they are in pages (or minutes, for an audiobook). Ebook readers with reflowing text, and readers who simply think in chapters, have no good way to log progress.

The same reader also took our own wording at its word: the buddy-read intro says comments unlock "when you reach the page they were written on", and the landing demo says "when you reach page 120". Both are wrong since the lock went to percent.

## 2. Decisions

- **"Chapter 7" means "I've finished chapter 7"** (the user, 2026-10-26). A reader who has just started chapter 7 is at chapter 6. So a comment written "at chapter 7" only opens for someone who has finished it too. Chapter 0 is "not finished any yet".
- **Chapters are a third unit, like audiobook minutes.** The log gets `CurrentChapter` and `TotalChapters`. `ReadingProgress.Percent` (server) and `progressPercent` (browser) use chapters when the log counts in chapters, so club bars, stories, the feed and buddy-read locks all follow without their own rules.
- **A log counts in chapters when either chapter field is set.** No new "unit" column: the same rule already tells pages and minutes apart by which fields are filled.
- **A chapter log may keep `TotalPages`**, as the book's length, but not `CurrentPage`. That way the edition picker still fills the page count, and a finished book still adds to "pages read" on the stats page. Where you are is always counted in one unit only: the server refuses `CurrentPage` together with a chapter field.
- **Not for audiobooks.** An audiobook stays in minutes. Audiobook chapters can come later if anyone asks.
- **The reader types the total.** Open Library has no chapter counts. 1 to 1000 chapters; `CurrentChapter` 0 to the total.
- **Buddy-read locks:**
  - A comment (and a highlight) keeps the writer's `AtChapter` next to `AtPage`/`AtPercent`. It's shown as "ch. 7" where a page comment shows "p. 140".
  - If the writer and reader both count in chapters with the same total, chapters are compared directly: the comment opens once the reader's chapter ≥ `AtChapter`.
  - Otherwise it's percent, as today. A chapter position is the exact end of a chapter, not a guess in the middle of one, so a chapter writer's percent rounds **down** (a page writer's still rounds up). Otherwise two readers who both finished chapter 7 of 24 would land at 30% and 29%, and the comment would stay closed.
  - Mixing a page reader and a chapter reader is approximate: chapters aren't the same length. That's acceptable for spoilers; "Show anyway" is still there.
- **"You're N pages behind"** in the checkpoint reminder stays for page readers only. Checkpoint targets are pages; a chapter reader gets the reminder without that clause.
- **The progress history** (dots on the reading update viewer) records chapters too: "+2 chapters since" next to today's "+26 pages since".
- **Switching** from pages to chapters on the log form clears the current page (and the other way round), so nothing is silently mixed.

## 3. Design

### 3.1 Data

- `Logs`: `CurrentChapter int?`, `TotalChapters int?`.
- `ReadingProgressEntries`: `Chapter int?`, next to `Page` and `Minute`.
- `CheckpointComments` (and the highlight table, if it stores its own position): `AtChapter int?`.
- One migration, `ProgressByChapter`. No backfill: every existing log is pages or minutes.

### 3.2 Server

- `LogService.ValidateFormat` / `ValidateProgress`: chapters refused on an audiobook; `CurrentPage` refused with a chapter field; ranges as in §2. New error codes in `ErrorCodes.cs` with `errors.codes` translations.
- `ReadingProgress.Percent`: chapters when set, then minutes for audio, then pages.
- `BuddyReadRules.PositionOf`: returns the chapter too; the rounding and comparison rules in §2.
- Progress history staging takes the chapter; "readingMoved"/"progressChanged" include the chapter fields.
- DTOs: `LogDto`, `CreateLogRequest`, `UpdateLogRequest`, `ActivityItemDto` (and `ChaptersSincePrevious`), `ClubMembershipDto`, the checkpoint comment DTO.
- Account export: the two columns in `logs.csv`.

### 3.3 Browser

- Log form and progress update window: a "Pages / Chapters" choice for print and ebook (audio stays hours:minutes). In chapters: "Chapter you've finished" and "Chapters in the book".
- QuickLog's "set your page" step works in the log's own unit.
- Everywhere a position is shown: "ch. 7 of 24" / "chapter 7 of 24" next to "p. 140" / "page 214 of 380". The ~15 places include the feed, stories and the reading update viewer, rail cards, club member bars and "next up", the buddy-read page and its composer ("posting at ch. 7 (29%)"), comment bylines.
- Wording fix (§1): the buddy-read intro and the landing demo say "how far you've read", not "the page".
- Every string in all five languages.

## 4. Phases and tasks

### Phase 1 — Server *(size S–M)*

- [ ] Domain fields + migration `ProgressByChapter` (§3.1).
- [ ] Validation, error codes and translations (§3.2).
- [ ] `ReadingProgress.Percent` and `BuddyReadRules` (chapter position, writer rounding, same-total comparison).
- [ ] Progress history, activity "chapters since", DTOs, export.
- [ ] Tests: validation (audio refuses chapters, page + chapter refused, ranges), percent by chapter, a comment at ch. 7 of 24 opens for another reader at ch. 7 of 24 and not at ch. 6, mixed page/chapter by percent, export columns.
- [ ] reviewer.

### Phase 2 — Browser *(size M)*

- [ ] Types and the `progressPercent` rule.
- [ ] Log form, progress update window, QuickLog.
- [ ] The display places (§3.3) and the wording fix.
- [ ] Translations in five languages; Vitest.
- [ ] web-design critique round on the log form; browser-check: log a book in chapters, see it in the feed and a buddy read with a page reader.
- [ ] reviewer; CHANGELOG.

## 5. Out of scope

- Chapters for audiobooks.
- Chapter names or a table of contents per book.
- Club checkpoints with chapter targets (today's free-text label "Chapters 5–10" already covers the talk side).
- Filling chapter counts from anywhere: Open Library doesn't have them.
