# Feature Spec — Book Club Improvements

**Status:** ✅ Implemented (2026-10-01), all four phases. Browser pass done 2026-10-06 (see Verification).

Builds on `specs/book-clubs.md` (the original clubs feature). Read that first for the data model this spec extends.

## 1. Problem

The club page works, but it doesn't make a club *feel* like reading together. Looking at a real club with a live book, these problems show up:

- **Checkpoints show in the wrong order.** `ReadingCheckpointRepository` sorts by `DueDate` only, so two checkpoints due on the same day come back in an arbitrary order ("5-10" listed above "1-5").
- **Nothing shows that a checkpoint has a discussion.** Each row links to its thread, but it looks like plain text with Edit/Delete buttons. There's no comment count or status.
- **The reading target is unclear.** A free-text label ("5-10") next to "page ~50" doesn't say whether "5-10" means chapters or pages.
- **Member progress is just a word.** "Not started" or a percentage, with no sense of who's ahead or behind the schedule.
- **Past books are invisible.** The data already stores one `ClubBookRound` per book, but the page only ever shows the current one.
- **The page feels static.** There's no "what's next", no sign that anyone else is active, and confirming a book means typing every checkpoint by hand.

We compared this with Fable (spoiler-safe chapter rooms, moderator discussion prompts, reflection rooms, shared highlights), StoryGraph buddy reads (comments locked by reading progress, which is a known pain point when people read different editions) and Bookclubs.com (organizing, meaning meetings, RSVPs and polls). The organizing ideas are deferred until Argos has notifications (§4). Everything else is in scope here.

## 2. Clarifying decisions made (via questions to the user)

**Checkpoints**
- **Discussions are always open.** A checkpoint's thread never locks. The row shows a status ("upcoming", "due in 3 days", "past due") computed from the due date.
- **The reading target is a unit plus a range.** The admin picks **Pages** or **Chapters** and enters from/to numbers (e.g. Chapters 5–10). The label becomes optional (useful for things like "Part One"). Without a label, the display text is built from the range.
- **Chapter checkpoints can have an optional "about page X".** Members log progress in pages, so this approximate page is what lets a chapter checkpoint appear on the progress bar. Without it, that checkpoint gets no marker.
- **Sort order:** due date, then target page/range start, then creation time as a final tie-break.

**Progress**
- **Each member gets a progress bar** with **one marker: the next due checkpoint.** No ticks for every checkpoint.
- **"On track" means** the member's current page is at or past the target page of the **most recent checkpoint whose due date has passed**. Before the first due date, everyone is on track. A member whose log is marked Finished is always on track. A chapter checkpoint with no approximate page can't be judged, so it's skipped when looking for "the most recent due checkpoint".

**Spoilers**
- **The whole thread is blurred, with one tap to reveal it.** Each checkpoint discussion (including its highlights and the wrap-up thread) is blurred behind an "I've read this far" button. Revealing it is **saved to the member's account**, so it stays revealed on every device. It doesn't auto-unlock from logged progress (deliberately, because of the edition problem StoryGraph users report).

**Discussion**
- **Discussion prompts:** Admins/Moderators add questions to a checkpoint. **Each prompt is its own pinned thread** at the top, with replies under it. Regular comments continue below.
- **Shared highlights are quote posts on a checkpoint.** A member posts a passage (text plus optional page) with an optional note. Quotes show in a **Highlights** tab next to the comments, with the **same up/down votes and threaded replies** as comments, sorted by score.
- **Wrap-up after the book:** clicking **Finish book** opens a **"Final thoughts" discussion** for that book, and each member can **rate the book 1–5** in the club. The club shows the average.
- **A club rating also writes to the member's personal log.** Rating in the club marks the book as **Finished** in their own `Log` (creating the log if there isn't one) and saves the rating there.

**Past books**
- **Each past book shows** its cover, title, start/finish dates and the club's average rating. Clicking it opens that book's checkpoints, discussions, highlights and wrap-up.
- **Past discussions stay writable.** Members can keep posting in them. (The backend already allows this: `CheckpointDiscussionService.CreateCommentAsync` never checks the round's phase.)

**Making the page feel alive**
- **"What's next" card** at the top of the club page:
  - *Reading phase:* the next checkpoint and when it's due (linking to its discussion), your own page compared with the target (with a quick "log progress" button), and the club's pace ("3 of 5 members on track").
  - *Suggesting phase:* "Voting open · 4 suggestions · you haven't voted yet."
- **Recent activity list** on the club page, including comments/replies, progress updates, highlights, prompts and club events (member joined, book confirmed, checkpoint added, book finished, rating given). It's **spoiler-safe**: it says *where* someone posted, never *what* they wrote.
- **Schedule template** in the confirm-book step: enter a start date, the number of checkpoints, days between them, and Pages or Chapters plus the total. It fills in an even split, and the admin can still edit each row before saving.

**Delivery**
- **One spec, four phases**, each shippable on its own (§5).

## 3. Design

### 3.1 Checkpoint target and ordering

`ReadingCheckpoint` changes:

| Field | Change | Meaning |
|---|---|---|
| `Label` | becomes optional (`string?`) | Free-text name like "Part One". When empty, the UI shows the range ("Chapters 5–10"). |
| `TargetUnit` | **new**, enum `Pages` / `Chapters` | What the range counts. |
| `RangeStart` | **new**, `int?` | First page/chapter of the section. Optional. |
| `RangeEnd` | **new**, `int?` | Last page/chapter of the section. |
| `TargetPage` | **kept, new meaning** | The page used for progress markers and "on track". For `Pages` it's set automatically to `RangeEnd`. For `Chapters` it's the optional "about page X". Still advisory only. |
| `IsWrapUp` | **new**, `bool` | Marks the "Final thoughts" checkpoint (§3.6). |

- **Migration of existing rows:** `TargetUnit = Pages`, `RangeEnd = TargetPage`, and `Label` keeps its current text, so nothing visibly changes for existing checkpoints except the clearer display.
- **Validation:** `RangeStart <= RangeEnd` when both are set. Numbers are positive. For `Pages`, `TargetPage` is derived and never sent by the client.
- **Ordering:** `ReadingCheckpointRepository` sorts by `IsWrapUp` (wrap-up always last), then `DueDate`, then `RangeStart ?? TargetPage`, then `CreatedAt`.
- **Create/update/confirm requests** (`CreateCheckpointRequest`, `UpdateCheckpointRequest`, and the schedule list inside the confirm-book request) all gain `TargetUnit`, `RangeStart`, `RangeEnd`, plus `TargetPage` for chapters only.

### 3.2 Checkpoint rows: counts and status

`ReadingCheckpointDto` gains:
- `CommentCount`: non-deleted comments and replies, excluding highlights and prompts.
- `HighlightCount`
- `PromptCount`
- `IsRevealed`: whether the *caller* has tapped "I've read this far" (§3.4).
- the new target fields from §3.1.

Counts are computed in one grouped query per checkpoint list (not one query per row).

The **status is computed on the frontend** from `DueDate` and today's date. It's display-only, so the server doesn't need to know about it: "upcoming" (more than 7 days away), "due in N days", "due today" or "past due". The wrap-up row shows "after the book" instead.

**Row layout:** display label · target ("Chapters 5–10 · ~p. 120") · status · 💬 count (plus ✨ highlights count if any) · Edit/Delete for admins/mods. The whole row is the link, with a clear hover/arrow, so it reads as "go into this room".

### 3.3 Member progress bars and pace

`ClubMembershipDto` gains `CurrentPage`, `TotalPages` and `LogStatus` (all nullable, from the same batch `Log` lookup `ClubService.GetProgressForMembersAsync` already does). `ProgressPercent` stays.

The bar is drawn per member on the frontend:
- **Fill** = `ProgressPercent`. A finished log means a full bar. No log means an empty bar with a "Not started" label.
- **Marker** = the next not-yet-due checkpoint's `TargetPage ÷ that member's TotalPages`. The member's own `TotalPages` is used because editions differ. There's no marker if the member has no `TotalPages` or the checkpoint has no `TargetPage`.
- A small "On track" / "Behind" tag uses the §2 rule.

The pace rule lives in **one pure helper**, `lib/clubPace.ts` (`isOnTrack(member, checkpoints, today)`, `nextCheckpoint(checkpoints, today)`), so the bar, the "what's next" card and tests all agree.

### 3.4 Spoiler reveal

New table `CheckpointReveals(checkpoint_id, user_id, revealed_at)`, with a unique key on the pair.

- `POST /api/checkpoints/{id}/reveal` is idempotent (calling it twice is harmless). Active members only.
- Comment, highlight and prompt endpoints still return content to any active member. **The blur is a UI convenience, not a security boundary**, the same stance the original spec took on spoilers.
- `CheckpointDiscussionPage`: when `IsRevealed` is false, the thread area is blurred (CSS `filter: blur`, `aria-hidden`, not interactive) with a centered "This discussion may contain spoilers up to *Chapters 5–10*. **I've read this far**" button. The composer is hidden until the member reveals the thread. The page header, the checkpoint target and the prompt *questions* (not their replies) stay visible, so people know what they're opening.
- A member who **posts** in a checkpoint is automatically marked as revealed (the server inserts the reveal row on comment creation).

### 3.5 Prompts and highlights (one comment system)

Rather than building two new threaded systems, **prompts and highlights are kinds of `CheckpointComment`**. That way they get threading, voting, edit/delete, soft-delete and sorting for free.

`CheckpointComment` gains:
- `Kind`: enum `Comment` (default, all existing rows) / `Prompt` / `Highlight`
- `QuoteText` (`string?`, required when `Kind = Highlight`, max ~1000 characters)
- `QuotePage` (`int?`, optional, highlights only)

Rules:
- **Prompts** are top-level only (`ParentCommentId` null), and only Admins/Moderators can create them. Their `Content` is the question. They render pinned above the regular comments, in creation order (not by score), each with its own replies. Replies to a prompt are ordinary `Comment`-kind children. Prompts can't be voted on.
- **Highlights** are top-level only and any active member can post them. `QuoteText` is the passage and `Content` is the optional note (may be empty for highlights only). They're voted and replied to exactly like comments.
- **Replies** are always `Comment` kind, whatever they reply to.
- **Endpoints:** `POST /api/checkpoints/{id}/comments` gains optional `Kind`, `QuoteText` and `QuotePage`, and the server enforces the rules above (403 for a Member creating a Prompt, 400 for a Highlight without a quote or a non-top-level Prompt/Highlight). `GET .../comments` gains `?kind=comment|highlight`. Prompts are always included in the `comment` view, pinned first.
- **`CheckpointCommentDto`** gains `Kind`, `QuoteText` and `QuotePage`.
- **Discussion page UI:** **Discussion** and **Highlights** tabs. Discussion = pinned prompts, then the normal Top/New comment tree. Highlights = quote cards (styled blockquote with "p. 47" and the poster's note) sorted by score, each with votes and a reply tree. An "Add a discussion question" box is visible to Admins/Mods. A "Share a highlight" composer offers quote text, optional page and optional note.

### 3.6 Wrap-up thread and ratings

**Wrap-up thread:** `FinishBookAsync` (already atomic) additionally creates one `ReadingCheckpoint` on the finishing round with `IsWrapUp = true`, `Label = "Final thoughts"` and `DueDate = finish time`. It's an ordinary checkpoint, so it gets discussion, highlights, prompts and spoiler blur with no special code. Its row shows "after the book" instead of a due status. It's visible in that past book's view (§3.7) and is pinned as the first item in a new "Just finished" strip on the club page while the next round is still `Suggesting`.

**Ratings:** new table `ClubRoundRatings(id, club_book_round_id, user_id, rating, created_at, updated_at)`, unique per round and user, rating 1–5 (the same range `LogService.ValidateRatingAndDates` enforces).
- `PUT /api/clubs/{id}/rounds/{roundId}/rating` with `{ rating }` upserts (creates or replaces). Active members only, and only on a round that has a book (`Reading` or `Completed`).
- **Writing to the personal log, in the same transaction:** find the member's `Log` for the round's `BookId`. If there isn't one, create it with `Status = Finished`, `FinishedAt = now` and the rating. If there is one, set `Rating` and, if it isn't already Finished, set `Status = Finished` and `FinishedAt = now`. An existing personal rating **is overwritten** by the club rating, since the user just stated it. Reuse `LogService`'s existing create/update path rather than writing to the `Log` table directly, so its validation and any feed side effects stay consistent.
- `DELETE` is out of scope (§4). A member can change their rating, not remove it.
- **Exposure:** the round DTO (`GET /api/clubs/{id}/rounds`) gains `AverageRating` (null if there are no ratings), `RatingCount` and `MyRating`.
- **UI:** a "Rate this book" star row in the wrap-up checkpoint's header and in the past-book view. The club average appears next to each past book.

### 3.7 Past books

- **Club page:** a **"Books we've read"** section below the current round lists completed rounds, newest first. Each entry shows the cover, title, "Mar 3 – Apr 12", ★ average (N ratings), and links to the past-book view.
- **Past-book view:** route `/clubs/:clubId/rounds/:roundId`, a new `ClubRoundPage`. It shows the book header, that round's checkpoint list (same row component as §3.2, without edit controls for a completed round) and the rating row. Each checkpoint links to the existing `CheckpointDiscussionPage`, which is fully writable (§2).
- **Backend:** `GET /api/clubs/{id}/rounds` already exists. Extend its DTO with book cover/title, `StartedAt`/`ConfirmedAt`/`CompletedAt` (add a `CompletedAt` column to `ClubBookRound`, set in `FinishBookAsync`, and backfill existing completed rounds from the next round's `StartedAt`) plus the rating fields from §3.6. Add `GET /api/clubs/{id}/rounds/{roundId}` for the single-round header.

### 3.8 "What's next" card

A frontend-only `ClubNextUpCard` built from data the page already loads (club detail, checkpoints, members). There's no new endpoint.

- **Reading phase:**
  - "Next: **Chapters 5–10**, due in 3 days →" linking to the discussion. If every checkpoint is past due: "All checkpoints are past due. Waiting for the admin to finish the book." If there are no checkpoints, the line is hidden.
  - "You're on page 30 · target ~50" plus a **Log progress** button opening the existing `ProgressUpdateModal`, prefilled with the club's book. When the viewer has no log: "You haven't started yet" plus the same button.
  - "**3 of 5** members on track", using `lib/clubPace.ts`.
- **Suggesting phase:** "Voting open · **4** suggestions · you haven't voted yet" (or "you voted for *X*"), scrolling to the suggestions section.
- Hidden for non-members viewing a public club.

### 3.9 Recent activity

The app has no event history today, and a member's reading progress is a single current snapshot on `Log` (`Log.cs`: "a single current snapshot, not a history"). So the activity list needs its own small **append-only table**, written at the moment each action happens:

```
ClubActivities(id, club_id, round_id?, actor_user_id, kind, checkpoint_id?, data_json?, created_at)
```

- **`kind`** is one of: `CommentPosted`, `ReplyPosted`, `HighlightShared`, `PromptAdded`, `ProgressUpdated`, `MemberJoined`, `BookConfirmed`, `CheckpointAdded`, `BookFinished`, `BookRated`.
- **`data_json`** holds only spoiler-safe display data (e.g. `{ "percent": 40 }` or `{ "rating": 4 }`), **never comment or quote text**.
- **Written by** the existing services, inside the same save as the action itself: `CheckpointDiscussionService` (comments/replies/highlights/prompts), `ClubService` (join/approve, confirm, add checkpoint, finish, rate) and **`LogService`** for progress. When a log's `CurrentPage` changes, write one `ProgressUpdated` row for each club where that user is an active member *and* the current round's `BookId` matches the log's book.
- **Noise control:** consecutive `ProgressUpdated` events from the same user in the same club within 6 hours **update the existing row** (new percent, new `created_at`) instead of adding one. Deleting a comment does **not** remove its activity row, but the activity text never shows content anyway.
- **Endpoint:** `GET /api/clubs/{id}/activity?limit=20&before=<cursor>`, newest first, cursor-paginated the same way as the main feed. Private clubs are members-only, using the same visibility rule as the club detail.
- **UI:** a `ClubActivityList` on the club page (right column on wide screens, below the members on narrow ones) with "alice commented in **Chapters 5–10** · 2h", "bob is now **40%** through", "carol rated *Solaris* ★4", and so on, plus a "Show more" button.
- **Retention:** keep everything for now. It's small per club. Revisit if it grows.

### 3.10 Schedule template

This is frontend only, inside `ConfirmBookModal`, and the request shape is unchanged apart from §3.1.

- A collapsible **"Fill from template"** panel with: start date (default today), number of checkpoints (default 4), days between them (default 7), unit (Pages/Chapters) and total (defaults to the book's page count when known and the unit is Pages).
- **Generate** replaces the checkpoint rows with an even split. Checkpoint *i* covers `floor((i−1)·total/N)+1` to `floor(i·total/N)` and is due on `start + i·days`. The last checkpoint always ends exactly at the total.
- The rows stay fully editable afterwards. Generating again asks for confirmation if rows were edited.
- The pure split function lives in `lib/checkpointTemplate.ts` with its own unit tests.

## 4. Explicitly out of scope

- **Organizing features (meetings with date/place/video link, going/not-going replies, calendar files, ranked-choice voting, due-date reminders).** These need a notification system first, which Argos doesn't have (SPEC.md §4 Phase 2). They're captured in `FUTURE-IDEAS.md`.
- **Progress-gated spoiler locking.** We blur and offer one tap to reveal, and never lock based on logged pages (§2).
- **Chapter-based progress logging.** Members still log pages. Chapter checkpoints only use the optional approximate page.
- **Deleting a club rating.** Ratings can be changed, not removed.
- **Live updates** of activity/comments (websockets). Same fetch-on-action pattern as the rest of the app.
- **Separate reactions (likes/emoji) on highlights.** They use the existing up/down votes.
- **Moving activity into the main home feed.** It stays on the club page, consistent with `specs/book-clubs.md` §2.

## 5. Tasks

Each phase can be shipped and verified on its own. Within a phase, do the backend before the frontend.

### Phase 1 — Quick fixes (ordering, counts, target unit, progress bars)

#### Backend
- [x] `ReadingCheckpoint`: add `TargetUnit`, `RangeStart`, `RangeEnd`, `IsWrapUp` (wrap-up used in Phase 3, but add the column now to avoid a second migration on the same table); make `Label` nullable. Migration `ImproveCheckpointTargets` with the §3.1 backfill (and a `Down` that gives range-only checkpoints a text label before making `Label` non-nullable again). Applied to the local dev Postgres.
- [x] Request DTOs + validation (§3.1) for create/update/confirm. All three requests now share one base class, `CheckpointTargetFields`, and one validator, `Services/CheckpointTargetValidator.cs`. `TargetPage` is derived for `Pages`. **Added beyond the spec:** for backward compatibility, a Pages request that sends only `TargetPage` (the old shape, e.g. the Bruno collection) has it treated as `RangeEnd` rather than silently dropped. The rule is now "label or range end required" (was "label required").
- [x] `ReadingCheckpointRepository` ordering per §3.1.
- [x] `ReadingCheckpointDto`: new target fields + `CommentCount` (one grouped count query, `ICheckpointCommentRepository.CountByCheckpointIdsAsync`). The three copies of the entity→DTO mapping (two controllers + `ClubService`) collapsed into one `ReadingCheckpointDto.From`. `HighlightCount`/`PromptCount`/`IsRevealed` come in Phase 3.
- [x] `ClubMembershipDto`: `CurrentPage`, `TotalPages`, `LogStatus` from the existing batch log lookup (now returns a small `MemberProgress` record instead of just the percent).
- [x] Tests (`Integration/ClubCheckpointImprovementsTests.cs`, 8 tests): same-due-date checkpoints come back in range order; Pages derives `TargetPage` from `RangeEnd`; Chapters keeps the optional approximate page; legacy `TargetPage`-only becomes `RangeEnd`; start > end → 400; confirm-book with no label or range → 400; comment count excludes a soft-deleted comment; member DTO carries raw log values. **Deviation:** the migration backfill isn't covered by an automated test (the test database is migrated from empty, so there are no old rows to backfill). Instead it was checked by applying the migration to the dev database and querying the 6 existing checkpoints: each kept its label and got `RangeEnd = TargetPage`.

#### Frontend
- [x] Types + API client updates (`CreateCheckpointRequest`/`UpdateCheckpointRequest` are now aliases of `CheckpointRequestItem`).
- [x] `lib/checkpointDisplay.ts`: title (label or "Chapters 5–10"), secondary detail ("Chapters 1–5 · ~p. 80") and due status text (§3.2), with unit tests. Due dates are compared as calendar days, since they're stored as UTC midnight of the chosen day.
- [x] `lib/clubPace.ts`: `nextCheckpoint`, `lastDueJudgeableCheckpoint`, `isOnTrack`, `markerPercent` (§2/§3.3), with unit tests covering before-first-due, finished log, chapter checkpoint with no page, and member with no `TotalPages`. Note: the finished status is `LogStatus 'Read'` in this codebase, not "Finished" as the spec text says.
- [x] Checkpoint row redesign (§3.2): whole row links (hover border + arrow), title + target detail, status pill, 💬 count.
- [x] Checkpoint add/edit form + `ConfirmBookModal` rows share one new `CheckpointFields` component (Pages/Chapters toggle, from/to, "~ page" for Chapters only, optional label, due date) and one `lib/checkpointForm.ts` (form state, client-side validation mirroring the server, request mapping). The club page now validates before submitting. New rows in the confirm step keep the previous row's unit.
- [x] `MemberProgressBar` with fill, next-checkpoint marker and On track/Behind tag (§3.3) in the members list while the round is Reading (suggesting phase keeps the plain text).
- [x] Tests: `checkpointDisplay.test.ts`, `clubPace.test.ts`, `checkpointForm.test.ts`, `MemberProgressBar.test.tsx`, plus new `ClubPage.test.tsx` cases (rows in server order with title/detail/status/count; a progress bar per member). Existing `ClubPage`/`ConfirmBookModal`/`CheckpointDiscussionPage` tests updated to the new form and fields. Also: `CheckpointDiscussionPage` now titles by `checkpointTitle` and formats the due date in UTC (it could show the previous day west of UTC).

### Phase 2 — What's next, past books, schedule template

#### Backend
- [x] `ClubBookRound.CompletedAt` + migration `AddRoundCompletedAt` with backfill (a completed round's `CompletedAt` = the next round's `StartedAt`); set in `FinishBookAsync`. Applied to the dev database, where the one completed round got its date.
- [x] Round DTO: `CompletedAt` added (book cover/title were already there). `GET /api/clubs/{id}/rounds/{roundId}` (`ClubService.GetRoundAsync`, members only). The two duplicate entity→DTO mappers collapsed into `ClubBookRoundDto.From`.
- [x] Tests (added to `ClubCheckpointImprovementsTests.cs`, 4 tests): finish sets `CompletedAt` and the rounds list is newest first with book info; single round for a member; a round of another club → 404; a non-member → 403 (the rounds endpoints require active membership for public clubs too, not only private ones).

#### Frontend
- [x] `ClubNextUpCard` (§3.8), both phases. `ProgressUpdateModal` gained an optional `bookId` prop: it skips the chooser and edits the viewer's newest log for that book, or starts one. The club detail is refetched on save so the bars move.
- [x] `PastBooksSection` ("Books we've read") + `ClubRoundPage` at `/clubs/:clubId/rounds/:roundId` (§3.7). The checkpoint row was extracted into a shared `CheckpointRowLink` component; on a completed round it shows the plain due date instead of "Past due". Ratings slot in during Phase 3.
- [x] `lib/checkpointTemplate.ts` + `ScheduleTemplatePanel` ("Fill from template…") in `ConfirmBookModal` (§3.10). It only asks for confirmation when existing rows have been edited. **Deviation:** the total has no default, because Argos doesn't store a book's page count (`BookDto` has no pages field).
- [x] Tests: `ClubNextUpCard.test.tsx` (reading with/without log, all past due, no checkpoints, suggesting voted/not voted, non-member renders nothing); `ClubRoundPage.test.tsx` (past-books list shows only completed rounds; round page header and plain due dates); `checkpointTemplate.test.ts` (even and uneven splits, month rollover, validation); `ConfirmBookModal.test.tsx` (template fills rows and submits them, asks before replacing edited rows, validation); `ProgressUpdateModal.test.tsx` (bookId edits the newest log, starts one when none, chooser unchanged without bookId). Four existing `ClubPage` tests were scoped to the checkpoint list, since the card now also names the next checkpoint.

### Phase 3 — Spoiler blur, prompts, highlights, wrap-up and ratings

#### Backend
- [x] `CheckpointReveals` table (composite key, `INSERT ... ON CONFLICT DO NOTHING` so a double tap can't fail) + `POST /api/checkpoints/{id}/reveal`; auto-reveal on posting; `IsRevealed` on `ReadingCheckpointDto` (§3.4).
- [x] `CheckpointComment`: `Kind`, `QuoteText` (max 1000), `QuotePage`. Migration `AddClubDiscussionFeatures` (existing rows → `Comment`; the dev database's 4 comments checked). Soft-deleting a highlight also clears its quote.
- [x] `CreateCommentAsync` rules for prompts/highlights (§3.5); `?kind=highlight|comment` filter; prompts pinned first in creation order with their replies sorted; prompts can't be voted on (400). Editing a highlight edits its note, which may be empty. `HighlightCount`/`PromptCount` on the checkpoint DTO (counts now grouped by kind in one query).
- [x] `FinishBookAsync` creates the wrap-up checkpoint in the same save as completing the round (§3.6); the checkpoint list always sorts it last.
- [x] `ClubRoundRatings` table + `PUT .../rounds/{roundId}/rating` (§3.6). **How "one transaction" was done:** `LogService.StageClubRatingAsync` and `IClubRoundRatingRepository.Track` stage their changes without saving, and a single `SaveChangesAsync` commits both, since they share the request's DbContext. `ILogRepository` gained `Track` for this. Round DTO gains `AverageRating`/`RatingCount`/`MyRating` (filled by the rounds endpoints, not the club detail's `currentRound`). `ClubQueryResult` gained an `Invalid` case for the 400s. Note: the finished status is `LogStatus.Read`.
- [x] **Added beyond the spec:** `GET /api/checkpoints/{id}` and `ClubBookRoundId` on the checkpoint DTO. The discussion page used to find its checkpoint in the *current* round's list only, so discussions of past books (Phase 2) showed no title, and the wrap-up, which lives on the finished round, would have been broken.
- [x] Tests (`Integration/ClubDiscussionFeaturesTests.cs`, 13 tests): reveal is idempotent and per-user; posting auto-reveals; non-member reveal → 403; a Member creating a Prompt → 403; prompts pinned first with replies, can't be voted on; a Highlight without a quote → 400; a nested prompt/highlight → 400; highlights only in the highlights view, by score, counted correctly; finish-book creates exactly one wrap-up, sorted last, reachable by id; rating creates a Read log when there's none, finishes an in-progress log and overwrites its rating (keeping its progress), updates rather than duplicates, averages across members; out-of-range rating or a round with no book → 400. The existing lifecycle test now expects the extra wrap-up checkpoint.

#### Frontend
- [x] `CheckpointDiscussionPage` rewritten: loads its checkpoint by id; blurred thread (`filter: blur`, `aria-hidden`, `inert`) behind "I've read this far" (§3.4); the header, target and question texts stay visible while blurred; composers hidden until revealed.
- [x] Discussion / Highlights tabs (with counts); pinned questions with answer trees; "Add a discussion question" (Admins/Mods only); "Share a highlight" composer (quote, optional page, optional note). `CommentTree` extended rather than forked: a "Question" badge and pinned style with no votes ("Answer" instead of "Reply"), and highlights as a serif quote card with "p. N". Any post or edit refreshes both tabs and the counts.
- [x] Wrap-up row ("After the book", already in Phase 2's row component), `JustFinishedStrip` on the club page while Suggesting, `RoundRating` (reusing the app's existing `StarRating`) in the wrap-up header, the strip and `ClubRoundPage`; average shown in "Books we've read".
- [x] Highlight counts on checkpoint rows (✨ N, only when there are any). Question counts are on the DTO but not shown on rows, to keep rows short.
- [x] Tests: `CheckpointDiscussionPage.test.tsx` (blurred with questions visible, then revealed on tap; admin adds a question that renders pinned without votes; member doesn't see the question composer; highlights tab renders quote cards and shares one; Final thoughts shows and saves a rating); `ClubRoundPage.test.tsx` (average on past books; "Just finished" strip). Fixtures in seven existing test files updated for the new fields.

### Phase 4 — Recent activity

#### Backend
- [x] `ClubActivities` table + migration `AddClubActivities` (applied to the dev database; history starts empty, since nothing before this was recorded). **Deviation:** instead of a free-form `data_json`, a single nullable `Value` int (percent for progress, stars for a rating). That's simpler and spoiler-safe by construction, because there's nowhere to put text. Checkpoint and round links use `SetNull`, so an entry survives a deleted checkpoint.
- [x] Writes go through a new `IClubActivityRecorder` (`Services/ClubActivityRecorder.cs`). It only *stages* entries, and the calling service's own save commits them with the action. Hooked into `CheckpointDiscussionService` (comment/reply/highlight/question), `ClubService` (public join, invite-link join to a public club, request approval, confirm, add checkpoint, finish, rate) and `LogService` (create, or an update that changes the current page → every club currently reading that book with the user as a member, via a new `GetReadingRoundsForMemberAsync`). Progress within 6 hours updates the existing entry. **Added beyond the spec:** re-rating also updates the member's existing `BookRated` entry instead of adding another. A private club's join *request* isn't recorded until it's approved.
- [x] `GET /api/clubs/{id}/activity?limit=&before=&beforeId=` with cursor pagination (`CursorPageResponse`). Members only, matching the club detail. Known minor quirk: a merged progress/rating entry moves to the top with a new timestamp, so someone paging at that exact moment could see it twice.
- [x] Tests (`Integration/ClubActivityTests.cs`, 7 tests): every kind written exactly once by its action, newest first, with checkpoint/book/value filled; the raw response never contains comment, quote or note text; re-rating updates; progress only for the club's book and merged inside 6 hours; a new entry after the window; a private request recorded only on approval; pagination without overlap; non-member → 403. `LogService`'s two unit-test constructions got a no-op `FakeClubActivityRecorder`.

#### Frontend
- [x] `ClubActivityList` with a sentence per kind ("commented in **Chapters 1–5**", "is now **40%** through *Solaris*", "rated *Solaris* ★4"), avatars, relative times and "Show more" (§3.9). **Deviation:** placed as a full-width section near the bottom of the club page (above "Books we've read") rather than a right column, since the club page is a single column today. The list is refreshed after club actions (posting, rating, joining, finishing, logging progress), so the 60-second cache doesn't hide new entries.
- [x] Tests: a new `ClubPage.test.tsx` case renders four kinds as spoiler-safe sentences, links the checkpoint, and checks "Show more" passes the cursor. The file got default empty mocks for activity and rounds, which the page now queries on mount.

### Verification & docs
- [x] After each phase: ran the full backend and frontend test suites, plus `tsc -b`/build and eslint on touched files. Final totals: backend 194 tests (162 before this spec), frontend 210 (155 before), all passing.
- [x] Migrations applied to the local dev database after each phase, with the backfills checked by querying the real rows. **Browser click-through done 2026-10-06** (Playwright, two accounts, desktop and 390 px, all five themes): suggest → vote → confirm with the template (3 checkpoints, pages 1–100 / 101–200 / 201–300, a week apart) → reveal ("I’ve read this far") → post → finish → rate (club average shown) → activity lists each step. Fixed along the way: "What’s next" said "Voting open · 0 suggestions · you haven’t voted yet" with a "Vote now" button when nothing was suggested (now "No books suggested yet" + "Suggest a book"); the vote button's only label was "▲ 2" (now "Vote for Dune, 2 votes", with `aria-pressed`); on phones a checkpoint row's → arrow wrapped onto a line of its own.
- [x] Re-read this spec against what was built; deviations are noted inline on each task.
- [x] `CHANGELOG.md` entry per phase. `specs/book-clubs.md` §4 now points here for spoiler handling.
