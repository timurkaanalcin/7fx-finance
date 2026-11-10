/**
 * Herbarium sheets and address lanes.
 * Run: TZ=UTC npx tsx tests/crmv4-round176.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND176_COPY } from "../src/lib/crmv4/copy-round176";
import {
  activeGrade,
  activeLane,
  activeWidth,
  addSheet,
  addSheetView,
  bloomDay,
  bulkReview,
  bulkSheetPress,
  cycleInk,
  dayGap,
  dayOf,
  editSheet,
  editSheetNote,
  gradeOf,
  hashLane,
  laneBand,
  laneDepth,
  laneDigits,
  laneRowsCsv,
  laneState,
  lanesCsv,
  lateSheet,
  leadingLane,
  leadingLaneDepth,
  leafDay,
  nextSheet,
  oddLaneCount,
  partnerShelf,
  readReviewed,
  readSheets,
  sheetShelf,
  sheetsCsv,
  soonSheet,
  suggestKeeper,
  suggestPress,
  suggestWidth,
  toggleReview,
  usedDays,
  visibleLaneCustomers,
  visibleSheets,
  widthOf,
} from "../src/lib/crmv4/round176";

function main() {
  assert.equal(sheetShelf("  bay  "), "BAY");
  assert.equal(sheetShelf("   "), "");
  assert.equal(sheetShelf("z".repeat(20)).length, 6);

  assert.equal(dayOf("01"), 1);
  assert.equal(dayOf("07"), 7);
  assert.equal(dayOf("1"), 1);
  assert.equal(dayOf(7), 7);
  assert.equal(dayOf("00"), null);
  assert.equal(dayOf("08"), null);
  assert.equal(dayOf("8"), null);
  assert.equal(dayOf(""), null);
  assert.equal(dayOf("3.0"), null);
  assert.equal(gradeOf("01"), 1);
  assert.equal(gradeOf(3), 3);
  assert.equal(gradeOf("0"), null);
  assert.equal(gradeOf("4"), null);
  assert.equal(widthOf("4"), 4);
  assert.equal(widthOf(6), 6);
  assert.equal(widthOf("1"), null);
  assert.equal(widthOf("02"), null);
  assert.equal(widthOf(8), null);
  assert.equal(bloomDay(1), true);
  assert.equal(bloomDay(7), true);
  assert.equal(bloomDay(2), false);
  assert.equal(leafDay(3), true);
  assert.equal(leafDay(5), true);
  assert.equal(leafDay(2), false);
  assert.equal(leafDay(6), false);
  assert.equal(dayGap(6, 1), 2);
  assert.equal(dayGap(1, 6), -2);
  assert.equal(dayGap(2, 2), 0);
  assert.equal(dayGap(1, 4), 3);
  assert.equal(dayGap(4, 1), -3);
  assert.equal(dayGap(null, 2), null);
  assert.equal(dayGap(2, ""), null);
  assert.equal(dayGap(2, 8), null);

  const saved = addSheet([], { id: "a", title: "Sheet Ada", note: "glass scan", keeper: "Nia", day: "07", press: "flat", shelf: "ib1", ink: "ash", grade: "01", width: "2" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].day, 7);
  assert.equal(saved[0].grade, 1);
  assert.equal(saved[0].width, 2);
  assert.equal(saved[0].shelf, "IB1");
  assert.equal(saved[0].note, "glass scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(partnerShelf(saved[0].shelf), true);
  assert.equal(soonSheet(saved[0]), true);
  assert.equal(addSheet(saved, { id: "b", title: "Sheet Ada" }).length, 1);
  assert.equal(addSheet(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSheet(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 11 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addSheet(cards, card), [] as ReturnType<typeof addSheet>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 10");

  const cycled = cycleInk(saved, "a");
  assert.equal(cycled[0].ink, "straw");
  assert.equal(cycled[0].audit, "ink");
  assert.equal(cycleInk(cycled, "a")[0].ink, "soot");
  assert.equal(cycleInk(cycleInk(cycled, "a"), "a")[0].ink, "ash");
  const blankInk = addSheet([], { id: "z", title: "Blank ink" });
  assert.equal(cycleInk(blankInk, "z")[0].ink, "ash");

  const edited = editSheet(saved, "a", "Sheet Bea");
  assert.equal(edited[0].title, "Sheet Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSheet(edited, "a", "  ")[0].title, "Sheet Bea");
  const noted = editSheetNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editSheetNote(noted, "a", "  ")[0].note, "second look");
  const pair = addSheet(noted, { id: "b", title: "Keep" });
  assert.equal(editSheet(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Sheet Bea");

  const open = addSheet(addSheet([], { id: "a", title: "Early", day: "1", press: "flat", width: "4" }), { id: "b", title: "Later", day: "6", press: "roll", ink: "soot" });
  assert.equal(lateSheet(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateSheet(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  assert.equal(lateSheet({ ...open[0], pressed: true }, 4), false);
  assert.equal(nextSheet(open, 2), open.find((card) => card.title === "Early")?.id);
  assert.equal(nextSheet(open, 1), open.find((card) => card.ink !== "soot")?.id);
  assert.equal(suggestPress([]), "flat");
  assert.equal(suggestPress(open), "fold");
  assert.equal(suggestKeeper(addSheet(open, { id: "c", title: "Quiet", keeper: "Ada", press: "fold" })), "Ada");
  assert.equal(suggestWidth([]), 4);
  assert.equal(suggestWidth(open), 2);
  assert.equal(usedDays(open), 2);
  assert.equal(bulkSheetPress(open, ["b"], "fold").find((card) => card.id === "b")?.press, "fold");
  assert.equal(bulkSheetPress(open, ["b"], "fold").find((card) => card.id === "b")?.audit, "shift");
  const shown = visibleSheets(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = sheetsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,keeper,day,press,shelf,ink,grade,width,band,pinned,pressed,filed,gap,late,soon,partner,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Sheet Ada"), true);
  assert.equal(activeGrade("4"), "all");
  assert.equal(activeGrade("03"), "3");
  assert.equal(activeWidth("02"), "all");
  assert.equal(activeWidth("6"), "6");
  const views = Array.from({ length: 6 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    keeper: "all",
    press: "all",
    shelf: "all",
    ink: "all",
    day: "all",
    grade: "all",
    width: "all",
  })).reduce((list, view) => addSheetView(list, view), [] as ReturnType<typeof addSheetView>);
  assert.equal(views.length, 5);
  assert.equal(readSheets(saved)[0].title, "Sheet Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "12 Oak" },
    { id: "ann", label: "Ann", note: "100 Market Street, Floor 2" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { address: null } },
    { id: "dee", label: "Dee", note: { address: "12", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "12 #4" },
  ];
  assert.equal(laneState(rows[0].note), "set");
  assert.equal(laneBand(rows[0].note), "brief");
  assert.equal(laneDepth(rows[0].note), "near");
  assert.equal(laneDigits(rows[0].note), "12");
  assert.equal(hashLane(rows[0].note), false);
  assert.equal(laneBand(rows[1].note), "street");
  assert.equal(laneDepth(rows[1].note), "mid");
  assert.equal(laneBand("a".repeat(70)), "atlas");
  assert.equal(laneDepth("a".repeat(70)), "near");
  assert.equal(laneState(""), "clear");
  assert.equal(laneState({ address: null }), "clear");
  assert.equal(laneState({ address: "12", saleStatus: "x" }), "");
  assert.equal(laneState(12), "");
  assert.equal(hashLane(rows[5].note), true);
  assert.equal(oddLaneCount(rows), 1);
  assert.equal(leadingLane(rows), "brief");
  assert.equal(leadingLaneDepth(rows), "near");
  assert.equal(visibleLaneCustomers(rows, "brief", null, "", "all", [], "all").length, 2);
  assert.equal(visibleLaneCustomers(rows, null, null, "ann", "all", [], "hash").length, 0);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = lanesCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(lanesCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",brief,"), true);
  const queue = laneRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,parts,hash,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeLane("gone", ["brief"]), "all");

  const copy = Object.keys(ROUND176_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND176_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "hbrTitle"), "Herbarium sheets");
  assert.equal(crmv4Text("tr", "alnTitle"), ROUND176_COPY.tr.alnTitle);
  assert.equal(crmv4Text("de", "hbrKeeper"), ROUND176_COPY.de.hbrKeeper);
  assert.equal(crmv4Text("ru", "alnUnmarked"), ROUND176_COPY.ru.alnUnmarked);
  assert.equal(crmv4Text("ar", "hbrNotice"), ROUND176_COPY.ar.hbrNotice);
  assert.notEqual(ROUND176_COPY.tr.hbrTitle, ROUND176_COPY.en.hbrTitle);
  assert.notEqual(ROUND176_COPY.de.alnTitle, ROUND176_COPY.en.alnTitle);
  assert.notEqual(ROUND176_COPY.ru.hbrSearch, ROUND176_COPY.en.hbrSearch);
  assert.notEqual(ROUND176_COPY.ar.alnSearch, ROUND176_COPY.en.alnSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hbr/);
  assert.match(css, /\.c4-aln/);
  assert.match(css, /\.c4-logs-herb/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round176.tsx"), "utf8");
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
  assert.match(viewFile, /address/);
  assert.match(viewFile, /sheetsCsv/);
  assert.match(viewFile, /lanesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-sheets/);
  assert.match(viewFile, /data-lanes/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestPress/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hbrms"/);
  assert.match(app, /view === "alane"/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-herb/);
  console.log("crmv4 round176 tests passed");
}

main();
