# Project Rules

## Creative Technology

- Scra Atlas may use GPU shaders, GLSL, WebGL, canvas particle layers, CSS, DOM, SVG, raster assets, generated bitmap assets, official media, Three.js, React Three Fiber, or other 3D libraries when they serve the intended experience.
- Do not hard-code a single required rendering method. Choose the technique by visual quality, performance, maintainability, and the user's current direction.
- External code, shader snippets, images, and media should have clear provenance. When license terms are known, follow them. When provenance is uncertain, document the reference and keep the implementation decision explicit.
- Visual source notes belong in `docs/` or `public/assets/ASSET_MANIFEST.md` when they affect future maintenance.

## Documentation

- Project documentation belongs under `docs/`.
- Organize documentation by function, for example `docs/design/`, `docs/architecture/`, `docs/credits/`, and `docs/plans/`.
- Documentation should explain current decisions without freezing future visual or technical direction.

## Agent Workflow

- Use subagents only when work is both independent and genuinely parallelizable without shared state. Do not split sequential or dependency-bound implementation steps merely to use multiple agents; the primary agent handles those steps linearly, including integration, review, and final verification.
- For a new feature, visual direction, or structural refactor, use the relevant available `superpowers` workflow before implementation. This includes design exploration before creative work, a written implementation plan after the design is approved, and evidence-based verification before declaring the work complete.
- `superpowers` workflow guidance supplements these project rules. It never authorizes a commit, push, branch creation, or unit-test creation that the user has not explicitly approved.

## Git

- Do not commit, push, or create branches unless the user explicitly agrees.

## Testing

- Do not create unit tests unless the user explicitly agrees.
- Verification can use builds, browser checks, visual inspection, runtime checks, and performance checks.
