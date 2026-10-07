# Argos: working notes for Claude

Argos is a Letterboxd-like app for books. This folder holds the planning, not the code.

## Two repos

- **Code:** `C:/Users/jramo/Apollon` (git, GitHub `Witch-dev/Apollon`, private). Backend in `src/` (`Argos.Api`, `Argos.Domain`, `Argos.Infrastructure`), tests in `test/Argos.Tests` (`Unit/`, `Integration/`), frontend in `web/`. Run `git diff` / `git status` there for code changes.
- **Planning:** this folder (git, GitHub `Witch-dev/Argos`, private). `SPEC.md` (architecture §5, versions §6, data model §7, constraints §8), `ROADMAP.md` (decides build order: the next task is the first unticked box), `specs/*.md` (one per feature), `bugs/*.md`, `FUTURE-IDEAS.md`, `CHANGELOG.md`. `backend-tasks/` and `frontend-tasks/` are the finished original build, history only.
- Commit each repo separately, staging files by name. Another Claude session may be working at the same time. `gh` is not installed, so the user checks CI on GitHub's Actions tab.

## Building and checking

- **Build in Release.** The user's dev API usually runs and locks `bin/Debug`. Use `dotnet build -c Release` and `dotnet test test/Argos.Tests -c Release`. For EF migrations: `dotnet build src/Argos.Api -c Release`, then `dotnet ef migrations add|database update --project src/Argos.Infrastructure --startup-project src/Argos.Api --configuration Release --no-build`. Don't kill the running API; say it needs a restart after backend changes.
- **Frontend** (in `web/`): `npm test` (Vitest), `npm run build` (typecheck + build), `npm run lint`.
- **Seeing it work in a browser:** the `browser-check` skill (side ports 5259/5174, logging in through the API, seeding test readers).

## Rules that apply to every change

- **Translations:** every on-screen text (including `aria-label`, `title`, placeholders) goes through `t('…')` with a key in all five `web/src/locales/<lang>/` files (en, es, pt-BR, de, fr). `locales.test.ts` fails if one is missing. A new backend error message needs a code in `src/Argos.Api/Errors/ErrorCodes.cs` and a translation under `errors.codes`.
- **Styling:** only the design tokens in `web/src/index.css` (5 themes). The `web-design` skill has the rules.
- **Architecture:** Controllers → Services → Repositories (EF Core) → PostgreSQL. Open Library only through `OpenLibraryClient`. No microservices, queues or search clusters.

## Records to keep

- `CHANGELOG.md`: one line per real change, written when it's finished: `- YYYY-MM-DD — What changed → where the detail is` (a spec, a bug file, or `Apollon <hash>` for a small fix, whose commit message then carries the detail). Read only its top ~15 lines and add the line at the top of the current month's section.
- `bugs/`: one file per bug that isn't fixed on the spot, plus a row in `bugs/README.md` (priority P1–P3, size S/M/L).
- `specs/<feature>.md`: one file per feature, with Backend / Frontend / Verification task headings. Re-read it against what was built before ticking tasks.
