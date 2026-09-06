/** Shared, interruptible observe / approach / grip / pull / release choreography. */
export function timelineActivity(phase: number) {
  const p = ((phase % 1) + 1) % 1;
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    // Zero velocity and acceleration at both ends avoids a mechanical hinge stop.
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const hold = (start: number, arrive: number, leave: number, end: number) =>
    smooth((p - start) / (arrive - start)) * (1 - smooth((p - leave) / (end - leave)));
  return {
    inspect: hold(.025, .09, .14, .22),
    orient: hold(.08, .21, .90, .99),
    reach: hold(.19, .34, .86, .97),
    grip: hold(.31, .35, .81, .85),
    gape: hold(.19, .25, .29, .34) + hold(.82, .85, .88, .92),
    // Pull, pause with the leaf raised, then let it settle more slowly.
    tension: hold(.35, .46, .64, .84),
    turn: hold(.37, .56, .62, .81),
    press: hold(.38, .47, .53, .66),
    release: hold(.81, .86, .91, .98),
  };
}
