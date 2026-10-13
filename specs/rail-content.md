# Feature Spec — Rail content (right rail cards)

**Status:** ✅ Built 2026-10-12 (not yet looked at in a browser).

## 1. Problem

The right rail was nearly empty in Books (year card and goal) and sparse in Community, and the left column under the menu was empty. The user also did not want other people's activity inside the Books centre, which is meant to be only about the reader and their books.

## 2. Decisions (with the user, 2026-10-12)

- **Left column:** no action button. A Log progress and a Write button were built and both removed 2026-10-12 as redundant: the "+" tile in the strip and the composer box in the feed are right there. The column stays empty under the menu on purpose.
- **Books right rail:** Currently reading (cover, title, bar, "Page X of Y"), Year so far, Reading goal, Up next (three want-to-read covers), then **Popular on Winged Words**.
- **Community right rail:** My Book Clubs, Lists (the 3 popular public lists this week, plus "Browse lists"), Suggested readers, **Popular on Winged Words**, Book news (3 headlines + "More news").
- **Popular moved out of the Books centre** into the rail in both sections: it is about other readers, and the Books centre is about you.
- **A card with nothing to show renders nothing** (no "nothing here yet" boxes).
- **Also done 2026-10-12:** hairline dividers between rail sections; the year card as a big number with two tiles.
- Left out for later: Friends are reading, Clubs to join, streak / pages this week (need new endpoints).

## 3. Tasks

### Frontend
- [x] `RailCards.tsx`: `CurrentlyReadingCard`, `UpNextCard`, `PopularCard`, `NewsHeadlinesCard`, using the existing queries.
- [x] `RightPanel.tsx`: cards placed per section; `BooksHomePage.tsx`: Popular row removed.
- [x] Translations in all five languages (`rightPanel.json`, `nav.json`).
- [x] `RailCards.test.tsx`.

### Verification
- [ ] Look at both sections in a browser (Books with and without books, Community).

## 4. Known trade-offs
- The rail is hidden below 1100px, so on a phone Popular no longer shows in Books at all (it used to be in the page). Same as the Community cards today.
- Up next repeats the first covers of the Your want-to-read row in the centre, on wide screens.
