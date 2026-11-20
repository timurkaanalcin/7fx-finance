/**
 * Mainspring rules, planisphere plates, the ivory loom praefurnium, and the graphite band heliocaminus.
 * Run: TZ=UTC npx tsx tests/crmv4-round332.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND332_COPY } from "../src/lib/crmv4/copy-round332";
import {
  ROUND332_FEATURES,
  activeBeat,
  activeFilm,
  activeLimb,
  activeRate,
  addMainspring,
  briskMainspring,
  dropMainspringView,
  planisphereBead,
  planisphereCapital,
  planisphereCode,
  planisphereDigit,
  planisphereEven,
  planisphereFirst,
  planisphereGap,
  planisphereHue,
  planisphereJoin,
  planisphereLane,
  planisphereLanesCsv,
  planisphereLength,
  planisphereLower,
  planisphereOpen,
  planispherePlain,
  planisphereRibbon,
  planisphereRowsCsv,
  planisphereSpace,
  planisphereState,
  planisphereUpper,
  planisphereVowel,
  fairWarden,
  fullRate,
  mainspringBand,
  mainspringBeat,
  mainspringFilm,
  mainspringGap,
  mainspringInner,
  mainspringLimb,
  mainspringOuter,
  mainspringRate,
  mainspringTimeline,
  idleMainspring,
  lateMainspring,
  leadingPlanisphere,
  moveMainspringFocus,
  overdueMainspring,
  pairRate,
  quietFilm,
  readMainspringViews,
  reminderMainspringRules,
  restingMainspring,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  type PlanisphereRow,
  type Mainspring,
} from "../src/lib/crmv4/round332";

function rule(partial: Partial<Mainspring> & { id: string; title: string }): Mainspring {
  return {
    note: "",
    warden: "",
    limb: "",
    beat: null,
    film: "",
    rate: 3,
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
  assert.equal(ROUND332_FEATURES.length, 25);
  assert.equal(ROUND332_FEATURES.includes("city-planisphere"), true);
  assert.equal(ROUND332_FEATURES.includes("pull-sla"), true);
  assert.equal(ROUND332_FEATURES.includes("fair-smith"), true);
  assert.equal(ROUND332_FEATURES.includes("vault"), true);
  assert.equal(ROUND332_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND332_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND332_FEATURES.includes("turn-timeline"), true);
  assert.equal(mainspringLimb(" barrel "), "barrel");
  assert.equal(mainspringLimb("brass"), "");
  assert.equal(mainspringBeat("3"), 3);
  assert.equal(mainspringBeat(7), 7);
  assert.equal(mainspringBeat(12), 12);
  assert.equal(mainspringBeat(18), 18);
  assert.equal(mainspringBeat("4"), null);
  assert.equal(mainspringRate("3"), 3);
  assert.equal(mainspringRate(9), 9);
  assert.equal(mainspringRate("15"), 15);
  assert.equal(mainspringRate("4"), null);
  assert.equal(mainspringFilm("gilt"), "GILT");
  assert.equal(mainspringFilm("ivory"), "IVORY");
  assert.equal(mainspringFilm("graphite"), "GRAPHITE");
  assert.equal(mainspringFilm("hot"), "");
  assert.equal(mainspringInner("barrel"), true);
  assert.equal(mainspringInner("ARBOR"), true);
  assert.equal(mainspringInner("hook"), false);
  assert.equal(mainspringOuter("hook"), true);
  assert.equal(mainspringOuter("click"), true);
  assert.equal(mainspringOuter("barrel"), false);
  assert.equal(mainspringBand("barrel"), "drum");
  assert.equal(mainspringBand("arbor"), "axle");
  assert.equal(mainspringBand("hook"), "eye");
  assert.equal(mainspringBand("click"), "pawl");
  assert.equal(mainspringGap("barrel", "click"), 3);
  assert.equal(quietFilm("ivory"), true);
  assert.equal(quietFilm("gilt"), false);
  assert.equal(pairRate(9), true);
  assert.equal(pairRate(3), false);
  assert.equal(fullRate(15), true);
  assert.equal(fullRate(9), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeBeat("7"), "7");
  assert.equal(activeRate("15"), "15");
  assert.equal(activeBeat("4"), "all");
  assert.equal(activeRate("4"), "all");
  assert.equal(activeFilm("gilt", ["GILT"]), "GILT");
  assert.equal(suggestLimb(7), "barrel");
  assert.equal(suggestLimb(10), "click");
  assert.equal(suggestBeat([], 3), 3);
  assert.equal(suggestBeat([], 8), 7);
  assert.equal(suggestBeat([], 12), 12);
  assert.equal(suggestBeat([], 20), 18);
  assert.equal(suggestFilm([]), "IVORY");
  assert.equal(moveMainspringFocus(0, 3, 1), 1);
  assert.equal(moveMainspringFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "barrel" });
  const due = rule({ id: "b", title: "Bea", limb: "hook", rate: 3 });
  const quiet = rule({ id: "c", title: "Cara", beat: 3, rate: 3 });
  const live = rule({ id: "d", title: "Dora", film: "GILT", beat: 18, rate: 15 });
  const rest = rule({ id: "e", title: "Eve", limb: "click", film: "IVORY", beat: 7 });
  assert.equal(lateMainspring(late, "click"), true);
  assert.equal(lateMainspring(late, "barrel"), false);
  assert.equal(overdueMainspring(due), true);
  assert.equal(idleMainspring(quiet), true);
  assert.equal(briskMainspring(live), true);
  assert.equal(restingMainspring(rest), true);
  assert.deepEqual(reminderMainspringRules([due, late]), ["Bea"]);
  assert.equal(fairWarden([rule({ id: "1", title: "One", warden: "Ada" }), rule({ id: "2", title: "Two", warden: "Bea" }), rule({ id: "3", title: "Three", warden: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 18 }), rule({ id: "2", title: "East", beat: 7 })];
  assert.match(mainspringTimeline(cards).map((lane) => lane.beat).join(","), /18|7/);
  const saved = addMainspring([], { title: "Ada", limb: "arbor", beat: "7", film: "gilt", rate: "9", tags: "m n x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "arbor");
  assert.equal(saved[0].beat, 7);
  assert.equal(saved[0].rate, 9);
  assert.deepEqual(saved[0].tags, ["m", "n"]);
  assert.equal(addMainspring(saved, { title: "Ada" }).length, 1);
  assert.equal(addMainspring([], { title: "Eve" })[0].rate, 3);
  assert.equal(dropMainspringView([{ id: "v", name: "Morning", tray: "board", query: "", warden: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readMainspringViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(planisphereCode("nyc"), true);
  assert.equal(planisphereCode("LON"), true);
  assert.equal(planisphereCode({ lastCity: true }), true);
  assert.equal(planispherePlain({ lastCity: false }), true);
  assert.equal(planisphereCode({ lastCity: "plain" }), false);
  assert.equal(planisphereJoin("NYC&LON"), true);
  assert.equal(planisphereJoin("NYC LON"), false);
  assert.equal(planisphereGap("NYC;LON"), true);
  assert.equal(planisphereGap("NYCLON"), false);
  assert.equal(planisphereBead("Istanbul"), true);
  assert.equal(planisphereBead("CITY"), false);
  assert.equal(planisphereRibbon("Abcdefghijklmnopqrst"), true);
  assert.equal(planisphereRibbon("Amsterdam"), false);
  assert.equal(planisphereLane("NYC"), "code");
  assert.equal(planisphereLane("Istanbul"), "bead");
  assert.equal(planisphereLane("Letters"), "plain");
  assert.equal(planisphereLane("10language"), "mark");
  assert.equal(planisphereLane("Amsterdam"), "vowel");
  assert.equal(planisphereOpen(""), true);
  assert.equal(planisphereOpen({ lastCity: "" }), true);
  assert.equal(planisphereState({ name: "Ada" }), "");
  assert.equal(planisphereState({ lastCity: "Paris", balance: 1 }), "");
  assert.equal(planisphereHue("NYC"), "champagne");
  assert.equal(planisphereHue("NYC&LON"), "graphite");
  assert.equal(planisphereHue("Letters"), "ivory");
  assert.equal(planisphereLength("hold"), 4);
  assert.equal(planisphereEven("hold"), true);
  assert.equal(planisphereFirst("Paris"), true);
  assert.equal(planisphereSpace("needs review"), true);
  assert.equal(planisphereVowel("Amsterdam"), true);
  assert.equal(planisphereDigit("Room4"), true);
  assert.equal(planisphereCapital("PARIS"), true);
  assert.equal(planisphereLower("paris"), true);
  assert.equal(planisphereUpper("ENGLISH"), true);
  assert.equal(planisphereUpper("EN"), false);
  const marks: PlanisphereRow[] = [
    { id: "1", label: "Ada", code: "NYC" },
    { id: "2", label: "Bea", code: "LON" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingPlanisphere(marks), "code");
  assert.match(planisphereLanesCsv(marks), /code,2/);
  assert.match(planisphereRowsCsv(marks, ["1"]), /Ada,NYC/);
  assert.equal(crmv4Text("tr", "mspTitle"), ROUND332_COPY.tr.mspTitle);
  assert.equal(crmv4Text("de", "psnTitle"), ROUND332_COPY.de.psnTitle);
  assert.equal(crmv4Text("ru", "lomPraefurniumKicker"), ROUND332_COPY.ru.lomPraefurniumKicker);
  assert.equal(crmv4Text("ar", "bndHeliocaminusLead"), ROUND332_COPY.ar.bndHeliocaminusLead);
  const keys = Object.keys(ROUND332_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND332_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mainspring/);
  assert.match(css, /\.c4-planisphere/);
  assert.match(css, /\.c4-mainspring-column/);
  assert.match(css, /\.c4-planisphere-column/);
  assert.match(css, /\.c4-lom-praefurnium/);
  assert.match(css, /\.c4-bnd-heliocaminus/);
  assert.match(css, /\.c4-lom-praefurnium-mast/);
  assert.match(css, /\.c4-bnd-heliocaminus-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round332.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastCity/);
  assert.match(viewFile, /mainspringCsv/);
  assert.match(viewFile, /planisphereRowsCsv/);
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
  assert.match(viewFile, /c4-planisphere-search/);
  assert.match(viewFile, /mainspringTimeline/);
  assert.match(viewFile, /c4-mainspring-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "msp"/);
  assert.match(app, /view === "psn"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round152.tsx"), "utf8");
  assert.match(host, /c4-lom-praefurnium/);
  assert.match(host, /c4-lom-praefurnium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /lomPraefurniumKicker/);
  assert.match(host, /lomPraefurniumLead/);
  assert.match(host, /data-loom/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-bnd-heliocaminus/);
  assert.match(host, /c4-bnd-heliocaminus-mast/);
  assert.match(host, /bndHeliocaminusKicker/);
  assert.match(host, /bndHeliocaminusLead/);
  assert.match(host, /data-bands/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(msp|psn|lomPraefurnium|bndHeliocaminus)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND332_COPY.en[key as keyof typeof ROUND332_COPY.en], "string", key);
  console.log("crmv4 round332 tests passed");
}

main();
