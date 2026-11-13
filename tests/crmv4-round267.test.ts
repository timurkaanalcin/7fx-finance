/**
 * Astrolabe retes and given-name plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round267.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND267_COPY } from "../src/lib/crmv4/copy-round267";
import {
  ROUND267_FEATURES,
  activePlate,
  activeAstrolabeSpan,
  activeMotion,
  activeInk,
  activeAstrolabeStar,
  addAstrolabe,
  addAstrolabeView,
  briskRete,
  bulkAstrolabePin,
  busiestAstrolabeKeeper,
  astrolabeCsv,
  astrolabeStar,
  astrolabeTimeline,
  astrolabeSpan,
  plateBand,
  plateGap,
  plateOf,
  cycleMotion,
  dropAstrolabeView,
  fairAstrolabeKeeper,
  inkOf,
  houseInk,
  idleRete,
  lateRete,
  leadingGiven,
  lengthenAstrolabe,
  lowerAstrolabe,
  moveAstrolabeFocus,
  neighborAstrolabeCount,
  overdueRete,
  peakPlate,
  quietPlate,
  raiseAstrolabe,
  readAstrolabeViews,
  restingRete,
  shortenAstrolabe,
  suggestAstrolabeSpan,
  suggestPlate,
  suggestInk,
  motionOf,
  givenCap,
  givenEcho,
  givenHue,
  givenKnown,
  givenLane,
  givenLanesCsv,
  givenLeap,
  givenNotch,
  givenRowsCsv,
  givenSlash,
  givenStamp,
  givenState,
  givenStep,
  givenTail,
  givenTwin,
  givenWide,
} from "../src/lib/crmv4/round267";

function main() {
  assert.equal(ROUND267_FEATURES.length, 25);
  assert.equal(plateOf(" mater "), "mater");
  assert.equal(plateOf("paris"), "");
  assert.equal(astrolabeSpan("10"), 10);
  assert.equal(astrolabeSpan(20), 20);
  assert.equal(astrolabeSpan("40"), 40);
  assert.equal(astrolabeSpan("15"), null);
  assert.equal(astrolabeStar("2"), 2);
  assert.equal(astrolabeStar(4), 4);
  assert.equal(astrolabeStar("6"), 6);
  assert.equal(astrolabeStar("8"), 8);
  assert.equal(astrolabeStar("1"), null);
  assert.equal(astrolabeStar("3"), null);
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("graphite"), "GRAPHITE");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("brass"), "");
  assert.equal(motionOf("lift"), "lift");
  assert.equal(motionOf("hold"), "hold");
  assert.equal(motionOf("set"), "set");
  assert.equal(motionOf("rise"), "");
  assert.equal(peakPlate("mater"), true);
  assert.equal(peakPlate("RULE"), true);
  assert.equal(peakPlate("rete"), false);
  assert.equal(quietPlate("rete"), true);
  assert.equal(quietPlate("alidade"), true);
  assert.equal(quietPlate("mater"), false);
  assert.equal(plateBand("mater"), "early");
  assert.equal(plateBand("rete"), "early");
  assert.equal(plateBand("rule"), "mid");
  assert.equal(plateBand("alidade"), "late");
  assert.equal(plateBand(""), "");
  assert.equal(plateGap("mater", "rete"), 1);
  assert.equal(plateGap("rete", "mater"), -1);
  assert.equal(plateGap("", "mater"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(activePlate("peak"), "peak");
  assert.equal(activePlate("mater"), "mater");
  assert.equal(activePlate("paris"), "all");
  assert.equal(activeAstrolabeSpan("20"), "20");
  assert.equal(activeAstrolabeSpan("9"), "all");
  assert.equal(activeMotion("hold", ["lift", "hold", "set"]), "hold");
  assert.equal(activeMotion("gale", ["lift", "hold", "set"]), "all");
  assert.equal(activeAstrolabeStar("4"), "4");
  assert.equal(activeAstrolabeStar("1"), "all");
  assert.equal(activeInk("graphite"), "graphite");
  assert.equal(activeInk("brass"), "all");
  assert.equal(moveAstrolabeFocus(0, 3, 1), 1);
  assert.equal(moveAstrolabeFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestAstrolabeSpan([], 4), 10);
  assert.equal(suggestAstrolabeSpan([], 8), 20);
  assert.equal(suggestAstrolabeSpan([], 16), 40);
  assert.equal(suggestPlate(4), "mater");
  assert.equal(suggestPlate(12), "rule");
  assert.equal(fairAstrolabeKeeper([], "Nia, Sol"), "Nia");

  const first = addAstrolabe([], {
    id: "a",
    title: "  North rete ",
    note: "",
    weaver: "Nia",
    frame: "mater",
    dye: "ivory",
    shuttle: "lift",
    wait: 10,
    rank: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North rete");
  assert.equal(first[0].note, "");
  assert.equal(first[0].dye, "IVORY");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueRete(first[0]), true);
  assert.equal(addAstrolabe(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addAstrolabe(first, { id: "b", title: "North rete" }).length, 1);
  assert.equal(addAstrolabe(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addAstrolabe([], { id: "d", title: "Bare" })[0].rank, 2);

  const pinned = bulkAstrolabePin(first, ["a"]);
  assert.equal(overdueRete(pinned[0]), false);
  assert.equal(fairAstrolabeKeeper(pinned, "Nia, Sol"), "Nia");
  const quiet = addAstrolabe(pinned, { id: "q", title: "Rete rest", weaver: "Sol", frame: "rete", shuttle: "lift", rank: 2 });
  assert.equal(idleRete(quiet[0]), true);
  assert.equal(lateRete(quiet[0], "alidade"), false);
  const behind = addAstrolabe([], { id: "z", title: "Mater late", frame: "mater", rank: 2 });
  assert.equal(lateRete(behind[0], "alidade"), true);
  assert.equal(lateRete({ ...behind[0], rank: 8 }, "alidade"), false);
  const rushed = addAstrolabe([], { id: "r", title: "Mater spark", frame: "mater", shuttle: "hold", rank: 8 });
  assert.equal(briskRete(rushed[0]), true);
  const rested = addAstrolabe([], { id: "s", title: "Alidade set", frame: "alidade", shuttle: "set", wait: 40 });
  assert.equal(restingRete(rested[0]), true);
  assert.equal(lengthenAstrolabe(rested, "s")[0].wait, 40);
  assert.equal(lengthenAstrolabe([{ ...rested[0], wait: null }], "s")[0].wait, 10);
  assert.equal(lengthenAstrolabe(first, "a")[0].wait, 20);
  assert.equal(shortenAstrolabe(first, "a")[0].wait, 10);
  assert.equal(shortenAstrolabe([{ ...first[0], wait: null }], "a")[0].wait, 40);
  assert.equal(cycleMotion(first, "a")[0].shuttle, "hold");
  assert.equal(raiseAstrolabe(first, "a")[0].rank, 4);
  assert.equal(lowerAstrolabe(first, "a")[0].rank, 2);
  assert.equal(lowerAstrolabe([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestAstrolabeKeeper(quiet), "Sol");
  assert.equal(neighborAstrolabeCount(quiet) >= 0, true);
  assert.match(astrolabeCsv(first, "alidade"), /North rete/);
  assert.match(astrolabeTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const inkBook = addAstrolabe(addAstrolabe([], { id: "y1", title: "Graph one", dye: "graphite", frame: "rete" }), { id: "y2", title: "Graph two", dye: "graphite", frame: "mater" });
  assert.equal(suggestInk(inkBook), "GRAPHITE");
  assert.equal(suggestAstrolabeSpan(rested, 4), 40);

  const views = addAstrolabeView([], { id: "v", name: "Peak", tray: "open", frame: "peak", wait: "10", dye: "ivory", shuttle: "lift", rank: "2" });
  assert.equal(views[0].frame, "peak");
  assert.equal(dropAstrolabeView(views, "v").length, 0);
  assert.equal(readAstrolabeViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(givenState("Ada"), "set");
  assert.equal(givenLane("Ada"), "salon");
  assert.equal(givenStamp("Ada"), "AD");
  assert.equal(givenHue("Ada"), "champagne");
  assert.equal(givenStep("Ada"), 3);
  assert.equal(givenLeap("Ada"), false);
  assert.equal(givenKnown("Ada"), true);
  assert.equal(givenTail("Ada"), true);
  assert.equal(givenLane("Noor"), "gallery");
  assert.equal(givenStamp("Noor"), "NO");
  assert.equal(givenHue("Noor"), "graphite");
  assert.equal(givenKnown("noor"), true);
  assert.equal(givenLeap("Noor"), false);
  assert.equal(givenLane("Maria"), "bay");
  assert.equal(givenStamp("Maria"), "MA");
  assert.equal(givenHue("Maria"), "ivory");
  assert.equal(givenKnown("Maria"), false);
  assert.equal(givenLeap("Maria"), true);
  assert.equal(givenLeap("Marian"), false);
  assert.equal(givenNotch("Mary-Ann"), true);
  assert.equal(givenLane("Mary-Ann"), "court");
  assert.equal(givenSlash("A/B"), true);
  assert.equal(givenLane("A/B"), "court");
  assert.equal(givenWide("Ann_Marie"), true);
  assert.equal(givenTwin("Book"), true);
  assert.equal(givenEcho("Radar"), true);
  assert.equal(givenCap("Ada"), true);
  assert.equal(givenCap("ada"), false);
  assert.equal(givenLane("ada"), "salon");
  assert.equal(givenState("12"), "clear");
  assert.equal(givenState(""), "clear");
  assert.equal(givenState({ firstName: "Ada", balance: 1 }), "");
  assert.equal(givenState({ title: "Ada" }), "");
  assert.equal(givenLane({ name: "Noor" }), "gallery");

  const book = [
    { id: "1", label: "Ada", note: "Ada" },
    { id: "2", label: "Noor", note: "Noor" },
    { id: "3", label: "Maria", note: "Maria" },
  ];
  assert.equal(leadingGiven(book), "salon");
  assert.match(givenLanesCsv(book), /salon,1/);
  assert.match(givenRowsCsv(book, ["1"]), /Ada,Ada,AD,salon,champagne/);
  assert.match(givenRowsCsv(book, ["1"]), /Noor,NO,gallery,graphite/);
  assert.match(givenRowsCsv(book, ["1"]), /Maria,MA,bay,ivory/);

  const keys = Object.keys(ROUND267_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND267_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND267_COPY[locale][key as keyof typeof ROUND267_COPY.en], "string");
      assert.ok(ROUND267_COPY[locale][key as keyof typeof ROUND267_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "astTitle"), ROUND267_COPY.tr.astTitle);
  assert.equal(crmv4Text("de", "gnmTitle"), ROUND267_COPY.de.gnmTitle);
  assert.equal(crmv4Text("ru", "astSub"), ROUND267_COPY.ru.astSub);
  assert.equal(crmv4Text("ar", "gnmSub"), ROUND267_COPY.ar.gnmSub);
  assert.equal(crmv4Text("en", "astLogo"), "7FX");
  assert.equal(crmv4Text("en", "astTitle"), "Astrolabe retes");
  assert.notEqual(ROUND267_COPY.tr.astTitle, ROUND267_COPY.en.astTitle);
  assert.equal(crmv4Text("en", "sxtTitle"), "Sextant sights");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-astrolabe/);
  assert.match(css, /\.c4-given-index/);
  assert.match(css, /\.c4-astrolabe-ledger|\.c4-astrolabe-board/);
  assert.match(css, /\.c4-given-bar/);
  assert.match(css, /\.c4-fin-vitrine/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round267.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /firstName:/);
  assert.match(viewFile, /astrolabeCsv/);
  assert.match(viewFile, /givenRowsCsv/);
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
  assert.match(viewFile, /c4-given-search/);
  assert.match(viewFile, /astrolabeTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "ast"/);
  assert.match(app, /view === "gnm"/);
  const finance = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/views/Finance.tsx"), "utf8");
  assert.match(finance, /c4-fin-vitrine/);
  assert.match(finance, /astFinLead/);
  assert.match(finance, /data-desk="vitrine"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND267_COPY.en, key);
  const audit = viewFile.match(/"(astAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND267_COPY.en, key);
  const finUsed = new Set(finance.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(finUsed)) {
    if (key.startsWith("ast") || key.startsWith("gnm")) assert.ok(key in ROUND267_COPY.en, key);
  }
  console.log("crmv4 round267 tests passed");
}

main();
