# Kinetic type field GPU verification

**Date:** 2026-07-14

## Runtime and visual checks

- Local browser check at 1360 × 892 CSS pixels with DPR 2 confirmed the FULL Hero used `webgl`, rendered a 1681 × 1115 backing store (the 1.25x cap), kept glyphs upright, and kept the curved-surface clip intact.
- A follow-up WebGL fan check removed an uninitialized `(0, 0)` closing vertex that had painted a black triangle across the top-left Hero area. The corrected screenshot keeps that area on the bone surface.
- A continuous synthetic pointer path retained the `·` replacement field. Across 180 display-frame samples after the correction, frame spacing averaged 8.541 ms, with p95 9.3 ms and a 16.8 ms worst sample.
- A lifecycle audit instrumented both WebGL draw calls at 1360 × 892 CSS pixels with DPR 2. While the Hero was visible, the renderer made 146 draw calls in 600 ms. After scrolling to Projects, the field switched to its static Canvas state and made 0 WebGL draw calls during the next 700 ms. Returning to the Hero resumed 146 calls in 600 ms. This confirms that off-screen state cancels the GPU frame loop rather than merely lowering its frame rate.
- STATIC rendered the Canvas final frame.
- A deliberately lost WebGL context switched the FULL scene to the non-empty Canvas resilience fallback; reloading restored the WebGL path.

## Source checks

- `pnpm typecheck` completed successfully.
- `pnpm lint` completed successfully with 135 existing warnings in `.claude/skills/impeccable` helper sources and no errors.
- `git diff --check` completed successfully.

## Build note

The project’s existing development server owns `.next`, so a concurrent production build was not used for this check. A temporary `next dev` attempt exited after detecting that existing server; the existing server was not stopped.
