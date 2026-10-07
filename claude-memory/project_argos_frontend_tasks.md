---
name: project-argos-frontend-tasks
description: "History: Argos's original frontend (React 19 + TS at Apollon/web) was built from Argos/frontend-tasks/ 01-10, all done 2026-09-27; new work follows specs/, not new task files"
metadata:
  type: project
---

The original frontend was built from `Argos/frontend-tasks/` (`00-overview.md` + tasks 01–10), all done on 2026-09-27, directly rather than step by step. Each task file's `## Progress` section records what was built and what was deferred.

**Status:** finished, history only. New frontend work is planned as one spec per feature in `Argos/specs/` ([[feedback-feature-spec-workflow]]), ordered by [[project-argos-launch-roadmap]]. Don't add new `frontend-tasks/` files.

**What carried over:** keep the real stack running and check flows live, not just with a clean `npm run build`. That habit caught a missing CORS policy and broken book links that typechecking couldn't. How to do it now is in the `browser-check` skill.
