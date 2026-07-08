import { useEffect, useState } from 'react';
import type { AtlasConfig } from '../config/atlas.schema';
import { loadAtlasConfig } from '../config/loadAtlasConfig';
import { withBasePath } from '../config/assetPath';
import { AppShell } from './AppShell';

type LoadState =
  | { status: 'loading'; progress: number; label: string }
  | { status: 'ready'; config: AtlasConfig; warning?: string }
  | { status: 'error'; message: string };

const MIN_BOOT_TIME_MS = 1350;
const BOOT_SEQUENCE_PATH = withBasePath('/assets/generated/boot-calibration-loop.webp');
const BOOT_STILL_PATH = withBasePath('/assets/generated/boot-calibration-still.png');

function collectAssetPaths(config: AtlasConfig, reducedMotion: boolean) {
  return [
    reducedMotion ? config.experience.assets.bootStill : config.experience.assets.bootSequence
  ].map(withBasePath);
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function preloadImages(paths: string[], onProgress: (progress: number) => void) {
  if (!paths.length) {
    onProgress(1);
    return Promise.resolve();
  }

  let loaded = 0;

  return Promise.all(
    paths.map(
      (path) =>
        new Promise<void>((resolve) => {
          const image = new Image();

          const complete = () => {
            loaded += 1;
            onProgress(loaded / paths.length);
            resolve();
          };

          image.onload = complete;
          image.onerror = complete;
          image.src = path;
        })
    )
  ).then(() => undefined);
}

export function App() {
  const [loadState, setLoadState] = useState<LoadState>({
    status: 'loading',
    progress: 0,
    label: 'Opening observatory'
  });

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const minimumBoot = delay(MIN_BOOT_TIME_MS);
        const reducedMotion = prefersReducedMotion();
        const result = await loadAtlasConfig();

        if (cancelled) return;

        setLoadState({
          status: 'loading',
          progress: 0.22,
          label: 'Loading observatory shell'
        });

        await preloadImages(collectAssetPaths(result.config, reducedMotion), (progress) => {
          if (cancelled) return;

          setLoadState({
            status: 'loading',
            progress: 0.22 + progress * 0.68,
            label: progress < 1 ? 'Calibrating shader field' : 'Locking coordinate field'
          });
        });

        await minimumBoot;

        if (cancelled) return;

        setLoadState({
          status: 'ready',
          config: result.config,
          warning: result.error
        });
      } catch (error) {
        if (cancelled) return;

        setLoadState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown loading error'
        });
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadState.status === 'loading') {
    const percentage = Math.round(loadState.progress * 100)
      .toString()
      .padStart(2, '0');
    const bootAssetPath = prefersReducedMotion() ? BOOT_STILL_PATH : BOOT_SEQUENCE_PATH;

    return (
      <main className="boot-screen" aria-label="Scra Atlas loading">
        <div className="boot-screen__frame">
          <span className="boot-screen__tag">SCRA ATLAS / DEEP FIELD OBSERVATORY</span>
          <div className="boot-screen__visual" aria-hidden="true">
            <img src={bootAssetPath} alt="" draggable="false" />
          </div>
          <div className="boot-screen__readout" role="status" aria-live="polite">
            <span>{loadState.label}</span>
            <strong>{percentage}%</strong>
          </div>
          <div
            className="boot-screen__bar"
            role="progressbar"
            aria-label="Loading assets"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(percentage)}
          >
            <span style={{ inlineSize: `${percentage}%` }} />
          </div>
        </div>
      </main>
    );
  }

  if (loadState.status === 'error') {
    return (
      <main className="boot-screen boot-screen--error">
        <div className="boot-screen__frame">
          <span className="boot-screen__tag">ATLAS OFFLINE</span>
          <p>{loadState.message}</p>
        </div>
      </main>
    );
  }

  return <AppShell config={loadState.config} warning={loadState.warning} />;
}
