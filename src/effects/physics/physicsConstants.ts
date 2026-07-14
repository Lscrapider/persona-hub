export const MOUSE_HOLD_THRESHOLD_MS = 220;
export const TOUCH_HOLD_THRESHOLD_MS = 300;
export const MOUSE_MOVEMENT_TOLERANCE_PX = 7;
export const TOUCH_MOVEMENT_TOLERANCE_PX = 10;
export const MAX_CHARGE_MS = 1_100;
export const CHARGE_TOKEN_INTERVAL_MS = 80;
export const PARTICLE_LIFETIME_MS = 1_600;
export const DESKTOP_PARTICLE_CAPACITY = 28;
export const COARSE_PARTICLE_CAPACITY = 14;
export const MAX_CHARGED_TOKENS = 18;
export const MAX_LIVE_IMPULSES = 4;
export const MAX_RELEASE_SPEED_CSS_PX_PER_SECOND = 2_400;
export const MAX_DRAG_DISTANCE_CSS_PX = 180;
export const HERO_FIELD_COLUMNS = 64;
export const HERO_FIELD_ROWS = 40;
export const HERO_FIXED_STEP_MS = 1_000 / 120;
export const HERO_MAX_ELAPSED_MS = 50;
export const HERO_MAX_SUBSTEPS = 6;
export const COMPILE_SEAM_DURATION_MS = 320;

export function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function getPhysicalReleaseStrength(
  charge: number,
  dragDistance: number,
  speed: number,
) {
  return clampUnit(
    charge * 0.55 +
      Math.min(dragDistance / MAX_DRAG_DISTANCE_CSS_PX, 1) * 0.2 +
      Math.min(speed / MAX_RELEASE_SPEED_CSS_PX_PER_SECOND, 1) * 0.25,
  );
}
