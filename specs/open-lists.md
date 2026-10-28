# Feature Spec — Open lists

*Added 2026-10-27.*

## 1. Problem

A list on Winged Words belongs to its owner, plus at most 10 invited collaborators. There's no way to ask everyone "What's the best sci-fi opener?" or "Which fantasy authors should every reader try?" and let the answer build itself. Goodreads' Listopia does this and it's popular: anyone adds an entry, anyone votes, and the list ranks itself. It's also good for growth. A shared open list with a vote count invites a visitor to sign up and vote.

What's wanted: **open lists**. Any signed-in reader can add books (or authors) to them and upvote what's already there. The list orders itself by votes. Visitors without an account can see the list, but must sign up to add or vote.

## 2. Decisions

### 2.1 Asked 2026-10-27

- **Upvote only.** One vote per reader per entry, which they can take back. No down votes, so nobody piles on to push things down. Order: most votes first. On a tie, the entry added first goes first.
- **A setting on the lists we already have**, not a separate feature. A new "Who can add" choice: *Just me and collaborators* (today) or *Any reader*. Likes, comments, tags, the browse page, share links, copying and reports all keep working.
- **One kind per list.** The creator picks *Books* or *Authors* when making the list. One list never mixes the two.
- **The owner can remove any entry.** Anyone can still report the list to the admin, as today. No approval queue, no closing the list, no per-reader cap on adds (only rate limits, §3.2).

### 2.2 Decisions I made, confirmed by the user 2026-10-28

1. **Open lists must be Public.** Turning on *Any reader* sets the list to Public; Private and Unlisted can't be chosen while it's on. (An Unlisted open list for a group of friends could come later.) On a **private account**, the account rule still applies (`specs/account-privacy.md` §3.4): only approved followers see the list, so only they can add and vote.
2. **Author lists work for every list, not only open ones.** Once an entry can be an author, a personal "My favourite authors" list costs nothing more. Book-only features are hidden on author lists: "you've read X of Y", challenges, edition covers and the book collage. The list's picture uses the first four authors' photos (or initials).
3. **The kind can't change** after the first entry is added.
4. **Adding an entry counts as your vote for it.** The person who adds it starts it at 1 vote, and can take that vote back like any other.
5. **On an open list, the order comes only from votes.** Drag and arrow reordering are hidden, and the list always shows numbers (#1, #2…). The view-only sorts (title, author, date added…) still work, with *Most votes* as the default.
6. **Only the owner and collaborators write notes on an open list.** A reader who adds an entry can't attach text. This keeps strangers' writing off other people's lists, so there's nothing new to moderate. Book and author entries are Open Library data, not anyone's own words.
7. **Who can remove an entry on an open list:** the owner and accepted collaborators can remove any entry, so collaborators can help tidy up. The reader who added it can remove it while it has no votes but their own.
8. **Turning *Any reader* off keeps the votes.** The current vote order is written into positions, so the list stays in that order and the owner can reorder from there. The votes stay stored but are hidden. Turning it back on shows them again, and the order goes back to votes. The settings screen says this in one line before saving.
9. **Votes from suspended readers, and from accounts waiting for deletion, don't count.** The same filter that hides such readers everywhere else (`specs/safety-and-moderation.md`) covers votes. When an account is erased, its votes go with it. Entries it added stay, with "added by" emptied, as today.
10. **Blocks:** a reader the owner has blocked can't see the list (today's rule), so they can't add or vote either. Other blocks don't matter here: entries carry no text, and vote counts don't show who voted.
11. **At most 500 entries per open list** (a personal list has no cap today and stays that way). That's enough for "best of all time", and it keeps the vote count query small.
12. **Visitors** (not signed in) see the ranking and vote counts. Tapping *Vote* or *Add* opens the sign-up box from `specs/shareable-pages.md`. After sign-up they return to the list. *Changed 2026-10-28 by the user:* the vote they tapped is cast for them on return, once, with a note ("Your vote for “Dune” is in."). `vote` joins the `do` word list (`SharedPageSignups.Actions`) and the entry is named in the page they return to (`/lists/{id}?entry={itemId}`); a link with `?entry=` alone does nothing, as with every other action. *Add* isn't done on return: they hadn't picked a book yet. `argos-security` checked it: no worse than a crafted `do=like`.
13. **Notifications:** the owner gets one grouped bell item, "3 readers added books to *Best sci-fi openers*", on the same grouping as likes. Votes send nothing.
14. **Feed:** adding to someone else's open list makes no activity event, so a busy list doesn't flood followers' feeds.

### 2.3 Decided while building Phase 1 (2026-10-28), confirmed by the user 2026-10-28

15. **A confirmed email** is needed to vote, and to add to someone else's open list. Votes move a public ranking, as club ratings do, and those already need one.
16. **The "readers added" bell item is under the *Comments and replies* switch**, which is on by default. The *Likes* switch is off by default, so an owner would never hear about additions there.
17. **A merged author takes their entries along.** `author_id` is *restrict*, not cascade: the only time an author row is deleted is an Open Library merge, and a cascade would quietly drop list entries. The merge moves entries to the current author; a list that had both keeps one, with both entries' votes.
18. **Strangers can't choose an edition cover either**, only the owner and collaborators (the same rule as notes, §2.2.6).
19. **Small naming:** the vote routes sit under `api/booklists/…` with the other list routes, and the download file is `list-votes.csv`, hyphenated like the others.
20. **A stranger's entry doesn't say who added it.** It starts with their vote, so "added by" would say who voted. On an open list the API names the adder only when that's the owner, a collaborator or the viewer, and sends `addedByMe` so the page can offer *Remove* (found by `argos-security`).

### 2.4 Decided while building Phase 2 (2026-10-28), confirmed by the user 2026-10-28

21. **No Undo after removing from an open list.** Putting an entry back would lose its votes, so the page asks "Remove “X”? Its votes go with it." first instead. Personal lists keep their 10-second Undo, and on an author list it brings the author back.
22. **An open list opens on its rows**, where the votes are, and an author list always shows rows (there are no covers to shelve). An open book list can still switch to the shelf.
23. **The sign-up box can open without an action word**, for *Add*: the visitor comes back to the list and adds the book themselves. *Vote* has its own word and is cast on return (§2.2.12, changed 2026-10-28).
24. **The "Open list" label is a green pill with "Anyone can add" beside it**, not "Open list · anyone can add": DESIGN.md's refuse list has no middle-dot strings. The #1 rank number on an open list is green.
25. **The French bell items use *tu***, like the list pages and the newest bell items. The older French bell items still say *vous*.
26. **Choosing *Any reader* and then *Just me* again puts the visibility back** to what it was before Public was forced.

## 3. Design

### 3.1 Data

- `BookLists` gains:
  - `kind` (`Books` / `Authors`, default `Books`)
  - `is_open` (bool, default false)
- `ListItems`:
  - `book_id` becomes optional, and a new optional `author_id` (→ `Authors`, cascade) is added.
  - A check constraint makes exactly one of the two set.
  - Today's unique (list, book) index stays, and a new unique (list, author) index is added. Both are partial (only where the id is set).
  - The `ListItem` summary says an item is now a book or an author. The class keeps its name, as `BookSuggestion` did in `specs/club-suggestion-options.md`.
- `author_id` is restrict, not cascade, and author merges move the entries (§2.3.17).
- New `ListItemVotes(list_item_id → ListItems cascade, user_id → Users cascade, created_at)`, with PK (list_item_id, user_id).
- **Vote counts are worked out when a list is read, never stored**: `COUNT` per item through the user filter (decision 9). This follows "progress is computed, never stored" in `ListChallenges`. If a big list gets slow, add a stored count then, not before.
- Migration name: `OpenListsAndAuthorItems`. SPEC.md §7 gets the new columns and table.

### 3.2 Backend

- **Access** (`BookListAccess`): new `CanAddToOpenList(list, role, canView)`, true when the list is open, the viewer is signed in and can see it. `CanEditItems` stays for reordering and notes. `CanChangeItem` gains the open-list removal rule (decision 7).
- **Settings:** `UpdateListRequest` takes `isOpen`. Turning it on forces Public and refuses any other visibility (error code `ListOpenMustBePublic`). Turning it off writes the vote order into positions (decision 8). `CreateListRequest` takes `kind` and `isOpen`. Changing `kind` on a list with items is refused (`ListKindLocked`).
- **Add:** the existing add-item endpoint takes either `bookId` or `authorOpenLibraryId`, whichever matches the list's kind (`ListItemWrongKind` otherwise).
  - An author nobody has opened yet is fetched and stored through `AuthorService`, as the club suggestion box does.
  - A duplicate is refused with today's message, and on an open list the answer includes the existing item's id, so the browser can say "Already on the list. Vote for it instead?"
  - Adding to an open list casts the adder's vote in the same save (decision 4).
  - The 500 cap is checked before Open Library is asked (`ListOpenFull`).
- **Vote:** `PUT /api/booklists/{id}/items/{itemId}/vote` and `DELETE` the same. Voting twice changes nothing, and so does removing a vote that isn't there. Not found if the list can't be seen or isn't open.
- **Reading a list:** `ListItemDto` gains `kind`, the author fields (`authorOpenLibraryId`, `authorName`, `authorPhotoUrl`), `voteCount` and `votedByMe` (only on open lists). An open list is ordered by votes, then `added_at`.
- **Rate limits:** a new policy for adds and votes together, 60 a minute per reader. Votes need no captcha: one per reader per entry already caps them.
- **Browse:** `ListDiscoveryService` gains an `open` filter and a `kind` filter. "Lists with this book" includes open lists. A new "Lists with this author" on author pages works the same way.
- **Copy:** copying an open list makes an ordinary personal list in the current vote order, with the same kind.
- **Notifications:** a new `ListEntriesAdded` type, grouped per list as likes are, sent only when someone other than the owner adds.
- **Data download:** the list CSV gets a `kind` column and an author column. Readers' own votes go in a new `list-votes.csv` (only lists still open: one turned off may since be private, and its title isn't the voter's).
- **Errors:** the four new codes above in `ErrorCodes.cs`, with translations under `errors.codes`.

### 3.3 Frontend

- **Create / settings:** a *Books / Authors* choice when creating (greyed out with a short reason once the list has entries). A *Who can add* choice: *Just me and collaborators* / *Any reader*, with one line under it: "Anyone signed in can add and vote. The list ranks itself by votes." Choosing *Any reader* locks visibility to Public and says why.
- **List page, open list:**
  - A label under the title: "Open list · anyone can add".
  - Each row shows its rank, the vote count and a vote button (pressed when you've voted; `aria-pressed`, `aria-label` "Vote for …" / "Remove your vote").
  - An *Add a book* / *Add an author* box at the top for every signed-in reader who can see the list.
  - "Already on the list" turns into a *Vote for it* button and scrolls to the entry.
  - Sorting defaults to *Most votes*. Drag handles are hidden.
  - A vote shows straight away, then is sent. If the server refuses it, it's undone with a toast.
- **Author entries:** the author's photo (or initials) in the cover slot, then their name, birth and death years, and a link to their page. Book-only parts are hidden (decision 2).
- **Browse page:** an *Open lists* filter chip and a *Books / Authors* chip. Open list cards carry the "Open" label and their entry count.
- **Visitors:** vote and add buttons show, and open the sign-up box (decision 12).
- **Author page:** a "Lists with this author" section, like the book page's.
- All text through `t('…')` in the five locale files. Design follows `DESIGN.md`, with the `web-design` skill's plan and screenshot round.

## 4. Tasks

### Phase 1 — Open book lists and author entries (server) · *size M–L*

#### Backend
- [x] Migration `OpenListsAndAuthorItems`: list `kind` and `is_open`, optional `book_id` + `author_id` with the check and both partial unique indexes, `ListItemVotes`.
- [x] Access rules, settings rules (Public-only, kind lock, freeze the vote order when turned off).
- [x] Add by book or author, duplicate answer with the existing id, adder's vote, 500 cap, rate limit.
- [x] Vote / remove vote endpoints. Counts through the user filter, ordered by votes.
- [x] Browse filters, lists with this author, copy, data download, `ListEntriesAdded` notification.
- [x] Error codes and their `errors.codes` translations. SPEC.md §7.
- [x] Tests: access (stranger, blocked, private account, visitor), ordering and ties, suspended voter not counted, erased voter, turning off and on, kind lock, cap, duplicates.
- [x] `reviewer`, then `argos-security` (new input from strangers, visibility rules, rate limit). Fixed: author-list cards said "0 read"; card previews lacked the id tie-break; an author list's share card crashed (no book); on an open list a stranger's entry no longer names who added it (it starts with their vote), with `addedByMe` instead. Left as is: the merge doesn't take list locks (rare, and the add retries).

### Phase 2 — Open lists and author lists (browser) · *size M*

#### Frontend
- [x] Create and settings: kind choice, *Who can add*, visibility lock.
- [x] Open list page: rank, votes, vote button, add box, "already on the list → vote", *Most votes* sort, no drag.
- [x] Author entries on any list, with the book-only parts hidden.
- [x] Browse chips, "Lists with this author" on the author page, visitor sign-up box.
- [x] Notification row for `ListEntriesAdded`.
- [x] Translations in all five locales. Vitest for the vote button and the add box.
- [x] `web-design` screenshot round, then `reviewer`. Three rounds; the design reviewer ended on "ship". Its changes: a horizontal vote pill, a green #1, and the vote with remove under it in one column so the votes line up and names keep their width on a phone. The `reviewer` found no spec bugs. Fixed from its notes: a refused duplicate now reloads the list so its *Vote for it* can find the entry; a `?sort=` the list doesn't offer falls back to its own order; one vote request per entry at a time; closing again restores the earlier visibility (§2.4.26). The feedback bubble covering a row's vote on a phone is added to `bugs/feedback-bubble-covers-primary-action.md`.

### Verification
- [x] `browser-check`: two seeded readers. A makes an open book list. B adds three books and votes. The order changes. A removes one entry. A turns *Any reader* off and the order is kept. (2026-10-28, also the duplicate → *Vote for it*, the bell item and the browse chips.)
- [x] Same with an author list, including an author no one has opened before (Lord Dunsany).
- [x] A visitor's link: ranking shows, and *Vote* opens the sign-up box.
- [ ] Phone width, all five themes. Checked in Paper and Dark at 375 and 1280; White, Warm Gray and Sepia not yet.
