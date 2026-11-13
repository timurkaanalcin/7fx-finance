/**
 * Hourglass slips and syllable plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round243.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND243_COPY } from "../src/lib/crmv4/copy-round243";
import {
  activeGlass,
  activeGrain,
  activeMass,
  activeRoom,
  activeSpan,
  addHourSlip,
  addHourTag,
  addHourView,
  coolingSlip,
  cycleGrain,
  fairSteward,
  glassOf,
  grainOf,
  hourCsv,
  hourTimeline,
  houseGlass,
  lateSlip,
  leadingSyllable,
  lengthenSpan,
  massOf,
  moveHourFocus,
  neighborSlipCount,
  peakRoom,
  plateRowsCsv,
  platesCsv,
  quietRoom,
  readHourViews,
  roomBand,
  roomGap,
  roomOf,
  setHourMass,
  setHourWax,
  sharedSyllableCount,
  shortenSpan,
  spanOf,
  suggestGlass,
  suggestSpan,
  syllableBound,
  syllableHue,
  syllableJoin,
  syllableLane,
  syllableNotch,
  syllableStamp,
  syllableState,
  syllableStep,
  syllableWide,
} from "../src/lib/crmv4/round243";

function main() {
  assert.equal(roomOf(" Library "), "library");
  assert.equal(roomOf("paris"), "");
  assert.equal(spanOf("10"), 10);
  assert.equal(spanOf(20), 20);
  assert.equal(spanOf("40"), 40);
  assert.equal(spanOf("12"), null);
  assert.equal(massOf("2"), 2);
  assert.equal(massOf(4), 4);
  assert.equal(massOf("8"), 8);
  assert.equal(massOf("3"), null);
  assert.equal(glassOf("clear"), "CLEAR");
  assert.equal(glassOf("smoked"), "SMOKED");
  assert.equal(glassOf("gilt"), "GILT");
  assert.equal(glassOf("silk"), "");
  assert.equal(grainOf("fine"), "fine");
  assert.equal(grainOf("even"), "even");
  assert.equal(grainOf("coarse"), "coarse");
  assert.equal(grainOf("hush"), "");
  assert.equal(peakRoom("atrium"), true);
  assert.equal(peakRoom("LIBRARY"), true);
  assert.equal(peakRoom("cellar"), false);
  assert.equal(quietRoom("cellar"), true);
  assert.equal(quietRoom("atrium"), false);
  assert.equal(roomBand("atrium"), "north");
  assert.equal(roomBand("studio"), "mid");
  assert.equal(roomBand("porch"), "south");
  assert.equal(roomBand(""), "");
  assert.equal(roomGap("atrium", "library"), 1);
  assert.equal(roomGap("library", "atrium"), -1);
  assert.equal(roomGap("", "library"), null);
  assert.equal(houseGlass("smoked"), true);
  assert.equal(houseGlass("GILT"), true);
  assert.equal(houseGlass("clear"), false);
  assert.equal(activeRoom("peak"), "peak");
  assert.equal(activeRoom("atrium"), "atrium");
  assert.equal(activeRoom("paris"), "all");
  assert.equal(activeSpan("10"), "10");
  assert.equal(activeSpan("12"), "all");
  assert.equal(activeGrain("even", ["fine", "even", "coarse"]), "even");
  assert.equal(activeGrain("hush", ["fine", "even", "coarse"]), "all");
  assert.equal(activeMass("4"), "4");
  assert.equal(activeMass("3"), "all");
  assert.equal(activeGlass("clear"), "clear");
  assert.equal(activeGlass("silk"), "all");
  assert.equal(moveHourFocus(0, 3, 1), 1);
  assert.equal(moveHourFocus(0, 3, -1), 2);
  assert.equal(suggestGlass([]), "CLEAR");
  assert.equal(suggestSpan([], 4), 10);
  assert.equal(suggestSpan([], 12), 20);
  assert.equal(suggestSpan([], 18), 40);
  assert.equal(fairSteward([], "Ada, Bea"), "Ada");

  const first = addHourSlip([], {
    id: "a",
    title: "  North cover ",
    note: "quiet",
    steward: "Ada",
    room: "library",
    glass: "clear",
    grain: "fine",
    span: "10",
    tags: "x y z w",
    mass: "4",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North cover");
  assert.equal(first[0].glass, "CLEAR");
  assert.equal(first[0].room, "library");
  assert.equal(first[0].span, 10);
  assert.equal(first[0].mass, 4);
  assert.deepEqual(first[0].tags, ["x", "y", "z"]);
  assert.equal(first[0].wax, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addHourSlip(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addHourSlip(first, { id: "b", title: "North cover" }).length, 1);
  const raised = setHourMass(first, "a", "8");
  assert.equal(raised[0].mass, 8);
  assert.equal(raised[0].audit, "mass");
  const waxed = setHourWax(first, "a", true);
  assert.equal(waxed[0].wax, true);
  assert.equal(waxed[0].audit, "wax");
  const longer = lengthenSpan(first, "a");
  assert.equal(longer[0].span, 20);
  assert.equal(lengthenSpan(longer, "a")[0].span, 40);
  assert.equal(lengthenSpan(lengthenSpan(longer, "a"), "a")[0].span, 40);
  const shorter = shortenSpan(lengthenSpan(longer, "a"), "a");
  assert.equal(shorter[0].span, 20);
  assert.equal(shortenSpan(first, "a")[0].span, 10);
  const paced = cycleGrain(first, "a");
  assert.equal(paced[0].grain, "even");
  const tagged = addHourTag(first, "a", "x");
  assert.deepEqual(tagged[0].tags, ["x", "y", "z"]);
  const views = addHourView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    steward: "all",
    glass: "all",
    grain: "all",
    room: "peak",
    span: "all",
    mass: "all",
  });
  assert.equal(readHourViews(views).length, 1);
  const late = addHourSlip(addHourSlip([], { id: "a", title: "Early room", room: "atrium", mass: "2" }), { id: "b", title: "Later room", room: "studio", mass: "2" });
  assert.equal(lateSlip(late.find((slip) => slip.id === "a")!, "library"), true);
  assert.equal(lateSlip(late.find((slip) => slip.id === "b")!, "library"), false);
  const cooling = addHourSlip([], { id: "c", title: "Cooling room", room: "cellar", grain: "coarse", mass: "2" });
  assert.equal(coolingSlip(cooling[0]), true);
  assert.equal(coolingSlip({ ...cooling[0], grain: "even" }), false);
  assert.equal(coolingSlip({ ...cooling[0], room: "atrium" }), false);
  assert.equal(coolingSlip({ ...cooling[0], mass: 4 }), false);
  const far = addHourSlip(addHourSlip([], { id: "n1", title: "Far room", room: "atrium", mass: "2" }), { id: "n2", title: "Next room", room: "library", mass: "2" });
  assert.equal(neighborSlipCount(far), 2);
  const close = addHourSlip(addHourSlip([], { id: "n3", title: "Near room", room: "atrium", mass: "2" }), { id: "n4", title: "Skip room", room: "studio", mass: "2" });
  assert.equal(neighborSlipCount(close), 0);
  assert.equal(hourTimeline(far).map((lane) => lane.room).join(","), "atrium,library");
  assert.match(hourCsv(first, "studio"), /North cover,Ada,library,CLEAR,fine,10,4,x y z,0,0,0,0,1,1,0,1,0,0,north,0,0,save,quiet/);

  assert.equal(syllableState("hello"), "set");
  assert.equal(syllableState({ name: "  " }), "clear");
  assert.equal(syllableState({ name: "Ada", ink: "ACTIVE", stand: "North", deposits: 4 }), "");
  assert.equal(syllableStamp({ name: "Ada Lane" }), "E4");
  assert.equal(syllableStamp({ name: "North desk" }), "K2");
  assert.equal(syllableStamp({ name: "Ada" }), "A2");
  assert.equal(syllableLane({ name: "Ada Lane" }), "crowd");
  assert.equal(syllableLane({ name: "North desk" }), "dual");
  assert.equal(syllableLane({ name: "Rhythm" }), "hush");
  assert.equal(syllableLane({ name: "North/desk" }), "split");
  assert.equal(syllableLane({ name: "Ada's" }), "dual");
  assert.equal(syllableLane({ name: "A" }), "mono");
  assert.equal(syllableHue({ name: "Ada", stand: "" }), "mist");
  assert.equal(syllableHue({ name: "Ada", stand: "!" }), "pearl");
  assert.equal(syllableHue({ name: "Ada", stand: "North" }), "clay");
  assert.equal(syllableHue({ name: "Ada", stand: "Alpha" }), "slate");
  assert.equal(syllableHue({ name: "Ada", stand: "Echo" }), "pearl");
  assert.equal(syllableHue({ name: "Ada", stand: "Ivy" }), "soot");
  assert.equal(syllableHue({ name: "Ada", stand: "Quest" }), "soot");
  assert.equal(syllableHue({ name: "Ada", stand: "4th" }), "clay");
  assert.equal(syllableHue({ name: "Ada", stand: "?" }), "mist");
  assert.equal(syllableBound({ name: "Ada", ink: "ACTIVE" }), true);
  assert.equal(syllableBound({ name: "Ada", ink: "HOLD" }), false);
  assert.equal(syllableBound({ name: "Ada", ink: "" }), false);
  assert.equal(syllableWide({ name: "Supercalifragilistic" }), true);
  assert.equal(syllableWide({ name: "One Two Three Four" }), false);
  assert.equal(syllableNotch({ name: "Mr. Ada" }), true);
  assert.equal(syllableNotch({ name: "Desk 4" }), false);
  assert.equal(syllableJoin({ name: "North/desk" }), true);
  assert.equal(syllableJoin({ name: "North&desk" }), false);
  assert.equal(syllableStep(""), 0);
  assert.equal(syllableStep("A"), 0);
  assert.equal(syllableStep("One two three"), 5);
  const book = [
    { id: "1", label: "Ada Lane", note: { name: "Ada Lane", ink: "ACTIVE", stand: "North" } },
    { id: "2", label: "North desk", note: { name: "North desk", ink: "HOLD", stand: "" } },
  ];
  assert.equal(leadingSyllable(book), "dual");
  assert.equal(sharedSyllableCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "Ada Lane two", note: { name: "Ada Lane", ink: "" } },
  ];
  assert.equal(sharedSyllableCount(paired), 2);
  assert.match(platesCsv(book), /dual,1/);
  assert.match(plateRowsCsv(book, ["1"]), /Ada Lane,E4,crowd,clay,3,0,0,0,1,0,0,0,0,1,0,1/);

  const keys = Object.keys(ROUND243_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND243_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND243_COPY[locale][key as keyof typeof ROUND243_COPY.en], "string");
      assert.ok(ROUND243_COPY[locale][key as keyof typeof ROUND243_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "hglTitle"), ROUND243_COPY.tr.hglTitle);
  assert.equal(crmv4Text("de", "sylTitle"), ROUND243_COPY.de.sylTitle);
  assert.equal(crmv4Text("ru", "hglSub"), ROUND243_COPY.ru.hglSub);
  assert.equal(crmv4Text("ar", "sylSub"), ROUND243_COPY.ar.sylSub);
  assert.equal(crmv4Text("en", "hglLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hgl/);
  assert.match(css, /\.c4-syl-index/);
  assert.match(css, /\.c4-snip-salon/);
  assert.match(css, /\.c4-snip-mast/);
  assert.match(css, /\.c4-snip-legend/);
  assert.match(css, /\.c4-week-salon/);
  assert.match(css, /\.c4-week-mast/);
  assert.match(css, /\.c4-week-legend/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round243.tsx"), "utf8");
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
  assert.match(viewFile, /hourCsv/);
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
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-slips/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestGlass/);
  assert.match(viewFile, /c4-syl-search/);
  assert.match(viewFile, /hourTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hgl"/);
  assert.match(app, /view === "syl"/);
  assert.match(app, /HourglassSlips/);
  assert.match(app, /SyllablePlates/);
  const snippets = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round71.tsx"), "utf8");
  assert.match(snippets, /c4-snip-salon/);
  assert.match(snippets, /c4-snip-mast/);
  assert.match(snippets, /c4-snip-legend/);
  assert.match(snippets, /data-logo="mono"/);
  assert.match(snippets, /data-snip-salon/);
  assert.match(snippets, /data-snip-pad/);
  const week = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round73.tsx"), "utf8");
  assert.match(week, /c4-week-salon/);
  assert.match(week, /c4-week-mast/);
  assert.match(week, /c4-week-legend/);
  assert.match(week, /data-logo="mono"/);
  assert.match(week, /data-week-salon/);
  assert.match(week, /data-week-strip/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND243_COPY.en, key);
  const audit = viewFile.match(/"(hglAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND243_COPY.en, key);
  console.log("crmv4 round243 tests passed");
}

main();
