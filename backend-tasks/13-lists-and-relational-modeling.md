# 13 — Lists & Relational Modeling

## Progress

**Status:** ✅ Done

**Decisions made:**
- **Entity named `BookList`, not `List`** — `List` would collide (visually, if not technically, given generic arity) with `System.Collections.Generic.List<T>`, used constantly throughout the codebase. Kept "Lists" as the feature/API name per `SPEC.md`, renamed only the C# class.
- **Ordering**: a plain integer `Position` column, chosen deliberately over fractional/gap-based indexing — reordering shifts only the items strictly between the old and new position, in one `SaveChangesAsync()` (change tracking doing the batching, same payoff as module 11). Fractional indexing (the Figma/Linear-style approach that avoids renumbering entirely) is the noted upgrade path, not built now.
- **Cascade decisions, applying the established "replaceable vs. irreplaceable" policy consistently**: `BookList`→`ApplicationUser` cascades (delete your account, your lists go with it — same as `Log`). `ListItem`→`BookList` cascades (an item with no list is meaningless). `ListItem`→`Book` is **Restrict**, same reasoning as `Log`→`Book` in module 11 — the app-wide policy is now "you can't delete a `Book` while anything (a review or a list entry) still references it," not a different rule per feature.
- **A new authorization pattern**: `GetById` has no `[Authorize]` at all — `ClaimsPrincipalExtensions.TryGetUserId()` (new; returns `Guid?`, doesn't throw when there's no claim) reads the caller's identity *if present*, without requiring one. This is "authentication as optional/informational" rather than "mandatory," a genuinely different case from every other protected endpoint so far.
- **Private lists return `404`, not `403`, for anyone but the owner** — same reasoning as `AuthController`'s identical login-failure message: `403` would confirm "this ID definitely belongs to someone's private list," just not you; `404` makes it indistinguishable from an ID that doesn't exist, which is the actual privacy guarantee the module asks for.
- **A real bug caught before it ever ran**: in `AddItemAsync`, the newly created `ListItem` wasn't given its `Book` navigation property, which would have thrown a null reference when the controller tried to read `item.Book.Title` for the response. Fixed by reusing the `Book` object already fetched during the existence check, rather than a redundant second query.
- **A second JSON-options mistake caught proactively, not rediscovered**: while writing `BookListsControllerTests`, noticed a `GetFromJsonAsync<CurrentUserResponse>` call was missing the case-insensitive options already established as necessary in modules 11–12 — fixed it before ever running the test, rather than needing to debug the same class of failure a third time.
- **Fully verified for real**: created a private list; anonymous and non-owner `GetById` both `404`, owner's `200`; added 3 items, confirmed positions `0,1,2` with correct book data; reordered item 3 (position 2) to position 0, confirmed items 1–2 shifted to `1,2` in one call; all four write operations (update/add-item/remove-item/delete) confirmed `403` for a non-owner; flipped the list public, confirmed anonymous access now succeeds; deleted the list, confirmed via direct Postgres query that both the `BookList` row and its `ListItem`s were gone (cascade working).
- Added `FakeBookListRepository`/`FakeListItemRepository`, `BookListServiceTests` (6 cases, including the private-404 and reorder-shift logic), and an integration test for the private-list visibility case. All 23 tests (was 16) pass.

## Concepts you'll learn

- Modeling an *ordered* collection in a relational database — a `List` isn't just "which books," it's "which books, in what order," and that's a genuinely different modeling problem than a plain many-to-many.
- Trade-offs between an integer `position` column (simple, but reordering means renumbering neighbors), a linked-list-style "next item" reference (no renumbering, more complex queries), and fractional/gap-based indexing (renumber rarely, some long-run drift).
- Cascade delete behavior and referential integrity: what should happen to `ListItems` when a `List` is deleted, or to a `List` when a `User` is deleted — and making that an explicit decision instead of whatever EF Core's default happens to do.
- Public/private visibility as a query concern, not just a UI concern — this is a direct continuation of the ownership-vs-authentication theme from module 10.

## Why this matters

This feature looks like "just another CRUD resource" on the surface, but ordering is a classic case where the naive first implementation (an integer `position`, renumbered on every insert/reorder) works fine at small scale and gets expensive or buggy at larger scale or under concurrent edits. You don't need to solve that fully for an MVP, but you should *choose* your approach knowingly rather than back into it. This module also revisits authorization from a new angle: a private list must be unreachable by ID for anyone but its owner, not just hidden from a list view — that's the same class of bug SPEC.md's `security-review` agent is specifically watching for.

## The task

Implement `Lists`/`ListItems` per SPEC.md §7/§9 Phase 5:

- Design the ordering approach for `ListItems` and be ready to explain the trade-off of what you picked over the alternatives above.
- Build create/read/update/delete for lists and their items, including reordering, with ownership checks on every mutation.
- Decide and implement cascade behavior explicitly: deleting a `List` should have a clear, intentional effect on its `ListItems`.
- Enforce the public/private visibility rule at the query/authorization level — write the test case yourself for "can a non-owner fetch a private list by guessing its ID" and confirm it's rejected.
- By now, treat modules 08–09's habits as the default, not a checklist item: structured logging on rejected/failed writes and tests for both the reordering logic and the private-list access-denial case should just be part of what "done" means for this feature.

## Done when

- [ ] Lists and list items support create/read/update/delete, including reordering.
- [ ] You can explain your ordering approach's trade-off against the two alternatives described above.
- [ ] Cascade delete behavior is explicit and tested, not left to default behavior you haven't checked.
- [ ] Private list access is verified to be blocked for non-owners by direct ID access, not just absent from a listing endpoint.

## Go deeper (optional)

- Research fractional indexing (used by tools like Figma/Linear for ordered lists) as the production-grade answer to "reordering shouldn't require renumbering everything."
- Read about EF Core's `OnDelete` configuration (`Cascade`, `Restrict`, `SetNull`) and pick deliberately rather than accepting whatever convention-based default applies to your relationship.
