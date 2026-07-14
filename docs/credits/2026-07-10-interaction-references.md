# Scra Atlas interaction references and sources

**Status:** current
**Updated:** 2026-07-14

## Visual-reference boundary

The user provided screenshots during this task. They may inform only the approved single-page archive's hierarchy, dynamic language, and broad composition.

They are not implementation sources. Scra Atlas does not reuse or recreate their brand identity, names, copy, layout ratios, component shapes, source code, assets, or animation implementation. The application uses original Scra Atlas content and an independently implemented semantic-DOM word-field scene.

The generated files below are internal direction artifacts, not publication assets:

- docs/design/references/2026-07-10-home-palette.png: generated on 2026-07-10 to inspect the black, bone, terracotta, and silver relationship.
- docs/design/references/2026-07-10-home-north-star.png: generated on 2026-07-10 from the user-provided visual direction for original composition exploration.

The user also supplied the former Scra Atlas Home design on 2026-07-10. Its own bone information field and right off-canvas curved word-field composition is restored as an internal product direction. This does not authorize copying any third-party reference material that may have informed it.

A later user-provided reference on 2026-07-10 demonstrated the desired density, muted light type treatment, and overall coverage of a dark text field. It informs only those qualities of the independently authored scene. Scra Atlas keeps a half-circle boundary and derives its tracks from that boundary's own curvature; it does not copy the reference's circular track geometry, wording, layout, visual assets, code, animation timings, or branding.

## External interaction reference

The Content Architecture public page was reviewed on 2026-07-10 as a high-level interaction and renderer-class reference. Its public material and source are not copied. The initial Hero-only Canvas renderer was upgraded on 2026-07-14 to a bounded WebGL2 glyph-atlas renderer because the user prioritized smooth pointer response and display-rate motion. The separately recorded 2026-07-14 reference note describes that implementation decision.

Allowed influence:

- dense technical information can have deliberate hierarchy;
- scroll and state can reveal a technical archive;
- real system structure is better evidence than decorative fake logs;
- typography, routes, and rules can carry technical character without a space or terminal theme.
- a bounded glyph-atlas renderer can be an appropriate original implementation strategy for a dense decorative word field.

Prohibited influence:

- brand, logo, name, product language, commercial information, page order, fonts, colors, component geometry, implementation code, assets, and specific animation choreography;
- downloading, copying, paraphrasing, or adapting source material for this site.

## Source intake rule

Before a future external code fragment, image, video, font, shader, or media asset is used, record author, URL, license, modification, and destination path. Unknown-provenance material cannot ship. If public assets are added, keep an asset manifest under public/assets.

## Fonts and licenses

The site uses local Latin WOFF2 subsets through next/font/local. The font files are not modified and do not require a runtime network request.

### League Gothic

- Authors: The League Gothic Project Authors.
- CSS source: https://fonts.googleapis.com/css2?family=League+Gothic&display=swap
- Font source: https://fonts.gstatic.com/s/leaguegothic/v13/qFdR35CBi4tvBz81xy7WG7ep-BQAY7Krj7feObpH_9ahg9UYRshmq0s.woff2
- Local file: src/assets/fonts/league-gothic-latin.woff2
- License: SIL Open Font License 1.1. Local license copy: src/assets/fonts/OFL-League-Gothic.txt

### Manrope

- Authors: The Manrope Project Authors.
- CSS source: https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap
- Font source: https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSvfedN4.woff2
- Local file: src/assets/fonts/manrope-latin-variable.woff2
- License: SIL Open Font License 1.1. Local license copy: src/assets/fonts/OFL-Manrope.txt
