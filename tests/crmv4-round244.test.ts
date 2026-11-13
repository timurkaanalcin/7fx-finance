/**
 * Binnacle cards and luff marks.
 * Run: TZ=UTC npx tsx tests/crmv4-round244.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND244_COPY } from "../src/lib/crmv4/copy-round244";
import {
  activeBearing,
  activeDeviation,
  activeDrift,
  activePoint,
  activeReef,
  addBinnacleCard,
  addBinnacleTag,
  addBinnacleView,
  bearingOf,
  binnacleCsv,
  binnacleTimeline,
  cycleReef,
  deviationOf,
  driftOf,
  fairHelmsman,
  houseDeviation,
  idleCard,
  lateCard,
  leadingLuff,
  leePoint,
  lengthenDrift,
  lowerBearing,
  luffBound,
  luffHue,
  luffJoin,
  luffLane,
  luffLanesCsv,
  luffNotch,
  luffRowsCsv,
  luffStamp,
  luffState,
  luffStep,
  luffWide,
  moveBinnacleFocus,
  neighborCardCount,
  pointBand,
  pointGap,
  pointOf,
  raiseBearing,
  readBinnacleViews,
  reefOf,
  setCardBearing,
  setCardLamp,
  sharedLuffCount,
  shortenDrift,
  suggestDeviation,
  suggestDrift,
  weatherPoint,
} from "../src/lib/crmv4/round244";

function main() {
  assert.equal(pointOf(" Reach "), "reach");
  assert.equal(pointOf("paris"), "");
  assert.equal(driftOf("5"), 5);
  assert.equal(driftOf(15), 15);
  assert.equal(driftOf("30"), 30);
  assert.equal(driftOf("12"), null);
  assert.equal(bearingOf("0"), 0);
  assert.equal(bearingOf(90), 90);
  assert.equal(bearingOf("180"), 180);
  assert.equal(bearingOf("270"), 270);
  assert.equal(bearingOf("45"), null);
  assert.equal(deviationOf("port"), "PORT");
  assert.equal(deviationOf("even"), "EVEN");
  assert.equal(deviationOf("starboard"), "STAR");
  assert.equal(deviationOf("silk"), "");
  assert.equal(reefOf("bare"), "bare");
  assert.equal(reefOf("one"), "one");
  assert.equal(reefOf("two"), "two");
  assert.equal(reefOf("three"), "");
  assert.equal(weatherPoint("close"), true);
  assert.equal(weatherPoint("BEAT"), true);
  assert.equal(weatherPoint("drift"), false);
  assert.equal(leePoint("drift"), true);
  assert.equal(leePoint("reach"), false);
  assert.equal(pointBand("close"), "windward");
  assert.equal(pointBand("reach"), "beam");
  assert.equal(pointBand("run"), "leeward");
  assert.equal(pointBand(""), "");
  assert.equal(pointGap("close", "reach"), 1);
  assert.equal(pointGap("reach", "close"), -1);
  assert.equal(pointGap("", "reach"), null);
  assert.equal(houseDeviation("port"), true);
  assert.equal(houseDeviation("STAR"), true);
  assert.equal(houseDeviation("even"), false);
  assert.equal(activePoint("weather"), "weather");
  assert.equal(activePoint("close"), "close");
  assert.equal(activePoint("paris"), "all");
  assert.equal(activeDrift("5"), "5");
  assert.equal(activeDrift("12"), "all");
  assert.equal(activeReef("one", ["bare", "one", "two"]), "one");
  assert.equal(activeReef("hush", ["bare", "one", "two"]), "all");
  assert.equal(activeBearing("90"), "90");
  assert.equal(activeBearing("45"), "all");
  assert.equal(activeDeviation("port"), "port");
  assert.equal(activeDeviation("silk"), "all");
  assert.equal(moveBinnacleFocus(0, 3, 1), 1);
  assert.equal(moveBinnacleFocus(0, 3, -1), 2);
  assert.equal(suggestDeviation([]), "EVEN");
  assert.equal(suggestDrift([], 4), 5);
  assert.equal(suggestDrift([], 12), 15);
  assert.equal(suggestDrift([], 18), 30);
  assert.equal(fairHelmsman([], "Ada, Bea"), "Ada");

  const first = addBinnacleCard([], {
    id: "a",
    title: "  North cover ",
    note: "quiet",
    helmsman: "Ada",
    point: "reach",
    deviation: "port",
    reef: "bare",
    drift: "5",
    tags: "a b c d",
    bearing: "90",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North cover");
  assert.equal(first[0].deviation, "PORT");
  assert.equal(first[0].point, "reach");
  assert.equal(first[0].drift, 5);
  assert.equal(first[0].bearing, 90);
  assert.deepEqual(first[0].tags, ["a", "b", "c"]);
  assert.equal(first[0].lamp, false);
  assert.equal(first[0].audit, "save");
  assert.equal(addBinnacleCard(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addBinnacleCard(first, { id: "b", title: "North cover" }).length, 1);
  const turned = setCardBearing(first, "a", "180");
  assert.equal(turned[0].bearing, 180);
  assert.equal(turned[0].audit, "bear");
  const lit = setCardLamp(first, "a", true);
  assert.equal(lit[0].lamp, true);
  assert.equal(lit[0].audit, "lamp");
  const longer = lengthenDrift(first, "a");
  assert.equal(longer[0].drift, 15);
  assert.equal(lengthenDrift(longer, "a")[0].drift, 30);
  assert.equal(lengthenDrift(lengthenDrift(longer, "a"), "a")[0].drift, 30);
  const shorter = shortenDrift(lengthenDrift(longer, "a"), "a");
  assert.equal(shorter[0].drift, 15);
  assert.equal(shortenDrift(first, "a")[0].drift, 5);
  const reefed = cycleReef(first, "a");
  assert.equal(reefed[0].reef, "one");
  const tagged = addBinnacleTag(first, "a", "a");
  assert.deepEqual(tagged[0].tags, ["a", "b", "c"]);
  const raised = raiseBearing(first, "a");
  assert.equal(raised[0].bearing, 180);
  const lowered = lowerBearing(first, "a");
  assert.equal(lowered[0].bearing, 0);
  const views = addBinnacleView([], {
    id: "v",
    name: "Weather",
    tray: "open",
    query: "",
    helmsman: "all",
    deviation: "all",
    reef: "all",
    point: "weather",
    drift: "all",
    bearing: "all",
  });
  assert.equal(readBinnacleViews(views).length, 1);
  const late = addBinnacleCard(addBinnacleCard([], { id: "a", title: "Early point", point: "close", bearing: "0" }), { id: "b", title: "Later point", point: "beat", bearing: "0" });
  assert.equal(lateCard(late.find((card) => card.id === "a")!, "reach"), true);
  assert.equal(lateCard(late.find((card) => card.id === "b")!, "reach"), false);
  const idle = addBinnacleCard([], { id: "c", title: "Idle point", point: "drift", reef: "two", bearing: "0" });
  assert.equal(idleCard(idle[0]), true);
  assert.equal(idleCard({ ...idle[0], reef: "one" }), false);
  assert.equal(idleCard({ ...idle[0], point: "reach" }), false);
  assert.equal(idleCard({ ...idle[0], bearing: 90 }), false);
  const near = addBinnacleCard(addBinnacleCard([], { id: "n1", title: "North bearing", bearing: "0" }), { id: "n2", title: "East bearing", bearing: "90" });
  assert.equal(neighborCardCount(near), 2);
  const far = addBinnacleCard(addBinnacleCard([], { id: "n3", title: "North far", bearing: "0" }), { id: "n4", title: "South far", bearing: "180" });
  assert.equal(neighborCardCount(far), 0);
  assert.equal(binnacleTimeline(near).map((lane) => lane.bearing).join(","), "0,90");
  assert.match(binnacleCsv(first, "broad"), /North cover,Ada,reach,PORT,bare,5,90,a b c,0,0,0,0,1,1,0,0,0,1,beam,0,0,0,save,quiet/);

  assert.equal(luffState("hello"), "set");
  assert.equal(luffState({ tongue: "  " }), "clear");
  assert.equal(luffState({ tongue: "en", shore: "TR", balance: 4 }), "");
  assert.equal(luffStamp({ tongue: "en", shore: "TR" }), "E2");
  assert.equal(luffStamp({ language: "de", country: "Germany" }), "D7");
  assert.equal(luffStamp({ tongue: "en" }), "E0");
  assert.equal(luffLane({ tongue: "en-GB" }), "dash");
  assert.equal(luffLane({ tongue: "zh_Hans" }), "score");
  assert.equal(luffLane({ tongue: "en.US" }), "mark");
  assert.equal(luffLane({ tongue: "en" }), "pair");
  assert.equal(luffLane({ tongue: "eng" }), "trio");
  assert.equal(luffLane({ tongue: "Rhythm" }), "hush");
  assert.equal(luffLane({ tongue: "english" }), "long");
  assert.equal(luffHue({ tongue: "en", shore: "" }), "mist");
  assert.equal(luffHue({ tongue: "en", shore: "!" }), "pearl");
  assert.equal(luffHue({ tongue: "en", shore: "North" }), "sand");
  assert.equal(luffHue({ tongue: "en", shore: "Alpha" }), "slate");
  assert.equal(luffHue({ tongue: "en", shore: "Echo" }), "pearl");
  assert.equal(luffHue({ tongue: "en", shore: "Ivy" }), "soot");
  assert.equal(luffHue({ tongue: "en", shore: "Quest" }), "soot");
  assert.equal(luffHue({ tongue: "en", shore: "4th" }), "sand");
  assert.equal(luffHue({ tongue: "en", shore: "?" }), "mist");
  assert.equal(luffBound({ tongue: "en", shore: "Austria" }), true);
  assert.equal(luffBound({ tongue: "en", shore: "TR" }), false);
  assert.equal(luffBound({ tongue: "en", shore: "" }), false);
  assert.equal(luffWide({ tongue: "en-GB-ox" }), true);
  assert.equal(luffWide({ tongue: "en" }), false);
  assert.equal(luffNotch({ tongue: "en.US" }), true);
  assert.equal(luffNotch({ tongue: "en" }), false);
  assert.equal(luffJoin({ tongue: "en-GB" }), true);
  assert.equal(luffJoin({ tongue: "en_GB" }), false);
  assert.equal(luffStep(""), 0);
  assert.equal(luffStep("A"), 0);
  assert.equal(luffStep("One two three"), 5);
  const book = [
    { id: "1", label: "Ada", note: { tongue: "en", shore: "TR" } },
    { id: "2", label: "North", note: { tongue: "en-GB", shore: "" } },
  ];
  assert.equal(leadingLuff(book), "dash");
  assert.equal(sharedLuffCount(book), 0);
  const paired = [
    book[0],
    { id: "4", label: "Ada two", note: { tongue: "en", shore: "TR" } },
  ];
  assert.equal(sharedLuffCount(paired), 2);
  assert.match(luffLanesCsv(book), /pair,1/);
  assert.match(luffRowsCsv(book, ["1"]), /en,E2,pair,pearl,1,0,0,0,0,0,0,0,1,0,0,0,1/);

  const keys = Object.keys(ROUND244_COPY.en);
  assert.ok(keys.length >= 120);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND244_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND244_COPY[locale][key as keyof typeof ROUND244_COPY.en], "string");
      assert.ok(ROUND244_COPY[locale][key as keyof typeof ROUND244_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "bncTitle"), ROUND244_COPY.tr.bncTitle);
  assert.equal(crmv4Text("de", "lufTitle"), ROUND244_COPY.de.lufTitle);
  assert.equal(crmv4Text("ru", "bncSub"), ROUND244_COPY.ru.bncSub);
  assert.equal(crmv4Text("ar", "lufSub"), ROUND244_COPY.ar.lufSub);
  assert.equal(crmv4Text("en", "bncLogo"), "7FX");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-bnc/);
  assert.match(css, /\.c4-luf-index/);
  assert.match(css, /\.c4-hgl/);
  assert.match(css, /\.c4-snip-salon/);
  assert.match(css, /\.c4-week-salon/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round244.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /language/);
  assert.match(viewFile, /country/);
  assert.match(viewFile, /title/);
  assert.match(viewFile, /binnacleCsv/);
  assert.match(viewFile, /luffRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "t"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "s"/);
  assert.match(viewFile, /event\.key === "f"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "d"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "n"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-marks/);
  assert.match(viewFile, /data-traders/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestDeviation/);
  assert.match(viewFile, /c4-luf-search/);
  assert.match(viewFile, /binnacleTimeline/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "bnc"/);
  assert.match(app, /view === "luf"/);
  assert.match(app, /BinnacleCards/);
  assert.match(app, /LuffMarks/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND244_COPY.en, key);
  const audit = viewFile.match(/"(bncAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND244_COPY.en, key);
  console.log("crmv4 round244 tests passed");
}

main();
