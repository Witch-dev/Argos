# 08 — Lists

**Status:** ✅ Done

## Scope

- `/lists` — the current user's lists, create-new affordance. `POST /api/booklists`, backed by the "list book lists for a user" endpoint flagged in task 06.
- `/lists/:id` — list detail: title, description, public/private toggle (owner only), ordered items with covers and notes.
- Add book to list (from book detail page, task 03, and from the list detail page itself) — `POST /api/booklists/{id}/items`.
- Remove item — `DELETE /api/booklists/{id}/items/{itemId}`.
- Reorder items — drag-and-drop (or up/down buttons if drag-and-drop scope creeps too much for a first pass) calling `PUT /api/booklists/{id}/items/{itemId}/position`.
- Public list pages viewable by anyone via `/lists/:id` when `isPublic` is true; private lists 404 for non-owners — already enforced server-side (`BookListService.GetByIdAsync` returns `NotFound` for a private list when the requester isn't the owner), frontend just needs to render whatever 404 comes back cleanly.
- Edit/delete list (owner only) — `PUT` / `DELETE /api/booklists/{id}`.

## Depends on

Task 02, task 04 (auth), task 06 (the "list book lists for a user" backend endpoint, shared prerequisite).

## Progress

**Done.** `ListForm` (create and edit mode via an optional `list` prop, same pattern as task 05's `LogForm`) replaces what would've been a separate `CreateListForm`. `ListsPage` (protected route, `/lists`) shows the current user's lists via `getBookListsByUser` (built in task 06) with a create-list toggle. `ListDetailPage` (`/lists/:id`, public) shows title/description/visibility badge, items in position order with cover/title/note (linking via the `bookOpenLibraryId` fix from task 06), and — owner-only — edit/delete on the list itself, up/down reorder buttons and a remove button per item (drag-and-drop was in scope as an option; picked plain buttons instead to avoid pulling in a DnD library for a first pass, per the task's own fallback note), and `AddBookSearch` (debounced book search + an "Add" button per result, reusing `searchBooks` from task 03).

Also added `AddToListButton` on the book detail page (task 03/05) — a dropdown of the current user's lists + "Add", satisfying the "add from the book detail page" half of this task's scope; it only renders when the user has at least one list.

Private-list 404 behavior was already correct server-side (confirmed in task 06/this task's Known-gaps note) — nothing to fix there, just render whatever comes back.

Verified live via curl: created a list, added an item, confirmed `GET /api/booklists/{id}` and `GET /api/booklists?userId=` both return the item with the correct `bookOpenLibraryId`/`bookTitle`/`bookCoverUrl`/`position`. `npm run build` + `npm run lint` clean. Not yet visually confirmed in an actual browser (no browser tool this session) — reorder and remove specifically are worth a manual click-through since their correctness depends on the position math lining up with what the eye expects.
