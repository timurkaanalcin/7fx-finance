/**
 * Analemma rules, glyph plates, the ivory host impluvium, and the graphite server compluvium.
 * Run: TZ=UTC npx tsx tests/crmv4-round315.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND315_COPY } from "../src/lib/crmv4/copy-round315";
import {
  ROUND315_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addAnalemma,
  briskAnalemma,
  dropAnalemmaView,
  fairBearer,
  fullVane,
  glyphCapital,
  glyphDigit,
  glyphEven,
  glyphFirst,
  glyphFort,
  glyphHarbor,
  glyphHouse,
  glyphHue,
  glyphLanesCsv,
  glyphLength,
  glyphLower,
  glyphLane,
  glyphOpen,
  glyphPost,
  glyphRowsCsv,
  glyphScroll,
  glyphSpace,
  glyphSpark,
  glyphState,
  glyphTail,
  glyphUpper,
  glyphVowel,
  houseWood,
  idleAnalemma,
  lateAnalemma,
  leadingGlyph,
  moveAnalemmaFocus,
  analemmaBand,
  analemmaGap,
  analemmaVane,
  analemmaInner,
  analemmaOuter,
  analemmaNotch,
  analemmaStaff,
  analemmaWood,
  overdueAnalemma,
  pairVane,
  readAnalemmaViews,
  restingAnalemma,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type GlyphRow,
  type Analemma,
} from "../src/lib/crmv4/round315";

function rule(partial: Partial<Analemma> & { id: string; title: string }): Analemma {
  return {
    note: "",
    bearer: "",
    staff: "",
    notch: null,
    wood: "",
    vane: 1,
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
  assert.equal(ROUND315_FEATURES.length, 25);
  assert.equal(ROUND315_FEATURES.includes("sale-glyphs"), true);
  assert.equal(ROUND315_FEATURES.includes("sla-hour"), true);
  assert.equal(ROUND315_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND315_FEATURES.includes("vault"), true);
  assert.equal(ROUND315_FEATURES.includes("gilt-metal"), true);
  assert.equal(analemmaStaff(" rise "), "rise");
  assert.equal(analemmaStaff("brass"), "");
  assert.equal(analemmaNotch("5"), 5);
  assert.equal(analemmaNotch(10), 10);
  assert.equal(analemmaNotch(20), 20);
  assert.equal(analemmaNotch(40), 40);
  assert.equal(analemmaNotch("8"), null);
  assert.equal(analemmaVane("1"), 1);
  assert.equal(analemmaVane(3), 3);
  assert.equal(analemmaVane("9"), 9);
  assert.equal(analemmaVane("4"), null);
  assert.equal(analemmaWood("gilt"), "GILT");
  assert.equal(analemmaWood("ivory"), "IVORY");
  assert.equal(analemmaWood("slate"), "SLATE");
  assert.equal(analemmaWood("hot"), "");
  assert.equal(analemmaInner("rise"), true);
  assert.equal(analemmaInner("NOON"), true);
  assert.equal(analemmaInner("dusk"), false);
  assert.equal(analemmaOuter("dusk"), true);
  assert.equal(analemmaOuter("night"), true);
  assert.equal(analemmaOuter("rise"), false);
  assert.equal(analemmaBand("rise"), "dawn");
  assert.equal(analemmaBand("noon"), "zenith");
  assert.equal(analemmaBand("dusk"), "ember");
  assert.equal(analemmaBand("night"), "dark");
  assert.equal(analemmaBand(""), "");
  assert.equal(analemmaGap("rise", "night"), 3);
  assert.equal(analemmaGap("dusk", "nope"), null);
  assert.equal(houseWood("gilt"), true);
  assert.equal(houseWood("ivory"), false);
  assert.equal(pairVane(3), true);
  assert.equal(pairVane(1), false);
  assert.equal(fullVane("9"), true);
  assert.equal(fullVane(3), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("dusk"), "dusk");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("40"), "40");
  assert.equal(activeNotch("5"), "5");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("1"), "1");
  assert.equal(activeVane("4"), "all");
  assert.equal(activeWood("slate", ["SLATE"]), "SLATE");
  assert.equal(activeWood("hot", ["SLATE"]), "all");
  assert.equal(moveAnalemmaFocus(0, 3, -1), 2);
  assert.equal(moveAnalemmaFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "dusk", vane: 1, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "rise", wood: "SLATE", notch: 40, vane: 9, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "night", wood: "IVORY", notch: 10, bearer: "Ida" }),
  ];
  assert.equal(overdueAnalemma(cards[0]), true);
  assert.equal(briskAnalemma(cards[1]), true);
  assert.equal(restingAnalemma(cards[2]), true);
  assert.equal(idleAnalemma(rule({ id: "i", title: "Idle", notch: 5, vane: 1 })), true);
  assert.equal(lateAnalemma(cards[1], "night"), true);
  assert.equal(lateAnalemma(cards[1], "rise"), false);
  assert.equal(suggestWood([]), "SLATE");
  assert.equal(suggestWood(cards), "GILT");
  assert.equal(suggestNotch([], 3), 5);
  assert.equal(suggestNotch([], 6), 10);
  assert.equal(suggestNotch([], 11), 20);
  assert.equal(suggestNotch([], 16), 40);
  assert.equal(suggestNotch(cards, 6), 20);
  assert.equal(suggestStaff(6), "rise");
  assert.equal(suggestStaff(7), "night");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addAnalemma([], { title: "Dora", staff: "dusk", wood: "ivory", notch: "10", vane: "3", tags: "e f x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "IVORY");
  assert.equal(saved[0].notch, 10);
  assert.equal(saved[0].vane, 3);
  assert.equal(saved[0].tags.join(""), "ef");
  assert.equal(addAnalemma(saved, { title: "Dora" }).length, 1);
  assert.equal(dropAnalemmaView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readAnalemmaViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(glyphHouse("NEW"), true);
  assert.equal(glyphHouse({ saleStatus: true }), true);
  assert.equal(glyphHarbor({ saleStatus: false }), true);
  assert.equal(glyphHouse({ saleStatus: "warm" }), true);
  assert.equal(glyphFort("re-check"), true);
  assert.equal(glyphHarbor("needs review"), true);
  assert.equal(glyphSpark("US"), true);
  assert.equal(glyphSpark("NET"), true);
  assert.equal(glyphSpark("ABCD"), false);
  assert.equal(glyphScroll("VeryLongIpAddress"), true);
  assert.equal(glyphScroll("Constantinople"), false);
  assert.equal(glyphLane("12"), "spark");
  assert.equal(glyphLane("10.1.1.1"), "digit");
  assert.equal(glyphLane("Amsterdam"), "vowel");
  assert.equal(glyphLane("Paris"), "post");
  assert.equal(glyphPost("Paris"), true);
  assert.equal(glyphOpen(""), true);
  assert.equal(glyphOpen({ saleStatus: "" }), true);
  assert.equal(glyphState({ name: "Ada" }), "");
  assert.equal(glyphState({ saleStatus: "Paris", balance: 1 }), "");
  assert.equal(glyphHue("NEW"), "champagne");
  assert.equal(glyphHue("needs review"), "graphite");
  assert.equal(glyphHue("Amsterdam"), "ivory");
  assert.equal(glyphLength("hold"), 4);
  assert.equal(glyphEven("hold"), true);
  assert.equal(glyphFirst("Paris"), true);
  assert.equal(glyphSpace("needs review"), true);
  assert.equal(glyphVowel("Amsterdam"), true);
  assert.equal(glyphDigit("Room4"), true);
  assert.equal(glyphCapital("PARIS"), true);
  assert.equal(glyphLower("paris"), true);
  assert.equal(glyphUpper("HOUSEX"), true);
  assert.equal(glyphUpper("NEW"), false);
  assert.equal(glyphTail("Room4"), true);
  const marks: GlyphRow[] = [
    { id: "1", label: "Ada", glyph: "NEW" },
    { id: "2", label: "Bea", glyph: "WARM" },
    { id: "3", label: "Cara", glyph: "Paris" },
  ];
  assert.equal(leadingGlyph(marks), "house");
  assert.match(glyphLanesCsv(marks), /house,2/);
  assert.match(glyphRowsCsv(marks, ["1"]), /Ada,NEW/);
  assert.equal(crmv4Text("tr", "almTitle"), ROUND315_COPY.tr.almTitle);
  assert.equal(crmv4Text("de", "glyTitle"), ROUND315_COPY.de.glyTitle);
  assert.equal(crmv4Text("ru", "hstImpluviumKicker"), ROUND315_COPY.ru.hstImpluviumKicker);
  assert.equal(crmv4Text("ar", "tsvCompluviumLead"), ROUND315_COPY.ar.tsvCompluviumLead);
  const keys = Object.keys(ROUND315_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND315_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-analemma/);
  assert.match(css, /\.c4-glyph/);
  assert.match(css, /\.c4-analemma-column/);
  assert.match(css, /\.c4-glyph-column/);
  assert.match(css, /\.c4-host-impluvium/);
  assert.match(css, /\.c4-server-compluvium/);
  assert.match(css, /\.c4-host-impluvium-mast/);
  assert.match(css, /\.c4-server-compluvium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round315.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /saleStatus:/);
  assert.match(viewFile, /analemmaCsv/);
  assert.match(viewFile, /glyphRowsCsv/);
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
  assert.match(viewFile, /c4-glyph-search/);
  assert.match(viewFile, /analemmaTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "alm"/);
  assert.match(app, /view === "gly"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round135.tsx"), "utf8");
  assert.match(host, /c4-host-impluvium/);
  assert.match(host, /c4-host-impluvium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /hstImpluviumKicker/);
  assert.match(host, /hstImpluviumLead/);
  assert.match(host, /data-host/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-server-compluvium/);
  assert.match(host, /c4-server-compluvium-mast/);
  assert.match(host, /tsvCompluviumKicker/);
  assert.match(host, /tsvCompluviumLead/);
  assert.match(host, /data-server/);
  assert.equal(host.includes("price"), false);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(alm|gly|hstImpluvium|tsvCompluvium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND315_COPY.en[key as keyof typeof ROUND315_COPY.en], "string", key);
    console.log("crmv4 round315 tests passed");
}

main();
