# Docker base images follow a tag, and workflows don't limit their token

**Priority:** P3 · **Size:** S · **Area:** CI, Docker · **Found:** 2026-10-22 (OWASP Top 10 pass, A03 "Software Supply Chain Failures") · **Status:** Fixed 2026-10-22

## What happens

Two small hardening gaps; the rest of the supply chain (actions pinned to commit hashes, Dependabot with a cooldown, Trivy, gitleaks, package advisories in CI and `precheck.ps1`) is in place.

1. **Base images by tag.** `Dockerfile` uses `mcr.microsoft.com/dotnet/sdk:10.0` and `aspnet:10.0`; `web/Dockerfile` uses `node:22-alpine` and `nginxinc/nginx-unprivileged:1.30-alpine`. A tag is a label the publisher can move, so two builds of the same commit can get different images, and a tampered image would be picked up silently. A digest (`@sha256:…`) names exactly one image.
2. **No `permissions:` block** in `.github/workflows/ci.yml` or `security.yml`. Each run's `GITHUB_TOKEN` then gets the repository's default permissions, which may include write access. Neither workflow needs more than reading the code.

## Suggested fix

1. Add the digest after each tag (`FROM node:22-alpine@sha256:… AS build`). Dependabot's `docker` entry already exists and updates digests in its weekly PRs, so this doesn't add upkeep.
2. Add `permissions: contents: read` at the top of both workflows (the Security workflow may need `security-events: write` only if it uploads SARIF results; check before adding).

## Fixed

2026-10-22.

1. All four base images carry their multi-platform digest after the tag (`sdk:10.0`, `aspnet:10.0`, `node:22-alpine`, `nginx-unprivileged:1.30-alpine`); Dependabot's `docker` entry (`/` and `/web`) moves them.
2. `permissions: contents: read` at the top of `ci.yml` and `security.yml`. No step uploads SARIF or uses the token (Trivy and gitleaks run as plain `docker run`).

Not pinned: the `aquasec/trivy` and `zricethezav/gitleaks` images run inside `security.yml`, which have exact version tags but no digest, and Dependabot doesn't update images named in a `run:` line.
