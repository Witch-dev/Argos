# Feature Spec — Log progress by chapter

**Status:** ✅ Built 2026-10-26: Phase 1 server (§6), Phase 2 browser (§7).

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
  - It's percent, as today. A chapter position is the exact end of a chapter, not a guess in the middle of one, so a chapter writer's percent rounds **down** (a page writer's still rounds up). Otherwise two readers who both finished chapter 7 of 24 would land at 30% and 29%, and the comment would stay closed. With the same chapter count, that makes "finished chapter 7" open exactly the chapter-7 posts. *(Changed while building: a direct chapter comparison was planned, but rounding down does the same job for any book under 100 chapters. Over 100, two neighbouring chapters can share a percent, so a post can open up to one chapter early. That's rare, and accepted.)*
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

- [x] Domain fields + migration `ProgressByChapter` (§3.1).
- [x] Validation, error codes and translations (§3.2).
- [x] `ReadingProgress.Percent` and `BuddyReadRules` (chapter position, writer rounding). The same-total comparison was dropped (§2).
- [x] Progress history, activity "chapters since", DTOs, export.
- [x] Tests: validation (audio refuses chapters, page + chapter refused, ranges), percent by chapter, a comment at ch. 7 of 24 opens for another reader at ch. 7 of 24 and not at ch. 6, mixed page/chapter by percent, export columns.
- [x] reviewer and argos-security (§6).

### Phase 2 — Browser *(size M)*

- [x] Types and the `progressPercent` rule.
- [x] Log form, progress update window, QuickLog.
- [x] The display places (§3.3) and the wording fix.
- [x] Translations in five languages; Vitest.
- [x] web-design critique round on the log form; browser-check: log a book in chapters, see it in the feed and a buddy read with a page reader.
- [x] reviewer; CHANGELOG.

## 5. Out of scope

- Chapters for audiobooks.
- Chapter names or a table of contents per book.
- Club checkpoints with chapter targets (today's free-text label "Chapters 5–10" already covers the talk side).
- Filling chapter counts from anywhere: Open Library doesn't have them.

## 6. Phase 1 build notes (2026-10-26)

- **Data:** `Logs.TotalChapters`/`CurrentChapter`, `ReadingProgressEntries.Chapter`, `CheckpointComments.AtChapter`, migration `ProgressByChapter` (four nullable columns). `Log.CountsInChapters` (not stored) says which unit a log uses. The migration's model snapshot also picked up an older, unrelated `Book.Localizations` navigation that had never made it into the snapshot; it changes nothing in the database.
- **Validation:** `LogService.ValidateChapters`, after `ValidateFormat`. Error codes `logs.audioNoChapters`, `pagesOrChapters`, `totalChaptersRange`, `currentChapterRange`, `currentChapterOverTotal`, in all five languages.
- **Buddy reads:** `BuddyReadRules.PositionOf` returns `(Page, Chapter, Percent)`. A chapter position rounds down on both sides. **Security review fix:** a writer who has finished at least one chapter writes from 1% at least. In a book with over 100 chapters, "finished chapter 1" would otherwise be 0%, and a post at 0% opens for every member, even one with no position.
- **Feed:** `ChaptersSincePrevious` next to `PagesSincePrevious`; `PreviousAt` is whichever applies. History points carry `Chapter`.
- **Checkpoint reminder (reviewer fix):** "N pages behind" now leaves out audiobooks and chapter logs. Before this, an audiobook with no page counted from page 0, so a listener was told they were the whole checkpoint behind. That was an older bug, fixed here too. A log with no page yet still counts from the start, as before.
- **Accepted, not changed:** the due-checkpoint reminder decides "already there" by page, so a chapter reader (like an audiobook listener today) gets the reminder for every due page checkpoint, even past it. Checkpoint targets are pages, and the reminder is a nudge, not a lock. Revisit if readers find it noisy.
- **Accepted, not changed:** editing a post updates its `AtPage`/`AtChapter` label only when the lock point moves on, so a writer who switches units between posting and editing keeps the old label. The label still describes where the lock is.
- **Tests:** 1718 pass. New: `ReadingProgressTests` (chapters), `FormatTests` (validation, export), `ReadingProgressHistoryTests` (chapter points and "+2 chapters"), `BuddyReadTests` (same chapter opens and the one before doesn't, page reader by percent, under-1% stays locked), `ClubVotingTests` (no "pages behind" in chapters).
- **API restart needed:** the migration is applied on start. The dev database wasn't running while this was built.

## 7. Phase 2 build notes (2026-10-26)

- **One rule:** `countsInChapters` and `progressPercent` in `web/src/lib/readingFormat.ts` match `Log.CountsInChapters` and `ReadingProgress.Percent`. `progressText` says "Chapter 7 of 24". The chapter fields sit on `FormatFields`, so `LogDto`, the requests, `ActivityItemDto` and `ClubMembershipDto` all carry them.
- **Updates keep the unit:** the server sets the chapter fields to whatever an update sends, so `updateFromLog` (QuickLog) sends them back unchanged. "Finished!" clears them, like the page numbers.
- **Log form** (the progress window uses the same form): "Count by" Pages | Chapters (the shared `Segmented`) above the position fields, for print and ebook only. In chapters: "Chapters in the book" and "Chapters finished", with the hint "Just started chapter 7? Enter 6." A chapter log keeps the page count as the book's length (sent but not shown). Switching clears the other unit's current place.
  - Design critique: "Chapter you've finished" wrapped at 375px, so it became "Chapters finished" and the row is bottom-aligned. The control got more room above it, and its track a hairline edge, since the track's sunken colour matched the form's. Disposition: ship.
- **QuickLog:** "+1 chapter" in place of "+10 pages".
- **Shown as chapters:**
  - The rail's "Currently reading" and the club's "next up" ("You've finished chapter 7").
  - Buddy-read reader rows ("ch. 7 of 24"), "Posting at ch. 7 (29%)", comment bylines and locked notes ("Written at ch. 7").
  - The reading update viewer ("has finished chapter 7 of 24", the journey's "ch." ends, chapter dots, "+2 chapters since…").
- **Club pace:** a chapter reader is judged on track by percent, as an audiobook listener is. The checkpoint's page is set against their own page count, or the club's typical one. Before this, they counted from page 0 and always showed Behind.
- **Wording (§1):**
  - The buddy-read intro says comments stay hidden "until you've read as far as the person who wrote them". The empty thread says "anyone who hasn't read as far as you".
  - "Set your page" is now "Set your progress".
  - The landing demo says "once you've read as far as Inés".
- **Not changed:** the landing demos' sample readers stay in pages. The rail's "Add your page" shows for a chapter log with no chapter yet.
- **Tests:** 1189 Vitest pass. New tests cover the percent and text, "+1 chapter", the update payload, club pace, journey points, the log form's switch and payload, and the buddy-read rows and bylines. browser-check passed with a chapter reader and a page reader in one buddy read. reviewer found nothing.
