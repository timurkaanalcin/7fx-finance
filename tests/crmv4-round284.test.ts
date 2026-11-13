/**
 * Armillary rings, city plates, the desk ribbon, and the notice cabinet.
 * Run: TZ=UTC npx tsx tests/crmv4-round284.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND284_COPY } from "../src/lib/crmv4/copy-round284";
import {
  ROUND284_FEATURES,
  activeBead,
  activeDegree,
  activeFinish,
  activeInk,
  activeRing,
  addArmillary,
  armillaryBead,
  armillaryDegree,
  briskArmillary,
  cityCap,
  cityDash,
  cityDigit,
  cityEcho,
  cityEven,
  cityGroups,
  cityHue,
  cityKnown,
  cityLane,
  cityLanesCsv,
  cityLeap,
  cityOdd,
  cityRowsCsv,
  citySpace,
  cityState,
  cityStep,
  cityTail,
  cityTwin,
  cityWide,
  dipDegree,
  dropArmillaryView,
  evenBead,
  fairKeeper,
  finishOf,
  houseFinish,
  idleArmillary,
  inkOf,
  keenRing,
  lateArmillary,
  leadingCity,
  liftDegree,
  moveArmFocus,
  overdueArmillary,
  readArmillaryViews,
  restingArmillary,
  ringBand,
  ringGap,
  ringOf,
  stillRing,
  suggestDegree,
  suggestFinish,
  suggestRing,
  type ArmillaryRing,
  type CityRow,
} from "../src/lib/crmv4/round284";

function card(partial: Partial<ArmillaryRing> & { id: string; title: string }): ArmillaryRing {
  return {
    note: "",
    keeper: "",
    ring: "",
    degree: null,
    finish: "",
    ink: "",
    bead: 3,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND284_FEATURES.length, 25);
  assert.equal(ringOf(" meridian "), "meridian");
  assert.equal(ringOf("paris"), "");
  assert.equal(armillaryDegree("15"), 15);
  assert.equal(armillaryDegree(45), 45);
  assert.equal(armillaryDegree("75"), 75);
  assert.equal(armillaryDegree("30"), null);
  assert.equal(armillaryDegree("90"), null);
  assert.equal(armillaryBead("3"), 3);
  assert.equal(armillaryBead(6), 6);
  assert.equal(armillaryBead("9"), 9);
  assert.equal(armillaryBead("4"), null);
  assert.equal(armillaryBead("12"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("gilt"), "");
  assert.equal(inkOf("pearl"), "pearl");
  assert.equal(inkOf("gilt"), "gilt");
  assert.equal(inkOf("slate"), "slate");
  assert.equal(inkOf("pitch"), "");
  assert.equal(keenRing("meridian"), true);
  assert.equal(keenRing("COLURE"), true);
  assert.equal(keenRing("equinoctial"), false);
  assert.equal(stillRing("equinoctial"), true);
  assert.equal(stillRing("solstitial"), true);
  assert.equal(stillRing("meridian"), false);
  assert.equal(ringBand("equinoctial"), "dawn");
  assert.equal(ringBand("solstitial"), "noon");
  assert.equal(ringBand("meridian"), "dusk");
  assert.equal(ringBand("colure"), "night");
  assert.equal(ringBand(""), "");
  assert.equal(ringGap("equinoctial", "solstitial"), 1);
  assert.equal(ringGap("solstitial", "equinoctial"), -1);
  assert.equal(ringGap("", "equinoctial"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(evenBead(6), true);
  assert.equal(evenBead("6"), true);
  assert.equal(evenBead(3), false);
  assert.equal(evenBead(9), false);
  assert.equal(activeRing("keen"), "keen");
  assert.equal(activeRing("meridian"), "meridian");
  assert.equal(activeRing("paris"), "all");
  assert.equal(activeDegree("15"), "15");
  assert.equal(activeDegree("9"), "all");
  assert.equal(activeInk("gilt", ["pearl", "gilt", "slate"]), "gilt");
  assert.equal(activeInk("mist", ["pearl", "gilt", "slate"]), "all");
  assert.equal(activeBead("6"), "6");
  assert.equal(activeBead("4"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(moveArmFocus(0, 4, 1), 1);
  assert.equal(moveArmFocus(0, 4, -1), 3);
  assert.equal(suggestFinish([]), "IVORY");
  assert.equal(suggestDegree([], 5), 15);
  assert.equal(suggestDegree([], 10), 45);
  assert.equal(suggestDegree([], 20), 75);
  assert.equal(suggestRing(8), "equinoctial");
  assert.equal(suggestRing(11), "colure");
  assert.equal(fairKeeper([card({ id: "1", title: "North", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const saved = addArmillary([], { id: "1", title: "North", ring: "meridian", degree: 15, ink: "gilt", bead: 9, keeper: "Ada" });
  assert.equal(saved[0].audit, "save");
  assert.equal(overdueArmillary(saved[0]), true);
  assert.equal(briskArmillary(saved[0]), true);
  assert.equal(liftDegree(saved, "1")[0].degree, 45);
  assert.equal(dipDegree([{ ...saved[0], degree: null }], "1")[0].degree, 75);
  const quiet = card({ id: "2", title: "West", ring: "equinoctial", ink: "pearl", bead: 3 });
  assert.equal(idleArmillary(quiet), true);
  assert.equal(lateArmillary(quiet, "colure"), true);
  const rest = card({ id: "3", title: "East", ring: "colure", ink: "slate", degree: 75, bead: 6 });
  assert.equal(restingArmillary(rest), true);
  const views = readArmillaryViews([{ id: "v1", name: "Morning", tray: "case", ring: "keen", degree: "15", bead: "6", ink: "slate", finish: "ivory" }]);
  assert.equal(views[0].tray, "case");
  assert.equal(dropArmillaryView(views, "v1").length, 0);

  assert.equal(cityLane("London"), "house");
  assert.equal(cityLane("İstanbul"), "house");
  assert.equal(cityLane("New York"), "house");
  assert.equal(cityLane("District 9"), "mark");
  assert.equal(cityLane("Winston-Salem"), "link");
  assert.equal(cityLane("New York City"), "court");
  assert.equal(cityLane("Saint Paul"), "span");
  assert.equal(cityLane("OSLO"), "seal");
  assert.equal(cityLane("Oslo"), "open");
  assert.equal(cityLane("Constantinople"), "long");
  assert.equal(cityLane("York"), "short");
  assert.equal(cityLane("Hamburg"), "desk");
  assert.equal(cityHue("London"), "graphite");
  assert.equal(cityHue("Paris"), "champagne");
  assert.equal(cityHue("Ankara"), "ivory");
  assert.equal(cityKnown("Dubai"), true);
  assert.equal(cityKnown("Hamburg"), false);
  assert.equal(cityGroups("Saint Paul"), 2);
  assert.equal(cityGroups("London"), 1);
  assert.equal(cityStep("Hamburg"), 7);
  assert.equal(cityLeap("Constant"), true);
  assert.equal(cityWide("Constantinople"), true);
  assert.equal(cityDash("Winston-Salem"), true);
  assert.equal(citySpace("Saint Paul"), true);
  assert.equal(cityDigit("District 9"), true);
  assert.equal(cityTwin("Tallinn"), true);
  assert.equal(cityEcho("Mississippi"), true);
  assert.equal(cityTail("Rome"), true);
  assert.equal(cityCap("OSLO"), true);
  assert.equal(cityCap("Oslo"), false);
  assert.equal(cityEven("York"), true);
  assert.equal(cityOdd("Hamburg"), true);
  assert.equal(cityState({ lastCity: "London", amount: 3 }), "");
  assert.equal(cityState(""), "clear");
  assert.equal(cityState({ city: "London" }), "");
  const rows: CityRow[] = [
    { id: "1", label: "Ada", note: "London" },
    { id: "2", label: "Bea", note: "York" },
  ];
  assert.equal(leadingCity(rows), "house");
  assert.match(cityLanesCsv(rows), /house,1/);
  assert.match(cityLanesCsv(rows), /short,1/);
  assert.match(cityRowsCsv(rows, ["1"]), /Ada,London,LON,house,graphite/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND284_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND284_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "amlTitle"), ROUND284_COPY.tr.amlTitle);
  assert.equal(crmv4Text("de", "ctyTitle"), ROUND284_COPY.de.ctyTitle);
  assert.equal(crmv4Text("ru", "amlSub"), ROUND284_COPY.ru.amlSub);
  assert.equal(crmv4Text("ar", "ctySub"), ROUND284_COPY.ar.ctySub);
  assert.equal(crmv4Text("en", "amlLogo"), "7FX");
  assert.equal(crmv4Text("en", "amlTitle"), "Armillary rings");
  assert.equal(crmv4Text("en", "ctyTitle"), "City plates");
  assert.equal(crmv4Text("en", "barRibKicker"), "Desk ribbon");
  assert.equal(crmv4Text("en", "noteCabKicker"), "Notice cabinet");
  assert.notEqual(ROUND284_COPY.tr.amlTitle, ROUND284_COPY.en.amlTitle);
  assert.equal(crmv4Text("en", "phnTitle"), "Phone plates");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-armillary/);
  assert.match(css, /\.c4-cityplate-index/);
  assert.match(css, /\.c4-armillary-column/);
  assert.match(css, /\.c4-cityplate-column/);
  assert.match(css, /\.c4-desk-ribbon/);
  assert.match(css, /\.c4-desk-ribbon-mast|\.c4-desk-ribbon-seal/);
  assert.match(css, /\.c4-note-cabinet/);
  assert.match(css, /\.c4-note-cabinet-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round284.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastCity:/);
  assert.match(viewFile, /armillaryCsv/);
  assert.match(viewFile, /cityRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-cityplate-search/);
  assert.match(viewFile, /armillaryTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "aml"/);
  assert.match(app, /view === "cty"/);
  const shell = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round38.tsx"), "utf8");
  assert.match(shell, /c4-desk-ribbon/);
  assert.match(shell, /c4-desk-ribbon-seal/);
  assert.match(shell, /c4-note-cabinet/);
  assert.match(shell, /c4-note-cabinet-mast/);
  assert.match(shell, /c4-note-cabinet-card/);
  assert.match(shell, /c4-note-cabinet-empty/);
  assert.match(shell, /data-logo="mono"/);
  assert.match(shell, /barRibKicker/);
  assert.match(shell, /barRibLead/);
  assert.match(shell, /noteCabKicker/);
  assert.match(shell, /noteCabLead/);
  const bar = shell.slice(shell.indexOf("export function DeskBar"));
  assert.equal(bar.includes("sendJson"), false);
  assert.equal(bar.includes("fetch("), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND284_COPY.en, key);
  const named = viewFile.match(/"(aml|cty)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND284_COPY.en, key);
  const ribbon = shell.match(/v4\("((?:barRib|noteCab)[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of ribbon) assert.ok(key in ROUND284_COPY.en, key);
  console.log("crmv4 round284 tests passed");
}

main();
