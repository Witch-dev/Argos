---
name: feedback-handoff-prompt-new-session
description: "At the end of a finished task, spec phase or roadmap stage, give the user a short ready-to-paste prompt to continue in a fresh session"
metadata:
  type: feedback
---

When a task, a spec phase or a roadmap stage is finished (built, reviewed, logged in the changelog, committed), end the reply with a short prompt the user can paste into a new session to continue.

**Why:** the user starts a new session after each finished piece to keep token use low and avoid stale context (asked 2026-10-07). Every message in a long session re-sends the whole history, while a fresh session reads the current files.

**How to apply:**
- Only at real stopping points. Not mid-phase, and not while review findings are still being fixed.
- Keep it to 2–4 lines in a code block. Name the next piece of work by file (e.g. "Accounts Phase 4 in `specs/account-system.md`", or "the next unticked box in `ROADMAP.md`"). Don't restate what `CLAUDE.md`, the spec or memory already say.
- Include only what isn't written down anywhere yet: unpushed commits, a pending API restart, a decision the user still owes.
- Add the suggested model/effort for that next task ([[feedback-suggest-model-effort]]).
- Before giving it, make sure the state it relies on is saved: spec ticked, changelog line, bug files ([[feedback-maintain-changelog]], [[feedback-bug-files]]).
