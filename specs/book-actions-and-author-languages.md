# Feature Spec — Book "⋯" menu, "already logged" check, author books by language

**Status:** Specced 2026-11-04. Phase 1 built 2026-11-04 (uncommitted in Apollon until reviewed); Phases 2 and 3 not built

## 1. Problem

From a first-time reader's message (2026-11-04, in Spanish): she logged some books twice by mistake and couldn't find how to delete them. She also asked for an author's whole bibliography in date order, with a way to choose the language.

What the code does today:

- **Deleting is in one place only.** The journal (`/journal`, and the Journal tab of your profile) has a "⋯" menu on each book (`JournalEntryActions`, Edit / Delete). The profile's shelf tabs (All, Reading, Read, Want to read, Stopped, Favourites), the Books home rows (Want to read, Journal preview) and the book page have none. On the book page your status pill (`MyStatus`) can't be edited or deleted; only a review card can (`LogReviewCard`). In a list you own, the "Remove from list" button is in the Details view only, not the Shelf view.
- **Logging twice is easy.** Once you've finished a book, the book page's button becomes "Log again" (`books.logAgain`), which opens a blank `LogForm` and creates a second log. Re-reads are allowed on purpose (`IsReread`), so nothing asks.
- **Date order already exists.** The author page sorts by Popular, Newest, Oldest and Highest rated (`specs/authors.md` §3). "Oldest" is chronological by first publication year. Coverless works are hidden until "Include books without a cover" is ticked. She didn't find it; making it easier to find belongs in a `/ux-review` of the author page, not here.
- **Language isn't a choice on the author page.** Titles already show in the reader's interface language where Open Library has an edition in it (`specs/book-data-in-reader-language.md`), but you can't ask "this author's books in English" or "in Spanish". Book search already has this filter (`language:spa` in `OpenLibraryClient.BuildQuery`, `SEARCH_LANGUAGES` in `web/src/lib/searchFilters.ts`).

## 2. Design

### 2.1 The "⋯" menu on your own books

One component, `BookActionsMenu` (built on `OverflowMenu`), passed to `ShelfBook.action` the way the journal shelf already does. It shows **only on your own books**. Other readers' shelves and lists, search results, author pages and the Feed don't get one; their existing Want to read buttons stay.

Where it goes, and what it offers:

| Where | Items |
|---|---|
| Profile shelf tabs All / Reading / Read / Stopped (yours) | **Edit**, **Delete from my books** |
| Profile Want to read tab, Books home Want to read row | **Remove from Want to read** |
| Profile Favourites tab | **Remove from favourites** |
| Books home Journal preview | **Edit**, **Delete from my books** (the journal's own menu, `JournalEntryActions variant="menu"`) |
| A list you own, Shelf view | **Remove from list** (same action as the Details view button, with its undo) |
| Book page, next to your status pill | **Edit**, **Delete from my books**, and "You logged this book N times · See them in your journal" when N > 1 |

Rules:

- **Delete keeps its confirmation.** Deleting a log also deletes its dates, rating, review and note, so it asks first, with the journal's wording (`sections.journal.confirmDelete`). Removing from Want to read, from favourites or from a list holds no writing, so it happens at once (lists keep their existing undo).
- **The words say what is lost.** "Delete from my books" for a log, "Remove from …" for a shelf, a list or favourites, so a reader can tell "out of this list" from "gone from my journal".
- **Edit opens the existing edit dialog** (`EditEntryDialog`). It takes a `JournalEntryDto`; on a profile tab or the book page the menu has a `LogDto`, so the dialog is loaded with `getLog(id)` the way `LogReviewCard` does, or given an adapter. Pick the smaller change when building.
- **After a change**, the same caches are refreshed as the journal's delete (`logs.byUser`, journal, book page), so the book leaves every shelf at once.
- **Book page with several logs:** the menu acts on the newest (the one `MyStatus` shows). The "N times" line links to `/journal`. If the journal can't filter by book yet, the link goes to the journal unfiltered; a book filter is out of scope.
- The menu button's label names the book ("More for *Dune*"), like the journal's `actionsLabel`. It works with the keyboard (Enter opens, Escape closes), as `OverflowMenu` already does.

### 2.2 "You already have this book"

When the reader opens `LogForm` for a book **they already have a log of** with status Read, Currently reading or Stopped, the form shows a short notice at the top, before any field:

> **This book is already in your journal** (Read, 3 Oct 2026).
> [ It's a re-read ] [ Edit the one I have ] [ Cancel ]

- **It's a re-read** closes the notice and ticks "Re-read" in the form (`isReread = true`). The reader carries on as now.
- **Edit the one I have** closes the form and opens the edit dialog for the newest existing log.
- **Cancel** closes the form.
- Want to read logs don't count: moving a book from Want to read to Read is the normal path, not a duplicate.
- The data is already on the page (`useMyLogs` on the book page; `ProfileAddBook` gets `logs`), so no new request is made.
- Where it applies: the book page's "Log this / Log again", and `ProfileAddBook` when it creates a new log rather than moving one. The quick buttons (`BookQuickLog`'s "Finished!") already finish the current log and don't need it. Imports keep their own duplicate handling.
- If the existing log is **Currently reading** and the reader is logging Read, the notice says so ("You're reading this one now") and the first button is **Mark it finished** (updates that log, as `BookQuickLog` does) instead of "It's a re-read". The developer should check what `LogService` does today when a Read log is created while a reading one exists, and note it here.

### 2.3 An author's books in one language

A **Language** select next to the sort on the author page's "All books" section:

- Options: **All languages** (default; it's a bibliography), then the reader's interface language, then English, then the rest of `SEARCH_LANGUAGES`. One language at a time.
- Kept in the address (`?lang=spa`), next to `sort` and the coverless toggle, so the view can be shared and survives a reload. Changing it starts again from page 1.
- **The count follows the filter** ("12 books in Spanish").
- **Titles follow the chosen language** when it is one of the site's five (eng, spa, por, ger, fre → en, es, pt-BR, de, fr): a reader with a Spanish interface who picks English sees English titles. For other languages, Open Library's own title shows. With "All languages", nothing changes from today (interface language).
- **Empty result:** "No books by *Borges* in Italian on Open Library." plus a **Show all languages** button. Open Library's language data is incomplete (many editions have no language), so the wording names Open Library and doesn't claim the books don't exist.
- It works with every sort and with the coverless toggle.

Backend:

- `GET /api/authors/{id}/works?language=spa`: one three-letter code, checked with the same pattern as book search (`LanguageCodePattern`, one code only here; a bad value is 400 with a new error code `authors.badLanguage`).
- `OpenLibraryClient.GetAuthorWorksAsync` takes an optional language and adds `AND language:spa` to the query. The code is validated before it gets there, so nothing typed reaches Open Library.
- `AuthorService.GetWorksAsync`'s cache key gets the language. `AuthorReleaseCheckService` passes none.
- Title language: the controller passes the chosen language (mapped to the site's code) to the title lookup instead of `ViewerLanguage` when one is chosen and supported.

## 3. Not done

- A "⋯" with "Add to my journal" on other readers' shelves, search results and the Feed. The Want to read buttons cover the common case; revisit after the `/ux-review` passes.
- Deleting several books at once.
- Filtering the journal by book.
- Several languages at once on the author page ("My languages", as search has).
- Making the author page's sort easier to find: a `/ux-review` of the author page decides that.

## 4. Tasks

Each phase in its own session. Opus at medium effort for all three; Phase 3 touches user input that reaches the server and an external call, so `argos-security` reviews it.

### Phase 1 — "⋯" menu (frontend only)

#### Frontend
- [x] `BookActionsMenu` on `OverflowMenu`: the item sets of §2.1, the delete confirmation, the cache refreshes, a label naming the book
- [x] Profile shelf tabs (yours only), Favourites tab, Books home Want to read row
- [x] Shelf view of a list you own: Remove from list, with the Details view's undo
- [x] Book page: the menu next to `MyStatus`, the "N times" line
- [x] Edit from a `LogDto` (load with `getLog` or adapt) into `EditEntryDialog` (the dialog is now `EditLogDialog` in `BookActionsMenu.tsx`, taking any `{id, bookTitle, bookOpenLibraryId}`, loaded with `getLog`)
- [x] Keys in all five languages: menu label, "Delete from my books", "Remove from Want to read", "Remove from favourites", "You logged this book N times", the journal link
- [x] Tests: the menu shows on your own shelves only, delete asks and refreshes, list removal from the Shelf view

#### Verification
- [x] `npm test`, `npm run build`, `npm run lint`
- [x] `/browser-check`: log a book twice, delete one from the profile Read tab, from the book page and from the journal; remove from Want to read on Books home; remove from a list's Shelf view; a visitor's view of your profile has no menu; 375 px
- [ ] Screenshot critique round (`web-design`) on the profile shelf and the book page
- [x] `reviewer` (no blocking findings; minor: prop casts in `BookActionsMenu`, unused `sections.journal.actionsLabel` and `shelf.actions.loggedTimes_one` keys)

### Phase 2 — "You already have this book" (frontend only)

#### Frontend
- [ ] Check `LogService` for a Read log created while a Currently reading one exists; write what happens in §2.2
- [ ] The notice in `LogForm` with its three buttons, fed the reader's existing logs of the book (book page, `ProfileAddBook`)
- [ ] The Currently reading variant (Mark it finished)
- [ ] Keys in all five languages
- [ ] Tests: no notice for a new book or Want to read only; the notice for Read and Stopped; each button's outcome

#### Verification
- [ ] `npm test`, `npm run build`, `npm run lint`
- [ ] `/browser-check`: "Log again" on a finished book shows the notice; "It's a re-read" saves a re-read; "Edit the one I have" opens the edit dialog
- [ ] `reviewer`

### Phase 3 — Author books by language

#### Backend
- [ ] `language` on `GET /api/authors/{id}/works`: one code, `LanguageCodePattern`, 400 with `authors.badLanguage` (and its `errors.codes` translation)
- [ ] `GetAuthorWorksAsync(…, language)`: `AND language:xxx` in the query; cache key with the language; `AuthorReleaseCheckService` unchanged in effect
- [ ] Titles in the chosen language when it's one of the site's five
- [ ] Unit tests (query built with and without a language, bad codes) and an integration test for the 400

#### Frontend
- [ ] Language select in "All books", `?lang=` in the address, query key with the language, back to page 1 on change
- [ ] Count text with the language; the empty state with "Show all languages"
- [ ] Keys in all five languages (labels reuse search's language names if they exist)
- [ ] Tests: `AuthorPage.test.tsx` for the select, the address, the empty state

#### Verification
- [ ] `dotnet test test/Argos.Tests -c Release`, `npm test`, `npm run build`, `npm run lint`
- [ ] `/browser-check` against real Open Library: Borges in Spanish and English, Tolkien in Spanish, an author with nothing in Italian, with each sort and the coverless toggle; Spanish interface picking English titles
- [ ] `reviewer` and `argos-security` (new query value reaching the server and Open Library)
- [ ] API restart note for the user
