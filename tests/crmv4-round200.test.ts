/**
 * Atelier sittings and surname crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round200.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND200_COPY } from "../src/lib/crmv4/copy-round200";
import {
  activeHour,
  activeLight,
  activeStay,
  addSitting,
  addSittingTag,
  addSittingView,
  busiestHost,
  catalogCrest,
  catalogCrestCount,
  clashHourCount,
  crestBand,
  crestCopy,
  crestOf,
  crestRowsCsv,
  crestState,
  crestTone,
  crestsCsv,
  cycleStage,
  densityOf,
  editSitting,
  editSittingNote,
  fairHost,
  giltCrestCount,
  hourGap,
  hourOf,
  houseRoom,
  lateSitting,
  lightClashCount,
  lightOf,
  moveFocus,
  nextSitting,
  pairCrestCount,
  pauseOf,
  peakHour,
  quietHour,
  roomOf,
  setSittingPause,
  sharedCrestCount,
  sittingsCsv,
  soonSitting,
  stayOf,
  suggestHost,
  suggestRoom,
  suggestStay,
  usedHours,
  visibleCrestCustomers,
  visibleSittings,
} from "../src/lib/crmv4/round200";

function main() {
  assert.equal(roomOf("  ivory "), "IVORY");
  assert.equal(roomOf("graphite"), "GRAPHITE");
  assert.equal(roomOf("champagne"), "CHAMPAGNE");
  assert.equal(roomOf("   "), "");
  assert.equal(roomOf("oak"), "");
  assert.equal(hourOf("8"), 8);
  assert.equal(hourOf(18), 18);
  assert.equal(hourOf("12"), 12);
  assert.equal(hourOf("7"), null);
  assert.equal(hourOf("08"), null);
  assert.equal(hourOf("19"), null);
  assert.equal(hourOf(""), null);
  assert.equal(lightOf("1"), 1);
  assert.equal(lightOf(3), 3);
  assert.equal(lightOf("5"), 5);
  assert.equal(lightOf("2"), null);
  assert.equal(lightOf("01"), null);
  assert.equal(stayOf("20"), 20);
  assert.equal(stayOf(40), 40);
  assert.equal(stayOf("60"), 60);
  assert.equal(stayOf("0"), null);
  assert.equal(stayOf("020"), null);
  assert.equal(stayOf("30"), null);
  assert.equal(pauseOf("0"), 0);
  assert.equal(pauseOf(20), 20);
  assert.equal(pauseOf("40"), 40);
  assert.equal(pauseOf("10"), null);
  assert.equal(peakHour(10), true);
  assert.equal(peakHour(12), true);
  assert.equal(peakHour(16), true);
  assert.equal(peakHour(8), false);
  assert.equal(quietHour(8), true);
  assert.equal(quietHour(18), true);
  assert.equal(quietHour(10), false);
  assert.equal(quietHour(12), false);
  assert.equal(hourGap(8, 12), 4);
  assert.equal(hourGap(12, 8), -4);
  assert.equal(hourGap(10, 12), 2);
  assert.equal(hourGap(16, 12), -4);
  assert.equal(hourGap(null, 12), null);
  assert.equal(hourGap(8, ""), null);
  assert.equal(hourGap(8, 7), null);
  assert.equal(activeHour("peak"), "peak");
  assert.equal(activeHour("99"), "all");
  assert.equal(activeLight("3"), "3");
  assert.equal(activeLight("2"), "all");
  assert.equal(activeStay("blank"), "blank");
  assert.equal(activeStay("30"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addSitting([], { id: "a", title: "Ada sitting", note: "oak leaf", host: "Nia", hour: "8", room: "ivory", stage: "listed", light: "5", stay: "20", tags: "a, b, c, d", pause: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].hour, 8);
  assert.equal(saved[0].light, 5);
  assert.equal(saved[0].stay, 20);
  assert.equal(saved[0].room, "IVORY");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["a", "b", "c"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseRoom(saved[0].room), true);
  assert.equal(houseRoom("GRAPHITE"), false);
  assert.equal(soonSitting(saved[0]), true);
  assert.equal(lateSitting(saved[0], "12"), true);
  assert.equal(lateSitting(saved[0], "10"), false);
  assert.equal(addSitting(saved, { id: "b", title: "Ada sitting" }).length, 1);
  assert.equal(addSitting(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSitting(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((sittings, sitting) => addSitting(sittings, sitting), [] as ReturnType<typeof addSitting>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((sitting) => sitting.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleStage(saved, "a");
  assert.equal(cycled[0].stage, "greeted");
  assert.equal(cycled[0].audit, "stage");
  assert.equal(cycleStage(cycled, "a")[0].stage, "seated");
  assert.equal(cycleStage(cycleStage(cycled, "a"), "a")[0].stage, "listed");
  const blankStage = addSitting([], { id: "z", title: "Blank stage" });
  assert.equal(cycleStage(blankStage, "z")[0].stage, "listed");

  const edited = editSitting(saved, "a", "Bea sitting");
  assert.equal(edited[0].title, "Bea sitting");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSitting(saved, "a", "   ")[0].title, "Ada sitting");
  const noted = editSittingNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editSittingNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addSitting([], { id: "t", title: "Tag sitting", tags: "a" });
  const tagged = addSittingTag(oneTag, "t", "b");
  assert.deepEqual(tagged[0].tags, ["a", "b"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addSittingTag(addSittingTag(tagged, "t", "c"), "t", "d")[0].tags.length, 3);
  assert.equal(addSittingTag(oneTag, "t", "gold")[0].tags.length, 1);

  const paused = setSittingPause(saved, "a", 20);
  assert.equal(paused[0].pause, 20);
  assert.equal(paused[0].audit, "pause");
  assert.equal(soonSitting(paused[0]), false);
  assert.equal(lateSitting(paused[0], "12"), false);
  assert.equal(setSittingPause(saved, "a", 10)[0].pause, 0);

  const second = addSitting(saved, { id: "b", title: "Bea sitting", host: "Ada", hour: "14", room: "graphite", stage: "greeted", light: "5", stay: "40", tags: "a" });
  assert.equal(usedHours(second), 2);
  assert.equal(suggestRoom([]), "GRAPHITE");
  assert.equal(suggestStay([]), 40);
  assert.equal(suggestHost([]), "");
  assert.equal(fairHost(second, "Bea, Ada"), "Bea");
  assert.equal(busiestHost(second), "Ada");
  assert.equal(nextSitting(second, ""), "");
  assert.equal(nextSitting(second, "12"), "b");
  const seated = cycleStage(second, "b");
  assert.equal(seated.find((sitting) => sitting.id === "b")?.stage, "seated");
  assert.equal(nextSitting(seated, "12"), "a");
  const resting = setSittingPause(second, "b", 40);
  assert.equal(nextSitting(resting, "12"), "a");
  const shown = visibleSittings(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleSittings(second, "open", "a", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleSittings(second, "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 1);
  assert.equal(house[0].id, "a");
  const quiet = visibleSittings(addSitting(second, { id: "d", title: "Quiet sitting", hour: "18", room: "champagne", stay: "60" }), "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(quiet.length, 2);
  assert.equal(quiet.some((sitting) => sitting.id === "d"), true);
  assert.equal(quiet.some((sitting) => sitting.id === "a"), true);
  assert.equal(quiet.some((sitting) => sitting.id === "b"), false);
  assert.equal(clashHourCount(second), 0);
  const clashed = addSitting(second, { id: "c", title: "Same hour", hour: "8", room: "ivory", light: "5" });
  assert.equal(clashHourCount(clashed), 2);
  assert.equal(lightClashCount(clashed) >= 2, true);
  const views = addSittingView([], { id: "v1", name: "Peak desk", tray: "open", query: "oak", host: "all", room: "ivory", stage: "listed", hour: "peak", light: "5", stay: "20" });
  assert.equal(views.length, 1);
  assert.equal(views[0].room, "IVORY");
  assert.equal(addSittingView(views, { id: "v1", name: "Other", tray: "open", query: "", host: "all", room: "all", stage: "all", hour: "all", light: "all", stay: "all" }).length, 1);
  const csv = sittingsCsv(saved, "12");
  assert.equal(csv.includes("Ada sitting"), true);
  assert.equal(csv.includes("IVORY"), true);
  assert.equal(csv.split("\n")[0].includes("late"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada Ann", note: { name: "Ada Ann" } },
    { id: "2", label: "Bea Esther", note: { name: "Bea Esther" } },
    { id: "3", label: "Cara On", note: { name: "Cara On" } },
    { id: "4", label: "Noa Holm", note: { name: "Noa Holm" } },
    { id: "5", label: "Paris", note: { name: "Paris" } },
    { id: "6", label: "Empty", note: { name: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { name: "Ada Ann", balance: 1 } },
    { id: "9", label: "Digits", note: { name: "Ada 123" } },
    { id: "10", label: "Seed", note: { name: "A" } },
  ];
  assert.equal(crestCopy(rows[0].note), "Ada Ann");
  assert.equal(crestOf(rows[0].note), "AN");
  assert.equal(crestState(rows[0].note), "set");
  assert.equal(crestBand(rows[0].note), "pair");
  assert.equal(crestBand(rows[9].note), "seed");
  assert.equal(crestOf(rows[1].note), "ER");
  assert.equal(crestOf(rows[2].note), "ON");
  assert.equal(crestOf(rows[3].note), "HM");
  assert.equal(crestTone(rows[0].note), "gilt");
  assert.equal(crestTone(rows[3].note), "ink");
  assert.equal(crestState(rows[5].note), "clear");
  assert.equal(crestState(rows[6].note), "");
  assert.equal(crestState(rows[7].note), "");
  assert.equal(crestState(rows[8].note), "set");
  assert.equal(crestOf(rows[8].note), "");
  assert.equal(catalogCrest(rows[0].note), true);
  assert.equal(catalogCrest(rows[1].note), true);
  assert.equal(catalogCrest(rows[2].note), true);
  assert.equal(catalogCrest(rows[3].note), false);
  assert.equal(catalogCrestCount(rows), 3);
  assert.equal(pairCrestCount(rows) >= 4, true);
  assert.equal(giltCrestCount(rows) >= 3, true);
  assert.equal(sharedCrestCount(rows), 0);
  assert.equal(visibleCrestCustomers(rows, "seed", null, "", "all", [], "all").length, 1);
  assert.equal(visibleCrestCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = crestsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = crestRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada Ann"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "sitTitle"), ROUND200_COPY.en.sitTitle);
  assert.equal(crmv4Text("tr", "crsTitle"), ROUND200_COPY.tr.crsTitle);
  assert.equal(crmv4Text("de", "sitSearch"), ROUND200_COPY.de.sitSearch);
  assert.equal(crmv4Text("ru", "crsHint"), ROUND200_COPY.ru.crsHint);
  assert.equal(crmv4Text("ar", "sitNotice"), ROUND200_COPY.ar.sitNotice);
  assert.notEqual(ROUND200_COPY.tr.sitTitle, ROUND200_COPY.en.sitTitle);
  assert.notEqual(ROUND200_COPY.de.crsTitle, ROUND200_COPY.en.crsTitle);
  assert.notEqual(ROUND200_COPY.ru.sitSearch, ROUND200_COPY.en.sitSearch);
  assert.notEqual(ROUND200_COPY.ar.crsSearch, ROUND200_COPY.en.crsSearch);
  const keys = Object.keys(ROUND200_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND200_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND200_COPY[locale][key as keyof typeof ROUND200_COPY.en], "string");
      assert.ok(ROUND200_COPY[locale][key as keyof typeof ROUND200_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-sit/);
  assert.match(css, /\.c4-crs/);
  assert.match(css, /\.c4-sit-ledger/);
  assert.match(css, /\.c4-crs-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round200.tsx"), "utf8");
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
  assert.match(viewFile, /name/);
  assert.match(viewFile, /sittingsCsv/);
  assert.match(viewFile, /crestsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-sittings/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestRoom/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "sitt"/);
  assert.match(app, /view === "crst"/);
  assert.match(app, /AtelierSittings/);
  assert.match(app, /SurnameCrests/);
  console.log("crmv4 round200 tests passed");
}

main();
