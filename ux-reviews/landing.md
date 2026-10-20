# UX review — Landing page (`/`, signed out)

Reviewed: 2026-10-18 · Themes: Paper, Dark · Widths: 375, 1280 · Visitor: signed out · Apollon at `be32e1c`
Screenshots looked at: the page at the top and 800, 1,600 and 2,400px down, at 1280 and 375, Paper and Dark. Metrics: CLS 0.000 at both widths, LCP 1.1–1.4s (dev server). The opening's settle was judged when built (Phase 3, with reduced motion).
Code read: `LandingPage.tsx` and its demo pieces.

## Summary

The strongest page on the site: the pitch beside a real shelf of three classics, spoiler-free clubs on a full-width book-cloth band, demos built from the real pieces and labelled as examples. Only polish is left.

## Scores

**Nielsen: 31/36 (86%, good).** Error recovery (9) n/a. Scored 2: none; 4: aesthetic (8). Cognitive load: low (0 failed). Personas: Riya (first-timer from a friend's invite): understands what it is from the pitch and the shelf, finds Join on the first screen. A screen-reader user: demos are labelled examples, the shelf's books named. Specificity: passes, no other product could use this page unchanged.

## Findings

### 1. Two logos in the first view on a phone — P3 · S · Judgement
**Where:** "375 at the top": the top bar's small dog and the hero's 6rem dog, 50px apart.
**Fix:** below 640px leave the logo out of the top bar (the hero's is right under it), or the hero's; the decision to keep the hero dog stands.
**Status:** fixed 2026-10-18: below 640px the top bar has no logo (Log in and the language stay on the right).

### 2. "p. 214 of 380" vs the app's "Page 220 of 320" — P3 · S · Rule
**Where:** `DemoShelf` (Jane Eyre's caption); the app's rail and club cards say "Page N of M".
**Fix:** use the app's own string (`… page N of M` key) so the sample matches what a reader will see.
**Status:** fixed 2026-10-18: the sample uses the app's "Page 214 of 380".

### 3. The trust card's claims — P3 · S · Judgement (question)
**Where:** "Independent, and not owned by Amazon. Winged Words is made by readers, for readers. No ads."
**What:** PRODUCT.md: keep claims true; "not owned by Amazon" also names another company on a page that otherwise only talks about itself.
**Fix (question):** confirm the three claims with the user; consider "Independent, with no ads" and leave Amazon out.
**Status:** changed 2026-10-18 as recommended, waiting on the user: heading "Independent, with no ads", text "Winged Words is made by readers, for readers." (Amazon left out, no new claim added).

### 4. Two logos in the first view on desktop too — P3 · S · Judgement
**Where:** at 1280 the top bar's dog and the opening's 9rem dog, about 100px apart (#1 had only fixed phones, which then had no logo in the bar at all while scrolling).
**Fix (chosen by the user 2026-10-20, option A of three):** the top bar's logo waits while the opening's dog is in view (an IntersectionObserver that takes the sticky bar's height off the top) and fades in once it scrolls away, at every width. Hidden with `visibility`, so it can't be tabbed to; 200ms in, 120ms out. A change of state of the bar, not a content reveal (DESIGN.md "Motion").
**Status:** fixed 2026-10-20.

### 5. The strengths spread out and read as one run — P3 · S · Judgement
**Where:** 1280, from the clubs band to the basics: 96px between strengths and 64px between each text and its card, three cream sections that look alike.
**Fix:** 48px between text and card; each strength full width with 48px above and below; the middle one ("Read, and write") on a sunken well across the window, a quiet echo of the band.
**Status:** fixed 2026-10-20.

### 6. "Page 214 of 380" broke before the last number on a phone — P3 · S · Rule
**Where:** 375, under Jane Eyre on the opening's shelf.
**Fix:** kept on one line, at the xs size on phones (checked in German, "Seite 214 von 380").
**Status:** fixed 2026-10-20.

### 7. The opening's shelf sat small at the bottom of its column — P3 · S · Judgement
**Where:** 1280: covers of about 10rem aligned to the bottom of the pitch, empty space above them.
**Fix:** the shelf's column a little wider (40rem, covers about 11rem) and centred against the pitch.
**Status:** fixed 2026-10-20.

## Looked fine

**The showcase** (checked 2026-10-20 with `Landing__ShowcaseEnabled=true` on the side-port API, since it is off in `appsettings.json`): popular books as a shelf that scrolls sideways, recent reviews as three cards (stacked on a phone), Paper and Dark, no sideways page scroll; its book and review links open for a signed-out visitor, but the page they open starts scrolled down (bugs/new-page-opens-scrolled-down.md). The dev data fills it with test readers' reviews of one test book, so its look with real reviews is still to see once it's switched on.

One green button on the first screen (the top bar's Join is secondary); the pitch at the hero size with balanced lines; three covers that keep their size on a phone; the band's heading at display size; demos as raised cards with named readers and the "Example, with made-up readers" line; basics and trust side by side; no layout shift; Dark keeps the band and the cards readable.
