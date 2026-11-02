# Feature Spec — Clubs for Visitors

**Status:** Planned 2026-11-01 from the user's request: "an option to show the clubs (public ones) to people without accounts, with the option to see the clubs and also the option to create one with the prompt to create an account". Two phases: Phase 1 (server, size S), Phase 2 (browser, size M). The choices in §2 are defaults taken from `specs/shareable-pages.md`; change them before building if wanted.

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
- **Out of scope:** a link preview card for `/clubs/:id` (invite links already have one; add it later if club pages get shared on their own), and paging the directory (already listed in `bugs/backend-scale-hotspots.md`; more visitors make it matter sooner).

## 3. Design

### Backend
- `GET /api/clubs/{id}/preview` drops `[Authorize]` and uses `User.TryGetUserId()`. The ban check (`specs/stronger-clubs.md` §3.1) runs only for a signed-in reader. A private club, a buddy read, a deleted club or a club hidden by an admin still answers 404, for visitors too.
- `ClubService.GetPublicPreviewAsync` takes `Guid? viewerId`. Its DTO stays the same, and the server checks that it carries nothing a visitor shouldn't see: no invite token, no member names.
- `SharedPageSignups.Actions` gains `createClub`. The sign-up source for `next=/clubs…` is already `club`; confirm that `/clubs` alone (with no id) maps to it too.
- Confirm the directory leaves out buddy reads and clubs hidden by an admin for visitors, as it does for readers, and add a test with no login.

### Frontend
- `App.tsx`: `/clubs` and `/clubs/:id` leave `ProtectedRoute`. `/clubs/:id/settings` stays protected.
- `ClubsDirectoryPage`: without a reader, skip `/clubs/mine`, invites and the buddy-read prefill. Show Discover, and turn "Start a club" into `signup.ask('createClub')`. When the page comes back with the `createClub` action, open `CreateClubModal` once.
- `ClubPage`: without a reader, don't call `GET /api/clubs/{id}`. Load `/preview` and show the same card component `ClubJoinPage` uses, with Join going through the sign-up box. While the preview loads, show the page's skeleton; on a 404, show the "not found" state.
- `signInAction.ts`: add `createClub`, plus the sign-up box text for it in all five locales.
- `RightPanel`: the visitor rail on club pages follows the rule in §2.

## 4. Tasks

### Phase 1 — Server (size S)

#### Backend
- [ ] `/preview` open to visitors; ban check only when signed in; `createClub` in the allowed actions.
- [ ] Tests with no login: a public club's preview (and that it has no token and no member names); 404 for a private club, a buddy read, a hidden club and a deleted club; the directory leaves out buddy reads and hidden clubs; `next=/clubs` with `do=createClub` is kept, and an unknown action is dropped.
- [ ] `reviewer` and `argos-security` (what visitors can see).

### Phase 2 — Browser (size M)

#### Frontend
- [ ] Routes; the visitor Discover list; Start a club through the sign-up box and its `createClub` return; the visitor club card on `ClubPage`; the rail.
- [ ] Translations (en, es, pt-BR, de, fr).
- [ ] Vitest: Discover for a visitor makes no logged-in calls; Start a club opens the sign-up box; the `createClub` return opens the window once; a visitor on a public club sees the card and Join, on a private one the not-found state.
- [ ] `reviewer`; `design-reviewer` on the screenshots.

#### Verification
- [ ] Browser check in a private window: sidebar Clubs, then Discover, then a public club's card, then Join, sign-up and email confirmation, landing in the club. Separately, Start a club, then sign-up, landing on `/clubs` with the Create window open. A private club's address shows not found. Check at 390 px and in Dark.
