/**
 * Salon frames and desk plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round179.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND179_COPY } from "../src/lib/crmv4/copy-round179";
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
} from "../src/lib/crmv4/round179";

function main() {
  assert.equal(chitMark("  de "), "DE");
  assert.equal(chitMark("tr"), "TR");
  assert.equal(chitMark("ae"), "AE");
  assert.equal(chitMark("   "), "");
  assert.equal(chitMark("G"), "");
  assert.equal(chitMark("GBR"), "");
  assert.equal(chitMark("G1"), "");
  assert.equal(chitMark("z".repeat(20)), "");

  assert.equal(bayOf("01"), 1);
  assert.equal(bayOf("06"), 6);
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("00"), null);
  assert.equal(bayOf("07"), null);
  assert.equal(bayOf("8"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf("3.0"), null);
  assert.equal(weightOf("3"), 3);
  assert.equal(weightOf(6), 6);
  assert.equal(weightOf(9), 9);
  assert.equal(weightOf("0"), null);
  assert.equal(weightOf("2"), null);
  assert.equal(weightOf("03"), null);
  assert.equal(reachOf("5"), 5);
  assert.equal(reachOf(12), 12);
  assert.equal(reachOf("9"), 9);
  assert.equal(reachOf("4"), null);
  assert.equal(reachOf("05"), null);
  assert.equal(reachOf(8), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(1), false);
  assert.equal(quietBay(1), true);
  assert.equal(quietBay(3), true);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(2), false);
  assert.equal(quietBay(4), false);
  assert.equal(bayGap(5, 1), 2);
  assert.equal(bayGap(1, 5), -2);
  assert.equal(bayGap(2, 2), 0);
  assert.equal(bayGap(1, 4), 3);
  assert.equal(bayGap(4, 1), -3);
  assert.equal(bayGap(null, 2), null);
  assert.equal(bayGap(2, ""), null);
  assert.equal(bayGap(2, 7), null);

  const saved = addChit([], { id: "a", title: "Frame Ada", note: "wool scan", hand: "Nia", bay: "06", grain: "wool", mark: "de", tone: "mist", weight: "3", reach: "5" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 6);
  assert.equal(saved[0].weight, 3);
  assert.equal(saved[0].reach, 5);
  assert.equal(saved[0].mark, "DE");
  assert.equal(saved[0].note, "wool scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeMark(saved[0].mark), true);
  assert.equal(soonChit(saved[0]), true);
  assert.equal(addChit(saved, { id: "b", title: "Frame Ada" }).length, 1);
  assert.equal(addChit(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addChit(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addChit(cards, card), [] as ReturnType<typeof addChit>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cycleTone(saved, "a");
  assert.equal(cycled[0].tone, "honey");
  assert.equal(cycled[0].audit, "glaze");
  assert.equal(cycleTone(cycled, "a")[0].tone, "soot");
  assert.equal(cycleTone(cycleTone(cycled, "a"), "a")[0].tone, "mist");
  const blankTone = addChit([], { id: "z", title: "Blank glaze" });
  assert.equal(cycleTone(blankTone, "z")[0].tone, "mist");

  const edited = editChit(saved, "a", "Frame Bea");
  assert.equal(edited[0].title, "Frame Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editChit(edited, "a", "  ")[0].title, "Frame Bea");
  const noted = editChitNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editChitNote(noted, "a", "  ")[0].note, "second look");
  const pair = addChit(noted, { id: "b", title: "Keep" });
  assert.equal(editChit(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Frame Bea");

  const open = addChit(addChit([], { id: "a", title: "Early", bay: "1", grain: "wool", reach: "9" }), { id: "b", title: "Later", bay: "5", grain: "linen", tone: "soot" });
  assert.equal(lateChit(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateChit(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  assert.equal(lateChit({ ...open[0], sealed: true }, 4), false);
  assert.equal(nextChit(open, 2), open.find((card) => card.title === "Early")?.id);
  assert.equal(nextChit(open, 1), open.find((card) => card.tone !== "soot")?.id);
  assert.equal(suggestGrain([]), "wool");
  assert.equal(suggestGrain(open), "silk");
  assert.equal(suggestHand(addChit(open, { id: "c", title: "Quiet", hand: "Ada", grain: "silk" })), "Ada");
  assert.equal(suggestReach([]), 9);
  assert.equal(suggestReach(open), 5);
  assert.equal(usedBays(open), 2);
  assert.equal(bulkChitGrain(open, ["b"], "silk").find((card) => card.id === "b")?.grain, "silk");
  assert.equal(bulkChitGrain(open, ["b"], "silk").find((card) => card.id === "b")?.audit, "shift");
  const shown = visibleChits(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = chitsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,hanger,hook,cloth,cipher,glaze,span,cord,band,pinned,hung,stored,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Frame Ada"), true);
  assert.equal(activeWeight("9"), "9");
  assert.equal(activeWeight("03"), "all");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeReach("05"), "all");
  assert.equal(activeReach("5"), "5");
  assert.equal(activeReach("12"), "12");
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
  assert.equal(views.length, 6);
  assert.equal(readChits(saved)[0].title, "Frame Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "K" },
    { id: "ann", label: "Ann", note: "North Wing" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { deskId: null } },
    { id: "dee", label: "Dee", note: { deskId: "TR", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "7#" },
    { id: "usa", label: "Usa", note: "US" },
    { id: "rail", label: "Rail", note: "north_wing" },
    { id: "seam", label: "Seam", note: "Saint-Jean" },
  ];
  assert.equal(slipState(rows[0].note), "set");
  assert.equal(slipBand(rows[0].note), "tick");
  assert.equal(slipDepth(rows[0].note), "plain");
  assert.equal(slipWords(rows[0].note), 1);
  assert.equal(ampSlip(rows[0].note), false);
  assert.equal(slipBand(rows[1].note), "banner");
  assert.equal(slipDepth(rows[1].note), "pair");
  assert.equal(slipWords(rows[1].note), 2);
  assert.equal(slipBand("a".repeat(40)), "banner");
  assert.equal(slipDepth("a".repeat(40)), "plain");
  assert.equal(slipDepth("Saint-Jean"), "seam");
  assert.equal(slipDepth("north_wing"), "rail");
  assert.equal(slipState(""), "clear");
  assert.equal(slipState({ deskId: null }), "clear");
  assert.equal(slipState({ deskId: "TR", saleStatus: "x" }), "");
  assert.equal(slipState({ city: "TR" }), "");
  assert.equal(slipState(12), "");
  assert.equal(ampSlip(rows[5].note), true);
  assert.equal(slipDepth(rows[5].note), "figure");
  assert.equal(slipBand(rows[5].note), "nick");
  assert.equal(slipBand(rows[6].note), "nick");
  assert.equal(oddSlipCount(rows), 1);
  assert.equal(leadingSlip(rows), "banner");
  assert.equal(leadingSlipDepth(rows), "plain");
  assert.equal(visibleSlipCustomers(rows, "tick", null, "", "all", [], "all").length, 1);
  assert.equal(visibleSlipCustomers(rows, null, null, "ann", "all", [], "amp").length, 0);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = slipsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(slipsCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",banner,"), true);
  const queue = slipRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,words,hash,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeSlip("gone", ["nick"]), "all");

  const copy = Object.keys(ROUND179_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND179_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "frmTitle"), "Salon frames");
  assert.equal(crmv4Text("tr", "dkpTitle"), ROUND179_COPY.tr.dkpTitle);
  assert.equal(crmv4Text("de", "frmHanger"), ROUND179_COPY.de.frmHanger);
  assert.equal(crmv4Text("ru", "dkpUnmarked"), ROUND179_COPY.ru.dkpUnmarked);
  assert.equal(crmv4Text("ar", "frmNotice"), ROUND179_COPY.ar.frmNotice);
  assert.notEqual(ROUND179_COPY.tr.frmTitle, ROUND179_COPY.en.frmTitle);
  assert.notEqual(ROUND179_COPY.de.dkpTitle, ROUND179_COPY.en.dkpTitle);
  assert.notEqual(ROUND179_COPY.ru.frmSearch, ROUND179_COPY.en.frmSearch);
  assert.notEqual(ROUND179_COPY.ar.dkpSearch, ROUND179_COPY.en.dkpSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-frm/);
  assert.match(css, /\.c4-dkp/);
  assert.match(css, /\.c4-book-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round179.tsx"), "utf8");
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
  assert.match(viewFile, /deskId/);
  assert.match(viewFile, /chitsCsv/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-frames/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestGrain/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "frames"/);
  assert.match(app, /view === "dkplt"/);
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(positions, /c4-book-salon/);
  assert.match(positions, /data-logo="mono"/);
  console.log("crmv4 round179 tests passed");
}

main();
