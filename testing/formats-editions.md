# Test plan — Formats and editions

**Covers:** `specs/formats-editions.md` (Phase 1 better default cover, Phase 2 your edition, Phase 3 format and audiobooks) · **Written against:** Apollon commit 8bf7d02 on 2026-10-13
**Before you start:** Run `_shared.md` once on the book page with the log form open, and on the club page. Create fresh readers through the API (see the `browser-check` skill): **reader A** (main tester), **reader B** (follows A), **reader C** (a stranger, also try signed out). A and B join one club, whose current book is *One Hundred Years of Solitude* (`OL274505W`), with a checkpoint "Part 1" up to page 100 due tomorrow and "Part 2" up to page 200 in a week. Open Library must be reachable for the edition steps.

## Default cover (Phase 1)

**Start:** reader A logged in.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 1 | Search "Solaris" and open Stanisław Lem's book | The large cover is the Polish 1961 first edition, sharp (not a blurry medium image) | | | |
| 2 | Open *Norwegian Wood* (Murakami) | The Japanese original's cover, not a German or English translation | | | |
| 3 | Open *Dune* | The English 1965 first edition cover | | | |
| 4 | Compare a search result thumbnail with the book page cover for Solaris | They may differ (search uses Open Library's own pick; accepted in the spec) | | | |
| 5 | Open a book with no covers at all on Open Library | The cover placeholder, the page otherwise works | | | |

## Your edition (Phase 2)

**Start:** reader A logged in, no logs of *One Hundred Years of Solitude* yet.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 6 | Open the book, click **Log this book**, choose Currently reading | The form shows an **Edition** row with "No specific edition" and **Change** | | | |
| 7 | Click **Change** | A list opens: "No specific edition" first, then editions newest first, each with cover, language · publisher · year and page count; a Language filter | | | |
| 8 | Filter by Spanish | Only Spanish editions remain | | | |
| 9 | Pick the Sudamericana 1967 edition | The row shows its cover and "Spanish · Sudamericana · 1967"; **Total pages** fills with its page count | | | |
| 10 | Type 500 in Total pages, then pick another edition | Total pages stays 500 (a typed number is never replaced) | | | |
| 11 | Save | Your shelf, journal, the "Currently reading" rail and your story all show the edition's cover | | | |
| 12 | As reader C, open the book page | The shared default cover, never A's edition cover | | | |
| 13 | As reader A, log the book again (a reread) | The new log starts with the same edition | | | |
| 14 | Edit the log, Change → "No specific edition", Save | The book's shared cover is back on A's screens | | | |
| 15 | Stop the network to Open Library (or wait for an outage), click Change | A message says Open Library can't be reached; the form still saves | | | |
| 16 | Import a Goodreads CSV with an ISBN of a Spanish edition | The imported log carries that edition and its cover | | | |
| 17 | Settings → download your data, open `logs.csv` | Edition columns are filled for the logs with one | | | |

## Format and audiobooks (Phase 3)

**Start:** reader A logged in, reading *One Hundred Years of Solitude* in print (page 100 of 400). Reader B has no log of it yet.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 18 | As B, open the book, **Log this book**, Currently reading | A **Format** select shows "Not said", with Print, Ebook and Audiobook | | | |
| 19 | Pick **Audiobook** | Total pages / Current page disappear; **Length** and **Listened so far** appear, each as hours + minutes, stacked | | | |
| 20 | Enter Length 12 h 0 min, Listened 4 h 10 min, Save | The quick log on the book page shows a bar at about 35% and "4 h 10 m of 12 h" | | | |
| 21 | Click **+15 min** | "4 h 25 m of 12 h", the bar moves | | | |
| 22 | Edit the log: enter Listened 13 h | Saving shows "Your position can't be past the end of the audiobook." | | | |
| 23 | Change Edition to an "Audio CD" edition on a log whose Format is "Not said" | Format switches to Audiobook by itself | | | |
| 24 | Pick a "Hardcover" edition on an audiobook log | Format stays Audiobook; no page count is filled in | | | |
| 25 | As B, open the home page stories strip, open your own story | "35% · 4 h 10 m of 12 h" (or the current place) under the bar | | | |
| 26 | As A (follows nobody) / reader C | B's story isn't visible unless they follow B, as before | | | |
| 27 | As B, open the club page | "What's next" says "You're at 4 h 10 m of 12 h"; the members list shows A at 25% and B at about 35%, both bars with a checkpoint marker at 25% (page 100 of A's 400 pages) | | | |
| 28 | Hover / long-press B's marker | "Next checkpoint: Part 1 (~p. 100)" | | | |
| 29 | Make A's log have no page count, reload the club | B's bar has no marker (no reader's page count to measure against); B shows On track | | | |
| 30 | On the quick log click **Finished!** and skip the rating | The book moves to Read; editing the log shows Format Audiobook and Length 12 h, no "Listened so far" | | | |
| 31 | Log another book as Read, Audiobook, Length 7 h | — | | | |
| 32 | Open **Stats** for this year | Books read counts both audiobooks; Pages read doesn't change; an **Hours listened** tile shows 19; "books without a page count" doesn't mention them | | | |
| 33 | Set a **Pages** goal | The goal card says "2 audiobooks aren't counted: a pages goal counts pages, not hours." | | | |
| 34 | Change it to a **Books** goal | Both audiobooks count; no audiobook note | | | |
| 35 | Log a reread of the audiobook | The new log starts as Audiobook | | | |
| 36 | Log a reread and type page numbers instead | It saves as a print reading (Format "Not said"), not refused | | | |
| 37 | Switch a print log to Audiobook | The page fields go; save works with the minutes only | | | |
| 38 | Settings → download your data, open `logs.csv` | Columns "Format, Total minutes, Current minute" filled for the audiobook logs | | | |
| 39 | Switch the site to Deutsch, Español, Português and Français and repeat 19–20 and 32 | Every label translated ("Hörbuch", "Std."…), no raw keys, nothing overflowing at phone width | 👤 person | | |
| 40 | Read the new labels in English: "Listened so far", "Length", "Hours listened" | Clear to a listener without explanation | 👤 person | | |

## Questions
- The club's checkpoint reminder (notification before a checkpoint is due) still judges by page only, so an audio member who is on track can get "you're behind" reminders. Not in the spec; worth a decision.
- The "Currently reading" rail card (`RailCards.tsx`, other session's work in progress) still shows pages only, so an audiobook there has no bar or place yet.
- Club member progress ignores reading privacy (known bug: `bugs/club-progress-ignores-reading-visibility.md`); since Phase 3 that also shows a private audiobook's minutes to the club.
