---
name: feedback-token-efficiency
description: "User wants token use kept low: do small work directly instead of via subagents; agent models are Sonnet except argos-security on Opus; the orchestrator was retired"
metadata:
  type: feedback
---

On 2026-10-06 the user asked to cut token use and approved these rules:

- **Subagents only for big multi-part work.** Do bug fixes, small features and single-area changes directly. Use backend-dev/frontend-dev only for a full spec phase that touches both backend and frontend, or when the user names an agent. The main session plans and delegates itself: the `orchestrator` agent was removed on 2026-10-07, because it added a second Opus layer that started cold and re-read the spec. Phase reviews from [[feedback-review-after-each-phase]] still count as requested.
- **Models (set in `Argos/.claude/agents/*.md` frontmatter):** Opus for `argos-security` (renamed from `security-review` on 2026-10-07, so it isn't confused with the built-in `/security-review` command); planning happens in the main Opus session. Sonnet for `backend-dev`, `frontend-dev`, `tester` and `reviewer`. The user's words: "only planning and security should use Opus".
- **Don't make agents read all of SPEC.md.** Agent files now say to open only the sections they need. When delegating, put the relevant facts in the handoff so the subagent doesn't re-read them.
- **Changelog:** one line per change, see [[feedback-maintain-changelog]].

**Why:** A subagent starts cold and re-reads SPEC.md (~8k tokens) plus code, and the old 134 KB changelog cost ~34k tokens every time it was read to add one entry.

**How to apply:** Before launching an agent, ask "could I do this directly with the context I already have?" If yes, do it.
