# Share links per language

**Status:** built 2026-10-23.

## 1. Why

When wingedwords.app is pasted in a chat, the preview (image, title, description) was always English. It can't follow each viewer's language: the chat app's robot fetches the page once, says no language, and the app shows that one saved preview to everyone in the chat. So the language goes in the address instead: **wingedwords.app/es** has a Spanish preview, and the person sharing picks which link to send.

Only Spanish for now, because only English and Spanish have been checked by the user. Another language is one more entry in each of the places in §2, plus its image.

## 2. How it works

- **Images:** `public/og-image.png` (English) and `public/og-image-es.png` (Spanish), 1200×630: the logo over the landing headline (`landing.json` → `headline`, one sentence per line), on Paper's page colour, reduced to 256 colours (~30 KB each). Drawn by `Argos/scripts/og-image.mjs`; run it again after the headline changes. The logo is `Argos/scripts/og/logo.png`, cut once out of the old image because the original drawing is gone.
- **The Spanish page:** at build time, the `shareLinks` plugin in `web/vite.config.ts` copies `dist/index.html` to `dist/es/index.html` with `lang="es"`, and gives the description, `og:title`, `og:description`, `og:url`, `og:locale`, `og:image` and `og:image:alt` Spanish values. If a tag it changes is missing from `index.html`, the build fails, so an English tag can't end up on the Spanish page. `index.html` also has `og:locale` (`en_US`, alternate `es_LA`).
- **nginx:** `/es` and `/es/` serve `es/index.html` directly, with no redirect and no caching, like `index.html`. Deeper paths (`/es/books`) fall back to the normal page.
- **The app:** `initLanguage` (`src/i18n/index.ts`) sees `/es`, puts the address back to `/` (the landing page) before the router reads it, and starts in Spanish, unless this browser already has a saved language (`detectLanguage`: saved choice, then the link's language, then the browser's languages, then English).

## 3. Limits

- Chat apps keep a preview for a while (days to weeks). A link already shared keeps its old preview.
- Links to a list, club or invite still get the English preview. They could get a `/es` form later if needed.

## Tasks

#### Frontend
- [x] Both images and the script that draws them (also closes the landing spec's "redraw og-image.png with the new headline").
- [x] Build step for `dist/es/index.html`; `og:locale` tags; English `og:image:alt` matches the new headline.
- [x] nginx location for `/es`.
- [x] `languageFromSharePath` and the link language in `detectLanguage`; tests in `i18n.test.tsx`.

#### Verification
- [x] `npm run build`, i18n tests, lint.
- [x] Web Docker image: `/`, `/es`, `/es/`, `/books/OL1W`, `/es/books` serve the right page; `/es` in a browser set to English opens the landing page in Spanish at `/`.
- [ ] After deploy: paste wingedwords.app/es in WhatsApp or Telegram and check the Spanish preview (Facebook's Sharing Debugger or opengraph.xyz show it without a chat).
