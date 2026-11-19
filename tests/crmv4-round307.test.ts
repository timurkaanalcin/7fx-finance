/**
 * Tympan rules, umbra plates, the ivory visitor prothyron, and the graphite method hypostyle.
 * Run: TZ=UTC npx tsx tests/crmv4-round307.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND307_COPY } from "../src/lib/crmv4/copy-round307";
import {
  ROUND307_FEATURES,
  activePin,
  activeSpan,
  activeQuarter,
  activeFinish,
  addTympan,
  briskTympan,
  dropTympanView,
  fairSighter,
  fullPin,
  umbraCapital,
  umbraDigit,
  umbraEven,
  umbraFirst,
  umbraFort,
  umbraHarbor,
  umbraHouse,
  umbraHue,
  umbraLength,
  umbraLower,
  umbraLane,
  umbraLanesCsv,
  umbraOpen,
  umbraPost,
  umbraRowsCsv,
  umbraScroll,
  umbraSpace,
  umbraSpark,
  umbraState,
  umbraTail,
  umbraUpper,
  umbraVowel,
  houseFinish,
  idleTympan,
  lateTympan,
  leadingUmbra,
  moveTympanFocus,
  tympanBand,
  tympanGap,
  tympanPin,
  tympanInner,
  tympanOuter,
  tympanSpan,
  tympanQuarter,
  tympanCloth,
  overdueTympan,
  pairPin,
  readTympanViews,
  restingTympan,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  type UmbraRow,
  type Tympan,
} from "../src/lib/crmv4/round307";

function rule(partial: Partial<Tympan> & { id: string; title: string }): Tympan {
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
  assert.equal(ROUND307_FEATURES.length, 25);
  assert.equal(ROUND307_FEATURES.includes("umbra"), true);
  assert.equal(ROUND307_FEATURES.includes("altitude"), true);
  assert.equal(ROUND307_FEATURES.includes("fair-face"), true);
  assert.equal(ROUND307_FEATURES.includes("coffer"), true);
  assert.equal(tympanQuarter(" tropic "), "tropic");
  assert.equal(tympanQuarter("brass"), "");
  assert.equal(tympanSpan("15"), 15);
  assert.equal(tympanSpan(30), 30);
  assert.equal(tympanSpan(45), 45);
  assert.equal(tympanSpan(60), 60);
  assert.equal(tympanSpan("12"), null);
  assert.equal(tympanPin("3"), 3);
  assert.equal(tympanPin(6), 6);
  assert.equal(tympanPin("9"), 9);
  assert.equal(tympanPin("2"), null);
  assert.equal(tympanCloth("brass"), "BRASS");
  assert.equal(tympanCloth("silver"), "SILVER");
  assert.equal(tympanCloth("enamel"), "ENAMEL");
  assert.equal(tympanCloth("hot"), "");
  assert.equal(tympanInner("tropic"), true);
  assert.equal(tympanInner("TEMPERATE"), true);
  assert.equal(tympanInner("polar"), false);
  assert.equal(tympanOuter("arctic"), true);
  assert.equal(tympanOuter("polar"), true);
  assert.equal(tympanOuter("tropic"), false);
  assert.equal(tympanBand("tropic"), "ecliptic");
  assert.equal(tympanBand("temperate"), "equator");
  assert.equal(tympanBand("polar"), "circle");
  assert.equal(tympanBand("arctic"), "pole");
  assert.equal(tympanBand(""), "");
  assert.equal(tympanGap("tropic", "arctic"), 3);
  assert.equal(tympanGap("polar", "nope"), null);
  assert.equal(houseFinish("brass"), true);
  assert.equal(houseFinish("silver"), false);
  assert.equal(pairPin(6), true);
  assert.equal(pairPin(3), false);
  assert.equal(fullPin("9"), true);
  assert.equal(fullPin(6), false);
  assert.equal(activeQuarter("inner"), "inner");
  assert.equal(activeQuarter("arctic"), "arctic");
  assert.equal(activeQuarter("gold"), "all");
  assert.equal(activeSpan("60"), "60");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("7"), "all");
  assert.equal(activePin("3"), "3");
  assert.equal(activePin("2"), "all");
  assert.equal(activeFinish("enamel", ["ENAMEL"]), "ENAMEL");
  assert.equal(activeFinish("hot", ["ENAMEL"]), "all");
  assert.equal(moveTympanFocus(0, 3, -1), 2);
  assert.equal(moveTympanFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", quarter: "polar", pin: 3, sighter: "Ned" }),
    rule({ id: "b", title: "Bea", quarter: "tropic", finish: "ENAMEL", span: 60, pin: 9, sighter: "Ned" }),
    rule({ id: "c", title: "Cara", quarter: "arctic", finish: "SILVER", span: 30, sighter: "Ida" }),
  ];
  assert.equal(overdueTympan(cards[0]), true);
  assert.equal(briskTympan(cards[1]), true);
  assert.equal(restingTympan(cards[2]), true);
  assert.equal(idleTympan(rule({ id: "i", title: "Idle", span: 15, pin: 3 })), true);
  assert.equal(lateTympan(cards[1], "arctic"), true);
  assert.equal(lateTympan(cards[1], "tropic"), false);
  assert.equal(suggestFinish([]), "ENAMEL");
  assert.equal(suggestFinish(cards), "BRASS");
  assert.equal(suggestSpan([], 5), 15);
  assert.equal(suggestSpan([], 9), 30);
  assert.equal(suggestSpan([], 14), 45);
  assert.equal(suggestSpan([], 18), 60);
  assert.equal(suggestSpan(cards, 6), 45);
  assert.equal(suggestQuarter(8), "tropic");
  assert.equal(suggestQuarter(10), "arctic");
  assert.equal(fairSighter(cards, "Ida,Ned"), "Ida");
  const saved = addTympan([], { title: "Dora", quarter: "temperate", finish: "brass", span: "30", pin: "6", tags: "t x p" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "BRASS");
  assert.equal(saved[0].span, 30);
  assert.equal(saved[0].pin, 6);
  assert.equal(saved[0].tags.join(""), "tp");
  assert.equal(addTympan(saved, { title: "Dora" }).length, 1);
  assert.equal(dropTympanView([{ id: "v", name: "Morning", tray: "face", query: "", sighter: "", finish: "all", quarter: "all", span: "all", pin: "all" }], "v").length, 0);
  assert.equal(readTympanViews([{ id: "v", name: "Morning", tray: "sleeve" }])[0].tray, "sleeve");

  assert.equal(umbraHouse("APPROVED"), true);
  assert.equal(umbraHouse({ documentsStatus: true }), true);
  assert.equal(umbraHarbor({ documentsStatus: false }), true);
  assert.equal(umbraHouse({ documentsStatus: "PENDING" }), true);
  assert.equal(umbraFort("re-check"), true);
  assert.equal(umbraHarbor("needs review"), true);
  assert.equal(umbraSpark("hold"), true);
  assert.equal(umbraScroll("Constantinople"), true);
  assert.equal(umbraLane("Amsterdam"), "vowel");
  assert.equal(umbraLane("Paris"), "post");
  assert.equal(umbraPost("Paris"), true);
  assert.equal(umbraOpen(""), true);
  assert.equal(umbraOpen({ documentsStatus: "" }), true);
  assert.equal(umbraState({ name: "Ada" }), "");
  assert.equal(umbraState({ documentsStatus: "Paris", balance: 1 }), "");
  assert.equal(umbraHue("APPROVED"), "champagne");
  assert.equal(umbraHue("needs review"), "graphite");
  assert.equal(umbraHue("Amsterdam"), "ivory");
  assert.equal(umbraLength("hold"), 4);
  assert.equal(umbraEven("hold"), true);
  assert.equal(umbraFirst("Paris"), true);
  assert.equal(umbraSpace("needs review"), true);
  assert.equal(umbraVowel("Amsterdam"), true);
  assert.equal(umbraDigit("Room4"), true);
  assert.equal(umbraCapital("PARIS"), true);
  assert.equal(umbraLower("paris"), true);
  assert.equal(umbraUpper("PARIS"), true);
  assert.equal(umbraTail("Room4"), true);
  const marks: UmbraRow[] = [
    { id: "1", label: "Ada", umbra: "APPROVED" },
    { id: "2", label: "Bea", umbra: "PENDING" },
    { id: "3", label: "Cara", umbra: "Paris" },
  ];
  assert.equal(leadingUmbra(marks), "house");
  assert.match(umbraLanesCsv(marks), /house,2/);
  assert.match(umbraRowsCsv(marks, ["1"]), /Ada,APPROVED/);
  assert.equal(crmv4Text("tr", "tymTitle"), ROUND307_COPY.tr.tymTitle);
  assert.equal(crmv4Text("de", "umbTitle"), ROUND307_COPY.de.umbTitle);
  assert.equal(crmv4Text("ru", "bdgProthyronKicker"), ROUND307_COPY.ru.bdgProthyronKicker);
  assert.equal(crmv4Text("ar", "dmgHypostyleLead"), ROUND307_COPY.ar.dmgHypostyleLead);
  const keys = Object.keys(ROUND307_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND307_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tympan/);
  assert.match(css, /\.c4-umbra/);
  assert.match(css, /\.c4-tympan-column/);
  assert.match(css, /\.c4-umbra-column/);
  assert.match(css, /\.c4-visitor-prothyron/);
  assert.match(css, /\.c4-method-hypostyle/);
  assert.match(css, /\.c4-visitor-prothyron-mast/);
  assert.match(css, /\.c4-method-hypostyle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round307.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /documentsStatus:/);
  assert.match(viewFile, /tympanCsv/);
  assert.match(viewFile, /umbraRowsCsv/);
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
  assert.match(viewFile, /c4-umbra-search/);
  assert.match(viewFile, /tympanTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "tym"/);
  assert.match(app, /view === "umb"/);
  const desk = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round121.tsx"), "utf8");
  assert.match(desk, /c4-visitor-prothyron/);
  assert.match(desk, /c4-visitor-prothyron-mast/);
  assert.match(desk, /data-logo="mono"/);
  assert.match(desk, /bdgProthyronKicker/);
  assert.match(desk, /bdgProthyronLead/);
  assert.match(desk, /data-visitor/);
  assert.equal(desk.includes("amount"), false);
  assert.match(desk, /c4-method-hypostyle/);
  assert.match(desk, /c4-method-hypostyle-mast/);
  assert.match(desk, /dmgHypostyleKicker/);
  assert.match(desk, /dmgHypostyleLead/);
  assert.match(desk, /data-dep-glance/);
  assert.equal(desk.includes("price"), false);
  assert.equal(desk.includes("amount"), false);
  assert.equal(desk.includes("currency"), false);
  const namedKeys = `${viewFile}\n${desk}`.match(/"(tym|umb|bdgProthyron|dmgHypostyle)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND307_COPY.en[key as keyof typeof ROUND307_COPY.en], "string", key);
  console.log("crmv4 round307 tests passed");
}

main();
