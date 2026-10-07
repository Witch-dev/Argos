---
name: new-react-feature
description: Use when scaffolding, adding, or creating a new frontend feature, page, or component for Argos — triggers on "/new-react-feature", "add a page for X", "scaffold a component for X". Walks through a full vertical slice on the React/TypeScript frontend (types → API client call → React Query hook → component/page) following the conventions in SPEC.md.
---

# New Argos Frontend Feature

Scaffold one frontend feature as a complete vertical slice: **types → API client call → React Query hook → component/page**, matching the conventions in `SPEC.md` (repo root) and the `frontend-dev` agent.

## Phase 1 — Confirm the shape

Before writing anything, pin down (ask the user if unclear):
1. What page/component this is, and what user-visible behavior it needs.
2. Which backend endpoint(s) it calls — if the endpoint doesn't exist yet, use the `new-endpoint` skill (or the `backend-dev` agent) first, or get its exact request/response shape from whoever is building it so the frontend types match.
3. Whether it's behind auth (redirect unauthenticated users rather than rendering a broken state).
4. Whether it's read-only (query) or mutates data (mutation, needs cache invalidation on success).

## Phase 2 — Follow existing patterns first

Read an existing page/component/hook in the app as a template before writing a new one. Don't introduce a second state-management approach, a second data-fetching pattern, or a new styling system to solve what an existing pattern already handles. If this is the very first feature in the app (no pattern to follow yet), keep the initial structure minimal — a components/, pages/, hooks/, and api/ split is enough to start.

## Phase 3 — Build the slice

1. **Types**: TypeScript types matching the backend DTO exactly — if the backend contract changes, update these in the same change, don't let them drift.
2. **API client**: a typed function wrapping the `fetch`/HTTP call to the endpoint, attaching the auth token if the route requires it.
3. **React Query hook**: `useQuery` for reads, `useMutation` for writes — with a cache key that's specific enough to avoid collisions and, for mutations, invalidation of the queries it affects (e.g. logging a book should invalidate that book's page and the user's profile/shelf).
4. **Component/page**: build the UI, handling loading/error/empty states — only to the extent this feature needs, not a generic system. Wire it into React Router if it's a new page.
5. **Test**: a Vitest + React Testing Library test for the component's key behavior (renders expected data, handles the loading/error case if meaningfully different).

## Phase 4 — Verify

- Run typecheck/build and the new test.
- If this is a user-visible flow, actually exercise it in the dev server rather than relying on types/tests alone — per this project's verification norm, a passing typecheck proves the code compiles, not that the feature works.
