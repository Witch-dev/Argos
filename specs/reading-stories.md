# Feature Spec — Reading Stories (story viewer, likes, comments)

**Status:** ✅ Implemented (2026-10-04)

## 1. Problem

The home page's "Readings" strip (`specs/reading-progress-tracking.md` §3.4/§3.5) shows one book cover per friend. Clicking one opened `ActivityItemPopover`, a small card always pinned to the top-left of the screen, so it seemed to belong to the wrong tile, and you could only look, not respond.

The user wants the strip to work like Instagram stories, and wants people to be able to **like and comment on each story**: "the idea is to be able to have conversation around books." Research on other reading apps (in the conversation that started this spec) points the same way. Fable's social progress updates are its most praised feature. Commenting on friends' reading updates is one of StoryGraph's most requested features. Goodreads users complain about a cluttered, algorithmic feed and want to plainly see what their friends are reading.

## 2. Clarifying decisions

- **A story is one `Log`.** The strip's data is already one item per `Log` (`ActivityItemDto.logId`). The story keeps its likes and comments as its owner moves it from want-to-read → page 95 → page 260. The conversation is about *this person's read of this book*, which is the point.
- **Stories don't expire.** Unlike Instagram, there's no 24-hour cutoff. Reading progress changes slowly, so a 3-day-old update is still news.
- **Grouped by person, manual navigation only.** One tile per friend (their newest cover). Opening it steps through that friend's recent stories (up to 5), then on to the next friend. **No auto-advance timer**: the card has a note and a comment thread to read, and auto-advancing too fast is the most common complaint about stories.
- **Likes and comments separate from the review's.** Once a log gets review text it leaves the strip and becomes a review (`specs/home-dashboard-redesign.md`), with its own likes (`ReviewLike`) and comment thread (`CommentTargetType.Review`). Story comments ("how far are you?") belong to the reading, not the finished review, so they get their own target type and like table and aren't merged in.
- **Who can see, like and comment: the owner and their followers.** That's exactly who sees the story in the strip today (`FeedService.GetActivityAsync`). Blocking removes follows (`BlockService`), so a blocked user loses access too. Someone who doesn't follow the owner gets 404, never 403, so a story's existence doesn't leak (same rule as `ReviewAccess`).
- **You see your own stories.** Without notifications, the owner would never find out someone commented. Your own stories appear as a "You" tile right after the "+" tile, with a count of likes and comments, so the conversation can actually go both ways.
- **"Seen" is stored in the browser for now.** Unseen friends get the accent ring and sort first; seen ones fade. Kept in `localStorage`, so it doesn't follow you to other devices (good enough for a first version; see out of scope). Your own tile is never "new".
- **A story's time is when the reading last moved, not when the log was created.** Added in review: without it, moving page 95 → 260 on a book started months ago would sit at the back of the strip saying "3 months ago". `Log.ProgressUpdatedAt` is set on create and whenever status, page, page count or note changes.
- **The owner can delete any comment on their own story.** Added after the security review: follows are open, so blocking is the only real gate, and blocking doesn't remove what someone already wrote. Edits re-check access, so someone unfollowed or blocked can no longer rewrite their comment (they can still delete it). You can't like your own story (400, as with reviews).

## 3. Design

### 3.1 Data

- New `ReadingLike` (`LogId`, `UserId`, `CreatedAt`), primary key `(LogId, UserId)`, cascading on both the log and the user. Same shape as `ReviewLike`/`ListLike`. Migration `AddReadingLikes`.
- `CommentTargetType` gains `Reading` (`TargetId` = the `LogId`). Reuses the existing `Comment` table, replies, edit, delete and voting. No schema change: the enum is stored as an int.
- `Log.ProgressUpdatedAt` (migration `AddLogProgressUpdatedAt`, existing rows backfilled from `CreatedAt`), see §2. Exposed as `ActivityItemDto.updatedAt`.
- Deleting a log deletes its Review and Reading comment threads (`LogRepository.DeleteAsync`); likes cascade by FK.

### 3.2 Access rule — `ReadingAccess`

`CanViewAsync(log, viewerId)`: true when the viewer owns the log, or follows its owner. Used by likes and by `CommentService.GetTargetContentAsync` for `Reading` targets. Like `List` targets, `Reading` takes whole-post comments only, no highlights (there's no body of text to anchor to).

### 3.3 API

- `POST /api/readings/{logId}/like` and `DELETE /api/readings/{logId}/like`: 204, or 404 when the viewer can't see the story. Liking twice is a no-op (`ON CONFLICT DO NOTHING`).
- `GET /api/readings/{logId}/comments`: the comment tree, via `AnnotationCommentsController`. Creating, editing, deleting and voting go through the existing `/api/annotation-comments` endpoints with `targetType: "Reading"`.
- `GET /api/feed/activity` changes:
  - Returns up to **5 most recent stories per person** (it used to return 1), for followed users **plus the viewer**, newest by `ProgressUpdatedAt`. `limit` still caps the number of *people* (the viewer counts as one). Both caps run in SQL (a lateral subquery per person), never a whole shelf in memory.
  - `ActivityItemDto` gains `likeCount`, `viewerHasLiked` and `commentCount`.
  - The frontend groups the items by `userId`.

### 3.4 Frontend

- **`ActivityStrip`**:
  - Tiles in this order: "+", then a "You" tile (only if you have stories), then one tile per friend: unseen first, newest first within each.
  - Unseen friends get an accent ring.
  - The You tile shows a small ♥/💬 total.
  - Clicking a tile opens `StoryViewer` at that person.
- **`StoryViewer`** (replaces `ActivityItemPopover`): a centered dialog (full screen on phones) showing:
  - Segment bars across the top ("2 of 3").
  - The person (avatar and name, linking to their profile) and how long ago the update was.
  - A large cover, the title (linking to the book), the status, the progress bar and the note.
  - A ♥ like button.
  - The comment thread (`AnnotationCommentThread` with `targetType="Reading"`).
- **Navigation**:
  - ‹ / › buttons and the ← / → keys step through stories; at the end of one person's stories it moves on to the next person's.
  - Esc, × and clicking the backdrop close the viewer.
  - Focus moves into the dialog when it opens and goes back to the tile when it closes.
  - Arrow keys are ignored while you're typing a comment.
- Viewing a story marks it seen (`localStorage` key `argos.seenStories`, wrapped in try/catch). Entries are `logId:status:currentPage`, so a page update makes the story new again; the newest 500 are kept.
- The viewer tracks the current story by user and log ID, not list position, so a background refetch can't shift it onto another story; if the person drops out, it closes. Esc in a comment with a draft only leaves the box, and the backdrop closes only on a click that starts on it. The dialog wraps the ‹ / › buttons and keeps Tab inside.
- Liking writes the new state into the cached activity list as well as the button, so stepping away and back never shows a stale like.
- `LikeButton` gains a `readingId` target.

## 4. Explicitly out of scope

- **Notifications** ("farid_k commented on your story"). The You tile is the stand-in. This should be its own feature.
- **Storing "seen" on the server** (sync across devices).
- **Auto-advance timer and swipe gestures.** Clicking or tapping the side buttons works on phones too.
- **A history of progress updates.** A story is still the single current snapshot on the `Log` (`specs/reading-progress-tracking.md` §2).
- **Privacy of the strip itself.** It ignores `Log.Visibility` today (a "Private" review-visibility setting doesn't hide reading progress from followers). Unchanged here; flagged for the user.

## 5. Tasks

### Backend

- [x] `ReadingLike` entity, DbContext config, migration `AddReadingLikes`.
- [x] `CommentTargetType.Reading`; `CommentService` handles it (access via `ReadingAccess`, no highlights).
- [x] `ReadingAccess` + `ReadingSocialService` (like/unlike) + `ReadingsController`.
- [x] `GET /api/readings/{id}/comments` in `AnnotationCommentsController`.
- [x] Activity: up to 5 stories per person, include the viewer, add like and comment counts.
- [x] Review fixes: `Log.ProgressUpdatedAt` + migration `AddLogProgressUpdatedAt`; activity caps in SQL; comment edit re-checks access; story owner can delete any comment on it.
- [x] Tests: `ReadingStoriesTests` (stories per person incl. your own, likes, comments and privacy, highlight rejection, moderation, page update reorders, comment cleanup on delete), `FeedServiceTests`. Full suite 326/326.

### Frontend

- [x] Types and API: `CommentTargetType` adds `'Reading'`; `ActivityItemDto` counts + `updatedAt`; `likeReading`/`unlikeReading`; comments path `readings`.
- [x] `LikeButton` `readingId` target (also updates the cached activity list).
- [x] `StoryViewer` component with navigation, keyboard, focus trap, like and comments.
- [x] `ActivityStrip`: grouped tiles, You tile, seen ring; `ActivityItemPopover` removed.
- [x] `AnnotationCommentThread`/`AnnotationCommentNode`: optional `targetOwnerId` lets the story owner delete.
- [x] Tests: `ActivityStrip.test.tsx` (grouping, navigation across people, keyboard, seen, likes incl. step-away-and-back, Esc with a draft, owner delete), `readingStories.test.ts`. Full suite 369/369; build and lint clean.

### Verification & docs

- [x] Live check with Playwright against a separate API/Vite pair (ports 5259/5174), desktop light and phone dark: strip, viewer, next person, like, comment, own story with likes and others' comments, seen fading. No console errors.
- [x] `reviewer` + `security-review` pass. Fixed: stale like state, position tracked by index, story time used `CreatedAt`, unbounded activity query, Esc/backdrop losing drafts, dialog not containing its arrows or trapping focus, own tile showing as new, blocked commenters editing, owners unable to remove comments. Not fixed (informational): 403 vs 404 on someone else's comment ID; the access rule accepts any log, not only review-less ones.
- [x] `CHANGELOG.md` entry; `specs/reading-progress-tracking.md` §3.5 marked superseded; `SPEC.md` data model.

### Open question for the user

- `GET /api/logs?userId=` already returns anyone's logs, including the progress note, to anyone, signed in or not. The strip only shows a subset of that to followers. Whether "Private" should also hide reading progress and notes is a separate privacy decision, not part of this feature. **Decided 2026-10-04:** handle it with account-level privacy (public vs private account, with follow requests), captured in `FUTURE-IDEAS.md`.
