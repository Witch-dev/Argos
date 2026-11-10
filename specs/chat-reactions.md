# Feature Spec — Reactions in club chat

**Status:** ✅ Built 2026-11-09, pushed (Apollon fd34f6e). Asked by the user: "can you add an option to like messages in the club chat like I can do in whatsapp?"

Builds on `specs/club-conversations.md` §3.2 (the chat), which left reactions out of its first phase.

## 1. Decisions (2026-11-09)

1. **As in WhatsApp:** a few emoji, not just a heart. Six, in this order: heart, thumbs up, laughing, surprised, sad, thank you (`ClubChatReaction.Emojis`; the server knows them by name, the client draws them from `web/src/lib/chatReactions.json`).
2. **One reaction per reader per message.** Picking another replaces it; picking the same one again, or tapping your own pill, takes it back. Tapping someone else's pill reacts with that emoji too.
3. **Any Active member, on any message they see**, their own included; not on a deleted message. A deleted message loses its reactions from view (the rows stay until the message or the reader's account goes).
4. **Readers are named** (PRODUCT.md principle 3): the pill's accessible name and tooltip list who reacted ("Heart: Ana and Luis"), and the react panel lists each reader with picture, name and emoji.
5. **Same visibility as the messages:** nobody in a block with the viewer either way, nor an away (suspended or deactivated) reader, counts or is named.
6. **No bell, no email** for a reaction. It is a light signal; a notification per reaction would be noise.
7. **Rate limit:** the existing `reactions` policy (60 a minute per reader), shared with likes.
8. **Erasing an account** removes the reader's reactions (cascade), kept contributions or not. Not part of the data export, like likes.

## 2. How it reaches an open chat

`ClubChatMessage.ReactionsChangedAt` and `ReactionsChangedBy` are set whenever a reaction is added, changed or taken back (taking back one that wasn't there changes nothing). The 5-second check (`GET …/chat/updates`) returns `reactionChanges`: each shown message (up to the `after` cursor, not deleted, visible to the viewer) whose reactions changed since the check's `since` (with the usual 10-second overlap, at most an hour back), with its reactions now. Newly arrived messages carry their reactions already.

A reader in a block with the last changer isn't told of the change (argos-security: an entry with nothing new in it would show someone they can't see is there, as in `bugs/block-detectable-in-shared-club.md`). The count is the number of named readers, so it can never include someone it doesn't name. On the client, a check that started before the reader's own reaction doesn't overwrite it with older reactions.

Known and accepted: a block made or lifted, or a reader suspended, changes what an open chat shows only on the next page load; a visible change made in the same few seconds as one by a blocked reader can wait for the next change or a reload.

## 3. Out of scope

Any emoji (a full picker), a bell row or email for reactions, reactions on club discussion threads, long-press to react on a phone. Add if asked.

## 4. Tasks

**Backend**
- [x] `ClubChatReaction` (key message + reader, emoji up to 16 characters, Owner query filter), `ClubChatMessage.ReactionsChangedAt` / `ReactionsChangedBy`; migrations `ChatReactions`, `ChatReactionsChangedBy`.
- [x] `ClubChatRepository`: `GetReactionsAsync` (no block either way), `GetReactionsChangedSinceAsync`, `SetReactionAsync` (upsert or delete, marks the message).
- [x] `ClubChatService.ReactAsync`; reactions (counted, most picked first, readers in order) on every message DTO; `ReactionChanges` in the check.
- [x] `PUT` / `DELETE /api/clubs/{clubId}/chat/{messageId}/reaction` (body `{ emoji }`), answering with the message's reactions. Error `clubs.chatReactionInvalid`.
- [x] Integration tests (`ClubChatTests`, Reactions): react, replace, take back, own message, readers' order; whitelist, deleted, missing, outsider, other club; the check brings changes and an emptied list, a deleted message shows none; a block hides reactions both ways, and the check says nothing of a blocked reader's reaction or of taking back one that wasn't there; erasure removes them.

**Frontend**
- [x] `ChatReactions.tsx`: `ReactionChips` (pills under the bubble, the reader's own pressed in the green wash) and `ReactButton` (drawn smile beside the message menu, a panel of six emoji and "Who reacted"), placed against the message row so it stays inside the chat at 375px.
- [x] `ClubChat.tsx`: the react mutation, `reactionChanges` applied by the check, a deleted message drops its reactions.
- [x] Strings in five languages (`clubs.chat.react…`, `errors.codes.clubs.chatReactionInvalid`).
- [x] Vitest: react from the panel and take it back from the pill, join someone else's, the check brings reactions.

**Verification**
- [x] Browser check (side ports), Paper and Dark at 1280 and 375: pills, the panel on someone else's and on your own message, pick, take back, join, Escape, no console errors.
- [x] Design critique round (fixes: panel width at 375, pill tone).
- [x] Reviewer and argos-security findings fixed (the check racing a reaction, a no-op take-back, the block hint, count from named readers). Not done: reactions in the data export (likes aren't in it either).
