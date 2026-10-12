# UX reviews

One file per reviewed page or flow, written by the `ux-review` skill (`.claude/skills/ux-review/`). Each file lists findings with priority (P1–P3), size (S/M/L) and whether it is a checkable **Rule** or a **Judgement**. Fixes are done with the `web-design` skill, then the file is updated.

These are not bugs: broken behaviour goes in `bugs/`. This folder is for "it works, but could read and look better".

| Page / flow | Reviewed | Open | Fixed | File |
|---|---|---|---|---|
| Books home (`/books`) | 2026-10-11 | 0 | 11 | [books-home.md](books-home.md) |
| Community feed (`/feed`) | 2026-10-11 | 0 | 11 (+1 specced) | [community-feed.md](community-feed.md) |
