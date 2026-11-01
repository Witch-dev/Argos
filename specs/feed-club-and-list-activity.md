# Feature Spec — Club and list activity in the Feed

Status: approved 2026-11-01; Phase 1 (backend) built 2026-11-01. Extends `specs/feed-redesign.md` (§3.1 `ActivityEvent`, §3.2 `ActivityRecorder`, §3.3 feed query, §3.5 `ActivityGroupCard`).

## 1. Problem

The Feed (Community tab) shows what the people you follow read, review and write. It says nothing about clubs or lists, which are the parts of the site a new reader is least likely to find. If Ana (followed) starts a book with her club, or builds a list, her followers should see it. It shows them that clubs and lists exist and gives them a way in.

## 2. Decisions

1. **Reuse the activity rows.** New event types go into `ActivityEvents` and appear in the existing `ActivityGroupCard` ("Ana started Dune with *Night Owls*"). No new card family, no new feed filter. They show under **All** and **Activity**.
2. **Which events** (the user's list, 2026-11-01):
   - **Club started a book:** a followed reader is a member of a club whose round moves to `Reading` (book confirmed).
   - **Club progress:** a member's progress on the club's current book.
   - **List created:** already recorded (`ListCreated`); unchanged.
   - **Something added to a list:** a book (or author) added to a list.
3. **Privacy (my call, change it if wrong):**
   - Public club → its events are visible to anyone who follows the member.
   - **Private club → its events are visible only to people who are active members of that same club.** Nobody else sees them, even followers, because the club's existence and reading list are not public (`Club.IsPublic`, invite-token only).
   - Added-to-list events use the same rule as `ListCreated`: the list must be `Public`, and the private-account rule (`PrivateOwnersHiddenFrom`) applies. Lists shared with collaborators or private lists never appear.
   - Blocks apply as everywhere else (either direction hides the actor).
4. **Progress is a milestone, not a stream.** One row per member per round, updated in place (percent changes, `UpdatedAt` moves, `CreatedAt` doesn't, as with ratings in feed-redesign §3.1). Only a row that reaches 25 / 50 / 75 / 100% creates or advances; smaller moves change nothing. Text rounds (no percent) record only "Reading" / "Finished" status changes. This keeps one person's page-by-page logging from flooding followers.
5. **Spoiler-safe:** an event holds book, club, percent. Never comment text, quotes or checkpoint content (same rule as `ClubActivity`).
6. **List adds are grouped, and keep which books.** Adding 10 books to one list in a day is one line: "Ana added 10 books to *Cozy fantasy*", with the titles and a few covers, and expanding shows all of them. Same-day, same-list, same-user adds collapse into one event; each added book (or author) is kept as its own small record under it (decided 2026-11-01). Adding to an **open list** by a stranger records for the adder.
7. **Removing** a book from a list, reordering, renaming: not recorded.
8. **Back-fill:** none. New events only from release; old history is not rebuilt.

## 3. Design

### 3.1 Data

`ActivityType` gains: `ClubBookStarted = 4`, `ClubProgress = 5`, `ListItemsAdded = 6`.

`ActivityEvent` gains nullable columns:
- `ClubId` (FK → Clubs, cascade delete), set on both club types. `BookId` set too (book rounds). For a text round, `BookId` is null and the title is read from the round.
- `RoundId` (FK → ClubBookRounds, cascade delete) on both club types.
- `Percent` (int, nullable): `ClubProgress` only.
- `ListId` is set on `ListItemsAdded`. Its books are in a new table `ActivityListItems(activity_event_id, list_item_id, book_id, author_id, added_at)`: primary key `(activity_event_id, list_item_id)`, cascade-deleted with the event. `book_id` or `author_id` is set (author lists). `list_item_id` is a plain id with no foreign key, so removing the item from the list doesn't fail; the read query drops rows whose list item is gone (a book taken off the list stops showing). The count is the number of rows read, not a stored column.

Check constraint extended so exactly the right ids are set per type. Indexes: existing `(user_id, created_at desc)` is enough; add `(club_id)` for the cascade.

Migration `AddClubAndListActivity`. High effort (touches the recorder constraints and the visibility query).

### 3.2 Recording

`IActivityRecorder` (staged, saved in the caller's `SaveChanges`, as today) gains:

- `StageClubBookStarted(round, memberIds)` — called when a book is confirmed and the round becomes `Reading` (`ClubService`, ~line 1451, where `ClubActivityKind.BookConfirmed` is recorded). One event per **active member** of the club, dated now. Capped at the club's first 50 members to bound the write (a bigger club is rare; accepted).
- `StageClubProgress(clubId, roundId, userId, percent)` — called from `ClubActivityRecorder.RecordRoundProgressAsync`, only when `percent` crosses a milestone above the last recorded one for that member+round. 100% is also what `BookFinished` for the round already shows in the Club; here it is the "finished" milestone.
- `StageListItemAdded(list, book, userId)` — called from `BookListService.AddItemAsync` after a successful add. Find today's (UTC) `ListItemsAdded` event for this user+list and add an `ActivityListItems` row, else create the event with its first row. Capped at 50 rows per event (the rest still count on the list, not in the feed). Skipped when the list is not `Public`. **Visibility is also checked at read time**, so a list made public later shows.
- A member who leaves a club: their club events stay but stop showing (the read query requires active membership of the actor only for private clubs, see 3.3).

### 3.3 Feed query

`ActivityRepository.VisibleEvents` today allows log events (via reading visibility) and list events (public list). Extend with two more branches:

- **Club events** (`ClubBookStarted`, `ClubProgress`): visible when the club `IsPublic` **or** the viewer is an `Active` member of that club. In both cases the actor must still be an `Active` member of that club (someone who left no longer advertises it), and not blocked either way. `PrivateOwnersHiddenFrom(viewer)` applies to the actor, same as list events.
- **`ListItemsAdded`:** the list is `Public` and the owner/actor passes `PrivateOwnersHiddenFrom`.

`ActivityGroupDto` events gain `ClubId`, `ClubName`, `Percent`, and for list adds `Items: [{ BookOpenLibraryId?, BookTitle?, BookCoverUrl?, AuthorName? }]` (titles in the viewer's language, as for other rows; one extra query for the page). Club name is returned only after the visibility check above, so a private club's name never reaches a non-member. Likes on these events use the same `IsVisibleToAsync` path, so they inherit the rule.

### 3.4 Feed card

`ActivityGroupCard` lines:
- "**Ana** started *Dune* with *Night Owls*" → book link, club link (`/clubs/{id}`; a non-member of a public club sees its public page).
- "**Ana** is 50% through *Dune* in *Night Owls*" (and "finished" at 100).
- "**Ana** added 3 books to *Cozy fantasy*" → `/lists/{id}`, with the first titles and a small row of up to 4 covers; "Show" expands one line per book. One book: "added *Dune* to …". Author lists show author names, no covers.
- Group summary line counts them: "Ana did 4 things", otherwise the existing wording extended ("Ana started 1 book and added 3 books to a list").

All text through `t('…')` in the five locale files. New strings need no backend error codes (no new error paths).

## 4. Out of scope

- Notifications for these events.
- A separate "Clubs" feed filter or a "popular clubs" starter block (Future idea).
- Comments on activity rows (still likes only).
- Back-fill of past club or list history.
- Showing joins ("Ana joined Night Owls"). The club's own recent activity already has `MemberJoined`; say if you want it in the feed too.

## 5. Tasks

### Phase 1 — Backend ✅ (2026-11-01)
- [x] `ActivityType` values, `ActivityEvent` columns, `ActivityListItems` table, EF config with check constraint, migration `AddClubAndListActivity` (high effort).
- [x] `ActivityRecorder` methods §3.2; call sites in `ClubService` (book confirmed), `ClubActivityRecorder.RecordRoundProgressAsync`, `BookListService.AddItemAsync`.
- [x] `ActivityRepository.VisibleEvents` + `GetEventsForGroupsAsync` includes (club, list) and DTO fields.
- [x] Tests (Unit + Integration): private club events hidden from a follower who isn't a member, shown to a member; public club shown; leaver hidden; blocked hidden; private-account owner; non-public list hidden; progress below milestone records nothing; same-day list adds merge; liking a hidden event is 404.
- [x] `argos-security` review (privacy rules), then `reviewer`.

**As built (Phase 1):**
- `ActivityListItems.book_id` / `author_id` have no foreign key, like `list_item_id`: an author merge deletes the old author after moving its list entries, so a restricting key would break merges and a cascading one would drop rows. The Feed reads the book or author through the live list item. An index on `round_id` was added next to `club_id`, for the round cascade.
- `StageClubProgressAsync(clubId, roundId, bookId, userId, percent)` takes the round's book. A list addition is staged right after the item's save, inside the list's transaction, so a retried collision can't insert it twice.
- Text rounds record "started" (book confirmed) and "finished" (100%, from the existing Finished status); a text round's "Reading" status isn't recorded, since the started row already says it.
- **Security review:** a club event for a book the reader keeps from the viewer (a log with `ReadingVisibility` the viewer can't see, e.g. Private) is hidden too, checked when the Feed is read. Applies to both club types.
- **Code review:** a list-additions event whose entries were all taken off the list no longer shows ("added 0 books"). Accepted, not changed: a progress row keeps its `CreatedAt` as it moves up (§2.4), so a 100% reached weeks later sits on the 25% day; two progress saves at the same instant can make a duplicate row (a unique index would fail the reader's log save instead).
- Tests: `Unit/ActivityRecorderTests.cs`, `Integration/ClubAndListActivityFeedTests.cs` (also a text round, a private log, all entries removed, someone else's open list).

### Phase 2 — Frontend
- [ ] Types, `ActivityGroupCard` lines and summary, locale keys in en/es/pt-BR/de/fr.
- [ ] Vitest for the card wording; `web-design` plan + screenshot critique (`/web-design` read `PRODUCT.md`/`DESIGN.md` first).

### Phase 3 — Verification
- [ ] `browser-check`: two readers, one follows the other; public and private club started, progress at 25/50/100, list created and 3 books added; follower sees them, a non-member does not see the private club.
- [ ] CHANGELOG line; tick the boxes after re-reading this spec against what was built.
