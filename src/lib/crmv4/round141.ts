/** Local stack slips, and customer counts grouped by the address already on each row. */

export const SLIP_KEY = "crmv4-stack-slips";
export const SLIP_VIEW_KEY = "crmv4-stack-views";
export const ATLAS_KEY = "crmv4-atlas-hide";

export type SlipRank = 0 | 1 | 2;

export type Aisle = "oak" | "maple" | "walnut" | "ebony" | "blank";

export type SlipTray = "wait" | "loan" | "back";

export type BayPick = "blank" | "low" | "mid" | "high" | "g1" | "g2" | "g3" | "g4";

export type StackSlip = {
  id: string;
  text: string;
  reader: string;
  bay: number;
  aisle: string;
  shelf: string;
  ribbon: string;
  rank: SlipRank;
  loaned: boolean;
  returned: boolean;
  reserved: boolean;
  audit: string;
};

export type SlipView = {
  id: string;
  name: string;
  tray: SlipTray;
  query: string;
  reader: string;
  aisle: string;
  ribbon: string;
  bay: string;
};

export type SlipCounts = {
  wait: number;
  loan: number;
  back: number;
  reserved: number;
  passed: number;
};

export type AddressValue =
  | {
      address?: unknown;
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

export type AddressRow = { address?: AddressValue; label?: string | null };

export type AddressLine = { address: string; kind: string; initial: string; count: number };

export type AddressKindLine = { kind: string; count: number };

export type AddressInitialLine = { initial: string; count: number };

export type AddressKind = "" | "street" | "box" | "suite" | "other";

const AUDITS = ["save", "edit", "raise", "lower", "loan", "hold", "return", "reopen", "reserve", "release"] as const;

const AISLES = ["oak", "maple", "walnut", "ebony"] as const;

const KINDS = ["", "street", "box", "suite", "other"] as const;

const GROUPS = ["g1", "g2", "g3", "g4"] as const;

const ADDRESS_BLOCK = [
  "lastDevice",
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

function trayOf(raw: unknown): SlipTray {
  return raw === "loan" || raw === "back" ? raw : "wait";
}

function rankOf(raw: unknown): SlipRank {
  return raw === 1 || raw === 2 ? raw : 0;
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function aisleName(raw: unknown): Exclude<Aisle, "blank"> | "" {
  const text = clip(raw, 8).toLowerCase();
  return (AISLES as readonly string[]).includes(text) ? (text as Exclude<Aisle, "blank">) : "";
}

/** A blank note is left out. The saved text stays short. */
export function slipText(raw: unknown): string {
  return clip(raw, 80);
}

/** A blank reader stays blank. It is not filled in. */
export function readerLabel(raw: unknown): string {
  return clip(raw, 18);
}

/** A blank ribbon stays blank. It is not filled in. */
export function ribbonTag(raw: unknown): string {
  return clip(raw, 14);
}

/** A blank shelf stays blank. It is not filled in. */
export function shelfLabel(raw: unknown): string {
  return clip(raw, 8);
}

/** A bay is 1 through 12. A blank or any other value stays zero. */
export function bayCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1 && raw <= 12) return raw;
  if (typeof raw === "string" && /^(?:[1-9]|1[0-2])$/.test(raw.trim())) return Number(raw.trim());
  return 0;
}

/** Oak, maple, walnut, ebony, or blank. Anything else is blank. */
export function aisleOf(raw: unknown): Aisle {
  return aisleName(raw) || "blank";
}

/** Low is 1 through 4. Mid is 5 through 8. High is 9 through 12. A zero bay is blank. */
export function bayBand(bay: unknown): "blank" | "low" | "mid" | "high" {
  const count = bayCount(bay);
  if (!count) return "blank";
  if (count <= 4) return "low";
  if (count <= 8) return "mid";
  return "high";
}

/** Four groups of three bays. A zero bay is blank. */
export function bayGroup(bay: unknown): "blank" | "g1" | "g2" | "g3" | "g4" {
  const count = bayCount(bay);
  if (!count) return "blank";
  const index = Math.min(3, Math.floor((count - 1) / 3));
  return GROUPS[index];
}

/** Bays from the slip bay to the desk bay. A negative gap is still above. A zero bay stays empty. */
export function bayGap(bay: unknown, desk: unknown): number | null {
  const from = bayCount(bay);
  const at = bayCount(desk);
  if (!from || !at) return null;
  return at - from;
}

export function readSlips(raw: unknown): StackSlip[] {
  if (!Array.isArray(raw)) return [];
  const out: StackSlip[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<StackSlip>;
    const id = String(row.id || "").trim();
    const text = slipText(row.text);
    if (!id || !text || out.some((slip) => slip.id === id)) continue;
    out.push({
      id,
      text,
      reader: readerLabel(row.reader),
      bay: bayCount(row.bay),
      aisle: aisleName(row.aisle),
      shelf: shelfLabel(row.shelf),
      ribbon: ribbonTag(row.ribbon),
      rank: rankOf(row.rank),
      loaned: row.loaned === true,
      returned: row.returned === true,
      reserved: row.reserved === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, 36);
}

export function addSlip(
  slips: readonly StackSlip[],
  slip: { id: string; text: string; reader?: string; bay?: unknown; aisle?: string; shelf?: string; ribbon?: string },
): StackSlip[] {
  const current = readSlips(slips);
  const id = String(slip.id || "").trim();
  const text = slipText(slip.text);
  if (!id || !text || current.some((item) => item.id === id || item.text === text)) return current;
  const next: StackSlip = {
    id,
    text,
    reader: readerLabel(slip.reader),
    bay: bayCount(slip.bay),
    aisle: aisleName(slip.aisle),
    shelf: shelfLabel(slip.shelf),
    ribbon: ribbonTag(slip.ribbon),
    rank: 0,
    loaned: false,
    returned: false,
    reserved: false,
    audit: "save",
  };
  return [next, ...current].slice(0, 36);
}

export function stepSlipRank(slips: readonly StackSlip[], id: string, dir: 1 | -1): StackSlip[] {
  return readSlips(slips).map((slip) => {
    if (slip.id !== id) return slip;
    const next = rankOf(Math.min(2, Math.max(0, slip.rank + dir)));
    if (next === slip.rank) return slip;
    return { ...slip, rank: next, audit: dir > 0 ? "raise" : "lower" };
  });
}

export function setSlipLoaned(slips: readonly StackSlip[], id: string, loaned: boolean): StackSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, loaned, audit: loaned ? "loan" : "hold" } : slip));
}

export function setSlipReturned(slips: readonly StackSlip[], id: string, returned: boolean): StackSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, returned, audit: returned ? "return" : "reopen" } : slip));
}

export function setSlipReserved(slips: readonly StackSlip[], id: string, reserved: boolean): StackSlip[] {
  return readSlips(slips).map((slip) => (slip.id === id ? { ...slip, reserved, audit: reserved ? "reserve" : "release" } : slip));
}

/** A blank edit is left out. A duplicate of another slip is left out. */
export function editSlip(slips: readonly StackSlip[], id: string, text: string): StackSlip[] {
  const current = readSlips(slips);
  const next = slipText(text);
  if (!next || current.some((slip) => slip.id !== id && slip.text === next)) return current;
  return current.map((slip) => (slip.id === id && slip.text !== next ? { ...slip, text: next, audit: "edit" } : slip));
}

export function bulkSlipLoaned(slips: readonly StackSlip[], ids: readonly string[], loaned: boolean): StackSlip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(slips).map((slip) => (want.has(slip.id) ? { ...slip, loaned, audit: loaned ? "loan" : "hold" } : slip));
}

export function bulkSlipReturned(slips: readonly StackSlip[], ids: readonly string[], returned: boolean): StackSlip[] {
  const want = new Set(ids.map((id) => String(id || "").trim()).filter(Boolean));
  return readSlips(slips).map((slip) => (want.has(slip.id) ? { ...slip, returned, audit: returned ? "return" : "reopen" } : slip));
}

export function resetSlips(): StackSlip[] {
  return [];
}

/** Copy uses the note. A blank note copies nothing. */
export function slipCopy(raw: unknown): string {
  return slipText(raw);
}

function inTray(slip: StackSlip, tray: SlipTray): boolean {
  if (tray === "back") return slip.returned;
  if (tray === "loan") return slip.loaned && !slip.returned;
  return !slip.loaned && !slip.returned;
}

function bayHit(bay: number, exact: number | null, band: BayPick | null): boolean {
  if (exact !== null) return bay === exact;
  if (band === null) return true;
  if (band === "g1" || band === "g2" || band === "g3" || band === "g4") return bayGroup(bay) === band;
  return bayBand(bay) === band;
}

/** Search stays on the note. The reader, the bay, the aisle, the shelf, and the ribbon are not part of the query. */
export function visibleSlips(
  slips: readonly StackSlip[],
  tray: SlipTray,
  query: string,
  reader: string | null,
  aisle: Aisle | null,
  ribbon: string | null,
  exact: number | null,
  band: BayPick | null,
  topOnly: boolean,
  passedOnly: boolean,
  desk: unknown,
): StackSlip[] {
  const text = query.trim().toLowerCase();
  const wantReader = reader === null ? null : readerLabel(reader);
  const wantRibbon = ribbon === null ? null : ribbonTag(ribbon);
  return readSlips(slips)
    .filter((slip) => {
      if (!inTray(slip, tray)) return false;
      if (topOnly && slip.rank !== 2) return false;
      if (wantReader !== null && readerLabel(slip.reader) !== wantReader) return false;
      if (aisle !== null && aisleOf(slip.aisle) !== aisle) return false;
      if (wantRibbon !== null && ribbonTag(slip.ribbon) !== wantRibbon) return false;
      if (!bayHit(slip.bay, exact, band)) return false;
      if (passedOnly) {
        const gap = bayGap(slip.bay, desk);
        if (gap === null || gap <= 0 || !inTray(slip, "wait")) return false;
      }
      return !text || slip.text.toLowerCase().includes(text);
    })
    .sort((a, b) => {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return a.text.localeCompare(b.text);
    });
}

/** The bay orders the desk. A blank bay stays at the end. Search stays on the note. */
export function slipTimeline(slips: readonly StackSlip[], query: string): StackSlip[] {
  const text = query.trim().toLowerCase();
  return readSlips(slips)
    .filter((slip) => !text || slip.text.toLowerCase().includes(text))
    .sort((a, b) => {
      if (!a.bay && b.bay) return 1;
      if (a.bay && !b.bay) return -1;
      if (a.bay !== b.bay) return a.bay - b.bay;
      return a.text.localeCompare(b.text);
    });
}

export function slipCounts(slips: readonly StackSlip[], desk: unknown): SlipCounts {
  const rows = readSlips(slips);
  return {
    wait: rows.filter((slip) => inTray(slip, "wait")).length,
    loan: rows.filter((slip) => inTray(slip, "loan")).length,
    back: rows.filter((slip) => inTray(slip, "back")).length,
    reserved: rows.filter((slip) => slip.reserved).length,
    passed: rows.filter((slip) => {
      const gap = bayGap(slip.bay, desk);
      return gap !== null && gap > 0 && inTray(slip, "wait");
    }).length,
  };
}

/** Share of the saved slips. A zero total stays at zero. */
export function slipShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

export function slipReaders(slips: readonly StackSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.reader && !out.includes(slip.reader)) out.push(slip.reader);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function slipRibbons(slips: readonly StackSlip[]): string[] {
  const out: string[] = [];
  for (const slip of readSlips(slips)) {
    if (slip.ribbon && !out.includes(slip.ribbon)) out.push(slip.ribbon);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function slipAisles(slips: readonly StackSlip[]): Exclude<Aisle, "blank">[] {
  const seen = new Set<string>();
  for (const slip of readSlips(slips)) if (slip.aisle) seen.add(slip.aisle);
  return AISLES.filter((aisle) => seen.has(aisle));
}

/** Four groups. The count is the slips whose bay falls in that group of three. */
export function bayCounts(slips: readonly StackSlip[]): number[] {
  const rows = readSlips(slips);
  return GROUPS.map((group) => rows.filter((slip) => bayGroup(slip.bay) === group).length);
}

/** "all" and "blank" stay. A reader that is no longer on a slip falls back to all. */
export function activeReader(filter: string, readers: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const reader = readerLabel(filter);
  return reader && readers.includes(reader) ? reader : "all";
}

export function readerArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return readerLabel(filter);
}

/** "all" and "blank" stay. An aisle that is no longer on a slip falls back to all. */
export function activeAisle(filter: string, aisles: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const aisle = aisleName(filter);
  return aisle && aisles.includes(aisle) ? aisle : "all";
}

export function aisleArg(filter: string): Aisle | null {
  if (filter === "blank") return "blank";
  return aisleName(filter) || null;
}

/** "all" and "blank" stay. A ribbon that is no longer on a slip falls back to all. */
export function activeRibbon(filter: string, ribbons: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const ribbon = ribbonTag(filter);
  return ribbon && ribbons.includes(ribbon) ? ribbon : "all";
}

export function ribbonArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  return ribbonTag(filter);
}

/** All, blank, low, mid, high, the four groups, and bays 1 through 12 stay. Anything else is all. */
export function activeBay(filter: string): string {
  if (filter === "blank" || filter === "low" || filter === "mid" || filter === "high") return filter;
  if ((GROUPS as readonly string[]).includes(filter)) return filter;
  const bay = bayCount(filter);
  return bay ? String(bay) : "all";
}

export function bayArg(filter: string): { exact: number | null; band: BayPick | null } {
  if (filter === "blank" || filter === "low" || filter === "mid" || filter === "high" || (GROUPS as readonly string[]).includes(filter)) {
    return { exact: null, band: filter as BayPick };
  }
  const bay = bayCount(filter);
  return bay ? { exact: bay, band: null } : { exact: null, band: null };
}

/** Other slips with the same aisle, the same bay, and the same shelf. A blank aisle, a zero bay, or a blank shelf clashes with nothing. */
export function slipClashIds(slips: readonly StackSlip[], id: string): string[] {
  const rows = readSlips(slips);
  const slip = rows.find((item) => item.id === id);
  if (!slip || !slip.aisle || slip.bay <= 0 || !slip.shelf) return [];
  return rows
    .filter((item) => item.id !== id && item.aisle === slip.aisle && item.bay === slip.bay && item.shelf === slip.shelf)
    .sort((a, b) => a.text.localeCompare(b.text))
    .map((item) => item.id);
}

/** The next waiting slip at or after the bay. After the last bay, the desk wraps to the earliest waiting bay. */
export function nextSlip(slips: readonly StackSlip[], bay: unknown): string {
  const now = bayCount(bay);
  if (!now) return "";
  const waiting = readSlips(slips).filter((slip) => inTray(slip, "wait") && slip.bay > 0);
  if (!waiting.length) return "";
  const byBay = (a: StackSlip, b: StackSlip) => a.bay - b.bay || a.text.localeCompare(b.text);
  const later = waiting.filter((slip) => slip.bay >= now).sort(byBay);
  if (later.length) return later[0].id;
  return waiting.slice().sort(byBay)[0].id;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** The CSV is the slips saved in this browser. The gap uses the bay you pass. */
export function slipsCsv(raw: unknown, desk: unknown): string {
  const lines = ["text,reader,bay,aisle,shelf,ribbon,band,rank,loaned,returned,reserved,gap,audit"];
  for (const slip of readSlips(raw)) {
    const gap = bayGap(slip.bay, desk);
    lines.push([
      csvCell(slip.text),
      csvCell(slip.reader),
      String(slip.bay),
      slip.aisle,
      csvCell(slip.shelf),
      csvCell(slip.ribbon),
      bayBand(slip.bay),
      String(slip.rank),
      slip.loaned ? "1" : "0",
      slip.returned ? "1" : "0",
      slip.reserved ? "1" : "0",
      gap === null ? "" : String(gap),
      csvCell(slip.audit),
    ].join(","));
  }
  return lines.join("\n");
}

function readerSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return readerLabel(raw) || "all";
}

function aisleSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return aisleName(raw) || "all";
}

function ribbonSlot(raw: unknown): string {
  if (raw === "all" || raw === "blank") return raw;
  return ribbonTag(raw) || "all";
}

function baySlot(raw: unknown): string {
  return activeBay(String(raw ?? ""));
}

export function readSlipViews(raw: unknown): SlipView[] {
  if (!Array.isArray(raw)) return [];
  const out: SlipView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SlipView>;
    const id = String(row.id || "").trim();
    const name = clip(row.name, 24);
    if (!id || !name || out.some((view) => view.id === id || view.name === name)) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 80),
      reader: readerSlot(row.reader),
      aisle: aisleSlot(row.aisle),
      ribbon: ribbonSlot(row.ribbon),
      bay: baySlot(row.bay),
    });
  }
  return out.slice(0, 12);
}

export function addSlipView(
  views: readonly SlipView[],
  view: { id: string; name: string; tray: SlipTray; query: string; reader: string; aisle: string; ribbon: string; bay: string },
): SlipView[] {
  const current = readSlipViews(views);
  const id = String(view.id || "").trim();
  const name = clip(view.name, 24);
  if (!id || !name || current.some((item) => item.id === id || item.name === name)) return current;
  return [...current, {
    id,
    name,
    tray: trayOf(view.tray),
    query: clip(view.query, 80),
    reader: readerSlot(view.reader),
    aisle: aisleSlot(view.aisle),
    ribbon: ribbonSlot(view.ribbon),
    bay: baySlot(view.bay),
  }].slice(0, 12);
}

export function dropSlipView(views: readonly SlipView[], id: string): SlipView[] {
  return readSlipViews(views).filter((view) => view.id !== id);
}

/**
 * The address already on the trader row. A last device, a last operating system, a last browser,
 * a last city, a last region, a last country, a language, a country, a registration country,
 * a timezone, a desk name, a desk id, a campaign, a phone, a trading server, a trading group,
 * a broker name, an assignee, a sale status, a retention status, a potential status,
 * a KYC status, an account type, a role, a validation status, a referral code,
 * or a profile city is not an address.
 */
export function addressText(value: AddressValue): string {
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 48);
  if (!value || typeof value !== "object") return "";
  if (ADDRESS_BLOCK.some((key) => key in value)) return "";
  return typeof value.address === "string" ? value.address.replace(/\s+/g, " ").trim().slice(0, 48) : "";
}

/** Street, box, suite, other, or blank. A box is read before a suite, and a suite before a street. */
export function addressKindOf(value: AddressValue): AddressKind {
  const text = addressText(value).toLowerCase();
  if (!text) return "";
  if (/\bbox\b/.test(text) || /p\.?\s*o\b/.test(text)) return "box";
  if (/\b(?:suite|apt|unit|flat)\b/.test(text)) return "suite";
  if (/^\d/.test(text) || /\b(?:street|avenue|road|lane)\b/.test(text)) return "street";
  return "other";
}

/** The first A to Z letter. Any other address uses a mark. A missing address stays blank. */
export function addressInitialOf(value: AddressValue): string {
  const address = addressText(value);
  if (!address) return "";
  const first = address[0].toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}

export function addressInitialLabel(raw: unknown): string {
  const text = clip(raw, 1).toUpperCase();
  if (text === "#") return "#";
  return /^[A-Z]$/.test(text) ? text : "";
}

export function addressLines(rows: readonly AddressRow[]): AddressLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const address = addressText(row.address);
    map.set(address, (map.get(address) || 0) + 1);
  }
  const out: AddressLine[] = [];
  map.forEach((count, address) => out.push({ address, kind: addressKindOf(address), initial: addressInitialOf(address), count }));
  return out.sort((a, b) => {
    if (!a.address) return -1;
    if (!b.address) return 1;
    return a.address.localeCompare(b.address);
  });
}

export function namedAddresses(rows: readonly AddressRow[]): string[] {
  return addressLines(rows).map((line) => line.address).filter(Boolean);
}

export function addressKindLines(rows: readonly AddressRow[]): AddressKindLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const kind = addressKindOf(row.address);
    map.set(kind, (map.get(kind) || 0) + 1);
  }
  const out: AddressKindLine[] = [];
  for (const kind of KINDS) {
    const count = map.get(kind);
    if (count) out.push({ kind, count });
  }
  return out;
}

export function namedAddressKinds(rows: readonly AddressRow[]): string[] {
  return addressKindLines(rows).map((line) => line.kind).filter(Boolean);
}

export function addressInitialLines(rows: readonly AddressRow[]): AddressInitialLine[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const initial = addressInitialOf(row.address);
    map.set(initial, (map.get(initial) || 0) + 1);
  }
  const out: AddressInitialLine[] = [];
  map.forEach((count, initial) => out.push({ initial, count }));
  return out.sort((a, b) => {
    if (!a.initial && b.initial) return -1;
    if (a.initial && !b.initial) return 1;
    if (a.initial === "#" && b.initial !== "#") return 1;
    if (b.initial === "#" && a.initial !== "#") return -1;
    return a.initial.localeCompare(b.initial);
  });
}

export function namedAddressInitials(rows: readonly AddressRow[]): string[] {
  return addressInitialLines(rows).map((line) => line.initial).filter(Boolean);
}

/** Share of the loaded rows. A zero total stays at zero. */
export function addressShare(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return Math.round((count / total) * 100);
}

/** The named address with the most loaded rows. A tie keeps the earlier name. */
export function leadingAddress(rows: readonly AddressRow[]): string {
  const named = addressLines(rows).filter((line) => line.address);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.address.localeCompare(b.address))[0].address;
}

/** The named kind with the most loaded rows. A tie keeps the earlier name. A blank kind is not a lead. */
export function leadingAddressKind(rows: readonly AddressRow[]): string {
  const named = addressKindLines(rows).filter((line) => line.kind);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind))[0].kind;
}

/** The named initial with the most loaded rows. A tie keeps the earlier letter. A blank initial is not a lead. */
export function leadingAddressInitial(rows: readonly AddressRow[]): string {
  const named = addressInitialLines(rows).filter((line) => line.initial);
  if (!named.length) return "";
  return named.slice().sort((a, b) => b.count - a.count || a.initial.localeCompare(b.initial))[0].initial;
}

export function readHiddenAddresses(raw: unknown, present: readonly string[]): string[] {
  const allow = new Set(present.map((item) => addressText(item)).filter(Boolean));
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const address = addressText(String(item || ""));
    if (!address || !allow.has(address) || out.includes(address)) continue;
    out.push(address);
  }
  return out;
}

export function toggleAddress(hidden: readonly string[], address: string, present: readonly string[]): string[] {
  const current = readHiddenAddresses(hidden, present);
  const next = addressText(address);
  if (!next || !present.map((item) => addressText(item)).includes(next)) return current;
  return current.includes(next) ? current.filter((item) => item !== next) : [...current, next];
}

export function visibleAddresses(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  const gone = new Set(readHiddenAddresses(hidden, present));
  return namedAddresses(present.map((address) => ({ address }))).filter((address) => (showHidden ? gone.has(address) : !gone.has(address)));
}

export function activeAddress(selected: string, visible: readonly string[]): string {
  const address = addressText(selected);
  if (!address) return "";
  return visible.some((item) => addressText(item) === address) ? address : "";
}

/** "all" and "blank" stay. A kind that is no longer loaded falls back to all. */
export function activeAddressKind(filter: string, kinds: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  return kinds.includes(filter) ? filter : "all";
}

export function addressKindArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (filter === "street" || filter === "box" || filter === "suite" || filter === "other") return filter;
  return null;
}

/** "all" and "blank" stay. An initial that is no longer loaded falls back to all. */
export function activeAddressInitial(filter: string, initials: readonly string[]): string {
  if (filter === "all" || filter === "blank") return filter;
  const initial = filter === "#" ? "#" : addressInitialLabel(filter);
  return initial && initials.includes(initial) ? initial : "all";
}

export function addressInitialArg(filter: string): string | null {
  if (filter === "blank") return "";
  if (!filter || filter === "all") return null;
  const initial = filter === "#" ? "#" : addressInitialLabel(filter);
  return initial || null;
}

/** Search stays on the name. The address is not part of the query. */
export function visibleAddressCustomers<T extends AddressRow>(
  rows: readonly T[],
  address: string,
  blank: boolean,
  kind: string | null,
  initial: string | null,
  query: string,
): T[] {
  const want = addressText(address);
  const text = query.trim().toLowerCase();
  return rows.filter((row) => {
    const got = addressText(row.address);
    if (blank) {
      if (got) return false;
    } else if (want && got !== want) return false;
    if (kind !== null && addressKindOf(row.address) !== kind) return false;
    if (initial !== null && addressInitialOf(row.address) !== initial) return false;
    if (!text) return true;
    return String(row.label || "").toLowerCase().includes(text);
  });
}

/** The CSV is the addresses, kinds, initials, and counts on this page. */
export function addressesCsv(rows: readonly AddressRow[]): string {
  const lines = ["address,kind,initial,count"];
  for (const line of addressLines(rows)) {
    lines.push([csvCell(line.address), line.kind, line.initial, String(line.count)].join(","));
  }
  return lines.join("\n");
}
