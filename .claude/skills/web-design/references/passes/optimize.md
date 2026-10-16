# Pass: optimize

Performance is a feature. Find the actual bottleneck for this screen, fix it, measure again. Don't optimise what isn't slow.

## Measure first (before and after)
- Core Web Vitals: **LCP < 2.5s, INP < 200ms, CLS < 0.1** (Lighthouse in Chrome, mobile profile, throttled).
- Bundle: `npm run build` output sizes; which route chunks are heavy.
- Runtime: frame rate during the shelf animation, long tasks, re-renders (React DevTools Profiler).
- Network: request count and size, waterfall, Open Library covers.
Who is affected: everyone, phones only, slow connections?

## Loading
- **Covers and photos:** the right Open Library size for the display size (no `-L` covers in a 112px slot), `loading="lazy"` below the fold (never on the main cover of a detail page), explicit `width`/`height` or `aspect-ratio` so nothing shifts.
- **JavaScript:** route-level `lazy()` (already used), dynamic import for heavy rarely-used parts, remove unused dependencies.
- **Fonts:** only the weights used, `font-display: swap`, preconnect to Google Fonts, metric-matched fallbacks (no shift when they load).
- **Data:** paginate, prefetch the likely next page or query only when cheap, React Query `staleTime` so navigating back doesn't refetch everything.

## Rendering
- Batch DOM reads then writes (no layout thrashing in loops).
- `content-visibility: auto` for long lists below the fold; virtualise only lists that really get long.
- Animate `transform` and `opacity`; bound blur and shadow effects to small areas; `will-change` only during a known animation.
- `memo`/`useMemo`/`useCallback` only where the Profiler shows a real cost.

## Avoid
Optimising without measuring, micro-optimising while a big bottleneck remains, lazy-loading what's above the fold, `will-change` everywhere, breaking accessibility or behaviour for speed.

## Check
Before/after numbers in the reply, on a throttled phone profile, not just a fast desktop. Then `polish`.
