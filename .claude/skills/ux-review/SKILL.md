---
name: ux-review
description: Use to audit how an Argos screen looks and reads, without changing it — word placement, hierarchy, spacing, text sizes, menus, clarity of options and labels, accessibility, states. Triggers on "/ux-review", "review the UX of X", "is X clear / well laid out", "does X need more space", "audit the design of X", "check the menus". Produces a ranked findings file in `ux-reviews/`; the fixes are then done with the `web-design` skill. Not for building or restyling (that is `web-design`) and not for bugs in behaviour (that is `bugs/`).
---

# Argos UX review

Judges whether a screen is *good*: is it clear what to read first, is there enough room, are the sizes right, do the menus and options make sense. `web-design` builds consistently with the tokens; this skill checks the result and writes down what to fix. **It never edits the app.** Reviewing and fixing are separate jobs, and the user often wants the review alone.

Two passes, because they find different things:

- **Visual pass**: look at real screenshots (hierarchy, spacing, sizes, menus, labels). Criteria in `references/visual-checklist.md`.
- **Code pass**: read the page's component files for rules a screenshot can't show (keyboard, focus, forms, live regions, motion, `Intl`). Criteria in `references/code-checklist.md`.

## Phase 1 — Scope

Pin down, asking the user only if unclear:
1. **What:** one page, one component (menu, modal), or a flow (e.g. "add a book to a shelf")?
2. **Who is looking:** logged in or logged out, and a reader with data or a brand-new one (empty states matter as much as full ones).
3. **Defaults:** Paper and Dark, at ~375px and ~1280px. Add Sepia when the page is colour-heavy. The 1100px rail breakpoint matters for any page with the right rail.

## Phase 2 — Capture

Use the `browser-check` skill (side ports, Playwright, seeded readers). Take screenshots into the scratchpad and **look at each one** with Read; don't review from the CSS alone.

**Use viewport screenshots at a real first-view size (e.g. 1366×768, 1280×800, 375×700) for every layout judgement.** `fullPage` screenshots resize the viewport, so sticky sidebars and `100vh` layouts look wrong in them; use `fullPage` only to check content order. Also sweep the header and any shared chrome across a range of widths (1280 down to 320) with measured bounding boxes, since collisions hide between the standard breakpoints.

Capture, for each page: the normal state, the empty state, the loading state if it can be caught, an error state if reachable, and long content (a very long title or username, a review at its maximum length). Then do one keyboard pass: Tab through the page and note where focus goes and whether it is always visible.

## Phase 3 — Review

1. Walk `references/visual-checklist.md` against the screenshots.
2. Walk `references/code-checklist.md` against the page's `.tsx` and `.module.css` files (find them from the route, then follow imports one level).
3. For anything involving colour, spacing or size, **phrase the finding against the Argos tokens** (`--space-*`, `--text-muted`, `--radius`; see `.claude/skills/web-design/references/design-tokens.md`): "the gap between the title and the byline is `--space-1`, the section gap is `--space-2`, so they read as one block; use `--space-4` between sections". Never "needs more space" alone.

**Judge by Argos's own conventions, not generic taste.** These are deliberate and are not findings: flat 3px corners, no shadow on resting cards (borders define them), the 5.5rem header, the centred 3-column shell, the gaps in the spacing scale (no 5 or 7), serif for titles and sans for chrome. A real conflict with one of these is worth raising as a question, not a defect.

**Tag every finding** as one of:
- **Rule**: objectively checkable (contrast ratio, missing label, target under 44px, hardcoded date format). These are defensible.
- **Judgement**: taste or experience ("the primary action competes with the secondary one"). Say why it matters to a reader, and keep the number of these small and the reasoning visible. Don't pad the list.

## Phase 4 — Write the findings

Create `ux-reviews/<page-or-flow>.md` (kebab-case, one file per review; re-reviewing the same page updates the file and keeps the history of what was fixed) and add a row to `ux-reviews/README.md`.

File layout:

```
# UX review — <page or flow>

Reviewed: YYYY-MM-DD · Themes: Paper, Dark · Widths: 375, 1280 · Reader: logged in, has data
Screenshots looked at: <list the states captured>

## Summary
Two or three sentences: the overall impression and the single biggest thing to fix.

## Findings
### 1. <short title> — P2 · S · Rule
**Where:** `ComponentName.tsx:42` / "Shelf header at 375px"
**What:** what a reader sees or what the code does.
**Why it matters:** the effect on a reader.
**Fix:** the specific change, against tokens where it is about look.
**Status:** open

## Looked fine
One line on what was checked and passed, so the next review doesn't redo it.
```

Priorities and sizes match `bugs/`: **P1** a reader can't complete the task or can't perceive/operate something (contrast failure on body text, unlabeled control, keyboard trap); **P2** slows or confuses a reader; **P3** polish. **S** one CSS or copy tweak, **M** one component, **L** several components or a layout change. Order findings by priority, then by size (quick wins first).

## Phase 5 — Hand off

Summarise for the user: the count by priority, the top three, and the quick wins. Then ask which findings to fix. Fixes go through `web-design` (and `new-react-feature` if behaviour changes), one finding or one coherent group at a time. After fixing, **re-capture the same screenshots** and mark the findings `fixed` in the file; add a CHANGELOG line when a batch is done: `- YYYY-MM-DD — UX fixes on <page> → ux-reviews/<file>.md`.

New translatable text from a fix still goes through `t('…')` in all five locale files. When reviewing copy, review it in English first, then spot-check that the longest language (German) doesn't overflow.

## Sources

Criteria condense: WCAG 2.2 AA, Nielsen's 10 usability heuristics, Vercel's Web Interface Guidelines (`vercel-labs/web-interface-guidelines`, snapshot read 2026-10-11, pinned here on purpose rather than fetched at run time), the accessibility chapter of `vercel/components.build`, and a few layout, forms and feedback rules from the 119-row UX guidelines of `nextlevelbuilder/ui-ux-pro-max-skill` (MIT). Rules that assume English or server rendering were dropped or adapted (see the notes in `references/code-checklist.md`).

**Deliberately not used from `ui-ux-pro-max-skill`:** its style, palette, font-pairing and "generate a design system" engine. Argos already has a fixed design system (5 themes, Literata and Public Sans, the token scale), and a generator would pull toward a different look per run. Its stack guides (Tailwind, Vue, Flutter, SwiftUI) don't apply either.
