/** Local key cards, and customer counts grouped by the last device already on each row. */

export const KEY_KEY = "crmv4-key-cards";
export const KEY_VIEW_KEY = "crmv4-key-views";
export const DEVICE_KEY = "crmv4-device-hide";

export type KeyRank = 0 | 1 | 2;

export type Wing = "north" | "east" | "south" | "west" | "blank";

export type KeyTray = "cut" | "issued" | "returned";

export type FloorPick = "blank" | "low" | "mid" | "high" | "g1" | "g2" | "g3" | "g4";

export type KeyCard = {
  id: string;
  text: string;
  guest: string;
  floor: number;
  wing: string;
  suite: string;
  tag: string;
  rank: KeyRank;
  issued: boolean;
  returned: boolean;
  spare: boolean;
  audit: string;
};

export type KeyView = {
  id: string;
  name: string;
  tray: KeyTray;
  query: string;
  guest: string;
  wing: string;
  tag: string;
  floor: string;
};

export type KeyCounts = {
  cut: number;
  issued: number;
  returned: number;
  spare: number;
  passed: number;
};

export type DeviceValue =
  | {
      lastDevice?: unknown;
      lastOs?: unknown;
      lastBrowser?: unknown;
      lastCity?: unknown;
      lastRegion?: unknown;
      lastCountry?: unknown;
      lastCountryName?: unknown;
      lastIp?: unknown;
      language?: unknown;
      country?: unknown;
      registrationCountry?: unknown;
      timezone?: unknown;
      address?: unknown;
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

export type DeviceRow = { lastDevice?: DeviceValue; label?: string | null };

export type DeviceLine = { device: string; className: string; initial: string; count: number };

export type DeviceClassLine = { className: string; count: number };

export type DeviceInitialLine = { initial: string; count: number };

export type DeviceClass = "" | "mobile" | "tablet" | "desktop" | "bot" | "other";

const AUDITS = ["save", "edit", "raise", "lower", "issue", "hold", "return", "reopen", "spare", "pair"] as const;

const WINGS = ["north", "east", "south", "west"] as const;

const CLASSES = ["", "mobile", "tablet", "desktop", "bot", "other"] as const;

const GROUPS = ["g1", "g2", "g3", "g4"] as const;

const DEVICE_BLOCK = [
  "lastOs",
  "lastBrowser",
  "lastCity",
  "lastRegion",
  "lastCountry",
  "lastCountryName",
  "lastIp",
  "language",
  "country",
  "registrationCountry",
  "timezone",
  "address",
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

function trayOf(raw: unknown): KeyTray {
  return raw === "issued" || raw === "returned" ? raw : "cut";
}

function rankOf(raw: unknown): KeyRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function wingName(raw: unknown): Exclude<Wing, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (WINGS as readonly string[]).includes(text) ? (text as Exclude<Wing, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function keyText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank guest stays blank. It is not filled in. */
export function guestLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank tag stays blank. It is not filled in. */
export function keyTag(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank suite stays blank. It is not filled in. */
export function suiteLabel(raw: unknown): string {
  return clip(raw, 8);
}

/** A floor is 1 through 12. A blank or any other value stays zero. */
export function floorCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return 0;
}

/** North, east, south, west, or blank. Anything else is blank. */
export function wingOf(raw: unknown): Wing {
  return wingName(raw) || "blank";
}

/** Low is 1 through 4. Mid is 5 through 8. High is 9 through 12. A zero floor is blank. */
export function floorBand(floor: unknown): "blank" | "low" | "mid" | "high" {
  const count = floorCount(floor);
  if (!count) return "blank";
  if (count <= 4) return "low";
  if (count <= 8) return "mid";
  return "high";
}

/** Four groups of three floors. A zero floor is blank. */
export function floorGroup(floor: unknown): "blank" | "g1" | "g2" | "g3" | "g4" {
  const count = floorCount(floor);
  if (!count) return "blank";
  const index = Math.min(3, Math.floor((count - 1) / 3));
  return GROUPS[index];
}

/** Floors from the card floor to the desk floor. A negative gap is still above. A zero floor stays empty. */
export function floorGap(floor: unknown, desk: unknown): number | null {
  const from = floorCount(floor);
  const at = floorCount(desk);
  if (!from || !at) return null;
  return at - from;
}

export function readKeys(raw: unknown): KeyCard[] {
  if (!Array.isArray(raw)) return [];
  const out: KeyCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KeyCard>;
    const id = String(row.id || "").trim();
    const text = keyText(row.text);
    if (!id || !text || out.some((card) => card.id === id)) continue;
    out.push({
      id,
      text,
      guest: guestLabel(row.guest),
      floor: floorCount(row.floor),
      wing: wingName(row.wing),
      suite: suiteLabel(row.suite),
      tag: keyTag(row.tag),
      rank: rankOf(row.rank),
      issued: row.issued === true,
      returned: row.returned === true,
      spare: row.spare === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addKey(
  cards: readonly KeyCard[],
  card: { id: string; text: string; guest?: string; floor?: unknown; wing?: string; suite?: string; tag?: string },
): KeyCard[] {
  const current = readKeys(cards);
  const id = String(card.id || "").trim();
  const text = keyText(card.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: KeyCard = {
    id,
    text,
    guest: guestLabel(card.guest),
    floor: floorCount(card.floor),
    wing: wingName(card.wing),
    suite: suiteLabel(card.suite),
    tag: keyTag(card.tag),
    rank: 0,
    issued: false,
    returned: false,
    spare: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepKeyRank(cards: readonly KeyCard[], id: string, dir: 1 | -1): KeyCard[] {
  return readKeys(cards).map((card) => {
    if (card.id !== id) return card;
    const next = rankOf(Math.min(2, Math.max(0, card.rank + dir)));
    if (next === card.rank) return card;
    return { ...card, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setKeyIssued(cards: readonly KeyCard[], id: string, issued: boolean): KeyCard[] {
  return readKeys(cards).map((card) => (card.id === id ? { ...card, issued, audit: issued ? "issue" : "hold" } : card));
}

export function setKeyReturned(cards: readonly KeyCard[], id: string, returned: boolean): KeyCard[] {
  return readKeys(cards).map((card) => (card.id === id ? { ...card, returned, audit: returned ? "return" : "reopen" } : card));
}

export function setKeySpare(cards: readonly KeyCard[], id: string, spare: boolean): KeyCard[] {
  return readKeys(cards).map((card) => (card.id === id ? { ...card, spare, audit: spare ? "spare" : "pair" } : card));
}

/** A blank edit is left out. A duplicate of another card is left out. */
export function editKey(cards: readonly KeyCard[], id: string, text: string): KeyCard[] {
  const current = readKeys(cards);
  const next = keyText(text);
  if (!next || current.some((card) => card.id !== id && card.text === next)) return current;
  return current.map((card) => (card.id === id && card.text !== next ? { ...card, text: next, audit: "edit" } : card));
}

export function bulkKeyIssued(cards: readonly KeyCard[], ids: readonly string[], issued: boolean): KeyCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKeys(cards).map((card) => (want.has(card.id) ? { ...card, issued, audit: issued ? "issue" : "hold" } : card));
}

export function bulkKeyReturned(cards: readonly KeyCard[], ids: readonly string[], returned: boolean): KeyCard[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readKeys(cards).map((card) => (want.has(card.id) ? { ...card, returned, audit: returned ? "return" : "reopen" } : card));
}

export function resetKeys(): KeyCard[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function keyCopy(raw: unknown): string {
  return keyText(raw);
}

function inTray(card: KeyCard, tray: KeyTray): boolean {
  if (tray === "returned") return card.returned;
  if (tray === "issued") return card.issued && !card.returned;
  return !card.issued && !card.returned;
}

function floorHit(floor: number, exact: number | null, band: FloorPick | null): boolean {
  if (exact !== null) return floor === exact;
  if (band === null) return true;
  if (band === "g1" || band === "g2" || band === "g3" || band === "g4") return floorGroup(floor) === band;
  return floorBand(floor) === band;
}

/** Search stays on the note. The guest, the floor, the wing, the suite, and the tag are not part of the query. */
export function visibleKeys(
  cards: readonly KeyCard[],
  tray: KeyTray,
  query: string,
  guest: string | null,
  wing: Wing | null,
  tag: string | null,
  exact: number | null,
  band: FloorPick | null,
  topOnly: boolean,
  passedOnly: boolean,
  desk: unknown,
): KeyCard[] {
  const text = query.trim().toLowerCase();
  const wantGuest = guest === null ? null : guestLabel(guest);
  const wantTag = tag === null ? null : keyTag(tag);
  return readKeys(cards)
    .filter((card) => {
      if (!inTray(card, tray)) return false;
      if (topOnly && card.rank !== 2) return false;
      if (wantGuest !== null && guestLabel(card.guest) !== wantGuest) return false;
      if (wing !== null && wingOf(card.wing) !== wing) return false;
      if (wantTag !== null && keyTag(card.tag) !== wantTag) return false;
      if (!floorHit(card.floor, exact, band)) return false;
      if (passedOnly) {
        const gap = floorGap(card.floor, desk);
        if (gap === null || gap <= 0 || !inTray(card, "cut")) return false;
      }
      return !text || card.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The floor orders the desk. A blank floor stays at the end. Search stays on the note. */
export function keyTimeline(cards: readonly KeyCard[], query: string): KeyCard[] {
  const text = query.trim().toLowerCase();
  return readKeys(cards)
    .filter((card) => !text || card.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (!a.floor && b.floor) return 1;
      if (a.floor && !b.floor) return -1;
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.text.localeCompare(b.text);
    });
}

export function keyCounts(cards: readonly KeyCard[], desk: unknown): KeyCounts {
  const rows = readKeys(cards);
  return {
    cut: rows.filter((card) => inTray(card, "cut")).length,
    issued: rows.filter((card) => inTray(card, "issued")).length,
    returned: rows.filter((card) => inTray(card, "returned")).length,
    spare: rows.filter((card) => card.spare).length,
    passed: rows.filter((card) => {
      const gap = floorGap(card.floor, desk);
      return gap !== null && gap > 0 && inTray(card, "cut");
    }).length,
  };
}

/** Share of the saved cards. A zero total stays at zero. */
export function keyShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function keyGuests(cards: readonly KeyCard[]): string[] {
  const out: string[] = [];
  for (const card of readKeys(cards)) {
    if (card.guest && !out.includes(card.guest)) out.push(card.guest);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function keyTags(cards: readonly KeyCard[]): string[] {
  const out: string[] = [];
  for (const card of readKeys(cards)) {
    if (card.tag && !out.includes(card.tag)) out.push(card.tag);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function keyWings(cards: readonly KeyCard[]): Exclude<Wing, "blank">[] {
  const seen = new Set<string>();
  for (const card of readKeys(cards)) if (card.wing) seen.add(card.wing);
  return WINGS.filter((wing) => seen.has(wing));
}

/** Four groups. The count is the cards whose floor falls in that group of three. */
export function floorCounts(cards: readonly KeyCard[]): number[] {
  const rows = readKeys(cards);
  return GROUPS.map((group) => rows.filter((card) => floorGroup(card.floor) === group).length);
}

/** "all" and "blank" stay. A guest that is no longer on a card falls back to all. */
export function activeGuest(filter: string, guests: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const guest = guestLabel(filter);
  return guest && guests.includes(guest) ? guest : "all";
}

export function guestArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return guestLabel(filter);
}

/** "all" and "blank" stay. A wing that is no longer on a card falls back to all. */
export function activeWing(filter: string, wings: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const wing = wingName(filter);
  return wing && wings.includes(wing) ? wing : "all";
}

export function wingArg(filter: string): Wing | null {
  if (filter === "blank") return "blank";
  return wingName(filter) || null;
}

/** "all" and "blank" stay. A tag that is no longer on a card falls back to all. */
export function activeKeyTag(filter: string, tags: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const tag = keyTag(filter);
  return tag && tags.includes(tag) ? tag : "all";
}

export function keyTagArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return keyTag(filter);
}

/** All, blank, low, mid, high, the four groups, and floors 1 through 12 stay. Anything else is all. */
export function activeFloor(filter: string): string {
  if (filter === "blank" || filter === "low" || filter === "mid" || filter === "high") return filter;
  if ((GROUPS as readonly string[]).includes(filter)) return filter;
  const floor = floorCount(filter);
  return floor ? String(floor) : "all";
}

export function floorArg(filter: string): { exact: number | null; band: FloorPick | null } {
  if (filter === "blank" || filter === "low" || filter === "mid" || filter === "high" || (GROUPS as readonly string[]).includes(filter)) {
    return { exact: null, band: filter as FloorPick };
  }
  const floor = floorCount(filter);
  return floor ? { exact: floor, band: null } : { exact: null, band: null };
}

/** Other cards with the same wing, the same floor, and the same suite. A blank wing, a zero floor, or a blank suite clashes with nothing. */
export function keyClashIds(cards: readonly KeyCard[], id: string): string[] {
  const rows = readKeys(cards);
  const card = rows.find((item) => item.id === id);
  if (!card || !card.wing || card.floor <= 0 || !card.suite) return [];
  return rows
    .filter((item) => item.id !== id && item.wing === card.wing && item.floor === card.floor && item.suite === card.suite)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next cut card at or after the floor. After the last floor, the desk wraps to the earliest cut floor. */
export function nextKey(cards: readonly KeyCard[], floor: unknown): string {
  const now = floorCount(floor);
  if (!now) return "";
  const cut = readKeys(cards).filter((card) => inTray(card, "cut") && card.floor > 0);
  if (!cut.length) return "";
  const byFloor = (a: KeyCard, b: KeyCard) => a.floor - b.floor || a.text.localeCompare(b.text);
  const later = cut.filter((card) => card.floor >= now).sort(byFloor);
  if (later.length) return later[0].id;
  return cut.slice().sort(byFloor)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the cards saved in this browser. The gap uses the floor you pass. */
export function keysCsv(raw: unknown, desk: unknown): string {
  const lines = ["text,guest,floor,wing,suite,tag,band,rank,issued,returned,spare,gap,audit"];
  for (const card of readKeys(raw)) {
    const gap = floorGap(card.floor, desk);
    lines.push([
      csvCell(card.text),
      csvCell(card.guest),
      String(card.floor),
      card.wing,
      csvCell(card.suite),
      csvCell(card.tag),
      floorBand(card.floor),
      String(card.rank),
      card.issued ? "1" : "0",
      card.returned ? "1" : "0",
      card.spare ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(card.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function guestSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return guestLabel(raw) || "all";
}

function wingSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return wingName(raw) || "all";
}

function tagSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return keyTag(raw) || "all";
}

function floorSlot(raw: unknown): string {
  return activeFloor(String(raw ?? ""));
}

export function readKeyViews(raw: unknown): KeyView[] {
  if (!Array.isArray(raw)) return [];
  const out: KeyView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<KeyView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      guest: guestSlot(row.guest),
      wing: wingSlot(row.wing),
      tag: tagSlot(row.tag),
      floor: floorSlot(row.floor),
    });
  }
  return out.slice(0, 12);
}

export function addKeyView(
  views: readonly KeyView[],
  view: { id: string; name: string; tray: KeyTray; query: string; guest: string; wing: string; tag: string; floor: string },
): KeyView[] {
  const current = readKeyViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    guest: guestSlot(view.guest),
    wing: wingSlot(view.wing),
    tag: tagSlot(view.tag),
    floor: floorSlot(view.floor),
  }].slice(0, 12);
}

export function dropKeyView(views: readonly KeyView[], id: string): KeyView[] {
  return readKeyViews(views).filter((view) => view.id !== id);
}

/**
 * The last device string. A last operating system, a last browser, a last city, a last region,
 * a last country, an address, a language, a country, a registration country, a timezone,
 * a desk name, a desk id, a campaign, a phone, a trading server, a trading group,
 * a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code,
 * or a profile city is not a device.
 */
export function deviceText(value: DeviceValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 32);
  if (!value || typeof value !== "object") return "";
  if (DEVICE_BLOCK.some((key) => key in value)) return "";
  return typeof value.lastDevice === "string" ? value.lastDevice.replace(/\s+/g, " ").trim().slice(0, 32) : "";
}

/** Mobile, tablet, desktop, bot, other, or blank. Tablet is read before mobile. */
export function deviceClassOf(value: DeviceValue): DeviceClass {
  const text = deviceText(value).toLowerCase();
  if (!text) return "";
  if (text.includes("tablet") || text.includes("ipad")) return "tablet";
  if (text.includes("bot") || text.includes("crawler") || text.includes("spider")) return "bot";
  if (text.includes("mobile") || text.includes("phone") || text.includes("iphone")) return "mobile";
  if (text.includes("desktop") || text.includes("macintosh") || text.includes("macbook") || /\bpc\b/.test(text)) return "desktop";
  return "other";
}

/** The first A to Z letter. Any other device uses a mark. A missing device stays blank. */
export function deviceInitialOf(value: DeviceValue): string {
  const device = deviceText(value);
  if (!device) return "";
  const first = device[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function deviceInitialLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function deviceLines(rows: readonly DeviceRow[]): DeviceLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const device = deviceText(row.lastDevice);
    map.set(device, (map.get(device) || 0) + 1);
  }
  const out: DeviceLine[] = [];
  map.forEach((count, device) => out.push({ device, className: deviceClassOf(device), initial: deviceInitialOf(device), count }));
  return out.sort((a, b) => {
    if (!a.device) return -1;
    if (!b.device) return 1;
    return a.device.localeCompare(b.device);
  });
}

export function namedDevices(rows: readonly DeviceRow[]): string[] {
  return deviceLines(rows).map((line) => line.device).filter(Boolean);
}

export function deviceClassLines(rows: readonly DeviceRow[]): DeviceClassLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const className = deviceClassOf(row.lastDevice);
    map.set(className, (map.get(className) || 0) + 1);
  }
  const out: DeviceClassLine[] = [];
  for (const className of CLASSES) {
    const count = map.get(className);
    if (count) out.push({ className, count });
  }
  return out;
}

export function namedDeviceClasses(rows: readonly DeviceRow[]): string[] {
  return deviceClassLines(rows).map((line) => line.className).filter(Boolean);
}

export function deviceInitialLines(rows: readonly DeviceRow[]): DeviceInitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = deviceInitialOf(row.lastDevice);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: DeviceInitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => {
    if (!a.initial && b.initial) return -1;
    if (a.initial && !b.initial) return 1;
    if (a.initial === "#" && b.initial !== "#") return 1;
    if (b.initial === "#" && a.initial !== "#") return -1;
    return a.initial.localeCompare(b.initial);
  });
}

export function namedDeviceInitials(rows: readonly DeviceRow[]): string[] {
  return deviceInitialLines(rows).map((line) => line.initial).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function deviceShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named device with the most loaded rows. A tie keeps the earlier name. */
export function leadingDevice(rows: readonly DeviceRow[]): string {
  const named = deviceLines(rows).filter((line) => line.device);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.device.localeCompare(b.device))[0].device;
}

/** The named class with the most loaded rows. A tie keeps the earlier name. A blank class is not a lead. */
export function leadingDeviceClass(rows: readonly DeviceRow[]): string {
  const named = deviceClassLines(rows).filter((line) => line.className);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.className.localeCompare(b.className))[0].className;
}

/** The named initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingDeviceInitial(rows: readonly DeviceRow[]): string {
  const named = deviceInitialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

export function readHiddenDevices(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => deviceText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const device = deviceText(String(item || ""));
    if (!device || !allow.has(device) || out.includes(device)) continue;
    out.push(device);
  }
  return out;
}

export function toggleDevice(hidden: readonly string[], device: string, present: readonly string[]): string[] {
  const current = readHiddenDevices(hidden, present);
  const next = deviceText(device);
  if (!next || !present.map((item) => deviceText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleDevices(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenDevices(hidden, present));
  return namedDevices(present.map((device) => ({ lastDevice: device }))).filter((device) => (showHidden ? gone.has(device) : !gone.has(device)));
}

export function activeDevice(selected: string, visible: readonly string[]): string {
  const device = deviceText(selected);
  if (!device) return "";
  return visible.some((item) => deviceText(item) === device) ? device : "";
}

/** "all" and "blank" stay. A class that is no longer loaded falls back to all. */
export function activeDeviceClass(filter: string, classes: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return classes.includes(filter) ? filter : "all";
}

export function deviceClassArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "mobile" || filter === "tablet" || filter === "desktop" || filter === "bot" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeDeviceInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = filter === "#" ? "#" : deviceInitialLabel(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function deviceInitialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const initial = filter === "#" ? "#" : deviceInitialLabel(filter);
  return initial || null;
}

/** Search stays on the name. The device is not part of the query. */
export function visibleDeviceCustomers<T extends DeviceRow>(
  rows: readonly T[],
  device: string,
  blank: boolean,
  className: string | null,
  initial: string | null,
  query: string,
): T[] {
  const want = deviceText(device);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = deviceText(row.lastDevice);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (className !== null && deviceClassOf(row.lastDevice) !== className) return false;
    if (initial !== null && deviceInitialOf(row.lastDevice) !== initial) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the devices, classes, initials, and counts on this page. */
export function devicesCsv(rows: readonly DeviceRow[]): string {
  const lines = ["device,class,initial,count"];
  for (const line of deviceLines(rows)) {
    lines.push([csvCell(line.device), line.className, line.initial, String(line.count)].join(","));
  }
  return lines.join("\n");
}
