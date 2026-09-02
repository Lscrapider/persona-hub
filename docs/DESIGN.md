---
title: Scra Atlas Design System
status: current
updated: 2026-09-01
---

## Overview

Scra Atlas is a continuous technical archive, not a collection of separate destination pages. The root document order is **Hero → Timeline → Projects → Logs**. Current Index remains inside the existing Hero composition rather than becoming an extra archive section. Lab is deferred for this release: its source may remain, but it is not root-rendered or active in archive navigation, and the legacy `/lab` route redirects to `/#index`. Native fragment navigation remains available for the active sections, but the Header is intentionally not rendered during the current Hero-composition pass; its final placement will follow visual review.

The visual direction restores the earlier Scra Atlas Hero: a wide bone information field, an oversized single-line title, and a near-black word field that enters off-canvas from the top-right and reaches the browser's right edge. Its visible left edge is a broad curve, not a standalone ball, clipped card, first-viewport rectangle, or joined curve with a visible bend. The Hero, scene, stage, and Current Index overlay share one dynamic desktop viewport-height frame; Index does not add a second flow height. One container-derived circular-arc model owns the dark fill, clipping edge, and Hero word-field scene; its endpoints and normalized curvature determine its radius, preventing separate surface and orbit coordinates from drifting apart on wide or tall displays. Current Index sits along the lower bone edge before the archive sections. Later archive surfaces alternate dark and light to make progression legible without turning the page into cards or dashboards.

User-provided screenshots informed hierarchy, movement language, and composition only. They are not source assets or a specification to copy. Scra Atlas keeps its own content, palette, typography, and interaction system.

## Colors

| Token | sRGB | Purpose |
| --- | --- | --- |
| --color-bone | #F7F1E9 | Light archive surface and dark-scene primary text |
| --color-void | #030202 | Hero, dark modules, and entry gate |
| --color-ink | #0E0A08 | Light-surface reader-facing text |
| --color-signal | #E6653C | Focus signal, cursor, and restrained interaction accent |
| --color-focus | #C74007 | Keyboard focus and high-contrast interaction states |
| --color-muted-text | #726A65 | Readable secondary copy and metadata |
| --color-silver | #9A948F | Secondary semantic route and inactive-node tone |
| --color-line | #342F2C | Low-intensity dark scene structure |

Terracotta is a signal, not a large background. Do not introduce green-terminal, blue-purple neon, rainbow gradients, or glow treatment. Decorative silver never carries required information.

## Typography

Local League Gothic is the display role for Hero and module headings. Local Manrope is the body role. The system mono stack is reserved for short status, paths, dates, and metadata. Chinese text uses native CJK fallbacks from the body stack.

Module display headings stay compact and readable. The Hero lockup may scale much larger when its bone information field retains adequate room; its actual size remains responsive to the viewport. English and numeric copy may use the one-time decoding visual. Chinese never becomes random glyphs; it uses a matching clip or mask reveal. Body text keeps natural punctuation and a comfortable line length.

## Structure and components

- SiteHeader: a preserved native-fragment navigation component with aria-current="location" for the observed archive section. It is temporarily unmounted while its final location is decided.
- LocaleProvider: publishes the server-selected local `zh` or `en` content package and updates the document language. `/` renders `zh`, while `/en` renders `en`; the language control uses full document navigation so the English document never retains Chinese serialized content. English package values and Markdown are rejected if they contain CJK characters; Chinese package copy may deliberately keep technical English.
- HomeExperience: composition only. It places Hero, Timeline, Projects, Logs, EntryGate, and the compact lower-right language/effect controls; it owns only the transient project selection shared by Current Index and Projects, never parsing or filesystem access.
- HomeHero: the bone information stage, title, signature, status, CTA, right off-canvas curved scene boundary, and Current Index transition.
- CurrentIndex: a semantic ordered list at the Hero boundary, not a card grid. Its ordinary hydrated click selects the matching project and smoothly scrolls to Projects without writing an archive fragment; a root-page reload then returns to the Hero. The native anchor remains as the no-JavaScript fallback.
- TimelineSection, ProjectsSection, LogsSection: feature-local semantic sections driven by typed archive data. On desktop, Timeline uses a warm light field with an oversized left title block, a compact central vertical rail, large year labels, and alternating event details that stay on their own side of the rail; below the mobile breakpoint it recomposes into one readable column. Its rail has an aria-hidden SVG trace and IntersectionObserver focal state. Projects uses a wide, editor-like three-pane technical archive: a real repository document tree at left, the selected technical document at center, and the project index at right. Each project opens its README by default; the curated tree favors architecture, algorithms, data pipelines, scoring rules, and model contracts over product/design drafts or API catalogs. The document address exposes both the GitHub repository and the exact source file. On smaller screens, Projects orders project selection before the filesystem and document so context remains explicit without horizontal overflow. Logs uses a dark indexed surface and a large asymmetric warm reader field. On desktop, the index and selected Markdown article scroll independently inside one bounded archive field; selecting a new article returns the reader to its top. Below the mobile breakpoint, it recomposes into one natural document flow to avoid nested touch scrolling.
- CopyReveal: the shared once-only reader-copy effect. It waits until the EntryGate has exposed archive content and the specific text reaches the viewport.
- ScrambleText: an accessible visual decode layer for Latin letters and numerals.
- TypewriterText: an accessible Hero signature loop with a stable screen-reader equivalent.
- ArchiveWebGLStage: the single fixed, aria-hidden WebGL2 canvas for the complete archive. Its Hero pass renders the curved technical word field with a glyph atlas and instanced geometry. Its later passes receive measured coordinates only from real DOM/SVG structures: Timeline markers, the selected Project and system-tree nodes, and the selected Log plus the existing curved reader boundary. No random circle, square, carrier, fake node, or arbitrary centre line may be introduced.
- KineticTypeField: the Hero's semantic scene anchor and WebGL-unavailable silhouette. It does not create a second canvas or animation loop.
- EntryGate: a skippable first-session cover. Archive content is hidden and inert while the cover is active after hydration; no-JavaScript rendering skips the cover.
- LocaleControl and EffectModeControl: compact route-backed `ZH / EN` and persisted FULL / STATIC controls that share one lower-right control cluster without changing the Hero composition.

Content belongs in `src/content/{zh,en}`, page features own semantic structure, shared entry effects live in src/effects/primitives, and continuous Hero lifecycle logic lives in src/effects/runtime.

## Motion and resilience

Two systems provide the persistent motion in FULL:

1. The Hero signature types, holds, deletes, pauses, and repeats.
2. The unified archive stage moves the Hero text tracks and then continuously hands the same visual signal to the page's real information structures. Timeline progress travels between measured milestone buttons. Project selection travels from the right-side project index into the center document address and then the selected left-side repository node, matching the workbench's information flow. Log selection joins the exact SVG reader seam, and the cursor on that seam is driven by real article reading progress. These routes are overlays on semantic DOM; they never replace controls or reader content.

In FULL, stable bounds and the resolved font create one glyph atlas and immutable instance buffer for the WebGL2 renderer. A display-rate animation frame lets the shader evaluate ring angles, whole-word orientation, radial type scale, the curved surface, and semantic route pulses on the GPU; it does not issue a Canvas `fillText` call for every glyph every frame. A single passive, animation-frame-coalesced motion controller derives scroll velocity, continuous scene position, and viewport-relative anchor coordinates. Scene transitions use one smooth position across section boundaries, so the Hero's black field and glyphs fade and deform out instead of switching off. The WebGL backing store is capped at 1.25 device pixels per CSS pixel, and inactive semantic scene functions exit before their fixed-bound loops. STATIC draws one deterministic WebGL frame without a scene animation loop. The detached 2D canvas is limited to generating the glyph texture sent to the GPU; it is not a scene renderer or fallback.

STATIC shows final text and a deterministic scene frame immediately whenever WebGL2 is available. System reduced motion starts in STATIC, while a persisted manual FULL preference remains valid. The unified stage pauses when the document is hidden. If WebGL2 cannot initialize or loses its context, the Hero keeps a non-interactive clipped dark silhouette, later sections keep their complete DOM/SVG structures, and no Canvas 2D scene renderer starts.

Timeline, Projects, and Logs remain DOM/SVG-first because their records, marker buttons, selection state, tree controls, and article content are reader-facing and keyboard operable. The WebGL stage measures opt-in `data-webgl-anchor` points and paints only an aria-hidden signal layer over those structures. The former generic particle layer, generic pointer ring, and feature-local Logs canvas are removed.

All reader-facing text appears in its final readable form in static rendering. One-time reveals do not replay while scrolling, and their measurement and visual layers inherit the host text's whitespace behavior so decoding cannot make a title or row reflow. Decorative scene glyphs are aria-hidden and excluded from copy reveal. No generic reduced-motion CSS rule cancels an explicit FULL preference.

## Elevation and interaction

The site does not use traditional card shadows. Hierarchy comes from surface changes, typographic scale, layout rhythm, thin rules, open space, and the Hero scene layer. Header, scene, and EntryGate follow the semantic layer tokens rather than arbitrary z-index values.

Use native anchor behavior, semantic sections, visible focus, and touch-sized controls. Current Index is the bounded exception: its hydrated project-selection action performs one smooth section scroll without changing the URL, so a refresh begins at the Hero. There is no scroll snap, Lenis, scroll hijacking, duplicate menu, or hidden hover-only information. A top navigation band is intentionally deferred rather than improvised over the Hero scene.

## Do and do not

Do: establish a static composition first, use bone, void, and terracotta with restraint, preserve native browser navigation, and isolate continuous scene work from content.

Do not: restore planets, nebulae, black holes, unrelated shaders, fake terminal status codes, random particles, arbitrary geometry, glowing neon, repeated rounded cards, glass panels, or another site's copy, brand, source code, or layout. A WebGL element must map to a named page structure or interaction state; if its meaning cannot be explained without referring to the shader, remove it.
