# Scra Atlas effects quality gates

**Status:** current
**Updated:** 2026-07-10

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

## Mode and lifecycle checks

- FULL: CopyReveal plays once per visible reader item; the Typewriter and Canvas text-track scene are the only persistent motion systems.
- STATIC: complete text and a final Hero frame appear immediately with no visual animation.
- System reduced motion initially resolves to STATIC.
- A persisted manual FULL choice remains effective even when the system preference requests reduced motion.
- The Hero Typewriter and Canvas tracks pause while the Hero is off-screen or the page is hidden.
- A mode switch, scene error, or unavailable enhancement leaves a readable and non-empty static fallback.

## Performance and implementation checks

- Canvas is restricted to the aria-hidden Hero word field, which has one activity-gated rAF loop. No WebGL, shaders, particles, Lenis, scroll snap, or permanent rAF loop is added.
- Canvas has a bounded set of concentric text tracks and no route, node, dotted-guide, or floating-label graphics.
- On stable bounds and fonts, FULL reuses geometry and glyph-advance layout, skips whitespace and off-viewport anchors before drawing, and uses a 1.5x backing-store cap. STATIC may use 2x because it has no frame loop.
- No scene load shifts semantic content or leaves an empty scene slot.
- Build, TypeScript, and lint pass without console errors or hydration warnings.
- The user performs visual review at desktop and mobile sizes. Automated checks cover type, lint, and build output; no browser acceptance pass is claimed by the agent for this iteration.

## Verification record

Record the commands run, browser viewports inspected, mode behavior checked, static fallback evidence, and any blocked build or browser check. This project does not create unit tests without explicit user approval.
