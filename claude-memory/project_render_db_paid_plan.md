---
name: project-render-db-paid-plan
description: "Live DB wingedwords-db is on Render's PAID Postgres plan since 2026-11-05 (API paid since 2026-10-31); a test restore of a backup is still owed"
metadata:
  node_type: memory
  type: project
  originSessionId: c6b3aa6c-0698-41e4-b6d6-20b39190864e
  modified: 2026-11-05T19:27:41.370Z
---

The live database `wingedwords-db` moved from Render's free Postgres plan to the paid plan on 2026-11-05, the same day it dropped out ("Postgres is not reachable", Render restarted the API on a 503 health check). The API (`wingedwords-api`) has been on the paid Starter plan since 2026-10-31. The free plan's 30-day deletion (due ~2026-11-12) no longer applies, and the paid plan has automatic backups.

**Why:** two database drop-outs in ten days (2026-10-26, 2026-11-05) on the free plan, both with the API code fine; also no backups on free.

**How to apply:** don't remind the user about the upgrade any more. If the database drops out again on the paid plan, start from DEPLOY.md "Incidents on the live site" (2026-11-05 entry): check the DB's Render events, then consider EF retries (21 `BeginTransaction` calls must be wrapped in the execution strategy first) and connection `Keepalive`/`Timeout`. Still open on the ROADMAP: one real test restore into a scratch database. The user browses the live DB with Microsoft's PostgreSQL extension in VS Code (connection "Winged Words LIVE"). Related: [[project-argos-launch-roadmap]], [[project-live-incidents-log]]
