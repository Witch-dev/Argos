# Argos Design Tokens (as of Apollon/web/src/index.css)

Source of truth is always the live file — this is a snapshot to orient quickly. Re-read `index.css` before relying on exact values; if it has drifted from this list, trust the file and update this doc.

## Color

Since Phase 1 of `specs/shelf-design-refresh.md` (2026-10-16). Five themes (Paper, White, Warm Gray, Sepia, Dark), defined as `[data-theme='paper'|'white'|'warm-gray'|'sepia'|'dark']` blocks in `index.css` (any element, so a themed block can nest inside another theme: `/dev/styleguide` uses that), plus a bare `:root` with Paper's values for first paint and an `@media (prefers-color-scheme: dark)` fallback that must equal the Dark block (`styles/designGuards.test.ts` checks it, and that every theme defines every role Paper does). `ThemeMenu` sets `data-theme` on `<html>` and stores it via `useTheme.ts` (`argos_theme`); `public/theme-init.js` applies it before first paint.

Roles (meaning is the same in every theme; DESIGN.md "Colors" says when to use each):

| Token | Paper | Dark | Use |
|---|---|---|---|
| `--bg` | `#f7f3e8` | `#1b1a17` | the page (Paper's never changes) |
| `--frame` | `#efe7d6` | `#22201c` | header and sidebar tint |
| `--raised` | `#fffdf8` | `#2a2823` | raised cards (`Card`), secondary buttons |
| `--sunken` | `#f1eadc` | `#151411` | sunken wells, chips, tracks; `--bg-elevated` is an alias of it for older stylesheets |
| `--text` / `--text-muted` / `--text-subtle` | `#1f1d1a` / `#6b665e` / `#9a9489` | `#e8e3d7` / `#a9a294` / `#7d776b` | ink, labels and metadata, very quiet text |
| `--border` / `--hairline` | `#dcd1bf` / `#e6dccb` | `#47433b` / `#36332c` | control edges / separators inside a card |
| `--accent` / `--accent-deep` / `--accent-wash` | `#2e5e4e` / `#1f4237` / `#e7efe9` | `#86bba3` / `#a3cfba` / `#23352d` | bookbinding green: actions, links, focus / hover / selected states |
| `--accent-contrast` | `#f7f3e8` | `#13201a` | text on a filled green (or danger) button |
| `--gold` | `#a87a22` | `#d6a84e` | stars and the unread dot only, never text |
| `--heart` | `#a15c3e` | `#de9273` | the favourite heart only |
| `--danger` | `#9c3b2e` | `#ec9580` | destructive actions and errors |
| `--shelf-light` / `--shelf-dark` | `#e6d9c2` / `#d8c8ad` | `#5a4e3d` / `#43392c` | the shelf board's gradient |
| `--cloth` / `--cloth-text` | `#3d5c4a` / `#f3ecdc` | `#33493d` / `#e8e3d7` | a coverless book's cloth and title |

White, Warm Gray and Sepia: see `index.css` (all contrast-checked: text and links 4.5:1 on page, raised, sunken and frame; stars and heart 3:1).

Shadows: `--shadow-card` (raised cards, never with a border), `--shadow-elevated` (menus, modals, popovers), `--shadow-cover` (a book's spine shade and drop), `--shadow-shelf`, `--shadow-control` (a selected segment, a pill on a cover), `--scrim` (behind modals). Dark has its own, deeper values.

Rule: never a raw colour in component CSS (`designGuards` fails on hex, rgb, hsl, oklch outside `index.css`). If no token fits, add one to every theme block and to this table.

Fonts load from Google Fonts in `index.html`: Literata with its optical-size axis (`opsz` 7–72, weights 400–700, italic 400–500) and Public Sans (400–700). `--font-display` and `--font-serif` are both Literata (display for headings, names and stat values at weight 600; serif for reading text); `--font-sans` is Public Sans. Each has a metric-matched fallback face (`Literata Fallback` on Georgia, `Public Sans Fallback` on Arial) so text doesn't jump when the fonts arrive.

Browser surfaces: `::selection` in the green wash, `caret-color` green, links underlined at `0.18em` offset, `scrollbar-color` from the palette, the 2px green focus ring.

## Spacing

A single scale, all consumers reference it by name — no ad hoc `margin: 13px`:

```
--space-1: 0.25rem   --space-4: 1rem
--space-2: 0.5rem    --space-6: 1.5rem
--space-3: 0.75rem   --space-8: 2rem
```

Gaps in the sequence (5, 7) are intentional — round up or down to the nearest existing step rather than adding a new one for a single use site.

## Layout

- Corners: `--radius-control` 10px (buttons, inputs, sidebar items), `--radius-card` 14px (cards), `--radius-pill` (chips, pills, segmented controls), `--radius-cover` `2px 5px 5px 2px` (a book, spine on the left); circles at `50%`. `--radius` (the old flat 3px) remains only for stylesheets not yet restyled in Phase 3. `designGuards` fails on any other radius (older exceptions sit in its shrink-only allowlist).
- `--max-width: 72rem` — the content column's max width, used via the shared `.container` utility class in `index.css` (`max-width: var(--max-width); margin-inline: auto; padding-inline: var(--space-4)`).
- Site-wide 3-column layout, Bluesky-style: `Sidebar`, `.content`, and `RightPanel` are one flex row (`.shell` in `Layout.module.css`) centered as a unit via `justify-content: center` — empty space goes to the outer edges of the window, not into gaps between the columns. `Sidebar`/`.rightRail` are `position: sticky; top: 5.5rem` (not fixed to the viewport edge) so they act as columns inside that centered group while still tracking scroll; each is `flex: 0 0 15rem`. `.content` is `flex: 0 1 38rem` (see below). Divider lines live on `.content > *` itself (`border-inline`), hugging the narrow content column rather than sitting out at the rail edges with a lot of empty rail background between. Mobile (≤640px) switches `Sidebar` to `position: fixed` (a genuine off-canvas drawer, out of flow) — `position: sticky` only applies above that breakpoint. Follow this sticky-columns-in-a-centered-flex-row pattern for any new persistent side content rather than switching to CSS grid or viewport-edge-fixed rails.
- `RightPanel` (`layout/RightPanel.tsx`) is global — rendered once by `Layout`, not per-page — and shows `AccountSummary`, `MyClubsCard`, a `Lists` browse prompt, and `SuggestedAccounts`. It gates on `useAuth().isAuthenticated` and shows a sign-in prompt instead of the data cards when logged out, since those queries need auth and the rail now appears on public pages too (login, book detail, etc.), not just the old feed-only local `.side` column it replaced.
- A full-width fixed `Header` (`5.5rem` tall) sits above everything — logo at the left, book search at the right, plus the mobile hamburger. `Sidebar` and `RightPanel` both start below it (`top: 5.5rem`, not `inset-block: 0`), and `.content` clears it with `margin-top: 5.5rem`. These three `5.5rem` values (plus `Header.module.css`'s own `.header { height }`) are coupled — change them together.

## Motion

`--duration-feedback` 120ms (a press), `--duration-state` 200ms (a change of state), `--duration-panel` 320ms (menus, panels), `--duration-focal` 560ms (only the book settling onto the shelf); `--ease-out` for arrivals, `--ease-in` for exits. Reduced motion shortens them to fades. No `transition: all`, no bounce (`designGuards`).

## Shared pieces (Phase 1)

`Icon` (one drawn set, `components/iconPaths.ts`), `Card` (raised / sunken), `Pill` and `PillLink`, `Shelf` (covers on a shelf; every cover row from Phase 3), `StatTiles` (row / lead), `.btn` with `-primary`, `-secondary`, `-soft`, `-quiet`, `-danger`, `-danger-outline`, `-small` (44px, 10px corners; `aria-busy` keeps a saving button at full colour). All of them in all five themes: `/dev/styleguide` (development only).

## Breakpoint

**640px**, always as `@media (max-width: 640px)`, is still the one in use for nav/page-internal collapse: below it, nav collapses to a hamburger, sidebar layouts drop the `margin-left` offset, multi-column pages go single-column.

A second breakpoint, **1100px**, exists only in `Layout.module.css` for the 3-column shell itself: below it `RightPanel`/`.rightRail` hides (`display: none`) and `.content` drops `margin-right`, since the center content plus two `15rem` rails needs real width to avoid feeling cramped — a genuine break the 640px step doesn't cover. Don't add further breakpoints for individual pages' own internal layouts; this one is specifically for the global rail.

A third, **480px**, exists only in `LandingPage.module.css` to hide the top bar's join button on small phones (the hero's big join button is right below). It's local to that page, not a global step.

## Typography

- Three font tokens: `--font-display` (Literata 600: headings, names, stat values), `--font-serif` (Literata: book titles, reviews, bios, reading text) and `--font-sans` (Public Sans: interface). `h1`–`h4` get the display face, weight 600, slight negative tracking and `text-wrap: balance` from a base rule. Body is 16px, line height 1.5.
- Six size tokens in the bare `:root` of `index.css` (not theme-dependent, so not repeated per theme), named by size: `--font-size-xs` 0.75rem (badges, chips, counters), `-sm` 0.875rem (labels, metadata, captions), `-base` 1rem (body, secondary body text, form hints, card titles), `-lg` 1.15rem (section headings, nav links), `-xl` 1.5rem (page and big-number text), `-2xl` 2rem (big numbers), plus `--font-size-display` 2.5rem (only a page's name and a lead stat). Component text uses these, never a raw `rem`; `h1`–`h4` keep their own rules in `index.css`. There is no step between `sm` and `base` on purpose: a 0.95rem step sat 0.8px under body text and read as the same size (`ux-reviews/font-size-scale.md` #5). Spec: `specs/font-size-scale.md`.
- Migration finished 2026-10-12: `web/src/styles/fontSizeScale.test.ts` fails on any raw `font-size: <n>rem` (also `px`, `em`; fluid `clamp()` is the only exception, on two landing-page headings). `fontSizeAllowlist.ts` lists the one deliberate exception (a 0.65rem nowrap badge on list covers) and a file in it may not gain a raw size.

## Grids

Card grids (search results, shelves) use `repeat(auto-fill, minmax(9rem, 1fr))` with `gap: var(--space-4))` — reflows automatically without a breakpoint. Reuse this pattern for any new card grid instead of hand-rolling column counts per breakpoint.

## Component styling mechanism

CSS Modules, one `ComponentName.module.css` next to each `ComponentName.tsx`, imported as `import styles from './ComponentName.module.css'`. Class names are short and unprefixed (`.card`, `.title`, `.grid`) since the module system already scopes them — no BEM-style prefixing needed.

## Shared state UI

`src/components/StateMessage.tsx` provides `LoadingMessage` / `ErrorMessage` / `EmptyMessage` — every page's loading/error/empty rendering goes through these, not a one-off `<p>Loading…</p>`. If a page needs a loading/error/empty state, check this file before writing new markup for it.

## Accessibility baseline already established

- Every image (`BookCover`, `Avatar`) has real alt text with fallback semantics, not an empty/missing `alt`.
- Every form field has a real `<label htmlFor>`, not a placeholder standing in for a label.
- Interactive elements are real `<button>`/`<a>`, never a `<div onClick>`.
- Nav toggles use `aria-expanded`/`aria-controls`.

Match this baseline in new work; it's already the bar, not an aspiration.

Beyond this baseline (keyboard, focus, form errors, live regions, touch targets, reduced motion, `Intl`), the checklist is `.claude/skills/ux-review/references/code-checklist.md`. Not every existing screen has been audited against it yet; `ux-review` is how that audit happens.
