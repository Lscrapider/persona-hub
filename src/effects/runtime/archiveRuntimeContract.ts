import type { ArchiveSectionId } from "@/lib/content/types";

export const RUNTIME_SECTION_IDS = [
  "index",
  "timeline",
  "projects",
  "logs",
] as const satisfies readonly ("index" | ArchiveSectionId)[];

export const RUNTIME_ACTIONS = [
  "resolve",
  "mount",
  "inspect",
  "open",
  "toggle",
  "select",
  "pin",
  "read",
  "impulse",
  "charge",
  "grab",
  "release",
] as const;

export const RUNTIME_SOURCES = [
  "scroll",
  "pointer",
  "focus",
  "activate",
] as const;

export type RuntimeSectionId = (typeof RUNTIME_SECTION_IDS)[number];
export type CompilerPhase = "queued" | "resolving" | "mounted" | "stable";
export type RuntimeAction = (typeof RUNTIME_ACTIONS)[number];
export type RuntimeSource = (typeof RUNTIME_SOURCES)[number];

export type RuntimeSignal = Readonly<{
  action: RuntimeAction;
  source: RuntimeSource;
  target: string;
}>;

export const RUNTIME_SIGNAL_EVENT = "scra:runtime-signal";
export const TRACE_DEDUPE_MS = 250;
export const TRACE_VISIBLE_MS = 1_200;

export function formatRuntimeTrace(signal: RuntimeSignal) {
  return `${signal.action} ${signal.target}`;
}

export function isRuntimeAction(value: unknown): value is RuntimeAction {
  return RUNTIME_ACTIONS.some((action) => action === value);
}

export function isRuntimeSectionId(value: unknown): value is RuntimeSectionId {
  return RUNTIME_SECTION_IDS.some((section) => section === value);
}

export function isRuntimeSource(value: unknown): value is RuntimeSource {
  return RUNTIME_SOURCES.some((source) => source === value);
}

export function isRuntimeSignal(value: unknown): value is RuntimeSignal {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RuntimeSignal>;

  return (
    isRuntimeAction(candidate.action) &&
    isRuntimeSource(candidate.source) &&
    typeof candidate.target === "string" &&
    candidate.target.trim().length > 0
  );
}
