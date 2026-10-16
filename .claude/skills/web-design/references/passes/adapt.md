# Pass: adapt

Rethink a screen for another context (phone, tablet, a wide screen, print). Adaptation is rethinking the experience, not scaling pixels.

## Assess
- **Where it came from:** designed for desktop or phone? What did it assume (big screen, mouse, fast connection)?
- **Where it's going:** device, input (touch, mouse, keyboard), size and orientation, connection, context (a quick glance in bed vs focused reading at a desk), platform expectations.
- **What won't fit, won't work or isn't appropriate** there (hover-only actions on touch, tiny targets, desktop patterns on a phone).

## Phone (≤ 640px, our collapse point)
- One column, vertical stacking, full-width components; the sidebar becomes the drawer, the right rail moves below or away.
- 44px targets with space between them, nothing hover-dependent, primary actions in thumb reach (lower half) where practical.
- Progressive disclosure: primary content first, secondary in tabs or "Show more"; shorter copy; body 16px.
- Bottom sheets instead of small dropdowns where a choice list is long.

## Tablet (~641–1100px, rail hidden)
Two columns where content allows, master/detail for lists, touch and pointer both work, density between phone and desktop.

## Wide desktop (≥ 1100px, rail shown)
Use horizontal space with a max width (no stretching to 4K), the sidebar visible, hover for extra information (never the only way), keyboard shortcuts for power use.

## Print (a list, a reading year)
Hide navigation and interactive controls, expand truncated text, page breaks at logical points, show URLs, limited colour.

## Techniques
Flexbox/grid reflow, container queries for components used in different widths, `clamp()` only for marketing display type (Operate and Read screens keep a fixed rem scale), responsive images (`srcset`), lazy loading, `display: none` sparingly (it still downloads).

## Check
`scripts/shoot.mjs --widths 375,800,1280,1440` plus a real phone when touch or performance matters (emulation misses real touch and browser chrome). Then `polish`.
