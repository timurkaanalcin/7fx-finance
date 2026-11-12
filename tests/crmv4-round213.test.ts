/**
 * Narthex candles and address plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round213.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND213_COPY } from "../src/lib/crmv4/copy-round213";
import {
  activeHour,
  activeTone,
  activeWick,
  addCandle,
  addCandleMark,
  addCandleView,
  adjacentCandleCount,
  busiestKeeper,
  catalogPlate,
  catalogPlateCount,
  clashHourCount,
  cycleTone,
  densityOf,
  dripLoad,
  dripOf,
  fairKeeper,
  giltPlateCount,
  hourGap,
  hourOf,
  hourSpan,
  houseWax,
  lateCandle,
  lateShare,
  leadingPlate,
  leadingPlateTone,
  moveFocus,
  nextCandle,
  pairKeeperCount,
  peakHour,
  plateCopy,
  plateLane,
  plateOf,
  plateRowsCsv,
  plateState,
  plateTone,
  platesCsv,
  quietHour,
  quietHouseCount,
  readCandleViews,
  setCandleDrip,
  sharedPlateCount,
  sharedWaxCount,
  snoozeCandle,
  soonCandle,
  strikeLoad,
  suggestKeeper,
  suggestWax,
  suggestWick,
  usedHours,
  visiblePlateCustomers,
  waxOf,
  wickClashCount,
  wickOf,
  widePlateCount,
  windowCandles,
  candlesCsv,
} from "../src/lib/crmv4/round213";

function main() {
  assert.equal(waxOf("  bees "), "BEES");
  assert.equal(waxOf("tallow"), "TALLOW");
  assert.equal(waxOf("gilt"), "GILT");
  assert.equal(waxOf("   "), "");
  assert.equal(waxOf("gold"), "");
  assert.equal(hourOf("1"), 1);
  assert.equal(hourOf(8), 8);
  assert.equal(hourOf("8"), 8);
  assert.equal(hourOf("0"), null);
  assert.equal(hourOf(0), null);
  assert.equal(hourOf("9"), null);
  assert.equal(hourOf("08"), null);
  assert.equal(hourOf(""), null);
  assert.equal(hourOf(1.5), null);
  assert.equal(wickOf("4"), 4);
  assert.equal(wickOf(8), 8);
  assert.equal(wickOf("16"), 16);
  assert.equal(wickOf("2"), null);
  assert.equal(wickOf("04"), null);
  assert.equal(dripOf("0"), 0);
  assert.equal(dripOf(2), 2);
  assert.equal(dripOf("6"), 6);
  assert.equal(dripOf("1"), null);
  assert.equal(peakHour(4), true);
  assert.equal(peakHour(8), true);
  assert.equal(peakHour(3), false);
  assert.equal(quietHour(1), true);
  assert.equal(quietHour(2), true);
  assert.equal(quietHour(4), false);
  assert.equal(hourGap(1, 8), 7);
  assert.equal(hourGap(8, 1), -7);
  assert.equal(hourGap(null, 3), null);
  assert.equal(hourGap(1, 0), null);
  assert.equal(houseWax("bees"), true);
  assert.equal(houseWax("GILT"), true);
  assert.equal(houseWax("tallow"), false);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("8"), "8");
  assert.equal(activeHour("9"), "all");
  assert.equal(activeWick("8"), "8");
  assert.equal(activeWick("2"), "all");
  assert.equal(activeTone("ring", ["hush", "ring", "strike"]), "ring");
  assert.equal(activeTone("nope", ["hush", "ring", "strike"]), "all");
  assert.equal(densityOf("low"), "low");
  assert.equal(densityOf("nope"), "tall");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);

  const first = addCandle([], {
    id: "a",
    title: "  North walk ",
    note: "quiet",
    keeper: "Ada",
    hour: "1",
    wax: "bees",
    tone: "hush",
    wick: "8",
    marks: "a b c z",
    drip: "2",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North walk");
  assert.equal(first[0].wax, "BEES");
  assert.equal(first[0].hour, 1);
  assert.equal(first[0].wick, 8);
  assert.deepEqual(first[0].marks, ["a", "b", "c"]);
  assert.equal(first[0].drip, 2);
  assert.equal(first[0].audit, "save");
  assert.equal(addCandle(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCandle(first, { id: "b", title: "North walk" }).length, 1);
  assert.equal(addCandle(first, { id: "c", title: "   " }).length, 1);
  const voiced = cycleTone(first, "a");
  assert.equal(voiced[0].tone, "ring");
  assert.equal(cycleTone(voiced, "a")[0].tone, "strike");
  assert.equal(cycleTone(cycleTone(voiced, "a"), "a")[0].tone, "hush");
  assert.equal(addCandleMark(first, "a", "d")[0].marks.length, 3);
  assert.equal(addCandleMark(first, "a", "a")[0].marks.length, 3);
  assert.equal(setCandleDrip(first, "a", 0)[0].drip, 0);
  assert.equal(setCandleDrip(first, "a", 1)[0].drip, 2);
  const snoozed = snoozeCandle([{ ...first[0], wick: null }], "a");
  assert.equal(snoozed[0].wick, 4);
  assert.equal(snoozeCandle(snoozed, "a")[0].wick, 8);
  assert.equal(snoozeCandle(snoozeCandle(snoozed, "a"), "a")[0].wick, 16);
  assert.equal(snoozeCandle(snoozeCandle(snoozeCandle(snoozed, "a"), "a"), "a")[0].wick, 16);

  const desk = addCandle(addCandle(addCandle(addCandle([], {
    id: "late",
    title: "Late",
    keeper: "Ada",
    hour: 1,
    wax: "bees",
    tone: "hush",
    wick: 8,
  }), {
    id: "due",
    title: "Due",
    keeper: "Bo",
    hour: 4,
    wax: "bees",
    tone: "ring",
    wick: 4,
  }), {
    id: "near",
    title: "Near",
    keeper: "Ada",
    hour: 6,
    wax: "gilt",
    tone: "strike",
    wick: 16,
  }), {
    id: "peak",
    title: "Peak",
    keeper: "Cy",
    hour: 8,
    wax: "tallow",
    tone: "hush",
    wick: 8,
    drip: 2,
  });
  assert.equal(lateCandle(desk.find((row) => row.id === "late")!, 8), true);
  assert.equal(soonCandle(desk.find((row) => row.id === "due")!), true);
  assert.equal(lateShare(desk, 8) > 0, true);
  assert.equal(suggestWax([]), "TALLOW");
  assert.equal(suggestWick([]), 8);
  assert.equal(suggestKeeper(desk), "Cy");
  assert.equal(fairKeeper(desk, "Ada, Bo, Cy"), "Bo");
  assert.equal(busiestKeeper(desk), "Ada");
  assert.equal(usedHours(desk), 4);
  assert.equal(clashHourCount(desk), 0);
  assert.equal(wickClashCount(desk), 2);
  assert.equal(adjacentCandleCount(desk), 2);
  assert.equal(pairKeeperCount(desk), 2);
  assert.equal(sharedWaxCount(desk), 2);
  assert.equal(dripLoad(desk), 2);
  assert.equal(quietHouseCount(desk), 1);
  assert.equal(strikeLoad(desk), 1);
  assert.equal(hourSpan(desk), 7);
  assert.equal(nextCandle(desk, 6), "late");
  assert.equal(windowCandles(desk, 6).some((row) => row.id === "due"), true);
  const sheet = candlesCsv(desk, 8);
  assert.match(sheet, /title,keeper,hour/);
  assert.match(sheet, /Late,Ada,1,BEES/);
  const saved = addCandleView([], {
    id: "v1",
    name: "Open bees",
    tray: "open",
    query: "",
    keeper: "all",
    wax: "bees",
    tone: "all",
    hour: "all",
    wick: "all",
    drip: "all",
  });
  assert.equal(readCandleViews(saved).length, 1);

  assert.equal(plateOf("Palace quay"), "PAL");
  assert.equal(plateOf("Gallery walk"), "GAL");
  assert.equal(plateOf("a"), "A");
  assert.equal(plateLane("quay"), "east");
  assert.equal(plateLane("gallery"), "center");
  assert.equal(plateLane("atelier"), "west");
  assert.equal(plateTone("palace quay"), "gilt");
  assert.equal(plateTone("gallery walk"), "ink");
  assert.equal(plateTone("cloister nave"), "ivory");
  assert.equal(plateTone("lane court"), "mist");
  assert.equal(plateTone("baker street"), "plain");
  assert.equal(catalogPlate("palace"), true);
  assert.equal(catalogPlate("baker"), false);
  assert.equal(plateState({ language: "en", address: "palace" }), "");
  assert.equal(plateState({ address: null }), "clear");
  assert.equal(plateState({ address: "Palace quay" }), "set");
  assert.equal(plateCopy("United Arab Emirates"), "unitedarabemirates");

  const rows = [
    { id: "1", label: "Ada", note: { address: "Palace quay" } },
    { id: "2", label: "Bo", note: { address: "Gallery walk" } },
    { id: "3", label: "Cy", note: { address: "Quay house" } },
    { id: "4", label: "Fay", note: { address: null } },
    { id: "5", label: "Ivo", note: { language: "en" } },
    { id: "6", label: "Ned", note: "Cloister nave extra" },
  ];
  assert.equal(catalogPlateCount(rows), 4);
  assert.equal(widePlateCount(rows), 1);
  assert.equal(giltPlateCount(rows), 2);
  assert.equal(sharedPlateCount(rows), 0);
  assert.equal(leadingPlate(rows), "center");
  assert.equal(leadingPlateTone(rows), "gilt");
  assert.equal(visiblePlateCustomers(rows, "center", null, "ada", "all", [], "all").length, 1);
  const counts = platesCsv(rows);
  assert.match(counts, /lane,center,2/);
  assert.match(counts, /catalog,catalog,4/);
  const rowSheet = plateRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,PAL,center,gilt,1,0,1/);
  assert.match(rowSheet, /Fay,,blank,,0,0,0/);

  const keys = Object.keys(ROUND213_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND213_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND213_COPY[locale][key as keyof typeof ROUND213_COPY.en], "string");
      assert.ok(ROUND213_COPY[locale][key as keyof typeof ROUND213_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "nxcTitle"), ROUND213_COPY.tr.nxcTitle);
  assert.equal(crmv4Text("de", "adrTitle"), ROUND213_COPY.de.adrTitle);
  assert.equal(crmv4Text("ru", "nxcSub"), ROUND213_COPY.ru.nxcSub);
  assert.equal(crmv4Text("ar", "adrSub"), ROUND213_COPY.ar.adrSub);
  assert.equal(crmv4Text("en", "nxcLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nxc/);
  assert.match(css, /\.c4-adr-index/);
  assert.match(css, /\.c4-logs-narthex/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round213.tsx"), "utf8");
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
  assert.match(viewFile, /address/);
  assert.match(viewFile, /candlesCsv/);
  assert.match(viewFile, /platesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-candles/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWax/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "nxcd"/);
  assert.match(app, /view === "adpl"/);
  assert.match(app, /NarthexCandles/);
  assert.match(app, /AddressPlates/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-narthex/);
  assert.match(logs, /c4-logs-index/);
  assert.match(logs, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND213_COPY.en, key);
  console.log("crmv4 round213 tests passed");
}

main();
