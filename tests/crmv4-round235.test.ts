/**
 * Visit cards and stage marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round235.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND235_COPY } from "../src/lib/crmv4/copy-round235";
import {
  activeCall,
  activePace,
  activeRank,
  activeSlot,
  activeTimber,
  addVisit,
  addVisitTag,
  addVisitView,
  adjacentVisitCount,
  callOf,
  coolingVisit,
  cyclePace,
  fairVisitHost,
  houseTimber,
  joinedMark,
  lateVisit,
  leadingMark,
  markLane,
  markRowsCsv,
  markSigil,
  markState,
  markStep,
  markTone,
  marksCsv,
  moveVisitFocus,
  peakSlot,
  quietSlot,
  rankOf,
  readVisitViews,
  setVisitRank,
  setVisitSeal,
  sharedMarkCount,
  slotBand,
  slotGap,
  slotOf,
  snoozeVisit,
  suggestCall,
  suggestTimber,
  timberOf,
  visitsCsv,
  wideMark,
} from "../src/lib/crmv4/round235";

function main() {
  assert.equal(timberOf("  oak "), "OAK");
  assert.equal(timberOf("ash"), "ASH");
  assert.equal(timberOf("walnut"), "WALNUT");
  assert.equal(timberOf("slate"), "");
  assert.equal(slotOf("2"), 2);
  assert.equal(slotOf(8), 8);
  assert.equal(slotOf("0"), null);
  assert.equal(slotOf("9"), null);
  assert.equal(callOf("4"), 4);
  assert.equal(callOf(12), 12);
  assert.equal(callOf("36"), 36);
  assert.equal(callOf("6"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("7"), 7);
  assert.equal(rankOf("2"), null);
  assert.equal(peakSlot(3), true);
  assert.equal(peakSlot(7), true);
  assert.equal(peakSlot(1), false);
  assert.equal(quietSlot(6), true);
  assert.equal(quietSlot(4), false);
  assert.equal(slotBand(2), "early");
  assert.equal(slotBand(5), "mid");
  assert.equal(slotBand(8), "late");
  assert.equal(slotBand("0"), "blank");
  assert.equal(slotGap(1, 5), 4);
  assert.equal(slotGap(5, 1), -4);
  assert.equal(slotGap(null, 5), null);
  assert.equal(houseTimber("oak"), true);
  assert.equal(houseTimber("WALNUT"), true);
  assert.equal(houseTimber("ash"), false);
  assert.equal(activeSlot("peak"), "peak");
  assert.equal(activeSlot("8"), "8");
  assert.equal(activeSlot("9"), "all");
  assert.equal(activeCall("36"), "36");
  assert.equal(activeCall("6"), "all");
  assert.equal(activePace("stride", ["hush", "stride", "rush"]), "stride");
  assert.equal(activePace("walk", ["hush", "stride", "rush"]), "all");
  assert.equal(activeRank("4"), "4");
  assert.equal(activeRank("2"), "all");
  assert.equal(activeTimber("ash", ["ASH"]), "ASH");
  assert.equal(moveVisitFocus(0, 3, 1), 1);
  assert.equal(moveVisitFocus(0, 3, -1), 2);
  assert.equal(suggestTimber([]), "WALNUT");
  assert.equal(suggestCall([]), 12);
  assert.equal(fairVisitHost([], "Ada, Bea"), "Ada");

  const first = addVisit([], {
    id: "a",
    title: "  North visit ",
    note: "quiet",
    host: "Ada",
    slot: "2",
    timber: "ash",
    pace: "hush",
    call: "4",
    tags: "a b c d q",
    rank: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North visit");
  assert.equal(first[0].timber, "ASH");
  assert.equal(first[0].slot, 2);
  assert.equal(first[0].call, 4);
  assert.deepEqual(first[0].tags, ["a", "b", "c", "d"]);
  assert.equal(first[0].rank, 4);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addVisit(first, { id: "b", title: "   " }).length, 1);
  const raised = setVisitRank(first, "a", "7");
  assert.equal(raised[0].rank, 7);
  assert.equal(raised[0].audit, "rank");
  const sealed = setVisitSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeVisit(first, "a");
  assert.equal(snoozed[0].call, 36);
  const paced = cyclePace(first, "a");
  assert.equal(paced[0].pace, "stride");
  const tagged = addVisitTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c", "d"]);
  const views = addVisitView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    host: "all",
    timber: "all",
    pace: "all",
    slot: "peak",
    call: "all",
    rank: "all",
  });
  assert.equal(readVisitViews(views).length, 1);
  const late = addVisit(addVisit([], { id: "a", title: "Late slot", slot: "1", rank: "1" }), { id: "b", title: "Near slot", slot: "4", rank: "1" });
  assert.equal(lateVisit(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateVisit(late.find((card) => card.id === "b")!, 5), false);
  const cooling = addVisit([], { id: "c", title: "Cooling slot", slot: "6", pace: "rush", rank: "1" });
  assert.equal(coolingVisit(cooling[0]), true);
  assert.equal(coolingVisit({ ...cooling[0], pace: "stride" }), false);
  assert.equal(coolingVisit({ ...cooling[0], slot: 5 }), false);
  const far = addVisit(addVisit([], { id: "n1", title: "Far slot", slot: "1", rank: "1" }), { id: "n2", title: "Third slot", slot: "3", rank: "1" });
  assert.equal(adjacentVisitCount(far), 2);
  const close = addVisit(addVisit([], { id: "n3", title: "Near slot two", slot: "1", rank: "1" }), { id: "n4", title: "Fourth slot", slot: "4", rank: "1" });
  assert.equal(adjacentVisitCount(close), 0);

  assert.equal(markState("hello"), "set");
  assert.equal(markState({ name: "  " }), "clear");
  assert.equal(markState({ name: "Ada", stage: "INTERESTED", source: "spring", deposits: 4 }), "");
  assert.equal(markSigil({ name: "North desk" }), "ND");
  assert.equal(markSigil({ name: "One two three" }), "OT");
  assert.equal(markLane({ name: "Desk 4", stage: "CALLBACK" }), "glyph");
  assert.equal(markLane({ name: "Ada Lane", stage: "INTERESTED" }), "fresh");
  assert.equal(markLane({ name: "Ada Lane", stage: "RETENTION" }), "kept");
  assert.equal(markLane({ name: "Ada Lane", stage: "CALLBACK" }), "return");
  assert.equal(markLane({ name: "Ada Lane", stage: "LOST" }), "closed");
  assert.equal(markLane({ name: "Ada Lane", stage: "" }), "hall");
  assert.equal(markTone({ name: "Ada", stage: "INTERESTED" }), "gilt");
  assert.equal(markTone({ name: "Ada", stage: "CALLBACK", source: "" }), "haze");
  assert.equal(markTone({ name: "Ada", stage: "LOST" }), "ash");
  assert.equal(markTone({ name: "Ada", stage: "", source: "springtime" }), "linen");
  assert.equal(markTone({ name: "Ada", stage: "", source: "spring" }), "pale");
  assert.equal(joinedMark({ name: "North+desk" }), true);
  assert.equal(joinedMark({ name: "North&desk" }), false);
  assert.equal(wideMark({ name: "Ada" }), false);
  assert.equal(wideMark({ name: "North desk" }), false);
  assert.equal(wideMark({ name: "Longmailboxname" }), true);
  assert.equal(markStep(""), 0);
  assert.equal(markStep("Ada"), 1);
  assert.equal(markStep("North desk"), 2);
  assert.equal(markStep("One two three"), 3);
  const book = [
    { id: "1", label: "North desk", note: { name: "North desk", stage: "", source: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", stage: "INTERESTED", source: "spring" } },
    { id: "3", label: "Desk 4", note: { name: "Desk 4", stage: "CALLBACK", source: "" } },
  ];
  assert.equal(leadingMark(book), "hall");
  assert.equal(sharedMarkCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North door", note: { name: "North door", stage: "" } },
  ];
  assert.equal(sharedMarkCount(paired), 2);
  assert.match(marksCsv(book), /hall,1/);
  assert.match(markRowsCsv(book, ["2"]), /Ada Lane,AL,fresh,gilt,2,0,0,0,1,0,0,0,0,1/);
  assert.match(visitsCsv(first, 3), /North visit,Ada,2,ASH,hush,4,4,a b c d,0,0,0,0,1,0,0,0,0,0,0,quiet,save/);

  const keys = Object.keys(ROUND235_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND235_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND235_COPY[locale][key as keyof typeof ROUND235_COPY.en], "string");
      assert.ok(ROUND235_COPY[locale][key as keyof typeof ROUND235_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "vcdTitle"), ROUND235_COPY.tr.vcdTitle);
  assert.equal(crmv4Text("de", "smkTitle"), ROUND235_COPY.de.smkTitle);
  assert.equal(crmv4Text("ru", "vcdSub"), ROUND235_COPY.ru.vcdSub);
  assert.equal(crmv4Text("ar", "smkSub"), ROUND235_COPY.ar.smkSub);
  assert.equal(crmv4Text("en", "vcdLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-vcd/);
  assert.match(css, /\.c4-smk-index/);
  assert.match(css, /\.c4-lead-chapter/);
  assert.match(css, /\.c4-lead-chapter-mast/);
  assert.match(css, /\.c4-lead-chapter-empty/);
  assert.match(css, /\.c4-lead-chapter-search/);
  assert.match(css, /\.c4-health-chapter/);
  assert.match(css, /\.c4-health-chapter-empty/);
  assert.match(css, /\.c4-health-chapter-search/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round235.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /name/);
  assert.match(viewFile, /saleStatus/);
  assert.match(viewFile, /campaign/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /visitsCsv/);
  assert.match(viewFile, /marksCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-visits/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-keyed/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTimber/);
  assert.match(viewFile, /c4-smk-search/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "vcd"/);
  assert.match(app, /view === "smk"/);
  assert.match(app, /VisitCards/);
  assert.match(app, /StageMarks/);
  const leads = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round56.tsx"), "utf8");
  assert.match(leads, /c4-lead-chapter/);
  assert.match(leads, /c4-lead-chapter-mast/);
  assert.match(leads, /c4-lead-chapter-empty/);
  assert.match(leads, /c4-lead-chapter-search/);
  assert.match(leads, /data-desk="chapter"/);
  assert.match(leads, /data-logo="mono"/);
  assert.match(leads, /vcd/);
  assert.match(leads, /smk/);
  const health = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round60.tsx"), "utf8");
  assert.match(health, /c4-health-chapter/);
  assert.match(health, /c4-health-chapter-mast/);
  assert.match(health, /c4-health-chapter-empty/);
  assert.match(health, /c4-health-chapter-search/);
  assert.match(health, /data-desk="chapter"/);
  assert.match(health, /data-logo="mono"/);
  assert.match(health, /vcd/);
  assert.match(health, /smk/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND235_COPY.en, key);
  const audit = viewFile.match(/"(vcdAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND235_COPY.en, key);
  console.log("crmv4 round235 tests passed");
}

main();
