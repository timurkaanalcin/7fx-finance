/**
 * Sandglass rules, periplus plates, the ivory arrival nymphaeum, and the graphite city macellum.
 * Run: TZ=UTC npx tsx tests/crmv4-round317.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND317_COPY } from "../src/lib/crmv4/copy-round317";
import {
  ROUND317_FEATURES,
  activeTurn,
  activeGrain,
  activeGlass,
  activeSand,
  addSandglass,
  briskSandglass,
  dropSandglassView,
  fairRunner,
  fullTurn,
  periplusCapital,
  periplusCipher,
  periplusEven,
  periplusFirst,
  periplusGulf,
  periplusHome,
  periplusHue,
  periplusIslet,
  periplusLane,
  periplusLanesCsv,
  periplusLength,
  periplusLower,
  periplusOcean,
  periplusOpen,
  periplusCape,
  periplusRowsCsv,
  periplusSpace,
  periplusState,
  periplusTail,
  periplusUpper,
  periplusMouth,
  houseSand,
  idleSandglass,
  lateSandglass,
  leadingPeriplus,
  moveSandglassFocus,
  sandglassBand,
  sandglassGap,
  sandglassTurn,
  sandglassInner,
  sandglassOuter,
  sandglassGrain,
  sandglassGlass,
  sandglassSand,
  overdueSandglass,
  pairTurn,
  readSandglassViews,
  restingSandglass,
  suggestGrain,
  suggestGlass,
  suggestSand,
  type PeriplusRow,
  type Sandglass,
} from "../src/lib/crmv4/round317";

function rule(partial: Partial<Sandglass> & { id: string; title: string }): Sandglass {
  return {
    note: "",
    runner: "",
    glass: "",
    grain: null,
    sand: "",
    turn: 1,
    tags: [],
    run: false,
    hooked: false,
    chested: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND317_FEATURES.length, 25);
  assert.equal(ROUND317_FEATURES.includes("coast-periplus"), true);
  assert.equal(ROUND317_FEATURES.includes("grain-sla"), true);
  assert.equal(ROUND317_FEATURES.includes("fair-runner"), true);
  assert.equal(ROUND317_FEATURES.includes("chest"), true);
  assert.equal(ROUND317_FEATURES.includes("gilt-sand"), true);
  assert.equal(sandglassGlass(" bulb "), "bulb");
  assert.equal(sandglassGlass("brass"), "");
  assert.equal(sandglassGrain("3"), 3);
  assert.equal(sandglassGrain(9), 9);
  assert.equal(sandglassGrain(15), 15);
  assert.equal(sandglassGrain(30), 30);
  assert.equal(sandglassGrain("7"), null);
  assert.equal(sandglassTurn("1"), 1);
  assert.equal(sandglassTurn(5), 5);
  assert.equal(sandglassTurn("7"), 7);
  assert.equal(sandglassTurn("3"), null);
  assert.equal(sandglassSand("gilt"), "GILT");
  assert.equal(sandglassSand("ivory"), "IVORY");
  assert.equal(sandglassSand("slate"), "SLATE");
  assert.equal(sandglassSand("hot"), "");
  assert.equal(sandglassInner("bulb"), true);
  assert.equal(sandglassInner("NECK"), true);
  assert.equal(sandglassInner("waist"), false);
  assert.equal(sandglassOuter("waist"), true);
  assert.equal(sandglassOuter("foot"), true);
  assert.equal(sandglassOuter("bulb"), false);
  assert.equal(sandglassBand("bulb"), "crown");
  assert.equal(sandglassBand("neck"), "throat");
  assert.equal(sandglassBand("waist"), "pinch");
  assert.equal(sandglassBand("foot"), "stand");
  assert.equal(sandglassBand(""), "");
  assert.equal(sandglassGap("bulb", "foot"), 3);
  assert.equal(sandglassGap("waist", "nope"), null);
  assert.equal(houseSand("gilt"), true);
  assert.equal(houseSand("ivory"), false);
  assert.equal(pairTurn(5), true);
  assert.equal(pairTurn(1), false);
  assert.equal(fullTurn("7"), true);
  assert.equal(fullTurn(5), false);
  assert.equal(activeGlass("inner"), "inner");
  assert.equal(activeGlass("waist"), "waist");
  assert.equal(activeGlass("gold"), "all");
  assert.equal(activeGrain("30"), "30");
  assert.equal(activeGrain("3"), "3");
  assert.equal(activeGrain("7"), "all");
  assert.equal(activeTurn("1"), "1");
  assert.equal(activeTurn("2"), "all");
  assert.equal(activeSand("slate", ["SLATE"]), "SLATE");
  assert.equal(activeSand("hot", ["SLATE"]), "all");
  assert.equal(moveSandglassFocus(0, 3, -1), 2);
  assert.equal(moveSandglassFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", glass: "waist", turn: 1, runner: "Ned" }),
    rule({ id: "b", title: "Bea", glass: "bulb", sand: "SLATE", grain: 30, turn: 7, runner: "Ned" }),
    rule({ id: "c", title: "Cara", glass: "foot", sand: "IVORY", grain: 9, runner: "Ida" }),
  ];
  assert.equal(overdueSandglass(cards[0]), true);
  assert.equal(briskSandglass(cards[1]), true);
  assert.equal(restingSandglass(cards[2]), true);
  assert.equal(idleSandglass(rule({ id: "i", title: "Idle", grain: 3, turn: 1 })), true);
  assert.equal(lateSandglass(cards[1], "foot"), true);
  assert.equal(lateSandglass(cards[1], "bulb"), false);
  assert.equal(suggestSand([]), "IVORY");
  assert.equal(suggestSand(cards), "GILT");
  assert.equal(suggestGrain([], 3), 3);
  assert.equal(suggestGrain([], 6), 9);
  assert.equal(suggestGrain([], 12), 15);
  assert.equal(suggestGrain([], 18), 30);
  assert.equal(suggestGrain(cards, 6), 15);
  assert.equal(suggestGlass(4), "bulb");
  assert.equal(suggestGlass(8), "foot");
  assert.equal(fairRunner(cards, "Ida,Ned"), "Ida");
  const saved = addSandglass([], { title: "Dora", glass: "waist", sand: "ivory", grain: "9", turn: "5", tags: "x y z" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].sand, "IVORY");
  assert.equal(saved[0].grain, 9);
  assert.equal(saved[0].turn, 5);
  assert.equal(saved[0].tags.join(""), "xy");
  assert.equal(addSandglass(saved, { title: "Dora" }).length, 1);
  assert.equal(dropSandglassView([{ id: "v", name: "Morning", tray: "table", query: "", runner: "", sand: "all", glass: "all", grain: "all", turn: "all" }], "v").length, 0);
  assert.equal(readSandglassViews([{ id: "v", name: "Morning", tray: "hook" }])[0].tray, "hook");

  assert.equal(periplusHome("HOME"), true);
  assert.equal(periplusHome({ country: true }), true);
  assert.equal(periplusGulf({ country: false }), true);
  assert.equal(periplusHome({ country: "road" }), true);
  assert.equal(periplusRidgeSafe("re-check"), true);
  assert.equal(periplusGulf("needs review"), true);
  assert.equal(periplusIslet("US"), true);
  assert.equal(periplusIslet("NET"), true);
  assert.equal(periplusOcean("Netherlands"), true);
  assert.equal(periplusOcean("Amsterdam"), false);
  assert.equal(periplusLane("12"), "islet");
  assert.equal(periplusLane("10.1.1.1"), "cipher");
  assert.equal(periplusLane("Amsterdam"), "mouth");
  assert.equal(periplusLane("Paris"), "cape");
  assert.equal(periplusCape("Paris"), true);
  assert.equal(periplusOpen(""), true);
  assert.equal(periplusOpen({ country: "" }), true);
  assert.equal(periplusState({ name: "Ada" }), "");
  assert.equal(periplusState({ country: "Paris", balance: 1 }), "");
  assert.equal(periplusHue("HOME"), "champagne");
  assert.equal(periplusHue("needs review"), "graphite");
  assert.equal(periplusHue("Amsterdam"), "ivory");
  assert.equal(periplusLength("hold"), 4);
  assert.equal(periplusEven("hold"), true);
  assert.equal(periplusFirst("Paris"), true);
  assert.equal(periplusSpace("needs review"), true);
  assert.equal(periplusMouth("Amsterdam"), true);
  assert.equal(periplusCipher("Room4"), true);
  assert.equal(periplusCapital("PARIS"), true);
  assert.equal(periplusLower("paris"), true);
  assert.equal(periplusUpper("PARIS"), true);
  assert.equal(periplusUpper("ON"), false);
  assert.equal(periplusTail("Room4"), true);
  const marks: PeriplusRow[] = [
    { id: "1", label: "Ada", coast: "HOME" },
    { id: "2", label: "Bea", coast: "PORT" },
    { id: "3", label: "Cara", coast: "Paris" },
  ];
  assert.equal(leadingPeriplus(marks), "home");
  assert.match(periplusLanesCsv(marks), /home,2/);
  assert.match(periplusRowsCsv(marks, ["1"]), /Ada,HOME/);
  assert.equal(crmv4Text("tr", "sngTitle"), ROUND317_COPY.tr.sngTitle);
  assert.equal(crmv4Text("de", "prpTitle"), ROUND317_COPY.de.prpTitle);
  assert.equal(crmv4Text("ru", "arrNymphaeumKicker"), ROUND317_COPY.ru.arrNymphaeumKicker);
  assert.equal(crmv4Text("ar", "citMacellumLead"), ROUND317_COPY.ar.citMacellumLead);
  const keys = Object.keys(ROUND317_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND317_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sandglass/);
  assert.match(css, /\.c4-periplus/);
  assert.match(css, /\.c4-sandglass-column/);
  assert.match(css, /\.c4-periplus-column/);
  assert.match(css, /\.c4-arrival-nymphaeum/);
  assert.match(css, /\.c4-city-macellum/);
  assert.match(css, /\.c4-arrival-nymphaeum-mast/);
  assert.match(css, /\.c4-city-macellum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round317.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /country:/);
  assert.match(viewFile, /sandglassCsv/);
  assert.match(viewFile, /periplusRowsCsv/);
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
  assert.match(viewFile, /suggestSand/);
  assert.match(viewFile, /c4-periplus-search/);
  assert.match(viewFile, /sandglassTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sng"/);
  assert.match(app, /view === "prp"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round137.tsx"), "utf8");
  assert.match(host, /c4-arrival-nymphaeum/);
  assert.match(host, /c4-arrival-nymphaeum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /arrNymphaeumKicker/);
  assert.match(host, /arrNymphaeumLead/);
  assert.match(host, /data-arrival/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-city-macellum/);
  assert.match(host, /c4-city-macellum-mast/);
  assert.match(host, /citMacellumKicker/);
  assert.match(host, /citMacellumLead/);
  assert.match(host, /data-city/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(sng|prp|arrNymphaeum|citMacellum)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND317_COPY.en[key as keyof typeof ROUND317_COPY.en], "string", key);
  console.log("crmv4 round317 tests passed");
}

function periplusRidgeSafe(raw: string): boolean {
  return periplusLane(raw) === "ridge";
}

main();
