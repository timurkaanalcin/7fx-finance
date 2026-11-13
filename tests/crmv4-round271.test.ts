/**
 * Anemometer cups and retention plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round271.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND271_COPY } from "../src/lib/crmv4/copy-round271";
import {
  ROUND271_FEATURES,
  activeBearing,
  activeWatch,
  activeVane,
  activeLacquer,
  activeBead,
  addCup,
  addCupView,
  briskCup,
  bulkCupPin,
  busiestKeeper,
  cupCsv,
  anemoBead,
  anemoWatch,
  cupTimeline,
  bearingBand,
  bearingGap,
  bearingOf,
  cycleVane,
  dropCupView,
  fairKeeper,
  lacquerOf,
  houseLacquer,
  idleCup,
  lateCup,
  leadingRetention,
  lengthenWatch,
  lowerBead,
  moveAnemoFocus,
  neighborBeadCount,
  overdueCup,
  keenBearing,
  stillBearing,
  raiseBead,
  readCupViews,
  restingCup,
  shortenWatch,
  suggestWatch,
  suggestBearing,
  suggestLacquer,
  vaneOf,
  retentionCap,
  retentionEcho,
  retentionHue,
  retentionKnown,
  retentionLane,
  retentionLanesCsv,
  retentionLeap,
  retentionNotch,
  retentionRowsCsv,
  retentionSlash,
  retentionStamp,
  retentionState,
  retentionStep,
  retentionTail,
  retentionTwin,
  retentionWide,
} from "../src/lib/crmv4/round271";

function main() {
  assert.equal(ROUND271_FEATURES.length, 25);
  assert.equal(bearingOf(" calm "), "calm");
  assert.equal(bearingOf("paris"), "");
  assert.equal(anemoWatch("15"), 15);
  assert.equal(anemoWatch(30), 30);
  assert.equal(anemoWatch("60"), 60);
  assert.equal(anemoWatch("20"), null);
  assert.equal(anemoWatch("12"), null);
  assert.equal(anemoBead("2"), 2);
  assert.equal(anemoBead(4), 4);
  assert.equal(anemoBead("6"), 6);
  assert.equal(anemoBead("8"), 8);
  assert.equal(anemoBead("1"), null);
  assert.equal(anemoBead("3"), null);
  assert.equal(anemoBead("9"), null);
  assert.equal(lacquerOf("ivory"), "IVORY");
  assert.equal(lacquerOf("graphite"), "GRAPHITE");
  assert.equal(lacquerOf("champagne"), "CHAMPAGNE");
  assert.equal(lacquerOf("brass"), "");
  assert.equal(vaneOf("north"), "north");
  assert.equal(vaneOf("east"), "east");
  assert.equal(vaneOf("south"), "south");
  assert.equal(vaneOf("west"), "");
  assert.equal(keenBearing("breeze"), true);
  assert.equal(keenBearing("GALE"), true);
  assert.equal(keenBearing("calm"), false);
  assert.equal(stillBearing("calm"), true);
  assert.equal(stillBearing("storm"), true);
  assert.equal(stillBearing("breeze"), false);
  assert.equal(bearingBand("calm"), "early");
  assert.equal(bearingBand("breeze"), "early");
  assert.equal(bearingBand("gale"), "mid");
  assert.equal(bearingBand("storm"), "late");
  assert.equal(bearingBand(""), "");
  assert.equal(bearingGap("calm", "breeze"), 1);
  assert.equal(bearingGap("breeze", "calm"), -1);
  assert.equal(bearingGap("", "calm"), null);
  assert.equal(houseLacquer("graphite"), true);
  assert.equal(houseLacquer("CHAMPAGNE"), true);
  assert.equal(houseLacquer("ivory"), false);
  assert.equal(activeBearing("keen"), "keen");
  assert.equal(activeBearing("breeze"), "breeze");
  assert.equal(activeBearing("paris"), "all");
  assert.equal(activeWatch("30"), "30");
  assert.equal(activeWatch("9"), "all");
  assert.equal(activeVane("east", ["north", "east", "south"]), "east");
  assert.equal(activeVane("gale", ["north", "east", "south"]), "all");
  assert.equal(activeBead("4"), "4");
  assert.equal(activeBead("1"), "all");
  assert.equal(activeLacquer("graphite"), "graphite");
  assert.equal(activeLacquer("brass"), "all");
  assert.equal(moveAnemoFocus(0, 3, 1), 1);
  assert.equal(moveAnemoFocus(0, 3, -1), 2);
  assert.equal(suggestLacquer([]), "GRAPHITE");
  assert.equal(suggestWatch([], 4), 15);
  assert.equal(suggestWatch([], 10), 30);
  assert.equal(suggestWatch([], 18), 60);
  assert.equal(suggestBearing(4), "calm");
  assert.equal(suggestBearing(12), "gale");
  assert.equal(fairKeeper([], "Nia, Sol"), "Nia");

  const first = addCup([], {
    id: "a",
    title: "  North cup ",
    note: "",
    keeper: "Nia",
    bearing: "breeze",
    lacquer: "ivory",
    vane: "north",
    watch: 15,
    bead: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North cup");
  assert.equal(first[0].note, "");
  assert.equal(first[0].lacquer, "IVORY");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueCup(first[0]), true);
  assert.equal(addCup(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addCup(first, { id: "b", title: "North cup" }).length, 1);
  assert.equal(addCup(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addCup([], { id: "d", title: "Bare" })[0].bead, 2);

  const pinned = bulkCupPin(first, ["a"]);
  assert.equal(overdueCup(pinned[0]), false);
  assert.equal(fairKeeper(pinned, "Nia, Sol"), "Nia");
  const quiet = addCup(pinned, { id: "q", title: "Storm north", keeper: "Sol", bearing: "storm", vane: "north", bead: 2 });
  assert.equal(idleCup(quiet[0]), true);
  assert.equal(lateCup(quiet[0], "storm"), false);
  const behind = addCup([], { id: "z", title: "Calm late", bearing: "calm", bead: 2 });
  assert.equal(lateCup(behind[0], "storm"), true);
  assert.equal(lateCup({ ...behind[0], bead: 8 }, "storm"), false);
  const rushed = addCup([], { id: "r", title: "Gale spark", bearing: "gale", vane: "east", bead: 8 });
  assert.equal(briskCup(rushed[0]), true);
  const rested = addCup([], { id: "s", title: "Storm south", bearing: "storm", vane: "south", watch: 60 });
  assert.equal(restingCup(rested[0]), true);
  assert.equal(lengthenWatch(rested, "s")[0].watch, 60);
  assert.equal(lengthenWatch([{ ...rested[0], watch: null }], "s")[0].watch, 15);
  assert.equal(lengthenWatch(first, "a")[0].watch, 30);
  assert.equal(shortenWatch(first, "a")[0].watch, 15);
  assert.equal(shortenWatch([{ ...first[0], watch: null }], "a")[0].watch, 60);
  assert.equal(cycleVane(first, "a")[0].vane, "east");
  assert.equal(raiseBead(first, "a")[0].bead, 4);
  assert.equal(lowerBead(first, "a")[0].bead, 2);
  assert.equal(lowerBead([{ ...first[0], bead: 8 }], "a")[0].bead, 6);
  assert.equal(busiestKeeper(quiet), "Sol");
  assert.equal(neighborBeadCount(quiet) >= 0, true);
  assert.match(cupCsv(first, "storm"), /North cup/);
  assert.match(cupTimeline(first).map((lane) => lane.bead).join(","), /2/);

  const inkBook = addCup(addCup([], { id: "y1", title: "Graph one", lacquer: "graphite", bearing: "calm" }), { id: "y2", title: "Graph two", lacquer: "graphite", bearing: "breeze" });
  assert.equal(suggestLacquer(inkBook), "GRAPHITE");
  assert.equal(suggestWatch(rested, 4), 60);

  const views = addCupView([], { id: "v", name: "Keen", tray: "open", bearing: "keen", watch: "15", lacquer: "graphite", vane: "north", bead: "2" });
  assert.equal(views[0].bearing, "keen");
  assert.equal(dropCupView(views, "v").length, 0);
  assert.equal(readCupViews([{ id: "v", name: "Keen", tray: "nope" }])[0].tray, "open");

  assert.equal(retentionState("ACTIVE"), "set");
  assert.equal(retentionLane("ACTIVE"), "grove");
  assert.equal(retentionStamp("ACTIVE"), "AC");
  assert.equal(retentionHue("ACTIVE"), "champagne");
  assert.equal(retentionStep("ACTIVE"), 6);
  assert.equal(retentionLeap("ACTIVE"), false);
  assert.equal(retentionKnown("ACTIVE"), true);
  assert.equal(retentionTwin("ACTIVE"), false);
  assert.equal(retentionLane("VIP"), "court");
  assert.equal(retentionStamp("VIP"), "VI");
  assert.equal(retentionHue("VIP"), "graphite");
  assert.equal(retentionKnown("vip"), true);
  assert.equal(retentionLeap("VIP"), false);
  assert.equal(retentionTail("VIP"), false);
  assert.equal(retentionTail("ACTIVE"), true);
  assert.equal(retentionTail("NOVA"), true);
  assert.equal(retentionLane("CHURNED"), "shade");
  assert.equal(retentionStamp("CHURNED"), "CH");
  assert.equal(retentionHue("CHURNED"), "ivory");
  assert.equal(retentionKnown("CHURNED"), true);
  assert.equal(retentionLane("INACTIVE"), "shade");
  assert.equal(retentionKnown("INACTIVE"), true);
  assert.equal(retentionLane("AT_RISK"), "verge");
  assert.equal(retentionWide("AT_RISK"), true);
  assert.equal(retentionKnown("AT_RISK"), true);
  assert.equal(retentionNotch("AT-RISK"), true);
  assert.equal(retentionLane("AT-RISK"), "verge");
  assert.equal(retentionSlash("A/B"), true);
  assert.equal(retentionLane("A/B"), "verge");
  assert.equal(retentionWide("Ann_Marie"), true);
  assert.equal(retentionTwin("Book"), true);
  assert.equal(retentionEcho("Radar"), true);
  assert.equal(retentionCap("ACTIVE"), true);
  assert.equal(retentionCap("active"), false);
  assert.equal(retentionLane("active"), "grove");
  assert.equal(retentionLeap("LOST"), true);
  assert.equal(retentionHue("LOST"), "champagne");
  assert.equal(retentionState("12"), "clear");
  assert.equal(retentionState(""), "clear");
  assert.equal(retentionState({ retentionStatus: "ACTIVE", balance: 1 }), "");
  assert.equal(retentionState({ title: "ACTIVE" }), "");
  assert.equal(retentionLane({ code: "VIP" }), "court");

  const book = [
    { id: "1", label: "ACTIVE", note: "ACTIVE" },
    { id: "2", label: "VIP", note: "VIP" },
    { id: "3", label: "CHURNED", note: "CHURNED" },
  ];
  assert.equal(leadingRetention(book), "grove");
  assert.match(retentionLanesCsv(book), /grove,1/);
  assert.match(retentionRowsCsv(book, ["1"]), /ACTIVE,ACTIVE,AC,grove,champagne/);
  assert.match(retentionRowsCsv(book, ["1"]), /VIP,VI,court,graphite/);
  assert.match(retentionRowsCsv(book, ["1"]), /CHURNED,CH,shade,ivory/);

  const keys = Object.keys(ROUND271_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND271_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND271_COPY[locale][key as keyof typeof ROUND271_COPY.en], "string");
      assert.ok(ROUND271_COPY[locale][key as keyof typeof ROUND271_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "anmTitle"), ROUND271_COPY.tr.anmTitle);
  assert.equal(crmv4Text("de", "rtnTitle"), ROUND271_COPY.de.rtnTitle);
  assert.equal(crmv4Text("ru", "anmSub"), ROUND271_COPY.ru.anmSub);
  assert.equal(crmv4Text("ar", "rtnSub"), ROUND271_COPY.ar.rtnSub);
  assert.equal(crmv4Text("en", "anmLogo"), "7FX");
  assert.equal(crmv4Text("en", "anmTitle"), "Anemometer cups");
  assert.equal(crmv4Text("en", "rtnTitle"), "Retention plates");
  assert.notEqual(ROUND271_COPY.tr.anmTitle, ROUND271_COPY.en.anmTitle);
  assert.equal(crmv4Text("en", "clnTitle"), "Clinometer cards");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-anemo/);
  assert.match(css, /\.c4-retention-index/);
  assert.match(css, /\.c4-anemo-columns/);
  assert.match(css, /\.c4-retention-stake/);
  assert.match(css, /\.c4-logs-chronicle/);
  assert.match(css, /\.c4-logs-chronicle-ledger/);
  assert.match(css, /\.c4-logs-coffer/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round271.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionStatus:/);
  assert.match(viewFile, /cupCsv/);
  assert.match(viewFile, /retentionRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "r"/);
  assert.match(viewFile, /event\.key === "l"/);
  assert.match(viewFile, /event\.key === "g"/);
  assert.match(viewFile, /event\.key === "h"/);
  assert.match(viewFile, /event\.key === "w"/);
  assert.match(viewFile, /event\.key === "b"/);
  assert.match(viewFile, /event\.key === "p"/);
  assert.match(viewFile, /event\.key === "u"/);
  assert.match(viewFile, /event\.key === "y"/);
  assert.match(viewFile, /event\.key === "m"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestLacquer/);
  assert.match(viewFile, /c4-retention-search/);
  assert.match(viewFile, /cupTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "anm"/);
  assert.match(app, /view === "rtn"/);
  const logs = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Logs.tsx"), "utf8");
  assert.match(logs, /c4-logs-chronicle/);
  assert.match(logs, /c4-logs-coffer/);
  assert.match(logs, /data-desk="coffer"/);
  assert.match(logs, /logChronicleKicker/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND271_COPY.en, key);
  const audit = viewFile.match(/"(anmAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND271_COPY.en, key);
  const logUsed = new Set(logs.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(logUsed)) {
    if (key.startsWith("logChronicle") || key.startsWith("anm") || key.startsWith("rtn")) assert.ok(key in ROUND271_COPY.en, key);
  }
  console.log("crmv4 round271 tests passed");
}

main();
