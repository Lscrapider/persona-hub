import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { createArchitectureModel } from "./architectureModels";
import type { ProjectArchitecture } from "./projectArchitecture";

export type ArchitectureRenderer = Readonly<{
  setMotion: (enabled: boolean) => void;
  setHighlight: (id: string | null) => void;
  setFlow: (ids: readonly string[] | null) => void;
  setPlayback: (step: Readonly<{ from: string; to: string; progress: number }> | null) => void;
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
    const labelHeight = new THREE.Box3().setFromObject(model.group).max.y + 0.24;
    return { node, model, label: labels.get(node.id), labelHeight };
  });
  const byId = new Map(nodes.map((entry) => [entry.node.id, entry]));
  const packetGeometry = new THREE.SphereGeometry(0.055, 8, 6);
  // Packets are interaction markers: draw after transparent routes as well as
  // opaque models so their journey stays visible through every service layer.
  const packetMaterial = new THREE.MeshBasicMaterial({
    color: 0xe6aa7a,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  geometryDisposals.push(packetGeometry);
  materialDisposals.push(packetMaterial);
  const routeNeutral = new THREE.Color(0x657b84);
  const routeActive = new THREE.Color(0xc99875);
  const edges = architecture.edges.flatMap((edge, index) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) return [];
    const start = new THREE.Vector3(...from.node.position);
    const end = new THREE.Vector3(...to.node.position);
    const direction = end.clone().sub(start);
    direction.y = 0;
    direction.normalize();
    start.addScaledVector(direction, from.node.scale * 0.75);
    end.addScaledVector(direction, -to.node.scale * 0.75);
    start.y += from.node.scale * 0.55;
    end.y += to.node.scale * 0.55;
    const mid = start.clone().lerp(end, 0.5);
    // Short raised bridges separate crossing routes from the board plane.
    mid.y += Math.min(0.6, start.distanceTo(end) * 0.055);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
    const material = edge.planned
      ? new THREE.LineDashedMaterial({ color: routeNeutral, transparent: true, opacity: 0.65, dashSize: 0.16, gapSize: 0.12 })
      : new THREE.LineBasicMaterial({ color: routeNeutral, transparent: true, opacity: 0.72 });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    const packet = new THREE.Mesh(packetGeometry, packetMaterial);
    packet.renderOrder = 1000;
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, 0.018, 4, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: routeNeutral, transparent: true, opacity: 0.6 });
    const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    tube.visible = !edge.planned;
    assembly.add(tube);
    geometryDisposals.push(tubeGeometry);
    materialDisposals.push(tubeMaterial);
    // Arrow direction remains legible in STATIC, too.
    const arrow = new THREE.ArrowHelper(curve.getTangent(0.83).normalize(), curve.getPoint(0.83), 0.22, 0x90a0a4, 0.16, 0.11);
    assembly.add(line, packet, arrow);
    geometryDisposals.push(geometry);
    materialDisposals.push(material);
    const label = host.querySelector<HTMLElement>(`[data-edge-index="${index}"]`);
    return [{ edge, material, tubeMaterial, packet, curve, arrow, label, phase: index * 0.13 }];
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
  let playback: Readonly<{ from: string; to: string; progress: number }> | null = null;
  const activityGeometry = new THREE.TorusGeometry(1, 0.025, 6, 48);
  const activityMaterial = new THREE.MeshBasicMaterial({ color: 0xe6aa7a, transparent: true, opacity: 0.8 });
  const activityRing = new THREE.Mesh(activityGeometry, activityMaterial);
  activityRing.rotation.x = Math.PI / 2;
  assembly.add(activityRing);
  geometryDisposals.push(activityGeometry);
  materialDisposals.push(activityMaterial);
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
    if (time !== undefined && motion) {
      if (previousTime) elapsed += Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
    }
    nodes.forEach(({ node, model, label, labelHeight }, index) => {
      const participating = playback ? node.id === playback.from || node.id === playback.to : !!flow?.has(node.id);
      model.setHighlighted(node.id === highlighted || participating);
      // Preserve internal transforms on pause; animate(false) resets models.
      if (motion) model.animate(elapsed + index * 0.53, true);
      if (!label) return;
      // Labels are captions beneath each model; they never replace its geometry.
      const overhead = node.emphasis === "primary" || node.model === "service" || (node.model === "package" && node.emphasis === "secondary");
      const placement = overhead ? "above" : "below";
      if (label.dataset.placement !== placement) label.dataset.placement = placement;
      projected.set(node.position[0], overhead ? labelHeight : node.position[1] + 0.04, node.position[2] + (overhead ? 0 : node.scale * 1.1)).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
      label.style.zIndex = String(Math.round((1 - projected.z) * 1000));
    });
    activityRing.visible = !!playback;
    if (playback) {
      const target = byId.get(playback.progress < 0.68 ? playback.from : playback.to)?.node;
      if (target) {
        activityRing.position.set(target.position[0], target.position[1] + 0.08, target.position[2]);
        activityRing.scale.setScalar(target.scale * (0.94 + Math.sin(playback.progress * Math.PI * 4) * 0.06));
      }
    }
    boundaries.forEach(({ boundary, label }) => {
      if (!label) return;
      projected.set(boundary.position[0], boundary.position[1] - 0.15, boundary.position[2] + boundary.size[1] / 2 + 0.22).project(camera);
      label.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
    });
    const shownLabels = new Set<string>();
    edges.forEach(({ edge, material, tubeMaterial, packet, curve, phase, arrow, label }) => {
      const forward = playback?.from === edge.from && playback.to === edge.to;
      const reverse = playback?.from === edge.to && playback.to === edge.from;
      // Opposite architecture edges may share endpoints. Use the exact direction
      // when it exists, otherwise reuse the reverse route for its response.
      const exactExists = playback && architecture.edges.some((entry) => entry.from === playback?.from && entry.to === playback?.to);
      const currentRoute = !!forward || (!!reverse && !exactExists);
      const focus = playback ? currentRoute : highlighted ? edge.from === highlighted || edge.to === highlighted : !!flow && flow.has(edge.from) && flow.has(edge.to);
      const dim = (playback || highlighted || flow) && !focus;
      material.color.copy(focus ? routeActive : routeNeutral);
      material.opacity = dim ? 0.14 : focus ? 1 : 0.7;
      tubeMaterial.color.copy(material.color);
      tubeMaterial.opacity = dim ? 0.15 : focus ? 0.9 : 0.6;
      const backwards = !!playback && !!reverse && !forward;
      const arrowAt = backwards ? 0.17 : 0.83;
      arrow.position.copy(curve.getPoint(arrowAt));
      arrow.setDirection(curve.getTangent(arrowAt).normalize().multiplyScalar(backwards ? -1 : 1));
      arrow.setColor(focus ? 0xd9a17b : 0x81949c);
      arrow.visible = !dim;
      packet.visible = playback ? currentRoute : motion && !dim && !edge.planned;
      const travel = playback ? Math.min(playback.progress / 0.68, 1) : (elapsed * 0.16 + phase) % 1;
      packet.scale.setScalar(playback ? 2.6 : 1);
      packet.position.copy(curve.getPoint(backwards ? 1 - travel : travel));
      if (label) {
        label.hidden = !!playback || !highlighted || !focus || compact || shownLabels.has(edge.label);
        if (!label.hidden) shownLabels.add(edge.label);
        projected.copy(curve.getPoint(0.52)).project(camera);
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
    setPlayback(step) { playback = step; if (canvas.dataset.animating !== "true") render(); },
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
      nodes.forEach(({ model }) => model.dispose());
      edges.forEach(({ arrow }) => arrow.dispose());
      geometryDisposals.forEach((geometry) => geometry.dispose());
      materialDisposals.forEach((material) => material.dispose());
      scene.environment = null;
      environmentTarget?.dispose();
      light.shadow.dispose();
      renderer.dispose();
    },
  };
}
