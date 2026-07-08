# Scra Atlas Implementation Plan

Status: superseded by the implemented Deep Field Signal Atlas direction.

This file is retained as historical context only. Do not execute the old orbit/celestial implementation plan.

## Current Goal

Maintain and extend Scra Atlas as a static Vite, React, and TypeScript personal homepage with a shader-led deep field observatory narrative.

## Current Architecture

- `public/atlas.config.json`: user-editable identity, project signal records, generated asset paths, and thanks.
- `src/config/atlas.schema.ts`: Zod schema for signal records.
- `src/config/assetPath.ts`: Vite base-path-safe public asset resolution.
- `src/app/App.tsx`: boot/loading flow and asset preloading.
- `src/app/AppShell.tsx`: shell-level scroll, pointer, and reduced-motion wiring.
- `src/features/signal/CosmicShaderBackground.tsx`: WebGL shader for homepage nebula, project nebula, and deep-space transit states.
- `src/features/signal/SignalAtlasExperience.tsx`: fixed scroll narrative with homepage, alternating project pages, and future placeholder.
- `src/styles/global.css`: visual composition, responsive layout, and motion.
- `public/assets/ASSET_MANIFEST.md`: committed asset provenance.

## Current Task Model

Future work should follow this order:

1. Confirm the desired content or visual change.
2. Choose the rendering technique by the current visual goal; shader, raster, DOM/CSS, canvas, WebGL, and 3D approaches are all available.
3. Update `public/atlas.config.json` and `src/data/fallbackAtlasConfig.ts` together when content changes.
4. Update `src/config/atlas.schema.ts` only when the content model changes.
5. Verify with `pnpm build`.
6. Use browser checks for desktop and mobile scroll states when UI or motion changes.

## Rules

- Do not create unit tests without explicit user consent.
- Do not commit, push, or create branches without explicit user consent.
- Keep Chinese text where it improves project clarity.
- Keep Codex and Claude thanks low-emphasis.
