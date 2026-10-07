---
name: project-apollon-repo-split
description: "Code lives in C:\Users\jramo\Apollon (git); C:\Users\jramo\Argos is the separate planning repo holding specs, docs and the .claude agents/skills; no shared tooling"
metadata:
  type: project
---

`C:\Users\jramo\Argos` holds the planning and the Claude tooling: `CLAUDE.md`, `SPEC.md`, `ROADMAP.md`, `specs/`, `bugs/`, `CHANGELOG.md`, and `.claude/agents` + `.claude/skills`. The application code (solution and namespaces still named `Argos.*`) is in the separate git repo `C:\Users\jramo\Apollon`. Both are private GitHub repos under `Witch-dev`.

**Why:** the user deliberately keeps the code repo apart from "the agentic solution", and chose "no shared tooling": the agents and skills are not copied into Apollon.

**How to apply:** the custom agents and skills only load in an Argos-rooted session, so work from Argos and reach the code by absolute path. Commit the two repos separately. The shared facts (paths, Release builds, translations) are in `Argos/CLAUDE.md`; keep them there rather than in memory.
