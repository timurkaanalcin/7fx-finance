/**
 * Salon recitals and username seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round201.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND201_COPY } from "../src/lib/crmv4/copy-round201";
import {
  activeBell,
  activeCandle,
  activeSpan,
  addRecital,
  addRecitalTag,
  addRecitalView,
  barSealCount,
  bellGap,
  bellOf,
  busiestUsher,
  candleClashCount,
  candleOf,
  catalogSeal,
  catalogSealCount,
  clashBellCount,
  cycleCue,
  densityOf,
  editRecital,
  editRecitalNote,
  fairUsher,
  hallOf,
  houseHall,
  lateRecital,
  moveFocus,
  nextRecital,
  peakBell,
  pinFocused,
  plainSealCount,
  quietBell,
  recitalsCsv,
  restOf,
  sealBand,
  sealCopy,
  sealOf,
  sealRowsCsv,
  sealState,
  sealTone,
  sealsCsv,
  setRecitalRest,
  sharedSealCount,
  soonRecital,
  spanOf,
  suggestHall,
  suggestSpan,
  suggestUsher,
  usedBells,
  visibleRecitals,
  visibleSealCustomers,
} from "../src/lib/crmv4/round201";

function main() {
  assert.equal(hallOf("  gold "), "GOLD");
  assert.equal(hallOf("ivory"), "IVORY");
  assert.equal(hallOf("ink"), "INK");
  assert.equal(hallOf("   "), "");
  assert.equal(hallOf("oak"), "");
  assert.equal(bellOf("1"), 1);
  assert.equal(bellOf(12), 12);
  assert.equal(bellOf("8"), 8);
  assert.equal(bellOf("0"), null);
  assert.equal(bellOf("01"), null);
  assert.equal(bellOf("13"), null);
  assert.equal(bellOf(""), null);
  assert.equal(candleOf("2"), 2);
  assert.equal(candleOf(4), 4);
  assert.equal(candleOf("6"), 6);
  assert.equal(candleOf("1"), null);
  assert.equal(candleOf("02"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(30), 30);
  assert.equal(spanOf("45"), 45);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("015"), null);
  assert.equal(spanOf("20"), null);
  assert.equal(restOf("0"), 0);
  assert.equal(restOf(15), 15);
  assert.equal(restOf("45"), 45);
  assert.equal(restOf("10"), null);
  assert.equal(peakBell(7), true);
  assert.equal(peakBell(8), true);
  assert.equal(peakBell(9), true);
  assert.equal(peakBell(1), false);
  assert.equal(quietBell(1), true);
  assert.equal(quietBell(12), true);
  assert.equal(quietBell(7), false);
  assert.equal(quietBell(8), false);
  assert.equal(bellGap(1, 8), 7);
  assert.equal(bellGap(8, 1), -7);
  assert.equal(bellGap(7, 9), 2);
  assert.equal(bellGap(9, 7), -2);
  assert.equal(bellGap(null, 8), null);
  assert.equal(bellGap(1, ""), null);
  assert.equal(bellGap(1, 0), null);
  assert.equal(activeBell("peak"), "peak");
  assert.equal(activeBell("99"), "all");
  assert.equal(activeCandle("6"), "6");
  assert.equal(activeCandle("1"), "all");
  assert.equal(activeSpan("blank"), "blank");
  assert.equal(activeSpan("20"), "all");
  assert.equal(densityOf("tight"), "tight");
  assert.equal(densityOf("nope"), "roomy");
  assert.equal(moveFocus(0, 3, 1), 1);
  assert.equal(moveFocus(0, 3, -1), 2);
  assert.equal(moveFocus(2, 3, 1), 0);
  assert.equal(moveFocus(1, 0, 1), 0);

  const saved = addRecital([], { id: "a", title: "Ada recital", note: "oak leaf", usher: "Nia", bell: "1", hall: "gold", cue: "posted", candle: "6", span: "15", tags: "a, b, c, d", rest: "0" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bell, 1);
  assert.equal(saved[0].candle, 6);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].hall, "GOLD");
  assert.equal(saved[0].note, "oak leaf");
  assert.deepEqual(saved[0].tags, ["a", "b", "c"]);
  assert.equal(saved[0].audit, "save");
  assert.equal(houseHall(saved[0].hall), true);
  assert.equal(houseHall("INK"), false);
  assert.equal(soonRecital(saved[0]), true);
  assert.equal(lateRecital(saved[0], "8"), true);
  assert.equal(lateRecital(saved[0], "3"), false);
  assert.equal(addRecital(saved, { id: "b", title: "Ada recital" }).length, 1);
  assert.equal(addRecital(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addRecital(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((recitals, recital) => addRecital(recitals, recital), [] as ReturnType<typeof addRecital>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((recital) => recital.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleCue(saved, "a");
  assert.equal(cycled[0].cue, "called");
  assert.equal(cycled[0].audit, "cue");
  assert.equal(cycleCue(cycled, "a")[0].cue, "bowed");
  assert.equal(cycleCue(cycleCue(cycled, "a"), "a")[0].cue, "posted");
  const blankCue = addRecital([], { id: "z", title: "Blank cue" });
  assert.equal(cycleCue(blankCue, "z")[0].cue, "posted");

  const edited = editRecital(saved, "a", "Bea recital");
  assert.equal(edited[0].title, "Bea recital");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editRecital(saved, "a", "   ")[0].title, "Ada recital");
  const noted = editRecitalNote(saved, "a", "fresh leaf");
  assert.equal(noted[0].note, "fresh leaf");
  assert.equal(editRecitalNote(saved, "a", "   ")[0].note, "oak leaf");
  const oneTag = addRecital([], { id: "t", title: "Tag recital", tags: "a" });
  const tagged = addRecitalTag(oneTag, "t", "b");
  assert.deepEqual(tagged[0].tags, ["a", "b"]);
  assert.equal(tagged[0].audit, "tag");
  assert.equal(addRecitalTag(addRecitalTag(tagged, "t", "c"), "t", "d")[0].tags.length, 3);
  assert.equal(addRecitalTag(oneTag, "t", "gold")[0].tags.length, 1);

  const rested = setRecitalRest(saved, "a", 15);
  assert.equal(rested[0].rest, 15);
  assert.equal(rested[0].audit, "rest");
  assert.equal(soonRecital(rested[0]), false);
  assert.equal(lateRecital(rested[0], "8"), false);
  assert.equal(setRecitalRest(saved, "a", 10)[0].rest, 0);
  const pinned = pinFocused(saved, ["a"], 0);
  assert.equal(pinned[0].pinned, true);
  assert.equal(pinned[0].audit, "pin");
  assert.equal(pinFocused(pinned, ["a"], 0)[0].pinned, false);

  const second = addRecital(saved, { id: "b", title: "Bea recital", usher: "Ada", bell: "10", hall: "ivory", cue: "called", candle: "6", span: "30", tags: "a" });
  assert.equal(usedBells(second), 2);
  assert.equal(suggestHall([]), "INK");
  assert.equal(suggestSpan([]), 30);
  assert.equal(suggestUsher([]), "");
  assert.equal(fairUsher(second, "Bea, Ada"), "Bea");
  assert.equal(busiestUsher(second), "Ada");
  assert.equal(nextRecital(second, ""), "");
  assert.equal(nextRecital(second, "8"), "b");
  const bowed = cycleCue(second, "b");
  assert.equal(bowed.find((recital) => recital.id === "b")?.cue, "bowed");
  assert.equal(nextRecital(bowed, "8"), "a");
  const resting = setRecitalRest(second, "b", 45);
  assert.equal(nextRecital(resting, "8"), "a");
  const shown = visibleRecitals(second, "open", "bea", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].id, "b");
  const taggedSearch = visibleRecitals(second, "open", "a", null, null, null, null, null, null, null, false, false, false, false, false);
  assert.equal(taggedSearch.length, 2);
  const house = visibleRecitals(addRecital(second, { id: "g", title: "Guest recital", bell: "6", hall: "ink", span: "30" }), "open", "", null, null, null, null, null, null, null, false, false, true, false, false);
  assert.equal(house.length, 2);
  assert.equal(house.some((recital) => recital.id === "g"), false);
  const quiet = visibleRecitals(addRecital(second, { id: "d", title: "Quiet recital", bell: "12", hall: "ink", span: "45" }), "open", "", null, null, null, null, null, null, null, false, false, false, true, false);
  assert.equal(quiet.length, 2);
  assert.equal(quiet.some((recital) => recital.id === "d"), true);
  assert.equal(quiet.some((recital) => recital.id === "a"), true);
  assert.equal(quiet.some((recital) => recital.id === "b"), false);
  assert.equal(clashBellCount(second), 0);
  const clashed = addRecital(second, { id: "c", title: "Same bell", bell: "1", hall: "gold", candle: "6" });
  assert.equal(clashBellCount(clashed), 2);
  assert.equal(candleClashCount(clashed) >= 2, true);
  const views = addRecitalView([], { id: "v1", name: "Peak desk", tray: "open", query: "oak", usher: "all", hall: "gold", cue: "posted", bell: "peak", candle: "6", span: "15" });
  assert.equal(views.length, 1);
  assert.equal(views[0].hall, "GOLD");
  assert.equal(addRecitalView(views, { id: "v1", name: "Other", tray: "open", query: "", usher: "all", hall: "all", cue: "all", bell: "all", candle: "all", span: "all" }).length, 1);
  const csv = recitalsCsv(saved, "8");
  assert.equal(csv.includes("Ada recital"), true);
  assert.equal(csv.includes("GOLD"), true);
  assert.equal(csv.split("\n")[0].includes("late"), true);
  assert.equal(csv.includes("amount"), false);

  const rows = [
    { id: "1", label: "Ada", note: { username: "Ada" } },
    { id: "2", label: "Noa", note: { username: "Noa" } },
    { id: "3", label: "Le", note: { username: "Le" } },
    { id: "4", label: "Holm", note: { username: "Holm" } },
    { id: "5", label: "Leo", note: { username: "Leo" } },
    { id: "6", label: "Empty", note: { username: "" } },
    { id: "7", label: "Missing", note: {} },
    { id: "8", label: "Blocked", note: { username: "Ada", balance: 1 } },
    { id: "9", label: "Digits", note: { username: "Ada1" } },
    { id: "10", label: "Dot", note: { username: "A" } },
  ];
  assert.equal(sealCopy(rows[0].note), "Ada");
  assert.equal(sealOf(rows[0].note), "AA");
  assert.equal(sealState(rows[0].note), "set");
  assert.equal(sealBand(rows[0].note), "bar");
  assert.equal(sealBand(rows[9].note), "dot");
  assert.equal(sealOf(rows[1].note), "NA");
  assert.equal(sealOf(rows[2].note), "LE");
  assert.equal(sealOf(rows[3].note), "HM");
  assert.equal(sealTone(rows[0].note), "plain");
  assert.equal(sealTone(rows[8].note), "cipher");
  assert.equal(sealState(rows[5].note), "clear");
  assert.equal(sealState(rows[6].note), "");
  assert.equal(sealState(rows[7].note), "");
  assert.equal(catalogSeal(rows[0].note), true);
  assert.equal(catalogSeal(rows[1].note), true);
  assert.equal(catalogSeal(rows[2].note), true);
  assert.equal(catalogSeal(rows[4].note), false);
  assert.equal(catalogSealCount(rows), 4);
  assert.equal(barSealCount(rows) >= 4, true);
  assert.equal(plainSealCount(rows) >= 4, true);
  assert.equal(sharedSealCount(rows), 2);
  assert.equal(visibleSealCustomers(rows, "dot", null, "", "all", [], "all").length, 1);
  assert.equal(visibleSealCustomers(rows, null, null, "leo", "all", [], "all").length, 1);
  const bands = sealsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = sealRowsCsv(rows, ["1"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "rctTitle"), ROUND201_COPY.en.rctTitle);
  assert.equal(crmv4Text("tr", "unsTitle"), ROUND201_COPY.tr.unsTitle);
  assert.equal(crmv4Text("de", "rctSearch"), ROUND201_COPY.de.rctSearch);
  assert.equal(crmv4Text("ru", "unsHint"), ROUND201_COPY.ru.unsHint);
  assert.equal(crmv4Text("ar", "rctNotice"), ROUND201_COPY.ar.rctNotice);
  assert.notEqual(ROUND201_COPY.tr.rctTitle, ROUND201_COPY.en.rctTitle);
  assert.notEqual(ROUND201_COPY.de.unsTitle, ROUND201_COPY.en.unsTitle);
  assert.notEqual(ROUND201_COPY.ru.rctSearch, ROUND201_COPY.en.rctSearch);
  assert.notEqual(ROUND201_COPY.ar.unsSearch, ROUND201_COPY.en.unsSearch);
  const keys = Object.keys(ROUND201_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND201_COPY[locale]), keys);
    for (const key of keys) {
      assert.equal(typeof ROUND201_COPY[locale][key as keyof typeof ROUND201_COPY.en], "string");
      assert.ok(ROUND201_COPY[locale][key as keyof typeof ROUND201_COPY.en]);
    }
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-rct/);
  assert.match(css, /\.c4-uns/);
  assert.match(css, /\.c4-rct-ledger/);
  assert.match(css, /\.c4-uns-index/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round201.tsx"), "utf8");
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
  assert.match(viewFile, /username/);
  assert.match(viewFile, /recitalsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-recitals/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestHall/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rctl"/);
  assert.match(app, /view === "unsl"/);
  assert.match(app, /SalonRecitals/);
  assert.match(app, /UsernameSeals/);
  console.log("crmv4 round201 tests passed");
}

main();
