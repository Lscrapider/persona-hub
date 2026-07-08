import { useEffect, useState } from 'react';
import type { AtlasConfig } from '../config/atlas.schema';
import { fallbackAtlasConfig } from '../data/fallbackAtlasConfig';
import { loadAtlasConfig } from '../config/loadAtlasConfig';
import { AppShell } from './AppShell';

type AppState = {
  config: AtlasConfig;
  warning?: string;
};

export function App() {
  const [appState, setAppState] = useState<AppState>({
    config: fallbackAtlasConfig
  });

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const result = await loadAtlasConfig();

        if (cancelled) return;

        setAppState({
          config: result.config,
          warning: result.error
        });
      } catch (error) {
        if (cancelled) return;

        setAppState({
          config: fallbackAtlasConfig,
          warning: error instanceof Error ? error.message : 'Unknown config error'
        });
      }
    }

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return <AppShell config={appState.config} warning={appState.warning} />;
}
