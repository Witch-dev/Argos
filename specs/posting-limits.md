# Feature Spec — Posting limits

**Status:** built 2026-11-04 (§5 says what changed after the reviews). One phase, size M.

## 1. Problem

A "rate limit" caps how many requests one person can send in a stretch of time. The app has them on login, search, imports, exports, reports, feedback, missing-book requests, adding to lists (`ListContributionsPolicy`) and club chat (`ClubChatPolicy`). It has none on anything else a reader writes: writings, comments, checkpoint comments, logs and reviews, likes, votes, follows, creating clubs and lists, or invites.

`specs/app-hardening.md` §4 put this off ("nothing suggests abuse yet") while the app was invite-only. Sign-ups are open now (2026-11-04), so one spam account or script could fill the feed, or send a reader hundreds of notifications in a minute.

## 2. Decisions (mine, for the user to confirm)

- **Per reader, not per address.** Every one of these endpoints needs a login, so the count is by account. Readers on the same network or phone carrier don't share a budget. A request without a valid login isn't counted at all, so `[Authorize]` answers 401 and the app refreshes the session (a shared-address bucket would have handed a reader whose token just expired a 429 instead).
- **Generous enough that a real reader never sees them.** The aim is to stop floods, not to slow anyone down. Each number is several times what a busy reader does.
- **Five buckets, by what the action costs other readers.** ASP.NET gives an endpoint one policy, so each endpoint goes in exactly one bucket. Endpoints that already have a policy (list contributions, club chat, the Open Library-backed suggestion and confirm-book, reports, feedback, invites by code) keep it.
- **Sliding windows** (as club chat), so a burst across a window's edge isn't let through twice. ASP.NET's sliding window sends no `Retry-After`; the message says how long to wait instead.
- **Editing and deleting count where they're cheap to abuse:** editing a writing or comment counts with posts (an edit can change what readers see), unlike and unvote count with reactions (like/unlike toggling). Deleting your own things, leaving, declining, marking notifications read, settings and blocks are not limited: they only take things away, and blocking must never be refused.
- **The message says what happened and when to try again**, in all five languages. Forms already show the server's message. A refused like or vote undoes itself without a message, as any failed like does today; with these numbers only a script gets there.
- **Counts are in memory, per server**, like every limit today. There's one API copy. `FUTURE-IDEAS.md` already notes moving all counters to Postgres if there are ever two.

| Bucket (policy) | What's in it | Limit | Message (`server.*` code) |
|---|---|---|---|
| **Posts** (`posts`) | Writing create and edit; comment create and edit (writings, reviews, lists, readings: `annotation-comments`); checkpoint and club-discussion comments (`CheckpointsController.CreateComment`, `CommentsController.Edit`); edits to text members or the public see: a list's title and description, a list item's note, a club's name and description, a checkpoint, a meeting; the profile's name and bio | 30 per 10 minutes | "You're posting quickly. Wait a few minutes and try again." (`tooManyPosts`) |
| **Logs** (`logs`) | Log create and update (a review is part of a log, and progress updates are updates) | 60 per 10 minutes | "You're logging books quickly. Wait a few minutes and try again." (`tooManyLogs`) |
| **Reactions** (`reactions`) | Like and unlike (activity, lists, readings, reviews, writings); comment and annotation-comment votes; club suggestion votes; favourite review | 60 per minute | "You're doing that quickly. Wait a minute and try again." (`tooManyReactions`) |
| **Reaching readers** (`reachOut`) | Follow; list collaborator invite. Club invites, from the invite button or a new club's invite list, are counted per invited reader by `ClubInviteAllowance` instead (one call can name 20) | 50 per hour (club invitees: their own 50 per hour) | "You've followed or invited a lot of readers in the last hour. Try again later." (`tooManyReachOuts`) |
| **Making things** (`creations`) | Create a club, a buddy read, a list; copy a list; club meeting; checkpoint; start a list challenge | 20 per hour | "You've made a lot of clubs, lists and plans in the last hour. Try again later." (`tooManyCreations`) |

Unlimited on purpose: reading anything, deleting your own things, unfollow, remove follower, approve/decline requests, accept/decline invites, join/leave a club (joining a public club is one per club, and a club's own rules cap it), club admin actions (role, remove, ban, approve), ballots and voting settings, goals, settings, sessions, notifications, blocks.

## 3. Design

### 3.1 Backend

- `RateLimitOptions`: five policy names and five numbers (`PostsPer10Minutes`, `LogsPer10Minutes`, `ReactionsPerMinute`, `ReachOutsPerHour`, `CreationsPerHour`), with doc comments like the others.
- `Program.cs`: one small helper `PerReaderSliding(context, limit, window)` for the five (sliding window, 10 segments, no queue), keyed as the existing per-reader policies are. `OnRejected` gets five more titles.
- `ErrorCodes.cs`: the five codes and English texts. `errors.json` `codes.server.*` in all five languages.
- `[EnableRateLimiting(...)]` on each endpoint in the table.
- `ApiFactory` raises all five for the integration tests, as it does the others.

### 3.2 Frontend

Nothing new: forms already translate and show the server's message. Check the writing composer and the comment box show the 429 text rather than a generic error.

## 4. Tasks

### Phase 1

#### Backend
- [x] Five options, policies and messages (§3.1); codes and translations.
- [x] Attributes on every endpoint in §2's table, nothing on the unlimited ones.
- [x] Integration tests: each bucket refuses past a low limit with its code; another reader still gets through; one endpoint from each bucket shares the count (e.g. a writing and a comment); an unlimited action (delete, block) still works past the limit.

#### Frontend
- [x] Composer and comment box show the translated message on 429 (Vitest if they don't already have the path).

#### Verification
- [x] `reviewer`, then `argos-security` (user input reaching the server).
- [x] `app-hardening.md` §4 line points here; CHANGELOG line.

## 5. What was built, and what changed after the reviews

Built as §3, in Apollon `PostingLimitsTests` (7 tests). Full backend suite on a private database: 1999 tests, one known flake (`bugs/checkpoint-due-test-flaky.md`), which passes on its own. Frontend: no code change; `ApiError` already carries the translated message, so the composer shows it and the comment box shows "Couldn't post your comment: You're posting quickly…".

- **`reviewer`:** no bugs. Edit endpoints whose text others see (list title and description, list item note, club name and description, checkpoint, meeting) and the club suggestion vote were in neither list; they went into Posts and Reactions.
- **`argos-security`:**
  - The reach-out cap counted calls, but one club invite names up to 20 readers, so 50 calls could notify 1,000 readers an hour, and creating clubs with invites added 400 more. Fixed with `ClubInviteAllowance`: a per-reader sliding hour that takes one permit per invited reader, in `ClubInviteService.InviteAsync` and `CreateAsync`, answering 429 with the same message (`ClubOperationStatus.TooMany`). The endpoint policy came off `POST /api/clubs/{id}/invites`. Buddy reads aren't counted: at most 4 readers you're already connected to, and the buddy read itself is in Creations.
  - Signed-out callers were counted per address before `[Authorize]`, so a flood from a shared address could give a reader with an expired token a 429 instead of the 401 that refreshes their session. They're no longer counted.
  - The profile's name and bio went into Posts.
  - Not done: the 429 log line has the address but not the account; finding the account behind a flood means matching addresses. Fine at today's size.
- **No `Retry-After`:** ASP.NET's sliding window doesn't give one (club chat never had one either).
- **Checked live 2026-11-05:** saving the profile 31 times on wingedwords.app, the 31st was refused with the posting message.
