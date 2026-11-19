/**
 * Chilindrum columns, gate plates, the ivory layout chapel, and the graphite document scriptorium.
 * Run: TZ=UTC npx tsx tests/crmv4-round302.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND302_COPY } from "../src/lib/crmv4/copy-round302";
import {
  ROUND302_FEATURES,
  activeNotch,
  activeHeight,
  activePart,
  activeCloth,
  addChilindrum,
  briskChil,
  dropChilView,
  fairKeeper,
  fullNotch,
  gateCapital,
  gateKeep,
  gateDigit,
  gateEven,
  gateFirst,
  gateHue,
  gateLane,
  gateLanesCsv,
  gateLength,
  gateLower,
  gateMark,
  gatePair,
  gateRowsCsv,
  gateShort,
  gateSpace,
  gateState,
  gateTail,
  gateVow,
  gateUpper,
  gateVowel,
  houseCloth,
  idleChil,
  lateChil,
  leadingGate,
  moveChilFocus,
  chilBand,
  chilGap,
  chilNotch,
  chilInner,
  chilOuter,
  chilHeight,
  chilPart,
  chilCloth,
  overdueChil,
  pairNotch,
  readChilViews,
  restingChil,
  suggestHeight,
  suggestPart,
  suggestCloth,
  type GateRow,
  type Chilindrum,
} from "../src/lib/crmv4/round302";

function column(partial: Partial<Chilindrum> & { id: string; title: string }): Chilindrum {
  return {
    note: "",
    pilot: "",
    station: "",
    latitude: null,
    wood: "",
    hour: 4,
    tags: [],
    laid: false,
    locked: false,
    held: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND302_FEATURES.length, 25);
  assert.equal(ROUND302_FEATURES.includes("gate"), true);
  assert.equal(ROUND302_FEATURES.includes("height"), true);
  assert.equal(ROUND302_FEATURES.includes("fair-keeper"), true);
  assert.equal(chilPart(" foot "), "foot");
  assert.equal(chilPart("brass"), "");
  assert.equal(chilHeight("12"), 12);
  assert.equal(chilHeight(24), 24);
  assert.equal(chilHeight("36"), 36);
  assert.equal(chilHeight("48"), 48);
  assert.equal(chilHeight("8"), null);
  assert.equal(chilNotch("4"), 4);
  assert.equal(chilNotch(8), 8);
  assert.equal(chilNotch("12"), 12);
  assert.equal(chilNotch("3"), null);
  assert.equal(chilCloth("linen"), "LINEN");
  assert.equal(chilCloth("vellum"), "VELLUM");
  assert.equal(chilCloth("gilt"), "GILT");
  assert.equal(chilCloth("hot"), "");
  assert.equal(chilInner("foot"), true);
  assert.equal(chilInner("BARREL"), true);
  assert.equal(chilInner("lip"), false);
  assert.equal(chilOuter("style"), true);
  assert.equal(chilOuter("lip"), true);
  assert.equal(chilOuter("foot"), false);
  assert.equal(chilBand("foot"), "sole");
  assert.equal(chilBand("barrel"), "drum");
  assert.equal(chilBand("lip"), "rim");
  assert.equal(chilBand("style"), "shadow");
  assert.equal(chilBand(""), "");
  assert.equal(chilGap("foot", "style"), 3);
  assert.equal(chilGap("lip", "nope"), null);
  assert.equal(houseCloth("linen"), true);
  assert.equal(houseCloth("vellum"), false);
  assert.equal(pairNotch(8), true);
  assert.equal(pairNotch(4), false);
  assert.equal(fullNotch("12"), true);
  assert.equal(fullNotch(8), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activePart("style"), "style");
  assert.equal(activePart("gold"), "all");
  assert.equal(activeHeight("48"), "48");
  assert.equal(activeHeight("8"), "all");
  assert.equal(activeNotch("4"), "4");
  assert.equal(activeNotch("3"), "all");
  assert.equal(activeCloth("gilt", ["GILT"]), "GILT");
  assert.equal(activeCloth("hot", ["GILT"]), "all");
  assert.equal(moveChilFocus(0, 3, -1), 2);
  assert.equal(moveChilFocus(0, 0, 1), 0);

  const cards = [
    column({ id: "a", title: "Ada", station: "lip", hour: 4, pilot: "Ned" }),
    column({ id: "b", title: "Bea", station: "foot", wood: "GILT", latitude: 48, hour: 12, pilot: "Ned" }),
    column({ id: "c", title: "Cara", station: "style", wood: "LINEN", latitude: 24, pilot: "Ida" }),
  ];
  assert.equal(overdueChil(cards[0]), true);
  assert.equal(briskChil(cards[1]), true);
  assert.equal(restingChil(cards[2]), true);
  assert.equal(idleChil(column({ id: "i", title: "Idle", latitude: 12, hour: 4 })), true);
  assert.equal(lateChil(cards[1], "style"), true);
  assert.equal(lateChil(cards[1], "foot"), false);
  assert.equal(suggestCloth([]), "GILT");
  assert.equal(suggestCloth(cards), "VELLUM");
  assert.equal(suggestHeight([], 7), 12);
  assert.equal(suggestHeight([], 10), 24);
  assert.equal(suggestHeight([], 15), 36);
  assert.equal(suggestHeight([], 20), 48);
  assert.equal(suggestPart(9), "foot");
  assert.equal(suggestPart(12), "style");
  assert.equal(fairKeeper(cards, "Ida, Ned"), "Ida");
  const saved = addChilindrum([], { id: "n1", title: "Noon", station: "barrel", wood: "vellum", latitude: "24", hour: "8", tags: "a b c" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "VELLUM");
  assert.equal(saved[0].hour, 8);
  assert.deepEqual(saved[0].tags, ["a", "b"]);
  assert.equal(addChilindrum(saved, { title: "Noon" }).length, 1);
  const views = readChilViews([{ id: "v1", name: "Morning", tray: "sleeve", query: "noon", pilot: "Ned", wood: "GILT", station: "inner", latitude: "24", hour: "8" }]);
  assert.equal(views[0].tray, "sleeve");
  assert.equal(views[0].station, "inner");
  assert.equal(dropChilView(views, "v1").length, 0);

  assert.equal(gateState(true), "set");
  assert.equal(gateState(""), "clear");
  assert.equal(gateState({ name: "Ada" }), "");
  assert.equal(gateState({ balance: 1, mustChangePassword: true }), "");
  assert.equal(gateLane(true), "vow");
  assert.equal(gateLane(false), "keep");
  assert.equal(gateLane("must-reset"), "vow");
  assert.equal(gateLane("South Africa"), "pair");
  assert.equal(gateLane("Ada"), "short");
  assert.equal(gateLane("Liechtenstein"), "long");
  assert.equal(gateLane("Australia"), "vowel");
  assert.equal(gateLane("Germany"), "post");
  assert.equal(gateHue(true), "champagne");
  assert.equal(gateHue("must-reset"), "champagne");
  assert.equal(gateHue(false), "ivory");
  assert.equal(gateVow(true), true);
  assert.equal(gateKeep(false), true);
  assert.equal(gatePair("South Africa"), true);
  assert.equal(gateShort("Ada"), true);
  assert.equal(gateMark("keep-open"), true);
  assert.equal(gateLength("Ada"), 3);
  assert.equal(gateEven("Ada"), false);
  assert.equal(gateFirst("Ada"), true);
  assert.equal(gateSpace("South Africa"), true);
  assert.equal(gateVowel("Australia"), true);
  assert.equal(gateDigit("Room 4"), true);
  assert.equal(gateCapital("Ada"), true);
  assert.equal(gateLower("ada"), true);
  assert.equal(gateUpper("KEEP"), true);
  assert.equal(gateTail("Room 4"), true);
  const gates: GateRow[] = [
    { id: "1", label: "Ada", gate: true },
    { id: "2", label: "Bea", gate: true },
    { id: "3", label: "Cara", gate: "Ada" },
  ];
  assert.equal(leadingGate(gates), "vow");
  assert.match(gateLanesCsv(gates), /vow,2/);
  assert.match(gateRowsCsv(gates, ["1"]), /Ada,true/);
  assert.equal(crmv4Text("tr", "chdTitle"), ROUND302_COPY.tr.chdTitle);
  assert.equal(crmv4Text("de", "gtpTitle"), ROUND302_COPY.de.gtpTitle);
  assert.equal(crmv4Text("ru", "lxChapelKicker"), ROUND302_COPY.ru.lxChapelKicker);
  assert.equal(crmv4Text("ar", "kmScriptoriumLead"), ROUND302_COPY.ar.kmScriptoriumLead);
  const keys = Object.keys(ROUND302_COPY.en).sort();
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND302_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-chilindrum/);
  assert.match(css, /\.c4-gate/);
  assert.match(css, /\.c4-chilindrum-column/);
  assert.match(css, /\.c4-gate-column/);
  assert.match(css, /\.c4-layout-chapel/);
  assert.match(css, /\.c4-doc-scriptorium/);
  assert.match(css, /\.c4-layout-chapel-mast/);
  assert.match(css, /\.c4-doc-scriptorium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round302.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /mustChangePassword:/);
  assert.match(viewFile, /chilCsv/);
  assert.match(viewFile, /gateRowsCsv/);
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
  assert.match(viewFile, /suggestCloth/);
  assert.match(viewFile, /c4-gate-search/);
  assert.match(viewFile, /chilTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "chd"/);
  assert.match(app, /view === "gtp"/);
  const chapel = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round100.tsx"), "utf8");
  assert.match(chapel, /c4-layout-chapel/);
  assert.match(chapel, /c4-layout-chapel-mast/);
  assert.match(chapel, /data-logo="mono"/);
  assert.match(chapel, /lxChapelKicker/);
  assert.match(chapel, /lxChapelLead/);
  assert.match(chapel, /data-layout-lock/);
  assert.equal(chapel.includes("amount"), false);
  const scriptorium = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round101.tsx"), "utf8");
  assert.match(scriptorium, /c4-doc-scriptorium/);
  assert.match(scriptorium, /c4-doc-scriptorium-mast/);
  assert.match(scriptorium, /kmScriptoriumKicker/);
  assert.match(scriptorium, /kmScriptoriumLead/);
  assert.match(scriptorium, /data-doc-mix/);
  assert.equal(scriptorium.includes("amount"), false);
  const namedKeys = `${viewFile}\n${chapel}\n${scriptorium}`.match(/"(chd|gtp|lxChapel|kmScriptorium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND302_COPY.en[key as keyof typeof ROUND302_COPY.en], "string", key);
  console.log("crmv4 round302 tests passed");
}

main();
