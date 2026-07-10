const TAU = Math.PI * 2;

const SURFACE_ARC_RADIUS_FACTOR = 0.74;
const SURFACE_ENTRY_X_FACTOR = 0.398;
const SURFACE_EXIT_Y_FACTOR = 1.1;

const TRACK_COUNT = 38;
const TRACK_RADIUS_MAX = 0.97;
const TRACK_RADIUS_MIN = 0.16;
const NON_BREAKING_SPACE = "\u00a0";
const MIN_TRACK_FONT_SIZE = 7;
const MAX_TRACK_FONT_SIZE = 18;
const TRACK_FONT_SIZE_FACTOR = 0.018;
const TRACK_FONT_RADIAL_CLEARANCE = 0.66;
const TRACK_LETTER_SPACING = 4;
const TRACK_TEXT_OPACITY = 0.9;
const OUTER_TRACK_DURATION = 1200;
const INNER_TRACK_DURATION = 350;
const CONNECTOR_DOT_OPACITY = 0.28;
const POINTER_DOT_OPACITY = 0.52;
const INTERMITTENT_GAP_MULTIPLIER = 3;
const INTERMITTENT_TRACK_INDICES = new Set([
  1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37,
]);

const TRACK_COPY = [
  "AI AGENTS · JAVA · PYTHON · MOBILE SYSTEMS · DEPLOYMENT · RESEARCH NOTES · SYSTEM DESIGN · DATA FLOWS",
  "SERVICE SYSTEMS · PRODUCT ARCHIVES · JAVA · MOBILE SYSTEMS · RESEARCH NOTES · RELEASE ENGINEERING · PYTHON",
  "SYSTEM DESIGN · AI AGENTS · DEPLOYMENT · DATA FLOWS · MOBILE SYSTEMS · INTERFACES · RESEARCH NOTES",
  "PYTHON · PRODUCT SYSTEMS · JAVA · ARCHIVE METHODS · DEPLOYMENT · SERVICE LAYERS · AI AGENTS",
  "RESEARCH NOTES · DATA FLOWS · MOBILE SYSTEMS · SYSTEM DESIGN · DEPLOYMENT · INTERFACES",
  "AI AGENTS · JAVA · PYTHON · PRODUCT ARCHIVES · SERVICE SYSTEMS · RESEARCH NOTES",
  "PRODUCT SYSTEMS · DATA FLOWS · DEPLOYMENT · MOBILE SYSTEMS · RESEARCH NOTES · JAVA",
  "INTERFACES · AI AGENTS · SYSTEM DESIGN · PYTHON · SERVICE LAYERS · RESEARCH NOTES",
] as const;
const SEAM_CONNECTORS = ["AI", "PHY", "JAVA"] as const;

export const INITIAL_SCENE_BOUNDS = {
  height: 1000,
  width: 1600,
} as const;

export type SceneBounds = {
  height: number;
  width: number;
};

export type KineticPalette = Readonly<{
  bone: string;
  void: string;
}>;

export type KineticPointer = Readonly<{
  active: boolean;
  radius: number;
  x: number;
  y: number;
}>;

type OrbitTrack = Readonly<{
  direction: 1 | -1;
  duration: number;
  phase: number;
  radiusScale: number;
  seamConnector: (typeof SEAM_CONNECTORS)[number];
  text: string;
}>;

type SurfaceArcGeometry = Readonly<{
  centerX: number;
  centerY: number;
  endAngle: number;
  endY: number;
  radius: number;
  startAngle: number;
  startX: number;
}>;

type OrbitGeometry = Readonly<{
  radius: number;
  track: OrbitTrack;
}>;

type OrbitGlyph = Readonly<{
  character: string;
  cosine: number;
  sine: number;
}>;

type OrbitGlyphLayout = Readonly<{
  glyphs: OrbitGlyph[];
  orbit: OrbitGeometry;
}>;

type SceneGeometry = Readonly<{
  bounds: SceneBounds;
  orbits: OrbitGeometry[];
  surfaceArc: SurfaceArcGeometry;
}>;

type TextLayout = Readonly<{
  baseFontSize: number;
  fontFamily: string;
  geometry: SceneGeometry;
  letterSpacing: number;
  tracks: OrbitGlyphLayout[];
}>;

export type KineticFrame = Readonly<{
  elapsed: number;
  fontFamily: string;
  mode: "full" | "static";
  palette: KineticPalette;
  pixelRatio: number;
  pointer: KineticPointer | null;
}>;

let cachedGeometry: SceneGeometry | null = null;
let cachedTextLayout: TextLayout | null = null;

export function invalidateKineticTypeFieldTextLayout() {
  cachedTextLayout = null;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;

    return state / 4_294_967_296;
  };
}

function isIntermittentTrack(index: number) {
  return INTERMITTENT_TRACK_INDICES.has(index);
}

function createContinuousTrackCopy(source: string) {
  return source.split(" · ").join(NON_BREAKING_SPACE) + NON_BREAKING_SPACE;
}

function createConnectedGap(cellCount: number) {
  return "·".repeat(cellCount);
}

function createIntermittentTrackCopy(source: string, index: number) {
  const phrases = source.split(" · ");
  const random = createSeededRandom(Math.imul(index + 1, 0x9e3779b9));
  const segmentCount = 6 + Math.floor(random() * 2);
  let phraseCursor = Math.floor(random() * phrases.length);

  return Array.from({ length: segmentCount }, () => {
    const phraseCount = 2 + Math.floor(random() * 3);
    const segment = Array.from(
      { length: phraseCount },
      (_, phraseIndex) =>
        phrases[(phraseCursor + phraseIndex) % phrases.length] ?? phrases[0],
    ).join(NON_BREAKING_SPACE);
    const baseGapLength = 8 + Math.floor(random() * 9);
    const gap = createConnectedGap(
      baseGapLength * INTERMITTENT_GAP_MULTIPLIER,
    );

    phraseCursor =
      (phraseCursor + phraseCount + 1 + Math.floor(random() * 2)) %
      phrases.length;

    return segment + gap;
  }).join("");
}

const ORBIT_TRACKS: readonly OrbitTrack[] = Array.from(
  { length: TRACK_COUNT },
  (_, index): OrbitTrack => {
    const source = TRACK_COPY[index % TRACK_COPY.length] ?? TRACK_COPY[0];
    const intermittent = isIntermittentTrack(index);

    return {
      direction: index % 2 === 0 ? 1 : -1,
      duration:
        OUTER_TRACK_DURATION -
        ((OUTER_TRACK_DURATION - INNER_TRACK_DURATION) * index) /
          (TRACK_COUNT - 1),
      phase: ((index * 29) % 360) * (Math.PI / 180),
      radiusScale:
        TRACK_RADIUS_MAX -
        ((TRACK_RADIUS_MAX - TRACK_RADIUS_MIN) * index) / (TRACK_COUNT - 1),
      seamConnector:
        SEAM_CONNECTORS[index % SEAM_CONNECTORS.length] ?? "AI",
      text: intermittent
        ? createIntermittentTrackCopy(source, index)
        : createContinuousTrackCopy(source),
    };
  },
);

function getSurfaceArc(bounds: SceneBounds): SurfaceArcGeometry {
  const { height, width } = bounds;
  const startX = width * SURFACE_ENTRY_X_FACTOR;
  const endY = height * SURFACE_EXIT_Y_FACTOR;
  const chordX = width - startX;
  const chordLength = Math.hypot(chordX, endY);
  const radius = Math.max(
    chordLength * SURFACE_ARC_RADIUS_FACTOR,
    chordLength / 2 + 1,
  );
  const centerOffset = Math.sqrt(
    radius * radius - (chordLength / 2) * (chordLength / 2),
  );
  const midpointX = (startX + width) / 2;
  const midpointY = endY / 2;
  const normalX = -endY / chordLength;
  const normalY = chordX / chordLength;
  const centerX = midpointX - normalX * centerOffset;
  const centerY = midpointY - normalY * centerOffset;

  return {
    centerX,
    centerY,
    endAngle: Math.atan2(endY - centerY, width - centerX),
    endY,
    radius,
    startAngle: Math.atan2(-centerY, startX - centerX),
    startX,
  };
}

function getSceneGeometry(bounds: SceneBounds): SceneGeometry {
  if (
    cachedGeometry &&
    cachedGeometry.bounds.width === bounds.width &&
    cachedGeometry.bounds.height === bounds.height
  ) {
    return cachedGeometry;
  }

  const surfaceArc = getSurfaceArc(bounds);

  cachedGeometry = {
    bounds,
    orbits: ORBIT_TRACKS.map((track) => ({
      radius: surfaceArc.radius * track.radiusScale,
      track,
    })),
    surfaceArc,
  };
  cachedTextLayout = null;

  return cachedGeometry;
}

function traceSurface(context: CanvasRenderingContext2D, geometry: SceneGeometry) {
  const { bounds, surfaceArc } = geometry;

  context.beginPath();
  context.moveTo(surfaceArc.startX, 0);
  context.arc(
    surfaceArc.centerX,
    surfaceArc.centerY,
    surfaceArc.radius,
    surfaceArc.startAngle,
    surfaceArc.endAngle,
    true,
  );
  context.lineTo(bounds.width, 0);
  context.closePath();
}

function isInsidePointerMask(
  pointer: KineticPointer | null,
  x: number,
  y: number,
) {
  if (!pointer?.active) {
    return false;
  }

  const deltaX = x - pointer.x;
  const deltaY = y - pointer.y;

  return deltaX * deltaX + deltaY * deltaY <= pointer.radius * pointer.radius;
}

function isInsideViewport(
  bounds: SceneBounds,
  x: number,
  y: number,
  margin: number,
) {
  return (
    x >= -margin &&
    x <= bounds.width + margin &&
    y >= -margin &&
    y <= bounds.height + margin
  );
}

function isInsideSurface(
  geometry: SceneGeometry,
  x: number,
  y: number,
  margin: number,
) {
  const { centerX, centerY, radius } = geometry.surfaceArc;
  const deltaX = x - centerX;
  const deltaY = y - centerY;
  const boundedRadius = radius + margin;

  return deltaX * deltaX + deltaY * deltaY <= boundedRadius * boundedRadius;
}

function isDrawableCharacter(character: string) {
  return character !== NON_BREAKING_SPACE && character !== " ";
}

function isConnectorCharacter(character: string) {
  return character === "·";
}

function getTrackFont(fontSize: number, fontFamily: string) {
  return "500 " + fontSize + "px " + fontFamily;
}

function createOrbitGlyph(character: string, angle: number): OrbitGlyph {
  return {
    character,
    cosine: Math.cos(angle),
    sine: Math.sin(angle),
  };
}

function getTextLayout(
  context: CanvasRenderingContext2D,
  geometry: SceneGeometry,
  baseFontSize: number,
  fontFamily: string,
  letterSpacing: number,
) {
  if (
    cachedTextLayout &&
    cachedTextLayout.geometry === geometry &&
    cachedTextLayout.baseFontSize === baseFontSize &&
    cachedTextLayout.fontFamily === fontFamily &&
    cachedTextLayout.letterSpacing === letterSpacing
  ) {
    return cachedTextLayout;
  }

  const glyphWidths = new Map<string, number>();
  context.font = getTrackFont(baseFontSize, fontFamily);
  const getAngularAdvance = (
    character: string,
    radius: number,
  ) => {
    let glyphWidth = glyphWidths.get(character);

    if (glyphWidth === undefined) {
      glyphWidth = context.measureText(character).width;
      glyphWidths.set(character, glyphWidth);
    }

    return Math.max(1, glyphWidth + letterSpacing) / radius;
  };
  const tracks = geometry.orbits.map((orbit): OrbitGlyphLayout => {
    const glyphs: OrbitGlyph[] = [];
    const { radius, track } = orbit;
    const candidateSeamCharacters = Array.from(
      NON_BREAKING_SPACE + track.seamConnector,
    );
    const candidateSeamAdvance = candidateSeamCharacters.reduce(
      (total, character) => total + getAngularAdvance(character, radius),
      0,
    );
    const seamCharacters =
      candidateSeamAdvance <= TAU ? candidateSeamCharacters : [];
    const seamAdvance =
      seamCharacters.length === candidateSeamCharacters.length
        ? candidateSeamAdvance
        : 0;
    const seamStart = TAU - seamAdvance;
    let angle = 0;
    let characterIndex = 0;

    while (angle < seamStart) {
      const character =
        track.text[characterIndex % track.text.length] ?? NON_BREAKING_SPACE;
      const angularAdvance = getAngularAdvance(character, radius);

      if (angle + angularAdvance > seamStart) {
        break;
      }

      glyphs.push(createOrbitGlyph(character, angle + angularAdvance / 2));

      angle += angularAdvance;
      characterIndex += 1;
    }

    angle = seamStart;

    for (const character of seamCharacters) {
      const angularAdvance = getAngularAdvance(character, radius);
      const nextAngle = Math.min(TAU, angle + angularAdvance);

      glyphs.push(
        createOrbitGlyph(character, angle + (nextAngle - angle) / 2),
      );

      angle = nextAngle;
    }

    return { glyphs, orbit };
  });

  cachedTextLayout = {
    baseFontSize,
    fontFamily,
    geometry,
    letterSpacing,
    tracks,
  };

  return cachedTextLayout;
}

function drawTrackText(
  context: CanvasRenderingContext2D,
  layout: OrbitGlyphLayout,
  geometry: SceneGeometry,
  frame: KineticFrame,
  viewportMargin: number,
) {
  const { glyphs, orbit } = layout;
  const { radius, track } = orbit;
  const { centerX, centerY } = geometry.surfaceArc;
  const elapsedTurns = (frame.elapsed / 1000 / track.duration) * TAU;
  const startAngle = track.phase + track.direction * elapsedTurns;
  const startCosine = Math.cos(startAngle);
  const startSine = Math.sin(startAngle);

  for (const glyph of glyphs) {
    if (!isDrawableCharacter(glyph.character)) {
      continue;
    }

    const isConnector = isConnectorCharacter(glyph.character);
    const cosine =
      startCosine * glyph.cosine - startSine * glyph.sine;
    const sine = startSine * glyph.cosine + startCosine * glyph.sine;
    const x = centerX + cosine * radius;
    const y = centerY + sine * radius;

    if (!isInsideViewport(geometry.bounds, x, y, viewportMargin)) {
      continue;
    }

    if (!isInsideSurface(geometry, x, y, viewportMargin)) {
      continue;
    }

    const isPointerMaskedText =
      !isConnector && isInsidePointerMask(frame.pointer, x, y);
    const tangentCosine = -sine;
    const tangentSine = cosine;

    context.setTransform(
      frame.pixelRatio * tangentCosine,
      frame.pixelRatio * tangentSine,
      -frame.pixelRatio * tangentSine,
      frame.pixelRatio * tangentCosine,
      frame.pixelRatio * x,
      frame.pixelRatio * y,
    );
    const character = isPointerMaskedText ? "·" : glyph.character;
    const opacity = isConnector
      ? CONNECTOR_DOT_OPACITY
      : isPointerMaskedText
        ? POINTER_DOT_OPACITY
        : TRACK_TEXT_OPACITY;

    if (opacity !== TRACK_TEXT_OPACITY) {
      context.globalAlpha = opacity;
    }
    context.fillText(character, 0, 0);
    if (opacity !== TRACK_TEXT_OPACITY) {
      context.globalAlpha = TRACK_TEXT_OPACITY;
    }
  }
}

function getBaseTrackFontSize(geometry: SceneGeometry) {
  const preferredFontSize = clamp(
    Math.min(geometry.bounds.width, geometry.bounds.height) *
      TRACK_FONT_SIZE_FACTOR,
    MIN_TRACK_FONT_SIZE,
    MAX_TRACK_FONT_SIZE,
  );
  const outerOrbit = geometry.orbits[0];
  const nextOrbit = geometry.orbits[1];

  if (!outerOrbit || !nextOrbit) {
    return preferredFontSize;
  }

  const radialStep = Math.abs(outerOrbit.radius - nextOrbit.radius);
  const compactSceneFontCap = radialStep * TRACK_FONT_RADIAL_CLEARANCE;

  return Math.max(
    MIN_TRACK_FONT_SIZE,
    Math.min(preferredFontSize, compactSceneFontCap),
  );
}

function drawTracks(
  context: CanvasRenderingContext2D,
  geometry: SceneGeometry,
  frame: KineticFrame,
) {
  const baseFontSize = getBaseTrackFontSize(geometry);

  context.fillStyle = frame.palette.bone;
  context.font = getTrackFont(baseFontSize, frame.fontFamily);
  context.globalAlpha = TRACK_TEXT_OPACITY;
  context.textAlign = "center";
  context.textBaseline = "middle";

  const layout = getTextLayout(
    context,
    geometry,
    baseFontSize,
    frame.fontFamily,
    TRACK_LETTER_SPACING,
  );

  for (const track of layout.tracks) {
    drawTrackText(
      context,
      track,
      geometry,
      frame,
      baseFontSize * 0.78,
    );
  }

  context.setTransform(
    frame.pixelRatio,
    0,
    0,
    frame.pixelRatio,
    0,
    0,
  );
}

export function getKineticPointerRadius(bounds: SceneBounds) {
  return clamp(Math.min(bounds.width, bounds.height) * 0.14, 88, 176);
}

export function drawKineticTypeFieldFrame(
  context: CanvasRenderingContext2D,
  bounds: SceneBounds,
  frame: KineticFrame,
) {
  const geometry = getSceneGeometry(bounds);

  context.clearRect(0, 0, bounds.width, bounds.height);
  context.fillStyle = frame.palette.void;
  traceSurface(context, geometry);
  context.fill();

  context.save();
  traceSurface(context, geometry);
  context.clip();
  drawTracks(context, geometry, frame);
  context.restore();
}
