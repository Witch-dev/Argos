# UX reviews

One file per reviewed page or flow, written by the `ux-review` skill (`.claude/skills/ux-review/`). Each file lists findings with priority (P1–P3), size (S/M/L) and whether it is a checkable **Rule** or a **Judgement**. Fixes are done with the `web-design` skill, then the file is updated.

These are not bugs: broken behaviour goes in `bugs/`. This folder is for "it works, but could read and look better".

| Page / flow | Reviewed | Open | Fixed | File |
|---|---|---|---|---|
| Books home (`/books`), re-reviewed after the shelf refresh (27/40) | 2026-10-18 | 0 | 14 | [books-home.md](books-home.md) |
| Community feed (`/feed`), re-reviewed after the shelf refresh (29/40) | 2026-10-18 | 0 | 14 (+1 specced) | [community-feed.md](community-feed.md) |
| Font-size scale: Journal and landing page | 2026-10-12 | 0 | 5 | [font-size-scale.md](font-size-scale.md) |
| Header, sidebar and right rail after the layout changes (re-checked 2026-10-19) | 2026-10-12 | 0 | 6 (+2 no change needed) | [rail-and-header-layout.md](rail-and-header-layout.md) |
| Story viewer (Readings strip) | 2026-10-12 | 0 | 7 | [story-viewer.md](story-viewer.md) |
| Buttons across the site | 2026-10-13 | 0 | 6 | [buttons.md](buttons.md) |
| Book covers in the feed group and People reader card | 2026-10-14 | 0 | 3 | [book-covers-in-feed-and-people.md](book-covers-in-feed-and-people.md) |
| Top bar, right side (search, suggestions, bell, account name) (re-checked 2026-10-19) | 2026-10-14 | 0 | 1 (+1 no change needed, +1 kept) | [top-bar-right.md](top-bar-right.md) |
| Authors feature (author page, search tab, profile rows, follow, favourites, quotes) | 2026-10-16 | 0 | 8 | [authors-feature.md](authors-feature.md) |
| Author page: baseline 24/36 (2026-10-16), after the shelf refresh 27/36 | 2026-10-18 | 0 | 17 (+1 kept) | [author-page.md](author-page.md) |
| Author page audit, baseline (13/20) (re-checked 2026-10-19) | 2026-10-16 | 0 | 7 | [author-page-audit.md](author-page-audit.md) |
| Book page (`/books/:id`), after the shelf refresh (Nielsen 25/36) | 2026-10-18 | 0 | 6 | [book-page.md](book-page.md) |
| Profile and shelves (`/u/:username`), after the shelf refresh (Nielsen 25/36) | 2026-10-18 | 0 | 5 | [profile.md](profile.md) |
| Shell and shared pieces (drawer focus, selected pills, row shelves, rail repeats), found in the Phase 4 sweep | 2026-10-18 | 0 | 6 (+1 no change needed) | [shell-and-shared-pieces.md](shell-and-shared-pieces.md) |
| Journal and Stats (`/journal`, `/stats`) (28/40) | 2026-10-18 | 0 | 5 | [journal-and-stats.md](journal-and-stats.md) |
| Lists (`/lists`, browse, a list) (26/40) | 2026-10-18 | 0 | 5 | [lists.md](lists.md) |
| Search (`/search`) (28/40) | 2026-10-18 | 0 | 2 | [search.md](search.md) |
| Clubs (`/clubs`, a club) (25/40) | 2026-10-18 | 0 | 4 | [clubs.md](clubs.md) |
| Settings (`/settings`, all tabs) (31/40) | 2026-10-18 | 0 | 2 | [settings.md](settings.md) |
| Landing page (`/`, signed out) (31/36) | 2026-10-18 | 0 | 3 | [landing.md](landing.md) |
