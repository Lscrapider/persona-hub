# Scra Atlas effects quality gates

**Status:** current
**Updated:** 2026-07-11

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
- Actual browser screenshots or recording are required for final visual approval.

## Navigation and accessibility checks

- Each archive module has a labelled section, id, and safe anchor scroll margin.
- Stored Header anchors reach the correct fragments with native browser history when the component is rendered again.
- IntersectionObserver highlights the current module without a scroll listener or URL rewriting.
- aria-current="location" appears only on the active archive link.
- EntryGate prevents keyboard focus from reaching the archive shell while visible. With JavaScript disabled, content remains readable because the gate is skipped.
- Focus remains visible on CTA, Current Index, controls, and archive links.
- Assistive technology receives stable final reader text; decorative Canvas text and scramble glyphs are hidden.
- There is no required hover-only information.
- Timeline marker buttons have accessible focus labels and can select the focal milestone without a scroll listener.
- Project selection works with standard buttons, and recursive system branches expand through native `details` / `summary` controls.
- Logs keeps title, date, status, tags, summary, and article body in semantic DOM. Markdown is rendered from safe structured blocks: no raw HTML is injected and only HTTP(S) inline links become links.
- The loader rejects malformed or duplicate manifest fields, unordered timeline dates, unknown/unsafe log filenames, and path traversal before a Markdown file is read.

## Mode and lifecycle checks

- FULL: CopyReveal plays once per visible reader item; the Typewriter and Hero Canvas text-track scene are the only persistent motion systems. Timeline may draw its trace once, and Logs may run only its short active entrance or a requested redraw.
- STATIC: complete text, a final Hero frame, a complete Timeline trace, and a deterministic visible Logs-word-field frame appear without visual animation.
- System reduced motion initially resolves to STATIC.
- A persisted manual FULL choice remains effective even when the system preference requests reduced motion.
- The Hero Typewriter and Canvas tracks pause while the Hero is off-screen or the page is hidden.
- The Logs word field is aria-hidden, visibility/document gated, and stops after its fixed entrance. Resize and pointer activity may schedule one redraw only while the field is active; it has no permanent requestAnimationFrame loop.
- A mode switch, scene error, or unavailable enhancement leaves a readable and non-empty static fallback.

## Performance and implementation checks

- Canvas is restricted to the aria-hidden Hero word field and the bounded aria-hidden Logs word field. Hero has one activity-gated continuous rAF loop; Logs has no permanent loop. No WebGL, shaders, particles, Lenis, scroll snap, or scroll hijacking is added.
- Hero Canvas has a bounded set of concentric text tracks and no route, node, dotted-guide, or floating-label graphics. Logs Canvas uses deterministic real log title/date/tag tokens rather than random particles or fake terminal output.
- On stable bounds and fonts, FULL reuses geometry and glyph-advance layout, skips whitespace and off-viewport anchors before drawing, and uses a 1.5x backing-store cap. STATIC may use 2x because it has no frame loop.
- No scene load shifts semantic content or leaves an empty scene slot.
- Build, TypeScript, and lint must pass without console errors or hydration warnings.
- Browser visual review at the required desktop and mobile sizes is separate evidence. This document defines that requirement and does not claim a completed browser acceptance pass.

## Verification record

Record the commands run, browser viewports inspected, mode behavior checked, static fallback evidence, and any blocked build or browser check. Do not state that visual inspection occurred until that record exists. This project does not create unit tests without explicit user approval.
