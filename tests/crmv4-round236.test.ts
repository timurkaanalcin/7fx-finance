/**
 * Refectory slips and dialect marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round236.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND236_COPY } from "../src/lib/crmv4/copy-round236";
import {
  activeBell,
  activeBench,
  activeRank,
  activeTemper,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  benchBand,
  benchGap,
  benchOf,
  bellOf,
  coolingSlip,
  cycleTemper,
  dialectLane,
  dialectRowsCsv,
  dialectSigil,
  dialectState,
  dialectStep,
  dialectTone,
  dialectsCsv,
  fairSlipSteward,
  grainOf,
  houseGrain,
  joinedDialect,
  lateSlip,
  leadingDialect,
  moveSlipFocus,
  peakBench,
  quietBench,
  rankOf,
  readSlipViews,
  setSlipRank,
  setSlipWax,
  sharedDialectCount,
  slipsCsv,
  snoozeSlip,
  suggestBell,
  suggestGrain,
  wideDialect,
} from "../src/lib/crmv4/round236";

function main() {
  assert.equal(grainOf("  rye "), "RYE");
  assert.equal(grainOf("barley"), "BARLEY");
  assert.equal(grainOf("wheat"), "WHEAT");
  assert.equal(grainOf("oak"), "");
  assert.equal(benchOf("2"), 2);
  assert.equal(benchOf(6), 6);
  assert.equal(benchOf("0"), null);
  assert.equal(benchOf("7"), null);
  assert.equal(bellOf("10"), 10);
  assert.equal(bellOf(20), 20);
  assert.equal(bellOf("40"), 40);
  assert.equal(bellOf("4"), null);
  assert.equal(rankOf("0"), 0);
  assert.equal(rankOf(2), 2);
  assert.equal(rankOf("5"), 5);
  assert.equal(rankOf("1"), null);
  assert.equal(peakBench(1), true);
  assert.equal(peakBench(4), true);
  assert.equal(peakBench(3), false);
  assert.equal(quietBench(5), true);
  assert.equal(quietBench(6), false);
  assert.equal(benchBand(2), "early");
  assert.equal(benchBand(4), "mid");
  assert.equal(benchBand(6), "late");
  assert.equal(benchGap(1, 4), 3);
  assert.equal(benchGap(4, 1), -3);
  assert.equal(benchGap(null, 4), null);
  assert.equal(houseGrain("rye"), true);
  assert.equal(houseGrain("WHEAT"), true);
  assert.equal(houseGrain("barley"), false);
  assert.equal(activeBench("peak"), "peak");
  assert.equal(activeBench("6"), "6");
  assert.equal(activeBench("7"), "all");
  assert.equal(activeBell("40"), "40");
  assert.equal(activeBell("4"), "all");
  assert.equal(activeTemper("even", ["cool", "even", "hot"]), "even");
  assert.equal(activeTemper("hush", ["cool", "even", "hot"]), "all");
  assert.equal(activeRank("2"), "2");
  assert.equal(activeRank("1"), "all");
  assert.equal(moveSlipFocus(0, 3, 1), 1);
  assert.equal(moveSlipFocus(0, 3, -1), 2);
  assert.equal(suggestGrain([]), "RYE");
  assert.equal(suggestBell([]), 20);
  assert.equal(fairSlipSteward([], "Ada, Bea"), "Ada");

  const first = addSlip([], {
    id: "a",
    title: "  North slip ",
    note: "quiet",
    steward: "Ada",
    bench: "2",
    grain: "rye",
    temper: "cool",
    bell: "10",
    tags: "a b c d q",
    rank: "2",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North slip");
  assert.equal(first[0].grain, "RYE");
  assert.equal(first[0].bench, 2);
  assert.equal(first[0].bell, 10);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].rank, 2);
  assert.equal(first[0].wax, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addSlip(first, { id: "b", title: "   " }).length, 1);
  const raised = setSlipRank(first, "a", "5");
  assert.equal(raised[0].rank, 5);
  assert.equal(raised[0].audit, "rank");
  const waxed = setSlipWax(first, "a", true);
  assert.equal(waxed[0].wax, true);
  assert.equal(waxed[0].audit, "wax");
  const snoozed = snoozeSlip(first, "a");
  assert.equal(snoozed[0].bell, 20);
  assert.equal(snoozeSlip(snoozed, "a")[0].bell, 40);
  assert.equal(snoozeSlip(snoozeSlip(snoozed, "a"), "a")[0].bell, 40);
  const paced = cycleTemper(first, "a");
  assert.equal(paced[0].temper, "even");
  const tagged = addSlipTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const views = addSlipView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    steward: "all",
    grain: "all",
    temper: "all",
    bench: "peak",
    bell: "all",
    rank: "all",
  });
  assert.equal(readSlipViews(views).length, 1);
  const late = addSlip(addSlip([], { id: "a", title: "Late bench", bench: "1", rank: "0" }), { id: "b", title: "Near bench", bench: "3", rank: "0" });
  assert.equal(lateSlip(late.find((card) => card.id === "a")!, 4), true);
  assert.equal(lateSlip(late.find((card) => card.id === "b")!, 4), false);
  const cooling = addSlip([], { id: "c", title: "Cooling bench", bench: "5", temper: "hot", rank: "0" });
  assert.equal(coolingSlip(cooling[0]), true);
  assert.equal(coolingSlip({ ...cooling[0], temper: "even" }), false);
  assert.equal(coolingSlip({ ...cooling[0], bench: 4 }), false);
  const far = addSlip(addSlip([], { id: "n1", title: "Far bench", bench: "1", rank: "0" }), { id: "n2", title: "Third bench", bench: "3", rank: "0" });
  assert.equal(adjacentSlipCount(far), 2);
  const close = addSlip(addSlip([], { id: "n3", title: "Near bench two", bench: "1", rank: "0" }), { id: "n4", title: "Fourth bench", bench: "4", rank: "0" });
  assert.equal(adjacentSlipCount(close), 0);

  assert.equal(dialectState("hello"), "set");
  assert.equal(dialectState({ name: "  " }), "clear");
  assert.equal(dialectState({ name: "Ada", tongue: "en", land: "Turkey", deposits: 4 }), "");
  assert.equal(dialectSigil({ name: "North desk" }), "ND");
  assert.equal(dialectSigil({ name: "One two three" }), "OT");
  assert.equal(dialectLane({ name: "Desk 4", tongue: "en" }), "glyph");
  assert.equal(dialectLane({ name: "Ada Lane", tongue: "en" }), "house");
  assert.equal(dialectLane({ name: "Ada Lane", tongue: "de" }), "desk");
  assert.equal(dialectLane({ name: "Ada Lane", tongue: "fr" }), "guest");
  assert.equal(dialectLane({ name: "Ada Lane", tongue: "english" }), "scroll");
  assert.equal(dialectLane({ name: "Ada Lane", tongue: "" }), "hall");
  assert.equal(dialectTone({ name: "Ada", tongue: "en" }), "gilt");
  assert.equal(dialectTone({ name: "Ada", tongue: "xx" }), "ash");
  assert.equal(dialectTone({ name: "Ada", tongue: "fr", land: "france" }), "linen");
  assert.equal(dialectTone({ name: "Ada", tongue: "fr", land: "TR" }), "pale");
  assert.equal(dialectTone({ name: "Ada", tongue: "fr", land: "" }), "haze");
  assert.equal(joinedDialect({ name: "North&desk" }), true);
  assert.equal(joinedDialect({ name: "North+desk" }), false);
  assert.equal(wideDialect({ name: "Ada" }), false);
  assert.equal(wideDialect({ name: "North desk" }), true);
  assert.equal(dialectStep(""), 0);
  assert.equal(dialectStep("Ada"), 1);
  assert.equal(dialectStep("North desk"), 2);
  assert.equal(dialectStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { name: "North desk", tongue: "", land: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", tongue: "en", land: "TR" } },
    { id: "3", label: "Desk 4", note: { name: "Desk 4", tongue: "de", land: "" } },
  ];
  assert.equal(leadingDialect(book), "house");
  assert.equal(sharedDialectCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { name: "North door", tongue: "" } },
  ];
  assert.equal(sharedDialectCount(paired), 2);
  assert.match(dialectsCsv(book), /glyph,1/);
  assert.match(dialectRowsCsv(book, ["2"]), /Ada Lane,AL,house,gilt,2,0,0,0,0,0,1,0,0,1/);
  assert.match(slipsCsv(first, 3), /North slip,Ada,2,RYE,cool,10,2,a b c,0,0,0,0,1,0,0,1,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND236_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND236_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND236_COPY[locale][key as keyof typeof ROUND236_COPY.en], "string");
      assert.ok(ROUND236_COPY[locale][key as keyof typeof ROUND236_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "rfsTitle"), ROUND236_COPY.tr.rfsTitle);
  assert.equal(crmv4Text("de", "dlgTitle"), ROUND236_COPY.de.dlgTitle);
  assert.equal(crmv4Text("ru", "rfsSub"), ROUND236_COPY.ru.rfsSub);
  assert.equal(crmv4Text("ar", "dlgSub"), ROUND236_COPY.ar.dlgSub);
  assert.equal(crmv4Text("en", "rslLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rfs/);
  assert.match(css, /\.c4-dlg-index/);
  assert.match(css, /\.c4-goals-refectory/);
  assert.match(css, /\.c4-goals-gallery\.c4-goals-refectory/);
  assert.match(css, /\.c4-agenda-refectory/);
  assert.match(css, /\.c4-agenda-refectory-search/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round236.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /country/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /dialectsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-dialects/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGrain/);
  assert.match(viewFile, /c4-dlg-search/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rsl"/);
  assert.match(app, /view === "dlg"/);
  assert.match(app, /RefectorySlips/);
  assert.match(app, /DialectMarks/);
  const goals = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round25.tsx"), "utf8");
  assert.match(goals, /c4-goals-gallery/);
  assert.match(goals, /c4-goals-refectory/);
  assert.match(goals, /c4-goals-gallery-index/);
  assert.match(goals, /data-desk="refectory"/);
  assert.match(goals, /data-logo="mono"/);
  const agenda = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round33.tsx"), "utf8");
  assert.match(agenda, /c4-agenda-gallery/);
  assert.match(agenda, /c4-agenda-refectory/);
  assert.match(agenda, /c4-agenda-gallery-mast/);
  assert.match(agenda, /c4-agenda-refectory-search/);
  assert.match(agenda, /data-desk="refectory"/);
  assert.match(agenda, /data-logo="mono"/);
  assert.match(agenda, /rsl/);
  assert.match(agenda, /dlg/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND236_COPY.en, key);
  const audit = viewFile.match(/"(rslAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND236_COPY.en, key);
  console.log("crmv4 round236 tests passed");
}

main();
