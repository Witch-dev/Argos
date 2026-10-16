# Pass: layout

Turn product priority into reading order, grouping, rhythm and usable space. Diagnose the structural problem before moving boxes. Keep the established look: layout changes structure inside it.

On Operate and Read screens predictable structure, stable density and a navigable order are features. The landing page may be more asymmetric when that earns its place.

## Assess with evidence (screenshots from `scripts/shoot.mjs` and the source)
- **Reading order, the squint test:** blur the detail. Can you still find the primary element, the secondary one and the main groups, in order?
- **Grouping:** related things close, distinct groups separated; or are containers making up for weak proximity?
- **Rhythm:** tight and generous gaps make a deliberate cadence, or one value repeated until everything weighs the same?
- **Structure:** does the topology fit the content? Are repeated cards or columns really equivalent, or a framework default?
- **Density:** does the amount per region fit how often it's used and how hard the decision is?
- **Adaptation:** at 375, ~800, 1280+, 200% zoom and in German, what reorders, wraps, collapses or scrolls? Does keyboard order still match visual order?
- **Extremes:** long titles, empty states, overlays, the sticky header, small tap targets.

## Write the spatial plan first
The primary path; what belongs together and what separates; what leads and what supports; the intended density and rhythm; how it changes across widths and content extremes.

## Apply
- Group by meaning; proximity before adding containers or decoration.
- Rhythm from contrast between tight (`--space-1/2`) and generous (`--space-6/8`) intervals. More space above a heading than below it.
- Only the spacing scale (`--space-1, 2, 3, 4, 6, 8`).
- `gap` for sibling rhythm instead of child margins.
- Responsive changes are structural (reorder, collapse, reveal), at the 640px collapse; container queries when the same component sits in different widths.
- Tap targets 44px even when the visible mark is smaller.
- Depth (raised card) only when it clarifies hierarchy or state.
- Optical corrections only after looking at the rendered result.
- Repetition supports recognition; break it only when content or priority changes.

## Check
Answer each assessment question again with rendered evidence, not a bare "yes". Then `polish`.
