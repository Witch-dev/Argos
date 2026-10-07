# 03 — Book Search & Detail Pages

**Status:** ✅ Done

## Scope

- `/search` — search box + results grid (cover, title, authors, first publish year), calls `GET /api/books?query=`, debounced input, empty/loading/error states, graceful placeholder for missing covers (per SPEC.md §8: Open Library data is sometimes incomplete).
- `/books/:openLibraryId` — detail page: cover, title, authors, description ("description unavailable" fallback), subjects, first publish year. Calls `GET /api/books/{openLibraryId}`.
- Reviews-on-book-page (SPEC.md §4: "View others' reviews on a book's page") is deferred to task 05 once Logs exist — this task lays out the section as an empty/placeholder slot.
- Public pages — no auth required, but the layout should still show a "log this book" call-to-action that routes through login if the viewer isn't authenticated (wired for real once task 04 exists).

## Depends on

Task 02 (API client, `books.ts`, React Query setup).

## Progress

**Done.** `SearchPage` (debounced, URL-synced search box — `?q=` is the source of truth, typing debounces into it via `useDebouncedValue`, external URL changes e.g. from the nav bar just remount the (uncontrolled) input via `key={urlQuery}` rather than a syncing effect, to sidestep the `react-hooks/set-state-in-effect` lint rule) and `BookDetailPage`, both backed by TanStack Query against `books.ts`. Shared `BookCover` (placeholder box with the title as alt-text-equivalent when `coverUrl` is null, per SPEC.md §8's graceful-degradation constraint) and `BookCard` components, reused as-is by later tasks (profile shelves, list items).

The "Log this book" CTA on the detail page currently links to `/login` as a placeholder — task 04 needs to exist before it can do anything real (redirect-to-book-after-login), and task 05 before there's a log form to land on.

Verified: `npm run build` + `npm run lint` clean, and `GET /api/books?query=` confirmed live (returns `[]` for an uncached query — correct empty-state shape). **Not yet visually confirmed in an actual browser** — this session has no browser/screenshot tool, so the curl-level check confirms the data contract but not that the pages render/look right. Worth a quick manual click-through (search a real query, open a result, check the placeholder cover and empty states) when you're at the machine.
