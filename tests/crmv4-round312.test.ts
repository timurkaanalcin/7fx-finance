/**
 * Libella rules, sigil plates, the ivory concierge tablinum, and the graphite valet cubiculum.
 * Run: TZ=UTC npx tsx tests/crmv4-round312.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND312_COPY } from "../src/lib/crmv4/copy-round312";
import {
  ROUND312_FEATURES,
  activeVane,
  activeNotch,
  activeStaff,
  activeWood,
  addLibella,
  briskLibella,
  dropLibellaView,
  fairBearer,
  fullVane,
  sigilCapital,
  sigilDigit,
  sigilEven,
  sigilFirst,
  sigilFort,
  sigilHarbor,
  sigilHouse,
  sigilHue,
  sigilLanesCsv,
  sigilLength,
  sigilLower,
  sigilLane,
  sigilOpen,
  sigilPost,
  sigilRowsCsv,
  sigilScroll,
  sigilSpace,
  sigilSpark,
  sigilState,
  sigilTail,
  sigilUpper,
  sigilVowel,
  houseWood,
  idleLibella,
  lateLibella,
  leadingSigil,
  moveLibellaFocus,
  libellaBand,
  libellaGap,
  libellaVane,
  libellaInner,
  libellaOuter,
  libellaNotch,
  libellaStaff,
  libellaWood,
  overdueLibella,
  pairVane,
  readLibellaViews,
  restingLibella,
  suggestNotch,
  suggestStaff,
  suggestWood,
  type SigilRow,
  type Libella,
} from "../src/lib/crmv4/round312";

function rule(partial: Partial<Libella> & { id: string; title: string }): Libella {
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
  assert.equal(ROUND312_FEATURES.length, 25);
  assert.equal(ROUND312_FEATURES.includes("sigil"), true);
  assert.equal(ROUND312_FEATURES.includes("rung"), true);
  assert.equal(ROUND312_FEATURES.includes("fair-level"), true);
  assert.equal(ROUND312_FEATURES.includes("chest"), true);
  assert.equal(libellaStaff(" stem "), "stem");
  assert.equal(libellaStaff("brass"), "");
  assert.equal(libellaNotch("5"), 5);
  assert.equal(libellaNotch(10), 10);
  assert.equal(libellaNotch(15), 15);
  assert.equal(libellaNotch(20), 20);
  assert.equal(libellaNotch("8"), null);
  assert.equal(libellaVane("1"), 1);
  assert.equal(libellaVane(3), 3);
  assert.equal(libellaVane("7"), 7);
  assert.equal(libellaVane("2"), null);
  assert.equal(libellaWood("cedar"), "CEDAR");
  assert.equal(libellaWood("oak"), "OAK");
  assert.equal(libellaWood("pine"), "PINE");
  assert.equal(libellaWood("hot"), "");
  assert.equal(libellaInner("stem"), true);
  assert.equal(libellaInner("BRACE"), true);
  assert.equal(libellaInner("plumb"), false);
  assert.equal(libellaOuter("plumb"), true);
  assert.equal(libellaOuter("foot"), true);
  assert.equal(libellaOuter("stem"), false);
  assert.equal(libellaBand("stem"), "ridge");
  assert.equal(libellaBand("brace"), "span");
  assert.equal(libellaBand("plumb"), "line");
  assert.equal(libellaBand("foot"), "base");
  assert.equal(libellaBand(""), "");
  assert.equal(libellaGap("stem", "foot"), 3);
  assert.equal(libellaGap("plumb", "nope"), null);
  assert.equal(houseWood("cedar"), true);
  assert.equal(houseWood("oak"), false);
  assert.equal(pairVane(3), true);
  assert.equal(pairVane(1), false);
  assert.equal(fullVane("7"), true);
  assert.equal(fullVane(3), false);
  assert.equal(activeStaff("inner"), "inner");
  assert.equal(activeStaff("plumb"), "plumb");
  assert.equal(activeStaff("gold"), "all");
  assert.equal(activeNotch("20"), "20");
  assert.equal(activeNotch("5"), "5");
  assert.equal(activeNotch("7"), "all");
  assert.equal(activeVane("1"), "1");
  assert.equal(activeVane("2"), "all");
  assert.equal(activeWood("pine", ["PINE"]), "PINE");
  assert.equal(activeWood("hot", ["PINE"]), "all");
  assert.equal(moveLibellaFocus(0, 3, -1), 2);
  assert.equal(moveLibellaFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", staff: "plumb", vane: 1, bearer: "Ned" }),
    rule({ id: "b", title: "Bea", staff: "stem", wood: "PINE", notch: 20, vane: 7, bearer: "Ned" }),
    rule({ id: "c", title: "Cara", staff: "foot", wood: "OAK", notch: 10, bearer: "Ida" }),
  ];
  assert.equal(overdueLibella(cards[0]), true);
  assert.equal(briskLibella(cards[1]), true);
  assert.equal(restingLibella(cards[2]), true);
  assert.equal(idleLibella(rule({ id: "i", title: "Idle", notch: 5, vane: 1 })), true);
  assert.equal(lateLibella(cards[1], "foot"), true);
  assert.equal(lateLibella(cards[1], "stem"), false);
  assert.equal(suggestWood([]), "PINE");
  assert.equal(suggestWood(cards), "CEDAR");
  assert.equal(suggestNotch([], 3), 5);
  assert.equal(suggestNotch([], 5), 10);
  assert.equal(suggestNotch([], 10), 15);
  assert.equal(suggestNotch([], 14), 20);
  assert.equal(suggestNotch(cards, 6), 15);
  assert.equal(suggestStaff(5), "stem");
  assert.equal(suggestStaff(6), "foot");
  assert.equal(fairBearer(cards, "Ida,Ned"), "Ida");
  const saved = addLibella([], { title: "Dora", staff: "plumb", wood: "oak", notch: "10", vane: "3", tags: "c d x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].wood, "OAK");
  assert.equal(saved[0].notch, 10);
  assert.equal(saved[0].vane, 3);
  assert.equal(saved[0].tags.join(""), "cd");
  assert.equal(addLibella(saved, { title: "Dora" }).length, 1);
  assert.equal(dropLibellaView([{ id: "v", name: "Morning", tray: "yard", query: "", bearer: "", wood: "all", staff: "all", notch: "all", vane: "all" }], "v").length, 0);
  assert.equal(readLibellaViews([{ id: "v", name: "Morning", tray: "rack" }])[0].tray, "rack");

  assert.equal(sigilHouse("ALPHA"), true);
  assert.equal(sigilHouse({ accountLoginId: true }), true);
  assert.equal(sigilHarbor({ accountLoginId: false }), true);
  assert.equal(sigilHouse({ accountLoginId: "bravo" }), true);
  assert.equal(sigilFort("re-check"), true);
  assert.equal(sigilHarbor("needs review"), true);
  assert.equal(sigilSpark("US"), true);
  assert.equal(sigilScroll("Constantinople"), true);
  assert.equal(sigilLane("Amsterdam"), "vowel");
  assert.equal(sigilLane("Paris"), "post");
  assert.equal(sigilPost("Paris"), true);
  assert.equal(sigilOpen(""), true);
  assert.equal(sigilOpen({ accountLoginId: "" }), true);
  assert.equal(sigilState({ name: "Ada" }), "");
  assert.equal(sigilState({ accountLoginId: "Paris", balance: 1 }), "");
  assert.equal(sigilHue("ALPHA"), "champagne");
  assert.equal(sigilHue("needs review"), "graphite");
  assert.equal(sigilHue("Amsterdam"), "ivory");
  assert.equal(sigilLength("hold"), 4);
  assert.equal(sigilEven("hold"), true);
  assert.equal(sigilFirst("Paris"), true);
  assert.equal(sigilSpace("needs review"), true);
  assert.equal(sigilVowel("Amsterdam"), true);
  assert.equal(sigilDigit("Room4"), true);
  assert.equal(sigilCapital("PARIS"), true);
  assert.equal(sigilLower("paris"), true);
  assert.equal(sigilUpper("HOUSE"), true);
  const marks: SigilRow[] = [
    { id: "1", label: "Ada", sigil: "ALPHA" },
    { id: "2", label: "Bea", sigil: "BRAVO" },
    { id: "3", label: "Cara", sigil: "Paris" },
  ];
  assert.equal(leadingSigil(marks), "house");
  assert.match(sigilLanesCsv(marks), /house,2/);
  assert.match(sigilRowsCsv(marks, ["1"]), /Ada,ALPHA/);
  assert.equal(crmv4Text("tr", "lblTitle"), ROUND312_COPY.tr.lblTitle);
  assert.equal(crmv4Text("de", "sigTitle"), ROUND312_COPY.de.sigTitle);
  assert.equal(crmv4Text("ru", "cncTablinumKicker"), ROUND312_COPY.ru.cncTablinumKicker);
  assert.equal(crmv4Text("ar", "vltCubiculumLead"), ROUND312_COPY.ar.vltCubiculumLead);
  const keys = Object.keys(ROUND312_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND312_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-libella/);
  assert.match(css, /\.c4-sigil/);
  assert.match(css, /\.c4-libella-column/);
  assert.match(css, /\.c4-sigil-column/);
  assert.match(css, /\.c4-concierge-tablinum/);
  assert.match(css, /\.c4-valet-cubiculum/);
  assert.match(css, /\.c4-concierge-tablinum-mast/);
  assert.match(css, /\.c4-valet-cubiculum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round312.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /accountLoginId:/);
  assert.match(viewFile, /libellaCsv/);
  assert.match(viewFile, /sigilRowsCsv/);
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
  assert.match(viewFile, /c4-sigil-search/);
  assert.match(viewFile, /libellaTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "lbl"/);
  assert.match(app, /view === "sig"/);
  const concierge = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round130.tsx"), "utf8");
  assert.match(concierge, /c4-concierge-tablinum/);
  assert.match(concierge, /c4-concierge-tablinum-mast/);
  assert.match(concierge, /data-logo="mono"/);
  assert.match(concierge, /cncTablinumKicker/);
  assert.match(concierge, /cncTablinumLead/);
  assert.match(concierge, /data-concierge/);
  assert.equal(concierge.includes("amount"), false);
  const valet = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round131.tsx"), "utf8");
  assert.match(valet, /c4-valet-cubiculum/);
  assert.match(valet, /c4-valet-cubiculum-mast/);
  assert.match(valet, /vltCubiculumKicker/);
  assert.match(valet, /vltCubiculumLead/);
  assert.match(valet, /data-valet/);
  assert.equal(valet.includes("price"), false);
  assert.equal(valet.includes("amount"), false);
  assert.equal(valet.includes("currency"), false);
  const namedKeys = `${viewFile}\n${concierge}\n${valet}`.match(/"(lbl|sig|cncTablinum|vltCubiculum)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND312_COPY.en[key as keyof typeof ROUND312_COPY.en], "string", key);
  console.log("crmv4 round312 tests passed");
}

main();
