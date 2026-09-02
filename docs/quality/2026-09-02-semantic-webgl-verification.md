# Semantic WebGL motion verification

**Date:** 2026-09-02  
**Target:** `http://localhost:3000/`

## Static and build evidence

- `pnpm typecheck`: passed.
- `pnpm lint`: passed with zero errors. It reports 136 pre-existing warnings
  under `.claude/skills/impeccable` plus one pre-existing warning in
  `src/effects/physics/usePhysicalGesture.ts`.
- Frontend Design Premium strict audit: zero findings, warnings, or violations.
- Premium anti-pattern searches: no native dialog calls, non-semantic
  cursor-click targets, IME-unsafe Enter handlers, password fields, clickable
  table headers, unsafe HTML assignments, fake `href="#"`, selects, or datalists
  in the changed surface.
- `pnpm exec next build --webpack`: passed; all seven application routes and the
  not-found route were statically generated.
- `git diff --check`: passed.

The project declares Node `>=22.18 <23`, while the available runtime is Node
24.16.0. Under that unsupported runtime, the default Turbopack production build
stalled after `Creating an optimized production build` and was interrupted
without a `BUILD_ID`. The official Next.js Webpack production build completed
successfully in the same environment; the default Turbopack command should be
rechecked under the declared Node 22 toolchain.

## Browser evidence

Browser path: Codex in-app Browser, no fallback.

The responsive matrix covered 1440×900, 1366×768, 1280×720, 1024×768,
768×1024, and 390×844. At every viewport:

- the status table, Enter Archive action, and Current Index had zero rectangle
  intersections;
- document horizontal overflow was `0`;
- `data-webgl-stage` was `ready`;
- exactly one canvas existed.

Interaction checks:

- selected `城市副本`; `aria-pressed` became true and the detail heading updated;
- closed and reopened the native Project system-tree `details` element;
- scrolled the bounded Logs reader to `22.79%`; the WebGL cursor moved along the
  sampled SVG reader seam;
- switched FULL → STATIC → FULL; pressed state, root mode, and stage state stayed
  coherent;
- switched ZH → EN → ZH; URL, document language, and stage state updated;
- final DOM snapshot contained meaningful archive content, no framework overlay,
  and browser console error/warning collection was empty.

## Visual conclusions

- Hero is the sole signature visual and now occupies the real responsive Hero
  scene rectangle. On mobile it follows the status/CTA instead of covering them.
- Hero exit uses a continuous scene position; the black surface and glyphs do not
  hard-switch at the Timeline boundary.
- Timeline signals use real marker centres.
- Project signals use the selected row, detail boundary, and system-tree nodes.
- Logs signals use the selected row, exact SVG seam samples, and real reader
  progress.
- Procedural carrier squares, arbitrary circles, the generic pointer ring, the
  transient particle canvas, and the Logs word-field canvas are absent.

## Remaining environment risk

WebGL context-loss restoration was source-reviewed but not force-triggered in the
Browser tool because its page-evaluation surface is read-only. The renderer keeps
the existing `lost` state, CSS silhouette, and restoration listener.
