---
name: project-live-incidents-log
description: "Live-site incidents (Render alerts, outages) are written up in Argos/DEPLOY.md \"Incidents on the live site\"; read it first when a new alert comes in"
metadata:
  node_type: memory
  type: project
  originSessionId: 43c1c928-7ac9-40cb-af6f-6de726f3e5fc
  modified: 2026-10-26T18:27:47.550Z
---

Incidents on the live site (Render alerts, outages, freezes) are recorded in `Argos/DEPLOY.md` under "Incidents on the live site", newest first: what happened, what the logs showed, the decisions made.

First entry, 2026-10-26: the API froze for a minute and Render's health check restarted it. The cause wasn't proven (free database or memory). The user decided to keep `/health` checking the database (no light `/health/live`) and to keep the import worker's 2-second check. Routine EF query logs were hidden in production (Apollon 3ba87d8).

**Why:** so a repeat alert starts from what was already found and decided, not from scratch.

**How to apply:** when the user pastes a Render alert or log, read that section first and check Metrics → Memory. Add a new entry for each incident, and a CHANGELOG line pointing to it. Related: [[project-render-db-paid-plan]]
