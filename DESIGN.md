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

## Quality floor (checked on every visual change)

- Text contrast 4.5:1 (3:1 at 24px+), in every theme.
- More space above a heading than below it; tight groups, clear gaps between groups.
- Body measure 65 to 75 characters.
- No nested cards; no border on a card that already has a shadow; no coloured side stripes on cards.
- No gradient text, no glow, no glass or blur as decoration, no decorative grid or dot backgrounds.
- No middle-dot strings when the parts are different kinds of fact: give each its own line or label.
- Motion: only to show what changed after an action; respects reduced motion.
- Check at 375px and 1280px, in Paper and Dark at least, with real data.

## What is deliberate (not a defect)

- The cream page in Paper, Sepia and Warm Gray: chosen for reading comfort.
- Serif display type: it is a book site.
- The shelf: the one place the design is allowed to be bold.
