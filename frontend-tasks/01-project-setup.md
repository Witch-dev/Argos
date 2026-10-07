# 01 — Project Setup

**Status:** ✅ Done

## Scope

- Scaffold Vite + React 19 + TypeScript 5.7 (`strict: true`) app at `C:\Users\jramo\Apollon\web`.
- ESLint + Prettier config consistent with the rest of the repo's tooling conventions.
- React Router 7 installed, with a route skeleton: `/`, `/search`, `/books/:openLibraryId`, `/login`, `/register`, `/u/:username`, `/feed`, `/lists`, `/lists/:id`.
- Base layout: top nav (logo/home, search box, feed link, profile/login state placeholder), content outlet, minimal global styling (no design system decisions locked in yet beyond "clean, readable, responsive from the start").
- `.env` handling for `VITE_API_BASE_URL` pointing at the local `Argos.Api` (see Apollon's `.env.example` for the pattern already used on the backend side).
- `package.json` scripts: `dev`, `build`, `preview`, `lint`, `test`.
- `.gitignore` entries for `node_modules`, `dist`, `.env.local`.

## Depends on

Nothing — this is the starting point.

## Notes

- Exact versions per SPEC.md §6; re-check for newer patch releases at scaffold time same as the backend did.
- No state management library beyond TanStack Query (task 02) — Query's cache is the server state; local UI state stays in component state/context, no Redux/Zustand unless a real need shows up later.

## Progress

**Done.** Scaffolded at `Apollon/web` via `npm create vite@latest web -- --template react-ts`, then added `react-router-dom@7` and `@tanstack/react-query@5`.

Deviations from the plan, with reasoning:
- **Vite 8 / TS 6.0 / React 19.2**, not the SPEC.md-pinned Vite 6 / TS 5.7 — the scaffold pulled current stable releases. Same "re-check for newer stable at setup time" call the backend made in module 01; going with what's current rather than hand-pinning older majors.
- **ESLint 9→10 + typescript-eslint + Prettier**, not the scaffold's default `oxlint` — swapped it out for the more established/plugin-rich combo (needed for `eslint-plugin-jsx-a11y` later in task 10, and broader familiarity). Flat config in `eslint.config.js`, Prettier via `.prettierrc.json` + `eslint-config-prettier` to avoid rule conflicts.
- Added `"strict": true` explicitly to `tsconfig.app.json` — the scaffold's strictness flags (`noUnusedLocals` etc.) didn't include it by default.
- Env var is `VITE_API_BASE_URL`, read via a `.env.local` (gitignored, `*.local` pattern already in the scaffold's `.gitignore`) with `.env.example` committed — pointed at `http://localhost:5258/api` (the `http` launch profile in `Argos.Api/Properties/launchSettings.json`).
- **Backend change required and made**: `Program.cs` had no CORS policy at all, which would have silently blocked every browser request from the Vite dev server (different origin). Added a dev-only `"FrontendDev"` CORS policy allowing `http://localhost:5173`, applied only when `IsDevelopment()`. Production CORS origin is still open per SPEC.md §10's hosting decision — revisit then.
- Route skeleton is live in `App.tsx` (`/`, `/search`, `/books/:openLibraryId`, `/login`, `/register`, `/u/:username`, `/feed`, `/lists`, `/lists/:id`, plus a `*` 404) with a `Layout` (`NavBar` + `Outlet`) and one stub page per route — no real content yet, that's every task from 03 onward.
- Verified: `npm run build` (tsc + vite build) and `npm run lint` both pass clean; `npm run dev` boots and serves on `:5173`.
- **Verified end-to-end**: `docker compose up -d postgres`, `dotnet run` (local, pointed at the compose Postgres on `localhost:5433`), `npm run dev` — CORS preflight from `localhost:5173` to `localhost:5258` returns `Access-Control-Allow-Origin: http://localhost:5173` correctly.
