# Feature Spec — Stronger clubs

**Status:** planned 2026-10-23. Six phases, built in order. **Phase 1 built 2026-10-23. Phase 2 built 2026-10-23. Phase 3 built 2026-10-23. Phase 4 built 2026-10-23. Phase 5 built 2026-10-23. Phase 6 built 2026-10-23; its `ux-review` done the same day (`ux-reviews/clubs.md`, nine findings open).**

## 1. Problem

Clubs already go deep on reading together: suggest and vote, checkpoints, threads hidden until you tap "I've read this far", highlights, wrap-up and ratings, history, activity (`specs/book-clubs.md`, `specs/book-club-improvements.md`). The basics of *running* a club are what's missing:

- An admin can't rename a club, change its description, switch it between public and private, delete it, or hand it to someone else. Admin only passes on when the admin leaves (`ClubSuccession`).
- A member removed from a public club can rejoin straight away.
- Nobody is told when someone asks to join, when the book is confirmed or when a new round opens. Club notifications today are only invites, "checkpoint due in 2 days", and replies and likes on your comments.
- `bugs/club-progress-ignores-reading-visibility.md`: a book marked Private on your shelf still shows its progress to your club, and nothing says so.
- The organizing tools held back until notifications existed (meetings, going/not going, calendar file, ranked-choice voting, more reminders; `FUTURE-IDEAS.md`) can be built now that notifications exist.
- There's no small, no-voting way for two to five friends to read one book together, which is what readers call a *buddy read*.
- The directory can only be searched by name.

## 2. Decisions

### 2.1 Asked 2026-10-23

- **Club progress on a Private book stays visible to club members, and the app says so.** Joining a club that reads a book is a choice to share your progress on that book. The Privacy settings and the club page state it plainly. Closes `bugs/club-progress-ignores-reading-visibility.md` (option 2).
- **Deleting a club erases everything in it.** Admin only, after typing the club's name. The club, its rounds, suggestions, votes, checkpoints, discussions, highlights, ratings and activity go. Members' own reading logs stay, including ratings they gave through the club (those already live on their own log). Members are told.
- **The admin picks the voting style for each round:** one vote each (today's way) or ranked choice. A round can also have a voting deadline and a cap on suggestions per member.
- **Buddy reads are a kind of club**, called **"buddy read"**. It's the common reader term, not StoryGraph's own. A buddy read is 2–5 readers, private, one book, no voting. Comments are tied to a point in the book and stay hidden until you reach it.

### 2.2 Decisions I made, for the user to confirm

- **Club settings are admin only.** Moderators keep what they have today (members, requests, the book, checkpoints, invite link). Renaming, visibility, delete, handover and the ban list are the admin's.
- **Handing over admin:** the admin picks any active member. The old admin becomes a Moderator, not a plain Member, so nobody loses standing by being generous. `Club.CreatorId` moves to the new admin, as `ClubSuccession` already does.
- **Private → public:** waiting join requests are approved at once (they asked to join, and anyone can join now) and each requester is told. Members stay. **Public → private:** members stay, the club leaves the directory, the invite link starts asking for approval. The old link isn't reset automatically, but Settings offers "Reset the invite link" next to the switch.
- **Removing a member offers "Remove" or "Remove and ban".** A banned reader can't join, request, be invited or open the invite link (they see "You can't join this club"). The admin sees a "Banned" list with Unban. A ban is a new membership status (`Banned`), so the row and its date already exist. In a private club, Remove alone is enough (the request still needs approval), but Ban is offered there too.
- **Telling members a club was deleted:** notifications never carry text, and the club's name is gone after the delete. A small `DeletedClubs` row (id, name, deleted at) gives the notification its name and is removed by the existing notification clean-up after 90 days. Nothing else about the club is kept.
- **New club notifications get their own Settings switch, "Clubs"**, on by default (quiet by default only turns likes off, `NotificationRules.EnabledByDefault`). Invites stay under "Invites" and the reminders stay under "Checkpoint reminders".
- **"You're behind" isn't a new notification.** The existing "checkpoint due in 2 days" reminder says "and you're N pages behind" when you are. One notification, more useful, no extra nagging.
- **Meeting times are stored in UTC and shown in the viewer's own time zone, with the zone named** ("Thu 6 Nov, 19:00 (your time, CET)"). The organizer picks the time in their own zone.
- **A video link must be `https://`** and is shown as a link that opens in a new tab with `rel="noopener noreferrer nofollow"`. A place is plain text. `argos-security` reviews this phase.
- **Ranked choice is counted by instant runoff**: count first choices; if no book has more than half, drop the one with the fewest and move its ballots to their next choice; repeat. A tie for last drops the one suggested latest. Results are worked out when asked, never stored, and the confirm step still lets the admin pick any suggestion, as today.
- **Suggestion cap, approval and the confirm step (confirmed by the user 2026-10-23, Phase 4):** the cap applies to every member, Admin and Moderators included; a manager's own suggestion needs no approval; the confirm step lists only approved suggestions (approve a waiting one first).
- **When the voting deadline passes, voting closes.** The admin still confirms the book by hand, as today; nothing happens automatically.
- **Buddy reads unlock comments by how far through the book you are, not by page number.** Editions have different page counts, so a comment written at page 140 of 400 (35%) unlocks for a reader at 35% of their own edition, and still shows "p. 140" as the writer's page. A reader with no page count on their log sees a locked comment as "Elena wrote at p. 140" and can tap to show it.
- **A buddy read has no rounds after the first.** When everyone has finished, or the admin ends it, it becomes read-only and stays in "Your clubs" under "Finished buddy reads". "Read another book together" starts a new buddy read with the same people.
- **Buddy-read details (confirmed by the user 2026-10-23, Phase 5):** the one checkpoint keeps a hidden due date at the start (no reminder fires) rather than making due dates optional; a reader's place rounds down and a writer's up, and a writer with no page set posts at 100%; starting or accepting a buddy read doesn't touch your shelf (progress lives only in your own reading log, which the buddy read reads; "Set your page" starts it); replying to a post you haven't opened is allowed.
- **Directory topics come from the genre list books already use (`GenreCatalog`)**, up to three per club, plus an optional language from the five the app has. "Active 3 days ago" comes from the club's newest activity entry.

## 3. Design

### 3.1 Phase 1 — Club settings, bans and the privacy wording

**Data**
- `Club`: `UpdatedAt` (nullable). Name and description limits stay as they are (`AddClubNameDescriptionMaxLength`).
- `ClubMembershipStatus`: add `Banned` at the end. A banned row keeps the reader's id, `JoinedAt` becomes the ban date, and `BannedByUserId` (nullable) is added to `ClubMembership`.
- `DeletedClubs` table: `Id` (the old club id), `Name`, `DeletedAt`.

**Endpoints** (all admin only unless noted)
- `PUT /api/clubs/{id}`: name, description, `isPublic`. Private → public approves waiting requests in the same save (each gets a `MemberJoined` activity entry and, from Phase 2, a notification).
- `DELETE /api/clubs/{id}`: body `{ confirmName }`, which must match the name exactly or the API answers 400 with a new error code. One transaction: write the `DeletedClubs` row, record a `ClubDeleted` notification for every active member except the admin (Phase 2 adds the type; Phase 1 writes no notification), delete the club (the existing cascades remove rounds, checkpoints, comments, reveals, votes, ratings and activity; account erasure already deletes clubs this way), then delete notifications whose subject is this club or one of its checkpoints. Check how open reports on its checkpoint comments behave once the comment is gone, and close them as "content gone" if they would break the admin's queue.
- `POST /api/clubs/{id}/transfer`: `{ userId }`, an active member. The admin becomes Moderator, the target becomes Admin, `CreatorId` moves. One save.
- `DELETE /api/clubs/{id}/members/{userId}?ban=true`: removes and bans. Same role rules as removing today (a Moderator can ban a Member, not another Moderator).
- `GET /api/clubs/{id}/bans` and `DELETE /api/clubs/{id}/bans/{userId}` (admin and moderators).
- Join, request, invite, accept and the invite-link preview all refuse a banned reader with one error code ("You can't join this club"). Inviting a banned reader is refused too.
- New error codes in `ErrorCodes.cs` with translations under `errors.codes`.

**Frontend**
- `ClubSettingsPage` at `/clubs/:id/settings`, linked from the club page's admin actions:
  - Name and description.
  - Public / private switch, with what each means in one line, and "Reset the invite link".
  - Hand over admin: a member picker and a confirm that says "You'll become a moderator."
  - Banned readers, with Unban.
  - A danger section: Delete club, a modal that asks for the club's name and lists what goes and what stays ("Your members' reading logs and ratings stay on their shelves").
- The remove-member confirm gains a "Also ban them from rejoining" checkbox.
- Privacy wording: one sentence under the members list on the club page ("Members see each other's progress on this book, even if it's private on their shelf") and the same idea in Settings → Privacy & data, next to reading visibility. The privacy policy gets the sentence too.

### 3.2 Phase 2 — Club notifications

New `NotificationType`s, added at the end of the enum (it's stored as numbers):

| Type | To | Subject | Grouped |
|---|---|---|---|
| `ClubJoinRequest` | admin and moderators | Club | one row per club, `ActorCount` counts waiting requests (like likes and `ReportReceived`) |
| `ClubRequestApproved` | the requester | Club | once per subject |
| `ClubBookConfirmed` | every active member but the one who confirmed | Club (the round's book is read on show) | once per round |
| `ClubRoundOpened` | every active member but the one who ended the round | Club | once per round |
| `ClubRoleGiven` | the member made Moderator or Admin | Club | per change |
| `ClubDeleted` | every active member but the admin | the `DeletedClubs` row | once |

- `NotificationSubjectType`: add `DeletedClub`.
- `NotificationGroup`: add `Clubs`, on by default. `ClubJoinRequest` moves to zero when the last waiting request is handled.
- "Once per round" needs the round in the key: use the round id as `SubjectId` with a new `ClubRound` subject type, or keep `Club` and leave those types out of `UniquePerSubject`. Decide while building; the test is "confirming twice in two rounds gives two notifications".
- Blocks: never notify a reader about an actor they blocked, as the other types already do.
- Frontend: the bell's sentence per type, the Settings switch, links to the club (or nowhere, for a deleted club).

### 3.3 Phase 3 — Meetings, going / not going, calendar file

**Data**
- `ClubMeetings`: `Id`, `ClubId` (cascade), `RoundId` and `CheckpointId` (both optional, `SetNull`: "we'll talk about chapters 1–5"), `StartsAt` (UTC), `DurationMinutes` (15–480, default 60), `Place` (text, optional, max 200), `VideoUrl` (optional, `https://` only, max 500), `Note` (optional, max 1000), `CreatedByUserId`, `CreatedAt`, `UpdatedAt`, `CancelledAt`.
- `ClubMeetingReplies`: `MeetingId` + `UserId` key, `Answer` (`Going` / `Maybe` / `NotGoing`), `UpdatedAt`.

**Endpoints**
- Admin and moderators create, edit and cancel. Members only: list (upcoming first, then the last 5 past), reply, and `GET /api/clubs/{id}/meetings/{meetingId}/calendar.ics`.
- The `.ics` file: one `VEVENT` with a stable `UID` (the meeting id), `DTSTART`/`DTEND` in UTC, `SUMMARY` "<club name>: <checkpoint title or book>", `LOCATION` (the place or the video link), `URL` (the club page), and `SEQUENCE` going up on each edit, so calendar apps update the event instead of adding a second one. Text escaped per RFC 5545.
- New notifications (in the `Clubs` group): `MeetingScheduled`, `MeetingChanged` (time or place changed, or cancelled), `MeetingSoon` (24 hours before, to Going and Maybe, sent by `NotificationBackgroundService` like the checkpoint reminder, once per meeting).

**Frontend**
- A "Next meeting" line on the club page's "What's next" card and in the rail's club card.
- A meetings section on the club page: time in the viewer's zone, place or "Join video" link, who's going (avatars and counts), Going / Maybe / Not going buttons, "Add to calendar".
- A meeting form (date, time, length, place or link, optional checkpoint, note). It says which time zone the time is in.

### 3.4 Phase 4 — Voting styles, deadline, caps and reminders

**Data**
- `ClubBookRound`: `VotingMode` (`Single` / `Ranked`, default `Single`), `VotingClosesAt` (optional), `SuggestionCap` (optional, 1–10), `SuggestionsNeedApproval` (bool, default false).
- `BookSuggestion`: `ApprovedAt` (null while waiting, when approval is on).
- `RankedBallots`: `RoundId`, `UserId`, `SuggestionId`, `Rank` (1 = first choice). Key (`RoundId`, `UserId`, `Rank`), unique (`RoundId`, `UserId`, `SuggestionId`). Saving a ballot replaces the reader's whole ballot in one save.

**Rules**
- The admin or a moderator sets the mode, deadline, cap and approval while the round is Suggesting and nobody has voted yet. After the first vote only the deadline can change.
- Past the deadline, votes and suggestions are refused (one error code), and the page shows "Voting closed" with the result.
- Ranked results: instant runoff (§2.2), returned as the order of elimination so the page can show "Dune won in round 3".
- A suggestion past the cap is refused. Waiting suggestions show only to their author and the admin and moderators until approved; they can't be voted on.
- Reminders, in the `Clubs` group: `VotingClosesSoon` (24 hours before the deadline, to members who haven't voted). The checkpoint reminder gains "you're N pages behind" (§2.2), worked out from the reader's log against the checkpoint's range end, only for page checkpoints.

**Frontend**
- The round's options in a small "Voting" panel that admins see while Suggesting.
- Ranked ballot: drag or "Move up / Move down" buttons (the buttons are the keyboard way and the phone way), top 3 by default, as many as the reader likes.
- Results: a short bar per book for single votes; for ranked, the winner and "won in round N", with an "How the count went" disclosure.
- Waiting suggestions: an "Approve / Remove" row for admins and moderators.

### 3.5 Phase 5 — Buddy reads

**Data**
- `Club`: `Kind` (`Club` / `BuddyRead`, default `Club`) and `FinishedAt` (nullable, buddy reads only).
- `CheckpointComment`: `AtPage` (nullable) and `AtPercent` (nullable, 0–100), filled from the writer's own log when they post in a buddy read.

**Rules**
- "Start a buddy read" (from a book page and from the clubs page): pick the book and invite 1–4 readers you follow or who follow you. It creates a private club with `Kind = BuddyRead`, round 1 straight in Reading with that book, and one checkpoint with no due date called "The whole book". No suggestions, voting, checkpoints to add, meetings or directory listing.
- At most 5 active or invited members. Invites use the existing club invites.
- A comment carries the writer's `AtPage`/`AtPercent`. For each viewer, a comment is **locked** while the viewer's own percent on that book is below `AtPercent` and the viewer isn't the writer. The API sends a locked comment without its text (writer, page and time only), so spoilers never reach the browser. Tapping "Show anyway" calls an endpoint that returns that one comment's text and remembers it for that viewer.
- Replies inherit their parent's lock point, or later if the replier is further on.
- Highlights work the same way, locked by their quote's page.
- It finishes when every member's log on the book is Read, or when the admin ends it. Then it's read-only, like a completed round.

**Frontend**
- Buddy read page: the book, everyone's progress bars side by side, one thread in page order, the composer showing "posting at p. 140 (35%)" from the reader's log, with a link to update progress first.
- A locked comment: "Elena wrote at p. 140 · you'll see it at 35%" and "Show anyway".
- "Your clubs" splits into Clubs and Buddy reads; finished buddy reads collapse under their own heading.
- The book page: "Start a buddy read" next to logging, and "Reading with Elena and Dan" when the viewer has one going for this book.

### 3.6 Phase 6 — A better directory

**Data**
- `Club`: `Topics` (list of up to 3 `GenreCatalog` keys), `Language` (optional, one of the app's five), `Rules` (optional, max 2000, plain text with line breaks).

**Endpoints**
- `GET /api/clubs?search=&topic=&language=&sort=members|active`, with `LastActiveAt` (newest `ClubActivity`) on each card. Buddy reads never appear.
- `PUT /api/clubs/{id}` gains topics, language and rules.

**Frontend**
- Topic chips and a language menu above Discover; sort by "Most members" or "Recently active".
- Cards show topics and "Active 3 days ago" (or "Quiet for a while" past 30 days).
- Rules show on the invite-link preview, on the join confirm ("By joining you agree to the club's rules") and in an "About this club" box on the club page. Settings gets the three new fields.

## 4. Explicitly out of scope

- **Live updates** (websockets). Same fetch-on-action as the rest of the app.
- **Video calls inside the app.** A meeting links to the club's own Zoom, Meet or Jitsi.
- **Repeating meetings** ("every second Tuesday"). Each meeting is added on its own; repeats can come later if clubs ask.
- **Email for club notifications.** In-app bell only, until the weekly digest (Stage 11).
- **Locking club threads by progress.** Clubs keep the one-tap blur; only buddy reads lock by progress.
- **Paid anything.** Clubs and buddy reads stay free (`FUTURE-IDEAS.md`, "Never charge for these").
- **Author Q&As** (`FUTURE-IDEAS.md`, verified author accounts).

## 5. Tasks

### Phase 1 — Club settings, bans and the privacy wording

#### Backend
- [x] Migration: `Club.UpdatedAt`, `ClubMembershipStatus.Banned`, `ClubMembership.BannedByUserId`, `DeletedClubs` table. (`ClubSettingsAndBans`)
- [x] `PUT /api/clubs/{id}` (admin): name, description, visibility; private → public approves waiting requests. `isPublic` is required (left out, 400 `clubs.visibilityRequired`), so a client can't make a club private by omission. Needs a confirmed email, like creating one.
- [x] `DELETE /api/clubs/{id}` with `confirmName`: tombstone row, delete, clear notifications for the club and its checkpoints; check open reports on its comments. **Reports, decided:** they stay open. The admin's queue copes with content that's gone (no current text, no link, Dismiss works, Hide answers 404), the same as for a comment its author deleted, and a report's snapshot is evidence about the writer that outlives the club (`Report.cs`). Surrounding spaces in the typed name are ignored, case isn't.
- [x] `POST /api/clubs/{id}/transfer`.
- [x] Remove with `ban=true`, the bans list and unban; banned readers refused on join, request, invite, accept and preview. Inviting a banned reader refuses the request (`clubs.inviteeBanned`), unless there's a block either way, which is skipped quietly like any blocked reader so the refusal can't reveal it.
- [x] Error codes + `errors.codes` translations (`clubs.banned`, `inviteeBanned`, `deleteNameMismatch`, `transferToSelf`, `visibilityRequired`; `adminNotAssignable` reworded now that the Admin can be handed over).
- [x] Tests: each endpoint as admin, moderator, member, stranger and a blocked reader; delete removes every child row and leaves members' logs and ratings; transfer keeps exactly one Admin; a banned reader is refused by all five ways in; private → public approves requests; a wrong `confirmName` deletes nothing. (`ClubSettingsTests`, 17 tests.) **Races, from the reviews:** ban, accepting an invite and approving a request are each one guarded update that re-checks the row as it writes, and the hand-over re-checks that its target is still Active, so a ban can't be overwritten and a ban racing a hand-over can't leave a banned Admin; tested with the guards called directly.
- [x] Export (`AccountExportWriter`): no change expected; confirm. Confirmed: memberships were never exported, so a ban isn't either. The security review suggests a `clubs.csv` for data-access rights: `bugs/club-memberships-missing-from-export.md` (P3).

#### Frontend
- [x] `ClubSettingsPage` with the five sections (§3.1), linked for the admin. Linked from the club page's ⋯ menu ("Club settings") for the Admin and Moderators; a Moderator sees only the invite link and the banned readers, which is what the API lets them change. The invite link is shown with Copy (it wasn't shown anywhere before), and Reset asks first.
- [x] "Also ban them" in the remove-member confirm; banned readers list. The confirm moved from the browser prompt into the member's row, so the checkbox can sit beside the question.
- [x] Privacy sentence on the club page and in Settings → Privacy & data; privacy policy line (also says a club keeps a ban and its date).
- [x] Translations in all five locales.
- [x] Tests: settings saves, the delete modal only enables on the exact name, transfer confirm, ban checkbox. (`ClubSettingsPage.test.tsx`, `ClubPage.test.tsx`.)

#### Verification & docs
- [x] `reviewer`, then `argos-security` (privacy and access rules). Reviewer: one Medium (a ban racing a hand-over could leave a banned Admin) and smaller items; security: two Lows (a banned invitee could reveal a block; a ban racing an accepted invite could be lost). All fixed, see the Backend notes.
- [x] `browser-check`: two readers, rename, switch visibility, ban and try to rejoin, hand over, delete. All eight steps passed, no console errors.
- [x] Close `bugs/club-progress-ignores-reading-visibility.md` (option 2) and move its row in `bugs/README.md`.
- [x] `CHANGELOG.md` line.

### Phase 2 — Club notifications

#### Backend
- [x] The six types, `DeletedClub` subject, `Clubs` group; the round-key question (§3.2) settled with a test. **Round key, decided:** a new `ClubRound` subject (the round's id), so "book confirmed" and "new round" are in `UniquePerSubject` (once per round) and the bell can name the round's book. `ClubRoleGiven` is unique too, but every change refreshes its one row and makes it unread (a Moderator handed the club the same day hears again), and the role is read when shown, so it says what they are now. Migration `ClubNotifications` re-creates the partial unique index with the new types. Test: `ConfirmingTwiceInTwoRounds_GivesTwoNotifications_AndFinishingOpensARound`.
- [x] Recorded from `ClubService` and `ClubInviteService` at each action; blocks respected; the join-request count falls as requests are handled. Join requests share the likes' re-count (`SyncCountedAsync`): one row per manager and club, counting the waiting requests that aren't from a reader in a block with that manager; approve, deny, remove/ban a requester and going public re-count it, and it goes at zero. "Book confirmed", "new round" and "club deleted" go to every member with one insert (`ClubNotifications.AddToMembersAsync`) that applies the recorder's rules in SQL (switch, blocks, away readers). "Club deleted" is written inside the delete's transaction, before the memberships go; a buddy read's own start tells nobody (`notify: false`, inside its creating transaction). Also recorded: `ClubSettingsService` (going public, hand-over) and the successor when an Admin leaves. A reader who leaves, or is demoted, stops seeing the club's rows.
- [x] Clean-up removes `DeletedClubs` rows after 90 days. (Done in Phase 1, in `NotificationRepository.DeleteOldAsync`, so the names don't wait for this phase.)
- [x] Privacy policy: say a deleted club's name is kept up to 90 days for the notification (security review of Phase 1). In "Who can see what you post", next to the club sentences.
- [x] Tests per type: who gets it, who doesn't (the actor, blocked readers, members who turned "Clubs" off). (`ClubNotificationTests`, 11 tests.)

#### Frontend
- [x] Bell sentences and links per type, Settings switch, translations. Join requests group like likes ("elena and 2 others asked to join…"); the round rows open the club; a deleted club's row is a plain row, not a link, and keeps its ×.
- [x] Tests for each sentence and the deleted-club case (no link). (`Notifications.test.tsx`.)

#### Verification & docs
- [x] `reviewer`; `browser-check` with two readers; `testing/notifications.md` updated; `CHANGELOG.md`. Reviewer: no blocking bugs; fixed its Lows (a deleted club's row couldn't be marked read by pressing it, so it's now a button and the placeholder avatar a span; a reader made Moderator or Admin didn't hear about requests already waiting; a second approval inside a day was silent). Left as is: the join-request count can stay one too high after a requester's account is erased, or when two managers answer at the same moment, until the next request or answer (best effort, like likes). Browser check: all seven steps passed, no console errors. Manual plan: `testing/notifications.md` steps 54–65.

### Phase 3 — Meetings

#### Backend
- [x] Migration: `ClubMeetings`, `ClubMeetingReplies` (`ClubMeetings`; also re-creates the notifications' partial unique index with the three new types). `ClubMeeting.Sequence` added for the calendar file.
- [x] Create, edit, cancel, list, reply; `https://` check on the link. `ClubMeetingService` + `ClubMeetingsController` (`api/clubs/{id}/meetings`). **Decided while building:** the organizer is marked Going; a club has at most 20 upcoming meetings, adds at most 10 a day (cancelled or not, from the security review: a create-and-cancel loop could flood members), and plans at most a year ahead; a cancelled meeting stays in the list, marked, for 7 days; times are sent with their zone and kept as UTC to the minute; answers are taken until the meeting ends, edits and cancels until it starts. The link must be an absolute `https://` address with a host and no user name or password, and is stored as parsed, so what is linked is what was checked.
- [x] `.ics` endpoint (stable UID, SEQUENCE, escaping). `ClubMeetingCalendar`: UID `<meeting id>@wingedwords`, SEQUENCE raised in one SQL statement on each edit and on cancel (two edits at once both count), `STATUS:CANCELLED` once cancelled, text escaped and lines folded at 75 octets.
- [x] `MeetingScheduled`, `MeetingChanged`, `MeetingSoon` (background job, once per meeting). New `ClubMeeting` subject. Changes share one row per meeting, refreshed and made unread (an upsert on the partial index); only time or place changes notify, not a note or the checkpoint; "planned" hides once cancelled, and "changed" then says cancelled. The reminder goes about 24 hours ahead to Going and Maybe; moving the time clears it so the new time gets its own.
- [x] Club delete and account erasure remove meetings and replies; the export lists the reader's replies. **Changed while building:** an erased organizer's meetings stay with the club (the organizer is just no longer named); their replies go. Export: `club-meetings.csv`.
- [x] Tests: roles, the link check, time zones round-trip as UTC, the `.ics` parses (test with a minimal parser) and keeps its UID across edits, the reminder fires once. `ClubMeetingTests` (10, plus the four link cases) and `ClubMeetingCalendarTests` (unit).

#### Frontend
- [x] Meetings section, form, reply buttons, "Add to calendar", "Next meeting" on the card and the rail. `ClubMeetings`, `MeetingForm` (inline, in a sunken well); Edit and Cancel in the row's ⋯ menu; the video link a plain green external link; cancelled meetings after the live ones, short. A member sees no section until a meeting exists. New drawn icons: calendar, pin, video.
- [x] Times in the viewer's zone with the zone named; translations; tests. `lib/meetingTime.ts`; five locales; `ClubMeetings.test.tsx` and the bell sentences in `Notifications.test.tsx`.

#### Verification & docs
- [x] `reviewer` + `argos-security` (external links, a file download); `browser-check` at 390 px; privacy policy if replies are new personal data; `CHANGELOG.md`. Reviewer: no blocking bugs; fixed its Lows (SEQUENCE lost on two edits at once, the reminder job re-checking reminded members, answers hidden after the start though the server takes them until the end, a refused answer leaving the row stale, the card's clock, a meeting past midnight). Left: old answers come back if a member leaves and rejoins; `METHOD:PUBLISH` with `STATUS:CANCELLED` (what downloaded files use). Security: one Low (a create-and-cancel loop), fixed with the daily cap. Browser check with two readers at 390 and 1280: every step passed, no console errors. Two critique rounds with the design reviewer, then a fresh-eyes full review: "ship" (the zone is named, e.g. "Chile Summer Time", on its own line; the live meeting's time in serif, a step up). Its note about the feedback button covering "Log progress" on a phone is site-wide: `bugs/feedback-bubble-covers-primary-action.md`. Privacy policy: members see your answers; the export lists them.

### Phase 4 — Voting

#### Backend
- [x] Migration: round voting fields, `ApprovedAt`, `RankedBallots`. (`ClubVotingStyles`; existing suggestions get `ApprovedAt = CreatedAt`, so a waiting suggestion is simply `ApprovedAt` null; also re-creates the notifications' partial unique index with `VotingClosesSoon`.)
- [x] Settings rules (locked after the first vote except the deadline), deadline and cap refusals, suggestion approval. `ClubVotingService` (`GET`/`PUT /api/clubs/{id}/voting`, `PUT /ballot`, `POST /suggestions/{id}/approve`). **Decided while building:** every option is sent each time (`votingMode` required, `clubs.votingModeRequired`), so a client can't reset one by leaving it out; the deadline is kept to the minute, must be in the future and at most a year ahead; a manager's own suggestion needs no approval; the cap counts waiting suggestions and applies to managers too; turning approval off approves everything waiting, in the same unit; approving after the deadline is refused; a moved deadline clears its reminder so the new one is reminded. **Races, from the review:** votes, ballots and option changes all take the round's row lock and re-check phase, style and deadline as they write (`ClubBookRoundLock`), so a first vote can't slip under a change of style and a vote can't land after a confirm.
- [x] Ranked ballots and the instant-runoff count with its rounds; unit tests for majority in round 1, a runoff, a tie for last, empty ballots. `RankedChoiceCount` (pure, unit-tested; one book dropped per round); only approved suggestions are in the race; ballots from readers who blocked the viewer leave their count, as single votes do. A saved ballot replaces the whole ballot; `{suggestionIds: null}` is refused, `[]` takes it back. `MyRank` is the position on the ballot.
- [x] `VotingClosesSoon` and the "N pages behind" reminder text. The reminder is a `ClubRound` subject, once per deadline, shown while the round is still Suggesting and before its deadline. Pages behind are worked out on show (`NotificationSubjectDto.PagesBehind`) from the reader's own Reading or Want-to-read log against a page checkpoint's range end. **Fixed on the way:** dismissing a meeting or voting reminder deleted it and let the hourly job send it again; now only marked read, like the checkpoint reminder.
- [x] Tests for each refusal and for the confirm step still allowing any suggestion. `ClubVotingTests` (10) and `RankedChoiceCountTests` (6).

#### Frontend
- [x] Voting panel, ranked ballot (buttons for keyboard and phone), results, waiting suggestions; translations; tests. `VotingOptionsForm` (a sunken well opened by a quiet "Voting options" on the section's heading row; once someone voted, the style shows as text and the limit and approval are disabled), `RankedBallot` ("Your ranking": numbered, Move up / Move down / remove, each change saves at once and is announced in a live region; books are added with "+ Rank" on their row), `RankedResult` (the leader's cover and title, "Leading: ahead in round N of the count", and "How the count went"), one-vote share bars, "Voting closed …" with plain counts and "Most votes", "Waiting for approval" with Approve for managers, the cap ("You can suggest 1 more book."). The confirm modal preselects the ranked leader and leaves out waiting suggestions (approving is what lets a book into the choice). Tests in `ClubPage.test.tsx` and `Notifications.test.tsx`.

#### Verification & docs
- [x] `reviewer`; `browser-check` with three readers voting ranked; `CHANGELOG.md`. Reviewer: no blocking bugs; fixed its Medium (votes and ballots could slip past a change of style or a confirm: now under the round's lock) and its Lows (option change and approve-all in one unit, approve after the deadline, a null ballot gave a 500, the reminder outliving its deadline, `MyRank` after a removed suggestion). Browser check with three readers: every step passed, no console errors, no overflow at 375. Design: two critique rounds and a fresh full review (duplicate rank pills removed, options moved to the heading row, the result's kicker removed in favour of the leader's cover, full-width share bars).

### Phase 5 — Buddy reads

#### Backend
- [x] Migration: `Club.Kind`, `Club.FinishedAt`, `CheckpointComment.AtPage`/`AtPercent`. (`BuddyReads`; also `CheckpointCommentUnlocks` for "Show anyway" and a 0–100 check on `AtPercent`.)
- [x] Create a buddy read (book + invitees, cap 5) in one save; refuse voting, checkpoints, meetings and the directory for buddy reads. `POST /api/clubs/buddy-reads` (`ClubInviteService.CreateBuddyReadAsync`): named after the book, private, 1–4 invitees who follow the creator, are followed by them, or have shared a buddy read with them. **Decided while building:** the one checkpoint ("The whole book") keeps a due date equal to the start, never shown, so no reminder is ever due (making `DueDate` nullable would have touched every checkpoint screen); later invites keep the same who-you-know rule and the 5-seat cap (members plus open invites, counted under the club's row lock); the invite link answers 404 for a buddy read (preview and join); going public is refused; meetings, checkpoint changes, discussion questions and votes are refused with their own error codes; voting is already closed by the round being in Reading. The old `CreateClubRequest.InitialBookOpenLibraryId` stays as an API for an ordinary club that starts reading (tests use it); the app no longer uses it.
- [x] Lock rule on read (no text sent for a locked comment), "Show anyway" endpoint, replies and highlights. `CheckpointDiscussionService.LockUnreachedAsync` and `POST /api/checkpoints/comments/{id}/unlock`. **Decided while building:** a reader's place rounds down and a writer's up (p. 398 of 400 doesn't open an end-of-book post); a writer with no known place posts at 100%; a highlight locks at the later of the writer's place and the passage's page (a passage that can't be placed, e.g. by an audiobook listener, at 100%); replies lock at the later of their own point and their parent's; an edit is written from the writer's place now (the point only moves on) and forgets every "Show anyway" on that post (security review); comments and highlights are one thread in page order; a reply to a post you haven't opened is allowed (it locks at least at the parent's point, and the page offers no Reply on a locked post).
- [x] Finish on all-Read or by the admin; read-only after. **Decided while building:** finish-book ends a buddy read (Admin only) with no second round; the round stays in Reading and `Club.FinishedAt` marks it read-only (no new posts or edits; deleting your own words still works); "everyone Read" is noticed when the buddy read is opened or listed, needs at least two members and no open invites, and counts only a Read since the buddy read began (reviewer: a book finished long ago would have closed it at once).
- [x] Tests: a locked comment's text never appears in the response; unlock at the writer's percent on a different edition; the writer always sees their own; the cap; read-only after finishing. `BuddyReadTests` (14), including edits moving the lock, rounding, no votes and an old Read not finishing it.

#### Frontend
- [x] Buddy read page, composer with "posting at p. N", locked comment, "Show anyway". `BuddyReadPage` (ClubPage hands a buddy read to it): the cover and "With …", "Where everyone is" (one raised card, a named pill and bar per reader, "p. N of M"), "Talk about it" with "Posting at p. 140 (35%)" and "Update your page first", a Comment / Passage switch (`HighlightComposer`, moved out of the checkpoint page), the thread through `CommentTree`'s buddy-read mode (page beside the time, no votes, locked posts as a sunken well with a drawn lock, "Written at p. 200" or "Passage at p. 200", "You'll see it at 50%", "Show anyway"); finished: a well with "Read another book together"; the admin's invite panel while there's a seat.
- [x] "Start a buddy read" on the book page and clubs page; "Your clubs" split; translations; tests. `StartBuddyReadModal` (the book, people you follow or who follow you as named pills, up to 4); the book page's secondary row shows it or "Reading with Elena and Dan" (and the Readers panel stops offering a second one); the Clubs page has it beside "Create a club", and "Your clubs", "Your buddy reads" and a folded "N finished buddy reads"; a book page's "Reading it now" opens it with the readers you know chosen; `CreateClubModal` lost its buddy-read branch. Tests in `BuddyReadPage.test.tsx`, `ClubsDirectoryPage.test.tsx`, `FindReadersPhase3.test.tsx`.

#### Verification & docs
- [x] `reviewer` + `argos-security` (spoiler text must not leak); `browser-check` with two readers at different pages; `web-design` critique round for the new page; `CHANGELOG.md`; remove the buddy-reads line from `FUTURE-IDEAS.md`. Security: no leak found in any read path (tree, unlock, reports, notifications, activity, export, counts); fixed its Medium (an edit kept the old lock point, so later words could spoil: the point now moves on and "Show anyway" is forgotten) and Low (an audiobook listener's passage); unlocks noted in `bugs/club-memberships-missing-from-export.md`. Reviewer: fixed an old Read finishing a buddy read at once, votes still accepted, and p. 398 of 400 counting as 100%; SPEC.md §7 updated. Browser check with three readers (40 and 200 of 400, one not started) at 1280 and 390: every step passed, no spoiler word in any comments response, no console errors, no sideways scroll; from its notes, a locked passage now says "Passage at p. N" and the Readers panel stops offering a second buddy read. Design: two critique rounds, "ship" (invite panel moved under the progress card, "Show anyway" a 44px target, the percent column aligned, a shelf plank under the cover, the menu beside the title, the rail card says "With …"). Left: the faint disabled Post in Paper is site-wide, `bugs/disabled-post-button-faint-in-paper.md`; the feedback bubble over the progress card on a phone is `bugs/feedback-bubble-covers-primary-action.md`.

### Phase 6 — Directory

#### Backend
- [x] Migration: `Topics`, `Language`, `Rules`. (`ClubDirectoryDetails`: `Topics` text[] defaulting to empty, `Language` up to 10, `Rules` up to 2000.)
- [x] Filters, sorts and `LastActiveAt`; buddy reads left out; tests. `GET /api/clubs?search=&topic=&language=&sort=members|active` (an unknown topic, language or sort is a 400); `PUT /api/clubs/{id}` takes the whole set (left out means none; `ClubText.NormalizeDetails`). **Decided while building:** a club with no activity counts from its making, so a new one reads "Active today"; `LastActiveAt` is only the day (UTC midnight), since the directory is open to anyone and an exact time would say when a member of a small club just updated their progress (security review), and "Recently active" sorts by that day, then members; "Most members" counts every active member, the same order for everyone, though a card's number leaves out readers who blocked the viewer; a buddy read keeps no topics, language or rules even if a request sends them; topics and rules aren't asked for when creating a club, only in Settings. `ClubDirectoryTests` (7).

#### Frontend
- [x] Chips, language menu, sort, card details, rules on preview, join and club page, settings fields; translations; tests. The filters live in the address (`q`, `topic`, `lang`, `sort`); under the search sit the language menu (each language by its own name) and "Most members | Recently active", then "All topics" and the first eight topics as pills (a chosen one always shown) with "More topics", one sideways row on a phone; "No public clubs match." with "Clear filters". A card shows its topics as a quiet line, then the phase, members, "Active 3 days ago" (today, yesterday, days, weeks; "Quiet for a while" past 30 days, `lib/clubActivity.ts`) and "In Español". The join card (invite link and public preview) shows a "Club rules" well and "By joining you agree…" (or "By asking to join…"); the club page has topic pills and the language in its facts and an "About this club" well with the rules; Settings has topic pills (three at most, the rest disabled), a language menu and a rules field, hidden for a buddy read. Tests in `ClubsDirectoryPage.test.tsx`, `ClubJoinPage.test.tsx`, `ClubPage.test.tsx`, `ClubSettingsPage.test.tsx`, `clubActivity.test.ts`.

#### Verification & docs
- [x] `reviewer`; `ux-review` of `/clubs` afterwards (`ux-reviews/clubs.md` is from before); `CHANGELOG.md`; remove the organizing-tools line from `FUTURE-IDEAS.md`. Done: reviewer (no bugs; noted the member-count order and the directory's per-club queries, both from before), `argos-security` (nothing exploitable; `LastActiveAt` now only the day, a cap on the topics list before it's checked, buddy reads keep none), browser check (every step passed, whole-day `lastActiveAt`, no console errors besides the existing 403 a non-member's club page logs before its preview, no sideways scroll at 375), two design critique rounds (language and sort moved under the search, eight topics then "More topics", the card's topics a quiet line, the facts wrapping whole), CHANGELOG, FUTURE-IDEAS line removed, SPEC.md §7. `ux-review` of `/clubs` 2026-10-23: 26/40 (was 25), nine findings open (three P2: the language menu's name, the filters on a phone, a search-only no-match), `ux-reviews/clubs.md`.
