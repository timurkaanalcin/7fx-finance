/**
 * Stillroom slips and region plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round261.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND261_COPY } from "../src/lib/crmv4/copy-round261";
import {
  ROUND261_FEATURES,
  activeDraught,
  activeHeat,
  activeShelf,
  activeStillRank,
  activeStillSpan,
  addStill,
  addStillView,
  boilStill,
  bulkStillPin,
  busiestStillKeeper,
  cycleHeat,
  draughtOf,
  dropStillView,
  fairStillKeeper,
  heatOf,
  houseDraught,
  idleStill,
  lateStill,
  leadingRegion,
  lengthenStill,
  lowerStill,
  moveStillFocus,
  neighborStillCount,
  overdueStill,
  peakShelf,
  quietShelf,
  raiseStill,
  readStillViews,
  regionEcho,
  regionHue,
  regionLane,
  regionLanesCsv,
  regionLeap,
  regionMark,
  regionNotch,
  regionPair,
  regionPlus,
  regionRowsCsv,
  regionStamp,
  regionState,
  regionStep,
  regionWide,
  restingStill,
  shelfBand,
  shelfGap,
  shelfOf,
  shortenStill,
  stillCsv,
  stillRank,
  stillSpan,
  stillTimeline,
  suggestDraught,
  suggestShelf,
  suggestStillSpan,
} from "../src/lib/crmv4/round261";

function main() {
  assert.equal(ROUND261_FEATURES.length, 25);
  assert.equal(shelfOf(" hearth "), "hearth");
  assert.equal(shelfOf("paris"), "");
  assert.equal(stillSpan("10"), 10);
  assert.equal(stillSpan(20), 20);
  assert.equal(stillSpan("40"), 40);
  assert.equal(stillSpan("15"), null);
  assert.equal(stillRank("1"), 1);
  assert.equal(stillRank(3), 3);
  assert.equal(stillRank("5"), 5);
  assert.equal(stillRank("7"), 7);
  assert.equal(stillRank("2"), null);
  assert.equal(draughtOf("rose"), "ROSE");
  assert.equal(draughtOf("clove"), "CLOVE");
  assert.equal(draughtOf("honey"), "HONEY");
  assert.equal(draughtOf("mint"), "");
  assert.equal(heatOf("cool"), "cool");
  assert.equal(heatOf("warm"), "warm");
  assert.equal(heatOf("boil"), "boil");
  assert.equal(heatOf("gale"), "");
  assert.equal(peakShelf("bench"), true);
  assert.equal(peakShelf("HEARTH"), true);
  assert.equal(peakShelf("shelf"), false);
  assert.equal(quietShelf("shelf"), true);
  assert.equal(quietShelf("cellar"), true);
  assert.equal(quietShelf("bench"), false);
  assert.equal(shelfBand("shelf"), "early");
  assert.equal(shelfBand("bench"), "early");
  assert.equal(shelfBand("hearth"), "mid");
  assert.equal(shelfBand("cellar"), "late");
  assert.equal(shelfBand(""), "");
  assert.equal(shelfGap("shelf", "bench"), 1);
  assert.equal(shelfGap("bench", "shelf"), -1);
  assert.equal(shelfGap("", "shelf"), null);
  assert.equal(houseDraught("rose"), true);
  assert.equal(houseDraught("CLOVE"), true);
  assert.equal(houseDraught("honey"), false);
  assert.equal(activeShelf("peak"), "peak");
  assert.equal(activeShelf("hearth"), "hearth");
  assert.equal(activeShelf("paris"), "all");
  assert.equal(activeStillSpan("20"), "20");
  assert.equal(activeStillSpan("9"), "all");
  assert.equal(activeHeat("warm", ["cool", "warm", "boil"]), "warm");
  assert.equal(activeHeat("gale", ["cool", "warm", "boil"]), "all");
  assert.equal(activeStillRank("5"), "5");
  assert.equal(activeStillRank("2"), "all");
  assert.equal(activeDraught("clove"), "clove");
  assert.equal(activeDraught("mint"), "all");
  assert.equal(moveStillFocus(0, 3, 1), 1);
  assert.equal(moveStillFocus(0, 3, -1), 2);
  assert.equal(suggestDraught([]), "ROSE");
  assert.equal(suggestStillSpan([], 4), 10);
  assert.equal(suggestStillSpan([], 12), 20);
  assert.equal(suggestStillSpan([], 19), 40);
  assert.equal(suggestShelf(4), "shelf");
  assert.equal(suggestShelf(12), "hearth");
  assert.equal(fairStillKeeper([], "Ada, Bea"), "Ada");

  const first = addStill([], {
    id: "a",
    title: "  North hearth ",
    note: "",
    keeper: "Ada",
    shelf: "hearth",
    draught: "rose",
    heat: "cool",
    span: 10,
    rank: 1,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North hearth");
  assert.equal(first[0].note, "");
  assert.equal(first[0].draught, "ROSE");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueStill(first[0]), true);
  assert.equal(addStill(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addStill(first, { id: "b", title: "North hearth" }).length, 1);
  assert.equal(addStill(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkStillPin(first, ["a"]);
  assert.equal(overdueStill(pinned[0]), false);
  assert.equal(fairStillKeeper(pinned, "Ada, Bea"), "Ada");
  const quiet = addStill(pinned, { id: "q", title: "Shelf rest", keeper: "Bea", shelf: "shelf", heat: "cool", rank: 1 });
  assert.equal(idleStill(quiet[0]), true);
  assert.equal(lateStill(quiet[0], "bench"), false);
  assert.equal(lateStill(quiet[0], "hearth"), true);
  const behind = addStill([], { id: "z", title: "Shelf late", shelf: "shelf", rank: 1 });
  assert.equal(lateStill(behind[0], "cellar"), true);
  assert.equal(lateStill({ ...behind[0], rank: 3 }, "cellar"), false);
  const rushed = addStill([], { id: "r", title: "Hearth boil", shelf: "hearth", heat: "boil", rank: 7 });
  assert.equal(boilStill(rushed[0]), true);
  const rested = addStill([], { id: "s", title: "Cellar warm", shelf: "cellar", heat: "warm", span: 40 });
  assert.equal(restingStill(rested[0]), true);
  assert.equal(lengthenStill(rested, "s")[0].span, 40);
  assert.equal(lengthenStill([{ ...rested[0], span: null }], "s")[0].span, 10);
  assert.equal(lengthenStill(first, "a")[0].span, 20);
  assert.equal(shortenStill(first, "a")[0].span, 10);
  assert.equal(shortenStill([{ ...first[0], span: null }], "a")[0].span, 40);
  assert.equal(cycleHeat(first, "a")[0].heat, "warm");
  assert.equal(raiseStill(first, "a")[0].rank, 3);
  assert.equal(lowerStill(first, "a")[0].rank, 1);
  assert.equal(lowerStill([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestStillKeeper(quiet), "Bea");
  assert.equal(neighborStillCount(quiet) >= 0, true);
  assert.match(stillCsv(first, "cellar"), /North hearth/);
  assert.match(stillTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const honeyBook = addStill(addStill([], { id: "y1", title: "Honey one", draught: "honey", shelf: "shelf" }), { id: "y2", title: "Honey two", draught: "honey", shelf: "bench" });
  assert.equal(suggestDraught(honeyBook), "HONEY");
  assert.equal(suggestStillSpan(rested, 4), 40);

  const views = addStillView([], { id: "v", name: "Peak", tray: "open", shelf: "peak", span: "10", draught: "rose", heat: "cool", rank: "1" });
  assert.equal(views[0].shelf, "peak");
  assert.equal(dropStillView(views, "v").length, 0);
  assert.equal(readStillViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(regionState("Kent"), "set");
  assert.equal(regionLane("Kent"), "brief");
  assert.equal(regionStamp("Kent"), "KENT");
  assert.equal(regionHue("Kent"), "graphite");
  assert.equal(regionStep("Kent"), 4);
  assert.equal(regionWide("Kent"), false);
  assert.equal(regionLane("Anatolia"), "desk");
  assert.equal(regionLeap("Anatolia"), true);
  assert.equal(regionHue("Anatolia"), "ivory");
  assert.equal(regionLane("New York"), "hall");
  assert.equal(regionWide("New York"), true);
  assert.equal(regionStamp("New York"), "NEWY");
  assert.equal(regionLane("Greater London Area"), "long");
  assert.equal(regionLane("Newfoundland"), "long");
  assert.equal(regionNotch("Ile-de-France"), true);
  assert.equal(regionPlus("North and South"), true);
  assert.equal(regionPair("Anna"), true);
  assert.equal(regionEcho("Anna"), true);
  assert.equal(regionMark("District 9"), true);
  assert.equal(regionState("123"), "clear");
  assert.equal(regionState(""), "clear");
  assert.equal(regionState("paris"), "set");
  assert.equal(regionState({ lastRegion: "Kent", balance: 1 }), "");
  assert.equal(regionState({ code: "HOUSE" }), "");
  assert.equal(regionLane({ region: "Anatolia" }), "desk");

  const book = [
    { id: "1", label: "Ada", note: "New York" },
    { id: "2", label: "Bea", note: "Kent" },
    { id: "3", label: "Cem", note: "Anatolia" },
  ];
  assert.equal(leadingRegion(book), "brief");
  assert.match(regionLanesCsv(book), /brief,1/);
  assert.match(regionRowsCsv(book, ["1"]), /New York,NEWY,hall/);
  assert.match(regionRowsCsv(book, ["1"]), /Kent,KENT,brief,graphite/);
  assert.match(regionRowsCsv(book, ["1"]), /Anatolia,ANAT,desk,ivory/);

  const keys = Object.keys(ROUND261_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND261_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND261_COPY[locale][key as keyof typeof ROUND261_COPY.en], "string");
      assert.ok(ROUND261_COPY[locale][key as keyof typeof ROUND261_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "srmTitle"), ROUND261_COPY.tr.srmTitle);
  assert.equal(crmv4Text("de", "rgpTitle"), ROUND261_COPY.de.rgpTitle);
  assert.equal(crmv4Text("ru", "srmSub"), ROUND261_COPY.ru.srmSub);
  assert.equal(crmv4Text("ar", "rgpSub"), ROUND261_COPY.ar.rgpSub);
  assert.equal(crmv4Text("en", "srmLogo"), "7FX");
  assert.equal(crmv4Text("en", "srmTitle"), "Stillroom slips");
  assert.notEqual(ROUND261_COPY.tr.srmTitle, ROUND261_COPY.en.srmTitle);
  assert.equal(crmv4Text("en", "stlTitle"), "Glasshouse stools");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-srm/);
  assert.match(css, /\.c4-rgp-index/);
  assert.match(css, /\.c4-srm-ribbon/);
  assert.match(css, /\.c4-rgp-bar/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round261.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /lastRegion/);
  assert.match(viewFile, /stillCsv/);
  assert.match(viewFile, /regionRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
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
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestDraught/);
  assert.match(viewFile, /c4-rgp-search/);
  assert.match(viewFile, /stillTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "srm"/);
  assert.match(app, /view === "rgp"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND261_COPY.en, key);
  const audit = viewFile.match(/"(srmAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND261_COPY.en, key);
  console.log("crmv4 round261 tests passed");
}

main();
