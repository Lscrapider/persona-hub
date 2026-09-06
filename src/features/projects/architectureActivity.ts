import * as THREE from "three";

import type { ModelActivity } from "./architectureModels";

/** Local work remains visible after the travelling signal reaches its destination. */
export function createArchitectureActivity(bounds: THREE.Box3) {
  const group = new THREE.Group();
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.set(center.x, bounds.min.y + 0.06, center.z);
  group.visible = false;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const copper = new THREE.MeshBasicMaterial({ color: "#e6b182", transparent: true, depthTest: false, depthWrite: false });
  const ivory = new THREE.MeshBasicMaterial({ color: "#fff0d6", transparent: true, depthTest: false, depthWrite: false });
  const halfX = size.x / 2 + 0.09;
  const halfZ = size.z / 2 + 0.09;
  const corner = Math.min(0.34, size.x * 0.22);
  function bar(x: number, y: number, z: number, width: number, height: number, depth: number, material = copper) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    mesh.renderOrder = 980;
    group.add(mesh);
    return mesh;
  }
  const columns: THREE.Mesh[] = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    bar(x * (halfX - corner / 2), 0, z * halfZ, corner, 0.018, 0.028);
    bar(x * halfX, 0, z * (halfZ - corner / 2), 0.028, 0.018, corner);
    columns.push(bar(x * halfX, 0, z * halfZ, 0.04, 0.24, 0.04, ivory));
  }
  const sweep = bar(0, 0, halfZ, size.x * 0.88, 0.025, 0.022, ivory);
  return {
    group,
    update(time: number, strength: number, activity: ModelActivity) {
      group.visible = activity !== "idle" && strength > 0.12;
      if (!group.visible) return;
      // Brackets persist; the moving strips make internal steps visibly progress.
      copper.opacity = Math.min(1, 0.5 + strength * 0.45);
      ivory.opacity = Math.min(1, 0.45 + strength * 0.55);
      const scanning = activity === "scan" || activity === "read";
      sweep.visible = scanning;
      sweep.position.y = 0.12 + (0.5 + Math.sin(time * 3.4) * 0.5) * size.y * 0.76;
      columns.forEach((column, index) => {
        column.visible = !scanning;
        const phase = (time * 0.95 + index * 0.23) % 1;
        const rise = activity === "write" ? 1 - phase : phase;
        column.position.y = 0.12 + rise * size.y * 0.7;
        column.scale.y = (0.11 + Math.sin(phase * Math.PI) * 0.24) * Math.min(1, size.y);
      });
    },
    dispose() { geometry.dispose(); copper.dispose(); ivory.dispose(); },
  };
}
