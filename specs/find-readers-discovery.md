# Feature Spec — Find Readers: Discovery, Taste Match & Blocking

**Status:** ✅ Implemented (2026-10-03), all three phases. Each phase is built and verified live before the next starts.

## 1. Problem

The People page (`/people`, "Find readers") only has a username/name search box. Before you type, it shows "Search for a reader above." and nothing else, so it's useless unless you already know someone's username. A backend "people you may know" endpoint already exists (`GET /api/follows/suggestions`, built for the home dashboard), but no page uses it, and it returns nothing for someone who follows no one.

Other book and film sites make finding people a main feature:
- **Letterboxd:** a Members tab of popular, trending reviewers.
- **Goodreads:** a "compare books" tool with a compatibility score.
- **StoryGraph:** "find similar users", AI-suggested buddy reads, and spoiler-free buddy reads.

Readers praise these features. Readers also complain when social features are pushed at them and can't be turned off. This spec turns Find readers into a real discovery page, adds a taste-match score as Toffee's signature social feature, connects discovery to books and clubs, and adds the privacy and safety controls that discovering strangers requires.

## 2. Clarifying decisions made (via questions to the user)

**Page shape**
- **Stacked sections, not tabs.** In this order: Readers like you → People you may know → Popular this week → New readers. Each section shows ~4–6 cards with a "See all" link. Typing in search replaces the sections with search results, so the existing `?q=` URL behavior is kept.
- **Card contents.** Always: avatar, display name, @username, Follow button. Also: currently reading (cover + title), books read this year, mutual follows ("Followed by maya and 2 others you follow"), top 2–3 genres as tags, and the taste match % when there is one.

**Taste match**
- **Minimum 3 books both rated** before a score is shown. Always shown with its basis, e.g. "82% match · 3 books in common", so people can judge how much to trust it.
- **Shown on reader cards and in the profile header** (next to Follow, linking to the compare page). Not on followers/following lists or book-page reader lists.
- **The compare page is its own route**, `/u/:username/compare`, not a profile tab.

**Popular readers**
- **Ranked by likes received in the last 7 days.** Review likes plus list likes. This rewards recent good writing and lets new people break in, unlike all-time follower counts.

**Book page**
- **Two groups: "Readers who loved this"** (rated 4.5–5★) **and "Reading it now"** (status Currently Reading). Within each group, **people you follow come first**.
- **"Start a buddy read" opens the normal create-club flow, prefilled.** The book is already picked, the club is private, and that reader is queued as an invite. You can still rename it or change things before creating.
- **Clubs gain direct invites to a specific user.** Today clubs only have invite links. The invited person sees a pending invite on their Clubs page with Accept/Decline. Argos has no notifications yet, so the Clubs page is where invites show up.

**Filters**
- **Three filters plus mood:** a Fiction/Nonfiction toggle, ~22 curated genres split into fiction and nonfiction groups, a separate **Audience** filter (Adult / Young adult / Middle grade / Children), and the existing **Mood** list.
  - Why curated rather than raw Open Library subjects: the raw subjects are noisy ("Romans, nouvelles", "Reading Level-Grade 12", "Large type books").
  - Why audience is separate: StoryGraph users repeatedly ask for it, because "YA" is an audience, not a genre.
  - Subgenres and tropes are out of scope (see §4).
- **Genre rule:** a reader matches a genre if it's one of their **top 3 genres by books read**.
- **Mood rule:** a reader matches a mood if it's one of their **top 3 most-tagged moods**.

**Privacy and safety**
- **Discoverable by default.** A "Show me in suggestions" setting, on by default, controls whether you appear in every discovery section, in genre/mood browsing, and in book-page reader lists. **Search by username/name always works**, so friends can still find you.
- **"Not interested" hides a suggested person forever** for that viewer. They're still findable by search.
- **Blocking is in scope.** When you block someone:
  - neither of you appears to the other in search, discovery sections, book-page readers, or the home feeds;
  - neither of you can follow the other;
  - any existing follows between you are removed.

**Delivery**
- **One spec, three phases** (§5). Each phase ships and is verified live before the next.

## 3. Design

### 3.1 Shared "reader card" data — `ReaderCardDto`

Every section, search results, and book-page reader lists return the same card shape, so the frontend has one `ReaderCard` component:

```
ReaderCardDto {
  id, username, displayName, avatarUrl,                           // `id`, matching UserProfileDto
  currentlyReading: { openLibraryId, title, coverUrl } | null,   // most recently started CurrentlyReading log
  booksReadThisYear: int,                                         // Read logs with FinishedAt (else CreatedAt) this calendar year
  mutualFollowCount: int, mutualFollowSample: string[] (≤2 usernames),
  likesThisWeek: int | null,                                      // only the Popular section sets it
  topGenres: string[] (≤3 genre keys),                            // added in Phase 3 (§3.7)
  match: { percent: int, booksInCommon: int } | null              // added in Phase 2; null under the 3-book minimum
}
```

*As built (Phase 2):* `match` is on the DTO now. *As built (Phase 1):* `topGenres` and `match` weren't on the DTO yet; each phase adds its own field rather than shipping empty placeholders. There is no `isFollowing`: the card reuses the existing `FollowButton`, which already works this out from the cached "following" list.

A new `ReaderCardService` builds these in batches for a list of user IDs: one query each for currently-reading, year counts, mutuals and top genres, never one query per card. Every discovery endpoint calls it. The existing `UserCard` component stays for places that only need name and avatar.

### 3.2 Phase 1 — discovery endpoints (new `DiscoverController`, `api/discover`)

All require auth, and all exclude:
- the viewer;
- people the viewer already follows (except search);
- people with `IsDiscoverable = false` (except search);
- people the viewer dismissed (except search);
- blocked users in either direction (always, including search).

| Endpoint | What it returns |
|---|---|
| `GET /api/discover/suggested?limit=` | Friends-of-friends: reuses `FollowRepository.GetSuggestedUserIdsAsync`, ranked by mutual count. Returns `[]` for someone following no one; the frontend then hides the section. |
| `GET /api/discover/popular?limit=` | Sum of `ReviewLike` + `ListLike` rows with `CreatedAt` in the last 7 days, on the user's **public** reviews/lists (likes on private or followers-only things don't count), excluding self-likes. Ranked descending. The card also shows "♥ N this week". Users with 0 likes are left out. |
| `GET /api/discover/new?limit=` | Most recent `CreatedAt` users who have logged at least 1 book, so empty test accounts don't show up. |
| `GET /api/users?query=` (existing) | Changes to return `ReaderCardDto` and to exclude blocked users. Still includes non-discoverable and dismissed users. Still works signed out (no mutuals, nobody hidden). |

`limit` is clamped to 1–20, matching the existing suggestions endpoint. "See all" pages use `limit=20`. No pagination yet; it isn't needed at Toffee's size.

### 3.3 Phase 1 — privacy, dismiss, block

- **`ApplicationUser.IsDiscoverable`** (`bool`, default `true`). *As built:* set through the existing `PUT /api/users/me/preferences`, whose fields are now each optional (a field left out keeps its value), rather than a separate endpoint; `/api/auth/me` returns it. The checkbox goes on your own profile page next to the existing `ReviewPrivacySetting` (that's where settings live today). The database default is set in the migration, not with EF's `HasDefaultValue`, which would treat an explicit `false` on insert as unset.
- **`DismissedSuggestion`** entity: `(UserId, DismissedUserId, CreatedAt)`, unique on the pair. `POST /api/discover/dismiss/{userId}` (400 for yourself, 404 for an unknown account). Permanent; there is no undo endpoint in this spec.
- **`Block`** entity: `(BlockerId, BlockedId, CreatedAt)`, unique on the pair.
  - `POST /api/blocks/{userId}` blocks, `DELETE /api/blocks/{userId}` unblocks, `GET /api/blocks` lists who you've blocked.
  - Blocking deletes any `Follow` rows between the two users in either direction, in the same transaction.
  - `FollowService.FollowAsync` refuses (400) if a block exists either way.
  - `IBlockRepository.GetHiddenUserIdsAsync` gives "user IDs hidden from viewer X" (both directions). It is applied to search, every discover endpoint, the home sidebar's `/api/follows/suggestions`, and (Phase 3) book-page readers. *As built:* the home feeds needed no filter, because they only show people you follow, and a block removes follows both ways and prevents new ones.
  - `BlockService` returns the existing `FollowOperationResult`, since both are changes to who's connected to whom.
  - **The blocker's profile is "not found" to the blocked reader** (decided 2026-10-03 after the security review, matching Letterboxd/Goodreads). `BlockService.IsHiddenFromAsync(ownerId, viewerId)` returns 404 from the owner's profile, favourites, shelves (`GET /api/logs?userId=`), lists (`GET /api/booklists?userId=`), reviews (`GET /api/reviews?userId=`) and followers/following lists. It's one-way: the blocker can still open the blocked reader's profile, where Unblock lives. Signed-out visitors still see every profile, and a blocker's reviews still appear on book pages and other people's lists; those are out of scope (§4).
  - The profile page gets a "Block" item in a small ⋯ menu (new shared `OverflowMenu` component), confirmed with a browser prompt like other destructive actions in the app. A blocked person's profile shows "You've blocked this reader" with an Unblock button and none of their content.
  - Migration `AddDiscoveryPrivacyAndBlocks` covers `IsDiscoverable`, `DismissedSuggestions`, and `Blocks`.

### 3.4 Phase 2 — taste match

**Formula.** Take the books both users have rated, counting only ratings the viewer is allowed to see (§3.4.1).

```
match% = round(100 × (1 − average(|ratingA − ratingB|) / 4.5))
```

- 4.5 is the largest possible gap (0.5★ vs 5★). Identical ratings give 100%, and maximally opposite ratings give 0%.
- The formula is chosen because it's easy to explain on the compare page ("on average you rate books 0.6★ apart").
- Fewer than 3 books in common gives `match = null`.

**3.4.1 Visibility.** Ratings are part of the review, so a rating the viewer couldn't see on the review must not count toward the match. The SQL uses the same rule as `ReviewVisibilityQueries`:
- the other user's `Public` ratings count;
- their `Followers` ratings count only if the viewer follows them;
- their `Private` ratings never count.

The viewer's own ratings always count, since it's their own data. Without this rule, the compare page would leak private ratings.

*As built:* the 3-book minimum, formula and visibility rule are as above. With a reread, each reader's **newest** rating of a book is the one used, the same rule as the book page's rating chart.

**3.4.2 Computation.** A new `TasteMatchService`:
- `GetMatchesAsync(viewerId, candidateIds)` — one SQL query. It self-joins `Logs` on `BookId` between the viewer and each candidate, with `Rating IS NOT NULL` and the visibility filter, groups by candidate, and has `HAVING COUNT(*) >= 3`. `ReaderCardService` uses it to fill `match`.
- `GetReadersLikeYouAsync(viewerId, limit)` — the same join, but over all users who have rated any book the viewer rated. It applies the §3.2 exclusions and orders by match % then books in common. Powers `GET /api/discover/like-you?limit=`.
- *As built:* rather than one big self-join, `TasteMatchRepository` runs two queries: the viewer's own ratings, then other readers' ratings on those same books, filtered with the existing `ReviewVisibleTo` rule. The pairing, newest-per-book and scoring happen in memory (`TasteMatchService.Score` is a pure function with its own unit tests). "Readers like you" also leaves out non-discoverable readers and everyone excluded from the other sections.
- Computed on demand, never stored. At Toffee's scale (tens to hundreds of users) the join is cheap. If it gets slow, the fix is a nightly precomputed table (§4), not a different formula.

**3.4.3 Profile header.** *As built:* a sibling call, `GET /api/users/{username}/match` → `{ match }` (sign-in required; 400 for yourself, 404 if they've blocked you). The frontend shows "82% match · 14 in common" next to the Follow button, linking to the compare page. If the match is null it shows nothing. It is never shown on your own profile.

**3.4.4 Compare page — `GET /api/users/{username}/compare`, route `/u/:username/compare`.**

Response:
*As built:* `bothRead` is `bothRated`, meaning books you've both **rated**, since a match is about ratings; the response also carries `them` (their profile). Sign-in required; 400 for yourself, 404 if they've blocked you. The page's shared-books list is sortable by title or biggest difference.

```
{ match, averageGap, bothRead: [book + yourRating + theirRating],
  biggestDisagreements: [top 5 by |gap|, gap ≥ 1.5],
  theyLovedOnYourToRead: [their ≥4.5★ visible ratings ∩ your WantToRead] }
```

Page sections:
1. A header with both avatars, the match %, and the sentence "On average you rate books N★ apart".
2. "Books you've both read", a table with both ratings, sortable by title or by gap.
3. "Where you disagree most".
4. "They loved it, it's on your to-read".

Under 3 books in common, the page says "Rate a few more books in common to see your match", and the lists still show what overlap exists.

### 3.5 Phase 3 — book page readers

`GET /api/books/{openLibraryId}/readers` returns `{ lovedIt: ReaderCardDto[], readingNow: ReaderCardDto[] }`.
- `lovedIt`: logs with `Rating >= 4.5` that are visible to the viewer (§3.4.1).
- `readingNow`: `Status = CurrentlyReading`. Shelf status is always visible per `ReviewVisibility`'s doc comment, but `IsDiscoverable = false` users are still excluded.
- Both exclude the viewer and blocked users. Followed users come first, then by most recent log. Limit 6 each, with "See all" expanding to 20.
- `BookDetailPage` gets a "Readers" section with the two groups. It is hidden entirely when both are empty.
- Each card in "Reading it now" has a **Start a buddy read** button.

*As built:*
- "Loved it" uses each reader's newest visible rating, the same rule as taste match. The endpoint works signed out (public ratings only), since book pages are public.
- "See all" is a "See more readers" button that reloads both groups at 20.
- Reader cards gained an optional `action` slot for the buddy-read button.

### 3.6 Phase 3 — buddy read and direct club invites

**Direct invites (useful beyond buddy reads):**
- `ClubMembershipStatus` gains **`Invited`**. Invited rows are not members: they can't see private content or vote, and they are excluded from member counts and member lists. They show only in an admin's "Pending invites" list.
- `POST /api/clubs/{id}/invites` with body `{ userIds: Guid[] }` (Admin/Moderator only) creates `Invited` memberships. It skips people who are already members or already invited, and refuses blocked users.
- `GET /api/clubs/invites` returns my pending invites (club name, who invited me, the current book).
- `POST /api/clubs/{id}/invites/accept` switches my row to `Active`. `POST /api/clubs/{id}/invites/decline` deletes the row.
- `ClubsDirectoryPage` (the Clubs page) shows a "You're invited" strip at the top with Accept/Decline. Because there are no notifications, a small dot on the Clubs nav item shows when you have pending invites. It comes from the same `GET /api/clubs/invites` call.
- `ClubPage` admin view gets an "Invite readers" button that opens a user picker (search, reusing `searchUsers`).

**Buddy read flow:**
- The button navigates to the create-club page/modal with state `{ bookOpenLibraryId, inviteUserIds: [readerId] }`.
- The form is prefilled: name "Buddy read: {book title}", private, the book shown as a chip, and the reader shown as an invitee chip. All of these are editable or removable.
- `CreateClubRequest` gains optional `InitialBookOpenLibraryId` and `InviteUserIds`. When the book is present, the service creates the club, records the book as the creator's suggestion, and immediately confirms it. That reuses the existing suggest → confirm-book logic, so the first round starts in the `Reading` phase. Invitees are then added as `Invited`.
- All of this happens in one request and one transaction, so a half-created club can't happen.

*As built:*
- **Finish date.** Confirming a book needs at least one checkpoint, and every checkpoint needs a due date. So the buddy-read form asks **"Finish by"** (default: four weeks out), and the club starts with one "Finish the book" checkpoint on that date. Members can add more checkpoints later.
- **The handoff.** The book page sends `/clubs` router state `{ buddyRead: { book, invitees } }`, and the Clubs page opens the existing `CreateClubModal` prefilled. Closing it drops the state, so a reload doesn't reopen it.
- **Where the code lives.** Invites and buddy-read creation are in a new `ClubInviteService` (`ClubService` is already ~1,200 lines). The transaction is `IClubRepository.ExecuteInTransactionAsync`; every repository shares the request's DbContext, so all their saves commit or roll back together.
- **Who sent it.** `ClubMembership.InvitedByUserId` records the inviter (SetNull on delete). `JoinedAt` holds when the invite was sent until it's accepted.
- **Membership checks.** Every existing member check already required `Active`. Two extra changes:
  - opening the invite link, or joining a public club from the directory, accepts a pending invite instead of saying "already a member";
  - role changes now require an Active target.
- **Admin view.** Admins and Moderators see `pendingInvites` on the club detail. "Cancel invite" reuses the existing remove-member endpoint.
- **Limits.** At most 20 invites per request. Unknown accounts, people already connected to the club, and blocked readers (either way) are skipped silently, so one bad ID doesn't fail the rest.

### 3.7 Phase 3 — genres, audience, mood filters

**Catalog.** A new `Argos.Domain/GenreCatalog.cs` holds three lists, each item with a key, a label, and keyword lists matched case-insensitively against `Book.Subjects`:

- **Fiction genres (13):** Fantasy, Science fiction, Mystery, Thriller, Romance, Horror, Historical fiction, Literary, Contemporary, Classics, Graphic novels, Poetry, Short stories.
- **Nonfiction genres (9):** Biography & memoir, History, Science, Philosophy, Self-help, Politics & society, Essays, True crime, Travel.
- **Audiences (4):** Adult (the default when nothing else matches), Young adult, Middle grade, Children.

Fiction/Nonfiction comes from which group a book's genres fall in. A book can be in both groups or neither.

**Stored on `Book`.** `Genres` (`List<string>` of genre keys) and `Audience` (`string`) are computed by `GenreCatalog.Classify(subjects)`:
- whenever a book is cached or refreshed (the Open Library client path and `OpenLibraryCacheRefreshService`);
- for existing rows, by a one-off backfill in migration `AddBookGenresAndAudience`.

Storing them means every "top genres" query is a plain array query, not keyword matching at query time.

Keyword lists are a first pass. Verification includes spot-checking 20 cached books' classifications and tuning the keywords before marking Phase 3 done.

*As built, after the spot-check.*

**What the spot-check found.** Open Library merges subjects from every edition of a work, including comic adaptations and school editions. Popular books have 60–120 subjects, and the first-pass rules gave *Nineteen Eighty-Four* 12 genres, made *Gatsby* a graphic novel and YA, and made *To Kill a Mockingbird* a children's book.

**The tuned rules:**
- Rank genres by how many subjects match, and keep at most **3** per book (StoryGraph's limit). On a book with more than 40 subjects, a genre needs **2** matching subjects.
- Nonfiction genres ignore subjects mentioning fiction, criticism, literature, juvenile, stories or novel. So "American literature, history and criticism" isn't History.
- Subjects mentioning "adaptation" are ignored entirely.
- A book is for **young readers** only when YA/middle-grade/juvenile tags are at least 6% of its subjects (any one tag on a list of 15 or fewer). Within that: YA wins with clear YA tags; school reading levels 4–8 mean middle grade; otherwise children's.

**Result** on the 15 real cached books: one to three plausible genres each, with Hunger Games YA, Fantastic Mr Fox children's, and classics adult. Known quirks, accepted as approximation (reader profiles average across many books): *Moby Dick* counts as fantasy (two subjects say so), and *The Hobbit* counts as graphic novels.

**Backfill.** Existing books are classified at startup by `BookGenreBackfill` (a null `Audience` means unclassified), not inside the migration, because classification is C# code. The migration is `AddBookGenresAndClubInvites`; it also adds `ClubMemberships.InvitedByUserId`. Rules changed after the dev database first ran it, so its books were reset to unclassified once.

**Reader top genres and moods.**
- Top genres: count genres across the reader's `Read` logs' books and take the top 3. These fill `ReaderCardDto.topGenres`.
- Top moods: count `Log.Moods` across all their logs and take the top 3.
- Both are computed on demand in `ReaderCardService` and the browse query.

**Filter endpoint.** `GET /api/discover/browse?fiction=&genre=&audience=&mood=&limit=` returns readers matching **all** given filters:
- genre = in their top 3 genres;
- mood = in their top 3 moods;
- audience = most of their read books are in that audience;
- fiction/nonfiction = most of their read books are in that group.

It applies the §3.2 exclusions and orders by match % when available, then by books read.

*As built:*
- At least one filter is required (400 otherwise), and unknown keys are a 400.
- "Most of their read books" means the plurality audience, and more fiction than nonfiction books (or the reverse).
- Profiles are built in memory from every reader's shelves on each request (`ReaderTasteProfiles`, ties in catalog order). That's fine at Toffee's size; a precomputed table is the fix if it ever isn't.
- `GET /api/discover/filters` serves the genre, audience and mood options (fixed, cached for a day). Reader cards show top genres as labels from it.

**Frontend.** A filter bar under the search box. Choosing any filter replaces the stacked sections with a single "Readers matching…" results list, like search does. Filters are kept in the URL (`?genre=fantasy&mood=dark`) like `?q=`. The genre dropdown shows fiction and nonfiction groups, narrowed by the toggle. Mood options come from `ReviewCatalog.Moods`, served by the existing catalog endpoint the log form uses.

### 3.8 Frontend structure

- `PeoplePage` is rebuilt as search box + filter bar + either search/filter results or the stacked sections.
  - Each section is a `ReaderSection` (title, "See all" link, horizontal card row, a skeleton while loading, and hidden entirely when empty, never "nothing here").
  - "See all" routes are `/people/like-you`, `/people/suggested`, `/people/popular`, `/people/new`, each showing a full list of `ReaderCard`s. *As built:* one `/people/:section` route (`PeopleSectionPage`); "See all" only shows when a section is full. The page's content column is narrow (38rem), so sections are vertical lists of 4, not horizontal rows.
- `ReaderCard` component:
  - has a ⋯ menu with "Not interested" in discovery sections (it optimistically removes the card);
  - has a Follow/Following button that reuses the existing follow mutation and invalidates the discover queries.
- Signed-out visitors get search only, since the sections need an account.
- Brand-new users (follow no one, rated nothing) still see Popular and New, so the page is never blank. "Readers like you" shows a one-line nudge instead. *As built:* "Rate a few more books to find readers who share your taste." It's shown whenever the section is empty, since rating more books is the fix both for new readers and for readers who just have no overlap yet. This is the only section that explains itself rather than hiding.
- Styling follows the existing design tokens in `web/src/index.css`, applied via the `web-design` skill.

## 4. Explicitly out of scope

- **Subgenres and tropes** (e.g. Fantasy → Romantasy; "enemies to lovers"). Open Library keywords can't identify them reliably, so they need readers to tag books themselves. This goes in `FUTURE-IDEAS.md`.
- **Notifications** for invites or new followers. The Clubs-page strip and nav dot stand in until notifications are specced (already listed in `FUTURE-IDEAS.md`).
- **Contacts or social-media friend import.**
- **An undo screen for "Not interested".** Dismissals are permanent per the decision above. They could get a management list later if people ask.
- **Precomputed or cached taste-match tables.** Only if on-demand queries get slow.
- **Blocking effects inside clubs, comment threads and likes.** Blocking covers discovery, search, follows and home feeds; the blocker's profile and its shelves, lists, reviews and follow lists are "not found" to the blocked reader; and the blocker sees the blocked reader's profile as blocked. A blocker's reviews can still turn up on book pages and in other readers' follow lists. Two people who are both in a club still see each other there, and a blocked reader can still like or comment on the blocker's public reviews and lists (in `FUTURE-IDEAS.md`). Signed-out search can't hide anyone, since it has no viewer.
- **Pagination** on "See all" lists (capped at 20).

## 5. Tasks

### Phase 1 — Discovery page, reader cards, privacy & blocking

#### Backend
- [x] `ReaderCardDto` + `ReaderCardService` (batched; `topGenres` empty and `match` null for now)
- [x] Migration `AddDiscoveryPrivacyAndBlocks`: `ApplicationUser.IsDiscoverable`, `DismissedSuggestion`, `Block`
- [x] `IBlockRepository.GetHiddenUserIdsAsync`; `BlocksController` (block/unblock/list); blocking removes follows; `FollowAsync` refuses when blocked
- [x] Apply the block filter to user search and the home sidebar's suggestions (home feeds turned out not to need it, §3.3)
- [x] The blocker's profile endpoints return 404 to the blocked reader (§3.3)
- [x] `DiscoverController`: `suggested`, `popular`, `new`, `dismiss/{userId}`, all with the §3.2 exclusions
- [x] `IsDiscoverable` via `PUT /api/users/me/preferences`; user search returns `ReaderCardDto`
- [x] xUnit tests: exclusions (self, followed, non-discoverable, dismissed, blocked both ways), popular 7-day window and self-like exclusion, block removes follows and prevents re-follow

#### Frontend
- [x] `ReaderCard` (with ⋯ menu: Not interested) and `ReaderSection` components
- [x] Rebuild `PeoplePage`: search results vs stacked sections; "See all" routes
- [x] "Show me in suggestions" toggle on own profile, next to `ReviewPrivacySetting`
- [x] Profile ⋯ menu with Block/Unblock; blocked-profile state
- [x] Vitest: section hiding when empty, search replacing sections, dismiss removing a card, signed-out search only, mutuals wording

### Phase 2 — Taste match, readers like you, compare page

#### Backend
- [x] `TasteMatchService` (formula §3.4, visibility rule §3.4.1, 3-book minimum)
- [x] Fill `ReaderCardDto.match`; `GET /api/discover/like-you`; profile match field
- [x] `GET /api/users/{username}/compare`
- [x] xUnit tests: formula edge cases (identical → 100, 0.5 vs 5 → 0, 2 books → null), Private/Followers ratings excluded correctly, compare lists

#### Frontend
- [x] Match badge on `ReaderCard` and profile header (links to compare)
- [x] "Readers like you" section + "Rate 3 books…" nudge
- [x] `ComparePage` at `/u/:username/compare`
- [x] Vitest: match badge on cards (and its link), the Readers like you nudge, compare page sections, sorting and the under-3 state

### Phase 3 — Book page readers, buddy reads & direct invites, genre/audience/mood filters

#### Backend
- [x] `GenreCatalog` (22 genres, 4 audiences, keywords) + `Book.Genres`/`Book.Audience`; classify on cache/refresh
- [x] Migration `AddBookGenresAndClubInvites` + startup backfill (`BookGenreBackfill`) of existing books
- [x] Fill `ReaderCardDto.topGenres`; `GET /api/discover/browse` with fiction/genre/audience/mood filters
- [x] `GET /api/books/{openLibraryId}/readers` (loved-it + reading-now, visibility, followed-first)
- [x] `ClubMembershipStatus.Invited` + migration; invite / my-invites / accept / decline endpoints; invited rows excluded from member views and counts
- [x] `CreateClubRequest.InitialBookOpenLibraryId` + `FinishBy` + `InviteUserIds`, transactional create → suggest → confirm → invite (`ClubInviteService`)
- [x] xUnit tests: classification on sample subject lists, browse filters, book readers visibility, invite lifecycle, invited ≠ member, buddy-read create in one transaction

#### Frontend
- [x] Filter bar (Fiction/Nonfiction, Genre, Audience, Mood) synced to URL; "Readers matching…" results
- [x] Top-genre tags on `ReaderCard`
- [x] "Readers" section on `BookDetailPage` with "Start a buddy read"
- [x] Create-club form accepts prefilled book + invitees
- [x] "You're invited" strip on Clubs page + nav dot; "Invite readers" on `ClubPage` for admins
- [x] Vitest: filter URL sync, book readers section hidden when empty, invite accept/decline

### Verification & docs (each phase)

Phase 1: driven live in Chromium (Playwright) with `verify_find_*` accounts — sections, dismiss (and it stays gone after reload), search, the checkbox, block → blocked profile → hidden from search → unblock, See all, dark theme and 390px width. Bruno requests added under `bruno/Discover` and `bruno/Blocks`. Phase 3: genre classification spot-checked on every real cached book and tuned (§3.7). Driven live in Chromium:
- the genre filter (results with tags and badges), switching to nonfiction clearing a fiction genre, and Clear;
- a book page's "Reading it now" → Start a buddy read → prefilled form → a club already reading with a "Finish the book" checkpoint and a pending invite;
- signed in as the invitee: the Clubs dot, the "You're invited" strip, then Accept → on the club page, with the admin's pending list empty;
- the filters in dark theme at 390px.

Bruno requests added under `bruno/Discover` and `bruno/Clubs`.

Phase 2: driven live in Chromium with `verify_find_viewer`, `_twin` (94% match) and `_fof` (56%): Readers like you, badges on cards and the profile header, both compare pages (disagreements, "they loved it, it's on your to-read", sort), dark theme and 390px width. Bruno requests added (`Discover/Readers Like You`, `Users/Taste Match`, `Users/Compare`).

Phases 2–3: `reviewer` + `security-review` pass done (2026-10-04). Neither found a private-rating leak or a way for an Invited row to act as a member. Fixed from it:
- **Classification can't take the API down.** A grade like "Reading level-Grade 99999999999", a non-ASCII digit, or a null subject used to throw; Open Library is user-edited, and an exception in the background refresh stops the whole host. The grade regex is now `[0-9]{1,2}`, nulls are skipped, and the refresh loop and startup backfill catch per book.
- **Browse only uses moods from Public reviews.** Moods are private with their review, and the mood filter could reveal a reader's private-review moods. Profiles are the same for every viewer.
- **Blocking cancels pending club invites** between the two readers, in the same transaction.
- **Joining by invite link reports whether you're in.** `POST /api/clubs/join/{token}` returns `{ status }`, so an invited reader who opens a private club's link lands in the club instead of seeing "Request sent". It also refreshes the invites strip and dot.
- **Buddy reads and history.** Creating a buddy read replaces the prefilled `/clubs` history entry, so Back goes to the book page instead of reopening the form and offering a duplicate club.
- **Finish dates west of UTC.** "Finish by" accepts yesterday-in-UTC, so a reader west of UTC can pick their own today.
- **Following refreshes the match**, compare and search caches (Followers-only ratings start or stop counting).
- **Fiction and nonfiction.** A book in both groups now counts for both.
- **Filter URLs** are checked against the real options before a request (a stale `?fiction=nonfiction&genre=fantasy` drops the genre, unknown keys are ignored). The filter bar hides while searching, since search wins.
- **"Rated exactly alike"** now needs a 100% match; average-gap rounding matches the percent's.
- **Genre keywords.** No genre counts a "criticism" subject (so "Literary criticism" isn't Literary), and Science ignores "political science" and "social science". Re-checked on the real books: no regressions.
- **Book-page readers don't show the match badge** (§2), which also saves the match queries there.
- **Smaller fixes.** Simultaneous invites of the same reader no longer give a 500. `GetDiscoverableAsync` moved to the discovery repository. The fixed filter options have their own cache key, so follows and dismissals don't refetch them.

Left as is, for later:
- **Invite spam.** Anyone can create clubs and invite up to 20 readers per request, with no rate limit. That belongs with the rate limits planned in `specs/account-system.md`.
- **Browse and like-you cost.** They read every reader's shelves on each request (accepted at this scale, §3.7).
- **Top-3 ties.** Ties break in catalog order, so fiction genres win ties.

Phase 1: `reviewer` + `security-review` pass done (2026-10-03). Fixed from it:
- Following from a card now refreshes the sections and the sidebar suggestions; blocking also refreshes cached search results and the home feeds.
- "Not interested" cancels in-flight refetches and then refetches, so the next reader fills the gap (and "See all" stays).
- Simultaneous duplicate block/dismiss requests are treated as success instead of a 500. A follow saved at the same moment as a block is undone.
- Popular counts only likes on public reviews and lists.
- "People you may know" has a stable tie-breaker.
- Search no longer returns yourself.
- `/people/constructor` and similar are a 404.
- A blocked reader's profile no longer flashes its content before switching to the blocked state.
- The Follow button shows the server's error (e.g. when the other reader has blocked you).
- Mutuals read "… and 2 others you follow".
- SPEC.md §7 now lists the new columns and tables.

Left as is: the preferences update still lives in `UsersController` (matches that controller's existing pattern); a blocked reader can tell they've been blocked (unavoidable). The open question about profiles was answered: yes, the blocker's profile is "not found" to the blocked reader (§3.3), verified live with two accounts.

- [x] Run the app, then drive the new flows live in the browser with at least two test accounts (not just type-checks and tests)
- [x] Phase 3: spot-check cached books' genre/audience classification and tune keywords (all 15 real books with subjects in the dev database; there weren't 20)
- [x] `reviewer` + `security-review` pass (blocking, visibility leakage in match/compare/readers): Phase 1 on 2026-10-03, Phases 2–3 on 2026-10-04
- [x] Add Bruno requests for new endpoints under `bruno/`
- [x] Update `CHANGELOG.md` as each phase lands; re-read this spec against what was actually built before ticking boxes
