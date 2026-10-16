---
name: Winged Words
description: A warm reading room for logging books and sharing them with friends; the cream page stays, books stand on a shelf.
colors:
  page: "#f7f3e8"
  frame: "#efe7d6"
  raised: "#fffdf8"
  sunken: "#f1eadc"
  ink: "#1f1d1a"
  muted-ink: "#6b665e"
  hairline: "#ece4d6"
  bookbinding-green: "#2e5e4e"
  bookbinding-green-deep: "#1f4237"
  green-wash: "#e7efe9"
  foil-gold: "#b8862b"
  heart: "#a15c3e"
  danger: "#9c3b2e"
  shelf-light: "#e6d9c2"
  shelf-dark: "#d8c8ad"
typography:
  display:
    fontFamily: "TBD in Phase 1 (recommended: Literata at display optical size), Georgia, serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
    lineHeight: 1.1
  reading:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
  interface:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  control: "10px"
  card: "14px"
  pill: "999px"
  cover: "2px 5px 5px 2px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.bookbinding-green}"
    textColor: "{colors.page}"
    rounded: "{rounded.control}"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.bookbinding-green-deep}"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  chip:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  card-raised:
    backgroundColor: "{colors.raised}"
    rounded: "{rounded.card}"
    padding: "24px"
  card-sunken:
    backgroundColor: "{colors.sunken}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: Winged Words

The target look of the site, read by the `web-design` and `ux-review` skills, the `frontend-dev` agent and the `design-reviewer` agent before any visual work, after `PRODUCT.md`. Approved 2026-10-16 from the mockup at https://claude.ai/artifact/WEAaHS3iF7bWMXLw2HbkHZ (boards "Today", "Proposed", "Style sheet", "Motion"). The rollout is `specs/shelf-design-refresh.md`; until a phase is built, the code still shows the older look. The tokens above are **proposed** values; they become normative as Phase 1 puts them into `web/src/index.css`.

Structure follows the DESIGN.md format used by Impeccable and Google's Stitch; much of the doctrine is adapted from Impeccable (Apache 2.0) and Anthropic's frontend-design skill, see `THIRD-PARTY-NOTICES.md`.

## Overview

A warm reading room: the cream page stays, books stand on a shelf, and everything around them is quiet, softly raised and clearly labelled. A quiet place for readers, not a dashboard competing for attention.

**The Shelf Rule.** Wherever a set of covers forms a row (an author's books, a reader's shelves, a list, favourites), the covers stand on a thin wooden shelf: a spine shade on each cover's left edge, a real shadow under it, a 10px shelf bar under the row. It is the one bold element; nothing else on a page competes with it (no other decorative effects, gradients or textures).

**The Book-Cloth Rule.** A book subject doesn't make the soft default automatic. Beyond the cream page (pinned by the user for reading comfort), colour comes from book cloth, thread, jackets and endpapers: deep, real colours with jobs, not a beige wash with one terracotta accent.

**Kinds of screen.** Every screen is Operate (do a task: shelves, journal, search, settings), Read (understand: book, author, review, writing) or Persuade (landing, invite, sign-up). Operate earns familiarity and restraint, Read keeps a calm column inside a frame that carries the look, Persuade may be bolder. Depth in `.claude/skills/web-design/references/modes.md`.

**What is deliberate (never a finding):** the cream page in Paper, Sepia and Warm Gray (reading comfort, the user's one hard rule); serif type for titles and reading (a book site, chosen); the shelf (the one place the design is allowed to be bold).

## Colors

Roles, not swatches; each keeps one meaning in every theme. Values above are Paper; the other four themes (White, Warm Gray, Sepia, Dark) get their own values per role in Phase 1, built in OKLCH, contrast-checked. Dark is designed, not inverted: its own depth (raised lighter than page) and a lighter green.

### Primary
- **Bookbinding green** (#2e5e4e): actions, links, the current selection, focus. **The One Green Button Rule:** one filled green button per view; the green is never decoration.
- Green wash (#e7efe9) behind the selected menu item and "Following"-type states.

### Secondary
- **Foil gold** (#b8862b): stars and the unread dot only. **The Gold Is Not Text Rule:** never for text (contrast).
- **Heart** (#a15c3e): the favourite heart only; the old terracotta kept as one small warm note.

### Neutral
- **Page** (#f7f3e8): the reading background. **The Unchanged Page Rule:** it never changes in Paper.
- **Frame** (#efe7d6): header and sidebar tint, a second neutral layer so the frame has a colour of its own.
- **Raised** (#fffdf8) cards, **Sunken** (#f1eadc) wells and chips, **Hairline** (#ece4d6) separators.
- **Ink** (#1f1d1a) text, **Muted ink** (#6b665e) labels and metadata, never for text a reader must act on.
- **Danger** (#9c3b2e): destructive actions and errors.

### Named Rules
- **The No-Grey-On-Colour Rule.** Secondary text on a coloured surface is a shade of that surface or the foreground, never generic grey.
- **The Solid Colour Rule.** Prefer explicit colours over stacked translucent layers; alpha makes contrast unpredictable.
- **The Never-Alone Rule.** Colour-coded meaning always also has text, shape or an icon; check charts and states with colour-blindness simulation.
- Strategy: Operate and Read screens are Restrained (tinted neutrals + green with jobs). The landing page may be Committed (one book-cloth colour owning whole regions).

## Typography

- **Display** for names, page titles, section headings and headline numbers in stat tiles. **Open decision (Phase 1):** the mockup used Fraunces, but Impeccable lists Fraunces among the most overused "default" faces, and says a book subject alone is not a reason for one. Recommended: **Literata at its display optical size, weight 600** (one serif family for display and reading, which the Operate guidance favours), compared on a board against one or two less common bookish serifs before choosing. Large sizes tracked -0.01 to -0.02em (floor -0.04em); headings balanced (`text-wrap: balance`).
- **Reading:** Literata 400, ~17px, line height 1.7, 60–75 characters a line: bios, reviews, writings, quotes.
- **Interface:** Public Sans, **16px body floor**; labels and metadata 14px (`--font-size-sm` rises from 13.6px to 14px in Phase 1); nothing a reader needs below 13px.

### Hierarchy
- The dominant heading and body differ by at least 1.25×; neighbouring steps of the product scale ~1.125–1.2 apart. Few roles; same role, same style everywhere. Sizes only from the `--font-size-*` tokens (a fixed rem scale, never fluid on Operate and Read screens).
- Leading never below 1.3; body 1.5–1.7. Wider lines need more leading.
- `tabular-nums` wherever numbers line up (stats, counts, years in grids).
- Paragraphs: spacing or a first-line indent, not both.

### Named Rules
- **The Labels-Are-Never-Display Rule.** The display face never sets buttons, labels, table data or counts in rows.
- **The Dark-Ink Rule.** Light text on Dark gets a little more line height, a touch more tracking and one step more weight than in Paper.
- **The No-Jump Rule.** Web fonts load with `font-display: swap` and a metric-matched fallback (`size-adjust`), so text doesn't jump.

## Layout

- Spacing only from the scale (4, 8, 12, 16, 24, 32px: `--space-1, 2, 3, 4, 6, 8`; no 5 or 7). Rhythm from contrast between tight and generous gaps; `gap` for siblings.
- **The Heading-Breathes Rule.** More space above a heading than below it; tight groups, clear gaps between groups.
- **The Squint Rule.** Blur the screen: the primary element, the secondary one and the main groups must still read in order.
- Proximity before containers: group with space and alignment first, add a card only when it clarifies.
- Body measure 65–75 characters; the reading column never wider.
- Breakpoints: 640px collapse (sidebar to drawer, single column), 1100px right rail. Responsive changes are structural; container queries for components used at different widths.
- Tap targets 44px even when the visible mark is smaller.

## Elevation & Depth

- **Raised card:** raised colour, 14px corners, a soft two-layer warm shadow (`0 1px 2px rgba(60,40,20,.06), 0 8px 24px rgba(60,40,20,.06)`), no border. The main blocks of a page.
- **Sunken well:** sunken colour, 14px corners, no shadow, no border. Secondary panels and controls.
- **Hairline:** 1px, only to separate two kinds of content inside one card.
- Overlays (menus, modals, popovers) keep `--shadow-elevated`.

### Named Rules
- **The Declare-Once Rule.** A surface has a shadow *or* a tone, never also a border (a hairline border under a wide soft shadow is the "ghost card").
- **The No-Nesting Rule.** No card inside a card; use space, type and a hairline instead.
- Shadows have an offset and a soft blur; no zero-offset coloured glow, no hard offset block shadow.

## Shapes

- Controls 10px corners, cards 14px, small things (chips, link pills, reader pills, segmented controls) full pills.
- Book covers: `2px 5px 5px 2px` (a spine on the left), 2:3 ratio.
- Avatars and author photos are circles; initials on a tinted circle when there's no photo.

## Components

### Buttons
Primary: filled green, 44px, 10px corners, one per view. Secondary: raised background, 1px border, ink text. Quiet: text-only in green. Pressed: a slight dip (`scale(0.97)`, 100ms). Every state designed: default, hover, focus-visible, active, disabled, loading.

### Chips (pills)
Sunken pill for tags and link pills (with a drawn arrow for external links); green wash for a selected/positive state ("Read"). Segmented controls (Books/Community, sort) are a sunken pill track with a raised selected segment.

### Cards / Containers
Raised for main blocks, sunken for secondary ones (see Elevation). Padding 20–24px.

### Inputs / Fields
44px, 10px corners, a persistent visible label (never placeholder-only), inline errors beside the field, the green focus ring.

### Navigation
Header and sidebar in the frame tint. Sidebar items: drawn icon + label, 44px rows, 10px corners; the selected one in a green-wash pill with green text. Header: logo, the Books/Community segmented control, search with an icon, bell, avatar.

### Icons
One drawn line set: 24px grid, 1.8px stroke, round caps and joins, `currentColor`. **The No-Glyph Rule:** never characters or emoji as icons (✓ ♡ ✦ × + ⌂ and the like).

### Stat tiles (`StatTiles`)
A big display number over a muted label, with an optional quiet detail line; a real `<dl>`. Only inside a card, never as a page's hero.

### People
**The Named-Person Rule.** Always a picture and a name (a pill), never an anonymous avatar row.

### Quotes
Their own raised card; an oversized green opening quote mark; the passage in the reading face; the book as a link; who shared it last and small.

### Empty states
Say what the area is for and link to the first step; first use, cleared, no results, no permission and error each read differently.

### The Shelf (signature)
Covers in a row, spine shade (`inset 4px 0 0 rgba(0,0,0,.16)` plus a light inset), shadow `0 6px 14px rgba(40,30,15,.28)`, then a 10px shelf bar (shelf-light to shelf-dark) with a soft shadow below; titles and years under the shelf. A "Read" pill can sit on a cover.

## Motion

Adapted from Impeccable's `animate` and `delight`. Motion is planned before it is built, and every animation has a job: **acknowledge an action, show a change of state, keep continuity when something moves, or be the one focal moment.** Test: removing it would lose meaning or character, not only decoration.

**Already exists (keep):** skeleton placeholders (opacity only), a 150ms fade-in when a page mounts, the loading line under the header. A page-turn between Books and Community was tried on 2026-10-13 and rejected: no page-level effects.

**The focal moment: a book settles onto the shelf** when a reader adds it or marks it read: the cover drops into place and its shadow settles (500–600ms, the arrival curve). The only motion allowed that long.

**Bigger moments, in proportion to effort:** finishing a book and reaching the yearly goal get a slightly larger response (the book settles onto the Read shelf, the goal bar fills). Ordinary clicks never celebrate; every moment must feel right the hundredth time.

**Feedback (100–180ms):** the heart fills with a small pop; stars fill as you rate; Follow crossfades to Following with a check; a pressed button dips.

**Under consideration:** a cover tilts slightly forward on hover or focus, like pulling a book off a shelf (approved in the motion board 2026-10-16 as "liked"; confirm before building). A plain "lift on hover" is not allowed.

| Duration | Use |
|---|---|
| 100–150 ms | Feedback on a press |
| 150–300 ms | Routine change of state |
| 300–500 ms | Panels and layout changes |
| 500–800 ms | Only the focal moment |

- Arrivals `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out`); exits faster than entrances; no bounce or elastic.
- Animate `transform` and `opacity` (colour for state, a bounded shadow for the settling cover); never `width`, `height`, `top`, `left`, margins or `transition: all`.
- New items after "Show more" may stagger, capped ~300ms in total. No scroll reveals, section fade-ins, parallax or hover lifts. On Operate screens no page-load choreography.
- Content visible by default; a second click mid-animation lands in the right end state; `will-change` only during a known animation.
- **Reduced motion:** remove the movement, keep the meaning (the cover appears with a short fade, the heart and Follow still change at once). Fewer and gentler, not nothing.
- Tokens: `--duration-feedback`, `--duration-state`, `--duration-focal`, `--ease-out` (Phase 1).
- **Plan first:** one line before code: what moves, which job, how long, what reduced motion shows.

## Do's and Don'ts

### Do:
- **Verify on the built result**, in one batched look per round (`scripts/shoot.mjs`, Paper and Dark, 1280 and 375, real data):
  - Contrast: body and placeholder 4.5:1, large text, icons, controls and focus rings 3:1, in every theme and state.
  - Spacing: the Heading-Breathes Rule, read the computed values.
  - Type: measure 65–75ch, real copy (long titles, German) at every width, nothing overflowing.
  - States: hover, focus, active, disabled, loading, error, empty, success, permission-limited.
  - **Browser surfaces carry the design:** text selection (`::selection`), caret (`caret-color`), focus rings, link underline offset (`text-underline-offset`), tabular numerals, and scrollbars where custom, all from the palette. The cheapest sign a page was built rather than assembled.
  - Copy in the product's own words: controls name their action, errors name the problem and the recovery.
  - Every requirement of the spec present and findable within seconds.
- **Reserve space for late-arriving things:** personal state (follow, favourite, read marks), counts and images keep their size while loading (a disabled placeholder, `aspect-ratio`), and the page column has a minimum height so the footer never jumps. Target CLS < 0.1 at 375 and 1280 (`scripts/shoot.mjs --metrics --shifts`).
- Keep claims true: no invented stats, quotes or testimonials; sample data labelled.
- Choose light or dark defaults from the reading scene, not habit.

### Don't (the refuse list):
- Same-size icon-plus-heading-plus-text cards as a page's structure; nested cards (always wrong).
- The hero-metric template (big number, small label, supporting stats, accent) as a page opening.
- **An eyebrow or kicker above a heading: banned outright**, no exceptions. The heading speaks for itself.
- Section numbers (01 / 02 / 03) unless the sequence is information.
- A modal for a task that needs neither interruption nor protected focus; inline first.
- Gradient text; glow halos; glass or blur as decoration; hard offset shadows; decorative stripe or grid backgrounds.
- A coloured side border thicker than 1px on cards, list items, callouts or alerts.
- Sparklines, progress rings or soft rounded rectangles standing in for content.
- Monospace as a "technical" costume (only for code or data).
- Characters or emoji as icons.
- Middle-dot strings joining different kinds of fact ("A · B · C"): give each its own line or label.
- Marketing buzzwords (streamline, empower, supercharge, world-class, cutting-edge, next-generation), aphorisms ("Not a feature. A habit."), em-dash-heavy copy.
- Fonts, colours, radii or sizes outside this file; if one is genuinely needed, add it here first.
