# Kinds of screen: Operate, Read, Persuade

Every screen has one mode, chosen by what the reader came to do there (not by the product). It sets how much room, density and boldness the screen gets. DESIGN.md has the summary; this is the depth. Adapted from Impeccable's `operate`, `mode-read` and `mode-persuade` (Apache 2.0, see `Argos/THIRD-PARTY-NOTICES.md`).

| Mode | Winged Words screens |
|---|---|
| **Operate** (complete a task) | Shelves and My books, journal, search, lists editing, settings, notifications, import, clubs admin, the log form |
| **Read** (understand something) | Book page, author page, a review, a writing, a list's page, news, the legal pages |
| **Persuade** (decide and act) | Landing page, the invite and sign-up pages |

## Operate

The test is **earned familiarity**: someone used to apps like this trusts every control at once. The failure is not flatness but strangeness without purpose: over-decorated buttons, mismatched form controls, gratuitous motion, display fonts on labels, invented controls for standard tasks. The tool disappears into the task.

- **Type:** a fixed rem scale (never fluid sizes); neighbouring steps about 1.125–1.2 apart; the display face never on labels, buttons, table data or counts in rows. Prose still keeps 65–75ch.
- **Colour:** Restrained: tinted neutrals plus the green with real jobs. A second neutral layer for the frame (our sidebar and header tint). The accent only for primary actions, current selection and state, never decoration; no heavy colour on inactive things.
- **States, standardised:** hover, focus, active, disabled, selected, loading, error, warning, success, info. Every interactive component ships all of default, hover, focus, active, disabled, loading and error.
- **Components:** skeletons for loading (not spinners inside content); empty states that teach (see the `onboard` pass); the same button shape, form controls and icon style everywhere; overlays escape their container (a menu inside `overflow: hidden` gets clipped: use `position: fixed`, the popover API or a portal).
- **Motion:** 150–250ms; state and feedback only; no page-load choreography.
- **Never:** decorative motion, the same action looking different on two screens, reinvented standard controls (custom scrollbars, odd form controls, non-standard modals), a modal as the first idea (exhaust inline and progressive options first).
- **Allowed:** density where readers need it (long shelves, many labels), standard navigation (sidebar, tabs, breadcrumbs), consistency over surprise; delight saved for moments, not pages.
- **Self-check:** cover the name: does it still read as a well-made app of its kind, is the task easy, and is it cleaner than the category while still more distinctive?

## Read

The reader's question leads; comprehension and wayfinding stay intact at every step. A book page reads as a book page, a review as a review.

- **The look owns the frame, the column stays calm:** the header, sidebar, page title, section openers and the way covers, quotes and tables are set carry the palette, the type and the shelf. The reading column inside is quiet: the reading face (Literata), real contrast, a real measure (~60–75ch at ~16–17px), nothing performing behind the text.
- **The look never supplies the reading order** and never replaces the navigation with something a reader must learn.
- Quotes, tables and figures sit in forms readers already know, set in our type and palette. The signature (the shelf) is used where it earns its place, never as a frame around every element.
- **Self-check:** can a reader tell where they are and where to go next, and read comfortably? Cover the name: could this be any other book site? If yes, push the frame further into our look; if the page reads as decoration before it reads as a page, pull it back.

## Persuade

The design is what the visitor judges. The opening makes the offer clear and desirable, shows the main action in its working form (for us: sign up / join with an invite, or log a first book), and demonstrates something only Winged Words can show (friends' shelves, the shelf itself, real reading).

- The look may carry the page (the cream page and the shelf as the structure, book-cloth colours owning whole regions), but the page still works as a page: links read as links, text reads against what's behind it, the primary action is unmistakable, sections keep a steady rhythm.
- Avoid both ends: a picture of the world with no working parts (a poster), and the generic product page (headline, subcopy, button, a row of equal cards).
- One sensory moment at most (see the `overdrive` pass), on top of everything in DESIGN.md.
