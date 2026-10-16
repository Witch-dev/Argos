# Shape: plan a new screen or feature before code

Find out what should be made and how it should work, then return a short confirmed brief. **Shape never writes code.** Use it before `new-react-feature` builds a new page or a big new component, and whenever a request is vague about purpose. Adapted from Impeccable's `shape` (Apache 2.0, see `Argos/THIRD-PARTY-NOTICES.md`).

## 1. Discovery

Ask with the question tool, 2–3 related questions per round, then wait. One round is the default; a second only if the answers leave a real gap. Don't dump a questionnaire, don't repeat settled facts (PRODUCT.md, the spec), and don't turn the obvious into menus: state the likely answer and invite correction. A precise request may need only a one-line confirmation.

**Round 1, purpose and outcome** (pick the questions that change the result most):
- What is this for, and what problem does it solve?
- Who reaches it, in what situation and mood?
- What must they understand or do there? What does success look like?
- What is true here that a generic template couldn't claim?

**Round 2, only for open material decisions:**
- What real content and data does it carry, at its minimum, typical and maximum (0 books, 12, 2,000)?
- Which states matter: first use, empty, loading, error, success, private or blocked, overflow, expert use?
- How far does it go: an exploration on the design canvas, one production screen, or a whole flow?
- What must stay untouched? What would make it feel wrong even if it looked polished?
- Binding constraints: five languages, phone width, accessibility, the free hosting tier, Open Library limits.

Never ask for CSS values or a style "lane"; DESIGN.md already decides the look.

## 2. Direction

Inside our established look (always, unless the user asks for a new one), use DESIGN.md. When the composition or interaction is genuinely open, sketch **2–3 variants on the design canvas** (the Design artifact) that differ in structure: arrangement, data emphasis, density, navigation model, where the shelf appears. Never in decoration. Let the user pick before building.

## 3. The brief

The smallest useful brief; 3–5 bullets when the task is settled, the full list only for vague or multi-screen work:
1. **Job and audience:** who arrives, their context, the kind of screen (Read, Operate, Persuade).
2. **Outcome and proof:** the primary task, what success is, real data it shows.
3. **Direction:** structure, sequence, the focal moment (if any), the shared pieces it uses.
4. **Scope:** what's in, what stays untouched, explicit non-goals.
5. **States and ranges:** realistic data sizes and the states that matter.
6. **Interaction and layout:** hierarchy, responsive behaviour, feedback and motion (intent, not CSS).
7. **Constraints and open decisions:** things a builder must not decide alone.

Put the brief in the feature's `specs/<feature>.md` (design section) when the work is big enough to have a spec, otherwise in the reply. Get an explicit OK or one round of corrections, then stop.
