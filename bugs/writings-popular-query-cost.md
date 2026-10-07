# Writings' Popular list ranks every writing on every request

**Priority:** P3 · **Size:** M · **Area:** Backend, performance · **Found:** 2026-10-05 (security review of `specs/feed-redesign.md` Phase 2) · **Status:** Open

## What happens

`GET /api/writings?section=popular` sorts **every** writing in the database by "likes this week, then all-time likes, then newest", counting likes twice per writing, on every request and for every page. Anyone can call it without logging in. Reviews' Popular list (`ReviewSocialRepository.GetReviewPageAsync`) works the same way.

Today this is fast because there are only a handful of writings. With thousands of writings and frequent visits it would get slow, and it's an easy endpoint to hammer.

## Why

`WritingRepository.GetPageAsync` (`Apollon/src/Argos.Infrastructure/Repositories/WritingRepository.cs`) computes the ranking inside the query each time; there's no stored score and no cache. Page numbers are already capped at 1000, so the crash from huge page numbers is fixed; this note is only about cost.

## Suggested fix

When it starts to matter (watch response times once there are real users):

- Cache the first few Popular pages for a minute or two, or
- Store a "likes this week" number per writing, updated by a small background job, and sort by that column, or
- Add rate limiting to the public list endpoints.

Do the same for Reviews' Popular list.
