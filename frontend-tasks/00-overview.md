# Argos Frontend — Task List

This folder breaks the Argos frontend (`SPEC.md` at the repo root) into implementation tasks. Unlike `backend-tasks/`, this is **not** a teaching curriculum — the backend build was done step-by-step with explanations because that was the point of that exercise. The frontend is a straight build: each task gets implemented directly, then reviewed together, then we move to the next one.

## Where the code lives

Same split as the backend: this repo (`Argos`) holds specs and task tracking, the actual code lives in `C:\Users\jramo\Apollon` (see [[project_apollon_repo_split]] in memory). The React app goes in a new `web/` folder at the Apollon repo root, alongside `src/` (the API) and `test/`.

## Stack (per SPEC.md §6)

React 19 + TypeScript 5.7 (`strict: true`), Vite 6, React Router 7, TanStack Query 5, Vitest 2 + React Testing Library 16.

## How a task works

1. I implement the task's scope end to end — components, hooks, API calls, routing — against the existing backend endpoints (already built, see `backend-tasks/`).
2. I run it (dev server, and a browser check for anything visual) before calling it done.
3. Optionally run the `reviewer` agent against the diff for anything non-trivial.
4. Update this task's status below, note any real deviations from the plan.
5. Move to the next task.

## Order

Ordered by dependency, not strictly by SPEC.md §9's phase numbering — infrastructure (setup, API client) has to exist before any feature, and auth has to exist before anything that needs a logged-in user, even though book search (Phase 1) is public and could technically come first.

| # | Task | Maps to SPEC.md | Status |
|---|---|---|---|
| 01 | Project setup (Vite + React + TS scaffold, routing skeleton, layout) | §6, §9 Phase 0 | ✅ Done |
| 02 | API client & server-state setup (typed fetch client, React Query, shared DTO types) | §5 | ✅ Done |
| 03 | Book search & detail pages | §4 Phase 1, §9 Phase 1 | ✅ Done |
| 04 | Auth flows (register/login, token storage, protected routes) | §4 Phase 1, §9 Phase 2 | ✅ Done |
| 05 | Logging & ratings (shelve, rate, review, dates) | §4 Phase 1, §9 Phase 3 | ✅ Done |
| 06 | Profile page (avatar/bio, shelves, log history, stats) | §4 Phase 1, §9 Phase 3 | ✅ Done |
| 07 | Social: follow/unfollow, activity feed, user search | §4 Phase 1, §9 Phase 4 | ✅ Done |
| 08 | Lists (create, add/remove/reorder, public list pages) | §4 Phase 1, §9 Phase 5 | ✅ Done |
| 09 | Frontend testing pass (Vitest + RTL for components built so far) | §8 | ✅ Done |
| 10 | Responsive polish & deployment readiness | §9 Phase 6 | ✅ Done |

Each task file (`01-...md` etc.) has its own scope, backend endpoints it depends on, and a `## Progress` section — kept up to date the same way `backend-tasks/` was, so a fresh session can pick up correctly.

**Starting a new session with no memory of prior ones?** Check the table above for the next `⬜ Pending` task, then open that task's file.
