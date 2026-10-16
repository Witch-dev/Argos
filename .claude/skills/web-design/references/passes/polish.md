# Pass: polish

The final quality pass before something is called done. Polish refines the existing design; it doesn't replace it. If the concept itself is wrong, say so and recommend a redesign or `bolder`.

## Order of work
1. **Read the system:** DESIGN.md, the tokens, shared components and the neighbouring screens. Classify every inconsistency you find as one of: **missing token**, **one-off implementation**, **conceptual mismatch** (two ideas for one job), or **local defect**. The class decides the fix (a token, a shared piece, a decision, or a local change).
2. **Use the feature yourself** at 375 and 1280, by mouse and keyboard, along the whole path (e.g. search → book page → log it → it appears on the shelf → the Feed), not just the screen in view.
3. **Read the latest review:** if `ux-reviews/<page>.md` has open P1/P2 findings, they are your backlog; name the file. Do an independent pass anyway.
4. **Triage in this order:** broken or blocked tasks, lost data, misleading state, inaccessible paths → missing states → flow, hierarchy, layout and drift from DESIGN.md → visual and motion inconsistencies → code and asset clean-up.
5. **Polish the whole path.**
6. **Verify** (the critique round), then mark the review's findings `fixed` and add the CHANGELOG line.

## Required states
Loading, empty, error, success, disabled, permission-limited (private, blocked); long, missing, translated, offline and slow content. Every control: default, hover, focus, active, disabled, loading, error, success.

## Layout, type, colour
On the spacing scale with optical alignment; related things tight, groups clearly separated. Same role, same type everywhere; test measure, wrapping, German, zoom and font loading. Semantic tokens with stable meanings across themes; contrast in every state. Images with the right aspect ratio (no shift) and useful `alt`.

## Browser surfaces (the cheapest sign something was built, not assembled)
Theme text selection (`::selection`), the caret (`caret-color`), scrollbars where custom, focus rings, link underline offset (`text-underline-offset`) and tabular numerals in aligned numbers, from the palette.

## Interaction and accessibility
Visible focus, logical tab order, accurate labels, 44px targets; motion coherent, interruptible and smooth; zoom, contrast, semantics and screen-reader names checked; no console errors, no layout shift, no slow interactions.

## Content and code
Consistent terms, capitalisation and punctuation (ask before changing facts). Replace custom code with the shared piece where one exists; promote only reusable values to tokens. Remove debug output, dead code, unused imports and styles.

## Ship gate
Done only when the path is complete and consistent end to end.
