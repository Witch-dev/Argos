# Audit mode: technical quality, scored out of 20

A code-level audit, not a design critique: what is measurable in the implementation. Run it with "/ux-review audit <page or area>". It documents, it doesn't fix (fixes go through the web-design passes). Adapted from Impeccable's `audit` (Apache 2.0, see `Argos/THIRD-PARTY-NOTICES.md`).

**Measuring:** screenshots and numbers come from `node Argos/scripts/shoot.mjs <route> --metrics --shifts` (largest contentful paint, layout shift with the elements that moved, requests, kilobytes, long tasks). For performance numbers use a **production build**: in `Apollon/web` run `npm run build`, stop Vite on 5174 and start `npx vite preview --port 5174 --strictPort` (the API only allows that port); the dev server's request count and size are meaningless. Targets: LCP < 2.5s, CLS < 0.1 (at 375 and 1280), INP < 200ms. Layout shift caused by shared chrome (header, footer, rail) is a finding on that shared piece, not on the page.

Score five dimensions 0–4 from evidence (source, screenshots from `scripts/shoot.mjs`, Playwright measurements, Lighthouse when performance matters).

1. **Accessibility:** contrast below 4.5:1 (3:1 large text and controls), reduced-motion handled with an intentional alternative (not a global kill that removes useful feedback), missing names, roles or states, focus indicators, tab order, keyboard traps, heading order and landmarks, `div`s acting as buttons, alt text, form labels, errors and required markers.
   0 fails WCAG A · 1 major gaps · 2 partial · 3 WCAG AA mostly met · 4 AA fully met, close to AAA.
2. **Performance:** layout thrashing, animating layout properties or unbounded blur/shadow, images without lazy loading or the right size, `will-change` left on, heavy imports and dependencies, needless re-renders.
   0 severe · 1 major (no lazy loading, expensive animations) · 2 partial · 3 mostly optimised · 4 fast and lean.
3. **Theming:** colours not from tokens, broken or poor-contrast themes (all five), wrong or mixed tokens, values that don't update on theme change.
   0 hard-coded · 1 mostly hard-coded · 2 tokens used inconsistently · 3 minor hard-coded values · 4 full token use, all themes right.
4. **Responsive:** fixed widths that break, targets under 44px, broken touch gestures (drag to reorder: mouse-only handlers, no `touch-action`, drag state not cleared on cancel), sideways scroll, layouts that break with larger text, missing phone layouts. Say what produced the evidence (emulated width, synthesized touch, a real phone) and what stayed untested.
   0 desktop only · 1 many failures · 2 works with rough edges · 3 minor target or overflow issues · 4 every width, proper targets, gestures work.
5. **Implementation integrity** (most important): repeated shortcuts, drift from DESIGN.md (the quality floor, the refuse list, character icons, borders plus shadows, raw values), misleading or decorative content, structure an unrelated product could use unchanged. Keep mechanical findings (guard tests, greps) separate from judgement, and call out false positives.
   0 systemic drift · 1 major repeated failures · 2 several verified issues · 3 minor isolated · 4 coherent and intentional.

## Report (in `ux-reviews/<area>-audit.md`, same file rules as a critique)

- **Health score table:** each dimension with its score and key finding; total out of 20. Bands: 18–20 excellent, 14–17 good, 10–13 acceptable, 6–9 poor, 0–5 critical.
- **Integrity verdict first:** pass or fail, with evidence.
- **Summary:** score, issue count by priority, top 3–5, next steps.
- **Findings by priority** (P1–P3 as in the skill), each with location (`file:line`), category, impact, the standard it breaks (WCAG criterion), the fix, and the pass to use (`harden`, `optimize`, `adapt`, `polish`…).
- **Patterns:** recurring problems that point at a system gap ("hard-coded colours in 15 components → tokens").
- **What works:** practices to keep.
- **Recommended passes** in priority order, ending with `polish` when fixes were recommended.

Keep P3s few: a long tail buries what matters. Re-run the audit after fixes to show the score moving.
