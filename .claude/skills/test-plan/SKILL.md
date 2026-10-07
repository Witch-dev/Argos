---
name: test-plan
description: Use when writing or updating a manual test plan (a checklist a person follows in the browser) for an area of Argos — triggers on "/test-plan", "write a test plan for X", "what should I test manually for X", "update the checklist for X". Turns the area's specs, the current code and open bugs into numbered "do this → expect that" steps in `Argos/testing/<area>.md`. Not for automated tests: xUnit/Vitest coverage is the `tester` agent's job.
---

# Argos manual test plan

Writes the checklist a person (or a later Playwright run) follows to check one area of the app by hand. Automated tests prove the code does what the code says. This checklist proves the app does what a **reader** expects, on a real screen.

Output goes in `Argos/testing/`. One file per area, plus `_shared.md` for the checks that apply to every page.

## Step 1 — Pick the area

The user names an area. Plans follow **what a reader does**, not spec files, because bugs often hide where one feature hands off to another (importing a book, then reviewing it, then seeing it in a friend's feed). Starting map, adjust it to what the app really has:

| Area file | What a reader does | Specs to read |
|---|---|---|
| `accounts.md` | Sign up, confirm email, log in/out, forgot password, settings, language | `account-system.md`, `languages.md`, `avatar-picker.md` |
| `landing.md` | Logged-out visitor's first look | `landing-page.md` |
| `books-and-search.md` | Find a book, open its page | `live-book-search.md` |
| `shelves-and-progress.md` | Shelve, track progress, finish, reread, DNF, import | `reading-progress-tracking.md`, `reading-stories.md` |
| `reviews.md` | Rate, review, privacy of reviews | `reviews-improvements.md` |
| `lists.md` | Create, order, tag, share lists | `book-lists-improvements.md` |
| `clubs.md` | Find, join, discuss, run a club | `book-clubs.md`, `book-club-improvements.md`, `clubs-directory-refresh.md` |
| `writing-and-posts.md` | Annotations, writings, posts | `writings-and-annotations.md`, `book-posts.md`, `writing-feed-card-and-modal.md` |
| `feed-and-home.md` | Home dashboard, feed, news | `feed-redesign.md`, `home-dashboard-redesign.md`, `book-news-feed.md` |
| `social.md` | Find readers, follow, profiles, blocks | `find-readers-discovery.md` |

If the area isn't in the map, or a new spec doesn't fit, add a row here as part of the change.

## Step 2 — Gather what the area should do

Read, in this order, and only what the area needs:
1. The area's `Argos/specs/*.md`: the Status line, then the Problem, Clarifying decisions, Design and Explicitly out of scope sections. Skip the Tasks checklist and progress notes (they're long and describe how it was built, not what a reader sees), unless you need one to settle a spec-vs-code question.
2. The code that exists **today** in `C:/Users/jramo/Apollon`: the routes in `web/src/` (pages, buttons, dialogs) and the controller rules in `src/Argos.Api` (who may do what, limits, error codes). The plan tests the app as built, not as first imagined. If the spec and the code disagree, write the step from the spec, and list the disagreement under "Questions" at the bottom of the plan.
3. `Argos/bugs/README.md`: open bugs in this area become steps marked `known bug: <file>`, so the tester knows the failure is expected.
4. The existing `Argos/testing/<area>.md`, if there is one. Update it in place: keep results already recorded, remove steps for removed features, add new ones.

Skip features the specs mark as not built yet.

## Step 3 — Write the steps

Each step is one row: what to do, and what you should see. Concrete enough that someone who has never seen the app (or a Playwright script) could follow it without guessing.

- **Start from a known state.** Each section says who is logged in and what data must exist ("Logged in as reader A, who has 2 books on Currently reading"). Use the test readers below.
- **One action, one expected result per row.** "Click Save → the dialog closes and the list shows the new title" is fine. Three actions in one row is not.
- **Expected results are visible things**: text on screen, a toast, a page change, a count going up. Not "it works".
- **Cover, for each feature:**
  - the normal path a reader takes;
  - empty states (no books, no friends, nothing posted yet);
  - limits and bad input (too long, blank, special characters and accents, duplicates);
  - who can see what: owner, a follower, a stranger logged in, someone logged out, a blocked reader; private vs public;
  - doing it twice, undoing it, deleting it, and what happens to things that pointed at it;
  - unconfirmed email, where the action posts something others can read;
  - the hand-off to the next feature (a finished book shows up in the feed, on the profile, in stats).
- **Skip what automated tests already prove well**, like exact validation messages for every bad field. One bad-input step per form is enough; spend the steps on what only a screen shows.
- Things that need a real phone, a real inbox or human judgment ("is this wording clear?") get the tag `👤 person`. Everything else could later be run by Playwright.

## Step 4 — File format

```markdown
# Test plan — <Area>

**Covers:** <specs read> · **Written against:** Apollon commit <short hash> on <YYYY-MM-DD>
**Before you start:** <test readers and data needed, and how to create them>

## <Section: one feature or one journey>

**Start:** <who is logged in, what data exists>

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 1 | ... | ... | | | |

## Questions
- <spec vs code disagreements, unclear expected behaviour>
```

- Number steps across the whole file (1, 2, 3 … not restarting per section), so a bug can say "clubs.md step 14".
- Result columns are left empty: the tester fills ✅, ❌ or — (not applicable).
- Get the commit hash with `git -C C:/Users/jramo/Apollon log -1 --format=%h`.

## Step 5 — Shared checks

If `Argos/testing/_shared.md` doesn't exist, create it. It holds the checks that apply to every page, so area plans don't repeat them:
- phone width (about 375px) and desktop; nothing cut off, no sideways scrolling;
- light and dark theme;
- all 5 languages (en, es, pt-BR, de, fr): no raw keys like `clubs.title`, no English left over, long German words don't break layouts;
- loading, error (API stopped) and empty states;
- keyboard only: Tab reaches every button, focus is visible, Escape closes dialogs;
- logged out: pages that need an account send you to log in, and come back afterwards.

An area plan adds a row here only for something new that applies everywhere.

## Test readers

Plans use fresh readers created through the API, not the seeded `alice_reads`: **reader A** (main tester), **reader B** (follows A), **reader C** (a stranger), **reader D** (blocked by A). Say in "Before you start" what each needs (books shelved, a club, a private list). How to seed them through the API (register, follows, logs, lists, clubs) is in the `browser-check` skill.

## Step 6 — Finish

- Tell the user the file path, how many steps it has, and what's in "Questions".
- Add a CHANGELOG entry only when creating a new plan, not for small updates.
- If `Argos/testing/README.md` exists, update this area's row (step count, "written against" date). Don't create the README; the user will ask for it.
- Failures found while **running** a plan become bug files in `Argos/bugs/` as usual, with a link to the step number.
