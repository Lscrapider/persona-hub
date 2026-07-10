# Scra Atlas effect-first experience design

**Status:** current
**Updated:** 2026-07-10

## Direction

Scra Atlas is a continuous personal technical archive. It begins with an identity and living Hero, then lets visitors read Projects, Logs, Timeline, and Lab in one scrollable root document.

The experience should feel precise, dynamic, and authored. It should not resemble a route collection, a generic portfolio grid, a fake terminal, or a celestial technology demo.

## Information architecture

~~~text
/                 Hero / Index -> #projects -> #logs -> #timeline -> #lab
/projects         redirect to /#projects
/blog             redirect to /#logs
/timeline         redirect to /#timeline
/lab              redirect to /#lab
~~~

The native-fragment Header and its IntersectionObserver state are preserved for later placement. It is intentionally unmounted during the current Hero pass so the scene reaches the browser's top edge. When rendered, it does not alter the URL while scrolling or take control away from browser Back and Forward.

## Hero

The Hero restores the earlier Scra Atlas arrangement: a wide bone information surface holds the oversized single-line SCRA ATLAS lockup, signature, Chinese description, status, and CTA. A near-black field enters off-canvas from the top-right and carries the decorative word scene; its single broad left arc must not read as an isolated ball.

Current Index runs along the lower bone edge. The curved Canvas field uses low-contrast technical vocabulary arranged in concentric circular text tracks, with no terracotta route, dotted guide rings, or free-floating labels. The screenshot reference influences only visual hierarchy and movement language. Scra Atlas does not copy its branding, text, layout, code, or assets.

## Archive modules

- Projects organizes the present project records.
- Logs is the honest home for authored engineering records.
- Timeline frames verified development milestones without inventing dates or events.
- Lab holds bounded experiments and prototypes.

Each module is a labelled semantic section, not a separate top-level visual shell. It may have a distinct surface and feature-local display treatment while preserving the common long-scroll rhythm.

## Motion and accessibility

Reader copy has a single one-time entry language: English and numbers decode, Chinese reveals through a mask or clip. It starts only when the cover has released the archive and the copy itself becomes visible. It never replays during normal scroll.

The Hero signature and the Canvas scene system are the only persistent motion systems. The scene combines slow path text with its curved clipping field and pauses when off-screen or backgrounded. STATIC shows a complete still composition. System reduced motion starts in STATIC, but an explicit persisted FULL setting remains available.

No required content depends on hover, random glyph stabilization, visual scene completion, or a particular rendering API.

## Visual language

- near-black, bone, and terracotta form the primary structural palette;
- typography, text rings, clipping, and negative space create hierarchy;
- local display, body, and system-mono roles remain distinct;
- ordinary content stays open rather than boxed into repeated cards;
- terms use real archive content rather than fake status codes;
- mobile is recomposed vertically rather than cropped from desktop.

## Explicit exclusions

- No planets, black holes, nebulae, particle fields, raymarching, decorative shaders, or WebGL showcase.
- No green terminal imitation, neon glow, fake logs, or persistent random text.
- No scroll snap, Lenis, scroll locking, duplicate navigation, or continuously rewritten URL.
- No reference-site copying.
