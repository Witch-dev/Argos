---
name: feedback-maintain-changelog
description: "Argos/CHANGELOG.md gets one line per real change/fix (backend, frontend or planning), pointing to where the detail lives; add it when the work is finished, don't wait to be asked"
metadata:
  type: feedback
---

`Argos/CHANGELOG.md` is the one place to answer "have we hit this before, and when?" across both repos (Apollon code and Argos planning). The user asked for it on 2026-09-27 and confirmed on 2026-10-07 to keep it.

**Format (since 2026-10-07):** one line per change, newest first, under the current month's heading: `- YYYY-MM-DD — What changed → where the detail is`. The pointer is the spec (features), the bug file (bugs), another planning file, or `Apollon <short hash>` for a small fix with no other record, in which case that commit message carries the detail. No paragraphs in the changelog.

**Why:** the old 2–4 sentence entries repeated what the spec, bug file or commit already said, so the file kept outgrowing its 30 KB limit (a busy day was ~15 KB) and needed constant archiving. One-liners keep a busy day around 2 KB, so no rolling window or archiving is needed. The old paragraphs are kept in `changelog/2026-09.md` and `changelog/2026-10.md`; the user didn't want old entries to "not exist".

**How to apply:** after finishing any non-trivial change or fix (not typos), in the same turn, read only the top ~15 lines of the file and add the line at the top of the current month (start a new `## Month YYYY` heading when the month changes). Make sure the detail exists where the line points: update the spec's progress notes, the bug file, or write a descriptive Apollon commit message. Related: [[feedback-bug-files]], [[feedback-token-efficiency]].
