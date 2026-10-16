# Scoring: heuristics, cognitive load, personas

The detail behind the "Score it" step of the ux-review skill, so scores mean the same thing from one review to the next. Adapted from Impeccable's critique reference (https://github.com/pbakaus/impeccable, commit 6af45ac, Apache License 2.0; see `Argos/THIRD-PARTY-NOTICES.md`).

## Nielsen's 10 heuristics, 0–4 each

Be honest: 4 means genuinely excellent, not "good enough". Most real screens land at 20–32 of 40.

| # | Heuristic | Check for | 0 | 2 | 4 |
|---|---|---|---|---|---|
| 1 | Visibility of system status | loading indicators, confirmation of actions (save, follow, log), progress in multi-step flows (import), where you are (active nav, tabs), inline validation | no feedback, guessing | some states shown, big gaps | every action confirms, progress always visible |
| 2 | Match with the real world | readers' words (no "work", "log entry"), natural order, recognisable icons | code jargon | mixed | speaks the reader's language throughout |
| 3 | User control and freedom | undo, cancel on forms and modals, a way back, clearing filters and search, leaving long flows | trapped, must refresh | main flows have exits, edges don't | undo, cancel, back and escape everywhere |
| 4 | Consistency and standards | same words, same results, platform conventions, same components and spacing | feels like several products | main flows match, details diverge | one cohesive, predictable system |
| 5 | Error prevention | confirmation before destructive actions, constraints (pickers), smart defaults, clear labels, drafts kept | errors easy, no guardrails | common errors caught | errors nearly impossible |
| 6 | Recognition over recall | visible options, contextual hints, recent items, suggestions, labelled icons | must memorise paths | main actions visible, rest hidden | everything discoverable |
| 7 | Flexibility and efficiency | keyboard shortcuts, bulk actions (import, lists), recent/favourites, power paths that don't burden beginners | one rigid path | basic keyboard support | many paths, power features |
| 8 | Aesthetic and minimalist design | only what's needed per step, clear hierarchy, purposeful colour, no clutter | everything competes | main content clear, edges noisy | every element earns its place |
| 9 | Error recovery | plain-language errors, the specific problem, a fix, shown near the source, input kept | codes or nothing | names the problem, not the fix | pinpoints, suggests, keeps work |
| 10 | Help and documentation | contextual hints, task-focused help, easy to reach | none | basic help, not contextual | the right hint at the right moment |

1 and 3 sit between: 1 = mostly failing, 3 = good with minor gaps.

**Bands (of 40):** 36–40 excellent (polish only), 28–35 good (fix the weak areas), 20–27 acceptable (significant work before readers are happy), 12–19 poor (major overhaul), 0–11 critical. With heuristics marked n/a, use the percentage: 90%+ excellent, 70%+ good, 50%+ acceptable, 30%+ poor.

**Severity:** P1 blocks a task or fails WCAG AA (our P1 covers Impeccable's P0 and P1), P2 slows or confuses with a workaround, P3 polish. Unsure? "Would a reader write to us about this?" If yes, at least P2.

## Cognitive load

Three kinds: **intrinsic** (the task itself: structure it with steps, defaults, progressive disclosure), **extraneous** (bad design: remove it ruthlessly), **germane** (learning that leads to mastery: support it with consistent patterns and feedback).

**The 8 checks** (count the failures: 0–1 low, 2–3 moderate, 4+ high):
1. **Single focus:** the main task without competing distractions.
2. **Chunking:** groups of at most 4 items.
3. **Grouping:** related items visibly together.
4. **Hierarchy:** the most important thing is obvious at once.
5. **One thing at a time:** one decision before the next.
6. **Minimal choices:** at most 4 visible options at a decision point.
7. **Working memory:** nothing to remember from a previous screen.
8. **Progressive disclosure:** complexity only when needed.

**Working memory rule:** people hold about 4 things at once. ≤ 4 options fine, 5–7 group them, 8+ overloaded. In practice: 1 primary action and 1–2 secondary, the rest in a menu; ≤ 5 top-level navigation items per group; one reading path in long text with related links gathered at the end.

**Named violations** (use the name in findings): the Wall of Options, the Memory Bridge (remember step 1 at step 3), the Hidden Navigation (no "you are here"), the Jargon Barrier, the Visual Noise Floor (everything the same weight), the Inconsistent Pattern, the Multi-Task Demand (read + decide + navigate at once), the Context Switch (jumping between screens for one decision).

## Personas

Pick 2–3 that fit the screen and walk the main task as each. Red flags must name the exact element.

- **Alex, impatient power user** (logs every day, has 800 books): skips onboarding, wants keyboard paths and bulk actions, hates slow animations and needless confirmations. Can Alex log a book in under 60 seconds? Esc closes modals?
- **Jordan, confused first-timer** (just signed up, never used Goodreads): reads everything, hesitates, takes labels literally. Is the first action clear within 5 seconds? Icons labelled? Clear success after an action?
- **Sam, screen-reader and keyboard user** (NVDA, zoom to 200%): tabs linearly, relies on headings and labels, can't see hover or colour-only states. Whole flow by keyboard? Focus visible? State changes announced?
- **Riley, stress tester:** 0 and 2,000 books, 200-character titles, emoji and RTL, refresh mid-flow, two tabs. Does anything silently fail or lose data?
- **Casey, distracted phone reader** (one hand, interrupted, slow network): thumb reach, state kept after switching apps, works on 3G, 44px targets.

**Winged Words readers** (from PRODUCT.md; extend only from confirmed product facts):
- **Lucía, the quick logger** (reads in Spanish, on her phone): wants to log, rate and leave. Does the Spanish UI fit? Is logging two or three taps from anywhere?
- **Marta, the reviewer and writer** (desktop, long reviews and quotes): cares about a calm page to read and write on. Is the reading measure comfortable? Are drafts safe?
- **Tomás, the social reader** (follows twenty friends): checks the Feed and friends' shelves. Can he see who read what, and react, without noise? Are private and blocked people handled without leaking anything?

| Screen | Personas |
|---|---|
| Landing, invite, sign-up | Jordan, Casey, Riley |
| Shelves, journal, stats | Alex, Lucía, Sam |
| Book page, author page, reviews, writings | Marta, Jordan, Sam |
| Feed, people, clubs | Tomás, Casey, Sam |
| Log form, import, settings | Jordan, Sam, Riley |
