/**
 * Coaxial rules, account type plates, the ivory bench caldarium, and the graphite plate tabularium.
 * Run: TZ=UTC npx tsx tests/crmv4-round337.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND337_COPY } from "../src/lib/crmv4/copy-round337";
import {
  ROUND337_FEATURES,
  activeFinish,
  activePart,
  activeSpring,
  activeTurn,
  addCoaxial,
  typeplateBead,
  typeplateCapital,
  typeplatePro,
  typeplateDigit,
  typeplateEven,
  typeplateFirst,
  typeplateGap,
  typeplateVip,
  typeplateHue,
  typeplateJoin,
  typeplateLane,
  typeplateLanesCsv,
  typeplateLength,
  typeplateLower,
  typeplateOpen,
  typeplatePlain,
  typeplateRibbon,
  typeplateRowsCsv,
  typeplateSoon,
  typeplateSpace,
  typeplateState,
  typeplateDemo,
  typeplateUpper,
  typeplateStandard,
  typeplateVowel,
  coaxialBand,
  coaxialBeat,
  coaxialFilm,
  coaxialGap,
  coaxialInner,
  coaxialLimb,
  coaxialOuter,
  coaxialRate,
  coaxialTimeline,
  briskCoaxial,
  dropCoaxialView,
  fairSetter,
  fullSpring,
  idleCoaxial,
  lateCoaxial,
  leadingTypeplate,
  moveCoaxialFocus,
  overdueCoaxial,
  pairSpring,
  quietFinish,
  readCoaxialViews,
  reminderCoaxialRules,
  restingCoaxial,
  suggestFinish,
  suggestPart,
  suggestTurn,
  type TypeplateRow,
  type Coaxial,
} from "../src/lib/crmv4/round337";

function rule(partial: Partial<Coaxial> & { id: string; title: string }): Coaxial {
  return {
    note: "",
    setter: "",
    limb: "",
    beat: null,
    film: "",
    rate: 1,
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
  assert.equal(ROUND337_FEATURES.length, 25);
  assert.equal(ROUND337_FEATURES.includes("account-typeplate"), true);
  assert.equal(ROUND337_FEATURES.includes("lock-sla"), true);
  assert.equal(ROUND337_FEATURES.includes("fair-setter"), true);
  assert.equal(ROUND337_FEATURES.includes("chest"), true);
  assert.equal(ROUND337_FEATURES.includes("escape-notices"), true);
  assert.equal(ROUND337_FEATURES.includes("coaxial-search"), true);
  assert.equal(ROUND337_FEATURES.includes("drop-timeline"), true);
  assert.equal(coaxialLimb(" escape "), "escape");
  assert.equal(coaxialLimb("brass"), "");
  assert.equal(coaxialBeat("3"), 3);
  assert.equal(coaxialBeat(9), 9);
  assert.equal(coaxialBeat(15), 15);
  assert.equal(coaxialBeat(21), 21);
  assert.equal(coaxialBeat("4"), null);
  assert.equal(coaxialBeat("6"), null);
  assert.equal(coaxialRate("2"), 2);
  assert.equal(coaxialRate(5), 5);
  assert.equal(coaxialRate("8"), 8);
  assert.equal(coaxialRate("1"), null);
  assert.equal(coaxialRate("4"), null);
  assert.equal(coaxialFilm("gilt"), "GILT");
  assert.equal(coaxialFilm("ivory"), "IVORY");
  assert.equal(coaxialFilm("graphite"), "GRAPHITE");
  assert.equal(coaxialFilm("hot"), "");
  assert.equal(coaxialInner("escape"), true);
  assert.equal(coaxialInner("PALLET"), true);
  assert.equal(coaxialInner("impulse"), false);
  assert.equal(coaxialOuter("impulse"), true);
  assert.equal(coaxialOuter("locking"), true);
  assert.equal(coaxialOuter("escape"), false);
  assert.equal(coaxialBand("escape"), "wheel");
  assert.equal(coaxialBand("pallet"), "fork");
  assert.equal(coaxialBand("impulse"), "jewel");
  assert.equal(coaxialBand("locking"), "stone");
  assert.equal(coaxialGap("escape", "locking"), 3);
  assert.equal(quietFinish("ivory"), true);
  assert.equal(quietFinish("gilt"), false);
  assert.equal(pairSpring(5), true);
  assert.equal(pairSpring(2), false);
  assert.equal(fullSpring(8), true);
  assert.equal(fullSpring(5), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activeTurn("9"), "9");
  assert.equal(activeTurn("8"), "all");
  assert.equal(activeSpring("8"), "8");
  assert.equal(activeSpring("7"), "all");
  assert.equal(activeTurn("6"), "all");
  assert.equal(activeSpring("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(suggestPart(7), "escape");
  assert.equal(suggestPart(10), "locking");
  assert.equal(suggestTurn([], 3), 3);
  assert.equal(suggestTurn([], 8), 9);
  assert.equal(suggestTurn([], 14), 15);
  assert.equal(suggestTurn([], 20), 21);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(moveCoaxialFocus(0, 3, 1), 1);
  assert.equal(moveCoaxialFocus(0, 3, -1), 2);
  const late = rule({ id: "a", title: "Ada", limb: "escape" });
  const due = rule({ id: "b", title: "Bea", limb: "impulse", rate: 2 });
  const quiet = rule({ id: "c", title: "Cara", beat: 3, rate: 2 });
  const cell = rule({ id: "d", title: "Dora", film: "GILT", beat: 21, rate: 8 });
  const fax = rule({ id: "e", title: "Eve", limb: "locking", film: "IVORY", beat: 9 });
  assert.equal(lateCoaxial(late, "locking"), true);
  assert.equal(lateCoaxial(late, "escape"), false);
  assert.equal(overdueCoaxial(due), true);
  assert.equal(idleCoaxial(quiet), true);
  assert.equal(briskCoaxial(cell), true);
  assert.equal(restingCoaxial(fax), true);
  assert.deepEqual(reminderCoaxialRules([due, late]), ["Bea"]);
  assert.equal(fairSetter([rule({ id: "1", title: "One", setter: "Ada" }), rule({ id: "2", title: "Two", setter: "Bea" }), rule({ id: "3", title: "Three", setter: "Ada" })], "Ada,Bea"), "Bea");
  const cards = [rule({ id: "1", title: "North", beat: 21 }), rule({ id: "2", title: "East", beat: 10 })];
  assert.match(coaxialTimeline(cards).map((lane) => lane.beat).join(","), /21|9/);
  const saved = addCoaxial([], { title: "Ada", limb: "pallet", beat: "9", film: "gilt", rate: "5", tags: "a b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].limb, "pallet");
  assert.equal(saved[0].beat, 9);
  assert.equal(saved[0].rate, 5);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addCoaxial(saved, { title: "Ada" }).length, 1);
  assert.equal(addCoaxial([], { title: "Eve" })[0].rate, 2);
  assert.equal(dropCoaxialView([{ id: "v", name: "Morning", tray: "board", query: "", setter: "", film: "all", limb: "all", beat: "all", rate: "all" }], "v").length, 0);
  assert.equal(readCoaxialViews([{ id: "v", name: "Morning", tray: "peg" }])[0].tray, "peg");

  assert.equal(typeplateStandard("standard"), true);
  assert.equal(typeplateStandard("STANDARD"), true);
  assert.equal(typeplateVip("VIP"), true);
  assert.equal(typeplatePro("PRO"), true);
  assert.equal(typeplateDemo("DEMO"), true);
  assert.equal(typeplateStandard({ accountType: true }), true);
  assert.equal(typeplatePlain({ accountType: false }), true);
  assert.equal(typeplateVip({ accountType: false }), false);
  assert.equal(typeplatePlain({ accountType: "Letter" }), true);
  assert.equal(typeplateStandard({ accountType: "Letter" }), false);
  assert.equal(typeplateBead({ accountType: "plain" }), true);
  assert.equal(typeplateJoin("STANDARD&VIP"), true);
  assert.equal(typeplateJoin("STANDARD VIP"), false);
  assert.equal(typeplateGap("PRO|DEMO"), true);
  assert.equal(typeplateGap("LIVEHOLD"), false);
  assert.equal(typeplateBead("Beady"), true);
  assert.equal(typeplateBead("STANDARD"), false);
  assert.equal(typeplateRibbon("Abcdefghijklmnopqr"), true);
  assert.equal(typeplateRibbon("Amsterdam"), false);
  assert.equal(typeplateLane("STANDARD"), "standard");
  assert.equal(typeplateLane("Beady"), "bead");
  assert.equal(typeplateLane("Beadname"), "plain");
  assert.equal(typeplateLane("Letter"), "plain");
  assert.equal(typeplateLane("10language"), "mark");
  assert.equal(typeplateLane("Amsterdam"), "vowel");
  assert.equal(typeplateOpen(""), true);
  assert.equal(typeplateOpen({ accountType: "" }), true);
  assert.equal(typeplateState({ name: "Ada" }), "");
  assert.equal(typeplateState({ accountType: "Paris", balance: 1 }), "");
  assert.equal(typeplateHue("STANDARD"), "champagne");
  assert.equal(typeplateHue("STANDARD&VIP"), "graphite");
  assert.equal(typeplateHue("PRO"), "champagne");
  assert.equal(typeplateSoon("Beady"), true);
  assert.equal(typeplateSoon("STANDARD"), false);
  assert.equal(typeplateSoon("Amsterdam11"), true);
  assert.equal(typeplateHue("Letter"), "ivory");
  assert.equal(typeplateLength("turk"), 4);
  assert.equal(typeplateEven("turk"), true);
  assert.equal(typeplateFirst("Paris"), true);
  assert.equal(typeplateSpace("needs review"), true);
  assert.equal(typeplateVowel("Amsterdam"), true);
  assert.equal(typeplateDigit("Room4"), true);
  assert.equal(typeplateCapital("PARIS"), true);
  assert.equal(typeplateLower("paris"), true);
  assert.equal(typeplateUpper("PEARL"), true);
  assert.equal(typeplateUpper("TURK"), false);
  assert.equal(typeplateUpper("STANDARD"), true);
  assert.equal(typeplateUpper("EN"), false);
  const marks: TypeplateRow[] = [
    { id: "1", label: "Ada", code: "STANDARD" },
    { id: "2", label: "Bea", code: "STANDARD" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingTypeplate(marks), "standard");
  assert.match(typeplateLanesCsv(marks), /standard,2/);
  assert.match(typeplateRowsCsv(marks, ["1"]), /Ada,STANDARD/);
  assert.equal(crmv4Text("tr", "caxTitle"), ROUND337_COPY.tr.caxTitle);
  assert.equal(crmv4Text("de", "ctpTitle"), ROUND337_COPY.de.ctpTitle);
  assert.equal(crmv4Text("ru", "bnkCaldariumKicker"), ROUND337_COPY.ru.bnkCaldariumKicker);
  assert.equal(crmv4Text("ar", "pltTabulariumLead"), ROUND337_COPY.ar.pltTabulariumLead);
  const keys = Object.keys(ROUND337_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND337_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-coaxial/);
  assert.match(css, /\.c4-typeplate/);
  assert.match(css, /\.c4-typeplate/);
  assert.match(css, /\.c4-coaxial-column/);
  assert.match(css, /\.c4-typeplate-column/);
  assert.match(css, /\.c4-bnk-caldarium/);
  assert.match(css, /\.c4-plt-tabularium/);
  assert.match(css, /\.c4-bnk-caldarium-mast/);
  assert.match(css, /\.c4-plt-tabularium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round337.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /accountType/);
  assert.match(viewFile, /coaxialCsv/);
  assert.match(viewFile, /typeplateRowsCsv/);
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
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-typeplate-search/);
  assert.match(viewFile, /coaxialTimeline/);
  assert.match(viewFile, /c4-coaxial-notices/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cax"/);
  assert.match(app, /view === "ctp"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round157.tsx"), "utf8");
  assert.match(host, /c4-bnk-caldarium/);
  assert.match(host, /c4-bnk-caldarium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /bnkCaldariumKicker/);
  assert.match(host, /bnkCaldariumLead/);
  assert.match(host, /data-benches/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-plt-tabularium/);
  assert.match(host, /c4-plt-tabularium-mast/);
  assert.match(host, /pltTabulariumKicker/);
  assert.match(host, /pltTabulariumLead/);
  assert.match(host, /data-plates/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(cax|ctp|bnkCaldarium|pltTabularium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND337_COPY.en[key as keyof typeof ROUND337_COPY.en], "string", key);
  console.log("crmv4 round337 tests passed");
}

main();
