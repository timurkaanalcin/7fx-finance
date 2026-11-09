/**
 * Ribbon cards and invalid reasons.
 * Run: npx tsx tests/crmv4-round143.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND143_COPY } from "../src/lib/crmv4/copy-round143";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeFamily,
  activeGrade,
  activeHour,
  activeLane,
  activeLength,
  activeReason,
  activeReasonMark,
  activeSeal,
  activeSteward,
  addRibbon,
  addRibbonView,
  bulkRibbonDone,
  bulkRibbonPinned,
  dayQuarterCounts,
  dropRibbonView,
  editRibbon,
  familyArg,
  familyOf,
  gradeArg,
  hourArg,
  hourBand,
  hourCount,
  hourGap,
  hourQuarter,
  laneArg,
  laneOf,
  leadingFamily,
  leadingLength,
  leadingReason,
  leadingReasonMark,
  lengthArg,
  lengthOf,
  namedFamilies,
  namedLengths,
  namedReasonMarks,
  namedReasons,
  nextRibbon,
  gradeOf,
  readHiddenReasons,
  readRibbonViews,
  readRibbons,
  reasonMarkArg,
  reasonMarkOf,
  reasonShare,
  reasonText,
  reasonsCsv,
  resetRibbons,
  ribbonClashIds,
  ribbonCopy,
  ribbonCounts,
  ribbonGrades,
  ribbonLanes,
  ribbonSeals,
  ribbonShare,
  ribbonStewards,
  ribbonText,
  ribbonTimeline,
  ribbonsCsv,
  sealArg,
  sealTag,
  setRibbonDone,
  setRibbonHeld,
  setRibbonPinned,
  stepRibbonGrade,
  stewardArg,
  stewardLabel,
  toggleReason,
  visibleReasonCustomers,
  visibleReasons,
  visibleRibbons,
  lengthLines,
} from "../src/lib/crmv4/round143";

function main() {
  assert.equal(ribbonText("  Call\nAda  "), "Call Ada");
  assert.equal(ribbonText("   "), "");
  assert.equal(ribbonText("x".repeat(120)).length, 72);
  assert.equal(stewardLabel("  North  "), "North");
  assert.equal(stewardLabel("   "), "");
  assert.equal(stewardLabel("y".repeat(40)).length, 16);
  assert.equal(sealTag("  VIP  "), "VIP");
  assert.equal(sealTag("   "), "");
  assert.equal(sealTag("z".repeat(30)).length, 10);
  assert.equal(hourCount(" 0 "), 0);
  assert.equal(hourCount(0), 0);
  assert.equal(hourCount(23), 23);
  assert.equal(hourCount("7"), 7);
  assert.equal(hourCount(""), null);
  assert.equal(hourCount("00"), null);
  assert.equal(hourCount(24), null);
  assert.equal(hourCount(-1), null);
  assert.equal(laneOf(" FLOOR "), "floor");
  assert.equal(laneOf("mezz"), "mezz");
  assert.equal(laneOf("loft"), "loft");
  assert.equal(laneOf("roof"), "roof");
  assert.equal(laneOf(""), "blank");
  assert.equal(laneOf("up"), "blank");
  assert.equal(gradeOf(" FIRM "), "firm");
  assert.equal(gradeOf("plain"), "plain");
  assert.equal(gradeOf("bold"), "bold");
  assert.equal(gradeOf(""), "blank");
  assert.equal(gradeOf("loud"), "blank");
  assert.equal(hourBand(null), "blank");
  assert.equal(hourBand(0), "dawn");
  assert.equal(hourBand(7), "dawn");
  assert.equal(hourBand(8), "day");
  assert.equal(hourBand(15), "day");
  assert.equal(hourBand(16), "dusk");
  assert.equal(hourBand(23), "dusk");
  assert.equal(hourQuarter(null), "blank");
  assert.equal(hourQuarter(0), "q1");
  assert.equal(hourQuarter(5), "q1");
  assert.equal(hourQuarter(6), "q2");
  assert.equal(hourQuarter(11), "q2");
  assert.equal(hourQuarter(12), "q3");
  assert.equal(hourQuarter(17), "q3");
  assert.equal(hourQuarter(18), "q4");
  assert.equal(hourQuarter(23), "q4");
  assert.equal(hourGap(3, 8), 5);
  assert.equal(hourGap(8, 3), -5);
  assert.equal(hourGap(0, 0), 0);
  assert.equal(hourGap(null, 3), null);
  assert.equal(hourGap(3, ""), null);
  assert.deepEqual(readRibbons([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Call Ada", steward: "  ", hour: 24, lane: "up", seal: "  ", grade: "loud", pinned: 1, done: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Call Ada", steward: "", hour: null, lane: "", seal: "", grade: "", pinned: false, done: false, held: false, audit: "" },
  ]);
  assert.equal(readRibbons([{ id: "z", text: "Zero", hour: 0 }])[0].hour, 0);
  const saved = addRibbon([], { id: "a", text: "Call Ada", steward: "Nia", hour: 0, lane: "floor", seal: "VIP", grade: "firm" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].hour, 0);
  assert.equal(saved[0].lane, "floor");
  assert.equal(saved[0].grade, "firm");
  assert.equal(addRibbon(saved, { id: "b", text: "Call Ada" }).length, 1);
  assert.equal(addRibbon(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addRibbon(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepRibbonGrade(saved, "a", 1);
  assert.equal(raised[0].grade, "bold");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepRibbonGrade(raised, "a", 1)[0].grade, "bold");
  assert.equal(stepRibbonGrade([{ ...saved[0], grade: "" }], "a", -1)[0].grade, "");
  const pinned = setRibbonPinned(saved, "a", true);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(setRibbonPinned(pinned, "a", false)[0].audit, "unpin");
  const held = setRibbonHeld(saved, "a", true);
  assert.equal(held[0].held, true);
  assert.equal(held[0].audit, "hold");
  assert.equal(setRibbonHeld(held, "a", false)[0].audit, "release");
  const done = setRibbonDone(saved, "a", true);
  assert.equal(done[0].done, true);
  assert.equal(done[0].audit, "done");
  assert.equal(setRibbonDone(done, "a", false)[0].audit, "reopen");
  assert.equal(editRibbon(saved, "a", "  ")[0].text, "Call Ada");
  assert.equal(editRibbon(addRibbon(saved, { id: "b", text: "Other" }), "a", "Other").find((ribbon) => ribbon.id === "a")?.text, "Call Ada");
  assert.equal(editRibbon(saved, "a", "Ring Ada")[0].audit, "edit");
  const pair = addRibbon(saved, { id: "b", text: "Ring", hour: 10, lane: "floor" });
  assert.equal(bulkRibbonPinned(pair, ["a", "b"], true).every((ribbon) => ribbon.pinned), true);
  assert.equal(bulkRibbonDone(pair, ["b"], true).find((ribbon) => ribbon.id === "b")?.done, true);
  assert.deepEqual(resetRibbons(), []);
  assert.equal(ribbonCopy("  Call Ada "), "Call Ada");
  assert.equal(ribbonCopy(" "), "");
  const open = visibleRibbons(pair, "open", "call", null, null, null, null, null, null, false, false, "");
  assert.equal(open.length, 1);
  assert.equal(open[0].id, "a");
  assert.equal(visibleRibbons(held, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleRibbons(done, "done", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleRibbons(done, "open", "", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleRibbons(pair, "open", "", "", null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleRibbons(pair, "open", "", "Nia", "floor", "VIP", "firm", 0, null, false, false, "").length, 1);
  assert.equal(visibleRibbons(pair, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleRibbons(raised, "open", "", null, null, null, null, null, null, true, false, "").length, 1);
  assert.equal(visibleRibbons(saved, "open", "", null, null, null, null, null, null, true, false, "").length, 0);
  const late = visibleRibbons(pair, "open", "", null, null, null, null, null, null, false, true, 5);
  assert.equal(late.length, 1);
  assert.equal(late[0].id, "a");
  assert.equal(visibleRibbons(held, "open", "", null, null, null, null, null, null, false, true, 20).length, 0);
  assert.deepEqual(ribbonTimeline(pair, "").map((ribbon) => ribbon.id), ["a", "b"]);
  assert.deepEqual(ribbonTimeline(addRibbon(pair, { id: "c", text: "Blank" }), "").map((ribbon) => ribbon.hour === null).at(-1), true);
  const counts = ribbonCounts(addRibbon(pinned, { id: "b", text: "Later", hour: 16 }), 8);
  assert.equal(counts.open, 2);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 1);
  assert.equal(ribbonShare(1, 4), 25);
  assert.equal(ribbonShare(0, 0), 0);
  assert.deepEqual(ribbonStewards(saved), ["Nia"]);
  assert.deepEqual(ribbonSeals(saved), ["VIP"]);
  assert.deepEqual(ribbonLanes(pair), ["floor"]);
  assert.deepEqual(ribbonGrades(saved), ["firm"]);
  assert.deepEqual(dayQuarterCounts(pair), [1, 1, 0, 0]);
  assert.equal(activeSteward("gone", ["Nia"]), "all");
  assert.equal(activeSteward("blank", ["Nia"]), "blank");
  assert.equal(activeSteward("Nia", ["Nia"]), "Nia");
  assert.equal(stewardArg("blank"), "");
  assert.equal(stewardArg("all"), null);
  assert.equal(stewardArg("Nia"), "Nia");
  assert.equal(activeLane("up", ["floor"]), "all");
  assert.equal(activeLane("floor", ["floor"]), "floor");
  assert.equal(laneArg("blank"), "blank");
  assert.equal(laneArg("floor"), "floor");
  assert.equal(laneArg("nope"), null);
  assert.equal(activeSeal("gone", ["VIP"]), "all");
  assert.equal(activeSeal("VIP", ["VIP"]), "VIP");
  assert.equal(sealArg("blank"), "");
  assert.equal(sealArg("VIP"), "VIP");
  assert.equal(activeGrade("loud", ["firm"]), "all");
  assert.equal(activeGrade("firm", ["firm"]), "firm");
  assert.equal(gradeArg("blank"), "blank");
  assert.equal(gradeArg("bold"), "bold");
  assert.equal(gradeArg("nope"), null);
  assert.equal(activeHour("dawn"), "dawn");
  assert.equal(activeHour("q4"), "q4");
  assert.equal(activeHour("0"), "0");
  assert.equal(activeHour("24"), "all");
  assert.deepEqual(hourArg("0"), { exact: 0, band: null });
  assert.deepEqual(hourArg("dawn"), { exact: null, band: "dawn" });
  assert.deepEqual(hourArg("q2"), { exact: null, band: "q2" });
  assert.deepEqual(hourArg("all"), { exact: null, band: null });
  const clash = addRibbon(pair, { id: "c", text: "Same", hour: 0, lane: "floor" });
  assert.deepEqual(ribbonClashIds(clash, "a"), ["c"]);
  assert.deepEqual(ribbonClashIds(pair, "b"), []);
  assert.equal(nextRibbon(pair, 0), "a");
  assert.equal(nextRibbon(pair, 1), "b");
  assert.equal(nextRibbon(pair, 11), "a");
  assert.equal(nextRibbon(pair, ""), "");
  assert.equal(nextRibbon(done, 0), "");
  const csv = ribbonsCsv(saved, 8);
  assert.equal(csv.startsWith("text,steward,hour,lane,seal,grade,band,pinned,done,held,gap,audit\n"), true);
  assert.equal(csv.includes("0,floor,VIP,firm,dawn"), true);
  assert.match(csv, /,8,save$/);
  const views = addRibbonView([], { id: "v", name: "Morning", tray: "open", query: "ada", steward: "Nia", lane: "floor", seal: "VIP", grade: "firm", hour: "0" });
  assert.equal(views[0].hour, "0");
  assert.equal(addRibbonView(views, { id: "v2", name: "Morning", tray: "held", query: "", steward: "all", lane: "all", seal: "all", grade: "all", hour: "all" }).length, 1);
  assert.equal(readRibbonViews([{ id: "v", name: "Desk", tray: "nope", hour: "nope" }])[0].hour, "all");
  assert.equal(dropRibbonView(views, "v").length, 0);

  const rows = [
    { reason: "INV_DUPLICATE", label: "Ada" },
    { reason: "INV_WRONG_GEO", label: "Bea" },
    { reason: "INV_WRONG_GEO", label: "Gus" },
    { reason: "INV_NOT_REGISTERED", label: "Eve" },
    { reason: "", label: "No" },
    { reason: { leadInvalidReason: "INV_TRASH", saleStatus: "x" }, label: "Blocked" },
    { reason: { leadInvalidReason: "INV_UNDERAGE" }, label: "Wes" },
  ];
  assert.equal(reasonText("  INV_DUPLICATE  "), "INV_DUPLICATE");
  assert.equal(reasonText({ leadInvalidReason: "INV_DUPLICATE" }), "INV_DUPLICATE");
  assert.equal(reasonText({ leadInvalidReason: "INV_DUPLICATE", saleStatus: "x" }), "");
  assert.equal(reasonText({ leadInvalidReason: "INV_DUPLICATE", lastRegion: "Bavaria" }), "");
  assert.equal(reasonText({ lastRegion: "Bavaria" }), "");
  assert.equal(familyOf("INV_WRONG_GEO"), "geo");
  assert.equal(familyOf("INV_WRONG_LANGUAGE"), "geo");
  assert.equal(familyOf("INV_WRONG_PERSON"), "person");
  assert.equal(familyOf("INV_WRONG_NUMBER"), "person");
  assert.equal(familyOf("INV_TRASH"), "quality");
  assert.equal(familyOf("INV_DUPLICATE"), "duplicate");
  assert.equal(familyOf("INV_NOT_REGISTERED"), "duplicate");
  assert.equal(familyOf("INV_UNDERAGE"), "hours");
  assert.equal(familyOf("INV_NO_DOCS"), "hours");
  assert.equal(familyOf("INV_NOT_IN_WH"), "hours");
  assert.equal(familyOf("Custom"), "other");
  assert.equal(familyOf(""), "");
  assert.equal(lengthOf("INV_TRASH"), "short");
  assert.equal(lengthOf("INV_DUPLICATE"), "mid");
  assert.equal(lengthOf("INV_WRONG_GEO"), "mid");
  assert.equal(lengthOf("INV_WRONG_PERSON"), "mid");
  assert.equal(lengthOf("INV_NOT_REGISTERED"), "long");
  assert.equal(lengthOf(""), "");
  assert.equal(reasonMarkOf("INV_DUPLICATE"), "D");
  assert.equal(reasonMarkOf("INV_WRONG_GEO"), "W");
  assert.equal(reasonMarkOf("Île"), "#");
  assert.equal(reasonMarkOf(""), "");
  assert.equal(namedReasons(rows).includes("INV_DUPLICATE"), true);
  assert.equal(namedReasons(rows).includes(""), false);
  assert.equal(leadingReason(rows), "INV_WRONG_GEO");
  assert.equal(leadingFamily([{ reason: "INV_WRONG_GEO" }, { reason: "INV_WRONG_GEO" }, { reason: "INV_DUPLICATE" }]), "geo");
  assert.equal(leadingLength([{ reason: "INV_DUPLICATE" }, { reason: "INV_NOT_REGISTERED" }]), "long");
  assert.equal(leadingReasonMark([{ reason: "INV_WRONG_GEO" }, { reason: "INV_WRONG_PERSON" }, { reason: "" }]), "W");
  assert.equal(reasonShare(1, 4), 25);
  assert.equal(reasonShare(0, 4), 0);
  assert.deepEqual(readHiddenReasons(["INV_DUPLICATE", "gone", "INV_DUPLICATE"], ["INV_DUPLICATE", "INV_WRONG_GEO"]), ["INV_DUPLICATE"]);
  assert.deepEqual(toggleReason(["INV_DUPLICATE"], "INV_WRONG_GEO", ["INV_DUPLICATE", "INV_WRONG_GEO"]), ["INV_DUPLICATE", "INV_WRONG_GEO"]);
  assert.deepEqual(toggleReason(["INV_DUPLICATE"], "INV_DUPLICATE", ["INV_DUPLICATE"]), []);
  assert.deepEqual(visibleReasons(["INV_DUPLICATE", "INV_WRONG_GEO"], ["INV_WRONG_GEO"], false), ["INV_DUPLICATE"]);
  assert.deepEqual(visibleReasons(["INV_DUPLICATE", "INV_WRONG_GEO"], ["INV_WRONG_GEO"], true), ["INV_WRONG_GEO"]);
  assert.equal(activeReason("INV_WRONG_GEO", ["INV_DUPLICATE"]), "");
  assert.equal(activeReason("INV_DUPLICATE", ["INV_DUPLICATE"]), "INV_DUPLICATE");
  assert.equal(activeFamily("missing", ["geo"]), "all");
  assert.equal(activeFamily("blank", ["geo"]), "blank");
  assert.equal(activeFamily("geo", ["geo"]), "geo");
  assert.equal(familyArg("all"), null);
  assert.equal(familyArg("blank"), "");
  assert.equal(familyArg("hours"), "hours");
  assert.equal(familyArg("nope"), null);
  assert.equal(activeLength("missing", ["short"]), "all");
  assert.equal(activeLength("mid", ["mid"]), "mid");
  assert.equal(lengthArg("blank"), "");
  assert.equal(lengthArg("long"), "long");
  assert.equal(lengthArg("nope"), null);
  assert.equal(activeReasonMark("missing", ["D"]), "all");
  assert.equal(activeReasonMark("#", ["#"]), "#");
  assert.equal(activeReasonMark("#", ["D"]), "all");
  assert.equal(reasonMarkArg("all"), null);
  assert.equal(reasonMarkArg("blank"), "");
  assert.equal(reasonMarkArg("#"), "#");
  assert.equal(reasonMarkArg("d"), "D");
  const shown = visibleReasonCustomers(rows, "", false, "geo", "mid", null, "gus");
  assert.equal(shown.length, 1);
  assert.equal(shown[0].label, "Gus");
  assert.equal(visibleReasonCustomers(rows, "", true, null, null, null, "blocked").length, 1);
  assert.equal(visibleReasonCustomers(rows, "INV_DUPLICATE", false, null, null, null, "").length, 1);
  assert.equal(visibleReasonCustomers(rows, "", false, null, null, "N", "eve").length, 1);
  assert.equal(reasonsCsv(rows).startsWith("reason,family,length,letter,count\n"), true);
  assert.equal(reasonsCsv([]), "reason,family,length,letter,count");
  assert.equal(reasonsCsv(rows).includes("amount"), false);
  assert.equal(lengthLines(rows).some((line) => line.length === "short"), true);
  assert.equal(namedFamilies(rows).includes("geo"), true);
  assert.equal(namedLengths(rows).includes("mid"), true);
  assert.equal(namedReasonMarks(rows).includes("D"), true);

  const copy = Object.keys(ROUND143_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND143_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "ribTitle"), "Ribbon cards");
  assert.equal(crmv4Text("tr", "rsnTitle"), ROUND143_COPY.tr.rsnTitle);
  assert.equal(crmv4Text("de", "ribSteward"), ROUND143_COPY.de.ribSteward);
  assert.equal(crmv4Text("ru", "rsnBlank"), ROUND143_COPY.ru.rsnBlank);
  assert.equal(crmv4Text("ar", "ribNotice"), ROUND143_COPY.ar.ribNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rib/);
  assert.match(css, /\.c4-reason/);
  assert.match(css, /\.c4-pagehead-ribbon/);
  assert.match(css, /\.c4-rail-ribbon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const view = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round143.tsx"), "utf8");
  assert.equal(view.includes("sendJson"), false);
  assert.equal(view.includes("setInterval"), false);
  assert.equal(view.includes("fetch("), false);
  assert.equal(view.includes("amount"), false);
  assert.equal(view.includes("currency"), false);
  assert.equal(view.includes("balance"), false);
  assert.equal(view.includes("saleStatus"), false);
  assert.equal(view.includes("retentionStatus"), false);
  assert.equal(view.includes("potentialStatus"), false);
  assert.equal(view.includes("documentsStatus"), false);
  assert.equal(view.includes("accountType"), false);
  assert.equal(view.includes("validationStatus"), false);
  assert.match(view, /leadInvalidReason/);
  assert.match(view, /ribbonsCsv/);
  assert.match(view, /reasonsCsv/);
  assert.match(view, /Escape/);
  assert.match(view, /event\.key !== "\/"/);
  assert.match(view, /event\.key === "n"/);
  assert.match(view, /storedRole/);
  assert.match(view, /data-role/);
  assert.match(view, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(view, /data-ribbon/);
  assert.match(view, /data-reason/);
  assert.match(view, /data-logo="mono"/);
  assert.match(view, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ribbons"/);
  assert.match(app, /view === "reasons"/);
  assert.match(app, /c4-pagehead-ribbon/);
  assert.match(app, /c4-rail-ribbon/);
  assert.match(app, /c4-pagehead-press/);
  assert.match(app, /c4-rail-press/);
  console.log("crmv4 round143 tests passed");
}

main();
