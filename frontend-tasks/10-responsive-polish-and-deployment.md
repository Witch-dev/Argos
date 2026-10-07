# 10 — Responsive Polish & Deployment Readiness

**Status:** ✅ Done

## Scope

Maps to SPEC.md §9 Phase 6.

- Responsive pass across every page built in tasks 03–08: mobile nav (collapsed menu), grid layouts that reflow (search results, shelves, feed), touch-friendly tap targets for star ratings and reorder controls.
- Loading/error/empty states audited across the app for consistency (one shared pattern, not ad hoc per page).
- Production build config: confirm `VITE_API_BASE_URL` is environment-swappable at build/deploy time without code changes (mirrors the backend's "same image, different connection string" principle from `backend-tasks/16`).
- `Dockerfile` for the frontend (static build served via nginx or similar) if the deployment target ends up containerized, matching the backend's existing `Dockerfile`/`docker-compose.yml` pattern — otherwise whatever the chosen static host needs (SPEC.md §10 leaves hosting provider as an open decision).
- Basic accessibility pass: semantic HTML, alt text on covers, keyboard-navigable forms and nav.

## Depends on

Tasks 01–09 substantially complete — this is the final pass before closed beta per SPEC.md §9 Phase 6.

## Progress

**Done.** In build order:

1. **Mobile nav**: `NavBar` now has a real hamburger toggle below 640px (`aria-expanded`/`aria-controls`, ✕/☰ glyph) — the links panel collapses behind it instead of just wrapping, and every link closes the menu on click so it doesn't stay open after navigating.
2. **Loading/error/empty state consistency**: new `LoadingMessage`/`ErrorMessage`/`EmptyMessage` in `src/components/StateMessage.tsx`, swept into every page that had its own ad hoc `<p>Loading…</p>` / `<p role="alert">` / empty-state text (`SearchPage`, `PeoplePage`, `BookDetailPage`, `ProfilePage`, `FeedPage`, `ListsPage`, `ListDetailPage`, `ProtectedRoute`) — same rendered text everywhere (existing tests from task 09 still pass unchanged), just one shared visual language instead of five slightly different ones.
3. **Grid/layout responsiveness**: mostly already in place from earlier tasks (`BookGrid`'s `auto-fill` grid, `BookDetailPage`'s single-column collapse under 640px, flex-wrap throughout) — confirmed rather than rebuilt.
4. **Runtime-configurable API base URL** (the actual point of "one image, any environment" — SPEC.md §9 Phase 6 / the same principle `backend-tasks/16` established): Vite env vars are baked in at *build* time, which doesn't fit that principle on its own. Added a small runtime-config pattern instead — `public/config.js` (default, checked in) sets `window.__ARGOS_CONFIG__.apiBaseUrl`, `src/api/client.ts` now prefers that over `import.meta.env.VITE_API_BASE_URL` (which stays as the plain-`npm run dev` fallback), and `docker/entrypoint.sh` regenerates `config.js` from an `API_BASE_URL` container env var at *startup* before nginx starts. Verified by actually building the image and running it with a custom `API_BASE_URL` — `config.js` reflected it correctly.
5. **Frontend `Dockerfile`** (multi-stage: `node:22-alpine` build → `nginx:1.27-alpine` runtime serving `dist/`), `nginx.conf` (SPA fallback: `try_files $uri $uri/ /index.html`, required for React Router's deep links to work on a real refresh), `.dockerignore`. Added a `web` service to the root `docker-compose.yml` so `docker compose up` brings up the full stack (Postgres + API + frontend). Verified live: built the image, ran it, confirmed the SPA fallback returns 200 for a deep link (`/books/OL1W`) and `config.js` picks up the env var.
6. **Backend correctness fix required for #4/#5 to actually work together**: the CORS policy from task 01 was hardcoded to one dev origin and gated behind `IsDevelopment()` — which would've silently broken the docker-compose scenario, where `ASPNETCORE_ENVIRONMENT=Production`. Made it configurable (`Cors:AllowedOrigins`, defaulting to `http://localhost:5173`) and applied in every environment; `docker-compose.yml`'s `api` service now sets `Cors__AllowedOrigins__0` to match wherever `web` is actually served. Confirmed both scenarios live: the local dev server (`localhost:5173` → `localhost:5258`, using the default) and the compose scenario (same origin, explicit config) both get a correct `Access-Control-Allow-Origin` header. All 29 backend tests still pass.
7. **Accessibity pass**: alt text was already correct everywhere images can appear (`BookCover`, `Avatar` — both have real fallback semantics, not just missing tags), every form field already had a real `<label htmlFor>` (tasks 04/05/08), nav is keyboard-reachable (real `<button>`/`<a>` elements throughout, no click-handler-on-div patterns). No dedicated a11y tooling (axe, etc.) was added — this was a manual review against what's already there, not an automated audit.

Verified: `npm run build` + `npm run lint` + `npm test` (19/19) all clean after every change in this task. Docker image build and container run both verified for real (see #4/#5), not just written. Not visually confirmed at actual phone width in a real browser (no browser tool this session) — worth a manual resize check, especially the new hamburger menu's open/close animation-free toggle.
