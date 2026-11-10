/**
 * Morning orders and affiliate stems.
 * Run: TZ=UTC npx tsx tests/crmv4-round183.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND183_COPY } from "../src/lib/crmv4/copy-round183";
import {
  activeRank,
  activeSpan,
  addOrder,
  addOrderView,
  atStem,
  atStemCount,
  bulkOrderInk,
  bulkStemReview,
  cyclePace,
  editOrder,
  editOrderNote,
  evenStem,
  evenStemCount,
  fairHost,
  hashStem,
  hashStemCount,
  homeDesk,
  laneGap,
  laneOf,
  lateOrder,
  leadingStem,
  leadingStemDepth,
  nextOrder,
  orderMark,
  ordersCsv,
  peakLane,
  quietLane,
  rankOf,
  readOrders,
  sharedStemCount,
  soonOrder,
  spanOf,
  stemBand,
  stemDepth,
  stemRowsCsv,
  stemState,
  stemWords,
  stemsCsv,
  suggestHost,
  suggestInk,
  suggestSpan,
  toggleStemReview,
  usedLanes,
  visibleOrders,
  visibleStemCustomers,
} from "../src/lib/crmv4/round183";

function main() {
  assert.equal(orderMark("  tr "), "TR");
  assert.equal(orderMark("de"), "DE");
  assert.equal(orderMark("ru"), "RU");
  assert.equal(orderMark("   "), "");
  assert.equal(orderMark("T"), "");
  assert.equal(orderMark("TUR"), "");
  assert.equal(orderMark("T1"), "");
  assert.equal(orderMark("z".repeat(20)), "");

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
  assert.equal(rankOf(5), 5);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("2"), null);
  assert.equal(rankOf("01"), null);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf(45), 45);
  assert.equal(spanOf(90), 90);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("30"), null);
  assert.equal(spanOf("015"), null);
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
  assert.equal(laneGap(null, 2), null);
  assert.equal(laneGap(2, ""), null);
  assert.equal(laneGap(2, 7), null);

  const saved = addOrder([], { id: "a", title: "Order Ada", note: "ivory scan", host: "Nia", lane: "06", ink: "ivory", mark: "tr", pace: "calm", rank: "5", span: "15" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].lane, 6);
  assert.equal(saved[0].rank, 5);
  assert.equal(saved[0].span, 15);
  assert.equal(saved[0].mark, "TR");
  assert.equal(saved[0].note, "ivory scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeDesk(saved[0].mark), true);
  assert.equal(homeDesk("GB"), false);
  assert.equal(homeDesk("US"), false);
  assert.equal(soonOrder(saved[0]), true);
  assert.equal(addOrder(saved, { id: "b", title: "Order Ada" }).length, 1);
  assert.equal(addOrder(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addOrder(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addOrder(cards, card), [] as ReturnType<typeof addOrder>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cyclePace(saved, "a");
  assert.equal(cycled[0].pace, "brisk");
  assert.equal(cycled[0].audit, "pace");
  assert.equal(cyclePace(cycled, "a")[0].pace, "urgent");
  assert.equal(cyclePace(cyclePace(cycled, "a"), "a")[0].pace, "calm");
  const blankPace = addOrder([], { id: "z", title: "Blank pace" });
  assert.equal(cyclePace(blankPace, "z")[0].pace, "calm");

  const edited = editOrder(saved, "a", "Order Bea");
  assert.equal(edited[0].title, "Order Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editOrder(edited, "a", "  ")[0].title, "Order Bea");
  const noted = editOrderNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editOrderNote(noted, "a", "  ")[0].note, "second look");
  const pair = addOrder(noted, { id: "b", title: "Keep" });
  assert.equal(editOrder(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Order Bea");

  const early = addOrder([], { id: "a", title: "Early", lane: "1", ink: "ivory", span: "90", host: "Nia", rank: "5" });
  const mid = addOrder(early, { id: "m", title: "Mid", lane: "4", ink: "graphite", span: "45", host: "Ada", rank: "1", pace: "calm" });
  const open = addOrder(mid, { id: "b", title: "Later", lane: "6", pace: "urgent" });
  assert.equal(lateOrder(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateOrder(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateOrder({ ...earlyCard, closed: true }, 4), false);
  assert.equal(nextOrder(open, 2), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextOrder(open, 5), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestInk([]), "ivory");
  assert.equal(suggestInk(open), "champagne");
  assert.equal(suggestHost(open), "Ada");
  assert.equal(suggestSpan([]), 45);
  assert.equal(suggestSpan(open), 15);
  assert.equal(fairHost(open, "Nia, Bea"), "Bea");
  assert.equal(fairHost(open, ""), "Ada");
  assert.equal(usedLanes(open), 3);
  assert.equal(bulkOrderInk(open, ["b"], "champagne").find((card) => card.id === "b")?.ink, "champagne");
  assert.equal(bulkOrderInk(open, ["b"], "champagne").find((card) => card.id === "b")?.audit, "ink");
  const shown = visibleOrders(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = ordersCsv(saved, 2);
  assert.equal(sheet.startsWith("title,host,lane,ink,mark,pace,rank,span,band,pinned,paused,closed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Order Ada"), true);
  assert.equal(activeRank("01"), "all");
  assert.equal(activeRank("1"), "1");
  assert.equal(activeSpan("015"), "all");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("90"), "90");
  const views = Array.from({ length: 8 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    host: "all",
    ink: "all",
    mark: "all",
    pace: "all",
    lane: "all",
    rank: "all",
    span: "all",
  })).reduce((list, view) => addOrderView(list, view), [] as ReturnType<typeof addOrderView>);
  assert.equal(views.length, 6);
  assert.equal(readOrders(saved)[0].title, "Order Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "K" },
    { id: "ann", label: "Ann", note: "North Wing" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { affiliateA: null } },
    { id: "dee", label: "Dee", note: { affiliateA: "TR", referralCodeUsed: "x" } },
    { id: "eve", label: "Eve", note: "7#" },
    { id: "usa", label: "Usa", note: "US" },
    { id: "rail", label: "Rail", note: "north_wing" },
    { id: "seam", label: "Seam", note: "Saint-Jean" },
    { id: "dot", label: "Dot", note: "ab.cd" },
    { id: "hash", label: "Hash", note: "#aa" },
    { id: "even", label: "Even", note: "12" },
    { id: "at", label: "At", note: "a@b" },
    { id: "twin", label: "Twin", note: "AA" },
    { id: "pair", label: "Pair", note: "AA" },
  ];
  assert.equal(stemState(rows[0].note), "set");
  assert.equal(stemBand(rows[0].note), "pip");
  assert.equal(stemDepth(rows[0].note), "plain");
  assert.equal(stemWords(rows[1].note), 2);
  assert.equal(stemDepth(rows[1].note), "stack");
  assert.equal(stemState(rows[2].note), "clear");
  assert.equal(stemState(rows[3].note), "clear");
  assert.equal(stemState(rows[4].note), "");
  assert.equal(stemDepth(rows[5].note), "figure");
  assert.equal(stemBand("US"), "pip");
  assert.equal(stemDepth(rows[7].note), "rail");
  assert.equal(stemDepth(rows[8].note), "seam");
  assert.equal(stemDepth(rows[9].note), "rail");
  assert.equal(hashStem(rows[10].note), true);
  assert.equal(hashStem(rows[0].note), false);
  assert.equal(evenStem(rows[11].note), true);
  assert.equal(evenStem(rows[5].note), false);
  assert.equal(atStem(rows[12].note), true);
  assert.equal(atStem(rows[0].note), false);
  assert.equal(hashStemCount(rows), 1);
  assert.equal(evenStemCount(rows), 1);
  assert.equal(atStemCount(rows), 1);
  assert.equal(sharedStemCount(rows), 1);
  assert.equal(leadingStem(rows), "pip");
  assert.equal(leadingStemDepth(rows).length > 0, true);
  const visible = visibleStemCustomers(rows, "pip", null, "ada", "all", [], "all");
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "ada");
  const reviewed = toggleStemReview([], "ada", rows.map((row) => row.id));
  assert.deepEqual(reviewed, ["ada"]);
  assert.deepEqual(bulkStemReview(reviewed, ["ann", "bea"], rows.map((row) => row.id), true), ["ada", "ann", "bea"]);
  const bands = stemsCsv(rows);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("hash"), true);
  assert.equal(bands.includes("shared"), true);
  const line = stemRowsCsv(rows, reviewed);
  assert.equal(line.startsWith("name,band,depth,words,hash,reviewed"), true);
  assert.equal(line.includes("Ada"), true);

  assert.equal(crmv4Text("en", "morTitle"), ROUND183_COPY.en.morTitle);
  assert.equal(crmv4Text("tr", "morTitle"), ROUND183_COPY.tr.morTitle);
  assert.equal(crmv4Text("de", "aidTitle"), ROUND183_COPY.de.aidTitle);
  assert.equal(crmv4Text("ru", "aidSearch"), ROUND183_COPY.ru.aidSearch);
  assert.equal(crmv4Text("ar", "morNotice"), ROUND183_COPY.ar.morNotice);
  assert.notEqual(ROUND183_COPY.tr.morTitle, ROUND183_COPY.en.morTitle);
  assert.notEqual(ROUND183_COPY.de.aidTitle, ROUND183_COPY.en.aidTitle);
  assert.notEqual(ROUND183_COPY.ru.morSearch, ROUND183_COPY.en.morSearch);
  assert.notEqual(ROUND183_COPY.ar.aidSearch, ROUND183_COPY.en.aidSearch);
  const keys = Object.keys(ROUND183_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND183_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-mor/);
  assert.match(css, /\.c4-aid/);
  assert.match(css, /\.c4-kyc-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round183.tsx"), "utf8");
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
  assert.match(viewFile, /affiliateA/);
  assert.match(viewFile, /ordersCsv/);
  assert.match(viewFile, /stemsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-orders/);
  assert.match(viewFile, /data-stems/);
  assert.match(viewFile, /data-hash/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestInk/);
  const kyc = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round27.tsx"), "utf8");
  assert.match(kyc, /c4-kyc-folio/);
  assert.match(kyc, /data-logo="mono"/);
  assert.match(kyc, /data-ready/);
  assert.match(kyc, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "morn"/);
  assert.match(app, /view === "aaid"/);
  assert.match(app, /MorningOrders/);
  assert.match(app, /AffiliateStems/);
  console.log("crmv4 round183 tests passed");
}

main();
