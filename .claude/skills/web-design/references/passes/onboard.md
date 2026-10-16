# Pass: onboard

Design a new reader's first visit, the empty states and the first success. The goal is reaching the moment that proves Winged Words is worth their time quickly (for most readers: logging or importing their first books and seeing them on a shelf), not teaching every feature: teach the 20% that gives 80% of the value.

## First run
- Value first; any welcome says what they'll get, honestly how long it takes, and can be skipped.
- Ask for the minimum (sign-up already does; don't add fields), with smart defaults.
- At most 1–3 concepts, taught by doing (search a book → log it → see it on the shelf), with progress shown if there are steps.
- First success is real: a book on their shelf, an import finished, a friend followed. Then a clear next step.
- Onboarding is optional and never blocks the product; it never shows again to a returning reader.

## Empty states (each is an invitation)
Each says what will appear, why it matters and the action to take, with a link to it (e.g. "Find authors" → `/search?type=authors`). Handle the variants differently:
- **First use:** emphasise the value; offer an example or the import.
- **Cleared by the reader:** a light touch, easy to recreate.
- **No results:** suggest another query or clearing filters.
- **No permission** (private account, block): explain why and how access works, without revealing anything private.
- **Error:** say what failed and offer retry.

## Progressive disclosure
Teach a feature when the reader first needs it; a tip points at the element, can be dismissed and never repeats; mark new features sparingly. No guided tours unless an interface changed a lot (then 3–7 steps, skippable, replayable).

## Avoid
Long onboarding before use, patronising or over-explaining, repeating dismissed tips, blocking the UI during a tour, tutorial modes disconnected from the real product, hard-to-find skip.

## Measure
Whether new readers reach a first logged book, how many skip, time to first value, and whether they take the next intended action. Then `polish`.
