# Feature Spec — Invite-only sign-up

**Status:** ✅ Done (2026-10-07). Roadmap Stage 1, last task.

## 1. Problem

The beta must stay closed: anyone who finds the site can sign up today. `Registration:InviteOnly` already exists (built by `specs/landing-page.md` §4), but only the landing page's button reads it; sign-up ignores it. The landing page already tells visitors "You'll need an invite from a reader who's already here", so invites should come from readers.

## 2. Decisions

- **Readers invite readers** (asked 2026-10-07). Each reader can create up to **5 invites** (`Registration:InvitesPerReader`). Each invite works **once**. Deleting an unused one gives the slot back.
- **Shared as a link** (asked 2026-10-07): `/register?invite=ABCD-2345` fills the code in. Typing the code works too.
- **Codes:** 8 characters from an alphabet without look-alikes (no `0 O 1 I L`), shown as `ABCD-2345`. Case, spaces and dashes are ignored when typed. 31⁸ ≈ 850 billion codes, and sign-up is rate-limited (10 a minute per address), so guessing one is hopeless.
- **Only confirmed readers can invite** (`[RequireConfirmedEmail]`), so a throwaway account can't hand out more throwaway accounts.
- **The switch:** `Registration:InviteOnly` (already exists, default `false`). When `true`, sign-up needs a valid unused code. When `false`, sign-up ignores codes and Settings hides the Invites tab. Turn it on for the beta in the production settings; off at public launch.
- **A code is used up only by a successful sign-up.** It's claimed before the account is created and given back if creating the account fails (a weak password, say), so a typo in the password doesn't burn the invite. Two sign-ups racing on one code: only one claim succeeds. *(Review pass: "claimed" and "used" are separate columns. A claim that never finished, because the API stopped midway, counts as free again after 10 minutes. A used invite stays used even if the reader it let in deletes their account; Settings then says "a reader who has since left".)*
- **While invite-only, sign-up checks the invite first**, before anything else, so without a working invite it reveals nothing (whether a username is free, say). *(Review pass.)*
- **Kept:** who invited whom (`InviterId`, `UsedByUserId`). Not shown anywhere yet; useful if a beta invite chain needs cleaning up.
- **The first reader:** create your own account before turning the switch on in production; your 5 invites start the beta.

## 3. Design

**Table `Invites`:** `Id`, `Code` (8 chars, unique), `InviterId` (FK, cascade), `CreatedAt`, `ClaimedAt?`, `UsedAt?`, `UsedByUserId?` (FK, set null).

```
GET    /api/invites          → { inviteOnly, remaining, invites: [{ code, createdAt, usedAt, usedByUsername }] }
POST   /api/invites          → the new invite   (409 when none are left; confirmed email)
DELETE /api/invites/{code}   → 204 (only an unused one of your own)
POST   /api/auth/register    + inviteCode   (required while InviteOnly is on)
```

**Frontend:**
- Register page: when `registration-status` says invite-only, an **Invite code** field, filled from `?invite=`.
- Settings: an **Invites** tab (only while invite-only is on): how many are left, "Create an invite", and each invite with its link and a **Copy link** button, or "Used by @name".

## 4. Out of scope

- A waitlist for people without an invite (`specs/landing-page.md` already ruled it out).
- Emailing an invite from the site (readers send the link themselves).
- Admin tools for giving someone more invites (change `InvitesPerReader`).

## 5. Tasks

#### Backend
- [x] `Invite` entity + `IInviteRepository` + migration `AddInvites`
- [x] `InviteService`: create (code generation, allowance), list, delete unused, claim / release / record use
- [x] `InvitesController` (`api/invites`), confirmed email to create
- [x] Register: `inviteCode`, enforced when `InviteOnly`; claim → create → record, release on failure
- [x] Error codes + translations
- [x] Tests: register refused without / with a bad / with a used code; works with a good one; failed sign-up keeps the code; the limit; delete gives the slot back; can't delete someone else's or a used one; switch off ignores codes; parallel requests can't run past the limit (`InviteTests`)
#### Frontend
- [x] Register: invite field from `?invite=` while invite-only (also shown if the server asks for one, in case the setting couldn't be read)
- [x] Settings → Invites tab (create, copy link, delete unused, used-by)
- [x] Tests for both (`RegisterInvite.test.tsx`, `InviteSettings.test.tsx`)
#### Verification & docs
- [x] Tests, build, lint; browser pass (Settings → create → link → sign-up on a phone-width browser → "Used by @…")
- [x] Bruno requests (`bruno/Invites`); reviewer + security review; CHANGELOG; roadmap box
#### Review pass (2026-10-07)
- [x] Fixed:
  - **Parallel "create invite" requests could run past the limit.** Counting and inserting now happen under a per-reader database lock, and creating invites is rate-limited.
  - **Invites could get stuck** after a crash mid-sign-up or a deleted account. Fixed by the separate claimed/used columns (§2).
  - **Recording or giving back an invite can no longer fail a sign-up** whose account already exists.
  - **Blocks:** the inviter doesn't see the username of an invited reader who blocked them.
- [x] Left as is:
  - Invites can still be created while the switch is off. They're harmless (codes are ignored) and the tab is hidden.
