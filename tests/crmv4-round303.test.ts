/**
 * Saphea leaves, civic plates, the ivory draft reliquary, and the graphite bookmark ambulatory.
 * Run: TZ=UTC npx tsx tests/crmv4-round303.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND303_COPY } from "../src/lib/crmv4/copy-round303";
import {
  ROUND303_FEATURES,
  activePeg,
  activeLatitude,
  activeClimate,
  activeWeave,
  addSaphea,
  briskSaphea,
  dropSapheaView,
  fairScribe,
  fullPeg,
  civicCapital,
  civicDigit,
  civicEven,
  civicFirst,
  civicFort,
  civicHarbor,
  civicHouse,
  civicHue,
  civicLength,
  civicLower,
  civicLane,
  civicLanesCsv,
  civicOpen,
  civicPost,
  civicRowsCsv,
  civicScroll,
  civicSpace,
  civicSpark,
  civicState,
  civicTail,
  civicUpper,
  civicVowel,
  houseWeave,
  idleSaphea,
  lateSaphea,
  leadingCivic,
  moveSapheaFocus,
  sapheaBand,
  sapheaGap,
  sapheaPeg,
  sapheaInner,
  sapheaOuter,
  sapheaLatitude,
  sapheaClimate,
  sapheaCloth,
  overdueSaphea,
  pairPeg,
  readSapheaViews,
  restingSaphea,
  suggestLatitude,
  suggestClimate,
  suggestWeave,
  type CivicRow,
  type Saphea,
} from "../src/lib/crmv4/round303";

function leaf(partial: Partial<Saphea> & { id: string; title: string }): Saphea {
  return {
    note: "",
    scribe: "",
    climate: "",
    latitude: null,
    weave: "",
    peg: 3,
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
  assert.equal(ROUND303_FEATURES.length, 25);
  assert.equal(ROUND303_FEATURES.includes("civic"), true);
  assert.equal(ROUND303_FEATURES.includes("latitude"), true);
  assert.equal(ROUND303_FEATURES.includes("fair-scribe"), true);
  assert.equal(sapheaClimate(" tropic "), "tropic");
  assert.equal(sapheaClimate("brass"), "");
  assert.equal(sapheaLatitude("15"), 15);
  assert.equal(sapheaLatitude(30), 30);
  assert.equal(sapheaLatitude("45"), 45);
  assert.equal(sapheaLatitude("60"), 60);
  assert.equal(sapheaLatitude("12"), null);
  assert.equal(sapheaPeg("3"), 3);
  assert.equal(sapheaPeg(6), 6);
  assert.equal(sapheaPeg("9"), 9);
  assert.equal(sapheaPeg("4"), null);
  assert.equal(sapheaCloth("silk"), "SILK");
  assert.equal(sapheaCloth("wool"), "WOOL");
  assert.equal(sapheaCloth("felt"), "FELT");
  assert.equal(sapheaCloth("hot"), "");
  assert.equal(sapheaInner("tropic"), true);
  assert.equal(sapheaInner("TEMPERATE"), true);
  assert.equal(sapheaInner("polar"), false);
  assert.equal(sapheaOuter("desert"), true);
  assert.equal(sapheaOuter("polar"), true);
  assert.equal(sapheaOuter("tropic"), false);
  assert.equal(sapheaBand("tropic"), "belt");
  assert.equal(sapheaBand("temperate"), "band");
  assert.equal(sapheaBand("polar"), "cap");
  assert.equal(sapheaBand("desert"), "dune");
  assert.equal(sapheaBand(""), "");
  assert.equal(sapheaGap("tropic", "desert"), 3);
  assert.equal(sapheaGap("polar", "nope"), null);
  assert.equal(houseWeave("silk"), true);
  assert.equal(houseWeave("wool"), false);
  assert.equal(pairPeg(6), true);
  assert.equal(pairPeg(3), false);
  assert.equal(fullPeg("9"), true);
  assert.equal(fullPeg(6), false);
  assert.equal(activeClimate("inner"), "inner");
  assert.equal(activeClimate("desert"), "desert");
  assert.equal(activeClimate("gold"), "all");
  assert.equal(activeLatitude("60"), "60");
  assert.equal(activeLatitude("8"), "all");
  assert.equal(activePeg("3"), "3");
  assert.equal(activePeg("4"), "all");
  assert.equal(activeWeave("felt", ["FELT"]), "FELT");
  assert.equal(activeWeave("hot", ["FELT"]), "all");
  assert.equal(moveSapheaFocus(0, 3, -1), 2);
  assert.equal(moveSapheaFocus(0, 0, 1), 0);

  const cards = [
    leaf({ id: "a", title: "Ada", climate: "polar", peg: 3, scribe: "Ned" }),
    leaf({ id: "b", title: "Bea", climate: "tropic", weave: "FELT", latitude: 60, peg: 9, scribe: "Ned" }),
    leaf({ id: "c", title: "Cara", climate: "desert", weave: "SILK", latitude: 30, scribe: "Ida" }),
  ];
  assert.equal(overdueSaphea(cards[0]), true);
  assert.equal(briskSaphea(cards[1]), true);
  assert.equal(restingSaphea(cards[2]), true);
  assert.equal(idleSaphea(leaf({ id: "i", title: "Idle", latitude: 15, peg: 3 })), true);
  assert.equal(lateSaphea(cards[1], "desert"), true);
  assert.equal(lateSaphea(cards[1], "tropic"), false);
  assert.equal(suggestWeave([]), "FELT");
  assert.equal(suggestWeave(cards), "WOOL");
  assert.equal(suggestLatitude([], 7), 15);
  assert.equal(suggestLatitude([], 10), 30);
  assert.equal(suggestLatitude([], 15), 45);
  assert.equal(suggestLatitude([], 20), 60);
  assert.equal(suggestLatitude(cards, 7), 45);
  assert.equal(suggestClimate(9), "tropic");
  assert.equal(suggestClimate(11), "desert");
  assert.equal(fairScribe(cards, "Ida,Ned"), "Ida");
  const saved = addSaphea([], { title: "Dora", climate: "temperate", weave: "wool", latitude: "30", peg: "6", tags: "c x d" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].weave, "WOOL");
  assert.equal(saved[0].tags.join(""), "cd");
  assert.equal(addSaphea(saved, { title: "Dora" }).length, 1);
  assert.equal(dropSapheaView([{ id: "v", name: "Morning", tray: "court", query: "", scribe: "", weave: "all", climate: "all", latitude: "all", peg: "all" }], "v").length, 0);
  assert.equal(readSapheaViews([{ id: "v", name: "Morning", tray: "sleeve" }])[0].tray, "sleeve");

  assert.equal(civicHouse("Istanbul"), true);
  assert.equal(civicHouse({ city: "London" }), true);
  assert.equal(civicFort("Aix-en-Provence"), true);
  assert.equal(civicHarbor("New York"), true);
  assert.equal(civicSpark("Oslo"), true);
  assert.equal(civicScroll("Constantinople"), true);
  assert.equal(civicLane("Amsterdam"), "vowel");
  assert.equal(civicLane("Paris"), "post");
  assert.equal(civicPost("Paris"), true);
  assert.equal(civicOpen(""), true);
  assert.equal(civicOpen({ city: "" }), true);
  assert.equal(civicState({ name: "Ada" }), "");
  assert.equal(civicState({ city: "Paris", balance: 1 }), "");
  assert.equal(civicHue("Istanbul"), "champagne");
  assert.equal(civicHue("New York"), "graphite");
  assert.equal(civicHue("Amsterdam"), "ivory");
  assert.equal(civicLength("Oslo"), 4);
  assert.equal(civicEven("Oslo"), true);
  assert.equal(civicFirst("Paris"), true);
  assert.equal(civicSpace("New York"), true);
  assert.equal(civicVowel("Amsterdam"), true);
  assert.equal(civicDigit("Room4"), true);
  assert.equal(civicCapital("PARIS"), true);
  assert.equal(civicLower("paris"), true);
  assert.equal(civicUpper("PARIS"), true);
  assert.equal(civicTail("Room4"), true);
  const cities: CivicRow[] = [
    { id: "1", label: "Ada", civic: "Istanbul" },
    { id: "2", label: "Bea", civic: "London" },
    { id: "3", label: "Cara", civic: "Paris" },
  ];
  assert.equal(leadingCivic(cities), "house");
  assert.match(civicLanesCsv(cities), /house,2/);
  assert.match(civicRowsCsv(cities, ["1"]), /Ada,Istanbul/);
  assert.equal(crmv4Text("tr", "sphTitle"), ROUND303_COPY.tr.sphTitle);
  assert.equal(crmv4Text("de", "civTitle"), ROUND303_COPY.de.civTitle);
  assert.equal(crmv4Text("ru", "dfReliquaryKicker"), ROUND303_COPY.ru.dfReliquaryKicker);
  assert.equal(crmv4Text("ar", "bqAmbulatoryLead"), ROUND303_COPY.ar.bqAmbulatoryLead);
  const keys = Object.keys(ROUND303_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND303_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-saphea/);
  assert.match(css, /\.c4-civic/);
  assert.match(css, /\.c4-saphea-column/);
  assert.match(css, /\.c4-civic-column/);
  assert.match(css, /\.c4-draft-reliquary/);
  assert.match(css, /\.c4-bookmark-ambulatory/);
  assert.match(css, /\.c4-draft-reliquary-mast/);
  assert.match(css, /\.c4-bookmark-ambulatory-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round303.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /city:/);
  assert.match(viewFile, /sapheaCsv/);
  assert.match(viewFile, /civicRowsCsv/);
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
  assert.match(viewFile, /suggestWeave/);
  assert.match(viewFile, /c4-civic-search/);
  assert.match(viewFile, /sapheaTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sph"/);
  assert.match(app, /view === "civ"/);
  const reliquary = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round101.tsx"), "utf8");
  assert.match(reliquary, /c4-draft-reliquary/);
  assert.match(reliquary, /c4-draft-reliquary-mast/);
  assert.match(reliquary, /data-logo="mono"/);
  assert.match(reliquary, /dfReliquaryKicker/);
  assert.match(reliquary, /dfReliquaryLead/);
  assert.match(reliquary, /data-draft-stash/);
  assert.equal(reliquary.includes("amount"), false);
  const ambulatory = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round103.tsx"), "utf8");
  assert.match(ambulatory, /c4-bookmark-ambulatory/);
  assert.match(ambulatory, /c4-bookmark-ambulatory-mast/);
  assert.match(ambulatory, /bqAmbulatoryKicker/);
  assert.match(ambulatory, /bqAmbulatoryLead/);
  assert.match(ambulatory, /data-bookmark-board/);
  assert.equal(ambulatory.includes("amount"), false);
  const namedKeys = `${viewFile}\n${reliquary}\n${ambulatory}`.match(/"(sph|civ|dfReliquary|bqAmbulatory)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND303_COPY.en[key as keyof typeof ROUND303_COPY.en], "string", key);
  console.log("crmv4 round303 tests passed");
}

main();
