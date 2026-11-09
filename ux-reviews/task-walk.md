# UX review — task walk (whole app, first walk)

Walked: 2026-11-08 · Walker: fresh Sonnet agent, never saw the code · Phone 375, touch · English (14 tasks), then Spanish (tasks 1–4) · Reader: new, empty (the walker created its own data)
Tasks: 14 written, 13 scored. Task 11 (promote/remove a club member) could not be tested: the walker's club had one member. Untested, not failed.
The three areas the user named as hard to find went first: logging/progress, lists, and clubs (create, set up, administer). "Get in" (sign-up/log-in) was not walked: the walker was already signed in. Open question for a signed-out walk.
Limits of the tool: native dropdowns show no option list, so the walker changed them by keyboard. Findings that rest only on that are left out.

## Summary
Mostly **placement and flow design, with wording second**. Every scored task was finished (13/13) but only 5 were straight; the rest needed detours. The biggest single fix is the "Log this book" form: it opens on "Currently reading", so logging a finished book needs a status change, a date choice and a form that overflows a phone, and the same form is the only way to correct a date. Clubs have a second hole: "Choose this book" is not the end, a hidden second step demands checkpoints with due dates.

## Scores
Task success 100% (13/13) · Done directly 38% (5/13) · First click right 92% (12/13) · Extra actions about +3 per task (an estimate from the walker's counts against the code's shortest paths; first walk, no earlier numbers).

## Tasks
| # | Task | Outcome | First click | Actions (shortest) | Cause |
|---|---|---|---|---|---|
| 1 | Log finished book, 4 stars | detours (EN); direct (ES) | search box | ~14 EN, 11 ES (5 from the cover, +2 to find the book) | Placement, wording |
| 2 | Reading, page 80 | direct | search box | 7 EN, 6 ES (4+2) | Wording (minor) |
| 3 | Save for later | direct | search box | 5 EN, 4 ES (2+2) | none |
| 4 | Fix finish date | detours | ⋯ on a Journal cover | ~7 EN, ~11 ES (4) | Placement, wording |
| 5 | Make a collection, two books | detours | menu | ~12 (9) | Wording |
| 6 | Third book, order them | done, unsure it saved | "Add a book" | ~10 (7) | Feedback |
| 7 | Profile favourites | detours | menu (expected Profile) | more than 5 | Placement |
| 8 | Create a public fantasy club | detours | Community tab | 8+ (6) | Placement |
| 9 | Edit club, see members | direct | Club settings | ~6 (7) | none |
| 10 | Choose the club book, invite | detours | Choose the book | long (8) | Placement, wording |
| 11 | Promote/remove member | not tested | – | – | – |
| 12 | Yearly goal | direct | Set a goal | 3 (3) | none |
| 13 | Followers-only reading | detours | menu → Settings | 7 (7) | Wording |
| 14 | Site language | direct | menu | 3 (3) | none |

## Findings
### 1. Logging a finished book starts on the wrong status and hides what you need — P1 · M · Placement
**Tasks:** 1, 2, 4 (EN and ES) · **Where:** `LogForm.tsx` ("Log this book" on the book page; the same form inside the Edit dialog)
**What the walker did:** tapped "Log this book", found Status already on "Currently reading" (Spanish "Leyendo"), had to change it by dropdown, then chose "Today / A date / A year / Not sure" and tapped "A date" to say yesterday. After "Read" appeared, about 20 icon-only buttons with no name (probably content-warning chips) and a review box. The form was cut off on the right at 375px ("Change" and the select arrows clipped; date inputs and progress note run past the edge).
**Why:** the one thing a reader came to do, "I finished it", is not offered first; the form assumes you are starting a book. Date and stars sit below choices that don't matter yet.
**Fix:** ask the status first, as three big choices (Want / Reading / Read), with "Finished: today / yesterday / pick a date" beside it. Fix the clipped width at 375px. Give the 20 chips a name or fold them under a "Content warnings" toggle. Stays within `LogForm` so the Edit dialog gets it too.
**Status:** partly fixed 2026-11-08 (not committed): Status is three buttons, "Yesterday" added, Finished sits under Status (also in the Edit dialog). The 375px clipping and the "20 nameless chips" did not reproduce in a browser check (the chips are mood buttons with names inside a closed fold; likely a walk-tool artefact).

### 2. Correcting a date is buried: ⋯ → Edit → long form, date last — P2 · M · Placement
**Tasks:** 4 · **Where:** `BookActionsMenu.tsx` (⋯ "More for {title}", icon only), `EditLogDialog`
**What the walker did:** guessed the ⋯ icon, picked Edit, then scrolled past Review, spoilers and warnings to "Finished". The dialog closed on save with no "Saved" message. In Spanish "Registrar de nuevo" read as the way to change it and was avoided.
**Why:** a frequent fix hides behind an unlabeled icon and a form where the date is the last field.
**Fix:** show the dates near the top of the edit dialog; make "Finished Nov 7" on the book page tappable; add a one-line "Saved" confirmation; put the word "Edit" beside the ⋯ on the book page.
**Status:** open

### 3. Choosing a club's book has a hidden second step — P1 · M · Placement + Wording
**Tasks:** 10 · **Where:** `ClubChooseBookCard.tsx`, `ConfirmBookModal.tsx`
**What the walker did:** "Choose the book" → search → "Choose this book" → a second dialog, "Choose the next read", asks for Checkpoints. "Confirm next read" answered "Every checkpoint needs a due date." and "Remove checkpoint" was disabled with no reason. They filled page 1 to 100 and a due date to continue. They also confused "Choose the book" with "Let the club vote".
**Why:** "Choose this book" looks final. "Checkpoints" is an app word, unexplained, and required.
**Fix:** explain checkpoints in one line or make them optional; make the first button say what comes next; say why Remove is disabled.
**Status:** fixed 2026-11-08 (not committed): the first button says "Next: set checkpoints", a line explains checkpoints, and the disabled Remove button says why. Not screenshotted.

### 4. Three privacy controls sound like "who sees what I read" — P2 · S · Wording
**Tasks:** 13 · **Where:** `PrivacySettings.tsx`, `ReadingPrivacyBulk.tsx`
**What the walker did:** saw "Private account" (about who can follow), "New books and reviews are visible to" and "Make all my books visible to" + Apply. The first sounded right but isn't. The result was clear ("Saved · 3 books changed") but only after a confirmation step.
**Why:** a followers-only goal needs two dropdowns, and the label that sounds closest is the wrong one.
**Fix:** group under one heading "Who can see what I read", with the bulk apply as a clear second step ("Also change my existing books"). Add a hint under "Private account": people must ask to follow you.
**Status:** fixed 2026-11-08 (not committed): a "Who can see what you read" heading with a line saying the first setting is for new books and the second changes existing ones; the bulk block is now "Books you've already logged". The "Private account" switch is unchanged (its note already says it is about who can follow).
### 5. Clubs and Profile are not where a Books-tab reader looks — P2 · M · Placement
**Tasks:** 7, 8 · **Where:** `SectionSwitch.tsx`, `Sidebar.tsx`
**What the walker did:** looked in the Books menu for a Profile link and for Clubs; neither is there. Clubs only appear after switching to the Community tab; Profile was reached via Settings → "View your profile". The code's shortest path for favourites is My books → "Pick your favourites"; the walker never found it from the menu.
**Why:** a hidden section switch and menu entries that differ by tab.
**Fix:** a Profile entry in the Books menu; a Clubs entry visible from both tabs. Show "Pick your favourites" as a visible button where the walker looked first.
**Status:** partly fixed 2026-11-08 (not committed): Clubs added to the Books menu. "My books" is already the profile link by design (one entry per destination), so no second Profile entry.

### 6. A club can't get a topic when created, and Share gives no feedback — P2 · S · Placement + Feedback
**Tasks:** 8, 9, 10 · **Where:** `CreateClubModal.tsx`, the club header "Share" button
**What the walker did:** made a club "for fantasy" but the form has no topic; it is only in Club settings, so the club wouldn't show under Fantasy until a second visit. "Share" showed nothing visible. "Invite readers" sits further down the page; they would have wanted it beside Share. Members are below the fold with only "1 member" near the top.
**Fix:** topic chips in the create form; a "Link copied" confirmation on Share; "Invite readers" and a "Members" link near the header.
**Status:** fixed 2026-11-08 (not committed): topic chips in the create form (backend takes `topics` on create), the member count in the club header links to the opened Members list, the invite box has a share-link button. "Link copied" on Share already existed (the walk browser has no clipboard).### 7. Lists: "collection" vs "Lists", and unclear feedback when adding and ordering — P2 · S · Wording + Feedback
**Tasks:** 5, 6 · **Where:** `ListsPage.tsx`, `ListForm.tsx`, `AddBookSearch.tsx`, `ListDetailPage.tsx`
**What the walker did:** looked for "Collections", took "Lists" as nearest. The first "Add a book" tap didn't seem to open the search. Every result has an identical "Add" with no book name, and it stays "Add" after adding, so it isn't clear it worked. The create form has two similar option groups (who can edit / who can see) and an unexplained Tags field. Reordering was found through the hint on the Shelf view, but the arrows are icon-only, there is no "Saved", and the first and last arrows are disabled without a reason.
**Fix:** after "Add", change the button to "Added ✓" (and name the book in its aria-label); explain Tags; label the arrows or add a "Saved" note.
**Status:** partly fixed 2026-11-08 (not committed): a result shows "Added" after you add it, Tags has a one-line hint, the move arrows have tooltips. Not done: the word "collection" (a rename would touch every list text), a "Saved" note on reorder (the order changes on screen at once), naming the book on each Add button (tests rely on the plain name).
### 8. The language picker is easy to miss — P3 · S · Placement
**Tasks:** 14 · **Where:** the bottom of the drawer (`LanguageMenu.tsx`)
**What the walker did:** done directly, but the walk tool couldn't click the picker, so this rests on a screenshot only. It also wondered whether the "reading languages" checkboxes in Settings → Profile were the site language.
**Fix:** also show Language in Settings; rename the reading-language checkboxes "Languages I read in".
**Status:** fixed 2026-11-08 (not committed): a "Site language" select in Settings → Profile, above "Languages I read", with a line saying they are different things.
### 9. Dates and small Spanish gaps — P3 · S · Rule
**Tasks:** 1, 4 (ES) · **What:** date inputs show the placeholder "dd-mm-yyyy" in the Spanish walk (it may be the browser's own date input, not our text); the "Log this book" button stays beside "Leyendo" after saving. No untranslated English text was found on the four Spanish screens.
**Fix:** check the date placeholder in Spanish; hide or relabel "Log this book" while the book is being read.
**Status:** not a bug: the date placeholder comes from the browser's own date input, so we can't localise it. The leftover "Log this book" button while reading is how you add details like total pages, so it stays.
## Action map
From the code walk plus the walker's findings. Breaks from the usual pattern in **bold**.
| Action | Book page | List page | Club page | Review page |
|---|---|---|---|---|
| Edit | **⋯ icon → Edit (modal)** | "Edit" button | link to a separate Club settings page | none; goes through the book page |
| Delete | ⋯ → "Delete from my books" | in ⋯ "More actions" | "Delete club" inside Settings | **only via the book page** |
| Share | icon only on phone | "Share" button | "Share" button, **no feedback** | "Share" (public only) |
| Privacy | inside the log form only | inside the Edit form | "Who can join" inside Settings | label only |
| Add to a list | selector + Add | n/a | **missing** | **missing** |
| Report / leave | via ⋯ | in ⋯ | Leave in ⋯ | Report in the byline |
| Invite / follow | – | Collaborators button | **Invite far down the page** | Follow |
Pattern: Edit is a visible button on lists and clubs but an icon-only ⋯ on books. Privacy sits inside edit forms on books, lists and clubs.

## Looked fine
Task 3 (save for later: "Want to read", clear green confirmation, both languages). Task 9 (Club settings found at once, "Saved."). Task 12 (yearly goal: far down Home but easy). Task 14 (language, 3 actions). Search as the first click: 12 of 13 first clicks were right.

## Re-walk, 2026-11-08 (after the fixes above; tasks 1, 8, 10; one fresh walker, phone, English)
Task 1: direct in about 8 actions (was about 14). Task 8: direct in about 9 (topic picked in the create form). Task 10: book chosen after detours; the invite-by-link line was read, but the walker's browser has no share sheet, so Share is unconfirmed.
New findings, fixed the same day (Apollon, not yet pushed): (a) "Confirm next read" did nothing visible twice, its error sat at the top of the dialog out of sight on a phone, now shown beside the button; (b) Clubs not findable from the Community tab, now a Clubs and a People link on the Feed page; (c) no sign a log saved once the form closed, now a "Saved to your books" line.
Still open: letting a club skip checkpoints (needs the backend to allow zero checkpoints); a Hobbit search result labelled "Graphic novel" (data); the date field's dd-mm-yyyy is the browser's own.
