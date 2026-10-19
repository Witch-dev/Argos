# UX review — Settings (`/settings`)

Reviewed: 2026-10-18 · Themes: all five (Paper, Dark at both widths; the rest on contact sheets) · Widths: 375, 1280 · Reader: logged in, no display name or picture · Apollon at `be32e1c`
Screenshots looked at: Profile at the top and 700px down; Account, Security, Notifications and Privacy & data full page at 1280 Paper and 375 Dark. Tab walk at 1280 Paper. Not captured: notifications page, import, delete account (Phase 3 checked them; design-reviewer: ship).
Code read: `pages/settings/*`, `ReadingPrivacyBulk.tsx`, `Switch`.

## Summary

Settings is in good shape: pill tabs, raised cards, the shared Switch with the whole row as the tap target, the bulk privacy change confirmed in place, Delete account in danger ink. Only small things remain.

## Scores

**Nielsen: 31/40 (good).** Scored 2: help (10). Cognitive load: low (0 failed). Personas: Tomás (makes his account private): the Private account row explains who sees what before he switches. Sam (keyboard): tabs, fields and switches all reachable with visible focus. Specificity: neutral, as an Operate settings page should be.

## Findings

### 1. "View your profile" floats beside "Change picture" — P3 · S · Judgement
**Where:** Profile tab header; at 1280 the link sits mid-height beside the button; at 375 it drops under the avatar on its own line.
**Fix:** put the link under the avatar and button as one group, or move it to the page title row; `--space-4` from the fields.
**Status:** fixed 2026-10-18: the button and "View your profile" are one column beside the picture.

### 2. "Likes (off by default)" puts the default in the label — P3 · S · Judgement
**Where:** Notifications tab; the intro already says likes are off until turned on.
**Fix:** "Likes" as the label; the default stays in the intro line.
**Status:** fixed 2026-10-18: "Likes" (the intro says they start off), five languages.

### Shared
Tabs as pills (selected by colour only): `shell-and-shared-pieces.md` #2. CLS 0.139 at 1280 comes from the rail: `bugs/rail-clubs-card-shifts-layout.md`.

## Looked fine

Pill tabs with `role="tab"`, kept in `?tab=`; sections as raised cards with hairlines; switches with descriptions; the bulk "Make all my books visible to" with an in-page confirm; Download and Import as secondary buttons; Delete account outlined in danger ink with a "…" for the next step; the language picker in the sidebar; German at 375 (checked in Phase 3); all five themes.
