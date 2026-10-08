# Shared checks — every page

Each area plan assumes these. Run them once per area, on the area's main pages, rather than repeating them in every step.

| # | Check | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| S1 | Open the page at about 375 px wide, then at 1280 px | Nothing is cut off; the page never scrolls sideways | | | |
| S2 | Switch theme (Paper, White, Warm gray, Sepia, Dark) from the sidebar | Text stays readable, borders and buttons stay visible in every theme | | | |
| S3 | Switch language (English, Español, Português, Deutsch, Français) | No raw keys like `journal.title`, no English left in another language, long German words don't break the layout | | | `👤 person` for wording |
| S4 | Stop the API, reload the page | An error message appears, not a blank page or an endless spinner | | | |
| S5 | Look at the page with nothing in it (a fresh reader) | A friendly empty message, not a blank area | | | |
| S6 | Use only the keyboard: Tab through the page | Every button and link is reached, focus is visible, Escape closes dialogs and menus | | | |
| S7 | Log out, then open the page's address directly | Pages that need an account send you to log in, and bring you back after logging in | | | |
| S8 | Below 640 px, open the ☰ menu | The menu panel slides in from the left and reaches the bottom of the screen; ✕ closes it | | | |
