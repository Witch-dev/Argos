# Known bugs

One file per bug, so each can be picked up, fixed and closed on its own. Fixed bugs move to the **Fixed** table with the date and a pointer to the `CHANGELOG.md` entry; their files stay as a record.

## How bugs are classified

**Priority**: how soon it should be fixed.

| Priority | Meaning |
|---|---|
| **P1 — soon** | Users can see something wrong, or it touches privacy/security. Fix before the next feature. |
| **P2 — next** | Real, but rare or only affects developers. Fix when working nearby or in a cleanup pass. |
| **P3 — later** | Edge cases, or waiting on a bigger feature that will fix it anyway. |

**Size**: rough effort to fix, including tests.

| Size | Meaning |
|---|---|
| **S** | Under an hour: one or two files, obvious fix. |
| **M** | A few hours: several files, or a fix that needs care. |
| **L** | A day or more: needs a design decision or a new feature. |

## Open

| Bug | Priority | Size | Area |
|---|---|---|---|
| [Blocks only apply while signed in](blocks-only-apply-signed-in.md) | P3 | L | Backend, privacy |
| [Blocks don't apply in book club discussions](blocks-not-applied-in-club-discussions.md) | P3 | M | Backend, clubs |
| [Writings' Popular list ranks every writing on every request](writings-popular-query-cost.md) | P3 | M | Backend, performance |
| [Removing a title can race with a new highlight-comment](remove-title-highlight-race.md) | P3 | S | Backend, writings |
| [Deleting a writing isn't one transaction](writing-delete-not-atomic.md) | P3 | S | Backend, writings |
| [A time zone .NET knows but Postgres doesn't would break the Feed](time-zone-name-mismatch-500.md) | P3 | S | Backend, Feed |
| [The Readings strip relies only on follows being removed when someone blocks](readings-strip-no-block-safety-net.md) | P3 | S | Backend, privacy |

## Fixed

| Bug | Fixed | Where |
|---|---|---|
| [List tags can't contain accented letters](list-tags-reject-accents.md) | 2026-10-07 | `CHANGELOG.md`, "List tags accept any language's letters" |
| [The activity part of the Feed reads every followed reader's whole history](activity-feed-query-reads-whole-history.md) | 2026-10-07 | `CHANGELOG.md`, "The Feed's activity rows no longer read whole histories" |
| [Blocks don't apply between commenters](blocks-not-applied-between-commenters.md) | 2026-10-07 | `CHANGELOG.md`, "Blocks now reach comments" |
| [Slow frontend tests time out when the whole suite runs](mood-test-times-out-under-load.md) | 2026-10-07 | `CHANGELOG.md`, "Languages, Phases 2 and 3" |
| [On a phone, a book's subject tags push "Log this book" far down the page](book-page-subjects-bury-log-button-on-phone.md) | 2026-10-06 | `CHANGELOG.md`, "Book page: long subject lists start folded" |
| [Logout keeps the previous user's cached data](logout-keeps-cached-data.md) | 2026-10-06 | `CHANGELOG.md`, "Hardening, phase 2: sessions that renew themselves, clean logout" |
| Integration-test database never cleared, so a discovery test failed every run | 2026-10-05 | `CHANGELOG.md`, "Integration tests start from an empty database" |
