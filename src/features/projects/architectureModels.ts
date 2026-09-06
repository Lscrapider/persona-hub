import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

import type { ArchitectureNode } from "./projectArchitecture";

export type ModelActivity = "idle" | "transfer" | "compute" | "scan" | "read" | "write" | "generate";

export type ArchitectureModel = Readonly<{
  group: THREE.Group;
  setHighlighted: (active: boolean) => void;
  setActivity: (activity: ModelActivity, strength?: number) => void;
  /** Advance local phases without changing the fixed architecture root. Zero delta applies a sought activity immediately. */
  advance: (deltaSeconds: number) => void;
  /** Elapsed time in seconds. Disabling animation restores a fixed pose. */
  animate: (time: number, enabled: boolean) => void;
  dispose: () => void;
}>;

type Finish = "shell" | "shadow" | "metal" | "copper" | "screen" | "paper";
type Point = readonly [number, number, number];
type Shape = "box" | "cylinder" | "sphere" | "ring" | "arc";

// Original procedural geometry; RoundedBoxGeometry is the official Three.js MIT addon.
// Fixed Y-up roots keep the architecture and captions still while mechanisms operate.
export function createArchitectureModel(kind: ArchitectureNode["model"]): ArchitectureModel {
  const group = new THREE.Group();
  group.name = `architecture-model-${kind}`;
  const geometries = new Map<string, THREE.BufferGeometry>();
  const animatedParts: Array<(time: number) => void> = [];
  const ownedEffectMaterials: THREE.MeshStandardMaterial[] = [];
  const weights: Record<ModelActivity, number> = { idle: 0, transfer: 0, compute: 0, scan: 0, read: 0, write: 0, generate: 0 };
  let targetActivity: ModelActivity = "idle";
  let targetStrength = 0;
  let localTime = 0;
  let rotorTime = 0;
  let frameRotorTime = 0;
  const energy = () => Math.min(1, weights.transfer + weights.compute + weights.scan + weights.read + weights.write + weights.generate);
  const amplitude = () => 0.24 + energy() * 0.76;

  const palette: Record<Finish, readonly [base: string, selected: string, metalness: number, roughness: number]> = {
    shell: ["#536160", "#74817a", 0.58, 0.34],
    shadow: ["#232d2e", "#354342", 0.36, 0.46],
    metal: ["#a6b5b0", "#c4cfc2", 0.78, 0.26],
    copper: ["#b9855c", "#dcad77", 0.66, 0.28],
    screen: ["#233f43", "#375c5e", 0.3, 0.24],
    paper: ["#b5b8a9", "#d0d1bd", 0.16, 0.6],
  };
  const materials = Object.fromEntries(Object.entries(palette).map(([finish, [color, , metalness, roughness]]) => [
    finish, new THREE.MeshStandardMaterial({ color, roughness, metalness,
      emissive: finish === "copper" ? "#8b4924" : finish === "screen" ? "#204b4e" : "#000000",
      emissiveIntensity: finish === "copper" ? 0.13 : 0.16,
    }),
  ])) as Record<Finish, THREE.MeshStandardMaterial>;

  // Indicator materials are owned independently: activity never brightens an entire housing.
  function indicator(mesh: THREE.Mesh, modes?: readonly ModelActivity[]) {
    const material = materials.copper.clone();
    material.transparent = true;
    material.depthWrite = false;
    mesh.material = material;
    ownedEffectMaterials.push(material);
    animatedParts.push((time) => {
      const strength = modes ? Math.min(1, modes.reduce((sum, mode) => sum + weights[mode], 0)) : energy();
      material.opacity = 0.22 + strength * 0.78;
      material.emissiveIntensity = 0.04 + strength * (0.28 + (Math.sin(time * 3) + 1) * 0.08);
    });
  }
  function geometry(name: Shape) {
    const existing = geometries.get(name);
    if (existing) return existing;
    const created = name === "box" ? new THREE.BoxGeometry(1, 1, 1)
      : name === "cylinder" ? new THREE.CylinderGeometry(1, 1, 1, 32)
        : name === "sphere" ? new THREE.SphereGeometry(1, 20, 12)
          : new THREE.TorusGeometry(1, name === "arc" ? 0.065 : 0.045, 6, 40, name === "arc" ? Math.PI * 1.35 : Math.PI * 2);
    geometries.set(name, created);
    return created;
  }
  function part(shape: Shape, size: Point, position: Point, finish: Finish = "shell", parent = group) {
    const mesh = new THREE.Mesh(geometry(shape), materials[finish]);
    mesh.scale.set(...size);
    mesh.position.set(...position);
    // Tiny screws, vents and indicator strips do not need separate shadow draws.
    mesh.castShadow = Math.max(...size) > 0.3 && Math.min(...size) > 0.04;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function box(size: Point, position: Point, finish: Finish = "shell", parent = group) {
    return part("box", size, position, finish, parent);
  }
  function housing(size: Point, position: Point, finish: Finish = "shell", parent = group, radius = 0.035) {
    const bevel = Math.min(radius, Math.min(...size) * 0.3);
    const key = `rounded:${size.join(":")}:${bevel}`;
    let buffer = geometries.get(key);
    if (!buffer) {
      buffer = new RoundedBoxGeometry(...size, 2, bevel);
      geometries.set(key, buffer);
    }
    const mesh = new THREE.Mesh(buffer, materials[finish]);
    mesh.position.set(...position);
    mesh.castShadow = Math.max(...size) > 0.3 && Math.min(...size) > 0.04;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(radius: number, height: number, position: Point, finish: Finish = "shell", parent = group) {
    return part("cylinder", [radius, height, radius], position, finish, parent);
  }
  function strut(from: Point, to: Point, radius = 0.025, finish: Finish = "metal") {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const vector = end.clone().sub(start);
    const mesh = cylinder(radius, vector.length(), [0, 0, 0], finish);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
  }
  function pedestal(width = 1.55, depth = 1.15) {
    housing([width, 0.12, depth], [0, 0.06, 0], "shadow");
    housing([width - 0.08, 0.045, depth - 0.08], [0, 0.1425, 0], "metal");
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      cylinder(0.028, 0.009, [x * (width / 2 - 0.14), 0.17, z * (depth / 2 - 0.14)], "shadow");
    }
  }
  // Open asymmetric rotors make rotation visible even at architecture scale.
  function rotor(position: Point, radius: number, speed: number, phase = 0, parent = group) {
    const mount = new THREE.Group();
    mount.position.set(...position);
    parent.add(mount);
    part("ring", [radius, radius, radius], [0, 0, 0], "metal", mount);
    const wheel = new THREE.Group();
    mount.add(wheel);
    const hub = cylinder(radius * 0.22, 0.055, [0, 0, 0.018], "copper", wheel);
    hub.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i += 1) {
      const a = i * Math.PI * 2 / 5;
      const blade = box([radius * 0.67, radius * 0.24, 0.026], [Math.cos(a) * radius * 0.48, Math.sin(a) * radius * 0.48, 0], i === 0 ? "copper" : "shell", wheel);
      blade.rotation.z = a + 0.45;
    }
    animatedParts.push(() => { wheel.rotation.z = phase + frameRotorTime * speed; });
    return mount;
  }
  function frontScrews(width: number, height: number, center: Point, parent = group) {
    for (const x of [-1, 1]) for (const y of [-1, 1]) {
      const screw = cylinder(0.015, 0.009, [center[0] + x * width / 2, center[1] + y * height / 2, center[2]], "metal", parent);
      screw.rotation.x = Math.PI / 2;
    }
  }

  function client() {
    housing([0.78, 0.10, 0.57], [0, 0.05, 0.03], "shadow");
    housing([0.68, 0.025, 0.47], [0, 0.1125, 0.03], "metal");
    housing([0.18, 0.48, 0.18], [0, 0.34, -0.05], "metal");
    housing([1.70, 1.07, 0.19], [0, 1.08, 0], "metal");
    housing([1.61, 0.98, 0.045], [0, 1.08, 0.111], "shadow");
    housing([1.49, 0.85, 0.02], [0, 1.10, 0.144], "screen");
    box([0.25, 0.67, 0.016], [-0.56, 1.10, 0.161], "shadow");
    for (let i = 0; i < 4; i += 1) box([0.14, 0.024, 0.015], [-0.56, 1.35 - i * 0.14, 0.175], i === 0 ? "copper" : "metal");
    box([0.76, 0.055, 0.018], [0.1, 1.38, 0.161], "paper");
    box([0.48, 0.025, 0.018], [-0.04, 1.25, 0.161], "metal");
    for (let i = 0; i < 5; i += 1) {
      const bar = box([0.11, 0.24, 0.02], [-0.25 + i * 0.19, 0.92, 0.171], i === 3 ? "copper" : "metal");
      animatedParts.push((time) => {
        const height = 0.12 + (1 + Math.sin(time * 1.5 + i * 1.2)) * 0.12 * amplitude();
        bar.scale.y = height; bar.position.y = 0.79 + height / 2;
      });
    }
    const scan = box([0.88, 0.012, 0.013], [0.1, 0.8, 0.187], "copper");
    indicator(scan);
    animatedParts.push((time) => { scan.position.y = 0.81 + (time * 0.16 % 0.40); });
    part("sphere", [0.022, 0.022, 0.01], [0, 1.572, 0.109], "shadow");
    housing([1.05, 0.07, 0.36], [0, 0.035, 0.49], "shell");
    for (let row = 0; row < 3; row += 1) for (let col = 0; col < 6; col += 1) {
      box([0.12, 0.012, 0.052], [-0.37 + col * 0.15, 0.078, 0.39 + row * 0.10], "metal");
    }
  }
  function mobile() {
    housing([0.80, 0.10, 0.67], [0, 0.05, 0], "shadow");
    housing([0.68, 1.65, 0.17], [0, 0.95, 0], "metal", group, 0.065);
    housing([0.60, 1.57, 0.04], [0, 0.95, 0.102], "shadow");
    housing([0.52, 1.34, 0.018], [0, 0.95, 0.132], "screen");
    housing([0.18, 0.035, 0.02], [0, 1.69, 0.14], "shadow");
    box([0.18, 0.022, 0.02], [0, 0.21, 0.14], "paper");
    box([0.32, 0.038, 0.018], [-0.04, 1.49, 0.15], "paper");
    for (let i = 0; i < 4; i += 1) {
      box([0.42, 0.012, 0.012], [0, 0.62 + i * 0.18, 0.151], "shell");
      box([0.012, 0.65, 0.012], [-0.18 + i * 0.12, 0.95, 0.151], "shell");
    }
    const path = box([0.032, 0.60, 0.014], [0.04, 0.97, 0.17], "copper");
    path.rotation.z = -0.35;
    const pin = part("sphere", [0.05, 0.05, 0.019], [0, 1, 0.20], "paper");
    animatedParts.push((time) => { const p = (time * 0.3) % 1; pin.position.set(-0.057 + p * 0.194, 0.688 + p * 0.564, 0.20); });
    const scan = box([0.44, 0.014, 0.012], [0, 0.7, 0.186], "copper");
    indicator(scan);
    animatedParts.push((time) => { scan.position.y = 0.65 + time * 0.18 % 0.63; });
    housing([0.39, 0.12, 0.022], [0, 0.44, 0.158], "shell");
    box([0.25, 0.025, 0.014], [0, 0.44, 0.177], "paper");
    box([0.034, 0.15, 0.085], [0.357, 1.2, 0], "copper");
  }
  function service() {
    pedestal(1.32, 1.16);
    housing([0.08, 1.48, 0.93], [-0.56, 0.94, -0.035]);
    housing([0.08, 1.48, 0.93], [0.56, 0.94, -0.035]);
    housing([1.16, 1.48, 0.065], [0, 0.94, -0.49], "shadow");
    housing([1.24, 0.08, 1.04], [0, 1.72, 0], "metal");
    for (let level = 0; level < 3; level += 1) {
      const y = 0.43 + level * 0.46;
      housing([1.02, 0.36, 0.82], [0, y, -0.015], "shadow");
      housing([0.94, 0.31, 0.07], [0, y, 0.43]);
      rotor([-0.25, y, 0.478], 0.128, 2.1 + level * 0.4, level);
      for (let i = 0; i < 3; i += 1) box([0.29, 0.018, 0.018], [0.14, y + 0.07 - i * 0.06, 0.476], "shadow");
      const activity = box([0.041, 0.033, 0.022], [0.35, y, 0.484], "copper");
      indicator(activity, ["compute", "generate", "read", "write"]);
      animatedParts.push((time) => { activity.position.y = y + Math.sin(time * 2.2 + level * 2) * 0.075 * amplitude(); });
      frontScrews(0.84, 0.24, [0, y, 0.478]);
    }
    for (const x of [-0.515, 0.515]) box([0.032, 1.46, 0.036], [x, 0.94, 0.49], "metal");
    for (let i = 0; i < 5; i += 1) box([0.045, 0.012, 0.53], [-0.22 + i * 0.11, 1.765, -0.04], "shadow");
  }
  function workers() {
    pedestal();
    const positions: Point[] = [[-0.45, 0.56, 0.28], [0.45, 0.56, 0.28], [0, 1.17, -0.22]];
    positions.forEach(([x, y, z], i) => {
      const socket = housing([0.58, 0.52, 0.58], [x, y, z], "shell");
      socket.name = `worker-${i}`;
      housing([0.52, 0.07, 0.53], [x, y - 0.25, z], "shadow");
      for (let fin = 0; fin < 4; fin += 1) box([0.43, 0.045, 0.028], [x, y + 0.285, z - 0.15 + fin * 0.10], "metal");
      const face = cylinder(0.22, 0.021, [x, y, z + 0.303], "shadow");
      face.rotation.x = Math.PI / 2;
      rotor([x, y, z + 0.326], 0.207, 1.25 + i * 0.5, i * 0.7);
      const core = box([0.085, 0.085, 0.05], [x, y, z + 0.385], "copper");
      indicator(core, ["compute", "generate"]);
      animatedParts.push((time) => { core.rotation.z = frameRotorTime * -0.8 + i; core.position.z = z + 0.385 + Math.sin(time * 1.7 + i) * 0.025 * amplitude(); });
      for (const side of [-1, 1]) box([0.019, 0.22, 0.25], [x + side * 0.294, y, z], "shadow");
      frontScrews(0.49, 0.43, [x, y, z + 0.30]);
    });
    strut([-0.45, 0.7, 0.05], [0, 1.17, -0.22], 0.045);
    strut([0.45, 0.7, 0.05], [0, 1.17, -0.22], 0.045);
    housing([0.07, 0.55, 0.07], [0, 0.43, -0.22], "metal");
    // OCR presents a small document over the front processing socket; only scan activity reveals it.
    const document = new THREE.Group();
    document.name = "worker-ocr-document";
    document.position.set(0.45, 0.56, 0.66);
    group.add(document);
    const page = box([0.36, 0.37, 0.008], [0, 0, 0], "paper", document);
    const rows = Array.from({ length: 4 }, (_, row) =>
      box([0.24 - row % 2 * 0.045, 0.013, 0.009], [-0.018, 0.11 - row * 0.069, 0.009], "shadow", document));
    const sweep = box([0.32, 0.018, 0.012], [0, 0, 0.021], "copper", document);
    const scanMaterials = [page, ...rows, sweep].map((mesh) => {
      const material = (mesh.material as THREE.MeshStandardMaterial).clone();
      material.transparent = true;
      material.depthWrite = false;
      material.opacity = 0;
      mesh.material = material;
      mesh.castShadow = false;
      ownedEffectMaterials.push(material);
      return material;
    });
    animatedParts.push((time) => {
      const strength = weights.scan;
      document.visible = strength > 0.005;
      for (const material of scanMaterials) material.opacity = strength * 0.94;
      sweep.position.y = Math.sin(time * 2.7) * 0.145;
      scanMaterials[scanMaterials.length - 1]!.emissiveIntensity = strength * 0.55;
    });
  }
  function queue() {
    pedestal(1.76, 1.0);
    housing([1.61, 0.12, 0.7], [0, 0.36, 0], "shadow");
    for (const z of [-0.40, 0.40]) {
      housing([1.70, 0.08, 0.08], [0, 0.48, z], "metal");
      for (const x of [-0.68, 0.68]) box([0.09, 0.3, 0.08], [x, 0.29, z], "shell");
    }
    for (let i = 0; i < 9; i += 1) {
      const roller = new THREE.Group(); group.add(roller); roller.position.set(-0.68 + i * 0.17, 0.45, 0);
      const barrel = cylinder(0.065, 0.67, [0, 0, 0], "metal", roller); barrel.rotation.x = Math.PI / 2;
      box([0.026, 0.012, 0.64], [0, 0.064, 0], "shadow", roller);
      animatedParts.push((time) => { roller.rotation.z = -time * 1.4; });
    }
    for (let i = 0; i < 3; i += 1) {
      const packet = new THREE.Group(); group.add(packet);
      housing([0.27, 0.24, 0.41], [0, 0.66, 0], i === 1 ? "copper" : "shell", packet);
      box([0.19, 0.017, 0.26], [0, 0.789, 0], "paper", packet);
      box([0.10, 0.018, 0.07], [0, 0.802, 0.035], "shadow", packet);
      animatedParts.push((time) => { packet.position.x = ((i * 0.52 + time * 0.24) % 1.56) - 0.78; });
    }
    for (const z of [-0.44, 0.44]) housing([0.10, 0.94, 0.10], [0.62, 0.64, z], "metal");
    housing([0.10, 0.08, 0.98], [0.62, 1.15, 0], "metal");
    const scanner = box([0.016, 0.045, 0.58], [0.62, 1.08, 0], "copper");
    indicator(scanner);
    animatedParts.push((time) => { scanner.position.y = 0.83 + (1 + Math.sin(time * 2)) * 0.10; });
  }
  function database() {
    cylinder(0.67, 0.11, [0, 0.055, 0], "shadow");
    for (let layer = 0; layer < 3; layer += 1) {
      const y = 0.35 + layer * 0.46;
      cylinder(0.58, 0.32, [0, y, 0], "shell");
      cylinder(0.615, 0.045, [0, y + 0.17, 0], "metal");
      cylinder(0.60, 0.036, [0, y - 0.18, 0], "shadow");
      const orbit = new THREE.Group(); orbit.position.y = y + 0.095; group.add(orbit);
      const arc = part("arc", [0.595, 0.595, 0.595], [0, 0, 0], "copper", orbit); arc.rotation.x = Math.PI / 2;
      indicator(arc, ["read"]);
      part("sphere", [0.037, 0.025, 0.037], [0.595, 0, 0], "paper", orbit);
      animatedParts.push((time) => { orbit.rotation.y = time * (0.65 + layer * 0.2) + layer * 1.8; });
      for (let i = 0; i < 3; i += 1) {
        const cell = box([0.055, 0.035, 0.022], [-0.1 + i * 0.10, y - 0.045, 0.578], "copper");
        indicator(cell, ["write"]);
        const material = cell.material as THREE.MeshStandardMaterial;
        animatedParts.push((time) => {
          const beat = Math.pow((Math.sin(time * 5 - layer * 1.3 - i * 0.8) + 1) / 2, 3);
          material.opacity = 0.15 + weights.write * (0.25 + beat * 0.60);
          cell.scale.z = 0.022 + weights.write * beat * 0.026;
        });
      }
    }
    cylinder(0.47, 0.025, [0, 1.482, 0], "shadow");
    const head = new THREE.Group(); head.position.y = 1.51; group.add(head);
    const arc = part("arc", [0.32, 0.32, 0.32], [0, 0, 0], "metal", head); arc.rotation.x = Math.PI / 2;
    box([0.30, 0.025, 0.045], [0.15, 0, 0], "copper", head);
    cylinder(0.07, 0.035, [0, 0, 0], "metal", head);
    animatedParts.push((time) => { head.rotation.y = time * -0.75; });
  }
  function cache() {
    pedestal(1.45, 1.40);
    housing([1.20, 0.14, 1.20], [0, 0.27, 0], "screen");
    housing([0.80, 0.24, 0.80], [0, 0.46, 0], "shadow");
    housing([0.65, 0.075, 0.65], [0, 0.62, 0], "metal");
    for (let i = 0; i < 5; i += 1) {
      const p = -0.43 + i * 0.215;
      box([0.075, 0.08, 0.25], [p, 0.39, 0.48], "metal");
      box([0.075, 0.08, 0.25], [p, 0.39, -0.48], "metal");
      box([0.25, 0.08, 0.075], [0.48, 0.39, p], "metal");
      box([0.25, 0.08, 0.075], [-0.48, 0.39, p], "metal");
    }
    for (let i = 0; i < 4; i += 1) {
      const cell = box([0.10, 0.035, 0.37], [-0.2 + i * 0.13, 0.68, 0], "copper");
      indicator(cell);
      animatedParts.push((time) => { cell.scale.y = 0.025 + (1 + Math.sin(time * 2.5 - i * 0.8)) * 0.065 * amplitude(); cell.position.y = 0.66 + cell.scale.y / 2; });
    }
    for (const side of [-1, 1]) {
      const signal = box([0.07, 0.019, 0.17], [0, 0.445, side * 0.49], "copper");
      indicator(signal);
      animatedParts.push((time) => { signal.position.x = Math.sin(time * 1.9 + side) * 0.43; });
    }
  }
  function storage() {
    pedestal(1.57, 1.38);
    const positions: Point[] = [[-0.35, 0.45, 0.32], [0.35, 0.45, 0.32], [-0.35, 0.45, -0.36], [0.35, 0.45, -0.36], [-0.35, 1.04, -0.36], [0.35, 1.04, -0.36]];
    positions.forEach(([x, y, z], i) => {
      housing([0.59, 0.53, 0.59], [x, y, z], "shell");
      box([0.43, 0.035, 0.53], [x, y + 0.28, z], "metal");
      housing([0.39, 0.21, 0.025], [x, y + 0.005, z + 0.301], "shadow");
      box([0.22, 0.045, 0.025], [x - 0.03, y + 0.04, z + 0.325], "paper");
      const led = box([0.055, 0.032, 0.018], [x - 0.13, y - 0.06, z + 0.327], "copper");
      indicator(led, ["read", "write"]);
      animatedParts.push((time) => { led.position.x = x + Math.sin(time * 1.8 - i * 0.75) * 0.13; });
      for (const side of [-1, 1]) box([0.024, 0.43, 0.03], [x + side * 0.26, y, z + 0.3], "metal");
    });
    const scanner = box([1.23, 0.027, 0.021], [0, 0.4, 0.65], "copper");
    indicator(scanner);
    animatedParts.push((time) => { scanner.position.y = 0.26 + (1 + Math.sin(time * 1.2)) * 0.21; });
  }
  function external() {
    pedestal(1.55, 1.27);
    const hub: Point = [0, 0.95, 0];
    cylinder(0.09, 0.67, [0, 0.49, 0], "metal");
    part("sphere", [0.29, 0.29, 0.29], hub, "shadow");
    const gyro = new THREE.Group(); gyro.position.set(...hub); group.add(gyro);
    part("ring", [0.40, 0.40, 0.40], [0, 0, 0], "copper", gyro);
    part("sphere", [0.07, 0.07, 0.07], [0.40, 0, 0], "paper", gyro);
    const inner = rotor([0, 0, 0.30], 0.20, -1.3, 0, gyro);
    inner.rotation.y = 0.4;
    animatedParts.push((time) => { gyro.rotation.set(Math.PI / 3, time * 0.4, time * 0.25); });
    const satellites: Point[] = [[-0.57, 0.64, 0.30], [0.57, 0.66, 0.30], [-0.42, 1.42, -0.25], [0.49, 1.36, -0.29]];
    satellites.forEach((position, i) => {
      strut(hub, position, 0.032, "metal");
      const satellite = housing([0.27, 0.27, 0.27], position, i === 1 ? "copper" : "shell");
      const crown = part("ring", [0.16, 0.16, 0.16], position, "metal");
      animatedParts.push((time) => { satellite.rotation.y = time * 0.35 + i; crown.rotation.set(time * 0.3 + i, time * -0.4, 0); });
    });
  }
  function packageModel() {
    pedestal(1.5, 1.25);
    housing([1.12, 0.12, 0.88], [0, 0.23, 0], "shadow");
    for (const x of [-0.52, 0.52]) housing([0.08, 0.60, 0.88], [x, 0.56, 0], "shell");
    for (const z of [-0.40, 0.40]) housing([1.02, 0.60, 0.08], [0, 0.56, z], "shell");
    box([0.12, 0.59, 0.035], [0, 0.55, 0.461], "copper");
    box([0.27, 0.13, 0.024], [-0.27, 0.57, 0.451], "paper");
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(side * 0.52, 0.87, 0); group.add(hinge);
      housing([0.42, 0.035, 0.81], [side * 0.21, 0, 0], "metal", hinge);
      box([0.33, 0.008, 0.026], [side * 0.21, 0.025, 0.31], "copper", hinge);
      animatedParts.push((time) => { hinge.rotation.z = side * (0.65 + Math.sin(time * 1.15 + side * 0.6) * 0.12 * amplitude()); });
    }
    for (let i = 0; i < 3; i += 1) {
      const sheet = new THREE.Group(); group.add(sheet);
      housing([0.54, 0.055, 0.48], [0, 0, 0], i === 1 ? "copper" : "paper", sheet);
      for (let line = 0; line < 3; line += 1) box([0.30 - line * 0.045, 0.011, 0.019], [-0.03, 0.035, -0.1 + line * 0.08], "shadow", sheet);
      animatedParts.push((time) => { sheet.position.set(0, 0.89 + i * 0.16 + Math.sin(time * 1.35 - i * 0.8) * 0.055 * amplitude(), -0.02); sheet.rotation.set(0.08, -0.20 + i * 0.17 + Math.sin(time * 0.6) * 0.08 * amplitude(), 0); });
    }
  }
  function repository() {
    pedestal(1.55, 1.28);
    for (let layer = 0; layer < 4; layer += 1) {
      const stack = new THREE.Group(); group.add(stack);
      const y = 0.32 + layer * 0.275;
      housing([1.16, 0.16, 0.89], [0, 0, 0], "paper", stack);
      housing([1.25, 0.035, 0.97], [0, 0.10, 0], "shell", stack);
      housing([1.25, 0.035, 0.97], [0, -0.10, 0], "shell", stack);
      housing([0.12, 0.235, 0.97], [-0.57, 0, 0], layer === 3 ? "copper" : "metal", stack);
      for (let line = 0; line < 3; line += 1) box([0.86, 0.008, 0.013], [0.07, -0.045 + line * 0.043, 0.45], "shell", stack);
      box([0.18, 0.03, 0.12], [0.26, 0.105, 0.49], "copper", stack);
      animatedParts.push((time) => { stack.position.set((layer % 2 === 0 ? -0.045 : 0.045) + Math.sin(time * 1.05 - layer * 0.9) * 0.065 * amplitude(), y, 0); });
    }
    const top = 1.29;
    strut([-0.18, top, -0.27], [-0.18, top, 0.26], 0.018, "copper");
    strut([-0.18, top, 0.06], [0.19, top, -0.15], 0.018, "copper");
    for (const [x, z] of [[-0.18, -0.27], [-0.18, 0.26], [0.19, -0.15]]) cylinder(0.045, 0.025, [x!, top, z!], "metal");
    const commit = part("sphere", [0.038, 0.025, 0.038], [-0.18, top + 0.03, 0], "paper");
    animatedParts.push((time) => { commit.position.z = -0.27 + time * 0.19 % 0.53; });
  }

  switch (kind) {
    case "client": client(); break;
    case "mobile": mobile(); break;
    case "service": service(); break;
    case "workers": workers(); break;
    case "queue": queue(); break;
    case "database": database(); break;
    case "cache": cache(); break;
    case "storage": storage(); break;
    case "external": external(); break;
    case "package": packageModel(); break;
    case "repository": repository(); break;
  }
  let meshCount = 0;
  group.traverse((object) => { if (object instanceof THREE.Mesh) meshCount += 1; });
  group.userData.detailMeshCount = meshCount;
  group.userData.animatedPartCount = animatedParts.length;
  let highlighted = false;
  let disposed = false;
  function animate(time: number, enabled: boolean) {
    if (disposed) return;
    const frameTime = enabled && Number.isFinite(time) ? time : 0;
    frameRotorTime = frameTime;
    for (const update of animatedParts) update(frameTime);
  }
  animate(0, false);
  return {
    group,
    setHighlighted(active) {
      if (disposed || active === highlighted) return;
      highlighted = active;
      for (const finish of Object.keys(materials) as Finish[]) materials[finish].color.set(palette[finish][active ? 1 : 0]);
      materials.copper.emissiveIntensity = active ? 0.29 : 0.13;
      materials.screen.emissiveIntensity = active ? 0.27 : 0.16;
    },
    setActivity(activity, strength = 1) {
      if (disposed) return;
      targetActivity = activity;
      targetStrength = activity === "idle" ? 0 : THREE.MathUtils.clamp(Number.isFinite(strength) ? strength : 0, 0, 1);
    },
    advance(deltaSeconds) {
      if (disposed || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
      const dt = Math.min(deltaSeconds, 0.1);
      // Exponential blending is frame-rate independent; a zero-delta seek updates the effect without moving parts.
      const blend = dt === 0 ? 1 : 1 - Math.exp(-dt * 9);
      for (const mode of Object.keys(weights) as ModelActivity[]) {
        const target = mode === targetActivity ? targetStrength : 0;
        weights[mode] += (target - weights[mode]) * blend;
      }
      localTime += dt * (0.22 + energy() * 1.04);
      const computation = Math.min(1, weights.compute + weights.generate);
      rotorTime += dt * (0.22 + computation * 1.12 + weights.transfer * 0.35 + weights.read * 0.45 + weights.write * 0.50);
      frameRotorTime = rotorTime;
      for (const update of animatedParts) update(localTime);
      group.userData.activity = targetActivity;
      group.userData.activityStrength = energy();
    },
    animate,
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      group.clear();
      for (const buffer of geometries.values()) buffer.dispose();
      for (const material of Object.values(materials)) material.dispose();
      for (const material of ownedEffectMaterials) material.dispose();
      ownedEffectMaterials.length = 0;
      geometries.clear();
      animatedParts.length = 0;
    },
  };
}
