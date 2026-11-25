# Feature Spec — Likes and comments on each progress step

**Status:** 🔨 Backend built 2026-11-24 (Apollon, not pushed: the old reading endpoints are gone, so it ships with the frontend). Frontend next. Asked by the user, looking at the reading update viewer (page 401 of *Proyecto Hail Mary*): "I want to … like and comment each progress step as different things". And: "each time you can like should be a step right? not a whole book level thing."

Builds on `specs/reading-stories.md` (reading likes and comments), `specs/reading-update-redesign.md` §4 (`ReadingProgressEntries`, the journey line) and `specs/progress-update-notes.md` (private notes on points). Also adds the missing notifications for likes on feed activity rows (§6).

## 1. Problem

The reading update viewer has one ♥ and one comment thread for the whole reading (`ReadingLike` on the `LogId`, `CommentTargetType.Reading`). A friend at page 120 and the same friend at page 401 are different moments, but a like or a comment can't say which one it's about, and every comment piles into one thread.

## 2. Decisions

1. **The thing you like and comment on is a progress step, never the whole book.** A step is one `ReadingProgressEntry` (one dot on the journey line). The reading-level ♥ and thread go away.
2. **Existing reading likes and comments move to the reading's latest visible step** (one migration, §3.3). Nothing is lost; an old "loving this book!" ends up on the step that was current when it was moved.
3. **A step with a like or a comment is frozen.** Today a change within the same hour moves the hour's point (`ReadingProgressRepository.StageAsync`, `OnePointPer`). Once someone has liked "p. 380", a later update in that hour must start a new point, not turn it into "p. 401". Same rule a private note already gets.
4. **Only steps followers can see can be liked or commented.** Note-only points are hidden from the story (`progress-update-notes.md` §2.4). The like and comment endpoints use the same visibility filter as the story's history (`GetLatestAsync`), so a hidden step answers 404 and can't be found by guessing.
5. **Who can see, like and comment: unchanged.** The owner and their followers (`ReadingAccess.CanViewAsync`), 404 for anyone else, no liking your own step, the owner can delete any comment on their own step.
6. **Each step keeps its conversation after it drops off the line.** The line draws only the latest few dots; older steps with likes or comments stay reachable (§4).
7. **Deleting the reading deletes its steps and with them their likes and comments.** Same as today, one level down.
8. **Every story has a step** (added while building). Steps were only written when the place changed, so a book just started with no page had none, and nothing to like once the reading-level ♥ went. Now a Currently reading log always gets a visible step: on create, and on an update that leaves it Currently reading with none (`EnsureVisibleStepAsync`). It has no place until a page is typed; a page typed within the hour moves it, unless it was already liked. The migration gives one to every current story without a visible step too. (The app does this for any Currently reading log, even one with review text, which isn't a story; harmless, noted in review.)

## 3. Backend

### 3.1 Data

- New `ProgressStepLike` (`EntryId`, `UserId`, `CreatedAt`), key `(EntryId, UserId)`, cascading on the entry and the user. Same shape as `ReadingLike`.
- `CommentTargetType` gains `ProgressStep` (`TargetId` = the entry id). Whole-post comments only, no highlights, like `Reading`.
- `ProgressPointDto` gains `Id`, `LikeCount`, `ViewerHasLiked`, `CommentCount` and `LikedBy` (the first few likers, as `ActivityItemDto.LikedBy` today).
- `ActivityItemDto.LikeCount` / `ViewerHasLiked` / `CommentCount` / `LikedBy` for a reading become the latest step's values, so the strip tiles and the "You" tile keep working. The "You" tile total sums all steps.

### 3.2 Freezing a step

`StageAsync` merges into the hour's latest point only when it has no note **and** no like **and** no comment. Otherwise it starts a new point.

### 3.3 Migration

`ProgressStepLikesAndComments`:
1. For each reading with likes or comments but no visible step (older readings from before the journey line), create one step at the log's current place, dated at its `ProgressUpdatedAt` (or `UpdatedAt`).
2. Copy each `ReadingLike` into `ProgressStepLike` on the reading's latest visible step.
3. Move each `Reading` comment (and its replies) to `ProgressStep` with the step's id.
4. Drop the `ReadingLike` table; `CommentTargetType.Reading` stays only as a retired value (not reused).
5. Move existing `Like` and `Comment` notifications on readings to the step as well (subject type `ProgressStep`).

Written by hand, tested against a copy of real-shaped data first (a reading with no steps, one with only note steps, one with replies).

### 3.4 Endpoints

- `POST /api/progress-steps/{id}/like`, `DELETE /api/progress-steps/{id}/like`: 204; 404 if the step is hidden or the viewer can't see the reading; 400 on your own.
- `GET /api/progress-steps/{id}/comments`; create, edit, delete and vote through `/api/annotation-comments` with `targetType: "ProgressStep"`.
- `GET /api/readings/{logId}/steps?before=`: older visible steps, a page at a time, with their counts (§4 "earlier steps"). Built as `{ items: ProgressPointDto[], hasMore }`, newest first, 20 per page; `before` is the id of the oldest step already shown (an id that isn't a visible step of that reading gives an empty page).
- The old `/api/readings/{logId}/like` and `/comments` endpoints are removed in the same release as the frontend.
- Built: `ActivityItemDto` also gains `totalLikeCount` / `totalCommentCount` (all visible steps, for the "You" tile). A story's `progressHistory` points are the last five visible steps; the latest step can have no place (decision 8). `NotificationSubjectDto` gains `logId`, `page`, `minute`, `chapter` (a step, or a comment upvoted on one) and `activityType`, `listId`, `clubName`, `percent`, `itemCount` (an activity row; `title` is the list's name for list rows, else the book's).

### 3.5 Notifications

- `NotificationSubjectType.ProgressStep`. Likes use `LikedAsync` / `SyncLikesAsync` (one grouped row per step: "Ana and 2 others liked your update at p. 401"). Comments and replies use the existing comment notifications.
- The notification text names the place: page, chapter or audiobook time, same formats as the journey line.
- A notification disappears when its step does (the existing "still exists" check in `NotificationRepository`).

## 4. Frontend (reading update viewer)

- **Tap a dot to select its step.** The ♥, "A Yessyess le encantó" and the comment box act on the selected step. The latest step ("hoy") is selected on open, so doing nothing works like today.
- **Selected dot looks selected** (the ring "hoy" has now moves to it); its label (date + page) is bold.
- **Small marks on dots** that have likes or comments (a tiny ♥ or 💬 dot above it, not a number). Counts appear only for the selected step.
- **The selected step is named above the comment box:** "p. 320 · 15 nov". Placeholder stays "Anima a {{name}}…".
- **"Earlier steps"** link at the left end of the line when older steps exist; opens a simple list (place, date, ♥/💬 counts), tapping one selects it.
- **Dots must be easy to tap on a phone:** a 44 px tap area around each dot even though the dot stays small; arrow keys move between steps when the line has focus; each dot has an `aria-label` ("Page 320, 15 November, 2 likes, 1 comment").
- Notification links open the viewer with that step selected.
- All new text in the five locale files.

## 5. Out of scope

Likes and comments on your own private notes; reactions other than ♥; showing a step's comments in the Feed row. Add if asked.

## 6. Also in this spec: notifications for likes on feed activity rows

Found in the same conversation: liking an activity row ("started *Dune*", "added 3 books to *Summer list*", a club's progress) saves the like (`ActivityService.SetLikedAsync`) but never notifies.

- `NotificationSubjectType.ActivityEvent`; `SetLikedAsync` / unlike call `LikedAsync` / `UnlikedAsync`; `SyncLikesAsync` counts `ActivityLikes`.
- Text per activity type ("liked that you started *X*", "liked that you finished *X*", "liked your new list *Y*", "liked that you added 3 books to *Y*", club progress), five languages.
- Merged feed rows: check how a merged row's like is stored before building, so a like on a merged row gives one notification, not one per event inside it. **Checked:** a merged row has no heart of its own (`MergedActivityCard`); each reader's event inside "Show all" keeps its own, so a like is always one event and one notification.
- The notification disappears when the event is deleted (the owner can always see their own event, so visibility changes don't hide it).

## 7. Tasks

**Backend** (high effort: the migration, the freeze rule and the hidden-step rule)
- [x] `ProgressStepLike` entity + config; `CommentTargetType.ProgressStep`; `NotificationSubjectType.ProgressStep` and `ActivityEvent`.
- [x] `StageAsync` freeze rule (§3.2).
- [x] Step access (visible-step filter shared with `GetLatestAsync`), like/unlike service, endpoints (§3.4), comment target handling.
- [x] `ProgressPointDto` ids and counts; `ActivityItemDto` counts from the latest step; "You" tile sum.
- [x] Migration `ProgressStepLikesAndComments` (§3.3), including notifications.
- [x] Notifications for step likes and comments (§3.5) and for activity-row likes (§6).
- [x] Integration tests: like/unlike/comment a step; hidden note-only step 404; non-follower 404; own step 400; freeze (like then same-hour update makes a new point); migration on the three shapes; earlier-steps paging; notification text and grouping; activity-like notification and its removal; deleting the reading removes everything. Built as `ProgressStepTests` and `ProgressStepMigrationTests` (five shapes: no steps, only a note step, visible steps with a later note step and a reply, a quiet current story, a finished reading); `ReadingStoriesTests`, `ReadingVisibilityTests`, `BlocksReachLikesTests` and `ReadingProgressHistoryTests` moved to steps. Full suite 2146/2146. (Notification *text* is frontend: the backend sends the place and kind, no words.)

**Frontend** (medium effort)
- [ ] Types and API calls; `LikeButton` `progressStepId` target (also updates the cached activity list); remove the reading target.
- [ ] Viewer: selectable dots, marks, selected-step label, comments per step, earlier-steps list, keyboard and `aria-label`s.
- [ ] Notification rows and links for step likes/comments and activity-row likes.
- [ ] Strings in five languages; Vitest for selection, like on a non-latest step, comments switching with the step, earlier steps.

**Verification**
- [ ] `reviewer` pass; `argos-security` (privacy of hidden steps, access, the migration). **Backend done 2026-11-24:** reviewer, all low: ties in the story history now broken by id, like the steps list and the migration; the start step is also added for a Currently reading log with review text (harmless, kept). Security, one low, fixed: the added step was dated at the save, so a note-only save on a reading with no visible step showed a fresh dot that gave the note away; now dated at `ProgressUpdatedAt` (test `APrivateNoteOnAReadingWithNoStep_…`). Informational, kept: the freeze tells the owner that *some* reaction exists on a step even when they can't see it (a suspended liker, a hidden comment). Frontend review still to do.
- [ ] `web-design` screenshot critique of the viewer (desktop and 375 px, light and dark).
- [ ] Browser check: two readers; like and comment on an old step and the latest one; same-hour update after a like makes a new dot; notification opens the right step; a note-only step never shows to the follower; liking a feed activity row notifies.
