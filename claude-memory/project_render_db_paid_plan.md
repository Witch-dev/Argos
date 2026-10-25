---
name: project-render-db-paid-plan
description: "Render free Postgres (wingedwords-db, live since 2026-10-13) is deleted ~2026-11-12; user plans to move to paid plan first week of Nov 2026"
metadata:
  node_type: memory
  type: project
  originSessionId: c6b3aa6c-0698-41e4-b6d6-20b39190864e
  modified: 2026-10-25T15:28:47.938Z
---

The live database `wingedwords-db` is on Render's free Postgres plan, which deletes it 30 days after creation (live since 2026-10-13, so around 2026-11-12). On 2026-10-25 the user said they'll move it to the paid plan (~$6–7/month, includes backups) in the first week of November 2026.

**Why:** losing it would wipe every live reader's data; the free plan also has no backups.

**How to apply:** if a session happens between 2026-11-01 and 2026-11-12 and nobody has confirmed the move, remind the user. After the move, the ROADMAP still asks for one real test restore into a scratch database. The user browses the live DB with Microsoft's PostgreSQL extension in VS Code (connection "Winged Words LIVE"). Related: [[project-argos-launch-roadmap]]
