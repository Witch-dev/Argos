# Pass: clarify

Rewrite unclear interface text so readers understand what happened, what matters and what to do next. Keep the facts, our terminology and PRODUCT.md's voice. All text lives in `web/src/locales/<lang>/*.json`: change English first, then the other four languages so they say the same thing (not a word-for-word copy).

## Audit the whole path, not single strings
Look for: vague nouns and verbs, code words leaking into the UI ("work", "log entry", "edition id"), unclear states, missing consequences or recovery, inconsistent terms or capitalisation, repeated headings and intros, text that breaks at real widths or in German, tone that ignores the moment (privacy, deletion, blocks need care).

## Message hierarchy, per state
1. The one fact the reader needs now. 2. The action available next. 3. Context that changes the decision. 4. The right tone. Say each idea once.

## By function
- **Actions:** a specific verb and object ("Add to shelf", "Show more quotes"). Destructive actions name the thing and the consequence; prefer undo over confirmation when recovery is safe; a confirmation names the action on its button, never "OK" or "Yes".
- **Forms:** persistent labels (a placeholder is an example, not a label); requirements before submitting; validation says what to fix without blaming.
- **Errors:** what failed, why (when known and useful), how to recover. No raw codes as the message (our `ErrorCodes` → `errors.codes` translations exist for this).
- **Loading:** name the real operation; never fake progress.
- **Empty states:** distinguish first use, no results, filters, no permission (private account, block) and failure; each offers the next useful step.
- **Success:** brief for routine actions; mention the next consequence only when it changes what the reader should do.
- **Help text:** answers an implicit question instead of restating the control. Link text makes sense on its own; icon-only buttons have an `aria-label`.

## Localisation
Whole translatable sentences, never glued fragments; variables named so translators can reorder them (`{{name}}`), titles passed as `Trans` components; plurals through i18next (`_one`, `_other`, `_many` where the language needs it); allow 30–40% expansion instead of abbreviating.

## Keep a glossary
When the same idea has several words across the site (shelf/library, writing/post), pick one, list it in PRODUCT.md "Capabilities and constraints" (terminology) and use it everywhere.

## Check
Understandable without product knowledge, actionable at every error and empty state, consistent terms, fits at 375px and 200% zoom, long names and German, accessible names match the visible text. As short as possible without losing meaning or recovery. Then `polish`.
