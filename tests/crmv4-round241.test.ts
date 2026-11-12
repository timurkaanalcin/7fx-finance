/**
 * Call sheets and press plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round241.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND241_COPY } from "../src/lib/crmv4/copy-round241";
import {
  activeBay,
  activeMinute,
  activePace,
  activeRank,
  activeTone,
  addCall,
  addCallTag,
  addCallView,
  bayBand,
  bayGap,
  bayOf,
  bindPlateCount,
  callTimeline,
  callsCsv,
  coolingCall,
  cyclePace,
  fairAgent,
  houseTone,
  joinedPlate,
  lateCall,
  leadingPlate,
  minuteOf,
  moveCallFocus,
  neighborCallCount,
  notchPlateCount,
  peakBay,
  plateLane,
  plateMark,
  plateRowsCsv,
  plateState,
  plateStep,
  plateTone,
  platesCsv,
  quietBay,
  rankOf,
  readCallViews,
  setCallRank,
  setCallSeal,
  sharedPlateCount,
  snoozeCall,
  suggestMinutes,
  suggestTone,
  toneOf,
  widePlate,
} from "../src/lib/crmv4/round241";

function main() {
  assert.equal(toneOf("  linen "), "LINEN");
  assert.equal(toneOf("gilt"), "GILT");
  assert.equal(toneOf("soot"), "SOOT");
  assert.equal(toneOf("silk"), "");
  assert.equal(bayOf("2"), 2);
  assert.equal(bayOf(6), 6);
  assert.equal(bayOf("0"), null);
  assert.equal(bayOf("7"), null);
  assert.equal(minuteOf("5"), 5);
  assert.equal(minuteOf(10), 10);
  assert.equal(minuteOf("20"), 20);
  assert.equal(minuteOf("12"), null);
  assert.equal(rankOf("1"), 1);
  assert.equal(rankOf(4), 4);
  assert.equal(rankOf("7"), 7);
  assert.equal(rankOf("2"), null);
  assert.equal(peakBay(2), true);
  assert.equal(peakBay(5), true);
  assert.equal(peakBay(6), false);
  assert.equal(quietBay(6), true);
  assert.equal(quietBay(2), false);
  assert.equal(bayBand(1), "early");
  assert.equal(bayBand(2), "mid");
  assert.equal(bayBand(3), "mid");
  assert.equal(bayBand(4), "late");
  assert.equal(bayBand(6), "late");
  assert.equal(bayGap(1, 5), 4);
  assert.equal(bayGap(5, 1), -4);
  assert.equal(bayGap(null, 4), null);
  assert.equal(houseTone("gilt"), true);
  assert.equal(houseTone("SOOT"), true);
  assert.equal(houseTone("linen"), false);
  assert.equal(activeBay("peak"), "peak");
  assert.equal(activeBay("6"), "6");
  assert.equal(activeBay("8"), "all");
  assert.equal(activeMinute("20"), "20");
  assert.equal(activeMinute("12"), "all");
  assert.equal(activePace("even", ["hush", "even", "keen"]), "even");
  assert.equal(activePace("hush", ["hush", "even", "keen"]), "hush");
  assert.equal(activeRank("4"), "4");
  assert.equal(activeRank("2"), "all");
  assert.equal(activeTone("linen"), "linen");
  assert.equal(activeTone("silk"), "all");
  assert.equal(moveCallFocus(0, 3, 1), 1);
  assert.equal(moveCallFocus(0, 3, -1), 2);
  assert.equal(suggestTone([]), "LINEN");
  assert.equal(suggestMinutes([], 4), 10);
  assert.equal(fairAgent([], "Ada, Bea"), "Ada");

  const first = addCall([], {
    id: "a",
    title: "  North bay ",
    note: "quiet",
    agent: "Ada",
    bay: "2",
    tone: "linen",
    pace: "hush",
    span: "5",
    tags: "a b c d",
    rank: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North bay");
  assert.equal(first[0].tone, "LINEN");
  assert.equal(first[0].bay, 2);
  assert.equal(first[0].span, 5);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].rank, 4);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addCall(first, { id: "b", title: "   " }).length, 1);
  const raised = setCallRank(first, "a", "7");
  assert.equal(raised[0].rank, 7);
  assert.equal(raised[0].audit, "rank");
  const sealed = setCallSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeCall(first, "a");
  assert.equal(snoozed[0].span, 10);
  assert.equal(snoozeCall(snoozed, "a")[0].span, 20);
  assert.equal(snoozeCall(snoozeCall(snoozed, "a"), "a")[0].span, 20);
  const paced = cyclePace(first, "a");
  assert.equal(paced[0].pace, "even");
  const tagged = addCallTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const views = addCallView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    agent: "all",
    tone: "all",
    pace: "all",
    bay: "peak",
    span: "all",
    rank: "all",
  });
  assert.equal(readCallViews(views).length, 1);
  const late = addCall(addCall([], { id: "a", title: "Late bay", bay: "1", rank: "1" }), { id: "b", title: "Near bay", bay: "4", rank: "1" });
  assert.equal(lateCall(late.find((card) => card.id === "a")!, 5), true);
  assert.equal(lateCall(late.find((card) => card.id === "b")!, 5), false);
  const cooling = addCall([], { id: "c", title: "Cooling bay", bay: "6", pace: "keen", rank: "1" });
  assert.equal(coolingCall(cooling[0]), true);
  assert.equal(coolingCall({ ...cooling[0], pace: "even" }), false);
  assert.equal(coolingCall({ ...cooling[0], bay: 2 }), false);
  const far = addCall(addCall([], { id: "n1", title: "Far bay", bay: "1", rank: "1" }), { id: "n2", title: "Next bay", bay: "2", rank: "1" });
  assert.equal(neighborCallCount(far), 2);
  const close = addCall(addCall([], { id: "n3", title: "Near bay two", bay: "1", rank: "1" }), { id: "n4", title: "Fourth bay", bay: "3", rank: "1" });
  assert.equal(neighborCallCount(close), 0);
  assert.equal(callTimeline(far).map((lane) => lane.bay).join(","), "1,2");
  assert.match(callsCsv(first, 4), /North bay,Ada,2,LINEN,hush,5,4,a b c,0,0,0,0,2,0,0,0,1,0,0,mid,save,quiet/);

  assert.equal(plateState("hello"), "set");
  assert.equal(plateState({ name: "  " }), "clear");
  assert.equal(plateState({ name: "Ada", ink: "ACTIVE", press: "North", deposits: 4 }), "");
  assert.equal(plateMark({ name: "North desk" }), "HD");
  assert.equal(plateMark({ name: "One two three" }), "ET");
  assert.equal(plateMark({ name: "Ada" }), "AA");
  assert.equal(plateLane({ name: "Desk 4", ink: "ACTIVE" }), "kept");
  assert.equal(plateLane({ name: "Ada Lane", ink: "" }), "folio");
  assert.equal(plateLane({ name: "Ada Lane", ink: "NEW" }), "fresh");
  assert.equal(plateLane({ name: "Ada Lane", ink: "ACTIVE" }), "kept");
  assert.equal(plateLane({ name: "Ada Lane", ink: "COLD" }), "still");
  assert.equal(plateLane({ name: "Ada Lane", ink: "LOST" }), "gone");
  assert.equal(plateLane({ name: "Ada Lane", ink: "OTHER" }), "plain");
  assert.equal(plateLane({ name: "Ada-Lane", ink: "ACTIVE" }), "bind");
  assert.equal(plateTone({ name: "Ada", press: "" }), "mist");
  assert.equal(plateTone({ name: "Ada", press: "NA" }), "clay");
  assert.equal(plateTone({ name: "Ada", press: "?" }), "clay");
  assert.equal(plateTone({ name: "Ada", press: "Alpha" }), "gilt");
  assert.equal(plateTone({ name: "Ada", press: "North" }), "linen");
  assert.equal(plateTone({ name: "Ada", press: "4th" }), "ivory");
  assert.equal(plateTone({ name: "Ada", press: "Desk4" }), "sand");
  assert.equal(joinedPlate({ name: "North&desk" }), true);
  assert.equal(joinedPlate({ name: "North+desk" }), false);
  assert.equal(widePlate({ name: "Ada Lane" }), false);
  assert.equal(widePlate({ name: "North window desks" }), true);
  assert.equal(plateStep(""), 0);
  assert.equal(plateStep("Ada"), 1);
  assert.equal(plateStep("North desk"), 2);
  assert.equal(plateStep("One two three"), 3);
  const book = [
    { id: "1", label: "North window desks", note: { name: "North window desks", ink: "", press: "" } },
    { id: "2", label: "Ada Lane", note: { name: "Ada Lane", ink: "ACTIVE", press: "North" } },
    { id: "3", label: "Desk four", note: { name: "Desk 4", ink: "PENDING", press: "" } },
  ];
  assert.equal(leadingPlate(book), "kept");
  assert.equal(sharedPlateCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "North wind desks", note: { name: "North wind desks", ink: "" } },
  ];
  assert.equal(sharedPlateCount(paired), 2);
  assert.equal(notchPlateCount(book), 1);
  assert.equal(bindPlateCount(book), 0);
  assert.match(platesCsv(book), /kept,1/);
  assert.match(plateRowsCsv(book, ["2"]), /Ada Lane,AL,kept,linen,2,0,0,0,0,0,0,1,0,0,0,1/);

  const keys = Object.keys(ROUND241_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND241_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND241_COPY[locale][key as keyof typeof ROUND241_COPY.en], "string");
      assert.ok(ROUND241_COPY[locale][key as keyof typeof ROUND241_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "cshTitle"), ROUND241_COPY.tr.cshTitle);
  assert.equal(crmv4Text("de", "pplTitle"), ROUND241_COPY.de.pplTitle);
  assert.equal(crmv4Text("ru", "cshSub"), ROUND241_COPY.ru.cshSub);
  assert.equal(crmv4Text("ar", "pplSub"), ROUND241_COPY.ar.pplSub);
  assert.equal(crmv4Text("en", "cshLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-csh/);
  assert.match(css, /\.c4-ppl-index/);
  assert.match(css, /\.c4-blotter-salon/);
  assert.match(css, /\.c4-blotter-mast/);
  assert.match(css, /\.c4-blotter-legend/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round241.tsx"), "utf8");
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
  assert.match(viewFile, /callsCsv/);
  assert.match(viewFile, /platesCsv/);
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
  assert.match(viewFile, /data-sheets/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestTone/);
  assert.match(viewFile, /c4-ppl-search/);
  assert.match(viewFile, /callTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "csh"/);
  assert.match(app, /view === "ppl"/);
  assert.match(app, /CallSheets/);
  assert.match(app, /PressPlates/);
  const blotter = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round53.tsx"), "utf8");
  assert.match(blotter, /c4-blotter-salon/);
  assert.match(blotter, /c4-blotter-mast/);
  assert.match(blotter, /c4-blotter-legend/);
  assert.match(blotter, /data-logo="mono"/);
  assert.match(blotter, /data-blotter-salon/);
  assert.match(blotter, /data-blotter/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND241_COPY.en, key);
  const audit = viewFile.match(/"(cshAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND241_COPY.en, key);
  console.log("crmv4 round241 tests passed");
}

main();
