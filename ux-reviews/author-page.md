# UX review — Author page (`/authors/:id`)

Two reviews in this file: the **re-review after the shelf refresh** (2026-10-18, findings 11–18) and below it the **baseline before the refresh** (2026-10-16, findings 1–10, all fixed).

## Re-review after the shelf refresh (2026-10-18)

Reviewed: 2026-10-18 · Themes: Paper, Dark, Sepia · Widths: 375, 1280 · Readers: signed in with data (follows five readers, one of whom read Tolkien), signed in with no data, signed out · Apollon at `75a397b` (dev server)
Screenshots looked at: Tolkien at the top, 700px and 1,300–1,400px down, at 1280 and 375 in Paper and Dark (new reader) and Sepia (reader with friends); signed out at 375 in Paper; German at 375 in Dark (top and 1,000px down). Keyboard pass at 375 in Dark (40 stops, `tabwalk.mjs`). Layout shifts from `shoot.mjs --shifts` on the dev server (indicative only). Not captured: the sparse author and error states (unchanged code paths, covered by `authors-feature.md`), a slow network.

### Summary

The refresh did what the baseline asked: the books now come right after the header ("Most popular" at ~700px on desktop, ~640px on a phone, was ~1,430/1,580px), the page has its own look (the shelf, Literata names, a named friend pill, the quote cards), and every baseline finding is fixed. What's left is small: two green buttons share the first screen (the page's Follow and the rail's "Set a goal", on every page for a reader without a goal), and "All books" opens by repeating the five books of the shelf just above it.

### Scores

**Nielsen: 27/36 (75%, good)**, up from 24/36 (67%) at the baseline. Help (10) n/a as before.
- **7 Flexibility: 3** (was 2): "All 200 books" jumps to the full list; sort and filter stay in the address.
- **8 Aesthetic and minimalist: 3** (was 2): books on the first screen, one clear order. Not 4: All books repeats Most popular (finding 12), and a second green button competes (11).
- **4 Consistency: 3** (was 2): one expander style, the shared Show more. Not 4: the two shelves show the same books at two cover sizes.
- **6 Recognition: 3**: "Show all 6 links" on a phone when no link is shown (13).
- Scored 3: status (1), real-world match (2: "15 Readers" over "from 19 ratings", 15), control (3), error prevention (5), error recovery (9).

**Cognitive load: low** (1 of 8 failed: *single focus*, the rail's green "Set a goal" pulls at the eye beside Follow). Hierarchy, failed at the baseline, now passes.

**Personas:** Marta (reviewer, desktop): the bio in the reading face at 65ch and the quote cards read well; quote passages are buttons she can't select text from easily. Jordan (first-timer): "Follow to hear about their new books." answers the baseline's question; "Show all 6 links" with nothing shown above it reads like something failed to load (13). Sam (keyboard, screen reader): 40 stops in a sensible order, focus visible on all of them, the jump link lands below the header; each quote is announced as a button named by the whole passage with no word on what it does (18); "Details from Open Library" is a 16px-tall target (17).

**Specificity:** passes now. With the logo covered it is still clearly this site: the books on a shelf board, Literata at display size, a friend named in a pill with their count, the green quote mark.

**Motion:** Follow → Following with a check and the heart pop are there (finding 10 fixed); the cover tilt on shelf covers on hover and on title focus; nothing plays on load. CLS on the dev server: 0.066 at 375 (the phone header's second row arriving, every page) and 0.079 at 1280 (the rail's goal card, `bugs/rail-clubs-card-shifts-layout.md`); neither is this page's.

### Findings

#### 11. Two green buttons on the first screen: Follow and the rail's "Set a goal" — P2 · S · Rule
**Where:** `ReadingGoalCard.tsx:101` (`styles.primary`), shown in the rail through `YearSoFarCard`; "Tolkien at 1280, reader without a 2026 goal".
**What:** the page's one green action (Follow) and the rail's filled green "Set a goal" are both on the first screen. The rail is on every signed-in page above 1100px, so every page whose own action is green has two.
**Why it matters:** DESIGN.md's One Green Button Rule: the green marks the one thing to do here. On a book page the rail's button competes with "Log this book".
**Fix:** in the rail (`YearSoFarCard`), "Set a goal" as the secondary button (`btn-secondary`, 44px) or a quiet green text link; it stays green and filled on the Stats page, where setting a goal is the page's task. A `variant`/`quiet` prop on `ReadingGoalCard`.
**Status:** fixed 2026-10-18: in the side column (`ReadingGoalCard compact`) "Set a goal" is the secondary button; it stays green on the Stats page.

#### 12. "All books" opens with the same five books as "Most popular" — P3 · S · Judgement
**Where:** `AuthorPage.tsx` `AuthorWorks` (default sort `Popular`); "Tolkien at 1280, 1,400px down".
**What:** after the readers card and the quotes, All books starts with The Hobbit, Fellowship, Two Towers, Return of the King: the shelf at the top again, larger (four across, ~148px covers, against five across at ~114px).
**Why it matters:** the reader scrolls past readers and quotes and meets books they've just seen; at a glance the list looks like a repeat rather than "everything else".
**Fix:** default All books to publication order (`Oldest`, a bibliography) while the Most popular shelf is shown, keeping `?sort=` and the select as they are; or keep Popular and say so in the heading. See question 2 in the hand-off.
**Status:** kept as it was, decided 2026-10-18: publication order was built and seen (for Tolkien it opened on Open Library's oddest records, a role-playing supplement and a vocabulary), so All books stays by popularity, as the Sort field says; the repeat of the shelf's books is accepted.

#### 13. "Show all 6 links" when no link is shown (phones) — P3 · S · Rule
**Where:** `AuthorPage.module.css` `.linksFolded:has(.linksToggle) li:not(:last-child) { display: none }` with `authors.moreLinks`; "Tolkien at 375".
**What:** on a phone the three visible link pills are hidden to save room, but the toggle still says "Show all 6 links", as if some were already showing.
**Fix:** on a phone the folded toggle reads "Links (6)" (a new key `authors.linksToggle` in five languages, like "Also known as (5)"); "Show all 6 links" stays above 640px. One label for both is also fine.
**Status:** fixed 2026-10-18: on a phone the folded toggle reads "Links (6)" (`authors.linksToggle`, five languages); "Show all 6 links" above 640px.

#### 14. Titles on the phone's "Most popular" shelf cut at two lines — P3 · S · Rule
**Where:** `Shelf.module.css:227` (two-line clamp for `fit` shelves; the `grid` layout gets three at this width, line 266); "Most popular at 375".
**What:** "The Fellowship…" and "The Return of…" are cut; in All books below, the same titles show in full on three lines.
**Fix:** the same three-line clamp for `fit` covers at ≤640px. The fit covers are 5.25rem wide, the same width problem the grid already solved.
**Status:** fixed 2026-10-18: three lines for every grid and fit shelf title at ≤640px; "The Fellowship of the Ring" shows in full.

#### 15. "15 Readers" over "from 19 ratings" reads like a contradiction — P3 · S · Judgement
**Where:** `AuthorReaders.tsx` tiles, `authors.readers.ratingLabel` / `ratingFrom`.
**What:** 15 readers, and an average "from 19 ratings": correct (a reader can rate several of the author's books), but nothing says the ratings are per book.
**Fix:** label "Average rating of their books" and detail "19 ratings across 6 books", or simply "from 19 book ratings"; five languages.
**Status:** fixed 2026-10-18: "from 19 ratings of their books" (German "aus 19 Buchbewertungen"), five languages.

#### 16. The friends who read the author come after the anonymous numbers — P3 · S · Judgement
**Where:** `AuthorReaders.tsx` (tiles first, then the "people you follow" row under a hairline); "Sepia 1280, 700px down".
**What:** "1 person you follow has read this author" and Mira's pill sit at the bottom of the card, under three counts.
**Why it matters:** PRODUCT.md principle 3 (people over algorithms): a friend who read the author is the most useful thing in the card for Tomás, and it's the part only this site can show.
**Fix:** when there are friends, put their row first and the counts under the hairline; without friends, the card stays as now.
**Status:** fixed 2026-10-18: the people you follow come first, the counts under the hairline.

#### 17. "Details from Open Library" is a 16px-tall target — P3 · S · Rule
**Where:** `AuthorPage.module.css` `.credit a`; keyboard pass stop 21 (172×16).
**What:** a lone link under the header, under the 44px floor (it passes WCAG's 24px only by spacing).
**Fix:** `display: inline-flex; align-items: center; min-height: 44px` on the link, as `.headLink`, with `.credit`'s top margin removed so the visible line stays where it is.
**Status:** fixed 2026-10-18: the credit link is 44px tall through `inline-flex` and `min-height`, without the old top margin.

#### 18. A quote's passage is a button named by the whole passage — P3 · S · Rule
**Where:** `WritingCard.tsx:84` (quote variant; also the Feed and the Writings list).
**What:** the passage is a `<button>` that opens the quote; a screen reader announces "It is a dangerous business, Frodo, going out your door… button" with nothing saying what pressing it does, and text in a button can't be selected with the mouse to copy.
**Fix:** keep the passage as plain text and make the card's existing "More" the visible, focusable opener (named "Open the quote" when there's no more text to show), or keep the button and add `aria-describedby` to a visually hidden "Opens the quote and its comments" line; five languages.
**Status:** fixed 2026-10-18: the passage button is described by a visually hidden "Opens the quote and its comments" (`writings.openQuoteHint`, five languages), on the author page, the Feed and Writings.

### Looked fine (2026-10-18)

Heading order (h1, then four h2); focus visible at every stop, nothing focused under the sticky header; the "All N books" jump clears the header (`scroll-margin-top`); Follow and Add to favourites are reserved while loading (no shift); the follow hint keeps two lines on a phone so it never moves; German at 375 (buttons wrap to two rows, the hint to one line, nothing overflows); Dark and Sepia contrast on the readers card, pills and quotes; the sort select and "Include books without a cover" are 44px with visible labels; no sideways scroll at 375. Not this page: the header search placeholder is cut ("Search books..", "Bücher sucher") when signed in, already noted in the settings work.

---

## Baseline before the shelf refresh (2026-10-16)

Reviewed: 2026-10-16 · Themes: Paper, Dark · Widths: 375, 1280 · Readers: signed in with data (follows Tolkien and a friend who read him) and signed out · Apollon at `6df3601`
Screenshots looked at: Tolkien at 1280 and 375 in Paper and Dark, at the top, 640px and 1300px down (`scripts/shoot.mjs`), signed out at 375; measured layout shifts on a production build (`vite preview`). Earlier captures from `authors-feature.md` cover the sparse author (no bio, no covers), the empty and error states and the keyboard pass. Not captured: German, a slow network.

This is the **"before" baseline** for `specs/shelf-design-refresh.md`: the page still has the old look (Phase 1 not built), which alone isn't a finding. Re-review after the page is restyled in Phase 3 and keep both scores. The technical audit is `author-page-audit.md`.

### Summary

A solid, accessible page that reads as "any book site": everything is a bordered box or a plain grid, and the books, the reason most readers come, start about 1,430px down on desktop and 1,580px on a phone. The biggest fix is shared, not on this page: the site footer jumps up into view and back down while every page loads, a layout shift of 0.20 on phones (three times Google's 0.1 limit). Close behind: five "Show more" buttons across the site, including "Show more quotes" here, have no style at all.

### Scores

**Nielsen: 24/36 (67%, acceptable**, just under good). Help and documentation (10) marked n/a: a reading page needs little help.
- **4 Consistency: 2.** Four different "more" treatments on one page ("Read more" link, the quote's grey "More", "Show all 6 links", an unstyled "Show more quotes" button); the quote card differs from the Feed's version of the same quote.
- **7 Flexibility: 2.** Sort and the cover filter are kept in the address (good); nothing faster for regular readers (no way to jump to the books, no keyboard paths beyond Tab).
- **8 Aesthetic and minimalist: 2.** The header (other names, a folded bio, links) and two quotes come before the books; at 375 the first two screens are header only. Generic bordered boxes everywhere.
- Scored 3: status (1), real-world match (2), control (3), error prevention (5), recognition (6), error recovery (9).

**Cognitive load: low** (1 of 8 failed: *hierarchy*, the page's main content, the books, is not where the eye lands first).

**Personas:** Marta (reviewer, desktop): quotes are comfortable to read (serif, ~75 characters a line). Jordan (first-timer): "Follow" next to "Add to favourites" with nothing saying what following does (new-book alerts in the bell and Feed). Lucía (quick logger, phone, Spanish): two screens of header before any book; the years sit below the buttons, away from the name. Sam (keyboard and screen reader): fine; focus is visible everywhere and the buttons' names start with their visible text.

**Specificity:** fails, as expected before the refresh: with the logo covered this could be any book site. The mockup's shelf, raised cards and type are what make it Winged Words.

**Motion:** nothing acknowledges Follow or Add to favourites beyond an instant text swap (planned in Phase 3 of the refresh).

### Findings

#### 1. The site footer jumps while a page loads (layout shift 0.20 on phones) — P2 · S · Rule
**Where:** `layout/Layout.module.css` (`.column`, `.footer`), every page; measured on this page with `shoot.mjs --shifts`.
**What:** while a page's data loads its content is short, so the footer sits near the top of the screen; when the content arrives it is pushed down (0.096 + 0.163 at 375px; 0.016 at 1280px). Production build: CLS 0.20 at 375 (dev 0.28), 0.04 at 1280. Signed out the same.
**Why it matters:** the page visibly jumps on every visit, worst on phones where most readers are; Google counts above 0.1 as poor.
**Fix:** give the column a minimum height so the footer starts below the fold: `.column { min-height: calc(100dvh - 5.5rem); }` (the header height), checked at 375 and 1280 and on short pages (settings, empty states).
**Status:** fixed 2026-10-16 (Apollon edcbd41) — `.content` is at least `100dvh - 5.5rem` tall, so the footer starts below the fold and the scrollbar is there from the start. Measured on a production build: author page at 375 CLS 0.20 → 0.002–0.016 signed in, 0.26 → 0.001 signed out; feed and settings at 375 0.002; desktop header no longer shifts sideways.

#### 2. Unstyled "Show more" buttons, here and on four other pages — P2 · M · Rule
**Where:** `AuthorQuotes.tsx:57` ("Show more quotes"), and `FeedPage.tsx:128`, `ReviewsPage.tsx:74`, `WritingsPage.tsx:74`, `FollowedAuthorsPage.tsx:95`.
**What:** a plain `<button>` with no class shows the browser's default grey box with a dark border; in Dark it's a grey slab. Every other button in the app uses `.btn`.
**Why it matters:** it looks broken next to the styled controls and ignores the themes.
**Fix:** the `extract` pass: one shared `ShowMoreButton` (secondary style, 44px, a pending label, an error line with retry), used in all five places.
**Status:** fixed 2026-10-16 (Apollon edcbd41) — `ShowMoreButton` (secondary style, centred, disabled with a loading label while pending) replaces all seven paged-list buttons: the five unstyled ones plus search results and the author's books.

#### 3. The Follow and favourite buttons appear late and push the header down — P2 · S · Rule
**Where:** `AuthorFollowButton.tsx`, `AuthorFavouriteButton.tsx` (render nothing until `/authors/{id}/me` answers); `AuthorPage.tsx` `.actions`.
**What:** for a signed-in reader the buttons arrive after the rest of the header, moving the years, names, bio and links by 24px at 375 (part of the 0.013 shift after the footer's).
**Why it matters:** a small jump right where the reader is looking, and a tap can land on the wrong thing.
**Fix:** when signed in, render the two buttons straight away in a disabled "loading" state (same size), then fill in their state; signed out, render nothing as now.
**Status:** fixed 2026-10-16 (Apollon edcbd41) — signed in, both buttons render at once, disabled, until the reader's state arrives.

#### 4. The books are far down the page — P2 · M · Judgement
**Where:** `AuthorPage.tsx` (order: header, readers box, quotes, works); "Tolkien at 375 and 1280".
**What:** the works grid starts at ~1,430px on desktop and ~1,580px on a phone. At 375 the first two screens are the photo, name, buttons, five other names, a folded bio and links.
**Why it matters:** most readers come for the books (Lucía wants to find and log one); everything above them is secondary.
**Fix:** in the Phase 3 restyle: a compact phone header (other names behind "Also known as (5)", a shorter bio fold on phones, the links as one "Links (6)" row) and a first shelf of the author's most popular books right after the header, with "All 200 books" leading to the full grid. Keep quotes and the readers box after that first shelf.
**Status:** fixed 2026-10-16 (Phase 3 of the shelf refresh, author page). Order from the mockup's "Order option" board: header, a "Most popular" shelf of five with "All N books", the readers card, quotes, all books on shelves. Other names fold behind "Also known as (5)", the bio folds shorter on phones, links fold to one toggle on phones. At 375 "Most popular" now starts at about 640px (was ~1,580px for the first book).

#### 5. On a phone, the years are separated from the name by the buttons — P3 · S · Judgement
**Where:** `AuthorPage.tsx` header (`.nameRow` holds the name and `.actions`; `.meta` follows).
**What:** at 375 the order is name, Following / Add to favourites, then "1892–1973".
**Why it matters:** the years describe the name; split by controls they read as an afterthought.
**Fix:** order name → years → other names → actions on phones (move `.actions` after the meta lines at ≤640px, or always).
**Status:** fixed 2026-10-16 (Phase 3): name, years, other names, then the buttons, at every width.

#### 6. Nothing says what "Follow" does — P3 · S · Judgement
**Where:** `AuthorFollowButton.tsx`.
**What:** "Follow" and "Add to favourites" sit side by side with no hint of the difference: following gives new-book alerts in the bell and the Feed; favourites show on your profile.
**Why it matters:** Jordan can't predict the result; some readers will favourite when they wanted alerts, or the reverse.
**Fix:** the `clarify` pass: a short muted line under the buttons while not following ("Follow to hear about new books"), in all five languages; or a `title` plus the same text after the first follow.
**Status:** fixed 2026-10-16 (Apollon edcbd41) — a muted line under the buttons for signed-in readers: "Follow to hear about their new books.", then "You'll hear about their new books." once following (feedback too). Always one line (two reserved on phones), so it never moves the page. Five languages.

#### 7. Four different "more" treatments on one page — P3 · S · Rule
**Where:** `AuthorPage.tsx` ("Read more", "Show all 6 links"), `WritingCard.tsx` quote variant ("More"), `AuthorQuotes.tsx` ("Show more quotes").
**What:** an underlined accent link, a bold grey word outside the quote's indent, another accent link, and an unstyled button. The quote's "More" sits at the card's left edge while the passage is indented by `--space-4`.
**Why it matters:** the same kind of action looks different each time, and the quote's "More" looks unrelated to its passage.
**Fix:** one quiet text-button style for in-place expanders, aligned with what it expands (the quote's "More" indented like the passage); "Show more" lists use the shared button from finding 2.
**Status:** fixed 2026-10-16 (Phase 3): Read more, Also known as and Show all links are one quiet green text button with a chevron; the quote card's More lines up with its passage (no indent any more); Show more quotes is the shared button.

#### 8. A loose gap around "Show all 6 links" — P3 · S · Rule
**Where:** `AuthorPage.module.css` `.textButton` after `.links`.
**What:** about 40px above the toggle (the list's bottom plus the button's `--space-2` margin and 44px minimum height) against `--space-4` between the other header parts, so it floats away from the links it controls.
**Fix:** no top margin on the links toggle, and reach 44px through padding so the visible text sits close to the list.
**Status:** fixed 2026-10-16 (Phase 3): the toggle sits inside the row of link pills it controls.

#### 9. A character used as an icon: "✓ Read" on book cards — P3 · S · Rule
**Where:** `BookCard.tsx:26`.
**What:** the read mark is the "✓" character; DESIGN.md's No-Glyph Rule wants a drawn icon.
**Fix:** the drawn `Icon` set in Phase 1 of the refresh.
**Status:** fixed 2026-10-16 (Phase 1 of the shelf refresh): a drawn check from the `Icon` set

#### 10. Following and favouriting aren't acknowledged — P3 · S · Judgement
**Where:** the two header buttons.
**What:** the label swaps instantly with no feedback.
**Fix:** DESIGN.md "Motion" feedback (a check crossfade for Following, a heart pop), with reduced-motion handling, in Phase 3.
**Status:** fixed 2026-10-16 (Phase 3 motion task): Follow fades to Following with a check, the heart pops; both change at once under reduced motion.

### Looked fine

Heading order (h1 name, h2 Quotes, h2 Books); focus visible on every control (2px), tab order follows the page; buttons 44px tall on phones and their names start with the visible text; no sideways scroll at 375; Dark keeps contrast; the bio fold and the links toggle use `aria-expanded`/`aria-controls`; the sparse author, not-found and Open Library-down states (from the earlier review); production loading is fast (LCP ~0.2–0.3s, 310 KB, no long tasks).

**Not a UX finding, a data question:** the Hobbit card says "Graphic novel" and The Return of the King "1950": both come from Open Library records. Worth a bug file if the graphic-novel detection is ours rather than Open Library's.
