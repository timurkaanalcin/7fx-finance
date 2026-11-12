/**
 * Cloister stalls and system crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round208.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND208_COPY } from "../src/lib/crmv4/copy-round208";
import {
  activeCord,
  activeSeat,
  activeStay,
  addStall,
  addStallTag,
  addStallView,
  adjacentStallCount,
  brightLoad,
  busiestUsher,
  catalogCrest,
  catalogCrestCount,
  clashSeatCount,
  clothOf,
  cordClashCount,
  cordOf,
  crestBand,
  crestOf,
  crestRowsCsv,
  crestState,
  crestTone,
  crestsCsv,
  cycleTone,
  densityOf,
  editStall,
  fairUsher,
  giltCrestCount,
  giltLoad,
  giltOf,
  houseCloth,
  lateShare,
  lateStall,
  leadingCrest,
  leadingCrestTone,
  moveFocus,
  nextStall,
  pairUsherCount,
  peakSeat,
  quietHouseCount,
  quietSeat,
  readStallViews,
  seatGap,
  seatOf,
  seatSpan,
  setStallGilt,
  sharedCrestCount,
  soonStall,
  stallsCsv,
  stayOf,
  suggestCloth,
  suggestStay,
  suggestUsher,
  usedSeats,
  visibleCrestCustomers,
  visibleStalls,
  wideCrestCount,
  windowStalls,
  bulkStallCloth,
  bulkStallTone,
} from "../src/lib/crmv4/round208";

function main() {
  assert.equal(clothOf("  linen "), "LINEN");
  assert.equal(clothOf("champagne"), "CHAMPAGNE");
  assert.equal(clothOf("slate"), "SLATE");
  assert.equal(clothOf("   "), "");
  assert.equal(clothOf("ink"), "");
  assert.equal(seatOf("1"), 1);
  assert.equal(seatOf(6), 6);
  assert.equal(seatOf("6"), 6);
  assert.equal(seatOf("0"), null);
  assert.equal(seatOf(0), null);
  assert.equal(seatOf("7"), null);
  assert.equal(seatOf("06"), null);
  assert.equal(seatOf(""), null);
  assert.equal(seatOf(1.5), null);
  assert.equal(cordOf("4"), 4);
  assert.equal(cordOf(7), 7);
  assert.equal(cordOf("11"), 11);
  assert.equal(cordOf("2"), null);
  assert.equal(cordOf("04"), null);
  assert.equal(stayOf("15"), 15);
  assert.equal(stayOf(30), 30);
  assert.equal(stayOf("60"), 60);
  assert.equal(stayOf("12"), null);
  assert.equal(stayOf("015"), null);
  assert.equal(giltOf("0"), 0);
  assert.equal(giltOf(2), 2);
  assert.equal(giltOf("6"), 6);
  assert.equal(giltOf("3"), null);
  assert.equal(peakSeat(2), true);
  assert.equal(peakSeat(5), true);
  assert.equal(peakSeat(4), false);
  assert.equal(quietSeat(1), true);
  assert.equal(quietSeat(6), true);
  assert.equal(quietSeat(2), false);
  assert.equal(seatGap(1, 6), 5);
  assert.equal(seatGap(6, 1), -5);
  assert.equal(seatGap(null, 3), null);
  assert.equal(seatGap(1, 0), null);
  assert.equal(activeSeat("peak"), "peak");
  assert.equal(activeSeat("6"), "6");
  assert.equal(activeSeat("7"), "all");
  assert.equal(activeCord("11"), "11");
  assert.equal(activeCord("2"), "all");
  assert.equal(activeStay("blank"), "blank");
  assert.equal(activeStay("12"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addStall([], { id: "a", title: "Ada stall", note: "gold leaf", usher: "Nia", seat: "1", cloth: "linen", tone: "hush", cord: "11", stay: "15", tags: "g, h, i, a", gilt: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].seat, 1);
  assert.equal(saved[0].cord, 11);
  assert.equal(saved[0].stay, 15);
  assert.equal(saved[0].cloth, "LINEN");
  assert.equal(saved[0].tone, "hush");
  assert.equal(saved[0].note, "gold leaf");
  assert.deepEqual(saved[0].tags, ["g", "h"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseCloth(saved[0].cloth), true);
  assert.equal(houseCloth("SLATE"), false);
  assert.equal(soonStall(saved[0]), true);
  assert.equal(lateStall(saved[0], "4"), true);
  assert.equal(lateStall(saved[0], "3"), false);
  assert.equal(lateStall(saved[0], "1"), false);
  assert.equal(addStall(saved, { id: "b", title: "Ada stall" }).length, 1);
  assert.equal(addStall(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addStall(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((stalls, stall) => addStall(stalls, stall), [] as ReturnType<typeof addStall>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((stall) => stall.title === "Line 0"), false);
  assert.equal(capped.some((stall) => stall.title === "Line 9"), true);

  assert.equal(editStall(saved, "a", "   ")[0].title, "Ada stall");
  const edited = editStall(saved, "a", "Ada leaf");
  assert.equal(edited[0].title, "Ada leaf");
  assert.equal(edited[0].audit, "edit");
  const toned = cycleTone(saved, "a");
  assert.equal(toned[0].tone, "warm");
  assert.equal(toned[0].audit, "tone");
  assert.deepEqual(addStallTag(saved, "a", "l")[0].tags, ["g", "h"]);
  const room = addStall([], { id: "t", title: "Tag stall", tags: "g" });
  assert.deepEqual(addStallTag(room, "t", "h")[0].tags, ["g", "h"]);
  assert.deepEqual(addStallTag(room, "t", "a")[0].tags, ["g"]);
  assert.equal(addStallTag(addStallTag(room, "t", "h"), "t", "i")[0].tags.length, 2);
  const gilt = setStallGilt(saved, "a", 2);
  assert.equal(gilt[0].gilt, 2);
  assert.equal(gilt[0].audit, "gilt");
  assert.equal(soonStall(gilt[0]), false);
  assert.equal(suggestCloth([]), "SLATE");
  assert.equal(suggestStay([]), 30);
  assert.equal(suggestUsher(saved), "Nia");
  assert.equal(fairUsher(saved, "Bea, Nia"), "Bea");
  assert.equal(busiestUsher(saved), "Nia");
  assert.equal(usedSeats(saved), 1);
  assert.equal(seatSpan(saved), 0);
  assert.equal(quietHouseCount(saved), 1);
  assert.equal(brightLoad(saved), 0);

  const pair = addStall(addStall([], { id: "a", title: "A", usher: "Nia", seat: "1", cloth: "linen", tone: "hush" }), { id: "b", title: "B", usher: "Nia", seat: "3", cloth: "linen", gilt: "2" });
  assert.equal(adjacentStallCount(pair), 2);
  assert.equal(pairUsherCount(pair), 2);
  assert.equal(giltLoad(pair), 2);
  assert.equal(seatSpan(pair), 2);
  assert.equal(clashSeatCount(pair), 0);
  const clash = addStall(pair, { id: "c", title: "C", usher: "Bea", seat: "1", cloth: "linen", cord: "7" });
  const withCord = addStall(clash, { id: "d", title: "D", seat: "5", cloth: "slate", cord: "7", tone: "bright" });
  assert.equal(clashSeatCount(clash), 2);
  assert.equal(cordClashCount(withCord), 2);
  assert.equal(brightLoad(withCord), 1);
  assert.equal(nextStall(pair, "3"), "a");
  assert.equal(windowStalls(saved, "3").length, 1);
  assert.equal(windowStalls(saved, "6").length, 0);
  const shown = visibleStalls(saved, "open", "ada", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(visibleStalls(saved, "open", "", null, "LINEN", null, null, null, null, null, false, false, true, false, false).length, 1);
  assert.equal(visibleStalls(saved, "held", "", null, null, null, null, null, null, null, false, false, false, false, false).length, 0);
  const moved = bulkStallCloth(saved, ["a"], "slate");
  assert.equal(moved[0].cloth, "SLATE");
  assert.equal(moved[0].audit, "cloth");
  const bulkTone = bulkStallTone(saved, ["a"], "bright");
  assert.equal(bulkTone[0].tone, "bright");
  assert.equal(nextStall(bulkTone, "1"), "");
  assert.equal(lateShare(saved, "4") > 0, true);

  const views = addStallView([], { id: "v1", name: "Peak aisle", tray: "open", query: "ada", usher: "Nia", cloth: "LINEN", tone: "hush", seat: "peak", cord: "11", stay: "15" });
  assert.equal(readStallViews(views).length, 1);
  assert.equal(readStallViews(views)[0].seat, "peak");
  const viewCap = Array.from({ length: 8 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", usher: "all", cloth: "all", tone: "all", seat: "all", cord: "all", stay: "all" })).reduce((rows, view) => addStallView(rows, view), [] as ReturnType<typeof addStallView>);
  assert.equal(viewCap.length, 6);
  const sheet = stallsCsv(saved, "4");
  assert.match(sheet, /title,usher,seat,cloth,tone,cord,stay/);
  assert.match(sheet, /Ada stall,Nia,1,LINEN,hush,11,15/);

  assert.equal(crestOf("macOS 14"), "M1");
  assert.equal(crestOf("Windows 11"), "W1");
  assert.equal(crestOf("Ubuntu 22"), "U2");
  assert.equal(crestOf("Debian"), "DN");
  assert.equal(crestOf("Chrome OS"), "CS");
  assert.equal(crestOf(""), "");
  assert.equal(crestBand("macOS 14"), "apple");
  assert.equal(crestBand("iPadOS 17"), "apple");
  assert.equal(crestBand("Windows 11"), "window");
  assert.equal(crestBand("Ubuntu 22"), "linux");
  assert.equal(crestBand("Debian"), "linux");
  assert.equal(crestBand("Chrome OS"), "plain");
  assert.equal(crestTone("macOS 14"), "gilt");
  assert.equal(crestTone("Windows 11"), "ink");
  assert.equal(crestTone("Ubuntu 22"), "ivory");
  assert.equal(crestTone("Debian"), "plain");
  assert.equal(catalogCrest("macOS 14"), true);
  assert.equal(catalogCrest("Debian"), false);
  assert.equal(crestState({ balance: 1, lastOs: "macOS 14" }), "");
  assert.equal(crestState({ lastOs: null }), "clear");
  assert.equal(crestState({ lastOs: "macOS 14" }), "set");
  assert.equal(crestState({ email: "ada@7fx.com" }), "");
  const rows = [
    { id: "1", label: "Ada", note: "macOS 14" },
    { id: "2", label: "Bea", note: "Windows 11" },
    { id: "3", label: "Cal", note: "Ubuntu 22" },
    { id: "4", label: "Eve", note: { lastOs: null } },
    { id: "5", label: "Fay", note: { balance: 1 } },
    { id: "6", label: "Gus", note: "Windows 11 Pro" },
    { id: "7", label: "Hal", note: "Debian" },
  ];
  assert.equal(catalogCrestCount(rows), 3);
  assert.equal(wideCrestCount(rows), 1);
  assert.equal(giltCrestCount(rows), 1);
  assert.equal(sharedCrestCount([{ id: "1", note: "Windows 11" }, { id: "2", note: "Windows 10" }]), 2);
  assert.equal(leadingCrest(rows), "window");
  assert.equal(leadingCrestTone([{ id: "a", note: "macOS 14" }, { id: "b", note: "macOS 13" }]), "gilt");
  const giltOnly = visibleCrestCustomers(rows, null, null, "", "all", [], "gilt");
  assert.equal(giltOnly.length, 1);
  const catalogOnly = visibleCrestCustomers(rows, "apple", null, "ada", "all", [], "catalog");
  assert.equal(catalogOnly.length, 1);
  assert.equal(catalogOnly[0].id, "1");
  const countSheet = crestsCsv(rows);
  assert.match(countSheet, /band,apple,1/);
  assert.match(countSheet, /catalog,catalog,3/);
  assert.match(countSheet, /wide,wide,1/);
  const rowSheet = crestRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,M1,apple,gilt,1,0,1/);
  assert.match(rowSheet, /Eve,,blank,,0,0,0/);
  assert.match(rowSheet, /Fay,,,,0,0,0/);

  const keys = Object.keys(ROUND208_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND208_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND208_COPY[locale][key as keyof typeof ROUND208_COPY.en], "string");
      assert.ok(ROUND208_COPY[locale][key as keyof typeof ROUND208_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "clsTitle"), ROUND208_COPY.tr.clsTitle);
  assert.equal(crmv4Text("de", "syoTitle"), ROUND208_COPY.de.syoTitle);
  assert.equal(crmv4Text("ru", "clsSub"), ROUND208_COPY.ru.clsSub);
  assert.equal(crmv4Text("ar", "syoSub"), ROUND208_COPY.ar.syoSub);
  assert.equal(crmv4Text("en", "clsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cls/);
  assert.match(css, /\.c4-syo-index/);
  assert.match(css, /\.c4-book-cloister/);
  assert.match(css, /\.c4-pagehead-cloister/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round208.tsx"), "utf8");
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
  assert.match(viewFile, /lastOs/);
  assert.match(viewFile, /stallsCsv/);
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
  assert.match(viewFile, /data-stalls/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "clst"/);
  assert.match(app, /view === "sycr"/);
  assert.match(app, /CloisterStalls/);
  assert.match(app, /SystemCrests/);
  assert.match(app, /c4-pagehead-cloister/);
  assert.match(app, /c4-rail-cloister/);
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(positions, /c4-book-cloister/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of used) assert.ok(key in ROUND208_COPY.en, key);
  console.log("crmv4 round208 tests passed");
}

main();
