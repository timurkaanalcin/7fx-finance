/**
 * Opaline dial rules, origin plates, the ivory document tablinum, and the graphite ticket dromos.
 * Run: TZ=UTC npx tsx tests/crmv4-round366.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND366_COPY } from "../src/lib/crmv4/copy-round366";
import { ROUND365_FEATURES } from "../src/lib/crmv4/round365";
import {
  ROUND366_FEATURES,
  activeFinish,
  activeMode,
  activeHour,
  activeHammer,
  addOpaline,
  briskOpaline,
  dropOpalineView,
  fairKeeper,
  lisHome,
  lisBrief,
  lisDigit,
  lisEven,
  lisFirst,
  lisRoute,
  lisHue,
  lisJoin,
  lisCitizen,
  lisLane,
  lisLanesCsv,
  lisLength,
  lisLower,
  lisGuest,
  lisAway,
  lisOpen,
  lisPlain,
  lisLong,
  lisRowsCsv,
  lisSoon,
  lisSpace,
  lisState,
  lisUpper,
  lisVowel,
  lisDesk,
  fullHammer,
  idleOpaline,
  lateOpaline,
  leadingSel,
  moveOpalineFocus,
  opalineBand,
  opalineHour,
  opalineGap,
  opalineInner,
  opalineMode,
  opalineOuter,
  opalineHammer,
  opalineFilm,
  opalineTimeline,
  overdueOpaline,
  pairHammer,
  quietFinish,
  readOpalineViews,
  reminderOpalineCards,
  restingOpaline,
  suggestFinish,
  suggestMode,
  suggestHour,
  type LisRow,
  type Opaline,
} from "../src/lib/crmv4/round366";

function rule(partial: Partial<Opaline> & { id: string; title: string }): Opaline {
  return {
    note: "",
    setter: "",
    piece: "",
    drop: null,
    film: "",
    lock: 3,
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
  assert.equal(ROUND366_FEATURES.length, 25);
  assert.equal(ROUND366_FEATURES.includes("origin-plate"), true);
  assert.equal(ROUND366_FEATURES.includes("opaline-coat-sla"), true);
  assert.equal(ROUND366_FEATURES.includes("fair-enameller"), true);
  assert.equal(ROUND366_FEATURES.includes("veil-archive"), true);
  assert.equal(ROUND366_FEATURES.includes("veil-reminders"), true);
  assert.equal(ROUND366_FEATURES.includes("opaline-search"), true);
  assert.equal(ROUND366_FEATURES.includes("veil-timeline"), true);
  for (const feature of ROUND366_FEATURES) assert.equal(ROUND365_FEATURES.includes(feature), false, feature);
  assert.equal(opalineMode(" glaze "), "glaze");
  assert.equal(opalineMode("brass"), "");
  assert.equal(opalineHour("3"), 3);
  assert.equal(opalineHour(6), 6);
  assert.equal(opalineHour(12), 12);
  assert.equal(opalineHour(24), 24);
  assert.equal(opalineHour("4"), null);
  assert.equal(opalineHour("8"), null);
  assert.equal(opalineHammer("3"), 3);
  assert.equal(opalineHammer(6), 6);
  assert.equal(opalineHammer("9"), 9);
  assert.equal(opalineHammer("2"), null);
  assert.equal(opalineHammer("5"), null);
  assert.equal(opalineFilm("gilt"), "GILT");
  assert.equal(opalineFilm("ivory"), "IVORY");
  assert.equal(opalineFilm("graphite"), "GRAPHITE");
  assert.equal(opalineFilm("hot"), "");
  assert.equal(opalineInner("glaze"), true);
  assert.equal(opalineInner("GROUND"), true);
  assert.equal(opalineInner("beak"), false);
  assert.equal(opalineOuter("veil"), true);
  assert.equal(opalineOuter("rim"), true);
  assert.equal(opalineOuter("glaze"), false);
  assert.equal(opalineBand("glaze"), "milk");
  assert.equal(opalineBand("ground"), "field");
  assert.equal(opalineBand("veil"), "gauze");
  assert.equal(opalineBand("rim"), "lip");
  assert.equal(opalineGap("glaze", "rim"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("graphite"), false);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairHammer(6), true);
  assert.equal(pairHammer(3), false);
  assert.equal(fullHammer(9), true);
  assert.equal(fullHammer(6), false);
  assert.equal(activeMode("inner"), "inner");
  assert.equal(activeHour("3"), "3");
  assert.equal(activeHour("7"), "all");
  assert.equal(activeHammer("9"), "9");
  assert.equal(activeHammer("2"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestMode(4), "glaze");
  assert.equal(suggestMode(10), "rim");
  assert.equal(suggestHour([], 3), 3);
  assert.equal(suggestHour([], 8), 6);
  assert.equal(suggestHour([], 14), 12);
  assert.equal(suggestHour([], 20), 24);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveOpalineFocus(0, 3, 1), 1);
  assert.equal(moveOpalineFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", piece: "glaze" });
  const due = rule({ id: "b", title: "Bea", piece: "veil", lock: 3 });
  const quiet = rule({ id: "c", title: "Cara", drop: 3, lock: 3 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", drop: 24, lock: 9 });
  const fax = rule({ id: "e", title: "Eve", piece: "rim", film: "IVORY", drop: 6 });
  assert.equal(lateOpaline(late, "rim"), true);
  assert.equal(lateOpaline(late, "glaze"), false);
  assert.equal(overdueOpaline(due), true);
  assert.equal(idleOpaline(quiet), true);
  assert.equal(briskOpaline(cell), true);
  assert.equal(restingOpaline(fax), true);
  assert.deepEqual(reminderOpalineCards([due, late]), ["Bea"]);
  assert.equal(fairKeeper([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", drop: 6 }), rule({ id: "2", title: "East", drop: 3 })];
  assert.match(opalineTimeline(cards).map((mail) => mail.drop).join(","), /6/);
  const saved = addOpaline([], { title: "Ada", piece: "ground", drop: "6", film: "gilt", lock: "6", tags: "q r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].piece, "ground");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].lock, 6);
  assert.deepEqual(saved[0].tags, ["q", "r"]);
  assert.equal(addOpaline(saved, { title: "Ada" }).length, 1);
  assert.equal(addOpaline([], { title: "Eve" })[0].lock, 3);
  assert.equal(dropOpalineView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", piece: "all", drop: "all", lock: "all" }], "v").length, 0);
  assert.equal(readOpalineViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  const now = Date.parse("2026-11-20T12:00:00.000Z");
  assert.equal(lisHome("MANUAL", now), true);
  assert.equal(lisHome("YES", now), true);
  assert.equal(lisDesk("AUTO", now), true);
  assert.equal(lisHome("2026-11-20T01:00:00.000Z", now), true);
  assert.equal(lisAway("silent book", now), true);
  assert.equal(lisGuest("2026-11-14T12:00:00.000Z", now), true);
  assert.equal(lisCitizen("2025-01-01T00:00:00.000Z", now), true);
  assert.equal(lisDesk("2026-11-19T12:00:00.000Z", now), true);
  assert.equal(lisHome({ leadInvalidSource: true }, now), true);
  assert.equal(lisHome({ leadInvalidSource: "2026-11-20T08:00:00.000Z" }, now), true);
  assert.equal(lisPlain({ leadInvalidSource: false }, now), true);
  assert.equal(lisAway({ leadInvalidSource: false }, now), false);
  assert.equal(lisPlain({ leadInvalidSource: "Granite" }, now), true);
  assert.equal(lisHome({ leadInvalidSource: "Granite" }, now), false);
  assert.equal(lisBrief({ leadInvalidSource: "MARK" }, now), true);
  assert.equal(lisJoin("LIVE+BOOK", now), true);
  assert.equal(lisJoin("ANNA NOAH", now), false);
  assert.equal(lisRoute("SALE:EAST", now), true);
  assert.equal(lisRoute("SETHOLD", now), false);
  assert.equal(lisBrief("MANUAL", now), false);
  assert.equal(lisBrief("MARKS", now), false);
  assert.equal(lisLong("TenCharsXX", now), true);
  assert.equal(lisLong("NineChars", now), false);
  assert.equal(lisLane("MANUAL", now), "hall");
  assert.equal(lisLane("AUTO", now), "desk");
  assert.equal(lisLane("HOLD", now), "hold");
  assert.equal(lisLane("VOID", now), "guest");
  assert.equal(lisLane("PAIR", now), "join");
  assert.equal(lisLane("2026-11-19T12:00:00.000Z", now), "desk");
  assert.equal(lisLane("2026-11-14T12:00:00.000Z", now), "hold");
  assert.equal(lisLane("2025-01-01T00:00:00.000Z", now), "guest");
  assert.equal(lisLane("Granite", now), "plain");
  assert.equal(lisLane("MARK", now), "brief");
  assert.equal(lisLane("20261120T073000Z", now), "stamp");
  assert.equal(lisLane("Amsterdam", now), "vowel");
  assert.equal(lisLane("silent book", now), "vacant");
  assert.equal(lisLane("alpha/beta/gamma", now), "route");
  assert.equal(lisLane("manual staff", now), "hall");
  assert.equal(lisOpen(""), true);
  assert.equal(lisOpen({ leadInvalidSource: "" }), true);
  assert.equal(lisState({ name: "Ada" }), "");
  assert.equal(lisState({ leadInvalidSource: "Paris", balance: 1 }), "");
  assert.equal(lisHue("MANUAL", now), "champagne");
  assert.equal(lisHue("MANUAL+STAFF", now), "graphite");
  assert.equal(lisHue("2026-11-14T12:00:00.000Z", now), "champagne");
  assert.equal(lisHue("2026-11-19T12:00:00.000Z", now), "graphite");
  assert.equal(lisSoon("MARK", now), true);
  assert.equal(lisSoon("MANUAL", now), false);
  assert.equal(lisSoon("ABC", now), true);
  assert.equal(lisSoon("AB", now), false);
  assert.equal(lisHue("Marble", now), "ivory");
  assert.equal(lisLength("yes"), 3);
  assert.equal(lisEven("ab"), true);
  assert.equal(lisFirst("Paris"), true);
  assert.equal(lisSpace("needs review"), true);
  assert.equal(lisVowel("Amsterdam"), true);
  assert.equal(lisDigit("Room4"), true);
  assert.equal(lisLower("paris"), true);
  assert.equal(lisUpper("APPROVEDX"), true);
  assert.equal(lisUpper("APPROVED"), false);
  assert.equal(lisUpper("SEALED"), false);
  assert.equal(lisUpper("CLEAR"), false);
  const marks: LisRow[] = [
    { id: "1", label: "Ada", code: "MANUAL" },
    { id: "2", label: "Bea", code: "MANUAL" },
    { id: "3", label: "Cara", code: "Marble" },
  ];
  assert.equal(leadingSel(marks), "hall");
  assert.match(lisLanesCsv(marks), /hall,2/);
  assert.match(lisRowsCsv(marks, ["1"]), /Ada,MANUAL/);
  assert.equal(crmv4Text("tr", "oplTitle"), ROUND366_COPY.tr.oplTitle);
  assert.equal(crmv4Text("de", "lisTitle"), ROUND366_COPY.de.lisTitle);
  assert.equal(crmv4Text("ru", "dsTablinumKicker"), ROUND366_COPY.ru.dsTablinumKicker);
  assert.equal(crmv4Text("ar", "tcDromosLead"), ROUND366_COPY.ar.tcDromosLead);
  const keys = Object.keys(ROUND366_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND366_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-opaline/);
  assert.match(css, /\.c4-lisplate/);
  assert.match(css, /\.c4-opaline-column/);
  assert.match(css, /\.c4-lisplate-column/);
  assert.match(css, /\.c4-doc-tablinum/);
  assert.match(css, /\.c4-ticket-dromos/);
  assert.match(css, /\.c4-ds-tablinum-mast/);
  assert.match(css, /\.c4-tc-dromos-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round366.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadInvalidSource:/);
  assert.match(viewFile, /opalineCsv/);
  assert.match(viewFile, /lisRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-lisplate-search/);
  assert.match(viewFile, /opalineTimeline/);
  assert.match(viewFile, /c4-opaline-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "opl"/);
  assert.match(app, /view === "lis"/);
  const docs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round94.tsx"), "utf8");
  assert.match(docs, /c4-doc-tablinum/);
  assert.match(docs, /c4-ds-tablinum-mast/);
  assert.match(docs, /data-logo="mono"/);
  assert.match(docs, /dsTablinumKicker/);
  assert.match(docs, /dsTablinumLead/);
  assert.match(docs, /data-doc-tablinum/);
  const visit = docs.slice(docs.indexOf("export function DocStatusGlance"));
  assert.equal(visit.includes("amount"), false);
  assert.equal(visit.includes("price"), false);
  const channel = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round98.tsx"), "utf8");
  assert.match(channel, /c4-ticket-dromos/);
  assert.match(channel, /c4-tc-dromos-mast/);
  assert.match(channel, /tcDromosKicker/);
  assert.match(channel, /tcDromosLead/);
  assert.match(channel, /data-ticket-dromos/);
  const porch = channel.slice(channel.indexOf("export function ChannelGlance"));
  assert.equal(porch.includes("amount"), false);
  assert.equal(porch.includes("profit"), false);
  assert.match(porch, /channelText/);
  const namedKeys = `${viewFile}\n${docs}\n${channel}`.match(/"(opl|lis|dsTablinum|tcDromos)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND366_COPY.en[key as keyof typeof ROUND366_COPY.en], "string", key);
  console.log("crmv4 round366 tests passed");
}

main();
