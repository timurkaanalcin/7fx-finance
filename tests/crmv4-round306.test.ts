/**
 * Armillary rules, pelorus plates, the ivory locker aedicula, and the graphite symbol peristyle.
 * Run: TZ=UTC npx tsx tests/crmv4-round306.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND306_COPY } from "../src/lib/crmv4/copy-round306";
import {
  ROUND306_FEATURES,
  activePin,
  activeSpan,
  activeQuarter,
  activeFinish,
  addArmillary,
  briskArmillary,
  dropArmillaryView,
  fairSighter,
  fullPin,
  pelorusCapital,
  pelorusDigit,
  pelorusEven,
  pelorusFirst,
  pelorusFort,
  pelorusHarbor,
  pelorusHouse,
  pelorusHue,
  pelorusLength,
  pelorusLower,
  pelorusLane,
  pelorusLanesCsv,
  pelorusOpen,
  pelorusPost,
  pelorusRowsCsv,
  pelorusScroll,
  pelorusSpace,
  pelorusSpark,
  pelorusState,
  pelorusTail,
  pelorusUpper,
  pelorusVowel,
  houseFinish,
  idleArmillary,
  lateArmillary,
  leadingPelorus,
  moveArmillaryFocus,
  armillaryBand,
  armillaryGap,
  armillaryPin,
  armillaryInner,
  armillaryOuter,
  armillarySpan,
  armillaryQuarter,
  armillaryCloth,
  overdueArmillary,
  pairPin,
  readArmillaryViews,
  restingArmillary,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  type PelorusRow,
  type Armillary,
} from "../src/lib/crmv4/round306";

function rule(partial: Partial<Armillary> & { id: string; title: string }): Armillary {
  return {
    note: "",
    sighter: "",
    quarter: "",
    span: null,
    finish: "",
    pin: 2,
    tags: [],
    laid: false,
    locked: false,
    held: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND306_FEATURES.length, 25);
  assert.equal(ROUND306_FEATURES.includes("pelorus"), true);
  assert.equal(ROUND306_FEATURES.includes("reach"), true);
  assert.equal(ROUND306_FEATURES.includes("fair-ring"), true);
  assert.equal(ROUND306_FEATURES.includes("chest"), true);
  assert.equal(armillaryQuarter(" east "), "east");
  assert.equal(armillaryQuarter("silk"), "");
  assert.equal(armillarySpan("8"), 8);
  assert.equal(armillarySpan(16), 16);
  assert.equal(armillarySpan(32), 32);
  assert.equal(armillarySpan(64), 64);
  assert.equal(armillarySpan("12"), null);
  assert.equal(armillaryPin("2"), 2);
  assert.equal(armillaryPin(4), 4);
  assert.equal(armillaryPin("8"), 8);
  assert.equal(armillaryPin("3"), null);
  assert.equal(armillaryCloth("silk"), "SILK");
  assert.equal(armillaryCloth("wool"), "WOOL");
  assert.equal(armillaryCloth("gilt"), "GILT");
  assert.equal(armillaryCloth("hot"), "");
  assert.equal(armillaryInner("east"), true);
  assert.equal(armillaryInner("SOUTH"), true);
  assert.equal(armillaryInner("west"), false);
  assert.equal(armillaryOuter("north"), true);
  assert.equal(armillaryOuter("west"), true);
  assert.equal(armillaryOuter("east"), false);
  assert.equal(armillaryBand("east"), "limb");
  assert.equal(armillaryBand("south"), "equator");
  assert.equal(armillaryBand("west"), "colure");
  assert.equal(armillaryBand("north"), "pole");
  assert.equal(armillaryBand(""), "");
  assert.equal(armillaryGap("east", "north"), 3);
  assert.equal(armillaryGap("west", "nope"), null);
  assert.equal(houseFinish("silk"), true);
  assert.equal(houseFinish("wool"), false);
  assert.equal(pairPin(4), true);
  assert.equal(pairPin(2), false);
  assert.equal(fullPin("8"), true);
  assert.equal(fullPin(4), false);
  assert.equal(activeQuarter("inner"), "inner");
  assert.equal(activeQuarter("north"), "north");
  assert.equal(activeQuarter("gold"), "all");
  assert.equal(activeSpan("64"), "64");
  assert.equal(activeSpan("8"), "8");
  assert.equal(activeSpan("7"), "all");
  assert.equal(activePin("2"), "2");
  assert.equal(activePin("3"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(activeFinish("hot", ["GILT"]), "all");
  assert.equal(moveArmillaryFocus(0, 3, -1), 2);
  assert.equal(moveArmillaryFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", quarter: "west", pin: 2, sighter: "Ned" }),
    rule({ id: "b", title: "Bea", quarter: "east", finish: "GILT", span: 64, pin: 8, sighter: "Ned" }),
    rule({ id: "c", title: "Cara", quarter: "north", finish: "SILK", span: 16, sighter: "Ida" }),
  ];
  assert.equal(overdueArmillary(cards[0]), true);
  assert.equal(briskArmillary(cards[1]), true);
  assert.equal(restingArmillary(cards[2]), true);
  assert.equal(idleArmillary(rule({ id: "i", title: "Idle", span: 8, pin: 2 })), true);
  assert.equal(lateArmillary(cards[1], "north"), true);
  assert.equal(lateArmillary(cards[1], "east"), false);
  assert.equal(suggestFinish([]), "GILT");
  assert.equal(suggestFinish(cards), "WOOL");
  assert.equal(suggestSpan([], 6), 8);
  assert.equal(suggestSpan([], 9), 16);
  assert.equal(suggestSpan([], 14), 32);
  assert.equal(suggestSpan([], 18), 64);
  assert.equal(suggestSpan(cards, 6), 32);
  assert.equal(suggestQuarter(8), "east");
  assert.equal(suggestQuarter(10), "north");
  assert.equal(fairSighter(cards, "Ida,Ned"), "Ida");
  const saved = addArmillary([], { title: "Dora", quarter: "south", finish: "gilt", span: "16", pin: "4", tags: "e x w" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "GILT");
  assert.equal(saved[0].span, 16);
  assert.equal(saved[0].pin, 4);
  assert.equal(saved[0].tags.join(""), "ew");
  assert.equal(addArmillary(saved, { title: "Dora" }).length, 1);
  assert.equal(dropArmillaryView([{ id: "v", name: "Morning", tray: "ring", query: "", sighter: "", finish: "all", quarter: "all", span: "all", pin: "all" }], "v").length, 0);
  assert.equal(readArmillaryViews([{ id: "v", name: "Morning", tray: "case" }])[0].tray, "case");

  assert.equal(pelorusHouse("INVALID"), true);
  assert.equal(pelorusHouse({ leadInvalid: true }), true);
  assert.equal(pelorusHarbor({ leadInvalid: false }), true);
  assert.equal(pelorusHouse({ leadInvalid: "DUPLICATE" }), true);
  assert.equal(pelorusFort("re-check"), true);
  assert.equal(pelorusHarbor("needs review"), true);
  assert.equal(pelorusSpark("hold"), true);
  assert.equal(pelorusScroll("Constantinople"), true);
  assert.equal(pelorusLane("Amsterdam"), "vowel");
  assert.equal(pelorusLane("Paris"), "post");
  assert.equal(pelorusPost("Paris"), true);
  assert.equal(pelorusOpen(""), true);
  assert.equal(pelorusOpen({ leadInvalid: "" }), true);
  assert.equal(pelorusState({ name: "Ada" }), "");
  assert.equal(pelorusState({ leadInvalid: "Paris", balance: 1 }), "");
  assert.equal(pelorusHue("INVALID"), "champagne");
  assert.equal(pelorusHue("needs review"), "graphite");
  assert.equal(pelorusHue("Amsterdam"), "ivory");
  assert.equal(pelorusLength("hold"), 4);
  assert.equal(pelorusEven("hold"), true);
  assert.equal(pelorusFirst("Paris"), true);
  assert.equal(pelorusSpace("needs review"), true);
  assert.equal(pelorusVowel("Amsterdam"), true);
  assert.equal(pelorusDigit("Room4"), true);
  assert.equal(pelorusCapital("PARIS"), true);
  assert.equal(pelorusLower("paris"), true);
  assert.equal(pelorusUpper("PARIS"), true);
  assert.equal(pelorusTail("Room4"), true);
  const marks: PelorusRow[] = [
    { id: "1", label: "Ada", pelorus: "INVALID" },
    { id: "2", label: "Bea", pelorus: "SPAM" },
    { id: "3", label: "Cara", pelorus: "Paris" },
  ];
  assert.equal(leadingPelorus(marks), "house");
  assert.match(pelorusLanesCsv(marks), /house,2/);
  assert.match(pelorusRowsCsv(marks, ["1"]), /Ada,INVALID/);
  assert.equal(crmv4Text("tr", "armTitle"), ROUND306_COPY.tr.armTitle);
  assert.equal(crmv4Text("de", "pelTitle"), ROUND306_COPY.de.pelTitle);
  assert.equal(crmv4Text("ru", "lokAediculaKicker"), ROUND306_COPY.ru.lokAediculaKicker);
  assert.equal(crmv4Text("ar", "tsyPeristyleLead"), ROUND306_COPY.ar.tsyPeristyleLead);
  const keys = Object.keys(ROUND306_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND306_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-armillary/);
  assert.match(css, /\.c4-pelorus/);
  assert.match(css, /\.c4-armillary-column/);
  assert.match(css, /\.c4-pelorus-column/);
  assert.match(css, /\.c4-locker-aedicula/);
  assert.match(css, /\.c4-symbol-peristyle/);
  assert.match(css, /\.c4-locker-aedicula-mast/);
  assert.match(css, /\.c4-symbol-peristyle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round306.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /leadInvalid:/);
  assert.match(viewFile, /armillaryCsv/);
  assert.match(viewFile, /pelorusRowsCsv/);
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
  assert.match(viewFile, /c4-pelorus-search/);
  assert.match(viewFile, /armillaryTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "arm"/);
  assert.match(app, /view === "pel"/);
  const oriel = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round119.tsx"), "utf8");
  assert.match(oriel, /c4-locker-aedicula/);
  assert.match(oriel, /c4-locker-aedicula-mast/);
  assert.match(oriel, /data-logo="mono"/);
  assert.match(oriel, /lokAediculaKicker/);
  assert.match(oriel, /lokAediculaLead/);
  assert.match(oriel, /data-locker/);
  assert.equal(oriel.includes("amount"), false);
  assert.match(oriel, /c4-symbol-peristyle/);
  assert.match(oriel, /c4-symbol-peristyle-mast/);
  assert.match(oriel, /tsyPeristyleKicker/);
  assert.match(oriel, /tsyPeristyleLead/);
  assert.match(oriel, /data-trade-sym/);
  assert.equal(oriel.includes("price"), false);
  assert.equal(oriel.includes("amount"), false);
  assert.equal(oriel.includes("currency"), false);
  const namedKeys = `${viewFile}\n${oriel}`.match(/"(arm|pel|lokAedicula|tsyPeristyle)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND306_COPY.en[key as keyof typeof ROUND306_COPY.en], "string", key);
  console.log("crmv4 round306 tests passed");
}

main();
