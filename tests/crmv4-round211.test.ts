/**
 * Transept stalls and account wafers.
 * Run: TZ=UTC npx tsx tests/crmv4-round211.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND211_COPY } from "../src/lib/crmv4/copy-round211";
import {
  activeBay,
  activeBell,
  activeSpan,
  addStall,
  addStallMark,
  addStallView,
  adjacentStallCount,
  bayGap,
  bayOf,
  baySpan,
  bellOf,
  busiestSteward,
  catalogWafer,
  catalogWaferCount,
  clashBayCount,
  cycleCadence,
  densityOf,
  fairSteward,
  giltWaferCount,
  houseWeave,
  lateShare,
  lateStall,
  leadingWafer,
  leadingWaferTone,
  moveFocus,
  nextStall,
  pairStewardCount,
  peakBay,
  quietBay,
  quietHouseCount,
  readStallViews,
  setStallWax,
  sharedWaferCount,
  soonStall,
  spanClashCount,
  spanOf,
  stallsCsv,
  suggestSpan,
  suggestSteward,
  suggestWeave,
  usedBays,
  visitLoad,
  visibleWaferCustomers,
  waferBand,
  waferCopy,
  waferOf,
  waferRowsCsv,
  waferState,
  waferTone,
  wafersCsv,
  waxLoad,
  waxOf,
  weaveOf,
  wideWaferCount,
  windowStalls,
} from "../src/lib/crmv4/round211";

function main() {
  assert.equal(weaveOf("  ivory "), "IVORY");
  assert.equal(weaveOf("graphite"), "GRAPHITE");
  assert.equal(weaveOf("gold"), "GOLD");
  assert.equal(weaveOf("   "), "");
  assert.equal(weaveOf("slate"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("8"), 8);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("9"), null);
  assert.equal(bayOf("08"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(spanOf("1"), 1);
  assert.equal(spanOf(3), 3);
  assert.equal(spanOf("5"), 5);
  assert.equal(spanOf("4"), null);
  assert.equal(spanOf("01"), null);
  assert.equal(bellOf("5"), 5);
  assert.equal(bellOf(10), 10);
  assert.equal(bellOf("20"), 20);
  assert.equal(bellOf("15"), null);
  assert.equal(bellOf("05"), null);
  assert.equal(waxOf("0"), 0);
  assert.equal(waxOf(1), 1);
  assert.equal(waxOf("3"), 3);
  assert.equal(waxOf("5"), 5);
  assert.equal(waxOf("2"), null);
  assert.equal(peakBay(3), true);
  assert.equal(peakBay(7), true);
  assert.equal(peakBay(4), false);
  assert.equal(quietBay(2), true);
  assert.equal(quietBay(8), true);
  assert.equal(quietBay(3), false);
  assert.equal(bayGap(1, 8), 7);
  assert.equal(bayGap(8, 1), -7);
  assert.equal(bayGap(null, 3), null);
  assert.equal(bayGap(1, 0), null);
  assert.equal(houseWeave("ivory"), true);
  assert.equal(houseWeave("GOLD"), true);
  assert.equal(houseWeave("graphite"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("8"), "8");
  assert.equal(activeBay("9"), "all");
  assert.equal(activeSpan("3"), "3");
  assert.equal(activeSpan("4"), "all");
  assert.equal(activeBell("blank"), "blank");
  assert.equal(activeBell("15"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);

  const first = addStall([], {
    id: "a",
    title: "  North bay ",
    note: "quiet",
    steward: "Ada",
    bay: "1",
    weave: "ivory",
    cadence: "note",
    span: "1",
    bell: "5",
    marks: "p q v z",
    wax: "1",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North bay");
  assert.equal(first[0].weave, "IVORY");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].span, 1);
  assert.equal(first[0].bell, 5);
  assert.deepEqual(first[0].marks, ["p", "q"]);
  assert.equal(first[0].wax, 1);
  assert.equal(first[0].audit, "save");
  assert.equal(addStall(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addStall(first, { id: "b", title: "North bay" }).length, 1);
  assert.equal(addStall(first, { id: "c", title: "   " }).length, 1);
  const voiced = cycleCadence(first, "a");
  assert.equal(voiced[0].cadence, "ping");
  assert.equal(cycleCadence(voiced, "a")[0].cadence, "visit");
  assert.equal(addStallMark(first, "a", "r")[0].marks.length, 2);
  assert.equal(addStallMark(first, "a", "a")[0].marks.length, 2);
  assert.equal(setStallWax(first, "a", 0)[0].wax, 0);
  assert.equal(setStallWax(first, "a", 2)[0].wax, 1);

  const desk = addStall(addStall(addStall(addStall([], {
    id: "late",
    title: "Late",
    steward: "Ada",
    bay: 1,
    weave: "ivory",
    cadence: "note",
    span: 3,
    bell: 10,
  }), {
    id: "due",
    title: "Due",
    steward: "Bo",
    bay: 5,
    weave: "ivory",
    cadence: "ping",
    span: 3,
    bell: 5,
  }), {
    id: "near",
    title: "Near",
    steward: "Ada",
    bay: 6,
    weave: "gold",
    cadence: "visit",
    span: 1,
    bell: 20,
  }), {
    id: "peak",
    title: "Peak",
    steward: "Cy",
    bay: 7,
    weave: "graphite",
    cadence: "note",
    span: 5,
    bell: 10,
    wax: 1,
  });
  assert.equal(lateStall(desk[3], 6), true);
  assert.equal(soonStall(desk.find((row) => row.id === "due")!), true);
  assert.equal(lateShare(desk, 6) > 0, true);
  assert.equal(suggestWeave([]), "GRAPHITE");
  assert.equal(suggestSpan([]), 3);
  assert.equal(suggestSteward(desk), "Cy");
  assert.equal(fairSteward(desk, "Ada, Bo, Cy"), "Bo");
  assert.equal(busiestSteward(desk), "Ada");
  assert.equal(usedBays(desk), 4);
  assert.equal(clashBayCount(desk), 0);
  assert.ok(spanClashCount(desk) >= 2);
  assert.equal(adjacentStallCount(desk) >= 0, true);
  assert.equal(pairStewardCount(desk), 2);
  assert.equal(waxLoad(desk), 1);
  assert.equal(quietHouseCount(desk) >= 0, true);
  assert.equal(visitLoad(desk), 1);
  assert.equal(baySpan(desk), 6);
  assert.equal(nextStall(desk, 5), "due");
  assert.equal(windowStalls(desk, 5).some((row) => row.id === "due"), true);
  const sheet = stallsCsv(desk, 6);
  assert.match(sheet, /title,steward,bay/);
  assert.match(sheet, /Late,Ada,1,IVORY/);
  const saved = addStallView([], {
    id: "v1",
    name: "Open ivory",
    tray: "open",
    query: "",
    steward: "all",
    weave: "ivory",
    cadence: "all",
    bay: "all",
    span: "all",
    bell: "all",
  });
  assert.equal(readStallViews(saved).length, 1);

  assert.equal(waferOf("Standard"), "SD");
  assert.equal(waferOf("Gold"), "GD");
  assert.equal(waferOf("a"), "A");
  assert.equal(waferBand("standard"), "house");
  assert.equal(waferBand("silver"), "silver");
  assert.equal(waferBand("gold"), "gilt");
  assert.equal(waferBand("vip"), "gilt");
  assert.equal(waferBand("premium"), "gilt");
  assert.equal(waferBand("demo"), "demo");
  assert.equal(waferBand("test"), "demo");
  assert.equal(waferBand("edge"), "plain");
  assert.equal(waferTone("gold"), "gilt");
  assert.equal(waferTone("vip"), "gilt");
  assert.equal(waferTone("silver"), "ink");
  assert.equal(waferTone("standard"), "ivory");
  assert.equal(waferTone("demo"), "mist");
  assert.equal(waferTone("edge"), "plain");
  assert.equal(catalogWafer("standard"), true);
  assert.equal(catalogWafer("premium"), false);
  assert.equal(waferState({ language: "en", accountType: "gold" }), "");
  assert.equal(waferState({ accountType: null }), "clear");
  assert.equal(waferState({ accountType: "Gold" }), "set");
  assert.equal(waferCopy("Standard Plus Extra"), "standardplusextr");

  const rows = [
    { id: "1", label: "Ada", note: { accountType: "Standard" } },
    { id: "2", label: "Bo", note: { accountType: "standard" } },
    { id: "3", label: "Cy", note: { accountType: "Gold" } },
    { id: "4", label: "Fay", note: { accountType: null } },
    { id: "5", label: "Ivo", note: { language: "en" } },
    { id: "6", label: "Ned", note: "premiumaccount" },
  ];
  assert.equal(catalogWaferCount(rows), 3);
  assert.equal(wideWaferCount(rows), 1);
  assert.equal(giltWaferCount(rows), 1);
  assert.equal(sharedWaferCount(rows), 2);
  assert.equal(leadingWafer(rows), "house");
  assert.equal(leadingWaferTone(rows), "ivory");
  assert.equal(visibleWaferCustomers(rows, "house", null, "ada", "all", [], "all").length, 1);
  const counts = wafersCsv(rows);
  assert.match(counts, /band,house,2/);
  assert.match(counts, /catalog,catalog,3/);
  const rowSheet = waferRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,SD,house,ivory,1,0,1/);
  assert.match(rowSheet, /Fay,,blank,,0,0,0/);

  const keys = Object.keys(ROUND211_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND211_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND211_COPY[locale][key as keyof typeof ROUND211_COPY.en], "string");
      assert.ok(ROUND211_COPY[locale][key as keyof typeof ROUND211_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "trsTitle"), ROUND211_COPY.tr.trsTitle);
  assert.equal(crmv4Text("de", "acwTitle"), ROUND211_COPY.de.acwTitle);
  assert.equal(crmv4Text("ru", "trsSub"), ROUND211_COPY.ru.trsSub);
  assert.equal(crmv4Text("ar", "acwSub"), ROUND211_COPY.ar.acwSub);
  assert.equal(crmv4Text("en", "trsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-trs/);
  assert.match(css, /\.c4-acw-index/);
  assert.match(css, /\.c4-logs-transept/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round211.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.equal(viewFile.includes("saleStatus"), false);
  assert.equal(viewFile.includes("retentionStatus"), false);
  assert.equal(viewFile.includes("potentialStatus"), false);
  assert.equal(viewFile.includes("documentsStatus"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.equal(viewFile.includes("lastBrowser"), false);
  assert.match(viewFile, /accountType/);
  assert.match(viewFile, /stallsCsv/);
  assert.match(viewFile, /wafersCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-stalls/);
  assert.match(viewFile, /data-wafers/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWeave/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "trst"/);
  assert.match(app, /view === "acwf"/);
  assert.match(app, /TranseptStalls/);
  assert.match(app, /AccountWafers/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-transept/);
  assert.match(logs, /c4-logs-index/);
  assert.match(logs, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND211_COPY.en, key);
  console.log("crmv4 round211 tests passed");
}

main();
