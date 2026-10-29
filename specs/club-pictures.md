# Feature Spec — Club pictures

**Status:** planned 2026-10-27. One phase.

## 1. Problem

A club has no picture. On the Clubs page a club that isn't reading shows a cloth-bound book with its first letter (`specs/clubs-directory-refresh.md`), and on its own page only its name. Every club looks alike until it picks a book. The user asked on 2026-10-27 whether clubs can have a picture the way readers have avatars, without adding running costs on the cheapest Render plan.

## 2. Decisions

### 2.1 Asked 2026-10-27

- **Clubs pick from the same 33 public-domain pictures readers use** (`specs/public-domain-avatars.md`). A separate club set (libraries, reading rooms, old book illustrations) may come later (`FUTURE-IDEAS.md`).
- **No uploads.** The pictures already ship with the site (`web/src/assets/avatars/`, ~580 KB in all, also served at `/avatars/<key>.webp`). The database stores only the picture's key, as for readers. Nothing new to store, resize or moderate, and no new cost.

### 2.2 Decisions I made, for the user to confirm

- **Only the Admin sets the picture**, in the club's Settings, like the name and description (`specs/stronger-clubs.md` §2.2). "No picture" is an option and is the default, so existing clubs don't change.
- **Clubs only, not buddy reads.** A buddy read is named after its book and already shows the cover.
- **Where it shows:** a round picture beside the club's name on the club page, the join page, and the cards and rows on the Clubs page. While a club has no book cover, the cover slot on the Clubs page shows the club picture instead of the lettered book. With no picture, everything looks as it does today.
- **The link preview (WhatsApp, Discord, Reddit…):** while the club is reading, the preview keeps the book's cover, as today. That tells a friend what they'd be reading, which is the best reason to join. Otherwise the club picture, then the Winged Words card when there's no picture.
  - *Trade-off, for the user:* a club picture is a small square beside the text in WhatsApp. The Winged Words card is a large banner across the top. The picture makes the link look like *this* club, which suits a personal invite. The banner is more eye-catching and shows off the app. The name "Winged Words" stays in the preview's text either way. A large card that combines the picture, the club's name and the logo would need images drawn on the server, which uses more CPU. Not for now.
- **The picker is the readers' picker**, reused: the same grid, the caption with "Where it's from", and **Use this picture**, plus a **No picture** choice.

## 3. Design

### 3.1 Data

- `Club.AvatarKey` (`string?`, max 64). Null means no picture. Migration adds the column. No backfill.

### 3.2 Backend

- `PUT /api/clubs/{id}/picture` with `{ avatarKey: string | null }`, Admin only (the same check as the club's settings). A key not in `AvatarCatalog` is a 400 with an error code. It is its own endpoint, not a field of `UpdateClubRequest`, so an older client saving Settings can't clear the picture by leaving the field out.
- Not allowed on a buddy read (400, error code).
- `AvatarKey` added to the club DTOs the screens use: club detail, `ClubDto` (directory), `MyClubSummaryDto` (`/clubs/mine`) and the join preview.
- `ShareCardService.ClubCardAsync`: the book cover if there is one, else `{_baseUrl}/avatars/{key}.webp` with `LargeImage: false` and an alt text through `ShareCardTexts` (like `AvatarAlt`), else the site card.

### 3.3 Frontend

- `AvatarPicker` takes what it saves and its current value as props (today it calls `updateAvatar` itself), plus an optional **No picture** choice, so the profile and the club share one picker.
- Club Settings: a "Club picture" row with the current picture (or the lettered book) and **Change**, which opens the picker.
- A small `ClubPicture` (round, using `resolveAvatarSrc`, decorative `alt=""` beside the name) on the club page, join page and Clubs page; the Clubs page's `ClubCover` uses it instead of the letter when there's no cover.
- New `t()` keys in all five languages: the Settings label, **No picture**, and the share card's alt text.

## 4. Tasks

### Backend

- [ ] `Club.AvatarKey` and migration.
- [ ] `PUT /api/clubs/{id}/picture`: Admin only, `AvatarCatalog.IsValid`, null clears, buddy reads refused. Error codes in `ErrorCodes.cs` with translations under `errors.codes`.
- [ ] `AvatarKey` on the club detail, directory, `/clubs/mine` and join preview DTOs.
- [ ] Share card: cover, then club picture, then the site card.
- [ ] Tests: Admin sets and clears; a member or Moderator gets 403; an unknown key gets 400; a buddy read gets 400; the DTOs carry the key; the share card picks the cover while reading, the picture otherwise and the site card with neither.

### Frontend

- [ ] `AvatarPicker` made reusable, with **No picture**; the profile keeps working as before.
- [ ] Club Settings row and picker.
- [ ] `ClubPicture` on the club page, join page and Clubs page; `ClubCover` falls back to it.
- [ ] Translations in all five languages.
- [ ] Tests: the picker saves through the given function and offers **No picture**; Settings shows the row to the Admin only; the Clubs page shows the picture when there's no cover and the letter with neither.

### Verification

- [ ] `reviewer`; `argos-security` (a new endpoint that takes user input and a permission check).
- [ ] `web-design` critique round on the club page, Settings and the Clubs page at 1280 and 390.
- [ ] `browser-check`: the Admin sets a picture, a member sees it on the club page and the Clubs page, and the Admin clears it.
- [ ] After deploy: paste a club invite link into WhatsApp for a club that's choosing and one that's reading.
- [ ] `CHANGELOG.md`; ROADMAP box ticked.
