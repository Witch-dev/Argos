# 12 — Social Graph & Query Design (Follows + Activity Feed)

## Progress

**Status:** ✅ Done

**Decisions made:**
- `Follow` entity: `FollowerId`/`FolloweeId` (both plain `Guid`s, no navigation properties — same Domain-purity pattern as `Log.UserId`), unique index on `(FollowerId, FolloweeId)` (can't follow the same person twice). "Can't follow yourself" enforced in `FollowService`, not the DB, for a cleaner error message than a constraint violation.
- **Verified, not assumed**: both FKs point at the same table (`AspNetUsers`) with `Cascade` — a configuration SQL Server famously refuses ("multiple cascade paths"). Confirmed Postgres accepts it fine by actually generating and applying the migration, not just trusting it would work.
- `IFollowRepository` has one `GetAsync(followerId, followeeId)` serving both "check before follow" and "find before unfollow" — no redundant methods.
- `FollowService` also checks the target user actually exists (via `UserManager.FindByIdAsync`) before creating a follow — same "clean 400 instead of raw FK-constraint 500" pattern as `LogService`'s book-existence check.
- **The actual N+1 fix, verified by reading the generated SQL, not assumed**: `ILogRepository.GetRecentByUserIdsAsync` uses `.Include(l => l.Book)` plus `Where(l => userIds.Contains(l.UserId))`, which Postgres translates to `WHERE l."UserId" = ANY(@userIds)` with an `INNER JOIN "Books"` in the *same* query. Confirmed via the real SQL log: exactly two queries total for a feed request (one for followed IDs, one join query for logs+books), regardless of how many people are followed — not one query per followed user.
- **Keyset pagination**, per `SPEC.md`'s guidance for feeds specifically (not offset): a `before` cursor (the oldest item's `CreatedAt` from the previous page) plus `pageSize` (clamped 1–50). `nextCursor` is set only when a full page came back; known minor inefficiency (not a bug) — if exactly `pageSize` items remain, the client makes one extra request that comes back empty before learning to stop.
- Feed is Logs-only for now, as `SPEC.md` anticipates — `Lists` doesn't exist until module 13; revisit combining both sources then.
- **Deliberate test-coverage scope decision**: `FollowService` depends on the concrete `UserManager<ApplicationUser>`, which (unlike our own interfaces) is genuinely impractical to hand-write a fake for without a mocking library, given its constructor's own dependency list. Rather than force it, `FollowService`'s validation paths (self-follow, nonexistent-user, duplicate-follow, unfollow-not-following) are covered by the real, verified `curl` walkthrough below instead of a dedicated unit test — a deliberate scope call, not an oversight. `FeedService` has no such dependency and is fully unit-tested.
- **A documentation claim actually verified before being written down**: briefly isolated whether both JSON fixes from module 11's integration test (`JsonStringEnumConverter` *and* `PropertyNameCaseInsensitive`) were genuinely necessary, or one was redundant — removed `PropertyNameCaseInsensitive` alone and re-ran the test; it failed again, confirming both are independently required. Applied the same verified-correct pattern to this module's integration test.
- **Fully verified for real, end to end**: three registered users; A follows B and C (`204`); self-follow (`400`), nonexistent-followee (`400`), duplicate-follow (`400`), unfollow-not-following (`404`) all confirmed; logs created for B and C; A's feed correctly aggregates both, ordered reverse-chronologically, with book title/cover populated from the joined query; 3-page keyset pagination walkthrough (page 1 → cursor → page 2 → cursor → page 3 empty) confirmed no skips/duplicates and correct termination.
- Added `FakeFollowRepository`, `FeedServiceTests` (2 cases: aggregates correctly, empty when following nobody), and an integration test for the follow-then-feed flow. All 16 tests (was 13) pass.

## Concepts you'll learn

- Modeling a self-referencing many-to-many relationship (`User` follows `User`) in a relational schema.
- The N+1 query problem: how it's easy to accidentally generate one query per row instead of one query total, and how EF Core's `Include`/projection features avoid it — or cause it, if used carelessly.
- Pagination strategies (offset vs. keyset/cursor pagination) and why offset pagination gets slow and inconsistent on a fast-moving feed.
- The query-derived vs. materialized trade-off SPEC.md makes explicitly (§7): computing the feed live from `Logs`/`Lists` now, vs. maintaining a separate feed table later — understanding *why* you'd defer that complexity until it's actually needed.

## Why this matters

The activity feed is the first query in this app that's genuinely at risk of the N+1 problem: "for each user I follow, get their recent logs" is exactly the shape that turns into dozens of database round-trips if written naively. It's also the first place pagination matters for real — a feed grows unboundedly, and "just load everything" stops working quickly. SPEC.md's decision to query-derive the feed instead of materializing it is a deliberate simplicity-over-performance trade-off for MVP scale; understanding *why* that's the right call now (and what would make it wrong later) is more valuable than the query itself.

## The task

Implement `Follows` and the activity feed per SPEC.md §7/§9 Phase 4:

- Model the `Follows` relationship (follower/followee, both referencing `Users`) and build follow/unfollow endpoints, applying the ownership pattern from module 10 (you can only create a follow *as* yourself).
- Build the activity feed query: recent `Logs`/`Lists` from users the current user follows, ordered reverse-chronologically. Write it once, then deliberately check it for N+1 behavior (log the SQL EF Core generates, or count queries) and fix it if you find it.
- Implement pagination on the feed — pick one approach (offset or keyset) and be able to explain why you chose it for this specific access pattern.
- Write down (a comment or just for yourself) at what point you'd revisit the query-derived approach in favor of a materialized feed table, per SPEC.md's own framing of that trade-off.
- Keep applying modules 08–09: log a follow/unfollow failure meaningfully, and add a test for at least the N+1 fix (e.g. assert the feed query issues a bounded number of queries) — this is a good place to see *why* that habit pays off, since an N+1 regression is exactly the kind of bug a test catches and a manual click-through misses.

## Done when

- [ ] Follow/unfollow works and is ownership-checked.
- [ ] The feed query is verified to not have an N+1 problem — you've actually looked at the generated SQL or query count, not just assumed it's fine.
- [ ] Pagination works and you can explain the trade-off of the approach you picked.
- [ ] You can articulate, in your own words, when query-derived stops being good enough and materialization becomes worth the complexity.
- [ ] There's a test guarding the feed query's shape, not just its output.

## Go deeper (optional)

- Look at EF Core's logging of generated SQL (`ToQueryString()` or logging providers) — being able to see the actual SQL your LINQ produces is one of the highest-leverage debugging skills for this stack.
- Read about keyset (cursor-based) pagination specifically — it's what most production feeds actually use, for reasons that become obvious once you've felt offset pagination's failure mode (a page shifting when new items arrive).
