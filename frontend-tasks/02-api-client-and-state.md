# 02 — API Client & Server-State Setup

**Status:** ✅ Done

## Scope

- Typed `fetch` wrapper (`src/api/client.ts`) that: prefixes `VITE_API_BASE_URL`, attaches `Authorization: Bearer <token>` when a token is present, parses JSON, and normalizes error responses (backend's `GlobalExceptionHandler` shape) into a typed `ApiError`.
- TanStack Query 5 `QueryClientProvider` wired at the app root, sane defaults (retry policy, `staleTime` for mostly-static data like book detail).
- Shared TypeScript types mirroring the backend DTOs (`src/api/types.ts`), kept in sync by hand for now — no codegen:
  - `BookDto`, `AuthResponse`, `CurrentUserResponse`
  - `LogDto`, `CreateLogRequest`, `UpdateLogRequest`
  - `BookListDto`, `ListItemDto`, `CreateBookListRequest`, `UpdateBookListRequest`, `AddListItemRequest`, `ReorderListItemRequest`
  - `FeedItemDto`, `FeedPageResponse`
  - `FollowRequest`
- One `src/api/<resource>.ts` module per backend controller (`auth.ts`, `books.ts`, `logs.ts`, `bookLists.ts`, `follows.ts`, `feed.ts`), each a thin set of functions calling the client — this is the one-to-one mapping every later task's hooks build on.
- Query key conventions documented in a short comment at the top of `src/api/queryKeys.ts` (e.g. `['books', 'search', query]`, `['logs', id]`) so cache invalidation stays consistent across features.

## Depends on

Task 01 (project scaffold).

## Notes

Confirmed real backend routes/shapes as of this task's writing (`Argos.Api/Controllers`, `Argos.Api/Dtos`):

| Resource | Routes |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` → `AuthResponse { token }`; `GET /api/auth/me` (auth) → `CurrentUserResponse` |
| Books | `GET /api/books?query=` → `BookDto[]`; `GET /api/books/{openLibraryId}` → `BookDto` |
| Logs | `POST /api/logs` (auth), `GET /api/logs/{id}`, `PUT /api/logs/{id}` (auth, owner), `DELETE /api/logs/{id}` (auth, owner) |
| Book Lists | `POST /api/booklists` (auth), `GET /api/booklists/{id}`, `PUT /api/booklists/{id}` (auth, owner), `DELETE /api/booklists/{id}` (auth, owner), `POST /api/booklists/{id}/items`, `DELETE /api/booklists/{id}/items/{itemId}`, `PUT /api/booklists/{id}/items/{itemId}/position` |
| Follows | `POST /api/follows` (auth), `DELETE /api/follows/{followeeId}` (auth) |
| Feed | `GET /api/feed?before=&beforeId=&pageSize=` (auth) → `FeedPageResponse` |

**Known gaps** (endpoints the frontend will need that don't exist yet on the backend — flagged here so they're not a surprise later, addressed in the task that first needs them):
- No "list logs for a user" endpoint (needed for profile shelves/history — task 06).
- No "list book lists for a user" / "my lists" endpoint (needed for tasks 06 and 08).
- No user-by-username / user-search endpoint (needed for profile pages and social features — tasks 06, 07).
- No followers/following list endpoints, only follow/unfollow (task 07).
- `FeedItemDto` carries `UserId` but no username/display name/avatar for the actor — the feed can't render "who" without a lookup (task 07).

When a task hits one of these, the fix is a small backend addition first (new DTO + repository method + service method + controller action, same pattern as the existing endpoints — use the `backend-dev` agent for it), then the frontend piece on top.

## Progress

**Done.** `src/api/client.ts` (typed `fetch` wrapper + `ApiError`), `src/api/authToken.ts` (localStorage token get/set/clear, shared with task 04's `AuthContext`), `src/api/types.ts` (hand-mirrored DTOs), `src/api/queryKeys.ts`, and one module per controller (`auth.ts`, `books.ts`, `logs.ts`, `bookLists.ts`, `follows.ts`, `feed.ts`). `QueryClientProvider` wired in `main.tsx` (`staleTime: 60s`, `retry: 1`).

Notes:
- Confirmed ASP.NET Core's default JSON casing is camelCase (`AddControllers()` uses the framework default, nothing overriding `PropertyNamingPolicy`), and `LogStatus` serializes as a string (`JsonStringEnumConverter` registered in `Program.cs`) — `types.ts` reflects both.
- `client.ts` normalizes three different backend error shapes into one message: `ProblemDetails` (unhandled exceptions, via `GlobalExceptionHandler`), ASP.NET's auto-generated `{ errors: {...} }` validation response (model-binding failures on `[Required]` fields), and the bare-string body several controllers return from `BadRequest(result.ErrorMessage)`.
- On a 401, the client clears the stored token and fires a `window` `CustomEvent` (`UNAUTHORIZED_EVENT`) rather than importing React Router — keeps this module framework-agnostic; task 04's `AuthContext` listens for it and redirects.
- Verified: `npm run build` and `npm run lint` clean.
- **Verified against the live API** via curl (not yet through the actual React UI at that point, but same client/type contract): register, login, `GET /api/auth/me` with the returned bearer token, and `GET /api/books?query=` all round-tripped correctly with the exact field casing `types.ts` assumes (`id`, `username`, `displayName`, etc.).
