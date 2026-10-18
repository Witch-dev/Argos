# Like and comment buttons are smaller than 44px

**Priority:** P3 · **Size:** S · **Area:** Frontend, accessibility · **Found:** 2026-10-16 (design review of the author page restyle, `specs/shelf-design-refresh.md` Phase 3) · **Status:** Fixed 2026-10-18

## What happens

The like (heart) and comment buttons under writings and quotes measure about 29×24px and 37×24px at 375px wide (measured on the author page's quote cards). They pass WCAG 2.2 AA's 24px minimum, but `PRODUCT.md` asks for 44px tap targets everywhere, and on a phone they are easy to miss.

## Why

`Apollon/web/src/components/FeedSocialBar.tsx` and its styles size the buttons to their icon and count. The same bar is used by the Feed, the Writings list and the author page's quotes, so it predates the restyle.

## Suggested fix

Give each button a 44px minimum height and width through padding or a `::before` hit area (as `SectionSwitch.module.css` does for its segments), without making the bar look taller. Check the Feed, a writing and the author page at 375 afterwards. A good fit for the "Feed, writings and reviews" page of the shelf refresh.

## Fix

2026-10-18, in the Feed, writings and reviews page of the shelf refresh: the like button (`LikeButton` compact) and the comment count (`ReviewSocialBar.module.css`, shared by `FeedSocialBar`) are 44×44px at every width; the bar pulls in by the extra room, so it still reads as one quiet line. Checked on the Feed, a writing and the Reviews list at 375 and 1280.
