# Small backend gaps from the launch review

**Priority:** P3 · **Size:** S each · **Area:** Backend · **Found:** 2026-10-21 (Stage 10 whole-backend review)

Real but rare, or a 500 where a 400 belongs, with no data harm. Grouped so they don't each need a file; split one out if it turns out to matter.

## Wrong answer, no harm to data

- ~~**Reordering or removing list items at the same moment** (`BookListService.RemoveItemAsync`, `ReorderItemAsync`): owner and collaborator (or two tabs) at once trip the deferred `(BookListId, Position)` constraint, and the loser gets a 500. Only add has the reload-and-retry. Nothing is corrupted.~~ *Fixed 2026-10-24 → `specs/stronger-lists.md` §5 (it could also leave gaps in the positions; changes now take the list's lock).*
- **Filtered or sorted book search past page 5** (`BookService.SearchWithOptionsAsync`): the pool is 100, pages are 20, but the controller allows 10 pages, so "Show more" ends with an empty page 6.
- **Open Library JSON with one wrong-typed field** (`OpenLibraryWorkResponse`, `OpenLibrarySearchResponse`): a book fetch fails as "not found", and a search loses its whole page of 20. The author responses already use lenient converters.
- **Following and favouriting authors past the cap at the same moment** (`AuthorFollowService`, `FavouriteAuthorService`): check then insert, so concurrent requests can pass 500 follows or 4 favourites.

## Left behind after a delete

- **Notifications about a deleted log or writing** stay in the bell and open a 404, unless the notification query joins the subject.
- **Open reports on a deleted list** stay in the admin queue with no text; only Dismiss works.
- **Likes on a review whose text was cleared** stay, and come back if the reader writes a review again.

## Notifications and email

- **A second follow request inside 24 hours** reuses the first, already-read bell entry (`NotificationRecorder.SendAsync`), so the badge doesn't light up.
- **Followers created when a private account goes public** (`FollowService.ApproveAllPendingAsync`) get no "new follower" notification.
- **The "new login" email has no cooldown** (`NewLoginNotifier`): a browser with blocked storage is a new device every login.
- **Password-reset emails can be held back by someone else:** the reset cooldown is per account and `forgot-password` is anonymous, so five requests an hour for someone's address silently drop their own reset for that hour. Needs a per-address-and-IP cooldown, or a cap that doesn't stop the owner.

## Moderation and admin

- **Hiding content and closing its reports are two saves** (`ModerationService.HideAsync`, `HideRatingsAsync`): a failure between them leaves reports open, and the retry doesn't tell the author.
- ~~**A list invite can go to a suspended or deactivated reader, or to the "Deleted user" placeholder** (`ListCollaborationService.InviteAsync`), using up one of the 10 slots.~~ *Fixed 2026-10-24 → `specs/stronger-lists.md`.*

## Data rules held only in code

- **No database check against following or blocking yourself** (`Follows`, `Blocks`): only the services stop it.
- **A club checkpoint's reveal row is a separate save from its comment** (`CheckpointDiscussionService.CreateCommentAsync`): if it fails, the author sees their own comment blurred.

## News page

- **An item with no readable date** gets "now" on every refresh and always sorts first; a feed that fails once disappears until its next good fetch (`NewsFeedFetcher`, `NewsFeedRefreshService`).
