/**
 * Press proofs and given names.
 * Run: npx tsx tests/crmv4-round154.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROUND154_COPY } from "../src/lib/crmv4/copy-round154";
import { crmv4Text } from "../src/lib/crmv4/copy";
import {
  activeEnding,
  activeInitial,
  activeInk,
  activeLength,
  activeMark,
  activeReader,
  activeSheet,
  activeStock,
  addProof,
  addProofView,
  assignedGiven,
  bulkProofBound,
  bulkProofPinned,
  dropProofView,
  editProof,
  endingArg,
  endingOf,
  gatheringCounts,
  gatheringOf,
  givenShare,
  givensCsv,
  inkArg,
  inkOf,
  initialArg,
  initialOf,
  leadingInitial,
  leadingLength,
  lengthArg,
  lengthOf,
  markArg,
  namedEndings,
  namedInitials,
  namedLengths,
  nextProof,
  proofClashIds,
  proofCopy,
  proofCounts,
  proofInks,
  proofMark,
  proofMarks,
  proofReaders,
  proofShare,
  proofStocks,
  proofText,
  proofTimeline,
  proofsCsv,
  readHiddenInitials,
  readProofViews,
  readProofs,
  readerArg,
  readerLabel,
  resetProofs,
  setProofBound,
  setProofHeld,
  setProofPinned,
  sheetArg,
  sheetGap,
  sheetOf,
  sheetPair,
  stepProofInk,
  stockArg,
  stockOf,
  toggleInitial,
  visibleGivenCustomers,
  visibleInitials,
  visibleProofs,
} from "../src/lib/crmv4/round154";

function main() {
  assert.equal(proofText("  Check\nAda  "), "Check Ada");
  assert.equal(proofText("   "), "");
  assert.equal(proofText("x".repeat(120)).length, 68);
  assert.equal(readerLabel("  North  "), "North");
  assert.equal(readerLabel("   "), "");
  assert.equal(readerLabel("y".repeat(40)).length, 18);
  assert.equal(proofMark("  VIP  "), "VIP");
  assert.equal(proofMark("   "), "");
  assert.equal(proofMark("z".repeat(30)).length, 12);
  assert.equal(sheetOf(" 1 "), 1);
  assert.equal(sheetOf(1), 1);
  assert.equal(sheetOf("01"), 1);
  assert.equal(sheetOf("09"), 9);
  assert.equal(sheetOf("36"), 36);
  assert.equal(sheetOf(36), 36);
  assert.equal(sheetOf(""), null);
  assert.equal(sheetOf("00"), null);
  assert.equal(sheetOf(0), null);
  assert.equal(sheetOf("37"), null);
  assert.equal(sheetOf(37), null);
  assert.equal(sheetOf(-1), null);
  assert.equal(sheetOf(1.5), null);
  assert.equal(stockOf(" RAG "), "rag");
  assert.equal(stockOf("laid"), "laid");
  assert.equal(stockOf("wove"), "wove");
  assert.equal(stockOf("bond"), "bond");
  assert.equal(stockOf(""), "blank");
  assert.equal(stockOf("silk"), "blank");
  assert.equal(inkOf(" PALE "), "pale");
  assert.equal(inkOf("set"), "set");
  assert.equal(inkOf("dry"), "dry");
  assert.equal(inkOf(""), "blank");
  assert.equal(inkOf("gold"), "blank");
  assert.equal(gatheringOf(null), "blank");
  assert.equal(gatheringOf(1), "quire");
  assert.equal(gatheringOf(9), "quire");
  assert.equal(gatheringOf(10), "section");
  assert.equal(gatheringOf(18), "section");
  assert.equal(gatheringOf(19), "signature");
  assert.equal(gatheringOf(27), "signature");
  assert.equal(gatheringOf(28), "volume");
  assert.equal(gatheringOf(36), "volume");
  assert.equal(sheetPair(null), "blank");
  assert.equal(sheetPair(1), "odd");
  assert.equal(sheetPair(2), "even");
  assert.equal(sheetGap(8, 9), 1);
  assert.equal(sheetGap(18, 9), -9);
  assert.equal(sheetGap(8, 8), 0);
  assert.equal(sheetGap(null, 9), null);
  assert.equal(sheetGap(8, ""), null);
  assert.equal(sheetGap(8, 37), null);
  assert.deepEqual(readProofs([{ id: "", text: "Ada" }, { id: "1", text: "  " }, { id: "2", text: "Check Ada", reader: "  ", sheet: 0, stock: "silk", mark: "  ", ink: "gold", pinned: 1, bound: 1, held: 1, audit: "nope" }, "nope"]), [
    { id: "2", text: "Check Ada", reader: "", sheet: null, stock: "", mark: "", ink: "", pinned: false, bound: false, held: false, audit: "" },
  ]);
  assert.equal(readProofs([{ id: "z", text: "One", sheet: 1 }])[0].sheet, 1);
  assert.equal(readProofs([{ id: "z", text: "One", sheet: "09" }])[0].sheet, 9);
  const saved = addProof([], { id: "a", text: "Check Ada", reader: "Nia", sheet: 8, stock: "rag", mark: "VIP", ink: "pale" });
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].sheet, 8);
  assert.equal(saved[0].stock, "rag");
  assert.equal(saved[0].ink, "pale");
  assert.equal(addProof(saved, { id: "b", text: "Check Ada" }).length, 1);
  assert.equal(addProof(saved, { id: "a", text: "Other" }).length, 1);
  assert.equal(addProof(saved, { id: "b", text: "   " }).length, 1);
  const raised = stepProofInk(saved, "a", 1);
  assert.equal(raised[0].ink, "set");
  assert.equal(raised[0].audit, "raise");
  assert.equal(stepProofInk(raised, "a", 1)[0].ink, "dry");
  assert.equal(stepProofInk([{ ...saved[0], ink: "dry" }], "a", 1)[0].ink, "dry");
  assert.equal(stepProofInk([{ ...saved[0], ink: "" }], "a", -1)[0].ink, "");
  assert.equal(stepProofInk([{ ...saved[0], ink: "" }], "a", 1)[0].ink, "pale");
  assert.equal(setProofPinned(saved, "a", true)[0].audit, "pin");
  assert.equal(setProofPinned(saved, "a", false)[0].audit, "unpin");
  assert.equal(setProofHeld(saved, "a", true)[0].held, true);
  assert.equal(setProofBound(saved, "a", true)[0].audit, "bind");
  assert.equal(setProofBound(saved, "a", false)[0].audit, "unbind");
  assert.equal(editProof(saved, "a", "  ")[0].text, "Check Ada");
  assert.equal(editProof(saved, "a", "Check Bea")[0].audit, "edit");
  const pair = addProof(saved, { id: "b", text: "Check Bea" });
  assert.equal(editProof(pair, "b", "Check Ada")[0].text, "Check Bea");
  assert.equal(bulkProofPinned(pair, ["a", "b"], true).every((card) => card.pinned), true);
  assert.equal(bulkProofBound(pair, ["missing"], true)[0].bound, false);
  assert.equal(resetProofs().length, 0);
  assert.equal(proofCopy("  Check Ada "), "Check Ada");
  assert.equal(proofCopy(" "), "");
  const mixed = [
    { ...saved[0], id: "open", ink: "pale", sheet: 4, pinned: true },
    { ...saved[0], id: "held", text: "Held note", held: true, ink: "set", sheet: 9 },
    { ...saved[0], id: "bound", text: "Bound note", bound: true, held: true, ink: "dry", sheet: 2 },
    { ...saved[0], id: "late", text: "Late note", ink: "pale", sheet: 1 },
    { ...saved[0], id: "set", text: "Set note", ink: "set", sheet: 1 },
  ];
  assert.equal(visibleProofs(mixed, "open", "late", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "open", "nia", null, null, null, null, null, null, false, false, "").length, 0);
  assert.equal(visibleProofs(mixed, "held", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "bound", "", null, null, null, null, null, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, null, true, false, "").every((card) => card.ink === "dry"), true);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, null, false, true, "8").every((card) => card.ink === "pale"), true);
  assert.equal(visibleProofs(mixed, "open", "", null, "rag", null, null, null, null, false, false, "").length, 3);
  assert.equal(visibleProofs(mixed, "open", "", "Nia", null, "VIP", "pale", 4, null, false, false, "").length, 1);
  assert.equal(visibleProofs(mixed, "open", "", null, null, null, null, null, "quire", false, false, "").length, 3);
  assert.equal(proofTimeline(mixed, "")[0].sheet, 1);
  assert.equal(proofTimeline([{ ...saved[0], sheet: null }], "").at(-1)?.sheet, null);
  const counts = proofCounts(mixed, "8");
  assert.equal(counts.open, 3);
  assert.equal(counts.held, 1);
  assert.equal(counts.bound, 1);
  assert.equal(counts.pinned, 1);
  assert.equal(counts.late, 2);
  assert.equal(proofShare(1, 3), 33);
  assert.equal(proofShare(0, 0), 0);
  assert.deepEqual(proofReaders(mixed), ["Nia"]);
  assert.deepEqual(proofMarks(mixed), ["VIP"]);
  assert.deepEqual(proofStocks(mixed), ["rag"]);
  assert.deepEqual(proofInks(mixed), ["pale", "set", "dry"]);
  assert.deepEqual(gatheringCounts(mixed), [5, 0, 0, 0]);
  assert.equal(activeReader("gone", ["Nia"]), "all");
  assert.equal(activeReader("blank", ["Nia"]), "blank");
  assert.equal(readerArg("blank"), "");
  assert.equal(readerArg("all"), null);
  assert.equal(activeStock("gone", ["rag"]), "all");
  assert.equal(stockArg("blank"), "blank");
  assert.equal(stockArg("rag"), "rag");
  assert.equal(stockArg("silk"), null);
  assert.equal(activeMark("gone", ["VIP"]), "all");
  assert.equal(markArg("VIP"), "VIP");
  assert.equal(activeInk("gone", ["pale"]), "all");
  assert.equal(inkArg("pale"), "pale");
  assert.equal(inkArg("blank"), "blank");
  assert.equal(activeSheet("quire"), "quire");
  assert.equal(activeSheet("09"), "9");
  assert.equal(activeSheet("00"), "all");
  assert.equal(activeSheet("37"), "all");
  assert.equal(activeSheet("pirate"), "all");
  assert.deepEqual(sheetArg("1"), { exact: 1, band: null });
  assert.deepEqual(sheetArg("section"), { exact: null, band: "section" });
  assert.deepEqual(sheetArg("all"), { exact: null, band: null });
  assert.deepEqual(proofClashIds([
    { ...saved[0], id: "a", sheet: 4, text: "Check Ada" },
    { ...saved[0], id: "b", sheet: 4, text: "Check Bea" },
  ], "a"), ["b"]);
  assert.deepEqual(proofClashIds([{ ...saved[0], stock: "", sheet: 8 }], "a"), []);
  assert.deepEqual(proofClashIds([{ ...saved[0], sheet: null }], "a"), []);
  assert.equal(nextProof(mixed, "3"), "open");
  assert.equal(nextProof(mixed, "30"), "late");
  assert.equal(nextProof([{ ...saved[0], ink: "dry", sheet: 4 }], "1"), "");
  assert.equal(nextProof(mixed, ""), "");
  const csv = proofsCsv(saved, "9");
  assert.equal(csv.startsWith("note,reader,sheet,stock,mark,ink,gathering,pinned,held,bound,gap,audit\n"), true);
  assert.equal(csv.includes("Check Ada,Nia,8,rag,VIP,pale,quire,0,0,0,1,save"), true);
  assert.equal(proofsCsv([], "").includes("note,reader"), true);
  const view = addProofView([], { id: "v", name: "Quire", tray: "open", query: "ada", reader: "Nia", stock: "rag", mark: "VIP", ink: "pale", sheet: "quire" });
  assert.equal(view.length, 1);
  assert.equal(addProofView(view, { ...view[0], id: "w" }).length, 1);
  assert.equal(readProofViews([{ id: "v", name: "  " }]).length, 0);
  assert.equal(dropProofView(view, "v").length, 0);
  const many = Array.from({ length: 18 }, (_, index) => ({ id: `k${index}`, text: `Note ${index}`, reader: "", sheet: null, stock: "", mark: "", ink: "", pinned: false, bound: false, held: false, audit: "save" }));
  assert.equal(readProofs(many).length, 16);
  const manyViews = Array.from({ length: 7 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", reader: "all", stock: "all", mark: "all", ink: "all", sheet: "all" }));
  assert.equal(readProofViews(manyViews).length, 5);

  assert.equal(assignedGiven(" ada "), "ada");
  assert.equal(assignedGiven(""), "");
  assert.equal(assignedGiven("x".repeat(40)).length, 24);
  assert.equal(assignedGiven({ firstName: "ada" }), "ada");
  assert.equal(assignedGiven({ firstName: "ada", lastName: "Lovelace" }), "");
  assert.equal(assignedGiven({ firstName: "ada", name: "Ada" }), "");
  assert.equal(assignedGiven({ firstName: "ada", email: "a@b.c" }), "");
  assert.equal(assignedGiven({ firstName: "ada", username: "ada" }), "");
  assert.equal(assignedGiven({ firstName: "ada", phone: "1" }), "");
  assert.equal(initialOf("ada"), "A");
  assert.equal(initialOf("Bea"), "B");
  assert.equal(initialOf("4ada"), "");
  assert.equal(initialOf(""), "");
  assert.equal(lengthOf("ab"), "brief");
  assert.equal(lengthOf("abcd"), "brief");
  assert.equal(lengthOf("abcde"), "settled");
  assert.equal(lengthOf("abcdefg"), "settled");
  assert.equal(lengthOf("abcdefgh"), "ample");
  assert.equal(lengthOf(""), "");
  assert.equal(endingOf("Ada"), "vowel");
  assert.equal(endingOf("Mark"), "consonant");
  assert.equal(endingOf("Ann2"), "");
  assert.equal(endingOf(""), "");
  const rows = [
    { given: "Ada", label: "Ada North" },
    { given: "Bea", label: "Bea South" },
    { given: "Ann", label: "Ann West" },
    { given: "Christopher", label: "Chris East" },
    { given: "4ada", label: "Mark" },
    { given: "", label: "Blank" },
  ];
  assert.equal(leadingInitial(rows), "A");
  assert.equal(leadingLength(rows), "brief");
  assert.equal(givenShare(2, 6), 33);
  assert.equal(givenShare(0, 0), 0);
  assert.deepEqual(namedInitials(rows), ["A", "B", "C"]);
  assert.deepEqual(namedLengths(rows), ["brief", "ample"]);
  assert.deepEqual(namedEndings(rows), ["vowel", "consonant"]);
  assert.equal(visibleGivenCustomers(rows, "A", null, null, "north").length, 1);
  assert.equal(visibleGivenCustomers(rows, null, "vowel", "brief", "").length, 3);
  assert.equal(visibleGivenCustomers([{ given: "Ada", label: "North" }], null, null, null, "ada").length, 0);
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
  assert.equal(activeLength("gone", ["brief"]), "all");
  assert.equal(lengthArg("brief"), "brief");
  assert.equal(lengthArg("blank"), "");
  assert.equal(activeEnding("gone", ["vowel"]), "all");
  assert.equal(endingArg("consonant"), "consonant");
  assert.equal(endingArg("blank"), "");
  const names = givensCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(givensCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",A,"), true);

  const copy = Object.keys(ROUND154_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND154_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "prfTitle"), "Press proofs");
  assert.equal(crmv4Text("tr", "gvnTitle"), ROUND154_COPY.tr.gvnTitle);
  assert.equal(crmv4Text("de", "prfReader"), ROUND154_COPY.de.prfReader);
  assert.equal(crmv4Text("ru", "gvnUnmarked"), ROUND154_COPY.ru.gvnUnmarked);
  assert.equal(crmv4Text("ar", "prfNotice"), ROUND154_COPY.ar.prfNotice);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-prf/);
  assert.match(css, /\.c4-gvn/);
  assert.match(css, /\.c4-pagehead-proof/);
  assert.match(css, /\.c4-rail-proof/);
  assert.match(css, /\.c4-pagehead-kiln/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round154.tsx"), "utf8");
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
  assert.match(viewFile, /firstName/);
  assert.match(viewFile, /proofsCsv/);
  assert.match(viewFile, /givensCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-proofs/);
  assert.match(viewFile, /data-given/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "proofs"/);
  assert.match(app, /view === "given"/);
  assert.match(app, /c4-pagehead-proof/);
  assert.match(app, /c4-rail-proof/);
  assert.match(app, /c4-pagehead-kiln/);
  console.log("crmv4 round154 tests passed");
}

main();
