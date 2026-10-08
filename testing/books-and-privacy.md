# Test plan — Books, Community and private books

**Covers:** `specs/books-community-split.md` (§1–3.6) · **Written against:** Apollon commit 7027a6d on 2026-10-08
**Before you start:** four fresh readers, emails confirmed (see the `browser-check` skill for seeding through the API):
- **A** (main tester): *Currently reading* book X, *Read* book Y with 4 stars and a short review, *Want to read* book Z, *Read* book P set to **Only me** (finished last month).
- **B**: follows A. Has their own *Read* book with a public review.
- **C**: a stranger, follows nobody.
- **D**: blocked by A.
- A second browser (or a private window) for B and C, and one logged out.

Also run `_shared.md` on `/books`, `/journal`, `/feed` and Settings → Privacy.

## The two sections

**Start:** logged in as A, a fresh browser (no remembered section).

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 1 | Open the site's address `/` | You land on Books home (`/books`); the **Books** tab is open (lighter, with the accent strip on top) | | | |
| 2 | Look at the top bar | Two tabs of the same size, centred, Books and Community; logo left, search right | | | |
| 3 | Look at the sidebar | Home, Journal, Stats, Lists, My books, your profile, Settings, Log out. No Feed, People or Clubs | | | |
| 4 | Click **Community** | You go to the Feed; the sidebar now shows Home, Reviews, Writings, People, Clubs, News, profile, Settings, Log out | | | |
| 5 | Open Settings from the sidebar | The Community tab stays open (Settings belongs to both sections) | | | |
| 6 | Close the tab, open the site again at `/` | You land in Community, the last section you used | | | |
| 7 | Click a book cover to open its page, then look at the tabs | The section doesn't change (a book page belongs to both) | | | |
| 8 | Open another reader's profile (`/u/B`) | Community is open. Your own profile (`/u/A`) opens Books | | | |
| 9 | Focus the open tab with Tab, press → (right arrow) | The other section opens | | | |
| 10 | At 360 px wide, look at the top bar | Both tabs are fully visible below the menu button, logo and search | | | |
| 11 | At 360 px, open ☰ in Books, then in Community | The menu lists that section's links and reaches the bottom of the screen | | | |

## Books home

**Start:** logged in as A, on `/books`.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 12 | Look at *Your reading* | Only the "+" tile and your own "You" tile. B's reading never appears here | | | |
| 13 | Look at *Popular on Winged Words* | Books with "N readers" under them; book P is never counted from A's private log | | | |
| 14 | Look at *Want to read* | Book Z | | | |
| 15 | Look at the *Journal* preview | Your 3 latest entries and an "Open journal" link | | | |
| 16 | Look at the right column (desktop only) | Your reader card, "Your 2026 so far" with books read **including P**, and a reading-goal placeholder. No clubs, no people | | | |
| 17 | Log in as C, a reader with no books, and open `/books` | Empty states explain what to do; nothing is blank | | | |

## Journal

**Start:** logged in as A, on `/journal`.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 18 | Look at the list | Entries grouped by month, newest first: "Finished Y", "Started X", "Finished P" (last month). Z (want to read) is not an entry | | | |
| 19 | Look at P's entry | Its visibility control shows **Only me** | | | |
| 20 | Change Y's control to **Followers only** | It saves without a Save button (no error; reload shows the new value) | | | |
| 21 | Change Y back to **Public** | Saved | | | |
| 22 | Open the "⋯" Journal options menu, choose **Make all private** | A confirmation appears inside the page (not a browser pop-up) | | | |
| 23 | Cancel it | Nothing changes | | | |
| 24 | Do it again and confirm | "N books are now private."; every control now shows Only me | | | |
| 25 | Undo: set X and Y back to Public one by one, leave P as Only me | Saved | | | Keeps the data for the next sections |

## Log form and shelves

**Start:** logged in as A.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 26 | Open a new book's page and log it as Read | The form has "Who can see that you read this?" with Public / Followers only / Only me, preset to your account default | | | |
| 27 | Choose **Only me**, save | The book is logged | | | |
| 28 | Edit that log and look at the field | It still shows Only me | | | |
| 29 | Open your shelves (My books) | Private books show a lock icon; hovering or a screen reader says "Private book" | | | |
| 30 | On a private book, set the review to **Public** | The book stays private: nobody else sees the review either (checked in step 37) | | | |

## What other readers see

**Start:** P is Only me, Y is Public with a review. Check with B (follower), C (stranger), logged out, and D (blocked).

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 31 | As B, open `/u/A` (shelves) | Y, X, Z appear; **P does not**; no lock icons, no visibility fields | | | |
| 32 | As B, open A's Journal tab on the profile | Y and X entries, no P; no notes, no controls | | | |
| 33 | As B, look at A's profile numbers ("read this year") | P isn't counted | | | |
| 34 | As B, open the Feed | A's "finished Y" row is there; nothing about P | | | |
| 35 | As B, look at the Readings strip | A's tile has stories for X/Y only | | | |
| 36 | As B, open book P's page | A is not among its readers; A's rating is not in the average or the count | | | |
| 37 | As B, open the review A wrote on the private book from step 30 (paste its address) | "Not found", never "Forbidden" | | | |
| 38 | Set P to **Followers only** (as A), then repeat 31 and 36 as B | P now appears for B | | | |
| 39 | As C (stranger), repeat 31 and 36 | P still doesn't appear | | | |
| 40 | Logged out, open `/u/A` and book P's page | P doesn't appear | | | |
| 41 | As D (blocked), open `/u/A` and `/u/A`'s journal | Not found | | | |
| 42 | As B, open Compare with A (`/u/A/compare`) | Only books B can see are compared | | | |
| 43 | As A, set P back to **Public**; as C, reload `/u/A` and book P's page | P is back, with A's rating | | | |
| 44 | As A, heart Y as a favourite, then make Y private; as C, open A's profile | Y isn't in A's favourites for C | | | |
| 45 | Make a book private, then look at Popular on Winged Words within 5 minutes | It may still be counted for up to 5 minutes (the list is cached), then drops out | | | |

## Settings → Privacy

**Start:** logged in as A, Settings → Privacy and data.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 46 | Read the default visibility setting | "New books and reviews are visible to…" with the three choices | | | |
| 47 | Read the note under it | It says honestly that anyone can follow you right now, so choose "Only me" to keep things hidden | | | `👤 person`: is it clear? |
| 48 | Set the default to **Only me**, log a new book without touching its field | The new book is Only me | | | |
| 49 | Under "All your books at once", choose **Public**, click Apply | A confirmation inside the page; confirm → "N books changed." | | | |
| 50 | Check the journal | Every entry shows Public; reviews keep their own settings | | | |

## Hand-offs

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 51 | Import a Goodreads file (Settings → Import) | Imported books take your account default visibility (Goodreads exports no privacy per book) | | | |
| 52 | As A, set a book private that is also the current book of a club you're in; as another member, open the club | **Known bug: `bugs/club-progress-ignores-reading-visibility.md`**: the member still sees A's progress | | | known bug |

## Questions
- Step 16 vs step 33: your own year count includes private books, while others' counts on your profile don't. That's intended (§2), but the numbers will differ between what you see and what B sees.
- Stats (`/stats`) is a placeholder until Roadmap Stage 9, so it isn't tested here.
- Feed rows for a Public book whose review is Only me show without stars (Phase 3 decision). There's no step for it yet; add one if it looks confusing in use.
