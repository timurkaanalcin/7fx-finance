/**
 * Carrel slips for a reading-room follow-up, and login seals already stored on a trader.
 * Money fields are not read. Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_carrel_slip (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   keeper text not null default '',
 *   room text not null default '',
 *   cloth text not null default '',
 *   tone text not null default '',
 *   stay_min integer,
 *   shelf integer not null default 2,
 *   tags text not null default '',
 *   pinned boolean not null default false,
 *   held boolean not null default false,
 *   archived boolean not null default false,
 *   ribbon boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_seal_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_seal_review (
 *   trader_id text primary key
 * );
 */

export const CRL_KEY = "crmv4-carrel-slip";
export const CRL_VIEW_KEY = "crmv4-carrel-views";
export const CRL_DENSITY_KEY = "crmv4-carrel-density";
export const LGS_KEY = "crmv4-seal-hide";
export const LGS_REVIEW_KEY = "crmv4-seal-review";

export const CARREL_ROOMS = ["bay", "nook", "ledge", "stack", "mezz", "crown"] as const;

export type CarrelRoom = (typeof CARREL_ROOMS)[number];

export type ClothName = "blank" | "linen" | "velvet" | "wool";

export type ToneName = "blank" | "hush" | "warm" | "bright";

export type SlipTray = "open" | "held" | "archived";

export type SlipDensity = "airy" | "tight";

export type SlipSort = "room" | "keeper";

export type CarrelSlip = {
  id: string;
  title: string;
  note: string;
  keeper: string;
  room: string;
  stay: number | null;
  cloth: string;
  tone: string;
  shelf: number;
  tags: string[];
  pinned: boolean;
  held: boolean;
  archived: boolean;
  ribbon: boolean;
  audit: string;
};

export type CarrelView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  keeper: string;
  cloth: string;
  tone: string;
  room: string;
  stay: string;
  shelf: string;
};

export type SlipCounts = {
  open: number;
  held: number;
  archived: number;
  pinned: number;
  peak: number;
  quiet: number;
  soon: number;
  shelf: number;
  house: number;
  stay: number;
  matched: number;
  ribbon: number;
  idle: number;
  rush: number;
  resting: number;
  overdue: number;
};

export type SealLane = "" | "twin" | "zero" | "low" | "high" | "short" | "full" | "even" | "plain";

export type SealHue = "" | "gilt" | "slate" | "sand" | "clay" | "soot" | "pearl" | "mist";

export type SealState = "" | "clear" | "set";

export type SealShape = "all" | "twin" | "wide" | "bound" | "notch" | "low";

export type SealReview = "all" | "reviewed" | "fresh";

export type SealValue = string | { login?: unknown; accountLoginId?: unknown; [key: string]: unknown } | null | undefined;

export type SealRow = { id: string; label: string; note: SealValue };

export type SealLaneLine = { lane: string; count: number };

const AUDITS = ["save", "edit", "note", "tone", "pin", "unpin", "hold", "resume", "archive", "open", "wool", "tag", "shelf", "stay", "short", "ribbon"] as const;

const CLOTHS = ["linen", "velvet", "wool"] as const;

const TONES = ["hush", "warm", "bright"] as const;

const TONE_CYCLE = ["hush", "warm", "bright"] as const;

const SHELF_CYCLE = [2, 4, 6, 8] as const;

const STAYS = [15, 30, 45] as const;

const PEAK = new Set(["bay", "crown"]);

const QUIET = new Set(["stack"]);

const HOUSE = new Set(["LINEN", "WOOL"]);

const EARLY = new Set(["bay", "nook"]);

const MID = new Set(["ledge", "stack"]);

const LATE = new Set(["mezz", "crown"]);

const LANE_ORDER = ["twin", "zero", "low", "high", "short", "full", "even", "plain"] as const;

const HUE_ORDER = ["gilt", "slate", "sand", "clay", "soot", "pearl", "mist"] as const;

const MONEY_KEYS = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const SLIP_CAP = 8;

const VIEW_CAP = 4;

const TAG_CAP = 3;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SlipTray {
  return raw === "held" || raw === "archived" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function clothName(raw: unknown): Exclude<ClothName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (CLOTHS as readonly string[]).includes(text) ? (text as Exclude<ClothName, "blank">) : "";
}

function toneName(raw: unknown): Exclude<ToneName, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (TONES as readonly string[]).includes(text) ? (text as Exclude<ToneName, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[xyz]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(slip: CarrelSlip, tray: SlipTray): boolean {
  if (tray === "held") return slip.held && !slip.archived;
  if (tray === "archived") return slip.archived;
  return !slip.held && !slip.archived;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function roomIndex(room: string): number {
  return CARREL_ROOMS.indexOf(room as CarrelRoom);
}

function shelfIndex(shelf: number): number {
  return SHELF_CYCLE.indexOf(shelf as (typeof SHELF_CYCLE)[number]);
}

/** A blank title is left out. The saved title stays short. */
export function slipLine(raw: unknown): string {
  return clip(raw, 40);
}

/** A blank note stays blank. It is not filled in. */
export function slipNote(raw: unknown): string {
  return clip(raw, 56);
}

/** A room outside the six carrels is left blank. */
export function roomOf(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  return (CARREL_ROOMS as readonly string[]).includes(text) ? text : "";
}

/** The SLA timer is 15, 30, or 45 minutes. Anything else stays blank. */
export function stayOf(raw: unknown): 15 | 30 | 45 | null {
  const value = Number(clip(raw, 2));
  return (STAYS as readonly number[]).includes(value) ? (value as 15 | 30 | 45) : null;
}

/** Shelf is 2, 4, 6, or 8. Anything else stays blank. */
export function shelfOf(raw: unknown): 2 | 4 | 6 | 8 | null {
  const value = Number(clip(raw, 1));
  return (SHELF_CYCLE as readonly number[]).includes(value) ? (value as 2 | 4 | 6 | 8) : null;
}

/** Cloth is linen, velvet, or wool. The saved cloth is LINEN, VELVET, or WOOL. */
export function clothOf(raw: unknown): string {
  const text = clip(raw, 8).toLowerCase();
  if (text === "linen") return "LINEN";
  if (text === "velvet") return "VELVET";
  if (text === "wool") return "WOOL";
  return "";
}

/** Tone is hush, warm, or bright. A blank tone stays blank. */
export function toneOf(raw: unknown): string {
  return toneName(raw);
}

export function peakRoom(room: unknown): boolean {
  return PEAK.has(roomOf(room));
}

export function quietRoom(room: unknown): boolean {
  return QUIET.has(roomOf(room));
}

/** Early is bay and nook. Mid is ledge and stack. Late is mezz and crown. */
export function roomBand(room: unknown): "early" | "mid" | "late" | "" {
  const name = roomOf(room);
  if (EARLY.has(name)) return "early";
  if (MID.has(name)) return "mid";
  if (LATE.has(name)) return "late";
  return "";
}

/** Steps from the slip room to the desk room. A blank room has no gap. */
export function roomGap(slipRoom: unknown, deskRoom: unknown): number | null {
  const from = roomIndex(roomOf(slipRoom));
  const to = roomIndex(roomOf(deskRoom));
  if (from < 0 || to < 0) return null;
  return to - from;
}

export function houseCloth(cloth: unknown): boolean {
  return HOUSE.has(clothOf(cloth));
}

export function activeRoom(raw: unknown): string {
  const text = clip(raw, 16).toLowerCase();
  if (text === "peak" || text === "quiet") return text;
  return roomOf(text) || "all";
}

export function activeStay(raw: unknown): string {
  const value = stayOf(raw);
  return value === null ? "all" : String(value);
}

export function activeTone(raw: unknown, tones: readonly string[]): string {
  const tone = toneOf(raw);
  return tone && tones.includes(tone) ? tone : "all";
}

export function activeShelf(raw: unknown): string {
  const value = shelfOf(raw);
  return value === null ? "all" : String(value);
}

export function activeCloth(raw: unknown): string {
  const name = clothName(raw);
  return name || "all";
}

export function moveCarrelFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestCloth(slips: readonly CarrelSlip[]): string {
  const counts = new Map<string, number>();
  for (const slip of slips) {
    if (!slip.cloth) continue;
    counts.set(slip.cloth, (counts.get(slip.cloth) || 0) + 1);
  }
  let best = "LINEN";
  let score = 0;
  for (const cloth of ["LINEN", "VELVET", "WOOL"]) {
    const count = counts.get(cloth) || 0;
    if (count > score) {
      best = cloth;
      score = count;
    }
  }
  return best;
}

/** A night desk asks for a short SLA. An evening desk asks for a long one. A tie among saved slips keeps 30. */
export function suggestStay(slips: readonly CarrelSlip[], hour: number): 15 | 30 | 45 {
  const counts = new Map<number, number>();
  for (const slip of slips) {
    if (slip.stay === null) continue;
    counts.set(slip.stay, (counts.get(slip.stay) || 0) + 1);
  }
  let best: 15 | 30 | 45 | null = null;
  let score = 0;
  for (const stay of STAYS) {
    const count = counts.get(stay) || 0;
    if (count > score) {
      best = stay;
      score = count;
    }
  }
  if (best) return best;
  if (hour < 6) return 15;
  if (hour >= 18) return 45;
  return 30;
}

/** The keeper with the fewest open slips. A tie keeps the roster order. */
export function fairKeeper(slips: readonly CarrelSlip[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = slips.filter((slip) => inTray(slip, "open"));
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((slip) => slip.keeper.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readCarrelSlips(raw: unknown): CarrelSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: CarrelSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CarrelSlip>;
    const id = clip(row.id, 40);
    const title = slipLine(row.title);
    if (!id || !title || out.some((slip) => slip.id === id || slip.title === title)) continue;
    out.push({
      id,
      title,
      note: slipNote(row.note),
      keeper: clip(row.keeper, 24),
      room: roomOf(row.room),
      stay: stayOf(row.stay),
      cloth: clothOf(row.cloth),
      tone: toneOf(row.tone),
      shelf: shelfOf(row.shelf) ?? 2,
      tags: tagsOf(row.tags),
      pinned: row.pinned === true,
      held: row.held === true,
      archived: row.archived === true,
      ribbon: row.ribbon === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, SLIP_CAP);
}

export function addCarrelSlip(
  slips: readonly CarrelSlip[],
  slip: {
    id: string;
    title: string;
    note?: string;
    keeper?: string;
    room?: unknown;
    cloth?: string;
    tone?: string;
    stay?: unknown;
    shelf?: unknown;
    tags?: unknown;
  },
): CarrelSlip[] {
  const current = readCarrelSlips(slips);
  const id = clip(slip.id, 40);
  const title = slipLine(slip.title);
  if (!id || !title || current.some((item) => item.id === id || item.title === title)) return current;
  const next: CarrelSlip = {
    id,
    title,
    note: slipNote(slip.note),
    keeper: clip(slip.keeper, 24),
    room: roomOf(slip.room),
    stay: stayOf(slip.stay),
    cloth: clothOf(slip.cloth),
    tone: toneOf(slip.tone),
    shelf: shelfOf(slip.shelf) ?? 2,
    tags: tagsOf(slip.tags),
    pinned: false,
    held: false,
    archived: false,
    ribbon: false,
    audit: "save",
  };
  return [next, ...current].slice(0, SLIP_CAP);
}

function mapSlip(slips: readonly CarrelSlip[], id: string, change: (slip: CarrelSlip) => CarrelSlip): CarrelSlip[] {
  return readCarrelSlips(slips).map((slip) => (slip.id === id ? change(slip) : slip));
}

function touchIds(slips: readonly CarrelSlip[], ids: readonly string[], change: (slip: CarrelSlip) => CarrelSlip): CarrelSlip[] {
  const picked = new Set(ids);
  return readCarrelSlips(slips).map((slip) => (picked.has(slip.id) ? change(slip) : slip));
}

export function editCarrel(slips: readonly CarrelSlip[], id: string, title: string): CarrelSlip[] {
  const next = slipLine(title);
  if (!next) return readCarrelSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.title === next ? slip : { ...slip, title: next, audit: "edit" }));
}

export function editCarrelNote(slips: readonly CarrelSlip[], id: string, note: string): CarrelSlip[] {
  const next = slipNote(note);
  return mapSlip(slips, id, (slip) => (slip.note === next ? slip : { ...slip, note: next, audit: "note" }));
}

export function setSlipPin(slips: readonly CarrelSlip[], id: string, pinned: boolean): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => (slip.pinned === pinned ? slip : { ...slip, pinned, audit: pinned ? "pin" : "unpin" }));
}

export function setSlipHold(slips: readonly CarrelSlip[], id: string, held: boolean): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => (slip.held === held || slip.archived ? slip : { ...slip, held, audit: held ? "hold" : "resume" }));
}

export function setSlipArchive(slips: readonly CarrelSlip[], id: string, archived: boolean): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => (slip.archived === archived ? slip : { ...slip, archived, held: archived ? false : slip.held, audit: archived ? "archive" : "open" }));
}

export function setSlipRibbon(slips: readonly CarrelSlip[], id: string, ribbon: boolean): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => (slip.ribbon === ribbon ? slip : { ...slip, ribbon, audit: "ribbon" }));
}

export function setSlipShelf(slips: readonly CarrelSlip[], id: string, shelf: unknown): CarrelSlip[] {
  const next = shelfOf(shelf);
  if (next === null) return readCarrelSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.shelf === next ? slip : { ...slip, shelf: next, audit: "shelf" }));
}

export function setSlipCloth(slips: readonly CarrelSlip[], id: string, cloth: unknown): CarrelSlip[] {
  const next = clothOf(cloth);
  if (!next) return readCarrelSlips(slips);
  return mapSlip(slips, id, (slip) => (slip.cloth === next ? slip : { ...slip, cloth: next, audit: "wool" }));
}

/** Tone steps hush, warm, bright, then hush again. A blank tone starts at hush. */
export function cycleTone(slips: readonly CarrelSlip[], id: string): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = TONE_CYCLE.indexOf(slip.tone as (typeof TONE_CYCLE)[number]);
    const next = at < 0 ? TONE_CYCLE[0] : TONE_CYCLE[(at + 1) % TONE_CYCLE.length];
    return next === slip.tone ? slip : { ...slip, tone: next, audit: "tone" };
  });
}

export function addCarrelTag(slips: readonly CarrelSlip[], id: string, tag: string): CarrelSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readCarrelSlips(slips);
  return mapSlip(slips, id, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

/** A blank stay becomes 15, 15 becomes 30, and 30 becomes 45. A stay of 45 stays. */
export function lengthenStay(slips: readonly CarrelSlip[], id: string): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.stay === 45) return slip;
    const next = slip.stay === 30 ? 45 : slip.stay === 15 ? 30 : 15;
    return { ...slip, stay: next, audit: "stay" };
  });
}

/** A blank stay becomes 45, 45 becomes 30, and 30 becomes 15. A stay of 15 stays. */
export function shortenStay(slips: readonly CarrelSlip[], id: string): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => {
    if (slip.stay === 15) return slip;
    const next = slip.stay === 30 ? 15 : slip.stay === 45 ? 30 : 45;
    return { ...slip, stay: next, audit: "short" };
  });
}

export function raiseShelf(slips: readonly CarrelSlip[], id: string): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = shelfIndex(slip.shelf);
    const next = at < 0 ? SHELF_CYCLE[0] : SHELF_CYCLE[(at + 1) % SHELF_CYCLE.length];
    return next === slip.shelf ? slip : { ...slip, shelf: next, audit: "shelf" };
  });
}

export function lowerShelf(slips: readonly CarrelSlip[], id: string): CarrelSlip[] {
  return mapSlip(slips, id, (slip) => {
    const at = shelfIndex(slip.shelf);
    const next = at < 0 ? SHELF_CYCLE[0] : SHELF_CYCLE[(at + SHELF_CYCLE.length - 1) % SHELF_CYCLE.length];
    return next === slip.shelf ? slip : { ...slip, shelf: next, audit: "shelf" };
  });
}

function focusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip | undefined {
  const id = shownIds[index];
  return id ? readCarrelSlips(slips).find((item) => item.id === id) : undefined;
}

export function pinFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readCarrelSlips(slips);
  return setSlipPin(slips, slip.id, !slip.pinned);
}

export function holdFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readCarrelSlips(slips);
  return setSlipHold(slips, slip.id, !slip.held);
}

export function toneFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const id = shownIds[index];
  return id ? cycleTone(slips, id) : readCarrelSlips(slips);
}

export function ribbonFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const slip = focusedSlip(slips, shownIds, index);
  if (!slip) return readCarrelSlips(slips);
  return setSlipRibbon(slips, slip.id, !slip.ribbon);
}

export function tagFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number, tag: string): CarrelSlip[] {
  const id = shownIds[index];
  return id ? addCarrelTag(slips, id, tag) : readCarrelSlips(slips);
}

export function raiseFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const id = shownIds[index];
  return id ? raiseShelf(slips, id) : readCarrelSlips(slips);
}

export function lowerFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const id = shownIds[index];
  return id ? lowerShelf(slips, id) : readCarrelSlips(slips);
}

export function lengthenFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const id = shownIds[index];
  return id ? lengthenStay(slips, id) : readCarrelSlips(slips);
}

export function shortenFocusedSlip(slips: readonly CarrelSlip[], shownIds: readonly string[], index: number): CarrelSlip[] {
  const id = shownIds[index];
  return id ? shortenStay(slips, id) : readCarrelSlips(slips);
}

export function bulkCarrelPin(slips: readonly CarrelSlip[], ids: readonly string[]): CarrelSlip[] {
  return touchIds(slips, ids, (slip) => (slip.pinned ? slip : { ...slip, pinned: true, audit: "pin" }));
}

export function bulkCarrelArchive(slips: readonly CarrelSlip[], ids: readonly string[]): CarrelSlip[] {
  return touchIds(slips, ids, (slip) => (slip.archived ? slip : { ...slip, archived: true, held: false, audit: "archive" }));
}

export function bulkCarrelBright(slips: readonly CarrelSlip[], ids: readonly string[]): CarrelSlip[] {
  return touchIds(slips, ids, (slip) => (slip.tone === "bright" ? slip : { ...slip, tone: "bright", audit: "tone" }));
}

export function bulkCarrelTag(slips: readonly CarrelSlip[], ids: readonly string[], tag: string): CarrelSlip[] {
  const next = tagsOf(tag)[0];
  if (!next) return readCarrelSlips(slips);
  return touchIds(slips, ids, (slip) => {
    if (slip.tags.includes(next) || slip.tags.length >= TAG_CAP) return slip;
    return { ...slip, tags: [...slip.tags, next], audit: "tag" };
  });
}

export function bulkCarrelWool(slips: readonly CarrelSlip[], ids: readonly string[], cloth: unknown): CarrelSlip[] {
  const next = clothOf(cloth);
  if (!next) return readCarrelSlips(slips);
  return touchIds(slips, ids, (slip) => (slip.cloth === next ? slip : { ...slip, cloth: next, audit: "wool" }));
}

export function readCarrelViews(raw: unknown): CarrelView[] {
  if (!Array.isArray(raw)) return [];
  const out: CarrelView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<CarrelView>;
    const id = clip(row.id, 40);
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      keeper: clip(row.keeper, 24),
      cloth: activeCloth(row.cloth),
      tone: activeTone(row.tone, TONES),
      room: activeRoom(row.room),
      stay: activeStay(row.stay),
      shelf: activeShelf(row.shelf),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addCarrelView(
  views: readonly CarrelView[],
  view: {
    id: string;
    name: string;
    tray?: unknown;
    query?: string;
    keeper?: string;
    cloth?: string;
    tone?: string;
    room?: string;
    stay?: string;
    shelf?: string;
  },
): CarrelView[] {
  const current = readCarrelViews(views);
  const id = clip(view.id, 40);
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  const next: CarrelView = {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 40),
    keeper: clip(view.keeper, 24),
    cloth: activeCloth(view.cloth),
    tone: activeTone(view.tone, TONES),
    room: activeRoom(view.room),
    stay: activeStay(view.stay),
    shelf: activeShelf(view.shelf),
  };
  return [next, ...current].slice(0, VIEW_CAP);
}

export function dropCarrelView(views: readonly CarrelView[], id: string): CarrelView[] {
  return readCarrelViews(views).filter((view) => view.id !== id);
}

export function carrelDensity(raw: unknown): SlipDensity {
  return raw === "tight" ? "tight" : "airy";
}

export function carrelSort(raw: unknown): SlipSort {
  return raw === "keeper" ? "keeper" : "room";
}

export function lateSlip(slip: CarrelSlip, deskRoom: unknown): boolean {
  const gap = roomGap(slip.room, deskRoom);
  return gap !== null && gap > 0;
}

export function idleSlip(slip: CarrelSlip): boolean {
  return slip.tone === "hush" && quietRoom(slip.room) && slip.shelf === 2;
}

export function rushSlip(slip: CarrelSlip): boolean {
  return slip.shelf === 6 && slip.tone === "bright" && peakRoom(slip.room);
}

export function restingSlip(slip: CarrelSlip): boolean {
  return slip.stay === 45 && slip.tone === "warm" && !slip.ribbon;
}

/** A fifteen-minute stay on a peak room is overdue unless the slip is pinned. */
export function overdueSlip(slip: CarrelSlip): boolean {
  return slip.stay === 15 && peakRoom(slip.room) && !slip.pinned;
}

export function visibleCarrel(
  slips: readonly CarrelSlip[],
  tray: SlipTray,
  query: string,
  keeper: string,
  cloth: string,
  tone: string,
  room: string,
  stay: string,
  shelf: string,
  houseOnly: boolean,
  peakOnly: boolean,
  quietOnly: boolean,
): CarrelSlip[] {
  const text = query.trim().toLowerCase();
  const keeperOn = keeper === "all" ? "" : keeper.trim().toLowerCase();
  const clothOn = cloth === "all" ? "" : clothOf(cloth);
  const toneOn = tone === "all" ? "" : toneOf(tone);
  const roomOn = room === "all" ? "" : activeRoom(room);
  const stayOn = stay === "all" ? "" : activeStay(stay);
  const shelfOn = shelf === "all" ? "" : activeShelf(shelf);
  return readCarrelSlips(slips).filter((slip) => {
    if (!inTray(slip, tray)) return false;
    if (text && !`${slip.title} ${slip.note}`.toLowerCase().includes(text)) return false;
    if (keeperOn && slip.keeper.toLowerCase() !== keeperOn) return false;
    if (clothOn && slip.cloth !== clothOn) return false;
    if (toneOn && slip.tone !== toneOn) return false;
    if (roomOn === "peak" && !peakRoom(slip.room)) return false;
    if (roomOn === "quiet" && !quietRoom(slip.room)) return false;
    if (roomOn && roomOn !== "peak" && roomOn !== "quiet" && slip.room !== roomOn) return false;
    if (stayOn && String(slip.stay ?? "") !== stayOn) return false;
    if (shelfOn && String(slip.shelf) !== shelfOn) return false;
    if (houseOnly && !houseCloth(slip.cloth)) return false;
    if (peakOnly && !peakRoom(slip.room)) return false;
    if (quietOnly && !quietRoom(slip.room)) return false;
    return true;
  });
}

export function sortCarrel(slips: readonly CarrelSlip[], sort: SlipSort): CarrelSlip[] {
  return slips.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "keeper") {
      const keeper = a.keeper.localeCompare(b.keeper);
      if (keeper) return keeper;
    }
    const room = (roomIndex(a.room) < 0 ? 99 : roomIndex(a.room)) - (roomIndex(b.room) < 0 ? 99 : roomIndex(b.room));
    if (room) return room;
    return a.title.localeCompare(b.title);
  });
}

export function carrelCounts(slips: readonly CarrelSlip[], shown: readonly CarrelSlip[], deskRoom: unknown): SlipCounts {
  const open = slips.filter((slip) => inTray(slip, "open"));
  void shown;
  return {
    open: open.length,
    held: slips.filter((slip) => inTray(slip, "held")).length,
    archived: slips.filter((slip) => inTray(slip, "archived")).length,
    pinned: open.filter((slip) => slip.pinned).length,
    peak: open.filter((slip) => peakRoom(slip.room)).length,
    quiet: open.filter((slip) => quietRoom(slip.room)).length,
    soon: open.filter((slip) => slip.stay === 15).length,
    shelf: open.reduce((sum, slip) => sum + slip.shelf, 0),
    house: open.filter((slip) => houseCloth(slip.cloth)).length,
    stay: open.filter((slip) => slip.stay !== null).length,
    matched: open.filter((slip) => slip.room && slip.room === roomOf(deskRoom)).length,
    ribbon: open.filter((slip) => slip.ribbon).length,
    idle: open.filter((slip) => idleSlip(slip)).length,
    rush: open.filter((slip) => rushSlip(slip)).length,
    resting: open.filter((slip) => restingSlip(slip)).length,
    overdue: open.filter((slip) => overdueSlip(slip)).length,
  };
}

export function carrelShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function clashRoomCount(slips: readonly CarrelSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.room === slip.room && other.shelf === slip.shelf)).length;
}

export function stayClashCount(slips: readonly CarrelSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.room && slip.stay !== null);
  return open.filter((slip) => open.some((other) => other.id !== slip.id && other.room === slip.room && other.stay === slip.stay)).length;
}

export function neighborSlipCount(slips: readonly CarrelSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && shelfIndex(slip.shelf) >= 0);
  return open.filter((slip) => open.some((other) => {
    if (other.id === slip.id) return false;
    const gap = Math.abs(shelfIndex(other.shelf) - shelfIndex(slip.shelf));
    const ring = Math.min(gap, SHELF_CYCLE.length - gap);
    return ring === 1;
  })).length;
}

export function busiestKeeper(slips: readonly CarrelSlip[]): string {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.keeper);
  let best = "";
  let score = 0;
  for (const slip of open) {
    const count = open.filter((item) => item.keeper.toLowerCase() === slip.keeper.toLowerCase()).length;
    if (count > score) {
      best = slip.keeper;
      score = count;
    }
  }
  return best;
}

export function pairKeeperCount(slips: readonly CarrelSlip[]): number {
  const open = slips.filter((slip) => inTray(slip, "open") && slip.keeper);
  return open.filter((slip) => open.filter((item) => item.keeper.toLowerCase() === slip.keeper.toLowerCase()).length >= 2).length;
}

export function shelfLoad(slips: readonly CarrelSlip[]): number {
  return slips.filter((slip) => inTray(slip, "open")).reduce((sum, slip) => sum + slip.shelf, 0);
}

export function reminderSlips(slips: readonly CarrelSlip[]): CarrelSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && overdueSlip(slip));
}

export function idleSlips(slips: readonly CarrelSlip[]): CarrelSlip[] {
  return slips.filter((slip) => inTray(slip, "open") && idleSlip(slip));
}

export function matchedSlips(slips: readonly CarrelSlip[], deskRoom: unknown): CarrelSlip[] {
  const room = roomOf(deskRoom);
  if (!room) return [];
  return slips.filter((slip) => inTray(slip, "open") && slip.room === room);
}

export function nextSlip(slips: readonly CarrelSlip[], id: string): CarrelSlip | null {
  const open = sortCarrel(slips.filter((slip) => inTray(slip, "open")), "room");
  const at = open.findIndex((slip) => slip.id === id);
  if (at < 0) return null;
  return open[at + 1] || null;
}

export function carrelTimeline(slips: readonly CarrelSlip[]): { shelf: number; titles: string[] }[] {
  const open = slips.filter((slip) => inTray(slip, "open"));
  return SHELF_CYCLE.map((shelf) => ({ shelf, titles: open.filter((slip) => slip.shelf === shelf).map((slip) => slip.title) })).filter((lane) => lane.titles.length);
}

export function carrelKeepers(slips: readonly CarrelSlip[]): string[] {
  const out: string[] = [];
  for (const slip of slips) {
    if (!slip.keeper || out.some((item) => item.toLowerCase() === slip.keeper.toLowerCase())) continue;
    out.push(slip.keeper);
  }
  return out;
}

export function carrelCopy(slip: CarrelSlip): string {
  return [slip.title, slip.keeper, slip.room, slip.cloth, slip.tone, slip.stay ?? "", slip.shelf, slip.note].filter((item) => item !== "").join(" · ");
}

export function carrelCsv(slips: readonly CarrelSlip[], deskRoom: unknown): string {
  const lines = ["title,keeper,room,cloth,tone,stay,shelf,tags,pinned,held,archived,ribbon,gap,late,idle,peak,quiet,house,band,rush,resting,overdue,audit,note"];
  for (const slip of readCarrelSlips(slips)) {
    const gap = roomGap(slip.room, deskRoom);
    lines.push([
      csvCell(slip.title),
      csvCell(slip.keeper),
      slip.room,
      slip.cloth,
      slip.tone,
      slip.stay === null ? "" : String(slip.stay),
      String(slip.shelf),
      slip.tags.join(" "),
      slip.pinned ? "1" : "0",
      slip.held ? "1" : "0",
      slip.archived ? "1" : "0",
      slip.ribbon ? "1" : "0",
      gap === null ? "" : String(gap),
      lateSlip(slip, deskRoom) ? "1" : "0",
      idleSlip(slip) ? "1" : "0",
      peakRoom(slip.room) ? "1" : "0",
      quietRoom(slip.room) ? "1" : "0",
      houseCloth(slip.cloth) ? "1" : "0",
      roomBand(slip.room),
      rushSlip(slip) ? "1" : "0",
      restingSlip(slip) ? "1" : "0",
      overdueSlip(slip) ? "1" : "0",
      slip.audit,
      csvCell(slip.note),
    ].join(","));
  }
  return lines.join("\n");
}

function sealRecord(raw: SealValue): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? raw : null;
}

function sealText(raw: SealValue): string {
  if (typeof raw === "string") return raw.trim();
  const row = sealRecord(raw);
  if (!row) return "";
  return clip(row.accountLoginId ?? row.login, 24);
}

function hasMoney(raw: SealValue): boolean {
  const row = sealRecord(raw);
  if (!row) return false;
  return MONEY_KEYS.some((key) => row[key] != null && row[key] !== "");
}

function digitsOf(raw: SealValue): string {
  const text = sealText(raw).replace(/[\s-]/g, "");
  if (!/^\d{6,16}$/.test(text)) return "";
  return text;
}

/** A money field clears the seal. Six to sixteen digits are set. A short or broken id is clear. */
export function sealState(raw: SealValue): SealState {
  if (hasMoney(raw)) return "";
  return digitsOf(raw) ? "set" : "clear";
}

/** The first two digits plus the length. 12345678 is 128. */
export function sealStamp(raw: SealValue): string {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  if (!digits) return "";
  return `${digits.slice(0, 2)}${digits.length}`;
}

/** A doubled pair wins, then a zero, then a low or high start, then length, then an even sum. */
export function sealLane(raw: SealValue): SealLane {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  if (!digits) return "";
  if (/(\d)\1/.test(digits)) return "twin";
  if (digits.includes("0")) return "zero";
  const head = digits[0];
  if (head === "1" || head === "2" || head === "3") return "low";
  if (head === "7" || head === "8" || head === "9") return "high";
  if (digits.length <= 8) return "short";
  if (digits.length >= 16) return "full";
  const sum = digits.split("").reduce((total, digit) => total + Number(digit), 0);
  if (sum % 2 === 0) return "even";
  return "plain";
}

/** Hue follows the last digit. Six through nine are mist. */
export function sealHue(raw: SealValue): SealHue {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  if (!digits) return "";
  const last = digits[digits.length - 1];
  if (last === "0") return "gilt";
  if (last === "1") return "slate";
  if (last === "2") return "sand";
  if (last === "3") return "clay";
  if (last === "4") return "soot";
  if (last === "5") return "pearl";
  return "mist";
}

export function sealBound(raw: SealValue): boolean {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  return Boolean(digits && (digits.startsWith("1") || digits.startsWith("7")));
}

export function sealWide(raw: SealValue): boolean {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  return Boolean(digits && digits.length >= 12);
}

export function sealNotch(raw: SealValue): boolean {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  return Boolean(digits && digits.includes("0"));
}

export function sealStep(raw: SealValue): number {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  if (!digits) return 0;
  return Math.min(6, new Set(digits.split("")).size);
}

export function sealJoin(raw: SealValue): boolean {
  const digits = sealState(raw) === "set" ? digitsOf(raw) : "";
  return Boolean(digits && /(\d)\1\1/.test(digits));
}

export function sealLanes(rows: readonly SealRow[]): SealLaneLine[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const lane = sealLane(row.note);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return LANE_ORDER.filter((lane) => counts.has(lane)).map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingSeal(rows: readonly SealRow[]): string {
  const bars = sealLanes(rows);
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || LANE_ORDER.indexOf(a.lane as (typeof LANE_ORDER)[number]) - LANE_ORDER.indexOf(b.lane as (typeof LANE_ORDER)[number]))[0].lane;
}

export function leadingSealHue(rows: readonly SealRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const hue = sealHue(row.note);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const bars = HUE_ORDER.filter((hue) => counts.has(hue)).map((hue) => ({ hue, count: counts.get(hue) || 0 }));
  if (!bars.length) return "";
  return bars.slice().sort((a, b) => b.count - a.count || HUE_ORDER.indexOf(a.hue) - HUE_ORDER.indexOf(b.hue))[0].hue;
}

export function sharedSealCount(rows: readonly SealRow[]): number {
  const marks = rows.map((row) => sealStamp(row.note)).filter(Boolean);
  return marks.filter((mark) => marks.filter((item) => item === mark).length >= 2).length;
}

export function laneSealCount(rows: readonly SealRow[], lane: SealLane): number {
  return rows.filter((row) => sealLane(row.note) === lane).length;
}

export function hueSealCount(rows: readonly SealRow[], hue: SealHue): number {
  return rows.filter((row) => sealHue(row.note) === hue).length;
}

export function sealShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentSealLanes(rows: readonly SealRow[]): string[] {
  return sealLanes(rows).map((line) => line.lane);
}

export function readHiddenSeals(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const lane = clip(item, 12);
    if (!allow.has(lane) || out.includes(lane)) continue;
    out.push(lane);
  }
  return out;
}

export function readReviewedSeals(raw: unknown, ids: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const allow = new Set(ids);
  const out: string[] = [];
  for (const item of raw) {
    const id = clip(item, 40);
    if (!allow.has(id) || out.includes(id)) continue;
    out.push(id);
  }
  return out;
}

export function toggleSeal(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleSealReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkSealReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleSealLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

export function visibleSeals(
  rows: readonly SealRow[],
  lane: string,
  hue: string,
  query: string,
  review: SealReview,
  reviewed: readonly string[],
  shape: SealShape,
): SealRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (sealState(row.note) === "") return false;
    const found = sealLane(row.note);
    const hueName = sealHue(row.note);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${sealText(row.note)} ${sealStamp(row.note)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    if (shape === "twin" && found !== "twin") return false;
    if (shape === "wide" && !sealWide(row.note)) return false;
    if (shape === "bound" && !sealBound(row.note)) return false;
    if (shape === "notch" && !sealNotch(row.note)) return false;
    if (shape === "low" && found !== "low") return false;
    return true;
  });
}

export function sealCopy(raw: SealValue): string {
  return [sealStamp(raw), sealLane(raw), sealHue(raw)].filter(Boolean).join(" ");
}

export function sealLanesCsv(rows: readonly SealRow[]): string {
  const lines = ["lane,count"];
  for (const line of sealLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function sealRowsCsv(rows: readonly SealRow[], reviewed: readonly string[]): string {
  const lines = ["login,seal,lane,hue,step,join,wide,notch,bound,twin,zero,low,high,short,full,even,plain,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (sealState(row.note) !== "set") continue;
    const lane = sealLane(row.note);
    lines.push([
      csvCell(sealText(row.note)),
      sealStamp(row.note),
      lane,
      sealHue(row.note),
      String(sealStep(row.note)),
      sealJoin(row.note) ? "1" : "0",
      sealWide(row.note) ? "1" : "0",
      sealNotch(row.note) ? "1" : "0",
      sealBound(row.note) ? "1" : "0",
      lane === "twin" ? "1" : "0",
      lane === "zero" ? "1" : "0",
      lane === "low" ? "1" : "0",
      lane === "high" ? "1" : "0",
      lane === "short" ? "1" : "0",
      lane === "full" ? "1" : "0",
      lane === "even" ? "1" : "0",
      lane === "plain" ? "1" : "0",
      seen.has(row.id) ? "1" : "0",
    ].join(","));
  }
  return lines.join("\n");
}
