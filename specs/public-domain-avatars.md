# Public-domain avatars

## Problem

The 47 preset avatars (24 dachshunds, 23 reading animals, `specs/avatar-picker.md`) were made with AI. Readers dislike AI art and it could cause a backlash once Winged Words is public. A real illustrator is out of budget for now (`FUTURE-IDEAS.md`, "Replace the AI-made avatars").

Replace them with 33 public-domain illustrations the user chose on 2026-10-19 from 88 candidates: Beatrix Potter, Tenniel's Alice, Louis Wain, medieval bestiaries, Kuniyoshi, Jessie Willcox Smith, and paintings of people reading. When a reader picks one, show where it comes from (title, book, artist, year), so the "made by real artists, not AI" story tells itself.

## Decisions

- **The 33 images** are listed in `avatar-picks/manifest.json` (this folder): title, credit, licence, Wikimedia source page, link to the full-size original, and the crop the user approved. `avatar-picks/crops/` has 256px previews of each crop. All 33 are public domain worldwide: published before 1931 by artists who died before 1956. None of the three with unconfirmed dates were picked.
- **The old 47 go away completely.** Their files, keys and the source sheets in `web/art-sources/` are removed (they stay in git history).
- **Readers who chose an old avatar are reset to no avatar.** They see their initial, as before they picked one, and can choose again. Few readers exist before the closed beta, so a reset is simpler and more honest than auto-assigning a new picture.
- **New keys describe the picture**, e.g. `tom-kitten-book`, `cheshire-cat`, `wain-black-cat`. They are short, stable and in kebab-case. The backend allowlist and the frontend map must list the same keys.
- **Captions are English only for now** (user, 2026-10-19). A caption is data about the image, like a book title from Open Library, so it lives in the avatar catalog, not in `t()`. Only the fixed words around it ("Where it's from", the picker's labels) go through `t()` in all five languages. Translated captions (each book's published title per language) are a later decision.
- **Caption shape:** `Tom Kitten · The Tale of Tom Kitten · Beatrix Potter, 1907`. That is the subject, then the book or work it comes from (left out when it isn't from a book, e.g. a painting), then the artist and year. A "Where it's from" link opens the Wikimedia page in a new tab.
- **Peter Rabbit is a trademark** (Frederick Warne). The pictures are free to use as avatars, but never as the app's logo or in marketing.

## Out of scope

- Translated captions.
- A caption on other people's avatars (e.g. a tooltip on a profile). A possible later touch.
- Uploading your own photo (`FUTURE-IDEAS.md`, "Making money").
- Any other AI-made art in the app (e.g. the landing page mascot). Check it separately (see Verification).

## Backend

- [x] `AvatarCatalog.ValidKeys` lists the 33 new keys and nothing else. Update its comment (no more sheet tiles).
- [x] Migration: set `AvatarUrl` to null for every user whose value is an old key (`dachshund-%` or `reader-%`). Plain SQL in the migration, no app code.
- [x] Tests: a new key is accepted, an old key (`dachshund-07`) is now rejected with 400, and the migration's reset (a user with an old key ends up with null). Update `UsersControllerTests` where it uses old keys.

## Frontend

- [x] **Images.** Download each full-size original (`original` in the manifest) and crop it with the manifest's `crop`: a square whose side is `scale × the shorter edge`, centred at (`centerX × width`, `centerY × height`) and pushed back inside the image if it overflows. A `scale` above 1 means pad the image first with its bottom-left corner colour by `(scale − 1) / 2 × the shorter edge` on every side, then take the full square. Save a 256×256 WebP as `web/src/assets/avatars/<key>.webp`. Keep the script in `web/art-sources/` so the set can be rebuilt. Compare each result with `avatar-picks/crops/<n>.webp`.
- [x] **Catalog.** `avatarPresets.ts` becomes a list of `{ key, src, subject, work?, artist, year, sourceUrl }` in the picker's order, written from the manifest: Potter first, then Alice, then the other storybook animals, then readers and paintings. Keep `resolveAvatarSrc` and the "unknown value is a literal src" rule. Each picture's `alt` is its subject (English data, as above).
- [x] **Picker.** The grid stays pictures only. Selecting an image no longer saves on click. It selects the image, shows a larger preview with the caption and the "Where it's from" link, and a **Use this picture** button saves it. The current avatar is preselected with its caption. Keep Escape and Cancel. New `t()` keys (all five languages): the button, the link, and an `aria-label` for the preview.
- [x] **Credit.** One line under the grid: "Pictures from public-domain books and paintings" (through `t()`).
- [x] Remove the old 47 files and the `web/art-sources/` sheets they were cut from.
- [x] Tests: `AvatarPicker.test.tsx` covers that all 33 render, selecting shows the caption and link, "Use this picture" calls the mutation with that key, and the current avatar is preselected.
- [x] `/web-design` critique round on the picker (`scripts/shoot.mjs`), phone and desktop, light and dark.

## Verification and records

- [x] `browser-check`: as a seeded reader with an old key, the avatar shows the initial. Open the picker, select a picture, check the caption and link, save, reload, and check the header and profile.
- [x] Look for any other AI-made art still in the app (landing mascot, empty states, `web/public/`, `brand/`) and list it in `FUTURE-IDEAS.md` if found.
- [x] `THIRD-PARTY-NOTICES.md` (Apollon): one entry per image with title, artist, year, "public domain", and the source URL.
- [x] Update `FUTURE-IDEAS.md` ("Replace the AI-made avatars") to point here, `specs/avatar-picker.md` to say its art was replaced, and `CHANGELOG.md`.
- [x] `reviewer` pass at the end (the migration and the key allowlist).

## Built (2026-10-19)

- **Caption on separate lines, not a middle-dot string.** DESIGN.md bans "A · B · C" strings joining different kinds of fact, so the preview shows the subject (serif), the work (italic, left out when there is none), then "artist, year" (muted), in the order the spec asked for.
- **Potter endpapers** (Peter Rabbit, Benjamin Bunny, Tom Kitten, Jemima Puddle-Duck and Old Brown holding books) are captioned "Endpaper of Beatrix Potter's little books", c. 1905, which is what the pictures are, rather than each character's tale and its year.
- **Nicoline Tuxen's painting** has no exact date; Wikimedia gives "before 1931", which is the caption's year.
- **Keys and captions** live in `Apollon/web/art-sources/avatars.json` (written from `avatar-picks/manifest.json`), which feeds both `build_avatars.py` and the generated `web/src/assets/avatarPresets.ts` (the catalog stayed in `assets/`, where it was).
- **Picker:** "Use this picture" stays disabled until a picture other than the current one is selected. With no avatar (or an old key), the preview asks the reader to pick one (an extra `t()` string). The picker's shell moved to the restyled modal look (raised, card corners, quiet Cancel), and "Where it's from" is a plain green link with the drawn arrow (a sunken pill vanished inside the sunken preview).
- **Migration** `ResetAiAvatars` exposes its SQL as `ResetSql`, which the integration test runs against readers with old keys. On the dev database it reset 36 readers.
- **Other AI-made art:** the winged-dog logo was made with ChatGPT (an OpenAI-signed C2PA record in the original file, checked 2026-10-19); listed in `FUTURE-IDEAS.md` to replace. The landing covers are scans of real first editions.
- **Credits** in `Apollon/THIRD-PARTY-NOTICES.md` (new; Argos's own notices file is for the design workflow).
