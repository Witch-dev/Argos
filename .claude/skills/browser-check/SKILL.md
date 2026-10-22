---
name: browser-check
description: Use when a change to Argos needs to be seen working in a real browser, not just typechecked or unit-tested — triggers on "/browser-check", "check it in the browser", "verify it live", "take a screenshot of X", or the "exercise it in the browser" step of new-react-feature, web-design, test-plan or a spec's verification checklist. Runs the current Apollon code on side ports with Playwright, logs in through the API and seeds fresh test readers. Runs as its own Sonnet agent; pass what to check (routes, the flow, what should happen) as the arguments, and it returns a short report.
context: fork
agent: general-purpose
model: sonnet
---

# Argos browser check

You are running as a separate agent. Your task (what to check, or "start the side-port servers") is in the arguments. Your logs, server output and screenshots stay with you; only your final report goes back, so keep it short:

- **Result:** works / doesn't work, in one line.
- **What broke:** each problem in one line (where, what you did, what happened, what should happen), with the console or API error text if there was one.
- **Screenshots:** paths, only if the task asked for them. Don't describe every image; say what's wrong in them.
- **Servers:** whether the side-port API and Vite are still running (with their PIDs) or stopped, and whether the user's own API needs a restart.

Drive the real app with Playwright against the **current** code, without touching the user's own dev servers. Code is in `C:/Users/jramo/Apollon`.

## 1. Run the current code on side ports

The user's own API on **5258** (and Vite on 5173) often runs an older build, so don't test against it and don't stop it.

1. Build: `dotnet build src/Argos.Api -c Release` (Release, because the user's running API locks `bin/Debug`).
2. Start the API from `src/Argos.Api`: `dotnet bin/Release/net10.0/Argos.Api.dll` with the environment variables `ASPNETCORE_ENVIRONMENT=Development`, `ASPNETCORE_URLS=http://localhost:5259` and `Cors__AllowedOrigins__0=http://localhost:5174`.
3. Start Vite from `web/`: `npx vite --port 5174 --strictPort`.

Start both **detached** with PowerShell `Start-Process -WindowStyle Hidden -PassThru` (set the environment variables with `$env:` first, in the same command), not as a background job of your own shell: you are a short-lived agent, and the parent session may need the servers after you finish (for `shoot.mjs`). If they're already up (check the ports), reuse them.
4. Postgres is the Docker container `apollon-postgres-1` (host port 5433, database `argos`). If Docker isn't running, start Docker Desktop (`Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'`, about 30 s) and `docker compose up -d postgres mailpit` in Apollon.

A stopped Vite can survive as a process. Check who owns a port (`netstat -ano | findstr :5174`) before restarting.

## 2. Set up Playwright

In the session scratchpad (never in Apollon): `npm init -y && npm i playwright@1.63.0`. Chromium is already installed in `%LOCALAPPDATA%\ms-playwright`.

- **Point the page at port 5259.** `web/public/config.js` hard-codes `apiBaseUrl: 'http://localhost:5258/api'` and wins over `VITE_API_BASE_URL`. Use `context.route('**/config.js', …)` to serve `window.__ARGOS_CONFIG__ = { apiBaseUrl: 'http://localhost:5259/api' }` instead.
- **Log in through the page, not by hand.** Since 2026-10-11 the refresh token is an httpOnly cookie (`__Host-argos_refresh`, path `/`) and the login token lives only in memory (`web/src/api/authToken.ts`), so there's nothing to put in localStorage. Fill `#emailOrUsername` and `#password` on `/login` and click `form button[type=submit]`. The cookie then stays in the Playwright context, and a reload or a second page in the same context stays signed in. Log in once per context and reuse it.
- **English UI:** pass `locale: 'en-US'` to `browser.newContext`, or the site follows Windows' Spanish and English button names won't match.
- **Reading the cookie:** `context.cookies()` with no URL lists everything, which is the simplest.
- **Theme:** localStorage key `argos_theme` (`paper`, `white`, `warm-gray`, `sepia`, `dark`).

## 3. Seed test readers

Create fresh readers through the API (register, then follows, logs, `/booklists`, `/clubs`) rather than using the hand-made dev data. A password that appears in a data breach is refused, so use a random one. The seeded `alice_reads` and friends exist, but their passwords aren't recorded. Name them so the run is recognisable (e.g. `bc_a_<timestamp>`).

**Sign-up is two steps** since 2026-10-22 (`specs/signup-check-your-inbox.md`): `POST /api/auth/register` answers 202 and logs nobody in; the account is made by the emailed link. Read it from Mailpit and post its token:

1. `GET http://localhost:8025/api/v1/search?query=to:<email>` → `messages[0].ID`
2. `GET http://localhost:8025/api/v1/message/<ID>` → in `Text`, the token after `/confirm-signup#token=`
3. `POST /api/auth/confirm-signup` with `{ "token": "…", "password": "<the sign-up password>" }` → `{ token, next }`, the login token (and the refresh cookie), as login gives. The password is needed whenever the request's `deviceId` isn't the one sent at register (a browser opening the link in the page sends its own; the same browser that signed up needs none).

The email can take a second to reach Mailpit: poll. The account is created with its email confirmed, so it can post at once. Register and confirm-signup each count against the auth limit of about 5 requests a minute from one address (HTTP 429), so seeding more than 2 readers needs a 65-second wait in between. One address gets at most one sign-up email a minute: a second register for it within the minute answers 202 and sends nothing.

To test what an **unconfirmed** reader sees (accounts from before this change can be unconfirmed), unconfirm one directly:

```
docker exec apollon-postgres-1 sh -c 'psql -U "$POSTGRES_USER" -d argos -c "UPDATE \"AspNetUsers\" SET \"EmailConfirmed\" = false WHERE \"UserName\" = '"'"'bc_a_1'"'"';"'
```

For longer SQL, `docker cp file.sql apollon-postgres-1:/tmp/x.sql` and run it with `psql -f`.

**An admin, for the admin pages** (invite requests, reports): the `Admin` role comes from the `Admin:UserIds` setting, applied at every API start, and is taken from any account not listed. Register the reader, then restart the side-port API with `Admin__UserIds__0=<their id>` added to its environment. First check who already has the role in the dev database (a join of `AspNetUsers`, `AspNetUserRoles` and `AspNetRoles` where the role is `Admin`) and list those ids too (`Admin__UserIds__1=…`), or the restart strips them until the user's own API restarts. Reports made before the reader was an admin don't ring their bell.

## 4. Check, then clean up

**Screenshots for design work:** `node C:/Users/jramo/Argos/scripts/shoot.mjs <route…> --out <scratchpad>/shots` does the login, themes and widths for you (only Paper at 1280 by default, `--final` for Paper and Dark at 1280 and 375, `--clip <selector>` for one component; `--themes`, `--widths`, `--scroll`, `--full`). It signs up its own reader through the Mailpit link the first time and reuses it from `<out>/reader.json`. Needs this section's side-port servers and a one-time `npm install` in `Argos/scripts`. Write your own Playwright script only for flows (clicking, typing, seeding data).

**Animations:** record a video (`browser.newContext({ recordVideo: { dir } })`) or take screenshots at 0 / 50 / 100% of the duration; check once more with `reducedMotion: 'reduce'` in the context options.

- Check at phone width (~375px) and desktop, and in the themes the change affects. Take screenshots into the scratchpad and look at them.
- Playwright gotchas: `name:` matching is a substring ("Like this list" also matches "Unlike this list"), so use `exact: true`. `dragTo` doesn't drive the list's HTML5 drag-and-drop: dispatch `dragstart`/`dragover`/`drop` DragEvents with one shared `DataTransfer`, pausing between them.
- Leave the side-port API and Vite running unless the task says this is the last check (then stop them by PID). Never touch the user's own servers on 5258/5173; say in the report if their API needs a restart because backend code changed.
