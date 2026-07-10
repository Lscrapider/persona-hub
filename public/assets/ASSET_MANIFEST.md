# Asset Manifest

## Active Code-Rendered Visuals

### `src/features/signal/CosmicThreeScene.tsx`

- Source: Original project Three.js and GLSL code written for Scra Atlas.
- Date: 2026-07-09.
- Current use: active deep-space scene, procedural star field, shader-generated cosmic entities, far-space atmosphere, and space transit field.
- Visual method: `ShaderMaterial`, procedural value noise, FBM and domain warping used as density/edge controls, type-specific 3D density fields, short volumetric ray marching, atmospheric scattering, sparse dust particles, and camera-driven spatial motion. An invisible `BoxGeometry` acts only as the integration bounds for the remaining diffuse phenomena. `DARK NODE` is intentionally excluded from that path: it uses an original project-owned `SphereGeometry` pulsar core, camera-facing `CircleGeometry` halo discs with radial fragment discard, transparent cone jets, and sparse dust, with no bitmap asset or post-processing bloom dependency. Its core, rim, halo, and jets share a low-frequency pulse; the background uses transform-driven far/mid/near star layers. Additive blending is limited to the star field and the pulsar's soft halo/jet layers.
- Policy fit: project-owned code-rendered visual system. No external shader snippet, bitmap texture, or media asset was copied for the active scene.

## Archived Generated Assets

The files below were generated during earlier visual exploration. They are retained for provenance, fallback experiments, or config compatibility, but they are not the current project-entity rendering model. The current direction must not use them as flat project cards, framed previews, map markers, control overlays, or primary project objects.

### `docs/credits/assets/generated/deep-field-observatory-2k-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: deep-field space artwork with layered nebula dust, distant galaxy clusters, star-forming regions, spectral glints, darker text-safe space, no planets, no interface labels, no wireframe, and no watermark.
- Current use: archived source plate.
- Policy fit: generated raster artwork retained for provenance.

### `generated/deep-field-observatory-2k.png`

- Source: Derived from `generated/deep-field-observatory-2k-source.png`.
- Date: 2026-07-08.
- Processing: resized to 2560 x 1440, contrast/color tuned, and sharpened with local raster processing.
- Current use: retained as a possible non-primary fallback reference.
- Policy fit: generated raster derivative.

### `docs/credits/assets/generated/boot-calibration-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: cinematic deep-field calibration artwork with nebula dust and spectral photons, no text labels, no crosshairs, no planets, and no watermark.
- Current use: archived source frame.
- Policy fit: generated raster artwork retained for provenance.

### `generated/boot-calibration-loop.webp`

- Source: Derived from `generated/boot-calibration-source.png`.
- Date: 2026-07-08.
- Processing: animated WebP loop created from generated raster frames using subtle crop drift, exposure pulse, contrast, and sharpening changes.
- Current use: legacy generated animation retained by config.
- Policy fit: generated raster animation derivative.

### `generated/boot-calibration-still.png`

- Source: First frame extracted from `generated/boot-calibration-loop.webp`.
- Date: 2026-07-08.
- Current use: legacy reduced-motion still retained by config.
- Policy fit: static generated-raster derivative.

### `docs/credits/assets/generated/mint-signal-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: irregular emerald-cyan spectral anomaly, compact organic bloom, no text, no rings, no wireframe, no icon, no planet, and no watermark.
- Current use: archived source frame.
- Policy fit: generated raster artwork retained for provenance.

### `generated/mint-signal-loop.webp`

- Source: Derived from `generated/mint-signal-source.png`.
- Date: 2026-07-08.
- Processing: animated WebP loop with alpha extraction, soft glow, subtle drift, brightness, and color pulse from generated raster frames.
- Current use: legacy generated animation retained by config, not the active project entity model.
- Policy fit: generated raster animation derivative.

### `generated/mint-signal-still.png`

- Source: First frame extracted from `generated/mint-signal-loop.webp`.
- Date: 2026-07-08.
- Current use: legacy generated still retained by config.
- Policy fit: static generated-raster derivative.

### `docs/credits/assets/generated/dark-node-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: irregular violet-charcoal and ember-orange dormant spectral anomaly, asymmetric organic knot, no text, no rings, no wireframe, no icon, no planet, and no watermark.
- Current use: archived source frame.
- Policy fit: generated raster artwork retained for provenance.

### `generated/dark-node-loop.webp`

- Source: Derived from `generated/dark-node-source.png`.
- Date: 2026-07-08.
- Processing: animated WebP loop with alpha extraction, soft glow, subtle drift, brightness, and color pulse from generated raster frames.
- Current use: legacy generated animation retained by config, not the active project entity model.
- Policy fit: generated raster animation derivative.

### `generated/dark-node-still.png`

- Source: First frame extracted from `generated/dark-node-loop.webp`.
- Date: 2026-07-08.
- Current use: legacy generated still retained by config.
- Policy fit: static generated-raster derivative.

### `docs/credits/assets/generated/deep-field-observatory.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: cinematic deep-field artwork with layered nebula dust, distant galaxy clusters, spectral haze, mineral green and amber glints, no planets, no spherical celestial bodies, no interface text, and no watermark.
- Current use: archived reference, not referenced by the active homepage.
- Policy fit: generated raster artwork retained for provenance.

### `generated/signal-acquisition-texture.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: abstract spectral acquisition artwork with sensor noise, luminous traces, and calibration wash, with no readable text, planets, or interface labels.
- Current use: legacy generated texture retained for provenance only. Do not use as an active overlay in the current cinematic cosmic-entity direction.
- Policy fit: generated raster artwork retained for provenance.

## Retained NASA Reference Assets

The previous NASA and artist-concept space assets are archived under `docs/credits/assets/space/` for provenance and possible future reference. The current homepage does not use them as primary visuals.

### `docs/credits/assets/space/deep-field-abell-1689.jpg`

- Source: NASA Image and Video Library.
- NASA ID: `GSFC_20171208_Archive_e002174`.
- Title: `Galaxy Cluster Abell 1689`.
- Source URL: `https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e002174/GSFC_20171208_Archive_e002174~large.jpg`.
- Credit: `NASA/Goddard Space Flight Center/Scientific Visualization Studio/ESA/L. Bradley/JHU`.
- Current use: retained reference, not referenced by the active homepage.

### `docs/credits/assets/space/carina-nebula.png`

- Source: NASA Image and Video Library.
- NASA ID: `carina_nebula`.
- Title: `James Webb Space Telescope NIRCam Image of the Cosmic Cliffs in Carina Nebula`.
- Source URL: `https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~orig.png`.
- Credit: `NASA, ESA, CSA, STScI`.
- Current use: retained reference, not referenced by the active homepage.

### `docs/credits/assets/space/southern-ring-nebula.png`

- Source: NASA Image and Video Library.
- NASA ID: `southern_ring_nebula`.
- Title: `James Webb Space Telescope Southern Ring Nebula`.
- Source URL: `https://images-assets.nasa.gov/image/southern_ring_nebula/southern_ring_nebula~orig.png`.
- Credit: `NASA, ESA, CSA, STScI`.
- Current use: retained reference, not referenced by the active homepage.

### `docs/credits/assets/space/exoplanet-debris-disk.jpg`

- Source: NASA Image and Video Library.
- NASA ID: `PIA22082`.
- Title: `Giant Exoplanet and Debris Disk (Artist's Concept)`.
- Source URL: `https://images-assets.nasa.gov/image/PIA22082/PIA22082~orig.jpg`.
- Credit: `NASA/JPL-Caltech`.
- Current use: retained reference, not referenced by the active homepage.
