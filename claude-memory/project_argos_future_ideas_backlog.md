---
name: project-argos-future-ideas-backlog
description: Argos has a FUTURE-IDEAS.md backlog file for capturing feature ideas on the spot without a full spec conversation; drives items into specs/ + SPEC.md only when tackled.
metadata: 
  node_type: memory
  type: project
  modified: 2026-09-30T22:04:31.901Z
  originSessionId: c04daa13-f35f-47d2-89b5-d316e134c344
---

Established 2026-09-30, during the [[writings-and-annotations]] spec conversation: the user wants a low-friction way to say "add this as a future feature" mid-conversation and have it captured without triggering a full clarifying-questions workshop right then.

**Mechanism:** `Argos/FUTURE-IDEAS.md` — a flat, unprioritized bullet list. When the user says "add X as a future feature" (or similar), append one bullet with a short description and the date raised. No design, no clarifying questions, no spec file yet.

**How to apply:** When there's bandwidth to actually tackle an idea from that list, follow [[feedback-feature-spec-workflow]] as normal (ask clarifying questions, write `specs/<feature>.md`), then add it to `ROADMAP.md` (which decides build order, [[project-argos-launch-roadmap]]) and to `SPEC.md` §4's feature list once shipped, and delete the bullet from `FUTURE-IDEAS.md` — it's a scratch pad, not a permanent record once an idea graduates into a real spec.

First entry: account-level privacy settings (public/followers-only/private-to-self, Letterboxd-style) — deferred out of `specs/writings-and-annotations.md` rather than being bolted onto just one content type.
