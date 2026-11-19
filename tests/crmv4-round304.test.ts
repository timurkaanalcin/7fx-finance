/**
 * Rectangulus rules, assay plates, the ivory focus oriel, and the graphite type aisle.
 * Run: TZ=UTC npx tsx tests/crmv4-round304.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND304_COPY } from "../src/lib/crmv4/copy-round304";
import {
  ROUND304_FEATURES,
  activePin,
  activeSpan,
  activeQuarter,
  activeFinish,
  addRectangulus,
  briskRectangulus,
  dropRectangulusView,
  fairSighter,
  fullPin,
  assayCapital,
  assayDigit,
  assayEven,
  assayFirst,
  assayFort,
  assayHarbor,
  assayHouse,
  assayHue,
  assayLength,
  assayLower,
  assayLane,
  assayLanesCsv,
  assayOpen,
  assayPost,
  assayRowsCsv,
  assayScroll,
  assaySpace,
  assaySpark,
  assayState,
  assayTail,
  assayUpper,
  assayVowel,
  houseFinish,
  idleRectangulus,
  lateRectangulus,
  leadingAssay,
  moveRectangulusFocus,
  rectangulusBand,
  rectangulusGap,
  rectangulusPin,
  rectangulusInner,
  rectangulusOuter,
  rectangulusSpan,
  rectangulusQuarter,
  rectangulusCloth,
  overdueRectangulus,
  pairPin,
  readRectangulusViews,
  restingRectangulus,
  suggestSpan,
  suggestQuarter,
  suggestFinish,
  type AssayRow,
  type Rectangulus,
} from "../src/lib/crmv4/round304";

function rule(partial: Partial<Rectangulus> & { id: string; title: string }): Rectangulus {
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
  assert.equal(ROUND304_FEATURES.length, 25);
  assert.equal(ROUND304_FEATURES.includes("assay"), true);
  assert.equal(ROUND304_FEATURES.includes("span"), true);
  assert.equal(ROUND304_FEATURES.includes("fair-sighter"), true);
  assert.equal(rectangulusQuarter(" dawn "), "dawn");
  assert.equal(rectangulusQuarter("brass"), "");
  assert.equal(rectangulusSpan("10"), 10);
  assert.equal(rectangulusSpan(20), 20);
  assert.equal(rectangulusSpan("40"), 40);
  assert.equal(rectangulusSpan("80"), 80);
  assert.equal(rectangulusSpan("12"), null);
  assert.equal(rectangulusPin("2"), 2);
  assert.equal(rectangulusPin(5), 5);
  assert.equal(rectangulusPin("8"), 8);
  assert.equal(rectangulusPin("4"), null);
  assert.equal(rectangulusCloth("brass"), "BRASS");
  assert.equal(rectangulusCloth("ebony"), "EBONY");
  assert.equal(rectangulusCloth("bone"), "BONE");
  assert.equal(rectangulusCloth("hot"), "");
  assert.equal(rectangulusInner("dawn"), true);
  assert.equal(rectangulusInner("NOON"), true);
  assert.equal(rectangulusInner("dusk"), false);
  assert.equal(rectangulusOuter("night"), true);
  assert.equal(rectangulusOuter("dusk"), true);
  assert.equal(rectangulusOuter("dawn"), false);
  assert.equal(rectangulusBand("dawn"), "glow");
  assert.equal(rectangulusBand("noon"), "crown");
  assert.equal(rectangulusBand("dusk"), "shade");
  assert.equal(rectangulusBand("night"), "deep");
  assert.equal(rectangulusBand(""), "");
  assert.equal(rectangulusGap("dawn", "night"), 3);
  assert.equal(rectangulusGap("dusk", "nope"), null);
  assert.equal(houseFinish("brass"), true);
  assert.equal(houseFinish("ebony"), false);
  assert.equal(pairPin(5), true);
  assert.equal(pairPin(2), false);
  assert.equal(fullPin("8"), true);
  assert.equal(fullPin(5), false);
  assert.equal(activeQuarter("inner"), "inner");
  assert.equal(activeQuarter("night"), "night");
  assert.equal(activeQuarter("gold"), "all");
  assert.equal(activeSpan("80"), "80");
  assert.equal(activeSpan("8"), "all");
  assert.equal(activePin("2"), "2");
  assert.equal(activePin("4"), "all");
  assert.equal(activeFinish("bone", ["BONE"]), "BONE");
  assert.equal(activeFinish("hot", ["BONE"]), "all");
  assert.equal(moveRectangulusFocus(0, 3, -1), 2);
  assert.equal(moveRectangulusFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", quarter: "dusk", pin: 2, sighter: "Ned" }),
    rule({ id: "b", title: "Bea", quarter: "dawn", finish: "BONE", span: 80, pin: 8, sighter: "Ned" }),
    rule({ id: "c", title: "Cara", quarter: "night", finish: "BRASS", span: 20, sighter: "Ida" }),
  ];
  assert.equal(overdueRectangulus(cards[0]), true);
  assert.equal(briskRectangulus(cards[1]), true);
  assert.equal(restingRectangulus(cards[2]), true);
  assert.equal(idleRectangulus(rule({ id: "i", title: "Idle", span: 10, pin: 2 })), true);
  assert.equal(lateRectangulus(cards[1], "night"), true);
  assert.equal(lateRectangulus(cards[1], "dawn"), false);
  assert.equal(suggestFinish([]), "BONE");
  assert.equal(suggestFinish(cards), "EBONY");
  assert.equal(suggestSpan([], 6), 10);
  assert.equal(suggestSpan([], 9), 20);
  assert.equal(suggestSpan([], 14), 40);
  assert.equal(suggestSpan([], 18), 80);
  assert.equal(suggestSpan(cards, 6), 40);
  assert.equal(suggestQuarter(8), "dawn");
  assert.equal(suggestQuarter(10), "night");
  assert.equal(fairSighter(cards, "Ida,Ned"), "Ida");
  const saved = addRectangulus([], { title: "Dora", quarter: "noon", finish: "bone", span: "20", pin: "5", tags: "a x b" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].finish, "BONE");
  assert.equal(saved[0].tags.join(""), "ab");
  assert.equal(addRectangulus(saved, { title: "Dora" }).length, 1);
  assert.equal(dropRectangulusView([{ id: "v", name: "Morning", tray: "court", query: "", sighter: "", finish: "all", quarter: "all", span: "all", pin: "all" }], "v").length, 0);
  assert.equal(readRectangulusViews([{ id: "v", name: "Morning", tray: "sleeve" }])[0].tray, "sleeve");

  assert.equal(assayHouse("VERIFIED"), true);
  assert.equal(assayHouse({ validationStatus: "PENDING" }), true);
  assert.equal(assayFort("re-check"), true);
  assert.equal(assayHarbor("needs review"), true);
  assert.equal(assaySpark("hold"), true);
  assert.equal(assayScroll("Constantinople"), true);
  assert.equal(assayLane("Amsterdam"), "vowel");
  assert.equal(assayLane("Paris"), "post");
  assert.equal(assayPost("Paris"), true);
  assert.equal(assayOpen(""), true);
  assert.equal(assayOpen({ validationStatus: "" }), true);
  assert.equal(assayState({ name: "Ada" }), "");
  assert.equal(assayState({ validationStatus: "Paris", balance: 1 }), "");
  assert.equal(assayHue("VERIFIED"), "champagne");
  assert.equal(assayHue("needs review"), "graphite");
  assert.equal(assayHue("Amsterdam"), "ivory");
  assert.equal(assayLength("hold"), 4);
  assert.equal(assayEven("hold"), true);
  assert.equal(assayFirst("Paris"), true);
  assert.equal(assaySpace("needs review"), true);
  assert.equal(assayVowel("Amsterdam"), true);
  assert.equal(assayDigit("Room4"), true);
  assert.equal(assayCapital("PARIS"), true);
  assert.equal(assayLower("paris"), true);
  assert.equal(assayUpper("PARIS"), true);
  assert.equal(assayTail("Room4"), true);
  const statuses: AssayRow[] = [
    { id: "1", label: "Ada", assay: "VERIFIED" },
    { id: "2", label: "Bea", assay: "PENDING" },
    { id: "3", label: "Cara", assay: "Paris" },
  ];
  assert.equal(leadingAssay(statuses), "house");
  assert.match(assayLanesCsv(statuses), /house,2/);
  assert.match(assayRowsCsv(statuses, ["1"]), /Ada,VERIFIED/);
  assert.equal(crmv4Text("tr", "rxgTitle"), ROUND304_COPY.tr.rxgTitle);
  assert.equal(crmv4Text("de", "asyTitle"), ROUND304_COPY.de.asyTitle);
  assert.equal(crmv4Text("ru", "fcOrielKicker"), ROUND304_COPY.ru.fcOrielKicker);
  assert.equal(crmv4Text("ar", "oyAisleLead"), ROUND304_COPY.ar.oyAisleLead);
  const keys = Object.keys(ROUND304_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND304_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rectangulus/);
  assert.match(css, /\.c4-assay/);
  assert.match(css, /\.c4-rectangulus-column/);
  assert.match(css, /\.c4-assay-column/);
  assert.match(css, /\.c4-focus-oriel/);
  assert.match(css, /\.c4-type-aisle/);
  assert.match(css, /\.c4-focus-oriel-mast/);
  assert.match(css, /\.c4-type-aisle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round304.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /validationStatus:/);
  assert.match(viewFile, /rectangulusCsv/);
  assert.match(viewFile, /assayRowsCsv/);
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
  assert.match(viewFile, /c4-assay-search/);
  assert.match(viewFile, /rectangulusTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rxg"/);
  assert.match(app, /view === "asy"/);
  const oriel = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round102.tsx"), "utf8");
  assert.match(oriel, /c4-focus-oriel/);
  assert.match(oriel, /c4-focus-oriel-mast/);
  assert.match(oriel, /data-logo="mono"/);
  assert.match(oriel, /fcOrielKicker/);
  assert.match(oriel, /fcOrielLead/);
  assert.match(oriel, /data-focus-customer/);
  assert.equal(oriel.includes("amount"), false);
  assert.match(oriel, /c4-type-aisle/);
  assert.match(oriel, /c4-type-aisle-mast/);
  assert.match(oriel, /oyAisleKicker/);
  assert.match(oriel, /oyAisleLead/);
  assert.match(oriel, /data-order-type/);
  assert.equal(oriel.includes("price"), false);
  const namedKeys = `${viewFile}\n${oriel}`.match(/"(rxg|asy|fcOriel|oyAisle)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND304_COPY.en[key as keyof typeof ROUND304_COPY.en], "string", key);
  console.log("crmv4 round304 tests passed");
}

main();
