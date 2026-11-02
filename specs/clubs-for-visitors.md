# Feature Spec — Clubs for Visitors

**Status:** Planned 2026-11-01 from the user's request: "an option to show the clubs (public ones) to people without accounts, with the option to see the clubs and also the option to create one with the prompt to create an account". Two phases: Phase 1 (server, size S), Phase 2 (browser, size M). The choices in §2 are defaults taken from `specs/shareable-pages.md`. **Built 2026-11-01**, both phases (§5 notes what changed from the plan).

## 1. Problem

A logged-out visitor sees **Clubs** in the sidebar, but tapping it sends them to the login page (`/clubs` is a `ProtectedRoute`). So does a public club's own address, `/clubs/:id`. Only an invite link (`/clubs/join/:token`) opens for visitors. Clubs are one of the main reasons to join, and a stranger arriving from Reddit can't see that any exist.

What already exists (checked 2026-11-01):
- `GET /api/clubs` (the directory: public clubs only, search, topic, language, sort) already answers without login.
- `GET /api/clubs/{id}/preview` gives a public club's card to a signed-in non-member (private clubs answer 404). It needs login today.
- The visitor flow from `specs/shareable-pages.md`: `SignupBox` / `useSignupBox`, the `join` action that runs once after sign-up (`web/src/lib/signInAction.ts`, `SharedPageSignups.Actions` on the API), and `User.SignupSource`.

## 2. Decisions

- **`/clubs` opens for visitors.** They see the **Discover clubs** list with its search, topic, language and sort, exactly as a reader does. There's no "Your clubs" section, and no invite or chat dots.
- **"Start a club" is shown to visitors.** Tapping it opens the sign-up box: "Create a free account to start your own book club". After sign-up the reader lands back on `/clubs` with the Create club window already open. A new sign-in action `createClub` does this. Nothing is created on its own: the reader still fills in the name and presses Create.
- **A public club's page opens for visitors, as its card only.** It shows the same card as an invite link: picture, name, description, current book and cover, member count, topics, language and rules. **Join** opens the sign-up box ("…to join “Club”"), then the existing `join` action runs. If the club has rules, the reader lands on the card with "Read the club's rules, then press Join club", as today.
- **Visitors never see** discussions, threads, chat, checkpoints, rounds, suggestions, votes, meetings, the member list or anyone's progress. This is the same line `specs/shareable-pages.md` drew for invite links.
- **A private club or a buddy read** at `/clubs/:id` shows the visitor the page a signed-in non-member gets: not found, with a link back to Discover. Its name is never shown.
- **Sign-up counting:** a sign-up started on a club page or the directory counts as `club` in Admin stats ("Sign-ups from shared pages"), the same kind as invite links.
- **The rail's "Log in" card steps aside** on `/clubs` and `/clubs/:id` for visitors, as it does on other shared pages, since those pages have their own sign-up prompts.
- **Out of scope:** paging the directory (already listed in `bugs/backend-scale-hotspots.md`; more visitors make it matter sooner).

## 3. Design

### Backend
- `GET /api/clubs/{id}/preview` drops `[Authorize]` and uses `User.TryGetUserId()`. The ban check (`specs/stronger-clubs.md` §3.1) runs only for a signed-in reader. A private club, a buddy read or a deleted club still answers 404, for visitors too. (Clubs have no "hidden by an admin" state: an admin can only delete one.)
- `ClubService.GetPublicPreviewAsync` takes `Guid? viewerId`. Its DTO stays the same, and the server checks that it carries nothing a visitor shouldn't see: no invite token, no member names.
- `SharedPageSignups.Actions` gains `createClub`. The sign-up source for `next=/clubs…` is already `club`; confirm that `/clubs` alone (with no id) maps to it too.
- Confirm the directory leaves out private clubs and buddy reads for visitors, as it does for readers, and add a test with no login.

### Frontend
- `App.tsx`: `/clubs` and `/clubs/:id` leave `ProtectedRoute`. `/clubs/:id/settings` stays protected.
- `ClubsDirectoryPage`: without a reader, skip `/clubs/mine`, invites and the buddy-read prefill. Show Discover, and turn "Start a club" into `signup.ask('createClub')`. When the page comes back with the `createClub` action, open `CreateClubModal` once.
- `ClubPage`: without a reader, don't call `GET /api/clubs/{id}`. Load `/preview` and show the same card component `ClubJoinPage` uses, with Join going through the sign-up box. While the preview loads, show the page's skeleton; on a 404, show the "not found" state.
- `signInAction.ts`: add `createClub`, plus the sign-up box text for it in all five locales.
- `RightPanel`: the visitor rail on club pages follows the rule in §2.

## 4. Tasks

### Phase 1 — Server (size S)

#### Backend
- [x] `/preview` open to visitors; ban check only when signed in; `createClub` in the allowed actions.
- [x] Tests with no login: a public club's preview (and that it has no token and no member names); 404 for a private club, a buddy read and a deleted club; the directory leaves out private clubs and buddy reads; `next=/clubs` with `do=createClub` is kept, and an unknown action is dropped.
- [x] `reviewer` and `argos-security` (what visitors can see).

### Phase 2 — Browser (size M)

#### Frontend
- [x] Routes; the visitor Discover list; Start a club through the sign-up box and its `createClub` return; the visitor club card on `ClubPage`; the rail.
- [x] Translations (en, es, pt-BR, de, fr).
- [x] Vitest: Discover for a visitor makes no logged-in calls; Start a club opens the sign-up box; the `createClub` return opens the window once; a visitor on a public club sees the card and Join, on a private one the not-found state.
- [x] `reviewer`; `design-reviewer` on the screenshots.

#### Verification
- [x] Browser check in a private window: sidebar Clubs, then Discover, then a public club's card, then Join, sign-up and email confirmation, landing in the club. Separately, Start a club, then sign-up, landing on `/clubs` with the Create window open. A private club's address shows not found. Check at 390 px and in Dark.

## 5. As built (2026-11-01)

- **Server.** `/preview` and `JoinPublicAsync` now also refuse any kind but a club, as the directory does, so a buddy read wrongly marked public still can't be seen or joined. A bare `/clubs` (with or without a query) counts as a `club` sign-up. `GET /api/clubs/{id:guid}/preview` joined the list of endpoints open to visitors (`AnonymousEndpointsTests`).
- **Rate limit (security review).** The directory now uses `PublicPolicy` (60 a minute per IP, shared with the landing page's reads), since it has no paging yet and visitors can now land on it.
- **Known and accepted.** A visitor's member count isn't filtered by blocks, so it can be one higher than a blocked reader's. This was already true of the directory and the invite card (`bugs/blocks-only-apply-signed-in.md`). The ban message shows only to a signed-in reader.
- **Routes.** `/clubs` and `/clubs/:id` use `ProtectedRoute allowVisitors` rather than no guard: a visitor gets the page, while a signed-in reader still waits for their session (so their own clubs never flash in Discover and a buddy-read prefill survives a reload) and still gets the retry and scheduled-deletion screens (review).
- **Join after logging in.** If the account a visitor logs in to is already in the club, `ClubPage` clears the `join` state without running it, so leaving the club and pressing Back can't re-join it (review).
- **Browser.** "Start a buddy read" is hidden from visitors, since a buddy read is with readers you know. The not-found state for a private club or buddy read gained a "Discover clubs" button on its own line, and the club card a quiet "Discover clubs" link under it, for signed-in non-members too (design review).
- **Left as they are (design review):** a club with no picture shows none on its card, as on an invite link (giving it the directory's initial cover would change the invite card too); on a phone the visitor's lone "Create a club" is full width, like the signed-in buttons. A reader who logs in to an account with an unconfirmed email gets the Create window but only learns on Create that the email needs confirming.
- **Link previews (added 2026-11-02).** Sharing `/clubs` showed the generic English card: only the six kinds in `specs/shareable-pages.md` had cards, and the Clubs page had no Share button, so a copied address never carried `/es`. Now `/clubs` (the directory: "Book clubs on Winged Words") and `/clubs/<id>` (a public club's own card, the same as its invite link; private clubs and buddy reads get the generic card) have cards in English and Spanish, with or without `/es`, in `web/nginx.conf` and `ShareCardService`. The Clubs page has a Share button for everyone, which copies `/es/clubs` while the site is in Spanish.
