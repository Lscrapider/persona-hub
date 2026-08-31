# Asset Manifest

## Generated hero assets

### `hero/phantom-courier-stage.png`

- Role: homepage character stage.
- Source: generated with OpenAI Image Gen on 2026-07-27.
- Visual reference: `docs/design/assets/homepage-direction-02.png`.
- Notes: original character and background asset; all reference UI text and the flying card were removed before use.

### `hero/phantom-courier-background.png`

- Role: character-free WebGL stage behind the GPU-rendered model.
- Source: edited from `hero/phantom-courier-stage.png` with OpenAI Image Gen on 2026-07-29.
- Visual reference: `docs/design/assets/homepage-direction-02.png`.
- Notes: the character was removed while preserving the black, crimson and distressed diagonal stage. Contains no person, UI, logo, text or card.

### `projects/featured-project-card.png`

- Role: WebGL card face and project transition preview.
- Source: generated with OpenAI Image Gen on 2026-07-27.
- Visual reference: `docs/design/assets/card-transition-direction-03.png`.
- Notes: independent city-route artwork with no UI, logo, text or copied game asset.

## Third-party prototype models

### `models/robot-expressive.glb`

- Role: temporary GPU Skinning, camera-orbit and hand-to-card release prototype.
- Source: three.js `RobotExpressive`, model by Tomás Laulhé with modifications by Don McCurdy.
- Fixed upstream asset: `https://raw.githubusercontent.com/mrdoob/three.js/r185/examples/models/gltf/RobotExpressive/RobotExpressive.glb`.
- License reference: `https://raw.githubusercontent.com/mrdoob/three.js/r185/examples/models/gltf/RobotExpressive/README.md`.
- License: CC0 1.0.
- SHA-256: `047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319`.
- Notes: technical proxy only. It validates the real-time skeleton and throw pipeline but is not the final original character design.
