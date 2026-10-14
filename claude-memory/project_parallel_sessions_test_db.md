---
name: parallel-sessions-test-db
description: "Two Claude sessions running Apollon's tests at once break each other (shared argos_test DB), and a session's commit can sweep in another's half-done files"
metadata:
  node_type: memory
  type: project
  originSessionId: f63f96d0-8342-488e-bbcd-4a8fd3c15297
  modified: 2026-10-13T19:19:46.457Z
---

Apollon's integration tests all use one Postgres database, `argos_test`, which `ApiFactory` drops and re-creates at the start of each run. When another Claude session runs the suite at the same time, dozens of tests fail with "database argos_test does not exist" or missing tables. That is a collision, not a bug.

**Why:** On 2026-10-11 the proxy work and an account-deletion session ran tests together, and the failures looked like real regressions. The same day, each session's commit picked up the other's unfinished files (one pushed commit didn't compile). Both happened because the two sessions shared one working tree.

**How to apply:**
- To check your own changes while another session is active, export the index (`git checkout-index -a --prefix=<scratch>/`).
- In that scratch copy only, point `ApiFactory`'s connection string at a private database (e.g. `argos_test_proxy`), then build and test there.
- Just before committing, re-check `git diff --cached` per file. Another session can edit a file between your check and your commit.
- When both sessions edited the same file: snapshot the other session's dirty files before you start, build a clean copy (HEAD + only your diff) in a `git worktree add --detach`, test and commit there, then `git update-ref refs/heads/main <commit> <old>` and `git reset -q -- <your files>` in the main tree. Done this way 2026-10-13 (Apollon 8bf7d02).
- **Never junction/symlink `node_modules` into a scratch copy or worktree.** On 2026-10-13 `git worktree remove --force` followed the junction and deleted half of the real `Apollon/web/node_modules` (fixed with `npm install`, lockfile unchanged). Remove the link first (`cmd /c rmdir <link>`), or run `npm ci` in the copy instead.

Related: [[apollon-repo-split]], [[apollon-ci-and-pushing]].
