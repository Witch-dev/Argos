# Feature Spec — Comments on What's new

**Status:** written 2026-11-06, decisions confirmed by the user the same day; not built. Extends `specs/whats-new.md` (which listed comments as out of scope).

## 1. Problem

What's new is one-way: the owner writes an update and readers can only read it (or ring the bell). The user wants a conversation with early readers: they comment on an update, the owner answers, they answer back. This is also the cheapest feedback channel there is, right where the news is.

## 2. Decisions (asked 2026-11-06)

- **Public to read.** Visitors see the comments on `/whats-new`; only signed-in readers can write.
- **Comments plus replies.** The existing comment tree: a comment, replies under it, edit, delete, votes, report. Nothing new to design for the thread itself.
- **Bell both ways.** The admins get a bell notice for each new comment on an entry (and for each reply to a comment of theirs); a reader gets one when someone replies to their comment. Uses the existing `Comment` and `Reply` notification types and the "Comments and replies" switch in Settings.
- **A "Comments" switch per entry** in the admin editor, on by default. Plus the report and hide tools that already exist for comments.

## 3. Design

### 3.1 Backend

- `CommentTargetType` gains `WhatsNew` (`TargetId` = the entry id). Same pattern as `List` and `Reading`: reuses the `Comment` table, no schema change for the comments themselves (enum stored as int). Whole-post comments and replies only, no highlights (like `List`): `CommentService` rejects anchors for it.
- `WhatsNewEntry` gains `CommentsEnabled` (`bool`, default true). Migration `WhatsNewComments`.
- **Rules in `CommentService`** for target `WhatsNew`:
  - The entry must exist and be published (a draft has no comments), else not found.
  - Writing a new comment or reply needs `CommentsEnabled`; turning it off keeps the existing comments visible and read-only ("Comments are closed"). Edit and delete of one's own comment still work.
  - Blocks, rate limits, the content length and the hiding of reported comments behave as for the other targets. A blocked reader can't reply to a block-er, but the admin is never blocked from replying.
- **Reading:** the comment tree endpoint is open to visitors for this target only (`AllowAnonymous`, the `public` rate-limit policy), with the same hidden/blocked filtering for signed-in viewers. `GET /api/whats-new` entries gain `commentCount` and `commentsEnabled`, so the list shows the count without loading every thread (`CountWholePostCommentsAsync`, as lists do).
- **Notifications** (`NotificationRecorder`): `WhatsNew` maps to subject `WhatsNewEntry` (already exists).
  - New top-level comment: one `Comment` row for each admin (except the author), grouped like other comment notices so a busy entry doesn't ring fifty times.
  - Reply: one `Reply` row to the parent comment's author, as now. If an admin is the replier, the parent author gets it; nobody is told twice.
  - Text names the entry's title in the reader's language (fallback English) and opens `/whats-new#entry-<id>`, which scrolls to and opens that entry's comments.
- **Cleanup:** deleting an entry deletes its comment thread (`DeleteByTargetAsync`); account erasure already handles comments by target type, add `WhatsNew` to its list for the author's comments only. Unpublishing hides the comments with the entry.
- **Admin:** `PUT /api/admin/whats-new/{id}` accepts `commentsEnabled`.
- Error code for "comments closed", translated under `errors.codes`.

### 3.2 Frontend

- Each entry card on `/whats-new` gets a footer line "N comments" / "Comment" that opens the thread under the card (collapsed by default so the page stays a readable list; opens by itself when the URL hash points at the entry). Uses `CommentTree` and `CommentForm` as lists do.
- Visitors see the thread and, where the form would be, a "Sign in to join the conversation" link. A closed entry shows "Comments are closed" instead of the form.
- The owner's replies get a small "Winged Words team" label next to the name so readers can tell they are talking with the site. *(Needs checking against how admin accounts already show; if there is no such label, this is the one new UI piece.)*
- Admin editor: a "Allow comments" checkbox beside Save draft / Publish, and the comment count in the entry list.
- Bell sentences ("{name} commented on “{title}”", "{name} replied to you on “{title}”") in all five locale files, and the Settings copy for "Comments and replies" mentions What's new.
- Design: no new tokens; follows `DESIGN.md`. Mobile: thread indented at most two levels, as elsewhere.

## 4. Out of scope

Likes on entries, email for new comments (add later if the bell isn't enough; see `FUTURE-IDEAS.md`), comments on an entry in a specific language only (one thread per entry for all languages), images in comments, a separate inbox page for the admin.

## 5. Tasks

### Before building
- [x] Visibility, threading, notifications and per-entry switch confirmed by the user (2026-11-06).
- [ ] Check how the admin's name shows in replies (the team label in §3.2).

### Backend (medium effort)
- [ ] `CommentTargetType.WhatsNew`; `CommentService` rules (published only, anchors rejected, closed entries); anonymous read of the tree.
- [ ] `CommentsEnabled` on the entry, migration `WhatsNewComments`, admin update, `commentCount` and `commentsEnabled` in the list.
- [ ] Notifications: admin notice for a top-level comment, reply notice, subject and link, grouping.
- [ ] Cleanup on entry delete and account erasure; error code and translations.
- [ ] Tests: visitor can read but not write; draft entry refuses; closed entry refuses new comments but shows old ones; admin gets the bell, the commenter gets the reply bell, nobody twice; blocked reader; delete entry removes the thread; hidden comment disappears.

### Frontend
- [ ] Comments footer and thread on each entry card; deep link by hash.
- [ ] Visitor "sign in" prompt and the closed state.
- [ ] Admin: "Allow comments" checkbox and count.
- [ ] All text in the five locale files; bell rows (`NotificationRow`).
- [ ] Tests: thread opens, visitor sees sign-in, closed hides the form, hash opens the entry.

### Verification & docs
- [ ] `browser-check`: visitor read, reader comment, admin reply, bell on both accounts, close comments, phone width.
- [ ] `reviewer` and `argos-security` (new public read of user content, new notification fan-out, anonymous endpoint), fix findings.
- [ ] Update `specs/whats-new.md` §4 (remove "comments") and `CHANGELOG.md`.
