# The website's container runs nginx as root

**Priority:** P2 · **Size:** S · **Area:** Deploy, security · **Found:** 2026-10-21 (Semgrep scan, `dockerfile.security.missing-user-entrypoint`) · **Status:** Open

## What happens

`Apollon/web/Dockerfile` has no `USER` line, so the nginx container that serves the website runs as root. If someone found a hole in nginx, they would have root inside that container. It serves only static files and holds no secrets, so the damage would be limited, but there's no reason to give it root.

The API container had the same finding and was fixed the same day (`USER $APP_UID` in `Apollon/Dockerfile`, checked by building the image: it runs as `app`, uid 1654).

## Why it wasn't fixed on the spot

`web/docker/entrypoint.sh` writes `config.js` into `/usr/share/nginx/html` and the security headers into `/etc/nginx/snippets` at startup, and the plain `nginx` image expects root for its pid file and cache folders. A non-root switch changes how the live site starts, so it needs a test of the built image, not just an edit.

## Suggested fix

- Switch the runtime stage to `nginxinc/nginx-unprivileged:1.27-alpine` (runs as uid 101, already listens on 8080, pid and cache in `/tmp`).
- In the Dockerfile, as root before `USER 101`: `chown 101 /usr/share/nginx/html` and create `/etc/nginx/snippets` owned by 101, so the entrypoint can still write its two files.
- Build it, run it with `API_BASE_URL` set, and check: the page loads, `config.js` has the right address, and `curl -I` shows the security headers. Then deploy and do the header checks in `DEPLOY.md`.
