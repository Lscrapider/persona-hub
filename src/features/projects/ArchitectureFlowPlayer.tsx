"use client";

import { useEffect, type RefObject } from "react";
import { createPortal } from "react-dom";

import type { ArchitectureRenderer } from "./architectureRenderer";
import type { ArchitectureFlow, ArchitectureFlowStep, ArchitectureNode } from "./projectArchitecture";
import { useArchitecturePlayback } from "./useArchitecturePlayback";

type Props = Readonly<{
  flow: ArchitectureFlow;
  nodes: readonly ArchitectureNode[];
  renderer: RefObject<ArchitectureRenderer | null>;
  host: RefObject<HTMLDivElement | null>;
  narrationHost: HTMLDivElement | null;
  enabled: boolean;
  staticMode: boolean;
  zh: boolean;
  onStepChange: (step: ArchitectureFlowStep | null) => void;
  onPlayingChange: (playing: boolean) => void;
}>;

export function ArchitectureFlowPlayer({ flow, nodes, renderer, host, narrationHost, enabled, staticMode, zh, onStepChange, onPlayingChange }: Props) {
  const steps = flow.steps ?? [];
  const { index, step, playing, complete, speed, meter, seek, seekFraction, replay, toggle, toggleSpeed } = useArchitecturePlayback(steps, renderer, host, enabled);
  useEffect(() => {
    onStepChange(step ?? null);
    return () => onStepChange(null);
  }, [onStepChange, step]);
  useEffect(() => { onPlayingChange(playing && !complete); }, [onPlayingChange, complete, playing]);
  const nodeLabel = (id: string) => nodes.find((node) => node.id === id)?.label ?? id;
  if (!step) return null;

  const narration = <div className="architecture-player__story" aria-live="polite" aria-atomic="true">
      <div className="architecture-player__eyebrow"><span>{flow.label}</span><span>{complete ? zh ? "已完成" : "COMPLETE" : zh ? "当前动作" : "CURRENT ACTION"}</span></div>
      <h4>{step.title}</h4>
      <p>{step.description}</p>
      <div className="architecture-player__route"><span>{nodeLabel(step.from)}</span><span aria-hidden="true">{step.from === step.to ? "⟳" : "→"}</span><strong>{step.from === step.to ? zh ? "内部处理" : "Internal processing" : nodeLabel(step.to)}</strong></div>
    </div>;

  return <div className="architecture-player" data-step={index + 1} data-state={complete ? "complete" : playing && enabled ? "playing" : "paused"}>
    {narrationHost ? createPortal(narration, narrationHost) : null}
    <div className="architecture-player__actions">
      <span className="architecture-player__status">{staticMode ? zh ? "STATIC · 逐步查看" : "STATIC · STEP THROUGH" : complete ? zh ? "交互结束，可重新播放" : "Finished. Replay this interaction." : playing && enabled ? zh ? "正在流转" : "REQUEST IN MOTION" : zh ? "已暂停" : "PAUSED"}</span>
      <div className="architecture-player__controls">
        <button type="button" onClick={() => seek(index - 1)} disabled={index === 0} aria-label={zh ? "上一步" : "Previous step"}>←</button>
        <button className="architecture-player__play" type="button" onClick={complete ? replay : toggle} disabled={staticMode}>{staticMode ? zh ? "手动" : "Manual" : complete ? zh ? "重播" : "Replay" : playing ? zh ? "暂停" : "Pause" : zh ? "继续" : "Resume"}</button>
        <button type="button" onClick={() => seek(index + 1)} disabled={index === steps.length - 1} aria-label={zh ? "下一步" : "Next step"}>→</button>
        <button type="button" onClick={toggleSpeed} disabled={staticMode} aria-label={zh ? `播放速度 ${speed} 倍，点击切换` : `Playback speed ${speed}x, select to change`}>{speed}×</button>
        <button type="button" onClick={replay} aria-label={zh ? "从头开始" : "Restart from beginning"}>↺</button>
      </div>
    </div>
    <input
      className="architecture-player__progress"
      type="range"
      min="0"
      max="1000"
      step="1"
      defaultValue="0"
      aria-label={zh ? "播放进度" : "Playback progress"}
      ref={meter}
      onChange={(event) => seekFraction(Number(event.currentTarget.value) / 1000)}
    />
  </div>;
}
