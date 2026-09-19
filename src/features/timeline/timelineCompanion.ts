import * as THREE from "three";
import type { TimelineMaterials } from "./timelineModels";
import { timelineActivity } from "./timelineActivity";

type Section = [number, number, number, number, number];
export type TimelineCompanionInteraction = {
  gazeX?: number;
  gazeY?: number;
  flourish?: number;
  handlingLeaf?: boolean;
};

/** Closed elliptical cross sections along a curved anatomical centerline. */
function organicVolume(sections: Section[], rings = 28, sides = 16, plumage = false) {
  const axis = new THREE.CatmullRomCurve3(sections.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const profile = new THREE.CatmullRomCurve3(sections.map((section, i) => new THREE.Vector3(i, section[3], section[4])));
  const positions: number[] = [], indices: number[] = [], colors: number[] = [];
  const back = new THREE.Color("#443329"), breast = new THREE.Color("#c6b7a0"), mottling = new THREE.Color("#69503b");
  const rump = new THREE.Color("#6b4a33"), crown = new THREE.Color("#3a2b20");
  const normal = new THREE.Vector3(), binormal = new THREE.Vector3();
  for (let row = 0; row <= rings; row++) {
    const t = row / rings;
    const center = axis.getPoint(t), tangent = axis.getTangent(t);
    const radius = profile.getPoint(t);
    normal.set(-tangent.y, tangent.x, 0).normalize();
    if (normal.lengthSq() < .1) normal.set(0, 1, 0);
    binormal.crossVectors(tangent, normal).normalize();
    for (let side = 0; side <= sides; side++) {
      const angle = side / sides * Math.PI * 2;
      const vertical = Math.sin(angle), lateral = Math.cos(angle);
      const ry = Math.max(.0004, radius.y), rz = Math.max(.0004, radius.z);
      positions.push(
        center.x + normal.x * vertical * ry + binormal.x * lateral * rz,
        center.y + normal.y * vertical * ry + binormal.y * lateral * rz,
        center.z + normal.z * vertical * ry + binormal.z * lateral * rz,
      );
      if (plumage) {
        const underside = THREE.MathUtils.smoothstep(-vertical, -.2, .7);
        const color = back.clone().lerp(breast, underside);
        // Anatomical zoning along the spine: rufous rump behind, darker crown ahead.
        color.lerp(rump, .3 * (1 - THREE.MathUtils.smoothstep(t, .05, .3)));
        color.lerp(crown, .28 * THREE.MathUtils.smoothstep(t, .78, .98));
        // A faint barring rhythm under the shader's finer one, plus fine speckle.
        const barring = Math.sin(row * 2.6 + side * .4) * .045;
        const speckle = .05 * (1 + Math.sin(row * 13.1 + side * 7.7)) + .04 * (1 + Math.sin(row * 4.3 - side * 2.9));
        color.lerp(mottling, Math.max(0, speckle + barring));
        // Baked vertical ambient falloff keeps the belly from glowing flat.
        color.multiplyScalar(.93 + .07 * vertical);
        colors.push(color.r, color.g, color.b);
      }
      if (row < rings && side < sides) {
        const a = row * (sides + 1) + side, b = a + sides + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (plumage) geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A solid curved feather with a rounded shaft and tapered asymmetric vane. */
function featherVolume(length: number, width: number, arch: number) {
  return organicVolume([
    [0, 0, 0, .003, .002],
    [-length * .16, -.012, arch * .35, width * .7, .0023],
    [-length * .48, -.025, arch, width, .0028],
    [-length * .8, -.035, arch * .8, width * .66, .0018],
    [-length, -.04, arch * .3, .0005, .0005],
  ], 21, 11);
}

/**
 * Static procedural barring and barb streaks in feather-local space; the same
 * program is shared through one cache key while the frequencies stay uniforms.
 */
function featherDetail(material: THREE.MeshPhysicalMaterial, barring: [number, number], streak: [number, number]) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBarring = { value: new THREE.Vector2(barring[0], barring[1]) };
    shader.uniforms.uStreak = { value: new THREE.Vector2(streak[0], streak[1]) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vFeatherLocal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFeatherLocal = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vFeatherLocal;
uniform vec2 uBarring;
uniform vec2 uStreak;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
{
  float bar = sin(vFeatherLocal.x * uBarring.x + vFeatherLocal.y * 2.3 + vFeatherLocal.z * .9) * .5 + .5;
  bar = smoothstep(.34, .66, bar);
  float barb = sin(vFeatherLocal.z * uStreak.x + sin(vFeatherLocal.x * 2.9 + vFeatherLocal.y * 1.1) * 1.4) * .5 + .5;
  diffuseColor.rgb *= (1.0 - uBarring.y * bar) * (1.0 - uStreak.y * barb);
}`);
  };
  material.customProgramCacheKey = () => "timeline-feather-detail";
}

/** Original procedural wren: volumetric plumage and independently articulated limbs. */
export function createTimelineCompanion(materials: TimelineMaterials) {
  const group = new THREE.Group();
  group.name = "timeline-companion";
  const feather = new THREE.MeshPhysicalMaterial({ color: "#503a29", roughness: .92, metalness: 0, sheen: .42, sheenRoughness: .62, sheenColor: "#7a5c3e" });
  const featherDark = new THREE.MeshPhysicalMaterial({ color: "#30261e", roughness: .94, metalness: 0, sheen: .36, sheenRoughness: .7, sheenColor: "#544234" });
  const featherLight = new THREE.MeshPhysicalMaterial({ color: "#79604b", roughness: .92, metalness: 0, sheen: .42, sheenRoughness: .62, sheenColor: "#96795c" });
  const down = new THREE.MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, roughness: .96, metalness: 0, sheen: .3, sheenRoughness: .72, sheenColor: "#b9a98f" });
  const cream = new THREE.MeshPhysicalMaterial({ color: "#cbbda7", roughness: .94, metalness: 0, sheen: .3, sheenRoughness: .7, sheenColor: "#d8cbb4" });
  // Wing and tail feathers carry the wren's transverse barring; body tracts only streaks.
  featherDetail(feather, [46, .1], [150, .05]);
  featherDetail(featherDark, [46, .12], [150, .06]);
  featherDetail(featherLight, [46, .1], [150, .05]);
  featherDetail(down, [0, 0], [240, .035]);
  featherDetail(cream, [0, 0], [200, .04]);
  const horn = new THREE.MeshPhysicalMaterial({ color: "#28221c", roughness: .61, metalness: 0 });
  const legsMaterial = new THREE.MeshPhysicalMaterial({ color: "#90725d", roughness: .82, metalness: 0, sheen: .2, sheenRoughness: .8, sheenColor: "#a98c72" });
  const eyeMaterial = new THREE.MeshPhysicalMaterial({ color: "#0b0907", roughness: .17, metalness: 0 });
  const irisMaterial = new THREE.MeshPhysicalMaterial({ color: "#4b321e", roughness: .28, metalness: 0, sheen: .25, sheenRoughness: .4, sheenColor: "#6b4a2c" });
  const mesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material) => {
    const object = new THREE.Mesh(geometry, material);
    parent.add(object);
    return object;
  };
  const torso = new THREE.Group();
  group.add(torso);
  mesh(torso, organicVolume([
    [-.285, .28, 0, .003, .003], [-.20, .30, 0, .085, .072],
    [-.08, .31, 0, .137, .126], [.025, .32, 0, .132, .121],
    [.105, .34, 0, .09, .082], [.15, .345, 0, .005, .005],
  ], 54, 30, true), down);

  // Shingled scapular coverts bridge the shoulder into the folded wing surface.
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const covert = mesh(torso, featherVolume(.17 - i * .009, .022, .009), i % 2 ? feather : featherLight);
    covert.position.set(.03 - i * .029, .418 - i * .006, side * (.044 + i * .011));
    covert.rotation.set(side * .65, -.10 * side, -.12);
  }
  // The dorsal tract crosses the spine, so the back is as finished as the flanks.
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const dorsal = mesh(torso, featherVolume(.13, .019, .008), i % 2 ? feather : featherLight);
    dorsal.position.set(.018 - i * .043, .445 - i * .012, side * .019);
    dorsal.rotation.set(Math.PI / 2, -.055 * side, -.09);
  }
  // Rump tract sweeps over the tail base; undertail coverts finish the vent.
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const rumpFeather = mesh(torso, featherVolume(.1 - i * .008, .017, .006), i === 1 ? featherDark : feather);
    rumpFeather.position.set(-.215 - i * .018, .382 - i * .01, side * (.02 + i * .004));
    rumpFeather.rotation.set(Math.PI / 2, .06 * side, .3);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
    const vent = mesh(torso, featherVolume(.085 - i * .007, .015, .005), cream);
    vent.position.set(-.235 - i * .016, .252 - i * .012, side * .014);
    vent.rotation.set(Math.PI / 2, .04 * side, .55);
  }
  // Flank tracts fluff the sides between the wing and the belly.
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const flank = mesh(torso, featherVolume(.12 - i * .008, .018, .006), i % 2 ? featherLight : cream);
    flank.position.set(.02 - i * .036, .3 - i * .028, side * (.088 + i * .006));
    flank.rotation.set(side * .95, -.14 * side, .18);
  }

  const neck = new THREE.Group();
  neck.position.set(.10, .38, 0);
  torso.add(neck);
  // The neck, cheek and cranium form a single changing cross section, not spheres.
  mesh(neck, organicVolume([
    [-.062, -.078, 0, .02, .025], [-.047, -.025, 0, .072, .069],
    [.005, .045, 0, .098, .091], [.073, .069, 0, .099, .098],
    [.137, .045, 0, .070, .069], [.169, .021, 0, .012, .023],
  ], 46, 26, true), down);
  for (let i = 0; i < 3; i++) {
    const nape = mesh(neck, featherVolume(.079, .016, .006), i === 1 ? featherDark : feather);
    nape.position.set(.011, .145, (i - 1) * .025);
    nape.rotation.set(Math.PI / 2, (i - 1) * .08, .22);
  }
  // Crown feathers sweep back over the skull between the supercilium tracts.
  for (let i = 0; i < 4; i++) {
    const crown = mesh(neck, featherVolume(.075 - i * .005, .015, .005), i % 2 ? feather : featherDark);
    crown.position.set(.075 - i * .036, .158 + i * .004, 0);
    crown.rotation.set(Math.PI / 2, 0, .16 + i * .05);
  }
  // A short cream throat tract closes the chin below the lower mandible.
  for (let i = 0; i < 3; i++) {
    const throat = mesh(neck, featherVolume(.062 - i * .004, .012, .004), cream);
    throat.position.set(.128 - i * .008, .012, (i - 1) * .019);
    throat.rotation.set((i - 1) * .16, 0, -1.75);
  }
  const eyes: THREE.Mesh[] = [];
  const pupils: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    // The pale supercilium and cheek are curved inset feather tracts.
    const brow = mesh(neck, organicVolume([
      [-.052, .092, 0, .001, .001], [.007, .118, 0, .012, .008],
      [.08, .114, 0, .012, .008], [.129, .084, 0, .001, .001],
    ], 16, 8), cream);
    brow.position.z = side * .077;
    const cheek = mesh(neck, organicVolume([
      [-.028, .03, 0, .001, .001], [.025, .033, 0, .029, .008],
      [.09, .035, 0, .025, .008], [.126, .046, 0, .001, .001],
    ], 16, 10), cream);
    cheek.position.z = side * .083;
    // Auricular feathers overlap the cheek tract and break its smooth edge.
    for (let i = 0; i < 3; i++) {
      const auricular = mesh(neck, featherVolume(.05 - i * .004, .008, .003), i === 1 ? featherDark : featherLight);
      auricular.position.set(.075 - i * .022, .028 + i * .012, side * .089);
      auricular.rotation.z = .3 + i * .12;
    }
    // Warm iris, dark pupil and a pale wren eye-ring, all blinking together.
    const eye = mesh(neck, new THREE.SphereGeometry(.019, 20, 14), irisMaterial);
    eye.position.set(.088, .084, side * .092);
    eye.scale.z = .65;
    eyes.push(eye);
    const pupil = mesh(eye, new THREE.SphereGeometry(.0115, 14, 10), eyeMaterial);
    pupil.position.set(.001, .001, side * .012);
    pupil.scale.z = .6;
    eyes.push(pupil);
    pupils.push(pupil);
    const catchlight = mesh(eye, new THREE.SphereGeometry(.0032, 8, 6), materials.paper);
    catchlight.position.set(.005, .007, side * .014);
    const ring = mesh(neck, new THREE.TorusGeometry(.025, .0036, 8, 22), cream);
    ring.position.set(.088, .084, side * .086);
    ring.scale.z = .55;
    eyes.push(ring);
  }
  // Two tapered mandibles meet at the real contact marker.
  const upperBeak = mesh(neck, organicVolume([
    [.14, .031, 0, .024, .029], [.205, .012, 0, .019, .02],
    [.275, -.02, 0, .007, .006], [.31, -.035, 0, .0004, .0004],
  ], 18, 12), horn);
  upperBeak.name = "upper-beak";
  // The culmen ridge runs the upper mandible's centerline to its decurved tip.
  mesh(neck, organicVolume([
    [.145, .054, 0, .0035, .0015], [.205, .03, 0, .0028, .0012],
    [.275, -.014, 0, .0012, .0008],
  ], 14, 6), horn);
  for (const nside of [-1, 1]) {
    const nostril = mesh(neck, new THREE.SphereGeometry(.0032, 8, 6), featherDark);
    nostril.position.set(.172, .041, nside * .012);
  }
  const lowerBeak = mesh(neck, organicVolume([
    [.145, .011, 0, .010, .020], [.215, -.002, 0, .011, .014],
    [.282, -.025, 0, .003, .004], [.31, -.035, 0, .0004, .0004],
  ], 14, 10), featherDark);
  // Rotation about the mandibular joint opens the tip, rather than sliding
  // the whole lower mandible away from the face.
  lowerBeak.geometry.translate(-.145, -.011, 0);
  lowerBeak.position.set(.145, .011, 0);
  const contact = new THREE.Object3D();
  contact.name = "timeline-companion-contact";
  contact.position.set(.31, -.035, 0);
  neck.add(contact);

  const wings = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(.014, .372, side * .106);
    torso.add(shoulder);
    mesh(shoulder, organicVolume([
      [.025, .01, 0, .01, .014], [-.018, -.012, side * .005, .053, .035],
      [-.09, -.05, side * .011, .048, .027], [-.145, -.08, side * .018, .008, .008],
    ], 20, 14), feather);
    const elbow = new THREE.Group();
    elbow.position.set(-.065, -.044, side * .018);
    shoulder.add(elbow);
    const wrist = new THREE.Group();
    wrist.position.set(-.055, -.021, side * .012);
    elbow.add(wrist);
    const primaries: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i++) {
      const primary = mesh(wrist, featherVolume(.23 + .05 * Math.sin(i / 6 * Math.PI) - i * .002, .018, side * .01), i % 3 === 0 ? featherLight : featherDark);
      primary.position.set(i * .009, -i * .012, side * i * .006);
      primary.rotation.z = -.12 + i * .05;
      primaries.push(primary);
    }
    // The alula sits on the wrist's leading edge and flicks first in flight.
    for (let i = 0; i < 2; i++) {
      const alula = mesh(wrist, featherVolume(.085 - i * .012, .013, side * .012), featherDark);
      alula.position.set(.028 - i * .006, .002 - i * .01, side * (.008 + i * .004));
      alula.rotation.z = -.55 + i * .18;
    }
    for (let i = 0; i < 6; i++) {
      const secondary = mesh(elbow, featherVolume(.178 - i * .009, .021, side * .008), i % 2 ? feather : featherLight);
      secondary.position.set(.02 + i * .016, -.016 - i * .013, side * (.016 + i * .005));
      secondary.rotation.z = .15 + i * .048;
    }
    for (let i = 0; i < 5; i++) {
      const covert = mesh(shoulder, featherVolume(.124, .022, side * .007), i % 2 ? featherLight : feather);
      covert.position.set(.013 - i * .016, -.015 - i * .015, side * (.035 + i * .002));
      covert.rotation.z = .08 + i * .07;
    }
    // Greater coverts cover the secondary bases; marginals cover the primaries.
    for (let i = 0; i < 4; i++) {
      const greater = mesh(elbow, featherVolume(.098 - i * .007, .016, side * .006), i % 2 ? feather : featherLight);
      greater.position.set(.024 + i * .015, -.008 - i * .012, side * (.03 + i * .005));
      greater.rotation.z = .12 + i * .06;
    }
    for (let i = 0; i < 3; i++) {
      const marginal = mesh(wrist, featherVolume(.07 - i * .006, .013, side * .008), feather);
      marginal.position.set(.012 + i * .012, .004 - i * .014, side * (.012 + i * .005));
      marginal.rotation.z = -.06 + i * .05;
    }
    return { shoulder, elbow, wrist, primaries, side };
  });

  const tail = new THREE.Group();
  tail.position.set(-.225, .29, 0);
  torso.add(tail);
  const tailFeathers: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const plume = mesh(tail, featherVolume(.21 - Math.abs(i - 3) * .012, .02, .014), i % 2 ? feather : featherDark);
    plume.position.set(0, Math.abs(i - 3) * .005, (i - 3) * .019);
    plume.rotation.set(0, (i - 3) * .065, -.38);
    tailFeathers.push(plume);
  }

  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(-.025, .211, side * .061);
    torso.add(hip);
    mesh(hip, organicVolume([
      [0, .025, 0, .02, .018], [.013, -.038, 0, .015, .014], [.034, -.075, 0, .009, .009],
    ], 12, 10), feather);
    const ankle = new THREE.Group();
    ankle.position.set(.034, -.075, 0);
    hip.add(ankle);
    mesh(ankle, organicVolume([
      [0, .007, 0, .011, .009], [-.013, -.06, 0, .008, .007], [-.023, -.119, 0, .005, .006],
    ], 12, 10), legsMaterial);
    // The shin carries fine scale bands, visible at the larger desktop size.
    for (let i = 0; i < 4; i++) {
      const scale = mesh(ankle, organicVolume([
        [-.004 - i * .0035, -.025 - i * .018, -.007, .001, .001],
        [-.004 - i * .0035, -.025 - i * .018, 0, .002, .008],
        [-.004 - i * .0035, -.025 - i * .018, .007, .001, .001],
      ], 5, 6), horn);
      scale.name = "tarsal-scale";
    }
    const toes = [0, 1, 2, 3].map((index) => {
      const toe = new THREE.Group();
      toe.position.set(-.023, -.119, 0);
      ankle.add(toe);
      const forward = index !== 3;
      const length = forward ? (index === 1 ? .095 : .071) : -.05;
      const spread = forward ? (index - 1) * .03 : .006;
      mesh(toe, organicVolume([
        [0, 0, 0, .006, .006], [length * .45, -.003, spread * .55, .005, .005],
        [length * .8, -.007, spread, .0038, .004],
      ], 10, 8), legsMaterial);
      mesh(toe, organicVolume([
        [length * .76, -.006, spread, .004, .004], [length * .98, -.009, spread, .003, .003],
        [length * 1.04, -.018, spread, .0004, .0004],
      ], 8, 8), horn);
      return toe;
    });
    return { hip, ankle, toes, side };
  });

  const targetInTorso = new THREE.Vector3(), tipInTorso = new THREE.Vector3();
  const neckCorrection = new THREE.Vector3();
  let previousFlight = 0;
  let previousTime = 0;
  let landedAt = Number.NEGATIVE_INFINITY;
  let tookOffAt = Number.NEGATIVE_INFINITY;
  let flightPeak = 0;
  let preenAmount = 0;
  return {
    group,
    /** Damped preen weight, exposed so the renderer can log diagnostics. */
    preen: () => preenAmount,
    /** A short neck reach absorbs body inertia while the closed beak holds a leaf.
     * The torso remains damped; its position is never snapped to the page corner. */
    settleContact(target: THREE.Vector3, grip: number) {
      group.updateMatrixWorld(true);
      targetInTorso.copy(target); torso.worldToLocal(targetInTorso);
      contact.getWorldPosition(tipInTorso); torso.worldToLocal(tipInTorso);
      neckCorrection.subVectors(targetInTorso, tipInTorso).clampLength(0, .115).multiplyScalar(grip);
      neck.position.add(neckCorrection);
      neck.updateMatrixWorld(true);
    },
    animate(time: number, flight: number, phase: number, work: number, interaction: TimelineCompanionInteraction = {}) {
      const flying = THREE.MathUtils.clamp(flight, 0, 1);
      // The flourish is the summon's visible answer: one wing flick, an upward
      // look and a short gape, damped out while fully airborne.
      const flourish = THREE.MathUtils.clamp(interaction.flourish ?? 0, 0, 1) * (1 - flying * .5);
      const gazeX = THREE.MathUtils.clamp(interaction.gazeX ?? 0, -1, 1);
      const gazeY = THREE.MathUtils.clamp(interaction.gazeY ?? 0, -1, 1);
      // A hovering manipulation still needs neck and beak articulation.
      const rawWorking = THREE.MathUtils.clamp(work, 0, 1) * (1 - flourish * .85);
      const action = timelineActivity(phase);
      const leaf = interaction.handlingLeaf ? 1 : 0;
      const breathe = Math.sin(time * 2.6);
      const step = Math.max(0, Math.min(.05, time - previousTime));
      if (time < previousTime) landedAt = Number.NEGATIVE_INFINITY;
      // Debounced transitions: flutter around a bare threshold fired the
      // landing and takeoff envelopes repeatedly, which read as convulsions.
      // A landing only counts after a real peak; a takeoff needs a decisive rise.
      if (flying < .18) {
        if (previousFlight >= .18 && flightPeak > .6) landedAt = time;
        flightPeak = 0;
      } else {
        flightPeak = Math.max(flightPeak, flying);
        if (previousFlight < .18 && flying >= .5) tookOffAt = time;
      }
      previousFlight = flying;
      previousTime = time;
      const landingAge = time - landedAt;
      const landing = landingAge >= 0 && landingAge < .55 ? Math.sin(landingAge / .55 * Math.PI) ** 2 : 0;
      const takeoffAge = time - tookOffAt;
      const takeoff = tookOffAt > Number.NEGATIVE_INFINITY && takeoffAge >= 0 && takeoffAge < .45 ? Math.sin(takeoffAge / .45 * Math.PI) ** 2 : 0;
      // Life comes from irregularity: glance windows, an upward look and tail
      // flicks ride incommensurate periods, so nothing loops on one rhythm.
      const pulse = (period: number, offset: number, width: number) => {
        const p = (((time + offset) % period) + period) % period;
        return p < width ? Math.sin(p / width * Math.PI) ** 2 : 0;
      };
      const glance = pulse(7.3, 1.2, 1.4) - .65 * pulse(11.17, 4.7, 1.1);
      const lookUp = pulse(13.7, 8.1, 1.6);
      const tailFlick = pulse(9.1, 2.6, .55) + .6 * pulse(15.3, 5.2, .4);
      // Preening: the head turns back over the shoulder and nibbles slowly at
      // the folded wing. It takes priority over the work cycle for its short
      // window — a grooming break — and a summon folds it away instantly.
      const preenTarget = (pulse(23.7, 9.4, 2.6) + .7 * pulse(31.3, 18.2, 2.2))
        * (1 - flourish) * (1 - THREE.MathUtils.smoothstep(flying, .85, 1));
      preenAmount += (preenTarget - preenAmount) * (1 - Math.exp(-step * 6));
      const working = rawWorking * (1 - preenAmount);
      const effort = working * (leaf ? action.turn : action.press);
      // A chirp answers the summon: one hop, a wide gape and a tail flick.
      torso.position.y = .007 * breathe * (1 - effort) - .032 * landing + .013 * flourish - .018 * takeoff;
      torso.position.x = .0035 * Math.sin(time * .83) * (1 - flying);
      torso.rotation.z = -.065 * flying - .045 * effort + .04 * flourish - .05 * takeoff;
      torso.scale.y = 1 + .008 * breathe;
      // The head inspects first. The beak closes before the pull and stays
      // closed throughout it; withdrawal and a small look-up follow release.
      neck.position.set(.10 + working * (.036 * action.reach - .016 * action.turn * leaf),
        .38 + working * (.018 * action.inspect - .012 * effort + .012 * action.release), 0);
      const attention = (1 - action.grip * working) * (1 - preenAmount);
      neck.rotation.x = .22 * flourish + .16 * lookUp - .05 * glance + .08 * action.inspect * working;
      neck.rotation.z = working * (-.08 * action.inspect - .065 * effort + .065 * action.release)
        + (.05 * glance + .23 * gazeY) * attention + .07 * flourish + .3 * preenAmount;
      neck.rotation.y = (.28 * glance + .62 * gazeX) * attention + .13 * action.inspect * working
        + 1.85 * preenAmount;
      neck.scale.y = 1 + .045 * action.reach * working;
      lowerBeak.rotation.z = -.16 * action.gape * working - .3 * flourish
        - .3 * Math.max(0, Math.sin(time * 9)) * preenAmount;
      // A slower beat with deep waxing glide phases reads as wingbeats; the
      // body itself stays perfectly steady — no wingbeat-frequency tremor.
      const wingPhase = ((time * 3.9) % 1 + 1) % 1;
      const strokeDepth = .35 + .65 * (0.5 + 0.5 * Math.sin(time * .73 + 1.1));
      const featherSettle = (pulse(8.3, 5.9, 1) + .5 * pulse(12.9, 3.3, .8))
        * (1 - flying) * (1 - working * action.reach);
      // A brisk power stroke occupies 38% of a cycle; recovery folds the wrist.
      const downstroke = wingPhase < .38;
      const stroke = downstroke
        ? Math.cos(wingPhase / .38 * Math.PI)
        : -Math.cos((wingPhase - .38) / .62 * Math.PI);
      const recovery = downstroke ? 0 : Math.sin((wingPhase - .38) / .62 * Math.PI);
      wings.forEach(({ shoulder, elbow, wrist, primaries, side }) => {
        const wingFlourish = flourish * (side > 0 ? 1 : .72);
        const wingPreen = preenAmount * (side > 0 ? 1 : .3);
        shoulder.rotation.x = side * (flying * (.7 + stroke * 1.22 * strokeDepth) + featherSettle * (side > 0 ? .3 : .12) + wingFlourish * .36);
        shoulder.rotation.y = side * (.05 + flying * 1.13 + wingFlourish * .62 + landing * .2 + wingPreen * .16);
        shoulder.rotation.z = -.11 * flying + .015 * breathe;
        elbow.rotation.z = flying * (-.2 + recovery * .48) - wingFlourish * .18;
        elbow.rotation.x = side * flying * (recovery * .55 + stroke * .2);
        wrist.rotation.y = side * (flying * (.12 - recovery * .85) + wingFlourish * .15);
        wrist.rotation.z = flying * recovery * .4 + featherSettle * .15 - wingFlourish * .1;
        primaries.forEach((primary, i) => {
          primary.rotation.z = -.12 + i * .05 + flying * (1 - recovery * .7) * i * .034 + wingFlourish * i * .03;
        });
      });
      // Wrens carry the tail cocked well above the body line and flick it when alert.
      tail.rotation.z = .48 + .025 * glance + .11 * flying + .045 * effort + .06 * landing + .14 * flourish + .3 * tailFlick - .3 * takeoff;
      tail.rotation.y = .035 * glance;
      tailFeathers.forEach((plume, i) => { plume.rotation.y = (i - 3) * (.065 + .055 * flying); });
      legs.forEach(({ hip, ankle, toes, side }) => {
        const stepping = side > 0 ? Math.max(action.inspect * working, flourish * .8) * (1 - flying) : 0;
        // Fold both leg segments against the belly in flight; extend before
        // landing, then settle the two feet with a small asymmetric weight shift.
        hip.rotation.z = -1.48 * flying - .30 * stepping - .15 * landing;
        hip.position.y = .211 + .022 * stepping - .018 * landing;
        ankle.rotation.z = 2.85 * flying + .28 * stepping + .15 * landing;
        toes.forEach((toe, i) => {
          toe.rotation.z = (i === 3 ? 1 : -1) * (.88 * flying + .18 * effort * (1 - flying) + .22 * landing);
        });
      });
      // Attention dilates the pupil; blinks mostly ride one rhythm with a rare second beat.
      const dilation = 1 + .14 * Math.min(1, Math.hypot(gazeX, gazeY)) + .12 * working * action.inspect;
      pupils.forEach((pupil) => { pupil.scale.x = pupil.scale.z = dilation; });
      const blinkWave = Math.max(
        THREE.MathUtils.smoothstep(Math.sin(time * .81), .991, 1),
        THREE.MathUtils.smoothstep(Math.sin(time * 1.37 + 2.6), .9965, 1),
      );
      const blink = 1 - .94 * blinkWave;
      eyes.forEach((eye) => { eye.scale.y = blink; });
    },
  };
}
