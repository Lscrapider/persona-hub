import * as THREE from "three";

import type { ArchitectureEdge, ArchitectureNode, ProjectArchitecture } from "./projectArchitecture";

type Axis = "x" | "y" | "z";
type Move = Partial<Record<Axis, number>>;
type Port = "left" | "right" | "front" | "back";

/** Base-side ports leave the model's mechanism and caption unobstructed. */
function port(node: ArchitectureNode, side: Port) {
  const point = new THREE.Vector3(...node.position);
  point.y += node.scale * 0.18;
  if (side === "left" || side === "right") point.x += (side === "left" ? -1 : 1) * (node.scale * 0.98 + 0.1);
  else point.z += (side === "back" ? -1 : 1) * (node.scale * 0.82 + 0.1);
  return point;
}

/** Successive axis moves describe cable trays, with no diagonal shortcuts. */
function roundedRoute(start: THREE.Vector3, moves: readonly Move[]) {
  const points = [start.clone()];
  let current = start.clone();
  for (const move of moves) {
    for (const axis of Object.keys(move) as Axis[]) {
      const value = move[axis];
      if (value === undefined || Math.abs(value - current[axis]) < 0.0001) continue;
      current = current.clone();
      current[axis] = value;
      points.push(current);
    }
  }
  // Merge consecutive straight segments before filleting; this also keeps the
  // number of curve pieces and their arc-length lookup tables modest.
  for (let index = points.length - 2; index > 0; index -= 1) {
    const incoming = points[index]!.clone().sub(points[index - 1]!).normalize();
    const outgoing = points[index + 1]!.clone().sub(points[index]!).normalize();
    if (incoming.dot(outgoing) > 0.9999) points.splice(index, 1);
  }
  const path = new THREE.CurvePath<THREE.Vector3>();
  let cursor = start;
  for (let index = 1; index < points.length - 1; index += 1) {
    const corner = points[index]!;
    const incoming = corner.clone().sub(points[index - 1]!);
    const outgoing = points[index + 1]!.clone().sub(corner);
    const radius = Math.min(0.22, incoming.length() * 0.35, outgoing.length() * 0.35);
    const before = corner.clone().addScaledVector(incoming.normalize(), -radius);
    const after = corner.clone().addScaledVector(outgoing.normalize(), radius);
    if (cursor.distanceToSquared(before) > 0.000001) path.add(new THREE.LineCurve3(cursor, before));
    path.add(new THREE.QuadraticBezierCurve3(before, corner, after));
    cursor = after;
  }
  const end = points[points.length - 1]!;
  if (cursor.distanceToSquared(end) > 0.000001) path.add(new THREE.LineCurve3(cursor, end));
  // A degenerate relationship is still finite and sampleable by the renderer.
  if (!path.curves.length) path.add(new THREE.LineCurve3(start.clone(), start.clone().add(new THREE.Vector3(0.001, 0, 0))));
  path.arcLengthDivisions = 512;
  return path;
}

/**
 * Logical architecture cable routing, authored against stable module identities.
 * Front trays serve requests/data access; rear trays serve indexing or offline
 * work. Risers sit beyond platform rims rather than drilling through a model.
 * Returning along a relationship intentionally reuses its physical route.
 */
export function createArchitectureRoute(
  architecture: ProjectArchitecture,
  edge: ArchitectureEdge,
  index: number,
): THREE.Curve<THREE.Vector3> {
  const from = architecture.nodes.find((node) => node.id === edge.from);
  const to = architecture.nodes.find((node) => node.id === edge.to);
  if (!from || !to) return new THREE.LineCurve3(new THREE.Vector3(), new THREE.Vector3(0.001, 0, 0));
  const key = `${edge.from}:${edge.to}`;
  const groupEdge = (id: string, side: Port, fallback: number) => {
    const group = architecture.groups.find((candidate) => candidate.id === id);
    if (!group) return fallback;
    const axis = side === "left" || side === "right" ? 0 : 2;
    const halfSize = group.size[axis === 0 ? 0 : 1] / 2;
    return group.position[axis] + (side === "left" || side === "back" ? -halfSize : halfSize);
  };
  const connect = (startSide: Port, endSide: Port, makeMoves: (start: THREE.Vector3, end: THREE.Vector3) => readonly Move[]) => {
    const start = port(from, startSide);
    const end = port(to, endSide);
    return roundedRoute(start, makeMoves(start, end));
  };

  if (architecture.nodes.some((node) => node.id === "workers")) {
    const front = groupEdge("data", "front", 1.7);
    const gap = (groupEdge("application", "right", -2.1) + groupEdge("intelligence", "left", 0.2)) / 2;
    switch (key) {
      case "client:core":
        return connect("right", "left", (s, e) => [{ x: groupEdge("application", "left", -5.8) - 0.45 }, { y: e.y }, { z: e.z }, { x: e.x }]);
      case "core:queue":
        return connect("front", "left", (s, e) => [{ z: e.z }, { y: e.y }, { x: e.x }]);
      case "queue:workers":
        return connect("back", "front", (s, e) => [{ z: groupEdge("intelligence", "front", 0.9) + 0.55 }, { x: e.x }, { y: e.y }, { z: e.z }]);
      case "workers:core":
        return connect("left", "right", (s, e) => [{ x: gap }, { y: e.y }, { z: e.z }, { x: e.x }]);
      case "core:database":
      case "core:timeseries":
      case "core:storage": {
        const lane = front + 0.4 + ["database", "timeseries", "storage"].indexOf(edge.to) * 0.3;
        return connect("front", "front", (s, e) => [{ z: lane }, { x: e.x }, { y: e.y }, { z: e.z }]);
      }
      case "workers:database":
        return connect("back", "back", (s, e) => [{ z: groupEdge("intelligence", "back", -3) - 0.45 }, { x: e.x }, { y: e.y }, { z: e.z }]);
      case "workers:storage":
        return connect("right", "right", (s, e) => [{ x: groupEdge("intelligence", "right", 5) + 0.45 }, { z: e.z }, { y: e.y }, { x: e.x }]);
      case "workers:models":
        return connect("right", "left", (s, e) => [{ x: (s.x + e.x) / 2 }, { z: e.z }, { y: e.y }, { x: e.x }]);
      case "core:models":
        return connect("back", "back", (s, e) => [{ z: Math.min(groupEdge("intelligence", "back", -3), e.z) - 0.55 }, { x: e.x }, { y: e.y }, { z: e.z }]);
    }
  }

  if (architecture.nodes.some((node) => node.id === "training")) {
    switch (key) {
      case "client:core":
        return connect("right", "left", (s, e) => [{ x: groupEdge("routing", "left", -2.4) - 0.7 }, { y: e.y }, { z: e.z }, { x: e.x }]);
      case "core:database":
      case "core:cache":
        return connect("front", "front", (s, e) => [{ z: groupEdge("data", "front", 2.85) + (edge.to === "database" ? 0.4 : 0.7) }, { x: e.x }, { y: e.y }, { z: e.z }]);
      case "core:models":
        return connect("back", "left", (s, e) => [{ z: e.z }, { x: groupEdge("routing", "right", 2.4) + 1 }, { y: e.y }, { x: e.x }]);
      case "core:maps":
        return connect("right", "left", (s, e) => [{ x: groupEdge("routing", "right", 2.4) + 0.7 }, { z: e.z }, { y: e.y }, { x: e.x }]);
      case "core:training":
        return connect("left", "right", (s, e) => [{ x: groupEdge("routing", "left", -2.4) - 0.7 }, { z: e.z }, { y: e.y }, { x: e.x }]);
      case "training:core":
        return connect("front", "left", (s, e) => [{ z: s.z + 0.45 }, { x: groupEdge("routing", "left", -2.4) - 1.15 }, { y: e.y }, { z: e.z }, { x: e.x }]);
      case "training:models":
        return connect("back", "back", (s, e) => [{ z: groupEdge("offline", "back", -5.4) - 0.5 }, { x: e.x }, { y: e.y }, { z: e.z }]);
    }
  }

  if (architecture.kind === "package") {
    if (key === "repository:skill") {
      return connect("right", "left", (s, e) => [{ x: groupEdge("entry", "left", -1.9) - 1.1 }, { z: e.z }, { y: e.y }, { x: e.x }]);
    }
    if (key === "repository:review") {
      return connect("front", "front", (s, e) => [{ z: Math.max(s.z, groupEdge("review-boundary", "front", 2.9)) + 0.6 }, { x: e.x }, { y: e.y }, { z: e.z }]);
    }
    const referenceIndex = ["java", "python", "android"].indexOf(edge.to);
    if (referenceIndex !== -1 && (edge.from === "skill" || edge.from === "review")) {
      const side: Port = edge.from === "skill" ? "front" : "back";
      const direction = side === "front" ? 1 : -1;
      const lane = groupEdge("references", side, direction * 1.7) + direction * (0.4 + referenceIndex * 0.3);
      return connect(side, side, (s, e) => [{ z: lane }, { x: e.x }, { y: e.y }, { z: e.z }]);
    }
  }

  // Future maps retain a simple perimeter route until explicitly art-directed.
  // Bounds include every platform, preventing a fallback riser cutting a layer.
  const front = Math.max(...architecture.nodes.map((node) => node.position[2] + node.scale), ...architecture.groups.map((group) => group.position[2] + group.size[1] / 2));
  return connect("front", "front", (s, e) => [{ z: front + 0.5 + index * 0.12 }, { x: e.x }, { y: e.y }, { z: e.z }]);
}
