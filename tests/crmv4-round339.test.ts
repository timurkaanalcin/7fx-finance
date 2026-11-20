/**
 * Oscillator rules, forename plates, the ivory hearth balneum, and the graphite lantern aerarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round339.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND339_COPY } from "../src/lib/crmv4/copy-round339";
import {
  ROUND339_FEATURES,
  activeFinish,
  activePart,
  activeSpring,
  activeTurn,
  addOscillator,
  briskOscillator,
  dropOscillatorView,
  fairPoiser,
  forenameAnna,
  forenameBead,
  forenameCapital,
  forenameDigit,
  forenameEven,
  forenameFirst,
  forenameGap,
  forenameHue,
  forenameJoin,
  forenameLane,
  forenameLanesCsv,
  forenameLength,
  forenameLeo,
  forenameLower,
  forenameMax,
  forenameNoah,
  forenameOpen,
  forenamePlain,
  forenameRibbon,
  forenameRowsCsv,
  forenameSoon,
  forenameSpace,
  forenameState,
  forenameUpper,
  forenameVowel,
  fullSpring,
  idleOscillator,
  lateOscillator,
  leadingForename,
  moveOscillatorFocus,
  oscillatorBand,
  oscillatorBeat,
  oscillatorFilm,
  oscillatorGap,
  oscillatorInner,
  oscillatorLimb,
  oscillatorOuter,
  oscillatorRate,
  oscillatorTimeline,
  overdueOscillator,
  pairSpring,
  quietFinish,
  readOscillatorViews,
  reminderOscillatorRules,
  restingOscillator,
  suggestFinish,
  suggestPart,
  suggestTurn,
  type ForenameRow,
  type Oscillator,
} from "../src/lib/crmv4/round339";

function rule(partial: Partial<Oscillator> & { id: string; title: string }): Oscillator {
  return {
    note: "",
    poiser: "",
    limb: "",
    beat: null,
    film: "",
    rate: 4,
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
  assert.equal(ROUND339_FEATURES.length, 25);
  assert.equal(ROUND339_FEATURES.includes("forename-plate"), true);
  assert.equal(ROUND339_FEATURES.includes("amplitude-sla"), true);
  assert.equal(ROUND339_FEATURES.includes("fair-poiser"), true);
  assert.equal(ROUND339_FEATURES.includes("vault-file"), true);
  assert.equal(ROUND339_FEATURES.includes("rim-notices"), true);
  assert.equal(ROUND339_FEATURES.includes("oscillator-search"), true);
  assert.equal(ROUND339_FEATURES.includes("amplitude-timeline"), true);
  assert.equal(oscillatorLimb(" rim "), "rim");
  assert.equal(oscillatorLimb("brass"), "");
  assert.equal(oscillatorBeat("5"), 5);
  assert.equal(oscillatorBeat(15), 15);
  assert.equal(oscillatorBeat(25), 25);
  assert.equal(oscillatorBeat(35), 35);
  assert.equal(oscillatorBeat("4"), null);
  assert.equal(oscillatorBeat("12"), null);
  assert.equal(oscillatorRate("4"), 4);
  assert.equal(oscillatorRate(8), 8);
  assert.equal(oscillatorRate("12"), 12);
  assert.equal(oscillatorRate("3"), null);
  assert.equal(oscillatorRate("6"), null);
  assert.equal(oscillatorFilm("gilt"), "GILT");
  assert.equal(oscillatorFilm("ivory"), "IVORY");
  assert.equal(oscillatorFilm("graphite"), "GRAPHITE");
  assert.equal(oscillatorFilm("hot"), "");
  assert.equal(oscillatorInner("rim"), true);
  assert.equal(oscillatorInner("ARM"), true);
  assert.equal(oscillatorInner("staff"), false);
  assert.equal(oscillatorOuter("staff"), true);
  assert.equal(oscillatorOuter("roller"), true);
  assert.equal(oscillatorOuter("rim"), false);
  assert.equal(oscillatorBand("rim"), "hoop");
  assert.equal(oscillatorBand("arm"), "spoke");
  assert.equal(oscillatorBand("staff"), "pivot");
  assert.equal(oscillatorBand("roller"), "jewel");
  assert.equal(oscillatorGap("rim", "roller"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairSpring(8), true);
  assert.equal(pairSpring(4), false);
  assert.equal(fullSpring(12), true);
  assert.equal(fullSpring(8), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTurn("15"), "15");
  assert.equal(activeTurn("8"), "all");
  assert.equal(activeSpring("12"), "12");
  assert.equal(activeSpring("7"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(6), "rim");
  assert.equal(suggestPart(10), "roller");
  assert.equal(suggestTurn([], 3), 5);
  assert.equal(suggestTurn([], 8), 15);
  assert.equal(suggestTurn([], 14), 25);
  assert.equal(suggestTurn([], 20), 35);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveOscillatorFocus(0, 3, 1), 1);
  assert.equal(moveOscillatorFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "rim" });
  const due = rule({ id: "b", title: "Bea", limb: "staff", rate: 4 });
  const quiet = rule({ id: "c", title: "Cara", beat: 5, rate: 4 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", beat: 35, rate: 12 });
  const fax = rule({ id: "e", title: "Eve", limb: "roller", film: "IVORY", beat: 15 });
  assert.equal(lateOscillator(late, "roller"), true);
  assert.equal(lateOscillator(late, "rim"), false);
  assert.equal(overdueOscillator(due), true);
  assert.equal(idleOscillator(quiet), true);
  assert.equal(briskOscillator(cell), true);
  assert.equal(restingOscillator(fax), true);
  assert.deepEqual(reminderOscillatorRules([due, late]), ["Bea"]);
  assert.equal(fairPoiser([rule({ id: "1", title: "One", poiser: "Ada" }), rule({ id: "2", title: "Two", poiser: "Bea" }), rule({ id: "3", title: "Three", poiser: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 35 }), rule({ id: "2", title: "East", beat: 10 })];
  assert.match(oscillatorTimeline(cards).map((lane) => lane.beat).join(","), /35/);
  const saved = addOscillator([], { title: "Ada", limb: "arm", beat: "15", film: "gilt", rate: "8", tags: "c d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "arm");
  assert.equal(saved[0].beat, 15);
  assert.equal(saved[0].rate, 8);
  assert.deepEqual(saved[0].tags, ["c", "d"]);
  assert.equal(addOscillator(saved, { title: "Ada" }).length, 1);
  assert.equal(addOscillator([], { title: "Eve" })[0].rate, 4);
  assert.equal(dropOscillatorView([{ id: "v", name: "Morning", tray: "board", query: "", poiser: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readOscillatorViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(forenameAnna("anna"), true);
  assert.equal(forenameAnna("ANNA"), true);
  assert.equal(forenameNoah("NOAH"), true);
  assert.equal(forenameLeo("LEO"), true);
  assert.equal(forenameMax("MAX"), true);
  assert.equal(forenameAnna({ firstName: true }), true);
  assert.equal(forenamePlain({ firstName: false }), true);
  assert.equal(forenameNoah({ firstName: false }), false);
  assert.equal(forenamePlain({ firstName: "Letter" }), true);
  assert.equal(forenameAnna({ firstName: "Letter" }), false);
  assert.equal(forenameBead({ firstName: "Ada" }), true);
  assert.equal(forenameJoin("ANNA&NOAH"), true);
  assert.equal(forenameJoin("ANNA NOAH"), false);
  assert.equal(forenameGap("LEO:MAX"), true);
  assert.equal(forenameGap("LIVEHOLD"), false);
  assert.equal(forenameBead("Ada"), true);
  assert.equal(forenameBead("ANNA"), false);
  assert.equal(forenameRibbon("Abcdefghijklmnopqr"), true);
  assert.equal(forenameRibbon("Amsterdam"), false);
  assert.equal(forenameLane("ANNA"), "anna");
  assert.equal(forenameLane("Ada"), "bead");
  assert.equal(forenameLane("Letter"), "plain");
  assert.equal(forenameLane("10language"), "mark");
  assert.equal(forenameLane("Amsterdam"), "vowel");
  assert.equal(forenameOpen(""), true);
  assert.equal(forenameOpen({ firstName: "" }), true);
  assert.equal(forenameState({ name: "Ada" }), "");
  assert.equal(forenameState({ firstName: "Paris", balance: 1 }), "");
  assert.equal(forenameHue("ANNA"), "champagne");
  assert.equal(forenameHue("ANNA&NOAH"), "graphite");
  assert.equal(forenameHue("LEO"), "champagne");
  assert.equal(forenameSoon("Ada"), true);
  assert.equal(forenameSoon("ANNA"), false);
  assert.equal(forenameSoon("Leonard"), true);
  assert.equal(forenameSoon("Amsterdam"), false);
  assert.equal(forenameHue("Letter"), "ivory");
  assert.equal(forenameLength("turk"), 4);
  assert.equal(forenameEven("turk"), true);
  assert.equal(forenameFirst("Paris"), true);
  assert.equal(forenameSpace("needs review"), true);
  assert.equal(forenameVowel("Amsterdam"), true);
  assert.equal(forenameDigit("Room4"), true);
  assert.equal(forenameCapital("PARIS"), true);
  assert.equal(forenameLower("paris"), true);
  assert.equal(forenameUpper("LEONARD"), true);
  assert.equal(forenameUpper("ANNA"), false);
  assert.equal(forenameUpper("NOAH"), false);
  const marks: ForenameRow[] = [
    { id: "1", label: "Ada", code: "ANNA" },
    { id: "2", label: "Bea", code: "ANNA" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingForename(marks), "anna");
  assert.match(forenameLanesCsv(marks), /anna,2/);
  assert.match(forenameRowsCsv(marks, ["1"]), /Ada,ANNA/);
  assert.equal(crmv4Text("tr", "oscTitle"), ROUND339_COPY.tr.oscTitle);
  assert.equal(crmv4Text("de", "fnmTitle"), ROUND339_COPY.de.fnmTitle);
  assert.equal(crmv4Text("ru", "hrlBalneumKicker"), ROUND339_COPY.ru.hrlBalneumKicker);
  assert.equal(crmv4Text("ar", "ltnAerariumLead"), ROUND339_COPY.ar.ltnAerariumLead);
  const keys = Object.keys(ROUND339_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND339_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-oscillator/);
  assert.match(css, /\.c4-forename/);
  assert.match(css, /\.c4-oscillator-column/);
  assert.match(css, /\.c4-forename-column/);
  assert.match(css, /\.c4-hrl-balneum/);
  assert.match(css, /\.c4-ltn-aerarium/);
  assert.match(css, /\.c4-hrl-balneum-mast/);
  assert.match(css, /\.c4-ltn-aerarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round339.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /firstName:/);
  assert.match(viewFile, /oscillatorCsv/);
  assert.match(viewFile, /forenameRowsCsv/);
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
  assert.match(viewFile, /c4-forename-search/);
  assert.match(viewFile, /oscillatorTimeline/);
  assert.match(viewFile, /c4-oscillator-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "osc"/);
  assert.match(app, /view === "fnm"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round159.tsx"), "utf8");
  assert.match(host, /c4-hrl-balneum/);
  assert.match(host, /c4-hrl-balneum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /hrlBalneumKicker/);
  assert.match(host, /hrlBalneumLead/);
  assert.match(host, /data-relays/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-ltn-aerarium/);
  assert.match(host, /c4-ltn-aerarium-mast/);
  assert.match(host, /ltnAerariumKicker/);
  assert.match(host, /ltnAerariumLead/);
  assert.match(host, /data-lanterns/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(osc|fnm|hrlBalneum|ltnAerarium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND339_COPY.en[key as keyof typeof ROUND339_COPY.en], "string", key);
  console.log("crmv4 round339 tests passed");
}

main();
