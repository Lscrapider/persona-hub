# Scra Atlas modular effects runtime

**Status:** current
**Updated:** 2026-07-14

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
  -> feature-local DOM, SVG, a bounded Hero GPU/Canvas word field, and a bounded Logs Canvas field
~~~

- Content owns archive ids, labels, summaries, statuses, project records, and log manifests. Log filenames are allowlisted simple `.md` basenames, resolved only below `src/content/logs`, and cannot be selected from client input.
- `src/lib/content/archive.ts` validates record fields, unique identifiers and slugs where applicable, strictly ordered timeline dates, and unique log filenames. It reads Markdown on the server, turns it into serializable safe blocks, and passes neither filenames nor filesystem access to the client. It uses the declared Node APIs directly and requires no extra package dependency.
- `MarkdownArticle` renders those blocks without raw HTML and permits only HTTP(S) inline links. Unsupported Markdown remains text instead of executable markup.
- Feature sections own their semantic markup and local layouts. Timeline uses a semantic rail plus aria-hidden SVG; Projects renders the selected DOM state and native `details`; Logs keeps its list and article reader in DOM.
- HomeExperience composes Hero → Timeline → Projects → Logs, forwards typed data, exposes whether EntryGate has released archive content, and owns the transient project selection shared by Current Index and Projects. It does not parse Markdown or access files.
- CopyReveal owns once-only visibility observation. It does not know project data or page layout.
- HomeHero owns the bone information stage and right-edge, off-canvas curved word-field scene, then passes lifecycle activity to its Typewriter and word field.
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

`useSceneActivity(targetRef)` derives activity from its target's intersection and document visibility without a scroll listener. Hero and the bounded Logs field both use that lifecycle gate, but only Hero owns continuous work. On desktop, Hero, stage, scene, and Current Index overlay share one dynamic viewport-height frame without a rem cap; Index is removed from the frame's flow calculation. A separate ResizeObserver measures that final decorative Hero scene only when its rendered box changes; one geometry model derives the backing-store size, black-surface circular arc, clip path, and orbit radii without participating in scrolling. The arc uses two measured endpoints and a normalized radius factor, avoiding the tangent discontinuity caused by joined Bézier segments. FULL Hero scenes animate only when active. Its WebGL2 renderer runs at display rAF cadence; when Hero leaves the viewport or the document becomes hidden, the scheduler is cancelled and the elapsed angle is retained. STATIC draws a deterministic Canvas final frame once.

The only persistent homepage work remains the Typewriter cycle and one Hero word-field scene system. All 38 text rings and the pointer dot-substitution field share one rAF lifecycle. In FULL, the feature-local WebGL2 renderer rasterizes the finite glyph set into one Canvas atlas after bounds or font resolution changes, uploads an immutable per-glyph instance buffer, and evaluates motion, tangent orientation, and pointer replacement in its shader at display cadence. It derives an exact curved-surface stencil from the shared arc geometry so glyphs never paint outside the black surface. The layout remains deterministic: advances fit in one exact `0…2π` turn, the terminal segment is a complete `AI`, `PHY`, or `JAVA` connector, deliberate bands retain their `·` gap cells, and the pointer replaces only letters and numbers while retaining connector dots. Pointer events retain only the latest client coordinate; one scheduled frame reads the scene rectangle and updates the GPU uniform. The scene has no visible guide rings, floating labels, density rows, routes, or nodes. Every continuous control is cleaned up on change or unmount.

The shared layout caches derived arc geometry and glyph advances until CSS-pixel bounds or the resolved font changes. WebGL2 FULL caps its backing store at 1.25 device pixels per CSS pixel. The Canvas implementation remains available for STATIC, unavailable WebGL2, and a lost WebGL context: STATIC may use 2x because it renders once, while the animated resilience fallback caps expensive redraws at 30fps and preserves wall-clock motion.

## Renderer decision

The Hero uses semantic DOM for required information and one aria-hidden KineticTypeField renderer for the dense decorative word field. WebGL2 is selected for the active desktop scene because an atlas plus instanced glyph geometry moves thousands of characters at display refresh without per-glyph Canvas text work. The shared Canvas renderer retains a static final frame and an animated resilience fallback when WebGL2 is unavailable or its context is lost, so the Hero remains readable if the enhancement fails.

`LogWordField` is the only other Canvas renderer. It is bounded behind the Logs reader, aria-hidden, and deterministic: tokens come from real log titles, dates, and tags. A ResizeObserver and lifecycle gate schedule a brief FULL entrance or individual redraws for resize/pointer activity; the requestAnimationFrame handle is cancelled on cleanup and no permanent loop is allowed. STATIC renders its final deterministic composition. The semantic list and Markdown reader remain the fallback and required interface.

Timeline and Projects use DOM/CSS/SVG because their records, markers, selection state, and tree branches are real content and controls. WebGL and shaders remain excluded outside the bounded, aria-hidden KineticTypeField; particles and unrelated permanent animation-frame loops remain excluded.

## Navigation and resilience

- Native anchors remain the source of navigation and history behavior for archive navigation. Current Index preserves its project anchor as a no-JavaScript fallback, while its ordinary hydrated click prevents the fragment, clears any pre-existing hash, selects the matching project in HomeExperience, and performs one smooth scroll to Projects. On a root-page reload without a hash, HomeExperience resets browser-restored scroll to the Hero; explicit archive fragments remain authoritative.
- useActiveArchiveSection observes only Timeline, Projects, and Logs in a middle viewport band. No scroll handler continuously mutates state or location. The header is preserved for later reintroduction, not mounted during the current Hero layout pass.
- Lab is deferred from the root archive and active navigation; its legacy route redirects to `/#index` rather than an absent `#lab` fragment.
- Every archive module is a labelled section with scroll-margin-top.
- EntryGate hides the archive shell before hydration via the root dataset and makes it inert after hydration. The server default remains skipped so no-JavaScript content remains usable.
- Effect mode storage and media queries are accessed only in guarded browser effects or the small pre-hydration bootstrap.

## Future scene rule

Future sections may introduce a feature-local scene when it has a clear information purpose. It must define a static final frame, a semantic fallback, visibility and document lifecycle cleanup, and an explicit rationale for any renderer beyond DOM or SVG.
