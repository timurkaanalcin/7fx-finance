/**
 * Clinometer cards and potential plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round270.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND270_COPY } from "../src/lib/crmv4/copy-round270";
import {
  ROUND270_FEATURES,
  activeLimb,
  activeClinoSpan,
  activeMotion,
  activeInk,
  activeClinoMark,
  addClino,
  addClinoView,
  briskTube,
  bulkClinoPin,
  busiestClinoKeeper,
  clinoCsv,
  clinoMark,
  clinoTimeline,
  clinoSpan,
  limbBand,
  limbGap,
  limbOf,
  cycleMotion,
  dropClinoView,
  fairClinoKeeper,
  inkOf,
  houseInk,
  idleTube,
  lateTube,
  leadingPotential,
  lengthenClino,
  lowerClino,
  moveClinoFocus,
  neighborClinoCount,
  overdueTube,
  peakLimb,
  quietLimb,
  raiseClino,
  readClinoViews,
  restingTube,
  shortenClino,
  suggestClinoSpan,
  suggestLimb,
  suggestInk,
  motionOf,
  potentialCap,
  potentialEcho,
  potentialHue,
  potentialKnown,
  potentialLane,
  potentialLanesCsv,
  potentialLeap,
  potentialNotch,
  potentialRowsCsv,
  potentialSlash,
  potentialStamp,
  potentialState,
  potentialStep,
  potentialTail,
  potentialTwin,
  potentialWide,
} from "../src/lib/crmv4/round270";

function main() {
  assert.equal(ROUND270_FEATURES.length, 25);
  assert.equal(limbOf(" level "), "level");
  assert.equal(limbOf("paris"), "");
  assert.equal(clinoSpan("20"), 20);
  assert.equal(clinoSpan(40), 40);
  assert.equal(clinoSpan("90"), 90);
  assert.equal(clinoSpan("15"), null);
  assert.equal(clinoSpan("12"), null);
  assert.equal(clinoMark("3"), 3);
  assert.equal(clinoMark(5), 5);
  assert.equal(clinoMark("7"), 7);
  assert.equal(clinoMark("9"), 9);
  assert.equal(clinoMark("1"), null);
  assert.equal(clinoMark("2"), null);
  assert.equal(clinoMark("8"), null);
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("graphite"), "GRAPHITE");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("brass"), "");
  assert.equal(motionOf("climb"), "climb");
  assert.equal(motionOf("rest"), "rest");
  assert.equal(motionOf("sink"), "sink");
  assert.equal(motionOf("lift"), "");
  assert.equal(peakLimb("rise"), true);
  assert.equal(peakLimb("FALL"), true);
  assert.equal(peakLimb("level"), false);
  assert.equal(quietLimb("level"), true);
  assert.equal(quietLimb("steep"), true);
  assert.equal(quietLimb("rise"), false);
  assert.equal(limbBand("level"), "early");
  assert.equal(limbBand("rise"), "early");
  assert.equal(limbBand("fall"), "mid");
  assert.equal(limbBand("steep"), "late");
  assert.equal(limbBand(""), "");
  assert.equal(limbGap("level", "rise"), 1);
  assert.equal(limbGap("rise", "level"), -1);
  assert.equal(limbGap("", "level"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(activeLimb("peak"), "peak");
  assert.equal(activeLimb("rise"), "rise");
  assert.equal(activeLimb("paris"), "all");
  assert.equal(activeClinoSpan("40"), "40");
  assert.equal(activeClinoSpan("9"), "all");
  assert.equal(activeMotion("rest", ["climb", "rest", "sink"]), "rest");
  assert.equal(activeMotion("gale", ["climb", "rest", "sink"]), "all");
  assert.equal(activeClinoMark("5"), "5");
  assert.equal(activeClinoMark("1"), "all");
  assert.equal(activeInk("graphite"), "graphite");
  assert.equal(activeInk("brass"), "all");
  assert.equal(moveClinoFocus(0, 3, 1), 1);
  assert.equal(moveClinoFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestClinoSpan([], 4), 20);
  assert.equal(suggestClinoSpan([], 8), 40);
  assert.equal(suggestClinoSpan([], 16), 90);
  assert.equal(suggestLimb(4), "level");
  assert.equal(suggestLimb(12), "fall");
  assert.equal(fairClinoKeeper([], "Nia, Sol"), "Nia");

  const first = addClino([], {
    id: "a",
    title: "  North card ",
    note: "",
    weaver: "Nia",
    frame: "rise",
    dye: "ivory",
    shuttle: "climb",
    wait: 20,
    rank: 3,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North card");
  assert.equal(first[0].note, "");
  assert.equal(first[0].dye, "IVORY");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueTube(first[0]), true);
  assert.equal(addClino(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addClino(first, { id: "b", title: "North card" }).length, 1);
  assert.equal(addClino(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addClino([], { id: "d", title: "Bare" })[0].rank, 3);

  const pinned = bulkClinoPin(first, ["a"]);
  assert.equal(overdueTube(pinned[0]), false);
  assert.equal(fairClinoKeeper(pinned, "Nia, Sol"), "Nia");
  const quiet = addClino(pinned, { id: "q", title: "Steep rest", weaver: "Sol", frame: "steep", shuttle: "climb", rank: 3 });
  assert.equal(idleTube(quiet[0]), true);
  assert.equal(lateTube(quiet[0], "steep"), false);
  const behind = addClino([], { id: "z", title: "Level late", frame: "level", rank: 3 });
  assert.equal(lateTube(behind[0], "steep"), true);
  assert.equal(lateTube({ ...behind[0], rank: 9 }, "steep"), false);
  const rushed = addClino([], { id: "r", title: "Rise spark", frame: "rise", shuttle: "rest", rank: 9 });
  assert.equal(briskTube(rushed[0]), true);
  const rested = addClino([], { id: "s", title: "Steep sink", frame: "steep", shuttle: "sink", wait: 90 });
  assert.equal(restingTube(rested[0]), true);
  assert.equal(lengthenClino(rested, "s")[0].wait, 90);
  assert.equal(lengthenClino([{ ...rested[0], wait: null }], "s")[0].wait, 20);
  assert.equal(lengthenClino(first, "a")[0].wait, 40);
  assert.equal(shortenClino(first, "a")[0].wait, 20);
  assert.equal(shortenClino([{ ...first[0], wait: null }], "a")[0].wait, 90);
  assert.equal(cycleMotion(first, "a")[0].shuttle, "rest");
  assert.equal(raiseClino(first, "a")[0].rank, 5);
  assert.equal(lowerClino(first, "a")[0].rank, 3);
  assert.equal(lowerClino([{ ...first[0], rank: 9 }], "a")[0].rank, 7);
  assert.equal(busiestClinoKeeper(quiet), "Sol");
  assert.equal(neighborClinoCount(quiet) >= 0, true);
  assert.match(clinoCsv(first, "steep"), /North card/);
  assert.match(clinoTimeline(first).map((lane) => lane.rank).join(","), /3/);

  const inkBook = addClino(addClino([], { id: "y1", title: "Graph one", dye: "graphite", frame: "level" }), { id: "y2", title: "Graph two", dye: "graphite", frame: "rise" });
  assert.equal(suggestInk(inkBook), "GRAPHITE");
  assert.equal(suggestClinoSpan(rested, 4), 90);

  const views = addClinoView([], { id: "v", name: "Peak", tray: "open", frame: "peak", wait: "20", dye: "ivory", shuttle: "climb", rank: "3" });
  assert.equal(views[0].frame, "peak");
  assert.equal(dropClinoView(views, "v").length, 0);
  assert.equal(readClinoViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(potentialState("HOT"), "set");
  assert.equal(potentialLane("HOT"), "kiln");
  assert.equal(potentialStamp("HOT"), "HO");
  assert.equal(potentialHue("HOT"), "champagne");
  assert.equal(potentialStep("HOT"), 3);
  assert.equal(potentialLeap("HOT"), false);
  assert.equal(potentialKnown("HOT"), true);
  assert.equal(potentialTwin("HOT"), false);
  assert.equal(potentialLane("WARM"), "hearth");
  assert.equal(potentialStamp("WARM"), "WA");
  assert.equal(potentialHue("WARM"), "graphite");
  assert.equal(potentialKnown("warm"), true);
  assert.equal(potentialLeap("WARM"), true);
  assert.equal(potentialTail("WARM"), false);
  assert.equal(potentialTail("NOVA"), true);
  assert.equal(potentialLane("COLD"), "hall");
  assert.equal(potentialStamp("COLD"), "CO");
  assert.equal(potentialHue("COLD"), "ivory");
  assert.equal(potentialKnown("COLD"), false);
  assert.equal(potentialLeap("COLD"), true);
  assert.equal(potentialLeap("HOTEL"), false);
  assert.equal(potentialNotch("HOT-WARM"), true);
  assert.equal(potentialLane("HOT-WARM"), "porch");
  assert.equal(potentialSlash("A/B"), true);
  assert.equal(potentialLane("A/B"), "porch");
  assert.equal(potentialWide("Ann_Marie"), true);
  assert.equal(potentialTwin("Book"), true);
  assert.equal(potentialEcho("Radar"), true);
  assert.equal(potentialCap("HOT"), true);
  assert.equal(potentialCap("hot"), false);
  assert.equal(potentialLane("hot"), "kiln");
  assert.equal(potentialState("12"), "clear");
  assert.equal(potentialState(""), "clear");
  assert.equal(potentialState({ potentialStatus: "HOT", balance: 1 }), "");
  assert.equal(potentialState({ title: "HOT" }), "");
  assert.equal(potentialLane({ code: "WARM" }), "hearth");

  const book = [
    { id: "1", label: "HOT", note: "HOT" },
    { id: "2", label: "WARM", note: "WARM" },
    { id: "3", label: "COLD", note: "COLD" },
  ];
  assert.equal(leadingPotential(book), "kiln");
  assert.match(potentialLanesCsv(book), /kiln,1/);
  assert.match(potentialRowsCsv(book, ["1"]), /HOT,HOT,HO,kiln,champagne/);
  assert.match(potentialRowsCsv(book, ["1"]), /WARM,WA,hearth,graphite/);
  assert.match(potentialRowsCsv(book, ["1"]), /COLD,CO,hall,ivory/);

  const keys = Object.keys(ROUND270_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND270_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND270_COPY[locale][key as keyof typeof ROUND270_COPY.en], "string");
      assert.ok(ROUND270_COPY[locale][key as keyof typeof ROUND270_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "clnTitle"), ROUND270_COPY.tr.clnTitle);
  assert.equal(crmv4Text("de", "ptnTitle"), ROUND270_COPY.de.ptnTitle);
  assert.equal(crmv4Text("ru", "clnSub"), ROUND270_COPY.ru.clnSub);
  assert.equal(crmv4Text("ar", "ptnSub"), ROUND270_COPY.ar.ptnSub);
  assert.equal(crmv4Text("en", "clnLogo"), "7FX");
  assert.equal(crmv4Text("en", "clnTitle"), "Clinometer cards");
  assert.equal(crmv4Text("en", "ptnTitle"), "Potential plates");
  assert.notEqual(ROUND270_COPY.tr.clnTitle, ROUND270_COPY.en.clnTitle);
  assert.equal(crmv4Text("en", "bmtTitle"), "Barometer tubes");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-clino/);
  assert.match(css, /\.c4-potential-index/);
  assert.match(css, /\.c4-clino-ledger|\.c4-clino-board/);
  assert.match(css, /\.c4-potential-bar/);
  assert.match(css, /\.c4-swatch-folio/);
  assert.match(css, /\.c4-lane-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round270.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /potentialStatus:/);
  assert.match(viewFile, /clinoCsv/);
  assert.match(viewFile, /potentialRowsCsv/);
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
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-potential-search/);
  assert.match(viewFile, /clinoTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cln"/);
  assert.match(app, /view === "ptn"/);
  const swatch = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round72.tsx"), "utf8");
  const lane = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round76.tsx"), "utf8");
  assert.match(swatch, /c4-swatch-folio/);
  assert.match(lane, /c4-lane-folio/);
  assert.match(swatch, /clnFolioLead/);
  assert.match(lane, /clnFolioLead/);
  assert.match(swatch, /data-desk="folio"/);
  assert.match(lane, /data-desk="folio"/);
  assert.match(swatch, /data-logo="mono"/);
  assert.match(lane, /data-logo="mono"/);
  assert.equal(swatch.includes("amount"), false);
  assert.equal(lane.includes("amount"), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND270_COPY.en, key);
  const audit = viewFile.match(/"(clnAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND270_COPY.en, key);
  const folioUsed = new Set(`${swatch}\n${lane}`.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(folioUsed)) {
    if (key.startsWith("cln") || key.startsWith("ptn")) assert.ok(key in ROUND270_COPY.en, key);
  }
  console.log("crmv4 round270 tests passed");
}

main();
