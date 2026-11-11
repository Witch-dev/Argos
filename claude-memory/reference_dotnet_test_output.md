---
name: dotnet-test-output
description: "How to find failures in Apollon's dotnet test output (Spanish locale, xUnit v3 testing platform, huge EF logs)"
metadata:
  node_type: memory
  type: reference
  originSessionId: 8100a632-6b7d-4dda-9565-4fc7b5c57ca4
  modified: 2026-11-07T02:39:12.384Z
---

Apollon's `dotnet test` prints in Spanish and logs every EF query, so a full run is ~850k lines. Send it to a file and grep:
- failed test names: lines starting `con errores Argos.Tests...` (the assertion follows on the next lines)
- summary: `total:`, `error:`, `correcto:`, `omitido:`
- `--logger trx` is rejected (exit 5, Microsoft Testing Platform); don't use it.
- Use `ARGOS_TEST_DATABASE=<name>` to test on a private DB ([[parallel-sessions-test-db]]).
- Usage counts and active days are Chile days (`UsageCounter.Today`, since Apollon c6ff764). A test that takes "today" from `DateTime.UtcNow` for them fails between 00:00 and 03:00 UTC; three did until Apollon 60b9248 (2026-11-09). A failure in the precheck that passes on a private DB is usually another session sharing `argos_test`.

Also for screenshot critiques: `shoot.mjs --widths 375` is a desktop browser (fine pointer), so `.btn-small` shows at 36px; real phones get the 44px coarse-pointer rule in `index.css`.
