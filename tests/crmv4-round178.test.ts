/**
 * Atelier chits and city slips.
 * Run: TZ=UTC npx tsx tests/crmv4-round178.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND178_COPY } from "../src/lib/crmv4/copy-round178";
import {
  activeReach,
  activeSlip,
  activeWeight,
  addChit,
  addChitView,
  ampSlip,
  bayGap,
  bayOf,
  bulkChitGrain,
  bulkReview,
  chitMark,
  chitsCsv,
  cycleTone,
  editChit,
  editChitNote,
  homeMark,
  lateChit,
  leadingSlip,
  leadingSlipDepth,
  nextChit,
  oddSlipCount,
  peakBay,
  quietBay,
  reachOf,
  readChits,
  readReviewed,
  slipBand,
  slipDepth,
  slipRowsCsv,
  slipState,
  slipWords,
  slipsCsv,
  soonChit,
  suggestGrain,
  suggestHand,
  suggestReach,
  toggleReview,
  usedBays,
  visibleChits,
  visibleSlipCustomers,
  weightOf,
} from "../src/lib/crmv4/round178";

function main() {
  assert.equal(chitMark("  gb "), "GB");
  assert.equal(chitMark("fr"), "FR");
  assert.equal(chitMark("   "), "");
  assert.equal(chitMark("G"), "");
  assert.equal(chitMark("GBR"), "");
  assert.equal(chitMark("G1"), "");
  assert.equal("z".repeat(20) && chitMark("z".repeat(20)), "");

  assert.equal(bayOf("01"), 1);
  assert.equal(bayOf("08"), 8);
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("00"), null);
  assert.equal(bayOf("09"), null);
  assert.equal(bayOf("9"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf("3.0"), null);
  assert.equal(weightOf("2"), 2);
  assert.equal(weightOf(5), 5);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("3"), null);
  assert.equal(weightOf("02"), null);
  assert.equal(reachOf("4"), 4);
  assert.equal(reachOf(10), 10);
  assert.equal(reachOf("7"), 7);
  assert.equal(reachOf("2"), null);
  assert.equal(reachOf("04"), null);
  assert.equal(reachOf(8), null);
  assert.equal(peakBay(3), true);
  assert.equal(peakBay(7), true);
  assert.equal(peakBay(1), false);
  assert.equal(quietBay(1), true);
  assert.equal(quietBay(8), true);
  assert.equal(quietBay(4), true);
  assert.equal(quietBay(3), false);
  assert.equal(quietBay(2), false);
  assert.equal(bayGap(7, 1), 2);
  assert.equal(bayGap(1, 7), -2);
  assert.equal(bayGap(2, 2), 0);
  assert.equal(bayGap(1, 5), 4);
  assert.equal(bayGap(5, 1), -4);
  assert.equal(bayGap(null, 2), null);
  assert.equal(bayGap(2, ""), null);
  assert.equal(bayGap(2, 9), null);

  const saved = addChit([], { id: "a", title: "Chit Ada", note: "linen scan", hand: "Nia", bay: "08", grain: "linen", mark: "gb", tone: "pearl", weight: "2", reach: "4" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 8);
  assert.equal(saved[0].weight, 2);
  assert.equal(saved[0].reach, 4);
  assert.equal(saved[0].mark, "GB");
  assert.equal(saved[0].note, "linen scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeMark(saved[0].mark), true);
  assert.equal(soonChit(saved[0]), true);
  assert.equal(addChit(saved, { id: "b", title: "Chit Ada" }).length, 1);
  assert.equal(addChit(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addChit(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 13 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addChit(cards, card), [] as ReturnType<typeof addChit>);
  assert.equal(capped.length, 10);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 12");

  const cycled = cycleTone(saved, "a");
  assert.equal(cycled[0].tone, "amber");
  assert.equal(cycled[0].audit, "tone");
  assert.equal(cycleTone(cycled, "a")[0].tone, "ink");
  assert.equal(cycleTone(cycleTone(cycled, "a"), "a")[0].tone, "pearl");
  const blankTone = addChit([], { id: "z", title: "Blank tone" });
  assert.equal(cycleTone(blankTone, "z")[0].tone, "pearl");

  const edited = editChit(saved, "a", "Chit Bea");
  assert.equal(edited[0].title, "Chit Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editChit(edited, "a", "  ")[0].title, "Chit Bea");
  const noted = editChitNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editChitNote(noted, "a", "  ")[0].note, "second look");
  const pair = addChit(noted, { id: "b", title: "Keep" });
  assert.equal(editChit(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Chit Bea");

  const open = addChit(addChit([], { id: "a", title: "Early", bay: "1", grain: "linen", reach: "7" }), { id: "b", title: "Later", bay: "5", grain: "slate", tone: "ink" });
  assert.equal(lateChit(open.find((card) => card.title === "Early") as (typeof open)[number], 5), true);
  assert.equal(lateChit(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  assert.equal(lateChit({ ...open[0], sealed: true }, 5), false);
  assert.equal(nextChit(open, 2), open.find((card) => card.title === "Early")?.id);
  assert.equal(nextChit(open, 1), open.find((card) => card.tone !== "ink")?.id);
  assert.equal(suggestGrain([]), "linen");
  assert.equal(suggestGrain(open), "oak");
  assert.equal(suggestHand(addChit(open, { id: "c", title: "Quiet", hand: "Ada", grain: "oak" })), "Ada");
  assert.equal(suggestReach([]), 7);
  assert.equal(suggestReach(open), 4);
  assert.equal(usedBays(open), 2);
  assert.equal(bulkChitGrain(open, ["b"], "oak").find((card) => card.id === "b")?.grain, "oak");
  assert.equal(bulkChitGrain(open, ["b"], "oak").find((card) => card.id === "b")?.audit, "shift");
  const shown = visibleChits(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = chitsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,hand,bay,grain,mark,tone,weight,reach,band,pinned,sealed,boxed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Chit Ada"), true);
  assert.equal(activeWeight("8"), "8");
  assert.equal(activeWeight("05"), "all");
  assert.equal(activeWeight("3"), "all");
  assert.equal(activeReach("04"), "all");
  assert.equal(activeReach("4"), "4");
  assert.equal(activeReach("10"), "10");
  const views = Array.from({ length: 8 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    hand: "all",
    grain: "all",
    mark: "all",
    tone: "all",
    bay: "all",
    weight: "all",
    reach: "all",
  })).reduce((list, view) => addChitView(list, view), [] as ReturnType<typeof addChitView>);
  assert.equal(views.length, 7);
  assert.equal(readChits(saved)[0].title, "Chit Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "K" },
    { id: "ann", label: "Ann", note: "United Kingdom" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { city: null } },
    { id: "dee", label: "Dee", note: { city: "TR", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "TR & 4" },
    { id: "usa", label: "Usa", note: "US" },
  ];
  assert.equal(slipState(rows[0].note), "set");
  assert.equal(slipBand(rows[0].note), "dot");
  assert.equal(slipDepth(rows[0].note), "plain");
  assert.equal(slipWords(rows[0].note), 1);
  assert.equal(ampSlip(rows[0].note), false);
  assert.equal(slipBand(rows[1].note), "city");
  assert.equal(slipDepth(rows[1].note), "pair");
  assert.equal(slipWords(rows[1].note), 2);
  assert.equal(slipBand("a".repeat(40)), "sprawl");
  assert.equal(slipDepth("a".repeat(40)), "plain");
  assert.equal(slipDepth("Saint-Jean"), "joint");
  assert.equal(slipState(""), "clear");
  assert.equal(slipState({ city: null }), "clear");
  assert.equal(slipState({ city: "TR", saleStatus: "x" }), "");
  assert.equal(slipState(12), "");
  assert.equal(ampSlip(rows[5].note), true);
  assert.equal(slipDepth(rows[5].note), "cipher");
  assert.equal(slipBand(rows[6].note), "town");
  assert.equal(oddSlipCount(rows), 2);
  assert.equal(leadingSlip(rows), "town");
  assert.equal(leadingSlipDepth(rows), "plain");
  assert.equal(visibleSlipCustomers(rows, "dot", null, "", "all", [], "all").length, 1);
  assert.equal(visibleSlipCustomers(rows, null, null, "ann", "all", [], "amp").length, 0);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = slipsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(slipsCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",town,"), true);
  const queue = slipRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,words,amp,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeSlip("gone", ["town"]), "all");

  const copy = Object.keys(ROUND178_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND178_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "chtTitle"), "Atelier chits");
  assert.equal(crmv4Text("tr", "cslTitle"), ROUND178_COPY.tr.cslTitle);
  assert.equal(crmv4Text("de", "chtHand"), ROUND178_COPY.de.chtHand);
  assert.equal(crmv4Text("ru", "cslUnmarked"), ROUND178_COPY.ru.cslUnmarked);
  assert.equal(crmv4Text("ar", "chtNotice"), ROUND178_COPY.ar.chtNotice);
  assert.notEqual(ROUND178_COPY.tr.chtTitle, ROUND178_COPY.en.chtTitle);
  assert.notEqual(ROUND178_COPY.de.cslTitle, ROUND178_COPY.en.cslTitle);
  assert.notEqual(ROUND178_COPY.ru.chtSearch, ROUND178_COPY.en.chtSearch);
  assert.notEqual(ROUND178_COPY.ar.cslSearch, ROUND178_COPY.en.cslSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-cht/);
  assert.match(css, /\.c4-csl/);
  assert.match(css, /\.c4-fin-atelier/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round178.tsx"), "utf8");
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
  assert.match(viewFile, /city/);
  assert.match(viewFile, /chitsCsv/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-chits/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestGrain/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chits"/);
  assert.match(app, /view === "ctysl"/);
  const finance = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Finance.tsx"), "utf8");
  assert.match(finance, /c4-fin-atelier/);
  assert.match(finance, /data-logo="mono"/);
  console.log("crmv4 round178 tests passed");
}

main();
