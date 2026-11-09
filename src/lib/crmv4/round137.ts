/** Local arrival cards, and customer counts grouped by the last city already on each row. */

export const ARRIVAL_KEY = "crmv4-arrival-cards";
export const ARRIVAL_VIEW_KEY = "crmv4-arrival-views";
export const CITY_KEY = "crmv4-city-hide";

export type ArrivalRank = 0 | 1 | 2;

export type ArrivalBand = "morning" | "afternoon" | "evening" | "blank";

export type ArrivalTray = "waiting" | "held" | "greeted";

export type PartyPick = "blank" | "solo" | "crowd";

export type ArrivalCard = {
  id: string;
  text: string;
  door: string;
  clock: string;
  party: number;
  tag: string;
  rank: ArrivalRank;
  held: boolean;
  greeted: boolean;
  hush: boolean;
  audit: string;
};

export type ArrivalView = {
  id: string;
  name: string;
  tray: ArrivalTray;
  query: string;
  door: string;
  band: string;
  tag: string;
  party: string;
};

export type ArrivalCounts = {
  waiting: number;
  held: number;
  greeted: number;
  hush: number;
  late: number;
};

export type CityValue =
  | {
      lastCity?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      timezone?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastRegion?: unknown;
      lastDevice?: unknown;
      lastBrowser?: unknown;
      lastOs?: unknown;
      desk?: unknown;
      deskId?: unknown;
      campaign?: unknown;
      phone?: unknown;
      tradingServer?: unknown;
      tradingGroup?: unknown;
      brokerName?: unknown;
      assigneeName?: unknown;
      saleStatus?: unknown;
      retentionStatus?: unknown;
      potentialStatus?: unknown;
      documentsStatus?: unknown;
      accountType?: unknown;
      role?: unknown;
      validation?: unknown;
      validationStatus?: unknown;
      referralCodeUsed?: unknown;
      city?: unknown;
    }
  | string
  | null
  | undefined;

export type CityRow = { lastCity?: CityValue; label?: string | null };

export type CityLine = { city: string; initial: string; count: number };

export type InitialLine = { initial: string; count: number };

const AUDITS = ["save", "edit", "raise", "lower", "hold", "release", "greet", "reopen", "hush", "speak"] as const;

const BANDS = ["morning", "afternoon", "evening", "blank"] as const;

const PARTIES = ["blank", "solo", "crowd"] as const;

const CITY_BLOCK = [
  "language",
  "country",
  "registrationCountry",
  "timezone",
  "lastCountry",
  "lastCountryName",
  "lastRegion",
  "lastDevice",
  "lastBrowser",
  "lastOs",
  "desk",
  "deskId",
  "campaign",
  "phone",
  "tradingServer",
  "tradingGroup",
  "brokerName",
  "assigneeName",
  "saleStatus",
  "retentionStatus",
  "potentialStatus",
  "documentsStatus",
  "accountType",
  "role",
  "validation",
  "validationStatus",
  "referralCodeUsed",
  "city",
] as const;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): ArrivalTray {
  return raw === "held" || raw === "greeted" ? raw : "waiting";
}

function rankOf(raw: unknown): ArrivalRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function bandName(raw: unknown): ArrivalBand | "" {
  const text = clip(raw, 12);
  return (BANDS as readonly string[]).includes(text) ? (text as ArrivalBand) : "";
}

function partyName(raw: unknown): PartyPick | "" {
  const text = clip(raw, 8);
  return (PARTIES as readonly string[]).includes(text) ? (text as PartyPick) : "";
}

/** A blank note is left out. The saved text stays short. */
export function arrivalText(raw: unknown): string {
  return clip(raw, 96);
}

/** A blank door stays blank. It is not filled in. */
export function doorLabel(raw: unknown): string {
  return clip(raw, 16);
}

/** A blank tag stays blank. It is not filled in. */
export function tagLabel(raw: unknown): string {
  return clip(raw, 12);
}

/** A blank clock stays blank. It is not filled in. */
export function clockLabel(raw: unknown): string {
  return clip(raw, 5);
}

/** A party is 1 through 8. A blank or any other value stays zero. */
export function partyCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 8) return raw;
  if (typeof raw === "string" && /^[1-8]$/.test(raw.trim())) return Number(raw.trim());
  return 0;
}

/** A clock is HH:MM. Anything else is not a clock. */
export function clockMinutes(raw: unknown): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(clockLabel(raw));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Morning, afternoon, evening, or blank. One clock has no overnight band. */
export function bandOf(clock: unknown): ArrivalBand {
  const mark = clockMinutes(clock);
  if (mark === null) return "blank";
  if (mark < 12 * 60) return "morning";
  if (mark < 17 * 60) return "afternoon";
  return "evening";
}

/** Minutes from the card clock to the desk clock. A negative wait is early. A bad clock stays empty. */
export function waitMinutes(clock: unknown, now: unknown): number | null {
  const from = clockMinutes(clock);
  const at = clockMinutes(now);
  if (from === null || at === null) return null;
  return at - from;
}

export function readArrivals(raw: unknown): ArrivalCard[] {
  if (!Array.isArray(raw)) return [];
  const out: ArrivalCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArrivalCard>;
    const id = String(row.id || "").trim();
    const text = arrivalText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      door: doorLabel(row.door),
      clock: clockLabel(row.clock),
      party: partyCount(row.party),
      tag: tagLabel(row.tag),
      rank: rankOf(row.rank),
      held: row.held === true,
      greeted: row.greeted === true,
      hush: row.hush === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addArrival(
  cards: readonly ArrivalCard[],
  card: { id: string; text: string; door?: string; clock?: string; party?: unknown; tag?: string },
): ArrivalCard[] {
  const current = readArrivals(cards);
  const id = String(card.id || "").trim();
  const text = arrivalText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: ArrivalCard = {
    id,
    text,
    door: doorLabel(card.door),
    clock: clockLabel(card.clock),
    party: partyCount(card.party),
    tag: tagLabel(card.tag),
    rank: 0,
    held: false,
    greeted: false,
    hush: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepArrivalRank(cards: readonly ArrivalCard[], id: string, dir: 1 | -1): ArrivalCard[] {
  return readArrivals(cards).map((card) => {
    if (card.id !== id) return card;
    const next = rankOf(Math.min(2, Math.max(0, card.rank + dir)));
    if (next === card.rank) return card;
    return { ...card, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setArrivalHeld(cards: readonly ArrivalCard[], id: string, held: boolean): ArrivalCard[] {
  return readArrivals(cards).map((card) => (card.id === id ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function setArrivalGreeted(cards: readonly ArrivalCard[], id: string, greeted: boolean): ArrivalCard[] {
  return readArrivals(cards).map((card) => (card.id === id ? { ...card, greeted, audit: greeted ? "greet" : "reopen" } : card));
}

export function setArrivalHush(cards: readonly ArrivalCard[], id: string, hush: boolean): ArrivalCard[] {
  return readArrivals(cards).map((card) => (card.id === id ? { ...card, hush, audit: hush ? "hush" : "speak" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editArrival(cards: readonly ArrivalCard[], id: string, text: string): ArrivalCard[] {
  const current = readArrivals(cards);
  const next = arrivalText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkArrivalHeld(cards: readonly ArrivalCard[], ids: readonly string[], held: boolean): ArrivalCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readArrivals(cards).map((card) => (want.has(card.id) ? { ...card, held, audit: held ? "hold" : "release" } : card));
}

export function bulkArrivalGreeted(cards: readonly ArrivalCard[], ids: readonly string[], greeted: boolean): ArrivalCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readArrivals(cards).map((card) => (want.has(card.id) ? { ...card, greeted, audit: greeted ? "greet" : "reopen" } : card));
}

export function resetArrivals(): ArrivalCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function arrivalCopy(raw: unknown): string {
  return arrivalText(raw);
}

function inTray(card: ArrivalCard, tray: ArrivalTray): boolean {
  if (tray === "greeted") return card.greeted;
  if (tray === "held") return card.held && !card.greeted;
  return !card.held && !card.greeted;
}

function partyHit(party: number, pick: PartyPick | null): boolean {
  if (pick === null) return true;
  if (pick === "blank") return party === 0;
  if (pick === "solo") return party === 1;
  return party >= 4;
}

/** Search stays on the note. The door, the clock, the party, and the tag are not part of the query. */
export function visibleArrivals(
  cards: readonly ArrivalCard[],
  tray: ArrivalTray,
  query: string,
  door: string | null,
  band: ArrivalBand | null,
  tag: string | null,
  party: PartyPick | null,
  firstOnly: boolean,
  lateOnly: boolean,
  now: unknown,
): ArrivalCard[] {
  const text = query.trim().toLowerCase();
  const wantDoor = door === null ? null : doorLabel(door);
  const wantTag = tag === null ? null : tagLabel(tag);
  return readArrivals(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (firstOnly && card.rank !== 2) return false;
      if (wantDoor !== null && doorLabel(card.door) !== wantDoor) return false;
      if (band !== null && bandOf(card.clock) !== band) return false;
      if (wantTag !== null && tagLabel(card.tag) !== wantTag) return false;
      if (!partyHit(card.party, party)) return false;
      if (lateOnly) {
        const wait = waitMinutes(card.clock, now);
        if (wait === null || wait <= 0 || !inTray(card, "waiting")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The clock orders the day. A blank clock stays at the end. Search stays on the note. */
export function arrivalTimeline(cards: readonly ArrivalCard[], query: string): ArrivalCard[] {
  const text = query.trim().toLowerCase();
  return readArrivals(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      const left = clockMinutes(a.clock);
      const right = clockMinutes(b.clock);
      if (left === null && right !== null) return 1;
      if (left !== null && right === null) return -1;
      if (left !== null && right !== null && left !== right) return left - right;
      return a.text.localeCompare(b.text);
    });
}

export function arrivalCounts(cards: readonly ArrivalCard[], now: unknown): ArrivalCounts {
  const rows = readArrivals(cards);
  return {
    waiting: rows.filter((card) => inTray(card, "waiting")).length,
    held: rows.filter((card) => inTray(card, "held")).length,
    greeted: rows.filter((card) => inTray(card, "greeted")).length,
    hush: rows.filter((card) => card.hush).length,
    late: rows.filter((card) => {
      const wait = waitMinutes(card.clock, now);
      return wait !== null && wait > 0 && inTray(card, "waiting");
    }).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function arrivalShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function arrivalDoors(cards: readonly ArrivalCard[]): string[] {
  const out: string[] = [];
  for (const card of readArrivals(cards)) {
    if (card.door && !out.includes(card.door)) out.push(card.door);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function arrivalTags(cards: readonly ArrivalCard[]): string[] {
  const out: string[] = [];
  for (const card of readArrivals(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function arrivalBands(cards: readonly ArrivalCard[]): ArrivalBand[] {
  const seen = new Set<ArrivalBand>();
  for (const card of readArrivals(cards)) seen.add(bandOf(card.clock));
  return BANDS.filter((band) => band !== "blank" && seen.has(band));
}

/** "all" and "blank" stay. A door that is no longer on a card falls back to all. */
export function activeDoor(filter: string, doors: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const door = doorLabel(filter);
  return door && doors.includes(door) ? door : "all";
}

export function doorArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return doorLabel(filter);
}

/** "all" and "blank" stay. A tag that is no longer on a card falls back to all. */
export function activeTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = tagLabel(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function tagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return tagLabel(filter);
}

/** "all" and "blank" stay. A band that is no longer on a card falls back to all. */
export function activeArrivalBand(filter: string, bands: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return bands.includes(filter) ? filter : "all";
}

export function arrivalBandArg(filter: string): ArrivalBand | null {
  if (filter === "blank") return "blank";
  if (filter === "morning" || filter === "afternoon" || filter === "evening") return filter;
  return null;
}

/** All, blank, solo, and crowd stay. Anything else is all. */
export function activeParty(filter: string): string {
  if (filter === "blank" || filter === "solo" || filter === "crowd") return filter;
  return "all";
}

export function partyArg(filter: string): PartyPick | null {
  return partyName(filter) || null;
}

/** Other cards with the same door and the same clock. A blank door or a blank clock clashes with nothing. */
export function arrivalClashIds(cards: readonly ArrivalCard[], id: string): string[] {
  const rows = readArrivals(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.door || clockMinutes(card.clock) === null) return [];
  return rows
    .filter((item) => item.id !== id && item.door === card.door && clockMinutes(item.clock) === clockMinutes(card.clock))
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next waiting card at or after the clock. After the last clock, the day wraps to the earliest waiting clock. */
export function nextArrival(cards: readonly ArrivalCard[], clock: unknown): string {
  const now = clockMinutes(clock);
  if (now === null) return "";
  const open = readArrivals(cards).filter((card) => inTray(card, "waiting") && clockMinutes(card.clock) !== null);
  if (!open.length) return "";
  const byClock = (a: ArrivalCard, b: ArrivalCard) => {
    const left = clockMinutes(a.clock) as number;
    const right = clockMinutes(b.clock) as number;
    return left - right || a.text.localeCompare(b.text);
  };
  const later = open.filter((card) => (clockMinutes(card.clock) as number) >= now).sort(byClock);
  if (later.length) return later[0].id;
  return open.slice().sort(byClock)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The wait uses the clock you pass. */
export function arrivalsCsv(raw: unknown, now: unknown): string {
  const lines = ["text,door,clock,party,tag,band,rank,held,greeted,hush,wait,audit"];
  for (const card of readArrivals(raw)) {
    const wait = waitMinutes(card.clock, now);
    lines.push([
      csvCell(card.text),
      csvCell(card.door),
      csvCell(card.clock),
      String(card.party),
      csvCell(card.tag),
      bandOf(card.clock),
      String(card.rank),
      card.held ? "1" : "0",
      card.greeted ? "1" : "0",
      card.hush ? "1" : "0",
      wait === null ? "" : String(wait),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function doorSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return doorLabel(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return tagLabel(raw) || "all";
}

function bandSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return bandName(raw) || "all";
}

function partySlot(raw: unknown): string {
  return partyName(raw) || "all";
}

export function readArrivalViews(raw: unknown): ArrivalView[] {
  if (!Array.isArray(raw)) return [];
  const out: ArrivalView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<ArrivalView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      door: doorSlot(row.door),
      band: bandSlot(row.band),
      tag: tagSlot(row.tag),
      party: partySlot(row.party),
    });
  }
  return out.slice(0, 12);
}

export function addArrivalView(
  views: readonly ArrivalView[],
  view: { id: string; name: string; tray: ArrivalTray; query: string; door: string; band: string; tag: string; party: string },
): ArrivalView[] {
  const current = readArrivalViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    door: doorSlot(view.door),
    band: bandSlot(view.band),
    tag: tagSlot(view.tag),
    party: partySlot(view.party),
  }].slice(0, 12);
}

export function dropArrivalView(views: readonly ArrivalView[], id: string): ArrivalView[] {
  return readArrivalViews(views).filter((view) => view.id !== id);
}

/**
 * The last city string. A language, a country, a registration country, a timezone,
 * a last country, a last region, a device, a browser, an operating system, a desk name,
 * a desk id, a campaign, a phone, a trading server, a trading group, a broker name,
 * an assignee, a sale status, a retention status, a potential status, a KYC status,
 * an account type, a role, a validation status, a referral code, or a profile city
 * is not a last city.
 */
export function cityText(value: CityValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 64);
  if (!value || typeof value !== "object") return "";
  if (CITY_BLOCK.some((key) => key in value)) return "";
  return typeof value.lastCity === "string" ? value.lastCity.replace(/\s+/g, " ").trim().slice(0, 64) : "";
}

/** The first A to Z letter. Any other last city uses a mark. A missing last city stays blank. */
export function initialOf(value: CityValue): string {
  const city = cityText(value);
  if (!city) return "";
  const first = city[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function initialLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function cityLines(rows: readonly CityRow[]): CityLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const city = cityText(row.lastCity);
    map.set(city, (map.get(city) || 0) + 1);
  }
  const out: CityLine[] = [];
  map.forEach((count, city) => out.push({ city, initial: initialOf(city), count }));
  return out.sort((a, b) => {
    if (!a.city) return -1;
    if (!b.city) return 1;
    return a.city.localeCompare(b.city);
  });
}

export function namedCities(rows: readonly CityRow[]): string[] {
  return cityLines(rows).map((line) => line.city).filter(Boolean);
}

export function initialLines(rows: readonly CityRow[]): InitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = initialOf(row.lastCity);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: InitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => {
    if (!a.initial && b.initial) return -1;
    if (a.initial && !b.initial) return 1;
    if (a.initial === "#" && b.initial !== "#") return 1;
    if (b.initial === "#" && a.initial !== "#") return -1;
    return a.initial.localeCompare(b.initial);
  });
}

export function namedInitials(rows: readonly CityRow[]): string[] {
  return initialLines(rows).map((line) => line.initial).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function cityShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named last city with the most loaded rows. A tie keeps the earlier name. */
export function leadingCity(rows: readonly CityRow[]): string {
  const named = cityLines(rows).filter((line) => line.city);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))[0].city;
}

/** The named initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingInitial(rows: readonly CityRow[]): string {
  const named = initialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

export function readHiddenCities(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => cityText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const city = cityText(String(item || ""));
    if (!city || !allow.has(city) || out.includes(city)) continue;
    out.push(city);
  }
  return out;
}

export function toggleCity(hidden: readonly string[], city: string, present: readonly string[]): string[] {
  const current = readHiddenCities(hidden, present);
  const next = cityText(city);
  if (!next || !present.map((item) => cityText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleCities(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenCities(hidden, present));
  return namedCities(present.map((lastCity) => ({ lastCity }))).filter((city) => (showHidden ? gone.has(city) : !gone.has(city)));
}

export function activeCity(selected: string, visible: readonly string[]): string {
  const city = cityText(selected);
  if (!city) return "";
  return visible.some((item) => cityText(item) === city) ? city : "";
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = filter === "#" ? "#" : initialLabel(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function initialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  if (filter === "#") return "#";
  return initialLabel(filter) || null;
}

/** Search stays on the name. The last city is not part of the query. */
export function visibleCityCustomers<T extends CityRow>(
  rows: readonly T[],
  city: string,
  blank: boolean,
  initial: string | null,
  query: string,
): T[] {
  const want = cityText(city);
  const wantInitial = initial === null ? null : initial === "#" ? "#" : initialLabel(initial);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = cityText(row.lastCity);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (wantInitial !== null && initialOf(got) !== wantInitial) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the last cities, initials, and counts on this page. */
export function citiesCsv(rows: readonly CityRow[]): string {
  const lines = ["city,initial,count"];
  for (const line of cityLines(rows)) lines.push([csvCell(line.city), csvCell(line.initial), String(line.count)].join(","));
  return lines.join("\n");
}
