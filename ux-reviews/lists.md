# UX review — Lists (`/lists`, `/lists/browse`, `/lists/:id`)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; the rest on contact sheets) · Widths: 375, 1280 · Reader: logged in, owner of two public lists (one of six books, all read, with tags and a note; one ranked and empty) · Apollon at `be32e1c`
Screenshots looked at: Your lists, Browse lists, and the six-book list (Details view) at the top and 700 and 1,400px down, 1280 and 375. Tab walk on the list at 1280 Paper. Not captured: someone else's list, the Shelf view, collaborators and challenge panels open (checked when built, Phase 3).
Code read: `ListsPage.tsx`, `BrowseListsPage.tsx`, `ListDetailPage.tsx`, `ListCard.tsx`.

First review of these pages with the new rubric; restyled in Phase 3 of the shelf refresh.

## Summary

ListCard with its small shelf and named owner is a real Winged Words piece, and Browse reads well. The list page is weakest for its owner: the one green button is "Take the challenge" (on a list they've read in full), while "Add a book" sits below every book, and the × that removes a book acts at once, right beside the move arrows.

## Scores

**Nielsen: 26/40 (acceptable).**
- **3 User control: 2.** Removing a book has no confirm and no undo (finding 1).
- **5 Error prevention: 2.** The same ×, 36px, next to Move down.
- **7 Flexibility: 2.** Adding to a long list means scrolling past every book (finding 2).
- **10 Help: 2.**
- Scored 3: the rest.

**Cognitive load: moderate** (2 failed: *single focus*, the owner's main task isn't the green one; *minimal choices*, five actions in a row at 1280 plus a "…" menu).

**Personas:** Clara (curator, lists of 40 books): adds a book by scrolling to the bottom every time; one slip on × loses a book and its note. Tomás (visitor): "Take the challenge" as the green action makes sense for him; it's the owner who is badly served. Stress tester: an empty list's card is a blank board (finding 3).

**Specificity:** passes: the list's books on shelves, owners as named pills.

## Findings

### 1. "Remove from list" acts at once, beside the move arrows — P2 · S · Rule
**Where:** `ListDetailPage.tsx:660–668` (`removeMutation.mutate(item.id)` on click); 36×36 buttons in a row: up, down, ×.
**Why it matters:** a mis-tap removes the book and its note with no way back (the code checklist's "destructive actions are confirmed or undoable").
**Fix:** an Undo for a few seconds after removing ("Piranesi removed. Undo", `role="status"`), which keeps removing quick; and 44px buttons with `--space-2` between them on touch screens.
**Status:** fixed 2026-10-18: after removing, "Removed X from the list." with Undo for 10 seconds (re-adds the book with its note in its old place, or at the end; only on the list it came from); move and remove 44px on touch screens.

### 2. The owner's green button is "Take the challenge"; "Add a book" is at the bottom — P2 · M · Judgement
**Where:** `ListDetailPage.tsx` action row and the "Add a book" well after the last item; "your six-book list at 1280": green "Take the challenge" while "You've read all 6, 100%" sits right under it.
**Why it matters:** DESIGN's one green button should be the view's main action; for the owner that's adding books, and on a list they've finished the challenge is meaningless.
**Fix:** on your own list (or as a collaborator), "Add a book" is the green action in the row and opens the add-book well right under the header (or scrolls to it and focuses the field); "Take the challenge" becomes secondary, and is hidden when you've read every book.
**Status:** fixed 2026-10-18: for whoever can add books, a green "Add a book" leads the row and jumps to the search, focused; "Take the challenge" is secondary then, and hidden once you have read every book.

### 3. An empty list's card is a blank board — P3 · S · Judgement
**Where:** `ListCard.tsx`; "Your lists at 1280": "Science fiction I keep recommending" shows 90px of nothing above an empty shelf bar.
**Fix:** on an empty list, a short line in the board's place ("No books yet") on your own list linking to the list, or two cloth-bound placeholder books so it still looks like a shelf.
**Status:** fixed 2026-10-18: an empty list's card says "No books in this list yet." on its board.

### 4. Small controls on a list's rows — P3 · S · Rule
**Where:** Tab walk: "More actions for this list" 39×35; Move up/down and Remove 36×36; "Hide books I've read" a native 13px checkbox.
**Fix:** 44px on touch screens (`@media (pointer: coarse)`), as the rest of the site; the hide-read filter as the shared `Switch` or a filter pill with `aria-pressed`.
**Status:** fixed 2026-10-18: move/remove 44px on touch screens; the "…" menu button 44px everywhere; the hide-read checkbox drawn at 20px in the accent (the whole label stays the 44px target).

### 5. Browse's third section is off-screen on a phone — P3 · S · Judgement
**Where:** `BrowseListsPage.tsx` section pills; "375": "Popular this week", "Recently updated", "Fo…" cut at the edge; tags the same.
**Fix:** let the three section pills wrap (they're the page's main choice), keep the tags as a scrolling row; or make sections the shared segmented control (shared #2).
**Status:** fixed 2026-10-18: sections are the segmented control, sharing the width on a phone (all three show).

### Shared
Shelf | Details and Browse's section pills: `shell-and-shared-pieces.md` #2.

## Looked fine

ListCard (covers on a small shelf, owner pill, count, tags, "You've read all of them"); one green action on Your lists and Browse ("Create a list"); the challenge bar; Details rows with ThumbCover, author link, "You've read this" and the note in the reading face; the comment form with a visible label; delete and leave confirmed; all five themes.
