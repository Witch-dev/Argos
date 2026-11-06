# Feature Spec — 5 books

*Added 2026-11-06, from the "Top 5s" entry in `FUTURE-IDEAS.md` (decided with the user 2026-11-05). Renamed from "Top 5s" to "5 books" the same day (§2.1.0).*

Builds on `specs/book-lists-improvements.md` (lists, ranked, likes, comments, copy, challenges, collaborators), `specs/open-lists.md` (list `kind`, open lists), `specs/authors.md` Phase 4 (favourite authors) and `specs/reviews-improvements.md` §3.10 (the book heart and the "Favourite books" profile row). Read those first. §5 lists every place this spec changes one of their rules.

## 1. Problem

Readers like saying "these are my five": five favourite books overall, five science fiction, five to read in winter. Letterboxd's Four Favourites row is the most-copied thing on that site, and a set of five is easy to share as a card.

Today Winged Words has two half-versions:
- **Favourite books on the profile:** up to 4 books picked from your hearted books (`FavouriteBook.ShowcasePosition` 0–3). Only one, no theme, no likes or comments.
- **Lists:** any length, any theme, but nothing marks a short list as "my five", and it doesn't get its own look.

And **favourite authors** have a hard cap of 4 (`FavouriteAuthorService.MaxFavourites`), so readers leave favourites out rather than pick.

## 2. Decisions

### 2.1 Decided with the user

0. **Called "5 books"** ("5 libros"; "5 livros", "5 Bücher", "5 livres"), **not "Top 5"**, and **ranking is optional** (changed 2026-11-06). A set of five can be a ranking, but doesn't have to be: "5 books to read in winter" has no #1. The list's existing *Ranked* switch decides whether the numbers 1–5 show. It starts off.
1. **5 books is a kind of list**, not its own feature (2026-11-05). Making a list, the reader picks *5 books*: it holds at most 5 books, has no collaborators, and gets the 5 books look (five covers on one shelf, numbered when ranked) and the 5 books share card. Everything lists already have keeps working: likes, comments, privacy, the Lists tab, export, deletion, reporting and posting limits. One idea for readers: "everything is a list, some are 5 books".
2. **Any number of them, free themes.** The theme is the list's title. An **optional genre** from the 22 curated genres (`GenreCatalog.Genres`) lets them be grouped later even when people write "sci-fi", "SF" or "ciencia ficción". Titles stay in the language they were written in.
3. **Public by default, each one can be made private**, with the list privacy settings. Account rules still apply on top: a private account shows them only to approved followers, and blocks hide them.
4. **Favourite books becomes a built-in 5 books** every reader has and can't delete, going from 4 books to 5, keeping the rule that a favourite must be marked as read. The heart stays unlimited as its own shelf (`FavouriteBook`). Only the profile showcase becomes the Favourite books list, so nobody with more than 5 hearted books loses any.
5. **Favourite authors work like favourite books, not like a list** (lists hold books). Favourite as many authors as you like (safety cap 500, like follows), and pick 5 for the profile row; the rest are behind "See all favourite authors". Today's 4 become the first 4 showcase slots. Follow is unchanged: following is for new-release alerts, favouriting is about taste, and neither needs the other.
6. **1–5 books while making one.** Empty slots show as inviting gaps. The share card is offered only once all five are in.
7. **Profile:** Favourite books and Favourite authors always show, side by side, plus up to 3 of your 5 books lists that you pin. The rest live in the Lists tab.
8. **"In 12 readers' 5 books" on the book page:** yes, in a later phase (Phase 4 here). Exact wording in the copy round.
9. **"My 5 books of 2026":** a ready-made one offered in December, filled from the books finished that year. Built with the Year in books / Wrapped idea (ROADMAP Stage 11 #2), not in this spec.

### 2.2 Decided while writing the spec (not asked; change any before building)

10. **Favourite books is a real list row**, not the old showcase column drawn in a new style. It needs likes, comments, the 5 books look, its link preview and Phase 4's count, and all of those come with a list. The showcase positions move into its items and `FavouriteBook.ShowcasePosition` is dropped. The heart table stays as it is.
11. **The row is made the first time it's needed**, not for every account up front: on the reader's first add, or by the migration for readers who already have a showcase. A reader without one shows an empty Favourite books everywhere. So account creation (password, Google, tests) doesn't change.
12. **Favourite books and the heart stay in step:**
    - Adding a book to Favourite books hearts it too, in the same save. It needs a Read log, as hearting does (the existing "Mark it as read first.").
    - Un-hearting a book takes it out of Favourite books (as today with the showcase).
    - Taking a book out of Favourite books leaves the heart.
    - **When a book no longer has a Read log of yours** (the last one deleted, or changed to DNF or Want to read), its heart and its place in Favourite books go in the same save. The delete or edit form says so first: "It will also leave your favourite books." Today the heart quietly stays, which breaks "a favourite must be read". This answers the FUTURE-IDEAS question about deleting a book from your journal.
13. **What Favourite books can't do:** be deleted, renamed, made Unlisted or Private (favourites have always been public, `specs/reviews-improvements.md` §2), get a genre, be copied, or be pinned (it always shows). It can have a description, tags, likes and comments, and its *Ranked* switch works like any 5 books (off at first, as today's row has no numbers; its order is kept either way). Its title is shown in the viewer's language ("Favourite books", "Libros favoritos"); the stored title is only a fallback.
14. **A list's type is chosen when it's made and never changes.** No turning a 5-book list into a 5 books, or back. This keeps every rule above simple; "Copy" covers the rare wish.
15. **Copying a 5 books makes a 5 books** (Private, as every copy, with the same *Ranked* setting). Challenges work on them unchanged.
16. **Favourite books stays out of the browse page** (every reader would have one, and Recently updated would fill with them). It does appear under "Lists with this book" and counts in Phase 4. Other 5 books lists show in browse like any list, with a *5 books* chip and a genre filter.
17. **A new favourite author takes the first empty showcase slot** by itself, as today all of them show. Once 5 are showcased, new ones go to "See all". Hearting a book does **not** add it to Favourite books (it never filled the showcase before either).
18. **Pinned lists show in the order they were pinned.** No reordering of pins in this spec. A pinned 5 books that is Private or Unlisted shows only to people who could open it.
19. **Share card:** the image card (five covers on one shelf, numbered only when ranked, the theme as the title, MARKETING.md §2 "Lists and 5 books") is drawn by the share-card images work, which has no spec yet (`specs/share-cards.md`, MARKETING.md §2 "How it could be built"). This spec gives a 5 books its link preview (the first book's cover, "@reader's 5 books: theme") through the existing list preview, and leaves an `isComplete` flag on the list for the card button.

## 3. Design

### 3.1 Data

Migration `FiveBooks`. SPEC.md §7 gets the new columns.

- **`BookLists`** gains:
  - `type` (`Standard` = 0 / `FiveBooks` = 1 / `FavouriteBooks` = 2), default `Standard`. `FavouriteBooks` follows every 5 books rule plus §2.2.13. A helper `IsFiveBooks` is true for both.
  - `genre_key` (varchar(40), null), only on `FiveBooks`, checked against `GenreCatalog`.
  - `profile_pin` (smallint, null, 0–2), only on `FiveBooks`. Unique (owner, profile_pin) where not null.
  - Unique (owner) where `type = FavouriteBooks`: one per reader, which also makes the "make it the first time" step race-safe.
- **`FavouriteBooks.ShowcasePosition`** is copied into a Favourite books list per reader who has one (items at the same positions, `AddedAt` = the heart's `CreatedAt`, added by the owner, `Visibility` Public, `IsRanked` false, `UpdatedAt` now), then dropped with its index. Positions 0–3 stay 0–3, so the fifth slot starts empty.
- **`FavouriteAuthors`** gains `showcase_position` (smallint, null, 0–4), unique (user, showcase_position) where not null. The migration numbers each reader's existing favourites 0–3 by `created_at`.
- Erasure: everything cascades with the account, as lists and favourites already do.

### 3.2 Backend

**5 books rules** (in `BookListService`, checked before any Open Library call, like `lists.openFull`):
- Create takes `type` (`Standard` or `FiveBooks`; `FavouriteBooks` can't be asked for), `isRanked` as for any list, and `genreKey`. A 5 books is forced `IsOpen = false`, `Kind = Books`.
- A 6th book → 400 `lists.fiveBooksFull`. Inviting a collaborator, opening it or making it an author list → 400 `lists.fiveBooksRules`. Changing `type` → 400 `lists.typeLocked`. An unknown genre → 400 `lists.unknownGenre`; a genre on a Standard list is ignored.
- Favourite books: delete, rename, visibility other than Public, genre, copy or pin → 400 `lists.favouritesLocked` (the page never offers these).
- `BookListDto` / `BookListSummaryDto` gain `type`, `genreKey`, `profilePin` and `isComplete` (5 books).

**Favourite books** (a small `FavouriteBooksList` helper used by `BookListService`, `ReviewSocialService` and `LogService`, so the sync rules live in one place):
- `GetOrCreateAsync(userId)` on any write, inside the same save; a lost insert race re-reads the row.
- Adding an item: Read log required (existing `reviews` "Mark it as read first." code), hearts the book if needed.
- `ReviewSocialService` unheart: also removes the item and closes the gap.
- `LogService` delete and update: when the book has no Read log of the reader's left, removes the heart and the item in the same save. The log DTO used by the delete/edit forms gets `isFavourite` so the warning can show.
- **Kept for the profile picker:** `PUT /api/users/me/showcase` now replaces Favourite books' items (0–5, hearted books only, the existing `reviews.showcase*` codes with max 5). `GET /api/users/{username}/favourites` reads the showcase from the list and adds its `listId` and `isRanked`.
- Export: `favourites.csv` keeps its showcase column, now filled from the list; `lists.csv` gains a `type` column.

**Pins:** `PUT /api/booklists/{id}/pin` (owner, 5 books only, next free slot, a 4th → 400 `lists.pinsFull`) and `DELETE` the same (closes the gap). `GET /api/users/{username}/pinned-lists` returns the pinned lists the viewer may see, as summaries, behind the profile gate the favourites use.

**Browse:** `ListDiscoveryService` gains `type=fiveBooks` and `genre=` filters; every section leaves out `FavouriteBooks`. "Lists with this book" includes both 5 books types.

**Favourite authors** (`FavouriteAuthorService`):
- `MaxFavourites` 4 → 500 (`authors.tooManyFavourites` keeps its `{max}`).
- A new favourite takes the first empty showcase slot (§2.2.17); removing one closes the gap.
- `PUT /api/users/me/author-showcase` with `{ authorIds: string[] }` (0–5 Open Library ids, each a favourite, no duplicates) replaces the showcase in one save, cleared then filled (as the book showcase). New codes `authors.showcaseMax`, `authors.showcaseFavouritesOnly`.
- `GET /api/users/{username}/favourite-authors` returns `{ showcase, total }` and, with `?page=`, all of them, 48 a page, newest first (same gate as today).
- A merge that finds both the old and the current author favourited keeps one row with the lower showcase position.
- `favourite-authors.csv` gains a showcase column.

**Phase 4, "In N readers' 5 books":** `GET /api/books/{openLibraryId}/five-books` → `{ count, lists: [3 summaries] }`. Counts readers (not lists) with the book in a Public 5 books of either type, counted as a signed-out visitor whoever asks (public, not deactivated or suspended accounts), like author stats (`specs/authors.md` §4.2). Rate limit `public`. Gets an `argos-security` review: it's an aggregate over other readers.

All new codes go in `ErrorCodes.cs` with translations under `errors.codes`.

### 3.3 Frontend

Follows `DESIGN.md` (the shelf is the signature) with the `web-design` skill's short plan and screenshot round. All text through `t('…')` in the five locale files; the name is "5 books" / "5 libros" / "5 livros" / "5 Bücher" / "5 livres".

- **`FiveBooksShelf`**: five covers standing on one shelf. When the list is ranked, large numbers 1–5 in the display font; when not, no numbers, and nothing suggests an order. Used on the profile, on list cards for 5 books, and at the top of a 5 books list page (the rows with notes stay below it).
  - **Empty slots** are part of the design, not missing covers: for the owner, an outlined slot with "+" and "Add a book" that opens the book picker; for everyone else, a quiet outline. A 5 books with no books is shown only to its owner. The empty fifth slot every reader gets after the switch from 4 must read as an invitation ("Pick your fifth"), checked in the screenshot round.
- **Making one:** "Create a list" gets a first choice, *List* or *5 books*, with one line under each. *5 books* keeps *Ranked (show numbers)*, hides *Who can add*, *Books / Authors* and Collaborators, and shows an optional *Genre* select (the 22 genres, translated through the existing catalog). A "New 5 books" button also sits in the profile's area for them.
- **Adding:** `AddToListButton` lists 5 books lists with "3 of 5"; a full one is disabled with "Full". Favourite books is listed first, disabled with "Mark it as read first" when the book isn't read.
- **Reordering:** drag plus the existing ↑/↓ buttons, which are the way on a phone. On five items the buttons must be at least 44 px. Order is saved whether or not numbers show.
- **List page of a 5 books:** a "5 books" label and the genre as a chip linking to browse filtered by it; Pin to profile / Unpin (owner); "Share" offers the card only when complete (until the card images exist, the link). Favourite books hides Delete, Rename, the visibility choice, Copy and Pin, and keeps *Ranked*.
- **Profile:** Favourite books and Favourite authors (5 photos) side by side on a wide screen, stacked on a phone, each with "See all" (Favourite authors → `/u/:username/favourite-authors`, the hearted books → the existing Favourites tab). Then up to 3 pinned 5 books. The owner's "Edit" on each row opens its picker (books: the existing one, capped at 5; authors: the same picker over favourite authors). Followed authors stay below.
- **Delete / edit log forms:** the "It will also leave your favourite books" line (§2.2.12).
- **Browse:** a *5 books* chip and a genre select next to it when it's on.
- **Book page (Phase 4):** "In 12 readers' 5 books" (wording to settle in the copy round) under the rating summary, with the 3 most-liked lists as cards; hidden at 0.

## 4. Tasks

> ⚠️ Phase 2's migration (showcase → list rows, author showcase backfill) and the log-delete sync are the risky part: **high effort** for those. `reviewer` at the end of every phase; `argos-security` after Phase 1 and 2 (visibility of pinned and Favourite books lists, the profile gate) and Phase 4 (aggregate over other readers).

### Phase 1 — 5 books lists (server) · *size M*

#### Backend
- [ ] Migration `FiveBooks` part 1: `type`, `genre_key`, `profile_pin`, the pin and one-favourites-list indexes.
- [ ] 5 books rules on create, add, collaborators, open, kind, type lock, genre; *Ranked* left free; new error codes and translations.
- [ ] Pins: pin/unpin endpoints, `pinned-lists` endpoint behind the profile gate.
- [ ] DTO fields (`type`, `genreKey`, `profilePin`, `isComplete`), browse filters, "Lists with this book", copy keeps the type and *Ranked*, `lists.csv` type column. SPEC.md §7.
- [ ] Tests: the 6th book, each refused setting, ranked on and off, type lock, unknown genre, copy, pins (4th refused, private pin hidden from others, blocked and private-account viewers), browse filters.

### Phase 2 — Favourite books as a 5 books, favourite authors unlimited (server) · *size M–L*

#### Backend
- [ ] Migration part 2 **(high effort)**: copy each reader's showcase into a Favourite books list (not ranked), then drop `ShowcasePosition`; `FavouriteAuthors.showcase_position` with the backfill. Check on a copy of the live data that every showcased book ends at the same position and no reader without a showcase gets a row.
- [ ] `FavouriteBooksList` helper: get-or-create (race), add needs Read and hearts, unheart removes, the locked actions.
- [ ] `LogService` delete/update sync **(high effort)**: no Read log left → heart and item go in the same save; `isFavourite` on the log DTO.
- [ ] Showcase endpoint and `GET …/favourites` over the list; `favourites.csv` from the list.
- [ ] Favourite authors: cap 500, first free slot, author-showcase endpoint, paged `favourite-authors`, merge keeps the lower position, export column, new codes.
- [ ] Tests: migration result (dev database and a test that runs the copy step), the four sync rules (including a reread where one Read log remains), locked actions, showcase replace with 5, favourite authors past 4, showcase order, merge.

### Phase 3 — 5 books and the new profile (browser) · *size M–L*

#### Frontend
- [ ] `FiveBooksShelf` with empty slots and numbers only when ranked, on the profile, list cards and the list page.
- [ ] Create form *List / 5 books* with *Ranked* and genre; "New 5 books" on the profile; add-to-list counts and Full; pin/unpin.
- [ ] Profile: Favourite books and Favourite authors side by side, pinned 5 books, both pickers capped at 5, `/u/:username/favourite-authors`.
- [ ] Favourite books' locked controls hidden; the "will also leave your favourite books" line on log delete and edit.
- [ ] Browse *5 books* chip and genre select.
- [ ] Translations in all five locales. Vitest for the shelf (1–5 books, ranked and not, owner vs visitor), the create form, the pickers at 5, and the log-delete warning.
- [ ] `web-design` screenshot round (the empty fifth slot, and an unranked shelf that doesn't look like a ranking), then `reviewer`.

### Phase 4 — "In N readers' 5 books" · *size S–M*

- [ ] Backend: `GET /api/books/{id}/five-books`, counted as a visitor; tests for private accounts, private and unlisted lists, suspended and deactivated readers, blocks not changing the count.
- [ ] Frontend: the line and cards on the book page, five locales.
- [ ] `reviewer`, then `argos-security`.

### Verification
- [ ] `browser-check` with two seeded readers: A had 4 showcased favourites before the migration → sees them in the same order, without numbers, with an inviting fifth slot, picks a fifth; B sees all five and likes and comments on A's Favourite books. A turns *Ranked* on → numbers show for both.
- [ ] A makes a "Science fiction" 5 books with the genre, ranked, adds 3 books, reorders with ↑/↓ at 375 px, pins it; A makes an unranked "To read in winter" too; B sees both on A's profile; A makes one Private; B no longer sees it.
- [ ] A deletes the journal entry of a book in Favourite books → the warning shows, and the book leaves both the heart shelf and the list.
- [ ] A favourites a 6th author → it's under "See all"; A swaps it into the showcase.
- [ ] Phone width, all five themes. What's new entry once Phase 3 is live (the switch from 4 to 5 is visible to everyone).
- [ ] Re-read this spec against what was built; `CHANGELOG.md`; SPEC.md.

## 5. Checked against the other list and author specs (2026-11-06)

Where this spec changes, narrows or relies on an earlier rule:

**`specs/book-lists-improvements.md`**
- §2 "Ranked is an on/off switch per list": kept as is on a 5 books, off by default.
- §2/§3.2 Public / Unlisted / Private: unchanged for 5 books; Favourite books is Public only (§2.2.13), and §3.2's `CanView` still decides who sees a pinned one.
- §2 "A book can appear only once per list": applies; the unique (list, book) index already enforces it.
- §3.3 `ListCoverStack` (first 5 covers): kept for Standard lists; 5 books cards use `FiveBooksShelf` instead.
- §3.7 browse and §3.8 "Lists with this book": 5 books take part; Favourite books only in the second (§2.2.16).
- §3.9 copy: keeps the type; not offered on Favourite books.
- §3.10 challenges: unchanged, allowed on 5 books.
- §3.11 collaborators: refused on 5 books (`lists.fiveBooksRules`). So `specs/stronger-lists.md`'s hand-over on erasure never applies to one: it is only ever the owner's and goes with the account.

**`specs/open-lists.md`**
- §2.1 "One kind per list" and §3.2 the kind lock: a 5 books is always `Books`; favourite authors stay outside lists (§2.1.5), so author lists are unaffected.
- §2.2.1 open lists are Public and rank by votes: a 5 books can never be open, so votes never mix with an owner's choice of five.
- §2.2.11 the 500 cap: the cap of 5 is checked in the same place, before any Open Library call.

**`specs/authors.md` Phase 4**
- "Pick up to 4" and `authors.tooManyFavourites` at 4: now 500, with a separate showcase of 5.
- "Shown in the order added": now the showcase order, and new favourites fill empty slots in the order added, so a reader with 4 or fewer sees no change.
- §7.4 "The list never shows more than four": the showcase never shows more than five.
- Merges move favourites with follows: also keeps the lower showcase position.
- The profile row "above Authors you follow": now beside Favourite books, still above Authors you follow.

**`specs/reviews-improvements.md` §3.10** (not one of the three asked for, but it owns the showcase): `ShowcasePosition` 0–3 and `PUT /api/users/me/showcase` 0–4 become Favourite books' items and 0–5; favourites stay public; hearting still needs a Read log, and losing the last one now also removes the heart (§2.2.12). `specs/profile-add-books.md`'s "Add as favourite" (marks the book read first) is unchanged.

**`specs/posting-limits.md`**: creating a 5 books is in the `creations` bucket like any list; the Favourite books row made on a first add isn't counted.

## 6. Out of scope

- The share card images themselves (`specs/share-cards.md`, to write) and "My 5 books of 2026" (with Wrapped).
- Reordering pinned lists, and a public "everyone's science fiction 5 books" page (the genre is stored for it).
- 5 authors lists.
