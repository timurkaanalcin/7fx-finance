/**
 * Karrusel rules, loxodrome plates, the ivory ribbon laconicum, and the graphite reason sudatorium.
 * Run: TZ=UTC npx tsx tests/crmv4-round323.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND323_COPY } from "../src/lib/crmv4/copy-round323";
import {
  ROUND323_FEATURES,
  activeBeat,
  activeInk,
  activePart,
  activeTooth,
  addKarrusel,
  briskKarrusel,
  dropKarruselView,
  fairKeeper,
  fullBeat,
  idleKarrusel,
  lateKarrusel,
  leadingLoxodrome,
  moveKarruselFocus,
  overdueKarrusel,
  pairBeat,
  quietInk,
  readKarruselViews,
  reminderKarruselRules,
  restingKarrusel,
  karruselBand,
  karruselBeat,
  karruselGap,
  karruselInk,
  karruselInner,
  karruselOuter,
  karruselPart,
  karruselTimeline,
  karruselTooth,
  loxodromeCapital,
  loxodromeDay,
  loxodromeDigit,
  loxodromeEven,
  loxodromeFirst,
  loxodromeGap,
  loxodromeHue,
  loxodromeLane,
  loxodromeLanesCsv,
  loxodromeLength,
  loxodromeLower,
  loxodromeOpen,
  loxodromePath,
  loxodromeRowsCsv,
  loxodromeScroll,
  loxodromeSlash,
  loxodromeSpace,
  loxodromeState,
  loxodromeStub,
  loxodromeTail,
  loxodromeUpper,
  loxodromeVowel,
  suggestInk,
  suggestPart,
  suggestTooth,
  type Karrusel,
  type LoxodromeRow,
} from "../src/lib/crmv4/round323";

function rule(partial: Partial<Karrusel> & { id: string; title: string }): Karrusel {
  return {
    note: "",
    keeper: "",
    part: "",
    tooth: null,
    ink: "",
    beat: 4,
    tags: [],
    wound: false,
    hooked: false,
    vaulted: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND323_FEATURES.length, 25);
  assert.equal(ROUND323_FEATURES.includes("desk-loxodrome"), true);
  assert.equal(ROUND323_FEATURES.includes("beat-sla"), true);
  assert.equal(ROUND323_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND323_FEATURES.includes("vault"), true);
  assert.equal(ROUND323_FEATURES.includes("gilt-ink"), true);
  assert.equal(karruselPart(" carriage "), "carriage");
  assert.equal(karruselPart("brass"), "");
  assert.equal(karruselTooth("1"), 1);
  assert.equal(karruselTooth(4), 4);
  assert.equal(karruselTooth(7), 7);
  assert.equal(karruselTooth(10), 10);
  assert.equal(karruselTooth("2"), null);
  assert.equal(karruselBeat("4"), 4);
  assert.equal(karruselBeat(8), 8);
  assert.equal(karruselBeat("12"), 12);
  assert.equal(karruselBeat("3"), null);
  assert.equal(karruselInk("gilt"), "GILT");
  assert.equal(karruselInk("ivory"), "IVORY");
  assert.equal(karruselInk("graphite"), "GRAPHITE");
  assert.equal(karruselInk("hot"), "");
  assert.equal(karruselInner("carriage"), true);
  assert.equal(karruselInner("ARBOR"), true);
  assert.equal(karruselInner("platform"), false);
  assert.equal(karruselOuter("platform"), true);
  assert.equal(karruselOuter("collet"), true);
  assert.equal(karruselOuter("carriage"), false);
  assert.equal(karruselBand("carriage"), "ring");
  assert.equal(karruselBand("arbor"), "axle");
  assert.equal(karruselBand("platform"), "deck");
  assert.equal(karruselBand("collet"), "collar");
  assert.equal(karruselBand(""), "");
  assert.equal(karruselGap("carriage", "collet"), 3);
  assert.equal(karruselGap("platform", "nope"), null);
  assert.equal(quietInk("ivory"), true);
  assert.equal(quietInk("graphite"), true);
  assert.equal(quietInk("gilt"), false);
  assert.equal(pairBeat(8), true);
  assert.equal(pairBeat(4), false);
  assert.equal(fullBeat("12"), true);
  assert.equal(fullBeat(8), false);
  assert.equal(activePart("inner"), "inner");
  assert.equal(activePart("platform"), "platform");
  assert.equal(activePart("gold"), "all");
  assert.equal(activeTooth("10"), "10");
  assert.equal(activeTooth("1"), "1");
  assert.equal(activeTooth("2"), "all");
  assert.equal(activeBeat("4"), "4");
  assert.equal(activeBeat("5"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveKarruselFocus(0, 3, -1), 2);
  assert.equal(moveKarruselFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", part: "platform", beat: 4, keeper: "Ned" }),
    rule({ id: "b", title: "Bea", part: "carriage", ink: "GRAPHITE", tooth: 10, beat: 12, keeper: "Ned" }),
    rule({ id: "c", title: "Cara", part: "collet", ink: "GRAPHITE", tooth: 4, keeper: "Ida" }),
  ];
  assert.equal(overdueKarrusel(cards[0]), true);
  assert.equal(briskKarrusel(rule({ id: "g", title: "Gilt", ink: "GILT", tooth: 10, beat: 12 })), true);
  assert.equal(briskKarrusel(cards[1]), false);
  assert.equal(restingKarrusel(rule({ id: "r", title: "Rest", part: "collet", ink: "IVORY", tooth: 4 })), true);
  assert.equal(restingKarrusel(cards[2]), false);
  assert.equal(idleKarrusel(rule({ id: "i", title: "Idle", tooth: 1, beat: 4 })), true);
  assert.equal(lateKarrusel(cards[1], "collet"), true);
  assert.equal(lateKarrusel(cards[1], "carriage"), false);
  assert.deepEqual(reminderKarruselRules(cards), ["Ada", "Cara"]);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestInk(cards), "IVORY");
  assert.equal(suggestInk([rule({ id: "v", title: "Ivory", ink: "IVORY" })]), "GILT");
  assert.equal(suggestTooth([], 4), 1);
  assert.equal(suggestTooth([], 8), 4);
  assert.equal(suggestTooth([], 14), 7);
  assert.equal(suggestTooth([], 20), 10);
  assert.equal(suggestTooth(cards, 6), 1);
  assert.equal(suggestPart(4), "carriage");
  assert.equal(suggestPart(14), "collet");
  assert.equal(fairKeeper(cards, "Ida,Ned"), "Ida");
  const saved = addKarrusel([], { title: "Dora", part: "platform", ink: "ivory", tooth: "4", beat: "8", tags: "k r x" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].tooth, 4);
  assert.equal(saved[0].beat, 8);
  assert.equal(saved[0].tags.join(""), "kr");
  assert.equal(saved[0].audit, "save");
  assert.equal(addKarrusel(saved, { title: "Dora" }).length, 1);
  assert.equal(dropKarruselView([{ id: "v", name: "Morning", tray: "bench", query: "", keeper: "", ink: "all", part: "all", tooth: "all", beat: "all" }], "v").length, 0);
  assert.equal(readKarruselViews([{ id: "v", name: "Morning", tray: "hook" }])[0].tray, "hook");

  assert.equal(loxodromeDay("DAY"), true);
  assert.equal(loxodromeDay({ desk: true }), true);
  assert.equal(loxodromeGap({ desk: false }), true);
  assert.equal(loxodromeDay({ desk: "path" }), false);
  assert.equal(loxodromeSlash("re/check"), true);
  assert.equal(loxodromeGap("needs review"), true);
  assert.equal(loxodromeStub("US"), true);
  assert.equal(loxodromeStub("NET"), false);
  assert.equal(loxodromeScroll("VeryLongDeskNameXX"), true);
  assert.equal(loxodromeScroll("Netherlands"), false);
  assert.equal(loxodromeLane("US"), "stub");
  assert.equal(loxodromeLane("10.1.1.1"), "mark");
  assert.equal(loxodromeLane("Amsterdam"), "vowel");
  assert.equal(loxodromeLane("Paris"), "path");
  assert.equal(loxodromePath("Paris"), true);
  assert.equal(loxodromeOpen(""), true);
  assert.equal(loxodromeOpen({ desk: "" }), true);
  assert.equal(loxodromeState({ name: "Ada" }), "");
  assert.equal(loxodromeState({ desk: "Paris", balance: 1 }), "");
  assert.equal(loxodromeHue("DAY"), "champagne");
  assert.equal(loxodromeHue("needs review"), "graphite");
  assert.equal(loxodromeHue("Amsterdam"), "ivory");
  assert.equal(loxodromeLength("hold"), 4);
  assert.equal(loxodromeEven("hold"), true);
  assert.equal(loxodromeFirst("Paris"), true);
  assert.equal(loxodromeSpace("needs review"), true);
  assert.equal(loxodromeVowel("Amsterdam"), true);
  assert.equal(loxodromeDigit("Room4"), true);
  assert.equal(loxodromeCapital("PARIS"), true);
  assert.equal(loxodromeLower("paris"), true);
  assert.equal(loxodromeUpper("RETENTION"), true);
  assert.equal(loxodromeUpper("NET"), false);
  assert.equal(loxodromeTail("Room4"), true);
  const marks: LoxodromeRow[] = [
    { id: "1", label: "Ada", code: "DAY" },
    { id: "2", label: "Bea", code: "NIGHT" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingLoxodrome(marks), "day");
  assert.match(loxodromeLanesCsv(marks), /day,2/);
  assert.match(loxodromeRowsCsv(marks, ["1"]), /Ada,DAY/);
  assert.match(karruselTimeline(cards).map((lane) => lane.tooth).join(","), /10|4/);
  assert.equal(crmv4Text("tr", "krsTitle"), ROUND323_COPY.tr.krsTitle);
  assert.equal(crmv4Text("de", "lxdTitle"), ROUND323_COPY.de.lxdTitle);
  assert.equal(crmv4Text("ru", "ribLaconicumKicker"), ROUND323_COPY.ru.ribLaconicumKicker);
  assert.equal(crmv4Text("ar", "rsnSudatoriumLead"), ROUND323_COPY.ar.rsnSudatoriumLead);
  const keys = Object.keys(ROUND323_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND323_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-karrusel/);
  assert.match(css, /\.c4-loxodrome/);
  assert.match(css, /\.c4-karrusel-column/);
  assert.match(css, /\.c4-loxodrome-column/);
  assert.match(css, /\.c4-rib-laconicum/);
  assert.match(css, /\.c4-reason-sudatorium/);
  assert.match(css, /\.c4-rib-laconicum-mast/);
  assert.match(css, /\.c4-reason-sudatorium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round323.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /desk/);
  assert.match(viewFile, /karruselCsv/);
  assert.match(viewFile, /loxodromeRowsCsv/);
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
  assert.match(viewFile, /c4-loxodrome-search/);
  assert.match(viewFile, /karruselTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "krs"/);
  assert.match(app, /view === "lxd"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round143.tsx"), "utf8");
  assert.match(host, /c4-rib-laconicum/);
  assert.match(host, /c4-rib-laconicum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /ribLaconicumKicker/);
  assert.match(host, /ribLaconicumLead/);
  assert.match(host, /data-ribbon/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-reason-sudatorium/);
  assert.match(host, /c4-reason-sudatorium-mast/);
  assert.match(host, /rsnSudatoriumKicker/);
  assert.match(host, /rsnSudatoriumLead/);
  assert.match(host, /data-reason/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(krs|lxd|ribLaconicum|rsnSudatorium)[A-Za-z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND323_COPY.en[key as keyof typeof ROUND323_COPY.en], "string", key);
  console.log("crmv4 round323 tests passed");
}

main();
