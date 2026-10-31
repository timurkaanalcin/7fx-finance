/** Loaded customer dossier. Dates and totals stay on the loaded rows. */

export type ActNote = { createdAt?: string | null; body?: string | null };
export type ActEvent = { createdAt?: string | null; kind?: string | null; path?: string | null };

export type LatestAct = { at: string; kind: "note" | "event"; text: string };

export function latestActivity(notes: ActNote[], events: ActEvent[]): LatestAct | null {
  let best: LatestAct | null = null;
  for (const row of notes) {
    const at = String(row.createdAt || "");
    if (!at) continue;
    const text = String(row.body || "").trim();
    if (!best || at > best.at) best = { at, kind: "note", text };
  }
  for (const row of events) {
    const at = String(row.createdAt || "");
    if (!at) continue;
    const text = [row.kind, row.path].filter(Boolean).join(" · ");
    if (!best || at > best.at) best = { at, kind: "event", text };
  }
  return best;
}

export function followMark(value: unknown, today: string): "none" | "overdue" | "today" | "later" {
  const at = Date.parse(String(value || ""));
  if (!Number.isFinite(at)) return "none";
  const day = new Date(at).toISOString().slice(0, 10);
  if (day < today) return "overdue";
  if (day === today) return "today";
  return "later";
}

export function clipText(value: string, max = 80): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
