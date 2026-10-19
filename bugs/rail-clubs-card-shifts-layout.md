# The right rail jumps when "My Book Clubs" arrives

**Priority:** P2 · **Size:** S · **Area:** Frontend, layout · **Found:** 2026-10-18 (shelf refresh, Clubs: `shoot.mjs --shifts`)

## What happens

For a reader who belongs to clubs, the rail's "My Book Clubs" card renders once `/clubs/mine` answers (`MyClubsCard` returns `null` until then) and pushes the rail's other cards about 340px down. At 1280 that is a layout shift of 0.118 on every page (`section._card_… y 72→417` in the `--shifts` output), so the club pages measured CLS 0.128 (target under 0.1). Phones don't show the rail, so 375 is unaffected (0.068, the shell header).

## Fix

Reserve the card's place while `/clubs/mine` loads (a skeleton of the heading and a row or two, as DESIGN.md "Reserve space for late-arriving things" asks), or load the rail's cards in a fixed order that doesn't insert above ones already shown. Check with `node scripts/shoot.mjs /feed --shifts --widths 1280` using a reader in two or three clubs.

## Fixed 2026-10-19

`MyClubsCard` shows its heading and `Skeleton` lines while `/clubs/mine` loads instead of nothing (a failed request still leaves it out). With the reader in two clubs, a cold load of `/feed` at 1366 measured CLS 0.054 (was 0.118 for the rail alone). Test: `MyClubsCard.test.tsx`, "holds its place".
