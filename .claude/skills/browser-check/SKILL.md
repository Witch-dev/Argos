---
name: browser-check
description: Use when a change to Argos needs to be seen working in a real browser, not just typechecked or unit-tested — triggers on "/browser-check", "check it in the browser", "verify it live", "take a screenshot of X", or the "exercise it in the browser" step of new-react-feature, web-design, test-plan or a spec's verification checklist. Runs the current Apollon code on side ports with Playwright, logs in through the API and seeds fresh test readers.
---

# Argos browser check

Drive the real app with Playwright against the **current** code, without touching the user's own dev servers. Code is in `C:/Users/jramo/Apollon`.

## 1. Run the current code on side ports

The user's own API on **5258** (and Vite on 5173) often runs an older build, so don't test against it and don't stop it.

1. Build: `dotnet build src/Argos.Api -c Release` (Release, because the user's running API locks `bin/Debug`).
2. Start the API in the background from `src/Argos.Api`: `dotnet bin/Release/net10.0/Argos.Api.dll` with the environment variables `ASPNETCORE_ENVIRONMENT=Development`, `ASPNETCORE_URLS=http://localhost:5259` and `Cors__AllowedOrigins__0=http://localhost:5174`.
3. Start Vite in the background from `web/`: `npx vite --port 5174 --strictPort`.
4. Postgres is the Docker container `apollon-postgres-1` (host port 5433, database `argos`). If Docker isn't running, start Docker Desktop (`Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'`, about 30 s) and `docker compose up -d postgres mailpit` in Apollon.

A stopped Vite can survive as a process. Check who owns a port (`netstat -ano | findstr :5174`) before restarting.

## 2. Set up Playwright

In the session scratchpad (never in Apollon): `npm init -y && npm i playwright@1.63.0`. Chromium is already installed in `%LOCALAPPDATA%\ms-playwright`.

- **Point the page at port 5259.** `web/public/config.js` hard-codes `apiBaseUrl: 'http://localhost:5258/api'` and wins over `VITE_API_BASE_URL`. Use `context.route('**/config.js', …)` to serve `window.__ARGOS_CONFIG__ = { apiBaseUrl: 'http://localhost:5259/api' }` instead.
- **Log in without the UI:** `POST http://localhost:5259/api/auth/login`, then put the returned tokens into localStorage as `argos_token` and `argos_refresh_token` with `context.addInitScript`. The keys are defined in `web/src/api/authToken.ts`. If the token storage has changed (Roadmap Stage 4 moves to a cookie + in-memory token), check that file and adapt.
- **Theme:** localStorage key `argos_theme` (`paper`, `white`, `warm-gray`, `sepia`, `dark`).

## 3. Seed test readers

Create fresh readers through the API (register, then follows, logs, `/booklists`, `/clubs`) rather than using the hand-made dev data. The seeded `alice_reads` and friends exist, but their passwords aren't recorded. Name them so the run is recognisable (e.g. `bc_a_<timestamp>`).

**Confirm their emails.** Since Accounts Phase 2, an unconfirmed reader can't post anything others can read (reviews with text, notes, comments, writings, clubs, public lists). Either click the link in Mailpit (http://localhost:8025), or mark them confirmed directly:

```
docker exec apollon-postgres-1 sh -c 'psql -U "$POSTGRES_USER" -d argos -c "UPDATE \"AspNetUsers\" SET \"EmailConfirmed\" = true WHERE \"UserName\" LIKE '"'"'bc_%'"'"';"'
```

For longer SQL, `docker cp file.sql apollon-postgres-1:/tmp/x.sql` and run it with `psql -f`.

## 4. Check, then clean up

- Check at phone width (~375px) and desktop, and in the themes the change affects. Take screenshots into the scratchpad and look at them.
- Playwright gotchas: `name:` matching is a substring ("Like this list" also matches "Unlike this list"), so use `exact: true`. `dragTo` doesn't drive the list's HTML5 drag-and-drop: dispatch `dragstart`/`dragover`/`drop` DragEvents with one shared `DataTransfer`, pausing between them.
- Stop the side-port API and Vite when done. Leave the user's own servers alone, and remind them to restart their API if backend code changed.
