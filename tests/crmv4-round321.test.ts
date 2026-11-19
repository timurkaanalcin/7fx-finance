/**
 * Remontoire rules, rhumb plates, the ivory stack hypogeum, and the graphite atlas mithraeum.
 * Run: TZ=UTC npx tsx tests/crmv4-round321.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND321_COPY } from "../src/lib/crmv4/copy-round321";
import {
  ROUND321_FEATURES,
  activeInk,
  activePiece,
  activeTooth,
  activeTurn,
  addRemontoire,
  briskRemontoire,
  dropRemontoireView,
  fairSmith,
  fullTurn,
  houseInk,
  idleRemontoire,
  lateRemontoire,
  leadingRhumb,
  moveRemontoireFocus,
  overdueRemontoire,
  pairTurn,
  readRemontoireViews,
  reminderRemontoireRules,
  remontoireBand,
  remontoireGap,
  remontoireInk,
  remontoireInner,
  remontoireOuter,
  remontoirePiece,
  remontoireTimeline,
  remontoireTooth,
  remontoireTurn,
  restingRemontoire,
  rhumbCapital,
  rhumbDigit,
  rhumbEven,
  rhumbFirst,
  rhumbHouse,
  rhumbHue,
  rhumbJoin,
  rhumbLane,
  rhumbLanesCsv,
  rhumbLength,
  rhumbLower,
  rhumbOpen,
  rhumbPath,
  rhumbRowsCsv,
  rhumbScroll,
  rhumbSpace,
  rhumbSpan,
  rhumbState,
  rhumbStub,
  rhumbTail,
  rhumbUpper,
  rhumbVowel,
  suggestInk,
  suggestPiece,
  suggestTooth,
  type Remontoire,
  type RhumbRow,
} from "../src/lib/crmv4/round321";

function rule(partial: Partial<Remontoire> & { id: string; title: string }): Remontoire {
  return {
    note: "",
    smith: "",
    piece: "",
    tooth: null,
    ink: "",
    turn: 4,
    tags: [],
    spun: false,
    clicked: false,
    boxed: false,
    starred: false,
    audit: "",
    ...partial,
  };
}

function main() {
  assert.equal(ROUND321_FEATURES.length, 25);
  assert.equal(ROUND321_FEATURES.includes("assignee-rhumb"), true);
  assert.equal(ROUND321_FEATURES.includes("notch-sla"), true);
  assert.equal(ROUND321_FEATURES.includes("fair-winder"), true);
  assert.equal(ROUND321_FEATURES.includes("coffer"), true);
  assert.equal(ROUND321_FEATURES.includes("gilt-ink"), true);
  assert.equal(remontoirePiece(" spring "), "spring");
  assert.equal(remontoirePiece("brass"), "");
  assert.equal(remontoireTooth("3"), 3);
  assert.equal(remontoireTooth(6), 6);
  assert.equal(remontoireTooth(9), 9);
  assert.equal(remontoireTooth(12), 12);
  assert.equal(remontoireTooth("7"), null);
  assert.equal(remontoireTurn("4"), 4);
  assert.equal(remontoireTurn(8), 8);
  assert.equal(remontoireTurn("12"), 12);
  assert.equal(remontoireTurn("3"), null);
  assert.equal(remontoireInk("gilt"), "GILT");
  assert.equal(remontoireInk("ivory"), "IVORY");
  assert.equal(remontoireInk("graphite"), "GRAPHITE");
  assert.equal(remontoireInk("hot"), "");
  assert.equal(remontoireInner("spring"), true);
  assert.equal(remontoireInner("PAWL"), true);
  assert.equal(remontoireInner("wheel"), false);
  assert.equal(remontoireOuter("wheel"), true);
  assert.equal(remontoireOuter("detent"), true);
  assert.equal(remontoireOuter("spring"), false);
  assert.equal(remontoireBand("spring"), "coil");
  assert.equal(remontoireBand("pawl"), "catch");
  assert.equal(remontoireBand("wheel"), "rim");
  assert.equal(remontoireBand("detent"), "lock");
  assert.equal(remontoireBand(""), "");
  assert.equal(remontoireGap("spring", "detent"), 3);
  assert.equal(remontoireGap("wheel", "nope"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("graphite"), true);
  assert.equal(houseInk("gilt"), false);
  assert.equal(pairTurn(8), true);
  assert.equal(pairTurn(4), false);
  assert.equal(fullTurn("12"), true);
  assert.equal(fullTurn(8), false);
  assert.equal(activePiece("inner"), "inner");
  assert.equal(activePiece("wheel"), "wheel");
  assert.equal(activePiece("gold"), "all");
  assert.equal(activeTooth("12"), "12");
  assert.equal(activeTooth("3"), "3");
  assert.equal(activeTooth("7"), "all");
  assert.equal(activeTurn("4"), "4");
  assert.equal(activeTurn("3"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveRemontoireFocus(0, 3, -1), 2);
  assert.equal(moveRemontoireFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", piece: "wheel", turn: 4, smith: "Ned" }),
    rule({ id: "b", title: "Bea", piece: "spring", ink: "GRAPHITE", tooth: 12, turn: 12, smith: "Ned" }),
    rule({ id: "c", title: "Cara", piece: "detent", ink: "GRAPHITE", tooth: 6, smith: "Ida" }),
  ];
  assert.equal(overdueRemontoire(cards[0]), true);
  assert.equal(briskRemontoire(rule({ id: "g", title: "Gilt", ink: "IVORY", tooth: 12, turn: 12 })), true);
  assert.equal(briskRemontoire(cards[1]), false);
  assert.equal(restingRemontoire(cards[2]), true);
  assert.equal(idleRemontoire(rule({ id: "i", title: "Idle", tooth: 3, turn: 4 })), true);
  assert.equal(lateRemontoire(cards[1], "detent"), true);
  assert.equal(lateRemontoire(cards[1], "spring"), false);
  assert.deepEqual(reminderRemontoireRules(cards), ["Ada", "Cara"]);
  assert.equal(suggestInk([]), "IVORY");
  assert.equal(suggestInk(cards), "IVORY");
  assert.equal(suggestInk([rule({ id: "v", title: "Ivy", ink: "IVORY" })]), "GILT");
  assert.equal(suggestTooth([], 4), 3);
  assert.equal(suggestTooth([], 6), 6);
  assert.equal(suggestTooth([], 12), 9);
  assert.equal(suggestTooth([], 18), 12);
  assert.equal(suggestTooth(cards, 6), 3);
  assert.equal(suggestPiece(4), "spring");
  assert.equal(suggestPiece(14), "detent");
  assert.equal(fairSmith(cards, "Ida,Ned"), "Ida");
  const saved = addRemontoire([], { title: "Dora", piece: "wheel", ink: "ivory", tooth: "6", turn: "8", tags: "w y r" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].tooth, 6);
  assert.equal(saved[0].turn, 8);
  assert.equal(saved[0].tags.join(""), "wy");
  assert.equal(saved[0].audit, "save");
  assert.equal(addRemontoire(saved, { title: "Dora" }).length, 1);
  assert.equal(dropRemontoireView([{ id: "v", name: "Morning", tray: "barrel", query: "", smith: "", ink: "all", piece: "all", tooth: "all", turn: "all" }], "v").length, 0);
  assert.equal(readRemontoireViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(rhumbHouse("SALES"), true);
  assert.equal(rhumbHouse({ owner: true }), true);
  assert.equal(rhumbSpan({ owner: false }), true);
  assert.equal(rhumbHouse({ owner: "path" }), false);
  assert.equal(rhumbJoin("re-check"), true);
  assert.equal(rhumbSpan("needs review"), true);
  assert.equal(rhumbStub("US"), true);
  assert.equal(rhumbStub("NET"), true);
  assert.equal(rhumbScroll("VeryLongAgentName"), true);
  assert.equal(rhumbScroll("Netherlands"), false);
  assert.equal(rhumbLane("US"), "stub");
  assert.equal(rhumbLane("10.1.1.1"), "digit");
  assert.equal(rhumbLane("Amsterdam"), "vowel");
  assert.equal(rhumbLane("Paris"), "path");
  assert.equal(rhumbPath("Paris"), true);
  assert.equal(rhumbOpen(""), true);
  assert.equal(rhumbOpen({ owner: "" }), true);
  assert.equal(rhumbState({ name: "Ada" }), "");
  assert.equal(rhumbState({ owner: "Paris", balance: 1 }), "");
  assert.equal(rhumbHue("SALES"), "champagne");
  assert.equal(rhumbHue("needs review"), "graphite");
  assert.equal(rhumbHue("Amsterdam"), "ivory");
  assert.equal(rhumbLength("hold"), 4);
  assert.equal(rhumbEven("hold"), true);
  assert.equal(rhumbFirst("Paris"), true);
  assert.equal(rhumbSpace("needs review"), true);
  assert.equal(rhumbVowel("Amsterdam"), true);
  assert.equal(rhumbDigit("Room4"), true);
  assert.equal(rhumbCapital("PARIS"), true);
  assert.equal(rhumbLower("paris"), true);
  assert.equal(rhumbUpper("RETENTION"), true);
  assert.equal(rhumbUpper("NET"), false);
  assert.equal(rhumbTail("Room4"), true);
  const marks: RhumbRow[] = [
    { id: "1", label: "Ada", code: "SALES" },
    { id: "2", label: "Bea", code: "RETENTION" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingRhumb(marks), "house");
  assert.match(rhumbLanesCsv(marks), /house,2/);
  assert.match(rhumbRowsCsv(marks, ["1"]), /Ada,SALES/);
  assert.match(remontoireTimeline(cards).map((lane) => lane.tooth).join(","), /12|6/);
  assert.equal(crmv4Text("tr", "rmtTitle"), ROUND321_COPY.tr.rmtTitle);
  assert.equal(crmv4Text("de", "rhbTitle"), ROUND321_COPY.de.rhbTitle);
  assert.equal(crmv4Text("ru", "slpHypogeumKicker"), ROUND321_COPY.ru.slpHypogeumKicker);
  assert.equal(crmv4Text("ar", "atlMithraeumLead"), ROUND321_COPY.ar.atlMithraeumLead);
  const keys = Object.keys(ROUND321_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND321_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-remontoire/);
  assert.match(css, /\.c4-rhumb/);
  assert.match(css, /\.c4-remontoire-column/);
  assert.match(css, /\.c4-rhumb-column/);
  assert.match(css, /\.c4-stack-hypogeum/);
  assert.match(css, /\.c4-atlas-mithraeum/);
  assert.match(css, /\.c4-stack-hypogeum-mast/);
  assert.match(css, /\.c4-atlas-mithraeum-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round321.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /assigneeName/);
  assert.match(viewFile, /remontoireCsv/);
  assert.match(viewFile, /rhumbRowsCsv/);
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
  assert.match(viewFile, /c4-rhumb-search/);
  assert.match(viewFile, /remontoireTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "rmt"/);
  assert.match(app, /view === "rhb"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round141.tsx"), "utf8");
  assert.match(host, /c4-stack-hypogeum/);
  assert.match(host, /c4-stack-hypogeum-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /slpHypogeumKicker/);
  assert.match(host, /slpHypogeumLead/);
  assert.match(host, /data-stack/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-atlas-mithraeum/);
  assert.match(host, /c4-atlas-mithraeum-mast/);
  assert.match(host, /atlMithraeumKicker/);
  assert.match(host, /atlMithraeumLead/);
  assert.match(host, /data-atlas/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(rmt|rhb|slpHypogeum|atlMithraeum)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND321_COPY.en[key as keyof typeof ROUND321_COPY.en], "string", key);
  console.log("crmv4 round321 tests passed");
}

main();
