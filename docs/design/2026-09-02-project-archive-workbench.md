# Project Archive Workbench Design

**Status:** superseded by the user-directed spatial architecture redesign on 2026-09-06; see `2026-09-06-spatial-project-architecture.md`
**Date:** 2026-09-02

## Purpose

Replace the current oversized project index/detail composition with a compact three-column archive workbench. The section should resemble the information density and directness of a code editor without visually cloning VS Code.

The approved desktop order is fixed:

1. filesystem on the left;
2. document content in the centre;
3. project switcher on the right.

## Information model

Each project owns a curated set of documentation files derived from its public GitHub repository. Every visible file is an actual button and opens a local, source-informed document summary in the centre pane. The GitHub action links to the corresponding source file.

The initial implementation contains 22 documents:

- Financial Management AI: 7 files covering the product, design, AI chat architecture, OCR, report pipeline, and service API;
- Urban Sidequest: 7 files covering the product, design, technical overview, route algorithm, and user-profile design;
- Scrapider Guidelines: 8 files covering the Skill protocol and Java, Python, Android, and review references.

Project copy must use “Skill”, never “Codex Skill”.

## Interaction contract

- Selecting a project keeps the section in place, replaces the complete filesystem, and opens that project's default README.
- Selecting any file updates the active tree row, tab path, document body, live-region announcement, runtime target, and GitHub source link.
- Folder rows use native `details` disclosure and remain open by default on desktop.
- All file controls are keyboard reachable and expose the selected state through `aria-pressed`.
- The project list remains sorted by project ID rather than moving the active project.

## Motion semantics

Motion describes the repository-reading relationship rather than adding independent shapes:

- the selected project on the right is the source anchor;
- the active document tab in the centre is the reading anchor;
- filesystem files on the left are repository anchors;
- the existing WebGL Projects scene connects those measured DOM anchors from right to centre to left;
- project changes trigger one short repository-load sequence;
- file changes trigger a compact tab pulse and document reveal;
- focus-visible receives the same state emphasis as hover.

No random circles, squares, carrier line, fake terminal, neon blue, or decorative WebGL geometry is added.

## Visual direction

- Preserve the existing near-black, bone, silver, and terracotta palette.
- Preserve the League Gothic / CJK heading, Manrope, and mono typography roles.
- Use square panes, hairline dividers, compact mono labels, and one terracotta active signal.
- Keep the centre document spacious enough for long-form reading.
- Keep the left and right rails dense; do not use giant project titles or oversized empty gaps.
- Keep the section heading as a compact workbench header above the three panes.

## Responsive behavior

At desktop widths, all three columns are visible with no horizontal page overflow. At small widths, the section returns to natural page flow: project switcher first, filesystem second, document third. It must not create nested vertical scrolling, scroll locking, or forced paging.

## Accessibility and resilience

- Required content remains semantic DOM and is available when WebGL or motion is unavailable.
- STATIC and reduced-motion modes remove project/file transitions while preserving every state.
- External repository links use validated HTTP(S) URLs and open with `rel="noreferrer"`.
- Folder disclosure uses native semantics.
- The section must remain usable with keyboard, touch, screen readers, and text selection.

## Data provenance

Document summaries are curated from the public repositories:

- `https://github.com/Lscrapider/financial-management-ai`
- `https://github.com/Lscrapider/urban-sidequest`
- `https://github.com/Lscrapider/scrapider-guidelines`

The site stores concise summaries rather than fetching GitHub at runtime, so the archive remains fast and deterministic.

