---
name: project-books-community-split
description: "Decisions so far for splitting Winged Words into a \"Books\" tab and a \"Community\" tab at the top-center; to be written up as a spec later (not yet specced)"
metadata:
  node_type: memory
  type: project
  originSessionId: 7e81c9f4-121e-42d0-8d39-2354abbc9708
  modified: 2026-10-08T21:59:02.836Z
---

Raised 2026-10-08, after the user read Reddit complaints that book apps feel too much like social media. Plan: two top-level sections, centered at the very top. **The spec is to be written later**, once the user says so; until then this memory is the record.

**Decided with the user:**
- **Books** is the default tab, and the app remembers the last tab each reader used.
- **Books** holds personal, book-centered things: their own reading graphs and data, a **journal** ("people really love the journal part"), lists, suggestions. Ratings stay here as personal data.
- **Community** holds: **reviews** (reviews live only here), writings, book clubs, people and following, and discovery. Look for more things to add there, e.g. ways to suggest books.
- **Private books**: a reader can mark a book as read without anyone else seeing it (popular feature people love). Ties into [[project-argos-future-ideas-backlog]] account-level privacy.
- **Community will look empty at launch**: accepted. The user and beta testers will fill it with content first.
- **No off switch.** The user does NOT want a setting that hides Community. Community must always be reachable, it just shouldn't bother readers who don't want it (no pushing it into the Books side).
- **Naming** ("Books" / "Community" / "Writings") will be reviewed later; logged in FUTURE-IDEAS.md.

- **Books also shows the books that are popular on the site** (decided 2026-10-08).
- **Ratings and reviews appear on a book's own page** (its profile), together with the book info and the other social parts. So "reviews only in Community" means the feed; the book page is shared by both tabs and is where ratings and reviews are read.
- **The journal is private by default.**
- **Reading graphs = the stats page** already in `ROADMAP.md`; same feature, no separate work.

- **Anything private can be made visible by the reader if they choose** (journal entries, private books, etc.); privacy is the reader's choice per item, private being the default for the journal.
- **Following:** readers find people to follow from the ratings and reviews on a book's page. What the people you follow write and review shows in **Community only**, never in Books. Books has no followed-people content.

- **Visibility levels: private, followers, public** (decided 2026-10-08).
- **The journal is the general home of everything you read**: every book a reader logs goes in their journal, Letterboxd-diary style. It is different from lists (lists are curated, themed collections). Journal entries carry their own visibility.
- **Private books are visible only to the owner**, and the owner can turn a private book public again, or a public one private, at any time.

**Resolved 2026-10-08 (all open points answered):**
- **Journal = a new view over the existing logs/shelves/reading progress**, not a copy. Logging a book creates the journal entry automatically; notes are added on top.
- **Private books count only in the owner's own stats and journal.** Hidden from popular books, the activity feed, the book page's ratings/reviews and other people's views. No anonymous contribution to site numbers (small-user-base re-identification risk). The spec must list every place to check.
- **A shared (followers/public) journal entry appears in Community as a feed item** ("Ana finished Dune"), reusing the `ActivityEvents` history.
- **Per-entry/per-book visibility ships first; account-level privacy and follow requests come later** as their own spec. Known weakness to note in the spec: "followers" protects little until follow requests exist, because anyone can follow anyone instantly. See [[project-argos-future-ideas-backlog]].

**Spec written 2026-10-08: `Argos/specs/books-community-split.md`** (4 phases, roadmap Stage 2b, not built). Mockup (private artifact): https://claude.ai/artifact/4uNYDeVQkSVE8GHUgZZqq1, source in the scratchpad only. Correction 2026-10-08: the journal is **public by default** (not private as noted earlier), with private available per entry; journal notes stay private. Spec §2.1 still lists four defaults awaiting the user's check (suggestions, News/Lists placement, Readers-to-follow box).

**Why:** answers the "too social" complaint while keeping the social side for those who want it.
**How to apply:** when asked to spec this, follow [[feedback-feature-spec-workflow]] (`specs/books-community-split.md`, Backend/Frontend/Verification headings), add it to `ROADMAP.md`, and re-ask only the open points above.
