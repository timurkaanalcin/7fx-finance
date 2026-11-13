/**
 * Nocturnal sights, address plates, the writing room, and the density salon.
 * Run: TZ=UTC npx tsx tests/crmv4-round281.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND281_COPY } from "../src/lib/crmv4/copy-round281";
import {
  ROUND281_FEATURES,
  activeMetal,
  activeStation,
  activeTooth,
  activeTone,
  activeWatch,
  addNocturnal,
  addNocturnalView,
  addressEcho,
  addressHue,
  addressKnown,
  addressLane,
  addressLanesCsv,
  addressLeap,
  addressNotch,
  addressRowsCsv,
  addressSlash,
  addressStamp,
  addressState,
  addressStep,
  addressTail,
  addressTwin,
  addressVowel,
  addressWide,
  addressWords,
  briskNocturnal,
  dipWatch,
  dropNocturnalView,
  evenTooth,
  fairKeeper,
  houseMetal,
  idleNocturnal,
  keenStation,
  lateNocturnal,
  leadingAddress,
  liftWatch,
  lowerTooth,
  metalOf,
  moveNocturnalFocus,
  nocturnalCsv,
  nocturnalTooth,
  nocturnalWatch,
  overdueNocturnal,
  raiseTooth,
  readNocturnalViews,
  restingNocturnal,
  stationBand,
  stationGap,
  stationOf,
  stillStation,
  suggestMetal,
  suggestStation,
  suggestWatch,
  toneOf,
  type AddressRow,
  type NocturnalSight,
} from "../src/lib/crmv4/round281";

function card(partial: Partial<NocturnalSight> & { id: string; title: string }): NocturnalSight {
  return {
    note: "",
    keeper: "",
    station: "",
    watch: null,
    metal: "",
    tone: "",
    tooth: 2,
    tags: [],
    logged: false,
    locked: false,
    stowed: false,
    flagged: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND281_FEATURES.length, 25);
  assert.equal(stationOf(" pointer "), "pointer");
  assert.equal(stationOf("paris"), "");
  assert.equal(nocturnalWatch("15"), 15);
  assert.equal(nocturnalWatch(45), 45);
  assert.equal(nocturnalWatch("75"), 75);
  assert.equal(nocturnalWatch("30"), null);
  assert.equal(nocturnalWatch("10"), null);
  assert.equal(nocturnalTooth("2"), 2);
  assert.equal(nocturnalTooth(6), 6);
  assert.equal(nocturnalTooth("9"), 9);
  assert.equal(nocturnalTooth("1"), null);
  assert.equal(nocturnalTooth("4"), null);
  assert.equal(nocturnalTooth("7"), null);
  assert.equal(metalOf("ivory"), "IVORY");
  assert.equal(metalOf("graphite"), "GRAPHITE");
  assert.equal(metalOf("champagne"), "CHAMPAGNE");
  assert.equal(metalOf("gilt"), "");
  assert.equal(toneOf("pearl"), "pearl");
  assert.equal(toneOf("ink"), "ink");
  assert.equal(toneOf("brass"), "brass");
  assert.equal(toneOf("mist"), "");
  assert.equal(keenStation("pointer"), true);
  assert.equal(keenStation("DIAL"), true);
  assert.equal(keenStation("polaris"), false);
  assert.equal(stillStation("polaris"), true);
  assert.equal(stillStation("guard"), true);
  assert.equal(stillStation("pointer"), false);
  assert.equal(stationBand("polaris"), "watch");
  assert.equal(stationBand("pointer"), "rise");
  assert.equal(stationBand("guard"), "set");
  assert.equal(stationBand("dial"), "dark");
  assert.equal(stationBand(""), "");
  assert.equal(stationGap("polaris", "pointer"), 1);
  assert.equal(stationGap("pointer", "polaris"), -1);
  assert.equal(stationGap("", "polaris"), null);
  assert.equal(houseMetal("graphite"), true);
  assert.equal(houseMetal("CHAMPAGNE"), true);
  assert.equal(houseMetal("ivory"), false);
  assert.equal(evenTooth(6), true);
  assert.equal(evenTooth("6"), true);
  assert.equal(evenTooth(2), false);
  assert.equal(evenTooth(9), false);
  assert.equal(activeStation("keen"), "keen");
  assert.equal(activeStation("pointer"), "pointer");
  assert.equal(activeStation("paris"), "all");
  assert.equal(activeWatch("15"), "15");
  assert.equal(activeWatch("9"), "all");
  assert.equal(activeTone("ink", ["pearl", "ink", "brass"]), "ink");
  assert.equal(activeTone("mist", ["pearl", "ink", "brass"]), "all");
  assert.equal(activeTooth("6"), "6");
  assert.equal(activeTooth("1"), "all");
  assert.equal(activeMetal("graphite"), "graphite");
  assert.equal(moveNocturnalFocus(0, 4, 1), 1);
  assert.equal(moveNocturnalFocus(0, 4, -1), 3);
  assert.equal(suggestMetal([]), "IVORY");
  assert.equal(suggestWatch([], 5), 15);
  assert.equal(suggestWatch([], 10), 45);
  assert.equal(suggestWatch([], 20), 75);
  assert.equal(suggestStation(8), "polaris");
  assert.equal(suggestStation(9), "dial");
  assert.equal(fairKeeper([card({ id: "1", title: "North", keeper: "Ada" })], "Ada,Bea"), "Bea");

  const blank = [card({ id: "1", title: "North" })];
  assert.equal(liftWatch(blank, "1")[0].watch, 15);
  assert.equal(liftWatch(liftWatch(blank, "1"), "1")[0].watch, 45);
  assert.equal(dipWatch(blank, "1")[0].watch, 75);
  assert.equal(raiseTooth(blank, "1")[0].tooth, 6);
  assert.equal(lowerTooth([{ ...blank[0], tooth: 6 }], "1")[0].tooth, 2);
  assert.equal(overdueNocturnal(card({ id: "2", title: "Late", station: "pointer", watch: 15 })), true);
  assert.equal(overdueNocturnal(card({ id: "3", title: "Done", station: "pointer", watch: 15, logged: true })), false);
  assert.equal(idleNocturnal(card({ id: "4", title: "Still", station: "polaris", tone: "pearl", tooth: 2 })), true);
  assert.equal(briskNocturnal(card({ id: "5", title: "Keen", station: "dial", tone: "brass", tooth: 9 })), true);
  assert.equal(restingNocturnal(card({ id: "6", title: "Rest", station: "dial", tone: "ink", watch: 75 })), true);
  assert.equal(lateNocturnal(card({ id: "7", title: "Behind", station: "polaris", tooth: 2 }), "dial"), true);
  const saved = addNocturnal([], { id: "a", title: "Polaris", station: "pointer", watch: 15, tooth: 2, tags: "n s x" });
  assert.equal(saved[0].tags.join(""), "ns");
  assert.equal(saved[0].audit, "save");
  assert.equal(addNocturnal(saved, { id: "b", title: "Polaris" }).length, 1);
  const views = addNocturnalView([], { id: "v", name: "Night", tray: "chest", station: "keen", watch: "15", tooth: "6" });
  assert.equal(views[0].tray, "chest");
  assert.equal(dropNocturnalView(views, "v").length, 0);
  assert.equal(readNocturnalViews(views)[0].station, "keen");
  assert.match(nocturnalCsv(saved, "dial"), /Polaris,,pointer,,,15,2,n s/);

  assert.equal(addressState({ amount: 1, address: "Main Street" }), "");
  assert.equal(addressState({ name: "Ada" }), "");
  assert.equal(addressState({ address: "" }), "clear");
  assert.equal(addressState("12"), "clear");
  assert.equal(addressState("Main Street"), "set");
  assert.equal(addressLane("King Street, London"), "court");
  assert.equal(addressLane("King-Street"), "mews");
  assert.equal(addressLane("12 Oak Road"), "number");
  assert.equal(addressLane("The Old Square"), "square");
  assert.equal(addressLane("Oak Lane"), "row");
  assert.equal(addressLane("Bond Close"), "close");
  assert.equal(addressLane("MAIN STREET"), "close");
  assert.equal(addressStamp("MAIN STREET"), "EET");
  assert.equal(addressHue("12 Oak Road"), "graphite");
  assert.equal(addressHue("King Street, London"), "ivory");
  assert.equal(addressHue("Oak Lane"), "champagne");
  assert.equal(addressKnown("main street"), true);
  assert.equal(addressKnown("Bond Close"), false);
  assert.equal(addressTwin("Book Road"), true);
  assert.equal(addressEcho("Area"), true);
  assert.equal(addressVowel("Oak Lane"), true);
  assert.equal(addressWide("Main_Street"), true);
  assert.equal(addressNotch("King-Street"), true);
  assert.equal(addressSlash("King/Street"), true);
  assert.equal(addressLeap("Abcdefghijkl"), true);
  assert.equal(addressTail("Bond Road"), true);
  assert.equal(addressWords("The Old Square"), 3);
  assert.equal(addressStep("MAIN STREET"), 10);
  const rows: AddressRow[] = [
    { id: "1", label: "Ada", note: "MAIN STREET" },
    { id: "2", label: "Bea", note: "12 Oak Road" },
  ];
  assert.equal(leadingAddress(rows), "number");
  assert.match(addressLanesCsv(rows), /number,1/);
  assert.match(addressLanesCsv(rows), /close,1/);
  assert.match(addressRowsCsv(rows, ["1"]), /Ada,MAIN STREET,EET,close,graphite/);

  const locales = ["en", "tr", "de", "ru", "ar"] as const;
  const keys = Object.keys(ROUND281_COPY.en).sort();
  for (const locale of locales) assert.deepEqual(Object.keys(ROUND281_COPY[locale]).sort(), keys);
  assert.equal(crmv4Text("tr", "nocTitle"), ROUND281_COPY.tr.nocTitle);
  assert.equal(crmv4Text("de", "adpTitle"), ROUND281_COPY.de.adpTitle);
  assert.equal(crmv4Text("ru", "nocSub"), ROUND281_COPY.ru.nocSub);
  assert.equal(crmv4Text("ar", "adpSub"), ROUND281_COPY.ar.adpSub);
  assert.equal(crmv4Text("en", "nocLogo"), "7FX");
  assert.equal(crmv4Text("en", "nocTitle"), "Nocturnal sights");
  assert.equal(crmv4Text("en", "adpTitle"), "Address plates");
  assert.equal(crmv4Text("en", "padGalKicker"), "Writing room");
  assert.equal(crmv4Text("en", "denSalonKicker"), "Density salon");
  assert.notEqual(ROUND281_COPY.tr.nocTitle, ROUND281_COPY.en.nocTitle);
  assert.equal(crmv4Text("en", "bstTitle"), "Backstaff sights");

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-nocturnal/);
  assert.match(css, /\.c4-addressplate-index/);
  assert.match(css, /\.c4-nocturnal-column/);
  assert.match(css, /\.c4-addressplate-column/);
  assert.match(css, /\.c4-pad-gallery/);
  assert.match(css, /\.c4-pad-gallery-mast/);
  assert.match(css, /\.c4-den-salon/);
  assert.match(css, /\.c4-den-salon-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round281.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /address:/);
  assert.match(viewFile, /nocturnalCsv/);
  assert.match(viewFile, /addressRowsCsv/);
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
  assert.match(viewFile, /c4-addressplate-search/);
  assert.match(viewFile, /nocturnalTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "noc"/);
  assert.match(app, /view === "adp"/);
  const pad = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round53.tsx"), "utf8");
  assert.match(pad, /c4-pad-gallery/);
  assert.match(pad, /c4-pad-gallery-mast/);
  assert.match(pad, /c4-pad-gallery-card/);
  assert.match(pad, /data-logo="mono"/);
  assert.match(pad, /padGalKicker/);
  assert.match(pad, /padGalLead/);
  const writing = pad.slice(pad.indexOf("export function DeskPad"));
  assert.equal(writing.includes("sendJson"), false);
  assert.equal(writing.includes("fetch("), false);
  const density = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round62.tsx"), "utf8");
  assert.match(density, /c4-den-salon/);
  assert.match(density, /c4-den-salon-mast/);
  assert.match(density, /c4-den-salon-preview/);
  assert.match(density, /denSalonKicker/);
  assert.match(density, /denSalonLead/);
  const used = new Set(viewFile.match(/v4\("([a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || []);
  for (const key of Array.from(used)) assert.ok(key in ROUND281_COPY.en, key);
  const named = viewFile.match(/"(noc|adp)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of named) assert.ok(key in ROUND281_COPY.en, key);
  const room = pad.match(/v4\("(padGal[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of room) assert.ok(key in ROUND281_COPY.en, key);
  const salon = density.match(/v4\("(denSalon[a-zA-Z0-9]+)"\)/g)?.map((item) => item.slice(4, -2)) || [];
  for (const key of salon) assert.ok(key in ROUND281_COPY.en, key);
  console.log("crmv4 round281 tests passed");
}

main();
