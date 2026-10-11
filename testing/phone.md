# Test plan — Works well on a phone

Spec: `specs/phone-pass.md`. Do this on a **real phone** (Android Chrome and, if you have one, iPhone Safari), signed in as a reader who is reading at least one book with a page total. The shared checks in `_shared.md` still apply (S1, S2, S6, S8).

Mark each row 📱 when done on the phone, 🖥️ when done on a desktop browser squeezed below 640 px.

| # | Do this | Expect | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| P1 | Open Books home. Tap the **+** tile, then "Update progress on a book I'm reading", then a book | A sheet slides up from the bottom with the book, a progress bar and "Page X of Y", **+10 pages** and **Finished!** | | | |
| P2 | Tap **+10 pages** twice | The page number goes up by 10 each time and the bar grows. The sheet stays open | | | |
| P3 | Near the last page, tap **+10 pages** | It stops at the last page, and the button is then greyed out | | | |
| P4 | Tap **Edit details** | The full form appears; saving closes the sheet | | | |
| P5 | Tap **Finished!** | "Finished! How was it?" with five big stars, **Skip** and **Add a review** | | | |
| P6 | Tap a half star with your thumb (for example 3.5) | The rating saves and the sheet closes. The book shows as Read with that rating in your journal | | | |
| P7 | Repeat P5, then tap **Skip** | The sheet closes. The book is Read with no rating | | | |
| P8 | Repeat P5, then tap **Add a review** | The log form opens with your book, rating and review fields; saving closes it | | | |
| P9 | Open a book you are reading | **+10 pages** and **Finished!** show above the description, under the title. The cover is small, not full-screen | | | |
| P10 | On a book you are *not* reading | No quick-log box | | | |
| P11 | Open the Feed (Community). Try the All / Reviews / Writings / Activity chips and the like buttons | All are easy to hit with a thumb; nothing scrolls sideways | | | |
| P12 | Open a club, a round, and a checkpoint | Everything fits the screen; "I've read this far" is easy to tap | | | |
| P13 | Open the ☰ menu: change theme and language | Both controls are easy to tap; the menu still reaches the bottom | | | |
| P14 | Turn the phone sideways, then back | Layout re-flows, nothing is cut off | | | |
| P15 | Open "Log this book", tap into a field | The page does not zoom in when a field is focused, and the keyboard doesn't hide the Save button (scroll if needed) | | | |
| P16 | Go to a page that doesn't exist (`/nope`) | A friendly message with "Back home" and "Search for a book" | | | |
| P17 | Tab through any page with a keyboard | A visible ring shows where you are. The first Tab stop is "Skip to content", and Enter jumps to the main column | | | |
| P18 | Android Chrome: menu → **Install app** / **Add to Home screen** | An icon with the winged dog on a cream background appears. Opening it shows the site without the address bar | | | |
| P19 | iPhone Safari: Share → **Add to Home Screen** | Same icon and name "Winged Words" | | | |
| P20 | Switch to Dark and Sepia and repeat P1, P5 and P9 | Stars, bar and buttons are readable in each theme | | | |
