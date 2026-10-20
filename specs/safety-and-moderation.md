# Feature Spec — Safety and moderation

**Status:** Spec written 2026-10-19. Phase 1 done 2026-10-19. Phase 2 done 2026-10-20. Phase 3 done 2026-10-20. Phase 4 done 2026-10-20. Verified 2026-10-20. Roadmap Stage 7 (before the public launch). Size L.

## 1. Problem

At public launch strangers arrive. Today a reader can't tell anyone that a review is abuse or that an account is spam, and even if they could, nobody has the tools to do anything about it. Ratings can be piled onto a book that isn't out yet, by accounts that haven't even confirmed an email. A blocked reader can still like the blocker's lists and reviews and keep talking to them in a shared book club.

What we want before launch:

1. Readers can **report** a review, writing, comment, list or reader, with a reason.
2. The admin has a **queue** of reports and can **hide** a piece of content or **suspend** an account.
3. **Review-bombing rules** stop the cheapest kinds of rating abuse and flag the rest.
4. **Blocks reach everything**: likes and club discussions too.
5. A **community guidelines** page says what isn't allowed, so every decision points at a written rule.

## 2. Decisions (asked 2026-10-19)

- **Admin only.** Moderation uses the existing `Admin` role and `[RequireAdmin]` filter (`specs/invite-requests.md` §3.1). No second Moderator role. One can be added later without changing anything here.
- **A report changes nothing by itself.** Content stays up until the admin decides. One person, or a group, can't get something hidden just by reporting it.
- **Suspending locks the reader out and hides them until the admin lifts it.** Their sessions end, logging in is refused with a "suspended" message, and their profile and content are hidden the same way as an account waiting for deletion (Stage 6's query filters). There's no time limit. They get an email with the reason.
- **Blocks apply in book club discussions** the same way as everywhere else. The two readers don't see each other's checkpoint comments and can't reply to or vote on them. Both stay members. This closes `bugs/blocks-not-applied-in-club-discussions.md`.

Smaller decisions made while writing the spec (not asked; change them if you disagree):

- **Reporting needs a signed-in reader with a confirmed email**, up to 20 reports a day. A reader can only report something they can see, and not their own things. One open report per reader per item: reporting again updates the reason and note.
- **The report keeps a copy of what was reported** (up to 1,000 characters of the text, plus the title or name). If the author edits or deletes it after being reported, the admin still sees what was reported.
- **The admin hears about reports in the bell**, with a new notification type that only admins get, grouped like likes ("3 new reports"). No email.
- **The author is told when something of theirs is hidden**, in the bell and on the item itself ("Hidden by moderators: *reason*. See the community guidelines."). Only the author and the admin can still see it. The reporter isn't told the outcome (later, maybe).
- **Hiding a review also hides its rating** from the book's average and from rating counts. This is how the admin removes a review-bombing wave: a log hidden this way hides the rating even when there's no review text.
- **A hidden comment that has replies** shows as "This comment was hidden by moderators" in its place, so the replies under it stay readable. Without replies it's simply left out.
- **"Reset profile"** for a reported reader: clears the bio and display name and sets the default avatar, for an offensive profile that doesn't deserve a suspension. A username can't be changed by the admin. Suspend instead.
- **The admin can't suspend themselves or another admin.**
- **On a new block, the two readers' likes on each other's things are deleted**, the same way follows are. Existing comments stay in the database but are hidden from each other (as `CommentService` already does).
- **Unpublished books:** we only know Open Library's `FirstPublishYear`, not a date. A book whose year is **later than the current year** can't be rated or reviewed. It can still be shelved, and progress can be logged. A book coming out later this year can't be caught. That is accepted. An unknown year is allowed.
- **A rating wave** is **10 or more ratings of 1 star or less on one book within 24 hours**. An hourly job turns it into a report from "Winged Words" (no reporter) that lists those ratings. The admin can hide some or all of them in one step. At beta size this should never fire, and the numbers are settings (`Moderation:WaveMinRatings`, `Moderation:WaveWindowHours`, `Moderation:WaveMaxRating`).
- **Retention:** a decided report is deleted 1 year after the decision. A reader's reports are deleted when their account is erased, and reports about an erased item are deleted with it. The privacy policy gets a short paragraph about this.
- **A suspended reader who wants their data or their account deleted** writes to `hello@wingedwords.app`. The suspension email says so. No in-app path.

## 3. Design

### 3.1 Blocks reach likes and club discussions

What's checked today (2026-10-19): likes on writings (`WritingAccess`) and on activity events (`ActivityService`) refuse a reader in a block. Likes on **reviews**, **lists** and **reading stories** don't check blocks at all. `CommentService` covers comments and highlight comments on writings, reviews and lists (fixed 2026-10-07). `CheckpointDiscussionService` doesn't check blocks.

- Likes: refuse a like by a reader in a block with the item's owner, either way, with "not found", the same answer as a missing item. Fix this in the access class or service for each of the three missing types.
- `BlockRepository.AddAndRemoveFollowsAsync` also deletes the pair's likes on each other's reviews, writings, lists, reading stories and activity events.
- Checkpoint discussions: leave out comments by a reader in a block with the viewer, and the threads under them (same rule as `CommentService.WithoutBlockedThreads`). Refuse replies, votes and edits anywhere down such a thread. *(Built: a discussion **question** (a prompt) by a blocked moderator stays, since it belongs to the club and hiding it would hide every other member's answers. Only comments, replies and highlights are hidden. A club moderator in a block also can't delete the other reader's comments (404), and the club's Recent activity leaves out what the other reader did.)*
- One integration test per like type and per comment system, run both ways (A blocks B, B blocks A), so a gap can't hide.
- *(Added 2026-10-20, `bugs/block-detectable-in-shared-club.md`: the block must not be detectable. Comment counts and scores match what each reader sees, everywhere; in a shared club a reader who blocked the viewer drops out of the viewer's member list, progress and counts (one-way); discussion questions and suggestions name nobody but their author, for everyone.)*

### 3.2 Review-bombing rules

- **Confirmed email for ratings and reviews.** `LogService` create and update refuse a rating or review text from a reader whose email isn't confirmed. A log without either is still fine. New error code `logs.confirmEmailToRate`. *(Built differently: a rating answers the same 403 `email_not_confirmed` that review text already got, which the frontend already explains. No new code. Both rules apply only to a rating or review that's new or changed, so an older rating re-sent with a page update still passes.)* Club round ratings (`StageClubRatingAsync`) already sit behind `[RequireConfirmedEmail]`, and so does import. *(They didn't: the security review found `RateRound` had only `[Authorize]`. It has the filter now.)*
- **Not before the publish year.** In the same validation, refuse a rating or review when `Book.FirstPublishYear > current UTC year` (`logs.notPublishedYet`). Import keeps the log but drops that rating and review, and the import summary counts it as "skipped rating". *(Built as a row note, `ratingNotPublished`, shown next to the book in the import's lists, instead of a new count.)* Club round ratings follow the same rule.
- **Waves.** `RatingWaveDetector`, a hosted service like the existing clean-up jobs, runs every hour. For each book with `WaveMinRatings` or more logs whose rating is ≤ `WaveMaxRating`, rated in the last `WaveWindowHours`, and no open wave report already, it creates a `Report` with `TargetType = Book` and no reporter. Ratings record when they were last changed (the log history from `_history.StageLogChangeAsync`). The detector reads that history and doesn't add a new column. If the history can't answer "rated in the last 24 hours" cheaply, add `RatedAt` to `Log` in Phase 2's migration. *(Built: it couldn't. Imports record no activity rows and corrections delete rows, so `Log.RatedAt` was added. It moves only when the rating's value changes; older ratings stay null. The wave counts **different readers**, not logs, so re-reads don't add up. A book is skipped while it has an open wave report **or one made within the window**, so a dismissed wave isn't reported again every hour. The detector reads logs with the query filters off, so accounts waiting for deletion still count: otherwise a group could deactivate, wait out the window and log back in with their ratings intact.)*

### 3.3 Reports

Table `Reports`:

| Column | Notes |
|---|---|
| `Id` | |
| `ReporterId` | nullable: null = made by the wave detector. Cascade delete with the reader |
| `TargetType` | `Review`, `Writing`, `Comment`, `CheckpointComment`, `List`, `User`, `Book` (waves only) |
| `TargetId` | the log, writing, comment, list, user or book id |
| `TargetOwnerId` | nullable (null for `Book`); kept for grouping and for "reports about this reader" |
| `Reason` | `Spam`, `Harassment`, `Hate`, `Sexual`, `Spoilers` (unmarked spoilers), `SelfHarm`, `Other`, `RatingWave` (system only) |
| `Note` | optional, up to 500 characters |
| `Snapshot` | title/name + up to 1,000 characters of the text at report time (column 1,200 characters) |
| `CreatedAt`, `Status` (`Open`, `Actioned`, `Dismissed`), `DecidedAt`, `DecidedById` | |

Unique partial index on `(ReporterId, TargetType, TargetId)` where `Status = Open`.

```
POST /api/reports   { targetType, targetId, reason, note? }   → 204
     [Authorize] [RequireConfirmedEmail], 20 per reader per day (a fixed-window limiter keyed by user id)
     → 404 when the target doesn't exist or the reader can't see it; 400 for their own thing
```

The answer is the same whether the report is new or an update, so nothing leaks.

### 3.4 Hiding content

`HiddenAt` (nullable) and `HiddenReason` (the report reason, or `Other` with a short admin note up to 300 characters) on `Log`, `Writing`, `Comment`, `CheckpointComment` and `BookList`.

**One filter, not fifty checks.** Each of those entities' query filter becomes "owner not deactivated or suspended **and** (`HiddenAt == null` or the owner is the current viewer)". The DbContext gets the current viewer's id per request, which is EF Core's documented pattern for filters that depend on the request. EF Core 10's **named query filters** keep the "deactivated" and "hidden" filters separate, so the admin screens can turn off only the hidden one. **Phase 3 starts with the risky check**, as Stage 6 did: confirm that a filter reading a per-request value works with the Feed's `UNION ALL` query and the compiled-query cache. If it doesn't, the fallback is an explicit `HiddenAt` check in each access class (`ReviewAccess`, `WritingAccess`, `BookListAccess`, `CommentService`, `CheckpointDiscussionService`) and in the Feed, search and book-average queries, each with a test.

- A hidden log's rating is left out of the book's average, rating counts and the rating spread, but not from the author's own shelves and stats.
- A hidden comment with replies: the thread builder puts in a placeholder (`isHidden: true`, no author, no text).
- DTOs gain `hiddenByModerators: { reason }` when the viewer is the author, so the frontend can show the notice.
- The author gets a `ContentHidden` notification (Notifications: always on, can't be turned off, like account notices).
- Unhiding is possible from the queue's "Decided" list.

### 3.5 Suspension

`SuspendedAt` (nullable), `SuspensionReason` (up to 300 characters) on `ApplicationUser`.

- All of Stage 6's query filters change from `DeactivatedAt != null` to `DeactivatedAt != null || SuspendedAt != null`, so profile, shelves, reviews, writings, lists, comments, club messages, follows and likes all disappear and come back together. The 30-day erasure job keys only on `DeactivatedAt`, so a suspension never erases anything.
- Suspending deletes all the reader's refresh tokens (every session ends) and queues the suspension email (reason, and that they can write to `hello@wingedwords.app` to appeal or to ask for their data or deletion). Five languages.
- **Login** with the right password answers 403 with error code `auth.suspended`. With a wrong password the answer is the usual one, so suspension can't be probed.
- **Requests with a login token issued before the suspension** are refused within the token's 15 minutes: the JWT `OnTokenValidated` hook checks `SuspendedAt` (one small query per request, the same cost as `[RequireAdmin]`). It answers 401, and the site's refresh then fails with `auth.suspended`.
- A reader who is both suspended and waiting for deletion: logging in doesn't cancel the deletion while suspended (the suspension check comes first).
- Lifting clears both fields and sends no email. Everything comes back.

### 3.6 Admin endpoints

All `[RequireAdmin]` (404 for everyone else), under `/api/admin/`.

```
GET  /api/admin/reports?status=open|decided&page=1
     → { items: [{ targetType, targetId, owner: { id, username, displayName } | null,
                   snapshot, currentText | null (null = deleted), isHidden, ownerSuspended,
                   reportCount, reasons: [{ reason, count }], notes: [string], firstReportedAt,
                   status, decidedAt }], total }
     One row per target (reports grouped). Oldest first for open.
GET  /api/admin/reports/wave/{bookId}   → the ratings in the wave: [{ logId, user, rating, ratedAt, accountCreatedAt, hasReview, isHidden }]
POST /api/admin/reports/dismiss         { targetType, targetId }                → 204 (all open reports on it → Dismissed)
POST /api/admin/content/hide            { targetType, targetId, reason, note? } → 204 (also marks its open reports Actioned)
POST /api/admin/content/unhide          { targetType, targetId }               → 204
POST /api/admin/content/hide-ratings    { logIds: [], reason }                  → 204 (wave: hide many logs at once, max 500)
POST /api/admin/users/{id}/suspend      { reason }                              → 204 (409 already suspended; 400 self or another admin)
POST /api/admin/users/{id}/unsuspend                                            → 204
POST /api/admin/users/{id}/reset-profile                                        → 204
GET  /api/admin/users/suspended?page=1  → the suspended readers, for lifting
```

`targetType` `User` with hide → 400 (suspend or reset instead). Each action writes a line to the log (`ILogger`, admin id, action, target). There's no separate audit table at this size.

### 3.7 Frontend

- **Report** in the "⋯" menu of reviews, writings, comments, checkpoint comments, lists and profiles (not on your own). It opens a small dialog: reason as radio buttons with one-line explanations, an optional note with a character count, a link to the guidelines, and **Send report**. After sending: "Thanks. We'll look at it." Shown only to signed-in readers. An unconfirmed reader sees the "confirm your email" message instead of the form.
- **Admin → Reports** (`/admin/reports`): next to Invite requests in the account menu, with the open count as a badge. It has Open / Decided pills. Each row shows the type, the owner, the snapshot (and "changed since" or "deleted since" when it differs), reasons with counts, the notes (folded), and the date. Actions: **Hide** (picks a reason), **Dismiss**, **Suspend owner** (asks for a reason, then confirms), **Reset profile** (User rows), and **Open** (the item in a new tab). A wave row opens the list of ratings with checkboxes and **Hide selected**.
- **Admin → Suspended** (a tab on the same page): the suspended readers with their reason and date, and **Lift**.
- **Hidden notice**: on the author's own hidden review, writing, list or comment, a quiet banner: "Hidden by moderators: *reason*. Only you can see it. [Community guidelines]".
- **Placeholder** for a hidden comment with replies.
- **Login and refresh**: `auth.suspended` shows "This account is suspended. Write to hello@wingedwords.app if you think this is a mistake."
- **Rating**: for an unconfirmed reader, the stars are disabled with "Confirm your email to rate and review" (with the resend link). For a book from a future year: "You can rate this once it's out."
- **Community guidelines page** `/guidelines` (logged-out too), in all five languages. It covers: be kind to people, argue with books; no harassment, hate or threats; mark spoilers; no spam or self-promotion rings; no sexual content involving minors and nothing explicit outside reviews of the book's content; no impersonation; no rating books you haven't read in order to push them up or down. It also says what happens: hiding, suspension, and how to appeal. Linked from the footer, the report dialog, the hidden notice, the terms of use and the sign-up page's "By signing up you agree…" line.
- **Terms of use**: one paragraph pointing at the guidelines and saying content can be hidden and accounts suspended. **Privacy policy**: reports (what's kept, the 1-year retention).
- Every text through `t('…')` in all five languages. The look follows `DESIGN.md` and the `web-design` skill (shared dialog, segmented control, hairline rows), and it works at phone width.

## 4. Out of scope

- A Moderator role (decided in §2).
- Automatic hiding after N reports (decided in §2).
- Time-limited suspensions (decided in §2).
- Telling the reporter the outcome.
- An appeal form (email only).
- Reporting book clubs, club names and descriptions, or book suggestions. *(Club checkpoint comments are covered.)*
- Blocks for logged-out visitors (`bugs/blocks-only-apply-signed-in.md`, still P3).
- Accepted list collaborators under a block (they keep the list's edit rights, as decided in `bugs/list-invites-ignore-blocks.md`).
- Word filters, image moderation, and IP bans.

## 5. Tasks

### Phase 1 — Blocks reach likes and club discussions (backend) ✅ 2026-10-19

- [x] Block check on likes of reviews, lists and reading stories (either way, "not found"); confirm writings and activity events with tests
- [x] A new block deletes the pair's likes on each other's things (all five like tables, query filters off, in the block's transaction)
- [x] `CheckpointDiscussionService`: hide blocked threads, refuse reply/vote/edit down them
- [x] Tests (`BlocksReachLikesTests`, 12): each like type both ways and without a block; likes gone after a block, a bystander's kept; checkpoint threads hidden both ways, replies, votes and edits refused, the question kept; moderator delete refused; club activity filtered. Checked to fail against the old code (7 of the first 8).
- [x] Close `bugs/blocks-not-applied-in-club-discussions.md`; tick the FUTURE-IDEAS line
- [x] Review: `reviewer` + `argos-security`

#### Review pass (2026-10-19)
- [x] Fixed:
  - **(Security) A club moderator in a block could still delete the other reader's checkpoint comments** by id, and the 204 showed the comment still existed. Now 404 unless it's their own.
  - **(Both) The club's Recent activity still showed the blocked reader's name and avatar.** Filtered in the query, so pages stay full and the cursor stays right.
- [x] Left as is:
  - **A like sent at the very moment of a block can survive it** (the check and the insert aren't in the block's transaction). It needs exact timing, and the bell already hides it. Counts include it until either reader unlikes.
  - **Checkpoint votes cast before a block keep counting** toward a comment's score, and the checkpoint's comment counts include hidden comments. Numbers only, no names.
  - **A soft-deleted "[deleted]" comment by a blocked reader still hides the replies under it**, the same as `CommentService`.
  - **Removing your own vote** has no block check: it only ever removes the caller's own row.
  - **`IsInHiddenThreadAsync` walks up one query per level**, the same shape as `CommentService`; threads are shallow.

### Phase 2 — Review-bombing rules (backend)

- [x] Confirmed email for rating and review text in `LogService` (create, update); the existing 403 `email_not_confirmed` instead of a new code (§3.2)
- [x] No rating or review for `FirstPublishYear > current year` (`logs.notPublishedYet`) in create, update, club round ratings; import drops it and notes it on the row
- [x] `RatingWaveDetector` hourly job + `Moderation` options (`WaveCheckEnabled` too, off in tests). `Log.RatedAt` added. Migration `AddReportsAndRatedAt` builds the `Reports` table (unique open index with nulls not distinct; reporter and owner cascade with the account, decider set null)
- [x] Error codes + `errors.codes` translations; `imports.notes.ratingNotPublished` in all five languages
- [x] Tests (`ReviewBombingRulesTests` 12 unit, `ReviewBombingTests` + `UnconfirmedRatingTests` 5 integration, 2 in `ImportTests`): unconfirmed reader can log but not rate, keeps an older rating; future-year book refused (rating, review, club), shelving still allowed, current-year and unknown allowed; `RatedAt` moves only on a change; import keeps the log without the rating; a wave of 10 readers opens one report, 9 (with a re-read) don't, a second run doesn't duplicate, 1.5 stars and 25-hour-old ratings don't count, a dismissed wave isn't re-reported
- [x] Review: `reviewer` + `argos-security`

#### Review pass (2026-10-20)
- [x] Fixed:
  - **(Security) An unconfirmed reader could rate through a book club round.** `RateRound` had no `[RequireConfirmedEmail]`, despite §3.2 saying so. Added, and listed in `AccountEmailTests.GatedEndpoints_RequireConfirmedEmail`.
  - **(Security) Deactivating hid a wave.** Ten accounts could rate, deactivate, wait out the window and log back in. The detector now reads with the query filters off (test: a deactivated reader still counts).
  - **(Reviewer) Club round ratings refused an unchanged rating on a future-year book**, unlike create and update. Now only a new or changed one.
  - **(Reviewer)** A doc comment that had slipped onto the wrong method.
- [x] Left as is / for Phase 3:
  - **Hidden ratings will still count toward a wave** once Phase 3 hides logs. The 24-hour suppression after a report covers it; Phase 3 should leave hidden logs out of `FindNewRatingWavesAsync` anyway.
  - **`POST /api/reports` (Phase 3) must refuse `Reason = RatingWave` and `TargetType = Book`** from readers.
  - **A reported reader can delete their account to remove the reports about them** (cascade on the owner, as §2's retention says). The admin can suspend first to keep them.
  - Full suite: 1079, one intermittent failure each run in the erasure tests, the known race in `bugs/deleted-user-placeholder-race.md` (passes alone).

### Phase 3 — Reports, hiding, suspension (backend) ✅ 2026-10-20

- [x] **Risky check first:** a per-request viewer id in a named query filter, with the Feed's `UNION ALL` and compiled queries. **Result: it works, no fallback needed.** `ArgosDbContext` takes an `ICurrentViewer` (the JWT's user; `CurrentViewer` in the API) and every filter is now an EF Core 10 named filter: `Owner` (owner waiting for deletion or suspended) on every reader-owned table, and `Hidden` (`HiddenAt == null || UserId == viewer`) on the five content tables. EF turns the viewer into a SQL parameter (`@ef_filter__ViewerId`), so one cached plan serves every reader. `ViewerQueryFilterTests` (4): the Feed's union for two viewers interleaved on one plan, the feed endpoint the same way, the parameter in the SQL, and `IgnoreQueryFilters([Hidden])` keeping the owner filter.
- [x] `Report` repository, `POST /api/reports` (refuses `RatingWave` and `Book`; confirmed email; 20/day, a per-reader fixed window; can-see check; own thing 400; snapshot; upsert while open). *(Built: "can see" uses each page's own rule plus no block either way for content. A blocker can still report the reader they blocked, whose profile they keep seeing. A new report rings every admin's bell; an update doesn't.)*
- [x] `HiddenAt`/`HiddenReason`/`HiddenNote` on the five entities + the `Hidden` filter; ratings out of averages; hidden-comment placeholder; `hiddenByModerators` on `LogDto`, `ReviewDto`, `WritingDto`, `BookListDto`, `CommentDto`, `CheckpointCommentDto`. *(Built: answers that are cached or the same for everyone leave hidden logs out by name, since the filter would let the author's own through: the book's rating summary (`RatingRow.IsHidden`; the author still sees their own rating), "Readers say", author stats, the landing page and popular books, and the wave detector. The two thread queries load hidden comments on purpose and pass them through `HiddenCommentThreads.Apply`. A background job doing one reader's work acts as them (`CurrentViewer.ActAs`): the import worker, so a hidden log still counts as "already on your shelves". The checkpoint reminder reads members' own logs with the hidden filter off.)*
- [x] `SuspendedAt`/`SuspensionReason`; Stage 6 filters extended, and the explicit account checks (profile, follow, club invite, discovery, search, landing, reading likes, new-release notices); sessions end; login 403 `auth.suspended` after the password check; `OnTokenValidated` check; suspension email in 5 languages. *(Built: the refresh tokens are revoked, not deleted, so the site's next refresh can answer 403 `auth.suspended` instead of a plain 401. The problem type is `account_suspended`. Following a suspended reader answers 400 "does not exist", like an account waiting for deletion. The email's button goes to `/guidelines` (Phase 4).)*
- [x] Admin endpoints (§3.6), `ContentHidden` and `ReportReceived` notification types. *(Built: `ReportReceived` is one row per admin (subject `Moderation`, `Guid.Empty`) counting reports since they last read it, added to the unique-per-subject index; it shows while they're still an admin and something is open. `ContentHidden` points at the item (a comment's parent, with `commentId`; a checkpoint comment under its checkpoint) and shows while the item is still hidden. Both can't be turned off. Queue rows carry a `link` (comment parent, club and checkpoint, book) for the page's Open button. Hide on something already hidden only updates the reason; hide-ratings also marks the books' wave reports Actioned. Suspend and reset-profile mark the open reports about the reader Actioned.)*
- [x] Clean-up: decided reports after 1 year (in `InviteRequestCleanupService`, whose loop body is now `RunOnceAsync`)
- [x] Error codes + translations (`reports.*`, `moderation.*`, `auth.suspended`, `server.tooManyReports`); Bruno requests (`bruno/Moderation`, 11)
- [x] Tests (`ModerationTests` 18, `ReportEmailTests` 1, `ViewerQueryFilterTests` 4, one in `ImportTests`, `ReportsController.Create` in the confirmed-email list):
  - report: works and rings the admins' bell, repeat updates, each kind, own refused, can't-see → 404 (private list, missing ids, a block), waves and `RatingWave` refused, unconfirmed refused, 21st in a day refused, snapshot survives an edit and a delete
  - non-admin and logged-out get 404 on every admin endpoint
  - hide: others don't see it (page, feed, Writings, book reviews, rating summary, list browse and profile lists), the author does with the notice and a bell row, rating leaves the average and spread, comment and checkpoint comment with replies → placeholder (replying, voting, reporting refused), unhide restores
  - suspend: profile and content gone, the old token refused at the next request, refresh and login 403 (login only with the right password), email sent, erasure job ignores it, a waiting deletion isn't cancelled, lift restores everything, self/admin/missing reason refused
  - wave hide-ratings; reset profile; the 1-year clean-up; import with a hidden log (checked to fail without `ActAs`)
  - `AdminRoleCollection`: the classes that use admins run one after another, because the role-sync test takes the role from every admin in the shared database
- [x] Review: `reviewer` + `argos-security` (auth, privacy and input: **high effort**)

#### Review pass (2026-10-20)
- [x] Fixed:
  - **(Both) A block above a comment the admin hid went unnoticed** when replying to, voting on, editing or reporting a reply further down by id: the walk up the thread used the filtered lookup and stopped at the hidden comment. Both comment systems now walk with `GetThreadAncestorAsync` (Hidden filter off, never shown). Test `BlockAboveAHiddenComment_StillRefusesActingOnTheThread`, checked to fail without the fix.
  - **(Security) Erasing a club's creator could hand the club to a suspended member.** The successor query now ranks suspended members last too.
  - **(Reviewer) The front page's caches kept a hidden or suspended reader's things** for up to 10 minutes. Hide, hide-ratings and suspend now clear the landing showcase and popular books.
  - **(Reviewer)** Hide-ratings decides the reports in two statements instead of one per log; the two daily clean-ups no longer hold each other back when one fails; a comment in `ActivityRepository` now says a review hidden by its privacy keeps its activity row and a log the admin hid doesn't.
- [x] Left as is:
  - **Hiding and suspending aren't one transaction.** If marking the reports fails after the hide is saved, the author isn't told and the reports stay open until the admin acts again. Rare, and visible in the queue.
  - **Hide-ratings decides the whole wave** even when the admin hid only some ratings: hiding some is the decision on it.
  - **A reader who asked for deletion before being suspended is still erased after 30 days**, and the reports about them go with the account (§3.5, Phase 2 note). The admin should look at such a report before then.
  - **Any reason is accepted with any hide** (`RatingWave` on a comment, `Other` without a note); the admin page will offer sensible ones.
  - **Refresh looks up the token and the reader twice** (the suspension check, then the rotation). One page load each, cheap.
  - **Comment counts leave hidden comments out** while the thread shows a placeholder with replies, so a count can be one lower than what's on screen.
  - **A suspended reader's name stays on pending club invites they sent**, as for an account waiting for deletion.
  - Full suite: 1105, one intermittent failure in the erasure tests, the known race in `bugs/deleted-user-placeholder-race.md` (passes alone).

**Notes for Phase 4:** the bell needs sentences for `ReportReceived` (`actorCount` = new reports) and `ContentHidden` (subject kind + title); an unknown type renders an empty row today. Login and refresh answer `type: "account_suspended"`. Placeholders are `isHidden: true` with an empty `username` and `content`.

### Phase 4 — Frontend ✅ 2026-10-20

- [x] Read `PRODUCT.md`, `DESIGN.md`; a short plan per the `web-design` skill
- [x] API client + hooks (`api/reports.ts`, `api/admin.ts`, `hooks/useOpenReportCount.ts`)
- [x] Report menu item + dialog on the six places. *(Built: a shared `Modal` (focus trap, Escape on the window's capture phase so it doesn't also close the writing overlay, focus back to the "⋯", rendered through a portal, a bottom sheet on phones with the buttons pinned). `ReportMenu` (a "⋯" holding only Report) on reviews (in `ReviewByline`: review page, review lists, the book page's review cards), writings (`WritingDetailModal`), comments and highlight comments, checkpoint comments; `useReport` adds the item to the list's and the profile's existing menus, the profile's also when the reader is blocked. Never on your own things or signed out. Reasons in `lib/reportReasons.ts`; "Unmarked spoilers" isn't offered for a reader.)*
- [x] `/admin/reports` (Open / Decided / Suspended, actions, wave view), menu link with badge. *(Built: one raised card of hairline rows like the invite requests page; the snapshot split into title, a review's stars (the API's "Rating: x/5" line) and text (`lib/reportQueue.ts`); "What it says now" and the reporters' notes folded; Hide (starts on the most-reported reason, a note required with "Something else"), Dismiss (asks), Suspend (reason, then a confirmation that quotes it), Reset profile (asks), Unhide in Decided, View (new tab). No filled green on the page. One answer at a time; a decided row leaves its list at once (the lists then reload, for the offset paging) and focus moves to the next row; a suspend from a content row keeps the row, now "Owner suspended". The admin's own things have no Suspend.)*
- [x] Hidden notice, hidden-comment placeholder, `auth.suspended` on login/refresh, disabled rating states. *(Built: the refresh's 403 `account_suspended` is a new `suspended` outcome in `api/client.ts`; the session ends and the login page shows the reason, also on page load. The admin's note shows with any reason, and is the reason with "Something else". Locked stars (`RatingLock`, `lib/ratingLock.ts`) in `LogForm`, `QuickLog` and `RoundRating`; the review text is read-only too. The future-year line shows only where the book's year is known (the book page's log form); elsewhere the API's `logs.notPublishedYet` message says it. The bell's sentences for `ReportReceived` and `ContentHidden` (a comment by what it was on).)*
- [x] `/guidelines` page, links from the footer, report dialog, notice, terms and sign-up; terms + privacy paragraphs, all five languages. *(Built in `LegalPage`, whose section texts now go through `Trans`, so the terms link the guidelines. The sign-up line "By signing up you agree…" didn't exist; added under the form.)*
- [x] Vitest for the dialog, the admin page actions and the rating states (`ReportDialog` 8, `AdminReportsPage` 13, `RatingLock` 5, `HiddenNotice` 4, `reportQueue` 6, plus suspension in `client.test` and `AuthContext.test`, and the bell sentences)
- [x] Screenshot critique round, then `design-reviewer`. *(My round: Suspend in each row from a red outline to red text, the count line as one phrase, the dialog's hover only with a real pointer, the phone sheet's buttons pinned. `design-reviewer`: **fix**, then **ship** after the inline questions and folds lost their wells (the No-Nesting Rule), the row link "Open" became "View" (it clashed with the Open tab), "Acted on" shows only when no Hidden or Suspended pill says it, and a wave's duplicate reason pill went.)*
- [x] Review: `reviewer`

#### Review pass (2026-10-20)
- [x] Fixed:
  - **The admin's note was dropped unless the reason was "Something else"**, though the Hide panel offers it for every reason. Now shown after the reason.
  - **Focus fell out of the report dialog after sending**, and Tab could then leave it: the answer and the form share one `Modal`, whose focus runs once. They're keyed apart now, and the trap pulls stray focus back in.
  - **Suspending from a Decided reader row** removed it locally, then it came back (only open reports are decided). It stays now; focus falls back to the row when its Suspend button goes.
  - **A wave's "Hide N ratings"** counted ratings just hidden. It counts only those still hideable.
  - **A text selection dragged out of the note closed the dialog.** It closes only on a click that starts and ends outside.
  - **The dialog could be contained by the writing overlay** (container queries make a containing block). It renders through a portal now, and stops React passing its clicks up to the overlay.
  - An unrelated reformat of the invite requests page reverted; an unsupported `aria-invalid` on the reasons' fieldset removed.
- [x] Left as is: a review's snapshot keeps the API's English "Rating:" line in the data (the page reads it as stars); the hidden review answers the existing "Couldn't load this review" like a deleted one.
- [x] Filed: `bugs/log-form-overflows-on-phone.md` (the book page's log form is 25px wider than a 375 screen; there before this phase).

### Verification

- [x] `browser-check` with three readers and an admin: report a review → it appears in the queue and the bell → hide → reporter and others don't see it, author sees the notice → unhide *(2026-10-20: the queue and its menu badge, hide, the author's notice and two bell rows, a hidden comment's placeholder with its reply, unhide; a seeded wave's ratings listed and chosen. The admin's own bell row wasn't seen live (the seeded reports came before the test admin had the role); Vitest covers its sentence and link)*
- [x] Suspend a reader logged in elsewhere → their next action logs them out with the suspended message → lift → all back *(2026-10-20: sent to the login page with the reason; a login with the right password refused with it; their profile "User not found" for others; logged in again after the lift)*
- [x] Block inside a shared club: checkpoint comments gone both ways; likes between them gone *(2026-10-20, three readers in one club, the block made from the profile's "⋯": each lost the other's comments and the replies under them, the bystander still saw all six; the pair's likes on a review and a list deleted, the bystander's kept, a new like refused with 404; also at 375. The discussion's count still includes the hidden comments, which gives the block away: filed as `bugs/block-detectable-in-shared-club.md`, fixed the same day)*
- [x] Unconfirmed reader can't rate; a future-year book can't be rated *(2026-10-20: the unconfirmed reader's locked stars and resend; next year's book shows locked stars with "You can rate this once it's out." and a read-only review at 1280 and 375, a book from 2020 doesn't; the API refuses its rating with `logs.notPublishedYet` and still shelves it as Want to read)*
- [x] Phone width and two themes for the dialog and the admin page *(Paper and Dark, 1280 and 375)*
- [x] `testing/moderation.md` with the `test-plan` skill *(82 steps; the count question became `bugs/block-detectable-in-shared-club.md`)*
- [x] Tick Stage 7 in `ROADMAP.md`, `CHANGELOG.md` line
