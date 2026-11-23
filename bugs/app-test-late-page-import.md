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
