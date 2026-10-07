---
name: feedback-stepwise-approval-workflow
description: "Historical: backend work in Argos/Apollon used to be explain-then-approve step by step. As of 2026-09-28 the user turned this off ('for now on just implement') — default is now direct implementation for both backend and frontend, same as frontend already was."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9d884c6d-0a42-48f2-9d4a-0433d04ce97c
  modified: 2026-09-28T00:43:04.735Z
---

**Current default (as of 2026-09-28): implement directly, no explain-then-wait-for-go-ahead loop, for backend or frontend.** The user explicitly said to stop the stepwise approval workflow ("stop doing the explain-then-approve workflow, for now on just implement") after Claude tried to start a new feature (home dashboard redesign) with it. Claude still writes all the code (the user does not want to type it themselves) — what changed is dropping the pause-and-explain-before-each-step ritual, not who writes the code.

**History, for context:** the workflow used to be — break the task into small steps → explain the next step and why → wait for the user to say go ahead → write that one step → explain what it does → move on. This was requested early on ([[project-argos-backend-learning-path]]) so the user could oversee and learn from each change. The frontend build was already an exception to it from 2026-09-27 onward (built directly, task by task, no pause loop).

**How to apply:** Default to direct implementation — batch reasonable chunks of work, explain briefly as you go or after, don't gate each file edit on approval. If the user asks to slow back down and see steps individually, honor that for the stretch of work they name, but the standing default is now direct implementation until they say otherwise again.
