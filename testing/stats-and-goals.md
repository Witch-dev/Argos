# Stats and yearly goals — manual test plan

Specs: `specs/yearly-goal-and-stats.md`, `specs/stronger-stats.md` · **Written against:** Apollon e30751e plus the uncommitted Stronger stats work, 2026-10-24. Run `_shared.md` once on the Stats page and on Books home. You need three readers: **A** (the one you test as), **B** (follows A) and **C** (a stranger, or signed out). Use one account with several finished books; give some books a page count and some none.

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
| G10 | On the Stats page check: books and pages per month, top authors, genres, moods, pace, ratings, longest and shortest book (click one) | Numbers are written next to every bar; book links open the book page; genre and mood names are translated. Author names are not links any more: the row opens the books sheet (G24) | | | |
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

## Stronger stats: the books behind each number

**Start:** reader A with 2–3 finished books in 2025 and about 8 in 2026. The 2026 books need:
- Print, Ebook and Audio, plus one with no format;
- page counts 250, 300, 499, 500 and 650, plus one with none;
- at least 3 with a start and a finish date, one of them started and finished the same day;
- first published in at least three decades (e.g. 1950s, 1990s, 2010s);
- an English and a Spanish edition chosen, and two books with no edition;
- reviews answering Plot, Character and Mix;
- ratings, genres (fiction and non-fiction), moods and pace;
- one graphic novel.

A also needs one Read log with **no finish date** and one DNF. The `browser-check` skill can seed all of this.

| # | Do this | Expect | 📱 | 🖥️ | Notes |
|---|---|---|---|---|---|
| G21 | As a fresh reader with nothing finished, open Stats for this year and for All time | Only the empty message. No "How you read", "What you read" or decades card, no comparison line and no no-date line | | | |
| G22 | As A on 2026, click the March column of Books per month | A sheet opens headed "Read in March 2026", with a count line that matches the column. Books are newest finish first, each with cover, title, author, "Finished …" and the rating when there is one | | | |
| G23 | Click a book's title in the sheet | The book page opens | | | |
| G24 | Open the sheet from an author row | The heading names the author. The sheet has "Go to their author page", or "Search for their books" when the author has no page | | | |
| G25 | Click every other row and column on the page: genre, mood, pace, rating, format, length, plot or characters, fiction/non-fiction/not sorted, audience, graphic novels, language, decade | Each one opens a sheet whose heading names it ("Rated 4★", "First published in the 1950s"…) and whose count equals the number on the bar | | | |
| G26 | Look at a column or row with 0 (e.g. a month with no books) | It can't be clicked. A screen reader says "March: 0", not "Show them" | | | |
| G27 | Keyboard only: Tab to a bar, press Enter, then Escape | Focus is visible on the bar and the sheet opens. Escape closes it and focus goes back to the same bar | | | |
| G28 | On All time, click a year column | A sheet "Read in 2025" (or 2026) with that year's books | | | |
| G29 | Look at the "How you read" card | "Usually N days" (a .5 median rounds up), "from N books with a start and finish date", and fastest and slowest with the book's title. The book started and finished the same day counts as 1 day | | | |
| G30 | Change dates so only 2 books in the year have both a start and a finish date | The "how long" part disappears and the rest of the card stays | | | |
| G31 | Look at Format and Length in the same card | Format counts Print, Ebook, Audio and "Not said". Length puts 250 in "Under 300 pages", 300 and 499 in "300 to 499 pages", and 500 and 650 in "500 pages or more". The audiobook and the book with no page count are in no length group | | | |
| G32 | Look at Languages in the same card | English and Spanish are named in the site language (in Español: "inglés", "español"). The line "2 books have no edition chosen…" opens a sheet "No edition chosen" with a hint to pick an edition | | | |
| G33 | Pick an edition for one of those two books, then go back to Stats | That language's bar goes up by one and the no-edition line says 1 book | | | |
| G34 | Open Stats as a reader whose finished books have no edition at all | The Languages part is hidden | | | |
| G35 | Look at the "What you read" card | Fiction, Non-fiction and Not sorted (a book with no genres), the audience rows, and "1 of them is a graphic novel", which opens its sheet | | | |
| G36 | Look at the "When they were written" card | One column per decade from the oldest to the newest, with empty decades between them as 0 and labels in full ("1950s"). "N books have no publication year" is a plain note, not a link | | | |
| G37 | Look at the "Books that stand out" shelf | Longest, shortest, oldest and newest book. A book that is two of them stands there once, with both lines | | | |
| G38 | Look under the summary tiles on 2026 | A line like "+5 books and +1,339 pages compared with 2025": plain text, no red or green, with "−" when there are fewer | | | |
| G39 | Pick 2025 when 2024 has nothing finished | No comparison line | | | |
| G40 | Look at the bottom of the summary, on a year and on All time | "1 finished book has no date, so it isn't counted. Show it" opens "No finish date" with the book. Add its finish date on the book page: the line is gone and the book counts in its year | | | |
| G41 | As B (follows A), open `/api/stats/books?kind=genre&key=fantasy&year=2026` | Only B's own books (or an empty list), never A's. A's private books never appear for anyone but A | | | |
| G42 | In the address bar, open `/api/stats/books?kind=nonsense`, `?kind=month&key=13&year=2026` and `?kind=month&key=3` (no year) | A 400 with an error message each time, never a 500 | | | |
| G43 | At phone width (375px), open a sheet, then scroll the decades chart | The sheet comes up from the bottom and scrolls when long. The decade chart scrolls sideways inside its card, and the page itself never scrolls sideways | | | |
| G44 | In all five themes, look at the bars, the focus ring and the sheet | Readable in every theme. Hovering a bar on a computer changes it; tapping one on a phone leaves no stuck hover | | | |
| G45 | Switch to Español, Português, Deutsch and Français on the new cards and sheets | No raw keys. "Rated 4★", decade and length labels are translated, and German labels aren't cut off | | | `👤 person` for wording |

## Club rating date

**Start:** reader A in a club (or buddy read) whose round is finished and not yet rated by A.

| # | Do this | Expect | 📱 | 🖥️ | Notes |
|---|---|---|---|---|---|
| G46 | Rate the round's book | The book is marked Read with today's date on your own calendar | | | |
| G47 | With the computer's time zone set west of UTC (e.g. Mexico City), rate a club book late in the evening, when UTC is already the next day | The finish date is your local day, and the book counts in that day's year and month | | | `👤 person` |

## Known limits (not bugs)

- Finish dates are the calendar day the reader picks. Since Stronger stats, club ratings send the reader's own date too. Club-rated logs saved before that keep their UTC moment.
- A Read log with no finish date isn't counted in any year. The page now says so (G40).
- A book already marked Read with no finish date stays undated when it's rated in a club.
- Books with no publication year have no list of their own: the year comes from Open Library and the reader can't fix it.
