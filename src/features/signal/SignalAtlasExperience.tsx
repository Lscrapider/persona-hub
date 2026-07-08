import type { CSSProperties } from 'react';
import { ExternalLink, GitFork, RadioTower } from 'lucide-react';
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

const SCENE_FADE_IN = 0.045;
const SCENE_FADE_OUT = 0.055;
const NARRATIVE_WINDOWS = [
  { start: 0.22, end: 0.38, tunnelStart: 0.13, tunnelEnd: 0.22 },
  { start: 0.46, end: 0.62, tunnelStart: 0.38, tunnelEnd: 0.46 },
  { start: 0.7, end: 0.94, tunnelStart: 0.62, tunnelEnd: 0.7 }
] as const;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

function range(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start));
}

function sceneOpacity(progress: number, start: number, end: number) {
  return range(progress, start, start + SCENE_FADE_IN) * (1 - range(progress, end - SCENE_FADE_OUT, end));
}

function tunnelPulse(progress: number, start: number, end: number) {
  const middle = (start + end) / 2;

  if (progress < start || progress > end) return 0;
  if (progress <= middle) return range(progress, start, middle);

  return 1 - range(progress, middle, end);
}

function tunnelProgress(progress: number, start: number, end: number) {
  return range(progress, start, end);
}

function tunnelArrival(progress: number) {
  return range(progress, 0.64, 1);
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

export function SignalAtlasExperience({ config, warning }: SignalAtlasExperienceProps) {
  const scrollProgress = useAtlasStore((state) => state.scrollProgress);
  const reducedMotion = useAtlasStore((state) => state.reducedMotion);
  const scenes = projectScenes(config.projects);
  const heroOpacity = 1 - range(scrollProgress, 0.1, 0.18);
  const sceneStates = scenes.map((scene) => ({
    scene,
    opacity: sceneOpacity(scrollProgress, scene.start, scene.end),
    tunnel: reducedMotion ? 0 : tunnelPulse(scrollProgress, scene.tunnelStart, scene.tunnelEnd),
    tunnelProgress: tunnelProgress(scrollProgress, scene.tunnelStart, scene.tunnelEnd)
  }));
  const activeScene =
    sceneStates.find(({ opacity }) => opacity > 0.08)?.scene ??
    sceneStates.find(({ tunnel }) => tunnel > 0.08)?.scene ??
    null;
  const tunnelIntensity = Math.max(...sceneStates.map(({ tunnel }) => tunnel), 0);
  const activeTunnelState = sceneStates.reduce((best, current) => (current.tunnel > best.tunnel ? current : best));
  const tunnelPhase = activeTunnelState.tunnel > 0.02 ? activeTunnelState.tunnelProgress : 0;
  const arrivalPresence = reducedMotion ? 0 : tunnelArrival(tunnelPhase) * activeTunnelState.tunnel;
  const projectPresence = Math.max(...sceneStates.map(({ opacity }) => opacity), arrivalPresence);
  const activeIndex = activeScene ? activeScene.index + 1 : 0;
  const activeSide = activeScene ? (activeScene.side === 'right' ? 1 : -1) : 0;
  const activePhase = tunnelIntensity > 0.3 ? 'Transit Corridor' : activeScene?.entry.codename ?? 'Deep Field';
  const atlasDepth = Math.round(scrollProgress * 8191)
    .toString()
    .padStart(4, '0');

  const narrativeStyle = {
    '--deep-opacity': heroOpacity,
    '--tunnel-intensity': tunnelIntensity,
    '--project-presence': projectPresence,
    '--field-scale': 1 + scrollProgress * 0.08 + tunnelIntensity * 0.68,
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
          tunnelIntensity={tunnelIntensity}
          tunnelPhase={tunnelPhase}
          projectPresence={projectPresence}
        />
        <TransitStarfieldCanvas
          focusIndex={activeIndex}
          focusSide={activeSide}
          tunnelIntensity={tunnelIntensity}
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

      <div className="tunnel-readout" style={{ opacity: tunnelIntensity }} aria-hidden="true">
        <span>Long-range transit</span>
        <strong>{activeScene?.entry.codename ?? 'SCANNING'}</strong>
      </div>

      {sceneStates.map(({ scene, opacity }) => (
        <ProjectPage
          key={scene.entry.codename}
          scene={scene}
          opacity={opacity}
          interactive={opacity > 0.5}
        />
      ))}

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
