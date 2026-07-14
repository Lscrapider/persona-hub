import {
  CONNECTOR_DOT_OPACITY,
  getKineticSceneLayout,
  getKineticTrackFont,
  POINTER_DOT_OPACITY,
  TRACK_TEXT_OPACITY,
  type KineticPalette,
  type KineticPointer,
  type KineticSceneLayout,
  type KineticSurfaceGeometry,
  type SceneBounds,
} from "@/features/home/kineticTypeFieldRenderer";

const TAU = Math.PI * 2;
const GLYPH_ATLAS_SCALE = 2;
const GLYPH_ATLAS_PADDING = 2;
const GLYPH_ATLAS_LINE_HEIGHT = 1.6;
const SURFACE_SEGMENTS = 192;
const INSTANCE_FLOAT_COUNT = 7;

const SURFACE_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;

uniform vec2 uBounds;

void main() {
  vec2 normalized = aPosition / uBounds * 2.0 - 1.0;
  gl_Position = vec4(normalized.x, -normalized.y, 0.0, 1.0);
}`;

const SURFACE_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform vec3 uVoid;

out vec4 outColor;

void main() {
  outColor = vec4(uVoid, 1.0);
}`;

const GLYPH_VERTEX_SHADER = `#version 300 es
precision highp float;

const float TAU = 6.28318530718;

layout(location = 0) in vec2 aQuad;
layout(location = 1) in float aBaseAngle;
layout(location = 2) in float aDirection;
layout(location = 3) in float aDuration;
layout(location = 4) in float aPhase;
layout(location = 5) in float aRadius;
layout(location = 6) in float aGlyphSlot;
layout(location = 7) in float aConnector;

uniform vec2 uBounds;
uniform vec2 uSurfaceCenter;
uniform float uElapsedSeconds;
uniform vec3 uPointer;
uniform vec2 uGlyphSize;
uniform float uAtlasColumns;
uniform float uDotSlot;

out vec2 vUv;
out float vOpacity;

void main() {
  float angle = aBaseAngle + aPhase + aDirection * uElapsedSeconds / aDuration * TAU;
  vec2 radial = vec2(cos(angle), sin(angle));
  vec2 center = uSurfaceCenter + radial * aRadius;
  bool isPointerDot = uPointer.z > 0.0
    && aConnector < 0.5
    && distance(center, uPointer.xy) <= uPointer.z;
  float glyphSlot = isPointerDot ? uDotSlot : aGlyphSlot;
  vec2 tangent = vec2(-radial.y, radial.x);
  vec2 local = aQuad * uGlyphSize;
  vec2 rotated = vec2(
    tangent.x * local.x - tangent.y * local.y,
    tangent.y * local.x + tangent.x * local.y
  );
  vec2 position = center + rotated;
  vec2 normalized = position / uBounds * 2.0 - 1.0;

  gl_Position = vec4(normalized.x, -normalized.y, 0.0, 1.0);
  vUv = vec2(
    (glyphSlot + aQuad.x + 0.5) / uAtlasColumns,
    1.0 - (aQuad.y + 0.5)
  );
  vOpacity = aConnector > 0.5
    ? ${CONNECTOR_DOT_OPACITY.toFixed(2)}
    : (isPointerDot ? ${POINTER_DOT_OPACITY.toFixed(2)} : ${TRACK_TEXT_OPACITY.toFixed(2)});
}`;

const GLYPH_FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform sampler2D uGlyphAtlas;
uniform vec3 uBone;

in vec2 vUv;
in float vOpacity;

out vec4 outColor;

void main() {
  float alpha = texture(uGlyphAtlas, vUv).a;

  if (alpha <= 0.001) {
    discard;
  }

  outColor = vec4(uBone, alpha * vOpacity);
}`;

export type KineticWebglFrame = Readonly<{
  elapsed: number;
  palette: KineticPalette;
  pointer: KineticPointer | null;
}>;

export type KineticWebglRenderer = Readonly<{
  destroy: () => void;
  render: (frame: KineticWebglFrame) => void;
}>;

type RgbColor = readonly [number, number, number];

type GlyphAtlas = Readonly<{
  canvas: HTMLCanvasElement;
  columns: number;
  dotSlot: number;
  glyphHeight: number;
  glyphWidth: number;
  slots: ReadonlyMap<string, number>;
}>;

type GlyphResources = Readonly<{
  atlas: GlyphAtlas;
  instanceCount: number;
  texture: WebGLTexture;
}>;

type SurfaceUniforms = Readonly<{
  bounds: WebGLUniformLocation;
  voidColor: WebGLUniformLocation;
}>;

type GlyphUniforms = Readonly<{
  atlas: WebGLUniformLocation;
  atlasColumns: WebGLUniformLocation;
  bone: WebGLUniformLocation;
  bounds: WebGLUniformLocation;
  dotSlot: WebGLUniformLocation;
  elapsedSeconds: WebGLUniformLocation;
  glyphSize: WebGLUniformLocation;
  pointer: WebGLUniformLocation;
  surfaceCenter: WebGLUniformLocation;
}>;

function getUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const uniform = gl.getUniformLocation(program, name);

  if (!uniform) {
    throw new Error("Missing WebGL uniform: " + name);
  }

  return uniform;
}

function compileShader(
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

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentSource,
  );

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) {
      gl.deleteShader(vertexShader);
    }
    if (fragmentShader) {
      gl.deleteShader(fragmentShader);
    }
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getArcSweep(surface: KineticSurfaceGeometry) {
  let sweep = surface.endAngle - surface.startAngle;

  if (sweep > 0) {
    sweep -= TAU;
  }

  return sweep;
}

function createSurfaceFan(
  bounds: SceneBounds,
  surface: KineticSurfaceGeometry,
) {
  const vertices = new Float32Array((SURFACE_SEGMENTS + 2) * 2);
  const sweep = getArcSweep(surface);

  vertices[0] = bounds.width;
  vertices[1] = 0;
  vertices[2] = surface.startX;
  vertices[3] = 0;

  for (let index = 1; index <= SURFACE_SEGMENTS; index += 1) {
    const progress = index / SURFACE_SEGMENTS;
    const angle = surface.startAngle + sweep * progress;
    const vertexOffset = (index + 1) * 2;

    vertices[vertexOffset] =
      surface.centerX + Math.cos(angle) * surface.radius;
    vertices[vertexOffset + 1] =
      surface.centerY + Math.sin(angle) * surface.radius;
  }

  return vertices;
}

function createGlyphAtlas(
  measurementContext: CanvasRenderingContext2D,
  layout: KineticSceneLayout,
  fontFamily: string,
): GlyphAtlas | null {
  const characters = Array.from(
    new Set([...layout.glyphs.map(({ character }) => character), "·"]),
  );
  const font = getKineticTrackFont(layout.baseFontSize, fontFamily);
  const padding = Math.max(GLYPH_ATLAS_PADDING, layout.baseFontSize * 0.2);

  measurementContext.font = font;
  const widestGlyph = characters.reduce(
    (width, character) =>
      Math.max(width, measurementContext.measureText(character).width),
    1,
  );
  const glyphWidth = Math.ceil(widestGlyph + padding * 2);
  const glyphHeight = Math.ceil(
    layout.baseFontSize * GLYPH_ATLAS_LINE_HEIGHT + padding * 2,
  );
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.ceil(glyphWidth * characters.length * GLYPH_ATLAS_SCALE));
  canvas.height = Math.max(1, Math.ceil(glyphHeight * GLYPH_ATLAS_SCALE));

  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.setTransform(GLYPH_ATLAS_SCALE, 0, 0, GLYPH_ATLAS_SCALE, 0, 0);
  context.fillStyle = "#ffffff";
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const slots = new Map<string, number>();
  characters.forEach((character, index) => {
    slots.set(character, index);
    context.fillText(
      character,
      glyphWidth * (index + 0.5),
      glyphHeight / 2,
    );
  });

  const dotSlot = slots.get("·");

  if (dotSlot === undefined) {
    return null;
  }

  return {
    canvas,
    columns: characters.length,
    dotSlot,
    glyphHeight,
    glyphWidth,
    slots,
  };
}

function createGlyphInstanceData(
  layout: KineticSceneLayout,
  atlas: GlyphAtlas,
) {
  const data = new Float32Array(
    layout.glyphs.length * INSTANCE_FLOAT_COUNT,
  );

  layout.glyphs.forEach((glyph, index) => {
    const glyphSlot = atlas.slots.get(glyph.character) ?? atlas.dotSlot;
    const offset = index * INSTANCE_FLOAT_COUNT;

    data[offset] = glyph.baseAngle;
    data[offset + 1] = glyph.direction;
    data[offset + 2] = glyph.duration;
    data[offset + 3] = glyph.phase;
    data[offset + 4] = glyph.radius;
    data[offset + 5] = glyphSlot;
    data[offset + 6] = glyph.isConnector ? 1 : 0;
  });

  return data;
}

function createColorResolver() {
  const canvas = document.createElement("canvas");

  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return null;
  }

  let cachedColor = "";
  let cachedRgb: RgbColor = [0, 0, 0];

  return (color: string): RgbColor => {
    if (color === cachedColor) {
      return cachedRgb;
    }

    context.clearRect(0, 0, 1, 1);
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

    cachedColor = color;
    cachedRgb = [
      (red ?? 0) / 255,
      (green ?? 0) / 255,
      (blue ?? 0) / 255,
    ];

    return cachedRgb;
  };
}

function configureSurfaceVertexArray(
  gl: WebGL2RenderingContext,
  vertexArray: WebGLVertexArrayObject,
  buffer: WebGLBuffer,
) {
  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
}

function configureGlyphVertexArray(
  gl: WebGL2RenderingContext,
  vertexArray: WebGLVertexArrayObject,
  quadBuffer: WebGLBuffer,
  instanceBuffer: WebGLBuffer,
) {
  const stride = INSTANCE_FLOAT_COUNT * Float32Array.BYTES_PER_ELEMENT;

  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  for (let attribute = 1; attribute <= INSTANCE_FLOAT_COUNT; attribute += 1) {
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(
      attribute,
      1,
      gl.FLOAT,
      false,
      stride,
      (attribute - 1) * Float32Array.BYTES_PER_ELEMENT,
    );
    gl.vertexAttribDivisor(attribute, 1);
  }

  gl.bindVertexArray(null);
}

function setCanvasSize(
  canvas: HTMLCanvasElement,
  bounds: SceneBounds,
  pixelRatio: number,
) {
  const width = Math.max(1, Math.round(bounds.width * pixelRatio));
  const height = Math.max(1, Math.round(bounds.height * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

export function createKineticWebglRenderer(
  canvas: HTMLCanvasElement,
  options: Readonly<{
    bounds: SceneBounds;
    fontFamily: string;
    onContextLost: () => void;
    pixelRatio: number;
  }>,
): KineticWebglRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: true,
  });

  if (!gl) {
    return null;
  }

  const measurementCanvas = document.createElement("canvas");
  const measurementContext = measurementCanvas.getContext("2d");
  const resolveColor = createColorResolver();
  const surfaceProgram = createProgram(
    gl,
    SURFACE_VERTEX_SHADER,
    SURFACE_FRAGMENT_SHADER,
  );
  const glyphProgram = createProgram(
    gl,
    GLYPH_VERTEX_SHADER,
    GLYPH_FRAGMENT_SHADER,
  );
  const surfaceVertexArray = gl.createVertexArray();
  const surfaceBuffer = gl.createBuffer();
  const glyphVertexArray = gl.createVertexArray();
  const glyphQuadBuffer = gl.createBuffer();
  const glyphInstanceBuffer = gl.createBuffer();

  if (
    !measurementContext ||
    !resolveColor ||
    !surfaceProgram ||
    !glyphProgram ||
    !surfaceVertexArray ||
    !surfaceBuffer ||
    !glyphVertexArray ||
    !glyphQuadBuffer ||
    !glyphInstanceBuffer
  ) {
    if (surfaceProgram) {
      gl.deleteProgram(surfaceProgram);
    }
    if (glyphProgram) {
      gl.deleteProgram(glyphProgram);
    }
    if (surfaceVertexArray) {
      gl.deleteVertexArray(surfaceVertexArray);
    }
    if (surfaceBuffer) {
      gl.deleteBuffer(surfaceBuffer);
    }
    if (glyphVertexArray) {
      gl.deleteVertexArray(glyphVertexArray);
    }
    if (glyphQuadBuffer) {
      gl.deleteBuffer(glyphQuadBuffer);
    }
    if (glyphInstanceBuffer) {
      gl.deleteBuffer(glyphInstanceBuffer);
    }
    return null;
  }

  let surfaceUniforms: SurfaceUniforms;
  let glyphUniforms: GlyphUniforms;

  try {
    surfaceUniforms = {
      bounds: getUniform(gl, surfaceProgram, "uBounds"),
      voidColor: getUniform(gl, surfaceProgram, "uVoid"),
    };
    glyphUniforms = {
      atlas: getUniform(gl, glyphProgram, "uGlyphAtlas"),
      atlasColumns: getUniform(gl, glyphProgram, "uAtlasColumns"),
      bone: getUniform(gl, glyphProgram, "uBone"),
      bounds: getUniform(gl, glyphProgram, "uBounds"),
      dotSlot: getUniform(gl, glyphProgram, "uDotSlot"),
      elapsedSeconds: getUniform(gl, glyphProgram, "uElapsedSeconds"),
      glyphSize: getUniform(gl, glyphProgram, "uGlyphSize"),
      pointer: getUniform(gl, glyphProgram, "uPointer"),
      surfaceCenter: getUniform(gl, glyphProgram, "uSurfaceCenter"),
    };
  } catch {
    gl.deleteProgram(surfaceProgram);
    gl.deleteProgram(glyphProgram);
    gl.deleteVertexArray(surfaceVertexArray);
    gl.deleteBuffer(surfaceBuffer);
    gl.deleteVertexArray(glyphVertexArray);
    gl.deleteBuffer(glyphQuadBuffer);
    gl.deleteBuffer(glyphInstanceBuffer);
    return null;
  }

  configureSurfaceVertexArray(gl, surfaceVertexArray, surfaceBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, glyphQuadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -0.5, -0.5,
      0.5, -0.5,
      -0.5, 0.5,
      0.5, 0.5,
    ]),
    gl.STATIC_DRAW,
  );
  configureGlyphVertexArray(
    gl,
    glyphVertexArray,
    glyphQuadBuffer,
    glyphInstanceBuffer,
  );

  let bounds = options.bounds;
  let pixelRatio = options.pixelRatio;
  let glyphResources: GlyphResources | null = null;
  let surface = getKineticSceneLayout(
    measurementContext,
    bounds,
    options.fontFamily,
  ).surface;
  let surfaceVertexCount = 0;
  let destroyed = false;

  const deleteGlyphResources = () => {
    if (!glyphResources) {
      return;
    }

    gl.deleteTexture(glyphResources.texture);
    glyphResources = null;
  };

  const rebuildScene = () => {
    const layout = getKineticSceneLayout(
      measurementContext,
      bounds,
      options.fontFamily,
    );
    const atlas = createGlyphAtlas(
      measurementContext,
      layout,
      options.fontFamily,
    );

    if (!atlas) {
      return false;
    }

    const texture = gl.createTexture();

    if (!texture) {
      return false;
    }

    deleteGlyphResources();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      atlas.canvas,
    );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    const instances = createGlyphInstanceData(layout, atlas);

    gl.bindBuffer(gl.ARRAY_BUFFER, glyphInstanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instances, gl.STATIC_DRAW);
    configureGlyphVertexArray(
      gl,
      glyphVertexArray,
      glyphQuadBuffer,
      glyphInstanceBuffer,
    );

    surface = layout.surface;
    const surfaceVertices = createSurfaceFan(bounds, surface);

    surfaceVertexCount = surfaceVertices.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, surfaceVertices, gl.STATIC_DRAW);
    glyphResources = {
      atlas,
      instanceCount: layout.glyphs.length,
      texture,
    };

    return true;
  };

  const configureScene = (
    nextBounds: SceneBounds,
    nextPixelRatio: number,
  ) => {
    bounds = nextBounds;
    pixelRatio = nextPixelRatio;
    setCanvasSize(canvas, bounds, pixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);

    return rebuildScene();
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();

    if (!destroyed) {
      options.onContextLost();
    }
  };

  canvas.addEventListener("webglcontextlost", handleContextLost);

  if (!configureScene(bounds, pixelRatio)) {
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    gl.deleteProgram(surfaceProgram);
    gl.deleteProgram(glyphProgram);
    gl.deleteVertexArray(surfaceVertexArray);
    gl.deleteBuffer(surfaceBuffer);
    gl.deleteVertexArray(glyphVertexArray);
    gl.deleteBuffer(glyphQuadBuffer);
    gl.deleteBuffer(glyphInstanceBuffer);
    return null;
  }

  const render = (frame: KineticWebglFrame) => {
    if (destroyed || gl.isContextLost() || !glyphResources) {
      return;
    }

    const bone = resolveColor(frame.palette.bone);
    const voidColor = resolveColor(frame.palette.void);
    const pointer = frame.pointer?.active
      ? frame.pointer
      : { active: false, radius: 0, x: 0, y: 0 };

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.enable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.stencilMask(0xff);
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.clearColor(0, 0, 0, 0);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    gl.useProgram(surfaceProgram);
    gl.bindVertexArray(surfaceVertexArray);
    gl.uniform2f(surfaceUniforms.bounds, bounds.width, bounds.height);
    gl.uniform3f(surfaceUniforms.voidColor, ...voidColor);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, surfaceVertexCount);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.stencilMask(0x00);
    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    gl.useProgram(glyphProgram);
    gl.bindVertexArray(glyphVertexArray);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, glyphResources.texture);
    gl.uniform1i(glyphUniforms.atlas, 0);
    gl.uniform1f(glyphUniforms.atlasColumns, glyphResources.atlas.columns);
    gl.uniform3f(glyphUniforms.bone, ...bone);
    gl.uniform2f(glyphUniforms.bounds, bounds.width, bounds.height);
    gl.uniform1f(glyphUniforms.dotSlot, glyphResources.atlas.dotSlot);
    gl.uniform1f(glyphUniforms.elapsedSeconds, frame.elapsed / 1000);
    gl.uniform2f(
      glyphUniforms.glyphSize,
      glyphResources.atlas.glyphWidth,
      glyphResources.atlas.glyphHeight,
    );
    gl.uniform3f(
      glyphUniforms.pointer,
      pointer.x,
      pointer.y,
      pointer.active ? pointer.radius : 0,
    );
    gl.uniform2f(
      glyphUniforms.surfaceCenter,
      surface.centerX,
      surface.centerY,
    );
    gl.drawArraysInstanced(
      gl.TRIANGLE_STRIP,
      0,
      4,
      glyphResources.instanceCount,
    );

    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.stencilMask(0xff);
  };

  const destroy = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    deleteGlyphResources();
    gl.deleteProgram(surfaceProgram);
    gl.deleteProgram(glyphProgram);
    gl.deleteVertexArray(surfaceVertexArray);
    gl.deleteBuffer(surfaceBuffer);
    gl.deleteVertexArray(glyphVertexArray);
    gl.deleteBuffer(glyphQuadBuffer);
    gl.deleteBuffer(glyphInstanceBuffer);
  };

  return { destroy, render };
}
