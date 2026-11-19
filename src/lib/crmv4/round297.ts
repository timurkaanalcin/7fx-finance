/**
 * Dioptra sights for a survey kept in this browser, and email plates read the address already stored on the account.
 * Bearings are north, east, south, and west. Finish is chalk, ink, and bronze.
 * Altitudes are 15, 30, 45, or 60. Vanes are 1, 3, or 5.
 * A spark mailbox has a local part of two characters or shorter. A plus address contains +. An alias contains a separator.
 * A house uses a public mailbox. A nest has a subdomain. Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_dioptra (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   surveyor text not null default '',
 *   bearing text not null default '',
 *   finish text not null default '',
 *   altitude_no integer,
 *   vane_no integer not null default 1,
 *   tags text not null default '',
 *   aligned boolean not null default false,
 *   cased boolean not null default false,
 *   vaulted boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_email_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_email_review (
 *   trader_id text primary key
 * );
 */

export const DPT_KEY = "crmv4-dioptra";
export const DPT_VIEW_KEY = "crmv4-dioptra-views";
export const DPT_DENSITY_KEY = "crmv4-dioptra-density";
export const DIOPTRA_BEARINGS = ["north", "east", "south", "west"] as const;

export type DioptraBearing = (typeof DIOPTRA_BEARINGS)[number];

export type DioptraFinish = "blank" | "chalk" | "ink" | "bronze";

export type DioptraTray = "bench" | "case" | "vault";

export type DioptraDensity = "wide" | "narrow";

export type DioptraSort = "bearing" | "surveyor";

export type Dioptra = {
  id: string;
  title: string;
  note: string;
  surveyor: string;
  bearing: string;
  altitude: number | null;
  finish: string;
  vane: number;
  tags: string[];
  aligned: boolean;
  cased: boolean;
  vaulted: boolean;
  flagged: boolean;
  audit: string;
};

export type DioptraView = {
  id: string;
  name: string;
  tray: DioptraTray;
  query: string;
  surveyor: string;
  finish: string;
  bearing: string;
  altitude: string;
  vane: string;
};

export type DioptraCounts = {
  bench: number;
  case: number;
  vault: number;
  aligned: number;
  inner: number;
  outer: number;
  high: number;
  house: number;
  altitude: number;
  matched: number;
  flagged: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND297_FEATURES = [
  "save",
  "note",
  "trays",
  "finish",
  "altitude",
  "vault",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "sort",
  "kpis",
  "chart",
  "timeline",
  "bulk",
  "csv",
  "keys",
  "audit",
  "fair-surveyor",
  "viewer",
  "suggest",
  "sla",
  "email",
  "email-csv",
] as const;

const AUDITS = ["save", "edit", "note", "finish", "align", "clear", "case", "resume", "vault", "open", "tag", "vane", "altitude", "lower", "star"] as const;

const FINISHES = ["chalk", "ink", "bronze"] as const;

const ALTITUDE_CYCLE = [15, 30, 45, 60] as const;

const VANE_CYCLE = [1, 3, 5] as const;

const INNER = new Set(["north", "east"]);

const OUTER = new Set(["south", "west"]);

const HOUSE_FINISH = new Set(["INK", "BRONZE"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

const PUBLIC_HOUSE = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): DioptraTray {
  return raw === "case" || raw === "vault" ? raw : "bench";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function finishName(raw: unknown): Exclude<DioptraFinish, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FINISHES as readonly string[]).includes(text) ? (text as Exclude<DioptraFinish, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[ns]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Dioptra, tray: DioptraTray): boolean {
  if (tray === "case") return card.cased && !card.vaulted;
  if (tray === "vault") return card.vaulted;
  return !card.cased && !card.vaulted;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function bearingIndex(bearing: string): number {
  return DIOPTRA_BEARINGS.indexOf(bearing as DioptraBearing);
}

function altitudeIndex(altitude: number): number {
  return ALTITUDE_CYCLE.indexOf(altitude as (typeof ALTITUDE_CYCLE)[number]);
}

function vaneIndex(vane: number): number {
  return VANE_CYCLE.indexOf(vane as (typeof VANE_CYCLE)[number]);
}

function lineOf(raw: unknown): string {
  return clip(raw, 48);
}

function noteOf(raw: unknown): string {
  return clip(raw, 80);
}

function wholeToken(raw: unknown): string {
  return String(raw ?? "").trim();
}

export function dioptraBearing(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (DIOPTRA_BEARINGS as readonly string[]).includes(text) ? text : "";
}

/** An altitude is 15, 30, 45, or 60. Anything else stays blank. */
export function dioptraAltitude(raw: unknown): 15 | 30 | 45 | 60 | null {
  const text = wholeToken(raw);
  if (text !== "15" && text !== "30" && text !== "45" && text !== "60") return null;
  return Number(text) as 15 | 30 | 45 | 60;
}

/** A vane is 1, 3, or 5. Anything else stays blank. */
export function dioptraVane(raw: unknown): 1 | 3 | 5 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "3" && text !== "5") return null;
  return Number(text) as 1 | 3 | 5;
}

/** Finish is chalk, ink, or bronze. The saved name is the upper token. */
export function dioptraFinish(raw: unknown): string {
  const text = finishName(raw);
  return text ? text.toUpperCase() : "";
}

export function innerBearing(bearing: unknown): boolean {
  return INNER.has(clip(bearing, 12).toLowerCase());
}

export function outerBearing(bearing: unknown): boolean {
  return OUTER.has(clip(bearing, 12).toLowerCase());
}

/** North is the pole. East is dawn. South is the meridian. West is dusk. */
export function dioptraBand(bearing: unknown): string {
  const text = dioptraBearing(bearing);
  if (!text) return "";
  if (text === "north") return "pole";
  if (text === "east") return "dawn";
  if (text === "south") return "meridian";
  return "dusk";
}

/** Signed distance from one bearing to another around the circle order. */
export function bearingGap(from: unknown, to: unknown): number | null {
  const left = bearingIndex(dioptraBearing(from));
  const right = bearingIndex(dioptraBearing(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseFinish(finish: unknown): boolean {
  return HOUSE_FINISH.has(dioptraFinish(finish));
}

/** A pair vane is 3. One and five are not a pair. */
export function pairVane(vane: unknown): boolean {
  return dioptraVane(vane) === 3;
}

/** A full vane is 5. */
export function fullVane(vane: unknown): boolean {
  return dioptraVane(vane) === 5;
}

export function activeBearing(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return dioptraBearing(text) || "all";
}

export function activeAltitude(raw: unknown): string {
  const altitude = dioptraAltitude(raw);
  return altitude === null ? "all" : String(altitude);
}

export function activeFinish(raw: unknown, allow: readonly string[]): string {
  const text = dioptraFinish(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeVane(raw: unknown): string {
  const vane = dioptraVane(raw);
  return vane === null ? "all" : String(vane);
}

export function moveDioptraFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

export function suggestDioptraFinish(cards: readonly Dioptra[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || !card.finish) continue;
    counts.set(card.finish, (counts.get(card.finish) || 0) + 1);
  }
  let best = "CHALK";
  let score = 0;
  for (const finish of ["CHALK", "INK", "BRONZE"]) {
    const count = counts.get(finish) || 0;
    if (count > score) {
      best = finish;
      score = count;
    }
  }
  return best;
}

/** Before eight, suggest fifteen. Through early afternoon, thirty. Late afternoon asks for forty-five. Evening asks for sixty. Saved altitudes win when any exist. */
export function suggestAltitude(cards: readonly Dioptra[], hour: number): 15 | 30 | 45 | 60 {
  const counts = new Map<number, number>();
  for (const card of cards) {
    if (!inTray(card, "bench") || card.altitude === null) continue;
    counts.set(card.altitude, (counts.get(card.altitude) || 0) + 1);
  }
  let best: 15 | 30 | 45 | 60 | null = null;
  let score = 0;
  for (const altitude of ALTITUDE_CYCLE) {
    const count = counts.get(altitude) || 0;
    if (count > score) {
      best = altitude;
      score = count;
    }
  }
  if (best !== null) return best;
  if (hour < 8) return 15;
  if (hour < 14) return 30;
  if (hour < 19) return 45;
  return 60;
}

/** Before noon, suggest north. The rest of the day suggests west. */
export function suggestBearing(hour: number): DioptraBearing {
  return hour < 12 ? "north" : "west";
}

/** The surveyor with the fewest unaligned sights on the bench. A tie keeps the roster order. */
export function fairDioptraSurveyor(cards: readonly Dioptra[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "bench") && !card.aligned);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.surveyor.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readDioptras(raw: unknown): Dioptra[] {
  if (!Array.isArray(raw)) return [];
  const out: Dioptra[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Dioptra>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      surveyor: clip(row.surveyor, 24),
      bearing: dioptraBearing(row.bearing),
      altitude: dioptraAltitude(row.altitude),
      finish: dioptraFinish(row.finish),
      vane: dioptraVane(row.vane) ?? 1,
      tags: tagsOf(row.tags),
      aligned: row.aligned === true,
      cased: row.cased === true,
      vaulted: row.vaulted === true,
      flagged: row.flagged === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addDioptra(
  cards: readonly Dioptra[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    surveyor?: string;
    bearing?: string;
    altitude?: unknown;
    finish?: string;
    vane?: unknown;
    tags?: unknown;
  },
): Dioptra[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `n${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readDioptras([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      surveyor: clip(card.surveyor, 24),
      bearing: dioptraBearing(card.bearing),
      altitude: dioptraAltitude(card.altitude),
      finish: dioptraFinish(card.finish),
      vane: dioptraVane(card.vane) ?? 1,
      tags: tagsOf(card.tags),
      aligned: false,
      cased: false,
      vaulted: false,
      flagged: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Dioptra[], id: string, edit: (card: Dioptra) => Dioptra): Dioptra[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editDioptra(cards: readonly Dioptra[], id: string, title: string): Dioptra[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editDioptraNote(cards: readonly Dioptra[], id: string, note: string): Dioptra[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleFinish(finish: string): string {
  const order = ["", "CHALK", "INK", "BRONZE"];
  const index = order.indexOf(dioptraFinish(finish));
  return order[(index + 1) % order.length] || "CHALK";
}

export function setDioptraFinish(cards: readonly Dioptra[], id: string, finish: string): Dioptra[] {
  const next = dioptraFinish(finish);
  return mapCard(cards, id, (card) => (card.finish === next ? card : { ...card, finish: next, audit: "finish" }));
}

export function setDioptraAligned(cards: readonly Dioptra[], id: string, aligned: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.aligned === aligned ? card : { ...card, aligned, audit: aligned ? "align" : "clear" }));
}

export function setDioptraCase(cards: readonly Dioptra[], id: string, cased: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.cased === cased ? card : { ...card, cased, vaulted: cased ? false : card.vaulted, audit: cased ? "case" : "resume" }));
}

export function setDioptraVault(cards: readonly Dioptra[], id: string, vaulted: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.vaulted === vaulted ? card : { ...card, vaulted, cased: vaulted ? false : card.cased, audit: vaulted ? "vault" : "open" }));
}

export function setDioptraStar(cards: readonly Dioptra[], id: string, flagged: boolean): Dioptra[] {
  return mapCard(cards, id, (card) => (card.flagged === flagged ? card : { ...card, flagged, audit: "star" }));
}

export function addDioptraTag(cards: readonly Dioptra[], id: string, tag: string): Dioptra[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepAltitude(altitude: number | null, dir: 1 | -1): 15 | 30 | 45 | 60 {
  if (altitude === null) return dir > 0 ? 15 : 60;
  const index = altitudeIndex(altitude);
  const next = index < 0 ? 0 : (index + dir + ALTITUDE_CYCLE.length) % ALTITUDE_CYCLE.length;
  return ALTITUDE_CYCLE[next];
}

function stepVane(vane: number, dir: 1 | -1): 1 | 3 | 5 {
  const index = vaneIndex(vane);
  const next = index < 0 ? 0 : (index + dir + VANE_CYCLE.length) % VANE_CYCLE.length;
  return VANE_CYCLE[next];
}

export function liftAltitude(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, altitude: stepAltitude(card.altitude, 1), audit: "altitude" }));
}

export function lowerAltitude(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, altitude: stepAltitude(card.altitude, -1), audit: "lower" }));
}

export function raiseVane(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, 1), audit: "vane" }));
}

export function lowerVane(cards: readonly Dioptra[], id: string): Dioptra[] {
  return mapCard(cards, id, (card) => ({ ...card, vane: stepVane(card.vane, -1), audit: "vane" }));
}

function focused(cards: readonly Dioptra[], id: string, edit: (card: Dioptra) => Dioptra): Dioptra[] {
  return id ? mapCard(cards, id, edit) : [...cards];
}

export function alignDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return focused(cards, id, (card) => ({ ...card, aligned: !card.aligned, audit: card.aligned ? "clear" : "align" }));
}

export function caseDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return setDioptraCase(cards, id, !cards.find((card) => card.id === id)?.cased);
}

export function starDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return setDioptraStar(cards, id, !cards.find((card) => card.id === id)?.flagged);
}

export function tagDioptraFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return addDioptraTag(cards, id, "n");
}

export function finishFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  const card = cards.find((item) => item.id === id);
  return card ? setDioptraFinish(cards, id, cycleFinish(card.finish)) : [...cards];
}

export function liftAltitudeFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return liftAltitude(cards, id);
}

export function lowerAltitudeFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return lowerAltitude(cards, id);
}

export function raiseVaneFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return raiseVane(cards, id);
}

export function lowerVaneFocused(cards: readonly Dioptra[], id: string): Dioptra[] {
  return lowerVane(cards, id);
}

function bulk(cards: readonly Dioptra[], ids: readonly string[], edit: (card: Dioptra) => Dioptra): Dioptra[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkDioptraBronze(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.finish === "BRONZE" ? card : { ...card, finish: "BRONZE", audit: "finish" }));
}

export function bulkDioptraAlign(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.aligned ? card : { ...card, aligned: true, audit: "align" }));
}

export function bulkDioptraVault(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.vaulted ? card : { ...card, vaulted: true, cased: false, audit: "vault" }));
}

export function bulkDioptraTag(cards: readonly Dioptra[], ids: readonly string[]): Dioptra[] {
  return bulk(cards, ids, (card) => (card.tags.includes("s") ? card : { ...card, tags: tagsOf([...card.tags, "s"]), audit: "tag" }));
}

export function readDioptraViews(raw: unknown): DioptraView[] {
  if (!Array.isArray(raw)) return [];
  const out: DioptraView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DioptraView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      surveyor: clip(row.surveyor, 24),
      finish: activeFinish(row.finish, ["CHALK", "INK", "BRONZE"]),
      bearing: activeBearing(row.bearing),
      altitude: activeAltitude(row.altitude),
      vane: activeVane(row.vane),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addDioptraView(views: readonly DioptraView[], view: DioptraView): DioptraView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readDioptraViews([...views, { ...view, id, name }]);
}

export function dropDioptraView(views: readonly DioptraView[], id: string): DioptraView[] {
  return views.filter((view) => view.id !== id);
}

export function dioptraDensity(raw: unknown): DioptraDensity {
  return raw === "narrow" ? "narrow" : "wide";
}

export function sortDioptras(cards: readonly Dioptra[], sort: DioptraSort): Dioptra[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "surveyor") {
      const surveyor = a.surveyor.localeCompare(b.surveyor);
      if (surveyor) return surveyor;
    } else {
      const bearing = bearingIndex(a.bearing) - bearingIndex(b.bearing);
      if (bearing) return bearing;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleDioptras(
  cards: readonly Dioptra[],
  tray: DioptraTray,
  query: string,
  surveyor: string,
  finish: string,
  bearing: string,
  altitude: string,
  vane: string,
): Dioptra[] {
  const text = query.trim().toLowerCase();
  const wantReader = clip(surveyor, 24).toLowerCase();
  const wantFinish = finish === "all" ? "" : dioptraFinish(finish);
  const wantBearing = activeBearing(bearing);
  const wantAltitude = activeAltitude(altitude);
  const wantVane = activeVane(vane);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.surveyor}`.toLowerCase().includes(text)) return false;
    if (wantReader && card.surveyor.toLowerCase() !== wantReader) return false;
    if (wantFinish && card.finish !== wantFinish) return false;
    if (wantBearing === "inner" && !innerBearing(card.bearing)) return false;
    if (wantBearing === "outer" && !outerBearing(card.bearing)) return false;
    if (wantBearing !== "all" && wantBearing !== "inner" && wantBearing !== "outer" && card.bearing !== wantBearing) return false;
    if (wantAltitude !== "all" && String(card.altitude ?? "") !== wantAltitude) return false;
    if (wantVane !== "all" && String(card.vane) !== wantVane) return false;
    return true;
  });
}

/** An outer bearing on vane one, still unaligned and not in the vault, is overdue. */
export function overdueDioptra(card: Dioptra): boolean {
  return outerBearing(card.bearing) && card.vane === 1 && !card.aligned && !card.vaulted;
}

/** No finish, the low altitude, vane one, and still on the bench. */
export function idleDioptra(card: Dioptra): boolean {
  return !card.finish && card.altitude === 15 && card.vane === 1 && !card.aligned && !card.cased && !card.vaulted;
}

/** Bronze, a high altitude, and a full vane, still out of the vault. */
export function briskDioptra(card: Dioptra): boolean {
  return card.finish === "BRONZE" && card.altitude === 60 && card.vane === 5 && !card.vaulted;
}

/** West, chalk, and a middle altitude. */
export function restingDioptra(card: Dioptra): boolean {
  return card.bearing === "west" && card.finish === "CHALK" && card.altitude === 30;
}

/** A north sight is late when the desk is already at the west. */
export function lateDioptra(card: Dioptra, desk: string): boolean {
  return card.bearing === "north" && dioptraBearing(desk) === "west" && !card.aligned;
}

export function dioptraCounts(cards: readonly Dioptra[], shown: readonly Dioptra[], desk: string): DioptraCounts {
  return {
    bench: cards.filter((card) => inTray(card, "bench")).length,
    case: cards.filter((card) => inTray(card, "case")).length,
    vault: cards.filter((card) => inTray(card, "vault")).length,
    aligned: cards.filter((card) => card.aligned).length,
    inner: cards.filter((card) => innerBearing(card.bearing)).length,
    outer: cards.filter((card) => outerBearing(card.bearing)).length,
    high: cards.filter((card) => card.altitude === 60).length,
    house: cards.filter((card) => houseFinish(card.finish)).length,
    altitude: cards.reduce((sum, card) => sum + (card.altitude || 0), 0),
    matched: shown.length,
    flagged: cards.filter((card) => card.flagged).length,
    idle: cards.filter(idleDioptra).length,
    brisk: cards.filter(briskDioptra).length,
    resting: cards.filter(restingDioptra).length,
    overdue: cards.filter(overdueDioptra).length,
    pair: cards.filter((card) => pairVane(card.vane) && lateDioptra(card, desk)).length,
  };
}

export function dioptraBars(cards: readonly Dioptra[]): { bearing: string; count: number }[] {
  return DIOPTRA_BEARINGS.map((bearing) => ({ bearing, count: cards.filter((card) => card.bearing === bearing && !card.vaulted).length }));
}

export function dioptraTimeline(cards: readonly Dioptra[]): { altitude: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "bench"));
  return ALTITUDE_CYCLE.map((altitude) => ({ altitude, titles: open.filter((card) => card.altitude === altitude).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function dioptraSurveyors(cards: readonly Dioptra[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.surveyor && !out.some((name) => name.toLowerCase() === card.surveyor.toLowerCase())) out.push(card.surveyor);
  }
  return out;
}

export function busiestDioptraSurveyor(cards: readonly Dioptra[]): string {
  const open = cards.filter((card) => inTray(card, "bench") && !card.aligned && card.surveyor);
  let best = "";
  let score = 0;
  for (const name of dioptraSurveyors(open)) {
    const count = open.filter((card) => card.surveyor.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderDioptras(cards: readonly Dioptra[]): string[] {
  return cards.filter(overdueDioptra).map((card) => card.title);
}

export function dioptraCopy(card: Dioptra): string {
  return [card.title, card.surveyor, card.bearing, card.finish, card.altitude ?? "", card.vane, card.note].filter((item) => item !== "").join(" · ");
}

export function dioptraCsv(cards: readonly Dioptra[], desk: string): string {
  const lines = ["title,surveyor,bearing,finish,altitude,vane,tags,aligned,case,vault,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.surveyor),
        card.bearing,
        card.finish,
        card.altitude ?? "",
        card.vane,
        card.tags.join(" "),
        card.aligned ? "1" : "0",
        card.cased ? "1" : "0",
        card.vaulted ? "1" : "0",
        card.flagged ? "1" : "0",
        outerBearing(card.bearing) ? "1" : "0",
        lateDioptra(card, desk) ? "1" : "0",
        idleDioptra(card) ? "1" : "0",
        briskDioptra(card) ? "1" : "0",
        restingDioptra(card) ? "1" : "0",
        overdueDioptra(card) ? "1" : "0",
        innerBearing(card.bearing) ? "1" : "0",
        houseFinish(card.finish) ? "1" : "0",
        dioptraBand(card.bearing),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const EML_KEY = "crmv4-email-hide";
export const EML_REVIEW_KEY = "crmv4-email-review";

export type EmailLane = "" | "spark" | "plus" | "alias" | "digit" | "house" | "nest" | "work";

export type EmailHue = "" | "ivory" | "graphite" | "champagne";

export type EmailState = "" | "clear" | "set";

export type EmailReview = "all" | "reviewed" | "fresh";

export type EmailShape =
  | "all"
  | "spark"
  | "plus"
  | "alias"
  | "digit"
  | "house"
  | "nest"
  | "work"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "vowel"
  | "tail"
  | "mark"
  | "first"
  | "held";

export type EmailValue = string | { email?: unknown; mailbox?: unknown; [key: string]: unknown } | null | undefined;

export type EmailRow = { id: string; label: string; handle: EmailValue };

export type EmailLaneLine = { lane: string; count: number };

const MAIL_LANES = ["spark", "plus", "alias", "digit", "house", "nest", "work"] as const;

const MAIL_HUES = ["champagne", "ivory", "graphite"] as const;

function mailRecord(raw: EmailValue): { email?: unknown; mailbox?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function mailBlocked(raw: EmailValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function mailGiven(raw: EmailValue): string {
  const row = mailRecord(raw);
  if (row && !("email" in row) && !("mailbox" in row)) return "";
  const value = row ? row.email ?? row.mailbox : raw;
  return clip(value, 80);
}

function mailOpen(raw: EmailValue): boolean {
  if (mailBlocked(raw)) return false;
  const row = mailRecord(raw);
  if (row && !("email" in row) && !("mailbox" in row)) return false;
  return true;
}

function mailboxParts(raw: string): { local: string; domain: string } | null {
  const at = raw.lastIndexOf("@");
  if (at <= 0 || at !== raw.indexOf("@") || at === raw.length - 1) return null;
  return { local: raw.slice(0, at), domain: raw.slice(at + 1).toLowerCase() };
}

function localPart(raw: EmailValue): string {
  const text = mailGiven(raw);
  return mailboxParts(text)?.local ?? text;
}

export function emailState(raw: EmailValue): EmailState {
  if (!mailOpen(raw)) return "";
  return mailGiven(raw) ? "set" : "clear";
}

/** Spark is a local part of two characters or shorter. Plus contains +. Alias contains a separator. A public domain is a house. Three domain labels make a nest. */
export function emailLane(raw: EmailValue): EmailLane {
  if (emailState(raw) !== "set") return "";
  const text = mailGiven(raw);
  const parts = mailboxParts(text);
  const local = parts?.local ?? text;
  if (local.length <= 2) return "spark";
  if (local.includes("+")) return "plus";
  if (/[._-]/.test(local)) return "alias";
  if (/[0-9]/.test(local)) return "digit";
  if (parts && PUBLIC_HOUSE.has(parts.domain)) return "house";
  if (parts && parts.domain.split(".").filter(Boolean).length >= 3) return "nest";
  return "work";
}

export function emailHue(raw: EmailValue): EmailHue {
  const lane = emailLane(raw);
  if (!lane) return "";
  if (lane === "spark" || lane === "plus") return "champagne";
  if (lane === "alias" || lane === "digit") return "graphite";
  return "ivory";
}

export function emailSpark(raw: EmailValue): boolean {
  return emailLane(raw) === "spark";
}

export function emailPlus(raw: EmailValue): boolean {
  return emailLane(raw) === "plus";
}

export function emailAlias(raw: EmailValue): boolean {
  return emailLane(raw) === "alias";
}

export function emailHouse(raw: EmailValue): boolean {
  return emailLane(raw) === "house";
}

export function emailNest(raw: EmailValue): boolean {
  return emailLane(raw) === "nest";
}

export function emailWork(raw: EmailValue): boolean {
  return emailLane(raw) === "work";
}

export function emailOpen(raw: EmailValue): boolean {
  return emailState(raw) === "clear";
}

/** A mailbox the desk can write to without a rewrite: house or work. */
export function emailHeld(raw: EmailValue): boolean {
  const lane = emailLane(raw);
  return lane === "house" || lane === "work";
}

/** Two characters or fewer in the local part still needs a longer address. */
export function emailSoon(raw: EmailValue): boolean {
  if (emailState(raw) !== "set") return false;
  const length = localPart(raw).length;
  return length > 0 && length <= 2;
}

export function emailLength(raw: EmailValue): number | null {
  if (emailState(raw) !== "set") return null;
  return localPart(raw).length;
}

export function emailEven(raw: EmailValue): boolean {
  const length = emailLength(raw);
  return length !== null && length % 2 === 0;
}

export function emailOdd(raw: EmailValue): boolean {
  const length = emailLength(raw);
  return length !== null && length % 2 === 1;
}

export function emailFirst(raw: EmailValue): boolean {
  return /^[A-Za-z]/.test(localPart(raw));
}

export function emailTail(raw: EmailValue): boolean {
  return /[0-9]$/.test(localPart(raw));
}

export function emailMark(raw: EmailValue): boolean {
  return /[A-Z]/.test(mailGiven(raw));
}

export function emailSpace(raw: EmailValue): boolean {
  return mailGiven(raw).includes(" ");
}

export function emailVowel(raw: EmailValue): boolean {
  return /^[aeiou]/i.test(localPart(raw));
}

export function emailDigit(raw: EmailValue): boolean {
  return /[0-9]/.test(localPart(raw));
}

export function emailLetter(raw: EmailValue): boolean {
  return /[A-Za-z]/.test(localPart(raw));
}

export function emailMixed(raw: EmailValue): boolean {
  return emailDigit(raw) && emailLetter(raw);
}

export function emailLower(raw: EmailValue): boolean {
  const text = mailGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

export function emailUpper(raw: EmailValue): boolean {
  return emailMark(raw);
}

export function emailStamp(raw: EmailValue): string {
  const text = localPart(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function emailCopy(raw: EmailValue): string {
  return mailGiven(raw);
}

export function emailDomain(raw: EmailValue): string {
  if (emailState(raw) !== "set") return "";
  return mailboxParts(mailGiven(raw))?.domain ?? "";
}

export function emailLanes(rows: readonly EmailRow[]): EmailLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of MAIL_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = emailLane(row.handle);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return MAIL_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingEmail(rows: readonly EmailRow[]): string {
  const lines = emailLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || MAIL_LANES.indexOf(a.lane as (typeof MAIL_LANES)[number]) - MAIL_LANES.indexOf(b.lane as (typeof MAIL_LANES)[number]))[0].lane;
}

export function leadingEmailHue(rows: readonly EmailRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of MAIL_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = emailHue(row.handle);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = MAIL_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || MAIL_HUES.indexOf(a.hue) - MAIL_HUES.indexOf(b.hue))[0].hue;
}

export function laneEmailCount(rows: readonly EmailRow[], lane: EmailLane): number {
  return rows.filter((row) => emailLane(row.handle) === lane).length;
}

export function emailShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentEmailLanes(rows: readonly EmailRow[]): string[] {
  return emailLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenEmail(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedEmail(raw: unknown, ids: readonly string[]): string[] {
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

export function toggleEmail(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function toggleEmailReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkEmailReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visibleEmailLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: EmailRow, shape: EmailShape): boolean {
  if (shape === "all") return true;
  if (shape === "spark") return emailSpark(row.handle);
  if (shape === "plus") return emailPlus(row.handle);
  if (shape === "house") return emailHouse(row.handle);
  if (shape === "nest") return emailNest(row.handle);
  if (shape === "work") return emailWork(row.handle);
  if (shape === "open") return emailOpen(row.handle);
  if (shape === "soon") return emailSoon(row.handle);
  if (shape === "digit") return emailDigit(row.handle);
  if (shape === "letter") return emailLetter(row.handle);
  if (shape === "mixed") return emailMixed(row.handle);
  if (shape === "upper") return emailUpper(row.handle);
  if (shape === "lower") return emailLower(row.handle);
  if (shape === "space") return emailSpace(row.handle);
  if (shape === "even") return emailEven(row.handle);
  if (shape === "odd") return emailOdd(row.handle);
  if (shape === "vowel") return emailVowel(row.handle);
  if (shape === "tail") return emailTail(row.handle);
  if (shape === "mark") return emailMark(row.handle);
  if (shape === "first") return emailFirst(row.handle);
  if (shape === "held") return emailHeld(row.handle);
  return emailLane(row.handle) === shape;
}

export function visibleEmail(
  rows: readonly EmailRow[],
  lane: string,
  hue: string,
  query: string,
  review: EmailReview,
  reviewed: readonly string[],
  shape: EmailShape,
): EmailRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (emailState(row.handle) === "") return false;
    const found = emailLane(row.handle);
    const hueName = emailHue(row.handle);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${mailGiven(row.handle)} ${emailStamp(row.handle)} ${emailDomain(row.handle)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function emailLanesCsv(rows: readonly EmailRow[]): string {
  const lines = ["lane,count"];
  for (const line of emailLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function emailRowsCsv(rows: readonly EmailRow[], reviewed: readonly string[]): string {
  const lines = ["name,email,stamp,lane,hue,length,spark,plus,alias,house,nest,even,digit,mixed,upper,vowel,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    if (emailState(row.handle) !== "set") continue;
    lines.push(
      [
        csvCell(row.label),
        csvCell(mailGiven(row.handle)),
        emailStamp(row.handle),
        emailLane(row.handle),
        emailHue(row.handle),
        String(emailLength(row.handle) ?? ""),
        emailSpark(row.handle) ? "1" : "0",
        emailPlus(row.handle) ? "1" : "0",
        emailAlias(row.handle) ? "1" : "0",
        emailHouse(row.handle) ? "1" : "0",
        emailNest(row.handle) ? "1" : "0",
        emailEven(row.handle) ? "1" : "0",
        emailDigit(row.handle) ? "1" : "0",
        emailMixed(row.handle) ? "1" : "0",
        emailUpper(row.handle) ? "1" : "0",
        emailVowel(row.handle) ? "1" : "0",
        emailTail(row.handle) ? "1" : "0",
        emailHeld(row.handle) ? "1" : "0",
        emailSoon(row.handle) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
