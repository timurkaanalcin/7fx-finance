/**
 * Orchard ladders and country marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round174.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND174_COPY } from "../src/lib/crmv4/copy-round174";
import {
  activeHold,
  activeMark,
  activePitch,
  activeRung,
  addLadder,
  addLadderView,
  bodyRung,
  bulkLadderGait,
  bulkReview,
  cycleTint,
  editLadder,
  editLadderNote,
  endRung,
  holdOf,
  isoPair,
  ladderRow,
  lateLadder,
  leadingMark,
  leadingMarkDepth,
  markBand,
  markDepth,
  markLength,
  markRowsCsv,
  markState,
  marksCsv,
  nextLadder,
  oddCodeCount,
  pitchOf,
  readLadders,
  readReviewed,
  rungGap,
  rungOf,
  suggestGait,
  suggestPicker,
  toggleReview,
  usedRungs,
  visibleLadders,
  visibleMarkCustomers,
  laddersCsv,
} from "../src/lib/crmv4/round174";

function main() {
  assert.equal(ladderRow("  KYC  "), "KYC");
  assert.equal(ladderRow("   "), "");
  assert.equal(ladderRow("z".repeat(20)).length, 6);

  assert.equal(rungOf("01"), 1);
  assert.equal(rungOf("09"), 9);
  assert.equal(rungOf("1"), 1);
  assert.equal(rungOf(9), 9);
  assert.equal(rungOf("00"), null);
  assert.equal(rungOf("10"), null);
  assert.equal(rungOf(""), null);
  assert.equal(rungOf("3.0"), null);
  assert.equal(pitchOf("01"), 1);
  assert.equal(pitchOf(5), 5);
  assert.equal(pitchOf("0"), null);
  assert.equal(pitchOf("6"), null);
  assert.equal(holdOf("6"), 6);
  assert.equal(holdOf(24), 24);
  assert.equal(holdOf("1"), null);
  assert.equal(holdOf("06"), null);
  assert.equal(endRung(1), true);
  assert.equal(endRung(9), true);
  assert.equal(endRung(2), false);
  assert.equal(bodyRung(2), true);
  assert.equal(bodyRung(8), true);
  assert.equal(bodyRung(1), false);
  assert.equal(bodyRung(9), false);
  assert.equal(rungGap(8, 1), 2);
  assert.equal(rungGap(1, 8), -2);
  assert.equal(rungGap(2, 2), 0);
  assert.equal(rungGap(1, 5), 4);
  assert.equal(rungGap(5, 1), -4);
  assert.equal(rungGap(null, 2), null);
  assert.equal(rungGap(2, ""), null);
  assert.equal(rungGap(2, 10), null);

  const saved = addLadder([], { id: "a", title: "Ladder Ada", note: "glass scan", picker: "Nia", rung: "09", gait: "step", row: "A1", tint: "dew", pitch: "01", hold: "6" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].rung, 9);
  assert.equal(saved[0].pitch, 1);
  assert.equal(saved[0].hold, 6);
  assert.equal(saved[0].note, "glass scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addLadder(saved, { id: "b", title: "Ladder Ada" }).length, 1);
  assert.equal(addLadder(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addLadder(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 11 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addLadder(cards, card), [] as ReturnType<typeof addLadder>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 10");

  const cycled = cycleTint(saved, "a");
  assert.equal(cycled[0].tint, "amber");
  assert.equal(cycled[0].audit, "tint");
  assert.equal(cycleTint(cycled, "a")[0].tint, "garnet");
  assert.equal(cycleTint(cycleTint(cycled, "a"), "a")[0].tint, "dew");
  const blankTint = addLadder([], { id: "z", title: "Blank tint" });
  assert.equal(cycleTint(blankTint, "z")[0].tint, "dew");

  const edited = editLadder(saved, "a", "Ladder Bea");
  assert.equal(edited[0].title, "Ladder Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editLadder(edited, "a", "  ")[0].title, "Ladder Bea");
  const noted = editLadderNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editLadderNote(noted, "a", "  ")[0].note, "second look");
  const pair = addLadder(noted, { id: "b", title: "Keep" });
  assert.equal(editLadder(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Ladder Bea");

  const moved = bulkLadderGait(pair, ["a"], "climb");
  assert.equal(moved.find((card) => card.id === "a")?.gait, "climb");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkLadderGait(moved, ["a"], "climb").find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkLadderGait(moved, ["a"], "attic").find((card) => card.id === "a")?.gait, "climb");

  const mixed = [
    ...addLadder([], { id: "live", title: "Live", note: "glass scan", picker: "Nia", rung: 2, gait: "step", row: "A1", tint: "dew", pitch: 1, hold: 12 }),
  ];
  assert.equal(visibleLadders(mixed, "open", "glass", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleLadders(mixed, "open", "a1", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleLadders(mixed, "open", "nia", null, null, null, null, null, null, null, null, false, false).length, 0);
  const climbed = mixed.map((card) => (card.id === "live" ? { ...card, climbed: true } : card));
  const filed = mixed.map((card) => ({ ...card, filed: true, climbed: true }));
  assert.equal(visibleLadders(mixed, "open", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleLadders(climbed, "climbed", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleLadders(climbed, "open", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleLadders(filed, "filed", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleLadders(filed, "climbed", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(lateLadder(mixed[0], 6), true);
  assert.equal(lateLadder(mixed[0], 5), false);
  assert.equal(suggestGait([]), "step");
  assert.equal(suggestGait(mixed), "climb");
  assert.equal(suggestPicker([]), "");
  assert.equal(suggestPicker(mixed), "Nia");
  const loaded = addLadder(mixed, { id: "bea", title: "Bea", picker: "Bea", rung: 3, gait: "climb", tint: "dew" });
  assert.equal(suggestPicker(loaded), "Bea");
  assert.equal(usedRungs(mixed), 1);
  assert.equal(usedRungs(loaded), 2);
  assert.equal(nextLadder(mixed, 2), "live");
  assert.equal(nextLadder(mixed.map((card) => ({ ...card, tint: "garnet" })), 2), "");
  assert.equal(nextLadder(mixed, 8), "live");
  const csv = laddersCsv(mixed, 6);
  assert.equal(csv.startsWith("title,picker,rung,gait,row,tint,pitch,hold,band,pinned,climbed,filed,gap,late,note,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  assert.equal(readLadders(mixed)[0].rung, 2);
  const views = addLadderView([], { id: "v", name: "Morning", tray: "open", query: "ada", picker: "all", gait: "step", row: "all", tint: "all", rung: "low", pitch: "1", hold: "6" });
  assert.equal(views.length, 1);
  assert.equal(views[0].rung, "low");
  assert.equal(views[0].pitch, "1");
  assert.equal(views[0].hold, "6");
  assert.equal(activeRung("10"), "all");
  assert.equal(activeRung("09"), "9");
  assert.equal(activeRung("low"), "low");
  assert.equal(activeHold("06"), "all");
  assert.equal(activePitch("05"), "5");
  const viewCap = Array.from({ length: 8 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", picker: "all", gait: "all", row: "all", tint: "all", rung: "all", pitch: "all", hold: "all" })).reduce((rows, view) => addLadderView(rows, view), [] as ReturnType<typeof addLadderView>);
  assert.equal(viewCap.length, 6);

  assert.equal(markState(""), "clear");
  assert.equal(markState("   "), "clear");
  assert.equal(markState(null), "");
  assert.equal(markState(0), "");
  assert.equal(markState("0"), "set");
  assert.equal(markLength("0"), 1);
  assert.equal(markState({ lastCountry: "DE" }), "set");
  assert.equal(markState({ lastCountry: "" }), "clear");
  assert.equal(markState({ lastCountry: null }), "clear");
  assert.equal(markState({ name: "Ada", lastCountry: "DE" }), "");
  assert.equal(markState({ failedLoginCount: 1, lastCountry: "DE" }), "");
  assert.equal(markState({ lastSeenAt: "2026-11-10T11:50:00.000Z", lastCountry: "DE" }), "");
  assert.equal(markBand("T"), "mote");
  assert.equal(markDepth("T"), "far");
  assert.equal(markBand("TR"), "pair");
  assert.equal(markDepth("TR"), "far");
  assert.equal(markBand("DE"), "pair");
  assert.equal(markDepth("DE"), "near");
  assert.equal(markBand("JP"), "pair");
  assert.equal(markDepth("JP"), "mid");
  assert.equal(markBand("USA"), "span");
  assert.equal(markDepth("USA"), "far");
  assert.equal(markBand("TURKEY"), "name");
  assert.equal(markDepth("TURKEY"), "far");
  assert.equal(markBand(""), "");
  assert.equal(isoPair("TR"), true);
  assert.equal(isoPair("tr"), true);
  assert.equal(isoPair("T1"), false);
  assert.equal(isoPair("USA"), false);
  assert.equal(isoPair(""), false);
  const rows = [
    { id: "ada", note: "Hi", label: "Ada" },
    { id: "ann", note: "", label: "Ann" },
    { id: "bea", note: null, label: "Beatrice" },
    { id: "belle", note: "a".repeat(90), label: "Annabelle Marie" },
  ];
  assert.equal(leadingMark(rows), "pair");
  assert.equal(leadingMarkDepth(rows), "near");
  assert.equal(oddCodeCount(rows), 1);
  assert.equal(visibleMarkCustomers(rows, "blank", null, "", "all", [], "all").length, 1);
  assert.equal(visibleMarkCustomers(rows, "name", null, "", "all", [], "all").length, 1);
  assert.equal(visibleMarkCustomers(rows, null, null, "bea", "all", [], "all").length, 1);
  assert.equal(visibleMarkCustomers(rows, null, null, "90", "all", [], "all").length, 0);
  assert.equal(visibleMarkCustomers(rows, null, null, "", "reviewed", ["ada"], "all").length, 1);
  assert.equal(visibleMarkCustomers(rows, null, null, "", "open", ["ada"], "all").length, 3);
  assert.equal(visibleMarkCustomers(rows, null, null, "", "all", [], "odd").length, 1);
  assert.equal(visibleMarkCustomers(rows, null, null, "", "all", [], "pair").length, 1);
  assert.deepEqual(toggleReview([], "ada", ["ada", "ann"]), ["ada"]);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  const names = marksCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(marksCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",pair,"), true);
  const queue = markRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,length,pair,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeMark("gone", ["pair"]), "all");

  const copy = Object.keys(ROUND174_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND174_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "ldrTitle"), "Orchard ladders");
  assert.equal(crmv4Text("tr", "ctyTitle"), ROUND174_COPY.tr.ctyTitle);
  assert.equal(crmv4Text("de", "ldrPicker"), ROUND174_COPY.de.ldrPicker);
  assert.equal(crmv4Text("ru", "ctyUnmarked"), ROUND174_COPY.ru.ctyUnmarked);
  assert.equal(crmv4Text("ar", "ldrNotice"), ROUND174_COPY.ar.ldrNotice);
  assert.notEqual(ROUND174_COPY.tr.ldrTitle, ROUND174_COPY.en.ldrTitle);
  assert.notEqual(ROUND174_COPY.de.ctyTitle, ROUND174_COPY.en.ctyTitle);
  assert.notEqual(ROUND174_COPY.ru.ldrSearch, ROUND174_COPY.en.ldrSearch);
  assert.notEqual(ROUND174_COPY.ar.ctySearch, ROUND174_COPY.en.ctySearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-ldr/);
  assert.match(css, /\.c4-cty/);
  assert.match(css, /\.c4-cust-ladder/);
  assert.match(css, /\.c4-pagehead-ladder/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round174.tsx"), "utf8");
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
  assert.match(viewFile, /lastCountry/);
  assert.match(viewFile, /laddersCsv/);
  assert.match(viewFile, /marksCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-ladders/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestGait/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ladder"/);
  assert.match(app, /view === "ctmark"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-ladder/);
  console.log("crmv4 round174 tests passed");
}

main();
