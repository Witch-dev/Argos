# Argos — Marketing plan

Written 2026-10-07. Planning only; nothing here is built. It follows the two launches in `ROADMAP.md`: a closed beta (10–30 invited readers), then a public launch. Features that need building go into `ROADMAP.md` or a spec first.

**One-line pitch (draft):** "Letterboxd for books: log, rate, review and share what you read."
Still to decide: what makes Argos different from Goodreads and StoryGraph (candidates: a nicer social side, lists, book clubs, original-language covers and an edition picker from `FUTURE-IDEAS.md`).

---

## 1. What to have before promoting anything

| Item | Why | Roadmap link |
|---|---|---|
| Goodreads / StoryGraph import | Removes the main reason people don't switch: losing their history. Headline it: "Bring your shelves in 2 minutes." | Stage 2 |
| Share cards and link previews (section 2) | Every share becomes an ad. | needs spec |
| Public pages that search engines can read | Lists like "Best slow-burn fantasy" bring search traffic over time, the cheapest long-term channel. Decide on purpose which pages are public. | Stage 8 (privacy) |
| Good on a phone | Most sharing and logging happens on phones. | Stage 3 |
| A clear pitch and a short demo (screenshots or a 30-second screen recording) | Needed for every channel below. | — |

## 2. Share cards

### The goal
A reader finishes a book, rates it or reviews it, taps **Share**, and gets a good-looking card for Instagram, TikTok, WhatsApp and so on. Anyone who sees it can get to the full review on Argos.

### What the platforms allow (the limits shape the design)

| Where | Clickable link? | What works |
|---|---|---|
| **Instagram feed post / Reel** | No (captions are not clickable) | Post the card image; the link goes in the bio ("link in bio") or in the card itself as a short URL / QR code. |
| **Instagram Stories** | Yes, with a link sticker | Best fit. A 9:16 card plus a link sticker. |
| **TikTok** | No in captions; link in bio only | Photo post or a short video using the card; short URL on the card. |
| **YouTube** | Descriptions are clickable on long videos; Shorts descriptions mostly are not | Fits creators who review books in videos: they paste the Argos link in the description. Community posts can hold links. |
| **WhatsApp, Telegram, Discord, Slack, X, Facebook, LinkedIn, Reddit, iMessage** | Yes | Pasting the link shows a preview card automatically (see "Link previews" below). |

So there are **two things to build**, and they do different jobs:

1. **A card image the reader posts themselves** (Instagram, TikTok, Stories). It can't be clicked, so it carries a short readable URL (`argos.app/r/abc123`, final domain to be decided) and a small QR code for people viewing on another screen. On a phone, the share button opens the phone's own share sheet (the browser's Web Share feature) so the reader can pick Instagram, TikTok or "Save image". Inside Instagram Stories the reader adds the link sticker themselves.
2. **A link preview** for places where links are clickable. When someone pastes `argos.app/r/abc123` into WhatsApp, Discord or X, the app fetches the page and shows the same card as a preview with a title and description. Tapping it opens the review.

### What goes on a card
- **Finished a book:** cover, title, author, star rating, "Finished 12 Oct", reader's name and avatar.
- **Review:** cover, rating, the first lines of the review, "Read the full review on Argos".
- **Progress:** cover, a progress bar ("Page 212 of 384, 55%"), optional one-line note. Same visual idea as a Stories "now reading" sticker.
- **List:** up to 4–6 covers in a grid with the list title.
- **Year in books** (later, for the Wrapped idea): the biggest shareable card Argos can make.

Sizes to offer: 9:16 (Stories/TikTok/Shorts, 1080×1920), 4:5 (Instagram feed, 1080×1350), 1:1 (everywhere, 1080×1080), and 1.91:1 (link preview, 1200×630). Fit with the 5 themes: let the reader choose light, dark or a theme colour for the card.

### How it could be built (to confirm in a spec)
- **Link previews need a server.** The React site is drawn in the browser, but the apps that fetch a link preview don't run JavaScript, so they would see an empty page. A small backend endpoint like `/r/{id}` returns a plain page with the preview tags (title, description, image) and sends real visitors on to the normal review page. This is one controller, no new service.
- **Card images are made on the server** by one endpoint (e.g. `/r/{id}/card.png?size=story`), using an image library in .NET (SkiaSharp or ImageSharp). The same endpoint feeds both the preview and the "Save/Share image" button, so there is one design to maintain. Draw them from the data already stored, and cache the results.
- **Share button in the app**: on phones it calls the Web Share feature with the image file; on a computer it offers Download image and Copy link.
- **Covers come from Open Library** through the existing `OpenLibraryClient` and cache only. Do not fetch covers from anywhere else.
- **Short links** use the review/log/list id, not a title, so they stay stable if a book is renamed.

### Privacy rules (must be in the spec)
- A card or preview exists **only for things the reader has made public**. A private or followers-only review returns "not found" for the image and the link.
- Changing a review to private later must stop the card and the preview from working. Cached images need to expire or be checked.
- Respect blocks: a blocked reader gets no extra access through a shared link.
- Progress cards never include private notes (the new private notes on logs stay private).
- Reviews can contain spoilers: show only the first lines on a card, and honour a "spoiler" flag if the review has one.
- Public sharing should be a button the reader presses, never automatic.

### Questions to settle in the spec
1. Does a logged-out visitor see the whole review when they tap the link, or a short version with "Sign up to read more"? (The second helps growth; the first is friendlier.)
2. Which items can be shared first? Suggested start: finished book + review, then progress, then lists.
3. One fixed design, or a few styles to choose from?
4. Do we want a "Made with Argos" mark on every card? (Suggested: yes, small.)
5. Final domain and short-link format, which depends on Stage 4.

Suggested size: **M**. Needs a spec (`specs/share-cards.md`) and an `argos-security` review because it exposes content to the public and logged-out visitors.

## 3. Closed beta (Stage 4 onward)
1. Invite readers one at a time. The invite links (5 per reader) already exist; ask each beta reader to invite one friend.
2. Start in small reading communities: a friend group, a book club, a university or workplace reading circle. Aim for 30 people who care, not 300 who don't.
3. Collect feedback, screenshots and quotes as you go. They are reused at launch.
4. Answer every message personally.

## 4. Public launch (Stage 10)
- **Reddit** (r/books, r/Fantasy, r/suggestmeabook, and the Goodreads/StoryGraph subreddits for people unhappy with their app). Read each subreddit's self-promotion rules first. A genuine "I built this, here's why" post tends to land better than an announcement.
- **BookTok, Bookstagram, BookTube**: small creators (1k–20k followers). Offer early access and ask for honest opinions, not a paid promo. Share cards are what make this easy for them.
- **Product Hunt, Show HN, Indie Hackers**: a burst of tech-savvy users and feedback. Not the core audience.
- **A short launch story**: "I built a Letterboxd for books."
- Launch Reddit and Product Hunt in the same week, with the beta quotes ready.

## 5. Ongoing
- **Year in books** (Wrapped) in December: the most shareable thing Argos can ship.
- **Reading challenges** (yearly goal) bring readers back and give them something to post.
- **Embeds**: "Currently reading" badges and widgets for blogs and profiles.
- **Content**: a simple blog or newsletter with curated lists and community reading stats.

## 6. Skip for now
Paid ads, press releases and a large social media presence of our own. They cost a lot and convert badly before the product is polished and the pitch is clear.

## 7. Order
1. Finish import, the phone experience, and spec + build share cards.
2. Run the closed beta with 20–30 readers; collect quotes.
3. Public launch: Reddit + Product Hunt the same week, plus a handful of small creators.
4. Ship "Year in books" in December and push it.

## 8. How we'll know it's working
Keep it simple, no tracking beyond what Argos already has: sign-ups per week, share-button taps, sign-ups that came in through an invite or a shared link, and how many beta readers log a second book in their first week. Decide the real numbers when the beta starts.
