# 04 — Auth Flows

**Status:** ✅ Done

## Scope

- `/register` and `/login` forms, calling `POST /api/auth/register` / `POST /api/auth/login`, both returning `AuthResponse { token }`.
- Token storage: `localStorage` (simplest option that survives a refresh; XSS exposure is accepted at this project's stage — revisit only if/when SPEC.md's non-functional requirements demand httpOnly cookies).
- `AuthContext` / `useAuth()` hook: current user (from `GET /api/auth/me` once a token exists), `login`, `register`, `logout`, `isAuthenticated`.
- `ProtectedRoute` wrapper redirecting to `/login` (with a return-to path) for routes that need auth: log editing, profile self-view actions, lists CRUD, follow actions, feed.
- Nav bar updates to reflect logged-in vs. logged-out state (login/register links vs. avatar/username + logout).
- Client-side validation matching backend constraints (check `RegisterRequest`/`LoginRequest` for required fields and any `[Required]`/length attributes before writing the form schema).
- 401 handling: API client (task 02) should trigger a logout + redirect-to-login on a 401 response, not just surface a raw error.

## Depends on

Task 02 (API client, `auth.ts`). Task 01 for the route skeleton this slots into.

## Progress

**Done.** `AuthContext`/`AuthProvider` (`src/auth/`), split into `authContextValue.ts` (the `createContext` + type, so fast refresh doesn't choke on a non-component export) and `AuthContext.tsx` (the provider). `useAuth()` hook, `ProtectedRoute` (redirects to `/login?next=<path>`, preserving where the user was headed). `LoginPage`/`RegisterPage` forms with client-side validation, wired to `useAuth().login`/`register`. `NavBar` now shows the logged-in user's name + a log-out button, or a login link.

Notes:
- Current-user state is a `useQuery` on `GET /api/auth/me`, `enabled` only when a token exists (tracked as local `hasToken` state, since `localStorage` itself isn't reactive) — `login`/`register` call the endpoint, store the token, flip `hasToken`, and invalidate the `me` query; `logout` clears the token and removes the cached query. The `UNAUTHORIZED_EVENT` from task 02's client is subscribed here too, so any 401 anywhere in the app logs the user out automatically.
- `RegisterPage`'s password validation mirrors ASP.NET Core Identity's *default* policy (`Program.cs` doesn't override `PasswordOptions`): min 6 chars, needs uppercase/lowercase/digit/symbol. If that policy is ever tightened/loosened server-side, update `getPasswordError` in `RegisterPage.tsx` to match.
- `/feed` and `/lists` routes are wrapped in `ProtectedRoute`; `/lists/:id` intentionally is not (public lists need to be viewable logged-out — task 08 handles per-list visibility, not the router).
- Book detail page's CTA now branches on `isAuthenticated`: logged-out sends to `/login?next=/books/<id>`, logged-in shows a "coming soon" placeholder until task 05 builds the actual log form.
- **Verified fully live**, not just type-checked: stood up `docker compose up -d postgres` + `dotnet run` (local, `Database__ConnectionString` pointed at the compose Postgres on `localhost:5433`) + `npm run dev`, then via curl — register → 200 with a JWT, login → 200 with a JWT, `GET /api/auth/me` with that bearer token → correct `CurrentUserResponse`, and a CORS preflight from `localhost:5173` → `Access-Control-Allow-Origin: http://localhost:5173`. Confirms the whole chain (CORS, DTO casing, JWT auth) works, though still only checked via curl, not an actual browser session — see task 03's note on this session having no browser tool.
- Both servers (`Argos.Api` on `:5258`, `web` on `:5173`) plus the Postgres container are being left running for the rest of this session to keep testing subsequent tasks live.
