# Feature Spec — Writings & Annotations (long-form pieces, whole-post comments, Genius-style highlight comments)

**Status:** ✅ Shipped 2026-09-30

## 1. Problem

The user wants to motivate people to both *write* and *read/analyze what others write*, inside Argos's existing "Letterboxd for books" feed. Two things are missing today:

- A place to post something longer and more deliberate than the existing 1000-char, book-scoped `Post` — either an original piece of writing, or a passage quoted from a book.
- Any commenting system at all on that writing, in two distinct modes people asked for by name: an Instagram-style whole-post comment thread, and a Genius-lyrics-style system where a reader highlights a specific stretch of the text and attaches a comment to exactly that span.

This is a genuinely new subsystem — Argos's first general-purpose text-commenting system (the existing `CheckpointComments` in Book Clubs are scoped to one club's checkpoint discussion, not reusable here) and its first anchored-text-annotation concept.

## 2. Clarifying decisions made (via questions to the user)

- **A new entity, `Writing`, distinct from both `Post` and `Log`.** Not a variant of the existing short book-scoped `Post` (which stays exactly as it is, untouched) — `Writing` is long-form, has its own title, and is the thing people highlight/comment on.
- **Two kinds of `Writing`: `Original` or `Quote`.** In the composer, the user picks which one:
  - `Original` — their own words. A book is *optional* — a `Writing` can stand fully alone with no book attached (a general piece, not necessarily about a specific book).
  - `Quote` — a passage from a book, not their own words. Requires a source: either pick the real cached `Book` (reuses the existing book-picker from `specs/book-posts.md` §3.3), or, if they can't find it or it's not a real catalog entry, type a free-text source name instead (e.g. an obscure/self-published work). Exactly one of `SourceBookId` / `SourceText` is set for a `Quote`, never both.
- **Long-form with a title.** A `Writing` has a required `Title` plus a body with a generous length cap (see §3.1) — this is meant to be a real piece worth reading and annotating, not a one-liner.
- **New navigational sections, built now, not deferred.** The feed reorganizes into: **Feed** (everything merged, same "reverse-chronological, interleaved" idea as today's merged reviews+posts feed), **Writings** (this feature's new content only), **Reviews** (existing `Log` review text), and the existing book-scoped **Posts** section. The user explicitly said they expect to add more sections later — this feature builds the tab/section shell generically enough that a future section is "add one more query + one more tab," not a rearchitecture.
- **Comments come in two kinds, on the same content:**
  1. **Whole-post comments** (Instagram-style) — attached to the `Writing`/`Log` as a whole, and **support nested replies** (arbitrary depth, reusing the self-referencing `parent_comment_id` pattern `CheckpointComments` already established in `specs/book-clubs.md`).
  2. **Highlight-comments** (Genius-style) — attached to a specific character range within the body text. Presented in a **Genius-style split view**: the full text rendered large with highlightable spans on one side/above, whole-post comments in their own list below/beside it — visually distinct sections, not interleaved.
- **Overlapping highlights merge.** If two or more people highlight the same or overlapping stretch of text, it renders as **one merged highlighted region**; clicking/tapping it shows every comment attached to that region (sorted by vote score, see below). No per-user stacked marks.
- **Highlight-comments do not nest** — each is a flat comment on its region (unlike whole-post comments, which do nest). This keeps the "which reply is attached to which sub-span" ambiguity from ever coming up; a reader who wants to discuss an annotation replies to *it* by adding their own highlight-comment on the same or overlapping span, which the merge behavior above already handles.
- **Both comment kinds get upvote/downvote**, not just a like. New `CommentVoteRecord` table (same shape as the existing `CommentVote` used for `CheckpointComments` — renamed to avoid colliding with that existing class, see §3.3), one vote per user per comment, value `+1`/`-1`, score is server-computed sum.
- **Voting affects order and visibility**: within any list (a reply thread, or the comments on one highlighted region), items sort by score descending (ties broken by recency). A comment whose score drops to **-5 or below collapses by default** (a "1 comment hidden — score -6, click to show" affordance) but is never actually removed or blocked from being expanded. `-5` is a starting threshold, easy to tune later; called out explicitly since the user didn't pin an exact number.
- **Notifications are explicitly out of scope for this spec.** The user confirmed authors should eventually be notified when someone comments/highlights their writing, but agreed notifications are "a whole thing" better addressed as its own future feature (Argos has no notification system at all yet — SPEC.md §4 Phase 2 already lists "Notifications (new follower, comment on your review)" as unbuilt). This spec does not build any notification.
- **The comment/highlight/vote system also applies to `Log` review text (Reviews), not just `Writing`.** The existing short book-scoped `Post` is explicitly excluded — its 1000-char body was judged too short to meaningfully highlight, and it keeps behaving exactly as `specs/book-posts.md` shipped it (no comments at all).
- **`Writing` can be edited after publishing** (unlike `Post`/`Log`, which are immutable today). Editing raises the anchored-highlight problem directly:
  - **Exact-match only.** If the exact substring originally captured by a highlight's `[start, end)` offsets no longer matches the edited body verbatim, that highlight is flagged **stale** ("text since edited") and stops rendering inline over the (now-different) text. Its comment(s) remain fully visible, just moved into a flat "annotations on text that's since changed" list instead of an inline highlight. No fuzzy re-anchoring/re-search is attempted — deliberately simple, can be revisited if staleness turns out to be common in practice.
  - Whole-post comments are entirely unaffected by edits (they're not anchored to any offset).
- **Highlighting/commenting permission: any signed-in user**, no follow relationship required — matches how comments/reviews already work openly in Argos, and how Genius/Instagram behave publicly.

## 3. Design

### 3.1 New domain concept: `Writing`

```
Writings(id, user_id, title, content, kind, book_id, source_book_id, source_text, created_at, updated_at, is_edited)
```

- `Writing.cs` (`Argos.Domain`): `Id`, `UserId`, `User` (nav), `Title` (string, required, ≤200 chars), `Content` (string, required, cap **50,000 chars** — generous long-form limit, an assumption not explicitly pinned by the user; easy to raise/lower before launch), `Kind` (enum: `Original` | `Quote`), `CreatedAt`, `UpdatedAt`, `IsEdited` (bool, flips true on first edit — drives the "edited" badge and is what tells the frontend to check for stale highlights).
- Book linkage, mutually exclusive by `Kind`:
  - `Kind == Original`: `BookId` nullable — the piece can optionally be *about* a book (reuses the same book-picker as `Post`) or have no book at all.
  - `Kind == Quote`: exactly one of `SourceBookId` (nullable FK to `Books`, restrict-delete like `Post.BookId`) or `SourceText` (nullable string, ≤200 chars, free-typed source name) must be set — enforced in `WritingService.CreateAsync`/`UpdateAsync`, not just the DB (Postgres check constraint as a second line of defense: `(kind = 'Original') OR (kind = 'Quote' AND ((source_book_id IS NOT NULL) <> (source_text IS NOT NULL)))`).
- New migration `AddWritings`.

### 3.2 New domain concept: unified `Comment` (whole-post + highlight, on `Writing` or `Log`)

Rather than four near-duplicate tables (writing-comments, review-comments, writing-highlights, review-highlights), one generic table covers both content targets and both comment kinds — matching SPEC.md §8's "keep the architecture boring":

```
Comments(id, parent_comment_id, user_id, target_type, target_id, anchor_start, anchor_end, content, created_at, updated_at, is_edited)
```

- `Comment.cs`: `Id`, `ParentCommentId` (nullable, self-referencing FK — only ever set for whole-post comments; a highlight-comment's `ParentCommentId` is always null, enforcing "highlight-comments don't nest" at the data level), `UserId`, `TargetType` (enum: `Writing` | `Review` — `Review` points at a `Log.Id`), `TargetId` (Guid — the `Writing.Id` or `Log.Id`), `AnchorStart`/`AnchorEnd` (nullable ints — both null = whole-post comment; both set = highlight-comment, a `[start, end)` UTF-16 code-unit offset pair into the target's body text at the time the highlight was made), `Content`, `CreatedAt`, `UpdatedAt`, `IsEdited`.
- Check constraint: `anchor_start IS NULL = anchor_end IS NULL` (both or neither), and `anchor_start < anchor_end` when set, and `(anchor_start IS NULL) OR (parent_comment_id IS NULL)` (a highlight-comment can never itself be a reply, per §2).
- `TargetType`/`TargetId` is a deliberate lightweight polymorphic pair rather than two nullable FKs (`WritingId`/`LogId`) — avoids a schema change every time this system extends to a new content type (the user already flagged more sections are coming), at the cost of losing a DB-enforced FK constraint on `TargetId` (accepted trade-off, same category of decision as `FeedContentItem`'s flattening in `specs/book-posts.md` §3.2 — enforced in the service layer instead, `CommentService` validates the target exists before insert).
- **Merged-highlight-region query**: not a stored entity — computed at read time. `GET /api/{writing|reviews}/{id}/highlights` groups all non-stale highlight-comments for that target by overlapping `[anchor_start, anchor_end)` ranges (interval-merge, done in the service layer over the already-small result set for one piece of text — no need to push interval math into SQL) into regions, each region carrying its merged `[start, end)` span and its member comments (sorted by score, per §3.4).
- **Staleness check**: on read, a highlight-comment's anchor is considered stale if `writing.Content.Substring(AnchorStart, AnchorEnd - AnchorStart)` no longer equals the text captured at creation time — which means the *original captured substring* must also be stored (`Comment.AnchoredText`, snapshotted at creation) purely to compare against on every read; it is never itself displayed. Recomputed on read rather than eagerly flagged on edit, so a `Writing` update is a single-row `UPDATE` with no cascading writes to its comments.

### 3.3 Voting: `CommentVoteRecords`

```
CommentVoteRecords(id, comment_id, user_id, value, created_at)
```

Same shape as the existing `CommentVote` (on `CheckpointComments`, `specs/book-clubs.md`) — renamed here to `CommentVoteRecord` purely to avoid a class-name collision with that existing `Argos.Domain.CommentVote`, which is specific to `CheckpointComment` and untouched by this spec: unique on `(comment_id, user_id)`, `value` is `+1`/`-1`, a comment's score is server-computed (`SUM(value)`, `0` for no votes). Collapse threshold (`score <= -5`) is applied client-side per §2 — the API always returns full comment data plus its score; the frontend decides whether to render collapsed.

### 3.4 API

- `POST /api/writings` (auth) — `CreateWritingRequest { Title, Content, Kind, BookId?, SourceBookId?, SourceText? }` → `WritingDto` (201). Validates per §3.1's mutual-exclusion rules.
- `PUT /api/writings/{id}` (auth, author only) — `UpdateWritingRequest { Title, Content }` → `WritingDto`. Sets `IsEdited = true`, `UpdatedAt = now`. `Kind`/book fields are not editable post-creation (changing `Quote` → `Original` or swapping the source book is a new post, not an edit — avoids re-litigating the mutual-exclusion invariant mid-edit).
- `DELETE /api/writings/{id}` (auth, author only) — cascades to its `Comments`/`CommentVoteRecords`.
- `GET /api/writings/{id}` → `WritingDto`.
- `GET /api/writings?userId=` / feed queries per §3.5.
- `GET /api/{writing|review}/{id}/comments` → nested tree of whole-post comments (`AnchorStart/End == null`), same "small enough to fetch whole" reasoning `specs/book-clubs.md` §3.6 already used for checkpoint comments — a piece's comment tree isn't expected to be large enough to need cursor pagination in v1.
- `GET /api/{writing|review}/{id}/highlights` → merged highlight regions per §3.2, each with its member comments.
- `POST /api/comments` (auth) — `CreateCommentRequest { TargetType, TargetId, Content, ParentCommentId?, AnchorStart?, AnchorEnd? }` → `CommentDto`. Validates: target exists, anchor range (if present) is within the target's current content length and `ParentCommentId` is null, parent (if present) belongs to the same target and has no anchor set (replies only ever attach to whole-post comments).
- `POST /api/comments/{id}/vote` (auth) — `{ Value: 1 | -1 }`, upsert-or-toggle (voting the same value again removes the vote, matches typical up/down UX) → new score.
- `PUT` / `DELETE /api/comments/{id}` (auth, author only) — edit sets `IsEdited`; delete cascades to replies (for whole-post comments) and votes.

### 3.5 Sections: Feed / Writings / Reviews / Posts

- New top-level tab bar (reusing the existing nav pattern) with four sections. **Feed** keeps today's merged `UNION ALL` query (`specs/book-posts.md` §3.2) and now unions in `Writings` as a third arm (`FeedContentItem` gains a `"Writing"` `Kind` and a `Title` field, null for the other two kinds). **Writings**, **Reviews**, **Posts** are each a simple filtered, single-source, cursor-paginated list — no union needed since each is exactly one table — built as thin wrappers so a future fifth section is one new endpoint/tab, not a query rewrite.
- `FeedItemCard` gains a `Writing` branch: title + a truncated content preview (first ~280 chars) + (for `Quote`) a small "quoted from {book title / source text}" attribution line; clicking opens the full split-view detail page (§2).

### 3.6 Frontend: composer, detail page, highlighting UX

> **Superseded (2026-09-30):** the "Detail page" bullet below — a dedicated `WritingDetailPage` with the text above a stacked whole-post comment thread — was replaced by `specs/writing-feed-card-and-modal.md`'s two-column `WritingDetailModal` (overlay when opened from a card, full-screen at the `/writings/:id` route). The `FeedItemCard`/`WritingsPage` card description in the bullet above §3.6 was similarly replaced by that spec's `WritingCard` (image slot + line-clamped caption). Everything else in this section — the composer, `AnnotatableText`'s selection-capture/highlight-merge/staleness behavior, voting — is unchanged and still accurate; don't implement the stacked layout described below from scratch.

- **Composer** (`WritingComposerModal`, opened from a new prompt alongside the existing `PostComposerPrompt`): `Kind` toggle (Original / Quote) → `Quote` reveals the book-picker with a "can't find it? type the source instead" fallback (matches §2 exactly); `Title` input; a larger textarea/rich-enough editor for `Content` (plain text is sufficient for v1 — no rich-text/markdown requested).
- **Detail page** (`WritingDetailPage` / reused for `Log` reviews as `ReviewDetailPage` via a shared `AnnotatableText` component): renders `Content` as selectable text; a text-selection handler (`window.getSelection()` → character offsets into the rendered plain text) triggers a "comment on this" popover anchored to the selection, which posts `CreateCommentRequest` with `AnchorStart`/`AnchorEnd` set. Merged regions (from `GET .../highlights`) render as a highlighted `<mark>` span; clicking one opens a side panel/popover listing its comments (sorted by score, collapse-if-very-negative per §3.3). Below/beside the text, the whole-post comment tree renders as a standard nested-reply list (compose box, per-comment reply/upvote/downvote controls, collapse toggle for very-negative comments).
- Offsets are computed against the **rendered plain-text content**, not raw HTML — v1 stores/renders plain text only (no rich text), so this is a direct 1:1 mapping with no serialization ambiguity to solve.

## 4. Explicitly out of scope

- **Notifications** on new comments/highlights — confirmed by the user as a separate future feature (§2); this spec ships none.
- **Comments/highlights on the existing short `Post`** — stays exactly as `specs/book-posts.md` shipped it.
- **Fuzzy re-anchoring** of highlights after an edit — exact-match-only staleness detection per §2; a genuinely better re-anchoring heuristic is a possible follow-up if staleness turns out to be a frequent, annoying occurrence in practice.
- **Rich text / markdown / inline formatting** in `Writing.Content` — plain text only, keeps the highlight-offset model simple (§3.6).
- **Nested replies on highlight-comments** — flat per region, per §2; overlapping highlights already provide the "reply to an annotation" path.
- **Editing a `Writing`'s `Kind` or source/book fields** — only `Title`/`Content` are editable (§3.4); changing kind/source is a new post.
- **Moderation/reporting tools** beyond the vote-driven auto-collapse — matches SPEC.md §3 Phase 3's "Moderation & reporting tools" still being unbuilt generally.
- **Further section additions** (the user mentioned "more in the future") — this spec only builds Feed/Writings/Reviews/Posts; anything beyond that is a later spec.

## 5. Open questions to confirm before/while building (flagged, not blocking a start)

- **`Content` length cap (50,000 chars)** — a reasonable-sounding default picked for this spec, not something the user explicitly pinned. Cheap to change in one validation constant + one migration column-length before launch.
- **Collapse threshold (`score <= -5`)** — likewise a starting number, not user-specified; easy to tune.
- ~~Whether `Writing` needs its own visibility setting~~ — **resolved**: no, per-type privacy would be inconsistent with `Log`/`Post` (always public today, no field for it at all). The user confirmed Argos should eventually get an **account-level** three-tier privacy model matching Letterboxd (public / followers-only / private-to-self, with the diary-entry-style per-item override as a possible later refinement) applied consistently across *all* content types at once — not something this spec should introduce piecemeal for just `Writing`. Writings ship always-public for now, like `Log`/`Post`; the account-level privacy system is tracked as a separate future idea in `FUTURE-IDEAS.md`, not designed here.

## 6. Tasks

### Backend

- [x] `Writing` domain entity + `Kind` enum (`Argos.Domain/Writing.cs`).
- [x] `Comment` domain entity + `TargetType` enum (`Argos.Domain/Comment.cs`), including the `AnchoredText` snapshot field for staleness checks (§3.2).
- [x] `CommentVoteRecord` domain entity (`Argos.Domain/CommentVoteRecord.cs`).
- [x] `ArgosDbContext`: `DbSet<Writing>`, `DbSet<Comment>`, `DbSet<CommentVoteRecord>` + FK/check-constraint configuration per §3.1–§3.3.
- [x] EF Core migration `AddWritingsAndComments`.
- [x] `IWritingRepository`/`WritingRepository`, `ICommentRepository`/`CommentRepository` (incl. the interval-merge highlight-region query, §3.2), `ICommentVoteRecordRepository`/`CommentVoteRecordRepository`.
- [x] `WritingService` (create/update/delete with §3.1's mutual-exclusion validation), `CommentService` (create/update/delete/vote with §3.4's validation rules), extend `FeedService`/the feed union query for the new `Writing` arm (§3.5).
- [x] DTOs: `WritingDto`, `CreateWritingRequest`, `UpdateWritingRequest`, `CommentDto` (with nested `Replies` for whole-post comments), `CreateCommentRequest`, `HighlightRegionDto`, extended `FeedContentItemDto`.
- [x] Controllers: `WritingsController`, `CommentsController`; new section endpoints (`GET /api/writings`, `/api/reviews`, `/api/posts` as filtered lists per §3.5 — reuse/rename existing endpoints where one already exists for a section). (Mutation routes for annotation comments ended up at `api/annotation-comments` via a new `AnnotationCommentsController`, not `api/comments` — that path was already owned by Book Clubs' checkpoint comments.)
- [x] Backend tests: `Writing` create/update/delete + mutual-exclusion validation; `Comment` create (whole-post + highlight, incl. rejecting a reply-to-a-highlight and an anchor-on-a-reply); vote toggle math; merged-highlight-region grouping (adjacent/overlapping/disjoint cases); staleness detection after a `Writing` edit; feed union including `Writing`.

### Frontend

- [x] `WritingDto`, `CommentDto`, `HighlightRegionDto` types; `api/writings.ts`, `api/comments.ts`. (Comment API client landed as `api/annotationComments.ts`, matching the backend's `AnnotationCommentsController` route.)
- [x] Section tab bar (Feed / Writings / Reviews / Posts) + routes per §3.5.
- [x] `WritingComposerModal` (Kind toggle, book-picker-or-typed-source for Quote, title + body) per §3.6.
- [x] `FeedItemCard` `Writing` branch (§3.5).
- [x] `AnnotatableText` shared component: selection → offset capture → comment-on-selection popover, merged-highlight-region rendering (`<mark>` spans), click-to-view-region-comments panel; reused by both `WritingDetailPage` and `ReviewDetailPage` (per §3.6, since Reviews are in-scope for comments per §2).
- [x] Nested whole-post comment thread component (compose, reply, upvote/downvote, collapse-if-very-negative) — reusable across `Writing` and `Log` review targets.
- [x] Tests: composer validation (Kind-dependent required fields), selection-to-offset capture, highlight-region merge rendering, vote toggle UI, collapse/expand of very-negative comments, stale-highlight fallback rendering.

### Verification & docs

- [x] Live verification: create an `Original` writing with no book, a `Quote` writing with a real book, a `Quote` with a typed source; comment + reply (nested) on a writing; highlight overlapping spans from two accounts and confirm the merge; downvote a comment to below -5 and confirm it collapses; edit a writing's text under an existing highlight and confirm it's flagged stale.
- [x] `CHANGELOG.md` entry.
- [x] `SPEC.md`: §3 domain model gains `Writing`/`Comment`/`CommentVoteRecord`, §4 gains a "Writings & Annotations" bullet, §5 architecture gains a note on the polymorphic `Comment` design and the merged-highlight-region query, §7 data model gains the three new tables.
