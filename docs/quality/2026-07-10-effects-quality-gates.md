# Scra Atlas effects quality gates

**Status:** current
**Updated:** 2026-07-14

A production build is not sufficient evidence that an effect is finished. Every change must pass visual, responsive, accessibility, lifecycle, and build checks.

## Required viewport checks

- 1440 by 900 desktop
- 1280 by 800 laptop
- 390 by 844 mobile
- 360 by 800 narrow mobile
- one FULL and one STATIC check at a representative viewport

## Visual checks

- The first desktop fold restores the wide bone information field, oversized single-line title, right-edge near-black off-canvas curved word field, and lower Current Index threshold.
- The curved word field reaches the browser's right edge, supports hierarchy without obscuring title, status, signature, or CTA, and never reads as a complete floating ball or a clipped inner panel.
- Reader-facing copy is visible in its final form before any optional reveal.
- No text crops, overflows, or loses contrast. The Header is intentionally absent until a final placement is chosen.
- No repeated rounded-card grids, gradient text, wide ghost shadows, glass panels, fake terminal status codes, or copied visual branding.
- The Hero static frame remains a coherent composition.
- The root document reads Hero → Timeline → Projects → Logs. Current Index remains part of the Hero composition; Lab is absent from active root navigation and `/lab` resolves to `/#index`.
- Timeline shows all verified records in chronological reading order, its SVG trace is decorative only, and its focal treatment never hides descriptions.
- Projects retains readable selector labels and a clear selected detail/tree pane without turning the archive into rounded-card or terminal styling.
- Logs keeps the semantic note list and inline article reader above any low-contrast decorative word field.
- Compiler phases preserve the established layout: queued content remains readable, resolving and mounted responses do not cause clipping or layout shift, and scrolling upward reconstructs the same state sequence.
- With no active input, the Hero curve, glyph tracks, section geometry, typography, palette, selection, and controls remain visually equivalent. Physics and compile seams vanish completely at rest.
- The fine-pointer probe and transient Build Trace remain low contrast, never cover required controls, and do not make the page resemble a terminal. At narrow widths the trace stays above the fixed locale/effect controls.
- Actual browser screenshots or recording are required for final visual approval.

## Navigation and accessibility checks

- Each archive module has a labelled section, id, and safe anchor scroll margin.
- Stored Header anchors reach the correct fragments with native browser history when the component is rendered again.
- A normal Current Index click selects its matching project and smoothly reaches Projects without writing `#projects`; refreshing afterwards starts at the Hero rather than restoring that project fragment.
- IntersectionObserver highlights the current module without a scroll listener or URL rewriting.
- aria-current="location" appears only on the active archive link.
- EntryGate prevents keyboard focus from reaching the archive shell while visible. With JavaScript disabled, content remains readable because the gate is skipped.
- Focus remains visible on CTA, Current Index, controls, and archive links.
- Assistive technology receives stable final reader text; decorative scene glyphs and scramble glyphs are hidden.
- There is no required hover-only information.
- Timeline marker buttons have accessible focus labels and can select the focal milestone without a scroll listener.
- Timeline pointer and focus feedback use the same real record targets; movement between a record and its marker does not emit duplicate inspect feedback.
- Project selection works with standard buttons, and recursive system branches expand through native `details` / `summary` controls. CSS `:has()` path highlighting cannot replace native summary semantics.
- Logs keeps title, date, status, tags, summary, and article body in semantic DOM. Markdown is rendered from safe structured blocks: no raw HTML is injected and only HTTP(S) inline links become links.
- Coarse pointers receive no probe and retain complete native click, anchor, button, and summary behavior. Keyboard focus gets the same local feedback where a real focus target already exists; no decorative leaf gains a tabindex.
- Physics begins only from explicit safe surfaces. Reader text, code, selected content columns, native controls, existing selection, and any `data-physics-ignore` ancestor take precedence. Pre-charge touch movement preserves native `pan-y` and pinch zoom.
- Build Trace is `aria-hidden`, has no `aria-live` behavior, uses only real runtime paths, deduplicates identical signals, and clears after its timeout.
- The loader rejects malformed or duplicate manifest fields, unordered timeline dates, unknown/unsafe log filenames, and path traversal before a Markdown file is read.

## Mode and lifecycle checks

- FULL: CopyReveal plays once per visible reader item; the Typewriter and Hero text-track scene are the only persistent motion systems. Timeline may draw its trace once, and Logs may run only its short active entrance or a requested redraw.
- STATIC: complete text, a final Hero frame, a complete Timeline trace, and a deterministic visible Logs-word-field frame appear without visual animation.
- System reduced motion initially resolves to STATIC.
- A persisted manual FULL choice remains effective for the established effect preference, while physical gestures, particles, boundary waves, compile seams, and scroll-linked decorative animation still stop under system reduced motion.
- The Hero Typewriter and word-field scene pause while the Hero is off-screen or the page is hidden.
- The Logs word field is aria-hidden, visibility/document gated, and stops after its fixed entrance. Resize and pointer activity may schedule one redraw only while the field is active; it has no permanent requestAnimationFrame loop.
- A mode switch, scene error, or unavailable enhancement leaves a readable and non-empty static fallback.
- In FULL, sections follow `queued → resolving → mounted → stable` in both scroll directions, and no more than one section is mounted at once when IntersectionObserver is available.
- The Logs reader progress and block phases remain stable while its own reader scrolls; the listener is passive and bounded to the reader, and updates are coalesced into one CSS-variable write per animation frame.
- Switching FULL/STATIC clears probe, trace, mode-specific listeners, and pending pointer-frame state. Locale remount, EntryGate lock, runtime disable, and unmount additionally clear compiler phases, timers, observers, and delegated listeners. Coarse pointers suppress the probe in CSS without changing native interactions. The `zh → en → zh` locale path must not duplicate signals.
- Pointer cancellation, lost capture, a second pointer, blur, hidden document, Hero scene exit, EntryGate lock, mode disable, locale remount, and unmount cancel held physics without a burst. WebGL context loss is a renderer transfer instead: the live CPU field continues in Canvas.

## Performance and implementation checks

- KineticTypeField is the sole feature-local WebGL2/shader exception: it is aria-hidden, activity-gated, and only enhances the Hero word field. Its FULL renderer uses one glyph atlas, immutable instanced geometry, and one fixed displacement texture at display rAF cadence. Canvas is retained for the Hero STATIC frame and resilience fallback, while the bounded aria-hidden Logs word field remains Canvas-only. One fixed transient code-particle Canvas may run only during charge or released-token lifetime. Logs and particles have no permanent loop; no Lenis, scroll snap, or scroll hijacking is added.
- The Hero word field has a bounded set of concentric text tracks and no route, node, dotted-guide, or floating-label graphics. Its WebGL surface stencil must match the shared curved black boundary. Logs Canvas uses deterministic real log title/date/tag tokens rather than random particles or fake terminal output.
- On stable bounds and fonts, FULL reuses shared geometry and glyph layout, builds its atlas/instance buffer once, samples the latest pointer position once per animation frame, and uses a 1.25x backing-store cap. STATIC may use Canvas at 2x because it has no frame loop. The animated Canvas resilience fallback preserves wall-clock motion while capping expensive redraws at 30fps.
- No scene load shifts semantic content or leaves an empty scene slot.
- ArchiveRuntime uses two IntersectionObserver bands and delegated real-content events. It never samples `window.scrollY`, installs a global continuous scroll handler, or stores pointer coordinates in React state.
- The Hero is the only permanent animation-frame scene. Pointer probe movement and bounded Logs reader progress each schedule at most one transient frame and clean it up on disable or unmount.
- Hero physics advances inside the existing renderer frame only. The kernel uses preallocated typed arrays, four bounded sources, fixed-step clamping, exact idle reset, and a maximum 1,000ms source lifetime. Particle storage is preallocated to 28 desktop or 14 coarse-visible records, expires by 1,600ms, and allocates no records in its frame loop.
- Build, TypeScript, and lint must pass without console errors or hydration warnings.
- Browser visual review at the required desktop and mobile sizes is separate evidence. This document defines that requirement and does not claim a completed browser acceptance pass.

## Verification record

Record the commands run, browser viewports inspected, mode behavior checked, static fallback evidence, and any blocked build or browser check. Do not state that visual inspection occurred until that record exists. This project does not create unit tests without explicit user approval.

### 2026-07-14 Scroll Compiler + Pointer Debugger browser record

- Browser: Microsoft Edge.
- Viewports inspected: desktop `1499 × 768`, mobile `390 × 844`, and narrow mobile `360 × 800`.
- Sections inspected: Hero, Timeline, Projects, and Logs. Same-viewport baseline/current comparisons for all four desktop sections and the narrow Logs capture are stored in [`docs/quality/evidence/2026-07-14-runtime`](./evidence/2026-07-14-runtime/).
- Interaction checks: forward and reverse compiler movement; single mounted section; Timeline marker trace; Project selection and native keyboard `summary` collapse/reopen; bounded Logs reader progress and real block read signals; transient signal deduplication and timeout behavior.
- Mode/input checks: FULL and STATIC; fine-pointer probe suppression in STATIC and coarse-compatible fallbacks; keyboard focus behavior.
- Lifecycle checks: `zh → en → zh` remount and FULL/STATIC switching completed without duplicate visible behavior or stale trace state.
- Console: only the React DevTools suggestion and normal development HMR messages were observed; there were no uncaught errors, hydration warnings, or application console errors.
- Static verification: `pnpm exec eslint . --quiet` completed with zero errors (the non-quiet lint run reported only pre-existing warnings in `.claude/skills/impeccable` tooling), `pnpm typecheck` passed, `git diff --check` passed, and `pnpm exec next build --webpack` produced all static routes successfully.
- Build note: the default Turbopack `pnpm build` remained at its compile stage without an error or completion and was stopped after repeated waits, including one retry after stopping the development server. The explicit webpack production build is the completed build evidence for this pass.
- Unit tests were not created or run because project rules require explicit user approval before adding them.
