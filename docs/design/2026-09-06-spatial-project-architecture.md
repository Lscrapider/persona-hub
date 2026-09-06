# Spatial project architecture

Current direction, 2026-09-06. Supersedes the equal-width document workbench.

## What the scene explains

The primary object is the architecture, not a catalogue of documentation. 3D models alone do not establish architecture: named responsibility groups, vertical separation, containment, model scale, and directed relationships establish the system's structure and emphasis.

- **Financial Management AI:** Python Workers form the primary intelligent-workflow domain. Java is the secondary business and authorization boundary. RabbitMQ connects asynchronous work. PostgreSQL, InfluxDB, and MinIO are smaller supporting components grouped on a lower data foundation. The client and external model service remain contextual dependencies. The diagram summarizes logical responsibilities; it does not assert host counts, replicas, or a literal deployment arrangement.
- **Urban Sidequest:** online route orchestration is primary. Geographic calibration and model dependencies support that service. Storage and cache share a subordinate foundation. Offline Python training has its own boundary; planned online quality reranking is drawn with a dashed relationship and described as an evolution design.
- **Scrapider Guidelines:** this project is a package, not a deployed system. The main Skill entry routes to grouped Java/Python/Android references. An independent review role reads the same references. Its heading explicitly says guidance package structure.

## Documents follow ownership

Clicking a model with relevant documents opens a native modal. Its left navigation contains the business/technical documents belonging to that service; the right pane renders the selected local document's full curated content. A node can have no documents and still be part of the architecture. Such nodes expose their role and owned capabilities without opening an empty reader.

Python Workers owns Agent architecture, scene/tag computation, report generation, OCR, ingestion tags, RAG and final-answer personalization documentation. Those subjects are capabilities inside the service, not separate infrastructure objects. Cross-boundary documents may appear for more than one owner when their content actually spans those responsibilities. No artificial catch-all mapping is added to force total document coverage.

Project selection closes the current reader and changes the complete architecture. Document order follows each owner's explicit document order. Escape, the close control, and backdrop clicks dismiss the reader and restore focus. The background is inert and its previous scroll state is restored. Modal surfaces remain graphite, with no full-width bone contrast panel.

## Rendering and interaction

`projectArchitecture.ts` contains localized nodes, responsibility groups, emphasis/scale, directed edges, optional documents, and optional business-flow highlights. `architectureModels.ts` contains original procedural Three.js geometry for devices, services, workers, queues, stores, external services and packages. `architectureRenderer.ts` places these objects inside the responsibility groups, projects captions through the same camera, and raycasts real model meshes.

The camera supports pointer orbit, buttons for rotation and zoom, and reset. Motion expresses queue transport, processing and directional data travel. The scene does not rotate automatically or reorder responsibilities. STATIC keeps a stable model pose and readable arrow directions. Hover/focus highlights adjacent relationships, with short communication labels; long explanations live outside the model space.

The Three.js module is dynamically loaded near the viewport. Animation stops while offscreen, when hidden, in STATIC, or while reading a modal. Renderer resources and events are disposed on unmount. If WebGL fails, the same module buttons appear as a usable fallback list with a text relationship disclosure. Mobile includes a grouped module index as an alternative to small projected targets.

## Visual ownership and provenance

The feature uses the site's League Gothic, Manrope and CJK fonts, with a graphite surface, warm gray labels, quiet structural lines and a copper focus signal. Runtime values live in `projects.css`; modal values live in `projectDocumentDialog.css`. Main objects are larger and higher; infrastructure is subordinate. Platform captions are short boundary names, not paragraphs floating over geometry.

All model geometry is original code in this repository. No downloaded model, texture, image-generated mockup or shader snippet is used in the implemented scene. API references: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html). Package source/license is distributed with `three` (MIT).

Architecture and document content are grounded in `src/content/{zh,en}/projects.json`, which records curated material from the author's public repositories. Existing source-document URLs continue to link to the exact GitHub main-branch path.

## Request walkthroughs

Flow selection now starts one finite, narrated interaction in FULL. Finance provides Agent conversation, manual knowledge ingestion, and image OCR; Urban provides current route generation. Each localized step identifies its sender, receiver, title and explanation. A same-node step represents internal processing. Skill package relationships and planned preference learning retain structural highlighting rather than claiming a runtime exchange.

The copper packet follows exactly one directed communication route, including reversed routes for responses. The receiving module is emphasized; a small activity ring follows the processing endpoint. Other connections remain quiet. Playback defaults to 2× (1.8 seconds per step); 1× remains available at 3.6 seconds per step, with pause/resume, previous/next, a continuous draggable whole-flow progress bar, replay and 2× controls. Visible numbered step markers are removed; narration occupies unboxed upper-left scene whitespace, and a compact transport row sits below the model. This timing illustrates order, not production latency. Playback ends once, preserving the final explanation. No real request is sent to a project backend.

The scene and step clock pause when the document is hidden, the scene is outside the viewport, or a document dialog is open. STATIC provides manual steps without automatic traversal. Frame progress is kept in refs and Three.js; React updates only for meaningful step/control changes. Existing projected model buttons and document ownership remain available during playback.

The sequences are illustrative successful paths, not exhaustive state machines. Knowledge ingestion demonstrates an optional weak-tag LLM branch. OCR explicitly assumes a successful image and human approval; real tasks wait at the review gate. PDF recognition is a separate branch and is identified in the opening explanation.

### Source correction discovered during walkthrough review

Agent business reads go through Java authorization, while OCR independently writes knowledge vectors and stage state from Python. The architecture now includes the explicit Python-to-PostgreSQL relationship. This is grounded in `financial-management-ai/docs/OCR_PIPELINE.md`, `ai-python/app/ocr/services/vector_store.py`, and `ai-python/app/ocr/handlers/embedding_index_handler.py` in the source project, alongside the already curated Agent, RAG and route design documentation. Java consumes `quality.validate`; human confirmation precedes chunk tagging and embedding.

### Scene legibility refinement

Default framing is closer (15.7 world units wide / a 10.2-unit minimum vertical field), making the model assembly larger while preserving the relative emphasis of workers, services and stores. Model captions are smaller, transparent and unboxed; only keyboard focus draws an outline. Packets render last with depth testing and depth writes disabled, keeping requests visible across occluding models and platforms.

### Module spacing

Module and responsibility-group centers are spaced 15% farther apart in the horizontal X/Z plane. Model scales, vertical layers and camera framing are unchanged. Shared storage/reference platforms widen only enough to preserve their edge margins around the separated models; single-module platforms retain their size. Routes and caption anchors follow the updated positions.

### Consistent view size

Full architecture, playable flows and structural flow highlights share the same scene height: `clamp(32rem, 43vw, 40rem)` on desktop. The previous taller overview viewport changed the orthographic pixels-per-world-unit ratio and made overview models larger. Removing that mode-specific height keeps the smaller flow-view scale consistent, including Urban route generation and preference learning. Existing model proportions, expanded spacing and view controls remain unchanged.

Finance and Skill receive a further 15% increase in X/Z center spacing. Urban stays at its previous layout. Model scales and camera sizing remain unchanged; the shared finance storage and Skill reference platforms expand to retain their margins.

### In-scene narration

Current-step narration is portaled into a fixed upper-left scene slot. Structural Skill and evolution selections use the same unboxed text treatment. The slot changes neither the canvas dimensions nor model positions. Projected model captions form a separate stacking context below narration; overhead captions sit above their anchors instead of covering model roofs. Playback suppresses hover route-label chips because the narration already identifies the active sender and receiver. Hover relationship captions remain available in full/structural views.

## Refined kinetic models

All eleven model types now have deterministic internal mechanisms: changing client charts and mobile route markers; exposed service fans and worker compute rotors; queue rollers and message carriers; database read arcs; cache activity cells; object-storage scanners; articulated external-model hubs; hinged package flaps and layered document sheets; repository page feeds. Root transforms, project layout spacing and camera sizing remain fixed. Small mechanical motions are an architectural illustration, not live backend telemetry.

The scene runs all model mechanisms during FULL, including models outside the current playback step. The active request still owns the stronger material and route emphasis. Pause, STATIC, document visibility, offscreen suspension and document dialogs retain the existing lifecycle. Pausing preserves current poses; models do not jump back to their rest pose. Geometry and materials are cached within each model and disposed with its scene. Small hardware details skip shadow casting.

Rounded chassis, hardware panels, vents, ports and differentiated PBR roughness replace the former coarse-only treatment. A locally generated RoomEnvironment/PMREM reflection map supplies metal highlights, and one filtered directional shadow map grounds models on their responsibility platforms. Environment targets and shadow resources are disposed, and environment lighting is regenerated after WebGL context restoration.

### Skills and provenance

Installed the ten-skill collection from https://github.com/CloudAI-X/threejs-skills at the user’s request. Applied `threejs-geometry`, `threejs-materials`, `threejs-animation` and `threejs-lighting`: reusable geometry/materials, deterministic procedural animation, PBR, selective shadows and resource cleanup. Skill examples are cross-checked against installed Three.js r185; deprecated PCFSoftShadowMap is replaced by PCFShadowMap, and unavailable addon examples are not used. Existing HyperFrames animation guidance informed time-driven poses; this remains a native Three.js website, not a video composition.

All model meshes and motions are original procedural code. RoundedBoxGeometry and RoomEnvironment are imported from the installed Three.js MIT distribution. RoomEnvironment is Three.js’s environment setup based on Google model-viewer’s EnvironmentScene. No remote textures, HDR images, GLB models or copied shader assets are required. References: https://threejs.org/docs/pages/RoundedBoxGeometry.html, https://threejs.org/docs/pages/RoomEnvironment.html and https://threejs.org/docs/pages/PMREMGenerator.html.
