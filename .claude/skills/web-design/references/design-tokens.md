# Argos Design Tokens (as of Apollon/web/src/index.css)

Source of truth is always the live file — this is a snapshot to orient quickly. Re-read `index.css` before relying on exact values; if it has drifted from this list, trust the file and update this doc.

## Color

Five explicit themes now (Paper, White, Warm Gray, Sepia, Dark), defined as `:root[data-theme='paper'|'white'|'warm-gray'|'sepia'|'dark']` blocks in `index.css`, plus a bare `:root` (defaults to Paper's values, for first paint before JS runs) and an `@media (prefers-color-scheme: dark)` fallback (mirrors the Dark block) for a visitor with no stored choice yet. The `ThemeMenu` component (`layout/ThemeMenu.tsx`, opened from a swatch button in `Sidebar`) sets `data-theme` and persists it via `useTheme.ts` to `localStorage` (`argos_theme`); a blocking inline script in `index.html` applies the stored value before first paint. Keep the `@media` block's values in sync with `[data-theme='dark']` whenever Dark changes — plain CSS can't share one block across two selectors.

`--accent`/`--accent-contrast`/`--danger` are derived per theme rather than hand-picked per background: all four light themes share one accent/danger pair (the terracotta already proven to contrast against a light bg), Dark uses the lighter pair proven against a dark bg, and `--accent-contrast` is always just that theme's own `--bg`. `--bg-elevated`/`--border` are each theme's `--bg` nudged toward its own `--text` (a few percent for elevation, more for a border) so every theme's card/divider contrast is self-consistent without a bespoke formula per theme.

| Token | Paper | White | Warm Gray | Sepia | Dark | Use |
|---|---|---|---|---|---|---|
| `--bg` | `#f7f3e8` | `#ffffff` | `#f2f1ed` | `#f1e4c8` | `#202020` | page background |
| `--bg-elevated` | `#ede9de` | `#f4f4f4` | `#e8e7e3` | `#e8dbc0` | `#303030` | cards, panels, sidebar/right-rail background |
| `--text` | `#26231f` | `#222222` | `#252525` | `#3b3328` | `#e8e4dc` | primary text |
| `--text-muted` | `#6b665e` | `#666666` | `#686762` | `#756a59` | `#aaa69e` | secondary text (authors, years, timestamps) |
| `--text-subtle` | `#9a9489` | `#999999` | `#96948e` | `#9e927d` | `#77736c` | tertiary/lowest-emphasis text (very quiet metadata) |
| `--border` | `#e2dad0` | `#e4e4e4` | `#d9d9d5` | `#dbcfb5` | `#3e3d3c` | dividers, card borders, input borders |
| `--accent` | `#a15c3e` | `#a15c3e` | `#a15c3e` | `#a15c3e` | `#d98a5c` | terracotta/rust — links, primary buttons, active states |
| `--accent-contrast` | `#f7f3e8` | `#ffffff` | `#f2f1ed` | `#f1e4c8` | `#202020` | text/icon color placed on top of `--accent` (= that theme's own `--bg`) |
| `--danger` | `#9c3b2e` | `#9c3b2e` | `#9c3b2e` | `#9c3b2e` | `#e08a72` | destructive actions, error text |
| `--font-serif` | `'Literata', Georgia, serif` | same across all 5 | | | | headings, book titles, review/post body text |
| `--font-sans` | `'Public Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | same across all 5 | | | | UI chrome — nav, buttons, labels, metadata, form fields |
| `--shadow-elevated` | `0 8px 24px rgba(0,0,0,0.12)` | `…,0.10)` | `…,0.12)` | `…,0.14)` | `…,0.5)` | the *only* permitted shadow — floating overlays only (modals, popovers, suggestion dropdowns), never a resting card |

Rule: never hardcode a hex value in component CSS. If an existing token fits, use it. If none fits, that's a signal to add a new token to `index.css` (with both light and dark values) rather than a one-off literal buried in a component file.

Fonts load via a Google Fonts `<link>` (+ `preconnect` to `fonts.gstatic.com`) in `index.html`: Literata (weights 400/500/600 + italic 400/500) and Public Sans (weights 400/500/600/700). `body` uses `var(--font-sans)`; `h1`–`h4` use `var(--font-serif)` by base rule. Component-level book/review titles that aren't heading tags set `font-family: var(--font-serif)` explicitly in their own `.module.css`.

Shadows: `box-shadow` is otherwise unused across the app — resting cards rely on `var(--border)` for definition, not elevation. `var(--shadow-elevated)` is reserved for true floating overlays: modals (`ProgressUpdateModal`, `PostComposerModal`), popovers (`ActivityItemPopover`), and suggestion dropdowns (`BookPicker`, `AddBookSearch`).

## Spacing

A single scale, all consumers reference it by name — no ad hoc `margin: 13px`:

```
--space-1: 0.25rem   --space-4: 1rem
--space-2: 0.5rem    --space-6: 1.5rem
--space-3: 0.75rem   --space-8: 2rem
```

Gaps in the sequence (5, 7) are intentional — round up or down to the nearest existing step rather than adding a new one for a single use site.

## Layout

- `--radius: 3px` — corner radius for cards, buttons, inputs (flat, paper-like). Applied consistently via `var(--radius)`, never a per-component literal; `calc(var(--radius) / 2)` is the one established exception (`BookCover`). Fully round shapes (avatar circles at `50%`, pill badges at `999px`) are a separate, intentional motif — not part of this token's cascade.
- `--max-width: 72rem` — the content column's max width, used via the shared `.container` utility class in `index.css` (`max-width: var(--max-width); margin-inline: auto; padding-inline: var(--space-4)`).
- Site-wide 3-column layout, Bluesky-style: `Sidebar`, `.content`, and `RightPanel` are one flex row (`.shell` in `Layout.module.css`) centered as a unit via `justify-content: center` — empty space goes to the outer edges of the window, not into gaps between the columns. `Sidebar`/`.rightRail` are `position: sticky; top: 5.5rem` (not fixed to the viewport edge) so they act as columns inside that centered group while still tracking scroll; each is `flex: 0 0 15rem`. `.content` is `flex: 0 1 38rem` (see below). Divider lines live on `.content > *` itself (`border-inline`), hugging the narrow content column rather than sitting out at the rail edges with a lot of empty rail background between. Mobile (≤640px) switches `Sidebar` to `position: fixed` (a genuine off-canvas drawer, out of flow) — `position: sticky` only applies above that breakpoint. Follow this sticky-columns-in-a-centered-flex-row pattern for any new persistent side content rather than switching to CSS grid or viewport-edge-fixed rails.
- `RightPanel` (`layout/RightPanel.tsx`) is global — rendered once by `Layout`, not per-page — and shows `AccountSummary`, `MyClubsCard`, a `Lists` browse prompt, and `SuggestedAccounts`. It gates on `useAuth().isAuthenticated` and shows a sign-in prompt instead of the data cards when logged out, since those queries need auth and the rail now appears on public pages too (login, book detail, etc.), not just the old feed-only local `.side` column it replaced.
- A full-width fixed `Header` (`5.5rem` tall) sits above everything — logo at the left, book search at the right, plus the mobile hamburger. `Sidebar` and `RightPanel` both start below it (`top: 5.5rem`, not `inset-block: 0`), and `.content` clears it with `margin-top: 5.5rem`. These three `5.5rem` values (plus `Header.module.css`'s own `.header { height }`) are coupled — change them together.

## Breakpoint

**640px**, always as `@media (max-width: 640px)`, is still the one in use for nav/page-internal collapse: below it, nav collapses to a hamburger, sidebar layouts drop the `margin-left` offset, multi-column pages go single-column.

A second breakpoint, **1100px**, exists only in `Layout.module.css` for the 3-column shell itself: below it `RightPanel`/`.rightRail` hides (`display: none`) and `.content` drops `margin-right`, since the center content plus two `15rem` rails needs real width to avoid feeling cramped — a genuine break the 640px step doesn't cover. Don't add further breakpoints for individual pages' own internal layouts; this one is specifically for the global rail.

A third, **480px**, exists only in `LandingPage.module.css` to hide the top bar's join button on small phones (the hero's big join button is right below). It's local to that page, not a global step.

## Typography

- Two font tokens: `--font-sans` (`Public Sans` + system-ui fallback stack) for UI chrome, `--font-serif` (`Literata` + Georgia fallback) for headings, book titles, and review/post body text. `body` sets `--font-sans`; `h1`–`h4` are switched to `--font-serif` by a base rule in `index.css`. Both load from Google Fonts (see `index.html`).
- No type-scale tokens exist yet (font sizes are set per component, e.g. `0.95rem` titles, `0.85rem` muted metadata). If a real type scale becomes necessary, add `--font-size-*` tokens to `index.css` rather than continuing to hand-pick sizes — but don't add that abstraction speculatively.

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
