# Deploying Winged Words

How the live site is put together, where its settings live, and the checks to do after deploying. Written during Roadmap Stage 4 and added to as each piece goes live. The choices behind it are in `ACCOUNTS-AND-HOSTING.md` Part 2.

## Visitor addresses behind the proxy

Visitors never connect to the API directly. Each request goes visitor → Cloudflare (Render's front door) → Render's load balancer → the API. To the API, every request seems to come from Render. The rate limits and the login lockout count per visitor address, so without the setup below every visitor would share one limit, and one person could lock out everyone's logins.

**How the API finds the visitor.** Each proxy adds the address it received the request from to the end of the `X-Forwarded-For` header, so on Render it reads `visitor, Cloudflare edge, Render` (sometimes without the Render entry). Render keeps anything the visitor put there themselves, at the front, so the front can't be believed. The API reads the list from the right:
1. It ignores the header unless the request really came from Render's network.
2. It skips Render's own entries.
3. It skips one Cloudflare entry, at most.
4. The next entry is the visitor.

Skipping only one Cloudflare entry matters. Someone whose own address is a Cloudflare one (a Cloudflare Worker) still counts as the visitor, and can't make the API read an address they typed. Code: `Middleware/VisitorAddressMiddleware.cs`.

**Where the settings are.** The `Proxy` section of `src/Argos.Api/appsettings.Production.json` (Apollon):
- `InternalNetworks` is Render's private network, `10.0.0.0/8`.
- `EdgeNetworks` is Cloudflare's published ranges (<https://www.cloudflare.com/ips/>).

The API refuses to start outside Development when either list is empty, or when a range is unreadable or wider than /8 (IPv4) or /16 (IPv6).

**If something doesn't match**, the API keeps Render's address, so visitors share limits but nobody can fake an address. It also writes one warning to the log: "No visitor address could be read from X-Forwarded-For…". If you ever see that warning, do the check below.

**Check after the first deploy** (and whenever that warning appears):
1. On the API service in Render, add the environment variable `Proxy__LogForwardedChain` = `true` and redeploy.
2. Open the site from your phone on mobile data and from your computer.
3. In the API's logs, find lines like `X-Forwarded-For ending 81.2.3.4, 172.71.146.118, 10.26.236.170 (3 entries) from 10.26.1.5: visitor is 81.2.3.4`. The "visitor is" address must be your own public address on each device (search "what is my IP" to see it). It must not be a `10.…` or Cloudflare address.
4. If it is, the chain has changed shape: copy the log line into a Claude session and adjust `ProxyOptions` / `VisitorAddressMiddleware`.
5. *Optional, for certainty:* deploy a free Cloudflare Worker that calls the API with the header `X-Forwarded-For: 6.6.6.6`, once through the `onrender.com` address and once through `api.wingedwords.app`. The log must not say "visitor is 6.6.6.6".
6. **Remove `Proxy__LogForwardedChain` again.** Visitor addresses are personal data and shouldn't sit in logs.

**Do the check again if the domain is ever put behind your own Cloudflare account** (the orange cloud in Cloudflare's DNS). That adds a second Cloudflare hop. The API would then read a Cloudflare address as the visitor without any warning, and everyone near the same Cloudflare location would share one limit.

**Leave `ASPNETCORE_FORWARDEDHEADERS_ENABLED` unset.** Some hosting guides recommend it, but the API switches that built-in step off anyway, because it would trust every connection.

**If Cloudflare changes its ranges** (rare), update `EdgeNetworks` in `appsettings.Production.json` from <https://www.cloudflare.com/ips/> rather than on Render. An environment variable like `Proxy__EdgeNetworks__0` replaces only the first entry of the list, not the whole list.

## Link previews (shared pages, 2026-10-25)

When someone pastes a Winged Words link into Reddit, Discord, WhatsApp and similar apps, the app's bot fetches the page to draw a card. Since `specs/shareable-pages.md` Phase 3, the site's nginx recognises those bots by name (`redditbot`, `Discordbot`, `facebookexternalhit`, `Twitterbot`, `Slackbot`, `WhatsApp`, `TelegramBot`, `LinkedInBot`, `Applebot`). On a book, list, club invite, review, profile or author page (with or without `/es` in front) it fetches that page's card from the API (`GET /api/share/card`) and passes it on. People, and every other bot, get the app as before. If the API doesn't answer (asleep, down, error), the bot gets the usual page with the generic card.

**Which address nginx uses for the API.** The site service's `SHARE_CARD_API_URL` variable, or `API_BASE_URL` when it isn't set. Either works, with one difference:
- **Through the public address** (`https://api.wingedwords.app/api`, the default): to the API, every bot seems to come from the site service's own address, so all bots share one budget of 120 cards a minute (`RateLimits:ShareCardsPerMinute` on the API). Plenty at the start.
- **Through Render's private network** (better once there's traffic): set `SHARE_CARD_API_URL` on the site service to the API's internal address, `http://<api service's internal hostname>:<port>/api` (Render → the API service → *Connect* → *Internal*). The request then arrives from Render's 10.x network, so the API reads each bot's own address from `X-Forwarded-For` (see "Visitor addresses" above) and each bot has its own budget. Check in Render's docs that both services' plans can use the private network. Planned right after the API moves to the paid plan (ROADMAP, Stage before launch): a free service may not receive private-network traffic. To check it worked, set `Proxy__LogForwardedChain` = `true` on the API for a few minutes, run `curl -A "redditbot" https://wingedwords.app/books/OL45804W`, and look for "visitor is" followed by your own address (not a 10.x one or the site's); then remove the variable. If the card comes back generic, delete `SHARE_CARD_API_URL` to go back to the public address.

**Check after deploying** (from any terminal; use links you haven't shared before, because chat apps keep old cards for a while):
1. `curl -A "redditbot" https://wingedwords.app/books/OL45804W` shows `og:title` with the book's title (for a book someone has opened on the site; a book Winged Words has never loaded gets the generic card on purpose).
2. `curl -A "redditbot" https://wingedwords.app/es/books/OL45804W` shows the same in Spanish, with `og:url` ending `/es/books/OL45804W`.
3. `curl https://wingedwords.app/books/OL45804W` (no bot name) still returns the app (`<div id="root">`).
4. Paste a link of each kind into a chat with yourself and into Reddit's post preview.

## Bot check on login and sign-up (Cloudflare Turnstile)

Per-address limits can't stop leaked email/password pairs being tried from thousands of addresses, one or two guesses each. With the bot check on, login and sign-up each need a solved Turnstile challenge (usually invisible to a real reader). Code and decisions: `specs/bot-check.md`.

**It is off until both keys are set.** Turn it on before (or together with) turning off invite-only sign-up: since 2026-10-22 sign-ups are open (ROADMAP, 🚩 Early access). The API refuses to start if only one of the two is set.

**Turning it on:**
1. In the Cloudflare dashboard (free account) → Turnstile → add a widget. Hostname `wingedwords.app` (add `localhost` only on a separate dev widget). Mode: Managed.
2. On the API service in Render, set `Turnstile__SiteKey` (public) and `Turnstile__SecretKey` (secret, never in the repo), then redeploy. The site needs no change: it gets the site key from `GET /api/auth/registration-status`.
3. Check: open `/login` in a private window; the challenge appears (or runs silently) and logging in works. Then block `challenges.cloudflare.com` in the browser and check the form says the bot check couldn't load.
4. The site's Content-Security-Policy (`web/docker/entrypoint.sh`) already allows `challenges.cloudflare.com` for script, frame and connect.

**For development**, Cloudflare's published test keys work on `localhost` and need no account: site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA` always passes; secret `2x0000000000000000000000000000000AA` always fails. Put them in `dotnet user-secrets` for `Argos.Api`, not in `appsettings.Development.json`.

**If Cloudflare is down or the secret is wrong**, nobody can log in or sign up: the check fails closed on purpose. The API logs "Couldn't check a Turnstile token with Cloudflare". Unset `Turnstile__SiteKey` and `Turnstile__SecretKey` to switch the check off while you fix it.

**Visitor addresses:** the API sends Cloudflare the visitor address from the section above, so that check matters here too.

## HTTPS and HSTS

**HTTPS** comes from Render: it issues and renews the certificates for `wingedwords.app`, `www.` and `api.`, and redirects any `http://` request to `https://`. Nothing to set.

**HSTS** (the `Strict-Transport-Security` header) tells a browser to use only HTTPS for the site and every subdomain for the next year, even if someone types or links `http://`. Both the site (`web/docker/entrypoint.sh`) and the API (`Program.cs`) send `max-age=31536000; includeSubDomains`. The API can't use ASP.NET's `UseHsts`: Render ends HTTPS at its proxy, so requests reach the API as plain HTTP and `UseHsts` would never send it. Browsers ignore the header on plain HTTP, so local runs are unaffected.

**Already the rule for `.app`:** the whole `.app` domain is on the browsers' built-in HSTS list, so browsers refuse plain HTTP for `wingedwords.app` and its subdomains before ever seeing our header. The header is the second layer, for anything that doesn't ship that list. Either way, **every subdomain must serve HTTPS**. Render does that for anything pointed at it; keep it in mind for any other service.

**Check after deploying** (from Git Bash):
```
curl -sI https://wingedwords.app | grep -i strict-transport
curl -sI https://api.wingedwords.app/health | grep -i strict-transport
curl -sI http://wingedwords.app | head -3
```
The first two each print `strict-transport-security: max-age=31536000; includeSubDomains`. The third prints a `301` or `308` redirect to `https://`.

## Containers run without root, and security.txt (2026-10-21)

Both containers run as a normal user, so a hole in the API or nginx doesn't hand over root inside the container: the API as the .NET image's `app` user (`USER $APP_UID` in `Dockerfile`), the site on `nginxinc/nginx-unprivileged` as user 101 (`web/Dockerfile`). The site's `entrypoint.sh` can still rewrite `config.js` and the security-headers snippet; nothing else is writable. Both images were built and checked locally; the Security workflow scans them with Trivy on every push and weekly.

**Check after the first deploy with this change:** in Render, both services' logs show a normal start (the API's migrations and "Now listening", nginx with no `permission denied`). Then:
```
curl -s https://wingedwords.app/config.js
curl -sI https://wingedwords.app | grep -i content-security
curl -s https://wingedwords.app/.well-known/security.txt
```
The first shows `apiBaseUrl: "https://api.wingedwords.app/api"`, the second the CSP, the third the file below.

**security.txt** (`web/public/.well-known/security.txt`) tells anyone who finds a security problem to write to `hello@wingedwords.app` ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)). Its `Expires` line is **2027-10-21**: before then, move it a year forward, or tools treat the file as stale.

## Error tracking (Sentry)

Crashes on the API and the site are reported to Sentry (free Developer plan, organization `winged-words`, data stored in the **US**), which emails you the first time each new kind of error appears. Two projects: `wingedwords-api` (ASP.NET Core) and `wingedwords-web` (React). Both use **error monitoring only**: no tracing, logs, metrics or session replay, and no linked GitHub repo. The org's "generative AI features" switch is off, and **Settings → Security & Privacy → "Prevent Storing of IP Addresses"** is on (a second guard: the code already sends no addresses).

**What a report carries:** the error and where in the code it happened, the deployed commit (`RENDER_GIT_COMMIT`), the page or API path, the browser (User-Agent) and language, and the clicks, page changes and API calls just before it. **Never** the reader's account, cookies, tokens, IP address, query strings, request bodies or console lines. The privacy policy's error-tracking paragraph says exactly this; change the code and the policy together. Code: `Configuration/ErrorTracking.cs` (API, which strips each report in `Scrub`), `web/src/lib/errorTracking.ts` (site).

**Where the DSNs live:** a DSN is the address a project sends its reports to. It isn't secret (the site's is visible in `config.js` to anyone).
- API: `Sentry:Dsn` in `src/Argos.Api/appsettings.Production.json`. Development and the tests have it empty, so they send nothing. Nothing to set on Render.
- Site: the environment variable **`SENTRY_DSN`** on the site service in Render, set to the `wingedwords-web` DSN (Sentry → Settings → Projects → wingedwords-web → Client Keys). `docker/entrypoint.sh` writes it into `config.js` and adds Sentry's address to the CSP's `connect-src`; it refuses to start with anything that isn't a Sentry DSN. Without it, the site never downloads Sentry at all.

**Check after deploying:**
1. Open `https://wingedwords.app`, open the browser's developer tools → Console, and run `setTimeout(() => { throw new Error('Sentry check from the site') })`. Within a minute it appears in Sentry under `wingedwords-web` → Issues, with the commit as its release. Resolve it afterwards.
2. In the same developer tools → Network, check the report went to `o4512284441706496.ingest.us.sentry.io` and wasn't blocked by the CSP (no red CSP error in the Console). `net::ERR_BLOCKED_BY_CLIENT` instead means an ad blocker or privacy extension stopped it, not our code: retry in a private window or with the blocker paused for the site. (Readers with blockers send no reports; a Sentry "tunnel" through the API would fix that.)
3. The API has no button that crashes on purpose; its first real error is the check. Its scrubbing was verified locally on 2026-10-19 against a fake Sentry server: a crash carrying a login token, a cookie, an `X-Forwarded-For` address and a search query reached it with none of the four.

**If Sentry gets noisy or its quota fills** (5,000 errors a month on the free plan): resolve or ignore the issue in Sentry; to stop sending altogether, unset `SENTRY_DSN` on the site, or set `Sentry__Dsn` to an empty value on the API service.

## Admin role (invite requests, reports, feedback)

The admin pages `/admin/invite-requests` (where "Request an invite" submissions land), `/admin/reports` and `/admin/feedback` are open only to accounts listed in `Admin:UserIds`. The list holds **account ids, not usernames**: a username can be given up and taken by someone else, an id never changes hands (`specs/invite-requests.md` §3.1).

1. Find your account id: log in on `https://wingedwords.app`, open the browser's developer tools → Network, reload, click the `me` request and copy `id` from its response. (Opening `/api/auth/me` directly doesn't work: it needs the login token, which only the page holds.)
2. On the API service in Render, set `Admin__UserIds__0` to that id and redeploy (the role is synced at startup: everyone listed gets it, anyone not listed loses it).
3. Reload the site: an **Invite requests** link appears in the account menu. Your account must have a confirmed email, or the page is not found.

Removing someone: delete their entry and redeploy; it takes effect at the restart, not when their login expires. With `Registration__InviteOnly=false` the request form and its endpoint disappear (404), but the admin page still lists old requests.

## Feedback emails and replying as hello@

Each message sent with the feedback button (`specs/feedback-button.md`) is saved on `/admin/feedback` and emailed to `Feedback:NotifyAddress`. Production sets it to `hello@wingedwords.app` in `appsettings.Production.json` (Porkbun forwards it to your Gmail), so Render needs no variable; set `Feedback__NotifyAddress` there only to send them somewhere else. Empty means no email, only the admin page. The email's reply address is the reader's own, so **Reply** in Gmail answers them.

**One-time Gmail setup, so replies come from `hello@` and not your personal address:**
1. In Resend, create an API key with *sending access* for `wingedwords.app`, named "Gmail send-as" (separate from the API's key, so either can be revoked alone).
2. Gmail → Settings (gear) → See all settings → **Accounts and Import** → *Send mail as* → **Add another email address**. Name `Winged Words`, address `hello@wingedwords.app`, leave "Treat as an alias" ticked.
3. SMTP server `smtp.resend.com`, port `465`, username `resend`, password the key from step 1, "Secured connection using SSL". (Render's port block doesn't apply: Gmail's servers do the sending.)
4. Gmail emails a confirmation code to `hello@`, which forwards to you; enter it.
5. Under *Send mail as*, choose **Reply from the same address the message was sent to**. Feedback arrives addressed to `hello@`, so replies to it go out from `hello@`.
6. Check: send yourself a feedback message on the live site, reply to it from Gmail, and look at the reply in the reader's inbox. The sender should read "Winged Words <hello@wingedwords.app>".

## Uptime alerts (UptimeRobot)

A free UptimeRobot account (signed up with your Gmail) checks two addresses every 5 minutes and emails you when one stops answering, and again when it's back:
- `https://wingedwords.app` (the site)
- `https://api.wingedwords.app/health` (the API; `/health` also checks the database, so a database outage shows here too)

**While the API is on Render's free plan**, which sleeps after 15 minutes without visits, the 5-minute checks keep it awake (one always-on service fits in the free 750 hours a month). If a check ever lands while it's waking (30–60 s) and reports a false "Down", raise the monitor's request timeout to 60 seconds.

## How the live site is set up on Render (first deploy, 2026-10-13)

Everything is in one Render account, region **Virginia (US East)**. The domain is at Porkbun, email sending at Resend.

| Piece | Render service | Notes |
|---|---|---|
| Database | PostgreSQL `wingedwords-db` | **Free plan: deleted after 30 days.** Move to the paid plan (~$6–7/month) before real readers join. |
| API | Web service `wingedwords-api`, Docker, `./Dockerfile` (repo root) | Health check path `/health`. Free plan sleeps after 15 minutes (first request ~30–60 s, background jobs pause); move to the $7 plan before launch. Runs the database migrations itself on start. |
| Site | Web service `wingedwords-web`, Docker, root directory `web`, `web/Dockerfile` | Docker rather than a static site on purpose: the nginx image writes `config.js` and the security headers (CSP) at startup. |

**Domains** (Render → Settings → Custom Domains, DNS at Porkbun):
- `wingedwords.app` (ALIAS to the site service's `.onrender.com` address) and `www.wingedwords.app` (CNAME, redirects to the bare domain) → site.
- `api.wingedwords.app` (CNAME) → API.

**Environment variables on the API service** (names; values live only in Render):

| Name | Value / meaning |
|---|---|
| `Database__ConnectionString` | `Host=<internal hostname>;Port=5432;Database=…;Username=…;Password=…` (key=value form, **not** Render's `postgres://` URL, which Npgsql can't read here) |
| `Jwt__SigningKey` | long random value (Render's *Generate* button); changing it logs everyone out |
| `Cors__AllowedOrigins__0` | `https://wingedwords.app` |
| `App__FrontendBaseUrl` | `https://wingedwords.app` |
| `Registration__InviteOnly` | `false` since 2026-10-22: anyone can sign up (ROADMAP, 🚩 Early access). Set back to `true` to close sign-ups again (spam, say); readers' invite links then work again. |
| `Email__Host` / `Email__Username` / `Email__Password` | `smtp.resend.com` / `resend` / a Resend API key with *sending access* for `wingedwords.app` |
| `Email__Port` | **`2587`** (see below) |
| `Email__FromAddress` / `Email__ReplyToAddress` | `hello@wingedwords.app` |
| `Email__DailyWarnAt` / `Email__DailyLimit` | not set: the defaults 50 / 80 fit Resend's free 100 a day. At the warn count an error reaches Sentry; from the limit, sign-up confirmations and feedback copies wait for the next day (UTC). Raise both if Resend's plan goes up (`bugs/email-sending-has-no-overall-budget.md`) |
| `Sentry__Dsn` | the Sentry project's DSN (Sentry → Settings → Projects → Client Keys). Only here, not in a committed file, so no other copy of the API reports to Sentry. Empty = error reports off |
| `Turnstile__SiteKey` / `Turnstile__SecretKey` | the Cloudflare Turnstile widget's keys (bot check on; see its section). Both or neither |
| `Admin__UserIds__0` | your account id (see "Admin role" below). More admins: `Admin__UserIds__1`, … |

On the site service: `API_BASE_URL` = `https://api.wingedwords.app/api` (a plain https URL; the container refuses anything else). Optional: `SHARE_CARD_API_URL`, where nginx fetches link preview cards from (see "Link previews").

**Things that bit us on the first deploy**
- **Email timed out ("Sending … failed (TimeoutException); retrying").** Render's free instances block the standard outgoing SMTP ports 25, 465 and 587. Resend also listens on **2587** (STARTTLS, same as 587) and **2465** (implicit TLS, needs `Email__UseSsl=true`); `Email__Port=2587` works. Paid instances aren't blocked, but 2587 keeps working there too.
- **Sign-up or login ended in "something went wrong" and the console showed `GET /auth/me` → 401.** Production had no `Jwt:Issuer` / `Jwt:Audience`, so tokens were issued with blank labels and rejected on the next request. Both are now set in `appsettings.json`, and the API refuses to start if either is empty.
- **Render deployed on every push to `main`**, whether or not CI passed. Since 2026-10-19 both services (site and API) are set to *After CI checks pass* (Settings → Build & Deploy → Auto-Deploy): a push goes live only once the GitHub Actions run is green, and a red run deploys nothing. To ship without waiting (an urgent fix while CI is down), use *Manual Deploy* on the service.
- **Resend: leave click and open tracking off.** Tracking rewrites the confirmation and reset links through a third-party address, and the privacy policy doesn't mention it.

## Incidents on the live site

Newest first. What happened, what we found, and what we decided, so the next one starts from here.

### 2026-10-26 (later the same day): "exceeded its memory limit"

- **What we saw:** an email from Render, "Web Service wingedwords-api exceeded its memory limit", and an automatic restart. The second restart that day, so the freeze below was probably the same thing: just before running out, the garbage collector (the part of .NET that frees unused memory) runs almost nonstop and the app stops answering.
- **What the code showed:** no clear leak. Every cache entry expires, Open Library responses are capped (editions at 100), uploads have size limits, and the SkiaSharp image code disposes what it makes. The API runs .NET's **server garbage collector** (the ASP.NET default), which holds on to more memory before cleaning up. That suits big servers, not the free plan's 512 MB.
- **Render shows no memory chart on the free plan** (Metrics → Memory needs a paid plan). Outbound bandwidth stayed under 0.3 MB at its busiest, and both restarts came at quiet times, so a traffic spike is ruled out.
- **Same evening: the API moved to the Starter plan** ($7, still 512 MB), and its memory chart showed the whole day. Up to the 11:50 deploy, memory was flat at about 45%. After it, each run started at 25–30% and **jumped in one step to 95–100%** (about 12:05, 1:55, 3:20), then stayed there. CPU showed only short bursts. So it isn't a slow leak. Something needs a lot of memory for a moment, and the server garbage collector kept it instead of giving it back, so the next burst had no room. What makes the burst is **not yet known**. The main suspect, the Open Library refresh (10 minutes after start, up to 500 books), doesn't look big enough when read.
- **Decision: `DOTNET_gcServer` = `0`** set on the API service (the lighter "workstation" garbage collector, which gives memory back after a burst). If this stops the restarts, consider moving it into the code (`<ServerGarbageCollection>false</ServerGarbageCollection>` in `Argos.Api.csproj`) so it doesn't depend on a Render setting.
- **Decision: the API logs its own memory** every two minutes (Apollon `06462a0`): lines starting `Memory: process … MB, .NET heap … MB`. At start-up it also logs whether server GC is on.
- **If it happens again:** search the log for `Memory:` before the restart. A slow climb over hours means a leak. Flat, then a jump, means one heavy request (read the lines just before it). Steady near 512 MB means the app needs more room. A big gap between "process" and ".NET heap" points at native memory (SkiaSharp). A quick thing to try without changing code is the environment variable `DOTNET_gcServer` = `0` (the lighter "workstation" garbage collector).
- **Note on plans:** Render's $7 Starter plan also has **512 MB**, so the planned upgrade fixes sleeping, not memory. Standard (2 GB) costs about $25 a month.

### 2026-10-26: API froze for a minute, Render restarted it

- **What we saw:** an email from Render, "HTTP health check failed (timed out after 5 seconds)", and the event "Instance failed: txr52 … while running your code" at 1:36 PM. The site was fine again a few minutes later, with no action from us.
- **What the logs showed:** database queries took 1–2 ms right up to **1:35:48**. Then nothing at all for a minute, not even the import worker, which checks for imports every 2 seconds. Render restarted the instance at 1:36:47, and four seconds later the database answered in 103 ms. No deploy was running: `706ef9e` started deploying at 2:21 PM. The `Cannot load library libgssapi_krb5.so.2` error at start-up is harmless noise (an optional Kerberos login component that our password logins don't use).
- **Cause: not proven.** Either the database connection suddenly hung (likely on the free Postgres plan), or the app itself froze (for example, out of memory). The logs can't tell these apart. Render → wingedwords-api → **Metrics → Memory** can: memory near the limit before the restart means the app; flat memory means the database.
- **Decisions:**
  - **Keep the health check on `/health`, which includes the database.** We considered a light `/health/live` that skips the database, so a database stall wouldn't restart the API. We decided against it. The restart may be what fixed things (it replaced database connections that might have gone dead). And with a light check, readers would get errors from a frozen API that Render leaves running.
  - **The import worker's 2-second check stays.** Idle, it costs about 1 ms of database time per check (under a minute a day), and it lets an import start almost at once.
  - **Routine database queries no longer go to the production log** (Apollon `3ba87d8`). Failed queries still show, as errors. So the next time it happens, the lines around the freeze will be readable.
  - **The real fix if it's the database:** move `wingedwords-db` to the paid plan (planned for the first week of November 2026; the free one is deleted around 2026-11-12).
- **If it happens again:** check Metrics → Memory, and read the log for the minute before the freeze. If it repeats while memory stays flat, revisit the light health check, or connection settings such as `Timeout` / `Keepalive` in `Database__ConnectionString`.

**First-account recipe** (only if invite-only is on and no readers exist, so nobody can create an invite): set `Registration__InviteOnly` to `false`, register, set it back to `true`, and check that the confirmation email arrives.
