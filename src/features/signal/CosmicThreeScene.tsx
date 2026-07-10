import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { AtlasProject } from '../../config/atlas.schema';
import { useAtlasStore } from '../../store/atlasStore';

type CosmicProject = Pick<
  AtlasProject,
  'codename' | 'title' | 'signalType' | 'coordinates' | 'accent' | 'status'
> & {
  kind: 'project' | 'future';
};

type CosmicThreeSceneProps = {
  projects: CosmicProject[];
  activeIndex: number;
  projectOpacities: number[];
  scrollProgress: number;
  transitIntensity: number;
  transitPhase: number;
  reducedMotion: boolean;
};

type SceneRuntimeState = Omit<CosmicThreeSceneProps, 'projects'> & {
  pointer: { x: number; y: number };
};

type EntityKind = 'black-hole' | 'star' | 'neutron-star' | 'pulsar';

type PulsarHandle = {
  core: THREE.Mesh;
  coreMaterial: THREE.ShaderMaterial;
  haloPlanes: THREE.Mesh[];
  haloMaterials: THREE.ShaderMaterial[];
  jets: THREE.Mesh[];
  jetMaterials: THREE.ShaderMaterial[];
  jetRig: THREE.Group;
};

type StarFieldOptions = {
  count: number;
  sizeScale: number;
  initialOpacity: number;
  zNear: number;
  zFar: number;
  depthScale: number;
};

type StarFieldLayer = {
  field: THREE.Points;
  baseOpacity: number;
  pointerParallax: number;
  driftRate: number;
};

type CosmicEntityHandle = {
  group: THREE.Group;
  field: THREE.Mesh | null;
  dust: THREE.Points;
  basePosition: THREE.Vector3;
  baseScale: number;
  outerRadius: number;
  kind: EntityKind;
  fieldMaterial: THREE.ShaderMaterial | null;
  dustMaterial: THREE.ShaderMaterial;
  pulsar: PulsarHandle | null;
  rotationBias: THREE.Vector3;
  pulseOffset: number;
  cameraLocal: THREE.Vector3;
};

const ENTITY_SPECS: Array<{
  kind: EntityKind;
  core: THREE.Color;
  secondary: THREE.Color;
  dust: THREE.Color;
}> = [
  {
    kind: 'star',
    core: new THREE.Color(0xc8f6ee),
    secondary: new THREE.Color(0x4f9c9a),
    dust: new THREE.Color(0xa8d8d2)
  },
  {
    kind: 'pulsar',
    core: new THREE.Color(0xf0fbff),
    secondary: new THREE.Color(0x75cfee),
    dust: new THREE.Color(0xc4eeff)
  },
  {
    kind: 'neutron-star',
    core: new THREE.Color(0xd9e1de),
    secondary: new THREE.Color(0x718f93),
    dust: new THREE.Color(0x9eaaab)
  }
];

const CAMERA_BASE_FOV = 52;

const ENTITY_FIELD_VERTEX_SHADER = `
varying vec3 vLocalPosition;

void main() {
  vLocalPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ENTITY_FIELD_FRAGMENT_SHADER = `
uniform float u_time;
uniform float u_seed;
uniform float u_kind;
uniform float u_opacity;
uniform float u_activity;
uniform float u_detail;
uniform float u_stepCount;
uniform vec3 u_color;
uniform vec3 u_secondaryColor;
uniform vec3 u_cameraLocal;
varying vec3 vLocalPosition;

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash31(i), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
      mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x),
      f.y
    ),
    mix(
      mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
      mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm3(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise3(p);
    p = p * 2.03 + vec3(7.17, 3.31, 5.13);
    amplitude *= 0.5;
  }
  return value;
}

vec2 rayBoxInterval(vec3 rayOrigin, vec3 rayDirection) {
  vec3 inverseDirection = 1.0 / rayDirection;
  vec3 first = (-vec3(0.5) - rayOrigin) * inverseDirection;
  vec3 second = (vec3(0.5) - rayOrigin) * inverseDirection;
  vec3 nearPlane = min(first, second);
  vec3 farPlane = max(first, second);
  float entry = max(max(nearPlane.x, nearPlane.y), nearPlane.z);
  float exit = min(min(farPlane.x, farPlane.y), farPlane.z);
  return vec2(entry, exit);
}

vec4 samplePhenomenon(vec3 localPosition) {
  vec3 p = localPosition * 2.0;
  float slowTime = u_time * 0.035;
  float seed = u_seed * 0.073;
  float coarse = noise3(p * 1.36 + vec3(seed, -slowTime, seed * 0.37));
  vec3 warp = vec3(
    coarse,
    noise3(p.yzx * 1.53 + vec3(seed * 1.7, slowTime, 9.2)),
    noise3(p.zxy * 1.29 + vec3(-4.1, seed * 0.8, -slowTime))
  ) - 0.5;
  vec3 q = p + warp * (0.56 + u_activity * 0.08);
  float flow = fbm3(q * 2.15 + vec3(seed * 2.0, slowTime, -slowTime * 0.7));
  float fine = noise3(q * (7.0 + u_detail * 3.5) + vec3(-slowTime * 2.0, seed, slowTime));
  float materialDetail = mix(flow, fine, 0.68);

  if (u_kind < 0.5) {
    vec3 diskPosition = q;
    diskPosition.y += sin(q.x * 2.4 + seed) * 0.045 + warp.z * 0.08;
    float diskRadius = length(diskPosition.xz * vec2(0.78, 1.12));
    float diskAngle = atan(diskPosition.z, diskPosition.x);
    float arcBreak = noise3(vec3(cos(diskAngle) * 2.7, sin(diskAngle) * 2.7, diskRadius * 3.4) + seed);
    float primaryArc = smoothstep(-0.18, 0.72, cos(diskAngle - 0.58));
    float brokenDisk = exp(-abs(diskPosition.y) * 17.0);
    brokenDisk *= smoothstep(0.16, 0.28, diskRadius) * (1.0 - smoothstep(0.64, 0.94, diskRadius));
    brokenDisk *= 0.07 + primaryArc * 0.62 + smoothstep(0.42, 0.76, arcBreak) * 0.88;
    float irregularVoid = 1.0 - smoothstep(
      0.14,
      0.29,
      length((q + warp * 0.18) * vec3(1.0, 1.64, 0.88)) + (noise3(q * 8.0 + seed) - 0.5) * 0.1
    );
    float lensRadius = length((q + warp * 0.18) * vec3(0.86, 1.24, 0.74));
    float brokenLensing = smoothstep(0.25, 0.36, lensRadius) * (1.0 - smoothstep(0.48, 0.68, lensRadius));
    brokenLensing *= smoothstep(0.54, 0.78, flow + fine * 0.18);
    float density = (brokenDisk * 4.0 + brokenLensing * 0.58) * (1.0 - irregularVoid * 0.995);
    float heat = clamp(brokenDisk * 1.18 + brokenLensing * 0.42, 0.0, 1.0);
    float absorption = irregularVoid * 1.76;
    return vec4(density, heat, absorption, materialDetail);
  }

  float cavity = smoothstep(0.58, 0.84, noise3(q * 3.7 + vec3(seed * 3.1, 2.8, -1.7)));
  float lobeA = 0.88 - length((q - vec3(-0.28, 0.08, 0.02)) * vec3(0.76, 1.18, 0.84));
  float lobeB = 0.68 - length((q - vec3(0.34, -0.2, -0.14)) * vec3(1.08, 0.72, 0.94));
  float lobeC = 0.48 - length((q - vec3(0.06, 0.34, 0.24)) * vec3(0.72, 1.36, 0.68));
  float brokenEnvelope = max(lobeA, max(lobeB, lobeC)) + (flow - 0.5) * 1.08;
  float cloud = smoothstep(0.0, 0.34, brokenEnvelope);
  cloud *= 0.04 + 1.25 * smoothstep(0.48, 0.78, flow);
  cloud *= 0.18 + 1.05 * smoothstep(0.35, 0.82, fine);
  cloud *= 1.0 - cavity * 0.68;
  float edgeDistance = 0.5 - max(abs(localPosition.x), max(abs(localPosition.y), abs(localPosition.z)));
  cloud *= smoothstep(0.0, 0.13, edgeDistance);

  if (u_kind < 1.5) {
    // The star is a compact, asymmetric plasma source first. Noise only tears
    // its corona and edge; it never becomes a screen-wide cloud by itself.
    vec3 stellarStorm = q + warp * 0.2;
    float stormA = 0.46 - length((stellarStorm - vec3(-0.14, 0.08, 0.04)) * vec3(1.36, 0.92, 1.5));
    float stormB = 0.31 - length((stellarStorm - vec3(0.25, -0.16, -0.12)) * vec3(1.82, 1.26, 1.12));
    float coreShape = max(stormA, stormB);
    float turbulentCore = smoothstep(-0.08, 0.16, coreShape + (fine - 0.5) * 0.46 + (flow - 0.5) * 0.28);
    turbulentCore *= 0.36 + 0.86 * smoothstep(0.34, 0.78, materialDetail);

    vec3 coronaPoint = stellarStorm + vec3(-0.02, 0.04, 0.0);
    float coronaRadius = length(coronaPoint * vec3(0.96, 1.18, 0.88));
    float coronaAngle = atan(coronaPoint.y + coronaPoint.z * 0.24, coronaPoint.x);
    float coronaBreaks = sin(coronaAngle * 3.0 + seed * 1.7 + fine * 3.0) + (flow - 0.5) * 1.18;
    float tornCorona = exp(-abs(coronaRadius - 0.48) * 5.6);
    tornCorona *= smoothstep(-0.08, 0.7, coronaBreaks);
    tornCorona *= smoothstep(0.42, 0.78, materialDetail);
    tornCorona *= 1.0 - smoothstep(0.76, 1.18, coronaRadius);

    float hotCells = smoothstep(0.54, 0.86, flow + fine * 0.22) * turbulentCore;
    float coronaKnots = tornCorona * smoothstep(0.54, 0.84, fine + (flow - 0.5) * 0.24);
    float density = turbulentCore * 2.64 + tornCorona * 0.92 + coronaKnots * 0.82 + cloud * 0.045;
    float heat = clamp(turbulentCore * 1.12 + hotCells * 0.7 + coronaKnots * 0.52, 0.0, 1.0);
    return vec4(density, heat, 0.0, materialDetail);
  }

  // A neutron star is not rendered as a point or beam: it is a compact
  // magnetic disturbance with short, broken polar plasma volumes.
  vec2 bentAxis = q.xz + warp.xz * 0.32 + vec2(q.y * 0.07, -q.y * 0.04);
  float axisDistance = length(bentAxis * vec2(1.1, 0.92));
  float poleHeight = abs(q.y + warp.y * 0.12);
  float polarExtent = smoothstep(0.12, 0.28, poleHeight) * (1.0 - smoothstep(0.58, 1.02, poleHeight));
  float disruptedPole = exp(-axisDistance * 4.4) * polarExtent;
  disruptedPole *= smoothstep(0.34, 0.78, flow + fine * 0.22);
  float magneticShear = smoothstep(0.62, 0.84, fbm3(q * vec3(3.0, 5.7, 3.0) + warp + seed));
  float pulse = 0.92 + sin(u_time * 1.15 + seed * 5.0) * 0.08;
  vec3 compactPosition = q + warp * 0.26;
  float compactA = 0.43 - length((compactPosition - vec3(-0.1, 0.04, 0.02)) * vec3(1.42, 1.08, 1.56));
  float compactB = 0.27 - length((compactPosition - vec3(0.22, -0.12, -0.14)) * vec3(1.84, 1.42, 1.18));
  float compactPlasma = smoothstep(-0.06, 0.14, max(compactA, compactB) + (flow - 0.5) * 0.42);
  compactPlasma *= 0.36 + 0.82 * smoothstep(0.4, 0.82, fine);
  float compactTexture = smoothstep(0.64, 0.86, fine + (flow - 0.5) * 0.18) * compactPlasma;
  float shearVolume = magneticShear * smoothstep(0.04, 0.38, max(compactA, compactB));
  float density = compactPlasma * 2.22 + compactTexture * 0.76 + shearVolume * 0.34 + disruptedPole * pulse * 1.18 + cloud * 0.055;
  float heat = clamp(compactPlasma * 0.98 + disruptedPole * 0.8 + compactTexture * 0.58 + shearVolume * 0.34, 0.0, 1.0);
  return vec4(density, heat, 0.0, materialDetail);
}

void main() {
  vec3 rayDirection = normalize(vLocalPosition - u_cameraLocal);
  vec2 interval = rayBoxInterval(u_cameraLocal, rayDirection);
  float rayStart = max(interval.x, 0.0);
  float rayEnd = interval.y;

  if (rayEnd <= rayStart) discard;

  const int MAX_RAY_STEPS = 25;
  float stepLength = (rayEnd - rayStart) / u_stepCount;
  float jitter = hash31(vec3(gl_FragCoord.xy, u_seed)) * stepLength;
  float distanceAlongRay = rayStart + jitter;
  vec4 accumulation = vec4(0.0);
  vec3 lightDirection = normalize(vec3(-0.48, 0.72, 0.5));
  float forwardScatter = 0.34 + 0.66 * pow(max(0.0, dot(-rayDirection, lightDirection)), 2.0);

  for (int stepIndex = 0; stepIndex < MAX_RAY_STEPS; stepIndex++) {
    if (float(stepIndex) >= u_stepCount) break;
    vec3 samplePosition = u_cameraLocal + rayDirection * distanceAlongRay;
    vec4 sampleData = samplePhenomenon(samplePosition);
    float extinction = (sampleData.x + sampleData.z * 1.7) * stepLength * (2.15 + u_detail * 1.05);
    float sampleAlpha = 1.0 - exp(-extinction);
    float blackHole = 1.0 - step(0.5, u_kind);
    float star = step(0.5, u_kind) * (1.0 - step(1.5, u_kind));
    float neutron = step(1.5, u_kind);
    vec3 accretionColor = mix(vec3(0.05, 0.012, 0.01), vec3(0.74, 0.26, 0.12), sampleData.y);
    vec3 stellarColor = mix(vec3(0.008, 0.17, 0.18), vec3(0.34, 0.94, 0.79), sampleData.y);
    vec3 magneticColor = mix(vec3(0.02, 0.09, 0.12), vec3(0.56, 0.78, 0.78), sampleData.y);
    vec3 phenomenonColor = accretionColor * blackHole + stellarColor * star + magneticColor * neutron;
    float emissionGain = blackHole * 3.0 + star * 2.85 + neutron * 2.4;
    vec3 litGas = phenomenonColor;
    litGas *= (0.24 + sampleData.y * 1.08 + forwardScatter * 0.38);
    litGas *= 0.24 + sampleData.w * 1.12;
    litGas += phenomenonColor * pow(sampleData.y, 1.6) * emissionGain;
    litGas += phenomenonColor * pow(sampleData.w, 5.0) * 0.34;
    litGas *= 1.0 - clamp(sampleData.z, 0.0, 1.0) * 0.96;
    litGas += u_secondaryColor * sampleData.x * forwardScatter * 0.08;

    accumulation.rgb += (1.0 - accumulation.a) * litGas * sampleAlpha;
    accumulation.a += (1.0 - accumulation.a) * sampleAlpha;

    if (accumulation.a > 0.985) break;
    distanceAlongRay += stepLength;
  }

  float alpha = accumulation.a * u_opacity * (0.78 + u_activity * 0.22);
  if (alpha < 0.004) discard;

  vec3 color = accumulation.rgb / max(accumulation.a, 0.001);
  gl_FragColor = vec4(color, alpha);
}
`;

const PULSAR_CORE_VERTEX_SHADER = `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;

void main() {
  vLocalPosition = position;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
}
`;

const PULSAR_CORE_FRAGMENT_SHADER = `
uniform float u_time;
uniform float u_intensity;
uniform float u_pulse;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float facing = max(0.0, dot(normalize(vWorldNormal), viewDirection));
  float surfacePattern =
    sin(vLocalPosition.x * 12.0 + vLocalPosition.y * 5.0 + u_time * 0.34) *
    sin(vLocalPosition.z * 10.0 - vLocalPosition.y * 6.0 - u_time * 0.24);
  float magneticBand = sin(vLocalPosition.y * 16.0 + vLocalPosition.x * 5.0 - u_time * 0.18);
  float texture = surfacePattern * 0.065 + magneticBand * 0.032;
  float whiteHotCore = pow(facing, 4.6);
  float cyanRim = pow(1.0 - facing, 2.05);
  float pulse = 0.96 + u_pulse * 0.08;
  vec3 coldDark = vec3(0.045, 0.14, 0.28);
  vec3 ionizedSurface = mix(coldDark, vec3(0.6, 0.88, 1.0), smoothstep(0.08, 0.78, facing));
  ionizedSurface += vec3(0.95, 1.04, 1.12) * whiteHotCore * (1.0 + u_pulse * 0.18);
  ionizedSurface += vec3(0.02, 0.48, 0.84) * cyanRim * (0.92 + u_pulse * 0.34);
  ionizedSurface *= 1.0 + texture;
  gl_FragColor = vec4(ionizedSurface * pulse * u_intensity, 1.0);
}
`;

const PULSAR_HALO_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PULSAR_HALO_FRAGMENT_SHADER = `
uniform float u_time;
uniform float u_opacity;
uniform float u_scale;
uniform float u_pulse;
uniform vec3 u_color;
varying vec2 vUv;

void main() {
  vec2 p = (vUv - vec2(0.5)) * 2.0;
  float radius = length(p);
  if (radius >= 1.0) discard;

  float pulse = 0.94 + u_pulse * 0.1 + sin(u_time * 0.28 + u_scale * 4.0) * 0.025;
  float irregularity = sin(atan(p.y, p.x) * 5.0 + u_time * 0.12) * 0.012;
  float radialDensity = exp(-pow((radius + irregularity) * (2.0 + u_scale * 0.28), 2.0));
  float edgeFade = 1.0 - smoothstep(0.78, 1.0, radius);
  edgeFade *= edgeFade;
  float alpha = radialDensity * edgeFade * u_opacity * pulse;
  if (alpha < 0.001) discard;
  gl_FragColor = vec4(u_color * (0.36 + radialDensity * 0.86), alpha);
}
`;

const PULSAR_JET_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vViewNormal;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = mvPosition.xyz;
  vViewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const PULSAR_JET_FRAGMENT_SHADER = `
uniform float u_time;
uniform float u_opacity;
uniform float u_pulse;
uniform vec3 u_color;
varying vec2 vUv;
varying vec3 vViewPosition;
varying vec3 vViewNormal;

void main() {
  vec3 viewDirection = normalize(-vViewPosition);
  float rim = pow(1.0 - abs(dot(normalize(vViewNormal), viewDirection)), 1.1);
  float bodyVisibility = 0.35 + rim * 0.65;
  float radialFade = pow(sin(vUv.x * 3.14159265), 0.7);
  float distanceFromCore = smoothstep(0.05, 0.98, vUv.y);
  float lengthFade = pow(1.0 - distanceFromCore, 0.72);
  float flow = 0.88 + sin(vUv.y * 12.0 - u_time * 1.45) * 0.1;
  float nearCorePulse = 0.95 + u_pulse * 0.12 * pow(1.0 - vUv.y, 1.7);
  float alpha = bodyVisibility * radialFade * lengthFade * u_opacity * flow * nearCorePulse;
  vec3 jetColor = mix(u_color * (0.38 + rim * 0.62), u_color * 0.14, distanceFromCore);
  if (alpha < 0.0004) discard;
  gl_FragColor = vec4(jetColor, alpha);
}
`;

const ENTITY_DUST_VERTEX_SHADER = `
uniform float u_time;
uniform float u_motion;
attribute float aSize;
attribute float aPhase;
varying float vAlpha;

void main() {
  vec3 p = position;
  p.x += sin(u_time * 0.2 + aPhase) * 0.035 * u_motion;
  p.y += cos(u_time * 0.18 + aPhase * 1.7) * 0.026 * u_motion;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = min(4.0, aSize * (90.0 / max(6.0, -mvPosition.z)) * (1.0 + u_motion * 0.5));
  vAlpha = 0.58 + 0.42 * sin(u_time * 0.42 + aPhase);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const ENTITY_DUST_FRAGMENT_SHADER = `
uniform float u_opacity;
uniform vec3 u_color;
varying float vAlpha;

void main() {
  float distanceToCenter = length(gl_PointCoord - vec2(0.5));
  float alpha = (1.0 - smoothstep(0.08, 0.48, distanceToCenter)) * u_opacity * vAlpha;
  gl_FragColor = vec4(u_color, alpha);
}
`;

const STAR_VERTEX_SHADER = `
uniform float u_time;
uniform float u_motion;
attribute float aSize;
attribute float aTwinkle;
varying float vTwinkle;
varying float vMotion;

void main() {
  vTwinkle = 0.72 + 0.28 * sin(u_time * aTwinkle + position.x * 0.07 + position.y * 0.05);
  vMotion = u_motion;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = min(5.2, aSize * vTwinkle * (130.0 / max(7.0, -mvPosition.z)) * (1.0 + u_motion * 0.65));
  gl_Position = projectionMatrix * mvPosition;
}
`;

const STAR_FRAGMENT_SHADER = `
uniform float u_opacity;
uniform vec3 u_color;
varying float vTwinkle;
varying float vMotion;

void main() {
  vec2 point = gl_PointCoord - vec2(0.5);
  point.x *= mix(1.0, 0.44, vMotion);
  float distanceToCenter = length(point);
  float alpha = (1.0 - smoothstep(0.08, 0.46, distanceToCenter)) * u_opacity * vTwinkle * mix(1.0, 0.74, vMotion);
  gl_FragColor = vec4(u_color, alpha);
}
`;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function saturate(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smootherStep(value: number) {
  const t = saturate(value);

  return t * t * t * (t * (t * 6 - 15) + 10);
}

function smoothRange(value: number, start: number, end: number) {
  return smootherStep((value - start) / (end - start));
}

function cubicBezier(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  t: number,
  target: THREE.Vector3
) {
  const inverse = 1 - t;

  target
    .copy(a)
    .multiplyScalar(inverse * inverse * inverse)
    .addScaledVector(b, 3 * inverse * inverse * t)
    .addScaledVector(c, 3 * inverse * t * t)
    .addScaledVector(d, t * t * t);

  return target;
}

function projectPosition(project: CosmicProject, index: number) {
  const x = (project.coordinates.x - 50) / 7 + (index - 1) * 2.65;
  const y = (project.coordinates.y - 50) / 9 + Math.sin(index * 1.7) * 0.9;
  const z = -30 - index * 48;

  return new THREE.Vector3(x, y, z);
}

function kindValue(kind: EntityKind) {
  if (kind === 'black-hole') return 0;
  if (kind === 'star') return 1;
  return 2;
}

function createFieldMaterial(spec: (typeof ENTITY_SPECS)[number], seed: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_seed: { value: seed },
      u_kind: { value: kindValue(spec.kind) },
      u_opacity: { value: 0 },
      u_activity: { value: 0 },
      u_detail: { value: 0 },
      u_stepCount: { value: 8 },
      u_color: { value: spec.core.clone() },
      u_secondaryColor: { value: spec.secondary.clone() },
      u_cameraLocal: { value: new THREE.Vector3() }
    },
    vertexShader: ENTITY_FIELD_VERTEX_SHADER,
    fragmentShader: ENTITY_FIELD_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.NormalBlending
  });
}

function createPulsar(group: THREE.Group) {
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_intensity: { value: 1 },
      u_pulse: { value: 0.5 }
    },
    vertexShader: PULSAR_CORE_VERTEX_SHADER,
    fragmentShader: PULSAR_CORE_FRAGMENT_SHADER,
    depthWrite: true,
    toneMapped: false
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.88, 40, 28), coreMaterial);
  core.name = 'pulsar-core';
  core.renderOrder = 5;

  const haloSizes = [2.7, 4.4, 6.3];
  const haloOpacities = [0.46, 0.16, 0.032];
  const haloColors = [0xdaf9ff, 0x78cbed, 0x6575b8];
  const haloPlanes: THREE.Mesh[] = [];
  const haloMaterials: THREE.ShaderMaterial[] = [];

  haloSizes.forEach((size, index) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_opacity: { value: haloOpacities[index] },
        u_scale: { value: index + 1 },
        u_pulse: { value: 0.5 },
        u_color: { value: new THREE.Color(haloColors[index]) }
      },
      vertexShader: PULSAR_HALO_VERTEX_SHADER,
      fragmentShader: PULSAR_HALO_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const halo = new THREE.Mesh(new THREE.CircleGeometry(size * 0.5, 64), material);
    halo.name = `pulsar-halo-${index + 1}`;
    halo.renderOrder = 2 + index;
    haloPlanes.push(halo);
    haloMaterials.push(material);
    group.add(halo);
  });

  const jetRig = new THREE.Group();
  jetRig.name = 'pulsar-jet-rig';
  jetRig.rotation.set(0.18, -0.22, 0.56);
  const jets: THREE.Mesh[] = [];
  const jetMaterials: THREE.ShaderMaterial[] = [];

  [-1, 1].forEach((direction, index) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_opacity: { value: index === 0 ? 0.19 : 0.15 },
        u_pulse: { value: 0.5 },
        u_color: { value: new THREE.Color(index === 0 ? 0xa6e6ff : 0x7f9be2) }
      },
      vertexShader: PULSAR_JET_VERTEX_SHADER,
      fragmentShader: PULSAR_JET_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const beamLength = index === 0 ? 7.8 : 7.2;
    const jet = new THREE.Mesh(new THREE.ConeGeometry(0.72, beamLength, 32, 1, true), material);
    jet.name = index === 0 ? 'pulsar-jet-upper' : 'pulsar-jet-lower';
    jet.position.y = direction * beamLength * 0.5;
    if (direction > 0) {
      jet.rotation.x = Math.PI;
    }
    jet.renderOrder = 1;
    jets.push(jet);
    jetMaterials.push(material);
    jetRig.add(jet);
  });

  group.add(jetRig);
  group.add(core);

  return { core, coreMaterial, haloPlanes, haloMaterials, jets, jetMaterials, jetRig };
}

function createDustMaterial(spec: (typeof ENTITY_SPECS)[number]) {
  return new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_motion: { value: 0 },
      u_opacity: { value: 0 },
      u_color: { value: spec.dust.clone() }
    },
    vertexShader: ENTITY_DUST_VERTEX_SHADER,
    fragmentShader: ENTITY_DUST_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
}

function createEntityDust(seed: number, kind: EntityKind) {
  const random = mulberry32(seed);
  const count = kind === 'black-hole' ? 260 : kind === 'star' ? 220 : kind === 'pulsar' ? 88 : 200;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    if (kind === 'black-hole') {
      const azimuth = random() * Math.PI * 2;
      const radius = 0.72 + Math.pow(random(), 0.68) * 3.35;
      const warpedAzimuth = azimuth + Math.sin(azimuth * 3.0 + seed * 0.01) * 0.14;
      const brokenBand = 0.72 + random() * 0.42;

      positions[index * 3] = Math.cos(warpedAzimuth) * radius * brokenBand;
      positions[index * 3 + 1] = (random() - 0.5) * (0.08 + radius * 0.055) + Math.sin(azimuth * 2.7) * 0.07;
      positions[index * 3 + 2] = Math.sin(warpedAzimuth) * radius * (0.7 + random() * 0.24);
      sizes[index] = 0.24 + random() * 0.9;
      phases[index] = random() * Math.PI * 2;
      continue;
    }

    if (kind === 'pulsar') {
      const radius = 1.65 + Math.pow(random(), 0.72) * 2.85;
      const azimuth = random() * Math.PI * 2;
      const elevation = (random() - 0.5) * 1.9;

      positions[index * 3] = Math.cos(azimuth) * radius * (0.76 + random() * 0.22);
      positions[index * 3 + 1] = elevation * radius * 0.54;
      positions[index * 3 + 2] = Math.sin(azimuth) * radius * (0.68 + random() * 0.18);
      sizes[index] = 0.13 + random() * 0.42;
      phases[index] = random() * Math.PI * 2;
      continue;
    }

    const radius = 0.18 + Math.pow(random(), 0.58) * (kind === 'star' ? 3.8 : 3.4);
    const azimuth = random() * Math.PI * 2;
    const polarCosine = random() * 2 - 1;
    const polarSine = Math.sqrt(1 - polarCosine * polarCosine);
    const lobe = Math.floor(random() * 3);
    const lobeX = lobe === 0 ? -0.72 : lobe === 1 ? 0.64 : 0.12;
    const lobeY = lobe === 0 ? 0.2 : lobe === 1 ? -0.46 : 0.72;
    const lobeZ = lobe === 0 ? 0.12 : lobe === 1 ? -0.36 : 0.48;
    let x = lobeX + Math.cos(azimuth) * polarSine * radius;
    let y = lobeY + polarCosine * radius;
    let z = lobeZ + Math.sin(azimuth) * polarSine * radius;

    if (kind === 'neutron-star') {
      x *= 0.48 + random() * 0.26;
      y *= 1.18;
      z *= 0.52 + random() * 0.3;
      x += Math.sin(y * 0.7) * 0.24;
    } else {
      x *= 1.08;
      y *= 0.82;
      z *= 0.94;
    }

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
    sizes[index] = 0.2 + random() * (kind === 'star' ? 1.08 : 0.82);

    phases[index] = random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  return geometry;
}

function createStarField(seed: number, options: StarFieldOptions) {
  const random = mulberry32(seed);
  const { count, sizeScale, initialOpacity, zNear, zFar, depthScale } = options;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkles = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const z = zNear + random() * (zFar - zNear);
    const depthSpread = 15 + Math.abs(z) * depthScale;
    positions[index * 3] = (random() - 0.5) * depthSpread;
    positions[index * 3 + 1] = (random() - 0.5) * depthSpread * 0.64;
    positions[index * 3 + 2] = z;
    sizes[index] = (0.16 + random() * 1.02) * sizeScale;
    twinkles[index] = 0.6 + random() * 1.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      u_time: { value: 0 },
      u_motion: { value: 0 },
      u_opacity: { value: initialOpacity },
      u_color: { value: new THREE.Color(0xd9f6ff) }
    },
    vertexShader: STAR_VERTEX_SHADER,
    fragmentShader: STAR_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  return new THREE.Points(geometry, material);
}

export function CosmicThreeScene({
  projects,
  activeIndex,
  projectOpacities,
  scrollProgress,
  transitIntensity,
  transitPhase,
  reducedMotion
}: CosmicThreeSceneProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointer = useAtlasStore((state) => state.pointer);
  const runtimeRef = useRef<SceneRuntimeState>({
    activeIndex,
    projectOpacities,
    scrollProgress,
    transitIntensity,
    transitPhase,
    reducedMotion,
    pointer
  });
  const projectKey = useMemo(
    () => projects.map((project) => `${project.codename}:${project.coordinates.x}:${project.coordinates.y}`).join('|'),
    [projects]
  );

  useEffect(() => {
    runtimeRef.current = {
      activeIndex,
      projectOpacities,
      scrollProgress,
      transitIntensity,
      transitPhase,
      reducedMotion,
      pointer
    };
  }, [activeIndex, projectOpacities, pointer, reducedMotion, scrollProgress, transitIntensity, transitPhase]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (error) {
      root.dataset.webgl = 'unavailable';
      console.warn('CosmicThreeScene: WebGL renderer unavailable.', error);

      return () => {
        delete root.dataset.webgl;
      };
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 0.8));
    renderer.domElement.className = 'three-cosmic-scene';
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030612, 0.012);

    const camera = new THREE.PerspectiveCamera(CAMERA_BASE_FOV, 1, 0.08, 220);
    camera.position.set(0, 0.1, 8.7);

    const starFieldLayers: StarFieldLayer[] = [
      {
        field: createStarField(24731, {
          count: 1200,
          sizeScale: 0.68,
          initialOpacity: 0.3,
          zNear: -195,
          zFar: -18,
          depthScale: 0.34
        }),
        baseOpacity: 0.3,
        pointerParallax: 0.0016,
        driftRate: 0.00014
      },
      {
        field: createStarField(35171, {
          count: 640,
          sizeScale: 0.92,
          initialOpacity: 0.4,
          zNear: -145,
          zFar: 10,
          depthScale: 0.27
        }),
        baseOpacity: 0.4,
        pointerParallax: 0.005,
        driftRate: 0.00042
      },
      {
        field: createStarField(48917, {
          count: 150,
          sizeScale: 1.32,
          initialOpacity: 0.24,
          zNear: -96,
          zFar: 18,
          depthScale: 0.19
        }),
        baseOpacity: 0.24,
        pointerParallax: 0.011,
        driftRate: 0.001
      }
    ];
    starFieldLayers.forEach(({ field }) => scene.add(field));

    const fieldGeometry = new THREE.BoxGeometry(1, 1, 1);
    const entityHandles: CosmicEntityHandle[] = projects.map((project, index) => {
      const spec = ENTITY_SPECS[index % ENTITY_SPECS.length];
      const random = mulberry32(503 + index * 137);
      const group = new THREE.Group();
      const basePosition = projectPosition(project, index);
      const baseScale = 1.04 + index * 0.08;
      const fieldMaterial = spec.kind === 'pulsar' ? null : createFieldMaterial(spec, 8.1 + index * 5.7);
      const dustMaterial = createDustMaterial(spec);
      const field = fieldMaterial ? new THREE.Mesh(fieldGeometry, fieldMaterial) : null;
      const dust = new THREE.Points(createEntityDust(1301 + index * 313, spec.kind), dustMaterial);
      const pulsar = spec.kind === 'pulsar' ? createPulsar(group) : null;

      if (field) {
        field.scale.set(
          spec.kind === 'black-hole' ? 7.5 : spec.kind === 'star' ? 6.7 : 5.9,
          spec.kind === 'black-hole' ? 4.8 : spec.kind === 'star' ? 5.9 : 7.2,
          spec.kind === 'black-hole' ? 6.5 : spec.kind === 'star' ? 5.8 : 5.7
        );
        if (spec.kind === 'black-hole') {
          field.rotation.set(1.18 + random() * 0.14, (random() - 0.5) * 0.3, (random() - 0.5) * 0.34);
        } else if (spec.kind === 'neutron-star') {
          field.rotation.set((random() - 0.5) * 0.18, (random() - 0.5) * 0.28, 0.18 + random() * 0.24);
        } else {
          field.rotation.set((random() - 0.5) * 0.34, (random() - 0.5) * 0.46, (random() - 0.5) * 0.5);
        }
      }
      if (spec.kind === 'black-hole') {
        dust.rotation.copy(field?.rotation ?? new THREE.Euler());
      } else {
        dust.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      }
      if (field) {
        field.renderOrder = 1;
      }
      dust.renderOrder = spec.kind === 'pulsar' ? 6 : 2;

      if (field) {
        group.add(field);
      }
      group.add(dust);
      group.position.copy(basePosition);
      group.scale.setScalar(baseScale);
      scene.add(group);

      return {
        group,
        field,
        dust,
        basePosition,
        baseScale,
        outerRadius: baseScale * (spec.kind === 'pulsar' ? 4.6 : 4.1),
        kind: spec.kind,
        fieldMaterial,
        dustMaterial,
        pulsar,
        rotationBias: new THREE.Vector3(0.05 + random() * 0.04, 0.035 + random() * 0.035, 0.025 + random() * 0.025),
        pulseOffset: random() * Math.PI * 2,
        cameraLocal: new THREE.Vector3()
      };
    });

    const resize = () => {
      const width = Math.max(1, root.clientWidth);
      const height = Math.max(1, root.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    window.addEventListener('resize', resize);

    const originCamera = new THREE.Vector3(0, 0.18, 9.2);
    const originLook = new THREE.Vector3(0, 0.08, -8);
    const worldUp = new THREE.Vector3(0, 1, 0);
    const lookTarget = originLook.clone();
    const cameraTarget = originCamera.clone();
    const sourceCamera = new THREE.Vector3();
    const sourceLook = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const side = new THREE.Vector3();
    const lift = new THREE.Vector3();
    const routeDirection = new THREE.Vector3();
    const routeSide = new THREE.Vector3();
    const routeLift = new THREE.Vector3();
    const controlA = new THREE.Vector3();
    const controlB = new THREE.Vector3();
    const arrivalPosition = new THREE.Vector3();
    const arrivalLook = new THREE.Vector3();
    let lastSettledIndex = -1;
    let frameId = 0;

    const setBasis = (
      from: THREE.Vector3,
      to: THREE.Vector3,
      basisDirection: THREE.Vector3,
      basisSide: THREE.Vector3,
      basisLift: THREE.Vector3
    ) => {
      basisDirection.copy(to).sub(from);

      if (basisDirection.lengthSq() < 0.0001) {
        basisDirection.set(0, 0, -1);
      } else {
        basisDirection.normalize();
      }

      basisSide.crossVectors(basisDirection, worldUp);

      if (basisSide.lengthSq() < 0.0001) {
        basisSide.set(1, 0, 0);
      } else {
        basisSide.normalize();
      }

      basisLift.crossVectors(basisSide, basisDirection);

      if (basisLift.lengthSq() < 0.0001) {
        basisLift.copy(worldUp);
      } else {
        basisLift.normalize();
      }
    };

    const setSettledPose = (index: number, position: THREE.Vector3, look: THREE.Vector3) => {
      const handle = entityHandles[index];

      if (!handle) {
        position.copy(originCamera);
        look.copy(originLook);
        return;
      }

      const previousFocus = index > 0 ? entityHandles[index - 1].basePosition : originLook;
      setBasis(previousFocus, handle.basePosition, routeDirection, routeSide, routeLift);

      if (index % 2 === 0) {
        routeSide.negate();
      }

      const observationDepth =
        handle.kind === 'pulsar' ? 4.3 : handle.kind === 'black-hole' ? 4.0 : handle.kind === 'star' ? 3.85 : 3.7;
      position
        .copy(handle.basePosition)
        .addScaledVector(routeDirection, -handle.outerRadius * observationDepth)
        .addScaledVector(routeSide, handle.outerRadius * 0.1)
        .addScaledVector(routeLift, handle.outerRadius * 0.06);

      if (handle.kind === 'pulsar') {
        const halfViewportHeight =
          position.distanceTo(handle.basePosition) * Math.tan(THREE.MathUtils.degToRad(CAMERA_BASE_FOV * 0.5));

        // The right-hand copy needs an uncluttered counterpart on the left.
        // This line of sight places the compact core at roughly x=34%, y=48%.
        look
          .copy(handle.basePosition)
          .addScaledVector(routeDirection, handle.outerRadius * 0.32)
          .addScaledVector(routeSide, halfViewportHeight * camera.aspect * 0.32)
          .addScaledVector(routeLift, -halfViewportHeight * 0.04);
        return;
      }

      look
        .copy(handle.basePosition)
        .addScaledVector(routeDirection, handle.outerRadius * 0.32)
        .addScaledVector(routeSide, handle.outerRadius * 0.06)
        .addScaledVector(routeLift, handle.outerRadius * 0.03);
    };

    const render = (timestamp: number) => {
      if (document.hidden) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      const runtime = runtimeRef.current;
      const time = runtime.reducedMotion ? 18 : timestamp * 0.001;
      const pointerX = runtime.reducedMotion ? 0 : runtime.pointer.x;
      const pointerY = runtime.reducedMotion ? 0 : runtime.pointer.y;
      const activeHandle = runtime.activeIndex >= 0 ? entityHandles[runtime.activeIndex] : null;
      if (runtime.activeIndex >= 0) {
        lastSettledIndex = runtime.activeIndex;
      }
      const stationaryIndex = runtime.activeIndex >= 0 ? runtime.activeIndex : runtime.scrollProgress > 0.18 ? lastSettledIndex : -1;
      const transitActive =
        !runtime.reducedMotion && runtime.activeIndex >= 0 && runtime.transitPhase > 0 && runtime.transitPhase < 1;
      const observeTarget = transitActive ? smoothRange(runtime.transitPhase, 0.04, 0.92) : 0;
      const cameraTravel = transitActive ? smoothRange(runtime.transitPhase, 0.14, 0.96) : 0;
      const cloudEntry = transitActive ? smoothRange(runtime.transitPhase, 0.62, 0.92) : 0;
      const motionAmount = transitActive ? runtime.transitIntensity * (0.28 + cameraTravel * 0.72) : 0;

      if (transitActive && activeHandle) {
        setSettledPose(runtime.activeIndex - 1, sourceCamera, sourceLook);

        const sourceFocus = runtime.activeIndex > 0 ? entityHandles[runtime.activeIndex - 1].basePosition : originLook;
        setBasis(sourceFocus, activeHandle.basePosition, direction, side, lift);

        if (runtime.activeIndex % 2 === 0) {
          side.negate();
        }

        const travelDistance = sourceCamera.distanceTo(activeHandle.basePosition);
        const radius = activeHandle.outerRadius;
        setSettledPose(runtime.activeIndex, arrivalPosition, arrivalLook);
        controlA
          .copy(sourceCamera)
          .addScaledVector(direction, travelDistance * 0.34)
          .addScaledVector(side, radius * 0.64)
          .addScaledVector(lift, radius * 0.22);
        controlB
          .copy(arrivalPosition)
          .addScaledVector(direction, -travelDistance * 0.18)
          .addScaledVector(side, -radius * 0.22)
          .addScaledVector(lift, radius * 0.16);

        cubicBezier(sourceCamera, controlA, controlB, arrivalPosition, cameraTravel, cameraTarget);
        lookTarget.copy(sourceLook).lerp(arrivalLook, observeTarget);
        lookTarget.addScaledVector(side, pointerX * radius * 0.035).addScaledVector(lift, pointerY * radius * 0.025);
      } else {
        setSettledPose(stationaryIndex, cameraTarget, lookTarget);
      }

      const pulsarInView = activeHandle?.kind === 'pulsar' && (transitActive || stationaryIndex === runtime.activeIndex);
      const pulsarDriftProgress = pulsarInView
        ? transitActive
          ? smoothRange(runtime.transitPhase, 0.34, 0.92)
          : 1
        : 0;
      if (!runtime.reducedMotion && pulsarDriftProgress > 0 && activeHandle) {
        const driftX = Math.sin(time * 0.12 + activeHandle.pulseOffset) * 0.07 * pulsarDriftProgress;
        const driftY = Math.cos(time * 0.095 + activeHandle.pulseOffset * 0.7) * 0.05 * pulsarDriftProgress;

        cameraTarget.x += driftX;
        cameraTarget.y += driftY;
        lookTarget.x += driftX * 0.58;
        lookTarget.y += driftY * 0.58;
      }

      camera.fov = CAMERA_BASE_FOV - motionAmount * 4;
      camera.updateProjectionMatrix();
      camera.position.copy(cameraTarget);
      camera.lookAt(lookTarget);

      starFieldLayers.forEach((layer, index) => {
        const starMaterial = layer.field.material as THREE.ShaderMaterial;
        const depthLift = index === 2 ? 0.04 : index === 1 ? 0.025 : 0.012;

        starMaterial.uniforms.u_time.value = time;
        starMaterial.uniforms.u_motion.value = motionAmount * (index === 0 ? 0.65 : index === 1 ? 0.82 : 1);
        starMaterial.uniforms.u_opacity.value = layer.baseOpacity + Math.min(depthLift, motionAmount * 0.05);
        layer.field.rotation.y = time * layer.driftRate + pointerX * layer.pointerParallax;
        layer.field.rotation.x = -time * layer.driftRate * 0.68 + pointerY * layer.pointerParallax * 0.72;
        layer.field.position.x = pointerX * layer.pointerParallax * 8;
        layer.field.position.y = pointerY * layer.pointerParallax * 5;
      });

      entityHandles.forEach((handle, index) => {
        const isActive = runtime.activeIndex === index;
        const narrativeOpacity = runtime.projectOpacities[index] ?? 0;
        const distanceToCamera = cameraTarget.distanceTo(handle.basePosition);
        const distanceDetail = saturate(1 - distanceToCamera / (handle.outerRadius * 7.4));
        const nearEntity = saturate(1 - distanceToCamera / (handle.outerRadius * 1.24));
        const distantPresence = THREE.MathUtils.clamp(1 - distanceToCamera / 118, 0.08, 0.58);
        const transitTargetPresence = transitActive && isActive ? 0.28 + cameraTravel * 0.28 + cloudEntry * 0.18 : 0;
        const opacity = Math.min(
          1,
          0.08 + distantPresence * 0.28 + narrativeOpacity * 0.34 + transitTargetPresence + distanceDetail * 0.28
        );
        const activity = Math.min(1, distanceDetail * 0.8 + (transitActive && isActive ? motionAmount * 0.48 : 0));
        const dustOpacity =
          handle.kind === 'pulsar'
            ? opacity * (0.08 + distanceDetail * 0.28 + nearEntity * 0.12)
            : opacity *
              (handle.kind === 'neutron-star'
                ? 0.28 + distanceDetail * 0.62 + nearEntity * 0.4
                : 0.24 + distanceDetail * 0.52 + nearEntity * 0.3);
        const pulsarEntryProgress =
          handle.pulsar && transitActive && isActive ? smoothRange(runtime.transitPhase, 0.16, 0.88) : 1;
        const pulsarEntry = handle.pulsar && transitActive && isActive ? 0.45 + pulsarEntryProgress * 0.55 : 1;
        const pulsarArrivalFlare =
          handle.pulsar && transitActive && isActive
            ? smoothRange(runtime.transitPhase, 0.48, 0.7) * (1 - smoothRange(runtime.transitPhase, 0.7, 0.98))
            : 0;

        handle.group.position.copy(handle.basePosition);
        handle.group.scale.setScalar(handle.baseScale * (handle.pulsar ? 0.9 + pulsarEntry * 0.1 : 1));
        handle.group.visible = handle.pulsar ? isActive || opacity > 0.05 : opacity > 0.012;

        if (handle.pulsar) {
          const pulsar = handle.pulsar;
          const baselinePresence = saturate((opacity - 0.03) / 0.72);
          const pulsarPresence = Math.max(isActive ? 0.84 : 0, baselinePresence) * pulsarEntry;
          const pulsarPulse = runtime.reducedMotion ? 0.5 : 0.5 + Math.sin(time * 2.02 + handle.pulseOffset) * 0.5;
          const corePulse = 0.965 + pulsarPulse * 0.07;
          const coreParallaxX = pointerX * 0.045;
          const coreParallaxY = pointerY * 0.032;

          handle.group.rotation.set(0, 0, 0);
          pulsar.core.visible = pulsarPresence > 0.012;
          pulsar.core.position.set(coreParallaxX, coreParallaxY, 0);
          pulsar.core.rotation.set(
            runtime.reducedMotion ? 0 : Math.sin(time * 0.13 + handle.pulseOffset) * 0.025,
            runtime.reducedMotion ? 0 : time * 0.1,
            runtime.reducedMotion ? 0 : Math.cos(time * 0.16 + handle.pulseOffset) * 0.02
          );
          pulsar.coreMaterial.uniforms.u_time.value = time + handle.pulseOffset;
          pulsar.coreMaterial.uniforms.u_pulse.value = pulsarPulse;
          pulsar.coreMaterial.uniforms.u_intensity.value =
            (0.64 + pulsarPresence * 0.46) * corePulse * (1 + pulsarArrivalFlare * 0.12);
          pulsar.haloPlanes.forEach((halo, haloIndex) => {
            const baseOpacity = [0.46, 0.16, 0.032][haloIndex];
            const haloPulse = 0.96 + pulsarPulse * 0.08;

            halo.visible = pulsarPresence > 0.012;
            halo.position.set(coreParallaxX * 0.84, coreParallaxY * 0.84, 0);
            halo.quaternion.copy(camera.quaternion);
            pulsar.haloMaterials[haloIndex].uniforms.u_time.value = time + handle.pulseOffset;
            pulsar.haloMaterials[haloIndex].uniforms.u_pulse.value = pulsarPulse;
            pulsar.haloMaterials[haloIndex].uniforms.u_opacity.value =
              baseOpacity * pulsarPresence * haloPulse * (1 + pulsarArrivalFlare * 0.34);
          });
          pulsar.jetRig.position.set(coreParallaxX * 0.94, coreParallaxY * 0.94, 0);
          pulsar.jetRig.rotation.set(
            0.18 + (runtime.reducedMotion ? 0 : Math.sin(time * 0.31 + handle.pulseOffset) * 0.03),
            -0.22 + (runtime.reducedMotion ? 0 : Math.sin(time * 0.27 + handle.pulseOffset) * 0.062),
            0.56 + (runtime.reducedMotion ? 0 : Math.cos(time * 0.21 + handle.pulseOffset) * 0.03)
          );
          pulsar.jetMaterials.forEach((material, jetIndex) => {
            material.uniforms.u_time.value = time + handle.pulseOffset;
            material.uniforms.u_pulse.value = pulsarPulse;
            material.uniforms.u_opacity.value =
              (jetIndex === 0 ? 0.19 : 0.15) *
              pulsarPresence *
              pulsarEntryProgress *
              (0.98 + pulsarPulse * 0.1) *
              (1 + pulsarArrivalFlare * 0.16);
          });
          handle.dust.position.set(coreParallaxX * 1.35, coreParallaxY * 1.35, 0);
        } else if (handle.field && handle.fieldMaterial) {
          const entityFieldBase =
            handle.kind === 'black-hole'
              ? 0.3 + distanceDetail * 0.46 + (transitActive && isActive ? cloudEntry * 0.14 : 0)
              : handle.kind === 'star'
                ? 0.42 + distanceDetail * 0.62 + (transitActive && isActive ? cloudEntry * 0.18 : 0)
                : 0.36 + distanceDetail * 0.54 + (transitActive && isActive ? cloudEntry * 0.2 : 0);
          const fieldOpacity = Math.min(0.82, opacity * entityFieldBase * 0.82);
          const stepCount = Math.min(25, Math.round(8 + distanceDetail * 13 + (isActive ? 4 : 0)));
          const volumeVisible = isActive || (distanceToCamera < 38 && narrativeOpacity > 0.16);

          handle.group.rotation.x += runtime.reducedMotion ? 0 : handle.rotationBias.x * 0.0012;
          handle.group.rotation.y += runtime.reducedMotion ? 0 : handle.rotationBias.y * 0.0018;
          handle.group.rotation.z += runtime.reducedMotion ? 0 : handle.rotationBias.z * 0.001;
          handle.field.updateWorldMatrix(true, false);
          handle.field.visible = volumeVisible && fieldOpacity > 0.012;
          handle.cameraLocal.copy(camera.position);
          handle.field.worldToLocal(handle.cameraLocal);

          handle.fieldMaterial.uniforms.u_time.value = time + handle.pulseOffset;
          handle.fieldMaterial.uniforms.u_activity.value = activity;
          handle.fieldMaterial.uniforms.u_detail.value = distanceDetail;
          handle.fieldMaterial.uniforms.u_stepCount.value = stepCount;
          handle.fieldMaterial.uniforms.u_opacity.value = fieldOpacity;
          handle.fieldMaterial.uniforms.u_cameraLocal.value.copy(handle.cameraLocal);
        }
        handle.dustMaterial.uniforms.u_time.value = time + handle.pulseOffset;
        handle.dustMaterial.uniforms.u_motion.value = activity;
        handle.dustMaterial.uniforms.u_opacity.value = dustOpacity;
      });

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      entityHandles.forEach((handle) => {
        handle.fieldMaterial?.dispose();
        handle.dustMaterial.dispose();
        handle.dust.geometry.dispose();
        if (handle.pulsar) {
          handle.pulsar.core.geometry.dispose();
          handle.pulsar.coreMaterial.dispose();
          handle.pulsar.haloPlanes.forEach((halo) => halo.geometry.dispose());
          handle.pulsar.haloMaterials.forEach((material) => material.dispose());
          handle.pulsar.jets.forEach((jet) => jet.geometry.dispose());
          handle.pulsar.jetMaterials.forEach((material) => material.dispose());
        }
      });
      fieldGeometry.dispose();
      starFieldLayers.forEach(({ field }) => {
        field.geometry.dispose();
        (field.material as THREE.ShaderMaterial).dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [projectKey, projects]);

  return <div ref={rootRef} className="cosmic-three-root" aria-hidden="true" />;
}
