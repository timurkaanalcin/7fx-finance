/** Shared table and filter helpers for /crmx. No Set/Map spread — Array.from only. */

export function queryString(params: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (!text) continue;
    sp.set(key, text);
  }
  const built = sp.toString();
  return built ? `?${built}` : "";
}

export function textHaystack(values: Array<string | number | null | undefined>): string {
  const parts: string[] = [];
  for (const value of values) {
    if (value == null || value === "") continue;
    parts.push(String(value));
  }
  return parts.join(" ").toLocaleLowerCase("en");
}

/** Case-insensitive match across the fields a row exposes. Blank query keeps every row. */
export function filterRows<T>(
  rows: readonly T[],
  query: string,
  pick: (row: T) => Array<string | number | null | undefined>
): T[] {
  const q = query.trim().toLocaleLowerCase("en");
  if (!q) return rows.slice();
  const out: T[] = [];
  for (const row of rows) {
    if (textHaystack(pick(row)).includes(q)) out.push(row);
  }
  return out;
}

/** How many drawer filters are set. Ignored keys (usually the free-text query) do not count. */
export function activeFilterCount(filters: Record<string, string>, ignore: readonly string[] = []): number {
  const skip = new Set(ignore);
  let count = 0;
  for (const key of Object.keys(filters)) {
    if (skip.has(key)) continue;
    if (filters[key].trim()) count += 1;
  }
  return count;
}

/** Deduped, trimmed, sorted labels. Uses Array.from on the Set. */
export function uniqueSorted(values: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const text = value.trim();
    if (text) seen.add(text);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, "en"));
}

/**
 * Sum values into evenly spaced time buckets.
 * Empty input returns zeros so a sparkline can still draw a flat line.
 */
export function bucketSeries(points: readonly { t: number; v: number }[], buckets: number): number[] {
  const n = Math.max(1, Math.trunc(buckets));
  const sums = Array.from({ length: n }, () => 0);
  if (!points.length) return sums;
  let min = points[0].t;
  let max = points[0].t;
  for (const point of points) {
    if (point.t < min) min = point.t;
    if (point.t > max) max = point.t;
  }
  const span = max - min || 1;
  for (const point of points) {
    let index = Math.floor(((point.t - min) / span) * n);
    if (index >= n) index = n - 1;
    if (index < 0) index = 0;
    const value = Number(point.v);
    sums[index] += Number.isFinite(value) ? value : 0;
  }
  return sums;
}
