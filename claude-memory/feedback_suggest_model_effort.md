---
name: feedback-suggest-model-effort
description: "Before starting each task, tell the user in one line whether to keep Opus medium or switch model/effort for it"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3c8537b0-966e-4137-b1e9-f48ebd76f12c
  modified: 2026-10-16T22:18:56.414Z
---

Before starting any task, give the user a one-line suggestion about the main session's model and effort, then start the work. The user switches it themselves with `/model`, because Claude can't change its own model mid-session.

- **Default: Opus, medium.** Planning and normal feature work. Usually just say "Opus medium is fine for this."
- **Raise to high:** a hard bug that resisted a first attempt, or planning a large new spec.
- **Switch to Sonnet:** routine mechanical stretches, like copying text into all 5 locale files, small styling tweaks or simple renames. Remind them to switch back afterwards.
- **Never low** for anything touching security, the database or several files at once.

**Why:** On 2026-10-07 the user asked about the "Opus 5.5 medium" setting and wanted Claude to flag when a task deserves a different one, "before the tasks", as part of keeping token use low. Related: [[feedback-token-efficiency]].

**How to apply:** Keep it to one short line at the start of the reply, not a discussion. If the setting is already right, say so briefly. Don't wait for an answer unless switching matters a lot (e.g. a high-effort bug); otherwise proceed.

**Every time, two places (user reminder 2026-10-16, "you sometimes forget"):**
1. The first line of the reply to every new task, even a small or follow-up one.
2. Inside every handoff prompt for a new session ([[feedback-handoff-prompt-new-session]]), as its own line, e.g. "Model: Opus, effort high for the motion plan, then medium", because the fresh session starts before anyone has suggested a setting.
