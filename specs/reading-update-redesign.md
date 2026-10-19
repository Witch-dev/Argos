# Feature Spec — Reading update redesign (the story viewer)

**Status:** 📝 Specced 2026-10-18 with the user, from the mockups at https://claude.ai/artifact/MGU9BPDPANSr9MvpsMZvPv (second row: "Chosen: A with B's journey" and the three "Book colour" screens). Phase 1 built 2026-10-18 (the new look with today's data); Phase 2 built 2026-10-19 (the book's colour); Phase 3 built 2026-10-19 (the progress history). ✅ All three phases done.

Builds on `specs/reading-stories.md` (the viewer, likes and comments) and follows `DESIGN.md` and `PRODUCT.md`.

## 1. Problem

Opening someone's reading update (the Readings strip on Books and Feed) shows a form more than a moment: a small "CURRENTLY READING" kicker, a thin bar, "35% · page 106 of 304" in small grey text, the note in a plain grey box, "3 likes" as a bare number, and a full comment form taking half the screen. The user, 2026-10-18: "it doesn't look that appealing … doesn't make me want to progress and share." Nothing shows how far the reader has come, who cheered, or invites a quick reply.

## 2. Decisions (2026-10-18, with the user)

1. **Direction: A with B's journey.** Of four mockups (A on the shelf, B the reading journey, C full-bleed, D margin note) the user chose A's look with B's journey line in place of A's plain bar.
2. **The background takes the book's colour.** Its hue comes from the cover; the app sets the lightness so text always reads.
3. **Light version** (a pale tint, dark text), chosen by the user 2026-10-19 over the deep version (dark tint, cream text), which stays out of scope.
4. ~~**Quick replies fill the reply field**~~ Removed 2026-10-19: once built, the user didn't like the canned phrases. The reply bar is the one-line field alone.
5. **Phased by data:** first the new look with what the API already knows, then the book colour, then a progress history for the earlier points on the journey line.

## 3. Design

The chosen screen, top to bottom (phone first, 390px; the same column centred in the desktop modal):

1. **Header (unchanged in function):** story segments, the reader's picture and name, "2 hours ago", close.
2. **The book on its shelf:** the cover (about 112×168) with a spine shade and shadow standing on a 10px shelf board (`Shelf` look), a green ribbon bookmark hanging from its top edge. Beside it: "is on" (muted), **"page 106"** in the display face (Literata 600, ~44px), "of 304, day 18" (muted). Audiobooks: "is at 3 h 20 min" / "of 9 h 40 min" (the app's audio format). No page count: "is reading" and the title, no number. Under the board: title in the display face, author(s) muted.
3. **The journey line** (replaces the progress bar): a track the width of the column, filled up to now; a dot at the start ("Oct 1 / started"), a ring at today ("today / p. 106", green, bold), a hollow dot at the end ("the end / p. 304"). Phase 3 adds a dot for each earlier update (up to four, the latest kept) and a pill under the line: "+26 pages since Thursday". Dates through `Intl` in UTC (as the journal); never a middle-dot string.
4. **The note** as DESIGN's quote card: raised, the oversized green opening quote mark, the text in the reading face (~18px). No note: the card is left out (no empty box).
5. **Who loved it:** a 48px heart button (filled in the heart colour when you liked it, the existing pop), then named pills ("Maya", "Theo", picture + name, up to two) and "and N more loved this" / "and you". The Named-Person Rule: never a bare count. Tapping the names opens the existing likers list if there is one, else nothing.
6. **Reply area** (fixed at the bottom, over a hairline): a one-line field ("Cheer alice_reads on…", with the reader's name: the app doesn't know anyone's pronouns, so the mockup's "Cheer her on…" isn't used) and a green send button. (Quick-reply pills above it were built in Phase 1 and removed 2026-10-19, decision 4.) Comments themselves open below as today (the existing thread), not as a half-screen form.
7. **Your own update:** no reply field; instead the existing "Add progress" action in that slot, and the likes line as "Maya and Theo loved this".

**The book's colour (Phase 2):** the viewer's background, the journey fill, the today ring, the "+N pages" pill and the quote mark take the cover's hue; the quote card, text, heart and send button keep the site's fixed colours, so it still reads as Winged Words. Light version per theme:
- Paper, White, Warm Gray, Sepia: background = the hue at very high lightness and low saturation (about L 92%, S 20–30%); accents = the hue at a dark lightness (about L 30–35%) so they pass 3:1 on the background and text on the pill passes 4.5:1.
- Dark: background = the hue at low lightness (about L 16%, S 20–30%), accents light (about L 75%).
- No cover colour (no cover, or not computed yet): the theme's own page colour and the bookbinding green: today's look, never a broken one.
- A unit-tested helper (`web/src/lib/bookTint.ts`) turns `#rrggbb` + theme into CSS variables and checks contrast; extreme covers (near-white, near-black, grey) fall back to a neutral tint.

**Motion (DESIGN.md "Motion"):** one moment with a job: when an update opens, the journey's fill slides from the previous point (or the start) to today and the today ring lands (≤300ms, the arrival curve). It shows the change of state the update is about. Reduced motion: drawn at its end state. The heart keeps its pop. No other animation.

## 4. Data

| Needed | Today | Change |
|---|---|---|
| Page, total, format, minutes, note, cover, title | `ActivityItemDto` | none |
| Author(s) | not in the story | add `bookAuthors` to `ActivityItemDto` |
| Day N / started date | the log's `StartedAt` (not sent) | add `startedAt` |
| Who liked it | `likeCount` only | add `likedBy`: up to 3 `{id, username, displayName, avatarUrl}`, the viewer's own like excluded (it is `viewerHasLiked`), readers in a block with the viewer or with the story's owner (both ways) and deactivated accounts left out, newest first. Built: the owner-block rule came from the Phase 1 security review (naming a liker the owner is in a block with would tie the two together for everyone else) |
| "Add progress" on your own update | the book's Open Library id only | add `bookId` (the progress form edits that book's reading) |
| The book's colour | nothing | Phase 2: `Book.CoverColor` (`#rrggbb`, nullable), sent as `bookCoverColor` |
| Earlier updates, "+N pages since" | the log keeps only its current page | Phase 3: a `ReadingProgressEntries` table |

**`Book.CoverColor` (Phase 2):** computed once on the server when a book is cached or refreshed with a cover (`OpenLibraryClient`/the book refresh job): download the medium cover, take the dominant colour of the image's middle area (ignoring near-white and near-black pixels, a coarse histogram), store it. One image library (check the licence before adding one: SkiaSharp is MIT; ImageSharp's Split License needs reading). A failed download leaves it null and is retried with the next refresh. Backfill: books already cached get it as the refresh job passes them, plus a one-off admin-free startup job limited to N books a run so Open Library isn't hammered (`OpenLibraryClient` rate rules). Covers of the reader's chosen edition: the colour follows the cover the story shows (`bookCoverUrl`); store it per cover URL if editions differ (a small `CoverColors` cache keyed by URL is the simpler option; decide in Phase 2).

**`ReadingProgressEntries` (Phase 3):** `Id`, `LogId` (cascade delete with the log), `Page` (nullable), `Minute` (nullable), `CreatedAt`. A row is written whenever a log's progress changes (page or minute), not for note-only edits; at most one row per log per hour (a later change in the hour replaces it, so typing 10, 12, 14 doesn't make three dots). The story sends the last five as `progressHistory` (oldest first) and `pagesSincePrevious` + `previousAt`. Nothing to backfill: books in progress start their line from the first update after release. Visibility follows the log's reading visibility, as the story itself does; deleting the log or the account deletes the rows (export: include them in the reading log CSV as a "progress" file, `specs/account-deletion.md`/export spec).

## 5. Out of scope

The deep version and a full-bleed layout (§6); sharing an update outside the app as an image (`FUTURE-IDEAS.md`, wrap-up); reactions other than the heart; editing a past update.

## 6. Open questions for the user

1. ~~**Light or deep background?**~~ Answered 2026-10-19: light (calm, readable for every cover, no DESIGN.md exception).
2. ~~**Quick-reply wording**~~ Answered 2026-10-18 ("That part!", "No spoilers please", "Where are you?"); moot since the pills were removed 2026-10-19.
3. **Book colour elsewhere** (a book's page header, the Feed card): later, separately, once Phase 2 is in.

## 7. Tasks

### Phase 1 — The new look with today's data (size M)

**Backend**
- [x] `ActivityItemDto`: `bookAuthors`, `startedAt`, `likedBy` (up to 3, blocks both ways, the viewer excluded). Repository query for the likers in one go for all stories in a page (no N+1). Tests: likers named and capped, a blocked liker left out, the viewer's own like not listed.

**Frontend**
- [x] `StoryViewer` rebuilt to §3 (book stage with ribbon, page number, journey line with start/today/end, quote card, named likes, quick replies + one-line reply, own-update variant, audiobook and no-page-count cases). Shared pieces where they exist (`BookCover`, the quote card, `Avatar`, pills); a `ReadingJourney` component for the line.
- [x] The journey's fill motion and its reduced-motion end state.
- [x] Every string through `t()` in five languages (quick replies, "is on", "of {{total}}, day {{day}}", "and {{count}} more loved this", "Cheer {{name}} on…", journey labels), plurals with i18next.
- [x] Tests: the stage, journey labels, named likes, quick reply fills the field without posting, own update shows Add progress, no note, no page count, audiobook.

**Verification**
- [x] `web-design` critique round (`scripts/shoot.mjs`, Paper and Dark, 375 and 1280, all five themes) and the `design-reviewer` agent; keyboard pass (focus stays in the viewer, Escape closes, the field and quick replies reachable); German at 375 for length.
- [x] `reviewer` agent; `argos-security` too (likers list crosses users: blocks and visibility).

**Built notes (Phase 1):** on a phone the ‹ › arrows sit in the header row (the reply bar owns the bottom); the likers sentence is a `Trans` with the names as pills (`<first/>`, `<second/>`), no comma straight after a pill; a value longer than 8 characters ("3 h 20 min", "Seite 1234") steps down to `--font-size-2xl`; "Add progress" opens the progress form in the viewer's place; the comment thread lost its own composer in the viewer (`composer={false}`) and shows only when there are comments. Fixed 2026-10-19: the today ring's layer is as wide as the line and slid along it, which gave the viewer a sideways scrollbar; `.journey` now has `overflow-x: clip`.

### Phase 2 — The book's colour (size M)

**Backend**
- [x] Image library chosen (licence checked), `Book.CoverColor` (or a `CoverColors` cache by URL, §4) + migration; computed when a book is cached/refreshed with a cover; the limited backfill job; `bookCoverColor` on `ActivityItemDto`. Unit tests on the colour picking with small fixture images (a blue cover, a mostly-white cover, a black-and-white one).

**Frontend**
- [x] `lib/bookTint.ts` (hue → CSS variables per theme, contrast-checked, neutral fallback), unit tests including contrast for 20 sample colours in all five themes; the viewer uses it.

**Verification**
- [x] Screens of three real books with very different covers in all five themes; contrast checked; `design-reviewer`; `reviewer`.

**Built notes (Phase 2):** SkiaSharp 4.153.1 (MIT) with its Linux NoDependencies natives; ImageSharp was ruled out because its Split License turns paid above US$1M revenue. Colours are kept in a `CoverColors` table keyed by cover address, not on `Book`, because a reading shows its chosen edition's cover. One job does both "computed when cached or refreshed" and the backfill: `CoverColorService` runs hourly over the covers of readings in progress that have no row yet, newest first, 100 per run, paced like imports. A new or refreshed cover is a new address, so it is picked up by the next run. The picker reads the middle 70% of a 40×60 sample and ignores near-white, near-black and grey pixels (the grey also covers the blend at lettering edges). Fewer than 8% coloured pixels means no colour, and so the theme's own look. A failed download is stored and retried after 7 days, except the run of failures that ends a run (5 in a row is an outage), which is dropped so the covers are tried again next run. Downloads go to `covers.openlibrary.org` only, follow its redirect to Open Library or Internet Archive hosts only, and are capped at 2 MB. `bookTint` copies each theme's page, raised, text and muted colours (a test checks them against `index.css`). It starts at L 92% (Dark 16%) and moves the page away from the text until text and muted text pass 4.5:1. It starts the accent at L 32% (Dark 75%) and moves it until it passes 4.5:1 on the page and 3:1 on the quote card. The story segments are tinted too, as progress. First real covers: The Hobbit olive `#54522d`, The Great Gatsby purple `#542d77`, Dune maroon `#371a24`. design-reviewer: ship, no fixes.

### Phase 3 — The progress history (size M)

**Backend**
- [x] `ReadingProgressEntries` + migration; written on progress changes (one per log per hour); `progressHistory`, `pagesSincePrevious`, `previousAt` on the story; included in export and removed with the log/account. Integration tests: entries written and collapsed within the hour, visibility as the log's, deletion.

**Frontend**
- [x] Earlier dots on the journey (up to four), the "+N pages since <day>" pill (relative day names through `Intl`), the fill sliding from the previous point.

**Verification**
- [x] `browser-check` with a seeded reader who updates a book several times over days; `reviewer` and `argos-security` (new personal data: export and deletion); `CHANGELOG.md` line per phase.

**Built notes (Phase 3):** a point keeps the `CreatedAt` of its hour's first change and takes the hour's last value. A point is staged on create when a page or minute is given, and on update when the page or minute changes to a new value; a cleared page writes none. The story's latest five come from one query (a correlated "fewer than five newer" count over the `(LogId, CreatedAt)` index, since EF can't translate group-then-take). The pill counts pages only, so an audiobook gets the dots but no pill. It shows only when the latest point is the reading's current page (reviewer: the history can lag behind a cleared page) and the page went up. Times go out rounded down to the hour (argos-security: the viewer names days, and followers needn't learn a routine to the minute). Points written while a reading was private show if it is opened up later, as its other fields do (accepted, security review). The pill reads "+12 pages today" for an earlier update the same day, "since yesterday", "since Friday" within the week (`Intl` weekday), then "since 3 Oct". The fill and ring slide from the previous point (measured: 34% → 41% for pages 142 → 168 of 412). Export: `progress.csv` (book, Open Library ID, log added, page, minute, time in UTC). Data is kept as the reading's: deleted with it and with the account (DB cascade), covered by tests. The privacy policy should mention it at its pre-launch re-read (ROADMAP Stage 10).
