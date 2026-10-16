---
name: feedback-review-after-each-phase
description: "Run the reviewer agent at the end of every Argos spec phase (argos-security only when the phase touches auth/input/privacy/external APIs), without asking first"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d7d9384b-7136-4d0f-81d8-72418d65327f
  modified: 2026-10-03T14:16:24.952Z
---

When an Argos spec is built in phases, run the `reviewer` agent at the end of each phase, plus `argos-security` in parallel when the phase touches auth, user input reaching the server, privacy/visibility rules or an external API (see the update below). Run them in the background, then fix what they find before moving on. Don't ask first, and don't wait until the whole spec is done. The user said "run it at the end of the phases" on 2026-10-03, after Find readers Phases 2–3 shipped without a review pass.

**Why:** The user wants each phase checked as it lands. In Phase 1 of `specs/find-readers-discovery.md` the review caught real issues (stale caches, race conditions, a privacy question about blocking) that were cheap to fix right away.

**How to apply:** At the end of a phase, after the tests pass and the live browser check, start the agents with the phase's changed files and the spec sections. Then fix the clear-cut findings, ask the user about the product decisions, and record the pass in the spec's verification checklist and the changelog. This is an explicit standing request, so it counts as the user asking for subagents. Related: [[feedback-feature-spec-workflow]], [[feedback-maintain-changelog]].

**Update 2026-10-06 (token savings):** `reviewer` still runs every phase. `argos-security` runs only when the phase touches auth, user input reaching the server, privacy/visibility rules, or an external API call. Skip it for UI-only or styling phases. See [[feedback-token-efficiency]].

**Update 2026-10-16 (design):** for phases or pages with visual changes (the shelf design refresh above all), also run the `design-reviewer` agent after the builder's own screenshot critique round: it gets the `scripts/shoot.mjs` screenshots, the changed files, DESIGN.md and the mockup/brief, and returns ship / fix / rebuild / recapture. Apply its fixes, re-shoot, send it back for the verdict pass. The user asked on 2026-10-16 to adopt as much of Impeccable as possible into the way of working. See [[project-design-restyle-direction]].
