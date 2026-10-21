---
name: push-as-own-command
description: Push Apollon with git push as a standalone command; the precheck hook seemed to skip a push chained after a heredoc commit
metadata:
  node_type: memory
  type: feedback
  originSessionId: c60fe7ac-45d8-4355-b960-0dae942572b0
  modified: 2026-10-21T17:15:36.435Z
---

Run `git push` for Apollon as its own Bash command, never chained after a multi-line `git commit -F - <<'EOF'`.

**Why:** 2026-10-21, a push chained after a heredoc commit went out without the precheck hook running (the script's own regex matched; the hook's `if: Bash(*git push*)` filter likely didn't). CI then failed on 6 club tests that the precheck would have caught.

**How to apply:** commit in one call, push in a separate call (`cd C:/Users/jramo/Apollon && git push`). Related: [[project_apollon_ci_and_pushing]].
