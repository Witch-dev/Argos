# Feature Spec — Writing Feed Card Redesign + Instagram-Style Modal

**Status:** 📝 Spec drafted (2026-09-30), not yet implemented

**Supersedes:** `specs/writings-and-annotations.md` §3.6's detail-page layout only (the "Genius-style split view, text above, whole-post comments below" description). Everything else in that spec — the `Writing`/`Comment`/`CommentVoteRecord` data model, highlight-merge behavior, voting, staleness — is unchanged and this feature builds directly on top of it.

## 1. Problem

After trying the shipped Writings & Annotations feature live, the user wants the feed card and detail view to feel more like a familiar Instagram post: an image area at the top of the card (even without a real uploaded image yet), caption-style truncation with a clickable "see more," and — critically — a modal (not a separate page) that opens on click, with the writing's text on the left and comments on the right, where clicking a highlighted span takes over the right side instead of living inline in the text.

## 2. Clarifying decisions made (via questions to the user)

- **No image upload yet.** Real image attachments on a `Writing` are deferred — logged in `FUTURE-IDEAS.md`, not built here. This spec only changes how the *reserved image-sized slot* in the feed card renders in the meantime.
- **Scope: Writings only.** Reviews and the old short `Post` keep their current card/detail presentation untouched.
- **The reserved image slot shows the linked book's cover art when one exists**, not a generic placeholder — free, already-cached data, and visually meaningful (matches the app's existing book-cover-driven aesthetic elsewhere, e.g. `ActivityStrip`). Applies to both cases where a `Writing` has a real book attached: `Quote` sourced from `SourceBookId`, or `Original` optionally *about* a book (`BookId`). Falls back to a plain placeholder (matching `BookCover`'s existing missing-cover treatment, per `specs/book-news-feed.md` §3.5's precedent) only when neither is set (`Original` with no book, or `Quote` with a typed `SourceText`).
- **Feed-card truncation sized like "an Instagram photo + caption"**: a fixed-aspect image/cover slot at full card width, plus a few lines of title+text beneath it truncated with a clickable "...". Clicking the image, the title, or the "..." all do the same thing: open the modal. This is not an inline expand — there's no "show more in place," it always opens the full modal.
- **Detail view becomes a modal, not a dedicated page**, opened over whatever's currently on screen (the feed, the Writings list, etc.): text on the left, comments on the right.
- **The right panel toggles between two states**, driven entirely by what's selected/clicked on the left:
  1. **Default**: the whole-post comment thread (nested replies, upvote/downvote) — exactly the existing `AnnotationCommentThread` component.
  2. **A highlighted region's comments**: clicking any merged highlight `<mark>` span swaps the right panel to that region's comment list. Clicking the *same* highlight again, or an explicit close/back affordance, reverts to the whole-post thread.
  3. **A new highlight being composed**: selecting a *fresh*, non-highlighted stretch of text swaps the right panel into a "write a comment on this selection" compose view (consistent with "right side always reflects what's active on the left," rather than a floating popover over the selection). After submitting, the right panel shows that region's (now-created) comment thread.
- **Direct links to one writing** (`/writings/{id}`, e.g. a bookmarked or shared URL with no feed loaded behind it): the user left this to a recommendation. **Decision: render the same left-text/right-comments layout full-screen** (filling the page, not floating over a background) rather than keeping a visually distinct dedicated page design — one layout to build and maintain, and it still works with zero feed context, matching how Instagram's own permalink pages render the same post-detail layout full-page rather than a separate design.

## 3. Design

### 3.1 Backend: expose the Quote-source book's cover art

`WritingDto` (`Argos.Api/Dtos/WritingDto.cs`) currently has `BookCoverUrl` (for `Original`'s optional `BookId`) but no cover field for `SourceBookId` (a `Quote`'s linked real book) — it only has `SourceBookOpenLibraryId`/`SourceBookTitle`. Add `SourceBookCoverUrl` (nullable string), populated from `Writing.SourceBook.CoverUrl` in `WritingsController.ToDto`, same pattern as the existing `BookCoverUrl` mapping. `FeedContentItemDto` already has what it needs — its existing `BookCoverUrl` is already populated from whichever book is actually linked (`BookId` or `SourceBookId`, confirmed working in the prior feed-integration fix) — no change needed there.

Resolution order the frontend uses for "what image shows in the slot": `SourceBookCoverUrl` (Quote-with-book) → `BookCoverUrl` (Original-about-a-book) → plain placeholder. Never both set at once (a `Writing`'s `Kind` already makes `BookId`/`SourceBookId` mutually exclusive per `specs/writings-and-annotations.md` §3.1).

### 3.2 Frontend: `WritingCard` (feed + Writings-section card)

Replaces the current plain-text `Writing` branch of `FeedItemCard` (and the equivalent card used in the Writings section list) with a dedicated `WritingCard`:

- **Image slot**: fixed-aspect (1:1 square, matching a classic Instagram grid tile — a reasonable default, easy to adjust) box at full card width, top of the card. Shows the resolved cover (§3.1) with `object-fit: cover`, or `BookCover`'s existing missing-cover placeholder treatment when there's no book at all.
- **Below the image**: author line (avatar/name, existing pattern), the `Title` (bold), then the `Content` preview clamped to a fixed number of lines (CSS `-webkit-line-clamp`, ~3-4 lines — a visual-line clamp rather than a character-count cap, so it adapts to screen width like an Instagram caption) with a trailing, separately-clickable "... more" if the content overflows the clamp.
- **Click targets**: the image, the title, and the "... more" affordance all call the same `onOpen(writingId)` handler — nothing expands in place.
- For the `Quote` kind, keep the existing "Quoted from {book title / source text}" attribution line (shipped in the prior feed-integration fix) beneath the content preview.

### 3.3 Frontend: `WritingDetailModal` (replaces `WritingDetailPage`'s layout, reused full-screen for direct links)

A single component, `WritingDetailModal`, rendered two ways:
- **As an overlay** when opened from a card click (feed, Writings list) — a modal/dialog over the current page, closeable via an X / click-outside / Escape, which just unmounts the modal and leaves the underlying page exactly as it was (no navigation).
- **Full-screen, as the actual page content**, when the route is `/writings/{id}` directly (a hard refresh or an externally-shared link) — same component, no dialog chrome/backdrop, just filling the viewport. (A card click still *also* updates the URL to `/writings/{id}` via `history.pushState`-style routing so the address bar reflects what's open and back/forward work, but doesn't trigger a full page navigation — same pattern React Router modal-routes commonly use.)

**Layout** (both modes): two columns.
- **Left**: scrollable, the full `Title` + `Content`, rendered through the existing `AnnotatableText` (selection → offset capture, merged highlight `<mark>` regions) — unchanged from the shipped feature, just now in the left column instead of filling the page width.
- **Right**: a single panel whose contents depend on interaction state (§2):
  - *Default*: `AnnotationCommentThread` (existing component, unchanged) for the whole-post comments.
  - *Highlight selected*: a header ("Comment on: \"{the highlighted excerpt, truncated}\"" + a close button) followed by that region's comment list (sorted by score, same collapse-if-very-negative behavior) — reuses the comment-list rendering already inside `AnnotationCommentThread`/`AnnotatableText`'s stale-comments view, factored out if needed rather than duplicated.
  - *New selection being composed*: the same header style ("Comment on: \"{the new selection's excerpt}\"" + a cancel button that clears the selection) with a compose box; submitting posts the highlight-comment and transitions to the "Highlight selected" state for that newly-created region.
- Local component state (`activeRightPanel: 'thread' | { highlightRegion } | { newSelection }`) drives which of the three renders; clicking an already-active highlight, or its close button, resets to `'thread'`.

### 3.4 Routing

`/writings/:id` route renders `WritingDetailModal` full-screen (§3.3). Every place a `Writing` card is clickable (Feed, Writings section list) opens `WritingDetailModal` as an overlay *and* updates the URL to `/writings/:id` without a full navigation (so refreshing while the modal is open lands you on the full-screen version of the exact same component — no separate code path to keep in sync).

## 4. Explicitly out of scope

- **Actual image upload/attachment** on a `Writing` — tracked in `FUTURE-IDEAS.md`, this spec only changes how the already-reserved image slot renders using data Argos already has (book covers).
- **Reviews and the old short `Post`** getting the same card/modal treatment — confirmed Writings-only for now (§2); could be a follow-up once image upload itself exists.
- **Carousel / multiple images per writing** — not relevant without image upload at all yet.
- **Non-square aspect ratios, cropping controls** — moot until real image upload exists; the 1:1 default here only governs how a *book cover* fills that slot today.

## 5. Tasks

### Backend

- [x] `WritingDto` gains `SourceBookCoverUrl` (nullable), populated in `WritingsController.ToDto` from `writing.SourceBook?.CoverUrl` (§3.1).
- [x] Backend test: `WritingsController`/`WritingService` test confirming a `Quote`-with-`SourceBookId` writing's DTO carries the linked book's `CoverUrl` under the new field, and that it's null for `Original`/typed-source `Quote` writings.

### Frontend

- [x] `WritingCard` component (§3.2): image slot (book cover or placeholder), author line, title, line-clamped content preview, "... more", Quote attribution line — replacing the current plain `Writing` branch in `FeedItemCard` and the Writings-section list's card rendering.
- [x] `WritingDetailModal` component (§3.3): two-column layout, overlay mode + full-screen mode, three-state right panel (whole-post thread / highlight region / new-selection compose) driven by clicks on the `AnnotatableText` left column.
- [x] Wire `WritingCard`'s click targets (image/title/"... more") to open `WritingDetailModal` as an overlay + push the `/writings/:id` URL without a full navigation; `/writings/:id` as a direct route renders the same component full-screen.
- [x] Retire the old `WritingDetailPage`'s stacked (text-above-comments) layout in favor of `WritingDetailModal`'s two-column one.
- [x] Tests: `WritingCard` rendering (cover-vs-placeholder resolution order, line-clamp + "... more" visibility threshold, all three click targets call `onOpen`), `WritingDetailModal` right-panel state transitions (default → highlight click → same-highlight-click-reverts, default → new selection → compose → submit transitions to that region's thread), overlay-vs-full-screen rendering modes, URL sync on open/close.

### Verification & docs

- [ ] Live verification: open a Quote-with-book writing's card — confirm its real book cover fills the image slot; open an Original-with-no-book writing — confirm the plain placeholder renders instead; confirm a long writing's card truncates with a clickable "... more" and a short one doesn't; click through image/title/"..." and confirm all three open the modal; inside the modal, click a highlight and confirm the right panel swaps, click it again and confirm it reverts, select new text and confirm the compose-swap-then-thread flow; refresh the page while the modal's URL is active and confirm the full-screen mode renders the same content. **Partially done**: a reviewer pass (see CHANGELOG 2026-09-30, "reviewer-pass fixes + live verification") found and fixed two real bugs plus one fragility in this flow, and the *data/API* half of this checklist is now verified live against the real backend/Postgres — cover-art resolution for all three Writing shapes (Quote-with-book, Original-with-no-book, Quote-with-typed-source) confirmed to match exactly, and the highlight-comment API the right panel depends on (merge of overlapping highlights, voting, per-caller vote scoping) confirmed correct. **Still not done**: the actual browser click-through — image/title/"..." opening the modal, clicking a highlight and watching the right panel swap, clicking it again to revert, the new-selection compose-then-thread flow, and specifically refreshing the page while the overlay is open to confirm it becomes full-screen (the exact scenario the reviewer-pass fix #3 addresses) — no browser-automation tool is available in this environment; this remains covered only by RTL tests plus the live API-level checks above, and still needs a real manual browser pass before this item can be marked fully done.
- [x] `CHANGELOG.md` entry.
- [x] `specs/writings-and-annotations.md` — add a note under §3.6 pointing to this spec as the layout's successor, so a future reader doesn't implement the old stacked design from that spec by mistake.
