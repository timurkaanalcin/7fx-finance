/**
 * Dispatch slips and desk wings.
 * Run: npx tsx tests/crmv4-round151.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND151_COPY } from "../src/lib/crmv4/copy-round151";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeCourier,
  activeDesk,
  activeHour,
  activeInitial,
  activeLane,
  activePace,
  activeSpan,
  activeWax,
  activeWing,
  addDispatch,
  addDispatchView,
  assignedDesk,
  bulkDispatchFiled,
  bulkDispatchPinned,
  clockOf,
  courierArg,
  courierLabel,
  daypartCounts,
  deskArg,
  deskShare,
  desksCsv,
  dispatchClashIds,
  dispatchCopy,
  dispatchCounts,
  dispatchCouriers,
  dispatchLanes,
  dispatchPaces,
  dispatchShare,
  dispatchText,
  dispatchTimeline,
  dispatchWaxes,
  dispatchesCsv,
  dropDispatchView,
  editDispatch,
  hourArg,
  hourBand,
  hourGap,
  hourPair,
  initialArg,
  initialOf,
  laneArg,
  laneOf,
  leadingDesk,
  leadingWing,
  namedDesks,
  namedInitials,
  namedWings,
  nextDispatch,
  paceArg,
  paceOf,
  readDispatchViews,
  readDispatches,
  readHiddenDesks,
  resetDispatches,
  setDispatchFiled,
  setDispatchHeld,
  setDispatchPinned,
  spanArg,
  spanOf,
  stepDispatchPace,
  toggleDesk,
  visibleDeskCustomers,
  visibleDesks,
  visibleDispatches,
  waxArg,
  waxMark,
  wingArg,
  wingOf,
} from "../src/lib/crmv4/round151";

function main() {
  assert.equal(dispatchText("  Call\nAda  "), "Call Ada");
  assert.equal(dispatchText("   "), "");
  assert.equal(dispatchText("x".repeat(120)).length, 64);
  assert.equal(courierLabel("  North  "), "North");
  assert.equal(courierLabel("   "), "");
  assert.equal(courierLabel("y".repeat(40)).length, 14);
  assert.equal(waxMark("  VIP  "), "VIP");
  assert.equal(waxMark("   "), "");
  assert.equal(waxMark("z".repeat(30)).length, 8);
  assert.equal(clockOf(" 0 "), 0);
  assert.equal(clockOf(0), 0);
  assert.equal(clockOf("23"), 23);
  assert.equal(clockOf(23), 23);
  assert.equal(clockOf(""), null);
  assert.equal(clockOf("24"), null);
  assert.equal(clockOf(24), null);
  assert.equal(clockOf("08"), null);
  assert.equal(clockOf("00"), null);
  assert.equal(clockOf(-1), null);
  assert.equal(clockOf(1.5), null);
  assert.equal(laneOf(" NORTH "), "north");
  assert.equal(laneOf("south"), "south");
  assert.equal(laneOf("east"), "east");
  assert.equal(laneOf("west"), "west");
  assert.equal(laneOf(""), "blank");
  assert.equal(laneOf("pit"), "blank");
  assert.equal(paceOf(" GALLOP "), "gallop");
  assert.equal(paceOf("walk"), "walk");
  assert.equal(paceOf("trot"), "trot");
  assert.equal(paceOf(""), "blank");
  assert.equal(paceOf("gold"), "blank");
  assert.equal(hourBand(null), "blank");
  assert.equal(hourBand(0), "night");
  assert.equal(hourBand(5), "night");
  assert.equal(hourBand(6), "morning");
  assert.equal(hourBand(11), "morning");
  assert.equal(hourBand(12), "afternoon");
  assert.equal(hourBand(17), "afternoon");
  assert.equal(hourBand(18), "evening");
  assert.equal(hourBand(23), "evening");
  assert.equal(hourPair(null), "blank");
  assert.equal(hourPair(0), "even");
  assert.equal(hourPair(1), "odd");
  assert.equal(hourPair(8), "even");
  assert.equal(hourGap(8, 9), 1);
  assert.equal(hourGap(18, 9), -9);
  assert.equal(hourGap(8, 8), 0);
  assert.equal(hourGap(null, 9), null);
  assert.equal(hourGap(8, ""), null);
  assert.equal(hourGap(8, 24), null);
  assert.deepEqual(readDispatches([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", courier: "  ", hour: 24, lane: "pit", wax: "  ", pace: "gold", pinned: 1, filed: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", courier: "", hour: null, lane: "", wax: "", pace: "", pinned: false, filed: false, held: false, audit: "" },
  ]);
  assert.equal(readDispatches([{ id: "z", text: "One", hour: 0 }])[0].hour, 0);
  assert.equal(readDispatches([{ id: "z", text: "One", hour: "08" }])[0].hour, null);
  const saved = addDispatch([], { id: "a", text: "Call Ada", courier: "Nia", hour: 8, lane: "north", wax: "VIP", pace: "walk" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].hour, 8);
  assert.equal(saved[0].lane, "north");
  assert.equal(saved[0].pace, "walk");
  assert.equal(addDispatch(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addDispatch(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addDispatch(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepDispatchPace(saved, "a", 1);
  assert.equal(raised[0].pace, "trot");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepDispatchPace(raised, "a", 1)[0].pace, "gallop");
  assert.equal(stepDispatchPace([{ ...saved[0], pace: "gallop" }], "a", 1)[0].pace, "gallop");
  assert.equal(stepDispatchPace([{ ...saved[0], pace: "" }], "a", -1)[0].pace, "");
  const pinned = setDispatchPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setDispatchPinned(pinned, "a", false)[0].audit, "unpin");
  const held = setDispatchHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  const filed = setDispatchFiled(saved, "a", true);
  assert.equal(filed[0].filed, true);
  assert.equal(filed[0].audit, "file");
  assert.equal(setDispatchFiled(filed, "a", false)[0].audit, "reopen");
  const edited = editDispatch(saved, "a", "Call Bea");
  assert.equal(edited[0].text, "Call Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editDispatch(saved, "a", "  ")[0].text, "Call Ada");
  const pair = addDispatch(saved, { id: "b", text: "Later", hour: 18, lane: "west" });
  assert.equal(editDispatch(pair, "b", "Call Ada")[0].text, "Later");
  const bulkPin = bulkDispatchPinned(pair, ["b", ""], true);
  assert.equal(bulkPin[0].pinned, true);
  assert.equal(bulkPin[1].pinned, false);
  assert.equal(bulkDispatchFiled(pair, ["a"], true)[1].filed, true);
  assert.deepEqual(resetDispatches(), []);
  assert.equal(dispatchCopy("  Call Ada "), "Call Ada");
  assert.equal(dispatchCopy(" "), "");
  const shown = visibleDispatches(pair, "open", "ada", null, null, null, null, null, null, false, false, 9);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "a");
  assert.equal(visibleDispatches(pair, "open", "nia", null, null, null, null, null, null, false, false, 9).length, 0);
  assert.equal(visibleDispatches(held, "held", "", null, null, null, null, null, null, false, false, 9).length, 1);
  assert.equal(visibleDispatches(filed, "open", "", null, null, null, null, null, null, false, false, 9).length, 0);
  assert.equal(visibleDispatches(pair, "open", "", "Nia", "north", "VIP", "walk", 8, null, false, false, 9).length, 1);
  assert.equal(visibleDispatches(pair, "open", "", null, null, null, null, null, "morning", false, false, 9).length, 1);
  assert.equal(visibleDispatches(pair, "open", "", null, null, null, null, null, "even", false, false, 9).length, 2);
  assert.equal(visibleDispatches(raised, "open", "", null, null, null, null, null, null, true, false, 9).length, 0);
  assert.equal(visibleDispatches(stepDispatchPace(raised, "a", 1), "open", "", null, null, null, null, null, null, true, false, 9).length, 1);
  assert.equal(visibleDispatches(pair, "open", "", null, null, null, null, null, null, false, true, 9).length, 1);
  assert.deepEqual(dispatchTimeline(pair, "").map((card) => card.id), ["a", "b"]);
  assert.deepEqual(dispatchTimeline(addDispatch(pair, { id: "c", text: "Blank" }), "").map((card) => card.hour === null).at(-1), true);
  const counts = dispatchCounts(addDispatch(pinned, { id: "b", text: "Later", hour: 18 }), 9);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(dispatchShare(1, 4), 25);
  assert.equal(dispatchShare(0, 0), 0);
  assert.deepEqual(dispatchCouriers(saved), ["Nia"]);
  assert.deepEqual(dispatchWaxes(saved), ["VIP"]);
  assert.deepEqual(dispatchLanes(pair), ["north", "west"]);
  assert.deepEqual(dispatchPaces(saved), ["walk"]);
  assert.deepEqual(daypartCounts(pair), [0, 1, 0, 1]);
  assert.equal(activeCourier("missing", ["Nia"]), "all");
  assert.equal(activeCourier("blank", ["Nia"]), "blank");
  assert.equal(activeCourier("Nia", ["Nia"]), "Nia");
  assert.equal(courierArg("all"), null);
  assert.equal(courierArg("blank"), "");
  assert.equal(courierArg("Nia"), "Nia");
  assert.equal(activeLane("missing", ["north"]), "all");
  assert.equal(activeLane("north", ["north"]), "north");
  assert.equal(laneArg("blank"), "blank");
  assert.equal(laneArg("west"), "west");
  assert.equal(laneArg("pit"), null);
  assert.equal(activeWax("missing", ["VIP"]), "all");
  assert.equal(activeWax("VIP", ["VIP"]), "VIP");
  assert.equal(waxArg("blank"), "");
  assert.equal(waxArg("VIP"), "VIP");
  assert.equal(activePace("gone", ["walk"]), "all");
  assert.equal(activePace("gallop", ["gallop"]), "gallop");
  assert.equal(paceArg("blank"), "blank");
  assert.equal(paceArg("trot"), "trot");
  assert.equal(paceArg("gold"), null);
  assert.equal(activeHour("missing"), "all");
  assert.equal(activeHour("blank"), "blank");
  assert.equal(activeHour("morning"), "morning");
  assert.equal(activeHour("0"), "0");
  assert.equal(activeHour("8"), "8");
  assert.equal(activeHour("24"), "all");
  assert.equal(activeHour("08"), "all");
  assert.deepEqual(hourArg("odd"), { exact: null, band: "odd" });
  assert.deepEqual(hourArg("0"), { exact: 0, band: null });
  assert.deepEqual(hourArg("8"), { exact: 8, band: null });
  assert.deepEqual(hourArg("nope"), { exact: null, band: null });
  const clash = addDispatch(pair, { id: "c", text: "Same", hour: 8, lane: "north" });
  assert.deepEqual(dispatchClashIds(clash, "a"), ["c"]);
  assert.deepEqual(dispatchClashIds(addDispatch(saved, { id: "d", text: "Open lane" }), "a"), []);
  assert.equal(nextDispatch(pair, 9), "b");
  assert.equal(nextDispatch(pair, 18), "b");
  assert.equal(nextDispatch(pair, 19), "a");
  assert.equal(nextDispatch(pair, ""), "");
  const csv = dispatchesCsv(saved, 9);
  assert.equal(csv.startsWith("note,courier,hour,lane,wax,pace,band,pinned,held,filed,gap,audit\n"), true);
  assert.equal(csv.includes("Nia"), true);
  assert.equal(csv.includes("amount"), false);
  const view = addDispatchView([], { id: "v", name: "Morning", tray: "open", query: "ada", courier: "Nia", lane: "north", wax: "VIP", pace: "walk", hour: "8" });
  assert.equal(view[0].hour, "8");
  assert.equal(addDispatchView(view, { id: "v2", name: "Morning", tray: "open", query: "", courier: "all", lane: "all", wax: "all", pace: "all", hour: "all" }).length, 1);
  assert.equal(dropDispatchView(view, "v").length, 0);
  assert.equal(readDispatchViews([{ id: "v", name: "  " }]).length, 0);

  assert.equal(assignedDesk(" North "), "North");
  assert.equal(assignedDesk(""), "");
  assert.equal(assignedDesk("x".repeat(40)).length, 24);
  assert.equal(assignedDesk({ desk: "West" }), "West");
  assert.equal(assignedDesk({ desk: "West", name: "Ada" }), "");
  assert.equal(assignedDesk({ desk: "West", email: "a@b.c" }), "");
  assert.equal(assignedDesk({ desk: "West", phone: "1" }), "");
  assert.equal(wingOf("North"), "north");
  assert.equal(wingOf("south desk"), "south");
  assert.equal(wingOf("East"), "east");
  assert.equal(wingOf("WEST"), "west");
  assert.equal(wingOf("Kuzey"), "north");
  assert.equal(wingOf("Salon"), "floor");
  assert.equal(wingOf(""), "");
  assert.equal(wingOf({ desk: "North", name: "A" }), "");
  assert.equal(spanOf("North"), "short");
  assert.equal(spanOf("West salon"), "mid");
  assert.equal(spanOf("International desk"), "long");
  assert.equal(spanOf(""), "");
  assert.equal(initialOf("North"), "n");
  assert.equal(initialOf("3 West"), "w");
  assert.equal(initialOf(""), "");
  const rows = [
    { label: "Ada", desk: "North" },
    { label: "Wes", desk: "North" },
    { label: "Bea", desk: "West salon" },
    { label: "Cid", desk: "" },
    { label: "Blocked", desk: { desk: "East", name: "x" } },
  ];
  assert.equal(namedDesks(rows).includes("North"), true);
  assert.equal(namedDesks(rows).includes("West salon"), true);
  assert.deepEqual(namedWings(rows), ["north", "west"]);
  assert.deepEqual(namedInitials(rows), ["n", "w"]);
  assert.equal(leadingDesk(rows), "North");
  assert.equal(leadingWing(rows), "north");
  assert.equal(deskShare(1, 4), 25);
  assert.equal(deskShare(0, 0), 0);
  assert.deepEqual(readHiddenDesks(["North", "pirate", "West salon"], ["North"]), ["North"]);
  assert.deepEqual(toggleDesk(["North"], "North", ["North", "West salon"]), []);
  assert.deepEqual(toggleDesk([], "West salon", ["West salon"]), ["West salon"]);
  assert.deepEqual(visibleDesks(["North", "West salon"], ["North"], false), ["West salon"]);
  assert.deepEqual(visibleDesks(["North", "West salon"], ["North"], true), ["North"]);
  assert.equal(activeDesk("missing", ["North"]), "all");
  assert.equal(activeDesk("blank", ["North"]), "blank");
  assert.equal(activeDesk("North", ["North"]), "North");
  assert.equal(deskArg("all"), null);
  assert.equal(deskArg("blank"), "");
  assert.equal(deskArg("North"), "North");
  assert.equal(activeWing("gone", ["north"]), "all");
  assert.equal(activeWing("north", ["north"]), "north");
  assert.equal(wingArg("blank"), "");
  assert.equal(wingArg("north"), "north");
  assert.equal(wingArg("nope"), null);
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(activeSpan("short", ["short"]), "short");
  assert.equal(spanArg("blank"), "");
  assert.equal(spanArg("mid"), "mid");
  assert.equal(spanArg("nope"), null);
  assert.equal(activeInitial("z", ["n"]), "all");
  assert.equal(activeInitial("n", ["n"]), "n");
  assert.equal(initialArg("all"), null);
  assert.equal(initialArg("n"), "n");
  assert.equal(initialArg("nope"), null);
  const visible = visibleDeskCustomers(rows, "North", null, "short", "n", "ada");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].label, "Ada");
  assert.equal(visibleDeskCustomers(rows, "", null, null, null, "blocked").length, 1);
  assert.equal(visibleDeskCustomers(rows, null, null, null, null, "north").length, 0);
  assert.equal(visibleDeskCustomers(rows, "", null, null, null, "").length, 2);
  assert.equal(desksCsv(rows).startsWith("kind,mark,count\n"), true);
  assert.equal(desksCsv([]), "kind,mark,count");
  assert.equal(desksCsv(rows).includes("amount"), false);
  assert.equal(desksCsv(rows).includes("North"), true);

  const copy = Object.keys(ROUND151_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND151_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "dspTitle"), "Dispatch slips");
  assert.equal(crmv4Text("tr", "dskTitle"), ROUND151_COPY.tr.dskTitle);
  assert.equal(crmv4Text("de", "dspCourier"), ROUND151_COPY.de.dspCourier);
  assert.equal(crmv4Text("ru", "dskUnmarked"), ROUND151_COPY.ru.dskUnmarked);
  assert.equal(crmv4Text("ar", "dspNotice"), ROUND151_COPY.ar.dspNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dsp/);
  assert.match(css, /\.c4-dsk/);
  assert.match(css, /\.c4-pagehead-dispatch/);
  assert.match(css, /\.c4-rail-dispatch/);
  assert.match(css, /\.c4-pagehead-briefing/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round151.tsx"), "utf8");
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
  assert.match(viewFile, /desk/);
  assert.match(viewFile, /dispatchesCsv/);
  assert.match(viewFile, /desksCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-dispatch/);
  assert.match(viewFile, /data-wings/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dispatch"/);
  assert.match(app, /view === "wings"/);
  assert.match(app, /c4-pagehead-dispatch/);
  assert.match(app, /c4-rail-dispatch/);
  assert.match(app, /c4-pagehead-briefing/);
  console.log("crmv4 round151 tests passed");
}

main();
