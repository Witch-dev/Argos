# Reading Room Design Refresh

Supersedes `e-ink-design-refresh.md` — after seeing that grayscale/device-inspired direction live, the user asked to switch the real site to the `Reading Room` direction from the same four-option design canvas instead: warm paper tones, a serif built for reading, and a terracotta accent, in place of the grayscale/dot-rating system. The manual light/dark toggle added afterward (`useTheme.ts`, `data-theme` attribute, `localStorage`) is a mechanism, not a look — it's kept as-is; only the token *values* it switches between change.

## 1. Rationale

Same reasoning as before for *why a themed palette at all* (an e-ink/reading identity fits a book-logging app better than the original placeholder blue). The pivot from `E-Ink` to `Reading Room` is purely an aesthetic preference once both were seen live — warm paper over cold grayscale, a rust accent over "no accent at all," real star ratings over dots. Nothing about layout, structure, or the theme-toggle mechanism changes.

## 2. Design tokens (`Apollon/web/src/index.css`)

Same token names, both the `@media (prefers-color-scheme: dark)` block and the `[data-theme='dark']` block (added for the manual toggle) get these dark values — they must stay in sync with each other, per the comment already in the file.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--bg` | `#faf6ec` | `#241f16` | warm paper / dark warm oak-brown — never pure white or pure black |
| `--bg-elevated` | `#f1e9d5` | `#2e2818` | a deeper cream (light) / a shade lighter than bg (dark) — Sidebar rail, cards |
| `--text` | `#2b2418` | `#ece2c8` | ink / warm parchment |
| `--text-muted` | `#7a6e58` | `#b0a084` | secondary text |
| `--border` | `#e4dcc8` | `#453c26` | dividers, card borders |
| `--accent` | `#a15c3e` | `#d98a5c` | terracotta/rust — links, primary buttons, star-rating fill, active states. A real hue this time (unlike E-Ink's ink-gray-only accent) |
| `--accent-contrast` | `#faf6ec` | `#241f16` | text/icon on a filled accent button |
| `--danger` | `#9c3b2e` | `#e08a72` | kept in the same warm-red family as `--accent` so it reads as "part of the same book" rather than a jarring system red |
| `--font-serif` | `'Literata', Georgia, serif` | same | headings, book titles, review/post body text — replaces Source Serif 4. Literata is Google's font built specifically for on-screen reading/e-readers, which is the whole point of this direction |
| `--font-sans` | `'Public Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | same | UI chrome — replaces Work Sans |
| `--shadow-elevated` | `0 8px 24px rgba(60,45,20,0.18)` | `0 8px 24px rgba(0,0,0,0.55)` | unchanged mechanism (modals/popovers/dropdowns only), retinted warm |

`--radius` stays `3px` — already flat/paper-appropriate, no reason to change it again.

Google Fonts `<link>` in `index.html` changes to Literata (weights 400/500/600, italic 400/500) + Public Sans (400/500/600/700), replacing the Source Serif 4 + Work Sans link.

## 3. Component-level changes

- **`StarRating`**: reverts from `●`/`○` dots back to `★` glyphs. Filled color changes from `var(--text)` to `var(--accent)` (the mockup renders stars in the terracotta accent, not ink) — unfilled stays `var(--border)`, unchanged.
- **`BookCover`**: removes the `filter: grayscale(1)` added for the E-Ink pass — real Open Library cover art renders in its natural color again, fitting a "warm paper, real color" direction instead of a grayscale one. Placeholder (no cover) keeps using `--bg-elevated`/`--text-muted`/`--font-serif` — no per-book placeholder color; that was specific to the mockup's illustrative dataset, not a real mechanism to build.
- Everything else the E-Ink pass touched (shadow audit, hex-literal audit, `border-radius` → `var(--radius)`) stays as it landed — those were general token-discipline fixes, not E-Ink-specific, and don't need re-doing.

## 4. What does NOT change

- The manual light/dark toggle itself (`useTheme.ts`, the `Sidebar` button, the inline no-flash script in `index.html`, the `data-theme` attribute mechanism) — only the values it switches between.
- Layout structure, the `640px` breakpoint, CSS Modules mechanism, spacing scale, accessibility baseline — same as the E-Ink spec's §4.
- The `Reading Room` mockup's book-spread composition (split page, dotted table-of-contents leaders, drop caps, dog-ear ribbon, running page number) is a single-artboard mockup device, not a real layout instruction — same reasoning the E-Ink spec used for not porting its device bezel. This pass is a palette/typography/color swap, not a re-layout.

## Task list

### Frontend
- [ ] Update `Apollon/web/src/index.css`: new token values (table above) in both the light `:root` block and both dark blocks (`@media (prefers-color-scheme: dark)` and `[data-theme='dark']`) — keep them in sync per the existing comment.
- [ ] Swap the Google Fonts `<link>` in `Apollon/web/index.html` to Literata + Public Sans.
- [ ] `StarRating.tsx`/`.module.css`: `★` glyphs back, `.filled` color `var(--text)` → `var(--accent)`.
- [ ] `BookCover.tsx`/`.module.css`: remove `filter: grayscale(1)`.
- [ ] Update `.claude/skills/web-design/references/design-tokens.md` so the snapshot matches.
- [ ] Verify: `npm run build` and `npm run lint` clean; dev-server check in a browser at desktop and ≤640px, light and dark (including the manual toggle, not just OS preference).
- [ ] `CHANGELOG.md` entry once verified.
