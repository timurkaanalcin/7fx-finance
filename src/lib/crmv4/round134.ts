/** Local lamp cards, and customer counts grouped by the broker name already on each row. */

export const LAMP_KEY = "crmv4-lamp-cards";
export const LAMP_VIEW_KEY = "crmv4-lamp-views";
export const BROKER_KEY = "crmv4-broker-hide";

export type LampCard = {
  id: string;
  text: string;
  bay: string;
  tag: string;
  stamp: string;
  pinned: boolean;
  lit: boolean;
  held: boolean;
  reviewed: boolean;
  kept: boolean;
  audit: string;
};

export type LampTray = "dark" | "lit" | "held";

export type LampView = {
  id: string;
  name: string;
  tray: LampTray;
  query: string;
  bay: string;
  tag: string;
};

export type LampCounts = {
  dark: number;
  lit: number;
  held: number;
  reviewed: number;
  kept: number;
  pinnedDark: number;
};

export type BrokerValue =
  | {
      brokerName?: unknown;
      tradingServer?: unknown;
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

export type BrokerRow = { brokerName?: BrokerValue; label?: string | null };

export type BrokerLine = { brokerName: string; count: number };

const AUDITS = ["save", "edit", "pin", "unpin", "lit", "dark", "hold", "release", "review", "clear", "keep", "drop"] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): LampTray {
  return raw === "lit" || raw === "held" ? raw : "dark";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

/** A blank card is left out. The saved text stays short. */
export function lampText(raw: unknown): string {
  return clip(raw, 100);
}

/** A blank bay stays blank. It is not filled in. */
export function bayLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A blank tag stays blank. It is not filled in. */
export function tagLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank stamp stays blank. It is not filled in. */
export function stampLabel(raw: unknown): string {
  return clip(raw, 8);
}

export function readLamps(raw: unknown): LampCard[] {
  if (!Array.isArray(raw)) return [];
  const out: LampCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LampCard>;
    const id = String(row.id || "").trim();
    const text = lampText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      bay: bayLabel(row.bay),
      tag: tagLabel(row.tag),
      stamp: stampLabel(row.stamp),
      pinned: row.pinned === true,
      lit: row.lit === true,
      held: row.held === true,
      reviewed: row.reviewed === true,
      kept: row.kept === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addLamp(
  cards: readonly LampCard[],
  card: { id: string; text: string; bay?: string; tag?: string; stamp?: string },
): LampCard[] {
  const current = readLamps(cards);
  const id = String(card.id || "").trim();
  const text = lampText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  return [{
    id,
    text,
    bay: bayLabel(card.bay),
    tag: tagLabel(card.tag),
    stamp: stampLabel(card.stamp),
    pinned: false,
    lit: false,
    held: false,
    reviewed: false,
    kept: false,
    audit: "save",
  }, ...current].slice(0, 36);
}

export function toggleLampPin(cards: readonly LampCard[], id: string): LampCard[] {
  return readLamps(cards).map((card) => (card.id === id ? { ...card, pinned: !card.pinned, audit: card.pinned ? "unpin" : "pin" } : card));
}

export function setLampLit(cards: readonly LampCard[], id: string, lit: boolean): LampCard[] {
  return readLamps(cards).map((card) => (card.id === id ? { ...card, lit, audit: lit ? "lit" : "dark" } : card));
}

export function setLampHeld(cards: readonly LampCard[], id: string, held: boolean): LampCard[] {
  return readLamps(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setLampReviewed(cards: readonly LampCard[], id: string, reviewed: boolean): LampCard[] {
  return readLamps(cards).map((card) => (card.id === id ? { ...card, reviewed, audit: reviewed ? "review" : "clear" } : card));
}

export function setLampKept(cards: readonly LampCard[], id: string, kept: boolean): LampCard[] {
  return readLamps(cards).map((card) => (card.id === id ? { ...card, kept, audit: kept ? "keep" : "drop" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editLamp(cards: readonly LampCard[], id: string, text: string): LampCard[] {
  const current = readLamps(cards);
  const next = lampText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkLampLit(cards: readonly LampCard[], ids: readonly string[], lit: boolean): LampCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readLamps(cards).map((card) => (want.has(card.id) ? { ...card, lit, audit: lit ? "lit" : "dark" } : card));
}

export function bulkLampHeld(cards: readonly LampCard[], ids: readonly string[], held: boolean): LampCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readLamps(cards).map((card) => (want.has(card.id) ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function resetLamps(): LampCard[] {
  return [];
}

/** Copy uses the card text. A blank card copies nothing. */
export function lampCopy(raw: unknown): string {
  return lampText(raw);
}

function inTray(card: LampCard, tray: LampTray): boolean {
  if (tray === "held") return card.held;
  if (tray === "lit") return card.lit && !card.held;
  return !card.lit && !card.held;
}

/** Search stays on the card text. The bay and the tag are not part of the query. */
export function visibleLamps(
  cards: readonly LampCard[],
  tray: LampTray,
  query: string,
  bay: string | null,
  tag: string,
  pinnedOnly: boolean,
): LampCard[] {
  const text = query.trim().toLowerCase();
  const wantBay = bay === null ? null : bayLabel(bay);
  const wantTag = tagLabel(tag);
  return readLamps(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (pinnedOnly && !card.pinned) return false;
      if (wantBay !== null && bayLabel(card.bay) !== wantBay) return false;
      if (wantTag && tagLabel(card.tag) !== wantTag) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.text.localeCompare(b.text);
    });
}

/** The stamp orders the day. A blank stamp stays at the end. Search stays on the card text. */
export function lampTimeline(cards: readonly LampCard[], query: string): LampCard[] {
  const text = query.trim().toLowerCase();
  return readLamps(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (!a.stamp && b.stamp) return 1;
      if (a.stamp && !b.stamp) return -1;
      const stamp = a.stamp.localeCompare(b.stamp);
      if (stamp) return stamp;
      return a.text.localeCompare(b.text);
    });
}

export function lampCounts(cards: readonly LampCard[]): LampCounts {
  const rows = readLamps(cards);
  return {
    dark: rows.filter((card) => inTray(card, "dark")).length,
    lit: rows.filter((card) => inTray(card, "lit")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    reviewed: rows.filter((card) => card.reviewed).length,
    kept: rows.filter((card) => card.kept).length,
    pinnedDark: rows.filter((card) => card.pinned && inTray(card, "dark")).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function lampShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function lampBays(cards: readonly LampCard[]): string[] {
  const out: string[] = [];
  for (const card of readLamps(cards)) {
    if (card.bay && !out.includes(card.bay)) out.push(card.bay);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function lampTags(cards: readonly LampCard[]): string[] {
  const out: string[] = [];
  for (const card of readLamps(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** "all" and "blank" stay. A bay that is no longer on a card falls back to all. */
export function activeBay(filter: string, bays: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const bay = bayLabel(filter);
  return bay && bays.includes(bay) ? bay : "all";
}

export function bayArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return bayLabel(filter);
}

function csvCell(value: string): string {
  if (/[",]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The bay and the tag stay columns, not search fields. */
export function lampsCsv(raw: unknown): string {
  const lines = ["text,bay,tag,stamp,pinned,lit,held,reviewed,kept,audit"];
  for (const card of readLamps(raw)) {
    lines.push([
      csvCell(card.text),
      csvCell(card.bay),
      csvCell(card.tag),
      csvCell(card.stamp),
      card.pinned ? "1" : "0",
      card.lit ? "1" : "0",
      card.held ? "1" : "0",
      card.reviewed ? "1" : "0",
      card.kept ? "1" : "0",
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function readViews(raw: unknown): LampView[] {
  if (!Array.isArray(raw)) return [];
  const out: LampView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<LampView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    const bay = row.bay === "all" || row.bay === "blank" ? row.bay : bayLabel(row.bay);
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      bay: bay || "all",
      tag: tagLabel(row.tag),
    });
  }
  return out.slice(0, 12);
}

export function addView(
  views: readonly LampView[],
  view: { id: string; name: string; tray: LampTray; query: string; bay: string; tag: string },
): LampView[] {
  const current = readViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const bay = view.bay === "all" || view.bay === "blank" ? view.bay : bayLabel(view.bay);
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    bay: bay || "all",
    tag: tagLabel(view.tag),
  }, ...current].slice(0, 12);
}

export function dropView(views: readonly LampView[], id: string): LampView[] {
  return readViews(views).filter((view) => view.id !== id);
}

/**
 * The broker name already on the trader row.
 * A trading server, a trading group, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a timezone, a language, a validation status,
 * or a desk name is not a broker name.
 */
export function brokerText(value: BrokerValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if (
    "tradingServer" in value
    || "tradingGroup" in value
    || "saleStatus" in value
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
  return typeof value.brokerName === "string" ? value.brokerName.replace(/\s+/g, " ").trim() : "";
}

export function brokerLines(rows: readonly BrokerRow[]): BrokerLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const brokerName = brokerText(row.brokerName);
    map.set(brokerName, (map.get(brokerName) || 0) + 1);
  }
  const out: BrokerLine[] = [];
  map.forEach((count, brokerName) => out.push({ brokerName, count }));
  return out.sort((a, b) => {
    if (!a.brokerName) return -1;
    if (!b.brokerName) return 1;
    return a.brokerName.localeCompare(b.brokerName);
  });
}

export function namedBrokers(rows: readonly BrokerRow[]): string[] {
  return brokerLines(rows).map((line) => line.brokerName).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function brokerShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named broker with the most loaded rows. A tie keeps the earlier name. */
export function leadingBroker(rows: readonly BrokerRow[]): string {
  const named = brokerLines(rows).filter((line) => line.brokerName);
  if (!named.length) return "";
  return named
    .slice()
    .sort((a, b) => b.count - a.count || a.brokerName.localeCompare(b.brokerName))[0].brokerName;
}

export function readHiddenBrokers(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => brokerText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const brokerName = brokerText(String(item || ""));
    if (!brokerName || !allow.has(brokerName) || out.includes(brokerName)) continue;
    out.push(brokerName);
  }
  return out;
}

export function toggleBroker(hidden: readonly string[], brokerName: string, present: readonly string[]): string[] {
  const current = readHiddenBrokers(hidden, present);
  const next = brokerText(brokerName);
  if (!next || !present.map((item) => brokerText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleBrokers(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenBrokers(hidden, present));
  return namedBrokers(present.map((brokerName) => ({ brokerName }))).filter((brokerName) => (showHidden ? gone.has(brokerName) : !gone.has(brokerName)));
}

export function activeBroker(selected: string, visible: readonly string[]): string {
  const brokerName = brokerText(selected);
  if (!brokerName) return "";
  return visible.some((item) => brokerText(item) === brokerName) ? brokerName : "";
}

export function visibleBrokerCustomers<T extends BrokerRow>(rows: readonly T[], brokerName: string, blank: boolean, query: string): T[] {
  const want = brokerText(brokerName);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = brokerText(row.brokerName);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}

/** The CSV is the broker names and counts on this page. */
export function brokersCsv(rows: readonly BrokerRow[]): string {
  const lines = ["broker,count"];
  for (const line of brokerLines(rows)) lines.push([csvCell(line.brokerName), String(line.count)].join(","));
  return lines.join("\n");
}
