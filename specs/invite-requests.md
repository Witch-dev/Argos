# Feature Spec — Request an invite

**Status:** 📝 Specced 2026-10-19. Roadmap Stage 4 (before the closed beta starts).

## 1. Problem

While sign-up is invite-only, a visitor who reaches the landing page without knowing a reader has nowhere to go. The page says "You'll need an invite from a reader who's already here" and stops. People who hear about Winged Words from a post or a friend of a friend are lost. They are exactly the beta testers we want.

What we want: a **Request an invite** button on the landing page. It leads to a short form (email and an optional note). The site owner sees the requests on an admin page, and with one click the app emails that person an invite link.

**This changes two earlier decisions.** `specs/landing-page.md` ("Out of scope": "a waitlist or email collection") and `specs/invite-only-signup.md` §4 ("A waitlist for people without an invite") both ruled this out. The user asked for it on 2026-10-19, so this spec replaces those two lines. Leave both specs as they are, as history.

## 2. Decisions (asked 2026-10-19)

- **The owner decides who gets in, on an admin page.** Requests are not invited automatically. This needs a minimal **admin role** now. Stage 7's moderation tools will use the same role (§3.1).
- **Approving emails the person an invite link** (`/register?invite=ABCD-2345`). It is a one-use code like the readers' codes, but it belongs to no reader, so it doesn't use up anyone's 5 (§3.2).
- **The form asks for an email and an optional note**: "What do you like to read, or how did you hear about us?", up to 500 characters. It uses the same bot check as sign-up.
- **No email when someone submits a request.** The page says "Thanks! We'll email you when a spot opens." This way nobody can use the form to send mail to a stranger's address, and the form has no effect on the email budget (`bugs/email-sending-has-no-overall-budget.md`).

Smaller decisions made while writing the spec (not asked; change them if you disagree):

- **Every submission gets the same thank-you.** This holds for a new request, a repeat of one already waiting, and an address that already has an account. So the form can't be used to find out who has an account. A repeat while one is pending replaces the note and keeps the original date, so the person keeps their place in line.
- **The form exists only while invite-only is on.** When the switch is off at public launch, the button disappears and the endpoint answers 404. Anyone can sign up then anyway.
- **Requests are kept for 90 days.** Any request decided more than 90 days ago (invited or dismissed) is deleted by the existing nightly clean-up, or by a new small one. Pending requests stay until they are decided. The privacy policy says so (§3.6).
- **The email goes out in the language the visitor was using** when they asked. It is saved with the request, because there's no account to read it from.
- **A cap of 5,000 pending requests** (`InviteRequests:MaxPending`). Past it, new requests still get the thank-you but aren't saved, and a warning is logged. This keeps a bot that gets past Turnstile from filling the table.

## 3. Design

### 3.1 Admin role (minimal)

- An Identity role called **`Admin`**. Identity's role tables already exist and are unused.
- **Who is admin comes from config:** `Admin:Usernames` (a list). On startup the API makes the role match the list. Everyone listed gets it, and anyone not listed loses it. On Render this is `Admin__Usernames__0=<your username>`. No admin screens for managing admins.
- **Checked on every request, from the database.** It isn't put in the login token, so removing someone from the list takes effect when the API restarts, not when their token expires. An `[RequireAdmin]` filter (like `[RequireConfirmedEmail]`) answers 404 to non-admins, so the admin endpoints look like they don't exist. Admins must also have a confirmed email.
- `GET /api/users/me` (or whatever endpoint feeds the current-user context) gains `isAdmin`, so the frontend can show the link.

Stage 7's "A site admin role" box is then partly done. Update its wording to say so.

### 3.2 Invites that belong to no reader

`Invite.InviterId` becomes **nullable**. A null inviter means "from the Winged Words team". Readers' invite counts, lists and deletes all filter by `InviterId`, so they don't see these. Migration `AllowTeamInvites`. Claim, release and use work exactly as today, with no change to sign-up.

### 3.3 Table `InviteRequests`

| Column | Notes |
|---|---|
| `Id` | Guid |
| `Email` | normalised (trimmed, lower case), max 256, **unique among pending requests** (partial index on `Status = Pending`) |
| `Note` | nullable, max 500, plain text |
| `Language` | one of the five site languages, default `en` |
| `Status` | `Pending` / `Invited` / `Dismissed` |
| `CreatedAt`, `DecidedAt?` | |
| `InviteId?` | FK to `Invites`, set null on delete; filled when invited |

### 3.4 Endpoints

```
POST /api/invite-requests            anonymous · { email, note?, language, botToken }
                                     → 202 always (same body whether new, repeat or existing reader)
                                     → 400 bad email / note too long · 400 bot check failed
                                     → 404 while invite-only is off
                                     rate limit: the Auth policy (per address, per minute)

GET  /api/admin/invite-requests?status=pending&page=1
                                     → { items: [{ id, email, note, createdAt, status, decidedAt,
                                                   alreadyReader, inviteCode?, inviteUsedAt? }], total }
POST /api/admin/invite-requests/{id}/invite   → 200 { inviteCode }  (makes a team invite, queues the email)
                                     → 409 if not pending
POST /api/admin/invite-requests/{id}/dismiss  → 204   (409 if not pending)
```

- `alreadyReader`: an account already uses that email. It's shown only to the admin, so you don't invite someone twice.
- Inviting runs in one transaction: make the invite, mark the request `Invited`, and queue the email through `EmailQueue`. Two clicks at once must not create two invites. Use the conditional `UPDATE … WHERE Status = Pending`, the same pattern as invite claims.
- New error codes in `ErrorCodes.cs` with `errors.codes` translations: `InviteRequestNotPending`, plus the form's validation messages if they aren't covered by existing codes.

### 3.5 The invite email

A new method, `AccountEmails.InviteFromRequest(email, language, code)`, built with the same `Build` helper as the other emails. Subject: "Your invite to Winged Words". One short paragraph, then the button **"Create your account"** linking to `{FrontendBaseUrl}/register?invite=ABCD-2345`, then the code written out for typing by hand. It has no greeting by name (there's no account), and the note is not repeated back. Texts in all five languages.

### 3.6 Frontend

- **Landing page:** while invite-only is on, the opening and closing sections show **"Request an invite"** as a second button next to "Have an invite? Join". It's quieter than Join (DESIGN.md: one green action per view). The private-beta line becomes: "Winged Words is in private beta. Have an invite from a reader? Join. Otherwise, ask for one." Final wording to be decided at build time, in all five languages.
- **`/request-invite` page:** a logged-out page in the same look as `/register` (`AuthForm` styles). It has the email field, the optional note with a character count, the bot-check widget and **Send request**. After sending, the same card shows the thank-you message with a link back to the landing page. A logged-in reader who opens it is sent to Settings → Invites. While invite-only is off, it redirects to `/register`.
- **Register page:** while invite-only is on, under the invite field: "No invite? Request one" links to `/request-invite`.
- **Admin page `/admin/invite-requests`:** reached from a link in the account menu that only admins see. It has Pending / Invited / Dismissed pills and one row per request: email, the date, the note (folded if long), and an "Already has an account" tag. Pending rows have **Invite** (green) and **Dismiss** (asks first). Invited rows show the code with **Copy link**, and "Joined" once the code is used. It's built with the shared pieces (raised card, hairline rows, segmented control) and works at phone width. Non-admins get the normal not-found page.
- **Privacy policy:** a new short section in all five languages: "If you ask for an invite, we keep your email and note to decide and to send the invite. We delete them 90 days after we decide, and you can ask us to delete them sooner at hello@wingedwords.app."

## 4. Out of scope

- An email confirming the request (decided in §2).
- Telling a dismissed person they weren't picked.
- Inviting several requests in one click, or inviting automatically.
- Managing admins from the app (it's config only), and any other admin tools (Stage 7).
- Showing the requester their place in line.

## 5. Tasks

### Phase 1 — Backend

- [ ] `AdminOptions` (`Admin:Usernames`), startup sync of the `Admin` role, `[RequireAdmin]` filter (404, confirmed email), `isAdmin` on the current-user DTO
- [ ] `Invite.InviterId` nullable + migration `AllowTeamInvites`; check that readers' invite queries still filter by inviter
- [ ] `InviteRequest` entity, `IInviteRequestRepository`, migration `AddInviteRequests` (partial unique index on pending email)
- [ ] `InviteRequestService`: submit (normalise, same answer for every case, repeat replaces the note, pending cap), list, invite (one transaction, conditional update, queue email), dismiss, 90-day clean-up
- [ ] `InviteRequestsController` (anonymous submit, Auth rate limit, bot check, 404 while open sign-up) and `AdminInviteRequestsController`
- [ ] `AccountEmails.InviteFromRequest` in five languages
- [ ] Error codes + `errors.codes` translations
- [ ] Tests (`InviteRequestTests`, `AdminRoleTests`):
  - submit works, a repeat keeps the date and replaces the note, an existing reader's email gets the same answer and no row
  - 404 while open, bot check enforced, note too long refused, pending cap
  - non-admin and logged-out get 404 on the admin endpoints, an unconfirmed admin is refused
  - invite makes a team invite, queues one email in the saved language, and the code signs someone up
  - two parallel invites on one request make one invite; invite or dismiss on a decided request → 409
  - team invites don't count against or appear for any reader; the role sync adds and removes
  - the clean-up deletes only requests decided over 90 days ago
- [ ] Bruno requests (`bruno/InviteRequests`)
- [ ] Review: `reviewer` + `argos-security` (anonymous input, email sending, a new role)

### Phase 2 — Frontend

- [ ] Read `PRODUCT.md`, `DESIGN.md`; a short plan per the `web-design` skill
- [ ] API client + hooks: `requestInvite`, `useAdminInviteRequests`, `inviteRequest`, `dismissRequest`; `isAdmin` in the auth context
- [ ] `/request-invite` page (form, bot check, thank-you, redirects)
- [ ] Landing page second button + new beta line; register page "No invite? Request one"
- [ ] `/admin/invite-requests` page and the admin-only menu link
- [ ] Privacy policy section
- [ ] Every new string in all five locale files
- [ ] Tests: form sends and shows the thank-you; buttons follow `inviteOnly`; admin page lists, invites, copies, dismisses (with confirm); admin link hidden for non-admins
- [ ] Screenshot critique round (`scripts/shoot.mjs`) in all five themes and at phone width, then `design-reviewer`
- [ ] Review: `reviewer`

### Phase 3 — Verification & docs

- [ ] Tests, build, lint, `precheck.ps1`
- [ ] Browser pass (`browser-check`): logged out → landing → Request an invite → thank-you; as admin → invite → email in Mailpit → link → sign up → the row shows "Joined"
- [ ] `DEPLOY.md`: set `Admin__Usernames__0` on Render
- [ ] CHANGELOG, roadmap box, Stage 7 admin-role wording
