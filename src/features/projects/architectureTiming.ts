export const ARCHITECTURE_STEP_MS = 3600;

const TRAVEL_END = 0.60;
const ARRIVAL_END = 0.68;
const PROCESS_END = 0.95;
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** One clock governs the signal, its arrival, and the receiving module's work. */
export function architectureStepTiming(progress: number, internal = false) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const phase = !internal && p < TRAVEL_END ? "transit"
    : !internal && p < ARRIVAL_END ? "arrival"
      : p < PROCESS_END ? "process" : "release";
  const start = internal ? 0 : ARRIVAL_END;
  return {
    phase,
    travel: Math.min(p / TRAVEL_END, 1),
    arrival: Math.max(0, Math.min(1, (p - TRAVEL_END) / (ARRIVAL_END - TRAVEL_END))),
    strength: phase === "process" ? smooth((p - start) / 0.035) * (1 - smooth((p - 0.91) / 0.04)) : 0,
    signalVisible: !internal && p < ARRIVAL_END,
  };
}
