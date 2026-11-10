/**
 * Quiet holds and dial lanes.
 * Run: TZ=UTC npx tsx tests/crmv4-round192.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND192_COPY } from "../src/lib/crmv4/copy-round192";
import {
  activeHour,
  activeWeight,
  activeWindow,
  addHold,
  addHoldTag,
  addHoldView,
  bayOf,
  bulkHoldRibbon,
  busiestKeeper,
  catalogDial,
  catalogDialCount,
  clashHourCount,
  cyclePosture,
  densityOf,
  dialBand,
  dialCopy,
  dialRowsCsv,
  dialState,
  dialTone,
  dialsCsv,
  editHold,
  editHoldNote,
  fairKeeper,
  holdLine,
  hourGap,
  hourOf,
  houseBay,
  lateHold,
  moveFocus,
  nextHold,
  openDialCount,
  peakHour,
  quietHour,
  readHolds,
  reminderHolds,
  setHoldSnooze,
  sharedDialCount,
  soonHold,
  sortHolds,
  suggestKeeper,
  suggestRibbon,
  suggestWindow,
  usedHours,
  visibleDialCustomers,
  visibleHolds,
  weightClashCount,
  weightOf,
  wideDialCount,
  windowDays,
  holdsCsv,
} from "../src/lib/crmv4/round192";

function main() {
  assert.equal(bayOf("  ams "), "AMS");
  assert.equal(bayOf("dxb"), "DXB");
  assert.equal(bayOf("ist"), "IST");
  assert.equal(bayOf("   "), "");
  assert.equal(bayOf("AM"), "");
  assert.equal(bayOf("AMS1"), "");
  assert.equal(hourOf("0"), 0);
  assert.equal(hourOf(0), 0);
  assert.equal(hourOf("23"), 23);
  assert.equal(hourOf("12"), 12);
  assert.equal(hourOf("00"), null);
  assert.equal(hourOf("08"), null);
  assert.equal(hourOf("24"), null);
  assert.equal(hourOf(""), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(5), 5);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("01"), null);
  assert.equal(windowDays("1"), 1);
  assert.equal(windowDays(7), 7);
  assert.equal(windowDays("0"), null);
  assert.equal(windowDays("03"), null);
  assert.equal(windowDays("2"), null);
  assert.equal(peakHour(9), true);
  assert.equal(peakHour(17), true);
  assert.equal(peakHour(0), false);
  assert.equal(quietHour(1), true);
  assert.equal(quietHour(4), true);
  assert.equal(quietHour(9), false);
  assert.equal(quietHour(17), false);
  assert.equal(hourGap(23, 0), 1);
  assert.equal(hourGap(0, 23), -1);
  assert.equal(hourGap(0, 10), 10);
  assert.equal(hourGap(10, 0), -10);
  assert.equal(hourGap(2, 20), -6);
  assert.equal(hourGap(20, 2), 6);
  assert.equal(hourGap(null, 2), null);
  assert.equal(hourGap(2, ""), null);
  assert.equal(hourGap(2, 24), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeWeight("3"), "3");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeWindow("blank"), "blank");
  assert.equal(activeWindow("4"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addHold([], { id: "a", title: "Ada pause", note: "oak leaf", keeper: "Nia", hour: "6", ribbon: "silk", bay: "ams", posture: "queue", weight: "5", window: "1", tags: "oak, vip", snooze: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 6);
  assert.equal(saved[0].weight, 5);
  assert.equal(saved[0].window, 1);
  assert.equal(saved[0].bay, "AMS");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseBay(saved[0].bay), true);
  assert.equal(houseBay("LON"), false);
  assert.equal(soonHold(saved[0]), true);
  assert.equal(lateHold(saved[0], "12"), true);
  assert.equal(lateHold(saved[0], "10"), false);
  assert.equal(addHold(saved, { id: "b", title: "Ada pause" }).length, 1);
  assert.equal(addHold(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addHold(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addHold(cards, card), [] as ReturnType<typeof addHold>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cyclePosture(saved, "a");
  assert.equal(cycled[0].posture, "watch");
  assert.equal(cycled[0].audit, "posture");
  assert.equal(cyclePosture(cycled, "a")[0].posture, "release");
  assert.equal(cyclePosture(cyclePosture(cycled, "a"), "a")[0].posture, "queue");
  const blankPosture = addHold([], { id: "z", title: "Blank posture" });
  assert.equal(cyclePosture(blankPosture, "z")[0].posture, "queue");

  const edited = editHold(saved, "a", "Bea pause");
  assert.equal(edited[0].title, "Bea pause");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editHold(saved, "a", "   ")[0].title, "Ada pause");
  const noted = editHoldNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editHoldNote(saved, "a", "   ")[0].note, "oak leaf");
  const tagged = addHoldTag(saved, "a", "gold");
  assert.deepEqual(tagged[0].tags, ["oak", "vip", "gold"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addHoldTag(tagged, "a", "extra").length, 1);
  assert.equal(addHoldTag(tagged, "a", "extra")[0].tags.length, 3);
  assert.equal(addHoldTag(saved, "a", "A1")[0].tags.length, 2);

  const snoozed = setHoldSnooze(saved, "a", 2);
  assert.equal(snoozed[0].snooze, 2);
  assert.equal(snoozed[0].audit, "snooze");
  assert.equal(soonHold(snoozed[0]), false);
  assert.equal(lateHold(snoozed[0], "20"), false);
  assert.equal(setHoldSnooze(saved, "a", 8)[0].snooze, 0);

  const moved = bulkHoldRibbon(saved, ["a"], "satin");
  assert.equal(moved[0].ribbon, "satin");
  assert.equal(moved[0].audit, "ribbon");
  assert.equal(bulkHoldRibbon(saved, ["a"], "linen")[0].ribbon, "silk");

  const second = addHold(saved, { id: "b", title: "Bea pause", keeper: "Ada", hour: "12", ribbon: "silk", bay: "dxb", posture: "watch", weight: "5", window: "3", tags: "oak" });
  assert.equal(usedHours(second), 2);
  assert.equal(suggestRibbon([]), "satin");
  assert.equal(suggestWindow([]), 3);
  assert.equal(suggestKeeper([]), "");
  assert.equal(fairKeeper(second, "Bea, Ada"), "Bea");
  assert.equal(busiestKeeper(second), "Ada");
  assert.equal(nextHold(second, ""), "");
  assert.equal(nextHold(second, "10"), "b");
  const released = cyclePosture(second, "b");
  assert.equal(released.find((card) => card.id === "b")?.posture, "release");
  assert.equal(nextHold(released, "10"), "a");
  const dozing = setHoldSnooze(second, "b", 6);
  assert.equal(nextHold(dozing, "10"), "a");
  const shown = visibleHolds(second, "open", "bea", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleHolds(second, "open", "oak", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleHolds(second, "open", "", null, null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(clashHourCount(second), 0);
  const twin = addHold(second, { id: "c", title: "Cara pause", keeper: "Bea", hour: "6", ribbon: "silk", bay: "ist", posture: "queue", weight: "1", window: "7" });
  assert.equal(clashHourCount(twin), 2);
  const split = addHold(saved, { id: "b", title: "Wool pause", keeper: "Ada", hour: "6", ribbon: "wool", bay: "ist", posture: "queue", weight: "1", window: "7" });
  assert.equal(clashHourCount(split), 0);
  assert.equal(weightClashCount(second), 2);
  assert.equal(readHolds([{ id: "q", title: "Kept", hour: "08" }])[0].hour, null);
  assert.equal(reminderHolds(second, "12").some((card) => card.id === "a"), true);
  assert.equal(reminderHolds(snoozed, "20").length, 0);
  assert.equal(sortHolds(second, "title")[0].title, "Ada pause");
  assert.equal(holdLine("  Ada pause  "), "Ada pause");

  const view = addHoldView([], {
    id: "v1",
    name: "House peak",
    tray: "open",
    query: "ada",
    keeper: "all",
    ribbon: "silk",
    bay: "ams",
    posture: "queue",
    hour: "peak",
    weight: "5",
    window: "1",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].hour, "peak");
  assert.equal(addHoldView(view, { ...view[0], id: "v2", name: "House peak" }).length, 1);

  const csv = holdsCsv(second, "20");
  assert.equal(csv.startsWith("title,keeper,hour,ribbon,bay,posture,weight,window,tags,snooze,pinned,parked,closed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Ada pause"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { phone: "+44 207-000-90" } },
    { id: "2", label: "Bea", note: { phone: "4420700090" } },
    { id: "3", label: "Gus", note: { phone: "31205501" } },
    { id: "4", label: "Noa", note: { phone: "905550001122" } },
    { id: "5", label: "Shut", note: { phone: "31215511" } },
    { id: "6", label: "Empty", note: { phone: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { phone: "31205501", balance: 1 } },
  ];
  assert.equal(dialCopy(rows[0].note), "4420700090");
  assert.equal(dialState(rows[0].note), "set");
  assert.equal(dialBand(rows[0].note), "card");
  assert.equal(dialBand(rows[2].note), "slip");
  assert.equal(dialBand(rows[3].note), "folio");
  assert.equal(dialTone(rows[0].note), "open");
  assert.equal(dialTone(rows[4].note), "shut");
  assert.equal(dialState(rows[5].note), "clear");
  assert.equal(dialState(rows[6].note), "");
  assert.equal(dialState(rows[7].note), "");
  assert.equal(dialState("12345"), "");
  assert.equal(catalogDial(rows[0].note), true);
  assert.equal(catalogDial(rows[4].note), false);
  assert.equal(catalogDialCount(rows), 4);
  assert.equal(wideDialCount(rows), 3);
  assert.equal(openDialCount(rows), 4);
  assert.equal(sharedDialCount(rows), 1);
  assert.equal(visibleDialCustomers(rows, "card", null, "", "all", [], "all").length, 2);
  assert.equal(visibleDialCustomers(rows, null, null, "44207", "all", [], "all").length, 2);
  const bands = dialsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = dialRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "qhdTitle"), ROUND192_COPY.en.qhdTitle);
  assert.equal(crmv4Text("tr", "dlnTitle"), ROUND192_COPY.tr.dlnTitle);
  assert.equal(crmv4Text("de", "qhdSearch"), ROUND192_COPY.de.qhdSearch);
  assert.equal(crmv4Text("ru", "dlnHint"), ROUND192_COPY.ru.dlnHint);
  assert.equal(crmv4Text("ar", "qhdNotice"), ROUND192_COPY.ar.qhdNotice);
  assert.notEqual(ROUND192_COPY.tr.qhdTitle, ROUND192_COPY.en.qhdTitle);
  assert.notEqual(ROUND192_COPY.de.dlnTitle, ROUND192_COPY.en.dlnTitle);
  assert.notEqual(ROUND192_COPY.ru.qhdSearch, ROUND192_COPY.en.qhdSearch);
  assert.notEqual(ROUND192_COPY.ar.dlnSearch, ROUND192_COPY.en.dlnSearch);
  const keys = Object.keys(ROUND192_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND192_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-qhd/);
  assert.match(css, /\.c4-dln/);
  assert.match(css, /\.c4-aff-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round192.tsx"), "utf8");
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
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /holdsCsv/);
  assert.match(viewFile, /dialsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-holds/);
  assert.match(viewFile, /data-dials/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestRibbon/);
  const affiliates = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round45.tsx"), "utf8");
  assert.match(affiliates, /c4-aff-salon/);
  assert.match(affiliates, /data-logo="mono"/);
  assert.match(affiliates, /c4-aff-salon-mast/);
  assert.match(affiliates, /c4-aff-salon-card/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "qhold"/);
  assert.match(app, /view === "dials"/);
  assert.match(app, /QuietHolds/);
  assert.match(app, /DialLanes/);
  console.log("crmv4 round192 tests passed");
}

main();
