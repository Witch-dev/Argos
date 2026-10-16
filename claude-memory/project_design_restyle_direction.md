---
name: project-design-restyle-direction
description: "Site restyle direction approved 2026-10-16 from the mockup; cream page stays, shelf effect is the signature; not yet built"
metadata:
  node_type: memory
  type: project
  originSessionId: a254cb5a-8fd7-4c3e-867f-2c2990edf233
  modified: 2026-10-16T18:28:36.608Z
---

On 2026-10-16 the user approved a restyle mockup (claude.ai artifact https://claude.ai/artifact/WEAaHS3iF7bWMXLw2HbkHZ: "Today" vs "Proposed" author page plus a style sheet). They said it "looks amazing" and especially liked **books standing on a shelf** (covers on a thin wooden shelf with spine shade and shadow): that is the signature element.

Constraints and proposal:
- **Keep the cream page background** (#f7f3e8, Paper): the user's one hard rule, for reading comfort. Everything else was open to change.
- Proposed: bookbinding green #2e5e4e for actions/links/active, foil gold #b8862b only for stars and the unread dot, a deeper paper tint #efe7d6 for header and sidebar, raised cards #fffdf8 with 14px corners and a soft shadow instead of borders, a sunken tone #f1eadc, Fraunces for display, Literata for reading text, Public Sans for UI, 44px controls with 10px corners, pills for chips, one drawn line-icon set instead of glyph characters.
- Decided 2026-10-16: **bookbinding green** accent, **paper-tint** header and sidebar, and **foundations first** (DESIGN.md, tokens, fonts, icons, shared pieces like cards/buttons/shelf, then pages one by one).
- Still open: the **display face** (Impeccable lists Fraunces, used in the mockup, as an overused default; recommended Literata at display size, to be compared on a board in Phase 1), how Dark/Sepia/other themes translate, phone layout, whether to build the cover tilt.
- 2026-10-16: the user asked to adopt "as much as possible" from Impeccable (pbakaus/impeccable, Apache 2.0); adapted into DESIGN.md (DESIGN.md format, named rules, refuse list), PRODUCT.md, 16 web-design passes, ux-review scoring/audit, the design-reviewer agent, THIRD-PARTY-NOTICES.md. Its CLI/hooks/detector are not installed; its mechanical rules become our own Vitest guards in Phase 1.

**Why:** came out of the "UI looks bland" discussion and the review of Impeccable (impeccable.style) and Anthropic's frontend-design skill; see [[feedback-review-after-each-phase]] for how phases get reviewed.

**How to apply:** treat this as the target look for any visual work; write it into DESIGN.md (and PRODUCT.md) before rolling out, then tokens and shared components first, page by page after. Don't reintroduce glyph icons or border-on-everything boxes.
