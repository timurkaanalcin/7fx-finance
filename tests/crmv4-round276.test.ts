/**
 * Pelorus bearings, sounding plates, and the customer cabinet.
 * Run: TZ=UTC npx tsx tests/crmv4-round276.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND276_COPY } from "../src/lib/crmv4/copy-round276";
import {
  ROUND276_FEATURES,
  activeAngle,
  activeMetal,
  activeRing,
  activeStation,
  activeVane,
  addBearing,
  addBearingView,
  bearingCsv,
  bearingTimeline,
  briskBearing,
  bulkBearingSight,
  busiestHelmsman,
  cycleVane,
  dipAngle,
  dropBearingView,
  fairHelmsman,
  houseMetal,
  idleBearing,
  keenStation,
  lateBearing,
  leadingSounding,
  liftAngle,
  lowerRing,
  metalOf,
  movePelorusFocus,
  neighborBearingCount,
  overdueBearing,
  pelorusAngle,
  pelorusRing,
  raiseRing,
  readBearingViews,
  restingBearing,
  soundingCap,
  soundingEcho,
  soundingHue,
  soundingKnown,
  soundingLane,
  soundingLanesCsv,
  soundingLeap,
  soundingNotch,
  soundingRowsCsv,
  soundingSlash,
  soundingStamp,
  soundingState,
  soundingStep,
  soundingTail,
  soundingTwin,
  soundingWide,
  stationBand,
  stationGap,
  stationOf,
  stillStation,
  suggestAngle,
  suggestMetal,
  suggestStation,
  vaneOf,
  type PelorusBearing,
  type SoundingRow,
} from "../src/lib/crmv4/round276";

function card(partial: Partial<PelorusBearing> & { id: string; title: string }): PelorusBearing {
  return {
    note: "",
    helmsman: "",
    station: "",
    angle: null,
    finish: "",
    vane: "",
    ring: 1,
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
  assert.equal(ROUND276_FEATURES.length, 25);
  assert.equal(stationOf(" bow "), "bow");
  assert.equal(stationOf("paris"), "");
  assert.equal(pelorusAngle("0"), 0);
  assert.equal(pelorusAngle(45), 45);
  assert.equal(pelorusAngle("90"), 90);
  assert.equal(pelorusAngle("4"), null);
  assert.equal(pelorusAngle("2"), null);
  assert.equal(pelorusRing("1"), 1);
  assert.equal(pelorusRing(3), 3);
  assert.equal(pelorusRing("5"), 5);
  assert.equal(pelorusRing("7"), 7);
  assert.equal(pelorusRing("2"), null);
  assert.equal(pelorusRing("4"), null);
  assert.equal(pelorusRing("16"), null);
  assert.equal(metalOf("ivory"), "IVORY");
  assert.equal(metalOf("graphite"), "GRAPHITE");
  assert.equal(metalOf("champagne"), "CHAMPAGNE");
  assert.equal(metalOf("brass"), "");
  assert.equal(vaneOf("plain"), "plain");
  assert.equal(vaneOf("shaded"), "shaded");
  assert.equal(vaneOf("mirrored"), "mirrored");
  assert.equal(vaneOf("lever"), "");
  assert.equal(keenStation("quarter"), true);
  assert.equal(keenStation("STERN"), true);
  assert.equal(keenStation("bow"), false);
  assert.equal(stillStation("bow"), true);
  assert.equal(stillStation("beam"), true);
  assert.equal(stillStation("quarter"), false);
  assert.equal(stationBand("bow"), "dawn");
  assert.equal(stationBand("beam"), "noon");
  assert.equal(stationBand("quarter"), "dusk");
  assert.equal(stationBand("stern"), "night");
  assert.equal(stationBand(""), "");
  assert.equal(stationGap("bow", "beam"), 1);
  assert.equal(stationGap("beam", "bow"), -1);
  assert.equal(stationGap("", "bow"), null);
  assert.equal(houseMetal("ivory"), true);
  assert.equal(houseMetal("CHAMPAGNE"), true);
  assert.equal(houseMetal("graphite"), false);
  assert.equal(activeStation("keen"), "keen");
  assert.equal(activeStation("quarter"), "quarter");
  assert.equal(activeStation("paris"), "all");
  assert.equal(activeAngle("45"), "45");
  assert.equal(activeAngle("9"), "all");
  assert.equal(activeVane("shaded", ["plain", "shaded", "mirrored"]), "shaded");
  assert.equal(activeVane("presto", ["plain", "shaded", "mirrored"]), "all");
  assert.equal(activeRing("5"), "5");
  assert.equal(activeRing("2"), "all");
  assert.equal(activeMetal("ivory"), "ivory");
  assert.equal(movePelorusFocus(0, 4, 1), 1);
  assert.equal(movePelorusFocus(0, 4, -1), 3);
  assert.equal(suggestMetal([]), "IVORY");
  assert.equal(suggestAngle([], 6), 0);
  assert.equal(suggestAngle([], 10), 45);
  assert.equal(suggestAngle([], 18), 90);
  assert.equal(suggestStation(8), "bow");
  assert.equal(suggestStation(10), "quarter");

  const saved = addBearing([], { id: "a", title: "North", note: "keep", helmsman: "Ada", station: "quarter", finish: "ivory", vane: "plain", angle: 0, ring: 1, tags: "a b c" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].audit, "save");
  assert.equal(saved[0].angle, 0);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addBearing(saved, { id: "a", title: "Other" }).length, 1);
  assert.equal(liftAngle(saved, "a")[0].angle, 45);
  assert.equal(dipAngle([{ ...saved[0], angle: null }], "a")[0].angle, 90);
  assert.equal(raiseRing(saved, "a")[0].ring, 3);
  assert.equal(raiseRing([{ ...saved[0], ring: 7 }], "a")[0].ring, 7);
  assert.equal(lowerRing(saved, "a")[0].ring, 1);
  assert.equal(cycleVane(saved, "a")[0].vane, "shaded");
  assert.equal(fairHelmsman([
    card({ id: "1", title: "One", helmsman: "Ada", station: "bow" }),
    card({ id: "2", title: "Two", helmsman: "Ada", station: "bow" }),
    card({ id: "3", title: "Three", helmsman: "Bea", station: "beam", sighted: true }),
  ], "Ada,Bea"), "Bea");
  assert.equal(overdueBearing(card({ id: "o", title: "Late", station: "quarter", angle: 0 })), true);
  assert.equal(overdueBearing(card({ id: "o2", title: "Seen", station: "quarter", angle: 0, sighted: true })), false);
  assert.equal(lateBearing(card({ id: "l", title: "Behind", station: "bow", ring: 1 }), "stern"), true);
  assert.equal(idleBearing(card({ id: "i", title: "Still", station: "bow", vane: "plain", ring: 1 })), true);
  assert.equal(briskBearing(card({ id: "b", title: "Fast", station: "stern", vane: "mirrored", ring: 7 })), true);
  assert.equal(restingBearing(card({ id: "r", title: "Rest", station: "stern", vane: "shaded", angle: 90 })), true);
  assert.equal(neighborBearingCount([
    card({ id: "n1", title: "A", ring: 1 }),
    card({ id: "n2", title: "B", ring: 3 }),
  ]), 2);
  assert.equal(busiestHelmsman([
    card({ id: "h1", title: "A", helmsman: "Ada" }),
    card({ id: "h2", title: "B", helmsman: "Ada" }),
    card({ id: "h3", title: "C", helmsman: "Bea" }),
  ]), "Ada");
  assert.equal(bulkBearingSight(saved, ["a"])[0].sighted, true);
  const views = addBearingView([], { id: "v", name: "Open", tray: "bridge", station: "bow", angle: "0", ring: "1", vane: "plain", finish: "ivory" });
  assert.equal(views.length, 1);
  assert.equal(dropBearingView(views, "v").length, 0);
  assert.equal(readBearingViews(views)[0].station, "bow");
  assert.match(bearingCsv(saved, "stern"), /title,helmsman,station/);
  assert.equal(bearingTimeline(saved)[0].ring, 1);

  const rows: SoundingRow[] = [
    { id: "1", label: "Port desk", note: { affiliateB: "PORT" } },
    { id: "2", label: "Road desk", note: { affiliateB: "ROAD" } },
    { id: "3", label: "Bay desk", note: { affiliateB: "BAY" } },
    { id: "4", label: "Deep", note: { affiliateB: "SND12" } },
    { id: "5", label: "Split", note: { affiliateB: "aff-b" } },
    { id: "6", label: "Known", note: { affiliateB: "sound" } },
    { id: "7", label: "Money", note: { affiliateB: "PORT", amount: 4 } },
  ];
  assert.equal(soundingLane(rows[0].note), "harbor");
  assert.equal(soundingLane(rows[1].note), "road");
  assert.equal(soundingLane(rows[2].note), "cove");
  assert.equal(soundingLane(rows[3].note), "fathom");
  assert.equal(soundingLane(rows[4].note), "channel");
  assert.equal(soundingLane(rows[5].note), "estuary");
  assert.equal(soundingState(rows[6].note), "");
  assert.equal(soundingHue(rows[0].note), "graphite");
  assert.equal(soundingHue(rows[3].note), "champagne");
  assert.equal(soundingHue(rows[1].note), "ivory");
  assert.equal(soundingStamp(rows[0].note), "POR");
  assert.equal(soundingKnown(rows[5].note), true);
  assert.equal(soundingEcho({ affiliateB: "aba" }), true);
  assert.equal(soundingLeap(rows[5].note), true);
  assert.equal(soundingTwin({ affiliateB: "letter" }), true);
  assert.equal(soundingWide({ affiliateB: "ab_cd" }), true);
  assert.equal(soundingNotch({ affiliateB: "ab-cd" }), true);
  assert.equal(soundingSlash({ affiliateB: "ab/cd" }), true);
  assert.equal(soundingCap({ affiliateB: "Port" }), true);
  assert.equal(soundingTail({ affiliateB: "idea" }), true);
  assert.equal(soundingStep(rows[0].note), 4);
  assert.equal(leadingSounding(rows), "harbor");
  assert.match(soundingLanesCsv(rows), /harbor,1/);
  assert.match(soundingRowsCsv(rows, ["1"]), /Port desk,PORT,POR,harbor,graphite/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND276_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND276_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "plrTitle"), ROUND276_COPY.tr.plrTitle);
  assert.equal(crmv4Text("de", "sndTitle"), ROUND276_COPY.de.sndTitle);
  assert.equal(crmv4Text("ru", "plrSub"), ROUND276_COPY.ru.plrSub);
  assert.equal(crmv4Text("ar", "sndSub"), ROUND276_COPY.ar.sndSub);
  assert.equal(crmv4Text("en", "plrLogo"), "7FX");
  assert.equal(crmv4Text("en", "plrTitle"), "Pelorus bearings");
  assert.equal(crmv4Text("en", "sndTitle"), "Sounding plates");
  assert.notEqual(ROUND276_COPY.tr.plrTitle, ROUND276_COPY.en.plrTitle);
  assert.equal(crmv4Text("en", "cbtTitle"), "Chronometer beats");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-pelorus/);
  assert.match(css, /\.c4-sounding-index/);
  assert.match(css, /\.c4-pelorus-column/);
  assert.match(css, /\.c4-sounding-column/);
  assert.match(css, /\.c4-dossier-cabinet/);
  assert.match(css, /\.c4-dossier-seal/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round276.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /affiliateB:/);
  assert.match(viewFile, /bearingCsv/);
  assert.match(viewFile, /soundingRowsCsv/);
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
  assert.match(viewFile, /c4-sounding-search/);
  assert.match(viewFile, /bearingTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "plr"/);
  assert.match(app, /view === "snd"/);
  const dossier = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round40.tsx"), "utf8");
  assert.match(dossier, /c4-dossier-cabinet/);
  assert.match(dossier, /c4-dossier-seal/);
  assert.match(dossier, /dosCabLead/);
  assert.match(dossier, /data-logo="mono"/);
  assert.match(dossier, /data-cabinet="1"/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND276_COPY.en, key);
  const named = viewFile.match(/"(plr|snd)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND276_COPY.en, key);
  const dossierUsed = new Set(dossier.match(/v4\("(dosCab[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(dossierUsed)) assert.ok(key in ROUND276_COPY.en, key);
  console.log("crmv4 round276 tests passed");
}

main();
