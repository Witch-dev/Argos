# The log form on a book's page is wider than a phone screen

**Priority:** P2 · **Size:** S · **Area:** Frontend, book page, phone layout
**Found:** 2026-10-20, during the safety-and-moderation Phase 4 browser check (not caused by it)

## What happens

On a book's page at 375px, opening **Log this book** (or **Log it again**) shows a form that runs off the right edge: the page scrolls sideways (`document.documentElement.scrollWidth` is 400 at a 375 viewport) and the right side of every field, and the end of hint lines like "Private hides the book and its review from everyone but you.", is cut off.

Measured: each field (`Form.module.css .field`, its `select`, the edition picker's `.current`) is 352px wide with its right edge at 384px, so the form is about 25px wider than the column it sits in. Same for a confirmed and an unconfirmed reader, so it isn't the new locked-stars line.

## Where to look

`web/src/pages/BookDetailPage.module.css` (`.actions`, the column the form opens in) and `web/src/components/Form.module.css` (`.form`: `max-width: 28rem` plus `padding: var(--space-6)`, with no `min-width: 0` / `box-sizing` guard). Probably the form's padding is added to a width that already fills the column, or a grid/flex child without `min-width: 0`.

## Fix

Make the form fit its column at 375 (and check 320), then confirm `scrollWidth === innerWidth` with `scripts/shoot.mjs --metrics` or a Playwright check.
