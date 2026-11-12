/**
 * Nave benches and language ribbons.
 * Run: TZ=UTC npx tsx tests/crmv4-round209.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND209_COPY } from "../src/lib/crmv4/copy-round209";
import {
  activeBay,
  activeSpan,
  activeWatch,
  addBench,
  addBenchTag,
  addBenchView,
  adjacentBenchCount,
  bayGap,
  bayOf,
  baySpan,
  benchesCsv,
  bulkBenchVoice,
  bulkBenchWeave,
  busiestKeeper,
  catalogRibbon,
  catalogRibbonCount,
  clashBayCount,
  cycleVoice,
  densityOf,
  fairKeeper,
  fullLoad,
  giltLoad,
  giltOf,
  giltRibbonCount,
  houseWeave,
  lateBench,
  lateShare,
  leadingRibbon,
  leadingRibbonTone,
  moveFocus,
  nextBench,
  pairKeeperCount,
  peakBay,
  quietBay,
  quietHouseCount,
  readBenchViews,
  ribbonBand,
  ribbonOf,
  ribbonRowsCsv,
  ribbonState,
  ribbonTone,
  ribbonsCsv,
  setBenchGilt,
  sharedRibbonCount,
  soonBench,
  spanClashCount,
  spanOf,
  suggestKeeper,
  suggestWatch,
  suggestWeave,
  usedBays,
  visibleBenches,
  visibleRibbonCustomers,
  watchOf,
  weaveOf,
  wideRibbonCount,
  windowBenches,
} from "../src/lib/crmv4/round209";

function main() {
  assert.equal(weaveOf("  ivory "), "IVORY");
  assert.equal(weaveOf("graphite"), "GRAPHITE");
  assert.equal(weaveOf("gold"), "GOLD");
  assert.equal(weaveOf("   "), "");
  assert.equal(weaveOf("linen"), "");
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("8"), 8);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf(0), null);
  assert.equal(bayOf("9"), null);
  assert.equal(bayOf("08"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf(1.5), null);
  assert.equal(spanOf("5"), 5);
  assert.equal(spanOf(10), 10);
  assert.equal(spanOf("20"), 20);
  assert.equal(spanOf("4"), null);
  assert.equal(spanOf("05"), null);
  assert.equal(watchOf("20"), 20);
  assert.equal(watchOf(45), 45);
  assert.equal(watchOf("90"), 90);
  assert.equal(watchOf("15"), null);
  assert.equal(watchOf("020"), null);
  assert.equal(giltOf("0"), 0);
  assert.equal(giltOf(1), 1);
  assert.equal(giltOf("3"), 3);
  assert.equal(giltOf("2"), null);
  assert.equal(peakBay(3), true);
  assert.equal(peakBay(8), true);
  assert.equal(peakBay(4), false);
  assert.equal(quietBay(1), true);
  assert.equal(quietBay(4), true);
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
  assert.equal(activeSpan("10"), "10");
  assert.equal(activeSpan("4"), "all");
  assert.equal(activeWatch("blank"), "blank");
  assert.equal(activeWatch("15"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);

  const first = addBench([], {
    id: "a",
    title: "  North bay ",
    note: "quiet",
    keeper: "Ada",
    bay: "1",
    weave: "ivory",
    voice: "soft",
    span: "5",
    watch: "20",
    tags: "m n s z",
    gilt: "1",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North bay");
  assert.equal(first[0].weave, "IVORY");
  assert.equal(first[0].bay, 1);
  assert.equal(first[0].span, 5);
  assert.equal(first[0].watch, 20);
  assert.deepEqual(first[0].tags, ["m", "n"]);
  assert.equal(first[0].gilt, 1);
  assert.equal(first[0].audit, "save");
  assert.equal(addBench(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBench(first, { id: "b", title: "North bay" }).length, 1);
  assert.equal(addBench(first, { id: "c", title: "   " }).length, 1);
  const voiced = cycleVoice(first, "a");
  assert.equal(voiced[0].voice, "even");
  assert.equal(cycleVoice(voiced, "a")[0].voice, "full");
  const tagged = addBenchTag(first, "a", "o");
  assert.deepEqual(tagged[0].tags, ["m", "n", "o"]);
  assert.equal(addBenchTag(tagged, "a", "p")[0].tags.length, 3);
  assert.equal(addBenchTag(first, "a", "g")[0].tags.length, 2);
  assert.equal(setBenchGilt(first, "a", 0)[0].gilt, 0);
  assert.equal(setBenchGilt(first, "a", 2)[0].gilt, 1);

  const desk = addBench(addBench(addBench(addBench([], {
    id: "late",
    title: "Late",
    keeper: "Ada",
    bay: 1,
    weave: "ivory",
    voice: "soft",
    span: 10,
    watch: 45,
  }), {
    id: "due",
    title: "Due",
    keeper: "Bo",
    bay: 4,
    weave: "ivory",
    voice: "even",
    span: 10,
    watch: 20,
  }), {
    id: "near",
    title: "Near",
    keeper: "Ada",
    bay: 5,
    weave: "ivory",
    voice: "full",
    span: 5,
    watch: 90,
  }), {
    id: "peak",
    title: "Peak",
    keeper: "Cy",
    bay: 8,
    weave: "graphite",
    voice: "soft",
    span: 20,
    watch: 45,
    gilt: 3,
  });
  assert.equal(lateBench(desk[3], 8), true);
  assert.equal(lateBench(desk.find((row) => row.id === "near")!, 8), false);
  assert.equal(soonBench(desk.find((row) => row.id === "due")!), true);
  assert.equal(soonBench(desk.find((row) => row.id === "peak")!), false);
  assert.equal(windowBenches(desk, 8).some((row) => row.id === "near"), true);
  assert.equal(windowBenches(desk, 8).some((row) => row.id === "late"), false);
  assert.equal(usedBays(desk), 4);
  assert.equal(clashBayCount(desk), 0);
  assert.equal(spanClashCount(desk), 2);
  assert.equal(adjacentBenchCount(desk), 2);
  assert.equal(pairKeeperCount(desk), 2);
  assert.equal(giltLoad(desk), 3);
  assert.equal(quietHouseCount(desk), 2);
  assert.equal(fullLoad(desk), 1);
  assert.equal(baySpan(desk), 7);
  assert.equal(lateShare(desk, 8) > 0, true);
  assert.equal(suggestWeave([]), "GRAPHITE");
  assert.equal(suggestWatch([]), 45);
  assert.equal(suggestKeeper(desk), "Cy");
  assert.equal(fairKeeper(desk, "Ada, Bo, Dee"), "Dee");
  assert.equal(busiestKeeper(desk), "Ada");
  assert.equal(nextBench(desk, 6), "late");
  assert.equal(nextBench(desk, 2), "due");
  const onlyFull = visibleBenches(desk, "open", "", null, null, null, null, null, null, null, true, false, false, false, false);
  assert.equal(onlyFull.length, 1);
  assert.equal(onlyFull[0].id, "near");
  const voicedBulk = bulkBenchVoice(desk, ["late", "due"], "full");
  assert.equal(voicedBulk.find((row) => row.id === "late")?.voice, "full");
  assert.equal(bulkBenchWeave(desk, ["late"], "slate").find((row) => row.id === "late")?.weave, "IVORY");
  const sheet = benchesCsv(desk, 8);
  assert.match(sheet, /title,keeper,bay,weave,voice,span,watch/);
  assert.match(sheet, /Late,Ada,1,IVORY,soft,10,45/);
  const saved = addBenchView([], {
    id: "v1",
    name: "Quiet",
    tray: "open",
    query: "late",
    keeper: "Ada",
    weave: "IVORY",
    voice: "soft",
    bay: "early",
    span: "10",
    watch: "45",
  });
  assert.equal(readBenchViews(saved)[0].bay, "early");
  assert.equal(addBenchView(saved, { ...saved[0], id: "v2" }).length, 1);

  const rows = [
    { id: "1", label: "Ada", note: { language: "en" } },
    { id: "2", label: "Bo", note: { language: "tr" } },
    { id: "3", label: "Cy", note: { language: "de" } },
    { id: "4", label: "Dee", note: { language: "ru" } },
    { id: "5", label: "Eve", note: { language: "en-GB" } },
    { id: "6", label: "Fay", note: { language: null } },
    { id: "7", label: "Gus", note: { language: "ar" } },
    { id: "8", label: "Hua", note: { language: "zh" } },
    { id: "9", label: "Ivo", note: { language: "en", balance: 1 } },
  ];
  assert.equal(ribbonOf(rows[0].note), "EN");
  assert.equal(ribbonOf({ language: "e" }), "E");
  assert.equal(ribbonOf(rows[5].note), "");
  assert.equal(ribbonState(rows[5].note), "clear");
  assert.equal(ribbonState(rows[8].note), "");
  assert.equal(ribbonBand(rows[0].note), "latin");
  assert.equal(ribbonBand(rows[1].note), "turkic");
  assert.equal(ribbonBand(rows[2].note), "latin");
  assert.equal(ribbonBand(rows[3].note), "cyrillic");
  assert.equal(ribbonBand(rows[6].note), "arabic");
  assert.equal(ribbonBand(rows[7].note), "plain");
  assert.equal(ribbonTone(rows[0].note), "gilt");
  assert.equal(ribbonTone(rows[1].note), "ink");
  assert.equal(ribbonTone(rows[2].note), "ivory");
  assert.equal(ribbonTone(rows[3].note), "mist");
  assert.equal(ribbonTone(rows[6].note), "plain");
  assert.equal(catalogRibbon(rows[0].note), true);
  assert.equal(catalogRibbon(rows[4].note), false);
  assert.equal(catalogRibbonCount(rows), 5);
  assert.equal(wideRibbonCount(rows), 1);
  assert.equal(giltRibbonCount(rows), 2);
  assert.equal(sharedRibbonCount(rows), 2);
  assert.equal(leadingRibbon(rows), "latin");
  assert.equal(leadingRibbonTone(rows), "gilt");
  const catalogOnly = visibleRibbonCustomers(rows, null, null, "", "all", [], "catalog");
  assert.equal(catalogOnly.length, 5);
  const countSheet = ribbonsCsv(rows);
  assert.match(countSheet, /band,latin,3/);
  assert.match(countSheet, /catalog,catalog,5/);
  assert.match(countSheet, /wide,wide,1/);
  const rowSheet = ribbonRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,EN,latin,gilt,1,0,1/);
  assert.match(rowSheet, /Fay,,blank,,0,0,0/);
  assert.match(rowSheet, /Ivo,,,,0,0,0/);

  const keys = Object.keys(ROUND209_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND209_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND209_COPY[locale][key as keyof typeof ROUND209_COPY.en], "string");
      assert.ok(ROUND209_COPY[locale][key as keyof typeof ROUND209_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "nvbTitle"), ROUND209_COPY.tr.nvbTitle);
  assert.equal(crmv4Text("de", "lnrTitle"), ROUND209_COPY.de.lnrTitle);
  assert.equal(crmv4Text("ru", "nvbSub"), ROUND209_COPY.ru.nvbSub);
  assert.equal(crmv4Text("ar", "lnrSub"), ROUND209_COPY.ar.lnrSub);
  assert.equal(crmv4Text("en", "nvbLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nvb/);
  assert.match(css, /\.c4-lnr-index/);
  assert.match(css, /\.c4-fin-nave/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round209.tsx"), "utf8");
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
  assert.equal(viewFile.includes("accountType"), false);
  assert.equal(viewFile.includes("validationStatus"), false);
  assert.equal(viewFile.includes("registrationDate"), false);
  assert.equal(viewFile.includes("birthDate"), false);
  assert.equal(viewFile.includes("lastContactAt"), false);
  assert.equal(viewFile.includes("assigneeId"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /benchesCsv/);
  assert.match(viewFile, /ribbonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-benches/);
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWeave/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nvbn"/);
  assert.match(app, /view === "lnrb"/);
  assert.match(app, /NaveBenches/);
  assert.match(app, /LanguageRibbons/);
  const finance = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Finance.tsx"), "utf8");
  assert.match(finance, /c4-fin-nave/);
  assert.match(finance, /c4-fin-nave-index/);
  assert.match(finance, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND209_COPY.en, key);
  console.log("crmv4 round209 tests passed");
}

main();
