# Add books from your profile

Status: built 2026-10-14 (frontend only). Mockup agreed with the user.

## Goal

On your own profile, every shelf tab lets you add a book without leaving the page. Before this, a book could only be added from its own page, and an empty tab said "Nothing here yet."

## Behaviour

- Your own profile only. Never shown on other readers' profiles, or on the Journal tab.
- **Empty tab:** a panel with a prompt written for that shelf and a search box (`profile.addBook.empty.*`). It replaces "Nothing here yet."
- **Tab with books:** a "+ Add a book" button above the grid opens the same panel.
- **Result row:** cover, title, author and year, one button worded per tab (Add to want to read / Start reading / Mark as read / Mark as stopped / Add as favourite). A book already on that shelf shows "✓ Already on this shelf".
- **All tab:** each result has Want / Reading / Read buttons.
- **Favourites:** a heart needs a Read log, so a book that is not read yet is logged as Read first, then hearted.
- **After adding:** a confirmation with "Undo" (deletes the log it made, un-hearts a favourite) and, for Read / Did not finish, "Add rating or details", which opens the log form inline.
- Search uses the same debounced `/books` search as the list and progress pickers. A live result with an empty id is fetched first, so it gets a real id.

## Frontend

- [x] `components/ProfileAddBook.tsx` + `.module.css`
- [x] Wired into `ProfilePage` for `isSelf`, replacing the plain empty messages
- [x] `profile.addBook.*` strings in en, es, pt-BR, de, fr
- [x] `ProfileAddBook.test.tsx` (files under the tab, favourite logs as read first, button reveals search)

## Verification

- [x] `tsc -b`, lint, build, Vitest (locales + pages + new test)
- [ ] Browser check as a reader: add to each tab, undo, add rating after Read, favourite an unread book, check another reader's profile has no add box (`browser-check` skill)
