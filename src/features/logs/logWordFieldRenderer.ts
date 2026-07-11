export type LogWordFieldBounds = Readonly<{
  width: number;
  height: number;
}>;

export type LogWordFieldPalette = Readonly<{
  field: string;
  signal: string;
}>;

export type LogWordFieldPointer = Readonly<{
  x: number;
  y: number;
}>;

type WordPlacement = Readonly<{
  baseAlpha: number;
  fontSize: number;
  x: number;
  y: number;
}>;

function hashValue(value: string) {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function ratioFromHash(hash: number, shift: number) {
  return ((hash >>> shift) & 0xff) / 255;
}

function getPlacement(
  token: string,
  row: number,
  column: number,
  x: number,
  y: number,
): WordPlacement {
  const hash = hashValue(`${token}-${row.toString()}-${column.toString()}`);

  return {
    x,
    y,
    baseAlpha: 0.06 + ratioFromHash(hash, 8) * 0.06,
    fontSize: 8 + Math.round(ratioFromHash(hash, 16) * 5),
  };
}

function getPointerIntensity(
  placement: WordPlacement,
  textWidth: number,
  pointer: LogWordFieldPointer | null,
) {
  if (!pointer) {
    return 0;
  }

  const distance = Math.hypot(
    placement.x + textWidth / 2 - pointer.x,
    placement.y - pointer.y,
  );
  const radius = 168;

  return Math.max(0, 1 - distance / radius);
}

export function drawLogWordFieldFrame(
  context: CanvasRenderingContext2D,
  bounds: LogWordFieldBounds,
  tokens: readonly string[],
  palette: LogWordFieldPalette,
  pointer: LogWordFieldPointer | null,
  progress: number,
  fontFamily: string,
) {
  context.clearRect(0, 0, bounds.width, bounds.height);

  if (!tokens.length) {
    return;
  }

  const normalizedTokens = tokens
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);

  if (!normalizedTokens.length) {
    return;
  }

  context.textBaseline = "middle";
  context.textAlign = "left";

  const rowHeight = Math.max(22, Math.min(28, Math.round(bounds.height / 40)));
  const rowCount = Math.ceil(bounds.height / rowHeight) + 1;
  let sequence = 0;

  for (let row = 0; row < rowCount; row += 1) {
    const rowHash = hashValue(`row-${row.toString()}-${bounds.width.toString()}`);
    const y = row * rowHeight + rowHeight / 2;
    let x = -56 + ratioFromHash(rowHash, 0) * 96;
    let column = 0;

    while (x < bounds.width + 72) {
      const token = normalizedTokens[(row * 3 + column) % normalizedTokens.length];

      if (!token) {
        break;
      }

      const placement = getPlacement(token, row, column, x, y);
      context.font = `${placement.fontSize}px ${fontFamily}`;
      const textWidth = context.measureText(token).width;
      const pointerIntensity = getPointerIntensity(placement, textWidth, pointer);
      const entrance = Math.min(1, Math.max(0, progress * 1.55 - sequence / 220));

      context.fillStyle = pointerIntensity > 0.68 ? palette.signal : palette.field;
      context.globalAlpha = (placement.baseAlpha + pointerIntensity * 0.17) * entrance;
      context.fillText(token, placement.x, placement.y);

      x += textWidth + 24 + ratioFromHash(hashValue(`${token}-${column}`), 24) * 26;
      column += 1;
      sequence += 1;
    }
  }

  context.globalAlpha = 1;
}
