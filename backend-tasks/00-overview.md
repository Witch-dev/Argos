# Argos Backend — Learning Path

This folder breaks the Argos backend (see `SPEC.md` at the repo root) into progressive modules. It exists for one purpose: **you learn the .NET and software-engineering ideas behind the backend, one small piece at a time.**

**How the work actually happens:** I write the code — you don't need to type it. But I write it in small pieces, and before I touch any file I explain, in plain language, what the change is and why we're making it. I then wait for you to say go ahead before I write anything. Nothing gets implemented silently or in a big batch. Your job is to follow along, ask questions, push back if something doesn't make sense, and understand *why* each piece exists — not to produce the code yourself.

**On explanations:** assume nothing. I won't take prior knowledge for granted, and I'll define a term in plain words the first time it comes up rather than assuming you already know it. If an explanation is still too dense, too fast, or uses a word you don't recognize — say so. That's not slowing things down, that's the actual point of working this way instead of just handing you a finished backend.

## How each module works

Every module (`01-...md`, `02-...md`, ...) follows the same shape:

- **Concepts you'll learn** — the .NET/software-engineering ideas the module is really about.
- **Why this matters** — the reasoning and trade-offs a working engineer would weigh, not just "how".
- **The task** — what we're going to build, in plain terms, mapped to the relevant `SPEC.md` section. The module file itself doesn't contain the code — when we actually work through it, I'll break this task into small steps, explain each one, and write it once you've said it's okay.
- **Done when** — a checklist mixing "it works" with "you can explain why it works this way" — the second half matters more than the first, since the point isn't a working backend you can't account for.
- **Go deeper (optional)** — concepts worth researching further if you want more than the minimum.

## Order

Modules are numbered in build order — each one assumes the previous ones are done. The order isn't just SPEC.md's phase order (§9); it's arranged into four arcs, each building on the last:

**Arc 1 — Foundations (01–04):** the pieces every feature will sit on — solution structure, dependency injection, domain modeling, EF Core, migrations, the repository pattern. Nothing user-facing works yet; this is the substrate.

**Arc 2 — First complete slice (05–07):** one real, working feature (book search/detail) built all the way through — external integration, service layer, REST API. By the end of module 07 you have a full, working vertical slice, end to end.

**Arc 3 — Professional habits, learned once and reused forever (08–09):** cross-cutting concerns (logging, error handling, middleware) and testing strategy — applied to the one feature you already have, *before* building anything else. This is the deliberate reordering: rather than bolting testing and observability on at the very end (the common junior-developer trap), you learn them right after your first working feature, then every module from here on treats "logged and tested" as part of what "done" means, not a separate final pass.

**Arc 4 — Every remaining feature, with the Arc 3 habits baked in (10–14):** auth, Logs, the social graph/feed, Lists, and background jobs. Each module's task explicitly calls back to modules 08–09 so the habit compounds instead of fading.

**Arc 5 — Shipping it (15–17):** API contracts/documentation, deployment readiness, and a final review pass across the whole backend.

| # | Module | Arc | Maps to SPEC.md | Status |
|---|---|---|---|---|
| 01 | Solution architecture & dependency injection | Foundations | §5, §9 Phase 0 | ✅ Done |
| 02 | Domain modeling & EF Core fundamentals | Foundations | §7, §9 Phase 1 | ✅ Done |
| 03 | Migrations & schema evolution | Foundations | §7, §9 Phase 1 | ✅ Done |
| 04 | Repository pattern & data access | Foundations | §5, §9 Phase 1 | ✅ Done |
| 05 | External integration & caching (Open Library) | First slice | §5, §8, §9 Phase 1 | ✅ Done |
| 06 | Service layer & business logic | First slice | §5, §9 Phase 1 | ✅ Done |
| 07 | REST API design & controllers | First slice | §5, §9 Phase 1 | ✅ Done |
| 08 | Cross-cutting concerns (logging, errors, middleware) | Professional habits | throughout | ✅ Done |
| 09 | Testing strategy | Professional habits | §8, throughout | ✅ Done |
| 10 | Authentication & authorization | Every remaining feature | §5, §9 Phase 2 | ✅ Done |
| 11 | Full vertical slice: Logs feature | Every remaining feature | §4, §7, §9 Phase 3 | ✅ Done |
| 12 | Social graph & query design (Follows/Feed) | Every remaining feature | §7, §9 Phase 4 | ✅ Done |
| 13 | Lists & relational modeling | Every remaining feature | §7, §9 Phase 5 | ✅ Done |
| 14 | Background jobs & hosted services | Every remaining feature | §5, §8 | ✅ Done |
| 15 | API contracts & documentation | Shipping it | throughout | ✅ Done |
| 16 | Deployment readiness | Shipping it | §9 Phase 6 | ✅ Done |
| 17 | Wrap-up & review | Shipping it | §9 Phase 6 | ⬜ Pending |

For a theme-based (rather than build-order) map of everything you'll learn — and how it connects to moving from junior to mid-level — see `LEARNING-GUIDE.md` in this folder.

**Starting a new session with no memory of prior ones?** This table is the first thing to check — it tells you which module to open next. Each module file (`01-...md` etc.) has its own `## Progress` section with a `Status` and, once `Done`, a plain-language summary of the actual decisions made while building it (not just "what the module says to do" — the *real* choices, including anything that deviated from the module's suggestion). Read that before continuing a module, so you're not re-deciding something already settled. The actual code lives in a separate repo (`C:\Users\jramo\Apollon`, see its `git log` for the literal diffs) — these files record the *reasoning*, which `git log` doesn't.

## How to work through a module

1. We start with the module's "Concepts" and "Why this matters" sections — I'll walk through them in conversation, in plain terms, before any code gets written. If a concept doesn't click, say so and I'll explain it a different way — that's normal, not a setback.
2. I break "The task" into small steps. For each step, before writing anything, I tell you: what file(s) I'm about to create or change, what's going in them, and why — in plain language, without assuming you already know the surrounding concepts.
3. You say go ahead (or ask questions, or ask for a simpler explanation) before I write the code for that step.
4. Once a step is written, I explain what the code actually does, so you're not just watching files appear — you should be able to point at any line and say what it's for.
5. When a module's task is fully done, it's a good checkpoint to run the `reviewer` agent (and `security-review` for anything touching auth or user input) against the diff — I'll walk through their findings with you the same way, rather than just applying fixes silently.
6. Before moving to the next module, you should be able to explain the "Done when" checklist back in your own words. If you can't, that's a sign to slow down, not a sign to move on anyway.
7. Keep the module's `## Progress` section (and the status table above) up to date as we go — set it to In Progress when we start, and to Done with a decisions summary once it's actually finished. This is what makes a fresh session (with no memory of this conversation) able to pick up correctly instead of re-deciding things or redoing work.

## What this path deliberately skips

Frontend work is out of scope here — SPEC.md's frontend features come after the backend is complete, per your instruction. This path also doesn't cover Phase 2/3 features (recommendations, notifications, mobile) — it stops at a complete, working MVP backend, matching SPEC.md §4's Phase 1 feature set plus the supporting engineering (testing, deployment) around it.
