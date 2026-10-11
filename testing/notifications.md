# Test plan — Notifications (the bell)

**Covers:** `specs/notifications.md` · **Written against:** Apollon commit ac4d9b1 (plus the uncommitted Stage 5 work) on 2026-10-11
**Before you start:** the app must be running with the `AddNotifications` migration applied (`dotnet ef database update`) and the API restarted. Create four fresh readers with confirmed emails (see the `browser-check` skill for seeding through the API):

- **A**: the one whose bell is checked. Has a public review of a book (rating and text), no followers, a public account.
- **B**: follows A. Owns a club and a public list (so B can invite A to both).
- **C**: a stranger who does not follow A.
- **D**: blocked by A, and blocked from nothing else.

Nobody waits for emails: nothing in this feature sends one. A single bell updates after up to 60 seconds, so after an action in another window either wait or reload. Check the bell, the `/notifications` page and Settings → Notifications against `_shared.md` (phone width, themes, five languages, keyboard).

## The bell, empty

**Start:** logged in as A, nothing has happened yet.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 1 | Look at the header | A bell button with no number badge. Its accessible name is "Notifications" | | | |
| 2 | Open the bell | A panel with the title "Notifications" and a calm line "You're all caught up." and no "Mark all as read" | | | |
| 3 | Open Settings → Notifications | Five switches: Follows, Comments and replies, Likes (off by default), Invites, Checkpoint reminders. All on except Likes, each with one line saying what it covers | | | |

## Follows

**Start:** A public, bell empty. Logged in as B in a second window or profile.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 4 | As B, follow A | A's bell shows a badge "1" within a minute (or on reload); its name reads "Notifications, 1 unread" | | | |
| 5 | As A, open the bell | One unread row: "B started following you", B's avatar, "Just now", an unread dot, and a × | | | |
| 6 | Click the row | The panel closes and B's profile opens; the badge is gone | | | |
| 7 | As B, unfollow A, then follow again straight away | A has no second "started following you" row (within 24 hours it is not announced again) | | | |

## Private account: requests and approval

**Start:** A turns on Settings → Privacy & data → Private account. Logged in as C.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 8 | As C, press Follow on A's profile | The button changes to "Requested" | | | |
| 9 | As A, open the bell | A row "C asked to follow you" with **Approve** and **Decline** buttons inline, and a badge on the bell | | | |
| 10 | Click Approve | The row disappears from the panel and the badge drops by one; Settings → Privacy & data shows no waiting request | | | |
| 11 | As C, open the bell | "A approved your request to follow them" | | | |
| 12 | As A, open the bell again | There is no "C started following you" row: an approval is not announced as a new follower | | | |
| 13 | As D (a second stranger) ask to follow A, then as A click Decline in the bell | The row disappears; D's profile button goes back to "Follow" | | | |
| 14 | As D ask to follow A again, then withdraw the request ("Requested" → cancel) before A answers | The row for D disappears from A's bell and the badge drops, without A doing anything | | | |

## Likes: off by default, then on

**Start:** A public, has one review. Settings → Notifications → Likes is off. Logged in as B and C.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 15 | As B, like A's review | A's bell gets nothing: no badge, no row | | | |
| 16 | As A, tick Likes in Settings → Notifications | It saves and the box stays ticked after a reload | | | |
| 17 | As B, unlike then like the review again | A's bell shows "B liked your review of <book>" with one unread dot | | | |
| 18 | As C, like the same review | The same single row becomes "C and 1 other liked your review of <book>" and is unread again if it was read | | | |
| 19 | As C, unlike | The row goes back to "B liked your review of <book>" | | | |
| 20 | As B, unlike too | The row disappears | | | |
| 21 | As A, like your own review | No row for yourself | | | |
| 22 | As A, untick Likes, then as C like the review | No row. Tick Likes again: the like made while it was off does not appear afterwards | | | |

## Comments and replies

**Start:** A has a public review. Logged in as C, then A, then B.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 23 | As C, post a comment on A's review | A's bell: "C commented on your review of <book>" | | | |
| 24 | As A, read the row | It never shows any of the comment's words, only the sentence | | | |
| 25 | As A, reply to C's comment | A has no row for it (your own reply). C's bell: "A replied to your comment on the review of <book>" | | | |
| 26 | As B, reply to C's comment | C gets a second reply row from B. A gets nothing, since A is not the comment's author | | | |
| 27 | As C, delete the comment | The "C commented" row disappears from A's bell and the badge drops | | | |
| 28 | As A, turn off "Comments and replies", then as C comment again | No row. Turn it back on: the comment made while it was off does not appear | | | |

## Invites

**Start:** logged in as B, who owns a club and a public list. A has no invites.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 29 | As B, invite A to the club | A's bell: "B invited you to join <club>" | | | |
| 30 | As B, invite A to collaborate on the list | A's bell: "B invited you to collaborate on <list>" | | | |
| 31 | As A, click the club invite row | The row is marked read and the club's page opens with the "You're invited" strip | | | |
| 32 | As A, accept the club invite on that page | The club invite row leaves the bell (the invite is answered) | | | |
| 33 | As A, decline the list invite in Lists → Pending invites | The list invite row leaves the bell and the badge drops | | | |
| 34 | As A, turn off Invites, then have B invite A to another list | No row, but the invite still shows in Lists → Pending invites. The existing stand-ins keep working | | | |

## Blocks

**Start:** A has unread rows from B (a follow, a club invite, a comment). Logged in as A.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 35 | A blocks B (B's profile → Block) | Every row from B leaves the bell and the badge drops to the rows from other readers | | | |
| 36 | As B, try to comment on A's review or follow A | Both fail (B can't see A); A's bell does not change | | | |
| 37 | As A, unblock B | Rows for things that still hold (a pending list invite, a comment that still exists) come back. The follow and the club invite do not: blocking ended them | | | |
| 38 | As D (blocked by A), like or comment on A's public review | D can't reach it, and A's bell does not change | | | |

## Reading the list

**Start:** A has at least 12 rows, some read, some unread.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 39 | Open the bell on desktop | The latest rows, newest first, with "See all" at the bottom | | | |
| 40 | On a phone, tap the bell | It goes to the full `/notifications` page (no panel) | | | |
| 41 | Click "See all" (desktop) | The `/notifications` page; "Show more" loads older rows without repeating any | | | |
| 42 | Click "Mark all as read" | Every unread dot disappears and the badge goes away | | | |
| 43 | Click × on one row | That row disappears and the badge drops if it was unread. Nothing else changes | | | |
| 44 | Reload the page | The read state and dismissals persist | | | |
| 45 | Have more than nine unread | The badge shows "9+" | | | |
| 46 | Click "Choose what you are told about" | Settings → Notifications opens | | | |
| 47 | Leave the tab and come back after a minute | The count refreshes by itself when the tab is visible again | | | |

## Header at 360 px

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 48 | Open the site at 360 px width, logged in as A with one unread | Menu button, logo, bell and search all fit on one line; no sideways scrolling | | | |
| 49 | Look at the badge | The "1" is fully visible and does not hide the bell | | | |
| 50 | Open `/notifications` at 360 px, in the dark and sepia themes | Rows wrap, the × and unread dot stay inside, text keeps contrast | | | |

## Accounts

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 51 | Log out | The bell disappears; `/notifications` sends you to log in and comes back to the page afterwards | | | |
| 52 | Delete A's account (Settings → Privacy & data, then confirm) | The rows A sent (to B and C) are gone from their bells | | | |
| 53 | 👤 person: wait for a club checkpoint due within 48 hours (or set one) with a member who is behind | Within the hour that member gets "A checkpoint in <club> is due soon", with no × (it is only marked read) | | | |

## Questions

- **Known gap, not a failure:** liking, unliking and liking again re-rings the bell (`specs/notifications.md` §2). Likes are off by default and the owner can block.
- **`bugs/list-invites-ignore-blocks.md`:** a list invite can still be sent across a block and shows in Lists → Pending invites. The bell hides it while the block lasts (step 37); the Lists box does not.
- **Step 7 and step 53** depend on the 24-hour re-follow window and the hourly job. They were covered by the automated tests, not by the browser pass.
- **Spec vs build:** the spec says the bell sits in the header "and the phone nav". It is in the header only, which holds on a phone at 360 px (steps 48–50).
- **Aria label at the cap:** the bell says "100 unread" when the server's cap of 100 is reached, though there may be more.
