/**
 * Gallery walks and timezone offsets.
 * Run: TZ=UTC npx tsx tests/crmv4-round202.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND202_COPY } from "../src/lib/crmv4/copy-round202";
import {
  activeLamp,
  activeLength,
  activeStep,
  addWalk,
  addWalkTag,
  addWalkView,
  adjacentWalkCount,
  catalogZone,
  catalogZoneCount,
  clashStepCount,
  cyclePace,
  densityOf,
  editWalk,
  editWalkNote,
  fairGuide,
  busiestGuide,
  homeZoneCount,
  setWalkRest,
  houseWing,
  lampClashCount,
  lateWalk,
  moveFocus,
  nextWalk,
  pairZoneCount,
  peakStep,
  pinFocused,
  quietStep,
  restOf,
  sharedZoneCount,
  soonWalk,
  stepGap,
  stepOf,
  suggestGuide,
  suggestLength,
  suggestWing,
  usedSteps,
  visibleWalks,
  visibleZoneCustomers,
  walksCsv,
  wingOf,
  zoneBand,
  zoneCopy,
  zoneOf,
  zoneRowsCsv,
  zoneState,
  zoneTone,
  zonesCsv,
  lampOf,
  lengthOf,
} from "../src/lib/crmv4/round202";

function main() {
  assert.equal(wingOf("  north "), "NORTH");
  assert.equal(wingOf("court"), "COURT");
  assert.equal(wingOf("south"), "SOUTH");
  assert.equal(wingOf("   "), "");
  assert.equal(wingOf("oak"), "");
  assert.equal(stepOf("1"), 1);
  assert.equal(stepOf(8), 8);
  assert.equal(stepOf("4"), 4);
  assert.equal(stepOf("0"), null);
  assert.equal(stepOf("01"), null);
  assert.equal(stepOf("9"), null);
  assert.equal(stepOf(""), null);
  assert.equal(lampOf("1"), 1);
  assert.equal(lampOf(3), 3);
  assert.equal(lampOf("9"), 9);
  assert.equal(lampOf("2"), null);
  assert.equal(lampOf("01"), null);
  assert.equal(lengthOf("10"), 10);
  assert.equal(lengthOf(20), 20);
  assert.equal(lengthOf("40"), 40);
  assert.equal(lengthOf("0"), null);
  assert.equal(lengthOf("010"), null);
  assert.equal(lengthOf("15"), null);
  assert.equal(restOf("0"), 0);
  assert.equal(restOf(10), 10);
  assert.equal(restOf("30"), 30);
  assert.equal(restOf("15"), null);
  assert.equal(peakStep(3), true);
  assert.equal(peakStep(4), true);
  assert.equal(peakStep(5), true);
  assert.equal(peakStep(1), false);
  assert.equal(quietStep(1), true);
  assert.equal(quietStep(8), true);
  assert.equal(quietStep(3), false);
  assert.equal(quietStep(4), false);
  assert.equal(stepGap(1, 8), 7);
  assert.equal(stepGap(8, 1), -7);
  assert.equal(stepGap(3, 5), 2);
  assert.equal(stepGap(5, 3), -2);
  assert.equal(stepGap(null, 8), null);
  assert.equal(stepGap(1, ""), null);
  assert.equal(stepGap(1, 0), null);
  assert.equal(activeStep("peak"), "peak");
  assert.equal(activeStep("99"), "all");
  assert.equal(activeLamp("9"), "9");
  assert.equal(activeLamp("2"), "all");
  assert.equal(activeLength("blank"), "blank");
  assert.equal(activeLength("15"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addWalk([], { id: "a", title: "Ada walk", note: "oak leaf", guide: "Nia", step: "1", wing: "north", pace: "stroll", lamp: "9", length: "10", tags: "a, b, c, d, e", rest: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].step, 1);
  assert.equal(saved[0].lamp, 9);
  assert.equal(saved[0].length, 10);
  assert.equal(saved[0].wing, "NORTH");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["a", "b", "c", "d"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseWing(saved[0].wing), true);
  assert.equal(houseWing("SOUTH"), false);
  assert.equal(soonWalk(saved[0]), true);
  assert.equal(lateWalk(saved[0], "8"), true);
  assert.equal(lateWalk(saved[0], "5"), false);
  assert.equal(lateWalk(saved[0], "4"), false);
  assert.equal(addWalk(saved, { id: "b", title: "Ada walk" }).length, 1);
  assert.equal(addWalk(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addWalk(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((walks, walk) => addWalk(walks, walk), [] as ReturnType<typeof addWalk>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((walk) => walk.title === "Line 0"), false);
  assert.equal(capped.some((walk) => walk.title === "Line 1"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cyclePace(saved, "a");
  assert.equal(cycled[0].pace, "pause");
  assert.equal(cycled[0].audit, "pace");
  assert.equal(cyclePace(cycled, "a")[0].pace, "close");
  assert.equal(cyclePace(cyclePace(cycled, "a"), "a")[0].pace, "stroll");
  const blankPace = addWalk([], { id: "z", title: "Blank pace" });
  assert.equal(cyclePace(blankPace, "z")[0].pace, "stroll");

  const edited = editWalk(saved, "a", "Bea walk");
  assert.equal(edited[0].title, "Bea walk");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editWalk(saved, "a", "   ")[0].title, "Ada walk");
  const noted = editWalkNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editWalkNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addWalk([], { id: "t", title: "Tag walk", tags: "a" });
  const tagged = addWalkTag(oneTag, "t", "b");
  assert.deepEqual(tagged[0].tags, ["a", "b"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addWalkTag(addWalkTag(addWalkTag(tagged, "t", "c"), "t", "d"), "t", "e")[0].tags.length, 4);
  assert.equal(addWalkTag(oneTag, "t", "gold")[0].tags.length, 1);

  const rested = setWalkRest(saved, "a", 10);
  assert.equal(rested[0].rest, 10);
  assert.equal(rested[0].audit, "rest");
  assert.equal(soonWalk(rested[0]), false);
  assert.equal(lateWalk(rested[0], "8"), false);
  assert.equal(setWalkRest(saved, "a", 15)[0].rest, 0);
  const pinned = pinFocused(saved, ["a"], 0);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(pinFocused(pinned, ["a"], 0)[0].pinned, false);

  const second = addWalk(saved, { id: "b", title: "Bea walk", guide: "Ada", step: "6", wing: "court", pace: "pause", lamp: "9", length: "20", tags: "a" });
  assert.equal(usedSteps(second), 2);
  assert.equal(suggestWing([]), "SOUTH");
  assert.equal(suggestLength([]), 20);
  assert.equal(suggestLength(saved), 20);
  const twoMeasured = addWalk(addWalk([], { id: "m1", title: "Measured one", length: "20" }), { id: "m2", title: "Measured two", length: "20" });
  assert.equal(suggestLength(twoMeasured), 10);
  const splitWings = addWalk(addWalk([], { id: "n", title: "North walk", wing: "north" }), { id: "s", title: "South walk", wing: "south" });
  assert.equal(suggestWing(splitWings), "COURT");
  assert.equal(suggestGuide([]), "");
  assert.equal(fairGuide(second, "Bea, Ada"), "Bea");
  assert.equal(busiestGuide(second), "Ada");
  assert.equal(nextWalk(second, ""), "");
  assert.equal(nextWalk(second, "6"), "b");
  const closedPace = cyclePace(second, "b");
  assert.equal(closedPace.find((walk) => walk.id === "b")?.pace, "close");
  assert.equal(nextWalk(closedPace, "6"), "a");
  const resting = setWalkRest(second, "b", 30);
  assert.equal(nextWalk(resting, "6"), "a");
  const shown = visibleWalks(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleWalks(second, "open", "a", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const paused = visibleWalks(second, "open", "", null, null, null, null, null, null, null, true, false, false, false, false);
  assert.equal(paused.length, 1);
  assert.equal(paused[0].id, "b");
  const house = visibleWalks(addWalk(second, { id: "g", title: "Guest walk", step: "2", wing: "south", length: "20" }), "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(house.some((walk) => walk.id === "g"), false);
  const quiet = visibleWalks(addWalk(second, { id: "d", title: "Quiet walk", step: "8", wing: "south", length: "40" }), "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(quiet.length, 2);
  assert.equal(quiet.some((walk) => walk.id === "d"), true);
  assert.equal(quiet.some((walk) => walk.id === "a"), true);
  assert.equal(quiet.some((walk) => walk.id === "b"), false);
  assert.equal(clashStepCount(second), 0);
  assert.equal(adjacentWalkCount(second), 0);
  const neighbors = addWalk(second, { id: "n", title: "Neighbor walk", step: "2", wing: "north", length: "40" });
  assert.equal(adjacentWalkCount(neighbors), 2);
  const clashed = addWalk(second, { id: "c", title: "Same step", step: "1", wing: "north", lamp: "9" });
  assert.equal(clashStepCount(clashed), 2);
  assert.equal(lampClashCount(clashed) >= 2, true);
  const views = addWalkView([], { id: "v1", name: "Peak desk", tray: "open", query: "oak", guide: "all", wing: "north", pace: "stroll", step: "peak", lamp: "9", length: "10" });
  assert.equal(views.length, 1);
  assert.equal(views[0].wing, "NORTH");
  assert.equal(addWalkView(views, { id: "v1", name: "Other", tray: "open", query: "", guide: "all", wing: "all", pace: "all", step: "all", lamp: "all", length: "all" }).length, 1);
  const csv = walksCsv(saved, "8");
  assert.equal(csv.includes("Ada walk"), true);
  assert.equal(csv.includes("NORTH"), true);
  assert.equal(csv.split("\n")[0].includes("late"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { timezone: "Europe/Istanbul" } },
    { id: "2", label: "Noa", note: { timezone: "America/New_York" } },
    { id: "3", label: "Le", note: { timezone: "Europe/London" } },
    { id: "4", label: "Holm", note: { timezone: "Asia/Dubai" } },
    { id: "5", label: "Leo", note: { timezone: "UTC" } },
    { id: "6", label: "Empty", note: { timezone: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { timezone: "Europe/Istanbul", balance: 1 } },
    { id: "9", label: "Digits", note: { timezone: "Europe/Paris1" } },
    { id: "10", label: "Stem", note: { timezone: "E" } },
    { id: "11", label: "Twin", note: { timezone: "Europe/Istanbul" } },
  ];
  assert.equal(zoneCopy(rows[0].note), "Europe/Istanbul");
  assert.equal(zoneOf(rows[0].note), "EI");
  assert.equal(zoneState(rows[0].note), "set");
  assert.equal(zoneBand(rows[0].note), "pair");
  assert.equal(zoneBand(rows[4].note), "stem");
  assert.equal(zoneOf(rows[1].note), "AN");
  assert.equal(zoneOf(rows[2].note), "EL");
  assert.equal(zoneOf(rows[3].note), "AD");
  assert.equal(zoneOf(rows[4].note), "UC");
  assert.equal(zoneOf(rows[9].note), "E");
  assert.equal(zoneTone(rows[0].note), "home");
  assert.equal(zoneTone(rows[1].note), "away");
  assert.equal(zoneTone(rows[8].note), "away");
  assert.equal(zoneTone({ timezone: "Europe" }), "home");
  assert.equal(zoneState(rows[5].note), "clear");
  assert.equal(zoneState(rows[6].note), "");
  assert.equal(zoneState(rows[7].note), "");
  assert.equal(catalogZone(rows[0].note), true);
  assert.equal(catalogZone(rows[2].note), true);
  assert.equal(catalogZone(rows[3].note), true);
  assert.equal(catalogZone(rows[1].note), false);
  assert.equal(catalogZoneCount(rows), 4);
  assert.equal(pairZoneCount(rows) >= 4, true);
  assert.equal(homeZoneCount(rows) >= 3, true);
  assert.equal(sharedZoneCount(rows), 2);
  assert.equal(visibleZoneCustomers(rows, "stem", null, "", "all", [], "all").length, 2);
  assert.equal(visibleZoneCustomers(rows, null, null, "leo", "all", [], "all").length, 1);
  const bands = zonesCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = zoneRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "gwkTitle"), ROUND202_COPY.en.gwkTitle);
  assert.equal(crmv4Text("tr", "tznTitle"), ROUND202_COPY.tr.tznTitle);
  assert.equal(crmv4Text("de", "gwkSearch"), ROUND202_COPY.de.gwkSearch);
  assert.equal(crmv4Text("ru", "tznHint"), ROUND202_COPY.ru.tznHint);
  assert.equal(crmv4Text("ar", "gwkNotice"), ROUND202_COPY.ar.gwkNotice);
  assert.notEqual(ROUND202_COPY.tr.gwkTitle, ROUND202_COPY.en.gwkTitle);
  assert.notEqual(ROUND202_COPY.de.tznTitle, ROUND202_COPY.en.tznTitle);
  assert.notEqual(ROUND202_COPY.ru.gwkSearch, ROUND202_COPY.en.gwkSearch);
  assert.notEqual(ROUND202_COPY.ar.tznSearch, ROUND202_COPY.en.tznSearch);
  const keys = Object.keys(ROUND202_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND202_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND202_COPY[locale][key as keyof typeof ROUND202_COPY.en], "string");
      assert.ok(ROUND202_COPY[locale][key as keyof typeof ROUND202_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-gwk/);
  assert.match(css, /\.c4-tzn/);
  assert.match(css, /\.c4-gwk-ledger/);
  assert.match(css, /\.c4-tzn-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round202.tsx"), "utf8");
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
  assert.match(viewFile, /timezone/);
  assert.match(viewFile, /walksCsv/);
  assert.match(viewFile, /zonesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-walks/);
  assert.match(viewFile, /data-zones/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWing/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "gwlk"/);
  assert.match(app, /view === "tzon"/);
  assert.match(app, /GalleryWalks/);
  assert.match(app, /TimezoneOffsets/);
  console.log("crmv4 round202 tests passed");
}

main();
