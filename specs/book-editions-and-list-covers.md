# Feature Spec — Editions on the book page, and your cover on lists

**Status:** Planned 2026-10-26. Not started.

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
- **Each edition has one action, depending on your shelf:**
  - No log of this book yet: **"Want to read with this cover"**, which creates a Want to read log with `editionOpenLibraryId`.
  - A log already: **"Use this cover"**, which sets the edition on your most recent log of the book (update log). The currently chosen edition is marked.
  - Phase 2 adds **"Add to a list with this cover"**.
- States: loading, Open Library unreachable (`unavailable`, with the existing wording), no editions with covers.
- Shown on a phone too: the panel stacks, with no horizontal overflow.

### 3.2 Phase 2 — Your cover on a list

**Data.** `ListItems` gets `EditionOpenLibraryId string?` and `EditionCoverId int?`. Language, publisher and year aren't needed on a list, so they're left out. One migration (`ListItemEdition`), no backfill.

**Server.**
- Adding a list item (`BookListService.AddItemAsync`) takes an optional `editionOpenLibraryId`.
- A new item update (the note update grows into it, or a sibling `PATCH .../items/{itemId}/edition`) sets or clears the edition (`null` clears it). Same permission as editing the note: the owner and collaborators.
- Both check the edition with `EditionService.FindAsync`. The errors reuse `logs.editionNotOfBook` / `logs.editionUnavailable`, or new `lists.*` codes with translations if the wording has to differ.
- Where list covers come from: `BookListDtoMapper` item `BookCoverUrl`, the list previews (`CoverUrls` on summaries), and the list share card (`ShareCardService`) all use the edition cover when one is set. Add a small `ListItemCover.Url(item, language)` next to `LogCover`.
- Copying a list (`CopyAsync`) keeps each item's edition.
- Cover colours: check whatever `CoverColorService` feeds (the shelf effect) and treat a list item's edition cover the way a log's edition cover is treated.

**Frontend.**
- On a list you can edit: **"Change cover"** on each item opens the shared edition list from Phase 1, plus "Book's own cover".
- The book page editions panel gets **"Add to a list with this cover"**, which opens the existing add-to-list picker and passes the edition.
- Five languages for every new text.

## 4. Out of scope

- A cover chosen for the book page itself (the shared default stays automatic, `specs/formats-editions.md` §2).
- Search results with edition covers.
- "Readers of this edition" or anything that needs an `Edition` table.

## 5. Cost on our hosting

- **Database:** two nullable columns on `ListItems`, a few bytes per item. Nothing else is stored.
- **Server memory:** the editions cache already exists (per work, 6 h, only editions with a cover, typically tens to ~120 small records). Phase 1 means more readers open it, but only by tapping, and only signed in. The `Heavy:` request log will show it if it ever gets big.
- **Open Library:** one editions request per work per 6 hours at most, the same as today.

## 6. Tasks

### Phase 1 — Editions on the book page (S–M)

**Frontend**
- [ ] Shared edition list (cover grid, language filter, states) pulled out of `EditionField`, which then uses it
- [ ] "See editions" button and panel on the book page, signed in only, fetched on tap
- [ ] "Want to read with this cover" (new log) / "Use this cover" (latest log), chosen edition marked
- [ ] Translations in all five locales; Vitest for the action choice and the states

**Verification**
- [ ] Browser check: One Hundred Years of Solitude, desktop and 375 px, two themes; no editions request until the tap; a Want to read with a chosen cover shows that cover on your shelf
- [ ] `reviewer`

### Phase 2 — Your cover on a list (M)

**Backend**
- [ ] Migration `ListItemEdition` (two nullable columns)
- [ ] Add item takes `editionOpenLibraryId`; set/clear edition on an item; checked with `EditionService.FindAsync`; owner and collaborators only
- [ ] `ListItemCover` used by the item DTO, list previews and the list share card; copy keeps the edition
- [ ] Tests: wrong work's edition refused, Open Library down, non-editor refused, cleared with null, copy keeps it, preview and share card use the edition cover

**Frontend**
- [ ] "Change cover" on list items you can edit
- [ ] "Add to a list with this cover" in the book page editions panel
- [ ] Translations in all five locales; Vitest

**Verification**
- [ ] Browser check: change a cover on a list, see it as another signed-in reader and as a visitor; list card preview uses it
- [ ] `reviewer` and `argos-security` (user input reaching the server, an external call)
