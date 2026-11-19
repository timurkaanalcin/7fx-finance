/**
 * Duplex rules, windrose plates, the ivory playbill unctorium, and the graphite source natatio.
 * Run: TZ=UTC npx tsx tests/crmv4-round324.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND324_COPY } from "../src/lib/crmv4/copy-round324";
import {
  ROUND324_FEATURES,
  activeArc,
  activeDrop,
  activeInk,
  activePart,
  addDuplex,
  briskDuplex,
  dropDuplexView,
  duplexArc,
  duplexBand,
  duplexDrop,
  duplexGap,
  duplexInk,
  duplexInner,
  duplexOuter,
  duplexPart,
  duplexTimeline,
  fairSmith,
  fullArc,
  idleDuplex,
  lateDuplex,
  leadingWindrose,
  moveDuplexFocus,
  overdueDuplex,
  pairArc,
  quietInk,
  readDuplexViews,
  reminderDuplexRules,
  restingDuplex,
  suggestDrop,
  suggestInk,
  suggestPart,
  windroseBanner,
  windroseBrief,
  windroseCapital,
  windroseCardinal,
  windroseCoast,
  windroseDigit,
  windroseEven,
  windroseFigure,
  windroseFirst,
  windroseHue,
  windroseHyphen,
  windroseLane,
  windroseLanesCsv,
  windroseLength,
  windroseLower,
  windroseOpen,
  windroseRowsCsv,
  windroseSpace,
  windroseSplit,
  windroseState,
  windroseTail,
  windroseTwin,
  windroseUpper,
  windroseVowel,
  type Duplex,
  type WindroseRow,
} from "../src/lib/crmv4/round324";

function rule(partial: Partial<Duplex> & { id: string; title: string }): Duplex {
  return {
    note: "",
    smith: "",
    part: "",
    drop: null,
    ink: "",
    arc: 3,
    tags: [],
    sprung: false,
    cocked: false,
    cased: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND324_FEATURES.length, 25);
  assert.equal(ROUND324_FEATURES.includes("desk-windrose"), true);
  assert.equal(ROUND324_FEATURES.includes("arc-sla"), true);
  assert.equal(ROUND324_FEATURES.includes("fair-smith"), true);
  assert.equal(ROUND324_FEATURES.includes("case"), true);
  assert.equal(ROUND324_FEATURES.includes("gilt-ink"), true);
  assert.equal(duplexPart(" locking "), "locking");
  assert.equal(duplexPart("brass"), "");
  assert.equal(duplexDrop("2"), 2);
  assert.equal(duplexDrop(6), 6);
  assert.equal(duplexDrop(9), 9);
  assert.equal(duplexDrop(12), 12);
  assert.equal(duplexDrop("1"), null);
  assert.equal(duplexDrop("4"), null);
  assert.equal(duplexArc("3"), 3);
  assert.equal(duplexArc(6), 6);
  assert.equal(duplexArc("9"), 9);
  assert.equal(duplexArc("4"), null);
  assert.equal(duplexArc("12"), null);
  assert.equal(duplexInk("gilt"), "GILT");
  assert.equal(duplexInk("ivory"), "IVORY");
  assert.equal(duplexInk("graphite"), "GRAPHITE");
  assert.equal(duplexInk("hot"), "");
  assert.equal(duplexInner("locking"), true);
  assert.equal(duplexInner("IMPULSE"), true);
  assert.equal(duplexInner("roller"), false);
  assert.equal(duplexOuter("roller"), true);
  assert.equal(duplexOuter("ruby"), true);
  assert.equal(duplexOuter("locking"), false);
  assert.equal(duplexBand("locking"), "gate");
  assert.equal(duplexBand("impulse"), "kick");
  assert.equal(duplexBand("roller"), "drum");
  assert.equal(duplexBand("ruby"), "stone");
  assert.equal(duplexBand(""), "");
  assert.equal(duplexGap("locking", "ruby"), 3);
  assert.equal(duplexGap("roller", "nope"), null);
  assert.equal(quietInk("ivory"), true);
  assert.equal(quietInk("graphite"), true);
  assert.equal(quietInk("gilt"), false);
  assert.equal(pairArc(6), true);
  assert.equal(pairArc(3), false);
  assert.equal(fullArc("9"), true);
  assert.equal(fullArc(6), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activePart("roller"), "roller");
  assert.equal(activePart("gold"), "all");
  assert.equal(activeDrop("12"), "12");
  assert.equal(activeDrop("2"), "2");
  assert.equal(activeDrop("1"), "all");
  assert.equal(activeArc("3"), "3");
  assert.equal(activeArc("4"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveDuplexFocus(0, 3, -1), 2);
  assert.equal(moveDuplexFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", part: "roller", arc: 3, smith: "Ned" }),
    rule({ id: "b", title: "Bea", part: "locking", ink: "GRAPHITE", drop: 12, arc: 9, smith: "Ned" }),
    rule({ id: "c", title: "Cara", part: "ruby", ink: "GRAPHITE", drop: 6, smith: "Ida" }),
  ];
  assert.equal(overdueDuplex(cards[0]), true);
  assert.equal(briskDuplex(rule({ id: "g", title: "Gilt", ink: "GILT", drop: 12, arc: 9 })), true);
  assert.equal(briskDuplex(cards[1]), false);
  assert.equal(restingDuplex(rule({ id: "r", title: "Rest", part: "ruby", ink: "IVORY", drop: 6 })), true);
  assert.equal(restingDuplex(cards[2]), false);
  assert.equal(idleDuplex(rule({ id: "i", title: "Idle", drop: 2, arc: 3 })), true);
  assert.equal(lateDuplex(cards[1], "ruby"), true);
  assert.equal(lateDuplex(cards[1], "locking"), false);
  assert.deepEqual(reminderDuplexRules(cards), ["Ada", "Cara"]);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestInk(cards), "IVORY");
  assert.equal(suggestInk([rule({ id: "v", title: "Ivory", ink: "IVORY" })]), "GILT");
  assert.equal(suggestDrop([], 4), 2);
  assert.equal(suggestDrop([], 8), 6);
  assert.equal(suggestDrop([], 14), 9);
  assert.equal(suggestDrop([], 20), 12);
  assert.equal(suggestDrop(cards, 6), 2);
  assert.equal(suggestPart(4), "locking");
  assert.equal(suggestPart(14), "ruby");
  assert.equal(fairSmith(cards, "Ida,Ned"), "Ida");
  const saved = addDuplex([], { title: "Dora", part: "roller", ink: "ivory", drop: "6", arc: "6", tags: "d x z" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].drop, 6);
  assert.equal(saved[0].arc, 6);
  assert.equal(saved[0].tags.join(""), "dx");
  assert.equal(saved[0].audit, "save");
  assert.equal(addDuplex(saved, { title: "Dora" }).length, 1);
  assert.equal(addDuplex([], { title: "Eve" })[0].arc, 3);
  assert.equal(dropDuplexView([{ id: "v", name: "Morning", tray: "bench", query: "", smith: "", ink: "all", part: "all", drop: "all", arc: "all" }], "v").length, 0);
  assert.equal(readDuplexViews([{ id: "v", name: "Morning", tray: "cock" }])[0].tray, "cock");

  assert.equal(windroseCardinal("DAY"), true);
  assert.equal(windroseCardinal({ desk: true }), true);
  assert.equal(windroseSplit({ desk: false }), true);
  assert.equal(windroseCardinal({ desk: "coast" }), false);
  assert.equal(windroseHyphen("re-check"), true);
  assert.equal(windroseHyphen("re/check"), false);
  assert.equal(windroseSplit("needs review"), true);
  assert.equal(windroseBrief("NET"), true);
  assert.equal(windroseBrief("US"), false);
  assert.equal(windroseBanner("VeryLongDeskNameXX"), true);
  assert.equal(windroseBanner("Netherlands"), false);
  assert.equal(windroseLane("US"), "coast");
  assert.equal(windroseLane("NET"), "brief");
  assert.equal(windroseFigure("10.1.1.1"), true);
  assert.equal(windroseLane("10.1.1.1"), "figure");
  assert.equal(windroseTwin("Letter"), true);
  assert.equal(windroseLane("Amsterdam"), "coast");
  assert.equal(windroseLane("Paris"), "coast");
  assert.equal(windroseCoast("Paris"), true);
  assert.equal(windroseOpen(""), true);
  assert.equal(windroseOpen({ desk: "" }), true);
  assert.equal(windroseState({ name: "Ada" }), "");
  assert.equal(windroseState({ desk: "Paris", balance: 1 }), "");
  assert.equal(windroseHue("DAY"), "champagne");
  assert.equal(windroseHue("needs review"), "graphite");
  assert.equal(windroseHue("Letter"), "ivory");
  assert.equal(windroseLength("hold"), 4);
  assert.equal(windroseEven("hold"), true);
  assert.equal(windroseFirst("Paris"), true);
  assert.equal(windroseSpace("needs review"), true);
  assert.equal(windroseVowel("Amsterdam"), true);
  assert.equal(windroseDigit("Room4"), true);
  assert.equal(windroseCapital("PARIS"), true);
  assert.equal(windroseLower("paris"), true);
  assert.equal(windroseUpper("RETENTION"), true);
  assert.equal(windroseUpper("NET"), false);
  assert.equal(windroseTail("Room4"), true);
  const marks: WindroseRow[] = [
    { id: "1", label: "Ada", code: "DAY" },
    { id: "2", label: "Bea", code: "NIGHT" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingWindrose(marks), "cardinal");
  assert.match(windroseLanesCsv(marks), /cardinal,2/);
  assert.match(windroseRowsCsv(marks, ["1"]), /Ada,DAY/);
  assert.match(duplexTimeline(cards).map((lane) => lane.drop).join(","), /12|6/);
  assert.equal(crmv4Text("tr", "dpxTitle"), ROUND324_COPY.tr.dpxTitle);
  assert.equal(crmv4Text("de", "wrsTitle"), ROUND324_COPY.de.wrsTitle);
  assert.equal(crmv4Text("ru", "plyUnctoriumKicker"), ROUND324_COPY.ru.plyUnctoriumKicker);
  assert.equal(crmv4Text("ar", "ivsNatatioLead"), ROUND324_COPY.ar.ivsNatatioLead);
  const keys = Object.keys(ROUND324_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND324_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-duplex/);
  assert.match(css, /\.c4-windrose/);
  assert.match(css, /\.c4-duplex-column/);
  assert.match(css, /\.c4-windrose-column/);
  assert.match(css, /\.c4-ply-unctorium/);
  assert.match(css, /\.c4-ivs-natatio/);
  assert.match(css, /\.c4-ply-unctorium-mast/);
  assert.match(css, /\.c4-ivs-natatio-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round324.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /desk/);
  assert.match(viewFile, /duplexCsv/);
  assert.match(viewFile, /windroseRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-windrose-search/);
  assert.match(viewFile, /duplexTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dpx"/);
  assert.match(app, /view === "wrs"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round144.tsx"), "utf8");
  assert.match(host, /c4-ply-unctorium/);
  assert.match(host, /c4-ply-unctorium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /plyUnctoriumKicker/);
  assert.match(host, /plyUnctoriumLead/);
  assert.match(host, /data-playbill/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-ivs-natatio/);
  assert.match(host, /c4-ivs-natatio-mast/);
  assert.match(host, /ivsNatatioKicker/);
  assert.match(host, /ivsNatatioLead/);
  assert.match(host, /data-ivsource/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(dpx|wrs|plyUnctorium|ivsNatatio)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND324_COPY.en[key as keyof typeof ROUND324_COPY.en], "string", key);
  console.log("crmv4 round324 tests passed");
}

main();
