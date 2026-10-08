# Accounts and going live: research notes

Research done 2026-10-02, before any work started. It covers two things:

1. **The account system**: what Argos does today, how Goodreads and Letterboxd do it, and what to build.
2. **Going live**: domain, email, hosting and other running costs.

Part 1 has been turned into a spec: **`specs/account-system.md`** (2026-10-02). Where the two differ, the spec wins; for example, it lets password reset work for unconfirmed emails too.

> **Prices change often.** Every price below was checked on 2026-10-02. Re-check the provider's own pricing page before signing up.

---

## Part 1: Account system

### 1.1 How it works today

| Area | What the code does |
|---|---|
| **Sign up** | `POST /api/auth/register` takes username, email and password (`Apollon/src/Argos.Api/Controllers/AuthController.cs`). You're logged in right away. |
| **Login** | Email only, not username. |
| **Session** | A JWT (a signed pass the browser sends with every request) that expires after **60 minutes**, with no way to renew it. The browser keeps it in `localStorage` (`web/src/api/authToken.ts`). |
| **Password rules** | ASP.NET Identity's defaults, since `Program.cs` doesn't change them: 6+ characters, with an uppercase letter, a lowercase letter, a digit and a symbol. Mirrored in `web/src/lib/passwordPolicy.ts`. |
| **Account data** | `ApplicationUser`: `DisplayName`, `Bio`, `AvatarUrl`, `CreatedAt`, `LastLoginAt`, `DefaultReviewVisibility`. |

### 1.2 What's missing or broken

1. **Forced logout every hour.** The token expires after 60 minutes and nothing renews it.
2. **No "forgot password".** A forgotten password means a lost account. The app can't send email at all yet.
3. **Emails are never checked.** Anyone can sign up with someone else's address.
4. **Display name and bio can't be set.** Nothing ever writes them, but the feed, comments and other screens display them, so they're always empty.
5. **You can't change username, email or password, and you can't delete your account.**
6. **Unlimited password guessing.** `CheckPasswordAsync` doesn't count failed attempts, and there's no rate limit on `/api/auth/*`.
7. **Usernames are only loosely checked.** The Identity defaults allow `@`, `+` and `.`, with no length limit and no reserved names. Someone could register `me`, which clashes with the `/api/users/me/...` routes.

### 1.3 How Goodreads and Letterboxd do it

| | Letterboxd | Goodreads |
|---|---|---|
| **Sign up** | Username, email, password (6+ characters) | Name, email, password; also Amazon, Apple or Google sign-in |
| **Email check** | Sends a confirmation link, again every time the email changes; can be re-sent from Settings | Confirms email |
| **Username changes** | Once a year (every 30 days for paid users). Old names are held back for a while before anyone else can take them. Some names are reserved. | Optional custom profile URL |
| **Password reset** | "Forgot password" link on the login page | Same |
| **Two-step login (2FA)** | Optional, using an authenticator app; no backup codes (you recover by resetting your password by email) | Handled through Amazon |
| **Staying logged in** | Weeks, until you log out | Same |
| **Export your data** | Full download of everything as CSV files from Settings, including deleted content | "Export Library" to CSV |
| **Leaving** | Deactivate (can be undone) or permanent delete; needs your password (and 2FA code if on). Deleted content is erased from servers within 30 days or more. | Delete from Settings; you choose whether your discussion posts stay up under "anonymous" |

### 1.4 What to build, in priority order

**Phase 1: fix the basics (do these first)**
- **Stay logged in.** Keep the short-lived login token, and add a long-lived **refresh token** that's saved in the database and kept in an `httpOnly` cookie (a cookie the page's JavaScript can't read, so injected scripts can't steal it). The app quietly gets a new login token when the old one expires. Saving refresh tokens also allows "log out of all devices" and cancelling sessions when the password changes.
- **Better password rules.** Drop the uppercase/digit/symbol requirements. Ask for a **12-character minimum**, allow up to 128, and allow spaces so passphrases work. Reject very common passwords using a bundled list, or optionally the Have I Been Pwned breach check. This follows NIST SP 800-63B, the US password standard. Rev. 4 actually asks for 15 characters when a password is the only login method; 12 is a reasonable middle ground for a reading site. Update `passwordPolicy.ts` to match.
- **Lock out repeated guessing.** Use `SignInManager.CheckPasswordSignInAsync` with `lockoutOnFailure: true`, and add ASP.NET's built-in rate limiter to `/api/auth/*`.
- **Username rules.** 3–20 characters; letters, digits and `_` only; case-insensitive (ASP.NET Identity already handles that); plus a reserved list (`me`, `admin`, `settings`, `api`, `login`, ...). Show "username taken" while the person types.
- **Log in with email or username.**

**Phase 2: email and recovery**
- **Set up email sending** behind a small `IEmailSender` interface: Mailpit in development, Resend in production (see Part 2).
- **"Forgot password".** Use ASP.NET Identity's built-in password reset tokens. Always reply "if that email exists, we sent a link", so strangers can't use the form to find out who has an account.
- **Email confirmation.** Let people use the app right away, the way Letterboxd does, and show a "confirm your email" banner. Require a confirmed email before password reset, and maybe before posting in clubs.

**Phase 3: account settings page**
- Edit display name and bio (the missing write path from §1.2 item 4).
- Change password (needs the current password; logs out other devices).
- Change email (sends a confirmation to the new address and a "your email was changed" notice to the old one).
- Change username at most every 30 days or once a year, with the old name held back for a while.
- "Active sessions" with "log out everywhere" (comes free with the refresh tokens from Phase 1).

**Phase 4: your data and leaving**
- **Export** reading logs, reviews, lists and writings as CSV, ideally in Goodreads' column layout so the file also works in other reading apps.
- **Import** from Goodreads CSV. This is the biggest win for getting new users, since everyone switching from Goodreads has this file. It's also listed in SPEC.md §10.
- **Delete account.** Needs the password. Offer Goodreads' choice: keep my club and discussion posts as "deleted user", or remove everything. Make the account invisible right away and erase it fully after 30 days, so a mistaken delete can be undone.

**Later / optional:** 2FA with an authenticator app, "Sign in with Google", and profile privacy (public, signed-in users only, or followers only).

---

## Part 2: Going live (costs)

Argos is three parts to host: the **React site**, the **.NET API** (already a Docker container) and the **Postgres database**. They don't have to live in the same place.

### 2.1 Domain: about $11/year

You need one so email can be sent from your own address (e.g. `noreply@argos.app`), and so the site has a real address. Compare **renewal** prices, not first-year prices.

| Seller (registrar) | .com per year (renewal) | .app per year (renewal) | Notes |
|---|---|---|---|
| **Cloudflare** | ~$10.46 | ~$14.20 | Sells at cost with no markup. DNS must be managed by Cloudflare (good and free anyway). |
| **Porkbun** | ~$11.08 | ~$14.93 | Simplest dashboard; free privacy protection, which hides your name and address from the public owner lookup. |
| Namecheap | ~$18.48 | ~$23.18 | Cheap first year, expensive after that. |
| GoDaddy | Higher still | — | Avoid: high renewals and lots of upselling. |

- **Pick Cloudflare** if the frontend will be on Cloudflare Pages (domain, DNS and site in one place); otherwise **Porkbun**.
- **Decided 2026-10-08:** `wingedwords.app` at **Porkbun**, DNS kept at Porkbun. Keeping the domain at a different company from the hosting means one account problem can't take down everything, and it costs about $0.73/year more than Cloudflare. Everything else is hosted on **Render** (site, API and database) to keep it to two accounts. This replaces the Cloudflare Pages + Neon plan in §2.3: Pages only accepts the bare `wingedwords.app` address when Cloudflare runs the DNS, and one host is simpler than three.
- **.com** is cheapest; **.app** fits a web app and only works over HTTPS (secure connections), which is fine. **Skip .io and .ai** ($40–80+ a year). Check renewal prices on unusual endings like `.club`.
- Turn on **auto-renew**. Don't buy extras (paid email inboxes, website builders, "SSL certificates").
- Use your own subdomains: the site at `argos.app`, the API at `api.argos.app`, not `*.onrender.com`. The refresh-token cookie (§1.4) works much more simply when the site and API share a domain.

### 2.2 Email sending: free

- **Development:** **Mailpit**, a small program added to docker-compose. It acts as a fake mail server: it catches every email the app "sends" and shows it at `localhost:8025`. Nothing actually goes out.
- **Production:** account emails are only a few per user, so a free plan covers hundreds of active users.

| Provider | Free amount | Notes |
|---|---|---|
| **Resend** (recommended) | 3,000/month | Permanent free plan; probably also a daily cap of about 100 |
| Brevo | 300/day (~9,000/month) | Largest permanent free plan |
| Amazon SES | 3,000/month for the first 12 months | Then ~$0.10 per 1,000; harder to set up |
| Postmark | 100/month | Only enough to try it out |
| SendGrid | None | Free plan dropped in 2025; 60-day trial, then $19.95/month |

You prove you own the domain by adding a few records in its DNS settings. Free stopgap for testing only: sending through Gmail with an app password (about 500/day).

### 2.3 Hosting: $0 to start, about $5–7/month later

**A. Free: for testing with a few friends**
| Part | Where | Cost |
|---|---|---|
| React site | Render static site | Free |
| API | Render free plan | Free, but it **goes to sleep after 15 minutes of no visitors**; waking takes roughly 30–60 seconds, and scheduled work like the news-feed refresh stops while it's asleep |
| Database | Render Postgres free plan | Free, but **deleted after 30 days**: only for a first test, before real data |

**B. Your own small server: about €4.49/month**
A Hetzner CX22 VPS (2 CPUs, 4 GB memory, 40 GB storage) running the existing `docker-compose.yml` almost unchanged, plus Caddy for automatic HTTPS. Cheapest option that never sleeps, but you're the admin: security updates, backups, fixing it if it goes down.

**C. Managed, paid: about $7/month**
Same as A, but the API on Render's paid Starter plan (~$7/month) so it never sleeps, and the database on Render Postgres's paid plan (~$6–7/month), which keeps the data and backs it up. About $13–14/month in all.

*Before 2026-10-08 the plan was Cloudflare Pages + Render + Neon (Neon's free database never expires). Switched to Render for everything to keep one host; see §2.1.*

**Avoid:** Railway and Fly.io no longer have free plans (pay-as-you-go). (Render's free database is deleted after 30 days, so the database needs Render's paid plan before real readers join.) Supabase's free database pauses after about a week with no activity.

**Decided:** start with **A** for a first test, then move to **C** before real readers join (two settings changes on Render, not a migration). Pick **B** instead if you'd rather pay less and enjoy managing a server.

**Deploying (decided 2026-10-08):** everything lives on Render, and nothing deploys until CI passes. Each Render service (site and API) is set to auto-deploy "After CI checks pass", so a push to `main` goes live only once the GitHub Actions tests are green.

### 2.4 Everything else

**Already free, nothing to do**
| What | Why it's free |
|---|---|
| Book data and covers | Open Library is free; the caching layer keeps request counts low |
| News feed | Public RSS feeds |
| Avatars | Fixed set of preset images, no storage needed |
| Common-password check | Have I Been Pwned password check is free |

**Free extras worth adding**
| What | Free option | Why |
|---|---|---|
| Database backups | Included in Render Postgres's paid plan | Don't lose everyone's reviews if the database breaks |
| Receiving email (`hello@wingedwords.app`) | Porkbun's free email forwarding to Gmail (Cloudflare Email Routing needs Cloudflare DNS) | Resend only *sends* email |
| Error tracking | Sentry free plan | Tells you when something crashes for a user |
| Uptime alerts | UptimeRobot free plan | Emails you if the site goes down |
| Automatic deploys | GitHub Actions (free minutes per month) runs the tests; Render deploys only after they pass | A red build never reaches readers |

**Only if you decide to later**
| What | Cost |
|---|---|
| Users upload their own images | Cloudflare R2: free up to 10 GB, then a few cents per GB |
| Bigger database | A larger Render Postgres plan; check pricing at that point |
| Phone apps in the App Store / Play Store | Apple $99/year, Google $25 one-time; not needed, the website works on phones |
| Charging users (a "Pro" plan) | Stripe: no monthly fee, about 3% + $0.30 per payment |

**Not a cost, but needed:** a short **privacy policy** (what you store, why, how to delete it); free templates are fine at this size. With European users, GDPR also expects the data export and account deletion from Phase 4. This isn't legal advice.

### 2.5 Total

| Item | Cost |
|---|---|
| Domain | ~$1/month (~$11/year) |
| Email (Resend) | $0 |
| Hosting | $0 while testing, then ~$5–7 |
| **Total** | **about $1/month now, about $6–8/month with real users** |

### 2.6 Security setup to do when hosting

Left out of `specs/app-hardening.md` because each depends on how the app is hosted. None costs money.

- **HTTPS and HSTS at the proxy.** Today compose serves plain HTTP, so passwords and tokens cross the network unencrypted; fine on your own computer only. Caddy (or the host's proxy) should serve HTTPS and send HSTS, the header that tells browsers to always use HTTPS. The API no longer redirects to HTTPS itself.
- **Real client IPs for rate limits (`ForwardedHeaders`).** Behind a proxy, every request looks like it comes from the proxy, so all users would share one rate-limit bucket: 10 logins a minute for the whole site, and one person could block everyone's logins. Add `UseForwardedHeaders` with `KnownProxies`/`KnownNetworks` set to the proxy. Without that list, anyone can fake `X-Forwarded-For` and skip the limits. Docker Desktop may already make all browser clients share one IP in the local compose stack. Requests with no client IP at all (a Unix socket behind a proxy) share one "unknown" bucket too.
- **Login cookies instead of `localStorage`.** Once the API and the web app are on the same site, move the tokens into httpOnly cookies, which page scripts can't read, so a script injected into the page can't steal them.
- **Account lockout abuse.** Five wrong passwords lock an account for 15 minutes, so someone who knows a reader's email can keep them locked out. Accepted for the beta. If it happens, count failures per account *and* IP, or add a CAPTCHA after a few failures.

---

## Sources

**Accounts**
- [Letterboxd FAQ](https://letterboxd.com/about/faq/)
- [Letterboxd: two-factor authentication](https://letterboxd.zendesk.com/hc/en-us/articles/15179119712015-Does-Letterboxd-have-two-factor-authentication-for-increased-account-security)
- [Letterboxd: validating your email](https://letterboxd.zendesk.com/hc/en-us/articles/15179109644943-How-do-I-validate-my-email-address)
- [Letterboxd API docs (account deactivation)](https://api-docs.letterboxd.com/)
- [Book Riot: how to delete your Goodreads account](https://ohayou.bookriot.com/delete-goodreads-account/)
- [Goodreads: dropping Facebook sign-in](https://www.goodreads.com/topic/show/22625277-goodreads-will-no-longer-support-signing-in-with-facebook?page=1)
- [Goodreads export guide](https://www.thebookfolio.com/blog/how-to-export-goodreads-library)
- [NIST SP 800-63B rev. 4 summary (Enzoic)](https://www.enzoic.com/blog/nist-sp-800-63b-rev4/)
- [NIST password guidelines explained (Netwrix)](https://netwrix.com/en/resources/blog/nist-password-guidelines/)

**Email**
- [Best SendGrid alternatives 2026 (Dreamlit)](https://dreamlit.ai/blog/best-sendgrid-alternatives)
- [Best transactional email services 2026 (Sequenzy)](https://www.sequenzy.com/blog/best-transactional-email-services)
- [Postmark alternatives (Brevo)](https://www.brevo.com/blog/postmark-alternatives/)

**Domains**
- [Cloudflare vs Porkbun vs Namecheap: cheapest in 2026?](https://elvisonunwa.com/vs/cloudflare-vs-porkbun-vs-namecheap)
- [Namecheap vs Porkbun vs Cloudflare vs GoDaddy for indie hackers](https://devtoolpicks.com/blog/namecheap-vs-porkbun-vs-cloudflare-registrar-vs-godaddy-indie-hackers-2026)
- [.app domain price comparison](https://tldspy.com/tld/app)

**Hosting**
- [Render: platforms with a real free tier in 2026](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
- [Free PostgreSQL hosting: every real option (2026)](https://swyftstack.com/blog/free-postgresql-hosting)
- [Railway vs Render vs Fly.io (2026)](https://techsy.io/en/blog/railway-vs-render-vs-fly-io)
- [Hetzner pricing 2026](https://agentdeals.dev/hetzner-pricing-2026)
