import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { createArchitectureModel, type ModelActivity } from "./architectureModels";
import { createArchitectureActivity } from "./architectureActivity";
import { createArchitecturePulse } from "./architecturePulse";
import { createArchitectureRoute } from "./architectureRoutes";
import { architectureStepTiming } from "./architectureTiming";
import type { ArchitectureActivity, ArchitectureFlowStep, ArchitectureNode, ProjectArchitecture } from "./projectArchitecture";

type Playback = ArchitectureFlowStep & Readonly<{ progress: number }>;

/** A step describes work; the endpoint type determines how that work is embodied. */
function activityFor(node: ArchitectureNode, operation: ArchitectureActivity): ModelActivity {
  if (node.model === "queue" || node.model === "client" || node.model === "mobile") return "transfer";
  if (node.model === "database" || node.model === "storage" || node.model === "cache") return operation === "write" ? "write" : "read";
  if (operation === "scan" && (node.model === "workers" || node.model === "external")) return "scan";
  if (operation === "write" && node.model === "workers") return "compute";
  return operation;
}

export type ArchitectureRenderer = Readonly<{
  setMotion: (enabled: boolean) => void;
  setHighlight: (id: string | null) => void;
  setFlow: (ids: readonly string[] | null) => void;
  setPlayback: (step: Playback | null) => void;
  rotate: (direction: number) => void;
  zoom: (direction: number) => void;
  reset: () => void;
  dispose: () => void;
}>;

type Callbacks = Readonly<{ onSelect: (id: string) => void; onHover: (id: string | null) => void; onAvailability: (available: boolean) => void }>;

/** A spatial system model. HTML captions use the same world/camera transform as meshes. */
export function createArchitectureRenderer(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  labels: ReadonlyMap<string, HTMLButtonElement>,
  architecture: ProjectArchitecture,
  callbacks: Callbacks,
): ArchitectureRenderer {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  let environmentTarget: THREE.WebGLRenderTarget | null = null;
  function lightEnvironment() {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      const next = pmrem.fromScene(room, 0.05, 0.1, 100, { size: 128 });
      environmentTarget?.dispose();
      environmentTarget = next;
      scene.environment = next.texture;
      scene.environmentIntensity = 0.65;
    } finally {
      room.dispose();
      pmrem.dispose();
    }
  }
  lightEnvironment();
  const camera = new THREE.OrthographicCamera(-9, 9, 7, -7, 0.1, 100);
  const assembly = new THREE.Group();
  scene.add(assembly);
  scene.add(new THREE.HemisphereLight(0xe7eef0, 0x283033, 1.4));
  const light = new THREE.DirectionalLight(0xffe6cf, 3.4);
  light.position.set(-5, 10, 7);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 0.5, far: 40 });
  light.shadow.normalBias = 0.035;
  light.shadow.bias = -0.0003;
  light.shadow.intensity = 0.38;
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xb7c5cf, 1.1);
  fill.position.set(8, 5, -7);
  scene.add(fill);
  const geometryDisposals: THREE.BufferGeometry[] = [];
  const materialDisposals: THREE.Material[] = [];
  // Each plane is a named software boundary. Their height and footprint express
  // responsibility and importance; there is no shared board of equal objects.
  const boundaries = architecture.groups.map((boundary) => {
    const [width, depth] = boundary.size;
    const geometry = new THREE.BoxGeometry(width, 0.1, depth);
    const material = new THREE.MeshStandardMaterial({ color: boundary.id.includes("data") ? 0x263038 : 0x35434a, roughness: 0.8, metalness: 0.2 });
    const platform = new THREE.Mesh(geometry, material);
    platform.receiveShadow = true;
    platform.position.set(...boundary.position);
    assembly.add(platform);
    const rimGeometry = new THREE.EdgesGeometry(geometry);
    const rimMaterial = new THREE.LineBasicMaterial({ color: 0x8c9695, transparent: true, opacity: 0.6 });
    const rim = new THREE.LineSegments(rimGeometry, rimMaterial);
    rim.position.copy(platform.position);
    assembly.add(rim);
    geometryDisposals.push(geometry, rimGeometry);
    materialDisposals.push(material, rimMaterial);
    const label = host.querySelector<HTMLElement>(`[data-boundary-id="${boundary.id}"]`);
    return { boundary, label, platform };
  });

  const nodes = architecture.nodes.map((node) => {
    const model = createArchitectureModel(node.model);
    model.group.position.set(...node.position);
    model.group.scale.setScalar(node.scale);
    model.group.traverse((object) => { object.userData.nodeId = node.id; });
    assembly.add(model.group);
    const bounds = new THREE.Box3().setFromObject(model.group);
    const labelHeight = bounds.max.y + 0.24;
    const roofCorners = node.model === "service" ? [bounds.min.x, bounds.max.x].flatMap((x) => [bounds.min.z, bounds.max.z].map((z) => new THREE.Vector3(x, bounds.max.y, z))) : [];
    const work = createArchitectureActivity(bounds);
    assembly.add(work.group);
    const label = labels.get(node.id);
    const activityLabel = label?.querySelector<HTMLElement>("[data-activity-cue]");
    return { node, model, work, label, activityLabel, labelHeight, roofCorners, activeOperation: "idle" as ModelActivity };
  });
  const byId = new Map(nodes.map((entry) => [entry.node.id, entry]));
  const routeNeutral = new THREE.Color(0x657b84);
  const routeActive = new THREE.Color(0xc99875);
  const edges = architecture.edges.flatMap((edge, index) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return [];
    const curve = createArchitectureRoute(architecture, edge, index);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(160));
    const material = edge.planned
      ? new THREE.LineDashedMaterial({ color: routeNeutral, transparent: true, opacity: 0.65, dashSize: 0.16, gapSize: 0.12 })
      : new THREE.LineBasicMaterial({ color: routeNeutral, transparent: true, opacity: 0.72 });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    const pulse = createArchitecturePulse(curve);
    const tubeGeometry = new THREE.TubeGeometry(curve, 160, 0.012, 4, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: routeNeutral, transparent: true, opacity: 0.6 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.visible = !edge.planned;
    assembly.add(tube);
    geometryDisposals.push(tubeGeometry);
    materialDisposals.push(tubeMaterial);
    // Arrow direction remains legible in STATIC, too.
    const arrow = new THREE.ArrowHelper(curve.getTangentAt(0.83).normalize(), curve.getPointAt(0.83), 0.22, 0x90a0a4, 0.16, 0.11);
    assembly.add(line, pulse.mesh, arrow);
    geometryDisposals.push(geometry);
    materialDisposals.push(material);
    const label = host.querySelector<HTMLElement>(`[data-edge-index="${index}"]`);
    return [{ edge, material, tubeMaterial, pulse, curve, arrow, label }];
  });

  let width = 1;
  let height = 1;
  let compact = false;
  let motion = false;
  let visible = false;
  let disposed = false;
  let lost = false;
  let highlighted: string | null = null;
  let flow: ReadonlySet<string> | null = null;
  let playback: Playback | null = null;
  let refreshActivity = false;
  let elapsed = 0;
  let previousTime = 0;
  let diagnosticsAt = -1;
  let azimuth = 0.34;
  let elevation = 0.48;
  let zoom = 1;
  let dragging = false;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let lastY = 0;
  let hovered: string | null = null;
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function updateCamera() {
    camera.position.set(Math.sin(azimuth) * Math.cos(elevation) * 22, Math.sin(elevation) * 22, Math.cos(azimuth) * Math.cos(elevation) * 22);
    camera.lookAt(0, 0.9, 0);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }

  function render(time?: number) {
    if (disposed || lost) return;
    let delta = 0;
    if (time !== undefined && motion) {
      if (previousTime) delta = Math.min((time - previousTime) / 1000, 0.05);
      elapsed += delta;
      previousTime = time;
    }
    const timing = playback ? architectureStepTiming(playback.progress, playback.from === playback.to) : null;
    host.dataset.phase = timing?.phase ?? "idle";
    nodes.forEach((entry) => {
      const { node, model, work, label, activityLabel, labelHeight, roofCorners } = entry;
      const participating = playback ? node.id === playback.from || node.id === playback.to : !!flow?.has(node.id);
      let activity: ModelActivity = "idle";
      let strength = 0;
      if (playback && node.id === playback.to && timing?.phase === "process") {
        activity = activityFor(node, playback.activity);
        strength = timing.strength;
      }
      model.setHighlighted(node.id === highlighted || (!playback && participating) || strength > 0.12);
      model.setActivity(activity, strength);
      // Clear the previous operation at its boundary, preserving mechanical phase.
      // Otherwise smoothed OCR/read accents could linger into the next transfer.
      if (activity === "idle" && entry.activeOperation !== "idle") model.advance(0);
      entry.activeOperation = activity;
      // Local clocks integrate speed, so a mode change cannot jump the rotor phase.
      if (delta > 0 || refreshActivity) model.advance(delta);
      work.update(elapsed, strength, activity);
      if (activityLabel) {
        activityLabel.hidden = strength <= 0.12 || activity === "idle";
        const status = activityLabel.dataset[activity] ?? "";
        if (activityLabel.textContent !== status) activityLabel.textContent = status;
      }
      if (label) {
        label.dataset.activity = strength > 0.12 ? activity : "idle";
        label.dataset.processing = String(strength > 0.12);
      }
      if (!label) return;
      // Labels are captions beneath each model; they never replace its geometry.
      const overhead = node.emphasis === "primary" || node.model === "service" || (node.model === "package" && node.emphasis === "secondary");
      const placement = overhead ? "above" : "below";
      if (label.dataset.placement !== placement) label.dataset.placement = placement;
      projected.set(node.position[0], overhead ? labelHeight : node.position[1] + 0.04, node.position[2] + (overhead ? 0 : node.scale * 1.1)).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
      let captionTop = (-projected.y * 0.5 + 0.5) * height;
      for (const corner of roofCorners) {
        projected.copy(corner).project(camera);
        captionTop = Math.min(captionTop, (-projected.y * 0.5 + 0.5) * height - 14);
      }
      label.style.top = `${captionTop}px`;
      label.style.zIndex = String(Math.round((1 - projected.z) * 1000));
    });
    refreshActivity = false;
    boundaries.forEach(({ boundary, label }) => {
      if (!label) return;
      projected.set(boundary.position[0], boundary.position[1] - 0.15, boundary.position[2] + boundary.size[1] / 2 + 0.22).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
    });
    const shownLabels = new Set<string>();
    edges.forEach(({ edge, material, tubeMaterial, pulse, curve, arrow, label }) => {
      const forward = playback?.from === edge.from && playback.to === edge.to;
      const reverse = playback?.from === edge.to && playback.to === edge.from;
      // Opposite architecture edges may share endpoints. Use the exact direction
      // when it exists, otherwise reuse the reverse route for its response.
      const exactExists = playback && architecture.edges.some((entry) => entry.from === playback?.from && entry.to === playback?.to);
      const currentRoute = !!forward || (!!reverse && !exactExists);
      const focus = playback ? currentRoute : highlighted ? edge.from === highlighted || edge.to === highlighted : !!flow && flow.has(edge.from) && flow.has(edge.to);
      const dim = (playback || highlighted || flow) && !focus;
      material.color.copy(focus ? routeActive : routeNeutral);
      material.opacity = dim ? 0.09 : focus ? 0.88 : 0.3;
      tubeMaterial.color.copy(material.color);
      tubeMaterial.opacity = dim ? 0.06 : focus ? 0.6 : 0.18;
      const backwards = !!playback && !!reverse && !forward;
      const arrowAt = backwards ? 0.17 : 0.83;
      arrow.position.copy(curve.getPointAt(arrowAt));
      arrow.setDirection(curve.getTangentAt(arrowAt).normalize().multiplyScalar(backwards ? -1 : 1));
      arrow.setColor(focus ? 0xd9a17b : 0x81949c);
      arrow.visible = !playback && focus && !dim;
      pulse.update(playback?.progress ?? 0, backwards, !!playback && currentRoute);
      if (label) {
        const request = !!playback && !!timing?.signalVisible && currentRoute;
        label.dataset.request = String(request);
        const text = request ? label.dataset[playback!.activity] ?? edge.label : edge.label;
        if (label.textContent !== text) label.textContent = text;
        label.hidden = playback ? !request || compact : !highlighted || !focus || compact || shownLabels.has(edge.label);
        if (!label.hidden) shownLabels.add(edge.label);
        projected.copy(curve.getPointAt(0.52)).project(camera);
        label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
        label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
      }
    });
    renderer.render(scene, camera);
    if (Math.floor(elapsed) !== diagnosticsAt) {
      diagnosticsAt = Math.floor(elapsed);
      canvas.dataset.modelTime = elapsed.toFixed(2);
      canvas.dataset.drawCalls = String(renderer.info.render.calls);
      canvas.dataset.triangles = String(renderer.info.render.triangles);
    }
  }

  function updateLoop() {
    const running = motion && visible && !document.hidden && !lost;
    previousTime = 0;
    renderer.setAnimationLoop(running ? render : null);
    canvas.dataset.animating = String(running);
    render();
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    compact = width < 640;
    // The complete topology is kept on mobile; a caption list below is the touch alternative.
    const worldWidth = 15.7;
    const visibleHeight = Math.max(10.2, worldWidth * height / width);
    camera.left = -visibleHeight * width / height / 2;
    camera.right = -camera.left;
    camera.top = visibleHeight / 2;
    camera.bottom = -camera.top;
    updateCamera();
    renderer.setSize(width, height, false);
    render();
  }
  function hit(event: PointerEvent) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const match = raycaster.intersectObjects([
      ...nodes.map(({ model }) => model.group),
      ...boundaries.map(({ platform }) => platform),
    ], true)[0];
    return typeof match?.object.userData.nodeId === "string" ? match.object.userData.nodeId as string : null;
  }
  function move(event: PointerEvent) {
    if (dragging && event.pointerType !== "touch") {
      azimuth -= (event.clientX - lastX) * 0.006;
      elevation = THREE.MathUtils.clamp(elevation + (event.clientY - lastY) * 0.004, 0.35, 1.18);
      lastX = event.clientX;
      lastY = event.clientY;
      updateCamera();
      render();
      return;
    }
    const id = hit(event);
    canvas.style.cursor = id ? "pointer" : "grab";
    if (id !== hovered) { hovered = id; callbacks.onHover(id); }
  }
  function down(event: PointerEvent) {
    if (event.button !== 0) return;
    downX = lastX = event.clientX;
    downY = lastY = event.clientY;
    dragging = true;
    if (event.pointerType !== "touch") canvas.setPointerCapture(event.pointerId);
  }
  function up(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (Math.hypot(event.clientX - downX, event.clientY - downY) < 6) {
      const id = hit(event);
      if (id) callbacks.onSelect(id);
    }
  }
  const leave = () => { if (!dragging) { hovered = null; callbacks.onHover(null); } };
  const cancel = () => { dragging = false; };
  const onLost = (event: Event) => {
    event.preventDefault(); lost = true;
    host.dataset.renderer = "fallback";
    renderer.setAnimationLoop(null);
    canvas.dataset.animating = "false";
    callbacks.onAvailability(false);
  };
  const onRestored = () => { lost = false; lightEnvironment(); resize(); host.dataset.renderer = "ready"; callbacks.onAvailability(true); updateLoop(); };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const activity = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; updateLoop(); }, { threshold: 0.05 });
  activity.observe(host);
  document.addEventListener("visibilitychange", updateLoop);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  resize();
  host.dataset.renderer = "ready";

  return {
    setMotion(enabled) { motion = enabled; updateLoop(); },
    setHighlight(id) { highlighted = id; render(); },
    setFlow(ids) { flow = ids ? new Set(ids) : null; render(); },
    setPlayback(step) {
      // Seeking in STATIC/paused mode updates the local cue without moving its phase.
      refreshActivity = step?.progress === 1 || (canvas.dataset.animating !== "true" && (step?.progress !== playback?.progress || step?.activity !== playback?.activity || step?.from !== playback?.from || step?.to !== playback?.to));
      playback = step;
      if (canvas.dataset.animating !== "true") render();
    },
    rotate(direction) { azimuth += direction * 0.2; updateCamera(); render(); },
    zoom(direction) { zoom = THREE.MathUtils.clamp(zoom + direction * 0.1, compact ? 0.8 : 0.85, 1.4); updateCamera(); render(); },
    reset() { azimuth = 0.34; elevation = 0.48; zoom = 1; updateCamera(); render(); },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect(); activity.disconnect();
      document.removeEventListener("visibilitychange", updateLoop);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      nodes.forEach(({ model, work }) => { model.dispose(); work.dispose(); });
      edges.forEach(({ arrow, pulse }) => { arrow.dispose(); pulse.dispose(); });
      geometryDisposals.forEach((geometry) => geometry.dispose());
      materialDisposals.forEach((material) => material.dispose());
      scene.environment = null;
      environmentTarget?.dispose();
      light.shadow.dispose();
      renderer.dispose();
    },
  };
}
