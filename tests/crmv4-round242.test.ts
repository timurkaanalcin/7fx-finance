/**
 * Dawn books and letter crests.
 * Run: TZ=UTC npx tsx tests/crmv4-round242.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND242_COPY } from "../src/lib/crmv4/copy-round242";
import {
  activeCity,
  activeCloth,
  activeGait,
  activeWeight,
  activeWindow,
  addDawnBook,
  addDawnTag,
  addDawnView,
  cityBand,
  cityGap,
  cityOf,
  clothOf,
  coolingBook,
  crestBound,
  crestJoin,
  crestLane,
  crestMark,
  crestNotch,
  crestRowsCsv,
  crestState,
  crestStep,
  crestTone,
  crestWide,
  crestsCsv,
  cycleGait,
  dawnCsv,
  dawnTimeline,
  fairKeeper,
  gaitOf,
  houseCloth,
  lateBook,
  leadingCrest,
  moveDawnFocus,
  neighborBookCount,
  peakCity,
  quietCity,
  readDawnViews,
  setDawnSeal,
  setDawnWeight,
  sharedCrestCount,
  snoozeWindow,
  suggestCloth,
  suggestWindow,
  weightOf,
  windowOf,
} from "../src/lib/crmv4/round242";

function main() {
  assert.equal(cityOf(" London "), "london");
  assert.equal(cityOf("paris"), "");
  assert.equal(windowOf("15"), 15);
  assert.equal(windowOf(30), 30);
  assert.equal(windowOf("45"), 45);
  assert.equal(windowOf("12"), null);
  assert.equal(weightOf("3"), 3);
  assert.equal(weightOf(6), 6);
  assert.equal(weightOf("9"), 9);
  assert.equal(weightOf("2"), null);
  assert.equal(clothOf("ivory"), "IVORY");
  assert.equal(clothOf("champagne"), "CHAMPAGNE");
  assert.equal(clothOf("ink"), "INK");
  assert.equal(clothOf("silk"), "");
  assert.equal(gaitOf("soft"), "soft");
  assert.equal(gaitOf("firm"), "firm");
  assert.equal(gaitOf("swift"), "swift");
  assert.equal(gaitOf("hush"), "");
  assert.equal(peakCity("london"), true);
  assert.equal(peakCity("ISTANBUL"), true);
  assert.equal(peakCity("moscow"), false);
  assert.equal(quietCity("moscow"), true);
  assert.equal(quietCity("london"), false);
  assert.equal(cityBand("london"), "west");
  assert.equal(cityBand("istanbul"), "core");
  assert.equal(cityBand("dubai"), "east");
  assert.equal(cityBand(""), "");
  assert.equal(cityGap("london", "berlin"), 1);
  assert.equal(cityGap("berlin", "london"), -1);
  assert.equal(cityGap("", "berlin"), null);
  assert.equal(houseCloth("champagne"), true);
  assert.equal(houseCloth("INK"), true);
  assert.equal(houseCloth("ivory"), false);
  assert.equal(activeCity("peak"), "peak");
  assert.equal(activeCity("london"), "london");
  assert.equal(activeCity("paris"), "all");
  assert.equal(activeWindow("15"), "15");
  assert.equal(activeWindow("12"), "all");
  assert.equal(activeGait("firm", ["soft", "firm", "swift"]), "firm");
  assert.equal(activeGait("hush", ["soft", "firm", "swift"]), "all");
  assert.equal(activeWeight("6"), "6");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeCloth("ivory"), "ivory");
  assert.equal(activeCloth("silk"), "all");
  assert.equal(moveDawnFocus(0, 3, 1), 1);
  assert.equal(moveDawnFocus(0, 3, -1), 2);
  assert.equal(suggestCloth([]), "IVORY");
  assert.equal(suggestWindow([], 4), 15);
  assert.equal(suggestWindow([], 12), 30);
  assert.equal(suggestWindow([], 18), 45);
  assert.equal(fairKeeper([], "Ada, Bea"), "Ada");

  const first = addDawnBook([], {
    id: "a",
    title: "  North cover ",
    note: "quiet",
    keeper: "Ada",
    city: "london",
    cloth: "ivory",
    gait: "soft",
    window: "15",
    tags: "p q r s",
    weight: "6",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North cover");
  assert.equal(first[0].cloth, "IVORY");
  assert.equal(first[0].city, "london");
  assert.equal(first[0].window, 15);
  assert.equal(first[0].weight, 6);
  assert.deepEqual(first[0].tags, ["p", "q", "r"]);
  assert.equal(first[0].seal, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addDawnBook(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addDawnBook(first, { id: "b", title: "North cover" }).length, 1);
  const raised = setDawnWeight(first, "a", "9");
  assert.equal(raised[0].weight, 9);
  assert.equal(raised[0].audit, "weight");
  const sealed = setDawnSeal(first, "a", true);
  assert.equal(sealed[0].seal, true);
  assert.equal(sealed[0].audit, "seal");
  const snoozed = snoozeWindow(first, "a");
  assert.equal(snoozed[0].window, 30);
  assert.equal(snoozeWindow(snoozed, "a")[0].window, 45);
  assert.equal(snoozeWindow(snoozeWindow(snoozed, "a"), "a")[0].window, 45);
  const paced = cycleGait(first, "a");
  assert.equal(paced[0].gait, "firm");
  const tagged = addDawnTag(first, "a", "p");
  assert.deepEqual(tagged[0].tags, ["p", "q", "r"]);
  const views = addDawnView([], {
    id: "v",
    name: "Peak",
    tray: "open",
    query: "",
    keeper: "all",
    cloth: "all",
    gait: "all",
    city: "peak",
    window: "all",
    weight: "all",
  });
  assert.equal(readDawnViews(views).length, 1);
  const late = addDawnBook(addDawnBook([], { id: "a", title: "Early city", city: "istanbul", weight: "3" }), { id: "b", title: "Later city", city: "berlin", weight: "3" });
  assert.equal(lateBook(late.find((book) => book.id === "a")!, "london"), true);
  assert.equal(lateBook(late.find((book) => book.id === "b")!, "london"), false);
  const cooling = addDawnBook([], { id: "c", title: "Cooling city", city: "moscow", gait: "swift", weight: "3" });
  assert.equal(coolingBook(cooling[0]), true);
  assert.equal(coolingBook({ ...cooling[0], gait: "firm" }), false);
  assert.equal(coolingBook({ ...cooling[0], city: "london" }), false);
  const far = addDawnBook(addDawnBook([], { id: "n1", title: "Far city", city: "istanbul", weight: "3" }), { id: "n2", title: "Next city", city: "london", weight: "3" });
  assert.equal(neighborBookCount(far), 2);
  const close = addDawnBook(addDawnBook([], { id: "n3", title: "Near city", city: "istanbul", weight: "3" }), { id: "n4", title: "Skip city", city: "berlin", weight: "3" });
  assert.equal(neighborBookCount(close), 0);
  assert.equal(dawnTimeline(far).map((lane) => lane.city).join(","), "istanbul,london");
  assert.match(dawnCsv(first, "berlin"), /North cover,Ada,london,IVORY,soft,15,6,p q r,0,0,0,0,1,1,0,1,0,0,west,save,quiet/);

  assert.equal(crestState("hello"), "set");
  assert.equal(crestState({ name: "  " }), "clear");
  assert.equal(crestState({ name: "Ada", ink: "ACTIVE", stand: "North", deposits: 4 }), "");
  assert.equal(crestMark({ name: "Ada Lane" }), "A7");
  assert.equal(crestMark({ name: "North desk" }), "N0");
  assert.equal(crestMark({ name: "Ada" }), "A3");
  assert.equal(crestLane({ name: "Ada Lane" }), "rich");
  assert.equal(crestLane({ name: "North desk" }), "spare");
  assert.equal(crestLane({ name: "Rhythm" }), "mute");
  assert.equal(crestLane({ name: "Ada-Lane" }), "linked");
  assert.equal(crestLane({ name: "Ada's" }), "named");
  assert.equal(crestTone({ name: "Ada", stand: "" }), "mist");
  assert.equal(crestTone({ name: "Ada", stand: "?" }), "clay");
  assert.equal(crestTone({ name: "Ada", stand: "Alpha" }), "gilt");
  assert.equal(crestTone({ name: "Ada", stand: "North" }), "clay");
  assert.equal(crestTone({ name: "Ada", stand: "4th" }), "soot");
  assert.equal(crestTone({ name: "Ada", stand: "Echo" }), "linen");
  assert.equal(crestTone({ name: "Ada", stand: "Ivy" }), "sand");
  assert.equal(crestTone({ name: "Ada", stand: "Quest" }), "ivory");
  assert.equal(crestBound({ name: "Ada", ink: "ACTIVE" }), true);
  assert.equal(crestBound({ name: "Ada", ink: "" }), false);
  assert.equal(crestWide({ name: "North window desk four" }), true);
  assert.equal(crestWide({ name: "Ada Lane" }), false);
  assert.equal(crestNotch({ name: "Desk 4" }), true);
  assert.equal(crestNotch({ name: "Ada" }), false);
  assert.equal(crestJoin({ name: "North&desk" }), true);
  assert.equal(crestJoin({ name: "North+desk" }), false);
  assert.equal(crestStep(""), 0);
  assert.equal(crestStep("Ada"), 1);
  assert.equal(crestStep("One two three"), 3);
  const book = [
    { id: "1", label: "Ada Lane", note: { name: "Ada Lane", ink: "ACTIVE", stand: "North" } },
    { id: "2", label: "North desk", note: { name: "North desk", ink: "", stand: "" } },
  ];
  assert.equal(leadingCrest(book), "rich");
  assert.equal(sharedCrestCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "Ada Lane two", note: { name: "Ada Lane", ink: "" } },
  ];
  assert.equal(sharedCrestCount(paired), 2);
  assert.match(crestsCsv(book), /rich,1/);
  assert.match(crestRowsCsv(book, ["1"]), /Ada Lane,A7,rich,clay,2,0,0,0,1,0,0,1,0,0,0,1/);

  const keys = Object.keys(ROUND242_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND242_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND242_COPY[locale][key as keyof typeof ROUND242_COPY.en], "string");
      assert.ok(ROUND242_COPY[locale][key as keyof typeof ROUND242_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "dnbTitle"), ROUND242_COPY.tr.dnbTitle);
  assert.equal(crmv4Text("de", "lcrTitle"), ROUND242_COPY.de.lcrTitle);
  assert.equal(crmv4Text("ru", "dnbSub"), ROUND242_COPY.ru.dnbSub);
  assert.equal(crmv4Text("ar", "lcrSub"), ROUND242_COPY.ar.lcrSub);
  assert.equal(crmv4Text("en", "dnbLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dnb/);
  assert.match(css, /\.c4-lcr-index/);
  assert.match(css, /\.c4-clock-salon/);
  assert.match(css, /\.c4-clock-mast/);
  assert.match(css, /\.c4-clock-legend/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round242.tsx"), "utf8");
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
  assert.match(viewFile, /dawnCsv/);
  assert.match(viewFile, /crestsCsv/);
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
  assert.match(viewFile, /data-books/);
  assert.match(viewFile, /data-crests/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-lcr-search/);
  assert.match(viewFile, /dawnTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dnb"/);
  assert.match(app, /view === "lcr"/);
  assert.match(app, /DawnBooks/);
  assert.match(app, /VowelMarks/);
  const clocks = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round71.tsx"), "utf8");
  assert.match(clocks, /c4-clock-salon/);
  assert.match(clocks, /c4-clock-mast/);
  assert.match(clocks, /c4-clock-legend/);
  assert.match(clocks, /data-logo="mono"/);
  assert.match(clocks, /data-clock-salon/);
  assert.match(clocks, /data-clock-strip/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND242_COPY.en, key);
  const audit = viewFile.match(/"(dnbAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND242_COPY.en, key);
  console.log("crmv4 round242 tests passed");
}

main();
