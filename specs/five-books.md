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
- [x] Migration `FiveBooks` part 1: `type`, `genre_key`, `profile_pin`, the pin and one-favourites-list indexes.
- [x] 5 books rules on create, add, collaborators, open, kind, type lock, genre; *Ranked* left free; new error codes and translations.
- [x] Pins: pin/unpin endpoints, `pinned-lists` endpoint behind the profile gate.
- [x] DTO fields (`type`, `genreKey`, `profilePin`, `isComplete`), browse filters, "Lists with this book", copy keeps the type and *Ranked*, `lists.csv` type column. SPEC.md §7.
- [x] Tests: the 6th book, each refused setting, ranked on and off, type lock, unknown genre, copy, pins (4th refused, private pin hidden from others, blocked and private-account viewers), browse filters.

#### Built (2026-11-12)

- Columns are `Type`, `GenreKey`, `ProfilePin` on `BookLists` (PascalCase like the rest of the table). Checks `CK_BookLists_FiveBooksClosed`, `CK_BookLists_FiveBooksOnlyFields`, `CK_BookLists_ProfilePinRange`; one Favourite books per reader is the partial unique `IX_BookLists_UserId_FavouriteBooks`.
- The pin slots are a **deferrable** unique constraint (`UQ_BookLists_UserId_ProfilePin`, raw SQL in the migration, like list positions), so unpinning or deleting a pinned list moves the later pins up in one save. Pin changes count slots past the query filters, so a list the admins hid keeps its slot. Two pins at once → 409 `lists.changedConcurrently`.
- Update: `type` sent and different → `lists.typeLocked`; `genreKey` null leaves it, `""` clears it. Favourite books compares the title **as stored**, so Phase 3's edit form must send the stored title back, not the translated one.
- `pinned-lists` numbers the pins 0..n-1 as the viewer sees them (a gap would show a hidden private pin, `argos-security`), and leaves out an empty 5 books for everyone but its owner (§3.3).
- An extra code `lists.pinFiveBooksOnly` (pinning a Standard list) and `lists.badType` (asking for Favourite books, or browsing it).
- Reviews: `reviewer` and `argos-security` done, findings fixed. A pinned *Unlisted* 5 books shows on the profile to everyone, as §2.2.18 says; kept by the user 2026-11-13 (see Verification).
- 15 tests in `FiveBooksTests.cs`. Apollon: uncommitted at the time of writing.

### Phase 2 — Favourite books as a 5 books, favourite authors unlimited (server) · *size M–L*

#### Backend
- [x] Migration part 2 **(high effort)**: copy each reader's showcase into a Favourite books list (not ranked), then drop `ShowcasePosition`; `FavouriteAuthors.showcase_position` with the backfill. Check on a copy of the live data that every showcased book ends at the same position and no reader without a showcase gets a row. *Built and checked on copies of the dev data (with edge cases added) and on a copy of the live data (2026-11-13, see Built below).*
- [x] `FavouriteBooksList` helper: get-or-create (race), add needs Read and hearts, unheart removes, the locked actions.
- [x] `LogService` delete/update sync **(high effort)**: no Read log left → heart and item go in the same save; `isFavourite` on the log DTO.
- [x] Showcase endpoint and `GET …/favourites` over the list; `favourites.csv` from the list.
- [x] Favourite authors: cap 500, first free slot, author-showcase endpoint, paged `favourite-authors`, merge keeps the lower position, export column, new codes.
- [x] Tests: migration result (dev database and a test that runs the copy step), the four sync rules (including a reread where one Read log remains), locked actions, showcase replace with 5, favourite authors past 4, showcase order, merge.

#### Built (2026-11-12)

- **A rule added for privacy (reviewer and `argos-security` both raised it):** Favourite books holds only books with a Read log **everyone may see** (reading privacy Public). The old showcase hid a hearted book from viewers who couldn't see that reading (`books-community-split.md` §2); a list has no per-viewer filter. So:
  - the migration copies only showcased books with a Public Read log, positions closed up (0..n-1); the others stay hearted, for the reader to make public and add again;
  - adding (list page or picker) needs one: no Read log → `reviews.markReadFirst`, only a private or followers reading → new `lists.favouritesPublicRead`;
  - a reading made Private or Followers (per entry, in the edit form, or "make everything private") takes the book off the list in the same save; **the heart stays** (hearts are filtered per viewer). The last Read log going takes heart and place (§2.2.12).
  - **For the user to confirm:** a reader whose readings default to Followers can't fill Favourite books without making those readings Public. The alternative is a per-viewer filter on Favourite books everywhere a list's items show (list page, cards, "Lists with this book", share card, search pages), which is much more code. Phase 3's add button and picker should explain the rule.
- Code: `FavouriteBooksListRepository` (raw SQL, locks the list row like any list change, joins the caller's transaction) and the `FavouriteBooksList` helper (used by `BookListService`, `ReviewSocialService`, `LogService`, `ImportService`). Hearting still doesn't add to the list (§2.2.17). `LogRepository.DeleteAsync` joins an open transaction.
- **Extra endpoint not in §3.2:** `POST /api/users/me/favourite-books` → `{ listId }`, making the list if needed, so Phase 3's "Add to list" has an id before the first add. `GET …/favourites` adds `listId` (null until the list exists) and `isRanked`; `showcasePosition` is the list position.
- `PUT /api/users/me/showcase` re-checks under the list lock (hearted and publicly read); a change that lands meanwhile gives `lists.changedConcurrently`.
- Import: "Remove" and "Undo" sync in the same transaction as the log delete; a title-match fix that moves logs to another book syncs the old book after the save.
- Favourite authors: slots kept by a per-reader advisory lock; deferred unique `UQ_FavouriteAuthors_UserId_ShowcasePosition` and check `CK_FavouriteAuthors_ShowcasePositionRange`. `GET …/favourite-authors` returns `{ showcase, total, hasMore, authors }`: without `?page` `authors` is the showcase (what today's frontend reads), with `?page=` (48 a page, newest first) one page. New codes `authors.showcaseMax`, `authors.showcaseFavouritesOnly`, `authors.showcaseDuplicate`. `favourite-authors.csv` gains "Profile position".
- `LogDto.isFavourite` = the owner hearted the book (false for anyone else); Phase 3's warning shows it when no other Read log of the book is left.
- Migration `FavouriteBooksList` (Apollon `src/Argos.Infrastructure/Migrations/20261113023004_FavouriteBooksList.cs`), reversible (Down puts the list back in the old column, tested). Tests: `FavouriteBooksListTests` (8), `FavouriteBooksMigrationTests` (the copy step on a throwaway database), new `FavouriteAuthorTests` (past four, picker, cap 500, merge).
- **Live-copy check, done 2026-11-13:** the Render backup of 2026-11-13 14:20 UTC (68 readers, at `ChatReactionsChangedBy`) restored into `argos_livecopy`, then `powershell -File scripts/five-books-migration-check/run.ps1 -Database argos_livecopy`: every "problems" row 0. 26 hearts, 12 showcased books from 6 readers, all with a Public Read log, so 6 Favourite books lists with 12 books and none left out; 14 favourite authors (7 readers) all in their slots; no list, item or heart lost. The script now first brings an older copy up to `FiveBooks` (it only adds columns to `BookLists`), since `before.sql` reads `BookLists."Type"`. Also run earlier on two dev copies (one with private, followers-only, gap and 6-author cases added): all 0.
- Reviews: `reviewer` and `argos-security` done, findings fixed (the privacy rule above, picker re-check under the lock, atomic import undo, import re-match, a JSON null body → 400).

### Phase 3 — 5 books and the new profile (browser) · *size M–L*

#### Frontend
- [x] `FiveBooksShelf` with empty slots and numbers only when ranked, on the profile, list cards and the list page.
- [x] Create form *List / 5 books* with *Ranked* and genre; "New 5 books" on the profile; add-to-list counts and Full; pin/unpin.
- [x] Profile: Favourite books and Favourite authors side by side, pinned 5 books, both pickers capped at 5, `/u/:username/favourite-authors`.
- [x] Favourite books' locked controls hidden; the "will also leave your favourite books" line on log delete and edit.
- [x] Browse *5 books* chip and genre select.
- [x] Translations in all five locales. Vitest for the shelf (1–5 books, ranked and not, owner vs visitor), the create form, the pickers at 5, and the log-delete warning.
- [x] `web-design` screenshot round (the empty fifth slot, and an unranked shelf that doesn't look like a ranking), then `reviewer`.

#### Built (2026-11-13)

- **Decided with the user:** Favourite books keeps the Public-only rule from Phase 2 (no per-viewer filter). The add search on its page, "Add to list" and the profile picker each say the rule before adding.
- `FiveBooksShelf` (five equal places on one board, an `ol` with big display numbers when ranked, a `ul` without numbers when not). The owner's first empty place is the one button ("Add a book", "Pick your fifth" when four are in), with a green dashed outline; the other empty places and a visitor's are faint dashed outlines. When the shelf is narrower than 22rem (a phone), titles leave the screen (kept for screen readers) and the add place shows only its plus. On a card, covers only, with the number row kept so cards line up.
- Profile: Favourite books (heading links to its list; "See all (N)" opens the Favourites tab) and Favourite authors (heading "Favourite authors" for everyone; five as a photo grid, 3+2 beside the books, "See all (N)" past five) in a `favourites` container, side by side from 40rem. Then "5 books": the pinned ones (each loads its list for book links; the owner's empty place opens the list) and the owner's "New 5 books" (`/lists?new=fiveBooks`). Both pickers are one shared `ShowcasePicker` (5 at most, ↑/↓ at 44px).
- List page of a 5 books: "5 books" pill and the genre as a pill link to browse (`/lists/browse?fiveBooks=1&genre=`), the shelf above the rows (the shelf/rows switch and sort are hidden), reorder arrows at 44px, Pin/Unpin, collaborators hidden, the image share offered only when complete, add hidden when full. Favourite books also hides Delete and Copy, and its edit form shows only description, tags and *Ranked* (the stored title and Public are sent back).
- "Add to list": Favourite books first, offered before the list exists (made with `POST /api/users/me/favourite-books` on the first add), "Title (3 of 5)", "Title: full", "Title: mark it as read first" (the book page passes whether you read it).
- Log forms: delete (the "⋯" menu, the journal, and your review card on the book page, which now asks before deleting) and edit warn "It will also leave your favourite books." when the log is the last Read log of a hearted book, or the last public one of a book in Favourite books. Making the reading Private or Followers says the book leaves Favourite books and stays hearted. `lib/favouriteLeaving.ts`.
- Caches: a log change and an un-heart also refresh `['bookLists']` (the server takes the book off the list); a change on the Favourite books page refreshes `['favourites']`.
- Texts that said "four" now say five. Tests: `FiveBooks.test.tsx` (17) plus updated favourites tests.
- Screenshot round: two `design-reviewer` critique rounds (fixes: browse's genre select on its own line, which made 375 scroll sideways; the add place in green; the authors grid beside the books; one heading; card number rows; genre as a pill), then a fresh full review (disposition **ship**, after the add place got its words under the shelf when the place is too narrow for them). Left for later: the floating feedback button covering a heading link on a phone (`bugs/feedback-button-covers-row-links.md`), and the shared list page's header Add button and row controls. `reviewer` findings fixed (list caches after a log change, the last-public-read warning, Ranked hidden after an open list switched to 5 books, the rule in Add to list).
- Apollon 92536be (with Phase 4), pushed 2026-11-13.

### Phase 4 — "In N readers' 5 books" · *size S–M*

- [x] Backend: `GET /api/books/{id}/five-books`, counted as a visitor; tests for private accounts, private and unlisted lists, suspended and deactivated readers, blocks not changing the count.
- [x] Frontend: the line and cards on the book page, five locales.
- [x] `reviewer`, then `argos-security`.

#### Built (2026-11-13)

- `GET /api/books/{openLibraryId}/five-books` → `{ count, lists }` (`BookFiveBooksDto`), anonymous, rate limit `public`. The count is the same for everyone: distinct readers with the book in a Public 5 books or Favourite books, on a public, active account (not away, suspended or the deleted placeholder), in a list the admins haven't hidden (`HiddenAt` checked by name, since the Hidden filter would let the asker's own through). `ListSocialRepository.CountFiveBooksReadersWithBookAsync`.
- The up to 3 cards reuse "Lists with this book" (`fiveBooksOnly`), most-liked first, with its viewer filter: blocks both ways when signed in, readers who turned discovery off for a visitor. So the count can be above the cards shown, and the line stays when no card is left. A hidden list isn't a card even for its owner. One reader can fill two cards (a 5 books and Favourite books), left as is.
- A book nobody cached answers `{0, []}`, never calling Open Library.
- Book page: `FiveBooksWithBookSection` (in `ListsWithBookSection.tsx`) right under "What readers think", heading "In 12 readers' 5 books" / "En los 5 libros de 12 lectores" (plural forms in all five locales), cards with the 5 books shelf; nothing at 0. Under the `bookLists` query key, so a list change refreshes it.
- Tests: `FiveBooksTests` `InFiveBooks_*` (3), `FiveBooksWithBookSection.test.tsx` (4).
- Reviews: `reviewer` (fixed: hidden list as an owner's own card), `argos-security` clean. It noted that "count above cards" can hint that someone in a block has the book, which signing out already shows (`bugs/blocks-only-apply-signed-in.md`).
- Screenshot round for the section: done in Verification below.
- Apollon 92536be (Phases 3 and 4 together), pushed 2026-11-13.

### Verification
- [x] `browser-check` with two seeded readers: A had 4 showcased favourites before the migration → sees them in the same order, without numbers, with an inviting fifth slot, picks a fifth; B sees all five and likes and comments on A's Favourite books. A turns *Ranked* on → numbers show for both.
- [x] A makes a "Science fiction" 5 books with the genre, ranked, adds 3 books, reorders with ↑/↓ at 375 px, pins it; A makes an unranked "To read in winter" too; B sees both on A's profile; A makes one Private; B no longer sees it.
- [x] A deletes the journal entry of a book in Favourite books → the warning shows, and the book leaves both the heart shelf and the list.
- [x] A favourites a 6th author → it's under "See all"; A swaps it into the showcase.
- [x] Phone width, all five themes. What's new entry once Phase 3 is live (the switch from 4 to 5 is visible to everyone). *(Drafted below; post it after the deploy.)*
- [x] Re-read this spec against what was built; `CHANGELOG.md`; SPEC.md.

#### Verified (2026-11-13)

- **`browser-check`** (readers A, B, C on the side ports), every step passed:
  - A's 4 favourites were seeded through the showcase endpoint. The migration itself was checked on the live copy (Phase 2).
  - Order kept, no numbers, "Pick your fifth"; picking a fifth inline worked. B liked and commented. *Ranked* on → 1–5 for A and B.
  - Reorder buttons 44×44, and the order survives a reload. Both pins show to B. The Private one leaves B's view of the profile, and its URL says "List not found."
  - The delete confirm ends "It will also leave your favourite books."; the hearted count and the list both went 5 → 4.
  - 6 authors → 5 shown plus "See all (6)"; the picker swap shows on the profile.
  - Book page: "In 4 readers' 5 books" (a fourth reader was seeded by another session) with 3 shelf cards, signed in and signed out. A book in nobody's 5 books shows no section.
  - No sideways scroll at 375 on the profile, the list pages, browse with the 5 books chip and genre, favourite authors, or the book page.
- **Five themes at 375** (the section, signed in and out; A's profile): `design-reviewer`.
  - Fixed: the quiet dashed empty places used `--border` (about 1.3:1 on the shelf) and nearly vanished in Dark. They now mix `--text-muted` into it (`FiveBooksShelf.module.css`).
  - Checked and kept: the muted "4 of 5" text measures 4.66–7.27:1 in every theme, and the blank number row on unranked cards keeps cards level (Phase 3).
  - Seen, not from this spec: the list card's owner pill, and the profile's shelf tabs clipping at the edge (they scroll).
- **Re-read against the build:** matches §2–3 with the changes the Built notes give: Public-only Favourite books, the extra `POST /api/users/me/favourite-books`, `favourite-authors` paging shape, `lists.favouritesPublicRead` / `lists.pinFiveBooksOnly` / `lists.badType` / `authors.showcaseDuplicate`. SPEC.md §7 already has the columns (Lists, FavouriteAuthors, FavouriteBooks).
- **Decided with the user (2026-11-13):** a pinned *Unlisted* 5 books keeps showing on the profile to everyone (pinning is a deliberate choice; "just for me" is a pinned *Private* one, shown only to its owner). The list page now tells the owner, while it is pinned and Unlisted: "Pinned lists show on your profile to everyone. Make it Private to keep it just for you." (`lists.fiveBooks.pinnedUnlistedHint`, five locales, a `ListDetailPage` test).
- **What's new entry, to post after the deploy** (Try it: `/lists?new=fiveBooks`):
  - *EN:* **5 books.** Make a set of five books on any theme: your five science fiction, five to read in winter. Turn on Ranked if it's a top five, or leave it as a set. Pin up to three to your profile, where others can like and comment on them. Your favourite books are now a 5 books too, with room for a fifth. Favourite as many authors as you like and choose five for your profile. And a book's page shows how many readers have it in their 5 books.
  - *ES:* **5 libros.** Crea un grupo de cinco libros sobre lo que quieras: tus cinco de ciencia ficción, cinco para leer en invierno. Activa Ranking si es un top cinco, o déjalo como grupo. Fija hasta tres en tu perfil, donde otros pueden darles «me gusta» y comentarlos. Tus libros favoritos ahora también son un 5 libros, con sitio para un quinto. Marca como favoritos a todos los autores que quieras y elige cinco para tu perfil. Y la página de un libro muestra cuántos lectores lo tienen en sus 5 libros.

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
