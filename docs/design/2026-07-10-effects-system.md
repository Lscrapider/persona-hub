# Scra Atlas effects system

**Status:** current
**Updated:** 2026-09-01

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
2. The unified WebGL stage moves the Hero text tracks and semantic archive signals.

The stage pauses when the document is hidden and renders one deterministic frame in STATIC.

## Archive feature effects

`ArchiveRuntime` sits between HomeExperience and the feature sections. Its prewarm and centre `IntersectionObserver` bands continue to drive the compiler grammar. A separate passive, animation-frame-coalesced motion controller reads scroll position only to produce continuous scene interpolation and viewport-relative positions for measured semantic anchors; it does not drive React render state or hijack scrolling. Delegated pointer, focus, and activation events consume feature-owned runtime metadata. The Build Trace is decorative, `pointer-events: none`, and `aria-hidden`; the former generic pointer ring is removed because it did not communicate section meaning.

Timeline keeps every milestone in semantic DOM. An aria-hidden SVG trace aligns to
the responsive rail, draws once when its group becomes visible in FULL, and is
complete immediately in STATIC. IntersectionObserver selects the focal record;
the marker buttons remain keyboard-operable and do not depend on scrolling.
Runtime targets identify the real record and marker. The WebGL stage measures the
actual marker centres and sends one scroll-driven signal cursor along those real
segments. Hover, focus, and activation continue to use the existing record state
rather than inventing a second selection model.

Projects uses DOM/CSS/SVG state because project selection and recursive system
tree expansion are reader-facing controls. The explorer never hides project
labels, and native `details` / `summary` branches preserve keyboard expansion
without an emulated ARIA tree. The stage measures the selected index row, detail
boundary, and visible tree nodes; a travelling selection packet and restrained
branches expose that actual topology without fabricating a background graph.

Logs renders its list, metadata, and selected Markdown article in semantic DOM.
The stage samples points from the exact existing SVG reader seam, joins the
selected log row to the nearest seam point, and moves one cursor along that curve
using the real bounded-reader progress. The former `LogWordField` is removed;
there are no fabricated background words or arbitrary lines. A passive reader
scroll listener schedules one frame that writes `--logs-read-progress` and emits
the corresponding stage event, while a reader-rooted observer assigns stable
phases to real `logs/{id}/block-NN` elements and emits discrete read signals.

## Modes

The system has exactly two modes:

- FULL: one-time CopyReveal, the unified WebGL stage, continuous boundary interpolation, semantic Timeline/Projects/Logs signals, section compiler transitions, and Build Trace feedback.
- STATIC: final copy, a deterministic unified-stage frame, complete Timeline trace, final compiler states, and no continuous visual animation.

System reduced motion starts in STATIC. A user can choose and persist FULL. The runtime, root dataset, and CSS all respect that explicit choice. No third or intermediate effect mode exists.

## Entry and failure rules

EntryGate may provide a short first-session ritual with an immediate skip action. While it is visible, the archive shell is hidden and becomes inert after hydration. With JavaScript disabled, the gate is skipped by default and content is readable.

The unified WebGL scene is aria-hidden and the Hero has a non-empty CSS silhouette fallback. Failure, backgrounding, mode changes, or an unavailable browser feature cannot hide content, trap focus, leave an empty Hero region, or make any archive section unavailable.

## Implementation boundaries

- Author-owned timeline, project, and log manifests live under `src/content`; Markdown filenames are allowlisted by the log manifest and parsed into safe blocks on the server before client rendering.
- Content records do not import effects.
- Feature sections own semantic structure.
- Shared primitives do not import archive records.
- HomeExperience composes Hero → Timeline → Projects → Logs and forwards typed data instead of parsing Markdown or accessing files. ArchiveRuntime wraps that composition but does not own feature state.
- IntersectionObserver drives Timeline focus, compiler bands, and Logs block phases. One passive window listener feeds the rAF-coalesced WebGL motion snapshot; no React scroll state, scroll snap, Lenis, or scroll hijacking is allowed.
- ArchiveWebGLStage is the only permanent rAF scene in FULL. Bounded Logs progress updates schedule at most one frame per input burst and cancel it during cleanup.
- Locale remounts, mode changes, EntryGate relocking, document visibility changes, and unmounts must remove all runtime timers, observers, listeners, and pending frames.

## Aesthetic checks

Before adding motion, answer:

1. Is the non-animated frame already readable and composed?
2. Does the effect communicate entry, location, or archive state?
3. Does it belong to this content rather than a generic template?
4. Does it stop when inactive?
5. Does it preserve focus, screen-reader text, and static fallback?

If any answer is no, do not add the effect.
