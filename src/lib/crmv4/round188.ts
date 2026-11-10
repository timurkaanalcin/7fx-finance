/**
 * Index slips for the archive desk, and the mail hall already on each loaded account.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_index_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   clerk text not null default '',
 *   leaf integer,
 *   shelf text not null default '',
 *   cipher text not null default '',
 *   pace text not null default '',
 *   span integer,
 *   wait integer,
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   filed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_mail_hall_hide (
 *   band text primary key
 * );
 * CREATE TABLE crm_mail_hall_review (
 *   customer_id text primary key
 * );
 */

export const SLIP_KEY = "crmv4-index-slips";
export const SLIP_VIEW_KEY = "crmv4-index-slip-views";
export const HALL_KEY = "crmv4-mail-hall-hide";
export const HALL_REVIEW_KEY = "crmv4-mail-hall-review";

export type SlipShelf = "blank" | "oak" | "linen" | "gilt" | "ink";

export type SlipPace = "blank" | "hush" | "walk" | "rush";

export type SlipTray = "open" | "held" | "filed";

export type LeafPick = "blank" | "dawn" | "day" | "dusk" | "peak" | "quiet";

export type Slip = {
  id: string;
  title: string;
  note: string;
  clerk: string;
  leaf: number | null;
  shelf: string;
  cipher: string;
  pace: string;
  span: number | null;
  wait: number | null;
  pinned: boolean;
  held: boolean;
  filed: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  clerk: string;
  shelf: string;
  cipher: string;
  pace: string;
  leaf: string;
  span: string;
  wait: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  filed: number;
  pinned: number;
  peak: number;
  late: number;
  soon: number;
  home: number;
};

export type HallState = "" | "set" | "clear";

export type HallBand = "" | "post" | "lane" | "court" | "hall";

export type HallParity = "" | "even" | "odd";

export type HallShape = "all" | "catalog" | "wide" | "even";

export type HallValue =
  | { email?: unknown; assigneeId?: unknown; balance?: unknown; equity?: unknown; credit?: unknown; bonus?: unknown; currency?: unknown; margin?: unknown; freeMargin?: unknown; amount?: unknown; leverage?: unknown }
  | string
  | number
  | null
  | undefined;

export type HallRow = { id?: string; note?: HallValue; label?: string | null };

export type HallBandLine = { band: string; count: number };

export type HallParityLine = { parity: string; count: number };

const AUDITS = ["save", "edit", "pace", "pin", "unpin", "hold", "lift", "file", "reopen", "shelf"] as const;

const SHELVES = ["oak", "linen", "gilt", "ink"] as const;

const PACES = ["hush", "walk", "rush"] as const;

const PACE_ORDER = ["", "hush", "walk", "rush"] as const;

const LEAF_PICKS = ["blank", "dawn", "day", "dusk", "peak", "quiet"] as const;

const PEAK_LEAVES = new Set([1, 15]);

const QUIET_LEAVES = new Set([7, 21]);

const SPANS = [2, 4, 8] as const;

const WAITS = [1, 3, 7] as const;

const HOME = new Set(["TR01", "DE02", "AE03"]);

const HALL_BANDS = ["post", "lane", "court", "hall"] as const;

const PARITIES = ["even", "odd"] as const;

const CATALOG = new Set(["gmail.com", "outlook.com", "yahoo.com", "icloud.com"]);

const HALL_BLOCK = ["assigneeId", "balance", "equity", "credit", "bonus", "currency", "margin", "freeMargin", "amount", "leverage"] as const;

const SLIP_CAP = 9;

const VIEW_CAP = 5;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "filed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function shelfName(raw: unknown): Exclude<SlipShelf, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (SHELVES as readonly string[]).includes(text) ? (text as Exclude<SlipShelf, "blank">) : "";
}

function paceName(raw: unknown): Exclude<SlipPace, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (PACES as readonly string[]).includes(text) ? (text as Exclude<SlipPace, "blank">) : "";
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 28);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 64);
}

/** A blank clerk stays blank. It is not filled in. */
export function clerkLabel(raw: unknown): string {
  return clip(raw, 14);
}

/** A cipher is two letters and two digits. Anything else stays blank. Letters are stored in capitals. */
export function slipCipher(raw: unknown): string {
  const text = clip(raw, 8).toUpperCase();
  return /^[A-Z]{2}[0-9]{2}$/.test(text) ? text : "";
}

/**
 * A leaf is an integer from 1 through 28.
 * A blank value stays unset. 0 and 29 are not leaves.
 * A leading zero is not a leaf.
 */
export function leafOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 28) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|1[0-9]|2[0-8])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/**
 * A span is 2, 4, or 8 pages.
 * A blank value stays unset. 0 and 1 are not spans.
 * A leading zero is not a span.
 */
export function spanOf(raw: unknown): number | null {
  if (typeof raw === "number" && (SPANS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:2|4|8)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** A wait is 1, 3, or 7 days. A blank value stays unset. A leading zero is not a wait. */
export function waitDays(raw: unknown): number | null {
  if (typeof raw === "number" && (WAITS as readonly number[]).includes(raw)) return raw;
  if (typeof raw === "string" && /^(?:1|3|7)$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Oak, linen, gilt, ink, or blank. Anything else is blank. */
export function shelfOf(raw: unknown): SlipShelf {
  return shelfName(raw) || "blank";
}

/** Hush, walk, rush, or blank. Anything else is blank. */
export function paceOf(raw: unknown): SlipPace {
  return paceName(raw) || "blank";
}

/** Dawn is 1–9. Day is 10–18. Dusk is 19–28. An unset leaf is blank. */
export function leafBand(leaf: unknown): "blank" | "dawn" | "day" | "dusk" {
  const value = leafOf(leaf);
  if (value === null) return "blank";
  if (value <= 9) return "dawn";
  if (value <= 18) return "day";
  return "dusk";
}

/** Peak leaves are 1 and 15. An unset leaf is not a peak. */
export function peakLeaf(leaf: unknown): boolean {
  const value = leafOf(leaf);
  return value !== null && PEAK_LEAVES.has(value);
}

/** Quiet leaves are 7 and 21. 1 and 15 are not quiet. An unset leaf is not quiet. */
export function quietLeaf(leaf: unknown): boolean {
  const value = leafOf(leaf);
  return value !== null && QUIET_LEAVES.has(value);
}

/**
 * The shortest signed step from the saved leaf to the typed leaf.
 * The ring wraps at 28. A step of 14 stays. A step of -14 stays.
 * A positive step means the typed leaf is ahead of the slip.
 */
export function leafGap(leaf: unknown, desk: unknown): number | null {
  const from = leafOf(leaf);
  const at = leafOf(desk);
  if (from === null || at === null) return null;
  let diff = at - from;
  if (diff > 14) diff -= 28;
  if (diff < -14) diff += 28;
  return diff;
}

/** TR01, DE02, and AE03 are home ciphers. A blank cipher is not. */
export function homeCipher(cipher: unknown): boolean {
  return HOME.has(slipCipher(cipher));
}

export function readSlips(raw: unknown): Slip[] {
  if (!Array.isArray(raw)) return [];
  const out: Slip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Slip>;
    const id = String(row.id || "").trim();
    const title = slipLine(row.title);
    if (!id || !title || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      title,
      note: slipNote(row.note),
      clerk: clerkLabel(row.clerk),
      leaf: leafOf(row.leaf),
      shelf: shelfName(row.shelf),
      cipher: slipCipher(row.cipher),
      pace: paceName(row.pace),
      span: spanOf(row.span),
      wait: waitDays(row.wait),
      pinned: row.pinned === true,
      held: row.held === true,
      filed: row.filed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLIP_CAP);
}

export function addSlip(
  cards: readonly Slip[],
  card: {
    id: string;
    title: string;
    note?: string;
    clerk?: string;
    leaf?: unknown;
    shelf?: string;
    cipher?: string;
    pace?: string;
    span?: unknown;
    wait?: unknown;
  },
): Slip[] {
  const current = readSlips(cards);
  const id = String(card.id || "").trim();
  const title = slipLine(card.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: Slip = {
    id,
    title,
    note: slipNote(card.note),
    clerk: clerkLabel(card.clerk),
    leaf: leafOf(card.leaf),
    shelf: shelfName(card.shelf),
    cipher: slipCipher(card.cipher),
    pace: paceName(card.pace),
    span: spanOf(card.span),
    wait: waitDays(card.wait),
    pinned: false,
    held: false,
    filed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

/** Blank becomes hush. Hush becomes walk, walk becomes rush, and rush returns to hush. */
export function cyclePace(cards: readonly Slip[], id: string): Slip[] {
  return readSlips(cards).map((card) => {
    if (card.id !== id) return card;
    const at = PACE_ORDER.indexOf(card.pace as (typeof PACE_ORDER)[number]);
    const next = at < 0 || at >= PACES.length ? PACES[0] : PACES[at % PACES.length];
    if (!next || next === card.pace) return card;
    return { ...card, pace: next, audit: "pace" };
  });
}

export function setSlipPin(cards: readonly Slip[], id: string, pinned: boolean): Slip[] {
  return readSlips(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setSlipHold(cards: readonly Slip[], id: string, held: boolean): Slip[] {
  return readSlips(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "lift" } : card));
}

export function setSlipFile(cards: readonly Slip[], id: string, filed: boolean): Slip[] {
  return readSlips(cards).map((card) => (card.id === id ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

/** A blank edit is left out. A duplicate of another title is left out. */
export function editSlip(cards: readonly Slip[], id: string, title: string): Slip[] {
  const current = readSlips(cards);
  const next = slipLine(title);
  if (!next || current.some((card) => card.id !== id && card.title === next)) return current;
  return current.map((card) => (card.id === id && card.title !== next ? { ...card, title: next, audit: "edit" } : card));
}

/** A blank note is left out. The same note is left as it is. */
export function editSlipNote(cards: readonly Slip[], id: string, note: string): Slip[] {
  const current = readSlips(cards);
  const next = slipNote(note);
  if (!next) return current;
  return current.map((card) => (card.id === id && card.note !== next ? { ...card, note: next, audit: "edit" } : card));
}

export function bulkSlipPin(cards: readonly Slip[], ids: readonly string[], pinned: boolean): Slip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkSlipShelf(cards: readonly Slip[], ids: readonly string[], shelf: unknown): Slip[] {
  const next = shelfName(shelf);
  if (!next) return readSlips(cards);
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(cards).map((card) => (want.has(card.id) ? { ...card, shelf: next, audit: "shelf" } : card));
}

export function bulkSlipFile(cards: readonly Slip[], ids: readonly string[], filed: boolean): Slip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(cards).map((card) => (want.has(card.id) ? { ...card, filed, audit: filed ? "file" : "reopen" } : card));
}

export function resetSlips(): Slip[] {
  return [];
}

function inTray(card: Slip, tray: SlipTray): boolean {
  if (tray === "filed") return card.filed;
  if (tray === "held") return card.held && !card.filed;
  return !card.held && !card.filed;
}

function leafHit(leaf: number | null, exact: number | null, pick: LeafPick | null): boolean {
  if (exact !== null) return leaf === exact;
  if (pick === null) return true;
  if (pick === "blank") return leaf === null;
  if (pick === "peak") return peakLeaf(leaf);
  if (pick === "quiet") return quietLeaf(leaf);
  return leafBand(leaf) === pick;
}

function paceScore(pace: string): number {
  if (pace === "rush") return 3;
  if (pace === "walk") return 2;
  if (pace === "hush") return 1;
  return 0;
}

/** An open slip whose leaf sits more than four steps behind the desk leaf. A held or filed slip is not late. */
export function lateSlip(card: Slip, desk: unknown): boolean {
  const gap = leafGap(card.leaf, desk);
  return inTray(card, "open") && gap !== null && gap > 4;
}

/** An open slip with a 1 day wait is the reminder. A held or filed slip is not. */
export function soonSlip(card: Slip): boolean {
  return inTray(card, "open") && card.wait === 1;
}

/** Search matches the title, the note, and the clerk. The leaf and the shelf are not part of the query. */
export function visibleSlips(
  cards: readonly Slip[],
  tray: SlipTray,
  query: string,
  clerk: string | null,
  shelf: SlipShelf | null,
  cipher: string | null,
  pace: SlipPace | null,
  exact: number | null,
  pick: LeafPick | null,
  span: number | "blank" | null,
  wait: number | "blank" | null,
  hushOnly: boolean,
  peakOnly: boolean,
  homeOnly: boolean,
): Slip[] {
  const text = query.trim().toLowerCase();
  const wantClerk = clerk === null ? null : clerkLabel(clerk);
  const wantCipher = cipher === null ? null : slipCipher(cipher);
  return readSlips(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (wantClerk !== null && card.clerk !== wantClerk) return false;
      if (shelf !== null && shelfOf(card.shelf) !== shelf) return false;
      if (wantCipher !== null && card.cipher !== wantCipher) return false;
      if (pace !== null && paceOf(card.pace) !== pace) return false;
      if (!leafHit(card.leaf, exact, pick)) return false;
      if (span === "blank" && card.span !== null) return false;
      if (typeof span === "number" && card.span !== span) return false;
      if (wait === "blank" && card.wait !== null) return false;
      if (typeof wait === "number" && card.wait !== wait) return false;
      if (hushOnly && card.pace !== "hush") return false;
      if (peakOnly && !peakLeaf(card.leaf)) return false;
      if (homeOnly && !homeCipher(card.cipher)) return false;
      if (!text) return true;
      return card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.clerk.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (paceScore(a.pace) !== paceScore(b.pace)) return paceScore(b.pace) - paceScore(a.pace);
      return a.title.localeCompare(b.title);
    });
}

export function slipTimeline(cards: readonly Slip[], query: string): Slip[] {
  const text = query.trim().toLowerCase();
  return readSlips(cards)
    .filter((card) => card.leaf !== null)
    .filter((card) => !text || card.title.toLowerCase().includes(text) || card.note.toLowerCase().includes(text) || card.clerk.toLowerCase().includes(text))
    .sort((a, b) => (a.leaf ?? 0) - (b.leaf ?? 0) || a.title.localeCompare(b.title));
}

export function slipCounts(cards: readonly Slip[], desk: unknown): SlipCounts {
  const rows = readSlips(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    filed: rows.filter((card) => inTray(card, "filed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    peak: rows.filter((card) => peakLeaf(card.leaf) && inTray(card, "open")).length,
    late: rows.filter((card) => lateSlip(card, desk)).length,
    soon: rows.filter((card) => soonSlip(card)).length,
    home: rows.filter((card) => homeCipher(card.cipher)).length,
  };
}

export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function slipClerks(cards: readonly Slip[]): string[] {
  const seen = new Set<string>();
  for (const card of readSlips(cards)) if (card.clerk) seen.add(card.clerk);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function slipCiphers(cards: readonly Slip[]): string[] {
  const seen = new Set<string>();
  for (const card of readSlips(cards)) if (card.cipher) seen.add(card.cipher);
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

export function slipPaces(cards: readonly Slip[]): Exclude<SlipPace, "blank">[] {
  const seen = new Set<string>();
  for (const card of readSlips(cards)) if (card.pace) seen.add(card.pace);
  return PACES.filter((pace) => seen.has(pace));
}

export function shelfCounts(cards: readonly Slip[]): { shelf: Exclude<SlipShelf, "blank">; count: number }[] {
  const rows = readSlips(cards);
  return SHELVES.map((shelf) => ({ shelf, count: rows.filter((card) => card.shelf === shelf).length })).filter((row) => row.count > 0);
}

export function usedLeaves(cards: readonly Slip[]): number {
  return new Set(readSlips(cards).map((card) => card.leaf).filter((leaf): leaf is number => leaf !== null)).size;
}

export function clashLeafIds(cards: readonly Slip[]): string[] {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.leaf !== null && card.shelf);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.shelf === card.shelf && other.leaf === card.leaf)).map((card) => card.id);
}

export function clashLeafCount(cards: readonly Slip[]): number {
  return clashLeafIds(cards).length;
}

export function spanClashIds(cards: readonly Slip[]): string[] {
  const open = readSlips(cards).filter((card) => inTray(card, "open") && card.span !== null && card.shelf);
  return open.filter((card) => open.some((other) => other.id !== card.id && other.shelf === card.shelf && other.span === card.span)).map((card) => card.id);
}

export function spanClashCount(cards: readonly Slip[]): number {
  return spanClashIds(cards).length;
}

/** The next open slip at or after the desk leaf. Rush paces wait. A blank desk leaf stays blank. */
export function nextSlip(cards: readonly Slip[], desk: unknown): string {
  const now = leafOf(desk);
  if (now === null) return "";
  const waiting = readSlips(cards).filter((card) => inTray(card, "open") && card.leaf !== null && card.pace !== "rush");
  if (!waiting.length) return "";
  const byLeaf = (a: Slip, b: Slip) => (a.leaf ?? 0) - (b.leaf ?? 0) || a.title.localeCompare(b.title);
  const later = waiting.filter((card) => (card.leaf ?? 0) >= now).sort(byLeaf);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byLeaf)[0].id;
}

/**
 * The shelf with the fewest open slips.
 * A tie keeps ink, then gilt, then oak, then linen.
 * Slips with no shelf are not a load. An empty desk still suggests ink.
 */
export function suggestShelf(cards: readonly Slip[]): Exclude<SlipShelf, "blank"> {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  const order = ["ink", "gilt", "oak", "linen"] as const;
  let best: Exclude<SlipShelf, "blank"> = "ink";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const shelf of order) {
    const count = rows.filter((card) => card.shelf === shelf).length;
    if (count < bestCount) {
      best = shelf;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The clerk carrying the fewest open slips.
 * A tie keeps the earlier name. A blank clerk is not a load.
 * An empty desk stays blank.
 */
export function suggestClerk(cards: readonly Slip[]): string {
  const rows = readSlips(cards).filter((card) => inTray(card, "open") && card.clerk);
  let best = "";
  let bestCount = Number.POSITIVE_INFINITY;
  const names = Array.from(new Set(rows.map((card) => card.clerk))).sort((a, b) => a.localeCompare(b));
  for (const clerk of names) {
    const count = rows.filter((card) => card.clerk === clerk).length;
    if (count < bestCount) {
      best = clerk;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The wait with the fewest open slips.
 * A tie keeps 3, then 1, then 7.
 * An empty desk still suggests 3.
 */
export function suggestWait(cards: readonly Slip[]): (typeof WAITS)[number] {
  const rows = readSlips(cards).filter((card) => inTray(card, "open"));
  const order = [3, 1, 7] as const;
  let best: (typeof WAITS)[number] = 3;
  let bestCount = Number.POSITIVE_INFINITY;
  for (const wait of order) {
    const count = rows.filter((card) => card.wait === wait).length;
    if (count < bestCount) {
      best = wait;
      bestCount = count;
    }
  }
  return best;
}

/**
 * The roster name with the fewest open slips.
 * A blank roster falls back to the least-loaded clerk already on the desk.
 * A tie keeps the earlier name.
 */
export function fairClerk(cards: readonly Slip[], roster: unknown): string {
  const names: string[] = [];
  for (const part of String(roster ?? "").split(",")) {
    const name = clerkLabel(part);
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return suggestClerk(cards);
  const open = readSlips(cards).filter((card) => inTray(card, "open"));
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));
  let best = sorted[0];
  let bestCount = Number.POSITIVE_INFINITY;
  for (const name of sorted) {
    const count = open.filter((card) => card.clerk === name).length;
    if (count < bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap and the late mark use the leaf you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["title,clerk,leaf,shelf,cipher,pace,span,wait,band,pinned,held,filed,gap,late,soon,home,note,audit"];
  for (const card of readSlips(raw)) {
    const gap = leafGap(card.leaf, desk);
    lines.push([
      csvCell(card.title),
      csvCell(card.clerk),
      card.leaf === null ? "" : String(card.leaf),
      card.shelf,
      csvCell(card.cipher),
      card.pace,
      card.span === null ? "" : String(card.span),
      card.wait === null ? "" : String(card.wait),
      leafBand(card.leaf),
      card.pinned ? "1" : "0",
      card.held ? "1" : "0",
      card.filed ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(card, desk) ? "1" : "0",
      soonSlip(card) ? "1" : "0",
      homeCipher(card.cipher) ? "1" : "0",
      csvCell(card.note),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

export function slipCopy(card: Slip): string {
  return [card.title, card.clerk, card.leaf ?? "", card.shelf, card.cipher, card.pace, card.span ?? "", card.wait ?? "", card.note].filter((part) => part !== "").join(" · ");
}

function clerkSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return clerkLabel(raw) || "all";
}

function shelfSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return shelfName(raw) || "all";
}

function cipherSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return slipCipher(raw) || "all";
}

function paceSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return paceName(raw) || "all";
}

/** "all" and a leaf pick stay. A leaf from 1 through 28 stays. Anything else is all. */
export function activeLeaf(filter: string): string {
  if (filter === "all") return "all";
  if ((LEAF_PICKS as readonly string[]).includes(filter)) return filter;
  const leaf = leafOf(filter);
  return leaf === null ? "all" : String(leaf);
}

export function leafArg(filter: string): { exact: number | null; pick: LeafPick | null } {
  if ((LEAF_PICKS as readonly string[]).includes(filter)) return { exact: null, pick: filter as LeafPick };
  const leaf = leafOf(filter);
  return leaf === null ? { exact: null, pick: null } : { exact: leaf, pick: null };
}

/** All, blank, and the spans 2, 4, and 8 stay. Anything else is all. */
export function activeSpan(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const span = spanOf(filter);
  return span === null ? "all" : String(span);
}

export function spanArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return spanOf(filter);
}

/** All, blank, and the waits 1, 3, and 7 stay. Anything else is all. */
export function activeWait(filter: string): string {
  if (filter === "all" || filter === "blank") return filter;
  const wait = waitDays(filter);
  return wait === null ? "all" : String(wait);
}

export function waitArg(filter: string): number | "blank" | null {
  if (filter === "blank") return "blank";
  return waitDays(filter);
}

export function activeClerk(filter: string, clerks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const clerk = clerkLabel(filter);
  return clerk && clerks.includes(clerk) ? clerk : "all";
}

export function clerkArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return clerkLabel(filter) || null;
}

export function activeShelf(filter: string, shelves: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const shelf = shelfName(filter);
  return shelf && shelves.includes(shelf) ? shelf : "all";
}

export function shelfArg(filter: string): SlipShelf | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return shelfName(filter) || null;
}

export function activeCipher(filter: string, ciphers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const cipher = slipCipher(filter);
  return cipher && ciphers.includes(cipher) ? cipher : "all";
}

export function cipherArg(filter: string): string | null {
  if (filter === "all") return null;
  if (filter === "blank") return "";
  return slipCipher(filter) || null;
}

export function activePace(filter: string, paces: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const pace = paceName(filter);
  return pace && paces.includes(pace) ? pace : "all";
}

export function paceArg(filter: string): SlipPace | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  return paceName(filter) || null;
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SlipView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 32),
      clerk: clerkSlot(row.clerk),
      shelf: shelfSlot(row.shelf),
      cipher: cipherSlot(row.cipher),
      pace: paceSlot(row.pace),
      leaf: activeLeaf(String(row.leaf || "all")),
      span: activeSpan(String(row.span || "all")),
      wait: activeWait(String(row.wait || "all")),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSlipView(views: readonly SlipView[], view: SlipView): SlipView[] {
  const current = readSlipViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [{
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 32),
    clerk: clerkSlot(view.clerk),
    shelf: shelfSlot(view.shelf),
    cipher: cipherSlot(view.cipher),
    pace: paceSlot(view.pace),
    leaf: activeLeaf(view.leaf),
    span: activeSpan(view.span),
    wait: activeWait(view.wait),
  }, ...current].slice(0, VIEW_CAP);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

/**
 * A mail hall is the domain after @.
 * It is 4 to 24 letters, digits, hyphens, and dots, with a dot and a short ending.
 * A blank value stays unset. A hyphen is allowed inside a label.
 */
export function houseToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().toLowerCase();
  const at = text.lastIndexOf("@");
  if (at < 1 || at >= text.length - 1) return null;
  const domain = text.slice(at + 1);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,22}\.)+[a-z]{2,12}$/.test(domain)) return null;
  if (domain.length < 4 || domain.length > 24) return null;
  return domain;
}

function houseBody(value: HallValue): { text: string | null; explicit: boolean } | null {
  if (typeof value === "number") return { text: null, explicit: false };
  if (typeof value === "string") {
    if (value.trim() === "") return { text: null, explicit: true };
    const text = houseToken(value);
    return { text, explicit: text !== null };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { text: null, explicit: false };
  if (HALL_BLOCK.some((key) => key in value)) return null;
  if (!("email" in value)) return { text: null, explicit: false };
  const inner = value.email;
  if (inner === null || inner === "") return { text: null, explicit: true };
  const text = houseToken(inner);
  if (text === null) return { text: null, explicit: false };
  return { text, explicit: true };
}

/**
 * Set, clear, or unmarked.
 * A set hall is a mail domain. A clear hall is an explicit blank.
 * A missing field stays unmarked. A blocked field is not this hall.
 */
export function houseState(value: HallValue): HallState {
  const body = houseBody(value);
  if (!body) return "";
  if (body.text !== null) return "set";
  return body.explicit ? "clear" : "";
}

/** The mail domain, or a blank string when the hall is clear or unmarked. */
export function houseCopy(value: HallValue): string {
  return houseBody(value)?.text || "";
}

/**
 * Post is 4–10. Lane is 11–14. Court is 15–18. Hall is 19–24.
 * A blank address has no band.
 */
export function houseBand(value: HallValue): HallBand {
  const text = houseBody(value)?.text;
  if (!text) return "";
  const n = text.length;
  if (n <= 10) return "post";
  if (n <= 14) return "lane";
  if (n <= 18) return "court";
  return "hall";
}

/** Even or odd length. A blank address has no parity. */
export function houseParity(value: HallValue): HallParity {
  const text = houseBody(value)?.text;
  if (!text) return "";
  return text.length % 2 === 0 ? "even" : "odd";
}

/** gmail.com, outlook.com, yahoo.com, and icloud.com are the house catalog. A clear address is not catalog. */
export function catalogHouse(value: HallValue): boolean {
  const text = houseBody(value)?.text;
  if (!text) return false;
  return CATALOG.has(text);
}

/** A domain of 19 or more. A clear address is not wide. */
export function wideHouse(value: HallValue): boolean {
  return houseBand(value) === "hall";
}

/** An even length. A clear address is not even. */
export function evenHouse(value: HallValue): boolean {
  return houseParity(value) === "even";
}

export function catalogHouseCount(rows: readonly HallRow[]): number {
  return rows.filter((row) => houseState(row.note) === "set" && catalogHouse(row.note)).length;
}

export function wideHouseCount(rows: readonly HallRow[]): number {
  return rows.filter((row) => houseState(row.note) === "set" && wideHouse(row.note)).length;
}

export function evenHouseCount(rows: readonly HallRow[]): number {
  return rows.filter((row) => houseState(row.note) === "set" && evenHouse(row.note)).length;
}

/** How many distinct mail domains are shared by two or more customers. */
export function sharedHouseCount(rows: readonly HallRow[]): number {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (houseState(row.note) !== "set") continue;
    const text = houseCopy(row.note);
    if (!text) continue;
    map.set(text, (map.get(text) || 0) + 1);
  }
  let count = 0;
  map.forEach((value) => {
    if (value >= 2) count += 1;
  });
  return count;
}

export function houseBands(rows: readonly HallRow[]): HallBandLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const state = houseState(row.note);
    if (state === "") continue;
    const band = state === "set" ? houseBand(row.note) : "";
    map.set(band, (map.get(band) || 0) + 1);
  }
  const out: HallBandLine[] = [];
  for (const band of ["", ...HALL_BANDS]) {
    const count = map.get(band);
    if (count) out.push({ band, count });
  }
  return out;
}

export function houseParities(rows: readonly HallRow[]): HallParityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const parity = houseParity(row.note);
    map.set(parity, (map.get(parity) || 0) + 1);
  }
  const out: HallParityLine[] = [];
  for (const parity of ["", ...PARITIES]) {
    const count = map.get(parity);
    if (count) out.push({ parity, count });
  }
  return out;
}

/** The band with the most loaded rows. A tie keeps post, then lane, court, and hall. An unmarked field is not a lead. */
export function leadingHouse(rows: readonly HallRow[]): string {
  const named = houseBands(rows).filter((line) => line.band);
  if (!named.length) return "";
  const order = (band: string) => HALL_BANDS.indexOf(band as (typeof HALL_BANDS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.band) - order(b.band))[0].band;
}

/** The parity with the most loaded rows. A tie keeps even, then odd. A blank address is not a lead. */
export function leadingHouseParity(rows: readonly HallRow[]): string {
  const named = houseParities(rows).filter((line) => line.parity);
  if (!named.length) return "";
  const order = (parity: string) => PARITIES.indexOf(parity as (typeof PARITIES)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.parity) - order(b.parity))[0].parity;
}

export function houseShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

function bandOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if ((HALL_BANDS as readonly string[]).includes(text) || text === "blank") return text;
  return "";
}

export function presentHouses(rows: readonly HallRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    const state = houseState(row.note);
    const token = state === "set" ? houseBand(row.note) : state === "clear" ? "blank" : "";
    if (token && !out.includes(token)) out.push(token);
  }
  return out;
}

export function readHiddenHouses(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const band = bandOwner(item);
    if (!band || !known.has(band) || out.includes(band)) continue;
    out.push(band);
  }
  return out;
}

export function toggleHouse(hidden: readonly string[], band: string, present: readonly string[]): string[] {
  const token = bandOwner(band);
  if (!token || !present.includes(token)) return readHiddenHouses(hidden, present);
  const current = readHiddenHouses(hidden, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function visibleHouseBands(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenHouses(hidden, present));
  return present.filter((band) => (showHidden ? gone.has(band) : !gone.has(band)));
}

export function houseBandArg(filter: string): HallBand | "blank" | null {
  if (filter === "all") return null;
  if (filter === "blank") return "blank";
  const band = bandOwner(filter);
  return band && band !== "blank" ? (band as HallBand) : null;
}

export function activeHouseBand(filter: string, present: readonly string[]): string {
  if (filter === "all") return "all";
  const band = filter === "blank" ? "blank" : bandOwner(filter);
  return band && present.includes(band) ? band : "all";
}

function parityOwner(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  return (PARITIES as readonly string[]).includes(text) ? text : "";
}

export function houseParityArg(filter: string): HallParity | null {
  if (filter === "all") return null;
  const parity = parityOwner(filter);
  return parity ? (parity as HallParity) : null;
}

export function activeHouseParity(filter: string): string {
  if (filter === "all") return "all";
  return parityOwner(filter) || "all";
}

function rowId(row: HallRow): string {
  return String(row.id || "").trim();
}

export function readReviewedHouses(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present.map((id) => String(id || "").trim()).filter(Boolean));
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item || "").trim();
    if (!id || !known.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out.slice(0, 32);
}

export function toggleHouseReview(reviewed: readonly string[], id: string, present: readonly string[]): string[] {
  const token = String(id || "").trim();
  if (!token || !present.includes(token)) return readReviewedHouses(reviewed, present);
  const current = readReviewedHouses(reviewed, present);
  return current.includes(token) ? current.filter((item) => item !== token) : [...current, token];
}

export function bulkHouseReview(reviewed: readonly string[], ids: readonly string[], present: readonly string[], on: boolean): string[] {
  const current = readReviewedHouses(reviewed, present);
  const want = ids.map((id) => String(id || "").trim()).filter((id) => id && present.includes(id));
  if (on) {
    const next = current.slice();
    for (let i = 0; i < want.length; i += 1) if (!next.includes(want[i])) next.push(want[i]);
    return next.slice(0, 32);
  }
  return current.filter((id) => !want.includes(id));
}

/** Search stays on the name. The band, the parity, and the domain are not part of the query. */
export function visibleHouseCustomers<T extends HallRow>(
  rows: readonly T[],
  band: HallBand | "blank" | null,
  parity: HallParity | null,
  query: string,
  review: "all" | "reviewed" | "open",
  reviewed: readonly string[],
  shape: HallShape,
): T[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    const state = houseState(row.note);
    if (band === "blank" && state !== "clear") return false;
    if (band && band !== "blank" && houseBand(row.note) !== band) return false;
    if (parity !== null && houseParity(row.note) !== parity) return false;
    if (shape === "catalog" && !catalogHouse(row.note)) return false;
    if (shape === "wide" && (state !== "set" || !wideHouse(row.note))) return false;
    if (shape === "even" && !evenHouse(row.note)) return false;
    const id = rowId(row);
    if (review === "reviewed" && !seen.has(id)) return false;
    if (review === "open" && seen.has(id)) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the bands and parities on this page. */
export function housesCsv(rows: readonly HallRow[]): string {
  const lines = ["kind,mark,count"];
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = houseState(row.note);
    states.set(state, (states.get(state) || 0) + 1);
  }
  for (const state of ["", "set", "clear"]) {
    const count = states.get(state);
    if (count) lines.push(["state", csvCell(state), String(count)].join(","));
  }
  for (const line of houseBands(rows)) lines.push(["band", csvCell(line.band), String(line.count)].join(","));
  for (const line of houseParities(rows)) lines.push(["parity", csvCell(line.parity), String(line.count)].join(","));
  lines.push(["shape", "catalog", String(catalogHouseCount(rows))].join(","));
  lines.push(["shape", "wide", String(wideHouseCount(rows))].join(","));
  lines.push(["shape", "even", String(evenHouseCount(rows))].join(","));
  lines.push(["shape", "shared", String(sharedHouseCount(rows))].join(","));
  return lines.join("\n");
}

/** The row CSV is the review queue on this page. */
export function houseRowsCsv(rows: readonly HallRow[], reviewed: readonly string[]): string {
  const lines = ["name,band,parity,house,catalog,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push([
      csvCell(String(row.label || "")),
      csvCell(houseBand(row.note)),
      csvCell(houseParity(row.note)),
      csvCell(houseCopy(row.note)),
      catalogHouse(row.note) ? "1" : "0",
      seen.has(rowId(row)) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
