/**
 * Local hearth relays for follow-up review, and login lanterns already on each loaded row.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_hearth_relay (
 *   id text primary key,
 *   note text not null,
 *   steward text not null default '',
 *   rung integer,
 *   wick text not null default '',
 *   mark text not null default '',
 *   flame text not null default '',
 *   pinned boolean not null default false,
 *   banked boolean not null default false,
 *   sealed boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_lantern_hide (
 *   season text primary key
 * );
 */

export const RELAY_KEY = "crmv4-hearth-relays";
export const RELAY_VIEW_KEY = "crmv4-hearth-views";
export const LANTERN_KEY = "crmv4-lantern-hide";

export type RelayFlame = "blank" | "ember" | "glow" | "blaze";

export type RelayWick = "blank" | "flax" | "bees" | "tallow" | "rush";

export type RelayTray = "open" | "banked" | "sealed";

export type BedPick = "blank" | "coal" | "hearth" | "stack" | "crown" | "close" | "wide";

export type RelayCard = {
  id: string;
  text: string;
  steward: string;
  rung: number | null;
  wick: string;
  mark: string;
  flame: string;
  pinned: boolean;
  banked: boolean;
  sealed: boolean;
  audit: string;
};

export type RelayView = {
  id: string;
  name: string;
  tray: RelayTray;
  query: string;
  steward: string;
  wick: string;
  mark: string;
  flame: string;
  rung: string;
};

export type RelayCounts = {
  open: number;
  banked: number;
  sealed: number;
  pinned: number;
  late: number;
};

export type LanternSeason = "" | "frost" | "bloom" | "heat" | "harvest";

export type LanternMoon = "" | "new" | "full" | "old";

export type LanternGlass = "" | "brief" | "steady" | "late";

export type LanternWatch = "" | "desk" | "rest";

export type LanternValue =
  | {
      lastLoginAt?: unknown;
      lastSeenAt?: unknown;
      timezone?: unknown;
      language?: unknown;
      country?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      desk?: unknown;
      address?: unknown;
      city?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      lastCountryName?: unknown;
      createdAt?: unknown;
    }
  | string
  | boolean
  | number
  | null
  | undefined;

export type LanternRow = { lastLoginAt?: LanternValue; label?: string | null };

export type SeasonLine = { season: string; count: number };

export type MoonLine = { moon: string; count: number };

export type GlassLine = { glass: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "pin", "unpin", "bank", "free", "seal", "unseal"] as const;

const WICKS = ["flax", "bees", "tallow", "rush"] as const;

const FLAMES = ["ember", "glow", "blaze"] as const;

const FLAME_ORDER = ["", "ember", "glow", "blaze"] as const;

const PICKS = ["blank", "coal", "hearth", "stack", "crown", "close", "wide"] as const;

const BEDS = ["coal", "hearth", "stack", "crown"] as const;

const SEASONS = ["frost", "bloom", "heat", "harvest"] as const;

const MOONS = ["", "new", "full", "old"] as const;

const GLASSES = ["", "brief", "steady", "late"] as const;

const WATCHES = ["", "desk", "rest"] as const;

const LANTERN_BLOCK = ["lastSeenAt", "timezone", "language", "country", "name", "email", "phone", "desk", "address", "city", "firstName", "lastName", "lastCountryName", "createdAt"] as const;

const STAMP = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): RelayTray {
  return raw === "banked" || raw === "sealed" ? raw : "open";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wickName(raw: unknown): Exclude<RelayWick, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WICKS as readonly string[]).includes(text) ? (text as Exclude<RelayWick, "blank">) : "";
}

function flameName(raw: unknown): Exclude<RelayFlame, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (FLAMES as readonly string[]).includes(text) ? (text as Exclude<RelayFlame, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function relayText(raw: unknown): string {
  return clip(raw, 48);
}

/** A blank steward stays blank. It is not filled in. */
export function stewardLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank mark stays blank. It is not filled in. */
export function relayMark(raw: unknown): string {
  return clip(raw, 10);
}

/**
 * A rung is 1 through 16.
 * A blank value stays unset. 0 and 17 are not rungs.
 * A leading zero is still a rung: 01 is 1, and 09 is 9.
 * 00 is not a rung.
 */
export function rungOf(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 16) return raw;
  if (typeof raw === "string" && /^(?:0?[1-9]|1[0-6])$/.test(raw.trim())) return Number(raw.trim());
  return null;
}

/** Flax, bees, tallow, rush, or blank. Anything else is blank. */
export function wickOf(raw: unknown): RelayWick {
  return wickName(raw) || "blank";
}

/** Ember, glow, blaze, or blank. Anything else is blank. */
export function flameOf(raw: unknown): RelayFlame {
  return flameName(raw) || "blank";
}

/** Coal is 1–4. Hearth is 5–8. Stack is 9–12. Crown is 13–16. An unset rung is blank. */
export function bedOf(rung: unknown): "blank" | "coal" | "hearth" | "stack" | "crown" {
  const count = rungOf(rung);
  if (count === null) return "blank";
  if (count <= 4) return "coal";
  if (count <= 8) return "hearth";
  if (count <= 12) return "stack";
  return "crown";
}

/** Close is 1–8. Wide is 9–16. An unset rung is blank. */
export function reachOf(rung: unknown): "blank" | "close" | "wide" {
  const count = rungOf(rung);
  if (count === null) return "blank";
  return count <= 8 ? "close" : "wide";
}

/** The typed rung minus the slip rung. A positive gap is past the rung. */
export function relayGap(rung: unknown, desk: unknown): number | null {
  const from = rungOf(rung);
  const at = rungOf(desk);
  if (from === null || at === null) return null;
  return at - from;
}

export function readRelays(raw: unknown): RelayCard[] {
  if (!Array.isArray(raw)) return [];
  const out: RelayCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RelayCard>;
    const id = String(row.id || "").trim();
    const text = relayText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      steward: stewardLabel(row.steward),
      rung: rungOf(row.rung),
      wick: wickName(row.wick),
      mark: relayMark(row.mark),
      flame: flameName(row.flame),
      pinned: row.pinned === true,
      banked: row.banked === true,
      sealed: row.sealed === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 12);
}

export function addRelay(
  cards: readonly RelayCard[],
  card: { id: string; text: string; steward?: string; rung?: unknown; wick?: string; mark?: string; flame?: string },
): RelayCard[] {
  const current = readRelays(cards);
  const id = String(card.id || "").trim();
  const text = relayText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: RelayCard = {
    id,
    text,
    steward: stewardLabel(card.steward),
    rung: rungOf(card.rung),
    wick: wickName(card.wick),
    mark: relayMark(card.mark),
    flame: flameName(card.flame),
    pinned: false,
    banked: false,
    sealed: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 12);
}

export function stepRelayFlame(cards: readonly RelayCard[], id: string, dir: 1 | -1): RelayCard[] {
  return readRelays(cards).map((card) => {
    if (card.id !== id) return card;
    const at = FLAME_ORDER.indexOf(card.flame as (typeof FLAME_ORDER)[number]);
    const next = FLAME_ORDER[Math.min(FLAMES.length, Math.max(0, (at < 0 ? 0 : at) + dir))];
    if (next === undefined || next === card.flame) return card;
    return { ...card, flame: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setRelayPinned(cards: readonly RelayCard[], id: string, pinned: boolean): RelayCard[] {
  return readRelays(cards).map((card) => (card.id === id ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function setRelayBanked(cards: readonly RelayCard[], id: string, banked: boolean): RelayCard[] {
  return readRelays(cards).map((card) => (card.id === id ? { ...card, banked, audit: banked ? "bank" : "free" } : card));
}

export function setRelaySealed(cards: readonly RelayCard[], id: string, sealed: boolean): RelayCard[] {
  return readRelays(cards).map((card) => (card.id === id ? { ...card, sealed, audit: sealed ? "seal" : "unseal" } : card));
}

/** A blank edit is left out. A duplicate of another relay is left out. */
export function editRelay(cards: readonly RelayCard[], id: string, text: string): RelayCard[] {
  const current = readRelays(cards);
  const next = relayText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkRelayPinned(cards: readonly RelayCard[], ids: readonly string[], pinned: boolean): RelayCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readRelays(cards).map((card) => (want.has(card.id) ? { ...card, pinned, audit: pinned ? "pin" : "unpin" } : card));
}

export function bulkRelaySealed(cards: readonly RelayCard[], ids: readonly string[], sealed: boolean): RelayCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readRelays(cards).map((card) => (want.has(card.id) ? { ...card, sealed, audit: sealed ? "seal" : "unseal" } : card));
}

export function resetRelays(): RelayCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function relayCopy(raw: unknown): string {
  return relayText(raw);
}

function inTray(card: RelayCard, tray: RelayTray): boolean {
  if (tray === "sealed") return card.sealed;
  if (tray === "banked") return card.banked && !card.sealed;
  return !card.banked && !card.sealed;
}

function rungHit(rung: number | null, exact: number | null, band: BedPick | null): boolean {
  if (exact !== null) return rung === exact;
  if (band === null) return true;
  if (band === "blank") return rung === null;
  if (band === "close" || band === "wide") return reachOf(rung) === band;
  return bedOf(rung) === band;
}

function flameScore(flame: string): number {
  if (flame === "blaze") return 3;
  if (flame === "glow") return 2;
  if (flame === "ember") return 1;
  return 0;
}

function emberLate(card: RelayCard, desk: unknown): boolean {
  const gap = relayGap(card.rung, desk);
  return gap !== null && gap > 0 && card.flame === "ember" && inTray(card, "open");
}

/** Search stays on the note. The steward, the rung, the wick, the mark, and the flame are not part of the query. */
export function visibleRelays(
  cards: readonly RelayCard[],
  tray: RelayTray,
  query: string,
  steward: string | null,
  wick: RelayWick | null,
  mark: string | null,
  flame: RelayFlame | null,
  exact: number | null,
  bed: BedPick | null,
  blazeOnly: boolean,
  lateOnly: boolean,
  desk: unknown,
): RelayCard[] {
  const text = query.trim().toLowerCase();
  const wantSteward = steward === null ? null : stewardLabel(steward);
  const wantMark = mark === null ? null : relayMark(mark);
  return readRelays(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (blazeOnly && card.flame !== "blaze") return false;
      if (wantSteward !== null && stewardLabel(card.steward) !== wantSteward) return false;
      if (wick !== null && wickOf(card.wick) !== wick) return false;
      if (wantMark !== null && relayMark(card.mark) !== wantMark) return false;
      if (flame !== null && flameOf(card.flame) !== flame) return false;
      if (!rungHit(card.rung, exact, bed)) return false;
      if (lateOnly && !emberLate(card, desk)) return false;
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (flameScore(a.flame) !== flameScore(b.flame)) return flameScore(b.flame) - flameScore(a.flame);
      return a.text.localeCompare(b.text);
    });
}

/** The rung orders the desk. An unset rung stays at the end. Search stays on the note. */
export function relayTimeline(cards: readonly RelayCard[], query: string): RelayCard[] {
  const text = query.trim().toLowerCase();
  return readRelays(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (a.rung === null && b.rung !== null) return 1;
      if (a.rung !== null && b.rung === null) return -1;
      if (a.rung !== null && b.rung !== null && a.rung !== b.rung) return a.rung - b.rung;
      return a.text.localeCompare(b.text);
    });
}

export function relayCounts(cards: readonly RelayCard[], desk: unknown): RelayCounts {
  const rows = readRelays(cards);
  return {
    open: rows.filter((card) => inTray(card, "open")).length,
    banked: rows.filter((card) => inTray(card, "banked")).length,
    sealed: rows.filter((card) => inTray(card, "sealed")).length,
    pinned: rows.filter((card) => card.pinned).length,
    late: rows.filter((card) => emberLate(card, desk)).length,
  };
}

/** Share of the saved relays. A zero total stays at zero. */
export function relayShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function relayStewards(cards: readonly RelayCard[]): string[] {
  const out: string[] = [];
  for (const card of readRelays(cards)) {
    if (card.steward && !out.includes(card.steward)) out.push(card.steward);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function relayMarks(cards: readonly RelayCard[]): string[] {
  const out: string[] = [];
  for (const card of readRelays(cards)) {
    if (card.mark && !out.includes(card.mark)) out.push(card.mark);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function relayWicks(cards: readonly RelayCard[]): Exclude<RelayWick, "blank">[] {
  const seen = new Set<string>();
  for (const card of readRelays(cards)) if (card.wick) seen.add(card.wick);
  return WICKS.filter((wick) => seen.has(wick));
}

export function relayFlames(cards: readonly RelayCard[]): Exclude<RelayFlame, "blank">[] {
  const seen = new Set<string>();
  for (const card of readRelays(cards)) if (card.flame) seen.add(card.flame);
  return FLAMES.filter((flame) => seen.has(flame));
}

/** Four beds. Index 0 is coal. Index 3 is crown. */
export function bedCounts(cards: readonly RelayCard[]): number[] {
  const rows = readRelays(cards);
  return BEDS.map((band) => rows.filter((card) => bedOf(card.rung) === band).length);
}

/** "all" and "blank" stay. A steward that is no longer on a relay falls back to all. */
export function activeSteward(filter: string, stewards: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const steward = stewardLabel(filter);
  return steward && stewards.includes(steward) ? steward : "all";
}

export function stewardArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return stewardLabel(filter);
}

/** "all" and "blank" stay. A wick that is no longer on a relay falls back to all. */
export function activeWick(filter: string, wicks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wick = wickName(filter);
  return wick && wicks.includes(wick) ? wick : "all";
}

export function wickArg(filter: string): RelayWick | null {
  if (filter === "blank") return "blank";
  return wickName(filter) || null;
}

/** "all" and "blank" stay. A mark that is no longer on a relay falls back to all. */
export function activeMark(filter: string, marks: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const mark = relayMark(filter);
  return mark && marks.includes(mark) ? mark : "all";
}

export function markArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return relayMark(filter);
}

/** "all" and "blank" stay. A flame that is no longer on a relay falls back to all. */
export function activeFlame(filter: string, flames: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const flame = flameName(filter);
  return flame && flames.includes(flame) ? flame : "all";
}

export function flameArg(filter: string): RelayFlame | null {
  if (filter === "blank") return "blank";
  return flameName(filter) || null;
}

/** All, blank, the four beds, the two reaches, and the rungs 1 through 16 stay. Anything else is all. */
export function activeRung(filter: string): string {
  if ((PICKS as readonly string[]).includes(filter)) return filter;
  const rung = rungOf(filter);
  return rung === null ? "all" : String(rung);
}

export function rungArg(filter: string): { exact: number | null; band: BedPick | null } {
  if ((PICKS as readonly string[]).includes(filter)) return { exact: null, band: filter as BedPick };
  const rung = rungOf(filter);
  return rung === null ? { exact: null, band: null } : { exact: rung, band: null };
}

/** Other relays with the same wick and the same mark. A blank wick or a blank mark clashes with nothing. */
export function relayClashIds(cards: readonly RelayCard[], id: string): string[] {
  const rows = readRelays(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.wick || !card.mark) return [];
  return rows
    .filter((item) => item.id !== id && item.wick === card.wick && item.mark === card.mark)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** How many saved relays share a wick and a mark with another relay. */
export function clashRelayCount(cards: readonly RelayCard[]): number {
  const rows = readRelays(cards);
  return rows.filter((card) => relayClashIds(rows, card.id).length > 0).length;
}

/**
 * The next open relay at or after the rung you type, skipping blaze.
 * After the last rung, the desk wraps to the earliest open relay that is not blaze.
 */
export function nextRelay(cards: readonly RelayCard[], desk: unknown): string {
  const now = rungOf(desk);
  if (now === null) return "";
  const waiting = readRelays(cards).filter((card) => inTray(card, "open") && card.rung !== null && card.flame !== "blaze");
  if (!waiting.length) return "";
  const byRung = (a: RelayCard, b: RelayCard) => (a.rung ?? 0) - (b.rung ?? 0) || a.text.localeCompare(b.text);
  const later = waiting.filter((card) => (card.rung ?? 0) >= now).sort(byRung);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byRung)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the relays saved in this browser. The gap uses the rung you pass. */
export function relaysCsv(raw: unknown, desk: unknown): string {
  const lines = ["note,steward,rung,wick,mark,flame,bed,pinned,banked,sealed,gap,audit"];
  for (const card of readRelays(raw)) {
    const gap = relayGap(card.rung, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.steward),
      card.rung === null ? "" : String(card.rung),
      card.wick,
      csvCell(card.mark),
      card.flame,
      bedOf(card.rung),
      card.pinned ? "1" : "0",
      card.banked ? "1" : "0",
      card.sealed ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function stewardSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return stewardLabel(raw) || "all";
}

function wickSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wickName(raw) || "all";
}

function markSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return relayMark(raw) || "all";
}

function flameSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return flameName(raw) || "all";
}

export function readRelayViews(raw: unknown): RelayView[] {
  if (!Array.isArray(raw)) return [];
  const out: RelayView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<RelayView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 48),
      steward: stewardSlot(row.steward),
      wick: wickSlot(row.wick),
      mark: markSlot(row.mark),
      flame: flameSlot(row.flame),
      rung: activeRung(String(row.rung ?? "")),
    });
  }
  return out.slice(0, 4);
}

export function addRelayView(
  views: readonly RelayView[],
  view: { id: string; name: string; tray: RelayTray; query: string; steward: string; wick: string; mark: string; flame: string; rung: string },
): RelayView[] {
  const current = readRelayViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 48),
    steward: stewardSlot(view.steward),
    wick: wickSlot(view.wick),
    mark: markSlot(view.mark),
    flame: flameSlot(view.flame),
    rung: activeRung(view.rung),
  }].slice(0, 4);
}

export function dropRelayView(views: readonly RelayView[], id: string): RelayView[] {
  return readRelayViews(views).filter((view) => view.id !== id);
}

function stampOf(value: LanternValue): string {
  if (typeof value === "string") return clip(value, 40);
  if (!value || typeof value !== "object" || typeof value === "boolean") return "";
  if (LANTERN_BLOCK.some((key) => key in value)) return "";
  return clip(value.lastLoginAt, 40);
}

function parsedStamp(value: LanternValue): Date | null {
  const text = stampOf(value);
  if (!STAMP.test(text)) return null;
  const at = Date.parse(text);
  if (!Number.isFinite(at)) return null;
  return new Date(at);
}

/**
 * A season from the last-login field, or blank.
 * A last-seen time, a timezone, a language, a country, a name, an email, a phone, a desk,
 * an address, a city, a given name, a family name, a last country, and a created time are not a lantern.
 * A missing last login stays unmarked and is not filled in.
 */
export function assignedLantern(value: LanternValue): string {
  return seasonOf(value);
}

/** Frost is Dec–Feb. Bloom is Mar–May. Heat is Jun–Aug. Harvest is Sep–Nov. An unmarked login stays blank. */
export function seasonOf(value: LanternValue): LanternSeason {
  const at = parsedStamp(value);
  if (!at) return "";
  const month = at.getUTCMonth();
  if (month === 11 || month <= 1) return "frost";
  if (month <= 4) return "bloom";
  if (month <= 7) return "heat";
  return "harvest";
}

/** New is days 1–10. Full is 11–20. Old is 21–31. An unmarked login stays blank. */
export function moonOf(value: LanternValue): LanternMoon {
  const at = parsedStamp(value);
  if (!at) return "";
  const day = at.getUTCDate();
  if (day <= 10) return "new";
  if (day <= 20) return "full";
  return "old";
}

/** Brief is hours 00–07. Steady is 08–15. Late is 16–23. An unmarked login stays blank. */
export function glassOf(value: LanternValue): LanternGlass {
  const at = parsedStamp(value);
  if (!at) return "";
  const hour = at.getUTCHours();
  if (hour <= 7) return "brief";
  if (hour <= 15) return "steady";
  return "late";
}

/** Desk is Monday through Friday. Rest is Saturday and Sunday. An unmarked login stays blank. */
export function watchOf(value: LanternValue): LanternWatch {
  const at = parsedStamp(value);
  if (!at) return "";
  const day = at.getUTCDay();
  return day === 0 || day === 6 ? "rest" : "desk";
}

export function seasonLines(rows: readonly LanternRow[]): SeasonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const season = seasonOf(row.lastLoginAt);
    map.set(season, (map.get(season) || 0) + 1);
  }
  const out: SeasonLine[] = [];
  for (const season of ["", ...SEASONS]) {
    const count = map.get(season);
    if (count) out.push({ season, count });
  }
  return out;
}

export function namedSeasons(rows: readonly LanternRow[]): string[] {
  return seasonLines(rows).map((line) => line.season).filter(Boolean);
}

export function moonLines(rows: readonly LanternRow[]): MoonLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const moon = moonOf(row.lastLoginAt);
    map.set(moon, (map.get(moon) || 0) + 1);
  }
  const out: MoonLine[] = [];
  for (const moon of MOONS) {
    const count = map.get(moon);
    if (count) out.push({ moon, count });
  }
  return out;
}

export function namedMoons(rows: readonly LanternRow[]): string[] {
  return moonLines(rows).map((line) => line.moon).filter(Boolean);
}

export function glassLines(rows: readonly LanternRow[]): GlassLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const glass = glassOf(row.lastLoginAt);
    map.set(glass, (map.get(glass) || 0) + 1);
  }
  const out: GlassLine[] = [];
  for (const glass of GLASSES) {
    const count = map.get(glass);
    if (count) out.push({ glass, count });
  }
  return out;
}

export function namedGlasses(rows: readonly LanternRow[]): string[] {
  return glassLines(rows).map((line) => line.glass).filter(Boolean);
}

export function watchLines(rows: readonly LanternRow[]): { watch: string; count: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const watch = watchOf(row.lastLoginAt);
    map.set(watch, (map.get(watch) || 0) + 1);
  }
  const out: { watch: string; count: number }[] = [];
  for (const watch of WATCHES) {
    const count = map.get(watch);
    if (count) out.push({ watch, count });
  }
  return out;
}

/** The season with the most loaded rows. A tie keeps the earlier season. An unmarked login is not a lead. */
export function leadingSeason(rows: readonly LanternRow[]): string {
  const named = seasonLines(rows).filter((line) => line.season);
  if (!named.length) return "";
  const order = (season: string) => SEASONS.indexOf(season as (typeof SEASONS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.season) - order(b.season))[0].season;
}

/** The named moon with the most loaded rows. A tie keeps the earlier moon. A blank moon is not a lead. */
export function leadingMoon(rows: readonly LanternRow[]): string {
  const named = moonLines(rows).filter((line) => line.moon);
  if (!named.length) return "";
  const order = (moon: string) => MOONS.indexOf(moon as (typeof MOONS)[number]);
  return named.slice().sort((a, b) => b.count - a.count || order(a.moon) - order(b.moon))[0].moon;
}

/** Share of the loaded rows. A zero total stays at zero. */
export function lanternShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function readHiddenSeasons(raw: unknown, present: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(present);
  const out: string[] = [];
  for (const item of raw) {
    const mark = clip(item, 16).toLowerCase();
    if (!(SEASONS as readonly string[]).includes(mark) || !known.has(mark) || out.includes(mark)) continue;
    out.push(mark);
  }
  return out;
}

export function toggleSeason(hidden: readonly string[], season: string, present: readonly string[]): string[] {
  const mark = (SEASONS as readonly string[]).includes(season) ? season : seasonOf(season);
  if (!mark || !present.includes(mark)) return readHiddenSeasons(hidden, present);
  const current = readHiddenSeasons(hidden, present);
  return current.includes(mark) ? current.filter((item) => item !== mark) : [...current, mark];
}

export function visibleSeasons(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenSeasons(hidden, present));
  return present.filter((season) => (showHidden ? gone.has(season) : !gone.has(season)));
}

/** "all" and "blank" stay. A season that is no longer loaded falls back to all. */
export function activeSeason(filter: string, seasons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const season = (SEASONS as readonly string[]).includes(filter) ? filter : seasonOf(filter);
  return season && seasons.includes(season) ? season : "all";
}

export function seasonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return (SEASONS as readonly string[]).includes(filter) ? filter : null;
}

/** "all" and "blank" stay. A moon that is no longer loaded falls back to all. */
export function activeMoon(filter: string, moons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (MOONS as readonly string[]).includes(filter) && moons.includes(filter) ? filter : "all";
}

export function moonArg(filter: string): LanternMoon | null {
  if (filter === "blank") return "";
  if ((MOONS as readonly string[]).includes(filter) && filter !== "") return filter as LanternMoon;
  return null;
}

/** "all" and "blank" stay. A glass that is no longer loaded falls back to all. */
export function activeGlass(filter: string, glasses: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return (GLASSES as readonly string[]).includes(filter) && glasses.includes(filter) ? filter : "all";
}

export function glassArg(filter: string): LanternGlass | null {
  if (filter === "blank") return "";
  if ((GLASSES as readonly string[]).includes(filter) && filter !== "") return filter as LanternGlass;
  return null;
}

/** Search stays on the name. The last login is not part of the query. */
export function visibleLanternCustomers<T extends LanternRow>(
  rows: readonly T[],
  season: string | null,
  moon: LanternMoon | null,
  glass: LanternGlass | null,
  query: string,
): T[] {
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (season !== null && seasonOf(row.lastLoginAt) !== season) return false;
    if (moon !== null && moonOf(row.lastLoginAt) !== moon) return false;
    if (glass !== null && glassOf(row.lastLoginAt) !== glass) return false;
    const label = String(row.label || "").toLowerCase();
    return !text || label.includes(text);
  });
}

/** The CSV is the seasons, moons, glasses, and week marks on this page. */
export function lanternsCsv(rows: readonly LanternRow[]): string {
  const lines = ["kind,mark,count"];
  for (const line of seasonLines(rows)) lines.push(["season", csvCell(line.season), String(line.count)].join(","));
  for (const line of moonLines(rows)) lines.push(["moon", line.moon, String(line.count)].join(","));
  for (const line of glassLines(rows)) lines.push(["glass", line.glass, String(line.count)].join(","));
  for (const line of watchLines(rows)) lines.push(["watch", line.watch, String(line.count)].join(","));
  return lines.join("\n");
}
