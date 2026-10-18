---
name: Winged Words
description: A warm reading room for logging books and sharing them with friends; the cream page stays, books stand on a shelf.
colors:
  page: "#f7f3e8"
  frame: "#efe7d6"
  frame-well: "#e4dac6"
  raised: "#fffdf8"
  sunken: "#f1eadc"
  ink: "#1f1d1a"
  muted-ink: "#6b665e"
  hairline: "#ece4d6"
  bookbinding-green: "#2e5e4e"
  bookbinding-green-deep: "#1f4237"
  green-wash: "#e7efe9"
  foil-gold: "#a87a22"
  heart: "#a15c3e"
  danger: "#9c3b2e"
  shelf-light: "#e6d9c2"
  shelf-dark: "#d8c8ad"
  cloth: "#3d5c4a"
  cloth-text: "#f3ecdc"
typography:
  display:
    fontFamily: "Literata (optical size follows the font size), Georgia, serif"
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

The target look of the site, read by the `web-design` and `ux-review` skills, the `frontend-dev` agent and the `design-reviewer` agent before any visual work, after `PRODUCT.md`. Approved 2026-10-16 from the mockup at https://claude.ai/artifact/WEAaHS3iF7bWMXLw2HbkHZ (boards "Today", "Proposed", "Style sheet", "Motion"). The rollout is `specs/shelf-design-refresh.md`; until a phase is built, the code still shows the older look. The tokens above are Paper's values and are normative since Phase 1 (2026-10-16) put them into `web/src/index.css`, which holds all five themes and is the source of truth for exact values.

Structure follows the DESIGN.md format used by Impeccable and Google's Stitch; much of the doctrine is adapted from Impeccable (Apache 2.0) and Anthropic's frontend-design skill, see `THIRD-PARTY-NOTICES.md`.

## Overview

A warm reading room: the cream page stays, books stand on a shelf, and everything around them is quiet, softly raised and clearly labelled. A quiet place for readers, not a dashboard competing for attention.

**The Shelf Rule.** Wherever a set of covers forms a row (an author's books, a reader's shelves, a list, favourites), the covers stand on a thin wooden shelf: a spine shade on each cover's left edge, a real shadow under it, a 10px shelf bar under the row. It is the one bold element; nothing else on a page competes with it (no other decorative effects, gradients or textures).

**The Book-Cloth Rule.** A book subject doesn't make the soft default automatic. Beyond the cream page (pinned by the user for reading comfort), colour comes from book cloth, thread, jackets and endpapers: deep, real colours with jobs, not a beige wash with one terracotta accent.

**Kinds of screen.** Every screen is Operate (do a task: shelves, journal, search, settings), Read (understand: book, author, review, writing) or Persuade (landing, invite, sign-up). Operate earns familiarity and restraint, Read keeps a calm column inside a frame that carries the look, Persuade may be bolder. Depth in `.claude/skills/web-design/references/modes.md`.

**What is deliberate (never a finding):** the cream page in Paper, Sepia and Warm Gray (reading comfort, the user's one hard rule); serif type for titles and reading (a book site, chosen); the shelf (the one place the design is allowed to be bold).

## Colors

Roles, not swatches; each keeps one meaning in every theme. Values above are Paper; the other four themes (White, Warm Gray, Sepia, Dark) have their own value per role in `index.css`, chosen on the mockup's "five themes" board (2026-10-16) and contrast-checked (text and links 4.5:1 on page, raised, sunken and frame; stars and the heart 3:1). Dark is designed for evening reading on a phone, not inverted: a warm near-black page (#1b1a17), raised surfaces lighter than it, soft ivory text (#e8e3d7) rather than white, a lighter green (#86bba3) with dark text on buttons. A `designGuards` test checks every theme defines every role.

### Primary
- **Bookbinding green** (#2e5e4e): actions, links, the current selection, focus. **The One Green Button Rule:** one filled green button per view; the green is never decoration.
- Green wash (#e7efe9) behind the selected menu item and "Following"-type states.

### Secondary
- **Foil gold** (#a87a22; deepened from #b8862b, which was 2.9:1 on the page): stars and the unread dot only. **The Gold Is Not Text Rule:** never for text (contrast).
- **Heart** (#a15c3e): the favourite heart only; the old terracotta kept as one small warm note.

### Neutral
- **Page** (#f7f3e8): the reading background. **The Unchanged Page Rule:** it never changes in Paper.
- **Frame** (#efe7d6): header and sidebar tint, a second neutral layer so the frame has a colour of its own.
- **Frame well** (#e4dac6; added 2026-10-16 in Phase 2): a step deeper than the frame, for things sunk into it: the Books/Community track and the hover tint of header buttons and sidebar rows. `--sunken` is nearly the frame colour in the light themes, so it would vanish there.
- **Raised** (#fffdf8) cards, **Sunken** (#f1eadc) wells and chips, **Hairline** (#ece4d6) separators.
- **Ink** (#1f1d1a) text, **Muted ink** (#6b665e) labels and metadata, never for text a reader must act on.
- **Danger** (#9c3b2e): destructive actions and errors.
- **Book cloth** (#3d5c4a, title in #f3ecdc): the cover of a book with no cover image, so a coverless book still looks like a book on the shelf.

### Named Rules
- **The No-Grey-On-Colour Rule.** Secondary text on a coloured surface is a shade of that surface or the foreground, never generic grey.
- **The Solid Colour Rule.** Prefer explicit colours over stacked translucent layers; alpha makes contrast unpredictable.
- **The Never-Alone Rule.** Colour-coded meaning always also has text, shape or an icon; check charts and states with colour-blindness simulation.
- Strategy: Operate and Read screens are Restrained (tinted neutrals + green with jobs). The landing page may be Committed (one book-cloth colour owning whole regions).

## Typography

- **Display:** Literata 600 (chosen 2026-10-16 on the mockup's display-face board over Brygada 1918 and Besley): names, page titles, section headings and headline numbers in stat tiles. One family for display and reading; its optical-size axis follows the font size, so large names get the display cut. `--font-display`, with `--font-size-display` (2.5rem) only for a page's name and a lead stat. Large sizes tracked -0.01 to -0.02em (floor -0.04em); headings balanced (`text-wrap: balance`).
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
Header and sidebar in the frame tint, one L around the cream page: no divider lines, and the sidebar's tint runs on to the window's left edge. Sidebar items: drawn icon + label, 44px rows, 10px corners; the selected one in a green-wash pill with green text; hover in the frame well. Header: logo, the Books/Community segmented control (frame-well track, raised selected segment), search with an icon, bell, avatar with name where there is room. Height `--header-height` (4.5rem; 7rem on a phone, 3.5rem there when signed out).
- **Phone (chosen 2026-10-16, "Books / Community on a phone" board, option A):** row 1 is menu, logo, search field and bell; row 2 is the switch, full width. The sidebar is a drawer behind the menu button.
- **Right rail:** each block a raised card with 16px padding (narrower than the 20–24px of page cards, because the rail is 17rem wide); rows inside are plain rows with a sunken hover, never boxes of their own.

### Icons
One drawn line set (`components/Icon.tsx`): 24px grid, 1.8px stroke, round caps and joins, `currentColor`. **The No-Glyph Rule:** never characters or emoji as icons (✓ ♡ ✦ × + ⌂ and the like); a `designGuards` test fails on them. A star as a unit right beside a number ("4★", "★4") is typography, not an icon.

### Stat tiles (`StatTiles`)
A big display number over a muted label, with an optional quiet detail line; a real `<dl>`. Only inside a card, never as a page's hero.

### People
**The Named-Person Rule.** Always a picture and a name (a pill), never an anonymous avatar row.

### Quotes
Their own raised card; an oversized green opening quote mark (`--font-size-quote-mark`, 4.5rem, only for this mark); the passage in the reading face; the book as a link; who shared it last and small.

### Empty states
Say what the area is for and link to the first step; first use, cleared, no results, no permission and error each read differently.

### The Shelf (signature)
Covers in a row, spine shade (`inset 4px 0 0 rgba(0,0,0,.16)` plus a light inset), shadow `0 6px 14px rgba(40,30,15,.28)`, then a 10px shelf bar (shelf-light to shelf-dark) with a soft shadow below; titles and years under the shelf. A "Read" pill can sit on a cover.

## Motion

Adapted from Impeccable's `animate` and `delight`. Motion is planned before it is built, and every animation has a job: **acknowledge an action, show a change of state, keep continuity when something moves, or be the one focal moment.** Test: removing it would lose meaning or character, not only decoration.

**Already exists (keep):** skeleton placeholders (opacity only), a 150ms fade-in when a page mounts, the loading line under the header. A page-turn between Books and Community was tried on 2026-10-13 and rejected: no page-level effects.

**The focal moment: a book settles onto the shelf** when a reader adds it or marks it read: the cover drops into place and its shadow settles (500–600ms, the arrival curve). The only motion allowed that long.

*Built 2026-10-16:* the global classes `motion-settle`, `motion-pop` and `motion-fade` in `index.css`, and `lib/arrivals.ts` for which books just arrived. A cover settles only once its image has loaded, and only one cover per moment.

**Bigger moments, in proportion to effort:** finishing a book and reaching the yearly goal get a slightly larger response (the book settles onto the Read shelf, the goal bar fills). Ordinary clicks never celebrate; every moment must feel right the hundredth time.

**Feedback (100–180ms):** the heart fills with a small pop; stars fill as you rate; Follow crossfades to Following with a check; a pressed button dips.

**The cover tilt:** a cover on a shelf tips slightly forward when pointed at or when its title has keyboard focus, like pulling a book off a shelf (`perspective(500px) rotateX(9deg) translateY(-3px)`, 200ms; confirmed and built 2026-10-16). Only on devices with a real hover, so a tap on a phone doesn't leave a book tipped; none under reduced motion. Only shelf covers get it; a plain "lift on hover" anywhere else is not allowed.

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
- Tokens: `--duration-feedback` 120ms, `--duration-state` 200ms, `--duration-panel` 320ms, `--duration-focal` 560ms, `--ease-out` (arrivals), `--ease-in` (exits); under reduced motion they shorten to fades (feedback 0ms, the rest 120–150ms).
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
