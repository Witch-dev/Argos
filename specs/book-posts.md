# Feature Spec — Book Posts + Composer Prompt

**Status:** ✅ Implemented (2026-09-27). **Superseded 2026-10-05** by `specs/feed-redesign.md`: the `Post` entity, `/api/posts`, the Posts tab and the composer were removed, and every post became a Writing with no title (a short note).

## 1. Problem

The user shared a screenshot of X/Twitter's compose flow (a "What's up?" prompt at the top of the feed that opens a modal: avatar, text box, Post button) and wants something like it at the top of Argos's center feed (`specs/home-dashboard-redesign.md` §3.3).

A literal copy doesn't fit Argos: the app has no free-floating, book-less text post concept, and SPEC.md's whole premise is *reading* activity, not a general microblog. Clarified with the user what "posting" should actually mean here.

## 2. Clarifying decisions made (via questions to the user)

- **A new content type, not a nicer entry point into `Log`.** The user's own words: "it could be a review, a log, or post, maybe we need to add a post option but related with books, add a selector where people can select the book, and talk about it and not necessarily a review." So this is deliberately *not* the existing shelve/rate/review flow (`Log`) — it's a lighter, book-scoped thought that doesn't require a status, a rating, or start/finish dates the way a `Log` does.
- **Book selection is mandatory.** Every post is attached to exactly one book (a required picker in the modal, unlike the screenshot's book-less composer) — this keeps the feature inside "a Letterboxd for books" rather than becoming a general-purpose microblog.
- **Minimal modal chrome.** Avatar + book picker + text box + Post/Cancel — no audience selector, image/GIF/emoji attachments, language picker, or character counter. None of those map to anything Argos has (no visibility settings, no media uploads, no i18n).

## 3. Design

### 3.1 New domain concept: `Post`

A `Post` is a free-text thought about a specific book — distinct from a `Log`. A user can write any number of posts about a book regardless of whether they've logged it at all; posting never creates, requires, or modifies a `Log`.

```
Posts(id, user_id, book_id, content, created_at)
```

- `Post.cs` (`Argos.Domain`): `Id`, `UserId`, `BookId`, `Book` (nav property, same pattern as `Log.Book`), `Content` (string, required), `CreatedAt`.
- `Content` max length: 1000 characters (generous compared to the screenshot's 300 — this is closer to a short comment/thought than a tweet; enforced both in `CreatePostRequest` validation and a column max length in the migration).
- No `Rating`, no `Status`, no dates, no `IsReread` — a `Post` is not a shelf event. Keeping `Log` and `Post` as separate tables (rather than bolting an optional "post-only" mode onto `Log`) avoids a `Log` row that's *only* meaningful for its text, with every shelving field left meaningless/null — a clean split instead of overloading one entity with two purposes.
- New migration `AddPosts` (EF Core, `Argos.Infrastructure/Migrations/`), same FK/cascade pattern `Log` uses today: `UserId` → cascade delete, `BookId` → restrict delete (matches `ArgosDbContext.OnModelCreating`'s existing `Log` configuration, §7 of SPEC.md's data model table gains a `Posts` row).

### 3.2 Feed integration: reviews and posts merge into one feed

Section 3 of the home dashboard (`specs/home-dashboard-redesign.md` §3.3, "reviews from people you follow") broadens to **"things people wrote about books"** — reviews (logs with review text) and posts, interleaved by recency in one feed, not two separate lists. Both are, from a reader's perspective, "someone I follow wrote something about a book" — splitting them into two feeds would just be visual clutter for a distinction only the backend cares about.

- New repository-level query: project `Log` rows with non-empty `ReviewText` and `Post` rows into a **shared shape**, `Argos.Domain.FeedContentItem` (`Id`, `Kind`, `UserId`, `BookId`, `BookOpenLibraryId`, `BookTitle`, `BookCoverUrl`, `Text`, `Status`, `Rating`, `CreatedAt`) — flat/scalar book fields rather than a `Book` navigation object, so the `Concat` (EF Core translates this to a single `UNION ALL`) stays simple to translate reliably. Order/paginate the combined query in the database — one SQL round trip, not an in-memory merge of two separately-paginated lists. This keeps the existing cursor-pagination shape working unchanged: order by `CreatedAt desc, Id desc`, same tie-break logic as today, just over the unioned set instead of a single table. Lives on `IPostRepository.GetFeedContentByUserIdsAsync` (not split across `ILogRepository`/`IPostRepository`) — and since this became the *only* way `FeedService` reads reviews, the old `ILogRepository.GetRecentByUserIdsAsync`/`reviewsOnly` parameter (added in `specs/home-dashboard-redesign.md`) is deleted outright rather than left as unused dead code.
- `GET /api/feed/reviews` (existing route, kept as-is — no churn for the frontend's existing query key) now returns a unified `FeedContentItemDto`:
  - Common: `Id` (the source row's own id), `Kind` (`"Review" | "Post"`), `UserId`, `Username`, `DisplayName`, `AvatarUrl`, `BookId`, `BookOpenLibraryId`, `BookTitle`, `BookCoverUrl`, `Text` (the review text or the post content — one slot), `CreatedAt`.
  - Review-only: `Status`, `Rating` (both null when `Kind == "Post"`).
- `FeedItemCard` (frontend) renders per `kind`: a review keeps today's look (actor + status pill + stars + text); a post drops the status pill and star row, just "**{actor}** posted about **{book}**" + the text.

### 3.3 Composer prompt + modal

**Prompt** (`PostComposerPrompt`, top of the center feed, above the reviews/posts list): a collapsed pill — the current user's avatar + "What's up?" placeholder text, matching the screenshot's collapsed state. Clicking it opens the modal; it does not itself take input.

**Modal** (`PostComposerModal`):
- Header: "Cancel" (closes, discarding input) — "Post" button, right-aligned, disabled until a book is selected and the text is non-empty.
- Body: current user's avatar next to a book picker (debounced search-as-you-type over the existing `searchBooks` endpoint/pattern from `SearchPage`, task 03) — once a book is chosen, it collapses to a small cover+title chip with a way to change/remove it, and a plain textarea below for the post's text (placeholder: "What do you want to say about it?").
- No audience/language/GIF/emoji controls, no character counter (per §2's chrome decision).
- On submit: `POST /api/posts`, then close the modal and invalidate the reviews-feed query so the new post appears immediately at the top (same optimistic-invalidate pattern `FollowButton` already uses).

**Found and fixed during live verification (2026-09-27):** the book picker initially used a search result's `id` straight from `searchBooks`. A result nobody had looked up before carries `id: Guid.Empty` until its detail page is opened (`specs/live-book-search.md` §3.3) — so posting about a genuinely new book always 400'd against `PostService.CreateAsync`'s book-existence check. Fixed by resolving the selected book through `GET /api/books/{openLibraryId}` (the same cache-aside endpoint `BookDetailPage` already uses) at selection time, before it's usable in the form — a live result gets cached exactly once, same as visiting its detail page would. Covered by a regression test in `PostComposerModal.test.tsx`.

### 3.4 API

- `POST /api/posts` (authenticated) — body `CreatePostRequest { BookId, Content }` → `PostDto` (201).
  - Validation: `Content` required, ≤1000 chars; `BookId` must reference an existing cached book (same "book must already be cached to reference it" assumption `Log` creation makes today — no special new-book handling here).
- `PostsController`, `PostService`, `IPostRepository`/`PostRepository` — same layered shape (`Controllers → Services → Repositories`) as every other resource (SPEC.md §5).
- `PostDto { Id, UserId, Username, DisplayName, AvatarUrl, BookId, BookOpenLibraryId, BookTitle, BookCoverUrl, Content, CreatedAt }`.

## 4. Explicitly out of scope

- Editing or deleting a post — not requested; add later if it comes up (mirrors how `Log` editing was a separate, later addition).
- Likes/comments on posts — SPEC.md §4 Phase 2 already tracks "Likes/comments on reviews" separately; posts get the same treatment (none yet) rather than jumping ahead of that phase.
- Any of the screenshot's chrome explicitly declined in §2: audience/visibility settings, image/GIF/emoji attachments, language picker, character counter.
- Posts appearing anywhere other than the merged section-3 feed (e.g., a book's own detail page reviews section) — v1 is feed-only; whether a book's page should also show its posts alongside reviews is a follow-up question, not answered here.
- A post-specific notification (e.g., "X posted about a book you follow") — no notification system exists yet (SPEC.md §4 Phase 2).

## 5. Tasks

### Backend

- [x] `Post` domain entity (`Argos.Domain/Post.cs`).
- [x] `ArgosDbContext`: `DbSet<Post>` + FK configuration (cascade on `UserId`, restrict on `BookId`, matching `Log`'s pattern).
- [x] EF Core migration `AddPosts`.
- [x] `IPostRepository`/`PostRepository`: `AddAsync`, and `GetFeedContentByUserIdsAsync` (the shared-shape union query consumed by the feed, §3.2).
- [x] `PostService.CreateAsync(userId, bookId, content)` — validates content length, book existence.
- [x] `CreatePostRequest`, `PostDto` (`Argos.Api/Dtos/`).
- [x] `PostsController`: `POST /api/posts`.
- [x] `FeedContentItemDto` (replaces `FeedItemDto` as the `/api/feed/reviews` response shape) with the `Kind` discriminator per §3.2; `FeedService.GetReviewsAsync` updated to pull from `IPostRepository.GetFeedContentByUserIdsAsync` (the old `ILogRepository.GetRecentByUserIdsAsync`/`reviewsOnly` method was deleted, not just superseded).
- [x] Backend tests: creating a post (success + validation failures, `PostServiceTests`/`PostsControllerTests`), the merged feed query (reviews and posts both appear, correctly ordered/paginated together, tie-breaking still holds — `FeedServiceTests`/`FeedControllerTests`), `FeedContentItemDto` shape for each `Kind`. Full suite: 60/60 passing.

### Frontend

- [x] `PostDto`, `FeedContentItemDto` (replacing `FeedItemDto` for the feed response) in `api/types.ts`.
- [x] `api/posts.ts`: `createPost({ bookId, content })`.
- [x] `api/feed.ts`: `getReviews()` return type updated to `FeedContentItemDto[]`.
- [x] `PostComposerPrompt` component — collapsed pill, top of the center feed.
- [x] `PostComposerModal` component — book picker (reusing the `useDebouncedValue` hook `SearchPage` also uses) + textarea + Post/Cancel, per §3.3. Includes the live-result resolution fix noted above.
- [x] `FeedItemCard` updated to branch on `kind` (`Review` vs `Post`) per §3.2.
- [x] `FeedPage.tsx`: mount `PostComposerPrompt` above the reviews/posts list; invalidate `queryKeys.feed.reviews()` on a successful post.
- [x] Tests: `FeedPage.test.tsx` updated for the new empty-state copy and composer prompt; new `PostComposerModal.test.tsx` (Post button gating, successful submit calls `createPost` with the right args, Cancel discards without posting, and a regression test for the live-result resolution fix above). Full suite: 24/24 passing.

### Verification & docs

- [x] Live verification: registered two accounts, followed one from the other, posted about a book (no prior Log, and — after the fix above — never previously searched by anyone) as the followee — confirmed it appears in the follower's feed, correctly interleaved above an older review from the same user, with no status pill/star rating on the post entry. No console errors.
- [x] `CHANGELOG.md` entry.
- [x] `SPEC.md`: §3 domain model table gains `Post`, §7 data model gains the `Posts` table (plus a note on the merged-feed `UNION ALL` query), §4 Phase 1 gains a "Posts" bullet and the Activity feed bullet notes the merge, §5 architecture gains a bullet on the merged-feed query approach.
