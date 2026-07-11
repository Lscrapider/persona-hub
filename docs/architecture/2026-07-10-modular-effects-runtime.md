# Scra Atlas modular effects runtime

**Status:** current
**Updated:** 2026-07-11

## Purpose

The runtime keeps content, semantic page structure, one-time copy entry, and continuous Hero motion independently replaceable. A scene failure, a preference change, or an unavailable browser feature must not block navigation or reading.

## Current page boundary

~~~text
src/content/timeline.json, projects.json, logs.json, logs/*.md
  -> src/lib/content validation and safe Markdown parsing (server execution)
  -> typed, serializable ArchiveContent
  -> src/app/page.tsx
  -> HomeExperience composition
  -> TimelineSection / ProjectsSection / LogsSection
  -> feature-local DOM, SVG, and the two bounded Canvas fields
~~~

- Content owns archive ids, labels, summaries, statuses, project records, and log manifests. Log filenames are allowlisted simple `.md` basenames, resolved only below `src/content/logs`, and cannot be selected from client input.
- `src/lib/content/archive.ts` validates record fields, unique identifiers and slugs where applicable, strictly ordered timeline dates, and unique log filenames. It reads Markdown on the server, turns it into serializable safe blocks, and passes neither filenames nor filesystem access to the client. It uses the declared Node APIs directly and requires no extra package dependency.
- `MarkdownArticle` renders those blocks without raw HTML and permits only HTTP(S) inline links. Unsupported Markdown remains text instead of executable markup.
- Feature sections own their semantic markup and local layouts. Timeline uses a semantic rail plus aria-hidden SVG; Projects uses selected DOM state and native `details`; Logs keeps its list and article reader in DOM.
- HomeExperience composes Hero → Timeline → Projects → Logs, forwards typed data, and exposes whether EntryGate has released archive content. It does not parse Markdown, access files, or own feature selection state.
- CopyReveal owns once-only visibility observation. It does not know project data or page layout.
- HomeHero owns the bone information stage and right-edge, off-canvas curved Canvas scene, then passes lifecycle activity to its Typewriter and Canvas scene.
- SiteHeader owns fragment presentation and obtains active state from an archive-specific observer hook, but is intentionally unmounted while its final placement is deferred.

## Effect mode contract

~~~ts
type EffectMode = "full" | "static";
~~~

- FULL is the normal initial mode when the system does not request reduced motion.
- STATIC is the initial system-reduced-motion mode and renders final frames with no visual animation.
- A stored explicit FULL or STATIC choice wins over the system preference.
- The root data-effect-mode attribute mirrors the resolved mode so CSS and JavaScript use one contract.
- There is no intermediate effect mode.

## Copy reveal contract

CopyReveal accepts plain reader-facing text plus a boolean that says archive content is exposed.

1. Until EntryGate releases the archive, CopyReveal shows the final text and does not begin observing.
2. In STATIC, it always shows the final text.
3. In FULL, it observes its own span with IntersectionObserver.
4. The first visible entry starts once and is remembered for that mounted item.
5. Latin and numeric text uses an aria-hidden scramble visual with stable accessible text.
6. Chinese text uses a one-time visual clip or mask without random characters.
7. The scramble measurement and visual layers inherit their host's white-space behavior, so a decoding frame cannot alter a title's line breaks or a row's layout.

This separates the first-visit cover from copy animation and prevents hidden copy from finishing before a visitor can see it.

## Scene lifecycle contract

`useSceneActivity(targetRef)` derives activity from its target's intersection and document visibility without a scroll listener. Hero and the bounded Logs field both use that lifecycle gate, but only Hero owns continuous work. On desktop, Hero, stage, scene, and Current Index overlay share one dynamic viewport-height frame without a rem cap; Index is removed from the frame's flow calculation. A separate ResizeObserver measures that final decorative Hero scene only when its rendered box changes; one geometry model derives the Canvas backing-store size, black-surface circular arc, clip path, and orbit radii without participating in scrolling. The arc uses two measured endpoints and a normalized radius factor, avoiding the tangent discontinuity caused by joined Bézier segments. FULL Hero scenes animate only when active. When Hero leaves the viewport or the document becomes hidden, the one Canvas frame loop is cancelled and the elapsed angle is retained. STATIC draws a deterministic frame once.

The only persistent homepage work remains the Typewriter cycle and one Hero Canvas scene system: all 38 text rings and the pointer dot-substitution field are rendered in a single requestAnimationFrame loop. Canvas uses no runtime randomness. Their slow distinct periods interpolate across a 360-second outer to 160-second inner envelope regardless of track count. Cached glyph layout admits only advances that fit in one exact `0…2π` turn, then reserves the terminal in-turn segment for a complete deterministic `AI`, `PHY`, or `JAVA` connector. This prevents a final glyph from wrapping over the first glyph at the circular seam. Thirteen deliberately distributed bands use deterministic gaps that are three times the earlier length, with a low-alpha `·` at every gap cell, while the other twenty-five continuously repeat dot-free technical copy. The pointer field replaces letter and number glyphs with a medium-alpha `·` at the same anchor, while deliberately retaining the low-alpha connector dots. Track-letter spacing is widened. All tracks share the one responsive font, capped at 66% of the measured radial step and never below 7px, so there is no per-track scale or additional in-turn glyph population. One base-font glyph metric per character is cached. FULL sets that base Canvas font once per frame, avoiding per-track font churn. Cached local sine/cosine values combine with one start-angle pair per track, avoiding per-glyph trigonometry. Before pointer checks, transforms, or `fillText`, the renderer analytically discards an anchor outside the same measured circular black surface, with a font margin to retain the edge treatment; the Canvas clip stays in place as a final visual guard. The scene uses no visible guide rings, floating labels, density rows, routes, or nodes. Every continuous control is cleaned up on change or unmount.

The Canvas renderer caches its derived arc geometry and per-track glyph advances until CSS-pixel bounds or the resolved font changes. Each FULL frame still evaluates the ring positions for smooth motion, but skips whitespace and anchors outside the Canvas rectangle before assigning a direct device-pixel transform and issuing `fillText`; it does not allocate a width map, call `measureText`, or use a save/translate/rotate/restore stack for each glyph. FULL caps the backing store at 1.5 device pixels per CSS pixel, while STATIC may use 2x because it renders only once.

## Renderer decision

The Hero uses semantic DOM for required information and one aria-hidden Canvas 2D renderer for the dense decorative word field. Canvas is selected because it draws every ring in one frame and avoids both SVG textPath wrapping gaps and independent per-track animation work. KineticTypeField has an error-boundary fallback that preserves a static visual region, so the Hero remains readable if the enhanced scene fails.

`LogWordField` is the only other Canvas renderer. It is bounded behind the Logs reader, aria-hidden, and deterministic: tokens come from real log titles, dates, and tags. A ResizeObserver and lifecycle gate schedule a brief FULL entrance or individual redraws for resize/pointer activity; the requestAnimationFrame handle is cancelled on cleanup and no permanent loop is allowed. STATIC renders its final deterministic composition. The semantic list and Markdown reader remain the fallback and required interface.

Timeline and Projects use DOM/CSS/SVG because their records, markers, selection state, and tree branches are real content and controls. WebGL, shaders, particles, and permanent animation-frame loops remain excluded.

## Navigation and resilience

- Native anchors remain the source of navigation and history behavior.
- useActiveArchiveSection observes only Timeline, Projects, and Logs in a middle viewport band. No scroll handler continuously mutates state or location. The header is preserved for later reintroduction, not mounted during the current Hero layout pass.
- Lab is deferred from the root archive and active navigation; its legacy route redirects to `/#index` rather than an absent `#lab` fragment.
- Every archive module is a labelled section with scroll-margin-top.
- EntryGate hides the archive shell before hydration via the root dataset and makes it inert after hydration. The server default remains skipped so no-JavaScript content remains usable.
- Effect mode storage and media queries are accessed only in guarded browser effects or the small pre-hydration bootstrap.

## Future scene rule

Future sections may introduce a feature-local scene when it has a clear information purpose. It must define a static final frame, a semantic fallback, visibility and document lifecycle cleanup, and an explicit rationale for any renderer beyond DOM or SVG.
