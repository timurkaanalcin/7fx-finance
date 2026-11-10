/**
 * Arcade bays and failed-login strikes.
 * Run: TZ=UTC npx tsx tests/crmv4-round172.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND172_COPY } from "../src/lib/crmv4/copy-round172";
import {
  activeBay,
  activeRest,
  activeStrike,
  addBay,
  addBayView,
  bayGap,
  bayOf,
  bayWing,
  bodyBay,
  bulkBayPace,
  cycleLamp,
  editBay,
  editBayNote,
  endBay,
  lateBay,
  leadingStrike,
  leadingStrikeDepth,
  nextBay,
  readBays,
  restOf,
  stepOf,
  strikeBand,
  strikeCount,
  strikeDepth,
  strikeState,
  strikesCsv,
  suggestGuide,
  suggestPace,
  baysCsv,
  visibleBays,
  visibleStrikeCustomers,
} from "../src/lib/crmv4/round172";

function main() {
  assert.equal(bayWing("  KYC  "), "KYC");
  assert.equal(bayWing("   "), "");
  assert.equal(bayWing("z".repeat(20)).length, 4);

  assert.equal(bayOf("01"), 1);
  assert.equal(bayOf("08"), 8);
  assert.equal(bayOf("1"), 1);
  assert.equal(bayOf(8), 8);
  assert.equal(bayOf("00"), null);
  assert.equal(bayOf("09"), null);
  assert.equal(bayOf(""), null);
  assert.equal(bayOf("3.0"), null);
  assert.equal(stepOf("01"), 1);
  assert.equal(stepOf(3), 3);
  assert.equal(stepOf("0"), null);
  assert.equal(stepOf("4"), null);
  assert.equal(restOf("5"), 5);
  assert.equal(restOf(20), 20);
  assert.equal(restOf("1"), null);
  assert.equal(restOf("05"), null);
  assert.equal(endBay(1), true);
  assert.equal(endBay(8), true);
  assert.equal(endBay(2), false);
  assert.equal(bodyBay(2), true);
  assert.equal(bodyBay(7), true);
  assert.equal(bodyBay(1), false);
  assert.equal(bodyBay(8), false);
  assert.equal(bayGap(7, 1), 2);
  assert.equal(bayGap(1, 7), -2);
  assert.equal(bayGap(2, 2), 0);
  assert.equal(bayGap(1, 5), 4);
  assert.equal(bayGap(5, 1), 4);
  assert.equal(bayGap(null, 2), null);
  assert.equal(bayGap(2, ""), null);
  assert.equal(bayGap(2, 9), null);

  const saved = addBay([], { id: "a", title: "Bay Ada", note: "circuit scan", guide: "Nia", bay: "08", pace: "amble", wing: "A1", lamp: "wick", step: "01", rest: "5" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].bay, 8);
  assert.equal(saved[0].step, 1);
  assert.equal(saved[0].rest, 5);
  assert.equal(saved[0].note, "circuit scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(addBay(saved, { id: "b", title: "Bay Ada" }).length, 1);
  assert.equal(addBay(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBay(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 11 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addBay(cards, card), [] as ReturnType<typeof addBay>);
  assert.equal(capped.length, 9);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 10");

  const cycled = cycleLamp(saved, "a");
  assert.equal(cycled[0].lamp, "glow");
  assert.equal(cycled[0].audit, "lamp");
  assert.equal(cycleLamp(cycled, "a")[0].lamp, "flare");
  assert.equal(cycleLamp(cycleLamp(cycled, "a"), "a")[0].lamp, "wick");
  const blankLamp = addBay([], { id: "z", title: "Blank lamp" });
  assert.equal(cycleLamp(blankLamp, "z")[0].lamp, "wick");

  const edited = editBay(saved, "a", "Bay Bea");
  assert.equal(edited[0].title, "Bay Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editBay(edited, "a", "  ")[0].title, "Bay Bea");
  const noted = editBayNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editBayNote(noted, "a", "  ")[0].note, "second look");
  const pair = addBay(noted, { id: "b", title: "Keep" });
  assert.equal(editBay(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Bay Bea");

  const moved = bulkBayPace(pair, ["a"], "stride");
  assert.equal(moved.find((card) => card.id === "a")?.pace, "stride");
  assert.equal(moved.find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkBayPace(moved, ["a"], "stride").find((card) => card.id === "a")?.audit, "move");
  assert.equal(bulkBayPace(moved, ["a"], "attic").find((card) => card.id === "a")?.pace, "stride");

  const mixed = [
    ...addBay([], { id: "live", title: "Live", note: "circuit scan", guide: "Nia", bay: 2, pace: "amble", wing: "A1", lamp: "wick", step: 1, rest: 10 }),
  ];
  assert.equal(visibleBays(mixed, "open", "circuit", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleBays(mixed, "open", "a1", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleBays(mixed, "open", "nia", null, null, null, null, null, null, null, null, false, false).length, 0);
  const walked = mixed.map((card) => (card.id === "live" ? { ...card, walked: true } : card));
  const filed = mixed.map((card) => ({ ...card, filed: true, walked: true }));
  assert.equal(visibleBays(mixed, "open", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleBays(walked, "walked", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleBays(walked, "open", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(visibleBays(filed, "filed", "", null, null, null, null, null, null, null, null, false, false).length, 1);
  assert.equal(visibleBays(filed, "walked", "", null, null, null, null, null, null, null, null, false, false).length, 0);
  assert.equal(lateBay(mixed[0], 5), true);
  assert.equal(lateBay(mixed[0], 4), false);
  assert.equal(suggestPace([]), "amble");
  assert.equal(suggestPace(mixed), "stride");
  assert.equal(suggestGuide([]), "");
  assert.equal(suggestGuide(mixed), "Nia");
  const loaded = addBay(mixed, { id: "bea", title: "Bea", guide: "Bea", bay: 3, pace: "stride", lamp: "wick" });
  assert.equal(suggestGuide(loaded), "Bea");
  assert.equal(nextBay(mixed, 2), "live");
  assert.equal(nextBay(mixed.map((card) => ({ ...card, lamp: "flare" })), 2), "");
  assert.equal(nextBay(mixed, 6), "live");
  const csv = baysCsv(mixed, 5);
  assert.equal(csv.startsWith("title,guide,bay,pace,wing,lamp,step,rest,band,pinned,walked,filed,gap,late,note,audit"), true);
  assert.equal(csv.includes("amount"), false);
  assert.equal(csv.includes(",2,"), true);
  assert.equal(readBays(mixed)[0].bay, 2);
  const views = addBayView([], { id: "v", name: "Morning", tray: "open", query: "ada", guide: "all", pace: "amble", wing: "all", lamp: "all", bay: "near", step: "1", rest: "5" });
  assert.equal(views.length, 1);
  assert.equal(views[0].bay, "near");
  assert.equal(views[0].step, "1");
  assert.equal(views[0].rest, "5");
  assert.equal(activeBay("09"), "all");
  assert.equal(activeBay("08"), "8");
  assert.equal(activeBay("near"), "near");
  assert.equal(activeRest("05"), "all");
  const viewCap = Array.from({ length: 8 }, (_, index) => ({ id: `v${index}`, name: `View ${index}`, tray: "open" as const, query: "", guide: "all", pace: "all", wing: "all", lamp: "all", bay: "all", step: "all", rest: "all" })).reduce((rows, view) => addBayView(rows, view), [] as ReturnType<typeof addBayView>);
  assert.equal(viewCap.length, 6);

  assert.equal(strikeState(0), "set");
  assert.equal(strikeState("0"), "set");
  assert.equal(strikeState("01"), "set");
  assert.equal(strikeCount("01"), 1);
  assert.equal(strikeState(""), "clear");
  assert.equal(strikeState("   "), "clear");
  assert.equal(strikeState(null), "");
  assert.equal(strikeState("3.0"), "");
  assert.equal(strikeState(100), "");
  assert.equal(strikeState(1.5), "");
  assert.equal(strikeState({ failedLoginCount: 3 }), "set");
  assert.equal(strikeState({ failedLoginCount: "" }), "clear");
  assert.equal(strikeState({ failedLoginCount: null }), "clear");
  assert.equal(strikeState({ name: "Ada", failedLoginCount: 3 }), "");
  assert.equal(strikeState({ lastSeenAt: "2026-11-10T11:50:00.000Z", failedLoginCount: 1 }), "");
  assert.equal(strikeBand(0), "quiet");
  assert.equal(strikeDepth(0), "");
  assert.equal(strikeBand(1), "spark");
  assert.equal(strikeDepth(1), "near");
  assert.equal(strikeBand(2), "spark");
  assert.equal(strikeDepth(2), "mid");
  assert.equal(strikeBand(3), "spark");
  assert.equal(strikeDepth(3), "far");
  assert.equal(strikeBand(4), "heat");
  assert.equal(strikeDepth(4), "near");
  assert.equal(strikeBand(6), "heat");
  assert.equal(strikeDepth(6), "mid");
  assert.equal(strikeBand(8), "heat");
  assert.equal(strikeDepth(8), "far");
  assert.equal(strikeBand(9), "blaze");
  assert.equal(strikeDepth(9), "near");
  assert.equal(strikeBand(15), "blaze");
  assert.equal(strikeDepth(15), "mid");
  assert.equal(strikeBand(30), "blaze");
  assert.equal(strikeDepth(30), "far");
  assert.equal(strikeBand(""), "");
  const rows = [
    { count: 1, label: "Ada" },
    { count: "", label: "Ann" },
    { count: null, label: "Beatrice" },
    { count: 9, label: "Annabelle Marie" },
  ];
  assert.equal(leadingStrike(rows), "spark");
  assert.equal(leadingStrikeDepth(rows), "near");
  assert.equal(visibleStrikeCustomers(rows, "blank", null, "").length, 1);
  assert.equal(visibleStrikeCustomers(rows, "blaze", null, "").length, 1);
  assert.equal(visibleStrikeCustomers(rows, null, null, "bea").length, 1);
  assert.equal(visibleStrikeCustomers(rows, null, null, "9").length, 0);
  const names = strikesCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(strikesCsv([]), "kind,mark,count");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",spark,"), true);
  assert.equal(activeStrike("gone", ["spark"]), "all");

  const copy = Object.keys(ROUND172_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND172_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "arcTitle"), "Arcade bays");
  assert.equal(crmv4Text("tr", "stkTitle"), ROUND172_COPY.tr.stkTitle);
  assert.equal(crmv4Text("de", "arcGuide"), ROUND172_COPY.de.arcGuide);
  assert.equal(crmv4Text("ru", "stkUnmarked"), ROUND172_COPY.ru.stkUnmarked);
  assert.equal(crmv4Text("ar", "arcNotice"), ROUND172_COPY.ar.arcNotice);
  assert.notEqual(ROUND172_COPY.tr.arcTitle, ROUND172_COPY.en.arcTitle);
  assert.notEqual(ROUND172_COPY.de.stkTitle, ROUND172_COPY.en.stkTitle);
  assert.notEqual(ROUND172_COPY.ru.arcSearch, ROUND172_COPY.en.arcSearch);
  assert.notEqual(ROUND172_COPY.ar.stkSearch, ROUND172_COPY.en.stkSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-arc/);
  assert.match(css, /\.c4-stk/);
  assert.match(css, /\.c4-cust-arcade/);
  assert.match(css, /\.c4-pagehead-arcade/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round172.tsx"), "utf8");
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
  assert.match(viewFile, /failedLoginCount/);
  assert.match(viewFile, /baysCsv/);
  assert.match(viewFile, /strikesCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-bays/);
  assert.match(viewFile, /data-strikes/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestPace/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "arcade"/);
  assert.match(app, /view === "strike"/);
  const customers = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Customers.tsx"), "utf8");
  assert.match(customers, /c4-cust-arcade/);
  console.log("crmv4 round172 tests passed");
}

main();
