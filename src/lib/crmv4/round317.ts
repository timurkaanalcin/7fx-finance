/**
 * Sandglass rules for a glass kept in this browser, and periplus plates read the country already stored on the account.
 * Glasses are bulb, neck, waist, and foot. Sands are gilt, ivory, and slate.
 * Grains are 3, 9, 15, or 30. Turns are 1, 5, or 7.
 * A known coast is HOME, PORT, ROAD, or FAIR. A ridge contains a hyphen. A gulf has a space.
 * An islet is three characters or fewer. An ocean is ten characters or longer. A cipher contains a number.
 * A true country reads as HOME. A false country reads as CLOSED COAST.
 * Money fields are not read. The password itself is not read.
 * Persistence stays in this browser. Future tables are proposals only and are not applied:
 * CREATE TABLE crm_sandglass (
 *   id text primary key,
 *   title text not null,
 *   note text not null default '',
 *   runner text not null default '',
 *   glass text not null default '',
 *   grain_no integer,
 *   sand text not null default '',
 *   turn_no integer not null default 1,
 *   tags text not null default '',
 *   run boolean not null default false,
 *   hooked boolean not null default false,
 *   chested boolean not null default false,
 *   starred boolean not null default false,
 *   audit text not null default ''
 * );
 * CREATE TABLE crm_periplus_hide (
 *   lane text primary key
 * );
 * CREATE TABLE crm_periplus_review (
 *   trader_id text primary key
 * );
 */



export const SNG_KEY = "crmv4-sandglass";
export const SNG_VIEW_KEY = "crmv4-sandglass-views";
export const SNG_DENSITY_KEY = "crmv4-sandglass-density";
export const SNG_GLASSES = ["bulb", "neck", "waist", "foot"] as const;

export type SandglassGlass = (typeof SNG_GLASSES)[number];

export type SandglassSand = "blank" | "gilt" | "ivory" | "slate";

export type SandglassTray = "table" | "hook" | "chest";

export type SandglassDensity = "broad" | "tight";

export type SandglassSort = "glass" | "runner";

export type Sandglass = {
  id: string;
  title: string;
  note: string;
  runner: string;
  glass: string;
  grain: number | null;
  sand: string;
  turn: number;
  tags: string[];
  run: boolean;
  hooked: boolean;
  chested: boolean;
  starred: boolean;
  audit: string;
};

export type SandglassView = {
  id: string;
  name: string;
  tray: SandglassTray;
  query: string;
  runner: string;
  sand: string;
  glass: string;
  grain: string;
  turn: string;
};

export type SandglassCounts = {
  table: number;
  hook: number;
  chest: number;
  run: number;
  inner: number;
  outer: number;
  wide: number;
  house: number;
  grain: number;
  matched: number;
  starred: number;
  idle: number;
  brisk: number;
  resting: number;
  overdue: number;
  pair: number;
};

export const ROUND317_FEATURES = [
  "sandglass-save",
  "notes",
  "glass-parts",
  "gilt-sand",
  "grain-sla",
  "chest",
  "star",
  "inline-edit",
  "filters",
  "saved-views",
  "density",
  "runner-sort",
  "desk-kpis",
  "part-chart",
  "grain-timeline",
  "bulk-actions",
  "csv-export",
  "shortcuts",
  "audit",
  "fair-runner",
  "viewer-role",
  "suggest",
  "overdue-reminders",
  "coast-periplus",
  "periplus-csv",
] as const;

const AUDITS = ["save", "edit", "note", "sand", "set", "clear", "hook", "resume", "chest", "open", "tag", "turn", "grain", "lower", "star"] as const;

const SANDS = ["gilt", "ivory", "slate"] as const;

const GRAIN_CYCLE = [3, 9, 15, 30] as const;

const TURN_CYCLE = [1, 5, 7] as const;

const INNER = new Set(["bulb", "neck"]);

const OUTER = new Set(["waist", "foot"]);

const HOUSE_SAND = new Set(["GILT", "SLATE"]);

const HOME_COASTS = new Set(["HOME", "PORT", "ROAD", "FAIR"]);

const BLOCKED = ["deposits", "amount", "profit", "volume", "currency", "balance"];

const CARD_CAP = 20;

const VIEW_CAP = 5;

const TAG_CAP = 2;

function clip(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function trayOf(raw: unknown): SandglassTray {
  return raw === "hook" || raw === "chest" ? raw : "table";
}

function auditCode(raw: unknown): string {
  const code = clip(raw, 16);
  return (AUDITS as readonly string[]).includes(code) ? code : "";
}

function sandName(raw: unknown): Exclude<SandglassSand, "blank"> | "" {
  const text = clip(raw, 12).toLowerCase();
  return (SANDS as readonly string[]).includes(text) ? (text as Exclude<SandglassSand, "blank">) : "";
}

function tagsOf(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw : String(raw ?? "").split(/[\s,]+/);
  const out: string[] = [];
  for (const part of parts) {
    const tag = clip(part, 1).toLowerCase();
    if (!/^[xy]$/.test(tag) || out.includes(tag)) continue;
    out.push(tag);
    if (out.length === TAG_CAP) break;
  }
  return out;
}

function inTray(card: Sandglass, tray: SandglassTray): boolean {
  if (tray === "hook") return card.hooked && !card.chested;
  if (tray === "chest") return card.chested;
  return !card.hooked && !card.chested;
}

function csvCell(raw: string): string {
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function glassIndex(glass: string): number {
  return SNG_GLASSES.indexOf(glass as SandglassGlass);
}

function grainIndex(grain: number): number {
  return GRAIN_CYCLE.indexOf(grain as (typeof GRAIN_CYCLE)[number]);
}

function turnIndex(turn: number): number {
  return TURN_CYCLE.indexOf(turn as (typeof TURN_CYCLE)[number]);
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

export function sandglassGlass(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  return (SNG_GLASSES as readonly string[]).includes(text) ? text : "";
}

/** A grain is 3, 9, 15, or 30. Anything else stays blank. */
export function sandglassGrain(raw: unknown): 3 | 9 | 15 | 30 | null {
  const text = wholeToken(raw);
  if (text !== "3" && text !== "9" && text !== "15" && text !== "30") return null;
  return Number(text) as 3 | 9 | 15 | 30;
}

/** A turn is 1, 5, or 7. Anything else stays blank. */
export function sandglassTurn(raw: unknown): 1 | 5 | 7 | null {
  const text = wholeToken(raw);
  if (text !== "1" && text !== "5" && text !== "7") return null;
  return Number(text) as 1 | 5 | 7;
}

/** A sand is gilt, ivory, or slate. The saved name is the upper token. */
export function sandglassSand(raw: unknown): string {
  const text = sandName(raw);
  return text ? text.toUpperCase() : "";
}

export function sandglassInner(glass: unknown): boolean {
  return INNER.has(clip(glass, 12).toLowerCase());
}

export function sandglassOuter(glass: unknown): boolean {
  return OUTER.has(clip(glass, 12).toLowerCase());
}

/** Bulb is the crown. Neck is the throat. Waist is the pinch. Foot is the stand. */
export function sandglassBand(glass: unknown): string {
  const text = sandglassGlass(glass);
  if (!text) return "";
  if (text === "bulb") return "crown";
  if (text === "neck") return "throat";
  if (text === "waist") return "pinch";
  return "stand";
}

/** Signed distance from one glass to another along the sandglass. */
export function sandglassGap(from: unknown, to: unknown): number | null {
  const left = glassIndex(sandglassGlass(from));
  const right = glassIndex(sandglassGlass(to));
  if (left < 0 || right < 0) return null;
  return right - left;
}

export function houseSand(sand: unknown): boolean {
  return HOUSE_SAND.has(sandglassSand(sand));
}

/** A pair turn is 5. One and seven are not a pair. */
export function pairTurn(turn: unknown): boolean {
  return sandglassTurn(turn) === 5;
}

/** A full turn is 7. */
export function fullTurn(turn: unknown): boolean {
  return sandglassTurn(turn) === 7;
}

export function activeGlass(raw: unknown): string {
  const text = clip(raw, 12).toLowerCase();
  if (text === "inner" || text === "outer") return text;
  return sandglassGlass(text) || "all";
}

export function activeGrain(raw: unknown): string {
  const grain = sandglassGrain(raw);
  return grain === null ? "all" : String(grain);
}

export function activeSand(raw: unknown, allow: readonly string[]): string {
  const text = sandglassSand(raw);
  return text && allow.includes(text) ? text : "all";
}

export function activeTurn(raw: unknown): string {
  const turn = sandglassTurn(raw);
  return turn === null ? "all" : String(turn);
}

export function moveSandglassFocus(index: number, length: number, step: number): number {
  if (length <= 0) return 0;
  return (index + step + length) % length;
}

/** The sand the table uses least. A tie keeps ivory, then gilt, then slate. */
export function suggestSand(cards: readonly Sandglass[]): string {
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!inTray(card, "table") || !card.sand) continue;
    counts.set(card.sand, (counts.get(card.sand) || 0) + 1);
  }
  let best = "IVORY";
  let score = Number.POSITIVE_INFINITY;
  for (const sand of ["IVORY", "GILT", "SLATE"]) {
    const count = counts.get(sand) || 0;
    if (count < score) {
      best = sand;
      score = count;
    }
  }
  return best;
}

/** Before six, suggest three. Morning asks for nine. Afternoon asks for fifteen. Evening asks for thirty. A saved grain on the table wins, and a tie keeps the taller grain. */
export function suggestGrain(cards: readonly Sandglass[], hour: number): 3 | 9 | 15 | 30 {
  const counts = new Map<number, number>();
  let seen = false;
  for (const card of cards) {
    if (!inTray(card, "table") || card.grain === null) continue;
    seen = true;
    counts.set(card.grain, (counts.get(card.grain) || 0) + 1);
  }
  if (seen) {
    let best: 3 | 9 | 15 | 30 = 30;
    let score = Number.POSITIVE_INFINITY;
    for (const grain of [...GRAIN_CYCLE].reverse()) {
      const count = counts.get(grain) || 0;
      if (count < score) {
        best = grain;
        score = count;
      }
    }
    return best;
  }
  if (hour < 6) return 3;
  if (hour < 12) return 9;
  if (hour < 18) return 15;
  return 30;
}

/** Before six, suggest the bulb. The rest of the day suggests the foot. */
export function suggestGlass(hour: number): SandglassGlass {
  return hour < 6 ? "bulb" : "foot";
}

/** The runner with the fewest unrun glasses on the table. A tie keeps the roster order. */
export function fairRunner(cards: readonly Sandglass[], roster: string): string {
  const names = roster.split(",").map((item) => clip(item, 24)).filter(Boolean);
  if (!names.length) return "";
  const open = cards.filter((card) => inTray(card, "table") && !card.run);
  let best = names[0];
  let score = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const count = open.filter((card) => card.runner.toLowerCase() === name.toLowerCase()).length;
    if (count < score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function readSandglassRules(raw: unknown): Sandglass[] {
  if (!Array.isArray(raw)) return [];
  const out: Sandglass[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<Sandglass>;
    const id = clip(row.id, 40);
    const title = lineOf(row.title);
    if (!id || !title || out.some((card) => card.id === id || card.title === title)) continue;
    out.push({
      id,
      title,
      note: noteOf(row.note),
      runner: clip(row.runner, 24),
      glass: sandglassGlass(row.glass),
      grain: sandglassGrain(row.grain),
      sand: sandglassSand(row.sand),
      turn: sandglassTurn(row.turn) ?? 1,
      tags: tagsOf(row.tags),
      run: row.run === true,
      hooked: row.hooked === true,
      chested: row.chested === true,
      starred: row.starred === true,
      audit: auditCode(row.audit),
    });
  }
  return out.slice(0, CARD_CAP);
}

export function addSandglass(
  cards: readonly Sandglass[],
  card: {
    id?: string;
    title?: string;
    note?: string;
    runner?: string;
    glass?: string;
    grain?: unknown;
    sand?: string;
    turn?: unknown;
    tags?: unknown;
  },
): Sandglass[] {
  const title = lineOf(card.title);
  const id = clip(card.id, 40) || `g${Date.now().toString(36)}`;
  if (!title || cards.some((item) => item.id === id || item.title === title) || cards.length >= CARD_CAP) return [...cards];
  return readSandglassRules([
    ...cards,
    {
      id,
      title,
      note: noteOf(card.note),
      runner: clip(card.runner, 24),
      glass: sandglassGlass(card.glass),
      grain: sandglassGrain(card.grain),
      sand: sandglassSand(card.sand),
      turn: sandglassTurn(card.turn) ?? 1,
      tags: tagsOf(card.tags),
      run: false,
      hooked: false,
      chested: false,
      starred: false,
      audit: "save",
    },
  ]);
}

function mapCard(cards: readonly Sandglass[], id: string, edit: (card: Sandglass) => Sandglass): Sandglass[] {
  return cards.map((card) => (card.id === id ? edit(card) : card));
}

export function editSandglass(cards: readonly Sandglass[], id: string, title: string): Sandglass[] {
  const next = lineOf(title);
  if (!next || cards.some((card) => card.id !== id && card.title === next)) return [...cards];
  return mapCard(cards, id, (card) => (card.title === next ? card : { ...card, title: next, audit: "edit" }));
}

export function editSandglassNote(cards: readonly Sandglass[], id: string, note: string): Sandglass[] {
  const next = noteOf(note);
  return mapCard(cards, id, (card) => (card.note === next ? card : { ...card, note: next, audit: "note" }));
}

export function cycleSand(sand: string): string {
  const order = ["", "GILT", "IVORY", "SLATE"];
  const index = order.indexOf(sandglassSand(sand));
  return order[(index + 1) % order.length] || "GILT";
}

export function setSandglassSand(cards: readonly Sandglass[], id: string, sand: string): Sandglass[] {
  const next = sandglassSand(sand);
  return mapCard(cards, id, (card) => (card.sand === next ? card : { ...card, sand: next, audit: "sand" }));
}

export function setSandglassRun(cards: readonly Sandglass[], id: string, run: boolean): Sandglass[] {
  return mapCard(cards, id, (card) => (card.run === run ? card : { ...card, run, audit: run ? "set" : "clear" }));
}

export function setSandglassHook(cards: readonly Sandglass[], id: string, hooked: boolean): Sandglass[] {
  return mapCard(cards, id, (card) => (card.hooked === hooked ? card : { ...card, hooked, chested: hooked ? false : card.chested, audit: hooked ? "hook" : "resume" }));
}

export function setSandglassChest(cards: readonly Sandglass[], id: string, chested: boolean): Sandglass[] {
  return mapCard(cards, id, (card) => (card.chested === chested ? card : { ...card, chested, hooked: chested ? false : card.hooked, audit: chested ? "chest" : "open" }));
}

export function setSandglassStar(cards: readonly Sandglass[], id: string, starred: boolean): Sandglass[] {
  return mapCard(cards, id, (card) => (card.starred === starred ? card : { ...card, starred, audit: "star" }));
}

export function addSandglassTag(cards: readonly Sandglass[], id: string, tag: string): Sandglass[] {
  const next = tagsOf(tag)[0];
  if (!next) return [...cards];
  return mapCard(cards, id, (card) => {
    if (card.tags.includes(next)) return { ...card, tags: card.tags.filter((item) => item !== next), audit: "tag" };
    return { ...card, tags: tagsOf([...card.tags, next]), audit: "tag" };
  });
}

function stepGrain(grain: number | null, dir: 1 | -1): 3 | 9 | 15 | 30 {
  if (grain === null) return dir > 0 ? 3 : 30;
  const index = grainIndex(grain);
  const next = index < 0 ? 0 : (index + dir + GRAIN_CYCLE.length) % GRAIN_CYCLE.length;
  return GRAIN_CYCLE[next];
}

function stepTurn(turn: number, dir: 1 | -1): 1 | 5 | 7 {
  const index = turnIndex(turn);
  const next = index < 0 ? 0 : (index + dir + TURN_CYCLE.length) % TURN_CYCLE.length;
  return TURN_CYCLE[next];
}

export function liftGrain(cards: readonly Sandglass[], id: string): Sandglass[] {
  return mapCard(cards, id, (card) => ({ ...card, grain: stepGrain(card.grain, 1), audit: "grain" }));
}

export function lowerGrain(cards: readonly Sandglass[], id: string): Sandglass[] {
  return mapCard(cards, id, (card) => ({ ...card, grain: stepGrain(card.grain, -1), audit: "lower" }));
}

export function raiseTurn(cards: readonly Sandglass[], id: string): Sandglass[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, 1), audit: "turn" }));
}

export function lowerTurn(cards: readonly Sandglass[], id: string): Sandglass[] {
  return mapCard(cards, id, (card) => ({ ...card, turn: stepTurn(card.turn, -1), audit: "turn" }));
}

export function setSandglassFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return id ? mapCard(cards, id, (card) => ({ ...card, run: !card.run, audit: card.run ? "clear" : "set" })) : [...cards];
}

export function hookSandglassFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return setSandglassHook(cards, id, !cards.find((card) => card.id === id)?.hooked);
}

export function starSandglassFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return setSandglassStar(cards, id, !cards.find((card) => card.id === id)?.starred);
}

export function tagSandglassFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return addSandglassTag(cards, id, "x");
}

export function sandFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  const card = cards.find((item) => item.id === id);
  return card ? setSandglassSand(cards, id, cycleSand(card.sand)) : [...cards];
}

export function liftGrainFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return liftGrain(cards, id);
}

export function lowerGrainFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return lowerGrain(cards, id);
}

export function raiseTurnFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return raiseTurn(cards, id);
}

export function lowerTurnFocused(cards: readonly Sandglass[], id: string): Sandglass[] {
  return lowerTurn(cards, id);
}

function bulk(cards: readonly Sandglass[], ids: readonly string[], edit: (card: Sandglass) => Sandglass): Sandglass[] {
  const want = new Set(ids);
  return cards.map((card) => (want.has(card.id) ? edit(card) : card));
}

export function bulkSandglassSlate(cards: readonly Sandglass[], ids: readonly string[]): Sandglass[] {
  return bulk(cards, ids, (card) => (card.sand === "SLATE" ? card : { ...card, sand: "SLATE", audit: "sand" }));
}

export function bulkSandglassRun(cards: readonly Sandglass[], ids: readonly string[]): Sandglass[] {
  return bulk(cards, ids, (card) => (card.run ? card : { ...card, run: true, audit: "set" }));
}

export function bulkSandglassChest(cards: readonly Sandglass[], ids: readonly string[]): Sandglass[] {
  return bulk(cards, ids, (card) => (card.chested ? card : { ...card, chested: true, hooked: false, audit: "chest" }));
}

export function bulkSandglassTag(cards: readonly Sandglass[], ids: readonly string[]): Sandglass[] {
  return bulk(cards, ids, (card) => (card.tags.includes("y") ? card : { ...card, tags: tagsOf([...card.tags, "y"]), audit: "tag" }));
}

export function readSandglassViews(raw: unknown): SandglassView[] {
  if (!Array.isArray(raw)) return [];
  const out: SandglassView[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<SandglassView>;
    const id = clip(row.id, 40);
    const name = lineOf(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      tray: trayOf(row.tray),
      query: clip(row.query, 40),
      runner: clip(row.runner, 24),
      sand: activeSand(row.sand, ["GILT", "IVORY", "SLATE"]),
      glass: activeGlass(row.glass),
      grain: activeGrain(row.grain),
      turn: activeTurn(row.turn),
    });
  }
  return out.slice(0, VIEW_CAP);
}

export function addSandglassView(views: readonly SandglassView[], view: SandglassView): SandglassView[] {
  const name = lineOf(view.name);
  const id = clip(view.id, 40);
  if (!name || !id || views.some((item) => item.id === id || item.name === name) || views.length >= VIEW_CAP) return [...views];
  return readSandglassViews([...views, { ...view, id, name }]);
}

export function dropSandglassView(views: readonly SandglassView[], id: string): SandglassView[] {
  return views.filter((view) => view.id !== id);
}

export function sandglassDensity(raw: unknown): SandglassDensity {
  return raw === "tight" ? "tight" : "broad";
}

export function sortSandglassRules(cards: readonly Sandglass[], sort: SandglassSort): Sandglass[] {
  const next = [...cards];
  next.sort((a, b) => {
    if (sort === "runner") {
      const runner = a.runner.localeCompare(b.runner);
      if (runner) return runner;
    } else {
      const glass = glassIndex(a.glass) - glassIndex(b.glass);
      if (glass) return glass;
    }
    return a.title.localeCompare(b.title);
  });
  return next;
}

export function visibleSandglassRules(
  cards: readonly Sandglass[],
  tray: SandglassTray,
  query: string,
  runner: string,
  sand: string,
  glass: string,
  grain: string,
  turn: string,
): Sandglass[] {
  const text = query.trim().toLowerCase();
  const wantRunner = clip(runner, 24).toLowerCase();
  const wantSand = sand === "all" ? "" : sandglassSand(sand);
  const wantGlass = activeGlass(glass);
  const wantGrain = activeGrain(grain);
  const wantTurn = activeTurn(turn);
  return cards.filter((card) => {
    if (!inTray(card, tray)) return false;
    if (text && !`${card.title} ${card.note} ${card.runner}`.toLowerCase().includes(text)) return false;
    if (wantRunner && card.runner.toLowerCase() !== wantRunner) return false;
    if (wantSand && card.sand !== wantSand) return false;
    if (wantGlass === "inner" && !sandglassInner(card.glass)) return false;
    if (wantGlass === "outer" && !sandglassOuter(card.glass)) return false;
    if (wantGlass !== "all" && wantGlass !== "inner" && wantGlass !== "outer" && card.glass !== wantGlass) return false;
    if (wantGrain !== "all" && String(card.grain ?? "") !== wantGrain) return false;
    if (wantTurn !== "all" && String(card.turn) !== wantTurn) return false;
    return true;
  });
}

/** An outer glass on turn one, still unrun and not in the chest, is overdue. */
export function overdueSandglass(card: Sandglass): boolean {
  return sandglassOuter(card.glass) && card.turn === 1 && !card.run && !card.chested;
}

/** No sand, the short grain, turn one, and still on the table. */
export function idleSandglass(card: Sandglass): boolean {
  return !card.sand && card.grain === 3 && card.turn === 1 && !card.run && !card.hooked && !card.chested;
}

/** Slate, a tall grain, and a full turn, still out of the chest. */
export function briskSandglass(card: Sandglass): boolean {
  return card.sand === "SLATE" && card.grain === 30 && card.turn === 7 && !card.chested;
}

/** Foot, ivory, and grain nine. */
export function restingSandglass(card: Sandglass): boolean {
  return card.glass === "foot" && card.sand === "IVORY" && card.grain === 9;
}

/** A bulb is late when the desk is already on the foot. */
export function lateSandglass(card: Sandglass, desk: string): boolean {
  return card.glass === "bulb" && sandglassGlass(desk) === "foot" && !card.run;
}

export function sandglassCounts(cards: readonly Sandglass[], shown: readonly Sandglass[], desk: string): SandglassCounts {
  return {
    table: cards.filter((card) => inTray(card, "table")).length,
    hook: cards.filter((card) => inTray(card, "hook")).length,
    chest: cards.filter((card) => inTray(card, "chest")).length,
    run: cards.filter((card) => card.run).length,
    inner: cards.filter((card) => sandglassInner(card.glass)).length,
    outer: cards.filter((card) => sandglassOuter(card.glass)).length,
    wide: cards.filter((card) => card.grain === 30).length,
    house: cards.filter((card) => houseSand(card.sand)).length,
    grain: cards.reduce((sum, card) => sum + (card.grain || 0), 0),
    matched: shown.length,
    starred: cards.filter((card) => card.starred).length,
    idle: cards.filter(idleSandglass).length,
    brisk: cards.filter(briskSandglass).length,
    resting: cards.filter(restingSandglass).length,
    overdue: cards.filter(overdueSandglass).length,
    pair: cards.filter((card) => pairTurn(card.turn) && lateSandglass(card, desk)).length,
  };
}

export function sandglassBars(cards: readonly Sandglass[]): { glass: string; count: number }[] {
  return SNG_GLASSES.map((glass) => ({ glass, count: cards.filter((card) => card.glass === glass && !card.chested).length }));
}

export function sandglassTimeline(cards: readonly Sandglass[]): { grain: number; titles: string[] }[] {
  const open = cards.filter((card) => inTray(card, "table"));
  return GRAIN_CYCLE.map((grain) => ({ grain, titles: open.filter((card) => card.grain === grain).map((card) => card.title) })).filter((lane) => lane.titles.length);
}

export function sandglassRunners(cards: readonly Sandglass[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    if (card.runner && !out.some((name) => name.toLowerCase() === card.runner.toLowerCase())) out.push(card.runner);
  }
  return out;
}

export function busiestRunner(cards: readonly Sandglass[]): string {
  const open = cards.filter((card) => inTray(card, "table") && !card.run && card.runner);
  let best = "";
  let score = 0;
  for (const name of sandglassRunners(open)) {
    const count = open.filter((card) => card.runner.toLowerCase() === name.toLowerCase()).length;
    if (count > score) {
      best = name;
      score = count;
    }
  }
  return best;
}

export function reminderSandglassRules(cards: readonly Sandglass[]): string[] {
  return cards.filter(overdueSandglass).map((card) => card.title);
}

export function sandglassCopy(card: Sandglass): string {
  return [card.title, card.runner, card.glass, card.sand, card.grain ?? "", card.turn, card.note].filter((item) => item !== "").join(" · ");
}

export function sandglassCsv(cards: readonly Sandglass[], desk: string): string {
  const lines = ["title,runner,glass,sand,grain,turn,tags,run,hook,chest,starred,outer,late,idle,brisk,resting,overdue,inner,house,band,audit,note"];
  for (const card of cards) {
    lines.push(
      [
        csvCell(card.title),
        csvCell(card.runner),
        card.glass,
        card.sand,
        card.grain ?? "",
        card.turn,
        card.tags.join(" "),
        card.run ? "1" : "0",
        card.hooked ? "1" : "0",
        card.chested ? "1" : "0",
        card.starred ? "1" : "0",
        sandglassOuter(card.glass) ? "1" : "0",
        lateSandglass(card, desk) ? "1" : "0",
        idleSandglass(card) ? "1" : "0",
        briskSandglass(card) ? "1" : "0",
        restingSandglass(card) ? "1" : "0",
        overdueSandglass(card) ? "1" : "0",
        sandglassInner(card.glass) ? "1" : "0",
        houseSand(card.sand) ? "1" : "0",
        sandglassBand(card.glass),
        card.audit,
        csvCell(card.note),
      ].join(","),
    );
  }
  return lines.join("\n");
}

export const PRP_KEY = "crmv4-periplus-hide";
export const PRP_REVIEW_KEY = "crmv4-periplus-review";

export type PeriplusLane = "" | "home" | "ridge" | "gulf" | "cipher" | "islet" | "ocean" | "mouth" | "cape";

export type PeriplusHue = "" | "ivory" | "graphite" | "champagne";

export type PeriplusState = "" | "clear" | "set";

export type PeriplusReview = "all" | "reviewed" | "fresh";

export type PeriplusShape =
  | "all"
  | "home"
  | "ridge"
  | "gulf"
  | "cipher"
  | "islet"
  | "ocean"
  | "mouth"
  | "cape"
  | "open"
  | "soon"
  | "letter"
  | "mixed"
  | "upper"
  | "lower"
  | "space"
  | "even"
  | "odd"
  | "tail"
  | "first"
  | "held"
  | "hyphen"
  | "period";

export type PeriplusValue = string | { country?: unknown; [key: string]: unknown } | null | undefined;

export type PeriplusRow = { id: string; label: string; coast: PeriplusValue };

export type PeriplusLaneLine = { lane: string; count: number };

const COAST_LANES = ["home", "ridge", "gulf", "cipher", "islet", "ocean", "mouth", "cape"] as const;

const COAST_HUES = ["champagne", "ivory", "graphite"] as const;

function coastRecord(raw: PeriplusValue): { country?: unknown } | null {
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function coastBlocked(raw: PeriplusValue): boolean {
  if (!raw || typeof raw !== "object") return false;
  return BLOCKED.some((key) => key in raw);
}

function coastGiven(raw: PeriplusValue): string {
  const row = coastRecord(raw);
  if (row && !("country" in row)) return "";
  const value = row ? row.country : raw;
  if (value === true || value === "true" || value === "1" || value === 1) return "HOME";
  if (value === false || value === "false" || value === "0" || value === 0) return "CLOSED COAST";
  return clip(value, 48);
}

function coastReadable(raw: PeriplusValue): boolean {
  if (coastBlocked(raw)) return false;
  const row = coastRecord(raw);
  if (row && !("country" in row)) return false;
  return true;
}

function firstToken(raw: string): string {
  return raw.split(/\s+/).filter(Boolean)[0] || "";
}

export function periplusState(raw: PeriplusValue): PeriplusState {
  if (!coastReadable(raw)) return "";
  return coastGiven(raw) ? "set" : "clear";
}

/** A known coast is HOME, PORT, ROAD, or FAIR. A ridge contains a hyphen. A gulf has a space. An islet is three characters or fewer. An ocean is ten characters or longer. A cipher contains a number. */
export function periplusLane(raw: PeriplusValue): PeriplusLane {
  if (periplusState(raw) !== "set") return "";
  const text = coastGiven(raw);
  if (HOME_COASTS.has(text.toUpperCase())) return "home";
  if (text.includes("-")) return "ridge";
  if (text.includes(" ")) return "gulf";
  if (text.length <= 3) return "islet";
  if (text.length >= 10) return "ocean";
  if (/[0-9]/.test(text)) return "cipher";
  if (/^[aeiou]/i.test(text)) return "mouth";
  return "cape";
}

export function periplusHue(raw: PeriplusValue): PeriplusHue {
  const lane = periplusLane(raw);
  if (!lane) return "";
  if (lane === "home" || lane === "islet") return "champagne";
  if (lane === "gulf" || lane === "ridge" || lane === "ocean") return "graphite";
  return "ivory";
}

export function periplusHome(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "home";
}

export function periplusRidge(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "ridge";
}

export function periplusGulf(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "gulf";
}

export function periplusCipherLane(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "cipher";
}

export function periplusIslet(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "islet";
}

export function periplusOcean(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "ocean";
}

export function periplusMouthLane(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "mouth";
}

export function periplusCape(raw: PeriplusValue): boolean {
  return periplusLane(raw) === "cape";
}

export function periplusOpen(raw: PeriplusValue): boolean {
  return periplusState(raw) === "clear";
}

/** A coast the desk can keep without a rewrite: an ocean or a home coast. */
export function periplusHeld(raw: PeriplusValue): boolean {
  const lane = periplusLane(raw);
  return lane === "ocean" || lane === "home";
}

/** An islet, or a coast of three characters or fewer that is not home, still wants a fuller name. */
export function periplusSoon(raw: PeriplusValue): boolean {
  if (periplusState(raw) !== "set") return false;
  if (periplusIslet(raw)) return true;
  if (periplusHome(raw)) return false;
  const length = coastGiven(raw).length;
  return length > 0 && length <= 3;
}

export function periplusLength(raw: PeriplusValue): number | null {
  if (periplusState(raw) !== "set") return null;
  return coastGiven(raw).length;
}

export function periplusEven(raw: PeriplusValue): boolean {
  const length = periplusLength(raw);
  return length !== null && length % 2 === 0;
}

export function periplusOdd(raw: PeriplusValue): boolean {
  const length = periplusLength(raw);
  return length !== null && length % 2 === 1;
}

export function periplusFirst(raw: PeriplusValue): boolean {
  return /^[A-Za-z]/.test(coastGiven(raw));
}

export function periplusTail(raw: PeriplusValue): boolean {
  return /[0-9]$/.test(coastGiven(raw));
}

export function periplusCapital(raw: PeriplusValue): boolean {
  return /[A-Z]/.test(coastGiven(raw));
}

export function periplusSpace(raw: PeriplusValue): boolean {
  return coastGiven(raw).includes(" ");
}

export function periplusMouth(raw: PeriplusValue): boolean {
  return /^[aeiou]/i.test(coastGiven(raw));
}

export function periplusCipher(raw: PeriplusValue): boolean {
  return /[0-9]/.test(coastGiven(raw));
}

export function periplusLetter(raw: PeriplusValue): boolean {
  return /[A-Za-z]/.test(coastGiven(raw));
}

export function periplusMixed(raw: PeriplusValue): boolean {
  return periplusCipher(raw) && periplusLetter(raw);
}

export function periplusLower(raw: PeriplusValue): boolean {
  const text = coastGiven(raw);
  return text.length > 0 && text === text.toLowerCase() && /[a-z]/.test(text);
}

/** A seal is three letters or more, written entirely in capitals. */
export function periplusUpper(raw: PeriplusValue): boolean {
  const text = coastGiven(raw);
  return text.length >= 3 && text === text.toUpperCase() && /[A-Z]/.test(text);
}

export function periplusHyphen(raw: PeriplusValue): boolean {
  return coastGiven(raw).includes("-");
}

export function periplusPeriod(raw: PeriplusValue): boolean {
  return coastGiven(raw).includes(".");
}

export function periplusStamp(raw: PeriplusValue): string {
  const text = coastGiven(raw);
  if (!text) return "";
  return text.slice(0, 2).toUpperCase();
}

export function periplusCopy(raw: PeriplusValue): string {
  return coastGiven(raw);
}

export function periplusFamily(raw: PeriplusValue): string {
  if (periplusState(raw) !== "set") return "";
  return firstToken(coastGiven(raw));
}

export function periplusLanes(rows: readonly PeriplusRow[]): PeriplusLaneLine[] {
  const counts = new Map<string, number>();
  for (const lane of COAST_LANES) counts.set(lane, 0);
  for (const row of rows) {
    const lane = periplusLane(row.coast);
    if (!lane) continue;
    counts.set(lane, (counts.get(lane) || 0) + 1);
  }
  return COAST_LANES.map((lane) => ({ lane, count: counts.get(lane) || 0 }));
}

export function leadingPeriplus(rows: readonly PeriplusRow[]): string {
  const lines = periplusLanes(rows).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.slice().sort((a, b) => b.count - a.count || COAST_LANES.indexOf(a.lane as (typeof COAST_LANES)[number]) - COAST_LANES.indexOf(b.lane as (typeof COAST_LANES)[number]))[0].lane;
}

export function leadingPeriplusHue(rows: readonly PeriplusRow[]): string {
  const counts = new Map<string, number>();
  for (const hue of COAST_HUES) counts.set(hue, 0);
  for (const row of rows) {
    const hue = periplusHue(row.coast);
    if (!hue) continue;
    counts.set(hue, (counts.get(hue) || 0) + 1);
  }
  const lines = COAST_HUES.map((hue) => ({ hue, count: counts.get(hue) || 0 })).filter((line) => line.count > 0);
  if (!lines.length) return "";
  return lines.sort((a, b) => b.count - a.count || COAST_HUES.indexOf(a.hue) - COAST_HUES.indexOf(b.hue))[0].hue;
}

export function lanePeriplusCount(rows: readonly PeriplusRow[], lane: PeriplusLane): number {
  return rows.filter((row) => periplusLane(row.coast) === lane).length;
}

export function periplusShare(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export function presentPeriplusLanes(rows: readonly PeriplusRow[]): string[] {
  return periplusLanes(rows).filter((line) => line.count > 0).map((line) => line.lane);
}

export function readHiddenPeriplus(raw: unknown, present: readonly string[]): string[] {
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

export function readReviewedPeriplus(raw: unknown, ids: readonly string[]): string[] {
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

export function togglePeriplus(hidden: readonly string[], lane: string): string[] {
  return hidden.includes(lane) ? hidden.filter((item) => item !== lane) : [...hidden, lane];
}

export function togglePeriplusReview(reviewed: readonly string[], id: string): string[] {
  return reviewed.includes(id) ? reviewed.filter((item) => item !== id) : [...reviewed, id];
}

export function bulkPeriplusReview(reviewed: readonly string[], ids: readonly string[], on: boolean): string[] {
  const next = new Set(reviewed);
  for (const id of ids) {
    if (on) next.add(id);
    else next.delete(id);
  }
  return Array.from(next);
}

export function visiblePeriplusLanes(present: readonly string[], hidden: readonly string[], showHidden: boolean): string[] {
  return present.filter((lane) => showHidden || !hidden.includes(lane));
}

function shapeOn(row: PeriplusRow, shape: PeriplusShape): boolean {
  if (shape === "all") return true;
  if (shape === "home") return periplusHome(row.coast);
  if (shape === "ridge") return periplusRidge(row.coast);
  if (shape === "gulf") return periplusGulf(row.coast);
  if (shape === "cipher") return periplusCipherLane(row.coast);
  if (shape === "islet") return periplusIslet(row.coast);
  if (shape === "ocean") return periplusOcean(row.coast);
  if (shape === "mouth") return periplusMouthLane(row.coast);
  if (shape === "cape") return periplusCape(row.coast);
  if (shape === "open") return periplusOpen(row.coast);
  if (shape === "soon") return periplusSoon(row.coast);
  if (shape === "letter") return periplusLetter(row.coast);
  if (shape === "mixed") return periplusMixed(row.coast);
  if (shape === "upper") return periplusUpper(row.coast);
  if (shape === "lower") return periplusLower(row.coast);
  if (shape === "space") return periplusSpace(row.coast);
  if (shape === "even") return periplusEven(row.coast);
  if (shape === "odd") return periplusOdd(row.coast);
  if (shape === "tail") return periplusTail(row.coast);
  if (shape === "first") return periplusFirst(row.coast);
  if (shape === "held") return periplusHeld(row.coast);
  if (shape === "hyphen") return periplusHyphen(row.coast);
  if (shape === "period") return periplusPeriod(row.coast);
  return periplusLane(row.coast) === shape;
}

export function visiblePeriplus(
  rows: readonly PeriplusRow[],
  lane: string,
  hue: string,
  query: string,
  review: PeriplusReview,
  reviewed: readonly string[],
  shape: PeriplusShape,
): PeriplusRow[] {
  const text = query.trim().toLowerCase();
  const seen = new Set(reviewed);
  return rows.filter((row) => {
    if (periplusState(row.coast) === "") return false;
    const found = periplusLane(row.coast);
    const hueName = periplusHue(row.coast);
    if (lane && lane !== "all" && found !== lane) return false;
    if (hue && hue !== "all" && hueName !== hue) return false;
    if (text && !`${row.label} ${coastGiven(row.coast)} ${periplusStamp(row.coast)} ${periplusFamily(row.coast)}`.toLowerCase().includes(text)) return false;
    if (review === "reviewed" && !seen.has(row.id)) return false;
    if (review === "fresh" && seen.has(row.id)) return false;
    return shapeOn(row, shape);
  });
}

export function periplusLanesCsv(rows: readonly PeriplusRow[]): string {
  const lines = ["lane,count"];
  for (const line of periplusLanes(rows)) lines.push(`${line.lane},${line.count}`);
  return lines.join("\n");
}

export function periplusRowsCsv(rows: readonly PeriplusRow[], reviewed: readonly string[]): string {
  const lines = ["name,country,stamp,family,lane,hue,length,home,ridge,gulf,islet,even,cipher,mixed,upper,mouth,tail,held,soon,reviewed"];
  const seen = new Set(reviewed);
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.label),
        csvCell(periplusCopy(row.coast)),
        periplusStamp(row.coast),
        csvCell(periplusFamily(row.coast)),
        periplusLane(row.coast),
        periplusHue(row.coast),
        periplusLength(row.coast) ?? "",
        periplusHome(row.coast) ? "1" : "0",
        periplusRidge(row.coast) ? "1" : "0",
        periplusGulf(row.coast) ? "1" : "0",
        periplusIslet(row.coast) ? "1" : "0",
        periplusEven(row.coast) ? "1" : "0",
        periplusCipher(row.coast) ? "1" : "0",
        periplusMixed(row.coast) ? "1" : "0",
        periplusUpper(row.coast) ? "1" : "0",
        periplusMouth(row.coast) ? "1" : "0",
        periplusTail(row.coast) ? "1" : "0",
        periplusHeld(row.coast) ? "1" : "0",
        periplusSoon(row.coast) ? "1" : "0",
        seen.has(row.id) ? "1" : "0",
      ].join(","),
    );
  }
  return lines.join("\n");
}
