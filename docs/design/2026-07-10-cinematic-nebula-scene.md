# Scra Atlas Cinematic Cosmic Phenomena Scene

Status: current design and implementation direction.

## Intent

Scra Atlas is not a futuristic dashboard, map, HUD, control surface, or data panel. The universe itself is the interface. Projects appear as independent astronomical phenomena inside a cinematic deep-space scene. A project node is a navigable region of space, not a display model or a rendered ball.

The experience should feel like moving through real cosmic space: atmospheric, deep, high-scale, and physically grounded. The primary references are NASA deep-space photography, Interstellar-scale spatial travel, compact astrophysical bodies, and cinematic science-fiction atmosphere.

## Visual Direction

Use:

- Astrophysical phenomena: black holes, high-temperature stellar plasma, neutron-star magnetic disturbances, accretion flows, coronae, and sparse dust.
- Broken dust, plasma, and lensing structures.
- Deep-space atmosphere.
- Volumetric and relativistic lighting illusions.
- Natural irregular shapes.
- Slow camera motion.
- Camera travel into entity-scale fields for transitions.

Avoid:

- HUD interface.
- Dashboard layouts.
- Cards.
- Borders.
- Rectangular containers.
- Coordinate systems.
- Axes.
- Grid overlays.
- Wireframe panels.
- Scan lines.
- Futuristic control UI.
- Neon cyberpunk styling.
- Plane-based texture billboards as the project visual.
- HTML containers masquerading as project objects.
- Planets.
- Orbit rings.
- Energy spheres.
- Shield bubbles.
- Magic orbs.
- Game props.

All content should float in space. Text can exist as lightweight narrative copy, but it must not sit inside visible boxes, panels, frames, cards, maps, readouts, or decorative overlays.

## Rendering Architecture

```text
Browser
  |
  |-- React
        |
        |-- Three.js
              |
              |-- Scene management
              |     |
              |     |-- Camera
              |     |-- Cosmic phenomenon fields
              |     |     |
              |     |     |-- ShaderMaterial
              |     |     |-- FBM noise
              |     |     |-- Type-specific density, scattering, and dust fields
              |     |     |-- Volumetric and distance-detail illusion
              |     |
              |     |-- Star map objects
              |     |     |
              |     |     |-- ShaderMaterial
              |     |     |-- Procedural star field
              |     |
              |     |-- Camera transit path
              |
              |-- Render loop
                    |
                    |-- Renderer
                    |-- Uniform updates
                    |-- Slow cinematic movement
```

## Current Module Responsibilities

- `src/features/signal/SignalAtlasExperience.tsx`
  - Owns scroll narrative state, active project timing, text visibility, and traversal actions.
  - Must not render project objects as cards, framed DOM elements, maps, coordinate readouts, or HUD widgets.

- `src/features/signal/CosmicThreeScene.tsx`
  - Owns the Three.js runtime: `Scene`, `PerspectiveCamera`, `WebGLRenderer`, render loop, resize handling, scene objects, and shader uniforms.
  - Renders procedural star fields, spatial density fields, far-space atmosphere, and camera-driven travel.
  - Project placement data can be used internally for spatial arrangement, but must not be displayed as coordinates or map UI.

- `src/styles/global.css`
  - Owns typography, text placement, focus states, reduced-motion behavior, and non-WebGL fallback atmosphere.
  - Must not introduce visual boxes, borders, framed sections, dashboard panels, cards, grids, scan treatments, or cyberpunk UI effects.

## Scene Objects

### Background

The background is a procedural star field and far-space atmosphere. It should not depend on a flat background image as the primary experience. Stars may be `THREE.Points` with shader-controlled size, opacity, and subtle twinkle, but they should not become oversized bokeh blobs that flatten the scene.

### Cosmic Phenomena

Project nodes are shader-generated cosmic phenomena, not nebula cards or display models:

- Use `ShaderMaterial`.
- Do not use a generic sphere mesh, planet surface, or 3D display model as a project identity. A sphere is permitted only when it is the explicit, physically motivated core of a compact stellar body such as `DARK NODE`'s pulsar.
- When a phenomenon needs a recognisable compact-body signature, use a dedicated geometry hierarchy instead of a ray-march volume. An invisible box is allowed only as the integration volume for diffuse phenomena; it is never the visual silhouette.
- Build a recognisable physical structure first, then use noise to disturb its density, alpha, and edge. FBM must not become the final colour field.
- Use fragment shaders to generate plasma density, disrupted accretion flows, broken coronae, compact magnetic disturbances, scattering, and irregular emission.
- Use sparse dust, plasma, caustic, or lensing fields to reveal identity.
- Use distance-based detail so remote objects read tiny, then gain structure during approach.
- Keep silhouettes physically motivated and naturally broken.
- Avoid complete geometric rings or symmetrical protective shells.
- Keep the settled project anchor within roughly 28–42vw, leaving a black, readable negative-space region for copy.

Entities should not read as planets, circular logos, spherical UI widgets, game pickups, or magical balls. If a mesh is used as a carrier, it is only a projection surface for a physical phenomenon generated by shader logic.

### Project Entities

Projects are floating cosmic entities. They are not UI elements and must not be represented by HTML cards, bordered preview frames, image tiles, coordinate markers, or reticles.

Each project may have:

- A seeded astrophysical entity type.
- A distinct but natural palette.
- A local lensing, plasma, surface, or stellar-dust field.
- A subtle physical rhythm.
- A camera arrival path.

Current signatures:

- `MINT-01`: cold teal, asymmetric high-temperature plasma core with a broken corona and thin mint dust.
- `DARK NODE`: cold white-blue pulsar, built from a compact spherical core, three analytical halo layers, two soft conical plasma jets, and sparse local dust. Its body is deliberately small and positioned left of the right-hand narrative copy.
- `FUTURE SIGNAL`: compact neutral-blue magnetic plasma disturbance with short, disrupted polar regions instead of long energy beams.

`DARK NODE` is the first structured-body implementation. It deliberately does not use the existing BoxGeometry density/ray-march route. Surface noise changes only its brightness, while the halo and jet shaders vary alpha without erasing the core's readable circular silhouette. Each halo uses a camera-facing `CircleGeometry`, then discards fragments outside its radial unit circle and resolves the remaining edge to zero alpha. This double boundary prevents any square sprite read. The analytical halo layers replace a full-screen bloom pass. Its bipolar jets run along a single tilted axis, are brightest near the core, and fade through their conical length without becoming hard laser lines.

Its motion is one restrained, shared signal rather than separate visual effects: the core surface rotates slowly; a roughly 3.7-second pulse drives the white-hot centre, cyan rim, halo alpha, and near-jet brightness; the jet axis precesses by only a few hundredths of a radian; and a faint shader pattern travels from the core toward each jet's dissipating end. A small perspective parallax is permitted for pointer movement, but the body never follows the cursor.

The project copy may float nearby, but the cosmic object itself remains in Three.js.

### Space Transit

Transit between projects must simulate high-speed movement through a real three-dimensional space. It should not look like a traditional light-beam corridor, a technical portal, or an overlay effect.

Required sequence:

1. The current cosmic entity remains the starting body in the scene.
2. The camera locks onto the next target entity in far space.
3. The target begins as a very small, weak body, like a distant compact stellar phenomenon.
4. The camera accelerates along a spatial path toward the target.
5. The target grows through real perspective and distance compression, not a flat scale animation.
6. Nearby stars and dust produce depth parallax and short motion streaks.
7. Dust, plasma, lensing, or stellar surface detail becomes visible as the camera closes distance.
8. Space can bend slightly through shader warping, but should stay natural and cinematic.
9. Near arrival, the target expands from a tiny distant body into a large-scale surrounding field.
10. The camera may cross its sparse outer dust and gas layers, then settles at a single exterior observation pose.
11. The transit endpoint and settled pose are identical: no post-arrival recoil, pull-back, or FOV reset is permitted.

The intended feel is closer to Google Earth accelerating into a location, cinematic warp across cosmic distance, and a camera passing through a real spatial volume. It is not a separate transition animation played in front of the scene.

Implementation levers:

- Camera movement.
- Perspective scaling.
- Depth parallax.
- Motion blur impression through depth parallax and restrained point deformation.
- Entity field distortion.
- Shader-driven gas stretching.

Do not use horizontal beams, rectangular corridors, HUD overlays, technical portals, or radial speed-line graphics.

## Interaction and Motion

- Pointer motion can subtly influence parallax, camera drift, and entity-field motion.
- Scroll progress can drive camera position, transition intensity, and project arrival.
- DARK NODE enters by using the existing perspective approach plus a 0.9-to-1.0 structured-body scale, jet fade-in, and a short halo flare. Its camera drift ramps in before the same shared arrival pose, so it cannot create a post-arrival pull-back.
- Reduced-motion mode should keep the scene readable while reducing travel intensity.
- If WebGL is unavailable, fallback visuals should still feel like deep space, not a UI shell.

## Performance Boundaries

- The field shader uses a distance-adaptive 8–25 ray-step budget, with a hard compile-time maximum of 25.
- Type branches return early in GLSL, so a stellar field does not calculate black-hole or neutron-star density work.
- Volumetric fields are hidden for far inactive projects; their sparse dust remains as the distant cue.
- Renderer pixel ratio is capped at `0.8`, while the background star count and per-field dust count stay deliberately bounded.
- The background uses 1,200 far stars, 640 mid stars, and 150 near stars. Their parallax is transform/uniform driven, so no particle buffer is rewritten per frame.
- Pulsar motion is limited to shader uniforms and transforms on its existing core, three halo discs, two cones, and 88 local dust points.
- Camera motion resolves directly to its target pose. This avoids both the visual recoil and an unnecessary settling animation.

## Source and Provenance

The active visual direction is code-rendered with project-owned Three.js and GLSL. The GLSL in `CosmicThreeScene.tsx` is original project code based on common procedural graphics techniques: value noise, FBM, domain warping, density fields, short volumetric ray marching, atmospheric scattering, and transparent layered geometry.

Generated or downloaded bitmap assets may remain archived for provenance, fallback, or future reference, but they are not the primary project entity system. Any future external shader snippets, images, or media must document provenance and licensing in `docs/` or `public/assets/ASSET_MANIFEST.md`.

## Acceptance Criteria

- The first impression is a real spatial deep-space scene, not a website dashboard.
- No HUD, dashboard, card, border, coordinate axis, grid, scan line, wireframe panel, or rectangular project container is visible.
- Project anchors read as independent cosmic phenomena in space.
- Each anchor has a clear type-specific structure rather than random full-screen noise.
- Phenomena feel like spatial astrophysical regions, not planets, props, magic balls, or UI markers.
- Transitions read as camera movement through space and into the target entity's surrounding field.
- Once an arrival completes, the camera remains fixed at the final pose.
- Text floats without becoming a framed UI layer.
- The implementation keeps scene management, render loop, camera, renderer, entity objects, star objects, and transition objects clearly separated.
