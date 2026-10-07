# Argos — Launch Roadmap

Written 2026-10-06. This is the **order of work** from today to a public launch. It pulls together `SPEC.md` §4 "Next up", `PRODUCT-ANALYSIS.md`, `ACCOUNTS-AND-HOSTING.md`, `specs/account-system.md` and the open bugs in `bugs/README.md`.

**How to use it:** work top to bottom. Tick a box when it's done and verified, and add the date. Each step that says **needs spec** gets a spec in `specs/` first (the usual way: clarifying questions → spec → build phase by phase → reviewer + security-review → changelog). When a whole stage is done, add a `CHANGELOG.md` entry.

**Sizes:** S = under a day · M = a few days · L = a week or more. These are rough and include tests and review.

---

## Gaps found while writing this roadmap

Problems found by checking the code and docs on 2026-10-06. Each one is already a task in the stage named below. This list is here so they don't get lost inside the stages.

| Gap | What's wrong | Why it matters | Fixed in |
|---|---|---|---|
| **No automatic tests on push** | `Apollon/.github/workflows/` exists but is empty. SPEC.md §9 Phase 0 planned CI, but it was never set up. | A change that breaks something is only caught if someone remembers to run the tests by hand. That's risky once real users depend on the site. | Stage 0 |
| **The account spec is out of date** | `specs/app-hardening.md` already shipped refresh tokens, lockout, rate limits and username rules. `specs/account-system.md` still lists them as to-do, with different numbers: 15-minute vs 60-minute login token, 3–20 vs 3–30 character usernames, and a cookie vs `localStorage` for the refresh token. | Following the account spec as written would rebuild finished work and quietly change settings that already work. | Stage 0 (update the spec), then Stage 1 and Stage 4 (cookie move) |
| **No admin role** | Identity's role tables exist (`IdentityRole<Guid>` in `Program.cs`), but no role is ever created or checked. Nothing in the app is admin-only. | Reports and moderation need someone allowed to hide content or suspend an account. | Stage 7 |
| **Everyone's shelves are public** | `GET /api/logs?userId=` returns any reader's shelves, reading progress and progress notes to anyone, even logged-out visitors. Only reviews have privacy settings. | Strangers arriving at public launch could see everything every reader has logged. | Stage 8 (must ship before public launch) |
| **Blocks don't reach likes and comments** | Blocking hides people from search, discovery, follows and feeds, but a blocked reader can still like and comment on the blocker's things. This includes `bugs/blocks-not-applied-between-commenters.md`. | The 2026-10-03 security review named this as the most likely way a blocked person keeps reaching someone. | Stage 0 (the bug), Stage 7 (the full fix) |
| **Shipped features never checked in a browser** | The book clubs, lists and reviews improvements are all marked "manual browser pass still outstanding". | They pass their tests, but nobody has looked at them on screen, at phone width or in every theme. | Stage 0 |
| **Open Library User-Agent has no contact** | `Program.cs` identifies Argos to Open Library only by the GitHub repo address. | Open Library asks apps for a way to reach them before it blocks traffic it doesn't like. | Stage 0, once Stage 4 has a domain and email |
| **No way to keep the beta closed** | Anyone with the address can register. | The closed beta needs an invite-only switch, turned off at public launch. | Stage 1 (add), Stage 10 (turn off) |
| **No backups, error alerts or legal pages** | Nothing exists yet for backups, error tracking, uptime alerts, a privacy policy or terms of use. | A broken database could lose everyone's reviews, and crashes would go unnoticed. GDPR expects a privacy policy. | Stage 4 |

---

## The plan at a glance

There are two launches, not one:

1. **Closed beta**: 10–30 invited readers (friends, friends of friends). The goal is real feedback from real use. The site must be safe, recoverable and pleasant on a phone, but it doesn't need every feature.
2. **Public launch**: anyone can sign up. Strangers arrive, so safety, privacy and data rights must be complete first.

| Stage | What | Why it's in this position | Size |
|---|---|---|---|
| **0** | Clean-up and foundations | Cheap, and everything later builds on it | M |
| **1** | Accounts: passwords, email, settings | Can't invite anyone until a forgotten password is recoverable | L |
| **2** | Bring your books in: Goodreads/StoryGraph import | The #1 reason readers switch or don't | M |
| **3** | Works well on a phone | Most logging happens on phones; beta testers will use phones | M |
| **4** | Go live: hosting, email, backups, legal | Puts stages 1–3 in front of people | M |
| 🚩 | **Closed beta starts** | | |
| **5** | Notifications | First feature to build during the beta: makes the social side feel alive | M |
| **6** | Your data: export and delete account | Required by law (GDPR) and promised in SPEC.md §8 before any public launch | M |
| **7** | Safety: reporting, moderation, review-bombing rules, blocks | Strangers arrive at public launch | L |
| **8** | Privacy: private accounts and follow requests | Shelves are currently public to everyone, even logged out | L |
| **9** | Yearly goal + stats page | Biggest reason readers pick and stay with an app | M |
| **10** | Beta feedback fixes + launch checklist | Fix what testers found, then open sign-ups | M |
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
- [ ] **Account Phase 3: settings page.** Display name and bio (nothing can set them today, though the feed shows them), change password, change email, change username, sessions list with "log out everywhere". *Size M.*
- [ ] **Invite-only sign-up switch (new, small).** A setting that makes registration need an invite code, so the beta stays closed. Turn it off at public launch. *Size S.*

**Done when:** a reader can sign up, confirm their email, reset a forgotten password, and edit their profile, all with real emails arriving through Mailpit.

---

## Stage 2 — Bring your books in

**Spec exists:** `specs/account-system.md` Phase 6 (Goodreads import). Extend it before building:

- [ ] **Add StoryGraph** to the import (its CSV export has different columns).
- [ ] **Keep notes, dates and rereads**: what readers complain other apps lose.
- [ ] **Goodreads lists → Argos lists** (the idea in `FUTURE-IDEAS.md`; the spec already maps custom shelves to private lists).
- [ ] **A review screen** for books that couldn't be matched to Open Library, so nothing is silently dropped.

*Size M.*

**Done when:** a real Goodreads export and a real StoryGraph export both import, and a reader can see and fix every book that didn't match.

---

## Stage 3 — Works well on a phone

**Needs spec** (small; use the `web-design` skill). From `FUTURE-IDEAS.md` "Mobile-first pass".

- [ ] **The five screens people use most** work comfortably at phone width (≤ 640 px): log a book, update a page, write a review, the Feed, a club checkpoint.
- [ ] **Quick-log**: "+10 pages" and "Finished!" with a quick rating, straight from the Readings strip and the book page. Pulled forward from `FUTURE-IDEAS.md` because it makes the phone experience fast.
- [ ] **Installable web app (PWA)**: an app icon on the home screen, without an app store.

*Size M.*

**Done when:** you can log a book, update progress and finish a book on a real phone in a few taps.

---

## Stage 4 — Go live

**No feature spec needed.** The research and choices are in `ACCOUNTS-AND-HOSTING.md` Part 2. Write a short `DEPLOY.md` as you go (how to deploy, where secrets live, how to restore a backup).

**Accounts and services**
- [ ] Buy the domain (Cloudflare or Porkbun, auto-renew on). *~$11/year.*
- [ ] Database on Neon (free plan) · API on Render · site on Cloudflare Pages.
- [ ] Resend for sending email, with the domain verified · Cloudflare Email Routing so `hello@…` reaches your Gmail.
- [ ] **Open Library User-Agent with a real contact** (moved from Stage 0). `Program.cs` sends `Argos/1.0 (https://github.com/Witch-dev/Apollon)`. Open Library asks for a way to reach you if something goes wrong. Once the domain and the `hello@…` address exist, change it to the real site address and that email. *Size S.*

**Security setup** (`ACCOUNTS-AND-HOSTING.md` §2.6)
- [ ] HTTPS everywhere, with HSTS.
- [ ] `ForwardedHeaders` with the real proxy listed, so rate limits see real visitor IPs instead of making everyone share one limit. The login lockout (`LoginAttemptLimiter`, 5 wrong passwords per account per address) depends on this too.
- [ ] **Bot check on login and sign-up (Cloudflare Turnstile, free).** Shown after a few failed logins from one address, or always on sign-up. Stops bots trying leaked email/password pairs from thousands of addresses, which per-address limits can't. *Size S.*
- [ ] Move login tokens into an httpOnly cookie (the part left over from Stage 1), now that the site and API share a domain. In the same change, shorten the login token from 60 to 15 minutes (`specs/account-system.md` §0 and §3.2).
- [ ] Production secrets (JWT key, database password, Resend key) live in the host's secret settings, never in the repo.

**Safety nets**
- [ ] Nightly database backup to Cloudflare R2, and **one real test restore**. A backup that has never been restored doesn't count.
- [ ] Error tracking (Sentry, free plan) on the API and the site.
- [ ] Uptime alert (UptimeRobot, free).
- [ ] CI from Stage 0 also deploys when `main` is green.

**Landing page** (`specs/landing-page.md`, Phase 1)
- [ ] Landing page for logged-out visitors at `/`: pitch, mascot, four feature cards built from live mini-components, a join button that follows the invite-only switch, and link-preview tags. Do this after the privacy policy exists, so the page's trust line can be checked against it. *Size M.*
  - *Built and verified 2026-10-06.* Three things are left for this stage, once the site is live:
    - add privacy and terms links to the footer;
    - check the trust line against the privacy policy;
    - make `og:image` an absolute URL and test a real link preview.

**Legal basics** (plain-language templates are fine at this size; not legal advice)
- [ ] Privacy policy: what's stored, why, how to export and delete it.
- [ ] Terms of use, with a minimum age of 13.
- [ ] Open Library credit in the footer ("Book data from Open Library").

*Size M.*

**Done when:** the site runs on its own domain over HTTPS, emails arrive in a real inbox, a backup has been restored once, and an error on the site shows up in Sentry.

---

## 🚩 Closed beta

Invite 10–30 readers. Ask them to import their Goodreads library on day one, and give them one easy place to send feedback: a club called "Argos feedback" works, so it also tests clubs. Record each problem as a bug file, and each wish in `FUTURE-IDEAS.md`. Stages 5–9 are built during the beta.

---

## Stage 5 — Notifications

**Needs spec.** Starting points: `FUTURE-IDEAS.md` ("Notifications can start from `ActivityEvents`", "Notifications for reading stories", "Book club organizing tools").

- [ ] An in-app bell: new follower, likes, replies, mentions, club invites, "checkpoint due in 2 days", collaborator invites on lists.
- [ ] **Quiet by default**, with an on/off setting per type. Fable gets complaints for sending too many.
- [ ] A weekly email digest, off by default. It can wait until after launch if time is short.

*Size M.*

---

## Stage 6 — Your data: export and delete

**Spec exists:** `specs/account-system.md` Phase 5.

- [ ] Export everything as a `.zip` of CSVs, with `logs.csv` in Goodreads' column layout.
- [ ] Delete account: hidden at once, fully erased after 30 days, with a choice to keep comments as "Deleted user".
- [ ] **Start with the risky check the spec names:** whether EF Core global query filters work with the Feed's `UNION ALL` query. If they don't, use the spec's fallback.

*Size M.*

---

## Stage 7 — Safety

**Needs spec** (one spec covering all of this).

- [ ] **A site admin role.** Nothing in the app is admin-only today. Identity's role tables exist but are unused. Moderation needs someone allowed to act.
- [ ] **Report** a review, writing, comment, list or user, with a reason.
- [ ] **Admin queue**: see reports, hide content, suspend an account.
- [ ] **Review-bombing rules:**
  - no ratings before a book's publish date
  - no ratings or reviews until the email is confirmed
  - flag a sudden wave of low ratings on one book
- [ ] **Blocks reach likes and comments** (`FUTURE-IDEAS.md`): a blocked reader can't like, comment on or highlight-comment the blocker's things. The 2026-10-03 security review named this as the most likely way a blocked person keeps reaching someone.
- [ ] **Community guidelines** page: what's not allowed, so moderation decisions have a basis.

*Size L.*

---

## Stage 8 — Privacy: private accounts

**Needs spec.** All design notes are in `FUTURE-IDEAS.md`, "Account-level privacy settings".

- [ ] Public or private account. Private shows shelves, progress, reviews and writings only to approved followers. Everyone else sees name and avatar only.
- [ ] Follow requests: approve or decline.
- [ ] Apply it everywhere it's listed in the notes: shelves (`LogsController`), the Readings strip, reviews, writings, likes and comments.

*Size L.* It's the last of the must-haves because it touches the most code, but it **must** ship before public launch. Strangers will be able to see everyone's shelves until it does.

---

## Stage 9 — Yearly goal and stats

**Needs spec.**

- [ ] Set a yearly goal ("read 30 books in 2027") and see progress on the home page and profile.
- [ ] Stats page: books and pages per month, top authors, genres, moods, pace, average rating, DNF rate, longest and shortest book.
- [ ] Free, and the page says so.

*Size M.* It's last before launch because it's a reason to *stay*, not a safety need. Getting it in before January 2027 matters, because that's when people set reading goals.

---

## Stage 10 — Launch checklist

- [ ] Every bug testers found is fixed or filed as P3.
- [ ] No open P1 or P2 bugs.
- [ ] `reviewer` + `security-review` pass over the whole app, not just the last change.
- [ ] **Full manual test pass.** Create `Argos/testing/README.md`: one row per area plan with its step count, the commit it was written against, the date last tested and the result. Then run `/test-plan` for every area so each plan matches the code that will launch, and fill in `_shared.md`. Run Playwright through the steps not tagged 👤, then do the 👤 steps by hand on a real phone and desktop. Every ❌ becomes a bug file. Left until now on purpose, so features that are still changing don't need testing twice. *Size M.*
- [ ] Move the API to Render's paid plan (~$7/month) so it never sleeps (`ACCOUNTS-AND-HOSTING.md` §2.3 C).
- [ ] Turn off invite-only sign-up.
- [ ] Landing page Phase 2 (`specs/landing-page.md`): live "What readers are into this week" rows, now that moderation (Stage 7) and private accounts (Stage 8) exist. *Built 2026-10-06 but switched off (`Landing:ShowcaseEnabled`).* To finish: add the private-account and moderation rules to `LandingRepository`, with tests, then switch it on. Check that the "Import from Goodreads" and "Export your data" copy (spec §7) went in when Stages 2 and 6 shipped.
- [ ] Privacy policy and terms re-read against what actually shipped (notifications, export, delete, private accounts).

---

## 🚀 Public launch

---

## Stage 11 — Right after launch

In rough order. None of these block launch.

1. **Formats, editions and series** (SPEC.md Next up #8): audiobook in hours:minutes, choosing an edition, "Book 3 of 7".
2. **Argos Wrapped / monthly wrap-up** as a shareable image, made from fixed rules, not AI. Aim for December 2026 if the launch lands before then; otherwise December 2027.
3. **Account Phase 4: 2FA, passkeys and "Continue with Google"** (`specs/account-system.md`). Passkeys added 2026-10-07: the strongest protection for readers who turn it on.
4. **Buddy reads** with page-locked comments.
5. **Mood & trope browsing**, "Popular this week", genre pages.
6. Everything else in `FUTURE-IDEAS.md`, ordered by what beta and launch users ask for most.

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
