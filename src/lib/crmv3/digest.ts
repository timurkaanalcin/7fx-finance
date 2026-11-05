/** Overnight digest of local pins, and the panel glass choice. Nothing is sent. */

export const HIDE_KEY = "crmv3-digest-hide";
export const GLASS_KEY = "crmv3-panel-glass";

export const GLASSES = ["soft", "solid"] as const;
export type GlassMode = (typeof GLASSES)[number];
export type DigestKind = "pin" | "snooze" | "mark";

export type DigestItem = {
  id: string;
  source: string;
  kind: DigestKind;
  label: string;
};

type Source = {
  key: string;
  source: string;
  kind: DigestKind;
  shape: "ids" | "map" | "rows" | "marks" | "folders";
};

/** Local keys that already store a pin, a snooze, or a mark. Preferences are not included. */
export const DIGEST_SOURCES: readonly Source[] = [
  { key: "crmv3-triage-pins", source: "triage", kind: "pin", shape: "ids" },
  { key: "crmv3-triage-snooze", source: "triage", kind: "snooze", shape: "map" },
  { key: "crmv3-lead-watch", source: "leads", kind: "pin", shape: "ids" },
  { key: "crmv3-case-pins", source: "cases", kind: "pin", shape: "ids" },
  { key: "crmv3-tag-board-pins", source: "tags", kind: "pin", shape: "ids" },
  { key: "crmv3-health-watch", source: "health", kind: "pin", shape: "ids" },
  { key: "crmv3-reject-pins", source: "rejects", kind: "pin", shape: "ids" },
  { key: "crmv3-heat-pins", source: "heatmap", kind: "pin", shape: "ids" },
  { key: "crmv3-doc-snooze", source: "documents", kind: "snooze", shape: "map" },
  { key: "crmv3-ib-marks", source: "introducer", kind: "mark", shape: "marks" },
  { key: "crmv3-risk-ack", source: "alerts", kind: "mark", shape: "marks" },
  { key: "crmv3-scratchboard", source: "scratch", kind: "pin", shape: "rows" },
  { key: "crmv3-cheat-sheet", source: "cheats", kind: "pin", shape: "rows" },
  { key: "crmv3-vault-hints", source: "vault", kind: "pin", shape: "rows" },
  { key: "crmv3-shift-handoff", source: "handoff", kind: "pin", shape: "rows" },
  { key: "crmv3-desk-pad", source: "pad", kind: "pin", shape: "rows" },
  { key: "crmv3-sop-lists", source: "checklists", kind: "pin", shape: "rows" },
  { key: "crmv3-jump-history", source: "routes", kind: "pin", shape: "rows" },
  { key: "crmv3-bookmark-folders", source: "folders", kind: "pin", shape: "folders" },
];

function clean(raw: string): string {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function rowLabel(row: Record<string, unknown>, fallback: string): string {
  for (const key of ["label", "body", "name", "title", "sectionId", "open", "reason", "note"]) {
    const text = clean(String(row[key] || ""));
    if (text) return text;
  }
  return clean(fallback);
}

function pushItem(out: DigestItem[], source: Source, rawId: string, label: string) {
  const id = `${source.source}:${source.kind}:${rawId}`;
  if (!rawId || out.some((item) => item.id === id)) return;
  out.push({ id, source: source.source, kind: source.kind, label: label || rawId });
}

function takeRows(source: Source, raw: unknown, out: DigestItem[]) {
  if (!Array.isArray(raw)) return;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (row.pinned !== true || row.hidden === true || row.archived === true) continue;
    const rawId = clean(String(row.id || row.sectionId || ""));
    pushItem(out, source, rawId, rowLabel(row, rawId));
  }
}

export function readDigest(bag: Record<string, unknown>): DigestItem[] {
  const out: DigestItem[] = [];
  for (const source of DIGEST_SOURCES) {
    const raw = bag[source.key];
    if (source.shape === "ids" && Array.isArray(raw)) {
      for (const item of raw) {
        const rawId = clean(String(item || ""));
        pushItem(out, source, rawId, rawId);
      }
    } else if (source.shape === "map" && raw && typeof raw === "object" && !Array.isArray(raw)) {
      for (const key of Object.keys(raw as Record<string, unknown>)) {
        const rawId = clean(key);
        pushItem(out, source, rawId, rawId);
      }
    } else if (source.shape === "marks" && Array.isArray(raw)) {
      for (const item of raw) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        const rawId = clean(String(row.id || ""));
        pushItem(out, source, rawId, rowLabel(row, rawId));
      }
    } else if (source.shape === "rows") {
      takeRows(source, raw, out);
    } else if (source.shape === "folders" && raw && typeof raw === "object" && !Array.isArray(raw)) {
      takeRows(source, (raw as { folders?: unknown }).folders, out);
    }
  }
  return out.slice(0, 80);
}

export function readIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const id = clean(String(item || ""));
    if (id && !out.includes(id)) out.push(id);
  }
  return out.slice(0, 200);
}

export function hideItems(hidden: readonly string[], ids: readonly string[]): string[] {
  const next = hidden.slice();
  for (const id of ids) if (id && !next.includes(id)) next.push(id);
  return next.slice(0, 200);
}

export function visibleDigest(items: readonly DigestItem[], query: string, kind: string, hidden: readonly string[]): DigestItem[] {
  const text = query.trim().toLowerCase();
  const want = kind.trim();
  return items.filter((item) => {
    if (hidden.includes(item.id)) return false;
    if (want && item.kind !== want) return false;
    if (!text) return true;
    return `${item.source} ${item.kind} ${item.label}`.toLowerCase().includes(text);
  });
}

function csvCell(value: string): string {
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

/** A file the button builds in this browser. It is not uploaded. */
export function digestCsv(items: readonly DigestItem[]): string {
  const lines = [["source", "kind", "label"]];
  for (const item of items) lines.push([item.source, item.kind, item.label]);
  return lines.map((row) => row.map(csvCell).join(",")).join("\n");
}

export function readGlass(raw: unknown): GlassMode {
  return raw === "solid" ? "solid" : "soft";
}
