# Asset Manifest

## Code-Rendered Project Visuals

### `src/features/signal/CosmicShaderBackground.tsx`

- Source: Original project WebGL fragment shader written for Scra Atlas.
- Date: 2026-07-08.
- Reference direction: user-selected shader-led cosmic field, informed by nebula and starfield references supplied during design.
- Use: active primary homepage background, project nebula background, and star-tunnel transition renderer.
- Policy fit: project-specific code-rendered visual layer with documented source notes.

## Generated Project Assets

### `docs/credits/assets/generated/deep-field-observatory-2k-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: crisp 2K deep-field observatory background plate with layered nebula dust, distant galaxy clusters, star-forming regions, cyan and amber spectral glints, darker text-safe space, no planets, UI, text, wireframe, or watermark.
- Use: archived source plate for the WebGL fallback background. Kept outside `public/` because it is not served at runtime.
- Policy fit: generated raster fallback asset.

### `generated/deep-field-observatory-2k.png`

- Source: Derived from `generated/deep-field-observatory-2k-source.png`.
- Date: 2026-07-08.
- Processing: resized to 2560 x 1440, contrast/color tuned, and sharpened with local raster processing.
- Use: WebGL fallback background when the shader canvas is unavailable.
- Policy fit: generated raster artwork retained as a fallback asset.

### `docs/credits/assets/generated/boot-calibration-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: cinematic deep-field observatory boot calibration plate with a spectral imaging sensor, nebula dust, cyan/amber photons, no text, no UI labels, no crosshairs, no planets, and no watermark.
- Use: archived source frame for the loading sequence. Kept outside `public/` because it is not served at runtime.
- Policy fit: generated raster asset, not CSS/vector-drawn artwork.

### `generated/boot-calibration-loop.webp`

- Source: Derived from `generated/boot-calibration-source.png`.
- Date: 2026-07-08.
- Processing: animated WebP loop created from generated raster frames using subtle crop drift, exposure pulse, contrast, and sharpening changes.
- Use: active loading screen visual.
- Policy fit: real bitmap animation. Code transforms generated raster frames but does not draw the artwork.

### `generated/boot-calibration-still.png`

- Source: First frame extracted from `generated/boot-calibration-loop.webp`.
- Date: 2026-07-08.
- Use: reduced-motion loading fallback.
- Policy fit: static generated-raster derivative.

### `docs/credits/assets/generated/mint-signal-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: irregular emerald-cyan knowledge signal anomaly, compact organic spectral bloom, no text, no target rings, no wireframe, no icon, no planet, and no watermark.
- Use: archived source frame for the MINT-01 signal object. Kept outside `public/` because it is not served at runtime.
- Policy fit: generated raster signal object, not CSS/vector-drawn reticle art.

### `generated/mint-signal-loop.webp`

- Source: Derived from `generated/mint-signal-source.png`.
- Date: 2026-07-08.
- Processing: animated WebP loop with alpha extraction, soft glow, subtle drift, brightness, and color pulse from generated raster frames.
- Use: active MINT-01 coordinate target.
- Policy fit: real bitmap animation. Code only masks and animates generated raster material.

### `generated/mint-signal-still.png`

- Source: First frame extracted from `generated/mint-signal-loop.webp`.
- Date: 2026-07-08.
- Use: reduced-motion MINT-01 coordinate target.
- Policy fit: static generated-raster derivative.

### `docs/credits/assets/generated/dark-node-source.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: irregular dark violet-charcoal and ember-orange dormant signal anomaly, asymmetric spectral knot, no text, no target rings, no wireframe, no icon, no planet, and no watermark.
- Use: archived source frame for the DARK NODE signal object. Kept outside `public/` because it is not served at runtime.
- Policy fit: generated raster signal object, not CSS/vector-drawn reticle art.

### `generated/dark-node-loop.webp`

- Source: Derived from `generated/dark-node-source.png`.
- Date: 2026-07-08.
- Processing: animated WebP loop with alpha extraction, soft glow, subtle drift, brightness, and color pulse from generated raster frames.
- Use: active DARK NODE coordinate target.
- Policy fit: real bitmap animation. Code only masks and animates generated raster material.

### `generated/dark-node-still.png`

- Source: First frame extracted from `generated/dark-node-loop.webp`.
- Date: 2026-07-08.
- Use: reduced-motion DARK NODE coordinate target.
- Policy fit: static generated-raster derivative.

### `docs/credits/assets/generated/deep-field-observatory.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: cinematic hand-painted deep field observatory plate with layered nebula dust, distant galaxy clusters, spectral haze, mineral green and amber signal glints, no planets, no spherical celestial bodies, no UI text, and no watermark.
- Use: previous generated background. Archived outside `public/` for reference, not referenced by the active homepage.
- Policy fit: high-quality generated raster asset. Code only composes, crops, masks, filters, and moves the image.

### `generated/signal-acquisition-texture.png`

- Source: OpenAI image generation via Codex imagegen skill.
- Date: 2026-07-08.
- Prompt summary: abstract observatory signal acquisition texture with spectral sensor noise, scan bands, telemetry grain, luminous traces, and calibration wash, with no readable text, planets, or UI labels.
- Use: low-opacity texture overlay during acquisition, coordinate, and registry phases.
- Policy fit: generated raster texture. CSS controls opacity and blend only.

## Retained Reference Assets

The previous NASA and artist-concept space assets are archived under `docs/credits/assets/space/` for provenance and possible future reference. The current homepage no longer uses them as primary visuals, so they are kept outside `public/`.

### `docs/credits/assets/space/deep-field-abell-1689.jpg`

- Source: NASA Image and Video Library.
- NASA ID: `GSFC_20171208_Archive_e002174`.
- Title: `Galaxy Cluster Abell 1689`.
- Source URL: `https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e002174/GSFC_20171208_Archive_e002174~large.jpg`.
- Credit: `NASA/Goddard Space Flight Center/Scientific Visualization Studio/ESA/L. Bradley/JHU`.
- Current use: retained, not referenced by the active homepage.

### `docs/credits/assets/space/carina-nebula.png`

- Source: NASA Image and Video Library.
- NASA ID: `carina_nebula`.
- Title: `James Webb Space Telescope NIRCam Image of the Cosmic Cliffs in Carina Nebula`.
- Source URL: `https://images-assets.nasa.gov/image/carina_nebula/carina_nebula~orig.png`.
- Credit: `NASA, ESA, CSA, STScI`.
- Current use: retained, not referenced by the active homepage.

### `docs/credits/assets/space/southern-ring-nebula.png`

- Source: NASA Image and Video Library.
- NASA ID: `southern_ring_nebula`.
- Title: `James Webb Space Telescope Southern Ring Nebula`.
- Source URL: `https://images-assets.nasa.gov/image/southern_ring_nebula/southern_ring_nebula~orig.png`.
- Credit: `NASA, ESA, CSA, STScI`.
- Current use: retained, not referenced by the active homepage.

### `docs/credits/assets/space/exoplanet-debris-disk.jpg`

- Source: NASA Image and Video Library.
- NASA ID: `PIA22082`.
- Title: `Giant Exoplanet and Debris Disk (Artist's Concept)`.
- Source URL: `https://images-assets.nasa.gov/image/PIA22082/PIA22082~orig.jpg`.
- Credit: `NASA/JPL-Caltech`.
- Current use: retained, not referenced by the active homepage.
