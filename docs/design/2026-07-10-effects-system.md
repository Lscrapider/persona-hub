# Scra Atlas effects system

**Status:** current
**Updated:** 2026-07-14

## Purpose

Effects express archive entry, locating, reading, and transfer. They are not generic decoration. Every effect begins from a readable static composition and has a clear stop condition.

## Page-level motion grammar

- Compile: normal scrolling moves real sections through `queued → resolving → mounted → stable`; two observer bands support both directions and ensure at most one mounted section.
- Inspect: pointer hover and native focus identify real `data-runtime-target` paths without introducing interaction-only controls.
- Trace: one short, deduplicated Build Trace reports a real resolve, mount, inspect, open, toggle, select, pin, or read action, then clears itself.
- Resolve: a reader-facing label becomes legible once when it first enters view.
- Locate: a focused link, current section, or route uses the terracotta signal.
- Transfer: native fragment navigation moves the reader without scroll hijacking.
- Archive: surface changes and Current Index describe movement through one long document.
- Scene: the Hero provides one focused atmospheric field without competing with its content.
- Focus: Timeline uses IntersectionObserver to identify the reader's focal milestone; its marker buttons offer the same state explicitly without a scroll listener.
- Select and expand: Projects changes selected record state in DOM/SVG and uses native `details` / `summary` for recursive tree branches.
- Read: Logs changes an inline semantic article reader; its optional word field remains background-only scenery.

## CopyReveal

CopyReveal is the only shared reader-copy entrance pattern.

- It applies to readable Header, Hero, Index, section, project, status, and metadata text.
- It starts only after EntryGate exposes archive content and the individual span enters the viewport.
- Latin letters and numbers use an aria-hidden scramble layer with stable accessible text.
- Chinese uses a one-time clip or mask reveal and never becomes random glyphs.
- Each mounted item plays once and never replays during ordinary scrolling.
- The stable measurement layer and visual scramble inherit the host's whitespace rule, so a decoding frame never creates a transient line break or reflows neighbouring content.
- Decorative Canvas track text is excluded. The scene has no separate floating words.

## Hero scene

The Hero restores the bone information field, oversized single-line title, right-edge off-canvas curved Canvas word field, and lower Current Index threshold from the former Scra Atlas Home direction. The curve must read as a field entering the viewport, not as an isolated ball, a detached rectangular panel, or a first-viewport crop. The scene spans the full Hero / Index transition so its lower arc leaves through the right edge. The top navigation is intentionally unmounted until its eventual placement is chosen.

The word field uses repeated concentric Canvas tracks filled with real technical directions such as AI AGENTS, JAVA, PYTHON, MOBILE SYSTEMS, DEPLOYMENT, and RESEARCH NOTES. Its backing store, centre, and radii are measured from the rendered scene with ResizeObserver so each track extends naturally beyond the visible field at every browser size. It does not use fake status codes, terminal validation text, random telemetry, density rows, routes, nodes, dotted guide rings, or floating labels.

Within the Hero, only two effects continue after entry:

1. The signature typewriter types, holds, deletes right-to-left, pauses, and repeats.
2. Canvas text tracks move slowly around concentric paths at different periods.

Text-track motion pauses when the Hero leaves the viewport or the document is hidden.

## Archive feature effects

`ArchiveRuntime` sits between HomeExperience and the feature sections. Its prewarm and centre `IntersectionObserver` bands drive the compiler grammar without a global window scroll listener. Delegated pointer, focus, and activation events consume feature-owned runtime metadata. Pointer coordinates are coalesced into one animation frame and written only as CSS custom properties, not React state. The resulting probe and Build Trace are decorative, `pointer-events: none`, and `aria-hidden`; the trace is not a terminal or required status surface.

Timeline keeps every milestone in semantic DOM. An aria-hidden SVG trace aligns to
the responsive rail, draws once when its group becomes visible in FULL, and is
complete immediately in STATIC. IntersectionObserver selects the focal record;
the marker buttons remain keyboard-operable and do not depend on scrolling.
Runtime targets identify the real record and marker. Hover or focus can pulse the
local marker and SVG path, while activation continues to pin the existing record
state rather than inventing a second selection model.

Projects uses DOM/CSS/SVG state because project selection and recursive system
tree expansion are reader-facing controls. The explorer never hides project
labels, and native `details` / `summary` branches preserve keyboard expansion
without an emulated ARIA tree. Stable project and recursive node paths power the
probe feedback; CSS `:has()` may illuminate a hovered or focused node's real
ancestor path without making decorative leaves focusable.

Logs renders its list, metadata, and selected Markdown article in semantic DOM.
Its only visual enhancement is the bounded, aria-hidden Canvas 2D
`LogWordField` behind that reader. The field draws deterministic placements of
real manifest and selected-log titles, dates, and tags; it does not make fake
logs, terminal output, or required content. `ResizeObserver`, pointer activity,
and section/document visibility can request one redraw at a time. FULL may run
a short entrance composition, STATIC draws a deterministic final frame, and
there is no permanent requestAnimationFrame loop. If Canvas is unavailable,
the foreground reader remains complete. A passive scroll listener is attached
only to the bounded reader. It schedules one frame that writes
`--logs-read-progress`, while a reader-rooted observer assigns stable phases to
real `logs/{id}/block-NN` elements and emits discrete read signals.

## Modes

The system has exactly two modes:

- FULL: one-time CopyReveal, the two continuous Hero effects, section compiler transitions, a fine-pointer probe, a one-time Timeline trace draw, and only bounded active Logs-word-field or reader-progress work.
- STATIC: final copy, final Hero frame, complete Timeline trace, final compiler states, and a deterministic Logs word-field frame when its visible field is rendered, with no displacement, pulse, probe, or visual animation.

System reduced motion starts in STATIC. A user can choose and persist FULL. The runtime, root dataset, and CSS all respect that explicit choice. No third or intermediate effect mode exists.

## Entry and failure rules

EntryGate may provide a short first-session ritual with an immediate skip action. While it is visible, the archive shell is hidden and becomes inert after hydration. With JavaScript disabled, the gate is skipped by default and content is readable.

The Hero's Canvas scene is aria-hidden and has a non-empty static fallback. The Logs Canvas is also aria-hidden and optional. Failure, backgrounding, mode changes, or an unavailable browser feature cannot hide content, trap focus, leave an empty Hero region, or make the Logs reader unavailable.

## Implementation boundaries

- Author-owned timeline, project, and log manifests live under `src/content`; Markdown filenames are allowlisted by the log manifest and parsed into safe blocks on the server before client rendering.
- Content records do not import effects.
- Feature sections own semantic structure.
- Shared primitives do not import archive records.
- HomeExperience composes Hero → Timeline → Projects → Logs and forwards typed data instead of parsing Markdown or accessing files. ArchiveRuntime wraps that composition but does not own feature state.
- IntersectionObserver drives Timeline focus, archive visibility, active-section state, compiler bands, and Logs block phases. No global scroll loop, scroll snap, Lenis, or scroll hijacking is allowed.
- The Hero remains the only permanent rAF scene. Runtime pointer writes and bounded Logs progress updates schedule at most one frame per input burst and cancel it during cleanup.
- Locale remounts, mode changes, EntryGate relocking, document visibility changes, and unmounts must remove all runtime timers, observers, listeners, and pending frames.

## Aesthetic checks

Before adding motion, answer:

1. Is the non-animated frame already readable and composed?
2. Does the effect communicate entry, location, or archive state?
3. Does it belong to this content rather than a generic template?
4. Does it stop when inactive?
5. Does it preserve focus, screen-reader text, and static fallback?

If any answer is no, do not add the effect.
