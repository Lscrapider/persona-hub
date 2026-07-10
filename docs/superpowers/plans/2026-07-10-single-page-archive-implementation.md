# Single-page Archive and Living Hero Implementation Plan

> **For agentic workers:** Execute this dependency-bound plan inline in the current workspace. Do not dispatch serial subagents, create a branch, commit, push, or add unit tests.

**Goal:** Make Scra Atlas a single, scroll-driven technical archive with the restored bone-and-circular-field Hero, a temporarily navigation-free Hero top edge, two effect modes, and accessible one-time copy reveal.

**Architecture:** HomeExperience only composes Hero, Projects, Logs, Timeline, Lab, EntryGate, and the effect control. The fragment Header and its IntersectionObserver remain available but are intentionally unmounted while its final placement is decided. Archive data stays in src/content, archive modules stay feature-local, CopyReveal stays in effects/primitives, and Hero-only continuous motion stays in the Hero scene and lifecycle hook.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Motion for React, CSS, semantic DOM, Canvas 2D, native fragment navigation, IntersectionObserver.

## Global constraints

- Keep #projects, #logs, #timeline, and #lab on the root route.
- Preserve the existing compatibility redirects from /projects, /blog, /timeline, and /lab.
- Do not touch next-env.d.ts or unrelated working-tree changes.
- Do not create tests, branches, commits, or pushes.
- Canvas 2D is permitted only inside the aria-hidden Hero word field. Do not add WebGL, shaders, particles, scroll snap, Lenis, scroll hijacking, or invented archive facts.
- Support exactly FULL and STATIC. System reduced motion resolves initially to STATIC, while an explicit FULL choice persists and wins.
- Use only TypeScript, lint, production build, and actual desktop/mobile browser checks for verification.
- The user-provided screenshots remain visual-reference evidence only. No external branding, copy, code, or assets are reused.

## File map

| Path | Responsibility |
| --- | --- |
| src/content/archive.ts | Fragment ids, section definitions, project records, and section lookup. |
| src/core/effect-mode.ts | FULL / STATIC type and deterministic preference resolution. |
| src/effects/runtime/EffectMode.tsx | Browser preference provider and root dataset synchronization. |
| src/effects/primitives/ScrambleText.tsx | Triggerable, accessible Latin and numeric decoding visual. |
| src/effects/primitives/CopyReveal.tsx | Visibility-gated, once-only copy reveal that selects scramble or CJK masking. |
| src/effects/primitives/TypewriterText.tsx | Accessible Hero signature cycle. |
| src/effects/runtime/useSceneActivity.ts | Intersection and document-visibility lifecycle state. |
| src/features/archive/ArchiveSection.tsx | Shared semantic frame for individual archive sections. |
| src/features/archive/useActiveArchiveSection.ts | IntersectionObserver-only header scroll spy. |
| src/features/archive/archive.css | Archive module layout and surface styling. |
| src/features/projects/ProjectsSection.tsx | Project index feature. |
| src/features/logs/LogsSection.tsx | Logs feature. |
| src/features/timeline/TimelineSection.tsx | Timeline feature. |
| src/features/lab/LabSection.tsx | Lab feature. |
| src/features/home/HomeHero.tsx | Restored bone information field, off-canvas curved scene boundary, status, CTA, and Current Index. |
| src/features/home/KineticTypeField.tsx | Hero Canvas lifecycle, pointer input, and static fallback. |
| src/features/home/kineticTypeFieldRenderer.ts | Canvas-only geometry, text-ring drawing, and frame rendering. |
| src/features/home/HomeExperience.tsx | Composition and EntryGate exposure state only. |
| src/features/home/home.css | Hero, Current Index, EntryGate, CopyReveal, and scene styling. |
| src/ui/SiteHeader.tsx | Preserved fragment header and active-section presentation, intentionally unmounted for this visual pass. |
| src/app/layout.tsx | Font shell and EffectModeProvider only. |
| src/app/page.tsx | Pre-hydration preference and EntryGate bootstrap. |
| src/app/globals.css | Sticky header and global effect-control styling. |
| src/styles/base.css | Smooth-scroll and static-mode document defaults. |
| docs/DESIGN.md and docs/{architecture,credits,design,quality} | Current interaction, source, and verification decisions. |

## Task 1: Preserve and validate the fragment foundation

**Files:** src/content/archive.ts, src/content/site.ts, src/app/projects/page.tsx, src/app/blog/page.tsx, src/app/timeline/page.tsx, src/app/lab/page.tsx.

- [x] Confirm archive section data exposes the four fragment targets.
- [x] Confirm Hero CTA and Current Index data use root fragments.
- [x] Confirm former top-level module routes redirect to their matching fragment.
- [ ] Retain this contract while replacing the root experience.

## Task 2: Replace the three-tier effect model and gate copy reveal correctly

**Files:** src/core/effect-mode.ts, src/effects/runtime/EffectMode.tsx, src/ui/EffectModeControl.tsx, src/app/layout.tsx, src/app/page.tsx, src/styles/base.css, src/features/entry/EntryGate.tsx, src/effects/primitives/ScrambleText.tsx, src/effects/primitives/CopyReveal.tsx.

- [ ] Reduce the type, storage validation, labels, and DOM datasets to FULL and STATIC.
- [ ] Resolve initial system reduced motion to STATIC, except for a stored explicit FULL choice.
- [ ] Let the inline bootstrap set both resolved mode and EntryGate visibility before the client provider runs.
- [ ] Keep no-JavaScript archive content readable by rendering the gate skipped by default.
- [ ] Add a CopyReveal primitive that observes its own element only after its enabled flag becomes true. Latin and numeric text uses a single scramble; Chinese text uses a one-time clip or mask reveal.
- [ ] Make ScrambleText settle immediately whenever it cannot play, and make each CopyReveal remember a started reveal permanently.
- [ ] During an active EntryGate, hide the archive shell and apply inert after hydration. On completion, remove both restrictions and then allow CopyReveal observation.

## Task 3: Build semantic archive modules and the root composition

**Files:** src/features/archive/ArchiveSection.tsx, src/features/archive/archive.css, src/features/projects/ProjectsSection.tsx, src/features/logs/LogsSection.tsx, src/features/timeline/TimelineSection.tsx, src/features/lab/LabSection.tsx, src/features/home/HomeExperience.tsx, src/features/home/CurrentIndex.tsx.

- [ ] Use section id, aria-labelledby, visible h2, and scroll-margin-top for every archive module.
- [ ] Render existing archive data honestly, without fabricated timeline or article records.
- [ ] Wrap each readable title, label, summary, row, metadata value, and status in CopyReveal.
- [ ] Keep Projects, Logs, Timeline, and Lab separate features; HomeExperience only passes the gate-exposure signal and composes their order.
- [x] Keep the effect control inside the archive shell so EntryGate can protect it.
- [x] Preserve the Header implementation without rendering it while its eventual placement is undecided.

## Task 4: Preserve fragment navigation for later placement

**Files:** src/features/archive/useActiveArchiveSection.ts, src/ui/SiteHeader.tsx, src/app/globals.css, src/content/archive.ts.

- [ ] Observe only archive sections in a central viewport band with IntersectionObserver. Do not add a scroll listener or rewrite the URL during scroll.
- [x] Retain direct fragment anchors and aria-current="location" state in the dedicated Header component.
- [x] Keep the Hero as no active module in the observer contract.
- [x] Do not render a top Header during this composition pass; the black field must meet the browser top edge without a navigation band reducing it.

## Task 5: Rebuild the Hero and isolate the only continuous effects

**Files:** src/effects/primitives/TypewriterText.tsx, src/effects/runtime/useSceneActivity.ts, src/features/home/HomeHero.tsx, src/features/home/KineticTypeField.tsx, src/features/home/CurrentIndex.tsx, src/features/home/home.css.

- [ ] Render the restored bone Hero section with an id and labelled h1. Keep an oversized single-line SCRA ATLAS title on desktop, a right-edge near-black scene with one broad left curve rather than a visible black ball or detached inner horizontal edge, and the left-side information order.
- [ ] Use CopyReveal for the title, description, status, CTA, and Current Index.
- [ ] Implement an aria-hidden Typewriter visual with a stable accessible sentence. In FULL, it types, holds, deletes, pauses, and repeats. In STATIC, it shows the final text.
- [ ] Derive scene activity from Hero intersection plus document.visibilityState. Gate the Typewriter and Canvas motion with it.
- [ ] Replace pseudo-status word field copy with repeated real technical directions along several concentric circular Canvas tracks. Remove density words, terracotta routes, nodes, and guide-line clutter.
- [ ] Animate Canvas text rings at distinct slow periods in FULL. Pause all scene activity off screen or in a hidden document. STATIC renders a deterministic final frame.
- [ ] Export a non-empty static scene fallback and pass it to EffectBoundary. Avoid lazy loading that leaves a blank visual slot.

## Task 6: Refresh design records and verify

**Files:** docs/superpowers/specs/2026-07-10-single-page-archive-design.md, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/credits/2026-07-10-interaction-references.md, docs/design/2026-07-10-effects-system.md, docs/design/2026-07-10-effect-first-experience-design.md, docs/quality/2026-07-10-effects-quality-gates.md, docs/plans/2026-07-10-foundation-home-implementation.md.

- [x] Record the approved single-page architecture, two-mode contract, CopyReveal behavior, typewriter semantics, and scene lifecycle.
- [ ] State explicitly that user screenshots inform visual direction only.
- [ ] Remove stale third-mode behavior from current documentation and superseded planning records.
- [ ] Run pnpm typecheck and pnpm lint.
- [ ] Run pnpm build unless a Next development lock blocks it; record the exact blocker if present.
- [ ] Hand visual review of the root experience to the user, who requested direct visual acceptance rather than agent browser inspection. Check nonvisual contracts through type, lint, and build output only.

## Task 7: Current Hero visual pass

**Files:** src/features/home/HomeExperience.tsx, src/features/home/KineticTypeField.tsx, src/features/home/home.css, and the design records above.

- [x] Temporarily unmount the top fragment Header without deleting its component or observer foundation.
- [x] Let the right near-black field start at the Hero's top edge, continue to the browser's right edge, and retain one broad left curve.
- [x] Define the original technical-copy rules now rendered by the Canvas scene, with no visible dotted orbit guides or floating scene words.
- [x] Preserve FULL / STATIC behavior: tracks move only while the Hero is active in FULL; STATIC has deterministic offsets and no pulse.
- [x] Move the decorative scene out of the fixed first-viewport stage so it spans the Hero / Current Index transition and the broad curve reaches the right edge before the scene ends.
- [x] Measure the scene with ResizeObserver and derive Canvas backing-store dimensions, circle paths, centres, and radii from its current dimensions rather than a fixed coordinate system.
- [x] Define complete circular track geometry so Canvas lettering can loop through the visible field without textPath wrapping gaps.
- [x] Replace the independent CSS ellipse with one dynamic surface model that fills the black field and also clips the Canvas text-track layer.
- [x] Derive the surface curve's top entry and right-edge exit from the same measured dimensions as the orbit geometry, preserving the short-viewport composition on wide and tall browsers.
- [x] Replace the joined surface Bézier segments with one calculated arc whose radius derives from the measured endpoints and a normalized curvature factor, so its tangent is continuous at every viewport size.
- [x] Remove the desktop Hero rem-height cap and let Hero plus its first stage share an uncapped dynamic viewport-height baseline before the Index transition extends the final measured scene.
- [x] Unify the desktop Hero frame: make Hero and stage exactly the dynamic viewport height, then position Current Index as an in-frame overlay so it cannot add a second page-flow height.
- [x] Derive every visible Hero track from the left surface arc's computed circle centre and radius, using inward offsets to fill the black half-circle; retain the reference only for text density and muted light color.
- [x] Increase the arc family to tightly spaced inward offsets and repeat path copy sufficiently for the largest arc so the black field reads as intentionally filled without visible dotted guides.
- [x] Use 22 broad-radius arc bands with larger text and sufficient repeated copy, favoring visual coverage and smooth animation over a large number of tiny animated bands.
- [x] Make adjacent broad arc bands counter-rotate slowly; calculate each cached path as one exact `0…2π` turn with a terminal `AI`, `PHY`, or `JAVA` connector that cannot overlap the first glyph, and give seven intentionally distributed tracks deterministic gaps at three times their former length with a low-alpha connector dot at every gap cell while keeping the other fifteen dot-free and continuous.
- [x] Run `pnpm typecheck` and `pnpm lint` successfully.
- [ ] `pnpm build` is blocked by the existing `.next/lock`: Next reports that another build process is already running or a prior one did not exit cleanly. Do not remove the lock during this task.
- [ ] Visual review is intentionally assigned to the user; no browser acceptance claim is made here.

## Task 8: Replace the Hero SVG field with one Canvas renderer

**Files:** src/features/home/KineticTypeField.tsx, src/features/home/kineticTypeFieldRenderer.ts, src/features/home/home.css, docs/superpowers/specs/2026-07-10-single-page-archive-design.md, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/credits/2026-07-10-interaction-references.md.

**Interfaces:**

- `drawKineticTypeFieldFrame(context, bounds, frame)` receives a CSS-pixel Canvas context, the existing container-derived surface geometry, a deterministic elapsed time, and optional desktop pointer coordinates. It clears, fills the broad black surface, clips every decorative layer to it, draws 22 concentric word rings, then restores the context.
- `KineticTypeField` owns only the Canvas element, ResizeObserver sizing, scene activity, effect-mode lifecycle, and pointer-coordinate conversion. It must not create React state updates per frame or a scroll listener.
- `KineticTypeFieldFallback` renders one static frame using the same renderer contract.

- [x] Replace SVG definitions and `textPath` components with a Canvas-only renderer module. Preserve the existing radius, entry, exit, and 22-track content constants, but draw each letter around a complete circular path with Canvas transforms instead of DOM glyphs.
- [x] Resize the Canvas backing store to the measured scene box multiplied by a capped device-pixel ratio; draw in CSS-pixel coordinates after one context transform. Recompute only in ResizeObserver, never in a frame loop.
- [x] Use exactly one requestAnimationFrame loop in FULL while scene activity is true. Adjacent rings use opposite angular velocity, retain deterministic gaps on seven tracks, and cancel the loop while hidden or outside the Hero. STATIC invokes the draw function once with a deterministic frame.
- [x] Add desktop mouse handling that converts client coordinates to the measured Canvas coordinate system and replaces only letter and number glyphs inside a bounded circle with `·`. Do not activate this effect for touch pointers or STATIC, and leave the surface intact.
- [x] Keep all reader-facing Hero copy in DOM, retain `aria-hidden` on the Canvas, preserve the non-empty fallback, and document the user-approved Canvas exception plus the no-copy provenance boundary.
- [x] Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`. Do not add tests, commit, push, create a branch, remove `.next/lock`, or claim browser visual acceptance.

## Task 9: Keep the Canvas word field smooth at large viewport sizes

**Files:** src/features/home/KineticTypeField.tsx, src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/quality/2026-07-10-effects-quality-gates.md.

**Interfaces:**

- `drawKineticTypeFieldFrame(context, bounds, frame)` keeps its public contract. Its renderer may cache only geometry and glyph layout keyed by the measured CSS-pixel bounds and resolved font; it must not retain user-pointer state or schedule another loop.
- `KineticTypeField` chooses a capped animated Canvas pixel ratio separately from its static ratio. It still owns the only requestAnimationFrame lifecycle and reports CSS-pixel coordinates to the renderer.

- [x] Cache the calculated surface/orbit geometry and the per-track glyph advances until the Canvas bounds or resolved font changes. Do not call `measureText` or allocate a fresh character-width map on each animation frame.
- [x] Retain the complete circular text layout but cull characters whose anchors are outside the visible Canvas rectangle before issuing Canvas transforms or `fillText`, while preserving the existing surface clip as the final visual guard.
- [x] Replace the per-character `save`, `translate`, `rotate`, and `restore` sequence with a direct CSS-pixel-to-device-pixel transform, so an on-screen glyph needs one transform assignment and one `fillText` call.
- [x] Cap the Canvas backing store at a lower density while FULL animation is active, retain the higher static density, and keep the visual CSS size unchanged. Do not lower the animation cadence or reduce the 22-track design.
- [x] Update the design and runtime records with the cache, visible-glyph culling, and animated-DPR decision. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; visual smoothness remains for the user to inspect.

## Task 10: Refine gap rhythm, connector dots, and track legibility

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The seven deterministic intermittent tracks keep their existing selection and deterministic phrase order. Their visual gap length becomes exactly three times the former 8–16-cell range.
- A connector dot is decorative metadata, not reader copy. It renders at a lower alpha and remains unchanged inside the FULL desktop pointer dot-substitution circle.

- [x] Replace each intermittent 8–16-cell gap with a 24–48-cell gap containing a low-alpha `·` at every gap cell, while leaving the other fifteen tracks continuous and dot-free.
- [x] Use an explicit track-letter-spacing constant that increases per-glyph arc advance enough to prevent inner-ring overlap without changing the 22-track count, font scale, or animation cadence.
- [x] Exclude connector dots from pointer replacement, while converting all letter and number glyphs inside the pointer circle into `·`.
- [x] Record the gap multiplier, low-alpha connector treatment, and pointer behavior in the current design and runtime documents. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 11: Prevent radial track collisions at compact scene sizes

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The renderer derives a compact-scene font cap from the measured distance between adjacent orbit radii. It keeps 22 tracks, their source text, and their periods unchanged.
- Connector-dot density is deterministic and uses every gap cell, replacing the earlier sparse connector cadence with a continuous low-alpha dot chain.

- [x] Limit track font size to a safe fraction of the current radial step after calculating scene geometry, so adjacent tracks cannot overlap at short or narrow dimensions while desktop retains the existing 18px maximum.
- [x] Render a connector dot at every gap cell without changing the threefold gap length, alpha, or pointer-exclusion behavior.
- [x] Update the current design, runtime, and approved spec with the compact-scene font cap and connector density. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 12: Turn the desktop pointer circle into a dot substitution field

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- In active FULL desktop input, an in-range letter or number retains its angular anchor and advance but draws as a medium-alpha `·`. It is not skipped.
- Existing low-alpha connector dots remain dots, including inside the pointer circle. STATIC and touch input remain unchanged because they provide no active pointer to the renderer.

- [x] Replace the pointer-masked letter/number draw character with `·` at the same Canvas transform, using a distinct readable dot alpha rather than a black omission.
- [x] Preserve ordinary text and low-alpha gap connectors outside the pointer field, and preserve connectors inside it without replacing or hiding them.
- [x] Update current design, runtime, spec, and stale plan wording from pointer omission to pointer dot substitution. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 13: Stabilize reader-copy layout during its one-time reveal

**Files:** src/features/home/CurrentIndex.tsx, src/features/home/home.css, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/design/2026-07-10-effects-system.md.

**Interfaces:**

- CurrentIndex renders only its semantic heading and no trailing decorative heading-rule element.
- ScrambleText keeps the final text as its fixed measurement content and inherits the containing reader element's `white-space` behavior for both its measurement and absolute visual layers.

- [x] Remove the Current Index heading-rule element and its grid/rule CSS so no horizontal line appears to the heading's right.
- [x] Replace ScrambleText's forced `pre-wrap` with inherited whitespace, preserving Hero-title `nowrap` while ordinary paragraphs retain their own normal wrapping rules throughout a scramble.
- [x] Document stable fixed-width reveal behavior and run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 14: Eliminate circular track seam duplication

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- A cached track layout contains only glyphs whose full advance stays within one `0…2π` turn. It never draws a final glyph beyond that turn and therefore never wraps a second glyph onto the first anchor.
- Each deterministic track reserves its final in-turn space for one short technical seam connector, cycling `AI`, `PHY`, and `JAVA`. The connector fits completely and ends at the seam; the preceding remaining space is always shorter than one ordinary glyph advance.

- [x] Replace the intentional beyond-`2π` glyph spill with an exact one-turn layout and deterministic seam-connector reservation, retaining 22 tracks, their existing alternating direction, gap selection, and pointer behavior.
- [x] Update the current design, runtime, and approved specification to describe the exact seam rule. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 15: Add a restrained outer-to-inner type taper

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The outer track keeps the current responsive base font size. Each inward track decreases by approximately `0.02` of that size, using a restrained 1.8% step and a 64% relative floor; no track goes below the existing 7px readability minimum.
- Glyph advances use one cached base-font metric per character, multiplied by the individual track scale. The matching direct Canvas transform applies that same scale, so tapering cannot introduce a width or seam mismatch.

- [x] Give every track a deterministic tapered font size while preserving the 22 tracks, exact circular seam rule, radial collision cap, intermittent gaps, pointer substitution, and frame-loop count.
- [x] Update the current design, runtime, and approved specification with the bounded inward type taper. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 16: Restore single-font Canvas throughput for the type taper

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- FULL sets one resolved base Canvas font per frame. Every track retains only a deterministic scalar for its inward taper; its measured angular advance and direct Canvas transform use that same scalar.
- The renderer must not set a distinct `context.font` for all 22 tracks during a FULL frame. It preserves the exact one-turn seam, actual visual taper, 7px floor, 22-track count, pointer behavior, and visible-glyph culling.

- [x] Replace per-track Canvas font strings with one base-font measurement/draw path plus track-local scale factors for glyph advance and transform.
- [x] Update the current design, runtime, and approved specification with the single-font performance decision. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 17: Cull hidden Canvas glyphs before they reach the clip

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The Canvas clip remains the final visual guard, but an anchor outside the same measured circular black surface is skipped before pointer checks, transforms, or `fillText`. A font-size margin retains legitimate edge glyphs.
- Cached layout stores each glyph's local sine and cosine. FULL computes one start-angle sine/cosine pair per track and derives glyph orientation through addition identities rather than calling trigonometric functions for every glyph every frame.

- [x] Preserve the 22-track field, taper, seam, dots, and pointer behavior while removing off-surface draw work and per-glyph frame trigonometry.
- [x] Update the current design, runtime, and approved specification with the measured-surface culling and trig-cache decision. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 18: Remove the inward track-font taper

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- Per the user's performance decision, all 22 tracks return to the same responsive base font size and its existing radial collision cap. No track-local font scaling, extra in-turn glyph population, or tapered transform remains.
- The exact seam, terminal technical connectors, dot gaps, pointer substitution, one-font draw path, measured-surface culling, and cached trigonometry remain unchanged.

- [x] Remove the inward font-scale constants, per-track font metadata, scaled angular advance, and scaled glyph transform without reverting independent renderer optimizations.
- [x] Update the current design, runtime, and approved specification to make uniform track typography the current behavior. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 19: Expand the Hero field to 38 tracks

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The scene contains 38 concentric tracks, preserving the same normalized outer and inner radii, the shared responsive font, and all exact-circle seam behavior.
- Thirteen of the 38 tracks retain deterministic threefold dotted gaps, distributed evenly through the radius family; the other 25 remain continuous and dot-free.

- [x] Increase the track count from 22 to 38 and expand the deterministic intermittent-track selection without restoring typography taper or adding another animation loop.
- [x] Update the current design, runtime, and approved specification for the 38-track density. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 20: Normalize 38-track motion periods

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The outermost and innermost tracks retain the former slow duration envelope, approximately 300 seconds down to 132 seconds. Intermediate tracks interpolate across that interval regardless of track count.
- Adding tracks never makes an inner path complete a rapid multi-second loop. Adjacent directions, deterministic phases, and the one shared frame loop remain unchanged.

- [x] Replace the fixed per-index duration decrement with track-count-normalized interpolation across the existing slow duration range.
- [x] Update the current design, runtime, and approved specification with the normalized 38-track timing. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Task 21: Slow the normalized 38-track motion envelope

**Files:** src/features/home/kineticTypeFieldRenderer.ts, docs/DESIGN.md, docs/architecture/2026-07-10-modular-effects-runtime.md, docs/superpowers/specs/2026-07-10-single-page-archive-design.md.

**Interfaces:**

- The 38-track duration envelope becomes 360 seconds for the outer ring down to 160 seconds for the inner ring. Intermediate durations remain track-count-normalized.
- Direction, phase, density, and the single frame loop do not change.

- [x] Extend the shared duration envelope without changing per-track geometry or rendering work.
- [x] Update the current design, runtime, and approved specification for the slower envelope. Run `pnpm typecheck`, `pnpm lint`, and `git diff --check`; user visual review remains authoritative.

## Plan self-review

- Every approved design requirement maps to Tasks 2 through 6.
- FULL and STATIC are the only mode names in this plan.
- The copy-reveal gate solves the initial EntryGate timing bug rather than replaying all text after scroll.
- The only continuous effects are the Typewriter and one grouped, activity-gated Hero Canvas frame loop.
- Verification intentionally contains no new test files, Git operations, or external dependencies.
