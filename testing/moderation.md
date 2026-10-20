# Test plan — Moderation and safety

**Covers:** `specs/safety-and-moderation.md`, `bugs/block-detectable-in-shared-club.md` (reports, the admin's queue, hiding, suspension, review-bombing rules, blocks in likes and club discussions, community guidelines) · **Written against:** Apollon commit 9d117ca (plus the uncommitted Stage 7 work) on 2026-10-20
**Before you start:** the app must be running with the `AddReportsAndRatedAt` migration and the Phase 3 migration applied (`dotnet ef database update`), and the API restarted. Create fresh readers with confirmed emails (see the `browser-check` skill for seeding through the API and for making an admin):

- **A**: the reporter. Follows B. A public account.
- **B**: the reported author. Has a public review with a rating (on a book with at least one other rating), a writing, a public list, a comment on C's review, and a profile with a bio and display name.
- **C**: a stranger and bystander. Has a public review that B commented on and A replied to.
- **D**: shares a book club with A. The club (run by A) has a reading round with one checkpoint. A, C and D have each posted a checkpoint comment, D has replied to A's, A has replied to D's, and C has replied to D's. D has liked A's review, A has liked D's public list, and C has liked both.
- **Admin**: an account listed in `Admin:UserIds` (restart the API after adding it). Reports made before it became an admin don't ring its bell.
- **U**: a reader who has **not** confirmed their email.
- Two books in the cache: one with `FirstPublishYear` = next year, one with no year at all (SQL on `Books`, or pick from Open Library).

Nothing here waits on a real inbox except the suspension email (Mailpit at localhost:8025 locally). A bell updates within 60 seconds, or on reload. Check the report dialog, the admin page and the hidden notice against `_shared.md` (phone width, themes, five languages, keyboard).

## Community guidelines

**Start:** logged out.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 1 | Open `/guidelines` | The "Community guidelines" page loads without logging in. It covers kindness, harassment and hate, spoilers, spam, sexual content, impersonation, rating books you haven't read, what happens (hiding, suspension), and "If you think we got it wrong" with hello@wingedwords.app | | | |
| 2 | Look at the site footer | A "Community guidelines" link beside Privacy policy and Terms of use; it opens step 1's page | | | |
| 3 | Open `/terms` | A paragraph links the community guidelines and says content can be hidden and accounts suspended | | | |
| 4 | Open `/privacy` | A paragraph about reports: what's kept, and that a decided report is deleted after a year | | | |
| 5 | Open `/register` | Under the form: "By signing up you agree to the terms of use and the community guidelines", both links working | | | |
| 6 | 👤 person: read the guidelines in all five languages | Each reads naturally and nothing is left in English | | | |

## Reporting

**Start:** logged in as A.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 7 | Open B's review page, open its "⋯" (More actions for this review) | A menu with "Report" | | | |
| 8 | Click Report | A dialog "Report this review": a short intro, "What's wrong?" with seven reasons as radio buttons, each with a one-line hint, an optional note with a character count, a "Read the community guidelines" link, and "Send report". On a phone it's a bottom sheet with the buttons pinned at the bottom | | | |
| 9 | Click Send report without choosing a reason | "Choose what's wrong." and nothing is sent | | | |
| 10 | Choose Harassment, type a note, Send report | "Thanks. We'll look at it." The review is still shown as before | | | |
| 11 | Report the same review again with Spam | The same thanks. (The admin later sees one report from A, with the newer reason) | | | |
| 12 | Press Escape with the dialog open | It closes and focus goes back to the "⋯" button | | | |
| 13 | Drag a text selection out of the note box and let go outside the dialog | The dialog stays open | | | |
| 14 | Report B's writing (open it, "⋯") | Dialog title "Report this writing"; it sends | | | |
| 15 | Report B's comment on C's review | Dialog title "Report this comment"; it sends | | | |
| 16 | Open B's list, its "⋯" menu | "Report" is in the list's existing menu; dialog "Report this list" | | | |
| 17 | Open B's profile, its "⋯" menu | "Report" next to "Block"; dialog "Report B". "Unmarked spoilers" isn't offered for a reader | | | |
| 18 | Open your own review, writing, list, comment and profile | No "Report" anywhere on your own things | | | |
| 19 | Log out and open B's review | No "⋯" Report option for a logged-out visitor | | | |
| 20 | Log in as U (unconfirmed) and choose Report on B's review | Instead of the form: "Confirm your email to send reports" with the address the link went to | | | |
| 21 | As A, open a review in another tab, have its author delete it, then send a report from the first tab | "This can't be reported any more. It may have been deleted." | | | |
| 22 | Send 21 reports in one day as one reader (different items) | The 21st is refused with a "too many reports" message | | | Easier through the API (Bruno `Moderation`) |

## The admin's queue

**Start:** logged in as Admin. Steps 10–17 done.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 23 | Look at the account menu | "Reports" next to Invite requests, with the number of open items as a badge | | | |
| 24 | Open the bell | "N new reports to look at"; clicking it opens `/admin/reports` | | | |
| 25 | Log in as A, B or C and open `/admin/reports` | Not found; no Reports link in their menu | | | |
| 26 | As Admin, open `/admin/reports` | Open / Decided / Suspended pills, "N open". One row per reported item, oldest first: its type (Review, Writing, Comment, List, Reader), "by B", the reported text (a review's stars shown as stars), the reasons with counts, "N reports, the first on <date>" | | | |
| 27 | Unfold the reporters' notes on the review row | A's note shows; A's name doesn't | | | |
| 28 | As B, edit the reported review's text; reload the queue as Admin | The row shows the text as reported plus "Changed since" and "What it says now" | | | |
| 29 | As B, delete the reported writing; reload | Its row still shows the reported text, with "Deleted since" | | | |
| 30 | Click View on the comment row | The review it was on opens in a new tab, at the comment | | | |
| 31 | Dismiss the list row | It asks "Dismiss these reports? It stays up, and nobody is told." Confirm: "Reports dismissed.", the row leaves Open, focus moves to the next row, and it's under Decided as "Dismissed". The list is still up for everyone | | | |
| 32 | 👤 person: use the queue with the keyboard only | Every action reachable; focus never gets lost after a row leaves | | | |

## Hiding content

**Start:** logged in as Admin, the review row still open.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 33 | Click Hide on B's review | "Which guideline it broke" starts on the most-reported reason, an optional "A note for the author", and "Hide it" | | | |
| 34 | Choose "Something else" and leave the note empty, click Hide it | "Write a note for the author." and nothing changes | | | |
| 35 | Choose Harassment, add a note, Hide it | "Hidden. Its author has been told." The row moves to Decided with a "Hidden" pill | | | |
| 36 | As A and as C (and logged out), open the book's page, the review's address, B's profile, the Feed and the Reviews page | The review is gone everywhere; its address answers like a missing review | | | |
| 37 | Look at the book's average and rating spread | B's rating is no longer counted | | | |
| 38 | As B, open the review | A quiet banner: "Hidden by moderators: Harassment. <note>. Only you can see it." with a "Community guidelines" link | | | |
| 39 | As B, look at your own shelves and stats | The book and its rating are still there, unchanged | | | |
| 40 | As B, open the bell | "Moderators hid your review of <title>"; it opens the review | | | |
| 41 | As Admin, hide B's comment on C's review (A replied to it) | On C's review, others see "This comment was hidden by moderators." in its place, with A's reply still below it | | | |
| 42 | As C, try to reply to, vote on or report the placeholder | Nothing offered on the placeholder; A's reply under it still works | | | |
| 43 | As Admin, hide a checkpoint comment that has replies | The same placeholder in the club discussion | | | |
| 44 | Hide a comment with no replies | It's simply left out for others; its author sees it with the banner | | | |
| 45 | As Admin, under Decided, click Unhide on the review | "It's back up." Everyone sees it again, the rating counts again, and B's bell row stops showing | | | |

## Suspension

**Start:** B logged in on a second browser. Admin on `/admin/reports`, an open report about B (report B's profile again as A).

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 46 | On B's Reader row, click Suspend (on a content row it's "Suspend owner"), leave the reason empty, Continue | "Give a reason for the suspension." | | | |
| 47 | Type a reason, Continue | A confirmation that quotes the reason and says they're logged out, hidden and emailed. Back goes back to the reason | | | |
| 48 | Confirm | "B is suspended."; the row's report is decided | | | |
| 49 | In B's browser, click anything that loads data | Within 15 minutes (at once after a refresh) B lands on the login page with "This account is suspended. Write to hello@wingedwords.app if you think this is a mistake." | | | |
| 50 | Log in as B with the right password | Refused with the same message | | | |
| 51 | Log in as B with a wrong password | The usual "wrong username or password", not the suspended message | | | |
| 52 | 👤 person: open Mailpit | B's suspension email in B's language, with the reason, the guidelines link and hello@wingedwords.app for appeals and data requests | | | |
| 53 | As A, open B's profile, B's list, the book page of B's review, and A's Feed | "User not found"; B's review, list, writing, comments and likes are gone everywhere | | | |
| 54 | As Admin, try Suspend on your own row or another admin's | Not offered on the admin's own things; the API refuses another admin | | | |
| 55 | As Admin, open the Suspended pill | B, with the reason and the date, and "Lift suspension" | | | |
| 56 | Lift | It asks; confirm: "B can log in again." B logs in, and everything from step 53 is back. No email is sent | | | |
| 57 | Report C's profile as A; as Admin choose Reset profile on that row | It asks; confirm: C's bio and display name are cleared and the avatar is the default. The username is unchanged | | | |

## Review-bombing rules

**Start:** logged in as U (unconfirmed), then as A.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 58 | As U, open a book page, Log this book, status Read | The stars are locked with "Confirm your email to rate and review." and a resend link; the review box is read-only. Saving the log without a rating works | | | Seen 2026-10-20 |
| 59 | As U, Quick log a book from a shelf as Read | The same locked stars | | | |
| 60 | As A, open next year's book, Log this book, status Read | Locked stars with "You can rate this once it's out."; the review box read-only | | | Seen 2026-10-20, 1280 and 375. `known bug: log-form-overflows-on-phone.md` at 375 |
| 61 | Save it as Want to read | Saved; "On your want-to-read list" shows | | | Seen 2026-10-20 |
| 62 | Open the book with no known year, log it as Read | Stars work as normal | | | |
| 63 | In a club whose current book is next year's, try to rate the round | Refused with "You can rate or review this book once it's out." | | | |
| 64 | Import a Goodreads CSV with a rating on next year's book | The book is imported without the rating, with a note next to it in the import's list | | | |
| 65 | Seed a rating wave: 10 different confirmed readers rate one book 1 star within an hour (SQL on `Logs` with `RatedAt` = now, or the API), then restart the API (the detector runs at start, then hourly) | The queue has one "Rating wave" row for the book, with no reporter, and the admin's bell rings | | | |
| 66 | Click "Review the ratings" | Each rating with its reader, "Rated 1★", the date, "Account made <date>", and "With a review" where there is one | | | Seen 2026-10-20 |
| 67 | Tick three, click "Hide 3 ratings" | "3 ratings hidden."; the book's average changes; the wave row is decided | | | |
| 68 | Restart the API again | No second wave row for the same book within the day | | | |

## Blocks in likes and book clubs

**Start:** A, C and D as described above; nobody blocked yet. Seen in full on 2026-10-20 (desktop and 375).

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 69 | As D, open the club's checkpoint | A's comment and A's reply under D's comment are shown | | | |
| 70 | As D, open A's profile, "⋯" → Block | The confirmation says likes are removed, comments hidden, that in a shared club A won't see D's name or posts, that A isn't notified, and that D can leave the club or report A. Confirm: "You've blocked this reader. They aren't notified…" | | | |
| 71 | As D, reload the checkpoint | A's comment and the replies under it are gone, and A's reply under D's comment is gone. C's comments stay | | | |
| 72 | As A, open the checkpoint | D's comment is gone, and so are the replies under it (also C's). A's own comment stays, and "Discussion (N)" counts only what A sees | | | Seen 2026-10-20 |
| 73 | As C, open the checkpoint | Everyone's comments and replies, as before | | | |
| 74 | As A and D, look at the club's Recent activity | Neither sees what the other did | | | |
| 75 | As A (blocked by D), open the club's page | D is not in the member list, the progress or the member count; D still sees A there | | | Seen 2026-10-20 |
| 76 | As C, open A's review and D's list | D's like on A's review and A's like on D's list are gone; C's likes are still counted | | | |
| 77 | As D, try to like A's review again (or A D's list) | It doesn't work: the like is refused | | | |
| 78 | As A (the club's admin), try to delete D's checkpoint comment through the API | Not found | | | |
| 79 | As D, unblock A | Each sees the other's checkpoint comments again; the deleted likes don't come back | | | |
| 80 | Log out and open the checkpoint or A's review | Logged-out visitors aren't affected by blocks | | | `known bug: blocks-only-apply-signed-in.md` |
| 81 | As A (the club's admin), add a discussion question; open it as C, then as A | C sees "From the club" with no profile link and no Report, and the club's recent activity says "A discussion question was added in…". A sees their own name in both | | | Seen 2026-10-20 |
| 82 | Look at the club's suggestions | No "suggested by" on any of them | | | |

## Questions

- *Decided 2026-10-20:* the "Discussion (6)" count and the block confirmation's wording are now part of `bugs/block-detectable-in-shared-club.md` (counts per viewer, the blocker left out of the blocked reader's member list, an honest block confirmation).
- **The "not out yet" line shows only in the book page's log form**, where the year is known. Quick log and club round ratings rely on the API's error message instead (spec Phase 4 note). Is that enough?
- **The spec planned a new error code `logs.confirmEmailToRate`**; as built, rating while unconfirmed answers the existing `email_not_confirmed` (spec §3.2 note). The steps follow the code.
