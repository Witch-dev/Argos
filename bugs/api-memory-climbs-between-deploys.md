# The live API's memory climbs between deploys and only a deploy brings it down

**Priority:** P2 (no restart yet, but a week without a deploy could reach the 512 MB limit) · **Size:** M · **Area:** Backend, memory
**Found:** 2026-11-05 · **Status:** Step 1, Step 1b and the csproj line of Step 2 done (Apollon `7567b43`, 2026-11-05). Open until a week's chart stays flat. Steps 2 (rest) and 3 deferred.

## What we see

Render's 7-day memory chart for `wingedwords-api` (limit 512 MB) climbs from about 35% to 60–75% between restarts, in steps rather than a smooth slope, and only a deploy brings it back down.

Earlier memory history is in `DEPLOY.md` → "Incidents on the live site" (2026-10-26). That burst (the error-code regex, 300+ MB in one go) is fixed. This is a different shape: a slow rise in steps over days.

## What the code shows

**Nothing in `Apollon/src` grows forever.** Every in-memory store has an expiry, a daily reset, or a fixed size. So this looks like memory that is used and then **kept**, not a classic leak. Three things can keep memory, and one kind of cache can get big with traffic. Ranked from most to least likely below.

### Checked and fine

| Where | What it holds | Why it can't grow forever |
|---|---|---|
| `LoginAttemptLimiter` | failed logins per reader + address | `IMemoryCache`, expires after 15 min |
| `EmailCooldown` | one marker per address per minute, a window per hour | expires after 1 min / the hour |
| `PendingSignupService` | a count per key | expires after 3 days, tiny |
| Rate limits in `Program.cs` (per IP, per reader) and `ClubInviteAllowance` | one small limiter per address or reader | ASP.NET's partitioned limiter throws a partition away once its window has refilled and it has sat idle ~10 s. The daily ones (reports, feedback) keep a few hundred bytes per caller for a day. |
| `PopularBooksService`, `LandingShowcaseService` | a list per language | 5 min / 10 min, and the language is one of the 5 supported codes (`ViewerLanguage` / `SupportedLanguages`), so at most 5 keys each |
| `SearchPagesService` | the sitemap | 1 hour, one key |
| `EditionService` | up to 500 editions per work (~350 KB of JSON) | 6 hours, and the endpoint is login-only and only for books Argos already has |
| `ActiveDaysWritten` | reader ids seen today | replaced each UTC day |
| `EmailQueue` | emails waiting | bounded channel, 1,000 |
| `ImportService.Reading` | readers importing right now | removed in `finally` |
| `AllocationSampler` | bytes per type name | swapped for an empty one every 2 minutes |
| `NewsFeedStore` | the news list | replaced, never added to |
| SkiaSharp (`CoverColorPicker`, `WebImageShrinker`) | decoded images | every native object is in a `using` |

Open Library answers are not cached in memory at all (books live in the database), apart from the edition and author caches here.

### Likely causes, most likely first

1. **Native memory kept by Linux's memory allocator (glibc).** SkiaSharp decodes covers outside .NET: the cover-colour job decodes up to 2048×2048, about 16 MB each, and What's new images go through `WebImageShrinker`. On Linux, after a large block is freed, glibc raises the size it hands straight back to the system, so later blocks of that size come from its own pool and stay there, often in separate pools per thread ("arenas"). The process then grows in steps and never shrinks, while the .NET heap looks normal. This fits the step shape best.
2. **The .NET garbage collector holding on to what it once needed.** The GC (the part of .NET that frees unused memory) keeps its high-water mark when there's no pressure. In a container .NET also lets the heap grow up to **75% of the limit** (384 MB of 512) by default, which matches where the chart levels off. The workstation GC (lighter, gives memory back) only comes from the Render setting `DOTNET_gcServer=0`, not from the code, so a changed or missing setting brings back the server GC. Things that raise the high-water mark once a day:
   - `OpenLibraryCacheRefreshService` runs every 24 h with **one database context for the whole run**. It loads up to 500 stale books with their subjects and ISBNs and keeps them all tracked until the run ends (up to an hour), then rebuilds up to 500 language rows. The peak is let go at the end, but the GC may not hand it back.
   - The cover-colour job and Open Library fetches on book pages make similar smaller peaks.
3. **Public caches keyed by what a visitor asks for, with no size limit.** The app's `IMemoryCache` has no `SizeLimit`, so the only cap on these is how long entries live × how fast they can be filled (the rate limit). A search-engine crawler walking author pages and searches can fill them in a burst, which would show as a step that fades after the expiry:
   - `AuthorService`: a page of up to 24 works per `author × sort × covers-only × page`, kept 1 hour (public, 30 a minute per IP). Roughly 10–30 KB each, so one busy crawler could hold tens of MB.
   - `AuthorService`: "not found" and alias markers per author id, kept 1 day (any id, tiny).
   - `BookLocalizationService`: a search title per `language × work`, kept 1 day (up to 100 per search); "localize-failed" markers per work, 15 min.

   Unlikely to reach 75% on its own at today's traffic, but it grows with traffic, and it's the one that could hurt as the site gets indexed.

## What the logs showed (2026-11-05, instance `5mqbf`)

The first half hour after a deploy, from the `Memory:` lines and Render's chart:

| Time | process | .NET heap | committed | Render chart |
|---|---|---|---|---|
| 5:52 PM | 249 MB | 22 MB | 41 MB | ~30% |
| 5:54 PM | 294 MB | 32 MB | 53 MB | ~38% (the step) |
| 6:04 PM | 311 MB | 33 MB | 54 MB | ~41% |
| 6:20 PM | – | – | – | ~44% |

- **The .NET heap is tiny and flat** (22–33 MB), and the GC has committed only about 54 MB. So the GC isn't holding memory (cause 2 is out) and nothing alive in .NET is piling up (cause 3 is out, at least for now).
- **Almost all of it is outside .NET**: the process is ~250 MB above the heap. That's **cause 1, native memory**: glibc's pools (SkiaSharp images, Npgsql/TLS buffers), plus the code .NET compiles as it runs.
- **The 5:53 step lines up with a first-time Entity Framework query compile** (the `MultipleCollectionIncludeWarning` at 5:53:42). The first time a page is used, its queries and code are compiled, and that compiled code lives in native memory for the life of the process. So part of the climb over days is every page and query being used for the first time. That levels off once all of them have been hit. The rest is what glibc keeps after big blocks (covers, images) are freed, and that part keeps going.
- Render's chart (~41% ≈ 210 MB at 6:04) is lower than `process` (311 MB). The working set also counts shared, file-backed pages (the loaded `.dll` and `.so` files), and Render doesn't count all of those.
- Still to see: the same lines at the **top** of a multi-day climb (the last `Memory:` lines of the instance before `5mqbf`). If the heap is still ~30–60 MB there, this reading holds for the whole climb.

**Revised order:** Step 1 (glibc settings) is the fix. Add **Step 1b** (below) so the memory line can tell native pools apart from loaded code. In Step 2, keep only the one-line move of the GC setting into the csproj. `ConserveMemory` and the refresh job's `ChangeTracker.Clear()` aren't needed for this (the heap is small); they can wait. Step 3 (cache size limit) is deferred to when traffic grows. The bug stays open until a week's chart stays flat.

### Step 1b: say where the native memory is (MemoryReporter, a few lines)

Read `/proc/self/status` on Linux and add `RssAnon` (memory the process asked for: glibc pools, SkiaSharp, compiled code) and `RssFile` (loaded files, can be dropped) to the `Memory:` line. If `RssAnon` still climbs after Step 1, the next tool is calling glibc's `malloc_trim(0)` after each cover-colour run, which hands free pool memory back to the system on the spot. It's a single native call, used in other .NET-on-Linux apps for this exact problem.

## Fix plan

Step 0 tells us which of 1–3 it is, so we fix the right one. Steps 1–3 are worth doing in any case, since each is small and keeps us under 512 MB as traffic grows.

### Step 0: read the logs we already write (no code)

In Render's log search:
- `Memory reporter started`: the first line after each start should say `server GC False`. If it says `True`, the `DOTNET_gcServer` setting is gone, and that alone explains a lot.
- `Memory:` (every 2 minutes) across one climb, from a deploy to a high point. Compare the three numbers:

| What the lines show | Points to |
|---|---|
| `process` climbs, `.NET heap` stays flat (say under 100 MB) | cause 1, native memory → Step 1 |
| `committed` climbs well above `.NET heap` | cause 2, the GC holding free memory → Step 2 |
| `.NET heap` itself climbs and stays up | cause 3, something alive in .NET (the caches) → Step 3 |

- `Heavy:` and `Allocated since last report:` around each step: the name of what ran at that moment (the refresh job, covers, a crawl of `/api/authors/...`).

### Step 1: stop glibc from keeping freed native memory (Dockerfile, ~3 lines)

Add to the runtime stage of `Apollon/Dockerfile`, so it's in the code rather than a Render setting:
- `MALLOC_ARENA_MAX=2`: at most two memory pools instead of one per thread.
- `MALLOC_MMAP_THRESHOLD_=131072`: blocks over 128 KB always go straight to the system and straight back when freed. This turns off the "raise the threshold" behaviour from cause 1.
- `MALLOC_TRIM_THRESHOLD_=131072`: give free memory at the top of the pool back sooner.

The cost is a little more CPU for big allocations, which is nothing next to decoding an image.

### Step 2: put the GC choice in the code and make it tidier (csproj + one config file)

- In `Argos.Api.csproj`: `<ServerGarbageCollection>false</ServerGarbageCollection>` (the follow-up `DEPLOY.md` already suggested), so it no longer depends on the Render setting.
- `System.GC.ConserveMemory` = `5` (a `runtimeconfig.template.json` next to the csproj): the GC then works harder to compact and give memory back, at a small CPU cost.
- Keep the 75% heap limit as it is. Lowering it would turn a restart into `OutOfMemoryException`s inside requests, which is worse.
- `OpenLibraryCacheRefreshService`: after each book's save (or postpone), call `ChangeTracker.Clear()` through the repository, so a run holds one book at a time instead of up to 500. Same check for the language build that follows it.

### Step 3: give the app's memory cache a size and count it (several files)

- `AddMemoryCache(o => { o.SizeLimit = …; o.TrackStatistics = true; })`. With a `SizeLimit`, **every** `Set` must say its size or it throws. So this touches all the cache call sites (~10 services), each giving a rough size: 1 for markers, more for lists (author works page about 5, editions about count ÷ 50). When the cache is full, the oldest, lowest-priority entries go first.
- Add the cache's entry count and estimated size (`GetCurrentStatistics()`) to the 2-minute `Memory:` line, so the next chart can be read without guessing.
- Entity Framework's own query cache is separate and already capped, so it isn't affected.

### Verification

- Unit/integration tests: one test that a cache entry over the limit is dropped, not kept. The existing integration tests run every cache path, so a `Set` without a size would show as a failure there.
- `precheck.ps1` before pushing. The API needs a restart after deploy (Render does that).
- After deploy: watch Render's 7-day chart. It should flatten under ~45% and not step up. Check the `Memory:` lines once a day for the first three days.
- Add the outcome to `DEPLOY.md` → "Incidents on the live site", and a changelog line.
