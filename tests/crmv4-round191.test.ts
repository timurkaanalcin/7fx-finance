/**
 * Review minutes and notice crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round191.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND191_COPY } from "../src/lib/crmv4/copy-round191";
import {
  activeMinute,
  activePages,
  activeSpan,
  addReview,
  addReviewView,
  bulkReviewCloth,
  bulkReviewFile,
  catalogCrest,
  catalogCrestCount,
  crestBand,
  crestRowsCsv,
  crestState,
  crestVoice,
  crestsCsv,
  cycleStage,
  editReview,
  editReviewNote,
  fairReader,
  folioOf,
  houseFolio,
  lateReview,
  minuteGap,
  minuteOf,
  nextReview,
  pagesOf,
  peakMinute,
  quietMinute,
  readReviews,
  reviewsCsv,
  sharedCrestCount,
  soonReview,
  spanDays,
  suggestCloth,
  suggestReader,
  suggestSpan,
  usedMinutes,
  visibleCrestCustomers,
  visibleReviews,
  vowelCrest,
  vowelCrestCount,
  wideCrest,
  wideCrestCount,
} from "../src/lib/crmv4/round191";

function main() {
  assert.equal(folioOf("  ky "), "KY");
  assert.equal(folioOf("po"), "PO");
  assert.equal(folioOf("id"), "ID");
  assert.equal(folioOf("   "), "");
  assert.equal(folioOf("K"), "");
  assert.equal(folioOf("KY1"), "");
  assert.equal(minuteOf("0"), 0);
  assert.equal(minuteOf(0), 0);
  assert.equal(minuteOf("59"), 59);
  assert.equal(minuteOf("12"), 12);
  assert.equal(minuteOf("00"), null);
  assert.equal(minuteOf("08"), null);
  assert.equal(minuteOf("60"), null);
  assert.equal(minuteOf(""), null);
  assert.equal(pagesOf("2"), 2);
  assert.equal(pagesOf(12), 12);
  assert.equal(pagesOf("0"), null);
  assert.equal(pagesOf("4"), null);
  assert.equal(pagesOf("06"), null);
  assert.equal(spanDays("2"), 2);
  assert.equal(spanDays(9), 9);
  assert.equal(spanDays("0"), null);
  assert.equal(spanDays("04"), null);
  assert.equal(spanDays("1"), null);
  assert.equal(peakMinute(12), true);
  assert.equal(peakMinute(42), true);
  assert.equal(peakMinute(0), false);
  assert.equal(quietMinute(3), true);
  assert.equal(quietMinute(48), true);
  assert.equal(quietMinute(12), false);
  assert.equal(quietMinute(42), false);
  assert.equal(minuteGap(59, 0), 1);
  assert.equal(minuteGap(0, 59), -1);
  assert.equal(minuteGap(0, 30), 30);
  assert.equal(minuteGap(30, 0), -30);
  assert.equal(minuteGap(10, 50), -20);
  assert.equal(minuteGap(null, 2), null);
  assert.equal(minuteGap(2, ""), null);
  assert.equal(minuteGap(2, 60), null);
  assert.equal(activeMinute("peak"), "peak");
  assert.equal(activeMinute("99"), "all");
  assert.equal(activePages("6"), "6");
  assert.equal(activePages("3"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("7"), "all");

  const saved = addReview([], { id: "a", title: "Passport Ada", note: "oak leaf", reader: "Nia", minute: "6", cloth: "linen", folio: "ky", stage: "draft", pages: "12", span: "2" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].minute, 6);
  assert.equal(saved[0].pages, 12);
  assert.equal(saved[0].span, 2);
  assert.equal(saved[0].folio, "KY");
  assert.equal(saved[0].note, "oak leaf");
  assert.equal(saved[0].audit, "save");
  assert.equal(houseFolio(saved[0].folio), true);
  assert.equal(houseFolio("US"), false);
  assert.equal(soonReview(saved[0]), true);
  assert.equal(lateReview(saved[0], "13"), true);
  assert.equal(lateReview(saved[0], "12"), false);
  assert.equal(addReview(saved, { id: "b", title: "Passport Ada" }).length, 1);
  assert.equal(addReview(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addReview(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addReview(cards, card), [] as ReturnType<typeof addReview>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cycleStage(saved, "a");
  assert.equal(cycled[0].stage, "read");
  assert.equal(cycled[0].audit, "stage");
  assert.equal(cycleStage(cycled, "a")[0].stage, "seal");
  assert.equal(cycleStage(cycleStage(cycled, "a"), "a")[0].stage, "draft");
  const blankStage = addReview([], { id: "z", title: "Blank stage" });
  assert.equal(cycleStage(blankStage, "z")[0].stage, "draft");

  const edited = editReview(saved, "a", "Passport Bea");
  assert.equal(edited[0].title, "Passport Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editReview(saved, "a", "   ")[0].title, "Passport Ada");
  const noted = editReviewNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editReviewNote(saved, "a", "   ")[0].note, "oak leaf");

  const moved = bulkReviewCloth(saved, ["a"], "ivory");
  assert.equal(moved[0].cloth, "ivory");
  assert.equal(moved[0].audit, "cloth");
  assert.equal(bulkReviewCloth(saved, ["a"], "silk")[0].cloth, "linen");
  const filed = bulkReviewFile(saved, ["a"], true);
  assert.equal(filed[0].filed, true);
  assert.equal(soonReview(filed[0]), false);
  assert.equal(lateReview(filed[0], "40"), false);

  const second = addReview(saved, { id: "b", title: "Proof Bea", reader: "Ada", minute: "12", cloth: "linen", folio: "po", stage: "read", pages: "12", span: "4" });
  assert.equal(usedMinutes(second), 2);
  assert.equal(suggestCloth([]), "champagne");
  assert.equal(suggestSpan([]), 4);
  assert.equal(suggestReader([]), "");
  assert.equal(fairReader(second, "Bea, Ada"), "Bea");
  assert.equal(nextReview(second, ""), "");
  assert.equal(nextReview(second, "10"), "b");
  const sealed = cycleStage(second, "b");
  assert.equal(sealed.find((card) => card.id === "b")?.stage, "seal");
  assert.equal(nextReview(sealed, "10"), "a");
  const shown = visibleReviews(second, "open", "bea", null, null, null, null, null, null, null, null, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const house = visibleReviews(second, "open", "", null, null, null, null, null, null, null, null, false, false, true, false);
  assert.equal(house.length, 2);
  assert.equal(readReviews([{ id: "q", title: "Kept", minute: "08" }])[0].minute, null);

  const view = addReviewView([], {
    id: "v1",
    name: "House peak",
    tray: "open",
    query: "ada",
    reader: "all",
    cloth: "linen",
    folio: "ky",
    stage: "draft",
    minute: "peak",
    pages: "12",
    span: "2",
  });
  assert.equal(view.length, 1);
  assert.equal(view[0].minute, "peak");
  assert.equal(addReviewView(view, { ...view[0], id: "v2", name: "House peak" }).length, 1);

  const csv = reviewsCsv(second, "20");
  assert.equal(csv.startsWith("title,reader,minute,cloth,folio,stage,pages,span,band,pinned,parked,filed,gap,late,soon,house,note,audit"), true);
  assert.equal(csv.includes("Passport Ada"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { campaign: "IVY" } },
    { id: "2", label: "Bea", note: { campaign: "IVY" } },
    { id: "3", label: "Gus", note: { campaign: "GOLD88" } },
    { id: "4", label: "Noa", note: { campaign: "CHAM1901" } },
    { id: "5", label: "Plain", note: { campaign: "BND" } },
    { id: "6", label: "Empty", note: { campaign: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { campaign: "IVY", balance: 1 } },
  ];
  assert.equal(crestState(rows[0].note), "set");
  assert.equal(crestBand(rows[0].note), "chip");
  assert.equal(crestBand(rows[2].note), "plaque");
  assert.equal(crestBand(rows[3].note), "shield");
  assert.equal(crestVoice(rows[0].note), "vowel");
  assert.equal(crestVoice(rows[4].note), "plain");
  assert.equal(crestState(rows[5].note), "clear");
  assert.equal(crestState(rows[6].note), "");
  assert.equal(crestState(rows[7].note), "");
  assert.equal(crestState("DESK2"), "");
  assert.equal(catalogCrest(rows[0].note), true);
  assert.equal(catalogCrest(rows[4].note), false);
  assert.equal(wideCrest(rows[2].note), true);
  assert.equal(wideCrest(rows[0].note), false);
  assert.equal(vowelCrest(rows[4].note), false);
  assert.equal(catalogCrestCount(rows), 4);
  assert.equal(wideCrestCount(rows), 2);
  assert.equal(vowelCrestCount(rows), 4);
  assert.equal(sharedCrestCount(rows), 1);
  assert.equal(visibleCrestCustomers(rows, "chip", null, "", "all", [], "all").length, 3);
  assert.equal(visibleCrestCustomers(rows, null, null, "gus", "all", [], "all").length, 1);
  const bands = crestsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = crestRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "rvmTitle"), ROUND191_COPY.en.rvmTitle);
  assert.equal(crmv4Text("tr", "nctTitle"), ROUND191_COPY.tr.nctTitle);
  assert.equal(crmv4Text("de", "rvmSearch"), ROUND191_COPY.de.rvmSearch);
  assert.equal(crmv4Text("ru", "nctHint"), ROUND191_COPY.ru.nctHint);
  assert.equal(crmv4Text("ar", "rvmNotice"), ROUND191_COPY.ar.rvmNotice);
  assert.notEqual(ROUND191_COPY.tr.rvmTitle, ROUND191_COPY.en.rvmTitle);
  assert.notEqual(ROUND191_COPY.de.nctTitle, ROUND191_COPY.en.nctTitle);
  assert.notEqual(ROUND191_COPY.ru.rvmSearch, ROUND191_COPY.en.rvmSearch);
  assert.notEqual(ROUND191_COPY.ar.nctSearch, ROUND191_COPY.en.nctSearch);
  const keys = Object.keys(ROUND191_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND191_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rvm/);
  assert.match(css, /\.c4-nct/);
  assert.match(css, /\.c4-report-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round191.tsx"), "utf8");
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
  assert.match(viewFile, /campaign/);
  assert.match(viewFile, /reviewsCsv/);
  assert.match(viewFile, /crestsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-reviews/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestCloth/);
  const reports = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round43.tsx"), "utf8");
  assert.match(reports, /c4-report-salon/);
  assert.match(reports, /data-logo="mono"/);
  assert.match(reports, /c4-report-salon-mast/);
  assert.match(reports, /c4-report-salon-card/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rvmin"/);
  assert.match(app, /view === "ncts"/);
  assert.match(app, /ReviewMinutes/);
  assert.match(app, /NoticeCrests/);
  console.log("crmv4 round191 tests passed");
}

main();
