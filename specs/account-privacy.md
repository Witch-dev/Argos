# Feature Spec — Private accounts and follow requests

**Status:** 📝 Written 2026-10-11, decisions asked the same day. Not built. Roadmap Stage 8. **Must ship before public launch.**

## 1. Problem

Every reader's shelves are public today, including reading progress and progress notes. Only reviews and (since Stage 2b) single books have a visibility setting. A stranger who finds the site can read everything a reader has logged, and "followers only" protects nothing, because anyone can follow anyone with one click.

This spec adds an **account-level switch** (public or private) and **follow requests**, so a reader can decide that only people they approve see their reading life.

## 2. Decisions

Asked 2026-10-11, all five answered with the recommended option:

- **Existing followers stay approved** when an account turns private. Only new follow attempts need approval.
- **The stricter rule wins** where an account and a single book disagree. A book is shown to someone only if both the account and the book allow it. A *public* book on a private account is still hidden from non-followers; a *followers* or *private* book on a public account behaves as it does today.
- **New accounts are public**, as today. The switch is in Settings.
- **Private accounts stay findable by name** in search, discovery and "readers to follow", with only their name and avatar shown, so people can request to follow them.
- **Pending requests are a list in Settings** with approve / decline and a count badge. The bell (Stage 5) can plug into the same data later; email is not used.

Decided while writing the spec (change any of these before building):

- **Pending requests live in their own table**, not as a status on `Follows`. `Follows` stays "approved follows", so every query that already reads it (feeds, counts, per-book visibility, blocks) stays correct without being touched. Approving a request moves it into `Follows`.
- **What a stranger sees on a private account:** username, display name and avatar, a "This account is private" note and the Follow / Requested button. Not the bio, the follower and following counts or lists, shelves, journal, reviews, writings, lists, goal or stats.
- **Going public again approves every pending request**, since there is nothing left to approve. Followers are kept.
- **The owner can remove a follower** (new; today only blocking does this). Without it a private account can't undo an approval by mistake.
- **A requester can cancel their own request.** Declining is silent: the requester sees the button return to "Follow" and may ask again (once per day, to stop badgering).
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
- A "can ask again" timestamp isn't stored: a declined request is deleted, and asking again within a day is refused using the most recent decline kept in a small `LastDeclinedAt` column on the request row instead of deleting it (the row is hidden from the owner once declined). *(Build detail; keep whichever is simpler, the rule is "once per day".)*

### 3.3 API

```
PUT    /api/users/me/privacy            { isPrivate }         → 204
POST   /api/follows/{userId}            → { state: "following" | "requested" }   (changed: public → follows at once, private → request)
DELETE /api/follows/{userId}            → 204   (unfollow, or cancel a pending request)
GET    /api/follows/requests            → [{ requestId, user, createdAt }]       (the owner's pending requests)
POST   /api/follows/requests/{id}/approve  → 204
POST   /api/follows/requests/{id}/decline  → 204
DELETE /api/followers/{userId}          → 204   (remove a follower)
```

- The profile payload gains `isPrivate` and `relationship` (`none | requested | following | self`), and **omits** everything a stranger may not see when the account is private and the viewer isn't approved.
- Anything a viewer can't see is reported as missing (404), never forbidden, as the reading and review rules already do.
- New error messages get codes in `ErrorCodes.cs` and a translation under `errors.codes` (CLAUDE.md).

### 3.4 Where it applies (audit list)

Phase 1 starts by checking each of these in the code and writing down which already pass through a shared rule. Anything that reads another reader's content and isn't on this list is a bug in this spec.

| Surface | Today | With a private account |
|---|---|---|
| Profile page, followers / following lists | public | stranger sees only name, avatar, note, Follow button |
| Shelves, `GET /api/logs?userId=` | per-book setting | ceiling applied (§3.1) |
| Journal, stats, yearly goal on a profile | per-book / goal setting | hidden from non-followers |
| Readings strip, story likes and comments (`ReadingAccess`) | followers + per-book | unchanged for followers; nothing for others |
| Reviews, review likes and comments | per-review setting | ceiling applied |
| Writings, their likes, comments, highlights | always public | followers only |
| Lists the reader owns | list's own setting | ceiling applied; collaborators keep their access |
| Feed and activity events | everyone who follows | only approved followers (already the case); not in anyone else's "recent" or discovery rows |
| Search, discovery, taste match, "readers to follow" | everyone | listed by name and avatar only; no shared-book titles, no match details |
| Landing page live rows (Stage 10) | switched off | private accounts excluded |
| Data export | the owner's own | unchanged |

## 4. Tasks

### Backend

- [ ] **Audit** every surface in §3.4 and add a column to the table above saying which shared rule it uses. Note anything not on the list.
- [ ] `IsPrivate` on the user, `FollowRequests` table, migration (dev and test DBs).
- [ ] The single rule helper (§3.1); apply it in `ReviewVisibilityQueries`, `ReadingAccess`, `ReviewAccess`, `WritingAccess`, and the list, activity, feed and discovery queries.
- [ ] Follow flow: follow / request / cancel / approve / decline / remove follower / auto-approve on going public; blocks clear requests; once-a-day re-request.
- [ ] Profile payload that omits private data for strangers.
- [ ] Error codes and their translations.
- [ ] Tests: the visibility table (`LogVisibilityRuleTests`) extended with the account dimension; one integration test per surface in §3.4 that a stranger gets nothing and an approved follower gets what they got before; the follow-request state machine.
- [ ] `reviewer` and `argos-security` after the phase (this touches auth-adjacent privacy rules).

### Frontend

- [ ] Settings → Privacy & data: a "Private account" switch with a short explanation of what strangers will and won't see.
- [ ] Settings → **Follow requests**: list with approve / decline, a count badge on the Settings entry, an empty state.
- [ ] Profile for a stranger of a private account: the locked state with the Follow / **Requested** button (Requested cancels on click).
- [ ] Follow buttons everywhere they appear (cards, discovery, lists of readers) show Follow / Requested / Following.
- [ ] A "Remove follower" action on the followers list of your own profile.
- [ ] Translations in all five languages for every new text, including `aria-label`s; phone width and all five themes.

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
