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
| [Two account erasures at once can both create the "Deleted user" placeholder](deleted-user-placeholder-race.md) | P2 | S | Backend, account deletion (flaky test) |
| [The log form on a book's page is wider than a phone screen](log-form-overflows-on-phone.md) | P2 | S | Frontend, book page, phone |
| [A profile keeps going back to "Loading" when one of the rows above its shelves fails](profile-reloads-when-a-row-fails.md) | P2 | S | Frontend, profile page |
| [The "Google sign-in off" test fails on a machine with a Google client ID in its user-secrets](google-signin-off-test-reads-user-secrets.md) | P2 | S | Backend tests, local only |
| [Blocks only apply while signed in](blocks-only-apply-signed-in.md) | P3 | L | Backend, privacy |
| [Writings' Popular list ranks every writing on every request](writings-popular-query-cost.md) | P3 | M | Backend, performance |
| [Removing a title can race with a new highlight-comment](remove-title-highlight-race.md) | P3 | S | Backend, writings |
| [A sign-up racing a rename can take the name being given up](username-hold-race.md) | P3 | S | Backend, accounts |
| [An old username only redirects on the profile page](held-username-only-on-profile.md) | P3 | S | Backend + frontend, accounts |
| [The data export says nothing about a reader's clubs](club-memberships-missing-from-export.md) | P3 | S | Backend, export, privacy |
| [A composer's disabled Post button almost disappears in Paper](disabled-post-button-faint-in-paper.md) | P3 | S | Frontend, design, composers |
| [On a phone, the floating feedback button covers the end of a page's main button](feedback-bubble-covers-primary-action.md) | P3 | S | Frontend, phone, feedback button |
| [Backend queries that will slow down as readers grow](backend-scale-hotspots.md) | P3 | M | Backend, performance |
| [Small backend gaps from the launch review](backend-review-minor-gaps.md) | P3 | S each | Backend |

## Fixed

| Bug | Fixed | Where |
|---|---|---|
| [The backend test suite sometimes stops partway and never finishes](backend-tests-stall-mid-run.md) | 2026-10-26 | Apollon c8dc503 (a deadlock between test hosts' allocation listeners) |
| [Open Library refuses connections from production, and search says "nothing found"](open-library-refuses-production.md) | 2026-10-25 | the bug file, "Fixed" |
| [A search's "exact title" rule misses a title that starts with "The"](search-exact-title-ignores-article.md) | 2026-10-25 | the bug file, "Fixed" |
| [A book saved in the week before ratings shipped waits a week for its Open Library rating](ratings-backfill-waits-a-week.md) | 2026-10-25 | the bug file, "Fixed" |
| [Book clubs show a member's progress even when that book is private](club-progress-ignores-reading-visibility.md) | 2026-10-23 | the bug file, "Fixed" (option 2: kept, and said in three places) |
| [Account emails have no overall daily budget](email-sending-has-no-overall-budget.md) | 2026-10-22 | the bug file, "Fixed" |
| [Failed logins, lockouts and account changes leave no log line](security-events-not-logged.md) | 2026-10-22 | the bug file, "Fixed" |
| [A new endpoint is public unless someone remembers [Authorize]](endpoints-public-unless-marked.md) | 2026-10-22 | the bug file, "Fixed" |
| [Docker base images follow a tag, and workflows don't limit their token](supply-chain-pinning-gaps.md) | 2026-10-22 | the bug file, "Fixed" |
| [Whether an email has an account can be found out through sign-up or login timing](email-enumeration-signup-login.md) | 2026-10-22 | the bug file, "Fixed" (login; sign-up and change email: specs/signup-check-your-inbox.md) |
| [Nobody can leave a book club](club-members-cant-leave.md) | 2026-10-21 | the bug file, "Fix" |
| [The website's container runs nginx as root](web-container-runs-as-root.md) | 2026-10-21 | the bug file, "Fixed" |
| [Opening a public club from Discover is a dead end for non-members](public-club-dead-end-for-non-members.md) | 2026-10-20 | the bug file, "Fixed" |
| [A new page opens at the old page's scroll position](new-page-opens-scrolled-down.md) | 2026-10-20 | the bug file, "Fixed" |
| [A blocked reader can tell who blocked them in a shared book club](block-detectable-in-shared-club.md) | 2026-10-20 | the bug file, "Built" |
| [Blocks don't apply in book club discussions](blocks-not-applied-in-club-discussions.md) | 2026-10-19 | `specs/safety-and-moderation.md` Phase 1 |
| [The right rail jumps when "My Book Clubs" arrives](rail-clubs-card-shifts-layout.md) | 2026-10-19 | `CHANGELOG.md`, "Design leftovers" |
| [Book descriptions show Open Library's Markdown as raw characters](book-description-shows-markdown.md) | 2026-10-19 | `CHANGELOG.md`, "Design leftovers" |
| [Like and comment buttons are smaller than 44px](social-bar-small-tap-targets.md) | 2026-10-18 | `CHANGELOG.md`, "Shelf refresh Phase 3, Feed, writings and reviews" |
| [The rail's club card shows the next checkpoint a day early west of UTC](rail-club-checkpoint-date-day-early.md) | 2026-10-18 | `CHANGELOG.md`, "Shelf refresh Phase 4: fixes" |
| [A club says "You've finished the book" on its page and "Not started" everywhere else](club-progress-differs-between-page-and-rail.md) | 2026-10-18 | `CHANGELOG.md`, "Shelf refresh Phase 4: fixes" |
| [Searching a common word in "My languages" finds nothing](search-common-word-in-language-finds-nothing.md) | Worked around, 2026-10-18 | `CHANGELOG.md`, "Shelf refresh Phase 4: fixes" |
| [List collaborator invites ignore blocks](list-invites-ignore-blocks.md) | 2026-10-14 | Apollon 52d5d08, re-applied to main 2026-10-21 in the access-control sweep (it had stayed on branch `bugfix-small-backend`) |
| [Pending club invites still show a deactivated inviter's name](club-invite-shows-deactivated-inviter.md) | 2026-10-14 | Apollon 52d5d08, re-applied to main 2026-10-21 in the access-control sweep (it had stayed on branch `bugfix-small-backend`) |
| [Deleting a writing isn't one transaction](writing-delete-not-atomic.md) | 2026-10-14 | Apollon 52d5d08, re-applied to main 2026-10-21 in the access-control sweep (it had stayed on branch `bugfix-small-backend`) |
| [A time zone .NET knows but Postgres doesn't would break the Feed](time-zone-name-mismatch-500.md) | 2026-10-14 | Apollon 52d5d08, re-applied to main 2026-10-21 in the access-control sweep (it had stayed on branch `bugfix-small-backend`) |
| [The Readings strip relies only on follows being removed when someone blocks](readings-strip-no-block-safety-net.md) | 2026-10-14 | Apollon 52d5d08, re-applied to main 2026-10-21 in the access-control sweep (it had stayed on branch `bugfix-small-backend`) |
| [A book saved as Read without a finish date shows as "Finished" but isn't counted](read-without-finish-date-not-counted.md) | 2026-10-12 | Apollon f312403 |
| [The header wraps to a third row at 320px wide](header-wraps-at-320px.md) | Won't fix, 2026-10-12 | Below the supported width; fits from 360px |
| [The bell covers the "Community" tab on tablet-width windows](header-tabs-overlap-bell.md) | 2026-10-11 | Apollon 1e90c48 |
| [Imports have no limit over time](import-no-quota-over-time.md) | 2026-10-08 | Apollon e7e1651 |
| [One slow import row stalls everyone's imports](import-worker-sleeps-inline-on-retries.md) | 2026-10-08 | Apollon f4a246e |
| [Import trusts Open Library work keys and cached ISBNs forever](import-isbn-and-work-key-trust.md) | 2026-10-08 | Apollon bdf575f |
| [Import upload shares the login rate-limit bucket](import-upload-shares-login-rate-limit.md) | 2026-10-08 | Apollon 7638dff |
| [List tags can't contain accented letters](list-tags-reject-accents.md) | 2026-10-07 | `CHANGELOG.md`, "List tags accept any language's letters" |
| [The activity part of the Feed reads every followed reader's whole history](activity-feed-query-reads-whole-history.md) | 2026-10-07 | `CHANGELOG.md`, "The Feed's activity rows no longer read whole histories" |
| [Blocks don't apply between commenters](blocks-not-applied-between-commenters.md) | 2026-10-07 | `CHANGELOG.md`, "Blocks now reach comments" |
| [Slow frontend tests time out when the whole suite runs](mood-test-times-out-under-load.md) | 2026-10-07 | `CHANGELOG.md`, "Languages, Phases 2 and 3" |
| [On a phone, a book's subject tags push "Log this book" far down the page](book-page-subjects-bury-log-button-on-phone.md) | 2026-10-06 | `CHANGELOG.md`, "Book page: long subject lists start folded" |
| [Logout keeps the previous user's cached data](logout-keeps-cached-data.md) | 2026-10-06 | `CHANGELOG.md`, "Hardening, phase 2: sessions that renew themselves, clean logout" |
| Integration-test database never cleared, so a discovery test failed every run | 2026-10-05 | `CHANGELOG.md`, "Integration tests start from an empty database" |
