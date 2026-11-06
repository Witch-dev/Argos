# Argos — Marketing plan

Written 2026-10-07. Planning only; nothing here is built. It follows the two launches in `ROADMAP.md`: early access (first planned as a closed beta of 10–30 invited readers; open sign-ups since 2026-10-22), then a public launch. Features that need building go into `ROADMAP.md` or a spec first.

**One-line pitch (draft):** "Letterboxd for books: log, rate, review and share what you read."
Still to decide: what makes Argos different from Goodreads and StoryGraph (candidates: a nicer social side, lists, book clubs, original-language covers and an edition picker from `FUTURE-IDEAS.md`).

---

## 0. Positioning: strengths, weaknesses and how to say them (2026-10-20)

Written while preparing to recruit beta readers from Reddit and book communities. Checked against what is built on 2026-10-20. Used by the landing page's Phase 3 (`specs/landing-page.md`).

**The idea to lead with (user, 2026-10-20):** Books and Community are two separate sides. Track your reading for yourself, share it when you feel like it: use one side, the other, or both. The social side never shows up inside Books.

### Strengths, most persuasive first

| Strength | What's true today | How to say it |
|---|---|---|
| Two separate sides | Books (journal, stats, shelves, lists) never shows anything from people you follow; Community is one click away | "Track your reading for yourself. Share it when you feel like it." |
| Moving in loses nothing | Goodreads and StoryGraph import keeps ratings, reviews, read dates, rereads and private notes; custom shelves become lists; unmatched books wait on a review screen | "Bring your whole library with you." |
| Nothing behind a paywall | Every feature is free; any future money is optional support (`FUTURE-IDEAS.md`, "Making money") | "Every feature is free. No premium plan, nothing locked." |
| Spoiler-safe clubs | Comments past your page stay hidden until you reach it | "Book clubs that never spoil the ending." |
| Friends' reading updates | The page they're on, a journey line, replies | "See where your friends are in their books." |
| Comment on one sentence | Highlight comments on reviews and writings; rare among book trackers | "Comment on the exact sentence." |
| Five languages | English, Spanish, Brazilian Portuguese, German, French; covers from the original-language edition; your languages first in search | **Don't advertise yet:** only English and Spanish have been checked by a person (2026-10-20). Until the others are, at most "Also in Spanish". |
| Free goal and stats | Yearly goal, books and pages per month, top authors, genres, moods, pace | "Your year in books, free." Most timely in late December and January. |
| Careful basics | Half stars, a guilt-free DNF shelf, audiobooks in hours and minutes, the edition you read, follow authors and hear about new books | A list, not headlines. |
| Trust | Independent, one person, no ads, data never sold, export and delete, private accounts, no ratings before a book is published, a confirmed email to rate, reports read by a person | "Made by one independent person. No ads, and your data is never sold." |
| The look | Books on a shelf, five themes, a calm reading room | Screenshots, not words. |

### Weaknesses, and what to do about each

| Weakness | What to do |
|---|---|
| Few readers yet: Community looks empty to someone arriving alone | Lead with what works alone (import, journal, stats). Invite existing groups (a club, a friend circle) together. Welcome each tester personally. |
| Open Library's data has gaps (new releases, non-English editions, missing covers) | Say so in posts. Make reporting a wrong book easy. |
| No phone app, only a site you can add to the home screen | Say "add it to your home screen"; don't call it an app on the landing page. |
| Little book discovery: no recommendation algorithm | Present it as a choice: discovery through people, not an algorithm. |
| Many features: unclear what it's for | One promise at the top (the two sides); everything else supports it. |
| New, made by one person: will it last? | Export answers it: "take everything with you, any time". |

### Claims to avoid

- **"No AI"**: the winged-dog logo was made with ChatGPT (`FUTURE-IDEAS.md`). Until it is replaced, say only "no algorithm deciding what you see" and "no AI summaries".
- Competitor names on the landing page (Goodreads and StoryGraph only as import sources). In Reddit posts, a plain comparison is fine.
- **"Five languages"**, until Portuguese, German and French have been checked by a person.
- Any number, quote or testimonial we don't have (`PRODUCT.md`, "Evidence on Hand").

### Language focus: Spanish first (decided 2026-11-03)

Most early readers come from Spanish-speaking countries, so promotion leads in Spanish and keeps English second. Reasons: grow where readers already are; Community works best when people can read each other's reviews; Spanish is one of the two checked languages, so it can be advertised.

- **One account, not one per language**, so followers and comments stay together.
- **Spanish only for now (2026-11-04).** Posts are made in Spanish alone: no English slides, no English story, no English part in the caption. The account then reads as a Spanish-language book account, which helps it grow there. Add a short English line again if English-speaking followers start to come. (Until then, ignore the English parts of the next three points.)
- **Images:** Spanish versions first. Posts with a lot of text (carousels, stories) get an English version too, posted as extra slides after the Spanish ones or as the next story.
- **Captions:** Spanish first, then a dividing line (———), then a short English version.
- **Hashtags:** 3–5 per post in total (Instagram and TikTok allow at most 5), picked from both pools, usually 3 Spanish + 1–2 English. Spanish: #bookstagramespañol #booktokespañol #libros #lectura #clubdelectura #recomendacionesdelibros. English: #bookstagram #readingjournal #bookclub.
- **Spanish that leans Latin American (2026-11-04).** *Tú* and *ustedes*, never *vosotros*. Where Spain and Latin America use different words, take the Latin American one ("link en la bio", "celular"). No slang from a single country (*chido*, *bacán*, *che*): it sounds warm to one country and odd to the rest. Readers in Spain still understand all of it.
- **Show the address (2026-11-04):** write `wingedwords.app` in full on the first and last slide of a carousel and in the caption ("Es gratis: wingedwords.app (link en la bio)"). Instagram captions aren't clickable and the site doesn't come up on Google yet, so people need to be able to type it.
- **Search words in captions (2026-11-04):** Instagram searches caption text, not only hashtags. Work 1–2 phrases that readers search for into each caption, inside a normal sentence and early if it fits: "diario de lectura", "club(es) de lectura", "registrar tus lecturas", "app para registrar libros leídos", "lista de libros por leer". Rotate them between posts; never a list of keywords. The Instagram **Name** field is searched too: "Winged Words · Diario de lectura y clubes".
- **Comment prompts with one easy answer:** ask for one word or letter ("¿Más A o más B?"), never a list of answers to type out.
- **Account (2026-11-04):** Instagram `@wingedwords.app` (instagram.com/wingedwords.app). The site links to it from the footer on every page and under the closing "Join free" on the landing page (`INSTAGRAM_URL` in Apollon `web/src/components/SiteFooter.tsx`).
- **Bio (Instagram, under 150 characters):** "Lleva el registro de tus lecturas para ti. Compártelo cuando quieras. 📚 Gratis, sin anuncios. Únete en wingedwords.app ↓" (sign-ups are open, so no more "Acceso anticipado").
- **Expect missing books:** Open Library has more gaps for Spanish editions (see Weaknesses). Say so in a post and point to reporting a wrong book.

The posts, with captions, alt text and the bio, are on the design canvas https://claude.ai/artifact/4LgPkkNVJfQfcDbPg3wpq6 (pages Español, English, Perfil). The first round was made in both languages; the "Esto o aquello" carousel (2026-11-04) is Spanish only. **Images on it:** public-domain title pages from the landing page and simple book drawings made in code (the user prefers a quiet drawing to old covers that pull the eye; only Dracula 1897 was liked among the old covers). Public-domain first-edition covers from Wikimedia Commons are also allowed: a cover can be used only if the book was published before 1931 and the image is a flat scan or photo of the cover. A photo of a book as an object belongs to its photographer unless it is CC0. Never Open Library covers of modern books.

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

### Styles chosen (2026-11-05)
From the design canvas "Share card styles" (https://claude.ai/artifact/X4Hstduggwvuz113aKEWEG), four styles. All four show the cover as a book on a shelf, with the review below on paper:
- **Cover colours** (V2a/V2b): the background is tinted with the cover's own colour, which the server already works out and saves (`CoverColorPicker`, `CoverColors` table; lightness from `web/src/lib/bookTint.ts`). Picked over the blurred cover because it costs almost nothing to draw, keeps text contrast predictable, makes small image files and already has a fallback for covers with no colour. It is the default style.
- **Three photos behind the book, fading into paper** (W1, W4, W5; built like V3, whose wall-of-pages photo wasn't free to use). All three are CC0, so no credit is required, but list them in `THIRD-PARTY-NOTICES.md` when they ship:
  - W1, old botany book: Ricky Kharawala, https://commons.wikimedia.org/wiki/File:Old_botany_book_(Unsplash).jpg
  - W4, leather-bound stack: Chris Lawton, https://commons.wikimedia.org/wiki/File:Leather_bound_books_(Unsplash).jpg
  - W5, Gladstone's Library: Michael D Beckwith, https://commons.wikimedia.org/wiki/File:Gladstone_S_Library_(187351035).jpeg

**Lists and 5 books (to design).** The four backgrounds work for every card type; only the middle changes. With cover colours, use the first book's colour (the #1 of a ranked 5 books), not a mix of all the covers. A **5 books** card ("5 libros", renamed from "Top 5" 2026-11-06) shows five covers standing on one shelf, numbered 1–5 only when the reader made it ranked, with the theme as the title ("My 5 science fiction favourites") and no review text (the feature is `specs/five-books.md`). A **list** card shows up to six covers on one or two shelves, then "+N more", the list title, its maker and the book count. One card draws up to six covers, so take them from the cover cache at the medium size.

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
3. ~~One fixed design, or a few styles to choose from?~~ Settled 2026-11-05: four styles, see "Styles chosen" above.
4. Do we want a "Made with Argos" mark on every card? (Suggested: yes, small.)
5. Final domain and short-link format, which depends on Stage 4.

Suggested size: **M**. Needs a spec (`specs/share-cards.md`) and an `argos-security` review because it exposes content to the public and logged-out visitors.

## 3. Early access (open sign-ups since 2026-10-22)
1. Anyone can sign up; no invite is needed. Ask each early reader to bring one friend, with a shared link (`specs/shareable-pages.md`) rather than an invite code.
2. Start in small reading communities: a friend group, a book club, a university or workplace reading circle. Aim for 30 people who care, not 300 who don't.
3. Collect feedback, screenshots and quotes as you go. They are reused at launch.
4. Answer every message personally.

## 4. Public launch (Stage 10)
- **Reddit** (r/books, r/Fantasy, r/suggestmeabook, and the Goodreads/StoryGraph subreddits for people unhappy with their app). Read each subreddit's self-promotion rules first. A genuine "I built this, here's why" post tends to land better than an announcement.
- **BookTok, Bookstagram, BookTube**: small creators (1k–20k followers). Offer early access and ask for honest opinions, not a paid promo. Share cards are what make this easy for them.
- **Product Hunt, Show HN, Indie Hackers**: a burst of tech-savvy users and feedback. Not the core audience.
- **A short launch story**: "I built a Letterboxd for books."
- Launch Reddit and Product Hunt in the same week, with the early-access quotes ready.

## 5. Ongoing
- **Year in books** (Wrapped) in December: the most shareable thing Argos can ship.
- **Reading challenges** (yearly goal) bring readers back and give them something to post.
- **Embeds**: "Currently reading" badges and widgets for blogs and profiles.
- **Content**: a simple blog or newsletter with curated lists and community reading stats.

## 6. Skip for now
Paid ads, press releases and a large social media presence of our own. They cost a lot and convert badly before the product is polished and the pitch is clear.

## 7. Order
1. Finish import, the phone experience, and spec + build share cards.
2. Run early access (open sign-ups) until 20–30 readers use it; collect quotes.
3. Public launch: Reddit + Product Hunt the same week, plus a handful of small creators.
4. Ship "Year in books" in December and push it.

## 8. How we'll know it's working
Keep it simple, no tracking beyond what Argos already has: sign-ups per week, share-button taps, sign-ups that came in through a shared link, and how many early-access readers log a second book in their first week. Decide the real numbers now that early access has started.
