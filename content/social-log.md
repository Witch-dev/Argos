# Social media log

The running record of Winged Words' Instagram (`@wingedwords.app`): what has been made, what's posted, and how to make the next one. **A new session starts here.** Say "continue with the social log" or "make the next post" and Claude reads this file, `content/social-calendar-2026-11.md` and the `social-content` skill.

## How a post is made (current way of working)

- **Rules:** MARKETING.md §0 ("Language focus", "Voice on social media", "Claims to avoid") and the `social-content` skill. In short: Spanish only, Latin American, first person "yo", `wingedwords.app` on the first and last slide and in the caption, 3–5 hashtags from the pool, never "no ads" / "sin anuncios".
- **Endings:** a real question the reader answers in a sentence (e.g. "¿Cómo conociste a Margaret Atwood: por el libro o por la serie?"), plus "guárdalo para tu lista de libros por leer". Never "comenta A o B" (decided 2026-11-18).
- **Images for posts about writers and books:** real covers from Open Library, a Spanish edition first (`openlibrary.org/search.json` → `cover_i` → `covers.openlibrary.org/b/id/<id>-L.jpg`; skip covers under ~300px wide). Author photo from Wikimedia Commons with a free license (CC0 / CC BY / CC BY-SA), with a credit line under the photo ("Foto: <author>, <license>") and in the caption. Posts about the app itself keep screenshots and drawings.
- **Facts:** dates and claims checked with a web search; anything from memory is flagged to the user before posting.
- **Design:** the canvas https://claude.ai/artifact/4LgPkkNVJfQfcDbPg3wpq6, page **Español**. Cream "Paper" style (`#f7f3e8` page, `#1f1d1a` ink, `#6b665e` muted, `#fffdf8` cards), Literata headings, Public Sans text, logo top left, slide counter top right, 1080×1350. Labels (pills) must have `white-space: nowrap` or they wrap when downloaded. Single-book slides show the cover at 340×510.
- **Carousel shape that works:** cover with a big number (age, years) + author photo → one slide per book ("1 · Para empezar", "2 · Después", "3 · Para terminar", shortest to longest) → closing slide with a fact, the question, save reminder, logo and `wingedwords.app`.
- **On the canvas:** each post is a new row at the bottom of the Español page, a `title1` note above it (`e<n>`) and a teal caption sticky to its right (`ec<n>`). Rows are 1700px apart. **Next free row: boards at y = 20850, title note at y = 20520, next ids `e13` / `ec16`.**
- **Cadence (2026-11-16):** about one feed post a day at most: 2–3 carousels and 2 Reels a week, stories most days, 20–30 min a day commenting on bigger Spanish-language book accounts.

## Posts made

| Date | Post | Canvas row | Status |
|---|---|---|---|
| 2026-11-13 | Robert Louis Stevenson, born 13 Nov 1850: "si nunca lo leíste, empieza por aquí" (El diablo en la botella, Jekyll y Hyde, La isla del tesoro), Open Library covers | `ES-Stevenson-1…5` | Posted (13 Nov). Ends with the old A/B question |
| 2026-11-16 | M. John Harrison wins the Booker at 81 (The End of Everything; Luz and Caballeros de Viriconium in Spanish), his photo (Virtual Futures, CC BY 3.0) | `ES-Harrison-1…4` | Posted (16 Nov). Ends with "¿Lees ciencia ficción? sí o no" (old style) |
| 2026-11-18 | Margaret Atwood turns 87 (El cuento de la criada, Los testamentos, Alias Grace), her photo (Collision Conf, CC BY 2.0), question "¿Cómo conociste a Margaret Atwood…?" | `ES-Atwood-1…5` | Posted (18 Nov) |

Older posts on the canvas (before this log): first post variants, "why Winged Words" carousel, stories, banner, "Esto o aquello", "Cuatro detalles", question posts, "Volver a leer" carousel, "Un libro, un amigo, un mes", "Comprar vs leer", a Reel script ("5 tips para empezar a leer").

## Ideas waiting

- **Valeria Luiselli / National Book Awards** (ceremony 18 Nov 2026): post the result, especially if she won.
- **Hunger Games: Sunrise on the Reaping** film opens 20 Nov 2026: Reel "Antes de ver la película" with the book's Spanish cover (check the Spanish title).
- **Isabel Allende, Premio Planeta 2026:** *La hora antes del alba*, sequel to *La casa de los espíritus*, in Latin American bookshops since early November.
- **Reel:** "Libros que se leen en una tarde" (covers + text on screen).
- The rest of the dates: `content/social-calendar-2026-11.md` (Revueltas + Tolstoy 20 Nov, Piglia 24 Nov, José Asunción Silva 27 Nov, FIL Guadalajara 28 Nov – 6 Dec, Lispector + Nobel ceremony 10 Dec).

## After each new post

Add a row to "Posts made", move the "Next free row" numbers down by 1700 and the note ids up by one, and take the idea off "Ideas waiting". When the user says a post went up, mark it "Posted".
