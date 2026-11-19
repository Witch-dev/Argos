# Modern web platform adoption

Source of guidance: GoogleChrome/modern-web-guidance (agent guides for current web platform APIs). Goal: replace hand-built patterns in `Apollon/web/src` with native ones where the browser now does the job, without changing how anything looks or behaves.

Status: scanned 2026-11-18 by read-only search (the guide's own `legacy-scan` CLI was blocked by the permission classifier; run it by hand if wanted: `npx modern-web-guidance@latest legacy-scan src` in `web/`). Nothing changed yet.

## Already modern (leave alone)
React 19, Vite 8, TS 6. `:has()` (16 files), container/media queries, `clamp()`, `aspect-ratio`, `dvh/svh`, `text-wrap`, CSS nesting, `color-mix/oklch`, `prefers-reduced-motion` (15 files), rem-only font sizes, `loading="lazy"`, passive scroll listeners, `isComposing` on Enter-to-submit. No moment/date-fns.

## Scan findings

| Area | Finding | Native replacement |
|---|---|---|
| Modals | 12 files with hand-built `role="dialog"`/`aria-modal` (`Modal.tsx` portal + AvatarPicker, ChallengeDialog, ConfirmBookModal, CreateClubModal, EmailConfirmation, ImportDialogs, ProgressUpdateModal, StoryViewer, WritingComposerModal, WritingDetailModal); ~24 files handle Escape by hand; no body scroll lock found | `<dialog>` + `showModal()`: focus trap, Esc, top layer, inert background, `::backdrop`, `closedby` light-dismiss |
| Menus/popovers | OverflowMenu, ThemeMenu, NotificationBell, EmojiPicker, ChatReactions, HeaderSearch, AnnotatableText popover: JS open state, Escape and outside-click handlers, `getBoundingClientRect` in HeaderSearch | `popover` attribute + `popovertarget`/invoker commands; CSS anchor positioning |
| Validation | 32 uses of manual `aria-invalid`/touched/error state; no `:user-invalid` | `:user-invalid`/`:user-valid` for styling, keep `aria-invalid` synced |
| Forms | 4 email inputs missing `autoComplete` (ForgotPassword, Register, RequestInvite, AccountSettings); 10 custom `role=switch/checkbox/radio/tab/menu/listbox` | `autocomplete` tokens; native `<input type=checkbox switch>`; native controls styled with `accent-color`/`appearance` |
| Textarea | no `field-sizing` except 1 file | `field-sizing: content` + min/max |
| Motion | 12 `setTimeout` (some animation/state timing); no `@starting-style`, view transitions, `interpolate-size` | `@starting-style` + `transition-behavior: allow-discrete` for enter/exit; same-document view transitions for route changes; `interpolate-size: allow-keywords` for height auto |
| Responsive | 123 of ~133 media queries are one `max-width: 640px` hard breakpoint; 6 JS `matchMedia` reads (NotificationBell, Feedback, Shelf, ShareButton, ClubChat) | container queries where a component sizes by its parent; keep viewport query for page chrome; JS only when state needs it |
| Theming | 5 themes via tokens, no `@layer`, no `light-dark()`, no `@property` | `@layer` (reset, tokens, components, utilities) to stop specificity fights (3 `!important` left); `@property` for animatable tokens |
| Performance | no `fetchpriority` on LCP/cover images, `<img>` often without width/height, no `content-visibility`, no `scheduler.yield` | `fetchpriority="high"` on the first cover, explicit dimensions, `content-visibility: auto` on long lists/feed cards, `scheduler.yield()` in long handlers (CSV import) |
| Dates | 73 `new Date`/`Date.now` uses, `Intl` in 14 files | keep `Intl`; `Temporal` only behind a feature check, later |
| URLs | `startsWith('https://')` (MeetingForm), `pathname.split('/')` (useSection) | `new URL()` parsing for the link check |
| Scroll | JS scroll listeners in ActivityStrip, Shelf, Feedback (show/hide on scroll) | scroll-driven animations / scroll-state container queries where supported |
| Security | 1 `innerHTML`/`dangerouslySetInnerHTML` use | review with `argos-security`; Sanitizer API or Trusted Types if the input is not fully ours |

## Rules for every task below
- Check browser support on MDN/Baseline before each item. Use only "Baseline widely/newly available" features, or add a fallback and `@supports`. Anchor positioning, `closedby`, invoker commands, `field-sizing`, scroll-state queries are the ones to check first.
- No visual change unless the design critique round says otherwise. Run `web-design` screenshot round for visual phases.
- jsdom has no `<dialog>.showModal()`; stub it in test setup once, not per test.
- Update the five locale files only if text changes (it should not).
- Review after each phase (`reviewer`; `argos-security` for the innerHTML item).

## Tasks

### Phase 1: quick wins (done 2026-11-18)
- [x] `autoComplete` on email inputs: already present on all four (the scan was wrong; grep missed it because the attribute sits on another line)
- [x] `new URL()` for the MeetingForm link check (`isHttpsUrl`); `useSection` left as is
- [x] Book covers: `loading="lazy"` + `decoding="async"` by default, `priority` prop (`fetchpriority="high"`, eager) on the book page's main cover. Width/height attributes not needed: covers are sized by `aspect-ratio` in CSS, so there is no layout shift
- [x] `innerHTML`: only in a test file, nothing to review in app code
- [-] `field-sizing: content` on textareas: skipped. Already used in ClubChat; on the other ~25 it would shrink fixed-`rows` fields, a visible change that needs a design decision
- [-] `content-visibility: auto` on feed cards: skipped. It adds paint containment, which would clip the card's `box-shadow`. Needs a padded wrapper first
- [-] `scheduler.yield()` in CSV import: skipped. Import parsing runs on the server; the browser only previews a few rows

### Phase 2: modals to `<dialog>` (done 2026-11-18)
- [x] Rewrite `Modal.tsx` on `<dialog>` + `showModal()`; props kept (plus optional `label`, `frameClassName`, `cardClassName`, `initialFocus="card"`), so its 10 existing users didn't change. Removed: the hand-written focus trap and the window Escape listener (there was no scroll lock). **Portal kept on purpose:** without it a modal opened inside a `<form>`, a link card or a menu would sit inside that element's HTML (invalid nested forms, the link's click, its inherited styles, a `display: none` parent hiding it)
  - The `<dialog>` is the transparent full-screen frame (scrolls, takes outside clicks) and the card a `<div>` inside it, so the geometry is unchanged. Base styles sit in `:where()` so a caller's class always wins
  - Escape: the browser's `cancel` → the parent unmounts it. `cancel`/`close` are filtered to the dialog's own (React bubbles them through its tree, which closed both of two stacked dialogs)
  - Outside click stays in our code: `closedby` has limited support (MDN, 2026-11-18)
  - Focus: `autoFocus` inside is kept (the closed dialog is laid out invisibly so React can focus it; remembered through StrictMode's double run), else the first control, without scrolling; back to the opener on close; to the card when the focused control disappears (a step change)
- [x] Moved the hand-built dialogs onto it: AvatarPicker, ConfirmBookModal, CreateClubModal, EmailNotConfirmedDialog, ImportDialogs, ProgressUpdateModal, WritingComposerModal, WritingDetailModal (overlay mode), StoryViewer (its draft-Escape is now a capture listener that cancels the key). **ChallengeDialog left as is:** it's an inline panel on the list page, not a modal
- [x] jsdom stub in `test/setup.ts` (`showModal`/`close`, Escape → `cancel` on the topmost dialog unless a handler prevented it); `Modal.test.tsx` added; Tab-trap assertion removed from ReportDialog's test (the browser's job now)
- [x] `::backdrop` uses `--scrim`; entrance with `@starting-style` (fade + 8px rise, `--duration-state`), exit 120ms (`--duration-feedback`, `--ease-in`) only for Esc/outside click (a caller's own button unmounts it at once); reduced motion drops the movement. `@starting-style` is Baseline newly available; without it the dialog just appears
- [x] Browser-check 2026-11-18 at 1280 and 375: open, Esc, focus return, outside click, inert page, nested (Report over a writing, Share card over progress), story viewer keys, mobile keyboard, 5 themes (Create club, Report), reduced motion. Design critique: nothing to fix. Not reached: the import search dialog
- [x] Reviewer: fixed a dialog left invisible over an inert page when the parent doesn't close it (a writing overlay with no history to go back to), the exit timer not cleared on unmount, a closed-but-mounted dialog still in the tab order, and the story viewer's keys acting when another dialog is on top. The jsdom stub's `close` event is now queued as in browsers

### Phase 3: menus and popovers (M)
- [ ] Convert OverflowMenu, ThemeMenu, NotificationBell, EmojiPicker, ChatReactions to `popover` + invoker; remove outside-click/Esc code
- [ ] Position with CSS anchor positioning (fallback for browsers without it); drop `getBoundingClientRect` in HeaderSearch
- [ ] Keep keyboard behaviour (arrow keys in menus) intact

### Phase 4: forms (M)
- [ ] `:user-invalid`/`:user-valid` styling; stop showing errors before interaction; keep `aria-invalid` in sync
- [ ] Replace custom switch/checkbox/radio widgets with native controls styled in `index.css` (check each of the 10 uses)

### Phase 5: CSS architecture and motion (M)
- [ ] Introduce `@layer` order in `index.css`; remove the 3 `!important`
- [ ] Container queries for components that size by parent (cards, shelf, club chat); leave the 640px page-chrome query
- [ ] `@starting-style` for toasts, menus, banners; `interpolate-size` for expanding sections
- [ ] Same-document view transitions for route changes (respect reduced motion)
- [ ] Replace JS `matchMedia` where CSS can do it (NotificationBell, Feedback)
- [ ] Scroll-driven/scroll-state styling for ActivityStrip, Shelf, Feedback where supported

### Phase 6: later / maybe
- [ ] `Temporal` behind feature check (not widely available yet)
- [ ] Passkeys (WebAuthn) as sign-in option: touches login, needs its own spec and `argos-security`
- [ ] Declarative Shadow DOM, WebMCP, on-device AI: not relevant now

## Verification
- `npm test`, `npm run build`, `npm run lint` per phase
- `browser-check` on every changed screen at 375px and desktop, all 5 themes
- Real-browser check in Chrome, Firefox and Safari for anything not Baseline widely available
