# Feature Spec — Book data in the reader's language

**Status:** ✅ Built 2026-10-25: book page from Open Library's editions (§9), Wikidata and Wikipedia (§10), search (§11), every other screen (§12). Roadmap Stage 4b, after Shareable pages.

## 1. Problem

A `Book` is an Open Library *work*, and a work has one title, one description and one cover, usually in the language the book was first published in (English for most of the catalogue). Since the site was translated (`specs/languages.md`), book data has been shown "as Open Library has it" (out of scope there, §"Explicitly out of scope"). So a Spanish reader opening `wingedwords.app/es/books/OL59800W` sees *The Left Hand of Darkness* with an English description, although Open Library has four Spanish editions titled *La mano izquierda de la oscuridad*, one of them with a good Spanish description, and Wikidata and Spanish Wikipedia have the book too.

It also shows in search: searching *"La mano izquierda de la oscuridad"* finds the book (Open Library's search matches edition titles), but the result says "The Left Hand of Darkness", so a Spanish reader thinks it's the wrong book.

The early-access readers come from Reddit and book communities (Roadmap Stage 4b), and Spanish is the second language we advertise, with its own share links (`specs/language-share-links.md`). A Spanish page with an English book on it looks unfinished.

How other sites do it (researched 2026-10-25): Goodreads, StoryGraph and Hardcover treat each **edition** as the record that has a language, with its own title and description, mostly from publisher data feeds (ONIX, paid) and volunteer librarians. Hardcover's librarians import from Open Library and Google Books and check the result. Letterboxd takes per-language titles and summaries from TMDb, which volunteers translate. Spain's publisher feed (DILVE) has an API, but needs a yearly fee and a contract, and its terms for showing descriptions publicly aren't published. So this spec uses the two free sources: Open Library's editions and Wikidata/Wikipedia.

## 2. Decisions

Agreed 2026-10-25:

- **Free sources only:** Open Library's editions in the reader's language (option 1) and Wikidata / Wikipedia (option 3). No machine translation, no Google Books, no DILVE for now.
- **The work stays the unit.** Logs, ratings, reviews and lists stay on the work. Only what is *shown* changes with the reader's language.
- **Search is part of it:** a result shows the title in the reader's language.
- **Volunteer librarians** (readers who fix titles and descriptions, with a "Librarian" title on their profile) are a good idea for later, once there are readers. Not in this spec; in `FUTURE-IDEAS.md`.

Chosen without asking (small, easy to change; see §8 for the ones worth a second look):

- **All five site languages, English included.** The mechanism doesn't care which language it is. For English readers this changes some books: *Cien años de soledad* becomes *One Hundred Years of Solitude*.
- **The original title stays visible** as a small line under the translated one, on the book page and in search results (Letterboxd does this for films). Other screens show only the translated title.
- **The cover follows the language** when an edition in that language has one. This reverses the out-of-scope line in `specs/formats-editions.md` §6 ("choosing the shared default cover by the viewer's language"). A reader's own chosen edition still wins on their own screens, as today.
- **Stored, not fetched per view.** Each book gets one stored row per language with what was found. Pages read the rows; the fetching happens when the book is first cached, when it's refreshed, and in a backfill for books already cached.
- **What's on screen decides, not the account setting.** The frontend sends its current language with every request. A signed-in reader's saved `PreferredLanguage` is used only where there is no request (emails).
- **Wikipedia text is credited**: "From Wikipedia" with a link to the article and to the CC BY-SA licence, under the description. Wikidata needs no credit (CC0), Open Library neither, but the book page already links to Open Library.
- **A description in another language is still shown** when none exists in the reader's language, as today, with `lang` set on it so screen readers read it correctly.

## 3. Where each piece comes from

The rules for one book in one language `L` (`en`, `es`, `pt-BR`, `de`, `fr`). Open Library's language codes are three-letter (`eng`, `spa`, `por`, `ger`, `fre`); Wikidata and Wikipedia use `en`, `es`, `pt-br`/`pt`, `de`, `fr`.

### 3.1 Title

1. **Wikidata's label in `L`** (for `pt-BR`: `pt-br`, then `pt`). Wikidata labels are curated and correctly capitalised ("Alas de sangre", "Los juegos del hambre").
2. Else the **most common title among the work's editions in `L`**, after cleaning: keep only the main title (not the subtitle), cut a trailing `(...)` or `[...]` ("Los Juegos Del Hambre (Edición Especial)"), keep the first half of "X / X" ("Dune / Dune"), trim. Count case-insensitively; show the most common spelling; on a tie, the newest edition's.
3. Else nothing is stored and the work's title shows.

Exception: when the Wikidata label is the same as the work's title but the editions in `L` agree on a different one, the editions win (Norwegian Wood is *Tokio blues* in Spanish). "Agree" = at least two editions, or the only edition in `L`.

A title the same as the work's title (Circe, Demon Copperhead) isn't stored.

### 3.2 Description

1. A **description from an edition in `L`**: the newest such edition whose description is at least 100 characters.
2. Else the **lead summary of the Wikipedia article in `L`** (Wikipedia's page summary, plain text), credited (§2).
3. Else nothing is stored and the work's description shows.

For English only, step 1 and 2 apply only when the work has no description of its own: the work's description is almost always English already, and a publisher's text beats a Wikipedia lead.

### 3.3 Cover

The cover of the newest edition in `L` that has a valid cover, preferring editions whose cleaned title is the one chosen in §3.1. None → the shared default (`specs/formats-editions.md` §3.1). A reader's own edition still overrides it on that reader's screens.

### 3.4 Finding the Wikidata item

1. The work's own `identifiers.wikidata` on Open Library (only 3 of the 14 books in §7 have it).
2. Else Wikidata's search for items whose "Open Library ID" (property P648) is this work id (found 8 more of the 14).
3. Either way, keep it only if the item's P648 list contains this work id. Open Library and Wikidata are both public wikis, and a wrong link would put another book's title on this one.

## 4. Design

### 4.1 Data

New table `BookLocalizations`:

| Column | Type | Notes |
|---|---|---|
| `Id` | `Guid` | |
| `BookId` | `Guid` | FK → `Books`, cascade delete |
| `Language` | `string` (≤ 5) | a site code from `SupportedLanguages.Codes` |
| `Title` | `string?` | same max length as `Books.Title` |
| `TitleSource` | `string?` | `wikidata` or `edition` |
| `Description` | `string?` | same max length as `Books.Description` |
| `DescriptionSource` | `string?` | `edition` or `wikipedia` |
| `WikipediaUrl` | `string?` (≤ 500) | built by us from the language and article title, for the credit |
| `CoverUrl` | `string?` | `covers.openlibrary.org` only, built from a cover id like today |
| `EditionOpenLibraryId` | `string?` (≤ 20) | the edition the cover or description came from, for checking |

Unique index on (`BookId`, `Language`). A row exists only when at least one of title, description or cover was found.

On `Books`: `WikidataId string?` (≤ 20, `Q` + digits), `LocalizedAt DateTime?` (null = never checked; the backfill picks those up, like `OpenLibraryRatingCheckedAt` in `specs/open-library-ratings.md`) and `LocalizationFailedAt DateTime?` (added in Phase 1's review: the backfill's last failed try, so a book that keeps failing waits a day instead of heading every run).

`SPEC.md` §7 gets the table and the two columns.

### 4.2 Filling the rows

One step, `BookLocalizer`, fills all five languages of a book at once:

- **Open Library:** `/works/{id}/editions.json?limit=500` (one request; the cover picker keeps its own 100-entry request, so today's covers don't change). Group editions by language; apply §3.1–3.3. Needs title, subtitle and description on `OpenLibraryEditionEntry`. Every field is checked and cut to its column length, as `OpenLibraryEdition.From` does today.
- **Wikidata:** one entity request with labels in the five languages and the five Wikipedia site links, after §3.4.
- **Wikipedia:** a page-summary request only for languages that still lack a description and have an article. In parallel, at most five. Only a summary of type `standard` (not a disambiguation page) is used, and only its plain-text `extract`, never its HTML.

**When it runs:**
- **First caching** of a book (`GetBookAsync` cache miss), with an overall time limit (start at 3 s, adjusted after the timing check in Phase 1). Over the limit or a source down → the book is served and saved without localizations, `LocalizedAt` stays null and the backfill tries again.
- **A cached book with `LocalizedAt` null opened on its book page:** same, inline, same limit. The book page is what gets shared, so it shouldn't wait for the backfill.
- **Refresh** (`OpenLibraryCacheRefreshService`): when a book is refreshed, its localizations are rebuilt.
- **Backfill:** the refresh job's run also takes a batch of books with `LocalizedAt` null, most-logged first, like the ratings backfill.
- Since 2026-10-25 the refresh and the backfill build their books together in batches, with few Open Library requests and slightly different rules (§13).
- Other screens (shelves, feed, lists) only read rows; they never trigger fetching.

**Where the code goes:** Open Library calls stay in `OpenLibraryClient` (SPEC.md §8). Wikidata and Wikipedia get one new client, `WikimediaClient`, in `Argos.Infrastructure/ExternalApis/Wikimedia/`, with the same habits: a descriptive `User-Agent` with a contact address (Wikimedia's policy asks for one), short timeouts, null on failure, never a 500 because Wikipedia is down. `SPEC.md` §8 gets a line that Wikimedia calls go only through `WikimediaClient`, and its terms of use under Legal / Data.

### 4.3 Serving

- **Viewer's language:** the frontend's API client sends `Accept-Language: <current site language>` on every request. A small `ViewerLanguage` helper reads it, accepts only `SupportedLanguages.Codes`, and defaults to `en`. Emails and notifications built without a request use the recipient's `PreferredLanguage`.
- **Book page (`BookDto`):** `title` is the localized title, plus `originalTitle` (the work's title, only when different), `description` with `descriptionLanguage` (`L` when localized, null when it's the work's) and `wikipediaUrl` when it came from Wikipedia, `coverUrl` localized (unless the reader's own edition applies, as today).
- **Share cards** (`ShareCardService`, `/es/books/...` previews): the localized title and cover for the card's language.
- **Everywhere else** (Phase 4): every query that returns a book's title or cover picks the row for the viewer's language and falls back to the work's. One shared EF projection (a subquery per book, so it stays one SQL query), not a second request. Sorting by title (lists, shelves) sorts by what's shown.
- **Not changed:** the account export keeps the work's title (stable across languages); search matching against stored books also matches localized titles (§4.4).

### 4.4 Search

- Open Library's search gets `lang=<L>` (prefer editions in that language) and the fields `editions.key,editions.title,editions.language`. It then returns, for each work, the edition that best matched the query, preferring `L`.
- A result's title: the stored localization when the book is cached and has one; else the matched edition's cleaned title when that edition is in `L` and differs from the work's; else the work's title. The original title goes on the small line, as on the book page.
- The cache-only search (`BookRepository.SearchByTitleAsync`, used when Open Library is down) also matches `BookLocalizations.Title`.
- The "Russian edition" label (`TitleLanguage`, `specs/search-result-clarity.md`) is left as it is.

### 4.5 Frontend

- API client: `Accept-Language` header from `i18n.language`.
- Language switch: invalidate all queries so book data comes back in the new language (the switch re-renders, `specs/languages.md` §3, but cached responses would stay in the old language).
- Book page: translated title; under it the original title in small text with its own `lang` when known; description with `lang`; the Wikipedia credit line ("From Wikipedia · CC BY-SA", both links, opening in a new tab with `rel="noopener noreferrer"`).
- Search results: the same title and original-title line.
- New text through `t()` in all five languages; design tokens only (`DESIGN.md`); checked at phone width.

## 5. Phases and tasks

### Phase 1 — Book page from Open Library's editions *(size M–L)*

**Backend**
- [x] Migration: `BookLocalizations` table, `Books.WikidataId`, `Books.LocalizedAt` (and `Books.LocalizationFailedAt`, a second migration); `SPEC.md` §7
- [x] `OpenLibraryEditionEntry`: title, description (text or `{ value }`), checked and cut to length (subtitle not mapped: nothing reads it, §9)
- [x] `BookLocalizer` (pure part): group editions by language, title cleaning and choice (§3.1), description (§3.2), cover (§3.3); unit tests with the §7 cases (Dune / Dune, Edición Especial, Tokio blues, a tie, English only filling an empty description)
- [x] Fill on first caching (from the book page; imports leave it to the backfill, §9) and on opening a book page with `LocalizedAt` null, within the time limit; rebuild on refresh; backfill batch in the refresh job; integration tests with a stubbed Open Library
- [x] `ViewerLanguage` helper; `BookDto` fields (§4.3); share cards use the card language's row (the book card; review and list cards in Phase 4)
- [x] Timing check: editions request at `limit=500` for Pride and Prejudice, Cien años de soledad and Dune on the live API; set the time limit from it and note the numbers here (§9: 1.4–3.5 s, limit 4 s)

**Frontend**
- [x] `Accept-Language` header; invalidate queries on language switch
- [x] Book page: translated title, original-title line, `lang` on title and description
- [x] Translations (five languages) and Vitest tests

**Verification**
- [x] `reviewer` and `argos-security` (external data stored and shown, a new request header); findings fixed (§9)
- [x] Browser check: OL59800W in Spanish shows *La mano izquierda de la oscuridad*, the Spanish description and a Spanish cover; in English unchanged; switching language swaps it without a reload
- [x] The ~20-book check (§7) redone against the built code, results noted here (§9)

### Phase 2 — Wikidata and Wikipedia *(size M)*

**Backend**
- [x] `WikimediaClient`: find the item (§3.4, with the P648 check), labels and site links, page summaries; `User-Agent` with a contact address; timeouts; null on failure; unit tests with stubbed responses (disambiguation page, missing article, wrong P648)
- [x] `BookLocalizer` uses it: Wikidata label first (§3.1, with the editions exception), Wikipedia summary as description step 2; stores `WikidataId` and `WikipediaUrl`
- [x] `SPEC.md` §8: Wikimedia only through `WikimediaClient`, its terms under Legal / Data

**Frontend**
- [x] Wikipedia credit line under a description that came from Wikipedia; translations

**Verification**
- [x] `reviewer` and `argos-security` (new external service, wiki text reaching the page, article titles in URLs); findings fixed (§10)
- [x] Browser check: Circe in Spanish shows the Spanish Wikipedia summary with the credit; Proyecto Hail Mary gets its title from Wikidata (§10)

### Phase 3 — Search in the reader's language *(size S–M)*

**Backend**
- [x] Search request with `lang` and the edition fields; result title rule (§4.4); original title on the result; unit tests
- [x] Cache-only search also matches localized titles; test

**Frontend**
- [x] Search result card: translated title with the original-title line; the book-picker search (`specs/book-picker-search.md`) and the landing page's "Find a book" show the translated title too (also the header's suggestions, the import's "Find the book" and the profile's add-a-book search)

**Verification**
- [x] `reviewer`; findings fixed (§11)
- [x] Browser check in Spanish: "La mano izquierda de la oscuridad", "Tokio blues" and "left hand of darkness" all show the Spanish title with the English one underneath (§11)

### Phase 4 — Everywhere else *(size M–L)*

**Backend**
- [x] The shared localized title/cover projection; used in every repository and service that returns a book's title or cover (about 29 files today: feed, logs, lists, clubs, reviews, journal, notifications, stats, discovery, landing, reader cards, taste match, author follows, moderation and reports, popular books)
- [x] Sorting by title uses the shown title; emails and notifications use the recipient's `PreferredLanguage` (no email carries a book title, and notifications build their text when read, §12)
- [x] Tests: a list, a shelf and the feed in Spanish show the Spanish title; an English viewer of the same list sees the English one

**Frontend**
- [x] Nothing new expected beyond what the API returns; check for places that build a title on their own (none, §12)

**Verification**
- [x] `reviewer`; findings fixed (§12)
- [x] Browser check in Spanish: shelves, a list, the feed, a club and stats show translated titles and covers (§12)

## 6. Out of scope

- Machine translation of descriptions (option 2 of the 2026-10-25 discussion). Possible later as a labelled fallback for books with no description in the reader's language.
- Paid publisher data (DILVE, Nielsen, Bowker) and Google Books.
- Volunteer librarians editing titles and descriptions (`FUTURE-IDEAS.md`).
- Translating author names, subjects or genres from Open Library (genres are already translated by key, `specs/languages.md` §3).
- Changing what the work *is*: a Spanish edition never becomes its own book.

## 7. Sample: 14 books in Spanish (2026-10-25, live Open Library and Wikimedia)

| Book | Spanish editions (with description) | Title from editions | Wikidata item / Spanish label | Spanish Wikipedia | Search with `lang=es` returns |
|---|---|---|---|---|---|
| The Left Hand of Darkness | 4 (1) | La mano izquierda de la oscuridad | Q2008211 (on OL) / same | yes | The Left Hand of Darkness |
| Dune | 8 (1) | "Dune / Dune" | not found | — | Dune |
| Pride and Prejudice | 20 (0) | Orgullo y Prejuicio | Q170583 (P648) / Orgullo y prejuicio | yes | Orgullo y Prejuicio |
| Project Hail Mary | 1 (0) | Proyecto Hail Mary | Q106852836 (on OL) / same | yes | Proyecto Hail Mary |
| Fourth Wing | 2 (2) | Alas de Sangre | Q120798796 (P648) / Alas de sangre | — | Alas de Sangre |
| The Midnight Library | 0 | — | not found | — | The Midnight Library |
| Norwegian Wood | 4 (0) | Tokio Blues | not found | — | Tokio blues |
| The Hunger Games | 12 (6) | "Los Juegos Del Hambre (Edición Especial)" | Q11678 (P648) / Los juegos del hambre | yes | The Hunger Games |
| Circe | 0 | — | Q64590884 (P648) / Circe | yes | Circe |
| Demon Copperhead | 0 | — | Q115526836 (P648) / same | yes | Demon Copperhead |
| Cien años de soledad | 69 (4) | Cien años de soledad | Q178869 (P648) / same | yes | Cien años de soledad |
| Tomorrow, and Tomorrow, and Tomorrow | 0 | — | Q115818209 (P648) / none | — | (English) |
| The House in the Cerulean Sea | 2 (2) | La casa en el mar más azul | Q115683373 (P648) / same | yes | House in the Cerulean Sea |
| Klara and the Sun | 2 (0) | Klara y el Sol | Q105704813 (on OL) / same | — | Klara y el Sol |

(The search column is for English queries such as "dune herbert"; a Spanish query returns the Spanish edition.)

What it says:
- **Title:** 11 of 14 would get a Spanish title, or one confirmed the same as the English. Missing: The Midnight Library, Tomorrow ×3 (Open Library has no Spanish edition of either), and Dune (the same title anyway). Wikidata gives the clean spelling; edition titles need the cleaning in §3.1.
- **Description:** 10 of 14 would get a Spanish one (6 from editions, 4 more from Wikipedia). Missing: The Midnight Library, Norwegian Wood, Tomorrow ×3, Klara and the Sun.
- **Wikidata link:** only 3 works carry it on Open Library; the P648 search finds 8 more. Dune, The Midnight Library and Norwegian Wood surely have Wikidata items, but their P648 points at another Open Library work (a duplicate). Worth looking at in Phase 2: also accept an item whose P648 points at a work that Open Library redirects to this one.
- A Wikipedia lead reads as a short summary ("Proyecto Hail Mary es una novela de ciencia ficción dura de 2021 escrita por el autor estadounidense Andy Weir. Se centra en Ryland Grace…").

## 8. Worth a second look before building

- **English readers too?** Chosen yes (§2). It means *Cien años de soledad* shows as *One Hundred Years of Solitude* to English readers, and *Le petit prince* as *The Little Prince*. The other choice: only localize for non-English readers, leaving English as Open Library has it.
- **Covers by language:** chosen yes. The other choice: keep one shared cover for everyone (the original edition, as decided in `specs/formats-editions.md`) and change only the text.
- **Order of phases:** the book page (1) and Wikidata (2) first because that's the reported problem; search (3) is small and could come first if you'd rather fix what new readers meet first.

## 9. Phase 1 build notes (2026-10-25)

**Timing check** (live API, `editions.json?limit=500`, three runs each): Dune (OL893414W) 1.4–2.7 s, Pride and Prejudice (OL66554W, 4,042 editions, the first 500 read) 2.2–3.1 s, Cien años de soledad (OL274505W) 2.1–3.5 s. The book page's limit is **4 s** (`BookLanguages:PageTimeLimitMs`). The editions request starts alongside the work's own fetch on a first visit, so it adds little to a cache miss. After a failed or timed-out attempt the page doesn't try that book again for 15 minutes (in memory), so its next readers aren't kept waiting; the backfill gets it.

**How it's built:** `BookLocalizer` (Infrastructure, pure) picks the rows; `BookLocalizationService` (Api) fetches through `OpenLibraryClient.GetEditionEntriesAsync` and stores them through `IBookLocalizationRepository` (delete and insert in one transaction, `LocalizedAt` stamped by itself so a refreshed book's other changes stay the caller's). `BookService.GetForPageAsync` serves the book page. The refresh job rebuilds a book's rows after each refresh and then takes `CacheRefresh:MaxLocalizationsPerRun` (500) never-built books, most-logged first. `BookLanguages:FetchOnPage` is off in the test host, like `CacheRefresh:Enabled`. Column caps: title 500, description 10,000 (Books' columns have no cap to match). The share card for books uses the card language's row (en/es); review and list cards wait for Phase 4.

**Changes from §3, found on real data** (21 books, below):
- *Leading articles:* Open Library's bulk imports drop them ("Little Prince" ×34, "The Little Prince" ×10; "Trial" ×279, "The trial" ×7). Titles are counted together when they differ only in case, accents, apostrophes (’/') or a leading article, and the spelling with the article is shown. English titles take their capitals from the most common spelling ("The Trial"), other languages keep the article-bearing spelling as written ("El principito").
- *The work's title stands* in a language when at least a quarter of that language's titled editions carry it (Harry Potter's English editions are split between two titles; neither should replace the work's for English readers). This also keeps *The House in the Cerulean Sea* for English readers instead of "House in the Cerulean Sea".
- *Descriptions in the wrong language* are skipped: a Spanish-tagged *Cien años* edition had an English blurb, a German-tagged *Der Proceß* one too. A description is used only when no other site language has more of its common short words in it.
- *Covers:* a language keeps the shared default cover when the default already is one of that language's editions' covers (English readers of *The Left Hand of Darkness* keep the original's), and when the default is the work's own cover (on no edition) and the language keeps the work's title (French readers of *Le petit prince*, German readers of *Der Proceß*). Otherwise the cover follows the language, as §2 decided (Dune in Spanish gets a Spanish edition's cover). A book with no cover at all gets one for English readers from an English edition.
- *Not mapped:* the edition `subtitle` (§3.1 keeps only the main title, so nothing reads it).
- *Not localized on first caching:* imports and the author release check cache books through `GetBookAsync` directly; they'd wait seconds per book. The book page or the backfill builds their rows.
- *Original title's `lang`:* not set, since the work's language isn't known yet; Phase 2 (Wikidata) can give it.

**The ~20-book check** (`BookLocalizer` on recorded live data, 2026-10-25; "—" = the work's own shows):

| Book | es | pt-BR | de | fr | en |
|---|---|---|---|---|---|
| The Left Hand of Darkness | La mano izquierda de la oscuridad + desc + cover | A Mão Esquerda da Escuridão | Die linke Hand der Dunkelheit + desc | La Main Gauche de La Nuit | — |
| Dune | — (Spanish cover + desc) | Duna + desc | Der Wüstenplanet | — (cover + desc) | — |
| Pride and Prejudice | Orgullo y Prejuicio | Orgulho e Preconceito + desc | Stolz und Vorurteil + desc | Cinq Filles de Mrs Bennet (5 vs 5 with Orgueil et Préjugés; newest wins) | — |
| Project Hail Mary | Proyecto Hail Mary | Devoradores de estrelas + desc | Der Astronaut + desc | Projet Dernière Chance | — |
| Fourth Wing | Alas de Sangre + desc | — | — (cover + desc) | — | — |
| The Midnight Library | — | A Biblioteca Da Meia-Noite + desc | Die Mitternachtsbibliothek + desc | La Bibliothèque de Minuit | — |
| Norwegian Wood | Tokio Blues | — (cover) | Naokos Lächeln. Nur eine Liebesgeschichte. | La Ballade de l'impossible | — (English cover; default is the Japanese one) |
| The Hunger Games | Los juegos del hambre + desc | Jogos Vorazes + desc | Die Tribute von Panem + desc | — (cover + desc) | — |
| Circe | — | — (cover) | — | — | — |
| Demon Copperhead | — | — | — | — | — |
| Cien años de soledad | — (Spanish desc) | Cem Anos de Solidão | Hundert Jahre Einsamkeit | Cent ans de solitude + desc | One Hundred Years of Solitude |
| Tomorrow, and Tomorrow, and Tomorrow | — | — | — | Demain, et demain, et demain + desc | — |
| The House in the Cerulean Sea | La casa en el mar más azul + desc | — | Mr. Parnassus' Heim für magisch Begabte + desc | — | — |
| Klara and the Sun | Klara y el Sol | Klara e o Sol | — | Klara et le Soleil | — |
| Harry Potter and the Philosopher's Stone | Harry Potter y la piedra filosofal + desc | Harry Potter e a Pedra Filosofal + desc | Harry Potter und der Stein der Weisen + desc | Harry Potter à l'école des sorciers + desc | — |
| Nineteen Eighty-Four | 1984 + desc | 1984 + desc | 1984 | 1984 | — |
| Le petit prince | El Principito | O Pequeno Príncipe + desc | Der kleine Prinz | — | The Little Prince |
| Der Proceß | El Proceso | O Processo | — | Le Proces | The Trial |
| The Hobbit | El Hobbit + desc | O Hobbit + desc | Der kleine Hobbit + desc | Bilbo le Hobbit + desc | — |
| L'étranger | El extranjero + desc | O estrangeiro | Der Fremde | — (desc) | The Stranger |
| The Name of the Wind | El nombre del viento + desc | — (cover + desc) | Der Name des Windes + desc | Le Nom du Vent + desc | — |

Covers follow the language in every row with a title, unless noted. What's left for Phase 2: capitals and accents from Wikidata labels ("Orgullo y prejuicio", "La Main gauche de la nuit", "Le Procès"), a subtitle left inline by a record ("Naokos Lächeln. Nur eine Liebesgeschichte."), and ties like French *Pride and Prejudice*. Some edition descriptions open with a line about that edition ("Geschenkausgabe: mit Illustrationen…", "NO TE PIERDAS LA EDICIÓN COLECCIONISTA…") before the synopsis; left as they are.

**Reviews** (`reviewer` and `argos-security`, 2026-10-25; nothing high or critical), all fixed:
- A cancellation of the base type (`OperationCanceledException`, not `TaskCanceledException`) could escape the editions fetch and fail the book page: the client catches any cancellation.
- A description holding half a character escaped on its own (`"\ud800"`, possible through Open Library's JSON API) threw when read, which would have failed the page on every view and the backfill on every run: the description reader treats it as no text, and the page catches anything else while building or storing (served with the work's data, the 15-minute marker set).
- Books that keep failing would head the backfill every run: `Books.LocalizationFailedAt`, never-tried books first, a failed one again after a day.
- One edition dated "9999" would always be the newest and choose the language's description and cover: a year past next year counts as undated.
- Readers opening a new book together each fetched 500 editions: a short in-progress marker (the page's time limit) makes it one request.
- The Open Library client got an 8 MB response cap (the largest answer is under 1 MB).
- A lost unique-index race is logged as information and its rows still returned; any other database refusal as a warning.
- Noted, not changed: every query refetches on a language switch (simple, correct); a stored row stays until the book's next refresh; the in-memory markers are per instance; a request for a valid-looking work id that doesn't exist still costs the editions request alongside the work's. For Phase 4: any response cache on an endpoint with localized titles needs `VaryByHeader = "Accept-Language"`.

**Browser check** (side ports, live Open Library, signed out and in): OL59800W in Spanish shows *La mano izquierda de la oscuridad* with "The Left Hand of Darkness" under it, the Spanish description (`lang="es"`) and a Spanish cover; switching to English and back swaps everything without a reload; Norwegian Wood shows *Tokio Blues* in Spanish, Cien años *One Hundred Years of Solitude* in English. Design critique: one fix (at 375 the author line steps a little further from the original title), then ship.

## 10. Phase 2 build notes (2026-10-25)

**How it's built:** `WikimediaClient` (`Argos.Infrastructure/ExternalApis/Wikimedia/`) makes four calls: Wikidata's search (`haswbstatement:P648=<work>`), `wbgetentities` (labels in en, es, pt-br, pt, de, fr and `mul`; the five Wikipedias' site links), `wbgetclaims` for P648, and Wikipedia's REST page summary (`type: standard` only, the plain `extract`). Timeout 5 s, a 1 MB cap, no redirects followed, every value's type checked. It answers null when the service can't be reached. A missing, moved or refused article (any 4xx but 408 and 429) and a disambiguation page are answers ("no summary"), so the book isn't rebuilt for them. `BookLocalizationService` finds the item and fetches the leads; `BookLocalizer` (still pure) applies the labels and leads. `Books.WikidataId` is stored with a complete build.

**Changes from §3, found on real data** (live check of 22 books below):
- *The name check (new, on top of P648):* Wikidata's Dune lists Dune Messiah's Open Library id among its own, and a stray item "Jane Austen's Pride and Prejudice" lists Pride and Prejudice's. An item is used only when one of its labels, cleaned like an edition title, is the work's title (or the part before its colon). Case, accents, punctuation, "&"/"and", "ß"/"ss" and a leading article are ignored.
- *Choosing among items:* a whole-title match beats a match before the colon (a sequel "Dune: House Atreides" mustn't take Dune's item), then an item both wikis agree on (Open Library's work links to it), then the most of the five Wikipedias' articles. A tie on all three is no item: a film or a new item claiming the work is as likely as the book (security review).
- *Merged duplicates (the §7 open question):* an item Open Library links to whose P648 names a work Open Library has since merged into this one is accepted (`OpenLibraryClient.RedirectsToAsync`, up to 3 merges, at most 3 checks a build). This found *Le petit prince* (OL10264W → OL10263W) and *The Name of the Wind*. Dune, *The Midnight Library* and *Norwegian Wood* still have no item: neither wiki points the right way, so nothing can find it.
- *Open Library's link for books read from the database:* the work's `identifiers.wikidata` comes with a fresh fetch or refresh. For a backfilled book or one already cached, it's asked for alongside the search (code review).
- *A search result counts as P648-checked* (decision): Wikidata's search only finds items whose P648 holds the work. Checking each one again would cost a request in series inside the page's time limit. Accepted risk: just after an edit is reverted, the search index can still match the item for a short while.
- *Labels* are cleaned like edition titles ("Circe (romance)" → Circe, the work's own, so nothing is stored). The editions exception works as §3.1 says: Portuguese *Left Hand of Darkness* keeps "A Mão Esquerda da Escuridão" over Wikidata's pt label, which is the English title.
- *Timing:* on the book page the editions request and Wikidata's search start together, alongside the work's own fetch. Items, merges and leads follow within the same 4 s. Live builds took 0.3–3.1 s (Harry Potter 3.1 s, Demon Copperhead 2.6 s, Pride and Prejudice 2.1 s). In the browser check the book request took 1.1–1.3 s. Once, a freshly started API's first build ran past 4 s and was served in English (retried after 15 minutes). Left as it is.
- *Wikimedia down or slow:* the rows from the editions are stored when the book has none yet, `LocalizedAt` stays null, and the page waits 15 minutes before trying again; the backfill completes it. An incomplete build never replaces rows already stored (code review). When Open Library fails, the Wikidata lookup is cancelled.
- *Wikipedia text* is shown as plain text, not through Open Library's Markdown reader. The credit is "From Wikipedia · CC BY-SA", two links opening in a new tab; the page shows it only for an `https` `*.wikipedia.org` address.
- *Still not done:* the original title's `lang` (Wikidata's P407 isn't read). The name check misses a work whose Open Library title is in a language or script with no fetched label (a Japanese original), or an old spelling (*Der Proceß* matches only because Wikidata's de label is "Der Process"). A wrong row stays until the book's next refresh (about 30 days), and no admin tool rebuilds one book. Items for films aren't filtered by "instance of" (P31); the tie rule covers the likely case.

**The 22-book check** (the built code on live Open Library and Wikimedia, 2026-10-25; W = title from Wikidata, wp = lead from Wikipedia):

| Book | Item | es | pt-BR | de | fr |
|---|---|---|---|---|---|
| The Left Hand of Darkness | Q2008211 | La mano izquierda de la oscuridad (W) | A Mão Esquerda da Escuridão (edition) + wp | Die linke Hand der Dunkelheit (W) | La Main gauche de la nuit (W) + wp |
| Dune | — | — | Duna | Der Wüstenplanet | — |
| Pride and Prejudice | Q170583 | Orgullo y prejuicio (W) + wp | Orgulho e Preconceito (W) | Stolz und Vorurteil (W) | Orgueil et Préjugés (W) + wp |
| Project Hail Mary | Q106852836 | Proyecto Hail Mary (W) + wp | Devoradores de estrelas (edition) | Der Astronaut (W) | Projet Dernière Chance (W) + wp |
| Fourth Wing | Q120798796 | Alas de sangre (W) | Quarta Asa (W) + wp | — | — + wp |
| Circe | Q64590884 | — + wp | — + wp | Ich bin Circe (W) | — |
| Demon Copperhead | Q115526836 | — + wp | — + wp | — + wp | On m'appelle Demon Copperhead (W) + wp |
| Cien años de soledad | Q178869 | — | Cem Anos de Solidão (W) + wp | Hundert Jahre Einsamkeit (W) + wp | Cent Ans de solitude (W); en: One Hundred Years of Solitude (W) |
| Klara and the Sun | Q105704813 | Klara y el Sol (W) | Klara e o Sol (W) + wp | Klara und die Sonne (W) + wp | Klara et le Soleil (W) |
| Le petit prince | Q25338 (merged duplicate) | El Principito (W) + wp | O Pequeno Príncipe (W) | Der kleine Prinz (W) + wp | — + wp; en: The Little Prince (W) |
| Der Proceß | Q36097 | El proceso (W) + wp | O Processo (W) + wp | Der Process (W) + wp | Le Procès (W) + wp; en: The Trial (W) |
| Dune Messiah | — (Dune's item refused) | El Mesias De Dune | Messias de Duna | Der Herr des Wüstenplaneten | Le Messie de Dune |

The others (The Midnight Library, Norwegian Wood: no item; The Hunger Games, Tomorrow ×3, The House in the Cerulean Sea, Harry Potter, Nineteen Eighty-Four, The Hobbit, L'étranger, The Name of the Wind: item found) came out as in §9 or better, with Wikidata's spelling ("Los juegos del hambre", "Hunger Games" in French, "Le Nom du vent"). Every lead read as a summary of the right book.

**Reviews** (`reviewer` and `argos-security`, 2026-10-25; nothing high or critical). Fixed:
- Open Library's link reached only books built on their first caching; it's now fetched for books read from the database.
- On a first visit the Wikidata search waited for the work's fetch; it now starts with the editions.
- "&" didn't match "and"; a Wikipedia 4xx other than 408/429 kept a book incomplete for good; an incomplete rebuild could replace richer rows; a failed editions request still let the Wikidata lookup run; there was no total cap on merge checks.
- Trust model: the colon match, the both-wikis rank and the tie rule above.

Noted, not changed: the search shortcut (above); the name check's misses (above); rows staying until the next refresh.

**Browser check** (side ports, live sources, signed out): Circe in Spanish shows the Spanish Wikipedia lead (`lang="es"`) with "De Wikipedia · CC BY-SA" under it (the article and the licence, new tab, `noopener noreferrer`), and no original-title line. Hail Mary shows *Proyecto Hail Mary* with "Project Hail Mary" under it and the Spanish lead. In English Circe shows the work's own description and no credit; in French Hail Mary is *Projet Dernière Chance*. The Left Hand of Darkness (description from an edition) has no credit. Design critique: the underline was too faint and the links too small to tap at 375. Fixed with a muted-ink underline, 44 px targets and a 2 px underline on hover.

## 11. Phase 3 build notes (2026-10-25)

**How it's built:** the search endpoint passes the viewer's language as `BookSearchOptions.ResultLanguage` (not a filter, so it doesn't change which path a search takes). `OpenLibraryClient` then sends `lang=<two letters>` (`pt` for pt-BR: Open Library ignores `pt-BR` and `por`) and the fields `editions,editions.key,editions.title,editions.language`. `BookLocalizer.SearchEditionTitle` gives a result the matched edition's cleaned title when that edition is in the language and isn't the work's title written differently ("Pride & Prejudice"). `BookService.SearchAsync` returns `BookSearchHit`s (book, shown title, original title). The title is the stored row's for a cached book, else the matched edition's, else the work's. The DTO's `originalTitle` carries the work's title, as on the book page. Timing: the extra fields cost Open Library about 0.05–0.2 s on a 20-result search ("dune", live).

**Changes from §4.4:**
- *A built book keeps its decision:* a cached book whose rows were built and which keeps the work's title in the language is not retitled by its matched edition (reviewer). Otherwise an English reader's search could say "Harry Potter and the Sorcerer's Stone" while its page says the work's title. Books never cached can still differ from their page until it's built.
- *Ranking uses the shown title,* so "Tokio blues" is an exact match for Norwegian Wood in Spanish. The alphabet check uses the live result's authors when there is one: a cached book keeps its record's spelling ("村上春樹"), which had pushed Norwegian Wood to 8th in the header's suggestions (found in the browser check; older than this phase).
- *The cache's title search* matches a book's titles in every site language (any language, like Open Library's edition titles). It runs as two queries so each can use its trigram index (`IX_BookLocalizations_Title`, new): the localized rows first, then `Books` by title or by those ids (reviewer: an OR with a subquery on the other table can't use either index). Not checked with `EXPLAIN` on a large table.
- *A query in the work's language* ("left hand of darkness" for a Spanish reader) matches the work's English edition. Results still without a title in the reader's language get one more request: `OpenLibraryClient.GetSearchEditionTitlesAsync`, `q=key:(/works/A OR /works/B…)&lang=xx`, one request for up to 100 works (0.9 s for 3, live). Rules:
  - Only works whose result lists an edition in the language are asked about, and never for English readers: a work's own title is almost always English, and its page's stored row covers the rest.
  - The time limit is 1.5 s (`BookLanguages:SearchTimeLimitMs`); after that the results show the work's titles.
  - Answers (a title, or none) are kept in memory for a day. After a failure or a late answer, searches in that language don't ask for a minute (reviewer). An answer with no `docs` is a failure, not "none".
- *The language filter:* asked for the matched edition, Open Library wants one edition that matches both the words and the language. "left hand of darkness" with `language:spa` went from 8 works to 1. So a search with a language filter (the search page's default) doesn't ask for the edition fields; its results get their titles from the second request. Without a filter the edition fields barely change the results (113 → 110 works for "left hand of darkness", the same top results).
- *Which edition titles count:* the title must read as the language. A Spanish-tagged record titled "One hundred years of solitude" doesn't, and was shown as the Spanish title of *Cien años de soledad* in the second browser check. It's also not used when the work's own title already clearly reads as the language (common words of it, none more of another): then the edition's title is a variant ("The pilgrim's progress from this world to that which is to come" for English readers), not a translation.
- *Exact title in ranking* (`bugs/search-exact-title-ignores-article.md`, fixed): titles are compared without case, accents, punctuation, "&"/"and" or a leading article (`BookLocalizer.SameName`). A result also counts as exact when its original title matches what was typed.
- *Search and page can differ* for a book not yet built: search takes the one edition Open Library returns, while the page's row is the most common title among the editions (§3.1). The stored row wins once it exists.
- *Also shown in* the header's suggestions, the import's "Find the book" and the profile's add-a-book search (one `OriginalTitleNote`: the work's title in the serif, muted, with "Original title:" for screen readers; the translated title gets `lang`).
- *Noted, not changed:* cached-only results tied on everything else are ordered by the work's title, not the shown one; the "Russian edition" label is unchanged.

**Review** (`reviewer`, 2026-10-25; nothing blocking). Fixed: the title search's index use, the built book's decision (both above). Accepted: matching every language's titles; the tie order. `argos-security` not run: the only new value in the Open Library request is `lang`, taken from a fixed list of five.

**Follow-up check** (2026-10-25, API on side ports, live Open Library, the books' stored rows removed first):
- "left hand of darkness": first in English as *The Left Hand of Darkness*; first in Spanish as *La mano izquierda de la oscuridad* over the English title, with and without `language=spa` (8 results with it).
- "norwegian wood" in Spanish: first, "Tokio blues" over "Norwegian Wood".
- "one hundred years of solitude" in Spanish: *Cien años de soledad* with no original line, 7th behind English editions filed as works of their own.
- The last rule (a work title that already reads as the language) is covered by unit tests, not re-checked live.

**Browser check** (side ports, live Open Library, Spanish):
- "La mano izquierda de la oscuridad": first is *La mano izquierda de la oscuridad*, with "Título original: The Left Hand of Darkness" under it (`lang="es"` on the title). Third is the omnibus *Los mundos de Ursula K. Le Guin*.
- "Tokio blues": first is *Tokio Blues* over "Norwegian Wood", on the search page, in the API and in the header's suggestions (desktop and 375 px).
- "left hand of darkness": *La mano izquierda de la oscuridad* comes 3rd, under a self-published "Left Hand of Darkness" listed twice.
- English: *The Left Hand of Darkness* with no original line, 4th for the same reason (`bugs/search-exact-title-ignores-article.md`).
- No console errors.

## 12. Phase 4 build notes (2026-10-25)

**How it's built:**
- *The viewer's language* is `ICurrentViewer.Language`, next to the viewer id that the hidden-content filter already reads. `CurrentViewer` takes it from the request's `Accept-Language` (through `ViewerLanguage`) and uses English outside a request. `ShowIn(language)` overrides it, as `ActAs` does for the reader. `ArgosDbContext.ViewerLanguage` passes it to repositories.
- *One rule:* `ShownBook.Title(book, language)` and `ShownBook.CoverUrl(book, language)` (Infrastructure) give that language's row, else the work's own. `Book` got a `Localizations` navigation (no migration needed).
- *Inside a query* (`Select`, `OrderBy`, `Where`), `ShownBookInterceptor`, an EF Core query interceptor, swaps each call for a correlated subquery before EF translates it. The page stays one SQL query, and the language stays a query parameter, so one cached plan serves all five.
- *On a loaded entity* (logs, list items, rounds, suggestions, writings, favourites, activity), the same calls read the row that `IncludeShown(language)` loaded with the book. It is a filtered include, at most one row per book, so the join doesn't multiply rows.
- *Every screen in the task list* goes through it, plus a few more: list cover strips, reading activity, the journal, stats rows, the reader cards' current book, taste match (sorted by the shown title), author follows' new releases, club rounds, suggestions, meetings and their calendar file, club invites, notifications, moderation reports, the import rows, the author page's readers card, and the review and list share cards.
- *A reader's own edition still wins* on their own screens: `LogCover.Url(log, language)` is their edition's cover, else the shown one.

**Decisions:**
- *Caches:* "Popular on Winged Words" and the landing showcase are cached once for everyone, so they now keep one entry per language, and `Forget` clears all five. No response cache carries a title: `ResponseCache` is only on the fixed option lists.
- *Share cards* are in the card's own language, whatever the crawler's `Accept-Language` says. `ShareCardService` calls `ShowIn` with the card's language before it loads anything.
- *Emails and notifications:* no email carries a book title today. Notifications build their text when the inbox is read, so they follow the reader's current language. `ShowIn` is the way for a future email built outside a request to use the recipient's `PreferredLanguage`.
- *Cover colours:* the job also colours the language rows' covers of books being read now, so a translated cover gets its colour on reading cards.
- *Import rows* are joined to their books, and EF doesn't apply an include through a join. So the rows for those books come in a second query, the only screen with one.
- *The author page's works* come live from Open Library. A work that's cached here shows its stored title, as search does (§4.4). Covers stay Open Library's there.
- *Left as the work's:* the account export (§4.3); matching and de-duplication (imports, author releases); text that gets stored (a buddy read's club name, a rating-wave report's reason).
- *Frontend:* nothing changed. No screen builds a title of its own or copies one into the query cache. List sorting happens in the browser on the titles the API returns, so it sorts by what's shown.

**Noted, not changed:** a create or update response reads the book from a query without `IncludeShown`, so it can carry the work's title. The screens refetch afterwards. The author page's works keep Open Library's cover. Stats break ties on the shown title, so a tie can pick a different book per language.

**Review** (`reviewer`, 2026-10-25): no missed screen and no confirmed bug. Raised: once `Book` has a `Localizations` collection, a rebuild of a tracked book might leave its detached rows in that collection, so the caller's next save would insert them again. A new test rebuilds a tracked book and saves it: one row, with or without a guard, because detaching takes a row out of the collection. So no guard was added, and the test stays. The `ShowIn` comment was reworded so it no longer promises an email use. `argos-security` wasn't run: no new external call, and the only new input is the Phase 1 `Accept-Language` header, read against the five codes.

**Tests:** `BookLanguageEverywhereTests`, with real Postgres:
- a list (items and cover strip), a shelf (with a reader's own edition) and the feed show Spanish to a Spanish viewer and English to an English one
- a review card follows its own language, not the crawler's
- a rebuilt tracked book keeps one row per language

Full suite: 1,693 passing.

**Browser check** (side ports, live Open Library; The Left Hand of Darkness and Norwegian Wood; Spanish, then English without a reload; 1280 and 375):
- In Spanish, the profile shelf and Books tab, the list page and list card, the follower's feed and reading activity, the club page, the journal and stats all show the Spanish titles. The profile shelf, list card and club page also show the Spanish cover.
- In English, the same screens show "The Left Hand of Darkness" and "Norwegian Wood".
- The long Spanish title wraps to two lines on the shelf and the club card, with no overflow. No console errors (only the 404s of a reader with no reading goal).
- Not confirmed: the feed review card's cover looked blank in one full-page capture at 375, while the API returns the Spanish cover (probably lazy loading in the capture).

## 13. Batched refresh job (2026-10-25, bugs/open-library-refuses-production.md)

Open Library refused every connection from production about two hours after Phase 1 went live, and the backfill was the likeliest cause: up to 500 books a run, each with a 500-edition request, started on every API restart. The refresh job now asks for books in batches.

**How it's built:** `BookLocalizationService.BuildBatchAsync` takes the books the run refreshed plus up to `CacheRefresh:MaxLocalizationsPerRun` never-built books, 100 at a time:
- **One search per language** (`OpenLibraryClient.GetMatchedEditionsAsync`: `search.json?q=key:(/works/A OR …)&lang=xx&fields=key,language,editions,editions.key,editions.title,editions.language,editions.cover_i,editions.publish_date`). English first, for every book. Its answer also lists the languages each work has editions in, so each other language is asked only about the works that have one. For 500 books that is at most 25 requests, where it used to be 500 of up to 1 MB. A work search doesn't know (merged or deleted) is marked failed, so it comes back in a day.
- **Wikidata:** the P648 search per book, as before (in series), then the whole batch's items in `wbgetentities` calls of 50. Open Library's own links to Wikidata are only used when the book carries them (just refreshed): asking each work for them would cost a request per book. The book page still asks.
- **Wikipedia:** the leads, as before.
- **Descriptions:** one small `/books/{edition}.json` request for the matched edition (`GetEditionAsync`), only for languages still without a description after Wikipedia. For English, only when the work has none.

**Rule changes for books built this way** (`BookLocalizer.FromMatchedEditions`; the book page keeps §3's rules over its editions):
- **Title:** the Wikidata label still comes first. Otherwise the one matched edition's title, which must pass `SearchEditionTitle`'s checks (it reads as the language and isn't the work's own written differently), so the page says what search results say. One edition can't outvote a mislabelled record the way many could: Open Library matches "One hundred years of solitude", tagged Spanish, for Cien años de soledad in Spanish, and the check leaves it out.
- **Description:** Wikipedia's lead comes before an edition's here; the book page still prefers an edition's.
- **Cover:** the matched edition's, unless it is the default cover, or the language keeps the work's title and is English or the language the title clearly reads as (Le petit prince keeps its cover for French readers). With one edition per language the old test ("the default cover is on none of the editions read") can't be made.

**Pacing:** the job waits `CacheRefresh:StartDelayMinutes` (10) after the API starts. `OpenLibraryPacingHandler` counts every refused connection, 429 and 5xx on any Open Library request (`OpenLibraryPacer.Refusals`). The run stops at the first new one, in the refresh or the build. A book whose refresh failed that way isn't postponed, and a stopped build marks nothing, so the rest waits for the next run.

**The book page** reads 100 editions instead of 500 (`OpenLibraryClient.MaxLocalizationEditions`): the same request as the default cover's. A first visit makes both. The log form's edition picker keeps 500.

**Search when Open Library is down:** see the bug file. The API answers `{ books, openLibraryUnavailable }`, and a filtered search falls back to the stored books (years applied; languages can't be, since stored rows don't know their editions' languages).

**Reviews** (`reviewer` and `argos-security`, 2026-10-25; nothing high or critical). Fixed:
- A refused run postpones the book it met (a week) and a failed description request marks its book (a day), so a work whose own request always fails can't stop every run at itself.
- A batch whose search answer can't be read (not a refusal) is marked failed for a day instead of blocking every run.
- A work whose search record lists no languages is asked about every language.
- A failed Wikidata request leaves only the books with an item in it incomplete.
- A server error counts as a refusal only on the job's own (paced) requests: a reader's odd query that makes Open Library's search answer 500 mustn't stop the job. A refused connection or a 429 counts from any request.
- A `null` in a search answer is skipped instead of failing every run.
- The search page's "isn't answering" line follows the first page only.

Accepted: one `/books/{id}.json` request per language still without a description can add up to hundreds per run. They are paced at one a second and stop at the first refusal. If Open Library asks for less, cap them per run.
