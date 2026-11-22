# Security watch log

One entry per `/security-watch` run, newest first. Items are `open`, `fixed <date>` or `not affected`. The skill is `.claude/skills/security-watch/`.

## 2026-11-22
Window: 2026-11-15 → 2026-11-22 (first run). Checked: NuGet + npm audit, .NET 10.0.15, Node 22, 4 base images, GitHub advisories, CI, Dependabot PRs, 7 searches.
- ACT: .NET 10.0.15 (2026-11-10, 16 CVEs, six ASP.NET Core denial-of-service). Packages were on 10.0.13 (Dependabot PR #29 stuck on an old npm audit failure). The images already had runtime 10.0.15 (first reported as stale: MCR digests differ by Accept header; the skill now compares versions); took the 2026-11-18 OS rebuilds anyway — fixed 2026-11-22 (Apollon 7296ee5)
- ACT (check): PostgreSQL 17.12 (2026-11-12, 52 CVEs, worst an authenticated code execution, CVE-2026-6460). Confirm in Render's dashboard the live DB shows 17.12; re-pull local `postgres:17` — open
- PLAN: React Router, 7 advisories on 2026-11-18 (not yet in GitHub's database). The two named are server-rendering / Node server denial-of-service, which our browser-only app doesn't run; still bumped 7.18.4 → 7.18.6 — fixed 2026-11-22 (Apollon 7296ee5)
- PLAN: npm audit, 9 moderate: minimatch denial-of-service through eslint ≤ 10.14.0 and typescript-eslint ≤ 8.72.2. Lint tools only. eslint 10.15.0, typescript-eslint 8.73.0, npm audit 0 — fixed 2026-11-22 (Apollon 7296ee5)
- PLAN: Node 22.23.5 security release (2026-11-11); `node:22-alpine` digest was stale. Build stage only — fixed 2026-11-22 (Apollon 7296ee5)
- FIXED: nginx "nginx2root" (CVE-2026-123007 and 9 more, 2026-11-18), fixed in 1.30.7 — fixed 2026-11-22 (Apollon ff434e3); base image digest is current
- Nothing new: NuGet advisories for our packages, npm supply-chain attacks (none reported in the window), Alpine/OpenSSL/libxml2, Render/Cloudflare/Resend/Sentry incidents.

