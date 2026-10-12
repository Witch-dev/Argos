# Visual pass checklist

Applied to screenshots. Each line is a question; a "no" is a finding. Tag it Rule or Judgement as the SKILL says.

## 1. Hierarchy: what is read first, second, third

- Is there one obvious focal point per screen (a title, a book cover, the primary action)? Squint: does the page still have a clear order?
- Do size, weight and colour agree with importance? Titles in serif and larger, metadata in `--text-muted` and smaller. Nothing minor looks louder than something major.
- Is there exactly one **primary action** in a view, visibly different from the secondary ones? (`--accent` fill for primary, plain or outlined for the rest.) Two filled accent buttons side by side compete.
- Is the reading order top-to-bottom and left-to-right the order a reader needs?
- Are headings real hierarchy (h1 → h2 → h3 without skipping), not just big text? *(Rule)*

## 2. Spacing and grouping

- **Proximity:** related things sit closer to each other than to unrelated things. If the gap inside a group equals the gap between groups, it reads as one undifferentiated block.
- Is the rhythm consistent: the same gap between like things across the page, and the same as on sibling pages? Only `--space-1/2/3/4/6/8` should appear.
- Does anything feel cramped (text touching a border, buttons almost touching) or lost (a tiny element in a big empty area)?
- Are card paddings, list-row heights and section gaps the same across similar screens (shelves, lists, clubs)?
- At 375px: is there a 16px gutter (`--space-4`), no horizontal scroll, and nothing wrapping into an ugly orphan?
- Between 641px and 1100px (rail hidden) and above 1100px (rail shown): does the middle column still breathe?

## 3. Text: size, length, contrast

- **Body text** at least ~16px (1rem); reading text (reviews, writings, notes) in serif with comfortable line height (about 1.5) and a line length of roughly 45–80 characters.
- **Smallest text** (metadata, timestamps) not below ~0.8rem, and not in `--text-subtle` when it carries information the reader needs. `--text-subtle` is for genuinely optional detail.
- Contrast *(Rule)*: normal text 4.5:1, large text (≥ 24px, or ≥ 18.5px bold) 3:1, icons, borders and focus rings 3:1. Check `--text-muted` and `--text-subtle` on `--bg` **and** `--bg-elevated` in every theme under review, since the same token can pass in Paper and fail in Sepia.
- Is meaning ever carried by colour alone (a red/green state, a filled vs. empty heart with no text)? *(Rule)*
- Long content: a 60-character book title, a long username, a 5,000-character review. Does it wrap, truncate with a visible full text on hover/tap, or break the layout?
- Numbers that line up in columns use tabular numerals (stats tables, counts).
- **Essential text is never clipped just to keep cards uniform.** A clamped title or author name needs a visible way to read the whole (tooltip is not enough on touch; wrap, or open the detail). Badges and short labels stay on one line or wrap cleanly, never clip silently. *(Rule)*
- **Chips and tag rows** (genres, shelves, "readers say" tags) wrap onto more lines or offer an operable "+n more", never one clipped row.
- **Type scale:** are the sizes on the page drawn from a small consistent set (the same 3–5 sizes recurring), or is every component picking its own? Argos has no type-scale tokens yet (`design-tokens.md`); a page with many near-identical sizes (0.85, 0.875, 0.9rem) is a finding that points toward adding `--font-size-*` tokens, so raise it as a pattern across pages, not a one-off.

## 4. Menus and navigation

- Can a first-time reader tell where they are? Is the current item visibly marked in the sidebar and in tab rows?
- Are menu items grouped logically, ordered by how often they're used (not alphabetically by habit), and short?
- Are item labels **nouns for places, verbs for actions**, and the same word for the same thing everywhere? (One of "Shelf" / "Library" / "Collection", not three.)
- Do icons always come with a text label, or have an obvious meaning plus an accessible name? A mystery icon is a finding.
- Dropdowns and popovers: do they open next to what triggered them, close on Escape and outside click, and not run off the screen at 375px?
- The mobile drawer: reachable with one thumb, closes after choosing, and the current page is marked.
- Is the depth sensible: can the reader reach the main things in one or two taps?

## 5. Options, labels and copy

- **Is the next step obvious?** Buttons say what they do ("Add to shelf", "Save review"), not "Submit", "OK" or "Click here".
- Are choices few and clearly different? More than ~5 peer options, or two options that look the same, make a reader stop and think. Group them, or hide the rare ones.
- Is the **safe default** pre-selected, and is the destructive option visually distinct (`--danger`) and confirmed or undoable?
- Are settings phrased so the on/off state is unambiguous? ("Private account: on" is clear; "Don't hide my shelves: off" is not.)
- Does every control say what will happen *before* the reader presses it (especially anything visible to others: privacy, publish, follow)?
- Error messages say what went wrong **and what to do next**. Empty states say what the screen is for and offer the first step.
- Tone and wording consistent with the rest of the app and the glossary used in the locale files. Same word for the same thing in all five languages.

## 6. States and feedback

- Is every state designed, not just the happy one: loading (through `LoadingMessage`), empty (`EmptyMessage`), error (`ErrorMessage`), success feedback after an action, and a disabled control that explains why?
- After an action, does the reader get confirmation within a second (the button changes, a toast, the item moves)? Does a long action show progress?
- Does hover, active and focus each look different from the resting state, and are they more prominent than it?
- Does the layout jump when content arrives (an image without reserved space, a list that pops in)?

## 7. Touch and mobile

- Tap targets at least 44×44px, including the clickable area of small icons, with room between neighbours so a thumb doesn't hit the wrong one. *(Rule; WCAG 2.2 requires 24px minimum, 44px is the target here.)*
- Primary actions reachable at the bottom half of the screen where practical; nothing important hidden behind hover.
- Modals and drawers fit within the viewport, scroll inside themselves, and don't scroll the page behind.
- The on-screen keyboard doesn't cover the field being typed in.

## 8. Consistency across the app

- Does this screen look like it belongs to the same app as `Home`, `Shelves` and `Lists`: same card style, same header treatment, same spacing, same button hierarchy?
- Do shared components (`BookCard`, `Avatar`, `StateMessage`, `ThemeMenu`) look and behave the same wherever they appear?
- Does it hold up in all five themes, not just the one it was designed in?
