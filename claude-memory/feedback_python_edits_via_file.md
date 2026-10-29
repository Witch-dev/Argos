---
name: python-edits-via-file
description: "Multi-line Python edit scripts go in a scratchpad .py file, not a bash heredoc; and never open(p,'w') before the new text is ready"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 5db8a9ed-0571-4410-9cf3-00f3c62142fc
  modified: 2026-10-28T15:24:14.626Z
---

For multi-line search-and-replace edits in Apollon/Argos, write the Python script to the scratchpad with Write and run it with `python -I <file>`, instead of piping it through a bash heredoc.

**Why:** On 2026-10-25 (Phase 2 of book-data-in-reader-language), two long `python - <<'PYEOF'` heredocs failed in the Bash tool with "unexpected EOF while looking for matching `''", even with a quoted delimiter. In another script, a `"\ud800"` inside a normal Python string made the write throw after `open(p, 'w')` had already emptied the file (OpenLibraryWorkResponse.cs, restored from git).

It happened again on 2026-10-28: `open(p, "w").write(add(s))` opens (and empties) the file *before* `add(s)` runs, so a failing assert inside `add` left CHANGELOG.md empty, with another session's uncommitted line in it (rebuilt from HEAD plus that line, seen earlier in `git diff`). CHANGELOG.md is CRLF on disk, so an anchor with `\n` doesn't match.

**How to apply:** Never write `open(p, "w").write(f(s))`; assign `new = f(s)` on its own line first. Build the whole new text first and assert each old string occurs once before opening the file for writing. Use raw strings or the Edit tool for text with backslash escapes. Check `git status` on a file before restoring it from HEAD, in case another change is in it.
