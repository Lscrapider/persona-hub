"use client";

import { useEffect, useRef, useState } from "react";

import { useEffectMode } from "@/effects/runtime/EffectMode";
import type { ArchiveLocale } from "@/lib/content/types";

import type { ArchitectureRenderer } from "./architectureRenderer";
import { ArchitectureFlowPlayer } from "./ArchitectureFlowPlayer";
import type { ArchitectureFlowStep, ArchitectureNode, ProjectArchitecture } from "./projectArchitecture";

type Props = Readonly<{
  architecture: ProjectArchitecture;
  locale: ArchiveLocale;
  onOpenNode: (node: ArchitectureNode) => void;
  paused: boolean;
}>;

export function ProjectArchitectureStage({ architecture, locale, onOpenNode, paused }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef(new Map<string, HTMLButtonElement>());
  const renderer = useRef<ArchitectureRenderer | null>(null);
  const onOpen = useRef(onOpenNode);
  const { mode } = useEffectMode();
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [flowId, setFlowId] = useState<string | null>(null);
  const [narrationHost, setNarrationHost] = useState<HTMLDivElement | null>(null);
  const [playbackStep, setPlaybackStep] = useState<ArchitectureFlowStep | null>(null);
  const [flowPlaying, setFlowPlaying] = useState(true);
  const [retry, setRetry] = useState(0);
  const [failed, setFailed] = useState(false);
  const motion = useRef(false);
  const flowRef = useRef<readonly string[] | null>(null);
  const zh = locale === "zh";
  const packageView = architecture.kind === "package";
  const activeFlow = architecture.flows.find((flow) => flow.id === flowId);
  const playbackRef = useRef<ArchitectureFlowStep | null>(null);

  useEffect(() => { onOpen.current = onOpenNode; }, [onOpenNode]);
  useEffect(() => {
    motion.current = mode === "full" && !paused && (!activeFlow?.steps?.length || flowPlaying);
    renderer.current?.setMotion(motion.current);
  }, [mode, paused, activeFlow, flowPlaying]);
  useEffect(() => { playbackRef.current = playbackStep; }, [playbackStep]);

  useEffect(() => {
    const element = host.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    element.dataset.renderer = "pending";
    element.setAttribute("aria-busy", "true");
    let cancelled = false;
    let started = false;
    const start = async () => {
      if (started) return;
      started = true;
      try {
        const { createArchitectureRenderer } = await import("./architectureRenderer");
        if (cancelled) return;
        renderer.current = createArchitectureRenderer(element, surface, labels.current, architecture, {
          onSelect(id) {
            const node = architecture.nodes.find((entry) => entry.id === id);
            setHighlighted(id);
            renderer.current?.setHighlight(id);
            labels.current.get(id)?.focus({ preventScroll: true });
            if (node?.documents.length) onOpen.current(node);
          },
          onHover(id) { setHighlighted(id); renderer.current?.setHighlight(id); },
          onAvailability(available) {
            element.setAttribute("aria-busy", "false");
            setFailed(!available);
          },
        });
        renderer.current.setMotion(motion.current);
        renderer.current.setFlow(flowRef.current);
        if (playbackRef.current) renderer.current.setPlayback({ ...playbackRef.current, progress: 0 });
        element.setAttribute("aria-busy", "false");
        setFailed(false);
      } catch {
        if (cancelled) return;
        element.dataset.renderer = "fallback";
        element.setAttribute("aria-busy", "false");
        setFailed(true);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { void start(); observer.disconnect(); }
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => {
      cancelled = true;
      observer.disconnect();
      renderer.current?.dispose();
      renderer.current = null;
    };
  }, [architecture, retry]);

  const highlight = (id: string | null) => {
    setHighlighted(id);
    renderer.current?.setHighlight(id);
  };
  const selectNode = (node: ArchitectureNode) => {
    highlight(node.id);
    if (node.documents.length) onOpenNode(node);
  };
  const selectFlow = (id: string | null) => {
    if (id === flowId) return;
    setFlowId(id);
    setPlaybackStep(null);
    setFlowPlaying(true);
    renderer.current?.setPlayback(null);
    highlight(null);
    const selected = architecture.flows.find((flow) => flow.id === id);
    flowRef.current = selected?.steps?.length ? null : selected?.nodes ?? null;
    renderer.current?.setFlow(flowRef.current);
  };
  const activeNode = architecture.nodes.find((node) => node.id === highlighted);

  return (
    <div className="architecture architecture--spatial" data-playback={!!activeFlow?.steps?.length || undefined}>
      <div className="architecture__toolbar">
        <span className="architecture__label">{packageView ? zh ? "规范包结构" : "GUIDANCE PACKAGE" : zh ? "系统架构" : "SYSTEM ARCHITECTURE"}</span>
        <span className="architecture__count">{zh ? "三维视图" : "3D VIEW"}</span>
        <div className="architecture__view-controls" aria-label={zh ? "视角控制" : "View controls"}>
          <button aria-label={zh ? "向左旋转" : "Rotate left"} onClick={() => renderer.current?.rotate(-1)} type="button">↶</button>
          <button aria-label={zh ? "向右旋转" : "Rotate right"} onClick={() => renderer.current?.rotate(1)} type="button">↷</button>
          <button aria-label={zh ? "缩小" : "Zoom out"} onClick={() => renderer.current?.zoom(-1)} type="button">−</button>
          <button aria-label={zh ? "放大" : "Zoom in"} onClick={() => renderer.current?.zoom(1)} type="button">+</button>
          <button onClick={() => renderer.current?.reset()} type="button">{zh ? "复位" : "Reset"}</button>
        </div>
      </div>
      <div className="architecture__flows" aria-label={zh ? "架构与业务路径" : "Architecture and business flows"}>
        <button aria-pressed={!activeFlow} onClick={() => selectFlow(null)} type="button">{packageView ? zh ? "完整结构" : "Package structure" : zh ? "完整架构" : "Full architecture"}</button>
        {architecture.flows.map((flow) => <button aria-pressed={activeFlow?.id === flow.id} key={flow.id} onClick={() => selectFlow(flow.id)} type="button">{flow.label}</button>)}
        <span>{zh ? "拖动旋转 · 点击模型探索" : "Drag to orbit · Select a model"}</span>
      </div>
      <div
        aria-busy="true"
        aria-label={packageView ? zh ? "三维规范包结构，线路表示组织与引用关系" : "3D guidance package. Lines show organization and references." : zh ? "三维系统架构，服务模型之间的线路表示通信和依赖" : "3D system architecture. Connections represent communication and dependencies."}
        className="architecture__stage"
        data-renderer="pending"
        ref={host}
        role="group"
      >
        <span className="architecture__loading" role="status">{zh ? "正在准备三维架构…" : "Preparing the 3D architecture…"}</span>
        <canvas aria-hidden="true" className="architecture__canvas" ref={canvas} />
        <div aria-hidden="true" className="architecture__boundaries">
          {architecture.groups.map((boundary) => <div className="architecture__boundary" data-boundary-id={boundary.id} key={boundary.id}><strong>{boundary.label}</strong></div>)}
        </div>
        <div aria-hidden="true" className="architecture__edge-labels">
          {architecture.edges.map((edge, index) => <span
            className="architecture__edge-label" data-edge-index={index} key={`${edge.from}-${edge.to}-${index}`}
            data-transfer={zh ? "数据传输" : "DATA TRANSFER"}
            data-compute={zh ? "处理请求" : "PROCESSING REQUEST"}
            data-generate={zh ? "生成请求" : "GENERATION REQUEST"}
            data-read={zh ? "读取请求" : "READ REQUEST"}
            data-write={zh ? "写入请求" : "WRITE REQUEST"}
            data-scan={zh ? "识别请求" : "RECOGNITION REQUEST"}
          >{edge.label}</span>)}
        </div>
        <div className="architecture__nodes">
          {architecture.nodes.map((node) => (
            <button
              aria-haspopup={node.documents.length ? "dialog" : undefined}
              aria-label={`${node.label} — ${node.description}${node.documents.length ? zh ? " 阅读相关文档" : " Read related documentation" : ""}`}
              className="architecture__node"
              data-node-id={node.id}
              data-emphasis={node.emphasis}
              data-highlighted={node.id === highlighted || (!activeFlow?.steps?.length && activeFlow?.nodes.includes(node.id)) || undefined}
              data-flow-active={playbackStep?.to === node.id || undefined}
              key={node.id}
              onBlur={() => highlight(null)}
              onFocus={() => highlight(node.id)}
              onPointerEnter={() => highlight(node.id)}
              onPointerLeave={(event) => { if (event.currentTarget !== document.activeElement) highlight(null); }}
              onClick={() => selectNode(node)}
              ref={(element) => { if (element) labels.current.set(node.id, element); else labels.current.delete(node.id); }}
              type="button"
            >
              <strong>{node.label}{node.documents.length ? <span aria-hidden="true"> ↗</span> : null}</strong>
              <span className="architecture__node-kind">{node.kind}</span>
              <span
                aria-hidden="true"
                className="architecture__activity-cue"
                data-activity-cue=""
                data-transfer={zh ? "接收中" : "RECEIVING"}
                data-compute={zh ? "计算中" : "COMPUTING"}
                data-scan={zh ? "扫描中" : "SCANNING"}
                data-read={zh ? "读取中" : "READING"}
                data-write={zh ? "写入中" : "WRITING"}
                data-generate={zh ? "生成中" : "GENERATING"}
                hidden
              />
            </button>
          ))}
        </div>
        <div className="architecture__narration" ref={setNarrationHost}>
          {activeFlow && !activeFlow.steps?.length ? <div className="architecture-player__story" aria-live="polite">
            <div className="architecture-player__eyebrow">{packageView ? zh ? "规范如何协作" : "HOW THE GUIDANCE WORKS" : zh ? "设计路径" : "DESIGN PATH"}</div>
            <h4>{activeFlow.label}</h4>
            <p>{activeFlow.description}</p>
          </div> : null}
        </div>
      </div>
      {activeFlow?.steps?.length ? <ArchitectureFlowPlayer
        key={activeFlow.id}
        flow={activeFlow}
        nodes={architecture.nodes}
        renderer={renderer}
        host={host}
        narrationHost={narrationHost}
        enabled={mode === "full" && !paused && !failed}
        staticMode={mode !== "full"}
        zh={zh}
        onStepChange={setPlaybackStep}
        onPlayingChange={setFlowPlaying}
      /> : null}
      <div className="architecture__footer">
        <div>
          <p>{activeNode ? activeNode.description : activeFlow ? activeFlow.description : packageView ? zh ? "从执行入口展开技术栈规范与审查规则。" : "Explore stack references and review rules from the Skill entry point." : zh ? "服务、存储与外部依赖，组成一个完整系统。" : "Services, storage and external dependencies form one system."}</p>
          {activeNode?.tags.length ? <span className="architecture__business-tags">{activeNode.tags.join(" / ")}</span> : null}
        </div>
        <span><span aria-hidden="true" className="architecture__legend-line" />{zh ? "实线：当前关系 · 虚线：设计演进" : "SOLID: CURRENT · DASHED: PLANNED"}</span>
      </div>
      {failed ? <p className="architecture__fallback" role="status">{zh ? "当前显示架构模块列表。" : "Showing the architecture module list."} <button type="button" onClick={() => {
        if (host.current) {
          host.current.dataset.renderer = "pending";
          host.current.setAttribute("aria-busy", "true");
        }
        setFailed(false);
        setRetry((value) => value + 1);
      }}>{zh ? "重试三维视图" : "Retry 3D view"}</button></p> : null}
      <details className="architecture__mobile-index">
        <summary>{zh ? "模块与相关文档" : "Modules and documentation"}</summary>
        {architecture.groups.map((boundary) => <div className="architecture__module-group" key={boundary.id}><h4>{boundary.label}</h4><div>{architecture.nodes.filter((node) => boundary.nodes.includes(node.id)).map((node) => <button key={node.id} type="button" onClick={() => selectNode(node)}><strong>{node.label}</strong><span>{node.documents.length ? `${node.documents.length} ${zh ? "篇相关文档" : "related documents"}` : node.kind}</span></button>)}</div></div>)}
        <div className="architecture__module-group"><h4>{zh ? "接入与外部依赖" : "Access and dependencies"}</h4><div>{architecture.nodes.filter((node) => !architecture.groups.some((boundary) => boundary.nodes.includes(node.id))).map((node) => <button key={node.id} type="button" onClick={() => selectNode(node)}><strong>{node.label}</strong><span>{node.kind}</span></button>)}</div></div>
      </details>
      <details className="architecture__connections">
        <summary>{packageView ? zh ? "查看组织与引用关系" : "View organization and references" : zh ? "查看通信与依赖关系" : "View communication and dependencies"}</summary>
        <ul>{architecture.edges.map((edge, index) => <li key={`${edge.from}-${edge.to}-${index}`}><strong>{architecture.nodes.find((node) => node.id === edge.from)?.label}</strong><span aria-hidden="true"> → </span><strong>{architecture.nodes.find((node) => node.id === edge.to)?.label}</strong><span> · {edge.label}</span>{edge.planned ? <span> ({zh ? "设计" : "planned"})</span> : null}</li>)}</ul>
      </details>
    </div>
  );
}
