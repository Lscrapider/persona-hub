# Scra Atlas effects system

**Status:** current
**Updated:** 2026-07-10

## Purpose

Effects express archive entry, locating, reading, and transfer. They are not generic decoration. Every effect begins from a readable static composition and has a clear stop condition.

## Page-level motion grammar

- Resolve: a reader-facing label becomes legible once when it first enters view.
- Locate: a focused link, current section, or route uses the terracotta signal.
- Transfer: native fragment navigation moves the reader without scroll hijacking.
- Archive: surface changes and Current Index describe movement through one long document.
- Scene: the Hero provides one focused atmospheric field without competing with its content.

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

Only two effects continue after entry:

1. The signature typewriter types, holds, deletes right-to-left, pauses, and repeats.
2. Canvas text tracks move slowly around concentric paths at different periods.

Text-track motion pauses when the Hero leaves the viewport or the document is hidden.

## Modes

The system has exactly two modes:

- FULL: one-time CopyReveal and the two continuous Hero effects.
- STATIC: final copy and final Hero frame immediately, with no visual animation.

System reduced motion starts in STATIC. A user can choose and persist FULL. The runtime, root dataset, and CSS all respect that explicit choice. No third or intermediate effect mode exists.

## Entry and failure rules

EntryGate may provide a short first-session ritual with an immediate skip action. While it is visible, the archive shell is hidden and becomes inert after hydration. With JavaScript disabled, the gate is skipped by default and content is readable.

The Hero's Canvas scene is aria-hidden and has a non-empty static fallback. Failure, backgrounding, mode changes, or an unavailable browser feature cannot hide content, trap focus, or leave an empty Hero region.

## Implementation boundaries

- Content records do not import effects.
- Feature sections own semantic structure.
- Shared primitives do not import archive records.
- HomeExperience composes instead of rendering low-level scene choreography.
- IntersectionObserver drives visibility and active section state. No scroll loop, scroll snap, Lenis, or scroll hijacking is allowed.

## Aesthetic checks

Before adding motion, answer:

1. Is the non-animated frame already readable and composed?
2. Does the effect communicate entry, location, or archive state?
3. Does it belong to this content rather than a generic template?
4. Does it stop when inactive?
5. Does it preserve focus, screen-reader text, and static fallback?

If any answer is no, do not add the effect.
