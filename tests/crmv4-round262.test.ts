/**
 * Larder slips and title plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round262.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND262_COPY } from "../src/lib/crmv4/copy-round262";
import {
  ROUND262_FEATURES,
  activeGrain,
  activeLarderRank,
  activeLarderWait,
  activePace,
  activeStation,
  addLarder,
  addLarderView,
  briskLarder,
  bulkLarderPin,
  busiestLarderKeeper,
  cyclePace,
  dropLarderView,
  fairLarderKeeper,
  grainOf,
  houseGrain,
  idleLarder,
  larderCsv,
  larderRank,
  larderTimeline,
  larderWait,
  lateLarder,
  leadingTitle,
  lengthenLarder,
  lowerLarder,
  moveLarderFocus,
  neighborLarderCount,
  overdueLarder,
  paceOf,
  peakStation,
  quietStation,
  raiseLarder,
  readLarderViews,
  restingLarder,
  shortenLarder,
  stationBand,
  stationGap,
  stationOf,
  suggestGrain,
  suggestLarderWait,
  suggestStation,
  titleCap,
  titleEcho,
  titleHue,
  titleKnown,
  titleLane,
  titleLanesCsv,
  titleLeap,
  titleNotch,
  titleRowsCsv,
  titleSlash,
  titleStamp,
  titleState,
  titleStep,
  titleTail,
  titleTwin,
  titleWide,
} from "../src/lib/crmv4/round262";

function main() {
  assert.equal(ROUND262_FEATURES.length, 25);
  assert.equal(stationOf(" rack "), "rack");
  assert.equal(stationOf("paris"), "");
  assert.equal(larderWait("12"), 12);
  assert.equal(larderWait(24), 24);
  assert.equal(larderWait("36"), 36);
  assert.equal(larderWait("15"), null);
  assert.equal(larderRank("2"), 2);
  assert.equal(larderRank(4), 4);
  assert.equal(larderRank("6"), 6);
  assert.equal(larderRank("8"), 8);
  assert.equal(larderRank("1"), null);
  assert.equal(grainOf("oat"), "OAT");
  assert.equal(grainOf("rye"), "RYE");
  assert.equal(grainOf("wheat"), "WHEAT");
  assert.equal(grainOf("mint"), "");
  assert.equal(paceOf("slow"), "slow");
  assert.equal(paceOf("even"), "even");
  assert.equal(paceOf("brisk"), "brisk");
  assert.equal(paceOf("gale"), "");
  assert.equal(peakStation("crock"), true);
  assert.equal(peakStation("RACK"), true);
  assert.equal(peakStation("bin"), false);
  assert.equal(quietStation("bin"), true);
  assert.equal(quietStation("loft"), true);
  assert.equal(quietStation("crock"), false);
  assert.equal(stationBand("bin"), "early");
  assert.equal(stationBand("crock"), "early");
  assert.equal(stationBand("rack"), "mid");
  assert.equal(stationBand("loft"), "late");
  assert.equal(stationBand(""), "");
  assert.equal(stationGap("bin", "crock"), 1);
  assert.equal(stationGap("crock", "bin"), -1);
  assert.equal(stationGap("", "bin"), null);
  assert.equal(houseGrain("oat"), true);
  assert.equal(houseGrain("WHEAT"), true);
  assert.equal(houseGrain("rye"), false);
  assert.equal(activeStation("peak"), "peak");
  assert.equal(activeStation("crock"), "crock");
  assert.equal(activeStation("paris"), "all");
  assert.equal(activeLarderWait("24"), "24");
  assert.equal(activeLarderWait("9"), "all");
  assert.equal(activePace("even", ["slow", "even", "brisk"]), "even");
  assert.equal(activePace("gale", ["slow", "even", "brisk"]), "all");
  assert.equal(activeLarderRank("6"), "6");
  assert.equal(activeLarderRank("1"), "all");
  assert.equal(activeGrain("rye"), "rye");
  assert.equal(activeGrain("mint"), "all");
  assert.equal(moveLarderFocus(0, 3, 1), 1);
  assert.equal(moveLarderFocus(0, 3, -1), 2);
  assert.equal(suggestGrain([]), "OAT");
  assert.equal(suggestLarderWait([], 4), 12);
  assert.equal(suggestLarderWait([], 8), 24);
  assert.equal(suggestLarderWait([], 16), 36);
  assert.equal(suggestStation(4), "bin");
  assert.equal(suggestStation(12), "rack");
  assert.equal(fairLarderKeeper([], "Ada, Bea"), "Ada");

  const first = addLarder([], {
    id: "a",
    title: "  North crock ",
    note: "",
    keeper: "Ada",
    station: "crock",
    grain: "oat",
    pace: "slow",
    wait: 12,
    rank: 2,
    tags: "x x y",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North crock");
  assert.equal(first[0].note, "");
  assert.equal(first[0].grain, "OAT");
  assert.equal(first[0].tags.join(""), "xy");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueLarder(first[0]), true);
  assert.equal(addLarder(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addLarder(first, { id: "b", title: "North crock" }).length, 1);
  assert.equal(addLarder(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkLarderPin(first, ["a"]);
  assert.equal(overdueLarder(pinned[0]), false);
  assert.equal(fairLarderKeeper(pinned, "Ada, Bea"), "Ada");
  const quiet = addLarder(pinned, { id: "q", title: "Bin rest", keeper: "Bea", station: "bin", pace: "slow", rank: 2 });
  assert.equal(idleLarder(quiet[0]), true);
  assert.equal(lateLarder(quiet[0], "crock"), false);
  assert.equal(lateLarder(quiet[0], "rack"), true);
  const behind = addLarder([], { id: "z", title: "Bin late", station: "bin", rank: 2 });
  assert.equal(lateLarder(behind[0], "loft"), true);
  assert.equal(lateLarder({ ...behind[0], rank: 4 }, "loft"), false);
  const rushed = addLarder([], { id: "r", title: "Crock brisk", station: "crock", pace: "brisk", rank: 8 });
  assert.equal(briskLarder(rushed[0]), true);
  const rested = addLarder([], { id: "s", title: "Loft even", station: "loft", pace: "even", wait: 36 });
  assert.equal(restingLarder(rested[0]), true);
  assert.equal(lengthenLarder(rested, "s")[0].wait, 36);
  assert.equal(lengthenLarder([{ ...rested[0], wait: null }], "s")[0].wait, 12);
  assert.equal(lengthenLarder(first, "a")[0].wait, 24);
  assert.equal(shortenLarder(first, "a")[0].wait, 12);
  assert.equal(shortenLarder([{ ...first[0], wait: null }], "a")[0].wait, 36);
  assert.equal(cyclePace(first, "a")[0].pace, "even");
  assert.equal(raiseLarder(first, "a")[0].rank, 4);
  assert.equal(lowerLarder(first, "a")[0].rank, 2);
  assert.equal(lowerLarder([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestLarderKeeper(quiet), "Bea");
  assert.equal(neighborLarderCount(quiet) >= 0, true);
  assert.match(larderCsv(first, "loft"), /North crock/);
  assert.match(larderTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const ryeBook = addLarder(addLarder([], { id: "y1", title: "Rye one", grain: "rye", station: "bin" }), { id: "y2", title: "Rye two", grain: "rye", station: "crock" });
  assert.equal(suggestGrain(ryeBook), "RYE");
  assert.equal(suggestLarderWait(rested, 4), 36);

  const views = addLarderView([], { id: "v", name: "Peak", tray: "open", station: "peak", wait: "12", grain: "oat", pace: "slow", rank: "2" });
  assert.equal(views[0].station, "peak");
  assert.equal(dropLarderView(views, "v").length, 0);
  assert.equal(readLarderViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(titleState("analyst"), "set");
  assert.equal(titleLane("analyst"), "chip");
  assert.equal(titleStamp("analyst"), "LYST");
  assert.equal(titleHue("analyst"), "champagne");
  assert.equal(titleStep("analyst"), 7);
  assert.equal(titleWide("analyst"), false);
  assert.equal(titleKnown("analyst"), true);
  assert.equal(titleLane("administrator"), "post");
  assert.equal(titleStamp("administrator"), "ATOR");
  assert.equal(titleHue("administrator"), "graphite");
  assert.equal(titleLane("sales_manager"), "pair");
  assert.equal(titleStamp("sales_manager"), "AGER");
  assert.equal(titleKnown("sales_manager"), true);
  assert.equal(titleLeap("sales_head"), true);
  assert.equal(titleLane("head of sales"), "rail");
  assert.equal(titleWide("head of sales"), true);
  assert.equal(titleSlash("owner/ceo"), true);
  assert.equal(titleLane("owner/ceo"), "pair");
  assert.equal(titleNotch("it-specialist"), true);
  assert.equal(titleTwin("committee"), true);
  assert.equal(titleLeap("committee"), true);
  assert.equal(titleLane("committee"), "post");
  assert.equal(titleEcho("Anna"), true);
  assert.equal(titleCap("Analyst"), true);
  assert.equal(titleTail("sale"), true);
  assert.equal(titleState("12"), "clear");
  assert.equal(titleState(""), "clear");
  assert.equal(titleState({ jobTitle: "analyst", balance: 1 }), "");
  assert.equal(titleState({ code: "HOUSE" }), "");
  assert.equal(titleLane({ title: "administrator" }), "post");

  const book = [
    { id: "1", label: "Ada", note: "analyst" },
    { id: "2", label: "Bea", note: "administrator" },
    { id: "3", label: "Cem", note: "sales_manager" },
  ];
  assert.equal(leadingTitle(book), "chip");
  assert.match(titleLanesCsv(book), /chip,1/);
  assert.match(titleRowsCsv(book, ["1"]), /analyst,LYST,chip,champagne/);
  assert.match(titleRowsCsv(book, ["1"]), /administrator,ATOR,post,graphite/);
  assert.match(titleRowsCsv(book, ["1"]), /sales_manager,AGER,pair/);

  const keys = Object.keys(ROUND262_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND262_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND262_COPY[locale][key as keyof typeof ROUND262_COPY.en], "string");
      assert.ok(ROUND262_COPY[locale][key as keyof typeof ROUND262_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "lrdTitle"), ROUND262_COPY.tr.lrdTitle);
  assert.equal(crmv4Text("de", "ttlTitle"), ROUND262_COPY.de.ttlTitle);
  assert.equal(crmv4Text("ru", "lrdSub"), ROUND262_COPY.ru.lrdSub);
  assert.equal(crmv4Text("ar", "ttlSub"), ROUND262_COPY.ar.ttlSub);
  assert.equal(crmv4Text("en", "lrdLogo"), "7FX");
  assert.equal(crmv4Text("en", "lrdTitle"), "Larder slips");
  assert.notEqual(ROUND262_COPY.tr.lrdTitle, ROUND262_COPY.en.lrdTitle);
  assert.equal(crmv4Text("en", "srmTitle"), "Stillroom slips");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-lrd/);
  assert.match(css, /\.c4-ttl-index/);
  assert.match(css, /\.c4-lrd-ledger/);
  assert.match(css, /\.c4-ttl-bar/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round262.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /jobTitle/);
  assert.match(viewFile, /larderCsv/);
  assert.match(viewFile, /titleRowsCsv/);
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
  assert.match(viewFile, /suggestGrain/);
  assert.match(viewFile, /c4-ttl-search/);
  assert.match(viewFile, /larderTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lrd"/);
  assert.match(app, /view === "ttl"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND262_COPY.en, key);
  const audit = viewFile.match(/"(lrdAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND262_COPY.en, key);
  console.log("crmv4 round262 tests passed");
}

main();
