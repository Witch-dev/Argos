# Winged Words: product context

Read by the `web-design` and `ux-review` skills before any visual work, together with `DESIGN.md`. This file is about **who and why**; `DESIGN.md` is about **how it looks**. Product scope and architecture live in `SPEC.md`.

## What it is

A place to keep track of the books you read and to share them with friends: Letterboxd for books. Log a book (want to read, reading, read, did not finish), rate and review it, follow other readers, build lists, join book clubs. Book data comes from Open Library. Public name **Winged Words**; code name Argos.

## Who uses it

- **Loggers:** want a fast, calm way to record what they read. Most visits are short: log, rate, leave.
- **Reviewers and writers:** write reviews, notes and quotes, and want a page that is pleasant to read and write on.
- **Social readers:** follow friends and see what they read, liked and quoted.
- **Curators:** build themed lists and favourite rows.

Readers are not designers or power users of software. Many read in the evening, often on a phone. The site ships in five languages (English, Spanish, Brazilian Portuguese, German, French), so labels must survive German lengths.

## What it should feel like

A quiet reading room, not a dashboard. Warm, unhurried, a bit literary, with books as physical objects at the centre of it. Social parts should feel like friends recommending books, not a feed competing for attention: no counters shouting, no streak pressure.

## Constraints

- **The cream page background stays** (`#f7f3e8` in Paper): readers find it the most comfortable to read on. Everything else in the look is open.
- Five themes (Paper, White, Warm Gray, Sepia, Dark) must all work.
- Accessibility: WCAG 2.2 AA, 44px tap targets, everything usable by keyboard.
- Small team, free hosting tier: no heavy assets, no animation that costs much.

## Voice

Plain, friendly and short. Say what a control does ("Add to favourites", "Show more quotes"). Errors say what happened and what to do. Empty states invite the first step and link to it. No jargon from the code (no "work", "log entry", "edition id" in the interface).
