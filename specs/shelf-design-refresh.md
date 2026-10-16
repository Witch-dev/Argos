# Feature Spec — Shelf design refresh

**Status:** 🟡 Direction approved 2026-10-16 (mockup https://claude.ai/artifact/WEAaHS3iF7bWMXLw2HbkHZ). Nothing built yet. The target look is `DESIGN.md`; the product context is `PRODUCT.md`.

Supersedes most of `reading-room-design-refresh.md`: the cream page and the Literata + Public Sans pairing stay; the terracotta accent, flat 3px bordered boxes and glyph icons go.

## 1. Problem

Many parts of the site work but look bland: every block is the same bordered box on the same background, one terracotta accent does all the work, icons are text characters, and each new component is designed from zero, so they drift (the author readers box was four loose sentences). Design tools single out cream + serif + terracotta as the generic default look of generated sites.

## 2. Decisions (2026-10-16, with the user)

1. **Keep the cream page background** for reading comfort. Everything else could change.
2. **Accent: bookbinding green** `#2e5e4e`; foil gold only for stars and the unread dot; the old terracotta stays only on the favourite heart.
3. **Header and sidebar: a paper tint** (`#efe7d6`), not a dark bar.
4. **Signature: books on a shelf** wherever covers form a row.
5. **Foundations first:** context files, tokens, fonts, icons and shared pieces, then the shell, then pages one by one.
6. **Borrow from Impeccable, don't install it** (its detector would flag the cream page on every edit; its hooks and sub-agents add cost). Its ideas are adapted into `DESIGN.md` and the two skills, with attribution (Apache 2.0).

## 3. Design

The look itself is `DESIGN.md`. This spec only says what gets built and in what order.

## 4. Tasks

### Phase 0 — Context and tooling
- [x] `PRODUCT.md` and `DESIGN.md` at the root of Argos
- [x] `web-design` skill: read `PRODUCT.md` and `DESIGN.md` first; a plan step (which pieces, which kind of screen, a motion plan) before code; a required screenshot critique round after it (2026-10-16)
- [x] `ux-review` skill: Nielsen 0–4 scoring (out of 40), the 8-point cognitive-load check, 2–3 personas with named elements, the specificity test, motion checks, a Scores section in the findings file (2026-10-16)
- [x] `scripts/shoot.mjs <route…>`: side ports, its own confirmed reader, Paper and Dark, 1280 and 375 (2026-10-16; tested)
- [x] The same rules wired into `new-react-feature`, `browser-check`, the `frontend-dev` and `reviewer` agents and `CLAUDE.md`, so every frontend step reads `DESIGN.md` (2026-10-16)
- [x] Motion rules in `DESIGN.md` (adapted from Impeccable's `animate` and `delight`): a job for every animation, the timing table, the focal "book settles onto the shelf" moment, reduced motion (2026-10-16)
- [x] Impeccable adapted into our tooling (2026-10-16, commit 6af45ac of pbakaus/impeccable, Apache 2.0): 16 named passes + `shape` + `modes` for web-design; scoring guide, personas (incl. our own readers) and an audit mode for ux-review; the `design-reviewer` agent (fresh eyes, disposition ship/fix/rebuild/recapture); DESIGN.md rewritten in the DESIGN.md format with named rules, the full refuse list and browser-surface theming; PRODUCT.md in its product-record structure with unconfirmed facts marked; `THIRD-PARTY-NOTICES.md`
- [x] A clickable motion board in the mockup (book onto the shelf, heart, Follow, finishing a book, the cover tilt) for the user to judge before anything is built

### Phase 1 — Foundations (Apollon `web/`)
- [ ] Tokens in every theme block: accent green, frame, raised, sunken, gold, heart; `--radius-card` 14px, `--radius-control` 10px, `--radius-pill`; `--shadow-card`. Values for White, Warm Gray, Sepia and Dark chosen and contrast-checked (Dark: a lighter green)
- [ ] **Display face decision:** a board comparing Literata at display size (recommended) with 1–2 less common bookish serifs (not on Impeccable's overused list: Fraunces, Playfair, Cormorant, Lora, Crimson, Newsreader, Instrument Serif, DM Serif…) on the author page header and a stat tile; the user picks; then the Google Fonts link, `--font-display`, metric-matched fallbacks
- [ ] `--font-size-sm` from 0.85rem to 0.875rem; body text 16px everywhere; `tabular-nums` on aligned numbers
- [ ] Browser surfaces themed: `::selection`, `caret-color`, `text-underline-offset`, focus rings
- [ ] `Icon` component with one drawn set; every character icon replaced (✓ ♡ ✦ × + and the sidebar glyphs)
- [ ] Shared pieces: `Card` (raised / sunken), `.btn` variants at 44px and 10px corners, `Pill`, `Shelf` (covers on a shelf, used by every cover row), `StatTiles` restyled; `YearSoFarCard` and the Stats page moved onto `StatTiles`
- [ ] A dev-only style sheet page (`/dev/styleguide`) showing every shared piece in every theme
- [ ] Motion tokens: `--duration-feedback`, `--duration-state`, `--duration-focal`, `--ease-out`, with reduced-motion values
- [ ] Guard tests (our own version of Impeccable's deterministic rules, run by Vitest so they block a push): no raw hex or rgb colours in component CSS; font sizes only from tokens (exists); radii only from tokens; no `border` together with `--shadow-card`; no coloured side border over 1px; no `transition: all`; no bounce/elastic easing; no `background-clip: text` gradients; no glyph icons (✓ ♡ ✦ × + ⌂…) as JSX text; no uppercase letter-spaced label directly before a heading (kicker); no `line-height` under 1.3 or body `letter-spacing` over 0.05em; no `text-align: justify`; locale copy (en) free of marketing buzzwords (streamline, empower, supercharge, world-class, cutting-edge, next-generation, seamless) and "theater" framing

### Phase 2 — The shell
- [ ] Header in the frame tint, Books/Community as a segmented control, search with an icon, bell and avatar
- [ ] Sidebar with drawn icons and a pill for the selected item; right rail as raised cards

### Phase 3 — Pages (one at a time, each with before/after screenshots)
- [ ] Author page (as the mockup)
- [ ] The focal motion: a book settles onto the shelf when added or marked read; finishing a book and reaching the goal get the larger moment; heart, stars and Follow feedback
- [ ] Book page
- [ ] Profile and shelves (shelf on every cover row)
- [ ] Lists and list pages
- [ ] Feed, writings and reviews
- [ ] Journal and stats
- [ ] Search and the header suggestions
- [ ] Clubs
- [ ] Settings, notifications, import
- [ ] Landing page (Persuade mode)

### Phase 4 — Verification
- [ ] `ux-review` sweep of every page with the new rubric; findings in `ux-reviews/`
- [ ] All five themes, 375 and 1280, keyboard pass; `npm test`, build, lint

## 5. Open questions

- The exact values for the four other themes (Phase 1).
- Phone layout of the shell (Phase 2): does the segmented control stay in the header?
