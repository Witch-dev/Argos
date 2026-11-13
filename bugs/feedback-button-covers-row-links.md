# The floating feedback button covers links at the right edge on a phone

**Priority:** P3 · **Size:** S · **Area:** Frontend, shell (Feedback button), phone
**Found:** 2026-11-13, by the `design-reviewer` while checking specs/five-books.md Phase 3.

## What happens

At 375px the round feedback button (`web/src/components/Feedback.module.css`, `position: fixed`, bottom-right, 3rem) sits over whatever reaches the right edge at the bottom of the screen. On a profile it covered the "See all (6)" link in the Favourite authors heading while that row was at the bottom of the screen, so the link was half hidden until the reader scrolled.

## Why it matters

A link under a floating button can't be tapped where it is. It only happens while the row passes the bottom corner, so it's an annoyance, not a lock-out.

## Fix ideas

- Give the page column bottom padding on phones so content can scroll clear of the button (it's already clear at the very end of the page?), and/or
- Shrink or hide the button while the page scrolls, as some sites do, or move it into the menu drawer on phones.
