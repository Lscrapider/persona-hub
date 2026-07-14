const TAU = Math.PI * 2;

const SURFACE_ARC_RADIUS_FACTOR = 0.74;
const SURFACE_ENTRY_X_FACTOR = 0.398;
const SURFACE_EXIT_Y_FACTOR = 1.1;

const TRACK_COUNT = 40;
const TRACK_RADIUS_MAX = 0.97;
const TRACK_RADIUS_MIN = 0.16;
const NON_BREAKING_SPACE = "\u00a0";
const MIN_TRACK_FONT_SIZE = 14;
const MAX_TRACK_FONT_SIZE = 18;
const TRACK_FONT_SIZE_FACTOR = 0.018;
const TRACK_FONT_RADIAL_CLEARANCE = 0.66;
const TRACK_LETTER_SPACING = 4;
export const KINETIC_OUTER_TRACK_FONT_SCALE = 1.18;
export const KINETIC_INNER_TRACK_FONT_SCALE = 0.74;
export const TRACK_TEXT_OPACITY = 0.9;
const OUTER_TRACK_DURATION = 1200;
const INNER_TRACK_DURATION = 350;
export const CONNECTOR_DOT_OPACITY = 0.28;
export const POINTER_DOT_OPACITY = 0.52;
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

export type KineticSurfaceGeometry = Readonly<{
  centerX: number;
  centerY: number;
  endAngle: number;
  endY: number;
  radius: number;
  startAngle: number;
  startX: number;
}>;

export type KineticGlyphInstance = Readonly<{
  baseAngle: number;
  character: string;
  direction: 1 | -1;
  duration: number;
  isConnector: boolean;
  phase: number;
  radius: number;
}>;

export type KineticSceneLayout = Readonly<{
  atlasFontSize: number;
  baseFontSize: number;
  glyphs: readonly KineticGlyphInstance[];
  radiusRange: Readonly<{
    inner: number;
    outer: number;
  }>;
  surface: KineticSurfaceGeometry;
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
  surfaceArc: KineticSurfaceGeometry;
}>;

type TextLayout = Readonly<{
  baseFontSize: number;
  fontFamily: string;
  geometry: SceneGeometry;
  letterSpacing: number;
  tracks: OrbitGlyphLayout[];
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

function reverseWordPlacement(source: string) {
  return source
    .split(/(\s+)/)
    .map((segment) =>
      /\s/.test(segment) ? segment : Array.from(segment).reverse().join(""),
    )
    .join("");
}

function createContinuousTrackCopy(source: string) {
  return (
    source
      .split(" · ")
      .map(reverseWordPlacement)
      .join(NON_BREAKING_SPACE) + NON_BREAKING_SPACE
  );
}

function createConnectedGap(cellCount: number) {
  return "·".repeat(cellCount);
}

function createIntermittentTrackCopy(source: string, index: number) {
  const phrases = source.split(" · ").map(reverseWordPlacement);
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

function getSurfaceArc(bounds: SceneBounds): KineticSurfaceGeometry {
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

function isDrawableCharacter(character: string) {
  return character !== NON_BREAKING_SPACE && character !== " ";
}

function isConnectorCharacter(character: string) {
  return character === "·";
}

export function getKineticTrackFont(fontSize: number, fontFamily: string) {
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
  context.font = getKineticTrackFont(baseFontSize, fontFamily);
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
      NON_BREAKING_SPACE + reverseWordPlacement(track.seamConnector),
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

export function getKineticSceneLayout(
  context: CanvasRenderingContext2D,
  bounds: SceneBounds,
  fontFamily: string,
): KineticSceneLayout {
  const geometry = getSceneGeometry(bounds);
  const baseFontSize = getBaseTrackFontSize(geometry);
  const textLayout = getTextLayout(
    context,
    geometry,
    baseFontSize,
    fontFamily,
    TRACK_LETTER_SPACING,
  );
  const glyphs = textLayout.tracks.flatMap(({ glyphs: trackGlyphs, orbit }) =>
    trackGlyphs.flatMap((glyph): KineticGlyphInstance[] => {
      if (!isDrawableCharacter(glyph.character)) {
        return [];
      }

      return [
        {
          baseAngle: Math.atan2(glyph.sine, glyph.cosine),
          character: glyph.character,
          direction: orbit.track.direction,
          duration: orbit.track.duration,
          isConnector: isConnectorCharacter(glyph.character),
          phase: orbit.track.phase,
          radius: orbit.radius,
        },
      ];
    }),
  );

  return {
    atlasFontSize: baseFontSize * KINETIC_OUTER_TRACK_FONT_SCALE,
    baseFontSize,
    glyphs,
    radiusRange: {
      inner: geometry.orbits.at(-1)?.radius ?? 0,
      outer: geometry.orbits[0]?.radius ?? 0,
    },
    surface: geometry.surfaceArc,
  };
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

export function getKineticPointerRadius(bounds: SceneBounds) {
  return clamp(Math.min(bounds.width, bounds.height) * 0.14, 88, 176);
}
