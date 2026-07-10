import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import type { AtlasConfig, AtlasProject, AtlasProjectStatus } from '../../config/atlas.schema';
import { useAtlasStore } from '../../store/atlasStore';
import { CosmicThreeScene } from './CosmicThreeScene';

type SignalAtlasExperienceProps = {
  config: AtlasConfig;
  warning?: string;
};

type AtlasEntry = Pick<
  AtlasProject,
  'codename' | 'title' | 'summary' | 'url' | 'signalType' | 'signalDescription' | 'coordinates' | 'accent'
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
  transitStart: number;
  transitEnd: number;
};

const SCENE_FADE_IN = 0.062;
const SCENE_FADE_OUT = 0.06;
const PROJECT_HANDOFF_PRESENCE = 0.58;
const NARRATIVE_WINDOWS = [
  { start: 0.22, end: 0.38, transitStart: 0.12, transitEnd: 0.25 },
  { start: 0.46, end: 0.62, transitStart: 0.34, transitEnd: 0.5 },
  { start: 0.7, end: 0.94, transitStart: 0.58, transitEnd: 0.74 }
] as const;

const AUTO_TRAVERSE_PX_PER_SECOND = 760;
const AUTO_TRAVERSE_MIN_DURATION = 1800;
const AUTO_TRAVERSE_MAX_DURATION = 8400;
const AUTO_TRAVERSE_TARGET_EPSILON = 0.018;
const AUTO_TRAVERSE_CANCEL_EVENTS: Array<keyof WindowEventMap> = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

const FALLBACK_FUTURE_ENTRY: AtlasEntry = {
  kind: 'future',
  codename: 'FUTURE SIGNAL',
  title: 'Uncatalogued deep-space region',
  summary: 'A reserved anomaly region waiting for the next concrete project to take shape.',
  url: null,
  signalType: 'Uncatalogued Phenomenon',
  signalDescription: 'A deep-space anomaly held open for a future project.',
  status: 'coming-soon',
  coordinates: { x: 48, y: 66 },
  accent: 'oklch(0.78 0.12 286)'
};

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

function transitPulse(progress: number, start: number, end: number) {
  if (progress < start || progress > end) return 0;

  return Math.sin(range(progress, start, end) * Math.PI);
}

function transitProgress(progress: number, start: number, end: number) {
  return range(progress, start, end);
}

function transitArrival(progress: number) {
  return smoothRange(progress, 0.64, 1);
}

function statusLabel(status: AtlasProjectStatus) {
  if (status === 'live') return 'Open project';
  if (status === 'building') return 'Still forming';
  return 'Still forming';
}

function futureEntry(): AtlasEntry {
  return { ...FALLBACK_FUTURE_ENTRY };
}

function projectScenes(projects: AtlasProject[]) {
  const configuredEntries = projects.slice(0, 3).map((project, index) => ({
    codename: project.codename,
    title: project.title,
    summary: project.summary,
    url: project.url,
    signalType: project.signalType,
    signalDescription: project.signalDescription,
    coordinates: project.coordinates,
    accent: project.accent,
    status: project.status,
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

export function SignalAtlasExperience({ config, warning }: SignalAtlasExperienceProps) {
  const autoTraverseFrameRef = useRef<number | null>(null);
  const autoTraverseCleanupRef = useRef<(() => void) | null>(null);
  const scrollProgress = useAtlasStore((state) => state.scrollProgress);
  const reducedMotion = useAtlasStore((state) => state.reducedMotion);
  const scenes = useMemo(() => projectScenes(config.projects), [config.projects]);
  const cosmicProjects = useMemo(() => scenes.map((scene) => scene.entry), [scenes]);
  const heroOpacity = 1 - range(scrollProgress, 0.1, 0.18);
  const boundaryOpacity = smoothRange(scrollProgress, 0.93, 0.985);
  const boundaryInteractive = boundaryOpacity > 0.45;
  const sceneStates = scenes.map((scene) => ({
    scene,
    opacity: sceneOpacity(scrollProgress, scene.start, scene.end),
    transit: reducedMotion ? 0 : transitPulse(scrollProgress, scene.transitStart, scene.transitEnd),
    transitProgress: transitProgress(scrollProgress, scene.transitStart, scene.transitEnd),
    handoff:
      !reducedMotion && scrollProgress >= scene.transitStart && scrollProgress <= scene.start + SCENE_FADE_IN
        ? transitArrival(transitProgress(scrollProgress, scene.transitStart, scene.transitEnd)) * PROJECT_HANDOFF_PRESENCE
        : 0
  }));
  const transitState =
    sceneStates.find(({ scene }) => scrollProgress >= scene.transitStart && scrollProgress <= scene.transitEnd) ?? null;
  const activeScene = sceneStates.find(({ opacity }) => opacity > 0.08)?.scene ?? transitState?.scene ?? null;
  const transitIntensity = Math.max(...sceneStates.map(({ transit }) => transit), 0);
  const activeTransitState =
    transitState ?? sceneStates.reduce((best, current) => (current.transit > best.transit ? current : best));
  const visualTransitIntensity = reducedMotion ? 0 : transitIntensity;
  const transitPhase = transitState ? activeTransitState.transitProgress : 0;
  const projectOpacities = sceneStates.map(({ opacity, handoff }) => Math.max(opacity, handoff));
  const activeIndex = activeScene?.index ?? -1;
  const spatialActiveIndex = transitState ? activeTransitState.scene.index : activeIndex;
  const traverseTargets = useMemo(
    () => [
      ...scenes.map((scene) => ({
        progress: (scene.start + scene.end) / 2,
        label: scene.entry.codename
      })),
      { progress: 0.985, label: 'Open field' }
    ],
    [scenes]
  );
  const nextTraverseTarget =
    traverseTargets.find((target) => target.progress > scrollProgress + AUTO_TRAVERSE_TARGET_EPSILON) ?? null;
  const traverseOpacity = nextTraverseTarget ? 1 - boundaryOpacity : 0;

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
    '--boundary-opacity': boundaryOpacity,
    '--traverse-opacity': traverseOpacity
  } as CSSProperties;

  return (
    <section className="signal-atlas" style={narrativeStyle} aria-label="Scra Atlas cosmic phenomenon sequence">
      <div className="deep-field" aria-hidden="true">
        <CosmicThreeScene
          projects={cosmicProjects}
          activeIndex={spatialActiveIndex}
          projectOpacities={projectOpacities}
          scrollProgress={scrollProgress}
          transitIntensity={visualTransitIntensity}
          transitPhase={transitPhase}
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
          Scra Atlas
        </a>
        <a className="atlas-github" href={config.identity.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
      </header>

      <section className="story-act story-act--deep" id="top" aria-label="Deep Field">
        <span className="cosmic-label">Deep cosmic field</span>
        <h1>{config.identity.name}</h1>
        <p>{config.identity.description}</p>
      </section>

      <div className="atlas-traverse-panel" style={{ pointerEvents: nextTraverseTarget ? 'auto' : 'none' } as CSSProperties}>
        <button className="atlas-traverse" type="button" onClick={startAutoTraverse} disabled={!nextTraverseTarget}>
          Drift forward
        </button>
        <span className="atlas-traverse-panel__meta">
          {nextTraverseTarget ? nextTraverseTarget.label : 'Open field'}
        </span>
      </div>

      {sceneStates.map(({ scene, opacity }) => (
        <ProjectPage
          key={scene.entry.codename}
          scene={scene}
          opacity={opacity}
          interactive={opacity > 0.5 && visualTransitIntensity < 0.22}
        />
      ))}

      <section
        className="atlas-boundary"
        style={{ pointerEvents: boundaryInteractive ? 'auto' : 'none' } as CSSProperties}
        aria-label="Open deep field"
        aria-hidden={!boundaryInteractive}
      >
        <span className="cosmic-label">Open deep field</span>
        <h2>Space keeps opening.</h2>
        <p>The current phenomena recede into deeper dark. New project matter can form from here.</p>
        <div className="atlas-boundary__actions">
          <button className="atlas-boundary__action" type="button" onClick={scrollToOrigin} tabIndex={boundaryInteractive ? 0 : -1}>
            Return to origin
          </button>
          <a
            className="atlas-boundary__action atlas-boundary__action--secondary"
            href={config.identity.github}
            target="_blank"
            rel="noreferrer"
            tabIndex={boundaryInteractive ? 0 : -1}
          >
            GitHub
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
      aria-label={`${entry.codename} project cosmic phenomenon`}
      aria-hidden={!interactive}
    >
      <div className="project-copy">
        <span className="cosmic-label">{entry.signalType}</span>
        <h2>{entry.codename}</h2>
        <p className="project-copy__signal">{entry.signalDescription}</p>
        <p>{entry.summary}</p>
        <span className="project-copy__title">{entry.title}</span>

        {entry.url ? (
          <a className="signal-link" href={entry.url} target="_blank" rel="noreferrer" tabIndex={interactive ? 0 : -1}>
            {statusLabel(entry.status)}
          </a>
        ) : (
          <span className="signal-status">{statusLabel(entry.status)}</span>
        )}
      </div>
    </section>
  );
}
