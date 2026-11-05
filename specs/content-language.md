# Feature Spec — Reviews and writings in the reader's language first

**Status:** planned 2026-11-04. Phase 1 built 2026-11-04. Phase 2 built 2026-11-05. Three phases: Phase 1 (server: language on reviews and writings, backfill), M. Phase 2 (server: "Languages I read" and sorting), M. Phase 3 (browser), M.

## 1. Problem

Almost every reader so far is from Latin America, so nearly every review and writing is in Spanish. Promotion leads in Spanish but also reaches English speakers (`MARKETING.md`). An English reader sees the menus in English, but the Reviews and Writings sections and a book's reviews would be almost all Spanish.

Today a review or writing doesn't record what language it's written in. Readers have a site language (`ApplicationUser.PreferredLanguage`), and clubs already have a language (`Club.Language`), but the text itself has no label.

## 2. Decisions (agreed with the user 2026-11-04)

- **Every review and writing gets a language label.** The server guesses it when the text is saved. When the text is too short to tell, it uses the writer's site language. The writer can change it.
- **The reader's languages come first, and the rest is still shown.** Nothing is hidden. Below the reader's languages comes a section titled "In other languages", and each item there shows its language. Hiding them would make every book page look empty to the first English readers.
- **"Languages I read" setting.** It starts as the site language, and the reader can tick more. A reader who ticks Spanish and English sees both together, as today.
- **Which lists sort by language:**
  - **Sorted:** the Reviews section (Recent, Popular), the Writings section (Recent, Popular), a book's reviews, the logged-out landing page's recent reviews.
  - **Not sorted:** the home Feed and the Following tabs (you chose those people), a reader's profile (one person's own writing), comments (they belong to the post above them), club discussions and chat (the club has its own language).
- **Ratings stay pooled.** One average per book, from every language.
- **No paid service.** The guess is our own small code on the server, not a translation or detection API. A "Translate" button is a separate future idea (`FUTURE-IDEAS.md`).
- **Not separate Spanish and English sections.** There's one app with one set of books, sorted by language.

## 3. Design

### 3.1 The language guess (`ContentLanguage`, in `Argos.Domain`)

The site supports five languages (en, es, pt-BR, de, fr), and they're easy to tell apart by their common small words. Rather than add a package (memory use on Render, upkeep, advisories), a small static class does it:

- A list of about 40–60 common words per language ("the, and, is, was, with…" / "el, la, que, de, y, muy, pero…" / "o, a, não, uma, você, muito…" / "der, die, und, ist, nicht…" / "le, la, et, est, pas, très…"). It favours words that belong to one language only, especially to tell Spanish from Portuguese.
- `Guess(string text) → string?`: lowercase the text, split it into words, count matches per language. It returns the top language only when there are at least ~4 matches and it clearly beats the second (for example, 1.5×). Otherwise it returns null.
- `For(string? text, string? writerSiteLanguage) → string?`: null when there's no text, otherwise `Guess(text) ?? writerSiteLanguage ?? "en"`.
- If tests on real reviews show it isn't good enough, swap in a maintained package and load only these five languages. That change stays inside this class.

### 3.2 Data (Phase 1)

- `Log.ReviewLanguage` (string?, max 5) and `Writing.Language` (string?, max 5): one of `SupportedLanguages.Codes`, or null when there's no text (a rating-only log).
- Set on create and on edit when the text changes, unless the request names a language. An edit that leaves the text unchanged keeps the stored label (so a writer's pick survives a rating-only edit); the server can't tell a pick from a guess, so when the text changes it guesses again unless the request names a language, and the Phase 3 "Change" link must send `Language`. In that case, use the named one (it must be in `SupportedLanguages.Codes`, otherwise 400 with a new error code `content.badLanguage`).
- `CreateWritingRequest` / `UpdateWritingRequest` and the log create/update requests get an optional `Language`. `ReviewDto` and `WritingDto` get `Language`.
- A null language counts as matching every reader (no text, nothing to read).
- **Backfill:** `ContentLanguageBackfill.RunAsync`, run at startup after migrations like `BookGenreBackfill`. It labels every log with review text and no `ReviewLanguage`, and every writing with no `Language`, using the writer's `PreferredLanguage` as the fallback. After the first run it finds nothing. It works in batches of ~500 so a large table doesn't load at once.
- An index is only needed if the sorting query is slow. Check the plans in Phase 2 before adding one.

### 3.3 Reader's languages and sorting (Phase 2)

- `ApplicationUser.ReadingLanguages` (`List<string>`, Postgres text array, empty by default). Empty means "my site language". `UpdatePreferencesRequest` takes it. Each entry must be supported and the list can't repeat a language (at most 5). `CurrentUserResponse` returns it.
- **The reader's languages** = `ReadingLanguages` if any are set, otherwise the viewer's site language (`ICurrentViewer.Language`, which already handles visitors).
- **Two-part lists.** The sorted lists in §2 take a new query parameter `languages=mine|other`. The default is `mine`, so an old app version still gets its own languages first.
  - `mine`: items whose language is one of the reader's languages, or null. The same order and paging as today.
  - `other`: everything else, in the same order and paging.
  - The browser loads `mine` until it runs out, then loads `other` under the "In other languages" heading. Splitting it this way keeps today's paging (cursor for Recent writings, page numbers for the rest) working unchanged. Sorting one list by language would break the cursor.
  - The response gets `OtherLanguagesCount` on the first `mine` page (capped at 100, so it shows "99+"), so the heading can show "(14)" and the browser knows whether to show it at all.
- **Endpoints:** `GET /api/reviews` (sections recent and popular, and `bookId`), not `following` or `userId`. `GET /api/writings` (recent and popular, and `authorId`), not `following` or `userId`. The landing page's recent reviews (`LandingRepository`), `mine` only, falling back to all languages if there are fewer than it shows.
- The "Found on Google" bot pages and share cards are unchanged. They show one item, or every item for the page's own language.

### 3.4 Browser (Phase 3)

- **Fixing a wrong guess:** the composer and review form stay as they are. Once posted, your own review or writing shows its language with a "Change" link (a small menu of the five languages). This keeps the composer clean and the guess in one place, on the server. If wrong guesses turn out to be common, add a language button next to Post later.
- **Lists:** after the reader's own languages, a divider "In other languages (14)", then those items, each with a small language tag (for example, "Español") near the date. When the reader has nothing in their languages, the divider comes first with a short line: "Nothing in English yet. Here's what readers wrote in other languages."
- **Settings → Language:** "Languages I read" checkboxes for the five languages, with the site language ticked by default and a line explaining what it does. Saving updates the lists.
- Every text goes through `t('…')` in all five locale files. Follow `DESIGN.md` and the `web-design` skill for the divider and tag (quiet, not a banner).

## 4. Tasks

### Phase 1 — Language on reviews and writings (server)

#### Backend
- [x] `ContentLanguage` guess (§3.1), with unit tests: a clear sentence in each of the five languages, Spanish vs Portuguese pairs, short text ("10/10 🔥") falling back, mixed text, empty text.
- [x] `Log.ReviewLanguage`, `Writing.Language`, migration.
- [x] Set on create and edit, accept an optional `Language` from the writer, `content.badLanguage` code and translations, `Language` on `ReviewDto` and `WritingDto`.
- [x] `ContentLanguageBackfill` at startup (§3.2).
- [x] Integration tests: posting labels it; editing the text re-guesses it; a writer's choice wins and survives an edit that doesn't name a language; a bad code is refused; the backfill labels old rows and leaves rating-only logs null.

#### Verification
- [x] `reviewer`, then `argos-security` (user input reaching the server).
- [x] Run the guess over the live reviews' text locally (exported, not committed) and check a sample by eye before Phase 2. (Replaced 2026-11-05: there are under 10 live reviews, all Spanish, so instead 41 hand-written reviews in the five languages were run through `ContentLanguage`, including casual Spanish, Spanish vs Portuguese pairs, mixed text and very short text. 34 correct, 0 wrong, 7 unsure and left to the writer's site language: one-word reviews, "10/10 🔥", and three short sentences with fewer than 4 common words. Spanish writers on the English site would get those labelled `en` until they use "Change". Look at the real language tags once Phase 3 shows them.)

### Phase 2 — Reader's languages and sorting (server)

#### Backend
- [x] `ApplicationUser.ReadingLanguages`, migration, preferences request and response, validation.
- [x] `languages=mine|other` and `OtherLanguagesCount` on the endpoints in §3.3; landing page `mine` with fallback.
- [x] Integration tests: an English reader gets English and no-text items in `mine`, Spanish in `other`; a reader with en+es gets both in `mine`; a visitor uses the request's language; Following and profile lists ignore the parameter; paging still works in both parts; blocked and hidden rules still apply in `other`. (`ContentLanguageListTests`. Items with no label are tested with blank-text reviews, because the startup backfill labels any unlabelled review that has text, including while another test class starts up on the shared test database.)
- [x] Check the query plans on a copy with realistic row counts; add an index only if needed. Done 2026-11-05 on a scratch database of synthetic data (2,000 readers, 150,000 logs of which about 102,000 with review text, 60,000 writings, 52,000 review likes and 40,000 writing likes; 85% Spanish, 10% English, 3% Portuguese, the rest unlabelled), since dropped. **No index added.** Times for one page of 21, in ms:

  | | Reviews Recent | Reviews Popular | Writings Recent | Writings Popular |
  |---|---|---|---|---|
  | Before this feature (no language filter) | 94 | 340 | 33 | 155 |
  | `mine` (English reader) | 31 | 65 | 10 | 24 |
  | `other` | 88 | 304 | 24 | 145 |

  The count of the other languages (capped at 100) takes 0.4–0.5 ms, and 10–24 ms in the worst case, when nothing matches and it reads every row. The language filter adds nothing to the cost: `mine` is faster than before (fewer rows to sort) and `other` is about the same. A language index wouldn't help, because the filter keeps most rows.
  **Seen on the way, not caused by this feature:** every Recent and Popular list reads and sorts all visible rows on each request (a sequential scan, then a top-N sort). That is fine at today's size and costs 0.1–0.3 s at about 100,000 reviews. Popular is the slowest, since it counts likes for every row. If the lists slow down as the site grows, the fix is an index on Recent's sort key and a stored like count for Popular. Not needed now.

#### Verification
- [x] `reviewer`, then `argos-security` (privacy and visibility rules in lists). Both found nothing blocking; the reviewer's one edge case (a `before` without `beforeId` got no count) is fixed.

### Phase 3 — Browser

#### Frontend
- [ ] Types and API calls for `language`, `languages`, `otherLanguagesCount`, `readingLanguages`.
- [ ] Two-part loading with the "In other languages" divider and language tags: Reviews section, Writings section, book page reviews, author quotes, landing page.
- [ ] "Change" language on your own posted review and writing.
- [ ] Settings: "Languages I read".
- [ ] Translations in all five locale files. Vitest for the two-part loading and the settings form.

#### Verification
- [ ] Screenshot critique round (`web-design`), then `browser-check`: an English reader and a Spanish reader on the same book page, a bilingual reader, a visitor in English.
- [ ] `reviewer`.
- [ ] CHANGELOG line, What's new entry (English and Spanish).
