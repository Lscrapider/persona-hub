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
      // Continue with the non-reduced system default when media queries fail.
    }

    let storedMode: string | null = null;

    try {
      storedMode = window.localStorage.getItem(EFFECT_MODE_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }

    // This is the initial browser-only snapshot of two external preferences.
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
        // The initial preference still applies when change events are unavailable.
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
        // Cleanup cannot recover when a browser rejects listener removal.
      }
    };
  }, []);

  const setMode = useCallback((nextMode: EffectMode) => {
    setPreferences((current) => ({
      ...current,
      userMode: nextMode,
      resolved: true,
    }));

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(EFFECT_MODE_STORAGE_KEY, nextMode);
    } catch {
      // The in-memory preference still applies for the current page lifecycle.
    }
  }, []);

  const mode = preferences.resolved
    ? resolveEffectMode(preferences.userMode, preferences.systemReduced)
    : "reduced";

  useEffect(() => {
    const root = document.documentElement;
    const previousMode = root.dataset.effectMode;

    root.dataset.effectMode = mode;

    return () => {
      if (root.dataset.effectMode !== mode) {
        return;
      }

      if (previousMode) {
        root.dataset.effectMode = previousMode;
      } else {
        delete root.dataset.effectMode;
      }
    };
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
