"use client";

import { EFFECT_MODES, type EffectMode } from "@/core/effect-mode";
import { useEffectMode } from "@/effects/runtime/EffectMode";

const EFFECT_MODE_LABELS: Record<EffectMode, string> = {
  full: "FULL",
  static: "STATIC",
};

export function EffectModeControl() {
  const { mode, setMode } = useEffectMode();

  return (
    <div aria-label="Effect mode" className="effect-mode-control" role="group">
      <span className="effect-mode-control__label">EFFECTS</span>
      {EFFECT_MODES.map((effectMode) => {
        const isActive = mode === effectMode;

        return (
          <button
            aria-pressed={isActive}
            className="effect-mode-control__option"
            data-active={isActive || undefined}
            key={effectMode}
            onClick={() => setMode(effectMode)}
            type="button"
          >
            {EFFECT_MODE_LABELS[effectMode]}
          </button>
        );
      })}
    </div>
  );
}
