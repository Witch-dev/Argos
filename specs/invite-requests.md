# Feature Spec — Request an invite

**Status:** ✅ Done 2026-10-19 (all three phases). Roadmap Stage 4 (before the closed beta starts). Left for deploy: set `Admin__UserIds__0` on Render (`DEPLOY.md`, "Admin role").

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

- **Every submission gets the same thank-you.** This holds for a new request, a repeat of one already waiting, and an address that already has an account. So the form can't be used to find out who has an account. A repeat while one is pending keeps the original date, so the person keeps their place in line. *(Security review: it also keeps the original note and language, and only fills a note left empty. Anyone who knows an address can send it, so a repeat mustn't rewrite what the person said.)*
- **The form exists only while invite-only is on.** When the switch is off at public launch, the button disappears and the endpoint answers 404. Anyone can sign up then anyway.
- **Requests are kept for 90 days.** Any request decided more than 90 days ago (invited or dismissed) is deleted by the existing nightly clean-up, or by a new small one. ~~Pending requests stay until they are decided.~~ *(Security review: a request nobody answers is deleted 180 days after it was made, so the list doesn't stay forever, including after sign-up opens. An unused team invite goes with its request.)* The privacy policy says so (§3.6).
- **The email goes out in the language the visitor was using** when they asked. It is saved with the request, because there's no account to read it from.
- **A cap of 5,000 pending requests** (`InviteRequests:MaxPending`). Past it, new requests still get the thank-you but aren't saved, and a warning is logged. This keeps a bot that gets past Turnstile from filling the table.

## 3. Design

### 3.1 Admin role (minimal)

- An Identity role called **`Admin`**. Identity's role tables already exist and are unused.
- **Who is admin comes from config:** ~~`Admin:Usernames`~~ **`Admin:UserIds`** (a list of account ids). On startup the API makes the role match the list. Everyone listed gets it, and anyone not listed loses it. On Render this is `Admin__UserIds__0=<your account id>` (the `id` from `/api/auth/me`). *(Security review: a username can be given up and taken by someone else 30 days later, who'd become admin at the next restart; an id never changes hands.)* No admin screens for managing admins. *(Built: `Admin:SyncOnStart`, default on, is turned off in the test factory, because every test host shares one database and its start would take other tests' admins away.)*
- **Checked on every request, from the database.** It isn't put in the login token, so removing someone from the list takes effect when the API restarts, not when their token expires. An `[RequireAdmin]` filter (like `[RequireConfirmedEmail]`) answers 404 to non-admins and to logged-out callers (the controller has no `[Authorize]`, which would answer 401), so the admin endpoints look like they don't exist. Admins must also have a confirmed email.
- `GET /api/auth/me` gains `isAdmin`, so the frontend can show the link. *(Review: so do the settings endpoints that answer with the same object, since the site writes their answers into its "me" cache.)*

Stage 7's "A site admin role" box is then partly done. Update its wording to say so.

### 3.2 Invites that belong to no reader

`Invite.InviterId` becomes **nullable**. A null inviter means "from the Winged Words team". Readers' invite counts, lists and deletes all filter by `InviterId`, so they don't see these. *(Built: one migration, `AddInviteRequests`, holds this and §3.3.)* Claim, release and use work exactly as today, with no change to sign-up.

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
                                     rate limit: the Auth policy (per network address, per minute)

GET  /api/admin/invite-requests?status=pending&page=1
                                     → { items: [{ id, email, note, createdAt, status, decidedAt,
                                                   alreadyReader, inviteCode?, inviteUsedAt? }], total }
POST /api/admin/invite-requests/{id}/invite   → 200 { inviteCode }  (makes a team invite, queues the email)
                                     → 409 if not pending
POST /api/admin/invite-requests/{id}/dismiss  → 204   (409 if not pending)
```

- `alreadyReader`: an account already uses that email. It's shown only to the admin, so you don't invite someone twice.
- Inviting runs in one transaction: make the invite, mark the request `Invited`, and queue the email through `EmailQueue`. Two clicks at once must not create two invites. Use the conditional `UPDATE … WHERE Status = Pending`, the same pattern as invite claims.
- New error codes in `ErrorCodes.cs` with `errors.codes` translations: `inviteRequests.notPending` and `inviteRequests.noteTooLong` (the email messages reuse `auth.emailInvalid` and `auth.emailTooLong`).
- *(Review: the email is checked as MimeKit will parse it when sending, so "Name <x@y>" is refused and an invite can't silently go nowhere.)*

### 3.5 The invite email

A new method, `AccountEmails.InviteFromRequest(email, language, code)`, built with the same `Build` helper as the other emails. Subject: "Your invite to Winged Words". One short paragraph, then the button **"Create your account"** linking to `{FrontendBaseUrl}/register?invite=ABCD-2345`, then the code written out for typing by hand. It has no greeting by name (there's no account), and the note is not repeated back. Texts in all five languages.

### 3.6 Frontend

- **Landing page:** while invite-only is on, the opening and closing sections show **"Request an invite"** as a second button next to "Have an invite? Join". It's quieter than Join (DESIGN.md: one green action per view). The private-beta line becomes: "Winged Words is in private beta. Have an invite from a reader? Join. Otherwise, ask for one." Final wording to be decided at build time, in all five languages.
- **`/request-invite` page:** a logged-out page in the same look as `/register` (`AuthForm` styles). It has the email field, the optional note with a character count, the bot-check widget and **Send request**. After sending, the same card shows the thank-you message with a link back to the landing page. A logged-in reader who opens it is sent to Settings → Invites. While invite-only is off, it redirects to `/register`.
- **Register page:** while invite-only is on, under the invite field: "No invite? Request one" links to `/request-invite`.
- **Admin page `/admin/invite-requests`:** reached from a link in the account menu that only admins see. It has Pending / Invited / Dismissed pills and one row per request: email, the date, the note (folded if long), and an "Already has an account" tag. Pending rows have **Invite** (green) and **Dismiss** (asks first). Invited rows show the code with **Copy link**, and "Joined" once the code is used. It's built with the shared pieces (raised card, hairline rows, segmented control) and works at phone width. Non-admins get the normal not-found page.
- **Privacy policy:** a new short section in all five languages: "If you ask for an invite, we keep your email and note to decide and to send the invite. We delete them 90 days after we decide, or after 180 days if we never do, and you can ask us to delete them sooner at hello@wingedwords.app."

## 4. Out of scope

- An email confirming the request (decided in §2).
- Telling a dismissed person they weren't picked.
- Inviting several requests in one click, or inviting automatically.
- Managing admins from the app (it's config only), and any other admin tools (Stage 7).
- Showing the requester their place in line.

## 5. Tasks

### Phase 1 — Backend ✅ 2026-10-19

- [x] `AdminOptions` (`Admin:UserIds`, `Admin:SyncOnStart`), startup sync of the `Admin` role (`AdminRoles`), `[RequireAdmin]` filter (404, confirmed email), `isAdmin` on the current-user DTO
- [x] `Invite.InviterId` nullable; readers' invite queries still filter by inviter
- [x] `InviteRequest` entity, `IInviteRequestRepository`, migration `AddInviteRequests` (also holds the nullable inviter; partial unique index on pending email)
- [x] `InviteRequestService`: submit (normalise, same answer for every case, a repeat can't rewrite, pending cap), list, invite (one transaction, conditional update, queue email), dismiss; `InviteRequestCleanupService` (90 / 180 days)
- [x] `InviteRequestsController` (anonymous submit, Auth rate limit, bot check, 404 while open sign-up) and `AdminInviteRequestsController`
- [x] `AccountEmails.InviteFromRequest` in five languages
- [x] Error codes + `errors.codes` translations
- [x] Tests (`InviteRequestTests`, `InviteRequestBotCheckTests`; the role tests live in `InviteRequestTests`):
  - submit works, a repeat keeps its date, note and language (fills an empty note), the same address at once makes one row, an existing reader's email gets the same answer and no row
  - 404 while open, bot check enforced, bad email (also "Name <x@y>") and note too long refused, pending cap
  - non-admin and logged-out get 404 on the admin endpoints, an unconfirmed admin is refused; `isAdmin` survives saving a setting
  - invite makes a team invite, queues one email in the saved language, and the code signs someone up
  - two parallel invites on one request make one invite; invite or dismiss on a decided request → 409
  - team invites don't count against or appear for any reader; the role sync adds and removes by id
  - the clean-up deletes answered requests after 90 days and unanswered ones after 180, with unused team invites
- [x] Bruno requests (`bruno/InviteRequests`)
- [x] Review: `reviewer` + `argos-security`

#### Review pass (2026-10-19)
- [x] Fixed:
  - **(Security, Medium) Admins were listed by username.** A name the owner gave up, or hadn't registered yet, could be taken by someone else and made admin at the next restart. Now listed by account id.
  - **(Security) A repeat request could rewrite someone's note and language.** It now keeps them.
  - **(Security) Unanswered requests stayed forever.** Deleted after 180 days.
  - **(Security) "Name <x@y>" passed the email check,** slipping past the one-per-address rule and putting text in the email's To line. The address must now parse to itself in MimeKit.
  - **(Review) `isAdmin` was only on `/api/auth/me`.** Saving a setting answers with the same object, which the site writes into its cache, so the admin link would have vanished.
  - **(Review) Logged-out callers got 401** from the admin endpoints, showing they exist. Now 404.
  - **(Review) A huge page number gave a 500.** Clamped.
  - **(Review) Unused team invites outlived their request.** Deleted with it.
  - **(Review) Missing tests:** the bot check on the form, and the same address sent at once.
- [x] Left as is:
  - **A bot past Turnstile could fill the 5,000 cap** with made-up addresses, after which real requests aren't saved (logged). Acceptable at beta scale; a bulk dismiss can come later.
  - **A few milliseconds' timing difference** between an existing reader's address and a new one. It's weaker than what sign-up with an invite already reveals, and each try needs a solved bot check.
  - **The invite email can fail after the request is marked invited** (in-memory queue, 3 retries). The admin page shows the link to copy (Phase 2 task).

### Phase 2 — Frontend ✅ 2026-10-19

- [x] Read `PRODUCT.md`, `DESIGN.md`; a short plan per the `web-design` skill
- [x] API client + hooks: `requestInvite`, `getInviteRequests`, `inviteRequest`, `dismissRequest` (`api/inviteRequests.ts`); `isAdmin` on the current user
- [x] `/request-invite` page (form, bot check, thank-you, redirects; a status that can't be read shows an error and Try again instead of redirecting)
- [x] Admin page: after Invite, a notice says the email is on its way and shows the link with Copy link
- [x] Landing page second button (opening and closing) + new beta line; register page "No invite? Request one" (not shown to someone who came with an invite link)
- [x] `/admin/invite-requests` page and the admin-only sidebar link (new drawn `mail` icon)
- [x] Privacy policy section (after "Deleting your account"), the Turnstile sentence now names the request form, date moved to October 19
- [x] Every new string in all five locale files (new `requestInvite.json` and `admin.json`)
- [x] Tests: `RequestInvitePage.test.tsx`, `admin/AdminInviteRequestsPage.test.tsx`, additions to `LandingPage`, `RegisterInvite`, `SectionNav` (admin link) and `LegalPage` tests
- [x] Screenshot critique round (`scripts/shoot.mjs`) in Paper, Dark and Sepia (German) at 1280 and 375, then `design-reviewer`
- [x] Review: `reviewer`

*Built differently from §3.6, on purpose:* **Invite** is a green outline (`btn-soft`), not filled: a list of rows would otherwise be a column of green buttons (DESIGN.md's One Green Button Rule). The status control is the shared `Segmented`, not pills. Dismiss is a quiet button that asks inline ("Dismiss this request? They won't be told…"), like removing a goal.

#### Review pass (2026-10-19)
- [x] Critique round changed: the note was 17px reading type and outranked the email, so it is now a step smaller; `FoldedText`'s fade was page-coloured and showed as a band on the raised card, so it takes `--folded-fade` (and `--folded-size`) from the page; the landing beta line no longer leaves one word on its last line; the German beta line reworded.
- [x] Fixed (reviewer):
  - **"Show more" could skip a request** after an invite or dismiss (the server pages by offset, the row was only removed in the cache). The pending list is now read again after each answer.
  - **A status that failed to load redirected to /register** (it reads as "sign-up open"). Now an error with Try again.
  - **The "Invite sent" notice came back** after switching tabs. Cleared on a tab change.
  - **A 404 on Invite/Dismiss** (request gone, or no longer admin) only showed a message; the list is now read again, which turns the page into not-found for a removed admin.
  - **The thank-you was announced twice** (a live region and the focused heading). The live region is gone.
- [x] Fixed (design-reviewer, disposition **ship** after one fix round): a long email split mid-word on a phone; it now breaks before the @ or after a dot.
- [x] Left as is (design-reviewer): the thank-you stays a plain heading and line, like forgot-password's "sent" screen. Its 44px and contrast notes were already met (`.btn-small` is 44px under 640px; Dismiss is the accent green).

### Phase 3 — Verification & docs ✅ 2026-10-19

- [x] Tests, build, lint, `precheck.ps1` (`PRECHECK_ALL=1`: 995 backend, 897 web tests)
- [x] Browser pass (`browser-check`): logged out → landing → Request an invite → thank-you; as admin → invite → email in Mailpit → link → sign up → the row shows "Joined". Side API invite-only with `Admin__UserIds__0` set; the email's link pre-filled the code on `/register`; the row checked at 1280 and 375. *Fixed on the spot:* a joined row also said "Already has an account" (the invitee's own new account), which read as a warning; the tag is now hidden once the invite is used (test added).
- [x] `DEPLOY.md`: `Admin__UserIds__0` in the Render table and an "Admin role" section (finding your id, adding and removing admins)
- [x] SPEC.md §7: `Invites` (nullable `InviterId`) and `InviteRequests`
- [x] CHANGELOG, roadmap box, Stage 7 admin-role wording (and the "No admin role" gap row)
