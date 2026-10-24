# Feature Spec — Admin stats page

**Status:** built and verified 2026-10-22 (Apollon, not yet committed); left: the by-hand check after deploy. Roadmap Stage 4b, before early access, so the counting starts on the first day strangers arrive. Days before the build can't be filled in for active readers and visits (§3.6 fills what it can).

## 1. Problem

The user can't see how the app is being used: how many people visit, sign up, come back, or import their books. Without that, early access gives no answer to "is anyone using it, and is it growing?" Render's metrics and Sentry show server health and errors, not people.

## 2. Decisions (asked 2026-10-22)

- **An admin page inside the app**, at `/admin/stats`, next to Invite requests, Reports, Feedback and What's new. Same rule as those: admins only, everyone else gets a 404. Admins are the existing `Admin` role (`AdminRoles`, set from `Admin:UserIds`); nothing new to set up.
- **Visitors are counted by us, not an outside service.** The site tells our API "a signed-out visit happened" and the API adds 1 to today's tally. No IP address stored, no cookie, no outside company. The cost: it shows how many visits per day, not where they came from or which pages. Plausible can be added later if that's wanted.
- **Built before early access** (Stage 4b).

### 2.1 Decisions I made, for the user to confirm

- **"Active" means opened the app that day while signed in**, not "typed a password". `LastLoginAt` only changes on a real login, and a reader stays signed in for 30 days, so it would miss almost all daily use. The quiet sign-in renewal (`/api/auth/refresh`) runs on every page load and every 15 minutes while the app is open, so that's where a day is recorded.
- **Days are UTC days**, the same for everyone. Labelled "days are in UTC" on the page.
- **Which reader was active on which day is kept 30 days, then only the count is kept.** Thirty days is the least that still allows "active in the last 30 days" (monthly actives). It's deleted with the account and listed in the export and the privacy policy.
- **The history is kept as daily counts**, so deleting an account or an old import job (deleted 30 days after it finishes) doesn't shrink past days.
- **Signed-in readers aren't counted as visits**; they're counted as active readers. A visit counts once per browser tab session, so reloading doesn't add more.
- **Total traffic = visits + active readers**, per day (asked by the user 2026-10-22), so one figure shows everyone who came, signed in or not. Worked out when the page asks; nothing extra stored. Rough: a signed-out visitor who opens two tabs counts twice, a reader counts once per day.
- **Automated browsers aren't counted**: `navigator.webdriver` (Playwright, our own `browser-check` and `shoot.mjs` runs) skips the visit call, and the API ignores user agents that say they're a bot. Anyone can still inflate the count by scripting it; the `public` rate limit caps that per address. It's a rough number, and the page says so.

## 3. Design

### 3.1 What the page shows

**Now** (a row of figures):
- Readers: accounts with a confirmed email, not deactivated or suspended.
- New readers today / last 7 days / last 30 days.
- Active readers today / last 7 days / last 30 days (each reader counted once per window).
- Visits today / last 7 days.
- Total traffic today / last 7 days: visits + active readers.
- Imports this week: started, finished, failed.

**Day by day** (one small bar chart per measure, same time range for all, a 7 / 30 / 90 days switch, default 30): new readers, active readers, visits, total traffic (visits + active readers), imports started, imports finished, imports failed. Hovering or tapping a bar shows the day and the number. Under each chart, a short table version for screen readers.

Not shown: who the readers are. The page shows only counts, never names or emails. (A list of names was built and taken out again on 2026-10-24, §6.)

### 3.2 Table `DailyCounts` (entity `DailyCount`)

The day-by-day history. One row per UTC day per measure.

| Column | Type | Notes |
|---|---|---|
| `Day` | `date` | UTC day. Part of the key. |
| `Metric` | `DailyMetric` enum, stored as text | `NewReaders`, `ActiveReaders`, `Visits`, `ImportsStarted`, `ImportsFinished`, `ImportsFailed`. Part of the key. |
| `Count` | `int` | |

Added to by one upsert: `INSERT … ON CONFLICT ("Day", "Metric") DO UPDATE SET "Count" = "DailyCounts"."Count" + 1`, with parameters (`ExecuteSqlInterpolatedAsync`), in a `UsageCounter` service. A failure to count is logged and never fails the reader's request.

Where each is counted:
- `NewReaders`: when an account is made: the confirmed sign-up link (`confirm-signup`) and a new Google account (`GoogleAccounts`).
- `ImportsStarted`: when an `ImportJob` is created. `ImportsFinished` / `ImportsFailed`: when the worker sets `Completed` / `Failed`.
- `Visits`: the visit endpoint (§3.4).
- `ActiveReaders`: not counted live. The nightly job (§3.5) writes each closed day's total from `ReaderActiveDays`.

### 3.3 Table `ReaderActiveDays` (entity `ReaderActiveDay`)

| Column | Type | Notes |
|---|---|---|
| `Day` | `date` | UTC day. Key with `UserId`. |
| `UserId` | `Guid` | FK to the user, cascade delete. |

Written with `INSERT … ON CONFLICT DO NOTHING` on a successful `/login`, Google login and `/refresh`. To avoid a database write every 15 minutes per open tab, the service keeps a small in-memory set of "(reader, day) already written" that clears at the day change. Not written for a suspended or deactivated account (those can't refresh anyway).

### 3.4 Endpoints

- `POST /api/stats/visit`: no login, no body, `public` rate limit, answers 204. Adds 1 to today's `Visits` unless the `User-Agent` is empty or matches a bot pattern (`bot|crawler|spider|preview|headless`, case-insensitive), or the `Origin` header isn't one of the site's own (`Cors:AllowedOrigins`): a POST with no body needs no CORS check, so without it any other page could make its visitors' browsers count here (argos-security, 2026-10-22). Stores nothing about the caller.
- `GET /api/admin/stats?days=7|30|90`: `[RequireAdmin]` (404 for everyone else), like the other admin controllers. Answers the "now" figures and, per measure, a list of `{ day, count }` with every day in the range present (zeros filled in), oldest first. Today's active readers come live from `ReaderActiveDays`; earlier days from `DailyCounts`. Total traffic is added up per day from visits and active readers (not a stored metric).

### 3.5 Nightly job `UsageStatsWorker`

A `BackgroundService` like `FeedbackCleanupService`. Once a day, shortly after midnight UTC:
1. For each closed day not yet in `DailyCounts` as `ActiveReaders` (normally just yesterday; more if the API was asleep), count that day's `ReaderActiveDays` rows and write the total, 0 when every reader of that day is now deactivated or suspended (so the day's rows are still deleted after 30 days; argos-security, 2026-10-22).
2. Delete `ReaderActiveDays` rows older than 30 days (today and the 29 days before it stay).

A day is only rolled up 5 minutes after it closes, at startup too, so a renewal from 23:59 isn't lost. Deactivated and suspended accounts aren't counted as active, in the roll-up or the live counts, so active readers never outnumber Readers. `UsageStats:WorkerEnabled=false` switches the job off; only the tests do, since they run the roll-up on days of their own.

On a free Render plan the API sleeps, so step 1 also runs at startup and catches up on missed days. Rows are only deleted after their day is written as a count.

### 3.6 Filling in the past (in the migration)

- `NewReaders` per day from today's accounts' `CreatedAt`. Accounts already deleted are missing, which is fine at this size.
- `ImportsStarted` / `ImportsFinished` / `ImportsFailed` from the `ImportJobs` still kept (the last ~30 days).
- Active readers and visits start at zero: they weren't recorded.

### 3.7 Frontend

- `pages/admin/AdminStatsPage.tsx`, route `admin/stats`, lazy-loaded like the other admin pages, link "Stats" first in the sidebar's admin group.
- `api/adminStats.ts` + a React Query hook, `staleTime` of a minute.
- The visit ping in `main.tsx` (or the app shell): signed out (no `argos_session` marker), not `navigator.webdriver`, no `argos_visit_counted` in `sessionStorage` → `POST /api/stats/visit`, then set the flag. Fire and forget; a failure is ignored. `sessionStorage` is wrapped in try/catch.
- Charts as plain CSS columns in a `StatChart` component, drawn like the existing `ColumnChart` (no chart package; `web/package.json` has none; built 2026-10-22 with CSS grid rather than the SVG first planned, to match `ColumnChart`). No value on every column: one tick for the top of the scale, the first and last day, and the day and number in a tooltip on hover, tap or the arrow keys. Read the `dataviz` skill, `PRODUCT.md` and `DESIGN.md` first, design tokens only, all five themes.
- Every word through `t('…')` in all five locales.

### 3.8 Privacy

- Privacy policy (`LegalPage`, section "Usage counts"; the cookies section now says "no outside analytics service" and the download section lists the active days): one short paragraph: "We record which days you open the app while signed in, keep it 30 days, then keep only the total number of readers per day. We count visits from signed-out visitors as a number per day; we don't store your address or set a cookie for it."
- Export (`AccountExportWriter`): `active-days.csv` with the reader's own `Day` rows.
- Deleted with the account (cascade) and hidden while it's deactivated, like everything else.

## 4. Out of scope

- Where visitors come from, which pages they look at, countries, devices (that's Plausible, if wanted later).
- Funnels and retention ("of the readers who joined in week 1, how many came back in week 4"). Possible later from `ReaderActiveDays` if it's kept longer, which would need a new privacy decision.
- Counts of books logged, reviews, lists, clubs. Easy to add later as more `DailyMetric` values.
- Emailed daily or weekly summaries.
- Anything that shows individual readers (tried and dropped 2026-10-24, §6).

## 5. Tasks

### Before building
- [x] The user confirms §2.1. (2026-10-22: all as written, plus a total-traffic figure, see §2.1.)

### Backend
- [x] `DailyCount`, `DailyMetric`, `ReaderActiveDay` entities, configuration, migration with the fill-in of §3.6.
- [x] `UsageCounter` service (upsert, swallow-and-log on failure) and the active-day recorder with its in-memory set.
- [x] Count new readers (`confirm-signup`, Google), imports started / finished / failed, active days on login, Google login and refresh.
- [x] `POST /api/stats/visit` with the bot filter and the `public` rate limit.
- [x] `UsageStatsWorker`: nightly roll-up, catch-up at startup, 30-day delete.
- [x] `GET /api/admin/stats` with `[RequireAdmin]`, every day filled in.
- [x] Export gets `active-days.csv`.
- [x] Tests: upsert adds up under parallel calls; active day written once per day; roll-up writes closed days only and never deletes an unwritten day; catch-up after missed days; admin endpoint 404 for a reader and signed out; visit endpoint ignores bots; deleting an account removes its active days but keeps past counts.

### Frontend
- [x] Visit ping with its four conditions, with a Vitest test for each.
- [x] `AdminStatsPage`, `StatChart`, route, sidebar link ("Site stats", so it isn't confused with the readers' own Stats), 7 / 30 / 90 switch, loading and error states, table version for screen readers.
- [x] Translations in all five locales.
- [x] Privacy policy paragraph.

### Verification & docs
- [x] `reviewer`, then `argos-security` (a new public endpoint, an admin endpoint, a new kind of personal data). Backend done 2026-10-22: no high findings; fixed the visit Origin check, 30-day keep, midnight margin, hidden accounts in active counts, warning log level. Frontend 2026-10-22: no high or medium findings; fixed: a day whose active readers are all hidden now gets a 0 total (its rows were never deleted), tiny non-zero columns get a 2px floor, explicit `staleTime`.
- [x] `/browser-check` 2026-10-22: admin page, 7/30/90, tooltip by pointer and arrow keys, 375 px with no sideways scroll, 404 for a reader and signed out; Playwright sent no visit; a direct POST with our Origin and a browser user agent counted 1, a bot, a foreign Origin and no Origin counted nothing; the privacy section shows.
- [x] Screenshot critique round (`web-design`) 2026-10-22: two rounds, disposition **ship**. Changed: today's figures first and Readers last, one-line 7/30-day details, tooltip above its own column, a stronger top tick line and a fixed scale gutter, a one-line intro with the visits caveat under the charts, "None in these N days" for an empty measure. Not done: lining the three import tiles up with the five above (needs a fixed-column mode in `StatTiles`).
- [x] `CHANGELOG.md` line, What's new entry not needed (admins only).

### By hand (the user, on deploy)
- [ ] Open `/admin/stats` on the live site the next day and check yesterday's active readers appeared.

## 6. Leaving the admin out (2026-10-24)

Asked by the user 2026-10-24: keep their own use out of the numbers.

- **Admins aren't active readers.** `UsageStatsRepository.ActiveRows` and the nightly roll-up leave out accounts in the Admin role. Their rows are still written (and in their export). Days rolled up before this keep their totals with the admin in them, so the active-readers chart may step down by one at 2026-10-24. Promoting or demoting someone later changes open days only.
- **The admin's signed-out visits aren't counted.** A browser an admin signs in on keeps `argos_admin_browser` in `localStorage` (set in `AuthContext`), kept after logout, and the visit ping skips it. A shared computer stops counting its visits; a new private window still counts. Rough number, as before.
- The page's intro says "Your own use as admin isn't counted." No privacy-policy change: nothing new is stored or shown.

**Dropped: a "Who was active" list of named readers** (Apollon 95121bb, removed in e30751e). Built and reviewed, then the user decided against it: readers signed up under "counts only", there'd be no opt-out, and the counts already answer "is anyone using it?". Taken out with its privacy-policy rewording. If it comes back, it needs a stated purpose, a policy change announced before it takes effect, names only from that day, and ideally a reader setting to stay off the list.
