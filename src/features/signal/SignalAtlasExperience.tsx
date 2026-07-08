import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { ChevronsDown, ExternalLink, GitFork, RadioTower, RotateCcw } from 'lucide-react';
import type { AtlasConfig, AtlasProject, AtlasProjectStatus } from '../../config/atlas.schema';
import { useAtlasStore } from '../../store/atlasStore';
import { CosmicShaderBackground } from './CosmicShaderBackground';
import { TransitStarfieldCanvas } from './TransitStarfieldCanvas';

type SignalAtlasExperienceProps = {
  config: AtlasConfig;
  warning?: string;
};

type AtlasEntry = Pick<
  AtlasProject,
  | 'codename'
  | 'title'
  | 'summary'
  | 'url'
  | 'signalType'
  | 'signalDescription'
  | 'registryLabel'
  | 'coordinates'
  | 'accent'
> & {
  status: AtlasProjectStatus;
  kind: 'project' | 'future';
};

type ProjectScene = {
  entry: AtlasEntry;
  index: number;
  side: 'left' | 'right';
  start: number;
  end: number;
  tunnelStart: number;
  tunnelEnd: number;
};

const SCENE_FADE_IN = 0.062;
const SCENE_FADE_OUT = 0.06;
const NARRATIVE_WINDOWS = [
  { start: 0.22, end: 0.38, tunnelStart: 0.12, tunnelEnd: 0.25 },
  { start: 0.46, end: 0.62, tunnelStart: 0.34, tunnelEnd: 0.5 },
  { start: 0.7, end: 0.94, tunnelStart: 0.58, tunnelEnd: 0.74 }
] as const;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function range(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

function smoothRange(progress: number, start: number, end: number) {
  const value = range(progress, start, end);

  return value * value * (3 - 2 * value);
}

function sceneOpacity(progress: number, start: number, end: number) {
  return smoothRange(progress, start, start + SCENE_FADE_IN) * (1 - smoothRange(progress, end - SCENE_FADE_OUT, end));
}

function tunnelPulse(progress: number, start: number, end: number) {
  if (progress < start || progress > end) return 0;

  return Math.sin(range(progress, start, end) * Math.PI);
}

function tunnelProgress(progress: number, start: number, end: number) {
  return range(progress, start, end);
}

function tunnelArrival(progress: number) {
  return range(progress, 0.64, 1);
}

function tunnelReadoutFade(progress: number) {
  return 1 - smoothRange(progress, 0.78, 1);
}

function statusLabel(status: AtlasProjectStatus) {
  if (status === 'live') return 'Live signal';
  if (status === 'building') return 'In construction';
  return 'Coming soon';
}

function coordinateLabel(entry: AtlasEntry) {
  return `${entry.coordinates.x.toFixed(1)} / ${entry.coordinates.y.toFixed(1)}`;
}

const FALLBACK_FUTURE_ENTRY: AtlasEntry = {
  kind: 'future',
  codename: 'FUTURE SIGNAL',
  title: '期待未来坐标',
  summary: '保留给下一个具体项目的位置。现在先作为一片未命名星云，等待新的信号进入星图。',
  url: null,
  signalType: 'Reserved Nebula',
  signalDescription: 'A future coordinate held open inside the atlas.',
  registryLabel: 'Future project placeholder',
  status: 'coming-soon',
  coordinates: { x: 48, y: 66 },
  accent: 'oklch(0.78 0.12 286)'
};

function futureEntry(): AtlasEntry {
  return {
    ...FALLBACK_FUTURE_ENTRY
  };
}

function projectScenes(projects: AtlasProject[]) {
  const configuredEntries = projects.slice(0, 3).map((project, index) => ({
    ...project,
    kind: index >= 2 ? ('future' as const) : ('project' as const)
  }));
  const entries: AtlasEntry[] = configuredEntries.length >= 3 ? configuredEntries : [...configuredEntries, futureEntry()];

  return entries.map<ProjectScene>((entry, index) => ({
    entry,
    index,
    side: index % 2 === 0 ? 'right' : 'left',
    ...NARRATIVE_WINDOWS[index]
  }));
}

const AUTO_TRAVERSE_PX_PER_SECOND = 760;
const AUTO_TRAVERSE_MIN_DURATION = 1800;
const AUTO_TRAVERSE_MAX_DURATION = 8400;
const AUTO_TRAVERSE_TARGET_EPSILON = 0.018;
const AUTO_TRAVERSE_CANCEL_EVENTS: Array<keyof WindowEventMap> = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

export function SignalAtlasExperience({ config, warning }: SignalAtlasExperienceProps) {
  const autoTraverseFrameRef = useRef<number | null>(null);
  const autoTraverseCleanupRef = useRef<(() => void) | null>(null);
  const scrollProgress = useAtlasStore((state) => state.scrollProgress);
  const reducedMotion = useAtlasStore((state) => state.reducedMotion);
  const scenes = useMemo(() => projectScenes(config.projects), [config.projects]);
  const heroOpacity = 1 - range(scrollProgress, 0.1, 0.18);
  const boundaryOpacity = smoothRange(scrollProgress, 0.93, 0.985);
  const boundaryInteractive = boundaryOpacity > 0.45;
  const traverseTargets = useMemo(
    () => [
      ...scenes.map((scene) => ({
        progress: (scene.start + scene.end) / 2,
        label: scene.entry.codename
      })),
      { progress: 0.985, label: 'ATLAS BOUNDARY' }
    ],
    [scenes]
  );
  const nextTraverseTarget =
    traverseTargets.find((target) => target.progress > scrollProgress + AUTO_TRAVERSE_TARGET_EPSILON) ?? null;
  const traverseOpacity = nextTraverseTarget ? 1 - boundaryOpacity : 0;
  const sceneStates = scenes.map((scene) => ({
    scene,
    opacity: sceneOpacity(scrollProgress, scene.start, scene.end),
    tunnel: reducedMotion ? 0 : tunnelPulse(scrollProgress, scene.tunnelStart, scene.tunnelEnd),
    tunnelProgress: tunnelProgress(scrollProgress, scene.tunnelStart, scene.tunnelEnd)
  }));
  const transitState =
    sceneStates.find(({ scene }) => scrollProgress >= scene.tunnelStart && scrollProgress <= scene.tunnelEnd) ?? null;
  const activeScene =
    sceneStates.find(({ opacity }) => opacity > 0.08)?.scene ??
    transitState?.scene ??
    null;
  const tunnelIntensity = Math.max(...sceneStates.map(({ tunnel }) => tunnel), 0);
  const activeTunnelState = transitState ?? sceneStates.reduce((best, current) => (current.tunnel > best.tunnel ? current : best));
  const visualTunnelIntensity = reducedMotion ? 0 : tunnelIntensity;
  const tunnelScaleIntensity = visualTunnelIntensity * visualTunnelIntensity;
  const tunnelPhase = transitState ? activeTunnelState.tunnelProgress : 0;
  const readoutIntensity = visualTunnelIntensity * tunnelReadoutFade(tunnelPhase);
  const arrivalPresence = reducedMotion ? 0 : tunnelArrival(tunnelPhase) * visualTunnelIntensity;
  const projectPresence = Math.max(...sceneStates.map(({ opacity }) => opacity), arrivalPresence);
  const activeIndex = activeScene ? activeScene.index + 1 : 0;
  const activeSide = activeScene ? (activeScene.side === 'right' ? 1 : -1) : 0;
  const activePhase = visualTunnelIntensity > 0.3 ? 'Transit Corridor' : activeScene?.entry.codename ?? 'Deep Field';
  const atlasDepth = Math.round(scrollProgress * 8191)
    .toString()
    .padStart(4, '0');

  const cancelAutoTraverse = useCallback(() => {
    if (autoTraverseFrameRef.current !== null) {
      window.cancelAnimationFrame(autoTraverseFrameRef.current);
      autoTraverseFrameRef.current = null;
    }

    autoTraverseCleanupRef.current?.();
    autoTraverseCleanupRef.current = null;
  }, []);

  const scrollToOrigin = useCallback(() => {
    cancelAutoTraverse();
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [cancelAutoTraverse, reducedMotion]);

  const startAutoTraverse = useCallback(() => {
    cancelAutoTraverse();

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const startY = window.scrollY;
    const currentProgress = maxScroll > 0 ? startY / maxScroll : 0;
    const target = traverseTargets.find((item) => item.progress > currentProgress + AUTO_TRAVERSE_TARGET_EPSILON);

    if (!target) return;

    const targetY = Math.min(maxScroll, Math.max(0, target.progress * maxScroll));
    const distance = Math.max(0, targetY - startY);

    if (distance <= 2) return;

    if (reducedMotion) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      return;
    }

    const duration = Math.min(
      AUTO_TRAVERSE_MAX_DURATION,
      Math.max(AUTO_TRAVERSE_MIN_DURATION, (distance / AUTO_TRAVERSE_PX_PER_SECOND) * 1000)
    );
    const startedAt = window.performance.now();
    const listenerOptions: AddEventListenerOptions = { passive: true };
    const finishAutoTraverse = () => {
      if (autoTraverseFrameRef.current !== null) {
        window.cancelAnimationFrame(autoTraverseFrameRef.current);
        autoTraverseFrameRef.current = null;
      }

      autoTraverseCleanupRef.current?.();
      autoTraverseCleanupRef.current = null;
    };
    const abortAutoTraverse = () => finishAutoTraverse();

    AUTO_TRAVERSE_CANCEL_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, abortAutoTraverse, listenerOptions);
    });
    autoTraverseCleanupRef.current = () => {
      AUTO_TRAVERSE_CANCEL_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, abortAutoTraverse, listenerOptions);
      });
    };

    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      window.scrollTo(0, startY + distance * progress);

      if (progress < 1) {
        autoTraverseFrameRef.current = window.requestAnimationFrame(step);
        return;
      }

      finishAutoTraverse();
    };

    autoTraverseFrameRef.current = window.requestAnimationFrame(step);
  }, [cancelAutoTraverse, reducedMotion, traverseTargets]);

  useEffect(() => cancelAutoTraverse, [cancelAutoTraverse]);

  const narrativeStyle = {
    '--deep-opacity': heroOpacity,
    '--tunnel-intensity': visualTunnelIntensity,
    '--project-presence': projectPresence,
    '--boundary-opacity': boundaryOpacity,
    '--traverse-opacity': traverseOpacity,
    '--field-scale': 1 + scrollProgress * 0.08 + tunnelScaleIntensity * 0.58,
    '--field-dim': 0.68 + projectPresence * 0.12,
    '--scan-opacity': tunnelIntensity,
    '--registry-opacity': projectPresence
  } as CSSProperties;

  return (
    <section className="signal-atlas" style={narrativeStyle} aria-label="Scra Atlas cosmic project sequence">
      <div className="deep-field" aria-hidden="true">
        <CosmicShaderBackground
          focusIndex={activeIndex}
          focusSide={activeSide}
          tunnelIntensity={visualTunnelIntensity}
          tunnelPhase={tunnelPhase}
          projectPresence={projectPresence}
        />
        <TransitStarfieldCanvas
          focusIndex={activeIndex}
          focusSide={activeSide}
          tunnelIntensity={visualTunnelIntensity}
          tunnelPhase={tunnelPhase}
          reducedMotion={reducedMotion}
        />
        <div className="field-plate field-plate--shadow" />
      </div>

      <header className="atlas-topline">
        <a
          href="#top"
          className="atlas-mark"
          aria-label="Scra Atlas home"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
          }}
        >
          <RadioTower size={18} />
          <span>Scra Atlas</span>
        </a>
        <div className="atlas-phase" aria-hidden="true">
          <span>{activePhase}</span>
          <span>Z {atlasDepth}</span>
        </div>
        <a className="atlas-github" href={config.identity.github} target="_blank" rel="noreferrer">
          <GitFork size={17} />
          <span>GitHub</span>
        </a>
      </header>

      <section className="story-act story-act--deep" id="top" aria-label="Deep Field">
        <span className="system-label">Nebula Field</span>
        <h1>{config.identity.name}</h1>
        <p>{config.identity.description}</p>
      </section>

      <div className="atlas-traverse-panel" style={{ pointerEvents: nextTraverseTarget ? 'auto' : 'none' } as CSSProperties}>
        <button
          className="atlas-traverse"
          type="button"
          onClick={startAutoTraverse}
          disabled={!nextTraverseTarget}
        >
          <ChevronsDown size={16} />
          <span>Auto Traverse</span>
        </button>
        <span className="atlas-traverse-panel__meta">
          {nextTraverseTarget ? `Next: ${nextTraverseTarget.label}` : 'Boundary reached'}
        </span>
      </div>

      <div className="tunnel-readout" style={{ opacity: readoutIntensity }} aria-hidden="true">
        <span>Long-range transit</span>
        <strong>{activeScene?.entry.codename ?? 'DEEP FIELD'}</strong>
      </div>

      {sceneStates.map(({ scene, opacity }) => (
        <ProjectPage
          key={scene.entry.codename}
          scene={scene}
          opacity={opacity}
          interactive={opacity > 0.5}
        />
      ))}

      <section
        className="atlas-boundary"
        style={{ pointerEvents: boundaryInteractive ? 'auto' : 'none' } as CSSProperties}
        aria-label="Atlas boundary"
        aria-hidden={!boundaryInteractive}
      >
        <span className="system-label">Atlas Boundary</span>
        <h2>ATLAS BOUNDARY</h2>
        <p>Current coordinates exhausted. New signals can be indexed from here.</p>
        <div className="atlas-boundary__actions">
          <button className="atlas-boundary__action" type="button" onClick={scrollToOrigin} tabIndex={boundaryInteractive ? 0 : -1}>
            <RotateCcw size={15} />
            <span>Return to origin</span>
          </button>
          <a
            className="atlas-boundary__action atlas-boundary__action--secondary"
            href={config.identity.github}
            target="_blank"
            rel="noreferrer"
            tabIndex={boundaryInteractive ? 0 : -1}
          >
            <GitFork size={15} />
            <span>GitHub</span>
          </a>
        </div>
      </section>

      {warning ? <p className="config-warning">Fallback config active: {warning}</p> : null}
    </section>
  );
}

type ProjectPageProps = {
  scene: ProjectScene;
  opacity: number;
  interactive: boolean;
};

function ProjectPage({ scene, opacity, interactive }: ProjectPageProps) {
  const { entry } = scene;
  const reverse = scene.side === 'left';

  return (
    <section
      className={reverse ? 'atlas-project-page atlas-project-page--reverse' : 'atlas-project-page'}
      style={
        {
          '--scene-opacity': opacity,
          '--accent': entry.accent,
          pointerEvents: interactive ? 'auto' : 'none'
        } as CSSProperties
      }
      aria-label={`${entry.codename} project page`}
      aria-hidden={!interactive}
    >
      <div className="project-copy">
        <span className="system-label">{entry.signalType}</span>
        <h2>{entry.codename}</h2>
        <p className="project-copy__signal">{entry.signalDescription}</p>
        <p>{entry.summary}</p>

        <dl className="project-copy__meta">
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(entry.status)}</dd>
          </div>
          <div>
            <dt>Coordinate</dt>
            <dd>{coordinateLabel(entry)}</dd>
          </div>
          <div>
            <dt>Index</dt>
            <dd>{entry.registryLabel}</dd>
          </div>
        </dl>

        {entry.url ? (
          <a className="signal-link" href={entry.url} target="_blank" rel="noreferrer" tabIndex={interactive ? 0 : -1}>
            <ExternalLink size={16} />
            <span>Open project</span>
          </a>
        ) : (
          <span className="signal-status">{statusLabel(entry.status)}</span>
        )}
      </div>

      <div className="project-nebula-window" aria-hidden="true">
        <div className="project-nebula-window__scope">
          <span>{entry.title}</span>
          <strong>{entry.coordinates.x.toFixed(1)}</strong>
        </div>
      </div>
    </section>
  );
}
