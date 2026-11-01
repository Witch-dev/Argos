# Feature Spec — Club chat in the bell

**Status:** ✅ Built 2026-11-01, pushed (Apollon 0cc0ac2). Asked by the user: "I think they should also get a bell notification, so it's more clear" (after hearing that unread chat only showed as a dot and, two hours later, an email).

Builds on `specs/club-conversations.md` §3.2 (the chat, its dot, mute) and `specs/notifications.md` (the bell).

## 1. Problem

Unread club chat showed as a small dot (sidebar, club card, chat bar) and, after 2 hours, a "you missed N messages" email. Nothing reached the bell, the place readers look for "something happened", so a busy chat was easy to miss.

## 2. Decisions (chosen by the user 2026-11-01)

1. **One bell row per club, grouped.** New type `ClubChatUnread`, subject the club. The first unread message creates it; each later one updates the same row (count, latest writer, moves to the top) and keeps it unread. It never piles up one row per message.
2. **The row counts the reader's unread messages**, by the same rule as the dot (`ClubChatRepository.GetClubsWithUnreadAsync`): from other members, after the reader joined and last read, not deleted, not hidden, not by an away reader, nobody in a block with the reader either way. `ActorCount` holds that count and `ActorId` the latest writer.
3. **Reading the chat removes the row.** Opening the chat or writing in it (both mark it read) deletes the reader's row, so the bell never says "5 new messages" about messages already read. The next message starts a fresh row.
4. **Muting the chat silences it.** A muted chat makes no row, and muting deletes the one there is. Unmuting brings nothing back until the next message.
5. **Under the Clubs switch** in notification settings, like every other club notification. No new switch.
6. **Deleted or hidden messages re-count the rows quietly**; a row with nothing left goes. An unhidden message brings back the rows it is counted on (quietly, not made unread again). A block made or lifted re-counts the rows of the clubs the two readers share, so a blocked writer leaves the count and the row names someone else (found by the review: the read-time filter hides a row whose actor is in a block with the reader).
7. **Shown while the reader is still an Active member** (the read-time `Valid` filter).
8. **Sentence:** one message, "Ana wrote in the Night Owls chat"; more, "5 new messages in the Night Owls chat, the latest from Ana". The row opens the club with the chat open (`?tab=chat`).
9. **The email stays as it is.** The bell is the quick signal; the email is for readers away from the app.

## 3. Out of scope

A bell row per message, @mentions, replies to a chat message, push notifications. Add if asked.

Known and accepted: a member leaving, a writer being suspended or deactivating doesn't re-count the rows; the count catches up at the next message or when the chat is read (a former member's row is hidden by the read filter). A message sent in the same few milliseconds as a reader opens the chat can leave a row that the next open clears.

## 4. Tasks

**Backend**
- [x] `NotificationType.ClubChatUnread` (added at the end), in the Clubs group and `UniquePerSubject`; migration `ClubChatBell` for the unique index's filter.
- [x] `NotificationRepository.SyncClubChatAsync(clubId, writerId?, addMissing, now)`: a new message upserts every eligible member's row (Active, not the writer, not away, no block with the writer, Clubs switch on, chat not muted) with their unread count, made unread; an unhide adds missing rows quietly; otherwise a quiet re-count of the existing rows, deleting the empty ones. `GetSharedClubIdsAsync` for blocks. `ClearClubChatAsync(clubId, userId)` deletes a reader's row.
- [x] Recorder: `ClubChatSentAsync`, `ClubChatChangedAsync`, `ClubChatReadAsync`, `BlockChangedAsync`. Called from `ClubChatService` send / delete / mark read / mute, `ModerationService` hide / unhide of a chat message, and `BlockService` block / unblock.
- [x] `Valid` filter: an Active member of the club.
- [x] Integration tests (`ClubChatBellTests`, 6): grouping and count, reading removes it, mute and the Clubs switch, block and leaving, delete / hide / unhide, block re-count.

**Frontend**
- [x] `ClubChatUnread` type, sentence (one / many), link to `?tab=chat`, strings in five languages; marking the chat read refreshes the bell.
- [x] Vitest for the sentence and link.

**Verification**
- [x] `reviewer` agent: SQL placeholders and the unread rule checked against the dot. Two findings fixed (unhide didn't bring the row back; blocking the latest writer hid the whole row), two accepted (§3). No new input or privacy surface, so no `argos-security` round.
- [x] Browser check (passed, no console errors, desktop and 375 px): two readers, B writes, A sees the bell row; B writes again, still one row with the count; A opens the chat, row gone; A mutes, B writes, no row.
- Flaky test found on the way, not caused by this change: `bugs/chat-erasure-test-races-moderation-erasure.md`.
