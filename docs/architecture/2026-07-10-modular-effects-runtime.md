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
  -> ArchiveRuntime interaction boundary
  -> TimelineSection / ProjectsSection / LogsSection
  -> feature-local DOM, SVG, a bounded Hero GPU/Canvas word field, and a bounded Logs Canvas field
~~~

- Content owns archive ids, labels, summaries, statuses, project records, and log manifests. Log filenames are allowlisted simple `.md` basenames, resolved only below `src/content/logs`, and cannot be selected from client input.
- `src/lib/content/archive.ts` validates record fields, unique identifiers and slugs where applicable, strictly ordered timeline dates, and unique log filenames. It reads Markdown on the server, turns it into serializable safe blocks, and passes neither filenames nor filesystem access to the client. It uses the declared Node APIs directly and requires no extra package dependency.
- `MarkdownArticle` renders those blocks without raw HTML and permits only HTTP(S) inline links. Unsupported Markdown remains text instead of executable markup.
- Feature sections own their semantic markup and local layouts. Timeline uses a semantic rail plus aria-hidden SVG; Projects renders the selected DOM state and native `details`; Logs keeps its list and article reader in DOM.
- HomeExperience composes Hero → Timeline → Projects → Logs, forwards typed data, exposes whether EntryGate has released archive content, and owns the transient project selection shared by Current Index and Projects. `ArchiveRuntime` sits directly between that composition and the feature sections, but it does not parse Markdown, access files, or own feature content.
- CopyReveal owns once-only visibility observation. It does not know project data or page layout.
- HomeHero owns the bone information stage and right-edge, off-canvas curved word-field scene, then passes lifecycle activity to its Typewriter and word field.
- SiteHeader owns fragment presentation and obtains active state from an archive-specific observer hook, but is intentionally unmounted while its final placement is deferred.

## Effect mode contract

~~~ts
type EffectMode = "full" | "static";
~~~

- FULL is the normal initial mode when the system does not request reduced motion.
- STATIC is the initial system-reduced-motion mode and renders final frames with no visual animation.
- A stored explicit FULL or STATIC choice wins for the established copy and scene preference contract. Physical gestures, particles, Hero deformation, compile seams, and scroll-linked decoration additionally treat system reduced motion as a hard stop even when FULL was stored.
- The root data-effect-mode attribute mirrors the resolved mode so CSS and JavaScript use one contract.
- There is no intermediate effect mode.

## Archive interaction runtime contract

The archive interaction grammar is **Scroll compiles the archive; pointer and focus inspect real content**. Each section moves through `queued → resolving → mounted → stable`. Two `IntersectionObserver` bands implement that grammar: a prewarm band identifies resolving sections, while a centre band elects at most one mounted section. The observers also handle upward scrolling; there is no global `window` scroll listener and no continuously sampled scroll position.

`ArchiveRuntime` owns only shared interaction mechanics:

- it writes section compiler phases and emits discrete resolve or mount signals;
- delegated `pointerover`, `focusin`, and `click` handlers read feature-owned `data-runtime-target` and action attributes that identify real sections, records, projects, tree nodes, and log blocks;
- pointer movement retains only the latest client coordinate, then one scheduled animation frame writes CSS custom properties without putting frame-by-frame coordinates in React state;
- it deduplicates repeated signals, clears them after a fixed timeout, and renders a short, `aria-hidden` Build Trace that is decorative feedback rather than a terminal, log console, or accessibility announcement.

The runtime also owns one guarded physical-pointer state machine. Only feature-owned `data-physics-surface` and `data-physics-target` backgrounds may create candidates; semantic text and controls take precedence. A short press emits an impulse, while guarded charge, grab, release, and cancellation signals bubble from the exact surface. The same validated event feeds Build Trace, the transient code-particle Canvas, and the Hero adapter without making the runtime depend on a feature renderer. Localized vocabulary is pre-indexed once from typed archive content rather than scanned per signal.

The runtime is enabled only after EntryGate exposes the archive. Disabling or locking it disconnects the compiler observers and delegated listeners, cancels the pending pointer frame, and clears transient trace state. Locale changes remount the wrapper and therefore run the same cleanup; mode changes rebuild the pointer listeners, cancel a pending pointer frame, and clear any trace left by the previous mode. Document visibility lifecycle remains owned by the existing scene-specific activity hooks. If `IntersectionObserver` is unavailable, sections render immediately in their final mounted state.

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

`useSceneActivity(targetRef)` derives activity from its target's intersection and document visibility without a scroll listener. Hero and the bounded Logs field both use that lifecycle gate, but Hero is the only scene that owns a persistent animation-frame loop. On desktop, Hero, stage, scene, and Current Index overlay share one dynamic viewport-height frame without a rem cap; Index is removed from the frame's flow calculation. A separate ResizeObserver measures that final decorative Hero scene only when its rendered box changes; one geometry model derives the backing-store size, black-surface circular arc, clip path, and orbit radii without participating in scrolling. The arc uses two measured endpoints and a normalized radius factor, avoiding the tangent discontinuity caused by joined Bézier segments. FULL Hero scenes animate only when active. Its WebGL2 renderer runs at display rAF cadence; when Hero leaves the viewport or the document becomes hidden, the scheduler is cancelled and the elapsed angle is retained. STATIC draws one deterministic WebGL frame with no scene loop.

The only persistent homepage work remains the Typewriter cycle and one Hero word-field scene system. All 38 text rings, pointer dot-substitution, radial type scale, whole-word 180-degree orientation, and physical deformation share that existing renderer rAF lifecycle. A renderer-independent 64×40 fixed-grid CPU kernel owns bounded displacement, charge attraction, grab lag, and four recyclable wave sources. WebGL uploads that field to one `RG32F` texture and samples it manually in the glyph and surface vertex shaders. The adapter is owned above renderer lifetimes, so context loss deletes GPU resources and disables decorative Hero physics without altering semantic content. Mode, scene visibility, locale lifecycle, blur, and hidden-document cancellation reset the appropriate gesture, particle, and field owners.

In FULL, the feature-local WebGL2 renderer rasterizes the finite glyph set into one Canvas atlas after bounds or font resolution changes, uploads immutable per-glyph instance geometry, and evaluates orbit motion, tangent orientation, pointer replacement, and bounded field sampling at display cadence. It derives an exact curved-surface stencil from the shared arc geometry so glyphs never paint outside the black surface. The layout remains deterministic: advances fit in one exact `0…2π` turn, the terminal segment is a complete `AI`, `PHY`, or `JAVA` connector, deliberate bands retain their `·` gap cells, and the pointer replaces only letters and numbers while retaining connector dots. Pointer events retain only the latest client coordinate; one transient scheduled frame mutates a stable pointer record. The scene has no visible guide rings, floating labels, density rows, routes, or nodes. Every continuous control is cleaned up on change or unmount.

The shared layout caches derived arc geometry and glyph advances until CSS-pixel bounds or the resolved font changes. WebGL2 caps its backing store at 1.25 device pixels per CSS pixel in both modes. A detached 2D canvas is restricted to rasterizing the finite glyph atlas for GPU upload. The Canvas 2D Hero implementation, its static frame, and its 30fps resilience loop are removed; unavailable WebGL produces only a clipped, non-interactive static silhouette.

## Renderer decision

The Hero uses semantic DOM for required information and one aria-hidden KineticTypeField renderer for the dense decorative word field. WebGL2 is the only Hero scene renderer because an atlas plus instanced glyph geometry moves thousands of characters at display refresh without per-glyph Canvas text work. It derives outer-to-inner type scale from the ring radius while retaining normal technical-word spelling in the glyph atlas. When WebGL2 is unavailable or its context is lost, the decorative field becomes a static clipped silhouette and no 2D scene renderer starts, so the Hero remains semantically readable without pretending to preserve the animation.

`LogWordField` is the only other Canvas renderer. It is bounded behind the Logs reader, aria-hidden, and deterministic: tokens come from real log titles, dates, and tags. A ResizeObserver and lifecycle gate schedule a brief FULL entrance or individual redraws for resize/pointer activity; the requestAnimationFrame handle is cancelled on cleanup and no permanent loop is allowed. The Logs reading-progress enhancement has the only scroll listener added by this interaction pass: it is passive, attached to the bounded article reader rather than `window`, and one scheduled frame writes `--logs-read-progress` without per-frame React state. A reader-rooted `IntersectionObserver` assigns stable block phases and emits real read signals. STATIC renders the final deterministic composition. The semantic list and Markdown reader remain the fallback and required interface.

Timeline and Projects use DOM/CSS/SVG because their records, markers, selection state, and tree branches are real content and controls. Logs keeps its document surface and reader phases separate. The three modules consume shared reversible compiler variables and may add CSS view-timeline refinement, but they never move a whole module grid or install a global scroll handler. WebGL and shaders remain excluded outside the bounded, aria-hidden KineticTypeField. The only added particle renderer is one fixed, preallocated, transient Canvas whose rAF sleeps whenever no charge or released term remains.

## Navigation and resilience

- Native anchors remain the source of navigation and history behavior for archive navigation. Current Index preserves its project anchor as a no-JavaScript fallback, while its ordinary hydrated click prevents the fragment, clears any pre-existing hash, selects the matching project in HomeExperience, and performs one smooth scroll to Projects. On a root-page reload without a hash, HomeExperience resets browser-restored scroll to the Hero; explicit archive fragments remain authoritative.
- useActiveArchiveSection observes only Timeline, Projects, and Logs in a middle viewport band. ArchiveRuntime separately uses its two compiler bands, but neither system continuously mutates state or location from a global scroll handler. The header is preserved for later reintroduction, not mounted during the current Hero layout pass.
- Lab is deferred from the root archive and active navigation; its legacy route redirects to `/#index` rather than an absent `#lab` fragment.
- Every archive module is a labelled section with scroll-margin-top.
- EntryGate hides the archive shell before hydration via the root dataset and makes it inert after hydration. The server default remains skipped so no-JavaScript content remains usable.
- Effect mode storage and media queries are accessed only in guarded browser effects or the small pre-hydration bootstrap.

## Future scene rule

Future sections may introduce a feature-local scene when it has a clear information purpose. It must define a static final frame, a semantic fallback, visibility and document lifecycle cleanup, and an explicit rationale for any renderer beyond DOM or SVG.
