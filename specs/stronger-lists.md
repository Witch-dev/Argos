# Feature Spec — Stronger lists

**Status:** built 2026-10-24 (§5 says what differs from the plan). One phase, size M.

## 1. Problem

Shared lists (a list with collaborators, `specs/book-lists-improvements.md` §3.11) are missing the basics that clubs got in `specs/stronger-clubs.md`:

- **No handover.** When the owner's account is erased, the list goes with it, including every book, note and comment the collaborators added. A club passes to its next admin (`ClubSuccession`, called from `AccountErasureRepository.HandOverClubsAsync`); a list has nothing like that. The delete-account screen says so plainly (`settings.json` → `listsWarn`: "Lists you made are deleted with your account, even ones you share with others.").
- **No transfer.** An owner who wants to step back can't hand the list to someone else.
- **Two filed bugs** (`bugs/backend-review-minor-gaps.md`):
  - An invite can go to a suspended or deactivated reader, or to the "Deleted user" placeholder (`ListCollaborationService.InviteAsync`), using up one of the 10 slots.
  - Two people removing or reordering books at the same moment (`BookListService.RemoveItemAsync`, `ReorderItemAsync`) trip the deferred `(BookListId, Position)` constraint, and one of them gets a 500. Only adding a book has the reload-and-retry. Nothing is corrupted.

## 2. Decisions

### 2.1 Asked 2026-10-24

- **On account erasure, a shared list passes to the collaborator who accepted first.** Same rule as clubs, automatic, nothing new to choose on the delete screen. A list with no accepted collaborator is deleted, as today.
- **Transfer while the owner is active is immediate, like clubs.** The new owner already accepted an invite to the list. They get a notification, and the list shows under their name at once.
- **The old owner becomes a collaborator**, like the old club admin becoming a moderator. They keep editing and can leave whenever they like.

### 2.2 Decisions I made, for the user to confirm

- **Who comes first:** accepted collaborators only (a pending invite never inherits), by earliest `RespondedAt`, preferring someone who isn't also waiting to be deleted or suspended; they're used only when nobody else is left. This is `ClubSuccession`'s rule, as a sibling `ListSuccession`.
- **The 30 days before erasure:** while the owner's deletion is pending, their lists are hidden from everyone, collaborators included (the `BookList` owner query filter), so cancelling brings everything back unchanged. The handover happens at erasure, not at the start of the 30 days. Collaborators lose sight of the list for those 30 days. Changing that would mean hand-written exceptions to the owner filter, which isn't worth it at this size.
- **What travels with the list:** books (including the old owner's, whose "added by" becomes empty as it does today), notes, tags, likes from other readers, comments, reports, the "copied from" credit, visibility, ranked or not, and a moderation hide if there is one. The old owner's own like on it goes with their account. Comments on the list stay: `DeleteCommentsOnTheirContentAsync` finds lists by `UserId`, so running the list handover before it is enough. Pending invites stay, and the new owner can cancel them.
- **One notification, `ListOwnershipReceived`,** to the new owner in both cases. Its subject is the list. Actor is the old owner on a transfer, empty on erasure ("A list you help with is now yours: its owner deleted their account"). It goes under the existing **Invites** switch with `ListInvite`. Nobody else is notified: the list page already shows who owns it.
- **Transfer target:** any accepted collaborator. Owner only. The collaborator count doesn't change (one row goes, one comes), so the cap of 10 can't be hit.
- **The invite bug:** suspended, deactivated and "Deleted user" accounts get the same answer as an unknown account, "That user doesn't exist.", so a suspension can't be probed by inviting. This is how `FollowService` already treats them.
- **The reorder bug:** remove and reorder get the same reload-and-retry as add (3 tries). If all three collide, the answer is a 409 with a new error code, "Someone else just changed this list. Try again.", and the list page reloads its items.

## 3. Design

### 3.1 Data

- No new table or column. `ListCollaborator.RespondedAt` already records when someone accepted.
- `NotificationType.ListOwnershipReceived`, added at the end of the enum (it's stored as a number). Subject type `List`. Group `Invites` in `NotificationRules`. Once per subject.

### 3.2 Backend

**Handover on erasure** (`AccountErasureRepository`)
- New `ListSuccession.CandidatesInOrder(context, listId, leavingUserId)` next to `ClubSuccession`: accepted collaborators of the list, other than the leaving reader, deactivated or suspended ones last, then by `RespondedAt`.
- New `HandOverListsAsync(userId)`, called right after `HandOverClubsAsync` and **before** `DeleteCommentsOnTheirContentAsync`. For each of the reader's lists (`IgnoreQueryFilters`, since the owner is deactivated) with a candidate: set `BookList.UserId` to the successor, delete the successor's collaborator row, record `ListOwnershipReceived` with no actor. Lists with no candidate are left for the existing cascade to delete.
- The notification is written inside the erasure transaction, so a rollback drops it too.

**Transfer**
- `POST /api/booklists/{id}/transfer`, body `{ userId }`. Owner only (another viewer who can see the list gets 403, one who can't gets 404, as the other owner actions do).
- `ListCollaborationService.TransferAsync`: the target must be an accepted collaborator, otherwise 400 with a new error code. In one save: `BookList.UserId` becomes the target, the target's collaborator row is deleted, the old owner gets an `Accepted` row (`InvitedAt` and `RespondedAt` now). Then `ListOwnershipReceived` with the old owner as actor.
- `UpdatedAt` isn't bumped: the books didn't change, and "Recently updated" is about the books.

**Invite bug** (`ListCollaborationService.InviteAsync`)
- Before the duplicate and cap checks, load the invitee. Unknown, `DeactivatedAt` set, `SuspendedAt` set or `DeletedUser.Id` → "That user doesn't exist." (same code as now).

**Remove and reorder bug** (`BookListService.RemoveItemAsync`, `ReorderItemAsync`)
- The same loop as `AddItemAsync`: read the items, apply the change, save; on `DbUpdateException`, log a warning, clear the tracked items and try again from a fresh read, up to 3 times.
- Remove: if the item is gone on the re-read, answer success (someone else removed it, and the reader got what they asked for).
- Reorder: re-apply "move this item to position N" to the fresh order, clamped as now.
- After 3 collisions, a 409 with the new code `ListChangedConcurrently`. The add loop's last failure moves to the same code instead of its current English-only message.

**Error codes:** `ListTransferTargetNotCollaborator`, `ListChangedConcurrently` in `ErrorCodes.cs`, with translations under `errors.codes` in all five languages.

### 3.3 Frontend

- **CollaboratorsPanel** (owner's view): each accepted collaborator gets a "Make owner" action next to Remove. A confirm modal: "Make Ana the owner of this list? It moves to Ana's profile. You'll stay on as a collaborator and can leave any time." Afterwards the list page reloads with the reader as a collaborator.
- **Notification row** for `ListOwnershipReceived`: "Ana made you the owner of *Cosy winter mysteries*" / "*Cosy winter mysteries* is now yours: its owner deleted their account". Opens the list.
- **A 409 from remove or reorder** shows the error text and reloads the items, so the reader sees the current order.
- **Wording:**
  - `settings.json` → `listsWarn`: "A list you share passes to the collaborator who joined it first. Lists nobody else helps with are deleted."
  - `legal.json` (privacy policy, account deletion): after "A club you created passes to another member…", add "A list you share passes to its longest-standing collaborator, with its comments; a list nobody else helps with is deleted." Check the "erased for good, with your logs, reviews, lists…" sentence still reads right.
- All new text through `t('…')` in the five locale files.

## 4. Tasks

### Backend
- [x] `ListSuccession.CandidatesInOrder` and `HandOverListsAsync` in the erasure, before the comment clean-up.
- [x] `NotificationType.ListOwnershipReceived` (end of enum), its `NotificationRules` group and once-per-subject entry, a recorder method.
- [x] `POST /api/booklists/{id}/transfer` and `ListCollaborationService.TransferAsync`.
- [x] Invites refuse suspended, deactivated and "Deleted user" accounts.
- [x] Reload-and-retry for remove and reorder; `ListChangedConcurrently` for all three after 3 collisions.
- [x] Two error codes with translations.
- [x] Tests: erasure hands a shared list to the first-accepted collaborator and keeps its books, notes, tags, comments and likes; prefers an active collaborator over a deactivated one; deletes a list with only pending invites; transfer swaps the roles in one save and notifies; transfer to a pending invitee or a stranger is refused; non-owner gets 403/404; invite to a suspended, deactivated and placeholder account is refused; concurrent remove and concurrent reorder both succeed (or one gets the 409), never a 500.
- [x] `reviewer`, then `argos-security` (ownership of user content and who may act on it).

### Frontend
- [x] "Make owner" in `CollaboratorsPanel` with its confirm.
- [x] The notification row text.
- [x] 409 handling on remove and reorder.
- [x] `listsWarn` and privacy policy wording.
- [x] Vitest for the confirm and the notification text; `reviewer`.

### Verification
- [x] `browser-check`: owner A, collaborator B. A makes B the owner → the list is on B's profile, A sees it under "Shared with me" and can still add a book, B has the notification. Then B starts deleting their account and the erasure runs (side-port API) → A owns it again, the comments are still there.
- [x] Inviting a suspended test reader shows "That user doesn't exist."
- [x] Close `bugs/backend-review-minor-gaps.md`'s two list entries (strike them with a pointer here), tick the roadmap box, a `CHANGELOG.md` line.

## 5. As built (2026-10-24)

What differs from §2–3, and why:

- **Changes to a list's order take the list's row lock.** Add, remove and reorder each run in a transaction that first locks the `BookLists` row (`SELECT … FOR UPDATE`), so two changes queue up instead of both working from the same read. The tests showed two things the plan missed: concurrent removes could leave gaps in the positions (lost updates, which the unique constraint can't see), and the deferred position constraint fails at COMMIT as a bare `PostgresException`, which the old add retry never caught, so adds could 500 too. The 3-try retry stays as a backstop (imports also write positions); after three collisions the answer is the 409.
- **Error codes** follow the existing naming: `lists.changedConcurrently` (replaces `lists.concurrentUpdate`) and `lists.transferTargetNotCollaborator`, "Only someone who already helps with this list can become its owner."
- **Blocks** (from the `argos-security` review): a transfer is refused across a block either way, with that same message so the block can't be probed. A transfer or an erasure handover drops pending invites from anyone in a block with the new owner, and accepting an invite is refused across a block with the list's current owner.
- **The confirm is inline**, under the collaborator's row, not a modal: `DESIGN.md` says inline first, and the club handover confirms the same way.
- **The suspended-invite error** can only be seen through the API: the people search in the panel already leaves suspended accounts out.
- A migration (`ListOwnershipNotification`) widens the notifications' unique-per-subject index to the new type. A transfer refreshes the one row and makes it unread again.
