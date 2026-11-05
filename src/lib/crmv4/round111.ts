/** Local reminder chips, and customer counts grouped by a risk or tier already on the row. */

export const CHIP_KEY = "crmv4-reminder-polish";
export const RISK_HIDE_KEY = "crmv4-risk-glance-hide";

export type Chip = {
  id: string;
  text: string;
  due: string;
  pinned: boolean;
  hidden: boolean;
  done: boolean;
};

export type ChipView = "open" | "hidden" | "done";

export type RiskValue = { risk?: unknown; riskTier?: unknown; tier?: unknown; accountType?: unknown } | string | null | undefined;

export type RiskRow = { risk?: RiskValue; label?: string | null };

export type RiskLine = { risk: string; count: number };

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** A blank reminder is left out. The saved text stays short. */
export function chipText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank due label stays blank. It is not filled in. */
export function dueLabel(raw: unknown): string {
  return clip(raw, 40);
}

export function readChips(raw: unknown): Chip[] {
  if (!Array.isArray(raw)) return [];
  const out: Chip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Chip>;
    const id = String(row.id || "").trim();
    const text = chipText(row.text);
    if (!id || !text || out.some((chip) => chip.id === id)) continue;
    out.push({
      id,
      text,
      due: dueLabel(row.due),
      pinned: row.pinned === true,
      hidden: row.hidden === true,
      done: row.done === true,
    });
  }
  return out.slice(0, 40);
}

export function addChip(chips: readonly Chip[], chip: { id: string; text: string; due?: string }): Chip[] {
  const current = readChips(chips);
  const id = String(chip.id || "").trim();
  const text = chipText(chip.text);
  const due = dueLabel(chip.due);
  if (!id || !text || current.some((item) => item.id === id || (item.text === text && item.due === due))) return current;
  return [{ id, text, due, pinned: false, hidden: false, done: false }, ...current].slice(0, 40);
}

export function toggleChipPin(chips: readonly Chip[], id: string): Chip[] {
  return readChips(chips).map((chip) => (chip.id === id ? { ...chip, pinned: !chip.pinned } : chip));
}

export function setChipHidden(chips: readonly Chip[], id: string, hidden: boolean): Chip[] {
  return readChips(chips).map((chip) => (chip.id === id ? { ...chip, hidden } : chip));
}

export function toggleChipDone(chips: readonly Chip[], id: string): Chip[] {
  return readChips(chips).map((chip) => (chip.id === id ? { ...chip, done: !chip.done } : chip));
}

export function resetChips(): Chip[] {
  return [];
}

export function visibleChips(chips: readonly Chip[], view: ChipView, query: string): Chip[] {
  const text = query.trim().toLowerCase();
  return readChips(chips)
    .filter((chip) => {
      if (view === "hidden") {
        if (!chip.hidden) return false;
      } else if (view === "done") {
        if (!chip.done || chip.hidden) return false;
      } else if (chip.hidden || chip.done) return false;
      if (!text) return true;
      return `${chip.text} ${chip.due}`.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

function plain(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** Risk, then tier, then the account type already on the row. Anything else is left blank. */
export function riskText(value: RiskValue): string {
  if (typeof value === "string") return plain(value);
  if (!value || typeof value !== "object") return "";
  return plain(value.risk) || plain(value.riskTier) || plain(value.tier) || plain(value.accountType);
}

export function riskLines(rows: readonly RiskRow[]): RiskLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const risk = riskText(row.risk);
    map.set(risk, (map.get(risk) || 0) + 1);
  }
  const out: RiskLine[] = [];
  map.forEach((count, risk) => out.push({ risk, count }));
  return out.sort((a, b) => {
    if (!a.risk) return -1;
    if (!b.risk) return 1;
    return a.risk.localeCompare(b.risk);
  });
}

export function namedRisks(rows: readonly RiskRow[]): string[] {
  return riskLines(rows).map((line) => line.risk).filter(Boolean);
}

export function readHiddenRisks(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => riskText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const risk = riskText(String(item || ""));
    if (!risk || !allow.has(risk) || out.includes(risk)) continue;
    out.push(risk);
  }
  return out;
}

export function toggleRisk(hidden: readonly string[], risk: string, present: readonly string[]): string[] {
  const current = readHiddenRisks(hidden, present);
  const next = riskText(risk);
  if (!next || !present.map((item) => riskText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleRisks(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenRisks(hidden, present));
  return namedRisks(present.map((risk) => ({ risk }))).filter((risk) => (showHidden ? gone.has(risk) : !gone.has(risk)));
}

export function activeRisk(selected: string, visible: readonly string[]): string {
  const risk = riskText(selected);
  if (!risk) return "";
  return visible.some((item) => riskText(item) === risk) ? risk : "";
}

export function visibleCustomers<T extends RiskRow>(rows: readonly T[], risk: string, blank: boolean, query: string): T[] {
  const want = riskText(risk);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = riskText(row.risk);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}
