# UX review — Author page (`/authors/:id`), baseline before the shelf refresh

Reviewed: 2026-10-16 · Themes: Paper, Dark · Widths: 375, 1280 · Readers: signed in with data (follows Tolkien and a friend who read him) and signed out · Apollon at `6df3601`
Screenshots looked at: Tolkien at 1280 and 375 in Paper and Dark, at the top, 640px and 1300px down (`scripts/shoot.mjs`), signed out at 375; measured layout shifts on a production build (`vite preview`). Earlier captures from `authors-feature.md` cover the sparse author (no bio, no covers), the empty and error states and the keyboard pass. Not captured: German, a slow network.

This is the **"before" baseline** for `specs/shelf-design-refresh.md`: the page still has the old look (Phase 1 not built), which alone isn't a finding. Re-review after the page is restyled in Phase 3 and keep both scores. The technical audit is `author-page-audit.md`.

## Summary

A solid, accessible page that reads as "any book site": everything is a bordered box or a plain grid, and the books, the reason most readers come, start about 1,430px down on desktop and 1,580px on a phone. The biggest fix is shared, not on this page: the site footer jumps up into view and back down while every page loads, a layout shift of 0.20 on phones (three times Google's 0.1 limit). Close behind: five "Show more" buttons across the site, including "Show more quotes" here, have no style at all.

## Scores

**Nielsen: 24/36 (67%, acceptable**, just under good). Help and documentation (10) marked n/a: a reading page needs little help.
- **4 Consistency: 2.** Four different "more" treatments on one page ("Read more" link, the quote's grey "More", "Show all 6 links", an unstyled "Show more quotes" button); the quote card differs from the Feed's version of the same quote.
- **7 Flexibility: 2.** Sort and the cover filter are kept in the address (good); nothing faster for regular readers (no way to jump to the books, no keyboard paths beyond Tab).
- **8 Aesthetic and minimalist: 2.** The header (other names, a folded bio, links) and two quotes come before the books; at 375 the first two screens are header only. Generic bordered boxes everywhere.
- Scored 3: status (1), real-world match (2), control (3), error prevention (5), recognition (6), error recovery (9).

**Cognitive load: low** (1 of 8 failed: *hierarchy*, the page's main content, the books, is not where the eye lands first).

**Personas:** Marta (reviewer, desktop): quotes are comfortable to read (serif, ~75 characters a line). Jordan (first-timer): "Follow" next to "Add to favourites" with nothing saying what following does (new-book alerts in the bell and Feed). Lucía (quick logger, phone, Spanish): two screens of header before any book; the years sit below the buttons, away from the name. Sam (keyboard and screen reader): fine; focus is visible everywhere and the buttons' names start with their visible text.

**Specificity:** fails, as expected before the refresh: with the logo covered this could be any book site. The mockup's shelf, raised cards and type are what make it Winged Words.

**Motion:** nothing acknowledges Follow or Add to favourites beyond an instant text swap (planned in Phase 3 of the refresh).

## Findings

### 1. The site footer jumps while a page loads (layout shift 0.20 on phones) — P2 · S · Rule
**Where:** `layout/Layout.module.css` (`.column`, `.footer`), every page; measured on this page with `shoot.mjs --shifts`.
**What:** while a page's data loads its content is short, so the footer sits near the top of the screen; when the content arrives it is pushed down (0.096 + 0.163 at 375px; 0.016 at 1280px). Production build: CLS 0.20 at 375 (dev 0.28), 0.04 at 1280. Signed out the same.
**Why it matters:** the page visibly jumps on every visit, worst on phones where most readers are; Google counts above 0.1 as poor.
**Fix:** give the column a minimum height so the footer starts below the fold: `.column { min-height: calc(100dvh - 5.5rem); }` (the header height), checked at 375 and 1280 and on short pages (settings, empty states).
**Status:** fixed 2026-10-16 (Apollon edcbd41) — `.content` is at least `100dvh - 5.5rem` tall, so the footer starts below the fold and the scrollbar is there from the start. Measured on a production build: author page at 375 CLS 0.20 → 0.002–0.016 signed in, 0.26 → 0.001 signed out; feed and settings at 375 0.002; desktop header no longer shifts sideways.

### 2. Unstyled "Show more" buttons, here and on four other pages — P2 · M · Rule
**Where:** `AuthorQuotes.tsx:57` ("Show more quotes"), and `FeedPage.tsx:128`, `ReviewsPage.tsx:74`, `WritingsPage.tsx:74`, `FollowedAuthorsPage.tsx:95`.
**What:** a plain `<button>` with no class shows the browser's default grey box with a dark border; in Dark it's a grey slab. Every other button in the app uses `.btn`.
**Why it matters:** it looks broken next to the styled controls and ignores the themes.
**Fix:** the `extract` pass: one shared `ShowMoreButton` (secondary style, 44px, a pending label, an error line with retry), used in all five places.
**Status:** fixed 2026-10-16 (Apollon edcbd41) — `ShowMoreButton` (secondary style, centred, disabled with a loading label while pending) replaces all seven paged-list buttons: the five unstyled ones plus search results and the author's books.

### 3. The Follow and favourite buttons appear late and push the header down — P2 · S · Rule
**Where:** `AuthorFollowButton.tsx`, `AuthorFavouriteButton.tsx` (render nothing until `/authors/{id}/me` answers); `AuthorPage.tsx` `.actions`.
**What:** for a signed-in reader the buttons arrive after the rest of the header, moving the years, names, bio and links by 24px at 375 (part of the 0.013 shift after the footer's).
**Why it matters:** a small jump right where the reader is looking, and a tap can land on the wrong thing.
**Fix:** when signed in, render the two buttons straight away in a disabled "loading" state (same size), then fill in their state; signed out, render nothing as now.
**Status:** fixed 2026-10-16 (Apollon edcbd41) — signed in, both buttons render at once, disabled, until the reader's state arrives.

### 4. The books are far down the page — P2 · M · Judgement
**Where:** `AuthorPage.tsx` (order: header, readers box, quotes, works); "Tolkien at 375 and 1280".
**What:** the works grid starts at ~1,430px on desktop and ~1,580px on a phone. At 375 the first two screens are the photo, name, buttons, five other names, a folded bio and links.
**Why it matters:** most readers come for the books (Lucía wants to find and log one); everything above them is secondary.
**Fix:** in the Phase 3 restyle: a compact phone header (other names behind "Also known as (5)", a shorter bio fold on phones, the links as one "Links (6)" row) and a first shelf of the author's most popular books right after the header, with "All 200 books" leading to the full grid. Keep quotes and the readers box after that first shelf.
**Status:** fixed 2026-10-16 (Phase 3 of the shelf refresh, author page). Order from the mockup's "Order option" board: header, a "Most popular" shelf of five with "All N books", the readers card, quotes, all books on shelves. Other names fold behind "Also known as (5)", the bio folds shorter on phones, links fold to one toggle on phones. At 375 "Most popular" now starts at about 640px (was ~1,580px for the first book).

### 5. On a phone, the years are separated from the name by the buttons — P3 · S · Judgement
**Where:** `AuthorPage.tsx` header (`.nameRow` holds the name and `.actions`; `.meta` follows).
**What:** at 375 the order is name, Following / Add to favourites, then "1892–1973".
**Why it matters:** the years describe the name; split by controls they read as an afterthought.
**Fix:** order name → years → other names → actions on phones (move `.actions` after the meta lines at ≤640px, or always).
**Status:** fixed 2026-10-16 (Phase 3): name, years, other names, then the buttons, at every width.

### 6. Nothing says what "Follow" does — P3 · S · Judgement
**Where:** `AuthorFollowButton.tsx`.
**What:** "Follow" and "Add to favourites" sit side by side with no hint of the difference: following gives new-book alerts in the bell and the Feed; favourites show on your profile.
**Why it matters:** Jordan can't predict the result; some readers will favourite when they wanted alerts, or the reverse.
**Fix:** the `clarify` pass: a short muted line under the buttons while not following ("Follow to hear about new books"), in all five languages; or a `title` plus the same text after the first follow.
**Status:** fixed 2026-10-16 (Apollon edcbd41) — a muted line under the buttons for signed-in readers: "Follow to hear about their new books.", then "You'll hear about their new books." once following (feedback too). Always one line (two reserved on phones), so it never moves the page. Five languages.

### 7. Four different "more" treatments on one page — P3 · S · Rule
**Where:** `AuthorPage.tsx` ("Read more", "Show all 6 links"), `WritingCard.tsx` quote variant ("More"), `AuthorQuotes.tsx` ("Show more quotes").
**What:** an underlined accent link, a bold grey word outside the quote's indent, another accent link, and an unstyled button. The quote's "More" sits at the card's left edge while the passage is indented by `--space-4`.
**Why it matters:** the same kind of action looks different each time, and the quote's "More" looks unrelated to its passage.
**Fix:** one quiet text-button style for in-place expanders, aligned with what it expands (the quote's "More" indented like the passage); "Show more" lists use the shared button from finding 2.
**Status:** fixed 2026-10-16 (Phase 3): Read more, Also known as and Show all links are one quiet green text button with a chevron; the quote card's More lines up with its passage (no indent any more); Show more quotes is the shared button.

### 8. A loose gap around "Show all 6 links" — P3 · S · Rule
**Where:** `AuthorPage.module.css` `.textButton` after `.links`.
**What:** about 40px above the toggle (the list's bottom plus the button's `--space-2` margin and 44px minimum height) against `--space-4` between the other header parts, so it floats away from the links it controls.
**Fix:** no top margin on the links toggle, and reach 44px through padding so the visible text sits close to the list.
**Status:** fixed 2026-10-16 (Phase 3): the toggle sits inside the row of link pills it controls.

### 9. A character used as an icon: "✓ Read" on book cards — P3 · S · Rule
**Where:** `BookCard.tsx:26`.
**What:** the read mark is the "✓" character; DESIGN.md's No-Glyph Rule wants a drawn icon.
**Fix:** the drawn `Icon` set in Phase 1 of the refresh.
**Status:** fixed 2026-10-16 (Phase 1 of the shelf refresh): a drawn check from the `Icon` set

### 10. Following and favouriting aren't acknowledged — P3 · S · Judgement
**Where:** the two header buttons.
**What:** the label swaps instantly with no feedback.
**Fix:** DESIGN.md "Motion" feedback (a check crossfade for Following, a heart pop), with reduced-motion handling, in Phase 3.
**Status:** open (Phase 3)

## Looked fine

Heading order (h1 name, h2 Quotes, h2 Books); focus visible on every control (2px), tab order follows the page; buttons 44px tall on phones and their names start with the visible text; no sideways scroll at 375; Dark keeps contrast; the bio fold and the links toggle use `aria-expanded`/`aria-controls`; the sparse author, not-found and Open Library-down states (from the earlier review); production loading is fast (LCP ~0.2–0.3s, 310 KB, no long tasks).

**Not a UX finding, a data question:** the Hobbit card says "Graphic novel" and The Return of the King "1950": both come from Open Library records. Worth a bug file if the graphic-novel detection is ours rather than Open Library's.
