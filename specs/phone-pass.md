# Feature Spec — Works well on a phone (Stage 3)

**Status:** ✅ Built 2026-10-11. Waiting on the real-phone check (`testing/phone.md`) and on the user confirming §2.1. Roadmap: `ROADMAP.md` Stage 3. Idea source: `FUTURE-IDEAS.md` "Mobile-first pass" and "Quick-log actions". Manual test plan: `testing/phone.md`.

## 1. Problem

Most readers log a book on the couch, on a phone, in the middle of reading. Winged Words already collapses to one column at 640 px, but nobody has checked that the everyday actions are *comfortable* there. The top complaint about StoryGraph and Hardcover is that their phone experience lags the website.

Goal: **a reader can log a book, update progress and finish a book on a real phone in a few taps**, and can put the site on their home screen like an app.

## 2. Decisions

Made with the user on 2026-10-11.

- **Five screens get the phone pass:** log a book, update a page, write a review, the Feed, a club checkpoint. No other page is reworked in this stage; a page that merely stays usable is fine.
- **Navigation stays as it is:** the hamburger drawer and the Books / Community tabs, with no new navigation pattern (no bottom bar). **The header is not slimmer:** two rows of 44 px controls need the same 5.5 rem, so tap targets won out. Vertical space was won back in the content column instead.
- **Quick-log lives in two places:** the "+" tile's "update a book I'm reading" list, and the book page. One shared component (`QuickLog`), so the two behave the same. *(Changed while building: the Readings strip shows people's stories and opens a story viewer, so it has no "currently reading" tile to put the buttons on.)*
- **"Finished!" asks for stars, and a review is optional.** It marks the book Read, then shows the half-star picker with "Skip" and an "Add a review" link into the full form.
- **No native app.** Everything stays the one website (`ROADMAP.md` "not doing": a native mobile app).

### 2.1 To confirm

- **"Installable" means the website can be added to the phone's home screen** from the browser menu ("Add to Home Screen"). It then has its own icon and opens full screen, without the browser's address bar, like an app. It is still the same website: nothing is downloaded from an app store, and updates arrive the moment the site is deployed. It is *not* a separate app to build or maintain.
- **Proposed scope: installable only.** A small file that describes the app (`manifest.webmanifest`: name, icons, colours, "open full screen"), the icons, and the theme colour. **No service worker and no offline mode.** The reason: an offline cache would keep copies of pages on the phone, including private books, and would need care at every deploy. Say if you want offline later; it is a separate change.
- **iPhone caveat.** Safari has no install prompt; a reader must use Share → Add to Home Screen. Android Chrome can show its own install button. We do not build an in-app prompt in this stage.

## 3. Design

Use only the tokens in `web/src/index.css`, the 640 px breakpoint, CSS Modules and the shared state components (`web-design` skill). No new breakpoint and no new token unless §3.1 shows a real gap.

### 3.1 Phone audit first

At 360 px and 390 px wide (the two common phone widths), walk each of the five screens and write down what breaks into this spec (a table below §6, "Audit findings"). Known suspects from reading the code:

- **Header height.** `5.5rem` (88 px) is fixed and used by Header, Sidebar and `.content`. On a phone that is a large share of the screen. Slim it at ≤ 640 px; the three coupled `5.5rem` values change together (design-tokens note).
- **Tap targets.** Many controls are about 2.25 rem or less (the menu toggle, the strip arrows, `.cancel` text buttons). Aim for at least 44 px (2.75 rem) tall hit areas on phones; padding can grow the hit area without growing the visuals.
- **Half-star picker.** Stars are 1.25 rem each. Half stars are very hard to hit at that size, so on phones the picker needs bigger stars or a slide gesture. Check `StarRating` first.
- **Modals.** `ProgressUpdateModal`, the composer modals and `ConfirmBookModal` start at the top with `--space-6` padding and scroll the backdrop. On a phone they should fill the width, keep the primary button reachable, and not be hidden by the on-screen keyboard.
- **Forms.** The log form is one long column with status, visibility, dates, pages, notes. On a phone the fields a reader needs for a quick update (status, current page) come first; the rest sits below. Inputs already inherit the body font size, so the iOS "zoom on focus" problem should not occur, but verify on a real device.
- **Feed cards and the club checkpoint page.** Check long titles, action rows (like / comment / share) wrapping, spoiler gates, and the discussion thread indentation, which can eat the width at depth 3+.
- **Horizontal scroll.** No page may scroll sideways at 360 px. The strip arrows (`left: -0.75rem`) are the one known place that pokes out of its column.

### 3.2 Quick-log

A small shared component, `QuickLog`, working on one `LogDto` for a book being read:

- **+10 pages**: sets `currentPage` to `min(currentPage + 10, totalPages)`. With no `totalPages` it has no cap. It is disabled on the last page. The sheet stays open so the reader can tap again.
- **Finished!**: sets status Read, `finishedAt` = today, `currentPage` = `totalPages` when known; then the stars step from §2.
- **Where:** in the "+" tile's sheet, picking a book being read shows the book, a progress bar, the two buttons and an "Edit details" link to the full form. On the book page, the same box sits under the title for a book being read.
- **Bottom sheet**: slides up from the bottom edge on phones, a centred dialog above 640 px. It reuses the modal's Escape, backdrop and focus behaviour.
- Rating from the sheet goes through the same log update, so the feed, journal and stats refresh through the existing query invalidations in `LogForm`.

Decided at build time: no backend change. `updateLog` replaces progress, dates and review fields, and keeps visibility, moods, content warnings and notes when they are left out. Quick-log builds the payload from the current log (`lib/quickLog.ts`) and sends only what is replaced. The reviewer checked `LogService.UpdateAsync`: nothing a quick-log sends can wipe a review, warnings, a private note or visibility. A stale copy overwriting a newer edit from another device is possible in theory and was accepted.

### 3.4 Look-and-feel polish

From a review of the `taste-skill` redesign skill, keeping only what fits the existing tokens (its font swaps, grain, tinted shadows, hover scaling, borderless cards and icon-set changes were rejected on purpose):

- One global `:focus-visible` ring using `--accent`; components with their own ring keep it.
- Press feedback on buttons: a slight fade (`opacity`), not a transform, so it can't fight buttons that position themselves with one.
- `100dvh` instead of `100vh` in six places, so phone browser bars don't clip the rail, drawer and dialogs.
- A "Skip to content" link, first in the tab order.
- `prefers-reduced-motion` turns transitions off.
- A friendlier 404 page with links home and to search.
- Tabular numerals on percentages and progress numbers.
- Review and annotatable text capped at about 65 characters a line.
- The unrated stars in the interactive picker use `--text-subtle`, not `--border`, so they can be found.

### 3.3 Installable web app

- `web/public/manifest.webmanifest`: `name` "Winged Words", `short_name` "Winged Words", `start_url` `/`, `display` `standalone`, `theme_color` and `background_color` from Paper's `--bg`, icons 192 and 512 px plus a maskable 512 px.
- Icons made from the existing `logo-mark.png`.
- `index.html`: `<link rel="manifest">`, `<meta name="theme-color">`, and `apple-touch-icon` for iPhone.
- `theme-init.js` already sets the theme before first paint. The theme colour is a fixed Paper value; matching it to the chosen theme is optional polish and not part of this stage.
- The Content Security Policy (`specs/app-hardening.md` §3.11) and `nginx.conf` must serve the manifest with the right type and allow it.

## 4. Backend

- [x] None needed (§3.2).

## 5. Frontend

- [x] **Audit** the five screens at 360 and 390 px; list findings under "Audit findings" below. (§3.1)
- [x] **Header and layout** at ≤ 640 px: 44 px menu button and search, no side dividers, tighter content padding, no sideways scroll. The header stays 5.5 rem (§2).
- [x] **Tap targets** of at least 44 px on phones for the controls found in the audit.
- [x] **Half-star picker** usable by thumb (`StarRating`).
- [x] **Modals as phone sheets**: `ProgressUpdateModal` and the review/composer modals fill the width, primary button reachable, keyboard-safe.
- [x] **Log form order** on phones: status and current page first.
- [x] **Feed card and club checkpoint** fixes from the audit.
- [x] **`QuickLog` component** with +10 pages and Finished! → stars → optional review link (§3.2).
- [x] **Wire QuickLog** into the Readings strip (own tiles) and the book page.
- [x] **Installable**: manifest, icons, `index.html` links, nginx/CSP check (§3.3).
- [x] **Translations**: every new string in all five locale files (en, es, pt-BR, de, fr).
- [x] **Vitest** for QuickLog: page cap at total, no total disables +10, Finished sets Read and today.
- [x] **Polish** (§3.4): focus ring, press feedback, `100dvh`, skip link, reduced motion, 404 page, tabular numerals, reading width.

## 6. Verification

- [x] `npm test` (96 files, 613 tests), `npm run build`, `npm run lint` clean.
- [x] Browser pass (`browser-check`) at 390 px in Paper and Dark on Books home, the quick-log sheet, a book page, the Feed, Clubs, a club, a round and a checkpoint: no sideways scroll anywhere. Quick-log tried end to end (+10 pages, Finished!, 4 stars). Sepia and a width above 640 px were not re-checked; the new rules are inside `max-width: 640px` blocks, apart from the global ring, the press fade and the reading width.
- [ ] On a **real phone** (the "done when" of the roadmap): `testing/phone.md`.
- [x] Reviewer: no blocking findings. Two fixed (press feedback used a transform; the rating prompt could be unmounted by a refetch). "+10 pages leaves the sheet open" is intended.
- [x] argos-security not needed: no endpoint, auth or input rules changed.

### Audit findings

Found by walking the screens at 390 px (2026-10-11).

| Screen | What broke | Fix |
|---|---|---|
| Every page | Menu button 36 px, drawer links and the theme and language controls under 44 px | 44 px controls at ≤ 640 px |
| Book page | The large cover filled the whole screen before any action | Cover 9 rem wide on phones; quick-log moved above the description |
| Book page | "Log this book", Favourite and "Show all" under 44 px | 44 px minimum |
| Book page, Feed | The like buttons were about 18 px tall | Invisible larger hit area, same look |
| Rating picker | Stars 20 px, unrated stars almost invisible | 36 px stars on phones, visible outline |
| Feed | Filter chips 26 px, Follow 37 px, "Show all" 15 px | 44 px minimum |
| Clubs | "Create a club" and the search box 35 to 37 px | 44 px minimum |
| Dialogs | Opened at the top with margins, scrolled the page behind | Bottom sheets that scroll inside themselves |
| Readings strip | Arrow buttons poked out of the column | Hidden on phones; swipe instead |
| Left as is | Inline text links (usernames, dates) and the 10 narrow bars of the rating chart | Allowed by WCAG 2.2 for inline links; a chart. Revisit if testers struggle |
| Left as is | Club "Finish book" button about 34 px | Minor; admin only |
