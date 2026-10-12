# Code pass checklist

Applied to the page's `.tsx` and `.module.css` files. Report as `file:line`, one terse finding each. Mark files with nothing to report as passing. Everything here is a **Rule** finding unless noted.

Condensed from Vercel's Web Interface Guidelines (snapshot read 2026-10-11) and the accessibility chapter of `components.build`, adapted for Argos: a Vite SPA (no server rendering) shipped in five languages.

## Dropped or adapted on purpose

- *Title Case for headings and buttons*, *use "&" where tight*, *curly quotes*, *non-breaking spaces in brand names*: all English-only conventions. Argos ships en, es, pt-BR, de and fr, where Title Case is wrong. The rule here is instead: **text comes from `t('…')`; don't hardcode typographic choices in code.** Spot-check punctuation per language in the locale files.
- All **hydration** rules: no server rendering, so they don't apply.
- *Detect language from the browser, not IP*: already how the app works; only flag a regression.

## Semantics and keyboard

- Actions are `<button>`, navigation is `<a>` / router `Link`. No `onClick` on a `<div>` or `<span>`, no inline click navigation instead of a link (modifier-click and middle-click must work).
- Every interactive element is reachable and operable by keyboard. Custom widgets: menus use Arrow keys, Home/End, Escape; tabs use Arrow keys with a roving `tabIndex`; dropdowns open with Enter or Space.
- **Modals:** Escape closes, Tab is trapped inside, focus moves in on open and **returns to the opener on close**. Check `ProgressUpdateModal`, `PostComposerModal` and any new dialog.
- Headings follow a logical order (no jumping h1 → h4), and the page has one `<main>`. More than one `<nav>` means each has its own `aria-label`.
- Native semantic HTML first; ARIA only to add what HTML can't say. `aria-expanded` / `aria-controls` / `aria-selected` / `aria-checked` kept in sync with the real state.

## Focus

- A visible focus indicator on every interactive element, via `:focus-visible` (so a mouse click doesn't show a ring). Never `outline: none` without a replacement.
- Compound controls use `:focus-within` on the group.
- A sticky header, footer or overlay must not cover the focused element (the 5.5rem header is the usual suspect: check scroll-padding / `scroll-margin-top`).

## Names, labels and announcements

- Icon-only buttons have an `aria-label` (through `t('…')`) or visually hidden text. Decorative icons have `aria-hidden="true"`.
- Images have `alt`; empty `alt=""` only when decorative.
- Every form control has a label or accessible name; a placeholder is not a label.
- Async results announce politely: `role="status"` / `aria-live="polite"` for "Added to shelf", saved and loaded; `role="alert"` only for errors. `aria-busy` while loading.

## Forms

- Correct `type` and `inputmode`, a meaningful `name`, and `autocomplete` on account fields (`username`, `email`, `current-password`, `new-password`); `autocomplete="off"` on non-account fields.
- Never block paste (`onPaste` with `preventDefault`).
- Clicking a label focuses its control; checkboxes and radios share one hit target with their label.
- `spellcheck={false}` on usernames, emails and codes.
- Validate on blur for most fields (not only on submit), with the error beside the field and not just a red border or a summary at the top.
- Submit stays enabled until the request starts, then shows a pending state. Errors appear inline, linked with `aria-describedby` + `aria-invalid`, and a failed submit moves focus to the first error. Required fields are marked.
- **Unsaved changes:** a form or editor with typed text (review, writing, note, list description) warns before the reader navigates away. *(Related idea in FUTURE-IDEAS: autosave Writing drafts.)*

## Navigation and state

- The URL reflects state worth sharing or returning to: filters, tabs, sort order, pagination, the open shelf. Reloading or sharing the link restores the view.
- Destructive actions (delete, unfollow, leave club, make account private) are confirmed or undoable.

## Content handling

- Text containers cope with long content: truncation, line clamp or `overflow-wrap`. Flex children that should truncate have `min-width: 0`.
- Empty states render something meaningful, not broken UI or a blank area (through `EmptyMessage`).
- Lists over ~50 items that render all rows at once are flagged (virtualization or pagination).

## Layering and feedback

- **z-index:** values come from a small defined scale (header, sidebar drawer, popover, modal), not arbitrary large numbers like `9999`. List every `z-index` in the page's CSS and check that the stacking order matches intent (a popover must never sit under the sticky header).
- **Toasts and transient messages** for non-critical results auto-dismiss, don't stack without limit, and are announced politely. Critical errors stay until dismissed.
- **Reserve space** for content that arrives late (images, badges, counts, async messages) so nearby elements don't jump.

## Animation and motion

- A `prefers-reduced-motion` variant exists for any non-trivial animation or transition. *(Not covered by the components.build chapter; included from the Web Interface Guidelines.)*
- Animate `transform` and `opacity` only. Never `transition: all`; list the properties.
- Animations don't block interaction. Autoplaying motion longer than 5 seconds can be paused.

## Images

- `<img>` has explicit `width` and `height` (or an `aspect-ratio` container) so the layout doesn't jump. Below-the-fold images are `loading="lazy"`; the main cover on a detail page is not.
- Book covers use the larger Open Library size where they are shown large (see the "Better book covers" idea in FUTURE-IDEAS).

## Locale and numbers (high value for Argos)

- **Dates, times, numbers and relative times go through `Intl.DateTimeFormat` / `Intl.NumberFormat` / `Intl.RelativeTimeFormat`** with the reader's current language, never a hardcoded format string, `toLocaleDateString('en-US')`, or manual `.toFixed` plus a suffix. Easy to grep: `toLocaleDateString`, `toLocaleString`, `toFixed`, `getMonth`, `'en-US'`.
- No user-visible string literal in JSX or props, including `aria-label`, `title` and `placeholder` (CLAUDE.md rule; `locales.test.ts` only checks key parity, not hardcoded text).
- Plurals use the i18n plural mechanism, not `count === 1 ? … : …` in code. Layout tolerates German (about 30% longer than English).

## Touch, dark mode and theming

- `touch-action: manipulation` on tap targets to avoid the double-tap delay.
- `overscroll-behavior: contain` inside modals, drawers and scrollable popovers.
- Viewport meta does **not** disable zoom (`maximum-scale=1`, `user-scalable=no`). *(Always flag.)*
- Text sized in `rem`, not `px`.
- `color-scheme` is set for dark themes so native controls (selects, scrollbars, date pickers) match; native `<select>` has explicit background and text colours.
- Colours only through tokens. A hex value, or a colour that exists in only some theme blocks, is a finding.

## Always flag (anti-patterns)

Zoom disabled; paste blocked; `transition: all`; outline removed with no replacement; click handler on a `<div>`/`<span>`; image without dimensions; unlabeled form control; icon button without a name; hardcoded date or number format; `autoFocus` without a reason (single primary input, desktop only); an action that works only by gesture with no click or keyboard alternative.
