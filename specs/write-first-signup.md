# Feature Spec — Write first, sign up to publish

**Status:** Planned 2026-11-05 from the user's idea; decisions confirmed by the user the same day (§2.1). Ready to build. Two phases: Phase 1 (log and review on the book page, size M), Phase 2 (comments and highlights, size S–M). Writings are left out (Phase 3 below).

## 1. Problem

A visitor on a book page who taps **Log this** today gets the sign-up box straight away (`specs/shareable-pages.md`), before writing or choosing anything. They are asked to commit before they have tried anything.

The idea: let them **do the thing first**. They pick a status, give stars, write a review. Only when they press **Publish** do we say "Create a free account to publish this". Two reasons:

- They get a taste of the app before the ask.
- Someone who has already spent five minutes on a review is much more likely to finish signing up than someone who has only seen a box. Time spent is a reason to continue.

How things are today (checked 2026-11-05):

| Piece | What exists |
|---|---|
| Visitor buttons | Book page: Log this, Want to read, Favourite, Add to list. Also Like, Comment, Follow, Join, Vote, Save/Copy list, Start a club. Each calls `signup.ask(action)` (`useSignupBox`), which opens `SignupBox`. |
| Carrying an action through sign-up | `lib/signInAction.ts`: one word from a fixed list (`SIGN_IN_ACTIONS`) goes through register, the confirmation email (`do` on the link, `SharedPageSignups.Action` on the API), Google sign-in and login, and arrives as navigation state. `useSignInAction` runs it once on the page, then clears it from history. |
| What `log` does on return | Opens the log form for the book, empty (`BookDetailPage.tsx`, the `log` handler). |
| What `comment` does on return | Opens the comment box, empty. |
| Saving text in the browser | Nothing for visitors. `localStorage` is already used for small things (theme, section, language, a What's new draft in `lib/whatsNewDraft.ts`). |

So the "remember what they wanted and finish it after sign-up" machinery is built. What's missing is a way to **let them write first** and to **bring what they wrote back**.

## 2. Decisions

### 2.1 Asked 2026-11-05

- Visitors can **start writing before they have an account**, and the account is asked for at the moment they press Publish.
- **Confirmed 2026-11-05:** the reader presses Publish themselves after sign-up; the form says up front that an account is needed; the draft counter is built; drafts last 30 days.
- Applies to the actions where a reader writes something: a log or review, comments and highlights. Writings are left out (Phase 3 below). Not to quick taps (those already work with the box).

### 2.2 Decisions I made (publish-by-hand, upfront line, counter and 30 days confirmed by the user 2026-11-05)

- **The draft stays in the visitor's browser (`localStorage`), never on the server.** No account, no row, no way to fill the database with anonymous text. The server only sees it when the signed-in reader publishes it, through the normal endpoints and checks.
- **After sign-up the form opens with the draft filled in, and the reader presses Publish themselves.** It does not publish on its own. Why: they have just made an account and haven't yet seen the privacy and language settings, the post goes through the normal checks (content language label, the planned posting limits, spoiler flag), and one more click is cheap when the text is already there. A note says "Your draft is back. Press Publish when you're ready."
- **Say it up front.** Under the visitor's form a quiet line reads: "You'll need a free account to publish. Your draft is saved on this device." Not hiding the account until the end avoids the "I was tricked" feeling that would lose people who would otherwise sign up.
- **What the visitor form has:** reading status, stars, review text, the spoiler toggle. Not the things that need the reader's own data: dates, edition, privacy choice, review questions, progress, existing-log check. After sign-up the real log form opens with the draft in those fields and the rest at their normal defaults.
- **Where it is kept:** one draft per target (a book, a review, a list…), under a key like `ww:draft:log:<openLibraryId>`, with the time it was saved. Kept 30 days, then dropped when next read. Plain text only, never rendered as HTML (it only goes into a text field), same maximum length as the real field.
- **Coming back later:** a visitor who returns to the page sees "You have a draft review. Continue" in the form's place. A **Discard draft** link is always there, and the draft is cleared when it is published.
- **A draft is restored only through the sign-up flow.** It is read back by the handler that runs after sign-in (`useSignInAction`), on the page it was written for. A signed-in reader opening that page never gets someone else's old draft, which matters on a shared computer.
- **Same words, same flow.** `log` and `comment` already exist as sign-in actions; they now open the form **with the draft**. New words are needed only for `highlight` (Phase 2). Same rules as before: a fixed list on both sides, anything else ignored, `next` must be a path on this site.
- **Confirmation email, another device:** the draft survives the email step when the link opens in the same browser (a new tab shares `localStorage`). If the visitor signs up on a computer and opens the email on their phone, the draft isn't there. They land on the page with the usual note and an empty form. This is accepted; the spec says so on the form's line ("saved on this device").
- **A reader who already has an account** can tap "Log in" in the same box. The draft still comes back after login. If they already have the book in their journal, the normal "already logged" notice (`specs/book-actions-and-author-languages.md` Phase 2) applies.
- **Counting:** the admin stats get one number, "sign-ups that came with a draft", next to the sign-up sources, so we can tell whether this works. One boolean on the sign-up row, set from the same `do` carrying a `draft` flag. Confirmed by the user: built in Phase 1.

## 3. Design

### 3.1 Data

- Browser only: `ww:draft:<kind>:<target>` → `{ savedAt, fields }`. `kind` is `log`, `comment` or `highlight`. Reading and writing it is in one file, `lib/visitorDrafts.ts`, with a version number in the value so a later change can ignore old drafts.
- Server: no new tables. One column for §2.2 "Counting" (`SignedUpWithDraft`, bool, default false) and the stats query.

### 3.2 Backend

- `SharedPageSignups.Actions`: add `highlight` in Phase 2, same fixed-list check.
- `draft` flag carried with `do` in register, confirm-signup and Google, saved on the user, counted on `/api/admin/stats`.
- Nothing else: publishing uses today's endpoints, so the content-language guess, the length limits, moderation and any posting limits apply with no new code.

### 3.3 Frontend

- `lib/visitorDrafts.ts`: `saveDraft`, `readDraft`, `clearDraft`, with the 30-day expiry, try/catch around every storage call (storage can be blocked) and a plain in-memory fallback so the form still works.
- `VisitorLogForm` (book page): status, stars, review, spoiler toggle, the "free account needed" line, **Publish** (saves the draft and opens `SignupBox` for `log`), **Discard draft**. Saves as they type (debounced).
- `LogForm`: a `draft` prop that fills the fields it has; the `log` handler passes the saved draft in and shows the "draft is back" note.
- Phase 2: the same for the comment box on a review, a writing and a list (all open to visitors to read), and for highlights.
- `SignupBox` text for `log` and `comment` says what is saved ("Your review is saved. Create a free account to publish it.").
- Translations in all five locales. Design: `PRODUCT.md`, `DESIGN.md`, a short plan before markup and a screenshot critique round (`web-design`), because this is a form a visitor meets before they know the app.

## 4. Tasks

### Phase 1 — Log and review on the book page

#### Backend
- [ ] `draft` flag with `do`; `SignedUpWithDraft` column + migration; shown on `/admin/stats`.
- [ ] Tests : the flag is saved only when `do` is a known word; an unknown `do` still ignored.

#### Frontend
- [ ] `lib/visitorDrafts.ts` with tests (save, read, expiry at 30 days, storage blocked, version mismatch ignored, clear).
- [ ] `VisitorLogForm` on the book page in place of the immediate sign-up box; autosave; "Continue your draft" and "Discard draft" for a returning visitor.
- [ ] `LogForm` takes a draft; the `log` handler restores it after sign-in and clears it once published.
- [ ] Rating alone counts as a draft (stars with no text come back selected).
- [ ] `SignupBox` wording for `log`.
- [ ] Translations in all five locales (`locales.test.ts` passes).

#### Verification
- [ ] `reviewer` pass; `argos-security` pass for the backend flag (sign-up flow) (sign-up flow).
- [ ] Browser check in a private window: open a book, press Log this, choose a status, give stars, write, press Publish, sign up, confirm by email in a new tab, land on the book with the form open and the draft filled in, Publish. Repeat with Log in for an existing account, with Discard draft, with storage blocked, and after closing and reopening the tab. A signed-in reader opening the page afterwards gets no draft.
- [ ] Compare the sign-up rate from book pages before and after (admin stats).

### Phase 2 — Comments and highlights

#### Frontend
- [ ] Comment box on a review, a writing and a list for visitors: they type, press Post, the box asks for an account, the text comes back after sign-up in the comment box.
- [ ] `highlight` word (frontend list, `SharedPageSignups.Actions`) and the same for selecting a passage and writing a note.
- [ ] Translations in all five locales.

#### Backend
- [ ] `highlight` added to the fixed list with a test.

#### Verification
- [ ] Browser check: write a comment as a visitor, sign up, post it. Same for a highlight.
- [ ] `reviewer` and `argos-security` (new `do` word).

### Phase 3 — Writings: dropped (2026-11-05)

Left out by the user's decision. `/writings` and the composer are for signed-in readers only, so a visitor has nowhere to start writing, and opening that up isn't worth it before Phases 1 and 2 show results. Sharing a Writing with someone who has no account is a separate piece: `specs/shareable-pages.md` Phase 4.

## 5. Not included

- Drafts on the server, or in an anonymous account. Considered and left out: more moving parts, more to clean up, and a spam surface.
- Publishing automatically after sign-up (see §2.2).
- Building a list as a visitor (several books and a title are more state to keep). Visitors can already save and copy lists.
- Reports, feedback, settings, imports, clubs admin: they need an account first.
