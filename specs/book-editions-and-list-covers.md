# Feature Spec — Editions on the book page, and your cover on lists

**Status:** Built 2026-10-26 (Phase 1 Apollon d60aab0, Phase 2 below).

## 1. Problem

Two requests from the user (2026-10-26):

1. **Editions are hidden.** A book's editions (cover, language, publisher, year) can only be seen inside the log form's Edition picker, behind "Log this book". Someone who just wants to browse them, or to find the cover they own, has no way in from the book page.
2. **A list can't show the cover you chose.** A book on a list always shows the shared cover. Curating a list of, say, Penguin Classics or the Spanish editions you own isn't possible.

Want to read already supports an edition, because it's a log (`LogStatus.WantToRead`) and the log form's Edition picker shows for every status. But the one-tap `WantToReadButton` saves with no edition, and changing it later means opening the full form. Phase 1 closes that gap from the new editions panel.

## 2. Decisions

- **A list item's chosen cover is seen by everyone** who can see the list (the user, 2026-10-26). Whoever curates the list picks how the book looks there. This differs from logs on purpose: a list is something you make for others.
- **The editions only load when asked for.** The book page shows a "See editions" button; nothing is fetched from Open Library until it's tapped. Fetching a work's editions reads up to 500 entries from Open Library (~350 KB, ~2 s), and book page loads were the cause of the memory incident (`DEPLOY.md`, "Incidents on the live site"). On every page load that would be wasted on most visits, and bots would trigger it too.
- **Signed-in readers only**, like the endpoint today (`GET /api/books/{id}/editions` is logged-in only and serves only books Argos already has). Visitors don't see the button. Nothing changes in the endpoint.
- **No `Edition` table**, as decided in `specs/formats-editions.md` §2. A list item keeps a snapshot of the edition in nullable columns, like `Log` does.
- **The server copies edition details from Open Library, never from the client.** The client sends only `editionOpenLibraryId`; the server checks it with `EditionService.FindAsync` for that item's work, as `LogService` does.
- **Language:** a chosen edition's cover wins over the reader-language cover (`ShownBook.CoverUrl`), the same way `LogCover` works.

## 3. Design

### 3.1 Phase 1 — Editions on the book page

**Frontend only.**

- A "See editions" button on the book page (signed in), near the cover. Tapping it opens a panel that uses `GET /api/books/{id}/editions`, so it shares the 6-hour cache the log form's picker already fills. The panel shows a grid of covers with language, publisher and year, and a language filter when there's more than one language. Reuse the list and filter parts of `EditionField`, pulled out into a shared component rather than copied.
- **Each edition has one action, "Use this cover"; what it does depends on your shelf:**
  - No log of this book yet: it creates a Want to read log with `editionOpenLibraryId`.
  - A log already: it sets the edition on your most recent log of the book (update log). The currently chosen edition is marked ("Your cover") and listed first when the panel opens.
  - The line under the heading says which of the two it is, once, and is each button's `aria-describedby`. (Built 2026-10-26: the planned "Want to read with this cover" label wrapped on every one of the buttons, so the design critique moved that consequence into the intro.)
  - Phase 2 adds **"Add to a list with this cover"**.
- 8 editions at first, then 24 more per "Show more editions". An edition with no language is named by its publisher or year, never "Language not given".
- States: loading, Open Library unreachable (`unavailable`, with the existing wording), no editions with covers.
- Shown on a phone too: the panel stacks, with no horizontal overflow.

### 3.2 Phase 2 — Your cover on a list

**Data.** `ListItems` gets `EditionOpenLibraryId string?` and `EditionCoverId int?`. Language, publisher and year aren't needed on a list, so they're left out. One migration (`ListItemEdition`), no backfill.

**Server.**
- Adding a list item (`BookListService.AddItemAsync`) takes an optional `editionOpenLibraryId`.
- A new item update (the note update grows into it, or a sibling `PATCH .../items/{itemId}/edition`) sets or clears the edition (`null` clears it). Same permission as editing the note: the owner and collaborators. (Built: `PUT .../items/{itemId}/edition`, next to `/position`. The note's rule is the owner on any item and a collaborator on the books they added, so "Change cover" follows it.)
- Both check the edition with `EditionService.FindAsync`. The errors reuse `logs.editionNotOfBook` / `logs.editionUnavailable`, or new `lists.*` codes with translations if the wording has to differ.
- Where list covers come from: `BookListDtoMapper` item `BookCoverUrl`, the list previews (`CoverUrls` on summaries), and the list share card (`ShareCardService`) all use the edition cover when one is set. Add a small `ListItemCover.Url(item, language)` next to `LogCover`.
- Copying a list (`CopyAsync`) keeps each item's edition.
- Cover colours: check whatever `CoverColorService` feeds (the shelf effect) and treat a list item's edition cover the way a log's edition cover is treated. (Checked: it colours only Currently reading logs, for stories; lists don't use it, so nothing changed.)
- Built besides: the item also sends `BookOwnCoverUrl`, so "Book's own cover" in the picker shows it; an import that moves a list item to another book clears its edition (it belonged to the old work); Undo after removing a book puts it back with its cover.

**Frontend.**
- On a list you can edit: **"Change cover"** on each item opens the shared edition list from Phase 1, plus "Book's own cover". (Built: in the Details view beside "Add note"; an inline picker of rows, `EditionOptions`, shared with the log form's Edition picker; a tap saves; Escape or Cancel closes. The Shelf view's hint now names it.)
- The book page editions panel gets **"Add to a list with this cover"**, which opens the existing add-to-list picker and passes the edition. (Built: a quiet "Add to a list" under each edition's "Use this cover", only for a reader with lists; it opens a row at the top of the panel with that cover and `AddToListButton`, whose select takes the focus.)
- Five languages for every new text.

## 4. Out of scope

- A cover chosen for the book page itself (the shared default stays automatic, `specs/formats-editions.md` §2). (Added 2026-10-27, Apollon ef4b3be: the big cover shows *your* cover, the edition on your newest log, to you only, so a pick in See editions shows at once. Everyone else still sees the default.)
- Search results with edition covers.
- "Readers of this edition" or anything that needs an `Edition` table.

## 5. Cost on our hosting

- **Database:** two nullable columns on `ListItems`, a few bytes per item. Nothing else is stored.
- **Server memory:** the editions cache already exists (per work, 6 h, only editions with a cover, typically tens to ~120 small records). Phase 1 means more readers open it, but only by tapping, and only signed in. The `Heavy:` request log will show it if it ever gets big.
- **Open Library:** one editions request per work per 6 hours at most, the same as today.

## 6. Tasks

### Phase 1 — Editions on the book page (S–M)

**Frontend**
- [x] Shared edition list (`EditionList`: query, language filter, states) pulled out of `EditionField`, which then uses it
- [x] "See editions" button and panel on the book page (`BookEditions`), signed in only, fetched on tap
- [x] "Use this cover": a new Want to read log, or the latest log's edition; chosen edition marked
- [x] Translations in all five locales; Vitest for the action choice and the states

**Verification**
- [x] Browser check: One Hundred Years of Solitude, desktop and 375 px, two themes; no editions request until the tap; a Want to read with a chosen cover shows that cover on your shelf
- [x] `reviewer` (no bugs; left as is: an old imported log with inconsistent dates is refused by the full update, the same as the quick-log buttons, and shows the server's message)

### Phase 2 — Your cover on a list (M)

**Backend**
- [x] Migration `ListItemEdition` (two nullable columns)
- [x] Add item takes `editionOpenLibraryId`; set/clear edition on an item; checked with `EditionService.FindAsync`; owner and collaborators only
- [x] `ListItemCover` used by the item DTO, list previews and the list share card; copy keeps the edition
- [x] Tests: wrong work's edition refused, Open Library down, non-editor refused, cleared with null, copy keeps it, preview and share card use the edition cover

**Frontend**
- [x] "Change cover" on list items you can edit
- [x] "Add to a list with this cover" in the book page editions panel
- [x] Translations in all five locales; Vitest

**Verification**
- [x] Browser check: change a cover on a list, see it as another signed-in reader and as a visitor; list card preview uses it
- [x] `reviewer` and `argos-security` (user input reaching the server, an external call). Fixed from them: Undo falls back to the book's own cover when the edition can't be checked again; the account export's `lists.csv` has the edition; "Change cover" also refreshes the Feed's list cards; the edition PUT has the search rate limit. Left as is: adding a book already on the list still checks its edition first (cached 6 h, signed in only); the panel's list picker can't change the cover of a book already on that list (that's "Change cover" on the list); no test pins the import clearing an edition; an Open Library outage isn't cached, so each check during one retries (as for logs)
