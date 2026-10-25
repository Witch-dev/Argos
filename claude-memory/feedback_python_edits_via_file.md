---
name: python-edits-via-file
description: "Multi-line Python edit scripts go in a scratchpad .py file, not a bash heredoc; and never open(p,'w') before the new text is ready"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 5db8a9ed-0571-4410-9cf3-00f3c62142fc
  modified: 2026-10-25T19:16:30.495Z
---

For multi-line search-and-replace edits in Apollon/Argos, write the Python script to the scratchpad with Write and run it with `python -I <file>`, instead of piping it through a bash heredoc.

**Why:** On 2026-10-25 (Phase 2 of book-data-in-reader-language), two long `python - <<'PYEOF'` heredocs failed in the Bash tool with "unexpected EOF while looking for matching `''", even with a quoted delimiter. In another script, a `"\ud800"` inside a normal Python string made the write throw after `open(p, 'w')` had already emptied the file (OpenLibraryWorkResponse.cs, restored from git).

**How to apply:** Build the whole new text first and assert each old string occurs once before opening the file for writing. Use raw strings or the Edit tool for text with backslash escapes. Check `git status` on a file before restoring it from HEAD, in case another change is in it.
