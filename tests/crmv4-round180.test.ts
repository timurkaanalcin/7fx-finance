/**
 * Map bearings and mail seals.
 * Run: TZ=UTC npx tsx tests/crmv4-round180.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND180_COPY } from "../src/lib/crmv4/copy-round180";
import {
  activeCord,
  activeSeal,
  activeSpan,
  addBearing,
  addBearingView,
  bearingMark,
  bulkBearingInk,
  bulkSealReview,
  cordOf,
  cycleGlaze,
  editBearing,
  editBearingNote,
  homeCipher,
  lateBearing,
  leadingSeal,
  leadingSealDepth,
  nextBearing,
  oddSealCount,
  peakStation,
  plusSeal,
  quietStation,
  readBearings,
  readReviewedSeals,
  sealBand,
  sealDepth,
  sealRowsCsv,
  sealState,
  sealWords,
  sealsCsv,
  soonBearing,
  spanOf,
  stationGap,
  stationOf,
  suggestCord,
  suggestInk,
  suggestPilot,
  toggleSealReview,
  usedStations,
  visibleBearings,
  visibleSealCustomers,
  bearingsCsv,
} from "../src/lib/crmv4/round180";

function main() {
  assert.equal(bearingMark("  en "), "EN");
  assert.equal(bearingMark("tr"), "TR");
  assert.equal(bearingMark("ae"), "AE");
  assert.equal(bearingMark("   "), "");
  assert.equal(bearingMark("G"), "");
  assert.equal(bearingMark("GBR"), "");
  assert.equal(bearingMark("G1"), "");
  assert.equal(bearingMark("z".repeat(20)), "");

  assert.equal(stationOf("01"), 1);
  assert.equal(stationOf("08"), 8);
  assert.equal(stationOf("1"), 1);
  assert.equal(stationOf(8), 8);
  assert.equal(stationOf("00"), null);
  assert.equal(stationOf("09"), null);
  assert.equal(stationOf("9"), null);
  assert.equal(stationOf(""), null);
  assert.equal(stationOf("3.0"), null);
  assert.equal(spanOf("4"), 4);
  assert.equal(spanOf(8), 8);
  assert.equal(spanOf(2), 2);
  assert.equal(spanOf("0"), null);
  assert.equal(spanOf("6"), null);
  assert.equal(spanOf("02"), null);
  assert.equal(cordOf("3"), 3);
  assert.equal(cordOf(11), 11);
  assert.equal(cordOf("7"), 7);
  assert.equal(cordOf("1"), null);
  assert.equal(cordOf("03"), null);
  assert.equal(cordOf(8), null);
  assert.equal(peakStation(3), true);
  assert.equal(peakStation(7), true);
  assert.equal(peakStation(1), false);
  assert.equal(quietStation(1), true);
  assert.equal(quietStation(4), true);
  assert.equal(quietStation(8), true);
  assert.equal(quietStation(3), false);
  assert.equal(quietStation(7), false);
  assert.equal(stationGap(5, 1), -4);
  assert.equal(stationGap(1, 5), 4);
  assert.equal(stationGap(2, 2), 0);
  assert.equal(stationGap(1, 6), -3);
  assert.equal(stationGap(6, 1), 3);
  assert.equal(stationGap(null, 2), null);
  assert.equal(stationGap(2, ""), null);
  assert.equal(stationGap(2, 9), null);

  const saved = addBearing([], { id: "a", title: "Bearing Ada", note: "chalk scan", pilot: "Nia", station: "08", ink: "chalk", cipher: "en", glaze: "pearl", span: "4", cord: "3" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].station, 8);
  assert.equal(saved[0].span, 4);
  assert.equal(saved[0].cord, 3);
  assert.equal(saved[0].cipher, "EN");
  assert.equal(saved[0].note, "chalk scan");
  assert.equal(saved[0].audit, "save");
  assert.equal(homeCipher(saved[0].cipher), true);
  assert.equal(homeCipher("TR"), false);
  assert.equal(soonBearing(saved[0]), true);
  assert.equal(addBearing(saved, { id: "b", title: "Bearing Ada" }).length, 1);
  assert.equal(addBearing(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBearing(saved, { id: "c", title: "   " }).length, 1);
  const capped = Array.from({ length: 12 }, (_, index) => ({ id: `n${index}`, title: `Line ${index}` })).reduce((cards, card) => addBearing(cards, card), [] as ReturnType<typeof addBearing>);
  assert.equal(capped.length, 8);
  assert.equal(capped.some((card) => card.title === "Line 0"), false);
  assert.equal(capped[0].title, "Line 11");

  const cycled = cycleGlaze(saved, "a");
  assert.equal(cycled[0].glaze, "brass");
  assert.equal(cycled[0].audit, "glaze");
  assert.equal(cycleGlaze(cycled, "a")[0].glaze, "slate");
  assert.equal(cycleGlaze(cycleGlaze(cycled, "a"), "a")[0].glaze, "pearl");
  const blankTone = addBearing([], { id: "z", title: "Blank glaze" });
  assert.equal(cycleGlaze(blankTone, "z")[0].glaze, "pearl");

  const edited = editBearing(saved, "a", "Bearing Bea");
  assert.equal(edited[0].title, "Bearing Bea");
  assert.equal(edited[0].audit, "edit");
  assert.equal(editBearing(edited, "a", "  ")[0].title, "Bearing Bea");
  const noted = editBearingNote(edited, "a", "second look");
  assert.equal(noted[0].note, "second look");
  assert.equal(editBearingNote(noted, "a", "  ")[0].note, "second look");
  const pair = addBearing(noted, { id: "b", title: "Keep" });
  assert.equal(editBearing(pair, "a", "Keep").find((card) => card.id === "a")?.title, "Bearing Bea");

  const early = addBearing([], { id: "a", title: "Early", station: "1", ink: "chalk", cord: "11", pilot: "Nia" });
  const mid = addBearing(early, { id: "m", title: "Mid", station: "4", ink: "ink", cord: "7", pilot: "Ada" });
  const open = addBearing(mid, { id: "b", title: "Later", station: "7", glaze: "slate" });
  assert.equal(lateBearing(open.find((card) => card.title === "Early") as (typeof open)[number], 4), true);
  assert.equal(lateBearing(open.find((card) => card.title === "Early") as (typeof open)[number], 2), false);
  assert.equal(lateBearing({ ...open[0], filed: true }, 4), false);
  assert.equal(nextBearing(open, 2), open.find((card) => card.title === "Mid")?.id);
  assert.equal(nextBearing(open, 6), open.find((card) => card.title === "Early")?.id);
  assert.equal(suggestInk([]), "ink");
  assert.equal(suggestInk(open), "gilt");
  assert.equal(suggestPilot(open), "Ada");
  assert.equal(suggestCord([]), 7);
  assert.equal(suggestCord(open), 3);
  assert.equal(usedStations(open), 3);
  assert.equal(bulkBearingInk(open, ["b"], "gilt").find((card) => card.id === "b")?.ink, "gilt");
  assert.equal(bulkBearingInk(open, ["b"], "gilt").find((card) => card.id === "b")?.audit, "shift");
  const shown = visibleBearings(open, "open", "early", null, null, null, null, null, null, null, null, false, false, false);
  assert.equal(shown.length, 1);
  assert.equal(shown[0].title, "Early");
  const sheet = bearingsCsv(saved, 2);
  assert.equal(sheet.startsWith("title,pilot,station,ink,cipher,glaze,span,cord,band,pinned,fixed,filed,gap,late,soon,home,note,audit"), true);
  assert.equal(sheet.includes("amount"), false);
  assert.equal(sheet.includes("Bearing Ada"), true);
  assert.equal(activeSpan("8"), "8");
  assert.equal(activeSpan("02"), "all");
  assert.equal(activeSpan("2"), "2");
  assert.equal(activeCord("03"), "all");
  assert.equal(activeCord("3"), "3");
  assert.equal(activeCord("11"), "11");
  const views = Array.from({ length: 8 }, (_, index) => ({
    id: `v${index}`,
    name: `View ${index}`,
    tray: "open" as const,
    query: "",
    pilot: "all",
    ink: "all",
    cipher: "all",
    glaze: "all",
    station: "all",
    span: "all",
    cord: "all",
  })).reduce((list, view) => addBearingView(list, view), [] as ReturnType<typeof addBearingView>);
  assert.equal(views.length, 5);
  assert.equal(readBearings(saved)[0].title, "Bearing Ada");

  const rows = [
    { id: "ada", label: "Ada", note: "K" },
    { id: "ann", label: "Ann", note: "North Wing" },
    { id: "bea", label: "Bea", note: "" },
    { id: "cy", label: "Cy", note: { email: null } },
    { id: "dee", label: "Dee", note: { email: "TR", saleStatus: "x" } },
    { id: "eve", label: "Eve", note: "7#" },
    { id: "usa", label: "Usa", note: "US" },
    { id: "rail", label: "Rail", note: "north_wing" },
    { id: "seam", label: "Seam", note: "Saint-Jean" },
  ];
  assert.equal(sealState(rows[0].note), "set");
  assert.equal(sealBand(rows[0].note), "pip");
  assert.equal(sealDepth(rows[0].note), "plain");
  assert.equal(sealWords(rows[0].note), 1);
  assert.equal(plusSeal(rows[0].note), false);
  assert.equal(sealBand(rows[1].note), "card");
  assert.equal(sealDepth(rows[1].note), "pair");
  assert.equal(sealWords(rows[1].note), 2);
  assert.equal(sealBand("a".repeat(40)), "roll");
  assert.equal(sealDepth("a".repeat(40)), "plain");
  assert.equal(sealDepth("Saint-Jean"), "seam");
  assert.equal(sealDepth("north_wing"), "rail");
  assert.equal(sealState(""), "clear");
  assert.equal(sealState({ email: null }), "clear");
  assert.equal(sealState({ email: "TR", saleStatus: "x" }), "");
  assert.equal(sealState({ city: "TR" }), "");
  assert.equal(sealState(12), "");
  assert.equal(plusSeal("a+b@x.co"), true);
  assert.equal(sealDepth("a+b@x.co"), "rail");
  assert.equal(sealBand("a+b@x.co"), "slip");
  assert.equal(sealBand(rows[5].note), "slip");
  assert.equal(sealDepth(rows[5].note), "figure");
  assert.equal(sealBand(rows[6].note), "slip");
  assert.equal(oddSealCount(rows), 4);
  assert.equal(leadingSeal(rows), "card");
  assert.equal(leadingSealDepth(rows), "plain");
  assert.equal(visibleSealCustomers(rows, "pip", null, "", "all", [], "all").length, 1);
  assert.equal(visibleSealCustomers(rows, null, null, "ann", "all", [], "plus").length, 0);
  assert.deepEqual(readReviewedSeals(["ada", "gone"], ["ada"]), ["ada"]);
  assert.deepEqual(bulkSealReview(["ada"], ["ann"], ["ada", "ann"], true), ["ada", "ann"]);
  assert.equal(toggleSealReview(["ada"], "ada", ["ada", "ann"]).includes("ada"), false);
  const names = sealsCsv(rows);
  assert.equal(names.startsWith("kind,mark,count"), true);
  assert.equal(sealsCsv([]), "kind,mark,count\nshape,odd,0");
  assert.equal(names.includes("amount"), false);
  assert.equal(names.includes(",card,"), true);
  const queue = sealRowsCsv(rows, ["ada"]);
  assert.equal(queue.startsWith("name,band,depth,words,plus,reviewed"), true);
  assert.equal(queue.includes("amount"), false);
  assert.equal(queue.includes(",1"), true);
  assert.equal(activeSeal("gone", ["slip"]), "all");

  const copy = Object.keys(ROUND180_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND180_COPY[locale]).sort(), copy);
  assert.equal(crmv4Text("en", "brgTitle"), "Map bearings");
  assert.equal(crmv4Text("tr", "mlsTitle"), ROUND180_COPY.tr.mlsTitle);
  assert.equal(crmv4Text("de", "brgPilot"), ROUND180_COPY.de.brgPilot);
  assert.equal(crmv4Text("ru", "mlsUnmarked"), ROUND180_COPY.ru.mlsUnmarked);
  assert.equal(crmv4Text("ar", "brgNotice"), ROUND180_COPY.ar.brgNotice);
  assert.notEqual(ROUND180_COPY.tr.brgTitle, ROUND180_COPY.en.brgTitle);
  assert.notEqual(ROUND180_COPY.de.mlsTitle, ROUND180_COPY.en.mlsTitle);
  assert.notEqual(ROUND180_COPY.ru.brgSearch, ROUND180_COPY.en.brgSearch);
  assert.notEqual(ROUND180_COPY.ar.mlsSearch, ROUND180_COPY.en.mlsSearch);
  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-brg/);
  assert.match(css, /\.c4-mls/);
  assert.match(css, /\.c4-control-atlas/);
  assert.match(css, /data-logo/);
  assert.match(css, /#7a5e30/);
  assert.match(css, /#d4bc86/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round180.tsx"), "utf8");
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
  assert.match(viewFile, /email/);
  assert.match(viewFile, /bearingsCsv/);
  assert.match(viewFile, /sealsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=40&meta=0&role=TRADER/);
  assert.match(viewFile, /data-bearings/);
  assert.match(viewFile, /data-seals/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /customers/);
  assert.match(viewFile, /suggestInk/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bear"/);
  assert.match(app, /view === "mlsl"/);
  const control = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Control.tsx"), "utf8");
  assert.match(control, /c4-control-atlas/);
  assert.match(control, /data-logo="mono"/);
  console.log("crmv4 round180 tests passed");
}

main();
