# Avatar picker

## Problem

Users currently have no way to set a profile picture at all. `ApplicationUser.AvatarUrl` exists and flows through to the frontend `Avatar` component, but nothing ever writes it — `UsersController` only reads it back. We want users to be able to choose a profile picture from a fixed set of preset avatar illustrations. No file upload, no custom images.

## Clarifying decisions

- **Preset-only.** Users pick from a fixed gallery of illustrations we ship with the app. No upload, no external URL, no editing/cropping.
- **Source art.** A 5x5 grid of dachshund-reading illustrations, sliced into 24 individual images (all except tile #18, which is dropped per the user's request — 25 tiles minus 1).
- **Entry point.** The picker lives on the user's own profile page (`ProfilePage.tsx`), gated behind the existing `isSelf` check. There's no separate account-settings page yet, so this doesn't create one — it adds a small "change avatar" affordance next to the existing `Avatar` on your own profile.
- **Storage.** `AvatarUrl` keeps being a plain string column. Preset avatars are static frontend assets (e.g. `web/src/assets/avatars/dachshund-01.png` … `dachshund-24.png`), and `AvatarUrl` stores a stable identifier (e.g. `/avatars/dachshund-07.png` or a short key like `dachshund-07`) that the frontend resolves to the asset. Using a small fixed key — not an arbitrary URL — lets the backend validate the value against an allowlist instead of trusting arbitrary input.
- **Validation.** The backend defines the same allowlist of valid avatar keys (24 entries) and rejects anything else with a 400. This is the only way `AvatarUrl` can be written, so it's also the only place that needs validating.

## Explicitly out of scope

- File upload / custom images.
- Cropping, resizing, or any image editing UI.
- An avatar picker during signup/registration (`RegisterPage.tsx`) — can be added later by reusing the same component, not part of this pass.
- A general account-settings page.

## Design

### Backend

- New allowlist of 24 avatar keys, defined once (e.g. `Argos.Domain` or a constants file in `Argos.Api`) so both the validation endpoint and (if ever needed) seed data agree on it.
- `PUT /api/users/me/avatar` (or similar — check existing route conventions in `UsersController`) accepting `{ avatarKey: string }`, validating against the allowlist, and persisting it as `ApplicationUser.AvatarUrl`.
- Requires auth (the acting user can only change their own avatar — no `userId` in the request body, derive from the authenticated principal).
- Returns the updated `UserProfileDto` (already has `AvatarUrl`).

### Frontend

- Slice `avatar-sheet.png` (5x5 grid, provided by the user) into 24 individual images, skipping tile #18, saved under `web/src/assets/avatars/`.
- New `AvatarPicker` component: a modal or inline grid showing all 24 options, highlighting the current selection, calling the new avatar-update API on pick.
- Wire it into `ProfilePage.tsx` next to the `Avatar` when `isSelf` is true (e.g. a small "change avatar" button that opens the picker).
- Add the `updateAvatar` API client function + React Query mutation, invalidate the current user's profile query on success so the header updates immediately.
- `Avatar.tsx` itself needs no changes — it already just renders whatever `avatarUrl` resolves to; the picker is responsible for turning a picked key into the asset path stored server-side.

## Tasks

### Backend

- [x] Define the 24-key avatar allowlist as a shared constant. (`Argos.Domain/AvatarCatalog.cs`, keys `dachshund-01`..`dachshund-24`)
- [x] Add `PUT /api/users/me/avatar` endpoint + DTO, validating against the allowlist, auth-scoped to the caller.
- [x] Return updated `UserProfileDto`.
- [x] Tests: valid key succeeds, invalid key 400s, unauthenticated request 401s, can't set another user's avatar. (`test/Argos.Tests/Integration/UsersControllerTests.cs`)

### Frontend

- [x] Slice the provided 5x5 grid into 24 images (drop tile #18), save under `web/src/assets/avatars/`.
- [x] `AvatarPicker` component (grid of 24 selectable avatars, current selection highlighted).
- [x] `updateAvatar` API client call + React Query mutation + cache invalidation.
- [x] Wire picker into `ProfilePage.tsx` for `isSelf`.
- [x] Tests for `AvatarPicker` (renders all options, picking one calls the mutation).

### Verification & docs

- [x] Manually verify: pick an avatar, confirm it persists after reload. Driven end-to-end with Playwright against the real dev server + API + Postgres: registered a user, opened the picker, confirmed all 24 avatars render, clicked one, confirmed it updated the header immediately and survived a full page reload. No console errors. (Didn't separately check a second user's view of it — the profile query is keyed by username and the avatar renders from the same `avatarUrl` field for any viewer, so this is covered by the same code path.)
- [ ] Update `CHANGELOG.md`.
