# Feature Spec — Notifications (the bell)

**Status:** Specced 2026-10-11. Backend built 2026-10-11 (reviewed by `reviewer` and `argos-security`); frontend built 2026-10-11 (reviewed by `reviewer`); browser pass done 2026-10-11, manual plan in `testing/notifications.md`. **Done.** Roadmap Stage 5.

## 1. Problem

Nobody finds out when something happens to them. A reply, a like, a follow request, a club invite or a list invite only shows up if the reader happens to open the right page. Several specs already named this and used stand-ins: the "You" tile in the Readings strip (`specs/reading-stories.md`), the Clubs nav dot and "You're invited" strip (`specs/find-readers-discovery.md`), the "Pending invites" box on Lists, and the follow-requests badge in Settings (`specs/account-privacy.md`). Club organizing tools are blocked on this too (`FUTURE-IDEAS.md`).

This spec adds an **in-app bell**: a list of things that happened to you, an unread count, and a switch for each type. It is **quiet by default**, because the product research (`PRODUCT-ANALYSIS.md`) says Fable is criticised for sending too many.

## 2. Decisions

Asked 2026-10-11, all four answered with the recommended option:

- **Events in version 1:** new follower, follow request, likes, comments on your things, replies to your comments, club invites, list collaborator invites, "checkpoint due in 2 days". **No @mentions:** Argos has no mention feature (no `@username` parsing or autocomplete), so mentions are a later feature that plugs into this one.
- **Likes are grouped per item:** one row, "elena and 3 others liked your review of Dune", updated in place as more arrive. Likes never create a row per person.
- **Defaults:** things aimed at you directly are on (follow request, new follower, comment, reply, invite, checkpoint due). **Likes are off** until the reader turns them on. One switch per type group in Settings.
- **The weekly email digest is deferred** to after launch (own roadmap box). Nothing in this spec sends email.

Decided while writing the spec (change any of these before building):

- **Stored rows, written at the moment of the event**, the same way `ActivityRecorder` writes `ActivityEvents`. Not computed on read from other tables: read state, grouping and "turned off" all need a row to hang on. `ActivityEvents` is *not* reused, since it records the author's own reading history for the Feed, not "something happened to you".
- **No content in the row.** A notification stores who, what kind, and which thing it points at. The text is built on read from that, in the reader's language. No comment text is copied (so deleting or editing a comment can't leave a stale copy, and a private snippet can't leak).
- **No real-time push.** The site asks for the unread count every 60 seconds while the tab is visible and when it regains focus. No websockets or queues (SPEC.md §5).
- **Following you and requests are separate types.** On a private account the request shows "asked to follow you" with the existing approve / decline; once approved it is not announced again as "new follower". The Settings requests list and badge stay.
- **A turned-off type creates no rows.** Turning it on later does not backfill what was skipped.
- **Existing stand-ins stay** (Clubs dot, Lists box, You tile, Settings badge). The bell adds to them and they keep working if notifications are off.
- **Retention:** rows read more than 30 days ago are deleted, and any row not updated for 90 days, by the hourly job that also sends checkpoint reminders.
- **Built differently from §3.2's "Undo" (decided in the build):** a row is not deleted when its event is undone. It is left out of the list and the count while it no longer holds: the request was answered or withdrawn, the follow ended, the invite was answered, the comment was deleted, the thing is gone, the reader is no longer a club member, or either reader has blocked the other. Only likes keep a stored count: the count and latest liker are re-read from the like tables on every like and unlike, so a like that was never announced can't throw it off.
- **Unread badge is capped at 100** and built from the same filters as the list, so it never shows a number the list can't back up. The client shows "9+" above nine.
- **Dismissing a checkpoint reminder only marks it read**, so the hourly job can't send it again.
- **Known gap:** one reader can re-ring another's bell by liking, unliking and liking again (likes are off by default, and the owner can block). Not limited yet.

## 3. Design

### 3.1 Types

| Type | Fires when | Recipient | Grouped? | Default |
|---|---|---|---|---|
| `FollowRequest` | someone asks to follow a private account | the account owner | no | on |
| `NewFollower` | someone follows a public account, or a request is approved (to the requester: `FollowApproved`) | the followed reader / the requester | no | on |
| `Comment` | a comment on your review, writing, list or reading update | the author | no | on |
| `Reply` | a reply to your comment | the comment's author | no | on |
| `Like` | a like on your review, writing, list or reading update | the author | **yes**, per item | **off** |
| `ClubInvite` | a club invites you directly | the invitee | no | on |
| `ListInvite` | you are invited to collaborate on a list | the invitee | no | on |
| `CheckpointDue` | a club checkpoint is due within 48 hours and you haven't reached it | each such member | no | on |

Settings groups these into five switches: **Follows** (`FollowRequest`, `NewFollower`, `FollowApproved`), **Comments and replies** (`Comment`, `Reply`), **Likes**, **Invites** (`ClubInvite`, `ListInvite`), **Checkpoint reminders**.

### 3.2 Rules for when a row is *not* written

- Never notify yourself (liking or replying to your own thing).
- **Blocks:** nothing is written when the recipient has blocked the actor or the actor has blocked the recipient, matching how follows and feeds already treat blocks.
- **Visibility:** nothing is written about something the recipient can't see. A reply to a comment on a followers-only review reaches only people who can see that review. Uses the same helpers as everything else (`ReviewAccess`, `ReadingAccess`, `WritingAccess`, `ListAccessService`, `AccountPrivacy`); do not copy their rules.
- **Undo:** unliking removes the person from the group (the row disappears when the count reaches 0); unfollowing, cancelling a request, deleting the comment, or declining an invite removes the matching row.
- **Repeats:** a person liking, unliking and liking again does not make a second row for the same item. A re-follow after an unfollow does not notify again within 24 hours.
- **Account erasure:** rows where the erased reader is the recipient or the actor are deleted with them (cascade), so `AccountErasureService` needs no new code beyond the migration's foreign keys. A "Deleted user" comment that was kept does not notify anyone later.

### 3.3 Data

- **Table `Notifications`:** `Id`, `RecipientId` (FK, cascade), `Type`, `ActorId` (FK, cascade; the latest actor for a grouped row), `ActorCount` (1 unless grouped), `SubjectType` (`Review | Writing | List | Reading | Club | Checkpoint | User`), `SubjectId` (Guid, no FK, validated on read like `Comment.TargetId`), `CommentId` (nullable, for replies and comments), `CreatedAt`, `UpdatedAt`, `ReadAt` (nullable).
  - Index on (`RecipientId`, `ReadAt`, `UpdatedAt` desc) for the list and the unread count.
  - Unique on (`RecipientId`, `Type`, `SubjectType`, `SubjectId`) **for grouped and once-only types** (`Like`, `CheckpointDue`), which is what makes group-in-place and "remind once" safe under races.
  - A new like on a grouped row sets `ReadAt = null` again, so the reader sees it as unread.
- **Table `NotificationPreferences`:** `UserId`, `Group` (the five groups of §3.1), `Enabled`. Only overrides are stored; the defaults live in code, so a new type needs no data migration.
- Migration `AddNotifications`. Update `SPEC.md` §7 data model.

### 3.4 Writing rows

- A `NotificationRecorder` service, called from the services that already own each event (`FollowService`, `CommentService`, `ReviewSocialService`, `ReadingSocialService`, `WritingService`, `BookListService` and `ListCollaborationService`, `ClubInviteService`), next to where they call `ActivityRecorder` today.
- **Best effort:** a failure to write a notification is logged and never fails the like, comment or follow that caused it.
- **`CheckpointDue`** is the only type with no user action behind it. A hosted service, in the style of `NewsFeedRefreshService`, runs hourly, finds `ReadingCheckpoint`s with `DueDate` in the next 48 hours, and writes one row per active club member whose progress is below the checkpoint's target. *(Confirm in the build how "reached" is read from progress; the wrap-up checkpoint goes to every member who hasn't finished.)* The unique index makes a re-run harmless, and it respects the "checkpoint reminders" switch.

### 3.5 API

```
GET    /api/notifications?cursor=&limit=     → { items: [...], nextCursor }   (newest first)
GET    /api/notifications/unread-count       → { count }
POST   /api/notifications/{id}/read          → 204
POST   /api/notifications/read-all           → 204
DELETE /api/notifications/{id}               → 204   (dismiss one)
GET    /api/notifications/preferences        → { follows, commentsAndReplies, likes, invites, checkpointReminders }
PUT    /api/notifications/preferences        { …same, all optional }
```

- An item carries: `id`, `type`, `actor` (user summary, as everywhere), `actorCount`, `subject` (kind, id, a title such as the book's, and the route to open it), `readAt`, `createdAt`. **Never** comment text.
- Items whose subject no longer exists, or that the reader can no longer see, are **left out** of the list and the count (and cleaned up by the retention job), never returned as errors.
- Anything the caller doesn't own is a 404, not a 403 (as elsewhere).
- New error messages need codes in `ErrorCodes.cs` and a translation under `errors.codes` (CLAUDE.md).

### 3.6 Frontend

- **A bell in the header** (and the phone nav) with an unread badge; "9+" above nine. Opens a panel on desktop and a full page `/notifications` on a phone. The panel shows the latest ~10 with "See all".
- Each row: avatar, a sentence built from translation keys with the names filled in (`notifications.types.like_one`, `like_other` for "and N others" through the i18n plural rules), time ago, an unread dot. Clicking marks it read and goes to the thing (the review, the list, the club, the profile). A follow request row has **Approve / Decline** inline.
- "Mark all as read", and a dismiss (×) on a row.
- Empty state: a calm line, not a call to action.
- **Settings → Notifications:** the five switches with one line each saying what they cover. Likes shows "Off" by default.
- The unread count query refetches every 60 s while the tab is visible and on focus; the list refetches when the panel opens. Marking read updates the count optimistically.
- **Translations:** every sentence, empty state, label and `aria-label`, in all five languages. Plural forms for "and N others" in each (CLAUDE.md).
- **Styling:** design tokens only, checked in all five themes; unread dot uses the accent token, not a new colour.

## 4. Tasks

### Backend

- [x] Migration `AddNotifications` (§3.3); `SPEC.md` §7 updated. *The dev database needs `dotnet ef database update` and the API a restart.*
- [x] `NotificationRecorder` and the rules of §3.2 (self, blocks, visibility, repeats). Visibility goes through `CommentService`'s thread-access check; the rest is filtered when read (see §2).
- [x] Hooks in the services of §3.4 for follows and requests, comments and replies, likes (grouped), club invites (after the club's transaction commits) and list invites.
- [x] `CheckpointDue` hosted service (§3.4) and the retention cleanup (§2): `NotificationBackgroundService`, hourly.
- [x] `NotificationsController`, service and repository (§3.5) and DTOs. No new error messages were needed.
- [x] Tests (18 in `NotificationTests`): each type is written once and for the right person; likes group and ungroup; a blocked actor, a hidden item, a private account and the reader's own action write nothing; a turned-off type writes nothing; counts and lists leave out items the reader can no longer see; erasing either account removes the rows; the checkpoint job is idempotent.
- [x] `reviewer`, and `argos-security` after the phase. Findings fixed: like counts drifting when a like was never announced, and an unlike deleting someone else's row (now re-read from the like tables); badge and list disagreeing (same filters); checkpoint reminders surviving leaving the club; a club invite written inside the club's transaction; comments, likes and invites from a reader in a block staying in the bell; replies and comments in a thread the reader can't see; rows for the "Deleted user" placeholder; duplicate follow / invite rows under a race (one unique index for all one-per-subject types); simultaneous preference saves; retention counted from the last update rather than from when it was read. Left: the like re-ring above, and `bugs/list-invites-ignore-blocks.md`.

### Frontend

- [x] Types, API client, React Query hooks (list, unread count, mark read, read all, dismiss, preferences).
- [x] Bell, panel, `/notifications` page and the row component, with inline Approve / Decline for follow requests.
- [x] Settings → Notifications switches.
- [x] Translations in all five languages, including plurals and `aria-label`s.
- [x] `reviewer` after the phase. Findings fixed: Approve / Decline missing when the requests list was cached (always refetched now), a checkpoint reminder's × doing nothing (no × on it: it is only marked read), the panel's dialog semantics, empty display names. Left: the aria-label says "100 unread" when the server cap is hit, and the bell is in the header only (it sits there on phones too; check at 360 px in the browser pass).

### Verification

- [x] Browser pass (`browser-check`) with three readers: follow, request and approve, like (off, then on), comment, reply, club invite, list invite, block, and a private account; then `/test-plan` writes `testing/notifications.md`.
- [x] Re-read this spec against what was built before ticking tasks (CLAUDE.md).
- [x] `CHANGELOG.md` line; Stage 5 ticked in `ROADMAP.md`; `SPEC.md` updated.

## 5. Out of scope

- **Weekly email digest** and any notification email. A roadmap box after launch; it can be built on `Notifications` and `ActivityEvents` (`FUTURE-IDEAS.md`).
- **@mentions** in comments and writings (needs their own parsing, autocomplete and block rules).
- **Browser or phone push notifications** and real-time delivery.
- **Per-club or per-person muting**, and quiet hours.
- **Club organizing tools** (meetings, RSVPs, voting, calendar files). Unblocked by this spec, to be specced on top of it.
- **Activity from people you follow** ("Ana finished Dune"). That is the Feed's job; a future "following" notification type could reuse `ActivityEvents`.
- Replacing the existing stand-ins (§2).
