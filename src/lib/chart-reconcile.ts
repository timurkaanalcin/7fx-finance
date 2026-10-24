export type OhlcBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ChartReconcilePlan =
  | { kind: "replace" }
  | { kind: "patch"; updates: OhlcBar[] };

function sameOhlc(a: OhlcBar, b: OhlcBar): boolean {
  return a.open === b.open && a.high === b.high && a.low === b.low && a.close === b.close;
}

/**
 * How to apply a fresh Yahoo history onto the bars already on the chart.
 * `patch` only updates the last bar and appends newer ones, which lightweight-charts
 * can do with series.update. Anything that rewrites older bars is a full replace.
 */
export function chartReconcilePlan(existing: readonly OhlcBar[], incoming: readonly OhlcBar[]): ChartReconcilePlan {
  if (existing.length === 0 || incoming.length === 0) return { kind: "replace" };

  let incomingIndex = 0;
  while (incomingIndex < incoming.length && incoming[incomingIndex].time < existing[0].time) {
    incomingIndex += 1;
  }
  if (incomingIndex >= incoming.length || incoming[incomingIndex].time !== existing[0].time) {
    return { kind: "replace" };
  }

  let divergeAt = -1;
  for (let existingIndex = 0; existingIndex < existing.length; existingIndex += 1, incomingIndex += 1) {
    if (incomingIndex >= incoming.length) return { kind: "replace" };
    const current = existing[existingIndex];
    const next = incoming[incomingIndex];
    if (current.time !== next.time) return { kind: "replace" };
    if (!sameOhlc(current, next) && divergeAt < 0) divergeAt = existingIndex;
  }

  if (divergeAt >= 0 && divergeAt < existing.length - 1) return { kind: "replace" };

  const updates: OhlcBar[] = [];
  if (divergeAt === existing.length - 1) updates.push(incoming[incomingIndex - 1]);

  let previousTime = existing[existing.length - 1].time;
  for (; incomingIndex < incoming.length; incomingIndex += 1) {
    const bar = incoming[incomingIndex];
    if (bar.time <= previousTime) return { kind: "replace" };
    updates.push(bar);
    previousTime = bar.time;
  }
  return { kind: "patch", updates };
}
