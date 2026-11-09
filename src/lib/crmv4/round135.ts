/** Local host cards, and customer counts grouped by the trading server already on each row. */

export const HOST_KEY = "crmv4-host-cards";
export const HOST_VIEW_KEY = "crmv4-host-views";
export const SERVER_KEY = "crmv4-server-hide";

export type HostRank = 0 | 1 | 2;

export type HostCard = {
  id: string;
  text: string;
  wing: string;
  hour: string;
  rank: HostRank;
  folded: boolean;
  passed: boolean;
  quiet: boolean;
  audit: string;
};

export type HostTray = "open" | "folded" | "passed";

export type HostView = {
  id: string;
  name: string;
  tray: HostTray;
  query: string;
  wing: string;
  hour: string;
};

export type HostCounts = {
  open: number;
  folded: number;
  passed: number;
  quiet: number;
  firstOpen: number;
};

export type ServerValue =
  | {
      tradingServer?: unknown;
      tradingGroup?: unknown;
      desk?: unknown;
      deskId?: unknown;
      brokerName?: unknown;
      campaign?: unknown;
      assigneeName?: unknown;
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
      referralCodeUsed?: unknown;
    }
  | string
  | null
  | undefined;

export type ServerRow = { tradingServer?: ServerValue; label?: string | null };

export type ServerLine = { tradingServer: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "fold", "unfold", "pass", "recall", "quiet", "aloud"] as const;

const SERVER_BLOCK = [
  "tradingGroup",
  "desk",
  "deskId",
  "brokerName",
  "campaign",
  "assigneeName",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "role",
  "timezone",
  "language",
  "validation",
  "validationStatus",
  "referralCodeUsed",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): HostTray {
  return raw === "folded" || raw === "passed" ? raw : "open";
}

function rankOf(raw: unknown): HostRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

/** A blank card is left out. The saved text stays short. */
export function hostText(raw: unknown): string {
  return clip(raw, 96);
}

/** A blank wing stays blank. It is not filled in. */
export function wingLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank hour stays blank. It is not filled in. */
export function hourLabel(raw: unknown): string {
  return clip(raw, 5);
}

export function readHosts(raw: unknown): HostCard[] {
  if (!Array.isArray(raw)) return [];
  const out: HostCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HostCard>;
    const id = String(row.id || "").trim();
    const text = hostText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      wing: wingLabel(row.wing),
      hour: hourLabel(row.hour),
      rank: rankOf(row.rank),
      folded: row.folded === true,
      passed: row.passed === true,
      quiet: row.quiet === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addHost(
  cards: readonly HostCard[],
  card: { id: string; text: string; wing?: string; hour?: string },
): HostCard[] {
  const current = readHosts(cards);
  const id = String(card.id || "").trim();
  const text = hostText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: HostCard = {
    id,
    text,
    wing: wingLabel(card.wing),
    hour: hourLabel(card.hour),
    rank: 0,
    folded: false,
    passed: false,
    quiet: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepHostRank(cards: readonly HostCard[], id: string, dir: 1 | -1): HostCard[] {
  return readHosts(cards).map((card) => {
    if (card.id !== id) return card;
    const next = rankOf(Math.min(2, Math.max(0, card.rank + dir)));
    if (next === card.rank) return card;
    return { ...card, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setHostFolded(cards: readonly HostCard[], id: string, folded: boolean): HostCard[] {
  return readHosts(cards).map((card) => (card.id === id ? { ...card, folded, audit: folded ? "fold" : "unfold" } : card));
}

export function setHostPassed(cards: readonly HostCard[], id: string, passed: boolean): HostCard[] {
  return readHosts(cards).map((card) => (card.id === id ? { ...card, passed, audit: passed ? "pass" : "recall" } : card));
}

export function setHostQuiet(cards: readonly HostCard[], id: string, quiet: boolean): HostCard[] {
  return readHosts(cards).map((card) => (card.id === id ? { ...card, quiet, audit: quiet ? "quiet" : "aloud" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editHost(cards: readonly HostCard[], id: string, text: string): HostCard[] {
  const current = readHosts(cards);
  const next = hostText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkHostFolded(cards: readonly HostCard[], ids: readonly string[], folded: boolean): HostCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHosts(cards).map((card) => (want.has(card.id) ? { ...card, folded, audit: folded ? "fold" : "unfold" } : card));
}

export function bulkHostPassed(cards: readonly HostCard[], ids: readonly string[], passed: boolean): HostCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readHosts(cards).map((card) => (want.has(card.id) ? { ...card, passed, audit: passed ? "pass" : "recall" } : card));
}

export function resetHosts(): HostCard[] {
  return [];
}

/** Copy uses the card text. A blank card copies nothing. */
export function hostCopy(raw: unknown): string {
  return hostText(raw);
}

function inTray(card: HostCard, tray: HostTray): boolean {
  if (tray === "passed") return card.passed;
  if (tray === "folded") return card.folded && !card.passed;
  return !card.folded && !card.passed;
}

/** Search stays on the card text. The wing and the hour are not part of the query. */
export function visibleHosts(
  cards: readonly HostCard[],
  tray: HostTray,
  query: string,
  wing: string | null,
  hour: string | null,
  firstOnly: boolean,
): HostCard[] {
  const text = query.trim().toLowerCase();
  const wantWing = wing === null ? null : wingLabel(wing);
  const wantHour = hour === null ? null : hourLabel(hour);
  return readHosts(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (firstOnly && card.rank !== 2) return false;
      if (wantWing !== null && wingLabel(card.wing) !== wantWing) return false;
      if (wantHour !== null && hourLabel(card.hour) !== wantHour) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The hour orders the day. A blank hour stays at the end. Search stays on the card text. */
export function hostTimeline(cards: readonly HostCard[], query: string): HostCard[] {
  const text = query.trim().toLowerCase();
  return readHosts(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (!a.hour && b.hour) return 1;
      if (a.hour && !b.hour) return -1;
      const hour = a.hour.localeCompare(b.hour);
      if (hour) return hour;
      return a.text.localeCompare(b.text);
    });
}

export function hostCounts(cards: readonly HostCard[]): HostCounts {
  const rows = readHosts(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    folded: rows.filter((card) => inTray(card, "folded")).length,
    passed: rows.filter((card) => inTray(card, "passed")).length,
    quiet: rows.filter((card) => card.quiet).length,
    firstOpen: rows.filter((card) => card.rank === 2 && inTray(card, "open")).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function hostShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function hostWings(cards: readonly HostCard[]): string[] {
  const out: string[] = [];
  for (const card of readHosts(cards)) {
    if (card.wing && !out.includes(card.wing)) out.push(card.wing);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function hostHours(cards: readonly HostCard[]): string[] {
  const out: string[] = [];
  for (const card of readHosts(cards)) {
    if (card.hour && !out.includes(card.hour)) out.push(card.hour);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** "all" and "blank" stay. A wing that is no longer on a card falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingLabel(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return wingLabel(filter);
}

/** "all" and "blank" stay. An hour that is no longer on a card falls back to all. */
export function activeHour(filter: string, hours: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const hour = hourLabel(filter);
  return hour && hours.includes(hour) ? hour : "all";
}

export function hourArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return hourLabel(filter);
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The wing and the hour stay columns, not search fields. */
export function hostsCsv(raw: unknown): string {
  const lines = ["text,wing,hour,rank,folded,passed,quiet,audit"];
  for (const card of readHosts(raw)) {
    lines.push([
      csvCell(card.text),
      csvCell(card.wing),
      csvCell(card.hour),
      String(card.rank),
      card.folded ? "1" : "0",
      card.passed ? "1" : "0",
      card.quiet ? "1" : "0",
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function slotOf(raw: unknown, label: (value: unknown) => string): string {
  if (raw === "all" || raw === "blank") return raw;
  return label(raw) || "all";
}

export function readViews(raw: unknown): HostView[] {
  if (!Array.isArray(raw)) return [];
  const out: HostView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<HostView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      wing: slotOf(row.wing, wingLabel),
      hour: slotOf(row.hour, hourLabel),
    });
  }
  return out.slice(0, 12);
}

export function addView(
  views: readonly HostView[],
  view: { id: string; name: string; tray: HostTray; query: string; wing: string; hour: string },
): HostView[] {
  const current = readViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    wing: slotOf(view.wing, wingLabel),
    hour: slotOf(view.hour, hourLabel),
  }, ...current].slice(0, 12);
}

export function dropView(views: readonly HostView[], id: string): HostView[] {
  return readViews(views).filter((view) => view.id !== id);
}

/**
 * The trading server already on the trader row.
 * A trading group, a desk name, a desk id, a broker name, a campaign, an assignee,
 * a sale status, a retention status, a potential status, a KYC status, an account type,
 * a role, a timezone, a language, a validation status, or a referral code is not a trading server.
 */
export function serverText(value: ServerValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (!value || typeof value !== "object") return "";
  if (SERVER_BLOCK.some((key) => key in value)) return "";
  return typeof value.tradingServer === "string" ? value.tradingServer.replace(/\s+/g, " ").trim() : "";
}

export function serverLines(rows: readonly ServerRow[]): ServerLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const tradingServer = serverText(row.tradingServer);
    map.set(tradingServer, (map.get(tradingServer) || 0) + 1);
  }
  const out: ServerLine[] = [];
  map.forEach((count, tradingServer) => out.push({ tradingServer, count }));
  return out.sort((a, b) => {
    if (!a.tradingServer) return -1;
    if (!b.tradingServer) return 1;
    return a.tradingServer.localeCompare(b.tradingServer);
  });
}

export function namedServers(rows: readonly ServerRow[]): string[] {
  return serverLines(rows).map((line) => line.tradingServer).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function serverShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named server with the most loaded rows. A tie keeps the earlier name. */
export function leadingServer(rows: readonly ServerRow[]): string {
  const named = serverLines(rows).filter((line) => line.tradingServer);
  if (!named.length) return "";
  return named
    .slice()
    .sort((a, b) => b.count - a.count || a.tradingServer.localeCompare(b.tradingServer))[0].tradingServer;
}

export function readHiddenServers(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => serverText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const tradingServer = serverText(String(item || ""));
    if (!tradingServer || !allow.has(tradingServer) || out.includes(tradingServer)) continue;
    out.push(tradingServer);
  }
  return out;
}

export function toggleServer(hidden: readonly string[], tradingServer: string, present: readonly string[]): string[] {
  const current = readHiddenServers(hidden, present);
  const next = serverText(tradingServer);
  if (!next || !present.map((item) => serverText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleServers(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenServers(hidden, present));
  return namedServers(present.map((tradingServer) => ({ tradingServer }))).filter((tradingServer) => (showHidden ? gone.has(tradingServer) : !gone.has(tradingServer)));
}

export function activeServer(selected: string, visible: readonly string[]): string {
  const tradingServer = serverText(selected);
  if (!tradingServer) return "";
  return visible.some((item) => serverText(item) === tradingServer) ? tradingServer : "";
}

export function visibleServerCustomers<T extends ServerRow>(rows: readonly T[], tradingServer: string, blank: boolean, query: string): T[] {
  const want = serverText(tradingServer);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = serverText(row.tradingServer);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (!text) return true;
    return `${row.label || ""} ${got}`.toLowerCase().includes(text);
  });
}

/** The CSV is the trading servers and counts on this page. */
export function serversCsv(rows: readonly ServerRow[]): string {
  const lines = ["server,count"];
  for (const line of serverLines(rows)) lines.push([csvCell(line.tradingServer), String(line.count)].join(","));
  return lines.join("\n");
}
