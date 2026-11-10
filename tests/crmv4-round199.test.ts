/**
 * Folio warrants and mail monograms.
 * Run: TZ=UTC npx tsx tests/crmv4-round199.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND199_COPY } from "../src/lib/crmv4/copy-round199";
import {
  activeDay,
  activeSpan,
  activeTone,
  addWarrant,
  addWarrantMark,
  addWarrantView,
  busiestClerk,
  catalogMono,
  catalogMonoCount,
  clashDayCount,
  cycleRank,
  dayGap,
  dayOf,
  densityOf,
  editWarrant,
  editWarrantNote,
  fairClerk,
  giltMonoCount,
  houseShelf,
  lateWarrant,
  monoBand,
  monoCopy,
  monoRowsCsv,
  monoState,
  monoTone,
  monogramOf,
  monogramsCsv,
  moveFocus,
  nextWarrant,
  pairMonoCount,
  pressDay,
  quietDay,
  setWarrantWait,
  sharedMonoCount,
  shelfOf,
  soonWarrant,
  spanOf,
  suggestClerk,
  suggestShelf,
  suggestSpan,
  toneClashCount,
  toneOf,
  usedDays,
  visibleMonoCustomers,
  visibleWarrants,
  waitOf,
  warrantsCsv,
} from "../src/lib/crmv4/round199";

function main() {
  assert.equal(shelfOf("  vellum "), "VELLUM");
  assert.equal(shelfOf("linen"), "LINEN");
  assert.equal(shelfOf("slate"), "SLATE");
  assert.equal(shelfOf("   "), "");
  assert.equal(shelfOf("oak"), "");
  assert.equal(dayOf("1"), 1);
  assert.equal(dayOf(7), 7);
  assert.equal(dayOf("3"), 3);
  assert.equal(dayOf("0"), null);
  assert.equal(dayOf("01"), null);
  assert.equal(dayOf("8"), null);
  assert.equal(dayOf(""), null);
  assert.equal(toneOf("2"), 2);
  assert.equal(toneOf(4), 4);
  assert.equal(toneOf("8"), 8);
  assert.equal(toneOf("6"), null);
  assert.equal(toneOf("02"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("45"), 45);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(spanOf("60"), null);
  assert.equal(waitOf("0"), 0);
  assert.equal(waitOf(15), 15);
  assert.equal(waitOf("30"), 30);
  assert.equal(waitOf("10"), null);
  assert.equal(pressDay(2), true);
  assert.equal(pressDay(4), true);
  assert.equal(pressDay(6), true);
  assert.equal(pressDay(1), false);
  assert.equal(quietDay(1), true);
  assert.equal(quietDay(7), true);
  assert.equal(quietDay(2), false);
  assert.equal(quietDay(4), false);
  assert.equal(dayGap(1, 7), -1);
  assert.equal(dayGap(7, 1), 1);
  assert.equal(dayGap(1, 4), 3);
  assert.equal(dayGap(4, 1), -3);
  assert.equal(dayGap(1, 3), 2);
  assert.equal(dayGap(5, 1), 3);
  assert.equal(dayGap(null, 2), null);
  assert.equal(dayGap(2, ""), null);
  assert.equal(dayGap(2, 0), null);
  assert.equal(activeDay("press"), "press");
  assert.equal(activeDay("99"), "all");
  assert.equal(activeTone("4"), "4");
  assert.equal(activeTone("6"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("60"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addWarrant([], { id: "a", title: "Ada folio", note: "oak leaf", clerk: "Nia", day: "1", shelf: "vellum", rank: "open", tone: "8", span: "15", marks: "a, b, c, d", wait: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].day, 1);
  assert.equal(saved[0].tone, 8);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].shelf, "VELLUM");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].marks, ["a", "b", "c"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseShelf(saved[0].shelf), true);
  assert.equal(houseShelf("LINEN"), false);
  assert.equal(soonWarrant(saved[0]), true);
  assert.equal(lateWarrant(saved[0], "4"), true);
  assert.equal(lateWarrant(saved[0], "3"), false);
  assert.equal(addWarrant(saved, { id: "b", title: "Ada folio" }).length, 1);
  assert.equal(addWarrant(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addWarrant(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 9 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((warrants, warrant) => addWarrant(warrants, warrant), [] as ReturnType<typeof addWarrant>);
  assert.equal(capped.length, 7);
  assert.equal(capped.some((warrant) => warrant.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 8");

  const cycled = cycleRank(saved, "a");
  assert.equal(cycled[0].rank, "marked");
  assert.equal(cycled[0].audit, "rank");
  assert.equal(cycleRank(cycled, "a")[0].rank, "filed");
  assert.equal(cycleRank(cycleRank(cycled, "a"), "a")[0].rank, "open");
  const blankRank = addWarrant([], { id: "z", title: "Blank rank" });
  assert.equal(cycleRank(blankRank, "z")[0].rank, "open");

  const edited = editWarrant(saved, "a", "Bea folio");
  assert.equal(edited[0].title, "Bea folio");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editWarrant(saved, "a", "   ")[0].title, "Ada folio");
  const noted = editWarrantNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editWarrantNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneMark = addWarrant([], { id: "t", title: "Mark folio", marks: "a" });
  const marked = addWarrantMark(oneMark, "t", "b");
  assert.deepEqual(marked[0].marks, ["a", "b"]);
  assert.equal(marked[0].audit, "mark");
  assert.equal(addWarrantMark(addWarrantMark(marked, "t", "c"), "t", "d")[0].marks.length, 3);
  assert.equal(addWarrantMark(oneMark, "t", "gold")[0].marks.length, 1);

  const waiting = setWarrantWait(saved, "a", 15);
  assert.equal(waiting[0].wait, 15);
  assert.equal(waiting[0].audit, "wait");
  assert.equal(soonWarrant(waiting[0]), false);
  assert.equal(lateWarrant(waiting[0], "4"), false);
  assert.equal(setWarrantWait(saved, "a", 10)[0].wait, 0);

  const second = addWarrant(saved, { id: "b", title: "Bea folio", clerk: "Ada", day: "5", shelf: "linen", rank: "marked", tone: "8", span: "30", marks: "a" });
  assert.equal(usedDays(second), 2);
  assert.equal(suggestShelf([]), "LINEN");
  assert.equal(suggestSpan([]), 30);
  assert.equal(suggestClerk([]), "");
  assert.equal(fairClerk(second, "Bea, Ada"), "Bea");
  assert.equal(busiestClerk(second), "Ada");
  assert.equal(nextWarrant(second, ""), "");
  assert.equal(nextWarrant(second, "4"), "b");
  const filed = cycleRank(second, "b");
  assert.equal(filed.find((warrant) => warrant.id === "b")?.rank, "filed");
  assert.equal(nextWarrant(filed, "4"), "a");
  const resting = setWarrantWait(second, "b", 30);
  assert.equal(nextWarrant(resting, "4"), "a");
  const shown = visibleWarrants(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const markedSearch = visibleWarrants(second, "open", "a", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(markedSearch.length, 2);
  const house = visibleWarrants(second, "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 1);
  assert.equal(house[0].id, "a");
  const quiet = visibleWarrants(addWarrant(second, { id: "d", title: "Quiet folio", day: "7", shelf: "slate", span: "45" }), "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(quiet.length, 2);
  assert.equal(quiet.some((warrant) => warrant.id === "d"), true);
  assert.equal(quiet.some((warrant) => warrant.id === "a"), true);
  assert.equal(quiet.some((warrant) => warrant.id === "b"), false);
  assert.equal(clashDayCount(second), 0);
  const clashed = addWarrant(second, { id: "c", title: "Same day", day: "1", shelf: "vellum", tone: "8" });
  assert.equal(clashDayCount(clashed), 2);
  assert.equal(toneClashCount(clashed) >= 2, true);
  const views = addWarrantView([], { id: "v1", name: "Press desk", tray: "open", query: "oak", clerk: "all", shelf: "vellum", rank: "open", day: "press", tone: "8", span: "15" });
  assert.equal(views.length, 1);
  assert.equal(views[0].shelf, "VELLUM");
  assert.equal(addWarrantView(views, { id: "v1", name: "Other", tray: "open", query: "", clerk: "all", shelf: "all", rank: "all", day: "all", tone: "all", span: "all" }).length, 1);
  const csv = warrantsCsv(saved, "4");
  assert.equal(csv.includes("Ada folio"), true);
  assert.equal(csv.includes("VELLUM"), true);
  assert.equal(csv.split("\n")[0].includes("late"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { email: "a.e@house.test" } },
    { id: "2", label: "Bea", note: { email: "i.o@house.test" } },
    { id: "3", label: "Cara", note: { email: "u.x@house.test" } },
    { id: "4", label: "Noa", note: { email: "bea@house.test" } },
    { id: "5", label: "Paris", note: { email: "ada.holm@house.test" } },
    { id: "6", label: "Empty", note: { email: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { email: "a.e@house.test", balance: 1 } },
    { id: "9", label: "Digits", note: { email: "123@house.test" } },
  ];
  assert.equal(monoCopy(rows[0].note), "a.e@house.test");
  assert.equal(monogramOf(rows[0].note), "AE");
  assert.equal(monoState(rows[0].note), "set");
  assert.equal(monoBand(rows[0].note), "pair");
  assert.equal(monoBand(rows[3].note), "seed");
  assert.equal(monoBand(rows[4].note), "pair");
  assert.equal(monoTone(rows[0].note), "gilt");
  assert.equal(monoTone(rows[3].note), "ink");
  assert.equal(monoState(rows[5].note), "clear");
  assert.equal(monoState(rows[6].note), "");
  assert.equal(monoState(rows[7].note), "");
  assert.equal(monoState(rows[8].note), "set");
  assert.equal(monogramOf(rows[8].note), "");
  assert.equal(catalogMono(rows[0].note), true);
  assert.equal(catalogMono(rows[2].note), true);
  assert.equal(catalogMono(rows[3].note), false);
  assert.equal(catalogMonoCount(rows), 3);
  assert.equal(pairMonoCount(rows), 4);
  assert.equal(giltMonoCount(rows), 4);
  assert.equal(sharedMonoCount(rows), 0);
  assert.equal(visibleMonoCustomers(rows, "seed", null, "", "all", [], "all").length, 1);
  assert.equal(visibleMonoCustomers(rows, null, null, "par", "all", [], "all").length, 1);
  const bands = monogramsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = monoRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "flwTitle"), ROUND199_COPY.en.flwTitle);
  assert.equal(crmv4Text("tr", "mngTitle"), ROUND199_COPY.tr.mngTitle);
  assert.equal(crmv4Text("de", "flwSearch"), ROUND199_COPY.de.flwSearch);
  assert.equal(crmv4Text("ru", "mngHint"), ROUND199_COPY.ru.mngHint);
  assert.equal(crmv4Text("ar", "flwNotice"), ROUND199_COPY.ar.flwNotice);
  assert.notEqual(ROUND199_COPY.tr.flwTitle, ROUND199_COPY.en.flwTitle);
  assert.notEqual(ROUND199_COPY.de.mngTitle, ROUND199_COPY.en.mngTitle);
  assert.notEqual(ROUND199_COPY.ru.flwSearch, ROUND199_COPY.en.flwSearch);
  assert.notEqual(ROUND199_COPY.ar.mngSearch, ROUND199_COPY.en.mngSearch);
  const keys = Object.keys(ROUND199_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND199_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND199_COPY[locale][key as keyof typeof ROUND199_COPY.en], "string");
      assert.ok(ROUND199_COPY[locale][key as keyof typeof ROUND199_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-flw/);
  assert.match(css, /\.c4-mng/);
  assert.match(css, /\.c4-gallery-folio/);
  assert.match(css, /\.c4-history-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round199.tsx"), "utf8");
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
  assert.match(viewFile, /email/);
  assert.match(viewFile, /warrantsCsv/);
  assert.match(viewFile, /monogramsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-folio/);
  assert.match(viewFile, /data-monograms/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestShelf/);
  const gallery = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round50.tsx"), "utf8");
  assert.match(gallery, /c4-gallery-folio/);
  assert.match(gallery, /c4-history-folio/);
  assert.match(gallery, /c4-folio-mast/);
  assert.match(gallery, /data-logo="mono"/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "flwt"/);
  assert.match(app, /view === "mngm"/);
  assert.match(app, /FolioWarrants/);
  assert.match(app, /MailMonograms/);
  console.log("crmv4 round199 tests passed");
}

main();
