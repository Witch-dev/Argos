> **Superseded 2026-09-28** by `reading-room-design-refresh.md` — after seeing this direction live, the user asked to switch to the `Reading Room` (warm paper) direction from the same design canvas instead. Left in place for history; the token table below no longer matches `index.css`.

# E-Ink Design Refresh

Replaces Argos's default blue-accent light/dark palette with a grayscale, e-reader-inspired visual system across the whole web app — a full token-level restyle, not a new feature. Chosen after reviewing four design directions (`Ex Libris`, `Reading Room`, `Field Notes`, `E-Ink`) explored on a design canvas; this spec adapts the `E-Ink` direction from a literal device mockup into a real desktop website (no bezel, no battery indicator, no phone-narrow single column — the existing Sidebar-nav, multi-column layout stays).

## 1. Rationale

Argos's current palette (`--accent: #3a5a9a` blue) has no particular identity — it's a placeholder from early scaffolding. An e-ink aesthetic fits the product's subject matter (reading) and gives the app a distinct, print-like feel: warm neutral grays instead of stark white/black, serif type for book titles and reading content, flat matte cards instead of shadowed ones, dot ratings instead of star glyphs (real e-ink displays alias star glyphs and gold fills poorly — filled/outline circles read cleanly at low bit depth).

## 2. Design tokens (`Apollon/web/src/index.css`)

All existing token *names* are kept (nothing downstream should need to know a value changed) — only values change, plus two new font tokens.

| Token | Light (`:root`) | Dark (`prefers-color-scheme: dark`) | Notes |
|---|---|---|---|
| `--bg` | `#ece9e2` | `#1f1e1a` | warm paper / warm-charcoal "screen" tone, never pure white or pure black |
| `--bg-elevated` | `#f4f1e9` | `#29271f` | cards/panels — a shade lighter (light) / lighter-than-bg (dark), not a shadow |
| `--text` | `#1c1c1a` | `#e8e4d8` | ink |
| `--text-muted` | `#6b6960` | `#a19c8c` | secondary text |
| `--border` | `#cfcabb` | `#3c392f` | dividers, card borders — does more work than before since cards drop their shadow |
| `--accent` | `#4a473d` | `#cfc9b8` | links/active states — a restrained ink-gray, not a hue; relies on underline/weight for affordance, same as print |
| `--accent-contrast` | `#f4f1e9` | `#1f1e1a` | text/icon on a filled accent button |
| `--danger` | `#8c3b32` | `#d98a76` | kept as the one non-gray exception — errors are a distinct semantic category and a muted "rubber-stamp red" still reads as restrained, not a bright system-red |
| `--font-serif` *(new)* | `'Source Serif 4', Georgia, serif` | same | headings, book titles, review/post body text |
| `--font-sans` *(new)* | `'Work Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | same | UI chrome — nav, buttons, labels, metadata, form fields |
| `--shadow-elevated` *(new)* | `0 8px 24px rgba(28,24,16,0.16)` | `0 8px 24px rgba(0,0,0,0.5)` | the *only* permitted shadow — floating overlays (modals, popovers, suggestion dropdowns) only, never a resting card |

`--radius` changes from `8px` to `3px` (flatter, more paper-like corners — still one token, still applied everywhere via `var(--radius)`, never a per-component literal).

`--space-*` and `--max-width` are unchanged.

Fonts load via a Google Fonts `<link>` in `Apollon/web/index.html` (`Source Serif 4` weights 400/500/600 + italic 400/500, `Work Sans` weights 400/500/600/700), with a `preconnect` to `fonts.gstatic.com`. `body` font-family becomes `var(--font-sans)`; a base rule sets `h1, h2, h3, h4 { font-family: var(--font-serif); }`. Component-level book/review titles that aren't heading tags get `font-family: var(--font-serif)` explicitly in their own `.module.css`.

## 3. Component-level changes

- **`StarRating`**: renders `●` (filled) / `○` (unfilled) instead of `★`. Color comes from `var(--text)` when filled, `var(--border)` when not — removes the hardcoded `#d4a017` gold in `StarRating.module.css` (was already a token-rule violation).
- **`BookCover`**: real cover images (`<img>`, when `coverUrl` is set) get `filter: grayscale(1)` so any Open Library cover art (color) renders consistent with the grayscale system. The no-cover placeholder already only uses `--bg-elevated`/`--text-muted` — no per-book color to remove, just inherits the new palette. Placeholder title text gets `var(--font-serif)`.
- **Shadows audit**: every `box-shadow` currently in the codebase (22 files, found via grep) gets reviewed — kept only on true floating overlays (modals: `ProgressUpdateModal`, `PostComposerModal`; popovers: `ActivityItemPopover`; suggestion dropdowns: `BookPicker`, `AddBookSearch`) using `var(--shadow-elevated)`; removed everywhere else (resting cards rely on the now-more-visible `var(--border)` instead).
- **Hardcoded hex audit**: every hex literal found in component CSS (same 22-file grep) gets replaced with the matching token — no exceptions expected beyond `--danger`'s own definition.
- **`border-radius` audit**: any literal px value not already expressed as `var(--radius)` (or `calc(var(--radius) / 2)`, as `BookCover` already does) gets converted, so the global `--radius: 3px` change actually cascades everywhere.

## 4. What does NOT change

- Layout structure: left `Sidebar` nav (`15rem` fixed), multi-column dashboard, card grids (`repeat(auto-fill, minmax(9rem, 1fr))`) — this is a palette/type/motif change, not a re-layout.
- The `640px` breakpoint and its collapse behavior.
- CSS Modules mechanism, spacing scale, `StateMessage` components, accessibility baseline (real `<button>`/`<a>`/`<label>`, alt text, `aria-expanded`).
- No device chrome, no phone-narrow single column, no fake status bar/battery indicator — those belonged to the literal `E-Ink` device mockup, not the real site.

## Task list

### Frontend
- [ ] Update `Apollon/web/src/index.css`: new token values (table above), `--radius: 3px`, new `--font-serif`/`--font-sans`/`--shadow-elevated` tokens (light + dark), base `body`/`h1-h4` font-family rules.
- [ ] Add Google Fonts `<link>` (+ `preconnect`) to `Apollon/web/index.html` for Source Serif 4 + Work Sans.
- [ ] `StarRating.tsx` / `StarRating.module.css`: dot glyphs, token-based color, remove hardcoded gold.
- [ ] `BookCover.tsx` / `BookCover.module.css`: grayscale filter on real covers, serif placeholder text.
- [ ] Audit all 22 files with hardcoded hex/`box-shadow`/literal `border-radius` (found via grep) — replace with tokens per §3; keep `--shadow-elevated` only on modals/popovers/dropdowns listed above.
- [ ] Update `.claude/skills/web-design/references/design-tokens.md` so the snapshot matches the new `index.css` (per that skill's own rule not to let the doc drift).
- [ ] Verify: `npm run build` and `npm run lint` clean; dev-server check in a browser at desktop width and ≤640px, both light and dark OS mode.
- [ ] `CHANGELOG.md` entry once verified.
