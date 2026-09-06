import {
  type ArchiveMotionSnapshot,
  type ArchiveSemanticPoint,
} from "@/effects/webgl/archiveStageContract";
import {
  getKineticPointerRadius,
  type KineticPalette,
  type SceneBounds,
} from "@/features/home/kineticTypeFieldScene";
import { createKineticWebglRenderer } from "@/features/home/kineticTypeFieldWebglRenderer";

const MAX_PROJECT_CHOICES = 8;
const MAX_PROJECT_NODES = 12;
const MAX_LOG_READER_NODES = 12;

const VERTEX_SHADER = `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 position = vec2(
    (gl_VertexID == 1) ? 3.0 : -1.0,
    (gl_VertexID == 2) ? 3.0 : -1.0
  );
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform float uScenePosition;
uniform float uInteractionEnergy;
uniform float uLogProgress;
uniform float uProjectChoiceCount;
uniform vec3 uProjectChoices[8];
uniform float uProjectDetailAvailable;
uniform vec2 uProjectDetail;
uniform float uProjectNodeCount;
uniform vec2 uProjectNodes[12];
uniform float uLogRouteAvailable;
uniform vec2 uLogChoice;
uniform float uLogReaderCount;
uniform vec2 uLogReaderNodes[${MAX_LOG_READER_NODES}];
uniform vec3 uBone;
uniform vec3 uSignal;

out vec4 outColor;

float metricDistance(vec2 left, vec2 right) {
  vec2 scale = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  return length((left - right) * scale);
}

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 scale = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 scaledPoint = point * scale;
  vec2 scaledStart = start * scale;
  vec2 scaledEnd = end * scale;
  vec2 line = scaledEnd - scaledStart;
  float amount = clamp(
    dot(scaledPoint - scaledStart, line) / max(dot(line, line), 0.00001),
    0.0,
    1.0
  );
  return length(scaledPoint - scaledStart - line * amount);
}

float lineMask(float distanceValue, float widthPixels) {
  float widthValue = widthPixels / max(uResolution.y, 1.0);
  float feather = 1.35 / max(uResolution.y, 1.0);
  return 1.0 - smoothstep(widthValue, widthValue + feather, distanceValue);
}

float ringMask(float distanceValue, float radiusPixels, float widthPixels) {
  float radius = radiusPixels / max(uResolution.y, 1.0);
  return lineMask(abs(distanceValue - radius), widthPixels);
}

float sceneWeight(float sceneIndex) {
  float distanceValue = abs(uScenePosition - sceneIndex);
  return 1.0 - smoothstep(0.08, 0.96, distanceValue);
}

vec4 projectsScene() {
  float weight = sceneWeight(2.0);

  if (weight <= 0.001) {
    return vec4(0.0);
  }

  float topology = 0.0;
  float choices = 0.0;
  float nodes = 0.0;
  vec2 activeChoice = uProjectDetail;
  float hasActiveChoice = 0.0;

  for (int index = 0; index < 8; index += 1) {
    if (float(index) >= uProjectChoiceCount) {
      continue;
    }

    vec3 choice = uProjectChoices[index];
    float choiceDistance = metricDistance(vUv, choice.xy);
    choices = max(
      choices,
      ringMask(choiceDistance, mix(4.0, 9.0, choice.z), 1.1) *
        mix(0.16, 0.82, choice.z)
    );

    if (choice.z > 0.5) {
      activeChoice = choice.xy;
      hasActiveChoice = 1.0;
    }
  }

  if (uProjectDetailAvailable > 0.5 && hasActiveChoice > 0.5) {
    float route = lineMask(
      segmentDistance(vUv, activeChoice, uProjectDetail),
      0.9
    );
    vec2 packet = mix(
      activeChoice,
      uProjectDetail,
      fract(uTime * 0.18 + uInteractionEnergy * 0.16)
    );
    float packetGlow = 1.0 - smoothstep(
      0.0,
      10.0 / max(uResolution.y, 1.0),
      metricDistance(vUv, packet)
    );
    topology = max(topology, route * 0.56 + packetGlow * 0.74);

    for (int index = 0; index < 12; index += 1) {
      if (float(index) >= uProjectNodeCount) {
        continue;
      }

      vec2 node = uProjectNodes[index];
      float branch = lineMask(
        segmentDistance(vUv, uProjectDetail, node),
        0.62
      );
      float nodeDistance = metricDistance(vUv, node);
      topology = max(topology, branch * 0.16);
      nodes = max(nodes, ringMask(nodeDistance, 4.5, 0.9) * 0.28);
    }
  }

  float alpha = clamp(topology + choices + nodes, 0.0, 0.84);
  vec3 color = mix(uBone, uSignal, clamp(topology + choices * 0.68, 0.0, 1.0));
  return vec4(color, alpha * weight);
}

vec4 logsScene() {
  float weight = sceneWeight(3.0);

  if (weight <= 0.001 || uLogRouteAvailable < 0.5) {
    return vec4(0.0);
  }

  vec2 joinPoint = uLogReaderNodes[0];
  vec2 readerPosition = uLogReaderNodes[0];
  float nearestDistance = abs(joinPoint.y - uLogChoice.y);
  float readerRoute = 0.0;
  float progressIndex =
    clamp(uLogProgress, 0.0, 1.0) * max(1.0, uLogReaderCount - 1.0);

  for (int index = 0; index < ${MAX_LOG_READER_NODES}; index += 1) {
    if (float(index) >= uLogReaderCount) {
      continue;
    }

    vec2 node = uLogReaderNodes[index];
    float choiceDistance = abs(node.y - uLogChoice.y);

    if (choiceDistance < nearestDistance) {
      nearestDistance = choiceDistance;
      joinPoint = node;
    }

    if (float(index + 1) < uLogReaderCount) {
      vec2 nextNode = uLogReaderNodes[index + 1];
      readerRoute = max(
        readerRoute,
        lineMask(segmentDistance(vUv, node, nextNode), 0.68)
      );

      if (
        progressIndex >= float(index) &&
        progressIndex <= float(index + 1)
      ) {
        readerPosition = mix(node, nextNode, fract(progressIndex));
      }
    }
  }

  float selectionRoute = lineMask(
    segmentDistance(vUv, uLogChoice, joinPoint),
    0.82
  );
  float readerCursor = 1.0 - smoothstep(
    3.0 / max(uResolution.y, 1.0),
    13.0 / max(uResolution.y, 1.0),
    metricDistance(vUv, readerPosition)
  );
  float selectedNode = ringMask(metricDistance(vUv, uLogChoice), 7.0, 1.0);
  float alpha = clamp(
    selectionRoute * (0.34 + uInteractionEnergy * 0.3) +
    readerRoute * 0.2 +
    readerCursor * 0.88 +
    selectedNode * 0.5,
    0.0,
    0.88
  );
  vec3 color = mix(uBone, uSignal, clamp(readerCursor + selectedNode, 0.0, 1.0));
  return vec4(color, alpha * weight);
}

void main() {
  vec4 projects = projectsScene();
  vec4 logs = logsScene();
  float alpha = clamp(projects.a + logs.a, 0.0, 0.9);
  vec3 weightedColor =
    projects.rgb * projects.a +
    logs.rgb * logs.a;

  outColor = vec4(weightedColor / max(alpha, 0.0001), alpha);
}`;

type Rgb = readonly [number, number, number];

export type ArchiveWebglPalette = Readonly<{
  bone: string;
  signal: string;
  silver: string;
  void: string;
}>;

type ArchiveWebglRendererOptions = Readonly<{
  bounds: SceneBounds;
  fontFamily: string;
  heroBounds: SceneBounds;
  onContextLost: () => void;
  palette: ArchiveWebglPalette;
  pixelRatio: number;
}>;

export type ArchiveWebglRenderer = Readonly<{
  destroy: () => void;
  render: (snapshot: ArchiveMotionSnapshot) => void;
}>;

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const uniform = gl.getUniformLocation(program, name);

  if (!uniform) {
    throw new Error(`Missing archive stage uniform: ${name}`);
  }

  return uniform;
}

function createColorResolver() {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return null;
  }

  return (value: string, fallback: string): Rgb => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = fallback;
    context.fillStyle = value || fallback;
    context.fillRect(0, 0, 1, 1);
    const color = context.getImageData(0, 0, 1, 1).data;

    return [color[0]! / 255, color[1]! / 255, color[2]! / 255];
  };
}

function fillPoints(
  target: Float32Array,
  points: readonly ArchiveSemanticPoint[],
  snapshot: ArchiveMotionSnapshot,
  maximum: number,
  stride: 2 | 3,
) {
  target.fill(0);
  const count = Math.min(maximum, points.length);

  for (let index = 0; index < count; index += 1) {
    const point = points[index]!;
    const offset = index * stride;

    target[offset] = point.x / snapshot.viewportWidth;
    target[offset + 1] =
      1 - (point.y - snapshot.scrollY) / snapshot.viewportHeight;

    if (stride === 3) {
      target[offset + 2] = point.active ? 1 : 0;
    }
  }

  return count;
}

function viewportPoint(
  point: ArchiveSemanticPoint | null,
  snapshot: ArchiveMotionSnapshot,
) {
  if (!point) {
    return [0, 0] as const;
  }

  return [
    point.x / snapshot.viewportWidth,
    1 - (point.y - snapshot.scrollY) / snapshot.viewportHeight,
  ] as const;
}

export function createArchiveWebglRenderer(
  canvas: HTMLCanvasElement,
  options: ArchiveWebglRendererOptions,
): ArchiveWebglRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    powerPreference: "high-performance",
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: true,
  });

  if (!gl) {
    return null;
  }

  const kineticPalette: KineticPalette = {
    bone: options.palette.bone,
    void: options.palette.void,
  };
  const kinetic = createKineticWebglRenderer(canvas, {
    bounds: options.heroBounds,
    canvasBounds: options.bounds,
    fontFamily: options.fontFamily,
    onContextLost: options.onContextLost,
    pixelRatio: options.pixelRatio,
  });
  const program = createProgram(gl);
  const vertexArray = gl.createVertexArray();
  const resolveColor = createColorResolver();

  if (!kinetic || !program || !vertexArray || !resolveColor) {
    kinetic?.destroy();
    if (program) gl.deleteProgram(program);
    if (vertexArray) gl.deleteVertexArray(vertexArray);
    return null;
  }

  const uniformNames = [
    "uResolution",
    "uTime",
    "uScenePosition",
    "uInteractionEnergy",
    "uLogProgress",
    "uProjectChoiceCount",
    "uProjectChoices[0]",
    "uProjectDetailAvailable",
    "uProjectDetail",
    "uProjectNodeCount",
    "uProjectNodes[0]",
    "uLogRouteAvailable",
    "uLogChoice",
    "uLogReaderCount",
    "uLogReaderNodes[0]",
    "uBone",
    "uSignal",
  ] as const;
  const uniforms = Object.fromEntries(
    uniformNames.map((name) => [name, getUniform(gl, program, name)]),
  ) as Record<(typeof uniformNames)[number], WebGLUniformLocation>;
  const bone = resolveColor(options.palette.bone, "#f7f1e9");
  const signal = resolveColor(options.palette.signal, "#e6653c");
  const projectChoiceBuffer = new Float32Array(MAX_PROJECT_CHOICES * 3);
  const projectNodeBuffer = new Float32Array(MAX_PROJECT_NODES * 2);
  const logReaderBuffer = new Float32Array(MAX_LOG_READER_NODES * 2);
  let destroyed = false;

  const render = (snapshot: ArchiveMotionSnapshot) => {
    if (destroyed || gl.isContextLost()) {
      return;
    }

    const heroExit = Math.min(
      1,
      Math.max(0, (snapshot.scenePosition - 0.04) / 0.96),
    );

    if (snapshot.scenePosition < 1) {
      const heroScene = snapshot.semantics.heroScene;
      const heroViewport = {
        x: heroScene?.x ?? 0,
        y: (heroScene?.y ?? snapshot.scrollY) - snapshot.scrollY,
      };
      kinetic.render({
        elapsed: snapshot.elapsedMs,
        entryEnergy: Math.max(
          snapshot.entryEnergy,
          snapshot.interactionEnergy * 0.34,
        ),
        palette: kineticPalette,
        physics: null,
        pointer:
          snapshot.mode === "full" && snapshot.pointer.active
            ? {
                active: true,
                radius: getKineticPointerRadius(options.heroBounds),
                x:
                  snapshot.pointer.x * options.bounds.width - heroViewport.x,
                y:
                  snapshot.pointer.y * options.bounds.height - heroViewport.y,
              }
            : null,
        scrollVelocity: snapshot.scrollVelocity,
        transitionProgress: heroExit,
        viewport: heroViewport,
      });
    } else {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    }

    const projectChoiceCount = fillPoints(
      projectChoiceBuffer,
      snapshot.semantics.projectChoices,
      snapshot,
      MAX_PROJECT_CHOICES,
      3,
    );
    const projectNodeCount = fillPoints(
      projectNodeBuffer,
      snapshot.semantics.projectNodes,
      snapshot,
      MAX_PROJECT_NODES,
      2,
    );
    const projectDetail = viewportPoint(
      snapshot.semantics.projectDetail,
      snapshot,
    );
    const logChoice = viewportPoint(snapshot.semantics.logChoice, snapshot);
    const logReaderCount = fillPoints(
      logReaderBuffer,
      snapshot.semantics.logReaderNodes,
      snapshot,
      MAX_LOG_READER_NODES,
      2,
    );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.STENCIL_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.bindVertexArray(vertexArray);
    gl.uniform2f(uniforms.uResolution, options.bounds.width, options.bounds.height);
    gl.uniform1f(uniforms.uTime, snapshot.elapsedMs / 1_000);
    gl.uniform1f(uniforms.uScenePosition, snapshot.scenePosition);
    gl.uniform1f(uniforms.uInteractionEnergy, snapshot.interactionEnergy);
    gl.uniform1f(uniforms.uLogProgress, snapshot.logReadProgress);
    gl.uniform1f(uniforms.uProjectChoiceCount, projectChoiceCount);
    gl.uniform3fv(uniforms["uProjectChoices[0]"], projectChoiceBuffer);
    gl.uniform1f(
      uniforms.uProjectDetailAvailable,
      snapshot.semantics.projectDetail ? 1 : 0,
    );
    gl.uniform2f(uniforms.uProjectDetail, projectDetail[0], projectDetail[1]);
    gl.uniform1f(uniforms.uProjectNodeCount, projectNodeCount);
    gl.uniform2fv(uniforms["uProjectNodes[0]"], projectNodeBuffer);
    gl.uniform1f(
      uniforms.uLogRouteAvailable,
      snapshot.semantics.logChoice && logReaderCount > 1 ? 1 : 0,
    );
    gl.uniform2f(uniforms.uLogChoice, logChoice[0], logChoice[1]);
    gl.uniform1f(uniforms.uLogReaderCount, logReaderCount);
    gl.uniform2fv(uniforms["uLogReaderNodes[0]"], logReaderBuffer);
    gl.uniform3f(uniforms.uBone, bone[0], bone[1], bone[2]);
    gl.uniform3f(uniforms.uSignal, signal[0], signal[1], signal[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    kinetic.destroy();
    gl.deleteVertexArray(vertexArray);
    gl.deleteProgram(program);
  };

  return { destroy, render };
}
