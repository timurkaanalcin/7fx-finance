/**
 * Press slips and partner codes.
 * Run: TZ=UTC npx tsx tests/crmv4-round181.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND181_COPY } from "../src/lib/crmv4/copy-round181";
import {
  activeReach,
  activeWeight,
  addSlip,
  addSlipView,
  bayGap,
  bayOf,
  bulkCodeReview,
  bulkSlipDye,
  codeBand,
  codeDepth,
  codeRowsCsv,
  codeState,
  codeWords,
  codesCsv,
  cycleFoil,
  dotCode,
  editSlip,
  editSlipNote,
  homeMark,
  lateSlip,
  leadingCode,
  leadingCodeDepth,
  nextSlip,
  oddCodeCount,
  peakBay,
  quietBay,
  reachOf,
  readReviewedCodes,
  readSlips,
  slipMark,
  soonSlip,
  suggestDye,
  suggestReach,
  suggestSetter,
  toggleCodeReview,
  usedBays,
  visibleCodeCustomers,
  visibleSlips,
  weightOf,
  slipsCsv,
} from "../src/lib/crmv4/round181";

function main() {
  assert.equal(slipMark("  en "), "EN");
  assert.equal(slipMark("tr"), "TR");
  assert.equal(slipMark("ae"), "AE");
  assert.equal(slipMark("   "), "");
  assert.equal(slipMark("G"), "");
  assert.equal(slipMark("GBR"), "");
  assert.equal(slipMark("G1"), "");
  assert.equal(slipMark("z".repeat(20)), "");

  assert.equal(bayOf("01"), 1);
  assert.equal(bayOf("06"), 6);
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("00"), null);
  assert.equal(bayOf("07"), null);
  assert.equal(bayOf("7"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf("3.0"), null);
  assert.equal(weightOf("1"), 1);
  assert.equal(weightOf(5), 5);
  assert.equal(weightOf(3), 3);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("01"), null);
  assert.equal(reachOf("4"), 4);
  assert.equal(reachOf(12), 12);
  assert.equal(reachOf(8), 8);
  assert.equal(reachOf("0"), null);
  assert.equal(reachOf("6"), null);
  assert.equal(reachOf("04"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(6), true);
  assert.equal(peakBay(1), false);
  assert.equal(quietBay(1), true);
  assert.equal(quietBay(3), true);
  assert.equal(quietBay(5), true);
  assert.equal(quietBay(2), false);
  assert.equal(quietBay(6), false);
  assert.equal(bayGap(4, 1), -3);
  assert.equal(bayGap(1, 4), 3);
  assert.equal(bayGap(2, 2), 0);
  assert.equal(bayGap(1, 5), -2);
  assert.equal(bayGap(5, 1), 2);
  assert.equal(bayGap(null, 2), null);
  assert.equal(bayGap(2, ""), null);
  assert.equal(bayGap(2, 7), null);
  assert.equal(bayGap(2, 9), null);

  const saved = addSlip([], { id: "a", title: "Slip Ada", note: "soot scan", setter: "Nia", bay: "06", dye: "soot", mark: "tr", foil: "gilt", weight: "5", reach: "4" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 6);
  assert.equal(saved[0].weight, 5);
  assert.equal(saved[0].reach, 4);
  assert.equal(saved[0].mark, "TR");
  assert.equal(saved[0].note, "soot scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeMark(saved[0].mark), true);
  assert.equal(homeMark("EN"), false);
  assert.equal(soonSlip(saved[0]), true);
  assert.equal(addSlip(saved, { id: "b", title: "Slip Ada" }).length, 1);
  assert.equal(addSlip(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addSlip(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addSlip(cards, card), [] as ReturnType<typeof addSlip>);
  assert.equal(capped.length, 7);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleFoil(saved, "a");
  assert.equal(cycled[0].foil, "nickel");
  assert.equal(cycled[0].audit, "foil");
  assert.equal(cycleFoil(cycled, "a")[0].foil, "umber");
  assert.equal(cycleFoil(cycleFoil(cycled, "a"), "a")[0].foil, "gilt");
  const blankTone = addSlip([], { id: "z", title: "Blank foil" });
  assert.equal(cycleFoil(blankTone, "z")[0].foil, "gilt");

  const edited = editSlip(saved, "a", "Slip Bea");
  assert.equal(edited[0].title, "Slip Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editSlip(edited, "a", "  ")[0].title, "Slip Bea");
  const noted = editSlipNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editSlipNote(noted, "a", "  ")[0].note, "second look");
  const pair = addSlip(noted, { id: "b", title: "Keep" });
  assert.equal(editSlip(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Slip Bea");

  const early = addSlip([], { id: "a", title: "Early", bay: "1", dye: "soot", reach: "12", setter: "Nia", weight: "5" });
  const mid = addSlip(early, { id: "m", title: "Mid", bay: "3", dye: "ochre", reach: "8", setter: "Ada", weight: "1" });
  const open = addSlip(mid, { id: "b", title: "Later", bay: "6", foil: "umber" });
  assert.equal(lateSlip(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateSlip(open.find((card) => card.title === "Early") as (typeof open)[number], 3), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateSlip({ ...earlyCard, boxed: true }, 4), false);
  assert.equal(nextSlip(open, 2), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextSlip(open, 5), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestDye([]), "soot");
  assert.equal(suggestDye(open), "ivory");
  assert.equal(suggestSetter(open), "Ada");
  assert.equal(suggestReach([]), 8);
  assert.equal(suggestReach(open), 4);
  assert.equal(usedBays(open), 3);
  assert.equal(bulkSlipDye(open, ["b"], "ivory").find((card) => card.id === "b")?.dye, "ivory");
  assert.equal(bulkSlipDye(open, ["b"], "ivory").find((card) => card.id === "b")?.audit, "dye");
  const shown = visibleSlips(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = slipsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,setter,bay,dye,mark,foil,weight,reach,band,pinned,held,boxed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Slip Ada"), true);
  assert.equal(activeWeight("01"), "all");
  assert.equal(activeWeight("1"), "1");
  assert.equal(activeReach("04"), "all");
  assert.equal(activeReach("4"), "4");
  assert.equal(activeReach("12"), "12");
  const views = Array.from({ length: 6 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    setter: "all",
    dye: "all",
    mark: "all",
    foil: "all",
    bay: "all",
    weight: "all",
    reach: "all",
  })).reduce((list, view) => addSlipView(list, view), [] as ReturnType<typeof addSlipView>);
  assert.equal(views.length, 4);
  assert.equal(readSlips(saved)[0].title, "Slip Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "K" },
    { id: "ann", label: "Ann", note: "North Wing" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { affiliateC: null } },
    { id: "dee", label: "Dee", note: { affiliateC: "TR", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "7#" },
    { id: "usa", label: "Usa", note: "US" },
    { id: "rail", label: "Rail", note: "north_wing" },
    { id: "seam", label: "Seam", note: "Saint-Jean" },
    { id: "dot", label: "Dot", note: "ab.cd" },
  ];
  assert.equal(codeState(rows[0].note), "set");
  assert.equal(codeBand(rows[0].note), "pip");
  assert.equal(codeDepth(rows[0].note), "plain");
  assert.equal(codeWords(rows[0].note), 1);
  assert.equal(dotCode(rows[0].note), false);
  assert.equal(codeBand(rows[1].note), "card");
  assert.equal(codeDepth(rows[1].note), "pair");
  assert.equal(codeWords(rows[1].note), 2);
  assert.equal(codeBand("a".repeat(40)), "roll");
  assert.equal(codeDepth("a".repeat(40)), "plain");
  assert.equal(codeDepth("Saint-Jean"), "seam");
  assert.equal(codeDepth("north_wing"), "rail");
  assert.equal(codeState(""), "clear");
  assert.equal(codeState({ affiliateC: null }), "clear");
  assert.equal(codeState({ affiliateC: "TR", saleStatus: "x" }), "");
  assert.equal(codeState({ city: "TR" }), "");
  assert.equal(codeState(12), "");
  assert.equal(dotCode("ab.cd"), true);
  assert.equal(codeDepth("ab.cd"), "rail");
  assert.equal(codeBand("ab.cd"), "slip");
  assert.equal(codeBand(rows[5].note), "pip");
  assert.equal(codeDepth(rows[5].note), "figure");
  assert.equal(codeBand(rows[6].note), "pip");
  assert.equal(oddCodeCount(rows), 1);
  assert.equal(leadingCode(rows), "pip");
  assert.equal(leadingCodeDepth(rows), "plain");
  assert.equal(visibleCodeCustomers(rows, "pip", null, "", "all", [], "all").length, 3);
  assert.equal(visibleCodeCustomers(rows, null, null, "ann", "all", [], "dot").length, 0);
  assert.deepEqual(readReviewedCodes(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkCodeReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleCodeReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = codesCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(codesCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",pip,"), true);
  const queue = codeRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,words,dot,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);

  const copy = Object.keys(ROUND181_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND181_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "prsTitle"), "Press slips");
  assert.equal(crmv4Text("tr", "pcmTitle"), ROUND181_COPY.tr.pcmTitle);
  assert.equal(crmv4Text("de", "prsSetter"), ROUND181_COPY.de.prsSetter);
  assert.equal(crmv4Text("ru", "pcmUnmarked"), ROUND181_COPY.ru.pcmUnmarked);
  assert.equal(crmv4Text("ar", "prsNotice"), ROUND181_COPY.ar.prsNotice);
  assert.notEqual(ROUND181_COPY.tr.prsTitle, ROUND181_COPY.en.prsTitle);
  assert.notEqual(ROUND181_COPY.de.pcmTitle, ROUND181_COPY.en.pcmTitle);
  assert.notEqual(ROUND181_COPY.ru.prsSearch, ROUND181_COPY.en.prsSearch);
  assert.notEqual(ROUND181_COPY.ar.pcmSearch, ROUND181_COPY.en.pcmSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-prs/);
  assert.match(css, /\.c4-pcm/);
  assert.match(css, /\.c4-rail-compositor/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round181.tsx"), "utf8");
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
  assert.match(viewFile, /affiliateC/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /codesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-codes/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestDye/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "press"/);
  assert.match(app, /view === "pcmk"/);
  assert.match(app, /c4-rail-compositor/);
  console.log("crmv4 round181 tests passed");
}

main();
