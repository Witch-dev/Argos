# UX review — Buttons across the site

Reviewed: 2026-10-13 · Themes: Paper · Widths: 1280 (screenshots), plus a code inventory of every CSS module · Reader: logged in
Screenshots looked at: Log in, Settings, Lists, Clubs, Journal, Find readers; the book page and its quick-log card. Code: all `*.module.css` files that define a button (about 136 matching rules).

## Summary
The buttons work and look related, because they share the accent colour and the 3px corner, but there is no shared button: each page defines its own primary and secondary, so sizes, padding and states drift. The most visible symptoms are filled buttons that are big and heavy (Log in, Save profile, Create a list, Create a club) and no hover state on 18 of the 21 files that have a filled button. The restyled quick-log pills are now the one place that looks different on purpose. Fixing this once, with shared button classes, is a medium job that would also remove a lot of repeated CSS.

## Findings

### 1. There is no shared button: about 30 "primary" and 35 "secondary" definitions — P2 · L · Rule
**Where:** every `*.module.css` that styles a button (`Form`, `Settings`, `AuthForm`, `BookDetailPage .cta`, `ListsPage .createButton`, `ClubsDirectoryPage .createButton`, `ClubPage`, `JournalPage`, `ReadingGoalCard`, and about 20 more).
**What:** the same look is written again and again, with small differences:
- Filled buttons all use `padding: --space-2 --space-4`, 16px text and no minimum height, so they come out about 38–40px tall and heavy next to the 14–15px text around them.
- Outlined buttons use three different paddings (`--space-1 --space-3`, `--space-2 --space-3`, `--space-2 --space-4`) and two font sizes (small and base), so two outlined buttons on the same page can differ in height.
- Some filled buttons have no `font: inherit`, so the browser default font size shows through.
**Why it matters:** a reader sees buttons that are almost, but not quite, the same size from page to page, and any change (like the quick-log restyle) has to be repeated 60 times.
**Fix:** one small set of shared classes in `index.css` (or a `Button.module.css`): `.btn` base, `.btn-primary` (filled), `.btn-secondary` (outlined), `.btn-quiet` (text only), `.btn-danger`, plus a size `.btn-sm`. Then replace each page's own definition with the shared class. Tokens only.
**Status:** fixed 2026-10-13 (shared `.btn` classes in `index.css`: `btn-primary`, `btn-secondary`, `btn-soft`, `btn-danger`, `btn-danger-outline`; 63 page and component buttons now take them with `composes`, or carry the same declarations where a descendant selector made `composes` impossible)

### 2. Most filled buttons have no hover or pressed state — P2 · S · Rule
**Where:** 18 of the 21 stylesheets with a filled accent button have no `:hover` rule at all: `Form`, `Settings`, `AuthForm`, `BookDetailPage .cta`, `ListsPage`, `JournalPage`, `ReadingGoalCard`, `ClubJoinPage`, `ErrorBoundary`, and others.
**What:** the button looks the same under the pointer and when pressed. (The keyboard focus ring is fine: there is a global one.)
**Why it matters:** no feedback that the button is live, especially on a screen full of similar boxes.
**Fix:** handled by finding 1: `.btn-primary:hover:not(:disabled) { filter: brightness(1.08) }` and an `:active` that nudges it back. If finding 1 is deferred, add the same two lines to the filled-button rules.
**Status:** fixed 2026-10-13 (hover and pressed states in the shared classes, also added to the descendant rules)

### 3. Page-level buttons are large and heavy compared with the page — P3 · S · Judgement
**Where:** "Log in" (full width, auth forms), "Save profile", "Create a list", "Create a club", "Set a goal", "Log this book".
**What:** each is a solid 38–40px accent block with 16px bold text. Several sit next to small 13–14px helper text, and the Log in button spans the whole form. On Settings, "Save profile" is the heaviest thing on the screen even when nothing changed.
**Why it matters:** the primary action should be clear, not loud. Heavy fills draw the eye away from content such as the form itself.
**Fix:** use the same small size as the new quick-log buttons for page actions (36px high, small text), and keep the full-width size only for the auth forms on a phone. Filled only for the one main action on a page, outlined for the rest.
**Status:** fixed 2026-10-13 (32px high, small text, for every page-level button (36px first, lowered to 32px on 2026-10-13 after feedback); full width kept only where the form needs it)

### 4. Corner style is now inconsistent: quick-log pills against 3px everywhere else — P3 · S · Judgement
**Where:** `QuickLog.module.css` (999px corners) against the flat 3px corner used by every other button, and the Feed filter chips (pills, which is correct for toggles).
**What:** the restyled "+10 pages" / "Finished!" buttons are pills; the "Follow", "Save", "Create" buttons beside them in the same screens are square-ish.
**Why it matters:** the app's convention is flat 3px corners, with pills reserved for filters and badges. Two button shapes on the book page (pill "Finished!" above a 3px "Log this book") reads as unfinished.
**Fix:** decide one shape. My recommendation: go back to the 3px corner for the quick-log buttons and keep the new small size, the outlined / filled split and the hover states. Alternatively move all buttons to pills when finding 1 is done; that is a bigger visual change and should be your call.
**Status:** fixed 2026-10-13 (3px corners everywhere; the quick-log buttons are no longer pills)

### 5. The want-to-read button and the Log button sit as two unrelated buttons — P3 · S · Judgement
**Where:** book page: "Log this book" (filled) and "+ Want to read" (outlined), plus the Favourite button below.
**What:** three differently shaped controls in two rows, with different heights (Log this book 38px, Want to read 38px, Favourite 40px).
**Why it matters:** low; these are the main actions of the book page and deserve one row with equal heights.
**Fix:** same height and padding for all three, from the shared classes in finding 1, in one row that wraps on a phone.
**Status:** fixed 2026-10-13 (Log this book, Want to read and Favourite share one size)

### 6. Smaller outlined buttons in lists and clubs are below the phone touch size — P2 · S · Rule
**Where:** `ListDetailPage .itemControls button` (padding `0 --space-2`), `ClubPage .memberActions button`, `.removeButton`, `.voteButton`, `ListChallengePanel .actions button`.
**What:** these are 24–32px tall on a phone, and several sit side by side.
**Why it matters:** the app aims for 44px touch targets; adjacent small buttons are easy to mis-tap (the Remove next to Edit).
**Fix:** `min-height: 2.75rem` on 640px and below, from the shared class in finding 1.
**Status:** fixed 2026-10-13 (44px high on a phone; the reorder arrows in a list stay compact at 36px wide)

## Looked fine
- The global keyboard focus ring covers every button (`:focus-visible`, 2px accent, offset 2px).
- Filled/outlined/danger colours come only from tokens, and disabled buttons use a consistent 0.6 opacity.
- Toggle chips (Feed filters, tag chips) correctly use a pill shape and a filled "on" state.
- The Follow button and the newly added small variant in the rail are consistent with each other.
- Not checked: Sepia, Dark and German for button text width, and button states on the Clubs page when a club is open.
