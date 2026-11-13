/**
 * Fog bells, quay plates, and the pipeline gallery.
 * Run: TZ=UTC npx tsx tests/crmv4-round277.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND277_COPY } from "../src/lib/crmv4/copy-round277";
import {
  ROUND277_FEATURES,
  activeBead,
  activeGlaze,
  activePitch,
  activeTone,
  activeWatch,
  addBell,
  addBellView,
  bellCsv,
  bellTimeline,
  briskBell,
  bulkBellRing,
  busiestRinger,
  cycleTone,
  dipPitch,
  dropBellView,
  fairRinger,
  fogBead,
  fogPitch,
  glazeOf,
  houseGlaze,
  idleBell,
  keenWatch,
  lateBell,
  leadingQuay,
  liftPitch,
  lowerBead,
  moveBellFocus,
  neighborBellCount,
  overdueBell,
  quayCap,
  quayEcho,
  quayHue,
  quayKnown,
  quayLane,
  quayLanesCsv,
  quayLeap,
  quayNotch,
  quayRowsCsv,
  quaySlash,
  quayStamp,
  quayState,
  quayStep,
  quayTail,
  quayTwin,
  quayWide,
  raiseBead,
  readBellViews,
  restingBell,
  stillWatch,
  suggestGlaze,
  suggestPitch,
  suggestWatch,
  toneOf,
  watchBand,
  watchGap,
  watchOf,
  type FogBell,
  type QuayRow,
} from "../src/lib/crmv4/round277";

function card(partial: Partial<FogBell> & { id: string; title: string }): FogBell {
  return {
    note: "",
    helmsman: "",
    station: "",
    angle: null,
    finish: "",
    vane: "",
    ring: 2,
    tags: [],
    sighted: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND277_FEATURES.length, 25);
  assert.equal(watchOf(" lee "), "lee");
  assert.equal(watchOf("paris"), "");
  assert.equal(fogPitch("10"), 10);
  assert.equal(fogPitch(30), 30);
  assert.equal(fogPitch("60"), 60);
  assert.equal(fogPitch("4"), null);
  assert.equal(fogPitch("2"), null);
  assert.equal(fogBead("2"), 2);
  assert.equal(fogBead(4), 4);
  assert.equal(fogBead("6"), 6);
  assert.equal(fogBead("8"), 8);
  assert.equal(fogBead("1"), null);
  assert.equal(fogBead("3"), null);
  assert.equal(fogBead("16"), null);
  assert.equal(glazeOf("ivory"), "IVORY");
  assert.equal(glazeOf("graphite"), "GRAPHITE");
  assert.equal(glazeOf("champagne"), "CHAMPAGNE");
  assert.equal(glazeOf("brass"), "");
  assert.equal(toneOf("glass"), "glass");
  assert.equal(toneOf("cloth"), "cloth");
  assert.equal(toneOf("brass"), "brass");
  assert.equal(toneOf("plain"), "");
  assert.equal(keenWatch("reach"), true);
  assert.equal(keenWatch("RUN"), true);
  assert.equal(keenWatch("lee"), false);
  assert.equal(stillWatch("lee"), true);
  assert.equal(stillWatch("luff"), true);
  assert.equal(stillWatch("reach"), false);
  assert.equal(watchBand("lee"), "dawn");
  assert.equal(watchBand("luff"), "noon");
  assert.equal(watchBand("reach"), "dusk");
  assert.equal(watchBand("run"), "night");
  assert.equal(watchBand(""), "");
  assert.equal(watchGap("lee", "luff"), 1);
  assert.equal(watchGap("luff", "lee"), -1);
  assert.equal(watchGap("", "lee"), null);
  assert.equal(houseGlaze("ivory"), true);
  assert.equal(houseGlaze("CHAMPAGNE"), true);
  assert.equal(houseGlaze("graphite"), false);
  assert.equal(activeWatch("keen"), "keen");
  assert.equal(activeWatch("reach"), "reach");
  assert.equal(activeWatch("paris"), "all");
  assert.equal(activePitch("30"), "30");
  assert.equal(activePitch("9"), "all");
  assert.equal(activeTone("cloth", ["glass", "cloth", "brass"]), "cloth");
  assert.equal(activeTone("presto", ["glass", "cloth", "brass"]), "all");
  assert.equal(activeBead("6"), "6");
  assert.equal(activeBead("1"), "all");
  assert.equal(activeGlaze("ivory"), "ivory");
  assert.equal(moveBellFocus(0, 4, 1), 1);
  assert.equal(moveBellFocus(0, 4, -1), 3);
  assert.equal(suggestGlaze([]), "IVORY");
  assert.equal(suggestPitch([], 5), 10);
  assert.equal(suggestPitch([], 10), 30);
  assert.equal(suggestPitch([], 16), 60);
  assert.equal(suggestWatch(7), "lee");
  assert.equal(suggestWatch(9), "reach");

  const saved = addBell([], { id: "a", title: "North", note: "keep", helmsman: "Ada", station: "reach", finish: "ivory", vane: "glass", angle: 10, ring: 2, tags: "a b c" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].angle, 10);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addBell(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(liftPitch(saved, "a")[0].angle, 30);
  assert.equal(dipPitch([{ ...saved[0], angle: null }], "a")[0].angle, 60);
  assert.equal(raiseBead(saved, "a")[0].ring, 4);
  assert.equal(raiseBead([{ ...saved[0], ring: 8 }], "a")[0].ring, 8);
  assert.equal(lowerBead(saved, "a")[0].ring, 2);
  assert.equal(cycleTone(saved, "a")[0].vane, "cloth");
  assert.equal(fairRinger([
    card({ id: "1", title: "One", helmsman: "Ada", station: "lee" }),
    card({ id: "2", title: "Two", helmsman: "Ada", station: "lee" }),
    card({ id: "3", title: "Three", helmsman: "Bea", station: "luff", sighted: true }),
  ], "Ada,Bea"), "Bea");
  assert.equal(overdueBell(card({ id: "o", title: "Late", station: "reach", angle: 10 })), true);
  assert.equal(overdueBell(card({ id: "o2", title: "Seen", station: "reach", angle: 10, sighted: true })), false);
  assert.equal(lateBell(card({ id: "l", title: "Behind", station: "lee", ring: 2 }), "run"), true);
  assert.equal(idleBell(card({ id: "i", title: "Still", station: "lee", vane: "glass", ring: 2 })), true);
  assert.equal(briskBell(card({ id: "b", title: "Fast", station: "run", vane: "brass", ring: 8 })), true);
  assert.equal(restingBell(card({ id: "r", title: "Rest", station: "run", vane: "cloth", angle: 60 })), true);
  assert.equal(neighborBellCount([
    card({ id: "n1", title: "A", ring: 2 }),
    card({ id: "n2", title: "B", ring: 4 }),
  ]), 2);
  assert.equal(busiestRinger([
    card({ id: "h1", title: "A", helmsman: "Ada" }),
    card({ id: "h2", title: "B", helmsman: "Ada" }),
    card({ id: "h3", title: "C", helmsman: "Bea" }),
  ]), "Ada");
  assert.equal(bulkBellRing(saved, ["a"])[0].sighted, true);
  const views = addBellView([], { id: "v", name: "Open", tray: "deck", station: "lee", angle: "10", ring: "2", vane: "glass", finish: "ivory" });
  assert.equal(views.length, 1);
  assert.equal(dropBellView(views, "v").length, 0);
  assert.equal(readBellViews(views)[0].station, "lee");
  assert.match(bellCsv(saved, "run"), /title,helmsman,station/);
  assert.equal(bellTimeline(saved)[0].ring, 2);

  const rows: QuayRow[] = [
    { id: "1", label: "Ada desk", note: { country: "TR" } },
    { id: "2", label: "Bea desk", note: { country: "DE" } },
    { id: "3", label: "Cal desk", note: { country: "GB" } },
    { id: "4", label: "Deep", note: { country: "AE12" } },
    { id: "5", label: "Split", note: { country: "aff-b" } },
    { id: "6", label: "Known", note: { country: "cy" } },
    { id: "7", label: "Money", note: { country: "TR", amount: 4 } },
  ];
  assert.equal(quayLane(rows[0].note), "quay");
  assert.equal(quayLane(rows[1].note), "wharf");
  assert.equal(quayLane(rows[2].note), "mole");
  assert.equal(quayLane(rows[3].note), "pier");
  assert.equal(quayLane(rows[4].note), "channel");
  assert.equal(quayLane(rows[5].note), "roadstead");
  assert.equal(quayState(rows[6].note), "");
  assert.equal(quayHue(rows[0].note), "graphite");
  assert.equal(quayHue(rows[3].note), "champagne");
  assert.equal(quayHue(rows[1].note), "ivory");
  assert.equal(quayStamp(rows[0].note), "TR");
  assert.equal(quayKnown(rows[5].note), true);
  assert.equal(quayEcho({ country: "aba" }), true);
  assert.equal(quayLeap({ country: "port" }), true);
  assert.equal(quayTwin({ country: "letter" }), true);
  assert.equal(quayWide({ country: "ab_cd" }), true);
  assert.equal(quayNotch({ country: "ab-cd" }), true);
  assert.equal(quaySlash({ country: "ab/cd" }), true);
  assert.equal(quayCap({ country: "Tr" }), true);
  assert.equal(quayTail({ country: "idea" }), true);
  assert.equal(quayStep(rows[0].note), 2);
  assert.equal(leadingQuay(rows), "quay");
  assert.match(quayLanesCsv(rows), /quay,1/);
  assert.match(quayRowsCsv(rows, ["1"]), /Ada desk,TR,TR,quay,graphite/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND277_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND277_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "fglTitle"), ROUND277_COPY.tr.fglTitle);
  assert.equal(crmv4Text("de", "qplTitle"), ROUND277_COPY.de.qplTitle);
  assert.equal(crmv4Text("ru", "fglSub"), ROUND277_COPY.ru.fglSub);
  assert.equal(crmv4Text("ar", "qplSub"), ROUND277_COPY.ar.qplSub);
  assert.equal(crmv4Text("en", "fglLogo"), "7FX");
  assert.equal(crmv4Text("en", "fglTitle"), "Fog bells");
  assert.equal(crmv4Text("en", "qplTitle"), "Quay plates");
  assert.notEqual(ROUND277_COPY.tr.fglTitle, ROUND277_COPY.en.fglTitle);
  assert.equal(crmv4Text("en", "plrTitle"), "Pelorus bearings");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-fogbell/);
  assert.match(css, /\.c4-quay-index/);
  assert.match(css, /\.c4-fogbell-column/);
  assert.match(css, /\.c4-quay-column/);
  assert.match(css, /\.c4-pipeline-gallery/);
  assert.match(css, /\.c4-pipeline-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round277.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /country:/);
  assert.match(viewFile, /bellCsv/);
  assert.match(viewFile, /quayRowsCsv/);
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
  assert.match(viewFile, /suggestGlaze/);
  assert.match(viewFile, /c4-quay-search/);
  assert.match(viewFile, /bellTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "fgl"/);
  assert.match(app, /view === "qpl"/);
  const board = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round41.tsx"), "utf8");
  assert.match(board, /c4-pipeline-gallery/);
  assert.match(board, /c4-pipeline-mast/);
  assert.match(board, /c4-pipeline-column/);
  assert.match(board, /pipGalLead/);
  assert.match(board, /data-logo="mono"/);
  assert.match(board, /data-gallery="1"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND277_COPY.en, key);
  const named = viewFile.match(/"(fgl|qpl)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND277_COPY.en, key);
  const boardUsed = new Set(board.match(/v4\("(pipGal[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(boardUsed)) assert.ok(key in ROUND277_COPY.en, key);
  console.log("crmv4 round277 tests passed");
}

main();
