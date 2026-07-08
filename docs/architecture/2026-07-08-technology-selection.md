# Scra Atlas Technology Selection

## Decision

Scra Atlas is a static Vite frontend. The current implementation is a shader-led scroll narrative: the homepage opens on a soft nebula field, each project gets a more specific nebula scene, and fast deep-space fly-through transitions connect the project pages.

Current stack:

- Vite
- React
- TypeScript
- GSAP with ScrollTrigger
- Lenis
- Zustand
- Zod
- Plain CSS with design tokens
- WebGL fragment shader for the active cosmic field
- GLSL for nebula, far-point arrival, and low-frequency cosmic field logic
- Canvas 2D z-depth starfield for scroll-driven fly-through streaks
- Raster assets for loading states, fallback imagery, and optional overlays when useful

The project does not lock future work to one visual technology. GPU shaders, WebGL, GLSL, canvas particle layers, CSS, DOM/SVG overlays, raster assets, generated bitmap assets, Three.js, React Three Fiber, and other 3D libraries are all acceptable when they improve the final experience and remain maintainable.

## Rendering Strategy

The primary scene is a fixed DOM/CSS/WebGL composition:

- `CosmicShaderBackground`, a fullscreen WebGL canvas that reacts to scroll state.
- Homepage mode: soft, broad, low-contrast nebula.
- Project mode: stronger localized nebula positioned opposite the text block.
- Transition mode: canvas z-depth starfield fly-through, zoom push, and distant target nebula reveal.
- DOM text, links, labels, and page structure for product content.
- CSS masks, blend modes, opacity, and responsive layout. Project nebula visuals must not be boxed in a card, glass panel, raster frame, or outline.
- Scroll progress as the narrative state driver.

## Configuration Model

User-editable content lives in:

```text
public/atlas.config.json
```

The app validates that file through:

```text
src/config/atlas.schema.ts
src/config/loadAtlasConfig.ts
```

Project entries are signal records:

```json
{
  "codename": "MINT-01",
  "title": "理财投资AI知识库",
  "summary": "一个整理理财投资相关内容的 AI 知识库入口。",
  "url": "http://152.136.174.90/finance/",
  "signalType": "Knowledge Signal",
  "signalDescription": "A compact finance-learning entry point indexed as a stable signal source.",
  "signalAsset": "/assets/generated/mint-signal-loop.webp",
  "signalStillAsset": "/assets/generated/mint-signal-still.png",
  "registryLabel": "Finance AI knowledge base",
  "status": "live",
  "coordinates": { "x": 63, "y": 48 },
  "accent": "oklch(0.82 0.12 172)"
}
```

Asset paths are resolved through Vite `BASE_URL` so the build can be deployed from a subpath.

## Quality Requirements

- The visual result should be strong enough to carry the brand, not only technically correct.
- Project nebulae should be irregular shader-generated fields, not circular objects, planets, glass cards, or framed images.
- Transitions should feel like camera movement through deep space, not a circular wormhole, tube, concentric tunnel, or horizontal beam.
- Reduced-motion behavior must keep the story navigable.
- Hidden narrative phases must not leave invisible focusable controls in the tab order.
- Config validation must fall back safely.
- Browser verification should cover representative scroll states.
- Static build verification is required before handoff.

No unit tests should be added unless the user explicitly approves them.
