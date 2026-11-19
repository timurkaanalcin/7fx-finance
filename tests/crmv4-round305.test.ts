/**
 * Alidade rules, specimen plates, the ivory courier narthex, and the graphite partner stoa.
 * Run: TZ=UTC npx tsx tests/crmv4-round305.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND305_COPY } from "../src/lib/crmv4/copy-round305";
import {
  ROUND305_FEATURES,
  activePin,
  activeSpan,
  activeQuarter,
  activeFinish,
  addAlidade,
  briskAlidade,
  dropAlidadeView,
  fairSighter,
  fullPin,
  specimenCapital,
  specimenDigit,
  specimenEven,
  specimenFirst,
  specimenFort,
  specimenHarbor,
  specimenHouse,
  specimenHue,
  specimenLength,
  specimenLower,
  specimenLane,
  specimenLanesCsv,
  specimenOpen,
  specimenPost,
  specimenRowsCsv,
  specimenScroll,
  specimenSpace,
  specimenSpark,
  specimenState,
  specimenTail,
  specimenUpper,
  specimenVowel,
  houseFinish,
  idleAlidade,
  lateAlidade,
  leadingSpecimen,
  moveAlidadeFocus,
  alidadeBand,
  alidadeGap,
  alidadePin,
  alidadeInner,
  alidadeOuter,
  alidadeSpan,
  alidadeQuarter,
  alidadeCloth,
  overdueAlidade,
  pairPin,
  readAlidadeViews,
  restingAlidade,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  type SpecimenRow,
  type Alidade,
} from "../src/lib/crmv4/round305";

function rule(partial: Partial<Alidade> & { id: string; title: string }): Alidade {
  return {
    note: "",
    sighter: "",
    quarter: "",
    span: null,
    finish: "",
    pin: 3,
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
  assert.equal(ROUND305_FEATURES.length, 25);
  assert.equal(ROUND305_FEATURES.includes("specimen"), true);
  assert.equal(ROUND305_FEATURES.includes("reach"), true);
  assert.equal(ROUND305_FEATURES.includes("fair-sight"), true);
  assert.equal(alidadeQuarter(" rise "), "rise");
  assert.equal(alidadeQuarter("linen"), "");
  assert.equal(alidadeSpan("12"), 12);
  assert.equal(alidadeSpan(24), 24);
  assert.equal(alidadeSpan(48), 48);
  assert.equal(alidadeSpan(96), 96);
  assert.equal(alidadeSpan("11"), null);
  assert.equal(alidadePin("3"), 3);
  assert.equal(alidadePin(6), 6);
  assert.equal(alidadePin("9"), 9);
  assert.equal(alidadePin("4"), null);
  assert.equal(alidadeCloth("linen"), "LINEN");
  assert.equal(alidadeCloth("ink"), "INK");
  assert.equal(alidadeCloth("gilt"), "GILT");
  assert.equal(alidadeCloth("hot"), "");
  assert.equal(alidadeInner("rise"), true);
  assert.equal(alidadeInner("CREST"), true);
  assert.equal(alidadeInner("gloam"), false);
  assert.equal(alidadeOuter("dark"), true);
  assert.equal(alidadeOuter("gloam"), true);
  assert.equal(alidadeOuter("rise"), false);
  assert.equal(alidadeBand("rise"), "rim");
  assert.equal(alidadeBand("crest"), "hub");
  assert.equal(alidadeBand("gloam"), "vane");
  assert.equal(alidadeBand("dark"), "foot");
  assert.equal(alidadeBand(""), "");
  assert.equal(alidadeGap("rise", "dark"), 3);
  assert.equal(alidadeGap("gloam", "nope"), null);
  assert.equal(houseFinish("linen"), true);
  assert.equal(houseFinish("ink"), false);
  assert.equal(pairPin(6), true);
  assert.equal(pairPin(3), false);
  assert.equal(fullPin("9"), true);
  assert.equal(fullPin(6), false);
  assert.equal(activeQuarter("inner"), "inner");
  assert.equal(activeQuarter("dark"), "dark");
  assert.equal(activeQuarter("gold"), "all");
  assert.equal(activeSpan("96"), "96");
  assert.equal(activeSpan("8"), "all");
  assert.equal(activePin("3"), "3");
  assert.equal(activePin("4"), "all");
  assert.equal(activeFinish("gilt", ["GILT"]), "GILT");
  assert.equal(activeFinish("hot", ["GILT"]), "all");
  assert.equal(moveAlidadeFocus(0, 3, -1), 2);
  assert.equal(moveAlidadeFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", quarter: "gloam", pin: 3, sighter: "Ned" }),
    rule({ id: "b", title: "Bea", quarter: "rise", finish: "GILT", span: 96, pin: 9, sighter: "Ned" }),
    rule({ id: "c", title: "Cara", quarter: "dark", finish: "LINEN", span: 24, sighter: "Ida" }),
  ];
  assert.equal(overdueAlidade(cards[0]), true);
  assert.equal(briskAlidade(cards[1]), true);
  assert.equal(restingAlidade(cards[2]), true);
  assert.equal(idleAlidade(rule({ id: "i", title: "Idle", span: 12, pin: 3 })), true);
  assert.equal(lateAlidade(cards[1], "dark"), true);
  assert.equal(lateAlidade(cards[1], "rise"), false);
  assert.equal(suggestFinish([]), "GILT");
  assert.equal(suggestFinish(cards), "INK");
  assert.equal(suggestSpan([], 6), 12);
  assert.equal(suggestSpan([], 9), 24);
  assert.equal(suggestSpan([], 14), 48);
  assert.equal(suggestSpan([], 18), 96);
  assert.equal(suggestSpan(cards, 6), 48);
  assert.equal(suggestQuarter(8), "rise");
  assert.equal(suggestQuarter(10), "dark");
  assert.equal(fairSighter(cards, "Ida,Ned"), "Ida");
  const saved = addAlidade([], { title: "Dora", quarter: "crest", finish: "gilt", span: "24", pin: "6", tags: "a x b" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "GILT");
  assert.equal(saved[0].span, 24);
  assert.equal(saved[0].pin, 6);
  assert.equal(saved[0].tags.join(""), "ab");
  assert.equal(addAlidade(saved, { title: "Dora" }).length, 1);
  assert.equal(dropAlidadeView([{ id: "v", name: "Morning", tray: "yard", query: "", sighter: "", finish: "all", quarter: "all", span: "all", pin: "all" }], "v").length, 0);
  assert.equal(readAlidadeViews([{ id: "v", name: "Morning", tray: "sheath" }])[0].tray, "sheath");

  assert.equal(specimenHouse("TEST"), true);
  assert.equal(specimenHouse({ isTest: true }), true);
  assert.equal(specimenHarbor({ isTest: false }), true);
  assert.equal(specimenHouse({ isTest: "DEMO" }), true);
  assert.equal(specimenFort("re-check"), true);
  assert.equal(specimenHarbor("needs review"), true);
  assert.equal(specimenSpark("hold"), true);
  assert.equal(specimenScroll("Constantinople"), true);
  assert.equal(specimenLane("Amsterdam"), "vowel");
  assert.equal(specimenLane("Paris"), "post");
  assert.equal(specimenPost("Paris"), true);
  assert.equal(specimenOpen(""), true);
  assert.equal(specimenOpen({ isTest: "" }), true);
  assert.equal(specimenState({ name: "Ada" }), "");
  assert.equal(specimenState({ isTest: "Paris", balance: 1 }), "");
  assert.equal(specimenHue("TEST"), "champagne");
  assert.equal(specimenHue("needs review"), "graphite");
  assert.equal(specimenHue("Amsterdam"), "ivory");
  assert.equal(specimenLength("hold"), 4);
  assert.equal(specimenEven("hold"), true);
  assert.equal(specimenFirst("Paris"), true);
  assert.equal(specimenSpace("needs review"), true);
  assert.equal(specimenVowel("Amsterdam"), true);
  assert.equal(specimenDigit("Room4"), true);
  assert.equal(specimenCapital("PARIS"), true);
  assert.equal(specimenLower("paris"), true);
  assert.equal(specimenUpper("PARIS"), true);
  assert.equal(specimenTail("Room4"), true);
  const statuses: SpecimenRow[] = [
    { id: "1", label: "Ada", specimen: "TEST" },
    { id: "2", label: "Bea", specimen: "DEMO" },
    { id: "3", label: "Cara", specimen: "Paris" },
  ];
  assert.equal(leadingSpecimen(statuses), "house");
  assert.match(specimenLanesCsv(statuses), /house,2/);
  assert.match(specimenRowsCsv(statuses, ["1"]), /Ada,TEST/);
  assert.equal(crmv4Text("tr", "aldTitle"), ROUND305_COPY.tr.aldTitle);
  assert.equal(crmv4Text("de", "spcTitle"), ROUND305_COPY.de.spcTitle);
  assert.equal(crmv4Text("ru", "crrNarthexKicker"), ROUND305_COPY.ru.crrNarthexKicker);
  assert.equal(crmv4Text("ar", "ibgStoaLead"), ROUND305_COPY.ar.ibgStoaLead);
  const keys = Object.keys(ROUND305_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND305_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-alidade/);
  assert.match(css, /\.c4-specimen/);
  assert.match(css, /\.c4-alidade-column/);
  assert.match(css, /\.c4-specimen-column/);
  assert.match(css, /\.c4-courier-narthex/);
  assert.match(css, /\.c4-partner-stoa/);
  assert.match(css, /\.c4-courier-narthex-mast/);
  assert.match(css, /\.c4-partner-stoa-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round305.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /isTest:/);
  assert.match(viewFile, /alidadeCsv/);
  assert.match(viewFile, /specimenRowsCsv/);
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
  assert.match(viewFile, /c4-specimen-search/);
  assert.match(viewFile, /alidadeTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ald"/);
  assert.match(app, /view === "spc"/);
  const oriel = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round120.tsx"), "utf8");
  assert.match(oriel, /c4-courier-narthex/);
  assert.match(oriel, /c4-courier-narthex-mast/);
  assert.match(oriel, /data-logo="mono"/);
  assert.match(oriel, /crrNarthexKicker/);
  assert.match(oriel, /crrNarthexLead/);
  assert.match(oriel, /data-courier/);
  assert.equal(oriel.includes("amount"), false);
  assert.match(oriel, /c4-partner-stoa/);
  assert.match(oriel, /c4-partner-stoa-mast/);
  assert.match(oriel, /ibgStoaKicker/);
  assert.match(oriel, /ibgStoaLead/);
  assert.match(oriel, /data-ib-ctry/);
  assert.equal(oriel.includes("price"), false);
  assert.equal(oriel.includes("amount"), false);
  assert.equal(oriel.includes("currency"), false);
  const namedKeys = `${viewFile}\n${oriel}`.match(/"(ald|spc|crrNarthex|ibgStoa)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND305_COPY.en[key as keyof typeof ROUND305_COPY.en], "string", key);
  console.log("crmv4 round305 tests passed");
}

main();
