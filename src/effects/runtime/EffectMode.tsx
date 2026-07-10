"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  EFFECT_MODE_STORAGE_KEY,
  type EffectMode,
  isEffectMode,
  resolveEffectMode,
} from "@/core/effect-mode";

type EffectModeContextValue = {
  mode: EffectMode;
  setMode: (mode: EffectMode) => void;
  systemReduced: boolean;
};

type EffectModeProviderProps = Readonly<{
  children: ReactNode;
}>;

type EffectPreferences = {
  userMode: EffectMode | null;
  systemReduced: boolean;
  resolved: boolean;
};

const EffectModeContext = createContext<EffectModeContextValue | null>(null);

export function EffectModeProvider({ children }: EffectModeProviderProps) {
  const [preferences, setPreferences] = useState<EffectPreferences>({
    userMode: null,
    systemReduced: false,
    resolved: false,
  });

  useEffect(() => {
    let mediaQuery: MediaQueryList | null = null;
    let listenerRegistered = false;
    let systemReduced = false;

    const handleSystemPreferenceChange = (event: MediaQueryListEvent) => {
      setPreferences((current) => ({
        ...current,
        systemReduced: event.matches,
      }));
    };

    try {
      if (typeof window.matchMedia === "function") {
        mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        systemReduced = mediaQuery.matches;
      }
    } catch {
      // The safe STATIC bootstrap remains valid when media queries are unavailable.
    }

    let storedMode: string | null = null;

    try {
      storedMode = window.localStorage.getItem(EFFECT_MODE_STORAGE_KEY);
    } catch {
      // The in-memory preference remains usable when storage is unavailable.
    }

    // The initial browser snapshot joins storage and system preference after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences({
      userMode: isEffectMode(storedMode) ? storedMode : null,
      systemReduced,
      resolved: true,
    });

    if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
      try {
        mediaQuery.addEventListener("change", handleSystemPreferenceChange);
        listenerRegistered = true;
      } catch {
        // The initial preference still applies if listener registration is rejected.
      }
    }

    return () => {
      if (
        !listenerRegistered ||
        !mediaQuery ||
        typeof mediaQuery.removeEventListener !== "function"
      ) {
        return;
      }

      try {
        mediaQuery.removeEventListener("change", handleSystemPreferenceChange);
      } catch {
        // Cleanup cannot repair a browser that rejects listener removal.
      }
    };
  }, []);

  const setMode = useCallback((nextMode: EffectMode) => {
    setPreferences((current) => ({
      ...current,
      userMode: nextMode,
      resolved: true,
    }));

    try {
      window.localStorage.setItem(EFFECT_MODE_STORAGE_KEY, nextMode);
    } catch {
      // The current in-memory selection remains authoritative for this page visit.
    }
  }, []);

  const mode = preferences.resolved
    ? resolveEffectMode(preferences.userMode, preferences.systemReduced)
    : "static";

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.effectMode = mode;
  }, [mode]);

  const value = useMemo(
    () => ({ mode, setMode, systemReduced: preferences.systemReduced }),
    [mode, preferences.systemReduced, setMode],
  );

  return (
    <EffectModeContext.Provider value={value}>
      {children}
    </EffectModeContext.Provider>
  );
}

export function useEffectMode() {
  const context = useContext(EffectModeContext);

  if (!context) {
    throw new Error("useEffectMode must be used within an EffectModeProvider.");
  }

  return context;
}
