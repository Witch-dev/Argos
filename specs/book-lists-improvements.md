# Feature Spec — Book List Improvements

**Status:** ✅ Implemented (2026-10-01), all four phases. Browser pass done 2026-10-06 (see Verification).

Builds on SPEC.md Phase 5 (Lists): `BookList`, `ListItem`, `BookListService`, `BookListsController`, `ListsPage`, `ListDetailPage`, `AddToListButton`. Read those first. This spec extends them; it doesn't replace them.

## 1. Problem

Lists work as a private filing cabinet: create a list, add books, move them up and down, set public or private. But lists are what make Letterboxd addictive, and here they don't do any of the things people love there:

- **You can't say *why* a book is on the list.** `ListItem.Note` exists in the database and the list page even renders it, but `AddToListButton` always sends `note: null`. Nothing in the UI can write one.
- **There's no sense of a ranking.** A "Top 10" list and a "books I own" list look identical.
- **Lists don't react to *you*.** Opening someone's "100 essential fantasy novels" doesn't tell you that you've read 23 of them, even though Argos knows from your logs.
- **Lists are invisible.** The only way to find a list is to visit someone's profile. There's no browse page, no likes, no comments, no tags, and a book's page doesn't show which lists it's on.
- **Lists can't be shared or reused.** No copying someone's list as a starting point, no reading challenges, no building a list with friends, and no "share by link but don't publish" option.

**What we compared against:**
- **Letterboxd:** ranked lists with numbers, a write-up at the top of the list, a cover-collage preview, "you've watched X%", likes and comments, popular lists, unlisted share links, and list cloning plus progress tracking (paid features there).
- **StoryGraph:** users keep asking for custom lists beyond the fixed Read/TBR shelves, and some point to Letterboxd as the model.
- **Goodreads Listopia** (open lists anyone can add to and vote on) is the example of what **not** to build. Fake accounts, authors voting for their own books, and spam lists swamped it. That's why shared lists here are invite-only and nothing is open-voted.

## 2. Clarifying decisions made (via questions to the user)

**Phase 1: better lists**
- **Notes can be written in both places:** an optional note box in the "Add to list" popup, and editable later on the list page.
- **Ranked is an on/off switch per list.** When on, items show #1, #2, #3…. When off, the order is just the curator's arrangement, with no numbers.
- **Read count ("You've read X of Y")** counts a book only when the viewer has a `Read` log for it. `CurrentlyReading` books get a separate small marker but don't count toward the number.
- **Sorting inside a list only changes the view.** Picking "sort by year" never changes the saved order. Reordering is disabled while a non-default sort is active.
- **Privacy has three options: Public / Unlisted / Private.** Unlisted means anyone with the link can view it, but it never appears in browse, search, profiles, the book page or any feed. Private means the owner, plus accepted collaborators once Phase 4 exists.

**Phase 2: social and discovery**
- **List comments work the same as review comments:** reuse the existing `Comment` system (replies, up/down votes, edit/delete).
- **Tags are free-form, with suggestions.** People type any tag, and the input suggests popular existing tags so everyone settles on the same words.
- **The browse page has four parts:** Popular this week, Recently updated, From people you follow, and search with tag filtering.

**Phase 3: reuse**
- **Copying a list copies the books and their order only.** It doesn't copy the original curator's notes, description or tags. The copy starts Private and shows "Based on @user's *Title*" with a link.
- **Anyone can take on a challenge.** Any reader can click "Take the challenge" on a list they can see and set their *own* goal date, and they get a personal progress bar. The list shows how many people are taking it on.

**Phase 4: shared lists**
- **Collaborators can add books, write notes on books they added, reorder, and remove books *they* added.** Only the owner edits the title, description, tags, privacy or ranked setting, removes other people's books, manages collaborators, or deletes the list.
- **Joining uses invite and accept.** The owner invites a user. The invite appears in a "Pending invites" box on the invitee's Lists page, where they can accept or decline. This works without a notification system, which Argos doesn't have yet.

**Delivery**
- **One spec in four phases**, each shippable on its own (§5). Importing from Goodreads/StoryGraph is **out of scope**. It's in `FUTURE-IDEAS.md`.

**Decisions made while writing the spec (not asked; change any of these before starting):**
- **A book can appear only once per list.** Adding a duplicate returns 400, and the UI greys out lists that already contain the book.
- **Books read before taking on a challenge count toward it** (Letterboxd behaves the same way). The challenge measures "have you read these books", not "did you read them since you started".
- **You can't like your own list.** This stops people boosting their own lists into "Popular".
- **Shared lists appear on the owner's profile only.** Collaborators see them under "Shared with you" on their own Lists page, not on their public profile.

## 3. Design

### 3.1 Data model changes

**`BookList`**

| Field | Change | Meaning |
|---|---|---|
| `IsPublic` | **replaced** by `Visibility` | enum `Private` / `Unlisted` / `Public`. Migration: `true → Public`, `false → Private`. |
| `IsRanked` | **new**, `bool`, default `false` | Show position numbers. |
| `UpdatedAt` | **new**, `DateTime` | Bumped on any change to the list or its items. Drives "Recently updated" and the cursor. Backfilled from `CreatedAt`. |
| `CopiedFromListId` | **new**, `Guid?`, FK, `SetNull` on delete | Phase 3 credit link. Added now so this table needs only one migration. |

**`ListItem`**

| Field | Change | Meaning |
|---|---|---|
| `AddedByUserId` | **new**, `Guid`, FK to users | Who added it. Phase 4 permissions and the "added by" avatar. Backfilled with the list owner. |
| `AddedAt` | **new**, `DateTime` | Used by the "Date added" sort. Backfilled with the list's `CreatedAt`. |
| `Note` | **max length 1000** | Already exists. Now writable. |
| unique `(BookListId, BookId)` | **new constraint** | One copy of a book per list. Before adding the constraint, the migration deletes duplicates (keeping the lowest position) and renumbers positions to close the gaps. |

The Phase 2–4 tables are listed in their own sections below. Every child table of a list (likes, tags, challenges, collaborators) **cascades on list delete**. List comments use the polymorphic `Comment` table, which has no foreign key, so `BookListService.DeleteAsync` deletes them explicitly (§3.6).

### 3.2 Who can see a list (one rule, used everywhere)

There's a single helper, `BookListAccess.CanView(list, viewerId, collaboratorIds)`, plus a matching repository filter for list queries:

| Visibility | Who can open it by id | Appears in profiles / browse / search / book page / feed |
|---|---|---|
| `Public` | everyone | yes |
| `Unlisted` | everyone with the link | **never** (the owner and collaborators still see it on their own Lists page) |
| `Private` | owner + **accepted** collaborators + **pending** invitees (so they can decide whether to accept) | never |

Anything that can't be seen returns **404, not 403**, matching the current `GetByIdAsync` behaviour, so nobody can tell a private list exists. Every endpoint added below (likes, comments, challenges, copy, items) runs this check first. Any feed or activity query that surfaces lists must use `Public` only. Find and update these during Phase 1.

### 3.3 Phase 1: notes, ranked, read count, collage, sorting, unlisted

**Notes**
- `AddListItemRequest.Note` is already accepted. The server now trims it, turns an empty string into `null`, and returns 400 over 1000 characters.
- New `PUT /api/booklists/{id}/items/{itemId}` with `{ note }`. Owner only in Phase 1. Phase 4 adds the collaborator rule.
- **`AddToListButton`:** an optional "Why is it on this list?" textarea under the list picker. Lists that already contain the book are shown disabled with "Already on this list".
- **`ListDetailPage`:** the note shows under each book, using its existing style. Owners get an "Add note"/"Edit note" link that opens an inline textarea with Save/Cancel. Line breaks are kept (`white-space: pre-wrap`).

**Ranked**
- `CreateBookListRequest`/`UpdateBookListRequest` gain `IsRanked`, and `ListForm` gets a "Ranked list (show numbers)" checkbox.
- When ranked, each row shows a large position number (`#1` is `Position + 1`) to the left of the cover, in the display font. When not ranked, there are no numbers.
- **Reordering improves**, since ranking long lists one step at a time is painful. Rows can be **dragged** using native HTML5 drag events, so no new dependency. On drop, the existing `PUT .../position` endpoint is called with the new index. The up/down buttons stay as the keyboard- and touch-accessible fallback.

**Read count ("You've read X of Y")**
- `ListItemDto` gains `ViewerStatus`: `null` / `WantToRead` / `CurrentlyReading` / `Read`. It's filled from **one** query of the viewer's logs for the list's book ids. When a viewer has several logs for a book (rereads), the "best" one wins: `Read` > `CurrentlyReading` > `WantToRead`. It's always `null` for anonymous viewers.
- `BookListDto` gains `ViewerReadCount` (null when anonymous) and `BookCount`.
- **UI:** a progress strip under the list header: "You've read **23** of **100** · 23%", with a thin bar. Read books get a small ✓ badge on the cover, and currently-reading books a small "Reading" badge. It's shown on your own lists too.
- The pure math (counting, percent, rounding) lives in `lib/listProgress.ts` so the list page, list cards and challenges (Phase 3) all agree.

**Cover collage and list summaries**
- New `BookListSummaryDto`, for cards rather than the full list: `Id`, `Title`, `Owner { Id, Username, AvatarId }`, `Visibility`, `IsRanked`, `BookCount`, `CoverUrls` (the first 5 by position, skipping books with no cover), `UpdatedAt`, and `ViewerReadCount`. Phase 2 adds `LikeCount`, `CommentCount`, `Tags` and `ViewerHasLiked`, and Phase 3 adds `ChallengerCount`.
- `GET /api/booklists?userId=` **switches to returning summaries** (an intentional contract change). `ListsPage` and `ProfilePage` are updated in the same phase. Cover URLs come from one query for the first 5 items per list, not one query per list.
- **`ListCoverStack` component:** up to 5 covers overlapping left to right (each about 40% hidden behind the one before, with a small shadow, like Letterboxd's list preview). Missing covers show the app's existing cover placeholder. Used on list cards on the profile, the Lists page and, later, browse and the book page.
- **`ListCard` component:** collage, title, "by @user" (hidden on your own Lists page), "N books", a "Ranked" chip, a privacy badge (Unlisted/Private, only shown to people who can see that) and "You've read X of Y" when logged in. Phase 2 adds ♥ likes and 💬 comments.

**Sorting and filtering inside a list (view only)**
- This is all frontend. Every item is already loaded and `ListItemDto` gains `BookAuthors`, `BookFirstPublishYear` and `AddedAt`, so no new endpoint is needed.
- **Sort options:** List order (default; "Rank" when ranked) · Title A–Z · Author A–Z · Publication year (oldest/newest) · Date added (newest) · Unread first (logged in only).
- **Filter:** a "Hide books I've read" toggle (logged in only).
- The chosen sort and filter go in the URL query (`?sort=year&hideRead=1`) so a sorted view can be shared. When the sort isn't the default, drag and the up/down buttons are hidden and a hint appears: "Showing a sorted view. Switch to List order to rearrange." When ranked, rank numbers **stay attached to each book's real rank** rather than renumbering the sorted view.
- The pure sort/filter function lives in `lib/listSort.ts`.

**Unlisted**
- `ListForm` replaces the Public checkbox with three radio options, each with a one-line explanation: *Public: anyone can find it* / *Unlisted: only people with the link* / *Private: only you (and collaborators)*.
- List page: a "Copy link" button (clipboard) for every visibility, and the badge shows Public, Unlisted or Private.
- The backend applies §3.2 everywhere. `GetByUserIdAsync` now returns `Public` lists for other viewers and all of their own for the owner.

### 3.4 Phase 2: likes

- Table `ListLikes(list_id, user_id, created_at)` with a composite key, inserted with `ON CONFLICT DO NOTHING` so a double tap can't fail (the same pattern as `CheckpointReveals`).
- `POST /api/booklists/{id}/like` and `DELETE /api/booklists/{id}/like` are both idempotent and require login and §3.2 access. Liking your own list → 400.
- `BookListDto` and `BookListSummaryDto` gain `LikeCount` and `ViewerHasLiked` (one grouped count query per list of lists).
- **UI:** a ♥ button with a count in the list header (filled when liked, optimistic update), and ♥ N on cards. Owners see the count but no button.

### 3.5 Phase 2: tags

- Table `ListTags(list_id, tag)` with a composite key. A tag is **normalised** to lowercase with spaces turned into `-`, and only `a–z 0–9 -` are allowed, 2–30 characters. A list can have at most **8 tags**. Invalid tags → 400 that names the bad tag.
- `CreateBookListRequest`/`UpdateBookListRequest` gain `Tags: string[]`, and an update replaces the whole set.
- `GET /api/booklists/tags?prefix=fan&limit=8` returns the most-used tags across **Public** lists that start with the prefix, each with its count. This powers the suggestions.
- **UI:** `ListForm` gets a tag input (type, press Enter or comma to add a chip, × to remove, and a suggestion dropdown from the endpoint above). Tags show as chips under the list title and on cards. Clicking one opens `/lists/browse?tag=<tag>`.

### 3.6 Phase 2: comments

- `CommentTargetType` gains `List`. `CommentService.GetTargetContentAsync` resolves a list target and applies §3.2 (a viewer who can't see the list gets 404).
- **Only whole-post comments and replies.** Anchored highlight-comments (`AnchorStart`/`AnchorEnd`) → 400 for lists, since a list has no single body of text to highlight.
- The existing comment endpoints (create, tree, vote, edit, delete) work unchanged with `targetType=List`.
- `BookListService.DeleteAsync` deletes the list's comments (and their votes) in the same save, because there's no foreign key to cascade.
- `CommentCount` on `BookListDto`/`BookListSummaryDto` (non-deleted comments and replies, one grouped query).
- **UI:** a "Comments" section at the bottom of `ListDetailPage`, reusing the same components the review page uses.

### 3.7 Phase 2: browse page

Route `/lists/browse`, a new `BrowseListsPage` that's public (anonymous users see everything except "From people you follow"). A "Browse lists" link goes on the Lists page and in the nav next to Lists.

One endpoint: `GET /api/booklists/browse?section=popular|recent|following&tag=&q=&page=&limit=20` → `PagedResponse<BookListSummaryDto>`. **Public lists that have at least one book only.**

| Section | What it returns | Order |
|---|---|---|
| `popular` | lists with ≥1 like in the last 7 days. **Fallback:** if fewer than 6 match, fill with all-time most-liked lists. | likes in last 7 days ↓, then total likes ↓, then `UpdatedAt` ↓ |
| `recent` | all lists | `UpdatedAt` ↓ |
| `following` | lists owned by users the viewer follows (401 when anonymous) | `UpdatedAt` ↓ |

- `tag` filters any section to lists with that tag. `q` is a case-insensitive search (`ILIKE`) over title and description, and also works with any section.
- Paging is **page-numbered** rather than cursor-based, because "popular" ranks by a score that changes over time and a cursor over it would be unreliable. The page size is capped at 50.
- **UI:** the page header has a search box. Below it: a "Popular tags" chip row (from the tags endpoint with no prefix), then tabs **Popular this week / Recently updated / Following**. A grid of `ListCard`s with "Load more". When a tag or search is active, a "Showing lists tagged *fantasy*" banner appears with a clear (×) button.

### 3.8 Phase 2: "Lists with this book" on the book page

- `GET /api/books/{openLibraryId}/lists?page=&limit=6` returns **Public** lists containing the book, as summaries, ordered by total likes ↓ then `UpdatedAt` ↓.
- **UI:** a "Lists with this book" section on `BookDetailPage` with up to 6 `ListCard`s and "Show more". It's hidden when there are none.

### 3.9 Phase 3: copy a list

- `POST /api/booklists/{id}/copy` (login and §3.2 access) creates a new list for the caller:
  - `Title` is the same as the original, `Description` empty, `Visibility = Private`, `IsRanked` copied, no tags, and `CopiedFromListId` set to the source.
  - Items are copied in the same order with `Note = null`, `AddedByUserId = caller` and `AddedAt = now`.
  - It returns the new list (201), and the UI navigates to it.
- **Credit:** `BookListDto` gains `CopiedFrom { ListId, Title, OwnerUsername }`, filled **only if the source still exists and the viewer can see it**. Otherwise it's `null` and the credit disappears quietly. That avoids leaking a source that has since been made private.
- **UI:** a "Copy to my lists" button in the list header for logged-in users (owners included, as a way to duplicate a list), and the "Based on @user's *Title*" line under the title of a copy.

### 3.10 Phase 3: challenges

Table `ListChallenges(id, list_id, user_id, goal_date, started_at)`, unique `(list_id, user_id)`.

- `POST /api/booklists/{id}/challenge` with `{ goalDate }` takes it on (goal date must be today or later → otherwise 400; one per list per user → 409 if already taken). Needs login and §3.2 access.
- `PUT /api/booklists/{id}/challenge` with `{ goalDate }` changes the goal (e.g. to extend a missed one). `DELETE` gives the challenge up.
- **Progress is never stored.** It's computed whenever it's read, using the same rule on the backend and in the frontend's `lib/listProgress.ts`: the number of list books with a `Read` log for that user divided by the current `BookCount`. Books read before starting count (§2). If books are added to the list later, the challenge simply has more to read. That matches Letterboxd.
- **Status** is computed, not stored: `Completed` (read all), `InProgress` (goal date not passed), `Missed` (goal date passed and not complete). Missed challenges keep showing with an "Extend goal" button.
- `BookListDto` gains `ChallengerCount` and `ViewerChallenge { GoalDate, StartedAt }` (null if not taking it on). `BookListSummaryDto` gains `ChallengerCount`.
- `GET /api/booklists/challenges/mine` returns the caller's challenges, each with the list summary, goal date, read count and status. Challenges on lists the caller can no longer see (made private, or deleted) are left out.
- **UI:**
  - **List header:** "Take the challenge" opens a small dialog with a goal date picker and quick options ("End of month", "End of year", "In 3 months"). While taking it on, the read-count strip from §3.3 becomes the challenge bar: "23 of 100 · goal Dec 31 · **N days left**" or "Missed, read 23 of 100 · Extend goal", with Edit and Give up in a small menu. "🏁 N readers are taking this on" shows when the count is above 0.
  - **Lists page:** a "Your challenges" section at the top with one compact row per challenge (collage, title, bar, days left / Completed ✓ / Missed). Completed challenges go into a collapsed "Completed" group.

### 3.11 Phase 4: shared lists

Table `ListCollaborators(list_id, user_id, status, invited_at, responded_at)`. The key is `(list_id, user_id)`, and `status` is `Pending` or `Accepted`. Declining or leaving **deletes the row**, so it's possible to invite the same person again later. At most **10 collaborators** (pending + accepted) per list.

**Endpoints**
- `POST /api/booklists/{id}/collaborators` with `{ userId }`, owner only. You can't invite yourself, an existing collaborator, or exceed the limit → 400.
- `DELETE /api/booklists/{id}/collaborators/{userId}`: the owner removes anyone (this also cancels a pending invite), or a collaborator removes **themselves**, which is "Leave list".
- `POST /api/booklists/{id}/collaborators/me/accept` and `.../me/decline`: invitee only.
- `GET /api/booklists/invites` lists the caller's pending invites (list summary + who invited them).
- `GET /api/booklists/shared-with-me` lists the caller's accepted shared lists as summaries.
- `BookListDto` gains `Collaborators [{ UserId, Username, AvatarId, Status }]`. Pending entries are visible only to the owner and that invitee. It also gains `ViewerRole`: `Owner` / `Collaborator` / `Invited` / `None`. The frontend decides which buttons to show from `ViewerRole` alone.

**Permission rules** (enforced in `BookListService`, with one helper `GetRoleAsync(list, userId)`)

| Action | Owner | Accepted collaborator |
|---|---|---|
| Add a book (with note) | ✓ | ✓ |
| Edit a note | any item | items they added |
| Reorder (drag/up/down) | ✓ | ✓ |
| Remove a book | any item | items they added |
| Edit title / description / tags / visibility / ranked | ✓ | ✗ (403) |
| Invite / remove collaborators | ✓ | can only remove themselves |
| Delete the list | ✓ | ✗ (403) |

- Pending invitees can **view** only (§3.2).
- If a collaborator leaves or is removed, the books they added **stay** on the list. `AddedByUserId` still points at them, and the "added by" avatar still shows.
- Item mutations bump `BookList.UpdatedAt`. `AddItemAsync` keeps its existing retry loop for position collisions, which matters more now that several people can add at the same time.

**UI**
- **List page (owner):** a "Collaborators" button opens a panel with a user search (reusing the People page search), the current collaborators with Remove, and pending invites with Cancel. When the list has collaborators, the header shows overlapping avatars: "by @owner with @a, @b".
- **List page (collaborator):** add/reorder controls, Edit/Remove only on their own items, and "Leave list" in the menu.
- **List page (invited):** a banner: "@owner invited you to collaborate on this list. **Accept** / **Decline**".
- **Items on shared lists** show a small "added by" avatar.
- **Lists page:** a "Pending invites" box at the top (only when there are any) with Accept/Decline per invite and the list title linking to it. A "Shared with you" section lists accepted shared lists.
- **`AddToListButton`:** the list picker also offers the lists the user collaborates on, grouped under "Shared with you".

## 4. Explicitly out of scope

- **Importing lists from Goodreads/StoryGraph.** It's in `FUTURE-IDEAS.md`.
- **Notifications** for invites, comments, likes or challenge deadlines. Argos has no notification system (SPEC.md §4 Phase 2). Invites use the Lists page box instead.
- **Open/public lists that anyone can add to, and voting on books inside lists** (Goodreads Listopia). Deliberately excluded because of the spam and fake voting problems described in §1.
- **Per-item ratings or scores inside a list.** The curator's ranking and note cover this.
- **Paginating a list's items.** Lists load all their items. Revisit if real lists go past a few hundred books.
- **A drag-and-drop library.** Native drag events plus the existing buttons are enough.
- **A collaborator-specific activity history** ("alice added 3 books"). Only `AddedByUserId` per item.
- **Lists in the home feed.** Unchanged by this spec. Whatever surfaces lists today just follows the Public-only rule (§3.2).

## 5. Tasks

Each phase can be shipped and verified on its own. Within a phase, do the backend before the frontend.

### Phase 1 — Notes, ranked, read count, collage, sorting, unlisted

#### Backend
- [x] `BookList`: `IsPublic` → `Visibility` (new `ListVisibility` enum, Private = 0 / Public = 1 / Unlisted = 2), plus `IsRanked`, `UpdatedAt` and `CopiedFromListId`. `ListItem`: `AddedByUserId`, `AddedAt`, and `Note` max 1000. Migration `ImproveBookLists`, **hand-edited** because EF scaffolded it as a *rename* of `IsPublic` → `IsRanked`, which would have made every public list ranked. It backfills `Visibility` from `IsPublic`, sets `UpdatedAt = CreatedAt` and `AddedByUserId`/`AddedAt` from the list, deletes duplicate books, closes position gaps, then adds the unique `(BookListId, BookId)` index. Applied to the dev database and checked on the 4 real lists and 8 items: Visibility 1/1/1/0 matched the old flags, every item was credited to its list's owner, positions were unchanged, and the one note was kept. **Deviation:** `AddedByUserId` is nullable with `SetNull`, so deleting an account doesn't fail on books it added to someone else's list (Phase 4).
- [x] `BookListAccess.CanView`/`IsDiscoverable` (`Services/BookListAccess.cs`) replaced every `IsPublic` check. Update/delete/item changes on a list the caller can't see now return 404 instead of 403, matching §3.2. **No feed or activity query surfaces lists today**, so there was nothing to make Public-only there.
- [x] `Visibility`/`IsRanked` on create/update (an undefined enum value → 400); notes trimmed, blank → null, over 1000 → 400; duplicate book → 400 (the add retry loop also reports a concurrent duplicate this way); `PUT /api/booklists/{id}/items/{itemId}` for notes (owner only). Every list or item change bumps `UpdatedAt`. **Bug fixed along the way:** removing an item never renumbered the rest, leaving gaps that would break rank numbers and the reorder clamp. `RemoveItemAsync` now closes the gap in the same save.
- [x] DTOs: `BookListDto` gains `Owner`, `Visibility`, `IsRanked`, `UpdatedAt`, `BookCount` and `ViewerReadCount`; `ListItemDto` gains `ViewerStatus`, `BookAuthors`, `BookFirstPublishYear`, `AddedAt` and `AddedByUserId`. The viewer's statuses come from one new query, `ILogRepository.GetBestStatusByBookIdsAsync` (`Max(Status)` per book, since the enum order is the "best status" order). `ListOwnerDto` carries `AvatarUrl`; the spec said `AvatarId`, but users store an avatar URL.
- [x] `BookListSummaryDto` + `GET /api/booklists?userId=` returns summaries. `IListItemRepository.GetPreviewsAsync` runs two set-based queries (a grouped count, plus covers via a grouped `OrderBy/Take` that EF turns into a window function), and `GetReadCountsAsync` does one grouped count. **Added beyond the spec:** an optional `containsBookId` parameter fills `ContainsBook` on each summary, so "Add to list" can disable lists that already have the book without loading every list's items.
- [x] Tests (`Integration/BookListImprovementsTests.cs`, 8 tests): an unlisted list opens by link for a stranger and anonymously but is missing from their view of the owner's lists, and a private one is 404; updating a stranger's private list is 404; ranked and visibility round-trip; duplicate book → 400; notes trim, blank → null, over 1000 → 400, a stranger editing → 403, `containsBookId` true/false/absent; removing closes the gap, reorder still works afterwards, and changes bump `UpdatedAt`; `ViewerStatus` prefers an older Read over a newer WantToRead, only Read counts, and anonymous gets nulls (detail and summary); summaries carry the owner, the count and the first 5 covers in order, skipping a missing one, and an empty list has 0 and no covers. The existing unit/integration list tests were moved to `Visibility`. The migration backfill was checked against the dev database rather than by an automated test, since the test database starts empty.

#### Frontend
- [x] Types and API client: `ListVisibility`, `ListOwnerDto`, `BookListSummaryDto`, new item fields, `updateListItem`, `getBookListsByUser(userId, containsBookId?)`, and query key `byUserWithBook`, which sits under the `byUser` prefix so one invalidation refreshes both.
- [x] `ListForm`: Public/Unlisted/Private radios with one-line hints (new `ListForm.module.css`) and a "Ranked list (show numbers)" checkbox. `ListDetailPage`: three-way badge, Ranked badge, book count, "by @owner" link, "Copy link". **Deviation:** "Copy link" is hidden on Private lists, since nobody else could open that link.
- [x] Notes: an optional "Why is it on this list?" box in `AddToListButton` that appears once a list is picked, with lists that already have the book disabled ("(already on this list)") and server errors shown. On the list page the owner gets an inline "Add note"/"Edit note" editor. Notes render in the serif font with a left rule and keep line breaks.
- [x] Ranked: large serif rank numbers. Drag-to-reorder uses native drag events from a **grip handle** (⋮⋮), not the whole row, so selecting text in a note box isn't hijacked; the row is the drop target and the whole row is the drag image. The up/down buttons are kept.
- [x] `lib/listProgress.ts` + the read-count strip ("You've read 1 of 3", the percent, and a bar with `role="progressbar"`) + a ✓ badge on read covers and a "Reading" badge on currently-reading ones.
- [x] `ListCoverStack` (5 slots that always show, empty ones outlined, separated by a `--bg` border instead of a shadow, per the design-token rule that resting cards don't use shadows) + `ListCard` (collage, serif title, "by @user" optional, book count, Ranked chip, non-Public badge, one-line description, "You've read X of Y" once at least one is read). `ListsPage` and `ProfilePage` show cards.
- [x] `lib/listSort.ts` + a Sort dropdown ("Rank"/"List order", Title, Author, Oldest, Newest, Recently added, plus Unread first when signed in) and a "Hide books I've read" toggle, both kept in the URL (`?sort=…&hideRead=1`). While either is active, reordering controls are hidden with a hint, and rank numbers stay attached to each book's saved rank.
- [x] Tests: `listProgress.test.ts` (4), `listSort.test.ts` (9, covering every sort, missing values last, no input mutation, the read filter keeping real positions, and the option labels); `ListDetailPage.test.tsx` (10: byline/progress/badges/meta/note, anonymous hides progress and the filter, rank only when ranked, sort keeps saved ranks and hides reorder, hide read, sort from the URL, owner adds a note (trimmed), no note/reorder controls for others, arrow reorder, copy link for Unlisted but not Private); `ListComponents.test.tsx` (7: collage slots and the 5 cap, card badges/progress/owner, add-to-list disabled option plus trimmed or null note, form create payload and edit defaults).

### Phase 2 — Likes, tags, comments, browse, lists with this book

#### Backend
- [x] `ListLikes` (key `(BookListId, UserId)`, index `(BookListId, CreatedAt)` for "this week") and `ListTags` (key `(BookListId, Tag)`, index on `Tag`, max 30) in one migration, `AddListSocial`, both cascading on list delete. It only adds tables and was applied to the dev database.
- [x] Like/unlike (§3.4): `POST`/`DELETE /api/booklists/{id}/like`, idempotent via `INSERT … ON CONFLICT DO NOTHING`; your own list → 400; a list you can't see → 404. Lives in a new `ListDiscoveryService` (likes + everything that finds lists across users), kept apart from `BookListService` (one list and its items).
- [x] Tags (§3.5): `Services/ListTagRules.cs` normalises ("#Comfort Reads" → `comfort-reads`), validates (2–30, a–z 0–9, single inner hyphens), de-duplicates and caps at 8; the error names the bad tag. Saved in the same save as the list. **Deviation:** on update, `Tags: null` (omitted) leaves tags unchanged and `[]` clears them, so older clients that don't send tags can't wipe them. `GET /api/booklists/tags?prefix=&limit=` counts Public lists only.
- [x] Comments (§3.6): `CommentTargetType.List`; `CommentService`'s target lookup now takes the viewer and treats a list they can't see as missing. Commenting there is a 400 ("target does not exist"), and reading its thread is a 404. Anchored comments on a list → 400. `GET /api/booklists/{id}/comments`. Deleting a list deletes its comments (`ICommentRepository.DeleteByTargetAsync`; votes cascade). **Added beyond the spec:** voting on a comment whose list you can't see is now a 404 too, so a guessed comment id can't be used to probe a private list.
- [x] `CommentCount`, `LikeCount`, `ViewerHasLiked` and `Tags` on both list DTOs. **Refactor:** list → DTO mapping moved out of the controller into `Services/BookListDtoMapper.cs`, so `GET ?userId=`, browse and the book-page endpoint build cards identically, each with one grouped query per field for the whole page.
- [x] `GET /api/booklists/browse?section=popular|recent|following&tag=&q=&page=&limit=` → `PagedResponse<BookListSummaryDto>` (§3.7), Public lists with at least one book. `q` is a case-insensitive `ILIKE` on title and description with `%`/`_` escaped. Following → 401 when signed out. **Deviation (simplification):** rather than "lists with likes this week, then a separate all-time fallback when fewer than 6", Popular ranks *every* list by likes in the last 7 days, then all-time likes, then recency. That gives the same result when the week is quiet, never shows an empty page, and pages consistently without a seam between two result sets.
- [x] `GET /api/books/{openLibraryId}/lists?page=&limit=6` (§3.8): Public lists with the book, most-liked first. A book nobody has cached returns an empty page, not a 404. **Also:** the list routes now use `{id:guid}` constraints, so `browse`/`tags` can never be read as an id.
- [x] Tests (`Integration/BookListSocialTests.cs`, 8 tests). They are scoped by tags or search words unique to each test, because the test database is shared across classes. Covered: like is idempotent, liking your own list → 400 and liking an unseeable list → 404, and count/`ViewerHasLiked` update; tag normalisation and de-duplication, an invalid tag → 400 naming it, 9 tags → 400, and update with null/new/empty tags; suggestions count only Public lists and match a case-insensitive prefix; list comments and replies, a highlight → 400, the count, a private list's thread → 404, commenting there → 400, voting there → 404, and deleting the list removes its comments; Popular order (this week's like beats two old likes, beats one old like, beats none) and paging with `HasMore`; Recent excludes empty/Unlisted/Private lists, search matches titles and descriptions case-insensitively, and `%` in a search is literal; Following → 401 signed out, empty until you follow someone, then only their lists, and a bad section → 400; book lists are Public only and most-liked first, and an uncached book gives an empty page. `CommentServiceTests`/`BookListServiceTests` constructors updated; new `FakeListSocialRepository`.

#### Frontend
- [x] `LikeButton` (optimistic, rolled back on error, `aria-pressed`), shown to signed-in non-owners. The owner and anonymous viewers see "♥ N". ♥/💬 counts on `ListCard` (only when above 0).
- [x] `TagInput` in `ListForm`: Enter or comma adds, × or Backspace removes, invalid tags explained, suggestions from `/booklists/tags` for the typed prefix (already-added tags hidden), disabled at 8. `lib/listTags.ts` mirrors the server rules so a chip shows exactly what will be saved. Tags show as `#links` to browse on the list page, and as plain text on cards, since the whole card is already a link.
- [x] Comments: the list page's bottom section reuses `AnnotationCommentThread` with `targetType="List"`; `annotationComments.ts` maps `List` → `/booklists/{id}/comments`.
- [x] `BrowseListsPage` at `/lists/browse` (public): search box, a popular-tags chip row (click again to clear), Popular this week / Recently updated / Following tabs (Following only when signed in) reusing the `SectionTabs` styling, a "Showing lists tagged #x matching 'y'" banner with ×, and Load more. Section, tag and search all live in the URL. Links: "Browse everyone's lists →" on the Lists page, the right panel's "Browse lists" (previously pointed at `/lists`), and the sidebar's Lists link goes to browse for signed-out visitors, since `/lists` needs an account.
- [x] `ListsWithBookSection` on `BookDetailPage`, below Reviews: up to 6 cards plus Show more, rendering nothing when empty.
- [x] Tests: `listTags.test.ts` (2); `ListSocial.test.tsx` (6: like/unlike counts, rollback on error; tag chips with Enter/comma, ×, Backspace; invalid tag message; prefix suggestions skipping added tags; disabled at 8); `BrowseListsPage.test.tsx` (7: default Popular with card counts/tags; Following tab only when signed in; tag chip → filter → banner → clear; filters from the URL plus search; Load more requests page 2; the book section is empty when there are none, and shows cards plus Show more). `ListDetailPage.test.tsx` +2 (like button vs count by role; tag links and comments thread). Phase 1 fixtures updated, and the `ListForm` test now adds a tag.

### Phase 3 — Copy and challenges

#### Backend
- [x] `POST /api/booklists/{id}/copy` (§3.9) in `BookListService.CopyAsync`: a Private list with the same title and ranking, no description or tags, and the books in source order renumbered from 0, each with no note and added by the copier. The list and its items are committed in **one save** (new `IListItemRepository.Track`, the same staging pattern `ILogRepository.Track` uses). A list you can't see → 404. `BookListDto.CopiedFrom { ListId, Title, OwnerUsername }` is filled through the normal visibility check, so a source made private or deleted (`SetNull`) quietly stops being credited.
- [x] `ListChallenges` (unique `(BookListId, UserId)`, index on `UserId`, cascades with the list and the user; migration `AddListChallenges`, applied to the dev database). **`GoalDate` is a `DateOnly` (`date` column)**, not a midnight timestamp like checkpoint due dates, so it can't shift a day across time zones. New `ListChallengeService`: take on (`POST …/challenge`; past goal → 400; already taking it on → 409, including a double tap caught by the unique index), change the goal (`PUT`), give up (`DELETE`). "Today" allows one day of slack behind UTC so readers west of UTC can pick their own today in the evening. `ComputeStatus` (Completed once every book is read, and an empty list never is; Missed once the goal day has passed; the goal day itself is still in time) is shared with `GET /api/booklists/challenges/mine`, which returns each challenge with its list summary, read count, book count and status, earliest goal first, leaving out lists the reader can no longer see.
- [x] `ChallengerCount` on both DTOs (one grouped count via the mapper) and `ViewerChallenge { GoalDate, StartedAt }` on the list.
- [x] Tests: `Integration/BookListReuseTests.cs` (4 tests) — the copy is Private, keeps the reordered book order (renumbered 0..2) and ranking, drops description/tags/notes, is credited to the copier, and credits the source; copying a list you can't see → 404, and the credit disappears once the source goes private, then deleted; challenge with a past goal → 400, on a private list → 404, start, then 409 on a second start, count and `ViewerChallenge`, change goal, give up, then 404 on a second give-up, and the owner sees the count without a challenge of their own; "mine" counts a book read a year before starting, gives InProgress/Completed/Missed (a missed goal was aged directly in the database, since the API refuses past dates), orders by goal and leaves out a list that went private. `Unit/ListChallengeStatusTests.cs` (6 cases) for the status rule's boundaries.

#### Frontend
- [x] "Copy to my lists" (any signed-in viewer, owners included) navigates to the new copy; the copy shows "Based on @user's *Title*" linking to the source.
- [x] `ChallengeDialog`: an anchored popover (not a full modal) with End of month / In 3 months / End of year quick picks (End of year preselected), a date input with `min` = today, and Start or Save. `lib/listChallenge.ts` mirrors the server's status rule and handles goal dates as local calendar dates (days left, "due today", "N days over", Jan 31 + 3 months → Apr 30).
- [x] `ListChallengePanel` replaces the read strip while taking a list on: "Your challenge / 🏁 Challenge complete / Challenge missed", the goal and days left, the bar, and Change goal (or **Extend goal** when missed), plus Give up (Remove once complete). "🏁 N readers are taking this on" under the list's badges, and 🏁 N on cards. "Take the challenge" only shows for signed-in viewers on non-empty lists they aren't already taking on.
- [x] `MyChallengesSection` at the top of the Lists page: open and missed rows (collage, title, days left or "Missed · goal was …", bar, read/total) with completed ones in a collapsed `<details>`; renders nothing with no challenges.
- [x] Tests: `listChallenge.test.ts` (8), `MyChallengesSection.test.tsx` (2), and `ListDetailPage.test.tsx` +5 (copy navigates to the copy; credit line; start a challenge with the default end-of-year goal plus the challengers line; the panel replaces the strip and hides "Take the challenge"; extend a missed challenge). Fixtures updated.

### Phase 4 — Shared lists

#### Backend
- [x] `ListCollaborators` (key `(BookListId, UserId)`, `Status` Pending/Accepted, `InvitedAt`, `RespondedAt`, index `(UserId, Status)`, cascades with the list and the user; migration `AddListCollaborators`, applied to the dev database). New `ListCollaborationService`: invite (owner only; yourself, a duplicate, an unknown user (caught as a foreign-key violation, so the service stays Identity-free) or an 11th person → 400), remove (the owner removes anyone or cancels an invite; anyone else only themselves, which is "leave"), accept, and decline (deletes the row, so they can be invited again). Plus `GET /api/booklists/invites` and `GET /api/booklists/shared-with-me` (which also takes `containsBookId`, for "Add to list").
- [x] **One access rule.** New `ListAccessService.GetRoleAsync` → `ListRole` (None / Invited / Collaborator / Owner) is the only code that knows collaborators exist. `BookListAccess` became pure rules over a role (`CanView`, `CanEditItems`, `CanChangeItem`, `IsDiscoverable`). `BookListService` loads a list and the caller's role together (`LoadAsync`), and every method applies the §3.11 table. Likes, challenges and list comments use `CanViewAsync`, so a private shared list is visible to its collaborators and invitees everywhere, including its comment thread.
- [x] `Collaborators` (accepted for everyone who can see the list; pending only for the owner and that invitee) and `ViewerRole` on `BookListDto`, with names and avatars from the same batched user lookup as the owner.
- [x] Tests (`Integration/BookListSharingTests.cs`, 12 tests): invite → invitee sees a private list as Invited but can't add (403) → accept → can add, the invite disappears, the list shows under shared-with-me with `ContainsBook`, and it's not on the collaborator's profile; one test per permission-table row (add: collaborator yes, stranger 404 on a private list; note: collaborator only their own, owner any; reorder: collaborator yes; remove: collaborator only their own, owner any; edit list/delete: collaborator 403, owner OK; manage collaborators: collaborator 403 for invite and for removing the owner, owner invites and cancels); leaving keeps the books you added (with `AddedByUserId`) and loses access to a private list; declining deletes the invite, after which accept → 404 and a re-invite works; invite validation (yourself, unknown user, duplicate, the 11th → 400 "at most 10"); pending invites visible only to the owner and that invitee. `BookListServiceTests`/`CommentServiceTests` construct the new `ListAccessService` with a `FakeListCollaboratorRepository`.

#### Frontend
- [x] `CollaboratorsPanel` (owner, from a "Collaborators (N)" header button): user search (reusing the People page's `searchUsers`, from 2 characters, leaving out the owner and anyone already invited) with Invite, then current collaborators with Remove and pending invites with an "Invited" badge and Cancel. It's disabled at 10. The byline reads "by @owner with @a, @b", and on lists with collaborators each book shows "added by @x".
- [x] Every control comes from `viewerRole`: collaborators get add/drag/arrows, plus note edit and ✕ only on their own books, and "Leave list"; Edit/Delete/Collaborators are owner-only. An invitee gets a banner ("@owner invited you to collaborate on this list. Accept / Decline"); declining a private list's invite returns them to their Lists page, since they can't see it any more. The Private option's hint now says "Only you and anyone you invite to collaborate."
- [x] `PendingInvitesBox` (top of the Lists page, only when there are invites) and `SharedWithYouSection` (below your own lists). `AddToListButton` groups the picker into "Your lists" / "Shared with you" when you collaborate on any list.
- [x] Tests: `ListDetailPage.test.tsx` +5 (byline "with" and "added by"; collaborator controls only on their own books with no owner controls; leave; invited banner accept with no editing; owner invites someone found by search (the owner is excluded) and cancels a pending invite). `SharedListsSections.test.tsx` (4: invites box empty or accept/decline per invite; shared section; grouped add-to-list picker adding to a shared list). The page test helper reports `viewerRole: 'Owner'` for the owner, as the server does, since the page no longer compares ids itself.

### Verification & docs
- [x] *(Phase 1)* Backend 194 → 202 tests, frontend 211 → 241, all passing; `tsc -b`, the production build and eslint on touched files are clean. (`eslint src` reports one error in `ClubsDirectoryPage.tsx`, which existed before and isn't part of this spec.) Migration applied to the dev database with the backfill checked. **The running dev API must be restarted** to serve the new fields and endpoint; until then the frontend will get the old list shape.
- [x] *(Phase 2)* Backend 202 → 210 tests, frontend 241 → 258, all passing; `tsc -b`, the production build and `eslint src` (whole app) clean. Migration `AddListSocial` applied to the dev database. **Restart the dev API** for the new endpoints.
- [x] *(Phase 3)* Backend 210 → 220 tests, frontend 258 → 273, all passing; `tsc -b`, build and `eslint src` clean. Migration `AddListChallenges` applied to the dev database. **Restart the dev API** for the new endpoints.
- [x] *(Phase 4)* Backend 220 → 231 tests, frontend 273 → 282, all passing; `tsc -b`, build and `eslint src` clean. Migration `AddListCollaborators` applied to the dev database. **Restart the dev API** for the new endpoints., `tsc -b`/build, and eslint on touched files. Apply migrations to the dev database and check backfills on real rows. Remember: build and test in Release while the dev API is running, and restart the dev API afterwards so it serves the new endpoints.
- [x] A browser click-through per phase if a browser tool is available; otherwise note it as a manual step. **Done 2026-10-06** (Playwright, two accounts, desktop and 390 px, all five themes): drag-to-reorder and Move up, note editor, all sort options and "Hide books I’ve read", like, tag suggestions (tags already on the list aren't offered), browse tabs and tag chips with Clear filters, comments, copy with "Based on @…" credit, challenge dialog → panel → "Your challenges", invite → accept from the Lists page → collaborator adds a book → leave (the book stays). Fixed along the way: **adding a book from the list page's search failed (400) for any book not yet cached in Argos**, since live search results carry an empty id; it now fetches the book first, as `BookPicker` does (with a test), and search results are keyed by Open Library id instead of that shared empty id (React duplicate-key warning on the Search page too); "You’ve read 3 of 4" was spread across the whole progress bar; the list header squeezed the title to one word per line once the button row fit beside it; no gap between the pending-invites box and "Create a list". *(Original note: Check the collage, ranked numbers, drag handle, note editor, sort/filter, like button, tag input suggestions dropdown, browse page tabs/chips/banner, the book page's list section, and list comments, copy + credit, the challenge dialog/panel and "Your challenges", invites (two accounts: invite, accept from the Lists page, add a book as the collaborator, leave), in all five themes at desktop width and ≤640px.)*
- [x] Re-read this spec against what was built; deviations are noted inline on each task (all four phases).
- [x] *(Phase 1)* `CHANGELOG.md` entry; SPEC.md's Lists feature line and `Lists`/`ListItems` data model updated to `visibility`/`is_ranked` etc.
- [x] *(Phase 2)* `CHANGELOG.md` entry; SPEC.md's Lists entries updated (likes, tags, comments, browse).
- [x] *(Phase 3)* `CHANGELOG.md` entry; SPEC.md updated.
- [x] *(Phase 4)* `CHANGELOG.md` entry; SPEC.md updated.
