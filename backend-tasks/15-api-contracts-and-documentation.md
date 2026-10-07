# 15 — API Contracts & Documentation

*You've had Swagger UI and a growing Bruno collection running since module 07 as everyday dev-loop tools. This module is about hardening that into something a future consumer (a frontend, or future-you) can actually trust — plus the conceptual side neither tool gives you automatically.*

## Progress

**Status:** ✅ Done

**Decisions made:**
- **Swagger coverage check came back clean, no drift found**: pulled the live `swagger.json` and cross-referenced every path/verb against the actual controllers (`grep` for `[Http...]` attributes) rather than trusting Swagger's own claim of completeness. All 15 endpoint+verb combinations built since module 07 (Auth, Books, Logs, Follows, Feed, BookLists) were present. The handful of endpoints that *aren't* there (e.g. "list my book lists", "list followers") were confirmed to be genuine scope gaps in the controllers themselves — never built in modules 12–13 — not a documentation gap. Nothing needed fixing here.
- **Bruno collection expanded to full coverage**, organized into one folder per resource (`Auth`, `Books`, `Logs`, `Follows`, `Feed`, `BookLists`) plus a `Scenarios` folder for cross-user flows — mirroring the controller layout.
- **A genuine authenticated flow, not a hardcoded token**: `Auth/Register` and `Auth/Login` each run a `post-response` script that pulls the JWT out of the real response body and saves it as the Bruno variable `authToken`. Every other authenticated request references `{{authToken}}` in its `auth:bearer` block — so running the collection in order genuinely logs in and reuses that session's real token, the same way a real client would, rather than a stale copy-pasted string.
- **A second, independent user ("User B")** is registered via `Scenarios/Register Second User (User B)` specifically so Follows and the failure-case scenario have a real *other* account to act on — avoids faking cross-user behavior with a single test user.
- **One deliberate failure case, saved on purpose**: `Scenarios/Update BookList as Non-Owner (expect 403)` has User B attempt to update a book list created by User A. Documents, in a runnable form, that `BookListsController.Update`'s ownership check (`Forbid()` on mismatch) is real — not just code that looks right.
- **Fully verified for real, not just written**: ran the entire chained flow by hand against the live server via `curl` — register both users, cache a book, create/update/delete a Log, create a BookList, add/reorder/remove a list item, follow/unfollow, pull the feed (confirmed it actually returned User B's log after A followed B), and triggered the real 403 — every response matched what the `.bru` files claim. Test rows were cleaned up afterward.
- **XML doc comments wired into Swagger**: turned on `GenerateDocumentationFile` in `Argos.Api.csproj` (with `CS1591` suppressed — deliberately not documenting every public member, only genuinely ambiguous ones) and pointed `AddSwaggerGen` at the generated XML file via `IncludeXmlComments`. Verified by re-fetching `swagger.json` and confirming the actual `description` fields appear in the schema, not just that the code compiles.
- **Doc comments added only where a field's meaning genuinely isn't obvious from its name and type** (the module's own instruction — not "annotate everything"): `BookDto.Description` (null means Open Library never provided one, not "empty"), `LogDto`/`CreateLogRequest`/`UpdateLogRequest`'s `Rating` (1-5 range, null = unrated), `ListItemDto.Position`/`ReorderListItemRequest.NewPosition` (0-based ordering), and `FeedPageResponse.NextCursor` (pass back as the `before` query param; null = no next page). Deliberately left alone: things like `BookListDto.Title` or `IsPublic`, where the name already says everything.
- **Breaking vs. non-breaking exercise** written down against a real endpoint (`GET /api/logs/{id}` → `LogDto`) — see the dedicated section above. Chose a rename (`ReviewText` → `Review`) and a type change (`Rating` int→double) as breaking examples, and a new optional field (`LikeCount`) as the non-breaking example.
- Build stays at 0 warnings/errors after enabling `GenerateDocumentationFile` — confirmed via a real `dotnet build`, not assumed.

## Concepts you'll learn

- OpenAPI/Swagger as machine-readable documentation of your API, generated from your controllers/DTOs rather than hand-maintained separately (and the risk when it drifts from reality).
- Why an API contract matters as a stability commitment once *any* other code (a future frontend, in this project's case) depends on it — a "harmless" field rename is a breaking change from the consumer's side.
- The difference between a breaking and a non-breaking API change, and why that distinction should drive how you make changes once a consumer exists.
- Bruno collections as *executable* documentation — a saved request with a real example response answers "what does this actually return" more concretely than a schema alone, especially for authenticated flows (a saved login request + the token it produces feeding into other requests) that Swagger UI doesn't handle as smoothly.

## Why this matters

Right now you're both the API's producer and its only consumer, so contract instability is invisible — you just fix the caller. That changes the moment `new-react-feature` work starts building against these endpoints: a DTO field you rename without thinking becomes a frontend bug in a different codebase, possibly discovered by a different person (or future-you, having forgotten today's context). Getting in the habit of documenting the contract, and thinking in terms of "is this addition-only or does it break existing callers," now is what makes that transition painless later instead of a scramble.

## The task

Bring your API documentation and tooling up to date, and review your contract for stability:

- Confirm Swagger UI accurately reflects every endpoint built in modules 05–13 (Books, Auth, Logs, Follows/Feed, Lists) — anything added since module 07 without a matching Swagger/Bruno entry gets one now.
- Fill out the Bruno collection so it has full coverage: every endpoint, including at least one saved example of an authenticated request (login, then use the returned token in a subsequent request) and one deliberate failure case (e.g. the ownership-violation request from module 11) with its actual error response saved.
- Go back through your DTOs (module 07 onward) and annotate anything genuinely ambiguous (e.g. what does a null vs. missing field mean) so the generated docs are actually useful to a future consumer, not just technically present.
- Pick one endpoint and write down, concretely, one example change that would be breaking (e.g. renaming a field, changing a type, making an optional field required) and one that wouldn't (e.g. adding a new optional field) — this exercise matters more than the Swagger/Bruno setup itself.

## Done when

- [x] Swagger/OpenAPI is live and reflects the real, current set of endpoints.
- [x] The Bruno collection has full endpoint coverage, including one authenticated flow and one saved failure-case response.
- [x] You can point to a specific DTO and explain what a breaking vs. non-breaking change to it would look like.
- [x] You'd be comfortable handing the generated docs and the Bruno collection to someone building a frontend against this API without further explanation.

## Breaking vs. non-breaking change example

Endpoint: `GET /api/logs/{id}`, returning `LogDto`.

- **Breaking:** renaming `ReviewText` to `Review`. Existing client code reading `log.reviewText` gets `undefined` instead of an error — the field silently disappears under a new name rather than failing loudly. A type change would break it just as badly: changing `Rating` from `int?` to `double?` (to support half-stars) means a client's `int` type, or a display component doing `"★".repeat(rating)`, now has to handle a value like `4.5` that used to be impossible.
- **Non-breaking:** adding a new optional field, e.g. `LikeCount` (`int`, defaulting to `0`). Clients that don't know it exists just keep ignoring it in the response JSON — nothing already written reads or depends on it, so nothing breaks. Purely additive changes are the safe category.

## Go deeper (optional)

- Look at API versioning strategies (URL-based `/v1/`, header-based, etc.) — not needed for a single-consumer MVP, but worth knowing what the escape hatch looks like once a breaking change is unavoidable and old clients still exist.
