/**
 * Niello inlay rules, document review plates, the ivory focus hypogeum, and the graphite channel ambulacrum.
 * Run: TZ=UTC npx tsx tests/crmv4-round369.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND369_COPY } from "../src/lib/crmv4/copy-round369";
import { ROUND368_FEATURES } from "../src/lib/crmv4/round368";
import {
  ROUND369_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addNiello,
  briskNiello,
  dropNielloView,
  fairKeeper,
  drvHome,
  drvDesk,
  drvBrief,
  drvDigit,
  drvEven,
  drvFirst,
  drvRoute,
  drvHue,
  drvJoin,
  drvCitizen,
  drvLane,
  drvLanesCsv,
  drvLength,
  drvLower,
  drvGuest,
  drvAway,
  drvOpen,
  drvPlain,
  drvLong,
  drvRowsCsv,
  drvSoon,
  drvSpace,
  drvState,
  drvUpper,
  drvVowel,
  fullHammer,
  idleNiello,
  lateNiello,
  leadingSel,
  moveNielloFocus,
  nielloBand,
  nielloHour,
  nielloGap,
  nielloInner,
  nielloMode,
  nielloOuter,
  nielloHammer,
  nielloFilm,
  nielloTimeline,
  overdueNiello,
  pairHammer,
  quietFinish,
  readNielloViews,
  reminderNielloCards,
  restingNiello,
  suggestFinish,
  suggestMode,
  suggestHour,
  type DrvRow,
  type Niello,
} from "../src/lib/crmv4/round369";

function rule(partial: Partial<Niello> & { id: string; title: string }): Niello {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 2,
    tags: [],
    raised: false,
    pinned: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND369_FEATURES.length, 25);
  assert.equal(ROUND369_FEATURES.includes("document-review-plate"), true);
  assert.equal(ROUND369_FEATURES.includes("inlay-fire-sla"), true);
  assert.equal(ROUND369_FEATURES.includes("fair-firer"), true);
  assert.equal(ROUND369_FEATURES.includes("inlay-archive"), true);
  assert.equal(ROUND369_FEATURES.includes("inlay-reminders"), true);
  assert.equal(ROUND369_FEATURES.includes("niello-search"), true);
  assert.equal(ROUND369_FEATURES.includes("inlay-timeline"), true);
  for (const feature of ROUND369_FEATURES) assert.equal((ROUND368_FEATURES as readonly string[]).includes(feature), false, feature);
  assert.equal(nielloMode(" well "), "well");
  assert.equal(nielloMode("brass"), "");
  assert.equal(nielloHour("4"), 4);
  assert.equal(nielloHour(8), 8);
  assert.equal(nielloHour(16), 16);
  assert.equal(nielloHour(32), 32);
  assert.equal(nielloHour("7"), null);
  assert.equal(nielloHour("3"), null);
  assert.equal(nielloHammer("2"), 2);
  assert.equal(nielloHammer(4), 4);
  assert.equal(nielloHammer("8"), 8);
  assert.equal(nielloHammer("3"), null);
  assert.equal(nielloHammer("6"), null);
  assert.equal(nielloFilm("soot"), "SOOT");
  assert.equal(nielloFilm("ivory"), "IVORY");
  assert.equal(nielloFilm("graphite"), "GRAPHITE");
  assert.equal(nielloFilm("hot"), "");
  assert.equal(nielloInner("well"), true);
  assert.equal(nielloInner("WALL"), true);
  assert.equal(nielloInner("wire"), false);
  assert.equal(nielloOuter("wire"), true);
  assert.equal(nielloOuter("lip"), true);
  assert.equal(nielloOuter("well"), false);
  assert.equal(nielloBand("well"), "field");
  assert.equal(nielloBand("wall"), "bank");
  assert.equal(nielloBand("wire"), "fence");
  assert.equal(nielloBand("lip"), "lip");
  assert.equal(nielloGap("well", "lip"), 3);
  assert.equal(quietFinish("graphite"), true);
  assert.equal(quietFinish("ivory"), false);
  assert.equal(quietFinish("soot"), false);
  assert.equal(pairHammer(4), true);
  assert.equal(pairHammer(2), false);
  assert.equal(fullHammer(8), true);
  assert.equal(fullHammer(4), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("4"), "4");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("8"), "8");
  assert.equal(activeHammer("3"), "all");
  assert.equal(activeFinish("soot", ["SOOT"]), "SOOT");
  assert.equal(suggestMode(4), "well");
  assert.equal(suggestMode(10), "lip");
  assert.equal(suggestHour([], 3), 4);
  assert.equal(suggestHour([], 6), 8);
  assert.equal(suggestHour([], 12), 16);
  assert.equal(suggestHour([], 20), 32);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveNielloFocus(0, 3, 1), 1);
  assert.equal(moveNielloFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "well" });
  const due = rule({ id: "b", title: "Bea", piece: "wire", lock: 2 });
  const quiet = rule({ id: "c", title: "Cara", drop: 4, lock: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "SOOT", drop: 32, lock: 8 });
  const fax = rule({ id: "e", title: "Eve", piece: "lip", film: "IVORY", drop: 8 });
  assert.equal(lateNiello(late, "lip"), true);
  assert.equal(lateNiello(late, "well"), false);
  assert.equal(overdueNiello(due), true);
  assert.equal(idleNiello(quiet), true);
  assert.equal(briskNiello(cell), true);
  assert.equal(restingNiello(fax), true);
  assert.deepEqual(reminderNielloCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 8 }), rule({ id: "2", title: "East", drop: 4 })];
  assert.match(nielloTimeline(cards).map((mail) => mail.drop).join(","), /8/);
  const saved = addNiello([], { title: "Ada", piece: "wall", drop: "8", film: "soot", lock: "4", tags: "n i x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "wall");
  assert.equal(saved[0].drop, 8);
  assert.equal(saved[0].lock, 4);
  assert.deepEqual(saved[0].tags, ["n", "i"]);
  assert.equal(addNiello(saved, { title: "Ada" }).length, 1);
  assert.equal(addNiello([], { title: "Eve" })[0].lock, 2);
  assert.equal(dropNielloView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readNielloViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(drvHome("APPROVED", now), true);
  assert.equal(drvHome("YES", now), true);
  assert.equal(drvDesk("WEB", now), true);
  assert.equal(drvHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(drvAway("quiet book", now), true);
  assert.equal(drvGuest("2026-11-15T12:00:00.000Z", now), true);
  assert.equal(drvCitizen("2026-11-10T12:00:00.000Z", now), true);
  assert.equal(drvDesk("2026-11-19T12:00:00.000Z", now), true);
  assert.equal(drvHome({ reviewNote: true }, now), true);
  assert.equal(drvHome({ reviewNote: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(drvPlain({ reviewNote: false }, now), true);
  assert.equal(drvAway({ reviewNote: false }, now), false);
  assert.equal(drvPlain({ reviewNote: "Granite" }, now), true);
  assert.equal(drvHome({ reviewNote: "Granite" }, now), false);
  assert.equal(drvBrief({ reviewNote: "MARKS" }, now), true);
  assert.equal(drvJoin("LIVE&BOOK", now), true);
  assert.equal(drvJoin("ANNA NOAH", now), false);
  assert.equal(drvRoute("SALE/EAST", now), true);
  assert.equal(drvRoute("SETHOLD", now), false);
  assert.equal(drvBrief("APPROVED", now), false);
  assert.equal(drvBrief("MARKS", now), true);
  assert.equal(drvLong("GraphiteMarker", now), true);
  assert.equal(drvLong("ElevenChars", now), false);
  assert.equal(drvLane("APPROVED", now), "hall");
  assert.equal(drvLane("WEB", now), "desk");
  assert.equal(drvLane("PENDING", now), "hold");
  assert.equal(drvLane("REJECTED", now), "guest");
  assert.equal(drvLane("PAIR", now), "join");
  assert.equal(drvLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(drvLane("2026-11-15T12:00:00.000Z", now), "hold");
  assert.equal(drvLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(drvLane("Granite", now), "plain");
  assert.equal(drvLane("MARKS", now), "brief");
  assert.equal(drvLane("20261120T073000Z", now), "stamp");
  assert.equal(drvLane("Amsterdam", now), "vowel");
  assert.equal(drvLane("quiet book", now), "vacant");
  assert.equal(drvLane("alpha/beta/gamma", now), "route");
  assert.equal(drvLane("clear file", now), "hall");
  assert.equal(drvOpen(""), true);
  assert.equal(drvOpen({ reviewNote: "" }), true);
  assert.equal(drvState({ name: "Ada" }), "");
  assert.equal(drvState({ reviewNote: "Paris", balance: 1 }), "");
  assert.equal(drvHue("APPROVED", now), "champagne");
  assert.equal(drvHue("PAIR&FILE", now), "champagne");
  assert.equal(drvHue("2026-11-15T12:00:00.000Z", now), "ivory");
  assert.equal(drvHue("2026-11-19T12:00:00.000Z", now), "graphite");
  assert.equal(drvSoon("MARKS", now), true);
  assert.equal(drvSoon("APPROVED", now), false);
  assert.equal(drvSoon("ABCDEFG", now), true);
  assert.equal(drvSoon("AB", now), false);
  assert.equal(drvHue("Granite", now), "ivory");
  assert.equal(drvLength("yes"), 3);
  assert.equal(drvEven("ab"), true);
  assert.equal(drvFirst("Paris"), true);
  assert.equal(drvSpace("needs review"), true);
  assert.equal(drvVowel("Amsterdam"), true);
  assert.equal(drvDigit("Room4"), true);
  assert.equal(drvLower("paris"), true);
  assert.equal(drvUpper("CHAMPAGNE"), true);
  assert.equal(drvUpper("SEALED"), false);
  assert.equal(drvUpper("CLEAR"), false);
  const marks: DrvRow[] = [
    { id: "1", label: "Ada", code: "APPROVED" },
    { id: "2", label: "Bea", code: "APPROVED" },
    { id: "3", label: "Cara", code: "Granite" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(drvLanesCsv(marks), /hall,2/);
  assert.match(drvRowsCsv(marks, ["1"]), /Ada,APPROVED/);
  assert.equal(crmv4Text("tr", "nilTitle"), ROUND369_COPY.tr.nilTitle);
  assert.equal(crmv4Text("de", "drvTitle"), ROUND369_COPY.de.drvTitle);
  assert.equal(crmv4Text("ru", "fmHypogeumKicker"), ROUND369_COPY.ru.fmHypogeumKicker);
  assert.equal(crmv4Text("ar", "dcAmbulacrumLead"), ROUND369_COPY.ar.dcAmbulacrumLead);
  const keys = Object.keys(ROUND369_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND369_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-niello/);
  assert.match(css, /\.c4-drvplate/);
  assert.match(css, /\.c4-niello-column/);
  assert.match(css, /\.c4-drvplate-column/);
  assert.match(css, /\.c4-fm-hypogeum/);
  assert.match(css, /\.c4-dc-ambulacrum/);
  assert.match(css, /\.c4-fm-hypogeum-mast/);
  assert.match(css, /\.c4-dc-ambulacrum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round369.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /reviewNote:/);
  assert.match(viewFile, /nielloCsv/);
  assert.match(viewFile, /drvRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/documents\?take=24/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-drvplate-search/);
  assert.match(viewFile, /nielloTimeline/);
  assert.match(viewFile, /c4-niello-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nil"/);
  assert.match(app, /view === "drv"/);
  const focus = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round82.tsx"), "utf8");
  assert.match(focus, /c4-fm-hypogeum/);
  assert.match(focus, /c4-fm-hypogeum-mast/);
  assert.match(focus, /data-logo="mono"/);
  assert.match(focus, /fmHypogeumKicker/);
  assert.match(focus, /fmHypogeumLead/);
  assert.match(focus, /data-fm-hypogeum/);
  const stair = focus.slice(focus.indexOf("export function FocusDesk"));
  assert.equal(stair.includes("amount"), false);
  assert.equal(stair.includes("price"), false);
  const channel = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round86.tsx"), "utf8");
  assert.match(channel, /c4-dc-ambulacrum/);
  assert.match(channel, /c4-dc-ambulacrum-mast/);
  assert.match(channel, /dcAmbulacrumKicker/);
  assert.match(channel, /dcAmbulacrumLead/);
  assert.match(channel, /data-dc-ambulacrum/);
  const walk = channel.slice(channel.indexOf("export function ChannelGlance"));
  assert.equal(walk.includes("amount"), false);
  assert.equal(walk.includes("profit"), false);
  const namedKeys = `${viewFile}\n${focus}\n${channel}`.match(/"(nil|drv|fmHypogeum|dcAmbulacrum)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND369_COPY.en[key as keyof typeof ROUND369_COPY.en], "string", key);
  console.log("crmv4 round369 tests passed");
}

main();
