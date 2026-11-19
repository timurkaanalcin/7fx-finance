/**
 * Foliot rules, rutter plates, the ivory watch odeon, and the graphite system xystus.
 * Run: TZ=UTC npx tsx tests/crmv4-round319.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND319_COPY } from "../src/lib/crmv4/copy-round319";
import {
  ROUND319_FEATURES,
  activeInk,
  activeLimb,
  activeNotch,
  activeSwing,
  addFoliot,
  briskFoliot,
  dropFoliotView,
  fairWarden,
  foliotBand,
  foliotGap,
  foliotInk,
  foliotInner,
  foliotLimb,
  foliotNotch,
  foliotOuter,
  foliotSwing,
  foliotTimeline,
  fullSwing,
  houseInk,
  idleFoliot,
  lateFoliot,
  leadingRutter,
  moveFoliotFocus,
  overdueFoliot,
  pairSwing,
  readFoliotViews,
  restingFoliot,
  rutterBerth,
  rutterCapital,
  rutterCipher,
  rutterEven,
  rutterFirst,
  rutterHue,
  rutterInlet,
  rutterLane,
  rutterLanesCsv,
  rutterLength,
  rutterLower,
  rutterMark,
  rutterOpen,
  rutterPassage,
  rutterReach,
  rutterRoad,
  rutterRowsCsv,
  rutterSpace,
  rutterSplice,
  rutterState,
  rutterTail,
  rutterUpper,
  suggestInk,
  suggestLimb,
  suggestNotch,
  type Foliot,
  type RutterRow,
} from "../src/lib/crmv4/round319";

function rule(partial: Partial<Foliot> & { id: string; title: string }): Foliot {
  return {
    note: "",
    warden: "",
    limb: "",
    notch: null,
    ink: "",
    swing: 1,
    tags: [],
    wound: false,
    hooked: false,
    coffered: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND319_FEATURES.length, 25);
  assert.equal(ROUND319_FEATURES.includes("retention-rutter"), true);
  assert.equal(ROUND319_FEATURES.includes("notch-sla"), true);
  assert.equal(ROUND319_FEATURES.includes("fair-warden"), true);
  assert.equal(ROUND319_FEATURES.includes("coffer"), true);
  assert.equal(ROUND319_FEATURES.includes("gilt-ink"), true);
  assert.equal(foliotLimb(" bar "), "bar");
  assert.equal(foliotLimb("brass"), "");
  assert.equal(foliotNotch("3"), 3);
  assert.equal(foliotNotch(6), 6);
  assert.equal(foliotNotch(9), 9);
  assert.equal(foliotNotch(12), 12);
  assert.equal(foliotNotch("7"), null);
  assert.equal(foliotSwing("1"), 1);
  assert.equal(foliotSwing(3), 3);
  assert.equal(foliotSwing("5"), 5);
  assert.equal(foliotSwing("6"), null);
  assert.equal(foliotInk("gilt"), "GILT");
  assert.equal(foliotInk("ivory"), "IVORY");
  assert.equal(foliotInk("graphite"), "GRAPHITE");
  assert.equal(foliotInk("hot"), "");
  assert.equal(foliotInner("bar"), true);
  assert.equal(foliotInner("BOB"), true);
  assert.equal(foliotInner("verge"), false);
  assert.equal(foliotOuter("verge"), true);
  assert.equal(foliotOuter("crown"), true);
  assert.equal(foliotOuter("bar"), false);
  assert.equal(foliotBand("bar"), "beam");
  assert.equal(foliotBand("bob"), "mass");
  assert.equal(foliotBand("verge"), "pallet");
  assert.equal(foliotBand("crown"), "tooth");
  assert.equal(foliotBand(""), "");
  assert.equal(foliotGap("bar", "crown"), 3);
  assert.equal(foliotGap("verge", "nope"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(pairSwing(3), true);
  assert.equal(pairSwing(1), false);
  assert.equal(fullSwing("5"), true);
  assert.equal(fullSwing(3), false);
  assert.equal(activeLimb("inner"), "inner");
  assert.equal(activeLimb("verge"), "verge");
  assert.equal(activeLimb("gold"), "all");
  assert.equal(activeNotch("12"), "12");
  assert.equal(activeNotch("3"), "3");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeSwing("1"), "1");
  assert.equal(activeSwing("2"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveFoliotFocus(0, 3, -1), 2);
  assert.equal(moveFoliotFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", limb: "verge", swing: 1, warden: "Ned" }),
    rule({ id: "b", title: "Bea", limb: "bar", ink: "GRAPHITE", notch: 12, swing: 5, warden: "Ned" }),
    rule({ id: "c", title: "Cara", limb: "crown", ink: "IVORY", notch: 6, warden: "Ida" }),
  ];
  assert.equal(overdueFoliot(cards[0]), true);
  assert.equal(briskFoliot(rule({ id: "g", title: "Gilt", ink: "GILT", notch: 12, swing: 5 })), true);
  assert.equal(briskFoliot(cards[1]), false);
  assert.equal(restingFoliot(cards[2]), true);
  assert.equal(idleFoliot(rule({ id: "i", title: "Idle", notch: 3, swing: 1 })), true);
  assert.equal(lateFoliot(cards[1], "crown"), true);
  assert.equal(lateFoliot(cards[1], "bar"), false);
  assert.equal(suggestInk([]), "GRAPHITE");
  assert.equal(suggestInk(cards), "GILT");
  assert.equal(suggestNotch([], 4), 3);
  assert.equal(suggestNotch([], 6), 3);
  assert.equal(suggestNotch([], 12), 6);
  assert.equal(suggestNotch([], 18), 9);
  assert.equal(suggestNotch(cards, 6), 3);
  assert.equal(suggestLimb(4), "bar");
  assert.equal(suggestLimb(8), "crown");
  assert.equal(fairWarden(cards, "Ida,Ned"), "Ida");
  const saved = addFoliot([], { title: "Dora", limb: "verge", ink: "ivory", notch: "6", swing: "3", tags: "f l r" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].notch, 6);
  assert.equal(saved[0].swing, 3);
  assert.equal(saved[0].tags.join(""), "fl");
  assert.equal(addFoliot(saved, { title: "Dora" }).length, 1);
  assert.equal(dropFoliotView([{ id: "v", name: "Morning", tray: "bench", query: "", warden: "", ink: "all", limb: "all", notch: "all", swing: "all" }], "v").length, 0);
  assert.equal(readFoliotViews([{ id: "v", name: "Morning", tray: "hook" }])[0].tray, "hook");

  assert.equal(rutterBerth("ACTIVE"), true);
  assert.equal(rutterBerth({ retention: true }), true);
  assert.equal(rutterReach({ retention: false }), true);
  assert.equal(rutterBerth({ retention: "road" }), false);
  assert.equal(rutterSplice("re-check"), true);
  assert.equal(rutterReach("needs review"), true);
  assert.equal(rutterMark("US"), true);
  assert.equal(rutterMark("NET"), true);
  assert.equal(rutterPassage("Netherlands"), true);
  assert.equal(rutterPassage("LongReferral"), true);
  assert.equal(rutterLane("US"), "mark");
  assert.equal(rutterLane("10.1.1.1"), "cipher");
  assert.equal(rutterLane("Amsterdam"), "inlet");
  assert.equal(rutterLane("Paris"), "road");
  assert.equal(rutterRoad("Paris"), true);
  assert.equal(rutterOpen(""), true);
  assert.equal(rutterOpen({ retention: "" }), true);
  assert.equal(rutterState({ name: "Ada" }), "");
  assert.equal(rutterState({ retention: "Paris", balance: 1 }), "");
  assert.equal(rutterHue("ACTIVE"), "champagne");
  assert.equal(rutterHue("needs review"), "graphite");
  assert.equal(rutterHue("Amsterdam"), "ivory");
  assert.equal(rutterLength("hold"), 4);
  assert.equal(rutterEven("hold"), true);
  assert.equal(rutterFirst("Paris"), true);
  assert.equal(rutterSpace("needs review"), true);
  assert.equal(rutterInlet("Amsterdam"), true);
  assert.equal(rutterCipher("Room4"), true);
  assert.equal(rutterCapital("PARIS"), true);
  assert.equal(rutterLower("paris"), true);
  assert.equal(rutterUpper("PARIS"), true);
  assert.equal(rutterUpper("NET"), false);
  assert.equal(rutterTail("Room4"), true);
  const marks: RutterRow[] = [
    { id: "1", label: "Ada", code: "ACTIVE" },
    { id: "2", label: "Bea", code: "INACTIVE" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingRutter(marks), "berth");
  assert.match(rutterLanesCsv(marks), /berth,2/);
  assert.match(rutterRowsCsv(marks, ["1"]), /Ada,ACTIVE/);
  assert.match(foliotTimeline(cards).map((lane) => lane.notch).join(","), /12|6/);
  assert.equal(crmv4Text("tr", "fltTitle"), ROUND319_COPY.tr.fltTitle);
  assert.equal(crmv4Text("de", "rtrTitle"), ROUND319_COPY.de.rtrTitle);
  assert.equal(crmv4Text("ru", "wchOdeonKicker"), ROUND319_COPY.ru.wchOdeonKicker);
  assert.equal(crmv4Text("ar", "ostXystusLead"), ROUND319_COPY.ar.ostXystusLead);
  const keys = Object.keys(ROUND319_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND319_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-foliot/);
  assert.match(css, /\.c4-rutter/);
  assert.match(css, /\.c4-foliot-column/);
  assert.match(css, /\.c4-rutter-column/);
  assert.match(css, /\.c4-watch-odeon/);
  assert.match(css, /\.c4-system-xystus/);
  assert.match(css, /\.c4-watch-odeon-mast/);
  assert.match(css, /\.c4-system-xystus-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round319.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /retentionStatus/);
  assert.match(viewFile, /foliotCsv/);
  assert.match(viewFile, /rutterRowsCsv/);
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
  assert.match(viewFile, /suggestInk/);
  assert.match(viewFile, /c4-rutter-search/);
  assert.match(viewFile, /foliotTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "flt"/);
  assert.match(app, /view === "rtr"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round139.tsx"), "utf8");
  assert.match(host, /c4-watch-odeon/);
  assert.match(host, /c4-watch-odeon-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /wchOdeonKicker/);
  assert.match(host, /wchOdeonLead/);
  assert.match(host, /data-watch/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-system-xystus/);
  assert.match(host, /c4-system-xystus-mast/);
  assert.match(host, /ostXystusKicker/);
  assert.match(host, /ostXystusLead/);
  assert.match(host, /data-system/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(flt|rtr|wchOdeon|ostXystus)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND319_COPY.en[key as keyof typeof ROUND319_COPY.en], "string", key);
  console.log("crmv4 round319 tests passed");
}

main();
