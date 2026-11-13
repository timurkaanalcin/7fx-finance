/**
 * Pendulum bobs and charter plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round272.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND272_COPY } from "../src/lib/crmv4/copy-round272";
import {
  ROUND272_FEATURES,
  activeBeat,
  activeHand,
  activeFinish,
  activeTempo,
  activeWeight,
  addBob,
  addBobView,
  briskBob,
  bulkBobLatch,
  busiestWinder,
  bobCsv,
  pendulumWeight,
  pendulumBeat,
  bobTimeline,
  tempoBand,
  tempoGap,
  tempoOf,
  cycleHand,
  dropBobView,
  fairWinder,
  finishOf,
  houseFinish,
  idleBob,
  lateBob,
  leadingCharter,
  lengthenBeat,
  lowerWeight,
  movePendulumFocus,
  neighborWeightCount,
  overdueBob,
  keenTempo,
  stillTempo,
  raiseWeight,
  readBobViews,
  restingBob,
  shortenBeat,
  suggestBeat,
  suggestTempo,
  suggestFinish,
  handOf,
  charterCap,
  charterEcho,
  charterHue,
  charterKnown,
  charterLane,
  charterLanesCsv,
  charterLeap,
  charterNotch,
  charterRowsCsv,
  charterSlash,
  charterStamp,
  charterState,
  charterStep,
  charterTail,
  charterTwin,
  charterWide,
} from "../src/lib/crmv4/round272";

function main() {
  assert.equal(ROUND272_FEATURES.length, 25);
  assert.equal(tempoOf(" largo "), "largo");
  assert.equal(tempoOf("paris"), "");
  assert.equal(pendulumBeat("40"), 40);
  assert.equal(pendulumBeat(72), 72);
  assert.equal(pendulumBeat("96"), 96);
  assert.equal(pendulumBeat("20"), null);
  assert.equal(pendulumBeat("12"), null);
  assert.equal(pendulumWeight("1"), 1);
  assert.equal(pendulumWeight(3), 3);
  assert.equal(pendulumWeight("5"), 5);
  assert.equal(pendulumWeight("7"), 7);
  assert.equal(pendulumWeight("2"), null);
  assert.equal(pendulumWeight("4"), null);
  assert.equal(pendulumWeight("9"), null);
  assert.equal(finishOf("ivory"), "IVORY");
  assert.equal(finishOf("graphite"), "GRAPHITE");
  assert.equal(finishOf("champagne"), "CHAMPAGNE");
  assert.equal(finishOf("brass"), "");
  assert.equal(handOf("left"), "left");
  assert.equal(handOf("both"), "both");
  assert.equal(handOf("right"), "right");
  assert.equal(handOf("west"), "");
  assert.equal(keenTempo("allegro"), true);
  assert.equal(keenTempo("PRESTO"), true);
  assert.equal(keenTempo("largo"), false);
  assert.equal(stillTempo("largo"), true);
  assert.equal(stillTempo("andante"), true);
  assert.equal(stillTempo("allegro"), false);
  assert.equal(tempoBand("largo"), "early");
  assert.equal(tempoBand("andante"), "early");
  assert.equal(tempoBand("allegro"), "mid");
  assert.equal(tempoBand("presto"), "late");
  assert.equal(tempoBand(""), "");
  assert.equal(tempoGap("largo", "andante"), 1);
  assert.equal(tempoGap("andante", "largo"), -1);
  assert.equal(tempoGap("", "largo"), null);
  assert.equal(houseFinish("graphite"), true);
  assert.equal(houseFinish("CHAMPAGNE"), true);
  assert.equal(houseFinish("ivory"), false);
  assert.equal(activeTempo("keen"), "keen");
  assert.equal(activeTempo("allegro"), "allegro");
  assert.equal(activeTempo("paris"), "all");
  assert.equal(activeBeat("72"), "72");
  assert.equal(activeBeat("9"), "all");
  assert.equal(activeHand("both", ["left", "both", "right"]), "both");
  assert.equal(activeHand("presto", ["left", "both", "right"]), "all");
  assert.equal(activeWeight("3"), "3");
  assert.equal(activeWeight("2"), "all");
  assert.equal(activeFinish("graphite"), "graphite");
  assert.equal(activeFinish("brass"), "all");
  assert.equal(movePendulumFocus(0, 3, 1), 1);
  assert.equal(movePendulumFocus(0, 3, -1), 2);
  assert.equal(suggestFinish([]), "GRAPHITE");
  assert.equal(suggestBeat([], 4), 40);
  assert.equal(suggestBeat([], 10), 72);
  assert.equal(suggestBeat([], 18), 96);
  assert.equal(suggestTempo(4), "largo");
  assert.equal(suggestTempo(12), "allegro");
  assert.equal(fairWinder([], "Nia, Sol"), "Nia");

  const first = addBob([], {
    id: "a",
    title: "  Allegro bob ",
    note: "",
    winder: "Nia",
    tempo: "allegro",
    finish: "ivory",
    hand: "left",
    beat: 40,
    weight: 1,
    tags: "x x y",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "Allegro bob");
  assert.equal(first[0].note, "");
  assert.equal(first[0].finish, "IVORY");
  assert.equal(first[0].tags.join(""), "xy");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueBob(first[0]), true);
  assert.equal(addBob(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addBob(first, { id: "b", title: "Allegro bob" }).length, 1);
  assert.equal(addBob(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addBob([], { id: "d", title: "Bare" })[0].weight, 1);

  const latched = bulkBobLatch(first, ["a"]);
  assert.equal(overdueBob(latched[0]), false);
  assert.equal(fairWinder(latched, "Nia, Sol"), "Nia");
  const quiet = addBob(latched, { id: "q", title: "Largo left", winder: "Sol", tempo: "largo", hand: "left", weight: 1 });
  assert.equal(idleBob(quiet[0]), true);
  assert.equal(lateBob(quiet[0], "largo"), false);
  const behind = addBob([], { id: "z", title: "Largo late", tempo: "largo", weight: 1 });
  assert.equal(lateBob(behind[0], "presto"), true);
  assert.equal(lateBob({ ...behind[0], weight: 7 }, "presto"), false);
  const rushed = addBob([], { id: "r", title: "Allegro spark", tempo: "allegro", hand: "right", weight: 7 });
  assert.equal(briskBob(rushed[0]), true);
  const rested = addBob([], { id: "s", title: "Presto both", tempo: "presto", hand: "both", beat: 96 });
  assert.equal(restingBob(rested[0]), true);
  assert.equal(lengthenBeat(rested, "s")[0].beat, 96);
  assert.equal(lengthenBeat([{ ...rested[0], beat: null }], "s")[0].beat, 40);
  assert.equal(lengthenBeat(first, "a")[0].beat, 72);
  assert.equal(shortenBeat(first, "a")[0].beat, 40);
  assert.equal(shortenBeat([{ ...first[0], beat: null }], "a")[0].beat, 96);
  assert.equal(cycleHand(first, "a")[0].hand, "both");
  assert.equal(raiseWeight(first, "a")[0].weight, 3);
  assert.equal(lowerWeight(first, "a")[0].weight, 1);
  assert.equal(lowerWeight([{ ...first[0], weight: 7 }], "a")[0].weight, 5);
  assert.equal(busiestWinder(quiet), "Sol");
  assert.equal(neighborWeightCount(quiet) >= 0, true);
  assert.match(bobCsv(first, "presto"), /Allegro bob/);
  assert.match(bobTimeline(first).map((lane) => lane.weight).join(","), /1/);

  const inkBook = addBob(addBob([], { id: "y1", title: "Graph one", finish: "graphite", tempo: "largo" }), { id: "y2", title: "Graph two", finish: "graphite", tempo: "andante" });
  assert.equal(suggestFinish(inkBook), "GRAPHITE");
  assert.equal(suggestBeat(rested, 4), 96);

  const views = addBobView([], { id: "v", name: "Keen", tray: "swing", tempo: "keen", beat: "40", finish: "graphite", hand: "left", weight: "1" });
  assert.equal(views[0].tempo, "keen");
  assert.equal(dropBobView(views, "v").length, 0);
  assert.equal(readBobViews([{ id: "v", name: "Keen", tray: "nope" }])[0].tray, "swing");

  assert.equal(charterState("APPROVED"), "set");
  assert.equal(charterLane("APPROVED"), "hall");
  assert.equal(charterStamp("APPROVED"), "AP");
  assert.equal(charterHue("APPROVED"), "champagne");
  assert.equal(charterStep("APPROVED"), 8);
  assert.equal(charterLeap("APPROVED"), false);
  assert.equal(charterKnown("APPROVED"), true);
  assert.equal(charterTwin("APPROVED"), true);
  assert.equal(charterTwin("PENDING"), false);
  assert.equal(charterLane("PENDING"), "porch");
  assert.equal(charterStamp("PENDING"), "PE");
  assert.equal(charterHue("PENDING"), "graphite");
  assert.equal(charterKnown("pending"), true);
  assert.equal(charterLeap("PENDING"), false);
  assert.equal(charterTail("PENDING"), false);
  assert.equal(charterTail("APPROVED"), false);
  assert.equal(charterTail("NOVA"), true);
  assert.equal(charterLane("REJECTED"), "yard");
  assert.equal(charterStamp("REJECTED"), "RE");
  assert.equal(charterHue("REJECTED"), "ivory");
  assert.equal(charterKnown("REJECTED"), true);
  assert.equal(charterLane("MISSING"), "yard");
  assert.equal(charterKnown("MISSING"), true);
  assert.equal(charterLane("AT_RISK"), "gate");
  assert.equal(charterWide("AT_RISK"), true);
  assert.equal(charterKnown("AT_RISK"), false);
  assert.equal(charterNotch("AT-RISK"), true);
  assert.equal(charterLane("AT-RISK"), "gate");
  assert.equal(charterSlash("A/B"), true);
  assert.equal(charterLane("A/B"), "gate");
  assert.equal(charterWide("Ann_Marie"), true);
  assert.equal(charterTwin("Book"), true);
  assert.equal(charterEcho("Radar"), true);
  assert.equal(charterCap("APPROVED"), true);
  assert.equal(charterCap("approved"), false);
  assert.equal(charterLane("approved"), "hall");
  assert.equal(charterLeap("LOST"), true);
  assert.equal(charterHue("LOST"), "champagne");
  assert.equal(charterState("12"), "clear");
  assert.equal(charterState(""), "clear");
  assert.equal(charterState({ documentsStatus: "APPROVED", balance: 1 }), "");
  assert.equal(charterState({ title: "APPROVED" }), "");
  assert.equal(charterLane({ code: "PENDING" }), "porch");

  const book = [
    { id: "1", label: "APPROVED", note: "APPROVED" },
    { id: "2", label: "PENDING", note: "PENDING" },
    { id: "3", label: "REJECTED", note: "REJECTED" },
  ];
  assert.equal(leadingCharter(book), "hall");
  assert.match(charterLanesCsv(book), /hall,1/);
  assert.match(charterRowsCsv(book, ["1"]), /APPROVED,APPROVED,AP,hall,champagne/);
  assert.match(charterRowsCsv(book, ["1"]), /PENDING,PE,porch,graphite/);
  assert.match(charterRowsCsv(book, ["1"]), /REJECTED,RE,yard,ivory/);

  const keys = Object.keys(ROUND272_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND272_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND272_COPY[locale][key as keyof typeof ROUND272_COPY.en], "string");
      assert.ok(ROUND272_COPY[locale][key as keyof typeof ROUND272_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "pndTitle"), ROUND272_COPY.tr.pndTitle);
  assert.equal(crmv4Text("de", "chtTitle"), ROUND272_COPY.de.chtTitle);
  assert.equal(crmv4Text("ru", "pndSub"), ROUND272_COPY.ru.pndSub);
  assert.equal(crmv4Text("ar", "chtSub"), ROUND272_COPY.ar.chtSub);
  assert.equal(crmv4Text("en", "pndLogo"), "7FX");
  assert.equal(crmv4Text("en", "pndTitle"), "Pendulum bobs");
  assert.equal(crmv4Text("en", "chtTitle"), "Charter plates");
  assert.notEqual(ROUND272_COPY.tr.pndTitle, ROUND272_COPY.en.pndTitle);
  assert.equal(crmv4Text("en", "anmTitle"), "Anemometer cups");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pendulum/);
  assert.match(css, /\.c4-charter-index/);
  assert.match(css, /\.c4-pendulum-staff/);
  assert.match(css, /\.c4-charter-stake/);
  assert.match(css, /\.c4-cal-almanac/);
  assert.match(css, /\.c4-lic-charter/);
  assert.match(css, /\.c4-ops-sextant/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round272.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /documentsStatus:/);
  assert.match(viewFile, /bobCsv/);
  assert.match(viewFile, /charterRowsCsv/);
  assert.match(viewFile, /Escape/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "j"/);
  assert.match(viewFile, /event\.key === "n"/);
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
  assert.match(viewFile, /suggestFinish/);
  assert.match(viewFile, /c4-charter-search/);
  assert.match(viewFile, /bobTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "pnd"/);
  assert.match(app, /view === "cht"/);
  const ops = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Ops.tsx"), "utf8");
  assert.match(ops, /c4-cal-almanac/);
  assert.match(ops, /c4-lic-charter/);
  assert.match(ops, /c4-ops-sextant/);
  assert.match(ops, /sxtOpsLead/);
  assert.match(ops, /calAlmanacKicker/);
  assert.match(ops, /licCharterKicker/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND272_COPY.en, key);
  const audit = viewFile.match(/"(pndAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND272_COPY.en, key);
  const opsUsed = new Set(ops.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(opsUsed)) {
    if (key.startsWith("calAlmanac") || key.startsWith("licCharter") || key.startsWith("pnd") || key.startsWith("cht")) assert.ok(key in ROUND272_COPY.en, key);
  }
  console.log("crmv4 round272 tests passed");
}

main();
