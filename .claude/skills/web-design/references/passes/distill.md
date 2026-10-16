# Pass: distill

Strip a screen to its essence: remove whatever doesn't earn its place. Simplicity is removing obstacles between the reader and their goal, not removing features.

## Find the essence
- What is the **one** primary goal of this screen? What is the 20% that gives 80% of the value?
- Sources of complexity: competing buttons, repeated information, too many sizes/colours/styles, everything visible at once, decoration, unclear hierarchy, too many paths forward.
- If the goal is unclear from the code and specs, ask; don't guess.

## How
- **Information:** one primary action, a few secondary, the rest tertiary or behind a clear entry point (progressive disclosure). Say each thing once.
- **Visual:** neutrals plus the green; 3–4 sizes and 2–3 weights per screen; remove borders, shadows and backgrounds that do no job; no nested cards; spacing and alignment instead of containers where they suffice.
- **Layout:** simple vertical flow where a grid isn't earning its keep; one alignment (left) per block.
- **Interaction:** fewer choices (≤ 4 visible at a decision point), smart defaults, inline editing over a modal, remove a step if possible.
- **Copy:** halve it, then halve it again; active voice ("Save changes"); no restated intros. Copy goes through `t('…')` in all five locales.
- **Code:** delete the dead CSS and components the cut leaves behind.

## Avoid
Removing functionality readers need, removing information a decision depends on, mystery instead of minimalism, flattening all hierarchy, oversimplifying something genuinely complex.

## Check and record
Faster to complete, easier to understand, nothing necessary lost. If a feature or option was removed, note why in the spec or the commit and how it can still be reached. Then `polish`.
