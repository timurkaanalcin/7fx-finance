/**
 * Hairspring rules, equation plates, the ivory dispatch tepidarium, and the graphite wing palaestra.
 * Run: TZ=UTC npx tsx tests/crmv4-round331.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND331_COPY } from "../src/lib/crmv4/copy-round331";
import {
  ROUND331_FEATURES,
  activeBeat,
  activeFilm,
  activeLimb,
  activeRate,
  addHairspring,
  briskHairspring,
  dropHairspringView,
  equationBead,
  equationCapital,
  equationCode,
  equationDigit,
  equationEven,
  equationFirst,
  equationGap,
  equationHue,
  equationJoin,
  equationLane,
  equationLanesCsv,
  equationLength,
  equationLower,
  equationOpen,
  equationPlain,
  equationRibbon,
  equationRowsCsv,
  equationSpace,
  equationState,
  equationUpper,
  equationVowel,
  fairWarden,
  fullRate,
  hairspringBand,
  hairspringBeat,
  hairspringFilm,
  hairspringGap,
  hairspringInner,
  hairspringLimb,
  hairspringOuter,
  hairspringRate,
  hairspringTimeline,
  idleHairspring,
  lateHairspring,
  leadingEquation,
  moveHairspringFocus,
  overdueHairspring,
  pairRate,
  quietFilm,
  readHairspringViews,
  reminderHairspringRules,
  restingHairspring,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  type EquationRow,
  type Hairspring,
} from "../src/lib/crmv4/round331";

function rule(partial: Partial<Hairspring> & { id: string; title: string }): Hairspring {
  return {
    note: "",
    warden: "",
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
  assert.equal(ROUND331_FEATURES.length, 25);
  assert.equal(ROUND331_FEATURES.includes("os-equation"), true);
  assert.equal(ROUND331_FEATURES.includes("rate-sla"), true);
  assert.equal(ROUND331_FEATURES.includes("fair-warden"), true);
  assert.equal(ROUND331_FEATURES.includes("chest"), true);
  assert.equal(ROUND331_FEATURES.includes("notice-center"), true);
  assert.equal(ROUND331_FEATURES.includes("quick-search"), true);
  assert.equal(ROUND331_FEATURES.includes("beat-timeline"), true);
  assert.equal(hairspringLimb(" collet "), "collet");
  assert.equal(hairspringLimb("brass"), "");
  assert.equal(hairspringBeat("2"), 2);
  assert.equal(hairspringBeat(5), 5);
  assert.equal(hairspringBeat(8), 8);
  assert.equal(hairspringBeat(11), 11);
  assert.equal(hairspringBeat("4"), null);
  assert.equal(hairspringRate("2"), 2);
  assert.equal(hairspringRate(6), 6);
  assert.equal(hairspringRate("10"), 10);
  assert.equal(hairspringRate("4"), null);
  assert.equal(hairspringFilm("gilt"), "GILT");
  assert.equal(hairspringFilm("ivory"), "IVORY");
  assert.equal(hairspringFilm("graphite"), "GRAPHITE");
  assert.equal(hairspringFilm("hot"), "");
  assert.equal(hairspringInner("collet"), true);
  assert.equal(hairspringInner("COIL"), true);
  assert.equal(hairspringInner("stud"), false);
  assert.equal(hairspringOuter("stud"), true);
  assert.equal(hairspringOuter("curb"), true);
  assert.equal(hairspringOuter("collet"), false);
  assert.equal(hairspringBand("collet"), "eye");
  assert.equal(hairspringBand("coil"), "spiral");
  assert.equal(hairspringBand("stud"), "post");
  assert.equal(hairspringBand("curb"), "index");
  assert.equal(hairspringGap("collet", "curb"), 3);
  assert.equal(quietFilm("ivory"), true);
  assert.equal(quietFilm("gilt"), false);
  assert.equal(pairRate(6), true);
  assert.equal(pairRate(2), false);
  assert.equal(fullRate(10), true);
  assert.equal(fullRate(6), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeBeat("5"), "5");
  assert.equal(activeRate("10"), "10");
  assert.equal(activeBeat("4"), "all");
  assert.equal(activeRate("4"), "all");
  assert.equal(activeFilm("gilt", ["GILT"]), "GILT");
  assert.equal(suggestLimb(7), "collet");
  assert.equal(suggestLimb(10), "curb");
  assert.equal(suggestBeat([], 3), 2);
  assert.equal(suggestBeat([], 8), 5);
  assert.equal(suggestBeat([], 12), 8);
  assert.equal(suggestBeat([], 20), 11);
  assert.equal(suggestFilm([]), "IVORY");
  assert.equal(moveHairspringFocus(0, 3, 1), 1);
  assert.equal(moveHairspringFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "collet" });
  const due = rule({ id: "b", title: "Bea", limb: "stud", rate: 2 });
  const quiet = rule({ id: "c", title: "Cara", beat: 2, rate: 2 });
  const live = rule({ id: "d", title: "Dora", film: "GILT", beat: 11, rate: 10 });
  const rest = rule({ id: "e", title: "Eve", limb: "curb", film: "IVORY", beat: 5 });
  assert.equal(lateHairspring(late, "curb"), true);
  assert.equal(lateHairspring(late, "collet"), false);
  assert.equal(overdueHairspring(due), true);
  assert.equal(idleHairspring(quiet), true);
  assert.equal(briskHairspring(live), true);
  assert.equal(restingHairspring(rest), true);
  assert.deepEqual(reminderHairspringRules([due, late]), ["Bea"]);
  assert.equal(fairWarden([rule({ id: "1", title: "One", warden: "Ada" }), rule({ id: "2", title: "Two", warden: "Bea" }), rule({ id: "3", title: "Three", warden: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 11 }), rule({ id: "2", title: "East", beat: 5 })];
  assert.match(hairspringTimeline(cards).map((lane) => lane.beat).join(","), /11|5/);
  const saved = addHairspring([], { title: "Ada", limb: "coil", beat: "5", film: "gilt", rate: "6", tags: "h s x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "coil");
  assert.equal(saved[0].beat, 5);
  assert.equal(saved[0].rate, 6);
  assert.deepEqual(saved[0].tags, ["h", "s"]);
  assert.equal(addHairspring(saved, { title: "Ada" }).length, 1);
  assert.equal(addHairspring([], { title: "Eve" })[0].rate, 2);
  assert.equal(dropHairspringView([{ id: "v", name: "Morning", tray: "board", query: "", warden: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readHairspringViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(equationCode("win"), true);
  assert.equal(equationCode("MAC"), true);
  assert.equal(equationCode({ lastOs: true }), true);
  assert.equal(equationPlain({ lastOs: false }), true);
  assert.equal(equationCode({ lastOs: "plain" }), false);
  assert.equal(equationJoin("WIN+MAC"), true);
  assert.equal(equationJoin("WIN MAC"), false);
  assert.equal(equationGap("WIN|MAC"), true);
  assert.equal(equationGap("WINMAC"), false);
  assert.equal(equationBead("WrenOs"), true);
  assert.equal(equationBead("HOLD"), false);
  assert.equal(equationRibbon("Abcdefghijklmnop"), true);
  assert.equal(equationRibbon("Amsterdam"), false);
  assert.equal(equationLane("WIN"), "code");
  assert.equal(equationLane("WrenOs"), "bead");
  assert.equal(equationLane("Letters"), "plain");
  assert.equal(equationLane("10language"), "mark");
  assert.equal(equationLane("Amsterdam"), "vowel");
  assert.equal(equationOpen(""), true);
  assert.equal(equationOpen({ lastOs: "" }), true);
  assert.equal(equationState({ name: "Ada" }), "");
  assert.equal(equationState({ lastOs: "Paris", balance: 1 }), "");
  assert.equal(equationHue("WIN"), "champagne");
  assert.equal(equationHue("WIN+MAC"), "graphite");
  assert.equal(equationHue("Letters"), "ivory");
  assert.equal(equationLength("hold"), 4);
  assert.equal(equationEven("hold"), true);
  assert.equal(equationFirst("Paris"), true);
  assert.equal(equationSpace("needs review"), true);
  assert.equal(equationVowel("Amsterdam"), true);
  assert.equal(equationDigit("Room4"), true);
  assert.equal(equationCapital("PARIS"), true);
  assert.equal(equationLower("paris"), true);
  assert.equal(equationUpper("ENGLISH"), true);
  assert.equal(equationUpper("EN"), false);
  const marks: EquationRow[] = [
    { id: "1", label: "Ada", code: "WIN" },
    { id: "2", label: "Bea", code: "MAC" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingEquation(marks), "code");
  assert.match(equationLanesCsv(marks), /code,2/);
  assert.match(equationRowsCsv(marks, ["1"]), /Ada,WIN/);
  assert.equal(crmv4Text("tr", "hspTitle"), ROUND331_COPY.tr.hspTitle);
  assert.equal(crmv4Text("de", "eqnTitle"), ROUND331_COPY.de.eqnTitle);
  assert.equal(crmv4Text("ru", "dspTepidariumKicker"), ROUND331_COPY.ru.dspTepidariumKicker);
  assert.equal(crmv4Text("ar", "dskPalaestraLead"), ROUND331_COPY.ar.dskPalaestraLead);
  const keys = Object.keys(ROUND331_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND331_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hairspring/);
  assert.match(css, /\.c4-equation/);
  assert.match(css, /\.c4-hairspring-column/);
  assert.match(css, /\.c4-equation-column/);
  assert.match(css, /\.c4-dsp-tepidarium/);
  assert.match(css, /\.c4-dsk-palaestra/);
  assert.match(css, /\.c4-dsp-tepidarium-mast/);
  assert.match(css, /\.c4-dsk-palaestra-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round331.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastOs/);
  assert.match(viewFile, /hairspringCsv/);
  assert.match(viewFile, /equationRowsCsv/);
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
  assert.match(viewFile, /c4-equation-search/);
  assert.match(viewFile, /hairspringTimeline/);
  assert.match(viewFile, /c4-hairspring-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hsp"/);
  assert.match(app, /view === "eqn"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round151.tsx"), "utf8");
  assert.match(host, /c4-dsp-tepidarium/);
  assert.match(host, /c4-dsp-tepidarium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /dspTepidariumKicker/);
  assert.match(host, /dspTepidariumLead/);
  assert.match(host, /data-dispatch/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-dsk-palaestra/);
  assert.match(host, /c4-dsk-palaestra-mast/);
  assert.match(host, /dskPalaestraKicker/);
  assert.match(host, /dskPalaestraLead/);
  assert.match(host, /data-wings/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(hsp|eqn|dspTepidarium|dskPalaestra)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND331_COPY.en[key as keyof typeof ROUND331_COPY.en], "string", key);
  console.log("crmv4 round331 tests passed");
}

main();
