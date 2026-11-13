---
name: apollon-ci-and-pushing
description: Apollon has GitHub Actions CI (green since 2026-10-06); commit+push after each finished piece so CI runs and work is backed up
metadata:
  node_type: memory
  type: project
  originSessionId: d672d71a-85f6-449a-93e2-a507aad87e7d
  modified: 2026-11-13T20:01:35.902Z
---

Apollon has GitHub Actions CI (`.github/workflows/ci.yml`). The first run passed on 2026-10-06 (commit d0e257e). Before that commit, 8 days of work (758 files) had never been committed.

**Why:** CI only runs on push, and unpushed work isn't backed up. The user hadn't pushed "in a while" before CI was added.

**How to apply:** after finishing a piece of work, offer to commit and push it to `main`. Since 2026-11-13 `gh` is installed and logged in, so after a push I can check CI myself (`gh run list`, `gh run view <id> --log-failed` from the Apollon folder) instead of asking the user to look at the Actions tab. The user knows Bamboo from work, so comparing to it helps explain CI/CD. See [[project-apollon-repo-split]].
