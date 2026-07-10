# Single-page archive and living Hero design

**Status:** approved
**Date:** 2026-07-10

## Purpose

Turn Scra Atlas from a small set of reserved routes into one continuous technical archive. Visitors move through the archive by scrolling; navigation points to and reflects the current section rather than opening separate module pages.

This direction is grounded in the user-provided screenshots from this task. They are visual references for hierarchy, motion language, and composition only. The implementation uses Scra Atlas content, typography, palette, and interaction language. It does not reproduce another site's brand, copy, code, assets, or concrete layout.

## Information architecture

The root route contains one semantic archive flow:

1. Hero / index
2. #projects
3. #logs
4. #timeline
5. #lab

The fragment-navigation foundation remains native: its links point to root fragments, and an IntersectionObserver scroll spy can mark the section occupying the reader's central viewport band. During the current Hero composition pass, no top navigation is rendered; its eventual placement is deliberately deferred so the scene can use the entire browser top edge. Anchor navigation stays native. There is no scroll lock, scroll snap, Lenis, or frame-by-frame scroll listener.

Existing /projects, /blog, /timeline, and /lab routes preserve compatibility by redirecting to their respective root fragments. Future project or article detail routes are outside this change.

## Hero composition

The Hero restores the earlier Scra Atlas composition supplied by the user: a wide bone-white information surface on the left and a large near-black word field that enters off-canvas from the top-right. Its visible left boundary is one broad curve, not a standalone black ball, card, panel, or copied external layout.

- The title is an oversized single-line SCRA ATLAS lockup on the left at desktop sizes.
- The signature, Chinese description, archive status, and ENTER ARCHIVE CTA retain their left-side reading order.
- The browser top edge is intentionally clear during this iteration. The former top navigation is not rendered until its eventual placement is chosen.
- On desktop, Current Index lives as an overlay along the lower edge of the bone field inside the same Hero frame. It is the archive threshold, not an additional flow block that extends the frame beyond the viewport.
- The right near-black field reaches the browser's right edge and is clipped only by one broad left-side curve. Its scene surface spans the full Hero and Current Index transition, so the curve exits through the right edge rather than being horizontally cut at the first viewport's bottom. The surface must not use an unrelated CSS ellipse or joined Bézier segments: one container-derived circular-arc model defines its black fill, clipping boundary, and exit point.
- On desktop, Hero and its first stage use one actual dynamic viewport-height frame (with a stable viewport fallback). Scene, stage, and Index overlay all measure from that same frame; they must not use a rem ceiling or a separate Index flow block that makes the Hero taller than the browser height.
- The right field is an aria-hidden Canvas 2D scene: repeated technical text tracks fill its available surface. It uses real directions such as AI AGENTS, JAVA, PYTHON, MOBILE SYSTEMS, DEPLOYMENT, RESEARCH NOTES, SYSTEM DESIGN, and DATA FLOWS. It deliberately has no density rows, terracotta route, nodes, or pseudo-status graphics.
- The tracks are a visually full but readable family of 38 concentric inward offsets of the left surface arc: they share its calculated circle centre and curvature, then are clipped to the same black field. Every track uses one shared responsive base size, capped by the measured radial step and never below 7px. Muted bone-white glyphs and sufficiently repeated copy provide coverage without a large number of tiny animated bands. The supplied reference informs only the coverage and type treatment, not the track geometry.
- Adjacent tracks move in opposite directions at slow distinct periods. Their durations interpolate by track count across a 360-second outer to 160-second inner envelope, so additional rings do not create rapid inner loops. Every cached track layout occupies one exact `0…2π` turn, so no final glyph can wrap onto the first glyph at the circular seam. Each measured radius determines the in-turn character count and reserves its tail for a deterministic short technical connector, cycling `AI`, `PHY`, and `JAVA`; the connector ends at the seam while any preceding remainder stays below one ordinary glyph advance. The complete turn keeps the clipped field populated without an oversized text payload. Thirteen deliberately distributed text tracks then add deterministic gaps at three times their former length, traced by a low-alpha `·` at every gap cell, while normal word spacing and the other twenty-five tracks remain dot-free and continuous.
- Track centre, radii, guide paths, black surface path, clipping boundary, and Canvas backing-store dimensions derive from one rendered-scene geometry model. The surface arc calculates its top entry and right-edge exit from the scene box, then derives its radius from their chord length and one normalized curvature constant. A ResizeObserver updates that model only when layout dimensions change, so short, tall, narrow, and wide viewports keep the same continuous field relationship without a scroll listener.
- Mobile preserves the information order and moves the curved field beneath the primary identity without crop or horizontal overflow.

## Motion language

All primary information is readable in a static rendering. Motion conveys entry and scene activity only.

### Effect modes

Scra Atlas exposes exactly two user-facing modes:

- **FULL:** default when no system reduced-motion preference applies. It enables one-time copy reveals and the two continuous Hero effects.
- **STATIC:** shows final text values and the final Hero scene frame immediately, with no visual animation.

When the operating system requests reduced motion, the initial resolved mode is STATIC. A visitor may explicitly choose FULL afterward; that choice is persisted locally. There is no intermediate motion tier or generic CSS rule that can override an explicit FULL choice.

### One-time copy reveal

Every reader-facing label uses one shared, one-time entrance language when it first enters view in FULL mode. This includes header labels, Hero title, signature context, status labels and values, CTA, Current Index labels and rows, project names, metadata, module titles, summaries, and status lines.

- Latin letters and numerals use Scra Atlas character decoding.
- Chinese copy uses a matching one-time mask or clip reveal, never random glyph substitution.
- A mounted text item plays once and never replays during ordinary scrolling.
- Reveal observation begins only after archive content is actually exposed by the EntryGate. Text hidden underneath the first-visit overlay cannot consume its one-time reveal.
- Scramble measurement and visual layers inherit the host's whitespace behavior, so a decoding frame cannot create a transient line break or change a row's layout.
- Decorative Canvas track text is excluded because it is not reader-facing content; the scene has no separate floating text labels.

### Typewriter signature

A map of systems I have built. follows this FULL-mode cycle:

1. Type one character at a time.
2. Hold the completed sentence.
3. Delete from right to left.
4. Pause briefly, then restart.

The changing visual layer is aria-hidden. A stable, complete sentence remains exposed to assistive technology at all times. STATIC displays the complete sentence with no cursor loop.

### Living word field

The Hero uses semantic DOM plus one aria-hidden Canvas 2D word-field renderer. The user explicitly approved this Hero-only Canvas exception on 2026-07-10 after reviewing a public reference implementation. It does not authorize copying that site's code, words, geometry, timing, brand, or assets. WebGL, shaders, particles, and neon effects remain excluded.

- One Canvas render loop draws all 38 concentric text rings and the derived black surface in one shared coordinate system. It draws each track around one exact circular turn before clipping to the Scra Atlas half-circle, avoiding SVG textPath wrap gaps, a duplicated seam glyph, and per-track DOM animation overhead. The rings themselves have no visible dotted guide treatment or separate floating labels.
- Adjacent tracks move slowly in opposite directions, interpolating their 38 distinct periods across a 360-second outer to 160-second inner envelope. A track's reserved terminal connector cycles `AI`, `PHY`, and `JAVA`, fitting completely before `2π` so the next animation position never overlaps its first glyph. Thirteen tracks retain deterministic breathing gaps at three times their former length, with a low-alpha `·` at every gap cell; the other twenty-five stay continuous and dot-free. Track-letter spacing stays wide. One shared responsive font is capped at 66% of the measured radial step and never below 7px, preventing collisions while preserving the 18px desktop maximum. FULL resolves that one base Canvas font per frame, avoiding per-track font churn and extra glyph population. It also skips anchors outside the measured black circular surface before transforms or drawing, while retaining the Canvas clip as the final edge guard; cached local sine/cosine values avoid per-glyph trigonometry in each frame.
- Geometry and glyph advances cache while the measured scene box and resolved font remain stable. FULL evaluates motion every frame but skips whitespace and off-viewport anchors before one direct Canvas transform and one glyph draw; it caps the backing store at 1.5x. Its pointer circle replaces letters and numbers with a medium-alpha `·` at the same anchors, while decorative connector dots remain visible. STATIC can use 2x because it renders a single deterministic frame.
- In FULL desktop pointer input, a cursor-centred circle replaces letters and numbers inside its radius with medium-alpha `·` at their existing anchors. The black surface, required copy, touch devices, and STATIC remain unaffected.
- No free-floating scene words appear outside the text rings.
- The Typewriter signature and the Canvas scene are the only persistent motion systems on the page.
- The tracks pause when the Hero is outside the viewport or the document is hidden.
- STATIC renders a non-empty final frame. A scene error or unavailable enhancement leaves a static fallback rather than a blank visual region.

## Section responsibilities

Each later section is a semantic part of the one archive flow and owns a feature-local display moment:

- Projects: system and project index.
- Logs: engineering-note stream and authored records.
- Timeline: chronological development path.
- Lab: bounded experiments, prototypes, and active explorations.

HomeExperience only composes these features. Content data, shared copy reveal, and Hero scene lifecycle stay outside the composition layer.

## Accessibility and resilience

- Every archive module is a section with id, visible heading, aria-labelledby, and scroll-margin-top.
- The dormant fragment header uses aria-current="location" when it is rendered again; native anchors keep browser history and no-JavaScript navigation intact.
- While EntryGate is visible, all archive content beneath it is visually hidden and inert after hydration, so keyboard focus cannot enter it. With JavaScript unavailable, the default gate state is skipped and the archive remains readable.
- FULL and STATIC remain consistent across runtime and CSS. System reduced motion selects STATIC only until an explicit user choice.
- No core content depends on hover, animation completion, or the word field.

## Non-goals

- No planet, nebula, black-hole, particle, raymarching, or decorative WebGL experience.
- No fake terminal logs or arbitrary status codes.
- No second navigation system, full-screen scroll snapping, or separate top-level module pages.
- No invented project, article, or timeline facts.

## Acceptance criteria

1. Visitors can read all four modules on the root page by scrolling or using native anchors.
2. The stored fragment-navigation component can accurately reflect the visible module without scroll-jacking when it is reintroduced.
3. The Hero restores the approved bone information field, oversized single-line title, and a right-edge, off-canvas curved word-field hierarchy while remaining recognizably Scra Atlas at short and tall viewport heights, without a horizontal lower cut.
4. Reader-facing copy reveals once in FULL after it is actually visible; Chinese remains readable throughout.
5. The signature loops only in FULL and stays stable for assistive technologies and STATIC.
6. Canvas word tracks loop only in FULL, pause off screen or in a hidden document, support the bounded desktop pointer dot-substitution field, and have a static fallback.
7. Desktop and mobile retain readable title, navigation, signature, CTA, Index, and module entry points without horizontal overflow.
