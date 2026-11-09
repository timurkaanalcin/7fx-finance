/** Local bell slips, and customer counts grouped by the trading group already on each row. */

export const BELL_KEY = "crmv4-bell-slips";
export const GROUP_KEY = "crmv4-trgroup-hide";

export type BellSlip = {
  id: string;
  text: string;
  floor: string;
  pinned: boolean;
  rung: boolean;
  held: boolean;
};

export type BellTray = "waiting" | "rung" | "held";

export type GroupValue =
  | {
      tradingGroup?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      role?: unknown;
      timezone?: unknown;
      language?: unknown;
      validation?: unknown;
      validationStatus?: unknown;
      desk?: unknown;
    }
  | string
  | null
  | undefined;

export type GroupRow = { tradingGroup?: GroupValue; label?: string | null };

export type GroupLine = { tradingGroup: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank slip is left out. The saved text stays short. */
export function bellText(raw: unknown): string {
  return clip(raw, 100);
}

/** A blank floor stays blank. It is not filled in. */
export function floorLabel(raw: unknown): string {
  return clip(raw, 12);
}

export function readBells(raw: unknown): BellSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: BellSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<BellSlip>;
    const id = String(row.id || "").trim();
    const text = bellText(row.text);
    if (!id || !text || out.some((slip) => slip.id === id)) continue;
    out.push({
      id,
      text,
      floor: floorLabel(row.floor),
      pinned: row.pinned === true,
      rung: row.rung === true,
      held: row.held === true,
    });
  }
  return out.slice(0, 36);
}

export function addBell(slips: readonly BellSlip[], slip: { id: string; text: string; floor?: string }): BellSlip[] {
  const current = readBells(slips);
  const id = String(slip.id || "").trim();
  const text = bellText(slip.text);
  const floor = floorLabel(slip.floor);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{ id, text, floor, pinned: false, rung: false, held: false }, ...current].slice(0, 36);
}

export function toggleBellPin(slips: readonly BellSlip[], id: string): BellSlip[] {
  return readBells(slips).map((slip) => (slip.id === id ? { ...slip, pinned: !slip.pinned } : slip));
}

export function setBellRung(slips: readonly BellSlip[], id: string, rung: boolean): BellSlip[] {
  return readBells(slips).map((slip) => (slip.id === id ? { ...slip, rung } : slip));
}

export function setBellHeld(slips: readonly BellSlip[], id: string, held: boolean): BellSlip[] {
  return readBells(slips).map((slip) => (slip.id === id ? { ...slip, held } : slip));
}

export function resetBells(): BellSlip[] {
  return [];
}

/** Copy uses the slip text. A blank slip copies nothing. */
export function bellCopy(raw: unknown): string {
  return bellText(raw);
}

function csvCell(value: string): string {
  if (/[",]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The floor stays a column, not a search field. */
export function bellsCsv(raw: unknown): string {
  const lines = ["text,floor,pinned,rung,held"];
  for (const slip of readBells(raw)) {
    lines.push([
      csvCell(slip.text),
      csvCell(slip.floor),
      slip.pinned ? "1" : "0",
      slip.rung ? "1" : "0",
      slip.held ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}

/** Search stays on the slip text. The floor is not part of the query. */
export function visibleBells(slips: readonly BellSlip[], tray: BellTray, query: string): BellSlip[] {
  const text = query.trim().toLowerCase();
  return readBells(slips)
    .filter((slip) => {
      const inTray = tray === "held" ? slip.held : tray === "rung" ? slip.rung && !slip.held : !slip.rung && !slip.held;
      return inTray && (!text || slip.text.toLowerCase().includes(text));
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/**
 * The trading group already on the trader row.
 * A sale status, a retention status, a potential status, a KYC status, an account type,
 * a role, a timezone, a language, a validation status, or a desk name is not a trading group.
 */
export function groupText(value: GroupValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if (
    "saleStatus" in value
    || "retentionStatus" in value
    || "potentialStatus" in value
    || "documentsStatus" in value
    || "accountType" in value
    || "role" in value
    || "timezone" in value
    || "language" in value
    || "validation" in value
    || "validationStatus" in value
    || "desk" in value
  ) return "";
  return typeof value.tradingGroup === "string" ? value.tradingGroup.replace(/\s+/g, " ").trim() : "";
}

export function groupLines(rows: readonly GroupRow[]): GroupLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const tradingGroup = groupText(row.tradingGroup);
    map.set(tradingGroup, (map.get(tradingGroup) || 0) + 1);
  }
  const out: GroupLine[] = [];
  map.forEach((count, tradingGroup) => out.push({ tradingGroup, count }));
  return out.sort((a, b) => {
    if (!a.tradingGroup) return -1;
    if (!b.tradingGroup) return 1;
    return a.tradingGroup.localeCompare(b.tradingGroup);
  });
}

export function namedGroups(rows: readonly GroupRow[]): string[] {
  return groupLines(rows).map((line) => line.tradingGroup).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function groupShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named group with the most loaded rows. A tie keeps the earlier name. */
export function leadingGroup(rows: readonly GroupRow[]): string {
  const named = groupLines(rows).filter((line) => line.tradingGroup);
  if (!named.length) return "";
  return named
    .slice()
    .sort((a, b) => b.count - a.count || a.tradingGroup.localeCompare(b.tradingGroup))[0].tradingGroup;
}

export function readHiddenGroups(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => groupText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const tradingGroup = groupText(String(item || ""));
    if (!tradingGroup || !allow.has(tradingGroup) || out.includes(tradingGroup)) continue;
    out.push(tradingGroup);
  }
  return out;
}

export function toggleGroup(hidden: readonly string[], tradingGroup: string, present: readonly string[]): string[] {
  const current = readHiddenGroups(hidden, present);
  const next = groupText(tradingGroup);
  if (!next || !present.map((item) => groupText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleGroups(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenGroups(hidden, present));
  return namedGroups(present.map((tradingGroup) => ({ tradingGroup }))).filter((tradingGroup) => (showHidden ? gone.has(tradingGroup) : !gone.has(tradingGroup)));
}

export function activeTradingGroup(selected: string, visible: readonly string[]): string {
  const tradingGroup = groupText(selected);
  if (!tradingGroup) return "";
  return visible.some((item) => groupText(item) === tradingGroup) ? tradingGroup : "";
}

export function visibleGroupCustomers<T extends GroupRow>(rows: readonly T[], tradingGroup: string, blank: boolean, query: string): T[] {
  const want = groupText(tradingGroup);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = groupText(row.tradingGroup);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
