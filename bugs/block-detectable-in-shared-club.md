# A blocked reader can tell who blocked them in a shared book club

**Priority:** P1 · **Size:** L · **Area:** Backend + frontend, clubs, blocks, privacy · **Found:** 2026-10-20 (browser check of `specs/safety-and-moderation.md`, Verification) · **Status:** Fixed 2026-10-20

## What happens

Ana, Ben and Cy are in a book club. Ana blocks Ben. Since Stage 7 Phase 1, each of them stops seeing the other's checkpoint comments and the replies under them. But Ben can still work out that Ana blocked him:

- **The discussion count gives it away.** In the 2026-10-20 check, the checkpoint showed "Discussion (6)" above two visible comments. In a club of three or four people, "four comments I can't see" points straight at one member. Reply counts and vote scores under hidden threads have the same problem.
- **The member list and reading progress still show Ana to Ben.** As far as the code shows, `ClubDetailDto.Members` (`ClubMembershipDto`, with progress) doesn't check blocks. Only `ClubInviteService`, `CheckpointDiscussionService` and `ClubActivityRepository` do. So Ben still sees that Ana is in the club, how far she has read and, from that, when she is active.

## Why it matters

The person who blocks is often the one being harassed, and the riskiest case is a stalker or an abusive ex. Safety guidance says a visible block can provoke retaliation: the National Domestic Violence Hotline warns that blocking a stalker "could cause them to retaliate further". Instagram built "Restrict" because victims wouldn't block people they know in person for fear they'd notice. A study of abusive partners (CHI 2018, "A Stalker's Paradise") found that blocked abusers gather information through shared spaces, which is what a club is. When X let blocked accounts see public posts in 2024, tech-abuse researchers called it "a huge step backwards for survivor safety".

Sources: [Hotline, stalking safety planning](https://www.thehotline.org/resources/stalking-safety-planning/) · [Instagram Restrict (Engadget)](https://www.engadget.com/2019/10/02/instagram-restrict-anti-bullying-tool-launch/) · ["A Stalker's Paradise", CHI 2018](https://dl.acm.org/doi/pdf/10.1145/3173574.3174241) · [X's block change (East Idaho News)](https://www.eastidahonews.com/?p=707626)

## Decided (2026-10-20, with the user)

The block should be undetectable for the blocked reader. No "N hidden comments" note on either side.

1. **Counts match what each viewer sees.** The checkpoint's comment count, reply counts and anything else counted under a hidden thread leave out the comments that viewer can't see, for both readers. Also check the comment counts on reviews, lists, writings and the Feed (`ReviewDtoMapper`, `BookListDtoMapper`, `WritingsController`, `FeedController`), which may count comments from blocked readers the same way. Not checked yet.
2. **Everything else stays quiet**, as now: no notification of a block, and refused actions answer like a missing item (likes already answer 404).
3. **One-way in the club: the blocker disappears from the blocked reader's view.** Ben's view of the club leaves Ana out of the member list, the reading progress and the member count ("4 members" must not sit above three names). Ana still sees Ben, so she can decide whether to stay, leave or report him. Comments stay hidden both ways, as they are.
   - **If the blocker is the club's admin or a moderator**, the club still has to work for the blocked reader. Show the role without the name (e.g. "the club's admin"). The exact wording and where else the admin's name shows (round and checkpoint creators, the club's header) still need a decision when building.
4. **The block confirmation tells the blocker the truth about shared clubs.** Today it says only "You'll stop following each other and won't see each other in Find readers." Add that their club comments are hidden from each other and their likes removed, and that in a shared club they stay members. It should suggest leaving the club, or reporting the person if it's harassment. All five languages.

## Notes for the fix

- The checkpoint count comes from `ReadingCheckpointDto` (`counts?.Comments`), today per checkpoint and the same for everyone. It needs the viewer's block list, like `CheckpointDiscussionService`'s thread filter.
- Tests in both directions (A blocks B, B blocks A) for each count, and for the member list and progress: hidden only in the blocked reader's view, kept for the blocker and a bystander.
- Update `specs/safety-and-moderation.md` §3.1, `testing/moderation.md` (steps 72 and 75: drop the `known bug` notes once fixed), and `SPEC.md` §7's Blocks line if the rule changes.

## Built (2026-10-20)

- **Counts per viewer.** `BlockedThreads` (Argos.Domain) is the one rule the comment trees and the counts share. The comment counts on reviews, writings, lists, reading updates and the Feed (`CommentRepository`), and a checkpoint's comment, highlight and question counts (`CheckpointCommentRepository`), leave out the threads a block hides from the viewer. For a viewer with no blocks this costs one small query. Comment scores leave out votes from a reader in a block with the viewer, in the trees and in the vote's answer.
- **One-way in the club** (`ClubService`), for a reader who blocked the viewer:
  - left out of the member list, the reading progress, and the pending requests and invites;
  - left out of the member counts (club page, "My clubs", the directory), the round's ratings (average and count) and the suggestions' vote counts.
- **No names on questions and suggestions, for everyone** (decided 2026-10-20, so a nameless one says nothing). A discussion question shows as "From the club" (`AuthorHidden`, no id or avatar, no Report) to everyone but its asker, and so does "asked a discussion question" in the club's recent activity, which now stays for every member. The club page no longer says who suggested a book; `SuggestedByUserId` and `SuggestedByUsername` are filled only for the suggester.
  - `ClubDetailDto.CreatorId` was removed: nothing used it, and it named the creator.
  - Changing the role of the blocker or removing them by id answers 404, the same as a non-member, so a blocked admin or moderator can neither test whether the blocker is there nor remove them.
- **If the blocker is the club's admin**, they are simply left out like anyone else. A nameless "the club's admin" row next to the visible members would itself show that someone is hidden.
- **The block confirmation** and the "You've blocked this reader" line say what a block does in a shared club, that the other reader isn't notified, and that the blocker can leave the club or report them. All five languages.
- Tests: `BlockStaysQuietTests` (12), 9 of the first 10 checked to fail with the fix switched off; Vitest for "From the club", the nameless activity row and the missing "suggested by". Browser check (2026-10-20): the blocked reader saw 2 members and "Discussion (2)"; the blocker 3 and 3; the bystander 3 and 6. A question by the admin showed "From the club" to a member and the admin's own name to the admin, in the discussion and in the recent activity.
- Reviewed by `reviewer` and `argos-security`; their club findings (creator id, round ratings, suggestion votes, role/remove by id, a count that could fail if a comment arrived between two queries) are fixed above.

## Left as is

- **Pending requests can get stuck**: if the blocker asks to join a private club whose only admin or moderator is the blocked reader, nobody sees the request. The blocker can withdraw it.
- **The directory's member count differs between signed in and signed out** (accepted 2026-10-20). Blocks don't apply to signed-out visitors at all (`blocks-only-apply-signed-in.md`), and a second account shows the same thing.
- **A club with no admin in its member list** only happens when the admin blocked you, and the blocker's activity is missing from the recent activity. A second account in the club sees everything anyway, so a block inside a shared club can never be fully invisible; the fix removes the signals a reader sees without looking for them.
