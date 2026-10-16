# Pass: typeset

Make text easier to read and the hierarchy obvious: roles, sizes, measure, leading, fonts. Follow DESIGN.md "Typography".

## Rules
- **Body text floor 16px** (`--font-size-base`). 14px only for secondary text (labels, meta); nothing a reader needs below 13px. Reading text (bios, reviews, writings, quotes) is Literata at ~17px.
- **Measure:** prose at 45–75 characters per line (aim 60–70). Data and compact UI may be denser.
- **Leading:** never below 1.3; body 1.5–1.7, reading text ~1.7. Wider lines need more leading.
- **A clear step between roles:** the dominant heading and body differ by at least 1.25×; the product scale between neighbouring steps is ~1.125–1.2. Use few roles; same role = same style everywhere.
- **Fonts:** the fewest families that each have a job no other can do. Display face only for names, titles, section headings and headline numbers, **never** for buttons, labels, table data or counts in rows. Weights: load only the ones used.
- **Tracking:** display may tighten to -0.01/-0.02em (floor -0.04em); body never above 0.05em; no tracked-out uppercase labels above headings (eyebrows/kickers are banned).
- **Numerals:** `font-variant-numeric: tabular-nums` where numbers line up (stats, counts in lists, years in grids).
- **Paragraphs:** spacing or a first-line indent, not both.
- **Light text on dark (Dark theme):** a little more line height, a touch more tracking and one step more weight than in Paper.
- **Long headings:** balanced (`text-wrap: balance`); test German and long book titles at every width.
- **Loading:** `font-display: swap` with a metric-matched fallback (`size-adjust`, `ascent-override`) so the page doesn't jump when the web font arrives.
- **Respect user settings:** sizes in `rem` via the `--font-size-*` tokens (no raw rem, a Vitest guard enforces it), browser zoom and user font size must work.

## Check
Squint: is the hierarchy obvious? Read a real review and a long bio at 375 and 1280, in Paper and Dark. Then `polish`.
