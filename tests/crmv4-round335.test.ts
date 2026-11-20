/**
 * Repeater rules, gong plates, the ivory proof pistrinum, and the graphite given viridarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round335.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND335_COPY } from "../src/lib/crmv4/copy-round335";
import {
  ROUND335_FEATURES,
  activeBeat,
  activeFilm,
  activeLimb,
  activeRate,
  addRepeater,
  briskRepeater,
  dropRepeaterView,
  gongBead,
  gongCapital,
  gongDigit,
  gongEven,
  gongFirst,
  gongGap,
  gongEdge,
  gongHue,
  gongJoin,
  gongLane,
  gongLanesCsv,
  gongLength,
  gongCore,
  gongLower,
  gongOpen,
  gongPlain,
  gongVault,
  gongRibbon,
  gongRowsCsv,
  gongSpace,
  gongState,
  gongUpper,
  gongVowel,
  gongPrime,
  fairStriker,
  fullRate,
  repeaterBand,
  repeaterBeat,
  repeaterFilm,
  repeaterGap,
  repeaterInner,
  repeaterLimb,
  repeaterOuter,
  repeaterRate,
  repeaterTimeline,
  idleRepeater,
  lateRepeater,
  leadingGong,
  moveRepeaterFocus,
  overdueRepeater,
  pairRate,
  quietFilm,
  readRepeaterViews,
  reminderRepeaterRules,
  restingRepeater,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  type GongRow,
  type Repeater,
} from "../src/lib/crmv4/round335";

function rule(partial: Partial<Repeater> & { id: string; title: string }): Repeater {
  return {
    note: "",
    striker: "",
    limb: "",
    beat: null,
    film: "",
    rate: 2,
    tags: [],
    poised: false,
    pegged: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND335_FEATURES.length, 25);
  assert.equal(ROUND335_FEATURES.includes("group-gong"), true);
  assert.equal(ROUND335_FEATURES.includes("strike-sla"), true);
  assert.equal(ROUND335_FEATURES.includes("fair-striker"), true);
  assert.equal(ROUND335_FEATURES.includes("casket"), true);
  assert.equal(ROUND335_FEATURES.includes("rack-notices"), true);
  assert.equal(ROUND335_FEATURES.includes("repeater-search"), true);
  assert.equal(ROUND335_FEATURES.includes("quarter-timeline"), true);
  assert.equal(repeaterLimb(" rack "), "rack");
  assert.equal(repeaterLimb("brass"), "");
  assert.equal(repeaterBeat("3"), 3);
  assert.equal(repeaterBeat(6), 6);
  assert.equal(repeaterBeat(12), 12);
  assert.equal(repeaterBeat(24), 24);
  assert.equal(repeaterBeat("4"), null);
  assert.equal(repeaterRate("2"), 2);
  assert.equal(repeaterRate(5), 5);
  assert.equal(repeaterRate("8"), 8);
  assert.equal(repeaterRate("1"), null);
  assert.equal(repeaterFilm("gilt"), "GILT");
  assert.equal(repeaterFilm("ivory"), "IVORY");
  assert.equal(repeaterFilm("graphite"), "GRAPHITE");
  assert.equal(repeaterFilm("hot"), "");
  assert.equal(repeaterInner("rack"), true);
  assert.equal(repeaterInner("SNAIL"), true);
  assert.equal(repeaterInner("hammer"), false);
  assert.equal(repeaterOuter("hammer"), true);
  assert.equal(repeaterOuter("gong"), true);
  assert.equal(repeaterOuter("rack"), false);
  assert.equal(repeaterBand("rack"), "tooth");
  assert.equal(repeaterBand("snail"), "cam");
  assert.equal(repeaterBand("hammer"), "head");
  assert.equal(repeaterBand("gong"), "wire");
  assert.equal(repeaterGap("rack", "gong"), 3);
  assert.equal(quietFilm("ivory"), true);
  assert.equal(quietFilm("gilt"), false);
  assert.equal(pairRate(5), true);
  assert.equal(pairRate(2), false);
  assert.equal(fullRate(8), true);
  assert.equal(fullRate(5), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeBeat("6"), "6");
  assert.equal(activeRate("8"), "8");
  assert.equal(activeBeat("4"), "all");
  assert.equal(activeRate("3"), "all");
  assert.equal(activeFilm("gilt", ["GILT"]), "GILT");
  assert.equal(suggestLimb(7), "rack");
  assert.equal(suggestLimb(10), "gong");
  assert.equal(suggestBeat([], 3), 3);
  assert.equal(suggestBeat([], 8), 6);
  assert.equal(suggestBeat([], 14), 12);
  assert.equal(suggestBeat([], 20), 24);
  assert.equal(suggestFilm([]), "IVORY");
  assert.equal(moveRepeaterFocus(0, 3, 1), 1);
  assert.equal(moveRepeaterFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "rack" });
  const due = rule({ id: "b", title: "Bea", limb: "hammer", rate: 2 });
  const quiet = rule({ id: "c", title: "Cara", beat: 3, rate: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", beat: 24, rate: 8 });
  const fax = rule({ id: "e", title: "Eve", limb: "gong", film: "IVORY", beat: 6 });
  assert.equal(lateRepeater(late, "gong"), true);
  assert.equal(lateRepeater(late, "rack"), false);
  assert.equal(overdueRepeater(due), true);
  assert.equal(idleRepeater(quiet), true);
  assert.equal(briskRepeater(cell), true);
  assert.equal(restingRepeater(fax), true);
  assert.deepEqual(reminderRepeaterRules([due, late]), ["Bea"]);
  assert.equal(fairStriker([rule({ id: "1", title: "One", striker: "Ada" }), rule({ id: "2", title: "Two", striker: "Bea" }), rule({ id: "3", title: "Three", striker: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 24 }), rule({ id: "2", title: "East", beat: 10 })];
  assert.match(repeaterTimeline(cards).map((lane) => lane.beat).join(","), /24|6/);
  const saved = addRepeater([], { title: "Ada", limb: "snail", beat: "6", film: "gilt", rate: "5", tags: "r s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "snail");
  assert.equal(saved[0].beat, 6);
  assert.equal(saved[0].rate, 5);
  assert.deepEqual(saved[0].tags, ["r", "s"]);
  assert.equal(addRepeater(saved, { title: "Ada" }).length, 1);
  assert.equal(addRepeater([], { title: "Eve" })[0].rate, 2);
  assert.equal(dropRepeaterView([{ id: "v", name: "Morning", tray: "board", query: "", striker: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readRepeaterViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(gongCore("core"), true);
  assert.equal(gongCore("CORE"), true);
  assert.equal(gongEdge("EDGE"), true);
  assert.equal(gongPrime("PRIME"), true);
  assert.equal(gongVault("VAULT"), true);
  assert.equal(gongCore({ tradingGroup: true }), true);
  assert.equal(gongPlain({ tradingGroup: false }), true);
  assert.equal(gongEdge({ tradingGroup: false }), false);
  assert.equal(gongPlain({ tradingGroup: "plain" }), true);
  assert.equal(gongCore({ tradingGroup: "plain" }), false);
  assert.equal(gongJoin("CORE/EDGE"), true);
  assert.equal(gongJoin("CORE EDGE"), false);
  assert.equal(gongGap("CORE:EDGE"), true);
  assert.equal(gongGap("LIVEHOLD"), false);
  assert.equal(gongBead("Beadnam"), true);
  assert.equal(gongBead("CORE"), false);
  assert.equal(gongRibbon("Abcdefghijklmnopqr"), true);
  assert.equal(gongRibbon("Amsterdam"), false);
  assert.equal(gongLane("CORE"), "core");
  assert.equal(gongLane("Beadnam"), "bead");
  assert.equal(gongLane("Letter"), "plain");
  assert.equal(gongLane("10language"), "mark");
  assert.equal(gongLane("Amsterdam"), "vowel");
  assert.equal(gongOpen(""), true);
  assert.equal(gongOpen({ tradingGroup: "" }), true);
  assert.equal(gongState({ name: "Ada" }), "");
  assert.equal(gongState({ tradingGroup: "Paris", balance: 1 }), "");
  assert.equal(gongHue("CORE"), "champagne");
  assert.equal(gongHue("CORE/EDGE"), "graphite");
  assert.equal(gongHue("Letter"), "ivory");
  assert.equal(gongLength("edge"), 4);
  assert.equal(gongEven("edge"), true);
  assert.equal(gongFirst("Paris"), true);
  assert.equal(gongSpace("needs review"), true);
  assert.equal(gongVowel("Amsterdam"), true);
  assert.equal(gongDigit("Room4"), true);
  assert.equal(gongCapital("PARIS"), true);
  assert.equal(gongLower("paris"), true);
  assert.equal(gongUpper("PRIME"), true);
  assert.equal(gongUpper("CORE"), false);
  assert.equal(gongUpper("EN"), false);
  const marks: GongRow[] = [
    { id: "1", label: "Ada", code: "CORE" },
    { id: "2", label: "Bea", code: "CORE" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingGong(marks), "core");
  assert.match(gongLanesCsv(marks), /core,2/);
  assert.match(gongRowsCsv(marks, ["1"]), /Ada,CORE/);
  assert.equal(crmv4Text("tr", "rptTitle"), ROUND335_COPY.tr.rptTitle);
  assert.equal(crmv4Text("de", "gngTitle"), ROUND335_COPY.de.gngTitle);
  assert.equal(crmv4Text("ru", "dktFullonicaKicker"), ROUND335_COPY.ru.dktFullonicaKicker);
  assert.equal(crmv4Text("ar", "famSphaeristeriumLead"), ROUND335_COPY.ar.famSphaeristeriumLead);
  const keys = Object.keys(ROUND335_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND335_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-repeater/);
  assert.match(css, /\.c4-gong/);
  assert.match(css, /\.c4-repeater-column/);
  assert.match(css, /\.c4-gong-column/);
  assert.match(css, /\.c4-dkt-fullonica/);
  assert.match(css, /\.c4-fam-sphaeristerium/);
  assert.match(css, /\.c4-dkt-fullonica-mast/);
  assert.match(css, /\.c4-fam-sphaeristerium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round335.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /tradingGroup/);
  assert.match(viewFile, /repeaterCsv/);
  assert.match(viewFile, /gongRowsCsv/);
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
  assert.match(viewFile, /suggestFilm/);
  assert.match(viewFile, /c4-gong-search/);
  assert.match(viewFile, /repeaterTimeline/);
  assert.match(viewFile, /c4-repeater-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rpt"/);
  assert.match(app, /view === "gng"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round155.tsx"), "utf8");
  assert.match(host, /c4-dkt-fullonica/);
  assert.match(host, /c4-dkt-fullonica-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /dktFullonicaKicker/);
  assert.match(host, /dktFullonicaLead/);
  assert.match(host, /data-dockets/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-fam-sphaeristerium/);
  assert.match(host, /c4-fam-sphaeristerium-mast/);
  assert.match(host, /famSphaeristeriumKicker/);
  assert.match(host, /famSphaeristeriumLead/);
  assert.match(host, /data-family/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(rpt|gng|dktFullonica|famSphaeristerium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND335_COPY.en[key as keyof typeof ROUND335_COPY.en], "string", key);
  console.log("crmv4 round335 tests passed");
}

main();
