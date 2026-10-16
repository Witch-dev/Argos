# Product

<!-- structure adapted from Impeccable's product record (Apache 2.0, see THIRD-PARTY-NOTICES.md) -->

Who Winged Words is for and why, read before any frontend work together with `DESIGN.md` (which is only about the look). Scope and architecture live in `SPEC.md`. Facts marked **(to confirm)** are assumptions waiting for the user's answer; don't treat them as settled.

## Platform

web (a responsive site and PWA; a native app is out of scope for now, `ROADMAP.md`)

## Users

- **Loggers:** want a fast, calm way to record what they read and rate it. Most visits are short: log, rate, leave.
- **Reviewers and writers:** write reviews, notes, writings and quotes, and want a page that is pleasant to read and write on.
- **Social readers:** follow friends and see what they read, liked and quoted.
- **Curators:** build themed lists and favourite rows.
- Readers are not designers or software power users.
- **(to confirm)** Many read and log in the evening, often on a phone.
- **(to confirm)** The first readers are a closed beta of friends, many of them Spanish speakers.

## Product Purpose

A place to keep track of the books you read and share them with friends: Letterboxd for books. Log a book (want to read, reading, read, did not finish) with dates, rating and review; follow readers; build lists; join book clubs; follow authors. Success: a reader replaces their spreadsheet or Goodreads with it and comes back daily (`SPEC.md` §1).

## Positioning

Discovery through people you follow, not an opaque algorithm (`SPEC.md` §1); no streak pressure or engagement tricks; private by choice (private accounts, blocks, reading visibility); your data is yours (import from Goodreads and StoryGraph, full export, deletion).

## Operating Context

Book data comes from Open Library (covers, authors, editions), so records can be incomplete or odd (anthologies with dozens of authors, missing covers, merged authors). Five languages: English, Spanish, Brazilian Portuguese, German, French; German is the longest. Free hosting tier: keep assets light.

## Capabilities and Constraints

- Everything in `SPEC.md` §2–§4 and `ROADMAP.md` (built stages are ticked).
- WCAG 2.2 AA, 44px tap targets, everything usable by keyboard.
- Five themes (Paper, White, Warm Gray, Sepia, Dark) must all work.
- Terminology (one word per idea, in every language): *shelf* (want to read / reading / read / did not finish), *log* only in code, *writing* (a note or a longer piece), *review* (text on a logged book), *list*, *club*, *Feed*. Code words like "work", "log entry" and "edition id" never reach the interface.

## Brand Commitments

- Public name **Winged Words** (code name Argos); the winged-book logo.
- **The cream page background stays** (`#f7f3e8` in Paper), chosen by the user for reading comfort. Everything else in the look was open and is now set in `DESIGN.md`.
- Feel: a quiet reading room, not a dashboard; warm, unhurried, a bit literary, books as physical objects; social parts feel like friends recommending books, not a feed competing for attention.
- Voice: plain, friendly and short. Controls say what they do; errors say what happened and what to do; empty states invite the first step and link to it.

## Evidence on Hand

Real Open Library data (covers, author photos, bios) and the readers' own logs. There are **no** testimonials, user counts, press quotes or ratings to show publicly yet: never invent them on the landing page or anywhere else.

## Product Principles

**(to confirm)** Drafted from `SPEC.md` and the design conversations of 2026-10-16.

1. Logging a book is fast from anywhere: the most frequent action is never more than a few taps away.
2. Reading comes first: text is comfortable to read and nothing performs behind it.
3. People over algorithms: show who read, liked and quoted, always with names, never anonymous counts alone.
4. Private by default where it matters: privacy rules are visible, predictable and never leak.
5. Calm, not compulsive: no streaks, badges or counters designed to pull readers back.

## Accessibility & Inclusion

WCAG 2.2 AA; reduced motion respected; works with screen readers, keyboard only and 200% zoom; five languages with real plurals and local number and date formats.
