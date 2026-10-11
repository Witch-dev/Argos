# Stats and yearly goals — manual test plan

Spec: `specs/yearly-goal-and-stats.md`. Run `_shared.md` once on the Stats page and on Books home. You need three readers: **A** (the one you test as), **B** (follows A) and **C** (a stranger, or signed out). Use one account with several finished books; give some books a page count and some none.

Mark each row 📱 phone / 🖥️ desktop when done.

| # | Do this | Expect | 📱 | 🖥️ | Notes |
|---|---|---|---|---|---|
| G1 | As a fresh reader A, open **Stats** in the sidebar | Title, the line "Stats and goals are free, always.", a year picker on this year, a "Reading goal" card with "Set a goal", and a kind empty message (no empty charts) | | | |
| G2 | Click **Set a goal**, pick Books, enter 12, leave "Show on my profile" off, Save | Card shows "0 of 12 books", an empty bar, "On track" | | | |
| G3 | Open Books home | The right column shows the same goal card with "See all your stats" (one link only) | | | |
| G4 | Log a book as Read, finished today | Goal card (Stats and home) shows "1 of 12 books" without a manual reload | | | |
| G5 | Edit the goal: switch to Pages, 3000 | "N of 3,000 pages" counts the book's page count. A finished book with no page count adds nothing and the card says how many have none | | | |
| G6 | Edit and enter 0, then 10001 (Books) | Message "Enter a whole number from 1 to 10,000"; nothing is saved | | | |
| G7 | **Remove** the goal | Card goes back to "Set a goal"; the profile line (G11) disappears | | | |
| G8 | Log a **reread** of a book finished this year, then mark one book **Did not finish** with a date this year | The reread counts again toward the goal; the DNF does not. Stats tiles show "Rereads 1" and the DNF count and percentage | | | |
| G9 | Year picker: choose last year, next year, All time | Last/next year show their own numbers and a goal card you can set. All time shows one bar per year (quiet years as 0), no goal for an old year beyond last year | | | |
| G10 | On the Stats page check: books and pages per month, top authors (click one), genres, moods, pace, ratings, longest and shortest book (click one) | Numbers are written next to every bar; author link opens a search; book links open the book page; genre and mood names are translated | | | |
| G11 | In the goal form tick **Show on my profile**, Save. As B, open A's profile | One line "Reading goal 2026: N of M books" with a bar under the header | | | |
| G12 | Make one of A's finished books **Private** (Journal). As A, look at the goal; as B (follows) and as C (stranger) look at A's profile | A's own card still counts it. B and C each see one fewer on the profile line (Private is hidden from everyone). Then set the book to Followers: B sees it counted, C does not. The profile line never shows more than the viewer may see | | | |
| G13 | Untick "Show on my profile". As B reload A's profile | No goal line | | | |
| G14 | As C open another reader's `/api/users/<name>/goal` with no public goal | 404; the profile page shows no line and no error | | | |
| G15 | A blocks C. As C open A's profile | Profile is not found, as before (no goal either) | | | |
| G16 | As B open `/stats` | B sees only B's own numbers, never A's | | | |
| G17 | Settings → Download my data | The zip has `goals.csv` with year, unit, target and "shown on profile" | | | |
| G18 | Try `/stats?year=1800` and `/stats?year=2999` in the address bar | A clear error, not a broken page | | | |
| G19 | Switch to Español, Português, Deutsch, Français on Stats and the goal form | No raw keys, plurals read well ("1 libro" / "3 libros"), nothing cut off on a phone | | | `👤 person` for wording |
| G20 | Five themes on the Stats page | Bars and goal bar keep contrast in every theme | | | |

## Known limits (not bugs)

- Years run on UTC, so a book finished late on 31 December in a western time zone can count toward the next year.
- Stats count finished (Read) logs that have a finish date; a Read log with no finish date is not counted.
