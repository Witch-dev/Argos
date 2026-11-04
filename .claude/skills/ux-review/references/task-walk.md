# Task walk: can a reader find and do things?

A page review asks "is this screen clear?". A task walk asks "I want to do X: where do I go, and do I get there?". It catches what page reviews miss: an option that looks fine on its page but that nobody would think to look for, two pages that put the same kind of action in different places, a label that only makes sense if you already know the app.

Two people do it, on purpose:

- **The walker** is a fresh Sonnet agent that has never seen the code. It knows only what a new reader knows: the screen. It drives a real browser through `scripts/walk.mjs` and reports what happened, where it looked and where it hesitated.
- **The lead** (the session running the skill) knows the code. It prepares the tasks, then explains each failure: why the reader went wrong and what kind of fix it needs.

The walker must never read the code, the specs or the locale files. Knowing where something is ruins the test, and that's exactly what went wrong in the page-by-page reviews.

## 1. The task list (lead)

Write 15–25 tasks into `<scratchpad>/tasks.md`. Rules:

- **Phrase each task as a reader's goal in everyday words, never with the interface's own label.** "You finished a book yesterday; record that and give it 4 stars", not "Use Log this book". If the task uses the button's word, the walk only tests word matching.
- **Start every task from the same place**, Books home (`/books`), unless the task says otherwise ("You're looking at a friend's profile…"). Starting from home tests whether the way in can be found, not just the button.
- **Most frequent first.** PRODUCT.md principle 1 says logging is never more than a few taps away, so logging tasks lead.
- **Check that each task can be done** with what's built (`ROADMAP.md` ticks, the specs). A task the app can't do is not a usability finding; drop it.
- **Write down the shortest path** for each task (from the code, e.g. "Search → book page → Log this book → stars → Save: 5 actions"). The walker doesn't see this; the lead compares against it.
- **Put the user's own complaints first.** Anything the user said felt hard to find becomes a task, worded as the goal they had.

Starting list, to prune and adapt (Spanish-speaking readers come first, `MARKETING.md`, so a second walk in Spanish is worth it for the top tasks):

| # | Task (as given to the walker) | Area |
|---|---|---|
| 1 | You finished a book yesterday. Record that and give it 4 stars. | Logging |
| 2 | You're halfway through a book you're reading. Note how far you've got. | Logging |
| 3 | A friend recommended a book. Save it so you remember to read it. | Logging |
| 4 | You gave up on a book. Record that you stopped. | Logging |
| 5 | You entered the wrong date for a book you finished. Correct it. | Logging |
| 6 | Write a few sentences about what you thought of a book you've read. | Writing |
| 7 | Save a passage you liked from a book. | Writing |
| 8 | Set how many books you want to read this year. | Goals |
| 9 | See how many books and pages you've read this year. | Stats |
| 10 | Make a collection of your favourite fantasy books and put two books in it. | Lists |
| 11 | Choose the books that show as your favourites on your profile. | Profile |
| 12 | Find your friend (username given) and follow them. | Social |
| 13 | See what the people you follow have been reading lately. | Social |
| 14 | Like someone's review and reply to it. | Social |
| 15 | Find a book club about a genre you like and join it. | Clubs |
| 16 | Leave a club you joined. | Clubs |
| 17 | Follow an author you like so you hear about their books. | Authors |
| 18 | Make it so only your followers can see what you read. | Privacy |
| 19 | Hide one particular book so nobody else sees you read it. | Privacy |
| 20 | Change the site's language. | Settings |
| 21 | Make the text bigger, or switch to a dark look for reading at night. | Settings |
| 22 | Bring in your books from Goodreads. | Import |
| 23 | Download a copy of all your data. | Account |
| 24 | Stop getting a kind of notification you don't want. | Settings |
| 25 | Someone is bothering you. Stop them from seeing or contacting you. | Safety |

**Seeding:** a fresh reader is empty, and some tasks need data (a book being read, a friend's username, a club to leave, a review to like). Seed through the API as the `browser-check` skill describes (section 3), or order the tasks so earlier ones create what later ones need (task 3 before task 2). Give the walker any facts it needs inside the task ("your friend is `walk_b_123`").

## 2. Start the walk (lead)

1. Side-port servers running (`browser-check`, section 1).
2. A reader: `node scripts/shoot.mjs / --out <scratchpad>/walk` makes one and saves `reader.json` there (or `--user/--password`).
3. Start the walker's browser, detached so it outlives one command: `Start-Process node -ArgumentList 'walk.mjs','serve','--out','<scratchpad>/walk' -WorkingDirectory C:/Users/jramo/Argos/scripts -WindowStyle Hidden`. Defaults: phone (375 wide, touch, so nothing appears on hover, as on a real phone), English, Paper. `--lang es` for the Spanish walk, `--width 1280` for desktop, `--theme dark`, `--anon` for a signed-out visitor.
4. Hand the walker the prompt in section 3 with the task list. One walker per walk; a re-walk uses a **new** agent.

## 3. The walker's brief (copy into the agent prompt)

> You are a new reader on Winged Words, a site for keeping track of the books you read and sharing them with friends. You signed up today and have never used it. You use it on your phone. Do each task below the way a real first-time reader would.
>
> You can only see the site through this tool, run from `C:/Users/jramo/Argos/scripts`:
> `node walk.mjs open /books` (only at the start of a task), `click <n or name>`, `type <n or name> <text>`, `press <key>`, `scroll` / `scroll up`, `back`, `look`, `mark <text>`.
> After each action it lists what is on the screen: controls in view with a number, things further down that need scrolling, open menus, messages, and a screenshot path. "(icon only)" means the reader sees just an icon there, no word. **Open the screenshot with Read whenever you reach a new page or a menu or dialog opens**, to see what stands out; the list alone doesn't tell you what's big, small or easy to miss.
>
> Rules:
> - Never read the app's code, specs, translation files or anything outside this tool and its screenshots. Don't type addresses except `open /books` at the start of a task.
> - Before each task: `mark task <n>`. Before each click, write one line: what you expect it to do and why you picked it.
> - Prefer what's already in view. Scroll only if nothing in view seems right, and note that you had to.
> - Give up on a task after 3 dead ends or about 12 actions, like a real reader would. Write down where you'd have looked next.
> - When you think you're done, check: did the screen tell you it worked? Would you trust it?
>
> For each task, report:
> - **Outcome:** done directly · done after detours · gave up · done but unsure it worked
> - **First click:** what you clicked first and why
> - **Path:** the actions, in short (from your marks)
> - **Moments of doubt:** each one with the exact words or icon on screen: a word you didn't understand, two options that seemed the same, an icon you had to guess, something you expected to find somewhere and didn't, a disabled control with no reason
> - **One line:** where you would have put this option, if you could choose
>
> End with the three most confusing moments of the whole walk, and run `node walk.mjs stop`.

## 4. Explain each failure (lead)

Read the walker's report and `<scratchpad>/walk/walk-log.txt` (the exact actions). For every task that wasn't "done directly", and every moment of doubt, decide the **cause**. This is the part the user cares about: is it the words or the design?

| Cause | How to tell | Kind of fix | Pass |
|---|---|---|---|
| **Wording** | The option was in view (it's in the listing) but the walker skipped it or misread it: its label, icon or hint didn't say what it does, or it used an app word ("log", "writing") the reader doesn't know yet. | Rename, add a word beside the icon, a one-line hint, a better empty state that names the next step. | `clarify`, `onboard` |
| **Placement** | The walker never saw it: it was behind a "⋯" or a menu, far down the page, on a different page than where they looked, or only on hover. Their "where I'd put it" line usually points to the fix. | Move it or surface it where the walker looked first; give the main action a visible button instead of a menu item. | `layout`, `distill` |
| **Inconsistency** | The walker learned a pattern on one page (edit is a pencil, delete is in "⋯") and it didn't hold on another. | Make the same kind of action live in the same place and look the same everywhere (section 5's map). | `polish` |
| **Feedback** | The walker did it but wasn't sure it worked, or something happened they didn't expect. | A visible confirmation, the button changing state, an undo. | `harden` |
| **Missing** | The app can't do it. | Not a finding: a line in `FUTURE-IDEAS.md` if it's worth having. | — |

Often two causes apply (a vague icon *inside* a menu). Name the main one and mention the other.

**Priorities:** gave up on a frequent task (logging, progress, finding a book, following someone) **P1**; gave up on anything else, or a wrong first click on a frequent task, or more than double the shortest path **P2**; a moment of doubt that didn't stop them **P3**. Several tasks failing for one shared reason (the same hidden menu) is one finding with all of them listed, ranked by the worst.

## 5. The action map (lead)

Inconsistency is invisible task by task, so draw it. A table of the kinds of action (edit, delete, share, change privacy, add to a list, add to a shelf, rate, follow, report or block, settings for this thing) against the places they appear (book page, a book in a shelf, a review, a list, a club, a profile, the feed), each cell saying **how** it appears ("Edit" button · ✎ icon only · inside "⋯" · swipe · missing). Build it from the walk plus a quick look at the components. Mark the cells that break the most common pattern. Keep it in the findings file; it's also a reference for anyone adding a new action.

## 6. Scores

Comparable between walks, kept beside the earlier numbers on a re-walk:

- **Task success:** tasks done (directly or after detours) / tasks tried.
- **Done directly:** tasks done without a wrong turn / tasks tried. The number that says "intuitive".
- **First click right:** tasks whose first click was on the shortest path / tasks tried. Research on first-click testing finds people who start right usually finish.
- **Extra actions:** for done tasks, the walker's actions minus the shortest path, as an average.

## 7. Findings file

`ux-reviews/task-walk.md` (or `task-walk-<area>.md` for a walk of one area), with a row in `ux-reviews/README.md`:

```
# UX review — task walk (<area or "whole app">)

Walked: YYYY-MM-DD · Walker: fresh Sonnet agent · Phone 375 · English (Spanish for tasks …) · Reader: new, seeded with …
Tasks: N tried

## Summary
Two or three sentences: is it words or design, and the single biggest thing to fix.

## Scores
Task success NN% · Done directly NN% · First click right NN% · Extra actions N.N (earlier walk: …)

## Tasks
| # | Task | Outcome | First click | Actions (shortest) | Cause |

## Findings
### 1. <short title> — P1 · M · Placement
**Tasks:** 4, 16 · **Where:** `BookActions.tsx` / "the ⋯ menu on the book page"
**What the walker did:** first click, path, the words they quoted.
**Why:** the cause, in a sentence.
**Fix:** the specific change.
**Status:** open

## Action map
(the table from section 5)

## Looked fine
Tasks done directly, one line, so the next walk doesn't worry about them.
```
