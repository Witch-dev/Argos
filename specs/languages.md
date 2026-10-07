# Languages (English, Spanish, Portuguese, German, French)

## Problem

Every piece of text in the app is typed straight into the React components in English ("Follow", "Nothing here yet", "3 days ago"). The backend also sends about 62 English error messages, written into calls like `BadRequest("Choose at least one filter.")`, and the frontend shows those messages to the user as they are. So there is no way to use the site in another language.

We want readers to be able to use Argos in **English, Spanish, Brazilian Portuguese, German or French**, and adding another language later should mean adding one file, with no code changes.

## Words used in this spec

- **i18n**: short for "internationalization" (18 letters between the i and the n). It means making the app *able* to show more than one language.
- **Translation key**: a short, stable name for one piece of text, e.g. `feed.empty`. Code uses the key; each language file says what the key reads as in that language.
- **Locale**: a language code like `en` or `es`. Browsers send one, and the built-in `Intl` date and number tools take one.
- **Plural rules**: how a language changes a word for counts ("1 book" / "2 books"). They differ between languages, and some languages have three or more forms, so they can't be built by adding "s".

## Clarifying decisions

- **Languages: English (`en`), Spanish (`es`), Brazilian Portuguese (`pt-BR`), German (`de`), French (`fr`).** English stays the default and the fallback: if a key is missing in another language, the English text shows instead of a blank. The first drafts of the translations are written by Claude. The site owner reviews the Spanish as a speaker, and the Portuguese, German and French with dictionaries and by asking native speakers online. Until a language has been reviewed, it counts as a draft (see the review checklist below).
- **One version of each language, not regional variants.** Spanish is neutral `es`, with wording that reads naturally in both Spain and Latin America ("tú", not "vos"; no words that only one region uses). Portuguese is Brazilian (`pt-BR`), the largest Portuguese-speaking reading audience; a Portuguese browser setting (`pt`, `pt-PT`) also gets it. German uses informal "du" and French uses informal "tu", the usual tone for social apps. Regional variants can be added later if readers ask.
- **Library: `react-i18next`** (with `i18next`). It is the most widely used React option, handles plurals and inserting values into text (e.g. "{{count}} books"), and can type-check keys in TypeScript, so a misspelled key fails `tsc`.
- **Translation files live in the frontend** at `web/src/locales/<lang>/<section>.json`, one file per area (`nav`, `auth`, `landing`, `feed`, `clubs`, `errors`, ...), so each can be reviewed on its own. English is bundled with the app because it's the fallback. Each of the other languages is a separate file the browser downloads only when that language is picked, so a reader never downloads languages they don't use.
- **The backend sends error codes, not sentences.** `BadRequest("Choose at least one filter.")` becomes a response carrying a code like `discover.noFilter`, and the frontend looks the code up under `errors.*`. That keeps every translation in one place. During the switch, a response with no code still shows its English text, so nothing breaks while it's half done.
- **How the language is chosen**, first match wins:
  1. A logged-in reader's saved choice (stored on their account, so it follows them to other devices). It's applied **once per session**, when the login loads, never on later background reloads of the account, so a change made on another device can't switch the language under someone mid-sentence. *(From the Phase 1 review.)*
  2. The choice saved in this browser (`localStorage`, the same pattern as `useTheme`).
  3. The browser's language, if it's one we support.
  4. English.
- **The backend stores the choice** as `ApplicationUser.PreferredLanguage` (`"en"` / `"es"`, checked against an allowlist). It's **nullable**: null means "never chosen", which every account from before this feature has. On the first login, such an account takes the language the browser is showing, instead of a default English dragging a Spanish browser back to English. *(Changed after the Phase 1 review; the first version defaulted everyone to `en`.)* The main reason is emails: password-reset and confirmation emails (Stage 1 of the roadmap) are sent when the reader isn't on the site, so the server has to know which language to write them in.
- **Picker location:** next to the theme menu at the bottom of the sidebar, in the landing page's top bar, and later in Settings when the settings page exists (`specs/account-system.md`). Each language is shown by its own name ("English", "Español"), never translated, so a reader can always find theirs.
- **Dates and numbers use the chosen language.** The existing `toLocaleDateString(undefined, ...)` calls change to pass the current locale. `relativeTime.ts` switches to the built-in `Intl.RelativeTimeFormat`, which already knows every language's plural rules and phrases ("hace 3 días").
- **`<html lang>` is set to the current language** so screen readers pronounce text correctly.

## Explicitly out of scope

- **Content people write**: reviews, writings, comments, list names, club names. These stay in whatever language they were written in. Machine translation of other people's posts may come later.
- **Book data from Open Library**: titles, authors, descriptions. These come as Open Library has them.
- **Right-to-left languages** (Arabic, Hebrew). They need the whole layout mirrored, which is separate work.
- **Language in the URL** (`/es/feed`). This only helps search engines index each language. It can be added for the landing page later if needed.
- **Translating Open Library genre/subject names**, beyond the fixed genre/audience/mood lists Argos itself defines (those are translated).

## Design

### Backend

- **`PreferredLanguage` column** on `ApplicationUser`: `varchar(10)`, nullable, no default. EF migration (run against Release, per the "API is running" rule).
- **Allowlist** `SupportedLanguages` in `Argos.Domain` (`["en", "es", "pt-BR", "de", "fr"]`), the same pattern as `AvatarCatalog`.
- **`preferredLanguage` on the existing `PUT /api/users/me/preferences`** *(changed while building: that endpoint already handles account settings where a field left out keeps its value, so a separate `/me/language` endpoint wasn't needed)*. Scoped to the logged-in reader and checked against the allowlist (400 otherwise). `CurrentUserResponse` gains `preferredLanguage`.
- **Registration** accepts an optional `language` (the one the visitor was browsing in). Anything not in the allowlist is ignored (stored as null), and there's no length limit on it, so a bad value can never fail a sign-up.
- **Error codes** *(changed while building: the plan was a helper at every call site, but ~130 messages are written inside ~15 different result types across the services, and changing all of them was a large, risky refactor of shared code)*. Instead:
  - The services and controllers keep writing plain English messages, unchanged.
  - `Argos.Api/Errors/ErrorCodes.cs` lists every message once as a template with a code, e.g. `("common.contentTooLong", "Content cannot exceed {max} characters.")`. `{name}` parts are read back out of the message as params.
  - `ErrorCodeResultFilter` (a global MVC filter) turns every error response (a bare string, a list of strings, a ProblemDetails, model-validation errors) into a ProblemDetails whose `title` is the English and whose `codes` is `[{ code, params }]`, one per message. The rate limiter and the global exception handler, which write outside MVC, call `ApiProblem.WithCodes` themselves. Registration's Identity errors keep Identity's codes (`identity.DuplicateUserName`).
  - `ErrorCodesTests` scans the API's source and fails if any sentence-like string literal has no template, so a new message can't ship without a code. Four strings that never reach a reader (health checks, a startup message, an internal exception) are listed as exceptions in the test.
  - **Matching is linear-time and capped.** The patterns use .NET's `RegexOptions.NonBacktracking`, and messages over 500 characters aren't looked up (they show in English). Some messages repeat what a reader typed (a tag, a mood key). With the default engine, a crafted 10 KB value made one request take ~30 s of CPU, and one route (`GET /api/booklists/browse?tag=`) needs no login. Found by the Phase 3 security review, fixed the same day, covered by a test. *Don't add `.+?`-style templates without keeping both safeguards.*
  - **Rule for new code:** a new error message needs a template in `ErrorCodes.cs` and a translation under `errors.codes` in all five languages; the backend test and the frontend locales test both fail otherwise.
- **Emails** (once Stage 1 adds them) choose their template by `PreferredLanguage`. Nothing to build here until emails exist. This item only records the decision.

### Frontend

- **Setup:** `web/src/i18n/index.ts` initialises i18next synchronously with English (bundled), and loads the other languages with `import.meta.glob` when picked. `main.tsx` waits for `initLanguage()` before the first render, so a Spanish reader never sees English flash first. Detection (`i18n/languages.ts`) is about 20 lines of our own instead of `i18next-browser-languagedetector`, because we need to map `pt`/`pt-PT` to `pt-BR` and `es-MX` to `es` anyway. Type augmentation (`i18n/i18next.d.ts`) means `t('...')` only accepts keys that exist in the English files.
- **`useLanguage` hook**, the same shape as `useTheme`: reads/sets the current language, saves it to `localStorage`, updates `<html lang>`, and, if logged in, saves it through the preferences endpoint. After login, `AuthContext` applies the account's `preferredLanguage`, and that takes priority over the browser's setting.
- **`LanguageMenu`**: a real `<select>`, next to `ThemeMenu` in the sidebar (which logged-out visitors also see on login/register), and in the landing page's top bar. The landing one is `compact`: a globe and a short code ("PT") with the transparent select laid over it, because full names didn't fit on a phone. At phone width the landing top bar also hides its join button (the hero's big one is right below), so it fits in every language down to 320px.
- **Moving text into the language files:** go through `pages/`, `components/`, `layout/` and the text-producing helpers in `lib/` (`relativeTime`, `activitySummary`, `describeMutuals`, `checkpointDisplay`, `clubRounds`, `logStatus`, `reviewMeta`, `listSort`, `passwordPolicy`, `usernamePolicy`, ...). Helpers call `i18n.t` directly, so their signatures don't change *(changed while building: passing `t` in would have touched every caller)*. That works because `App` calls `useTranslation()`, so a language switch re-renders the whole tree (no component uses `memo`). It **re-renders, not remounts**: typed text, open dialogs and focus survive. *(The first version remounted everything below a keyed `LanguageBoundary`; the Phase 1 review showed that wiped drafts and re-ran once-per-load logic in `App`.)* If a component is ever wrapped in `memo`, it must call `useTranslation()` itself. Constants like `PASSWORD_HINT` become functions (`passwordHint()`), since a constant would be stuck in the language the file first loaded in. Include `aria-label`s, `title`s, placeholders and `alt` text, not only visible text.
- **Plurals and inserted values** always go through i18next (`t('lists.bookCount', { count })`), never `count === 1 ? '' : 's'`.
- **Dates and numbers** (`i18n/format.ts`): `formatDate`/`formatDateTime`/`formatNumber` use the site's language, except in English, where they use the browser's own locale as before (a British reader keeps "6 Oct"). Ratings and averages use `formatDecimal`, always in the site's language, so English stays "3.5" whatever the browser and Spanish gets "3,5". `formatList` gives "a, b and c" (English uses en-GB rules: no comma before "and").
- **Errors:** `api/client.ts` reads `codes` from the response and `ApiError` keeps them. `translateApiError` builds the message from `errors.codes.<code>` with the API's params, in any language but English; if any code is missing or untranslated it shows the API's English as sent. Every place that shows `error.message` gets the translated text with no other change.
- **Fixed lists Argos defines** (themes, shelf statuses, review privacy, pace/plot/severity, sort options) keep their export names; each `label` is a getter that reads the current language when shown, so callers didn't change.
- **Server catalogs** (genres, audiences, moods, content warnings) come from the API in English. `catalogLabel(kind, key, fallback)` (`i18n/catalog.ts`) translates them by their fixed key under `catalog.*`, and falls back to the server's name for a key added there but not yet translated. The content-warning search in the log form searches the translated names.
- **Tests:** the Vitest setup loads i18next with English, so the existing tests that look for English text keep passing. `locales/locales.test.ts` fails if a language is missing a key or has one English doesn't (with each language's own plural forms: Spanish, Portuguese and French also need `_many`), if a translation drops or adds a `{{placeholder}}` or `<tag>`, or if a text is empty. `i18n/i18n.test.tsx` covers detection, a page rendered in Spanish, plurals, the English fallback and the picker.
- **Switching safely** (`applyLanguage`, `useLanguage`): `applyLanguage` returns false if the language's file fails to download or a newer switch started meanwhile, and the last switch asked for wins. Nothing is saved to the account unless the switch actually happened. Saving cancels any in-flight reload of the account first, stores the server's reply, and puts the old cached value back if the save fails.
- **Rules for writing keys** (learned in Phase 1):
  - Never name a `<Trans>` tag after an HTML element that can't hold text (`<link>`, `<br>`, `<img>`, ...). i18next renders `<link>Register</link>` as an empty link followed by loose text. Use `<a>`. The locales test checks this.
  - Plurals use i18next's suffixes: `key_one` / `key_other` in English and German, plus `key_many` in Spanish, Portuguese and French.
  - French puts a non-breaking space before `: ? !` and inside `« »`.
  - Never lowercase or uppercase translated text in code: German nouns keep their capitals. When a text appears mid-sentence, give it its own key (e.g. `checkpoints.dueInline.*` next to `checkpoints.due.*`).
  - Don't borrow a key from another feature because the English happens to match (the club progress bar once reused the landing demo's and the list page's keys, and in German one of them said "you're reading"). Each place gets its own key.
  - English text stays byte-identical to what it was, apostrophes included (`isn't`, not `isn’t`); tests match it.
  - A `<Trans>` sentence must never put user or Open Library text (titles, usernames, review text) through `values`. `<Trans>` reads the filled-in sentence as markup, so a title like `Foo</cite><0>click</0>` could change the sentence's structure. Pass that text as a component instead (`components={{ title: <cite>{book.title}</cite> }}` with `<title />` in the translation). Plain `t()` output is always safe, because React escapes it. *(From the Phase 1 security review; the landing demos only pass fixed sample titles.)*

## Translation review checklist

The drafts come from Claude, so each one needs a person to check it before it counts as finished. Tick a language once it has been reviewed in the browser.

- [ ] Spanish (`es`): reviewed by the site owner
- [ ] Portuguese (`pt-BR`): dictionary + native speakers online
- [ ] German (`de`): dictionary + native speakers online
- [ ] French (`fr`): dictionary + native speakers online

## Tasks

### Phase 1: the setup, proven on one page

#### Backend
- [x] `SupportedLanguages` allowlist + `PreferredLanguage` column + migration `AddPreferredLanguage`. (2026-10-06)
- [x] `preferredLanguage` on `PUT /api/users/me/preferences` and `CurrentUserResponse`; optional `language` on register. (2026-10-06)
- [x] Tests (`LanguagePreferenceTests.cs`, 11): valid language saves, unknown language 400s and keeps the old value, left out keeps it, saving only the language leaves the other settings alone, unauthenticated 401s, register with/without/unsupported/wrong-case/too-long language. (2026-10-06)

#### Frontend
- [x] Install `i18next`, `react-i18next`; `i18n/index.ts`; typed keys. (2026-10-06)
- [x] `useLanguage` hook + `LanguageMenu` in the sidebar and the landing top bar; `<html lang>` kept in sync; account language applied after login. (2026-10-06)
- [x] `formatDate`/`formatDateTime`/`formatNumber` helpers (`i18n/format.ts`); `relativeTime.ts` moved to `Intl.RelativeTimeFormat`. (2026-10-06)
- [x] Convert the header, sidebar, theme menu, login, register and landing page (with its demo cards) fully, in all five languages. (2026-10-06)
- [x] Locales test + i18n test (Spanish page, plurals, fallback, picker saving to the account, failed save rolls back, failed download saves nothing, overlapping switches, redraw keeps typed text) + `AuthLanguage.test.tsx` (account language applied once per session; an account with none takes the browser's). (2026-10-06)
- [x] reviewer + security-review for Phase 1; findings fixed (see the notes marked "Phase 1 review" above). (2026-10-06)
- [x] Live browser check (Playwright, own API + Vite on spare ports): Spanish detected from the browser, switching redraws, sign-up saves the language, logging in on an English browser switches to the account's language, the sidebar picker saves to the account, no sideways scroll on the landing page at 375px and 320px in any language, no console errors. (2026-10-06)

### Phase 2: every page

#### Frontend
- [x] Convert pages and components, one area per pass: feed & activity · books & search · reviews · lists · clubs & checkpoints · writings & annotations · people & discover · profile · news · error/empty states. About 1,000 texts per language in 40 section files. (2026-10-07)
- [x] Convert the text-producing `lib/` helpers, the fixed option lists, and the server catalogs (22 genres, 4 audiences, 14 moods, 44 content warnings). (2026-10-07)
- [x] Replace every direct `toLocaleDateString`/`toLocaleString`/`toFixed` call with the `i18n/format.ts` helpers. (2026-10-07)
- [x] English changes, all intentional: "1 comments" → "1 comment" and other plural fixes, the review mood chips show "Dark" instead of the raw key "dark", and the spoiler warning names where a section ends ("up to chapter 10") instead of repeating "up to up to". (2026-10-07)
- [x] Live browser pass (Playwright, own API + Vite on spare ports): 18 pages × Spanish and German × desktop and phone. No sideways scroll, no raw keys, `<html lang>` right everywhere, no console errors apart from a club's members-only 403. (2026-10-07)
- [x] reviewer + security-review; findings fixed: German capitals (no more lowercasing), borrowed keys, a noun on a button, five wording fixes, English dates following the browser again, ratings in club activity, the auth provider following a language switch, landing demo titles passed as components. (2026-10-07)
- [ ] Translation review by the site owner (see the review checklist).

### Phase 3: backend error codes

#### Backend
- [x] `ErrorCodes` (131 templates) + `ErrorCodeResultFilter` + `ApiProblem`; rate limiter, exception handler and registration covered. (2026-10-07)
- [x] Model-validation messages and Identity's registration codes mapped. (2026-10-07)
- [x] `ErrorCodesTests` (6): the source scan (it found 3 messages the first inventory missed), the lookup, a bare-string error, a service error with a value, Identity codes, model validation. All 408 backend tests pass. (2026-10-07)

#### Frontend
- [x] `ApiError` carries `codes`; `translateApiError` with an English fallback; 4 client tests. (2026-10-07)
- [x] reviewer + security-review for Phase 3; findings fixed (2026-10-07):
  - The template matching could be forced to take ~30 s per request; now linear-time and capped (see Design).
  - The source scan skipped any line containing "Log" (so `LogOperationResult` and the catalogs) and missed lowercase sentences, two of which already shipped. It now skips only real logger calls and sees lowercase and interpolation-first sentences. Its limits are written down in the test.
  - Framework errors (`NotFound()`, a 500, an empty 403) get `http.<status>` codes.
  - Password-rule errors keep their numbers.
  - A 500's second sentence gets its own code.
  - Typed text with a line break still matches.
  - German and Spanish wording fixes.
- [x] `errors.codes.*` in all five languages for all 131 codes + 10 Identity codes; English generated from `ErrorCodes.cs`. (2026-10-07)
- [x] Live check: a wrong password on the login page shows the server's message in Spanish, German and English, and the response carries `auth.wrongCredentials`. (2026-10-07)

### Verification & docs
- [x] Live browser pass in Spanish and German across all pages, at desktop and phone width (see Phase 2). These run the longest: Spanish and French are ~20–30% longer than English, and German has very long single words. Check that nothing overflows or wraps badly.
- [x] Switch language logged out → register → log in on another browser: the choice follows the account (Phase 1 browser check).
- [ ] reviewer + security-review after each phase; fix findings.
- [x] Update `CHANGELOG.md`. (2026-10-07)
- [x] Add a "New features: add keys to every language file" note to `SPEC.md` conventions. (2026-10-07)

### Known gaps, left for later
- An error already on screen keeps the language it was shown in after a language switch (it's translated when it happens). Errors are short-lived, so this is left as is.
- `auth.lockedOut` has no plural forms; fine while the lockout is a fixed 15 minutes.
- Mood, content-warning and tag values sent to the API have no length limit, and some error messages repeat them back. That's harmless now that code lookup is linear and capped, but a `[MaxLength]` on those items would be tidier.
- List tags can't contain accented letters (`bugs/list-tags-reject-accents.md`), which matters more now that readers write in five languages.
- Content people write and Open Library's book data stay in their own language (out of scope, see above).
- Emails don't exist yet; when Stage 1 adds them, they pick their template by `PreferredLanguage`.
