---
name: ux-review
description: Use to audit how an Argos screen looks and reads, without changing it — word placement, hierarchy, spacing, text sizes, menus, clarity of options and labels, accessibility, states. Triggers on "/ux-review", "review the UX of X", "is X clear / well laid out", "does X need more space", "audit the design of X", "check the menus". Produces a ranked findings file in `ux-reviews/`; the fixes are then done with the `web-design` skill. Not for building or restyling (that is `web-design`) and not for bugs in behaviour (that is `bugs/`).
---

# Argos UX review

Judges whether a screen is *good*: is it clear what to read first, is there enough room, are the sizes right, do the menus and options make sense. `web-design` builds consistently with the tokens; this skill checks the result and writes down what to fix. **It never edits the app.** Reviewing and fixing are separate jobs, and the user often wants the review alone.

Two modes: **critique** (the default: how it looks, reads and works, scored with Nielsen /40, cognitive load and personas; `references/scoring.md` has the scoring guide, persona list including Winged Words' own readers, and the named cognitive-load violations) and **audit** ("/ux-review audit <area>": technical quality scored /20 across accessibility, performance, theming, responsive and implementation integrity; `references/audit.md`). Both write to `ux-reviews/`, both never edit the app.

A critique has two passes, because they find different things:

- **Visual pass**: look at real screenshots (hierarchy, spacing, sizes, menus, labels). Criteria in `references/visual-checklist.md`.
- **Code pass**: read the page's component files for rules a screenshot can't show (keyboard, focus, forms, live regions, motion, `Intl`). Criteria in `references/code-checklist.md`.

## Phase 0 — Context

Read `C:/Users/jramo/Argos/PRODUCT.md` (who the readers are, how it should feel) and `C:/Users/jramo/Argos/DESIGN.md` (the target look, motion, the quality floor and what is deliberate). The review judges the screen against these, not against generic taste. Check `specs/shelf-design-refresh.md` for which phases are built: a page whose phase isn't built yet still has the old look, and that alone isn't a finding (note it once in the summary).

## Phase 1 — Scope

Pin down, asking the user only if unclear:
1. **What:** one page, one component (menu, modal), or a flow (e.g. "add a book to a shelf")?
2. **Who is looking:** logged in or logged out, and a reader with data or a brand-new one (empty states matter as much as full ones).
3. **Defaults:** Paper and Dark, at ~375px and ~1280px. Add Sepia when the page is colour-heavy. The 1100px rail breakpoint matters for any page with the right rail.

## Phase 2 — Capture

Use the `browser-check` skill (side ports, Playwright, seeded readers). For plain page captures use `node C:/Users/jramo/Argos/scripts/shoot.mjs <route…> --out <scratchpad>/shots --final` (Paper and Dark at 1280 and 375; without `--final` only Paper at 1280, and `--clip <selector>` shoots one component); write your own Playwright script only for states that need clicks or seeded data. Take screenshots into the scratchpad and **look at each one** with Read; don't review from the CSS alone.

**Motion:** for anything that animates, record a short video or take frames at 0 / 50 / 100% of the duration, and capture it again with `reducedMotion: 'reduce'`.

**Use viewport screenshots at a real first-view size (e.g. 1366×768, 1280×800, 375×700) for every layout judgement.** `fullPage` screenshots resize the viewport, so sticky sidebars and `100vh` layouts look wrong in them; use `fullPage` only to check content order. Also sweep the header and any shared chrome across a range of widths (1280 down to 320) with measured bounding boxes, since collisions hide between the standard breakpoints.

Capture, for each page: the normal state, the empty state, the loading state if it can be caught, an error state if reachable, and long content (a very long title or username, a review at its maximum length). Then do one keyboard pass: Tab through the page and note where focus goes and whether it is always visible.

## Phase 3 — Review

1. Walk `references/visual-checklist.md` against the screenshots.
2. Walk `references/code-checklist.md` against the page's `.tsx` and `.module.css` files (find them from the route, then follow imports one level).
3. For anything involving colour, spacing or size, **phrase the finding against the Argos tokens** (`--space-*`, `--text-muted`, `--radius`; see `.claude/skills/web-design/references/design-tokens.md`): "the gap between the title and the byline is `--space-1`, the section gap is `--space-2`, so they read as one block; use `--space-4` between sections". Never "needs more space" alone.

4. **Score it** (adapted from Impeccable's critique, Apache 2.0; the full 0–4 tables, personas and violations are in `references/scoring.md`, use them so scores stay comparable):
   - **Nielsen's 10 heuristics, 0–4 each** (4 = genuinely excellent; most real screens land at 20–32 of 40): visibility of status, match with the real world, user control, consistency, error prevention, recognition over recall, flexibility, aesthetic and minimalist design, error recovery, help. Mark one n/a when it truly can't apply and give a percentage instead. Bands: 36–40 excellent, 28–35 good, 20–27 acceptable, 12–19 poor, below that critical.
   - **Cognitive load, 8 checks** (one focus; chunks of at most 4; related things grouped; clear hierarchy; one decision at a time; at most 4 visible options per choice; nothing to remember between steps; detail revealed progressively). 0–1 failures low, 2–3 moderate, 4+ high.
   - **2–3 personas** that fit the screen: a first-timer, a power user (logs every day), a screen-reader user, a distracted reader on a phone, a stress tester (long names, 500 books, slow network). Each red flag names the exact element that fails them.
   - **Specificity:** could an unrelated product use this screen or block unchanged? If yes, that's a Judgement finding: say what would make it Winged Words (DESIGN.md: the shelf, the type, people with names).
   - **Motion** (DESIGN.md "Motion"): does each animation have a job; durations from the table; reduced motion keeps the meaning; anything static that should acknowledge an action (a like, a follow, a save) is a finding too.

**Judge by Argos's own conventions, not generic taste.** What DESIGN.md lists under "What is deliberate" (the cream page, serif display type, the shelf) is never a finding, and neither are the 5.5rem header, the centred 3-column shell or the gaps in the spacing scale (no 5 or 7). A real conflict with one of these is worth raising as a question, not a defect.

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

## Scores
Nielsen: NN/40 (band) — one line per heuristic scored below 3, saying why. Cognitive load: low/moderate/high (which checks failed). Personas: who was considered. Specificity: one line. Re-reviews keep the earlier score beside the new one, so the trend shows.

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

Summarise for the user: the scores, the count by priority, the top three, and the quick wins. Recommend the passes that fit (`polish` for a list of P1/P2 findings, `bolder`/`distill` for a low "aesthetic" score, `harden`/`clarify` for low error scores; `web-design/references/passes/`), and end with 2–4 targeted questions tied to specific findings, each with 2–3 options (or say why questions were skipped, only when there are fewer than three priority findings). Then ask which findings to fix. Fixes go through `web-design` (and `new-react-feature` if behaviour changes), one finding or one coherent group at a time. After fixing, **re-capture the same screenshots** and mark the findings `fixed` in the file; add a CHANGELOG line when a batch is done: `- YYYY-MM-DD — UX fixes on <page> → ux-reviews/<file>.md`.

New translatable text from a fix still goes through `t('…')` in all five locale files. When reviewing copy, review it in English first, then spot-check that the longest language (German) doesn't overflow.

## Sources

Criteria condense: Impeccable's critique rubric and quality floor (`pbakaus/impeccable`, Apache 2.0, read 2026-10-16: Nielsen scoring, cognitive-load checks, personas, the specificity question, motion rules), WCAG 2.2 AA, Nielsen's 10 usability heuristics, Vercel's Web Interface Guidelines (`vercel-labs/web-interface-guidelines`, snapshot read 2026-10-11, pinned here on purpose rather than fetched at run time), the accessibility chapter of `vercel/components.build`, and a few layout, forms and feedback rules from the 119-row UX guidelines of `nextlevelbuilder/ui-ux-pro-max-skill` (MIT). Rules that assume English or server rendering were dropped or adapted (see the notes in `references/code-checklist.md`).

**Deliberately not used from `ui-ux-pro-max-skill`:** its style, palette, font-pairing and "generate a design system" engine. Argos already has a fixed design system (5 themes, Literata and Public Sans, the token scale), and a generator would pull toward a different look per run. Its stack guides (Tailwind, Vue, Flutter, SwiftUI) don't apply either.
