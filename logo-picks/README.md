# Logo picks

Public-domain dachshund pictures for replacing the ChatGPT-made winged-dog logo (`FUTURE-IDEAS.md`, "Replace the winged-dog logo"). Gathered 2026-10-19 from Wikimedia Commons: 231 candidates that are public domain and from before 1931, narrowed to the 22 in `sheet.jpg` (`manifest.json` has each one's artist, year, licence and page). Left out as uncertain: an undated "Livre d'érudition" advertising card, a Punch cartoon with an unnamed artist, and a 1914 book illustration that is public domain only in the US.

## First try: number 1 with a Pegasus wing (`tries/`)

- **Dog:** "Dachshund (PSF).png", https://commons.wikimedia.org/wiki/File:Dachshund_(PSF).png, a line drawing from Pearson Scott Foresman's textbook art, which the publisher released into the public domain.
- **Wing:** cut from "Pegasus (PSF).png", https://commons.wikimedia.org/wiki/File:Pegasus_(PSF).png, from the same collection and drawing style, public domain.
- `winged-detailed.png`: the engraving, for large uses (landing page, link previews).
- `winged-solid.png`: a filled silhouette of the same winged dog with a cream gap along the wing, for small uses (header, favicon, app icon), where the fine lines turn grey.
- `plain-detailed.png`, `plain-solid.png`: the same without wings.
- `mockup.png`: header (Paper and Dark) with the name in Literata, the landing page, the app icon and favicons.
- `build_logo.py`: how they were made (crop, wing cut-out, ground line removed, recoloured to bookbinding green, silhouettes). Pillow only, no AI. Needs the two originals above next to it.

Not done yet: a tighter crop for the 16px favicon (the dog is twice as wide as tall), and the user's choice.
