/**
 * Conservatory slips and referral ribbons.
 * Run: TZ=UTC npx tsx tests/crmv4-round205.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND205_COPY } from "../src/lib/crmv4/copy-round205";
import {
  activeDay,
  activePause,
  activeRoom,
  activeWick,
  addSlip,
  addSlipTag,
  addSlipView,
  adjacentSlipCount,
  busiestKeeper,
  catalogRibbon,
  catalogRibbonCount,
  clashDayCount,
  cycleBreath,
  dayGap,
  dayOf,
  densityOf,
  editSlip,
  editSlipNote,
  fairKeeper,
  giltRibbonCount,
  houseRoom,
  hushOf,
  lateShare,
  lateSlip,
  leadingRibbon,
  leadingRibbonTone,
  moveFocus,
  nextSlip,
  pauseOf,
  peakDay,
  quietDay,
  readSlipViews,
  ribbonBand,
  ribbonOf,
  ribbonRowsCsv,
  ribbonState,
  ribbonTone,
  ribbonsCsv,
  roomOf,
  setSlipHush,
  sharedRibbonCount,
  slipCounts,
  slipsCsv,
  soonSlip,
  suggestKeeper,
  suggestPause,
  suggestRoom,
  usedDays,
  visibleRibbonCustomers,
  visibleSlips,
  wickClashCount,
  wickOf,
  wideRibbonCount,
  windowSlips,
} from "../src/lib/crmv4/round205";

function main() {
  assert.equal(roomOf("  glass "), "GLASS");
  assert.equal(roomOf("fern"), "FERN");
  assert.equal(roomOf("tile"), "TILE");
  assert.equal(roomOf("   "), "");
  assert.equal(roomOf("oak"), "");
  assert.equal(dayOf("1"), 1);
  assert.equal(dayOf(1), 1);
  assert.equal(dayOf(7), 7);
  assert.equal(dayOf("7"), 7);
  assert.equal(dayOf("0"), null);
  assert.equal(dayOf(0), null);
  assert.equal(dayOf("01"), null);
  assert.equal(dayOf("8"), null);
  assert.equal(dayOf(""), null);
  assert.equal(dayOf(1.5), null);
  assert.equal(wickOf("2"), 2);
  assert.equal(wickOf(4), 4);
  assert.equal(wickOf("8"), 8);
  assert.equal(wickOf("3"), null);
  assert.equal(wickOf("02"), null);
  assert.equal(pauseOf("15"), 15);
  assert.equal(pauseOf(30), 30);
  assert.equal(pauseOf("60"), 60);
  assert.equal(pauseOf("0"), null);
  assert.equal(pauseOf("015"), null);
  assert.equal(hushOf("0"), 0);
  assert.equal(hushOf(5), 5);
  assert.equal(hushOf("15"), 15);
  assert.equal(hushOf("10"), null);
  assert.equal(peakDay(2), true);
  assert.equal(peakDay(3), true);
  assert.equal(peakDay(1), false);
  assert.equal(peakDay(4), false);
  assert.equal(quietDay(1), true);
  assert.equal(quietDay(7), true);
  assert.equal(quietDay(2), false);
  assert.equal(quietDay(3), false);
  assert.equal(dayGap(1, 7), 6);
  assert.equal(dayGap(7, 1), -6);
  assert.equal(dayGap(2, 4), 2);
  assert.equal(dayGap(4, 2), -2);
  assert.equal(dayGap(null, 5), null);
  assert.equal(dayGap(1, ""), null);
  assert.equal(dayGap(1, 0), null);
  assert.equal(activeDay("peak"), "peak");
  assert.equal(activeDay("1"), "1");
  assert.equal(activeDay("99"), "all");
  assert.equal(activeWick("8"), "8");
  assert.equal(activeWick("3"), "all");
  assert.equal(activePause("blank"), "blank");
  assert.equal(activePause("12"), "all");
  assert.equal(activeRoom("nope", ["GLASS"]), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addSlip([], { id: "a", title: "Ada slip", note: "fern leaf", keeper: "Nia", day: "1", room: "glass", breath: "still", wick: "8", pause: "15", tags: "a, b, c, g", hush: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].day, 1);
  assert.equal(saved[0].wick, 8);
  assert.equal(saved[0].pause, 15);
  assert.equal(saved[0].room, "GLASS");
  assert.equal(saved[0].note, "fern leaf");
  assert.deepEqual(saved[0].tags, ["a", "b", "c"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseRoom(saved[0].room), true);
  assert.equal(houseRoom("TILE"), false);
  assert.equal(soonSlip(saved[0]), true);
  assert.equal(lateSlip(saved[0], "3"), true);
  assert.equal(lateSlip(saved[0], "2"), false);
  assert.equal(lateSlip(saved[0], "1"), false);
  assert.equal(addSlip(saved, { id: "b", title: "Ada slip" }).length, 1);
  assert.equal(addSlip(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 9 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((slips, slip) => addSlip(slips, slip), [] as ReturnType<typeof addSlip>);
  assert.equal(capped.length, 7);
  assert.equal(capped.some((slip) => slip.title === "Line 0"), false);
  assert.equal(capped.some((slip) => slip.title === "Line 8"), true);

  const edited = editSlip(saved, "a", "Ada leaf");
  assert.equal(edited[0].title, "Ada leaf");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSlip(edited, "a", "   ")[0].title, "Ada leaf");
  const noted = editSlipNote(edited, "a", "glass pane");
  assert.equal(noted[0].note, "glass pane");
  const tagged = addSlipTag(noted, "a", "d");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const breathed = cycleBreath(saved, "a");
  assert.equal(breathed[0].breath, "rising");
  assert.equal(breathed[0].audit, "breath");
  const hushed = setSlipHush(saved, "a", 5);
  assert.equal(hushed[0].hush, 5);
  assert.equal(soonSlip(hushed[0]), false);
  assert.equal(lateSlip(hushed[0], "7"), false);

  const second = addSlip(saved, { id: "b", title: "Bea slip", keeper: "Nia", day: "2", room: "glass", breath: "rising", wick: "8", pause: "30" });
  const third = addSlip(second, { id: "c", title: "Cal slip", keeper: "Ian", day: "4", room: "tile", breath: "fading", wick: "2", pause: "60", hush: "5" });
  const held = third.map((slip) => slip.id === "c" ? { ...slip, held: true } : slip);
  const open = visibleSlips(held, "open", "", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(open.length, 2);
  const found = visibleSlips(held, "open", "fern", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(found.length, 1);
  assert.equal(found[0].id, "a");
  const glass = visibleSlips(held, "open", "", null, "GLASS", null, null, null, null, null, false, false, false, false, false);
  assert.equal(glass.length, 2);
  const rising = visibleSlips(held, "open", "", null, null, null, null, null, null, null, true, false, false, false, false);
  assert.equal(rising.length, 1);
  assert.equal(rising[0].id, "b");
  const peak = visibleSlips(held, "open", "", null, null, null, null, "peak", null, null, false, false, false, false, false);
  assert.equal(peak.length, 1);
  assert.equal(peak[0].id, "b");
  const house = visibleSlips(held, "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.deepEqual(house.map((slip) => slip.id).sort(), ["a", "b"]);
  const quiet = visibleSlips(third, "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(quiet.length, 1);
  assert.equal(quiet[0].id, "a");
  const awake = visibleSlips(third, "open", "", null, null, null, null, null, null, null, false, false, false, false, true);
  assert.equal(awake.some((slip) => slip.id === "c"), false);
  const counts = slipCounts(third, "4");
  assert.equal(counts.open, 3);
  assert.equal(counts.late, 2);
  assert.equal(counts.soon, 1);
  assert.equal(counts.hush, 1);
  assert.equal(counts.house, 2);
  assert.equal(lateShare(third, "4"), 67);
  assert.equal(usedDays(third), 3);
  assert.equal(clashDayCount(second), 0);
  const clash = addSlip(second, { id: "d", title: "Dee slip", day: "2", room: "glass", wick: "8" });
  assert.equal(clashDayCount(clash), 2);
  assert.equal(wickClashCount(clash), 3);
  assert.equal(adjacentSlipCount(second), 2);
  assert.equal(suggestRoom([]), "TILE");
  assert.equal(suggestRoom(second), "TILE");
  assert.equal(suggestPause([]), 30);
  assert.equal(suggestKeeper(second), "Nia");
  assert.equal(fairKeeper(second, "Ian, Nia"), "Ian");
  assert.equal(fairKeeper(second, ""), "Nia");
  assert.equal(busiestKeeper(second), "Nia");
  assert.equal(nextSlip(second, "2"), "b");
  assert.equal(nextSlip(second, "7"), "a");
  const windowRows = windowSlips(second, "2");
  assert.equal(windowRows.length, 2);
  const sheet = slipsCsv(saved, "3");
  assert.match(sheet, /Ada slip,Nia,1,GLASS,still,8,15,a b c,0,0,0,0,2,1,1,1,0,fern leaf,save/);
  const views = addSlipView([], { id: "v", name: "Peak glass", tray: "open", query: "ada", keeper: "Nia", room: "glass", breath: "still", day: "peak", wick: "8", pause: "15" });
  assert.equal(readSlipViews(views)[0].room, "GLASS");
  assert.equal(addSlipView(views, { id: "v2", name: "Peak glass", tray: "open", query: "", keeper: "all", room: "all", breath: "all", day: "all", wick: "all", pause: "all" }).length, 1);

  const rows = [
    { id: "1", label: "Ada", note: { referralCodeUsed: "213950812" } },
    { id: "2", label: "Bea", note: { referralCodeUsed: "213950812" } },
    { id: "3", label: "Cal", note: { referralCodeUsed: "100200300" } },
    { id: "4", label: "Dee", note: { referralCodeUsed: "123456" } },
    { id: "5", label: "Eve", note: { referralCodeUsed: null } },
    { id: "6", label: "Fay", note: { referralCodeUsed: "900800700", balance: 1 } },
  ];
  assert.equal(ribbonOf(rows[0].note), "22");
  assert.equal(ribbonBand(rows[0].note), "long");
  assert.equal(ribbonTone(rows[0].note), "gilt");
  assert.equal(catalogRibbon(rows[0].note), true);
  assert.equal(ribbonOf(rows[2].note), "10");
  assert.equal(ribbonTone(rows[2].note), "ivory");
  assert.equal(ribbonOf(rows[3].note), "16");
  assert.equal(ribbonBand(rows[3].note), "even");
  assert.equal(ribbonOf("7"), "7");
  assert.equal(ribbonBand("7"), "brief");
  assert.equal(ribbonTone("7"), "plain");
  assert.equal(ribbonBand("12345678901"), "long");
  assert.equal(ribbonOf("ab12"), "A2");
  assert.equal(ribbonBand("ab12"), "plain");
  assert.equal(ribbonState(rows[4].note), "clear");
  assert.equal(ribbonState(rows[5].note), "");
  assert.equal(ribbonState({}), "");
  assert.equal(catalogRibbonCount(rows), 3);
  assert.equal(wideRibbonCount([{ id: "w", note: "12345678901" }]), 1);
  assert.equal(giltRibbonCount(rows), 2);
  assert.equal(giltRibbonCount([{ id: "g", note: "213950812" }]), 1);
  assert.equal(sharedRibbonCount(rows), 2);
  assert.equal(leadingRibbon(rows), "long");
  assert.equal(leadingRibbonTone([{ id: "a", note: "21" }, { id: "b", note: "91" }]), "gilt");
  const giltOnly = visibleRibbonCustomers(rows, null, null, "", "all", [], "gilt");
  assert.equal(giltOnly.length, 2);
  const catalogOnly = visibleRibbonCustomers(rows, "long", null, "ada", "all", [], "catalog");
  assert.equal(catalogOnly.length, 1);
  assert.equal(catalogOnly[0].id, "1");
  const countSheet = ribbonsCsv(rows);
  assert.match(countSheet, /band,long,3/);
  assert.match(countSheet, /catalog,catalog,3/);
  assert.match(countSheet, /shared,shared,2/);
  const rowSheet = ribbonRowsCsv(rows, ["1"]);
  assert.match(rowSheet, /Ada,22,long,gilt,1,0,1/);
  assert.match(rowSheet, /Eve,,blank,,0,0,0/);
  assert.match(rowSheet, /Fay,,,,0,0,0/);

  const keys = Object.keys(ROUND205_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND205_COPY[locale]).sort(), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND205_COPY[locale][key as keyof typeof ROUND205_COPY.en], "string");
      assert.ok(ROUND205_COPY[locale][key as keyof typeof ROUND205_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "cnsTitle"), ROUND205_COPY.tr.cnsTitle);
  assert.equal(crmv4Text("de", "rfbTitle"), ROUND205_COPY.de.rfbTitle);
  assert.equal(crmv4Text("ru", "cnsSub"), ROUND205_COPY.ru.cnsSub);
  assert.equal(crmv4Text("ar", "rfbSub"), ROUND205_COPY.ar.rfbSub);
  assert.equal(crmv4Text("en", "cnsLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cns/);
  assert.match(css, /\.c4-rfb-index/);
  assert.match(css, /\.c4-support-conservatory/);
  assert.match(css, /\.c4-pagehead-conservatory/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round205.tsx"), "utf8");
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
  assert.match(viewFile, /referralCodeUsed/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /ribbonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestRoom/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cnsl"/);
  assert.match(app, /view === "rfbn"/);
  assert.match(app, /ConservatorySlips/);
  assert.match(app, /ReferralRibbons/);
  assert.match(app, /c4-pagehead-conservatory/);
  assert.match(app, /c4-rail-conservatory/);
  const support = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Support.tsx"), "utf8");
  assert.match(support, /c4-support-conservatory/);
  console.log("crmv4 round205 tests passed");
}

main();
