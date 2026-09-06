---
title: Scra Atlas Design System
status: current
updated: 2026-09-06
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
- TimelineSection, ProjectsSection, LogsSection: feature-local semantic sections driven by typed archive data. On desktop, Timeline uses a warm light field with an oversized sticky left title, a continuous bevelled Three.js ribbon in the middle, and complete DOM experiences on the right. Five record-specific artifacts express the experiences: undergraduate bound leaves, a Java assembly jig, an IELTS calibration slide, an AI research folio, and an AI application assembly. Native scrolling activates each structure; no record needs to be opened to read its content. Below 52rem the heading returns to document flow and a narrow model strip accompanies the single text column. See `docs/design/2026-09-06-spatial-timeline.md`. Projects uses a local Three.js architecture scene on a continuous graphite surface. Named, elevated responsibility groups, model scale and placement express hierarchy: Python intelligence is the Financial project focal point, Java owns business boundaries, and smaller storage components share a lower foundation. Urban emphasizes route orchestration and separates offline training. The Skill shows package organization instead of claiming a deployed service architecture. Click a service model to open its owned business documents in a dark modal with a left document selector. Documents are optional per node; scene processing and report/OCR/RAG designs belong to Python Workers rather than becoming independent architecture nodes. Mobile retains the scene plus a grouped module index. See `docs/design/2026-09-06-spatial-project-architecture.md`. Logs uses a dark indexed surface and a large asymmetric warm reader field. On desktop, the index and selected Markdown article scroll independently inside one bounded archive field; selecting a new article returns the reader to its top. Below the mobile breakpoint, it recomposes into one natural document flow to avoid nested touch scrolling.
- CopyReveal: the shared once-only reader-copy effect. It waits until the EntryGate has exposed archive content and the specific text reaches the viewport.
- ScrambleText: an accessible visual decode layer for Latin letters and numerals.
- TypewriterText: an accessible Hero signature loop with a stable screen-reader equivalent.
- ArchiveWebGLStage: the single fixed, aria-hidden WebGL2 canvas for the complete archive. Its Hero pass renders the curved technical word field with a glyph atlas and instanced geometry. Its later passes receive measured coordinates only from real DOM/SVG structures: the selected Log plus the existing curved reader boundary. Timeline owns its local renderer and does not publish anchors into this stage. No random circle, square, carrier, fake node, or arbitrary centre line may be introduced.
- KineticTypeField: the Hero's semantic scene anchor and WebGL-unavailable silhouette. It does not create a second canvas or animation loop.
- EntryGate: a skippable first-session cover. Archive content is hidden and inert while the cover is active after hydration; no-JavaScript rendering skips the cover.
- LocaleControl and EffectModeControl: compact route-backed `ZH / EN` and persisted FULL / STATIC controls that share one lower-right control cluster without changing the Hero composition.

Content belongs in `src/content/{zh,en}`, page features own semantic structure, shared entry effects live in src/effects/primitives, and continuous Hero lifecycle logic lives in src/effects/runtime.

## Motion and resilience

Two systems provide the persistent motion in FULL:

1. The Hero signature types, holds, deletes, pauses, and repeats.
2. The unified archive stage moves the Hero text tracks and then continuously hands the same visual signal to the page's real information structures. Timeline owns a separate lazy-loaded Three.js scene: a small three-dimensional bird follows native reading movement, lands by the active artifact and continues a shared manipulation cycle after scrolling stops. Stage structures open or align using interruptible damping. Projects now owns an independent lazy-loaded Three.js scene. Its directed routes connect service models at their actual elevated positions, while reference and planned relationships retain separate labels. Local model controls, hover, and flow selection expose these relationships without relying on the older global workbench overlay. Log selection joins the exact SVG reader seam, and the cursor on that seam is driven by real article reading progress. These routes are overlays on semantic DOM; they never replace controls or reader content.

In FULL, stable bounds and the resolved font create one glyph atlas and immutable instance buffer for the WebGL2 renderer. A display-rate animation frame lets the shader evaluate ring angles, whole-word orientation, radial type scale, the curved surface, and semantic route pulses on the GPU; it does not issue a Canvas `fillText` call for every glyph every frame. A single passive, animation-frame-coalesced motion controller derives scroll velocity, continuous scene position, and viewport-relative anchor coordinates. Scene transitions use one smooth position across section boundaries, so the Hero's black field and glyphs fade and deform out instead of switching off. The WebGL backing store is capped at 1.25 device pixels per CSS pixel, and inactive semantic scene functions exit before their fixed-bound loops. STATIC draws one deterministic WebGL frame without a scene animation loop. The detached 2D canvas is limited to generating the glyph texture sent to the GPU; it is not a scene renderer or fallback.

STATIC shows final text and a deterministic scene frame immediately whenever WebGL2 is available. System reduced motion starts in STATIC, while a persisted manual FULL preference remains valid. The unified stage pauses when the document is hidden. If WebGL2 cannot initialize or loses its context, the Hero keeps a non-interactive clipped dark silhouette, later sections keep their complete DOM content and applicable SVG structures, and no Canvas 2D scene renderer starts.

Timeline retains complete semantic DOM records alongside viewport-bounded Three.js geometry. Logs retains its DOM/SVG-first structure. Projects uses genuine volume geometry for its system scene, with projected native buttons, a text relationship list, and a native modal document reader for keyboard and screen-reader access. The WebGL stage measures opt-in `data-webgl-anchor` points and paints only an aria-hidden signal layer over those structures. The former generic particle layer, generic pointer ring, and feature-local Logs canvas are removed.

All reader-facing text appears in its final readable form in static rendering. One-time reveals do not replay while scrolling, and their measurement and visual layers inherit the host text's whitespace behavior so decoding cannot make a title or row reflow. Decorative scene glyphs are aria-hidden and excluded from copy reveal. No generic reduced-motion CSS rule cancels an explicit FULL preference.

## Elevation and interaction

The site does not use traditional card shadows. Hierarchy comes from surface changes, typographic scale, layout rhythm, thin rules, open space, and the Hero scene layer. Header, scene, and EntryGate follow the semantic layer tokens rather than arbitrary z-index values.

Use native anchor behavior, semantic sections, visible focus, and touch-sized controls. Current Index is the bounded exception: its hydrated project-selection action performs one smooth section scroll without changing the URL, so a refresh begins at the Hero. There is no scroll snap, Lenis, scroll hijacking, duplicate menu, or hidden hover-only information. A top navigation band is intentionally deferred rather than improvised over the Hero scene.

## Do and do not

Do: establish a static composition first, use bone, void, and terracotta with restraint, preserve native browser navigation, and isolate continuous scene work from content.

Do not: restore planets, nebulae, black holes, unrelated shaders, fake terminal status codes, random particles, arbitrary geometry, glowing neon, repeated rounded cards, glass panels, or another site's copy, brand, source code, or layout. A WebGL element must map to a named page structure or interaction state; if its meaning cannot be explained without referring to the shader, remove it.

## Projects spatial exception

Projects uses the shared page inset at every desktop width, with an uncapped content width and the same display-title scale as Timeline. The project index, architecture canvas and transport controls are unboxed; typography, whitespace and short copper selection underlines provide grouping. A fading scene background merges into the section surface. The desktop scene height follows 44% of its actual container width, limited by 76% of the viewport height and a 26–64rem range. The existing ResizeObserver and orthographic camera scale models and routes together as space changes. All projects, full views and walkthroughs share this sizing rule, so changing a flow does not change model scale; manual camera zoom remains independent. Narration aligns with the section's left edge inside the scene.

The current user direction adds a feature-local Three.js renderer alongside the existing archive canvas. This is intentional: project geometry and depth belong to the local responsibility graph. The renderer loads near the viewport, pauses offscreen, when the document is hidden, in STATIC, and while a modal is open. The feature tokens in `projects.css` own graphite surfaces (`#141719` / `#1a2227`), readable warm gray (`#e6e3dd`), restrained copper (`#d79a78`), and quiet dividers. The document modal uses adjacent dark tones without a bone background. The original site palette and other sections remain governed by the existing global tokens.

## Projects request playback

Project documentation opens in a viewport-sized reader rather than a fixed 1040×790px dialog. Desktop width grows up to 1920px with responsive outer margins; height follows the available viewport. The document index grows from 230px to 360px, while body text scales from 16px to 19px. The centered article keeps a 64rem reading measure (82ch for English). Navigation and content scroll independently, with the existing narrow/short-window layouts and accessible close/focus behavior retained.

Selecting a supported business flow runs one narrated interaction through the existing model architecture. Only the current route carries a tapered signal stroke; unboxed endpoint names and explanations in the scene’s upper-left whitespace describe the current action. The stroke fades on arrival as the receiving model performs the step's operation. A compact transport row sits below the scene. One continuous seek bar represents progress through the complete interaction, without visible step numbers. The shared Project flow player owns pause, single-step navigation, replay and 1×/2× speed. Its graphite, copper and text tokens are the existing `--atlas-*` tokens in `projects.css`. STATIC remains manually navigable, and opening module documentation suspends automatic playback. The sequences illustrate successful paths and never submit live backend work. OCR explicitly retains the human review gate.

Project models use tighter default camera framing while retaining responsibility hierarchy. Small unboxed captions remain clickable. Request packets render after scene geometry without depth testing so platforms and services cannot hide their position.

## Kinetic model finish

Project architecture models use small visible internal operating mechanisms in FULL, while node roots, captions, layout and camera remain stable. Chamfered chassis and hardware details use graphite, silver and copper PBR finishes; local environment reflections and selective directional shadows improve depth. Procedural geometry is shared per model, no remote media is loaded, and existing pause/reduced-motion/document lifecycle remains authoritative. See the spatial architecture design note for model-specific motions and installed skill provenance.

Idle mechanisms run slowly. Explicit flow operations drive localized computation, scanning, reading, writing and transfer activity, with phase-continuous speed changes. Connections use rounded orthogonal routes and platform-edge risers. Full/structural views carry no simulated traffic; active walkthroughs use a foreground copper-to-ivory stroke rather than a moving sphere or model halo.

Every active module also retains visible corner accents, moving short strips or a sweep, and a localized operation caption after the travelling signal arrives. Pending scene loading stays separate from actual failure fallback, so project switching cannot briefly expose a grid of old module cards.

Walkthrough boundaries share one clock: transfer, complete arrival, a short receiver-only processing hold, then release. Caller nodes never inherit the receiver’s computation or generation state. In-flight request labels describe transport semantics, while module captions describe work after arrival. Internal-only steps keep their local cue without creating a route signal.


## Timeline spatial experience

Timeline preserves the shared page inset without a maximum-width box. Its layout uses a 29% heading column and a 71% rail/content region with zero inherited grid gap. The transparent canvas spans the full Timeline inner width, while its measured model zone stays in the middle column. It is sticky and no taller than one viewport (maximum 90rem); document height never becomes render-buffer height. Model scale derives from actual container width and viewport height, capped at 170 CSS pixels per scene unit. Each record keeps its real date, category, title, organization/location where supplied, and description in DOM, in the existing latest-first order.

`timeline.css` owns the local copper (`#985b40`) and secondary text (`#73665c`) tokens. The renderer reads copper directly and resolves the shared OKLCH bone token to sRGB using a one-pixel color swatch. Model-only graphite, ceramic and edge tones live in `timelineModels.ts`; they do not alter site tokens. The continuous rounded cross section is swept along a depth-varying path. Original procedural meshes have bevels, binding, grooves, locating pins and material layers. There are no external model assets or borrowed project models.

Native scrolling alone selects the reading record. Artifacts have no click targets, hover boxes or jump controls. The bird follows continuous reading position, with distance-based docking and separate entry/exit radii; between milestones it stays at the reading position and keeps flying instead of snapping to either year. Its single native button supports pointer clicks and Enter/Space. A short wing/foot/head greeting takes it through the whitespace below the heading and returns it; scroll interrupts this response. Pointer movement directs its gaze without choosing a record or moving the page. FULL uses damped undergraduate leaf opening, research-folio unfolding, calibration alignment, Java insert seating and staggered AI application assembly. Once the bird lands, a shared category-paced cycle (7.2 seconds for paper, 6.1 for calibration, 5.4 for work controls) turns a leaf, lifts an annotation page, moves the calibration slider, presses a solid Enter key, or cycles through the three application buttons. Leaving a record damps its interrupted operation back to rest; STATIC renders the resolved pose only when invalidated. Offscreen and hidden documents cancel animation frames. The renderer uses at most 1.5 DPR and a 2048-pixel maximum backing-store dimension, cleans up on unload or failure, and keeps all text readable when unavailable. The previous SVG paths, node rings, global Timeline shader, uniforms and semantic anchor measurement have been removed; section indices stay intact for Hero and Logs transitions.


The September 6 Timeline refinement gives the five current records distinct silhouettes while keeping one material family. Record IDs 04 and 05 select a hinged study folio and a compact application assembly; the original category models remain the fallback for future records. Folio matrix/annotation marks and application input/output strokes are abstract topic cues, not invented results or architecture claims. Both the traveling sleeve and its replacement material highlight are removed. The current reading companion is an anatomically modeled bird, with a volumetric body, articulated wings, neck/head and gripping feet. It is an explicitly requested companion, not an extra historical event or achievement.


The bird uses natural, matte brown feather tones and a pale breast, distinct from the artifacts’ metallic copper. Continuous body and head volumes, layered curved feathers, shoulder/elbow/wrist articulation, head observation and pecking, and leg/toe motion are required: a planar icon bobbing on the track is not the intended finish. Travel and operation share the existing local renderer; there is no second RAF or React animation state. The bird’s actual beak marker and each moving artifact contact are transformed into the same world coordinates. The operation envelope keeps contact throughout manipulation rather than triggering a button while the beak is still approaching. All bird geometry/materials join the scene’s existing disposal path.

Bird orientations blend with quaternions across frontal, three-quarter and back views. Manipulation approaches follow the artifact’s outward surface normal, while the moving beak marker determines contact. Heading bounds and viewport limits constrain excursions. The companion button is projected into the same camera space; it has no hover border, retains a keyboard-only focus indicator and leaves the tab order when offscreen. STATIC clicking changes one finite pose and redraws once; it never starts a sustained loop.

The final bird pass stages observation, body preparation, beak approach, closed-mandible grip, pull, release and recovery separately. The lower jaw rotates about its anatomical root; it no longer translates open during a pull. A bounded neck reach absorbs damped torso lag during contact instead of snapping the entire bird to the page. Flight folds both leg segments and toes against the belly; hips inherit torso motion. Thinner curved wing vanes and a tapered primary-feather distribution soften the carved appearance. The two handled paper leaves bend continuously with matching printed marks and analytic normals; corner tension precedes hinge rotation and relaxes after it.


Timeline companion click motion uses a precomputed, interruptible route with a single translation owner: outward flight, one turn, and a return to a safe perch. Heading clearance is planned before departure instead of applying current-position feedback during the flight. Docking eligibility is independent of distance to the animated contact target, and work begins with a fresh observation after a greeting. Scroll, resize and STATIC cancel the route; repeated clicks during it cannot restart it. See `docs/design/2026-09-06-spatial-timeline.md` for the stutter fix and continuous browser evidence.
