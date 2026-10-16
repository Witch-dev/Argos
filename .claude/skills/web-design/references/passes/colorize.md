# Pass: colorize

Give colour real jobs on a screen that is grey or monotone, within DESIGN.md. Preserve the confirmed palette: colorize never replaces the look.

## Rules
- **Roles, not swatches:** page, frame, raised, sunken, ink, muted ink, action/focus/selection (green), stars (gold), the heart, danger, plus states (hover, focus, active, disabled, selected, loading, error, success). Each token keeps one meaning in every theme.
- **Strategy by kind of screen:** Operate and Read screens are *Restrained* (tinted neutrals + the green with real jobs). The landing page may be *Committed*: one book-cloth colour owning whole regions, not scattered accents. A grey screen with one accent is the default look, not restraint.
- **Let the strongest colour own a role or region** instead of sprinkling small accents. The primary action stays easy to find; its colour is never decoration.
- **New shades in OKLCH:** vary lightness, lower chroma near white and black. Hex in `index.css` is fine as the stored value.
- **Secondary text on a coloured surface** is a darker or lighter shade of that surface (or the foreground), never generic grey.
- **Prefer solid colours** over stacked translucent layers: alpha makes contrast depend on what's underneath.
- **Dark theme is designed, not inverted:** its own depth (raised is lighter than page), its own lighter green, contrast checked.
- **Contrast (WCAG AA):** body 4.5:1, large text, icons, controls and focus rings 3:1, in every theme and state.
- **Never colour alone:** pair colour-coded meaning with text, shape or an icon; simulate red-green and blue-yellow colour blindness for anything colour-coded (stats charts, states).
- **Theme by scene, not habit:** the reading scene (often evening) decides light vs dark defaults, not the category.

## Check
Every colour has a job you can name; contrast passes in all five themes; it still reads in greyscale. Then `polish`.
