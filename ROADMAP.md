# Argos — Launch Roadmap

Written 2026-10-06. This is the **order of work** from today to a public launch. It pulls together `SPEC.md` §4 "Next up", `PRODUCT-ANALYSIS.md`, `ACCOUNTS-AND-HOSTING.md`, `specs/account-system.md` and the open bugs in `bugs/README.md`.

**How to use it:** work top to bottom. Tick a box when it's done and verified, and add the date. Each step that says **needs spec** gets a spec in `specs/` first (the usual way: clarifying questions → spec → build phase by phase → reviewer + argos-security → changelog). When a whole stage is done, add a `CHANGELOG.md` entry.

**Sizes:** S = under a day · M = a few days · L = a week or more. These are rough and include tests and review.

---

## Gaps found while writing this roadmap

Problems found by checking the code and docs on 2026-10-06. Each one is already a task in the stage named below. This list is here so they don't get lost inside the stages.

| Gap | What's wrong | Why it matters | Fixed in |
|---|---|---|---|
| **No automatic tests on push** | `Apollon/.github/workflows/` exists but is empty. SPEC.md §9 Phase 0 planned CI, but it was never set up. | A change that breaks something is only caught if someone remembers to run the tests by hand. That's risky once real users depend on the site. | Stage 0 |
| **The account spec is out of date** | `specs/app-hardening.md` already shipped refresh tokens, lockout, rate limits and username rules. `specs/account-system.md` still lists them as to-do, with different numbers: 15-minute vs 60-minute login token, 3–20 vs 3–30 character usernames, and a cookie vs `localStorage` for the refresh token. | Following the account spec as written would rebuild finished work and quietly change settings that already work. | Stage 0 (update the spec), then Stage 1 and Stage 4 (cookie move) |
| **No admin role** | Identity's role tables exist (`IdentityRole<Guid>` in `Program.cs`), but no role is ever created or checked. Nothing in the app is admin-only. *(The role itself shipped 2026-10-19 with invite requests; only that page uses it.)* | Reports and moderation need someone allowed to hide content or suspend an account. | Stage 4 (role), Stage 7 (moderation) |
| **Everyone's shelves are public** | `GET /api/logs?userId=` returns any reader's shelves, reading progress and progress notes to anyone, even logged-out visitors. Only reviews have privacy settings. | Strangers arriving at public launch could see everything every reader has logged. | Stage 8 (must ship before public launch) |
| **Blocks don't reach likes and comments** | Blocking hides people from search, discovery, follows and feeds, but a blocked reader can still like and comment on the blocker's things. This includes `bugs/blocks-not-applied-between-commenters.md`. | The 2026-10-03 security review named this as the most likely way a blocked person keeps reaching someone. | Stage 0 (the bug), Stage 7 (the full fix) |
| **Shipped features never checked in a browser** | The book clubs, lists and reviews improvements are all marked "manual browser pass still outstanding". | They pass their tests, but nobody has looked at them on screen, at phone width or in every theme. | Stage 0 |
| **Open Library User-Agent has no contact** | `Program.cs` identifies Argos to Open Library only by the GitHub repo address. | Open Library asks apps for a way to reach them before it blocks traffic it doesn't like. | Stage 0, once Stage 4 has a domain and email |
| **No way to keep the beta closed** | Anyone with the address can register. | The closed beta needs an invite-only switch, turned off at public launch. | Stage 1 (add), Stage 10 (turn off) |
| **No backups, error alerts or legal pages** | Nothing exists yet for backups, error tracking, uptime alerts, a privacy policy or terms of use. | A broken database could lose everyone's reviews, and crashes would go unnoticed. GDPR expects a privacy policy. | Stage 4 |

---

## The plan at a glance

There are two launches, not one:

1. **Early access (open sign-ups since 2026-10-22)**: first planned as a closed beta of 10–30 invited readers, but too few people were interested while there were few readers to meet, so anyone can now sign up. The goal is still real feedback from real use. The site must be safe, recoverable and pleasant on a phone, but it doesn't need every feature.
2. **Public launch**: anyone can sign up. Strangers arrive, so safety, privacy and data rights must be complete first.

| Stage | What | Why it's in this position | Size |
|---|---|---|---|
| **0** | Clean-up and foundations | Cheap, and everything later builds on it | M |
| **1** | Accounts: passwords, email, settings | Can't invite anyone until a forgotten password is recoverable | L |
| **2** | Bring your books in: Goodreads/StoryGraph import | The #1 reason readers switch or don't | M |
| **2b** | Books and Community: two sections, a journal, private books | Changes the navigation, so do it before the phone pass redoes it; also closes the "everyone's shelves are public" gap per book | L |
| **3** | Works well on a phone | Most logging happens on phones; beta testers will use phones | M |
| **4** | Go live: hosting, email, backups, legal | Puts stages 1–3 in front of people | M |
| **4b** | Ready for strangers: feedback button, What's new, landing page | The beta now recruits from Reddit and book communities, not only friends | M–L |
| 🚩 | **Early access starts** (open sign-ups, no invite needed) | | |
| **5** | Notifications | First feature to build during the beta: makes the social side feel alive | M |
| **6** | Your data: export and delete account | Required by law (GDPR) and promised in SPEC.md §8 before any public launch | M |
| **7** | Safety: reporting, moderation, review-bombing rules, blocks | Strangers arrive at public launch | L |
| **8** | Privacy: private accounts and follow requests | Shelves are currently public to everyone, even logged out | L |
| **9** | Yearly goal + stats page | Biggest reason readers pick and stay with an app | M |
| **9b** | Import from more apps: LibraryThing, a pasted list, any Excel/CSV, Bookmory | Strangers arriving at launch come from many apps, not only Goodreads and StoryGraph | M–L |
| **10** | Beta feedback fixes + launch checklist | Fix what early readers found before the public launch | M |
| 🚀 | **Public launch** | | |
| **11** | Right after launch | Formats & series, 2FA/passkeys/Google, Wrapped | — |

The "Next up" list in `SPEC.md` §4 has the same items. **This file decides the order.**

---

## Stage 0 — Clean-up and foundations

Small things that are cheaper now than later.

- [x] **Set up CI (automatic tests on every push).** `Apollon/.github/workflows/` exists but is empty, so nothing checks a change automatically. Add a GitHub Actions workflow: build the API, run backend tests against a Postgres service container, then frontend `tsc -b`, lint, tests and build. SPEC.md §9 Phase 0 planned this from the start. *Size S.* **Done 2026-10-06:** `Apollon/.github/workflows/ci.yml`. All steps pass locally; the first real GitHub run happens on the next push.
- [x] **Update `specs/account-system.md` against what hardening already shipped.** `specs/app-hardening.md` already built part of account-system Phase 1: refresh tokens (30 days, rotated), lockout after 5 wrong passwords, rate limits, username rules (3–30 characters). The account spec still lists these as to-do, with different numbers (15-minute token, 3–20-character usernames, refresh token in a cookie). Mark the shipped parts done and decide the differences, so Stage 1 doesn't rebuild them. *Size S.* **Done 2026-10-06:** new §0 table in the spec. Kept 3–30-character usernames and the existing rate-limit policies; the cookie and 15-minute token wait for Stage 4.
- [x] **Browser click-through of shipped features never checked by hand.** Book clubs improvements, lists improvements and reviews improvements are all marked "manual browser pass still outstanding". Go through each on desktop and at phone width, in all themes. Write any problems found as bug files. *Size S–M.* **Done 2026-10-06:** everything listed works; 7 small problems fixed on the spot (the biggest: adding a not-yet-cached book to a list failed), 1 filed (`bugs/book-page-subjects-bury-log-button-on-phone.md`). See CHANGELOG.
- [x] **Fix the P2 bugs** from `bugs/README.md`:
  - [x] Blocks don't apply between commenters (`blocks-not-applied-between-commenters.md`), M. **Done 2026-10-07**; also blocks commenting on the blocker's reviews and lists. Club discussions filed as P3 for Stage 7.
  - [x] The Feed's activity part reads every followed reader's whole history (`activity-feed-query-reads-whole-history.md`), M. This will get slow with real users. **Done 2026-10-07**: a normal page went from 3.2 s to under 1 ms on 9,000 seeded events.
  - [x] Slow frontend tests time out when the whole suite runs (`mood-test-times-out-under-load.md`), S. CI will hit this immediately. **Done 2026-10-07** (CHANGELOG, "Languages, Phases 2 and 3").
  - [x] List tags can't contain accented letters (`list-tags-reject-accents.md`), M. Filed after this roadmap was written. **Done 2026-10-07.**
- *Open Library User-Agent with a real contact: moved to Stage 4, "Accounts and services", since it needs the real domain and email.*

**Done when:** CI is green on every push, the account spec matches reality, and no P2 bugs are open.

---

## Stage 1 — Accounts

**Spec exists:** `specs/account-system.md`. Only its first three phases are needed for the beta.

- [x] **Account Phase 1, the parts not already shipped:** 12-character passwords with the common-password list, log in with email *or* username, live "username taken" check, reserved names (`me`, `admin`, `settings`…). Moving the tokens into an httpOnly cookie needs the site and API on the same domain, so **do that part in Stage 4**, once hosting exists. *Size M.* **Done 2026-10-07.** The security review also changed lockout to count per network address (see CHANGELOG).
- [x] **Refuse passwords that have appeared in data breaches (new, small).** Have I Been Pwned's free check, which only sends the first 5 characters of a scrambled code of the password. Protects every reader against attackers trying passwords leaked from other sites. *Size S.* **Done 2026-10-07.**
- [x] **Account Phase 2: email.** Sending email (Mailpit locally, Resend in production), confirm your email, forgot password, and a **"new login" email** when someone logs in from a new browser or device. *Size M.* **Done 2026-10-07.** Run `docker compose up -d mailpit` and read emails at localhost:8025.
- [x] **Account Phase 3: settings page.** Display name and bio (nothing can set them today, though the feed shows them), change password, change email, change username, sessions list with "log out everywhere". *Size M.* **Done 2026-10-07.** Settings is in the sidebar.
- [x] **Invite-only sign-up switch (new, small).** A setting that makes registration need an invite code, so the beta stays closed. Turn it off at public launch. *Size S.* **Done 2026-10-07** (grew to M: readers invite readers, 5 links each; `specs/invite-only-signup.md`). Turn on with `Registration__InviteOnly=true` in production, after your own account exists.

**Done when:** a reader can sign up, confirm their email, reset a forgotten password, and edit their profile, all with real emails arriving through Mailpit.

---

## Stage 2 — Bring your books in ✅ done 2026-10-08

**Spec:** `specs/book-import.md` (written 2026-10-07; replaces `specs/account-system.md` Phase 6). It covers all four items:

- [x] **Add StoryGraph** to the import (its CSV export has different columns).
- [x] **Keep notes, dates and rereads**: what readers complain other apps lose.
- [x] **Goodreads lists → Argos lists** (the idea in `FUTURE-IDEAS.md`; the spec already maps custom shelves to private lists).
- [x] **A review screen** for books that couldn't be matched to Open Library, so nothing is silently dropped.

*Size M.*

**Done when:** a real Goodreads export and a real StoryGraph export both import, and a reader can see and fix every book that didn't match.

---

## Stage 2b — Books and Community ✅ done 2026-10-08

**Spec:** `specs/books-community-split.md` (written 2026-10-08). **Proposed position, move it if you disagree:** it changes the sidebar and top bar that Stage 3's phone pass would otherwise rework, and per-book privacy shrinks the "everyone's shelves are public" gap before strangers arrive. Private *accounts* stay in Stage 8.

- [x] **Phase 1:** the Books / Community tabs, per-section sidebar, remembered section. Frontend only. *(Done 2026-10-08; browser-checked in Phase 4.)*
- [x] **Phase 2:** per-book reading visibility (private / followers / public) across every place that reads other people's logs. Reviewer and argos-security after. *(Done 2026-10-08, backend only; club progress left open in `bugs/club-progress-ignores-reading-visibility.md`.)*
- [x] **Phase 3:** Books home (popular books, want-to-read, journal preview), the journal page, privacy settings. *(Done 2026-10-08; reviewer and argos-security found no bugs.)*
- [x] **Phase 4:** Community touches, full browser pass, docs. *(Done 2026-10-08. "Readers to follow" was already there, the journal label was skipped, Goodreads has no privacy signal; manual test plan `testing/books-and-privacy.md`. Section names still to review in `FUTURE-IDEAS.md`.)*

*Size L.*

**Done when:** a reader can stay entirely inside Books, mark any book private or followers-only and have it vanish from everything other people see, and switch it back.

---

## Stage 3 — Works well on a phone

**Spec:** `specs/phone-pass.md` (written 2026-10-11). **Built 2026-10-11; waiting on the real-phone check** (`testing/phone.md`).

- [x] **The five screens people use most** work comfortably at phone width (≤ 640 px): log a book, update a page, write a review, the Feed, a club checkpoint. *(Browser-checked at 390 px in Paper and Dark: no sideways scroll, controls at least 44 px.)*
- [x] **Quick-log**: "+10 pages" and "Finished!" with a quick rating, from the "+" tile's book list and the book page (the Readings strip itself shows people's stories, so it has no quick-log).
- [x] **Installable web app (PWA)**: manifest and icons, no offline mode.
- [x] **Look-and-feel polish** from the `taste-skill` review: global focus ring, press feedback, `100dvh`, skip link, 404 page, tabular numerals, 65-character reading width.
- [x] **Font-size scale** (`specs/font-size-scale.md`, from `ux-reviews/community-feed.md` #11): 7 `--font-size-*` tokens in place of 19 raw sizes across 127 CSS files, a test that stops new raw sizes, then migrate area by area. Size M. *Done 2026-10-12: six `--font-size-*` tokens, 419 of 420 sizes migrated, one documented exception.*
- [ ] **Real-phone check**: log a book, +10 pages, finish with a rating, add to the home screen. **Deferred to the live site (decided 2026-10-11):** do it with `testing/phone.md` once Stage 4 has the site up, since only HTTPS gives a true install. Tracked as the last item of Stage 4's "Safety nets".

*Size M.*

**Done when:** you can log a book, update progress and finish a book on a real phone in a few taps.

---

## Stage 4 — Go live

**No feature spec needed.** The research and choices are in `ACCOUNTS-AND-HOSTING.md` Part 2. Write a short `DEPLOY.md` as you go (how to deploy, where secrets live, how to restore a backup).

**Accounts and services**
- [x] Buy `wingedwords.app` at **Porkbun** and keep its DNS there (auto-renew, two-factor login, registrar lock on). *$8.75 first year, $14.93/year after.* **Done 2026-10-08.** Auto-renew and registrar lock are on, and two-factor login was turned on 2026-10-13.
- [x] Everything hosted on **Render**: the site as a static site (free) at `wingedwords.app` with `www.` forwarding to it, the API at `api.wingedwords.app`, and the database on Render Postgres. Porkbun's DNS points at Render with the records Render shows. Render's free database is deleted after 30 days, so it's fine for a first test but must be on the paid plan (~$6–7/month) before anyone's real data goes in. **Done 2026-10-13**, with the site as a *Docker* web service rather than a static site (it needs the nginx start-up script for `config.js` and the CSP); all on Render's free plans for now, so **the database and API must move to paid plans before real readers join** (see `DEPLOY.md`, "How the live site is set up on Render").
- [x] Resend for sending email, with the domain verified in Porkbun's DNS · Porkbun's free email forwarding so `hello@wingedwords.app` reaches your Gmail. **Done 2026-10-13:** domain verified, sending key made, confirmation email arrives, and `hello@wingedwords.app` forwards to Gmail (tested).
- [x] **Email settings for production:** `Email__Host` (Resend's SMTP), `Email__Username`/`Email__Password`, `Email__FromAddress`, and **`Email__ReplyToAddress` set to the `hello@…` address**. The "your email was changed" notice tells readers to reply if it wasn't them, so replies must reach someone. *Size S.* **Done 2026-10-13**, with `Email__Port=2587` because Render's free instances block ports 25/465/587 (`DEPLOY.md`).
- [x] **Open Library User-Agent with a real contact** (moved from Stage 0). **Done 2026-10-11:** the User-Agent comes from the `App:Contact` setting, set to the site address and `hello@wingedwords.app` in `appsettings.Production.json`; re-check it once the domain and the address really exist. Original task: `Program.cs` sends `Argos/1.0 (https://github.com/Witch-dev/Apollon)`. Open Library asks for a way to reach you if something goes wrong. Once the domain and the `hello@…` address exist, change it to the real site address and that email. *Size S.*

**Security setup** (`ACCOUNTS-AND-HOSTING.md` §2.6)
- [x] HTTPS everywhere, with HSTS. **Done 2026-10-19:** the three `curl` checks pass on the live site. Code: the site and the API both send `Strict-Transport-Security` (one year, subdomains); Render already does HTTPS and the redirect, and `.app` is on the browsers' built-in HSTS list anyway. Left: deploy, then the three `curl` checks in `DEPLOY.md` ("HTTPS and HSTS"), then tick.
- [x] *(Deploy with or before the cookie change: every page load of a signed-in reader now calls `/refresh`, so without real IPs the 30/min refresh limit would be one bucket for the whole site.)* `ForwardedHeaders` with the real proxy listed, so rate limits see real visitor IPs instead of making everyone share one limit. The login lockout (`LoginAttemptLimiter`, 5 wrong passwords per account per address) depends on this too. **Done 2026-10-11**, ahead of hosting, alongside the cookie change. Built as `VisitorAddressMiddleware`, which reads Render's chain by its shape instead of `UseForwardedHeaders`' hop count (the security review showed a count can be spoofed). **After the first deploy, do the check in `DEPLOY.md` ("Visitor addresses behind the proxy").**
- [x] **Bot check on login and sign-up** — moved to Stage 10 on 2026-10-11 (the beta is invite-only, so no Cloudflare account is needed yet), then **built early on 2026-10-13** (`specs/bot-check.md`). It's off until `Turnstile__SiteKey` and `Turnstile__SecretKey` are set, so only the Cloudflare account and keys stay in Stage 10. (Cloudflare Turnstile, free.) Required on every login and sign-up while on (not "after a few failures": credential stuffing makes one or two guesses per address). Stops bots trying leaked email/password pairs from thousands of addresses, which per-address limits can't. *Size S.*
- [x] Move login tokens into an httpOnly cookie (the part left over from Stage 1), now that the site and API share a domain. In the same change, shorten the login token from 60 to 15 minutes (`specs/account-system.md` §0 and §3.2). **Done 2026-10-11**, ahead of hosting: localhost on any port is already one site. Check it again on the live domain (log in, reload, still logged in).
- [x] Production secrets (JWT key, database password, Resend key) live in the host's secret settings, never in the repo. Also set `Cors__AllowedOrigins__0=https://wingedwords.app`, and make the API refuse to start outside Development when it's missing. **The refusing part is done 2026-10-11** (`FrontendOrigins`); only setting the variable on Render is left. **Done 2026-10-13:** all set in Render's environment, including `Cors__AllowedOrigins__0`; the API also refuses to start without `Jwt:Issuer`/`Jwt:Audience`.

**Safety nets**
- [ ] Database backups: Render Postgres's paid plan backs up automatically. Do **one real test restore** into a scratch database. A backup that has never been restored doesn't count.
- [x] Error tracking (Sentry, free plan) on the API and the site. **Done 2026-10-19:** a test error from the live site reached Sentry (200 OK). **Built and pushed 2026-10-19** (Apollon 648e7a8: errors only, reports stripped of anything about the reader; `SENTRY_DSN` set on the site service; the privacy policy names Sentry and US storage). Left: once deployed, the check in `DEPLOY.md` ("Error tracking (Sentry)"), then tick.
- [x] Uptime alert (UptimeRobot, free). **Done 2026-10-19:** the site and `api.wingedwords.app/health` (which also checks the database) every 5 minutes, alerts by email (`DEPLOY.md`, "Uptime alerts").
- [x] **Deploy only after CI passes.** On each Render service (site and API), set auto-deploy to "After CI checks pass" instead of "On commit", so a push to `main` goes live only once the GitHub Actions tests are green; a red build never reaches readers. Note it in `DEPLOY.md`. **Done 2026-10-19** on both services (`DEPLOY.md`, "Things that bit us on the first deploy").
- [ ] **Real-phone check on the live site** (carried over from Stage 3): walk `testing/phone.md` on a real phone against `wingedwords.app`, including P18/P19 (home-screen install over HTTPS). Fix what fails, then tick Stage 3's last box.

**Landing page** (`specs/landing-page.md`, Phase 1)
- [x] Landing page for logged-out visitors at `/`: pitch, mascot, four feature cards built from live mini-components, a join button that follows the invite-only switch, and link-preview tags. Do this after the privacy policy exists, so the page's trust line can be checked against it. *Size M.*
  - *Built and verified 2026-10-06.* Three things are left for this stage, once the site is live:
    - ~~add privacy and terms links to the footer~~ (done 2026-10-11);
    - ~~check the trust line against the privacy policy~~ (done 2026-10-19: it now also says "we don't sell your data" and that you can download or delete everything);
    - ~~make `og:image` an absolute URL~~ (done 2026-10-19, with a redrawn image: the old one still said Toffee); ~~test a real link preview~~ (done 2026-10-19: the preview works).
- [x] **Request an invite** (`specs/invite-requests.md`): a "Request an invite" button on the landing page, a short form (email + optional note), and an admin page where you turn a request into an emailed invite. Adds the minimal admin role Stage 7 builds on. *Size M.* **Done 2026-10-19.** On deploy, set `Admin__UserIds__0` (`DEPLOY.md`, "Admin role").

- [x] **Open Library ratings as a stand-in** (`specs/open-library-ratings.md`, new, small): a labelled Open Library average on the book page until a book has 10 Winged Words ratings, so the first readers don't see "No ratings yet" everywhere. *Size S.* **Done 2026-10-19.** Books already cached get their rating from the refresh job within about a week of deploying.

**Legal basics** (plain-language templates are fine at this size; not legal advice)
- [x] Privacy policy at `/privacy`, in all five languages. **Written 2026-10-11** from the facts below. Before going live, re-read it for three things: backup retention (it says only that backups are overwritten; add the number once Render's plan is chosen), the error-tracking paragraph (true only once Sentry is wired; **rewritten 2026-10-19** with Sentry wired: names it, US storage, what a report carries) and that `hello@wingedwords.app` really receives mail. Original task: what's stored, why, how to export and delete it. **Facts to put in it (built in Stage 6, 2026-10-11):**
  - **Download:** Settings → Privacy & data → "Download my data" gives a zip of CSV files: profile, book log (Goodreads' columns), lists, writings, comments, club messages, follows and favourites. Up to 5 an hour per reader.
  - **Delete:** Settings → Privacy & data → "Delete my account", password required. The account is hidden at once and every session ends. For 30 days the reader can log in and cancel, and everything comes back. After 30 days it is erased for good, with the reader's own logs, reviews, lists, writings, likes, follows and sign-in records.
  - **Comments:** the reader chooses at deletion time to keep their comments and club messages, shown as "Deleted user" with no profile link, or to have them erased too. Comments other readers left on the erased reader's own writings, lists and reviews are erased with them.
  - **Clubs:** a club the reader created passes to another member, or is deleted if nobody else is in it.
  - **Username:** an erased username is held for 30 days before anyone can register it.
  - **Not erased at once:** nothing is kept after the 30 days except what is in backups until they roll over (say how long once Stage 4's backup plan is set) and what other readers copied.
- [x] Terms of use at `/terms`, minimum age 13, all five languages. **Done 2026-10-11.**
- [x] Open Library credit in the footer ("Book data from Open Library"). **Done 2026-10-11:** `SiteFooter`, with the policy and terms links, under every page and at the bottom of the landing page.

*Size M.*

**Done when:** the site runs on its own domain over HTTPS, emails arrive in a real inbox, a backup has been restored once, and an error on the site shows up in Sentry.

---

## Stage 4b — Ready for strangers (added 2026-10-20)

The user has few friends who track their reading, so early-access readers will come from Reddit and book communities. Strangers need a landing page that explains the app on its own, and a visible way to give feedback. Planned in eight rounds of questions on 2026-10-20; build in this order:

- [x] **Feedback button** (`specs/feedback-button.md`): a floating speech-bubble circle for signed-in readers; idea / feedback / problem; emailed to `hello@` and saved on an admin page. *Size M.* **Built 2026-10-20.** Left on deploy: the Gmail "Send mail as" setup in `DEPLOY.md` and one test reply.
- [ ] **What's new** (`specs/whats-new.md`): a public updates page with an admin editor (date, title, text, optional image, English required), a gold dot in the sidebar, started with the last month's changes. *Size M–L.* **Built 2026-10-20** (Apollon 6b7c35b). 12 past entries approved 2026-10-20 (`content/whats-new-past-entries.md`). The 4 screenshots are in `content/whats-new-shots/` (approved 2026-10-20). Left: paste the 12 entries into `/admin/whats-new` on the live site.
- [ ] **Landing page Phase 3** (`specs/landing-page.md`): a Books / Community switch under the headline, four live examples per side, a shared part (one independent developer, nothing behind a paywall, always improving, feedback shapes it, no ads, download or delete, five themes), and "early access" instead of "private beta" everywhere. Copy round and mockup round before any code. *Size M–L.* **Built 2026-10-20** (Apollon 565dda2; copy approved, mockup round skipped by the user). Left: the user's look at the page and copy changes, a new `og-image.png`.
- [ ] **Admin stats page** (`specs/admin-stats.md`, added 2026-10-22): `/admin/stats` with readers, new readers, active readers (opened the app that day, signed in), signed-out visits counted by our own API (no cookie, no address stored) and imports, as figures and day-by-day bars for 7 / 30 / 90 days. Before early access so the counting starts on day one. *Size M.* **Built 2026-10-22** (Apollon 5cbb428). Left: deploy, then check the next day that yesterday's active readers appeared.

- [x] **Stronger clubs** (`specs/stronger-clubs.md`, added 2026-10-23): six phases, in order. *Phase 1, size M:* club settings (rename, public/private, delete, hand over admin), bans, and the privacy wording for club progress. *Phase 2, S–M:* club notifications (join requests, book confirmed, new round, role given, club deleted). *Phase 3, M:* meetings with going/not going and a calendar file. *Phase 4, M:* voting styles (single or ranked choice), deadline, suggestion cap and approval. *Phase 5, L:* buddy reads (2–5 readers, comments hidden until you reach that point). *Phase 6, S–M:* directory topics, language, "active N days ago", club rules.
- [x] **Stronger lists** (`specs/stronger-lists.md`, added 2026-10-24): a shared list passes to its first collaborator when the owner's account is erased, the owner can hand it over (and stays as a collaborator), invites refuse suspended and deleted accounts, and two people removing or reordering at once no longer gives a 500. *Size M.* **Built 2026-10-24.**
- [ ] **Shareable pages** (`specs/shareable-pages.md`, added 2026-10-24): book, list, club, review, profile and author links that work for visitors, plus search results and a "Find a book" field on the landing page: every button shown, a small sign-up box whose action is done after sign-up ("Add this book to your want-to-read"), a Saved lists tab, a Share button, a count of sign-ups from shared pages, and preview cards with the cover on Reddit, Discord and chat apps, in English and Spanish. So Reddit answers can bring readers in. Decisions asked 2026-10-24. *Phase 1 (book, list, club), M–L, ✅ built 2026-10-24; Phase 2 (review, profile, author), M, ✅ built 2026-10-25; Phase 3 (preview cards), M, ✅ built 2026-10-25; left: the live checks after deploy (spec §4 Phase 3 Verification).*
- [x] **Book data in the reader's language** (`specs/book-data-in-reader-language.md`, added 2026-10-25): a book's title, description and cover in the language the site is shown in, from Open Library's editions in that language and from Wikidata / Wikipedia (credited), with the original title in small text; search results too, then every other screen. Found on OL59800W, which shows in English on its Spanish share link. *Phase 1 (book page from editions), M–L; Phase 2 (Wikidata and Wikipedia), M; Phase 3 (search), S–M; Phase 4 (everywhere else), M–L.* *Phase 1 built 2026-10-25: the book page and its share card in the reader's language from Open Library's editions.* *Phase 2 built 2026-10-25: titles from Wikidata, descriptions from Wikipedia (credited).* *Phase 3 built 2026-10-25: search results titled in the reader's language, with the original title under them.* *Phase 4 built 2026-10-25: every other screen (shelves, lists, feed, clubs, stats, notifications, share cards…) shows titles and covers in the reader's language.*
- [x] **Progress by chapter** (`specs/progress-by-chapter.md`, added 2026-10-26, a reader's request on Reddit): log where you are as "finished chapter 7 of 24" instead of a page, for print and ebook; buddy-read locks, club bars, stories and the feed follow. Also fixes our text that says comments unlock "at the page". *Phase 1 (server), S–M; Phase 2 (browser), M. Built 2026-10-26.*
- [x] **Security check before strangers arrive:** ZAP baseline scan and header checks on the live site (same as the Stage 10 box), and look at the Semgrep findings from 2026-10-21. Package and Docker image scanning, gitleaks, Dependabot and security.txt are already in place (Apollon `Security` workflow, added 2026-10-21). *Size S.* **Partly done 2026-10-22:** the 12 Semgrep findings are all fixed in the code (Dependabot cooldown, actions pinned to hashes, both containers without root). Header check with `curl`: the site sends CSP, HSTS, nosniff, referrer and permissions policies, COOP, and `www.`/`http://` redirect to `https://wingedwords.app`; the API sent only HSTS, so it now also sends `nosniff` and `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` (Apollon 0477820, to deploy). Left: deploy, then the ZAP baseline (Docker, `zap-baseline.py`) on the site and `api.wingedwords.app`, and securityheaders.com / Mozilla Observatory. **OWASP Top 10 pass on the code 2026-10-22:** no serious holes; four small findings filed (`bugs/security-events-not-logged.md` P2, `endpoints-public-unless-marked.md`, `supply-chain-pinning-gaps.md`, `email-enumeration-signup-login.md` P3). **Scans on the live site 2026-10-22** (after deploying Apollon b80f2cd; the API now sends nosniff and the CSP): ZAP baseline, passive, 0 FAIL on both. Site: 7 WARN, all accepted: `img-src https:` (Open Library covers come from several hosts), `style-src 'unsafe-inline'` (React inline styles), no SRI on the Google Fonts stylesheet (Google serves different CSS per browser, so a hash can't work; self-hosting the fonts would remove it), no COEP (would block the cross-origin covers), cacheable hashed assets (intended), `no-cache` on the index (intended), a "suspicious comment" that is minified React Router code. API: 1 WARN, cacheable 404s (harmless). Mozilla Observatory: site **A+** (125, 12/12); the API can't be graded (its root is a 404, which is normal for a JSON API). securityheaders.com (checked by the user in a browser, as it refuses automated requests): site **A+**, all six headers. API **A** (missing only Referrer-Policy and Permissions-Policy, which matter for pages shown in a browser, not JSON answers; accepted). **Done 2026-10-22.**

---

## 🚩 Early access (was: closed beta)

**Decided 2026-10-22: sign-ups open now, no invite needed.** Invites and invite requests put off the few people who were interested, and a closed site with few readers has little to interact with. The invite code stays in Apollon, so sign-ups can be closed again in a minute (`Registration__InviteOnly=true`) if spam arrives. These two boxes moved here from Stage 10:

- [x] **Turn the bot check on (Cloudflare Turnstile, free)**, before opening sign-ups: needing an invite was what kept scripts out. Create the Cloudflare widget for `wingedwords.app`, set `Turnstile__SiteKey` and `Turnstile__SecretKey` on the API in Render, and do the checks in `DEPLOY.md` ("Bot check on login and sign-up"). Then decide whether sign-up keeps saying an email is taken (`bugs/email-enumeration-signup-login.md`). *Size S.* **Done 2026-10-22:** widget for `wingedwords.app` (Managed, no pre-clearance), keys on the API in Render, login checked in a private window. The email-taken decision: OWASP's way, built the same day (`specs/signup-check-your-inbox.md`): sign-up never says an address has an account, and the account is made by the emailed link.
- [x] **Turn off invite-only sign-up:** `Registration__InviteOnly=false` on the API in Render. The sign-up page stops asking for a code, the landing page's button becomes a plain sign-up, the "Request an invite" form and the Settings → Invites tab go away. *Size S.* **Done 2026-10-22:** checked in a private window (landing button, no code field on `/register`, a real sign-up with its confirmation email).
- Soon after: `bugs/email-sending-has-no-overall-budget.md` (raised to P2): open sign-ups let anyone make the API send confirmation emails. **Fixed 2026-10-22** (Apollon d0960cd): a daily email budget, warning at 50, optional emails paused from 80.

Ask new readers to import their Goodreads library on day one, and give them one easy place to send feedback: the feedback button (Stage 4b). Record each problem as a bug file, and each wish in `FUTURE-IDEAS.md`. Stages 5–9 are built during the beta.

---

## Stage 5 — Notifications ✅ done 2026-10-11

**Spec:** `specs/notifications.md`. Browser-checked with three readers; manual plan in `testing/notifications.md`.

- [x] An in-app bell: new follower, follow requests, likes (grouped per item), comments, replies, club invites, "checkpoint due in 2 days", collaborator invites on lists. *(@mentions left out: no mention feature exists.)*
- [x] **Quiet by default**, with an on/off setting per type group; likes are off until the reader turns them on. Fable gets complaints for sending too many.
- [ ] ~~A weekly email digest, off by default.~~ **Moved out of this stage (2026-10-11):** build it after launch, on top of the notifications table.

*Size M.*

---

## Stage 6 — Your data: export and delete ✅ done 2026-10-11

**Spec exists:** `specs/account-system.md` Phase 5.

- [x] Export everything as a `.zip` of CSVs, with `logs.csv` in Goodreads' column layout. **Done 2026-10-11.**
- [x] Delete account: hidden at once, fully erased after 30 days, with a choice to keep comments as "Deleted user". **Done 2026-10-11**, reviewed by `reviewer` and `argos-security` and browser-checked. Still to do by hand: nothing blocks it, but add "Delete" and "Download" to the privacy policy in Stage 4.
- [x] **Start with the risky check the spec names:** whether EF Core global query filters work with the Feed's `UNION ALL` query. If they don't, use the spec's fallback. **Done 2026-10-11: they work, filters it is** (`specs/account-system.md` Phase 5).

*Size M.*

---

## Stage 7 — Safety ✅ done 2026-10-20

**Spec:** `specs/safety-and-moderation.md` (written 2026-10-19; decisions asked the same day: admin only, reports change nothing until the admin decides, suspension locks out and hides until lifted, blocks apply in club discussions). **Done 2026-10-20**: four phases, each reviewed by `reviewer` (and `argos-security` for the backend), then browser-checked. The by-hand checklist is `testing/moderation.md` (82 steps).

- [x] **A site admin role.** **Done 2026-10-20**: moderation uses the same role and filter, and no second Moderator role (decided in the spec, §2). *Partly done 2026-10-19 with `specs/invite-requests.md`:* the `Admin` Identity role exists, synced at startup from `Admin:UserIds` (account ids), checked from the database on every request by `[RequireAdmin]` (404 for everyone else, confirmed email required), and `isAdmin` on the current user drives an admin-only menu link. Its only page so far is Invite requests. Left for Stage 7: the moderation actions and screens below use the same role and filter; decide whether moderators need a second, smaller role.
- [x] **Report** a review, writing, comment, list or user, with a reason. **Done 2026-10-20** (`specs/safety-and-moderation.md` Phases 3 and 4): a Report item in the "⋯" menus, club checkpoint comments too.
- [x] **Admin queue**: see reports, hide content, suspend an account. **Done 2026-10-20**: `/admin/reports` (Open / Decided / Suspended), hide and unhide, dismiss, suspend and lift, reset a profile, hide a rating wave's ratings.
- [x] **Review-bombing rules:** **Done 2026-10-20** (Phase 2; "publish date" is the first-publish **year**, the only date Open Library gives):
  - no ratings before a book's publish date
  - no ratings or reviews until the email is confirmed
  - flag a sudden wave of low ratings on one book
- [x] **Blocks reach likes and comments** (`FUTURE-IDEAS.md`): **Done 2026-10-19** (`specs/safety-and-moderation.md` Phase 1; comments were already covered since 2026-10-07, now likes on everything and club discussions too). a blocked reader can't like, comment on or highlight-comment the blocker's things. The 2026-10-03 security review named this as the most likely way a blocked person keeps reaching someone.
- [x] **Community guidelines** page: what's not allowed, so moderation decisions have a basis. **Done 2026-10-20**: `/guidelines` in five languages, linked from the footer, terms, the report dialog, the hidden notice and sign-up.

*Size L.*

---

## Stage 8 — Privacy: private accounts

**Spec:** `specs/account-privacy.md` (written 2026-10-11, decisions asked the same day). **Done 2026-10-11**: backend, frontend, review and a browser pass. A by-hand pass on a real phone and in the other languages is left in `testing/account-privacy.md`. The original notes are in `FUTURE-IDEAS.md`, "Account-level privacy settings".

- [x] Public or private account. Private shows shelves, progress, reviews and writings only to approved followers. Everyone else sees name and avatar only. *(Done 2026-10-11.)*
- [x] Follow requests: approve or decline. *(Built 2026-10-11, backend and frontend; browser pass pending.)*
- [x] Apply it everywhere it's listed in the notes: shelves (`LogsController`), the Readings strip, reviews, writings, likes and comments. **Done 2026-10-11** (audit table in the spec, §3.4; the audit also fixed three gaps the notes didn't list).

*Size L.* It's the last of the must-haves because it touches the most code, but it **must** ship before public launch. Strangers will be able to see everyone's shelves until it does.

---

## Stage 9 — Yearly goal and stats

**Spec:** `specs/yearly-goal-and-stats.md` (written 2026-10-11, decisions asked the same day). Build it phase by phase: backend, frontend, verification.

- [x] Set a yearly goal ("read 30 books in 2027") and see progress on the home page and profile.
- [x] Stats page: books and pages per month, top authors, genres, moods, pace, average rating, DNF rate, longest and shortest book.
- [x] Free, and the page says so.
- [x] **Stronger stats** (`specs/stronger-stats.md`, added 2026-10-24): tap any chart to see its books; days to finish, publication decade, format, length groups, plot vs. character, fiction/non-fiction and audience, languages; the year before for comparison; a line for finished books with no date; club ratings saved on the reader's own date. Before January 2027 and before Wrapped. *Size M–L.* **Built and verified 2026-10-24.**

*Size M.* It's last before launch because it's a reason to *stay*, not a safety need. Getting it in before January 2027 matters, because that's when people set reading goals.

---

## Stage 9b — Import from more apps (added 2026-10-22)

**Spec:** `specs/book-import.md`, Phase 4. Each app gets its own row mapper; matching, the review screen and undo are shared with Goodreads and StoryGraph. Get a real export file from each app before writing its mapper.

- [ ] **LibraryThing**: its tab-separated (or CSV) export. *Size S.*
- [ ] **Paste a list**: one book per line ("Title" or "Title – Author"), no file, matched by title and author. *Size S–M.*
- [ ] **Any Excel or CSV** (Calibre, BookBuddy, Libib…): a step where the reader picks which column is the title, author, ISBN, rating, dates and status. Needs an `.xlsx` reader package (maintained, no high/critical advisory). *Size M–L.*
- [ ] **Bookmory**: its Excel export, as a preset of the step above. *Size S once that exists.*

*Size M–L.* Placed before the launch checklist so it gets the Stage 10 test pass; it can move after launch if the beta fills the time.

---

## Stage 10 — Launch checklist

- [ ] Every bug testers found is fixed or filed as P3.
- [ ] No open P1 or P2 bugs.
- [x] `reviewer` + `argos-security` pass over the whole app, not just the last change. **Done 2026-10-21.** The `reviewer` pass ran over the whole backend in six slices (accounts and platform, books/Open Library/authors/imports, logs and comments, clubs, lists and social, data model); its correctness fixes are in `CHANGELOG.md` (2026-10-21, "Whole-backend review"), with regression tests. Left as bugs: `bugs/club-members-cant-leave.md` (P2), `bugs/backend-scale-hotspots.md` and `bugs/backend-review-minor-gaps.md` (P3). *Access-control part done 2026-10-21:* every endpoint that takes an id tried by a stranger, a reader the owner blocked, a plain club member and a non-admin (`AccessControlTests`, `AdminAccessTests` in Apollon); a blocked reader could still open the blocker's reviews and lists by link (fixed), and the five fixes of Apollon 52d5d08 had never reached main (re-applied). `argos-security` reviewed it.
- [ ] **Outside-in scan of the live site:** OWASP ZAP baseline scan (Docker, passive only) against `wingedwords.app` and the API, plus securityheaders.com and Mozilla Observatory. Every finding fixed or filed as a bug. Also done once before the closed beta (Stage 4b). *Size S.*
- [ ] **Full manual test pass.** Create `Argos/testing/README.md`: one row per area plan with its step count, the commit it was written against, the date last tested and the result. Then run `/test-plan` for every area so each plan matches the code that will launch, and fill in `_shared.md`. Run Playwright through the steps not tagged 👤, then do the 👤 steps by hand on a real phone and desktop. Every ❌ becomes a bug file. Left until now on purpose, so features that are still changing don't need testing twice. *Size M.*
- [ ] Move the API to Render's paid plan (~$7/month) so it never sleeps (`ACCOUNTS-AND-HOSTING.md` §2.3 C).
- [ ] **Right after the paid plan:** send link-preview bots to the API over Render's private network, so each bot gets its own card limit instead of all sharing one (`specs/shareable-pages.md` §7). On the site service set `SHARE_CARD_API_URL` = `http://<API's internal address>:<port>/api` (API service → *Connect* → *Internal*), redeploy, then check with `Proxy__LogForwardedChain` and `curl -A "redditbot"` that the API sees your own address. If the card turns generic, delete the variable (back to the public address). Steps in `DEPLOY.md`, "Link previews". *Size S, ~10 minutes.*
- Turning the bot check on and turning off invite-only sign-up moved to the 🚩 Early access section on 2026-10-22 (sign-ups open now).
- [ ] Landing page Phase 2 (`specs/landing-page.md`): live "What readers are into this week" rows, now that moderation (Stage 7) and private accounts (Stage 8) exist. *Built 2026-10-06 but switched off (`Landing:ShowcaseEnabled`).* To finish: add the private-account and moderation rules to `LandingRepository`, with tests, and call `LandingShowcaseService.Forget` when a reader goes private, turns discovery off, asks for deletion or changes a showcased review (today only moderation does, so those stay up to 10 minutes; whole-backend review 2026-10-21), then switch it on. Check that the "Import from Goodreads" and "Export your data" copy (spec §7) went in when Stages 2 and 6 shipped.
- [ ] Privacy policy and terms re-read against what actually shipped (notifications, export, delete, private accounts, and the reading progress history: page and time per update, in the export as `progress.csv`, deleted with the reading).

---

## 🚀 Public launch

---

## Stage 11 — Right after launch

In rough order. None of these block launch.

1. ✅ **Formats and editions** (SPEC.md Next up #8, `specs/formats-editions.md`): better default cover, choosing your edition, audiobook in hours:minutes. **Done 2026-10-13.**
   - **Series** ("Book 3 of 7"), split out 2026-10-13: Open Library has no structured series data, so it needs its own spec and an answer to who corrects it.
2. **Argos Wrapped / monthly wrap-up** as a shareable image, made from fixed rules, not AI. Aim for December 2026 if the launch lands before then; otherwise December 2027.
3. **Account Phase 4: 2FA, passkeys and "Continue with Google"** (`specs/account-system.md`). Passkeys added 2026-10-07: the strongest protection for readers who turn it on. **"Continue with Google" built 2026-10-22** (ahead of its place, at the user's request); it switches on once the Google client IDs are set up (`specs/account-system.md` §3.8 "Setup"). 2FA and passkeys still to do.
4. **Buddy reads** with page-locked comments.
5. **Mood & trope browsing**, "Popular this week", genre pages.
6. **Author pages** (`specs/authors.md`, specced 2026-10-15): author page and linked author names, then search + "your history with this author", then follow and new-release alerts, then favourites and quotes. Four phases; Phase 1 is size L (new tables, backfill). **Phase 1 done 2026-10-15** (built ahead of its place in the order, at the user's request). **Phase 2 done 2026-10-15, Phase 3 (follow, new-release alerts) done 2026-10-16, Phase 4 (favourites, quotes) done 2026-10-16**; all four phases done.
7. **Shelf design refresh** (`specs/shelf-design-refresh.md`, `DESIGN.md`, approved 2026-10-16 at the user's request): cream page stays, bookbinding green accent, raised cards, drawn icons, covers on a shelf. Foundations first, then the shell, then pages one by one. **Done 2026-10-18**: Phases 0–3, then Phase 4's review sweep and fixes; afterwards the sidebar moved onto the page colour and the header logo became the lettered dog alone, in green.
8. ✅ **Reading update redesign** (`specs/reading-update-redesign.md`, specced 2026-10-18 from the user's mockups): the story viewer as the book on its shelf with a journey line, named likes and quick replies; then the background in the book's colour; then a progress history for the line's earlier points. Three phases, each size M. **Done 2026-10-19** (quick replies removed at the user's request).
9. Everything else in `FUTURE-IDEAS.md`, ordered by what beta and launch users ask for most.

---

## Not needed for launch

Kept here so they don't creep into the plan:
- A native mobile app (the PWA in Stage 3 covers phones).
- Writer features: chapters, feedback mode, critique credits.
- Recommendations.
- Image uploads.
- SEO / server-side rendering.
- `specs/writing-feed-card-and-modal.md`, which is specced but not built.
- The P3 bugs.
