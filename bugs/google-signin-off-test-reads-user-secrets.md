# The "Google sign-in off" test fails on a machine that has a Google client ID in its user-secrets

**Priority:** P2 · **Size:** S · **Area:** Backend tests, local only · **Found:** 2026-10-23 (full backend run while building `specs/stronger-clubs.md` Phase 3) · **Status:** Open

## What happens

`GoogleSignInOffTests.NoClientId_HidesTheButton_AndTheEndpointIs404` (`test/Argos.Tests/Integration/GoogleSignInTests.cs`) expects `GoogleClientId` to be null and `POST /api/auth/google` to answer 404. The test API runs in Development, so it reads the user-secrets, and since Continue with Google was built (Apollon fe5b3e8) this machine's user-secrets hold the real client ID. The test then gets the ID and fails, every run, here only. CI has no secret, so it passes there.

## Why it matters

A local full run (and `precheck.ps1` on a push touching `src/` or `test/`) always shows one failure that isn't real, which teaches you to ignore failures, and the precheck hook may block a push for it.

## Fix

Make the test set the Google client ID to empty itself instead of relying on the environment: give `GoogleSignInOffTests` its own factory (or `WithWebHostBuilder`) that sets `Google:ClientId` to `""` in its configuration, as the "on" tests set theirs. Then check `precheck.ps1` passes on this machine.
