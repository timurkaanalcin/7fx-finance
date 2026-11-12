/**
 * Terrace cards and colophon marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round240.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND240_COPY } from "../src/lib/crmv4/copy-round240";
import {
  activeGrade,
  activePace,
  activeRank,
  activeSeat,
  activeSpan,
  addTerrace,
  addTerraceTag,
  addTerraceView,
  cipherColophonCount,
  colophonLane,
  colophonMark,
  colophonRowsCsv,
  colophonState,
  colophonStep,
  colophonTone,
  colophonsCsv,
  coolingTerrace,
  cyclePace,
  fairHost,
  gradeOf,
  houseGrade,
  joinedColophon,
  lateTerrace,
  leadingColophon,
  moveTerraceFocus,
  neighborTerraceCount,
  peakSeat,
  quietSeat,
  rankOf,
  readTerraceViews,
  seatBand,
  seatGap,
  seatOf,
  setTerraceRank,
  setTerraceSeal,
  sharedColophonCount,
  snoozeTerrace,
  spanOf,
  suggestGrade,
  suggestSpan,
  terraceTimeline,
  terracesCsv,
  wideColophon,
} from "../src/lib/crmv4/round240";

function main() {
  assert.equal(gradeOf("  ivory "), "IVORY");
  assert.equal(gradeOf("champagne"), "CHAMPAGNE");
  assert.equal(gradeOf("graphite"), "GRAPHITE");
  assert.equal(gradeOf("silk"), "");
  assert.equal(seatOf("2"), 2);
  assert.equal(seatOf(8), 8);
  assert.equal(seatOf("0"), null);
  assert.equal(seatOf("9"), null);
  assert.equal(spanOf("3"), 3);
  assert.equal(spanOf(9), 9);
  assert.equal(spanOf("15"), 15);
  assert.equal(spanOf("12"), null);
  assert.equal(rankOf("2"), 2);
  assert.equal(rankOf(5), 5);
  assert.equal(rankOf("8"), 8);
  assert.equal(rankOf("4"), null);
  assert.equal(peakSeat(3), true);
  assert.equal(peakSeat(7), true);
  assert.equal(peakSeat(8), false);
  assert.equal(quietSeat(1), true);
  assert.equal(quietSeat(3), false);
  assert.equal(seatBand(2), "early");
  assert.equal(seatBand(3), "mid");
  assert.equal(seatBand(5), "mid");
  assert.equal(seatBand(6), "late");
  assert.equal(seatBand(8), "late");
  assert.equal(seatGap(1, 5), 4);
  assert.equal(seatGap(5, 1), -4);
  assert.equal(seatGap(null, 4), null);
  assert.equal(houseGrade("champagne"), true);
  assert.equal(houseGrade("GRAPHITE"), true);
  assert.equal(houseGrade("ivory"), false);
  assert.equal(activeSeat("peak"), "peak");
  assert.equal(activeSeat("8"), "8");
  assert.equal(activeSeat("9"), "all");
  assert.equal(activeSpan("15"), "15");
  assert.equal(activeSpan("12"), "all");
  assert.equal(activePace("stroll", ["linger", "stroll", "brisk"]), "stroll");
  assert.equal(activePace("linger", ["linger", "stroll", "brisk"]), "linger");
  assert.equal(activeRank("5"), "5");
  assert.equal(activeRank("4"), "all");
  assert.equal(activeGrade("ivory"), "ivory");
  assert.equal(activeGrade("silk"), "all");
  assert.equal(moveTerraceFocus(0, 3, 1), 1);
  assert.equal(moveTerraceFocus(0, 3, -1), 2);
  assert.equal(suggestGrade([]), "IVORY");
  assert.equal(suggestSpan([], 4), 9);
  assert.equal(fairHost([], "Ada, Bea"), "Ada");

  const first = addTerrace([], {
    id: "a",
    title: "  North terrace ",
    note: "quiet",
    host: "Ada",
    seat: "2",
    grade: "ivory",
    pace: "linger",
    span: "3",
    tags: "w x y z q",
    rank: "5",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North terrace");
  assert.equal(first[0].grade, "IVORY");
  assert.equal(first[0].seat, 2);
  assert.equal(first[0].span, 3);
  assert.deepEqual(first[0].tags, ["w", "x", "y", "z"]);
  assert.equal(first[0].rank, 5);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addTerrace(first, { id: "b", title: "   " }).length, 1);
  const raised = setTerraceRank(first, "a", "8");
  assert.equal(raised[0].rank, 8);
  assert.equal(raised[0].audit, "rank");
  const sealed = setTerraceSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeTerrace(first, "a");
  assert.equal(snoozed[0].span, 9);
  assert.equal(snoozeTerrace(snoozed, "a")[0].span, 15);
  assert.equal(snoozeTerrace(snoozeTerrace(snoozed, "a"), "a")[0].span, 15);
  const paced = cyclePace(first, "a");
  assert.equal(paced[0].pace, "stroll");
  const tagged = addTerraceTag(first, "a", "w");
  assert.deepEqual(tagged[0].tags, ["w", "x", "y", "z"]);
  const views = addTerraceView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    host: "all",
    grade: "all",
    pace: "all",
    seat: "peak",
    span: "all",
    rank: "all",
  });
  assert.equal(readTerraceViews(views).length, 1);
  const late = addTerrace(addTerrace([], { id: "a", title: "Late seat", seat: "1", rank: "2" }), { id: "b", title: "Near seat", seat: "4", rank: "2" });
  assert.equal(lateTerrace(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateTerrace(late.find((card) => card.id === "b")!, 5), false);
  const cooling = addTerrace([], { id: "c", title: "Cooling seat", seat: "1", pace: "brisk", rank: "2" });
  assert.equal(coolingTerrace(cooling[0]), true);
  assert.equal(coolingTerrace({ ...cooling[0], pace: "stroll" }), false);
  assert.equal(coolingTerrace({ ...cooling[0], seat: 2 }), false);
  const far = addTerrace(addTerrace([], { id: "n1", title: "Far seat", seat: "1", rank: "2" }), { id: "n2", title: "Third seat", seat: "3", rank: "2" });
  assert.equal(neighborTerraceCount(far), 2);
  const close = addTerrace(addTerrace([], { id: "n3", title: "Near seat two", seat: "1", rank: "2" }), { id: "n4", title: "Fourth seat", seat: "4", rank: "2" });
  assert.equal(neighborTerraceCount(close), 0);
  assert.equal(terraceTimeline(far).map((lane) => lane.seat).join(","), "1,3");
  assert.match(terracesCsv(first, 5), /North terrace,Ada,2,IVORY,linger,3,5,w x y z,0,0,0,0,3,0,0,0,0,0,0,early,save,quiet/);

  assert.equal(colophonState("hello"), "set");
  assert.equal(colophonState({ name: "  " }), "clear");
  assert.equal(colophonState({ name: "Ada", ink: "ACTIVE", press: "North", deposits: 4 }), "");
  assert.equal(colophonMark({ name: "North desk" }), "NK");
  assert.equal(colophonMark({ name: "One two three" }), "OE");
  assert.equal(colophonMark({ name: "Ada" }), "AA");
  assert.equal(colophonLane({ name: "Desk 4", ink: "ACTIVE" }), "cipher");
  assert.equal(colophonLane({ name: "Ada Lane", ink: "" }), "hall");
  assert.equal(colophonLane({ name: "Ada Lane", ink: "NEW" }), "ink");
  assert.equal(colophonLane({ name: "Ada Lane", ink: "ACTIVE" }), "warm");
  assert.equal(colophonLane({ name: "Ada Lane", ink: "COLD" }), "cold");
  assert.equal(colophonLane({ name: "Ada Lane", ink: "LOST" }), "lost");
  assert.equal(colophonLane({ name: "Ada Lane", ink: "OTHER" }), "ink");
  assert.equal(colophonTone({ name: "Ada", press: "" }), "haze");
  assert.equal(colophonTone({ name: "Ada", press: "XX" }), "ash");
  assert.equal(colophonTone({ name: "Ada", press: "Alpha" }), "gilt");
  assert.equal(colophonTone({ name: "Ada", press: "North" }), "linen");
  assert.equal(colophonTone({ name: "Ada", press: "4th" }), "pale");
  assert.equal(joinedColophon({ name: "North+desk" }), true);
  assert.equal(joinedColophon({ name: "North&desk" }), false);
  assert.equal(wideColophon({ name: "Ada Lane" }), false);
  assert.equal(wideColophon({ name: "North window desks" }), true);
  assert.equal(colophonStep(""), 0);
  assert.equal(colophonStep("Ada"), 1);
  assert.equal(colophonStep("North desk"), 2);
  assert.equal(colophonStep("One two three"), 2);
  const book = [
    { id: "1", label: "North window desks", note: { name: "North window desks", ink: "", press: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", ink: "ACTIVE", press: "North" } },
    { id: "3", label: "Desk four", note: { name: "Desk 4", ink: "PENDING", press: "" } },
  ];
  assert.equal(leadingColophon(book), "cipher");
  assert.equal(sharedColophonCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North wind desks", note: { name: "North wind desks", ink: "" } },
  ];
  assert.equal(sharedColophonCount(paired), 2);
  assert.equal(cipherColophonCount(book), 1);
  assert.match(colophonsCsv(book), /cipher,1/);
  assert.match(colophonRowsCsv(book, ["2"]), /Ada Lane,AE,warm,linen,2,0,0,0,0,1,0,0,0,1/);

  const keys = Object.keys(ROUND240_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND240_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND240_COPY[locale][key as keyof typeof ROUND240_COPY.en], "string");
      assert.ok(ROUND240_COPY[locale][key as keyof typeof ROUND240_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "trcTitle"), ROUND240_COPY.tr.trcTitle);
  assert.equal(crmv4Text("de", "clpTitle"), ROUND240_COPY.de.clpTitle);
  assert.equal(crmv4Text("ru", "trcSub"), ROUND240_COPY.ru.trcSub);
  assert.equal(crmv4Text("ar", "clpSub"), ROUND240_COPY.ar.clpSub);
  assert.equal(crmv4Text("en", "trcLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-trc/);
  assert.match(css, /\.c4-clp-index/);
  assert.match(css, /\.c4-case-gallery/);
  assert.match(css, /\.c4-shortcut-gallery/);
  assert.match(css, /\.c4-case-docket/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round240.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionStatus/);
  assert.match(viewFile, /desk/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /terracesCsv/);
  assert.match(viewFile, /colophonsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-terraces/);
  assert.match(viewFile, /data-colophons/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGrade/);
  assert.match(viewFile, /c4-clp-search/);
  assert.match(viewFile, /terraceTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "trc"/);
  assert.match(app, /view === "clp"/);
  assert.match(app, /TerraceCards/);
  assert.match(app, /ColophonMarks/);
  const cases = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round54.tsx"), "utf8");
  assert.match(cases, /c4-case-gallery/);
  assert.match(cases, /c4-case-docket/);
  assert.match(cases, /c4-shortcut-gallery/);
  assert.match(cases, /data-logo="mono"/);
  assert.match(cases, /aria-required=\{false\}/);
  assert.match(cases, /data-case-queue/);
  assert.match(cases, /data-shortcut-rail/);
  const queue = cases.slice(0, cases.indexOf("export function ShortcutRail"));
  assert.match(queue, /sendJson/);
  const rail = cases.slice(cases.indexOf("export function ShortcutRail"));
  assert.equal(rail.includes("sendJson"), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in { ...ROUND240_COPY.en, cqTitle: 1, scTitle: 1 }, key);
  const audit = viewFile.match(/"(trcAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND240_COPY.en, key);
  console.log("crmv4 round240 tests passed");
}

main();
