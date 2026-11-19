/**
 * Dioptra rules, fret plates, the ivory call triclinium, and the graphite zone peristyle.
 * Run: TZ=UTC npx tsx tests/crmv4-round316.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND316_COPY } from "../src/lib/crmv4/copy-round316";
import {
  ROUND316_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addDioptra,
  briskDioptra,
  dropDioptraView,
  fairBearer,
  fullVane,
  fretCapital,
  fretDigit,
  fretEven,
  fretFirst,
  fretFort,
  fretHarbor,
  fretHouse,
  fretHue,
  fretLanesCsv,
  fretLength,
  fretLower,
  fretLane,
  fretOpen,
  fretPost,
  fretRowsCsv,
  fretScroll,
  fretSpace,
  fretSpark,
  fretState,
  fretTail,
  fretUpper,
  fretVowel,
  houseWood,
  idleDioptra,
  lateDioptra,
  leadingFret,
  moveDioptraFocus,
  dioptraBand,
  dioptraGap,
  dioptraVane,
  dioptraInner,
  dioptraOuter,
  dioptraNotch,
  dioptraStaff,
  dioptraWood,
  overdueDioptra,
  pairVane,
  readDioptraViews,
  restingDioptra,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type FretRow,
  type Dioptra,
} from "../src/lib/crmv4/round316";

function rule(partial: Partial<Dioptra> & { id: string; title: string }): Dioptra {
  return {
    note: "",
    bearer: "",
    staff: "",
    notch: null,
    wood: "",
    vane: 2,
    tags: [],
    sighted: false,
    racked: false,
    cased: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND316_FEATURES.length, 25);
  assert.equal(ROUND316_FEATURES.includes("trade-frets"), true);
  assert.equal(ROUND316_FEATURES.includes("angle-sla"), true);
  assert.equal(ROUND316_FEATURES.includes("fair-sighter"), true);
  assert.equal(ROUND316_FEATURES.includes("vault"), true);
  assert.equal(ROUND316_FEATURES.includes("gilt-metal"), true);
  assert.equal(dioptraStaff(" lip "), "lip");
  assert.equal(dioptraStaff("brass"), "");
  assert.equal(dioptraNotch("4"), 4);
  assert.equal(dioptraNotch(8), 8);
  assert.equal(dioptraNotch(16), 16);
  assert.equal(dioptraNotch(32), 32);
  assert.equal(dioptraNotch("7"), null);
  assert.equal(dioptraVane("2"), 2);
  assert.equal(dioptraVane(4), 4);
  assert.equal(dioptraVane("8"), 8);
  assert.equal(dioptraVane("3"), null);
  assert.equal(dioptraWood("gilt"), "GILT");
  assert.equal(dioptraWood("ivory"), "IVORY");
  assert.equal(dioptraWood("slate"), "SLATE");
  assert.equal(dioptraWood("hot"), "");
  assert.equal(dioptraInner("lip"), true);
  assert.equal(dioptraInner("ARC"), true);
  assert.equal(dioptraInner("rim"), false);
  assert.equal(dioptraOuter("rim"), true);
  assert.equal(dioptraOuter("base"), true);
  assert.equal(dioptraOuter("lip"), false);
  assert.equal(dioptraBand("lip"), "near");
  assert.equal(dioptraBand("arc"), "span");
  assert.equal(dioptraBand("rim"), "edge");
  assert.equal(dioptraBand("base"), "foot");
  assert.equal(dioptraBand(""), "");
  assert.equal(dioptraGap("lip", "base"), 3);
  assert.equal(dioptraGap("rim", "nope"), null);
  assert.equal(houseWood("gilt"), true);
  assert.equal(houseWood("ivory"), false);
  assert.equal(pairVane(4), true);
  assert.equal(pairVane(2), false);
  assert.equal(fullVane("8"), true);
  assert.equal(fullVane(4), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("rim"), "rim");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("32"), "32");
  assert.equal(activeNotch("4"), "4");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("2"), "2");
  assert.equal(activeVane("3"), "all");
  assert.equal(activeWood("slate", ["SLATE"]), "SLATE");
  assert.equal(activeWood("hot", ["SLATE"]), "all");
  assert.equal(moveDioptraFocus(0, 3, -1), 2);
  assert.equal(moveDioptraFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "rim", vane: 2, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "lip", wood: "SLATE", notch: 32, vane: 8, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "base", wood: "IVORY", notch: 8, bearer: "Ida" }),
  ];
  assert.equal(overdueDioptra(cards[0]), true);
  assert.equal(briskDioptra(cards[1]), true);
  assert.equal(restingDioptra(cards[2]), true);
  assert.equal(idleDioptra(rule({ id: "i", title: "Idle", notch: 4, vane: 2 })), true);
  assert.equal(lateDioptra(cards[1], "base"), true);
  assert.equal(lateDioptra(cards[1], "lip"), false);
  assert.equal(suggestWood([]), "SLATE");
  assert.equal(suggestWood(cards), "GILT");
  assert.equal(suggestNotch([], 3), 4);
  assert.equal(suggestNotch([], 6), 8);
  assert.equal(suggestNotch([], 11), 16);
  assert.equal(suggestNotch([], 16), 32);
  assert.equal(suggestNotch(cards, 6), 16);
  assert.equal(suggestStaff(6), "lip");
  assert.equal(suggestStaff(8), "base");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addDioptra([], { title: "Dora", staff: "rim", wood: "ivory", notch: "8", vane: "4", tags: "a b x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "IVORY");
  assert.equal(saved[0].notch, 8);
  assert.equal(saved[0].vane, 4);
  assert.equal(saved[0].tags.join(""), "ab");
  assert.equal(addDioptra(saved, { title: "Dora" }).length, 1);
  assert.equal(dropDioptraView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readDioptraViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(fretHouse("LIVE"), true);
  assert.equal(fretHouse({ tradingEnabled: true }), true);
  assert.equal(fretHarbor({ tradingEnabled: false }), true);
  assert.equal(fretHouse({ tradingEnabled: "on" }), true);
  assert.equal(fretFort("re-check"), true);
  assert.equal(fretHarbor("needs review"), true);
  assert.equal(fretSpark("US"), true);
  assert.equal(fretSpark("NET"), false);
  assert.equal(fretScroll("Constantinople"), true);
  assert.equal(fretScroll("Amsterdam"), false);
  assert.equal(fretLane("12"), "spark");
  assert.equal(fretLane("10.1.1.1"), "digit");
  assert.equal(fretLane("Amsterdam"), "vowel");
  assert.equal(fretLane("Paris"), "post");
  assert.equal(fretPost("Paris"), true);
  assert.equal(fretOpen(""), true);
  assert.equal(fretOpen({ tradingEnabled: "" }), true);
  assert.equal(fretState({ name: "Ada" }), "");
  assert.equal(fretState({ tradingEnabled: "Paris", balance: 1 }), "");
  assert.equal(fretHue("LIVE"), "champagne");
  assert.equal(fretHue("needs review"), "graphite");
  assert.equal(fretHue("Amsterdam"), "ivory");
  assert.equal(fretLength("hold"), 4);
  assert.equal(fretEven("hold"), true);
  assert.equal(fretFirst("Paris"), true);
  assert.equal(fretSpace("needs review"), true);
  assert.equal(fretVowel("Amsterdam"), true);
  assert.equal(fretDigit("Room4"), true);
  assert.equal(fretCapital("PARIS"), true);
  assert.equal(fretLower("paris"), true);
  assert.equal(fretUpper("PARIS"), true);
  assert.equal(fretUpper("ON"), false);
  assert.equal(fretTail("Room4"), true);
  const marks: FretRow[] = [
    { id: "1", label: "Ada", fret: "LIVE" },
    { id: "2", label: "Bea", fret: "ON" },
    { id: "3", label: "Cara", fret: "Paris" },
  ];
  assert.equal(leadingFret(marks), "house");
  assert.match(fretLanesCsv(marks), /house,2/);
  assert.match(fretRowsCsv(marks, ["1"]), /Ada,LIVE/);
  assert.equal(crmv4Text("tr", "dprTitle"), ROUND316_COPY.tr.dprTitle);
  assert.equal(crmv4Text("de", "frtTitle"), ROUND316_COPY.de.frtTitle);
  assert.equal(crmv4Text("ru", "cwnTricliniumKicker"), ROUND316_COPY.ru.cwnTricliniumKicker);
  assert.equal(crmv4Text("ar", "zonPeristyleLead"), ROUND316_COPY.ar.zonPeristyleLead);
  const keys = Object.keys(ROUND316_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND316_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-dioptra/);
  assert.match(css, /\.c4-fret/);
  assert.match(css, /\.c4-dioptra-column/);
  assert.match(css, /\.c4-fret-column/);
  assert.match(css, /\.c4-call-triclinium/);
  assert.match(css, /\.c4-zone-peristyle/);
  assert.match(css, /\.c4-call-triclinium-mast/);
  assert.match(css, /\.c4-zone-peristyle-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round316.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /tradingEnabled:/);
  assert.match(viewFile, /dioptraCsv/);
  assert.match(viewFile, /fretRowsCsv/);
  assert.match(viewFile, /event\.key !== "\/"/);
  assert.match(viewFile, /event\.key === "x"/);
  assert.match(viewFile, /event\.key === "a"/);
  assert.match(viewFile, /storedRole/);
  assert.match(viewFile, /data-role/);
  assert.match(viewFile, /\/api\/admin\/users\?take=24&meta=0&role=TRADER/);
  assert.match(viewFile, /data-cards/);
  assert.match(viewFile, /data-plates/);
  assert.match(viewFile, /data-names/);
  assert.match(viewFile, /data-logo="mono"/);
  assert.match(viewFile, /suggestWood/);
  assert.match(viewFile, /c4-fret-search/);
  assert.match(viewFile, /dioptraTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "dpr"/);
  assert.match(app, /view === "frt"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round136.tsx"), "utf8");
  assert.match(host, /c4-call-triclinium/);
  assert.match(host, /c4-call-triclinium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /cwnTricliniumKicker/);
  assert.match(host, /cwnTricliniumLead/);
  assert.match(host, /data-call/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-zone-peristyle/);
  assert.match(host, /c4-zone-peristyle-mast/);
  assert.match(host, /zonPeristyleKicker/);
  assert.match(host, /zonPeristyleLead/);
  assert.match(host, /data-zone/);
  assert.equal(host.includes("price"), false);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(dpr|frt|cwnTriclinium|zonPeristyle)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND316_COPY.en[key as keyof typeof ROUND316_COPY.en], "string", key);
  console.log("crmv4 round316 tests passed");
}

main();
