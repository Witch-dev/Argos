---
name: feedback-explain-simply-no-assumed-knowledge
description: "Explain technical/software-engineering concepts to this user in plain language, defining terms on first use — do not assume prior knowledge beyond basic code syntax."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9d884c6d-0a42-48f2-9d4a-0433d04ce97c
  modified: 2026-08-14T22:50:04.540Z
---

Explanations of .NET and software-engineering concepts (DI, options pattern, layering, composition roots, etc.) had been pitched too densely — using terms and assuming background the user doesn't have yet. The user is a junior .NET engineer (see [[project-argos-backend-learning-path]]) who knows code syntax but is explicitly *not* yet fluent in the surrounding engineering concepts this curriculum is trying to teach.

**Why:** The user said directly: "it seems like you are taking for granted that I know too much, and that's not the case," after a multi-turn back-and-forth on where a configuration options class should live got too abstract too fast (terms like "composition root," "anti-corruption layer" introduced without enough grounding before being relied on).

**How to apply:** Default to plain language. Define a term in simple words the first time it's used rather than assuming it's known. Prefer small concrete examples over dense multi-concept paragraphs. Introduce one new idea at a time rather than stacking several before checking in. Treat "I don't understand" or a request to simplify as normal and expected, not a sign to compress further next time — if anything, slow down more. This applies broadly to how concepts get explained in this project, not just during code-writing steps (see [[feedback-stepwise-approval-workflow]] for the code-writing process itself).
