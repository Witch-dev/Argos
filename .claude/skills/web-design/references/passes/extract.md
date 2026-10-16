# Pass: extract

Turn a pattern that exists 3+ times into a shared component or token, then move every use onto it. (`StatTiles`, extracted from the year card and the Stats page, is the example.)

## Steps
1. **Know the system:** `web/src/components/` (shared pieces), `web/src/index.css` (tokens), `references/design-tokens.md`, DESIGN.md "Components". Match their naming and structure (one component + one `.module.css`, short class names).
2. **Find candidates** in the target area: repeated components (cards, rows, pills), hard-coded values that should be tokens, several implementations of the same idea, repeated compositions (empty state + link, a heading with a "See all"), repeated type combinations, repeated animation timing.
3. **Only extract what is used 3+ times with the same intent.** Two things that look alike but do different jobs stay separate. Premature abstraction is worse than duplication.
4. **Plan:** which component, its props and a few variants, which tokens (semantic names, not every value), and how each existing use migrates.
5. **Build it well:** typed props with sensible defaults, accessibility built in (semantics, keyboard, focus), all states, all themes, translated text through the caller.
6. **Migrate every use**, check each visually (`scripts/shoot.mjs`), delete the old code.
7. **Document:** add it to DESIGN.md "Components" (when it is part of the look) and to `references/design-tokens.md` (new tokens), with when to use it.

## Avoid
Extracting one-offs, components so generic they're useless, tokens for every single value, a second competing pattern next to an existing one.
