# Feature Spec — Share cards

*Added 2026-11-09, from the card designs chosen with the user 2026-11-05 to 2026-11-06 (MARKETING.md §2, "Styles chosen") and the cost question asked the same week: "our budget in the API and database is not much".*

Builds on `specs/shareable-pages.md` (the Share button, link previews, `/es` share links), `specs/five-books.md` (5 books lists; its share card is this spec) and `specs/book-lists-improvements.md` (lists, *Ranked*). Read those first. The designs are on the canvas "Share cards, final" (https://claude.ai/artifact/BSoEPAMckFsyKNSfVnFj9G).

## 1. Problem

A reader finishes a book, writes a review, makes a list or a 5 books, and wants to post it on Instagram Stories, TikTok or WhatsApp Status. Today the Share button (`ShareButton.tsx`) shares a **link**, which shows a preview in chats (`ShareCardService`) but gives Instagram and TikTok nothing to post. Readers who want a picture take a screenshot of the site, which looks like a screenshot.

A share card is a picture made for posting: the book or books, the reader's words, and the Winged Words address. Every one a reader posts brings the site to people who don't know it yet.

## 2. Decisions

### 2.1 Decided with the user

1. **Four card types:** review, progress, list and 5 books (2026-11-06). The reader profile card and the Year in books card are for later (FUTURE-IDEAS.md, "More share cards").
2. **Three backgrounds, all photos:** Botany (old botany book), Leather (leather-bound stack) and Library (Gladstone's Library). All three are CC0 (credits in MARKETING.md §2, to be listed in `THIRD-PARTY-NOTICES.md`). The cover colours style was dropped 2026-11-06.
3. **Arrangements:**
   - **Lists:** A real shelf, D reading pile, E bookshop display.
   - **5 books:** A shelf, B flat lay, C ring. All five covers are the same size; numbers show only when the list is ranked.
4. **Review and progress cards:** the book stands on a shelf, the photo behind it fades into paper behind the text. **List and 5 books cards:** the photo fills the card, the books are centred, and the text sits on a paper panel at the bottom.
5. **The progress card shows the Winged Words address** so people can follow along.
6. **Cheap to run:** the reader's own phone or computer draws the card. The API and the database do nothing new (§2.2.1).

### 2.2 Decided while writing the spec (checked with the user 2026-11-12; kept as written, with the additions in §2.3)

1. **Drawn in the browser, never on the server.** Drawing a 1080×1920 picture on the server would use about 30–60 MB of memory per card with SkiaSharp, against an API limit of 512 MB that has already been hit (DEPLOY.md, "Incidents on the live site"). It would also need file storage, which the app doesn't have. In the browser it costs the server nothing: the data is already on the page, and the photos are static files from the web host.
2. **Drawn with the browser's own canvas (Canvas 2D), no new package.** Libraries that photograph HTML (`html-to-image` and similar) rely on an SVG trick that iPhone Safari handles badly: missing images on the first try, fonts not ready. Drawing with Canvas 2D is more code (text wrapping, rotated covers, shadows), but it behaves the same on every phone and adds no dependency to check. The canvas mockups give the exact positions to copy.
3. **One size first: 9:16, 1080×1920** (Stories, TikTok, WhatsApp Status). 4:5 and 1:1 later, only if readers ask.
4. **No QR code** at first. The address is written on the card.
5. **The address on the card is the reader's profile, `wingedwords.app/u/<username>`**, on every card type. Reviews and lists have long ids (GUIDs) that nobody can type, and short links would need a new table. A visitor finds the review or list from the profile. Short links (`/r/abc12`) are a later option.
6. **Who can make one:**
   - **Review and progress:** only the reader who wrote it.
   - **List and 5 books:** anyone who can see the list. A friend can share it, and the card names the maker.
   - If the item or the account isn't public, the sheet says so in one line before sharing ("People who visit the address won't see this review"). Sharing is still allowed: it's the reader's own words.
7. **What the reader picks:** the background (3) and, for lists and 5 books, the arrangement (3). The last choices are remembered in `localStorage`. No colours, fonts or text editing.
8. **Fixed limits so a layout never breaks:**
   - **Review:** about 220 characters of the review, cut at a word with "…". A review with spoilers marked shows no text, only "Contains spoilers".
   - **List:** the first 10 books for the shelf, 8 for the pile, 6 for the display, plus "+N more".
   - **5 books:** offered only with all five books (`specs/five-books.md` §2.1 item 6).
   - **Titles:** wrapped to 2 lines, then "…".
9. **Covers:** the large Open Library cover (`largeCoverUrl`). A book with no cover gets a plain drawn cover (cloth colour, title, author) like the mockups' `drawn_cover`. The canvas can only use an outside image if Open Library allows it (CORS), so **Phase 0 checks that first** (§3.3).
10. **Sharing:**
    - **On a phone:** the share sheet with the image file (`navigator.share({ files })`), so it goes straight to Instagram or WhatsApp.
    - **On a computer, or a phone that can't share files:** a "Save image" download.
    - The PNG is named `winged-words-<type>.png`.
11. **Text on the card follows the site's language** (all five locales), but the book titles stay as the reader sees them on the site.
12. **No tracking:** nothing is sent to the server when a card is made or shared. A count can come later if it's worth it.

### 2.3 Added when checking §2.2 (2026-11-12)

1. **Profile address, not the mockup's short link.** The mockups show `wingedwords.app/r/8f3k2`; the cards print `wingedwords.app/u/<username>` (§2.2.5).
2. **Inline spoilers (`||…||` inside the review text):** the excerpt is cut before the first one, then "…". If too little text comes before it (under about 40 characters), the card shows "Contains spoilers" as for the whole-review flag.
3. **The detail line under the author** ("412 pages · read in 9 days" in the mockup): only the parts the data has, no genre. Days read only when the log has a start date. No line when there's nothing to show.
4. **iPhone Safari:** Phase 0 used WebKit through Playwright as a stand-in. A real iPhone is checked in Verification; if covers fail there, the pass-through endpoint (§3.3 step 3) is added then.

## 3. Design

### 3.1 Data

Nothing new. No migration, no endpoint, no change to SPEC.md §7.

The card uses what the page already loaded:
- **Review page:** the review, the book, the rating and the finished date.
- **Progress card:** the log's current page, total pages and the latest progress note.
- **List page:** the title, description, item count, likes, the first 10 books and the maker.

If a page doesn't have enough books loaded, the card asks the existing list endpoint for the first page. That's one ordinary request.

### 3.2 Static files

- `web/public/share-cards/botany.jpg`, `leather.jpg`, `library.jpg`: cropped and resized to 1080×1920, sepia already applied, JPEG about 150–250 KB each. They're fetched only when the share sheet opens.
- Their credits go in `THIRD-PARTY-NOTICES.md`.

### 3.3 Frontend

**Phase 0, the cover check (first, before anything else).**
1. Load a `covers.openlibrary.org` large cover with `crossOrigin = 'anonymous'`, draw it on a canvas and call `toBlob`. Do this on Chrome, Firefox and iPhone Safari, and include a redirect to `archive.org`.
2. If it works, use the covers directly.
3. If it doesn't, add one small endpoint that passes a cover file through: `GET /api/covers/{coverId}-L.jpg`, only for Open Library cover ids and only from `covers.openlibrary.org`, with a short cache header. It doesn't decode the image or keep it in memory, so it costs a little bandwidth only. It needs `argos-security` (outside call).
4. Write the result in this section.

**Result (2026-11-12): covers work directly, no endpoint needed.** Every response in the chain sends `Access-Control-Allow-Origin` (`covers.openlibrary.org` → `archive.org/download` → `iaNNN.us.archive.org`). Tested with Playwright from a local page: three covers (two by id, which redirect twice through archive.org, one by ISBN, which doesn't), `crossOrigin = 'anonymous'`, `drawImage`, `getImageData` and `toBlob('image/png')`. All three passed on Chromium 153, Firefox 155 and WebKit 26.6. A control image loaded without `crossOrigin` failed with `SecurityError` on all three, so the test can detect a failure. Covers come in uneven shapes (350×500, 465×475, 265×475), so `drawCover` crops to fill its frame. A real iPhone is still checked in Verification (§2.3.4).

**The pieces:**
- **`web/src/shareCards/draw.ts`** holds the drawing helpers:
  - `drawPhoto` (fade or full),
  - `drawCover` (with the spine shade and the page block),
  - `drawSpine`, `drawLying`, `drawShelf`, `drawBookend`,
  - `drawPaperPanel`, `wrapText`, `drawStars`, `drawProgressBar`, `drawFooter`.
  
  All sizes are in card pixels (1080×1920), taken from the mockups (which are 540×960, so double them).
- **One file per card type:** `reviewCard.ts`, `progressCard.ts`, `listCard.ts` (3 arrangements), `fiveBooksCard.ts` (3 arrangements). Each takes plain data and returns a canvas.
- **Before drawing,** wait for `document.fonts.load` of Literata 600, Literata italic and Public Sans 400/600, and for every image. An image that fails gets the drawn cover, never a blank space.
- **`ShareCardSheet`** is a dialog with:
  - the card preview (the canvas, scaled down);
  - the background picker (3 thumbnails);
  - for lists and 5 books, the arrangement picker;
  - "Share image" (phone) or "Save image";
  - the privacy line from §2.2.6.
  
  It shows "Making your card…" while drawing. It's keyboard reachable, with focus returned on close. The pickers are radio buttons with labels.
- **Where the "Share as image" button goes:**
  - next to Share on `ReviewDetailPage` (owner) and `ListDetailPage` (anyone who can see it);
  - for 5 books, on its list page once `specs/five-books.md` Phase 3 is built;
  - for progress, in `ProgressUpdateModal` after saving ("Share your progress"), and on the reader's own currently-reading book.
- **Translations:** every label in all five locales, including the text drawn on the card: "Currently reading", "Page X of Y", "+N more", "A list by …", "Contains spoilers", "Read the full review on", "Follow along on".

## 4. Tasks

### Phase 0 — Cover check · *size S*
- [x] The CORS test in §3.3 on Chrome, Firefox and iPhone Safari; write the result here. (Passed on Chromium, Firefox and WebKit; real iPhone in Verification.)
- [x] ~~Only if it fails: the cover pass-through endpoint, tests (other hosts refused, bad ids refused), `argos-security`.~~ Not needed.

### Phase 1 — Review card and the shared pieces (browser) · *size M*

#### Frontend
- [x] The three background photos in `web/public/share-cards/`, sized and compressed; credits in `THIRD-PARTY-NOTICES.md`. (Kept at 1600×1068 with the mockups' sepia(.25) saturate(.9) baked in, not pre-cropped to 1080×1920: the review card and the list cards crop the photo differently, so the canvas crops it. 194/200/278 KB, plus ~5 KB `-thumb.jpg` files for the picker.)
- [x] `draw.ts` helpers, font and image loading, the drawn-cover fallback. (Only the helpers the review card uses; `drawSpine`, `drawLying`, `drawBookend`, `drawPaperPanel` and `drawProgressBar` come with Phases 2–4.)
- [x] `reviewCard.ts` (spoilers, long text, no rating, no cover). Card data from the review, the owner's log (pages, start date) and the book (authors) in `reviewCardData.ts`.
- [x] `ShareCardSheet`: preview, background picker, share file / save image, the privacy line, remembered choice. The PNG is made as soon as the card is drawn, so "Share image" calls `navigator.share` straight from the tap (Safari refuses it after a wait).
- [x] Button on `ReviewDetailPage` for the owner (`ShareReviewImageButton`).
- [x] Translations in all five locales (`shareCards.json`).
- [x] Vitest: text cut at a word, spoilers hide the text, the button only for the owner, share-sheet vs download choice. Canvas drawing itself isn't unit-tested (jsdom has no canvas); a pure layout function (positions from data) is.
- [x] `web-design` screenshot round of the three backgrounds against the canvas mockups, then `reviewer`. (Two critique rounds, then a fresh full review: ship. `reviewer`: three low findings, fixed.)

**Built notes (2026-11-12):**
- **Titles and the wordmark are Literata 700, not 600.** A canvas can't set Literata's optical-size axis, so at card size the browser picks the thin display cut, which looks a weight lighter than the mockup's 600. 700 matches it by eye. The later cards should do the same.
- **Instagram Stories zones (from the design review, not changed):** the footer address (y≈1730–1800) and the top of the cover (y=144) sit where Stories draws its own top and bottom bars. The mockups have the same layout. If posted cards show the address covered, raise the footer to about y 1650.

### Phase 2 — Progress card · *size S*
- [x] `progressCard.ts`: bar, page X of Y, percentage, optional note, profile address. (The place comes from `progressText`, so a reading counted in chapters or an audiobook shows "Chapter 6 of 24" or "4 h 10 m of 12 h". Card words in `progressCardData.ts`; the note is cut like the review excerpt.)
- [x] "Share your progress" after saving in `ProgressUpdateModal`, and on the reader's own currently-reading book; five locales; Vitest for the percentage (no total pages → page number only, no bar). (`ShareProgressImageButton`; `web-design` critique round, then `reviewer`: no bugs, four minor findings fixed.)

**Built notes (2026-11-12):**
- **Where the button is:** a link next to "Edit details" in `QuickLog`, which covers both the progress dialog's quick update ("+10 pages" then share) and the book's own page while reading it. After a full-form save of a book still being read, the dialog stays open on a "Progress saved" step with the book, its place, "Share your progress" and "Done". Every way out of that step (Done, Close, Escape, outside click) counts as saved, so club and buddy-read pages still refresh. A save that finishes the book closes as before. `LogForm`'s `onSaved` now passes the saved log.
- **Shared pieces moved into `draw.ts`:** `drawPerson`, `drawProgressBar`, `newCardCanvas`, `TITLE_FONT` and `QUOTE_FONT`. The review card draws exactly as before.
- **Privacy line:** three cases. The reading is "only me": visitors won't see the book. It's followers-only: only followers will. The account is private: only followers will see the progress.
- **"CURRENTLY READING" is a small-caps kicker,** which DESIGN.md otherwise refuses. Kept because it's in the approved mockup and works as a status label, not decoration.
- **Typed apostrophes inside a word curl** (can't → can’t) in review excerpts and progress notes, to match the card's curly quote marks.
- **The Library photo behind the label and title** is busier than Botany or Leather. The fade matches the mockup, so it was left alone; look at it again if posted cards read poorly.

### Phase 3 — List card · *size S–M*
- [x] `listCard.ts` with shelf, pile and display; "+N more"; short lists (fewer books than the arrangement holds) still look full. (Card words in `listCardData.ts`; new `draw.ts` pieces: `drawSpine`, `drawLying`, `drawPaperPanel`, `drawTag`, `bookColours`.)
- [x] Arrangement picker; button on `ListDetailPage`; five locales; Vitest for the book counts per arrangement and "+N more". (`ShareListImageButton`; `web-design` critique round twice, then ship; `reviewer`: no bugs, two minor findings fixed.)

**Built notes (2026-11-12):**
- **Who and which lists:** the button shows for anyone who can see a book list, visitors too, next to Share. Author lists get none (no covers), nor an empty list. The privacy line has three cases: a private list (visitors won't see it), an unlisted one (it won't show on the maker's profile, which is the card's address), and the maker's own private account.
- **Books and order:** the list's own order, vote order on an open list. The address is the maker's profile whoever shares it; "A list by Ana" names them. Counts are "23 books · 41 likes", likes left out at 0.
- **Shelf (A):** the first book face out, then spines, the last upright one leaning, and from the eighth book a small lying stack with the "+N more" slip on it, as in the mockup. Three or fewer books all stand face out. Spines and lying books take their cover's average colour (read from the smaller cover), cloth colour without one, and ink or cream text by contrast ratio. The surname is dropped from a spine rather than cutting the title.
- **Bigger than the mockup:** after the first critique the shelf was scaled up (cover 240×360, spines 400–480 tall, titles 28–30px) because the mockup's spine text was about 8px on a phone. Short piles lie thicker and scale up; a one-row display is 1.25× (1.5× for one book).
- **List-card shelves are "edged"** (lit top edge, front lip, closer contact shadow) so they sit in the full-card photo; the review and progress shelves are unchanged. `drawCover`'s page block is now proportional (still 12px on the review card's cover, ~8px on list covers).
- **The arrangement is remembered** per card type (`argos_shareCardListArrangement`); the picker's names come from `shareCards.arrangements`, which Phase 4 extends with flat lay and ring.
- **The footer sits inside the paper panel** (its foot at y 1800), via `drawFooter`'s new `top`.

### Phase 4 — 5 books card · *size S* (after `specs/five-books.md` Phase 3)
- [ ] `fiveBooksCard.ts` with shelf, flat lay and ring; numbers only when ranked; offered only when complete.
- [ ] Five locales; Vitest for ranked vs not and the incomplete case.

### Verification
- [x] `browser-check`: make each card type on each background and download it. Check that the PNG is 1080×1920, the covers appear, and the fonts are Literata and Public Sans, not the fallbacks. (2026-11-12, Chromium at 1280 wide: 69 PNGs (review, progress from the book page and from the "Progress saved" step, lists as maker and visitor in all three arrangements), all 1080×1920, real covers through the archive.org redirects, Literata 700/italic and Public Sans loaded, no console errors. One fix: a cloth cover broke a long word mid-word ("cancion/ero"); `drawClothCover` now shrinks the title until its longest word fits. The 5 books card is checked when Phase 4 is built.)
- [ ] On a real iPhone and a real Android phone: the covers appear on the card (Phase 0 only tested WebKit), "Share image" opens the share sheet with the picture, and Instagram Stories accepts it.
- [x] A private review: the privacy line shows, and sharing still works. (2026-11-12, in the same `browser-check`.)
- [ ] The API's memory on Render doesn't change while cards are made (it shouldn't: nothing reaches it, unless Phase 0 needed the cover pass-through).
