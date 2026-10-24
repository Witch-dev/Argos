# UX review — Clubs (`/clubs`, `/clubs/:id`)

## Re-review after stronger clubs Phase 6 (2026-10-23)

Reviewed: 2026-10-23 · Themes: Paper, Dark · Widths: 375, 1280 (German at both, by measurement) · Readers: a non-member with no clubs (directory, preview, invite link) and the admin (club page, Settings) · Apollon with `specs/stronger-clubs.md` Phases 1–6 uncommitted on top of `2967385`
Screenshots looked at (by the `design-reviewer` agent; measurements in this session): the directory at the top and three scrolls down; filtered (Fantasy + Recently active); "More topics" open; no match with and without a topic; the language menu; the public preview with "Club rules"; the private invite link; the club page's facts and "About this club"; Settings' topics (3 chosen), language and rules; German at 375 and 1280; 25 Tabs from the top. Seeded clubs: three topics + Spanish + 600 characters of rules, a 74-character name, nothing set, German, private with rules, 40 days quiet.
Code read: `ClubsDirectoryPage.tsx` + `.module.css`, `lib/clubActivity.ts`, `ClubJoinCard.tsx`, `ClubPage.tsx` (`ClubTopics`, the rules well), `ClubSettingsPage.tsx` (the about fields), `Pill.module.css`, `Segmented.module.css`, `StateMessage.tsx`.

### Summary

The new pieces work and hold up: German fits at 375 (no sideways scroll, "Meiste Mitglieder | Zuletzt aktiv" on one line), the long name wraps, rules keep their line breaks, and "Active 3 days ago" reads naturally. The weak spot is the filter block: on a phone the first club starts at 574px of a 700px screen, under four rows of controls, and the language menu's label "Language" reads as the site's language (the sidebar has a menu with the same name). Biggest fix: name the menu for what it filters and lighten the filter block on phones.

### Scores

**Nielsen: 26/40 (acceptable)**, was 25/40 on 2026-10-18.
- **1 Visibility of status: 2.** The list changes silently when a filter changes (no count, nothing announced); a no-match doesn't say what it matched against (findings 3, 6).
- **4 Consistency: 2.** The same rules are "Club rules" before joining and "About this club" after; the phase pill on a card looks like the filter pills just above it (findings 5, 7).
- **8 Aesthetic and minimalist: 2.** Search, language, sort and topics stack up before the first club (finding 2).
- **9 Error recovery: 2.** A search alone that matches nothing has no "Clear" (finding 3).
- Scored 3: match with the real world, user control (filters live in the address, Back works), error prevention, recognition, flexibility, help (the Settings hints).

**Cognitive load: moderate** (2 failed: *one focus*, the filters outweigh the list on a phone; *at most 4 visible options*, nine topic pills plus "More topics").

**Personas:**
- **Lucía**, a new reader on her phone in the evening, looking for a Spanish-speaking club: sees "Language: Any language" and isn't sure if it changes the site. The first club is barely in view under the controls.
- **Sam**, on a screen reader: hears two menus called "Language" (the sidebar's, then the directory's), and nothing tells him the list changed after he picks a topic.
- **The stress tester** (long names, German, 600-character rules): passes. The 74-character name wraps over two lines (card 189px at 1280), nothing overflows in German, and the rules keep their breaks.

**Specificity:** passes: cloth-bound initials and covers on the cards, topics in the reader's own genre words, "Quiet for a while" rather than a date.

### Findings

#### 1. "Language" reads as the site's language — P2 · S · Rule
**Where:** `ClubsDirectoryPage.tsx` the `languageField` label (`clubs.directory.language`); the sidebar's language menu, two Tab stops earlier, has the same name.
**What:** "Language" + "Any language" sits under the search. The site's own language menu is in the sidebar. A screen reader announces both as "Language".
**Why it matters:** a reader may avoid it, worried it switches the site, or pick "Español" expecting Spanish text; two controls with one name break *recognition*.
**Fix:** a label that says what it filters. Settings already says "Language the club talks in", so use "Talks in" with "Any language", in all five languages.
**Status:** open

#### 2. On a phone the filters push the first club to the bottom of the screen — P2 · M · Judgement
**Where:** `/clubs` at 375×700. "Discover clubs" at y 302, the first card at y 574, below the search, the language menu, the sort and the topics row (each 44px, `--space-3` apart). At 1280 the first card is at y 408.
**What:** in a first view the reader sees controls, not clubs. Two critique rounds while building already put the language menu and the sort under the search and cut the topics to eight.
**Why it matters:** most readers browse on a phone (PRODUCT.md). Clubs are what a reader comes for; the filters are for narrowing later.
**Fix (pick one):** (a) on phones, fold language and sort behind one "Filters" button (`btn-quiet`, `aria-expanded`), showing the count of active filters, and keep search + topics visible; or (b) put the language menu and the sort side by side at 375 (the sort's labels are short in every language but German, so measure "Meiste Mitglieder"). (a) saves ~100px, (b) ~55px.
**Status:** open

#### 3. A search alone that matches nothing has no way back — P2 · S · Rule
**Where:** `ClubsDirectoryPage.tsx` the `EmptyMessage`, where "Clear filters" shows only when `topic || language`.
**What:** "No public clubs match." with nothing after it when only the search is set; with a topic it says "Clear filters" but not what matched nothing.
**Why it matters:** DESIGN.md's empty states: a no-results state names what happened and offers the next step.
**Fix:** show "Clear filters" whenever `filtering`, clearing the search too. Name the search in the message ("No public clubs match "zzzxq"."), and add "or start one" linking to "Create a club" as a quiet link (the green button stays the header's).
**Status:** open

#### 4. Club page topics look like the directory's filters but go nowhere — P3 · S · Judgement
**Where:** `ClubPage.tsx` `ClubTopics` (plain `Pill`s beside the members and the language).
**What:** the same pills that filter on `/clubs` are static here.
**Fix:** make each a link pill to `/clubs?topic=<key>` (`Pill` already has a link style). A reader who likes one club finds others like it.
**Status:** open

#### 5. The rules are "Club rules" before joining and "About this club" after — P3 · S · Rule
**Where:** `ClubJoinCard.tsx` (`clubs.rules.title`) and the well at `ClubPage.tsx:855` (`clubs.rules.aboutTitle`), which holds only the rules (the description is in the header).
**Why it matters:** PRODUCT.md's one word per idea. "About this club" also suggests more than the rules.
**Fix:** "Club rules" in both places; drop `aboutTitle` from the five locale files.
**Status:** open

#### 6. Changing a filter isn't announced — P3 · S · Rule
**Where:** `ClubsDirectoryPage.tsx` the Discover list. No `role="status"`. `EmptyMessage` is a plain `<p>`.
**What:** a screen-reader user presses "Fantasy" and hears only "pressed". Whether the list grew, shrank or emptied isn't said.
**Fix:** a visually hidden `role="status"` after the filters with the count ("4 clubs", `t` with plurals) or the no-match text, updated after each response.
**Status:** open

#### 7. A card's phase pill looks like the topic filters above it — P3 · S · Judgement
**Where:** `DirectoryFacts` in `ClubsDirectoryPage.tsx`: `<Pill>` "Choosing next book" / "Reading: …", the same sunken pill as the topic `PillButton`s 100px higher.
**Why it matters:** with clickable pills just above, a reader may tap "Choosing next book" expecting a filter. It is part of the card link.
**Fix:** set the phase as the first plain fact in `--text` (not muted) instead of a pill, or keep the pill only for "Reading: <title>".
**Status:** open

#### 8. The rules field doesn't show its 2,000-character limit — P3 · S · Rule
**Where:** `ClubSettingsPage.tsx` the rules `<textarea maxLength={2000}>`.
**What:** pasted rules longer than the limit are cut off silently.
**Fix:** a "1,840 / 2,000" counter under the field once past ~1,500 characters with the shared `CharacterCount` component, as the other long fields do.
**Status:** open

#### 9. The Join button doesn't carry "By joining you agree…" — P3 · S · Rule
**Where:** `ClubJoinCard.tsx`. The agreement `<p>` comes after the button and isn't linked to it.
**What:** a screen-reader user tabbing to "Join club" doesn't hear that joining accepts the rules.
**Fix:** give the `<p>` an id and the button `aria-describedby` to it.
**Status:** open

### Looked fine

German at 375 and 1280: no overflow, sort on one line, card facts wrap whole ("1 Mitglied", "Heute aktiv", "Auf Deutsch"). The 74-character name wraps. The rules keep their breaks in the join card and on the club page. "By joining you agree…" is 14px `--text-muted` (4.5:1). "Quiet for a while" and the `Intl.RelativeTimeFormat` wording work. The selected topic pill is the green wash plus green text at weight 600 (not colour alone). The focus ring is 2px `--accent` with a 2px offset on pills and the sort. Pills and "More topics" are 44px on phones; on desktop they are 32–36px (the sort's tap area is 44px through its `::before`). The phone topic row clips its last pill at the edge, which shows there are more. Tab order: page actions, search, language, sort, topics. Settings: three topics then the rest disabled, with "Up to 3" right above. One green button per view. Dark: muted text readable on raised cards. Not new: the 403 a non-member's club page logs before its preview (noted in Phase 6).

## Earlier review (2026-10-18)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; the rest on contact sheets) · Widths: 375, 1280 · Reader: logged in, admin of two clubs (one reading Jane Eyre, a book the reader had already logged as Read, with one checkpoint; one choosing) · Apollon at `be32e1c`
Screenshots looked at: the Clubs page at the top and 700px down; "The Tuesday Readers" at the top and 700 and 1,400px down; 1280 and 375. Tab walk on the club at 1280 Paper. Not captured: a checkpoint discussion, a past round, the modals, a club with many members (checked when built, Phase 3).
Code read: `ClubsDirectoryPage.tsx`, `ClubPage.tsx`, `ClubNextUpCard`, `MyClubsCard.tsx`.

## Summary

The club page opens well (the book on its board, the next checkpoint, your progress) and the directory's cards with cloth-bound initials are charming. What's wrong is consistency between places: the same club is "Finished" on its page and "Not started" in the directory and the rail, and the rail's checkpoint date is a day early (both filed as bugs). On the page, "Finish book" right after "You've finished the book" reads as the same thing.

## Scores

**Nielsen: 25/40 (acceptable).**
- **1 Visibility of status: 2.** Progress and dates disagree between the page, the directory and the rail (finding 1).
- **2 Match with the real world: 2.** "Finish book" means "end this round for the club" (finding 2).
- **4 Consistency: 2.** Same club, three states; "Book Clubs", "My Book Clubs" and "Clubs" for one place (finding 4).
- **10 Help: 2.**
- Scored 3: the rest.

**Cognitive load: low** (1 failed: *one decision at a time*, Edit, Delete, comments and an arrow on one checkpoint row).

**Personas:** Inés (club admin): sees "Finish book" under her own "Finished" bar and isn't sure whether it closes the round for everyone (it does, after a confirm). Theo (member, west of UTC): the rail tells him Nov 14, the club Nov 15. Sam (keyboard): clean order, all controls labelled; Edit and Delete 36px tall.

**Specificity:** passes: the book on a shelf board, named members, cloth-bound covers.

## Findings

### 1. The same club's progress and date disagree between the page, the directory and the rail — P2 · M · Rule
Filed: `bugs/club-progress-differs-between-page-and-rail.md` (Finished vs Not started) and `bugs/rail-club-checkpoint-date-day-early.md` (Nov 14 vs Nov 15).
**Status:** fixed 2026-10-18: see both bug files (a Read log counts as 100%; the rail's dates in UTC).

### 2. "Finish book" reads like "I finished the book" — P2 · S · Judgement
**Where:** `ClubNextUpCard` (the admin's secondary button), "the club at 1280 and 375", right under "You've finished the book" and "1 of 1 member on track".
**What:** the button ends the round for the whole club (with a confirm), but its words are what a reader says about their own reading.
**Fix:** "End this round" (or "Close Jane Eyre for the club"), five languages; keep the confirm.
**Status:** fixed 2026-10-18: "End this round", and its confirm says it ends the round for everyone (five languages).

### 3. Delete on a checkpoint row is plain ink beside Edit — P3 · S · Rule
**Where:** `ClubPage.tsx` checkpoint rows (confirmed by `confirm()` at `:330`); Edit 45×36, Delete 61×36.
**Fix:** Delete in danger ink, both 44px tall on touch screens; the arrow after the comment count can go (the whole row is the link).
**Status:** fixed 2026-10-18: Delete in danger ink, 44px on touch screens; the arrow after the counts is gone.

### 4. "Book Clubs", "My Book Clubs" and "Clubs" — P3 · S · Rule
**Where:** the page title "Book Clubs", the rail's "My Book Clubs" (Title Case), the sidebar's "Clubs", "Your clubs" on the page.
**Why it matters:** PRODUCT.md's terminology: one word per idea, *club*; Title Case isn't used for headings elsewhere and is wrong in four of the five languages.
**Fix:** "Clubs" as the page title, "Your clubs" in the rail; check the other four languages use their one word too.
**Status:** fixed 2026-10-18: "Clubs" as the page title and "Your clubs" in the rail, in every language (French also moved from "tes" to "vos", like the rest of its strings).

### Shared
The rail repeating "Your clubs": `shell-and-shared-pieces.md` #4. The rail shifting the layout: `bugs/rail-clubs-card-shifts-layout.md`.

## Looked fine

One green action on the directory ("Create a club"); club cards with ThumbCover or a cloth-bound initial, goal bar and the next checkpoint in UTC; Discover as one card of rows; the club page's round card, members with role pills and On track in the green wash, Invite readers as a sunken well with a visible label, activity with the time on its own line; destructive actions confirmed; all five themes.
