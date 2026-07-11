"use client";

import { EFFECT_MODES, type EffectMode } from "@/core/effect-mode";
import { useEffectMode } from "@/effects/runtime/EffectMode";
import { useLocaleContent } from "@/i18n/LocaleProvider";

export function EffectModeControl() {
  const { mode, setMode } = useEffectMode();
  const { content } = useLocaleContent();
  const labels: Record<EffectMode, string> = {
    full: content.site.ui.effects.full,
    static: content.site.ui.effects.static,
  };
  const copy = content.site.ui.effects;

  return (
    <div aria-label={copy.groupLabel} className="effect-mode-control" role="group">
      <span className="effect-mode-control__label">{copy.label}</span>
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
            {labels[effectMode]}
          </button>
        );
      })}
    </div>
  );
}
