export const EFFECT_MODES = ["full", "reduced", "static"] as const;

export type EffectMode = (typeof EFFECT_MODES)[number];

export const EFFECT_MODE_STORAGE_KEY = "scra-atlas:effect-mode";

export function isEffectMode(value: unknown): value is EffectMode {
  return value === "full" || value === "reduced" || value === "static";
}

export function resolveEffectMode(
  userMode: EffectMode | null,
  systemReduced: boolean,
): EffectMode {
  if (userMode === "full" || userMode === "static") {
    return userMode;
  }

  if (userMode === "reduced" || systemReduced) {
    return "reduced";
  }

  return "full";
}
