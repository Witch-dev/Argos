# Pass: harden

Make a screen survive real use: extreme content, every error, slow networks, other languages, zoom and assistive technology. Write down what produced the evidence (Playwright at a width, a throttled network, a real phone) and what stayed untested.

## Extreme content
- Names, titles and descriptions of 100+ characters wrap or truncate (with the full text reachable) without breaking the layout. Flex and grid children have `min-width: 0`.
- Empty and one-character input; emoji, accented, CJK and RTL text in every field.
- Big numbers (a reader with 1,000+ books, counts in the millions) formatted through `Intl` (`formatNumber`).
- Long lists paginate or "Show more" (no 1,000-row render); dropdowns over ~50 options get search or filtering.
- Anthologies: long author lists use `authorsLine`; the book page shows what it has.

## Languages (five)
- Budget 30–40% more width; test German. No fixed widths on buttons or labels with translated text.
- Logical CSS properties (`margin-inline-start`) so RTL would work later; mirror directional icons.
- Dates, numbers and plurals through `Intl` and i18next, never hand-written.

## Errors (each specific, each with a way out)
- No connection, timeout, slow response: a message and a retry button.
- By status: 400 validation messages beside the field; 401 to sign-in; 403 a permission message; 404 a not-found state (also for private and blocked profiles); 429 our rate-limit message; 500 a general error.
- Form errors inline, specific, suggest a fix, keep the reader's input.
- Ten rapid clicks create one action: the control is disabled or the mutation guarded while pending.

## Empty, loading, permission
Every empty list, search and notification list gives a next action (see `onboard`). Loading names what is loading (skeletons); long operations (import) show real progress. Permission cases explained without leaking private data.

## Slow and offline
Throttle to slow 3G and go offline: pages degrade gracefully, optimistic updates roll back on failure (React Query `onError`), in-flight requests are cancelled on unmount.

## Accessibility and text size
Body 16px on phones; layout holds at 200% zoom; everything works by keyboard; modals manage focus; dynamic changes announced (`role="status"`); works in Windows high-contrast mode (`forced-colors`); meaning never by colour alone.

## Interrupted gestures (drag to reorder lists, sliders)
A second pointer doesn't steal the drag; `pointercancel`, lost capture, release outside or window blur clears the drag state; the next tap works without a reload.

Then `polish`. Hardening found a behaviour bug instead of a design issue? File it in `bugs/`.
