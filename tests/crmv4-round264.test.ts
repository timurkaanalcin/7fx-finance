/**
 * Pastry slips and cipher plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round264.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND264_COPY } from "../src/lib/crmv4/copy-round264";
import {
  ROUND264_FEATURES,
  activePastryRank,
  activePastryWait,
  activeBench,
  activeGlaze,
  activePace,
  addPastry,
  addPastryView,
  briskPastry,
  bulkPastryPin,
  busiestPastryBaker,
  pastryCsv,
  pastryRank,
  pastryTimeline,
  pastryWait,
  benchBand,
  benchGap,
  benchOf,
  cyclePace,
  dropPastryView,
  fairPastryBaker,
  glazeOf,
  houseGlaze,
  idlePastry,
  latePastry,
  leadingCipher,
  lengthenPastry,
  lowerPastry,
  movePastryFocus,
  neighborPastryCount,
  overduePastry,
  peakBench,
  paceOf,
  quietBench,
  raisePastry,
  readPastryViews,
  restingPastry,
  shortenPastry,
  cipherCap,
  cipherEcho,
  cipherHue,
  cipherKnown,
  cipherLane,
  cipherLanesCsv,
  cipherLeap,
  cipherNotch,
  cipherRowsCsv,
  cipherSlash,
  cipherStamp,
  cipherState,
  cipherStep,
  cipherTail,
  cipherTwin,
  cipherWide,
  suggestPastryWait,
  suggestBench,
  suggestGlaze,
} from "../src/lib/crmv4/round264";

function main() {
  assert.equal(ROUND264_FEATURES.length, 25);
  assert.equal(benchOf(" hearth "), "hearth");
  assert.equal(benchOf("paris"), "");
  assert.equal(pastryWait("15"), 15);
  assert.equal(pastryWait(30), 30);
  assert.equal(pastryWait("45"), 45);
  assert.equal(pastryWait("12"), null);
  assert.equal(pastryRank("1"), 1);
  assert.equal(pastryRank(3), 3);
  assert.equal(pastryRank("5"), 5);
  assert.equal(pastryRank("7"), 7);
  assert.equal(pastryRank("2"), null);
  assert.equal(glazeOf("sugar"), "SUGAR");
  assert.equal(glazeOf("butter"), "BUTTER");
  assert.equal(glazeOf("cocoa"), "COCOA");
  assert.equal(glazeOf("oat"), "");
  assert.equal(paceOf("fold"), "fold");
  assert.equal(paceOf("whip"), "whip");
  assert.equal(paceOf("rest"), "rest");
  assert.equal(paceOf("brisk"), "");
  assert.equal(peakBench("slab"), true);
  assert.equal(peakBench("HEARTH"), true);
  assert.equal(peakBench("peel"), false);
  assert.equal(quietBench("peel"), true);
  assert.equal(quietBench("loft"), true);
  assert.equal(quietBench("slab"), false);
  assert.equal(benchBand("slab"), "early");
  assert.equal(benchBand("peel"), "early");
  assert.equal(benchBand("hearth"), "mid");
  assert.equal(benchBand("loft"), "late");
  assert.equal(benchBand(""), "");
  assert.equal(benchGap("slab", "peel"), 1);
  assert.equal(benchGap("peel", "slab"), -1);
  assert.equal(benchGap("", "slab"), null);
  assert.equal(houseGlaze("sugar"), true);
  assert.equal(houseGlaze("COCOA"), true);
  assert.equal(houseGlaze("butter"), false);
  assert.equal(activeBench("peak"), "peak");
  assert.equal(activeBench("slab"), "slab");
  assert.equal(activeBench("paris"), "all");
  assert.equal(activePastryWait("30"), "30");
  assert.equal(activePastryWait("9"), "all");
  assert.equal(activePace("whip", ["fold", "whip", "rest"]), "whip");
  assert.equal(activePace("gale", ["fold", "whip", "rest"]), "all");
  assert.equal(activePastryRank("5"), "5");
  assert.equal(activePastryRank("2"), "all");
  assert.equal(activeGlaze("butter"), "butter");
  assert.equal(activeGlaze("mint"), "all");
  assert.equal(movePastryFocus(0, 3, 1), 1);
  assert.equal(movePastryFocus(0, 3, -1), 2);
  assert.equal(suggestGlaze([]), "SUGAR");
  assert.equal(suggestPastryWait([], 4), 15);
  assert.equal(suggestPastryWait([], 8), 30);
  assert.equal(suggestPastryWait([], 16), 45);
  assert.equal(suggestBench(4), "slab");
  assert.equal(suggestBench(12), "hearth");
  assert.equal(fairPastryBaker([], "Ada, Bea"), "Ada");

  const first = addPastry([], {
    id: "a",
    title: "  North vault ",
    note: "",
    baker: "Ada",
    bench: "slab",
    glaze: "sugar",
    pace: "fold",
    wait: 15,
    rank: 1,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North vault");
  assert.equal(first[0].note, "");
  assert.equal(first[0].glaze, "SUGAR");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overduePastry(first[0]), true);
  assert.equal(addPastry(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addPastry(first, { id: "b", title: "North vault" }).length, 1);
  assert.equal(addPastry(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkPastryPin(first, ["a"]);
  assert.equal(overduePastry(pinned[0]), false);
  assert.equal(fairPastryBaker(pinned, "Ada, Bea"), "Ada");
  const quiet = addPastry(pinned, { id: "q", title: "Peel rest", baker: "Bea", bench: "peel", pace: "fold", rank: 1 });
  assert.equal(idlePastry(quiet[0]), true);
  assert.equal(latePastry(quiet[0], "slab"), false);
  assert.equal(latePastry(quiet[0], "hearth"), false);
  const behind = addPastry([], { id: "z", title: "Peel late", bench: "peel", rank: 1 });
  assert.equal(latePastry(behind[0], "loft"), true);
  assert.equal(latePastry({ ...behind[0], rank: 3 }, "loft"), false);
  const rushed = addPastry([], { id: "r", title: "Slab spark", bench: "slab", pace: "whip", rank: 7 });
  assert.equal(briskPastry(rushed[0]), true);
  const rested = addPastry([], { id: "s", title: "Loft cask", bench: "loft", pace: "rest", wait: 45 });
  assert.equal(restingPastry(rested[0]), true);
  assert.equal(lengthenPastry(rested, "s")[0].wait, 45);
  assert.equal(lengthenPastry([{ ...rested[0], wait: null }], "s")[0].wait, 15);
  assert.equal(lengthenPastry(first, "a")[0].wait, 30);
  assert.equal(shortenPastry(first, "a")[0].wait, 15);
  assert.equal(shortenPastry([{ ...first[0], wait: null }], "a")[0].wait, 45);
  assert.equal(cyclePace(first, "a")[0].pace, "whip");
  assert.equal(raisePastry(first, "a")[0].rank, 3);
  assert.equal(lowerPastry(first, "a")[0].rank, 1);
  assert.equal(lowerPastry([{ ...first[0], rank: 7 }], "a")[0].rank, 5);
  assert.equal(busiestPastryBaker(quiet), "Bea");
  assert.equal(neighborPastryCount(quiet) >= 0, true);
  assert.match(pastryCsv(first, "loft"), /North vault/);
  assert.match(pastryTimeline(first).map((lane) => lane.rank).join(","), /1/);

  const greenBook = addPastry(addPastry([], { id: "y1", title: "Butter one", glaze: "butter", bench: "peel" }), { id: "y2", title: "Butter two", glaze: "butter", bench: "slab" });
  assert.equal(suggestGlaze(greenBook), "BUTTER");
  assert.equal(suggestPastryWait(rested, 4), 45);

  const views = addPastryView([], { id: "v", name: "Peak", tray: "open", bench: "peak", wait: "15", glaze: "sugar", pace: "fold", rank: "1" });
  assert.equal(views[0].bench, "peak");
  assert.equal(dropPastryView(views, "v").length, 0);
  assert.equal(readPastryViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(cipherState("CREST"), "set");
  assert.equal(cipherLane("CREST"), "crest");
  assert.equal(cipherStamp("CREST"), "CRES");
  assert.equal(cipherHue("CREST"), "champagne");
  assert.equal(cipherStep("CREST"), 5);
  assert.equal(cipherLeap("CREST"), false);
  assert.equal(cipherKnown("CREST"), true);
  assert.equal(cipherTail("CREST"), false);
  assert.equal(cipherLane("CODE"), "board");
  assert.equal(cipherStamp("CODE"), "CODE");
  assert.equal(cipherHue("CODE"), "graphite");
  assert.equal(cipherTail("CODE"), true);
  assert.equal(cipherKnown("code"), true);
  assert.equal(cipherLane("STAFF"), "mark");
  assert.equal(cipherStamp("STAFF"), "STAF");
  assert.equal(cipherHue("STAFF"), "ivory");
  assert.equal(cipherKnown("STAFF"), false);
  assert.equal(cipherLeap("CRESTX"), true);
  assert.equal(cipherLeap("CODE"), false);
  assert.equal(cipherNotch("PRE-SET"), true);
  assert.equal(cipherLane("PRE-SET"), "seam");
  assert.equal(cipherHue("PRE-SET"), "champagne");
  assert.equal(cipherSlash("A/B"), true);
  assert.equal(cipherLane("A/B"), "seam");
  assert.equal(cipherWide("PRE_SET"), true);
  assert.equal(cipherTwin("BOOK"), true);
  assert.equal(cipherEcho("RADAR"), true);
  assert.equal(cipherCap("Crest"), true);
  assert.equal(cipherCap("crest"), false);
  assert.equal(cipherLane("crest"), "crest");
  assert.equal(cipherState("12"), "clear");
  assert.equal(cipherState(""), "clear");
  assert.equal(cipherState({ affiliateC: "CREST", balance: 1 }), "");
  assert.equal(cipherState({ title: "CREST" }), "");
  assert.equal(cipherLane({ code: "CODE" }), "board");

  const book = [
    { id: "1", label: "Ada", note: "CREST" },
    { id: "2", label: "Bea", note: "CODE" },
    { id: "3", label: "Cem", note: "STAFF" },
  ];
  assert.equal(leadingCipher(book), "crest");
  assert.match(cipherLanesCsv(book), /crest,1/);
  assert.match(cipherRowsCsv(book, ["1"]), /CREST,CRES,crest,champagne/);
  assert.match(cipherRowsCsv(book, ["1"]), /CODE,CODE,board,graphite/);
  assert.match(cipherRowsCsv(book, ["1"]), /STAFF,STAF,mark,ivory/);

  const keys = Object.keys(ROUND264_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND264_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND264_COPY[locale][key as keyof typeof ROUND264_COPY.en], "string");
      assert.ok(ROUND264_COPY[locale][key as keyof typeof ROUND264_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "pstTitle"), ROUND264_COPY.tr.pstTitle);
  assert.equal(crmv4Text("de", "cphTitle"), ROUND264_COPY.de.cphTitle);
  assert.equal(crmv4Text("ru", "pstSub"), ROUND264_COPY.ru.pstSub);
  assert.equal(crmv4Text("ar", "cphSub"), ROUND264_COPY.ar.cphSub);
  assert.equal(crmv4Text("en", "pstLogo"), "7FX");
  assert.equal(crmv4Text("en", "pstTitle"), "Pastry slips");
  assert.notEqual(ROUND264_COPY.tr.pstTitle, ROUND264_COPY.en.pstTitle);
  assert.equal(crmv4Text("en", "lrdTitle"), "Larder slips");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pastry/);
  assert.match(css, /\.c4-cipher-index/);
  assert.match(css, /\.c4-pastry-ledger/);
  assert.match(css, /\.c4-cipher-bar/);
  assert.match(css, /\.c4-history-pastry/);
  assert.match(css, /\.c4-report-pastry/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round264.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /affiliateC/);
  assert.match(viewFile, /pastryCsv/);
  assert.match(viewFile, /cipherRowsCsv/);
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
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-cipher-search/);
  assert.match(viewFile, /pastryTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pst"/);
  assert.match(app, /view === "cph"/);
  const history = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round50.tsx"), "utf8");
  const reports = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round43.tsx"), "utf8");
  assert.match(history, /c4-history-pastry/);
  assert.match(reports, /c4-report-pastry/);
  assert.match(reports, /aria-label/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND264_COPY.en, key);
  const audit = viewFile.match(/"(pstAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND264_COPY.en, key);
  console.log("crmv4 round264 tests passed");
}

main();
