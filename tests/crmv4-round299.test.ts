/**
 * Graphometer arcs, system plates, the ivory source ambulatory, and the graphite desk triforium.
 * Run: TZ=UTC npx tsx tests/crmv4-round299.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND299_COPY } from "../src/lib/crmv4/copy-round299";
import {
  ROUND299_FEATURES,
  activeFace,
  activeFinish,
  activeLimb,
  activePitch,
  addGraphometer,
  briskGraph,
  dropGraphView,
  faceGap,
  fairGraphSurveyor,
  fullLimb,
  graphBand,
  graphFace,
  graphFinish,
  graphLimb,
  graphPitch,
  houseFinish,
  idleGraph,
  innerFace,
  lateGraph,
  leadingOs,
  liftPitch,
  lowerPitch,
  moveGraphFocus,
  osCapital,
  osDigit,
  osEven,
  osFamily,
  osFirst,
  osHouse,
  osHue,
  osLane,
  osLanesCsv,
  osLength,
  osPair,
  osRowsCsv,
  osSoon,
  osSpace,
  osSpark,
  osStack,
  osState,
  osTail,
  osVowel,
  outerFace,
  overdueGraph,
  pairLimb,
  readGraphViews,
  restingGraph,
  suggestFace,
  suggestGraphFinish,
  suggestPitch,
  type Graphometer,
  type OsRow,
} from "../src/lib/crmv4/round299";

function arc(partial: Partial<Graphometer> & { id: string; title: string }): Graphometer {
  return {
    note: "",
    surveyor: "",
    face: "",
    pitch: null,
    finish: "",
    limb: 1,
    tags: [],
    aligned: false,
    cased: false,
    vaulted: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND299_FEATURES.length, 25);
  assert.equal(ROUND299_FEATURES.includes("system"), true);
  assert.equal(ROUND299_FEATURES.includes("pitch"), true);
  assert.equal(ROUND299_FEATURES.includes("fair-surveyor"), true);
  assert.equal(graphFace(" face "), "face");
  assert.equal(graphFace("brass"), "");
  assert.equal(graphPitch("5"), 5);
  assert.equal(graphPitch(10), 10);
  assert.equal(graphPitch("20"), 20);
  assert.equal(graphPitch("40"), 40);
  assert.equal(graphPitch("8"), null);
  assert.equal(graphLimb("1"), 1);
  assert.equal(graphLimb(3), 3);
  assert.equal(graphLimb("5"), 5);
  assert.equal(graphLimb("2"), null);
  assert.equal(graphFinish("ivory"), "IVORY");
  assert.equal(graphFinish("graphite"), "GRAPHITE");
  assert.equal(graphFinish("champagne"), "CHAMPAGNE");
  assert.equal(graphFinish("hot"), "");
  assert.equal(innerFace("face"), true);
  assert.equal(innerFace("BACK"), true);
  assert.equal(innerFace("edge"), false);
  assert.equal(outerFace("rim"), true);
  assert.equal(outerFace("edge"), true);
  assert.equal(outerFace("face"), false);
  assert.equal(graphBand("face"), "dial");
  assert.equal(graphBand("back"), "reverse");
  assert.equal(graphBand("edge"), "flank");
  assert.equal(graphBand("rim"), "arc");
  assert.equal(graphBand(""), "");
  assert.equal(faceGap("face", "rim"), 3);
  assert.equal(faceGap("edge", "nope"), null);
  assert.equal(houseFinish("ivory"), true);
  assert.equal(houseFinish("graphite"), false);
  assert.equal(pairLimb(3), true);
  assert.equal(pairLimb(1), false);
  assert.equal(fullLimb("5"), true);
  assert.equal(fullLimb(3), false);
  assert.equal(activeFace("inner"), "inner");
  assert.equal(activeFace("rim"), "rim");
  assert.equal(activeFace("gold"), "all");
  assert.equal(activePitch("40"), "40");
  assert.equal(activePitch("8"), "all");
  assert.equal(activeLimb("1"), "1");
  assert.equal(activeLimb("2"), "all");
  assert.equal(activeFinish("champagne", ["CHAMPAGNE"]), "CHAMPAGNE");
  assert.equal(activeFinish("hot", ["CHAMPAGNE"]), "all");
  assert.equal(moveGraphFocus(0, 3, -1), 2);
  assert.equal(moveGraphFocus(0, 0, 1), 0);

  const cards = [
    arc({ id: "a", title: "Ada", face: "edge", limb: 1, surveyor: "Ned" }),
    arc({ id: "b", title: "Bea", face: "face", finish: "CHAMPAGNE", pitch: 40, limb: 5, surveyor: "Ned" }),
    arc({ id: "c", title: "Cara", face: "rim", finish: "IVORY", pitch: 10, surveyor: "Ida" }),
  ];
  assert.equal(overdueGraph(cards[0]), true);
  assert.equal(briskGraph(cards[1]), true);
  assert.equal(restingGraph(cards[2]), true);
  assert.equal(idleGraph(arc({ id: "i", title: "Idle", pitch: 5, limb: 1 })), true);
  assert.equal(lateGraph(cards[1], "rim"), true);
  assert.equal(lateGraph(cards[1], "face"), false);
  assert.equal(suggestGraphFinish([]), "CHAMPAGNE");
  assert.equal(suggestGraphFinish(cards), "GRAPHITE");
  assert.equal(suggestGraphFinish([
    ...cards,
    arc({ id: "d", title: "Dora", finish: "IVORY" }),
    arc({ id: "e", title: "Eve", finish: "IVORY" }),
    arc({ id: "f", title: "Fay", finish: "GRAPHITE" }),
    arc({ id: "g", title: "Gia", finish: "GRAPHITE" }),
  ]), "CHAMPAGNE");
  assert.equal(suggestPitch([], 3), 5);
  assert.equal(suggestPitch([], 9), 10);
  assert.equal(suggestPitch([], 14), 20);
  assert.equal(suggestPitch([], 20), 40);
  assert.equal(suggestPitch([arc({ id: "w", title: "Wide", pitch: 40 })], 3), 20);
  assert.equal(suggestPitch([
    arc({ id: "p", title: "P", pitch: 5 }),
    arc({ id: "q", title: "Q", pitch: 5 }),
    arc({ id: "r", title: "R", pitch: 10 }),
    arc({ id: "s", title: "S", pitch: 10 }),
    arc({ id: "t", title: "T", pitch: 20 }),
    arc({ id: "u", title: "U", pitch: 20 }),
    arc({ id: "v", title: "V", pitch: 40 }),
  ], 3), 40);
  assert.equal(suggestFace(8), "face");
  assert.equal(suggestFace(13), "rim");
  assert.equal(fairGraphSurveyor(cards, "Ned,Ida"), "Ida");
  const added = addGraphometer(cards, { title: "Dora", face: "back", pitch: "10", limb: "3", tags: "n s t" });
  assert.equal(added.length, 4);
  assert.equal(added[3].audit, "save");
  assert.deepEqual(added[3].tags, ["n", "s"]);
  assert.equal(addGraphometer(cards, { title: "Ada" }).length, 3);
  const lifted = liftPitch(cards, "a");
  assert.equal(lifted[0].pitch, 5);
  assert.equal(lowerPitch(lifted, "a")[0].pitch, 40);
  assert.equal(dropGraphView([{ id: "v", name: "Desk", tray: "bench", query: "", surveyor: "", finish: "all", face: "all", pitch: "all", limb: "all" }], "v").length, 0);
  assert.equal(readGraphViews([{ id: "", name: "x" }]).length, 0);

  assert.equal(osLane("Unix"), "seed");
  assert.equal(osLane("Linux"), "house");
  assert.equal(osLane("Windows/NT"), "stack");
  assert.equal(osLane("Windows 11"), "pair");
  assert.equal(osLane("iOS Sonoma"), "spark");
  assert.equal(osLane("macOS Sonoma"), "post");
  assert.equal(osLane(""), "");
  assert.equal(osState(""), "clear");
  assert.equal(osState({ city: "x" }), "");
  assert.equal(osState({ lastOs: "Linux", amount: 3 }), "");
  assert.equal(osState({ lastOs: "Linux" }), "set");
  assert.equal(osHue("Unix"), "champagne");
  assert.equal(osHue("macOS Sonoma"), "ivory");
  assert.equal(osHue("Windows/NT"), "graphite");
  assert.equal(osSoon("Unix"), true);
  assert.equal(osSoon("iOS Sonoma"), true);
  assert.equal(osSoon("Linux"), false);
  assert.equal(osLength("Windows 11"), 10);
  assert.equal(osLength(""), null);
  assert.equal(osEven("Unix"), true);
  assert.equal(osEven("Linux"), false);
  assert.equal(osFirst("Linux"), true);
  assert.equal(osFirst("11Windows"), false);
  assert.equal(osTail("Android 14"), true);
  assert.equal(osTail("Linux"), false);
  assert.equal(osCapital("Linux"), true);
  assert.equal(osCapital("linux"), false);
  assert.equal(osSpace("macOS Sonoma"), true);
  assert.equal(osVowel("Android 14"), true);
  assert.equal(osVowel("Linux"), false);
  assert.equal(osDigit("Windows 11"), true);
  assert.equal(osHouse("Linux"), true);
  assert.equal(osStack("Windows/NT"), true);
  assert.equal(osPair("Windows 11"), true);
  assert.equal(osSpark("iOS Sonoma"), true);
  assert.equal(osFamily("macOS Sonoma"), "macOS");
  const rows: OsRow[] = [
    { id: "1", label: "Ada", system: "Unix" },
    { id: "2", label: "Bea", system: "macOS Sonoma" },
  ];
  assert.equal(leadingOs(rows), "seed");
  assert.match(osLanesCsv(rows), /seed,1/);
  assert.match(osLanesCsv(rows), /post,1/);
  assert.match(osRowsCsv(rows, ["1"]), /Ada,Unix/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND299_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND299_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "gphTitle"), ROUND299_COPY.tr.gphTitle);
  assert.equal(crmv4Text("de", "ospTitle"), ROUND299_COPY.de.ospTitle);
  assert.equal(crmv4Text("ru", "gphSub"), ROUND299_COPY.ru.gphSub);
  assert.equal(crmv4Text("ar", "ospSub"), ROUND299_COPY.ar.ospSub);
  assert.equal(crmv4Text("en", "gphLogo"), "7FX");
  assert.equal(crmv4Text("en", "ospLogo"), "7FX");
  assert.equal(crmv4Text("en", "gphTitle"), "Graphometer arcs");
  assert.equal(crmv4Text("en", "ospTitle"), "System plates");
  assert.equal(crmv4Text("en", "lsAmbulatoryKicker"), "Ivory source ambulatory");
  assert.equal(crmv4Text("en", "gnTriforiumKicker"), "Graphite desk triforium");
  assert.notEqual(ROUND299_COPY.tr.gphTitle, ROUND299_COPY.en.gphTitle);
  assert.notEqual(ROUND299_COPY.ar.ospTitle, ROUND299_COPY.en.ospTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-graph/);
  assert.match(css, /\.c4-os-index/);
  assert.match(css, /\.c4-graph-column/);
  assert.match(css, /\.c4-os-column/);
  assert.match(css, /\.c4-source-ambulatory/);
  assert.match(css, /\.c4-assignee-triforium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round299.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastOs:/);
  assert.match(viewFile, /graphCsv/);
  assert.match(viewFile, /osRowsCsv/);
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
  assert.match(viewFile, /suggestGraphFinish/);
  assert.match(viewFile, /c4-os-search/);
  assert.match(viewFile, /graphTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gph"/);
  assert.match(app, /view === "osp"/);
  const source = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round92.tsx"), "utf8");
  assert.match(source, /c4-source-ambulatory/);
  assert.match(source, /c4-source-ambulatory-mast/);
  assert.match(source, /data-logo="mono"/);
  assert.match(source, /lsAmbulatoryKicker/);
  assert.match(source, /lsAmbulatoryLead/);
  assert.match(source, /data-source-glance/);
  assert.equal(source.includes("amount"), false);
  assert.equal(source.includes("profit"), false);
  const triforium = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round93.tsx"), "utf8");
  assert.match(triforium, /c4-assignee-triforium/);
  assert.match(triforium, /c4-assignee-triforium-mast/);
  assert.match(triforium, /gnTriforiumKicker/);
  assert.match(triforium, /gnTriforiumLead/);
  assert.match(triforium, /data-assignee-glance/);
  assert.equal(triforium.includes("amount"), false);
  assert.equal(triforium.includes("profit"), false);
  const named = `${viewFile}\n${source}\n${triforium}`.match(/"(gph|osp|lsAmbulatory|gnTriforium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.equal(typeof ROUND299_COPY.en[key as keyof typeof ROUND299_COPY.en], "string", key);
  console.log("crmv4 round299 tests passed");
}

main();
