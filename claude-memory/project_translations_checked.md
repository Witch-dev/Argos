---
name: project-translations-checked
description: "Only English and Spanish translations have been checked by the user; pt-BR, de, fr are unreviewed, so don't advertise five languages"
metadata:
  node_type: memory
  type: project
  originSessionId: 2baaac6c-14d9-404a-b140-b3b43464eaba
  modified: 2026-10-20T23:20:38.992Z
---

As of 2026-10-20 the user has personally checked only the English and Spanish texts. Brazilian Portuguese, German and French exist in all locale files but nobody has reviewed them.

**Why:** the user declined to advertise "five languages" on the landing page for this reason.

**How to apply:** don't claim five languages in marketing or landing copy (MARKETING.md, landing page) until the user says the others are checked; still add every key in all five files (locales.test.ts requires it). Related: [[project-argos-launch-roadmap]].
