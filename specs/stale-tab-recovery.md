# Feature Spec — Coming back to an open tab

**Status:** built 2026-11-10 (Phase 1 page files and session renewal, Phase 2 drafts). Asked by the user: "when I'm using a page, and minimize or use another window, when I come back after a while the page says that I need to refresh, and sometimes I lose the progress of what I'm doing."

Builds on `specs/app-hardening.md` §3.8 (error boundary), §3.10 (pages load on first visit) and `specs/account-system.md` §3.2 (login token + refresh cookie).

## 1. What goes wrong today

A tab left open on the live site can break in three ways when the reader comes back:

1. **A deploy happened meanwhile.** Each page's code is its own file, downloaded the first time that page is opened (§3.10). A deploy replaces those files with new names, so a page the tab hadn't opened yet can't be downloaded. The error boundary shows "A new version of Winged Words is available. Reload to get it." in place of the page.
2. **The login token ran out and the renewal failed.** The login token lives 15 minutes (`JwtOptions.ExpirationMinutes`). Coming back, the first request (React Query refetches on focus) gets a 401 and asks `/auth/refresh` for a new one. Right after a laptop wakes, the network often isn't back yet: the refresh fails once, the request fails with "Couldn't renew your session just now", and nothing tries again until the next focus.
3. **An admin page says "Page not found".** Seen by the user on 2026-11-10 on Novedades (admin). Admin endpoints have no `[Authorize]` on purpose (a 401 would show the route exists), so an expired login token is treated as nobody and `RequireAdmin` answers 404. The client only renews on a 401, so the page took the 404 at face value and showed `NotFoundPage`.
4. **The browser unloaded the tab** (Chrome Memory Saver, Edge sleeping tabs). The tab reloads from scratch on return, with no message.

In all of these, text the reader had typed and not saved (a review, a journal note, a comment) lived only in the tab's memory and is lost on reload or on a trip to the login page.

## 2. Decisions (2026-11-10)

1. **Every page's code is downloaded in the background** once the app has loaded and the browser is idle, one file at a time. A tab then holds every page and a deploy can't break it. The whole set is small (record the size in §4). A file that fails to download is skipped; that page loads on its first visit as before.
2. **A failed renewal tries again when the failure is the network or the server**, not a refusal: after 1 s and 3 s, and if the browser says it's offline, it first waits up to 15 s for it to come back. A timeout (20 s already spent) and a 429 aren't retried. Safe with the server's 60-second reuse grace (`RefreshTokenService.ReuseGracePeriod`): a repeated refresh is at worst refused, never treated as a stolen token.
3. **A token that has run out or is about to (under 60 s left; the server allows 30 s of clock skew) is renewed before it's used:** when the reader comes back to the tab, and before any request is sent. The second one is what fixes the admin pages; the server's 404 for non-admins stays as it is. Same outcomes as a renewal started by a 401: ended → login page, suspended → login page with the reason, unavailable → nothing (the next request tries again).
4. **Drafts (Phase 2):** long text a reader types is saved in this browser as they type and offered back when the same form opens again. Privacy: saved per reader (key includes the user id), every draft removed at logout and when the session ends, and a draft older than 7 days is dropped. The form clears its draft when it saves successfully or the reader discards it.
5. **No change to the "new version" message itself.** With decision 1 it should become rare (only a deploy landing in the first seconds after opening the app).

## 3. Out of scope

- A service worker or offline mode.
- Keeping old builds' files on the server (the web image is replaced whole on each deploy).
- Drafts for short fields (titles, search boxes, tags) and admin forms.
- **The lost answer:** if the server renews the refresh cookie but its answer never reaches the browser, the browser still holds the old cookie and the session can't be renewed. Logged separately: `bugs/refresh-answer-lost-logs-out.md`.

## 4. Tasks

### Phase 1 — page files and session renewal

**Frontend**
- [x] `lib/lazyPage.ts`: `lazyPage(load)` wraps `React.lazy` and remembers the loader; `prefetchPages()` runs every loader in turn when the browser is idle. Every `lazy(...)` in `App.tsx` and `HomeGate.tsx` uses it; `main.tsx` calls `prefetchPages()` after the first render. Skipped when the browser asks to save data. The landing page stays a plain `lazy` (signed-in readers never need it).
- [x] `api/client.ts`: the refresh retries network and server failures (decision 2); `renewSessionIfExpiring()` renews a token with under 60 s left, reading `exp` from the token; `request()` calls it before sending.
- [x] `AuthContext`: on `visibilitychange` to visible and on `online`, a signed-in tab calls `renewSessionIfExpiring()` and acts on the outcome (decision 3).
- [x] Tests (`lazyPage.test.ts`, `client.test.ts`): a failing page doesn't stop the rest and nothing loads before asked; refresh retried after a network error and three times on a 503, not on a 429; waits for `online` when offline; a token near expiry is renewed, a fresh or unreadable one isn't; an expired token is renewed before the request goes out.

**Verification**
- [x] `npm test` (1430/1430), `npm run lint`, `npm run build`. All page code together: 353 files, 2.4 MB raw / about 835 KB gzipped, of which the first load is about 125 KB gzipped, so a tab fetches about 700 KB more in the background, once per deploy (the `vendor` file stays cached).
- [x] `argos-security` review (session renewal), 2026-11-10. No High/Critical. Fixed: a request waiting on the pre-request renewal fails with "signed out" if the session changed meanwhile, never goes out as the new reader; expiry is counted from when this tab got the token (`exp − nbf`, `nbf` now in the token) so a wrong device clock can't renew before every request (which would also eat the refresh/logout rate limit); a retry rechecks the session after its wait; `AuthController.Refresh` no longer fails after rotating the cookie when recording the active day throws.

### Phase 2 — drafts

**Frontend**
- [x] `lib/drafts.ts` + `useDraft(key, value, restore)`, called by the component that owns the text so it can `clear()` when its save succeeds: written after a 500 ms pause and on `pagehide`/unmount; never stores the text the form opened with or empty text (going back to either removes it); restored only into a form still as it opened, and only if the stored value has the form's shape (a string, or the form's own keys with the same types); keys `argos_draft:<userId>:<form>:<id>`; older than 7 days dropped (pruned once per page load). `clearAllDrafts()` in `endSession`, `logout`, the suspended path, restore's `ended` path, `startSession` and another tab's login; once a reader loads, other readers' drafts go (`clearOtherReadersDrafts`). A write waiting from before a clear is dropped, so a form closing at logout can't put its text back.
- [x] Wired: `LogForm` (review, private note, progress note, update note; `log:<id>` or `log:new:<bookId>`), `WritingComposerModal` (title and text; book and quote choices aren't kept), `CommentForm` through a `draft` prop for new comments, new threads and replies (`AnnotationCommentThread`, `BuddyReadPage`, `CheckpointDiscussionPage`, `CommentTree` and `AnnotationCommentNode` replies; edits and comments on a text selection aren't kept, the selection doesn't survive a reload), `HighlightComposer` (passage, page, note), the `ClubChat` composer (sending empties the box, which removes it). Closing a form keeps its draft; only a successful save or Discard removes it.
- [x] `DraftNote`: "Draft restored: your unsaved text from before." with Discard (puts the form back as it opened), `common.draftRestored` / `common.discardDraft` in all five languages.
- [x] Tests (`drafts.test.tsx`, `AuthContext.test.tsx`): restore, write on close, clear on save, Discard, opening and empty text never stored, another reader's draft never shown, nothing without a reader, expiry and pruning, wrong shape ignored, waiting write dropped after `clearAllDrafts`; cleared at logout, when another tab logs out or logs in as someone else, other readers' drafts removed when one loads. `test/setup.ts` clears drafts after each test.

**Verification**
- [x] `npm test` (1448/1448), `npm run lint`, `npm run build`.
- [x] Browser check, 2026-11-10: review typed, reload, back with the note; Discard empties it and removes the key; after logout no `argos_draft:` keys; a second reader sees nothing.
- [x] `argos-security` review (private text in browser storage), 2026-11-10. No High/Critical. Fixed: a new reader taking over without the last one logging out (login in this or another tab) left the last reader's drafts in storage (never on screen, only in DevTools). Accepted: a keystroke landing in the frame between `logout()` and the sign-out render could be written back (focus is on the logout button, no draft form there). By decision 4, text being typed when the session ends is cleared with the rest, not kept for after the login page.
