---
name: web-design
description: Use for any visual/UI design work on the Argos frontend — new component styling, page layout, a redesign/polish pass, or "make this look better" requests. Triggers on "/web-design", "redesign X", "restyle X", "polish the UI", "improve the layout/design of X". Distinct from new-react-feature: that skill wires data/behavior for a new feature, this skill governs how anything (new or existing) looks — applying Argos's existing design tokens (`Apollon/web/src/index.css`) rather than inventing new visual conventions per component.
---

# Argos Web Design

Governs visual decisions on the frontend: color, spacing, layout, responsive behavior, and visual consistency. Use this alongside `new-react-feature` when a new feature needs UI (that skill handles the data-wiring vertical slice; this one handles how it looks), or standalone for a pure redesign/polish task with no new data flow — like `specs/home-dashboard-redesign.md`.

See `references/design-tokens.md` for the full snapshot of the design system (5 themes, colors, fonts, spacing scale, breakpoints, grid pattern, a11y baseline). Read it before starting any visual work, and re-check the live `Apollon/web/src/index.css` if something there looks off — the reference file is a snapshot, the CSS file is truth.

## Phase 1 — Confirm the shape

Before touching styles, pin down (ask the user if unclear):
1. Is this new UI (pairs with `new-react-feature`) or a visual change to something that already exists (redesign/polish)?
2. Scope: one component, one page, or a cross-page sweep (like a loading/error/empty consistency pass)?
3. Does it need a new design token (a color, a spacing step, a breakpoint) or does the existing scale already cover it? Default to "it's covered" — check `references/design-tokens.md` before assuming a gap.
4. Any reference/inspiration named by the user (a competitor's layout, a screenshot) — capture what specifically is being borrowed (proportions, information density) vs what isn't (Argos keeps its own token values, not a copied palette).

## Phase 2 — Use the existing system, don't invent a parallel one

- Colors: only the tokens in `index.css` (`--bg`, `--bg-elevated`, `--text`, `--text-muted`, `--text-subtle`, `--border`, `--accent`, `--accent-contrast`, `--danger`). No hardcoded hex in component CSS.
- Fonts: `--font-serif` (Literata) for headings, book titles and reading text; `--font-sans` (Public Sans) for UI chrome.
- Font sizes: only `--font-size-xs`, `-sm`, `-base`, `-lg`, `-xl`, `-2xl`. No raw `rem` in `font-size` (a Vitest guard fails on it).
- Shadow: `--shadow-elevated` only, and only on floating overlays (modals, popovers, dropdowns), never on a resting card.
- Spacing: only `--space-1`, `-2`, `-3`, `-4`, `-6` and `-8` (there is no 5 or 7). No literal pixel/rem margins that aren't one of these.
- Corners: `--radius` everywhere a radius is needed, not a per-component value.
- Breakpoints: `@media (max-width: 640px)` for page and nav collapse. `1100px` exists only in `Layout.module.css` for the right rail, and `480px` only on the landing page. Don't add another unless a layout genuinely breaks.
- Mechanism: CSS Modules, one `ComponentName.module.css` per component, short unprefixed class names (`.card`, `.title`) — matches every existing file in `Apollon/web/src/components` and `src/pages`.
- Loading/error/empty states: reuse `LoadingMessage`/`ErrorMessage`/`EmptyMessage` from `src/components/StateMessage.tsx` rather than writing new one-off markup for the same three states.

### Build a block from the shared pieces, then design its anatomy

Tokens keep colours and sizes consistent; they do not stop a block from being a pile of loose lines (the first author "readers" box was: counts, a rating, a book link and avatars as four sentences in one grey box). Before writing markup for any card, box or panel:

1. **Look for a shared piece first.** Facts side by side (a few numbers, a rating, a most-read book) are `StatTiles`: big serif value over a small label, a real `<dl>`. Also: `BookCard`, `Avatar`, `AuthorPhoto`, `StateMessage`, the `.btn` variants, `WritingCard`. If a second place needs the same look as a first, extract the piece (as `StatTiles` was extracted from the year card and the Stats page) instead of copying its CSS.
2. **One kind of fact per row.** Numbers in one row, people in another, actions in another. Separate kinds with a hairline (`border-top: 1px solid var(--border)` and `--space-4`), not by running them together.
3. **Say what each fact is.** A bare number or a bare avatar is a mystery: give a label under the value ("Readers", "Average rating") and put people's names next to their pictures (a pill: avatar and name).
4. **A short sentence is not a layout.** "Average rating 3.8 from 8 ratings" becomes a value (3.8), a label (Average rating) and a quiet detail (from 8 ratings).
5. **Decide the hierarchy on purpose**: the value is the biggest thing (`--font-size-xl`, serif), labels and details are `--font-size-sm` in `--text-muted`. Only one primary action per view.
6. **Check it with real data and at 375px** (tiles wrap two to a row, pills wrap, long names truncate with the full name in `title`), in Paper and Dark, before calling it done.

If a real gap exists (no token fits), add it to `index.css` in every theme block (bare `:root`, the five `[data-theme]` blocks and the `prefers-color-scheme: dark` fallback), and update `references/design-tokens.md` in the same change — don't let the reference doc drift from what's actually in the file.

## Phase 3 — Build

1. Read an existing component/page that's visually closest to what's being built or changed — match its structure before styling from scratch.
2. Write/update the `.module.css`, using only tokens from Phase 2.
3. Confirm all 5 themes (Paper, White, Warm Gray, Sepia, Dark): every color decision has to work in each, not just the default. Check every theme block in `index.css` defines the tokens used.
4. Confirm the 640px collapse: does this layout need to reflow to single-column / hide the sidebar-offset / collapse nav at mobile width? Follow the pattern in `Layout.module.css` (drop `margin-left`, adjust padding) rather than a new mechanism.
5. Accessibility: real `<button>`/`<a>` for interactive elements, `<label htmlFor>` on form fields, alt text with real fallback semantics on any image, `aria-expanded`/`aria-controls` on any collapsible nav — match the baseline in `references/design-tokens.md`, don't regress it. Also, for anything new:
   - **Keyboard and focus:** everything works without a mouse; a visible `:focus-visible` outline (never `outline: none` alone); modals trap Tab, close on Escape and return focus to the opener.
   - **Forms:** visible labels (a placeholder is not a label), inline errors linked with `aria-describedby`/`aria-invalid`, a pending state on submit.
   - **Announcements:** `role="status"`/`aria-live="polite"` for non-urgent results, `role="alert"` only for errors; icon-only buttons get an `aria-label` through `t('…')`.
   - **Touch and motion:** targets at least 44×44px; a `prefers-reduced-motion` variant for any animation, animating `transform`/`opacity` only (never `transition: all`).
   - **Dates and numbers** through `Intl`, never a hardcoded format.
   The full list is `.claude/skills/ux-review/references/code-checklist.md`.

## Phase 4 — Verify

- `npm run build` and `npm run lint` clean (per the project's existing verification norm — a passing typecheck says nothing about how it looks).
- Actually view it in a browser (the `browser-check` skill; set the theme with the `argos_theme` localStorage key or the ThemeMenu): at least Paper and Dark, plus Sepia for anything colour-heavy, at one width above and one at/below 640px. Don't declare a visual change done from reading the CSS alone.
- If this touched shared components (`StateMessage`, `Avatar`, `BookCard`, etc.), check the other pages that use them for regressions, not just the page that motivated the change.
- To judge whether a screen is clear and well laid out (rather than build it), use the `ux-review` skill. It writes findings to `ux-reviews/`, and its fixes come back here.
