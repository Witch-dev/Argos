# Feature Spec — Club suggestion options

**Status:** planned 2026-10-26. Three phases, built in order. Phase 1 built 2026-10-27. Phase 2 built 2026-10-27. Phase 3 built 2026-10-27.

## 1. Problem

Today every member of a club can suggest, and a suggestion can only be a book from Open Library. Admins asked for three things:

- **Choose who suggests.** Some clubs want the admin to set the reading menu and members only to vote.
- **Suggest more than books.** An author ("something by Ursula K. Le Guin") or a text that isn't a book in Open Library: a short story, an essay, an article, a poem.
- **Name the suggestions.** The section is always "Suggestions". An admin wants to write "What should we read in November?" or "Spooky stories for Halloween".

Buddy reads aren't touched: they have no suggestions and always read one book.

## 2. Decisions

### 2.1 Asked 2026-10-26

- **"No member suggestions" means only the admin and moderators suggest.** The suggestion list and the vote stay as they are. Members still vote, they just can't add.
- **An author suggestion that wins becomes a book.** When confirming, the admin picks one of that author's books. From then on it's an ordinary book round: progress bars, checkpoints, ratings on everyone's log.
- **A text that isn't a book has simple progress inside the club.** Each member marks Not started / Reading / Finished in the club. Checkpoints have a label and a due date, no page or chapter. Ratings stay inside the club: nothing goes to the member's reading log, shelves or stats.
- **The suggestion title is set per round.** The admin writes it when the round opens and can change it. Empty means today's wording.

### 2.2 Decisions I made, for the user to confirm

- **Who suggests is a club setting in Settings, admin only**, like the other club settings (`specs/stronger-clubs.md` §2.2): "Who can suggest: Everyone / Only the admin and moderators". Default Everyone, so existing clubs don't change. Switching to "Only the admin and moderators" leaves suggestions members already made on the list (removing them is the admin's call, with the existing remove button).
- **The round's title can be set by the admin or a moderator**, in the same "Voting options" panel as the voting style, because the two are set at the same moment. It can be changed at any time while the round is Suggesting, even after votes: it's wording, not a rule. Up to 80 characters, plain text. It also shows in the round's history, the "new round" notification and the club's share card.
- **An author is picked from the app's author search** (the author pages that already exist), not typed. A typed name goes in as a text item instead.
- **A text item has:** a title (required, up to 200 characters), "by" (optional, up to 120), a link (optional, `https://` only, up to 500, opened in a new tab with `rel="noopener noreferrer nofollow"`, as meeting video links are) and a short note (optional, up to 500, e.g. "it's in the October issue of The New Yorker"). No cover: the card shows a plain paper tile with the title, in the club's look.
- **A text round copies the winning text onto the round** (title, by, link) when confirmed, so the round still reads right if the suggestion is ever removed. A book round keeps working as today through `BookId`.
- **"Finished" on a text round counts for "everyone's finished"** in the same places a finished book counts (the round's progress strip, the wrap-up prompt). Not started is the default.
- **A cap and approval apply to all three kinds the same way.** Three suggestions of any kind count as three.
- **The data download** lists text rounds and text suggestions with their title and "by", like book ones.

## 3. Design

### 3.1 Phase 1 — Who suggests, and the round's title

**Data**
- `Club`: `SuggestionsFrom` (`Everyone` / `Managers`, default `Everyone`).
- `ClubBookRound`: `SuggestionsTitle` (string, optional, 80).

**Rules**
- A member's suggestion in a `Managers` club is refused with a new error code (`clubs.suggestionsManagersOnly`).
- The title is trimmed; empty is stored as null. Line breaks are refused.
- Settings (`ClubSettingsService`) gains the field; voting options (`GET`/`PUT /api/clubs/{id}/voting`) gain the title, still sending every option each time.

**Frontend**
- Settings: a two-option choice under the visibility switch.
- The suggestions section heading shows the title when there is one, with today's heading text as the small kicker above it.
- In a `Managers` club, members don't see "Suggest"; a quiet line says "Only the admin and moderators suggest in this club. You can vote."
- The title field sits first in the "Voting options" panel, with a placeholder example.

### 3.2 Phase 2 — Author and text suggestions (server)

**Data**
- `BookSuggestion` gains `Kind` (`Book` / `Author` / `Text`, default `Book`). `BookId` becomes optional. New: `AuthorId` (optional), `TextTitle`, `TextBy`, `TextLink`, `TextNote` (all optional). A check constraint makes exactly the right fields set for each kind. (The class keeps its name, so the migration is small; its summary says it's no longer only books.)
- `ClubBookRound` gains `TextTitle`, `TextBy`, `TextLink` (set when a text suggestion is confirmed; `BookId` stays null then).
- `ClubTextProgress`: `RoundId`, `UserId`, `Status` (`Reading` / `Finished`; no row = Not started), `UpdatedAt`. Key (`RoundId`, `UserId`).
- `ReadingCheckpoint`: a text round's checkpoints have no range and no target page.

**Rules**
- `CreateSuggestionRequest` takes `kind` plus `bookId`, `authorId` or the text fields. The same book or author twice in a round is refused, as a book is today. Two text items with the same title (ignoring case) are refused too.
- Text fields are trimmed, length-checked, and the link must parse as an absolute `https://` URL. All are stored as plain text and shown as text, never as HTML.
- **Confirm:** `ConfirmBookRequest` gains an optional `bookId`, required when the suggestion is an author (one of that author's works, fetched through `OpenLibraryClient` and cached as any book is) and refused otherwise. A text suggestion confirms with no book and copies its text onto the round.
- **Text rounds:** `PUT /api/clubs/{id}/rounds/{roundId}/text-progress` (`status`: `NotStarted` / `Reading` / `Finished`), members only, Reading phase only. Club progress and the members list use it instead of the reading log. Ratings save the `ClubRoundRating` row only and skip `StageClubRatingAsync`. Checkpoint validation refuses a range or target page on a text round, and requires one on a book round as today. The "N pages behind" reminder text is skipped.
- **Every place that shows the round's book** shows the text title (and "by") when there's no book: the club page, directory cards, invites, meetings and the calendar file, notifications, activity, history, share cards, the data download. Each of these is listed and tested.
- Blocks and bans work as they do for book suggestions. Reports: no suggestion could be reported before this feature (see Phase 2's notes and the Phase 3 task).

**Security:** user text reaching the server, and a link shown to other members. `argos-security` reviews this phase.

### 3.3 Phase 3 — Author and text suggestions (browser)

- **Suggest:** the suggest box gets three tabs: Book (today's search), Author (author search), Something else (title, by, link, note). Each tab says in one line what it's for.
- **Cards:** an author card shows the author's photo (or initials) and their name alone (it said "Any book by …" until 2026-10-27; a club reading short stories doesn't pick a book); a text card shows the paper tile, title, "by", the link's site name and the note.
- **Confirm modal:** for an author, a second step lists that author's books to pick one; for a text, it says "Progress is tracked in the club, not on shelves".
- **Text round:** the current-read card shows the title, "by" and link; each member's row has the Not started / Reading / Finished status instead of a page bar; "Your status" is three buttons for the reader. Checkpoints are set with a label and date only.
- Translations in all five languages; tests in `ClubPage.test.tsx` and the confirm modal's tests.

## 4. Explicitly out of scope

- Text items in buddy reads.
- Uploading a file (a PDF of the story). A link only.
- Turning a text round into a book later, or adding a text to anyone's shelf.
- Suggesting a whole series.

## 5. Tasks

### Phase 1 — Who suggests, and the round's title

#### Backend
- [x] Migration: `Club.SuggestionsFrom`, `ClubBookRound.SuggestionsTitle` (`ClubSuggestionOptions`).
- [x] Settings field (admin only), the refusal and its error code, the title in voting options; tests for a member refused, a moderator allowed, the title trimmed and length-checked.

#### Frontend
- [x] Settings choice, heading with the title, the members' line, the title field; translations; tests.

#### Verification & docs
- [x] `reviewer`; `browser-check` with an admin and a member; `CHANGELOG.md`.

**Built 2026-10-27, notes:**
- `SuggestionsFrom` left out of the settings request keeps its value; a buddy read ignores it. The voting options request always carries the title (left out clears it, as the other voting options), as the form sends every option.
- "One line" refuses any control character and U+2028/U+2029, not only `\n` and `\r`.
- The title shows in: the suggestions heading (the usual heading as a small label above), the round's own page (its facts line), the round-opened notification (read on show, only while the round is still Suggesting), and the visitor card and share card ("Choosing the next read: …") while the round is Suggesting.
- A member in a "managers only" club also gets "No books suggested yet." instead of "Suggest one below".
- Reviewer: no blocking findings. Left as is: two managers saving voting options at the same instant can drop one's style/cap change silently (older than this phase, `optionsChanged` is read before the lock); the settings form overwrites with what it loaded, as its other fields do.

### Phase 2 — Author and text suggestions (server)

#### Backend
- [x] Migration: suggestion kind and fields with the check constraint, round text fields, `ClubTextProgress` (`ClubAuthorAndTextSuggestions`).
- [x] Create, duplicate and cap rules for all three kinds; confirm for an author (pick a book) and a text.
- [x] Text progress endpoint; progress, ratings, checkpoints and reminders on text rounds.
- [x] Every place that shows the round's book handles a text round (§3.2 list); tests for each (`ClubSuggestionKindsTests`).

#### Verification & docs
- [x] `reviewer` and `argos-security`; fix findings.

**Built 2026-10-27, notes:**
- **Don't push Phase 2 to the live site without Phase 3.** Today's pages know only books: a text or author suggestion made through the API shows as a blank row, and a confirmed text round as a current read with no title.
- The suggest request takes `kind` with `bookId`, `authorOpenLibraryId` (the author search's id, not our row id; an author nobody opened yet is fetched and stored as their page does) or `textTitle`/`textBy`/`textLink`/`textNote`. Only that kind's fields may be sent; blank text fields count as not sent, so an old book-only request still works.
- Confirming an author takes `bookOpenLibraryId`, a work id (the author page's works list gives these), fetched and cached through `BookService`/`OpenLibraryClient`. It must list the author in its author ids, or by name for a book cached before it had ids. A book id sent for any other kind is refused.
- Text checks: title required (one line, 200), "by" (one line, 120), link `https://` with a host and no user name or password (`HttpsLink`, shared with meeting video links; stored as parsed, 500), note (500, line breaks kept as `\n`, no other control characters). Control characters, U+2028/2029 and the invisible marks that turn text around (U+202A–202E, U+2066–2069) are refused (security review). Markup is stored as typed; the page must show it as text.
- Every member has a ceiling of 10 suggestions a round (the highest cap) even when the admin sets no cap; the cap counts all kinds and is checked before Open Library is asked. Books, authors and titles (ignoring case) are each once per round. Its message now says "suggestions", not "books".
- In a block, **text** suggestions are left out both ways, as discussion posts are; book and author suggestions stay for everyone (nothing typed).
- API shapes for Phase 3: `BookSuggestionDto` has `kind`, the book fields (now optional), `authorOpenLibraryId`/`authorName`/`authorPhotoUrl` and the four text fields. `ClubBookRoundDto` has `textTitle`/`textBy`/`textLink` (book fields null on a text round). `ClubMembershipDto.textStatus` (NotStarted / Reading / Finished) on a text round, with the log fields null; `MyClubSummaryDto.myTextStatus`. The one-line summaries (directory card, rail, join preview and share card, invites, activity, meetings and the calendar file, notifications) carry a text round's title in their existing book-title field, with no cover and no Open Library id. `PUT /api/clubs/{id}/rounds/{roundId}/text-progress` `{ status }` (required; the same status again changes nothing).
- Finishing a text records the same "progress 100%" activity a finished book does. Ratings save the club rating only. Checkpoints on a text round take a label and a date, no range or target page. The due reminder goes to members who haven't marked it finished, with no "pages behind".
- Data download: a club message in a text round names it "Title by Author" in the Book column. Suggestions themselves (any kind) and text progress aren't exported; added to `bugs/club-memberships-missing-from-export.md`.
- Left as is (reviews): duplicates and the cap are read-then-insert, as for books before (a double click can add two); confirming an author's book answers with the work's own title, not the reader's language (the page reloads the club anyway); an author merge moves suggestions whatever the names say, and a round with both ids then lists the author twice; a duplicate title refused can reveal a waiting suggestion, as books already do; `Down` leaves text rounds reading nothing (dev rollback only).
- Reports: suggestions were never reportable, and a text suggestion is now someone's own words shown to the club. Managers can remove one; nobody can report one, including one by a manager. Added as a Phase 3 task.

### Phase 3 — Author and text suggestions (browser)

#### Backend
- [x] ~~Reporting a suggestion~~: the user chose (2026-10-27) to build it as its own piece, before these options reach the public launch → `bugs/club-suggestions-cannot-be-reported.md`, built the same day.

#### Frontend
- [x] Suggest tabs, author and text cards, the confirm modal's author step, the text round's status; translations; tests.
- [x] A text's link: show the site name from `new URL(link).hostname` (the ASCII `xn--` form for a look-alike domain), never by cutting the string; title, "by" and note rendered as text (`dir="auto"`).

#### Verification & docs
- [x] `web-design` critique round; `browser-check` with three readers (a text round from suggestion to wrap-up, an author round to a book); `reviewer`; `CHANGELOG.md`.

**Built 2026-10-27, notes:**
- Pieces: `SuggestForm` (Book / Author / Other tabs as a `Segmented` control, a hint line each; the author tab uses the app's author search; the text tab has Title, By, Link, Note with the server's limits and checks the link is https before sending), `SuggestionSummary` (thumb and words for any kind, also a text round's header), `PaperTile` (a sheet of paper standing where a cover would; also on the club's "Books we've read" shelf through a new `paper` option of `Shelf`), `lib/clubSuggestion.ts` (`suggestionName`, `isTextRound`, `roundTitle`, `linkSiteName`).
- The link pill shows `new URL(link).hostname` minus a leading "www." (a look-alike domain shows as `xn--…`), opened with `rel="noopener noreferrer nofollow"` (`PillLink` gained `nofollow`). Typed text is plain React text with `dir="auto"`; names in the "by …" and "Any book by …" sentences are a child of their element, never an interpolated value, because `Trans` parses its string as markup (reviewer finding, with a test).
- Confirm modal: an author suggestion adds "Which book by …?" (the author's works, 24 at a time, a radio each); a text shows a note and checkpoint rows with only Name and Due date, no schedule template. Checkpoints added later on a text round are the same.
- Text round: the "What's next" card has the paper tile, title, by and link, "Your status" (Not started / Reading / Finished) and "N of M members finished"; member rows show a status pill; "Your clubs" cards and the rail show the status word. Rating a text says "Rate it". A text's round page says "Round N" instead of "Book N".
- Wording: "Suggest a book" became "Make a suggestion"; "Confirm book" became "Confirm next read"; the cap, empty and voting lines say "suggestions" instead of "books". The club activity for 100% now says "finished <title>" (for books too), since a text's only percent is finishing it.
- Verification: `browser-check` passed both flows (text from suggestion to rating and the shelf; author to an ordinary book round). Critique round (`design-reviewer`, disposition "fix"): applied a 5-line clamp on the tile's title, a shorter "Other" tab, "by" and the link on one line, more room in the confirm modal and a narrower status control; left the tabs at their natural width on desktop (as other `Segmented` uses) and no shelf board in "Just finished" (books have none there either). The second screenshot round was skipped: re-shooting needed fresh seeding, and the fixes were small CSS and text changes covered by tests. Reviewer: the `Trans` finding above, a stale pick when a suggestion is removed while the confirm dialog is open, and `dir="auto"` on activity titles, all fixed.
- Left as is: a text's wrap-up checkpoint still says "the whole book" in its spoiler warning; the status buttons aren't disabled while saving (the server ignores the same status twice); the Feed's activity cards show a text round's title under a generic cover.
- Phases 2 and 3 can now go live together (Phase 2's note); the reporting bug above should follow before the public launch.
