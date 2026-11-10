/**
 * Vesper bells and server stems.
 * Run: TZ=UTC npx tsx tests/crmv4-round187.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND187_COPY } from "../src/lib/crmv4/copy-round187";
import {
  activeMinute,
  activePause,
  activeSpan,
  addBell,
  addBellView,
  bellCode,
  bulkBellTone,
  catalogStem,
  catalogStemCount,
  cycleCadence,
  editBell,
  editBellNote,
  evenStem,
  evenStemCount,
  fairKeeper,
  homeCode,
  lateBell,
  minuteGap,
  minuteOf,
  nextBell,
  pauseMinutes,
  peakMinute,
  quietMinute,
  readBells,
  sharedStemCount,
  soonBell,
  spanOf,
  stemBand,
  stemRowsCsv,
  stemState,
  stemsCsv,
  suggestKeeper,
  suggestPause,
  suggestTone,
  usedMinutes,
  visibleBells,
  visibleStemCustomers,
  wideStem,
  wideStemCount,
  bellsCsv,
} from "../src/lib/crmv4/round187";

function main() {
  assert.equal(bellCode("  gbr "), "GBR");
  assert.equal(bellCode("fra"), "FRA");
  assert.equal(bellCode("che"), "CHE");
  assert.equal(bellCode("   "), "");
  assert.equal(bellCode("GB"), "");
  assert.equal(bellCode("GBRR"), "");
  assert.equal(minuteOf("00"), 0);
  assert.equal(minuteOf("09"), 9);
  assert.equal(minuteOf("59"), 59);
  assert.equal(minuteOf("60"), null);
  assert.equal(minuteOf(""), null);
  assert.equal(minuteOf("3.0"), null);
  assert.equal(spanOf("3"), 3);
  assert.equal(spanOf(6), 6);
  assert.equal(spanOf(12), 12);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("1"), null);
  assert.equal(spanOf("03"), null);
  assert.equal(pauseMinutes("5"), 5);
  assert.equal(pauseMinutes(15), 15);
  assert.equal(pauseMinutes(45), 45);
  assert.equal(pauseMinutes("0"), null);
  assert.equal(pauseMinutes("05"), null);
  assert.equal(pauseMinutes("10"), null);
  assert.equal(peakMinute(0), true);
  assert.equal(peakMinute(30), true);
  assert.equal(peakMinute(9), false);
  assert.equal(quietMinute(5), true);
  assert.equal(quietMinute(55), true);
  assert.equal(quietMinute(0), false);
  assert.equal(quietMinute(30), false);
  assert.equal(minuteGap(55, 5), 10);
  assert.equal(minuteGap(5, 55), -10);
  assert.equal(minuteGap(0, 30), 30);
  assert.equal(minuteGap(30, 0), -30);
  assert.equal(minuteGap(59, 1), 2);
  assert.equal(minuteGap(1, 59), -2);
  assert.equal(minuteGap(null, 2), null);
  assert.equal(minuteGap(2, ""), null);
  assert.equal(minuteGap(2, 60), null);

  const saved = addBell([], { id: "a", title: "Bell Ada", note: "ivory call", keeper: "Nia", minute: "09", tone: "ivory", code: "gbr", cadence: "still", span: "12", pause: "5" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].minute, 9);
  assert.equal(saved[0].span, 12);
  assert.equal(saved[0].pause, 5);
  assert.equal(saved[0].code, "GBR");
  assert.equal(saved[0].note, "ivory call");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeCode(saved[0].code), true);
  assert.equal(homeCode("US"), false);
  assert.equal(homeCode("GB"), false);
  assert.equal(soonBell(saved[0]), true);
  assert.equal(addBell(saved, { id: "b", title: "Bell Ada" }).length, 1);
  assert.equal(addBell(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBell(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 10 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addBell(cards, card), [] as ReturnType<typeof addBell>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 9");

  const cycled = cycleCadence(saved, "a");
  assert.equal(cycled[0].cadence, "soft");
  assert.equal(cycled[0].audit, "cadence");
  assert.equal(cycleCadence(cycled, "a")[0].cadence, "brisk");
  assert.equal(cycleCadence(cycleCadence(cycled, "a"), "a")[0].cadence, "still");
  const blankCadence = addBell([], { id: "z", title: "Blank cadence" });
  assert.equal(cycleCadence(blankCadence, "z")[0].cadence, "still");

  const edited = editBell(saved, "a", "Bell Bea");
  assert.equal(edited[0].title, "Bell Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editBell(edited, "a", "  ")[0].title, "Bell Bea");
  const noted = editBellNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editBellNote(noted, "a", "  ")[0].note, "second look");
  const pair = addBell(noted, { id: "b", title: "Bell" });
  assert.equal(editBell(pair, "a", "Bell").find((card) => card.id === "a")?.title, "Bell Bea");

  const early = addBell([], { id: "a", title: "Early", minute: "0", tone: "ivory", pause: "5", keeper: "Nia", span: "12" });
  const mid = addBell(early, { id: "m", title: "Mid", minute: "20", tone: "ink", pause: "45", keeper: "Ada", span: "3", cadence: "still" });
  const open = addBell(mid, { id: "b", title: "Later", minute: "40", cadence: "brisk" });
  assert.equal(lateBell(open.find((card) => card.title === "Early") as (typeof open)[number], 10), true);
  assert.equal(lateBell(open.find((card) => card.title === "Early") as (typeof open)[number], 8), false);
  const earlyCard = open.find((card) => card.title === "Early") as (typeof open)[number];
  assert.equal(lateBell({ ...earlyCard, done: true }, 10), false);
  assert.equal(nextBell(open, 10), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextBell(open, 50), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestTone([]), "graphite");
  assert.equal(suggestTone(open), "graphite");
  assert.equal(suggestKeeper(open), "Ada");
  assert.equal(suggestPause([]), 15);
  assert.equal(suggestPause(open), 15);
  assert.equal(fairKeeper(open, "Nia, Bea"), "Bea");
  assert.equal(fairKeeper(open, ""), "Ada");
  assert.equal(usedMinutes(open), 3);
  assert.equal(bulkBellTone(open, ["b"], "graphite").find((card) => card.id === "b")?.tone, "graphite");
  assert.equal(bulkBellTone(open, ["b"], "graphite").find((card) => card.id === "b")?.audit, "tone");
  const shown = visibleBells(open, "open", "ada", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Mid");
  const sheet = bellsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,keeper,minute,tone,code,cadence,span,pause,band,pinned,held,done,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Bell Ada"), true);
  assert.equal(activeSpan("03"), "all");
  assert.equal(activeSpan("3"), "3");
  assert.equal(activePause("05"), "all");
  assert.equal(activePause("5"), "5");
  assert.equal(activePause("45"), "45");
  assert.equal(activeMinute("00"), "0");
  assert.equal(activeMinute("60"), "all");
  const views = Array.from({ length: 6 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    keeper: "all",
    tone: "all",
    code: "all",
    cadence: "all",
    minute: "all",
    span: "all",
    pause: "all",
  })).reduce((list, view) => addBellView(list, view), [] as ReturnType<typeof addBellView>);
  assert.equal(views.length, 4);
  assert.equal(readBells(saved)[0].title, "Bell Ada");

  const seed = "abcdef";
  const stem = "abcdefghi";
  const trunk = "a".repeat(14);
  const canopy = "b".repeat(18);
  const catalogStemName = "c".repeat(10);
  const wideCatalog = "d".repeat(20);
  const rows = [
    { id: "ada", label: "Ada", note: seed },
    { id: "bea", label: "Bea", note: { tradingServer: seed } },
    { id: "cy", label: "Cy", note: { tradingServer: null } },
    { id: "dee", label: "Dee", note: { tradingServer: stem, balance: 1 } },
    { id: "eve", label: "Eve", note: trunk },
    { id: "fay", label: "Fay", note: canopy },
    { id: "gus", label: "Gus", note: catalogStemName },
    { id: "hal", label: "Hal", note: wideCatalog },
    { id: "nope", label: "Nope", note: "abcde" },
    { id: "blank", label: "Blank", note: "" },
  ];
  assert.equal(stemState(seed), "set");
  assert.equal(stemState({ tradingServer: null }), "clear");
  assert.equal(stemState({ tradingServer: stem, balance: 1 }), "");
  assert.equal(stemState("abcde"), "");
  assert.equal(stemState(""), "clear");
  assert.equal(stemState("abcd-ef"), "");
  assert.equal(stemBand(seed), "seed");
  assert.equal(stemBand(stem), "stem");
  assert.equal(stemBand(trunk), "trunk");
  assert.equal(stemBand(canopy), "canopy");
  assert.equal(catalogStem(seed), true);
  assert.equal(catalogStem(stem), false);
  assert.equal(wideStem(canopy), true);
  assert.equal(wideStem(wideCatalog), true);
  assert.equal(evenStem(seed), true);
  assert.equal(catalogStemCount(rows), 5);
  assert.equal(wideStemCount(rows), 2);
  assert.equal(evenStemCount(rows), 6);
  assert.equal(sharedStemCount(rows), 1);
  assert.equal(visibleStemCustomers(rows, "seed", null, "", "all", [], "all").length, 2);
  assert.equal(visibleStemCustomers(rows, null, null, "gus", "all", [], "all").length, 1);
  const bands = stemsCsv(rows);
  assert.equal(bands.startsWith("kind,mark,count"), true);
  assert.equal(bands.includes("amount"), false);
  assert.equal(bands.includes("catalog"), true);
  const queue = stemRowsCsv(rows, ["ada"]);
  assert.equal(queue.includes("Ada"), true);
  assert.equal(queue.split("\n")[1].endsWith(",1"), true);

  assert.equal(crmv4Text("en", "vspTitle"), ROUND187_COPY.en.vspTitle);
  assert.equal(crmv4Text("tr", "stmTitle"), ROUND187_COPY.tr.stmTitle);
  assert.equal(crmv4Text("de", "vspSearch"), ROUND187_COPY.de.vspSearch);
  assert.equal(crmv4Text("ru", "stmHint"), ROUND187_COPY.ru.stmHint);
  assert.equal(crmv4Text("ar", "vspNotice"), ROUND187_COPY.ar.vspNotice);
  assert.notEqual(ROUND187_COPY.tr.vspTitle, ROUND187_COPY.en.vspTitle);
  assert.notEqual(ROUND187_COPY.de.stmTitle, ROUND187_COPY.en.stmTitle);
  assert.notEqual(ROUND187_COPY.ru.vspSearch, ROUND187_COPY.en.vspSearch);
  assert.notEqual(ROUND187_COPY.ar.stmSearch, ROUND187_COPY.en.stmSearch);
  const keys = Object.keys(ROUND187_COPY.en);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND187_COPY[locale]), keys);
  }

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vsp/);
  assert.match(css, /\.c4-stm/);
  assert.match(css, /\.c4-ops-workshop/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round187.tsx"), "utf8");
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
  assert.match(viewFile, /tradingServer/);
  assert.match(viewFile, /bellsCsv/);
  assert.match(viewFile, /stemsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-bells/);
  assert.match(viewFile, /data-stems/);
  assert.match(viewFile, /data-catalog/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestTone/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-ops-workshop/);
  assert.match(ops, /data-logo="mono"/);
  assert.match(ops, /c4-ops-mast/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vesper"/);
  assert.match(app, /view === "stem"/);
  assert.match(app, /VesperBells/);
  assert.match(app, /ServerStems/);
  console.log("crmv4 round187 tests passed");
}

main();
