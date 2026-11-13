/**
 * Winter trellises and phone stems.
 * Run: TZ=UTC npx tsx tests/crmv4-round175.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND175_COPY } from "../src/lib/crmv4/copy-round175";
import {
  activeLean,
  activeSpan,
  activeStem,
  addTrellis,
  addTrellisView,
  bulkReview,
  bulkTrellisWeave,
  caneHeight,
  cycleStain,
  editTrellis,
  editTrellisNote,
  heightGap,
  heightOf,
  lateTrellis,
  leanOf,
  leadingStem,
  leadingStemDepth,
  nextTrellis,
  oddStemCount,
  plusStem,
  readReviewed,
  readTrellises,
  soonTrellis,
  spanOf,
  stemBand,
  stemDepth,
  stemDigits,
  stemRowsCsv,
  stemState,
  stemsCsv,
  suggestSpan,
  suggestWeave,
  suggestWeaver,
  tipHeight,
  toggleReview,
  trellisBay,
  trellisesCsv,
  usedHeights,
  visibleStemCustomers,
  visibleTrellises,
} from "../src/lib/crmv4/round175";

function main() {
  assert.equal(trellisBay("  BAY  "), "BAY");
  assert.equal(trellisBay("   "), "");
  assert.equal(trellisBay("z".repeat(20)).length, 5);

  assert.equal(heightOf("01"), 1);
  assert.equal(heightOf("08"), 8);
  assert.equal(heightOf("1"), 1);
  assert.equal(heightOf(8), 8);
  assert.equal(heightOf("00"), null);
  assert.equal(heightOf("09"), null);
  assert.equal(heightOf("9"), null);
  assert.equal(heightOf(""), null);
  assert.equal(heightOf("3.0"), null);
  assert.equal(leanOf("01"), 1);
  assert.equal(leanOf(4), 4);
  assert.equal(leanOf("0"), null);
  assert.equal(leanOf("5"), null);
  assert.equal(spanOf("4"), 4);
  assert.equal(spanOf(32), 32);
  assert.equal(spanOf("1"), null);
  assert.equal(spanOf("04"), null);
  assert.equal(spanOf(6), null);
  assert.equal(tipHeight(1), true);
  assert.equal(tipHeight(8), true);
  assert.equal(tipHeight(2), false);
  assert.equal(caneHeight(3), true);
  assert.equal(caneHeight(6), true);
  assert.equal(caneHeight(2), false);
  assert.equal(caneHeight(7), false);
  assert.equal(heightGap(7, 1), 2);
  assert.equal(heightGap(1, 7), -2);
  assert.equal(heightGap(2, 2), 0);
  assert.equal(heightGap(1, 5), 4);
  assert.equal(heightGap(5, 1), -4);
  assert.equal(heightGap(null, 2), null);
  assert.equal(heightGap(2, ""), null);
  assert.equal(heightGap(2, 9), null);

  const saved = addTrellis([], { id: "a", title: "Trellis Ada", note: "glass scan", weaver: "Nia", height: "08", weave: "plain", bay: "A1", stain: "mist", lean: "01", span: "4" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].height, 8);
  assert.equal(saved[0].lean, 1);
  assert.equal(saved[0].span, 4);
  assert.equal(saved[0].note, "glass scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(soonTrellis(saved[0]), true);
  assert.equal(addTrellis(saved, { id: "b", title: "Trellis Ada" }).length, 1);
  assert.equal(addTrellis(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addTrellis(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 11 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addTrellis(cards, card), [] as ReturnType<typeof addTrellis>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 10");

  const cycled = cycleStain(saved, "a");
  assert.equal(cycled[0].stain, "honey");
  assert.equal(cycled[0].audit, "stain");
  assert.equal(cycleStain(cycled, "a")[0].stain, "ink");
  assert.equal(cycleStain(cycleStain(cycled, "a"), "a")[0].stain, "mist");
  const blankStain = addTrellis([], { id: "z", title: "Blank stain" });
  assert.equal(cycleStain(blankStain, "z")[0].stain, "mist");

  const edited = editTrellis(saved, "a", "Trellis Bea");
  assert.equal(edited[0].title, "Trellis Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editTrellis(edited, "a", "  ")[0].title, "Trellis Bea");
  const noted = editTrellisNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editTrellisNote(noted, "a", "  ")[0].note, "second look");
  const pair = addTrellis(noted, { id: "b", title: "Keep" });
  assert.equal(editTrellis(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Trellis Bea");

  const open = addTrellis(addTrellis([], { id: "a", title: "Early", height: "1", weave: "plain", span: "8" }), { id: "b", title: "Later", height: "6", weave: "twist", stain: "ink" });
  assert.equal(lateTrellis(open[0], 5), false);
  assert.equal(lateTrellis(open.find((card) => card.title === "Early") as (typeof open)[number], 5), true);
  assert.equal(lateTrellis({ ...open[0], trained: true }, 1), false);
  assert.equal(nextTrellis(open, 2), open.find((card) => card.title === "Early")?.id);
  assert.equal(nextTrellis(open, 8), open.find((card) => card.stain !== "ink")?.id);
  assert.equal(suggestWeave([]), "plain");
  assert.equal(suggestWeave(open), "braid");
  assert.equal(suggestWeaver(addTrellis(open, { id: "c", title: "Quiet", weaver: "Ada", weave: "braid" })), "Ada");
  assert.equal(suggestSpan([]), 8);
  assert.equal(suggestSpan(saved), 8);
  assert.equal(usedHeights(open), 2);
  assert.equal(bulkTrellisWeave(open, ["b"], "braid").find((card) => card.id === "b")?.weave, "braid");
  assert.equal(bulkTrellisWeave(open, ["b"], "braid").find((card) => card.id === "b")?.audit, "shift");
  const shown = visibleTrellises(open, "open", "early", null, null, null, null, null, null, null, null, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = trellisesCsv(saved, 2);
  assert.equal(sheet.startsWith("title,weaver,height,weave,bay,stain,lean,span,band,pinned,trained,stored,gap,late,soon,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Trellis Ada"), true);
  assert.equal(activeLean("5"), "all");
  assert.equal(activeLean("4"), "4");
  assert.equal(activeSpan("04"), "all");
  assert.equal(activeSpan("16"), "16");
  const views = Array.from({ length: 6 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    weaver: "all",
    weave: "all",
    bay: "all",
    stain: "all",
    height: "all",
    lean: "all",
    span: "all",
  })).reduce((list, view) => addTrellisView(list, view), [] as ReturnType<typeof addTrellisView>);
  assert.equal(views.length, 5);
  assert.equal(readTrellises(saved)[0].title, "Trellis Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "+90 555 11" },
    { id: "ann", label: "Ann", note: "1234567890123" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { phone: null } },
    { id: "dee", label: "Dee", note: { phone: "12", saleStatus: "x" } },
  ];
  assert.equal(stemState(rows[0].note), "set");
  assert.equal(stemBand(rows[0].note), "local");
  assert.equal(stemDepth(rows[0].note), "mid");
  assert.equal(stemDigits(rows[0].note), "9055511");
  assert.equal(plusStem(rows[0].note), true);
  assert.equal(stemBand(rows[1].note), "trunk");
  assert.equal(stemDepth(rows[1].note), "far");
  assert.equal(stemBand("1234"), "short");
  assert.equal(stemDepth("1234"), "near");
  assert.equal(stemState(""), "clear");
  assert.equal(stemState({ phone: null }), "clear");
  assert.equal(stemState({ phone: "12", saleStatus: "x" }), "");
  assert.equal(stemState(12), "");
  assert.equal(oddStemCount(rows), 2);
  assert.equal(leadingStem(rows), "local");
  assert.equal(leadingStemDepth(rows), "mid");
  assert.equal(visibleStemCustomers(rows, "local", null, "", "all", [], "all").length, 1);
  assert.equal(visibleStemCustomers(rows, null, null, "ann", "all", [], "plus").length, 0);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = stemsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(stemsCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",local,"), true);
  const queue = stemRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,digits,plus,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeStem("gone", ["local"]), "all");

  const copy = Object.keys(ROUND175_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND175_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "wtrTitle"), "Winter trellises");
  assert.equal(crmv4Text("tr", "pstTitle"), "Pastane fişleri");
  assert.equal(crmv4Text("de", "wtrWeaver"), ROUND175_COPY.de.wtrWeaver);
  assert.equal(crmv4Text("ru", "pstUnmarked"), ROUND175_COPY.ru.pstUnmarked);
  assert.equal(crmv4Text("ar", "wtrNotice"), ROUND175_COPY.ar.wtrNotice);
  assert.notEqual(ROUND175_COPY.tr.wtrTitle, ROUND175_COPY.en.wtrTitle);
  assert.notEqual(ROUND175_COPY.de.pstTitle, ROUND175_COPY.en.pstTitle);
  assert.notEqual(ROUND175_COPY.ru.wtrSearch, ROUND175_COPY.en.wtrSearch);
  assert.notEqual(ROUND175_COPY.ar.pstSearch, ROUND175_COPY.en.pstSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-wtr/);
  assert.match(css, /\.c4-pst/);
  assert.match(css, /\.c4-book-vine/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round175.tsx"), "utf8");
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
  assert.match(viewFile, /phone/);
  assert.match(viewFile, /trellisesCsv/);
  assert.match(viewFile, /stemsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-trellises/);
  assert.match(viewFile, /data-stems/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestWeave/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "wtrls"/);
  assert.match(app, /view === "pstems"/);
  const positions = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Positions.tsx"), "utf8");
  assert.match(positions, /c4-book-vine/);
  console.log("crmv4 round175 tests passed");
}

main();
