---
name: feedback-feature-spec-workflow
description: "For new post-MVP Argos features, write one spec file per feature in Argos/specs/ (not separate backend/frontend files), with the task checklist split into Backend/Frontend sub-headings within that one file."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f002c3fb-d7cb-4e78-9dac-15fdcc68832d
  modified: 2026-09-28T00:10:45.122Z
---

Established 2026-09-27 after the user explicitly asked whether backend and frontend should get separate spec/task files, for new feature work on Argos (post-MVP, additive features like live book search fallback and the book news feed — see `specs/live-book-search.md` and `specs/book-news-feed.md`).

**The answer given and accepted:** one spec file per feature in `Argos/specs/`, not split by layer. The task checklist within that file should have explicit `### Backend` / `### Frontend` (and a small `### Verification & docs`) sub-headings, so each side's progress is still scannable without needing two files.

**Why:** A single incremental feature is normally built end-to-end in one sitting — the interesting design decisions (e.g. "don't persist search results, only cache on detail view") span both frontend and backend and are easier to keep coherent in one place. Splitting into separate files made sense for the *original* full build ([[project-argos-backend-learning-path]], [[project-argos-frontend-tasks]]) because those were genuinely separate, multi-week efforts with their own arcs — a fundamentally different scale than a single incremental feature.

**How to apply:** When scoping a new Argos feature, write `Argos/specs/<feature-name>.md` (sections: Problem, Clarifying decisions, Design, Explicitly out of scope, Tasks with Backend/Frontend/Verification sub-headings) — not separate backend/frontend files. Only actually split into two files if a future feature is big enough that backend and frontend work would happen independently (different sessions, or handed to separate agents) — that's the point where the original arc-based pattern would earn its keep again. Also: after implementing, re-read the spec against what was actually built before marking tasks done — one spec drifted from the real implementation (said a library was used that wasn't) and had to be corrected after the fact.
