import {
  MAX_CHARGE_MS,
  clampUnit,
} from "@/effects/physics/physicsConstants";

export type PhysicsFieldView = Readonly<{
  columns: number;
  rows: number;
  width: number;
  height: number;
  displacementXY: Float32Array;
}>;

export type PhysicsCommand =
  | Readonly<{
      kind: "impulse";
      x: number;
      y: number;
      radius: number;
      strength: number;
      velocityX: number;
      velocityY: number;
    }>
  | Readonly<{
      kind: "charge" | "grab";
      x: number;
      y: number;
      strength: number;
    }>
  | Readonly<{
      kind: "release";
      x: number;
      y: number;
      strength: number;
      velocityX: number;
      velocityY: number;
    }>
  | Readonly<{ kind: "cancel" }>;

export type PhysicsKernel = Readonly<{
  field: PhysicsFieldView;
  apply: (command: PhysicsCommand) => void;
  resize: (width: number, height: number, maxDisplacement: number) => void;
  advance: (nowMs: number) => boolean;
  reset: () => void;
}>;

type MutablePhysicsField = {
  columns: number;
  rows: number;
  width: number;
  height: number;
  displacementXY: Float32Array;
};

type PhysicsKernelOptions = Readonly<{
  columns: number;
  rows: number;
  impulseCapacity: number;
  fixedStepMs: number;
  maxElapsedMs: number;
  maxSubsteps: number;
  maxDisplacement: number;
}>;

const IMPULSE_LIFETIME_MS = 1_000;
const IDLE_ENERGY_THRESHOLD = 0.025;
const WAVE_TENSION = 145;
const RESTORING_FORCE = 10.5;
const STEP_DAMPING = 0.965;
const ANCHOR_SPRING = 72;
const ANCHOR_DAMPING = 0.8;
const ATTRACTION_FORCE = 34;

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function samplePhysicsField(
  field: PhysicsFieldView,
  x: number,
  y: number,
  outputXY: Float32Array,
  outputOffset = 0,
) {
  const normalizedX = clamp(x / Math.max(field.width, 1), 0, 1);
  const normalizedY = clamp(y / Math.max(field.height, 1), 0, 1);
  const gridX = normalizedX * (field.columns - 1);
  const gridY = normalizedY * (field.rows - 1);
  const x0 = Math.floor(gridX);
  const y0 = Math.floor(gridY);
  const x1 = Math.min(x0 + 1, field.columns - 1);
  const y1 = Math.min(y0 + 1, field.rows - 1);
  const blendX = gridX - x0;
  const blendY = gridY - y0;
  const rowStride = field.columns * 2;
  const topLeft = y0 * rowStride + x0 * 2;
  const topRight = y0 * rowStride + x1 * 2;
  const bottomLeft = y1 * rowStride + x0 * 2;
  const bottomRight = y1 * rowStride + x1 * 2;
  const displacement = field.displacementXY;
  const topX =
    displacement[topLeft]! +
    (displacement[topRight]! - displacement[topLeft]!) * blendX;
  const topY =
    displacement[topLeft + 1]! +
    (displacement[topRight + 1]! - displacement[topLeft + 1]!) * blendX;
  const bottomX =
    displacement[bottomLeft]! +
    (displacement[bottomRight]! - displacement[bottomLeft]!) * blendX;
  const bottomY =
    displacement[bottomLeft + 1]! +
    (displacement[bottomRight + 1]! - displacement[bottomLeft + 1]!) *
      blendX;

  outputXY[outputOffset] = topX + (bottomX - topX) * blendY;
  outputXY[outputOffset + 1] = topY + (bottomY - topY) * blendY;
}

export function createPhysicsKernel(options: PhysicsKernelOptions): PhysicsKernel {
  const columns = Math.max(2, Math.floor(options.columns));
  const rows = Math.max(2, Math.floor(options.rows));
  const cellCount = columns * rows;
  const valueCount = cellCount * 2;
  const impulseCapacity = Math.max(1, Math.floor(options.impulseCapacity));
  const fixedStepMs = Math.max(1, options.fixedStepMs);
  const fixedStepSeconds = fixedStepMs / 1_000;
  const maxElapsedMs = Math.max(fixedStepMs, options.maxElapsedMs);
  const maxSubsteps = Math.max(1, Math.floor(options.maxSubsteps));
  let displacement = new Float32Array(valueCount);
  let nextDisplacement = new Float32Array(valueCount);
  const velocity = new Float32Array(valueCount);
  const impulseActive = new Uint8Array(impulseCapacity);
  const impulseX = new Float32Array(impulseCapacity);
  const impulseY = new Float32Array(impulseCapacity);
  const impulseRadius = new Float32Array(impulseCapacity);
  const impulseAmplitude = new Float32Array(impulseCapacity);
  const impulseAgeMs = new Float32Array(impulseCapacity);
  const impulseVelocityX = new Float32Array(impulseCapacity);
  const impulseVelocityY = new Float32Array(impulseCapacity);
  const impulseEnergy = new Float32Array(impulseCapacity);
  const field: MutablePhysicsField = {
    columns,
    rows,
    width: 1,
    height: 1,
    displacementXY: displacement,
  };
  let maxDisplacement = Math.max(0, options.maxDisplacement);
  let lastNowMs = -1;
  let accumulatorMs = 0;
  let idleStepCount = 0;
  let fieldActive = false;
  let lastSourceStartedAt = -1;
  let grabActive = false;
  let chargeStartedAt = -1;
  let grabStrength = 0;
  let grabTargetX = 0;
  let grabTargetY = 0;
  let grabCurrentX = 0;
  let grabCurrentY = 0;
  let grabVelocityX = 0;
  let grabVelocityY = 0;

  const clearImpulses = () => {
    impulseActive.fill(0);
    impulseAgeMs.fill(0);
    impulseEnergy.fill(0);
  };

  const clearField = () => {
    displacement.fill(0);
    nextDisplacement.fill(0);
    velocity.fill(0);
    field.displacementXY = displacement;
    idleStepCount = 0;
    fieldActive = false;
  };

  const reset = () => {
    clearField();
    clearImpulses();
    lastNowMs = -1;
    accumulatorMs = 0;
    lastSourceStartedAt = -1;
    grabActive = false;
    chargeStartedAt = -1;
    grabStrength = 0;
    grabVelocityX = 0;
    grabVelocityY = 0;
  };

  const findImpulseSlot = () => {
    let replacement = 0;
    let lowestEnergy = Number.POSITIVE_INFINITY;
    let oldestAge = -1;

    for (let index = 0; index < impulseCapacity; index += 1) {
      if (!impulseActive[index]) {
        return index;
      }

      const energy = impulseEnergy[index]!;
      const age = impulseAgeMs[index]!;

      if (energy < lowestEnergy || (energy === lowestEnergy && age > oldestAge)) {
        replacement = index;
        lowestEnergy = energy;
        oldestAge = age;
      }
    }

    return replacement;
  };

  const addImpulse = (
    x: number,
    y: number,
    radius: number,
    strength: number,
    velocityX: number,
    velocityY: number,
  ) => {
    const slot = findImpulseSlot();
    const boundedStrength = clampUnit(finiteOr(strength, 0));

    impulseActive[slot] = 1;
    impulseX[slot] = clamp(finiteOr(x, 0), 0, field.width);
    impulseY[slot] = clamp(finiteOr(y, 0), 0, field.height);
    impulseRadius[slot] = Math.max(2, finiteOr(radius, 2));
    impulseAmplitude[slot] = maxDisplacement * (0.28 + boundedStrength * 0.72);
    impulseAgeMs[slot] = 0;
    impulseVelocityX[slot] = finiteOr(velocityX, 0);
    impulseVelocityY[slot] = finiteOr(velocityY, 0);
    impulseEnergy[slot] = Math.max(0.05, boundedStrength);
    fieldActive = true;
    lastSourceStartedAt = lastNowMs;
    idleStepCount = 0;
  };

  const apply = (command: PhysicsCommand) => {
    if (command.kind === "cancel") {
      grabActive = false;
      chargeStartedAt = -1;
      grabStrength = 0;
      grabVelocityX = 0;
      grabVelocityY = 0;
      return;
    }

    if (command.kind === "impulse") {
      addImpulse(
        command.x,
        command.y,
        command.radius,
        command.strength,
        command.velocityX,
        command.velocityY,
      );
      return;
    }

    if (command.kind === "charge" || command.kind === "grab") {
      const targetX = clamp(finiteOr(command.x, 0), 0, field.width);
      const targetY = clamp(finiteOr(command.y, 0), 0, field.height);

      if (!grabActive) {
        grabCurrentX = targetX;
        grabCurrentY = targetY;
        grabVelocityX = 0;
        grabVelocityY = 0;
        chargeStartedAt = lastNowMs;
      }

      grabActive = true;
      grabTargetX = targetX;
      grabTargetY = targetY;
      grabStrength = Math.max(grabStrength, clampUnit(command.strength));
      fieldActive = true;
      idleStepCount = 0;
      return;
    }

    if (command.kind === "release") {
      const lagVelocityX = grabVelocityX + (grabTargetX - grabCurrentX) * 8;
      const lagVelocityY = grabVelocityY + (grabTargetY - grabCurrentY) * 8;
      const radius =
        Math.min(field.width, field.height) *
        (0.05 + clampUnit(command.strength) * 0.04);

      addImpulse(
        command.x,
        command.y,
        radius,
        command.strength,
        command.velocityX + lagVelocityX,
        command.velocityY + lagVelocityY,
      );
      grabActive = false;
      chargeStartedAt = -1;
      grabStrength = 0;
      grabVelocityX = 0;
      grabVelocityY = 0;
    }
  };

  const applyGrabAttraction = (nowMs: number) => {
    if (!grabActive) {
      return;
    }

    if (chargeStartedAt < 0) {
      chargeStartedAt = nowMs;
    }

    grabVelocityX +=
      (grabTargetX - grabCurrentX) * ANCHOR_SPRING * fixedStepSeconds;
    grabVelocityY +=
      (grabTargetY - grabCurrentY) * ANCHOR_SPRING * fixedStepSeconds;
    grabVelocityX *= ANCHOR_DAMPING;
    grabVelocityY *= ANCHOR_DAMPING;
    grabCurrentX += grabVelocityX * fixedStepSeconds;
    grabCurrentY += grabVelocityY * fixedStepSeconds;

    const derivedCharge = clampUnit((nowMs - chargeStartedAt) / MAX_CHARGE_MS);
    const strength = Math.max(grabStrength, derivedCharge);
    const attractionRadius = Math.max(
      24,
      Math.min(field.width, field.height) * 0.15,
    );
    const attractionRadiusSquared = attractionRadius * attractionRadius;
    const targetMagnitude = maxDisplacement * (0.18 + strength * 0.72);

    for (let row = 1; row < rows - 1; row += 1) {
      const cellY = (row / (rows - 1)) * field.height;

      for (let column = 1; column < columns - 1; column += 1) {
        const cellX = (column / (columns - 1)) * field.width;
        const deltaX = grabCurrentX - cellX;
        const deltaY = grabCurrentY - cellY;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;

        if (distanceSquared >= attractionRadiusSquared) {
          continue;
        }

        const distance = Math.sqrt(distanceSquared);
        const influence = 1 - distance / attractionRadius;
        const directionScale = distance > 0.001 ? 1 / distance : 0;
        const valueOffset = (row * columns + column) * 2;
        const desiredX = deltaX * directionScale * targetMagnitude * influence;
        const desiredY = deltaY * directionScale * targetMagnitude * influence;

        velocity[valueOffset] =
          velocity[valueOffset]! +
          (desiredX - displacement[valueOffset]!) *
            ATTRACTION_FORCE *
            fixedStepSeconds;
        velocity[valueOffset + 1] =
          velocity[valueOffset + 1]! +
          (desiredY - displacement[valueOffset + 1]!) *
            ATTRACTION_FORCE *
            fixedStepSeconds;
      }
    }
  };

  const applyImpulseForces = () => {
    for (let slot = 0; slot < impulseCapacity; slot += 1) {
      if (!impulseActive[slot]) {
        continue;
      }

      const age = impulseAgeMs[slot]! + fixedStepMs;
      impulseAgeMs[slot] = age;

      if (age >= IMPULSE_LIFETIME_MS) {
        impulseActive[slot] = 0;
        impulseEnergy[slot] = 0;
        continue;
      }

      const lifetime = 1 - age / IMPULSE_LIFETIME_MS;
      const baseRadius = impulseRadius[slot]!;
      const ringRadius = baseRadius * (0.4 + (age / IMPULSE_LIFETIME_MS) * 2.3);
      const ringThickness = Math.max(4, baseRadius * 0.58);
      const amplitude = impulseAmplitude[slot]! * lifetime * lifetime;
      const sourceX = impulseX[slot]!;
      const sourceY = impulseY[slot]!;
      const biasX = impulseVelocityX[slot]!;
      const biasY = impulseVelocityY[slot]!;
      const biasLength = Math.hypot(biasX, biasY);
      const biasDirectionX = biasLength > 0 ? biasX / biasLength : 0;
      const biasDirectionY = biasLength > 0 ? biasY / biasLength : 0;
      const directionalWeight = Math.min(biasLength / 2_400, 1) * 0.38;

      impulseEnergy[slot] = Math.max(0, lifetime * amplitude);

      for (let row = 1; row < rows - 1; row += 1) {
        const cellY = (row / (rows - 1)) * field.height;

        for (let column = 1; column < columns - 1; column += 1) {
          const cellX = (column / (columns - 1)) * field.width;
          const deltaX = cellX - sourceX;
          const deltaY = cellY - sourceY;
          const distance = Math.hypot(deltaX, deltaY);
          const ringDelta = Math.abs(distance - ringRadius);

          if (ringDelta >= ringThickness) {
            continue;
          }

          const influence = 1 - ringDelta / ringThickness;
          const radialScale = distance > 0.001 ? 1 / distance : 0;
          let directionX = deltaX * radialScale + biasDirectionX * directionalWeight;
          let directionY = deltaY * radialScale + biasDirectionY * directionalWeight;
          const directionLength = Math.hypot(directionX, directionY) || 1;
          const force =
            amplitude * influence * influence * 31 * fixedStepSeconds;
          const valueOffset = (row * columns + column) * 2;

          directionX /= directionLength;
          directionY /= directionLength;
          velocity[valueOffset] = velocity[valueOffset]! + directionX * force;
          velocity[valueOffset + 1] =
            velocity[valueOffset + 1]! + directionY * force;
        }
      }
    }
  };

  const integrateField = () => {
    let maxCellDisplacement = 0;
    let maxCellVelocity = 0;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const valueOffset = (row * columns + column) * 2;
        const edgeDistance = Math.min(
          column,
          columns - 1 - column,
          row,
          rows - 1 - row,
        );
        const edgeTaper = row === 0 ? 0 : clamp(edgeDistance / 2, 0, 1);

        if (edgeTaper === 0) {
          nextDisplacement[valueOffset] = 0;
          nextDisplacement[valueOffset + 1] = 0;
          velocity[valueOffset] = 0;
          velocity[valueOffset + 1] = 0;
          continue;
        }

        const leftColumn = Math.max(0, column - 1);
        const rightColumn = Math.min(columns - 1, column + 1);
        const topRow = Math.max(0, row - 1);
        const bottomRow = Math.min(rows - 1, row + 1);
        const leftOffset = (row * columns + leftColumn) * 2;
        const rightOffset = (row * columns + rightColumn) * 2;
        const topOffset = (topRow * columns + column) * 2;
        const bottomOffset = (bottomRow * columns + column) * 2;
        const currentX = displacement[valueOffset]!;
        const currentY = displacement[valueOffset + 1]!;
        const laplacianX =
          displacement[leftOffset]! +
          displacement[rightOffset]! +
          displacement[topOffset]! +
          displacement[bottomOffset]! -
          currentX * 4;
        const laplacianY =
          displacement[leftOffset + 1]! +
          displacement[rightOffset + 1]! +
          displacement[topOffset + 1]! +
          displacement[bottomOffset + 1]! -
          currentY * 4;
        let nextVelocityX =
          (velocity[valueOffset]! +
            (laplacianX * WAVE_TENSION - currentX * RESTORING_FORCE) *
              fixedStepSeconds) *
          STEP_DAMPING;
        let nextVelocityY =
          (velocity[valueOffset + 1]! +
            (laplacianY * WAVE_TENSION - currentY * RESTORING_FORCE) *
              fixedStepSeconds) *
          STEP_DAMPING;
        let nextX = (currentX + nextVelocityX * fixedStepSeconds) * edgeTaper;
        let nextY = (currentY + nextVelocityY * fixedStepSeconds) * edgeTaper;
        const magnitude = Math.hypot(nextX, nextY);

        if (magnitude > maxDisplacement && magnitude > 0) {
          const scale = maxDisplacement / magnitude;
          nextX *= scale;
          nextY *= scale;
          nextVelocityX *= scale;
          nextVelocityY *= scale;
        }

        nextDisplacement[valueOffset] = nextX;
        nextDisplacement[valueOffset + 1] = nextY;
        velocity[valueOffset] = nextVelocityX;
        velocity[valueOffset + 1] = nextVelocityY;
        maxCellDisplacement = Math.max(maxCellDisplacement, Math.hypot(nextX, nextY));
        maxCellVelocity = Math.max(
          maxCellVelocity,
          Math.hypot(nextVelocityX, nextVelocityY),
        );
      }
    }

    const previousDisplacement = displacement;
    displacement = nextDisplacement;
    nextDisplacement = previousDisplacement;
    field.displacementXY = displacement;

    let hasImpulse = false;

    for (let slot = 0; slot < impulseCapacity; slot += 1) {
      if (impulseActive[slot]) {
        hasImpulse = true;
        break;
      }
    }

    if (
      !grabActive &&
      !hasImpulse &&
      maxCellDisplacement + maxCellVelocity * fixedStepSeconds <
        IDLE_ENERGY_THRESHOLD
    ) {
      idleStepCount += 1;

      if (idleStepCount >= 2) {
        clearField();
      }
    } else {
      idleStepCount = 0;
    }
  };

  const hasLiveImpulse = () => {
    for (let index = 0; index < impulseCapacity; index += 1) {
      if (impulseActive[index]) {
        return true;
      }
    }

    return false;
  };

  const advance = (nowMs: number) => {
    const safeNowMs = finiteOr(nowMs, lastNowMs >= 0 ? lastNowMs : 0);
    const liveImpulse = hasLiveImpulse();

    if (!grabActive && !liveImpulse && !fieldActive) {
      lastNowMs = safeNowMs;
      accumulatorMs = 0;
      return false;
    }

    if (lastNowMs < 0) {
      lastNowMs = safeNowMs;

      if (grabActive && chargeStartedAt < 0) {
        chargeStartedAt = safeNowMs;
      }

      if (lastSourceStartedAt < 0 && hasLiveImpulse()) {
        lastSourceStartedAt = safeNowMs;
      }

      return grabActive || liveImpulse || fieldActive;
    }

    const elapsedMs = clamp(safeNowMs - lastNowMs, 0, maxElapsedMs);
    lastNowMs = safeNowMs;
    accumulatorMs += elapsedMs;
    let substeps = 0;

    while (accumulatorMs >= fixedStepMs && substeps < maxSubsteps) {
      applyGrabAttraction(safeNowMs - accumulatorMs + fixedStepMs);
      applyImpulseForces();
      integrateField();
      accumulatorMs -= fixedStepMs;
      substeps += 1;
    }

    if (substeps === maxSubsteps && accumulatorMs >= fixedStepMs) {
      accumulatorMs %= fixedStepMs;
    }

    if (
      !grabActive &&
      lastSourceStartedAt >= 0 &&
      safeNowMs - lastSourceStartedAt >= IMPULSE_LIFETIME_MS
    ) {
      clearField();
      clearImpulses();
      lastSourceStartedAt = -1;
      accumulatorMs = 0;
      return false;
    }

    return grabActive || hasLiveImpulse() || fieldActive;
  };

  const resize = (width: number, height: number, nextMaxDisplacement: number) => {
    const previousWidth = field.width;
    const previousHeight = field.height;
    const nextWidth = Math.max(1, finiteOr(width, field.width));
    const nextHeight = Math.max(1, finiteOr(height, field.height));
    const scaleX = nextWidth / previousWidth;
    const scaleY = nextHeight / previousHeight;
    const radiusScale = Math.min(scaleX, scaleY);

    field.width = nextWidth;
    field.height = nextHeight;
    maxDisplacement = Math.max(
      0,
      finiteOr(nextMaxDisplacement, maxDisplacement),
    );

    if (scaleX !== 1 || scaleY !== 1) {
      grabTargetX *= scaleX;
      grabCurrentX *= scaleX;
      grabVelocityX *= scaleX;
      grabTargetY *= scaleY;
      grabCurrentY *= scaleY;
      grabVelocityY *= scaleY;

      for (let slot = 0; slot < impulseCapacity; slot += 1) {
        if (impulseActive[slot]) {
          impulseX[slot] = impulseX[slot]! * scaleX;
          impulseY[slot] = impulseY[slot]! * scaleY;
          impulseRadius[slot] = impulseRadius[slot]! * radiusScale;
          impulseVelocityX[slot] = impulseVelocityX[slot]! * scaleX;
          impulseVelocityY[slot] = impulseVelocityY[slot]! * scaleY;
        }
      }
    }

    for (let offset = 0; offset < valueCount; offset += 2) {
      const x = displacement[offset]!;
      const y = displacement[offset + 1]!;
      const magnitude = Math.hypot(x, y);

      if (magnitude > maxDisplacement && magnitude > 0) {
        const scale = maxDisplacement / magnitude;
        displacement[offset] = x * scale;
        displacement[offset + 1] = y * scale;
        nextDisplacement[offset] = nextDisplacement[offset]! * scale;
        nextDisplacement[offset + 1] = nextDisplacement[offset + 1]! * scale;
      }
    }
  };

  return Object.freeze({
    field,
    apply,
    resize,
    advance,
    reset,
  });
}
