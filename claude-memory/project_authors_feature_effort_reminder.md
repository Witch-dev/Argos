---
name: project-authors-feature-effort-reminder
description: "Authors feature (specs/authors.md): remind the user to switch to high effort for the Phase 1 migration + backfill, and for Phase 2 privacy endpoints"
metadata:
  node_type: memory
  type: project
  originSessionId: c50f4134-4cc5-4bd1-b447-c7ecc4b56d36
  modified: 2026-10-16T01:23:50.808Z
---

Authors feature plan agreed 2026-10-15: four phases (1 Foundation, 2 Find and personalise, 3 Follow, 4 Extras); verified authors go in FUTURE-IDEAS.md.

**Why:** the user asked to be reminded to use high effort for the Phase 1 migration and backfill (hard to undo on a live database). Phase 2's "your history / friends who read this" endpoints also deserve high effort and an argos-security review, since a mistake could leak private shelves.

**How to apply:** before starting the Phase 1 migration/backfill task, say in one line "this is the migration + backfill: switch to high effort". Same before the Phase 2 privacy-sensitive endpoints. Everything else in the feature is fine at medium. Status 2026-10-16: Phases 1–3 built and reviewed, so the high-effort steps are done; Phase 4 (favourites, quotes) is medium. See [[feedback-suggest-model-effort]].
