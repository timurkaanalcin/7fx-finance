/**
 * Apse alcoves and browser crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round210.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND210_COPY } from "../src/lib/crmv4/copy-round210";
import {
  activeLamp,
  activePew,
  activeWait,
  addAlcove,
  addAlcoveTag,
  addAlcoveView,
  adjacentAlcoveCount,
  alcovesCsv,
  busiestKeeper,
  callLoad,
  catalogCrest,
  catalogCrestCount,
  clashPewCount,
  clothOf,
  crestBand,
  crestOf,
  crestRowsCsv,
  crestState,
  crestTone,
  crestsCsv,
  cycleHush,
  densityOf,
  fairKeeper,
  giltCrestCount,
  giltLoad,
  giltOf,
  houseCloth,
  lampClashCount,
  lampOf,
  lateAlcove,
  lateShare,
  leadingCrest,
  leadingCrestTone,
  moveFocus,
  nextAlcove,
  pairKeeperCount,
  peakPew,
  pewGap,
  pewOf,
  pewSpan,
  quietHouseCount,
  quietPew,
  readAlcoveViews,
  setAlcoveGilt,
  sharedCrestCount,
  soonAlcove,
  suggestCloth,
  suggestKeeper,
  suggestLamp,
  usedPews,
  visibleCrestCustomers,
  waitOf,
  wideCrestCount,
  windowAlcoves,
} from "../src/lib/crmv4/round210";

function main() {
  assert.equal(clothOf("  linen "), "LINEN");
  assert.equal(clothOf("slate"), "SLATE");
  assert.equal(clothOf("champagne"), "CHAMPAGNE");
  assert.equal(clothOf("   "), "");
  assert.equal(clothOf("ivory"), "");
  assert.equal(pewOf("1"), 1);
  assert.equal(pewOf(6), 6);
  assert.equal(pewOf("6"), 6);
  assert.equal(pewOf("0"), null);
  assert.equal(pewOf(0), null);
  assert.equal(pewOf("7"), null);
  assert.equal(pewOf("06"), null);
  assert.equal(pewOf(""), null);
  assert.equal(pewOf(1.5), null);
  assert.equal(lampOf("2"), 2);
  assert.equal(lampOf(4), 4);
  assert.equal(lampOf("8"), 8);
  assert.equal(lampOf("5"), null);
  assert.equal(lampOf("08"), null);
  assert.equal(waitOf("15"), 15);
  assert.equal(waitOf(30), 30);
  assert.equal(waitOf("60"), 60);
  assert.equal(waitOf("20"), null);
  assert.equal(waitOf("015"), null);
  assert.equal(giltOf("0"), 0);
  assert.equal(giltOf(2), 2);
  assert.equal(giltOf("4"), 4);
  assert.equal(giltOf("1"), null);
  assert.equal(peakPew(2), true);
  assert.equal(peakPew(6), true);
  assert.equal(peakPew(3), false);
  assert.equal(quietPew(1), true);
  assert.equal(quietPew(5), true);
  assert.equal(quietPew(2), false);
  assert.equal(pewGap(1, 6), 5);
  assert.equal(pewGap(6, 1), -5);
  assert.equal(pewGap(null, 3), null);
  assert.equal(pewGap(1, 0), null);
  assert.equal(houseCloth("linen"), true);
  assert.equal(houseCloth("CHAMPAGNE"), true);
  assert.equal(houseCloth("slate"), false);
  assert.equal(activePew("peak"), "peak");
  assert.equal(activePew("6"), "6");
  assert.equal(activePew("7"), "all");
  assert.equal(activeLamp("4"), "4");
  assert.equal(activeLamp("5"), "all");
  assert.equal(activeWait("blank"), "blank");
  assert.equal(activeWait("20"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);

  const first = addAlcove([], {
    id: "a",
    title: "  North pew ",
    note: "quiet",
    keeper: "Ada",
    pew: "1",
    cloth: "linen",
    hush: "hush",
    lamp: "2",
    wait: "15",
    tags: "a b g z",
    gilt: "2",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North pew");
  assert.equal(first[0].cloth, "LINEN");
  assert.equal(first[0].pew, 1);
  assert.equal(first[0].lamp, 2);
  assert.equal(first[0].wait, 15);
  assert.deepEqual(first[0].tags, ["a", "b"]);
  assert.equal(first[0].gilt, 2);
  assert.equal(first[0].audit, "save");
  assert.equal(addAlcove(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addAlcove(first, { id: "b", title: "North pew" }).length, 1);
  assert.equal(addAlcove(first, { id: "c", title: "   " }).length, 1);
  const voiced = cycleHush(first, "a");
  assert.equal(voiced[0].hush, "talk");
  assert.equal(cycleHush(voiced, "a")[0].hush, "call");
  const tagged = addAlcoveTag(first, "a", "c");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  assert.equal(addAlcoveTag(tagged, "a", "d")[0].tags.length, 3);
  assert.equal(addAlcoveTag(first, "a", "g")[0].tags.length, 2);
  assert.equal(setAlcoveGilt(first, "a", 0)[0].gilt, 0);
  assert.equal(setAlcoveGilt(first, "a", 1)[0].gilt, 2);

  const desk = addAlcove(addAlcove(addAlcove(addAlcove([], {
    id: "late",
    title: "Late",
    keeper: "Ada",
    pew: 1,
    cloth: "linen",
    hush: "hush",
    lamp: 4,
    wait: 30,
  }), {
    id: "due",
    title: "Due",
    keeper: "Bo",
    pew: 5,
    cloth: "linen",
    hush: "talk",
    lamp: 4,
    wait: 15,
  }), {
    id: "near",
    title: "Near",
    keeper: "Ada",
    pew: 4,
    cloth: "linen",
    hush: "call",
    lamp: 2,
    wait: 60,
  }), {
    id: "peak",
    title: "Peak",
    keeper: "Cy",
    pew: 6,
    cloth: "slate",
    hush: "hush",
    lamp: 8,
    wait: 30,
    gilt: 4,
  });
  assert.equal(lateAlcove(desk.find((row) => row.id === "late")!, 6), true);
  assert.equal(lateAlcove(desk.find((row) => row.id === "near")!, 6), false);
  assert.equal(soonAlcove(desk.find((row) => row.id === "due")!), true);
  assert.equal(soonAlcove(desk.find((row) => row.id === "peak")!), false);
  assert.equal(windowAlcoves(desk, 6).map((row) => row.id).join(","), "due");
  assert.equal(clashPewCount(desk), 0);
  assert.equal(lampClashCount(desk), 2);
  assert.equal(adjacentAlcoveCount(desk), 0);
  assert.equal(pairKeeperCount(desk), 2);
  assert.equal(quietHouseCount(desk), 2);
  assert.equal(callLoad(desk), 1);
  assert.equal(giltLoad(desk), 4);
  assert.equal(pewSpan(desk), 5);
  assert.equal(usedPews(desk), 4);
  assert.equal(suggestCloth(desk), "CHAMPAGNE");
  assert.equal(suggestLamp(desk), 2);
  assert.equal(suggestKeeper(desk), "Cy");
  assert.equal(fairKeeper(desk, "Ada, Bo"), "Bo");
  assert.equal(busiestKeeper(desk), "Ada");
  assert.equal(nextAlcove(desk, 6), "late");
  assert.equal(nextAlcove(desk, 5), "due");
  assert.equal(lateShare(desk, 6), 25);
  const views = addAlcoveView([], {
    id: "v1",
    name: "Quiet",
    tray: "open",
    query: "",
    keeper: "all",
    cloth: "LINEN",
    hush: "all",
    pew: "quiet",
    lamp: "all",
    wait: "all",
  });
  assert.equal(readAlcoveViews(views)[0].pew, "quiet");
  const sheet = alcovesCsv(desk, 6);
  assert.match(sheet, /Late,Ada,1,LINEN,hush,4,30/);
  assert.match(sheet, /Late,Ada,1,LINEN,hush,4,30,,0,0,0,0,5,1,0,1,0,,save/);
  assert.match(sheet, /Due,Bo,5,LINEN,talk,4,15,,0,0,0,0,1,0,1,1,1,,save/);

  const rows = [
    { id: "1", label: "Ada", note: { lastBrowser: "chrome" } },
    { id: "2", label: "Bo", note: { lastBrowser: "safari" } },
    { id: "3", label: "Cy", note: { lastBrowser: "firefox" } },
    { id: "4", label: "Dee", note: { lastBrowser: "edge" } },
    { id: "5", label: "Eve", note: { lastBrowser: "opera" } },
    { id: "6", label: "Fay", note: { lastBrowser: null } },
    { id: "7", label: "Gus", note: { lastBrowser: "chromium" } },
    { id: "8", label: "Hua", note: { lastBrowser: "vivaldi" } },
    { id: "9", label: "Ivo", note: { lastBrowser: "chrome", balance: 1 } },
    { id: "10", label: "Jo", note: { lastBrowser: "Chrome 120" } },
  ];
  assert.equal(crestOf(rows[0].note), "CE");
  assert.equal(crestOf({ lastBrowser: "e" }), "E");
  assert.equal(crestOf(rows[1].note), "SI");
  assert.equal(crestOf(rows[2].note), "FX");
  assert.equal(crestOf(rows[3].note), "EE");
  assert.equal(crestOf(rows[4].note), "OA");
  assert.equal(crestOf(rows[5].note), "");
  assert.equal(crestState(rows[5].note), "clear");
  assert.equal(crestState(rows[8].note), "");
  assert.equal(crestBand(rows[0].note), "bright");
  assert.equal(crestBand(rows[1].note), "ivory");
  assert.equal(crestBand(rows[2].note), "ember");
  assert.equal(crestBand(rows[3].note), "slate");
  assert.equal(crestBand(rows[6].note), "bright");
  assert.equal(crestBand(rows[7].note), "plain");
  assert.equal(crestTone(rows[0].note), "gilt");
  assert.equal(crestTone(rows[1].note), "ink");
  assert.equal(crestTone(rows[2].note), "ivory");
  assert.equal(crestTone(rows[3].note), "mist");
  assert.equal(crestTone(rows[4].note), "plain");
  assert.equal(catalogCrest(rows[0].note), true);
  assert.equal(catalogCrest(rows[6].note), false);
  assert.equal(catalogCrestCount(rows), 6);
  assert.equal(wideCrestCount(rows), 1);
  assert.equal(giltCrestCount(rows), 3);
  assert.equal(sharedCrestCount(rows), 2);
  assert.equal(leadingCrest(rows), "bright");
  assert.equal(leadingCrestTone(rows), "gilt");
  const catalogOnly = visibleCrestCustomers(rows, null, null, "", "all", [], "catalog");
  assert.equal(catalogOnly.length, 6);
  const countSheet = crestsCsv(rows);
  assert.match(countSheet, /band,bright,3/);
  assert.match(countSheet, /catalog,catalog,6/);
  assert.match(countSheet, /wide,wide,1/);
  const rowSheet = crestRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,CE,bright,gilt,1,0,1/);
  assert.match(rowSheet, /Fay,,blank,,0,0,0/);
  assert.match(rowSheet, /Ivo,,,,0,0,0/);

  const keys = Object.keys(ROUND210_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND210_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND210_COPY[locale][key as keyof typeof ROUND210_COPY.en], "string");
      assert.ok(ROUND210_COPY[locale][key as keyof typeof ROUND210_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "apsTitle"), ROUND210_COPY.tr.apsTitle);
  assert.equal(crmv4Text("de", "brcTitle"), ROUND210_COPY.de.brcTitle);
  assert.equal(crmv4Text("ru", "apsSub"), ROUND210_COPY.ru.apsSub);
  assert.equal(crmv4Text("ar", "brcSub"), ROUND210_COPY.ar.brcSub);
  assert.equal(crmv4Text("en", "apsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-aps/);
  assert.match(css, /\.c4-brc-index/);
  assert.match(css, /\.c4-cust-apse/);
  assert.match(css, /\.c4-pagehead-apse/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round210.tsx"), "utf8");
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
  assert.match(viewFile, /lastBrowser/);
  assert.match(viewFile, /alcovesCsv/);
  assert.match(viewFile, /crestsCsv/);
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
  assert.match(viewFile, /data-alcoves/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "apal"/);
  assert.match(app, /view === "brcr"/);
  assert.match(app, /ApseAlcoves/);
  assert.match(app, /BrowserCrests/);
  assert.match(app, /c4-pagehead-apse/);
  assert.match(app, /c4-rail-apse/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-apse/);
  assert.match(customers, /c4-cust-apse-index/);
  assert.match(customers, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND210_COPY.en, key);
  console.log("crmv4 round210 tests passed");
}

main();
