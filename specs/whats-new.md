# Feature Spec — What's new

**Status:** planned 2026-10-20, not started. Second of three before inviting strangers: `specs/feedback-button.md` → this → landing page Phase 3 (`specs/landing-page.md`). The landing page promises "always improving" and links here.

## 1. Problem

Winged Words changes almost every day, but readers can't see it: `CHANGELOG.md` is in a private repo and written for development. Early-access readers should see the site moving, notice what's new without hunting for it, and see that their feedback leads somewhere. Visitors deciding whether to join should see it too.

## 2. Decisions (asked 2026-10-20)

- **A public page**, readable without logging in. Linked from the landing page, the site footer and the app's sidebar.
- **A small gold dot on the sidebar link** while there's an entry the reader hasn't seen (the gold unread dot, DESIGN.md: gold is only for stars and the unread dot).
- **Entries are written on an admin page on the site**, not in the code.
- **An entry has:** a date, a title, a paragraph or more, and an optional image.
- **Languages:** English is required; the other four are optional fields. A reader sees their language when it's filled in, English otherwise.
- **Images are stored in the database**, shrunk on upload to a light WebP. No new service; backups include them.
- **The admin page can:** save a draft, publish, edit after publishing, delete, and set the date shown (needed for past updates; otherwise the publish date).
- **It starts with the last month or so:** Claude drafts 8–12 reader-facing entries from `CHANGELOG.md`, the user approves the list, then they go in through the admin page.

### 2.1 Decisions I made that need your check

1. **Text is plain paragraphs**: a blank line starts a new paragraph. No formatting, links or HTML, which keeps it safe and simple. A single "Try it" link per entry (a path on the site, like `/stats`) is optional.
2. **Image limits:** JPEG, PNG or WebP up to 5 MB; stored at most 1,600px wide as WebP (about 100–200 KB); metadata stripped. **Alt text is required** when there's an image (English required, other languages optional like the text).
3. **The dot is remembered per account**, not per browser: opening the page clears it on every device.
4. **Paging:** 10 entries a page, newest first, with Show more.
5. **URL:** `/whats-new`.

## 3. Design

### 3.1 Tables

**`WhatsNewEntries`**: `Id`, `ShownOn` (`DateOnly`, the date displayed), `PublishedAt` (`DateTime?`, null = draft), `TryPath` (`string?`, max 200, must start with `/`), `ImageId` (`Guid?`), `CreatedAt`, `UpdatedAt`.

**`WhatsNewTexts`**: `EntryId` + `Language` (key; `en`, `es`, `pt-BR`, `de`, `fr`), `Title` (max 120), `Body` (max 3,000), `ImageAlt` (max 300, nullable). An `en` row is required.

**`WhatsNewImages`**: `Id`, `Data` (`bytea`), `Width`, `Height`, `CreatedAt`. Kept apart so listing entries never loads image bytes.

**Users** gain `WhatsNewSeenAt` (`DateTime?`).

### 3.2 Endpoints

Public (the `public` rate-limit policy the landing page uses):
- `GET /api/whats-new?lang=es&before=` → published entries in the reader's language with English fallback, image URL and size (for `aspect-ratio`, so nothing jumps), the language actually shown.
- `GET /api/whats-new/images/{id}` → the WebP, only if its entry is published (admins also see drafts). Long cache headers; the id changes when the image is replaced.

Signed in:
- `GET /api/whats-new/unseen` → `{ hasUnseen }` (latest published entry after `WhatsNewSeenAt`). Fetched with the current-user data so it costs no extra round trip if that's easy, otherwise one small call.
- `POST /api/whats-new/seen` → sets `WhatsNewSeenAt` to now.

Admin (`[RequireAdmin]`):
- `GET /api/admin/whats-new` (drafts and published), `GET …/{id}` (all languages), `POST`, `PUT …/{id}`, `DELETE …/{id}`, `POST …/{id}/publish`, `POST …/{id}/unpublish`.
- `POST /api/admin/whats-new/images` (multipart) → validates the type by its bytes, decodes with SkiaSharp (`Argos.Infrastructure.Images`), resizes, re-encodes as WebP (this also strips metadata), returns the id. Unused images are deleted with their entry or when replaced.

### 3.3 Frontend

- **`/whats-new`**, a Read screen: the app layout for signed-in readers, the same shell the legal pages use for visitors. Each entry is a raised card: date (through `Intl`), title in the display face, paragraphs in the reading face (65–75 characters), the image under the title with its alt text and reserved `aspect-ratio`, then the optional "Try it" link. A note when the entry isn't in the reader's language ("Only in English for now"). Empty state for no entries. Opening the page while signed in calls `seen` and clears the dot.
- **Sidebar link** "What's new" near Settings, with the gold dot (`aria-label` includes "new updates" while it shows). **Footer link** beside Privacy, Terms and Guidelines.
- **`/admin/whats-new`**: a list (drafts first, then published, each with date and status) and an editor: date, language tabs (English marked required, a filled-dot on languages with text), title, body, alt text, image upload with preview and Remove, "Try it" path, Save draft / Publish / Unpublish / Delete (with confirmation). A preview of the entry as readers will see it.

## 4. Out of scope

Comments or likes on entries, email or bell notifications for new entries, a public roadmap or voting, links or formatting inside the text, more than one image per entry, automatic entries from commits.

## 5. Tasks

### Before building
- [ ] The user confirms or changes the decisions in §2.1.

### Backend
- [ ] Entities, configuration, migration (three tables, `Users.WhatsNewSeenAt`).
- [ ] Image processing in `Argos.Infrastructure.Images` (type check, decode, resize to ≤1,600px, WebP), with tests on a PNG, a JPEG, a too-big file and a non-image renamed `.png`.
- [ ] Repository, service, public + signed-in + admin controllers; language fallback; draft images hidden from the public.
- [ ] Error codes, translated under `errors.codes`.
- [ ] Tests: integration for publish/draft visibility, fallback, seen/unseen, admin-only, image served only when published, delete cleans up the image.

### Frontend
- [ ] `/whats-new` page (signed-in and visitor), loading, empty and error states, Show more.
- [ ] Sidebar link with the gold dot; footer link.
- [ ] `/admin/whats-new` list and editor with preview; sidebar admin link.
- [ ] All text in the five locale files.
- [ ] Tests: fallback note, dot clears after visiting, editor (English required, alt text required with an image, publish flow).

### Content
- [ ] Claude drafts 8–12 past entries from `CHANGELOG.md` (reader-facing only, English and Spanish), the user approves them.
- [ ] Screenshots for the entries that need one (`scripts/shoot.mjs`), the user approves; entered through the admin page on the live site.

### Verification & docs
- [ ] `browser-check`: visitor and reader views, dot on and off, admin create → draft → publish → edit → unpublish → delete, image upload at both widths.
- [ ] Screenshot critique round (Paper and Dark, 1280 and 375), then `design-reviewer`.
- [ ] `reviewer` and `argos-security` (file upload, admin endpoints, public endpoints), fix findings.
- [ ] `CHANGELOG.md`.
