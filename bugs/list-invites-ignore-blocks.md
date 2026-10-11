# List collaborator invites ignore blocks

**Priority:** P2 · **Size:** S · **Area:** Backend, lists, privacy · **Found:** 2026-10-11 (`argos-security` review of `specs/notifications.md` Phase 1) · **Status:** Open

## What happens

A reader can invite someone to collaborate on a list even when either of them has blocked the other. A pending invite also survives a block made afterwards. Blocking removes follows, follow requests and club invites between the two readers, but not `ListCollaborators` rows. The invitee keeps seeing the inviter's name and the list title in the Lists page's "Pending invites" box until they answer.

(The notification bell already hides these rows through its own block check, so the bell is not the problem. The Lists box is.)

## Why

`ListCollaborationService.InviteAsync` doesn't call `IBlockRepository.ExistsEitherWayAsync`, and `BlockRepository.AddAndRemoveFollowsAsync` doesn't delete pending `ListCollaborators` rows between the pair.

## Suggested fix

- Refuse the invite when `ExistsEitherWayAsync(ownerId, inviteeId)`, with the same "That user doesn't exist." answer so a block can't be probed.
- When a block is saved, delete `Pending` collaborator rows between the two readers on each other's lists (accepted collaborators are a separate decision: they may stay, since they already hold the list's edit rights).
- Tests: invite refused under a block either way; a pending invite disappears when the invitee blocks the owner and when the owner blocks the invitee.
