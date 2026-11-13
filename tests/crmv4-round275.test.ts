/**
 * Chronometer beats and anchor plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round275.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND275_COPY } from "../src/lib/crmv4/copy-round275";
import {
  ROUND275_FEATURES,
  activeBeat,
  activeEscape,
  activeMetal,
  activeRate,
  activeWatch,
  addBeat,
  addBeatView,
  anchorCap,
  anchorEcho,
  anchorHue,
  anchorKnown,
  anchorLane,
  anchorLanesCsv,
  anchorLeap,
  anchorNotch,
  anchorRowsCsv,
  anchorSlash,
  anchorStamp,
  anchorState,
  anchorStep,
  anchorTail,
  anchorTwin,
  anchorWide,
  beatCsv,
  beatTimeline,
  briskBeat,
  bulkBeatWind,
  busiestKeeper,
  chronoBeat,
  chronoRate,
  cycleEscapement,
  dipRate,
  dropBeatView,
  escapeOf,
  fairKeeper,
  houseMetal,
  idleBeat,
  keenWatch,
  lateBeat,
  leadingAnchor,
  liftRate,
  lowerBeat,
  metalOf,
  moveChronoFocus,
  neighborBeatCount,
  overdueBeat,
  raiseBeat,
  readBeatViews,
  restingBeat,
  stillWatch,
  suggestMetal,
  suggestRate,
  suggestWatch,
  watchBand,
  watchGap,
  watchOf,
} from "../src/lib/crmv4/round275";

function main() {
  assert.equal(ROUND275_FEATURES.length, 25);
  assert.equal(watchOf(" box "), "box");
  assert.equal(watchOf("paris"), "");
  assert.equal(chronoRate("0"), 0);
  assert.equal(chronoRate(2), 2);
  assert.equal(chronoRate("6"), 6);
  assert.equal(chronoRate("4"), null);
  assert.equal(chronoRate("1"), null);
  assert.equal(chronoBeat("2"), 2);
  assert.equal(chronoBeat(4), 4);
  assert.equal(chronoBeat("8"), 8);
  assert.equal(chronoBeat("16"), 16);
  assert.equal(chronoBeat("1"), null);
  assert.equal(chronoBeat("3"), null);
  assert.equal(chronoBeat("32"), null);
  assert.equal(metalOf("ivory"), "IVORY");
  assert.equal(metalOf("graphite"), "GRAPHITE");
  assert.equal(metalOf("champagne"), "CHAMPAGNE");
  assert.equal(metalOf("brass"), "");
  assert.equal(escapeOf("lever"), "lever");
  assert.equal(escapeOf("detent"), "detent");
  assert.equal(escapeOf("cylinder"), "cylinder");
  assert.equal(escapeOf("verge"), "");
  assert.equal(keenWatch("fusee"), true);
  assert.equal(keenWatch("RATE"), true);
  assert.equal(keenWatch("box"), false);
  assert.equal(stillWatch("box"), true);
  assert.equal(stillWatch("gimbal"), true);
  assert.equal(stillWatch("fusee"), false);
  assert.equal(watchBand("box"), "dawn");
  assert.equal(watchBand("gimbal"), "noon");
  assert.equal(watchBand("fusee"), "dusk");
  assert.equal(watchBand("rate"), "night");
  assert.equal(watchBand(""), "");
  assert.equal(watchGap("box", "gimbal"), 1);
  assert.equal(watchGap("gimbal", "box"), -1);
  assert.equal(watchGap("", "box"), null);
  assert.equal(houseMetal("ivory"), true);
  assert.equal(houseMetal("CHAMPAGNE"), true);
  assert.equal(houseMetal("graphite"), false);
  assert.equal(activeWatch("keen"), "keen");
  assert.equal(activeWatch("fusee"), "fusee");
  assert.equal(activeWatch("paris"), "all");
  assert.equal(activeRate("2"), "2");
  assert.equal(activeRate("9"), "all");
  assert.equal(activeEscape("detent", ["lever", "detent", "cylinder"]), "detent");
  assert.equal(activeEscape("presto", ["lever", "detent", "cylinder"]), "all");
  assert.equal(activeBeat("8"), "8");
  assert.equal(activeBeat("1"), "all");
  assert.equal(activeMetal("ivory"), "ivory");
  assert.equal(moveChronoFocus(0, 4, -1), 3);

  const open = {
    id: "a",
    title: "Fusee beat",
    note: "train",
    keeper: "Nia",
    watch: "fusee",
    rate: 0,
    finish: "IVORY",
    escapement: "lever",
    beat: 2,
    tags: [],
    wound: false,
    locked: false,
    cased: false,
    flagged: false,
    audit: "save",
  };
  assert.equal(overdueBeat(open), true);
  assert.equal(overdueBeat({ ...open, wound: true }), false);
  assert.equal(overdueBeat({ ...open, watch: "box" }), false);
  assert.equal(lateBeat({ ...open, watch: "box", beat: 2 }, "rate"), true);
  assert.equal(lateBeat({ ...open, watch: "box", beat: 2 }, "gimbal"), false);
  assert.equal(idleBeat({ ...open, watch: "box", escapement: "lever", beat: 2 }), true);
  assert.equal(briskBeat({ ...open, beat: 16, escapement: "cylinder", watch: "rate" }), true);
  assert.equal(restingBeat({ ...open, rate: 6, escapement: "detent", watch: "rate" }), true);
  assert.equal(suggestRate([], 5), 0);
  assert.equal(suggestRate([], 10), 2);
  assert.equal(suggestRate([], 18), 6);
  assert.equal(suggestRate([open], 18), 0);
  assert.equal(suggestWatch(8), "box");
  assert.equal(suggestWatch(9), "fusee");
  assert.equal(suggestMetal([open]), "IVORY");
  assert.equal(fairKeeper([open, { ...open, id: "b", title: "Other", keeper: "Nia" }], "Ada,Nia"), "Ada");
  assert.equal(busiestKeeper([open]), "Nia");

  let book = addBeat([], { id: "c1", title: "Ridge", keeper: "Ada", watch: "box", rate: 0, finish: "ivory", escapement: "lever", beat: 2, note: "optional" });
  book = addBeat(book, { id: "c1", title: "Ridge again" });
  assert.equal(book.length, 1);
  book = liftRate(book, "c1");
  assert.equal(book[0].rate, 2);
  book = dipRate(book, "c1");
  assert.equal(book[0].rate, 0);
  book = raiseBeat(book, "c1");
  assert.equal(book[0].beat, 4);
  book = lowerBeat(book, "c1");
  assert.equal(book[0].beat, 2);
  book = cycleEscapement(book, "c1");
  assert.equal(book[0].escapement, "detent");
  book = bulkBeatWind(book, ["c1"]);
  assert.equal(book[0].wound, true);
  const views = addBeatView([], { id: "v1", name: "Bench", tray: "bench", watch: "box", keeper: "Ada" });
  assert.equal(readBeatViews(views)[0].watch, "box");
  assert.equal(dropBeatView(views, "v1").length, 0);
  assert.match(beatCsv(book, "rate"), /Ridge,Ada,box/);
  assert.equal(beatTimeline(book).some((lane) => lane.beat === 2), true);
  assert.equal(neighborBeatCount(book), 0);

  assert.equal(anchorState("AFF-100"), "set");
  assert.equal(anchorLane("AFF-100"), "yard");
  assert.equal(anchorStamp("AFF-100"), "AFF");
  assert.equal(anchorHue("AFF-100"), "champagne");
  assert.equal(anchorKnown("aff-100"), true);
  assert.equal(anchorCap("AFF-100"), true);
  assert.equal(anchorCap("aff-100"), false);
  assert.equal(anchorLeap("AFF-100"), false);
  assert.equal(anchorTail("AFF-100"), false);
  assert.equal(anchorNotch("AFF-100"), true);
  assert.equal(anchorLane("HOUSE"), "loft");
  assert.equal(anchorStamp("HOUSE"), "HOU");
  assert.equal(anchorHue("HOUSE"), "graphite");
  assert.equal(anchorKnown("HOUSE"), true);
  assert.equal(anchorLeap("HOUSE"), true);
  assert.equal(anchorTail("HOUSE"), true);
  assert.equal(anchorLane("PARTNER"), "quay");
  assert.equal(anchorHue("PARTNER"), "ivory");
  assert.equal(anchorKnown("PARTNER"), true);
  assert.equal(anchorLane("DEMO"), "closet");
  assert.equal(anchorHue("DEMO"), "ivory");
  assert.equal(anchorTail("DEMO"), true);
  assert.equal(anchorLane("BRAND"), "hall");
  assert.equal(anchorHue("BRAND"), "ivory");
  assert.equal(anchorKnown("BRAND"), true);
  assert.equal(anchorLeap("BRAND"), true);
  assert.equal(anchorStep("BRAND"), 5);
  assert.equal(anchorWide("AT_RISK"), true);
  assert.equal(anchorLane("AT_RISK"), "pier");
  assert.equal(anchorKnown("AT_RISK"), false);
  assert.equal(anchorNotch("AT-RISK"), true);
  assert.equal(anchorSlash("A/B"), true);
  assert.equal(anchorTwin("Book"), true);
  assert.equal(anchorEcho("Radar"), true);
  assert.equal(anchorState("12"), "clear");
  assert.equal(anchorState(""), "clear");
  assert.equal(anchorState({ affiliateA: "HOUSE", balance: 1 }), "");
  assert.equal(anchorState({ title: "HOUSE" }), "");
  assert.equal(anchorLane({ code: "PARTNER" }), "quay");

  const plates = [
    { id: "1", label: "Ada", note: "AFF-100" },
    { id: "2", label: "Bea", note: "HOUSE" },
    { id: "3", label: "Cal", note: "BRAND" },
  ];
  assert.equal(leadingAnchor(plates), "loft");
  assert.match(anchorLanesCsv(plates), /loft,1/);
  assert.match(anchorRowsCsv(plates, ["1"]), /Ada,AFF-100,AFF,yard,champagne/);
  assert.match(anchorRowsCsv(plates, ["1"]), /Bea,HOUSE,HOU,loft,graphite/);
  assert.match(anchorRowsCsv(plates, ["1"]), /Cal,BRAND,BRA,hall,ivory/);

  const keys = Object.keys(ROUND275_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND275_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND275_COPY[locale][key as keyof typeof ROUND275_COPY.en], "string");
      assert.ok(ROUND275_COPY[locale][key as keyof typeof ROUND275_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "cbtTitle"), ROUND275_COPY.tr.cbtTitle);
  assert.equal(crmv4Text("de", "ankTitle"), ROUND275_COPY.de.ankTitle);
  assert.equal(crmv4Text("ru", "cbtSub"), ROUND275_COPY.ru.cbtSub);
  assert.equal(crmv4Text("ar", "ankSub"), ROUND275_COPY.ar.ankSub);
  assert.equal(crmv4Text("en", "cbtLogo"), "7FX");
  assert.equal(crmv4Text("en", "cbtTitle"), "Chronometer beats");
  assert.equal(crmv4Text("en", "ankTitle"), "Anchor plates");
  assert.notEqual(ROUND275_COPY.tr.cbtTitle, ROUND275_COPY.en.cbtTitle);
  assert.equal(crmv4Text("en", "octTitle"), "Octant arcs");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chrono/);
  assert.match(css, /\.c4-anchor-index/);
  assert.match(css, /\.c4-chrono-fusee/);
  assert.match(css, /\.c4-anchor-column/);
  assert.match(css, /\.c4-heat-isotherm/);
  assert.match(css, /\.c4-heat-isotherm-lattice/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round275.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /affiliateA:/);
  assert.match(viewFile, /beatCsv/);
  assert.match(viewFile, /anchorRowsCsv/);
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
  assert.match(viewFile, /suggestMetal/);
  assert.match(viewFile, /c4-anchor-search/);
  assert.match(viewFile, /beatTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "cbt"/);
  assert.match(app, /view === "ank"/);
  const heat = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round64.tsx"), "utf8");
  assert.match(heat, /c4-heat-quay/);
  assert.match(heat, /c4-heat-isotherm/);
  assert.match(heat, /c4-heat-isotherm-lattice/);
  assert.match(heat, /htIsoLead/);
  assert.match(heat, /data-logo="mono"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND275_COPY.en, key);
  const audit = viewFile.match(/"(cbtAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND275_COPY.en, key);
  const named = viewFile.match(/"(cbt|ank|htIso)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND275_COPY.en, key);
  const heatUsed = new Set(heat.match(/v4\("(htIso[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(heatUsed)) assert.ok(key in ROUND275_COPY.en, key);
  console.log("crmv4 round275 tests passed");
}

main();
