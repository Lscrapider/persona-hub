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
  -> semantic feature DOM/SVG plus one unified, aria-hidden WebGL2 stage
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

The archive interaction grammar is **Scroll compiles the archive; pointer and focus inspect real content**. Each section moves through `queued → resolving → mounted → stable`. Two `IntersectionObserver` bands implement that DOM grammar: a prewarm band identifies resolving sections, while a centre band elects at most one mounted section. A separate passive `window` scroll listener writes only to a stable, animation-frame-coalesced WebGL snapshot. It derives a continuous scene position around real section boundaries, never updates React state, changes the URL, or alters native scrolling.

`ArchiveRuntime` owns only shared interaction mechanics:

- it writes section compiler phases and emits discrete resolve or mount signals;
- delegated `pointerover`, `focusin`, and `click` handlers read feature-owned `data-runtime-target` and action attributes that identify real sections, records, projects, tree nodes, and log blocks;
- pointer movement retains only the latest normalized client coordinate in the WebGL snapshot without putting frame-by-frame coordinates in React state;
- it deduplicates repeated signals, clears them after a fixed timeout, and renders a short, `aria-hidden` Build Trace that is decorative feedback rather than a terminal, log console, or accessibility announcement.

The runtime also owns one guarded physical-pointer state machine. Only feature-owned `data-physics-surface` and `data-physics-target` backgrounds may create candidates; semantic text and controls take precedence. A short press emits an impulse, while guarded charge, grab, release, and cancellation signals bubble from the exact surface. The validated event feeds Build Trace and the unified stage's transient interaction energy. The generic code-particle Canvas is removed because it was not structurally tied to the selected record.

The runtime is enabled only after EntryGate exposes the archive. Disabling or locking it disconnects compiler and semantic-anchor observers, removes delegated and scroll listeners, cancels pending frames, and clears transient trace state. Locale changes remount the wrapper and run the same cleanup. Document visibility pauses the stage. If `IntersectionObserver` is unavailable, sections render immediately in their final mounted state.

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

`ArchiveWebGLStage` owns the sole persistent animation-frame loop. On desktop, Hero, stage, scene, and Current Index share a dynamic minimum-height composition; the status table and Enter Archive action occupy one grid utility row, preventing viewport-height clamps from overlapping. The stage keeps one canvas and one WebGL2 context across Hero → Timeline → Projects → Logs. FULL animates at display cadence while the document is visible; STATIC renders one deterministic frame, and hidden documents cancel the scheduler while retaining elapsed time.

`useArchiveMotionController` measures section boundaries and opt-in semantic anchors. Around each real section boundary it produces a smoother-step floating scene position rather than switching an enum. The Hero black surface and glyph opacity therefore reach zero continuously while the next signal layer rises. Anchor coordinates are stored in document space and converted to viewport UVs during rendering. `ResizeObserver`, targeted `MutationObserver` attributes, nested reader/index scroll capture, window resize, and a passive window scroll listener keep them coherent without frame-by-frame React state.

In FULL, the Hero pass rasterizes the finite glyph set into one Canvas atlas after bounds or font resolution changes, uploads immutable per-glyph instance geometry, and evaluates orbit motion, tangent orientation, pointer replacement, and bounded field sampling at display cadence. It derives the curved surface from shared scene geometry so glyphs never paint outside the black surface. Later shader passes use only fixed-size uniform arrays populated from real anchors: Timeline marker centres; Project choice, detail, and system-tree points; and samples from the actual Logs SVG seam. Inactive scene functions exit before their fixed-bound loops. There are no random carriers, fake grids, decorative arcs, generic pointer rings, or generated Logs words.

The shared layout caches derived arc geometry and glyph advances until CSS-pixel bounds or the resolved font changes. WebGL2 caps its backing store at 1.25 device pixels per CSS pixel in both modes. A detached 2D canvas is restricted to rasterizing the finite glyph atlas for GPU upload. The Canvas 2D Hero implementation, its static frame, and its 30fps resilience loop are removed; unavailable WebGL produces only a clipped, non-interactive static silhouette.

## Renderer decision

Required information remains semantic DOM. WebGL2 is the single scene renderer because one atlas plus instanced Hero glyph geometry and one semantic full-screen pass avoid multiple contexts and competing loops. Timeline, Projects, and Logs keep their controls, selection, tree branches, SVG seams, and articles in DOM/SVG. The stage only visualizes relationships already present in those structures. When WebGL2 is unavailable or its context is lost, the Hero becomes a static clipped silhouette and later sections remain complete without a 2D fallback.

## Navigation and resilience

- Native anchors remain the source of navigation and history behavior for archive navigation. Current Index preserves its project anchor as a no-JavaScript fallback, while its ordinary hydrated click prevents the fragment, clears any pre-existing hash, selects the matching project in HomeExperience, and performs one smooth scroll to Projects. On a root-page reload without a hash, HomeExperience resets browser-restored scroll to the Hero; explicit archive fragments remain authoritative.
- useActiveArchiveSection observes only Timeline, Projects, and Logs in a middle viewport band. ArchiveRuntime separately uses its compiler bands and read-only motion snapshot; neither system continuously mutates React state or location from scroll. The header is preserved for later reintroduction, not mounted during the current Hero layout pass.
- Lab is deferred from the root archive and active navigation; its legacy route redirects to `/#index` rather than an absent `#lab` fragment.
- Every archive module is a labelled section with scroll-margin-top.
- EntryGate hides the archive shell before hydration via the root dataset and makes it inert after hydration. The server default remains skipped so no-JavaScript content remains usable.
- Effect mode storage and media queries are accessed only in guarded browser effects or the small pre-hydration bootstrap.

## Future scene rule

Future sections may contribute anchors to the unified stage only when the geometry expresses a real relationship or state. They must define a static final frame, preserve semantic DOM/SVG, keep fixed shader bounds, and document why the effect cannot be expressed by the existing scene grammar.
