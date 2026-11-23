# App.test: a late page import fails the precheck now and then

**Priority:** P2 (developers only: it blocks a push until retried) · **Size:** S–M · **Found:** 2026-11-22

## What happens

Once in a while, under the full Vitest run (`precheck.ps1`), every test passes but Vitest reports one unhandled error and exits with a failure:

```
Error: Vite module runner has been closed.
 ❯ src/pages/VisitorBooksHome.tsx  ← src/pages/BooksHomePage.tsx
This error originated in "src/App.test.tsx" test file.
```

with a jsdom "Not implemented: navigation to another Document" just before it. Something in `App.test.tsx` (which opens `/news` signed out) starts loading the lazy `BooksHomePage` chunk, and the import is still in flight when the file's environment closes. It didn't reproduce in three runs of `App.test.tsx` alone, and the retried push passed (Apollon 2c10147).

## Where to look

- What makes a signed-out `/news` render or load `/books`: the visitor routing added in specs/visitors-enter-the-app.md Phase 2 (`HomeGate`, `useSection`'s `argos.visitorSection`, `SectionsLayout`), or the auth refresh navigating away (the jsdom navigation warning).
- Fix in the test, not by hiding the error: wait for the app to settle (or mock the auth refresh) so no page loads after the test ends.

## Fixed (2026-11-22, Apollon 6b08f69)

**Cause:** not the visitor routing or the auth refresh. The header's Books/Community switch (`layout/SectionSwitch.tsx`) preloads `BooksHomePage` and `FeedPage` with a fire-and-forget `import()` when it mounts, so the switch is ready instantly. `App.test` finished as soon as the news story showed, and under a busy full run the Books import could still be loading when the file's environment closed. Signed out, nothing on `/news` sets `window.location`, so the jsdom navigation warning was most likely another file's output printed next to it.

**Fix:** after its assertion the test awaits `import('./pages/BooksHomePage')` and `import('./pages/FeedPage')`; importing a module again joins the load already under way. The app code is unchanged. Checked: App.test passed 3 times on its own, and the full Vitest run passed (195 files, 1585 tests, no unhandled errors).
