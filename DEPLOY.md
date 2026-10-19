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

## Bot check on login and sign-up (Cloudflare Turnstile)

Per-address limits can't stop leaked email/password pairs being tried from thousands of addresses, one or two guesses each. With the bot check on, login and sign-up each need a solved Turnstile challenge (usually invisible to a real reader). Code and decisions: `specs/bot-check.md`.

**It is off until both keys are set.** Nothing to deploy for the closed beta; turn it on before public launch (ROADMAP Stage 10). The API refuses to start if only one of the two is set.

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
| `Registration__InviteOnly` | `true` during the beta. Set to `false` only to register the very first account, then back. |
| `Email__Host` / `Email__Username` / `Email__Password` | `smtp.resend.com` / `resend` / a Resend API key with *sending access* for `wingedwords.app` |
| `Email__Port` | **`2587`** (see below) |
| `Email__FromAddress` / `Email__ReplyToAddress` | `hello@wingedwords.app` |
| `Turnstile__SiteKey` / `Turnstile__SecretKey` | not set yet (bot check off; see its section) |

On the site service: `API_BASE_URL` = `https://api.wingedwords.app/api` (a plain https URL; the container refuses anything else).

**Things that bit us on the first deploy**
- **Email timed out ("Sending … failed (TimeoutException); retrying").** Render's free instances block the standard outgoing SMTP ports 25, 465 and 587. Resend also listens on **2587** (STARTTLS, same as 587) and **2465** (implicit TLS, needs `Email__UseSsl=true`); `Email__Port=2587` works. Paid instances aren't blocked, but 2587 keeps working there too.
- **Sign-up or login ended in "something went wrong" and the console showed `GET /auth/me` → 401.** Production had no `Jwt:Issuer` / `Jwt:Audience`, so tokens were issued with blank labels and rejected on the next request. Both are now set in `appsettings.json`, and the API refuses to start if either is empty.
- **Render deploys on every push to `main`**, whether or not CI passed. Switching each service to *After CI checks pass* (Settings → Build & Deploy → Auto-Deploy) is still to do.
- **Resend: leave click and open tracking off.** Tracking rewrites the confirmation and reset links through a third-party address, and the privacy policy doesn't mention it.

**First-account recipe** (no readers exist, so nobody can create an invite): set `Registration__InviteOnly` to `false`, register, set it back to `true`, and check that the confirmation email arrives.
