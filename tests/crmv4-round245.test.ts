/**
 * Orchard benches and meridian marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round245.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND245_COPY } from "../src/lib/crmv4/copy-round245";
import {
  activeBloom,
  activeHeight,
  activeSeason,
  activeSoil,
  activeWater,
  addOrchardBench,
  addOrchardView,
  bloomOf,
  cycleBloom,
  fairGardener,
  heightOf,
  houseSoil,
  idleBench,
  lateBench,
  leadingMeridian,
  lengthenWater,
  lowerHeight,
  meridianBound,
  meridianHue,
  meridianJoin,
  meridianLane,
  meridianLanesCsv,
  meridianNotch,
  meridianRowsCsv,
  meridianStamp,
  meridianState,
  meridianStep,
  meridianWide,
  moveOrchardFocus,
  neighborBenchCount,
  orchardCsv,
  orchardTimeline,
  peakSeason,
  quietSeason,
  raiseHeight,
  readOrchardViews,
  seasonBand,
  seasonGap,
  seasonOf,
  setBenchHeight,
  setBenchShade,
  sharedMeridianCount,
  shortenWater,
  soilOf,
  suggestSoil,
  suggestWater,
  waterOf,
} from "../src/lib/crmv4/round245";

function main() {
  assert.equal(seasonOf(" Leaf "), "leaf");
  assert.equal(seasonOf("paris"), "");
  assert.equal(waterOf("10"), 10);
  assert.equal(waterOf(20), 20);
  assert.equal(waterOf("40"), 40);
  assert.equal(waterOf("12"), null);
  assert.equal(heightOf("1"), 1);
  assert.equal(heightOf(2), 2);
  assert.equal(heightOf("3"), 3);
  assert.equal(heightOf("4"), 4);
  assert.equal(heightOf("5"), null);
  assert.equal(soilOf("loam"), "LOAM");
  assert.equal(soilOf("clay"), "CLAY");
  assert.equal(soilOf("sand"), "SAND");
  assert.equal(soilOf("silk"), "");
  assert.equal(bloomOf("bud"), "bud");
  assert.equal(bloomOf("open"), "open");
  assert.equal(bloomOf("spent"), "spent");
  assert.equal(bloomOf("three"), "");
  assert.equal(peakSeason("bud"), true);
  assert.equal(peakSeason("BLOOM"), true);
  assert.equal(peakSeason("frost"), false);
  assert.equal(quietSeason("frost"), true);
  assert.equal(quietSeason("leaf"), false);
  assert.equal(seasonBand("bud"), "early");
  assert.equal(seasonBand("fruit"), "mid");
  assert.equal(seasonBand("frost"), "late");
  assert.equal(seasonBand(""), "");
  assert.equal(seasonGap("leaf", "fruit"), 1);
  assert.equal(seasonGap("fruit", "leaf"), -1);
  assert.equal(seasonGap("", "leaf"), null);
  assert.equal(houseSoil("loam"), true);
  assert.equal(houseSoil("SAND"), true);
  assert.equal(houseSoil("clay"), false);
  assert.equal(activeSeason("peak"), "peak");
  assert.equal(activeSeason("leaf"), "leaf");
  assert.equal(activeSeason("paris"), "all");
  assert.equal(activeWater("10"), "10");
  assert.equal(activeWater("12"), "all");
  assert.equal(activeBloom("open", ["bud", "open", "spent"]), "open");
  assert.equal(activeBloom("hush", ["bud", "open", "spent"]), "all");
  assert.equal(activeHeight("2"), "2");
  assert.equal(activeHeight("5"), "all");
  assert.equal(activeSoil("clay"), "clay");
  assert.equal(activeSoil("silk"), "all");
  assert.equal(moveOrchardFocus(0, 3, 1), 1);
  assert.equal(moveOrchardFocus(0, 3, -1), 2);
  assert.equal(suggestSoil([]), "LOAM");
  assert.equal(suggestWater([], 4), 10);
  assert.equal(suggestWater([], 12), 20);
  assert.equal(suggestWater([], 19), 40);
  assert.equal(fairGardener([], "Ada, Bea"), "Ada");

  const first = addOrchardBench([], {
    id: "a",
    title: "  North bench ",
    note: "quiet",
    gardener: "Ada",
    season: "leaf",
    soil: "loam",
    bloom: "open",
    water: "10",
    height: "2",
    tags: "p q",
  });
  assert.equal(first[0].title, "North bench");
  assert.equal(first[0].soil, "LOAM");
  assert.equal(first[0].water, 10);
  assert.equal(first[0].height, 2);
  assert.deepEqual(first[0].tags, ["p", "q"]);
  assert.equal(lateBench(first[0], "fruit"), true);
  assert.equal(idleBench(first[0]), false);
  const bloomed = cycleBloom(first, "a");
  assert.equal(bloomed[0].bloom, "spent");
  const raised = raiseHeight(first, "a");
  assert.equal(raised[0].height, 3);
  const lowered = lowerHeight(raised, "a");
  assert.equal(lowered[0].height, 2);
  const longer = lengthenWater(first, "a");
  assert.equal(longer[0].water, 20);
  const shorter = shortenWater(longer, "a");
  assert.equal(shorter[0].water, 10);
  const shaded = setBenchShade(first, "a", true);
  assert.equal(shaded[0].shade, true);
  assert.equal(setBenchHeight(first, "a", 9)[0].height, 2);
  assert.equal(orchardTimeline(first).map((lane) => lane.height).join(","), "2");
  assert.match(orchardCsv(first, "fruit"), /North bench,Ada,leaf,LOAM,open,10,2,p q,0,0,0,0,1,1,0,0,0,1,early,0,0,0,save,quiet/);
  const views = addOrchardView([], {
    id: "v",
    name: " Peak ",
    tray: "open",
    query: "north",
    gardener: "Ada",
    soil: "loam",
    bloom: "open",
    season: "peak",
    water: "10",
    height: "2",
  });
  assert.equal(readOrchardViews(views)[0].season, "peak");
  assert.equal(neighborBenchCount(first), 0);

  assert.equal(meridianState("Europe/Istanbul"), "set");
  assert.equal(meridianState("  "), "clear");
  assert.equal(meridianState({ timezone: "Europe/Istanbul", balance: 4 }), "");
  assert.equal(meridianStamp("Europe/Istanbul"), "E8");
  assert.equal(meridianStamp("UTC"), "U0");
  assert.equal(meridianStamp({ zone: "Europe", city: "Oslo" }), "E4");
  assert.equal(meridianLane("America/Argentina/Buenos_Aires"), "deep");
  assert.equal(meridianLane("America/New_York"), "score");
  assert.equal(meridianLane("America/Port-au-Prince"), "dash");
  assert.equal(meridianLane("Europe/A.M"), "mark");
  assert.equal(meridianLane("UTC"), "hush");
  assert.equal(meridianLane("GMT"), "hush");
  assert.equal(meridianLane("EST"), "trio");
  assert.equal(meridianLane("Asia/Aden"), "pair");
  assert.equal(meridianLane("Europe/Istanbul"), "long");
  assert.equal(meridianHue("Europe/Istanbul"), "sand");
  assert.equal(meridianHue("UTC"), "gilt");
  assert.equal(meridianHue("Asia/Aden"), "clay");
  assert.equal(meridianHue("Europe/Istanbul!"), "pearl");
  assert.equal(meridianHue("Etc/GMT+1"), "mist");
  assert.equal(meridianBound("Europe/Oslo"), true);
  assert.equal(meridianBound("Asia/Aden"), true);
  assert.equal(meridianBound("Europe/Paris"), false);
  assert.equal(meridianWide("America/New_York"), true);
  assert.equal(meridianWide("Europe/Istanbul"), false);
  assert.equal(meridianNotch("America/New_York"), true);
  assert.equal(meridianNotch("Europe/Istanbul"), false);
  assert.equal(meridianJoin("Europe/Istanbul"), true);
  assert.equal(meridianJoin("UTC"), false);
  assert.equal(meridianStep("Europe/Istanbul"), 5);
  assert.equal(meridianStep(""), 0);

  const book = [
    { id: "1", label: "Ada", note: "Europe/Istanbul" },
    { id: "2", label: "Bea", note: "Europe/Istanbul" },
    { id: "3", label: "Cem", note: "UTC" },
  ];
  assert.equal(sharedMeridianCount(book), 2);
  assert.equal(leadingMeridian(book), "long");
  assert.match(meridianLanesCsv(book), /long,2/);
  assert.match(meridianRowsCsv(book, ["1"]), /Europe\/Istanbul,E8,long,sand,5,1,0,0,1,0,0,0,0,0,0,0,1,1/);

  const keys = Object.keys(ROUND245_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND245_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND245_COPY[locale][key as keyof typeof ROUND245_COPY.en], "string");
      assert.ok(ROUND245_COPY[locale][key as keyof typeof ROUND245_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "orbTitle"), ROUND245_COPY.tr.orbTitle);
  assert.equal(crmv4Text("de", "mrdTitle"), ROUND245_COPY.de.mrdTitle);
  assert.equal(crmv4Text("ru", "orbSub"), ROUND245_COPY.ru.orbSub);
  assert.equal(crmv4Text("ar", "mrdSub"), ROUND245_COPY.ar.mrdSub);
  assert.equal(crmv4Text("en", "orbLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-orb/);
  assert.match(css, /\.c4-mrd-index/);
  assert.match(css, /\.c4-sop-glass/);
  assert.match(css, /\.c4-bnc/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round245.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /timezone/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /orchardCsv/);
  assert.match(viewFile, /meridianRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-benches/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestSoil/);
  assert.match(viewFile, /c4-mrd-search/);
  assert.match(viewFile, /orchardTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "orb"/);
  assert.match(app, /view === "mrd"/);
  assert.match(app, /OrchardBenches/);
  assert.match(app, /MeridianMarks/);
  const sop = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round58.tsx"), "utf8");
  assert.match(sop, /c4-sop-glass/);
  assert.match(sop, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND245_COPY.en, key);
  const audit = viewFile.match(/"(orbAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND245_COPY.en, key);
  console.log("crmv4 round245 tests passed");
}

main();
