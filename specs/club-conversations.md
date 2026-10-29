# Feature Spec — Club conversations

**Status:** written 2026-10-28. Phase 1 (threads) and Phase 2 (club chat) built 2026-10-29 (§3.1 and §3.2 "As built"); Phase 3 not built.

## 1. Problem

Readers open the app when they have a reading update to log, and then leave. Nothing brings them back in between. The user wants talking inside the app to be the reason to come back (conversation 2026-10-28):

- A checkpoint's discussion today is one long page: every post and every reply under it, all open at once. It reads like one big post with everything as replies. The user wants it like Reddit: a list of threads (title plus a short preview), and tapping one opens it on its own screen.
- There's no place for everyday talk between checkpoints.
- Replies in a club discussion notify nobody, not even in the bell (found while writing this spec: `CheckpointDiscussionService` records no notification). A member never learns that someone answered them.
- Quiet readers, who never post, have nothing that reminds them the app exists.

## 2. Decisions

### 2.1 Asked 2026-10-28

- **Build threads, club chat and the weekly digest** (this spec). Direct messages between readers and live updates (SignalR) are in `FUTURE-IDEAS.md` for after launch.
- **The goal is retention:** each phase should give a member a reason to come back, so each one ends with an email that brings them back, not only a screen.

### 2.2 Decisions I made, for the user to confirm

**Threads (Phase 1)**
- **Club checkpoints only.** A buddy read keeps its single thread in page order, because each post there unlocks at the writer's page and splitting it into threads would break that (`specs/stronger-clubs.md` §3.5).
- **A thread is today's top-level post plus a title.** No new table: `CheckpointComment` gets `Title` (nullable, 3–120 characters, required for a new top-level comment or question, not allowed on replies). Old posts have no title and show their first line (cut at 80 characters) instead, so nothing needs backfilling.
- **Questions from the Admin/Moderators (Prompts) are threads too,** pinned above the rest as they are now. The question is the title; the body text is optional.
- **Highlights stay their own tab** and look the same. A highlight's passage already works as its title, and each one rarely gets long replies. Revisit if readers write long threads under highlights.
- **The list shows**, per thread: title, a 2-line preview of the body, author, score, reply count, and when it was last active (its newest reply). Sort is Top / New as now, plus **Active** (newest reply first). Active is the default, because it shows where the talk is.
- **The thread screen** is `/clubs/:id/checkpoints/:checkpointId/posts/:postId`: the post, its votes, and the existing `CommentTree` under it with reply, edit, delete, report and sort as now. A back link returns to the list.
- **Spoiler blur**: both screens stay blurred until "I've read this far", the same reveal as now (one reveal per checkpoint covers all its threads).
- **Reply notifications:** a new bell type `CheckpointReply` (added at the end of `NotificationType`, under the *Comments and replies* switch), sent to the parent comment's author and to the thread's author, never to the replier. Grouped one row per thread, like likes, so a busy thread doesn't fill the bell. Blocks stop it as they stop other replies. The email for these comes in Phase 2.
- **Links go to the thread.** The bell item, club activity ("Ana commented on Part One"), reports and the admin's hidden-content notice open the thread, and scroll to the comment when there is one.

**Club chat (Phase 2)**
- **One chat per club, buddy reads included**, as a *Chat* tab on the club page. Active members read and write; a left, banned or removed member loses access straight away. New members see the history (like a Discord channel).
- **Text only**, up to 1,000 characters. Links show as links (`rel="nofollow noopener ugc"`). No pictures, files, reactions or replies-to-a-message in this phase.
- **Spoilers:** the composer says "Spoilers go in the part's discussion" with a link to the current checkpoint. A message can be marked **Spoiler**, which blurs it until tapped. Cheap, and it saves the chat in a club that reads at different speeds.
- **Checking every 5 seconds** while the Chat tab is open and the browser tab is visible; nothing while hidden. The rest of the app learns about new messages through the existing 60-second unread check (§3.2). This keeps to SPEC.md §5 (no websockets, no queues). Moving to SignalR later changes only how messages arrive, not the tables (`FUTURE-IDEAS.md`).
- **Pages of 50**, newest at the bottom. "Load older" fetches the 50 before the oldest one shown (by time, then id).
- **Read state per member:** `ClubChatRead` (club, user, last read message time). Opening the tab marks everything read.
- **An unread dot**, not a number, on the club in the sidebar and on the Chat tab. A number in a busy chat feels like a chore.
- **Mute this chat**, per member: no dot, no email. One tap in the tab's menu. A muted member can still read and write.
- **Safety, reusing what's there:**
  - The author can delete their own message; the Admin and Moderators can delete anyone's. Deleted shows "Message deleted".
  - **Report** goes to the existing reports queue (`ReportTargetType.ClubChatMessage`), and the admin can hide it (`IHideable`).
  - **Blocks:** a message from a reader in a block with the viewer shows as "Message hidden", the same rule as club discussions (`HiddenCommentThreads`, `bugs/block-detectable-in-shared-club.md`).
  - **Rate limit:** 10 messages per 30 seconds per member; suspended accounts can't post.
- **Account erase:** messages are handled the same way as checkpoint comments when an account is erased. **Club delete:** its messages go too.
- **The "you missed this" email**, under the existing *Club emails* switch: when a member has unread chat messages, or Phase 1 replies, that are at least 2 hours old and they haven't opened the club since, the hourly job sends one email: "3 new messages in Dune Club · Ana replied to your thread *Is the narrator lying?*". At most one per member per club per day; never for a muted chat. Same look, languages and off link as `ClubEmails`. It counts toward `ClubDailyLimit`.

**Weekly digest (Phase 3)**
- **One email on Monday at 12:00 UTC**, only when there's something to say. Possible contents:
  - Your clubs: parts due this week, meetings, unread chat and replies.
  - Readers you follow: books started and finished, new reviews and lists (from `ActivityEvents`, checked against visibility and blocks when the email is built, never copied text from private things).
  - New books from authors you follow.
  - Your yearly goal ("12 of 30, on track"), only if you set one.
  - Nothing to say means no email.
- **Off by default**, as `specs/notifications.md` decided, with a switch in Settings → Notifications and a one-click off link. *Asking the user:* on by default would bring back more readers, and the off link keeps it fair. Decide before Phase 3.
- **Kind, per `PRODUCT.md` §5:** no "you haven't logged in", no streak warnings, no guilt.

**Email budget (all phases)**
- Resend's plan and `EmailOptions.DailyLimit` (80/day) were sized for account and club emails. The Phase 2 email fits in `ClubDailyLimit` at beta size. A digest to every reader doesn't: it goes out in hourly batches over Monday under its own share, and past a few hundred readers it needs a higher Resend plan. Check the plan before Phase 3.

## 3. Design

### 3.1 Phase 1 — Threads

**Data**
- `CheckpointComment.Title` (nullable, max 120). Migration.
- `NotificationType.CheckpointReply`, subject the thread, `CommentId` the newest reply.

**Endpoints**
- `GET /api/checkpoints/{id}/comments?sort=active|top|new&tab=Comment` now returns **top-level posts only**: `title` (or the first line), `preview` (first 200 characters of the body), author, score, the viewer's vote, `replyCount`, `lastActivityAt`, kind, pinned. Replies aren't sent. Buddy reads keep today's full answer.
- `GET /api/checkpoints/comments/{postId}` returns one top-level post with its whole reply tree, under the same rules as today (membership, blocks, hidden, deleted placeholders). 404 for a reply's id, a hidden post or no access.
- `POST /api/checkpoints/{id}/comments` takes `title`. Required for a new top-level Comment or Prompt in a club, refused on a reply and in a buddy read (new error codes, translated).
- `PUT` on a comment can change the title (author only, top-level only).

**Browser**
- **The checkpoint page:** the header and reveal as now; then pinned questions; then a "Start a thread" button, which opens the title and body form; then the thread cards. Each card is one link to its thread.
- **The thread page:** the same header (checkpoint name, book), the post in full, then `CommentTree`. Deep links scroll to `#comment-<id>`.
- **Empty list:** "No threads yet. Start the first one."
- Translations for all of it in the five languages.

**As built (2026-10-29)**
- **A hidden thread with replies still shown stays as a placeholder**, in the list and on its page, instead of the strict 404 in the endpoint list above: a 404 would make the other members' replies under it unreachable, which `specs/safety-and-moderation.md` §3.4 exists to prevent. A hidden thread with nothing shown under it is a 404, as planned. The placeholder carries no title, preview or author.
- **Highlights open on the thread page too** (the bell's link for a reply under a highlight goes there); the Highlights tab is unchanged.
- **Buddy-read replies still notify nobody**: a buddy read has no thread page to link to. Left for later (one line in `FUTURE-IDEAS.md` if it comes up).
- **The reply row** is re-counted from the replies themselves (`NotificationRepository.SyncCheckpointRepliesAsync`), as likes are: on each reply, when a reply is deleted, and when the admin hides or unhides one. The bell leaves out a row whose thread's author is now in a block with the reader. A suspension or deactivation of a replier only shows on the next re-count.
- **Links**: `ClubActivity.CommentId` (new column, no foreign key) lets activity open the thread; reports and hidden-content notices find the thread by walking up the comment's parents (`CheckpointThreads`). The report queue shows a thread's title; account erasure clears it; the data export has a "Thread title" column.
- **Cost**: the list and the thread page both build the checkpoint's whole tree (as the old page did), and the thread lookup loads every comment's parent on the checkpoints involved. Fine at a book club's size (`specs/book-clubs.md` §3.6); a thread-only query is the next step if checkpoints grow large.
- Old posts get no backfill: their first line (cut at 80 characters) is the title, and the preview starts after it (`ThreadTitles`).

### 3.2 Phase 2 — Club chat

**Data**
- `ClubChatMessage`: Id, ClubId, UserId, Content (≤1,000), IsSpoiler, CreatedAt, IsDeleted, plus the `IHideable` fields. Index (ClubId, CreatedAt, Id).
- `ClubChatRead`: ClubId, UserId, LastReadAt, IsMuted, LastEmailedAt. Primary key (ClubId, UserId).
- `ReportTargetType.ClubChatMessage`. Migration.

**Endpoints** (members only, like the club's other member endpoints)
- `GET /api/clubs/{id}/chat?before=<cursor>`: the 50 messages before the cursor (or the newest 50).
- `GET /api/clubs/{id}/chat?after=<cursor>`: messages after the newest one shown, for the 5-second check. Answers empty quickly.
- `POST /api/clubs/{id}/chat` `{ content, isSpoiler }`: rate-limited.
- `DELETE /api/clubs/{id}/chat/{messageId}`: the author, Admin or Moderator.
- `POST /api/clubs/{id}/chat/read`; `PUT /api/clubs/{id}/chat/mute` `{ muted }`.
- The existing unread-count answer gains `clubsWithUnreadChat: [clubId]`, so the sidebar dot needs no new call.

**Background job:** the "you missed this" email in `NotificationBackgroundService`, hourly, as §2.2.

**Browser**
- **A Chat tab** on the club page: messages grouped by day, each with avatar, name and time (consecutive messages from one person share a header); the composer at the bottom with a Spoiler toggle; the spoiler hint.
- The tab's menu: Mute this chat / Unmute. Each message's menu: Report, Delete.
- On a phone the composer stays above the keyboard and the list keeps its place when older messages load.
- **The dot** on the club in the sidebar and on the tab.
- **Settings → Notifications:** the *Club emails* switch's description mentions missed messages.

**As built (2026-10-29)**
- **Blocks leave no placeholder.** A message from a reader in a block with the viewer is left out, both ways, with nothing in its place, instead of the "Message hidden" of §2.2: club discussions drop a blocked reader's threads the same way, and a placeholder would tell the blocked reader they were blocked (`bugs/block-detectable-in-shared-club.md`). The unread dot, the 5-second check (including the ids of deleted or hidden messages) and the email leave them out too. A moderator can't delete a message from someone in a block with them (they don't see it); they report it, or another moderator deletes it.
- **Data:** `ClubChatMessage.DeletedAt` (a time) instead of `IsDeleted`, so the 5-second check can tell an open chat what was deleted. A deleted message's text is cleared; it shows as "Message deleted" without author. Zero-width and text-direction characters are dropped from a message, so one can't look empty or disguise a link.
- **The 5-second check is `GET /api/clubs/{id}/chat/updates?after=<newest message's time>&since=<last answer's server time>`**, not `?after=` on the page endpoint: it answers new messages (looking 10 s back, the client skips ids it has), `removedIds` (hidden from the viewer since: they drop out) and `deletedIds` (they become "Message deleted"), over at most the last hour. A block made, or a message unhidden, while a chat is open shows on the next load.
- **Unread** counts messages by others after the member last read the chat and after they (last) joined, so new members get no dot for the history. Opening the Chat tab marks it read once the browser tab is visible; so does each new message that arrives while it is open. Muting also marks it read.
- **"Haven't opened the club since"** is read as: the chat messages are unread (`LastReadAt`), or the thread's reply row is unread in the bell. The email goes only for something new since the last one (a message or a reply row updated after `LastEmailedAt`), at most once per 24 hours per member and club, and is let go again when it couldn't be queued (the club emails' daily share) so the next hour tries. Mute stops only the chat part: replies in the member's threads are still emailed, as they are in the bell. A reply row whose thread author or latest replier is in a block with the member doesn't count; a replier who can't be named (away, blocked since) is left out of the sentence. The reply count is the bell row's (Phase 1), so it can include a reader blocked after replying.
- **Browser:** "Club | Chat" link tabs under the club and buddy-read headers (`?tab=chat`, so the email, the bell and links open it), with "Mute chat" at the end of the row while the chat is open. A spoiler, like a deleted message, stands alone instead of joining the writer's run. Enter sends with a keyboard and mouse; on a touch screen Send sends. The floating feedback button is hidden on the chat, where it would cover Send. On a phone the field's label is visually hidden. The dot is on Clubs in the sidebar, the club in "Your clubs" (rail and Clubs page) and the Chat tab.
- **Also:** chat messages are reportable (`ReportTargetType.ClubChatMessage`) and hideable; the author's "hidden" notice opens the chat; the data download has `club-chat.csv`; kept messages move to "Deleted user" on erasure and the rest go with the account; a club's chat goes with it. Rate limit: 10 per 30 s per reader, a sliding window (`RateLimits:ClubChatMessagesPer30Seconds`).

### 3.3 Phase 3 — Weekly digest

- `NotificationGroup.WeeklyDigest` (off by default unless the user decides otherwise, §2.2) and `UserSettings.DigestLastSentAt`.
- A `DigestEmails` builder beside `ClubEmails`: sections in the order of §2.2, each skipped when empty, five languages, the off link (purpose `DigestOff`) reusing the `/email-off` page with the right wording.
- The Monday job in `NotificationBackgroundService`: readers whose switch is on, a confirmed email, not suspended or scheduled for deletion, and no digest in the last 6 days. Sent in hourly batches under its own daily share.

## 4. Explicitly out of scope

- Direct messages between readers, live delivery (SignalR, "typing…"), browser and phone push notifications: `FUTURE-IDEAS.md`.
- Threads in buddy reads; threads for highlights; @mentions (still in `FUTURE-IDEAS.md`).
- Pictures, files, reactions, replies-to-a-message and editing in chat.
- Chat search, and chat outside clubs.

## 5. Tasks

### Phase 1 — Threads (size M; Opus medium)

#### Backend
- [x] `CheckpointComment.Title` + migration; title rules on create and edit (top-level only, club only, 3–120), new error codes + translations
- [x] The list answer: top-level only with preview, reply count, last activity; `active` sort; buddy reads unchanged
- [x] `GET /api/checkpoints/comments/{postId}`: one thread with its tree, the same access, block and hidden rules
- [x] `NotificationType.CheckpointReply`, grouped per thread, to the parent's and the thread's authors, blocks respected
- [x] Tests: titles required/refused, old posts' first-line title, list shape and sorts, thread access (non-member, banned, blocked, hidden, reply id), reply notification recipients and grouping (`ClubThreadsTests`)

#### Frontend
- [x] Checkpoint page as a thread list, with the "Start a thread" form (title + body) and the Active / Top / New sort
- [x] Thread page and route; reveal blur on both; deep links to a comment
- [x] Bell item, club activity, report and hidden-content links open the thread
- [x] Five languages; update `CheckpointDiscussionPage.test.tsx`, tests for the thread page

#### Verification & docs
- [x] `reviewer`; `argos-security` (new endpoint with access rules). Fixed from them: the report queue shows the title, erasure clears it and the export includes it, a blocked thread author's row leaves the bell, hide/unhide re-counts the reply rows
- [x] `web-design` screenshot round on both screens, phone and desktop
- [x] `browser-check`: two members, start a thread, reply, the other sees the bell and the thread
- [x] CHANGELOG line

### Phase 2 — Club chat (size M–L; **Opus high**: access, blocks, reports, rate limit)

#### Backend
- [x] `ClubChatMessage`, `ClubChatRead`, `ReportTargetType.ClubChatMessage` + migration (`ClubChat`); club delete and account erase handling
- [x] Chat endpoints (pages, updates, send, delete, read, mute), rate limit, unread in the count answer
- [x] Reports and admin hide for chat messages; blocks hide messages
- [x] "You missed this" email: builder in five languages, hourly job, once per club per day, mute and switch respected, counted in `ClubDailyLimit`
- [x] Tests: member-only access (left, banned, removed, suspended), paging cursors, delete rights, block hiding, rate limit, unread and mute, the email's who/when/once (`ClubChatTests`, `ClubChatEmailTests`, `ClubEmailsTests`)

#### Frontend
- [x] Chat tab: messages, day groups, composer, spoiler toggle and cover, load older, the 5-second check while visible
- [x] Message menu (report, delete) and Mute in the tab row; sidebar, "Your clubs" and tab dot
- [x] Five languages; tests (`ClubChat.test.tsx`, `ClubTabs.test.tsx`, `chatLinks.test.ts`)

#### Verification & docs
- [x] `reviewer` and `argos-security`. Fixed from them: the 5-second check now leaves blocked readers' deleted ids out and caps its look-back, bad times answer 400, invisible characters are dropped, a check no longer overwrites what changed while it was out, times sort correctly, the chat is read only once visible, the email skips a reply row whose latest replier is in a block and lets a failed claim go
- [x] `web-design` screenshot rounds (two critique rounds: Mute moved into the tab row, a smaller phone composer, the feedback button off the chat, buddy-read wording, a spoiler stands alone)
- [x] `browser-check`: two members chatting, a block, a report, the email in Mailpit (all passed; its layout findings fixed)
- [x] Privacy policy: club chat messages (what's kept, who sees them, what happens on erase) and the missed-messages email
- [x] CHANGELOG line

### Phase 3 — Weekly digest (size S–M; Opus medium)

- [ ] User decision: on or off by default (§2.2); Resend plan checked against the reader count
- [ ] `NotificationGroup.WeeklyDigest`, `DigestLastSentAt` + migration; switch in Settings → Notifications
- [ ] `DigestEmails` (sections, five languages, off link); Monday job in batches
- [ ] Tests: empty means no email, visibility and blocks in the friends' section, once a week, switch and off link
- [ ] `reviewer` and `argos-security` (what other readers' activity the email reveals)
- [ ] See it in Mailpit with a full and a near-empty week
- [ ] Privacy policy: the digest; CHANGELOG line
