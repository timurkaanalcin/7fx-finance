/**
 * Courtesy vows and leverage spans.
 * Run: TZ=UTC npx tsx tests/crmv4-round185.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND185_COPY } from "../src/lib/crmv4/copy-round185";
import {
  activeLane,
  activeRank,
  activeSpan,
  addVow,
  addVowView,
  bulkVowRibbon,
  catalogSpan,
  catalogSpanCount,
  cyclePace,
  editVow,
  editVowNote,
  evenSpan,
  evenSpanCount,
  fairCaller,
  homeSeal,
  laneGap,
  laneOf,
  lateVow,
  nextVow,
  peakLane,
  quietLane,
  rankOf,
  readVows,
  sharedSpanCount,
  soonVow,
  spanBand,
  spanMinutes,
  spanOf,
  spanParity,
  spanRowsCsv,
  spanState,
  spansCsv,
  steepSpan,
  steepSpanCount,
  suggestCaller,
  suggestRibbon,
  suggestSpan,
  usedLanes,
  visibleSpanCustomers,
  visibleVows,
  vowSeal,
  vowsCsv,
} from "../src/lib/crmv4/round185";

function main() {
  assert.equal(vowSeal("  ist "), "IST");
  assert.equal(vowSeal("dxb"), "DXB");
  assert.equal(vowSeal("lon"), "LON");
  assert.equal(vowSeal("   "), "");
  assert.equal(vowSeal("IS"), "");
  assert.equal(vowSeal("ISTAN"), "");
  assert.equal(laneOf("01"), 1);
  assert.equal(laneOf("06"), 6);
  assert.equal(laneOf("6"), 6);
  assert.equal(laneOf("00"), null);
  assert.equal(laneOf("07"), null);
  assert.equal(laneOf("7"), null);
  assert.equal(laneOf(""), null);
  assert.equal(laneOf("3.0"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(3), 3);
  assert.equal(rankOf(9), 9);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("2"), null);
  assert.equal(rankOf("01"), null);
  assert.equal(spanMinutes("5"), 5);
  assert.equal(spanMinutes(15), 15);
  assert.equal(spanMinutes(45), 45);
  assert.equal(spanMinutes("0"), null);
  assert.equal(spanMinutes("10"), null);
  assert.equal(spanMinutes("05"), null);
  assert.equal(peakLane(2), true);
  assert.equal(peakLane(5), true);
  assert.equal(peakLane(1), false);
  assert.equal(quietLane(1), true);
  assert.equal(quietLane(3), true);
  assert.equal(quietLane(6), true);
  assert.equal(quietLane(2), false);
  assert.equal(quietLane(5), false);
  assert.equal(laneGap(5, 1), 2);
  assert.equal(laneGap(1, 5), -2);
  assert.equal(laneGap(2, 2), 0);
  assert.equal(laneGap(1, 4), 3);
  assert.equal(laneGap(4, 1), -3);
  assert.equal(laneGap(6, 1), 1);
  assert.equal(laneGap(null, 2), null);
  assert.equal(laneGap(2, ""), null);
  assert.equal(laneGap(2, 7), null);

  const saved = addVow([], { id: "a", title: "Vow Ada", note: "ivory call", caller: "Nia", lane: "06", ribbon: "ivory", seal: "ist", pace: "calm", rank: "9", span: "5" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].lane, 6);
  assert.equal(saved[0].rank, 9);
  assert.equal(saved[0].span, 5);
  assert.equal(saved[0].seal, "IST");
  assert.equal(saved[0].note, "ivory call");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeSeal(saved[0].seal), true);
  assert.equal(homeSeal("BER"), false);
  assert.equal(homeSeal("NYC"), false);
  assert.equal(soonVow(saved[0]), true);
  assert.equal(addVow(saved, { id: "b", title: "Vow Ada" }).length, 1);
  assert.equal(addVow(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addVow(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addVow(cards, card), [] as ReturnType<typeof addVow>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cyclePace(saved, "a");
  assert.equal(cycled[0].pace, "steady");
  assert.equal(cycled[0].audit, "pace");
  assert.equal(cyclePace(cycled, "a")[0].pace, "brisk");
  assert.equal(cyclePace(cyclePace(cycled, "a"), "a")[0].pace, "calm");
  const blankPace = addVow([], { id: "z", title: "Blank pace" });
  assert.equal(cyclePace(blankPace, "z")[0].pace, "calm");

  const edited = editVow(saved, "a", "Vow Bea");
  assert.equal(edited[0].title, "Vow Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editVow(edited, "a", "  ")[0].title, "Vow Bea");
  const noted = editVowNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editVowNote(noted, "a", "  ")[0].note, "second look");
  const pair = addVow(noted, { id: "b", title: "Vow" });
  assert.equal(editVow(pair, "a", "Vow").find((card) => card.id === "a")?.title, "Vow Bea");

  const early = addVow([], { id: "a", title: "Early", lane: "1", ribbon: "ivory", span: "45", caller: "Nia", rank: "9" });
  const mid = addVow(early, { id: "m", title: "Mid", lane: "3", ribbon: "graphite", span: "15", caller: "Ada", rank: "1", pace: "calm" });
  const open = addVow(mid, { id: "b", title: "Later", lane: "5", pace: "brisk" });
  assert.equal(lateVow(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateVow(open.find((card) => card.title === "Early") as (typeof open)[number], 3), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateVow({ ...earlyCard, closed: true }, 4), false);
  assert.equal(nextVow(open, 2), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextVow(open, 4), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestRibbon([]), "ink");
  assert.equal(suggestRibbon(open), "ink");
  assert.equal(suggestCaller(open), "Ada");
  assert.equal(suggestSpan([]), 15);
  assert.equal(suggestSpan(open), 5);
  assert.equal(fairCaller(open, "Nia, Bea"), "Bea");
  assert.equal(fairCaller(open, ""), "Ada");
  assert.equal(usedLanes(open), 3);
  assert.equal(bulkVowRibbon(open, ["b"], "champagne").find((card) => card.id === "b")?.ribbon, "champagne");
  assert.equal(bulkVowRibbon(open, ["b"], "champagne").find((card) => card.id === "b")?.audit, "ribbon");
  const shown = visibleVows(open, "open", "ada", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const sheet = vowsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,caller,lane,ribbon,seal,pace,rank,span,band,pinned,parked,closed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Vow Ada"), true);
  assert.equal(activeRank("01"), "all");
  assert.equal(activeRank("1"), "1");
  assert.equal(activeSpan("05"), "all");
  assert.equal(activeSpan("5"), "5");
  assert.equal(activeSpan("45"), "45");
  assert.equal(activeLane("01"), "1");
  assert.equal(activeLane("07"), "all");
  const views = Array.from({ length: 6 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    caller: "all",
    ribbon: "all",
    seal: "all",
    pace: "all",
    lane: "all",
    rank: "all",
    span: "all",
  })).reduce((list, view) => addVowView(list, view), [] as ReturnType<typeof addVowView>);
  assert.equal(views.length, 4);
  assert.equal(readVows(saved)[0].title, "Vow Ada");

  const book = 100;
  const soft = 10;
  const firm = 200;
  const steep = 500;
  const rows = [
    { id: "ada", label: "Ada", note: book },
    { id: "bea", label: "Bea", note: { leverage: book } },
    { id: "cy", label: "Cy", note: { leverage: null } },
    { id: "dee", label: "Dee", note: { leverage: soft, balance: 1 } },
    { id: "eve", label: "Eve", note: soft },
    { id: "fay", label: "Fay", note: firm },
    { id: "gus", label: "Gus", note: steep },
    { id: "nope", label: "Nope", note: "nope" },
    { id: "blank", label: "Blank", note: "" },
  ];
  assert.equal(spanState(book), "set");
  assert.equal(spanState({ leverage: null }), "clear");
  assert.equal(spanState({ leverage: book, balance: 1 }), "");
  assert.equal(spanState("nope"), "");
  assert.equal(spanState(""), "clear");
  assert.equal(spanState(0), "");
  assert.equal(spanState(501), "");
  assert.equal(spanState("050"), "");
  assert.equal(spanOf("100"), 100);
  assert.equal(spanBand(soft), "soft");
  assert.equal(spanBand(50), "book");
  assert.equal(spanBand(book), "book");
  assert.equal(spanBand(firm), "firm");
  assert.equal(spanBand(steep), "steep");
  assert.equal(spanParity(book), "even");
  assert.equal(spanParity(1), "odd");
  assert.equal(catalogSpan(book), true);
  assert.equal(catalogSpan(40), false);
  assert.equal(steepSpan(steep), true);
  assert.equal(evenSpan(book), true);
  assert.equal(catalogSpanCount(rows), 4);
  assert.equal(steepSpanCount(rows), 1);
  assert.equal(evenSpanCount(rows), 5);
  assert.equal(sharedSpanCount(rows), 1);
  assert.equal(visibleSpanCustomers(rows, "book", null, "", "all", [], "all").length, 2);
  assert.equal(visibleSpanCustomers(rows, null, null, "gus", "all", [], "all").length, 1);
  const bands = spansCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = spanRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "vowTitle"), ROUND185_COPY.en.vowTitle);
  assert.equal(crmv4Text("tr", "spnTitle"), ROUND185_COPY.tr.spnTitle);
  assert.equal(crmv4Text("de", "vowSearch"), ROUND185_COPY.de.vowSearch);
  assert.equal(crmv4Text("ru", "spnHint"), ROUND185_COPY.ru.spnHint);
  assert.equal(crmv4Text("ar", "vowNotice"), ROUND185_COPY.ar.vowNotice);
  assert.notEqual(ROUND185_COPY.tr.vowTitle, ROUND185_COPY.en.vowTitle);
  assert.notEqual(ROUND185_COPY.de.spnTitle, ROUND185_COPY.en.spnTitle);
  assert.notEqual(ROUND185_COPY.ru.vowSearch, ROUND185_COPY.en.vowSearch);
  assert.notEqual(ROUND185_COPY.ar.spnSearch, ROUND185_COPY.en.spnSearch);
  const keys = Object.keys(ROUND185_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND185_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vow/);
  assert.match(css, /\.c4-spn/);
  assert.match(css, /\.c4-logs-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round185.tsx"), "utf8");
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
  assert.match(viewFile, /leverage/);
  assert.match(viewFile, /vowsCsv/);
  assert.match(viewFile, /spansCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-vows/);
  assert.match(viewFile, /data-spans/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestRibbon/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-salon/);
  assert.match(logs, /data-logo="mono"/);
  assert.match(logs, /c4-logs-mast/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vows"/);
  assert.match(app, /view === "span"/);
  assert.match(app, /CourtesyVows/);
  assert.match(app, /LeverageSpans/);
  console.log("crmv4 round185 tests passed");
}

main();
