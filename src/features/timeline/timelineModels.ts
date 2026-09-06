import * as THREE from "three";
import type { TimelineRecord } from "@/lib/content/types";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { timelineActivity } from "./timelineActivity";

export type TimelineModel = {
  group: THREE.Group;
  /** The moving interaction surface, in the artifact group's local coordinates. */
  contact: THREE.Vector3;
  /** A real upper edge supporting the feet between manipulations. */
  perch: THREE.Vector3;
  animate: (amount: number, idle: number, phase?: number, work?: number) => void;
};
export type TimelineMaterials = ReturnType<typeof createTimelineMaterials>;

export function createTimelineMaterials(copper: string, bone: string) {
  return {
    copper: new THREE.MeshStandardMaterial({ color: copper, metalness: .63, roughness: .32 }),
    edge: new THREE.MeshStandardMaterial({ color: "#49392f", metalness: .55, roughness: .38 }),
    paper: new THREE.MeshStandardMaterial({ color: bone, metalness: .08, roughness: .63 }),
    ceramic: new THREE.MeshStandardMaterial({ color: "#c6b9a6", metalness: .22, roughness: .46 }),
    graphite: new THREE.MeshStandardMaterial({ color: "#383630", metalness: .35, roughness: .46 }),
  };
}

/** Subdivide broad box faces once: rounded-box flat faces otherwise span the whole page. */
function subdividePaperFace(geometry: THREE.BufferGeometry, step: number) {
  const position = geometry.getAttribute("position"), normal = geometry.getAttribute("normal"), uv = geometry.getAttribute("uv");
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  const vertex = (i: number) => [position.getX(i), position.getY(i), position.getZ(i), normal.getX(i), normal.getY(i), normal.getZ(i), uv.getX(i), uv.getY(i)];
  const append = (v: number[]) => {
    positions.push(v[0]!, v[1]!, v[2]!);
    const length = Math.hypot(v[3]!, v[4]!, v[5]!);
    normals.push(v[3]! / length, v[4]! / length, v[5]! / length);
    uvs.push(v[6]!, v[7]!);
  };
  const split = (a: number[], b: number[], c: number[]) => {
    const ab = Math.abs(a[0]! - b[0]!), bc = Math.abs(b[0]! - c[0]!), ca = Math.abs(c[0]! - a[0]!);
    if (Math.max(ab, bc, ca) <= step) { append(a); append(b); append(c); return; }
    // Bisect the longest span across the bend. Neighboring triangles share the
    // same midpoint; the sheet, bevels and printed lines stay watertight.
    if (bc >= ab && bc >= ca) { split(b, c, a); return; }
    if (ca > ab) { split(c, a, b); return; }
    const midpoint = a.map((value, i) => (value + b[i]!) / 2);
    split(a, midpoint, c); split(midpoint, b, c);
  };
  for (let i = 0; i < position.count; i += 3) split(vertex(i), vertex(i + 1), vertex(i + 2));
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

/** A shallow continuous paper bend; every attached surface uses the same local field. */
function createFlexiblePaper(page: THREE.Group, width: number, halfHeight: number, maximumBend: number) {
  const surfaces = page.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh).map((mesh) => {
    // These page children are fixed embossed marks or paper, baked into page space
    // once so that their vertices and the contact point receive identical bending.
    mesh.updateMatrix();
    mesh.geometry.applyMatrix4(mesh.matrix);
    mesh.position.set(0, 0, 0); mesh.quaternion.identity(); mesh.scale.setScalar(1); mesh.updateMatrix();
    subdividePaperFace(mesh.geometry, width / 8);
    // RoundedBox starts non-indexed; weld identical face vertices after the
    // one-time subdivision so bend uploads do not repeat every triangle corner.
    const indexed = mergeVertices(mesh.geometry, .00001);
    mesh.geometry.dispose(); mesh.geometry = indexed;
    mesh.geometry.computeBoundingSphere();
    if (mesh.geometry.boundingSphere) mesh.geometry.boundingSphere.radius += maximumBend * 1.1;
    const position = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const normal = mesh.geometry.getAttribute("normal") as THREE.BufferAttribute;
    position.setUsage(THREE.DynamicDrawUsage); normal.setUsage(THREE.DynamicDrawUsage);
    return { position, normal, positions: new Float32Array(position.array), normals: new Float32Array(normal.array) };
  });
  const inverseWidthSquared = 1 / (width * width);
  const cornerGradient = .14 / halfHeight;
  let strength = 0;
  const point = (target: THREE.Vector3) => {
    target.z += strength * target.x * target.x * inverseWidthSquared * (.86 + target.y * cornerGradient);
    return target;
  };
  return {
    point,
    bend(amount: number) {
      const next = amount < .00001 ? 0 : THREE.MathUtils.clamp(amount, 0, 1) * maximumBend;
      if (next === strength || (next !== 0 && Math.abs(next - strength) < .000001)) return;
      strength = next;
      for (const surface of surfaces) {
        const { position, normal, positions, normals } = surface;
        for (let i = 0; i < position.count; i++) {
          const offset = i * 3;
          const x = positions[offset]!, y = positions[offset + 1]!, z = positions[offset + 2]!;
          const across = x * x * inverseWidthSquared;
          const towardCorner = .86 + y * cornerGradient;
          position.setXYZ(i, x, y, z + strength * across * towardCorner);
          // Exact inverse-transpose for z += f(x,y), with no triangle-normal
          // recomputation or temporary vectors in the animation loop.
          const nz = normals[offset + 2]!;
          const nx = normals[offset]! - 2 * strength * x * inverseWidthSquared * towardCorner * nz;
          const ny = normals[offset + 1]! - strength * across * cornerGradient * nz;
          const length = Math.hypot(nx, ny, nz);
          normal.setXYZ(i, nx / length, ny / length, nz / length);
        }
        position.needsUpdate = true; normal.needsUpdate = true;
      }
    },
  };
}

export function createTimelineModel(record: Pick<TimelineRecord, "id" | "kind">, materials: TimelineMaterials): TimelineModel {
  const { kind } = record;
  const group = new THREE.Group();
  const contact = new THREE.Vector3(-.45, .45, .6);
  const perch = new THREE.Vector3(-.65, .72, .4);
  // Follow the actual nested hinge/key/slider transform without per-frame allocation.
  const locateContact = (part: THREE.Object3D, x: number, y: number, z: number) => {
    contact.set(x, y, z);
    let ancestor: THREE.Object3D | null = part;
    while (ancestor && ancestor !== group) {
      ancestor.updateMatrix();
      contact.applyMatrix4(ancestor.matrix);
      ancestor = ancestor.parent;
    }
  };
  // A consistent oblique view exposes the bevels, binding, and sliding channels.
  group.rotation.set(.46, -.48, -.12);
  const block = (parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0, radius = .045) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 3, h / 3, d / 3)), material);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  // The saddle passes behind every artifact and clamps it physically to the ribbon.
  const folioMount = record.id === "04" && kind === "EDUCATION";
  block(group, folioMount ? .4 : .72, folioMount ? .2 : .3, folioMount ? .32 : .6, materials.edge, 0, 0, -.15);
  block(group, folioMount ? .52 : .92, .12, folioMount ? .37 : .67, materials.copper, 0, -.18, -.12);
  if (record.id === "05" && kind === "WORK") {
    perch.set(.74, .66, .4);
    // AI application work: separate capability pieces seat into one product surface.
    // A compact handheld assembly, not a server, database, or system dependency graph.
    const shell = new THREE.Group();
    block(shell, 1.85, 1.18, .22, materials.edge, 0, 0, .17, .1);
    block(shell, 1.69, 1.02, .11, materials.copper, 0, 0, .32, .08);
    block(shell, 1.5, .82, .07, materials.graphite, 0, 0, .4, .055);
    const face = new THREE.Group();
    block(face, .85, .66, .15, materials.paper, -.25, 0, .51, .065);
    // An inset input line and three output strokes express application interaction.
    block(face, .61, .11, .013, materials.ceramic, -.25, .19, .596, .023);
    for (let i = 0; i < 3; i++) block(face, .55 - i * .11, .023, .012, materials.copper, -.27, .015 - i * .115, .599, .006);
    const modules: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const component = new THREE.Group();
      const y = .28 - i * .28;
      block(shell, .37, .22, .025, materials.edge, .53, y, .45, .028);
      block(component, .31, .19, .15, i === 1 ? materials.copper : materials.ceramic, .53, y, .54, .035);
      block(component, .16, .016, .012, i === 1 ? materials.paper : materials.edge, .53, y, .622, .004);
      for (let contact = 0; contact < 3; contact++) block(component, .035, .04, .023, materials.copper, .455 + contact * .073, y - .105, .5, .006);
      shell.add(component); modules.push(component);
    }
    // The two short retaining arms swing in, then settle against the product edge.
    const arms = [-1, 1].map((side) => {
      const arm = new THREE.Group(); arm.position.set(side * .88, -.47, .27);
      block(arm, .16, .38, .16, materials.copper, 0, .16, .03, .045);
      block(arm, .22, .1, .2, materials.ceramic, -side * .035, .33, .05, .025);
      shell.add(arm); return arm;
    });
    shell.add(face); group.add(shell);
    group.rotation.z = .08;
    return { group, contact, perch, animate(amount, idle, phase = 0, work = 0) {
      const { press } = timelineActivity(phase);
      // A different physical component gets the next press; the shared phase is
      // continuous, while timelineActivity wraps its gesture envelope each cycle.
      const selected = ((Math.floor(phase) % modules.length) + modules.length) % modules.length;
      face.position.z = .28 * (1 - amount);
      modules.forEach((component, i) => {
        const seat = THREE.MathUtils.smoothstep(amount, i * .12, .7 + i * .12);
        component.position.set(.2 * (1 - seat), 0, (.34 + i * .06) * (1 - seat) - (i === selected ? press * work * .065 : 0));
      });
      arms.forEach((arm, i) => { arm.rotation.z = (i === 0 ? 1 : -1) * .55 * (1 - amount); });
      group.rotation.z = .08 + idle * .005;
      locateContact(modules[selected]!, .53, .28 - selected * .28, .628);
    } };
  }
  if (record.id === "04" && kind === "EDUCATION") {
    perch.set(0, .68, .4);
    // AI study: a hinged research folio with complementary matrix and annotation leaves.
    // The abstract marks carry no invented scores, results, or qualification claims.
    block(group, .15, 1.27, .32, materials.edge, 0, 0, .27, .045);
    for (const y of [-.46, 0, .46]) block(group, .24, .13, .12, materials.copper, 0, y, .48, .04);
    const covers: THREE.Group[] = [];
    const annotation = new THREE.Group();
    annotation.position.set(.13, 0, .119);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Group(); leaf.position.z = .3;
      block(leaf, .97, 1.17, .085, materials.copper, side * .54, 0, 0, .045);
      block(leaf, .84, 1.03, .042, materials.paper, side * .54, 0, .07, .026);
      if (side < 0) {
        block(leaf, .43, .026, .009, materials.edge, -.56, .36, .099, .007);
        // An embossed study matrix is intentionally flat against its page.
        for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) {
          block(leaf, .095, .095, .018, row === column ? materials.copper : materials.ceramic, -.77 + column * .145, .17 - row * .145, .105, .012);
        }
      } else {
        // A separate, bound annotation sheet lifts above the permanent folio leaf.
        block(annotation, .77, .96, .024, materials.paper, .4, 0, 0, .016);
        for (let i = 0; i < 3; i++) {
          block(annotation, .63, .19, .024, materials.ceramic, .4, .29 - i * .28, .023, .018);
          block(annotation, .43 - i * .07, .018, .012, materials.edge, .39, .3 - i * .28, .041, .004);
          block(annotation, .045, .19, .035, materials.copper, .08, .29 - i * .28, .036, .01);
        }
        block(annotation, .12, .12, .027, materials.copper, .7, .4, .023, .009);
        leaf.add(annotation);
      }
      block(leaf, .19, .17, .04, materials.copper, side * .72, -.59, .035, .015);
      group.add(leaf); covers.push(leaf);
    }
    const flexibleAnnotation = createFlexiblePaper(annotation, .785, .48, .085);
    const annotationContact = new THREE.Vector3();
    return { group, contact, perch, animate(amount, idle, phase = 0, work = 0) {
      const { turn, tension } = timelineActivity(phase);
      covers[0]!.rotation.y = .13 + .48 * (1 - amount);
      covers[1]!.rotation.y = -.12 - .87 * (1 - amount);
      covers[1]!.position.z = .3 + .1 * (1 - amount);
      annotation.rotation.y = -.84 * turn * work;
      flexibleAnnotation.bend(tension * work);
      group.rotation.z = -.12 + idle * .006;
      flexibleAnnotation.point(annotationContact.set(.7, .4, .037));
      locateContact(annotation, annotationContact.x, annotationContact.y, annotationContact.z);
    } };
  }
  if (kind === "EDUCATION") {
    perch.set(-.63, .65, .25);
    const pages: THREE.Group[] = [];
    block(group, 1.8, 1.24, .11, materials.copper, 0, 0, .11);
    block(group, .13, 1.23, .55, materials.edge, -.82, 0, .32);
    for (let i = 0; i < 6; i++) {
      const page = new THREE.Group();
      page.position.set(-.76, 0, .22 + i * .07);
      block(page, 1.54, 1.12, .045, materials.paper, .77, 0, 0, .015);
      if (i === 5) {
        for (let line = 0; line < 6; line++) block(page, line === 0 ? .58 : 1.02, .014, .008, line === 0 ? materials.copper : materials.ceramic, .7, .36 - line * .135, .027, .003);
        block(page, .12, .3, .025, materials.copper, 1.28, -.47, .04, .01);
      }
      group.add(page); pages.push(page);
    }
    const frontPage = pages[pages.length - 1]!;
    const flexiblePage = createFlexiblePaper(frontPage, 1.54, .56, .15);
    const pageContact = new THREE.Vector3();
    return { group, contact, perch, animate(amount, idle, phase = 0, work = 0) {
      const { turn, tension } = timelineActivity(phase);
      pages.forEach((page, i) => {
        page.rotation.y = -amount * i * .13 - (i === pages.length - 1 ? turn * work * .64 : 0);
        page.position.z = .22 + i * .07 + amount * i * .05;
      });
      flexiblePage.bend(tension * work);
      group.rotation.z = -.12 + idle * .006;
      flexiblePage.point(pageContact.set(1.42, .45, .023));
      locateContact(frontPage, pageContact.x, pageContact.y, pageContact.z);
    } };
  }
  if (kind === "PREPARATION") {
    perch.set(-.72, .49, .3);
    block(group, 2.02, .96, .14, materials.ceramic, 0, 0, .15);
    block(group, 2.1, .12, .23, materials.edge, 0, -.42, .26);
    block(group, 2.1, .065, .09, materials.copper, 0, .41, .26);
    for (let i = 0; i < 21; i++) block(group, .014, i % 5 === 0 ? .23 : .105, .014, materials.graphite, -.91 + i * .091, i % 5 === 0 ? .19 : .25, .237, .003);
    const slider = new THREE.Group();
    block(slider, .12, 1.14, .18, materials.copper, -.24, 0, .38);
    block(slider, .12, 1.14, .18, materials.copper, .24, 0, .38);
    block(slider, .55, .12, .18, materials.copper, 0, -.51, .38);
    block(slider, .55, .12, .18, materials.copper, 0, .51, .38);
    block(slider, .028, .67, .03, materials.edge, 0, 0, .4, .006);
    block(slider, .26, .17, .24, materials.graphite, 0, -.59, .43);
    group.add(slider);
    return { group, contact, perch, animate(amount, idle, phase = 0, work = 0) {
      const { turn } = timelineActivity(phase);
      slider.position.x = -.57 * (1 - amount) + .42 * turn * work;
      slider.position.z = amount * .08;
      group.rotation.z = -.12 + idle * .005;
      locateContact(slider, -.17, .51, .47);
    } };
  }
  // An open assembly jig: dovetail tongues, bridge, locating pins and a sliding insert.
  block(group, 1.92, 1.24, .14, materials.edge, 0, 0, .1);
  for (const x of [-.77, .77]) {
    block(group, .22, 1.36, .26, materials.copper, x, 0, .25);
    block(group, .06, 1.19, .07, materials.paper, x, 0, .41, .018);
  }
  const insert = new THREE.Group();
  block(insert, 1.12, .83, .3, materials.ceramic, 0, 0, .36);
  block(insert, .92, .64, .055, materials.paper, 0, 0, .535);
  for (let i = 0; i < 4; i++) block(insert, .54 - i * .07, .016, .012, materials.copper, -.05, -.08 - i * .058, .569, .004);
  block(insert, .5, .33, .035, materials.graphite, -.13, .17, .58, .035);
  const enter = new THREE.Group();
  enter.position.set(-.13, .17, .63);
  block(enter, .43, .27, .09, materials.copper, 0, 0, 0, .03);
  // Embossed return arrow, made from solid strokes rather than a text texture.
  block(enter, .024, .095, .013, materials.paper, .083, .025, .053, .005);
  block(enter, .168, .024, .013, materials.paper, .011, -.017, .053, .005);
  for (const direction of [-1, 1]) {
    const arrow = block(enter, .075, .023, .013, materials.paper, -.065, -.017 + direction * .021, .053, .005);
    arrow.rotation.z = direction * .7;
  }
  insert.add(enter);
  const bridge = new THREE.Group();
  block(bridge, 1.92, .23, .25, materials.copper, 0, .57, .32);
  for (const x of [-.77, .77]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .12, 20), materials.graphite);
    pin.rotation.x = Math.PI / 2; pin.position.set(x, .57, .5); bridge.add(pin);
    block(bridge, .075, .012, .01, materials.ceramic, x, .57, .567, .002);
  }
  group.add(insert, bridge);
  return { group, contact, perch, animate(amount, idle, phase = 0, work = 0) {
    const { press } = timelineActivity(phase);
    insert.position.y = -.3 * (1 - amount);
    insert.position.z = .32 * (1 - amount);
    enter.position.z = .63 - .044 * press * work;
    bridge.position.y = .28 * (1 - amount);
    group.rotation.z = -.12 + idle * .005;
    locateContact(enter, -.025, .015, .061);
  } };
}

/** Rounded rectangular section swept along a continuous 3D path, not a screen-space line. */
export function ribbonGeometry(curve: THREE.Curve<THREE.Vector3>, width: number, depth: number) {
  const s = new THREE.Shape();
  const x = width / 2, y = depth / 2, r = Math.min(width, depth) * .24;
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y);
  return new THREE.ExtrudeGeometry(s, { steps: 160, bevelEnabled: false, extrudePath: curve, curveSegments: 4 });
}
