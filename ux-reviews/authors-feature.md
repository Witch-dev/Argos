# UX review — Authors feature (author page, search tab, profile rows, follow, favourites, quotes, release alerts)

Reviewed: 2026-10-16 · Themes: Paper (all screens), Dark and Sepia (author page, profile, Feed) · Widths: 1280 and 375 · Reader: logged in; a reader with data (follows, favourites, quotes), a brand-new reader, and a signed-in viewer of someone else's profile
Screenshots looked at: author page (Tolkien: top, middle, works grid; Rowling as a new reader; Elisabeth Le Guin with no bio and no covers), Authors tab in search, header suggestions for an anthology, another reader's profile, own profile (empty and with rows), `/u/:username/authors` (full and empty), bell dropdown, Feed with a new-release card, Settings → Notifications, book page; 375px author page (top, middle), profile, followed page, Feed, search, book page. Keyboard pass on the author page (Tab order, focus rings). Not captured: German, a loading frame, the error state of the Quotes section, Dark/Sepia at 375px.

## Summary

The feature reads well and holds together: the rows reuse the same round-photo grid, empty and sparse authors have sensible states, nothing scrolls sideways at 375px, and Dark and Sepia are fine. The biggest thing to fix is the two buttons beside the author's name: **Follow** and **Add to favourites** are both filled with the accent colour, so they compete, and the page pushes them to opposite ends of the row. Next, **Favourite authors** sits under the whole shelf on a profile, so on a reader with books it is far down the page, away from Favourite books.

## Findings

### 1. Follow and Add to favourites compete and drift apart — P2 · S · Judgement
**Where:** `AuthorPage.tsx:105-106` and `AuthorPage.module.css:33` (`.nameRow`); `AuthorFollowButton.tsx`, `AuthorFavouriteButton.tsx`; "Author page header at 1280 and 375px".
**What:** each button is its own flex item in a row with `justify-content: space-between`, so at 1280px Follow sits next to the name and Add to favourites is pushed to the far right edge (about 50px apart on Tolkien, more on short names). When you don't follow the author, both are filled `--accent` (`btn-primary`). At 375px they stack in a column with different widths.
**Why it matters:** the one thing most readers want to do here is Follow (it drives the bell and the Feed); favourites is rarer. Two equal primary buttons make the reader stop and choose, and separated buttons don't read as a pair.
**Fix:** put both in one wrapper with `display: flex; gap: var(--space-2)` so they sit together. Keep Follow as the only primary (`btn-primary`); make favourites `btn-soft` in both states, or a heart icon toggle with a text label for screen readers. At 375px let the wrapper wrap, so they share a row when they fit.
**Status:** fixed 2026-10-16 — Follow and Add to favourites share one `.actions` group (`gap: var(--space-2)`) next to the name; Add to favourites is always `btn-soft` (`.secondary`), so Follow is the only primary. At 375px they sit on one row.

### 2. Quotes and the link list push the works grid far down — P2 · S · Judgement
**Where:** `AuthorQuotes.tsx` (`PAGE_SIZE = 5`) and the links list in `AuthorPage.tsx:140`; "Tolkien at 1280 and 375px".
**What:** the works grid starts at about 1,400px down on desktop. Before it come the bio, six stacked links (about 300px at 375px), the readers box and then up to five quote cards (a long quote is about 200px). At 375px the works start more than 2,000px down.
**Why it matters:** the page is "an author and their books". A reader who comes for the books has to scroll past quotes they didn't ask for, and "Show more quotes" makes that longer.
**Fix:** show 2 quotes first (`PAGE_SIZE = 2`, then 5 on "Show more quotes"), and show the first 3 links with "+3 more" (a `--text-muted` text button, like Read more). Keep Quotes above the works.
**Status:** fixed 2026-10-16 — the first look shows 2 quotes (then 5 per "Show more quotes") and 3 links with "Show all N links" / "Show fewer links" (`aria-expanded`/`aria-controls`).

### 3. Favourite authors is buried under the shelf — P2 · M · Judgement
**Where:** `ProfilePage.tsx:341-342` ("Your favourite authors", "Authors you follow" after everything else).
**What:** both rows come after the shelf tabs and the books under them. A reader with 40 books has to scroll through the whole shelf (and "Show more") to reach their favourite authors; on the reader's own profile "Favourite books" is at the top and "Your favourite authors" is far below, though they are the same idea.
**Why it matters:** favourites are the profile's showcase; a row nobody reaches is not a showcase. People also won't find out they can pick favourites at all.
**Fix:** put Favourite authors directly under Favourite books, above the tabs, with the same heading size. Leave "Authors you follow" at the bottom: it is a list, not a showcase.
**Status:** fixed 2026-10-16 — `FavouriteAuthorsRow` now sits right under `FavouriteBooksRow`, above the shelf tabs; "Authors you follow" stays at the bottom.

### 4. Empty-state copy doesn't say how or where — P3 · S · Judgement
**Where:** `locales/en/authors.json` `favourites.emptyHint`, `followed.emptyHint`; "Own profile of a new reader".
**What:** "Pick up to four favourite authors from their pages." ("their" has nobody to refer to) and "Follow authors from their pages to hear about their new books." Neither offers a way to find an author.
**Why it matters:** an empty state should say what the area is for and offer the first step; here the first step is a dead end.
**Fix:** "Open an author's page and choose Add to favourites (up to four)." with a link "Find authors" to `/search?type=authors`; same link on the follow hint. Five locale files.
**Status:** fixed 2026-10-16 — hints now read "Open an author's page and choose Add to favourites (up to four)." / "…choose Follow to hear about their new books.", each with a "Find authors" link to `/search?type=authors` (also on the empty followed page). Five locales.

### 5. Accessible names don't match the visible text, and toggles say it twice — P3 · S · Rule
**Where:** `AuthorFavouriteButton.tsx:42-46`, `AuthorFollowButton.tsx` (same pattern, from Phase 3).
**What:** the visible text is "Add to favourites" / "In your favourites" but the accessible name is "Add J.R.R. Tolkien to your favourite authors" / "Remove … from your favourite authors": the visible words are not contained in the name, which fails WCAG 2.5.3 (Label in Name), so a voice-control user saying "Add to favourites" doesn't hit it. The buttons also set `aria-pressed` while the label flips between add and remove, so a screen reader says both ("Stop following X, toggle button, pressed").
**Why it matters:** voice-control and screen-reader users get a different or contradictory description of the button.
**Fix:** start each name with the visible text, e.g. visible "Add to favourites" → `aria-label` "Add to favourites: {{name}}"; for the pressed state use "In your favourites: {{name}}, click to remove" or drop `aria-pressed`, since the changing label already carries the state. Do the same on Follow (visible "Following", name "Following {{name}}, click to unfollow").
**Status:** fixed 2026-10-16 — `aria-pressed` removed from both buttons; the names start with the visible text ("Add to favourites: {{name}}", "In your favourites: {{name}}, click to remove", "Following {{name}}, click to unfollow"). Five locales.

### 6. Follow and favourite buttons are 32px tall on a phone — P3 · S · Rule
**Where:** `FollowButton.module.css` (`btn` from global); measured 88×32 and 136×32 at 375px.
**What:** below the 44px tap target this review uses (they pass WCAG's 24px minimum). This is the site's standard small button, so it's partly a site-wide question.
**Why it matters:** two adjacent 32px targets with an 8px gap are easy to mis-tap with a thumb, and the pair acts on your profile.
**Fix:** `min-height: 44px` on these two at `max-width: 640px`, or raise the shared `.btn` there if the buttons review (`buttons.md`) agrees.
**Status:** closed 2026-10-16, not reproduced — re-measured at 375px after the other fixes: 88×44 and 136×44. The shared `.btn` already goes to `2.75rem` at ≤640px (`index.css`); the 32px reading in the first pass was not repeated. No change made.

### 7. Quote cards lead with the reader, and the book isn't a link — P3 · M · Judgement
**Where:** `AuthorQuotes.tsx` using `WritingListItem.tsx`; "Quotes section".
**What:** each card starts with the reader's avatar and name, then a small muted "Quoted from The Lord of the Rings", then the text in ordinary body type. On the author page the reader's question is "what do people quote from this author's books?", so the passage and its book matter more than who posted it. The "Quoted from" line is plain text here, while the same quote in the Feed links the book.
**Why it matters:** a list of quotes doesn't look like a list of quotes, and the same quote behaves differently in two places.
**Fix:** make the passage the focal text (serif at `--font-size-lg`, with a 2px `--border` rule on the left), keep the book on the line below as a link to the book, and move the reader and time to a small muted line under it. If the card is shared with the Writings list, add a `variant="quote"` prop instead of forking the component.
**Status:** fixed 2026-10-16 — `WritingCard` has a `variant="quote"`: the passage first (serif, `--font-size-lg`, 2px `--border` rule on its left), then "Quoted from {book}", then the reader and time. The book is now a link everywhere a quote has a catalog source (also in the Writings list).

### 8. Followed-authors page: tall rows and a redundant count — P3 · M · Judgement
**Where:** `FollowedAuthorsPage.tsx`, `FollowedAuthorsPage.module.css`.
**What:** each author is a full-width bordered row about 80px tall with a photo, a name and years: 11 authors take two screens, while the same people fit in one on the profile's grid. When the list is empty the page shows "0 authors" and then the explanation, which says the same thing twice.
**Why it matters:** the page is for scanning the people you follow, and the long single column is slow to scan.
**Fix:** use the profile row's grid (`FollowedAuthorsRow.module.css`) with larger photos and years under the name; hide the count line when it is 0.
**Status:** fixed 2026-10-16 — the page uses the profile row's grid (7rem columns) with the years under each name; the count line is hidden when the list is empty.

## Looked fine

- Heading order on every screen (h1 author name → h2 Quotes → h2 Books; profile rows are h2 with matching `aria-label`).
- No sideways scroll at 375px on the author page, profile, followed page, Authors search and Feed (measured on every page).
- Dark and Sepia: text, rows, the buttons and the readers box all keep their contrast; the round photos hold up on dark.
- Authors with no photo (initials circle), no bio ("No biography yet.") and no covers ("None of this author's books has a cover yet." with a button), including long names (`overflow-wrap: anywhere`).
- Keyboard: tab order follows the page (Following, Add to favourites, Read more, links, quotes); every control shows a 2px focus ring; the bio fold keeps `aria-expanded`/`aria-controls`.
- Search: the Books/Authors toggle keeps its state in the address and uses `aria-pressed`; "and others" shortens the anthology author line in the header suggestions, which wraps without clipping.
- CSS: tokens only, no hex colours, no `transition`, no `z-index`; avatar images use `loading="lazy"`.
- Copy: "New books — When an author you follow has a new book." and the bell and Feed wording ("New from {author}: {title}", "A new book by an author you follow") are clear.
