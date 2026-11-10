/**
 * Docket slips and family names.
 * Run: npx tsx tests/crmv4-round155.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND155_COPY } from "../src/lib/crmv4/copy-round155";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeClerk,
  activeCloth,
  activeInitial,
  activeMark,
  activeNumber,
  activeShape,
  activeSpan,
  activeWax,
  addDocket,
  addDocketView,
  assignedFamily,
  bulkDocketFiled,
  bulkDocketPinned,
  clerkArg,
  clothArg,
  docketClashIds,
  docketClerks,
  docketCloths,
  docketCopy,
  docketCounts,
  docketGap,
  docketMark,
  docketMarks,
  docketOf,
  docketShare,
  docketText,
  docketTimeline,
  docketWaxes,
  docketsCsv,
  dropDocketView,
  editDocket,
  familyCsv,
  familyShare,
  initialArg,
  initialOf,
  leadingInitial,
  leadingShape,
  markArg,
  namedInitials,
  namedShapes,
  namedSpans,
  nextDocket,
  numberArg,
  readDocketViews,
  readDockets,
  readHiddenInitials,
  resetDockets,
  ringOf,
  setDocketFiled,
  setDocketParked,
  setDocketPinned,
  shapeArg,
  shapeOf,
  spanArg,
  spanOf,
  stepDocketWax,
  toggleInitial,
  visibleDockets,
  visibleFamilyCustomers,
  visibleInitials,
  watchCounts,
  watchOf,
  waxArg,
  waxOf,
  clerkLabel,
  clothOf,
} from "../src/lib/crmv4/round155";

function main() {
  assert.equal(docketText("  Check\nAda  "), "Check Ada");
  assert.equal(docketText("   "), "");
  assert.equal(docketText("x".repeat(120)).length, 64);
  assert.equal(clerkLabel("  North  "), "North");
  assert.equal(clerkLabel("   "), "");
  assert.equal(clerkLabel("y".repeat(40)).length, 16);
  assert.equal(docketMark("  VIP  "), "VIP");
  assert.equal(docketMark("   "), "");
  assert.equal(docketMark("z".repeat(30)).length, 10);
  assert.equal(docketOf(" 1 "), 1);
  assert.equal(docketOf(1), 1);
  assert.equal(docketOf("01"), 1);
  assert.equal(docketOf("09"), 9);
  assert.equal(docketOf("40"), 40);
  assert.equal(docketOf(40), 40);
  assert.equal(docketOf(""), null);
  assert.equal(docketOf("00"), null);
  assert.equal(docketOf(0), null);
  assert.equal(docketOf("41"), null);
  assert.equal(docketOf(41), null);
  assert.equal(docketOf(-1), null);
  assert.equal(docketOf(1.5), null);
  assert.equal(clothOf(" LINEN "), "linen");
  assert.equal(clothOf("silk"), "silk");
  assert.equal(clothOf("wool"), "wool");
  assert.equal(clothOf("canvas"), "canvas");
  assert.equal(clothOf(""), "blank");
  assert.equal(clothOf("gold"), "blank");
  assert.equal(waxOf(" SOFT "), "soft");
  assert.equal(waxOf("firm"), "firm");
  assert.equal(waxOf("hard"), "hard");
  assert.equal(waxOf(""), "blank");
  assert.equal(waxOf("gold"), "blank");
  assert.equal(watchOf(null), "blank");
  assert.equal(watchOf(1), "dawn");
  assert.equal(watchOf(10), "dawn");
  assert.equal(watchOf(11), "noon");
  assert.equal(watchOf(20), "noon");
  assert.equal(watchOf(21), "dusk");
  assert.equal(watchOf(30), "dusk");
  assert.equal(watchOf(31), "night");
  assert.equal(watchOf(40), "night");
  assert.equal(ringOf(null), "blank");
  assert.equal(ringOf(1), "inner");
  assert.equal(ringOf(20), "inner");
  assert.equal(ringOf(21), "outer");
  assert.equal(ringOf(40), "outer");
  assert.equal(docketGap(8, 9), 1);
  assert.equal(docketGap(18, 9), -9);
  assert.equal(docketGap(8, 8), 0);
  assert.equal(docketGap(null, 9), null);
  assert.equal(docketGap(8, ""), null);
  assert.equal(docketGap(8, 41), null);
  assert.deepEqual(readDockets([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", clerk: "  ", docket: 0, cloth: "gold", mark: "  ", wax: "gold", pinned: 1, parked: 1, filed: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", clerk: "", docket: null, cloth: "", mark: "", wax: "", pinned: false, parked: false, filed: false, audit: "" },
  ]);
  assert.equal(readDockets([{ id: "z", text: "One", docket: 1 }])[0].docket, 1);
  assert.equal(readDockets([{ id: "z", text: "One", docket: "09" }])[0].docket, 9);
  const saved = addDocket([], { id: "a", text: "Check Ada", clerk: "Nia", docket: 8, cloth: "linen", mark: "VIP", wax: "soft" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].docket, 8);
  assert.equal(saved[0].cloth, "linen");
  assert.equal(saved[0].wax, "soft");
  assert.equal(addDocket(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addDocket(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addDocket(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepDocketWax(saved, "a", 1);
  assert.equal(raised[0].wax, "firm");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepDocketWax(raised, "a", 1)[0].wax, "hard");
  assert.equal(stepDocketWax([{ ...saved[0], wax: "hard" }], "a", 1)[0].wax, "hard");
  assert.equal(stepDocketWax([{ ...saved[0], wax: "" }], "a", -1)[0].wax, "");
  assert.equal(stepDocketWax([{ ...saved[0], wax: "" }], "a", 1)[0].wax, "soft");
  assert.equal(setDocketPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setDocketPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setDocketParked(saved, "a", true)[0].parked, true);
  assert.equal(setDocketFiled(saved, "a", true)[0].audit, "file");
  assert.equal(setDocketFiled(saved, "a", false)[0].audit, "unfile");
  assert.equal(editDocket(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editDocket(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addDocket(saved, { id: "b", text: "Check Bea" });
  assert.equal(editDocket(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkDocketPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkDocketFiled(pair, ["missing"], true)[0].filed, false);
  assert.equal(resetDockets().length, 0);
  assert.equal(docketCopy("  Check Ada "), "Check Ada");
  assert.equal(docketCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", wax: "soft", docket: 4, pinned: true },
    { ...saved[0], id: "parked", text: "Held note", parked: true, wax: "firm", docket: 11 },
    { ...saved[0], id: "filed", text: "Filed note", filed: true, parked: true, wax: "hard", docket: 2 },
    { ...saved[0], id: "late", text: "Aaa late", wax: "soft", docket: 1 },
    { ...saved[0], id: "firm", text: "Firm note", wax: "firm", docket: 1 },
  ];
  assert.equal(visibleDockets(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleDockets(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleDockets(mixed, "parked", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleDockets(mixed, "filed", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleDockets(mixed, "open", "", null, null, null, null, null, null, true, false, "").every((card) => card.wax === "hard"), true);
  assert.equal(visibleDockets(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.wax === "soft"), true);
  assert.equal(visibleDockets(mixed, "open", "", null, "linen", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleDockets(mixed, "open", "", "Nia", "linen", "VIP", "soft", 4, null, false, false, "").length, 1);
  assert.equal(visibleDockets(mixed, "open", "", null, null, null, null, null, "dawn", false, false, "").length, 3);
  assert.equal(docketTimeline(mixed, "")[0].docket, 1);
  assert.equal(docketTimeline([{ ...saved[0], docket: null }], "").at(-1)?.docket, null);
  const counts = docketCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.parked, 1);
  assert.equal(counts.filed, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(docketShare(1, 3), 33);
  assert.equal(docketShare(0, 0), 0);
  assert.deepEqual(docketClerks(mixed), ["Nia"]);
  assert.deepEqual(docketMarks(mixed), ["VIP"]);
  assert.deepEqual(docketCloths(mixed), ["linen"]);
  assert.deepEqual(docketWaxes(mixed), ["soft", "firm", "hard"]);
  assert.deepEqual(watchCounts(mixed), [4, 1, 0, 0]);
  assert.equal(activeClerk("gone", ["Nia"]), "all");
  assert.equal(activeClerk("blank", ["Nia"]), "blank");
  assert.equal(clerkArg("blank"), "");
  assert.equal(clerkArg("all"), null);
  assert.equal(activeCloth("gone", ["linen"]), "all");
  assert.equal(clothArg("blank"), "blank");
  assert.equal(clothArg("linen"), "linen");
  assert.equal(clothArg("gold"), null);
  assert.equal(activeMark("gone", ["VIP"]), "all");
  assert.equal(markArg("VIP"), "VIP");
  assert.equal(activeWax("gone", ["soft"]), "all");
  assert.equal(waxArg("soft"), "soft");
  assert.equal(waxArg("blank"), "blank");
  assert.equal(activeNumber("dawn"), "dawn");
  assert.equal(activeNumber("09"), "9");
  assert.equal(activeNumber("00"), "all");
  assert.equal(activeNumber("41"), "all");
  assert.equal(activeNumber("pirate"), "all");
  assert.deepEqual(numberArg("1"), { exact: 1, band: null });
  assert.deepEqual(numberArg("noon"), { exact: null, band: "noon" });
  assert.deepEqual(numberArg("all"), { exact: null, band: null });
  assert.deepEqual(docketClashIds([
    { ...saved[0], id: "a", docket: 4, text: "Check Ada" },
    { ...saved[0], id: "b", docket: 4, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(docketClashIds([{ ...saved[0], cloth: "", docket: 8 }], "a"), []);
  assert.deepEqual(docketClashIds([{ ...saved[0], docket: null }], "a"), []);
  assert.equal(nextDocket(mixed, "3"), "open");
  assert.equal(nextDocket(mixed, "30"), "late");
  assert.equal(nextDocket([{ ...saved[0], wax: "hard", docket: 4 }], "1"), "");
  assert.equal(nextDocket(mixed, ""), "");
  const csv = docketsCsv(saved, "9");
  assert.equal(csv.startsWith("note,clerk,docket,cloth,mark,wax,watch,pinned,parked,filed,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,8,linen,VIP,soft,dawn,0,0,0,1,save"), true);
  assert.equal(docketsCsv([], "").includes("note,clerk"), true);
  const view = addDocketView([], { id: "v", name: "Dawn", tray: "open", query: "ada", clerk: "Nia", cloth: "linen", mark: "VIP", wax: "soft", docket: "dawn" });
  assert.equal(view.length, 1);
  assert.equal(addDocketView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readDocketViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropDocketView(view, "v").length, 0);
  const many = Array.from({ length: 18 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, clerk: "", docket: null, cloth: "", mark: "", wax: "", pinned: false, parked: false, filed: false, audit: "save" }));
  assert.equal(readDockets(many).length, 16);
  const manyViews = Array.from({ length: 7 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", clerk: "all", cloth: "all", mark: "all", wax: "all", docket: "all" }));
  assert.equal(readDocketViews(manyViews).length, 5);

  assert.equal(assignedFamily(" ada "), "ada");
  assert.equal(assignedFamily(""), "");
  assert.equal(assignedFamily("x".repeat(40)).length, 28);
  assert.equal(assignedFamily({ lastName: "ada" }), "ada");
  assert.equal(assignedFamily({ lastName: "ada", firstName: "Lovelace" }), "");
  assert.equal(assignedFamily({ lastName: "ada", name: "Ada" }), "");
  assert.equal(assignedFamily({ lastName: "ada", email: "a@b.c" }), "");
  assert.equal(assignedFamily({ lastName: "ada", username: "ada" }), "");
  assert.equal(assignedFamily({ lastName: "ada", phone: "1" }), "");
  assert.equal(initialOf("ada"), "A");
  assert.equal(initialOf("Bea"), "B");
  assert.equal(initialOf("4ada"), "");
  assert.equal(initialOf(""), "");
  assert.equal(spanOf("ab"), "short");
  assert.equal(spanOf("abcde"), "short");
  assert.equal(spanOf("abcdef"), "mid");
  assert.equal(spanOf("abcdefghij"), "mid");
  assert.equal(spanOf("abcdefghijk"), "long");
  assert.equal(spanOf(""), "");
  assert.equal(shapeOf("Ada"), "plain");
  assert.equal(shapeOf("Al-Masri"), "joined");
  assert.equal(shapeOf("van Gogh"), "stacked");
  assert.equal(shapeOf("4ada"), "");
  assert.equal(shapeOf(""), "");
  const rows = [
    { family: "Ada", label: "Ada North" },
    { family: "Bea", label: "Bea South" },
    { family: "Ann", label: "Ann West" },
    { family: "Christopher", label: "Chris East" },
    { family: "Al-Masri", label: "Mark" },
    { family: "van Gogh", label: "West" },
    { family: "4ada", label: "Mark" },
    { family: "", label: "Blank" },
  ];
  assert.equal(leadingInitial(rows), "A");
  assert.equal(leadingShape(rows), "plain");
  assert.equal(familyShare(2, 6), 33);
  assert.equal(familyShare(0, 0), 0);
  assert.deepEqual(namedInitials(rows), ["A", "B", "C", "V"]);
  assert.deepEqual(namedSpans(rows), ["short", "mid", "long"]);
  assert.deepEqual(namedShapes(rows), ["plain", "joined", "stacked"]);
  assert.equal(visibleFamilyCustomers(rows, "A", null, null, "north").length, 1);
  assert.equal(visibleFamilyCustomers(rows, null, "plain", "short", "").length, 3);
  assert.equal(visibleFamilyCustomers([{ family: "Ada", label: "North" }], null, null, null, "ada").length, 0);
  assert.deepEqual(readHiddenInitials(["a", "a", "9", "Z"], ["A", "B"]), ["A"]);
  assert.deepEqual(toggleInitial(["A"], "B", ["A", "B"]), ["A", "B"]);
  assert.deepEqual(toggleInitial(["A"], "A", ["A", "B"]), []);
  assert.deepEqual(visibleInitials(["A", "B"], ["A"], false), ["B"]);
  assert.deepEqual(visibleInitials(["A", "B"], ["A"], true), ["A"]);
  assert.equal(activeInitial("gone", ["A"]), "all");
  assert.equal(activeInitial("blank", ["A"]), "blank");
  assert.equal(initialArg("A"), "A");
  assert.equal(initialArg("blank"), "");
  assert.equal(initialArg("all"), null);
  assert.equal(activeSpan("gone", ["short"]), "all");
  assert.equal(spanArg("short"), "short");
  assert.equal(spanArg("blank"), "");
  assert.equal(activeShape("gone", ["plain"]), "all");
  assert.equal(shapeArg("joined"), "joined");
  assert.equal(shapeArg("blank"), "");
  const names = familyCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(familyCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",A,"), true);

  const copy = Object.keys(ROUND155_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND155_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "dktTitle"), "Docket slips");
  assert.equal(crmv4Text("tr", "famTitle"), ROUND155_COPY.tr.famTitle);
  assert.equal(crmv4Text("de", "dktClerk"), ROUND155_COPY.de.dktClerk);
  assert.equal(crmv4Text("ru", "famUnmarked"), ROUND155_COPY.ru.famUnmarked);
  assert.equal(crmv4Text("ar", "dktNotice"), ROUND155_COPY.ar.dktNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dkt/);
  assert.match(css, /\.c4-fam/);
  assert.match(css, /\.c4-pagehead-docket/);
  assert.match(css, /\.c4-rail-docket/);
  assert.match(css, /\.c4-pagehead-proof/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round155.tsx"), "utf8");
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
  assert.match(viewFile, /lastName/);
  assert.match(viewFile, /docketsCsv/);
  assert.match(viewFile, /familyCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "k"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-dockets/);
  assert.match(viewFile, /data-family/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dockets"/);
  assert.match(app, /view === "family"/);
  assert.match(app, /c4-pagehead-docket/);
  assert.match(app, /c4-rail-docket/);
  assert.match(app, /c4-pagehead-proof/);
  console.log("crmv4 round155 tests passed");
}

main();
