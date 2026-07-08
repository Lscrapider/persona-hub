# Asset And Source Notes

## Purpose

This document records source and provenance expectations for Scra Atlas visuals. It should not restrict the rendering technology.

## Allowed Source Types

Scra Atlas may use:

- Project-specific GPU shader code.
- User-provided shader references or snippets.
- GLSL/WebGL/Three.js/React Three Fiber/canvas particle implementations.
- Generated bitmap assets.
- Official astronomy media when appropriate.
- Licensed stock or CC0 raster assets.
- Project-specific assets owned by the user.
- DOM, CSS, SVG, canvas, WebGL, or 3D-rendered visuals.

## Source Hygiene

- Keep final committed assets in `public/assets/` when they are binary assets.
- Record important generated or external visual assets in `public/assets/ASSET_MANIFEST.md`.
- When an external code or shader source is used as a reference, keep enough notes for future maintenance.
- When license terms are known, follow them. When provenance is uncertain, document the decision clearly so it can be revisited later.

## Current Status

The active homepage uses `src/features/signal/CosmicShaderBackground.tsx` as the primary visual background. Raster assets documented in `public/assets/ASSET_MANIFEST.md` remain active for boot, fallback, and optional overlays.
