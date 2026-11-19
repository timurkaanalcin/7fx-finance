/**
 * Tourbillon rules, isogonic plates, the ivory cue sacrarium, and the graphite region frigidarium.
 * Run: TZ=UTC npx tsx tests/crmv4-round322.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { crmv4Text } from "../src/lib/crmv4/copy";
import { ROUND322_COPY } from "../src/lib/crmv4/copy-round322";
import {
  ROUND322_FEATURES,
  activeInk,
  activePiece,
  activeTooth,
  activeTurn,
  addTourbillon,
  briskTourbillon,
  dropTourbillonView,
  fairSmith,
  fullTurn,
  houseInk,
  idleTourbillon,
  lateTourbillon,
  leadingIsogonic,
  moveTourbillonFocus,
  overdueTourbillon,
  pairTurn,
  readTourbillonViews,
  reminderTourbillonRules,
  restingTourbillon,
  tourbillonBand,
  tourbillonGap,
  tourbillonInk,
  tourbillonInner,
  tourbillonOuter,
  tourbillonPiece,
  tourbillonTimeline,
  tourbillonTooth,
  tourbillonTurn,
  isogonicCapital,
  isogonicDigit,
  isogonicEven,
  isogonicFirst,
  isogonicHouse,
  isogonicHue,
  isogonicJoin,
  isogonicLane,
  isogonicLanesCsv,
  isogonicLength,
  isogonicLower,
  isogonicOpen,
  isogonicPath,
  isogonicRowsCsv,
  isogonicScroll,
  isogonicSpace,
  isogonicSpan,
  isogonicState,
  isogonicStub,
  isogonicTail,
  isogonicUpper,
  isogonicVowel,
  suggestInk,
  suggestPiece,
  suggestTooth,
  type IsogonicRow,
  type Tourbillon,
} from "../src/lib/crmv4/round322";

function rule(partial: Partial<Tourbillon> & { id: string; title: string }): Tourbillon {
  return {
    note: "",
    smith: "",
    piece: "",
    tooth: null,
    ink: "",
    turn: 3,
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
  assert.equal(ROUND322_FEATURES.length, 25);
  assert.equal(ROUND322_FEATURES.includes("broker-isogonic"), true);
  assert.equal(ROUND322_FEATURES.includes("pinion-sla"), true);
  assert.equal(ROUND322_FEATURES.includes("fair-keeper"), true);
  assert.equal(ROUND322_FEATURES.includes("casket"), true);
  assert.equal(ROUND322_FEATURES.includes("gilt-ink"), true);
  assert.equal(tourbillonPiece(" cage "), "cage");
  assert.equal(tourbillonPiece("brass"), "");
  assert.equal(tourbillonTooth("2"), 2);
  assert.equal(tourbillonTooth(5), 5);
  assert.equal(tourbillonTooth(8), 8);
  assert.equal(tourbillonTooth(11), 11);
  assert.equal(tourbillonTooth("7"), null);
  assert.equal(tourbillonTurn("3"), 3);
  assert.equal(tourbillonTurn(6), 6);
  assert.equal(tourbillonTurn("9"), 9);
  assert.equal(tourbillonTurn("4"), null);
  assert.equal(tourbillonInk("gilt"), "GILT");
  assert.equal(tourbillonInk("ivory"), "IVORY");
  assert.equal(tourbillonInk("graphite"), "GRAPHITE");
  assert.equal(tourbillonInk("hot"), "");
  assert.equal(tourbillonInner("cage"), true);
  assert.equal(tourbillonInner("STAFF"), true);
  assert.equal(tourbillonInner("bridge"), false);
  assert.equal(tourbillonOuter("bridge"), true);
  assert.equal(tourbillonOuter("jewel"), true);
  assert.equal(tourbillonOuter("cage"), false);
  assert.equal(tourbillonBand("cage"), "spin");
  assert.equal(tourbillonBand("staff"), "stem");
  assert.equal(tourbillonBand("bridge"), "span");
  assert.equal(tourbillonBand("jewel"), "seat");
  assert.equal(tourbillonBand(""), "");
  assert.equal(tourbillonGap("cage", "jewel"), 3);
  assert.equal(tourbillonGap("bridge", "nope"), null);
  assert.equal(houseInk("ivory"), true);
  assert.equal(houseInk("gilt"), true);
  assert.equal(houseInk("graphite"), false);
  assert.equal(pairTurn(6), true);
  assert.equal(pairTurn(3), false);
  assert.equal(fullTurn("9"), true);
  assert.equal(fullTurn(6), false);
  assert.equal(activePiece("inner"), "inner");
  assert.equal(activePiece("bridge"), "bridge");
  assert.equal(activePiece("gold"), "all");
  assert.equal(activeTooth("11"), "11");
  assert.equal(activeTooth("2"), "2");
  assert.equal(activeTooth("7"), "all");
  assert.equal(activeTurn("3"), "3");
  assert.equal(activeTurn("4"), "all");
  assert.equal(activeInk("graphite", ["GRAPHITE"]), "GRAPHITE");
  assert.equal(activeInk("hot", ["GRAPHITE"]), "all");
  assert.equal(moveTourbillonFocus(0, 3, -1), 2);
  assert.equal(moveTourbillonFocus(0, 0, 1), 0);

  const cards = [
    rule({ id: "a", title: "Ada", piece: "bridge", turn: 3, smith: "Ned" }),
    rule({ id: "b", title: "Bea", piece: "cage", ink: "GRAPHITE", tooth: 11, turn: 9, smith: "Ned" }),
    rule({ id: "c", title: "Cara", piece: "jewel", ink: "GRAPHITE", tooth: 5, smith: "Ida" }),
  ];
  assert.equal(overdueTourbillon(cards[0]), true);
  assert.equal(briskTourbillon(rule({ id: "g", title: "Gilt", ink: "GILT", tooth: 11, turn: 9 })), true);
  assert.equal(briskTourbillon(cards[1]), false);
  assert.equal(restingTourbillon(rule({ id: "r", title: "Rest", piece: "jewel", ink: "IVORY", tooth: 5 })), true);
  assert.equal(restingTourbillon(cards[2]), false);
  assert.equal(idleTourbillon(rule({ id: "i", title: "Idle", tooth: 2, turn: 3 })), true);
  assert.equal(lateTourbillon(cards[1], "jewel"), true);
  assert.equal(lateTourbillon(cards[1], "cage"), false);
  assert.deepEqual(reminderTourbillonRules(cards), ["Ada", "Cara"]);
  assert.equal(suggestInk([]), "GILT");
  assert.equal(suggestInk(cards), "GILT");
  assert.equal(suggestInk([rule({ id: "v", title: "Gilt", ink: "GILT" })]), "GRAPHITE");
  assert.equal(suggestTooth([], 4), 2);
  assert.equal(suggestTooth([], 8), 5);
  assert.equal(suggestTooth([], 14), 8);
  assert.equal(suggestTooth([], 20), 11);
  assert.equal(suggestTooth(cards, 6), 2);
  assert.equal(suggestPiece(4), "cage");
  assert.equal(suggestPiece(14), "jewel");
  assert.equal(fairSmith(cards, "Ida,Ned"), "Ida");
  const saved = addTourbillon([], { title: "Dora", piece: "bridge", ink: "ivory", tooth: "5", turn: "6", tags: "c g r" });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].ink, "IVORY");
  assert.equal(saved[0].tooth, 5);
  assert.equal(saved[0].turn, 6);
  assert.equal(saved[0].tags.join(""), "cg");
  assert.equal(saved[0].audit, "save");
  assert.equal(addTourbillon(saved, { title: "Dora" }).length, 1);
  assert.equal(dropTourbillonView([{ id: "v", name: "Morning", tray: "barrel", query: "", smith: "", ink: "all", piece: "all", tooth: "all", turn: "all" }], "v").length, 0);
  assert.equal(readTourbillonViews([{ id: "v", name: "Morning", tray: "latch" }])[0].tray, "latch");

  assert.equal(isogonicHouse("HOUSE"), true);
  assert.equal(isogonicHouse({ broker: true }), true);
  assert.equal(isogonicSpan({ broker: false }), true);
  assert.equal(isogonicHouse({ broker: "path" }), false);
  assert.equal(isogonicJoin("re-check"), true);
  assert.equal(isogonicSpan("needs review"), true);
  assert.equal(isogonicStub("US"), true);
  assert.equal(isogonicStub("NET"), true);
  assert.equal(isogonicScroll("VeryLongAgentName"), true);
  assert.equal(isogonicScroll("Netherlands"), false);
  assert.equal(isogonicLane("US"), "stub");
  assert.equal(isogonicLane("10.1.1.1"), "digit");
  assert.equal(isogonicLane("Amsterdam"), "vowel");
  assert.equal(isogonicLane("Paris"), "path");
  assert.equal(isogonicPath("Paris"), true);
  assert.equal(isogonicOpen(""), true);
  assert.equal(isogonicOpen({ broker: "" }), true);
  assert.equal(isogonicState({ name: "Ada" }), "");
  assert.equal(isogonicState({ broker: "Paris", balance: 1 }), "");
  assert.equal(isogonicHue("HOUSE"), "champagne");
  assert.equal(isogonicHue("needs review"), "graphite");
  assert.equal(isogonicHue("Amsterdam"), "ivory");
  assert.equal(isogonicLength("hold"), 4);
  assert.equal(isogonicEven("hold"), true);
  assert.equal(isogonicFirst("Paris"), true);
  assert.equal(isogonicSpace("needs review"), true);
  assert.equal(isogonicVowel("Amsterdam"), true);
  assert.equal(isogonicDigit("Room4"), true);
  assert.equal(isogonicCapital("PARIS"), true);
  assert.equal(isogonicLower("paris"), true);
  assert.equal(isogonicUpper("RETENTION"), true);
  assert.equal(isogonicUpper("NET"), false);
  assert.equal(isogonicTail("Room4"), true);
  const marks: IsogonicRow[] = [
    { id: "1", label: "Ada", code: "HOUSE" },
    { id: "2", label: "Bea", code: "FLOOR" },
    { id: "3", label: "Cara", code: "Paris" },
  ];
  assert.equal(leadingIsogonic(marks), "house");
  assert.match(isogonicLanesCsv(marks), /house,2/);
  assert.match(isogonicRowsCsv(marks, ["1"]), /Ada,HOUSE/);
  assert.match(tourbillonTimeline(cards).map((lane) => lane.tooth).join(","), /11|5/);
  assert.equal(crmv4Text("tr", "trbTitle"), ROUND322_COPY.tr.trbTitle);
  assert.equal(crmv4Text("de", "isgTitle"), ROUND322_COPY.de.isgTitle);
  assert.equal(crmv4Text("ru", "cueSacrariumKicker"), ROUND322_COPY.ru.cueSacrariumKicker);
  assert.equal(crmv4Text("ar", "rgnFrigidariumLead"), ROUND322_COPY.ar.rgnFrigidariumLead);
  const keys = Object.keys(ROUND322_COPY.en).sort();
  assert.equal(new Set(keys).size, keys.length);
  for (const locale of ["tr", "de", "ru", "ar"] as const) assert.deepEqual(Object.keys(ROUND322_COPY[locale]).sort(), keys);

  const css = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/crmv4.css"), "utf8");
  assert.match(css, /\.c4-tourbillon/);
  assert.match(css, /\.c4-isogonic/);
  assert.match(css, /\.c4-tourbillon-column/);
  assert.match(css, /\.c4-isogonic-column/);
  assert.match(css, /\.c4-cue-sacrarium/);
  assert.match(css, /\.c4-region-frigidarium/);
  assert.match(css, /\.c4-cue-sacrarium-mast/);
  assert.match(css, /\.c4-region-frigidarium-mast/);
  assert.match(css, /data-logo/);
  assert.match(css, /#8a6a3b/);
  assert.match(css, /#c6a15b/);
  assert.match(css, /--chrome-pad:\s*10px/);
  assert.equal(css.includes("--chrome-pad: 8px"), false);
  assert.equal(css.includes("--chrome-pad: 12px"), false);
  assert.equal(css.includes("overflow-x: auto"), false);
  assert.equal(css.includes("overflow-x: scroll"), false);
  const viewFile = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round322.tsx"), "utf8");
  assert.equal(viewFile.includes("sendJson"), false);
  assert.equal(viewFile.includes("setInterval"), false);
  assert.equal(viewFile.includes("fetch("), false);
  assert.equal(viewFile.includes("amount"), false);
  assert.equal(viewFile.includes("profit"), false);
  assert.equal(viewFile.includes("volume"), false);
  assert.equal(viewFile.includes("currency"), false);
  assert.equal(viewFile.includes("balance"), false);
  assert.match(viewFile, /brokerName/);
  assert.match(viewFile, /tourbillonCsv/);
  assert.match(viewFile, /isogonicRowsCsv/);
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
  assert.match(viewFile, /c4-isogonic-search/);
  assert.match(viewFile, /tourbillonTimeline/);
  assert.match(viewFile, /aria-required=\{false\}/);
  const app = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/CrmV4App.tsx"), "utf8");
  assert.match(app, /view === "trb"/);
  assert.match(app, /view === "isg"/);
  const host = fs.readFileSync(path.join(__dirname, "../src/components/crmv4/round142.tsx"), "utf8");
  assert.match(host, /c4-cue-sacrarium/);
  assert.match(host, /c4-cue-sacrarium-mast/);
  assert.match(host, /data-logo="mono"/);
  assert.match(host, /cueSacrariumKicker/);
  assert.match(host, /cueSacrariumLead/);
  assert.match(host, /data-cue/);
  assert.equal(host.includes("amount"), false);
  assert.match(host, /c4-region-frigidarium/);
  assert.match(host, /c4-region-frigidarium-mast/);
  assert.match(host, /rgnFrigidariumKicker/);
  assert.match(host, /rgnFrigidariumLead/);
  assert.match(host, /data-region/);
  assert.equal(host.includes("currency"), false);
  assert.equal(host.includes("saleStatus"), false);
  const namedKeys = `${viewFile}\n${host}`.match(/"(trb|isg|cueSacrarium|rgnFrigidarium)[a-zA-Z0-9]+"/g)?.map((item) => item.slice(1, -1)) || [];
  for (const key of namedKeys) assert.equal(typeof ROUND322_COPY.en[key as keyof typeof ROUND322_COPY.en], "string", key);
  console.log("crmv4 round322 tests passed");
}

main();
