---
name: parallel-sessions-test-db
description: "Two Claude sessions running Apollon's tests at once break each other (shared argos_test DB), and a session's commit can sweep in another's half-done files"
metadata:
  node_type: memory
  type: project
  originSessionId: f63f96d0-8342-488e-bbcd-4a8fd3c15297
  modified: 2026-10-11T15:29:37.114Z
---

Apollon's integration tests all use one Postgres database, `argos_test`, which `ApiFactory` drops and re-creates at the start of each run. When another Claude session runs the suite at the same time, dozens of tests fail with "database argos_test does not exist" or missing tables. That is a collision, not a bug.

**Why:** On 2026-10-11 the proxy work and an account-deletion session ran tests together, and the failures looked like real regressions. The same day, each session's commit picked up the other's unfinished files (one pushed commit didn't compile). Both happened because the two sessions shared one working tree.

**How to apply:**
- To check your own changes while another session is active, export the index (`git checkout-index -a --prefix=<scratch>/`).
- In that scratch copy only, point `ApiFactory`'s connection string at a private database (e.g. `argos_test_proxy`), then build and test there.
- Just before committing, re-check `git diff --cached` per file. Another session can edit a file between your check and your commit.

Related: [[apollon-repo-split]], [[apollon-ci-and-pushing]].
