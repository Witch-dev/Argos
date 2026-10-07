# Feature Spec — Book Clubs

**Status:** ✅ Implemented (2026-09-28)

## 1. Problem

Argos today is entirely asynchronous and 1:1 (follow someone, see their logs/reviews/posts) or 1:many-broadcast (a public list). There's no concept of a *group* of readers moving through the same book together and talking about it. The user wants "book clubs": a group suggests books, agrees on one, reads it on a shared schedule, and discusses it — "like some reddit thing."

This is the biggest single feature added to Argos so far — it touches membership/roles, a voting mechanism, scheduled checkpoints, and a full threaded-comment system that doesn't exist anywhere else in the app yet (SPEC.md §4 Phase 2 has "Likes/comments on reviews" queued but unbuilt — this spec builds the first real comment system, scoped to clubs rather than reviews).

## 2. Clarifying decisions made (via questions to the user)

Reached over several rounds of questions rather than a single pass, given the scope:

- **Public + private clubs**, creator's choice at creation — same `IsPublic` pattern `List` already uses.
- **Book selection is suggest-then-vote, with an admin/mod confirmation step.** Members suggest books to a pool and vote; the top-voted suggestion is the default pick, but an admin/mod must actively confirm it (and *may* confirm a different suggestion from the pool instead of the top-voted one) — a veto without ignoring the vote.
- **Discussion is time-boxed, threaded, and voteable — full Reddit shape.** The user's own framing: "set the time like 1 week or 1 month, and when the week happens, people can write and discuss what they've read" → the schedule is made of **checkpoints** (a due date + an expected page/chapter), each with its own **threaded comment discussion** (nested replies) that also has **upvote/downvote and top/new sorting** — the most build-heavy decision made in this spec.
- **No spoiler guard** — checkpoint threads are open to everyone regardless of their own logged progress; at most a general "this may contain spoilers" banner, no locking or blurring based on how far a member has actually read.
- **Progress reuses the existing personal `Log`, not a club-specific number.** A member's percentage for the club's book is derived from their own `Log.CurrentPage`/`Log.TotalPages` (`specs/reading-progress-tracking.md`) — logging progress anywhere (the "+" tile, a club page) updates the same number everywhere, visible in the club's member list.
- **Roles: creator (Admin) + promotable Moderators**, who share admin powers (confirm the book, manage members) — not a single-admin-only model.
- **A club is ongoing, not one-and-done.** Once a book's checkpoints are done, the club cycles back to suggestions for the next book — a club accumulates a history of books it's read together, not just one.
- **Public clubs are discoverable via a browsable/searchable directory.** No member cap.
- **Private-club access reconciled into one flow.** The user's answer was "could be invite link and request to join" — both, together, not as separate alternatives: a private club's invite link is the *discovery* mechanism (it's not listed in the public directory), and opening that link surfaces a "Request to Join" action that an admin/mod must approve. A public club's own link (or the directory) just joins immediately, no approval step. This is a synthesis, not something asked verbatim — flagging it here since it's a real design call.
- **No integration into the main center reviews feed.** Instead: a new "My Book Clubs" card in the **right sidebar** (`specs/home-dashboard-redesign.md` §3.4, alongside `AccountSummary`/`SuggestedAccounts`) — per club: name, current book, the viewer's own progress, and the next checkpoint's due date, linking to the club's full page. This was the user's own description almost verbatim.

## 3. Design

### 3.1 New domain concepts

A club's lifecycle is modeled as a sequence of **rounds** (one per book it reads), so history is a natural byproduct rather than something bolted on:

```
Clubs(id, name, description, is_public, invite_token, creator_id, created_at)
ClubMemberships(club_id, user_id, role, status, joined_at)
ClubBookRounds(id, club_id, round_number, phase, book_id, started_at, confirmed_at, confirmed_by_user_id)
BookSuggestions(id, club_book_round_id, book_id, suggested_by_user_id, created_at)
SuggestionVotes(suggestion_id, user_id, created_at)
ReadingCheckpoints(id, club_book_round_id, label, target_page, due_date, created_at)
CheckpointComments(id, checkpoint_id, user_id, parent_comment_id, content, created_at)
CommentVotes(comment_id, user_id, value, created_at)
```

- **`Club`** — `IsPublic` drives directory visibility (§3.5) and default join behavior. `InviteToken` (unique, generated at creation, regenerable by an admin/mod) is the shareable link's key — used by both public (instant join) and private (request-to-join) clubs.
- **`ClubMembership`** — `Role`: `Admin` (exactly one — the creator; not transferable in v1) / `Moderator` / `Member`. `Status`: `Active` / `PendingRequest` (private-club join requests awaiting approval, §3.5).
- **`ClubBookRound`** — one row per book cycle. `Phase`: `Suggesting` (no `BookId` yet, suggestions/votes open) → `Reading` (`BookId` set, checkpoints exist) → `Completed` (superseded by the next round). A club always has exactly one non-`Completed` round; creating a club creates round 1 in `Suggesting` phase automatically. Transitions are explicit admin/mod actions (§3.3), never automatic on a date passing.
- **`BookSuggestion`** / **`SuggestionVote`** — one vote per user per round; casting a new vote moves it (not additive) — a single-choice poll, not approval voting. Suggesting a book reuses the same book-picker pattern `PostComposerModal`/`ProgressUpdateModal` use (debounced Open Library search, resolved to a cached `BookId` at selection time — same live-result fix noted in `specs/book-posts.md` §3.3).
- **`ReadingCheckpoint`** — `TargetPage` is **advisory only, not enforced**: different members may have entered different `Log.TotalPages` for different editions (SPEC.md §10 already flags edition/ISBN precision as unresolved), so a checkpoint's target page is a rough shared reference ("aim for around here by this date"), not something validated against each member's own numbers.
- **`CheckpointComment`** — self-referencing `ParentCommentId` for arbitrary-depth threading, same shape a Reddit comment tree needs.
- **`CommentVote`** — `Value` is `+1`/`-1`; a comment's score is the sum, used for "Top" sort.

### 3.2 Membership, roles, and directory

- **Create a club**: any authenticated user, via `Name`, `Description`, `IsPublic`. Creator becomes `Admin`, round 1 starts in `Suggesting`.
- **Roles**: `Admin` can promote/demote `Moderator`s, remove any member, approve/deny join requests, confirm the round's book, and everything a `Moderator` can. `Moderator` can confirm the round's book, remove regular `Member`s, and approve/deny join requests — but cannot touch another `Moderator` or the `Admin`. `Member` can suggest books, vote, log progress, and comment.
- **Directory** (`GET /api/clubs?search=`): public clubs only, searched by name, showing name, current-round phase (with book title if `Reading`), and member count — same shape as the existing People-search page.

### 3.3 Book selection: suggest → vote → confirm

While a round is `Suggesting`:
- Any member suggests a book (book-picker, §3.1) — no cap on suggestions per member.
- Any member casts one vote per round, on any suggestion; re-voting moves the vote.
- An `Admin`/`Moderator` **confirms** a suggestion (defaulting to the top-voted one in the UI, but able to pick any suggestion in the pool) via `POST /api/clubs/{id}/confirm-book`, supplying the checkpoint schedule in the same call: a list of `{ Label, TargetPage?, DueDate }`. This sets `BookId` on the round, creates the `ReadingCheckpoint` rows, and flips `Phase` to `Reading`. Unconfirmed suggestions/votes stay attached to the round as a record of what was considered.

While a round is `Reading`, an `Admin`/`Moderator` can **finish the book** (`POST /api/clubs/{id}/finish-book`) — marks the round `Completed` and creates round `N+1` in `Suggesting`. This is a deliberate button, not something that fires automatically once the last checkpoint's due date passes (the club might legitimately run long).

### 3.4 Progress: reusing `Log`

A club page's member list shows each `Active` member's percentage for the round's `BookId`, computed the same way the reading-progress popover already does (`CurrentPage / TotalPages`, derived and never stored — `specs/reading-progress-tracking.md` §3.1) by looking up that member's own `Log` for that `UserId`+`BookId`. No `Log` yet for that book → shown as "Not started," not an error or a zero. No new write path is added here — a member updates their own progress exactly the way they do today (the "+" tile / `ProgressUpdateModal`); the club page is a read-only aggregation over existing data.

### 3.5 Joining: public vs. private

- **Public club**: `POST /api/clubs/{id}/join` — membership created as `Active` immediately. Reachable via the directory or the club's own invite link (which, for a public club, also joins immediately rather than prompting a request).
- **Private club**: not listed in the directory. The only way in is the invite link (`GET /api/clubs/join/{token}` resolves the token to a small public preview — name, description, current book if any — without requiring membership to view). Requesting access (`POST /api/clubs/join/{token}`) creates a `PendingRequest` membership; an `Admin`/`Moderator` sees a pending-requests list on the club page and approves or denies each one.

### 3.6 Discussion: checkpoint threads

Each `ReadingCheckpoint` has its own comment thread:
- `GET /api/checkpoints/{id}/comments?sort=top|new` — returns the full nested tree (small enough per checkpoint that a single fetch beats cursor-paginating a tree, unlike the flat main feed).
- `POST /api/checkpoints/{id}/comments` — `Content`, optional `ParentCommentId` for a reply.
- `POST /api/comments/{id}/vote` / `DELETE /api/comments/{id}/vote` — upsert/remove the current user's `+1`/`-1`; a comment's own vote total is server-computed, not trusted from the client.
- `PUT /api/comments/{id}` / `DELETE /api/comments/{id}` — edit/delete, added 2026-09-28 per user request (§3.8 below; originally out of scope).
- Frontend: `CheckpointDiscussionPage`, a comment tree component (indent-by-depth, collapse/expand a subtree), vote buttons, and a Top/New sort toggle — the closest thing in Argos to a real UI component library addition, since nothing today renders a recursive tree.

### 3.7 Frontend surface

- `ClubsDirectoryPage` (`/clubs`) — search public clubs, "Create a club" entry point.
- `ClubPage` (`/clubs/{id}`) — header (name, description, privacy badge, member/role list) + phase-conditional body: suggestion list with vote buttons and a "Confirm" action (`Suggesting`), or current book + member progress list + checkpoints list with a "Finish book" action (`Reading`); a pending-requests panel for admins/mods on private clubs.
- `ClubJoinPage` (`/clubs/join/{token}`) — the invite-link landing page (§3.5).
- `CheckpointDiscussionPage` (`/clubs/{id}/checkpoints/{checkpointId}`) — the comment tree (§3.6).
- `MyClubsCard` — new right-sidebar component, mounted in `FeedPage`'s right column alongside `AccountSummary`/`SuggestedAccounts` (`specs/home-dashboard-redesign.md` §3.4/§3.5). Per club the viewer is an `Active` member of: name, current book (or "Choosing next book" during `Suggesting`), the viewer's own progress percentage, next checkpoint due date, linking to `ClubPage`. Empty state (no club memberships) links to the directory instead.

### 3.8 Editing and deleting comments/replies/suggestions (added 2026-09-28)

Originally out of scope (§4 in the pre-2026-09-28 version of this doc, mirroring the same call made for `Post`). Added per direct user request once the feature was live and the gap was felt. Design decisions made via clarifying questions to the user:

- **Comment/reply delete: author, or an Admin/Moderator (moderation power)** — not author-only. Consistent with the Admin/Moderator's existing moderation powers elsewhere in a club (remove a member, approve/deny requests).
- **Comment/reply edit: author only, no moderation power.** An Admin/Moderator can *remove* someone else's words but never *rewrite* them — editing someone else's comment would be a much stranger, more trust-breaking action than deleting it.
- **A comment with replies underneath it is soft-deleted, not hard-deleted.** `CheckpointComment` gained `IsDeleted` (bool) and `EditedAt` (DateTime?). Deleting a comment that has at least one reply overwrites its `Content` with the literal string `"[deleted]"` and sets `IsDeleted = true`, but keeps the row — so the thread structure underneath survives, the same way Reddit itself handles this (the spec already cites Reddit as the model, §2). A comment with **no** replies has nothing to preserve, so it's hard-deleted outright (`DELETE FROM CheckpointComments`), which also cascades away its own `CommentVote` rows via the existing FK config. This is why the self-referencing `ParentComment` FK stayed `Restrict` rather than needing to become `Cascade`: a hard delete only ever targets a childless comment, so the FK never actually blocks anything.
- **A deleted comment still accepts new replies** (server-side, unrestricted) — the thread can keep growing under a "[deleted]" placeholder. The frontend hides vote/edit/delete actions on a deleted comment (nothing meaningful to vote on or edit) but keeps showing its Reply button.
- **Book suggestions: delete-only, no edit.** A suggestion is just a pointer at a book — there's no separate text content to edit, so changing your pick means deleting and re-suggesting. Delete follows the same author-or-Admin/Moderator rule as comments, and only while the round is still `Suggesting` (`ClubService.DeleteSuggestionAsync` returns a validation error once a book's confirmed — the pool becomes history at that point, not something to keep editing). Its `SuggestionVote` rows cascade away with it via the existing FK config, same as a confirmed round leaves the rest of the pool alone.
- **No edit history / audit trail** — an edited comment just shows an "(edited)" tag next to the timestamp; the pre-edit content isn't retained anywhere, matching the rest of the app's lack of any versioning concept.

## 4. Explicitly out of scope

- **Spoiler locking/blurring** — confirmed in §2: a general warning only, no progress-gated access to a checkpoint thread. **Superseded 2026-10-01:** `specs/book-club-improvements.md` §3.4 adds a one-tap blur ("I've read this far", saved per account). It's still not progress-gated.
- **Notifications** (new comment, book confirmed, checkpoint opening, join request) — no notification system exists yet anywhere in Argos (SPEC.md §4 Phase 2).
- **Club activity in the main center reviews feed** — confirmed declined; club presence is the right-sidebar card only.
- **Member caps** — unlimited membership.
- **Tag/genre filtering, trending/featured ordering in the directory** — name search only, v1.
- **Automatic phase transitions on a due date passing** — finishing a book is an explicit admin/mod action.
- **Ownership transfer** — the creator stays the sole `Admin` for v1; only `Moderator` promotion/demotion exists.
- **Real-time updates** (websockets/live-refresh) for new comments or votes — standard fetch/invalidate on action, same pattern the rest of the app uses.
- **Per-edition-accurate checkpoint targets** — `TargetPage` is advisory only (§3.1); real per-edition precision is the same open item SPEC.md §10 already tracks.
- **Moderation/reporting tooling beyond "remove a member"** — no ban list, no content reporting; SPEC.md §4 Phase 3 ("Moderation & reporting tools") already tracks the real version of this separately.

## 5. Tasks

### Backend

- [x] Domain entities: `Club`, `ClubMembership`, `ClubBookRound`, `BookSuggestion`, `SuggestionVote`, `ReadingCheckpoint`, `CheckpointComment`, `CommentVote` (`Argos.Domain`).
- [x] `ArgosDbContext`: `DbSet`s + FK/cascade configuration for all eight (member/suggestion/vote/comment rows cascade-delete with their parent). Flagged deviation: `Club`→`User` (creator) is `Restrict`, but that's actually *not* this app's real existing convention — `Log`/`Post`/`BookList`/`Follow` all `Cascade` on their owning-User FK. Kept `Restrict` deliberately anyway: a `Club` is shared multi-user content, so cascading it away (and every other member's data with it) over the creator's account being deleted is a much bigger, more surprising blast radius than losing one person's own `Post`/`List`. See the comment in `ArgosDbContext.ConfigureBookClubs`.
- [x] EF Core migration `AddBookClubs` (applied to the local dev Postgres via `dotnet ef database update`).
- [x] Repositories/services per entity, layered `Controllers → Services → Repositories` (SPEC.md §5): club CRUD + directory search + invite-token resolution; membership join/approve/remove/role-change; suggestion create/list/vote; round confirm-book/finish-book (each one atomic — a single `SaveChangesAsync` call inside `IClubBookRoundRepository.ConfirmBookAsync`/`FinishBookAsync`); checkpoint list; comment create/list-as-tree/vote. `SuggestionVote` denormalizes `ClubBookRoundId` (see its own doc comment) so a DB-level unique index on `(ClubBookRoundId, UserId)` enforces "one vote per user per round" directly.
- [x] Progress lookup: `ClubService.GetProgressForMembersAsync`, given a round's `BookId` and a list of member `UserId`s, batch-fetches each member's `Log` for that book via a new read-only `ILogRepository.GetByBookIdAndUserIdsAsync` method (no new progress-writing path per §3.4); percentage formula matches the reading-progress popover's client-side one (`Math.Round(currentPage/totalPages*100)`).
- [x] DTOs: `ClubDto`, `ClubDetailDto`, `ClubMembershipDto` (with derived progress %), `BookSuggestionDto` (with vote count + whether the caller voted), `ReadingCheckpointDto`, `CheckpointCommentDto` (nested, with score + caller's own vote).
- [x] Controllers: `ClubsController` (create, directory search, detail, join, join-via-token/request, approve/deny request, remove member, change role, regenerate invite, confirm-book, finish-book, suggestions CRUD, vote, plus `GET /rounds` and `GET /rounds/{roundId}/checkpoints` — added beyond the checklist so a finished round's checkpoints/history stay reachable per §3.3's "accumulates a history" note), `CheckpointsController` (comments list/create), `CommentsController` (vote/unvote).
- [x] Authorization checks: role-gated actions (confirm/finish/approve/remove/promote) enforced server-side (403 via `Forbid()`, not a silent no-op). Ambiguity call: role-change (promote/demote) is Admin-only — the spec's §3.2 matrix only explicitly grants Moderators removal power over regular Members and is silent on role changes specifically; since a role change is more sensitive than a removal, a Moderator gets 403 there too, even for a target they could otherwise remove.
- [x] Backend tests: full round lifecycle (suggest → vote → confirm → checkpoints created → finish → next round created), vote uniqueness/move-not-stack for both suggestion and comment votes, public instant-join vs. private request/approve flow, role permission boundaries (a `Member` cannot confirm/remove/promote; a `Moderator` cannot touch another `Moderator`/the `Admin`), progress lookup correctness against existing `Log` data, comment tree correctness (nesting, Top vs New sort). 23 tests across `ClubsControllerTests.cs` and `CheckpointDiscussionControllerTests.cs`; full suite at 92/92.

### Frontend

- [x] Types (`api/types.ts`) for all new DTOs.
- [x] `api/clubs.ts`, `api/checkpoints.ts`, `api/comments.ts` — client calls for every endpoint above.
- [x] `ClubsDirectoryPage` — search + list + "Create a club".
- [x] `CreateClubModal`/page — name/description/public-private toggle.
- [x] `ClubPage` — header, phase-conditional body (suggestions+voting UI, or book+progress+checkpoints UI), member/role management, pending-requests panel.
- [x] `ClubJoinPage` — invite-link landing (preview + join-or-request action per §3.5).
- [x] `ConfirmBookModal` — pick a suggestion (default: top-voted) + build the checkpoint list (label, optional target page, due date) in one step.
- [x] `CheckpointDiscussionPage` + a recursive comment-tree component (reply composer, vote buttons, Top/New sort, collapse/expand).
- [x] `MyClubsCard` — right-sidebar component, wired into `FeedPage`'s right column per §3.7.
- [x] Tests: club lifecycle happy path (create → suggest → vote → confirm → see checkpoints), join flows (public instant, private request/approve), role-gated UI (actions hidden/disabled for a plain `Member`), comment tree rendering + voting + sort toggle. Landed across `ClubPage.test.tsx`, `ClubJoinPage.test.tsx`, `CommentTree.test.tsx`, `CheckpointDiscussionPage.test.tsx`, plus `CreateClubModal.test.tsx`/`ClubsDirectoryPage.test.tsx`/`MyClubsCard.test.tsx`; full suite 75/75.

### Backend — comment/reply/suggestion edit & delete (2026-09-28, §3.8)

- [x] `CheckpointComment` gains `IsDeleted` (bool, default false) and `EditedAt` (DateTime?); migration `AddCommentEditDelete`, applied to the local dev Postgres.
- [x] `CheckpointDiscussionService.EditCommentAsync`/`DeleteCommentAsync` (author-only edit; author-or-Admin/Moderator delete; soft-delete-with-placeholder when the comment has replies, hard-delete otherwise) — `CommentsController` gains `PUT /api/comments/{id}` and `DELETE /api/comments/{id}`.
- [x] `ClubService.DeleteSuggestionAsync` (author-or-Admin/Moderator, only while `Suggesting`) — `ClubsController` gains `DELETE /api/clubs/{id}/suggestions/{suggestionId}`.
- [x] `CheckpointCommentDto` gains `IsDeleted`/`EditedAt`.
- [x] Backend tests: edit forbidden for a non-author, edit sets `EditedAt`; hard-delete removes a childless comment from the tree entirely; soft-delete on a comment with replies keeps the thread intact under a `"[deleted]"` placeholder; Admin can delete another member's comment/suggestion but a plain Member can't; suggestion delete rejected once the round is no longer `Suggesting`. 6 new tests; full suite 98/98.

### Frontend — comment/reply/suggestion edit & delete (2026-09-28, §3.8)

- [x] `api/comments.ts` gains `editComment`/`deleteComment`; `api/clubs.ts` gains `deleteSuggestion`.
- [x] `lib/clubRoles.ts` — extracted `isAdminOrMod` (was a local function in `ClubPage.tsx` only) so `CommentTree` can use the same permission check.
- [x] `CommentTree`: Edit (author-only, inline textarea reusing the reply form's styling) and Delete (author-or-Admin/Moderator, `confirm()` before firing) on every non-deleted comment/reply; a deleted comment renders its `"[deleted]"` content muted/italic with vote/edit/delete hidden but Reply still available; an `"(edited)"` tag next to the timestamp once `editedAt` is set. `viewerRole` threaded down from `CheckpointDiscussionPage` (`club.viewerRole`) through every recursive level.
- [x] `ClubPage`: a "Remove" button on each suggestion row for its suggester or an Admin/Moderator, gated to the `Suggesting` phase (the only phase suggestions are shown in at all).
- [x] Tests: author-edit saves new content; a plain Member can't see Edit/Delete on someone else's comment; an Admin can Delete (not Edit) someone else's comment; a deleted comment hides its actions but keeps Reply; the `"(edited)"` tag appears once `editedAt` is set (`CommentTree.test.tsx`); suggestion removal after the `confirm()` prompt (`ClubPage.test.tsx`). Full suite 81/81.

### Backend — single-checkpoint create/edit/delete (2026-09-30)

`ReadingCheckpoint` rows previously only existed as a side effect of `ConfirmBookAsync`'s bulk schedule creation — no way to add, edit, or remove one checkpoint afterward.

- [x] `ClubService.CreateCheckpointAsync`/`UpdateCheckpointAsync`/`DeleteCheckpointAsync` — Admin/Moderator-only, only while the round's `Phase` is `Reading`. `Update`/`Delete` take only a `checkpointId` (no clubId in the route); the owning round/club and the caller's role are resolved from the checkpoint itself, the same lookup path `CheckpointDiscussionService` already uses for comment authorization.
- [x] New `ReadingCheckpointOperationResult` (mirrors `BookSuggestionOperationResult`/`CheckpointCommentOperationResult`'s per-entity result-type convention); `IReadingCheckpointRepository` gains `AddAsync`/`UpdateAsync`/`DeleteAsync`.
- [x] `CreateCheckpointRequest`/`UpdateCheckpointRequest` DTOs (`Label`, `TargetPage?`, `DueDate`), mirroring `CheckpointRequestItem`'s shape.
- [x] Routes: `POST /api/clubs/{id}/rounds/{roundId}/checkpoints` (`ClubsController`); `PUT /api/checkpoints/{id}` / `DELETE /api/checkpoints/{id}` (`CheckpointsController`, now also injects `ClubService`).
- [x] Backend tests (`CheckpointCrudControllerTests.cs`): Admin and Moderator happy path on create/edit/delete; 403 for a plain Member on each; 400 once the round isn't `Reading` (before confirm, and again after finish-book); 404 for an unknown checkpoint. 14 new tests; full suite 102 → 116.

### Frontend — single-checkpoint create/edit/delete

- [x] `api/checkpoints.ts` gains `createCheckpoint`/`updateCheckpoint`/`deleteCheckpoint`; `api/types.ts` gains `CreateCheckpointRequest`/`UpdateCheckpointRequest`.
- [x] `ClubPage.tsx` checkpoint rows gain Edit/Delete (canManage-only, `confirm()` before delete) and a "+ Add checkpoint" inline-form row, all gated inside the existing `canManage && phase === 'Reading'` block.
- [x] Mutations invalidate `queryKeys.clubs.checkpoints(clubId, roundId)`; `ClubPage.module.css` extended for the new controls/form.
- [x] Tests (`ClubPage.test.tsx`): controls hidden for a plain Member, add, edit, delete-with-confirm — 4 new tests. Frontend suite 86 → 90.

### Verification & docs

- [x] Live verification: two+ accounts — create a private club, second account requests via invite link, first approves; suggest two books, both vote, confirm the non-top-voted one deliberately (to prove the override path works), set two checkpoints; both accounts log progress on the book and confirm percentages show correctly on the club page and in `MyClubsCard`; post nested comments and votes on a checkpoint thread from both accounts, confirm Top sort reorders correctly; finish the book, confirm a new `Suggesting` round starts and the old round's checkpoints/comments remain reachable as history. Done via direct API calls exercising every frontend `api/*.ts` function against the running backend (no browser-automation tool available in this session) — confirmed one real bug in the process (see CHANGELOG), fixed frontend-side.
- [x] `CHANGELOG.md` entry.
- [x] `SPEC.md`: §3 domain model gains `Club` and its supporting entities; §4 gains a new "Phase 1.5 — Book Clubs" section; §7 data model gains the eight new tables; §5 architecture gains a note on the comment-tree query approach (single fetch per checkpoint vs. cursor pagination, per §3.6).
