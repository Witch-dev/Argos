# What Winged Words runs on

Versions of code packages and images come from Apollon's files (SKILL.md step 2). This list is for what those files don't show, and for how exposed each part is. Last checked 2026-11-22.

## Exposed to the internet (anyone can send it a request)

| Part | What | Where the version lives |
|---|---|---|
| Website server | nginx serving the built React app, plus link-preview cards and the sitemap. Base image `nginxinc/nginx-unprivileged` (Alpine Linux); nginx and its modules installed on top from nginx.org at an exact version; libxml2/libexpat also pinned | `web/Dockerfile` (`FROM … AS runtime` and its `RUN` lines), `web/nginx.conf`, `web/entrypoint.sh` |
| API | ASP.NET Core 10 on the `mcr.microsoft.com/dotnet/aspnet:10.0` image (Debian), with Identity + JWT login, rate limits | `Dockerfile`, `src/*/*.csproj` |
| Code inside the API that handles outside input | MailKit/MimeKit (email), SkiaSharp (reads cover images downloaded from Open Library), CsvHelper and ExcelDataReader (Goodreads/StoryGraph imports uploaded by readers), Swashbuckle (API docs page) | `src/*/*.csproj` |
| Code in readers' browsers | React 19, React Router 7, TanStack Query 5, i18next, Sentry browser SDK | `web/package.json` |

## Behind the API (not directly reachable)

| Part | What | Notes |
|---|---|---|
| Database | PostgreSQL on Render (paid plan), Npgsql driver | Version set in Render's dashboard, not in code. Local dev uses `postgres:17` in `docker-compose.yml`. Render applies minor PostgreSQL updates itself; a security release still matters if it needs us to do something |
| Book data | Open Library API (outside call, only through `OpenLibraryClient`) | A compromise there means bad data or images coming in, which SkiaSharp then reads |

## Outside services (no version on our side, watch for incidents and breaches)

| Service | Used for |
|---|---|
| Render (Virginia, US East) | Hosts the API, the website and the database; Cloudflare sits in front of it |
| Cloudflare | Render's front door; Turnstile bot check on login and sign-up |
| Porkbun | The `wingedwords.app` domain and its DNS |
| Resend | Sending email (sign-up confirmations, feedback copies), over SMTP |
| Sentry | Error reports from the API and the browser |
| GitHub | Code (private repos), CI, Dependabot |

A breach at one of these can mean rotating a key (Render settings, Resend, Turnstile, Sentry DSN): say which key in the report.

## Only on our machines and in CI (lower urgency)

.NET SDK image (build stage), Node 22 Alpine image (build stage), Vite, Vitest, TypeScript, ESLint, Prettier, Testing Library, jsdom, xUnit, coverlet, Mailpit (local email catcher), GitHub Actions used in `.github/workflows/`, Trivy and gitleaks (the scanners themselves). A hole here matters mainly if it lets a malicious package run during `npm install` or a build (supply-chain attacks), so those are never "just dev".
