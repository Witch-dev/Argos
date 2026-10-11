# Feature Spec — Private accounts and follow requests

**Status:** 🔨 Backend (Phase 1) and frontend (Phase 2) built and reviewed 2026-10-11; verification (Phase 3) not started. Roadmap Stage 8. **Must ship before public launch.**

## 1. Problem

Every reader's shelves are public today, including reading progress and progress notes. Only reviews and (since Stage 2b) single books have a visibility setting. A stranger who finds the site can read everything a reader has logged, and "followers only" protects nothing, because anyone can follow anyone with one click.

This spec adds an **account-level switch** (public or private) and **follow requests**, so a reader can decide that only people they approve see their reading life.

## 2. Decisions

Asked 2026-10-11, all five answered with the recommended option:

- **Existing followers stay approved** when an account turns private. Only new follow attempts need approval.
- **The stricter rule wins** where an account and a single book disagree. A book is shown to someone only if both the account and the book allow it. A *public* book on a private account is still hidden from non-followers; a *followers* or *private* book on a public account behaves as it does today.
- **New accounts are public**, as today. The switch is in Settings.
- **Private accounts stay findable by name** in search and "readers to follow", with only their name and avatar shown, so people can request to follow them. *(Built: Popular readers and New readers leave them out, since there is nothing public to rank or show; "like you" and Browse use only the content the viewer may see, so a stranger gets no match.)*
- **Pending requests are a list in Settings** with approve / decline and a count badge. The bell (Stage 5) can plug into the same data later; email is not used.

Decided while writing the spec (change any of these before building):

- **Pending requests live in their own table**, not as a status on `Follows`. `Follows` stays "approved follows", so every query that already reads it (feeds, counts, per-book visibility, blocks) stays correct without being touched. Approving a request moves it into `Follows`.
- **What a stranger sees on a private account:** username, display name and avatar, a "This account is private" note and the Follow / Requested button. Not the bio, the follower and following counts or lists, shelves, journal, reviews, writings, lists, goal or stats.
- **Going public again approves every pending request**, since there is nothing left to approve. Followers are kept.
- **The owner can remove a follower** (new; today only blocking does this). Without it a private account can't undo an approval by mistake. The removed reader can ask again at once; the owner can decline that or block them.
- **A requester can cancel their own request.** Declining is silent: the requester keeps seeing "Requested" for a day (asking again changes nothing), then the button returns to "Follow" and a new request reaches the owner. *(Changed in review: the first build answered "ask again tomorrow", which told the requester they were declined.)*
- **Blocking removes requests** in both directions, as it already removes follows.
- **Clubs are not covered.** Joining a club is a choice to be seen by its members, so a private reader's name and avatar show there. What a private reader's *reading* shows to club members is the separate open bug `bugs/club-progress-ignores-reading-visibility.md`; this spec makes that bug's fix follow the same rule.

## 3. Design

### 3.1 The rule, in one place

A private account is equivalent to "every audience is at most *Followers*". So the existing visibility checks gain one input, whether the owner's account is private, and apply it as a ceiling:

```
effective audience = narrower of (the item's own setting, the account's setting)
account public  → the item's own setting
account private → Public becomes Followers; Followers and Private stay as they are
```

This is added in the two places that already own the rules and are tested against the same table of cases (`ReviewVisibilityQueries` in SQL, `ReadingAccess` / `ReviewAccess` in C#, `LogVisibilityRuleTests`), plus one new helper for things that have no per-item setting today (writings, lists, activity). One helper means one place to be wrong.

### 3.2 Data

- `AspNetUsers.IsPrivate` (bool, default `false`).
- **Table `FollowRequests`:** `Id`, `RequesterId` (FK, cascade), `TargetId` (FK, cascade), `CreatedAt`; unique on (`RequesterId`, `TargetId`). Deleting either account removes the request (the erasure job needs no new code).
- **A declined request is kept**, with `DeclinedAt` set, hidden from the owner, so the requester can't ask again for a day. Asking again after that reuses the row. *(Built: the entity is `FollowRequestRecord`, because `Argos.Api.Dtos.FollowRequest` is already the body of `POST /api/follows`.)*

### 3.3 API

```
PUT    /api/users/me/preferences             { isPrivate }       (the switch lives with isDiscoverable; going public approves every waiting request)
POST   /api/follows                          { followeeId } → { state: "following" | "requested" }
DELETE /api/follows/{userId}                 → 204   (unfollow, or take back an unanswered request)
GET    /api/follows/requests                 → [{ id, user, createdAt }]   (the owner's waiting requests)
GET    /api/follows/requests/count           → int   (the badge on Settings)
GET    /api/follows/requested                → [userId]   (who I've asked, so a Follow button can say "Requested")
POST   /api/follows/requests/{id}/approve    → 204
POST   /api/follows/requests/{id}/decline    → 204
DELETE /api/follows/followers/{userId}       → 204   (remove a follower)
GET    /api/users/{username}                 → { …, isPrivate, relationship: "self"|"following"|"requested"|"none", canSeeContent }
```

- The profile payload (`ProfileDto`) gains `isPrivate`, `relationship` and `canSeeContent`, and **omits the bio** when the account is private and the viewer isn't approved for it. The favourites, journal, goal, match and compare endpoints and the followers / following lists answer 404 to such a viewer.
- Anything a viewer can't see is reported as missing (404), never forbidden, as the reading and review rules already do.
- New error messages get codes in `ErrorCodes.cs` and a translation under `errors.codes` (CLAUDE.md).

### 3.4 Where it applies (audited 2026-10-11)

Every place that reads another reader's content was checked in the code. Most go through two shared SQL filters (`ReadingVisibleTo`, `ReviewVisibleTo`) and their C# twins (`ReadingAccess`, `ReviewAccess`), so the ceiling is applied once, inside them.

| Surface | Rule it uses | What changed |
|---|---|---|
| Shelves `GET /api/logs?userId=`, one log, journal, finished-books rows, favourites, readers of a book, "like you" and Browse, taste match and compare | `ReadingVisibleTo` / `ReviewVisibleTo` | Ceiling inside the helpers |
| Readings strip, story likes and comments | `ReadingVisibleTo`, `ReadingAccess.CanViewStoryAsync` | Unchanged for followers: an approved follower passes any ceiling |
| Reviews: pages, a single review, review likes and comments, the Feed | `ReviewVisibleTo`, `ReviewAccess` | Ceiling inside the helpers |
| Writings: list, popular, by id, likes, comments, highlights | **none before** | New `VisibleTo` filter and `WritingAccess` check |
| Lists: by id, a reader's lists, challenges | `ListAccessService` | Public and Unlisted lists of a private account go to the owner, collaborators, invitees and approved followers |
| Lists: browse, tags, popular tags, "lists with this book", list likes in Popular readers | `DiscoverableLists` and friends | Private accounts' lists are left out |
| Activity events on lists (a stranger could like one by id) | public-list check only | **Gap fixed:** the ceiling applies to list events too |
| Popular readers, New readers | checked `Public` directly | **Gap fixed:** private accounts left out |
| Mood profiles behind Browse | checked `Public` directly, no viewer | **Gap fixed:** takes the viewer; private accounts' moods hidden from non-followers |
| Profile header, followers and following lists, favourites, journal, goal, match, compare | public | Gated by `AccountPrivacy.CanSeeAccountAsync`; bio hidden |
| Landing showcase (switched off) | discoverable readers | Private accounts excluded |
| Book-page rating average and "readers say" | anonymous aggregate of followers-level and public logs | **Left as is:** nobody can be identified from them |
| Reader cards' "followed by X, Y" | mutual follows | **Left as is:** shows only people the viewer already follows, as other apps do |
| Clubs | club membership | Out of scope (§2) |
| Data export | the owner's own | Unchanged |

## 4. Tasks

### Backend

- [x] **Audit** every surface (§3.4, done 2026-10-11): three gaps found and fixed (list events, Popular/New readers, mood profiles); writings were the one surface with no rule at all.
- [x] `IsPrivate` on the user, `FollowRequests` table, migration `AddPrivateAccounts`. *The dev database needs `dotnet ef database update` (and the API a restart).*
- [x] The rule helper (§3.1): `ReviewVisibilityQueries.PrivateOwnersHiddenFrom` in SQL and `AccountPrivacy` in C#, applied in `ReadingAccess`, `ReviewAccess`, `WritingAccess`, `ListAccessService` and the activity, discovery, list and landing queries.
- [x] Follow flow: follow / request / cancel / approve / decline / remove follower / auto-approve on going public; blocks clear requests; once-a-day re-request.
- [x] Profile payload that omits private data for strangers (`ProfileDto`).
- [x] Error codes and their translations (two new messages, five languages).
- [x] Tests: `LogVisibilityRuleTests` runs the same table for a private account; `AccountPrivacyTests` covers shelves, writings, lists, profile, followers lists, search, popular/new, list events, and the whole request flow.
- [x] `reviewer` and `argos-security` after the phase. Findings fixed: a private bio leaked through other readers' followers / following lists and the blocked list (fixed: bio hidden unless the viewer is the owner or an approved follower); a request could outlive a block through a race and be approved later (re-check after insert, blocked pairs skipped in both approve paths); concurrent approve / decline / go-public threw 500s (now idempotent); a request landing as the account turned public could wait forever (approved on the next read); block-then-unblock reset the one-day wait (a block now clears only waiting requests); list collaborator endpoints answered 403 instead of 404 (now use the ceiling); the Following tab of Browse hid followed private readers' lists; a partial index on `IsPrivate`.

### Frontend

- [x] Settings → Privacy & data: a "Private account" switch (`PUT /api/users/me/preferences { isPrivate }`) with a short explanation of what strangers will and won't see. **Turning it off asks first, showing how many waiting requests will be approved** (security review: going public lets every waiting request in for good).
- [x] Settings → **Follow requests**: list with approve / decline, a count badge on the Settings entry, an empty state.
- [x] Profile for a stranger of a private account: the locked state with the Follow / **Requested** button (Requested cancels on click).
- [x] Follow buttons everywhere they appear (cards, discovery, lists of readers) show Follow / Requested / Following. `POST /api/follows` now answers 200 `{ state }` instead of 204, so the client call and its type change; `GET /api/follows/requested` lists who the reader has asked.
- [x] A "Remove follower" action on the followers list of your own profile.
- [x] Translations in all five languages for every new text, including `aria-label`s. *(Phone width and all five themes are part of the Phase 3 browser pass.)*
- [x] `reviewer` after the phase. Findings fixed: a stray favourites request on a locked profile (and the tab now resets between profiles), a stale request row after a failed approve, silent remove-follower errors, the Follow button flashing back after a click, the "Requested" label not containing its visible word, and a logged-out visitor on a locked profile now gets "Log in to follow".

### Verification

- [ ] Browser pass with three readers (owner, approved follower, stranger) on every surface in §3.4; `testing/account-privacy.md` written with `/test-plan`.
- [ ] Re-read this spec against what was built before ticking tasks (CLAUDE.md).
- [ ] CHANGELOG line; tick Stage 8 in `ROADMAP.md`.

## 5. Out of scope

- Hiding a private reader's name from club members (§2).
- Per-follower lists ("close friends") and muting.
- Making existing followers re-approve.
- Notifications and emails for requests (Stage 5 can add the bell).
- A "request to follow" on public accounts.
- Moderation of abusive repeated requests beyond the once-a-day limit and blocking (Stage 7).
