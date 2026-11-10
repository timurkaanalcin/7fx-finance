/**
 * Escort slips and note ribbons.
 * Run: TZ=UTC npx tsx tests/crmv4-round196.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND196_COPY } from "../src/lib/crmv4/copy-round196";
import {
  activeBell,
  activeLength,
  activeWeight,
  addSlip,
  addSlipTag,
  addSlipView,
  bayOf,
  bellGap,
  bellOf,
  bulkSlipCloth,
  busiestGuide,
  catalogRibbon,
  catalogRibbonCount,
  chimeBell,
  clashBellCount,
  cycleStep,
  densityOf,
  editSlip,
  editSlipNote,
  fairGuide,
  houseBay,
  hushBell,
  lateSlip,
  lengthOf,
  moveFocus,
  nextSlip,
  quietOf,
  readSlips,
  reminderSlips,
  ribbonBand,
  ribbonCopy,
  ribbonRowsCsv,
  ribbonState,
  ribbonTone,
  ribbonsCsv,
  scrollRibbonCount,
  setSlipQuiet,
  sharedRibbonCount,
  slipLine,
  slipsCsv,
  softRibbonCount,
  soonSlip,
  sortSlips,
  suggestCloth,
  suggestGuide,
  suggestLength,
  usedBells,
  visibleRibbonCustomers,
  visibleSlips,
  weightClashCount,
  weightOf,
} from "../src/lib/crmv4/round196";

function main() {
  assert.equal(bayOf("  nth "), "NTH");
  assert.equal(bayOf("sth"), "STH");
  assert.equal(bayOf("est"), "EST");
  assert.equal(bayOf("   "), "");
  assert.equal(bayOf("NT"), "");
  assert.equal(bayOf("NTHX"), "");
  assert.equal(bellOf("1"), 1);
  assert.equal(bellOf(1), 1);
  assert.equal(bellOf("12"), 12);
  assert.equal(bellOf("6"), 6);
  assert.equal(bellOf("0"), null);
  assert.equal(bellOf("01"), null);
  assert.equal(bellOf("13"), null);
  assert.equal(bellOf(""), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("5"), 5);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("01"), null);
  assert.equal(lengthOf("10"), 10);
  assert.equal(lengthOf(20), 20);
  assert.equal(lengthOf("40"), 40);
  assert.equal(lengthOf("0"), null);
  assert.equal(lengthOf("010"), null);
  assert.equal(lengthOf("15"), null);
  assert.equal(quietOf("0"), 0);
  assert.equal(quietOf(10), 10);
  assert.equal(quietOf("20"), 20);
  assert.equal(quietOf("15"), null);
  assert.equal(chimeBell(3), true);
  assert.equal(chimeBell(6), true);
  assert.equal(chimeBell(9), true);
  assert.equal(chimeBell(12), true);
  assert.equal(chimeBell(1), false);
  assert.equal(hushBell(1), true);
  assert.equal(hushBell(2), true);
  assert.equal(hushBell(3), false);
  assert.equal(hushBell(12), false);
  assert.equal(bellGap(1, 12), -1);
  assert.equal(bellGap(12, 1), 1);
  assert.equal(bellGap(1, 7), 6);
  assert.equal(bellGap(7, 1), -6);
  assert.equal(bellGap(6, 12), 6);
  assert.equal(bellGap(null, 2), null);
  assert.equal(bellGap(2, ""), null);
  assert.equal(bellGap(2, 0), null);
  assert.equal(activeBell("chime"), "chime");
  assert.equal(activeBell("99"), "all");
  assert.equal(activeWeight("3"), "3");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeLength("blank"), "blank");
  assert.equal(activeLength("15"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addSlip([], { id: "a", title: "Ada slip", note: "oak leaf", guide: "Nia", bell: "6", cloth: "linen", bay: "nth", step: "knock", weight: "5", length: "10", tags: "oak, vip, gold", quiet: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bell, 6);
  assert.equal(saved[0].weight, 5);
  assert.equal(saved[0].length, 10);
  assert.equal(saved[0].bay, "NTH");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["oak", "vip", "gold"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseBay(saved[0].bay), true);
  assert.equal(houseBay("IST"), false);
  assert.equal(soonSlip(saved[0]), true);
  assert.equal(lateSlip(saved[0], "12"), true);
  assert.equal(lateSlip(saved[0], "8"), false);
  assert.equal(addSlip(saved, { id: "b", title: "Ada slip" }).length, 1);
  assert.equal(addSlip(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((slips, slip) => addSlip(slips, slip), [] as ReturnType<typeof addSlip>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((slip) => slip.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cycleStep(saved, "a");
  assert.equal(cycled[0].step, "walk");
  assert.equal(cycled[0].audit, "step");
  assert.equal(cycleStep(cycled, "a")[0].step, "rest");
  assert.equal(cycleStep(cycleStep(cycled, "a"), "a")[0].step, "knock");
  const blankStep = addSlip([], { id: "z", title: "Blank step" });
  assert.equal(cycleStep(blankStep, "z")[0].step, "knock");

  const edited = editSlip(saved, "a", "Bea slip");
  assert.equal(edited[0].title, "Bea slip");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSlip(saved, "a", "   ")[0].title, "Ada slip");
  const noted = editSlipNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editSlipNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addSlip([], { id: "t", title: "Tag slip", tags: "oak" });
  const tagged = addSlipTag(oneTag, "t", "gold");
  assert.deepEqual(tagged[0].tags, ["oak", "gold"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addSlipTag(tagged, "t", "silk").length, 1);
  assert.equal(addSlipTag(addSlipTag(tagged, "t", "silk"), "t", "extra")[0].tags.length, 3);

  const quieted = setSlipQuiet(saved, "a", 10);
  assert.equal(quieted[0].quiet, 10);
  assert.equal(quieted[0].audit, "quiet");
  assert.equal(soonSlip(quieted[0]), false);
  assert.equal(lateSlip(quieted[0], "12"), false);
  assert.equal(setSlipQuiet(saved, "a", 15)[0].quiet, 0);

  const moved = bulkSlipCloth(saved, ["a"], "velvet");
  assert.equal(moved[0].cloth, "velvet");
  assert.equal(moved[0].audit, "cloth");
  assert.equal(bulkSlipCloth(saved, ["a"], "satin")[0].cloth, "linen");

  const second = addSlip(saved, { id: "b", title: "Bea slip", guide: "Ada", bell: "8", cloth: "linen", bay: "sth", step: "walk", weight: "5", length: "20", tags: "oak" });
  assert.equal(usedBells(second), 2);
  assert.equal(suggestCloth([]), "linen");
  assert.equal(suggestLength([]), 20);
  assert.equal(suggestGuide([]), "");
  assert.equal(fairGuide(second, "Bea, Ada"), "Bea");
  assert.equal(busiestGuide(second), "Ada");
  assert.equal(nextSlip(second, ""), "");
  assert.equal(nextSlip(second, "7"), "b");
  const finished = cycleStep(second, "b");
  assert.equal(finished.find((slip) => slip.id === "b")?.step, "rest");
  assert.equal(nextSlip(finished, "7"), "a");
  const resting = setSlipQuiet(second, "b", 20);
  assert.equal(nextSlip(resting, "7"), "a");
  const shown = visibleSlips(second, "open", "bea", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleSlips(second, "open", "oak", null, null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleSlips(second, "open", "", null, null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(clashBellCount(second), 0);
  const twin = addSlip(second, { id: "c", title: "Cara slip", guide: "Bea", bell: "6", cloth: "linen", bay: "est", step: "knock", weight: "1", length: "40" });
  assert.equal(clashBellCount(twin), 2);
  const split = addSlip(saved, { id: "b", title: "Warm slip", guide: "Ada", bell: "6", cloth: "silk", bay: "est", step: "knock", weight: "1", length: "40" });
  assert.equal(clashBellCount(split), 0);
  assert.equal(weightClashCount(second), 2);
  assert.equal(readSlips([{ id: "q", title: "Kept", bell: "01" }])[0].bell, null);
  assert.equal(reminderSlips(second, "12").some((slip) => slip.id === "a"), true);
  assert.equal(reminderSlips(quieted, "12").length, 0);
  assert.equal(sortSlips(second, "title")[0].title, "Ada slip");
  assert.equal(slipLine("  Ada slip  "), "Ada slip");

  const mixed = addSlip(
    addSlip(
      addSlip(
        addSlip(addSlip([], { id: "l1", title: "Linen one", cloth: "linen" }), { id: "l2", title: "Linen two", cloth: "linen" }),
        { id: "s1", title: "Silk one", cloth: "silk" },
      ),
      { id: "w1", title: "Wool one", cloth: "wool" },
    ),
    { id: "v1", title: "Velvet one", cloth: "velvet" },
  );
  assert.equal(suggestCloth(mixed), "silk");

  const view = addSlipView([], {
    id: "v1",
    name: "House chime",
    tray: "open",
    query: "ada",
    guide: "all",
    cloth: "linen",
    bay: "nth",
    step: "knock",
    bell: "chime",
    weight: "5",
    length: "10",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].bell, "chime");
  assert.equal(addSlipView(view, { ...view[0], id: "v2", name: "House chime" }).length, 1);

  const csv = slipsCsv(second, "12");
  assert.equal(csv.startsWith("title,guide,bell,cloth,bay,step,weight,length,tags,quiet,pinned,held,closed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Ada slip"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { retentionNote: "CALL" } },
    { id: "2", label: "Bea", note: { retentionNote: "word" } },
    { id: "3", label: "Gus", note: { retentionNote: "FILE" } },
    { id: "4", label: "Noa", note: { retentionNote: "Left a short word" } },
    { id: "5", label: "Paris", note: { retentionNote: "Please review the long retention note today" } },
    { id: "6", label: "Empty", note: { retentionNote: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { retentionNote: "CALL", balance: 1 } },
  ];
  assert.equal(ribbonCopy(rows[0].note), "CALL");
  assert.equal(ribbonState(rows[0].note), "set");
  assert.equal(ribbonBand(rows[0].note), "brief");
  assert.equal(ribbonBand(rows[3].note), "page");
  assert.equal(ribbonBand(rows[4].note), "scroll");
  assert.equal(ribbonTone(rows[0].note), "hard");
  assert.equal(ribbonTone(rows[1].note), "soft");
  assert.equal(ribbonState({ retentionNote: "Paris" }), "set");
  assert.equal(ribbonState(rows[5].note), "clear");
  assert.equal(ribbonState(rows[6].note), "");
  assert.equal(ribbonState(rows[7].note), "");
  assert.equal(ribbonState("CALL"), "set");
  assert.equal(catalogRibbon(rows[0].note), true);
  assert.equal(catalogRibbon(rows[1].note), true);
  assert.equal(catalogRibbon(rows[3].note), false);
  assert.equal(catalogRibbonCount(rows), 3);
  assert.equal(scrollRibbonCount(rows), 1);
  assert.equal(softRibbonCount(rows), 1);
  assert.equal(sharedRibbonCount(rows), 0);
  assert.equal(visibleRibbonCustomers(rows, "brief", null, "", "all", [], "all").length, 3);
  assert.equal(visibleRibbonCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = ribbonsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = ribbonRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "eslTitle"), ROUND196_COPY.en.eslTitle);
  assert.equal(crmv4Text("tr", "nrbTitle"), ROUND196_COPY.tr.nrbTitle);
  assert.equal(crmv4Text("de", "eslSearch"), ROUND196_COPY.de.eslSearch);
  assert.equal(crmv4Text("ru", "nrbHint"), ROUND196_COPY.ru.nrbHint);
  assert.equal(crmv4Text("ar", "eslNotice"), ROUND196_COPY.ar.eslNotice);
  assert.notEqual(ROUND196_COPY.tr.eslTitle, ROUND196_COPY.en.eslTitle);
  assert.notEqual(ROUND196_COPY.de.nrbTitle, ROUND196_COPY.en.nrbTitle);
  assert.notEqual(ROUND196_COPY.ru.eslSearch, ROUND196_COPY.en.eslSearch);
  assert.notEqual(ROUND196_COPY.ar.nrbSearch, ROUND196_COPY.en.nrbSearch);
  const keys = Object.keys(ROUND196_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND196_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-esl/);
  assert.match(css, /\.c4-nrb/);
  assert.match(css, /\.c4-wd-atelier/);
  assert.match(css, /\.c4-dep-atelier/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round196.tsx"), "utf8");
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
  assert.match(viewFile, /retentionNote/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /ribbonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-escorts/);
  assert.match(viewFile, /data-ribbons/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const withdraw = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round28.tsx"), "utf8");
  assert.match(withdraw, /c4-wd-atelier/);
  assert.match(withdraw, /data-logo="mono"/);
  assert.match(withdraw, /c4-wd-atelier-mast/);
  assert.match(withdraw, /c4-wd-atelier-queue/);
  assert.match(withdraw, /aria-required=\{false\}/);
  const deposit = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round29.tsx"), "utf8");
  assert.match(deposit, /c4-dep-atelier/);
  assert.match(deposit, /c4-dep-atelier-mast/);
  assert.match(deposit, /c4-dep-atelier-stage/);
  assert.match(deposit, /aria-required=\{false\}/);
  assert.match(deposit, /depSource/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "esl"/);
  assert.match(app, /view === "nrb"/);
  assert.match(app, /EscortSlips/);
  assert.match(app, /NoteRibbons/);
  console.log("crmv4 round196 tests passed");
}

main();
