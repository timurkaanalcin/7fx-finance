/**
 * Hygrometer cards and registry plates.
 * Run: TZ=UTC npx tsx tests/crmv4-round269.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND269_COPY } from "../src/lib/crmv4/copy-round269";
import {
  ROUND269_FEATURES,
  activeLimb,
  activeHygroSpan,
  activeMotion,
  activeInk,
  activeHygroMark,
  addHygro,
  addHygroView,
  briskTube,
  bulkHygroPin,
  busiestHygroKeeper,
  hygroCsv,
  hygroMark,
  hygroTimeline,
  hygroSpan,
  limbBand,
  limbGap,
  limbOf,
  cycleMotion,
  dropHygroView,
  fairHygroKeeper,
  inkOf,
  houseInk,
  idleTube,
  lateTube,
  leadingRegistry,
  lengthenHygro,
  lowerHygro,
  moveHygroFocus,
  neighborHygroCount,
  overdueTube,
  peakLimb,
  quietLimb,
  raiseHygro,
  readHygroViews,
  restingTube,
  shortenHygro,
  suggestHygroSpan,
  suggestLimb,
  suggestInk,
  motionOf,
  registryCap,
  registryEcho,
  registryHue,
  registryKnown,
  registryLane,
  registryLanesCsv,
  registryLeap,
  registryNotch,
  registryRowsCsv,
  registrySlash,
  registryStamp,
  registryState,
  registryStep,
  registryTail,
  registryTwin,
  registryWide,
} from "../src/lib/crmv4/round269";

function main() {
  assert.equal(ROUND269_FEATURES.length, 25);
  assert.equal(limbOf(" dry "), "dry");
  assert.equal(limbOf("paris"), "");
  assert.equal(hygroSpan("15"), 15);
  assert.equal(hygroSpan(30), 30);
  assert.equal(hygroSpan("60"), 60);
  assert.equal(hygroSpan("12"), null);
  assert.equal(hygroMark("2"), 2);
  assert.equal(hygroMark(4), 4);
  assert.equal(hygroMark("6"), 6);
  assert.equal(hygroMark("8"), 8);
  assert.equal(hygroMark("1"), null);
  assert.equal(hygroMark("3"), null);
  assert.equal(inkOf("ivory"), "IVORY");
  assert.equal(inkOf("graphite"), "GRAPHITE");
  assert.equal(inkOf("champagne"), "CHAMPAGNE");
  assert.equal(inkOf("brass"), "");
  assert.equal(motionOf("swell"), "swell");
  assert.equal(motionOf("hold"), "hold");
  assert.equal(motionOf("ebb"), "ebb");
  assert.equal(motionOf("lift"), "");
  assert.equal(peakLimb("dry"), true);
  assert.equal(peakLimb("DAMP"), true);
  assert.equal(peakLimb("even"), false);
  assert.equal(quietLimb("even"), true);
  assert.equal(quietLimb("mist"), true);
  assert.equal(quietLimb("dry"), false);
  assert.equal(limbBand("dry"), "early");
  assert.equal(limbBand("even"), "early");
  assert.equal(limbBand("damp"), "mid");
  assert.equal(limbBand("mist"), "late");
  assert.equal(limbBand(""), "");
  assert.equal(limbGap("dry", "even"), 1);
  assert.equal(limbGap("even", "dry"), -1);
  assert.equal(limbGap("", "dry"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("CHAMPAGNE"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(activeLimb("peak"), "peak");
  assert.equal(activeLimb("dry"), "dry");
  assert.equal(activeLimb("paris"), "all");
  assert.equal(activeHygroSpan("30"), "30");
  assert.equal(activeHygroSpan("9"), "all");
  assert.equal(activeMotion("hold", ["swell", "hold", "ebb"]), "hold");
  assert.equal(activeMotion("gale", ["swell", "hold", "ebb"]), "all");
  assert.equal(activeHygroMark("4"), "4");
  assert.equal(activeHygroMark("1"), "all");
  assert.equal(activeInk("graphite"), "graphite");
  assert.equal(activeInk("brass"), "all");
  assert.equal(moveHygroFocus(0, 3, 1), 1);
  assert.equal(moveHygroFocus(0, 3, -1), 2);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestHygroSpan([], 4), 15);
  assert.equal(suggestHygroSpan([], 8), 30);
  assert.equal(suggestHygroSpan([], 16), 60);
  assert.equal(suggestLimb(4), "dry");
  assert.equal(suggestLimb(12), "damp");
  assert.equal(fairHygroKeeper([], "Nia, Sol"), "Nia");

  const first = addHygro([], {
    id: "a",
    title: "  North card ",
    note: "",
    weaver: "Nia",
    frame: "dry",
    dye: "ivory",
    shuttle: "swell",
    wait: 15,
    rank: 2,
    tags: "a a b",
  });
  assert.equal(first.length, 1);
  assert.equal(first[0].title, "North card");
  assert.equal(first[0].note, "");
  assert.equal(first[0].dye, "IVORY");
  assert.equal(first[0].tags.join(""), "ab");
  assert.equal(first[0].audit, "save");
  assert.equal(overdueTube(first[0]), true);
  assert.equal(addHygro(first, { id: "a", title: "Other" }).length, 1);
  assert.equal(addHygro(first, { id: "b", title: "North card" }).length, 1);
  assert.equal(addHygro(first, { id: "b", title: "   " }).length, 1);
  assert.equal(addHygro([], { id: "d", title: "Bare" })[0].rank, 2);

  const pinned = bulkHygroPin(first, ["a"]);
  assert.equal(overdueTube(pinned[0]), false);
  assert.equal(fairHygroKeeper(pinned, "Nia, Sol"), "Nia");
  const quiet = addHygro(pinned, { id: "q", title: "Even rest", weaver: "Sol", frame: "even", shuttle: "swell", rank: 2 });
  assert.equal(idleTube(quiet[0]), true);
  assert.equal(lateTube(quiet[0], "mist"), false);
  const behind = addHygro([], { id: "z", title: "Dry late", frame: "dry", rank: 2 });
  assert.equal(lateTube(behind[0], "mist"), true);
  assert.equal(lateTube({ ...behind[0], rank: 8 }, "mist"), false);
  const rushed = addHygro([], { id: "r", title: "Dry spark", frame: "dry", shuttle: "hold", rank: 8 });
  assert.equal(briskTube(rushed[0]), true);
  const rested = addHygro([], { id: "s", title: "Mist ebb", frame: "mist", shuttle: "ebb", wait: 60 });
  assert.equal(restingTube(rested[0]), true);
  assert.equal(lengthenHygro(rested, "s")[0].wait, 60);
  assert.equal(lengthenHygro([{ ...rested[0], wait: null }], "s")[0].wait, 15);
  assert.equal(lengthenHygro(first, "a")[0].wait, 30);
  assert.equal(shortenHygro(first, "a")[0].wait, 15);
  assert.equal(shortenHygro([{ ...first[0], wait: null }], "a")[0].wait, 60);
  assert.equal(cycleMotion(first, "a")[0].shuttle, "hold");
  assert.equal(raiseHygro(first, "a")[0].rank, 4);
  assert.equal(lowerHygro(first, "a")[0].rank, 2);
  assert.equal(lowerHygro([{ ...first[0], rank: 8 }], "a")[0].rank, 6);
  assert.equal(busiestHygroKeeper(quiet), "Sol");
  assert.equal(neighborHygroCount(quiet) >= 0, true);
  assert.match(hygroCsv(first, "mist"), /North card/);
  assert.match(hygroTimeline(first).map((lane) => lane.rank).join(","), /2/);

  const inkBook = addHygro(addHygro([], { id: "y1", title: "Graph one", dye: "graphite", frame: "even" }), { id: "y2", title: "Graph two", dye: "graphite", frame: "dry" });
  assert.equal(suggestInk(inkBook), "GRAPHITE");
  assert.equal(suggestHygroSpan(rested, 4), 60);

  const views = addHygroView([], { id: "v", name: "Peak", tray: "open", frame: "peak", wait: "15", dye: "ivory", shuttle: "swell", rank: "2" });
  assert.equal(views[0].frame, "peak");
  assert.equal(dropHygroView(views, "v").length, 0);
  assert.equal(readHygroViews([{ id: "v", name: "Peak", tray: "nope" }])[0].tray, "open");

  assert.equal(registryState("TR"), "set");
  assert.equal(registryLane("TR"), "quay");
  assert.equal(registryStamp("TR"), "TR");
  assert.equal(registryHue("TR"), "champagne");
  assert.equal(registryStep("TR"), 2);
  assert.equal(registryLeap("TR"), false);
  assert.equal(registryKnown("TR"), true);
  assert.equal(registryTwin("TR"), false);
  assert.equal(registryLane("DE"), "pier");
  assert.equal(registryStamp("DE"), "DE");
  assert.equal(registryHue("DE"), "graphite");
  assert.equal(registryKnown("de"), true);
  assert.equal(registryLeap("DE"), false);
  assert.equal(registryTail("DE"), true);
  assert.equal(registryLane("Paris"), "dock");
  assert.equal(registryStamp("Paris"), "PA");
  assert.equal(registryHue("Paris"), "champagne");
  assert.equal(registryKnown("Paris"), false);
  assert.equal(registryLeap("Paris"), true);
  assert.equal(registryLeap("Marian"), false);
  assert.equal(registryNotch("Mary-Ann"), true);
  assert.equal(registryLane("Mary-Ann"), "buoy");
  assert.equal(registrySlash("A/B"), true);
  assert.equal(registryLane("A/B"), "buoy");
  assert.equal(registryWide("Ann_Marie"), true);
  assert.equal(registryTwin("Book"), true);
  assert.equal(registryEcho("Radar"), true);
  assert.equal(registryCap("TR"), true);
  assert.equal(registryCap("tr"), false);
  assert.equal(registryLane("tr"), "quay");
  assert.equal(registryState("12"), "clear");
  assert.equal(registryState(""), "clear");
  assert.equal(registryState({ registrationCountry: "TR", balance: 1 }), "");
  assert.equal(registryState({ title: "TR" }), "");
  assert.equal(registryLane({ code: "DE" }), "pier");

  const book = [
    { id: "1", label: "TR", note: "TR" },
    { id: "2", label: "DE", note: "DE" },
    { id: "3", label: "Paris", note: "Paris" },
  ];
  assert.equal(leadingRegistry(book), "quay");
  assert.match(registryLanesCsv(book), /quay,1/);
  assert.match(registryRowsCsv(book, ["1"]), /TR,TR,TR,quay,champagne/);
  assert.match(registryRowsCsv(book, ["1"]), /DE,DE,pier,graphite/);
  assert.match(registryRowsCsv(book, ["1"]), /Paris,PA,dock,champagne/);

  const keys = Object.keys(ROUND269_COPY.en);
  assert.ok(keys.length >= 150);
  for (const locale of ["tr", "de", "ru", "ar"] as const) {
    assert.deepEqual(Object.keys(ROUND269_COPY[locale]).sort(), keys.slice().sort());
    for (const key of keys) {
      assert.equal(typeof ROUND269_COPY[locale][key as keyof typeof ROUND269_COPY.en], "string");
      assert.ok(ROUND269_COPY[locale][key as keyof typeof ROUND269_COPY.en].length > 0);
    }
  }
  assert.equal(crmv4Text("tr", "hygTitle"), ROUND269_COPY.tr.hygTitle);
  assert.equal(crmv4Text("de", "rgsTitle"), ROUND269_COPY.de.rgsTitle);
  assert.equal(crmv4Text("ru", "hygSub"), ROUND269_COPY.ru.hygSub);
  assert.equal(crmv4Text("ar", "rgsSub"), ROUND269_COPY.ar.rgsSub);
  assert.equal(crmv4Text("en", "hygLogo"), "7FX");
  assert.equal(crmv4Text("en", "hygTitle"), "Hygrometer cards");
  assert.notEqual(ROUND269_COPY.tr.hygTitle, ROUND269_COPY.en.hygTitle);
  assert.equal(crmv4Text("en", "bmtTitle"), "Barometer tubes");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-hygro/);
  assert.match(css, /\.c4-registry-index/);
  assert.match(css, /\.c4-hygro-ledger|\.c4-hygro-board/);
  assert.match(css, /\.c4-registry-bar/);
  assert.match(css, /\.c4-shield-folio/);
  assert.match(css, /\.c4-sticky-folio/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round269.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /registrationCountry:/);
  assert.match(viewFile, /hygroCsv/);
  assert.match(viewFile, /registryRowsCsv/);
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
  assert.match(viewFile, /c4-registry-search/);
  assert.match(viewFile, /hygroTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "hyg"/);
  assert.match(app, /view === "rgs"/);
  const folio = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round74.tsx"), "utf8");
  assert.match(folio, /c4-shield-folio/);
  assert.match(folio, /c4-sticky-folio/);
  assert.match(folio, /hygFolioLead/);
  assert.match(folio, /data-desk="folio"/);
  assert.match(folio, /data-logo="mono"/);
  assert.equal(folio.includes("amount"), false);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND269_COPY.en, key);
  const audit = viewFile.match(/"(hygAudit[a-zA-Z]+)"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of audit) assert.ok(key in ROUND269_COPY.en, key);
  const folioUsed = new Set(folio.match(/v4\("([a-zA-Z]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(folioUsed)) {
    if (key.startsWith("hyg") || key.startsWith("rgs")) assert.ok(key in ROUND269_COPY.en, key);
  }
  console.log("crmv4 round269 tests passed");
}

main();
