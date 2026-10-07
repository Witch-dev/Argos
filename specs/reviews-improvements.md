# Feature Spec — Review Improvements

**Status:** ✅ Implemented (2026-10-01), all four phases. Browser pass done 2026-10-06 (see Verification).

Builds on the existing reviews: a review is the `Rating` + `ReviewText` on a `Log` (SPEC.md Phase 2), listed on the Reviews section (`/reviews`, specs/writings-and-annotations.md §3.5), on `BookDetailPage`, in the home feed (`FeedContentItem`, specs/book-posts.md §3.2), and opened on `ReviewDetailPage`, which has highlight-comments and a comment thread (`CommentTargetType.Review`). Read those first. This spec extends them; it doesn't replace them.

## 1. Problem

Reviews work, but they feel like private notes that happen to be visible, not like a review site:

- **You can't see who wrote a review.** `LogDto` has no author fields, so `ReviewListItem` and `LogReviewCard` show a book, stars and text, but no name or avatar.
- **Ratings are too coarse.** Whole stars only (1–5). Half stars are the most requested feature on Goodreads, and everyone uses them on Letterboxd.
- **Anything can be reviewed, even unread books.** A "Want to read" log can carry a 1★ rating. This is how review-bombing starts on Goodreads, where books get rated before they're even released.
- **No spoiler protection.**
- **Rereads and edits are invisible.** `IsReread` is stored but never shown, so two reviews of one book by one person look like a duplicate. An edited review looks the same as an unedited one, even though its highlight-comments may no longer line up with the text.
- **No privacy.** Every review is public.
- **There's no social layer.** You can't like a review, you can't sort by anything but newest, and a book page doesn't summarise how people rated it.
- **Reviews don't help you decide whether to read a book.** StoryGraph's most loved feature is "readers say this book is dark, fast-paced, plot-driven", plus reader-reported content warnings. Argos has nothing like it.

**What we compared against:**
- **Letterboxd:** half stars, a ❤️ that's separate from the rating, a "Top 4 favourites" row on the profile, liking reviews, Popular / Friends / Recent review tabs, a spoiler checkbox, a rating chart on every film page, rewatch markers, per-entry privacy. The main complaint is that "Popular" fills up with one-line joke reviews.
- **Goodreads:** inline spoiler tags and friends' reviews first are liked. No half stars, review-bombing, untagged spoilers and an opaque default sort are hated.
- **StoryGraph:** quarter stars, mood/pace/plot-or-character questions summarised per book, reader-reported content warnings with severity, and the option to stay unsocial.

Argos already has something none of them have: **highlight-comments on a review**. This spec makes them visible (§3.11).

## 2. Clarifying decisions made (via questions to the user)

- **All 13 suggestions are in scope**, delivered in four phases (§5).
- **Half-star ratings, 0.5 to 5.** The same scale applies to **book-club ratings**, so a rating means the same thing everywhere. Existing ratings keep their value (4★ stays 4★).
- **Spoilers: both kinds.** A "Contains spoilers" checkbox that hides the whole review until clicked, **and** inline `||spoiler||` tags that hide only part of the text.
- **Only finished or abandoned books can be rated or reviewed.** A new **"Did not finish" (DNF)** status is added. Rating, review text, spoilers, privacy, moods and content warnings are only allowed on `Read` and `DidNotFinish` logs. Mid-book thoughts keep using the existing progress note.
- **Existing ratings and reviews on other statuses are deleted** during the migration (§3.3).
- **❤️ Favourite is per book, plus a profile row.** You heart a book. The heart shows on your reviews of it, and you can pick up to 4 favourites to show at the top of your profile.
- **Privacy is a per-review setting:** Public / Followers only / Private. Your account stores a default for new reviews. Account-wide privacy for Posts, Writings and shelves stays in `FUTURE-IDEAS.md`.
- **Quick questions: Mood, Pace, and Plot or character.** No character questions.
- **Content warnings come from a fixed list with severity** (Graphic / Moderate / Minor).

**Decisions made while writing the spec (not asked; change any of these before starting):**
- **Ratings are stored as `numeric(2,1)`**, for example `3.5`. The API sends and receives the same number. Valid values are 0.5, 1.0, 1.5 … 5.0, and anything else → 400. Decimal is easier to read in the database and in the code than "half-star units" (7 = 3.5★).
- **Clicking the star you've already picked clears the rating** (Letterboxd behaviour), so you can remove a rating without a separate button.
- **The inline spoiler syntax is `||hidden text||`** (the same as Discord). It can't be nested, and an unclosed `||` is shown as plain text.
- **The author always sees their own spoilers uncovered**, with a small "Spoilers" badge, so they can check what they wrote.
- **"Edited" means the review *text* changed more than 10 minutes after it was first published.** Fixing a typo right after posting doesn't count. Changing only the rating doesn't count either, since highlight-comments anchor to the text.
- **A new `ReviewedAt` drives review ordering**, instead of the log's `CreatedAt`. Someone who logs a book in March and writes the review in June should appear as a June review.
- **DNF keeps the page you stopped at.** `CurrentPage`/`TotalPages` are allowed on DNF logs ("Stopped at page 112 of 340"), and `FinishedAt` means the date you stopped.
- **The migration that deletes reviews on unread logs also deletes the comments on them**, since a comment thread with no review above it makes no sense. The migration logs how many rows it changed. Check the dev database count before applying it (§5 Phase 1).
- **Privacy covers the review, not the reading.** A Private review hides the rating, the text and the quick-question answers. That the person *read* the book still shows on their shelves and in the activity strip, as it does today.
- **Book-wide numbers (rating average, chart, "Readers say") count Public and Followers-only reviews, never Private ones.** They show no names, but a Private review should leave nothing behind outside your account.
- **One vote per reader in book-wide numbers.** If you've read a book three times, only your newest rated log counts.
- **The average rating shows once a book has 3 ratings.** The chart shows from the first rating. "Readers say" shows a question once **3** readers have answered it.
- **Content warnings show from the first report**, with how many readers reported each one, behind a "Show content warnings" toggle. For some readers the warnings are spoilers themselves.
- **You can't like your own review** (the same as lists).
- **"Popular" means likes in the last 7 days, then all-time likes, then newest.** It's page-numbered, not cursor-based, for the same reason as lists browse (the ranking changes over time).
- **"Hide short reviews" hides reviews under 100 characters** (not counting spoiler markers). It's the answer to Letterboxd's "Popular is full of jokes" complaint.
- **Favourites require a `Read` log of the book** (not DNF: you can't love a book you didn't finish). Favourites are always public. To keep one private, don't heart it.
- **The mood and content-warning lists live in one backend catalog** and are served to the frontend by an endpoint, so the two lists can't drift apart.

## 3. Design

### 3.1 Data model changes

**`Log`**

| Field | Change | Meaning |
|---|---|---|
| `Rating` | **`int?` → `decimal?`**, column `numeric(2,1)` | 0.5–5.0 in steps of 0.5. Existing values are unchanged (4 → 4.0). |
| `Status` | **new enum value** `DidNotFinish = 3` | Appended, so existing values keep their numbers. |
| `HasSpoilers` | **new**, `bool`, default `false` | The whole-review spoiler flag. |
| `ReviewedAt` | **new**, `DateTime?` | When review text was first saved. Set to null when the text is cleared. Backfilled from `CreatedAt` where `ReviewText` is set. Drives every review sort. |
| `ReviewEditedAt` | **new**, `DateTime?` | Last time the text changed after the 10-minute grace period. Null means never edited. |
| `Visibility` | **new**, enum `ReviewVisibility` (`Public = 0`, `Followers = 1`, `Private = 2`) | Phase 2. Backfilled `Public`. |
| `Moods` | **new**, `string[]`, Postgres `text[]`, default empty | Phase 4. Up to 3 keys from the catalog. |
| `Pace` | **new**, enum `ReadingPace?` (`Slow`, `Medium`, `Fast`) | Phase 4. |
| `Drive` | **new**, enum `StoryDrive?` (`Plot`, `Character`, `Mix`) | Phase 4. |

**`ClubRoundRating.Rating`**: `int` → `decimal`, `numeric(2,1)`, same rule. `RateRoundRequest.Rating` and `ClubBookRoundDto.MyRating` follow.

**`ApplicationUser`**: new `DefaultReviewVisibility` (`ReviewVisibility`, default `Public`). Phase 2.

**New tables** (each one is described in its own phase below): `ReviewLikes`, `FavouriteBooks` (Phase 3) and `LogContentWarnings` (Phase 4). All of them cascade when the log, book or user is deleted.

### 3.2 Phase 1: who wrote it (byline)

- New **`ReviewDto`** for every place that shows *someone else's* review. `LogDto` stays as the "my own log" shape. `ReviewDto` has the log's review fields (`Id`, book id/title/cover/OpenLibraryId, `Status`, `Rating`, `ReviewText`, `HasSpoilers`, `IsReread`, `RereadNumber`, `ReviewedAt`, `ReviewEditedAt`, `FinishedAt`) plus `Author { Id, Username, DisplayName, AvatarUrl }`. Rename `ListOwnerDto` to a shared **`UserSummaryDto`** and use it for both. Phases 2–4 add more fields.
- The author fields come from one batched user lookup per page, the same way `BookListDtoMapper` does it, in a new `Services/ReviewDtoMapper.cs`.
- `GET /api/reviews` (the Reviews section), the book page's reviews, `GET /api/reviews/{id}` (new, used by `ReviewDetailPage` instead of `GET /api/logs/{id}`) and the feed's review rows all return the author. The feed already has `Username`. It gains `DisplayName` and `AvatarUrl` if they're missing.
- **UI:** a new `ReviewByline` component (avatar, display name, @username linking to `/u/:username`, and the time) on `ReviewListItem`, `LogReviewCard`, `ReviewDetailPage` and the feed's review card. Remove the "no byline" comments.

### 3.3 Phase 1: half stars, DNF, and the "finished books only" rule

**Half stars**
- `LogService.ValidateRatingAndDates` (and the club rating path): `rating * 2` must be a whole number between 1 and 10. Otherwise 400 "Rating must be between 0.5 and 5 in steps of 0.5."
- `FeedContentItem.Rating`, `CreateLogRequest`/`UpdateLogRequest`/`LogDto.Rating`, and the club DTOs become `decimal?` in C# and `number | null` in TypeScript.
- **`StarRating` component:** read-only mode draws half stars (a ★ clipped to 50% width over a ☆). Its `aria-label` reads "3.5 out of 5 stars". In interactive mode each star has a **left and a right half** to click, arrow keys move by 0.5, and clicking the current value clears it. It's used everywhere stars appear, including `RoundRating`, so club rating gets half stars for free.
- A small `lib/rating.ts`: `formatRating(3.5) → "3.5"`, `isValidRating`, `toHalfStep`. Shared by the stars, the chart (Phase 3) and the form.

**Did not finish**
- `LogStatus.DidNotFinish = 3`. TypeScript: `'DidNotFinish'`. `LOG_STATUS_OPTIONS` adds "Did not finish", and `LOG_STATUS_LABELS` adds "didn't finish".
- **Check every place that reads `Status`** (listed in §5, Phase 1):
  - `ILogRepository.GetBestStatusByBookIdsAsync` uses `Max(Status)`, which would now rank DNF above Read. Replace it with an explicit order: `Read` > `CurrentlyReading` > `DidNotFinish` > `WantToRead`.
  - Lists' "You've read X of Y" and challenges count `Read` only. That's unchanged and correct.
  - `ProfilePage` tabs add "Did not finish".
  - In clubs, a DNF member's progress bar shows "Stopped" (not finished, not "not started"), in `MemberProgressBar`, `clubPace` and `ClubNextUpCard`.
- `CurrentPage`/`TotalPages` are now allowed on DNF logs as well as `CurrentlyReading`. In `LogForm`, picking DNF shows "Stopped at page __ of __" and "Date stopped" (`FinishedAt`).

**The rule**
- `LogService` create/update: if `Status` is not `Read` or `DidNotFinish`, then `Rating`, `ReviewText`, `HasSpoilers = true`, `Moods`, `Pace`, `Drive` or any content warning → **400** "Only books you've finished or stopped reading can be rated or reviewed." The server never silently drops them.
- **`LogForm`:** the rating, review and (later) the privacy and quick-question fields only show for Read/DNF. When editing a log that *has* a review and you change the status to something else, a warning appears above Save: "Changing the status will delete your rating and review." On save it sends nulls.
- `ClubService`'s rate-the-round flow already marks the log `Read`. Unchanged.

**Data cleanup (migration `ImproveReviews`)**
- Before changing anything, count the affected rows: logs with status `WantToRead`/`CurrentlyReading` that have a `Rating` or `ReviewText`, and the `Comments` on them. Record those counts in this task's notes when applying to the dev database.
- Delete the `Comments` (and their votes) whose `TargetType = Review` and whose log is one of those. Then set `Rating`, `ReviewText` to null on those logs.
- Change `Rating` columns to `numeric(2,1)` (Log and ClubRoundRating), add `HasSpoilers`, `ReviewedAt` (backfilled), `ReviewEditedAt`.

### 3.4 Phase 1: spoilers

- **Whole review:** `HasSpoilers` on create/update requests and both DTOs. In `LogForm`, a checkbox under the review box: "This review contains spoilers".
- **Inline:** stored as written (`||…||` stays in `ReviewText`). There's no server-side parsing except for counting characters for "Hide short reviews" (Phase 3).
- **`lib/spoilerText.ts`** (pure, unit-tested): `parseSpoilers(text) → Segment[]`, where each segment is `{ kind: 'text' | 'spoiler', text, rawStart, rawEnd }`. `rawStart`/`rawEnd` are positions in the stored text, so highlight-comments, which anchor to stored-text positions, keep working. Also `stripSpoilerMarkers` and `previewSegments(text, maxLength)`, which truncates without cutting a spoiler in half (a cut spoiler shows as a covered "spoiler" block).
- **A `SpoilerText` component** renders segments. Spoiler segments are covered (a solid `--muted` block the width of the text) until clicked, and are keyboard focusable with `aria-label="Spoiler, press to reveal"`. The author sees them uncovered.
- **Whole-review spoilers on cards** (`ReviewListItem`, `LogReviewCard`, the feed card): the text is replaced by "⚠ This review contains spoilers. **Show anyway**". On `ReviewDetailPage` the same cover sits over the text until clicked.
- **Highlights inside inline spoilers:** `AnnotatableText` takes the segments. Selecting inside a covered spoiler does nothing until it's revealed, and highlight positions still use `rawStart`/`rawEnd`. The `||` markers themselves are never shown and can't be part of a highlight.
- **In the form**, a hint under the review box: "Hide part of your review with ||double bars||".

### 3.5 Phase 1: rereads and the "edited" label

- **Reread:** `RereadNumber` on `ReviewDto` = 1 + the number of this author's `Read` logs of the same book that finished earlier (`FinishedAt ?? CreatedAt`). It's computed in one grouped query per page. Cards show a small "Reread" badge when `IsReread` or `RereadNumber > 1`, with the ordinal when known ("2nd read", "3rd read").
- **Edited:** `LogService.UpdateAsync` sets `ReviewedAt` when text goes from empty to set, clears it when text is cleared, and sets `ReviewEditedAt = now` when the text changes and `now - ReviewedAt > 10 minutes`. Cards and the detail page show "· edited" after the time, with the date in a `title` tooltip. `ReviewDetailPage` already lists stale highlight-comments (`AnnotatableText`). Nothing more is needed there.

### 3.6 Phase 2: privacy

**One rule, used everywhere**
- `Services/ReviewAccess.cs`: `CanView(log, viewerId, viewerFollowsAuthor)`. The author always can. `Public` means everyone. `Followers` means anyone who follows the author (a `Follow` row with `FollowerId = viewer`, `FolloweeId = author`). `Private` means only the author.
- A repository helper `VisibleTo(IQueryable<Log>, Guid? viewerId)` applies the same rule inside SQL (a subquery on `Follows`) so lists of reviews never load hidden rows.
- Something you can't see returns **404, not 403** (the same as lists).

**Where it applies.** Find each of these and apply the rule. These are all the places that show review content today:
- `GET /api/reviews` and `GET /api/reviews/{id}`, and the book page's reviews.
- The feed's review rows (`PostRepository`'s union query).
- `GET /api/logs/{id}` and `GET /api/logs?userId=…` for someone else: the log is returned (shelves stay public) but `Rating`, `ReviewText`, `Moods`, `Pace`, `Drive` and the warnings are **nulled** when the viewer can't see the review.
- The activity strip (`GetLatestStatusUpdatesByUserIdsAsync` → `ActivityItemDto`): the rating is removed for viewers who can't see it.
- `CommentService`'s target lookup for `Review`: a review you can't see is treated as missing (404 for the thread and highlights, 400 for commenting, 404 for voting on one of its comments). This is the same probe protection as lists.
- Phase 3 and 4 aggregates: `Public` + `Followers` only (§2).

**Default**
- `ApplicationUser.DefaultReviewVisibility`. `CurrentUserResponse` gains it. New `PUT /api/users/me/preferences` with `{ defaultReviewVisibility }`.
- `CreateLogRequest.Visibility` is optional. When it's missing, the user's default is used. `UpdateLogRequest.Visibility` is optional too, and missing means unchanged.

**UI**
- `LogForm` (Read/DNF only): "Who can see this review?" with Public / Followers only / Only me, defaulting to your account default.
- A small 🔒 "Only you" or 👥 "Followers" badge on your own non-public reviews. Others never see a badge, since they either see the review or don't see it at all.
- Your own `ProfilePage` gets a small "Review privacy default" select next to the avatar settings.

### 3.7 Phase 3: likes

- Table `ReviewLikes(LogId, UserId, CreatedAt)`, key `(LogId, UserId)`, index `(LogId, CreatedAt)` for "this week". Insert with `ON CONFLICT DO NOTHING`. Cascades with the log and the user.
- `POST`/`DELETE /api/reviews/{id}/like`: idempotent, login and §3.6 access required, liking your own → 400.
- `ReviewDto.LikeCount`, `ReviewDto.ViewerHasLiked` (one grouped query per page).
- **UI:** reuse `LikeButton` (from lists) on review cards and the detail page. The author and anonymous viewers see "♥ N" only.

### 3.8 Phase 3: sorting and filtering

**One endpoint for every review list.** `GET /api/reviews` changes from cursor-based to page-numbered. This is a contract change, and `ReviewsPage` is updated in the same phase.

`GET /api/reviews?section=popular|recent|following&bookId=&userId=&rating=&hideShort=&hideSpoilers=&page=&limit=20` → `PagedResponse<ReviewDto>`. Only logs with review text, visible to the viewer (§3.6).

| Section | Returns | Order |
|---|---|---|
| `recent` (default) | all | `ReviewedAt` ↓ |
| `popular` | all | likes in the last 7 days ↓, then all-time likes ↓, then `ReviewedAt` ↓ |
| `following` | authors the viewer follows (401 when signed out) | `ReviewedAt` ↓ |

- `bookId` / `userId` narrow to one book / one author. `rating` filters to an exact value (for example `3.5`), and an invalid value → 400. `hideShort=true` drops reviews under 100 characters after removing `||` markers. `hideSpoilers=true` drops reviews with `HasSpoilers`. It can't see inline spoilers, which is by design: inline-tagged reviews are safe to show. The page size is capped at 50.
- The old `GET /api/logs?bookId=` reviews shape is removed once `BookDetailPage` uses this endpoint.

**UI**
- **`ReviewsPage`:** tabs Popular this week / Recent / Following (Following only when signed in, reusing the `SectionTabs` styling from browse lists). Under them, a filter row: rating select (Any, 5, 4.5 … 0.5), "Hide short reviews" and "Hide spoilers" toggles. All of it is kept in the URL. "Load more" stays.
- **`BookDetailPage`:** the Reviews section becomes **"From people you follow"** (up to 3 when signed in and there are any), then Popular / Recent tabs with "Load more". Clicking a bar of the rating chart (§3.9) sets `rating=`.

### 3.9 Phase 3: rating summary on the book page

- `GET /api/books/{openLibraryId}/ratings` → `{ average, count, histogram: number[10], viewerRating }`. `histogram[0]` is 0.5★ and `histogram[9]` is 5★. Each counted reader's **newest rated Read/DNF log**, Public or Followers only (§2). `average` is null under 3 ratings. `viewerRating` is your own newest rating, whatever its privacy. A book nobody has cached → zeros, not 404.
- **`RatingSummary` component** next to the book's details: the big average ("3.8"), "from 124 ratings", and a 10-bar chart (Letterboxd style, no axis, a tooltip per bar "37 × ★★★★"). Bars are buttons that filter the reviews below. Your rating appears as "You rated it ★★★½". Under 3 ratings: "Not enough ratings yet", plus the bars when there are any. Use the `dataviz` skill when building it.

### 3.10 Phase 3: favourites and the profile row

- Table `FavouriteBooks(UserId, BookId, CreatedAt, ShowcasePosition int?)`, key `(UserId, BookId)`, unique `(UserId, ShowcasePosition)` where not null, `ShowcasePosition` 0–3.
- `PUT`/`DELETE /api/books/{openLibraryId}/favourite` (idempotent). Hearting without a `Read` log of the book → 400 "Mark it as read first." Un-hearting a showcased book also removes it from the showcase.
- `PUT /api/users/me/showcase` with `{ bookIds: Guid[] }` (0–4, each one must be a favourite, no duplicates) replaces the whole showcase in one save.
- `GET /api/users/{username}/favourites` → the showcase (in order) and all favourites (newest first).
- `ReviewDto.AuthorFavourited` (one query per page). The book page and `LogDto` for your own book get `ViewerFavourited`.
- **UI:** a ♡/♥ toggle on `BookDetailPage` next to your log actions (disabled with a hint until you've marked it Read). A small ♥ on review cards when the author favourited the book. **`ProfilePage`:** a "Favourite books" row of up to 4 large covers at the top, hidden when empty. The owner sees "Pick your favourites" / "Edit", which opens a picker from their favourites with drag or up/down order. Also a **"Favourites"** tab with every hearted book.

### 3.11 Phase 3: show off the discussions

- `ReviewDto.CommentCount` (non-deleted comments and replies, including highlight-comments) and `HighlightCount` (distinct anchored comments), each in one grouped query per page.
- **UI:** on cards, "💬 5 · ✎ 2 highlighted passages" (each part only when above 0), linking to the review page. On `ReviewDetailPage`, a one-line hint above the text for signed-in readers when there are no highlights yet: "Select any passage to comment on it."

### 3.12 Phase 4: quick questions (mood, pace, plot or character)

- **Catalog**, `Argos.Domain/ReviewCatalog.cs` (like `AvatarCatalog`): moods as `{ key, label }`: adventurous, challenging, dark, emotional, funny, hopeful, informative, inspiring, lighthearted, mysterious, reflective, romantic, sad, tense. Content warnings are listed in §3.13. `GET /api/reviews/options` returns both lists (public, cacheable).
- **Requests:** `Moods` (0–3 distinct catalog keys, unknown key → 400 naming it), `Pace`, `Drive`. Only allowed on Read/DNF logs (§3.3). On update, a missing field means unchanged and an empty array or null clears it (the same convention as list tags).
- `LogDto` / `ReviewDto` carry them.
- **`LogForm`:** a collapsible **"Tell other readers about it (optional)"** section for Read/DNF: mood chips (pick up to 3, the rest dim at 3), Pace (Slow / Medium / Fast, segmented, click again to clear), Plot-driven / Character-driven / A mix.
- **`ReviewDetailPage`:** under the stars, "dark · tense · emotional · Fast-paced · Plot-driven" as small chips.

### 3.13 Phase 4: content warnings

- **Catalog keys** (labels in sentence case): abandonment, abortion, addiction, animal-cruelty, animal-death, body-horror, body-shaming, bullying, cancer, child-abuse, child-death, chronic-illness, death-of-parent, domestic-abuse, drug-use, eating-disorder, emotional-abuse, genocide, gore, grief, gun-violence, homophobia, infertility, kidnapping, mental-illness, miscarriage, murder, pandemic, physical-abuse, police-brutality, racism, religious-bigotry, self-harm, sexism, sexual-assault, sexual-content, slavery, suicide, suicidal-thoughts, terminal-illness, torture, transphobia, violence, war.
- Table `LogContentWarnings(LogId, WarningKey, Severity)`, key `(LogId, WarningKey)`, cascades with the log. `Severity` enum: `Minor`, `Moderate`, `Graphic`.
- **Requests:** `ContentWarnings: [{ key, severity }]` (unknown key or duplicate → 400, at most 20). Read/DNF only. Missing means unchanged and empty clears. Saved in the same save as the log.
- **`LogForm`:** inside the same optional section, a "Content warnings" picker: a search box over the catalog, then each picked warning as a row with a Minor / Moderate / Graphic segmented control (default Moderate) and ×.
- **`ReviewDetailPage`:** "Content warnings (3)" collapsed, expanding to the author's list grouped by severity.

### 3.14 Phase 4: "Readers say" on the book page

- `GET /api/books/{openLibraryId}/insights` → for counted readers (§2: newest Read/DNF log per reader, Public/Followers only):
  - `moods`: `[{ key, label, percent }]`, the top 5 by share of readers who picked any mood, plus `moodAnswerCount`.
  - `pace`: `{ slow, medium, fast }` as percents, plus `paceAnswerCount`.
  - `drive`: `{ plot, character, mix }` as percents, plus `driveAnswerCount`.
  - `contentWarnings`: `[{ key, label, reports, topSeverity, bySeverity: { minor, moderate, graphic } }]`, ordered by severity then by reports.
  - Each part is null below 3 answers, except warnings, which show from 1 report (§2).
- **UI:** a **"Readers say"** panel on `BookDetailPage` under the rating summary. Mood chips with percents ("dark 64%"), and one stacked bar each for pace and plot/character with a legend. "Content warnings reported by readers (7)" is collapsed, then grouped Graphic / Moderate / Minor, with "reported by N readers" on each. Hidden when there's nothing to show. Use the `dataviz` skill for the bars.

## 4. Explicitly out of scope

- **Account-wide privacy** for Posts, Writings, shelves and activity. It stays in `FUTURE-IDEAS.md`. This spec only adds per-review privacy.
- **Character questions** (lovable, diverse cast, etc.). The user chose not to include them.
- **Quarter stars.**
- **Free-text content warnings, and warnings provided by the author or publisher.**
- **Inline spoilers in Posts and Writings.** `SpoilerText` is reusable, so this is a follow-up if wanted.
- **Notifications** for likes or comments on your review. Argos has no notification system.
- **Reporting or moderating reviews.**
- **"Friends' average rating"** on the book page.
- **Review drafts or scheduled publishing.**

## 5. Tasks

Each phase can be shipped and verified on its own. Within a phase, do the backend before the frontend.

### Phase 1 — Byline, half stars, DNF + the finished-only rule, spoilers, rereads, edited

#### Backend
- [x] Before writing the migration, query the dev database for the affected rows (§3.3: unread logs with a rating or review, and their comments) and note the counts here. **Counted on 2026-10-01:** 40 logs (5 WantToRead, 20 CurrentlyReading, 15 Read). Only **1** broke the rule: a CurrentlyReading log with a rating and no text. **0** comments were on affected reviews (all 13 comments in the database target Writings).
- [x] `Log`: `Rating` → `decimal?` (`numeric(2,1)`), `HasSpoilers`, `ReviewedAt`, `ReviewEditedAt`. `LogStatus.DidNotFinish = 3`. `ClubRoundRating.Rating` → `decimal`. Migration `ImproveReviews`: the cleanup from §3.3 (delete comments + votes, then null the rating/text), the column type changes, and the `ReviewedAt` backfill. Check that EF scaffolds the type change as `ALTER COLUMN … TYPE numeric(2,1)` and not as a drop/add. Apply to the dev database and check a few rows. **Done:** EF scaffolded `AlterColumn` (no data loss). The cleanup SQL is hand-written at the top of `Up`; replies and votes go with their comment through existing cascades. It also turns whitespace-only review text into null. Applied to the dev database: the one rating was removed, the 14 Read reviews kept their ratings (3.0–5.0), and all 14 got `ReviewedAt = CreatedAt`. **Added beyond the spec:** `ClubActivity.Value` → `numeric(5,1)`, because the club activity feed stores the rating there ("rated it 3.5★") as well as a progress percent.
- [x] Validation: half-step rule (logs and club ratings); the finished-only rule (§3.3); `CurrentPage`/`TotalPages` allowed for DNF. `ReviewedAt`/`ReviewEditedAt` bookkeeping in create and update (§3.5). `LogService.IsValidRating` is the one half-step rule, and club ratings go through it via `StageClubRatingAsync`. Whitespace-only text counts as no review. A spoiler flag with no text is dropped (saved as false), not rejected. `LogService` now takes a `TimeProvider` (registered as `TimeProvider.System`) so tests can move the clock past the 10-minute grace period.
- [x] `GetBestStatusByBookIdsAsync`: explicit order instead of `Max(Status)` (§3.3). It maps each status to a rank inside the SQL `MAX`, then maps the rank back.
- [x] `UserSummaryDto` (rename `ListOwnerDto`), `ReviewDto`, `ReviewDtoMapper` (author batch lookup + `RereadNumber` grouped query). `GET /api/reviews/{id}`. `GET /api/reviews` and the book page's reviews return `ReviewDto`. The feed's review rows gain `HasSpoilers`, `IsReread`, `ReviewEditedAt` and the author's display name/avatar. `FeedContentItem.Rating` → `decimal?`. **How:** the user lookup moved out of `BookListDtoMapper` into a shared `UserSummaryLookup`, which both mappers use. The reviews endpoints moved into a new `ReviewsController` (`/api/reviews` and `/api/reviews/{id:guid}`). `GET /api/reviews/{id}` serves any Read/DNF log, even one with its text cleared (its comments still need a page), and 404s for other statuses. `GET /api/logs?bookId=` returns `ReviewDto`s until Phase 3 replaces it. Review lists, the cursor and the feed all order by `ReviewedAt ?? CreatedAt`. The feed already sent the author's display name and avatar, so only the review flags were new there.
- [x] Tests: half-step validation (0.5 and 5 OK; 0, 5.5, 3.3 → 400) for logs and club ratings; rating/review on WantToRead/CurrentlyReading → 400 with the message, and DNF → OK with stopped-at page; `ReviewedAt` set, cleared and re-set; `ReviewEditedAt` not set within 10 minutes and set after (fake clock); best-status order with DNF + Read; `ReviewDto` author fields and `RereadNumber` 1/2/3; `GET /api/reviews/{id}`; the feed review row carries the new fields. **Where:** `Unit/ReviewRulesTests.cs` (14 cases, with a new `Fakes/FakeTimeProvider`) and `Integration/ReviewsControllerTests.cs` (5 tests against Postgres: the round trip and the rule over HTTP, the author + reread number + 404s, `ReviewedAt` ordering on the Reviews page, the cursor and the book page, the feed flags, and best status on real SQL). The club test now also rejects 3.3 and accepts 3.5. Backend **231 → 250**, all passing.

#### Frontend
- [x] Types: `LogStatus` + `'DidNotFinish'`, `rating: number | null` everywhere, `ReviewDto`, `UserSummaryDto`, `getReview(id)`. `LOG_STATUS_OPTIONS`/`LABELS`. Also `canReview(status)` in `lib/logStatus.ts`, and query key `reviews.detail`.
- [x] `lib/rating.ts` + `StarRating` with half stars (read-only drawing, two halves per star, arrow keys by 0.5, click current to clear, aria labels). Check `RoundRating` and every other user of it. The picker is one keyboard-focusable `role="slider"` (Home/End jump to 0.5/5), with two invisible half-star buttons per star for the mouse. `RoundRating` ignores the "clear" click, since a club rating can be changed but not removed.
- [x] `LogForm`: rating/review/spoiler checkbox only for Read/DNF; DNF "Stopped at page / Date stopped"; the "changing the status will delete your rating and review" warning; the `||spoiler||` hint. Saving now also refreshes every logs and reviews query, so lists and the review page update straight away.
- [x] DNF everywhere: the `ProfilePage` tab; "Stopped" in `MemberProgressBar`, `clubPace` and `ClubNextUpCard`. The bar shows "Stopped at 30%" with no checkpoint marker or pace tag; `isOnTrack` counts a DNF member as not on track; the "What's next" card says "You stopped reading at page N." 
- [x] `lib/spoilerText.ts` (parse with raw positions, strip, segment-aware preview) + `SpoilerText` component; whole-review spoiler cover on cards and the detail page; author sees spoilers uncovered with a badge; `AnnotatableText` works on segments and keeps raw positions. The whole-review cover is a `SpoilerGate` component. `useAnnotatableText` takes `spoilers`/`revealSpoilers` options (review pages only, so a Writing containing `||` is untouched). It renders the text without markers and converts positions both ways (`toRawStart`/`toRawEnd`/`toDisplay`). A covered spoiler stays in the page as a solid block, so positions after it still line up. **Deviation:** in a card preview, a spoiler that would cross the length limit is kept whole and the preview stops after it, rather than being cut and shown as an unrevealable block. Spoilers are short in practice, and this way every covered spoiler can still be revealed.
- [x] `ReviewByline` on `ReviewListItem`, `LogReviewCard`, `ReviewDetailPage` and the feed card; "Reread / 2nd read" badge; "· edited" with tooltip. `ReviewDetailPage` uses `getReview`. The byline also shows a "Didn't finish" badge. **Deviation:** the feed card keeps its existing "@user read *Book*" headline (it already named the author) and gains the stars, reread and edited markers, spoiler handling and an "Open review" link, instead of switching to `ReviewByline`. Review text on the Reviews list is no longer one big link (a spoiler button can't sit inside a link); it has a "Read review" link instead. `LogReviewCard`'s Edit now loads the full log before opening the form, since a `ReviewDto` doesn't carry dates or progress. **Pulled forward from Phase 3 (§3.11):** the "Select any passage to comment on it." hint on the review page.
- [x] Tests: `rating.test.ts`; `spoilerText.test.ts` (plain text, one or several spoilers, unclosed `||`, raw positions, a preview cut never splits a spoiler); `StarRating` (half display, half click, arrow keys, click to clear); `LogForm` (fields hidden for WantToRead, DNF fields, status-change warning sends nulls); a review card (byline, spoiler cover then reveal, reread ordinal, edited); `ReviewDetailPage` (highlighting inside a revealed inline spoiler keeps raw positions). **Where:** `rating.test.ts` (6, including ordinals and reread labels), `spoilerText.test.ts` (7), `StarRating.test.tsx` (4), `LogForm.test.tsx` +4, `ReviewListItem.test.tsx` (2), `FeedItemCard.test.tsx` +3, `ReviewDetailPage.test.tsx` (rewritten, 5: selecting inside a covered spoiler does nothing; after revealing, the comment posts stored positions 9–15 for display 7–13), `MemberProgressBar.test.tsx` +1. Frontend **285 → 315**, all passing.

### Phase 2 — Privacy

#### Backend
- [x] `ReviewVisibility` enum, `Log.Visibility`, `ApplicationUser.DefaultReviewVisibility`. Migration `AddReviewPrivacy` (backfill Public). Apply to the dev database. Both are integer columns defaulting to 0 (Public). Applied: all 40 logs and 71 users are Public.
- [x] `ReviewAccess.CanView` + the repository `VisibleTo` filter; apply it to every surface in §3.6 (reviews endpoints, book page, feed union, `GET /api/logs/{id}` and `?userId=` with review fields nulled, activity strip rating, `CommentService` review target incl. votes and highlights). **How:** `Services/ReviewAccess.cs` (`CanView`, `CanViewAsync`, plus `FollowsAsync` so a whole shelf needs one follow lookup) and `Repositories/ReviewVisibilityQueries.ReviewVisibleTo` (the same rule as a SQL `EXISTS` on `Follows`). `GetByBookIdAsync`, `GetReviewsPageAsync` and the feed union take the viewer. `GET /api/reviews/{id}` → 404 when hidden. `GET /api/logs/{id}` and `?userId=` return the log with rating, text, spoiler flag and review dates nulled. `CommentService` treats a hidden review as missing. **Nothing to change for the activity strip:** it only lists logs with no review text and never sent a rating. **Left as is:** a club's activity feed still shows the rating a member gave *in that club* ("rated it 4★"), because that's a club rating shared with the club, even though it's also copied to their log.
- [x] `Visibility` on create/update (missing → user default on create, unchanged on update; Read/DNF only). `CurrentUserResponse.DefaultReviewVisibility`, `PUT /api/users/me/preferences`. An undefined value → 400. The controller reads the default through a small `UserPreferencesService`, so `LogService` stays free of Identity. **Deviation:** visibility isn't rejected on unread logs. Every log stores one (the default when not given), so a review written after marking the book Read already has the right privacy, and the form only offers the choice for Read/DNF.
- [x] Tests (`Integration/ReviewPrivacyTests.cs`): for each of Public / Followers / Private × author / follower / stranger / anonymous, check reviews list, book page, feed, `GET /api/reviews/{id}` (404 when hidden), `GET /api/logs?userId=` (log present, review fields null); comment thread → 404, comment → 400, vote → 404 on a hidden review; activity strip hides the rating; the account default applies on create, and an explicit value wins. 4 tests: the full viewer matrix over the Reviews list, the book page, the single review, the single log and the shelf; the follower's feed; the comment thread, highlights, commenting and voting on a private review (and a follower using a Followers-only thread); the default, an invalid value → 400, an explicit choice, and update keeping or changing it. The activity-strip check was dropped since it shows no ratings. `BookListsControllerTests` needed the enum converter in its JSON options, because `/api/auth/me` now returns an enum. Backend **250 → 254**, all passing.

#### Frontend
- [x] Types + `updatePreferences`. `LogForm` "Who can see this review?" defaulting from the current user. Badges on your own non-public reviews. The "Review privacy default" select on your own `ProfilePage`. Options are Public / Followers only / Only me (`lib/reviewVisibility.ts`). The badges ("👥 Followers", "🔒 Only you") live in `ReviewByline`, so they appear on the Reviews list, the book page and the review page. The profile setting (`ReviewPrivacySetting`) saves on change and updates the cached current user. `CurrentUserResponse.defaultReviewVisibility` is optional in TypeScript so existing test fixtures didn't all need it. `LogForm` reads the auth context directly, so it still works where nobody is signed in.
- [x] Tests: the form defaults to the account setting and sends the chosen value; badges only on your own non-public reviews; the profile select calls the endpoint. `LogForm.test.tsx` +2, `ReviewListItem.test.tsx` +1, `ReviewPrivacySetting.test.tsx` (1). Frontend **315 → 319**, all passing.

### Phase 3 — Likes, sorting and filtering, rating summary, favourites, discussion counts

#### Backend
- [x] Migration `AddReviewSocial`: `ReviewLikes`, `FavouriteBooks` (§3.7, §3.10). Apply to the dev database. Both cascade with their log/book and user; the unique showcase index is filtered to non-null positions. Applied (new, empty tables).
- [x] Like/unlike endpoints (§3.7). `LikeCount`/`ViewerHasLiked`/`CommentCount`/`HighlightCount`/`AuthorFavourited` in `ReviewDtoMapper`, each one grouped query per page. `POST`/`DELETE /api/reviews/{id}/like` return the updated `ReviewDto`. A log with no review text counts as missing too. New `IReviewSocialRepository` + `ReviewSocialService` hold the social layer, so `LogService`/`LogRepository` stay about logs. `ICommentRepository.CountAllCommentsAsync` returns the total and the highlight count in one grouped query. The mapper now takes the viewer.
- [x] `GET /api/reviews` with sections, filters and page numbers (§3.8); remove the old `GET /api/logs?bookId=` reviews shape once the frontend has switched. Removed, along with the now-unused cursor query (`GetReviewsPageAsync`) and `GetByBookIdAsync`; `GET /api/logs` is shelves only (`userId` required). "Hide short" is a SQL `length(replace(text, '||', '')) >= 100`, which also drops an unpaired `||`. That's close enough for a "skip the one-liners" filter. Popular follows the same "rank everything" rule as list browse, so a quiet week still fills the page.
- [x] `GET /api/books/{openLibraryId}/ratings` (§3.9). In a new `BookReviewsController`. The repository returns every rating on a Read/DNF log of the book, and `ReviewSocialService.Summarize` (static, pure) applies one vote per reader (newest by `CreatedAt`, among non-Private ratings). The viewer's own newest rating is returned whatever its privacy. The average is rounded to 2 decimals.
- [x] Favourites: heart/unheart, showcase replace, `GET /api/users/{username}/favourites`, `ViewerFavourited` (§3.10). `PUT`/`DELETE /api/books/{olid}/favourite` (idempotent; hearting needs a Read log → 400 "Mark it as read first."), and `PUT /api/users/me/showcase` (0–4, no duplicates, favourites only). The showcase is replaced inside a transaction, cleared first and then filled, so swapping two books never trips the unique slot index. **Deviation:** instead of a `ViewerFavourited` field on `LogDto`/the book, there's `GET /api/books/{olid}/favourite` → `{ isFavourite, canFavourite }`, so the button can also say why it's disabled.
- [x] Tests: likes (idempotent, own → 400, hidden review → 404, counts); each section's order (Popular: a like this week beats two old ones), Following → 401 signed out, each filter (exact rating, invalid → 400, hide short counts without `||`, hide spoilers), bookId/userId, privacy still applies; ratings summary (one vote per reader with rereads, Private excluded, average null under 3, histogram buckets incl. 0.5 and 5, viewer rating includes their Private one); favourites (needs a Read log, DNF → 400, unheart removes from showcase, showcase 0–4, non-favourite → 400, order kept); comment/highlight counts. `Integration/ReviewSocialTests.cs` (7 tests, each scoped to its own book). `ReviewsControllerTests`/`ReviewPrivacyTests` moved to the paged endpoint, and the privacy matrix now also covers Popular. Backend **254 → 261**, all passing.

#### Frontend
- [x] `LikeButton` on review cards and the detail page. `LikeButton` now takes either a `listId` or a `reviewId` (with a borderless `compact` look for cards). A new `ReviewSocialBar` shows the button to signed-in non-authors, and a plain "♥ N" to everyone else.
- [x] `ReviewsPage` tabs + filter row in the URL, page-numbered "Load more". The shared pieces are `ReviewTabs`, `ReviewFilterBar` and a `useReviewList` hook; `lib/reviewSections.ts` parses the tab from the URL. The default tab is Recent.
- [x] `BookDetailPage` reviews: "From people you follow" + Popular/Recent + Load more; `RatingSummary` (use the `dataviz` skill) with bars that filter the reviews. Built as `BookReviewsSection` (Popular is the default tab there, as on Letterboxd). The chart has one colour (`--accent`), ten columns with a 2px gap, a 4px rounded top, a hairline for empty buckets, and no axis (only ★ … ★★★★★ end labels). Each whole column is a button and the hit target, with a hover/focus tooltip and an accessible name ("5 ratings of 4 stars. Show these reviews"), so no value depends on hover or colour. Validator: `--accent` has at least 3:1 contrast on all five theme backgrounds. Dark's accent sits outside the categorical lightness band, which doesn't apply to a single-series chart. A selected bar dims the others, and a "Showing 4★ reviews ×" banner clears it.
- [x] Favourites: the heart on `BookDetailPage`, ♥ on review cards, the profile "Favourite books" row with the picker, and the Favourites tab. `FavouriteToggle` (disabled with "Mark it as read to add it to your favourites."), `FavouriteBooksRow` (four large covers; the owner's picker uses checkboxes capped at 4 and ↑/↓ to order). **Deviation:** the picker orders with ↑/↓ buttons only, not drag, which is enough for four items.
- [x] "💬 N · ✎ N highlighted passages" on cards; the "Select any passage…" hint. (The hint shipped in Phase 1.) 💬 counts plain comments and replies; ✎ counts highlight-comments, so the two parts don't overlap.
- [x] Tests: like/unlike + rollback; tabs and filters read from and write to the URL; Following only when signed in; `RatingSummary` (under 3, bars, bar click filters); heart disabled until Read; showcase picker caps at 4 and saves order; discussion counts only above 0. `ReviewSocial.test.tsx` (9), `ReviewsPage.test.tsx` (3), and `BookDetailPage.test.tsx` rewritten (4: chart + bar filter + clear, the following block then tabs). The existing list `LikeButton` tests still cover rollback. Frontend **319 → 333**, all passing.

### Phase 4 — Quick questions, content warnings, "Readers say"

#### Backend
- [x] `ReviewCatalog` + `GET /api/reviews/options`. `Log.Moods`/`Pace`/`Drive`, `LogContentWarnings`. Migration `AddReaderInsights`. Apply to the dev database. `Argos.Domain/ReviewCatalog.cs` also holds the `ReadingPace`/`StoryDrive`/`WarningSeverity` enums and the `LogContentWarning` entity (key `(LogId, WarningKey)`, cascades with the log, reached through `Log.ContentWarnings`). `Moods` is a `text[]` defaulting to `'{}'`. The options endpoint sends a one-day cache header. Applied: all 40 logs start with no answers.
- [x] Request validation and saving (§3.12, §3.13), one save with the log; `LogDto`/`ReviewDto` carry them, and §3.6 nulls them when hidden. A new `Services/ReviewInsights.cs` normalises keys (trim, lowercase), validates them and applies them to the log. The finished-only rule checks the *resulting* answers, so moving a log to an unread status while it still has moods (left out of the update) → 400, and the form sends empty lists instead. Warnings are **diffed** on update (keep, re-grade, remove, add) rather than cleared and re-added, so EF never tracks a deleted and a new row with the same key. Logs are loaded with their warnings wherever they're returned (single log, shelves, review lists). **Deviation:** on update, `Pace`/`Drive` are full-replace (null clears). Only the two lists treat "left out" as "unchanged", because a missing nullable value can't be told apart from a null one in JSON. The form always sends both.
- [x] `GET /api/books/{openLibraryId}/insights` (§3.14). The repository loads the book's non-Private Read/DNF logs with their warnings, and the pure `BookInsightsSummary.Summarize` keeps each reader's newest one. Mood percent = share of mood-answering readers who picked it (top 5, which don't add up to 100). Pace and plot/character use a largest-remainder split that always adds up to exactly 100. Warnings are ordered by top severity (a tie goes to the more severe), then reports. An uncached book returns an empty summary.
- [x] Tests: unknown mood or warning → 400 naming it, more than 3 moods → 400, duplicates → 400, not Read/DNF → 400; missing vs empty on update; insights (thresholds of 3, warnings from 1, one vote per reader, Private excluded, percents add up to 100 per question, severity grouping and order). `Unit/ReaderInsightsTests.cs` (14 cases, including the in-place warning update and the rounding helper) and `Integration/ReaderInsightsApiTests.cs` (3: the round trip, diffing real rows, a 400, private answers withheld from a stranger; the options catalog; insights excluding a Private review, and an uncached book). Backend **261 → 278**, all passing.

#### Frontend
- [x] Types + `getReviewOptions` (long cache time). The optional section in `LogForm`: mood chips (max 3), Pace, Plot/Character/Mix, the content-warning picker with severity. `ReviewQuestionsFields`: a `<details>` that starts open only when editing a review that already has answers. Segmented controls are `aria-pressed` buttons inside a labelled fieldset; clicking the chosen one again clears it. The warning search suggests up to 6 matches it hasn't already added, and new warnings default to Moderate. Labels live in `lib/readerInsights.ts`. Options are cached with `staleTime: Infinity`.
- [x] `ReviewDetailPage`: the author's mood/pace/drive chips and collapsed warnings. `ReviewAnswersSummary`, under the stars; warnings are grouped Graphic → Moderate → Minor inside a `<details>`.
- [x] `ReaderInsights` panel on `BookDetailPage` (use the `dataviz` skill): mood chips with percents, the two stacked bars, collapsed warnings by severity. Each stacked bar is one single-hue sequential ramp (35% / 65% / 100% of `--accent` mixed into `--bg`, so it follows every theme). Plot/character is ordered Plot → A mix → Character so the middle step is the middle answer. Segments have a 2px gap and 4px rounded ends, and zero segments are left out of the bar. A legend always lists every label and percent, and the bar has an `aria-label` with the same values, so nothing relies on colour or hover. The light step has low contrast against the page on purpose, which the visible legend covers. Placed above the Reviews section.
- [x] Tests: mood chips stop at 3, segmented controls clear on second click, the warning picker search/add/severity/remove, the payload; the insights panel hides parts under the threshold and keeps warnings collapsed. `ReaderInsights.test.tsx` (7: the form section ×3 including "no answers for an unread book", the review-page summary ×2, the panel ×2). Fixtures updated for the new fields. Frontend **333 → 340**, all passing.

### Verification & docs (each phase)

**Phase 4 (2026-10-01):** backend 261 → 278 and frontend 333 → 340 tests, all passing; `tsc -b`, the build and `eslint src` clean. Migration `AddReaderInsights` applied to the dev database. **Restart the dev API.** The bundle is now 510 kB (the same warning as in Phase 3).

**Phase 3 (2026-10-01):** backend 254 → 261 and frontend 319 → 333 tests, all passing; `tsc -b`, the build and `eslint src` clean. Migration `AddReviewSocial` applied to the dev database. **Restart the dev API.** No browser check yet. The chart in five themes, the tooltips and the favourites picker especially need a look. **Note:** the main JS bundle is now 502 kB, just over Vite's 500 kB warning. It's still only a warning. Splitting routes with `React.lazy` would fix it and is worth doing separately.

**Phase 2 (2026-10-01):** backend 250 → 254 and frontend 315 → 319 tests, all passing; `tsc -b`, the build and `eslint src` clean. Migration `AddReviewPrivacy` applied to the dev database. **Restart the dev API.** No browser check yet. The two-account privacy check (author plus a follower and a stranger) is a manual step.

**Phase 1 (2026-10-01):** backend 231 → 250 and frontend 285 → 315 tests, all passing; `tsc -b`, the production build and `eslint src` clean. Migration `ImproveReviews` applied to the dev database and checked. **Restart the dev API** to serve the new fields and endpoints. No browser was available, so the click-through below is still a manual step for Phase 1. **Found along the way:** the production build was failing before this work, because `WritingCard.tsx` and `WritingDetailModal.module.css` (both last edited before this session) had a few comment characters (em dashes, a ×) saved in the Windows-1252 encoding instead of UTF-8. They were re-encoded, and no code changed.

- [x] Backend and frontend tests, `tsc -b`, the production build and `eslint src` all passing. Build and test in Release while the dev API is running. Apply the migration to the dev database and check the backfill on real rows. Restart the dev API afterwards. *(All four phases; see the per-phase notes above. Restarting the dev API is up to the user.)*
- [x] **Done 2026-10-06** (Playwright, three accounts, desktop and 390 px, all five themes): half stars by click (3.5) and keyboard (→ 4, ←← 3); spoiler cover for others with "Show anyway", none for the author, and "Hide spoilers"; DNF fields in the form ("Stopped at page", "Date stopped") saved correctly; privacy matrix (followers-only shown to a follower, hidden logged out; private shown to no one else); likes survive a reload; rating chart and "You rated it"; favourites row; "Readers say" with 3+ answers. Fixed along the way: the book page and profile page scrolled sideways on phones (the book grid's `1fr` column grew to the add-to-list select's widest option; the profile's six tabs didn't fit and now scroll in their own row). Filed: `bugs/book-page-subjects-bury-log-button-on-phone.md`. *(Originally: not done for any phase, no browser tool was available.)* A browser click-through if a browser tool is available, otherwise note it as a manual step: half-star picking with mouse and keyboard, spoiler covers, DNF in the form and the club progress bar, the privacy matrix with two accounts, likes, tabs/filters, the rating chart, the favourites row, and the "Readers say" panel, in all five themes at desktop width and ≤640px.
- [x] Re-read this spec against what was built; note deviations inline on each task.
- [x] `CHANGELOG.md` entry per phase; SPEC.md's Logs/Reviews feature line and data model updated (rating scale, DNF, new fields and tables).
