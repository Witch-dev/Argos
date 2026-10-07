---
name: feedback-bug-files
description: "Every bug found (not fixed on the spot) gets its own md file in Argos/bugs/, indexed in bugs/README.md by priority (P1-P3) and size (S/M/L)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: faef8876-616a-4d45-a948-eaf81f845c43
  modified: 2026-10-05T01:22:24.306Z
---

Whenever I find a bug that isn't fixed right away — from reviews, live checks, flaky tests, pre-existing problems noticed along the way — write it up as its own file in `C:\Users\jramo\Argos\bugs\` (what happens, why, how to reproduce, suggested fix) and add a row to the Open table in `bugs/README.md` with its priority (P1 soon / P2 next / P3 later) and size (S <1h / M few hours / L a day+). When one gets fixed, move its row to the Fixed table with the date and changelog pointer; keep the file.

**Why:** the user asked (2026-10-05) to keep bugs "so we can tackle them later, classified by how big they are and the priority", instead of scattering them in FUTURE-IDEAS or end-of-turn summaries.

**How to apply:** bugs go in `bugs/`, not `FUTURE-IDEAS.md` (that's for feature ideas). Still log real fixes in the changelog per [[feedback-maintain-changelog]]. Review findings that are accepted rather than fixed after [[feedback-review-after-each-phase]] belong here too.
