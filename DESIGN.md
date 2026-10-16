# Winged Words: design direction

The target look of the site. Read by the `web-design` and `ux-review` skills before any visual work, after `PRODUCT.md`. Approved 2026-10-16 from the mockup at https://claude.ai/artifact/WEAaHS3iF7bWMXLw2HbkHZ (boards "Today", "Proposed" and "Style sheet"). The rollout is `specs/shelf-design-refresh.md`; until a phase of it is built, the code still shows the older look.

Parts of the structure and the "quality floor" are adapted from Impeccable (https://github.com/pbakaus/impeccable, Apache 2.0) and Anthropic's frontend-design skill.

## The idea in one line

A warm reading room: the cream page stays, books stand on a shelf, and everything around them is quiet, softly raised and clearly labelled.

## The signature: books on a shelf

Wherever a set of covers is shown (an author's books, a reader's shelves, a list, favourites) the covers stand on a thin wooden shelf: a spine shade on the left edge of each cover, a real shadow under it, and a 10px shelf bar under the row with its own soft shadow. This is the one bold element. Nothing else on a page competes with it: no other decorative effects, gradients or textures.

## Colour

The page background is fixed; the rest are roles, set per theme as tokens.

| Role | Paper value | Use |
|---|---|---|
| Page | `#f7f3e8` | The reading background. **Never changes.** |
| Frame | `#efe7d6` | Header and sidebar tint, so the frame has a colour of its own. |
| Raised | `#fffdf8` | Cards on the page. |
| Sunken | `#f1eadc` | Secondary panels, chips, segmented controls, the selected menu item's pill. |
| Ink | `#1f1d1a` | Text. |
| Muted ink | `#6b665e` | Labels, details, metadata. Never for text the reader needs to act on. |
| Accent: bookbinding green | `#2e5e4e` | Actions, links, the selected item. **One filled accent button per view.** |
| Foil gold | `#b8862b` | Stars and the unread dot only. Never text. |
| Heart | `#a15c3e` | The favourite heart only (the old terracotta, kept as a small warm note). |
| Danger | `#9c3b2e` | Destructive actions. |

Other themes keep their own page colour and get their own values for each role; Dark needs a lighter green (decided in the spec's Phase 1, checked for 4.5:1).

## Type

- **Display: Fraunces 600** for names, page titles, section headings and big numbers. Tight tracking (-0.01 to -0.02em) on large sizes.
- **Reading: Literata 400**, 17px, line height 1.7, at most about 65 characters a line: bios, reviews, writings, quotes.
- **Interface: Public Sans 400 to 700**, 15px: menus, buttons, labels, counts. Nothing smaller than 13px.
- Sizes come from the `--font-size-*` scale; hierarchy is built with weight and colour first, size second.

## Surfaces and depth

- **Raised card:** `Raised` background, 14px corners, a soft two-layer shadow (`0 1px 2px` + `0 8px 24px`, warm brown at about 6%), **no border**. For the main blocks of a page.
- **Sunken well:** `Sunken` background, same corners, no shadow, no border. For secondary panels and controls.
- **Hairline:** a 1px line only to separate two kinds of content inside one card.
- Elevation is declared once: a card has a shadow or a tone, never also a border. No cards inside cards.

## Controls

- Buttons 44px tall, 10px corners. Primary: filled green. Secondary: raised background with a 1px border. Quiet: text only in green.
- Small things (chips, link pills, reader pills, the segmented control) are pills (`999px`).
- Every icon comes from one drawn line set (24px grid, 1.8px stroke, round caps). **No characters as icons** (✓ ♡ ✦ × + ⌂ and the like).
- Every interactive state is designed: hover, focus-visible, active, disabled, loading.

## Patterns

- **Stat tiles** (`StatTiles`): big Fraunces number over a muted label, with an optional detail line. Only inside a card, never as a page's hero.
- **People:** always a picture **and** a name (a pill), never an anonymous avatar row.
- **Quotes:** their own raised card, an oversized green opening quote mark, the passage in Literata, the book as a link, the sharer last and small.
- **Empty states:** say what the area is for and link to the first step.

## Density by kind of screen (adapted from Impeccable's "modes")

- **Read** (book page, review, writing, author bio): generous space, long measure limits, the text leads.
- **Operate** (shelves, journal, settings, search, stats): clean and standard controls first; the look shows through type, palette, the shelf and one warm detail, never by hiding the task.
- **Persuade** (landing page): may be bolder, still with the cream page and the shelf.

## Motion

Adapted from Impeccable's `animate` and `delight` references. Motion is part of the design, planned before it is built, and every animation has a job: **acknowledge an action, show a change of state, keep continuity when something moves, or be the one focal moment.** Anything else is decoration and is left out. Test: removing it would lose meaning or character, not only decoration.

**What already exists (keep):** skeleton placeholders while loading (opacity only), a 150ms fade-in when a page mounts, the thin loading line under the header. A page-turn between Books and Community was tried on 2026-10-13 and rejected: no page-level effects.

**The focal moment: a book settles onto the shelf.** When a reader adds a book or marks it read, its cover drops into its place on the shelf and its shadow settles (500 to 600ms, the arrival curve). It is the only motion allowed to take that long.

**Bigger moments, in proportion to effort** (from `delight`): finishing a book and reaching the yearly goal get a slightly larger response (the book settles onto the Read shelf, the goal bar fills). Ordinary clicks never get a celebration, and every moment must still feel right the hundredth time.

**Feedback (100 to 150ms):** the heart fills with a small scale pop; stars fill as you rate; Follow crossfades to Following with a check icon; a pressed button dips slightly.

**Under consideration (judge it in the mockup first):** on focus or hover, a cover tilts slightly forward, like pulling a book off a shelf. A plain "lift on hover" is not allowed (a generic default).

**Timing:**

| Duration | Use |
|---|---|
| 100–150 ms | Feedback on a press |
| 150–300 ms | Routine change of state (open, close, swap) |
| 300–500 ms | Panels and layout changes |
| 500–800 ms | Only the focal moment |

- Arrivals use `cubic-bezier(0.16, 1, 0.3, 1)` (as `--ease-out`); exits are faster than entrances. No bounce or elastic curves.
- Animate `transform` and `opacity` (colour too for state); never `width`, `height`, `top`, `left` or margins, and never `transition: all`.
- A list that appears after "Show more" may stagger its new items, capped at about 300ms in total. No scroll reveals, no fade-and-rise on sections, no parallax, no hover lifts.
- Content is visible by default, so a failed script never hides it. Interrupting an animation (a second click) must leave the right end state.
- **Reduced motion** (`prefers-reduced-motion: reduce`): remove the movement, keep the meaning. The cover appears in place with a short fade, the heart and Follow still change colour and icon at once. Fewer and gentler, not nothing.
- Durations and the curve are tokens (`--duration-feedback`, `--duration-state`, `--duration-focal`, `--ease-out`), added in Phase 1 of the shelf refresh.

**Plan first:** any change that animates something writes a one-line motion plan before code: what moves, why (which of the four jobs), how long, and what reduced motion shows instead.

## Quality floor (checked on every visual change)

- Text contrast 4.5:1 (3:1 at 24px+), in every theme.
- More space above a heading than below it; tight groups, clear gaps between groups.
- Body measure 65 to 75 characters.
- No nested cards; no border on a card that already has a shadow; no coloured side stripes on cards.
- No gradient text, no glow, no glass or blur as decoration, no decorative grid or dot backgrounds.
- No middle-dot strings when the parts are different kinds of fact: give each its own line or label.
- Motion follows the Motion section: a job for every animation, the timing table, reduced motion handled.
- Check at 375px and 1280px, in Paper and Dark at least, with real data.

## What is deliberate (not a defect)

- The cream page in Paper, Sepia and Warm Gray: chosen for reading comfort.
- Serif display type: it is a book site.
- The shelf: the one place the design is allowed to be bold.
