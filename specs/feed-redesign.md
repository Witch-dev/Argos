# Feature Spec — Feed Redesign (Posts fold into Writings, one composer, filters, activity rows)

**Status:** ✅ Implemented (2026-10-05), all three phases

**Supersedes:** `specs/book-posts.md` (the `Post` entity and its composer are removed; existing posts become Writings) and the "Posts" tab from `specs/writings-and-annotations.md` §3.5. Builds on `specs/writings-and-annotations.md`, `specs/writing-feed-card-and-modal.md`, `specs/reviews-improvements.md` (likes, Popular, visibility) and `specs/reading-stories.md` (Readings strip). Read those first.

## 1. Problem

The home area has four tabs: **Feed**, **Writings**, **Reviews**, **Posts**. After using them:

- **Posts duplicate Writings.** A Post is a short Writing that must have a book. It also has fewer features than a Writing: no likes, no comments, no editing, and no way to delete it (`PostsController` only has create and list). Posts don't show on book pages or profiles either.
- **Two composers.** The Feed stacks two prompts ("What's up?" for a Post, another for a Writing), so you have to pick a content type before you start writing.
- **The tabs don't follow one rule.** Feed means "people I follow". Writings and Posts mean "everyone". Reviews has both (Popular / Recent / Following).
- **Your own posts don't show in your Feed.** The feed query only includes people you follow, so writing something from the Feed's composer gives no visible result.
- **Feed cards can't be used from the feed.** There's no like and no comment count. Writings have no like at all (only comment voting).
- **New readers see an empty Feed.** With no follows it just says "Nothing here yet".
- **A lot of reading activity is invisible.** Rating a book without writing a review, finishing or abandoning a book, starting one, or making a list never reaches the Feed.

**What we compared against (2026-10-04 research):**
- **Goodreads:** users complain that the feed is no longer in time order and hides friends' reviews. They ask for a "Reviews only" setting (it exists) and install browser extensions to filter further. They particularly dislike seeing every review a friend *liked*.
- **Letterboxd:** a time-ordered feed of people you follow, including rating-only entries. Activity filters are a paid Pro feature.
- **StoryGraph:** when users asked for a Fable-style community feed, others pushed back: they don't want "a firehose of all kinds of content" and want it calm.
- **Fable:** the most-liked book feed ("Instagram for books"). It mixes reviews, reading updates and posts.
- **Substack:** short **Notes** for quick thoughts and conversation, long **Posts** for depth. Two lengths of the same writing tool, not two separate systems.
- **Bluesky:** people value a time-ordered feed of accounts they chose. Threads keeps pushing users back to its algorithmic feed, and people dislike that.

**What this means for Argos:** keep the Feed time-ordered and limited to people you chose, make it filterable, offer one composer with two lengths, and add reading activity in a compact, grouped form so it doesn't turn into a firehose.

## 2. Clarifying decisions made (via questions to the user)

- **Posts fold into Writings.** `Post` is deleted. The 5 existing posts become Writings with no title. The Posts tab goes away; `/posts` redirects to `/writings`.
- **The title becomes optional.** A Writing **without a title is a short note**, limited to **1000 characters** (same as Posts today). **With a title** it's a full piece, up to 50,000 characters as today.
- **Short notes get likes and the normal comment thread, but no highlight-comments.** Posts were left out of highlights before because they're too short to highlight usefully. Titled Writings keep highlights.
- **Writings get likes.** This applies to both notes and titled pieces.
- **One composer.** A single "What are you reading or thinking?" prompt replaces both.
- **Tabs: Feed is for people, the other tabs are for discovery.**
  - **Feed:** people you follow **plus yourself**, all types, newest first, with filter chips **All · Reviews · Writings · Activity**. The chip is stored in the URL.
  - **Writings:** gets **Popular · Recent · Following**, like Reviews.
  - **Reviews:** unchanged.
- **Your own items show in your Feed:** reviews, writings and activity rows.
- **Starter feed:** if you follow **fewer than 3** readers, the Feed shows your follows' items first, then a "Popular this week" block and reader suggestions underneath.
- **Feed cards show a like button and a comment count** for reviews and writings.
- **Activity rows (one-line entries) are in scope now** for these events:
  - **Started reading** a book.
  - **Finished** a book, or **did not finish (DNF)** it, with the rating attached if there is one. A rating-only entry ("rated ★4") is this same row.
  - **Made a public list.**
- **Activity comes from a new history table** that records an event at the moment it happens. Logs only store their current state, so "started Dune" would otherwise disappear once you finish it. Notifications can reuse this table later.
- **A one-time back-fill** creates history from existing data, so the Activity filter isn't empty at launch.
- **Grouped per person per day:** "Ana finished 3 books", with small covers, expandable. The day is the viewer's local day.
- **Activity rows can be liked, but not commented on.** In a grouped row, each book has its own like.
- **Privacy follows the log's existing visibility setting** (Public / Followers only / Private, from `specs/reviews-improvements.md` §3.6). A Private log produces no visible rows. List rows only appear for public lists. Blocks hide rows in both directions.
- **Changing a rating updates the existing row.** The row shows the new rating but keeps its original time, so edits don't move it back to the top.

**Decisions made while writing the spec (not asked; change any of these before starting):**
- **A rating attaches to the Finished/DNF row.** Ratings are only allowed on Read/DNF logs, so a separate "Rated" event isn't needed. A rating added days after finishing updates that row and keeps the finish time.
- **Activity rows are hidden while the log has review text.** The review card already shows the status and rating, so showing both would duplicate them. If the review text is later removed, the row comes back.
- **No "Want to read" rows.** You didn't choose them, and they're the noisiest event on Goodreads.
- **No "X liked Y" rows,** ever. This is the Goodreads complaint.
- **No duplicate rows when someone switches back and forth.** Moving a log into a status with an event of that type for the same log in the last 24 hours doesn't create a new event.
- **You can't like your own writing or activity row.** This matches reviews (it stops people boosting themselves into Popular).
- **Writings Popular = most likes in the last 7 days.** This is the same rule and the same paging as Reviews Popular.
- **"Started reading" appears in both the Readings strip and the Feed's activity rows.** The strip is "what's happening now"; the Feed is the history. If it feels repetitive in use, we can hide Started rows from **All** and keep them under **Activity** only.
- **A note can become a titled piece by adding a title when editing.** Removing a title is only allowed if the text is ≤1000 characters and the piece has no highlight-comments. Otherwise the request is rejected with 400.

## 3. Design

### 3.1 Data

**`Writing.Title` becomes nullable.** `null` = note. An empty or whitespace-only title is stored as `null`.
- Validation in `WritingService` (create and update): `Title == null` → `Content` ≤ 1000. `Title != null` → `Title` ≤ 200 and `Content` ≤ 50,000. Postgres check constraint as a second line of defence: `title IS NOT NULL OR char_length(content) <= 1000`.
- `Kind` (Original/Quote) and the book/source rules are unchanged. A short quote with no title is allowed.
- `CommentService` rejects a highlight-comment (anchor set) on a Writing whose `Title` is null → 400.

**New `WritingLike`** — `WritingLikes(writing_id, user_id, created_at)`. Primary key is `(writing_id, user_id)`. Same shape as `ReviewLike`: cascade-deleted with the writing or the user.

**New `ActivityEvent`**:

```
ActivityEvents(id, user_id, type, log_id, book_id, list_id, rating, created_at, updated_at)
```

- `Type` enum: `StartedReading`, `Finished`, `DidNotFinish`, `ListCreated`.
- `LogId` + `BookId` are set for the three log types. `ListId` is set for `ListCreated`. A check constraint makes sure exactly the right one is set.
- `Rating` (`numeric(2,1)`, nullable): only on `Finished`/`DidNotFinish`, copied from the log.
- `CreatedAt` is when the event happened and is never changed. `UpdatedAt` changes when the rating is updated.
- FKs: `UserId`, `LogId`, `ListId` → cascade delete (deleting a log or list removes its rows). `BookId` → restrict, same as `Log`.
- Index `(user_id, created_at desc)` for the feed query.

**New `ActivityLike`** — `ActivityLikes(activity_event_id, user_id, created_at)`. Same shape as `WritingLike`.

**Migration `FoldPostsIntoWritings`:** copies every `Posts` row into `Writings` (same `Id`, `Title = null`, `Kind = Original`, `BookId`, `CreatedAt`, `UpdatedAt = CreatedAt`, `IsEdited = false`), then drops `Posts`. `Down` recreates an empty `Posts` table and does not move data back (accepted: 5 rows in dev, nothing in production).

**Migration `AddActivityEvents`** (tables + back-fill SQL):
- Each log with status `Reading` → `StartedReading` at `StartedAt ?? CreatedAt`.
- Each log with status `Read` / `DidNotFinish` → `Finished` / `DidNotFinish` at `FinishedAt ?? ProgressUpdatedAt`, with `Rating`.
- Each list → `ListCreated` at `CreatedAt`. Visibility is checked when the feed is read, not here, so a list made public later still appears.
- Back-filled rows keep their original dates, so they sit deep in the timeline instead of flooding the top.

### 3.2 Recording events — `ActivityRecorder`

A small service that `LogService` and `BookListService` call in the same save as the change itself. Each rule is a few lines:

- **Log created or status changed** to `Reading` → `StartedReading`. To `Read` → `Finished`. To `DidNotFinish` → `DidNotFinish`. Skip if the same log already has an event of that type with `CreatedAt` in the last 24 hours (the switching-back-and-forth rule).
- **Rating set or changed** on a `Read`/`DNF` log → update `Rating` and `UpdatedAt` on that log's newest `Finished`/`DidNotFinish` event. If there isn't one (shouldn't happen after the back-fill), create it.
- **The quick "mark as finished" path** (`LogService` line ~203, creates or updates a Read log) → `Finished`, same rules.
- **List created** → `ListCreated`. This happens whatever the list's visibility is, because it's checked when the feed is read.
- `Want to read` → nothing.
- **Added in review (2026-10-05):**
  - A log's rating is copied to **all** its finished/DNF rows whenever it changes (including when it's cleared by going back to Want to read), so an old row can't keep a rating the reader took back.
  - A finished/DNF row created in the last 24 hours is **removed** when the status changes to something else (a mis-click corrected: Read → DNF, or Read → Reading). "Started" rows always stay, since starting and finishing on one day is real.
  - A book logged after the fact is **dated when it happened**: if the picked `FinishedAt` (or `StartedAt` for "started") is more than a day ago, the row uses that date instead of now, so adding old books doesn't flood followers' Feeds. Picked dates are stored as midnight UTC, so they're placed at **midday** UTC to stay on the same calendar day for viewers anywhere from UTC−11 to UTC+11. A follow-up migration (`ShiftBackfilledActivityToMidday`) moved the back-filled rows the same way.

### 3.3 Feed query and API

`GET /api/feed?filter=all|reviews|writings|activity&tz=Europe/Madrid&before=&beforeId=&pageSize=20` (authenticated) replaces `GET /api/feed/reviews`. `/api/feed/activity` (the Readings strip) is unchanged.

The authors are the viewer plus everyone they follow, minus anyone in a block with the viewer in either direction.

The query moves out of `PostRepository` (which is deleted) into a new `FeedRepository.GetPageAsync`. It is still one `UNION ALL`, ordered by `(CreatedAt desc, Id desc)` and paged by cursor, as today. **As built:** reviews and writings stay one UNION query, and the activity groups are a second query (`ActivityRepository.GetGroupsAsync`); both fetch their newest `pageSize + 1` rows after the same cursor and are merged in memory, which gives the same page as one query would:

- **Reviews:** unchanged (`ReviewVisibleTo`, `CreatedAt = ReviewedAt ?? CreatedAt`).
- **Writings:** as today, plus a `Title` that can be null.
- **Activity groups:** one row per `(UserId, local date of CreatedAt in tz)`. The local date comes from `EF.Functions.AtTimeZone` (Npgsql), so the grouping happens in the database. The group's `CreatedAt` is its newest event's time, and its `Id` is that newest event's id (used for the cursor). Only events that pass these checks are counted:
  - log events: the log passes `ReviewVisibleTo(viewer)` **and** has no review text;
  - list events: the list is `Public`.
- `filter` keeps only the matching branch(es).
- `tz`: an IANA time zone name, checked with `TimeZoneInfo.TryFindSystemTimeZoneById`. If it's missing or invalid, UTC is used.

Then a second query loads the events behind the activity groups on that page (same filters, same day window), along with their book cover/title or list title and their like counts.

**`FeedItemDto`** (replaces `FeedContentItemDto`): today's fields, and:
- `Kind`: `"Review" | "Writing" | "ActivityGroup"` (`"Post"` is removed).
- `Title`: null for a note.
- `LikeCount`, `ViewerHasLiked`, `CommentCount` for reviews and writings.
- `ActivityGroup`: `{ Day: "2026-10-04", Events: [{ Id, Type, BookOpenLibraryId?, BookTitle?, BookCoverUrl?, ListId?, ListTitle?, Rating?, CreatedAt, LikeCount, ViewerHasLiked }] }`, newest first.

**`FeedPageResponse`** gets `FollowingCount` on every page (one cheap count). The frontend uses it for the starter block (§3.6).

**Known edge, accepted:** if someone does something new on a day that's already loaded, their group moves to the top on the next refresh. While scrolling, older pages may still hold the previous version of that group. The frontend removes duplicate groups by `(userId, day)` and keeps the newest one.

**Other endpoints:**
- `POST` / `DELETE /api/writings/{id}/like` → 200 with the updated `WritingDto` (same as review likes). `POST` / `DELETE /api/activity/{id}/like` → 204. Both: 400 on your own item, 404 if the item is missing or the viewer isn't allowed to see it (same visibility checks as the feed; writings have no visibility setting yet).
- `GET /api/writings?section=popular|recent|following` (default `recent`, `userId=` filter kept). Popular = likes in the last 7 days, ties broken by most recent, same paging as `ReviewSocialService`'s Popular. `WritingDto` gets `LikeCount`, `ViewerHasLiked`, `CommentCount`.
- `PostsController`, `PostService`, `IPostRepository`/`PostRepository`, `PostDto`, `CreatePostRequest` and `FakePostRepository` are deleted.

### 3.4 Composer

`ComposerPrompt` replaces `PostComposerPrompt` and `WritingComposerPrompt`: your avatar plus "What are you reading or thinking?". It appears on the Feed and Writings tabs and opens `WritingComposerModal`, which is extended:

- **Note mode first:** an optional book (shared `BookPicker`), a text box, and a character counter that appears from 800 characters (`812 / 1000`). Post is disabled when the text is over 1000.
- **"+ Add title"** shows the title field and raises the limit to 50,000. "Remove title" puts it back.
- **"This is a quote"** is a toggle (it replaces the separate kind picker). It shows the existing source choice: a book, or typed text.
- On submit, the feed and writings query keys are refreshed. Because you're in your own Feed now, the new item appears at the top.
- `PostComposerPrompt` / `PostComposerModal` (+ CSS and tests) are deleted.

### 3.5 Feed cards

- **`NoteCard`** (a writing without a title): avatar, name, time, optional "about *Book*" / "Quoted from …" line, then the text (clamped to 6 lines with "… more"). No square image slot. Clicking it opens `WritingDetailModal`.
- **`WritingCard`** (titled): unchanged.
- **Review card:** unchanged.
- **`ActivityGroupCard`:** one line for a single event ("**Ana** finished *Dune* ★4", with a small cover). For several events: "**Ana** finished 2 books and started 1", a row of small covers, and a "Show" button that expands one line per event. Each line has its own small ♥. A list event links to `/lists/{id}`.
- **`FeedSocialBar`** under review, writing and note cards: `LikeButton` (extended with a `writingId` target) plus a 💬 count that opens the item.
- **`WritingDetailModal`** for a note: same layout, but text selection doesn't start a highlight, and the title row is hidden. It gets a like button.

### 3.6 Feed page

- Filter chips **All · Reviews · Writings · Activity** under the composer, stored as `?filter=` (no parameter means All), using the same URL pattern as `ReviewsPage`. Each filter has its own React Query key.
- The time zone is read once from `Intl.DateTimeFormat().resolvedOptions().timeZone` and sent as `tz`.
- **Starter block** (when `FollowingCount < 3`): after the last feed item, or straight away if the feed is empty, show:
  - **"Popular this week":** top 3 reviews (`section=popular`) and top 3 writings (`section=popular`), with the same cards;
  - the existing `SuggestedAccounts` component (`/api/discover/suggested`), titled "Readers to follow".
  - Under the Activity filter, the starter block is just the suggestions.
- When the feed runs out and you follow 3 or more people: "You're all caught up."
- Empty messages per filter ("Nobody you follow has written anything yet.", etc.).

### 3.7 Writings page and tabs

- `SectionTabs`: Feed · Writings · Reviews (Posts removed). `/posts` → `<Navigate to="/writings" replace />`.
- `WritingsPage`: `ComposerPrompt`, then Popular · Recent · Following tabs. `ReviewTabs` is generalised into `SectionSubTabs<T>` and `parseReviewSection` into a shared helper. `?section=` lives in the URL. `WritingListItem` renders a note like `NoteCard`, and both show a `FeedSocialBar`.

## 4. Explicitly out of scope

- **Notifications** ("Ana liked your note"). The `ActivityEvents` table is a natural starting point, but notifications are their own spec (SPEC.md Phase 2, `FUTURE-IDEAS.md`).
- **Comments on activity rows** (the user chose likes only).
- **Writings on book pages and profiles.** Posts never showed there either. Added to `FUTURE-IDEAS.md`.
- **An algorithmic "For you" feed.** The Feed stays in time order. Popular lives in the Writings and Reviews tabs.
- **Activity for clubs** (joined a club, club picked a book). Could be added later as new `ActivityEvent.Type` values.
- **Image uploads** on notes (already in `FUTURE-IDEAS.md`).
- **Account-level privacy** for writings (already in `FUTURE-IDEAS.md`).

## 5. Tasks

Three phases. Each one ships and is checked live on its own, then gets a `reviewer` + `security-review` pass, with the findings fixed before the next phase starts.

### Phase 1 — Posts fold into Writings, one composer, writing likes ✅ (2026-10-05)

#### Backend

- [x] `Writing.Title` nullable, length rules in `WritingService` (create + update, including the add/remove-title rules from §2), check constraint `CK_Writings_NoteLength`.
- [x] Migration `FoldPostsIntoWritings` (§3.1): copy Posts → Writings, drop `Posts`. It also creates `WritingLikes`, so there's no separate `AddWritingLikes` migration. Applied to the dev database: the 5 posts are now notes with the same ids and dates.
- [x] Deleted `Post`, `PostsController`, `PostService`, `PostOperationResult`, `IPostRepository`/`PostRepository`, `PostDto`, `CreatePostRequest`, `FeedContentKind.Post`, `FakePostRepository` and the Post tests. The feed query lives in `FeedRepository`, with no behaviour change; `FakeFeedRepository` replaces the fake.
- [x] `CommentService`: highlight-comments on untitled writings → 400 (`TargetContentLookup.AllowsHighlights`).
- [x] `WritingLike` entity, like/unlike endpoints (200 + `WritingDto`, like reviews), `LikeCount`/`ViewerHasLiked`/`CommentCount` on `WritingDto` and on feed items (reviews and writings).
- [x] Found while building: deleting a Writing left its comments behind. `WritingService.DeleteAsync` now removes them.
- [x] Tests: note length limits (service and database constraint), add/remove title, highlight rejection on notes, comment cleanup on delete, writing likes (own refused, missing → 404, counts, anonymous view), feed counts. Full suite 332/332. The migration's data copy was checked against the dev database rather than in a test (testing a past migration needs a database at the previous schema).

#### Frontend

- [x] Types: `title: string | null`, no `'Post'` kind, like and comment fields. Deleted `api/posts.ts`, `PostListItem`, `PostsPage`, `PostComposerPrompt`/`Modal`.
- [x] `ComposerPrompt` + `WritingComposerModal` note-first mode, counter from 800 characters, "+ Add title" / "Remove title", "This is a quote" toggle (§3.4). `BookPicker` gets an `autoFocus` prop so the optional book field doesn't take focus from the text box.
- [x] Notes are rendered by `WritingCard` itself (title `null` → no image slot, no title, 6-line preview, the text opens the note) instead of a separate `NoteCard`: the author line, attribution and "more" are shared. `FeedItemCard` and `WritingListItem` use it.
- [x] `LikeButton` `writingId` target, and it now takes refetched values; `FeedSocialBar` on review, writing and note cards; like in `WritingDetailModal`; notes show plain text (no highlight selection); the edit form's title is optional.
- [x] `SectionTabs` without Posts; `/posts` → `/writings`.
- [x] Comment, reply, delete and highlight-comment mutations refresh the feed, Writings and review lists (`lib/commentCounts.ts`), so 💬 counts behind the modal stay right.
- [x] Tests: composer modes, counter and limits, note card and opening it, social bar (others / own / review), likes staying in sync after a refetch, note detail view, clearing a title on edit, redirect. Full suite 377/377; type-check, lint and build clean.

#### Verification & docs

- [x] Live check with Playwright (desktop light, phone dark; two fresh accounts `verify_feed_viewer` / `verify_feed_friend`): tabs and `/posts` redirect; one composer; friend's note in the Feed as a note card; like; comment through the modal; selecting text in a note opens no highlight panel; the note counter blocks Post over 1000 until a title is added; a note and a titled piece posted; the migrated posts visible on Writings; own note promoted to a piece, back to a note, then deleted; liking and commenting in the modal updates the card behind it; no phone overflow. Found and fixed: a `<div>` (avatar) inside a `<p>` in `WritingCard` (React warning when the author has no avatar image; it was there before).
- [x] `reviewer` + `security-review`. No security issues. Fixed: like buttons kept stale values after a refetch, comment counts didn't refresh, short notes could only be opened through 💬, comments were deleted before the writing (now the other way round so a failure can't lose comments), `FeedService` duplicated `WritingService`'s counts, stale `Post` references in docs. Not fixed (accepted, low): removing a title and adding a highlight at the same millisecond could leave a note with a highlight; no locking for it.
- [x] `CHANGELOG.md`; `specs/book-posts.md` marked superseded; `SPEC.md` data model; `FUTURE-IDEAS.md` privacy idea notes that likes and comments must check writing visibility.

### Phase 2 — Feed: you included, filters, starter block, Writings tabs ✅ (2026-10-05)

#### Backend

- [x] Feed authors = viewer + follows − blocks (both directions). New `WritingAccess` applies the same block rule to `GET /api/writings/{id}`, writing likes and every comment path on a writing (create, reply, edit, vote, thread, highlights) — all 404/"not found", never 403. The Writings list leaves out readers in a block too. Signed-out visitors still see every writing (writings have no visibility setting yet).
- [x] `GET /api/feed?filter=all|reviews|writings` (other values → 400) replaces `/api/feed/reviews`; `FollowingCount` on every page. The DTO kept its name, `FeedContentItemDto`, instead of becoming `FeedItemDto`; Phase 3 can rename it when it adds the activity-group shape. `tz` is left for Phase 3, the only thing that needs it.
- [x] `GET /api/writings?section=popular|recent|following` (+ `page` for Popular, `NextPage` in the response). Following without signing in → 401.
- [x] Review fixes: the Feed fetches one extra row to know whether another page exists (an exact multiple of 20 no longer offers an empty "Load more"); review lists also leave out readers in a block when signed in (the starter block shows popular reviews); `page` is capped at 1000 for Writings' and Reviews' Popular (a huge value overflowed into a negative OFFSET → 500); Writings' "this week" uses the injected `TimeProvider`.
- [x] Tests: your own items appear, a followed reader in a block doesn't (even if a follow row survives), each filter and a bad one, follow count, paging across reviews and writings against the real query (including an exact final page), Popular ranking and page 2, Following needs sign-in, blocks hide a writing's detail, likes, comments and list entries, blocked reviewers left out of review lists. Full suite 339/340 — the one failure is the unrelated `Browse_MatchesTopGenre…` discovery test, which breaks once the shared `argos_test` database has collected enough readers from earlier runs (fixed the same day: the test database is now reset each run, 340/340).

#### Frontend

- [x] `api/feed.ts` → `getFeed({ filter, … })`; query keys `feed.list(filter)` / `feed.lists()` and `writingsSection.list(section, userId)` / `writingsSection.all()`; every invalidation moved to the new prefixes.
- [x] Filter chips (URL `?filter=`), per-filter empty messages, "You're all caught up".
- [x] Starter block (`FeedStarter`) using `FollowingCount`. Two changes from §3.6, found in the live check: "Popular this week" only shows items with at least one like that aren't yours (a quiet week otherwise listed the newest items, including the note you just wrote), and the readers come from the popular-readers discovery section titled "Readers to follow", because mutual-follow suggestions are empty for someone who follows nobody.
- [x] `ReviewTabs` → `SectionSubTabs`, `reviewSections.ts` → `listSections.ts`; Writings Popular / Recent / Following in `?section=`. Popular pages are de-duplicated by id (likes between "Load more" clicks can move an item onto the next page).
- [x] Review fixes: following or unfollowing refreshes the Feed and Writings (following 3 readers from the starter block now swaps it for the real feed immediately); writing, editing or deleting a review refreshes the Feed (deleting also refreshes review lists); blocking refreshes Writings and review lists.
- [x] Tests: chips and URL, starter block below 3 follows and gone at 3+, unliked/own items left out of the starter, per-filter empty message, Writings tabs with page-numbered Popular and signed-out fallback. Full suite 382/383 — the one failure is `ReaderInsights.test.tsx`'s mood test hitting the 5 s timeout under full-suite load; it passes alone (7/7 in under 3 s). Tracked in `bugs/mood-test-times-out-under-load.md`.

#### Verification & docs

- [x] Live check with Playwright (desktop light, phone dark, a fresh account): starter block with "Popular this week" and "Readers to follow"; own note at the top of your own Feed; after following 3 readers the starter goes and "all caught up" shows; Reviews / Writings chips show only their kind and survive a reload; Writings tabs in the URL; Following shows only followed readers' writings (checked against alice_reads) and 401 signed out; following 3 readers from the starter block updates the Feed without a reload; no phone overflow. The test account was deleted afterwards.
- [x] `reviewer` + `security-review`: no high or medium findings; fixes listed above. Accepted (informational): blocks apply only while signed in (a signed-out visitor sees all writings, so a blocked reader can confirm a block by comparing); blocks don't apply between two commenters on a third reader's writing (same as reviews and lists).
- [x] `CHANGELOG.md`; open findings filed in `bugs/` (logout cache, blocks while signed out, blocks between commenters, Popular query cost).

### Phase 3 — Activity rows ✅ (2026-10-05)

#### Backend

- [x] `ActivityEvent` + `ActivityLike` entities, migration `AddActivityEvents` with the back-fill SQL (§3.1). Back-fill on the dev database matched exactly: 46 reading logs → 46 "started", 31 read → 31 "finished", 13 lists → 13 "made a list". Follow-up migration `ShiftBackfilledActivityToMidday` (see §3.2 "Added in review").
- [x] `ActivityRecorder` (`IActivityRecorder`) called from `LogService` (create, update, club rating) and `BookListService` (create, copy), staged into the same SaveChanges (§3.2), plus the review additions in §3.2.
- [x] Activity groups in the Feed (time-zone grouping via `TimeZoneInfo.ConvertTimeBySystemTimeZoneId` → Postgres `AT TIME ZONE`, since Npgsql has no `EF.Functions.AtTimeZone`), visibility, hidden while a review exists, public lists only, merged with reviews/writings in memory (§3.3 "As built"); `filter=activity`; `tz` must be an IANA name or UTC (else UTC). The DTO kept the name `FeedContentItemDto`, with `Kind = "ActivityGroup"` and an `Activity` field.
- [x] `POST`/`DELETE /api/activity/{id}/like` → 204. Liking: own → 400, invisible/blocked/missing → 404. Unliking always works (it only removes your own like), even once the event is hidden from you.
- [x] Tests (`Integration/ActivityFeedTests.cs`, 11): recorder rules (24 h duplicate rule, rating update keeps time, removed rating leaves no old row showing it, mis-click correction, start and finish on one day, back-dated finish at midday, Want to read ignored, lists recorded, deleting a log removes its rows), grouping and visibility (private log, reviewed log, private list hidden; All also shows the review), a day split by the viewer's time zone and an unknown zone falling back to UTC, likes (own, private, blocked, unlike while hidden). Full suite 349/349.

#### Frontend

- [x] `ActivityGroupCard` (single sentence, grouped summary with covers and "Show all N", per-event ♥), `lib/activitySummary.ts` ("finished 2 books and started 1"), duplicate rows removed by `(userId, day)` across pages, Activity chip, `tz` sent from `Intl`, starter block under Activity = readers only.
- [x] `LikeButton` `activityEventId` target.
- [x] Review fixes: creating, copying or deleting a list and rating in a club refresh the Feed.
- [x] Tests: `ActivityGroupCard.test.tsx` (single, list, grouped + expand, own, like), `activitySummary.test.ts`, `FeedPage.test.tsx` (tz sent, a repeated reader-day row shown once, Activity starter). Full suite 392/393 — the one failure is the known slow test (`bugs/mood-test-times-out-under-load.md`).

#### Verification & docs

- [x] Live check with Playwright (desktop light and phone dark, `Europe/Madrid`, two fresh accounts): a friend's day as one row ("finished 1 book, started 1 and made a list"), "Show all" lists each with stars and ♥, a like saved on the right event, the Activity chip, making the finished log private removes it from the row, no phone overflow; back-filled history of a followed reader (farid_k) shows as dated rows. Found and fixed: a list line in an expanded row wasn't aligned with the book lines. Test accounts deleted afterwards.
- [x] `reviewer` + `security-review`: no high findings. Fixed: ratings on older finished rows, unliking a hidden event, back-dated logs dated "today", mis-click rows, back-filled rows a day early west of UTC, stale Feed after list/club actions, own-event like said 404. Filed in `bugs/`: the grouped query reads whole histories (P2), a time zone .NET knows but Postgres doesn't → 500 (P3), the Readings strip lacks the block safety net (P3).
- [x] `CHANGELOG.md`; `SPEC.md` data model (`ActivityEvents`, `ActivityLikes`); `FUTURE-IDEAS.md` (Writings on book pages/profiles; notifications can build on `ActivityEvents`).
