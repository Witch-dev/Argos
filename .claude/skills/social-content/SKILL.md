---
name: social-content
description: Use to write and design social media posts for Winged Words — Instagram carousels, single posts, stories, Reels/TikTok scripts, captions, alt text, hashtags, a week's plan, or the profile bio. Triggers on "/social-content", "make a post about X", "write an Instagram caption", "carousel for X", "story for X", "Reel/TikTok idea", "what should we post", "plan this week's posts". Spanish first, English second, one account. Produces drafts on the design canvas plus the caption text for the user to approve; it never posts anything. Not for the landing page copy (that is `specs/landing-page.md`) or in-app share cards (`MARKETING.md` §2).
---

# Social content for Winged Words

Adapted from Corey Haines' **marketingskills** (MIT); see `upstream/README.md` and `THIRD-PARTY-NOTICES.md`. His advice lives unchanged in `upstream/`. This file only adds what's specific to Winged Words. **When the two disagree, this file wins** (for example, we never post from here, and his LinkedIn/X advice, posting frequencies and "product-marketing.md" context file don't apply).

The person posting is one independent maker with a small account. Write as that person: plain, warm, specific, a bit bookish. No hype.

## Step 0 — Read first

1. `C:/Users/jramo/Argos/MARKETING.md`, **§0 Positioning** (the lead idea, strengths and how to say them, weaknesses, **Claims to avoid**) and **Language focus: Spanish first**. These are decisions the user made; don't argue with them in a post.
2. `C:/Users/jramo/Argos/PRODUCT.md` (who the readers are) and the colour and type sections of `DESIGN.md`.
3. From `upstream/social.md`: **Hook Formulas** and **No AI Tells**. Then, by format:
   - carousel → `upstream/references/carousel-frameworks.md` (pick the framework before writing slides)
   - Reel / TikTok → `upstream/references/short-form-video.md`
   - single post or caption ideas → `upstream/references/post-templates.md`
   - Instagram/TikTok specifics → the Instagram and TikTok parts of `upstream/references/platforms.md` and `platform-limits.md`
4. Before handing anything over: the self-check in `upstream/copywriting-ai-tells.md`.

## Step 1 — The brief

Ask only what isn't clear from the request (one short question at most):
- **Goal:** recruit early-access readers (anyone can sign up, no invite), show one feature, a reading prompt that invites replies, a seasonal moment (year in books in Dec/Jan), or an update.
- **Format:** carousel (1080×1350, 4–8 slides), single post (1080×1350), story (1080×1920), Reel/TikTok (script + shot list, 9:16). Instagram first; TikTok reuses the same material.
- **One idea per post.** If the request holds three features, suggest three posts.

For a weekly plan: 2–3 posts a week is enough for one person. Use the pillars in `MARKETING.md` §0 (two sides, moving in loses nothing, free, spoiler-safe clubs, reading prompts that ask readers about their books) instead of upstream's SaaS example.

## Step 2 — Write

- **Spanish first, then English.** Neutral Spanish with *tú*, no words used only in Spain or in one country. Write the English as its own text, not a word-for-word translation; same facts, same order.
- **Only true claims.** Every feature named must exist today; check the code in `C:/Users/jramo/Apollon` or the spec if unsure. No numbers, quotes, testimonials or reader counts we don't have; mark a gap as `[NEED: …]` instead of inventing it.
- **Never:** "No AI", "five languages" (at most "also in Spanish" in English posts), "app" for the site (say "add it to your home screen"), competitor names except as import sources (Goodreads, StoryGraph).
- **Hook on slide 1 / the first line.** Specific to books and readers, not a generic formula filled in.
- **Ending:** one clear action: "link in bio", a real question for the comments, or "save this for later". Not "Thoughts?".

## Step 3 — Design

Posts live on the design canvas https://claude.ai/artifact/4LgPkkNVJfQfcDbPg3wpq6 (a Design artifact). Read it with the Artifact tool and follow the canvas's own `SKILL.md` before changing it.

- **Copy an existing artboard as the template** (`project/ES-Carousel-2-Import.dc.html` for a 4:5 slide, `project/ES-Story-Question.dc.html` for a story): Paper colours (`#f7f3e8` page, `#1f1d1a` ink, `#6b665e` muted, `#fffdf8` card), Literata for headings, Public Sans for text, the logo blob already uploaded, the slide counter top right. Same layout on every slide of a carousel (upstream's "one visual template" rule).
- **Names:** `ES-<Post>-<n>` and `<Post>-<n>` (English), in their own row on the canvas, Spanish row first.
- **Text size:** headings 72–100px, body at least 28px; it's read on a phone.
- **Images, only these:**
  - Screenshots of the real site, made with `node C:/Users/jramo/Argos/scripts/shoot.mjs` (or the `browser-check` skill for states that need data), **with seeded test readers only**: never a real reader's name, avatar or review without their written OK.
  - The public-domain title pages and art already on the canvas, or other public-domain/CC0 art with its source noted.
  - **Never** AI-generated images, and never Open Library covers of modern books.
- English slides go after the Spanish ones in the same carousel when there's a lot of text; a story's English version is the next story.

## Step 4 — Caption, alt text, hashtags

Give the user this text, ready to paste:

```
[Spanish caption]
———
[short English version]

[3–5 hashtags]
```

- **Hashtags:** 3–5 per post in total (Instagram and TikTok cap at 5), picked from the pool in MARKETING.md. Usually 3 Spanish + 1–2 English.
- **Alt text** for every image, in Spanish and English: what the slide shows and its main words, under ~250 characters.
- For a Reel/TikTok: the on-screen text per beat, the spoken line (if any), and the cover frame.

## Step 5 — Check, then hand over

Go through this list and fix what fails:
- [ ] AI-tells self-check from `upstream/copywriting-ai-tells.md` run on both languages (no "no es X, es Y", no emoji bullets, no em dashes, no one-line-per-sentence captions).
- [ ] No claim from "Claims to avoid"; every feature named exists.
- [ ] Spanish accents and ¿¡ marks are right; neutral Spanish.
- [ ] Images follow Step 3 (no AI art, no modern covers, no real readers).
- [ ] Hashtags 3–5; alt text in both languages; the action at the end is clear.

Then give the user the canvas link and the caption block. **Nothing is posted or scheduled from here**: the user reads it, especially the Spanish, and posts it themselves.
