/**
 * Detent rules, tellurion plates, the ivory proof pistrinum, and the graphite given viridarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round334.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND334_COPY } from "../src/lib/crmv4/copy-round334";
import {
  ROUND334_FEATURES,
  activeBeat,
  activeFilm,
  activeLimb,
  activeRate,
  addDetent,
  briskDetent,
  dropDetentView,
  tellurionBead,
  tellurionCapital,
  tellurionDigit,
  tellurionEven,
  tellurionFirst,
  tellurionGap,
  tellurionDesk,
  tellurionHue,
  tellurionJoin,
  tellurionLane,
  tellurionLanesCsv,
  tellurionLength,
  tellurionCell,
  tellurionLower,
  tellurionOpen,
  tellurionPlain,
  tellurionFax,
  tellurionRibbon,
  tellurionRowsCsv,
  tellurionSpace,
  tellurionState,
  tellurionUpper,
  tellurionVowel,
  tellurionHome,
  fairSetter,
  fullRate,
  detentBand,
  detentBeat,
  detentFilm,
  detentGap,
  detentInner,
  detentLimb,
  detentOuter,
  detentRate,
  detentTimeline,
  idleDetent,
  lateDetent,
  leadingTellurion,
  moveDetentFocus,
  overdueDetent,
  pairRate,
  quietFilm,
  readDetentViews,
  reminderDetentRules,
  restingDetent,
  suggestBeat,
  suggestFilm,
  suggestLimb,
  type TellurionRow,
  type Detent,
} from "../src/lib/crmv4/round334";

function rule(partial: Partial<Detent> & { id: string; title: string }): Detent {
  return {
    note: "",
    setter: "",
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
  assert.equal(ROUND334_FEATURES.length, 25);
  assert.equal(ROUND334_FEATURES.includes("phone-tellurion"), true);
  assert.equal(ROUND334_FEATURES.includes("spring-sla"), true);
  assert.equal(ROUND334_FEATURES.includes("fair-setter"), true);
  assert.equal(ROUND334_FEATURES.includes("casket"), true);
  assert.equal(ROUND334_FEATURES.includes("horn-notices"), true);
  assert.equal(ROUND334_FEATURES.includes("detent-search"), true);
  assert.equal(ROUND334_FEATURES.includes("angle-timeline"), true);
  assert.equal(detentLimb(" horn "), "horn");
  assert.equal(detentLimb("brass"), "");
  assert.equal(detentBeat("5"), 5);
  assert.equal(detentBeat(10), 10);
  assert.equal(detentBeat(15), 15);
  assert.equal(detentBeat(20), 20);
  assert.equal(detentBeat("4"), null);
  assert.equal(detentRate("1"), 1);
  assert.equal(detentRate(4), 4);
  assert.equal(detentRate("7"), 7);
  assert.equal(detentRate("2"), null);
  assert.equal(detentFilm("gilt"), "GILT");
  assert.equal(detentFilm("ivory"), "IVORY");
  assert.equal(detentFilm("graphite"), "GRAPHITE");
  assert.equal(detentFilm("hot"), "");
  assert.equal(detentInner("horn"), true);
  assert.equal(detentInner("LOCKING"), true);
  assert.equal(detentInner("passing"), false);
  assert.equal(detentOuter("passing"), true);
  assert.equal(detentOuter("discharge"), true);
  assert.equal(detentOuter("horn"), false);
  assert.equal(detentBand("horn"), "tip");
  assert.equal(detentBand("locking"), "stone");
  assert.equal(detentBand("passing"), "roller");
  assert.equal(detentBand("discharge"), "spring");
  assert.equal(detentGap("horn", "discharge"), 3);
  assert.equal(quietFilm("ivory"), true);
  assert.equal(quietFilm("gilt"), false);
  assert.equal(pairRate(4), true);
  assert.equal(pairRate(1), false);
  assert.equal(fullRate(7), true);
  assert.equal(fullRate(4), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeBeat("10"), "10");
  assert.equal(activeRate("7"), "7");
  assert.equal(activeBeat("3"), "all");
  assert.equal(activeRate("3"), "all");
  assert.equal(activeFilm("gilt", ["GILT"]), "GILT");
  assert.equal(suggestLimb(7), "horn");
  assert.equal(suggestLimb(10), "discharge");
  assert.equal(suggestBeat([], 3), 5);
  assert.equal(suggestBeat([], 8), 10);
  assert.equal(suggestBeat([], 12), 15);
  assert.equal(suggestBeat([], 20), 20);
  assert.equal(suggestFilm([]), "GRAPHITE");
  assert.equal(moveDetentFocus(0, 3, 1), 1);
  assert.equal(moveDetentFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "horn" });
  const due = rule({ id: "b", title: "Bea", limb: "passing", rate: 1 });
  const quiet = rule({ id: "c", title: "Cara", beat: 5, rate: 1 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", beat: 20, rate: 7 });
  const fax = rule({ id: "e", title: "Eve", limb: "discharge", film: "IVORY", beat: 10 });
  assert.equal(lateDetent(late, "discharge"), true);
  assert.equal(lateDetent(late, "horn"), false);
  assert.equal(overdueDetent(due), true);
  assert.equal(idleDetent(quiet), true);
  assert.equal(briskDetent(cell), true);
  assert.equal(restingDetent(fax), true);
  assert.deepEqual(reminderDetentRules([due, late]), ["Bea"]);
  assert.equal(fairSetter([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 20 }), rule({ id: "2", title: "East", beat: 10 })];
  assert.match(detentTimeline(cards).map((lane) => lane.beat).join(","), /20|10/);
  const saved = addDetent([], { title: "Ada", limb: "locking", beat: "10", film: "gilt", rate: "4", tags: "h d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "locking");
  assert.equal(saved[0].beat, 10);
  assert.equal(saved[0].rate, 4);
  assert.deepEqual(saved[0].tags, ["h", "d"]);
  assert.equal(addDetent(saved, { title: "Ada" }).length, 1);
  assert.equal(addDetent([], { title: "Eve" })[0].rate, 1);
  assert.equal(dropDetentView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readDetentViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(tellurionCell("cell"), true);
  assert.equal(tellurionCell("CELL"), true);
  assert.equal(tellurionDesk("DESK"), true);
  assert.equal(tellurionHome("HOME"), true);
  assert.equal(tellurionFax("FAX"), true);
  assert.equal(tellurionCell({ phone: true }), true);
  assert.equal(tellurionPlain({ phone: false }), true);
  assert.equal(tellurionDesk({ phone: false }), false);
  assert.equal(tellurionPlain({ phone: "plain" }), true);
  assert.equal(tellurionCell({ phone: "plain" }), false);
  assert.equal(tellurionJoin("CELL+DESK"), true);
  assert.equal(tellurionJoin("CELL DESK"), false);
  assert.equal(tellurionGap("CELL-DESK"), true);
  assert.equal(tellurionGap("LIVEHOLD"), false);
  assert.equal(tellurionBead("Beadname"), true);
  assert.equal(tellurionBead("CELL"), false);
  assert.equal(tellurionRibbon("Abcdefghijklmnopqr"), true);
  assert.equal(tellurionRibbon("Amsterdam"), false);
  assert.equal(tellurionLane("CELL"), "cell");
  assert.equal(tellurionLane("Beadname"), "bead");
  assert.equal(tellurionLane("Letters"), "plain");
  assert.equal(tellurionLane("10language"), "mark");
  assert.equal(tellurionLane("Amsterdam"), "vowel");
  assert.equal(tellurionOpen(""), true);
  assert.equal(tellurionOpen({ phone: "" }), true);
  assert.equal(tellurionState({ name: "Ada" }), "");
  assert.equal(tellurionState({ phone: "Paris", balance: 1 }), "");
  assert.equal(tellurionHue("CELL"), "champagne");
  assert.equal(tellurionHue("CELL+DESK"), "graphite");
  assert.equal(tellurionHue("Letters"), "ivory");
  assert.equal(tellurionLength("desk"), 4);
  assert.equal(tellurionEven("desk"), true);
  assert.equal(tellurionFirst("Paris"), true);
  assert.equal(tellurionSpace("needs review"), true);
  assert.equal(tellurionVowel("Amsterdam"), true);
  assert.equal(tellurionDigit("Room4"), true);
  assert.equal(tellurionCapital("PARIS"), true);
  assert.equal(tellurionLower("paris"), true);
  assert.equal(tellurionUpper("CELL"), true);
  assert.equal(tellurionUpper("EN"), false);
  const marks: TellurionRow[] = [
    { id: "1", label: "Ada", code: "CELL" },
    { id: "2", label: "Bea", code: "CELL" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingTellurion(marks), "cell");
  assert.match(tellurionLanesCsv(marks), /cell,2/);
  assert.match(tellurionRowsCsv(marks, ["1"]), /Ada,CELL/);
  assert.equal(crmv4Text("tr", "dtnTitle"), ROUND334_COPY.tr.dtnTitle);
  assert.equal(crmv4Text("de", "tlnTitle"), ROUND334_COPY.de.tlnTitle);
  assert.equal(crmv4Text("ru", "prfPistrinumKicker"), ROUND334_COPY.ru.prfPistrinumKicker);
  assert.equal(crmv4Text("ar", "gvnViridariumLead"), ROUND334_COPY.ar.gvnViridariumLead);
  const keys = Object.keys(ROUND334_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND334_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-detent/);
  assert.match(css, /\.c4-tellurion/);
  assert.match(css, /\.c4-detent-column/);
  assert.match(css, /\.c4-tellurion-column/);
  assert.match(css, /\.c4-prf-pistrinum/);
  assert.match(css, /\.c4-gvn-viridarium/);
  assert.match(css, /\.c4-prf-pistrinum-mast/);
  assert.match(css, /\.c4-gvn-viridarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round334.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /detentCsv/);
  assert.match(viewFile, /tellurionRowsCsv/);
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
  assert.match(viewFile, /c4-tellurion-search/);
  assert.match(viewFile, /detentTimeline/);
  assert.match(viewFile, /c4-detent-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dtn"/);
  assert.match(app, /view === "tln"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round154.tsx"), "utf8");
  assert.match(host, /c4-prf-pistrinum/);
  assert.match(host, /c4-prf-pistrinum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /prfPistrinumKicker/);
  assert.match(host, /prfPistrinumLead/);
  assert.match(host, /data-proofs/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-gvn-viridarium/);
  assert.match(host, /c4-gvn-viridarium-mast/);
  assert.match(host, /gvnViridariumKicker/);
  assert.match(host, /gvnViridariumLead/);
  assert.match(host, /data-given/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(dtn|tln|prfPistrinum|gvnViridarium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND334_COPY.en[key as keyof typeof ROUND334_COPY.en], "string", key);
  console.log("crmv4 round334 tests passed");
}

main();
