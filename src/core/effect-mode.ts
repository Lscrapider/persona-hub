export const EFFECT_MODES = ["full", "static"] as const;

export type EffectMode = (typeof EFFECT_MODES)[number];

export const EFFECT_MODE_STORAGE_KEY = "scra-atlas:effect-mode";

export function isEffectMode(value: unknown): value is EffectMode {
  return value === "full" || value === "static";
}

export function resolveEffectMode(
  userMode: EffectMode | null,
  systemReduced: boolean,
): EffectMode {
  if (userMode) {
    return userMode;
  }

  return systemReduced ? "static" : "full";
}
