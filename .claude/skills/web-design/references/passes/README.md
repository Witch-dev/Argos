# Design passes

A pass is a focused piece of design work with one goal, run on a named target ("bolder on the profile header", "harden the import page"). Ask for one with `/web-design <pass> <target>`. Each file says what the pass is for, how to run it, what to avoid and how to check it. Every pass starts with the web-design skill's "Start here" (PRODUCT.md, DESIGN.md) and ends with its critique round; most then hand off to `polish`.

Adapted from Impeccable (https://github.com/pbakaus/impeccable, commit 6af45ac, 2026-10-16, Apache License 2.0) for Winged Words: its commands are rewritten as passes that use our tokens, skills and repos. See `Argos/THIRD-PARTY-NOTICES.md`.

| Pass | Use when | File |
|---|---|---|
| `shape` | Before building something new: find out what it is for and write a short brief, no code | `../shape.md` |
| `bolder` | One part reads flat or safe next to the rest | `bolder.md` |
| `quieter` | Something is too loud, busy or saturated | `quieter.md` |
| `distill` | A screen is cluttered: too many elements, options or words | `distill.md` |
| `clarify` | Labels, errors, empty states or help text are unclear | `clarify.md` |
| `layout` | Spacing, grouping, rhythm or reading order is off | `layout.md` |
| `typeset` | Type hierarchy, sizes, measure or fonts need work | `typeset.md` |
| `colorize` | A screen is grey or monotone; colour has no job | `colorize.md` |
| `animate` | Something should move (feedback, state, the shelf moment) | `animate.md` |
| `delight` | A moment deserves personality (first use, finishing a book, the yearly goal) | `delight.md` |
| `onboard` | First visit, empty states, first success | `onboard.md` |
| `harden` | Make it survive real data: long names, errors, slow network, German, zoom | `harden.md` |
| `adapt` | Rethink it for phone, tablet or a wide screen | `adapt.md` |
| `optimize` | It is slow, janky or shifts while loading | `optimize.md` |
| `extract` | The same pattern exists 3+ times: make it a shared piece or token | `extract.md` |
| `overdrive` | Rare: one interaction should be extraordinary. Propose 2–3 directions first | `overdrive.md` |
| `polish` | The final pass before calling something done | `polish.md` |

**With no pass named** (`/web-design` on its own, or "what should we work on?"), suggest the 2–3 passes with the most value, each with one line of evidence: open findings in `ux-reviews/` (P1/P2 first → `polish`), the low scores in a review's Scores section (low "aesthetic" → `bolder`/`distill`, low "error recovery" → `harden`/`clarify`), files changed on the current branch, or the next unticked page of `specs/shelf-design-refresh.md`. Never start a pass the user didn't confirm.

**Two passes fit?** Ask once. A request in plain words maps like this: "stronger, punchier" → bolder; "calmer, softer" → quieter; "simpler, cleaner" → distill; "wording, labels, errors" → clarify; "spacing, alignment" → layout; "fonts, text" → typeset; "colour" → colorize; "movement" → animate; "fun, personality" → delight; "phone, tablet" → adapt; "slow" → optimize; "edge cases, errors" → harden; "finish it" → polish.
