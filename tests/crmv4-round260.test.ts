/**
 * Greenhouse slips and dial plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round260.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND260_COPY } from "../src/lib/crmv4/copy-round260";
import {
  ROUND260_FEATURES,
  activeClimate,
  activeHerb,
  activePlot,
  activeRank,
  activeSpan,
  addSlip,
  addSlipView,
  bulkSlipPin,
  busiestKeeper,
  climateOf,
  cycleClimate,
  dialEcho,
  dialHue,
  dialLane,
  dialLanesCsv,
  dialLeap,
  dialNotch,
  dialPlus,
  dialRowsCsv,
  dialSpoken,
  dialStamp,
  dialState,
  dialStep,
  dialWide,
  dropSlipView,
  fairKeeper,
  galeSlip,
  herbOf,
  houseHerb,
  idleSlip,
  lateSlip,
  leadingDial,
  lengthenSpan,
  lowerRank,
  moveSlipFocus,
  neighborSlipCount,
  overdueSlip,
  plotBand,
  plotGap,
  plotOf,
  quietPlot,
  raiseRank,
  rankOf,
  readSlipViews,
  restingSlip,
  shortenSpan,
  slipCsv,
  slipTimeline,
  spanOf,
  suggestHerb,
  suggestSpan,
  peakPlot,
} from "../src/lib/crmv4/round260";

function main() {
  assert.equal(ROUND260_FEATURES.length, 25);
  assert.equal(plotOf(" path "), "path");
  assert.equal(plotOf("paris"), "");
  assert.equal(spanOf("5"), 5);
  assert.equal(spanOf(15), 15);
  assert.equal(spanOf("45"), 45);
  assert.equal(spanOf("9"), null);
  assert.equal(rankOf("2"), 2);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("6"), 6);
  assert.equal(rankOf("8"), 8);
  assert.equal(rankOf("1"), null);
  assert.equal(herbOf("mint"), "MINT");
  assert.equal(herbOf("sage"), "SAGE");
  assert.equal(herbOf("bay"), "BAY");
  assert.equal(herbOf("clay"), "");
  assert.equal(climateOf("dew"), "dew");
  assert.equal(climateOf("sun"), "sun");
  assert.equal(climateOf("gale"), "gale");
  assert.equal(climateOf("hush"), "");
  assert.equal(peakPlot("path"), true);
  assert.equal(peakPlot("GLASS"), true);
  assert.equal(peakPlot("bed"), false);
  assert.equal(quietPlot("bed"), true);
  assert.equal(quietPlot("pot"), true);
  assert.equal(quietPlot("path"), false);
  assert.equal(plotBand("bed"), "early");
  assert.equal(plotBand("path"), "early");
  assert.equal(plotBand("glass"), "mid");
  assert.equal(plotBand("pot"), "late");
  assert.equal(plotBand(""), "");
  assert.equal(plotGap("bed", "path"), 1);
  assert.equal(plotGap("path", "bed"), -1);
  assert.equal(plotGap("", "bed"), null);
  assert.equal(houseHerb("mint"), true);
  assert.equal(houseHerb("SAGE"), true);
  assert.equal(houseHerb("bay"), false);
  assert.equal(activePlot("peak"), "peak");
  assert.equal(activePlot("path"), "path");
  assert.equal(activePlot("paris"), "all");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("9"), "all");
  assert.equal(activeClimate("sun", ["dew", "sun", "gale"]), "sun");
  assert.equal(activeClimate("hush", ["dew", "sun", "gale"]), "all");
  assert.equal(activeRank("6"), "6");
  assert.equal(activeRank("1"), "all");
  assert.equal(activeHerb("sage"), "sage");
  assert.equal(activeHerb("clay"), "all");
  assert.equal(moveSlipFocus(0, 3, 1), 1);
  assert.equal(moveSlipFocus(0, 3, -1), 2);
  assert.equal(suggestHerb([]), "MINT");
  assert.equal(suggestSpan([], 4), 5);
  assert.equal(suggestSpan([], 12), 15);
  assert.equal(suggestSpan([], 19), 45);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addSlip([], {
    id: "a",
    title: "  North path ",
    note: "",
    keeper: "Ada",
    place: "path",
    herb: "mint",
    climate: "dew",
    span: 5,
    rank: 2,
    tags: "p p q",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North path");
  assert.equal(first[0].note, "");
  assert.equal(first[0].herb, "MINT");
  assert.equal(first[0].tags.join(""), "pq");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueSlip(first[0]), true);
  assert.equal(addSlip(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "North path" }).length, 1);
  assert.equal(addSlip(first, { id: "b", title: "   " }).length, 1);

  const pinned = bulkSlipPin(first, ["a"]);
  assert.equal(overdueSlip(pinned[0]), false);
  assert.equal(fairKeeper(pinned, "Ada, Bea"), "Ada");
  const quiet = addSlip(pinned, { id: "q", title: "Bed rest", keeper: "Bea", place: "bed", climate: "dew", rank: 2 });
  assert.equal(idleSlip(quiet[0]), true);
  assert.equal(lateSlip(quiet[0], "path"), false);
  const behind = addSlip([], { id: "z", title: "Bed late", place: "bed", rank: 2 });
  assert.equal(lateSlip(behind[0], "pot"), true);
  assert.equal(lateSlip({ ...behind[0], rank: 4 }, "pot"), false);
  const rushed = addSlip([], { id: "r", title: "Path gale", place: "path", climate: "gale", rank: 8 });
  assert.equal(galeSlip(rushed[0]), true);
  const rested = addSlip([], { id: "s", title: "Pot sun", place: "pot", climate: "sun", span: 45 });
  assert.equal(restingSlip(rested[0]), true);
  assert.equal(lengthenSpan(rested, "s")[0].span, 45);
  assert.equal(lengthenSpan([{ ...rested[0], span: null }], "s")[0].span, 5);
  assert.equal(lengthenSpan(first, "a")[0].span, 15);
  assert.equal(shortenSpan(first, "a")[0].span, 5);
  assert.equal(shortenSpan([{ ...first[0], span: null }], "a")[0].span, 45);
  assert.equal(cycleClimate(first, "a")[0].climate, "sun");
  assert.equal(raiseRank(first, "a")[0].rank, 4);
  assert.equal(lowerRank(first, "a")[0].rank, 2);
  assert.equal(lowerRank([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestKeeper(quiet), "Bea");
  assert.equal(neighborSlipCount(quiet) >= 0, true);
  assert.match(slipCsv(first, "pot"), /North path/);
  assert.match(slipTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const bayBook = addSlip(addSlip([], { id: "y1", title: "Bay one", herb: "bay", place: "bed" }), { id: "y2", title: "Bay two", herb: "bay", place: "path" });
  assert.equal(suggestHerb(bayBook), "BAY");
  assert.equal(suggestSpan(rested, 4), 45);

  const views = addSlipView([], { id: "v", name: "Peak", tray: "row", place: "peak", span: "5", herb: "mint", climate: "dew", rank: "2" });
  assert.equal(views[0].place, "peak");
  assert.equal(dropSlipView(views, "v").length, 0);
  assert.equal(readSlipViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "row");

  assert.equal(dialState("+90 555 111 22 33"), "set");
  assert.equal(dialLane("+90 555 111 22 33"), "hall");
  assert.equal(dialStamp("+90 555 111 22 33"), "2233");
  assert.equal(dialHue("+90 555 111 22 33"), "champagne");
  assert.equal(dialStep("+90 555 111 22 33"), 12);
  assert.equal(dialPlus("+90 555 111 22 33"), true);
  assert.equal(dialWide("+90 555 111 22 33"), true);
  assert.equal(dialSpoken("+90 555 111 22 33"), true);
  assert.equal(dialLeap("+90 555 111 22 33"), false);
  assert.equal(dialNotch("+90 555 111 22 33"), false);
  assert.equal(dialHue("1234321"), "ivory");
  assert.equal(dialEcho("1234321"), true);
  assert.equal(dialSpoken("1234567"), false);
  assert.equal(dialSpoken("1123456"), true);
  assert.equal(dialLane("555-0100"), "brief");
  assert.equal(dialWide("555-0100"), true);
  assert.equal(dialPlus("555-0100"), false);
  assert.equal(dialNotch("(555) 010-0199"), true);
  assert.equal(dialLeap("(555) 010-0199"), true);
  assert.equal(dialLane("(555) 010-0199"), "desk");
  assert.equal(dialHue("4567890123"), "graphite");
  assert.equal(dialState("4444"), "clear");
  assert.equal(dialState("1234567890123456"), "clear");
  assert.equal(dialState(""), "clear");
  assert.equal(dialState("paris"), "clear");
  assert.equal(dialState({ phone: "1234567", balance: 1 }), "");
  assert.equal(dialState({ code: "HOUSE" }), "");
  assert.equal(dialLane({ phone: "4567890123" }), "desk");

  const book = [
    { id: "1", label: "Ada", note: "+90 555 111 22 33" },
    { id: "2", label: "Bea", note: "555-0100" },
    { id: "3", label: "Cem", note: "(555) 010-0199" },
  ];
  assert.equal(leadingDial(book), "brief");
  assert.match(dialLanesCsv(book), /brief,1/);
  assert.match(dialRowsCsv(book, ["1"]), /\+905551112233,2233,hall,champagne/);
  assert.match(dialRowsCsv(book, ["1"]), /5550100,0100,brief,graphite/);
  assert.match(dialRowsCsv(book, ["1"]), /5550100199,0199,desk,graphite/);

  const keys = Object.keys(ROUND260_COPY.en);
  assert.ok(keys.length >= 160);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND260_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND260_COPY[locale][key as keyof typeof ROUND260_COPY.en], "string");
      assert.ok(ROUND260_COPY[locale][key as keyof typeof ROUND260_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "ghsTitle"), ROUND260_COPY.tr.ghsTitle);
  assert.equal(crmv4Text("de", "dlpTitle"), ROUND260_COPY.de.dlpTitle);
  assert.equal(crmv4Text("ru", "ghsSub"), ROUND260_COPY.ru.ghsSub);
  assert.equal(crmv4Text("ar", "dlpSub"), ROUND260_COPY.ar.dlpSub);
  assert.equal(crmv4Text("en", "ghsLogo"), "7FX");
  assert.equal(crmv4Text("en", "ghsTitle"), "Greenhouse slips");
  assert.notEqual(ROUND260_COPY.tr.ghsTitle, ROUND260_COPY.en.ghsTitle);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ghs/);
  assert.match(css, /\.c4-dlp-index/);
  assert.match(css, /\.c4-goals-greenhouse/);
  assert.match(css, /\.c4-aff-greenhouse/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round260.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /slipCsv/);
  assert.match(viewFile, /dialRowsCsv/);
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
  assert.match(viewFile, /suggestHerb/);
  assert.match(viewFile, /c4-dlp-search/);
  assert.match(viewFile, /slipTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ghs"/);
  assert.match(app, /view === "dlp"/);
  const goals = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round25.tsx"), "utf8");
  const affiliates = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round45.tsx"), "utf8");
  assert.match(goals, /c4-goals-greenhouse/);
  assert.match(goals, /glGreenLead/);
  assert.match(goals, /data-logo="mono"/);
  assert.match(goals, /data-desk="refectory"/);
  assert.match(affiliates, /c4-aff-greenhouse/);
  assert.match(affiliates, /afGreenLead/);
  assert.match(affiliates, /data-logo="mono"/);
  assert.match(affiliates, /c4-aff-aisle/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND260_COPY.en, key);
  const audit = viewFile.match(/"(ghsAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND260_COPY.en, key);
  const salon = `${goals}\n${affiliates}`.match(/"((?:glGreen|afGreen)[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of salon) assert.ok(key in ROUND260_COPY.en, key);
  console.log("crmv4 round260 tests passed");
}

main();
