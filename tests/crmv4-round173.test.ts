/**
 * Glasshouse stools and retention slips.
 * Run: TZ=UTC npx tsx tests/crmv4-round173.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND173_COPY } from "../src/lib/crmv4/copy-round173";
import {
  activePause,
  activeSeat,
  activeSlip,
  addStool,
  addStoolView,
  bodySeat,
  bulkReview,
  bulkStoolTempo,
  cycleShade,
  editStool,
  editStoolNote,
  endSeat,
  lateStool,
  leadingSlip,
  leadingSlipDepth,
  nextStool,
  pauseOf,
  rankOf,
  readReviewed,
  readStools,
  seatGap,
  seatOf,
  slipBand,
  slipDepth,
  slipLength,
  slipRowsCsv,
  slipState,
  slipsCsv,
  stoolAisle,
  stoolsCsv,
  suggestHost,
  suggestTempo,
  toggleReview,
  visibleSlipCustomers,
  visibleStools,
} from "../src/lib/crmv4/round173";

function main() {
  assert.equal(stoolAisle("  KYC  "), "KYC");
  assert.equal(stoolAisle("   "), "");
  assert.equal(stoolAisle("z".repeat(20)).length, 4);

  assert.equal(seatOf("01"), 1);
  assert.equal(seatOf("06"), 6);
  assert.equal(seatOf("1"), 1);
  assert.equal(seatOf(6), 6);
  assert.equal(seatOf("00"), null);
  assert.equal(seatOf("07"), null);
  assert.equal(seatOf(""), null);
  assert.equal(seatOf("3.0"), null);
  assert.equal(rankOf("01"), 1);
  assert.equal(rankOf(3), 3);
  assert.equal(rankOf("0"), null);
  assert.equal(rankOf("4"), null);
  assert.equal(pauseOf("4"), 4);
  assert.equal(pauseOf(16), 16);
  assert.equal(pauseOf("1"), null);
  assert.equal(pauseOf("04"), null);
  assert.equal(endSeat(1), true);
  assert.equal(endSeat(6), true);
  assert.equal(endSeat(2), false);
  assert.equal(bodySeat(2), true);
  assert.equal(bodySeat(5), true);
  assert.equal(bodySeat(1), false);
  assert.equal(bodySeat(6), false);
  assert.equal(seatGap(5, 1), 2);
  assert.equal(seatGap(1, 5), -2);
  assert.equal(seatGap(2, 2), 0);
  assert.equal(seatGap(1, 4), 3);
  assert.equal(seatGap(4, 1), 3);
  assert.equal(seatGap(null, 2), null);
  assert.equal(seatGap(2, ""), null);
  assert.equal(seatGap(2, 7), null);

  const saved = addStool([], { id: "a", title: "Stool Ada", note: "glass scan", host: "Nia", seat: "06", tempo: "sit", aisle: "A1", shade: "mist", rank: "01", pause: "4" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].seat, 6);
  assert.equal(saved[0].rank, 1);
  assert.equal(saved[0].pause, 4);
  assert.equal(saved[0].note, "glass scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addStool(saved, { id: "b", title: "Stool Ada" }).length, 1);
  assert.equal(addStool(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addStool(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addStool(cards, card), [] as ReturnType<typeof addStool>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleShade(saved, "a");
  assert.equal(cycled[0].shade, "leaf");
  assert.equal(cycled[0].audit, "shade");
  assert.equal(cycleShade(cycled, "a")[0].shade, "bloom");
  assert.equal(cycleShade(cycleShade(cycled, "a"), "a")[0].shade, "mist");
  const blankShade = addStool([], { id: "z", title: "Blank shade" });
  assert.equal(cycleShade(blankShade, "z")[0].shade, "mist");

  const edited = editStool(saved, "a", "Stool Bea");
  assert.equal(edited[0].title, "Stool Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editStool(edited, "a", "  ")[0].title, "Stool Bea");
  const noted = editStoolNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editStoolNote(noted, "a", "  ")[0].note, "second look");
  const pair = addStool(noted, { id: "b", title: "Keep" });
  assert.equal(editStool(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Stool Bea");

  const moved = bulkStoolTempo(pair, ["a"], "lean");
  assert.equal(moved.find((card) => card.id === "a")?.tempo, "lean");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkStoolTempo(moved, ["a"], "lean").find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkStoolTempo(moved, ["a"], "attic").find((card) => card.id === "a")?.tempo, "lean");

  const mixed = [
    ...addStool([], { id: "live", title: "Live", note: "glass scan", host: "Nia", seat: 2, tempo: "sit", aisle: "A1", shade: "mist", rank: 1, pause: 8 }),
  ];
  assert.equal(visibleStools(mixed, "open", "glass", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStools(mixed, "open", "a1", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStools(mixed, "open", "nia", null, null, null, null, null, null, null, null, false, false).length, 0);
  const seated = mixed.map((card) => (card.id === "live" ? { ...card, seated: true } : card));
  const filed = mixed.map((card) => ({ ...card, filed: true, seated: true }));
  assert.equal(visibleStools(mixed, "open", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStools(seated, "seated", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStools(seated, "open", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleStools(filed, "filed", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleStools(filed, "seated", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(lateStool(mixed[0], 5), true);
  assert.equal(lateStool(mixed[0], 4), false);
  assert.equal(suggestTempo([]), "sit");
  assert.equal(suggestTempo(mixed), "lean");
  assert.equal(suggestHost([]), "");
  assert.equal(suggestHost(mixed), "Nia");
  const loaded = addStool(mixed, { id: "bea", title: "Bea", host: "Bea", seat: 3, tempo: "lean", shade: "mist" });
  assert.equal(suggestHost(loaded), "Bea");
  assert.equal(nextStool(mixed, 2), "live");
  assert.equal(nextStool(mixed.map((card) => ({ ...card, shade: "bloom" })), 2), "");
  assert.equal(nextStool(mixed, 5), "live");
  const csv = stoolsCsv(mixed, 5);
  assert.equal(csv.startsWith("title,host,seat,tempo,aisle,shade,rank,pause,band,pinned,seated,filed,gap,late,note,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  assert.equal(readStools(mixed)[0].seat, 2);
  const views = addStoolView([], { id: "v", name: "Morning", tray: "open", query: "ada", host: "all", tempo: "sit", aisle: "all", shade: "all", seat: "near", rank: "1", pause: "4" });
  assert.equal(views.length, 1);
  assert.equal(views[0].seat, "near");
  assert.equal(views[0].rank, "1");
  assert.equal(views[0].pause, "4");
  assert.equal(activeSeat("07"), "all");
  assert.equal(activeSeat("06"), "6");
  assert.equal(activeSeat("near"), "near");
  assert.equal(activePause("04"), "all");
  const viewCap = Array.from({ length: 7 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", host: "all", tempo: "all", aisle: "all", shade: "all", seat: "all", rank: "all", pause: "all" })).reduce((rows, view) => addStoolView(rows, view), [] as ReturnType<typeof addStoolView>);
  assert.equal(viewCap.length, 5);

  assert.equal(slipState(""), "clear");
  assert.equal(slipState("   "), "clear");
  assert.equal(slipState(null), "");
  assert.equal(slipState(0), "");
  assert.equal(slipState("0"), "set");
  assert.equal(slipLength("0"), 1);
  assert.equal(slipState({ retentionNote: "hello" }), "set");
  assert.equal(slipState({ retentionNote: "" }), "clear");
  assert.equal(slipState({ retentionNote: null }), "clear");
  assert.equal(slipState({ name: "Ada", retentionNote: "hello" }), "");
  assert.equal(slipState({ failedLoginCount: 1, retentionNote: "hi" }), "");
  assert.equal(slipState({ lastSeenAt: "2026-11-10T11:50:00.000Z", retentionNote: "hi" }), "");
  assert.equal(slipBand("abcd"), "whisper");
  assert.equal(slipDepth("abcd"), "near");
  assert.equal(slipBand("abcdefgh"), "whisper");
  assert.equal(slipDepth("abcdefgh"), "mid");
  assert.equal(slipBand("a".repeat(12)), "whisper");
  assert.equal(slipDepth("a".repeat(12)), "far");
  assert.equal(slipBand("a".repeat(13)), "line");
  assert.equal(slipDepth("a".repeat(13)), "near");
  assert.equal(slipBand("a".repeat(21)), "line");
  assert.equal(slipDepth("a".repeat(21)), "mid");
  assert.equal(slipBand("a".repeat(40)), "line");
  assert.equal(slipDepth("a".repeat(40)), "far");
  assert.equal(slipBand("a".repeat(41)), "page");
  assert.equal(slipDepth("a".repeat(41)), "near");
  assert.equal(slipBand("a".repeat(80)), "page");
  assert.equal(slipDepth("a".repeat(80)), "far");
  assert.equal(slipBand("a".repeat(81)), "folio");
  assert.equal(slipDepth("a".repeat(81)), "near");
  assert.equal(slipBand("a".repeat(111)), "folio");
  assert.equal(slipDepth("a".repeat(111)), "mid");
  assert.equal(slipBand("a".repeat(141)), "folio");
  assert.equal(slipDepth("a".repeat(141)), "far");
  assert.equal(slipBand(""), "");
  const rows = [
    { id: "ada", note: "Hi", label: "Ada" },
    { id: "ann", note: "", label: "Ann" },
    { id: "bea", note: null, label: "Beatrice" },
    { id: "belle", note: "a".repeat(90), label: "Annabelle Marie" },
  ];
  assert.equal(leadingSlip(rows), "whisper");
  assert.equal(leadingSlipDepth(rows), "near");
  assert.equal(visibleSlipCustomers(rows, "blank", null, "", "all", []).length, 1);
  assert.equal(visibleSlipCustomers(rows, "folio", null, "", "all", []).length, 1);
  assert.equal(visibleSlipCustomers(rows, null, null, "bea", "all", []).length, 1);
  assert.equal(visibleSlipCustomers(rows, null, null, "90", "all", []).length, 0);
  assert.equal(visibleSlipCustomers(rows, null, null, "", "reviewed", ["ada"]).length, 1);
  assert.equal(visibleSlipCustomers(rows, null, null, "", "open", ["ada"]).length, 3);
  assert.deepEqual(toggleReview([], "ada", ["ada", "ann"]), ["ada"]);
  assert.deepEqual(readReviewed(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  const names = slipsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(slipsCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",whisper,"), true);
  const queue = slipRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,length,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeSlip("gone", ["whisper"]), "all");

  const copy = Object.keys(ROUND173_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND173_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "stlTitle"), "Glasshouse stools");
  assert.equal(crmv4Text("tr", "rslTitle"), ROUND173_COPY.tr.rslTitle);
  assert.equal(crmv4Text("de", "stlHost"), ROUND173_COPY.de.stlHost);
  assert.equal(crmv4Text("ru", "rslUnmarked"), ROUND173_COPY.ru.rslUnmarked);
  assert.equal(crmv4Text("ar", "stlNotice"), ROUND173_COPY.ar.stlNotice);
  assert.notEqual(ROUND173_COPY.tr.stlTitle, ROUND173_COPY.en.stlTitle);
  assert.notEqual(ROUND173_COPY.de.rslTitle, ROUND173_COPY.en.rslTitle);
  assert.notEqual(ROUND173_COPY.ru.stlSearch, ROUND173_COPY.en.stlSearch);
  assert.notEqual(ROUND173_COPY.ar.rslSearch, ROUND173_COPY.en.rslSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-stl/);
  assert.match(css, /\.c4-rsl/);
  assert.match(css, /\.c4-cust-stool/);
  assert.match(css, /\.c4-pagehead-stool/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round173.tsx"), "utf8");
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
  assert.match(viewFile, /retentionNote/);
  assert.match(viewFile, /stoolsCsv/);
  assert.match(viewFile, /slipsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-stools/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestTempo/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "stool"/);
  assert.match(app, /view === "rslip"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-stool/);
  console.log("crmv4 round173 tests passed");
}

main();
