# A composer's disabled Post button almost disappears in Paper

**Priority:** P3 · **Size:** S · **Area:** Frontend, design, composers · **Found:** 2026-10-23 (design critique of `specs/stronger-clubs.md` Phase 5) · **Status:** Open

## What happens

While a composer is empty, its green button (Post, Share) is drawn in the frame-well colour on the sunken well (`CommentForm.module.css` `.submit:disabled`, the same in `HighlightComposer.module.css`). In Paper that is beige on beige, so the page's one primary action is hard to see until you type. In Dark it reads as an outlined button and is fine.

## Why it matters

DESIGN.md asks controls to reach 3:1 and every button state to be designed; a reader on a phone may not see where to post.

## Fix

One site-wide change to the disabled look of `.submit` in `CommentForm.module.css` (and the highlight composer, which copies it): keep the green at reduced opacity, or add a 1px `--border`, and check it at 3:1 in all five themes. Every comment composer uses it, so check the review, writing, checkpoint and buddy-read pages.
