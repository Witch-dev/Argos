# List tags can't contain accented letters

**Priority:** P2 · **Size:** M · **Area:** Backend + frontend, lists · **Found:** 2026-10-06 (while translating the tag field for `specs/languages.md`) · **Status:** Fixed 2026-10-07 (see "Fix" at the bottom and `CHANGELOG.md`, "List tags accept any language's letters")

## What happens

A list tag may only use the letters a–z, digits and hyphens. A Spanish, Portuguese, German or French reader who types an ordinary word from their language as a tag is told it isn't valid:

- `fantasía`, `ciência`, `klassiker-für-kinder`, `récit` → "isn't a valid tag".

Their only way round it is to misspell the word (`fantasia`, `fuer`), and then tags in that language stop matching what people search for. Now that the site is offered in five languages, this affects every non-English reader who uses tags.

## Why

The same rule is written twice, on purpose (the frontend answers sooner, the backend enforces it):

- `Apollon/src/Argos.Api/Services/ListTagRules.cs`: `^[a-z0-9]+(-[a-z0-9]+)*$`
- `Apollon/web/src/lib/listTags.ts` (`isValidTag`): the same pattern.

## Suggested fix

- Allow any Unicode letter or digit: `^[\p{L}\p{N}]+(-[\p{L}\p{N}]+)*$`, in both places (the frontend regex needs the `u` flag).
- Normalize before comparing, so `Fantasía` and `fantasía` (and the two ways of writing `í` in Unicode) count as one tag: lower-case with the invariant culture and apply Unicode NFC, in `normalizeTag` and its backend counterpart.
- Decide whether `fantasia` and `fantasía` should be the same tag (accent-insensitive). Simplest is "no": keep them different, the tag suggestions already steer people to the popular spelling.
- Update the tests in `ListSocial.test.tsx` and the backend list-tag tests, and the error text `lists.tags.invalid` in all five language files ("letters, numbers or hyphens" stays true).

Until then, the translated example tags in the tag field avoid accents (`lists.tags.placeholder`).

## Fix

Done as suggested. Both rules now allow any Unicode letter, combining mark (needed by scripts like Hindi) or digit: `^[\p{L}\p{M}\p{N}]+(-[\p{L}\p{M}\p{N}]+)*$`. Normalizing lower-cases and then applies Unicode NFC, so `Fantasía` and `fantasía` written as "i" + a separate accent character are both stored as `fantasía`. Accents still matter: `fantasia` and `fantasía` are two tags. The error text didn't need changing. The Spanish, German and Brazilian Portuguese placeholders now show accented examples. New tests in `listTags.test.ts` and `BookListSocialTests.Tags_AreNormalised_Validated_Limited_AndReplacedOnUpdate`.
