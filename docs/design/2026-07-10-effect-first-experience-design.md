# Scra Atlas effect-first experience design

**Status:** current
**Updated:** 2026-07-14

## Direction

Scra Atlas is a continuous personal technical archive. It begins with an identity and living Hero, then lets visitors read Timeline, Projects, and Logs in one scrollable root document. The active sequence is **Hero → Timeline → Projects → Logs**; Current Index remains part of the Hero threshold rather than a separate archive module.

The experience should feel precise, dynamic, authored, and participatory: scrolling should feel like compiling a real project archive, while pointer and keyboard focus inspect the content already being read. It should not resemble a route collection, a generic portfolio grid, a fake terminal, or a celestial technology demo.

## Information architecture

~~~text
/                 Hero / Index -> #timeline -> #projects -> #logs
/projects         redirect to /#projects
/blog             redirect to /#logs
/timeline         redirect to /#timeline
/lab              redirect to /#index
~~~

Lab is deferred for this iteration: it has no active root fragment or navigation entry, although its source files may remain until a dedicated surface returns. The existing Current Index keeps its composition and sends its Infrastructure Lab item to `/#projects` in the meantime.

The native-fragment Header and its IntersectionObserver state are preserved for later placement. It is intentionally unmounted during the current Hero pass so the scene reaches the browser's top edge. When rendered, it observes only active archive sections, does not alter the URL while scrolling, and does not take control away from browser Back and Forward.

## Hero

The Hero restores the earlier Scra Atlas arrangement: a wide bone information surface holds the oversized single-line SCRA ATLAS lockup, signature, Chinese description, status, and CTA. A near-black field enters off-canvas from the top-right and carries the decorative word scene; its single broad left arc must not read as an isolated ball.

Current Index runs along the lower bone edge. The curved Canvas field uses low-contrast technical vocabulary arranged in concentric circular text tracks, with no terracotta route, dotted guide rings, or free-floating labels. The screenshot reference influences only visual hierarchy and movement language. Scra Atlas does not copy its branding, text, layout, code, or assets.

## Archive modules

- Timeline frames verified development milestones without inventing dates or events. Its semantic rail has marker buttons, a responsive aria-hidden SVG trace, and an IntersectionObserver-driven focal state rather than a scroll listener.
- Projects organizes the present project records through a selectable archive explorer. Its recursive system map uses native `details` and `summary`, so expansion remains keyboard-native.
- Logs is the honest home for authored engineering records. The article list and inline reader stay in semantic DOM; local Markdown is rendered from safe structured blocks.
- A bounded, aria-hidden Logs Canvas word field may sit behind the reader. It uses deterministic real article titles, dates, and tags, never contains required information, and has no permanent animation loop.
- Lab is deferred rather than represented by a missing or inactive root section.

Each module is a labelled semantic section, not a separate top-level visual shell. It may have a distinct surface and feature-local display treatment while preserving the common long-scroll rhythm.

## Scroll compiler and pointer debugger

The added interaction layer changes behavior rather than redesigning the established UI. `ArchiveRuntime` wraps the existing section composition and applies one shared state language: `queued → resolving → mounted → stable`. A prewarm observer band starts a section's resolve response, while a centre observer band makes at most one section the mounted focus. The same rules work in both scroll directions and do not depend on `window.scrollY` or a global scroll handler.

Features expose real `data-runtime-target` paths rather than invented telemetry. Pointer hover, native keyboard focus, and existing activation controls can therefore inspect a Timeline record, select a Project, toggle a native tree branch, or read a Log block without adding interaction-only focus stops. The low-contrast probe is visible only for fine pointers in FULL mode. Its position is written to CSS variables in one scheduled frame and never becomes rapidly changing React state.

A short Build Trace connects these actions to the compiler language. It is transient, deduplicated, `aria-hidden`, and built only from real archive paths. It deliberately does not imitate a terminal, expose fake compilation output, or carry information required to operate the page.

## Motion and accessibility

Reader copy has a single one-time entry language: English and numbers decode, Chinese reveals through a mask or clip. It starts only when the cover has released the archive and the copy itself becomes visible. It never replays during normal scroll. Section compilation changes only local position, signal strength, marker treatment, and trace feedback; content remains readable before and throughout every phase.

The Hero signature and Hero scene system contain the only persistent motion, and the Hero word field is the only permanent animation-frame scene. It combines slow path text with its curved clipping field and pauses when off-screen or backgrounded. The optional Logs word field runs only a brief FULL entrance and visibility-gated redraws from resize or pointer activity. Logs reading progress listens passively only to its bounded reader and coalesces CSS-variable updates into a single scheduled frame. STATIC uses deterministic final frames and disables compiler displacement, pulse, and probe. System reduced motion starts in STATIC, but an explicit persisted FULL setting remains available.

No required content depends on hover, random glyph stabilization, visual scene completion, Canvas, or a particular rendering API. Timeline and Projects retain DOM/SVG controls because their state is information, not scenery.

## Visual language

- near-black, bone, and terracotta form the primary structural palette;
- typography, text rings, clipping, and negative space create hierarchy;
- local display, body, and system-mono roles remain distinct;
- ordinary content stays open rather than boxed into repeated cards;
- terms use real archive content rather than fake status codes;
- mobile is recomposed vertically rather than cropped from desktop.

## Explicit exclusions

- No planets, black holes, nebulae, particle fields, raymarching, decorative shaders, or WebGL showcase.
- No green terminal imitation, neon glow, fake logs, fake Build Trace telemetry, or persistent random text.
- No scroll snap, Lenis, scroll locking, duplicate navigation, or continuously rewritten URL.
- No reference-site copying.
