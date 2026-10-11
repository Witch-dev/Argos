# Test plan — Private accounts and follow requests

**Covers:** `specs/account-privacy.md` · **Written against:** Apollon commit ac4d9b1 on 2026-10-11
**Before you start:** the app must be running with the `AddPrivateAccounts` migration applied (`dotnet ef database update`). Create four fresh readers (see the `browser-check` skill for seeding through the API):

- **A**: the owner. Has a bio, a public reading (Currently reading), a followers-only reading, a private reading, a public list with one book, and one writing.
- **B**: follows A before A goes private (an approved follower).
- **C**: a stranger. Follows nobody, follows no one.
- **D**: blocked by A.

Steps that say "private" mean A's account switch is on unless stated. Check the pages in `_shared.md` (phone width, themes, five languages, keyboard) on the profile, Settings → Privacy & data and the Follow button.

## The switch

**Start:** logged in as A, account public.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 1 | Open Settings → Privacy & data | A "Private account" checkbox is first, unchecked, with a short explanation under it | | | |
| 2 | Tick "Private account" | It saves ("Saved"), no confirmation asked, and the box stays ticked after a reload | | | |
| 3 | Open Settings → Privacy & data again | A "Follow requests" section appears, saying "No one is waiting." | | | |
| 4 | Read the "Followers" note under the review privacy setting | It says only people you approve can follow you while the account is private; it no longer says "Anyone can follow you right now" | | | |
| 5 | Untick "Private account" with no requests waiting | It goes public straight away, with no confirmation, and the Follow requests section disappears | | | |

## What a stranger sees

**Start:** A is private. Logged in as C.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 6 | Open A's profile | Name, @username and avatar, the heading "This account is private", the line "Follow … to ask for access…" and a Follow button | | | |
| 7 | Look for A's bio, follower counts, books read, goal, favourites, tabs and lists | None are shown | | | |
| 8 | Search A's name in Find readers | A appears as a card with name and avatar; no currently-reading book, no taste match | | | |
| 9 | Open Popular this week and New readers | A is not in either | | | |
| 10 | Open A's public writing by its direct link | "Not found" page, not the writing | | | |
| 11 | Open A's public list by its direct link | "Not found" | | | |
| 12 | Open `/u/<A>/compare` | "Not found" or the locked profile, never A's ratings | | | |
| 13 | Log out and open A's profile | Same locked page, but the text says to log in to follow, and there is no Follow button | | | |
| 14 | Logged out, open A's writing and list by link | "Not found" for both | | | |
| 15 | Browse lists and Writings → Recent as C | A's list and writing are not among them | | | |

## Asking to follow

**Start:** A is private. Logged in as C.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 16 | On A's profile click Follow | The button changes to "Requested" and stays so after a reload; the page says the request is waiting | | | |
| 17 | Find A in search and look at the card's button | It also says "Requested" | | | |
| 18 | Click "Requested" | The request is taken back: the button returns to "Follow" | | | |
| 19 | Click Follow again | "Requested" again | | | |
| 20 | Log in as A, open Settings | The Settings link and the "Privacy & data" tab show a badge with 1 | | | |
| 21 | Open Settings → Privacy & data | C is listed under Follow requests with Approve and Decline | | | |
| 22 | Click C's name | Opens C's profile | | | |

## Approving, declining, removing

**Start:** C has asked to follow A (logged in as A for steps 23–30).

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 23 | Click Approve on C | C leaves the list; the badge disappears; A's follower count goes up by one | | | |
| 24 | Log in as C and open A's profile | The full profile: bio, counts, tabs; the button says "Following" | | | |
| 25 | As C, see A's public reading, followers-only reading and public writing | All visible; the private reading is not | | | |
| 26 | As A, open the followers list on your own profile | Each follower has a Remove button | | | |
| 27 | Click Remove next to C | C leaves the list | | | |
| 28 | As C, reload A's profile | Locked again; the button says "Follow" | | | |
| 29 | As C click Follow, then as A click Decline | The request leaves A's list | | | |
| 30 | As C reload A's profile | The button still says "Requested" (declining is silent) | | | |
| 31 | As C click "Requested" | Nothing visibly breaks; it may stay "Requested" | | | |
| 32 | As A, make sure no new request from C appears in the list | The list is empty | | | |

## Existing followers

**Start:** A public, B follows A, C is a stranger.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 33 | As A turn the account private | No prompt; saved | | | |
| 34 | As B open A's profile | Still the full profile, button "Following", no request needed | | | |
| 35 | As B open the Feed and Readings strip | A's updates are still there | | | |
| 36 | As C open A's profile | Locked | | | |
| 37 | As B see A's followers-only reading | Visible | | | |

## Going public with requests waiting

**Start:** A private, C has asked, so one request waits.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 38 | As A untick "Private account" | A confirmation asks about letting 1 waiting reader in for good | | | |
| 39 | Cancel the confirmation | The box stays ticked; nothing changed | | | |
| 40 | Untick again and confirm | The account goes public | | | |
| 41 | As C open A's profile | The full profile, button "Following" | | | |
| 42 | As A turn private again | C is still a follower (use Remove to take them off) | | | |

## Per-book privacy together with the account

**Start:** A private, B approved, C stranger.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 43 | As A mark one book "Everyone" (public) | Still hidden from C | | | |
| 44 | As B open that book on A's shelf | Visible | | | |
| 45 | As A mark another book "Only me" | Hidden from B and C | | | |
| 46 | As A, open your own profile and shelves | You see all three books | | | |

## Blocks

**Start:** A private. D has asked to follow A.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 47 | As A block D from D's profile | D's request disappears from A's list | | | |
| 48 | As D open A's profile | "Not found" | | | |
| 49 | As A unblock D | D can ask again, a fresh request reaches A's list | | | |

## Other places

**Start:** A private, B approved, C stranger.

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 50 | As C open B's followers list | A is listed with name and avatar, no bio | | | |
| 51 | As A add a bio, then repeat step 50 | Still no bio for C | | | |
| 52 | As C open a book A has logged publicly | A is not in the book's readers | | | |
| 53 | As C open a public list that A collaborates on | The list shows, and A appears only as a name and avatar | | | |
| 54 | As A, download your data from Settings | The zip works as before | | | |
| 55 | As A, open your own follow requests with the account public | No Follow requests section | | | |

## Translations and phone

| # | Steps | Expected | 📱 Phone | 🖥️ Desktop | Notes |
|---|---|---|---|---|---|
| 56 | Repeat steps 6, 16, 21 and 38 in each of the five languages | No raw keys, no English left over, the plural line reads correctly for 1 and for 2 waiting readers | | | |
| 57 | Repeat steps 6, 16 and 21 in the dark theme and one more theme | Button, badge and locked note are readable | | | |
| 58 | 👤 person: on a real phone, do steps 16, 21, 23 | Approve and Decline are easy to tap, the badge isn't cut off | | | |

## Questions

- **Step 31:** declining is silent, so after a decline C keeps seeing "Requested" for a day. Is that what you want to see, or should C get the button back at once? (The spec says silent; the choice is whether "Requested" for a day is acceptable.)
- **Step 26 and 27:** Remove has no confirmation. Add one?
- **Step 52:** book "readers" lists show A only if the viewer may see A's reading; confirm that is the behaviour you expect for a followers-level book.
- **Bug files that touch this area:** `club-progress-ignores-reading-visibility.md` (clubs still show a private reader's progress) and `blocks-not-applied-in-club-discussions.md`. Neither is part of this plan.

## Run log

**2026-10-11, Playwright against the current code (side ports), desktop 1280 px, English, Paper theme; phone 375 px in Paper and Dark for the locked profile only.** Four fresh readers (`bc_priv_*`, left in the dev database).

| Result | Steps |
|---|---|
| ✅ passed | 6, 7, 8, 10, 11, 16, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 34, 38, 39, 40, 41 |
| ✅ passed (partly) | 57: no sideways scroll at 375 px in Paper and Dark on the locked profile; badge, buttons and locked note read well in both |
| not run | 1–5 (switch alone), 9, 12–15, 17, 22, 31–33, 35–37, 42–56, 58 (phone by hand), and every step in es, pt-BR, de, fr, and the other three themes |

Nothing failed. The screenshots looked right: locked profile (name, avatar, note, Follow), approved profile (bio, counts, the followers-only and public books, the private one absent), Settings with the badge on the link and the tab, and the request list with Approve and Decline.

Steps 6–11, 16–19 and 20–30 are automated in `testing/` only as this manual plan; the backend rules behind them are also covered by `AccountPrivacyTests` and the rule table.
