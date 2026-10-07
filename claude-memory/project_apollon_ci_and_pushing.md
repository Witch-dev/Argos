---
name: apollon-ci-and-pushing
description: Apollon has GitHub Actions CI (green since 2026-10-06); commit+push after each finished piece so CI runs and work is backed up
metadata:
  node_type: memory
  type: project
  originSessionId: d672d71a-85f6-449a-93e2-a507aad87e7d
  modified: 2026-10-06T20:48:08.675Z
---

Apollon has GitHub Actions CI (`.github/workflows/ci.yml`). The first run passed on 2026-10-06 (commit d0e257e). Before that commit, 8 days of work (758 files) had never been committed.

**Why:** CI only runs on push, and unpushed work isn't backed up. The user hadn't pushed "in a while" before CI was added.

**How to apply:** after finishing a piece of work, offer to commit and push it to `main`. The repo is private and `gh` isn't installed, so I can't see CI results myself. Ask the user to check github.com/Witch-dev/Apollon/actions, or suggest installing `gh`. The user knows Bamboo from work, so comparing to it helps explain CI/CD. See [[project-apollon-repo-split]].
