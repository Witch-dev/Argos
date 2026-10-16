---
name: web-design
description: Use for any visual/UI design work on the Argos frontend — new component styling, page layout, a redesign/polish pass, or "make this look better" requests. Triggers on "/web-design", "redesign X", "restyle X", "polish the UI", "improve the layout/design of X". Distinct from new-react-feature: that skill wires data/behavior for a new feature, this skill governs how anything (new or existing) looks — applying Argos's existing design tokens (`Apollon/web/src/index.css`) rather than inventing new visual conventions per component. Also covers motion (anything that animates). Reads `Argos/PRODUCT.md` and `Argos/DESIGN.md` first, and ends with a screenshot critique round.
---

# Argos Web Design

Governs visual decisions on the frontend: color, spacing, layout, responsive behavior, and visual consistency. Use this alongside `new-react-feature` when a new feature needs UI (that skill handles the data-wiring vertical slice; this one handles how it looks), or standalone for a pure redesign/polish task with no new data flow — like `specs/home-dashboard-redesign.md`.

## Start here, every time

1. Read `C:/Users/jramo/Argos/PRODUCT.md` (who the readers are, how the site should feel) and `C:/Users/jramo/Argos/DESIGN.md` (the target look: colour roles, type, surfaces, controls, icons, the shelf, **motion**, the quality floor). DESIGN.md wins over generic taste and over anything in this file that contradicts it.
2. Check `specs/shelf-design-refresh.md` for which phases are built. Until Phase 1 is built, the code still has the older tokens (terracotta, 3px, borders): new work uses the tokens that exist in `index.css` but already follows DESIGN.md's structure rules (block anatomy, one primary action, people with names, drawn icons where an `Icon` exists, motion rules, quality floor). Colour, font and corner changes land only through the spec's phases, so the site never ends up half one look and half the other.

## Passes, briefs and kinds of screen

- **Passes:** focused jobs with one goal, run on a named target: `shape`, `bolder`, `quieter`, `distill`, `clarify`, `layout`, `typeset`, `colorize`, `animate`, `delight`, `onboard`, `harden`, `adapt`, `optimize`, `extract`, `overdrive`, `polish`. The table, how plain-word requests map to them, and what to suggest when none is named are in `references/passes/README.md`; each pass has its own file. A request like "make the profile header stronger" is the `bolder` pass; "finish it" is `polish`. **Every visual change ends with `polish`** (its checklist is the Phase 4 critique round's backbone).
- **New screens or big components start with `shape`** (`references/shape.md`): 1–2 rounds of questions, then a short brief, no code. When the composition is genuinely open, sketch 2–3 structurally different variants on the design canvas (the Design artifact) and let the user pick before building.
- **Kinds of screen** (Operate, Read, Persuade) and what each allows: `references/modes.md`.
- Adapted from Impeccable (Apache 2.0); see `Argos/THIRD-PARTY-NOTICES.md`.

See `references/design-tokens.md` for the full snapshot of the design system (5 themes, colors, fonts, spacing scale, breakpoints, grid pattern, a11y baseline). Read it before starting any visual work, and re-check the live `Apollon/web/src/index.css` if something there looks off — the reference file is a snapshot, the CSS file is truth.

## Phase 1 — Confirm the shape

Before touching styles, pin down (ask the user if unclear):
1. Is this new UI (pairs with `new-react-feature`) or a visual change to something that already exists (redesign/polish)?
2. Scope: one component, one page, or a cross-page sweep (like a loading/error/empty consistency pass)?
3. Does it need a new design token (a color, a spacing step, a breakpoint) or does the existing scale already cover it? Default to "it's covered" — check `references/design-tokens.md` before assuming a gap.
4. Any reference/inspiration named by the user (a competitor's layout, a screenshot) — capture what specifically is being borrowed (proportions, information density) vs what isn't (Argos keeps its own token values, not a copied palette).
5. Which **kind of screen** it is (DESIGN.md "Density by kind of screen"): Read, Operate or Persuade. It sets how much room and how much boldness the screen gets.
6. **Write a short plan before code** (a few lines in your reply, not a file): which shared pieces it uses, what is read first, the one primary action, what each state looks like (loading, empty, error, long content), and a **motion plan** if anything animates: what moves, which job it does (acknowledge, state, continuity, focal), how long (DESIGN.md timing table) and what reduced motion shows instead. Then check the plan against DESIGN.md and say what you changed if a part reads like a generic default.

## Phase 2 — Use the existing system, don't invent a parallel one

- Colors: only the tokens in `index.css` (`--bg`, `--bg-elevated`, `--text`, `--text-muted`, `--text-subtle`, `--border`, `--accent`, `--accent-contrast`, `--danger`). No hardcoded hex in component CSS.
- Fonts: `--font-serif` (Literata) for headings, book titles and reading text; `--font-sans` (Public Sans) for UI chrome.
- Font sizes: only `--font-size-xs`, `-sm`, `-base`, `-lg`, `-xl`, `-2xl`. No raw `rem` in `font-size` (a Vitest guard fails on it).
- Shadow: `--shadow-elevated` only, and only on floating overlays (modals, popovers, dropdowns), never on a resting card. *(Changes with Phase 1 of the shelf refresh: raised cards get `--shadow-card` and no border; see DESIGN.md "Surfaces".)*
- Spacing: only `--space-1`, `-2`, `-3`, `-4`, `-6` and `-8` (there is no 5 or 7). No literal pixel/rem margins that aren't one of these.
- Corners: `--radius` everywhere a radius is needed, not a per-component value. *(Phase 1 of the shelf refresh adds `--radius-card`, `--radius-control` and `--radius-pill`.)*
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
   - **Touch:** targets at least 44×44px.
   - **Motion:** follow DESIGN.md "Motion" and the plan from Phase 1: durations from its table, `--ease-out` for arrivals, exits faster than entrances, only `transform`/`opacity` (and colour for state), never `transition: all`, no hover lifts, scroll reveals or section fade-ins. Every animation gets a `prefers-reduced-motion: reduce` variant that removes the movement but keeps the meaning (the state still changes visibly). Content must be visible without the animation, and a second click mid-animation must land in the right end state.
   - **Dates and numbers** through `Intl`, never a hardcoded format.
   The full list is `.claude/skills/ux-review/references/code-checklist.md`.

## Phase 4 — Verify, then look and fix once (required)

- `npm run build` and `npm run lint` clean (per the project's existing verification norm — a passing typecheck says nothing about how it looks).
- Actually view it in a browser (the `browser-check` skill; set the theme with the `argos_theme` localStorage key or the ThemeMenu): at least Paper and Dark, plus Sepia for anything colour-heavy, at one width above and one at/below 640px. Don't declare a visual change done from reading the CSS alone.
- If this touched shared components (`StateMessage`, `Avatar`, `BookCard`, etc.), check the other pages that use them for regressions, not just the page that motivated the change.
- **Critique round, every visual change.** With the side-port servers running (browser-check skill, section 1), take screenshots of every route you touched: `node C:/Users/jramo/Argos/scripts/shoot.mjs <route…> --out <scratchpad>/shots` (Paper and Dark, 1280 and 375 by default; `--themes`, `--widths`, `--scroll 0,700`, `--full` when needed; first time: `npm install` in `Argos/scripts`). Look at each screenshot with Read, then check it against DESIGN.md's quality floor and ask: *what is read first, and is it the right thing? Could an unrelated product use this block unchanged? What one thing can be removed?* Fix what fails, take the same screenshots again and look once more. Say in your reply what the round changed (or that it changed nothing and why). Don't declare a visual change done from reading the CSS alone.
- **Motion:** if something animates, also check it moving: record it (`browser.newContext({ recordVideo: { dir } })`) or take screenshots at 0 / 50 / 100% of its duration, and check it again with `reducedMotion: 'reduce'` in the context options.
- **Fresh eyes at the end of a phase or a page** of the shelf refresh (or any larger visual change): after your own critique round, hand the screenshots, the changed files, DESIGN.md and the mockup/brief to the `design-reviewer` agent. Apply its material fixes, take the same screenshots, and send them back for its verdict pass. Report its disposition word (ship / fix / rebuild / recapture) as it gave it.
- To judge whether a screen is clear and well laid out (rather than build it), use the `ux-review` skill. It writes findings to `ux-reviews/`, and its fixes come back here.
