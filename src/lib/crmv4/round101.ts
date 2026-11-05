/** Local short desk drafts, and document counts grouped by the type already on each row. */

export const DRAFT_KEY = "crmv4-draft-stash";
export const MIX_KEY = "crmv4-doc-mix-hide";

export type Draft = {
  id: string;
  text: string;
  pinned: boolean;
  hidden: boolean;
  at: string;
};

export type MixRow = { docType?: unknown; label?: string | null };

export type MixLine = { type: string; count: number };

/** A line break becomes a space. A blank draft is left out. */
export function draftText(raw: string | null | undefined): string {
  return String(raw || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function readDrafts(raw: unknown): Draft[] {
  if (!Array.isArray(raw)) return [];
  const out: Draft[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Draft>;
    const id = String(row.id || "").trim();
    const text = draftText(row.text);
    if (!id || !text || out.some((draft) => draft.id === id || draft.text === text)) continue;
    out.push({ id, text, pinned: row.pinned === true, hidden: row.hidden === true, at: String(row.at || "") });
  }
  return out.slice(0, 40);
}

export function addDraft(drafts: readonly Draft[], draft: { id: string; text: string; at: string }): Draft[] {
  const id = String(draft.id || "").trim();
  const text = draftText(draft.text);
  if (!id || !text || drafts.some((item) => item.id === id || item.text === text)) return drafts.slice();
  return [{ id, text, pinned: false, hidden: false, at: draft.at }, ...drafts].slice(0, 40);
}

export function toggleDraftPin(drafts: readonly Draft[], id: string): Draft[] {
  return drafts.map((draft) => (draft.id === id ? { ...draft, pinned: !draft.pinned } : draft));
}

export function setDraftHidden(drafts: readonly Draft[], id: string, hidden: boolean): Draft[] {
  return drafts.map((draft) => (draft.id === id ? { ...draft, hidden } : draft));
}

export function visibleDrafts(drafts: readonly Draft[], query: string, hidden: boolean): Draft[] {
  const text = query.trim().toLowerCase();
  return drafts
    .filter((draft) => draft.hidden === hidden && (!text || draft.text.toLowerCase().includes(text)))
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.at.localeCompare(a.at);
    });
}

/** The docType already on the row. Kind and a missing type stay blank. */
export function mixType(value: unknown): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (value && typeof value === "object" && "docType" in value) return mixType((value as { docType?: unknown }).docType);
  return "";
}

export function mixLines(rows: readonly MixRow[]): MixLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const type = mixType(row.docType);
    map.set(type, (map.get(type) || 0) + 1);
  }
  const out: MixLine[] = [];
  map.forEach((count, type) => out.push({ type, count }));
  return out.sort((a, b) => {
    if (!a.type) return -1;
    if (!b.type) return 1;
    return a.type.localeCompare(b.type);
  });
}

export function namedMix(rows: readonly MixRow[]): string[] {
  return mixLines(rows).map((line) => line.type).filter(Boolean);
}

export function readHiddenMix(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => mixType(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const type = mixType(String(item || ""));
    if (!type || !allow.has(type) || out.includes(type)) continue;
    out.push(type);
  }
  return out;
}

export function toggleMix(hidden: readonly string[], type: string, present: readonly string[]): string[] {
  const current = readHiddenMix(hidden, present);
  const next = mixType(type);
  if (!next || !present.map((item) => mixType(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleMix(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenMix(hidden, present));
  return namedMix(present.map((docType) => ({ docType }))).filter((type) => (showHidden ? gone.has(type) : !gone.has(type)));
}

export function activeMix(selected: string, visible: readonly string[]): string {
  const type = mixType(selected);
  if (!type) return "";
  return visible.some((item) => mixType(item) === type) ? type : "";
}

export function visibleDocs<T extends MixRow>(rows: readonly T[], type: string, blank: boolean, query: string): T[] {
  const want = mixType(type);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = mixType(row.docType);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
