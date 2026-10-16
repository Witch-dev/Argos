---
name: new-react-feature
description: Use when scaffolding, adding, or creating a new frontend feature, page, or component for Argos — triggers on "/new-react-feature", "add a page for X", "scaffold a component for X". Walks through a full vertical slice on the React/TypeScript frontend (types → API client call → React Query hook → component/page) following the conventions in SPEC.md.
---

# New Argos Frontend Feature

Scaffold one frontend feature as a complete vertical slice: **types → API client call → React Query hook → component/page**, matching the conventions in `SPEC.md` (repo root) and the `frontend-dev` agent. Code lives in `C:/Users/jramo/Apollon/web`.

## Phase 1 — Confirm the shape

Before writing anything, pin down (ask the user if unclear):
1. What page/component this is, and what user-visible behavior it needs.
2. Which backend endpoint(s) it calls — if the endpoint doesn't exist yet, use the `new-endpoint` skill first, or get its exact request/response shape so the frontend types match.
3. Whether it's behind auth (redirect unauthenticated users rather than rendering a broken state), and whether it posts something others can read (unconfirmed-email readers get the shared confirmation dialog).
4. Whether it's read-only (query) or mutates data (mutation, needs cache invalidation on success).
5. How it should look and move: read `C:/Users/jramo/Argos/PRODUCT.md` and `C:/Users/jramo/Argos/DESIGN.md` now, not at the end, so the data shape and the design fit each other (a stat needs a label, a person needs a name, a mutation needs visible feedback).

## Phase 2 — Follow existing patterns

Read the existing page/component/hook closest to the new one and match it. Query keys live in `src/api/queryKeys.ts` and types in `src/api/types.ts`. Don't introduce a second state-management approach, data-fetching pattern or styling system.

## Phase 3 — Build the slice

1. **Types**: TypeScript types matching the backend DTO exactly — if the backend contract changes, update these in the same change.
2. **API client**: a typed function for the endpoint, following the existing ones in `src/api/`.
3. **React Query hook**: `useQuery` for reads, `useMutation` for writes — with a key from `queryKeys.ts` and, for mutations, invalidation of every query it affects (e.g. logging a book should invalidate that book's page and the user's profile/shelf).
4. **Text**: every visible string (including `aria-label`, `title`, placeholders, `confirm()` text) through `t('…')`, with the key added to all five `src/locales/<lang>/` files (en, es, pt-BR, de, fr). `locales.test.ts` fails otherwise. See `Argos/specs/languages.md` "Rules for writing keys".
5. **Component/page**: build the UI, handling loading/error/empty states with `StateMessage`'s components — only to the extent this feature needs. Wire it into React Router if it's a new page. **How it looks and moves is the `web-design` skill, always, not optional:** its plan step before you write the markup (shared pieces, hierarchy, one primary action, a motion plan for feedback on mutations: DESIGN.md "Motion"), and its critique round at the end.
6. **Test**: a Vitest + React Testing Library test for the component's key behavior (renders expected data, handles the loading/error case if meaningfully different).

## Phase 4 — Verify

- `npm test`, `npm run build` and `npm run lint` in `web/`.
- If this is a user-visible flow, actually exercise it in a browser (the `browser-check` skill) rather than relying on types/tests alone — a passing typecheck proves the code compiles, not that the feature works.
- Run the `web-design` critique round (`Argos/scripts/shoot.mjs` on the new routes, look, fix once, look again) before calling it done.
